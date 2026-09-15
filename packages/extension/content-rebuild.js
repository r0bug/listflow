// The guided rebuild panel (docs/PHASE2-INVENTORY-AUDIT.md §5.4).
//
// Runs on eBay's Sell flow. Rebuilds a NEW listing from one already captured
// on the other Chrome profile's eBay account — the second half of the owner's
// workflow: "scrape on one profile, switch profiles, and have the extension
// walk me through creating the new one."
//
// Why a step-through and not one blind fillForm(): eBay's Sell flow is a
// multi-step form, and filling it one step at a time with the source value
// visible beside each field turns a broken selector from silent data loss into
// a visible moment the operator can just paste past. The panel never clicks
// eBay's Save — publishing stays a human decision.

(async () => {
  if (window.__listflow_rebuild_loaded) return;
  window.__listflow_rebuild_loaded = true;

  const url = new URL(location.href);
  if (/ReviseItem/i.test(url.search)) return; // revise is content-listing.js's job

  // eBay's sell entry point is a funnel: /sl/prelist/identify -> "find a match"
  // -> the real form at /lstng. We must do NOTHING on the funnel pages. The
  // first version claimed the popup's stash on /sl/prelist/identify, deleted it,
  // and tried to open a panel on a page with no form — so by the time the
  // operator reached the actual form the intent was gone.
  if (!isListingForm(url)) return;

  // Three ways to arrive, in order of directness. The stash is what the popup
  // uses: eBay's listing entry points move around (/sl/sell is retired), so
  // "carry the intent" beats asking anyone to land on a particular URL.
  const explicit = url.searchParams.get('listflowRebuild') || (await peekPendingRebuild());
  if (explicit) {
    window.__listflow_rebuilding = true;
    await openPanel(explicit);
    // Only consume the stash once a panel is actually up on a real form.
    await chrome.storage.local.remove('pendingRebuild');
  } else {
    mountLauncher();
  }
})();

// The real listing form, not a step of eBay's prelist funnel.
function isListingForm(url) {
  if (/\/sl\/prelist|\/sl\/sell\/?$|\/sl\/identify/i.test(url.pathname)) return false;
  if (url.pathname.includes('/lstng')) return true;
  // Fallback: a page carrying a title input is the form, whatever it is called.
  return Boolean(
    document.querySelector('[data-testid="title-input"], [name="title"], input[aria-label*="Title" i]'),
  );
}

// Read WITHOUT deleting — the stash must survive every page of eBay's funnel
// and is only consumed once a panel is open on the real form.
async function peekPendingRebuild() {
  try {
    const { pendingRebuild } = await chrome.storage.local.get('pendingRebuild');
    if (!pendingRebuild) return null;
    const fresh = Date.now() - (pendingRebuild.at || 0) < 30 * 60 * 1000;
    if (!fresh) {
      await chrome.storage.local.remove('pendingRebuild');
      return null;
    }
    return pendingRebuild.itemId;
  } catch {
    return null;
  }
}

function mountLauncher() {
  const b = document.createElement('button');
  b.textContent = '📋 Rebuild from saved listing';
  b.style.cssText = [
    'position:fixed', 'bottom:22px', 'right:22px', 'z-index:2147483600',
    'background:#0064d2', 'color:#fff', 'border:0', 'border-radius:6px',
    'padding:10px 14px', 'font:600 13px -apple-system,system-ui,sans-serif',
    'cursor:pointer', 'box-shadow:0 4px 14px rgba(0,0,0,0.35)',
  ].join(';');
  b.addEventListener('click', () => { b.remove(); void openQueuePicker(); });
  document.body.appendChild(b);
}

// ── Queue picker ───────────────────────────────────────────────────────

