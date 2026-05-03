import * as THREE from 'three';
import nipplejs from 'nipplejs';
import { createNoise2D, createNoise3D } from 'simplex-noise';

let gameStarted = false;

// Settings
let SENSITIVITY = 1.0;
let BOBBING_ENABLED = true;
let BRIGHTNESS = 1.0;
let WENDRENT_ENABLED = false;
let WORLD_SEED = "default";

// Constants & Types
const BLOCK_SIZE = 1;
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 64; // Increased height for underground depth
let RENDER_DISTANCE = 4;

const BLOCKS = {
    AIR: 0,
    GRASS: 1,
    DIRT: 2,
    STONE: 3,
    COBBLESTONE: 4,
    BRICKS: 5,
    WOOD: 6,
    LOG: 7,
    LEAVES: 8,
    WATER: 9,
    BEDROCK: 10,
    CRAFTING_TABLE: 11,
    STICK: 12,
    WOOD_PICKAXE: 13,
    WOOD_SWORD: 14,
    WOOD_SHOVEL: 15,
    WOOD_AXE: 16,
    STONE_PICKAXE: 17,
    STONE_SWORD: 18,
    STONE_SHOVEL: 19,
    STONE_AXE: 20,
    // Ores
    COAL_ORE: 21,
    IRON_ORE: 22,
    GOLD_ORE: 23,
    DIAMOND_ORE: 24,
    // New tool tiers: gold, iron, diamond
    GOLD_PICKAXE: 25,
    GOLD_SWORD: 26,
    GOLD_SHOVEL: 27,
    GOLD_AXE: 28,
    IRON_PICKAXE: 29,
    IRON_SWORD: 30,
    IRON_SHOVEL: 31,
    IRON_AXE: 32,
    DIAMOND_PICKAXE: 33,
    DIAMOND_SWORD: 34,
    DIAMOND_SHOVEL: 35,
    DIAMOND_AXE: 36
};

// Texture Loading
const textureLoader = new THREE.TextureLoader();
const loadTex = (url) => {
    const tex = textureLoader.load(url);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    return tex;
};

const textures = {
    dirt: loadTex('IMG_1163.webp'),
    grass_side: loadTex('grass_side.jpeg'),
    grass_top: loadTex('IMG_1117.jpeg'),
    stone: loadTex('stone.png'),
    bricks: loadTex('bricks.png'),
    wood: loadTex('wood_planks.png'),
    log_side: loadTex('IMG_1242.jpeg'),
    log_top: loadTex('IMG_1243.jpeg'),
    leaves: loadTex('IMG_1155.webp'),
    water: loadTex('IMG_1162.jpeg'),
    craft_side: loadTex('IMG_1161.jpeg'),
    craft_top: loadTex('IMG_1160.jpeg'),
    // Dedicated ore textures
    coal: loadTex('coal_ore.png'),
    iron: loadTex('iron_ore.png'),
    gold: loadTex('gold_ore.png'),
    diamond: loadTex('diamond_ore.png'),
};

 // Materials setup (enable vertexColors so the baked per-vertex AO tint is applied)
const matGrassSide = new THREE.MeshLambertMaterial({ map: textures.grass_side, vertexColors: true });
const matGrassTop = new THREE.MeshLambertMaterial({ map: textures.grass_top, vertexColors: true });
const matDirt = new THREE.MeshLambertMaterial({ map: textures.dirt, vertexColors: true });
const matStone = new THREE.MeshLambertMaterial({ map: textures.stone, vertexColors: true });
const matBricks = new THREE.MeshLambertMaterial({ map: textures.bricks, vertexColors: true });
const matWood = new THREE.MeshLambertMaterial({ map: textures.wood, vertexColors: true });
const matLogSide = new THREE.MeshLambertMaterial({ map: textures.log_side, vertexColors: true });
const matLogTop = new THREE.MeshLambertMaterial({ map: textures.log_top, vertexColors: true });
const matLeaves = new THREE.MeshLambertMaterial({ map: textures.leaves, transparent: true, alphaTest: 0.5, vertexColors: true });
const matWater = new THREE.MeshStandardMaterial({ 
    map: textures.water, 
    transparent: true, 
    opacity: 0.6,
    metalness: 0.1,
    roughness: 0.8,
    vertexColors: true
});
const matBedrock = new THREE.MeshLambertMaterial({ map: textures.stone, color: 0x333333, vertexColors: true });
const matCraftSide = new THREE.MeshLambertMaterial({ map: textures.craft_side, vertexColors: true });
const matCraftTop = new THREE.MeshLambertMaterial({ map: textures.craft_top, vertexColors: true });

const matCoal = new THREE.MeshLambertMaterial({ map: textures.coal, vertexColors: true });
const matIron = new THREE.MeshLambertMaterial({ map: textures.iron, vertexColors: true });
const matGold = new THREE.MeshLambertMaterial({ map: textures.gold, vertexColors: true });
const matDiamond = new THREE.MeshLambertMaterial({ map: textures.diamond, vertexColors: true });

const blockMaterials = {
    [BLOCKS.GRASS]: [matGrassSide, matGrassSide, matGrassTop, matDirt, matGrassSide, matGrassSide],
    [BLOCKS.DIRT]: matDirt,
    [BLOCKS.STONE]: matStone,
    [BLOCKS.COBBLESTONE]: matStone,
    [BLOCKS.BRICKS]: matBricks,
    [BLOCKS.WOOD]: matWood,
    [BLOCKS.LOG]: [matLogSide, matLogSide, matLogTop, matLogTop, matLogSide, matLogSide],
    [BLOCKS.LEAVES]: matLeaves,
    [BLOCKS.WATER]: matWater,
    [BLOCKS.BEDROCK]: matBedrock,
    [BLOCKS.CRAFTING_TABLE]: [matCraftSide, matCraftSide, matCraftTop, matWood, matCraftSide, matCraftSide],
    // Ores (use dedicated ore materials for full-face visuals)
    [BLOCKS.COAL_ORE]: matCoal,
    [BLOCKS.IRON_ORE]: matIron,
    [BLOCKS.GOLD_ORE]: matGold,
    [BLOCKS.DIAMOND_ORE]: matDiamond
};

const BLOCK_ICONS = {
    [BLOCKS.GRASS]: 'IMG_1117.jpeg',
    [BLOCKS.DIRT]: 'IMG_1163.webp',
    [BLOCKS.STONE]: 'stone.png',
    [BLOCKS.COBBLESTONE]: 'stone.png',
    [BLOCKS.BRICKS]: 'bricks.png',
    [BLOCKS.WOOD]: 'wood_planks.png',
    [BLOCKS.LOG]: 'IMG_1242.jpeg',
    [BLOCKS.LEAVES]: 'IMG_1155.webp',
    [BLOCKS.WATER]: 'IMG_1162.jpeg',
    [BLOCKS.CRAFTING_TABLE]: 'IMG_1161.jpeg',
    [BLOCKS.STICK]: 'stick.png',
    [BLOCKS.WOOD_PICKAXE]: 'wood_pickaxe.png',
    [BLOCKS.WOOD_SWORD]: 'wood_sword.png',
    [BLOCKS.WOOD_SHOVEL]: 'wood_shovel.png',
    [BLOCKS.WOOD_AXE]: 'wood_axe.png',
    [BLOCKS.STONE_PICKAXE]: 'stone_pickaxe.png',
    [BLOCKS.STONE_SWORD]: 'stone_sword.png',
    [BLOCKS.STONE_SHOVEL]: 'stone_shovel.png',
    [BLOCKS.STONE_AXE]: 'stone_axe.png',
    // Ores have dedicated icons matching their block textures
    [BLOCKS.COAL_ORE]: 'coal_ore.png',
    [BLOCKS.IRON_ORE]: 'iron_ore.png',
    [BLOCKS.GOLD_ORE]: 'gold_ore.png',
    [BLOCKS.DIAMOND_ORE]: 'diamond_ore.png',
    // Tool icons for new tiers (use dedicated icons)
    [BLOCKS.GOLD_PICKAXE]: 'gold_pickaxe.png',
    [BLOCKS.GOLD_SWORD]: 'gold_sword.png',
    [BLOCKS.GOLD_SHOVEL]: 'gold_shovel.png',
    [BLOCKS.GOLD_AXE]: 'gold_axe.png',
    [BLOCKS.IRON_PICKAXE]: 'iron_pickaxe.png',
    [BLOCKS.IRON_SWORD]: 'iron_sword.png',
    [BLOCKS.IRON_SHOVEL]: 'iron_shovel.png',
    [BLOCKS.IRON_AXE]: 'iron_axe.png',
    [BLOCKS.DIAMOND_PICKAXE]: 'diamond_pickaxe.png',
    [BLOCKS.DIAMOND_SWORD]: 'diamond_sword.png',
    [BLOCKS.DIAMOND_SHOVEL]: 'diamond_shovel.png',
    [BLOCKS.DIAMOND_AXE]: 'diamond_axe.png'
};

const blockMaterials_old = {
    [BLOCKS.STONE]: matStone,
    [BLOCKS.COBBLESTONE]: matStone,
    [BLOCKS.BRICKS]: matBricks,
    [BLOCKS.WOOD]: matWood,
    [BLOCKS.LOG]: [matLogSide, matLogSide, matLogTop, matLogTop, matLogSide, matLogSide],
    [BLOCKS.LEAVES]: matLeaves,
    [BLOCKS.WATER]: matWater,
    [BLOCKS.BEDROCK]: matBedrock,
};

const BLOCK_HARDNESS = {
    [BLOCKS.GRASS]: 0.6,
    [BLOCKS.DIRT]: 0.5,
    [BLOCKS.STONE]: 1.5,
    [BLOCKS.COBBLESTONE]: 1.5,
    [BLOCKS.BRICKS]: 2.0,
    [BLOCKS.WOOD]: 1.0,
    [BLOCKS.LOG]: 1.5,
    [BLOCKS.LEAVES]: 0.1,
    [BLOCKS.CRAFTING_TABLE]: 1.5,
    [BLOCKS.BEDROCK]: -1, // Unbreakable
    [BLOCKS.WATER]: -1,   // Unminable
    // Ore hardness (explicit per-ore break times in seconds)
    // Chosen times (seconds): Coal = 0.8s, Gold = 1.0s, Iron = 1.4s, Diamond = 3.5s
    [BLOCKS.COAL_ORE]: 1.0,
    [BLOCKS.IRON_ORE]: 3.0,
    [BLOCKS.GOLD_ORE]: 2.0,
    [BLOCKS.DIAMOND_ORE]: 6.0
};

const TOOL_SPEEDS = {
    [BLOCKS.WOOD_PICKAXE]: { [BLOCKS.STONE]: 2, [BLOCKS.COBBLESTONE]: 2, [BLOCKS.BRICKS]: 2 },
    [BLOCKS.STONE_PICKAXE]: { [BLOCKS.STONE]: 4, [BLOCKS.COBBLESTONE]: 4, [BLOCKS.BRICKS]: 4 },
    [BLOCKS.WOOD_AXE]: { [BLOCKS.LOG]: 2, [BLOCKS.WOOD]: 2, [BLOCKS.CRAFTING_TABLE]: 2 },
    [BLOCKS.STONE_AXE]: { [BLOCKS.LOG]: 4, [BLOCKS.WOOD]: 4, [BLOCKS.CRAFTING_TABLE]: 4 },
    [BLOCKS.WOOD_SHOVEL]: { [BLOCKS.DIRT]: 2, [BLOCKS.GRASS]: 2 },
    [BLOCKS.STONE_SHOVEL]: { [BLOCKS.DIRT]: 4, [BLOCKS.GRASS]: 4 },
    [BLOCKS.WOOD_SWORD]: { [BLOCKS.LEAVES]: 2 },
    [BLOCKS.STONE_SWORD]: { [BLOCKS.LEAVES]: 4 },

    // GOLD: very fast but less "effective" in matching tougher blocks (high multiplier for soft blocks)
    [BLOCKS.GOLD_PICKAXE]: { [BLOCKS.STONE]: 6, [BLOCKS.COBBLESTONE]: 6, [BLOCKS.BRICKS]: 6 },
    [BLOCKS.GOLD_AXE]: { [BLOCKS.LOG]: 6, [BLOCKS.WOOD]: 6, [BLOCKS.CRAFTING_TABLE]: 6 },
    [BLOCKS.GOLD_SHOVEL]: { [BLOCKS.DIRT]: 6, [BLOCKS.GRASS]: 6 },
    [BLOCKS.GOLD_SWORD]: { [BLOCKS.LEAVES]: 6 },

    // IRON: reliable middle-ground
    [BLOCKS.IRON_PICKAXE]: { [BLOCKS.STONE]: 5, [BLOCKS.COBBLESTONE]: 5, [BLOCKS.BRICKS]: 5 },
    [BLOCKS.IRON_AXE]: { [BLOCKS.LOG]: 5, [BLOCKS.WOOD]: 5, [BLOCKS.CRAFTING_TABLE]: 5 },
    [BLOCKS.IRON_SHOVEL]: { [BLOCKS.DIRT]: 5, [BLOCKS.GRASS]: 5 },
    [BLOCKS.IRON_SWORD]: { [BLOCKS.LEAVES]: 5 },

    // DIAMOND: top-tier speed
    [BLOCKS.DIAMOND_PICKAXE]: { [BLOCKS.STONE]: 8, [BLOCKS.COBBLESTONE]: 8, [BLOCKS.BRICKS]: 8 },
    [BLOCKS.DIAMOND_AXE]: { [BLOCKS.LOG]: 8, [BLOCKS.WOOD]: 8, [BLOCKS.CRAFTING_TABLE]: 8 },
    [BLOCKS.DIAMOND_SHOVEL]: { [BLOCKS.DIRT]: 8, [BLOCKS.GRASS]: 8 },
    [BLOCKS.DIAMOND_SWORD]: { [BLOCKS.LEAVES]: 8 },
};

 // Basic audio with robust resume and fallback handling
