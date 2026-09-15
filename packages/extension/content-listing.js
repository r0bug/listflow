// Runs on the eBay listing-creation flow. Reads ?swiftlistItemId=… (or the
// last-stored Item ID), fetches /api/v1/items/:id/autofill, and writes form
// fields. Selector strategy: data-testid → aria-label → name → label
// proximity. All fills are wrapped in try/catch and emit telemetry on failure.
//
// content-draft.js handles the draft-specific behavior (link banner, delta
// fill, force overwrite, submission tracking, heartbeat). This file owns the
// raw "fill these field values into the live form" actions, which both new
// listings AND draft fills use.

(async () => {
  if (window.__swiftlist_listing_loaded) return;
  window.__swiftlist_listing_loaded = true;

  // Expose the field-filler so content-draft.js can call it with either a
  // full autofill payload or a delta payload.
  window.swiftlist.fillForm = fillForm;

  const url = new URL(location.href);

  // Revise flow (docs/PHASE2-INVENTORY-AUDIT.md Flow 1): the on-page bar sent
  // us here to stamp "<SKU>|<LOC>" onto an EXISTING listing. Only the Custom
  // Label is touched — this is a live listing and nothing else may change.
  //
  // Two ways to learn we were sent: the URL params, and a stash the bar wrote
  // before navigating. The stash is the reliable one — eBay redirects these
  // flows (/lstng <-> /sl/list) and drops params it does not recognise, which
  // previously meant the whole thing silently did nothing.
  const reviseItemId = url.searchParams.get('listflowItemId') || (await claimPendingRevise());
  if (reviseItemId) {
    await runReviseFlow(reviseItemId);
    return;
  }

  // If the URL carries ?swiftlistItemId, auto-fill on first load (new listing
  // case). Draft pages let content-draft.js drive fills instead.
  // Silence was the worst part of the last bug: with no content script running
  // there was nothing to tell anyone. A tiny marker makes "is listflow even
  // here?" answerable at a glance on any listing page.
  markPresence();

  const itemId = url.searchParams.get('swiftlistItemId');
  if (itemId && !looksLikeDraft(url)) {
    await window.swiftlist.setLastItem(itemId);
    try {
      const payload = await window.swiftlist.api(`/api/v1/items/${itemId}/autofill`);
      const filled = await fillForm(payload, { mode: 'full' });
      console.log('[swiftlist] auto-filled fields:', filled);
    } catch (err) {
      window.swiftlist.telemetry({ where: 'content-listing.autofill', err: err.message });
    }
  }
})();

// Reads and clears a revise intent stashed by the item-page bar. Ignores
// anything older than 10 minutes so a stale stash cannot ambush an unrelated
// listing the operator opens later.
async function claimPendingRevise() {
  try {
    const { pendingRevise } = await chrome.storage.local.get('pendingRevise');
    if (!pendingRevise) return null;
    const fresh = Date.now() - (pendingRevise.at || 0) < 10 * 60 * 1000;
    await chrome.storage.local.remove('pendingRevise');
    return fresh ? pendingRevise.itemId : null;
  } catch {
    return null;
  }
}

// ── Revise: Custom Label only ──────────────────────────────────────────
//
// Deliberately narrow. A revise page is a LIVE listing; filling anything the
// operator did not ask for risks changing price or shipping on something that
// is currently selling. Custom Label is seller-private, so writing it does not
// restart the listing or disturb the buyer-facing page.
async function runReviseFlow(itemId) {
  const banner = mountReviseBanner();
  try {
    const payload = await window.swiftlist.api(`/api/v1/items/${itemId}/autofill`);
    const label = payload.customLabel;
    if (!label) {
      banner.set('No Custom Label to write — item has no SKU or shelf yet.', '#ea4');
      return;
    }

    // eBay's revise form mounts progressively; the field may not exist yet.
    const el = await waitForField(
      [
        '[name="customLabel"]',
        '[data-testid="custom-label"]',
        'input[aria-label*="Custom label" i]',
        'input[aria-label*="SKU" i]',
      ],
      12_000,
    );
    if (!el) {
      banner.set(
        `Could not find the Custom Label field. Set it by hand to: ${label}`,
        '#f66',
        label,
      );
      window.swiftlist.telemetry({ where: 'content-listing.revise', field: 'customLabel', err: 'selector miss', url: location.href });
      return;
    }

    const existing = (el.value || '').trim();
    if (existing === label) {
      banner.set(`Custom Label already ${label} — nothing to change.`, '#6c6');
      return;
    }

    setReactValue(el, label);
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    banner.set(
      existing
        ? `Custom Label changed from "${existing}" to "${label}". Review, then click eBay's Revise/Save.`
        : `Custom Label set to "${label}". Review, then click eBay's Revise/Save.`,
      '#6c6',
    );
  } catch (err) {
    banner.set(`Failed: ${err.message}`, '#f66');
    window.swiftlist.telemetry({ where: 'content-listing.revise', err: err.message, url: location.href });
  }
}

