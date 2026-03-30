import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { WorkflowStage, TemplateSourceType } from '../../src/generated/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { workflowService } from '../services/workflow.service';
import { aiService } from '../services/ai.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { ebayService } from '../services/ebay.service';
import { computeCompleteness } from '../utils/completeness';
import { pushQueue } from '../queues/push.queue';

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const thumbDir = path.join(uploadDir, 'thumbnails');
[uploadDir, thumbDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'item-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for large phone photos
  fileFilter: (_req, file, cb) => {
    const allowedExt = /jpeg|jpg|png|gif|webp|heic|heif/;
    const allowedMime = /jpeg|jpg|png|gif|webp|heic|heif|octet-stream/;
    if (allowedExt.test(path.extname(file.originalname).toLowerCase()) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpg, png, webp, heic)'));
    }
  },
});

const router = Router();
router.use(authMiddleware);

// Helper: extract userId from auth token or fall back to first admin
async function resolveUserId(req: Request): Promise<string> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'dev-secret-change-in-production') as { userId: string };
      if (decoded.userId) return decoded.userId;
    } catch {}
  }
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  return admin?.id || 'unknown';
}

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get queue counts by stage
    const stageCounts = await prisma.item.groupBy({
      by: ['stage'],
      where: {
        status: 'ACTIVE',
        stage: {
          in: ['PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW']
        }
      },
      _count: { id: true }
    });

    const queueCounts = {
      identify: 0,  // PHOTO_UPLOAD + AI_PROCESSING
      review: 0,    // REVIEW_EDIT
      price: 0,     // PRICING
      ready: 0,     // FINAL_REVIEW
    };

    stageCounts.forEach(stage => {
      switch (stage.stage) {
        case 'PHOTO_UPLOAD':
        case 'AI_PROCESSING':
          queueCounts.identify += stage._count.id;
          break;
        case 'REVIEW_EDIT':
          queueCounts.review = stage._count.id;
          break;
        case 'PRICING':
          queueCounts.price = stage._count.id;
          break;
        case 'FINAL_REVIEW':
          queueCounts.ready = stage._count.id;
          break;
      }
    });

    const queueTotal = queueCounts.identify + queueCounts.review + queueCounts.price + queueCounts.ready;

    // Get total listed items (PUBLISHED stage)
    const totalListed = await prisma.item.count({
      where: { stage: 'PUBLISHED', status: 'ACTIVE' }
    });

    // Get sold items today from Listing model
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const soldTodayData = await prisma.listing.findMany({
      where: {
        soldAt: { gte: today },
        status: 'sold'
      },
      select: { soldPrice: true }
    });

    const soldToday = soldTodayData.length;
    const soldTodayValue = soldTodayData.reduce((sum, l) => sum + (l.soldPrice || 0), 0);

    // Get 30-day revenue
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await prisma.listing.aggregate({
      where: {
        soldAt: { gte: thirtyDaysAgo },
        status: 'sold'
      },
      _sum: { soldPrice: true }
    });

    const revenue30Days = revenueData._sum.soldPrice || 0;

    // Get items needing attention
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Stale items (in queue for > 24 hours)
    const staleItems = await prisma.item.count({
      where: {
        status: 'ACTIVE',
        stage: { in: ['PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW'] },
        updatedAt: { lt: twentyFourHoursAgo }
      }
    });

    // Items with low confidence (check aiAnalysis JSON)
    // For now, count items in REVIEW_EDIT with aiAnalysis containing low confidence
    const lowConfidenceItems = await prisma.item.count({
      where: {
        status: 'ACTIVE',
        stage: 'REVIEW_EDIT',
        // Items in review stage likely need attention
      }
    });

    // Items pending sync (FINAL_REVIEW stage, ready to publish)
    const pendingSync = await prisma.item.count({
      where: {
        status: 'ACTIVE',
        stage: 'FINAL_REVIEW'
      }
    });

    res.json({
      success: true,
      data: {
        queueTotal,
        queueCounts,
        totalListed,
        soldToday,
        soldTodayValue,
        revenue30Days,
        needsAttention: {
          lowConfidence: Math.min(lowConfidenceItems, 3), // Estimate
          stale: staleItems,
          pendingSync,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/activity - Get recent activity
router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get recent workflow actions
    const recentActions = await prisma.workflowAction.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        item: {
          select: { title: true, startingPrice: true, buyNowPrice: true }
        },
        user: {
          select: { name: true }
        }
      }
    });

    // Transform to activity format
    const activities = recentActions.map(action => {
      const time = action.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      let actionText = action.action;
      switch (action.action) {
        case 'approve':
        case 'advance':
          actionText = `Moved to ${action.toStage.replace('_', ' ')}`;
          break;
        case 'reject':
          actionText = 'Rejected';
          break;
        case 'import_from_ebay':
          actionText = 'Imported from eBay';
          break;
        case 'edit':
          actionText = 'Edited';
          break;
      }

      return {
        time,
        action: actionText,
        item: action.item?.title || null,
        price: action.item?.buyNowPrice || action.item?.startingPrice || null,
        user: action.user?.name || 'System',
      };
    });

    // If no activities, add a session started entry
    if (activities.length === 0) {
      activities.push({
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        action: 'Session started',
        item: null,
        price: null,
        user: 'System',
      });
    }

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent activity' });
  }
});

