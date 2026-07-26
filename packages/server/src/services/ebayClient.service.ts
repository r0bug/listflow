// Per-account eBay API clients (ported from the preserved wip session).
// App credentials come from env (one eBay developer app for the suite);
// per-account OAuth tokens live on the EbayAccount row. The library
// auto-refreshes access tokens and we persist every refresh so restarts
// stay logged in. Read paths only (sales sync, Browse) — publishing is
// drafts+extension (Standards §6).

import eBayApi from '@hendt/ebay-api';
import { prisma } from '../db/prisma.js';
import { env } from '../config/env.js';
import { logger } from '../util/logger.js';
import type { EbayAccount } from '../generated/prisma/index.js';

const SELL_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
];

class EbayClientService {
  private clients = new Map<string, eBayApi>();

  ready(): boolean {
    return Boolean(env.EBAY_CLIENT_ID && env.EBAY_CLIENT_SECRET);
  }

  buildAppClient(sandbox: boolean, siteId: number): eBayApi {
    if (!this.ready()) throw new Error('EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not configured');
    return new eBayApi({
      appId: env.EBAY_CLIENT_ID!,
      certId: env.EBAY_CLIENT_SECRET!,
      devId: env.EBAY_DEV_ID || undefined,
      sandbox,
      siteId,
      marketplaceId: eBayApi.MarketplaceId.EBAY_US,
      ruName: env.EBAY_RU_NAME || undefined,
    });
  }

  async getClientForAccount(accountId: string): Promise<eBayApi> {
    const cached = this.clients.get(accountId);
    if (cached) return cached;

    const account = await prisma.ebayAccount.findUniqueOrThrow({ where: { id: accountId } });
    if (!account.refreshToken) {
      throw new Error(`eBay account "${account.accountName}" is not connected (no refresh token)`);
    }

    const client = this.buildAppClient(account.sandbox, account.siteId);
    client.OAuth2.setScope(SELL_SCOPES);
    client.OAuth2.setCredentials({
      access_token: account.authToken || '',
      refresh_token: account.refreshToken,
      expires_in: secondsUntil(account.tokenExpiresAt),
      refresh_token_expires_in: 47304000,
      token_type: 'User Access Token',
    } as never);

    client.OAuth2.on('refreshAuthToken', async (token: { access_token: string; expires_in?: number }) => {
      try {
        await prisma.ebayAccount.update({
          where: { id: accountId },
          data: {
            authToken: token.access_token,
            tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
          },
        });
      } catch (err) {
        logger.error({ err, accountId }, 'failed to persist refreshed eBay token');
      }
    });

    this.clients.set(accountId, client);
    return client;
  }

  invalidate(accountId: string) {
    this.clients.delete(accountId);
  }

  async getConnectedAccounts(): Promise<EbayAccount[]> {
    return prisma.ebayAccount.findMany({ where: { isActive: true, refreshToken: { not: null } } });
  }

  authScopes(): string[] {
    return SELL_SCOPES;
  }
}

function secondsUntil(date: Date | null): number {
  if (!date) return 0;
  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
}

export const ebayClientService = new EbayClientService();
