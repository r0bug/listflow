// Endpoints that power the eBay draft-resume flow used by content-draft.js
// and content-drafts-list.js in the extension.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { machineAuth, staffOrMachine, staffAuth } from '../middleware/auth.js';
import { buildAutofillPayload, buildDeltaPayload } from '../services/draft.service.js';
import { qstr, pstr } from '../util/req.js';
import type { Prisma } from '../generated/prisma/index.js';

const router = Router();

// GET /api/v1/drafts — list latest drafts with their linked Item (web UI).
router.get('/', staffAuth, async (req, res) => {
  const cursor = qstr(req.query.cursor);
  const take = Math.min(Number(qstr(req.query.limit)) || 50, 200);

  const drafts = await prisma.ebayDraft.findMany({
    include: {
      item: { select: { id: true, title: true, brand: true } },
    },
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { lastSeenAt: 'desc' },
  });

  const nextCursor = drafts.length > take ? drafts.pop()?.id ?? null : null;
  res.json({ drafts, nextCursor });
});

// GET /api/v1/drafts/by-url?url=…
router.get('/by-url', machineAuth, async (req, res) => {
  const url = qstr(req.query.url);
  if (!url) {
    res.status(400).json({ error: 'url query required' });
    return;
  }
  const draft = await prisma.ebayDraft.findFirst({
    where: { ebayDraftUrl: url },
    include: { item: true },
  });
  if (!draft) {
    res.status(404).json({ error: 'Draft not linked' });
    return;
  }
  const autofill = await buildAutofillPayload(draft.itemId, draft.id);
  const { item, ...draftCore } = draft;
  res.json({ draft: draftCore, item, autofill });
});

router.get('/by-ebay-id/:ebayDraftId', machineAuth, async (req, res) => {
  const draft = await prisma.ebayDraft.findUnique({
    where: { ebayDraftId: pstr(req.params.ebayDraftId) },
    include: { item: true },
  });
  if (!draft) {
    res.status(404).json({ error: 'Draft not linked' });
    return;
  }
  const autofill = await buildAutofillPayload(draft.itemId, draft.id);
  const { item, ...draftCore } = draft;
  res.json({ draft: draftCore, item, autofill });
});

// PATCH /api/v1/drafts/:id — heartbeat from content-draft.js + submission flip.
const PatchSchema = z.object({
  currentValues: z.record(z.unknown()).optional(),
  lastFilledFields: z.array(z.string()).optional(),
  status: z.enum(['OPEN', 'SUBMITTED', 'ABANDONED', 'UNKNOWN']).optional(),
  ebayItemId: z.string().optional(),
});

router.patch('/:id', staffOrMachine, async (req, res) => {
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { ebayItemId, currentValues, lastFilledFields, status } = parsed.data;
  const draft = await prisma.ebayDraft.update({
    where: { id: pstr(req.params.id) },
    data: {
      status,
      currentValues: currentValues as unknown as Prisma.InputJsonValue | undefined,
      lastFilledFields: lastFilledFields as unknown as Prisma.InputJsonValue | undefined,
      lastSeenAt: new Date(),
      lastFilledAt: lastFilledFields ? new Date() : undefined,
    },
  });

  if (ebayItemId && status === 'SUBMITTED') {
    await prisma.item.update({
      where: { id: draft.itemId },
      data: {
        ebayItemId,
        ebayListingUrl: `https://www.ebay.com/itm/${ebayItemId}`,
        status: 'LISTED',
        stage: 'READY',
      },
    });
  }

  res.json(draft);
});

// POST /api/v1/drafts/import — the INBOUND path: adopt an eBay draft that was
// authored in Seller Hub rather than filled from an Item. See §3d of
// docs/PHASE1-DESIGN.md. Two operations behind one endpoint:
//   itemId given   → LINK   (attach the draft to an existing Item)
//   itemId absent  → IMPORT (create an Item from the draft's own fields)
const ScrapedSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().optional(),
  brand: z.string().max(200).optional(),
  condition: z.string().max(100).optional(),
  categoryId: z.string().max(50).optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  customLabel: z.string().max(200).optional(),
  photoUrls: z.array(z.string().url()).max(50).optional(),
});

