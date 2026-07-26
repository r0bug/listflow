// Field collections (pick prep) — docs/PHASE1-DESIGN.md.
// Build a named set of sold comps before a pick ("Ford Model A parts"),
// take it offline in the field PWA, browse as a visual grid with sales
// data at the pick site, and flag finds to seed listing stubs.
//
//   GET    /              list collections
//   POST   /              create {name, q?, compIds?} — q links matching comps
//   GET    /:id           detail with comps
//   GET    /:id/bundle    offline bundle (comps + stats + thumb URLs)
//   POST   /:id/flag      {compId, flagged} — flag → seeds an Item stub
//   DELETE /:id

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { staffAuth } from '../middleware/auth.js';
import { qstr, pstr } from '../util/req.js';

const router = Router();

router.get('/', staffAuth, async (_req, res) => {
  const collections = await prisma.collection.findMany({
    include: {
      owner: { select: { id: true, name: true } },
      _count: { select: { comps: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      owner: c.owner?.name ?? null,
      compCount: c._count.comps,
      snapshotAt: c.snapshotAt,
      updatedAt: c.updatedAt,
    })),
  });
});

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  q: z.string().max(300).optional(), // title keyword match builds the set
  compIds: z.array(z.number().int()).max(2000).optional(),
});

router.post('/', staffAuth, async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { name, q, compIds } = parsed.data;

  let ids = compIds ?? [];
  if (q) {
    // Every word must appear in the title (simple AND match).
    const words = q.split(/\s+/).filter(Boolean);
    const matched = await prisma.soldComp.findMany({
      where: { AND: words.map((w) => ({ title: { contains: w, mode: 'insensitive' as const } })) },
      select: { id: true },
      take: 2000,
    });
    ids = [...new Set([...ids, ...matched.map((m) => m.id)])];
  }
  if (ids.length === 0) {
    res.status(400).json({ error: 'No comps matched — scrape some sold listings first.' });
    return;
  }

  const collection = await prisma.collection.create({
    data: {
      name,
      query: q ? { q } : undefined,
      ownerId: req.staff!.id,
      comps: { create: ids.map((compId) => ({ compId })) },
    },
  });
  res.status(201).json({ id: collection.id, name: collection.name, compCount: ids.length });
});

router.get('/:id', staffAuth, async (req, res) => {
  const collection = await prisma.collection.findUnique({
    where: { id: pstr(req.params.id) },
    include: { comps: { include: { comp: true } } },
  });
  if (!collection) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(collection);
});

/** The offline bundle: everything the field PWA needs, one JSON. Thumb URLs
 *  point at /api/v1/comps/:id/thumb (server-cached copies — Standards §4). */
router.get('/:id/bundle', staffAuth, async (req, res) => {
  const collection = await prisma.collection.findUnique({
    where: { id: pstr(req.params.id) },
    include: {
      comps: {
        include: { comp: true },
        orderBy: { comp: { soldPrice: 'desc' } },
      },
    },
  });
  if (!collection) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const comps = collection.comps.map((link) => ({
    id: link.comp.id,
    title: link.comp.title,
    soldPrice: link.comp.soldPrice,
    shippingPrice: link.comp.shippingPrice,
    condition: link.comp.condition,
    category: link.comp.category,
    soldDate: link.comp.soldDate,
    listingType: link.comp.listingType,
    itemUrl: link.comp.itemUrl,
    flagged: link.flaggedForListing,
    thumb: link.comp.imageUrl || link.comp.localImage ? `/api/v1/comps/${link.comp.id}/thumb` : null,
  }));

  const prices = comps.map((c) => c.soldPrice).filter((p): p is number => p != null && p > 0).sort((a, b) => a - b);
  const stats = prices.length
    ? {
        count: prices.length,
        min: prices[0],
        max: prices[prices.length - 1],
        avg: Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)),
        median: prices[Math.floor(prices.length / 2)],
      }
    : { count: 0, min: null, max: null, avg: null, median: null };

  const bundle = { id: collection.id, name: collection.name, snapshotAt: collection.snapshotAt, stats, comps };
  await prisma.collection.update({
    where: { id: collection.id },
    data: { bundleBytes: JSON.stringify(bundle).length },
  });
  res.json(bundle);
});

const FlagSchema = z.object({ compId: z.number().int(), flagged: z.boolean() });

router.post('/:id/flag', staffAuth, async (req, res) => {
  const parsed = FlagSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const collectionId = pstr(req.params.id);
  const { compId, flagged } = parsed.data;

  const link = await prisma.collectionComp.update({
    where: { collectionId_compId: { collectionId, compId } },
    data: { flaggedForListing: flagged },
    include: { comp: true },
  });

  // Flag → seed an item stub (once): title/category/price prior from the
  // comp, waiting in the pool flow for photos when the find comes home.
  let itemId: string | null = null;
  if (flagged) {
    const existing = await prisma.itemComp.findFirst({
      where: { compId, item: { sourceFolder: '(field-flag)' } },
      select: { itemId: true },
    });
    if (existing) {
      itemId = existing.itemId;
    } else {
      const item = await prisma.item.create({
        data: {
          title: link.comp.title,
          category: link.comp.categoryPath ?? link.comp.category,
          condition: link.comp.condition,
          buyNowPrice: link.comp.soldPrice ?? undefined,
          sourceFolder: '(field-flag)',
          createdById: req.staff!.id,
          aiAnalysis: { source: 'field-flag', compId, collectionId } as object,
        },
      });
      await prisma.itemComp.create({ data: { itemId: item.id, compId, isPrimary: true } });
      itemId = item.id;
    }
  }

  res.json({ ok: true, flagged, itemId });
});

router.delete('/:id', staffAuth, async (req, res) => {
  await prisma.collection.delete({ where: { id: pstr(req.params.id) } });
  res.json({ ok: true });
});

export default router;
