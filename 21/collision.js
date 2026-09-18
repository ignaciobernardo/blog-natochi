/* natochi.cv/21 — event display.
   A charged particle in a uniform magnetic field travels a circle through the
   point where it was born, with a radius proportional to its momentum. That one
   fact draws the whole picture: soft particles curl into rosettes around the
   vertex, stiff ones leave almost straight and run off the screen. The rest is
   detector hits and a phosphor screen being photographed. */

const screen = document.getElementById('screen');
const ctx = screen.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// everything is drawn here first, so it can be bloomed before it is shown
const layer = document.createElement('canvas');
const lx = layer.getContext('2d');
const halo = document.createElement('canvas');
const hx = halo.getContext('2d');

let W = 0, H = 0, DPR = 1, U = 0;          // U: the scale everything is sized in
let vertex = { x: 0, y: 0 };
let axis = 0;                              // the collision axis, in radians

const CYCLE = 16;                          // seconds an event stays on screen
const GROW = 1.25;                         // seconds the tracks take to draw out
const FADE = 1.6;                          // seconds the old event takes to clear

const rr = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];

// a normal deviate, for the shape of the debris cloud
function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ---------- generating an event ---------- */

const TRACK_GOLD = ['#ffc81e', '#ffd84e', '#ffb800', '#ffe27a'];
const TRACK_PALE = ['#fff6d0', '#ffffff', '#ffeeb0'];
const HIT_BLUE = ['#6290d6', '#7aa6e4', '#537fc6', '#8db8ee'];

let tracks = [], hits = [], dots = [];

function makeTracks() {
  tracks = [];
  const n = 190;
  for (let i = 0; i < n; i++) {
    // Momentum sets the radius, and the spectrum is steeply bimodal: most
    // particles are soft and curl into the rosette around the vertex, a few are
    // stiff enough to leave almost straight and run off the screen.
    const soft = Math.random() < 0.78;
    const radius = soft ? U * rr(0.055, 0.21) : U * rr(0.60, 5.0);
    // soft ones are given enough path to close at least one loop
    const turn = soft
      ? Math.min(rr(3.4, 8.2), Math.PI * 2 * 3.2)
      : Math.min(U * rr(1.0, 2.0) / radius, Math.PI * 1.1);

    // the stiff ones remember the collision axis; the soft ones have forgotten it
    const along = Math.random() < (soft ? 0.34 : 0.78);
    const th = along
      ? axis + (Math.random() < 0.5 ? 0 : Math.PI) + gauss() * (soft ? 0.5 : 0.26)
      : Math.random() * Math.PI * 2;

    const pale = Math.random() < 0.09;
    tracks.push({
      th, radius, turn,
      q: Math.random() < 0.5 ? 1 : -1,
      color: pale ? pick(TRACK_PALE) : pick(TRACK_GOLD),
      width: pale ? rr(0.7, 1.2) : rr(0.8, 1.7),
      alpha: rr(0.62, 1),
      delay: Math.random() * 0.45,
    });
  }
}

// a point in the debris cloud: a long gaussian along the axis, a short one across
function cloud(long, short, tail) {
  let u = gauss() * long;
  const v = gauss() * short;
  if (Math.random() < tail) u *= rr(1.4, 2.6);    // the cloud has long wings
  const c = Math.cos(axis), s = Math.sin(axis);
  return { x: vertex.x + u * c - v * s, y: vertex.y + u * s + v * c };
}

function makeHits() {
  hits = [];
  const n = 8000;
  for (let i = 0; i < n; i++) {
    let p;
    if (Math.random() < 0.72) {
      p = cloud(U * 0.255, U * 0.098, 0.28);
    } else {
      // the rest sit on a track, where one actually crossed the detector
      const t = pick(tracks);
      const f = rr(0.25, 1);
      const a0 = t.th - t.q * Math.PI / 2;
      const a = a0 + t.q * t.turn * f;
      const cxp = vertex.x + t.q * t.radius * -Math.sin(t.th);
      const cyp = vertex.y + t.q * t.radius * Math.cos(t.th);
      p = {
        x: cxp + Math.cos(a) * t.radius + gauss() * U * 0.012,
        y: cyp + Math.sin(a) * t.radius + gauss() * U * 0.012,
      };
    }
    // small hits are far commoner than big ones
    const size = Math.round(U * (0.005 + 0.019 * Math.pow(Math.random(), 2.6)));
    hits.push({
      x: Math.round(p.x), y: Math.round(p.y),
      s: Math.max(2, size),
      kind: Math.random() < 0.34 ? (Math.random() < 0.5 ? 'core' : 'hollow') : 'solid',
      color: pick(HIT_BLUE),
      alpha: rr(0.78, 1),
      delay: rr(0.1, 1.5),
    });
  }
}

function makeDots() {
  dots = [];
  const n = 14000;
  for (let i = 0; i < n; i++) {
    const p = cloud(U * 0.130, U * 0.045, 0.22);
    dots.push({
      x: Math.round(p.x), y: Math.round(p.y),
      s: Math.random() < 0.55 ? 3 : 2,
      hot: Math.random() < 0.3,
      alpha: rr(0.8, 1),
      delay: rr(0, 1.1),
    });
  }
}

function newEvent() {
  axis = rr(0.46, 0.80);                 // down to the right, as in the plates
  vertex = { x: W * rr(0.42, 0.52), y: H * rr(0.42, 0.52) };
  makeTracks();
  makeHits();
  makeDots();
}