// GET /api/dashboard/queue - Get all queue items grouped by stage
router.get('/queue', async (req, res) => {
  try {
    // Get items for each queue stage
    const [identifyItems, reviewItems, priceItems, readyItems, publishedItems] = await Promise.all([
      // Identify = PHOTO_UPLOAD + AI_PROCESSING
      prisma.item.findMany({
        where: {
          status: 'ACTIVE',
          stage: { in: ['PHOTO_UPLOAD', 'AI_PROCESSING'] }
        },
        select: {
          id: true,
          title: true,
          aiAnalysis: true,
          photos: { select: { thumbnailPath: true }, take: 1, orderBy: { isPrimary: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      // Review = REVIEW_EDIT
      prisma.item.findMany({
        where: { status: 'ACTIVE', stage: 'REVIEW_EDIT' },
        select: {
          id: true,
          title: true,
          aiAnalysis: true,
          photos: { select: { thumbnailPath: true }, take: 1, orderBy: { isPrimary: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      // Price = PRICING
      prisma.item.findMany({
        where: { status: 'ACTIVE', stage: 'PRICING' },
        select: {
          id: true,
          title: true,
          startingPrice: true,
          buyNowPrice: true,
          photos: { select: { thumbnailPath: true }, take: 1, orderBy: { isPrimary: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      // Ready = FINAL_REVIEW
      prisma.item.findMany({
        where: { status: 'ACTIVE', stage: 'FINAL_REVIEW' },
        select: {
          id: true,
          title: true,
          startingPrice: true,
          buyNowPrice: true,
          photos: { select: { thumbnailPath: true }, take: 1, orderBy: { isPrimary: 'desc' } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      // Published = PUBLISHED
      prisma.item.findMany({
        where: { status: 'ACTIVE', stage: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          startingPrice: true,
          buyNowPrice: true,
          ebayId: true,
          photos: { select: { thumbnailPath: true }, take: 1, orderBy: { isPrimary: 'desc' } }
        },
        orderBy: { publishedAt: 'desc' },
        take: 50
      }),
    ]);

    // Transform to queue format
    const ensureLeadingSlash = (p: string | null | undefined) => p ? (p.startsWith('/') ? p : `/${p}`) : null;
    const transformItem = (item: { id: string; title: string | null; photos?: { thumbnailPath: string | null }[]; aiAnalysis?: unknown; buyNowPrice?: number | null; startingPrice?: number | null }, step: string) => ({
      id: item.id,
      title: item.title || 'Untitled Item',
      thumbnail: ensureLeadingSlash(item.photos?.[0]?.thumbnailPath),
      confidence: (item.aiAnalysis as Record<string, unknown>)?.confidence || undefined,
      price: item.buyNowPrice || item.startingPrice || undefined,
      step,
    });

    res.json({
      success: true,
      data: {
        identify: identifyItems.map(i => transformItem(i, 'identify')),
        review: reviewItems.map(i => transformItem(i, 'review')),
        price: priceItems.map(i => transformItem(i, 'price')),
        ready: readyItems.map(i => transformItem(i, 'ready')),
        published: publishedItems.map(i => transformItem(i, 'published')),
      },
      counts: {
        identify: identifyItems.length,
        review: reviewItems.length,
        price: priceItems.length,
        ready: readyItems.length,
        published: publishedItems.length,
      }
    });
  } catch (error) {
    console.error('Error fetching queue items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queue items' });
  }
});

// GET /api/dashboard/reports - Get analytics data for reports page
router.get('/reports', async (req, res) => {
  try {
    const { range = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    // Get sold listings in date range
    const soldListings = await prisma.listing.findMany({
      where: {
        status: 'sold',
        soldAt: { gte: startDate }
      },
      select: {
        soldPrice: true,
        price: true,
        soldAt: true,
        category: true
      }
    });

    // Calculate metrics
    const totalRevenue = soldListings.reduce((sum, l) => sum + (l.soldPrice || l.price), 0);
    const itemsSold = soldListings.length;
    const avgSalePrice = itemsSold > 0 ? totalRevenue / itemsSold : 0;

    // Get active listings count
    const activeListings = await prisma.listing.count({
      where: { status: 'active' }
    });

    // Get previous period for comparison
    const prevStart = new Date(startDate);
    const daysDiff = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    prevStart.setDate(prevStart.getDate() - daysDiff);

    const prevSoldListings = await prisma.listing.findMany({
      where: {
        status: 'sold',
        soldAt: { gte: prevStart, lt: startDate }
      },
      select: { soldPrice: true, price: true }
    });

    const prevRevenue = prevSoldListings.reduce((sum, l) => sum + (l.soldPrice || l.price), 0);
    const prevItemsSold = prevSoldListings.length;
    const prevAvgSalePrice = prevItemsSold > 0 ? prevRevenue / prevItemsSold : 0;

    // Calculate percentage changes
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const itemsChange = prevItemsSold > 0 ? ((itemsSold - prevItemsSold) / prevItemsSold) * 100 : 0;
    const avgPriceChange = prevAvgSalePrice > 0 ? ((avgSalePrice - prevAvgSalePrice) / prevAvgSalePrice) * 100 : 0;

    // Calculate daily sales for chart
    const salesByDay: { date: string; sales: number; revenue: number }[] = [];
    const dayCount = Math.min(daysDiff, 7); // Show last 7 days max
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const daySales = soldListings.filter(l =>
        l.soldAt && l.soldAt >= dayStart && l.soldAt <= dayEnd
      );

      salesByDay.push({
        date: `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`,
        sales: daySales.length,
        revenue: daySales.reduce((sum, l) => sum + (l.soldPrice || l.price), 0)
      });
    }

    // Calculate top categories
    const categoryMap = new Map<string, { sales: number; revenue: number }>();
    soldListings.forEach(l => {
      const cat = l.category || 'Uncategorized';
      const existing = categoryMap.get(cat) || { sales: 0, revenue: 0 };
      categoryMap.set(cat, {
        sales: existing.sales + 1,
        revenue: existing.revenue + (l.soldPrice || l.price)
      });
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get user performance (from workflow actions)
    const userActions = await prisma.workflowAction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        action: { in: ['approve', 'advance'] }
      },
      _count: { id: true }
    });

    const userIds = userActions.map(a => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const topSellers = userActions
      .map(action => {
        const user = users.find(u => u.id === action.userId);
        return {
          name: user?.name || 'Unknown',
          itemsSold: action._count.id,
          revenue: action._count.id * avgSalePrice // Estimate based on avg price
        };
      })
      .sort((a, b) => b.itemsSold - a.itemsSold)
      .slice(0, 5);

    // Calculate sell-through rate
    const totalListedInPeriod = await prisma.listing.count({
      where: { listedAt: { gte: startDate } }
    });
    const sellThroughRate = totalListedInPeriod > 0 ? (itemsSold / totalListedInPeriod) * 100 : 0;

    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          itemsSold,
          avgSalePrice,
          activeListings,
          revenueChange: Math.round(revenueChange * 10) / 10,
          itemsChange: Math.round(itemsChange * 10) / 10,
          avgPriceChange: Math.round(avgPriceChange * 10) / 10
        },
        salesByDay,
        topCategories,
        topSellers,
        summary: {
          totalRevenue,
          itemsSold,
          sellThroughRate: Math.round(sellThroughRate)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports data' });
  }
});

// GET /api/dashboard/item/:id - Get a single item by ID
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        location: { select: { name: true, code: true } },
        photos: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
        },
        createdBy: { select: { name: true } },
        workflowActions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Parse AI analysis
    const aiAnalysis = (item.aiAnalysis as Record<string, unknown>) || {};

    // Format item specifics from AI analysis or features
    const itemSpecifics = [];
    if (item.brand) itemSpecifics.push({ name: 'Brand', value: item.brand });
    if (aiAnalysis.model) itemSpecifics.push({ name: 'Model', value: aiAnalysis.model });
    if (aiAnalysis.specifics) {
      Object.entries(aiAnalysis.specifics).forEach(([name, value]) => {
        itemSpecifics.push({ name, value: String(value) });
      });
    }

    const formattedItem = {
      id: item.id,
      displayId: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
      currentStep: item.stage,
      title: item.title || 'Untitled Item',
      category: item.category || 'Uncategorized',
      categoryId: aiAnalysis.categoryId || null,
      condition: item.condition || 'Used',
      conditionId: aiAnalysis.conditionId || 3000,
      brand: item.brand || '',
      model: aiAnalysis.model || '',
      itemSpecifics,
      description: item.description || '',
      aiAnalysis: {
        confidence: aiAnalysis.confidence || 0,
        model: aiAnalysis.modelUsed || 'claude-sonnet',
        justification: aiAnalysis.rawAnalysis || aiAnalysis.justification || 'No AI analysis available',
      },
      suggestedPrice: item.buyNowPrice || item.startingPrice || 0,
      photos: item.photos.map(p => {
        const rawPath = p.editedPath || p.thumbnailPath || p.originalPath;
        return {
          id: p.id,
          url: rawPath?.startsWith('/') ? rawPath : `/${rawPath}`,
          fullUrl: (() => {
            const full = p.editedPath || p.optimizedPath || p.originalPath;
            return full?.startsWith('/') ? full : `/${full}`;
          })(),
          isPrimary: p.isPrimary,
          order: p.order
        };
      }),
      location: item.location?.name || 'Unassigned',
      locationCode: item.location?.code || '',
      createdBy: item.createdBy?.name || 'Unknown',
      aiCost: item.aiCost || 0,
      // Pricing/Shipping/Listing fields
      startingPrice: item.startingPrice || 0,
      buyNowPrice: item.buyNowPrice || 0,
      shippingCost: item.shippingCost || 0,
      shippingService: item.shippingService || 'USPSPriority',
      shippingType: item.shippingType || 'Flat',
      weight: item.weight || null,
      packageDimensions: item.packageDimensions || null,
      handlingTime: item.handlingTime || 3,
      listingFormat: item.listingFormat || 'FixedPrice',
      listingDuration: item.listingDuration || 'GTC',
      returnPolicy: item.returnPolicy || null,
      quantity: item.quantity || 1,
      postalCode: item.postalCode || '',
      aiPriceSuggestion: item.aiPriceSuggestion || null,
      upc: item.upc || '',
      isbn: item.isbn || '',
      ebayCategoryId: item.ebayCategoryId || '',
      ebayId: item.ebayId || null,
      shippingProfileId: (item as any).shippingProfileId || null,
      returnProfileId: (item as any).returnProfileId || null,
      contextNotes: item.contextNotes || null,
      aiJournal: item.aiJournal || [],
      completeness: computeCompleteness(item),
      publishedAt: item.publishedAt?.toISOString() || null,
      exportedAt: item.exportedAt?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      history: item.workflowActions.map(action => ({
        action: action.action,
        fromStage: action.fromStage,
        toStage: action.toStage,
        notes: action.notes,
        user: action.user?.name || 'System',
        date: action.createdAt.toISOString()
      }))
    };

    res.json({
      success: true,
      data: formattedItem
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

// PUT /api/dashboard/item/:id - Update item fields
router.put('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      condition,
      brand,
      itemSpecifics,
      startingPrice,
      buyNowPrice,
      shippingCost,
      shippingService,
      shippingType,
      weight,
      packageDimensions,
      handlingTime,
      listingFormat,
      listingDuration,
      returnPolicy,
      quantity,
      postalCode,
      upc,
      isbn,
      ebayCategoryId,
      ebayId,
      shippingProfileId,
      returnProfileId,
      contextNotes
    } = req.body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (condition !== undefined) updateData.condition = condition;
    if (brand !== undefined) updateData.brand = brand;
    if (startingPrice !== undefined) updateData.startingPrice = startingPrice;
    if (buyNowPrice !== undefined) updateData.buyNowPrice = buyNowPrice;
    if (shippingCost !== undefined) updateData.shippingCost = shippingCost;
    if (shippingService !== undefined) updateData.shippingService = shippingService;
    if (shippingType !== undefined) updateData.shippingType = shippingType;
    if (weight !== undefined) updateData.weight = weight;
    if (packageDimensions !== undefined) updateData.packageDimensions = packageDimensions;
    if (handlingTime !== undefined) updateData.handlingTime = handlingTime;
    if (listingFormat !== undefined) updateData.listingFormat = listingFormat;
    if (listingDuration !== undefined) updateData.listingDuration = listingDuration;
    if (returnPolicy !== undefined) updateData.returnPolicy = returnPolicy;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (postalCode !== undefined) updateData.postalCode = postalCode;
    if (upc !== undefined) updateData.upc = upc;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (ebayCategoryId !== undefined) updateData.ebayCategoryId = ebayCategoryId;
    if (ebayId !== undefined) updateData.ebayId = ebayId;
    if (shippingProfileId !== undefined) updateData.shippingProfileId = shippingProfileId;
    if (returnProfileId !== undefined) updateData.returnProfileId = returnProfileId;
    if (contextNotes !== undefined) updateData.contextNotes = contextNotes;

    // Store item specifics in aiAnalysis JSON
    if (itemSpecifics !== undefined) {
      const existingItem = await prisma.item.findUnique({
        where: { id },
        select: { aiAnalysis: true }
      });
      const existingAnalysis = (existingItem?.aiAnalysis as Record<string, unknown>) || {};
      updateData.aiAnalysis = {
        ...existingAnalysis,
        specifics: itemSpecifics.reduce((acc: Record<string, string>, spec: { name: string; value: string }) => {
          acc[spec.name] = spec.value;
          return acc;
        }, {} as Record<string, string>)
      };
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: { photos: { select: { id: true } } }
    });

    // Recompute and cache completeness
    const completeness = computeCompleteness(item);
    await prisma.item.update({
      where: { id },
      data: { completeness: completeness as any }
    });

    res.json({
      success: true,
      data: { ...item, completeness },
      message: 'Item updated successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// POST /api/dashboard/item/:id/photos - Upload photos directly to an existing item
router.post('/item/:id/photos', upload.array('photos', 20), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Get current max order
    const maxOrder = await prisma.photo.aggregate({
      where: { itemId: id },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    const createdPhotos = [];

    for (const file of files) {
      const thumbFilename = 'thumb-' + path.basename(file.filename);
      const thumbPath = path.join(thumbDir, thumbFilename);

      let thumbGenerated = false;
      try {
        await sharp(file.path)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toFile(thumbPath);
        thumbGenerated = true;
      } catch {
        // Continue without thumbnail
      }

      const photo = await prisma.photo.create({
        data: {
          itemId: id,
          originalPath: `uploads/${file.filename}`,
          thumbnailPath: thumbGenerated ? `uploads/thumbnails/${thumbFilename}` : null,
          isPrimary: false,
          order: nextOrder++,
        },
      });

      createdPhotos.push(photo);
    }

    res.json({ success: true, data: createdPhotos });
  } catch (error) {
    console.error('Item photo upload error:', error);
    res.status(500).json({ success: false, error: 'Failed to upload photos' });
  }
});

// PATCH /api/dashboard/item/:id/photos/reorder - Reorder photos
router.patch('/item/:id/photos/reorder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ success: false, error: 'photoIds must be a non-empty array' });
    }

    // Verify all photos belong to this item
    const photos = await prisma.photo.findMany({
      where: { itemId: id },
      select: { id: true }
    });
    const itemPhotoIds = new Set(photos.map(p => p.id));
    for (const pid of photoIds) {
      if (!itemPhotoIds.has(pid)) {
        return res.status(400).json({ success: false, error: `Photo ${pid} does not belong to this item` });
      }
    }

    // Update order in a transaction
    await prisma.$transaction(
      photoIds.map((photoId: string, index: number) =>
        prisma.photo.update({
          where: { id: photoId },
          data: { order: index }
        })
      )
    );

    const updatedPhotos = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
    });

    res.json({ success: true, data: updatedPhotos });
  } catch (error) {
    console.error('Error reordering photos:', error);
    res.status(500).json({ success: false, error: 'Failed to reorder photos' });
  }
});

// PATCH /api/dashboard/item/:id/photos/:photoId/primary - Set primary photo
router.patch('/item/:id/photos/:photoId/primary', async (req: Request, res: Response) => {
  try {
    const { id, photoId } = req.params;

    // Verify photo belongs to item
    const photo = await prisma.photo.findFirst({
      where: { id: photoId, itemId: id }
    });
    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    await prisma.$transaction([
      prisma.photo.updateMany({
        where: { itemId: id },
        data: { isPrimary: false }
      }),
      prisma.photo.update({
        where: { id: photoId },
        data: { isPrimary: true }
      })
    ]);

    const updatedPhotos = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
    });

    res.json({ success: true, data: updatedPhotos });
  } catch (error) {
    console.error('Error setting primary photo:', error);
    res.status(500).json({ success: false, error: 'Failed to set primary photo' });
  }
});

// DELETE /api/dashboard/item/:id/photos/:photoId - Delete a photo
router.delete('/item/:id/photos/:photoId', async (req: Request, res: Response) => {
  try {
    const { id, photoId } = req.params;

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, itemId: id }
    });
    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    const wasPrimary = photo.isPrimary;

    // Delete files from disk
    const filePaths = [photo.originalPath, photo.thumbnailPath, photo.optimizedPath, photo.editedPath].filter(Boolean);
    for (const filePath of filePaths) {
      try {
        const fullPath = path.resolve(filePath!);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch { /* ignore file delete errors */ }
    }

    // Delete photo record
    await prisma.photo.delete({ where: { id: photoId } });

    // Reorder remaining photos to close gaps
    const remaining = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: { order: 'asc' }
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((p, i) => prisma.photo.update({
          where: { id: p.id },
          data: {
            order: i,
            // Auto-promote first photo if deleted was primary
            isPrimary: wasPrimary && i === 0 ? true : p.isPrimary
          }
        }))
      );
    }

    const updatedPhotos = await prisma.photo.findMany({
      where: { itemId: id },
      orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }]
    });

    res.json({ success: true, data: updatedPhotos });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ success: false, error: 'Failed to delete photo' });
  }
});

// POST /api/dashboard/item/:id/photos/:photoId/edit - Apply edits to a photo
router.post('/item/:id/photos/:photoId/edit', async (req: Request, res: Response) => {
  try {
    const { id, photoId } = req.params;
    const { crop, brightness, contrast, rotation, maxSize } = req.body;

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, itemId: id }
    });
    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found' });
    }

    // Use optimized or original as source
    const sourcePath = photo.optimizedPath || photo.originalPath;
    const fullSourcePath = path.resolve(sourcePath);
    if (!fs.existsSync(fullSourcePath)) {
      return res.status(400).json({ success: false, error: 'Source image file not found' });
    }

    // Get actual image dimensions
    const metadata = await sharp(fullSourcePath).metadata();
    const imgWidth = metadata.width || 0;
    const imgHeight = metadata.height || 0;

    // Build sharp pipeline
    // Order: crop → rotate → brightness → contrast
    // react-easy-crop returns coordinates in the ORIGINAL (unrotated) image's pixel space
    let pipeline = sharp(fullSourcePath);

    // 1. Crop (extract) first - coordinates are in original image space
    if (crop && crop.width > 0 && crop.height > 0) {
      const left = Math.max(0, Math.min(Math.round(crop.x), imgWidth - 1));
      const top = Math.max(0, Math.min(Math.round(crop.y), imgHeight - 1));
      const width = Math.min(Math.round(crop.width), imgWidth - left);
      const height = Math.min(Math.round(crop.height), imgHeight - top);

      // Only apply crop if it's actually cropping (not the full image)
      const isFullImage = left === 0 && top === 0 && width >= imgWidth - 1 && height >= imgHeight - 1;
      if (!isFullImage && width > 0 && height > 0) {
        pipeline = pipeline.extract({ left, top, width, height });
      }
    }

    // 2. Rotate after crop
    if (rotation && rotation !== 0) {
      pipeline = pipeline.rotate(rotation);
    }

    // 3. Brightness
    if (brightness !== undefined && brightness !== 1.0) {
      pipeline = pipeline.modulate({ brightness });
    }

    // 4. Contrast
    if (contrast !== undefined && contrast !== 1.0) {
      pipeline = pipeline.linear(contrast, 128 * (1 - contrast));
    }

    // 5. Resize to max dimensions and output as JPEG
    const resizeMax = (maxSize && maxSize > 0) ? maxSize : 1600;
    pipeline = pipeline
      .resize(resizeMax, resizeMax, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 });

    // Save edited file
    const editedFilename = `edited-${photoId}-${Date.now()}.jpg`;
    const editedDir = path.join(__dirname, '../../uploads/edited');
    if (!fs.existsSync(editedDir)) fs.mkdirSync(editedDir, { recursive: true });
    const editedPath = path.join(editedDir, editedFilename);
    await pipeline.toFile(editedPath);

    // Regenerate thumbnail from edited file
    const thumbFilename = `thumb-edited-${photoId}-${Date.now()}.jpg`;
    const thumbPath = path.join(thumbDir, thumbFilename);
    await sharp(editedPath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    // Delete old edited file if one existed
    if (photo.editedPath) {
      try {
        const oldEditedPath = path.resolve(photo.editedPath);
        if (fs.existsSync(oldEditedPath)) fs.unlinkSync(oldEditedPath);
      } catch { /* ignore */ }
    }

    // Update photo record
    const updatedPhoto = await prisma.photo.update({
      where: { id: photoId },
      data: {
        editedPath: `uploads/edited/${editedFilename}`,
        thumbnailPath: `uploads/thumbnails/${thumbFilename}`
      }
    });

    res.json({ success: true, data: updatedPhoto });
  } catch (error) {
    console.error('Error editing photo:', error);
    res.status(500).json({ success: false, error: 'Failed to edit photo' });
  }
});

// POST /api/dashboard/item/:id/advance - Advance item to next workflow stage
router.post('/item/:id/advance', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = await resolveUserId(req);

    const item = await prisma.item.findUnique({
      where: { id },
      select: { stage: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const stageOrder = [
      'PHOTO_UPLOAD',
      'AI_PROCESSING',
      'REVIEW_EDIT',
      'PRICING',
      'FINAL_REVIEW',
      'PUBLISHED'
    ];

    let nextStage: string;
    const currentIndex = stageOrder.indexOf(item.stage);

    if (item.stage === 'REJECTED') {
      // Rejected items go back to REVIEW_EDIT
      nextStage = 'REVIEW_EDIT';
    } else if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
      return res.status(400).json({
        success: false,
        error: 'Cannot advance item - already at final stage or invalid stage'
      });
    } else {
      nextStage = stageOrder[currentIndex + 1] as string;
    }

    // Block direct advance to PUBLISHED — must use CSV export or eBay push
    if (nextStage === 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot advance directly to PUBLISHED. Use "Export CSV" or "Push to eBay" instead.'
      });
    }

    const [updatedItem] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { stage: nextStage as 'PHOTO_UPLOAD' | 'AI_PROCESSING' | 'REVIEW_EDIT' | 'PRICING' | 'FINAL_REVIEW' | 'PUBLISHED' }
      }),
      prisma.workflowAction.create({
        data: {
          itemId: id,
          userId,
          fromStage: item.stage,
          toStage: nextStage as 'PHOTO_UPLOAD' | 'AI_PROCESSING' | 'REVIEW_EDIT' | 'PRICING' | 'FINAL_REVIEW' | 'PUBLISHED',
          action: 'advance',
          notes: notes || null
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        stage: updatedItem.stage
      },
      message: `Item advanced to ${nextStage}`
    });
  } catch (error) {
    console.error('Error advancing item:', error);
    res.status(500).json({ success: false, error: 'Failed to advance item' });
  }
});

