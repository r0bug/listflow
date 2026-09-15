// Capturing a LIVE eBay listing into an Item (docs/PHASE2-INVENTORY-AUDIT.md
// §6 Phase 2.2).
//
// This is the half of the copy/relist tool that has to be right the first
// time: once the source listing is ended its page is gone, so anything this
// misses is gone with it. Hence
//   - capturedPayload stores the VERBATIM scrape, so a parsing miss stays
//     recoverable without revisiting the page;
//   - photos are downloaded and re-hosted here, not merely linked, because
//     i.ebayimg.com URLs do not outlive the listing indefinitely;
//   - the result carries explicit warnings, which are what the relist gate
//     reads before anyone is told it is safe to end the original.

import os from 'node:os';
import path from 'node:path';
import fsp from 'node:fs/promises';
import { prisma } from '../db/prisma.js';
import { processImage, storeOriginal } from './image.service.js';
import { sha256File } from '../util/sha256.js';
import { perceptualHash } from '../util/perceptualHash.js';
import { computeCompleteness } from '../util/completeness.js';
import { logger } from '../util/logger.js';
import { ensureItemSku } from './sku.service.js';
import type { Prisma } from '../generated/prisma/index.js';

export interface CaptureInput {
  ebayItemId: string;
  title?: string;
  brand?: string;
  model?: string;
  categoryPath?: string;
  condition?: string;
  description?: string;
  descriptionHtml?: string;
  itemSpecifics?: Record<string, string>;
  imageUrls?: string[];
  price?: number;
  sellerName?: string;
  /** accountName of the eBay account this Chrome profile is pinned to. */
  sourceAccountName?: string;
  /** The whole scrape, exactly as the content script saw it. */
  raw?: unknown;
}

export interface CaptureResult {
  item: { id: string; sku: string | null; title: string | null; locationCode: string | null };
  /** false = this eBay listing was already held; the existing Item was updated. */
  created: boolean;
  photosAdded: number;
  photosFailed: number;
  /** Fields refreshed from the page on a re-capture. */
  refreshed?: string[];
  /** Fields the scrape came back empty for, where the stored value was kept. */
  keptFromBefore?: string[];
  warnings: string[];
}

export async function downloadAndAttachImage(itemId: string, url: string): Promise<string | null> {
  // Fetch → tmp file → processImage (uses sharp pipeline, identical to ingest).
  // sha256-based dedup: if any Photo with this hash already exists, link or skip.
  let tmpPath: string | null = null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
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
    logger.warn({ err, url, itemId }, 'listing image download failed');
    if (tmpPath) await fsp.unlink(tmpPath).catch(() => undefined);
    return null;
  }
}

/**
 * Creates (or refreshes) an Item from a scraped live listing.
 *
 * Idempotent on ebayItemId: capturing the same listing twice returns the same
 * Item rather than duplicating it, because an operator re-opening a page they
 * already did is the normal case, not an error.
 */
