// Staff login — credential-proxy pattern (fleet Standards §1).
//
// Phase 3 (real): POST /login forwards email+PIN to TeamTime's verify
// endpoint server-to-server; on success we upsert the StaffUser (roster sync
// keeps it fresh anyway) and issue our own short-lived JWT.
//
// Until that endpoint exists, DEV_AUTH_ENABLED=true (explicit env opt-in,
// never NODE_ENV-derived) allows a local dev login that finds-or-creates a
// manual StaffUser. With the flag off and no TEAMTIME_URL, login is
// unavailable — there is no fallback password store by design.

import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { requireRole, signStaffToken, staffAuth } from '../middleware/auth.js';
import { sha256String } from '../util/sha256.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  pin: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
});

async function verifyWithTeamTime(email: string, secret: string): Promise<
  | { ok: true; user: { id: string; name: string; role: string; canListOnEbay: boolean } }
  | { ok: false; status: number }
> {
  const res = await fetch(`${env.TEAMTIME_URL}/api/app/verify-credentials`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.TEAMTIME_API_SECRET ?? ''}`,
    },
    body: JSON.stringify({ email, secret }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as {
    user: { id: string; name: string; role: string; canListOnEbay: boolean };
  };
  return { ok: true, user: data.user };
}

router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const email = parsed.data.email.toLowerCase();
  const secret = parsed.data.pin ?? parsed.data.password;

  // ── Real path: TeamTime credential proxy ──
  if (env.TEAMTIME_URL && env.TEAMTIME_API_SECRET) {
    if (!secret) {
      res.status(400).json({ error: 'PIN required' });
      return;
    }
    let verdict;
    try {
      verdict = await verifyWithTeamTime(email, secret);
    } catch {
      res.status(502).json({ error: 'TeamTime unreachable' });
      return;
    }
    if (!verdict.ok) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    const staff = await prisma.staffUser.upsert({
      where: { teamtimeUserId: verdict.user.id },
      create: {
        teamtimeUserId: verdict.user.id,
        email,
        name: verdict.user.name,
        role: verdict.user.role,
        canListOnEbay: verdict.user.canListOnEbay,
        source: 'teamtime',
        lastSyncedAt: new Date(),
      },
      update: {
        email,
        name: verdict.user.name,
        role: verdict.user.role,
        canListOnEbay: verdict.user.canListOnEbay,
        lastSyncedAt: new Date(),
      },
    });
    issue(res, staff);
    return;
  }

  // ── Dev stub (explicit opt-in only) ──
  if (env.DEV_AUTH_ENABLED) {
    const staff =
      (await prisma.staffUser.findUnique({ where: { email } })) ??
      (await prisma.staffUser.create({
        data: { email, name: email.split('@')[0] ?? email, role: 'admin', source: 'manual', canListOnEbay: true },
      }));
    issue(res, staff);
    return;
  }

  res.status(503).json({ error: 'Login unavailable: TeamTime proxy not configured' });
});

function issue(
  res: Parameters<import('express').RequestHandler>[1],
  staff: { id: string; name: string; role: string; teamtimeUserId: string | null; email: string | null; canListOnEbay: boolean },
) {
  const token = signStaffToken(staff);
  res.cookie('listflow_jwt', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.json({
    token,
    user: {
      id: staff.id,
      email: staff.email,
      name: staff.name,
      role: staff.role,
      canListOnEbay: staff.canListOnEbay,
      teamtimeUserId: staff.teamtimeUserId,
    },
  });
}

router.post('/logout', (_req, res) => {
  res.clearCookie('listflow_jwt');
  res.json({ ok: true });
});

router.get('/me', staffAuth, async (req, res) => {
  const staff = await prisma.staffUser.findUnique({ where: { id: req.staff!.id } });
  if (!staff || !staff.active) {
    res.status(401).json({ error: 'User no longer exists' });
    return;
  }
  res.json({
    id: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    canListOnEbay: staff.canListOnEbay,
    teamtimeUserId: staff.teamtimeUserId,
  });
});

// ── Machine-key provisioning (admin/manager) ──
// Returns the raw key ONCE; only the hash is stored (Standards §1).
const ProvisionSchema = z.object({
  name: z.string().min(1), // "photo-station-1 watcher"
  kind: z.enum(['machine', 'service']).default('machine'),
});

router.post('/machine-keys', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  const parsed = ProvisionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const rawKey = `lf_${randomBytes(24).toString('base64url')}`;
  const apiKey = await prisma.apiKey.create({
    data: { keyHash: sha256String(rawKey), name: parsed.data.name, kind: parsed.data.kind },
  });
  res.status(201).json({ id: apiKey.id, name: apiKey.name, key: rawKey });
});

router.get('/machine-keys', staffAuth, requireRole('admin', 'manager'), async (_req, res) => {
  const keys = await prisma.apiKey.findMany({
    select: {
      id: true,
      name: true,
      kind: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
      machines: { select: { machineId: true, label: true, kind: true, lastSeenAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(keys);
});

router.delete('/machine-keys/:id', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  await prisma.apiKey.update({ where: { id: req.params.id }, data: { revokedAt: new Date() } });
  res.json({ ok: true });
});

export default router;