// POST /api/dashboard/item/:id/set-stage - Move item to any stage
router.post('/item/:id/set-stage', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    const userId = await resolveUserId(req);

    const validStages = ['PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW', 'PUBLISHED', 'REJECTED'];
    if (!stage || !validStages.includes(stage)) {
      return res.status(400).json({ success: false, error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    const item = await prisma.item.findUnique({ where: { id }, select: { stage: true, ebayId: true } });
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Block stage changes on items already listed on eBay
    if (item.ebayId) {
      return res.status(400).json({ success: false, error: 'Cannot change stage on an item that is listed on eBay. End the listing first.' });
    }

    const newStatus = stage === 'REJECTED' ? 'PAUSED' : 'ACTIVE';

    const [updatedItem] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { stage: stage as any, status: newStatus as any }
      }),
      prisma.workflowAction.create({
        data: {
          itemId: id,
          userId,
          fromStage: item.stage,
          toStage: stage as any,
          action: 'set_stage',
          notes: notes || `Moved from ${item.stage} to ${stage}`
        }
      })
    ]);

    res.json({
      success: true,
      data: { id: updatedItem.id, stage: updatedItem.stage, status: updatedItem.status },
      message: `Item moved to ${stage}`
    });
  } catch (error) {
    console.error('Error setting item stage:', error);
    res.status(500).json({ success: false, error: 'Failed to set item stage' });
  }
});

