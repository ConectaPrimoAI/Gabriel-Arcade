
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
, 50); });
  gl.style.display='none';
  gameActive=true; score=0;

  const map={
    mc:()=>gMC(extra), pacman:gPacman, snake:gSnake, tetris:gTetris,
    space:gSpace, flappy:gFlappy, dino:gDino, breakout:gBreakout,
    soccer:gSoccer, pong:gPong, asteroids:gAsteroids, platform:gPlatform,
    colors:gColors, bubbles:gBubbles, fruits:gFruits, piano:gPiano, draw:gDraw
  };
  map[id]();
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
//  TODOS OS JOGOS DO V19 (INTEGRADOS ABAIXO)
// ══════════════════════════════════════════════════════

// ═══ MINECRAFT ═══
  function gen(seed){let s=(seed||54321)>>>0;const nr=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/0x100000000;};const w=Array.from({length:WY},()=>Array.from({length:WZ},()=>new Uint8Array(WX)));for(let z=0;z<WZ;z++)for(let x=0;x<WX;x++){const ht=clamp(Math.floor(7+Math.sin(x*.28)*2+Math.cos(z*.22)*2+Math.sin((x+z)*.15)*1.5+nr()*2.5),4,14);for(let y=0;y<WY;y++){if(y<ht-4)w[y][z][x]=3;else if(y<ht-1)w[y][z][x]=2;else if(y===ht-1)w[y][z][x]=ht<8?4:1;if(y<ht-2){const r=nr();if(r<.008)w[y][z][x]=10;else if(r<.02)w[y][z][x]=9;else if(r<.06)w[y][z][x]=8;else if(r<.12)w[y][z][x]=7;}}if(ht<8)for(let y=ht;y<8;y++)w[y][z][x]=12;if(w[ht-1][z][x]===1&&nr()<.07&&x>3&&x<WX-4&&z>3&&z<WZ-4){const th=3+Math.floor(nr()*2);for(let i=0;i<th&&ht+i<WY;i++)w[ht+i][z][x]=5;for(let lz=-2;lz<=2;lz++)for(let lx=-2;lx<=2;lx++)for(let ly=th-2;ly<=th&&ht+ly<WY;ly++){const nx=x+lx,nz=z+lz,ny=ht+ly;if(nx>=0&&nx<WX&&nz>=0&&nz<WZ&&ny>=0&&!w[ny][nz][nx])w[ny][nz][nx]=6;}}}return w;}
  if(extra?.w?.data&&extra.w.data.length>0){const flat=extra.w.data;world=Array.from({length:WY},(_,y)=>Array.from({length:WZ},(_,z)=>{const o=y*WZ*WX+z*WX;return new Uint8Array(flat.slice(o,o+WX));}));}else world=gen(extra?.w?.seed);
  const gb=(x,y,z)=>{if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ)return 0;return world[y][z][x];};
  const sb=(x,y,z,id)=>{if(x<0||x>=WX||y<0||y>=WY||z<0||z>=WZ)return;world[y][z][x]=id;save();};
  const surf=(tx,tz)=>{for(let y=WY-1;y>=0;y--)if(gb(tx,y,tz)&&gb(tx,y,tz)!==12)return y;return 4;};
  const spx=extra?.w?.px??Math.floor(WX/2),spz=extra?.w?.pz??Math.floor(WZ/2);
  const pl={tx:clamp(spx,0,WX-1),tz:clamp(spz,0,WZ-1),ty:0,mcd:0};
  pl.ty=surf(pl.tx,pl.tz)+1;
  let selIdx=0,modeBreak=false,camX=pl.tx,camZ=pl.tz,frame=0,parts=[],dayT=0;
  const TS=clamp(Math.floor(Math.min(W,H)/15),22,40);
  function iso(wx,wy,wz){return{sx:Math.round(W/2+(wx-camX)*TS-(wz-camZ)*TS),sy:Math.round(H/2+(wx-camX)*TS*.5+(wz-camZ)*TS*.5-wy*TS*.75)};}
  function drawIsoBlock(bx,by,bz){const id=gb(bx,by,bz);if(!id)return;const def=BLK[id];if(!def)return;const al=def.a||1;const c0=iso(bx,by+1,bz),c1=iso(bx+1,by+1,bz),c2=iso(bx+1,by+1,bz+1),c3=iso(bx,by+1,bz+1),c5=iso(bx+1,by,bz),c6=iso(bx+1,by,bz+1),c7=iso(bx,by,bz+1);if(c2.sx<-4||c0.sx>W+4||c0.sy<-4||c6.sy>H+4)return;ctx.globalAlpha=al;if(!gb(bx,by+1,bz)||((BLK[gb(bx,by+1,bz)]?.a??1)<1)){ctx.fillStyle=def.T;ctx.beginPath();ctx.moveTo(c0.sx,c0.sy);ctx.lineTo(c1.sx,c1.sy);ctx.lineTo(c2.sx,c2.sy);ctx.lineTo(c3.sx,c3.sy);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.5;ctx.stroke();}if(!gb(bx+1,by,bz)||((BLK[gb(bx+1,by,bz)]?.a??1)<1)){ctx.fillStyle=def.S;ctx.beginPath();ctx.moveTo(c1.sx,c1.sy);ctx.lineTo(c5.sx,c5.sy);ctx.lineTo(c6.sx,c6.sy);ctx.lineTo(c2.sx,c2.sy);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.5;ctx.stroke();}if(!gb(bx,by,bz+1)||((BLK[gb(bx,by,bz+1)]?.a??1)<1)){ctx.fillStyle=def.D;ctx.beginPath();ctx.moveTo(c3.sx,c3.sy);ctx.lineTo(c2.sx,c2.sy);ctx.lineTo(c6.sx,c6.sy);ctx.lineTo(c7.sx,c7.sy);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.18)';ctx.lineWidth=.5;ctx.stroke();}ctx.globalAlpha=1;}
  hbar.style.display='flex';INV.forEach((bid,i)=>{const def=BLK[bid];const cv=document.createElement('canvas');cv.width=30;cv.height=30;const cx2=cv.getContext('2d');cx2.fillStyle=def.T;cx2.beginPath();cx2.moveTo(15,3);cx2.lineTo(27,9);cx2.lineTo(15,15);cx2.lineTo(3,9);cx2.closePath();cx2.fill();cx2.fillStyle=def.S;cx2.beginPath();cx2.moveTo(27,9);cx2.lineTo(27,23);cx2.lineTo(15,29);cx2.lineTo(15,15);cx2.closePath();cx2.fill();cx2.fillStyle=def.D;cx2.beginPath();cx2.moveTo(3,9);cx2.lineTo(15,15);cx2.lineTo(15,29);cx2.lineTo(3,23);cx2.closePath();cx2.fill();const s=document.createElement('div');s.className='hs'+(i===0?' on':'');s.appendChild(cv);const lbl=document.createElement('span');lbl.textContent=def.n.slice(0,5);s.appendChild(lbl);s.onclick=()=>{selIdx=i;document.querySelectorAll('.hs').forEach((sl,j)=>sl.classList.toggle('on',j===i));};hbar.appendChild(s);});
  document.getElementById('abB').addEventListener('pointerdown',e=>{e.preventDefault();modeBreak=!modeBreak;document.getElementById('abB').textContent=modeBreak?'💥':'🧱';document.getElementById('abB').style.background=modeBreak?'rgba(255,80,80,.45)':'rgba(255,80,80,.18)';},{passive:false});
  canvas.addEventListener('pointerdown',e=>{if(e.target!==canvas)return;const tx=e.clientX,ty2=e.clientY;let best=null,bestD=9999;for(let dy=-2;dy<=3;dy++)for(let dz=-5;dz<=5;dz++)for(let dx=-5;dx<=5;dx++){const bx=pl.tx+dx,by=pl.ty+dy,bz=pl.tz+dz;if(!gb(bx,by,bz))continue;const{sx,sy}=iso(bx+.5,by+.6,bz+.5);const d=Math.hypot(tx-sx,ty2-sy);if(d<bestD&&d<TS*2.8){bestD=d;best={bx,by,bz};}}if(!best)return;if(modeBreak){const def=BLK[gb(best.bx,best.by,best.bz)];sb(best.bx,best.by,best.bz,0);mkP(parts,tx,ty2,10,[def?.T||'#888',def?.S||'#666']);}else{const ns=[[0,1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,-1,0]];for(const[nx,ny,nz]of ns){const px=best.bx+nx,py=best.by+ny,pz=best.bz+nz;if(px<0||px>=WX||py<0||py>=WY||pz<0||pz>=WZ)continue;if(!gb(px,py,pz)&&!(px===pl.tx&&pz===pl.tz&&Math.abs(py-pl.ty)<=1)){sb(px,py,pz,INV[selIdx]);mkP(parts,tx,ty2,8,[BLK[INV[selIdx]].T,'#fff']);break;}}}});
  document.getElementById('menubtn').onclick=()=>{save();toMenu();};
  function loop(){rafId=requestAnimationFrame(loop);if(!gameActive)return;frame++;dayT=(frame*.00012)%1;const day=Math.sin(dayT*Math.PI*2)*.5+.5;pl.mcd=Math.max(0,pl.mcd-1);if(pl.mcd===0){let mx=0,mz=0;if(K.up)mz=-1;else if(K.dn)mz=1;if(K.lt)mx=-1;else if(K.rt)mx=1;if(mx||mz){const nx=clamp(pl.tx+mx,0,WX-1),nz=clamp(pl.tz+mz,0,WZ-1);const ahead=gb(nx,pl.ty,nz),above=gb(nx,pl.ty+1,nz);if(!ahead||ahead===12){pl.tx=nx;pl.tz=nz;pl.ty=surf(pl.tx,pl.tz)+1;}else if(!above){pl.tx=nx;pl.tz=nz;pl.ty++;}pl.mcd=6;}}if(TAP.a&&pl.ty>0)pl.ty=Math.max(surf(pl.tx,pl.tz)+1,pl.ty-1);clrT();camX=lerp(camX,pl.tx,.1);camZ=lerp(camZ,pl.tz,.1);const sg=ctx.createLinearGradient(0,0,0,H);sg.addColorStop(0,lerpC('#050a14',day>.5?'#1a60cc':'#bb4400',Math.min(1,day*2)));sg.addColorStop(1,lerpC('#050a14',day>.5?'#87ceeb':'#ff6600',Math.min(1,day*2)));ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);const sa=dayT*Math.PI*2;const sunX=W*.5+Math.cos(sa-Math.PI*.5)*W*.55,sunY=H*.44-Math.abs(Math.sin(sa))*H*.32;ctx.shadowBlur=day>.25?32:16;ctx.shadowColor=day>.25?'#ffe566':'#aaccff';ctx.fillStyle=day>.25?'#ffe566':'#ddeeff';ctx.beginPath();ctx.arc(sunX,sunY,day>.25?16:12,0,7);ctx.fill();ctx.shadowBlur=0;for(let i=0;i<4;i++){const cx3=((i*320+frame*.35)%(W+300))-150;const cy3=H*.1+i*20;ctx.fillStyle=day>.4?'rgba(255,255,255,.5)':'rgba(80,80,120,.25)';ctx.beginPath();ctx.arc(cx3+20,cy3,24,0,7);ctx.arc(cx3+48,cy3-9,19,0,7);ctx.arc(cx3+74,cy3,21,0,7);ctx.fill();}const VR=10,cx4=Math.round(camX),cz4=Math.round(camZ);for(let y=0;y<WY;y++){for(let z=cz4+VR;z>=cz4-VR;z--){for(let x=cx4-VR;x<=cx4+VR;x++){if(x<0||x>=WX||z<0||z>=WZ)continue;const id=gb(x,y,z);if(!id)continue;const def=BLK[id];if(!def)continue;const tv=!gb(x,y+1,z)||((BLK[gb(x,y+1,z)]?.a??1)<1);const rv=!gb(x+1,y,z)||((BLK[gb(x+1,y,z)]?.a??1)<1);const lv=!gb(x,y,z+1)||((BLK[gb(x,y,z+1)]?.a??1)<1);if(tv||rv||lv)drawIsoBlock(x,y,z);}}}if(day<.35){ctx.fillStyle=`rgba(0,0,20,${.72-day/.35*.72})`;ctx.fillRect(0,0,W,H);}const{sx:psx,sy:psy}=iso(pl.tx+.5,pl.ty,pl.tz+.5);const wk=(K.lt||K.rt||K.up||K.dn)?Math.sin(frame*.28)*4:0;const ps=TS*.85;ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(psx,psy+ps*.04,ps*.35,ps*.12,0,0,7);ctx.fill();ctx.fillStyle='#3355aa';ctx.fillRect(psx-ps*.17,psy-ps*.44+wk*.5,ps*.14,ps*.44);ctx.fillRect(psx+ps*.03,psy-ps*.44-wk*.5,ps*.14,ps*.44);ctx.fillStyle='#4488cc';ctx.fillRect(psx-ps*.21,psy-ps*.85,ps*.42,ps*.43);ctx.fillStyle='#5599dd';ctx.fillRect(psx-ps*.21,psy-ps*.85,ps*.42,ps*.08);ctx.fillStyle='#4488cc';ctx.fillRect(psx-ps*.37,psy-ps*.83+wk*.3,ps*.14,ps*.34);ctx.fillRect(psx+ps*.23,psy-ps*.83-wk*.3,ps*.14,ps*.34);ctx.fillStyle='#f0c080';ctx.fillRect(psx-ps*.19,psy-ps*1.12,ps*.38,ps*.29);ctx.fillStyle='#3a2810';ctx.fillRect(psx-ps*.19,psy-ps*1.12,ps*.38,ps*.08);ctx.fillStyle='#222';ctx.fillRect(psx-ps*.11,psy-ps*.94,ps*.06,ps*.06);ctx.fillRect(psx+ps*.05,psy-ps*.94,ps*.06,ps*.06);for(const[dx,dy,dz]of[[0,0,-1],[1,0,0],[0,0,1],[-1,0,0]]){const bx=pl.tx+dx,by=pl.ty+dy-1,bz=pl.tz+dz;if(gb(bx,by,bz)&&gb(bx,by,bz)!==12){const{sx:cx5,sy:cy5}=iso(bx+.5,by+1.05,bz+.5);ctx.strokeStyle=modeBreak?'rgba(255,80,80,.9)':'rgba(255,255,80,.9)';ctx.lineWidth=2.5;ctx.setLineDash([5,3]);ctx.strokeRect(cx5-TS*.62,cy5-TS*.4,TS*1.24,TS*.8);ctx.setLineDash([]);break;}}parts=tickP(parts);const mms=3,mmW=WX/4*mms,mmH=WZ/4*mms,mmX=W-mmW-6,mmY=6;ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(mmX-2,mmY-2,mmW+4,mmH+4);for(let mz2=0;mz2<WZ;mz2+=4)for(let mx2=0;mx2<WX;mx2+=4){for(let my2=WY-1;my2>=0;my2--){const mid=gb(mx2,my2,mz2);if(mid){ctx.fillStyle=BLK[mid]?.T||'#888';ctx.fillRect(mmX+mx2/4*mms,mmY+mz2/4*mms,mms,mms);break;}}}ctx.fillStyle='#ff0';ctx.fillRect(mmX+pl.tx/4*mms-1.5,mmY+pl.tz/4*mms-1.5,3,3);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(W*.5-82,H-145,164,24);ctx.fillStyle=modeBreak?'#ff7777':'#77ff99';ctx.font='.42rem Orbitron';ctx.textAlign='center';ctx.fillText(modeBreak?'💥 QUEBRAR — TOQUE BLOCO':'🧱 COLOCAR — TOQUE BLOCO',W*.5,H-129);if(frame%240===0)save();setHUD(`${BLK[INV[selIdx]].n} ${day>.44&&day<.94?'☀️':'🌙'} Y:${pl.ty}`);}
  requestAnimationFrame(loop);
}

