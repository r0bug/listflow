import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/templates - List templates
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, tags, sourceType, sort = 'recent' } = req.query;

    const where: Record<string, unknown> = { isActive: true };

    if (sourceType && sourceType !== 'all') {
      where.sourceType = sourceType;
    }

    const orderBy =
      sort === 'used' ? { timesUsed: 'desc' as const } :
      sort === 'name' ? { name: 'asc' as const } :
      { updatedAt: 'desc' as const };

    const templates = await prisma.listingTemplate.findMany({
      where,
      orderBy,
    });

    let filtered = templates;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = templates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchLower))
      );
    }

    if (tags && typeof tags === 'string') {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase());
      filtered = filtered.filter(t =>
        t.tags.some(tag => tagList.includes(tag.toLowerCase()))
      );
    }

    res.json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// GET /api/v1/templates/:id - Get a single template
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.listingTemplate.findUnique({ where: { id } });

    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template' });
  }
});

// POST /api/v1/templates - Create a new template
router.post('/', async (req: AuthRequest, res: Response) => {
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
      isPublic = false,
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
        isPublic,
      },
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, error: 'Failed to create template' });
  }
});

// PATCH /api/v1/templates/:id - Update a template
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove readonly fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const template = await prisma.listingTemplate.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: template });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// DELETE /api/v1/templates/:id - Soft delete template
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.listingTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

// POST /api/v1/templates/:id/use - Use a template (increment usage)
router.post('/:id/use', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.listingTemplate.update({
      where: { id },
      data: {
        timesUsed: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    res.json({ success: true, data: template });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    console.error('Error using template:', error);
    res.status(500).json({ success: false, error: 'Failed to use template' });
  }
});

// POST /api/v1/templates/from-ebay - Create template from eBay listing
router.post('/from-ebay', async (req: AuthRequest, res: Response) => {
  try {
    const { ebayItemId, name } = req.body;

    if (!ebayItemId || !name) {
      return res.status(400).json({
        success: false,
        error: 'eBay item ID and template name are required',
      });
    }

    // Create template with eBay source
    const template = await prisma.listingTemplate.create({
      data: {
        name,
        sourceType: 'SELL_SIMILAR',
        sourceEbayItemId: ebayItemId,
        tags: ['from-ebay'],
      },
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template from eBay:', error);
    res.status(500).json({ success: false, error: 'Failed to create template from eBay' });
  }
});

export default router;
