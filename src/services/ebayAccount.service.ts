import eBayApi from '@hendt/ebay-api';
import { prisma } from '../config/database';
import type { EbayAccount } from '../generated/prisma';

const SELL_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
];

/**
 * Builds and caches one eBayApi client per EbayAccount row, using the
 * account's stored OAuth tokens (not env vars). The library auto-refreshes
 * expired access tokens with the refresh token and emits 'refreshAuthToken';
 * we persist every refreshed token back to the row so restarts stay logged in.
 */
class EbayAccountService {
  private clients = new Map<string, eBayApi>();

  async getClientForAccount(accountId: string): Promise<eBayApi> {
    const cached = this.clients.get(accountId);
    if (cached) return cached;

    const account = await prisma.ebayAccount.findUniqueOrThrow({ where: { id: accountId } });
    if (!account.refreshToken) {
      throw new Error(`eBay account "${account.accountName}" is not connected (no refresh token)`);
    }

    const client = new eBayApi({
      appId: account.appId,
      certId: account.certId,
      devId: account.devId || undefined,
      sandbox: account.sandbox,
      siteId: account.siteId,
      marketplaceId: eBayApi.MarketplaceId.EBAY_US,
      ruName: process.env.EBAY_RU_NAME || undefined,
    });

    client.OAuth2.setScope(SELL_SCOPES);
    client.OAuth2.setCredentials({
      access_token: account.authToken || '',
      refresh_token: account.refreshToken,
      expires_in: this.secondsUntil(account.tokenExpiresAt),
      refresh_token_expires_in: 47304000,
      token_type: 'User Access Token',
    } as any);

    client.OAuth2.on('refreshAuthToken', async (token: any) => {
      try {
        await prisma.ebayAccount.update({
          where: { id: accountId },
          data: {
            authToken: token.access_token,
            tokenExpiresAt: token.expires_in
              ? new Date(Date.now() + token.expires_in * 1000)
              : null,
          },
        });
      } catch (err) {
        console.error(`Failed to persist refreshed token for account ${accountId}:`, err);
      }
    });

    this.clients.set(accountId, client);
    return client;
  }

  /** Drop a cached client (e.g. after reconnect via OAuth). */
  invalidate(accountId: string) {
    this.clients.delete(accountId);
  }

  /** Accounts that are active and have completed the OAuth connect flow. */
  async getConnectedAccounts(): Promise<EbayAccount[]> {
    return prisma.ebayAccount.findMany({
      where: { isActive: true, refreshToken: { not: null } },
    });
  }

  private secondsUntil(date: Date | null): number {
    if (!date) return 0;
    return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
  }
}

export const ebayAccountService = new EbayAccountService();
