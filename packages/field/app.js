// listflow field PWA — offline sold-comp reference at pick sites.
// Take a collection offline before leaving (bundle JSON + thumbs cached by
// the service worker); at the pick, browse the grid with sales data and no
// signal. Flags queue locally and sync when back online, seeding item stubs.

const $ = (id) => document.getElementById(id);

// ── auth (cookie set by same-origin login carries <img> requests too) ──
function token() { return localStorage.getItem('lf_jwt') || ''; }
function user() { try { return JSON.parse(localStorage.getItem('lf_user') || 'null'); } catch { return null; } }

async function apiFetch(path, init = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    ...init,
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${token()}`, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

$('login-btn').addEventListener('click', async () => {
  const msg = $('login-msg');
  msg.textContent = 'Signing in…'; msg.className = 'msg';
  try {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: $('email').value.trim(), pin: $('pin').value }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    localStorage.setItem('lf_jwt', data.token);
    localStorage.setItem('lf_user', JSON.stringify(data.user));
    msg.textContent = '';
    showList();
  } catch (err) { msg.textContent = err.message; msg.className = 'msg err'; }
});
$('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('lf_jwt'); localStorage.removeItem('lf_user');
  render();
});

// ── offline bundle store (localStorage JSON per collection) ───────────
function savedBundle(id) { try { return JSON.parse(localStorage.getItem(`lf_bundle_${id}`) || 'null'); } catch { return null; } }
function saveBundle(b) { localStorage.setItem(`lf_bundle_${b.id}`, JSON.stringify(b)); }
function savedBundleIds() {
  return Object.keys(localStorage).filter((k) => k.startsWith('lf_bundle_')).map((k) => k.slice(10));
}

// ── flag queue (offline-safe) ──────────────────────────────────────────
function flagQueue() { try { return JSON.parse(localStorage.getItem('lf_flags') || '[]'); } catch { return []; } }
function pushFlag(entry) { localStorage.setItem('lf_flags', JSON.stringify([...flagQueue(), entry])); }
async function syncFlags() {
  const q = flagQueue();
  if (q.length === 0 || !navigator.onLine) return;
  const remaining = [];
  for (const f of q) {
    try {
      await apiFetch(`/api/v1/collections/${f.collectionId}/flag`, { method: 'POST', body: JSON.stringify({ compId: f.compId, flagged: f.flagged }) });
    } catch { remaining.push(f); }
  }
  localStorage.setItem('lf_flags', JSON.stringify(remaining));
}

// ── collections list ───────────────────────────────────────────────────
async function showList() {
  render('list');
  $('who').textContent = user()?.name || '';
  const box = $('collections');
  box.innerHTML = '<div class="msg">Loading…</div>';
  let collections = [];
  try {
    ({ collections } = await apiFetch('/api/v1/collections'));
  } catch {
    // offline: show saved bundles only
    collections = savedBundleIds().map((id) => {
      const b = savedBundle(id);
      return { id, name: b?.name || '(offline)', compCount: b?.comps.length ?? 0, offlineOnly: true };
    });
  }
  const offline = new Set(savedBundleIds());
  box.innerHTML = '';
  if (collections.length === 0) box.innerHTML = '<div class="msg">No collections yet.</div>';
  for (const c of collections) {
    const row = document.createElement('div');
    row.className = 'col-row';
    const left = document.createElement('div');
    left.innerHTML = `<div class="name">${esc(c.name)}${offline.has(c.id) ? '<span class="badge">offline ✓</span>' : ''}</div>
      <div class="meta">${c.compCount} comps</div>`;
    const actions = document.createElement('div');
    actions.className = 'col-actions';
    const openBtn = document.createElement('button');
    openBtn.className = 'primary'; openBtn.textContent = 'Open';
    openBtn.onclick = () => openCollection(c.id);
    const offBtn = document.createElement('button');
    offBtn.className = 'ghost';
    offBtn.textContent = offline.has(c.id) ? 'Refresh offline' : 'Take offline';
    offBtn.onclick = () => takeOffline(c.id, offBtn);
    actions.append(openBtn, offBtn);
    row.append(left, actions);
    box.appendChild(row);
  }
}

$('new-col').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('nc-msg');
  msg.textContent = 'Building…'; msg.className = 'msg';
  try {
    const out = await apiFetch('/api/v1/collections', {
      method: 'POST',
      body: JSON.stringify({ name: $('nc-name').value.trim(), q: $('nc-q').value.trim() || undefined }),
    });
    msg.textContent = `Built with ${out.compCount} comps.`; msg.className = 'msg ok';
    $('nc-name').value = ''; $('nc-q').value = '';
    showList();
  } catch (err) { msg.textContent = err.message; msg.className = 'msg err'; }
});

async function takeOffline(id, btn) {
  const orig = btn.textContent;
  try {
    btn.textContent = 'Bundling…'; btn.disabled = true;
    const bundle = await apiFetch(`/api/v1/collections/${id}/bundle`);
    saveBundle(bundle);
    // Warm the SW cache with every thumb (cache-first afterwards).
    const thumbs = bundle.comps.map((c) => c.thumb).filter(Boolean);
    let done = 0;
    for (const t of thumbs) {
      try { await fetch(t, { credentials: 'include' }); } catch { /* skip */ }
      done += 1;
      btn.textContent = `Caching ${done}/${thumbs.length}`;
    }
    btn.textContent = 'offline ✓';
    showList();
  } catch (err) {
    btn.textContent = orig; btn.disabled = false;
    alert(`Offline save failed: ${err.message}`);
  }
}

// ── collection grid ────────────────────────────────────────────────────
let current = null;

async function openCollection(id) {
  let bundle = null;
  try { bundle = await apiFetch(`/api/v1/collections/${id}/bundle`); saveBundle(bundle); }
  catch { bundle = savedBundle(id); }
  if (!bundle) { alert('Not available offline — take it offline first.'); return; }
  current = bundle;
  render('grid');
  $('col-title').textContent = bundle.name;
  const s = bundle.stats;
  $('statsbar').innerHTML = s.count
    ? `<span><b>${s.count}</b> sold</span><span>avg <b>$${s.avg}</b></span><span>median <b>$${s.median}</b></span><span>range <b>$${s.min}–$${s.max}</b></span>`
    : '<span>no priced comps</span>';
  drawGrid();
}

$('back').addEventListener('click', () => showList());
$('filter').addEventListener('input', drawGrid);
$('sort').addEventListener('change', drawGrid);

function drawGrid() {
  if (!current) return;
  const f = $('filter').value.trim().toLowerCase();
  const sort = $('sort').value;
  let comps = current.comps.filter((c) => !f || c.title.toLowerCase().includes(f));
  comps.sort((a, b) => {
    if (sort === 'price-asc') return (a.soldPrice ?? 0) - (b.soldPrice ?? 0);
    if (sort === 'date-desc') return new Date(b.soldDate ?? 0) - new Date(a.soldDate ?? 0);
    return (b.soldPrice ?? 0) - (a.soldPrice ?? 0);
  });
  const grid = $('grid');
  grid.innerHTML = '';
  for (const c of comps) {
    const card = document.createElement('div');
    card.className = `card${c.flagged ? ' flagged' : ''}`;
    const img = c.thumb
      ? `<img src="${c.thumb}" loading="lazy" alt="" />`
      : `<div class="noimg">no photo</div>`;
    card.innerHTML = `${img}
      <button class="flag" title="Flag for listing">${c.flagged ? '★' : '☆'}</button>
      <div class="body">
        <div class="price">${c.soldPrice != null ? `$${c.soldPrice.toFixed(2)}` : '—'}</div>
        <div class="title">${esc(c.title)}</div>
        <div class="sub">${c.condition ? esc(c.condition) + ' · ' : ''}${c.soldDate ? new Date(c.soldDate).toLocaleDateString() : ''}</div>
      </div>`;
    card.querySelector('.flag').onclick = async () => {
      c.flagged = !c.flagged;
      saveBundle(current);
      drawGrid();
      const entry = { collectionId: current.id, compId: c.id, flagged: c.flagged };
      if (navigator.onLine) {
        try { await apiFetch(`/api/v1/collections/${current.id}/flag`, { method: 'POST', body: JSON.stringify({ compId: c.id, flagged: c.flagged }) }); return; }
        catch { /* fall through to queue */ }
      }
      pushFlag(entry);
    };
    grid.appendChild(card);
  }
}

// ── shell ──────────────────────────────────────────────────────────────
function esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }

function netBadges() {
  for (const id of ['net', 'net2']) {
    const b = $(id);
    if (!b) continue;
    b.className = navigator.onLine ? 'on' : 'off';
    b.textContent = navigator.onLine ? 'online' : 'OFFLINE';
  }
}
window.addEventListener('online', () => { netBadges(); syncFlags(); });
window.addEventListener('offline', netBadges);

function render(view) {
  const authed = Boolean(token());
  $('login-view').classList.toggle('hidden', authed);
  $('list-view').classList.toggle('hidden', !authed || view === 'grid');
  $('grid-view').classList.toggle('hidden', !authed || view !== 'grid');
  netBadges();
}

if (token()) { showList(); syncFlags(); } else { render(); }

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => undefined);
}