async function openQueuePicker() {
  const panel = mountPanel();
  panel.setBody('<div style="padding:16px;color:#aaa;">Loading saved listings…</div>');

  let data;
  try {
    const cfg = await window.listflow.settings();
    const account = cfg.pinnedAccount?.accountName || '';
    data = await window.listflow.api(
      `/api/v1/capture/relist-queue?account=${encodeURIComponent(account)}`,
    );
    panel.setSubtitle(
      account
        ? `waiting to be relisted onto ${account}`
        : 'no eBay account pinned — showing everything captured',
    );
  } catch (err) {
    panel.setBody(`<div style="padding:16px;color:#f66;">Failed: ${esc(err.message)}</div>`);
    return;
  }

  if (!data.items.length) {
    panel.setBody(
      '<div style="padding:16px;color:#aaa;">Nothing waiting. Capture a listing on the other profile first.</div>',
    );
    return;
  }

  panel.setBody(`
    <input id="lf-q" placeholder="Filter…" style="width:100%;box-sizing:border-box;padding:7px 9px;background:#222;color:#eee;border:1px solid #3a3a3a;border-radius:4px;font:inherit;font-size:12px;margin-bottom:8px;" />
    <div id="lf-list"></div>`);

  const list = panel.body.querySelector('#lf-list');
  const render = (q) => {
    list.innerHTML = '';
    for (const it of data.items) {
      const hay = `${it.title || ''} ${it.sku || ''} ${it.brand || ''}`.toLowerCase();
      if (q && !hay.includes(q)) continue;
      const row = document.createElement('div');
      row.style.cssText =
        'padding:8px 0;border-top:1px dashed #2a2a2a;cursor:pointer;display:flex;flex-direction:column;gap:2px;';
      const warn = it.photoCount === 0 ? ' <span style="color:#f66;">no photos</span>' : '';
      const shelf = it.locationCode
        ? `<span style="color:#6c6;">${esc(it.locationCode)}</span>`
        : '<span style="color:#ea4;">no shelf</span>';
      row.innerHTML =
        `<div style="font-size:12px;color:#eee;">${esc((it.title || '(untitled)').slice(0, 60))}</div>` +
        `<div style="font-size:11px;color:#888;">${esc(it.sku || '')} · ${shelf} · ${it.photoCount} photo(s)${warn}</div>`;
      row.onclick = () => void openPanel(it.id, panel);
      list.appendChild(row);
    }
    if (!list.children.length) {
      list.innerHTML = '<div style="padding:10px 0;color:#666;font-size:12px;">No matches.</div>';
    }
  };
  render('');
  panel.body.querySelector('#lf-q').addEventListener('input', (e) =>
    render(e.target.value.trim().toLowerCase()),
  );
}

// ── Step definitions ───────────────────────────────────────────────────
//
// Each step slices the autofill payload down to the fields that belong to one
// screen of eBay's Sell flow. fillForm() only writes what is present in the
// payload it is given, so a slice IS a per-step fill — no second filler.

const STEPS = [
  {
    key: 'title',
    label: 'Title',
    show: (p) => p.title,
    slice: (p) => ({ title: p.title }),
  },
  {
    key: 'category',
    label: 'Category',
    show: (p) => p.category?.path || p.category?.id,
    slice: (p) => ({ category: p.category }),
  },
  {
    key: 'condition',
    label: 'Condition',
    show: (p) => p.condition?.label,
    slice: (p) => ({ condition: p.condition }),
  },
  {
    key: 'itemSpecifics',
    label: 'Item specifics',
    perField: true, // rendered as one row per specific, each separately copyable
    show: (p) =>
      p.itemSpecifics?.length
        ? p.itemSpecifics.map((s) => `${s.name}: ${s.values.join(', ')}`).join(' · ')
        : '',
    slice: (p) => ({ itemSpecifics: p.itemSpecifics }),
  },
  {
    key: 'description',
    label: 'Description',
    show: (p) => (p.description?.html ? stripTagsLocal(p.description.html).slice(0, 300) : ''),
    slice: (p) => ({ description: p.description }),
  },
  {
    key: 'pricing',
    label: 'Price',
    show: (p) =>
      [p.pricing?.buyNowPrice && `Buy It Now $${p.pricing.buyNowPrice}`,
       p.pricing?.startingPrice && `Start $${p.pricing.startingPrice}`,
       p.pricing?.format, p.pricing?.duration].filter(Boolean).join(' · '),
    slice: (p) => ({ pricing: p.pricing }),
  },
  {
    key: 'shipping',
    label: 'Shipping',
    show: (p) =>
      [p.shipping?.weightOz && `${p.shipping.weightOz} oz`, p.shipping?.postalCode]
        .filter(Boolean).join(' · '),
    slice: (p) => ({ shipping: p.shipping }),
  },
  {
    key: 'photos',
    label: 'Photos',
    photos: true,
    show: (p) => (p.photos?.length ? `${p.photos.length} photo(s)` : ''),
  },
  {
    key: 'customLabel',
    label: 'Custom Label (SKU|shelf)',
    required: true,
    show: (p) => p.customLabel,
    slice: (p) => ({ customLabel: p.customLabel }),
    // A label with no "|<shelf>" half locates nothing. Filling it silently
    // would produce a listing that looks complete and cannot be picked.
    warnIf: (p) => (!p.customLabel || !p.customLabel.includes('|')
      ? 'No shelf — this label cannot locate the item. Set a shelf on the source listing first.'
      : null),
  },
];

