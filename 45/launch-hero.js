// Readable port of the hero effect on anthropic.com/claude-fable-and-mythos-5-2 (a study; the original effect is Anthropic's).
// Pure Canvas 2D. Every magic number of the original is a field in DEFAULTS; with DEFAULTS the
// output is pixel-identical to the original (checked by _tools/parity.mjs).
//
// Pipeline per frame (rendered at P.fps, 16 by default):
//   1. black fill
//   2. atmosphere band: a pre-rendered strip (colour ramp by signed distance to a circular limb),
//      masked by a horizontal gradient (brighter near the sun, intro reveal) and added ("lighter")
//   3. hover highlight: a window of the band around the pointer, added again
//   4. sun flare ("screen"): glow sprite + 2 ray sprites counter-wobbling, leaning toward the pointer
//   5. ghosts: 3 bluish lens reflections on the sun→pointer line
//   6. grain: 256² blurred noise pattern, "overlay" at 11.5%, re-offset 16×/s
//   7. "screen" the page background over everything (lifts black to #0f0f0e)
// The sun crosses the arc once every P.period seconds, rushing behind the title.

export const ATMOSPHERE = [ // [signed px from limb (− = sky, + = planet), r, g, b]
  [-76, 0, 0, 0], [-66, 0, 0, 14], [-60, 0, 0, 46], [-54, 4, 0, 74], [-48, 11, 0, 100],
  [-42, 27, 8, 126], [-36, 50, 28, 150], [-30, 78, 60, 172], [-24, 114, 104, 197],
  [-18, 153, 148, 212], [-12, 182, 178, 222], [-6, 198, 188, 214], [0, 216, 196, 200],
  [6, 220, 188, 174], [12, 194, 144, 116], [18, 151, 77, 50], [24, 94, 12, 0],
  [30, 49, 0, 0], [36, 22, 0, 0], [42, 6, 0, 0], [50, 0, 0, 0],
];
export const FLARE = [ // [normalised radius 0..1, r, g, b]
  [0, 255, 255, 255], [0.048, 252, 250, 252], [0.095, 248, 242, 244], [0.143, 233, 216, 216],
  [0.19, 213, 186, 182], [0.238, 204, 168, 150], [0.286, 187, 145, 120], [0.333, 175, 123, 90],
  [0.381, 160, 96, 66], [0.429, 150, 76, 50], [0.476, 122, 50, 24], [0.524, 105, 32, 6],
  [0.571, 90, 18, 2], [0.619, 74, 5, 0], [0.667, 58, 0, 0], [0.714, 45, 0, 0], [0.762, 35, 0, 0],
  [0.81, 24, 0, 0], [0.857, 14, 0, 0], [0.905, 6, 0, 0], [0.952, 1, 0, 0], [1, 0, 0, 0],
];

export const DEFAULTS = {
  // timing
  period: 86,          // seconds per sun crossing
  active: 0.96,        // fraction of the period the sun is up (rest = dark gap)
  fade: 0.056,         // fraction of the period for fade in / fade out
  fps: 16,             // render rate (the original deliberately quantises time to 1/16 s)
  travelFrom: 0.05,    // sun path starts at 5% of width…
  travelSpan: 0.9,     // …and spans 90%
  startPos: 0.143,     // where on the path the sun is at t=0
  titleRush: 1.1,      // how much faster the sun moves behind the title box (0 = constant speed)
  // arc geometry
  sag: 0.074,          // arc depth as fraction of width…
  sagMaxH: 0.16,       // …capped at this fraction of height
  // atmosphere band
  atmosphere: ATMOSPHERE,
  bandSpread: 0.9,     // distance divisor (bigger = thicker band)
  bandGain: 0.9,       // colour divisor (smaller = brighter band texture)
  bandGlow: 0.9,       // overall band opacity
  sunBoost: 0.4,       // extra band brightness near the sun (base = 1 − sunBoost)
  bandNoise: 0.34,     // large-scale thickness wobble of the sky side
  bandNoiseFine: 0.1,  // fine-scale thickness wobble
  bandRes: 1600,       // max band texture width in px
  // flare
  flare: FLARE,
  flareShift: 0.91,    // G/B channels sampled at this × radius (warmer rim)
  flareBoost: 1.1,     // mid-radius brightness boost
  flareRadius: 252,    // px at 1920 wide
  ghostUnit: 150,      // px at 1920 wide; also sets the sun sink and occlusion distances
  coreStretch: 0.5,    // horizontal anamorphic stretch of the core
  rays: 16,            // random rays per sprite
  rayWidth: [0.075, 0.05], // base + random angular width (radians)
  streaks: true,       // the two extra vertical rays (up / down)
  raySeeds: [71, 113], // one ray sprite per seed
  rayWobble: 0.05,     // radians of counter-rotation between the ray sprites
  rayPulse: 0.8,       // rad/s of the alternating ray brightness
  tintBlue: 24,        // blue push in the upper half of the sprites
  tintGreen: 4,
  speckle: 0.08,       // per-pixel brightness noise in the sprites
  flicker: [0.03, 0.015],
  occludeTitle: 0.66,  // flare scale when behind the title (1 = no dimming)
  occludeToc: 0.88,    // …behind the table of contents
  // pointer
  mouseLean: 0.09,     // how far the rays lean toward the pointer (× flare radius)
  ghosts: [[-0.42, 0.22, 0.16], [0.5, 0.13, 0.2], [1.75, 0.32, 0.12]], // [pos on sun→pointer, size × ghostUnit, alpha]
  hoverBand: 0.38,     // strength of the band highlight under the pointer
  // grain
  grain: 0.115,        // overlay alpha
  grainScale: 1.2,     // pattern scale (≥600px wide; 1 below)
  // background "screened" on top (null = section background colour)
  ground: null,
};

