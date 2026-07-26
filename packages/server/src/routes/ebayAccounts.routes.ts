// eBay seller-account management (admin/manager). OAuth token wiring for the
// read paths (sales sync, Browse) is grafted in the next work block; drafts
// publishing never needs API tokens (Standards §6).

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { staffAuth, requireRole } from '../middleware/auth.js';
import { pstr } from '../util/req.js';

const router = Router();

router.get('/', staffAuth, async (_req, res) => {
  const accounts = await prisma.ebayAccount.findMany({
    select: {
      id: true,
      accountName: true,
      email: true,
      siteId: true,
      sandbox: true,
      isActive: true,
      tokenExpiresAt: true,
      ordersSyncedThrough: true,
      postalCode: true,
      createdAt: true,
      _count: { select: { sales: true, items: true, drafts: true } },
    },
    orderBy: { accountName: 'asc' },
  });
  res.json({ accounts });
});

const AccountSchema = z.object({
  accountName: z.string().min(1),
  email: z.string().email().optional(),
  siteId: z.number().int().default(0),
  postalCode: z.string().optional(),
  sandbox: z.boolean().default(false),
});

router.post('/', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  const parsed = AccountSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const account = await prisma.ebayAccount.create({ data: parsed.data });
  res.status(201).json(account);
});

router.patch('/:id', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  const parsed = AccountSchema.partial().extend({ isActive: z.boolean().optional() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const account = await prisma.ebayAccount.update({
    where: { id: pstr(req.params.id) },
    data: parsed.data,
  });
  res.json(account);
});

export default router;
