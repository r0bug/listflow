// Annotates rows on https://www.ebay.com/sh/lst/drafts*. For each draft row,
// looks up linkage on the server and injects a green "swiftlist · <Item>" badge
// when linked, or an actionable "+ Add to ListFlow" control when not.
//
// The unlinked control is the inbound path (PHASE1-DESIGN §3d): a draft typed
// straight into Seller Hub has no Item behind it, so we offer either
//   Import as new Item  → POST /drafts/import with the row's scraped fields
//   Link to <last Item> → POST /drafts/import with an explicit itemId
// Both are the same endpoint; itemId is what distinguishes link from import.

(async () => {
  const rows = await waitFor(
    () => document.querySelectorAll('[data-testid="draft-row"], tr[data-test-draft-id], tr.draft-row'),
    8_000,
  );
  if (!rows || rows.length === 0) return;

  const { lastSwiftlistItemId } = await window.swiftlist.settings();

  for (const row of rows) {
    if (row.querySelector('.swiftlist-badge')) continue;
    const link = row.querySelector('a[href*="/lstng"], a[href*="draftId"]');
    if (!link) continue;
    const url = link.href;
    try {
      const data = await window.swiftlist.api(`/api/v1/drafts/by-url?url=${encodeURIComponent(url)}`);
      injectBadge(row, true, data.item?.title || '(linked)');
    } catch (err) {
      if (/404/.test(err.message)) {
        injectAddControl(row, url, lastSwiftlistItemId);
      } else {
        console.warn('[swiftlist] drafts-list lookup failed', err);
      }
    }
  }
})();

function injectBadge(row, isLinked, title) {
  const span = document.createElement('span');
  span.className = 'swiftlist-badge';
  span.style.cssText = `display:inline-block;margin-left:8px;padding:2px 6px;border-radius:3px;font-size:11px;${isLinked ? 'background:#1a4d1a;color:#9f9;' : 'background:#333;color:#aaa;'}`;
  span.textContent = isLinked ? `swiftlist · ${title.slice(0, 30)}` : 'not in swiftlist';
  anchorFor(row)?.appendChild(span);
  return span;
}

// The unlinked affordance. Renders "+ Add to ListFlow"; on click expands to the
// available actions, since which ones apply depends on whether the operator has
// touched an Item recently.
function injectAddControl(row, url, lastItemId) {
  const wrap = document.createElement('span');
  wrap.className = 'swiftlist-badge';
  wrap.style.cssText =
    'display:inline-block;margin-left:8px;padding:2px 6px;border-radius:3px;font-size:11px;background:#333;color:#aaa;cursor:pointer;';
  wrap.textContent = '+ Add to ListFlow';
  wrap.title = 'This eBay draft has no ListFlow Item behind it';

  wrap.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (wrap.dataset.open === '1') return;
    wrap.dataset.open = '1';
    wrap.textContent = '';

    const importBtn = actionButton('Import as new Item', async () => {
      await submit(wrap, row, url, null);
    });
    wrap.appendChild(importBtn);

    if (lastItemId) {
      wrap.appendChild(document.createTextNode(' '));
      wrap.appendChild(
        actionButton('Link to last Item', async () => {
          await submit(wrap, row, url, lastItemId);
        }),
      );
    }
  });

  anchorFor(row)?.appendChild(wrap);
}

function actionButton(label, onClick) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.style.cssText =
    'font-size:11px;padding:1px 5px;margin:0;border:1px solid #555;border-radius:3px;background:#222;color:#ddd;cursor:pointer;';
  b.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    b.disabled = true;
    b.textContent = '…';
    try {
      await onClick();
    } catch (err) {
      console.warn('[swiftlist] draft import failed', err);
      b.disabled = false;
      b.textContent = label;
    }
  });
  return b;
}

async function submit(wrap, row, url, itemId) {
  const body = { ebayDraftUrl: url };
  const draftId = extractDraftId(url);
  if (draftId) body.ebayDraftId = draftId;
  if (itemId) {
    body.itemId = itemId;
  } else {
    body.scraped = scrapeRow(row);
  }

  const data = await window.swiftlist.api('/api/v1/drafts/import', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  // Flip the row in place — no reload, the operator may have many rows open.
  wrap.remove();
  injectBadge(row, true, data.item?.title || '(linked)');
  if (data.item?.id) await window.swiftlist.setLastItem(data.item.id);
}

// The list view exposes far less than the draft page does; send only what is
// actually on the row and let the operator finish the Item deliberately.
function scrapeRow(row) {
  const scraped = {};
  const title = text(row, '[data-testid="draft-title"], .draft-title, td:first-child a');
  if (title) scraped.title = title.slice(0, 500);

  const priceText = text(row, '[data-testid="draft-price"], .draft-price, .price');
  const price = priceText ? Number(priceText.replace(/[^0-9.]/g, '')) : NaN;
  if (Number.isFinite(price) && price >= 0) scraped.price = price;

  const label = text(row, '[data-testid="custom-label"], .custom-label');
  if (label) scraped.customLabel = label.slice(0, 200);

  return scraped;
}

function text(root, selector) {
  const el = root.querySelector(selector);
  return el ? el.textContent.trim() : '';
}

function anchorFor(row) {
  return row.querySelector('td:first-child, [data-testid="draft-title"]') ?? row.firstElementChild;
}

function extractDraftId(url) {
  try {
    const u = new URL(url);
    return u.searchParams.get('draftId') || u.searchParams.get('draft_id') || null;
  } catch {
    return null;
  }
}

function waitFor(fn, timeout = 5_000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const tick = () => {
      const v = fn();
      if (v && (!v.length || v.length > 0)) return resolve(v);
      if (Date.now() - t0 > timeout) return resolve(null);
      setTimeout(tick, 200);
    };
    tick();
  });
}