// ── math ──────────────────────────────────────────────────────────────────────────────
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const smoothstep = (a, b, x) => smooth(clamp((x - a) / (b - a)));
const mulberry32 = (seed = 1) => {
  let e = seed >>> 0 || 1;
  return () => {
    let t = Math.imul((e = (e + 0x6d2b79f5) >>> 0) ^ (e >>> 15), 1 | e);
    return (((t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t) ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
};
const hash = (x, y, z = 0) => {
  let r = Math.imul(0 | x, 0x165667b1) ^ Math.imul(0 | y, 0x27d4eb2f) ^ Math.imul(0 | z, 0x7fffffff);
  return (((r = Math.imul(r ^ (r >>> 13), 0x4bf19f61)) ^ (r >>> 16)) >>> 0) / 0x100000000;
};
const valueNoise = (x, y, z = 0) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
  return lerp(lerp(hash(ix, iy, z), hash(ix + 1, iy, z), fx), lerp(hash(ix, iy + 1, z), hash(ix + 1, iy + 1, z), fx), fy);
};
const sampleRamp = (ramp, x, out) => {
  let i = 1;
  for (; i < ramp.length - 1 && x > ramp[i][0];) i++;
  const a = ramp[i - 1], b = ramp[i], t = clamp((x - a[0]) / (b[0] - a[0]));
  out[0] = a[1] + (b[1] - a[1]) * t;
  out[1] = a[2] + (b[2] - a[2]) * t;
  out[2] = a[3] + (b[3] - a[3]) * t;
  return out;
};
const bsearch = (arr, v) => {
  let lo = 0, hi = arr.length - 1;
  for (; hi - lo > 1;) { const m = (lo + hi) >> 1; arr[m] <= v ? (lo = m) : (hi = m); }
  return { lo, through: clamp((v - arr[lo]) / (arr[hi] - arr[lo] || 1)) };
};
const rectDist = (r, x, y) => r ? Math.hypot(Math.max(0, r.x - x, x - r.x - r.w), Math.max(0, r.y - y, y - r.y - r.h)) : 1e9;

// ── canvas helpers ────────────────────────────────────────────────────────────────────
const makeCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
};
const ctx2d = (c) => {
  const x = c.getContext('2d');
  if (!x) throw Error('launch hero: no 2D canvas to draw on');
  return x;
};
const paint = (w, h, fn) => {
  const c = makeCanvas(w, h), x = ctx2d(c), img = x.createImageData(c.width, c.height), d = img.data;
  let i = 0;
  for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) {
    const p = fn(xx, y);
    d[i++] = p[0]; d[i++] = p[1]; d[i++] = p[2]; d[i++] = p[3] ?? 255;
  }
  x.putImageData(img, 0, 0);
  return c;
};

// ── flare colour lookup (1025 rgb entries) ────────────────────────────────────────────
function buildFlareLUT(P) {
  const ramp = P.flare.map((s) => s.slice()), src = P.flare.map((s) => s.slice()), tmp = [0, 0, 0];
  for (const s of ramp) { sampleRamp(src, P.flareShift * s[0], tmp); s[2] = tmp[1]; s[3] = tmp[2]; }
  for (const s of ramp) for (let c = 1; c < 4; c++) s[c] = Math.min(255, s[c] * lerp(1, P.flareBoost, smoothstep(0.12, 0.3, s[0])));
  const lut = new Float32Array(3075);
  for (let i = 0; i <= 1024; i++) lut.set(sampleRamp(ramp, i / 1024, tmp), 3 * i);
  return lut;
}

// radius → "core" scale: the bright core is ~74–84% of the sprite's normalised radius
const core = (r) => 0.74 + (0.84 - 0.74) * smoothstep(0.08, 0.3, r);

