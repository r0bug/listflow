// Shell cache for the upload PWA (installable + instant load; uploads
// themselves obviously need network — ingest is idempotent, retry is safe).
const CACHE = 'lf-upload-v1';
const SHELL = ['./', './index.html', './app.js', './manifest.webmanifest', './icon-192.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.includes('/api/')) return; // never cache API
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