// ── Rebuild panel ──────────────────────────────────────────────────────

async function openPanel(itemId, existing) {
  const panel = existing || mountPanel();
  panel.setBody('<div style="padding:16px;color:#aaa;">Loading item…</div>');

  let payload;
  try {
    payload = await window.listflow.api(`/api/v1/items/${itemId}/autofill`);
  } catch (err) {
    panel.setBody(`<div style="padding:16px;color:#f66;">Failed: ${esc(err.message)}</div>`);
    return;
  }
  await window.listflow.setLastItem(itemId);
  panel.setSubtitle(payload.title ? payload.title.slice(0, 48) : itemId);

  const wrap = document.createElement('div');
  for (const step of STEPS) {
    const value = step.show(payload) || '';
    wrap.appendChild(renderStep(step, value, payload));
  }

  if (!payload.customLabel || !payload.customLabel.includes('|')) {
    const nag = document.createElement('div');
    nag.style.cssText =
      'background:#ea4;color:#111;border-radius:4px;padding:8px 10px;margin-bottom:10px;font-size:12px;line-height:1.4;';
    nag.innerHTML =
      '<b>No shelf set.</b> Rebuild this and the new listing carries a Custom Label that cannot locate the item. ' +
      'Set a shelf on the source listing (its page bar \u2192 \u201cSet shelf\u201d) before publishing.';
    wrap.insertBefore(nag, wrap.firstChild);
  }

  const foot = document.createElement('div');
  foot.style.cssText = 'margin-top:12px;padding-top:10px;border-top:1px solid #2a2a2a;color:#777;font-size:11px;line-height:1.5;';
  foot.textContent =
    'Nothing here clicks eBay’s Save. Review each step, then publish yourself.';

  panel.body.innerHTML = '';
  panel.body.append(wrap, foot);
}

