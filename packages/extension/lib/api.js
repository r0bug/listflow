// Shared API wrapper for content scripts. All requests route through the
// service worker (background.js), which holds the credentials — content
// scripts never touch the JWT or machine key (Standards §6).
// Keeps the window.swiftlist.* surface the content scripts already use.

(function () {
  if (window.__swiftlist_api_loaded) return;
  window.__swiftlist_api_loaded = true;

  function send(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (res) => {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        resolve(res);
      });
    });
  }

  async function api(path, opts = {}) {
    const res = await send({ type: 'api', path, method: opts.method || 'GET', body: opts.body });
    if (!res) throw new Error('No response from extension service worker');
    if (res.ok === false && res.error) throw new Error(res.error);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data ?? '')}`);
    return res.data;
  }

  async function settings() {
    const state = await send({ type: 'auth-state' });
    const local = await chrome.storage.local.get(['lastSwiftlistItemId']);
    return {
      apiKey: state.hasKey ? 'held-by-service-worker' : '',
      baseUrl: state.baseUrl,
      webUrl: state.webUrl,
      user: state.user,
      loggedIn: state.loggedIn,
      pinnedAccount: state.pinnedAccount,
      lastSwiftlistItemId: local.lastSwiftlistItemId || '',
    };
  }

  function setLastItem(itemId) {
    return chrome.storage.local.set({ lastSwiftlistItemId: itemId });
  }

  async function telemetry(payload) {
    try {
      await api('/api/v1/extension/telemetry', { method: 'POST', body: JSON.stringify(payload) });
    } catch (err) {
      console.warn('[listflow] telemetry failed', err);
    }
  }

  async function ping() {
    return api('/api/v1/health');
  }

  // Publishing a draft is a FULL page navigation (draft → confirmation → /itm),
  // which tears down the content script that was watching the draft. So the
  // draft page leaves a note in storage, and whichever page loads next reports
  // the publish if it can see the new item id.
  function armSubmitWatch(draftId) {
    return chrome.storage.local.set({ pendingSubmit: { draftId, at: Date.now() } });
  }

  async function reportPendingSubmit(ebayItemId) {
    if (!ebayItemId) return false;
    let pendingSubmit;
    try {
      ({ pendingSubmit } = await chrome.storage.local.get('pendingSubmit'));
    } catch {
      return false;
    }
    if (!pendingSubmit?.draftId) return false;
    if (Date.now() - (pendingSubmit.at || 0) > 15 * 60 * 1000) {
      await chrome.storage.local.remove('pendingSubmit');
      return false;
    }
    try {
      await api(`/api/v1/drafts/${encodeURIComponent(pendingSubmit.draftId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SUBMITTED', ebayItemId: String(ebayItemId) }),
      });
      await chrome.storage.local.remove('pendingSubmit');
      return true;
    } catch (err) {
      console.warn('[listflow] submission report failed', err);
      return false;
    }
  }

  window.swiftlist = { api, settings, setLastItem, telemetry, ping, armSubmitWatch, reportPendingSubmit };
  window.listflow = window.swiftlist; // forward-facing alias
})();
