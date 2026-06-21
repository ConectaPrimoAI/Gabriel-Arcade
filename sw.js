/*
 Service Worker for Gabriel Arcade v3
 Caches core files for offline use.
 Version bump forces cache refresh.
*/
const CACHE = 'arcade-shell-v3';
const ASSETS = [
  './',
  './index.html',
  './assets/style.css',
  './scripts/app.js',
  './scripts/core.js',
  './games.json',
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
  // Delete old caches
  ev.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  // Game files: network first, fallback to index.html
  if (ev.request.url.includes('/games/')) {
    ev.respondWith(
      fetch(ev.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For other files: cache first, then network update
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
