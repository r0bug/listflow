// Field PWA service worker: shell cache-first; comp thumbnails cache-first
// (warmed by "Take offline"); everything else network-only. Bundle JSON is
// stored in localStorage by the app, not here.
const SHELL_CACHE = 'lf-field-shell-v1';
const THUMB_CACHE = 'lf-field-thumbs-v1';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest', './icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE && k !== THUMB_CACHE).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Comp thumbnails: cache-first, fill cache on network hit.
  if (/\/api\/v1\/comps\/\d+\/thumb$/.test(url.pathname)) {
    e.respondWith(
      caches.open(THUMB_CACHE).then(async (cache) => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }),
    );
    return;
  }

  if (url.pathname.includes('/api/')) return; // API: network only

  // Shell: cache-first.
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
