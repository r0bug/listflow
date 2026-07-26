import { Router } from 'express';
import { z } from 'zod';
import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { prisma } from '../db/prisma.js';
import { staffAuth, machineAuth, staffOrMachine } from '../middleware/auth.js';
import { absPath } from '../util/paths.js';
import { buildAutofillPayload } from '../services/draft.service.js';
import { processImage, storeOriginal } from '../services/image.service.js';
import { upsertCompAndLink, moveItemComps } from '../services/comps.service.js';
import { computeCompleteness } from '../util/completeness.js';
import { sha256File } from '../util/sha256.js';
import { perceptualHash } from '../util/perceptualHash.js';
import { logger } from '../util/logger.js';
import { qstr, pstr } from '../util/req.js';
import type { Prisma } from '../generated/prisma/index.js';

const router = Router();

const ItemStatuses = ['IN_PROCESS', 'DRAFT', 'READY', 'LISTED', 'SOLD', 'ARCHIVED'] as const;
const ItemStages = ['INGESTED', 'GROUPED', 'IDENTIFIED', 'MATCHED', 'DRAFT_STARTED', 'READY'] as const;
type ItemStatus = (typeof ItemStatuses)[number];
type ItemStage = (typeof ItemStages)[number];

// ── List + read ────────────────────────────────────────────────────────

router.get('/', staffAuth, async (req, res) => {
  const status = qstr(req.query.status);
  const stage = qstr(req.query.stage);
  const q = qstr(req.query.q);
  const cursor = qstr(req.query.cursor);
  const take = Math.min(Number(qstr(req.query.limit)) || 50, 200);

  const items = await prisma.item.findMany({
    where: {
      status: status && ItemStatuses.includes(status as ItemStatus) ? (status as ItemStatus) : undefined,
      stage: stage && ItemStages.includes(stage as ItemStage) ? (stage as ItemStage) : undefined,
      title: q ? { contains: q, mode: 'insensitive' } : undefined,
    },
    include: {
      photos: { take: 1, where: { isPrimary: true } },
      _count: { select: { photos: true, comps: true, drafts: true } },
    },
    take: take + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { updatedAt: 'desc' },
  });

  const nextCursor = items.length > take ? items.pop()?.id : null;
  res.json({ items, nextCursor });
});

router.get('/:id', staffAuth, async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: pstr(req.params.id) },
    include: {
      photos: { orderBy: { order: 'asc' } },
      comps: { include: { comp: true }, orderBy: { linkedAt: 'desc' } },
      drafts: { orderBy: { lastSeenAt: 'desc' } },
    },
  });
  if (!item) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(item);
});

// ── Update ─────────────────────────────────────────────────────────────

const ItemPatchSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  category: z.string().optional(),
  ebayCategoryId: z.string().optional(),
  condition: z.string().optional(),
  conditionId: z.number().int().optional(),
  features: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  itemSpecifics: z.record(z.unknown()).optional(),
  upc: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  mpn: z.string().nullable().optional(),
  startingPrice: z.number().optional(),
  buyNowPrice: z.number().optional(),
  shippingPrice: z.number().optional(),
  weightOz: z.number().optional(),
  packageDimensions: z.object({ length: z.number(), width: z.number(), height: z.number() }).optional(),
  listingFormat: z.string().optional(),
  listingDuration: z.string().optional(),
  postalCode: z.string().optional(),
  status: z.enum(ItemStatuses).optional(),
  stage: z.enum(ItemStages).optional(),
  ebayItemId: z.string().optional(),
  ebayListingUrl: z.string().optional(),
});

router.patch('/:id', staffAuth, async (req, res) => {
  const parsed = ItemPatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const data = parsed.data as Prisma.ItemUpdateInput;
  const updated = await prisma.item.update({
    where: { id: pstr(req.params.id) },
    data,
    include: { photos: { select: { id: true } } },
  });
  const report = computeCompleteness({ ...updated, hasPhotos: updated.photos.length > 0 });
  await prisma.item.update({
    where: { id: updated.id },
    data: { completeness: report as unknown as Prisma.InputJsonValue },
  });
  res.json({ ...updated, completeness: report });
});