// GET /api/dashboard/items/search - Search items by title, SKU, or category
router.get('/items/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const items = await prisma.item.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        sku: true,
        title: true,
        description: true,
        category: true,
        condition: true,
        startingPrice: true,
        buyNowPrice: true,
        photos: {
          select: { id: true, thumbnailPath: true, optimizedPath: true, originalPath: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: Math.min(parseInt(req.query.limit as string) || 20, 100),
    });

    const results = items.map(item => ({
      ...item,
      displayId: item.sku?.split('-')[1] || item.id.slice(-6),
      photos: item.photos.map((p: any) => ({
        id: p.id,
        url: p.thumbnailPath || p.optimizedPath || p.originalPath || '',
      })),
    }));

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// POST /api/dashboard/item/:id/clone - Clone an item as a new listing
router.post('/item/:id/clone', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, price, condition } = req.body;
    const userId = await resolveUserId(req);

    const source = await prisma.item.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { order: 'asc' } },
        location: true,
      },
    });

    if (!source) {
      return res.status(404).json({ success: false, error: 'Source item not found' });
    }

    // Generate new SKU
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `LF-${timestamp}-${random}`;

    // Clone the item with overrides
    const cloned = await prisma.item.create({
      data: {
        sku,
        stage: 'REVIEW_EDIT',
        status: 'ACTIVE',
        locationId: source.locationId,
        createdById: userId,
        title: title || source.title,
        description: description || source.description,
        category: source.category,
        ebayCategoryId: source.ebayCategoryId,
        condition: condition || source.condition,
        brand: source.brand,
        features: source.features || [],
        keywords: source.keywords || [],
        upc: source.upc,
        isbn: source.isbn,
        startingPrice: price ? parseFloat(price) : source.startingPrice,
        buyNowPrice: source.buyNowPrice,
        shippingCost: source.shippingCost,
        shippingService: source.shippingService,
        shippingType: source.shippingType,
        weight: source.weight,
        packageDimensions: source.packageDimensions as any || undefined,
        handlingTime: source.handlingTime,
        listingFormat: source.listingFormat,
        listingDuration: source.listingDuration,
        returnPolicy: source.returnPolicy as any || undefined,
        quantity: source.quantity,
        postalCode: source.postalCode,
        aiAnalysis: {
          source: 'clone',
          sourceItemId: source.id,
          sourceSku: source.sku,
          clonedAt: new Date().toISOString(),
          ...(source.aiAnalysis as Record<string, unknown> || {}),
        },
        aiPriceSuggestion: source.aiPriceSuggestion as any || undefined,
      },
    });

    // Clone photos — copy file references (not files themselves)
    if (source.photos.length > 0) {
      await prisma.photo.createMany({
        data: source.photos.map((photo, idx) => ({
          itemId: cloned.id,
          originalPath: photo.originalPath,
          optimizedPath: photo.optimizedPath,
          editedPath: photo.editedPath,
          thumbnailPath: photo.thumbnailPath,
          publicUrl: photo.publicUrl,
          isPrimary: photo.isPrimary,
          order: idx,
        })),
      });
    }

    // Create workflow action
    await prisma.workflowAction.create({
      data: {
        itemId: cloned.id,
        userId,
        fromStage: 'PHOTO_UPLOAD',
        toStage: 'REVIEW_EDIT',
        action: 'clone',
        notes: `Cloned from ${source.sku}`,
        changes: { sourceItemId: source.id, sourceSku: source.sku },
      },
    });

    res.json({
      success: true,
      data: { id: cloned.id, sku: cloned.sku, title: cloned.title, stage: cloned.stage },
      message: `Cloned from ${source.sku}`,
    });
  } catch (error) {
    console.error('Error cloning item:', error);
    res.status(500).json({ success: false, error: 'Failed to clone item' });
  }
});

// POST /api/dashboard/item/:id/lookup-category - Find eBay category from item title
router.post('/item/:id/lookup-category', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await prisma.item.findUnique({ where: { id }, select: { title: true, category: true } });
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    const query = item.title || item.category || '';
    if (!query) return res.status(400).json({ success: false, error: 'Item has no title to search with' });

    const suggestions = await ebayService.getCategories(query);
    if (!suggestions || suggestions.length === 0) {
      return res.json({ success: false, error: 'No matching eBay categories found' });
    }

    // Extract category ID from first suggestion
    const cat = suggestions[0];
    const categoryId = String(cat.CategoryID || cat.Category?.CategoryID || '');
    const categoryName = cat.CategoryName || cat.Category?.CategoryName || '';

    if (categoryId && /^\d+$/.test(categoryId)) {
      // Also fetch required specifics for this category
      let requiredSpecifics: { name: string; values?: string[] }[] = [];
      try {
        const catSpecifics = await ebayService.getCategorySpecifics(categoryId);
        requiredSpecifics = catSpecifics.required;
      } catch { /* non-fatal */ }

      // Auto-fill required specifics using AI
      let filledSpecifics: { name: string; value: string }[] = [];
      if (requiredSpecifics.length > 0) {
        try {
          // Load full item for context
          const fullItem = await prisma.item.findUnique({
            where: { id },
            select: { title: true, description: true, brand: true, aiAnalysis: true }
          });
          const aiData = (fullItem?.aiAnalysis as Record<string, unknown>) || {};
          const existingSpecifics = (aiData.specifics as Record<string, string>) || {};

          // Filter out specifics we already have
          const missing = requiredSpecifics.filter(r => {
            const lowerName = r.name.toLowerCase();
            // Check if we already have this specific
            if (lowerName === 'brand' && fullItem?.brand) return false;
            if (existingSpecifics[r.name]) return false;
            return true;
          });

          if (missing.length > 0) {
            const result = await aiService.fillItemSpecifics(
              fullItem?.title || '',
              fullItem?.description || '',
              fullItem?.brand || '',
              String(aiData.model || ''),
              categoryName || '',
              missing
            );
            filledSpecifics = result.specifics;

            // Merge filled specifics into existing aiAnalysis.specifics
            if (filledSpecifics.length > 0) {
              const mergedSpecifics = { ...existingSpecifics };
              for (const s of filledSpecifics) {
                mergedSpecifics[s.name] = s.value;
              }
              await prisma.item.update({
                where: { id },
                data: {
                  ebayCategoryId: categoryId,
                  aiAnalysis: { ...aiData, specifics: mergedSpecifics },
                  aiCost: { increment: result.cost },
                },
              });
            } else {
              await prisma.item.update({ where: { id }, data: { ebayCategoryId: categoryId } });
            }
          } else {
            await prisma.item.update({ where: { id }, data: { ebayCategoryId: categoryId } });
          }
        } catch (fillErr) {
          console.warn('Auto-fill specifics failed:', (fillErr as Error).message);
          await prisma.item.update({ where: { id }, data: { ebayCategoryId: categoryId } });
        }
      } else {
        await prisma.item.update({ where: { id }, data: { ebayCategoryId: categoryId } });
      }

      return res.json({
        success: true,
        data: {
          categoryId,
          categoryName,
          allSuggestions: suggestions.slice(0, 5),
          requiredSpecifics,
          filledSpecifics,
        },
        message: `Category set to ${categoryId} (${categoryName})${filledSpecifics.length > 0 ? ` — auto-filled ${filledSpecifics.length} specifics` : ''}`,
      });
    }

    res.json({ success: false, error: 'Could not determine numeric category ID', suggestions });
  } catch (error) {
    console.error('Category lookup error:', error);
    res.status(500).json({ success: false, error: 'Category lookup failed' });
  }
});

// GET /api/dashboard/category/:categoryId/specifics - Fetch required/recommended specifics for eBay category
router.get('/category/:categoryId/specifics', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    if (!/^\d+$/.test(categoryId)) {
      return res.status(400).json({ success: false, error: 'Invalid category ID' });
    }
    const specifics = await ebayService.getCategorySpecifics(categoryId);
    res.json({ success: true, data: specifics });
  } catch (error: any) {
    console.error('Category specifics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch category specifics' });
  }
});