function renderStep(step, value, payload) {
  const card = document.createElement('div');
  card.style.cssText = 'border-top:1px solid #2a2a2a;padding:9px 0;';

  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const name = document.createElement('div');
  name.textContent = step.label;
  name.style.cssText = 'font-size:12px;font-weight:600;color:#eee;flex:1;';

  const status = document.createElement('span');
  status.style.cssText = 'font-size:11px;color:#777;';

  head.append(name, status);

  const src = document.createElement('div');
  src.style.cssText =
    'font-size:11px;color:#9a9a9a;margin:4px 0 6px;max-height:70px;overflow:auto;white-space:pre-wrap;word-break:break-word;';
  src.textContent = value || '— nothing captured —';
  if (!value) src.style.color = step.required ? '#f66' : '#666';

  const warn = step.warnIf ? step.warnIf(payload) : null;
  let warnEl = null;
  if (warn) {
    warnEl = document.createElement('div');
    warnEl.style.cssText =
      'font-size:11px;color:#111;background:#ea4;border-radius:3px;padding:4px 6px;margin-bottom:6px;';
    warnEl.textContent = warn;
  }

  const btn = document.createElement('button');
  btn.textContent = step.photos ? 'Add photos' : 'Fill this step';
  btn.style.cssText =
    'background:#2a2a2a;color:#eee;border:1px solid #3a3a3a;border-radius:4px;padding:4px 10px;font:inherit;font-size:11px;cursor:pointer;';
  btn.disabled = !value;
  if (!value) btn.style.opacity = '0.4';

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    status.style.color = '#777';
    status.textContent = 'filling…';
    try {
      if (step.perField) {
        // Specifics report individually: a step-level "filled" over six fields
        // where two landed is a lie, and one copy button for six values is not
        // a recovery path.
        const r = window.listflow.fillSpecificsDetailed(payload.itemSpecifics || []);
        renderPerField(card, r);
        const total = r.filled.length + r.missed.length;
        if (r.missed.length === 0) {
          status.style.color = '#6c6';
          status.textContent = `filled ${total}/${total}`;
        } else {
          status.style.color = r.filled.length ? '#ea4' : '#f66';
          status.textContent = `${r.filled.length}/${total} filled`;
        }
      } else if (step.photos) {
        const n = await injectPhotos(payload.photos || []);
        status.style.color = n ? '#6c6' : '#ea4';
        status.textContent = n ? `added ${n}` : 'add manually →';
        if (!n) showPhotoFallback(payload.photos || []);
      } else {
        const filled = (await window.listflow.fillForm(step.slice(payload), { mode: 'step' })) || [];
        if (filled.length) {
          status.style.color = '#6c6';
          status.textContent = 'filled';
        } else {
          // A selector miss must never look like success: the value stays on
          // screen and the operator can paste it.
          status.style.color = '#f66';
          status.textContent = 'field not found — copy it';
          addCopyButton(card, value);
        }
      }
    } catch (err) {
      status.style.color = '#f66';
      status.textContent = err.message.slice(0, 40);
    } finally {
      btn.disabled = false;
    }
  });

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;';
  row.appendChild(btn);

  card.append(head, src);
  if (warnEl) card.appendChild(warnEl);
  card.appendChild(row);
  return card;
}

// One row per specific: name, value, whether it landed, and its own copy
// button. The ones that missed are what the operator has to key in by hand, so
// they are the ones that have to be readable and copyable individually.
function renderPerField(card, result) {
  card.querySelector('.lf-perfield')?.remove();
  const box = document.createElement('div');
  box.className = 'lf-perfield';
  box.style.cssText = 'margin:6px 0;display:flex;flex-direction:column;gap:3px;';

  const rows = [
    ...result.missed.map((f) => ({ ...f, ok: false })),
    ...result.filled.map((f) => ({ ...f, ok: true })),
  ];
  for (const f of rows) {
    const row = document.createElement('div');
    row.style.cssText =
      'display:flex;align-items:center;gap:6px;font-size:11px;padding:2px 0;border-top:1px dotted #2a2a2a;';
    const mark = document.createElement('span');
    mark.textContent = f.ok ? '✓' : '✗';
    mark.style.cssText = `flex:none;width:10px;color:${f.ok ? '#6c6' : '#f66'};`;
    const txt = document.createElement('span');
    txt.style.cssText = 'flex:1;min-width:0;color:#bbb;word-break:break-word;';
    txt.innerHTML = `<b style="color:#eee">${esc(f.name)}</b>: ${esc(f.value)}`;
    row.append(mark, txt);
    if (!f.ok) {
      const cp = document.createElement('button');
      cp.textContent = 'copy';
      cp.style.cssText =
        'flex:none;background:#3a2a2a;color:#eee;border:1px solid #5a3a3a;border-radius:3px;padding:1px 6px;font:inherit;font-size:10px;cursor:pointer;';
      cp.onclick = () => {
        navigator.clipboard?.writeText(f.value);
        cp.textContent = 'copied';
        setTimeout(() => (cp.textContent = 'copy'), 1200);
      };
      row.appendChild(cp);
    }
    box.appendChild(row);
  }
  card.insertBefore(box, card.lastElementChild);
}

