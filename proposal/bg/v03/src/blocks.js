// Bloques de departamentos y oficinas a media distancia (z = 2).
//
// Cada piso son dos filas con un patrón que se repite (ventanas cuadradas,
// logias, balcones corridos, vidrio rayado, cintas). Arriba: estanques,
// antenas, letreros, una iglesia con campanario y una obra con su grúa
// torre (el carro y el gancho se mueven).
import { Canvas, SP, sprite } from './grid.js';

// patrones de piso: [fila A, fila B], se repiten con su período
const FLOORS = {
  grid: ['[] ', ': '],
  loggia: [':[]', ':  '],
  balcony: [' |¯¯|', '-|--|'],
  glass: ['/ ', '_/'],
  ribbon: ['|   ', '¯¯¯¯'],
  checker: ['[]::', '::[]'],
  slots: ['| ', '¯ '],
};

const CHURCH = sprite(String.raw`
     +
    /^\
    |[]|
  .´¯¯¯´.
 .| .-. |.
.´|( + )|´.
| | ´-´ | |
| |¯|  |¯| |
| | |  | | |
| |_|  |_| |
|  .-¯-.   |
|  | | |   |
`);

const TANK = sprite(String.raw`
 _[]_
|____|
 /  \
`);

const WATER_TOWER = sprite(String.raw`
 .--.
(____)
 |::|
 /  \
`);

const ROOF_SIGN = sprite(String.raw`
 * * * * * *
|           |
 ´|´´´´´´´|´
`);

const SIGNS = ['CERVEZA', 'SEGUROS', 'RADIO', 'HELADOS', 'PISCO', 'TÉ'];

function block(cv, rng, x, w, top, base, kind, out) {
  const [A, B] = FLOORS[kind];
  // contorno y techo
  for (let j = top + 1; j <= base; j++) {
    cv.put(x, j, 124);
    cv.put(x + w - 1, j, 124);
    for (let k = x + 1; k < x + w - 1; k++) cv.put(k, j, SP);
  }
  for (let k = x + 1; k < x + w - 1; k++) cv.put(k, top, 95);
  // pisos
  const off = rng.int(0, 3);
  for (let j = top + 2; j < base; j++) {
    const row = (j - top) % 2 === 0 ? A : B;
    for (let k = x + 2; k < x + w - 2; k++) {
      const ch = row[(k - x - 2 + off) % row.length];
      cv.put(k, j, ch);
    }
    if ((j - top) % 2 === 0 && kind !== 'glass') out.windows.push([x + 2, j, w - 4]);
  }
  for (let k = x + 1; k < x + w - 1; k++) cv.put(k, base, 95);
  // techo
  const r = rng.next();
  if (r < 0.25 && w > 7) cv.stamp(TANK, x + rng.int(1, w - 7), top - TANK.h + 1);
  else if (r < 0.4 && w > 7) cv.stamp(WATER_TOWER, x + rng.int(1, w - 7), top - WATER_TOWER.h + 1);
  else if (r < 0.6) {
    const ax = x + rng.int(2, w - 3);
    cv.put(ax, top - 1, 124);
    cv.put(ax, top - 2, 124);
    cv.put(ax, top - 3, 46);
    out.beacons.push([ax, top - 3]);
    if (w > 10) cv.text(ax - 2, top - 2, '-+-');
  } else if (r < 0.75 && w > 14) {
    const sx = x + Math.floor((w - ROOF_SIGN.w) / 2);
    cv.stamp(ROOF_SIGN, sx, top - ROOF_SIGN.h);
    const word = rng.pick(SIGNS);
    cv.text(sx + Math.floor((ROOF_SIGN.w - word.length) / 2), top - ROOF_SIGN.h + 1, word);
    out.signs.push([sx + 1, top - ROOF_SIGN.h, 6]);
  } else if (w > 8) {
    // retranqueo: un piso más chico arriba
    const w2 = w - 6;
    for (let k = x + 3; k < x + 3 + w2; k++) cv.put(k, top - 2, 95);
    cv.put(x + 3, top - 1, 124);
    cv.put(x + 2 + w2, top - 1, 124);
    for (let k = x + 4; k < x + 2 + w2; k++) cv.put(k, top - 1, (k % 3) === 0 ? 124 : SP);
    cv.put(x + 3, top, 124);
    cv.put(x + 2 + w2, top, 124);
  }
}

// obra en construcción: esqueleto de losas y pilares, andamio y la grúa
function obra(cv, rng, x, w, top, base, out) {
  for (let j = top; j <= base; j++) {
    for (let k = x; k < x + w; k++) {
      const u = k - x;
      const y = j - top;
      let ch = SP;
      if (y % 3 === 0) ch = 95;
      else if (u % 5 === 0) ch = 124;
      else if (u < 3) ch = 35; // andamio
      cv.put(k, j, ch);
    }
  }
  cv.text(x + 3, top + Math.floor((base - top) / 2), ' EN OBRA ');
  // grúa torre
  const mx = x + w - 6;
  const mTop = top - 14;
  for (let j = mTop + 1; j <= top; j++) cv.text(mx, j, (j - mTop) % 2 ? '|\\|' : '|/|');
  const jibL = mx - 22;
  const jibR = mx + 9;
  cv.text(jibL, mTop - 1, '_'.repeat(jibR - jibL));
  for (let k = jibL; k < jibR; k++) cv.put(k, mTop, (k - jibL) % 3 === 0 ? 124 : 95);
  cv.put(jibL - 1, mTop, 47);
  cv.text(mx, mTop - 2, '/^\\');
  cv.text(mx + 1, mTop - 3, '|');
  // contrapeso
  cv.text(jibR - 4, mTop + 1, '[##]');
  out.crane = { x0: jibL + 2, x1: mx - 3, y: mTop + 1, hookMax: top + 4 - mTop };
  // la cabina
  cv.text(mx + 3, mTop + 1, '[]');
}

export function buildBlocks(rng, { w = 420, h = 30 } = {}) {
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  const out = { windows: [], beacons: [], signs: [], crane: null, cranex: 0 };
  const mid = Math.floor(w / 2);
  const kinds = Object.keys(FLOORS);
  const list = [];
  let x = 0;
  while (x < w) {
    const bw = rng.int(9, 24);
    // frente a la torre de vidrio queda una plaza: bloques bajos
    const plaza = Math.abs(x + bw / 2 - (mid + 6)) < 18;
    const hgt = plaza ? rng.int(4, 7) : rng.int(8, 20);
    list.push({ x, w: bw, top: base - hgt, kind: rng.pick(kinds) });
    x += bw + rng.int(-3, 2);
  }
  // los altos atrás, los bajos adelante
  list.sort((a, b) => a.top - b.top);
  for (const b of list) block(cv, rng, b.x, b.w, b.top, base, b.kind, out);
  // la iglesia y la obra con grúa, cerca del centro
  cv.stamp(CHURCH, mid - 40, base - CHURCH.h + 1);
  obra(cv, rng, mid + 30, 22, base - 16, base, out);
  return { cv, ...out };
}