// a sprite "field": a per-pixel distance-like value (0 centre … ≥1 outside) + two noise layers
function makeField(n, seed, fn) {
  const rnd = mulberry32(seed);
  const f = { v: new Float32Array(n * n), speck: new Int8Array(n * n), fine: new Int8Array(n * n), full: makeCanvas(n, n), low: makeCanvas(n, n), img: null };
  for (let row = 0, k = 0; row < n; row++) {
    const y = ((row + 0.5) / n) * 2 - 1;
    for (let col = 0; col < n; col++, k++) {
      f.v[k] = fn(((col + 0.5) / n) * 2 - 1, y);
      f.speck[k] = Math.round((rnd() + rnd() - 1) * 127);
      f.fine[k] = Math.round((rnd() - 0.5) * 254);
    }
  }
  return f;
}

// render a field through the flare LUT; `offset` shrinks it (used while the sun fades);
// `minus` subtracts another field's colour (rays = rays − glow, so they only add the spikes)
function renderSprite(n, field, offset, minus, target, lut, P) {
  const x = ctx2d(target);
  const img = (target === field.low && field.img) || x.createImageData(n, n);
  if (target === field.low) field.img = img;
  const d = img.data, fineAmp = minus ? 2 : 2.4;
  const tint = (v, top) => top * smoothstep(0.1, 0.3, v) * (1 - smoothstep(0.45, 0.7, v));
  for (let row = 0, k = 0, i = 0; row < n; row++) {
    const top = clamp(-(3 * (((row + 0.5) / n) * 2 - 1)));
    for (let col = 0; col < n; col++, k++, i += 4) {
      d[i + 3] = 255;
      const v = field.v[k] + offset;
      if (v >= 1) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
      let o = 3 * Math.round(1024 * v), c = tint(v, top);
      let R = lut[o], G = lut[o + 1] - P.tintGreen * c, B = lut[o + 2] + P.tintBlue * c;
      if (minus) {
        const v2 = minus.v[k] + offset;
        if (v2 < 1) {
          o = 3 * Math.round(1024 * v2); c = tint(v2, top);
          R = Math.max(0, R - lut[o]);
          G = Math.max(0, G - (lut[o + 1] - P.tintGreen * c));
          B = Math.max(0, B - (lut[o + 2] + P.tintBlue * c));
        }
      }
      const g = 1 + ((P.speckle * field.speck[k]) / 127) * (1 - G / 255);
      R *= g;
      const y = (field.fine[k] / 254) * fineAmp * clamp(R / 6);
      d[i] = R + y; d[i + 1] = G * g + y; d[i + 2] = B * g + y;
    }
  }
  x.putImageData(img, 0, 0);
}

const glowField = (P) => (x, y) => {
  const r = Math.hypot(x / (1 + P.coreStretch * (1 - smoothstep(0.08, 0.5, Math.hypot(x, y)))), y);
  return r / core(r);
};

function raysField(n, seed, P) {
  const rnd = mulberry32(seed), rays = [];
  for (let i = 0; i < P.rays; i++) rays.push([((i + 0.15 + 0.7 * rnd()) / P.rays) * 2 * Math.PI, P.rayWidth[0] + P.rayWidth[1] * rnd(), 0.5 + 0.5 * rnd()]);
  if (P.streaks) rays.push([Math.PI / 2, 0.12, 1], [-Math.PI / 2, 0.13, 0.97]);
  return makeField(n, seed + 1, (x, y) => {
    const r = Math.hypot(x, y), ang = Math.atan2(-y, x);
    let s = 0;
    for (const ray of rays) {
      let d = Math.abs(ang - ray[0]) % (2 * Math.PI);
      if (d > Math.PI) d = 2 * Math.PI - d;
      s = Math.max(s, ray[2] * Math.exp(-((d / ray[1]) ** 2)));
    }
    const wobble = 0.94 + 0.12 * valueNoise(7 * ang + 40, 3 * r, seed);
    return r / ((core(r) + (1 - core(r)) * s) * wobble);
  });
}

// cumulative time along the path; the sun spends less time behind the title box
function travelTable(width, word, P) {
  const at = new Float32Array(201);
  let acc = 0;
  for (let a = 0; a <= 200; a++) {
    at[a] = acc;
    const x = width * (P.travelFrom + (P.travelSpan * (a + 0.5)) / 200);
    acc += 1 / (0.75 + P.titleRush * (word
      ? smoothstep(word.x - 0.12 * width, word.x + 0.04 * width, x) * (1 - smoothstep(word.x + word.w - 0.04 * width, word.x + word.w + 0.12 * width, x))
      : 0));
  }
  for (let a = 0; a <= 200; a++) at[a] /= acc;
  return { at, t0: P.active * at[Math.round((200 * (P.startPos - P.travelFrom)) / P.travelSpan)] * P.period };
}

// keep the sun where it is when the travel table changes (resize / text moved)
function rephase(old, at, t, P) {
  const r = ((((t + old.t0) / P.period) % 1) + 1) % 1;
  if (r >= P.active) return old.t0;
  const a = r / P.active, { lo, through } = bsearch(old.at, a);
  const i = ((lo + through) / (old.at.length - 1)) * (at.length - 1);
  const h = Math.min(at.length - 2, Math.floor(i));
  return old.t0 + (at[h] + (i - h) * (at[h + 1] - at[h]) - a) * (P.period * P.active);
}

