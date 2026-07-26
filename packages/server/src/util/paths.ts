// FILE_ROOT-relative pathing (fleet Standards §4).
//
// Every file the suite owns lives under FILE_ROOT; the DB stores paths
// RELATIVE to it. Layout (docs/PHASE1-DESIGN.md §3c):
//
//   photos/originals/YYYY/MM/<sha16>.<ext>   immutable masters (append-only)
//   photos/derived/<sha16>.opt.jpg|.thumb.jpg  regenerable variants
//   photos/items/YYYY/<item-slug>/imageN.jpg   human-browsable, hosted to eBay
//   sales/<accountName>/<orderId>-<line>.jpg   sale thumbnails
//   imports/                                  archived source reports
//   inbox/                                    transient working area

import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env.js';

export const FILE_ROOT = path.resolve(env.FILE_ROOT);

/** Absolute path for a FILE_ROOT-relative DB path. Passes absolutes through
 *  (tolerates legacy rows / external inbox paths). */
export function absPath(rel: string): string {
  return path.isAbsolute(rel) ? rel : path.resolve(FILE_ROOT, rel);
}

/** FILE_ROOT-relative form of an absolute path (what we store in the DB). */
export function relPath(abs: string): string {
  return path.isAbsolute(abs) ? path.relative(FILE_ROOT, abs) : abs;
}

export function ensureDirFor(absFile: string): void {
  fs.mkdirSync(path.dirname(absFile), { recursive: true });
}

const sha16 = (sha256: string) => sha256.slice(0, 16);

/** Immutable master destination, sharded by capture date (ingest-date fallback). */
export function originalRelPath(sha256: string, sourceExt: string, when?: Date | null): string {
  const d = when ?? new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const ext = (sourceExt || '.jpg').toLowerCase().replace(/^\.?/, '.');
  return path.join('photos', 'originals', yyyy, mm, `${sha16(sha256)}${ext}`);
}

/** Regenerable variant destinations. */
export function derivedRelPaths(sha256: string): { optimized: string; thumbnail: string } {
  const base = path.join('photos', 'derived', sha16(sha256));
  return { optimized: `${base}.opt.jpg`, thumbnail: `${base}.thumb.jpg` };
}

/** Human-browsable per-item hosted-image folder. */
export function itemImagesRelDir(slug: string, when?: Date | null): string {
  const yyyy = String((when ?? new Date()).getFullYear());
  return path.join('photos', 'items', yyyy, slug);
}

export function salesRelPath(accountName: string, orderId: string, line: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9._-]+/g, '_');
  return path.join('sales', safe(accountName), `${safe(orderId)}-${safe(line)}.jpg`);
}

export function importsDirAbs(): string {
  const p = path.join(FILE_ROOT, 'imports');
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function inboxDirAbs(): string {
  const p = path.join(FILE_ROOT, 'inbox');
  fs.mkdirSync(p, { recursive: true });
  return p;
}
