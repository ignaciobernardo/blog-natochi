// Texturas, partículas y rutinas de personajes. Todo es función pura del
// tiempo t: con prefers-reduced-motion el tiempo se congela y la escena queda
// quieta sin perder estado.
import { SP, ch } from './grid.js';
import { mirror } from './sprite.js';
import { person } from './lib.js';
import { hash2 } from './rng.js';

export const theme = { dark: false };

const COLON = ch(':');
const DOT = ch('.');
const TICK = ch("'");
const DEG = ch('°');

// ---------------------------------------------------------------- texturas
// Cada textura: (x, y) en coordenadas de mundo -> char code (SP = vacío opaco).
export const TEX = {
  // grilla de puntos densa ": : :" (sombra / luz fuerte de noche)
  dense: (x, y) => ((x + y) & 1 ? SP : COLON),
  // puntos sueltos ". . ."
  dots: (x, y) => ((y & 1) === 0 && ((x + (y & 2)) & 3) === 0 ? DOT : SP),
  // empapelado de rayas punteadas
  stripes: (x, y) => (x % 6 === 0 ? COLON : SP),
  // azulejos (baño, cocina): crucecitas en grilla
  tiles: (x, y) => (y % 3 === 1 && x % 6 === 0 ? ch('+') : y % 3 === 1 && x % 6 === 3 ? DOT : SP),
  // azulejos claros
  tilesLight: (x, y) => (y % 2 === 1 && x % 4 === 0 ? ch('+') : SP),
  // rombos punteados
  diamonds: (x, y) => ((x + y * 2) % 8 === 0 || (x - y * 2 + 64) % 8 === 0 ? DOT : SP),
  clean: () => SP,
  // tierra: puntos al azar con piedritas
  earth: (x, y) => {
    const h = hash2(x, y);
    if (h < 0.1) return DOT;
    if (h < 0.13) return COLON;
    if (h < 0.145) return TICK;
    if (h < 0.152) return DEG;
    if (h < 0.156) return ch('o');
    return SP;
  },
  // ladrillos
  brick: (x, y) => {
    if ((y & 1) === 1) return ch('_');
    return (x + (y & 2) * 2) % 8 === 0 ? ch('|') : SP;
  },
  // rayado de corte (losas y muros)
  hatch: () => ch('/'),
  hatchB: () => ch('\\'),
};

// Fondo de habitación según si la luz está prendida y el tema: de día lo
// apagado se sombrea con ": :"; de noche lo prendido "brilla" con ": :".
export function roomTex(lit, wall) {
  if (theme.dark) return lit ? TEX.dense : TEX.clean;
  return lit ? TEX[wall] || TEX.dots : TEX.dense;
}

// ---------------------------------------------------------------- poses
export const POSE = {};
for (const k of Object.keys(person)) POSE[k] = [person[k], mirror(person[k])];

const mirrors = new WeakMap();
export function flipped(s) {
  let m = mirrors.get(s);
  if (!m) {
    m = mirror(s);
    mirrors.set(s, m);
  }
  return m;
}

// Rutina: una persona que va de un lugar a otro y en cada uno hace algo.
// steps: [{ x, dur, pose: 'cook1' | ['cook1','cook2'], fps, face: 1|-1 }]
// Devuelve una función t -> { x, s } (s = sprite ya orientado).
export function routine(steps, { speed = 4, phase = 0 } = {}) {
  const segs = [];
  let T = 0;
  const n = steps.length;
  for (let i = 0; i < n; i++) {
    const a = steps[i];
    const b = steps[(i + 1) % n];
    segs.push({ k: 0, t0: T, d: a.dur, a });
    T += a.dur;
    const dist = Math.abs(b.x - a.x);
    if (n > 1 && dist > 0) {
      segs.push({ k: 1, t0: T, d: dist / speed, x0: a.x, x1: b.x });
      T += dist / speed;
    }
  }
  return (t) => {
    const u = (((t + phase) % T) + T) % T;
    let s = segs[0];
    for (let i = 0; i < segs.length; i++) {
      if (u >= segs[i].t0 && u < segs[i].t0 + segs[i].d) {
        s = segs[i];
        break;
      }
    }
    const lt = u - s.t0;
    if (s.k === 1) {
      const x = Math.round(s.x0 + ((s.x1 - s.x0) * lt) / s.d);
      const face = s.x1 > s.x0 ? 0 : 1;
      const f = Math.floor(lt * 6) & 1;
      return { x, s: POSE[f ? 'walk2' : 'walk1'][face] };
    }
    const a = s.a;
    const poses = Array.isArray(a.pose) ? a.pose : [a.pose || 'stand'];
    const f = poses[Math.floor(lt * (a.fps || 2)) % poses.length];
    const sp = POSE[f] ? POSE[f][a.face === -1 ? 1 : 0] : f;
    return { x: a.x, s: sp };
  };
}

