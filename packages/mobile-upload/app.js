// listflow mobile upload PWA.
// One of the two sanctioned staff web surfaces (fleet Standards §1):
// TeamTime PIN login → JWT in localStorage → multipart uploads to the one
// ingest door with groupHint (capture-time grouping) + PWA_UPLOAD provenance.
// Ingest is sha256-idempotent, so re-uploading after a flaky connection is
// always safe.

const $ = (id) => document.getElementById(id);
const API = ''; // same-origin (served by the listflow server at /m/)

let queue = []; // {file, previewUrl, state: pending|uploading|done|dup|fail, err}
let itemSeq = 1;

// ── auth ──────────────────────────────────────────────────────────────
function token() {
  return localStorage.getItem('lf_jwt') || '';
}
function user() {
  try {
    return JSON.parse(localStorage.getItem('lf_user') || 'null');
  } catch {
    return null;
  }
}

async function login(email, pin) {
  const res = await fetch(`${API}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, pin }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  localStorage.setItem('lf_jwt', data.token);
  localStorage.setItem('lf_user', JSON.stringify(data.user));
}

function logout() {
  localStorage.removeItem('lf_jwt');
  localStorage.removeItem('lf_user');
  render();
}

$('login-btn').addEventListener('click', async () => {
  const msg = $('login-msg');
  msg.textContent = 'Signing in…';
  msg.className = 'msg';
  try {
    await login($('email').value.trim(), $('pin').value);
    msg.textContent = '';
    render();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'msg err';
  }
});
$('logout-btn').addEventListener('click', logout);

// ── capture ───────────────────────────────────────────────────────────
$('drop').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', (e) => {
  for (const file of e.target.files) {
    queue.push({ file, previewUrl: URL.createObjectURL(file), state: 'pending' });
  }
  e.target.value = '';
  renderQueue();
});

$('next-item').addEventListener('click', () => {
  itemSeq += 1;
  $('item-tag').value = `item-${itemSeq}`;
  $('cap-msg').textContent = `Now shooting: item-${itemSeq}`;
  $('cap-msg').className = 'msg ok';
});

// ── upload ────────────────────────────────────────────────────────────
async function uploadOne(entry, groupHint) {
  const form = new FormData();
  form.append('file', entry.file, entry.file.name || 'photo.jpg');
  form.append('source', 'PWA_UPLOAD');
  if (groupHint) form.append('groupHint', groupHint);
  const res = await fetch(`${API}/api/v1/ingest/photo`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}` },
    body: form,
  });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired — sign in again');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

$('upload-btn').addEventListener('click', async () => {
  const hint = $('item-tag').value.trim() || undefined;
  const btn = $('upload-btn');
  btn.disabled = true;
  for (const entry of queue) {
    if (entry.state === 'done' || entry.state === 'dup') continue;
    entry.state = 'uploading';
    renderQueue();
    try {
      const out = await uploadOne(entry, hint);
      entry.state = out.status === 'duplicate' ? 'dup' : 'done';
    } catch (err) {
      entry.state = 'fail';
      entry.err = err.message;
    }
    renderQueue();
  }
  btn.disabled = false;
  const fails = queue.filter((q) => q.state === 'fail').length;
  $('cap-msg').textContent = fails
    ? `${fails} failed — tap Upload to retry them`
    : 'All photos uploaded ✓';
  $('cap-msg').className = fails ? 'msg err' : 'msg ok';
  if (!fails) {
    // Clear finished entries after a beat so the next item starts clean.
    setTimeout(() => {
      queue = queue.filter((q) => q.state === 'fail');
      renderQueue();
    }, 1500);
  }
});

// ── render ────────────────────────────────────────────────────────────
const STATE_LABEL = { pending: 'ready', uploading: '…', done: '✓ uploaded', dup: 'already have it', fail: '✗' };

function renderQueue() {
  const q = $('queue');
  q.innerHTML = '';
  for (const entry of queue) {
    const row = document.createElement('div');
    row.className = 'qrow';
    const img = document.createElement('img');
    img.src = entry.previewUrl;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = entry.file.name || 'photo';
    const state = document.createElement('span');
    state.className = `state ${entry.state}`;
    state.textContent = STATE_LABEL[entry.state] + (entry.err ? ` ${entry.err}` : '');
    row.append(img, name, state);
    q.appendChild(row);
  }
  $('bigbar').classList.toggle('hidden', queue.length === 0);
  const remaining = queue.filter((e) => e.state === 'pending' || e.state === 'fail').length;
  $('upload-btn').textContent = remaining ? `Upload ${remaining} photo${remaining === 1 ? '' : 's'}` : 'Done';
}

function render() {
  const authed = Boolean(token());
  $('login-view').classList.toggle('hidden', authed);
  $('main-view').classList.toggle('hidden', !authed);
  if (authed) {
    $('who').textContent = user()?.name || user()?.email || '';
    if (!$('item-tag').value) $('item-tag').value = `item-${itemSeq}`;
  }
}

render();

// PWA shell caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => undefined);
}
