/* natochi.cv/14 — expansion study.
   Nothing here is drawn. Every frame, a few thousand particles are thrown at the
   shape of an expanding bubble and counted into a float buffer; what you see is
   that density, tone-mapped. The caustics — the bright rim, the gold arc, the
   ribs in the wake — are where the geometry folds onto itself, and the grain is
   the counting noise of a render that never quite finishes converging. */

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d', { alpha: false });
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  || location.search.includes('still');

// how many passes it takes the buffer to reach its steady state, given the decay
const SETTLE = 420;

let S = 0;              // side of the square plate, in device pixels
let buf = null;         // float RGB accumulation
let img = null;         // the tone-mapped result
let t = 0;              // seconds since the burst

const SAMPLES = 9000;   // particles per frame — few and heavy, so the count
                        // noise itself is the grain, the way it is in a render
                        // that has not finished converging
const GAIN = 115000 / SAMPLES;
const DECAY = 0.988;    // how fast the buffer forgets, so it reaches a steady state

const seed = Math.floor(Math.random() * 0x7fffff);
document.getElementById('cap').textContent =
  `Expansion study [c${seed}] (${new Date().getFullYear()})`;

/* ---------- the body ---------- */
/* A solid of revolution about x: a hemisphere opening to the right, a barrel
   that tapers slightly to the left, and a shallow dome closing it off. The
   wake trails further left as a tapering tube. All in units of R. */

const X0 = 0.66;          // where the left face sits
const TAPER = 0.16;       // how much the barrel narrows towards that face
const DOME = 0.075;       // how far the face bulges left
const RF = 1 - TAPER;     // radius at the face

function rho(x) {
  if (x >= 0) return Math.sqrt(Math.max(0, 1 - x * x));
  const u = x / X0;
  return 1 - TAPER * u * u;
}

// area weights, so the three pieces are sampled in proportion to their surface
const A_CAP = Math.PI * 2;                 // hemisphere
const A_BARREL = 2 * Math.PI * 0.93 * X0;  // barrel
const A_FACE = Math.PI * RF * RF;          // face
const A_TOTAL = A_CAP + A_BARREL + A_FACE;

const rnd = Math.random;

/* ---------- accumulation ---------- */

let cxp = 0, cyp = 0, scale = 0;   // plate centre and pixels per unit R

function add(x, y, r, g, b) {
  const px = (cxp + x * scale) | 0;
  const py = (cyp + y * scale) | 0;
  if (px < 0 || py < 0 || px >= S || py >= S) return;
  const i = (py * S + px) * 3;
  buf[i] += r; buf[i + 1] += g; buf[i + 2] += b;
}

// One particle somewhere on the surface of the body, scaled by k. A shell seen
// from outside projects to a filled disc whose edge is far brighter than its
// middle, by 1/sqrt(thickness) — that limb brightening is what draws the arcs,
// so the shells are kept very thin and faint rather than biased by hand.
function surface(k, w, r, g, b) {
  const pick = rnd() * A_TOTAL;
  let x, s;
  if (pick < A_CAP) {                       // right hemisphere: uniform on the sphere
    x = rnd();
    s = Math.sqrt(1 - x * x);
  } else if (pick < A_CAP + A_BARREL) {     // barrel
    x = -rnd() * X0;
    s = rho(x);
    w *= s;                                 // circumference falls off with radius
  } else {                                  // the face, domed outwards
    const q = Math.sqrt(rnd());
    s = RF * q;
    x = -X0 - DOME * (1 - q * q);
    w *= 0.55;
  }
  const phi = rnd() * Math.PI * 2;
  add(x * k, s * Math.cos(phi) * k, r * w, g * w, b * w);
}

// a particle anywhere inside the body
function volume(k, w, r, g, b) {
  const x = -X0 + rnd() * (1 + X0);
  const s = rho(x) * Math.sqrt(rnd());
  const phi = rnd() * Math.PI * 2;
  const ww = w * rho(x);
  add(x * k, s * Math.cos(phi) * k, r * ww, g * ww, b * ww);
}

// the wake: rings of gas left behind, tapering away to the left
const WAKE_END = -1.8;
function wake(w, r, g, b) {
  // rings, so the trail is ribbed rather than smooth
  const band = rnd();
  let x = -X0 - DOME - band * (Math.abs(WAKE_END) - X0);
  const rib = Math.cos(x * 34.0) * 0.5 + 0.5;
  const f = (x + X0) / (WAKE_END + X0);                  // 0 at the body, 1 at the end
  const s = RF * (1.02 - 0.34 * f * f);
  const ww = w * (0.35 + rib * 0.65) * (1 - f * 0.55);
  const phi = rnd() * Math.PI * 2;
  const hollow = 0.86 + rnd() * 0.14;                    // a tube, not a rod
  add(x, s * hollow * Math.cos(phi), r * ww, g * ww, b * ww);
}