const audioCtx = (function() {
    try {
        return new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
        // AudioContext unavailable (e.g. iOS or sandboxed/blocked environment)
        return null;
    }
})();

// Ensure audio context is resumed before attempting playback; return false if unavailable
async function ensureAudio() {
    if (!audioCtx) return false;
    try {
        if (audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        return true;
    } catch (err) {
        // Resume failed (device error, permission blocked, etc.)
        console.warn('Audio resume failed:', err);
        return false;
    }
}

async function playSound(url) {
    try {
        const canPlay = await ensureAudio();
        if (!canPlay) return; // fail gracefully if audio can't start

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        // use decodeAudioData with promise guard for cross-browser
        const audioBuffer = await new Promise((resolve, reject) => {
            audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
        });
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
    } catch (e) {
        // Log for debugging but don't crash the app
        console.warn('playSound failed:', e);
    }
}

 // Global unhandled rejection handler: suppress/handle known audio-device errors gracefully
window.addEventListener('unhandledrejection', (event) => {
    try {
        const reason = event && event.reason;
        if (!reason) return;

        // Normalize to a string for robust matching
        const msg = (typeof reason === 'string') ? reason : (reason && reason.message) ? reason.message : String(reason);

        // Match common audio/device failure signatures (case-insensitive)
        const audioSignatures = [
            'failed to start the audio device',
            'failed to start the audio',
            'audio',
            'cannot start audio',
            'audiocontext'
        ];
        const lower = msg.toLowerCase();
        const isAudioError = audioSignatures.some(sig => lower.includes(sig));

        if (isAudioError) {
            // Suppress these frequently-occurring environment/device errors to avoid noisy unhandled rejection logs
            console.warn('Suppressed audio error (unhandledrejection):', msg);
            // Prevent default so the rejection doesn't bubble to the console as an uncaught error
            event.preventDefault();
            return;
        }
        // Otherwise let it surface (helpful for debugging non-audio issues)
    } catch (err) {
        // Safety: if our handler throws, don't interrupt the app
        console.warn('Error in unhandledrejection handler:', err);
    }
});

// Mouse / Pointer Lock for Desktop
document.addEventListener('mousedown', (e) => {
    // Only exclude main menu buttons from auto-requesting pointer lock
    if (gameStarted && !document.pointerLockElement && !e.target.closest('.mc-btn')) {
        if (renderer.domElement.requestPointerLock) {
            renderer.domElement.requestPointerLock();
        }
    }
});

document.addEventListener('pointermove', (e) => {
    if (document.pointerLockElement === renderer.domElement) {
        player.rot.y -= e.movementX * 0.002 * SENSITIVITY;
        player.rot.x -= e.movementY * 0.002 * SENSITIVITY;
        player.rot.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.rot.x));
    }

    // Update floating item position
    const floatEl = document.getElementById('floating-item');
    if (floatEl && floatEl.style.display !== 'none') {
        // Center the floating item on the cursor/finger
        // On touch, we might want it slightly higher, but pointer events handle both
        const isTouch = e.pointerType === 'touch';
        floatEl.style.left = e.clientX + 'px';
        floatEl.style.top = (e.clientY - (isTouch ? 40 : 0)) + 'px';
    }
});

// Desktop Mouse Buttons
window.addEventListener('mousedown', (e) => {
    if (!gameStarted || document.pointerLockElement !== renderer.domElement) return;
    if (e.button === 0) handleBreakStart(); // Left Click
    if (e.button === 2) handlePlace(); // Right Click
});

window.addEventListener('mouseup', (e) => {
    if (e.button === 0) handleBreakEnd();
});

// Prevent context menu on right click
window.addEventListener('contextmenu', e => e.preventDefault());

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 30, 120);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Tone mapping / exposure for richer colors
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xfff4e0, 0.6); // slightly warmer, stronger ambient
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.castShadow = false;

const moonLight = new THREE.DirectionalLight(0xccddee, 0.6);
moonLight.castShadow = false; // Moon shadow is too heavy for performance usually, keep it light

// Shadow frustum setup for the render distance
const shadowSize = 60;
sunLight.shadow.camera.left = -shadowSize;
sunLight.shadow.camera.right = shadowSize;
sunLight.shadow.camera.top = shadowSize;
sunLight.shadow.camera.bottom = -shadowSize;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 300;
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.bias = -0.001; 
scene.add(sunLight);
scene.add(moonLight);

// Voxel Sun & Moon
const sunGeo = new THREE.BoxGeometry(25, 25, 25);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, fog: false });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

const moonGeo = new THREE.BoxGeometry(18, 18, 18);
const moonMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee, fog: false });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

let timeOfDay = Math.PI * 0.1; // Start at early morning (0 to 2PI cycle)
const DAY_SPEED = 0.01;
const SUN_DISTANCE = 250;

// Seeded Random Helper
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

// World Generation
let noise2D = createNoise2D();
let noise3D = createNoise3D();
const chunks = new Map();

function initNoise(seed) {
    const seedFunc = xmur3(seed.toString());
    const prng = mulberry32(seedFunc());
    noise2D = createNoise2D(prng);
    noise3D = createNoise3D(prng);
}
initNoise(WORLD_SEED);

function getChunkKey(x, z) { return `${x},${z}`; }

function resetWorld(newSeed) {
    WORLD_SEED = newSeed || Math.random().toString(36).substring(7);
    initNoise(WORLD_SEED);
    
    // Clear existing meshes
    for (const mesh of chunkMeshes.values()) {
        scene.remove(mesh);
        mesh.children.forEach(child => { if (child.dispose) child.dispose(); });
    }
    chunkMeshes.clear();
    chunks.clear();
    
    // Reset player position to safety
    player.pos.set(8, 45, 8);
    player.vel.set(0, 0, 0);
    updateChunks();
}

