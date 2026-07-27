// eBay "Order earnings" report importer — the actual-fees enrichment.
// (Seller Hub → Payments → Reports → Order earnings.)
//
// Enriches EXISTING Sale rows with real money: fees = |Expenses| (every eBay
// fee incl. promoted-listing ads and shipping labels), refunds = |Refunds|.
// TeamTime's settlements then compute net on actuals instead of the
// estimated fee percent (owner rule: net is always the number).
//
// PII: the report carries buyer names/addresses — nothing from it is stored
// except the money columns; the raw file is archived under FILE_ROOT/imports.

import { parse } from 'csv-parse/sync';
import { prisma } from '../db/prisma.js';
import { logger } from '../util/logger.js';

export interface EarningsImportResult {
  rows: number;
  matched: number;
  updated: number;
  created: number; // sales created from earnings rows (createMissing mode)
  unmatched: number;
  skipped: number; // no-money / malformed rows
  dryRun: boolean;
}

function num(v: string | undefined): number | null {
  const cleaned = (v ?? '').replace(/[$,]/g, '').trim();
  if (!cleaned || cleaned === '--') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

class EarningsImportService {
  async importEarnings(
    buffer: Buffer,
    ebayAccountId: string,
    dryRun = false,
    createMissing = false,
  ): Promise<EarningsImportResult> {
    const result: EarningsImportResult = { rows: 0, matched: 0, updated: 0, created: 0, unmatched: 0, skipped: 0, dryRun };

    const account = await prisma.ebayAccount.findUnique({ where: { id: ebayAccountId } });
    if (!account) throw new Error('Unknown eBay account');

    // Long notes preamble — the header row starts with "Order creation date".
    let text = buffer.toString('utf8').replace(/^﻿/, '');
    const lines = text.split(/\r?\n/);
    const headerIdx = lines.findIndex((l) => l.startsWith('Order creation date'));
    if (headerIdx < 0) throw new Error('Not an Order earnings report (header row not found)');
    text = lines.slice(headerIdx).join('\n');

    const records: Record<string, string>[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    for (const row of records) {
      const orderId = (row['Order number'] ?? '').trim();
      const itemId = (row['Item ID'] ?? '').trim();
      if (!orderId || orderId === '--') {
        result.skipped++;
        continue;
      }
      result.rows++;

      const expenses = num(row['Expenses']);
      const refunds = num(row['Refunds']);
      if (expenses == null && refunds == null) {
        result.skipped++;
        continue;
      }
      const fees = Math.abs(expenses ?? 0);
      const refundAmt = Math.abs(refunds ?? 0);

      // Match line-precisely when the item id helps; else by order.
      const sale =
        (itemId && itemId !== '--'
          ? await prisma.sale.findFirst({
              where: { ebayAccountId, ebayOrderId: orderId, legacyItemId: itemId },
            })
          : null) ??
        (await prisma.sale.findFirst({ where: { ebayAccountId, ebayOrderId: orderId } }));

      if (!sale) {
        // createMissing: the earnings report has enough to seed the ledger
        // row itself (accounts whose Orders report we never imported).
        // PII note: buyer name/address columns are NOT stored.
        if (!createMissing) {
          result.unmatched++;
          continue;
        }
        const itemPrice = num(row['Item price']) ?? num(row['Item subtotal']) ?? 0;
        const quantity = Math.max(1, Math.round(num(row['Quantity']) ?? 1));
        const soldAt = new Date(row['Order creation date'] ?? '');
        if (!itemPrice || isNaN(soldAt.getTime())) {
          result.skipped++;
          continue;
        }
        if (!dryRun) {
          await prisma.sale.create({
            data: {
              ebayAccountId,
              ebayOrderId: orderId,
              lineItemId: itemId && itemId !== '--' ? itemId : '0',
              legacyItemId: itemId && itemId !== '--' ? itemId : null,
              title: (row['Item title'] ?? '(untitled)').trim() || '(untitled)',
              quantity,
              itemPrice,
              shippingPrice: num(row['Shipping and handling']),
              taxAmount: num(row['eBay collected tax']),
              totalPrice: num(row['Gross amount']) ?? itemPrice * quantity,
              fees,
              refunds: refundAmt,
              shipCity: (row['Ship to city'] ?? '').trim() || null,
              shipState: (row['Ship to province/region/state'] ?? '').trim() || null,
              shipCountry: (row['Ship to country'] ?? '').trim() || null,
              soldAt,
              source: 'csv',
            },
          });
        }
        result.created++;
        continue;
      }
      result.matched++;

      if (!dryRun) {
        await prisma.sale.update({
          where: { id: sale.id },
          data: { fees, refunds: refundAmt },
        });
        result.updated++;
      }
    }

    logger.info({ account: account.accountName, ...result }, 'earnings import finished');
    return result;
  }
}

export const earningsImportService = new EarningsImportService();
