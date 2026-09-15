// Physical storage locations — the YF eBay room shelving.
//
// The DB is the authority for where an item physically is (Standards §6); the
// eBay Custom Label "<SKU>|<LOC>" is a copy that goes stale until the listing
// is next revised. Everything here exists to keep the authoritative half
// clean: one canonical spelling per shelf, validated on every write, so a
// typo can never reach a Custom Label.

import { prisma } from '../db/prisma.js';

/** Canonical shelf-code shape (Standards §6): R<row>-S<shelf>. */
export const LOCATION_CODE_RE = /^R(\d{1,3})-S(\d{1,3})$/;

export class InvalidLocationCode extends Error {
  /**
   * `reason` replaces the default "wrong shape" message. A code can be
   * perfectly well-formed and still unusable (no such shelf, retired shelf),
   * and telling the operator "R9-S9 is not a valid location code" when the
   * problem is that R9-S9 does not exist sends them off fixing the wrong thing.
   */
  constructor(code: string, reason?: string) {
    super(
      reason
        ? `${code}: ${reason}`
        : `"${code}" is not a valid location code — expected R<row>-S<shelf>, e.g. R3-S2`,
    );
    this.name = 'InvalidLocationCode';
  }
}

/**
 * Normalises operator input to the canonical code, or throws.
 *
 * Accepts the sloppy forms a barcode scanner or a tired operator produces —
 * lowercase, stray whitespace, zero padding ("r03 - s2") — because rejecting
 * those outright just means the code gets typed into the Custom Label by hand
 * instead, which is the failure we are trying to prevent.
 */
export function normalizeLocationCode(raw: string): string {
  const compact = String(raw ?? '').trim().toUpperCase().replace(/\s+/g, '');
  const m = LOCATION_CODE_RE.exec(compact);
  if (!m) throw new InvalidLocationCode(raw);
  const row = Number(m[1]);
  const shelf = Number(m[2]);
  if (row < 1 || shelf < 1) throw new InvalidLocationCode(raw);
  return `R${row}-S${shelf}`; // strips zero padding: "R03-S02" → "R3-S2"
}

export function parseLocationCode(code: string): { row: number; shelf: number } {
  const m = LOCATION_CODE_RE.exec(normalizeLocationCode(code));
  return { row: Number(m![1]), shelf: Number(m![2]) };
}

/**
 * Resolves a code to an ACTIVE StorageLocation, or throws.
 *
 * Assignment goes through here so an item can never be parked on a shelf that
 * does not exist. Retired shelves deliberately still resolve for *reads* (an
 * Item may legitimately still carry a retired code until it is moved) — this
 * is the write path only.
 */
export async function requireActiveLocation(raw: string) {
  const code = normalizeLocationCode(raw);
  const loc = await prisma.storageLocation.findUnique({ where: { code } });
  if (!loc) throw new InvalidLocationCode(code, 'no such shelf — create it first');
  if (!loc.active) throw new InvalidLocationCode(code, 'that shelf is retired');
  return loc;
}
