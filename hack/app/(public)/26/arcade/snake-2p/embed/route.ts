import { NextResponse } from 'next/server';
import { isDevelopmentEnvironment } from '@/src/lib/constants';

const FORK_URL =
  'https://github.com/platanus-hack/platanus-hack-26-argentina-arcade/fork';
const GAMES_URL = '/26/arcade';

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Platanus Hack [26] / Arcade Challenge</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
canvas{display:block;cursor:pointer}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
(function(){
'use strict';

var FORK_URL  = '${FORK_URL}';
var GAMES_URL = '${GAMES_URL}';

// ── canvas ────────────────────────────────────────────────────────────────
// Sized to fill the 1024×768 iframe exactly at 1:1 so fonts render at true px size
var CW = 1024, CH = 768;
var cv = document.getElementById('c');
var cx = cv.getContext('2d');
cv.width = CW; cv.height = CH;

function fit(){
  var s = Math.min(window.innerWidth/CW, window.innerHeight/CH);
  cv.style.width  = Math.round(CW*s)+'px';
  cv.style.height = Math.round(CH*s)+'px';
}
fit();
window.addEventListener('resize', fit);

// ── grid + player-controllable snakes ─────────────────────────────────────
var CELL = 16, COLS = 64, ROWS = 48;
var TICK_MS = 110;
var ACC = '#e1ff00';
var PULSE_MS = 2200;
var INIT_LEN = 5;
var MENU_LEFT = 0;
var MENU_RIGHT = 1;
var SN_START = {sx:53, sy:43, dx:-1};

function mkSnake(sx, sy, dx, len) {
  var s = { body:[], dir:{x:dx,y:0}, want:{x:dx,y:0}, active:true, crashed:false, crashTime:0 };
  for (var i = 0; i < len; i++) s.body.push({x:sx-i*dx, y:sy});
  return s;
}
// Single attract-mode snake lives in the bottom strip; P2 controls it.
var sn = mkSnake(SN_START.sx, SN_START.sy, SN_START.dx, INIT_LEN);
var selectedButton = MENU_LEFT;

function resetSnake(s, start) {
  s.body.length = 0;
  for (var i = 0; i < INIT_LEN; i++) s.body.push({x:start.sx-i*start.dx, y:start.sy});
  s.dir = {x:start.dx, y:0};
  s.want = {x:start.dx, y:0};
  s.active = true;
  s.crashed = false;
  s.crashTime = 0;
}

// ── fruit ─────────────────────────────────────────────────────────────────
var fruit = {x:32, y:24};
function spawnFruit() {
  var tries = 300;
  while (tries-- > 0) {
    var fx = Math.floor(Math.random() * COLS);
    var fy = Math.floor(Math.random() * ROWS);
    var ok = true;
    for (var j = 0; j < sn.body.length && ok; j++) if (sn.body[j].x===fx && sn.body[j].y===fy) ok=false;
    if (ok) { fruit.x=fx; fruit.y=fy; return; }
  }
}
spawnFruit();

function snakeTick(s) {
  if (!s.active || s.crashed) return;
  if (s.want.x !== -s.dir.x || s.want.y !== -s.dir.y) s.dir = s.want;
  var h = s.body[0];
  var newHead = {
    x: ((h.x + s.dir.x) + COLS) % COLS,
    y: ((h.y + s.dir.y) + ROWS) % ROWS,
  };
  s.body.unshift(newHead);
  if (newHead.x===fruit.x && newHead.y===fruit.y) {
    spawnFruit();
  } else {
    s.body.pop();
  }
}

function checkCollisions(ts) {
  var head = sn.body[0];
  if (sn.active && !sn.crashed) {
    for (var i = 1; i < sn.body.length; i++) {
      if (sn.body[i].x===head.x && sn.body[i].y===head.y) { sn.crashed=true; sn.crashTime=ts; break; }
    }
  }
}

function setDir(s, dx, dy) {
  if (s.crashed) return;
  s.want = {x:dx, y:dy};
}

function snakeAlpha(s, ts) {
  if (!s.crashed) return 0.5;
  var t = (ts - s.crashTime) / PULSE_MS;
  return 0.5 + 0.45 * Math.sin(t * Math.PI * 10);
}

function drawBg(ts) {
  cx.fillStyle='#000';
  cx.fillRect(0,0,CW,CH);
  cx.strokeStyle='#111100'; cx.lineWidth=0.5;
  for(var c=0;c<=COLS;c++){cx.beginPath();cx.moveTo(c*CELL,0);cx.lineTo(c*CELL,CH);cx.stroke();}
  for(var r=0;r<=ROWS;r++){cx.beginPath();cx.moveTo(0,r*CELL);cx.lineTo(CW,r*CELL);cx.stroke();}
  cx.globalAlpha = Math.max(0.05, snakeAlpha(sn, ts));
  drawSnake(sn,'#8aab00','#c4f000','#3d5200');
  cx.globalAlpha=1;
  // fruit drawn last so it always sits on top of snake bodies
  cx.shadowColor='#ff2222'; cx.shadowBlur=10;
  cx.fillStyle='#ff4444';
  cx.fillRect(fruit.x*CELL+2, fruit.y*CELL+2, CELL-4, CELL-4);
  cx.shadowBlur=0;
}

function drawSnake(s,bc,hc,tc){
  for(var i=s.body.length-1;i>=0;i--){
    var seg=s.body[i], x=seg.x*CELL, y=seg.y*CELL;
    var ratio=i/Math.max(s.body.length-1,1);
    cx.fillStyle=i===0?hc:(ratio<0.4?bc:tc);
    var pad=i===0?1:3;
    cx.fillRect(x+pad,y+pad,CELL-pad*2,CELL-pad*2);
  }
}

// ── layout constants ──────────────────────────────────────────────────────
var MID = CW/2;
var TITLE_Y = 20;
var TITLE_SZ = 56;
var BOX_X = 24, BOX_W = CW-48;
var BOX_Y = TITLE_Y + TITLE_SZ + 16;
var LH = 32, GAP = 10, PAD = 28;
var SEC_SZ = 26, TXT_SZ = 22, BTN_SZ = 20;

var PROMPT_LINES = [
  {k:'pre',  t:'en platanus hack 26 (8-10 de mayo, buenos aires) tenemos una'},
  {k:'pre',  t:'máquina de arcade. podríamos poner algún juego retro, pero mucho'},
  {k:'pre',  t:'mejor si lo podemos convertir en un desafío'},
  {k:'gap'},
  {k:'sec',  t:'MISSION'},
  {k:'text', t:'vibecodea el juego de arcade más cool'},
  {k:'gap'},
  {k:'sec',  t:'REQUIREMENTS'},
  {k:'text', t:'• usarás phaser 3 (librería para crear juegos web)'},
  {k:'text', t:'• el código de tu juego no puede pesar más de 50kb'},
  {k:'text', t:'• no puedes usar ningún asset externo, todo con código'},
  {k:'gap'},
  {k:'sec',  t:'PRIZE'},
  {k:'text', t:'• 1er lugar: $150 usd en cash y un cupo para platanus hack 26'},
  {k:'text', t:'• más popular: $150 usd en cash y un cupo para platanus hack 26'},
  {k:'gap'},
  {k:'sec',  t:'DEADLINE'},
  {k:'text', t:'• 26 de abril, 2026, 23:59 (buenos aires)'},
  {k:'callout', t:'ABIERTO A TODO EL MUNDO'},
];
var CONTENT_H = 0;
for(var _i=0;_i<PROMPT_LINES.length;_i++) CONTENT_H += PROMPT_LINES[_i].k==='gap'?GAP:LH;
var BOX_H  = CONTENT_H + PAD*2;
var BTN_Y  = BOX_Y + BOX_H + 18;
var BTN_H  = 52;
var BTN1_W = 400, BTN2_W = 270, BTN_GAP = 16;
var BTN1_X = MID - (BTN1_W+BTN2_W+BTN_GAP)/2;
var BTN2_X = BTN1_X + BTN1_W + BTN_GAP;

function MONO(px,bold){ return (bold?'bold ':'')+px+'px "Courier New",monospace'; }
function LOGO(px,w){ return w+' '+px+'px "Oxanium",sans-serif'; }
function glow(col,blur){ cx.shadowColor=col; cx.shadowBlur=blur; }
function noGlow(){ cx.shadowBlur=0; }

function drawPrompt() {
  // ── title ──
  cx.textBaseline='top'; cx.textAlign='center'; cx.fillStyle=ACC;
  cx.font=LOGO(TITLE_SZ,'700');
  cx.fillText('arcade challenge', MID, TITLE_Y);

  // ── box ──
  glow(ACC, 4);
  cx.strokeStyle=ACC; cx.lineWidth=3;
  cx.beginPath(); cx.roundRect(BOX_X, BOX_Y, BOX_W, BOX_H, 6); cx.stroke();
  noGlow();

  // ── content ──
  var tx = BOX_X + PAD + 6, ly = BOX_Y + PAD;
  cx.textAlign='left'; cx.textBaseline='top';
  for(var i=0;i<PROMPT_LINES.length;i++){
    var l=PROMPT_LINES[i];
    if(l.k==='gap'){ly+=GAP;continue;}
    if(l.k==='sec'){
      cx.font=MONO(SEC_SZ,true); cx.fillStyle=ACC;
    } else if (l.k === 'callout') {
      cx.font=MONO(TXT_SZ,true);
      var pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(performance.now() / 240));
      cx.fillStyle = 'rgba(225,255,0,' + pulse.toFixed(3) + ')';
    } else {
      cx.font=MONO(TXT_SZ,false);
      cx.fillStyle = '#e8dfc0';
    }
    if (l.k === 'callout') {
      cx.textAlign='center';
      cx.fillText(l.t, MID, ly);
      cx.textAlign='left';
    } else {
      cx.fillText(l.t, tx+(l.k==='text'?18:0), ly);
    }
    ly+=LH;
  }

  // ── buttons ──
  cx.textAlign='center'; cx.textBaseline='middle';
  var leftSelected = selectedButton === MENU_LEFT;
  var rightSelected = selectedButton === MENU_RIGHT;

  cx.fillStyle=leftSelected ? ACC : '#000';
  cx.strokeStyle=ACC; cx.lineWidth=leftSelected ? 0 : 2;
  cx.beginPath(); cx.roundRect(BTN1_X,BTN_Y,BTN1_W,BTN_H,5); cx.fill();
  if (!leftSelected) cx.stroke();
  cx.fillStyle=leftSelected ? '#000' : ACC; cx.font=MONO(BTN_SZ,true);
  cx.fillText('>> EMPEZAR CHALLENGE <<', BTN1_X+BTN1_W/2, BTN_Y+BTN_H/2);

  cx.fillStyle=rightSelected ? ACC : '#000';
  cx.strokeStyle=ACC; cx.lineWidth=rightSelected ? 0 : 2;
  cx.beginPath(); cx.roundRect(BTN2_X,BTN_Y,BTN2_W,BTN_H,5); cx.fill();
  if (!rightSelected) cx.stroke();
  cx.fillStyle=rightSelected ? '#000' : ACC; cx.font=MONO(BTN_SZ,true);
  cx.fillText('>> VER JUEGOS <<', BTN2_X+BTN2_W/2, BTN_Y+BTN_H/2);
}

function navigateMenu(direction) {
  if (direction < 0) selectedButton = MENU_LEFT;
  else if (direction > 0) selectedButton = MENU_RIGHT;
  else selectedButton = selectedButton === MENU_LEFT ? MENU_RIGHT : MENU_LEFT;
}

function activateSelectedButton() {
  window.open(selectedButton === MENU_LEFT ? FORK_URL : GAMES_URL, '_top');
}

// ── hit-test in canvas coordinates ───────────────────────────────────────
function hitTestButtons(px, py) {
  if(px>=BTN1_X&&px<=BTN1_X+BTN1_W&&py>=BTN_Y&&py<=BTN_Y+BTN_H){ selectedButton = MENU_LEFT; activateSelectedButton(); return true; }
  if(px>=BTN2_X&&px<=BTN2_X+BTN2_W&&py>=BTN_Y&&py<=BTN_Y+BTN_H){ selectedButton = MENU_RIGHT; activateSelectedButton(); return true; }
  return false;
}

// ── direct canvas click (when iframe is clickable, e.g. standalone) ──────
cv.addEventListener('click', function(e){
  var rect = cv.getBoundingClientRect();
  var sx = CW / (parseFloat(cv.style.width)||CW);
  var sy = CH / (parseFloat(cv.style.height)||CH);
  hitTestButtons((e.clientX-rect.left)*sx, (e.clientY-rect.top)*sy);
});

// ── messages from arcade cabinet ──────────────────────────────────────────
window.addEventListener('message', function(e){
  var d=e.data||{};
  // Screen click forwarded as UV (0-1) by arcade-showcase
  if(d.type==='arcade:screen-click'){
    var px = d.u * CW;
    var py = (1-d.v) * CH; // UV V is bottom-up, canvas Y is top-down
    // try both horizontal orientations in case UV is mirrored by 3D transform
    if(!hitTestButtons(px,py)) hitTestButtons(CW-px, py);
    return;
  }
  if(d.type!=='arcade:virtual-control'||!d.pressed)return;
  switch(d.controlCode){
    case 'P1_U': case 'P1_L': navigateMenu(-1); break;
    case 'P1_D': case 'P1_R': navigateMenu(1); break;
    case 'START1': case 'P1_1': case 'P1_2': case 'P1_3': case 'P1_4': case 'P1_5': case 'P1_6':
      activateSelectedButton(); break;
    case 'P2_U': setDir(sn, 0,-1); break;
    case 'P2_D': setDir(sn, 0, 1); break;
    case 'P2_L': setDir(sn,-1, 0); break;
    case 'P2_R': setDir(sn, 1, 0); break;
  }
});

// keyboard (direct / standalone)
window.addEventListener('keydown', function(e){
  if(e.repeat)return;
  switch(e.key){
    case 'w': case 'W': case 'a': case 'A': navigateMenu(-1); break;
    case 's': case 'S': case 'd': case 'D': navigateMenu(1); break;
    case 'f': case 'F': case ' ': case 'Enter': activateSelectedButton(); break;
    case 'ArrowUp':    setDir(sn, 0,-1); break;
    case 'ArrowDown':  setDir(sn, 0, 1); break;
    case 'ArrowLeft':  setDir(sn,-1, 0); break;
    case 'ArrowRight': setDir(sn, 1, 0); break;
  }
});

// ── main loop ─────────────────────────────────────────────────────────────
var last=0, ta=0;
function loop(ts){
  requestAnimationFrame(loop);
  var dt = Math.min(ts-last, 80); last=ts;
  ta+=dt;
  if(ta>=TICK_MS){ ta-=TICK_MS; snakeTick(sn); }
  checkCollisions(ts);
  if(sn.crashed && ts-sn.crashTime>PULSE_MS) resetSnake(sn, SN_START);
  drawBg(ts);
  drawPrompt();
}
document.fonts.ready.then(function(){ requestAnimationFrame(loop); });

})();
</script>
</body>
</html>`;

  const frameAncestors = isDevelopmentEnvironment
    ? 'frame-ancestors http://localhost:3000 https://hack.platan.us https://*.platan.us;'
    : 'frame-ancestors https://hack.platan.us https://*.platan.us;';

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: blob:; ${frameAncestors}`,
    },
  });
}
