// Runs on https://www.ebay.com/itm/*. Injects two floating buttons:
//   ↧ Pull into swiftlist          → scrape as a sold-comp (existing flow)
//   ↑ Import details to listing    → pick an Item, approve fields, overwrite
//
// If the URL carries ?swiftlistItemId=…, the legacy auto-pull still fires
// for the sold-comp flow.

// Runs on https://www.ebay.com/itm/*.
//
// Injects THE bar (docs/PHASE2-INVENTORY-AUDIT.md §4.1) across the top of the
// page. Everything is operator-initiated — nothing fires on load except a
// single cheap status lookup, and the extension never navigates on its own.
//
// The bar is account-aware: the profile knows the eBay account it is pinned to
// (one profile per account, Standards §6) and the page names its seller, so
// "Revise" is offered only on listings this profile can actually revise.

(async () => {
  if (window.__listflow_bar_loaded) return;
  window.__listflow_bar_loaded = true;

  const url = new URL(location.href);
  const preboundItemId = url.searchParams.get('swiftlistItemId');
  const ebayItemId = (location.pathname.match(/\/itm\/(?:[^/]+\/)?(\d{8,})/) || [])[1];
  if (!ebayItemId) return;

  const bar = mountBar();
  await refreshBar(bar, ebayItemId);

  // Legacy sold-comp auto-pull, unchanged.
  if (preboundItemId) {
    setTimeout(() => pullSoldComp(bar.ghostBtn, ebayItemId, preboundItemId), 2_000);
  }
})();

// ── The bar ────────────────────────────────────────────────────────────

function mountBar() {
  document.getElementById('__listflow_bar')?.remove();

  const root = document.createElement('div');
  root.id = '__listflow_bar';
  root.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:2147483600',
    'background:#181818', 'color:#eee', 'border-bottom:1px solid #3a3a3a',
    'padding:7px 14px', 'display:flex', 'align-items:center', 'gap:12px',
    'font:13px -apple-system,system-ui,sans-serif', 'box-shadow:0 2px 10px rgba(0,0,0,0.35)',
  ].join(';');

  const brand = document.createElement('span');
  brand.textContent = 'listflow';
  brand.style.cssText = 'font-weight:700;letter-spacing:0.02em;color:#6af;flex:none;';

  const state = document.createElement('span');
  state.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#bbb;';
  state.textContent = 'checking…';

  const actions = document.createElement('span');
  actions.style.cssText = 'display:flex;gap:6px;flex:none;align-items:center;';

  // Kept so the legacy sold-comp path still has a button to report progress on.
  const ghostBtn = document.createElement('button');
  ghostBtn.style.cssText = 'display:none;';

  root.append(brand, state, actions, ghostBtn);
  document.documentElement.appendChild(root);

  // Push eBay's own page down so the bar never covers its header.
  const pad = document.createElement('style');
  pad.textContent = 'body{padding-top:38px !important;}';
  document.head.appendChild(pad);

  return { root, state, actions, ghostBtn };
}

function barButton(label, kind, onClick) {
  const b = document.createElement('button');
  b.textContent = label;
  const bg = { primary: '#16a34a', normal: '#2a2a2a', quiet: 'transparent' }[kind] || '#2a2a2a';
  b.style.cssText = [
    `background:${bg}`, 'color:#eee', 'border:1px solid #3a3a3a', 'border-radius:4px',
    'padding:5px 11px', 'font:inherit', 'font-size:12px', 'cursor:pointer', 'white-space:nowrap',
  ].join(';');
  b.addEventListener('click', () => onClick(b));
  return b;
}

function setBarState(bar, html, color) {
  bar.state.innerHTML = html;
  bar.state.style.color = color || '#bbb';
}