function addCopyButton(card, value) {
  if (card.querySelector('.lf-copy')) return;
  const b = document.createElement('button');
  b.className = 'lf-copy';
  b.textContent = 'Copy value';
  b.style.cssText =
    'background:#3a2a2a;color:#eee;border:1px solid #5a3a3a;border-radius:4px;padding:4px 10px;font:inherit;font-size:11px;cursor:pointer;';
  b.onclick = () => navigator.clipboard?.writeText(value);
  card.querySelector('div:last-child').appendChild(b);
}

// ── Photos ─────────────────────────────────────────────────────────────
//
// Photos cannot be filled by writing a value. The SW fetches the re-hosted
// blobs (listflow's own origin, which it has permission for) and we synthesise
// a real file drop onto eBay's uploader. If that misses, the panel shows the
// images for manual drag rather than failing silently.
async function injectPhotos(photos) {
  if (!photos.length) return 0;
  const input = document.querySelector(
    'input[type="file"][accept*="image"], input[type="file"]',
  );
  if (!input) return 0;

  const dt = new DataTransfer();
  let ok = 0;
  for (let i = 0; i < photos.length; i++) {
    try {
      const res = await chrome.runtime.sendMessage({ type: 'fetch-blob', url: photos[i].url });
      if (!res?.ok || !res.dataUrl) continue;
      const blob = await (await fetch(res.dataUrl)).blob();
      dt.items.add(new File([blob], `image${i + 1}.jpg`, { type: blob.type || 'image/jpeg' }));
      ok++;
    } catch {
      /* keep going — a partial gallery beats none */
    }
  }
  if (!ok) return 0;
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return ok;
}

function showPhotoFallback(photos) {
  const box = document.createElement('div');
  box.style.cssText = 'margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;';
  for (const p of photos) {
    const img = document.createElement('img');
    img.src = p.url;
    img.draggable = true;
    img.title = 'Drag into eBay’s photo uploader';
    img.style.cssText = 'width:56px;height:56px;object-fit:cover;border-radius:4px;background:#222;cursor:grab;';
    box.appendChild(img);
  }
  document.querySelector('#__listflow_panel_body')?.appendChild(box);
}

// ── Panel shell ────────────────────────────────────────────────────────

function mountPanel() {
  document.getElementById('__listflow_panel')?.remove();
  const root = document.createElement('div');
  root.id = '__listflow_panel';
  root.style.cssText = [
    'position:fixed', 'top:0', 'right:0', 'bottom:0', 'width:340px', 'z-index:2147483600',
    'background:#181818', 'color:#eee', 'border-left:1px solid #3a3a3a',
    'font:13px -apple-system,system-ui,sans-serif', 'display:flex', 'flex-direction:column',
    'box-shadow:-4px 0 18px rgba(0,0,0,0.4)',
  ].join(';');

  const head = document.createElement('div');
  head.style.cssText = 'padding:10px 12px;border-bottom:1px solid #2a2a2a;flex:none;';
  const title = document.createElement('div');
  title.innerHTML = '<b style="color:#6af;">listflow</b> · rebuild';
  const subtitle = document.createElement('div');
  subtitle.style.cssText = 'font-size:11px;color:#888;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
  const close = document.createElement('button');
  close.textContent = '×';
  close.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:0;color:#888;font-size:20px;cursor:pointer;line-height:1;';
  close.onclick = () => { root.remove(); document.body.style.marginRight = ''; };
  head.append(title, subtitle, close);

  const body = document.createElement('div');
  body.id = '__listflow_panel_body';
  body.style.cssText = 'padding:10px 12px;overflow:auto;flex:1;';

  root.append(head, body);
  document.documentElement.appendChild(root);
  document.body.style.marginRight = '340px';

  return {
    root,
    body,
    setBody: (html) => { body.innerHTML = html; },
    setSubtitle: (t) => { subtitle.textContent = t; },
  };
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]),
  );
}

function stripTagsLocal(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').trim();
}
