// Sell Fulfillment API order sync on the unified model (ported from the
// preserved wip session; Listing + Commission are gone — Item is the
// listing record and TeamTime owns commission math).
//
// First run per account backfills BACKFILL_DAYS in resumable windows
// (cursor: EbayAccount.ordersSyncedThrough); afterwards incremental on
// lastmodifieddate. Idempotent on (account, orderId, lineItemId) with a
// CSV-seam guard on (orderId, legacyItemId).
//
// Attribution (Standards §6): lineItem.sku carries our Custom Label
// "<SKU>|<LOC>" → Item.sku → latest draft with a lister → Sale.listedById.

import { prisma } from '../db/prisma.js';
import { logger } from '../util/logger.js';
import { ebayClientService } from './ebayClient.service.js';
import { remoteImageService } from './remoteImage.service.js';
import { parseCustomLabel } from './salesImport.service.js';
import type { EbayAccount } from '../generated/prisma/index.js';

const BACKFILL_DAYS = 90;
const BACKFILL_WINDOW_DAYS = 7;
const PAGE_LIMIT = 50;

export interface AccountSyncResult {
  accountName: string;
  ordersSeen: number;
  salesCreated: number;
  salesSkipped: number;
  attributed: number;
  error?: string;
}

interface FulfillmentLineItem {
  lineItemId?: string | number;
  legacyItemId?: string | number;
  sku?: string;
  title?: string;
  quantity?: number;
  lineItemCost?: { value?: string; currency?: string };
  deliveryCost?: { shippingCost?: { value?: string } };
  ebayCollectAndRemitTaxes?: Array<{ amount?: { value?: string } }>;
  image?: { imageUrl?: string };
}

interface FulfillmentOrder {
  orderId: string;
  creationDate: string;
  orderPaymentStatus?: string;
  paymentSummary?: { payments?: Array<{ paymentDate?: string }> };
  buyer?: { username?: string };
  lineItems?: FulfillmentLineItem[];
}

class SalesSyncService {
  private running = false;

  async syncAllAccounts(): Promise<AccountSyncResult[]> {
    if (this.running) return [];
    this.running = true;
    try {
      const accounts = await ebayClientService.getConnectedAccounts();
      const results: AccountSyncResult[] = [];
      for (const account of accounts) {
        results.push(await this.syncAccount(account));
      }
      return results;
    } finally {
      this.running = false;
    }
  }

  async syncAccount(account: EbayAccount): Promise<AccountSyncResult> {
    const result: AccountSyncResult = {
      accountName: account.accountName,
      ordersSeen: 0,
      salesCreated: 0,
      salesSkipped: 0,
      attributed: 0,
    };

    try {
      const client = await ebayClientService.getClientForAccount(account.id);
      const now = new Date();

      if (!account.ordersSyncedThrough) {
        let windowStart = new Date(now.getTime() - BACKFILL_DAYS * 86400000);
        while (windowStart < now) {
          const windowEnd = new Date(
            Math.min(windowStart.getTime() + BACKFILL_WINDOW_DAYS * 86400000, now.getTime()),
          );
          const filter = `creationdate:[${windowStart.toISOString()}..${windowEnd.toISOString()}]`;
          await this.ingestOrders(client, account, filter, result);
          await prisma.ebayAccount.update({
            where: { id: account.id },
            data: { ordersSyncedThrough: windowEnd },
          });
          windowStart = windowEnd;
        }
      } else {
        const since = new Date(account.ordersSyncedThrough.getTime() - 3600000);
        const filter = `lastmodifieddate:[${since.toISOString()}..${now.toISOString()}]`;
        await this.ingestOrders(client, account, filter, result);
        await prisma.ebayAccount.update({
          where: { id: account.id },
          data: { ordersSyncedThrough: now },
        });
      }
    } catch (error) {
      logger.error({ err: error, account: account.accountName }, 'sales sync failed');
      result.error = (error as Error).message || String(error);
    }

    return result;
  }

  private async ingestOrders(
    client: Awaited<ReturnType<typeof ebayClientService.getClientForAccount>>,
    account: EbayAccount,
    filter: string,
    result: AccountSyncResult,
  ) {
    let offset = 0;
    for (;;) {
      const page = (await client.sell.fulfillment.getOrders({
        filter,
        limit: PAGE_LIMIT,
        offset,
      })) as { orders?: FulfillmentOrder[]; total?: number };
      const orders = page?.orders || [];

      for (const order of orders) {
        result.ordersSeen++;
        if (
          order.orderPaymentStatus &&
          !['PAID', 'PARTIALLY_REFUNDED'].includes(order.orderPaymentStatus)
        ) {
          continue; // unpaid / refunded / cancelled
        }
        for (const lineItem of order.lineItems || []) {
          await this.ingestLineItem(account, order, lineItem, result);
        }
      }

      offset += PAGE_LIMIT;
      if (orders.length < PAGE_LIMIT || offset >= (page?.total || 0)) break;
    }
  }