async function refreshBar(bar, ebayItemId) {
  bar.actions.innerHTML = '';
  let status = null;
  let pinned = null;
  try {
    const [s, cfg] = await Promise.all([
      window.swiftlist.api(`/api/v1/capture/status/${ebayItemId}`),
      window.swiftlist.settings(),
    ]);
    status = s;
    pinned = cfg.pinnedAccount;
  } catch (err) {
    setBarState(bar, `not connected — ${escapeHtml(err.message)}`, '#f66');
    bar.actions.appendChild(barButton('Retry', 'normal', () => refreshBar(bar, ebayItemId)));
    return;
  }

  // Whose listing is this? The seller shown on the page vs the account this
  // Chrome profile is pinned to. Without a pin we cannot claim it is ours.
  const seller = (scrapeSellerName() || '').trim();
  const isMine =
    Boolean(pinned?.accountName) &&
    seller.toLowerCase() === String(pinned.accountName).toLowerCase();

  const item = status?.captured ? status.item : null;

  if (!item) {
    setBarState(bar, `not saved${seller ? ` · seller ${escapeHtml(seller)}` : ''}`, '#bbb');
  } else {
    const shelf = item.locationCode
      ? `<b style="color:#6c6">${escapeHtml(item.locationCode)}</b>`
      : '<b style="color:#ea4">no shelf</b>';
    setBarState(
      bar,
      `<b style="color:#eee">${escapeHtml(item.sku || '(no sku)')}</b> · ${shelf} · ${item.photoCount} photo${item.photoCount === 1 ? '' : 's'}` +
        (item.title ? ` · ${escapeHtml(item.title.slice(0, 48))}` : ''),
      '#bbb',
    );
  }

  // ── Set / change shelf ──
  if (item) {
    bar.actions.appendChild(
      barButton(item.locationCode ? '📍 Change shelf' : '📍 Set shelf', item.locationCode ? 'normal' : 'primary', () =>
        openShelfPrompt(bar, ebayItemId, item),
      ),
    );
  }

  // ── Revise (Flow 1) — only on our own listing, and only once it has a shelf ──
  if (item && isMine) {
    bar.actions.appendChild(
      barButton('✎ Revise listing', 'normal', async (btn) => {
        if (!item.locationCode) {
          btn.textContent = 'Set a shelf first';
          setTimeout(() => (btn.textContent = '✎ Revise listing'), 1800);
          return;
        }
        // Navigation the OPERATOR asked for, on click. Not a crawl.
        location.href = `https://www.ebay.com/lstng?mode=ReviseItem&itemId=${encodeURIComponent(
          ebayItemId,
        )}&listflowItemId=${encodeURIComponent(item.id)}`;
      }),
    );
  } else if (item && pinned?.accountName) {
    const note = document.createElement('span');
    note.style.cssText = 'color:#777;font-size:11px;white-space:nowrap;';
    note.textContent = `not ${pinned.accountName}'s listing`;
    note.title = `This profile is pinned to ${pinned.accountName}; the page's seller is ${seller || 'unknown'}. Revise is only possible on your own listing.`;
    bar.actions.appendChild(note);
  } else if (item && !pinned?.accountName) {
    const note = document.createElement('span');
    note.style.cssText = 'color:#ea4;font-size:11px;white-space:nowrap;';
    note.textContent = 'no eBay account pinned';
    note.title = 'Pin this Chrome profile to an eBay account in the listflow popup to enable Revise.';
    bar.actions.appendChild(note);
  }

  // ── Copy (Flow 2 step 1) ──
  bar.actions.appendChild(
    barButton(item ? '📋 Re-copy' : '📋 Copy listing', item ? 'normal' : 'primary', (btn) =>
      doCapture(bar, btn, ebayItemId, pinned?.accountName),
    ),
  );

  // ── Legacy flows, kept out of the way ──
  bar.actions.appendChild(
    barButton('⋯', 'quiet', (btn) => {
      const menu = document.createElement('span');
      menu.style.cssText = 'display:flex;gap:6px;';
      menu.appendChild(barButton('↑ Into existing item', 'normal', () => openImportFlow(ebayItemId)));
      menu.appendChild(barButton('↧ Sold comp', 'normal', (b) => pullSoldComp(b, ebayItemId)));
      btn.replaceWith(menu);
    }),
  );
}

