import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createItemSchema, updateItemSchema, completeStepSchema, itemQuerySchema } from '../schemas/item.schema';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/items - List items with filtering
router.get('/', validate(itemQuerySchema, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      step,
      status = 'ACTIVE',
      page = '1',
      limit = '50',
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (step) {
      where.stage = step;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          location: { select: { name: true, code: true } },
          createdBy: { select: { name: true } },
          photos: {
            select: { id: true, thumbnailPath: true, isPrimary: true },
            take: 1,
            orderBy: { isPrimary: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.item.count({ where }),
    ]);

    const formattedItems = items.map(item => ({
      id: item.id,
      sku: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
      title: item.title || 'Untitled Item',
      stage: item.stage,
      status: item.status,
      category: item.category,
      condition: item.condition,
      brand: item.brand,
      startingPrice: item.startingPrice,
      buyNowPrice: item.buyNowPrice,
      location: item.location?.name || 'Unassigned',
      locationCode: item.location?.code || '',
      createdBy: item.createdBy?.name || 'Unknown',
      thumbnail: item.photos?.[0]?.thumbnailPath || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formattedItems,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch items' });
  }
});

// GET /api/v1/items/:id - Get single item
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        location: { select: { name: true, code: true } },
        photos: {
          orderBy: [{ isPrimary: 'desc' }, { order: 'asc' }],
        },
        createdBy: { select: { id: true, name: true } },
        workflowActions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const aiAnalysis = (item.aiAnalysis as Record<string, unknown>) || {};

    res.json({
      success: true,
      data: {
        id: item.id,
        sku: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
        stage: item.stage,
        status: item.status,
        title: item.title || 'Untitled Item',
        description: item.description || '',
        category: item.category || '',
        condition: item.condition || 'Used',
        brand: item.brand || '',
        features: item.features,
        keywords: item.keywords,
        startingPrice: item.startingPrice,
        buyNowPrice: item.buyNowPrice,
        shippingCost: item.shippingCost,
        aiAnalysis,
        photos: item.photos.map(p => ({
          id: p.id,
          originalPath: p.originalPath,
          thumbnailPath: p.thumbnailPath,
          optimizedPath: p.optimizedPath,
          isPrimary: p.isPrimary,
          order: p.order,
          analysis: p.analysis,
        })),
        location: item.location?.name || 'Unassigned',
        locationCode: item.location?.code || '',
        locationId: item.locationId,
        createdBy: item.createdBy,
        ebayId: item.ebayId,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        history: item.workflowActions.map(action => ({
          action: action.action,
          fromStage: action.fromStage,
          toStage: action.toStage,
          notes: action.notes,
          user: action.user?.name || 'System',
          date: action.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch item' });
  }
});

// POST /api/v1/items - Create a new item
router.post('/', validate(createItemSchema), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      brand,
      locationId,
      startingPrice,
      buyNowPrice,
    } = req.body;

    const userId = req.user!.id;

    // Find location
    let location = locationId
      ? await prisma.location.findUnique({ where: { id: locationId } })
      : null;
    if (!location) {
      location = await prisma.location.findFirst({ where: { isActive: true } });
    }
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'No active location found. Please create a location first.',
      });
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `LF-${timestamp}-${random}`;

    const item = await prisma.item.create({
      data: {
        sku,
        stage: 'PHOTO_UPLOAD',
        status: 'ACTIVE',
        locationId: location.id,
        createdById: userId,
        title: title || null,
        description: description || null,
        category: category || null,
        condition: condition || null,
        brand: brand || null,
        startingPrice: startingPrice ? parseFloat(startingPrice) : null,
        buyNowPrice: buyNowPrice ? parseFloat(buyNowPrice) : null,
      },
      include: {
        location: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
    });

    await prisma.workflowAction.create({
      data: {
        itemId: item.id,
        userId,
        fromStage: 'PHOTO_UPLOAD',
        toStage: 'PHOTO_UPLOAD',
        action: 'create',
        notes: 'Item created',
      },
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: 'Failed to create item' });
  }
});

// PATCH /api/v1/items/:id - Update item
router.patch('/:id', validate(updateItemSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      condition,
      brand,
      startingPrice,
      buyNowPrice,
      shippingCost,
      features,
      keywords,
      locationId,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (condition !== undefined) updateData.condition = condition;
    if (brand !== undefined) updateData.brand = brand;
    if (startingPrice !== undefined) updateData.startingPrice = startingPrice;
    if (buyNowPrice !== undefined) updateData.buyNowPrice = buyNowPrice;
    if (shippingCost !== undefined) updateData.shippingCost = shippingCost;
    if (features !== undefined) updateData.features = features;
    if (keywords !== undefined) updateData.keywords = keywords;
    if (locationId !== undefined) updateData.locationId = locationId;

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully',
    });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// DELETE /api/v1/items/:id - Archive item (soft delete)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.item.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    res.json({
      success: true,
      message: 'Item archived successfully',
    });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: 'Failed to delete item' });
  }
});

// POST /api/v1/items/:id/photos - Upload photos for an item
router.post('/:id/photos', async (req: AuthRequest, res: Response) => {
  // Photo upload is handled by the existing upload route
  // This endpoint exists to match the frontend API client
  res.status(501).json({
    success: false,
    error: 'Use POST /api/upload/image for photo uploads',
  });
});

// POST /api/v1/items/:id/step - Complete a workflow step
router.post('/:id/step', validate(completeStepSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { step, action, ...data } = req.body;
    const userId = req.user!.id;

    const item = await prisma.item.findUnique({
      where: { id },
      select: { stage: true },
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
      'PUBLISHED',
    ];

    let nextStage = item.stage;

    if (action === 'approve' || action === 'advance') {
      const currentIndex = stageOrder.indexOf(item.stage);
      if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
        nextStage = stageOrder[currentIndex + 1] as typeof item.stage;
      }
    } else if (action === 'reject') {
      nextStage = 'REJECTED';
    }

    const updateData: Record<string, unknown> = { stage: nextStage };
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.startingPrice !== undefined) updateData.startingPrice = data.startingPrice;
    if (data.buyNowPrice !== undefined) updateData.buyNowPrice = data.buyNowPrice;

    const [updatedItem] = await prisma.$transaction([
      prisma.item.update({
        where: { id },
        data: updateData,
      }),
      prisma.workflowAction.create({
        data: {
          itemId: id,
          userId,
          fromStage: item.stage,
          toStage: nextStage,
          action: action || 'advance',
          notes: data.notes || null,
          changes: data,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        id: updatedItem.id,
        stage: updatedItem.stage,
      },
      message: `Item ${action || 'advanced'} to ${nextStage}`,
    });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({ success: false, error: 'Failed to complete step' });
  }
});

export default router;