function generateChunk(cx, cz) {
    const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
    const surfaceHeights = new Int32Array(CHUNK_SIZE * CHUNK_SIZE);

    const SEA_LEVEL = 35;
    const SURFACE_OFFSET = 38;

    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            const worldX = cx * CHUNK_SIZE + x;
            const worldZ = cz * CHUNK_SIZE + z;
            
            // Surface Height Calculation (reduced noise amplitudes for a slightly flatter world)
            const n1 = noise2D(worldX * 0.008, worldZ * 0.008) * 4; // lowered from 8
            const n2 = noise2D(worldX * 0.04, worldZ * 0.04) * 2;   // lowered from 4
            const h = Math.floor(n1 + n2 + SURFACE_OFFSET);
            surfaceHeights[x + z * CHUNK_SIZE] = h;
            
            for (let y = 0; y < CHUNK_HEIGHT; y++) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                const worldY = y;
                
                // 1. Solid Bedrock at the very bottom
                if (y === 0) {
                    data[idx] = BLOCKS.BEDROCK;
                    continue;
                } else if (y < 3 && Math.random() < 1.0 - (y * 0.3)) {
                    data[idx] = BLOCKS.BEDROCK;
                    continue;
                }

                // 2. Base Terrain
                if (y < h - 1) {
                    if (y < h - 4) data[idx] = BLOCKS.STONE;
                    else data[idx] = BLOCKS.DIRT;
                }
                else if (y === h - 1) {
                    data[idx] = (y < SEA_LEVEL) ? BLOCKS.DIRT : BLOCKS.GRASS;
                }
                else if (y < SEA_LEVEL) {
                    data[idx] = BLOCKS.WATER;
                } else {
                    data[idx] = BLOCKS.AIR;
                }

                // 3. Cave Generation (3D Noise)
                // We carve caves out of stone/dirt/bedrock (except the very bottom bedrock layer)
                if (y > 0 && y < h - 2) {
                    const caveNoise = noise3D(worldX * 0.07, worldY * 0.08, worldZ * 0.07);
                    // Threshold for caves - simple bubble/worm hybrid feel
                    if (caveNoise > 0.5) {
                        data[idx] = BLOCKS.AIR;
                    }
                }
            }
        }
    }

    // Decoration pass: Trees (only on surface grass)
    for (let x = 2; x < CHUNK_SIZE - 2; x++) {
        for (let z = 2; z < CHUNK_SIZE - 2; z++) {
            const h = surfaceHeights[x + z * CHUNK_SIZE];
            const idxOnSurface = (h * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
            const idxBelowSurface = ((h-1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;

            if (h >= SEA_LEVEL && data[idxBelowSurface] === BLOCKS.GRASS && data[idxOnSurface] === BLOCKS.AIR) { 
                if (Math.random() < 0.008) { 
                    const trunkHeight = 4 + Math.floor(Math.random() * 2);
                    for (let ty = 0; ty < trunkHeight; ty++) {
                        const y = h + ty;
                        if (y < CHUNK_HEIGHT) {
                            data[(y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x] = BLOCKS.LOG;
                        }
                    }
                    const leafBaseY = h + trunkHeight - 2;
                    for (let ly = 0; ly < 3; ly++) {
                        const radius = ly === 2 ? 1 : 2;
                        for (let lx = -radius; lx <= radius; lx++) {
                            for (let lz = -radius; lz <= radius; lz++) {
                                if (Math.abs(lx) === radius && Math.abs(lz) === radius && ly < 2) continue;
                                const px = x + lx;
                                const py = leafBaseY + ly;
                                const pz = z + lz;
                                if (px >= 0 && px < CHUNK_SIZE && pz >= 0 && pz < CHUNK_SIZE && py < CHUNK_HEIGHT) {
                                    const lIdx = (py * CHUNK_SIZE * CHUNK_SIZE) + (pz * CHUNK_SIZE) + px;
                                    if (data[lIdx] === BLOCKS.AIR) data[lIdx] = BLOCKS.LEAVES;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // ORE GENERATION AROUND CAVES:
    // For each stone block adjacent to an air cavity, roll to replace stone with an ore.
    // Chances (when adjacent to cave): Diamond 12%, Gold 18%, Iron 21%, Coal 25% (checked in that priority order so
    // a single random determines which ore spawns).
    for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let z = 0; z < CHUNK_SIZE; z++) {
            for (let y = 1; y < CHUNK_HEIGHT - 1; y++) {
                const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                if (data[idx] !== BLOCKS.STONE) continue;
                // Only consider deep/underground stone (not surface near top)
                if (y > surfaceHeights[x + z * CHUNK_SIZE] - 2) continue;

                // Check neighbors for cave adjacency
                const neighbors = [
                    ((y) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + Math.max(0, x-1),
                    ((y) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + Math.min(CHUNK_SIZE-1, x+1),
                    ((y) * CHUNK_SIZE * CHUNK_SIZE) + (Math.max(0, z-1) * CHUNK_SIZE) + x,
                    ((y) * CHUNK_SIZE * CHUNK_SIZE) + (Math.min(CHUNK_SIZE-1, z+1) * CHUNK_SIZE) + x,
                    ((y-1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x,
                    ((y+1) * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x
                ];
                let adjacentToAir = false;
                for (let n of neighbors) {
                    if (data[n] === BLOCKS.AIR) { adjacentToAir = true; break; }
                }
                if (!adjacentToAir) continue;

                // Roll a single random for this candidate
                const r = Math.random();
                // Percent chances (as fractions)
                // Diamond 0.2% (0.002), Gold 0.3% (0.003), Iron 0.7% (0.007), Coal 1% (0.01)
                // Evaluated in descending priority using cumulative thresholds
                if (r < 0.002) {
                    data[idx] = BLOCKS.DIAMOND_ORE;
                } else if (r < 0.002 + 0.003) {
                    data[idx] = BLOCKS.GOLD_ORE;
                } else if (r < 0.002 + 0.003 + 0.007) {
                    data[idx] = BLOCKS.IRON_ORE;
                } else if (r < 0.002 + 0.003 + 0.007 + 0.01) {
                    data[idx] = BLOCKS.COAL_ORE;
                }
            }
        }
    }

    return data;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
boxGeo.translate(0.5, 0.5, 0.5); // Align blocks to [0, 1] range instead of centered at 0

// Add per-vertex color attribute to simulate darker corners (simple AO tint).
// We'll bake a vertex color where corners (vertices far from cube center) are darker.
{
    const pos = boxGeo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        // positions are in [0,1] after translate; compute "cornerness" as normalized max distance from center
        const dx = Math.abs(x - 0.5) / 0.5;
        const dy = Math.abs(y - 0.5) / 0.5;
        const dz = Math.abs(z - 0.5) / 0.5;
        const cornerness = Math.max(dx, dy, dz); // 0 at center of face, 1 at corners
        // brightness: keep faces fairly bright, darken corners subtly (tune multiplier)
        const brightness = 1.0 - 0.36 * cornerness; // corners ~0.64 brightness
        colors[i * 3 + 0] = brightness;
        colors[i * 3 + 1] = brightness;
        colors[i * 3 + 2] = brightness;
    }
    boxGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

const chunkMeshes = new Map();

// Dropped item entities (floating pickups)
const droppedItems = []; // { mesh, type, pos:Vector3, bobOffset, life, picked:false }

function getBlockAt(x, y, z) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const fz = Math.floor(z);
    const cx = Math.floor(fx / CHUNK_SIZE);
    const cz = Math.floor(fz / CHUNK_SIZE);
    const lx = ((fx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((fz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const chunk = chunks.get(getChunkKey(cx, cz));
    if (!chunk || fy < 0 || fy >= CHUNK_HEIGHT) return BLOCKS.AIR;
    return chunk[(fy * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx];
}

function buildChunkMesh(cx, cz) {
    const data = chunks.get(getChunkKey(cx, cz));
    if (!data) return;

    if (chunkMeshes.has(getChunkKey(cx, cz))) {
        scene.remove(chunkMeshes.get(getChunkKey(cx, cz)));
    }

    const group = new THREE.Group();
    group.position.set(cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE);

    // Group blocks by type for InstancedMesh
    const typeGroups = {};
    for (let i = 0; i < data.length; i++) {
        const type = data[i];
        if (type === BLOCKS.AIR) continue;
        
        const x = i % CHUNK_SIZE;
        const z = Math.floor(i / CHUNK_SIZE) % CHUNK_SIZE;
        const y = Math.floor(i / (CHUNK_SIZE * CHUNK_SIZE));

        // Basic Face Culling Optimization: Only render if at least one face is visible
        const neighbors = [
            getBlockAt(cx * CHUNK_SIZE + x + 1, y, cz * CHUNK_SIZE + z),
            getBlockAt(cx * CHUNK_SIZE + x - 1, y, cz * CHUNK_SIZE + z),
            getBlockAt(cx * CHUNK_SIZE + x, y + 1, cz * CHUNK_SIZE + z),
            getBlockAt(cx * CHUNK_SIZE + x, y - 1, cz * CHUNK_SIZE + z),
            getBlockAt(cx * CHUNK_SIZE + x, y, cz * CHUNK_SIZE + z + 1),
            getBlockAt(cx * CHUNK_SIZE + x, y, cz * CHUNK_SIZE + z - 1),
        ];
        
        const isVisible = neighbors.some(n => n === BLOCKS.AIR || n === BLOCKS.WATER && type !== BLOCKS.WATER);
        if (!isVisible) continue;

        if (!typeGroups[type]) typeGroups[type] = [];
        typeGroups[type].push({ x, y, z, i });
    }

    const dummy = new THREE.Object3D();
    for (const type in typeGroups) {
        const instances = typeGroups[type];
        const mesh = new THREE.InstancedMesh(boxGeo, blockMaterials[type], instances.length);
        
        // Shadows disabled for performance / cleaner look
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        
        instances.forEach((inst, idx) => {
            dummy.position.set(inst.x, inst.y, inst.z);
            dummy.updateMatrix();
            mesh.setMatrixAt(idx, dummy.matrix);
        });
        
        mesh.instanceMatrix.needsUpdate = true;
        mesh.userData = { isInstanced: true, type: parseInt(type), cx, cz, instances };
        group.add(mesh);
    }

    chunkMeshes.set(getChunkKey(cx, cz), group);
    scene.add(group);
}

// Dynamic Chunk Management
function updateChunks() {
    const pCX = Math.floor(player.pos.x / CHUNK_SIZE);
    const pCZ = Math.floor(player.pos.z / CHUNK_SIZE);

    // 1. Add new chunks within distance
    for (let x = pCX - RENDER_DISTANCE; x <= pCX + RENDER_DISTANCE; x++) {
        for (let z = pCZ - RENDER_DISTANCE; z <= pCZ + RENDER_DISTANCE; z++) {
            const key = getChunkKey(x, z);
            if (!chunks.has(key)) {
                chunks.set(key, generateChunk(x, z));
            }
            if (!chunkMeshes.has(key)) {
                buildChunkMesh(x, z);
            }
        }
    }

    // 2. Remove far chunks
    for (const [key, mesh] of chunkMeshes.entries()) {
        const [cx, cz] = key.split(',').map(Number);
        if (Math.abs(cx - pCX) > RENDER_DISTANCE || Math.abs(cz - pCZ) > RENDER_DISTANCE) {
            scene.remove(mesh);
            // Dispose of instanced meshes to free memory
            mesh.children.forEach(child => {
                if (child.dispose) child.dispose();
            });
            chunkMeshes.delete(key);
            // Optional: Also delete chunk data to save memory for truly endless exploration
            chunks.delete(key);
        }
    }
}

// Keyboard support
const keys = {};
window.addEventListener('keydown', (e) => {
    const rawKey = e.key;
    // Normalize all key identifiers to lowercase for consistent mapping (space stays as ' ')
    const pressed = (rawKey.length === 1) ? rawKey.toLowerCase() : rawKey.toLowerCase();
    const codeKey = (e.code || '').toLowerCase();
    // Prevent typing in inputs from triggering world controls
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
    }

    // Remappable key actions
    if (!window.currentKeybinds) {
        // default fallback (should be initialized later)
        window.currentKeybinds = {
            jump: ' ',
            inventory: 'e',
            place: 'f',
            drop: 'q',
            run: 'shift'
        };
    }

    // Movement / jump (use bound key)
    if (pressed === window.currentKeybinds.jump || codeKey === window.currentKeybinds.jump) {
        if (!keys[pressed] && !keys[codeKey]) handleJumpStart(e);
    }

    // Track key state for both key (character) and code (physical key) to support different layouts
    if (pressed) keys[pressed] = true;
    if (codeKey) keys[codeKey] = true;

    // Inventory / crafting
    if (pressed === window.currentKeybinds.inventory || codeKey === window.currentKeybinds.inventory) {
        // Toggle crafting overlay
        if (document.getElementById('inventory-overlay').style.display === 'flex') {
            document.getElementById('btn-close-inv').click();
        } else {
            openCrafting(2);
        }
    }

    // Place with keyboard (bound)
    if (pressed === window.currentKeybinds.place || codeKey === window.currentKeybinds.place) {
        handlePlace(e);
    }

    // Drop selected item (bound)
    if (pressed === window.currentKeybinds.drop || codeKey === window.currentKeybinds.drop) {
        const idx = player.selectedSlot;
        if (idx >= 0 && player.inventory[idx]) {
            spawnDroppedItem(player.inventory[idx].id, 1);
            player.inventory[idx].count--;
            if (player.inventory[idx].count <= 0) player.inventory[idx] = null;
            updateHotbarUI();
            playSound('place.mp3');
        }
    }

    // Run / Sprint (toggle when bound key pressed)
    if (pressed === window.currentKeybinds.run || codeKey === window.currentKeybinds.run) {
        player.isSprinting = !player.isSprinting;
        btnRun.classList.toggle('active', player.isSprinting);
    }

    // Number keys 1-9 select hotbar (use character key)
    if (/^[1-9]$/.test(pressed)) {
        const num = parseInt(pressed, 10) - 1;
        if (num >= 0 && num < 9) {
            player.selectedSlot = num;
            const item = player.inventory[player.selectedSlot];
            player.selectedBlock = item ? item.id : null;
            updateHotbarUI();
        }
    }

    // Escape to exit pointer lock
    if (e.code === 'Escape') {
        if (document.pointerLockElement === renderer.domElement) {
            document.exitPointerLock();
        }
        // If waiting for rebind, cancel and reset UI
        if (awaitingBind) {
            awaitingBind.el.style.background = '#777';
            updateKeybindUI();
            awaitingBind = null;
        }
    }
});
window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const codeKey = (e.code || '').toLowerCase();
    if (key) keys[key] = false;
    if (codeKey) keys[codeKey] = false;
    if (key === ' ') handleJumpEnd();
});

// Player / Movement Constants
const PLAYER_HEIGHT = 1.8;
const EYE_HEIGHT = 1.6;
const PLAYER_RADIUS = 0.3;

const player = {
    pos: new THREE.Vector3(8, 45, 8),
    vel: new THREE.Vector3(0, 0, 0),
    rot: new THREE.Euler(0, 0, 0, 'YXZ'),
    baseSpeed: 4.317,
    sprintSpeed: 5.0, // Reduced from 5.612
    isSprinting: false,
    gameMode: 'survival', // 'survival' or 'creative'
    acceleration: 35,
    friction: 0.9,
    jumpForce: 9.0,
    gravity: 28,
    onGround: false,
    isFlying: false,
    isInWater: false,
    isUnderwater: false,
    isJumping: false,
    lastJumpTime: 0,
    cursorItem: null,
    inventory: new Array(9).fill(null),
    craftingGrid: new Array(9).fill(null), // Supports 2x2 or 3x3
    currentCraftingType: 2, // 2 for 2x2, 3 for 3x3
    selectedSlot: 0,
    selectedBlock: BLOCKS.GRASS,
    bobbing: 0,
    bobbingSpeed: 10,
    bobbingAmount: 0.05,
    isBreaking: false,
    breakProgress: 0,
    targetBlock: null
};

let lastTime = performance.now();

// Drag and Drop state
let dragStartSlot = null;
let dragJustStarted = false;

camera.position.copy(player.pos);

// Mobile Controls
let joystick = null;
let moveDir = { x: 0, y: 0 };

// Touch Look
let lookTouchId = null;
let lastTouch = { x: 0, y: 0 };

window.addEventListener('touchstart', (e) => {
    if (!gameStarted) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // EXCLUDE buttons and inventory from starting a camera-look session.
        // This prevents the "locked" camera feeling when interacting with UI.
        const isUI = touch.target.closest('#joystick-container') || 
                     touch.target.closest('#action-buttons') || 
                     touch.target.closest('#ui') ||
                     touch.target.closest('.mc-btn');

        if (lookTouchId === null && !isUI) {
            lookTouchId = touch.identifier;
            lastTouch.x = touch.pageX;
            lastTouch.y = touch.pageY;
            break;
        }
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    if (lookTouchId === null) return;
    
    let touch = null;
    for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === lookTouchId) {
            touch = e.touches[i];
            break;
        }
    }
    
    if (touch) {
        const dx = touch.pageX - lastTouch.x;
        const dy = touch.pageY - lastTouch.y;
        
        player.rot.y -= dx * 0.005 * SENSITIVITY;
        player.rot.x -= dy * 0.005 * SENSITIVITY;
        player.rot.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, player.rot.x));
        
        lastTouch.x = touch.pageX;
        lastTouch.y = touch.pageY;
    }
}, { passive: false });

window.addEventListener('touchend', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
            lookTouchId = null;
            break;
        }
    }
});

window.addEventListener('touchcancel', (e) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
            lookTouchId = null;
            break;
        }
    }
});

// Action Buttons
const btnJump = document.getElementById('btn-jump');
const btnRun = document.getElementById('btn-run');
const btnBreak = document.getElementById('btn-break');
const btnPlace = document.getElementById('btn-place');
const btnInv = document.getElementById('btn-inv');

// Title Screen Elements
const titleScreen = document.getElementById('title-screen');
const gameUI = document.getElementById('game-ui');
const optionsScreen = document.getElementById('options-screen');
const worldScreen = document.getElementById('world-screen');
const btnPlay = document.getElementById('btn-play');
const btnOptionsOpen = document.getElementById('btn-options-open');
const btnOptionsClose = document.getElementById('btn-options-close');
const btnQuit = document.getElementById('btn-quit');
const btnFov = document.getElementById('btn-fov');
const btnRenderDist = document.getElementById('btn-render-dist');
const btnSensitivity = document.getElementById('btn-sensitivity');
const btnBobbing = document.getElementById('btn-bobbing');
const btnBrightness = document.getElementById('btn-brightness');
const btnWendrent = document.getElementById('btn-wendrent');
const btnPCControls = document.getElementById('btn-pc-controls');
const pcControlsScreen = document.getElementById('pc-controls-screen');
const btnClosePC = document.getElementById('btn-close-pc');
const bindJump = document.getElementById('bind-jump');
const bindInv = document.getElementById('bind-inv');
const bindPlace = document.getElementById('bind-place');
const bindDrop = document.getElementById('bind-drop');
const bindRun = document.getElementById('bind-run');
const btnCoords = document.getElementById('btn-coords');
const coordsDiv = document.getElementById('coords');
const btnGamemode = document.getElementById('btn-gamemode');
const btnCreateWorld = document.getElementById('btn-create-world');
const btnWorldBack = document.getElementById('btn-world-back');
const inputSeed = document.getElementById('input-seed');

// Dynamic splash facts / easter eggs for title (rotates each load)
(function() {
    const splashEl = document.getElementById('splash-text');
    if (!splashEl) return;

    // Short, concise splash messages to avoid screen flooding
    const SPLASH_MESSAGES = [
        "Browser!",
        "Press E to craft",
        "Try: WENDRENT",
        "Tiny world",
        "Double-jump = Flight",
        "Drops auto-collect",
        "Rare trees",
        "Gold near caves",
        "Procedural clouds",
        "Rebind keys"
    ];

    // Choose a random starting message
    let idx = Math.floor(Math.random() * SPLASH_MESSAGES.length);
    splashEl.innerText = SPLASH_MESSAGES[idx];

    // Cycle less frequently to keep the screen calm
    try {
        setTimeout(() => {
            let next = Math.floor(Math.random() * SPLASH_MESSAGES.length);
            if (next === idx) next = (next + 1) % SPLASH_MESSAGES.length;
            splashEl.innerText = SPLASH_MESSAGES[next];
        }, 8000 + Math.floor(Math.random() * 4000)); // between ~8s and ~12s
    } catch (e) {
        // ignore timing errors in constrained environments
    }
})();

// Helper to handle both touch and click
function addMenuListener(el, callback) {
    if (!el) return;
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        callback();
    }, { passive: false });
    el.addEventListener('click', (e) => {
        e.preventDefault();
        callback();
    });
}

addMenuListener(btnPlay, () => {
    worldScreen.style.display = 'flex';
    titleScreen.style.display = 'none';
});

addMenuListener(btnWorldBack, () => {
    worldScreen.style.display = 'none';
    titleScreen.style.display = 'flex';
});

addMenuListener(btnOptionsOpen, () => {
    optionsScreen.style.display = 'flex';
});

addMenuListener(btnOptionsClose, () => {
    optionsScreen.style.display = 'none';
});

addMenuListener(btnQuit, () => {
    window.location.reload();
});

let currentFOV = 75;
addMenuListener(btnFov, () => {
    const fovs = [70, 80, 90, 100, 110];
    let idx = fovs.indexOf(currentFOV);
    currentFOV = fovs[(idx + 1) % fovs.length];
    btnFov.innerText = `FOV: ${currentFOV}`;
    camera.fov = currentFOV;
    camera.updateProjectionMatrix();
});

let currentRenderDist = 4;
addMenuListener(btnRenderDist, () => {
    const dists = [2, 4, 6, 8];
    let idx = dists.indexOf(currentRenderDist);
    currentRenderDist = dists[(idx + 1) % dists.length];
    RENDER_DISTANCE = currentRenderDist;
    btnRenderDist.innerText = `Render: ${currentRenderDist}`;
    
    scene.fog.far = currentRenderDist * CHUNK_SIZE + 20;
    scene.fog.near = (currentRenderDist - 1) * CHUNK_SIZE;
});

addMenuListener(btnSensitivity, () => {
    const sensVals = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    let idx = sensVals.indexOf(SENSITIVITY);
    SENSITIVITY = sensVals[(idx + 1) % sensVals.length];
    btnSensitivity.innerText = `Sensitivity: ${Math.round(SENSITIVITY * 100)}%`;
});

addMenuListener(btnBobbing, () => {
    BOBBING_ENABLED = !BOBBING_ENABLED;
    btnBobbing.innerText = `Bobbing: ${BOBBING_ENABLED ? 'ON' : 'OFF'}`;
});

addMenuListener(btnBrightness, () => {
    const vals = [0.5, 1.0, 1.5, 2.0];
    let idx = vals.indexOf(BRIGHTNESS);
    BRIGHTNESS = vals[(idx + 1) % vals.length];
    const labels = ["Moody", "Normal", "Bright", "Ultra"];
    btnBrightness.innerText = `Brightness: ${labels[(idx + 1) % labels.length]}`;
});

// PC Controls: open panel
addMenuListener(btnPCControls, () => {
    pcControlsScreen.style.display = 'flex';
});

// Close PC Controls
addMenuListener(btnClosePC, () => {
    pcControlsScreen.style.display = 'none';
});

// Keybind storage & UI
const defaultKeybinds = {
    jump: ' ',
    inventory: 'e',
    place: 'f',
    drop: 'q',
    run: 'Shift',
    forward: 'w',
    left: 'a',
    back: 's',
    right: 'd'
};

function loadKeybinds() {
    const stored = localStorage.getItem('voxel_keybinds');
    if (stored) {
        try {
            window.currentKeybinds = JSON.parse(stored);
        } catch(e) {
            window.currentKeybinds = { ...defaultKeybinds };
        }
    } else {
        window.currentKeybinds = { ...defaultKeybinds };
    }
    // Normalize stored keybind values to lowercase for consistent comparisons
    for (let k in window.currentKeybinds) {
        const v = window.currentKeybinds[k];
        window.currentKeybinds[k] = (v && v.length === 1) ? v.toLowerCase() : (v ? v.toLowerCase() : v);
    }
    updateKeybindUI();
}
function saveKeybinds() {
    localStorage.setItem('voxel_keybinds', JSON.stringify(window.currentKeybinds));
    updateKeybindUI();
}
function formatKeyDisplay(k) {
    if (k === ' ') return 'Space';
    return k;
}
function updateKeybindUI() {
    bindJump.innerText = formatKeyDisplay(window.currentKeybinds.jump);
    bindInv.innerText = formatKeyDisplay(window.currentKeybinds.inventory);
    bindPlace.innerText = formatKeyDisplay(window.currentKeybinds.place);
    bindDrop.innerText = formatKeyDisplay(window.currentKeybinds.drop);
    bindRun.innerText = formatKeyDisplay(window.currentKeybinds.run);

    // Movement binds (elements may not exist in older markup)
    if (document.getElementById('bind-forward')) document.getElementById('bind-forward').innerText = formatKeyDisplay(window.currentKeybinds.forward);
    if (document.getElementById('bind-left')) document.getElementById('bind-left').innerText = formatKeyDisplay(window.currentKeybinds.left);
    if (document.getElementById('bind-back')) document.getElementById('bind-back').innerText = formatKeyDisplay(window.currentKeybinds.back);
    if (document.getElementById('bind-right')) document.getElementById('bind-right').innerText = formatKeyDisplay(window.currentKeybinds.right);
}

loadKeybinds();

// Coordinates toggle (persisted)
let SHOW_COORDS = (localStorage.getItem('voxel_show_coords') === '1');
if (coordsDiv) {
    coordsDiv.style.display = SHOW_COORDS ? 'block' : 'none';
}
if (btnCoords) {
    btnCoords.innerText = `Coordinates: ${SHOW_COORDS ? 'ON' : 'OFF'}`;
    addMenuListener(btnCoords, () => {
        SHOW_COORDS = !SHOW_COORDS;
        localStorage.setItem('voxel_show_coords', SHOW_COORDS ? '1' : '0');
        if (coordsDiv) coordsDiv.style.display = SHOW_COORDS ? 'block' : 'none';
        btnCoords.innerText = `Coordinates: ${SHOW_COORDS ? 'ON' : 'OFF'}`;
    });
}

let awaitingBind = null;
function startRebind(el, action) {
    awaitingBind = { el, action };
    el.innerText = 'Press a key...';
    el.style.background = '#ffdd66';
}
function finishRebind(key) {
    if (!awaitingBind) return;
    const { el, action } = awaitingBind;
    // Normalize stored key representation (lowercase)
    const norm = (key && key.length === 1) ? key.toLowerCase() : (key ? key.toLowerCase() : key);
    window.currentKeybinds[action] = norm;
    awaitingBind = null;
    el.style.background = '#777';
    saveKeybinds();
}

bindJump.addEventListener('click', () => startRebind(bindJump, 'jump'));
bindInv.addEventListener('click', () => startRebind(bindInv, 'inventory'));
bindPlace.addEventListener('click', () => startRebind(bindPlace, 'place'));
bindDrop.addEventListener('click', () => startRebind(bindDrop, 'drop'));
bindRun.addEventListener('click', () => startRebind(bindRun, 'run'));

// Optional movement bind elements (may exist after HTML update)
const bindForwardEl = document.getElementById('bind-forward');
const bindLeftEl = document.getElementById('bind-left');
const bindBackEl = document.getElementById('bind-back');
const bindRightEl = document.getElementById('bind-right');

if (bindForwardEl) bindForwardEl.addEventListener('click', () => startRebind(bindForwardEl, 'forward'));
if (bindLeftEl) bindLeftEl.addEventListener('click', () => startRebind(bindLeftEl, 'left'));
if (bindBackEl) bindBackEl.addEventListener('click', () => startRebind(bindBackEl, 'back'));
if (bindRightEl) bindRightEl.addEventListener('click', () => startRebind(bindRightEl, 'right'));

// Global listener to capture next key for rebinding
window.addEventListener('keydown', (e) => {
    if (!awaitingBind) return;
    e.preventDefault();
    if (e.key === 'Escape') {
        // cancel
        awaitingBind.el.style.background = '#777';
        updateKeybindUI();
        awaitingBind = null;
        return;
    }
    const key = (e.key.length === 1) ? e.key.toLowerCase() : e.key;
    finishRebind(key);
});

addMenuListener(btnWendrent, () => {
    WENDRENT_ENABLED = !WENDRENT_ENABLED;
    btnWendrent.innerText = `Wendrent Minerals: ${WENDRENT_ENABLED ? 'ON' : 'OFF'}`;
    btnWendrent.style.color = WENDRENT_ENABLED ? '#00ffaa' : '#ffaa00';
});

addMenuListener(btnGamemode, () => {
    if (player.gameMode === 'survival') {
        player.gameMode = 'creative';
        btnGamemode.innerText = "Game Mode: Creative";
        player.isFlying = false;
        // Populate inventory for Creative
        player.inventory = [
            { id: BLOCKS.GRASS, count: 64 },
            { id: BLOCKS.DIRT, count: 64 },
            { id: BLOCKS.STONE, count: 64 },
            { id: BLOCKS.BRICKS, count: 64 },
            { id: BLOCKS.WOOD, count: 64 },
            { id: BLOCKS.LOG, count: 64 },
            { id: BLOCKS.LEAVES, count: 64 },
            { id: BLOCKS.WATER, count: 64 },
            { id: BLOCKS.COBBLESTONE, count: 64 }
        ];
        if (player.selectedSlot >= 0 && player.inventory[player.selectedSlot]) {
            player.selectedBlock = player.inventory[player.selectedSlot].id;
        }
    } else {
        player.gameMode = 'survival';
        btnGamemode.innerText = "Game Mode: Survival (Demo)";
        player.isFlying = false;
        player.inventory = new Array(9).fill(null);
        player.selectedBlock = null;
    }
    if (gameStarted) updateHotbarUI();
});

addMenuListener(btnCreateWorld, () => {
    const seed = inputSeed.value || Math.random().toString(36).substring(7);
    resetWorld(seed);
    startGame();
});

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    titleScreen.style.display = 'none';
    worldScreen.style.display = 'none';
    gameUI.style.display = 'block';

    // Ensure inventory is set based on initial mode if not already set
    if (player.gameMode === 'creative' && player.inventory.every(i => i === null)) {
        player.inventory = [
            { id: BLOCKS.GRASS, count: 64 },
            { id: BLOCKS.DIRT, count: 64 },
            { id: BLOCKS.STONE, count: 64 },
            { id: BLOCKS.BRICKS, count: 64 },
            { id: BLOCKS.WOOD, count: 64 },
            { id: BLOCKS.LOG, count: 64 },
            { id: BLOCKS.LEAVES, count: 64 },
            { id: BLOCKS.WATER, count: 64 },
            { id: BLOCKS.COBBLESTONE, count: 64 }
        ];
    }
    
    updateHotbarUI();
    
    // Resume audio context
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Initialize joystick only after start
    joystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '60px', bottom: '60px' },
        color: 'white'
    });

    joystick.on('move', (evt, data) => {
        moveDir.x = data.vector.x;
        moveDir.y = data.vector.y;
    });
    joystick.on('end', () => {
        moveDir.x = 0;
        moveDir.y = 0;
    });
}