// ═══ PAC-MAN ═══
  function loop(){rafId=requestAnimationFrame(loop);if(!gameActive)return;frame++;if(K.up){pac.ndx=0;pac.ndy=-PSPD;}if(K.dn){pac.ndx=0;pac.ndy=PSPD;}if(K.lt){pac.ndx=-PSPD;pac.ndy=0;}if(K.rt){pac.ndx=PSPD;pac.ndy=0;}clrT();if(canGo(pac.px,pac.py,pac.ndx,pac.ndy)){pac.dx=pac.ndx;pac.dy=pac.ndy;}if(canGo(pac.px,pac.py,pac.dx,pac.dy)){pac.px+=pac.dx;pac.py+=pac.dy;}if(pac.px<OX-TS)pac.px=OX+MC*TS;if(pac.px>OX+MC*TS)pac.px=OX-TS;pac.mo+=.14;dots.forEach(d=>{if(d.eaten)return;const dpx=OX+(d.c+.5)*TS,dpy=OY+(d.r+.5)*TS;if(Math.hypot(pac.px-dpx,pac.py-dpy)<TS*.48){d.eaten=true;if(d.big){addPts(50);pwT=300;ghosts.forEach(g=>g.scared=true);}else addPts(10);}});if(pwT>0)pwT--;else ghosts.forEach(g=>{if(g.scared)g.scared=false;});if(dots.every(d=>d.eaten)){addPts(2000);dots.forEach(d=>d.eaten=false);}ghosts.forEach((g)=>{if(g.waitT>0){g.waitT--;return;}if(g.dead){const hx=OX+9.5*TS,hy=OY+9.5*TS;const ddx=hx-g.px,ddy=hy-g.py,dd=Math.hypot(ddx,ddy);if(dd<3){g.dead=false;g.scared=false;g.px=hx;g.py=hy;}else{g.px+=ddx/dd*GSPD_NORM*2;g.py+=ddy/dd*GSPD_NORM*2;}return;}const gspd=g.scared?GSPD_FEAR:GSPD_NORM;if(canGo(g.px,g.py,g.dx,g.dy)){g.px+=g.dx;g.py+=g.dy;}else{g.dx=0;g.dy=0;}if(g.px<OX-TS)g.px=OX+MC*TS;if(g.px>OX+MC*TS)g.px=OX-TS;const tc=Math.floor((g.px-OX)/TS),tr=Math.floor((g.py-OY)/TS);const{px:ctrx,py:ctry}=tileToPixel(tc,tr);if(Math.hypot(g.px-ctrx,g.py-ctry)<gspd*1.8){g.px=lerp(g.px,ctrx,.25);g.py=lerp(g.py,ctry,.25);const dirs=[[gspd,0],[-gspd,0],[0,gspd],[0,-gspd]];const valid=dirs.filter(([dx,dy])=>{if(dx===-g.dx&&dy===-g.dy)return false;return canGo(ctrx,ctry,dx,dy);});if(valid.length===0)return;if(!g.scared){valid.sort((a,b2)=>Math.hypot(ctrx+a[0]-pac.px,ctry+a[1]-pac.py)-Math.hypot(ctrx+b2[0]-pac.px,ctry+b2[1]-pac.py));[g.dx,g.dy]=valid[0];}else{valid.sort((a,b2)=>Math.hypot(ctrx+b2[0]-pac.px,ctry+b2[1]-pac.py)-Math.hypot(ctrx+a[0]-pac.px,ctry+a[1]-pac.py));[g.dx,g.dy]=valid[0];}}if(Math.hypot(g.px-pac.px,g.py-pac.py)<TS*.55){if(g.scared){g.dead=true;g.scared=false;g.waitT=60;addPts(200);}else if(!g.dead){lives--;if(lives<=0){goOver();return;}pac.px=OX+9.5*TS;pac.py=OY+15.5*TS;pac.dx=PSPD;pac.dy=0;}}});ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);for(let r=0;r<MR;r++)for(let c=0;c<MC;c++){if(M[r][c]!==1)continue;const px=OX+c*TS,py=OY+r*TS;ctx.fillStyle='#1100cc';ctx.fillRect(px,py,TS,TS);ctx.strokeStyle='#3322ee';ctx.lineWidth=1.5;ctx.strokeRect(px+1.5,py+1.5,TS-3,TS-3);}dots.forEach(d=>{if(d.eaten)return;const dpx=OX+(d.c+.5)*TS,dpy=OY+(d.r+.5)*TS;if(d.big){ctx.shadowBlur=10;ctx.shadowColor='#fff';ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(dpx,dpy,TS*.28+Math.sin(frame*.1)*1.2,0,7);ctx.fill();ctx.shadowBlur=0;}else{ctx.fillStyle='#ffddaa';ctx.beginPath();ctx.arc(dpx,dpy,2.5,0,7);ctx.fill();}});ghosts.forEach(g=>{if(g.dead)return;const gr=TS*.44;const gc2=g.scared?(pwT<80&&Math.floor(frame/7)%2?'#fff':'#0000bb'):g.col;ctx.shadowBlur=g.scared?0:10;ctx.shadowColor=g.col;ctx.fillStyle=gc2;ctx.beginPath();ctx.arc(g.px,g.py-gr*.1,gr,Math.PI,0);ctx.lineTo(g.px+gr,g.py+gr*.75);for(let i=4;i>=0;i--){const wx=g.px-gr+i*gr*.5;ctx.quadraticCurveTo(wx+gr*.25,g.py+gr*.75+(i%2?gr*.3:0),wx,g.py+gr*.75);}ctx.closePath();ctx.fill();ctx.shadowBlur=0;if(!g.scared){ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(g.px-gr*.28,g.py-gr*.1,gr*.22,gr*.3,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(g.px+gr*.28,g.py-gr*.1,gr*.22,gr*.3,0,0,7);ctx.fill();const edx=g.dx>0?gr*.12:g.dx<0?-gr*.12:0,edy=g.dy>0?gr*.12:g.dy<0?-gr*.12:0;ctx.fillStyle='#00f';ctx.beginPath();ctx.arc(g.px-gr*.28+edx,g.py-gr*.1+edy,gr*.12,0,7);ctx.fill();ctx.beginPath();ctx.arc(g.px+gr*.28+edx,g.py-gr*.1+edy,gr*.12,0,7);ctx.fill();}});const mo=Math.abs(Math.sin(pac.mo))*.32,pang=Math.atan2(pac.dy,pac.dx)||0;ctx.shadowBlur=18;ctx.shadowColor='#ffee00';ctx.fillStyle='#ffe600';ctx.beginPath();ctx.arc(pac.px,pac.py,TS*.43,pang+mo*Math.PI,pang+(2-mo)*Math.PI);ctx.lineTo(pac.px,pac.py);ctx.closePath();ctx.fill();ctx.shadowBlur=0;for(let i=0;i<lives;i++){ctx.fillStyle='#ffe600';ctx.beginPath();ctx.arc(OX+i*20+12,OY+MR*TS+14,7,.3*Math.PI,1.7*Math.PI);ctx.lineTo(OX+i*20+12,OY+MR*TS+14);ctx.fill();}setHUD(`⭐ ${score} 💛 ${lives}${pwT>0?' ⚡':''}`);}requestAnimationFrame(loop);}

// ═══ SNAKE ═══

// ═══ TETRIS ═══

// ═══ FLAPPY BIRD ═══

// ═══ DINO RUN ═══

// ═══ BREAKOUT ═══

// ═══ FUTEBOL ═══

// ═══ PONG ═══

// ═══ SPACE WARS ═══

// ═══ ASTEROIDS ═══

// ═══ JUMP HERO ═══

// ═══ KIDS: CAÇA CORES ═══

// ═══ KIDS: ESTOURA BOLHA ═══

// ═══ KIDS: CAÇA FRUTAS ═══

// ═══ KIDS: PIANO ═══

// ═══ KIDS: PINTAR ═══
