// eBay OAuth connect flow for seller accounts (read-path tokens only —
// sales sync + Browse; publishing is drafts+extension, Standards §6).
//
//   GET /connect/:accountId   staff admin: returns the eBay consent URL
//                             (state = accountId, so the callback knows
//                             which row gets the tokens)
//   GET /callback             eBay redirects here with ?code&state

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
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
  // state is a short-lived signed token naming the account, so a forged or
  // replayed callback cannot attach someone else's eBay tokens to our row.
  const state = jwt.sign({ acct: account.id, purpose: 'ebay-oauth' }, env.JWT_SECRET, { expiresIn: '15m' });
  // generateAuthUrl's FIRST argument is the RuName, not the state: passing the
  // state there (as this used to) produced a consent URL eBay rejects.
  if (!env.EBAY_RU_NAME) {
    res.status(503).json({ error: 'EBAY_RU_NAME not configured (eBay developer portal → User Tokens → RuName)' });
    return;
  }
  const url = client.OAuth2.generateAuthUrl(env.EBAY_RU_NAME, ebayClientService.authScopes(), state);
  res.json({ url });
});

router.get('/callback', async (req, res) => {
  const code = qstr(req.query.code);
  const state = qstr(req.query.state);
  if (!code || !state) {
    res.status(400).send('Missing code/state');
    return;
  }
  let accountId: string;
  try {
    const d = jwt.verify(state, env.JWT_SECRET) as { acct?: string; purpose?: string };
    if (d.purpose !== 'ebay-oauth' || !d.acct) throw new Error('bad state');
    accountId = d.acct;
  } catch {
    res.status(400).send('Invalid or expired state — start the connect again from ListFlow');
    return;
  }
  const account = await prisma.ebayAccount.findUnique({ where: { id: accountId } });
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
        <h2>✓ ${escapeHtml(account.accountName)} connected</h2>
        <p>You can close this tab. Sales sync will pick up orders on its next run.</p>
      </body></html>`,
    );
  } catch (err) {
    logger.error({ err }, 'eBay OAuth callback failed');
    res.status(500).send(`OAuth exchange failed: ${escapeHtml((err as Error).message)}`);
  }
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export default router;