// The extension never clicks eBay's Save — the operator does. So the banner
// has to be legible and stay put.
function mountReviseBanner() {
  const root = document.createElement('div');
  root.style.cssText = [
    'position:fixed','top:0','left:0','right:0','z-index:2147483600','background:#181818',
    'color:#eee','border-bottom:1px solid #3a3a3a','padding:9px 14px','display:flex',
    'align-items:center','gap:10px','font:13px -apple-system,system-ui,sans-serif',
  ].join(';');
  const brand = document.createElement('b');
  brand.textContent = 'listflow · revise';
  brand.style.cssText = 'color:#6af;flex:none;';
  const msg = document.createElement('span');
  msg.textContent = 'Writing Custom Label…';
  msg.style.cssText = 'flex:1;';
  root.append(brand, msg);
  document.documentElement.appendChild(root);
  const pad = document.createElement('style');
  pad.textContent = 'body{padding-top:40px !important;}';
  document.head.appendChild(pad);

  return {
    set(text, color, copyable) {
      msg.textContent = text;
      msg.style.color = color || '#eee';
      if (copyable) {
        const b = document.createElement('button');
        b.textContent = 'Copy label';
        b.style.cssText = 'background:#2a2a2a;color:#eee;border:1px solid #3a3a3a;border-radius:4px;padding:4px 10px;font:inherit;font-size:12px;cursor:pointer;flex:none;';
        b.onclick = () => navigator.clipboard?.writeText(copyable);
        root.appendChild(b);
      }
    },
  };
}

function waitForField(selectors, timeout) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const el = pick(selectors);
      if (el) return resolve(el);
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(tick, 250);
    };
    tick();
  });
}

function markPresence() {
  if (document.getElementById('__listflow_present')) return;
  const dot = document.createElement('div');
  dot.id = '__listflow_present';
  dot.title = 'listflow content script is running on this page';
  dot.textContent = 'listflow';
  dot.style.cssText =
    'position:fixed;bottom:6px;left:6px;z-index:2147483600;background:#181818;color:#6af;' +
    'border:1px solid #3a3a3a;border-radius:3px;padding:2px 6px;font:11px -apple-system,system-ui,sans-serif;opacity:0.65;';
  document.documentElement.appendChild(dot);
}

function looksLikeDraft(url) {
  return url.searchParams.has('draftId') || url.pathname.includes('/lstng');
}

// fillForm walks the payload and writes each present field into the form.
// Returns the list of fields successfully filled (used by content-draft.js
// to update lastFilledFields on the server).
async function fillForm(payload, opts = {}) {
  const filled = [];

  if (payload.title) safe(() => fillTitle(payload.title), 'title', filled);
  if (payload.condition?.label) safe(() => fillCondition(payload.condition), 'condition', filled);
  if (payload.category?.id) safe(() => fillCategory(payload.category), 'category', filled);
  if (payload.itemSpecifics) safe(() => fillSpecifics(payload.itemSpecifics), 'itemSpecifics', filled);
  if (payload.description?.html) safe(() => fillDescription(payload.description.html), 'description', filled);
  if (payload.pricing?.buyNowPrice) safe(() => setInput(['[name="binPrice"]', '[data-testid="buy-now-price"]'], payload.pricing.buyNowPrice), 'pricing.buyNowPrice', filled);
  if (payload.pricing?.startingPrice) safe(() => setInput(['[name="startPrice"]', '[data-testid="starting-price"]'], payload.pricing.startingPrice), 'pricing.startingPrice', filled);
  if (payload.shipping?.weightOz) safe(() => setInput(['[name="weightOz"]', '[data-testid="weight-oz"]'], payload.shipping.weightOz), 'shipping.weightOz', filled);
  if (payload.shipping?.postalCode) safe(() => setInput(['[name="postalCode"]', '[data-testid="postal-code"]'], payload.shipping.postalCode), 'shipping.postalCode', filled);
  // Custom Label "<SKU>|<LOC>" (fleet Standards §6) — REQUIRED on every
  // draft: sale→item→lister attribution and pick/pack both depend on it.
  if (payload.customLabel) {
    safe(
      () =>
        setInput(
          [
            '[name="customLabel"]',
            '[data-testid="custom-label"]',
            'input[aria-label*="Custom label" i]',
            'input[aria-label*="SKU" i]',
          ],
          payload.customLabel,
        ),
      'customLabel',
      filled,
    );
  }

  if (payload.photos?.length) {
    safe(() => sidePanelPhotoUrls(payload.photos), 'photos', filled);
  }

  return filled;

  function safe(fn, name, list) {
    try {
      const ok = fn();
      if (ok !== false) list.push(name);
    } catch (err) {
      window.swiftlist.telemetry({ where: 'content-listing.fill', field: name, err: err.message });
    }
  }
}