// POST /api/dashboard/item/:id/reprocess-ai - Re-run AI analysis
router.post('/item/:id/reprocess-ai', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { orderBy: [{ isPrimary: 'desc' as const }, { order: 'asc' as const }] } }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (item.photos.length === 0) {
      return res.status(400).json({ success: false, error: 'Item has no photos to analyze' });
    }

    // Run AI processing
    await workflowService.processWithAI(item.id);

    // Reload item to get updated data
    const updated = await prisma.item.findUnique({ where: { id }, select: { title: true, description: true, aiAnalysis: true } });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('AI reprocess error:', error);
    res.status(500).json({ success: false, error: error.message || 'AI processing failed' });
  }
});

// POST /api/dashboard/item/:id/reanalyze - Re-analyze selected photos with a correction prompt
router.post('/item/:id/reanalyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { photoIds, prompt } = req.body as { photoIds?: string[]; prompt: string };

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'A correction prompt is required' });
    }

    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { orderBy: [{ isPrimary: 'desc' as const }, { order: 'asc' as const }] } }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Select photos: use specified photoIds, or all photos if none specified
    const selectedPhotos = photoIds && photoIds.length > 0
      ? item.photos.filter(p => photoIds.includes(p.id))
      : item.photos;

    if (selectedPhotos.length === 0) {
      return res.status(400).json({ success: false, error: 'No matching photos found' });
    }

    // Build existing analysis from item data
    const existingAnalysis = {
      itemType: item.title || 'Unknown',
      brand: item.brand || 'Unknown',
      condition: item.condition || 'Used',
      features: item.features || [],
      category: item.category || 'General',
      estimatedValue: '',
      rawAnalysis: (item.aiAnalysis as any)?.rawAnalysis || '',
      model: (item.aiAnalysis as any)?.model
    };

    const photoPaths = selectedPhotos.map(p => p.originalPath);
    const { analysis, cost } = await aiService.reanalyzeWithPrompt(photoPaths, prompt.trim(), existingAnalysis);

    // Generate updated listing from corrected analysis
    const { listing, cost: listingCost } = await aiService.generateListing({
      imageAnalysis: analysis,
      category: item.category ?? undefined,
      condition: item.condition ?? undefined
    });

    const totalCost = cost + listingCost;
    const analysisJson: any = JSON.parse(JSON.stringify(analysis));

    // Update item with corrected AI results
    const updateData: Record<string, unknown> = {
      title: listing.title,
      description: listing.description,
      category: analysis.category || item.category,
      condition: analysis.condition || item.condition,
      brand: analysis.brand,
      features: analysis.features || [],
      keywords: listing.tags || [],
      aiAnalysis: analysisJson,
      aiCost: { increment: totalCost },
    };
    // Persist UPC/ISBN if AI detected them
    if (analysis.upc) updateData.upc = analysis.upc;
    if (analysis.isbn) updateData.isbn = analysis.isbn;

    await prisma.item.update({
      where: { id },
      data: updateData,
    });

    const updated = await prisma.item.findUnique({
      where: { id },
      select: { title: true, description: true, aiAnalysis: true, aiCost: true }
    });

    res.json({ success: true, data: updated, cost: totalCost });
  } catch (error: any) {
    console.error('AI reanalyze error:', error);
    res.status(500).json({ success: false, error: error.message || 'AI reanalysis failed' });
  }
});

// POST /api/dashboard/item/:id/unified-ai - Unified AI call with full context
router.post('/item/:id/unified-ai', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { orderBy: { order: 'asc' } } }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (item.photos.length === 0) {
      return res.status(400).json({ success: false, error: 'Item has no photos. Upload photos first.' });
    }

    const result = await workflowService.unifiedProcessWithAI(id);

    // Fetch updated item for response
    const updated = await prisma.item.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        brand: true,
        condition: true,
        category: true,
        ebayCategoryId: true,
        aiAnalysis: true,
        aiCost: true,
        aiJournal: true,
        completeness: true,
      }
    });

    res.json({
      success: true,
      data: updated,
      journalEntry: result.journalEntry,
      cost: result.cost
    });
  } catch (error: any) {
    console.error('Unified AI error:', error);
    res.status(500).json({ success: false, error: error.message || 'Unified AI processing failed' });
  }
});

// GET /api/dashboard/item/:id/comps - Get sold comps from comptool DB
router.get('/item/:id/comps', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: { title: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (!item.title) {
      return res.json({ success: true, data: null, message: 'Item has no title for comp lookup' });
    }

    const { getCompsForItem } = await import('../services/comptool.service');
    const suggestion = await getCompsForItem(item.title);

    res.json({ success: true, data: suggestion });
  } catch (error: any) {
    console.error('Comps lookup error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch comps' });
  }
});

// POST /api/dashboard/item/:id/suggest-price - Get AI price suggestion
router.post('/item/:id/suggest-price', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: { title: true, brand: true, condition: true, category: true, features: true, description: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const suggestion = await aiService.suggestPrice({
      title: item.title || '',
      brand: item.brand || '',
      condition: item.condition || '',
      category: item.category || '',
      features: item.features || [],
      description: item.description || '',
    });

    // Store suggestion on item
    await prisma.item.update({
      where: { id },
      data: { aiPriceSuggestion: suggestion as any }
    });

    res.json({ success: true, data: suggestion });
  } catch (error: any) {
    console.error('Price suggestion error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get price suggestion' });
  }
});

// POST /api/dashboard/item/:id/verify-ebay - Validate listing with eBay without creating it
router.post('/item/:id/verify-ebay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Host images first (eBay needs URLs to validate)
    try {
      const { hostItemImages } = require('../services/imageHosting.service');
      await hostItemImages(id);
      const freshPhotos = await prisma.photo.findMany({ where: { itemId: id }, orderBy: { order: 'asc' } });
      item.photos = freshPhotos;
    } catch (hostErr) {
      console.warn('Image hosting skipped:', (hostErr as Error).message);
    }

    const imageUrls = item.photos
      .map(p => p.publicUrl)
      .filter((url): url is string => !!url);

    // Resolve category
    let categoryId = item.ebayCategoryId || '';
    if (!categoryId) {
      try {
        const suggestions = await ebayService.getCategories(item.title || '');
        if (suggestions?.length > 0) {
          const firstCat = suggestions[0];
          categoryId = firstCat.CategoryID || firstCat.Category?.CategoryID || '';
          if (categoryId) {
            await prisma.item.update({ where: { id }, data: { ebayCategoryId: categoryId } }).catch(() => {});
          }
        }
      } catch { /* ignore */ }
    }
    if (!categoryId) {
      return res.status(400).json({ success: false, error: 'Missing eBay Category ID.' });
    }

    // Build item specifics
    const aiData = (item.aiAnalysis as Record<string, unknown>) || {};
    const specifics: { name: string; value: string }[] = [];
    if (item.brand) specifics.push({ name: 'Brand', value: item.brand });
    if (aiData.model && aiData.model !== 'Unknown') specifics.push({ name: 'Model', value: String(aiData.model) });
    if (aiData.specifics && typeof aiData.specifics === 'object') {
      Object.entries(aiData.specifics).forEach(([name, value]) => {
        if (!specifics.some(s => s.name.toLowerCase() === name.toLowerCase()) && value) {
          specifics.push({ name, value: String(value) });
        }
      });
    }

    // Check required specifics and warn about missing ones
    let missingSpecificsWarnings: string[] = [];
    try {
      const catSpecifics = await ebayService.getCategorySpecifics(categoryId);
      if (catSpecifics.required.length > 0) {
        const missing = catSpecifics.required.filter(req => {
          const existing = specifics.find(s => s.name.toLowerCase() === req.name.toLowerCase());
          return !existing || !existing.value.trim();
        });
        if (missing.length > 0) {
          missingSpecificsWarnings = missing.map(r => `Required item specific "${r.name}" is missing — eBay will reject this listing`);
        }
      }
    } catch { /* non-fatal */ }

    const format = item.listingFormat || 'FixedPrice';
    const isAuction = format === 'Auction' || format === 'AuctionWithBIN';

    const listingData = {
      title: (item.title || 'Item for Sale').substring(0, 80),
      description: item.description || '',
      price: isAuction ? (item.startingPrice || item.buyNowPrice || 0) : (item.buyNowPrice || item.startingPrice || 0),
      buyNowPrice: format === 'AuctionWithBIN' ? item.buyNowPrice || undefined : undefined,
      category: categoryId,
      condition: item.condition || 'Used',
      imageUrls,
      quantity: item.quantity || 1,
      shippingCost: item.shippingCost || undefined,
      shippingService: item.shippingService || undefined,
      shippingType: item.shippingType || undefined,
      listingFormat: item.listingFormat || undefined,
      listingDuration: item.listingDuration || undefined,
      handlingTime: item.handlingTime || undefined,
      returnPolicy: item.returnPolicy as any || undefined,
      weight: item.weight || undefined,
      itemSpecifics: specifics.length > 0 ? specifics : undefined,
      packageDimensions: item.packageDimensions as any || undefined,
      postalCode: item.postalCode || undefined,
      shippingProfileId: (item as any).shippingProfileId || undefined,
      returnProfileId: (item as any).returnProfileId || undefined,
      upc: item.upc || undefined,
      isbn: item.isbn || undefined,
    };

    // Detect if this is an eBay Motors category
    const siteId = await ebayService.detectSiteId(categoryId);
    (listingData as any).siteId = siteId;

    const result = await ebayService.verifyListing(listingData);

    res.json({
      success: true,
      data: {
        valid: result.valid,
        errors: result.errors,
        warnings: result.warnings,
        fees: result.fees,
        specifics, // show what specifics were sent
      },
    });
  } catch (error: any) {
    console.error('eBay verify error:', error);
    res.status(500).json({ success: false, error: error.message || 'eBay verification failed' });
  }
});

