import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

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
    const [identifyItems, reviewItems, priceItems, readyItems] = await Promise.all([
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
    ]);

    // Transform to queue format
    const transformItem = (item: any, step: string) => ({
      id: item.id,
      title: item.title || 'Untitled Item',
      thumbnail: item.photos?.[0]?.thumbnailPath || null,
      confidence: item.aiAnalysis?.confidence || undefined,
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
      },
      counts: {
        identify: identifyItems.length,
        review: reviewItems.length,
        price: priceItems.length,
        ready: readyItems.length,
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
    const aiAnalysis = item.aiAnalysis as any || {};

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
        model: aiAnalysis.modelUsed || 'unknown',
        justification: aiAnalysis.justification || 'No AI analysis available',
      },
      suggestedPrice: item.buyNowPrice || item.startingPrice || 0,
      photos: item.photos.map(p => ({
        id: p.id,
        url: p.thumbnailPath || p.originalPath,
        isPrimary: p.isPrimary
      })),
      location: item.location?.name || 'Unassigned',
      locationCode: item.location?.code || '',
      createdBy: item.createdBy?.name || 'Unknown',
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

// GET /api/dashboard/inventory/items - Get inventory items
router.get('/inventory/items', async (req, res) => {
  try {
    const { location } = req.query;

    const items = await prisma.item.findMany({
      where: {
        status: 'ACTIVE',
        ...(location ? { location: { code: { startsWith: location as string } } } : {})
      },
      include: {
        location: { select: { code: true, name: true } },
        photos: { select: { thumbnailPath: true }, take: 1 }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      sku: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
      title: item.title || 'Untitled Item',
      location: item.location?.code || 'UNASSIGNED',
      locationName: item.location?.name || 'Unassigned',
      stage: item.stage,
      price: item.buyNowPrice || item.startingPrice || undefined,
      createdAt: item.createdAt.toISOString().split('T')[0],
      thumbnail: item.photos?.[0]?.thumbnailPath || null
    }));

    res.json({
      success: true,
      data: formattedItems,
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
      views: (listing.metadata as any)?.views || 0,
      watchers: (listing.metadata as any)?.watchers || 0,
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
      views: (listing.metadata as any)?.views || 0,
      watchers: (listing.metadata as any)?.watchers || 0,
      listedAt: listing.listedAt.toISOString().split('T')[0],
      soldAt: listing.soldAt?.toISOString().split('T')[0] || null,
      buyer: (listing.metadata as any)?.buyer || null,
      shippingCost: (listing.metadata as any)?.shippingCost || null,
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

    const whereClause: any = {
      isActive: true
    };

    if (sourceType && sourceType !== 'all') {
      whereClause.sourceType = sourceType;
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
  } catch (error: any) {
    if (error.code === 'P2025') {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error using template:', error);
    res.status(500).json({ success: false, error: 'Failed to use template' });
  }
});

export default router;