// ── Field fillers ──────────────────────────────────────────────────────

function fillTitle(title) {
  const el = pick(['[data-testid="title-input"]', '[name="title"]', 'input[aria-label*="Title" i]']);
  if (!el) return false;
  setReactValue(el, title.slice(0, 80));
}

function fillCondition({ label }) {
  const el = pick(['[data-testid="condition-dropdown"]', 'select[name="conditionId"]', '[aria-label*="Condition" i]']);
  if (!el) return false;
  if (el.tagName === 'SELECT') {
    for (const opt of el.options) {
      if (opt.text.trim().toLowerCase() === label.toLowerCase()) {
        el.value = opt.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    }
  } else {
    el.click();
    setTimeout(() => {
      const option = [...document.querySelectorAll('[role="option"], li')].find(
        (e) => e.textContent.trim().toLowerCase() === label.toLowerCase(),
      );
      option?.click();
    }, 100);
  }
}

function fillCategory({ id }) {
  const el = pick(['[data-testid="category-id-input"]', 'input[name="categoryId"]', 'input[aria-label*="Category" i]']);
  if (!el) return false;
  setReactValue(el, id);
}

function fillSpecifics(specifics) {
  for (const { name, values } of specifics) {
    const v = values.join(', ');
    const el = pick([`[aria-label="${cssEscape(name)}"]`, `[data-testid="spec-${cssEscape(name)}"]`, `input[name="spec_${cssEscape(name)}"]`]);
    if (el) setReactValue(el, v);
  }
}

function fillDescription(html) {
  // eBay's description editor is a sandboxed iframe. Best-effort.
  const iframe = document.querySelector('iframe[title*="description" i], iframe#description_ifr');
  if (iframe?.contentDocument) {
    iframe.contentDocument.body.innerHTML = html;
    iframe.dispatchEvent(new Event('input', { bubbles: true }));
    return;
  }
  // Plain textarea fallback (some flows expose this).
  const ta = pick(['textarea[name="description"]', 'textarea[aria-label*="description" i]']);
  if (ta) setReactValue(ta, stripHtml(html));
}

function sidePanelPhotoUrls(photos) {
  // Photo upload via JS into eBay's gallery is fragile across variants; show
  // a side panel with copyable URLs the user can drag into eBay's "add by URL"
  // dialog (when offered) or paste into the picture URL field.
  const id = '__swiftlist_photo_panel';
  document.getElementById(id)?.remove();
  const panel = document.createElement('div');
  panel.id = id;
  panel.style.cssText =
    'position:fixed;top:80px;right:24px;width:280px;max-height:60vh;overflow:auto;background:#181818;color:#eee;border:1px solid #444;border-radius:6px;padding:12px;z-index:99999;font:12px -apple-system,system-ui,sans-serif;';
  panel.innerHTML = `<div style="font-weight:600;margin-bottom:6px;">swiftlist photos (${photos.length})</div><div style="color:#888;font-size:11px;margin-bottom:8px;">eBay's photo flow varies. Copy these URLs into the "Add from URL" dialog, or drag images into the gallery.</div>`;
  for (const p of photos) {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:6px;';
    row.innerHTML = `<a href="${p.url}" target="_blank" style="color:#6af;word-break:break-all;font-size:11px;">${escapeHtml(p.url)}</a>`;
    panel.appendChild(row);
  }
  document.body.appendChild(panel);
}

// ── Selector + React-input helpers ─────────────────────────────────────

function pick(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function setInput(selectors, value) {
  const el = pick(selectors);
  if (!el) return false;
  setReactValue(el, value);
}

// React-controlled inputs need both the native value setter AND a 'change' event.
function setReactValue(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function cssEscape(s) {
  if (window.CSS?.escape) return window.CSS.escape(s);
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`);
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
