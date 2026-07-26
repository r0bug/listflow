// Ingestion pipeline orchestrator — the ONE door all photo feeders use
// (docs/PHASE1-DESIGN.md §3): fleet-workstation watcher, synced folders,
// mobile-upload PWA, capture APK, eBay comp-image import.
//
//   feeder → POST /api/v1/ingest/photo (per file, with provenance context)
//   server queues by dirname, debounces 1500ms
//   on flush, per file:
//     sha256 → dedup check (idempotent — Standards §5)
//     exif + perceptualHash
//     copy master → photos/originals/YYYY/MM/<sha16>.<ext>
//     sharp variants → photos/derived/<sha16>.opt|.thumb.jpg
//     persist Photo with provenance (source, machine, user, groupHint)
//
// Photos land in the pool (unattached) unless the caller supplied:
//   itemId    → attach directly to that item
//   groupHint → find-or-create a PhotoGroup per (sourceFolder, groupHint) —
//               this is how capture-time "next item" grouping arrives.

import fs from 'node:fs';
import path from 'node:path';
import type { IngestSource, Prisma } from '../generated/prisma/index.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../util/logger.js';
import { sha256File } from '../util/sha256.js';
import { perceptualHash } from '../util/perceptualHash.js';
import { readExif, filenameNumericSuffix } from '../util/exif.js';
import { processImage, storeOriginal } from './image.service.js';

const DEBOUNCE_MS = 1500;

export interface IngestContext {
  source?: IngestSource;
  machineDbId?: string; // resolved Machine row id (from machine-key auth)
  uploadedById?: string; // StaffUser id (from JWT auth or uploadedForUserId)
  groupHint?: string; // capture-time grouping key
  itemId?: string; // attach directly to an existing item
  watchFolderId?: string;
  capturedAtOverride?: Date;
  deleteSourceAfterIngest?: boolean; // true for server-side temp uploads
}

interface PendingFile {
  path: string; // absolute path of the source file on this host
  ctx: IngestContext;
  arrivedAt: number;
}

export interface IngestStatus {
  pending: number;
  processing: number;
  totalQueued: number;
  totalProcessed: number;
  totalErrors: number;
  totalDuplicates: number;
  totalAiCalls: number;
  totalAiCostUsd: number;
  lastEventAt: string | null;
}

class IngestService {
  private byDir = new Map<string, { files: PendingFile[]; timer: NodeJS.Timeout }>();
  private status: IngestStatus = {
    pending: 0,
    processing: 0,
    totalQueued: 0,
    totalProcessed: 0,
    totalErrors: 0,
    totalDuplicates: 0,
    totalAiCalls: 0,
    totalAiCostUsd: 0,
    lastEventAt: null,
  };

  getStatus(): IngestStatus {
    return { ...this.status };
  }

  private bump<K extends keyof IngestStatus>(key: K, by: IngestStatus[K] extends number ? number : never) {
    (this.status[key] as number) = (this.status[key] as number) + (by as number);
    this.status.lastEventAt = new Date().toISOString();
  }

