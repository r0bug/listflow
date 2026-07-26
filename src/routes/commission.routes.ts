import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { commissionReportQuerySchema, markPaidSchema } from '../schemas/sales.schema';
import { CommissionStatus, Prisma } from '../generated/prisma';

const router = Router();

function saleDateFilter(from?: string, to?: string): Prisma.CommissionWhereInput {
  if (!from && !to) return {};
  return {
    sale: {
      soldAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      },
    },
  };
}

// GET /api/v1/commissions/payroll - machine-to-machine endpoint for TeamTime.
// Registered BEFORE authMiddleware; guarded by its own bearer secret.
router.get('/payroll', async (req: Request, res: Response) => {
  try {
    const secret = process.env.LISTFLOW_API_SECRET;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!secret || !token || token !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { from, to } = req.query as Record<string, string>;
    const where = saleDateFilter(from, to);

    const agents = await prisma.listingAgent.findMany({
      where: { commissions: { some: where } },
      include: { commissions: { where, include: { sale: { select: { soldAt: true } } } } },
    });

    res.json({
      agents: agents.map((agent) => ({
        agentId: agent.id,
        teamtimeUserId: agent.teamtimeUserId,
        name: agent.name,
        salesCount: agent.commissions.length,
        totalCommission: round2(sum(agent.commissions.map((c) => c.amount))),
        unpaid: round2(
          sum(agent.commissions.filter((c) => c.status === CommissionStatus.PENDING).map((c) => c.amount))
        ),
      })),
    });
  } catch (error) {
    console.error('Error building payroll report:', error);
    res.status(500).json({ error: 'Failed to build payroll report' });
  }
});

router.use(authMiddleware);

// GET /api/v1/commissions/report?from&to&agentId - per-agent totals + rows
router.get(
  '/report',
  validate(commissionReportQuerySchema, 'query'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { from, to, agentId } = req.query as Record<string, string>;
      const where: Prisma.CommissionWhereInput = {
        ...saleDateFilter(from, to),
        ...(agentId ? { agentId } : {}),
      };

      const commissions = await prisma.commission.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true, rateType: true, rateValue: true } },
          sale: {
            select: {
              id: true,
              title: true,
              soldAt: true,
              itemPrice: true,
              quantity: true,
              ebayOrderId: true,
              imageUrl: true,
              thumbnailPath: true,
              ebayAccount: { select: { accountName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const byAgent = new Map<string, any>();
      for (const c of commissions) {
        const entry = byAgent.get(c.agentId) || {
          agent: c.agent,
          salesCount: 0,
          totalBasis: 0,
          totalCommission: 0,
          paidAmount: 0,
          unpaidAmount: 0,
        };
        entry.salesCount++;
        entry.totalBasis += c.basis;
        entry.totalCommission += c.amount;
        if (c.status === CommissionStatus.PAID) entry.paidAmount += c.amount;
        else entry.unpaidAmount += c.amount;
        byAgent.set(c.agentId, entry);
      }
      const agentTotals = [...byAgent.values()]
        .map((entry) => ({
          ...entry,
          totalBasis: round2(entry.totalBasis),
          totalCommission: round2(entry.totalCommission),
          paidAmount: round2(entry.paidAmount),
          unpaidAmount: round2(entry.unpaidAmount),
        }))
        .sort((a, b) => b.totalCommission - a.totalCommission);

      res.json({ agentTotals, commissions });
    } catch (error) {
      console.error('Error building commission report:', error);
      res.status(500).json({ error: 'Failed to build commission report' });
    }
  }
);

// POST /api/v1/commissions/mark-paid - bulk pay an agent's pending commissions
router.post(
  '/mark-paid',
  roleMiddleware(['ADMIN', 'MANAGER']),
  validate(markPaidSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { agentId, through } = req.body;
      const { count } = await prisma.commission.updateMany({
        where: {
          agentId,
          status: CommissionStatus.PENDING,
          ...(through ? { sale: { soldAt: { lte: new Date(through) } } } : {}),
        },
        data: { status: CommissionStatus.PAID, paidAt: new Date() },
      });
      res.json({ paid: count });
    } catch (error) {
      console.error('Error marking commissions paid:', error);
      res.status(500).json({ error: 'Failed to mark commissions paid' });
    }
  }
);

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default router;
