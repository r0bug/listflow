// Storage-location CRUD + bulk shelf moves.
// docs/PHASE2-INVENTORY-AUDIT.md §6 Phase 2.0.

import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { staffAuth, staffOrMachine, requireRole } from '../middleware/auth.js';
import { qstr, pstr } from '../util/req.js';
import {
  InvalidLocationCode,
  normalizeLocationCode,
  parseLocationCode,
} from '../services/location.service.js';

const router = Router();

/** Maps a bad shelf code to 400 rather than a 500 through errorHandler. */
function sendCodeError(res: import('express').Response, err: unknown): boolean {
  if (err instanceof InvalidLocationCode) {
    res.status(400).json({ error: err.message });
    return true;
  }
  return false;
}

// GET /api/v1/locations?includeInactive=1 — machine-readable too: the
// extension's shelf picker reads this to offer/validate codes offline.
router.get('/', staffOrMachine, async (req, res) => {
  const includeInactive = qstr(req.query.includeInactive) === '1';
  const locations = await prisma.storageLocation.findMany({
    where: includeInactive ? undefined : { active: true },
    orderBy: [{ row: 'asc' }, { shelf: 'asc' }],
  });

  // Item counts come from Item.locationCode (a string, not a relation), so
  // group separately rather than via _count.
  const counts = await prisma.item.groupBy({
    by: ['locationCode'],
    _count: { _all: true },
    where: { locationCode: { not: null } },
  });
  const byCode = new Map(counts.map((c) => [c.locationCode!, c._count._all]));

  res.json({
    locations: locations.map((l) => ({ ...l, itemCount: byCode.get(l.code) ?? 0 })),
  });
});

const CreateSchema = z.object({
  code: z.string().min(1),
  label: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/', staffAuth, async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  try {
    const code = normalizeLocationCode(parsed.data.code);
    const { row, shelf } = parseLocationCode(code);
    const location = await prisma.storageLocation.upsert({
      where: { code },
      // Re-creating an existing shelf is how a retired one comes back; treat
      // it as "make sure this shelf exists and is usable" rather than a clash.
      update: { active: true, label: parsed.data.label, notes: parsed.data.notes },
      create: { code, row, shelf, label: parsed.data.label, notes: parsed.data.notes },
    });
    res.status(201).json(location);
  } catch (err) {
    if (!sendCodeError(res, err)) throw err;
  }
});

// POST /api/v1/locations/bulk — seed a whole rack in one call:
// { rows: 6, shelves: 4 } creates R1-S1 … R6-S4.
const BulkSchema = z.object({
  rows: z.number().int().min(1).max(200),
  shelves: z.number().int().min(1).max(200),
});

router.post('/bulk', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  const parsed = BulkSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  const { rows, shelves } = parsed.data;
  const data = [];
  for (let row = 1; row <= rows; row++) {
    for (let shelf = 1; shelf <= shelves; shelf++) {
      data.push({ code: `R${row}-S${shelf}`, row, shelf });
    }
  }
  const result = await prisma.storageLocation.createMany({ data, skipDuplicates: true });
  res.status(201).json({ created: result.count, requested: data.length });
});

const PatchSchema = z.object({
  label: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
});

router.patch('/:code', staffAuth, async (req, res) => {
  const parsed = PatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  try {
    const code = normalizeLocationCode(pstr(req.params.code));
    const location = await prisma.storageLocation.update({
      where: { code },
      data: parsed.data,
    });
    res.json(location);
  } catch (err) {
    if (!sendCodeError(res, err)) throw err;
  }
});

// POST /api/v1/locations/:code/move — "everything on R3-S2 is now on R5-S1".
// The correction path for a shelf that physically moved as a unit.
const MoveSchema = z.object({ to: z.string().min(1) });

router.post('/:code/move', staffAuth, async (req, res) => {
  const parsed = MoveSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid body', issues: parsed.error.issues });
    return;
  }
  try {
    const from = normalizeLocationCode(pstr(req.params.code));
    const to = normalizeLocationCode(parsed.data.to);
    if (from === to) {
      res.status(400).json({ error: 'Source and destination are the same shelf' });
      return;
    }
    const dest = await prisma.storageLocation.findUnique({ where: { code: to } });
    if (!dest || !dest.active) {
      res.status(400).json({ error: `Destination ${to} does not exist or is retired` });
      return;
    }
    const result = await prisma.item.updateMany({
      where: { locationCode: from },
      data: { locationCode: to },
    });
    // The items carry the new code now; their LIVE eBay Custom Labels still
    // say the old one until each listing is revised. That is expected and
    // tolerated (Standards §6) — flag it so the caller can tell the operator.
    res.json({ from, to, moved: result.count, staleCustomLabels: result.count });
  } catch (err) {
    if (!sendCodeError(res, err)) throw err;
  }
});

export default router;
