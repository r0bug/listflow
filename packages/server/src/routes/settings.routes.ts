// User-facing settings endpoints: API key management + password change.
// All routes require a JWT cookie (web UI only).

import { Router } from 'express';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma.js';
import { staffAuth, staffOrMachine } from '../middleware/auth.js';
import { sha256String } from '../util/sha256.js';
import { pstr } from '../util/req.js';

const router = Router();

// GET /api/v1/settings/api-keys — list machine keys (hashed at rest).
router.get('/api-keys', staffAuth, async (_req, res) => {
  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    include: { machines: { select: { machineId: true, label: true, kind: true, lastSeenAt: true } } },
  });
  res.json({
    keys: keys.map((k) => ({
      id: k.id,
      name: k.name,
      kind: k.kind,
      machines: k.machines,
      revokedAt: k.revokedAt,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    })),
  });
});

// POST /api/v1/settings/api-keys — create a machine key; plaintext ONCE.
const CreateKeySchema = z.object({
  name: z.string().min(1),
});

router.post('/api-keys', staffAuth, async (req, res) => {
  const parsed = CreateKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const rawKey = `lf_${randomBytes(24).toString('hex')}`;
  const apiKey = await prisma.apiKey.create({
    data: { keyHash: sha256String(rawKey), name: parsed.data.name },
  });
  res.status(201).json({ id: apiKey.id, apiKey: rawKey });
});

// POST /api/v1/settings/api-keys/:id/revoke — mark revokedAt = now.
router.post('/api-keys/:id/revoke', staffAuth, async (req, res) => {
  const existing = await prisma.apiKey.findUnique({ where: { id: pstr(req.params.id) } });
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const updated = await prisma.apiKey.update({
    where: { id: pstr(req.params.id) },
    data: { revokedAt: existing.revokedAt ?? new Date() },
  });
  res.json({ id: updated.id, revokedAt: updated.revokedAt });
});

// Passwords/PINs live in TeamTime (Standards §1) — no local credential store.
router.post('/password', staffAuth, (_req, res) => {
  res.status(410).json({ error: 'Credentials are managed in TeamTime' });
});

// ── AI provider (anthropic | external-mcp | mock) ──────────────────────

const AI_PROVIDER_KEY = 'ai_provider';
const AI_PROVIDERS = ['anthropic', 'external-mcp', 'mock'] as const;
type AiProvider = (typeof AI_PROVIDERS)[number];

export async function loadAiProvider(): Promise<AiProvider> {
  const row = await prisma.setting.findUnique({ where: { key: AI_PROVIDER_KEY } });
  const v = (row?.value as { value?: string } | null)?.value;
  if (v && (AI_PROVIDERS as readonly string[]).includes(v)) return v as AiProvider;
  return 'anthropic';
}

router.get('/ai-provider', staffOrMachine, async (_req, res) => {
  res.json({ provider: await loadAiProvider(), options: AI_PROVIDERS });
});

const AiProviderSchema = z.object({ provider: z.enum(AI_PROVIDERS) });

router.put('/ai-provider', staffOrMachine, async (req, res) => {
  const parsed = AiProviderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  await prisma.setting.upsert({
    where: { key: AI_PROVIDER_KEY },
    create: { key: AI_PROVIDER_KEY, value: { value: parsed.data.provider } },
    update: { value: { value: parsed.data.provider } },
  });
  res.json({ provider: parsed.data.provider });
});

// ── Ingest hint (global AI prompt augmentation) ────────────────────────

const INGEST_HINT_KEY = 'ingest_hint';

router.get('/ingest-hint', staffAuth, async (_req, res) => {
  const row = await prisma.setting.findUnique({ where: { key: INGEST_HINT_KEY } });
  const value = (row?.value as { text?: string } | null)?.text ?? '';
  res.json({ hint: value });
});

const IngestHintSchema = z.object({ hint: z.string().max(4000) });

router.put('/ingest-hint', staffAuth, async (req, res) => {
  const parsed = IngestHintSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const trimmed = parsed.data.hint.trim();
  await prisma.setting.upsert({
    where: { key: INGEST_HINT_KEY },
    create: { key: INGEST_HINT_KEY, value: { text: trimmed } },
    update: { value: { text: trimmed } },
  });
  res.json({ hint: trimmed });
});

export default router;