function emit(n, fn) { for (let i = 0; i < n; i++) fn(); }

function accumulate() {
  const N = SAMPLES;

  // the halo the blast is running into
  emit((N * 0.04) | 0, () => volume(1.25, 0.075, 0.05, 0.17, 0.45));

  // the body itself
  emit((N * 0.17) | 0, () => volume(1.0, 0.34, 0.10, 0.60, 0.54));

  // the shock: a thin bright shell, plus the older shells still visible outside
  emit((N * 0.17) | 0, () => surface(1.0 + (rnd() - 0.5) * 0.007, 2.10, 0.32, 0.92, 1.0));
  const ARCS = [[1.042, 2.60], [1.088, 1.75], [1.142, 1.15], [1.205, 0.70]];
  for (const [k, w] of ARCS) {
    emit((N * 0.04) | 0, () => surface(k + (rnd() - 0.5) * 0.0018, w, 0.14, 0.52, 1.0));
  }

  // the reverse shock, burning gold just inside the rim
  emit((N * 0.10) | 0, () => surface(0.935 + (rnd() - 0.5) * 0.0012, 1.35, 1.0, 0.68, 0.16));
  emit((N * 0.03) | 0, () => surface(0.90 + (rnd() - 0.5) * 0.005, 0.22, 1.0, 0.58, 0.10));

  // the wake
  emit((N * 0.20) | 0, () => wake(0.42, 0.07, 0.30, 0.88));

  // and the two things that set all this off
  const nSrc = Math.max(8, (260 / GAIN) | 0);
  for (let i = 0; i < nSrc; i++) {
    const src = i % 2;
    const halo = i % 5 === 0;
    const spread = halo ? 0.05 : 0.011;
    const sx = -0.115 + (rnd() - 0.5) * spread;
    const sy = (src ? 0.145 : 0.325) + (rnd() - 0.5) * spread;
    const w = halo ? 0.9 : 5.0;
    add(sx, sy, w * 0.45, w, w * 1.1);
  }
}

/* ---------- tone mapping ---------- */

// The curve is film-like — saturating, then lifted by a gamma so the faint gas
// survives — but baked into a table: a million pixels a frame is no place for
// exp() and pow().
const E = 0.0092 * GAIN * 1.55;            // exposure
const LUT_N = 4096, LUT_K = 512;           // covers accumulated density up to 8
const LUT = new Uint8Array(LUT_N);
for (let i = 0; i < LUT_N; i++) {
  LUT[i] = 255 * Math.pow(1 - Math.exp(-i / LUT_K), 0.78);
}

function present() {
  const d = img.data;
  const n = S * S;
  for (let p = 0, i = 0, j = 0; p < n; p++, i += 3, j += 4) {
    const r = buf[i], g = buf[i + 1], b = buf[i + 2];
    buf[i] = r * DECAY; buf[i + 1] = g * DECAY; buf[i + 2] = b * DECAY;
    let ir = (r * E * LUT_K) | 0; if (ir > 4095) ir = 4095;
    let ig = (g * E * LUT_K) | 0; if (ig > 4095) ig = 4095;
    let ib = (b * E * LUT_K) | 0; if (ib > 4095) ib = 4095;
    d[j] = LUT[ir]; d[j + 1] = LUT[ig]; d[j + 2] = LUT[ib];
  }
  ctx.putImageData(img, 0, 0);
}

/* ---------- time ---------- */

// the blast decelerates, Sedov-like, and all but stops
function radius() {
  return S * (0.272 + 0.058 * (1 - Math.exp(-t / 34)));
}

let last = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  t += dt;

  scale = radius();
  accumulate();
  present();
  requestAnimationFrame(tick);
}

/* ---------- boot ---------- */

function resize() {
  const side = Math.min(window.innerWidth, window.innerHeight) * 0.94;
  S = Math.max(320, Math.min(1100, Math.round(side)));
  canvas.width = canvas.height = S;
  canvas.style.width = canvas.style.height = `${Math.round(side)}px`;
  buf = new Float32Array(S * S * 3);
  img = ctx.createImageData(S, S);
  for (let j = 3; j < img.data.length; j += 4) img.data[j] = 255;
  cxp = S * 0.53;
  cyp = S * 0.5;

  if (reduced) {
    t = 180;                     // long after the blast has settled
    scale = radius();
    for (let i = 0; i < SETTLE; i++) {
      accumulate();
      for (let k = 0, n = buf.length; k < n; k++) buf[k] *= DECAY;
    }
    present();
  }
}

resize();

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 250);
});

if (!reduced) requestAnimationFrame((now) => { last = now; tick(now); });