// POST /api/dashboard/item/:id/push-to-ebay - Push item to eBay
router.post('/item/:id/push-to-ebay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await resolveUserId(req);

    const result = await ebayService.pushItem(id);

    // Create workflow action
    await prisma.workflowAction.create({
      data: {
        itemId: id,
        userId,
        fromStage: 'FINAL_REVIEW',
        toStage: 'PUBLISHED',
        action: 'publish',
        notes: `Pushed to eBay: ${result.platformId}`,
      },
    });

    res.json({
      success: true,
      data: {
        ebayId: result.platformId,
        listingUrl: result.listingUrl,
      },
    });
  } catch (error: any) {
    console.error('eBay push error:', JSON.stringify(error?.meta || error?.response?.data || error, null, 2));
    // Extract detailed eBay error messages
    const meta = error?.meta;
    let detail = error.message || 'Failed to push to eBay';
    if (meta?.Errors) {
      const errors = Array.isArray(meta.Errors) ? meta.Errors : [meta.Errors];
      detail = errors.map((e: any) => e.LongMessage || e.ShortMessage || e.message).filter(Boolean).join(' | ');
    }
    res.status(500).json({ success: false, error: detail });
  }
});

// POST /api/dashboard/item/:id/revise-ebay - Update an existing eBay listing
router.post('/item/:id/revise-ebay', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = await resolveUserId(req);

    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { orderBy: { order: 'asc' } } },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (!item.ebayId) {
      return res.status(400).json({ success: false, error: 'Item has no eBay listing to revise. Push to eBay first.' });
    }

    const imageUrls = item.photos
      .map(p => p.publicUrl)
      .filter((url): url is string => !!url);

    // Build item specifics for revision
    const reviseAiData = (item.aiAnalysis as Record<string, unknown>) || {};
    const reviseSpecifics: { name: string; value: string }[] = [];
    if (item.brand) reviseSpecifics.push({ name: 'Brand', value: item.brand });
    if (reviseAiData.model && reviseAiData.model !== 'Unknown') reviseSpecifics.push({ name: 'Model', value: String(reviseAiData.model) });
    if (reviseAiData.specifics && typeof reviseAiData.specifics === 'object') {
      Object.entries(reviseAiData.specifics).forEach(([name, value]) => {
        if (!reviseSpecifics.some(s => s.name.toLowerCase() === name.toLowerCase()) && value) {
          reviseSpecifics.push({ name, value: String(value) });
        }
      });
    }

    const result = await ebayService.reviseListing(item.ebayId, {
      title: (item.title || '').substring(0, 80),
      description: item.description || '',
      price: item.buyNowPrice || item.startingPrice || undefined,
      imageUrls,
      quantity: item.quantity || 1,
      itemSpecifics: reviseSpecifics.length > 0 ? reviseSpecifics : undefined,
    });

    if (result.success) {
      await prisma.workflowAction.create({
        data: {
          itemId: id,
          userId,
          fromStage: item.stage,
          toStage: item.stage,
          action: 'revise_ebay',
          notes: `Revised eBay listing ${item.ebayId}`,
        },
      });

      res.json({
        success: true,
        data: { ebayId: item.ebayId, listingUrl: `https://www.ebay.com/itm/${item.ebayId}` },
        message: 'eBay listing updated',
      });
    } else {
      res.status(500).json({ success: false, error: 'eBay revision failed' });
    }
  } catch (error: any) {
    console.error('eBay revise error:', JSON.stringify(error?.meta || error, null, 2));
    const meta = error?.meta;
    let detail = error.message || 'Failed to revise eBay listing';
    if (meta?.Errors) {
      const errors = Array.isArray(meta.Errors) ? meta.Errors : [meta.Errors];
      detail = errors.map((e: any) => e.LongMessage || e.ShortMessage || e.message).filter(Boolean).join(' | ');
    }
    res.status(500).json({ success: false, error: detail });
  }
});

// POST /api/dashboard/item/:id/reject - Reject item
router.post('/item/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = await resolveUserId(req);

    const item = await prisma.item.findUnique({
      where: { id },
      select: { stage: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const [updatedItem] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: { stage: 'REJECTED' }
      }),
      prisma.workflowAction.create({
        data: {
          itemId: id,
          userId,
          fromStage: item.stage,
          toStage: 'REJECTED',
          action: 'reject',
          notes: reason || null
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        stage: updatedItem.stage
      },
      message: 'Item rejected'
    });
  } catch (error) {
    console.error('Error rejecting item:', error);
    res.status(500).json({ success: false, error: 'Failed to reject item' });
  }
});

// GET /api/dashboard/item/:id/navigation - Get prev/next items in same stage
router.get('/item/:id/navigation', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      select: { stage: true, createdAt: true }
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Get items in same stage
    const [prevItem, nextItem] = await Promise.all([
      prisma.item.findFirst({
        where: {
          stage: item.stage,
          status: 'ACTIVE',
          createdAt: { lt: item.createdAt }
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
      }),
      prisma.item.findFirst({
        where: {
          stage: item.stage,
          status: 'ACTIVE',
          createdAt: { gt: item.createdAt }
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        prevId: prevItem?.id || null,
        nextId: nextItem?.id || null
      }
    });
  } catch (error) {
    console.error('Error getting navigation:', error);
    res.status(500).json({ success: false, error: 'Failed to get navigation' });
  }
});

// GET /api/dashboard/inventory/locations - Get all locations with item counts
router.get('/inventory/locations', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedLocations = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      code: loc.code,
      itemCount: loc._count.items,
      capacity: undefined // Can be added to schema if needed
    }));

    res.json({
      success: true,
      data: formattedLocations
    });
  } catch (error) {
    console.error('Error fetching inventory locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

// GET /api/dashboard/inventory/items - Get inventory items (cursor-based pagination)
router.get('/inventory/items', async (req, res) => {
  try {
    const { location, cursor, limit: limitStr } = req.query;
    const limit = Math.min(parseInt(limitStr as string) || 50, 100);

    const items = await prisma.item.findMany({
      where: {
        status: 'ACTIVE',
        ...(location ? { location: { code: { startsWith: location as string } } } : {})
      },
      include: {
        location: { select: { code: true, name: true } },
        photos: { select: { id: true, thumbnailPath: true }, take: 5 }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor as string }, skip: 1 } : {})
    });

    const hasMore = items.length > limit;
    const pageItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    const formattedItems = pageItems.map(item => {
      const comp = computeCompleteness(item);
      return {
        id: item.id,
        sku: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
        title: item.title || 'Untitled Item',
        location: item.location?.code || 'UNASSIGNED',
        locationName: item.location?.name || 'Unassigned',
        stage: item.stage,
        price: item.buyNowPrice || item.startingPrice || undefined,
        createdAt: item.createdAt.toISOString().split('T')[0],
        thumbnail: item.photos?.[0]?.thumbnailPath || null,
        completeness: comp.score,
        completenessPercent: comp.percentage,
      };
    });

    res.json({
      success: true,
      data: formattedItems,
      nextCursor,
      count: formattedItems.length
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory items' });
  }
});

// GET /api/dashboard/listings/active - Get active eBay listings
router.get('/listings/active', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'active'
      },
      include: {
        item: {
          select: {
            photos: {
              select: { thumbnailPath: true },
              take: 1,
              orderBy: { isPrimary: 'desc' }
            }
          }
        }
      },
      orderBy: { listedAt: 'desc' },
      take: 100
    });

    const formattedListings = listings.map(listing => ({
      id: listing.id,
      ebayId: listing.ebayId || '',
      title: listing.title,
      price: listing.buyNowPrice || listing.price,
      status: 'active' as const,
      imageUrl: listing.imageUrls?.[0] || listing.item?.photos?.[0]?.thumbnailPath || null,
      views: (listing.metadata as Record<string, unknown>)?.views || 0,
      watchers: (listing.metadata as Record<string, unknown>)?.watchers || 0,
      listedAt: listing.listedAt.toISOString().split('T')[0],
    }));

    res.json({
      success: true,
      data: formattedListings,
      count: formattedListings.length
    });
  } catch (error) {
    console.error('Error fetching active listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active listings' });
  }
});

// GET /api/dashboard/listings/sold - Get sold eBay listings
router.get('/listings/sold', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const listings = await prisma.listing.findMany({
      where: {
        status: 'sold',
        soldAt: { gte: thirtyDaysAgo }
      },
      include: {
        item: {
          select: {
            photos: {
              select: { thumbnailPath: true },
              take: 1,
              orderBy: { isPrimary: 'desc' }
            }
          }
        }
      },
      orderBy: { soldAt: 'desc' },
      take: 100
    });

    const formattedListings = listings.map(listing => ({
      id: listing.id,
      ebayId: listing.ebayId || '',
      title: listing.title,
      price: listing.buyNowPrice || listing.price,
      soldPrice: listing.soldPrice || listing.price,
      status: 'sold' as const,
      imageUrl: listing.imageUrls?.[0] || listing.item?.photos?.[0]?.thumbnailPath || null,
      views: (listing.metadata as Record<string, unknown>)?.views || 0,
      watchers: (listing.metadata as Record<string, unknown>)?.watchers || 0,
      listedAt: listing.listedAt.toISOString().split('T')[0],
      soldAt: listing.soldAt?.toISOString().split('T')[0] || null,
      buyer: (listing.metadata as Record<string, unknown>)?.buyer || null,
      shippingCost: (listing.metadata as Record<string, unknown>)?.shippingCost || null,
    }));

    res.json({
      success: true,
      data: formattedListings,
      count: formattedListings.length
    });
  } catch (error) {
    console.error('Error fetching sold listings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sold listings' });
  }
});

