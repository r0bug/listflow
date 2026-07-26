import { parse } from 'csv-parse/sync';
import { prisma } from '../config/database';
import { commissionService } from './commission.service';

export interface CsvImportResult {
  created: number;
  skipped: number;
  duplicates: number;
  errors: { row: number; reason: string }[];
  dryRun: boolean;
}

interface MappedRow {
  ebayOrderId: string;
  lineItemId: string;
  legacyItemId: string | null;
  title: string;
  quantity: number;
  itemPrice: number;
  shippingPrice: number | null;
  totalPrice: number;
  buyerUsername: string | null;
  buyerName: string | null;
  soldAt: Date;
}

// normalized header -> canonical field. Headers are lowercased with all
// non-alphanumerics stripped before lookup, so "Sold For" == "soldfor".
const HEADER_ALIASES: Record<string, string> = {
  ordernumber: 'ebayOrderId',
  salesrecordnumber: 'salesRecordNumber',
  transactionid: 'transactionId',
  itemnumber: 'legacyItemId',
  itemid: 'legacyItemId',
  itemtitle: 'title',
  quantity: 'quantity',
  soldfor: 'itemPrice',
  itemsubtotal: 'itemPrice',
  shippingandhandling: 'shippingPrice',
  totalprice: 'totalPrice',
  buyerusername: 'buyerUsername',
  buyername: 'buyerName',
  saledate: 'soldAt',
  paidondate: 'paidOn',
};

/**
 * Imports an eBay Seller Hub order report CSV for one account. Idempotent
 * against both prior CSV imports and API-synced sales: primary key is
 * (ebayAccountId, ebayOrderId, lineItemId); a secondary check on
 * (ebayAccountId, ebayOrderId, legacyItemId) catches the API/CSV overlap
 * where lineItemId and transactionId differ for the same line.
 */
class CsvImportService {
  async importOrders(
    buffer: Buffer,
    ebayAccountId: string,
    dryRun = false
  ): Promise<CsvImportResult> {
    const result: CsvImportResult = {
      created: 0,
      skipped: 0,
      duplicates: 0,
      errors: [],
      dryRun,
    };

    const account = await prisma.ebayAccount.findUnique({ where: { id: ebayAccountId } });
    if (!account) throw new Error('Unknown eBay account');

    const text = buffer.toString('utf8').replace(/^﻿/, '');
    const records: Record<string, string>[] = parse(text, {
      columns: (header: string[]) => header.map(normalizeHeader),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2; // 1-based + header row
      let mapped: MappedRow;
      try {
        const maybe = mapRow(records[i]);
        if (!maybe) {
          result.skipped++; // preamble/totals/blank rows
          continue;
        }
        mapped = maybe;
      } catch (err: any) {
        result.errors.push({ row: rowNum, reason: err?.message || 'Unparseable row' });
        continue;
      }

      const existing = await prisma.sale.findFirst({
        where: {
          ebayAccountId,
          ebayOrderId: mapped.ebayOrderId,
          OR: [
            { lineItemId: mapped.lineItemId },
            ...(mapped.legacyItemId ? [{ legacyItemId: mapped.legacyItemId }] : []),
          ],
        },
      });
      if (existing) {
        result.duplicates++;
        continue;
      }

      if (dryRun) {
        result.created++;
        continue;
      }

      // Link to a known listing by eBay item number, if we have one
      const listing = mapped.legacyItemId
        ? await prisma.listing.findUnique({ where: { ebayId: mapped.legacyItemId } })
        : null;

      const sale = await prisma.sale.create({
        data: {
          ebayAccountId,
          ebayOrderId: mapped.ebayOrderId,
          lineItemId: mapped.lineItemId,
          legacyItemId: mapped.legacyItemId,
          title: mapped.title,
          quantity: mapped.quantity,
          itemPrice: mapped.itemPrice,
          shippingPrice: mapped.shippingPrice,
          totalPrice: mapped.totalPrice,
          buyerUsername: mapped.buyerUsername,
          buyerName: mapped.buyerName,
          soldAt: mapped.soldAt,
          imageUrl: listing?.imageUrls?.[0] ?? null,
          source: 'csv',
          rawData: records[i],
          listingId: listing?.id ?? null,
        },
      });

      if (listing) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            status: 'sold',
            soldAt: mapped.soldAt,
            soldPrice: mapped.itemPrice,
          },
        });
        if (listing.listingAgentId) {
          await commissionService.createForSale(sale.id, listing.listingAgentId);
        }
      }

      result.created++;
    }

    return result;
  }
}

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  return HEADER_ALIASES[normalized] || normalized;
}

function mapRow(row: Record<string, string>): MappedRow | null {
  const ebayOrderId = (row.ebayOrderId || '').trim();
  // Seller Hub reports include preamble/total rows without an order number
  if (!ebayOrderId) return null;

  const title = (row.title || '').trim();
  const itemPrice = parseMoney(row.itemPrice);
  const soldAt = parseDate(row.soldAt || row.paidOn);
  if (itemPrice == null) throw new Error('Missing/invalid sold price');
  if (!soldAt) throw new Error('Missing/invalid sale date');

  const quantity = Math.max(1, parseInt(row.quantity || '1', 10) || 1);
  const shippingPrice = parseMoney(row.shippingPrice);
  const totalPrice =
    parseMoney(row.totalPrice) ?? itemPrice * quantity + (shippingPrice ?? 0);
  const legacyItemId = (row.legacyItemId || '').trim() || null;

  return {
    ebayOrderId,
    lineItemId:
      (row.transactionId || '').trim() || legacyItemId || '0',
    legacyItemId,
    title: title || '(untitled)',
    quantity,
    itemPrice,
    shippingPrice,
    totalPrice,
    buyerUsername: (row.buyerUsername || '').trim() || null,
    buyerName: (row.buyerName || '').trim() || null,
    soldAt,
  };
}

function parseMoney(value?: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[$,\s]/g, '').replace(/^\((.*)\)$/, '-$1');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value?: string): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Seller Hub uses forms like "Jul-21-25" — make it Date.parse friendly
  const monthFirst = trimmed.replace(
    /^([A-Za-z]{3})-(\d{1,2})-(\d{2,4})$/,
    (_m, mon, day, year) =>
      `${mon} ${day} ${year.length === 2 ? '20' + year : year}`
  );
  const parsed = new Date(monthFirst);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const csvImportService = new CsvImportService();
