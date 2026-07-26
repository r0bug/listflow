// Sold-comps ingest + query (comptool's /comp/api contract, unified).
//
//   POST /ingest   machine (extension scrapers): bulk upsert comps for a
//                  keyword; creates a Search row with price stats
//   GET  /         staff/machine: list/filter comps
//   GET  /stats    staff/machine: price stats for a keyword (avg/median/p25/p75)
//
// Progressive enrichment: repeated scrapes only overwrite fields they
// actually carry (comps.service.upsertComp).

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { machineAuth, staffOrMachine } from '../middleware/auth.js';
import { upsertComp } from '../services/comps.service.js';
import { qstr } from '../util/req.js';

const router = Router();

const IngestItemSchema = z.object({
  ebayItemId: z.string().min(1),
  title: z.string().min(1),
  soldPrice: z.coerce.number().optional().nullable(),
  shippingPrice: z.coerce.number().optional().nullable(),
  totalPrice: z.coerce.number().optional().nullable(),
  condition: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  listingType: z.string().optional().nullable(),
  bidCount: z.coerce.number().int().optional().nullable(),
  quantitySold: z.coerce.number().int().optional().nullable(),
  totalSales: z.coerce.number().optional().nullable(),
  watchers: z.coerce.number().int().optional().nullable(),
  seller: z.string().optional().nullable(),
  sellerFeedback: z.coerce.number().int().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  itemUrl: z.string().optional().nullable(),
  soldDate: z.string().optional().nullable(),
});

const IngestSchema = z.object({
  keyword: z.string().min(1).max(300),
  source: z.string().max(40).default('extension'),
  items: z.array(IngestItemSchema).min(1).max(500),
});

router.post('/ingest', machineAuth, async (req, res) => {
  const parsed = IngestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { keyword, source, items } = parsed.data;

  let newCount = 0;
  let existingCount = 0;
  const compIds: number[] = [];
  for (const it of items) {
    const before = await prisma.soldComp.findUnique({ where: { ebayItemId: it.ebayItemId }, select: { id: true } });
    const comp = await upsertComp(prisma, {
      ebayItemId: it.ebayItemId,
      title: it.title,
      soldPrice: it.soldPrice ?? undefined,
      shippingPrice: it.shippingPrice ?? undefined,
      totalPrice: it.totalPrice ?? undefined,
      soldDate: it.soldDate ?? undefined,
      condition: it.condition ?? undefined,
      category: it.category ?? undefined,
      itemUrl: it.itemUrl ?? undefined,
      sellerName: it.seller ?? undefined,
      source,
    });
    // Fields upsertComp doesn't cover (scraper-only metrics) — patch directly.
    await prisma.soldComp.update({
      where: { id: comp.id },
      data: {
        listingType: it.listingType ?? undefined,
        bidCount: it.bidCount ?? undefined,
        quantitySold: it.quantitySold ?? undefined,
        totalSales: it.totalSales ?? undefined,
        watchers: it.watchers ?? undefined,
        sellerFeedback: it.sellerFeedback ?? undefined,
        imageUrl: it.imageUrl ?? undefined,
      },
    });
    compIds.push(comp.id);
    if (before) existingCount++;
    else newCount++;
  }

  const prices = items.map((i) => i.soldPrice).filter((p): p is number => p != null && p > 0).sort((a, b) => a - b);
  const stats = prices.length
    ? {
        count: prices.length,
        min: prices[0],
        max: prices[prices.length - 1],
        avg: Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)),
        median: prices[Math.floor(prices.length / 2)],
      }
    : { count: 0, min: null, max: null, avg: null, median: null };

  const search = await prisma.search.create({
    data: {
      keyword,
      source,
      resultCount: items.length,
      avgPrice: stats.avg,
      medianPrice: stats.median,
      minPrice: stats.min,
      maxPrice: stats.max,
      comps: { create: compIds.map((compId) => ({ compId })) },
    },
  });

  res.json({ searchId: search.id, resultCount: items.length, newCount, existingCount, stats });
});

router.get('/', staffOrMachine, async (req, res) => {
  const q = qstr(req.query.q);
  const take = Math.min(Number(qstr(req.query.limit)) || 100, 500);
  const comps = await prisma.soldComp.findMany({
    where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { soldDate: 'desc' },
    take,
  });
  res.json({ comps });
});

router.get('/stats', staffOrMachine, async (req, res) => {
  const q = qstr(req.query.q);
  if (!q) {
    res.status(400).json({ error: 'q required' });
    return;
  }
  const rows = await prisma.$queryRawUnsafe<
    { count: bigint; avg: number | null; min: number | null; max: number | null; p25: number | null; p50: number | null; p75: number | null }[]
  >(
    `SELECT count(*) as count, avg("soldPrice") as avg, min("soldPrice") as min, max("soldPrice") as max,
            percentile_cont(0.25) WITHIN GROUP (ORDER BY "soldPrice") as p25,
            percentile_cont(0.50) WITHIN GROUP (ORDER BY "soldPrice") as p50,
            percentile_cont(0.75) WITHIN GROUP (ORDER BY "soldPrice") as p75
     FROM "SoldComp" WHERE "soldPrice" IS NOT NULL AND title ILIKE $1`,
    `%${q}%`,
  );
  const r = rows[0]!;
  res.json({ keyword: q, count: Number(r.count), avg: r.avg, min: r.min, max: r.max, p25: r.p25, median: r.p50, p75: r.p75 });
});

router.get('/searches', staffOrMachine, async (_req, res) => {
  const searches = await prisma.search.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ searches });
});

// Server-cached comp thumbnail (offline field bundles precache these).
// First hit downloads from eBay into FILE_ROOT/comps/<id>.jpg and records
// SoldComp.localImage; later hits stream the local copy — pick sites keep
// working when eBay's CDN is unreachable.
router.get('/:id/thumb', staffOrMachine, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'bad id' });
    return;
  }
  const comp = await prisma.soldComp.findUnique({ where: { id } });
  if (!comp) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { absPath, ensureDirFor } = await import('../util/paths.js');

  let rel = comp.localImage;
  if (!rel || !fs.existsSync(absPath(rel))) {
    if (!comp.imageUrl) {
      res.status(404).json({ error: 'No image for this comp' });
      return;
    }
    try {
      const sharp = (await import('sharp')).default;
      const resp = await fetch(comp.imageUrl, { signal: AbortSignal.timeout(15000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const buf = Buffer.from(await resp.arrayBuffer());
      rel = path.join('comps', `${comp.id}.jpg`);
      const abs = absPath(rel);
      ensureDirFor(abs);
      await sharp(buf)
        .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 78 })
        .toFile(abs);
      await prisma.soldComp.update({ where: { id }, data: { localImage: rel } });
    } catch {
      res.status(502).json({ error: 'image fetch failed' });
      return;
    }
  }
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=604800, immutable');
  fs.createReadStream(absPath(rel)).pipe(res);
});

export default router;