function scrapeSellerName() {
  const el = document.querySelector(
    '.x-sellercard-atf__info__about-seller a, .x-sellercard-atf__info__about-seller, span.mbg-nw, [data-testid="x-sellercard-atf"] a[href*="/usr/"]',
  );
  const raw = el ? el.textContent.trim() : '';
  // eBay renders "seller (1,234) 99.8%" in some layouts; keep the handle.
  return raw.split(/[\s(]/)[0] || '';
}

// ── Capture ────────────────────────────────────────────────────────────

async function doCapture(bar, btn, ebayItemId, sourceAccountName) {
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = 'Reading page…';
  try {
    const scraped = await scrapeFull(ebayItemId);
    btn.textContent = `Saving ${scraped.imageUrls?.length || 0} photo(s)…`;
    const result = await window.swiftlist.api('/api/v1/capture/listing', {
      method: 'POST',
      body: JSON.stringify({
        ebayItemId,
        title: scraped.title || undefined,
        brand: scraped.brand,
        model: scraped.model,
        categoryPath: scraped.categoryPath || undefined,
        condition: scraped.condition,
        description: scraped.description || undefined,
        descriptionHtml: scraped.descriptionHtml || undefined,
        itemSpecifics: scraped.itemSpecifics,
        imageUrls: scraped.imageUrls,
        price: typeof scraped.soldPrice === 'number' ? scraped.soldPrice : undefined,
        sellerName: scraped.sellerName || undefined,
        sourceAccountName: sourceAccountName || undefined,
        raw: scraped,
      }),
    });
    await window.swiftlist.setLastItem(result.item.id);
    await refreshBar(bar, ebayItemId);
    if (result.warnings?.length) showWarnings(result.warnings);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = `Failed: ${err.message}`.slice(0, 48);
    window.swiftlist.telemetry({ where: 'content-detail.capture', err: err.message, url: location.href });
    setTimeout(() => (btn.textContent = original), 4000);
  }
}

// Warnings are the gate on ending the source listing, so they are a blocking
// dialog rather than a toast that scrolls away unread.
function showWarnings(warnings) {
  const overlay = mountOverlay();
  setOverlayBody(
    overlay,
    `<div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:16px;font-weight:600;color:#b45309;">Saved — but check this before ending the original</div>
      <ul style="margin:0;padding-left:20px;line-height:1.6;color:#444;">
        ${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}
      </ul>
      <div style="display:flex;justify-content:flex-end;">
        <button id="lf-ok" style="padding:8px 14px;background:#0064d2;color:#fff;border:0;border-radius:4px;cursor:pointer;font:inherit;">Understood</button>
      </div>
    </div>`,
  );
  overlay.querySelector('#lf-ok').onclick = () => overlay.remove();
}

// ── Shelf entry ────────────────────────────────────────────────────────
//
// Scanner-friendly: the field takes focus, a barcode scanner types the code
// and sends Enter, and that submits. No mouse needed at the shelf.
async function openShelfPrompt(bar, ebayItemId, item) {
  const overlay = mountOverlay();
  let locations = [];
  try {
    const data = await window.swiftlist.api('/api/v1/locations');
    locations = data.locations || [];
  } catch {
    /* validation still happens server-side; the datalist is a convenience */
  }

  setOverlayBody(
    overlay,
    `<div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:16px;font-weight:600;">Shelf for ${escapeHtml(item.sku || 'this item')}</div>
      <div style="color:#666;font-size:12px;">Scan the shelf barcode or type a code like R3-S2.${
        item.locationCode ? ` Currently <b>${escapeHtml(item.locationCode)}</b>.` : ''
      }</div>
      <input id="lf-shelf" list="lf-shelves" placeholder="R3-S2" autocomplete="off"
        style="padding:10px;border:1px solid #ccc;border-radius:4px;font:inherit;font-size:18px;text-transform:uppercase;" />
      <datalist id="lf-shelves">${locations.map((l) => `<option value="${escapeAttr(l.code)}">`).join('')}</datalist>
      <div id="lf-shelf-msg" style="font-size:12px;color:#b91c1c;min-height:16px;"></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button id="lf-cancel" style="padding:8px 14px;background:#e5e7eb;border:0;border-radius:4px;cursor:pointer;font:inherit;">Cancel</button>
        <button id="lf-save" style="padding:8px 14px;background:#16a34a;color:#fff;border:0;border-radius:4px;cursor:pointer;font:inherit;">Save shelf</button>
      </div>
    </div>`,
  );

  const input = overlay.querySelector('#lf-shelf');
  const msg = overlay.querySelector('#lf-shelf-msg');
  input.focus();
  overlay.querySelector('#lf-cancel').onclick = () => overlay.remove();

  const save = async () => {
    const code = input.value.trim();
    if (!code) return;
    msg.style.color = '#666';
    msg.textContent = 'Saving…';
    try {
      const res = await window.swiftlist.api(`/api/v1/items/${item.id}/location`, {
        method: 'POST',
        body: JSON.stringify({ locationCode: code }),
      });
      overlay.remove();
      await refreshBar(bar, ebayItemId);
      flashBar(bar, `shelf set — Custom Label will be ${res.customLabel}`);
    } catch (err) {
      msg.style.color = '#b91c1c';
      msg.textContent = err.message;
      input.select();
    }
  };

  overlay.querySelector('#lf-save').onclick = save;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void save(); }
    if (e.key === 'Escape') overlay.remove();
  });
}

function flashBar(bar, text) {
  const prev = bar.state.innerHTML;
  setBarState(bar, escapeHtml(text), '#6c6');
  setTimeout(() => { bar.state.innerHTML = prev; bar.state.style.color = '#bbb'; }, 4000);
}