const handleJumpStart = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    player.isJumping = true;
    const now = performance.now();
    const timeSinceLastJump = now - player.lastJumpTime;
    
    if (timeSinceLastJump < 300 && player.gameMode === 'creative') {
        player.isFlying = !player.isFlying;
        player.vel.y = 0;
    } else {
        if (player.isFlying) {
            player.vel.y = 10; // Fly up
        } else if (player.onGround) {
            player.vel.y = player.jumpForce;
        } else if (player.isInWater) {
            player.vel.y = 4.5; // Initial swim stroke
        }
    }
    player.lastJumpTime = now;
};
const handleJumpEnd = (e) => {
    player.isJumping = false;
};
btnJump.addEventListener('touchstart', handleJumpStart);
btnJump.addEventListener('mousedown', handleJumpStart);
btnJump.addEventListener('touchend', handleJumpEnd);
btnJump.addEventListener('mouseup', handleJumpEnd);

const handleRun = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    if (player.isFlying) {
        player.vel.y = -10; // Fly down
    } else {
        player.isSprinting = !player.isSprinting;
        btnRun.classList.toggle('active', player.isSprinting);
    }
};
btnRun.addEventListener('touchstart', handleRun);
btnRun.addEventListener('mousedown', handleRun);

const handleBreakStart = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    player.isBreaking = true;
    btnBreak.classList.add('active');
};
btnBreak.addEventListener('touchstart', handleBreakStart);
btnBreak.addEventListener('mousedown', handleBreakStart);

