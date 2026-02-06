import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/v1/inventory - Get inventory items with filtering
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      location,
      stage,
      search,
      page = '1',
      limit = '100',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 100));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (location && typeof location === 'string') {
      where.location = { code: { startsWith: location } };
    }

    if (stage && typeof stage === 'string') {
      where.stage = stage;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          location: { select: { code: true, name: true } },
          photos: { select: { thumbnailPath: true }, take: 1 },
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
      location: item.location?.code || 'UNASSIGNED',
      locationName: item.location?.name || 'Unassigned',
      stage: item.stage,
      price: item.buyNowPrice || item.startingPrice || undefined,
      createdAt: item.createdAt.toISOString().split('T')[0],
      thumbnail: item.photos?.[0]?.thumbnailPath || null,
    }));

    res.json({
      success: true,
      data: formattedItems,
      count: total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

// GET /api/v1/inventory/locations - Get all locations with item counts
router.get('/locations', async (req: AuthRequest, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formattedLocations = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      code: loc.code,
      address: loc.address,
      timezone: loc.timezone,
      itemCount: loc._count.items,
    }));

    res.json({ success: true, data: formattedLocations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch locations' });
  }
});

// POST /api/v1/inventory/assign - Assign item to a location
router.post('/assign', async (req: AuthRequest, res: Response) => {
  try {
    const { itemId, locationId } = req.body;

    if (!itemId || !locationId) {
      return res.status(400).json({
        success: false,
        error: 'itemId and locationId are required',
      });
    }

    const location = await prisma.location.findUnique({ where: { id: locationId } });
    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    const item = await prisma.item.update({
      where: { id: itemId },
      data: { locationId },
      include: {
        location: { select: { name: true, code: true } },
      },
    });

    res.json({
      success: true,
      data: item,
      message: `Item assigned to ${location.name}`,
    });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    console.error('Error assigning location:', error);
    res.status(500).json({ success: false, error: 'Failed to assign location' });
  }
});

// GET /api/v1/inventory/search - Search inventory
router.get('/search', async (req: AuthRequest, res: Response) => {
  try {
    const { warehouseId, locationCode, query } = req.query;

    const where: Record<string, unknown> = { status: 'ACTIVE' };

    if (warehouseId && typeof warehouseId === 'string') {
      where.locationId = warehouseId;
    }

    if (locationCode && typeof locationCode === 'string') {
      where.location = { code: { startsWith: locationCode } };
    }

    if (query && typeof query === 'string') {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        location: { select: { code: true, name: true } },
        photos: { select: { thumbnailPath: true }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      sku: item.sku || `TMP-${item.id.slice(-8).toUpperCase()}`,
      title: item.title || 'Untitled Item',
      location: item.location?.code || 'UNASSIGNED',
      locationName: item.location?.name || 'Unassigned',
      stage: item.stage,
      price: item.buyNowPrice || item.startingPrice || undefined,
      thumbnail: item.photos?.[0]?.thumbnailPath || null,
    }));

    res.json({
      success: true,
      data: formattedItems,
      count: formattedItems.length,
    });
  } catch (error) {
    console.error('Error searching inventory:', error);
    res.status(500).json({ success: false, error: 'Failed to search inventory' });
  }
});

export default router;