function arcGeometry(w, h, crest, sag, k, words) {
  const cx = w / 2, R = (cx * cx + sag * sag) / (2 * Math.max(0.5, sag));
  return {
    w, h, k, cx, crest, sag, R, words,
    yAt: (x) => crest + R - Math.sqrt(Math.max(0, R * R - (x - cx) ** 2)),
    tilt: (x) => Math.asin(clamp((x - cx) / R, -1, 1)),
  };
}

function buildScene(geo, P, caches) {
  const W = geo.w, u = clamp(W / 1920, 0.42, 1.2), rnd = mulberry32(5), tmp = [0, 0, 0];
  const z = Math.min(1, P.bandRes / (W * geo.k)) * geo.k;
  const grow = Math.max(1, P.bandSpread / 0.9); // texture margins grow with the band (1 = original)
  const y0 = Math.floor(geo.crest - 82 * u * grow);
  const y1 = Math.ceil(Math.max(geo.yAt(0), geo.yAt(W)) + 54 * u * grow);
  const sw = Math.round(W * z), sh = Math.round((y1 - y0) * z);

  const cols = new Float32Array(3 * sw);
  for (let i = 0; i < sw; i++) {
    const x = (i + 0.5) / z;
    cols[3 * i] = geo.yAt(x);
    cols[3 * i + 1] = Math.cos(geo.tilt(x)) / u;
    cols[3 * i + 2] = 1 / (0.86 + P.bandNoise * valueNoise(x / (150 * u) + 3, 0.5, 13) + P.bandNoiseFine * valueNoise(x / (37 * u), 2.5, 17));
  }
  const band = makeCanvas(sw, sh);
  {
    const x = ctx2d(band), img = x.createImageData(sw, sh), a = img.data;
    let o = 0;
    for (let row = 0; row < sh; row++) {
      const y = y0 + (row + 0.5) / z;
      for (let i = 0; i < sw; i++, o += 4) {
        let n = (y - cols[3 * i]) * cols[3 * i + 1]; // signed perpendicular distance to the limb
        if (n < 0) n *= lerp(1, cols[3 * i + 2], clamp(-n / 30));
        a[o + 3] = 255;
        n /= P.bandSpread;
        if (n < -76 || n > 50) continue;
        sampleRamp(P.atmosphere, n, tmp);
        const fall = n < 0 ? 1 - 0.3 * smoothstep(-36, -66, n) : 1 - 0.7 * smoothstep(18, 40, n);
        tmp[0] *= fall; tmp[1] *= fall; tmp[2] *= fall;
        const dither = (rnd() - 0.5) * 2.4;
        a[o] = tmp[0] / P.bandGain + dither; a[o + 1] = tmp[1] / P.bandGain + dither; a[o + 2] = tmp[2] / P.bandGain + dither;
      }
    }
    x.putImageData(img, 0, 0);
  }
  const lit = makeCanvas(sw, sh), near = makeCanvas(sw, sh);
  const Rf = P.flareRadius * clamp(W / 1920, 0.26, 1.2);
  const Rp = P.ghostUnit * clamp(W / 1920, 0.32, 1.2);

  const n = Math.round(clamp(2 * Rf * Math.min(geo.k, 1.5), 240, 400));
  if (caches.flare?.n !== n) {
    const glow = makeField(n, 5, glowField(P));
    const flare = { n, glow, rays: P.raySeeds.map((s) => raysField(n, s, P)), fallen: 0 };
    renderSprite(n, glow, 0, null, glow.full, caches.lut, P);
    for (const r of flare.rays) renderSprite(n, r, 0, glow, r.full, caches.lut, P);
    caches.flare = flare;
  }
  caches.ghost ??= paint(64, 64, (x, y) => {
    const l = (1 - smoothstep(0.25, 1, Math.hypot(x - 31.5, y - 31.5) / 32)) * 255;
    return [0.5 * l, 0.36 * l, l, 255];
  });
  caches.grain ??= (() => {
    const rnd = mulberry32(23), g = new Float32Array(65536);
    for (let i = 0; i < g.length; i++) g[i] = rnd() + rnd() + rnd() - 1.5;
    const at = (x, y) => g[((y + 256) % 256) * 256 + ((x + 256) % 256)];
    return paint(256, 256, (x, y) => {
      const v = 128 + (at(x, y) + 0.55 * (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1))) * 78;
      return [v + (rnd() - 0.5) * 18, v + (rnd() - 0.5) * 18, v + (rnd() - 0.5) * 18, 255];
    });
  })();
  const travel = travelTable(W, geo.words[0], P);
  return {
    u, band, lit, lctx: ctx2d(lit), near, nctx: ctx2d(near), z, y0, y1, sw, sh, Rf, Rp,
    flare: caches.flare, ghost: caches.ghost, grain: ctx2d(caches.grain).createPattern(caches.grain, 'repeat'),
    gs: W < 600 ? 1 : P.grainScale, at: travel.at, t0: travel.t0, lean: { x: 0, y: 0, a: 0 }, last: null,
  };
}

