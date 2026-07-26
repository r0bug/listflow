// GET /api/v1/devices — lists Machine rows joined to ApiKey + Client for the
// web UI's Devices page. Browser extensions + watcher daemons upsert
// Machine on every machineAuth call (see middleware/auth.ts), so this view
// is essentially "who has checked in, grouped by API key / client."

import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { staffAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', staffAuth, async (_req, res) => {
  // Postgres sorts NULLs last by default on DESC, which is what we want:
  // machines that have never been seen sink to the bottom.
  const machines = await prisma.machine.findMany({
    take: 200,
    orderBy: [{ lastSeenAt: 'desc' }],
    include: { apiKey: true },
  });

  const devices = machines.map((m) => ({
    id: m.id,
    machineId: m.machineId,
    label: m.label,
    kind: m.kind,
    userAgent: m.userAgent,
    lastSeenAt: m.lastSeenAt,
    createdAt: m.createdAt,
    apiKey: {
      id: m.apiKey.id,
      name: m.apiKey.name,
      kind: m.apiKey.kind,
      revokedAt: m.apiKey.revokedAt,
      lastUsedAt: m.apiKey.lastUsedAt,
    },
  }));

  res.json({ devices });
});

export default router;
