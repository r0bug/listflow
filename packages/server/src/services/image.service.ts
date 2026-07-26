// Sharp-based image processing on the Standards §4 storage layout.
// storeOriginal() copies the master into photos/originals/YYYY/MM/<sha16>.<ext>
// (immutable, append-only); processImage() writes the regenerable variants to
// photos/derived/<sha16>.opt.jpg|.thumb.jpg. All returned paths are
// FILE_ROOT-relative — exactly what the Photo row stores.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { absPath, derivedRelPaths, ensureDirFor, originalRelPath } from '../util/paths.js';

export interface ProcessedImage {
  optimizedPath: string; // relative
  thumbnailPath: string; // relative
  width: number;
  height: number;
  bytes: number;
  mime: string;
}

const OPTIMIZED_LONG_EDGE = 1500;
const THUMBNAIL_LONG_EDGE = 400;
const QUALITY_OPTIMIZED = 85;
const QUALITY_THUMBNAIL = 70;

/** Copy the source file into the immutable originals tree. Content-named, so
 *  an existing destination is already the same bytes — skip silently. */
export function storeOriginal(
  sourceAbsPath: string,
  sha256: string,
  capturedAt?: Date | null,
): string {
  const rel = originalRelPath(sha256, path.extname(sourceAbsPath), capturedAt);
  const dest = absPath(rel);
  if (!fs.existsSync(dest)) {
    ensureDirFor(dest);
    fs.copyFileSync(sourceAbsPath, dest);
  }
  return rel;
}

/** Produce optimized + thumbnail variants keyed by content hash. */
export async function processImage(sourceAbsPath: string, sha256: string): Promise<ProcessedImage> {
  const rel = derivedRelPaths(sha256);
  const optimizedAbs = absPath(rel.optimized);
  const thumbnailAbs = absPath(rel.thumbnail);
  ensureDirFor(optimizedAbs);

  const meta = await sharp(sourceAbsPath).metadata();

  await sharp(sourceAbsPath)
    .rotate() // honor EXIF orientation
    .resize(OPTIMIZED_LONG_EDGE, OPTIMIZED_LONG_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY_OPTIMIZED, mozjpeg: true })
    .toFile(optimizedAbs);

  await sharp(sourceAbsPath)
    .rotate()
    .resize(THUMBNAIL_LONG_EDGE, THUMBNAIL_LONG_EDGE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY_THUMBNAIL })
    .toFile(thumbnailAbs);

  const stat = fs.statSync(optimizedAbs);

  return {
    optimizedPath: rel.optimized,
    thumbnailPath: rel.thumbnail,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    bytes: stat.size,
    mime: 'image/jpeg',
  };
}
