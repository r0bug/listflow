// Extension-only endpoints: registration, identify-search queue, hot-patch,
// telemetry. Most are direct ports of comptool patterns.

import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { prisma } from '../db/prisma.js';
import { machineAuth, staffAuth } from '../middleware/auth.js';
import { sha256String } from '../util/sha256.js';
import { logger } from '../util/logger.js';

const router = Router();

// POST /api/v1/extension/register — issues this install's machine key.
// NOT public (Standards §1): the lister logs into the extension popup first
// (staff JWT), then the extension self-provisions its per-install key.
const RegisterSchema = z.object({
  name: z.string().min(1), // e.g. "extension: john @ front-desk chrome profile"
});

router.post('/register', staffAuth, async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const rawKey = `lf_${randomBytes(24).toString('hex')}`;
  const apiKey = await prisma.apiKey.create({
    data: { keyHash: sha256String(rawKey), name: parsed.data.name, kind: 'machine' },
  });
  res.status(201).json({ apiKey: rawKey, apiKeyId: apiKey.id });
});

// POST /api/v1/extension/identify-search — returns Items needing comp matches
// + a generated eBay sold-search URL each.
router.post('/identify-search', machineAuth, async (_req, res) => {
  const items = await prisma.item.findMany({
    where: {
      OR: [{ stage: 'IDENTIFIED' }, { stage: 'GROUPED' }, { stage: 'INGESTED' }],
      comps: { none: {} },
    },
    take: 25,
    orderBy: { updatedAt: 'desc' },
    include: { photos: { take: 1, where: { isPrimary: true } } },
  });

  const enriched = items.map((item) => {
    const queryParts = [item.brand, item.model, item.title].filter(Boolean).map(String);
    const q = queryParts.join(' ').slice(0, 100);
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;
    return { id: item.id, title: item.title, brand: item.brand, query: q, soldSearchUrl: url };
  });

  res.json({ items: enriched });
});

// Hot-patch is RETIRED (Standards §6: no remote code execution in a
// credential-holding extension). Old installs polling this get an empty
// payload forever; the endpoint disappears once the merged extension ships.
router.get('/patch', machineAuth, (_req, res) => {
  res.json({ version: 0, scripts: {} });
});

// POST /api/v1/extension/telemetry — selector-failure logging.
router.post('/telemetry', machineAuth, async (req, res) => {
  logger.warn({ telemetry: req.body, apiKeyId: req.machine?.apiKeyId }, 'extension telemetry');
  res.json({ ok: true });
});

// GET /api/v1/extension/unlisted-items — minimal item list (id + label) for
// the "Import details to listing" picker on eBay item pages. Anything not
// already LISTED is fair game (DRAFT, READY, IN_PROCESS, etc.).
router.get('/unlisted-items', machineAuth, async (_req, res) => {
  const items = await prisma.item.findMany({
    where: { status: { not: 'LISTED' } },
    select: { id: true, title: true, brand: true, model: true, status: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });
  res.json({ items });
});

export default router;
