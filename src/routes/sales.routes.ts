import { Router, Response } from 'express';
import multer from 'multer';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { salesQuerySchema, assignAgentSchema } from '../schemas/sales.schema';
import { csvImportService } from '../services/csvImport.service';
import { commissionService } from '../services/commission.service';
import { AttributionStatus, Prisma } from '../generated/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/v1/sales/feed - machine-to-machine sales feed for TeamTime.
// Registered BEFORE authMiddleware; guarded by LISTFLOW_API_SECRET bearer.
router.get('/feed', async (req, res: Response) => {
  try {
    const secret = process.env.LISTFLOW_API_SECRET;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!secret || !token || token !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { from, to, agentId, attribution } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(req.query.page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));

    const where: Prisma.SaleWhereInput = {};
    if (from || to) {
      where.soldAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }
    if (attribution && attribution !== 'all' && ATTRIBUTION_MAP[attribution]) {
      where.attributionStatus = ATTRIBUTION_MAP[attribution];
    }
    if (agentId) where.commission = { agentId };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          ebayAccount: { select: { accountName: true } },
          commission: {
            select: {
              amount: true,
              basis: true,
              rateType: true,
              rateValue: true,
              status: true,
              agent: { select: { id: true, name: true, teamtimeUserId: true } },
            },
          },
        },
        orderBy: { soldAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({
      sales: sales.map((sale) => ({
        id: sale.id,
        ebayOrderId: sale.ebayOrderId,
        title: sale.title,
        quantity: sale.quantity,
        itemPrice: sale.itemPrice,
        shippingPrice: sale.shippingPrice,
        totalPrice: sale.totalPrice,
        buyerUsername: sale.buyerUsername,
        soldAt: sale.soldAt,
        // remote eBay CDN URL — reachable from any client, unlike local paths
        imageUrl: sale.imageUrl,
        account: sale.ebayAccount.accountName,
        attributionStatus: sale.attributionStatus,
        commission: sale.commission,
      })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Error building sales feed:', error);
    res.status(500).json({ error: 'Failed to build sales feed' });
  }
});

router.use(authMiddleware);

const ATTRIBUTION_MAP: Record<string, AttributionStatus> = {
  pending: AttributionStatus.PENDING,
  attributed: AttributionStatus.ATTRIBUTED,
  house: AttributionStatus.HOUSE,
};

function buildSalesWhere(query: Record<string, unknown>): Prisma.SaleWhereInput {
  const { from, to, ebayAccountId, attribution, search } = query as Record<string, string>;
  const where: Prisma.SaleWhereInput = {};
  if (from || to) {
    where.soldAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }
  if (ebayAccountId) where.ebayAccountId = ebayAccountId;
  if (attribution && attribution !== 'all') {
    where.attributionStatus = ATTRIBUTION_MAP[attribution];
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { ebayOrderId: { contains: search } },
      { legacyItemId: { contains: search } },
      { buyerUsername: { contains: search, mode: 'insensitive' } },
    ];
  }
  return where;
}

// GET /api/v1/sales - list sales with filters
router.get('/', validate(salesQuerySchema, 'query'), async (req: AuthRequest, res: Response) => {
  try {
    const pageNum = Math.max(1, parseInt(req.query.page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const where = buildSalesWhere(req.query);

    const [sales, total, pendingCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          ebayAccount: { select: { id: true, accountName: true } },
          listing: { select: { id: true, listingAgentId: true, imageUrls: true } },
          commission: { include: { agent: { select: { id: true, name: true } } } },
        },
        orderBy: { soldAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.sale.count({ where }),
      prisma.sale.count({ where: { attributionStatus: AttributionStatus.PENDING } }),
    ]);

    res.json({
      sales,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      pendingCount,
    });
  } catch (error) {
    console.error('Error listing sales:', error);
    res.status(500).json({ error: 'Failed to list sales' });
  }
});

// GET /api/v1/sales/needs-attribution - unassigned sales, oldest first
router.get('/needs-attribution', async (_req: AuthRequest, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { attributionStatus: AttributionStatus.PENDING },
      include: { ebayAccount: { select: { id: true, accountName: true } } },
      orderBy: { soldAt: 'asc' },
    });
    res.json({ sales });
  } catch (error) {
    console.error('Error listing unattributed sales:', error);
    res.status(500).json({ error: 'Failed to list unattributed sales' });
  }
});

// POST /api/v1/sales/:id/assign-agent - create commission, back-tag listing
router.post(
  '/:id/assign-agent',
  roleMiddleware(['ADMIN', 'MANAGER']),
  validate(assignAgentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { agentId, rateType, rateValue } = req.body;
      const sale = await prisma.sale.findUnique({
        where: { id: req.params.id },
        include: { commission: true },
      });
      if (!sale) return res.status(404).json({ error: 'Sale not found' });
      if (sale.commission) {
        return res.status(409).json({ error: 'Sale already has a commission' });
      }

      const override =
        rateType != null && rateValue != null ? { rateType, rateValue } : null;
      const commission = await commissionService.createForSale(sale.id, agentId, override);

      // Back-tag the listing so future sales of it auto-attribute
      if (sale.listingId) {
        await prisma.listing.update({
          where: { id: sale.listingId },
          data: { listingAgentId: agentId },
        });
      }

      res.json({ commission });
    } catch (error) {
      console.error('Error assigning agent:', error);
      res.status(500).json({ error: 'Failed to assign agent' });
    }
  }
);

// POST /api/v1/sales/:id/mark-house - no commission for this sale
router.post(
  '/:id/mark-house',
  roleMiddleware(['ADMIN', 'MANAGER']),
  async (req: AuthRequest, res: Response) => {
    try {
      const sale = await prisma.sale.findUnique({
        where: { id: req.params.id },
        include: { commission: true },
      });
      if (!sale) return res.status(404).json({ error: 'Sale not found' });
      if (sale.commission) {
        return res.status(409).json({ error: 'Sale already has a commission' });
      }
      const updated = await prisma.sale.update({
        where: { id: sale.id },
        data: { attributionStatus: AttributionStatus.HOUSE },
      });
      res.json({ sale: updated });
    } catch (error) {
      console.error('Error marking house sale:', error);
      res.status(500).json({ error: 'Failed to mark house sale' });
    }
  }
);

// POST /api/v1/sales/sync - manually trigger the eBay orders + listings sync
router.post(
  '/sync',
  roleMiddleware(['ADMIN', 'MANAGER']),
  async (_req: AuthRequest, res: Response) => {
    try {
      const { salesSyncService } = await import('../services/salesSync.service');
      const orders = await salesSyncService.syncAllAccounts();
      const listings = await salesSyncService.syncActiveListings();
      res.json({ orders, listings });
    } catch (error: any) {
      console.error('Error running manual sync:', error);
      res.status(502).json({ error: error?.message || 'Sync failed' });
    }
  }
);

// POST /api/v1/sales/import-csv?dryRun=true - Seller Hub order report import
router.post(
  '/import-csv',
  roleMiddleware(['ADMIN', 'MANAGER']),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { ebayAccountId } = req.body;
      if (!req.file) return res.status(400).json({ error: 'CSV file is required' });
      if (!ebayAccountId) {
        return res.status(400).json({ error: 'ebayAccountId is required' });
      }
      const dryRun = req.query.dryRun === 'true';
      const result = await csvImportService.importOrders(req.file.buffer, ebayAccountId, dryRun);
      res.json(result);
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      res.status(400).json({ error: error?.message || 'CSV import failed' });
    }
  }
);

export default router;
