// Copies optimized photos into the human-browsable per-item folder
// (photos/items/YYYY/<slug>/imageN.jpg — Standards §4) and writes the URL
// back onto Photo.publicUrl. These are exactly the URLs the extension's
// autofill payload advertises to eBay drafts.

import fs from 'node:fs';
import path from 'node:path';
import slugify from 'slugify';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { absPath, ensureDirFor, itemImagesRelDir } from '../util/paths.js';

export interface HostedPhoto {
  photoId: string;
  publicUrl: string;
}

export function makeSlug(title: string | null | undefined, idSuffix: string): string {
  const base = slugify(title || 'item', { lower: true, strict: true }).slice(0, 60);
  return `${base || 'item'}-${idSuffix}`;
}

export async function hostItemImages(itemId: string): Promise<HostedPhoto[]> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: { orderBy: { order: 'asc' } } },
  });
  if (!item) throw new Error('Item not found');
  if (item.photos.length === 0) return [];

  const slug = makeSlug(item.title, item.id.slice(-8));
  const relDir = itemImagesRelDir(slug, item.createdAt);
  const urlDir = relDir.split(path.sep).slice(2).join('/'); // strip "photos/items/"

  const out: HostedPhoto[] = [];
  for (let i = 0; i < item.photos.length; i++) {
    const photo = item.photos[i]!;
    const sourceRel = photo.optimizedPath || photo.originalPath;
    if (!sourceRel) continue;
    const sourceAbs = absPath(sourceRel);
    if (!fs.existsSync(sourceAbs)) continue;

    const filename = `image${i + 1}.jpg`;
    const destAbs = absPath(path.join(relDir, filename));
    ensureDirFor(destAbs);
    fs.copyFileSync(sourceAbs, destAbs);

    const publicUrl = `${env.PUBLIC_IMAGE_BASE_URL}/i/${urlDir}/${filename}`;
    await prisma.photo.update({ where: { id: photo.id }, data: { publicUrl } });
    out.push({ photoId: photo.id, publicUrl });
  }
  return out;
}

/** URL the autofill payload should advertise. cdnUrl wins when configured. */
export function resolvePhotoUrl(p: { cdnUrl: string | null; publicUrl: string | null }): string | null {
  return p.cdnUrl ?? p.publicUrl ?? null;
}