// GET /api/dashboard/listings/stats - Get listing statistics
router.get('/listings/stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeCount, soldListings] = await Promise.all([
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.listing.findMany({
        where: {
          status: 'sold',
          soldAt: { gte: thirtyDaysAgo }
        },
        select: { soldPrice: true, price: true }
      })
    ]);

    const totalSold = soldListings.length;
    const totalRevenue = soldListings.reduce((sum, l) => sum + (l.soldPrice || l.price), 0);
    const avgSalePrice = totalSold > 0 ? totalRevenue / totalSold : 0;

    res.json({
      success: true,
      data: {
        totalActive: activeCount,
        totalSold,
        totalRevenue,
        avgSalePrice
      }
    });
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing stats' });
  }
});

// ============================================================================
// TEMPLATES CRUD
// ============================================================================

// GET /api/dashboard/templates - Get all templates
router.get('/templates', async (req, res) => {
  try {
    const { search, sourceType, sort = 'recent' } = req.query;

    const whereClause: { isActive: boolean; sourceType?: TemplateSourceType } = {
      isActive: true
    };

    if (sourceType && sourceType !== 'all') {
      whereClause.sourceType = sourceType as TemplateSourceType;
    }

    const templates = await prisma.listingTemplate.findMany({
      where: whereClause,
      orderBy: sort === 'used' ? { timesUsed: 'desc' } :
               sort === 'name' ? { name: 'asc' } :
               { updatedAt: 'desc' }
    });

    // Apply search filter in memory (for flexible tag/name matching)
    let filteredTemplates = templates;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      data: filteredTemplates,
      count: filteredTemplates.length
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// GET /api/dashboard/templates/:id - Get a single template
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.listingTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
});

// POST /api/dashboard/templates - Create a new template
router.post('/templates', async (req, res) => {
  try {
    const {
      name,
      description,
      tags = [],
      sourceType = 'MANUAL',
      sourceEbayItemId,
      titleTemplate,
      categoryId,
      categoryName,
      categoryPath,
      defaultCondition,
      defaultConditionId,
      itemSpecifics,
      descriptionTemplate,
      suggestedPriceMin,
      suggestedPriceMax,
      defaultListingType,
      defaultDuration,
      defaultShippingProfileId,
      estimatedShippingCost,
      estimatedWeight,
      packageDimensions,
      referenceImageUrls = [],
      requiresPhotos = true,
      minimumPhotos = 1,
      isPublic = false
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Template name is required' });
    }

    const template = await prisma.listingTemplate.create({
      data: {
        name,
        description,
        tags,
        sourceType,
        sourceEbayItemId,
        titleTemplate,
        categoryId,
        categoryName,
        categoryPath,
        defaultCondition,
        defaultConditionId,
        itemSpecifics,
        descriptionTemplate,
        suggestedPriceMin,
        suggestedPriceMax,
        defaultListingType,
        defaultDuration,
        defaultShippingProfileId,
        estimatedShippingCost,
        estimatedWeight,
        packageDimensions,
        referenceImageUrls,
        requiresPhotos,
        minimumPhotos,
        isPublic
      }
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PUT /api/dashboard/templates/:id - Update a template
router.put('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id from update data if present
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const template = await prisma.listingTemplate.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /api/dashboard/templates/:id - Delete a template (soft delete)
router.delete('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting isActive to false
    await prisma.listingTemplate.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// POST /api/dashboard/templates/:id/duplicate - Duplicate a template
router.post('/templates/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    const original = await prisma.listingTemplate.findUnique({
      where: { id }
    });

    if (!original) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    // Create a copy with modified name
    const duplicate = await prisma.listingTemplate.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        tags: original.tags,
        sourceType: original.sourceType,
        sourceEbayItemId: original.sourceEbayItemId,
        titleTemplate: original.titleTemplate,
        categoryId: original.categoryId,
        categoryName: original.categoryName,
        categoryPath: original.categoryPath,
        defaultCondition: original.defaultCondition,
        defaultConditionId: original.defaultConditionId,
        itemSpecifics: original.itemSpecifics,
        descriptionTemplate: original.descriptionTemplate,
        suggestedPriceMin: original.suggestedPriceMin,
        suggestedPriceMax: original.suggestedPriceMax,
        defaultListingType: original.defaultListingType,
        defaultDuration: original.defaultDuration,
        defaultShippingProfileId: original.defaultShippingProfileId,
        estimatedShippingCost: original.estimatedShippingCost,
        estimatedWeight: original.estimatedWeight,
        packageDimensions: original.packageDimensions,
        referenceImageUrls: original.referenceImageUrls,
        requiresPhotos: original.requiresPhotos,
        minimumPhotos: original.minimumPhotos,
        isPublic: false,
        timesUsed: 0
      }
    });

    res.status(201).json({
      success: true,
      data: duplicate
    });
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ success: false, error: 'Failed to duplicate template' });
  }
});

// POST /api/dashboard/templates/:id/use - Increment usage count
router.post('/templates/:id/use', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.listingTemplate.update({
      where: { id },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error using template:', error);
    res.status(500).json({ success: false, error: 'Failed to use template' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

// POST /api/dashboard/items/bulk-push-to-ebay - Bulk push items to eBay (enqueues jobs via Bull)
router.post('/items/bulk-push-to-ebay', async (req: Request, res: Response) => {
  try {
    const { itemIds } = req.body;
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'itemIds array required' });
    }
    // No cap — the queue handles any volume

    const jobs = await Promise.all(
      itemIds.map((itemId: string) =>
        pushQueue.add({ itemId, platform: 'ebay' }, { jobId: `ebay-${itemId}` })
      )
    );

    res.json({
      success: true,
      data: {
        enqueued: jobs.length,
        jobIds: jobs.map(j => j.id),
        message: `${jobs.length} item(s) queued for eBay push. Check /api/dashboard/queue/push-status for progress.`,
      },
    });
  } catch (error: any) {
    console.error('Bulk eBay push error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to bulk push to eBay' });
  }
});

// GET /api/dashboard/queue/push-status - Get Bull push queue job counts
router.get('/queue/push-status', async (_req: Request, res: Response) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      pushQueue.getWaitingCount(),
      pushQueue.getActiveCount(),
      pushQueue.getCompletedCount(),
      pushQueue.getFailedCount(),
      pushQueue.getDelayedCount(),
    ]);

    res.json({
      success: true,
      data: { waiting, active, completed, failed, delayed },
    });
  } catch (error: any) {
    console.error('Queue status error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get queue status' });
  }
});

// POST /api/dashboard/items/bulk-advance - Advance multiple items to next stage
router.post('/items/bulk-advance', async (req: Request, res: Response) => {
  try {
    const { itemIds, targetStage } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'itemIds array is required' });
    }

    const userId = await resolveUserId(req);

    // Define stage progression
    const stageOrder = [
      'PHOTO_UPLOAD',
      'AI_PROCESSING',
      'REVIEW_EDIT',
      'PRICING',
      'FINAL_REVIEW',
      'PUBLISHED'
    ];

    // Get all items
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, stage: true }
    });

    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: []
    };

    // Process each item
    for (const item of items) {
      try {
        let nextStage: string;

        if (targetStage) {
          // Use specified target stage
          nextStage = targetStage;
        } else {
          // Advance to next stage in sequence
          const currentIndex = stageOrder.indexOf(item.stage);
          if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
            results.failed.push({ id: item.id, error: 'Already at final stage or invalid stage' });
            continue;
          }
          nextStage = stageOrder[currentIndex + 1];
        }

        await prisma.$transaction([
          prisma.item.update({
            where: { id: item.id },
            data: { stage: nextStage as WorkflowStage }
          }),
          prisma.workflowAction.create({
            data: {
              itemId: item.id,
              userId,
              fromStage: item.stage,
              toStage: nextStage as WorkflowStage,
              action: 'bulk_advance',
              notes: `Bulk advanced to ${nextStage}`
            }
          })
        ]);

        results.success.push(item.id);
      } catch (error) {
        results.failed.push({ id: item.id, error: 'Failed to advance' });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Advanced ${results.success.length} items, ${results.failed.length} failed`
    });
  } catch (error) {
    console.error('Error bulk advancing items:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk advance items' });
  }
});

// POST /api/dashboard/items/bulk-price - Set prices for multiple items
router.post('/items/bulk-price', async (req: Request, res: Response) => {
  try {
    const { itemIds, priceAdjustment } = req.body;

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'itemIds array is required' });
    }

    const userId = await resolveUserId(req);

    // Get all items with their current prices
    const items = await prisma.item.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, stage: true, startingPrice: true, buyNowPrice: true }
    });

    const results: { success: string[]; failed: { id: string; error: string }[] } = {
      success: [],
      failed: []
    };

    for (const item of items) {
      try {
        const updateData: Record<string, unknown> = {};

        if (priceAdjustment) {
          // Apply price adjustment (percentage or fixed)
          if (priceAdjustment.type === 'percentage') {
            const multiplier = 1 + (priceAdjustment.value / 100);
            if (item.startingPrice) updateData.startingPrice = Math.round(item.startingPrice * multiplier * 100) / 100;
            if (item.buyNowPrice) updateData.buyNowPrice = Math.round(item.buyNowPrice * multiplier * 100) / 100;
          } else if (priceAdjustment.type === 'fixed') {
            updateData.startingPrice = priceAdjustment.startingPrice;
            updateData.buyNowPrice = priceAdjustment.buyNowPrice;
          }
        }

        // Advance to PRICING stage if not already there or beyond
        const stageOrder = ['PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW', 'PUBLISHED'];
        const currentIndex = stageOrder.indexOf(item.stage);
        const pricingIndex = stageOrder.indexOf('PRICING');

        if (currentIndex < pricingIndex) {
          updateData.stage = 'PRICING';
        }

        await prisma.$transaction([
          prisma.item.update({
            where: { id: item.id },
            data: updateData
          }),
          prisma.workflowAction.create({
            data: {
              itemId: item.id,
              userId,
              fromStage: item.stage,
              toStage: (updateData.stage as WorkflowStage) || item.stage,
              action: 'bulk_price',
              notes: priceAdjustment ? `Bulk pricing applied` : 'Moved to pricing stage'
            }
          })
        ]);

        results.success.push(item.id);
      } catch (error) {
        results.failed.push({ id: item.id, error: 'Failed to update price' });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Updated ${results.success.length} items, ${results.failed.length} failed`
    });
  } catch (error) {
    console.error('Error bulk pricing items:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk price items' });
  }
});

