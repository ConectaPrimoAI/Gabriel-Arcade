/*
  Service Worker for Gabriel Arcade
  Caches core files for offline use.
*/
const CACHE = 'arcade-shell-v2';
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
  // Se for arquivo do jogo (/games/), deixa passar sem cache
  if (ev.request.url.includes('/games/')) {
    ev.respondWith(
      fetch(ev.request).catch(() => 
        caches.match('./index.html')
      )
    );
    return;
  }

  // Para outros arquivos, cache first
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