  private async ingestLineItem(
    account: EbayAccount,
    order: FulfillmentOrder,
    lineItem: FulfillmentLineItem,
    result: AccountSyncResult,
  ) {
    const lineItemId = String(lineItem.lineItemId || '0');
    const legacyItemId = lineItem.legacyItemId ? String(lineItem.legacyItemId) : null;
    const quantity = lineItem.quantity || 1;
    const itemTotal = parseFloat(lineItem.lineItemCost?.value || '0');
    const itemPrice = quantity > 0 ? round2(itemTotal / quantity) : itemTotal;
    const shipping = parseFloat(lineItem.deliveryCost?.shippingCost?.value || '0') || null;
    const tax =
      (lineItem.ebayCollectAndRemitTaxes || [])
        .map((t) => parseFloat(t.amount?.value || '0'))
        .reduce((a, b) => a + b, 0) || null;
    const soldAt = new Date(order.creationDate);
    const paidAt = order.paymentSummary?.payments?.[0]?.paymentDate
      ? new Date(order.paymentSummary.payments[0]!.paymentDate!)
      : null;

    const existing = await prisma.sale.findUnique({
      where: {
        ebayAccountId_ebayOrderId_lineItemId: {
          ebayAccountId: account.id,
          ebayOrderId: String(order.orderId),
          lineItemId,
        },
      },
    });
    const csvTwin =
      !existing && legacyItemId
        ? await prisma.sale.findFirst({
            where: {
              ebayAccountId: account.id,
              ebayOrderId: String(order.orderId),
              legacyItemId,
              source: 'csv',
            },
          })
        : null;
    if (existing || csvTwin) {
      result.salesSkipped++;
      return;
    }

    // Item join: Custom Label SKU (lineItem.sku) first, then item number.
    const customLabel = lineItem.sku?.trim() || null;
    const { sku, loc } = parseCustomLabel(customLabel);
    const draftsInclude = {
      drafts: {
        where: { filledById: { not: null } },
        orderBy: { lastSeenAt: 'desc' as const },
        take: 1,
      },
    };
    const item =
      (sku ? await prisma.item.findUnique({ where: { sku }, include: draftsInclude }) : null) ??
      (legacyItemId
        ? await prisma.item.findUnique({ where: { ebayItemId: legacyItemId }, include: draftsInclude })
        : null);
    const listedById = item?.drafts[0]?.filledById ?? null;
    if (item && loc && item.locationCode && loc !== item.locationCode) {
      logger.warn(
        { sku, csvLoc: loc, dbLoc: item.locationCode, orderId: order.orderId },
        'sale customLabel location differs from DB (eBay copy stale)',
      );
    }

    const imageUrl = lineItem.image?.imageUrl || null;

    const sale = await prisma.sale.create({
      data: {
        ebayAccountId: account.id,
        ebayOrderId: String(order.orderId),
        lineItemId,
        legacyItemId,
        customLabel,
        title: lineItem.title || '(untitled)',
        quantity,
        itemPrice,
        shippingPrice: shipping,
        taxAmount: tax,
        totalPrice: round2(itemTotal + (shipping || 0) + (tax || 0)),
        currency: lineItem.lineItemCost?.currency || 'USD',
        buyerUsername: order.buyer?.username || null, // PII policy: username only
        soldAt,
        paidAt,
        imageUrl,
        source: 'api',
        rawData: { orderId: order.orderId, lineItemId, sku: customLabel }, // minimal, PII-free
        itemId: item?.id ?? null,
        consignmentGroupId: item?.consignmentGroupId ?? null,
        listedById,
        attributionStatus: listedById ? 'ATTRIBUTED' : 'PENDING',
      },
    });
    result.salesCreated++;
    if (listedById) result.attributed++;

    if (item) {
      const patch: Record<string, unknown> = {};
      if (item.status === 'LISTED') patch.status = 'SOLD';
      if (!item.ebayItemId && legacyItemId) patch.ebayItemId = legacyItemId;
      if (Object.keys(patch).length > 0) {
        await prisma.item.update({ where: { id: item.id }, data: patch });
      }
    }

    if (imageUrl) {
      const downloaded = await remoteImageService.downloadSaleImage(imageUrl, {
        accountName: account.accountName,
        ebayOrderId: String(order.orderId),
        lineItemId,
      });
      if (downloaded) {
        await prisma.sale.update({ where: { id: sale.id }, data: downloaded });
      }
    }
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const salesSyncService = new SalesSyncService();
