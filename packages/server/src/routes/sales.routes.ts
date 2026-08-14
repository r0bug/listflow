// Sales ledger routes.
//
//   GET   /            staff: list/filter sales
//   POST  /import      staff: Seller Hub Orders CSV (multipart, ?dryRun=1);
//                      original archived under FILE_ROOT/imports/
//   PATCH /:id/attribution  staff: set lister / consignor / mark HOUSE
//   POST  /bulk-attribution staff: same, across up to 1000 sales at once
//   GET   /listers          staff: eBay-cleared staff, for the lister picker
//   GET   /consignment-groups staff: proxied from TeamTime's registry
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
import { earningsImportService } from '../services/earningsImport.service.js';
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

// eBay "Order earnings" report — enriches fees/refunds on existing sales.
router.post('/import-earnings', staffAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'multipart field "file" required (Order earnings CSV)' });
    return;
  }
  const accountId = (req.body?.ebayAccountId as string) || qstr(req.query.ebayAccountId);
  if (!accountId) {
    res.status(400).json({ error: 'ebayAccountId required' });
    return;
  }
  const dryRun = qstr(req.query.dryRun) === '1' || req.body?.dryRun === 'true';
  const createMissing = qstr(req.query.createMissing) === '1' || req.body?.createMissing === 'true';
  const result = await earningsImportService.importEarnings(req.file.buffer, accountId, dryRun, createMissing);
  if (!dryRun) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const name = `${stamp}-${accountId.slice(-6)}-${(req.file.originalname || 'earnings.csv').replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
    fs.writeFileSync(path.join(importsDirAbs(), name), req.file.buffer);
  }
  res.json(result);
});

const AttributionSchema = z.object({
  listedById: z.string().nullable().optional(),
  house: z.boolean().optional(),
  // TeamTime-owned registry id (Standards §3) — stored as an opaque
  // reference; the settlement service resolves it on its side.
  consignmentGroupId: z.string().nullable().optional(),
});

/**
 * Attribution is three-state and the consignor is orthogonal to the lister:
 * a HOUSE sale can still belong to a consignment group, and a group-less
 * sale can still be credited to a lister. Callers that omit a key leave
 * that side untouched; explicit null clears it.
 */
function attributionData(input: z.infer<typeof AttributionSchema>) {
  const data: {
    attributionStatus?: 'PENDING' | 'ATTRIBUTED' | 'HOUSE';
    listedById?: string | null;
    consignmentGroupId?: string | null;
  } = {};

  if (input.house) {
    data.attributionStatus = 'HOUSE';
    data.listedById = null;
  } else if (input.listedById) {
    data.attributionStatus = 'ATTRIBUTED';
    data.listedById = input.listedById;
  } else if (input.listedById === null) {
    data.attributionStatus = 'PENDING';
    data.listedById = null;
  }

  if (input.consignmentGroupId !== undefined) {
    data.consignmentGroupId = input.consignmentGroupId;
  }
  return data;
}

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
    data: attributionData(parsed.data),
  });
  res.json(updated);
});

// Bulk attribution — the import backlog is thousands of rows deep, so the
// per-sale PATCH above is not a usable clearing path.
const BulkAttributionSchema = AttributionSchema.extend({
  saleIds: z.array(z.string()).min(1).max(1000),
});

router.post('/bulk-attribution', staffAuth, async (req, res) => {
  const parsed = BulkAttributionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { saleIds, ...attribution } = parsed.data;
  const data = attributionData(attribution);
  if (Object.keys(data).length === 0) {
    res.status(400).json({ error: 'Nothing to change: supply listedById, house, or consignmentGroupId' });
    return;
  }

  const result = await prisma.sale.updateMany({ where: { id: { in: saleIds } }, data });
  res.json({ ok: true, updated: result.count, requested: saleIds.length });
});

// Pickers for the assignment UI ─────────────────────────────────────────

// Listers = staff cleared to list on eBay. Sourced from the TeamTime
// roster sync; `manual` rows are included so a one-off lister still works.
router.get('/listers', staffAuth, async (_req, res) => {
  const listers = await prisma.staffUser.findMany({
    where: { active: true, canListOnEbay: true },
    select: { id: true, name: true, email: true, teamtimeUserId: true },
    orderBy: { name: 'asc' },
  });
  res.json({ listers });
});

// Consignment groups live in TeamTime (Standards §3); ListFlow only ever
// holds the id. Proxied so the UI has one origin and no second credential.
router.get('/consignment-groups', staffAuth, async (_req, res) => {
  if (!env.TEAMTIME_URL || !env.TEAMTIME_API_SECRET) {
    res.json({ groups: [], source: 'unconfigured' });
    return;
  }
  try {
    const upstream = await fetch(`${env.TEAMTIME_URL}/api/ebay/groups`, {
      headers: { Authorization: `Bearer ${env.TEAMTIME_API_SECRET}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      res.status(502).json({ error: `TeamTime returned ${upstream.status}`, groups: [] });
      return;
    }
    const body = (await upstream.json()) as { groups?: unknown[] } | unknown[];
    const groups = Array.isArray(body) ? body : (body.groups ?? []);
    res.json({ groups, source: 'teamtime' });
  } catch (err) {
    // Never hard-fail the page: assignment of listers must still work
    // when TeamTime is unreachable.
    res.status(502).json({ error: (err as Error).message, groups: [] });
  }
});

// Manual API-sync trigger (staff) — runs all connected accounts now.
router.post('/sync', staffAuth, async (_req, res) => {
  const { salesSyncService } = await import('../services/salesSync.service.js');
  const results = await salesSyncService.syncAllAccounts();
  res.json({ results });
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
        refunds: s.refunds,
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
