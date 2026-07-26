// Sales ledger routes.
//
//   GET   /            staff: list/filter sales
//   POST  /import      staff: Seller Hub Orders CSV (multipart, ?dryRun=1);
//                      original archived under FILE_ROOT/imports/
//   PATCH /:id/attribution  staff: set lister / mark HOUSE
//   GET   /feed        M2M for TeamTime (bearer LISTFLOW_API_SECRET) —
//                      enriched with lister teamtimeUserId, consignment
//                      group, promoted flag, tax; commission math happens
//                      in TeamTime (Standards §3).

import { Router, type RequestHandler } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { staffAuth } from '../middleware/auth.js';
import { salesImportService, parseCustomLabel } from '../services/salesImport.service.js';
import { importsDirAbs } from '../util/paths.js';
import { qstr, pstr } from '../util/req.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', staffAuth, async (req, res) => {
  const accountId = qstr(req.query.accountId);
  const status = qstr(req.query.attributionStatus);
  const days = Number(qstr(req.query.days)) || 90;
  const take = Math.min(Number(qstr(req.query.limit)) || 100, 500);

  const sales = await prisma.sale.findMany({
    where: {
      ebayAccountId: accountId || undefined,
      attributionStatus:
        status === 'PENDING' || status === 'ATTRIBUTED' || status === 'HOUSE' ? status : undefined,
      soldAt: { gte: new Date(Date.now() - days * 24 * 3600 * 1000) },
    },
    include: {
      ebayAccount: { select: { accountName: true } },
      listedBy: { select: { id: true, name: true, teamtimeUserId: true } },
      item: { select: { id: true, sku: true, locationCode: true } },
    },
    orderBy: { soldAt: 'desc' },
    take,
  });

  const totals = sales.reduce(
    (acc, s) => {
      acc.gross += s.itemPrice * s.quantity;
      return acc;
    },
    { gross: 0, count: sales.length },
  );
  res.json({ sales, totals });
});

router.post('/import', staffAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'multipart field "file" required (Seller Hub Orders CSV)' });
    return;
  }
  const accountId = (req.body?.ebayAccountId as string) || qstr(req.query.ebayAccountId);
  if (!accountId) {
    res.status(400).json({ error: 'ebayAccountId required' });
    return;
  }
  const dryRun = qstr(req.query.dryRun) === '1' || req.body?.dryRun === 'true';

  const result = await salesImportService.importOrders(req.file.buffer, accountId, dryRun);

  if (!dryRun) {
    // Archive the source report (Standards §5) — PII lives here, not in the DB.
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const name = `${stamp}-${accountId.slice(-6)}-${(req.file.originalname || 'orders.csv').replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    fs.writeFileSync(path.join(importsDirAbs(), name), req.file.buffer);
  }
  res.json(result);
});

const AttributionSchema = z.object({
  listedById: z.string().nullable().optional(),
  house: z.boolean().optional(),
});

router.patch('/:id/attribution', staffAuth, async (req, res) => {
  const parsed = AttributionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const sale = await prisma.sale.findUnique({ where: { id: pstr(req.params.id) } });
  if (!sale) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const updated = await prisma.sale.update({
    where: { id: sale.id },
    data: parsed.data.house
      ? { attributionStatus: 'HOUSE', listedById: null }
      : parsed.data.listedById
        ? { attributionStatus: 'ATTRIBUTED', listedById: parsed.data.listedById }
        : { attributionStatus: 'PENDING', listedById: null },
  });
  res.json(updated);
});

// ── TeamTime feed (M2M) ────────────────────────────────────────────────

const feedAuth: RequestHandler = (req, res, next) => {
  const secret = env.LISTFLOW_API_SECRET;
  const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || !token || token !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

router.get('/feed', feedAuth, async (req, res) => {
  const days = Math.min(Number(qstr(req.query.days)) || 30, 365);
  const sales = await prisma.sale.findMany({
    where: { soldAt: { gte: new Date(Date.now() - days * 24 * 3600 * 1000) } },
    include: {
      ebayAccount: { select: { accountName: true } },
      listedBy: { select: { id: true, name: true, teamtimeUserId: true } },
      item: { select: { sku: true, locationCode: true } },
    },
    orderBy: { soldAt: 'desc' },
    take: 2000,
  });

  res.json({
    generatedAt: new Date().toISOString(),
    days,
    sales: sales.map((s) => {
      const { sku, loc } = parseCustomLabel(s.customLabel);
      return {
        id: s.id,
        ebayOrderId: s.ebayOrderId,
        lineItemId: s.lineItemId,
        salesRecordNumber: s.salesRecordNumber,
        account: s.ebayAccount.accountName,
        title: s.title,
        sku: s.item?.sku ?? sku,
        locationCode: s.item?.locationCode ?? loc,
        quantity: s.quantity,
        itemPrice: s.itemPrice,
        shippingPrice: s.shippingPrice,
        taxAmount: s.taxAmount,
        totalPrice: s.totalPrice,
        fees: s.fees,
        promoted: s.promoted,
        currency: s.currency,
        soldAt: s.soldAt,
        attributionStatus: s.attributionStatus,
        listedBy: s.listedBy
          ? { id: s.listedBy.id, name: s.listedBy.name, teamtimeUserId: s.listedBy.teamtimeUserId }
          : null,
        consignmentGroupId: s.consignmentGroupId,
      };
    }),
  });
});

export default router;