const handleBreakEnd = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    player.isBreaking = false;
    player.breakProgress = 0;
    btnBreak.classList.remove('active');
    document.getElementById('break-progress-container').style.display = 'none';
};
btnBreak.addEventListener('touchend', handleBreakEnd);
btnBreak.addEventListener('mouseup', handleBreakEnd);
btnBreak.addEventListener('mouseleave', handleBreakEnd);

const handlePlace = (e) => {
    if (e && e.type === 'touchstart') e.preventDefault();
    performPlace();
};
btnPlace.addEventListener('touchstart', handlePlace);
btnPlace.addEventListener('mousedown', handlePlace);

function updateHotbarUI() {
    // Update selected block based on slot
    const item = player.inventory[player.selectedSlot];
    player.selectedBlock = item ? item.id : null;

    const slots = document.querySelectorAll('.slot');
    slots.forEach((slot, idx) => {
        slot.innerHTML = '';
        const item = player.inventory[idx];
        if (item) {
            const img = document.createElement('img');
            img.src = BLOCK_ICONS[item.id] || 'dirt.png';
            slot.appendChild(img);
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'slot-count';
                count.innerText = item.count;
                slot.appendChild(count);
            }
        }
        slot.classList.toggle('active', player.selectedSlot === idx);
    });
}