// ── Photos ────────────────────────────────────────────────────────────

router.post('/:id/photos/reorder', staffAuth, async (req, res) => {
  const { photoIds } = req.body as { photoIds?: string[] };
  if (!Array.isArray(photoIds)) {
    res.status(400).json({ error: 'photoIds must be an array' });
    return;
  }
  await prisma.$transaction(
    photoIds.map((pid, idx) => prisma.photo.update({ where: { id: pid }, data: { order: idx } })),
  );
  res.json({ ok: true });
});

router.post('/:id/photos/:photoId/primary', staffAuth, async (req, res) => {
  const id = pstr(req.params.id);
  const photoId = pstr(req.params.photoId);
  await prisma.$transaction([
    prisma.photo.updateMany({ where: { itemId: id }, data: { isPrimary: false } }),
    prisma.photo.update({ where: { id: photoId }, data: { isPrimary: true } }),
  ]);
  res.json({ ok: true });
});

router.delete('/:id/photos/:photoId', staffAuth, async (req, res) => {
  await prisma.photo.delete({ where: { id: pstr(req.params.photoId) } });
  res.json({ ok: true });
});

// ── Autofill payload (extension reads this) ───────────────────────────

router.get('/:id/autofill', machineAuth, async (req, res) => {
  const payload = await buildAutofillPayload(pstr(req.params.id));
  res.json(payload);
});

// ── Sold-comp link (extension posts here from content-sold/detail) ────