// ---------------------------------------------------------------- partículas
const STEAM = [ch('('), ch(')'), ch('~'), ch(')')];
// vapor que sube y se mece: n filas sobre (x, y)
export function steam(g, x, y, t, n = 3, seed = 0) {
  for (let i = 0; i < n; i++) {
    const k = Math.floor(t * 2.5 + seed - i * 0.7);
    if (hash2(k, i + seed * 7) < 0.25) continue;
    const dx = Math.round(Math.sin(t * 1.7 + i * 1.3 + seed) * 0.6);
    g.put(x + dx, y - i, STEAM[(k + i) & 3]);
  }
}

// "z Z" que suben desde quien duerme
export function zzz(g, x, y, t, seed = 0) {
  const u = (t * 0.6 + seed) % 3;
  const i = Math.floor(u);
  g.put(x + i, y - i, i === 2 ? ch('Z') : ch('z'));
  if (i > 0) g.put(x + i - 1, y - i + 1, ch('z'));
}

// notas musicales que flotan
export function notes(g, x, y, t, seed = 0, n = 3) {
  for (let k = 0; k < 2; k++) {
    const u = (t * 0.8 + seed + k * 1.5) % n;
    const i = Math.floor(u);
    const dx = Math.round(Math.sin(t * 2 + k * 2 + seed) * 1.2) + k * 2;
    g.put(x + dx, y - i, (k + Math.floor(t + seed)) & 1 ? ch('♪') : ch('♫'));
  }
}

// burbujas
export function bubbles(g, x, y, t, w = 6, seed = 0) {
  for (let k = 0; k < 3; k++) {
    const u = (t * 0.7 + seed + k * 0.37) % 1;
    const i = Math.floor(u * 3);
    const xx = x + Math.floor(hash2(k, Math.floor(t * 0.7 + seed + k * 0.37)) * w);
    g.put(xx, y - i, i === 2 ? DEG : ch('o'));
  }
}

// gotas que caen de (x, y0) a y1
export function drips(g, x, y0, y1, t, rate = 1, seed = 0) {
  const len = y1 - y0 + 1;
  const u = ((t * rate + seed) % 1.4) / 1.4;
  const i = Math.floor(u * (len + 1));
  if (i < len) g.put(x, y0 + i, TICK);
  else g.put(x, y1, ch('.'));
}

// ondas de sonido ")))"
export function waves(g, x, y, t, dir = 1, seed = 0) {
  const n = 1 + (Math.floor(t * 3 + seed) % 3);
  const c = dir > 0 ? ch(')') : ch('(');
  for (let i = 0; i < n; i++) g.put(x + i * dir, y, c);
}

// luz que titila (para letreros y tubos)
export const blink = (t, rate, seed = 0, duty = 0.5) => (t * rate + seed) % 1 < duty;

// interruptor: prendida/apagada por tramos pseudoaleatorios
export function switchy(t, id, on = 0.7, period = 9) {
  const k = Math.floor(t / period + hash2(id, 3));
  return hash2(id, k) < on;
}

export const put = (g, x, y, c) => g.put(x, y, typeof c === 'number' ? c : c.charCodeAt(0));