// Crafting System Logic
const RECIPES = [
    { input: [BLOCKS.LOG], output: BLOCKS.WOOD, count: 4, size: 1 },
    { input: [BLOCKS.WOOD, BLOCKS.WOOD], output: BLOCKS.STICK, count: 4, size: 2 },
    { input: [BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.WOOD], output: BLOCKS.CRAFTING_TABLE, count: 1, size: 2 },
    { input: [BLOCKS.STONE, BLOCKS.STONE, BLOCKS.STONE, BLOCKS.STONE], output: BLOCKS.BRICKS, count: 4, size: 2 },
    { input: [BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE], output: BLOCKS.STONE, count: 8, size: 3 },
    
    // Wooden Tools
    { input: [BLOCKS.WOOD, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.WOOD_SHOVEL, count: 1, size: 3 },
    { input: [BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.STICK], output: BLOCKS.WOOD_SWORD, count: 1, size: 3 },
    { input: [BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.WOOD_PICKAXE, count: 1, size: 3 },
    { input: [BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.WOOD, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.WOOD_AXE, count: 1, size: 3 },

    // Stone Tools
    { input: [BLOCKS.COBBLESTONE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.STONE_SHOVEL, count: 1, size: 3 },
    { input: [BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.STICK], output: BLOCKS.STONE_SWORD, count: 1, size: 3 },
    { input: [BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.STONE_PICKAXE, count: 1, size: 3 },
    { input: [BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.COBBLESTONE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.STONE_AXE, count: 1, size: 3 },

    // Gold Tools (crafted directly from gold ore for demo convenience)
    { input: [BLOCKS.GOLD_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.GOLD_SHOVEL, count: 1, size: 3 },
    { input: [BLOCKS.GOLD_ORE, BLOCKS.GOLD_ORE, BLOCKS.STICK], output: BLOCKS.GOLD_SWORD, count: 1, size: 3 },
    { input: [BLOCKS.GOLD_ORE, BLOCKS.GOLD_ORE, BLOCKS.GOLD_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.GOLD_PICKAXE, count: 1, size: 3 },
    { input: [BLOCKS.GOLD_ORE, BLOCKS.GOLD_ORE, BLOCKS.GOLD_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.GOLD_AXE, count: 1, size: 3 },

    // Iron Tools (crafted from iron ore for demo convenience)
    { input: [BLOCKS.IRON_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.IRON_SHOVEL, count: 1, size: 3 },
    { input: [BLOCKS.IRON_ORE, BLOCKS.IRON_ORE, BLOCKS.STICK], output: BLOCKS.IRON_SWORD, count: 1, size: 3 },
    { input: [BLOCKS.IRON_ORE, BLOCKS.IRON_ORE, BLOCKS.IRON_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.IRON_PICKAXE, count: 1, size: 3 },
    { input: [BLOCKS.IRON_ORE, BLOCKS.IRON_ORE, BLOCKS.IRON_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.IRON_AXE, count: 1, size: 3 },

    // Diamond Tools (crafted from diamond ore for demo convenience)
    { input: [BLOCKS.DIAMOND_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.DIAMOND_SHOVEL, count: 1, size: 3 },
    { input: [BLOCKS.DIAMOND_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.STICK], output: BLOCKS.DIAMOND_SWORD, count: 1, size: 3 },
    { input: [BLOCKS.DIAMOND_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.DIAMOND_PICKAXE, count: 1, size: 3 },
    { input: [BLOCKS.DIAMOND_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.DIAMOND_ORE, BLOCKS.STICK, BLOCKS.STICK], output: BLOCKS.DIAMOND_AXE, count: 1, size: 3 },
];

function checkCrafting() {
    const size = player.currentCraftingType;
    const grid = player.craftingGrid.slice(0, size * size);
    const resultSlot = document.getElementById('craft-result');
    resultSlot.innerHTML = '';
    
    // Simple shape-independent recipe check
    const recipe = RECIPES.find(r => {
        if (r.size > size) return false;
        const inputCopy = [...r.input];
        const gridContent = grid.filter(i => i !== null).map(i => i.id);
        if (inputCopy.length !== gridContent.length) return false;
        return inputCopy.every(type => {
            const idx = gridContent.indexOf(type);
            if (idx !== -1) {
                gridContent.splice(idx, 1);
                return true;
            }
            return false;
        });
    });

    if (recipe) {
        const img = document.createElement('img');
        img.src = BLOCK_ICONS[recipe.output];
        resultSlot.appendChild(img);
        resultSlot.dataset.output = recipe.output;
        if (recipe.count > 1) {
            const count = document.createElement('div');
            count.className = 'slot-count';
            count.innerText = recipe.count;
            resultSlot.appendChild(count);
        }
    } else {
        resultSlot.dataset.output = '';
    }
}

function openCrafting(type = 2) {
    if (document.pointerLockElement) document.exitPointerLock();
    player.currentCraftingType = type;
    player.craftingGrid = new Array(9).fill(null);
    const overlay = document.getElementById('inventory-overlay');
    const gridEl = document.getElementById('craft-grid');
    const invEl = document.getElementById('inv-grid');
    const title = document.getElementById('inv-title');
    
    overlay.style.display = 'flex';
    title.innerText = type === 2 ? 'Crafting' : 'Crafting Table';
    gridEl.className = `mc-grid grid-${type}x${type}`;
    gridEl.innerHTML = '';
    invEl.innerHTML = '';

    // Create crafting slots
    for (let i = 0; i < type * type; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        slot.dataset.type = 'craft';
        slot.dataset.index = i;
        slot.onpointerdown = (e) => handlePointerDown(e, 'craft', i);
        slot.onpointerup = (e) => handlePointerUp(e, 'craft', i);
        gridEl.appendChild(slot);
    }

    // Create inventory (hotbar) slots
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        slot.className = 'inv-slot';
        slot.dataset.type = 'inv';
        slot.dataset.index = i;
        slot.onpointerdown = (e) => handlePointerDown(e, 'inv', i);
        slot.onpointerup = (e) => handlePointerUp(e, 'inv', i);
        invEl.appendChild(slot);
    }

    // Interaction with Result Slot
    const resSlot = document.getElementById('craft-result');
    resSlot.onpointerdown = (e) => {
        const out = resSlot.dataset.output;
        if (out) {
            const outType = parseInt(out);
            const recipe = RECIPES.find(r => r.output === outType);
            if (!recipe) return;

            // If cursor is empty or has same item (and space)
            if (!player.cursorItem || (player.cursorItem.id === outType && player.cursorItem.count + recipe.count <= 64)) {
                if (!player.cursorItem) {
                    player.cursorItem = { id: outType, count: recipe.count };
                } else {
                    player.cursorItem.count += recipe.count;
                }

                // Consume ingredients (1 of each)
                for (let i = 0; i < 9; i++) {
                    if (player.craftingGrid[i]) {
                        player.craftingGrid[i].count--;
                        if (player.craftingGrid[i].count <= 0) player.craftingGrid[i] = null;
                    }
                }
                playSound('place.mp3');
                updateCraftingUI();
                updateHotbarUI();
            }
        }
    };

    updateCraftingUI();
    // Re-lock or hide joystick etc? No, just show overlay.
}

function handlePointerDown(e, area, index) {
    e.preventDefault();
    const slotEl = e.currentTarget;
    let targetArr = (area === 'inv') ? player.inventory : player.craftingGrid;
    let slotItem = targetArr[index];

    dragStartSlot = slotEl;

    if (!player.cursorItem) {
        // Pick up stack if empty cursor
        if (slotItem) {
            player.cursorItem = { ...slotItem };
            targetArr[index] = null;
            dragJustStarted = true;
            playSound('place.mp3');
            updateCraftingUI();
            updateHotbarUI();
        }
    } else {
        // If cursor has item, treat down as a drop/swap
        performDrop(area, index);
        dragJustStarted = false;
        updateCraftingUI();
        updateHotbarUI();
    }
}

function handlePointerUp(e, area, index) {
    e.preventDefault();
    // If we just picked it up on the same slot, don't drop it yet (allows "Tap to pick up")
    if (dragJustStarted && e.currentTarget === dragStartSlot) {
        dragJustStarted = false;
        return;
    }

    if (player.cursorItem) {
        performDrop(area, index);
        updateCraftingUI();
        updateHotbarUI();
    }
    dragJustStarted = false;
    dragStartSlot = null;
}

function performDrop(area, index) {
    if (!player.cursorItem) return;
    let targetArr = (area === 'inv') ? player.inventory : player.craftingGrid;
    let slotItem = targetArr[index];

    if (area === 'inv') {
        // Inventory drop: Place the whole stack or swap
        if (!slotItem) {
            targetArr[index] = { ...player.cursorItem };
            player.cursorItem = null;
            playSound('place.mp3');
        } else if (slotItem.id === player.cursorItem.id) {
            const canAdd = 64 - slotItem.count;
            const toAdd = Math.min(canAdd, player.cursorItem.count);
            slotItem.count += toAdd;
            player.cursorItem.count -= toAdd;
            if (player.cursorItem.count <= 0) player.cursorItem = null;
            playSound('place.mp3');
        } else {
            // Swap
            const temp = { ...slotItem };
            targetArr[index] = { ...player.cursorItem };
            player.cursorItem = temp;
            playSound('place.mp3');
        }
    } else { 
        // Crafting drop: Place ONE item or swap
        if (!slotItem || slotItem.id === player.cursorItem.id) {
            const currentCount = slotItem ? slotItem.count : 0;
            if (currentCount < 64) {
                targetArr[index] = { id: player.cursorItem.id, count: currentCount + 1 };
                player.cursorItem.count--;
                if (player.cursorItem.count <= 0) player.cursorItem = null;
                playSound('place.mp3');
            }
        } else {
            // Swap
            const temp = { ...slotItem };
            targetArr[index] = { ...player.cursorItem };
            player.cursorItem = temp;
            playSound('place.mp3');
        }
    }
}

function updateCraftingUI() {
    // Floating item
    const floatEl = document.getElementById('floating-item');
    if (player.cursorItem) {
        floatEl.style.display = 'block';
        floatEl.innerHTML = `<img src="${BLOCK_ICONS[player.cursorItem.id]}">`;
        if (player.cursorItem.count > 1) {
            floatEl.innerHTML += `<div class="slot-count">${player.cursorItem.count}</div>`;
        }
    } else {
        floatEl.style.display = 'none';
    }

    const craftSlots = document.querySelectorAll('.mc-grid[id="craft-grid"] .inv-slot');
    craftSlots.forEach((slot, idx) => {
        slot.innerHTML = '';
        const item = player.craftingGrid[idx];
        if (item) {
            const img = document.createElement('img');
            img.src = BLOCK_ICONS[item.id];
            slot.appendChild(img);
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'slot-count';
                count.innerText = item.count;
                slot.appendChild(count);
            }
        }
    });

    const invSlots = document.querySelectorAll('.mc-grid[id="inv-grid"] .inv-slot');
    invSlots.forEach((slot, idx) => {
        slot.innerHTML = '';
        const item = player.inventory[idx];
        if (item) {
            const img = document.createElement('img');
            img.src = BLOCK_ICONS[item.id];
            slot.appendChild(img);
            if (item.count > 1) {
                const count = document.createElement('div');
                count.className = 'slot-count';
                count.innerText = item.count;
                slot.appendChild(count);
            }
        }
    });
    checkCrafting();
}

addMenuListener(document.getElementById('btn-close-inv'), () => {
    // Return items to inventory
    const itemsToReturn = [...player.craftingGrid];
    if (player.cursorItem) itemsToReturn.push(player.cursorItem);
    
    itemsToReturn.forEach((item) => {
        if (item !== null && item.count > 0) {
            // Try to stack first
            let invIdx = player.inventory.findIndex(i => i && i.id === item.id && i.count < 64);
            if (invIdx === -1) invIdx = player.inventory.findIndex(i => i === null);
            
            if (invIdx !== -1) {
                if (player.inventory[invIdx]) {
                    const canAdd = 64 - player.inventory[invIdx].count;
                    const toAdd = Math.min(canAdd, item.count);
                    player.inventory[invIdx].count += toAdd;
                    item.count -= toAdd;
                } else {
                    player.inventory[invIdx] = { ...item };
                    item.count = 0;
                }
            }
        }
    });

    player.craftingGrid = new Array(9).fill(null);
    player.cursorItem = null;
    document.getElementById('inventory-overlay').style.display = 'none';
    updateHotbarUI();
});

addMenuListener(btnInv, () => {
    openCrafting(2);
});

// Block selection UI and HUD inventory interaction
document.querySelectorAll('.slot').forEach(slot => {
    const handleHUDSlot = (e) => {
        const isInventoryOpen = document.getElementById('inventory-overlay').style.display === 'flex';
        const clickedIdx = parseInt(slot.dataset.index);

        if (isInventoryOpen) {
            // If inventory is open, treat HUD slots like inventory slots
            if (e.type === 'pointerdown') handlePointerDown(e, 'inv', clickedIdx);
            else if (e.type === 'pointerup') handlePointerUp(e, 'inv', clickedIdx);
        } else {
            // If game is active, just select the slot
            if (e.type === 'pointerdown') {
                if (player.selectedSlot === clickedIdx) {
                    player.selectedSlot = -1;
                    player.selectedBlock = null;
                } else {
                    player.selectedSlot = clickedIdx;
                    const item = player.inventory[player.selectedSlot];
                    player.selectedBlock = item ? item.id : null;
                }
                updateHotbarUI();
            }
        }
    };
    slot.addEventListener('pointerdown', handleHUDSlot);
    slot.addEventListener('pointerup', handleHUDSlot);
});

// Global drag safety: clear drag state if pointer is released elsewhere
window.addEventListener('pointerup', () => {
    setTimeout(() => {
        dragJustStarted = false;
        dragStartSlot = null;
    }, 10);
});

const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

function performBreak(cx, cz, blockData) {
    const chunk = chunks.get(getChunkKey(cx, cz));
    if (!chunk) return;
    const type = chunk[blockData.i];
    chunk[blockData.i] = BLOCKS.AIR;
    playSound('break.mp3');
    
    // Spawn a dropped item pickup at the block position
    (function spawnDrop() {
        // Create a small cube pickup centered inside the block (exact middle)
        const dropSize = 0.6;
        const dropGeo = new THREE.BoxGeometry(dropSize, dropSize, dropSize);
        // Choose per-face materials if available, otherwise clone a single material for all faces
        let mat = blockMaterials[type];
        if (!mat) mat = matDirt;

        let faceMats = [];
        if (Array.isArray(mat)) {
            // If blockMaterials defines face materials (6 entries), map them; otherwise reuse as needed
            for (let i = 0; i < 6; i++) {
                const src = mat[i] || mat[0];
                faceMats.push(src.clone ? src.clone() : src);
            }
        } else {
            // Special case: grass should show grass top on the top face
            if (type === BLOCKS.GRASS) {
                faceMats = [
                    matGrassSide.clone(), // right
                    matGrassSide.clone(), // left
                    matGrassTop.clone(),  // top
                    matDirt.clone(),      // bottom
                    matGrassSide.clone(), // front
                    matGrassSide.clone()  // back
                ];
            } else {
                // use same material for all faces
                const cloneMat = mat.clone ? mat.clone() : mat;
                for (let i = 0; i < 6; i++) faceMats.push(cloneMat);
            }
        }

        // Ensure materials are MeshStandard/MeshLambert clones for consistent properties
        faceMats = faceMats.map(m => {
            if (m instanceof THREE.Material && m.clone) return m.clone();
            return m;
        });

        const mesh = new THREE.Mesh(dropGeo, faceMats);
        // Disable shadows on dropped pickups
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        // world position of the block (center)
        const bx = blockData.x + cx * CHUNK_SIZE;
        const by = blockData.y;
        const bz = blockData.z + cz * CHUNK_SIZE;
        // Place exactly at center of the block
        mesh.position.set(bx + 0.5, by + 0.5, bz + 0.5);
        mesh.userData.dropType = type;
        scene.add(mesh);
        droppedItems.push({
            mesh,
            type,
            pos: mesh.position.clone(),
            bobOffset: Math.random() * Math.PI * 2,
            life: 0,
            picked: false,
            homeSpeed: 0
        });
    })();

    // Collection logic for survival
    if (player.gameMode === 'survival') {
        // Find existing stack of the same type that is not full
        let slotIdx = player.inventory.findIndex(item => item && item.id === type && item.count < 64);
        if (slotIdx === -1) {
            // Find first empty slot
            slotIdx = player.inventory.findIndex(item => item === null);
        }
        
        if (slotIdx !== -1) {
            if (player.inventory[slotIdx]) {
                player.inventory[slotIdx].count++;
            } else {
                player.inventory[slotIdx] = { id: type, count: 1 };
            }
            // Update current selected block cache
            if (player.selectedSlot === slotIdx) player.selectedBlock = type;
            updateHotbarUI();
        }
    }

    buildChunkMesh(cx, cz);
    // Also rebuild neighbors if on edge
    if (blockData.x === 0) buildChunkMesh(cx - 1, cz);
    if (blockData.x === CHUNK_SIZE - 1) buildChunkMesh(cx + 1, cz);
    if (blockData.z === 0) buildChunkMesh(cx, cz - 1);
    if (blockData.z === CHUNK_SIZE - 1) buildChunkMesh(cx, cz + 1);
}

function spawnDroppedItem(type, count = 1) {
    // Create a dropped item pickup at player's front, using similar visuals to performBreak drops
    const dropSize = 0.6;
    const dropGeo = new THREE.BoxGeometry(dropSize, dropSize, dropSize);
    let mat = blockMaterials[type] || matDirt;
    let faceMats = [];

    if (Array.isArray(mat)) {
        for (let i = 0; i < 6; i++) faceMats.push((mat[i] || mat[0]).clone ? mat[i].clone() : mat[i]);
    } else {
        if (type === BLOCKS.GRASS) {
            faceMats = [
                matGrassSide.clone(), matGrassSide.clone(), matGrassTop.clone(),
                matDirt.clone(), matGrassSide.clone(), matGrassSide.clone()
            ];
        } else {
            for (let i = 0; i < 6; i++) faceMats.push(mat.clone ? mat.clone() : mat);
        }
    }

    faceMats = faceMats.map(m => (m && m.clone) ? m.clone() : m);
    const mesh = new THREE.Mesh(dropGeo, faceMats);
    // Disable shadows for spawned dropped items
    mesh.castShadow = false;
    mesh.receiveShadow = false;

    // Place just in front of player
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.rot.y, 0));
    const spawnPos = player.pos.clone().add(new THREE.Vector3(0, -0.5, 0)).add(forward.clone().multiplyScalar(1.2));
    mesh.position.copy(spawnPos);
    scene.add(mesh);

    droppedItems.push({
        mesh,
        type,
        pos: mesh.position.clone(),
        bobOffset: Math.random() * Math.PI * 2,
        life: 0,
        picked: false,
        homeSpeed: 0,
        count
    });
}

function performPlace() {
    raycaster.setFromCamera(center, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        const hit = intersects[0];
        if (hit.distance < 5) {
            // Check if we hit a crafting table
            const mesh = hit.object;
            if (mesh.userData.isInstanced) {
                const { cx, cz, instances } = mesh.userData;
                const blockData = instances[hit.instanceId];
                const type = chunks.get(getChunkKey(cx, cz))[blockData.i];
                if (type === BLOCKS.CRAFTING_TABLE) {
                    openCrafting(3);
                    return;
                }
            }

            const slotItem = player.inventory[player.selectedSlot];
            if (!slotItem) return;
            const blockToPlace = slotItem.id;

            // Only allow placing actual blocks
            if (!blockMaterials[blockToPlace]) return;

            const pos = hit.point.clone().add(hit.face.normal.clone().multiplyScalar(0.5));
            const bx = Math.floor(pos.x);
            const by = Math.floor(pos.y);
            const bz = Math.floor(pos.z);
            
            const cx = Math.floor(bx / CHUNK_SIZE);
            const cz = Math.floor(bz / CHUNK_SIZE);
            const lx = ((bx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const lz = ((bz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            
            const chunkKey = getChunkKey(cx, cz);
            if (chunks.has(chunkKey)) {
                const chunk = chunks.get(chunkKey);
                const idx = (by * CHUNK_SIZE * CHUNK_SIZE) + (lz * CHUNK_SIZE) + lx;
                if (by >= 0 && by < CHUNK_HEIGHT) {
                    // Check if player is in the way
                    const playerHead = Math.floor(player.pos.y);
                    const playerFeet = Math.floor(player.pos.y - 1);
                    if (bx === Math.floor(player.pos.x) && bz === Math.floor(player.pos.z) && (by === playerHead || by === playerFeet)) {
                        return;
                    }

                    chunk[idx] = blockToPlace;
                    playSound('place.mp3');
                    
                    if (player.gameMode === 'survival') {
                        player.inventory[player.selectedSlot].count--;
                        if (player.inventory[player.selectedSlot].count <= 0) {
                            player.inventory[player.selectedSlot] = null;
                            player.selectedBlock = null;
                        }
                        updateHotbarUI();
                    }
                    
                    buildChunkMesh(cx, cz);
                    if (lx === 0) buildChunkMesh(cx - 1, cz);
                    if (lx === CHUNK_SIZE - 1) buildChunkMesh(cx + 1, cz);
                    if (lz === 0) buildChunkMesh(cx, cz - 1);
                    if (lz === CHUNK_SIZE - 1) buildChunkMesh(cx, cz + 1);
                }
            }
        }
    }
}

let chunkUpdateTimer = 0;

// Clouds Setup
const CLOUD_HEIGHT = 75; // Lowered to be within render distance more consistently
const CLOUD_AREA = 2000;
const CLOUD_SPEED = 0.8;
let cloudsGroup;
let starsGroup;

function initStars() {
    starsGroup = new THREE.Group();
    const starCount = 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const opacities = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        // Random spherical coordinates
        const r = 400; // Far away
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        opacities[i] = 0.5 + Math.random() * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0,
        sizeAttenuation: false,
        fog: false
    });

    const stars = new THREE.Points(geometry, material);
    starsGroup.add(stars);
    scene.add(starsGroup);
}

function initClouds() {
    if (cloudsGroup) scene.remove(cloudsGroup);
    cloudsGroup = new THREE.Group();
    
    const cloudBlockGeo = new THREE.BoxGeometry(24, 4, 24);
    const gridSize = 40;
    const spacing = 50; // Reduced spacing to make them much more frequent

    for (let x = -gridSize / 2; x < gridSize / 2; x++) {
        for (let z = -gridSize / 2; z < gridSize / 2; z++) {
            const noise = noise2D(x * 0.1, z * 0.1);
            if (noise > 0.3) { 
                const cloudMat = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8,
                    side: THREE.DoubleSide,
                    fog: false // Disable fog on clouds so they are visible against the sky regardless of distance
                });
                const mesh = new THREE.Mesh(cloudBlockGeo, cloudMat);
                const yOffset = Math.sin(x * 0.5) * 2;
                mesh.position.set(x * spacing, CLOUD_HEIGHT + yOffset, z * spacing);
                
                mesh.scale.x = 1.0 + Math.random() * 3.0;
                mesh.scale.z = 1.0 + Math.random() * 3.0;
                cloudsGroup.add(mesh);
            }
        }
    }
    scene.add(cloudsGroup);
}

initClouds();
initStars();

// Volumetric Sun Rays (God Rays) Setup
let godRaysGroup;
function initGodRays() {
    godRaysGroup = new THREE.Group();
    
    // Core Sun Glow
    const glowGeo = new THREE.CircleGeometry(40, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffccaa,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    godRaysGroup.add(glow);

    // Dynamic Rays
    const rayMat = new THREE.MeshBasicMaterial({
        color: 0xfff0aa,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 24; i++) {
        const length = 600 + Math.random() * 400;
        const rayGeo = new THREE.CylinderGeometry(0.1, 10 + Math.random() * 30, length, 8, 1, true);
        rayGeo.translate(0, -length / 2, 0);
        rayGeo.rotateX(Math.PI / 2);
        
        const ray = new THREE.Mesh(rayGeo, rayMat.clone());
        ray.rotation.z = (i / 24) * Math.PI * 2 + Math.random();
        ray.rotation.x += (Math.random() - 0.5) * 0.3;
        ray.rotation.y += (Math.random() - 0.5) * 0.3;
        ray.scale.setScalar(0.3 + Math.random() * 0.9);
        godRaysGroup.add(ray);
    }
    scene.add(godRaysGroup);
}
initGodRays();

// Update loop
function update(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.1);
    lastTime = time;
    // Animate dropped items: hovering, spinning, and homing to player when close
    if (droppedItems.length > 0) {
        for (let i = droppedItems.length - 1; i >= 0; i--) {
            const d = droppedItems[i];
            d.life += dt;

            // Keep the drop fixed at its spawn position but rotate it around Y axis
            d.mesh.position.copy(d.pos);
            d.mesh.rotation.y += dt * 1.8; // constant y-axis spin

            // Distance to player
            const dist = d.mesh.position.distanceTo(player.pos);

            // If within 2 blocks or touching, immediately collect without moving the drop
            if (dist <= 2.0) {
                let added = false;
                if (player.gameMode === 'survival') {
                    // Prefer stacking into existing stack
                    let idx = player.inventory.findIndex(it => it && it.id === d.type && it.count < 64);
                    if (idx === -1) idx = player.inventory.findIndex(it => it === null);
                    if (idx !== -1) {
                        if (player.inventory[idx]) {
                            player.inventory[idx].count = Math.min(64, player.inventory[idx].count + 1);
                        } else {
                            player.inventory[idx] = { id: d.type, count: 1 };
                        }
                        added = true;
                    }
                } else {
                    // Creative: place into selected slot if empty, else try stack
                    let idx = player.selectedSlot >= 0 ? player.selectedSlot : 0;
                    if (!player.inventory[idx]) {
                        player.inventory[idx] = { id: d.type, count: 1 };
                        added = true;
                    } else if (player.inventory[idx].id === d.type && player.inventory[idx].count < 64) {
                        player.inventory[idx].count++;
                        added = true;
                    } else {
                        // try to stack elsewhere
                        let idx2 = player.inventory.findIndex(it => it && it.id === d.type && it.count < 64);
                        if (idx2 === -1) idx2 = player.inventory.findIndex(it => it === null);
                        if (idx2 !== -1) {
                            if (player.inventory[idx2]) player.inventory[idx2].count++;
                            else player.inventory[idx2] = { id: d.type, count: 1 };
                            added = true;
                        }
                    }
                }

                if (added) {
                    playSound('place.mp3');
                    updateHotbarUI();
                }

                // cleanup without any movement animation
                scene.remove(d.mesh);
                if (d.mesh.geometry) d.mesh.geometry.dispose();
                if (d.mesh.material && d.mesh.material.dispose) d.mesh.material.dispose();
                droppedItems.splice(i, 1);
                continue;
            }

            // Lifetime cull after long time (30s) — gently fade and remove
            if (d.life > 30) {
                // fade material
                if (d.mesh.material && 'opacity' in d.mesh.material) {
                    d.mesh.material.transparent = true;
                    d.mesh.material.opacity = Math.max(0, 1 - (d.life - 30) * 0.5);
                }
                if (d.life > 32) {
                    scene.remove(d.mesh);
                    if (d.mesh.geometry) d.mesh.geometry.dispose();
                    if (d.mesh.material && d.mesh.material.dispose) d.mesh.material.dispose();
                    droppedItems.splice(i, 1);
                }
            }
        }
    }

    if (!gameStarted) {
        // Rotate camera slightly for a dynamic background on title screen
        player.rot.y += dt * 0.1;
        camera.quaternion.setFromEuler(player.rot);
        renderer.render(scene, camera);
        requestAnimationFrame(update);
        return;
    }

    // Periodic chunk updates to avoid heavy calculations every frame
    chunkUpdateTimer += dt;
    if (chunkUpdateTimer > 0.5) {
        updateChunks();
        chunkUpdateTimer = 0;
    }

    // Breaking Logic
    if (player.isBreaking) {
        raycaster.setFromCamera(center, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        const progressContainer = document.getElementById('break-progress-container');
        const progressBar = document.getElementById('break-progress-bar');
        
        if (intersects.length > 0 && intersects[0].distance < 5) {
            const hit = intersects[0];
            const mesh = hit.object;
            
            if (mesh.userData.isInstanced) {
                const { cx, cz, instances } = mesh.userData;
                const blockData = instances[hit.instanceId];
                const type = blockData ? chunks.get(getChunkKey(cx, cz))[blockData.i] : 0;
                
                // Use hardness if in survival, near-instant in creative
                let hardness = BLOCK_HARDNESS[type] || 0.5;

                // Apply tool speed multiplier
                const heldItem = player.inventory[player.selectedSlot];
                if (heldItem && TOOL_SPEEDS[heldItem.id] && TOOL_SPEEDS[heldItem.id][type]) {
                    hardness /= TOOL_SPEEDS[heldItem.id][type];
                }

                if (player.gameMode === 'creative' && type !== BLOCKS.WATER) {
                    hardness = 0.05; // Shortened mining time
                }

                // Unique ID for the block being targeted
                const targetId = `${cx},${cz},${blockData.i}`;
                
                if (hardness === -1 && player.gameMode !== 'creative') {
                    player.breakProgress = 0;
                    progressContainer.style.display = 'none';
                } else {
                    if (player.targetBlock !== targetId) {
                        player.targetBlock = targetId;
                        player.breakProgress = 0;
                    }
                    
                    player.breakProgress += dt;
                    progressContainer.style.display = 'block';
                    progressBar.style.width = Math.min(100, (player.breakProgress / hardness) * 100) + '%';
                    
                    if (player.breakProgress >= hardness) {
                        performBreak(cx, cz, blockData);
                        player.breakProgress = 0;
                        player.targetBlock = null;
                        progressContainer.style.display = 'none';
                    }
                }
            } else {
                player.breakProgress = 0;
                progressContainer.style.display = 'none';
            }
        } else {
            player.breakProgress = 0;
            progressContainer.style.display = 'none';
        }
    }

    // Update Day/Night Cycle
    timeOfDay += dt * DAY_SPEED;
    
    // Position Sun & Moon mesh in orbit around player (YZ plane)
    const sunZ = Math.cos(timeOfDay) * SUN_DISTANCE;
    const sunY = Math.sin(timeOfDay) * SUN_DISTANCE;
    sunMesh.position.set(player.pos.x, player.pos.y + sunY, player.pos.z + sunZ);
    sunMesh.lookAt(player.pos);

    const moonZ = Math.cos(timeOfDay + Math.PI) * SUN_DISTANCE;
    const moonY = Math.sin(timeOfDay + Math.PI) * SUN_DISTANCE;
    moonMesh.position.set(player.pos.x, player.pos.y + moonY, player.pos.z + moonZ);
    moonMesh.lookAt(player.pos);
    
    // Update Sun Light
    sunLight.position.copy(sunMesh.position);
    sunLight.target.position.copy(player.pos);
    sunLight.target.updateMatrixWorld();

    // Update Moon Light
    moonLight.position.copy(moonMesh.position);
    moonLight.target.position.copy(player.pos);
    moonLight.target.updateMatrixWorld();

    // Dynamically adjust sky and light based on sun altitude
    const sunHeightNorm = Math.sin(timeOfDay); // -1 to 1
    const dayFactor = Math.max(0, sunHeightNorm); // 0 at night, 1 at noon
    const nightFactor = Math.max(0, -sunHeightNorm); // 1 at midnight, 0 at noon
    
    // Interpolate Sky Color
    const dayColor = new THREE.Color(0x87CEEB);
    const nightColor = new THREE.Color(0x050510);
    const horizonColor = new THREE.Color(0xff7f50);
    
    let skyCol;
    if (sunHeightNorm > 0.2) {
        skyCol = dayColor;
    } else if (sunHeightNorm > -0.1) {
        // Sunset/Sunrise transition
        const t = (sunHeightNorm + 0.1) / 0.3;
        skyCol = nightColor.clone().lerp(horizonColor, t).lerp(dayColor, t);
    } else {
        skyCol = nightColor;
    }
    
    scene.background = skyCol;
    scene.fog.color = skyCol;

    // Update God Rays
    if (godRaysGroup) {
        if (WENDRENT_ENABLED && dayFactor > 0.1) {
            godRaysGroup.visible = true;
            godRaysGroup.position.copy(sunMesh.position);
            godRaysGroup.lookAt(player.pos);
            
            // Pulse and rotate rays slightly for "shimmering" effect (increased opacity for richer look)
            const rayPulse = Math.sin(time * 0.0004) * 0.03 + 0.06;
            godRaysGroup.children.forEach((ray, i) => {
                if (i === 0) { // Glow disk
                    ray.material.opacity = 0.25 * dayFactor; // stronger core glow
                    ray.scale.setScalar(1 + Math.sin(time * 0.0008) * 0.06);
                } else {
                    ray.material.opacity = rayPulse * dayFactor * (0.5 + Math.sin(time * 0.0008 + i) * 0.6); // richer rays
                    ray.rotation.z += dt * 0.02 * (i % 2 === 0 ? 1 : -1);
                }
            });
        } else {
            godRaysGroup.visible = false;
        }
    }

    // Update Water Material for "Realistic WM" look
    if (WENDRENT_ENABLED) {
        matWater.metalness = 0.06; // low metalness for natural specular highlight
        matWater.roughness = 0.12;
        // Deeper, richer blue with more noticeable reflection
        matWater.color.setHex(0x2e9fff);
        matWater.opacity = 0.55;
        
        if (textures.water) {
            textures.water.wrapS = textures.water.wrapT = THREE.RepeatWrapping;
            // Swirling ripple effect
            textures.water.repeat.set(4, 4);
            textures.water.offset.x += dt * 0.06 * Math.sin(time * 0.0005);
            textures.water.offset.y += dt * 0.03;
        }
    } else {
        matWater.metalness = 0.06;
        matWater.roughness = 0.6;
        // Slightly richer default tint
        matWater.color.setHex(0x66bbff);
        matWater.opacity = 0.62;
        if (textures.water) {
            textures.water.repeat.set(1, 1);
        }
    }

    // Update Stars
    if (starsGroup) {
        // Stars follow celestial rotation and fade in at night
        starsGroup.rotation.x = timeOfDay;
        starsGroup.children[0].material.opacity = nightFactor;
        starsGroup.position.copy(player.pos);
    }

    // Move clouds
    if (cloudsGroup) {
        cloudsGroup.position.x += dt * CLOUD_SPEED;
        // Simple wrapping relative to player
        const halfArea = CLOUD_AREA / 2;
        if (cloudsGroup.position.x - player.pos.x > halfArea) cloudsGroup.position.x -= CLOUD_AREA;
        if (cloudsGroup.position.x - player.pos.x < -halfArea) cloudsGroup.position.x += CLOUD_AREA;
        
        // Match cloud brightness to day factor
        cloudsGroup.children.forEach(cloud => {
            // Slightly richer, warmer clouds during day
            const base = 0.6 + dayFactor * 0.4; // richer baseline
            cloud.material.color.setRGB(base, base, base * 0.98);
            cloud.material.opacity = 0.45 + dayFactor * 0.45;
        });
    }

    // Apply Settings
    const wendrentMulti = WENDRENT_ENABLED ? 1.4 : 1.0;
    const brightnessMulti = BRIGHTNESS;

    sunLight.intensity = dayFactor * 1.2 * wendrentMulti * brightnessMulti;
    moonLight.intensity = nightFactor * 0.6 * wendrentMulti * brightnessMulti;
    ambientLight.intensity = (0.05 + dayFactor * 0.45 + nightFactor * 0.15) * brightnessMulti;

    if (WENDRENT_ENABLED) {
        // Boost saturation by slightly shifting light colors and background
        const saturatedSky = skyCol.clone().multiplyScalar(1.35);
        scene.background = saturatedSky;
        scene.fog.color = saturatedSky;
        ambientLight.color.setHex(dayFactor > 0.5 ? 0xfff4e0 : 0xd0e0ff);
        sunLight.color.setHex(0xfff1d6);
    } else {
        // Slight saturation nudge even when Wendrent is off for richer default colors
        const boostedSky = skyCol.clone().multiplyScalar(1.08);
        scene.background = boostedSky;
        scene.fog.color = boostedSky;
        // Keep ambient a bit warm for richness
        ambientLight.color.setHex(0xfff7ef);
        sunLight.color.setHex(0xfff8e8);
    }

    // 1. Horizontal Movement (Minecraft style physics)
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(0, player.rot.y, 0));
    const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(0, player.rot.y, 0));
    
    const moveSpeed = player.isSprinting ? player.sprintSpeed : player.baseSpeed;
    const accel = player.onGround ? player.acceleration : player.acceleration * 0.2;
    const friction = player.onGround ? player.friction : 0.98; // Air resistance

    // Movement input using remappable binds (support char keys, physical codes and arrow keys)
    function normBindKey(k) {
        if (!k) return k;
        if (k === ' ') return ' ';
        return k.length === 1 ? k.toLowerCase() : k.toLowerCase();
    }

    function isBindPressed(action) {
        if (!window.currentKeybinds) return false;
        const bind = window.currentKeybinds[action];
        if (!bind) return false;
        const norm = normBindKey(bind);

        // 1) character key like 'w'
        if (keys[norm]) return true;
        // 2) physical code like 'keyw' (keydown stored e.code too)
        if (norm.length === 1 && keys['key' + norm.toUpperCase()]) return true;
        // 3) some binds may store full names like 'shift' or 'space'
        if (keys[norm]) return true;
        // 4) arrow fallbacks for movement so arrow keys always work
        const arrowMap = { forward: 'arrowup', back: 'arrowdown', left: 'arrowleft', right: 'arrowright' };
        if (arrowMap[action] && keys[arrowMap[action]]) return true;

        return false;
    }

    let kX = 0, kY = 0;
    if (isBindPressed('forward')) kY += 1;
    if (isBindPressed('back'))    kY -= 1;
    if (isBindPressed('left'))    kX -= 1;
    if (isBindPressed('right'))   kX += 1;

    const inputX = moveDir.x || kX;
    const inputY = moveDir.y || kY;

    // Detect Water state
    const blockAtFeet = getBlockAt(player.pos.x, player.pos.y - EYE_HEIGHT, player.pos.z);
    const blockAtEyes = getBlockAt(player.pos.x, player.pos.y, player.pos.z);
    player.isInWater = blockAtFeet === BLOCKS.WATER;
    player.isUnderwater = blockAtEyes === BLOCKS.WATER;

    // Update UI for underwater
    const waterOverlay = document.getElementById('underwater-overlay');
    if (waterOverlay) waterOverlay.style.display = player.isUnderwater ? 'block' : 'none';

    // Target velocity based on input
    let targetVelX = (forward.x * inputY + right.x * inputX) * moveSpeed;
    let targetVelZ = (forward.z * inputY + right.z * inputX) * moveSpeed;

    // Slower movement in water
    if (player.isInWater && !player.isFlying) {
        targetVelX *= 0.85;
        targetVelZ *= 0.85;
    }

    // Apply friction first
    const currentFriction = player.isInWater ? 0.92 : friction;
    player.vel.x *= Math.pow(currentFriction, dt * 60);
    player.vel.z *= Math.pow(currentFriction, dt * 60);

    // Then apply acceleration
    if (moveDir.x !== 0 || moveDir.y !== 0) {
        const dx = targetVelX - player.vel.x;
        const dz = targetVelZ - player.vel.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.01) {
            player.vel.x += (dx / dist) * accel * dt;
            player.vel.z += (dz / dist) * accel * dt;
        }
    } else if (player.onGround) {
        // Snap to zero if very slow on ground
        if (Math.abs(player.vel.x) < 0.1) player.vel.x = 0;
        if (Math.abs(player.vel.z) < 0.1) player.vel.z = 0;
    }

    // View Bobbing
    if (BOBBING_ENABLED && player.onGround && (Math.abs(player.vel.x) > 0.1 || Math.abs(player.vel.z) > 0.1)) {
        player.bobbing += dt * player.bobbingSpeed;
    } else {
        player.bobbing = 0;
    }

    // Collision & Movement
    const feetY = player.pos.y - EYE_HEIGHT;
    const checkPoints = [
        { x: PLAYER_RADIUS, z: PLAYER_RADIUS },
        { x: PLAYER_RADIUS, z: -PLAYER_RADIUS },
        { x: -PLAYER_RADIUS, z: PLAYER_RADIUS },
        { x: -PLAYER_RADIUS, z: -PLAYER_RADIUS }
    ];

    const isCollidingAt = (nx, ny, nz) => {
        for (let pt of checkPoints) {
            // Check multiple heights (feet, waist, head)
            for (let h of [0.1, 1.0, 1.7]) {
                const b = getBlockAt(nx + pt.x, ny + h, nz + pt.z);
                if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) return true;
            }
        }
        return false;
    };

    // Step Assist Logic: check if we can step up 1 block
    const tryMoveWithStep = (dx, dz) => {
        const nextX = player.pos.x + dx;
        const nextZ = player.pos.z + dz;
        const nextFeetY = player.pos.y - EYE_HEIGHT;

        if (!isCollidingAt(nextX, nextFeetY, nextZ)) {
            player.pos.x = nextX;
            player.pos.z = nextZ;
            return true;
        } else {
            // Try stepping up
            if (player.onGround && !isCollidingAt(nextX, nextFeetY + 1.1, nextZ)) {
                player.pos.x = nextX;
                player.pos.z = nextZ;
                player.pos.y += 1.0;
                return true;
            }
        }
        return false;
    };

    tryMoveWithStep(player.vel.x * dt, 0);
    tryMoveWithStep(0, player.vel.z * dt);

    // 2. Vertical Movement & Gravity
    if (player.isFlying) {
        // Smooth flying friction
        player.vel.y *= Math.pow(0.9, dt * 60);
        player.pos.y += player.vel.y * dt;
    } else if (player.isInWater) {
        // Swimming physics
        const buoyancy = 20.0;
        player.vel.y -= (player.gravity - buoyancy) * dt;
        player.vel.y *= Math.pow(0.9, dt * 60); // High vertical drag in water

        // Handle swimming up/down
        if (keys[' '] || player.isJumping) {
            player.vel.y += 35 * dt; // Continuous swim upward force
        }
        
        player.pos.y += player.vel.y * dt;
    } else {
        player.vel.y -= player.gravity * dt;
        player.pos.y += player.vel.y * dt;
    }
    
    const currentFeetY = player.pos.y - EYE_HEIGHT;
    
    // Check floor collision
    let hitFloor = false;
    for (let pt of checkPoints) {
        const b = getBlockAt(player.pos.x + pt.x, currentFeetY, player.pos.z + pt.z);
        if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
            hitFloor = true;
            break;
        }
    }

    if (hitFloor && player.vel.y <= 0 && !player.isFlying) {
        player.pos.y = Math.floor(currentFeetY) + 1 + EYE_HEIGHT;
        player.vel.y = 0;
        player.onGround = true;
    } else {
        player.onGround = false;
    }

    // Check ceiling collision
    const headY = currentFeetY + PLAYER_HEIGHT;
    let hitCeiling = false;
    for (let pt of checkPoints) {
        const b = getBlockAt(player.pos.x + pt.x, headY, player.pos.z + pt.z);
        if (b !== BLOCKS.AIR && b !== BLOCKS.WATER) {
            hitCeiling = true;
            break;
        }
    }
    if (hitCeiling && player.vel.y > 0) {
        player.vel.y = 0;
    }

    // Respawn if falling out of world
    if (player.pos.y < -10) {
        player.pos.set(8, 50, 8);
        player.vel.set(0, 0, 0);
    }

    camera.position.copy(player.pos);
    // Apply Bobbing
    const bob = Math.sin(player.bobbing) * player.bobbingAmount;
    camera.position.y += bob;
    
    camera.quaternion.setFromEuler(player.rot);

    // Update coordinates display (rounded)
    if (coordsDiv && SHOW_COORDS) {
        const px = player.pos.x;
        const py = player.pos.y;
        coordsDiv.innerText = `x: ${px.toFixed(2)}, y: ${py.toFixed(2)}`;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(update);
}

/* -------------------------
   Multiplayer Demo Support
   ------------------------- */

// Peer visualization
let room = null;
const peerMeshes = new Map();

// Create a simple flat grass world for the multiplayer demo (creative)
function resetWorldFlat(sizeChunks = 2) {
    // Clear data
    for (const mesh of chunkMeshes.values()) {
        scene.remove(mesh);
        mesh.children.forEach(child => { if (child.dispose) child.dispose(); });
    }
    chunkMeshes.clear();
    chunks.clear();

    // Fill chunks in a small area with flat grass/dirt and a shallow water border
    const SEA_LEVEL = 35;
    const baseHeight = SEA_LEVEL + 1;

    const pCX = Math.floor(player.pos.x / CHUNK_SIZE);
    const pCZ = Math.floor(player.pos.z / CHUNK_SIZE);

    for (let cx = pCX - sizeChunks; cx <= pCX + sizeChunks; cx++) {
        for (let cz = pCZ - sizeChunks; cz <= pCZ + sizeChunks; cz++) {
            const data = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
            for (let x = 0; x < CHUNK_SIZE; x++) {
                for (let z = 0; z < CHUNK_SIZE; z++) {
                    for (let y = 0; y < CHUNK_HEIGHT; y++) {
                        const idx = (y * CHUNK_SIZE * CHUNK_SIZE) + (z * CHUNK_SIZE) + x;
                        if (y === 0) data[idx] = BLOCKS.BEDROCK;
                        else if (y < baseHeight - 1) data[idx] = BLOCKS.DIRT;
                        else if (y === baseHeight - 1) data[idx] = BLOCKS.GRASS;
                        else data[idx] = BLOCKS.AIR;
                    }
                }
            }
            chunks.set(getChunkKey(cx, cz), data);
            buildChunkMesh(cx, cz);
        }
    }
    // Rebuild neighbor meshes and ensure camera/player start over flat
    player.pos.set((pCX * CHUNK_SIZE) + CHUNK_SIZE/2, baseHeight + EYE_HEIGHT, (pCZ * CHUNK_SIZE) + CHUNK_SIZE/2);
    player.vel.set(0,0,0);
    updateChunks();
}

// Lightweight multiplayer demo using WebsimSocket (demo only)
async function startMultiplayerDemo() {
    try {
        // Prepare flat creative world and ensure creative inventory
        resetWorldFlat(2);
        player.gameMode = 'creative';
        btnGamemode.innerText = "Game Mode: Creative";
        player.inventory = player.inventory.map((v,i)=> v || { id: BLOCKS.GRASS, count: 64 });
        updateHotbarUI();
        startGame();

        if (typeof WebsimSocket === 'undefined') {
            console.warn('WebsimSocket not available — demo will show local-only player only.');
            return;
        }

        room = new WebsimSocket();
        await room.initialize();

        // Broadcast small presence (pos & rot & selectedSlot)
        function sendPresence() {
            room.updatePresence({
                pos: { x: player.pos.x, y: player.pos.y, z: player.pos.z },
                rot: { x: player.rot.x, y: player.rot.y, z: player.rot.z },
                selectedSlot: player.selectedSlot
            });
        }
        sendPresence(); // initial
        const presenceInterval = setInterval(sendPresence, 120);

        // Create or update peer cubes in scene
        room.subscribePresence((allPresence) => {
            for (const id in allPresence) {
                if (id === room.clientId) continue; // skip self
                const p = allPresence[id];
                if (!peerMeshes.has(id)) {
                    const g = new THREE.BoxGeometry(0.8, 1.8, 0.8);
                    const mat = new THREE.MeshStandardMaterial({ color: (Math.random()*0xffffff)|0, emissive: 0x000000 });
                    const mesh = new THREE.Mesh(g, mat);
                    // Peer avatars do not cast shadows in the scene
                    mesh.castShadow = false;
                    scene.add(mesh);
                    peerMeshes.set(id, mesh);
                }
                const mesh = peerMeshes.get(id);
                if (p && p.pos) {
                    mesh.position.set(p.pos.x, p.pos.y - 0.9, p.pos.z); // center to feet
                }
                if (p && p.rot) {
                    mesh.rotation.y = p.rot.y || 0;
                    mesh.rotation.x = p.rot.x || 0;
                }
            }
            // Remove disconnected peers
            for (const id of Array.from(peerMeshes.keys())) {
                if (!allPresence[id]) {
                    const m = peerMeshes.get(id);
                    scene.remove(m);
                    if (m.geometry) m.geometry.dispose();
                    if (m.material && m.material.dispose) m.material.dispose();
                    peerMeshes.delete(id);
                }
            }
        });

        // Clean up on disconnect when leaving demo (if applicable)
        room.onmessage = (ev) => {
            if (ev && ev.data && ev.data.type === 'disconnected') {
                const rid = ev.data.clientId;
                if (peerMeshes.has(rid)) {
                    const m = peerMeshes.get(rid);
                    scene.remove(m);
                    peerMeshes.delete(rid);
                }
            }
        };

        // Expose a simple leave function (not wired to UI but available)
        startMultiplayerDemo.stop = async () => {
            clearInterval(presenceInterval);
            if (room) {
                try { room.send({ type: 'leaving' }); } catch(e){}
                room = null;
            }
            for (const [id, m] of peerMeshes) {
                scene.remove(m);
                if (m.geometry) m.geometry.dispose();
                if (m.material && m.material.dispose) m.material.dispose();
            }
            peerMeshes.clear();
        };

    } catch (e) {
        console.warn('Multiplayer demo initialization failed:', e);
    }
}

// Wire the Multiplayer button (demo)
const btnMultiplayer = document.getElementById('btn-multiplayer');
if (btnMultiplayer) {
    addMenuListener(btnMultiplayer, () => {
        // Launch the simple demo
        startMultiplayerDemo();
    });
}

/* -------------------------
   End Multiplayer Demo
   ------------------------- */

// Initialize world before starting
updateChunks();
requestAnimationFrame(update);

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});