  enqueue(filePath: string, ctx: IngestContext = {}): { jobId: string } {
    const dir = path.dirname(filePath);
    const entry =
      this.byDir.get(dir) ??
      (() => {
        const fresh = { files: [] as PendingFile[], timer: setTimeout(() => {}, 0) };
        this.byDir.set(dir, fresh);
        return fresh;
      })();

    entry.files.push({ path: filePath, ctx, arrivedAt: Date.now() });
    this.status.pending += 1;
    this.bump('totalQueued', 1);
    clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      this.byDir.delete(dir);
      this.flushBatch(dir, entry.files).catch((err) =>
        logger.error({ err, dir }, 'ingest flush failed'),
      );
    }, DEBOUNCE_MS);

    return { jobId: `${dir}:${entry.files.length}` };
  }

  /** Find-or-create the PhotoGroup for a capture-time groupHint. */
  private async groupForHint(sourceFolder: string, hint: string): Promise<string> {
    const existing = await prisma.photoGroup.findFirst({
      where: { sourceFolder, label: hint, status: 'PENDING' },
    });
    if (existing) return existing.id;
    const created = await prisma.photoGroup.create({
      data: { sourceFolder, label: hint },
    });
    return created.id;
  }

  private async flushBatch(sourceFolder: string, files: PendingFile[]): Promise<void> {
    logger.info({ sourceFolder, count: files.length }, 'ingest batch flush');
    this.status.pending = Math.max(0, this.status.pending - files.length);
    this.status.processing += files.length;

    for (const f of files) {
      const { ctx } = f;
      try {
        const sha256 = await sha256File(f.path);
        const existing = await prisma.photo.findUnique({ where: { sha256 } });
        if (existing) {
          await prisma.ingestEvent.create({
            data: {
              path: f.path,
              sha256,
              decision: 'DUPLICATE_SKIPPED',
              source: ctx.source ?? 'WATCH_FOLDER',
              machineId: ctx.machineDbId,
              userId: ctx.uploadedById,
            },
          });
          this.bump('totalDuplicates', 1);
          this.bump('totalProcessed', 1);
          this.cleanupSource(f);
          continue;
        }

        const exif = await readExif(f.path);
        const capturedAt = ctx.capturedAtOverride ?? exif.capturedAt;
        const phash = await perceptualHash(f.path).catch(() => null);

        // Standards §4: master into the immutable tree, variants derived,
        // all DB paths FILE_ROOT-relative.
        const originalRel = storeOriginal(f.path, sha256, capturedAt);
        const processed = await processImage(f.path, sha256);

        const photoGroupId = ctx.groupHint
          ? await this.groupForHint(sourceFolder, ctx.groupHint)
          : undefined;

        const photo = await prisma.photo.create({
          data: {
            originalPath: originalRel,
            optimizedPath: processed.optimizedPath,
            thumbnailPath: processed.thumbnailPath,
            sha256,
            perceptualHash: phash,
            width: processed.width,
            height: processed.height,
            bytes: processed.bytes,
            mime: processed.mime,
            capturedAt,
            exif: (exif.raw as unknown as Prisma.InputJsonValue | undefined) ?? undefined,
            source: ctx.source ?? 'WATCH_FOLDER',
            machineDbId: ctx.machineDbId,
            uploadedById: ctx.uploadedById,
            groupHint: ctx.groupHint,
            itemId: ctx.itemId,
            photoGroupId,
          },
        });

        await prisma.ingestEvent.create({
          data: {
            path: f.path,
            sha256,
            decision: ctx.itemId ? 'ADDED_TO_ITEM' : photoGroupId ? 'GROUPED_PENDING' : 'NEW_ITEM',
            source: ctx.source ?? 'WATCH_FOLDER',
            machineId: ctx.machineDbId,
            userId: ctx.uploadedById,
            itemId: ctx.itemId,
            groupId: photoGroupId,
          },
        });

        logger.debug({ photoId: photo.id, sha256: sha256.slice(0, 12) }, 'photo ingested');
        this.bump('totalProcessed', 1);
        this.cleanupSource(f);
      } catch (err) {
        logger.error({ err, file: f.path }, 'per-file ingest failed');
        await prisma.ingestEvent
          .create({
            data: {
              path: f.path,
              sha256: '',
              decision: 'ERROR',
              source: ctx.source ?? 'WATCH_FOLDER',
              machineId: ctx.machineDbId,
              userId: ctx.uploadedById,
              error: (err as Error).message,
            },
          })
          .catch(() => undefined);
        this.bump('totalErrors', 1);
        this.bump('totalProcessed', 1);
      }
    }

    this.status.processing = Math.max(0, this.status.processing - files.length);
  }

  /** Server-side temp uploads (multipart/inline) are deleted once the master
   *  is safely in originals/. Watcher/inbox sources are left alone. */
  private cleanupSource(f: PendingFile): void {
    if (!f.ctx.deleteSourceAfterIngest) return;
    fs.rm(f.path, { force: true }, () => undefined);
  }
}

export const ingestService = new IngestService();
