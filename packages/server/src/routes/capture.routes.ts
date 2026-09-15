// Capturing live eBay listings through the extension.
// docs/PHASE2-INVENTORY-AUDIT.md §6 Phase 2.2.
//
// Everything here is machine-auth: the caller is always a content script on an
// eBay page, never the web app.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { machineAuth } from '../middleware/auth.js';
import { pstr } from '../util/req.js';
import { captureListing } from '../services/listingCapture.service.js';
import { composeCustomLabel } from '../services/sku.service.js';

const router = Router();

const CaptureSchema = z.object({
  ebayItemId: z.string().regex(/^\d{8,}$/, 'ebayItemId must be a numeric eBay item id'),
  title: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  categoryPath: z.string().optional(),
  condition: z.string().optional(),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  itemSpecifics: z.record(z.string()).optional(),
  imageUrls: z.array(z.string().url()).max(48).optional(),
  price: z.number().nonnegative().optional(),
  sellerName: z.string().optional(),
  sourceAccountName: z.string().optional(),
  raw: z.unknown().optional(),
});

// POST /api/v1/capture/listing — "copy the listing I'm looking at".
router.post('/listing', machineAuth, async (req, res) => {
  const parsed = CaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const result = await captureListing(parsed.data);
  res.status(result.created ? 201 : 200).json(result);
});

// GET /api/v1/capture/status/:ebayItemId — what the on-page bar reads to
// render itself: have we seen this listing, and does it have a shelf yet?
// Deliberately cheap: this fires on every eBay item page the operator opens.
router.get('/status/:ebayItemId', machineAuth, async (req, res) => {
  const ebayItemId = pstr(req.params.ebayItemId);
  const item = await prisma.item.findFirst({
    where: { OR: [{ sourceEbayItemId: ebayItemId }, { ebayItemId }] },
    select: {
      id: true,
      sku: true,
      title: true,
      locationCode: true,
      capturedAt: true,
      status: true,
      sourceEbayItemId: true,
      ebayItemId: true,
      _count: { select: { photos: true } },
    },
  });

  if (!item) {
    res.json({ captured: false });
    return;
  }

  res.json({
    captured: true,
    item: {
      id: item.id,
      sku: item.sku,
      title: item.title,
      locationCode: item.locationCode,
      capturedAt: item.capturedAt,
      status: item.status,
      photoCount: item._count.photos,
    },
    customLabel: item.sku ? composeCustomLabel(item.sku, item.locationCode) : null,
  });
});

// GET /api/v1/capture/relist-queue?account=<accountName>
// Saved listings whose source account is NOT the one asking — i.e. the work
// waiting for THIS Chrome profile. The extension knows only its own pinned
// account (§1a), so the filter is the account name it sends.
router.get('/relist-queue', machineAuth, async (req, res) => {
  const accountName = typeof req.query.account === 'string' ? req.query.account : '';
  const target = accountName
    ? await prisma.ebayAccount.findFirst({
        where: { accountName: { equals: accountName, mode: 'insensitive' } },
      })
    : null;

  const items = await prisma.item.findMany({
    where: {
      capturedAt: { not: null },
      status: { notIn: ['LISTED', 'SOLD', 'ARCHIVED'] },
      // Not already sourced from the asking account: those need a revise, not
      // a relist. An unknown account name falls through to "show everything
      // captured", which is the safe direction — the operator can see it.
      ...(target ? { NOT: { sourceEbayAccountId: target.id } } : {}),
    },
    select: {
      id: true,
      sku: true,
      title: true,
      brand: true,
      locationCode: true,
      capturedAt: true,
      completeness: true,
      _count: { select: { photos: true } },
    },
    orderBy: { capturedAt: 'desc' },
    take: 200,
  });

  res.json({
    account: target?.accountName ?? null,
    items: items.map((i) => ({
      ...i,
      photoCount: i._count.photos,
      customLabel: i.sku ? composeCustomLabel(i.sku, i.locationCode) : null,
      _count: undefined,
    })),
  });
});

export default router;
