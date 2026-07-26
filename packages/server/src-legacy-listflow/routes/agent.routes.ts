import { Router, Response } from 'express';
import { prisma } from '../config/database';
import { authMiddleware, AuthRequest, roleMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createAgentSchema, updateAgentSchema } from '../schemas/sales.schema';
import { agentSyncService } from '../services/agentSync.service';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/agents - list agents (all authed users; needed for tagging dropdowns)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const agents = await prisma.listingAgent.findMany({
      where: includeInactive ? {} : { active: true },
      orderBy: { name: 'asc' },
    });
    res.json({ agents });
  } catch (error) {
    console.error('Error listing agents:', error);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// POST /api/v1/agents - create a manual agent
router.post(
  '/',
  roleMiddleware(['ADMIN', 'MANAGER']),
  validate(createAgentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const agent = await prisma.listingAgent.create({
        data: { ...req.body, source: 'manual' },
      });
      res.status(201).json({ agent });
    } catch (error) {
      console.error('Error creating agent:', error);
      res.status(500).json({ error: 'Failed to create agent' });
    }
  }
);

// PATCH /api/v1/agents/:id - update name/email/rate/active
router.patch(
  '/:id',
  roleMiddleware(['ADMIN', 'MANAGER']),
  validate(updateAgentSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const agent = await prisma.listingAgent.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ agent });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        return res.status(404).json({ error: 'Agent not found' });
      }
      console.error('Error updating agent:', error);
      res.status(500).json({ error: 'Failed to update agent' });
    }
  }
);

// POST /api/v1/agents/sync - pull staff from TeamTime now
router.post(
  '/sync',
  roleMiddleware(['ADMIN', 'MANAGER']),
  async (_req: AuthRequest, res: Response) => {
    try {
      const result = await agentSyncService.syncAgents();
      res.json(result);
    } catch (error: any) {
      console.error('Error syncing agents:', error);
      res.status(502).json({ error: error?.message || 'Agent sync failed' });
    }
  }
);

export default router;
