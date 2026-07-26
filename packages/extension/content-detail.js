// Runs on https://www.ebay.com/itm/*. Injects two floating buttons:
//   ↧ Pull into swiftlist          → scrape as a sold-comp (existing flow)
//   ↑ Import details to listing    → pick an Item, approve fields, overwrite
//
// If the URL carries ?swiftlistItemId=…, the legacy auto-pull still fires
// for the sold-comp flow.

(async () => {
  const url = new URL(location.href);
  const preboundItemId = url.searchParams.get('swiftlistItemId');
  const ebayItemId = (location.pathname.match(/\/itm\/(?:[^/]+\/)?(\d{8,})/) || [])[1];
  if (!ebayItemId) return;

  const wrap = document.createElement('div');
  wrap.style.cssText =
    'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;align-items:flex-end;font:600 13px -apple-system, system-ui, sans-serif;';
  document.body.appendChild(wrap);

  const importBtn = document.createElement('button');
  importBtn.textContent = '↑ Import details to listing';
  importBtn.style.cssText =
    'padding:10px 14px;background:#16a34a;color:#fff;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  importBtn.addEventListener('click', () => openImportFlow(ebayItemId));
  wrap.appendChild(importBtn);

  const pullBtn = document.createElement('button');
  pullBtn.textContent = preboundItemId ? '↧ Auto-pulling…' : '↧ Pull into swiftlist (sold comp)';
  pullBtn.style.cssText =
    'padding:10px 14px;background:#0064d2;color:#fff;border:0;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
  pullBtn.addEventListener('click', () => pullSoldComp(pullBtn, ebayItemId));
  wrap.appendChild(pullBtn);

  if (preboundItemId) setTimeout(() => pullSoldComp(pullBtn, ebayItemId, preboundItemId), 2_000);
})();

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
    const scraped = scrape(ebayItemId);
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
    renderApproval(overlay, opt.value, opt.dataset.title || '', ebayItemId);
  });
}

function renderApproval(overlay, targetItemId, targetTitle, ebayItemId) {
  const scraped = scrape(ebayItemId);
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

  const specifics = {};
  const specRows = document.querySelectorAll(
    '.ux-layout-section-evo--features dl, .itemAttr table tr, .ux-layout-section__item--table-view dl',
  );
  for (const row of specRows) {
    const dt = row.querySelector('dt, td:nth-child(1)');
    const dd = row.querySelector('dd, td:nth-child(2)');
    if (dt && dd) {
      const k = dt.textContent.trim().replace(/\s+/g, ' ');
      const v = dd.textContent.trim().replace(/\s+/g, ' ');
      if (k && v) specifics[k] = v;
    }
  }

  const condition = specifics['Condition'] || textOf('.x-item-condition-text, [data-testid="x-item-condition"]') || undefined;
  const brand = specifics['Brand'] || undefined;
  const model = specifics['Model'] || specifics['Model Number'] || undefined;

  let descHtml = '';
  let descText = '';
  const descIframe = document.querySelector('iframe#desc_ifr');
  try {
    if (descIframe?.contentDocument) {
      descHtml = descIframe.contentDocument.body.innerHTML;
      descText = (descIframe.contentDocument.body.innerText || descIframe.contentDocument.body.textContent || '').trim();
    }
  } catch {
    // cross-origin, skip
  }

  const imageUrls = [...document.querySelectorAll('img.ux-image-carousel-item, img.img-zoom, img#icImg')]
    .map((img) => img.src)
    .filter(Boolean);

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
