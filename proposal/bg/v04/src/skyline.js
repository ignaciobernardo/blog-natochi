// Capas del fondo: la ciudad de atrás (dos planos) y el cielo.
//
// Cada plano se mueve más lento que la cuadra (parallax 1/z). Están más
// simples a propósito: menos letreros, ventanas más chicas, texturas de
// puntos, y solo se ven al principio del viaje, por encima de los techos.
import { Grid, SP } from './grid.js';
import { Rng, hash2 } from './rng.js';
import * as A from './art.js';
import { Lights, Window, NeonRow } from './lights.js';

const TEX = [
  (c, r) => (c & 1 ? 0 : 58), //                        : : :
  (c, r) => (c & 1 ? 0 : 46), //                        . . .
  (c, r) => ((c + 2 * (r & 1)) % 4 === 0 ? 46 : 0), //  .   .
  (c, r) => ((c + r) % 3 === 0 ? 47 : 0), //            / / /
  (c, r) => ((c - r) % 4 === 0 ? 92 : 0), //            \ \ \
  () => 0,
];

// opts: { f, anchor, lo, hi } -> alturas para que a p=0 los techos caigan
// entre lo*R y hi*R de la pantalla
export function buildSkyline(L, dark, seed, opts) {
  const { C, R, gR, T } = L;
  const { f, anchor, lo, hi, detail } = opts;
  const rng = new Rng(seed);
  const base = gR - anchor * R + f * T;
  const hMin = Math.max(6, Math.round(base - hi * R));
  const hMax = Math.round(base - lo * R);
  const M = 8;
  const W = C + 2 * M;
  const TOP = 24;
  const G = TOP + hMax;
  const H = G + R; // los edificios siguen hacia abajo: la cuadra los tapa
  const g = new Grid(W, H);
  const lights = new Lights(dark);
  lights.grid = g;
  const out = { grid: g, lights, G, W, H, M, f, groundRow: gR - anchor * R, blinkers: [], lamps: [] };

  let x = -rng.int(0, 10);
  while (x < W) {
    const w = rng.int(detail ? 12 : 8, detail ? 24 : 18);
    let h = rng.int(hMin, hMax);
    if (rng.chance(0.08)) h = Math.round(hMax + rng.int(4, 10)); // torre que sobresale
    const D = detail ? rng.int(2, 4) : rng.int(1, 3);
    tower(g, x, w, h, D, G, H, rng, lights, dark, out, detail);
    x += w + (rng.chance(0.25) ? rng.int(2, 6) : 0);
  }
  lights.finish();
  return out;
}

function tower(g, x, w, h, D, G, H, rng, lights, dark, out, detail) {
  const y0 = G - h;
  const x1 = x + w - 1;
  // más lejos, más liviano: menos tramas
  const tex = detail ? TEX[rng.pick([1, 2, 2, 5])] : TEX[rng.pick([2, 5, 5])];
  // costado
  for (let j = 1; j <= D; j++) {
    for (let row = y0 - j + 1; row < H; row++) g.put(x1 + j, row, (row + j) % 3 === 0 ? 47 : SP);
    g.put(x1 + j, y0 - j, 47);
  }
  for (let row = y0 - D + 1; row < H; row++) g.put(x1 + D + 1, row, 124);
  // techo
  for (let j = 0; j < D; j++) {
    const row = y0 - 1 - j;
    for (let c = x + 1 + j; c <= x1 + 1 + j; c++) g.put(c, row, c === x + 1 + j || c === x1 + 1 + j ? 47 : j === 0 ? 95 : detail && (c + j) % 2 === 0 ? 46 : SP);
  }
  g.hline(x + 1 + D, x1 + D, y0 - 1 - D, '_');
  // fachada
  for (let row = y0; row < H; row++)
    for (let c = x; c <= x1; c++) g.put(c, row, c === x || c === x1 ? 124 : tex(c - x, row) || SP);
  // ventanas chicas en grilla
  const iw = detail ? 2 : 1;
  const pitch = detail ? 4 : 3;
  const fh = detail ? 3 : 2;
  // ventanas: en el plano medio trama ▒ / nada; en el lejano puntos
  const opts = detail ? { off: dark ? 32 : 46, inside: false } : { on: 58, off: dark ? 32 : 46, inside: false };
  for (let fy = y0 + 2; fy < H - 1; fy += fh) {
    for (let c = x + 2; c + iw < x1; c += pitch) {
      const seed = (x * 7919 + fy * 31 + c) | 0;
      const Lw = lights.add(new Window(c, fy, iw, 1, seed, dark, opts));
      for (let k = 0; k < iw; k++) g.tag[fy * g.w + c + k] = Lw.id;
    }
  }
  // cosas en el techo
  const roofY = y0 - 1;
  const r = rng.next();
  if (detail && r < 0.35 && w >= 10) {
    const s = rng.chance(0.5) ? A.TANK : A.TANK_SMALL;
    g.spr(s, x + 2 + rng.int(0, Math.max(0, w - s.w - 2)) + D - 1, roofY - D + 1 - s.h + 1);
  } else if (r < 0.6) {
    // antena con luz roja (titila de noche)
    const ax = x + 2 + rng.int(0, w - 4) + 1;
    const ah = rng.int(3, 8);
    for (let k = 1; k <= ah; k++) g.put(ax, roofY - k, 124);
    g.put(ax - 1, roofY - Math.ceil(ah / 2), 45);
    g.put(ax + 1, roofY - Math.ceil(ah / 2), 45);
    out.blinkers.push({ x: ax, y: roofY - ah - 1, seed: ax * 13 + ah });
  } else if (detail && r < 0.8 && w >= 16) {
    // cartel luminoso en la azotea
    const text = rng.pick(['HOTEL', 'BANCO', 'SEGUROS', 'LA ESTRELLA', 'GALERIA', 'RADIO', 'CERVEZA']);
    if (text.length + 2 <= w) {
      const sx = x + 1 + D + ((w - text.length) >> 1);
      const sy = roofY - D - 2;
      g.put(sx - 1, sy + 1, 124);
      g.put(sx + text.length, sy + 1, 124);
      const N = lights.add(new NeonRow(sx, sy, text, rng.int(1, 1e6), dark));
      for (let k = 0; k < text.length; k++) g.tag[sy * g.w + sx + k] = N.id;
    }
  } else if (r < 0.9) {
    // remate escalonado
    const cw = Math.max(3, (w >> 1) - 1);
    const cx = x + ((w - cw) >> 1) + D;
    const ch = rng.int(2, 5);
    for (let row = roofY - D - ch + 1; row <= roofY - D; row++)
      for (let c = cx; c < cx + cw; c++) g.put(c, row, c === cx || c === cx + cw - 1 ? 124 : SP);
    g.hline(cx + 1, cx + cw - 2, roofY - D - ch, '_');
  }
}

