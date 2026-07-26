// listflow extension service worker — the credential holder (Standards §6).
//
//  - Staff JWT lives HERE (chrome.storage.session): content scripts never
//    see it; they message the SW and the SW attaches credentials.
//  - Machine key (per-install, hashed server-side) in storage.sync;
//    self-provisioned on first login via /api/v1/extension/register.
//  - No hot-patch / remote code — removed per fleet Standards §6.
//
// Message API (chrome.runtime.sendMessage):
//   {type:'api', path, method?, body?}   → {ok, status, data}
//   {type:'login', email, pin}           → {ok, user} | {ok:false, error}
//   {type:'logout'}                      → {ok}
//   {type:'auth-state'}                  → {user, hasKey, baseUrl, pinnedAccount}

const DEFAULT_BASE_URL = 'http://localhost:3005';

chrome.runtime.onInstalled.addListener(async () => {
  const { machineId } = await chrome.storage.local.get('machineId');
  if (!machineId) {
    await chrome.storage.local.set({ machineId: crypto.randomUUID() });
  }
});

async function config() {
  const sync = await chrome.storage.sync.get(['baseUrl', 'apiKey', 'webUrl', 'pinnedAccountName', 'pinnedAccountId']);
  const local = await chrome.storage.local.get(['machineId', 'staffUser']);
  const session = await chrome.storage.session.get(['jwt']);
  return {
    baseUrl: (sync.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, ''),
    apiKey: sync.apiKey || '',
    webUrl: (sync.webUrl || '').replace(/\/$/, ''),
    pinnedAccountName: sync.pinnedAccountName || '',
    pinnedAccountId: sync.pinnedAccountId || '',
    machineId: local.machineId || '',
    staffUser: local.staffUser || null,
    jwt: session.jwt || '',
  };
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
      await chrome.storage.sync.set({ apiKey: regData.apiKey });
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
