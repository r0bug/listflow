// Seller Hub Orders-report CSV importer on the unified Sale model.
// Spec: docs/PHASE1-DESIGN.md §3b — validated against a real yakimanet
// export (500 line items, Apr–May 2026). Reworked from the preserved
// wip/sales-commissions importer; commission computation is GONE (TeamTime
// owns splits — Standards §3).
//
// Idempotent: upsert key (ebayAccountId, ebayOrderId, lineItemId) with a
// secondary (ebayOrderId, legacyItemId) overlap check for API/CSV joins.
// PII (Standards §5): buyer name/email/street/phone are never stored;
// rawData keeps the row minus PII columns.

import { parse } from 'csv-parse/sync';
import { prisma } from '../db/prisma.js';
import { logger } from '../util/logger.js';

export interface SalesImportResult {
  created: number;
  skipped: number;
  duplicates: number;
  matchedToItems: number;
  locMismatches: { row: number; sku: string; csvLoc: string; dbLoc: string | null }[];
  errors: { row: number; reason: string }[];
  dryRun: boolean;
}

interface MappedRow {
  ebayOrderId: string;
  lineItemId: string;
  salesRecordNumber: string | null;
  legacyItemId: string | null;
  customLabel: string | null;
  sku: string | null; // parsed "<SKU>|<LOC>" halves (Standards §6)
  locationCode: string | null;
  title: string;
  quantity: number;
  itemPrice: number;
  shippingPrice: number | null;
  taxAmount: number | null;
  totalPrice: number;
  promoted: boolean;
  buyerUsername: string | null;
  shipCity: string | null;
  shipState: string | null;
  shipCountry: string | null;
  soldAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  trackingNumber: string | null;
  shippingService: string | null;
}

// normalized header -> canonical field (lowercased, non-alphanumerics stripped)
const HEADER_ALIASES: Record<string, string> = {
  ordernumber: 'ebayOrderId',
  salesrecordnumber: 'salesRecordNumber',
  transactionid: 'transactionId',
  itemnumber: 'legacyItemId',
  itemid: 'legacyItemId',
  itemtitle: 'title',
  customlabel: 'customLabel',
  soldviapromotedlistings: 'promoted',
  quantity: 'quantity',
  soldfor: 'itemPrice',
  itemsubtotal: 'itemPrice',
  shippingandhandling: 'shippingPrice',
  ebaycollectedtax: 'taxAmount',
  totalprice: 'totalPrice',
  buyerusername: 'buyerUsername',
  shiptocity: 'shipCity',
  shiptostate: 'shipState',
  shiptocountry: 'shipCountry',
  saledate: 'soldAt',
  paidondate: 'paidAt',
  shippedondate: 'shippedAt',
  trackingnumber: 'trackingNumber',
  shippingservice: 'shippingService',
};

// Normalized-header names whose values must NEVER be persisted (PII).
const PII_HEADERS = new Set([
  'buyername',
  'buyeremail',
  'buyernote',
  'buyeraddress1',
  'buyeraddress2',
  'buyercity',
  'buyerstate',
  'buyerzip',
  'buyercountry',
  'buyertaxidentifiername',
  'buyertaxidentifiervalue',
  'shiptoname',
  'shiptophone',
  'shiptoaddress1',
  'shiptoaddress2',
  'shiptozip',
  'paypaltransactionid',
]);

/** Split eBay Custom Label "<SKU>|<LOC>" (Standards §6). Labels without a
 *  pipe are treated as bare SKUs. */
export function parseCustomLabel(raw: string | null): { sku: string | null; loc: string | null } {
  if (!raw) return { sku: null, loc: null };
  const [sku, loc] = raw.split('|', 2).map((s) => s.trim());
  return { sku: sku || null, loc: loc || null };
}

