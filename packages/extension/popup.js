// Popup: TeamTime-proxied sign-in, per-profile eBay account pin, connection
// status, scan-inbox progress, and the "items needing sold comps" list.
// Credentials live in the service worker; the popup talks to it via messages.

function send(msg) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (res) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(res);
    });
  });
}

const el = (id) => document.getElementById(id);
const show = (id, on = true) => el(id).classList.toggle('hidden', !on);

const statusEl = el('status');
const statusText = el('status-text');
const statusDot = statusEl.querySelector('.dot');

function setStatus(kind, text) {
  statusEl.className = `status ${kind}`;
  statusDot.className = `dot ${kind}`;
  statusText.textContent = text;
}

// ── Login / session ─────────────────────────────────────────────────

el('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = el('login-msg');
  msg.textContent = 'Signing in…';
  msg.className = 'msg';
  const res = await send({
    type: 'login',
    email: el('login-email').value.trim(),
    pin: el('login-pin').value,
  }).catch((err) => ({ ok: false, error: err.message }));
  if (!res.ok) {
    msg.textContent = res.error || 'Login failed';
    msg.className = 'msg status err';
    return;
  }
  msg.textContent = '';
  await refreshAll();
});

el('logout-btn').addEventListener('click', async () => {
  await send({ type: 'logout' });
  await refreshAll();
});

async function loadPinnedAccountSelect(state) {
  const sel = el('pinned-account');
  sel.innerHTML = '<option value="">(none)</option>';
  try {
    const data = await window.swiftlist.api('/api/v1/ebay-accounts');
    for (const a of data.accounts.filter((a) => a.isActive)) {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.accountName;
      if (state.pinnedAccount && state.pinnedAccount.id === a.id) opt.selected = true;
      sel.appendChild(opt);
    }
  } catch {
    /* accounts list needs staff login; leave (none) */
  }
  sel.onchange = async () => {
    const opt = sel.options[sel.selectedIndex];
    await chrome.storage.sync.set({
      pinnedAccountId: sel.value || '',
      pinnedAccountName: sel.value ? opt.textContent : '',
    });
  };
}

// ── Nav ────────────────────────────────────────────────────────────

async function openWebPath(p) {
  const { webUrl } = await window.swiftlist.settings();
  if (!webUrl) {
    setStatus('err', 'Web app URL not set — open Config.');
    return;
  }
  chrome.tabs.create({ url: `${webUrl}${p}` });
}

document.querySelectorAll('nav button[data-path]').forEach((btn) => {
  btn.addEventListener('click', () => openWebPath(btn.getAttribute('data-path')));
});
el('open-webui').addEventListener('click', (e) => {
  e.preventDefault();
  openWebPath('/');
});

// ── Config panel ────────────────────────────────────────────────────

const configForm = el('config');
const configMsg = el('config-msg');

el('toggle-config').addEventListener('click', async () => {
  await fillConfigForm();
  configForm.classList.toggle('visible');
  configMsg.textContent = '';
});

async function fillConfigForm() {
  const s = await window.swiftlist.settings();
  el('baseUrl').value = s.baseUrl;
  el('webUrl').value = s.webUrl;
  try {
    const res = await window.swiftlist.api('/api/v1/settings/ai-provider');
    if (res && res.provider) el('aiProvider').value = res.provider;
  } catch {
    /* dropdown stays at default */
  }
}

configForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const baseUrl = el('baseUrl').value.trim().replace(/\/$/, '');
  const webUrl = el('webUrl').value.trim().replace(/\/$/, '');
  await chrome.storage.sync.set({ baseUrl, webUrl });
  configMsg.textContent = 'Saved. Testing…';
  configMsg.className = 'msg';
  try {
    await window.swiftlist.ping();
    try {
      await window.swiftlist.api('/api/v1/settings/ai-provider', {
        method: 'PUT',
        body: JSON.stringify({ provider: el('aiProvider').value }),
      });
    } catch {
      /* provider save needs auth; ignore */
    }
    configMsg.textContent = 'Connected.';
    configMsg.className = 'msg status ok';
    await refreshAll();
  } catch (err) {
    configMsg.textContent = `Fail: ${err.message}`;
    configMsg.className = 'msg status err';
  }
});

// ── Items needing sold comps ───────────────────────────────────────

async function loadNeedsComps() {
  const needsEl = el('needs-comps');
  needsEl.className = '';
  try {
    const data = await window.swiftlist.api('/api/v1/extension/identify-search', {
      method: 'POST',
      body: '{}',
    });
    if (!data.items || data.items.length === 0) {
      needsEl.className = 'empty';
      needsEl.textContent = 'All caught up.';
      return;
    }
    needsEl.innerHTML = '';
    for (const it of data.items) {
      const row = document.createElement('div');
      row.className = 'row';
      const t = document.createElement('span');
      t.className = 't';
      t.textContent = it.title || '(untitled)';
      t.title = it.title || '';
      const btn = document.createElement('button');
      btn.textContent = 'Find sold →';
      btn.addEventListener('click', async () => {
        await window.swiftlist.setLastItem(it.id);
        chrome.tabs.create({ url: `${it.soldSearchUrl}&swiftlistItemId=${it.id}` });
      });
      row.appendChild(t);
      row.appendChild(btn);
      needsEl.appendChild(row);
    }
  } catch (err) {
    needsEl.className = 'empty';
    needsEl.textContent = `Error: ${err.message}`;
  }
}

// ── Scan inbox + progress polling ──────────────────────────────────

const scanBtn = el('scan-btn');
const progressWrap = el('progress-wrap');
const progressFill = el('progress-fill');
const progressText = el('progress-text');

