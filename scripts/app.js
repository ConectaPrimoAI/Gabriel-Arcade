/*
  app.js
  - Registers a basic service worker for offline/PWA behaviour
  - Preloads key pixel-art assets added to the project
  - Overrides global launchGame so launching "mc" opens the standalone Minecraft page (index (1).html)
*/

(async function(){
  'use strict';

  // --- Service Worker registration (simple) ---
  if('serviceWorker' in navigator){
    try{
      await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered');
    } catch(err){
      console.warn('SW register failed', err);
    }
  }

  // --- Preload assets for snappy experience ---
  const assets = [
    '/IMG_1163.webp','/IMG_1162.jpeg','/IMG_1155.webp','/IMG_1242.jpeg','/IMG_1243.jpeg',
    '/grass_top.png','/grass_side.jpeg','/wood_planks.png','/stone.png','/dirt.png',
    '/stone_pickaxe.png','/iron_pickaxe.png','/gold_pickaxe.png','/diamond_pickaxe.png',
    '/stone_axe.png','/diamond_axe.png','/gold_axe.png','/wood_axe.png',
    '/stone_shovel.png','/iron_shovel.png','/gold_shovel.png','/diamond_shovel.png',
    '/stick.png','/crafting_table_top.png','/crafting_table_side.png'
  ];

  function preload(url){
    return new Promise(res=>{
      const i = new Image();
      i.onload = i.onerror = ()=>res();
      i.src = url;
    });
  }

  await Promise.all(assets.map(preload)).catch(()=>{});
  console.log('assets preloaded');

  // --- Ensure there's a global safe-launch wrapper ---
  // If the page defines a launchGame function already, keep a reference.
  const originalLaunch = window.launchGame?.bind(window) || null;

  // Override launchGame to open the new standalone Minecraft page when id === 'mc'
  // This will immediately navigate to the integrated Minecraft build and request autostart,
  // passing an optional seed when available. Other games still use the original launcher.
  window.launchGame = function(id, extra){
    if(id === 'mc'){
      try{
        const seed = extra?.w?.seed ?? Math.floor(Math.random()*999999);
        // Use the integrated Minecraft build (index (4).html) and request autostart
        window.location.href = `/index (4).html?autostart=1&seed=${encodeURIComponent(seed)}`;
      } catch(e){
        window.location.href = '/index (4).html?autostart=1';
      }
      return;
    }
    // Fallback to original behaviour for other games
    if(typeof originalLaunch === 'function') return originalLaunch(id, extra);

    // As a last resort, emit a custom event that other code can listen to
    if(window.dispatchEvent){
      window.dispatchEvent(new CustomEvent('launchGame', { detail: { id, extra } }));
    }
  };

})();