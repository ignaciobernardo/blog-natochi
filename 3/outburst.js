/* natochi.cv/3 — the meteoric outburst, redrawn every visit.
   One static plate (paper, frame, grid, constellations) and one live plate
   (the trails) that keeps writing itself from the radiant. */

const PAPER = '#68706b';
const INK = '#d5ded8';

const chart = document.getElementById('chart');
const trails = document.getElementById('trails');
const cx = chart.getContext('2d');
const tx = trails.getContext('2d');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

let W = 0, H = 0, DPR = 1;
let frame = null;          // inner chart rectangle, in css px
let radiant = { x: 0, y: 0 };

/* ---------- little helpers ---------- */

let seed = (Math.random() * 1e9) | 0;
function rnd() {                       // deterministic per load, so a redraw matches
  seed = (seed * 1664525 + 1013904223) | 0;
  return ((seed >>> 8) & 0xffffff) / 0xffffff;
}
const rr = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[(rnd() * arr.length) | 0];

// a line with a touch of hand-engraved wobble
function wobble(ctx, x1, y1, x2, y2, amp = 0.6) {
  const d = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.min(28, Math.round(d / 26)));
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const n = i === steps ? 0 : (rnd() - 0.5) * amp;
    const nx = -(y2 - y1) / d, ny = (x2 - x1) / d;
    ctx.lineTo(x1 + (x2 - x1) * t + nx * n, y1 + (y2 - y1) * t + ny * n);
  }
  ctx.stroke();
}

/* ---------- the sky ---------- */
// positions traced off the original plate, normalised inside the frame
const CONSTELLATIONS = [
  ['BOOTES', .19, .10], ['QUADRANS', .31, .08], ['DRACO', .43, .05],
  ['CYGNUS', .69, .06], ['LACERTA', .73, .11], ['CEPHEUS', .58, .12],
  ['CANES\nVENATICI', .12, .26], ['COMA\nBERENICES', .04, .31],
  ['URSA\nMINOR', .43, .22], ['URSA\nMAJOR', .32, .37],
  ['CAMELO', .48, .38], ['TARANDUS', .52, .34], ['CASSIO\nPEIA', .565, .335],
  ['PEGASUS', .87, .25], ['ANDROMEDA', .76, .33], ['HONORES', .77, .27],
  ['CUSTOS', .53, .41], ['DALUS', .50, .45], ['PERSEUS', .59, .47],
  ['LYNX', .40, .50], ['TELE\nSCOPIUM', .40, .545],
  ['TRIANGULUM', .67, .505], ['PISCES', .845, .535],
  ['MUSCA', .585, .565], ['ARIES', .68, .585], ['LEO', .10, .53],
  ['CANCER', .33, .645], ['TAURUS', .565, .625], ['AURIGA', .49, .545],
  ['CETUS', .82, .72], ['CANIS\nMINOR', .355, .70], ['CANIS\nMAJOR', .345, .93],
  ['MONOCEROS', .375, .82], ['HYDRA', .155, .81], ['ORION', .535, .755],
  ['LEPUS', .505, .935], ['SCEPTRUM', .60, .935],
  ['PSAL\nTERIUM', .665, .785], ['FLUVIUS', .675, .855], ['ERIDANUS', .695, .89],
];
const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ'];