let pollHandle = null;
let pollSession = null;

async function refreshScanFolder() {
  try {
    const data = await window.swiftlist.api('/api/v1/ingest/status');
    el('scan-folder').textContent = data.inbox || '';
    el('scan-folder').title = data.inbox || '';
    updateMcpBadge(data.externalMcp);
    return data.status;
  } catch {
    el('scan-folder').textContent = '';
    updateMcpBadge(null);
    return null;
  }
}

function updateMcpBadge(ext) {
  const badge = el('mcp-badge');
  const total = ext ? (ext.queued || 0) + (ext.claimed || 0) : 0;
  badge.classList.toggle('visible', total > 0);
  badge.textContent = total > 0 ? `${total} awaiting external AI` : '';
}

function fmtCost(n) {
  return n && n > 0 ? ` · $${n.toFixed(3)}` : '';
}

function renderProgress(status, scanInfo) {
  if (!status) {
    progressWrap.classList.remove('visible');
    return;
  }
  const { pending, processing, totalProcessed, totalErrors, totalAiCalls, totalAiCostUsd } = status;
  const sessionProcessed = totalProcessed - (pollSession?.startProcessed ?? 0);
  const sessionAi = totalAiCalls - (pollSession?.startAiCalls ?? 0);
  const sessionErrors = totalErrors - (pollSession?.startErrors ?? 0);
  const queuedInRun = scanInfo?.enqueued ?? 0;
  const target = Math.max(queuedInRun, sessionProcessed + pending + processing);
  const pct = target > 0 ? Math.min(100, Math.round((sessionProcessed / target) * 100)) : 0;

  progressWrap.classList.add('visible');
  progressFill.style.width = `${pct}%`;

  const active = pending + processing > 0;
  const label = active
    ? `Recognizing ${sessionProcessed}/${target}${fmtCost(totalAiCostUsd)}`
    : `<span class="ok">Done — ${sessionProcessed} processed${fmtCost(totalAiCostUsd)}</span>`;
  const extra = [];
  if (sessionAi > 0) extra.push(`${sessionAi} AI call${sessionAi === 1 ? '' : 's'}`);
  if (sessionErrors > 0) extra.push(`<span class="err">${sessionErrors} error${sessionErrors === 1 ? '' : 's'}</span>`);
  progressText.innerHTML = label + (extra.length ? ` · ${extra.join(' · ')}` : '');

  if (!active && pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

async function startScan() {
  scanBtn.disabled = true;
  scanBtn.textContent = 'Scanning…';
  progressText.innerHTML = 'Enqueuing files…';
  progressWrap.classList.add('visible');
  progressFill.style.width = '5%';

  let scanInfo = null;
  try {
    const pre = await window.swiftlist.api('/api/v1/ingest/status');
    pollSession = {
      startProcessed: pre.status.totalProcessed,
      startAiCalls: pre.status.totalAiCalls,
      startErrors: pre.status.totalErrors,
    };
    scanInfo = await window.swiftlist.api('/api/v1/ingest/scan', { method: 'POST', body: '{}' });
    if (scanInfo.truncated) {
      progressText.innerHTML = `<span class="err">Truncated at ${scanInfo.enqueued} files (limit reached).</span>`;
    }
  } catch (err) {
    progressText.innerHTML = `<span class="err">Scan failed: ${err.message}</span>`;
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan inbox';
    return;
  }

  if (scanInfo.enqueued === 0) {
    progressText.innerHTML = `<span class="ok">Nothing new — ${scanInfo.scanned} file${scanInfo.scanned === 1 ? '' : 's'} already known.</span>`;
    progressFill.style.width = '100%';
    scanBtn.disabled = false;
    scanBtn.textContent = 'Scan inbox';
    return;
  }

  renderProgress(scanInfo.status, scanInfo);
  if (pollHandle) clearInterval(pollHandle);
  pollHandle = setInterval(async () => {
    try {
      const data = await window.swiftlist.api('/api/v1/ingest/status');
      renderProgress(data.status, scanInfo);
      updateMcpBadge(data.externalMcp);
      if (data.status.pending + data.status.processing === 0) {
        scanBtn.disabled = false;
        scanBtn.textContent = 'Scan inbox';
      }
    } catch (err) {
      progressText.innerHTML = `<span class="err">Poll failed: ${err.message}</span>`;
      clearInterval(pollHandle);
      pollHandle = null;
      scanBtn.disabled = false;
      scanBtn.textContent = 'Scan inbox';
    }
  }, 2000);
}

scanBtn.addEventListener('click', startScan);

// ── Boot ───────────────────────────────────────────────────────────

async function refreshAll() {
  const state = await send({ type: 'auth-state' });

  if (!state.loggedIn) {
    show('login-section', true);
    show('session-section', false);
    show('nav', false);
    show('scan-section', false);
    show('needs-comps-section', false);
    setStatus('warn', state.hasKey ? 'Signed out' : 'First sign-in needed');
    if (state.user?.email) el('login-email').value = state.user.email;
    return;
  }

  show('login-section', false);
  show('session-section', true);
  show('nav', true);
  show('scan-section', true);
  show('needs-comps-section', true);
  el('user-name').textContent = state.user?.name || '';
  await loadPinnedAccountSelect(state);

  try {
    await window.swiftlist.ping();
    setStatus('ok', new URL(state.baseUrl).host);
    await refreshScanFolder();
    await loadNeedsComps();
  } catch {
    setStatus('err', `Can't reach ${state.baseUrl}`);
  }
}

refreshAll();
