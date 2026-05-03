/*
  Service Worker for Gabriel Arcade
  Caches core files for offline use.
*/
const CACHE = 'arcade-shell-v1';
const ASSETS = [
  './',
  './index.html',
  './assets/style.css',
  './scripts/app.js',
  './scripts/core.js',
  './manifest.json'
];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', ev => {
  ev.respondWith(
    caches.match(ev.request).then(r => {
      return r || fetch(ev.request).then(res => {
        if (ev.request.method === 'GET' && ev.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
