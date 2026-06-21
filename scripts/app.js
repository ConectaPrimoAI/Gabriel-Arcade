/*
 app.js
 - Registers a basic service worker for offline/PWA behaviour
 - Preloads key pixel-art assets
 - Clears old caches on update
*/

(async function(){
  'use strict';

  // --- Service Worker registration ---
  if('serviceWorker' in navigator){
    try{
      // Unregister any old SW first to force update
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.scope.includes(window.location.origin)) {
          await reg.unregister();
          console.log('Old SW unregistered');
        }
      }
      // Register new SW
      await navigator.serviceWorker.register('sw.js');
      console.log('SW registered v3');
    } catch(err){
      console.warn('SW register failed', err);
    }
  }

  // --- Preload assets ---
  const assets = [
    'assets/images/IMG_1163.webp','assets/images/IMG_1162.jpeg','assets/images/IMG_1155.webp',
    'assets/images/grass_top.png','assets/images/grass_side.jpeg','assets/images/wood_planks.png',
    'assets/images/stone.png','assets/images/dirt.png'
  ];

  function preload(url){
    return new Promise(res=>{
      const i = new Image();
      i.onload = i.onerror = ()=>res();
      i.src = url;
    });
  }

  assets.forEach(preload);
  console.log('Assets preloading started');
})();
