// Physical storage locations — wherever an item actually is.
//
// A location code is JUST A STRING. The shop's printed labels happen to read
// "A-1".."Z-6" (vendor kiosk ~/shelf-labels.sh), but a location may equally be
// "johns garage", "back room pallet", or anything else someone writes on a
// shelf. The app does not impose a scheme and must never reject a code for not
// looking like one — the physical world is the authority, not us.
//
// What we DO enforce is the one real constraint: the code is stamped into
// eBay's Custom Label as "<SKU>|<LOC>", which eBay caps at 50 characters.

import { prisma } from '../db/prisma.js';

/** The shop's printed-label convention. Used to sort nicely, never to validate. */
const LETTER_SHELF_RE = /^([A-Za-z]{1,3})-(\d{1,3})$/;

/** Longest location we accept: "YF001234|" is 9 chars of a 50-char Custom Label. */
export const MAX_LOCATION_CODE = 40;

export class InvalidLocationCode extends Error {
  constructor(code: string, reason?: string) {
    super(reason ? `${code}: ${reason}` : `"${code}" cannot be used as a location`);
    this.name = 'InvalidLocationCode';
  }
}

/**
 * Tidies operator input without changing its meaning.
 *
 * Collapses whitespace and trims. Deliberately does NOT uppercase, reformat, or
 * pattern-match: "johns garage" must survive as "johns garage". The one
 * exception is the printed-label convention — "a1" / "A-01" from a scanner or a
 * hurried keyboard becomes "A-1", because those are unambiguous and the shop
 * has hundreds of such labels already on the wall.
 */
export function normalizeLocationCode(raw: string): string {
  const s = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!s) throw new InvalidLocationCode(String(raw), 'location cannot be empty');
  if (s.length > MAX_LOCATION_CODE) {
    throw new InvalidLocationCode(
      s.slice(0, 20) + '…',
      `too long (${s.length} chars; max ${MAX_LOCATION_CODE}, because it has to fit in eBay's 50-character Custom Label alongside the SKU)`,
    );
  }

  // Printed-label shorthand only: "a1" -> "A-1", "A-01" -> "A-1".
  const compact = s.replace(/\s+/g, '');
  const shorthand = /^([A-Za-z]{1,3})-?(\d{1,3})$/.exec(compact);
  if (shorthand) return `${shorthand[1]!.toUpperCase()}-${Number(shorthand[2])}`;

  return s;
}

/** Sort keys for the shelf list. Null for anything not following the convention. */
export function parseLocationCode(code: string): { row: string | null; shelf: number | null } {
  const m = LETTER_SHELF_RE.exec(code);
  if (!m) return { row: null, shelf: null };
  return { row: m[1]!.toUpperCase(), shelf: Number(m[2]) };
}

/**
 * Resolves a code to a StorageLocation, CREATING it if it is new.
 *
 * Auto-create is deliberate: the operator at the shelf is the authority on what
 * exists, and making them pre-register a location before they can put something
 * on it is friction that ends with the code going only into eBay and never into
 * the DB. Unknown codes therefore succeed and show up in the shelf list, where a
 * typo is visible and fixable, rather than being blocked at the point of use.
 */
export async function resolveOrCreateLocation(raw: string) {
  const code = normalizeLocationCode(raw);
  const existing = await prisma.storageLocation.findUnique({ where: { code } });
  if (existing) {
    if (!existing.active) {
      await prisma.storageLocation.update({ where: { code }, data: { active: true } });
    }
    return existing;
  }
  const { row, shelf } = parseLocationCode(code);
  return prisma.storageLocation.create({ data: { code, row, shelf } });
}
