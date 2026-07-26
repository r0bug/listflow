import { Router, Response } from 'express';
import {
  generateListing,
  createEbayListing,
  getListingHistory,
  getListingById
} from '../controllers/listing.controller';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { tagListingAgentSchema } from '../schemas/sales.schema';

const router = Router();

router.post('/generate', generateListing);
router.post('/create', createEbayListing);
router.get('/history', getListingHistory);

// PATCH /api/listings/:id/agent - tag/untag a listing agent (+ optional rate override)
router.patch(
  '/:id/agent',
  authMiddleware,
  roleMiddleware(['ADMIN', 'MANAGER']),
  validate(tagListingAgentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { agentId, commissionRateType, commissionRateValue } = req.body;
      const listing = await prisma.listing.update({
        where: { id: req.params.id },
        data: {
          listingAgentId: agentId,
          ...(commissionRateType !== undefined ? { commissionRateType } : {}),
          ...(commissionRateValue !== undefined ? { commissionRateValue } : {}),
        },
        include: { listingAgent: { select: { id: true, name: true } } },
      });
      res.json({ listing });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      console.error('Error tagging listing agent:', error);
      res.status(500).json({ error: 'Failed to tag listing agent' });
    }
  }
);

router.get('/:id', getListingById);

export default router;
