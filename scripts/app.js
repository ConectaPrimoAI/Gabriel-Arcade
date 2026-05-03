/*
  app.js
  - Registers a basic service worker for offline/PWA behaviour
  - Preloads key pixel-art assets
*/

(async function(){
  'use strict';

  // --- Service Worker registration ---
  if('serviceWorker' in navigator){
    try{
      // Use relative path for better compatibility
      await navigator.serviceWorker.register('sw.js');
      console.log('SW registered');
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

  // Don't block the main thread too much
  assets.forEach(preload);
  console.log('Assets preloading started');

  // Note: We removed the launchGame override because it was pointing to a non-existent index (4).html
  // and core.js already handles game launching correctly.
})();
