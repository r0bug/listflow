// listflow extension service worker — the credential holder (Standards §6).
//
//  - Staff JWT lives HERE (chrome.storage.session): content scripts never
//    see it; they message the SW and the SW attaches credentials.
//  - Machine key (per-install, hashed server-side) in storage.LOCAL —
//    self-provisioned on first login via /api/v1/extension/register.
//
// PROFILE-LOCAL vs SYNCED (do not move these back):
//   storage.local  apiKey, machineId, pinnedAccountId/Name, staffUser
//   storage.sync   baseUrl, webUrl
// storage.sync is shared across every Chrome profile signed into the SAME
// Google account. We run one Chrome profile per eBay account (Standards §6),
// so anything identifying the profile — its machine key and which eBay account
// it is pinned to — MUST be profile-local. Put the pin in sync and two profiles
// silently overwrite each other's eBay account and share one machine key, which
// means captures get attributed to the account they were relisted INTO. Only
// baseUrl/webUrl are safe to sync: they are identical on both profiles.
//  - No hot-patch / remote code — removed per fleet Standards §6.
//
// Message API (chrome.runtime.sendMessage):
//   {type:'api', path, method?, body?}   → {ok, status, data}
//   {type:'login', email, pin}           → {ok, user} | {ok:false, error}
//   {type:'logout'}                      → {ok}
//   {type:'auth-state'}                  → {user, hasKey, baseUrl, pinnedAccount}
//   {type:'fetch-text', url}             → {ok, status, text}
//   {type:'fetch-blob', url}             → {ok, dataUrl}

const DEFAULT_BASE_URL = 'https://listflow.robug.com';

chrome.runtime.onInstalled.addListener(async () => {
  const { machineId } = await chrome.storage.local.get('machineId');
  if (!machineId) {
    await chrome.storage.local.set({ machineId: crypto.randomUUID() });
  }
});