/* ---------- drawing ---------- */

function drawTrack(t, grow) {
  const g = Math.max(0, Math.min(1, (grow - t.delay) / (1 - t.delay || 1)));
  if (g <= 0) return;
  const cxp = vertex.x + t.q * t.radius * -Math.sin(t.th);
  const cyp = vertex.y + t.q * t.radius * Math.cos(t.th);
  const a0 = Math.atan2(vertex.y - cyp, vertex.x - cxp);
  lx.strokeStyle = t.color;
  lx.globalAlpha = t.alpha;
  lx.lineWidth = t.width;
  lx.beginPath();
  lx.arc(cxp, cyp, t.radius, a0, a0 + t.q * t.turn * g, t.q < 0);
  lx.stroke();
}

function drawHit(h, on) {
  const a = Math.max(0, Math.min(1, (on - h.delay) / 0.5));
  if (a <= 0) return;
  const s = h.s;
  lx.globalAlpha = h.alpha * a;
  if (h.kind === 'hollow') {
    lx.strokeStyle = h.color;
    lx.lineWidth = 1;
    lx.strokeRect(h.x - s / 2 + 0.5, h.y - s / 2 + 0.5, s - 1, s - 1);
  } else {
    lx.fillStyle = h.color;
    lx.fillRect(h.x - (s >> 1), h.y - (s >> 1), s, s);
    if (h.kind === 'core' && s >= 5) {
      const c = Math.max(2, s - 4);
      lx.fillStyle = '#e6f2ff';
      lx.globalAlpha = h.alpha * a * 0.72;
      lx.fillRect(h.x - (c >> 1), h.y - (c >> 1), c, c);
    }
  }
}

function drawDot(d, on) {
  const a = Math.max(0, Math.min(1, (on - d.delay) / 0.5));
  if (a <= 0) return;
  lx.globalAlpha = d.alpha * a;
  lx.fillStyle = d.hot ? '#ff8a3a' : '#e04434';
  lx.fillRect(d.x - (d.s >> 1), d.y - (d.s >> 1), d.s, d.s);
}

function drawCore(on) {
  const r = U * 0.09 * Math.min(1, on);
  const g = lx.createRadialGradient(vertex.x, vertex.y, 0, vertex.x, vertex.y, r);
  g.addColorStop(0, 'rgba(255,240,180,0.95)');
  g.addColorStop(0.18, 'rgba(255,150,40,0.55)');
  g.addColorStop(0.55, 'rgba(220,60,30,0.22)');
  g.addColorStop(1, 'rgba(180,40,20,0)');
  lx.globalAlpha = 1;
  lx.fillStyle = g;
  lx.beginPath();
  lx.arc(vertex.x, vertex.y, r, 0, Math.PI * 2);
  lx.fill();
}

function background() {
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, '#081069');
  g.addColorStop(0.5, '#060d67');
  g.addColorStop(1, '#03083f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function render(grow, on, fade) {
  lx.setTransform(DPR, 0, 0, DPR, 0, 0);
  lx.clearRect(0, 0, W, H);
  lx.globalCompositeOperation = 'source-over';

  for (const h of hits) drawHit(h, on);
  for (const d of dots) drawDot(d, on);
  drawCore(on);
  for (const t of tracks) drawTrack(t, grow);
  lx.globalAlpha = 1;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  background();

  ctx.globalAlpha = fade;
  // phosphor bloom: the same frame, small and blurred back up
  hx.setTransform(1, 0, 0, 1, 0, 0);
  hx.clearRect(0, 0, halo.width, halo.height);
  hx.drawImage(layer, 0, 0, halo.width, halo.height);
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = `blur(${Math.max(2, Math.round(U * 0.012))}px)`;
  ctx.globalAlpha = fade * 0.32;
  ctx.drawImage(halo, 0, 0, W, H);
  ctx.filter = 'none';

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = fade;
  ctx.drawImage(layer, 0, 0, W, H);
  ctx.globalAlpha = 1;
}

/* ---------- time ---------- */

let start = 0, wasSettled = false;
const SETTLED_AT = 2.6;          // by now every hit has faded in

function tick(now) {
  // A frame can arrive late — a backgrounded tab parks rAF for minutes — so the
  // clock is reset rather than wrapped; wrapping would drop that frame somewhere
  // random in the cycle, and a landing inside the fade shows an empty screen.
  let e = (now - start) / 1000;
  if (e >= CYCLE) { start = now; newEvent(); e = 0; wasSettled = false; }
  const grow = Math.min(1, e / GROW);
  const fade = e > CYCLE - FADE ? Math.max(0, (CYCLE - e) / FADE) : 1;
  // between the last hit lighting up and the fade, the frame is identical —
  // there is nothing to redraw, so the hold costs nothing
  const settled = grow >= 1 && e > SETTLED_AT && fade === 1;
  if (!(settled && wasSettled)) render(grow, e, fade);
  wasSettled = settled;
  requestAnimationFrame(tick);
}

/* ---------- boot ---------- */

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  U = Math.min(W, H);
  for (const c of [screen, layer]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
  }
  halo.width = Math.max(1, Math.round(W / 3));
  halo.height = Math.max(1, Math.round(H / 3));
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  newEvent();
  if (reduced) render(1, CYCLE, 1);
}

resize();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 200);
});

if (!reduced) requestAnimationFrame((now) => { start = now; tick(now); });
