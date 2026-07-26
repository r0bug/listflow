// Two credential kinds, per fleet Standards §1 — nothing else:
//  - Staff JWT (Authorization: Bearer or cookie) — humans, issued by our
//    /auth/login after TeamTime credential-proxy verification (dev stub
//    until phase 3). Carries the StaffUser id + role.
//  - Per-machine API key (X-Api-Key + X-Machine-Id, hashed at rest) —
//    watchers, extension installs, capture devices. Resolves to a Machine
//    row whose id flows into Photo provenance.

import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../db/prisma.js';
import { sha256String } from '../util/sha256.js';

export interface StaffContext {
  id: string;
  name: string;
  role: string;
  teamtimeUserId?: string | null;
}
export interface MachineContext {
  apiKeyId: string;
  machineDbId?: string; // Machine row id (provenance)
  machineId?: string; // client-generated UUID
}

declare module 'express-serve-static-core' {
  interface Request {
    staff?: StaffContext;
    machine?: MachineContext;
  }
}

export function signStaffToken(user: {
  id: string;
  name: string;
  role: string;
  teamtimeUserId?: string | null;
}): string {
  return jwt.sign(
    { sub: user.id, name: user.name, role: user.role, tt: user.teamtimeUserId ?? null },
    env.JWT_SECRET,
    { expiresIn: '12h' },
  );
}

export const staffAuth: RequestHandler = (req, res, next) => {
  const token =
    req.cookies?.listflow_jwt || req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const d = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      name: string;
      role: string;
      tt: string | null;
    };
    req.staff = { id: d.sub, name: d.name, role: d.role, teamtimeUserId: d.tt };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    if (!req.staff) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.staff.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export const machineAuth: RequestHandler = async (req, res, next) => {
  const rawKey = req.header('X-Api-Key');
  if (!rawKey) {
    res.status(401).json({ error: 'Missing X-Api-Key header' });
    return;
  }
  const keyHash = sha256String(rawKey);
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey || apiKey.revokedAt) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  let machineDbId: string | undefined;
  const machineId = req.header('X-Machine-Id');
  if (machineId) {
    const machine = await prisma.machine.upsert({
      where: { machineId },
      create: {
        machineId,
        apiKeyId: apiKey.id,
        userAgent: req.header('user-agent'),
        lastSeenAt: new Date(),
      },
      update: { lastSeenAt: new Date(), userAgent: req.header('user-agent') },
    });
    machineDbId = machine.id;
  }

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });

  req.machine = { apiKeyId: apiKey.id, machineDbId, machineId: machineId ?? undefined };

  // Best-effort staff identity: the extension sends its machine key AND the
  // logged-in lister's JWT. A valid Bearer attaches req.staff (attribution);
  // an invalid/missing one never fails a machine-authenticated call.
  const bearer = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (bearer) {
    try {
      const d = jwt.verify(bearer, env.JWT_SECRET) as {
        sub: string;
        name: string;
        role: string;
        tt: string | null;
      };
      req.staff = { id: d.sub, name: d.name, role: d.role, teamtimeUserId: d.tt };
    } catch {
      /* ignore — machine auth stands on its own */
    }
  }
  next();
};

/** Either credential kind (ingest endpoint: PWA sends JWT, watcher sends key). */
export const staffOrMachine: RequestHandler = (req, res, next) => {
  if (req.header('X-Api-Key')) {
    machineAuth(req, res, next);
    return;
  }
  staffAuth(req, res, next);
};
