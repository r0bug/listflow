// SKU allocation (Standards §6): every item gets a stable SKU stamped into
// eBay's Custom Label as "<SKU>|<LOC>" so sales join deterministically back
// to item → lister → consignment group.
//
// Format: YF-prefixed, zero-padded sequence (YF000123). Allocation uses a
// Postgres sequence created idempotently at first use — safe under
// concurrency, monotonic, survives restarts.

import { prisma } from '../db/prisma.js';

let sequenceReady = false;

async function ensureSequence(): Promise<void> {
  if (sequenceReady) return;
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS listflow_sku_seq START 1000`);
  sequenceReady = true;
}

export async function nextSku(): Promise<string> {
  await ensureSequence();
  const rows = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
    `SELECT nextval('listflow_sku_seq') as nextval`,
  );
  const n = Number(rows[0]!.nextval);
  return `YF${String(n).padStart(6, '0')}`;
}

/** Returns the item's SKU, allocating and persisting one if missing. */
export async function ensureItemSku(item: { id: string; sku: string | null }): Promise<string> {
  if (item.sku) return item.sku;
  const sku = await nextSku();
  await prisma.item.update({ where: { id: item.id }, data: { sku } });
  return sku;
}

/** Compose the eBay Custom Label "<SKU>|<LOC>" (Standards §6, ≤50 chars). */
export function composeCustomLabel(sku: string, locationCode: string | null | undefined): string {
  const label = locationCode ? `${sku}|${locationCode}` : sku;
  return label.slice(0, 50);
}