// PUT /api/dashboard/listings/:id - Update a listing
router.put('/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, buyNowPrice, status } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (price !== undefined) updateData.price = price;
    if (buyNowPrice !== undefined) updateData.buyNowPrice = buyNowPrice;
    if (status !== undefined) updateData.status = status;

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: listing,
      message: 'Listing updated successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    console.error('Error updating listing:', error);
    res.status(500).json({ success: false, error: 'Failed to update listing' });
  }
});

// POST /api/dashboard/listings/:id/end - End a listing
router.post('/listings/:id/end', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        status: 'ended',
        endedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: listing,
      message: 'Listing ended successfully'
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }
    console.error('Error ending listing:', error);
    res.status(500).json({ success: false, error: 'Failed to end listing' });
  }
});

// GET /api/dashboard/reports/export - Export reports data as JSON
router.get('/reports/export', async (req, res) => {
  try {
    const { range = '30d', format = 'json' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (range) {
      case '7d': startDate.setDate(now.getDate() - 7); break;
      case '30d': startDate.setDate(now.getDate() - 30); break;
      case '90d': startDate.setDate(now.getDate() - 90); break;
      case '1y': startDate.setFullYear(now.getFullYear() - 1); break;
      default: startDate.setDate(now.getDate() - 30);
    }

    // Get sold listings in date range with full details
    const soldListings = await prisma.listing.findMany({
      where: {
        status: 'sold',
        soldAt: { gte: startDate }
      },
      select: {
        id: true,
        title: true,
        price: true,
        soldPrice: true,
        category: true,
        soldAt: true,
        listedAt: true,
        ebayId: true
      },
      orderBy: { soldAt: 'desc' }
    });

    // Calculate summary metrics
    const totalRevenue = soldListings.reduce((sum, l) => sum + (l.soldPrice || l.price), 0);
    const itemsSold = soldListings.length;
    const avgSalePrice = itemsSold > 0 ? totalRevenue / itemsSold : 0;

    const exportData = {
      exportDate: new Date().toISOString(),
      dateRange: { start: startDate.toISOString(), end: now.toISOString() },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        itemsSold,
        avgSalePrice: Math.round(avgSalePrice * 100) / 100
      },
      transactions: soldListings.map(l => ({
        id: l.id,
        ebayId: l.ebayId,
        title: l.title,
        listPrice: l.price,
        soldPrice: l.soldPrice || l.price,
        category: l.category,
        listedAt: l.listedAt?.toISOString(),
        soldAt: l.soldAt?.toISOString()
      }))
    };

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'eBay ID', 'Title', 'List Price', 'Sold Price', 'Category', 'Listed At', 'Sold At'];
      const rows = soldListings.map(l => [
        l.id,
        l.ebayId || '',
        `"${(l.title || '').replace(/"/g, '""')}"`,
        l.price,
        l.soldPrice || l.price,
        l.category || '',
        l.listedAt?.toISOString() || '',
        l.soldAt?.toISOString() || ''
      ].join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${range}.csv"`);
      return res.send(csv);
    }

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting reports:', error);
    res.status(500).json({ success: false, error: 'Failed to export reports' });
  }
});

// GET /api/dashboard/listing-defaults - Get listing defaults for the active location
router.get('/listing-defaults', async (req: Request, res: Response) => {
  try {
    const location = await prisma.location.findFirst({
      where: { isActive: true },
    });

    if (!location) {
      return res.json({ success: true, data: {} });
    }

    const settings = ((location as any).settings as Record<string, unknown>) || {};
    const defaults = (settings.listingDefaults as Record<string, unknown>) || {};

    res.json({ success: true, data: defaults });
  } catch (error) {
    console.error('Error fetching listing defaults:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch listing defaults' });
  }
});

// PUT /api/dashboard/listing-defaults - Save listing defaults for the active location
router.put('/listing-defaults', async (req: Request, res: Response) => {
  try {
    const defaults = req.body;

    const location = await prisma.location.findFirst({
      where: { isActive: true },
    });

    if (!location) {
      return res.status(400).json({ success: false, error: 'No active location found' });
    }

    const existingSettings = ((location as any).settings as Record<string, unknown>) || {};

    await prisma.location.update({
      where: { id: location.id },
      data: {
        settings: {
          ...existingSettings,
          listingDefaults: defaults,
        } as any,
      },
    });

    res.json({ success: true, message: 'Listing defaults saved' });
  } catch (error) {
    console.error('Error saving listing defaults:', error);
    res.status(500).json({ success: false, error: 'Failed to save listing defaults' });
  }
});

// GET /api/dashboard/analytics - Analytics dashboard data
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stageCounts, recentPublished, aiCostData, ebayBreakdown, listerActions] = await Promise.all([
      // Stage funnel: current count at each stage
      prisma.item.groupBy({
        by: ['stage'],
        where: { status: 'ACTIVE' },
        _count: { id: true }
      }),
      // Items that reached PUBLISHED stage in last 30 days
      prisma.item.findMany({
        where: { stage: 'PUBLISHED', updatedAt: { gte: thirtyDaysAgo } },
        select: { updatedAt: true, ebayId: true },
        orderBy: { updatedAt: 'desc' }
      }),
      // AI cost per item in last 30 days
      prisma.item.findMany({
        where: { aiCost: { gt: 0 }, updatedAt: { gte: thirtyDaysAgo } },
        select: { updatedAt: true, aiCost: true }
      }),
      // Platform breakdown: items with vs without ebayId
      prisma.item.groupBy({
        by: ['stage'],
        where: { status: 'ACTIVE', ebayId: { not: null } },
        _count: { id: true }
      }),
      // Per-lister throughput: workflow actions in last 30 days
      prisma.workflowAction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { userId: true, createdAt: true, user: { select: { name: true } } },
      })
    ]);

    // Aggregate published items by day
    const dailyPublishedMap: Record<string, number> = {};
    for (const item of recentPublished) {
      const day = item.updatedAt.toISOString().split('T')[0];
      dailyPublishedMap[day] = (dailyPublishedMap[day] || 0) + 1;
    }
    const dailyPublished = Object.entries(dailyPublishedMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    // Aggregate AI costs by day
    const aiCostByDayMap: Record<string, number> = {};
    let totalAiCost = 0;
    for (const item of aiCostData) {
      const day = item.updatedAt.toISOString().split('T')[0];
      const cost = (item.aiCost as number) || 0;
      aiCostByDayMap[day] = (aiCostByDayMap[day] || 0) + cost;
      totalAiCost += cost;
    }
    const aiCostByDay = Object.entries(aiCostByDayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cost]) => ({ date, cost: Math.round(cost * 10000) / 10000 }));

    // Per-lister throughput
    const listerMap: Record<string, { name: string; count: number }> = {};
    for (const action of listerActions) {
      if (!listerMap[action.userId]) {
        listerMap[action.userId] = { name: (action.user as any)?.name || action.userId, count: 0 };
      }
      listerMap[action.userId].count++;
    }
    const perListerThroughput = Object.values(listerMap).sort((a, b) => b.count - a.count);

    // Platform breakdown totals
    const totalWithEbay = ebayBreakdown.reduce((sum, g) => sum + (g._count as any).id, 0);
    const totalActive = stageCounts.reduce((sum, g) => sum + (g._count as any).id, 0);
    const platformBreakdown = {
      pushedToEbay: totalWithEbay,
      notPushed: totalActive - totalWithEbay
    };

    // Format stage funnel
    const stageFunnel = stageCounts.map(g => ({
      stage: g.stage,
      count: (g._count as any).id
    })).sort((a, b) => {
      const order = ['PHOTO_UPLOAD', 'AI_PROCESSING', 'REVIEW_EDIT', 'PRICING', 'FINAL_REVIEW', 'PUBLISHED', 'REJECTED'];
      return order.indexOf(a.stage) - order.indexOf(b.stage);
    });

    res.json({
      success: true,
      data: {
        stageFunnel,
        dailyPublished,
        aiCosts: {
          byDay: aiCostByDay,
          total: Math.round(totalAiCost * 10000) / 10000
        },
        platformBreakdown,
        perListerThroughput
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

export default router;