async function config() {
  await migrateSyncedCredentials();
  const sync = await chrome.storage.sync.get(['baseUrl', 'webUrl']);
  const local = await chrome.storage.local.get([
    'machineId',
    'staffUser',
    'apiKey',
    'pinnedAccountId',
    'pinnedAccountName',
  ]);
  const session = await chrome.storage.session.get(['jwt']);
  return {
    baseUrl: (sync.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
    apiKey: local.apiKey || '',
    webUrl: (sync.webUrl || '').replace(/\/$/, ''),
    pinnedAccountName: local.pinnedAccountName || '',
    pinnedAccountId: local.pinnedAccountId || '',
    machineId: local.machineId || '',
    staffUser: local.staffUser || null,
    jwt: session.jwt || '',
  };
}

// One-time move of credentials that older builds wrote to storage.sync.
// Without this an upgrade silently logs the install out and drops its eBay
// account pin. Runs until it has nothing left to move, then costs one
// storage.sync read.
let migrationDone = false;
async function migrateSyncedCredentials() {
  if (migrationDone) return;
  const stale = await chrome.storage.sync.get(['apiKey', 'pinnedAccountId', 'pinnedAccountName']);
  const present = Object.keys(stale).filter((k) => stale[k]);
  if (present.length === 0) {
    migrationDone = true;
    return;
  }
  const local = await chrome.storage.local.get(['apiKey', 'pinnedAccountId', 'pinnedAccountName']);
  const carry = {};
  // Never clobber a value this profile already set locally — if both exist,
  // local is the one that belongs to THIS profile.
  for (const k of present) if (!local[k]) carry[k] = stale[k];
  if (Object.keys(carry).length) await chrome.storage.local.set(carry);
  await chrome.storage.sync.remove(['apiKey', 'pinnedAccountId', 'pinnedAccountName']);
  console.info('[listflow] migrated profile credentials out of storage.sync', Object.keys(carry));
  migrationDone = true;
}

async function apiFetch(path, { method = 'GET', body } = {}) {
  const cfg = await config();
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['X-Api-Key'] = cfg.apiKey;
  if (cfg.machineId) headers['X-Machine-Id'] = cfg.machineId;
  if (cfg.jwt) headers['Authorization'] = `Bearer ${cfg.jwt}`;
  const res = await fetch(`${cfg.baseUrl}${path}`, { method, headers, body });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function handleLogin(email, pin) {
  const cfg = await config();
  const res = await fetch(`${cfg.baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };

  await chrome.storage.session.set({ jwt: data.token });
  await chrome.storage.local.set({ staffUser: data.user });

  // First login on this profile: self-provision the per-install machine key.
  if (!cfg.apiKey) {
    const reg = await fetch(`${cfg.baseUrl}/api/v1/extension/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.token}` },
      body: JSON.stringify({ name: `extension: ${data.user.name} (${cfg.machineId.slice(0, 8)})` }),
    });
    const regData = await reg.json().catch(() => ({}));
    if (reg.ok && regData.apiKey) {
      await chrome.storage.local.set({ apiKey: regData.apiKey });
    }
  }
  return { ok: true, user: data.user };
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case 'api': {
          const out = await apiFetch(msg.path, { method: msg.method, body: msg.body });
          sendResponse(out);
          break;
        }
        case 'login': {
          sendResponse(await handleLogin(msg.email, msg.pin));
          break;
        }
        case 'logout': {
          await chrome.storage.session.remove('jwt');
          await chrome.storage.local.remove('staffUser');
          sendResponse({ ok: true });
          break;
        }
        // Cross-origin GET on behalf of a content script. eBay serves item
        // descriptions from vi.vipr.ebaydesc.com, so the page CANNOT read its
        // own description iframe — the SW has to fetch it. Deliberately
        // narrow: GET only, eBay description hosts only, no credentials.
        case 'fetch-text': {
          let host;
          try {
            host = new URL(msg.url).hostname;
          } catch {
            sendResponse({ ok: false, error: 'bad url' });
            break;
          }
          if (!/(^|\.)ebaydesc\.com$/.test(host) && !/(^|\.)ebay\.com$/.test(host)) {
            sendResponse({ ok: false, error: `refusing to fetch ${host}` });
            break;
          }
          const r = await fetch(msg.url, { credentials: 'omit' });
          sendResponse({ ok: r.ok, status: r.status, text: await r.text() });
          break;
        }
        // Fetches one of OUR OWN re-hosted photos and hands it back as a
        // data URL, so the rebuild panel can synthesise a real file drop onto
        // eBay's uploader. Restricted to the configured listflow server —
        // this must never become a general-purpose fetch proxy.
        case 'fetch-blob': {
          const cfg = await config();
          if (!cfg.baseUrl || !String(msg.url).startsWith(cfg.baseUrl)) {
            sendResponse({ ok: false, error: 'url is not on the listflow server' });
            break;
          }
          const r = await fetch(msg.url);
          if (!r.ok) {
            sendResponse({ ok: false, error: `HTTP ${r.status}` });
            break;
          }
          const blob = await r.blob();
          const dataUrl = await new Promise((resolve, reject) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result);
            fr.onerror = () => reject(fr.error);
            fr.readAsDataURL(blob);
          });
          sendResponse({ ok: true, dataUrl });
          break;
        }
        case 'auth-state': {
          const cfg = await config();
          sendResponse({
            user: cfg.staffUser,
            loggedIn: Boolean(cfg.jwt),
            hasKey: Boolean(cfg.apiKey),
            baseUrl: cfg.baseUrl,
            webUrl: cfg.webUrl,
            pinnedAccount: cfg.pinnedAccountName
              ? { id: cfg.pinnedAccountId, accountName: cfg.pinnedAccountName }
              : null,
          });
          break;
        }
        default:
          sendResponse({ ok: false, error: `unknown message type: ${msg?.type}` });
      }
    } catch (err) {
      sendResponse({ ok: false, error: String(err?.message || err) });
    }
  })();
  return true; // async sendResponse
});