function drawFrame(ctx, geo, n, S, P, lut) {
  const { w: W, h: H } = geo, { u, Rf, Rp } = S;
  const mouse = geo.mouse, mx = mouse ? mouse.x : 0, my = mouse ? mouse.y : 0;
  const hover = smooth(clamp(mouse ? mouse.on : 0));
  const reset = S.last === null || n < S.last, dt = reset ? 0 : Math.min(0.1, n - S.last);
  S.last = n;

  const phase = ((((n + S.t0) / P.period) % 1) + 1) % 1;
  const prog = clamp(phase / P.active);
  const vis = phase < P.active ? smoothstep(0, P.fade, phase) * (1 - smoothstep(P.active - P.fade, P.active, phase)) : 0;
  const { lo, through } = bsearch(S.at, prog);
  const sunX = W * (P.travelFrom + (P.travelSpan * (lo + through)) / (S.at.length - 1));
  const sunY = geo.yAt(sunX) - u + (1 - vis) * 0.07 * Rp; // sinks a little while fading
  const flick = 1 + P.flicker[0] * Math.sin(0.52 * n) + P.flicker[1] * Math.sin(1.31 * n + 1);

  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  const R = geo.live ? n : 99; // intro clock (still mode = fully landed)
  const introFade = smoothstep(0.15, 1.3, R);
  const spread = (1 - (1 - clamp((R - 0.6) / 1.9)) ** 2.2) * 1.5 * W; // band reveal radius from the sun
  const flareIn = smoothstep(1.5, 3.2, R);
  const nearBand = hover * smoothstep(0.7 * H, 0.1 * H, Math.abs(my - geo.yAt(mx)));
  {
    const lc = S.lctx;
    lc.globalCompositeOperation = 'copy'; lc.drawImage(S.band, 0, 0);
    const grad = lc.createLinearGradient(0, 0, S.sw, 0);
    for (let t = 0; t <= 32; t++) {
      const x = (t / 32) * W;
      const sunLit = 1 - P.sunBoost + P.sunBoost * Math.exp(-(((x - sunX) / (0.75 * W)) ** 2));
      const intro = R >= 3.3 ? 1 : introFade * lerp(0.14, 1, 1 - smoothstep(spread - 0.6 * W, spread, Math.abs(x - sunX)));
      grad.addColorStop(t / 32, `rgba(0,0,0,${clamp(lerp(0.8, sunLit, vis) * flick * P.bandGlow * intro).toFixed(4)})`);
    }
    lc.globalCompositeOperation = 'destination-in'; lc.fillStyle = grad; lc.fillRect(0, 0, S.sw, S.sh);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(S.lit, 0, S.y0, W, S.y1 - S.y0);
    if (nearBand > 0.004) {
      const half = 0.36 * W;
      const l = Math.max(0, Math.floor((mx - half) * S.z)), r = Math.min(S.sw, Math.ceil((mx + half) * S.z));
      if (r > l) {
        const nc = S.nctx;
        nc.save(); nc.beginPath(); nc.rect(l, 0, r - l, S.sh); nc.clip();
        nc.globalCompositeOperation = 'copy'; nc.drawImage(S.lit, 0, 0);
        const g = nc.createLinearGradient((mx - half) * S.z, 0, (mx + half) * S.z, 0);
        for (let t = 0; t <= 48; t++) {
          const e = t / 48;
          g.addColorStop(e, `rgba(0,0,0,${(P.hoverBand * nearBand * (0.5 - 0.5 * Math.cos(2 * Math.PI * e)) ** 1.5).toFixed(4)})`);
        }
        nc.globalCompositeOperation = 'destination-in'; nc.fillStyle = g; nc.fillRect(l, 0, r - l, S.sh); nc.restore();
        ctx.drawImage(S.near, l, 0, r - l, S.sh, l / S.z, S.y0, (r - l) / S.z, S.y1 - S.y0);
      }
    }
  }

  const dist = Math.hypot(mx - sunX, my - sunY) || 1;
  const pull = hover * smoothstep(0, 1.5 * Rp, dist);
  const ease = reset ? 1 : 1 - Math.exp(-(4 * dt));
  const lean = S.lean;
  lean.x += (((mx - sunX) / dist) * pull * P.mouseLean * Rf - lean.x) * ease;
  lean.y += (((my - sunY) / dist) * pull * P.mouseLean * Rf - lean.y) * ease;
  lean.a += (hover * clamp((mx - sunX) / (0.5 * W), -1, 1) * 0.3 - lean.a) * ease;

  const amt = vis * flareIn;
  if (amt > 0.004) {
    const occl = Math.min(
      lerp(P.occludeTitle, 1, smoothstep(0.3 * Rp, 1.2 * Rp, rectDist(geo.words[0], sunX, sunY))),
      lerp(P.occludeToc, 1, smoothstep(0.2 * Rp, Rp, rectDist(geo.words[1], sunX, sunY))),
    );
    const r = Rf * (0.4 + 0.6 * amt) * flick * occl;
    const tilt = geo.tilt(sunX);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(sunX, sunY); ctx.rotate(tilt);
    const F = S.flare;
    const fallen = Math.round((1 - amt) ** 2.2 * 256) / 256;
    if (fallen > 0 && F.fallen !== fallen) {
      renderSprite(F.n, F.glow, fallen, null, F.glow.low, lut, P);
      for (const ray of F.rays) renderSprite(F.n, ray, fallen, F.glow, ray.low, lut, P);
      F.fallen = fallen;
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(fallen > 0 ? F.glow.low : F.glow.full, -r, -r, 2 * r, 2 * r);
    ctx.rotate(-tilt); ctx.translate(lean.x, lean.y);
    const pulse = 0.5 + 0.5 * Math.sin(P.rayPulse * n);
    for (let l = 0; l < F.rays.length; l++) {
      ctx.save();
      ctx.rotate((l % 2 ? -1 : 1) * P.rayWobble * Math.sin(0.21 * n + l) - lean.a);
      const a = r * (1 + 0.14 * pull);
      ctx.globalAlpha = occl * (0.5 + 0.5 * (l % 2 ? 1 - pulse : pulse));
      const ray = F.rays[l];
      ctx.drawImage(fallen > 0 ? ray.low : ray.full, -a, -a, 2 * a, 2 * a);
      ctx.restore();
    }
    ctx.restore(); // back to "lighter"
    if (hover > 0.004) for (const [pos, size, alpha] of P.ghosts) {
      const gr = size * Rp;
      ctx.globalAlpha = alpha * hover * amt * smoothstep(0.1 * Rp, 0.8 * Rp, dist);
      ctx.drawImage(S.ghost, sunX + (mx - sunX) * pos - gr, sunY + (my - sunY) * pos - gr, 2 * gr, 2 * gr);
    }
  }

  if (S.grain && P.grain > 0) {
    const f16 = Math.round(16 * n);
    const ox = Math.floor(256 * hash(f16, 1)), oy = Math.floor(256 * hash(f16, 2));
    const top = Math.max(0, Math.min(S.y0, sunY - 1.05 * Rf)), bot = Math.min(H, Math.max(S.y1, sunY + 1.05 * Rf));
    const f = S.gs;
    ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = P.grain;
    ctx.beginPath(); ctx.rect(0, top, W, bot - top); ctx.clip();
    ctx.scale(f, f); ctx.translate(-ox, -oy);
    ctx.fillStyle = S.grain; ctx.fillRect(ox, oy + top / f, W / f + 1, (bot - top) / f + 1);
    ctx.restore();
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = P.ground ?? geo.ground ?? '#0f0f0e'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

const minWidth = (px, w) => (window.matchMedia ? window.matchMedia(`(min-width: ${px}px)`).matches : w >= px);
const offsetOf = (el, out) => {
  out.x = 0; out.y = 0;
  for (let n = el; n instanceof HTMLElement; n = n.offsetParent) { out.x += n.offsetLeft; out.y += n.offsetTop; }
  return out;
};

// ── controller ────────────────────────────────────────────────────────────────────────
// opts: { startAt, still, params }  →  { destroy, started, params, rebuild(), setTime(t), time, playing, speed }
export function mountLaunchHero(root, opts = {}) {
  const P = { ...DEFAULTS, ...opts.params };
  const stage = root.querySelector('.stage'), name = root.querySelector('.name');
  if (!stage || !name) throw Error('launch hero: its markup is missing');
  const canvas = document.createElement('canvas'), ctx = ctx2d(canvas);
  const eyebrow = root.querySelector('.eyebrow'), contents = root.querySelector('.contents'), toc = root.querySelector('.toc') ?? contents;
  const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const startAt = Math.max(0, opts.startAt ?? 0);
  let still = reduced || !!opts.still, stillAt = reduced ? 3.2 : startAt;
  let destroyed = false, started = false;
  canvas.className = 'sky'; canvas.setAttribute('aria-hidden', 'true'); stage.prepend(canvas);

  const caches = { lut: buildFlareLUT(P), flare: null, ghost: null, grain: null };
  let hasSize = false, geo = null, scene = null, key = '', dirty = true, mouseInit = false;
  const mouse = { x: 0, y: 0, on: 0 }, rootOff = { x: 0, y: 0 }, tmp = { x: 0, y: 0 };
  const rel = (el) => (offsetOf(el, tmp), { x: tmp.x - rootOff.x, y: tmp.y - rootOff.y, w: el.offsetWidth, h: el.offsetHeight });

  // clock: elapsed = (now − tc)/1000 × speed, exactly like the original (tc shifts on pause/skip)
  let tc = 0, tO = 0, speed = 1, frozen = null;
  const elapsed = (t = performance.now()) => (frozen ?? ((t - tc) / 1000) * speed);

  function layout() {
    const W = root.offsetWidth, H = root.offsetHeight;
    if (!(hasSize = W > 0 && H > 0)) return;
    const k = Math.min(2, window.devicePixelRatio || 1);
    const cw = Math.max(1, Math.round(W * k)), ch = Math.max(1, Math.round(H * k));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    dirty = true;
    offsetOf(root, rootOff);
    // title box = tight bounds of the title text (+ eyebrow above), toc box = contents list
    const nb = rel(name), range = document.createRange();
    range.selectNodeContents(name);
    const tb = range.getBoundingClientRect(), nr = name.getBoundingClientRect();
    const sc = nr.width ? name.offsetWidth / nr.width : 1;
    const tx = nb.x + (tb.left - nr.left) * sc, tw = tb.width * sc, bottom = nb.y + nb.h;
    const top = eyebrow ? Math.min(rel(eyebrow).y, nb.y) : nb.y;
    const words = [{ x: tx - 12, y: top - 8, w: tw + 24, h: nb.y + nb.h - top + 16 }];
    const tr = toc ? rel(toc) : null;
    if (tr) words.push({ x: tr.x - 16, y: tr.y - 12, w: tr.w + 32, h: tr.h + 24 });
    const sag = Math.min(P.sag * W, P.sagMaxH * H), narrow = !minWidth(600, W);
    const crest = Math.round(contents && tr
      ? narrow ? (bottom + tr.y - 0.8 * sag) / 2 : rel(contents).y - (minWidth(1024, W) ? 104 : 92)
      : bottom + (narrow ? 60 : 80));
    const nextKey = [W, H, k, crest, Math.round(sag)].join();
    if (geo && scene && nextKey === key) {
      const same = geo.words.length === words.length && geo.words.every((r, i) => r.x === words[i].x && r.y === words[i].y && r.w === words[i].w && r.h === words[i].h);
      if (!same) {
        geo.words = words;
        const t = travelTable(geo.w, geo.words[0], P);
        scene.t0 = still || !started ? t.t0 : rephase(scene, t.at, elapsed(), P);
        scene.at = t.at;
      }
      return;
    }
    const g = arcGeometry(W, H, crest, sag, k, words);
    g.live = !still;
    const bg = getComputedStyle(root).backgroundColor;
    if (bg && !/^transparent$|^rgba\([^)]*, 0\)$/.test(bg)) g.ground = bg;
    if (!still) { if (!mouseInit) { mouse.x = W / 2; mouse.y = H / 2; mouseInit = true; } g.mouse = mouse; }
    const prev = scene;
    scene = buildScene(g, P, caches);
    if (prev && started && !still) scene.t0 = rephase(prev, scene.at, elapsed(), P);
    geo = g; key = nextKey;
  }

  let landed = false;
  function phaseUpdate(e) {
    if (!landed && (still || e >= 3.3)) { landed = true; root.setAttribute('data-hero-phase', 'landed'); }
  }

  let rootLeft = 0, rootTop = 0, visibleNow = true;
  const onScroll = () => {
    const r = root.getBoundingClientRect();
    rootLeft = r.left; rootTop = r.top; visibleNow = r.bottom > 0 && r.top < window.innerHeight;
  };

  let pointerIn = false, px = 0, py = 0, isMouse = false, pointerT = -1e9, lastMouseT = 0;
  const onPointer = (e) => { px = e.clientX - rootLeft; py = e.clientY - rootTop; pointerIn = true; pointerT = performance.now(); isMouse = e.pointerType === 'mouse'; };
  const onLeave = (e) => { if (e.pointerType === 'mouse') pointerIn = false; };
  function updateMouse(now) {
    const e = lastMouseT ? Math.min(6, ((now - lastMouseT) / 1000) * 60) : 1; // frame-rate independent easing
    lastMouseT = now;
    const k = (t) => 1 - (1 - t) ** e;
    const active = pointerIn && (isMouse || now - pointerT < 1400);
    const before = mouse.on + mouse.x + mouse.y;
    mouse.on += (+active - mouse.on) * k(0.07);
    if (pointerIn) {
      const a = mouse.on < 0.02 ? 1 : k(0.16);
      mouse.x += (px - mouse.x) * a; mouse.y += (py - mouse.y) * a;
    }
    return Math.abs(mouse.on + mouse.x + mouse.y - before) > 1e-3;
  }

  function render(t) {
    if (!hasSize || !geo || !scene) return;
    dirty = false;
    ctx.setTransform(geo.k, 0, 0, geo.k, 0, 0);
    ctx.clearRect(0, 0, geo.w, geo.h);
    ctx.save();
    drawFrame(ctx, geo, t, scene, P, caches.lut);
    ctx.restore();
  }

  let raf = 0, lastFrame = -1;
  function tick() {
    raf = requestAnimationFrame(tick);
    const now = performance.now(), e = elapsed(now);
    phaseUpdate(e);
    const moved = updateMouse(now);
    const f = Math.floor(P.fps * e);
    if (f !== lastFrame || dirty || (frozen !== null && moved)) { lastFrame = f; render(f / P.fps); }
  }

  let inView = true, ioFired = false;
  const resume = () => {
    if (raf || still || !started || !inView || document.hidden || destroyed) return;
    const t = performance.now();
    if (tO) tc += t - tO; // don't count paused time
    tO = 0;
    if (scene && frozen === null) { // never resume in the middle of a fade: jump to just after the fade-in
      const l = ((t - tc) / 1e3) * speed, ph = ((((l + scene.t0) / P.period) % 1) + 1) % 1;
      tc -= (((ph >= P.fade / 2 && ph <= P.active - P.fade / 2 ? l : l + (ph < P.fade ? P.fade - ph : 1 + P.fade - ph) * P.period) - l) * 1e3) / speed;
    }
    raf = requestAnimationFrame(tick);
  };
  const pause = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; tO = performance.now(); } };
  const leave = () => {
    if (started && !still) { const t = performance.now(); tc = Math.min(tc, t - 3300 / speed); if (frozen !== null) frozen = Math.max(frozen, 3.3); phaseUpdate(elapsed(t)); }
    pause();
  };

  const io = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver((es) => {
    ioFired = true;
    (inView = es[es.length - 1].isIntersecting) ? resume() : leave();
  });
  io?.observe(root);
  const onVis = () => (document.hidden ? leave() : resume());
  let rafLayout = 0, tLayout = 0, tFonts = 0;
  const relayout = () => { layout(); onScroll(); if (still) render(stillAt); };
  const onResize = () => {
    if (destroyed || !started) return;
    rafLayout ||= requestAnimationFrame(() => { rafLayout = 0; relayout(); });
    clearTimeout(tLayout); tLayout = setTimeout(relayout, 60);
  };
  const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
  for (const el of [root, name, contents]) el && ro?.observe(el);

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    pause(); rafLayout && cancelAnimationFrame(rafLayout); clearTimeout(tLayout); clearTimeout(tFonts);
    io?.disconnect(); ro?.disconnect();
    removeEventListener('scroll', onScroll); removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVis);
    root.removeEventListener('pointermove', onPointer); root.removeEventListener('pointerdown', onPointer); root.removeEventListener('pointerleave', onLeave);
    canvas.width = canvas.height = 0; canvas.remove();
    geo = scene = null;
    root.removeAttribute('data-hero-phase');
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVis);
  root.addEventListener('pointermove', onPointer); root.addEventListener('pointerdown', onPointer); root.addEventListener('pointerleave', onLeave);

  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  fontsReady.then(onResize);
  const startedP = Promise.race([reduced ? Promise.resolve() : fontsReady, new Promise((r) => (tFonts = setTimeout(r, 2500)))]).then(() => {
    clearTimeout(tFonts);
    if (destroyed) return;
    try {
      layout(); onScroll();
      started = true;
      tc = performance.now() - 1e3 * startAt;
      if (io && !ioFired) inView = visibleNow;
      if (!still && !inView) tc -= 3300;
      const e = elapsed();
      if (!still && e < 3.3) root.setAttribute('data-hero-phase', 'intro');
      phaseUpdate(e);
      lastFrame = Math.floor(P.fps * e);
      render(still ? stillAt : lastFrame / P.fps);
      resume();
    } catch (e) { destroy(); throw e; }
  });

  return {
    destroy, started: startedP, params: P,
    /** re-run everything after changing params (sprites, band, LUT) */
    rebuild() {
      caches.lut = buildFlareLUT(P); caches.flare = caches.ghost = caches.grain = null;
      key = ''; layout(); dirty = true;
      if (still || !raf) render(still ? stillAt : elapsed());
    },
    /** just redraw (for params only read at draw time) */
    redraw() { dirty = true; if (still || !raf) render(still ? stillAt : elapsed()); },
    setTime(t) {
      stillAt = t; tc = performance.now() - (t * 1000) / speed; if (frozen !== null) frozen = t;
      lastFrame = -1; dirty = true; if (still || !raf) render(t);
    },
    replayIntro() {
      if (still) return;
      this.setTime(0); landed = false; root.removeAttribute('data-hero-phase'); void root.offsetWidth;
      root.setAttribute('data-hero-phase', 'intro'); if (scene) scene.last = null; lastFrame = -1;
    },
    get time() { return still ? stillAt : elapsed(); },
    get playing() { return frozen === null; },
    set playing(v) {
      if (v && frozen !== null) { tc = performance.now() - (frozen * 1000) / speed; frozen = null; }
      else if (!v && frozen === null) frozen = elapsed();
    },
    get speed() { return speed; },
    set speed(v) { v = Math.max(0.05, v); const e = elapsed(); speed = v; if (frozen === null) tc = performance.now() - (e * 1000) / v; },
  };
}
