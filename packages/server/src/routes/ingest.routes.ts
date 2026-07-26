// The ONE ingest door for all feeders (docs/PHASE1-DESIGN.md §3).
//
//   POST /photo   multipart (file) | JSON {path} | JSON {inline:{base64,...}}
//   POST /batch   JSON array form (APK bursts, one groupHint per item)
//   POST /scan    walk a server-side folder (manual "Scan inbox")
//   GET  /status  progress counters
//
// Auth: staff JWT (PWA/extension) or machine key (watcher/APK) — the
// credential kind determines default provenance.

import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { randomBytes } from 'node:crypto';
import multer from 'multer';
import { z } from 'zod';
import { machineAuth, staffOrMachine } from '../middleware/auth.js';
import { ingestService, type IngestContext } from '../services/ingest.service.js';
import { scanInbox } from '../services/scanInbox.service.js';
import { prisma } from '../db/prisma.js';
import { inboxDirAbs } from '../util/paths.js';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(inboxDirAbs(), '_uploads');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '') || '.jpg';
      cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const SOURCES = ['WATCH_FOLDER', 'USB_DCIM', 'SYNC_FOLDER', 'PWA_UPLOAD', 'CAPTURE_APK', 'EBAY_IMPORT'] as const;

const CommonFields = z.object({
  source: z.enum(SOURCES).optional(),
  groupHint: z.string().max(120).optional(),
  itemId: z.string().optional(),
  watchFolderId: z.string().optional(),
  capturedAt: z.coerce.date().optional(),
  uploadedForUserId: z.string().optional(), // machine callers attributing a person
});

const JsonPhotoSchema = CommonFields.extend({
  path: z.string().min(1).optional(),
  inline: z
    .object({ base64: z.string().min(1), filename: z.string().min(1), mime: z.string().min(1) })
    .optional(),
}).refine((v) => Boolean(v.path || v.inline), { message: 'path, inline, or multipart file required' });

function buildContext(
  req: import('express').Request,
  fields: z.infer<typeof CommonFields>,
  viaFile: boolean,
  sourcePath?: string,
): IngestContext {
  const machine = req.machine;
  const staff = req.staff;
  // USB/DCIM auto-imports arrive via the watcher's inbox/_usb staging dir.
  const defaultSource = machine
    ? sourcePath?.includes('/_usb/')
      ? 'USB_DCIM'
      : 'WATCH_FOLDER'
    : 'PWA_UPLOAD';
  return {
    source: fields.source ?? defaultSource,
    machineDbId: machine?.machineDbId,
    uploadedById: staff?.id ?? fields.uploadedForUserId,
    groupHint: fields.groupHint,
    itemId: fields.itemId,
    watchFolderId: fields.watchFolderId,
    capturedAtOverride: fields.capturedAt,
    deleteSourceAfterIngest: viaFile, // temp uploads are ours to clean up
  };
}

router.post('/photo', staffOrMachine, upload.single('file'), (req, res) => {
  // Multipart form: file + fields
  if (req.file) {
    const fields = CommonFields.safeParse(req.body ?? {});
    if (!fields.success) {
      res.status(400).json({ error: 'Invalid fields', issues: fields.error.issues });
      return;
    }
    const { jobId } = ingestService.enqueue(req.file.path, buildContext(req, fields.data, true));
    res.status(202).json({ jobId, status: 'queued' });
    return;
  }

  // JSON: {path} (same-host feeder) or {inline} (remote feeder)
  const parsed = JsonPhotoSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  let sourcePath = parsed.data.path;
  if (parsed.data.inline) {
    const dir = path.join(inboxDirAbs(), '_uploads');
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(parsed.data.inline.filename) || '.jpg';
    sourcePath = path.join(dir, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
    fs.writeFileSync(sourcePath, Buffer.from(parsed.data.inline.base64, 'base64'));
  }
  const { jobId } = ingestService.enqueue(
    sourcePath!,
    buildContext(req, parsed.data, Boolean(parsed.data.inline), sourcePath),
  );
  res.status(202).json({ jobId, status: 'queued' });
});

const BatchSchema = z.object({
  photos: z.array(JsonPhotoSchema).min(1).max(200),
});

router.post('/batch', staffOrMachine, (req, res) => {
  const parsed = BatchSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const jobIds: string[] = [];
  for (const p of parsed.data.photos) {
    let sourcePath = p.path;
    if (p.inline) {
      const dir = path.join(inboxDirAbs(), '_uploads');
      fs.mkdirSync(dir, { recursive: true });
      const ext = path.extname(p.inline.filename) || '.jpg';
      sourcePath = path.join(dir, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`);
      fs.writeFileSync(sourcePath, Buffer.from(p.inline.base64, 'base64'));
    }
    const { jobId } = ingestService.enqueue(sourcePath!, buildContext(req, p, Boolean(p.inline), sourcePath));
    jobIds.push(jobId);
  }
  res.status(202).json({ jobIds, status: 'queued', count: jobIds.length });
});

const ScanSchema = z.object({ folder: z.string().optional() });

router.post('/scan', staffOrMachine, async (req, res) => {
  const parsed = ScanSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const folder = path.resolve(parsed.data.folder?.trim() || inboxDirAbs());
  if (!fs.existsSync(folder)) {
    res.status(404).json({ error: `Folder does not exist: ${folder}` });
    return;
  }
  const result = await scanInbox(folder);
  res.json({ ...result, status: ingestService.getStatus() });
});

router.get('/status', staffOrMachine, async (_req, res) => {
  const [queued, claimed] = await Promise.all([
    prisma.externalAnalysisBatch.count({ where: { status: 'QUEUED' } }),
    prisma.externalAnalysisBatch.count({ where: { status: 'CLAIMED' } }),
  ]);
  res.json({
    status: ingestService.getStatus(),
    inbox: inboxDirAbs(),
    externalMcp: { queued, claimed },
  });
});

// Machine self-registration metadata (watcher install script convenience)
router.post('/hello', machineAuth, async (req, res) => {
  const Schema = z.object({ label: z.string().max(80).optional(), kind: z.string().max(40).optional() });
  const parsed = Schema.safeParse(req.body ?? {});
  if (parsed.success && req.machine?.machineDbId) {
    await prisma.machine.update({
      where: { id: req.machine.machineDbId },
      data: { label: parsed.data.label, kind: parsed.data.kind },
    });
  }
  res.json({ ok: true, machineDbId: req.machine?.machineDbId ?? null });
});

export default router;
