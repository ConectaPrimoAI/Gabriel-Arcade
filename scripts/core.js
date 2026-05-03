
'use strict';

// ══════════════════════════════════════════════════════
//  SONS & VOZ
// ══════════════════════════════════════════════════════
let _ac = null;
function getAC(){
  if(!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  if(_ac.state === 'suspended') _ac.resume();
  return _ac;
}

function playBeep(freq=440, dur=.12, type='sine', vol=.4, delay=0){
  try{
    const ac=getAC();
    const o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0, ac.currentTime+delay);
    g.gain.linearRampToValueAtTime(vol, ac.currentTime+delay+.01);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime+delay+dur);
    o.connect(g); g.connect(ac.destination);
    o.start(ac.currentTime+delay);
    o.stop(ac.currentTime+delay+dur+.05);
  } catch(e){}
}

function playScanSound(){
  // Ascending scan beeps
  [400,500,650,800,1000].forEach((f,i) => playBeep(f,.1,'sine',.3, i*.08));
}

function playSuccessSound(){
  // Da-da-daaaa unlock
  playBeep(523,.1,'sine',.5, 0);
  playBeep(659,.1,'sine',.5, .1);
  playBeep(784,.18,'sine',.5, .2);
  playBeep(1047,.35,'sine',.5, .35);
}

function playClickSound(){
  playBeep(660,.06,'square',.2);
}

let _playedWelcome = false;
function playWelcomeVoice(){
  // Usar SpeechSynthesis com voz pt-BR mais natural e evitar duplicação
  if(!window.speechSynthesis || _playedWelcome) return;
  _playedWelcome = true;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance('Bem-vindo de volta, Gabriel! Estava te esperando. Vamos brincar!');
  utter.lang = 'pt-BR';
  // Slightly faster, natural pacing
  utter.rate = 1.15;
  utter.pitch = 1.02;
  utter.volume = 1;

  const chooseAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices() || [];
    // Prefer high-quality Google pt-BR voices, then any pt-BR voice, then any pt voice
    const pref =
      voices.find(v => /google.*pt-?br/i.test(v.name) || /pt-?br/i.test(v.name) && /google/i.test(v.name)) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt-br') && /natural|premium|google/i.test(v.name)) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt-br')) ||
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('pt')) ||
      voices[0];
    if(pref) utter.voice = pref;
    try { window.speechSynthesis.speak(utter); } catch(e){}
  };

  // If voices already loaded, speak immediately; otherwise wait for voiceschanged once
  if(window.speechSynthesis.getVoices().length > 0){
    chooseAndSpeak();
  } else {
    const onVoices = () => { chooseAndSpeak(); window.speechSynthesis.removeEventListener('voiceschanged', onVoices); };
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    // safety fallback
    setTimeout(() => { if(!utter.voice) chooseAndSpeak(); }, 600);
  }
}

// ══════════════════════════════════════════════════════
//  SCANNER (ETAPA 1)
// ══════════════════════════════════════════════════════
const touchZone = document.getElementById('touch-zone');
const scanBox   = document.getElementById('scanner-box');
const scanTxt   = document.getElementById('scan-txt');
let scanTimer;

function startScan(e){
  e.preventDefault();
  scanBox.classList.add('active-scan');
  scanTxt.textContent = 'ANALISANDO DIGITAL…';
  scanTxt.style.color = 'var(--accent)';
  playScanSound();
  scanTimer = setTimeout(accessGranted, 2000);
}
function cancelScan(){
  scanBox.classList.remove('active-scan');
  scanTxt.textContent = 'SEGURE PARA IDENTIFICAR';
  scanTxt.style.color = 'var(--primary)';
  clearTimeout(scanTimer);
}

touchZone.addEventListener('touchstart', startScan, {passive:false});
touchZone.addEventListener('mousedown',  startScan);
touchZone.addEventListener('touchend',   cancelScan);
touchZone.addEventListener('mouseup',    cancelScan);
touchZone.addEventListener('touchcancel',cancelScan);