function star(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawConstellation(ctx, cxp, cyp, spread) {
  const n = 4 + ((rnd() * 5) | 0);
  const pts = [];
  for (let i = 0; i < n; i++) {
    pts.push({
      x: cxp + rr(-spread, spread),
      y: cyp + rr(-spread * 0.7, spread * 0.7),
      r: rr(0.9, 2.4),
    });
  }
  // dotted joins, the way the plate strings its stars together
  ctx.save();
  ctx.setLineDash([1.2, 3.4]);
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = 'rgba(213,222,216,0.62)';
  for (let i = 1; i < pts.length; i++) {
    if (rnd() < 0.22) continue;
    ctx.beginPath();
    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
    ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = INK;
  for (const p of pts) {
    star(ctx, p.x, p.y, p.r);
    if (rnd() < 0.5) {
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.font = `${Math.round(spread * 0.34)}px "Times New Roman", Georgia, serif`;
      ctx.fillText(pick(GREEK), p.x + p.r + 1.5, p.y - 1.5);
      ctx.restore();
    }
  }
}

function drawLabel(ctx, text, x, y, size) {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.globalAlpha = 0.92;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${size}px "Futura", "Avenir Next Condensed", "Helvetica Neue", Arial, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(size * 0.13).toFixed(2)}px`;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + (i - (lines.length - 1) / 2) * size * 1.12);
  });
  ctx.restore();
}

/* ---------- the plate ---------- */

function drawChart() {
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.clearRect(0, 0, W, H);

  const pad = Math.max(18, Math.min(W, H) * 0.045);
  frame = { x: pad, y: pad, w: W - pad * 2, h: H - pad * 2 };
  const F = frame;
  const unit = Math.min(F.w, F.h);

  cx.strokeStyle = INK;
  cx.fillStyle = INK;
  cx.lineCap = 'round';

  // double rule around the plate
  cx.lineWidth = Math.max(1.2, unit * 0.0035);
  cx.strokeRect(F.x, F.y, F.w, F.h);
  const gap = Math.max(4, unit * 0.012);
  cx.lineWidth = Math.max(0.8, unit * 0.0018);
  cx.strokeRect(F.x + gap, F.y + gap, F.w - gap * 2, F.h - gap * 2);

  const inner = { x: F.x + gap, y: F.y + gap, w: F.w - gap * 2, h: F.h - gap * 2 };
  const P = (nx, ny) => ({ x: inner.x + nx * inner.w, y: inner.y + ny * inner.h });
  const tick = Math.round(Math.max(7, unit * 0.016));

  // coordinate rules: two verticals and one horizontal, as on the original
  cx.save();
  cx.globalAlpha = 0.8;
  cx.lineWidth = Math.max(0.7, unit * 0.0016);
  for (const nx of [0.46, 0.75]) {
    const a = P(nx, 0), b = P(nx, 1);
    wobble(cx, a.x, a.y, b.x, b.y, 0.5);
  }
  const hl = P(0, 0.505), hr = P(1, 0.505);
  wobble(cx, hl.x, hl.y, hr.x, hr.y, 0.5);
  cx.restore();

  // degree numbers along the margins
  cx.save();
  cx.fillStyle = INK;
  cx.globalAlpha = 0.85;
  cx.font = `${tick}px "Futura", "Avenir Next Condensed", Arial, sans-serif`;
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  for (let i = 0; i <= 10; i++) {
    const nx = i / 10;
    const deg = 220 - i * 16;
    const t = P(nx, 0);
    cx.fillText(String(((deg % 360) + 360) % 360), t.x, F.y - gap * 0.2 + tick * 0.2);
    const b = P(nx, 1);
    cx.fillText(String((((deg - 120) % 360) + 360) % 360), b.x, F.y + F.h + gap * 0.2 - tick * 0.2);
  }
  cx.textAlign = 'left';
  for (let i = 1; i < 6; i++) {
    const ny = i / 6;
    const l = P(0, ny);
    cx.fillText(String(180 - i * 10), F.x + gap * 0.3, l.y);
    const r = P(1, ny);
    cx.textAlign = 'right';
    cx.fillText(String(360 - i * 10), F.x + F.w - gap * 0.3, r.y);
    cx.textAlign = 'left';
  }
  // cardinal marks
  cx.textAlign = 'center';
  cx.font = `${tick * 1.5}px "Times New Roman", Georgia, serif`;
  const e = P(0.005, 0.5), w = P(0.985, 0.495), nn = P(0.46, 0.01);
  cx.fillText('E', e.x, e.y);
  cx.fillText('W', w.x, w.y);
  cx.fillText('N', nn.x, nn.y);
  cx.restore();

  // the sky itself
  const spread = unit * 0.035;
  for (const [name, nx, ny] of CONSTELLATIONS) {
    const p = P(nx, ny);
    drawConstellation(cx, p.x + spread * 0.9, p.y + spread * 0.5, spread);
    drawLabel(cx, name, p.x, p.y, Math.max(7, unit * 0.0145));
  }
  // loose field stars
  cx.fillStyle = INK;
  for (let i = 0; i < 90; i++) {
    cx.globalAlpha = rr(0.35, 0.8);
    star(cx, rr(inner.x, inner.x + inner.w), rr(inner.y, inner.y + inner.h), rr(0.6, 1.5));
  }
  cx.globalAlpha = 1;

  drawDirt(cx, inner);

  radiant = P(0.285, 0.505);
  frame = inner;
}

// press dirt: specks, hairs and a couple of scratches in the emulsion
function drawDirt(ctx, box) {
  ctx.save();
  for (let i = 0; i < 260; i++) {
    const x = rr(box.x, box.x + box.w), y = rr(box.y, box.y + box.h);
    ctx.globalAlpha = rr(0.05, 0.3);
    ctx.fillStyle = rnd() < 0.55 ? '#2b302d' : INK;
    star(ctx, x, y, rr(0.3, 1.1));
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const x = rr(box.x, box.x + box.w), y = rr(box.y, box.y + box.h);
    const a = rr(0, Math.PI * 2), len = rr(6, 40);
    ctx.globalAlpha = rr(0.04, 0.14);
    ctx.strokeStyle = rnd() < 0.5 ? '#232825' : INK;
    ctx.lineWidth = rr(0.4, 0.9);
    wobble(ctx, x, y, x + Math.cos(a) * len, y + Math.sin(a) * len, 1.4);
  }
  ctx.restore();
}

/* ---------- the outburst ---------- */

const METEORS = [];
const MAX_TRAILS = 190;

function edgeDistance(x, y, dx, dy, box) {
  let t = Infinity;
  if (dx > 0) t = Math.min(t, (box.x + box.w - x) / dx);
  if (dx < 0) t = Math.min(t, (box.x - x) / dx);
  if (dy > 0) t = Math.min(t, (box.y + box.h - y) / dy);
  if (dy < 0) t = Math.min(t, (box.y - y) / dy);
  return t;
}

function spawn() {
  const unit = Math.min(frame.w, frame.h);
  const a = rnd() * Math.PI * 2;
  const dx = Math.cos(a), dy = Math.sin(a);
  // a scatter around the radiant — real showers never converge on one point
  const ox = rr(-unit * 0.02, unit * 0.02);
  const oy = rr(-unit * 0.02, unit * 0.02);
  const x0 = radiant.x + ox + dx * rr(0, unit * 0.03);
  const y0 = radiant.y + oy + dy * rr(0, unit * 0.03);
  const maxLen = edgeDistance(x0, y0, dx, dy, frame);
  // most trails die early, a handful run the whole plate and get an arrowhead
  const roll = rnd();
  const len = roll < 0.55 ? maxLen * rr(0.1, 0.35)
            : roll < 0.8 ? maxLen * rr(0.35, 0.7)
            : maxLen * rr(0.9, 1);
  METEORS.push({
    x0, y0, dx, dy, len,
    width: roll > 0.8 ? rr(1.6, 3.1) : rr(0.6, 1.5),
    head: roll > 0.8 || (roll > 0.55 && rnd() < 0.4),
    t: 0,
    speed: rr(1.4, 3.6) / (0.4 + len / unit),
    alpha: 1,
  });
  if (METEORS.length > MAX_TRAILS) METEORS[METEORS.length - MAX_TRAILS - 1].fading = true;
}

function drawMeteor(m) {
  const l = m.len * Math.min(1, m.t);
  if (l <= 0.5) return;
  const x1 = m.x0 + m.dx * l, y1 = m.y0 + m.dy * l;
  tx.save();
  tx.globalAlpha = m.alpha;
  tx.strokeStyle = INK;
  tx.fillStyle = INK;
  tx.lineCap = 'round';
  tx.lineWidth = m.width;
  tx.beginPath();
  tx.moveTo(m.x0, m.y0);
  tx.lineTo(x1, y1);
  tx.stroke();

  if (m.head && m.t >= 1) {
    const s = 4 + m.width * 2.6;
    const a = Math.atan2(m.dy, m.dx);
    tx.beginPath();
    tx.moveTo(x1, y1);
    tx.lineTo(x1 - Math.cos(a - 0.34) * s, y1 - Math.sin(a - 0.34) * s);
    tx.lineTo(x1 - Math.cos(a) * s * 0.55, y1 - Math.sin(a) * s * 0.55);
    tx.lineTo(x1 - Math.cos(a + 0.34) * s, y1 - Math.sin(a + 0.34) * s);
    tx.closePath();
    tx.fill();
  }
  tx.restore();
}

let last = 0, acc = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;

  acc += dt;
  const rate = 0.085;                       // roughly a dozen trails a second
  while (acc > rate) { acc -= rate; spawn(); }

  tx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tx.clearRect(0, 0, W, H);
  for (let i = METEORS.length - 1; i >= 0; i--) {
    const m = METEORS[i];
    if (m.t < 1) m.t = Math.min(1, m.t + dt * m.speed);
    if (m.fading) {
      m.alpha -= dt * 0.55;
      if (m.alpha <= 0) { METEORS.splice(i, 1); continue; }
    }
    drawMeteor(m);
  }
  requestAnimationFrame(tick);
}

/* ---------- boot ---------- */

function grainTexture() {
  const n = document.createElement('canvas');
  n.width = n.height = 180;
  const g = n.getContext('2d');
  const img = g.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 112 + (Math.random() * 46 | 0);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--grain', `url(${n.toDataURL()})`);
}

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  for (const c of [chart, trails]) {
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
  }
  drawChart();
  METEORS.length = 0;
  // the plate arrives with the storm already under way
  const seeded = reduced ? 150 : 70;
  for (let i = 0; i < seeded; i++) { spawn(); METEORS[i].t = 1; }
}

grainTexture();
resize();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 200);
});

if (reduced) {
  tx.setTransform(DPR, 0, 0, DPR, 0, 0);
  for (const m of METEORS) { m.t = 1; drawMeteor(m); }
} else {
  requestAnimationFrame((t) => { last = t; tick(t); });
}