const SoldCompLinkSchema = z.object({
  ebayItemId: z.string(),
  soldPrice: z.number().optional(),
  soldDate: z.string().optional(),
  currency: z.string().default('USD'),
  categoryId: z.string().optional(),
  categoryPath: z.string().optional(),
  condition: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  itemSpecifics: z.record(z.unknown()).optional(),
  imageUrls: z.array(z.string()).default([]),
  sellerName: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

router.post('/:id/sold-comp-link', machineAuth, async (req, res) => {
  const parsed = SoldCompLinkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const itemId = pstr(req.params.id);
  const link = await upsertCompAndLink(prisma, itemId, {
    ...parsed.data,
    source: 'extension',
  });

  // Backfill null Item fields from this comp.
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (item) {
    const merge: Prisma.ItemUpdateInput = {};
    if (!item.category && parsed.data.categoryPath) merge.category = parsed.data.categoryPath;
    if (!item.ebayCategoryId && parsed.data.categoryId) merge.ebayCategoryId = parsed.data.categoryId;
    if (!item.condition && parsed.data.condition) merge.condition = parsed.data.condition;
    if (!item.description && parsed.data.description) merge.description = parsed.data.description;
    if (
      item.itemSpecifics === null &&
      parsed.data.itemSpecifics &&
      Object.keys(parsed.data.itemSpecifics).length > 0
    ) {
      merge.itemSpecifics = parsed.data.itemSpecifics as unknown as Prisma.InputJsonValue;
    }
    if (Object.keys(merge).length > 0) {
      await prisma.item.update({ where: { id: itemId }, data: merge });
    }
  }

  res.json({ ok: true, link });
});

// ── Import from active eBay listing (extension posts here) ───────────
// Differs from sold-comp-link: caller has explicitly chosen this active
// listing as the source of truth, so we OVERWRITE the supplied Item
// fields rather than only filling nulls. Each field is independently
// opt-in on the extension's approval modal — if it's not in the body,
// it isn't touched. itemSpecifics merges with what's already there.
// Description has its own append/overwrite mode. Approved imageUrls
// are downloaded and attached as Photos linked to the Item.

const ImportFromActiveSchema = z.object({
  ebayItemId: z.string().optional(),
  title: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  category: z.string().optional(),
  ebayCategoryId: z.string().optional(),
  condition: z.string().optional(),
  conditionId: z.number().int().optional(),
  features: z.array(z.string()).optional(),
  itemSpecifics: z.record(z.string()).optional(),
  description: z.string().optional(),
  descriptionMode: z.enum(['overwrite', 'append']).default('overwrite'),
  imageUrls: z.array(z.string().url()).optional(),
});

async function downloadAndAttachImage(itemId: string, url: string): Promise<string | null> {
  // Fetch → tmp file → processImage (uses sharp pipeline, identical to ingest).
  // sha256-based dedup: if any Photo with this hash already exists, link or skip.
  let tmpPath: string | null = null;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (path.extname(new URL(url).pathname) || '.jpg').toLowerCase();
    tmpPath = path.join(os.tmpdir(), `swiftlist-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    await fsp.writeFile(tmpPath, buf);
    const sha256 = await sha256File(tmpPath);
    const existing = await prisma.photo.findUnique({ where: { sha256 } });
    if (existing) {
      // Already in DB. If unattached or attached elsewhere, claim for this item only when free.
      if (existing.itemId === null) {
        await prisma.photo.update({ where: { id: existing.id }, data: { itemId } });
      }
      return existing.id;
    }
    const phash = await perceptualHash(tmpPath).catch(() => null);
    const originalRel = storeOriginal(tmpPath, sha256);
    const processed = await processImage(tmpPath, sha256);
    const photo = await prisma.photo.create({
      data: {
        itemId,
        originalPath: originalRel,
        optimizedPath: processed.optimizedPath,
        thumbnailPath: processed.thumbnailPath,
        sha256,
        perceptualHash: phash,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
        mime: processed.mime,
        source: 'EBAY_IMPORT',
      },
    });
    await fsp.unlink(tmpPath).catch(() => undefined);
    return photo.id;
  } catch (err) {
    logger.warn({ err, url }, 'import-from-active: image download failed');
    if (tmpPath) await fsp.unlink(tmpPath).catch(() => undefined);
    return null;
  }
}

router.post('/:id/import-from-active', machineAuth, async (req, res) => {
  const parsed = ImportFromActiveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const itemId = pstr(req.params.id);
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const d = parsed.data;

  const merge: Prisma.ItemUpdateInput = {};
  if (d.title !== undefined) merge.title = d.title;
  if (d.brand !== undefined) merge.brand = d.brand;
  if (d.model !== undefined) merge.model = d.model;
  if (d.category !== undefined) merge.category = d.category;
  if (d.ebayCategoryId !== undefined) merge.ebayCategoryId = d.ebayCategoryId;
  if (d.condition !== undefined) merge.condition = d.condition;
  if (d.conditionId !== undefined) merge.conditionId = d.conditionId;
  if (d.features !== undefined) merge.features = d.features;
  if (d.ebayItemId !== undefined) merge.ebayItemId = d.ebayItemId;

  if (d.itemSpecifics && Object.keys(d.itemSpecifics).length > 0) {
    const existing =
      (item.itemSpecifics && typeof item.itemSpecifics === 'object' && !Array.isArray(item.itemSpecifics)
        ? (item.itemSpecifics as Record<string, unknown>)
        : {}) ?? {};
    merge.itemSpecifics = { ...existing, ...d.itemSpecifics } as unknown as Prisma.InputJsonValue;
  }

  if (d.description !== undefined) {
    merge.description =
      d.descriptionMode === 'append' && item.description
        ? `${item.description}\n\n${d.description}`
        : d.description;
  }

  // Promote IN_PROCESS → DRAFT once the user has picked & approved a source.
  // Don't downgrade items that are already further along.
  if (item.status === 'IN_PROCESS') merge.status = 'DRAFT';

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: merge,
    include: { photos: { select: { id: true } } },
  });

  const importedPhotoIds: string[] = [];
  if (d.imageUrls && d.imageUrls.length > 0) {
    for (const url of d.imageUrls) {
      const photoId = await downloadAndAttachImage(itemId, url);
      if (photoId) importedPhotoIds.push(photoId);
    }
  }

  const finalItem = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: { select: { id: true } } },
  });
  if (finalItem) {
    const report = computeCompleteness({ ...finalItem, hasPhotos: finalItem.photos.length > 0 });
    await prisma.item.update({
      where: { id: itemId },
      data: { completeness: report as unknown as Prisma.InputJsonValue },
    });
  }

  res.json({
    ok: true,
    item: { id: updated.id, title: updated.title },
    importedPhotoIds,
    skippedImages: (d.imageUrls?.length ?? 0) - importedPhotoIds.length,
  });
});

// ── Photo → eBay image search ─────────────────────────────────────────
// Sends the photo's optimized/original bytes (base64, sharp-resized) to
// eBay Browse API's /item_summary/search_by_image and returns the raw
// item summaries. These are ACTIVE listings, not sold ones — use them to
// identify the item, then pivot to the existing sold-comps flow.

import sharp from 'sharp';
import { searchByImage, ebayBrowseConfigured } from '../services/ebayBrowse.service.js';

router.post('/photo/:photoId/image-search', staffOrMachine, async (req, res) => {
  if (!ebayBrowseConfigured()) {
    res.status(503).json({ error: 'EBAY_BROWSE_CLIENT_ID / _SECRET not configured in server env' });
    return;
  }
  const photoId = pstr(req.params.photoId);
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { optimizedPath: true, originalPath: true },
  });
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }
  const source = photo.optimizedPath ?? photo.originalPath;
  if (!source) {
    res.status(422).json({ error: 'Photo has no stored file path' });
    return;
  }
  try {
    // eBay rejects extremely large payloads; resize to 1024 longedge + JPEG.
    const buf = await sharp(source)
      .rotate()
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    const base64 = buf.toString('base64');
    const limit = Math.min(Math.max(Number((req.body as { limit?: number } | undefined)?.limit) || 20, 1), 50);
    const data = await searchByImage(base64, { limit });
    res.json({
      itemSummaries: data.itemSummaries ?? [],
      total: data.total ?? data.itemSummaries?.length ?? 0,
    });
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

// ── Photo thumbnail / file stream ─────────────────────────────────────
// Used by the web UI as a fallback when a Photo has no publicUrl / cdnUrl
// (or while that hosting step is still pending). Reads the file directly
// from disk using whichever of thumbnailPath → optimizedPath → originalPath
// is first readable, and streams it.

import fs from 'node:fs';

router.get('/photo/:photoId/thumb', staffOrMachine, async (req, res) => {
  const photoId = pstr(req.params.photoId);
  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    select: { thumbnailPath: true, optimizedPath: true, originalPath: true, mime: true },
  });
  if (!photo) {
    res.status(404).json({ error: 'Photo not found' });
    return;
  }
  const candidates = [photo.thumbnailPath, photo.optimizedPath, photo.originalPath]
    .filter((p): p is string => !!p)
    .map((p) => absPath(p));
  const filePath = candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  if (!filePath) {
    res.status(404).json({ error: 'No readable photo file on disk' });
    return;
  }
  res.setHeader('Content-Type', photo.mime || 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=300');
  fs.createReadStream(filePath).pipe(res);
});

// ── Merge + photo move ────────────────────────────────────────────────

router.post('/:id/merge-into', staffAuth, async (req, res) => {
  const sourceId = pstr(req.params.id);
  const targetId = (req.body as { targetId?: string } | undefined)?.targetId;
  if (!targetId || typeof targetId !== 'string') {
    res.status(400).json({ error: 'targetId required' });
    return;
  }
  if (targetId === sourceId) {
    res.status(400).json({ error: 'Cannot merge item into itself' });
    return;
  }
  const [source, target] = await Promise.all([
    prisma.item.findUnique({ where: { id: sourceId } }),
    prisma.item.findUnique({ where: { id: targetId } }),
  ]);
  if (!source || !target) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const merged = await prisma.$transaction(async (tx) => {
    await tx.photo.updateMany({ where: { itemId: sourceId }, data: { itemId: targetId } });
    await tx.photoGroup.updateMany({ where: { itemId: sourceId }, data: { itemId: targetId } });
    await moveItemComps(tx, sourceId, targetId);
    await tx.ebayDraft.updateMany({ where: { itemId: sourceId }, data: { itemId: targetId } });
    await tx.ingestEvent.updateMany({ where: { itemId: sourceId }, data: { itemId: targetId } });
    await tx.item.update({
      where: { id: targetId },
      data: { aiCost: { increment: Number(source.aiCost) } },
    });
    await tx.item.delete({ where: { id: sourceId } });
    const updated = await tx.item.findUnique({
      where: { id: targetId },
      include: { photos: { select: { id: true } } },
    });
    return updated!;
  });

  const report = computeCompleteness({ ...merged, hasPhotos: merged.photos.length > 0 });
  await prisma.item.update({
    where: { id: targetId },
    data: { completeness: report as unknown as Prisma.InputJsonValue },
  });
  res.json({ ok: true, mergedInto: targetId });
});

const MovePhotosSchema = z.object({
  photoIds: z.array(z.string().min(1)).min(1),
  targetItemId: z.string().min(1),
});

router.post('/:id/photos/move', staffAuth, async (req, res) => {
  const sourceId = pstr(req.params.id);
  const parsed = MovePhotosSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { photoIds, targetItemId } = parsed.data;
  if (targetItemId === sourceId) {
    res.status(400).json({ error: 'Source and target are the same item' });
    return;
  }
  const target = await prisma.item.findUnique({ where: { id: targetItemId } });
  if (!target) {
    res.status(404).json({ error: 'Target item not found' });
    return;
  }
  const moved = await prisma.photo.updateMany({
    where: { id: { in: photoIds }, itemId: sourceId },
    data: { itemId: targetItemId, isPrimary: false },
  });

  // Recompute completeness for both items (source may be photoless now).
  for (const id of [sourceId, targetItemId]) {
    const item = await prisma.item.findUnique({
      where: { id },
      include: { photos: { select: { id: true } } },
    });
    if (!item) continue;
    const report = computeCompleteness({ ...item, hasPhotos: item.photos.length > 0 });
    await prisma.item.update({
      where: { id },
      data: { completeness: report as unknown as Prisma.InputJsonValue },
    });
  }
  res.json({ ok: true, moved: moved.count });
});

// ── Drafts for an item ────────────────────────────────────────────────

router.get('/:id/drafts', staffOrMachine, async (req, res) => {
  const drafts = await prisma.ebayDraft.findMany({
    where: { itemId: pstr(req.params.id) },
    orderBy: { lastSeenAt: 'desc' },
  });
  res.json(drafts);
});

const CreateDraftSchema = z.object({
  ebayDraftId: z.string().optional(),
  ebayDraftUrl: z.string().min(1),
  accountHint: z.string().optional(),
  currentValues: z.record(z.unknown()).optional(),
});

router.post('/:id/drafts', machineAuth, async (req, res) => {
  const parsed = CreateDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const itemId = pstr(req.params.id);
  const cv = parsed.data.currentValues as unknown as Prisma.InputJsonValue | undefined;
  // Resolve the extension's account hint (profile-pinned accountName) to an
  // EbayAccount row; unmatched hints are kept visible in notes.
  const account = parsed.data.accountHint
    ? await prisma.ebayAccount.findFirst({
        where: { accountName: { equals: parsed.data.accountHint, mode: 'insensitive' } },
      })
    : null;
  const noteHint =
    parsed.data.accountHint && !account ? `accountHint:${parsed.data.accountHint}` : undefined;
  const draft = await prisma.ebayDraft.upsert({
    where: parsed.data.ebayDraftId
      ? { ebayDraftId: parsed.data.ebayDraftId }
      : { id: '__never__' },
    create: {
      itemId,
      ebayDraftId: parsed.data.ebayDraftId ?? null,
      ebayDraftUrl: parsed.data.ebayDraftUrl,
      ebayAccountId: account?.id ?? null,
      notes: noteHint,
      currentValues: cv,
    },
    update: {
      itemId,
      ebayDraftUrl: parsed.data.ebayDraftUrl,
      ebayAccountId: account?.id ?? undefined,
      notes: noteHint,
      currentValues: cv,
      lastSeenAt: new Date(),
    },
  });
  await prisma.item.update({
    where: { id: itemId },
    data: { stage: 'DRAFT_STARTED' },
  });
  res.status(201).json(draft);
});

export default router;