function accessGranted(){
  playSuccessSound();
  const scanner = document.getElementById('stage-scanner');
  scanner.style.opacity = '0';
  setTimeout(()=>{
    scanner.style.display = 'none';
    const lock = document.getElementById('stage-lock');
    lock.style.display = 'flex';
    setTimeout(()=>{
      const lockObj = document.getElementById('lock-obj');
      lockObj.classList.add('show');
      setTimeout(()=>{
        lockObj.textContent = '🔓';
        lockObj.style.color = 'var(--accent)';
        playBeep(880,.15,'sine',.4);
        setTimeout(showMenu, 900);
      }, 900);
    }, 200);
  }, 500);
}

function showMenu(){
  document.getElementById('stage-lock').style.display = 'none';
  const ui = document.getElementById('main-ui');
  ui.style.display = 'flex';

  // Bot aparece e fala
  setTimeout(()=>{
    const bot = document.getElementById('biel-bot');
    const speech = document.getElementById('bot-speech');
    bot.classList.add('mini');
    speech.style.display = 'block';
    speech.textContent = 'Bem-vindo de volta, Gabriel! 🎮';

    // Dispara a voz
    setTimeout(playWelcomeVoice, 300);

    setTimeout(()=>{
      document.getElementById('frame').classList.add('show');
      // Esconde o balão depois de 5s
      setTimeout(()=>{ speech.style.display = 'none'; }, 5500);
    }, 600);
  }, 200);
}

