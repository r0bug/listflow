// Sold-comp upsert + item linking on the unified model:
//   SoldComp  — one row per eBay sold listing (shared across items/searches)
//   ItemComp  — join table linking a comp to an item (isPrimary flag)
//
// Progressive enrichment (comptool pattern): upserting an existing comp only
// overwrites fields the caller actually provided, so a Terapeak scrape never
// erases detail-page data and vice versa.

import type { Prisma, PrismaClient } from '../generated/prisma/index.js';

type Db = PrismaClient | Prisma.TransactionClient;

export interface CompInput {
  ebayItemId: string;
  title?: string | null;
  soldPrice?: number | null;
  shippingPrice?: number | null;
  totalPrice?: number | null;
  soldDate?: Date | string | null;
  currency?: string;
  categoryId?: string | null; // stored as `category` id-ish text on SoldComp
  category?: string | null;
  categoryPath?: string | null;
  condition?: string | null;
  description?: string | null;
  itemSpecifics?: unknown;
  imageUrls?: string[];
  itemUrl?: string | null;
  sellerName?: string | null;
  source?: string;
}

function defined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function upsertComp(db: Db, input: CompInput) {
  const soldDate = input.soldDate ? new Date(input.soldDate) : undefined;
  const common = {
    title: input.title ?? undefined,
    soldPrice: input.soldPrice ?? undefined,
    shippingPrice: input.shippingPrice ?? undefined,
    totalPrice: input.totalPrice ?? undefined,
    soldDate,
    currency: input.currency,
    category: input.category ?? input.categoryId ?? undefined,
    categoryPath: input.categoryPath ?? undefined,
    condition: input.condition ?? undefined,
    description: input.description ?? undefined,
    itemSpecifics: (input.itemSpecifics as Prisma.InputJsonValue | undefined) ?? undefined,
    imageUrls: input.imageUrls,
    itemUrl: input.itemUrl ?? undefined,
    seller: input.sellerName ?? undefined,
  };
  return db.soldComp.upsert({
    where: { ebayItemId: input.ebayItemId },
    create: {
      ebayItemId: input.ebayItemId,
      title: input.title ?? '(untitled comp)',
      source: input.source ?? 'extension',
      ...defined(common),
    },
    update: defined(common), // enrichment: only provided fields overwrite
  });
}

export async function upsertCompAndLink(
  db: Db,
  itemId: string,
  input: CompInput & { isPrimary?: boolean },
) {
  const comp = await upsertComp(db, input);
  if (input.isPrimary) {
    await db.itemComp.updateMany({ where: { itemId }, data: { isPrimary: false } });
  }
  await db.itemComp.upsert({
    where: { itemId_compId: { itemId, compId: comp.id } },
    create: { itemId, compId: comp.id, isPrimary: input.isPrimary ?? false },
    update: input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {},
  });
  return comp;
}

/** Move all comp links from one item to another (item merge). */
export async function moveItemComps(db: Db, fromItemId: string, toItemId: string): Promise<void> {
  const links = await db.itemComp.findMany({ where: { itemId: fromItemId } });
  for (const link of links) {
    await db.itemComp.upsert({
      where: { itemId_compId: { itemId: toItemId, compId: link.compId } },
      create: { itemId: toItemId, compId: link.compId, isPrimary: link.isPrimary },
      update: {},
    });
  }
  await db.itemComp.deleteMany({ where: { itemId: fromItemId } });
}