class SalesImportService {
  async importOrders(buffer: Buffer, ebayAccountId: string, dryRun = false): Promise<SalesImportResult> {
    const result: SalesImportResult = {
      created: 0,
      skipped: 0,
      duplicates: 0,
      matchedToItems: 0,
      locMismatches: [],
      errors: [],
      dryRun,
    };

    const account = await prisma.ebayAccount.findUnique({ where: { id: ebayAccountId } });
    if (!account) throw new Error('Unknown eBay account');

    let text = buffer.toString('utf8').replace(/^﻿/, '');
    // Seller Hub exports open with a junk all-commas line before the real
    // header (spec §3b) — drop leading lines until the header row appears.
    const lines = text.split(/\r?\n/);
    const headerIdx = lines.findIndex((l) => /order number|sales record number/i.test(l));
    if (headerIdx > 0) text = lines.slice(headerIdx).join('\n');

    const records: Record<string, string>[] = parse(text, {
      columns: (header: string[]) => header.map(normalizeHeader),
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2;
      let mapped: MappedRow;
      try {
        const maybe = mapRow(records[i]!);
        if (!maybe) {
          result.skipped++; // preamble/spacer/totals rows
          continue;
        }
        mapped = maybe;
      } catch (err) {
        result.errors.push({ row: rowNum, reason: (err as Error).message || 'Unparseable row' });
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

      // Item join (spec §3b): Custom Label SKU → Item.sku, else Item Number
      // → Item.ebayItemId. LOC half compared against the DB, never written.
      const item =
        (mapped.sku
          ? await prisma.item.findUnique({
              where: { sku: mapped.sku },
              include: { drafts: { where: { filledById: { not: null } }, orderBy: { lastSeenAt: 'desc' }, take: 1 } },
            })
          : null) ??
        (mapped.legacyItemId
          ? await prisma.item.findUnique({
              where: { ebayItemId: mapped.legacyItemId },
              include: { drafts: { where: { filledById: { not: null } }, orderBy: { lastSeenAt: 'desc' }, take: 1 } },
            })
          : null);
      // Attribution chain (Standards §6): sale → item → most recent draft
      // with a known lister → StaffUser.
      const listedById = item?.drafts[0]?.filledById ?? null;

      if (item && mapped.locationCode && item.locationCode && mapped.locationCode !== item.locationCode) {
        result.locMismatches.push({
          row: rowNum,
          sku: mapped.sku ?? '',
          csvLoc: mapped.locationCode,
          dbLoc: item.locationCode,
        });
      }

      if (dryRun) {
        result.created++;
        if (item) result.matchedToItems++;
        continue;
      }

      await prisma.sale.create({
        data: {
          ebayAccountId,
          ebayOrderId: mapped.ebayOrderId,
          lineItemId: mapped.lineItemId,
          salesRecordNumber: mapped.salesRecordNumber,
          legacyItemId: mapped.legacyItemId,
          customLabel: mapped.customLabel,
          title: mapped.title,
          quantity: mapped.quantity,
          itemPrice: mapped.itemPrice,
          shippingPrice: mapped.shippingPrice,
          taxAmount: mapped.taxAmount,
          totalPrice: mapped.totalPrice,
          promoted: mapped.promoted,
          buyerUsername: mapped.buyerUsername,
          shipCity: mapped.shipCity,
          shipState: mapped.shipState,
          shipCountry: mapped.shipCountry,
          soldAt: mapped.soldAt,
          paidAt: mapped.paidAt,
          shippedAt: mapped.shippedAt,
          trackingNumber: mapped.trackingNumber,
          shippingService: mapped.shippingService,
          source: 'csv',
          rawData: stripPii(records[i]!),
          itemId: item?.id ?? null,
          consignmentGroupId: item?.consignmentGroupId ?? null,
          listedById,
          attributionStatus: listedById ? 'ATTRIBUTED' : 'PENDING',
        },
      });

      if (item) {
        result.matchedToItems++;
        const itemUpdate: Record<string, unknown> = {};
        if (item.status === 'LISTED') itemUpdate.status = 'SOLD';
        if (!item.ebayItemId && mapped.legacyItemId) itemUpdate.ebayItemId = mapped.legacyItemId;
        if (Object.keys(itemUpdate).length > 0) {
          await prisma.item.update({ where: { id: item.id }, data: itemUpdate });
        }
      }

      result.created++;
    }

    logger.info(
      { account: account.accountName, ...result, locMismatches: result.locMismatches.length },
      'sales CSV import finished',
    );
    return result;
  }
}

function normalizeHeader(header: string): string {
  const normalized = header.toLowerCase().replace(/[^a-z0-9]/g, '');
  return HEADER_ALIASES[normalized] || normalized;
}

function stripPii(row: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(row).filter(([k, v]) => !PII_HEADERS.has(k.toLowerCase()) && v !== ''),
  );
}

function mapRow(row: Record<string, string>): MappedRow | null {
  const ebayOrderId = (row.ebayOrderId || '').trim();
  if (!ebayOrderId) return null; // preamble/spacer/totals rows

  const title = (row.title || '').trim();
  const itemPrice = parseMoney(row.itemPrice);
  const soldAt = parseDate(row.soldAt || row.paidAt);
  if (itemPrice == null) throw new Error('Missing/invalid sold price');
  if (!soldAt) throw new Error('Missing/invalid sale date');

  const quantity = Math.max(1, parseInt(row.quantity || '1', 10) || 1);
  const shippingPrice = parseMoney(row.shippingPrice);
  const totalPrice = parseMoney(row.totalPrice) ?? itemPrice * quantity + (shippingPrice ?? 0);
  const legacyItemId = (row.legacyItemId || '').trim() || null;
  const salesRecordNumber = (row.salesRecordNumber || '').trim() || null;
  const customLabel = (row.customLabel || '').trim() || null;
  const { sku, loc } = parseCustomLabel(customLabel);

  return {
    ebayOrderId,
    // Spec §3b: Transaction ID, then SRN, then item number — never collide on '0'.
    lineItemId: (row.transactionId || '').trim() || salesRecordNumber || legacyItemId || '0',
    salesRecordNumber,
    legacyItemId,
    customLabel,
    sku,
    locationCode: loc,
    title: title || '(untitled)',
    quantity,
    itemPrice,
    shippingPrice,
    taxAmount: parseMoney(row.taxAmount),
    totalPrice,
    promoted: (row.promoted || '').trim().toLowerCase() === 'yes',
    buyerUsername: (row.buyerUsername || '').trim() || null,
    shipCity: (row.shipCity || '').trim() || null,
    shipState: (row.shipState || '').trim() || null,
    shipCountry: (row.shipCountry || '').trim() || null,
    soldAt,
    paidAt: parseDate(row.paidAt),
    shippedAt: parseDate(row.shippedAt),
    trackingNumber: (row.trackingNumber || '').trim() || null,
    shippingService: (row.shippingService || '').trim() || null,
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
  // Seller Hub uses "Apr-01-26" — make it Date.parse friendly.
  const monthFirst = trimmed.replace(
    /^([A-Za-z]{3})-(\d{1,2})-(\d{2,4})$/,
    (_m, mon, day, year) => `${mon} ${day} ${year.length === 2 ? '20' + year : year}`,
  );
  const parsed = new Date(monthFirst);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const salesImportService = new SalesImportService();