// Stars no background do scanner
for(let i=0;i<55;i++){
  const s=document.createElement('div');s.className='star';
  const sz=Math.random()*1.8+.3;
  s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;width:${sz}px;height:${sz}px;--d:${(1.5+Math.random()*4).toFixed(1)}s;animation-delay:${(Math.random()*4).toFixed(1)}s`;
  document.body.appendChild(s);
}

// ══════════════════════════════════════════════════════
//  ENGINE ARCADE
// ══════════════════════════════════════════════════════
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');
const hud    = document.getElementById('hud');
const ctrl   = document.getElementById('ctrl');
const hbar   = document.getElementById('hbar');
let W=0, H=0;
function rsz(){
  // HiDPI canvas resizing for crisper, more professional visuals
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  W = Math.floor(window.innerWidth);
  H = Math.floor(window.innerHeight);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', rsz);

// INPUT
const K={up:0,dn:0,lt:0,rt:0,a:0,b:0};
const TAP={a:0,b:0,up:0};
const _H2={};
const BMAP={cup:'up',cleft:'lt',cdown:'dn',cright:'rt',abA:'a',abB:'b'};
for(const[id,k] of Object.entries(BMAP)){
  const el=document.getElementById(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();K[k]=1;TAP[k]=1;el.classList.add('on');},{passive:false});
  el.addEventListener('pointerup',  e=>{e.preventDefault();K[k]=0;el.classList.remove('on');},{passive:false});
  el.addEventListener('pointercancel',()=>{K[k]=0;document.getElementById(id).classList.remove('on');});
  el.addEventListener('pointerleave', ()=>{K[k]=0;document.getElementById(id).classList.remove('on');});
}
const KMAP={ArrowUp:'up',ArrowDown:'dn',ArrowLeft:'lt',ArrowRight:'rt',w:'up',s:'dn',a:'lt',d:'rt',' ':'a',z:'a',x:'b',Shift:'b'};
document.addEventListener('keydown',e=>{const k=KMAP[e.key];if(!k)return;e.preventDefault();if(!_H2[k]){K[k]=1;TAP[k]=1;_H2[k]=1;}});
document.addEventListener('keyup',  e=>{const k=KMAP[e.key];if(!k)return;K[k]=0;_H2[k]=0;});
function clrT(){TAP.a=0;TAP.b=0;TAP.up=0;}

// Catalog
const GAMES=[
  {id:'mc',       nm:'Minecraft',     ic:'⛏️', bd:'Construção 3D'},
  {id:'pacman',   nm:'Pac-Man',       ic:'👻', bd:'Fuja dos Fantasmas'},
  {id:'snake',    nm:'Snake Neon',    ic:'🐍', bd:'Cobrinha Neon'},
  {id:'tetris',   nm:'Tetris',        ic:'🧱', bd:'Encaixe Blocos'},
  {id:'space',    nm:'Space Wars',    ic:'🚀', bd:'Guerra Espacial'},
  {id:'flappy',   nm:'Flappy Bird',   ic:'🐦', bd:'Voo Infinito'},
  {id:'dino',     nm:'Dino Run',      ic:'🦕', bd:'Fuja dos Obstáculos'},
  {id:'breakout', nm:'Breakout',      ic:'🏓', bd:'Quebre os Tijolos'},
  {id:'soccer',   nm:'Futebol',       ic:'⚽', bd:'Chute ao Gol'},
  {id:'pong',     nm:'Pong',          ic:'🏸', bd:'Ping-Pong'},
  {id:'asteroids',nm:'Asteroids',     ic:'☄️', bd:'Destrua Astros'},
  {id:'platform', nm:'Jump Hero',     ic:'🦸', bd:'Aventura 2D'},
  {id:'colors',   nm:'Caça Cores',    ic:'🎨', bd:'Kids • Cores', kids:1},
  {id:'bubbles',  nm:'Estoura Bolha', ic:'🫧', bd:'Kids • Estourar', kids:1},
  {id:'fruits',   nm:'Caça Frutas',   ic:'🍎', bd:'Kids • Pegar', kids:1},
  {id:'piano',    nm:'Piano Kids',    ic:'🎹', bd:'Kids • Música', kids:1},
  {id:'draw',     nm:'Pintar',        ic:'🖌️',bd:'Kids • Desenho', kids:1},
];

const grid = document.getElementById('ggrid');
GAMES.forEach(g=>{
  const d=document.createElement('div');
  d.className='card'+(g.kids?' kid':'');
  d.innerHTML=`<div class="ci">${g.ic}</div>`;
  d.onclick=()=>{ playClickSound(); launchGame(g.id); };
  grid.appendChild(d);
});

let rafId=null, gameActive=false, score=0, curGame='';
const rnd=(a,b)=>a+Math.random()*(b-a);
const rndI=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const addPts=n=>{score+=n;};
const setHUD=s=>{hud.innerHTML=s;};


async function launchGame(id, extra){
  curGame=id;
  const game = GAMES.find(g=>g.id===id);
  document.getElementById('gload-txt').textContent='CARREGANDO '+game.nm.toUpperCase()+'…';
  
  // Simular carregamento
  document.getElementById('stage-loader').style.display='flex';
  setTimeout(() => {
    window.location.href = 'games/' + id + '.html';
  }, 1000);
}

function toMenu(){
  gameActive=false; cancelAnimationFrame(rafId);
  document.getElementById('gs').style.display='none';
  document.getElementById('mcsel').style.display='none';
  document.getElementById('main-ui').style.display='flex';
}
function goOver(){
  gameActive=false; cancelAnimationFrame(rafId);
  playBeep(200,.4,'sawtooth',.35);
  document.getElementById('gov-pts').textContent='⭐ '+score+' PTS';
  document.getElementById('gov').style.display='flex';
}
function goWin(){
  gameActive=false; cancelAnimationFrame(rafId);
  // Victory fanfare
  [523,659,784,1047].forEach((f,i)=>playBeep(f,.15,'sine',.5,i*.12));
  document.getElementById('gwin-pts').textContent='⭐ '+score+' PTS';
  document.getElementById('gwin').style.display='flex';
}
document.getElementById('menubtn').onclick=toMenu;
document.getElementById('gbtn-re').onclick=()=>{ document.getElementById('gov').style.display='none'; launchGame(curGame); };
document.getElementById('wbtn-re').onclick=()=>{ document.getElementById('gwin').style.display='none'; launchGame(curGame); };

function showCtrl(aL='A',bL='B',bShow=true){
  ctrl.style.display='flex';
  const a=document.getElementById('abA'), b=document.getElementById('abB');
  a.textContent=aL; b.textContent=bL;
  a.style.fontSize=aL.length>2?'.5rem':'1rem';
  b.style.fontSize=bL.length>2?'.5rem':'1rem';
  b.style.display=bShow?'flex':'none';
}

function mkP(arr,x,y,n,cols,spd=5){
  for(let i=0;i<n;i++) arr.push({x,y,vx:rnd(-spd,spd),vy:rnd(-spd*.8,0),life:1,col:Array.isArray(cols)?cols[rndI(0,cols.length-1)]:cols,r:rnd(2,5)});
}
function tickP(arr){
  return arr.filter(p=>{
    p.x+=p.vx; p.y+=p.vy; p.vy+=.15; p.life-=.033;
    if(p.life>0){ ctx.globalAlpha=p.life; ctx.fillStyle=p.col; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,7); ctx.fill(); ctx.globalAlpha=1; }
    return p.life>0;
  });
}
function lerpC(a,b,t){
  const p=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
  const A=p(a),B=p(b);
  return'#'+A.map((v,i)=>clamp(Math.round(v+(B[i]-v)*t),0,255).toString(16).padStart(2,'0')).join('');
}
function setScore(v){ score=v; }

// ══════════════════════════════════════════════════════
//  MC WORLD SELECT
// ══════════════════════════════════════════════════════
function openMCSelect(){
  document.getElementById('main-ui').style.display='none';
  document.getElementById('gs').style.display='block';
  document.getElementById('mcsel').style.display='flex';
  const list=document.getElementById('mcwlist');
  list.innerHTML='';
  const worlds=JSON.parse(localStorage.getItem('mc_v19')||'[]');
  worlds.forEach((w,i)=>{
    const row=document.createElement('div');
    row.style.cssText='display:flex;gap:8px;align-items:center;width:100%;justify-content:center;';
    const btn=document.createElement('button'); btn.className='mcwbtn';
    btn.innerHTML=`🌍 <b style="font-size:.56rem">${w.name}</b> <span style="color:#888;font-size:.34rem">${w.date}</span>`;
    btn.onclick=()=>launchGame('mc',{w,idx:i});
    const del=document.createElement('span'); del.className='mcwdel'; del.textContent='🗑';
    del.onclick=()=>{ worlds.splice(i,1); localStorage.setItem('mc_v19',JSON.stringify(worlds)); openMCSelect(); };
    row.appendChild(btn); row.appendChild(del); list.appendChild(row);
  });
  const nb=document.createElement('button'); nb.className='mcwbtn mcwnew'; nb.textContent='＋  CRIAR NOVO MUNDO';
  nb.onclick=()=>{
    const seed=Math.floor(Math.random()*999999);
    const nw={name:`Mundo ${worlds.length+1}`,date:new Date().toLocaleDateString('pt-BR'),seed,data:null,px:24,pz:24};
    worlds.push(nw); localStorage.setItem('mc_v19',JSON.stringify(worlds));
    launchGame('mc',{w:nw,idx:worlds.length-1});
  };
  list.appendChild(nb);
}

// ══════════════════════════════════════════════════════
//  STUB FUNCTIONS FOR GAMES (loaded from separate files)
// ══════════════════════════════════════════════════════
function gMC(extra){ console.log('MC game should be loaded from games/mc.html'); }
function gPacman(){ console.log('Pacman game should be loaded from games/pacman.html'); }
function gSnake(){ console.log('Snake game should be loaded from games/snake.html'); }
function gTetris(){ console.log('Tetris game should be loaded from games/tetris.html'); }
function gSpace(){ console.log('Space game should be loaded from games/space.html'); }
function gFlappy(){ console.log('Flappy game should be loaded from games/flappy.html'); }
function gDino(){ console.log('Dino game should be loaded from games/dino.html'); }
function gBreakout(){ console.log('Breakout game should be loaded from games/breakout.html'); }
function gSoccer(){ console.log('Soccer game should be loaded from games/soccer.html'); }
function gPong(){ console.log('Pong game should be loaded from games/pong.html'); }
function gAsteroids(){ console.log('Asteroids game should be loaded from games/asteroids.html'); }
function gPlatform(){ console.log('Platform game should be loaded from games/platform.html'); }
function gColors(){ console.log('Colors game should be loaded from games/colors.html'); }
function gBubbles(){ console.log('Bubbles game should be loaded from games/bubbles.html'); }
function gFruits(){ console.log('Fruits game should be loaded from games/fruits.html'); }
function gPiano(){ console.log('Piano game should be loaded from games/piano.html'); }
function gDraw(){ console.log('Draw game should be loaded from games/draw.html'); }

// Initialize canvas
rsz();
window.addEventListener('resize', rsz);
