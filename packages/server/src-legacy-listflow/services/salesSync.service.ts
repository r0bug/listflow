import { prisma } from '../config/database';
import { ebayAccountService } from './ebayAccount.service';
import { remoteImageService } from './remoteImage.service';
import { commissionService } from './commission.service';
import type { EbayAccount } from '../generated/prisma';

const BACKFILL_DAYS = 90;
const BACKFILL_WINDOW_DAYS = 7;
const PAGE_LIMIT = 50;

export interface AccountSyncResult {
  accountName: string;
  ordersSeen: number;
  salesCreated: number;
  salesUpdated: number;
  commissionsCreated: number;
  error?: string;
}

/**
 * Pulls own-account sales via the Sell Fulfillment API. First run backfills
 * BACKFILL_DAYS of order history in windowed chunks (resumable via
 * EbayAccount.ordersSyncedThrough); afterwards each run picks up orders
 * modified since the last sync. Sales upsert on
 * (ebayAccountId, ebayOrderId, lineItemId), so re-runs are no-ops.
 */
class SalesSyncService {
  private running = false;

  async syncAllAccounts(): Promise<AccountSyncResult[]> {
    if (this.running) {
      return [];
    }
    this.running = true;
    try {
      const accounts = await ebayAccountService.getConnectedAccounts();
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
      salesUpdated: 0,
      commissionsCreated: 0,
    };

    try {
      const client = await ebayAccountService.getClientForAccount(account.id);
      const now = new Date();

      if (!account.ordersSyncedThrough) {
        // Initial backfill: walk creation-date windows oldest-first so the
        // cursor only ever moves forward and a crash resumes where it left off.
        let windowStart = new Date(now.getTime() - BACKFILL_DAYS * 86400000);
        while (windowStart < now) {
          const windowEnd = new Date(
            Math.min(windowStart.getTime() + BACKFILL_WINDOW_DAYS * 86400000, now.getTime())
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
        // Incremental: everything modified since the cursor (with 1h overlap
        // for clock skew / in-flight orders).
        const since = new Date(account.ordersSyncedThrough.getTime() - 3600000);
        const filter = `lastmodifieddate:[${since.toISOString()}..${now.toISOString()}]`;
        await this.ingestOrders(client, account, filter, result);
        await prisma.ebayAccount.update({
          where: { id: account.id },
          data: { ordersSyncedThrough: now, lastSync: now },
        });
      }
    } catch (error: any) {
      console.error(`Sales sync failed for ${account.accountName}:`, error?.message || error);
      result.error = error?.message || String(error);
    }

    return result;
  }

  private async ingestOrders(
    client: any,
    account: EbayAccount,
    filter: string,
    result: AccountSyncResult
  ) {
    let offset = 0;
    for (;;) {
      const page = await client.sell.fulfillment.getOrders({
        filter,
        limit: PAGE_LIMIT,
        offset,
      });
      const orders = page?.orders || [];

      for (const order of orders) {
        result.ordersSeen++;
        if (order.orderPaymentStatus && !['PAID', 'PARTIALLY_REFUNDED'].includes(order.orderPaymentStatus)) {
          continue; // skip unpaid / fully refunded / cancelled orders
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
    order: any,
    lineItem: any,
    result: AccountSyncResult
  ) {
    const lineItemId = String(lineItem.lineItemId || '0');
    const legacyItemId = lineItem.legacyItemId ? String(lineItem.legacyItemId) : null;
    const quantity = lineItem.quantity || 1;
    const itemTotal = parseFloat(lineItem.lineItemCost?.value || '0');
    const itemPrice = quantity > 0 ? round2(itemTotal / quantity) : itemTotal;
    const shipping = parseFloat(lineItem.deliveryCost?.shippingCost?.value || '0') || null;
    const soldAt = new Date(order.creationDate);

    const existing = await prisma.sale.findUnique({
      where: {
        ebayAccountId_ebayOrderId_lineItemId: {
          ebayAccountId: account.id,
          ebayOrderId: String(order.orderId),
          lineItemId,
        },
      },
    });

    // Secondary guard for the CSV/API seam: same order + item ingested from a
    // CSV report will have a transactionId-based lineItemId that won't match.
    const csvTwin = !existing && legacyItemId
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
      result.salesUpdated++;
      return;
    }

    // Link (or create) the Listing so dashboards + agent tagging line up
    let listing = legacyItemId
      ? await prisma.listing.findUnique({ where: { ebayId: legacyItemId } })
      : null;
    if (!listing && legacyItemId) {
      listing = await prisma.listing.create({
        data: {
          title: lineItem.title || '(untitled)',
          price: itemPrice,
          ebayId: legacyItemId,
          status: 'sold',
          imageUrls: lineItem.image?.imageUrl ? [lineItem.image.imageUrl] : [],
          ebayAccountId: account.id,
          soldAt,
          soldPrice: itemPrice,
          metadata: { source: 'sales-sync' },
        },
      });
    } else if (listing) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { status: 'sold', soldAt, soldPrice: itemPrice },
      });
    }

    const imageUrl = lineItem.image?.imageUrl || listing?.imageUrls?.[0] || null;

    const sale = await prisma.sale.create({
      data: {
        ebayAccountId: account.id,
        ebayOrderId: String(order.orderId),
        lineItemId,
        legacyItemId,
        title: lineItem.title || '(untitled)',
        quantity,
        itemPrice,
        shippingPrice: shipping,
        totalPrice: round2(itemTotal + (shipping || 0)),
        currency: lineItem.lineItemCost?.currency || 'USD',
        buyerUsername: order.buyer?.username || null,
        buyerName: order.buyer?.buyerRegistrationAddress?.fullName || null,
        soldAt,
        imageUrl,
        source: 'api',
        rawData: { orderId: order.orderId, lineItem },
        listingId: listing?.id ?? null,
      },
    });
    result.salesCreated++;

    if (imageUrl) {
      const downloaded = await remoteImageService.downloadSaleImage(imageUrl, sale.id);
      if (downloaded) {
        await prisma.sale.update({ where: { id: sale.id }, data: downloaded });
      }
    }

    if (listing?.listingAgentId) {
      await commissionService.createForSale(sale.id, listing.listingAgentId);
      result.commissionsCreated++;
    }
  }

  /**
   * Sync active listings per account (Trading GetMyeBaySelling) so agents can
   * be tagged before items sell.
   */
  async syncActiveListings(): Promise<{ accountName: string; upserted: number; error?: string }[]> {
    const accounts = await ebayAccountService.getConnectedAccounts();
    const results: { accountName: string; upserted: number; error?: string }[] = [];

    for (const account of accounts) {
      const summary = { accountName: account.accountName, upserted: 0 as number, error: undefined as string | undefined };
      try {
        const client = await ebayAccountService.getClientForAccount(account.id);
        let pageNumber = 1;
        for (;;) {
          const response = await client.trading.GetMyeBaySelling({
            ActiveList: {
              Include: true,
              Pagination: { EntriesPerPage: 100, PageNumber: pageNumber },
            },
          });
          const items = toArray(response?.ActiveList?.ItemArray?.Item);
          for (const item of items) {
            const ebayId = String(item.ItemID);
            const price = parseFloat(item.SellingStatus?.CurrentPrice?.value ?? item.BuyItNowPrice?.value ?? '0');
            await prisma.listing.upsert({
              where: { ebayId },
              update: {
                title: item.Title || '(untitled)',
                price,
                status: 'active',
                ebayAccountId: account.id,
              },
              create: {
                title: item.Title || '(untitled)',
                price,
                ebayId,
                status: 'active',
                imageUrls: toArray(item.PictureDetails?.PictureURL),
                ebayAccountId: account.id,
                listedAt: item.ListingDetails?.StartTime
                  ? new Date(item.ListingDetails.StartTime)
                  : new Date(),
                metadata: { source: 'active-sync' },
              },
            });
            summary.upserted++;
          }
          const totalPages = response?.ActiveList?.PaginationResult?.TotalNumberOfPages || 1;
          if (pageNumber >= totalPages || items.length === 0) break;
          pageNumber++;
        }
      } catch (error: any) {
        console.error(`Active listings sync failed for ${account.accountName}:`, error?.message || error);
        summary.error = error?.message || String(error);
      }
      results.push(summary);
    }
    return results;
  }
}

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const salesSyncService = new SalesSyncService();