export async function captureListing(input: CaptureInput): Promise<CaptureResult> {
  const existing = await prisma.item.findFirst({
    where: { sourceEbayItemId: input.ebayItemId },
  });

  const sourceAccount = input.sourceAccountName
    ? await prisma.ebayAccount.findFirst({
        where: { accountName: { equals: input.sourceAccountName, mode: 'insensitive' } },
      })
    : null;

  const description = input.description?.trim() || undefined;
  const specifics = input.itemSpecifics && Object.keys(input.itemSpecifics).length
    ? (input.itemSpecifics as unknown as Prisma.InputJsonValue)
    : undefined;

  const core = {
    title: input.title?.slice(0, 200),
    description,
    brand: input.brand,
    model: input.model,
    category: input.categoryPath,
    condition: input.condition,
    itemSpecifics: specifics,
    buyNowPrice: input.price != null ? String(input.price) : undefined,
    sourceEbayItemId: input.ebayItemId,
    sourceEbayAccountId: sourceAccount?.id ?? null,
    capturedAt: new Date(),
    capturedPayload: (input.raw ?? null) as Prisma.InputJsonValue,
  };

  let item;
  let created = false;
  const refreshed: string[] = [];
  const keptFromBefore: string[] = [];

  if (existing) {
    // RE-CAPTURE of a listing we already hold. Update in place — never a
    // second row. Two things are deliberately protected:
    //
    //  1. locationCode and sku are absent from `core`, so a re-copy can never
    //     move an item off its shelf or invalidate a printed label.
    //  2. A field the scraper FAILED to read this time must not wipe a good
    //     value we already have. eBay changes its markup, and a selector that
    //     silently returns '' would otherwise turn a re-copy into data loss —
    //     exactly what happened to itemSpecifics on 2026-09-14. Empty never
    //     beats non-empty.
    const guarded: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(core)) {
      const incomingEmpty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '') ||
        (typeof value === 'object' &&
          value !== null &&
          !(value instanceof Date) &&
          Object.keys(value as object).length === 0);

      const prior = (existing as unknown as Record<string, unknown>)[key];
      const priorEmpty =
        prior === undefined ||
        prior === null ||
        (typeof prior === 'string' && (prior as string).trim() === '');

      if (incomingEmpty && !priorEmpty) {
        keptFromBefore.push(key);
        continue; // keep what we already had
      }
      guarded[key] = value;
      if (!incomingEmpty && key !== 'capturedAt' && key !== 'capturedPayload') {
        refreshed.push(key);
      }
    }

    item = await prisma.item.update({
      where: { id: existing.id },
      data: guarded as Prisma.ItemUpdateInput,
    });
  } else {
    item = await prisma.item.create({
      data: { ...core, status: 'IN_PROCESS', stage: 'IDENTIFIED' },
    });
    created = true;
  }

  const sku = await ensureItemSku(item);

  // Photos. Only fetch what we do not already have for this item — re-capture
  // should not re-download a gallery every time.
  const photosBefore = await prisma.photo.count({ where: { itemId: item.id } });
  let photosFailed = 0;
  const urls = [...new Set(input.imageUrls ?? [])];
  for (const url of urls) {
    const photoId = await downloadAndAttachImage(item.id, url);
    if (!photoId) photosFailed++;
  }
  // Count the delta rather than the loop's successes: sha256 dedup means a
  // re-copy "succeeds" on photos it already had, and reporting "4 added" on a
  // re-copy that added nothing is a lie the operator would act on.
  const photosAfter = await prisma.photo.count({ where: { itemId: item.id } });
  const photosAdded = photosAfter - photosBefore;

  const withPhotos = await prisma.item.findUnique({
    where: { id: item.id },
    include: { photos: { select: { id: true } } },
  });
  const report = computeCompleteness({
    ...withPhotos!,
    hasPhotos: (withPhotos?.photos.length ?? 0) > 0,
  });
  await prisma.item.update({
    where: { id: item.id },
    data: { completeness: report as unknown as Prisma.InputJsonValue },
  });

  // These are the things that make a relist unrecoverable, so they are
  // surfaced loudly rather than left for someone to notice afterwards.
  const warnings: string[] = [];
  if (!description) {
    warnings.push(
      'No description captured — eBay serves it from a separate origin; check the extension has ebaydesc.com permission before ending this listing.',
    );
  }
  if ((withPhotos?.photos.length ?? 0) === 0) {
    warnings.push('No photos captured — do NOT end the source listing.');
  }
  if (photosFailed > 0) {
    warnings.push(`${photosFailed} image(s) failed to download.`);
  }
  if (!input.title) warnings.push('No title captured.');

  // The shelf is the entire point of the audit and the one field eBay cannot
  // tell us later — so it is nagged at capture, not left to be noticed.
  if (!item.locationCode) {
    warnings.push(
      'NO SHELF SET. Set one now — without it the Custom Label carries only the SKU and this item cannot be found on the floor.',
    );
  }

  if (!created && keptFromBefore.length) {
    warnings.push(
      `Re-copy: the page gave nothing for ${keptFromBefore.join(', ')} — kept the previously stored value. If that looks wrong, the scraper may need updating for a changed eBay layout.`,
    );
  }

  return {
    item: { id: item.id, sku, title: item.title, locationCode: item.locationCode },
    created,
    photosAdded,
    photosFailed,
    refreshed: created ? undefined : refreshed,
    keptFromBefore: created ? undefined : keptFromBefore,
    warnings,
  };
}
