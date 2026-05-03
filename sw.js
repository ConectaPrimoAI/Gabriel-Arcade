/*
  Very small service worker: caches core site shell and serves cached responses.
  Keeps the worker tiny and safe; expands easily later.
*/
const CACHE = 'arcade-shell-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index (2).html',
  '/index (3).html',
  '/style.css',
  '/app.js',
  '/manifest.json'
  // asset files will be cached on demand via runtime fetch
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', ev => {
  // Try cache first, fallback to network, and cache new responses
  ev.respondWith(
    caches.match(ev.request).then(r => r || fetch(ev.request).then(res => {
      // only cache GET and same-origin images/scripts/styles
      try{
        const ct = ev.request.destination;
        if(ev.request.method === 'GET' && (ct === 'image' || ct === 'script' || ct === 'style' || ev.request.url.startsWith(self.location.origin))){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, copy));
        }
      }catch(e){}
      return res;
    }).catch(()=>caches.match('/')))
  );
});