const ImportSchema = z.object({
  ebayDraftUrl: z.string().url(),
  ebayDraftId: z.string().max(100).optional(),
  ebayAccountId: z.string().optional(),
  itemId: z.string().optional(),
  scraped: ScrapedSchema.optional(),
});

// "<SKU>|<LOC>" is what we stamp into Custom Label at draft time (Standards §6).
// Only re-adopt a SKU when the label round-trips that exact shape — anything
// else is a seller's own free text and must not squat Item.sku (@unique).
function parseCustomLabel(label?: string): { sku?: string; locationCode?: string } {
  if (!label) return {};
  const m = /^([A-Za-z0-9][A-Za-z0-9._-]*)\|([A-Za-z0-9][A-Za-z0-9._/-]*)$/.exec(label.trim());
  if (!m) return {};
  return { sku: m[1], locationCode: m[2] };
}

router.post('/import', staffOrMachine, async (req, res) => {
  const parsed = ImportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { ebayDraftUrl, ebayDraftId, ebayAccountId, itemId, scraped } = parsed.data;

  // 1. Idempotency. The drafts-list page fires one call per row; a re-scan or a
  //    double-click must return the existing linkage, never mint a second Item.
  const existing = await prisma.ebayDraft.findFirst({
    where: ebayDraftId ? { OR: [{ ebayDraftId }, { ebayDraftUrl }] } : { ebayDraftUrl },
    include: { item: true },
  });
  if (existing) {
    const { item, ...draftCore } = existing;
    res.json({ draft: draftCore, item, created: false, linked: false });
    return;
  }

  // 2. Resolve the Item: link to the caller's choice, or create one from the draft.
  let item;
  let created = false;

  if (itemId) {
    item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }
  } else {
    const { sku, locationCode } = parseCustomLabel(scraped?.customLabel);
    // Re-adopting our own SKU is only safe if no live Item already holds it.
    const skuTaken = sku ? await prisma.item.findUnique({ where: { sku } }) : null;

    item = await prisma.item.create({
      data: {
        title: scraped?.title ?? null,
        description: scraped?.description ?? null,
        brand: scraped?.brand ?? null,
        condition: scraped?.condition ?? null,
        ebayCategoryId: scraped?.categoryId ?? null,
        buyNowPrice: scraped?.price ?? null,
        sku: skuTaken ? null : sku ?? null,
        locationCode: locationCode ?? null,
        ebayAccountId: ebayAccountId ?? null,
        // Quarantined on purpose: no photos, no AI, no comps. It must not land
        // in a "ready to list" queue just because eBay already has fields.
        status: 'DRAFT',
        stage: 'DRAFT_STARTED',
      },
    });
    created = true;
  }

  // 3. Link. Scraped values go into currentValues verbatim so the delta engine
  //    sees what is actually on the eBay form and fills only genuine gaps.
  const draft = await prisma.ebayDraft.create({
    data: {
      itemId: item.id,
      ebayDraftId: ebayDraftId ?? null,
      ebayDraftUrl,
      ebayAccountId: ebayAccountId ?? null,
      status: 'OPEN',
      lastSeenAt: new Date(),
      currentValues: (scraped ?? {}) as unknown as Prisma.InputJsonValue,
      notes: created ? 'Imported from an eBay-authored draft' : 'Linked to an existing Item',
    },
  });

  res.status(201).json({ draft, item, created, linked: !created });
});

// POST /api/v1/drafts/:id/resume — returns the delta autofill payload.
router.post('/:id/resume', machineAuth, async (req, res) => {
  const delta = await buildDeltaPayload(pstr(req.params.id));
  res.json(delta);
});

export default router;
