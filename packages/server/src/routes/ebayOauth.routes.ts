// eBay OAuth connect flow for seller accounts (read-path tokens only —
// sales sync + Browse; publishing is drafts+extension, Standards §6).
//
//   GET /connect/:accountId   staff admin: returns the eBay consent URL
//                             (state = accountId, so the callback knows
//                             which row gets the tokens)
//   GET /callback             eBay redirects here with ?code&state

import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { ebayClientService } from '../services/ebayClient.service.js';
import { staffAuth, requireRole } from '../middleware/auth.js';
import { logger } from '../util/logger.js';
import { pstr, qstr } from '../util/req.js';

const router = Router();

router.get('/connect/:accountId', staffAuth, requireRole('admin', 'manager'), async (req, res) => {
  if (!ebayClientService.ready()) {
    res.status(503).json({ error: 'EBAY_CLIENT_ID / EBAY_CLIENT_SECRET not configured' });
    return;
  }
  const account = await prisma.ebayAccount.findUnique({ where: { id: pstr(req.params.accountId) } });
  if (!account) {
    res.status(404).json({ error: 'Unknown account' });
    return;
  }
  const client = ebayClientService.buildAppClient(account.sandbox, account.siteId);
  client.OAuth2.setScope(ebayClientService.authScopes());
  const url = client.OAuth2.generateAuthUrl(account.id); // state = account row id
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const code = qstr(req.query.code);
  const state = qstr(req.query.state); // accountId
  if (!code || !state) {
    res.status(400).send('Missing code/state');
    return;
  }
  const account = await prisma.ebayAccount.findUnique({ where: { id: state } });
  if (!account) {
    res.status(404).send('Unknown account in state param');
    return;
  }
  try {
    const client = ebayClientService.buildAppClient(account.sandbox, account.siteId);
    client.OAuth2.setScope(ebayClientService.authScopes());
    const token = (await client.OAuth2.getToken(code)) as {
      access_token: string;
      refresh_token: string;
      expires_in?: number;
    };
    await prisma.ebayAccount.update({
      where: { id: account.id },
      data: {
        authToken: token.access_token,
        refreshToken: token.refresh_token,
        tokenExpiresAt: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
      },
    });
    ebayClientService.invalidate(account.id);
    logger.info({ account: account.accountName }, 'eBay account connected');
    res.send(
      `<html><body style="font-family:system-ui;background:#181818;color:#eee;padding:40px">
        <h2>✓ ${account.accountName} connected</h2>
        <p>You can close this tab. Sales sync will pick up orders on its next run.</p>
      </body></html>`,
    );
  } catch (err) {
    logger.error({ err }, 'eBay OAuth callback failed');
    res.status(500).send(`OAuth exchange failed: ${(err as Error).message}`);
  }
});

export default router;