// --- cielo -----------------------------------------------------------------------
// Nubes de lluvia en bandas, y la cordillera medio borrada atrás.
export function buildSky(L, dark, seed) {
  const { C, R, gR, T } = L;
  const rng = new Rng(seed);
  const f = 0.12;
  const M = 6;
  const W = C + 2 * M;
  const H = R + Math.ceil(f * T) + 4;
  const g = new Grid(W, H);
  // de día el cielo está nublado parejo: una trama rala de puntos (gris)
  if (!dark)
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if ((c + 3 * r) % 7 === 0 && r % 2 === 0) g.put(c, r, 46);
  // cordillera: línea de cumbres con nieve punteada
  const base = Math.round(H * 0.62);
  let y = base - rng.int(4, 8);
  const ridge = new Int16Array(W);
  for (let c = 0; c < W; c++) {
    y += rng.chance(0.5) ? (rng.chance(0.5) ? -1 : 1) : 0;
    y = Math.max(base - 14, Math.min(base - 2, y));
    ridge[c] = y;
  }
  for (let c = 1; c < W; c++) {
    const a = ridge[c - 1];
    const b = ridge[c];
    g.put(c, Math.min(a, b), b < a ? 47 : b > a ? 92 : 95);
    for (let row = Math.min(a, b) + 1; row < H; row++) {
      const depth = row - Math.min(a, b);
      // nieve arriba (puntos densos), roca más abajo (puntos ralos)
      const ch = depth < 3 ? ((c + row) % 2 === 0 ? 46 : SP) : (c + 2 * row) % 6 === 0 ? 46 : SP;
      g.put(c, row, ch);
    }
  }
  // bandas de nubes: líneas ~ y bordes .-'
  const clouds = [];
  for (let i = 0; i < Math.ceil(W / 22); i++) {
    clouds.push({ x: rng.int(-10, W), y: rng.int(1, Math.round(H * 0.35)), w: rng.int(14, 34) });
  }
  for (const cl of clouds) cloud(g, cl.x, cl.y, cl.w, rng, dark);
  return { grid: g, f, W, H, M };
}

function cloud(g, x, y, w, rng, dark) {
  // contorno abombado arriba y base recta con flecos de lluvia
  const bumps = [];
  let c = x;
  while (c < x + w) {
    const bw = rng.int(4, 8);
    bumps.push([c, bw]);
    c += bw;
  }
  for (const [bx, bw] of bumps) {
    const s = bw >= 6 ? ".-'" + '¯'.repeat(bw - 6) + "'-." : ".-'-.".slice(0, bw);
    for (let k = 0; k < s.length; k++) g.put(bx + k, y, s.charCodeAt(k));
  }
  // cuerpo con trama horizontal
  for (let row = y + 1; row <= y + 2; row++)
    for (let k = x; k < c; k++) g.put(k, row, row === y + 2 ? 95 : (k + row) % 3 === 0 ? 126 : SP);
  g.put(x - 1, y + 1, 40);
  g.put(x - 1, y + 2, 40);
  g.put(c, y + 1, 41);
  g.put(c, y + 2, 41);
}