// ─── sold-comp flow (legacy) ──────────────────────────────────────────
async function pullSoldComp(btn, ebayItemId, prebound) {
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = '↧ Pulling…';
  try {
    const itemId = prebound || (await pickItemIdPrompt());
    if (!itemId) {
      btn.textContent = original;
      btn.disabled = false;
      return;
    }
    const scraped = await scrapeFull(ebayItemId);
    // sold-comp-link historically stored description as HTML; preserve that.
    const { descriptionHtml, ...rest } = scraped;
    const payload = { ...rest, description: descriptionHtml || rest.description };
    await window.swiftlist.api(`/api/v1/items/${itemId}/sold-comp-link`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    btn.textContent = '✓ Pulled';
  } catch (err) {
    btn.textContent = `Failed: ${err.message}`;
    window.swiftlist.telemetry({ where: 'content-detail.pull', err: err.message, url: location.href });
  } finally {
    setTimeout(() => { btn.disabled = false; }, 1500);
  }
}

async function pickItemIdPrompt() {
  const id = window.prompt('swiftlist Item ID:');
  if (id) await window.swiftlist.setLastItem(id);
  return id || null;
}

// ─── import-details-to-listing flow (new) ─────────────────────────────
async function openImportFlow(ebayItemId) {
  const overlay = mountOverlay();
  setOverlayBody(overlay, '<div style="padding:24px">Loading items…</div>');

  let unlisted;
  try {
    const res = await window.swiftlist.api('/api/v1/extension/unlisted-items');
    unlisted = res.items || [];
  } catch (err) {
    setOverlayBody(overlay, `<div style="padding:24px;color:#b91c1c">Failed to load items: ${escapeHtml(err.message)}</div>`);
    return;
  }
  if (unlisted.length === 0) {
    setOverlayBody(overlay, '<div style="padding:24px">No unlisted items found in swiftlist.</div>');
    return;
  }

  renderPicker(overlay, unlisted, ebayItemId);
}

function renderPicker(overlay, unlisted, ebayItemId) {
  const optionsHtml = unlisted
    .map((it) => {
      const label = [it.title || '(untitled)', it.brand, it.model].filter(Boolean).join(' · ');
      return `<option value="${escapeAttr(it.id)}" data-title="${escapeAttr(it.title || '')}">${escapeHtml(label)} — ${escapeHtml(it.status)}</option>`;
    })
    .join('');
  setOverlayBody(
    overlay,
    `
    <div style="padding:20px;display:flex;flex-direction:column;gap:12px;">
      <div style="font-size:16px;font-weight:600;">Import eBay listing details into…</div>
      <input type="text" id="sl-filter" placeholder="Filter by title…" style="padding:8px;border:1px solid #ccc;border-radius:4px;font:inherit;" />
      <select id="sl-target" size="10" style="padding:8px;border:1px solid #ccc;border-radius:4px;font:inherit;">${optionsHtml}</select>
      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button id="sl-cancel" style="padding:8px 14px;background:#e5e7eb;border:0;border-radius:4px;cursor:pointer;font:inherit;">Cancel</button>
        <button id="sl-next" disabled style="padding:8px 14px;background:#16a34a;color:#fff;border:0;border-radius:4px;cursor:pointer;font:inherit;opacity:0.5;">Next →</button>
      </div>
    </div>`,
  );

  const filter = overlay.querySelector('#sl-filter');
  const select = overlay.querySelector('#sl-target');
  const next = overlay.querySelector('#sl-next');
  overlay.querySelector('#sl-cancel').onclick = () => overlay.remove();

  filter.addEventListener('input', () => {
    const q = filter.value.toLowerCase();
    for (const opt of select.options) {
      const visible = !q || opt.textContent.toLowerCase().includes(q);
      opt.style.display = visible ? '' : 'none';
    }
  });
  select.addEventListener('change', () => {
    next.disabled = !select.value;
    next.style.opacity = select.value ? '1' : '0.5';
  });
  next.addEventListener('click', () => {
    const opt = select.selectedOptions[0];
    if (!opt) return;
    void renderApproval(overlay, opt.value, opt.dataset.title || '', ebayItemId);
  });
}

async function renderApproval(overlay, targetItemId, targetTitle, ebayItemId) {
  // The description lives on another origin and has to be fetched, so this is
  // no longer instant. Say so rather than showing an empty dialog.
  setOverlayBody(overlay, '<div style="padding:24px">Reading listing…</div>');
  const scraped = await scrapeFull(ebayItemId);
  const targetHasTitle = targetTitle.trim().length > 0;

  const specifics = scraped.itemSpecifics || {};
  const specificsHtml = Object.entries(specifics)
    .map(
      ([k, v], i) => `
      <label style="display:grid;grid-template-columns:24px 1fr 2fr;gap:8px;align-items:center;padding:4px 0;">
        <input type="checkbox" data-spec-key="${escapeAttr(k)}" checked />
        <div style="font-weight:500">${escapeHtml(k)}</div>
        <div style="color:#444">${escapeHtml(String(v))}</div>
      </label>`,
    )
    .join('');

  const imageUrls = scraped.imageUrls || [];
  const imagesHtml = imageUrls.length
    ? imageUrls
        .map(
          (u, i) => `
        <label style="display:flex;gap:8px;align-items:center;padding:4px 0;">
          <input type="checkbox" data-img-url="${escapeAttr(u)}" />
          <img src="${escapeAttr(u)}" style="width:48px;height:48px;object-fit:cover;border-radius:4px;background:#eee;" referrerpolicy="no-referrer" />
          <span style="font-size:11px;color:#666;word-break:break-all;">${escapeHtml(u.length > 80 ? u.slice(0, 80) + '…' : u)}</span>
        </label>`,
        )
        .join('')
    : '<div style="color:#666;font-size:12px">No images detected.</div>';

  const titleNote = targetHasTitle
    ? `<span style="color:#666;font-size:11px">target already has a title: "${escapeHtml(targetTitle)}"</span>`
    : `<span style="color:#b91c1c;font-size:11px">target has no title yet — required</span>`;

  setOverlayBody(
    overlay,
    `
    <div style="padding:20px;display:flex;flex-direction:column;gap:14px;max-height:80vh;overflow:auto;">
      <div style="font-size:16px;font-weight:600;">Approve fields to import</div>

      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;">
        <label style="display:flex;gap:8px;align-items:flex-start;">
          <input type="checkbox" id="sl-f-title" ${targetHasTitle ? '' : 'checked'} />
          <div style="flex:1">
            <div style="font-weight:500">Title</div>
            <div style="color:#444;font-size:13px;">${escapeHtml(scraped.title || '(no title found)')}</div>
            <div style="margin-top:4px;">${titleNote}</div>
          </div>
        </label>
      </div>

      ${simpleField('sl-f-brand', 'Brand', scraped.brand)}
      ${simpleField('sl-f-model', 'Model', scraped.model)}
      ${simpleField('sl-f-category', 'Category', scraped.categoryPath)}
      ${simpleField('sl-f-condition', 'Condition', scraped.condition)}

      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;">
        <label style="display:flex;gap:8px;align-items:center;">
          <input type="checkbox" id="sl-f-desc" />
          <div style="font-weight:500">Description (${scraped.description ? scraped.description.length : 0} chars)</div>
        </label>
        <div style="margin-left:24px;margin-top:6px;display:flex;gap:12px;font-size:12px;">
          <label><input type="radio" name="sl-desc-mode" value="overwrite" checked /> Overwrite</label>
          <label><input type="radio" name="sl-desc-mode" value="append" /> Append</label>
        </div>
        <div style="margin-left:24px;margin-top:6px;color:#666;font-size:12px;max-height:80px;overflow:auto;">
          ${escapeHtml((scraped.description || '').slice(0, 400))}${(scraped.description || '').length > 400 ? '…' : ''}
        </div>
      </div>

      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;">
        <div style="font-weight:500;margin-bottom:6px;">Item specifics</div>
        ${specificsHtml || '<div style="color:#666;font-size:12px">None detected.</div>'}
      </div>

      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;">
        <div style="font-weight:500;margin-bottom:6px;">Images <span style="font-weight:400;color:#666;font-size:11px;">(default off)</span></div>
        ${imagesHtml}
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;">
        <button id="sl-back" style="padding:8px 14px;background:#e5e7eb;border:0;border-radius:4px;cursor:pointer;font:inherit;">← Back</button>
        <button id="sl-submit" style="padding:8px 14px;background:#16a34a;color:#fff;border:0;border-radius:4px;cursor:pointer;font:inherit;">Save</button>
      </div>
      <div id="sl-status" style="font-size:12px;color:#666;text-align:right;"></div>
    </div>`,
  );

  overlay.querySelector('#sl-back').onclick = () => openImportFlow(ebayItemId);
  overlay.querySelector('#sl-submit').onclick = async () => {
    const status = overlay.querySelector('#sl-status');
    const titleChecked = overlay.querySelector('#sl-f-title').checked;
    if (!targetHasTitle) {
      if (!titleChecked) {
        status.textContent = 'Title is required when the target item has no title yet.';
        status.style.color = '#b91c1c';
        return;
      }
      if (!scraped.title) {
        status.textContent = 'Could not detect a title on this page — open a different listing or set the title manually.';
        status.style.color = '#b91c1c';
        return;
      }
    }
    status.textContent = 'Saving…';
    status.style.color = '#666';

    const payload = { ebayItemId };
    if (titleChecked && scraped.title) payload.title = scraped.title;
    if (overlay.querySelector('#sl-f-brand').checked && scraped.brand) payload.brand = scraped.brand;
    if (overlay.querySelector('#sl-f-model').checked && scraped.model) payload.model = scraped.model;
    if (overlay.querySelector('#sl-f-category').checked && scraped.categoryPath) payload.category = scraped.categoryPath;
    if (overlay.querySelector('#sl-f-condition').checked && scraped.condition) payload.condition = scraped.condition;

    if (overlay.querySelector('#sl-f-desc').checked && scraped.description) {
      payload.description = scraped.description;
      payload.descriptionMode = overlay.querySelector('input[name="sl-desc-mode"]:checked').value;
    }

    const approvedSpecs = {};
    for (const cb of overlay.querySelectorAll('input[data-spec-key]')) {
      if (cb.checked) approvedSpecs[cb.dataset.specKey] = specifics[cb.dataset.specKey];
    }
    if (Object.keys(approvedSpecs).length > 0) payload.itemSpecifics = approvedSpecs;

    const approvedImages = [];
    for (const cb of overlay.querySelectorAll('input[data-img-url]')) {
      if (cb.checked) approvedImages.push(cb.dataset.imgUrl);
    }
    if (approvedImages.length > 0) payload.imageUrls = approvedImages;

    try {
      const res = await window.swiftlist.api(`/api/v1/items/${targetItemId}/import-from-active`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const imgNote = res.importedPhotoIds?.length
        ? ` (+${res.importedPhotoIds.length} image${res.importedPhotoIds.length === 1 ? '' : 's'})`
        : '';
      status.textContent = `Saved${imgNote}. You can close this.`;
      status.style.color = '#16a34a';
    } catch (err) {
      status.textContent = `Failed: ${err.message}`;
      status.style.color = '#b91c1c';
      window.swiftlist.telemetry({ where: 'content-detail.import', err: err.message, url: location.href });
    }
  };
}

function simpleField(id, label, value) {
  if (!value) {
    return `
      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;color:#999;font-size:13px;">
        ${escapeHtml(label)}: <em>not detected</em>
      </div>`;
  }
  return `
    <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;">
      <label style="display:flex;gap:8px;align-items:flex-start;">
        <input type="checkbox" id="${id}" checked />
        <div style="flex:1">
          <div style="font-weight:500">${escapeHtml(label)}</div>
          <div style="color:#444;font-size:13px;">${escapeHtml(value)}</div>
        </div>
      </label>
    </div>`;
}

// ─── overlay shell ─────────────────────────────────────────────────────
function mountOverlay() {
  const existing = document.querySelector('#sl-import-overlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'sl-import-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;font:14px -apple-system, system-ui, sans-serif;color:#111;';
  const card = document.createElement('div');
  card.id = 'sl-import-card';
  card.style.cssText =
    'background:#fff;border-radius:8px;width:560px;max-width:92vw;max-height:90vh;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.4);';
  overlay.appendChild(card);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return overlay;
}

function setOverlayBody(overlay, html) {
  overlay.querySelector('#sl-import-card').innerHTML = html;
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

// ─── eBay page scraper (shared by both flows) ─────────────────────────
function scrape(ebayItemId) {
  const title = textOf('h1.x-item-title__mainTitle, h1.it-ttl');
  const price = parsePrice(textOf('.x-price-primary, span#prcIsum'));
  const breadcrumbs = [...document.querySelectorAll('.seo-breadcrumb-text, .breadcrumb a')]
    .map((e) => e.textContent.trim())
    .filter(Boolean);
  const categoryPath = breadcrumbs.join(' > ');

  const specifics = collectItemSpecifics();

  const condition = normalizeCondition(
    specifics['Condition'] ||
      textOf('.x-item-condition-value, [data-testid="x-item-condition-value"]') ||
      textOf('.x-item-condition-text, [data-testid="x-item-condition"]'),
  );
  const brand = specifics['Brand'] || undefined;
  const model = specifics['Model'] || specifics['Model Number'] || undefined;

  // Same-origin read, which on a modern eBay item page almost never works —
  // the iframe is served from vi.vipr.ebaydesc.com. fetchDescription() below
  // is the path that actually returns content; this is just the free attempt.
  let descHtml = '';
  let descText = '';
  const descIframe = document.querySelector('iframe#desc_ifr');
  try {
    if (descIframe?.contentDocument?.body) {
      descHtml = descIframe.contentDocument.body.innerHTML;
      descText = (descIframe.contentDocument.body.innerText || descIframe.contentDocument.body.textContent || '').trim();
    }
  } catch {
    // cross-origin — expected; fetchDescription() handles it.
  }

  const imageUrls = collectFullResImages();

  const sellerName = textOf('.x-sellercard-atf__info__about-seller, span.mbg-nw');

  return {
    ebayItemId,
    title,
    soldPrice: price,
    categoryPath,
    condition,
    brand,
    model,
    description: descText,
    descriptionHtml: descHtml,
    itemSpecifics: specifics,
    imageUrls: [...new Set(imageUrls)],
    sellerName,
  };
}

function textOf(sel) {
  const el = document.querySelector(sel);
  return el ? el.textContent.trim() : '';
}

function parsePrice(s) {
  const m = (s || '').replace(/,/g, '').match(/[\d.]+/);
  return m ? Number(m[0]) : undefined;
}


// ── Full-resolution images ─────────────────────────────────────────────
//
// The carousel's `src` is a thumbnail (s-l140 / s-l500), and lazy-loaded
// slides may still hold a 1×1 placeholder. Relisting from a thumbnail produces
// a ruined listing, and by then the source listing is usually ended — so this
// is a one-shot: get the original or get nothing.
//
// Every eBay image size lives at the same path with a different s-l<N>
// segment, so the largest is a string rewrite away.
function upgradeImageUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim();
  if (!url || url.startsWith('data:')) return null; // placeholder
  // eBay still emits protocol-relative URLs in places. Dropping them would
  // silently lose a photo, which is the whole failure this function exists
  // to prevent — so promote rather than reject.
  if (url.startsWith('//')) url = `https:${url}`;
  if (!/^https?:/.test(url)) return null;
  if (!/\/s-l\d+\./.test(url)) return url; // not a sized eBay image; take as-is
  // /thumbs/ is a separate small-image tree: an s-l1600 under it is still a
  // thumbnail. The original lives at the same path with /thumbs/ removed.
  url = url.replace('/thumbs/', '/');
  return url.replace(/\/s-l\d+\./, '/s-l1600.');
}

function collectFullResImages() {
  const out = [];
  const nodes = document.querySelectorAll(
    'img.ux-image-carousel-item, img.img-zoom, img#icImg, .ux-image-carousel-item img, [data-zoom-src]',
  );
  for (const el of nodes) {
    // data-zoom-src is the original; data-src is the pre-lazy-load real URL;
    // src is the last resort and the most likely to be a thumbnail.
    const candidate =
      el.getAttribute('data-zoom-src') || el.getAttribute('data-src') || el.getAttribute('src');
    const url = upgradeImageUrl(candidate);
    if (url) out.push(url);
  }
  return [...new Set(out)];
}

// ── Description (cross-origin) ─────────────────────────────────────────
//
// eBay serves the description iframe from vi.vipr.ebaydesc.com, so the page
// cannot read it and the old try/catch silently yielded ''. Descriptions were
// therefore never captured. The SW fetches it instead (see 'fetch-text').
async function fetchDescription(alreadyHave) {
  if (alreadyHave && alreadyHave.trim()) return { html: alreadyHave, text: stripTags(alreadyHave) };

  const iframe = document.querySelector('iframe#desc_ifr, iframe[id*="desc" i]');
  const src = iframe?.getAttribute('src') || iframe?.dataset?.src;
  if (!src) return { html: '', text: '' };

  const abs = new URL(src, location.href).href;
  try {
    const res = await chrome.runtime.sendMessage({ type: 'fetch-text', url: abs });
    if (!res?.ok || !res.text) return { html: '', text: '' };
    // Unwrap to the body so we store the description, not a whole document.
    const doc = new DOMParser().parseFromString(res.text, 'text/html');
    const body = doc.body;
    if (!body) return { html: '', text: '' };
    return { html: body.innerHTML.trim(), text: (body.textContent || '').trim() };
  } catch (err) {
    window.swiftlist.telemetry({ where: 'content-detail.fetchDescription', err: String(err?.message || err), url: abs });
    return { html: '', text: '' };
  }
}

function stripTags(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return (d.textContent || '').trim();
}

// scrapeFull() = scrape() plus the async description fetch. Everything that
// persists a listing must use this; scrape() alone loses descriptions.
async function scrapeFull(ebayItemId) {
  const base = scrape(ebayItemId);
  const desc = await fetchDescription(base.descriptionHtml);
  return { ...base, description: desc.text || base.description, descriptionHtml: desc.html || base.descriptionHtml };
}


// ── Item specifics ─────────────────────────────────────────────────────
//
// Real-page result 2026-09-14: the original single-selector version returned
// {} on a live listing — eBay had moved on from `.ux-layout-section-evo--features
// dl` / `.itemAttr table tr`. Item specifics are most of a listing, so an empty
// object is a silent, expensive failure.
//
// Rather than chase one class name, try every shape eBay is known to use and
// merge. First writer wins, so the most specific strategy runs first.
function collectItemSpecifics() {
  const out = {};

  const add = (rawKey, rawVal) => {
    const k = clean(rawKey).replace(/\s*:\s*$/, '');
    const v = clean(rawVal);
    if (!k || !v) return;
    if (k.length > 60 || v.length > 300) return;          // a paragraph, not a spec
    if (/^(more information|about this item|read more|see all)/i.test(k)) return;
    if (k.toLowerCase() === v.toLowerCase()) return;      // label echoed as value
    if (isListingMeta(k, v)) return;
    if (!(k in out)) out[k] = v;
  };

  // 1. Modern eBay: .ux-labels-values rows with labels/values sub-blocks.
  for (const row of document.querySelectorAll('.ux-labels-values')) {
    const l = row.querySelector('.ux-labels-values__labels-content, .ux-labels-values__labels');
    const v = row.querySelector('.ux-labels-values__values-content, .ux-labels-values__values');
    if (l && v) add(textIn(l), textIn(v));
  }

  // 2. Definition lists (older evo layouts), pairing dt->dd positionally.
  for (const dl of document.querySelectorAll('dl')) {
    const dts = [...dl.querySelectorAll(':scope > dt, :scope > div > dt')];
    const dds = [...dl.querySelectorAll(':scope > dd, :scope > div > dd')];
    if (dts.length && dts.length === dds.length) {
      for (let i = 0; i < dts.length; i++) add(textIn(dts[i]), textIn(dds[i]));
    }
  }

  // 3. Legacy two-column tables (.itemAttr), which pack several pairs per row.
  for (const tr of document.querySelectorAll('.itemAttr table tr, table.attrLabels tr')) {
    const cells = [...tr.children];
    for (let i = 0; i + 1 < cells.length; i += 2) add(textIn(cells[i]), textIn(cells[i + 1]));
  }

  return out;
}

// The generic label/value sweep also lands on eBay's sale-details panel —
// Views, Start time, Buy It Now Price, Shipping, Returns, Duration. Those are
// listing metadata, not item attributes. Copying them into a NEW listing's
// item specifics is wrong at best and rejected by eBay at worst, so they are
// dropped here rather than cleaned up by whoever is filling the form.
const LISTING_META_KEYS = new Set([
  'condition', 'price', 'buy it now price', 'current bid', 'starting bid', 'was',
  'shipping', 'postage', 'delivery', 'returns', 'payments', 'payment methods',
  'duration', 'start time', 'end time', 'time left', 'bids', 'views', 'watchers',
  'quantity', 'quantity available', 'sold', 'item number', 'item location',
  'located in', 'ships to', 'ships from', 'seller', 'seller assumes all responsibility',
  'best offer', 'listed', 'last updated', 'sale ends', 'you save', 'breathe easy',
  'free shipping', 'pickup', 'after receiving the item',
]);

function isListingMeta(key, value) {
  const k = key.toLowerCase().trim();
  if (LISTING_META_KEYS.has(k)) return true;
  // Value-shape fallbacks for labels we have not seen yet.
  if (/see details|read more about|get it between|learn more/i.test(value)) return true;
  if (/^us \$[\d,.]+/i.test(value)) return true;                       // a price
  if (/^\w{3} \d{1,2}, \d{4}\b/.test(value)) return true;             // "Apr 26, 2025 …"
  return false;
}

function textIn(el) {
  return el ? el.innerText || el.textContent || '' : '';
}

function clean(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
}

// ── Condition ──────────────────────────────────────────────────────────
//
// Real-page result 2026-09-14: this came back as
//   "Condition:UsedUsedMore information - About this item condition"
// because the block selector swept up the label, eBay's doubled value, and the
// help link. The rebuild panel matches this string against eBay's condition
// dropdown, so anything but a clean vocabulary term silently fails to fill.
const EBAY_CONDITIONS = [
  'New with tags', 'New without tags', 'New with box', 'New without box',
  'New with defects', 'Open box', 'Certified - Refurbished',
  'Excellent - Refurbished', 'Very Good - Refurbished', 'Good - Refurbished',
  'Seller refurbished', 'Manufacturer refurbished', 'For parts or not working',
  'Like New', 'Very Good', 'Acceptable', 'Pre-owned', 'Brand New', 'New', 'Used', 'Good',
];

function normalizeCondition(raw) {
  let s = clean(raw);
  if (!s) return undefined;

  s = s.replace(/^condition\s*:?\s*/i, '');
  // Cut eBay's trailing help affordances.
  s = s.split(/more information|about this item condition|read more|see full description/i)[0];
  s = clean(s);
  if (!s) return undefined;

  // eBay renders the value twice back-to-back in some layouts ("UsedUsed").
  if (s.length % 2 === 0) {
    const half = s.length / 2;
    if (s.slice(0, half) === s.slice(half)) s = s.slice(0, half);
  }

  const exact = EBAY_CONDITIONS.find((c) => c.toLowerCase() === s.toLowerCase());
  if (exact) return exact;

  // Longest known term the string starts with — "Used" out of "Used Very good".
  const prefix = EBAY_CONDITIONS
    .filter((c) => s.toLowerCase().startsWith(c.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
  if (prefix) return prefix;

  return s.slice(0, 60);
}
