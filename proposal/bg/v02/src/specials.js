// Lotes especiales que le dan carácter a cada cuadra: bencinera, iglesia,
// cine, hostal (este) y parque, plaza, estacionamiento, feria (oeste).
// Registran detalles animados en `anims` y gente quieta en `idlers`.

import { box, segX, segY, segZ, sprite, stamp, fillFace } from './iso.js';
import { Face, TEX } from './face.js';
import { GROUND } from './ground.js';
import { roof, signL, frontWindows, CRATE, SHOPS, eastBuilding } from './buildings.js';
import * as P from './props.js';
import { carY, carX } from './sprites.js';
import { hash2 } from './rng.js';

const cc = (s) => s.charCodeAt(0);
const US = 95;
const S = (rows, ax = 0) => sprite(rows, ax, rows.length, 1);

// piso propio de un lote (le gana al patio punteado por defecto)
function floor(t, x0, x1, y0, y1, tex) {
  fillFace(t, 'T', 0, x0, x1, y0, y1, tex, GROUND - 0.1);
}

const grass = (c, r) => {
  const h = hash2(c * 3 + 1, r * 7 + 2);
  return h < 0.12 ? cc("'") : h < 0.22 ? cc(',') : h < 0.26 ? cc('"') : 0;
};

// ===== este ===========================================================

export function gasStation(t, x0, y0, y1, rng, anims, idlers) {
  const ya = y0 + 1;
  // losa de hormigón con juntas
  floor(t, x0, x0 + 18, y0, y1, (c, r) => ((c + r) % 6 === 0 && r % 3 === 0 ? cc('.') : 0));
  // tienda al fondo
  box(t, x0 + 10, x0 + 17, y1 - 8, y1 - 1, 0, 5, { left: TEX.colon, front: TEX.dots });
  const L = new Face('L', x0 + 10);
  signL(t, L, y1 - 8, y1 - 1, 3, 'MARKET');
  L.rect(t, y1 - 6, y1 - 4, 0, 3);
  L.rect(t, y1 - 4, y1 - 2, 1, 3, (c, r) => (c % 2 ? cc('o') : 0));
  roof(t, x0 + 10, x0 + 17, y1 - 8, y1 - 1, 5, rng, 0.6, anims);
  // islas con surtidores
  for (const yy of [ya + 3, ya + 8]) {
    box(t, x0 + 4, x0 + 5, yy, yy + 3, 0, 1, { bias: -0.2 });
    box(t, x0 + 4, x0 + 5, yy + 0.5 + 0.5, yy + 2, 1, 3, { left: () => cc('▒'), front: () => cc(':'), bias: -0.3 });
    const F = new Face('F', yy + 2);
    F.at(t, x0 + 4.5, 2.5, '8', -0.6);
  }
  // autos cargando
  stamp(t, carY('hatch', 1), x0 + 2.5, ya + 4, 0, -0.6);
  stamp(t, carY('auto', 1), x0 + 7, ya + 9, 0, -0.6);
  idlers.push({ x: x0 + 3.8, y: ya + 7.5, kind: 'stand', look: 1 });
  // techo sobre pilares
  const cz = 6;
  for (const [px, py] of [
    [x0 + 1, ya + 1],
    [x0 + 1, ya + 12],
    [x0 + 8, ya + 12],
  ]) {
    segZ(t, px, py, 0, cz, 47, -0.4);
  }
  box(t, x0, x0 + 9, ya, ya + 13, cz, cz + 1, {
    top: (c, r, u, v) => (Number.isInteger(v) && v % 2 === 0 ? 0 : (c + r) % 8 === 0 ? cc('.') : 0),
    left: () => 0,
    front: () => 0,
    bias: -0.2,
  });
  const CL = new Face('L', x0);
  CL.text(t, ya + 2, cz, 'SERVICENTRO', -0.9);
  anims.push({ type: 'blink', x: x0, y: ya + 1, z: cz + 0.5, axis: 'y', n: 1, glyph: '*' });
  // tótem de precios
  const tx = x0 - 1;
  const ty = y1 - 3;
  box(t, tx, tx + 2.5, ty, ty + 1, 0, 10, { bias: -0.3, front: () => 0 });
  const TF = new Face('F', ty + 1);
  TF.text(t, tx + 0.5, 8, '☼93', -0.8);
  TF.text(t, tx + 0.5, 6.5, '1290', -0.8);
  TF.text(t, tx + 0.5, 5, '◘97', -0.8);
  TF.text(t, tx + 0.5, 3.5, '1350', -0.8);
  TF.seg(t, tx, 7.5, 'u', 2.5, '_', -0.7);
  // basurero y aire
  P.trash(t, x0 + 1.5, y1 - 1);
}

export function church(t, x0, y0, y1, anims, idlers, world) {
  // x0: borde de la vereda; la iglesia se retira con un atrio y escalinata
  const fx = x0 + 6; // fachada
  const len = y1 - y0;
  const tw = 4; // ancho de torre
  // atrio enlosado
  floor(t, x0, fx, y0, y1, (c, r) => ((c & 1) === 0 && (r & 1) === 1 ? cc('.') : 0));
  // escalinata: tres peldaños rayados
  const sa = y0 + tw;
  const sb = y1 - tw;
  for (let k = 0; k < 3; k++) {
    box(t, fx - 3 + k, fx, sa, sb, k, k + 1, { left: () => US, top: () => 0, bias: -0.1 });
  }
  // nave
  const H = 15;
  box(t, fx, fx + 22, sa, sb, 0, H, { left: TEX.dots, front: TEX.colon, top: () => 0 });
  const L = new Face('L', fx);
  const mid = (sa + sb) / 2;
  // portal en arco
  L.rect(t, mid - 2, mid + 2, 3, 9);
  L.seg(t, mid, 3, 'v', 6, '/', -1.1);
  L.at(t, mid - 1.5, 9, '(', -1.2);
  L.at(t, mid + 1.5, 9, ')', -1.2);
  L.rect(t, mid - 1, mid + 1, 9.5 - 0.5, 9 + 0.5 + 0.5);
  // rosetón
  L.rect(t, mid - 2, mid + 2, 10, 14 - 0.0);
  L.seg(t, mid, 10, 'v', 4, null, -1.1);
  L.seg(t, mid - 2, 12, 'u', 4, null, -1.1);
  L.at(t, mid - 0.5, 12, '*', -1.3);
  L.at(t, mid + 0.5, 12, '*', -1.3);
  // ventanas altas de la nave
  for (const u of [sa + 1, sb - 2]) {
    L.rect(t, u, u + 1, 4, 10);
  }
  // frontón escalonado con cruz
  box(t, fx, fx + 1, mid - 3, mid + 3, H, H + 2, { left: TEX.blank, bias: -0.1 });
  box(t, fx, fx + 1, mid - 1, mid + 1, H + 2, H + 4, { left: TEX.blank, bias: -0.1 });
  stamp(t, S([' |', '-+-', ' |', ' |'], 1), fx + 0.5, mid, H + 4, -0.5);
  // torres
  for (const ty of [y0, y1 - tw]) {
    const TH = 26;
    box(t, fx - 1, fx + tw - 1, ty, ty + tw, 0, TH, { left: TEX.colon, front: TEX.colonOdd });
    const TL = new Face('L', fx - 1);
    // campanario: arcos con campana
    TL.rect(t, ty + 1, ty + 3, TH - 6, TH - 2);
    TL.at(t, ty + 2, TH - 3.5, 'A', -1.3);
    TL.at(t, ty + 1.5, TH - 4, '(', -1.25);
    TL.at(t, ty + 2.5, TH - 4, ')', -1.25);
    anims.push({ type: 'bell', x: fx - 1, y: ty + 2, z: TH - 3.5 });
    // ventanita y reloj
    TL.rect(t, ty + 1, ty + 3, 12, 15);
    TL.at(t, ty + 2, 13.5, '○', -1.3);
    TL.rect(t, ty + 1.5, ty + 2.5, 5, 9);
    // cornisas
    TL.rect(t, ty, ty + tw, TH - 8, TH - 7, (c, r, u) => (Number.isInteger(u) ? US : 0));
    const TF = new Face('F', ty + tw);
    TF.rect(t, fx - 0.5, fx + 2.5, TH - 6, TH - 2);
    TF.at(t, fx + 1, TH - 3.5, 'A', -1.3);
    // remate escalonado y cruz
    box(t, fx - 0.5, fx + tw - 1.5, ty + 0.5, ty + tw - 0.5, TH, TH + 2, { left: TEX.blank });
    box(t, fx, fx + tw - 2, ty + 1, ty + tw - 1, TH + 2, TH + 4, { left: TEX.blank });
    stamp(t, S([' |', '-+-', ' |'], 1), fx + 1, ty + 2, TH + 4, -0.5);
  }
  // palomas en la escalinata y una señora con flores
  idlers.push({ x: fx - 3.5, y: sa + 2, kind: 'stand', look: 3 });
  world.flocks.push({ x: fx - 4.5, y: mid + 3, n: 7, special: true });
  idlers.push({ x: fx - 2.5, y: sb - 1, kind: 'sit', look: 0 });
  void len;
}

export function cinema(t, b, rng, anims) {
  const { x0, x1, y0, y1 } = b;
  const H = eastBuilding(t, b, rng, anims, { floors: 3, shop: { name: '', goods: ' ' } });
  void H;
  // marquesina sobre la vereda: el nombre en una franja y ampolletas que corren
  const ma = y0 + 1;
  const mb = y1 - 1;
  box(t, x0 - 2, x0, ma, mb, 5, 6, { left: () => 0, top: () => 0, front: () => cc('*'), bias: -0.5 });
  const M = new Face('L', x0 - 2);
  const name = 'CINE ROXY';
  M.text(t, ma + Math.max(1, Math.floor((mb - ma - name.length) / 2)), 5, name, -0.9);
  anims.push({ type: 'marquee', x: x0 - 2, y0: ma, y1: mb, z: 6 });
  // cartelera vertical: la película de hoy
  const F = new Face('F', ma);
  void F;
  // afiches en la planta baja
  const L = new Face('L', x0);
  for (let u = ma + 1; u < mb - 2; u += 3) L.rect(t, u, u + 2, 1, 4, (c, r) => ((c + r) % 2 ? cc('▒') : cc(':')));
}

export function hostal(t, b, rng, anims) {
  const { x0, y0, y1 } = b;
  const H = eastBuilding(t, b, rng, anims, { floors: 5, shop: rng.pick(SHOPS) });
  // letrero de bandera vertical: el nombre sube en diagonal
  const sy = y0 + 1;
  const z0 = 8;
  const name = 'HOSTAL';
  box(t, x0 - 2, x0, sy, sy + 1, z0, z0 + name.length + 1, { front: () => 0, left: () => 0, bias: -0.6 });
  const F = new Face('F', sy + 1);
  for (let i = 0; i < name.length; i++) F.at(t, x0 - 1, z0 + 0.5 + name.length - i, name[i], -1);
  anims.push({ type: 'blinkZ', x: x0 - 2, y: sy + 1, z0: z0 + 1, n: name.length });
  void H;
}

// obra en construcción: estructura a medio hacer, andamio rayado, reja con
// letrero y una grúa torre de celosía con el gancho que sube y baja
export function obra(t, x0, y0, y1, anims) {
  floor(t, x0, x0 + 18, y0, y1, (c, r) => {
    const h = hash2(c * 5 + 3, r * 3 + 9);
    return h < 0.1 ? cc(',') : h < 0.16 ? cc('.') : h < 0.18 ? cc("'") : 0;
  });
  // estructura: losas sobre pilares
  const sx = x0 + 6;
  for (let f = 0; f < 4; f++) {
    const z = f * 4;
    box(t, sx, sx + 9, y0 + 2, y1 - 2, z + 3, z + 4, { left: () => US, front: (c, r, u) => (Number.isInteger(u) ? cc('/') : 0), bias: -0.1 });
    for (const yy of [y0 + 2.5, (y0 + y1) / 2, y1 - 2.5]) {
      segZ(t, sx + 0.5, Math.round(yy), z, 3, 47, -0.2);
    }
  }
  // andamio delante, rayado
  const L = new Face('L', sx - 1);
  for (let z = 0; z < 12; z += 2) L.seg(t, y0 + 3, z, 'u', y1 - y0 - 6, '\\', -0.3);
  for (let u = y0 + 3; u <= y1 - 3; u += 2) L.seg(t, u, 0, 'v', 12, '/', -0.3);
  // reja de tablas con letrero
  box(t, x0, x0 + 0.5, y0, y1, 0, 3, { left: (c, r, u) => (Number.isInteger(u) ? cc('/') : cc('|')), top: () => 0, bias: -0.2 });
  const RL = new Face('L', x0);
  RL.rect(t, y0 + 4, y0 + 10, 1, 2);
  RL.text(t, y0 + 5, 1, 'OBRA', -1.5);
  // grúa torre: mástil de celosía
  const mx = x0 + 14;
  const my = y0 + 4;
  const H = 30;
  segZ(t, mx, my, 0, H, 47, -0.4);
  segZ(t, mx + 1, my, 0, H, 47, -0.4);
  const MF = new Face('F', my);
  for (let z = 0; z < H; z++) MF.at(t, mx + 0.5, z + 0.5, z % 2 ? '\\' : '_', -0.3);
  // pluma a lo largo de y (hacia la avenida y hacia atrás)
  const ja = my - 6;
  const jb = my + 16;
  const JL = new Face('L', mx);
  JL.seg(t, ja, H, 'u', jb - ja, '\\', -0.5);
  JL.seg(t, ja, H + 1, 'u', jb - ja, '\\', -0.5);
  for (let u = ja + 1; u < jb; u++) JL.at(t, u, H + 0.5, u % 2 ? '/' : '_', -0.4);
  // cabina y contrapeso
  box(t, mx - 1, mx + 1, my - 1, my + 1, H + 1, H + 3, { left: (c, r) => ((c + r) % 2 ? cc('▒') : 0), bias: -0.6 });
  box(t, mx - 0.5, mx + 1.5, ja, ja + 2, H - 2, H, { left: TEX.colon, bias: -0.6 });
  anims.push({ type: 'crane', x: mx, y0: my + 3, y1: jb - 1, z: H, ground: 13 });
}

// ===== oeste ==========================================================

export function park(t, x0, x1, y0, y1, rng, anims, idlers, world) {
  floor(t, x0, x1, y0, y1, grass);
  // senderos punteados
  const px = Math.round((x0 + x1) / 2);
  floor(t, px - 1, px + 1, y0, y1, (c, r) => ((c + r) % 2 === 0 && r % 2 === 0 ? cc('.') : cc(' ')));
  const pm = Math.round((y0 + y1) / 2);
  floor(t, x0, x1, pm - 1, pm + 1, (c) => (c % 3 === 0 ? cc('.') : cc(' ')));
  // laguna con patos
  const la = y0 + 3;
  const lb = Math.min(pm - 3, la + 9);
  if (lb - la >= 5) {
    fillFace(t, 'T', 0, x0 + 2, px - 2, la, lb, (c, r) => (r % 2 === 0 ? (((c % 5) + 5) % 5 < 3 ? cc('=') : 0) : c % 7 === 0 ? cc('~') : 0), GROUND - 0.2);
    segX(t, x0 + 2, la, 0, px - 2 - x0 - 2, US, GROUND - 0.3);
    segX(t, x0 + 2, lb, 0, px - 2 - x0 - 2, US, GROUND - 0.3);
    segY(t, x0 + 2, la, 0, lb - la, cc('('), GROUND - 0.3);
    segY(t, px - 2, la, 0, lb - la, cc(')'), GROUND - 0.3);
    anims.push({ type: 'pond', x0: x0 + 2.5, x1: px - 2.5, y0: la + 1, y1: lb - 1 });
    world.ducks.push({ x0: x0 + 3, x1: px - 3, y0: la + 1.5, y1: lb - 1 });
  }
  // árboles
  const spots = [];
  for (let i = 0; i < 9; i++) {
    const x = rng.range(x0 + 1.5, x1 - 1.5);
    const y = rng.range(y0 + 2, y1 - 1);
    if (Math.abs(x - px) < 2 || Math.abs(y - pm) < 2) continue;
    if (x < px - 1 && y > la - 2 && y < lb + 3) continue;
    if (spots.some(([a, b]) => Math.abs(a - x) < 4 && Math.abs(b - y) < 4)) continue;
    spots.push([x, y]);
    P.tree(t, Math.round(x * 2) / 2, Math.round(y), rng.int(0, 3));
  }
  // bancas junto al sendero
  for (let y = y0 + 3; y < y1 - 3; y += 7) if (Math.abs(y - pm) > 2) P.bench(t, px + 1.5, y, 3);
  // juegos: resbalín y columpio
  const gy = pm + 3;
  if (gy + 6 < y1) {
    box(t, x0 + 3, x0 + 4, gy, gy + 1, 0, 4, { left: () => US, bias: -0.2 });
    stamp(t, S(['\\', ' \\', '  \\', '   \\_'], 0), x0 + 4, gy + 1, 3, -0.6);
    stamp(t, S(['_______', '/  |  /', '  ', '/     /'], 0), x0 + 4, gy + 6, 0, -0.6);
    anims.push({ type: 'swing', x: x0 + 5.5, y: gy + 6, z: 0 });
    idlers.push({ x: x0 + 6, y: gy + 2, kind: 'kid', look: 0 });
    idlers.push({ x: x0 + 7.5, y: gy + 3.5, kind: 'kid', look: 1 });
  }
  // dos niños se pasan una pelota en el pasto
  const by = pm + 2;
  if (by + 6 < y1) {
    idlers.push({ x: px + 3, y: by, kind: 'kid', look: 0 });
    idlers.push({ x: px + 3, y: by + 6, kind: 'kid', look: 1 });
    anims.push({ type: 'ball', x: px + 3.5, y0: by, y1: by + 6 });
  }
  world.dogs.push({ x0: px + 1, x1: x1 - 1, y0: y0 + 2, y1: y1 - 2 });
  world.strolls.push({ axis: 'y', x: px - 0.5, a: y0 + 1, b: y1 - 1, n: 3 });
  world.strolls.push({ axis: 'x', y: pm - 0.5, a: x0 + 1, b: x1 - 1, n: 1 });
  world.flocks.push({ x: px, y: pm + 0.5, n: 5, special: true });
  idlers.push({ x: px + 2, y: y0 + 6, kind: 'sit', look: 1 });
}

export function plaza(t, x0, x1, y0, y1, rng, anims, idlers, world) {
  const cx = Math.round((x0 + x1) / 2);
  const cy = Math.round((y0 + y1) / 2);
  // canteros de puntos densos (como los campos de la referencia), senderos
  // en cruz y un anillo alrededor de la pila
  floor(t, x0, x1, y0, y1, (c, r) => {
    const x = (c - r) / 2;
    const y = r + 0.5;
    const path = Math.abs(x - cx) < 1.6 || Math.abs(y - cy) < 1.6 || (Math.abs(x - cx) < 6.5 && Math.abs(y - cy) < 5.5) || x < x0 + 1.5 || x > x1 - 1.5 || y < y0 + 1.5 || y > y1 - 1.5;
    if (path) return (c & 3) === 0 && (r & 1) === 0 ? cc('.') : 0;
    const h = hash2(c * 13 + 1, r * 7 + 3);
    if (h < 0.035) return cc('*');
    return (c & 1) === 0 ? cc(':') : 0;
  });
  // borde de los canteros
  for (const [xa, xb] of [
    [x0 + 1.5, cx - 1.5],
    [cx + 1.5, x1 - 1.5],
  ]) {
    for (const [ya, yb] of [
      [y0 + 2, cy - 2],
      [cy + 2, y1 - 2],
    ]) {
      if (xb - xa < 2 || yb - ya < 2) continue;
      const T = new Face('T', 0);
      T.frame(t, xa, xb, ya, yb, GROUND - 0.4);
    }
  }
  // pila: taza ancha con agua, columna, taza alta y remate
  box(t, cx - 5.5, cx + 5.5, cy - 4, cy + 4, 0, 1, { top: (c, r) => (r % 2 === 0 && ((c % 5) + 5) % 5 < 3 ? cc('=') : 0), left: () => cc('_'), front: () => cc('_') });
  const BT = new Face('T', 1);
  BT.frame(t, cx - 5, cx + 5, cy - 3, cy + 3, -0.1);
  anims.push({ type: 'fountainWater', x0: cx - 4.5, x1: cx + 4.5, y0: cy - 2.5, y1: cy + 2.5, z: 1 });
  box(t, cx - 0.5, cx + 0.5, cy - 0.5, cy + 0.5, 1, 5, { left: () => cc(':'), bias: -0.2 });
  box(t, cx - 2, cx + 2, cy - 1.5 - 0.5, cy + 1.5 + 0.5, 5, 6, { top: () => cc('~'), left: (c, r, u) => (Number.isInteger(u) ? cc('_') : 0), front: () => cc('_'), bias: -0.3 });
  box(t, cx - 0.5, cx + 0.5, cy - 0.5, cy + 0.5, 6, 7, { bias: -0.35 });
  anims.push({ type: 'fountain', x: cx, y: cy, z: 7 });
  // estatua del prócer en un pedestal
  const sx = x0 + 3;
  const sy = y0 + 3;
  box(t, sx, sx + 2, sy, sy + 2, 0, 3, { left: TEX.colon, bias: -0.1 });
  box(t, sx - 0.5, sx + 2.5, sy - 0.5, sy + 2.5, 3, 4, { bias: -0.2 });
  stamp(t, S([' o/', '/|', ' |\\', '/ |'], 1), sx + 1, sy + 1, 4, -0.5);
  // árboles en los canteros, bancas junto a los senderos, faroles
  for (const [x, y, k] of [
    [x0 + 3, y1 - 3, 0],
    [x1 - 3, y0 + 5, 2],
    [x1 - 3, y1 - 3, 0],
    [x0 + 3.5, cy + 9, 1],
  ]) {
    P.tree(t, x, y, k);
  }
  for (const [x, y] of [
    [cx - 3, cy - 10],
    [cx + 2, cy + 7],
    [cx - 3, cy + 7],
    [cx + 2, cy - 10],
  ]) {
    P.bench(t, x, y, 3);
  }
  P.lamp(t, cx - 2, y0 + 1, 1, 6, anims);
  P.lamp(t, cx + 2, y1 - 1, -1, 6, anims);
  P.lamp(t, x0 + 1, cy + 2, 1, 6, anims);
  // vida quieta: músico, vendedor de globos, gente en las bancas
  idlers.push({ x: cx + 5, y: cy - 6, kind: 'musician' });
  idlers.push({ x: cx - 5, y: cy + 6.5, kind: 'balloons' });
  idlers.push({ x: cx - 2.4, y: cy - 8, kind: 'sit', look: 1 });
  idlers.push({ x: cx + 2.6, y: cy + 9, kind: 'sit', look: 0 });
  idlers.push({ x: cx - 6.5, y: cy - 1, kind: 'kid', look: 0 });
  idlers.push({ x: cx + 6.5, y: cy + 2, kind: 'stand', look: 2 });
  // paseantes por los senderos
  world.strolls.push({ axis: 'y', x: cx - 1, a: y0 + 1, b: cy - 5, n: 2 });
  world.strolls.push({ axis: 'y', x: cx + 0.5, a: cy + 5, b: y1 - 1, n: 2 });
  world.strolls.push({ axis: 'x', y: cy - 5.5, a: x0 + 1, b: x1 - 1, n: 2 });
  world.strolls.push({ axis: 'x', y: cy + 5.5, a: x0 + 1, b: x1 - 1, n: 1 });
  world.flocks.push({ x: cx + 3, y: cy + 11, n: 8, special: true });
  world.flocks.push({ x: cx - 3, y: cy - 12, n: 6, special: true });
  void rng;
}

export function parking(t, x0, x1, y0, y1, rng, idlers) {
  floor(t, x0, x1, y0, y1, (c, r) => ((c + 2 * r) % 9 === 0 ? cc('.') : 0));
  // líneas de estacionamiento a lo largo de x
  const kinds = ['auto', 'sedan', 'furgon', 'auto'];
  for (let y = y0 + 2; y < y1 - 2; y += 3) {
    segX(t, x0 + 2, y, 0, 6, US, GROUND - 0.3);
    segX(t, x0 + 10, y, 0, Math.max(0, x1 - x0 - 12), US, GROUND - 0.3);
    if (y + 3 < y1 - 1 && rng.chance(0.75)) stamp(t, carX(rng.pick(kinds), 1), x0 + 5, y + 2, 0, -0.6, rng.chance(0.5));
    if (y + 3 < y1 - 1 && x1 - x0 > 16 && rng.chance(0.6)) stamp(t, carX(rng.pick(kinds), 1), x0 + 13, y + 2, 0, -0.6, rng.chance(0.5));
  }
  // caseta con barrera y letrero
  box(t, x1 - 3, x1 - 1, y0 + 1, y0 + 3, 0, 3, { left: TEX.colon, bias: -0.2 });
  const F = new Face('F', y0 + 3);
  F.rect(t, x1 - 2.5, x1 - 1.5, 1, 2.5, null, -0.4);
  segX(t, x1 - 1, y0 + 3, 1, 3, cc('='), -0.6);
  idlers.push({ x: x1 - 2, y: y0 + 2.2, kind: 'stand', look: 0 });
  // letrero sobre postes
  const SF = new Face('F', y1 - 1);
  segZ(t, x1 - 7.5, y1 - 1, 0, 3, 47, -0.4);
  segZ(t, x1 - 1.5, y1 - 1, 0, 3, 47, -0.4);
  SF.rect(t, x1 - 8, x1 - 1, 3, 4, null, -0.5);
  SF.text(t, x1 - 7.5, 3, 'PARKING', -1);
  SF.text(t, x1 - 6, 4.2 - 0.2, '$', -1);
}

export function feria(t, x0, x1, y0, y1, rng, idlers) {
  floor(t, x0, x1, y0, y1, (c, r) => ((c + r) % 5 === 0 && r % 2 ? cc('.') : 0));
  const goods = ['ooo', 'o*o', '***', 'oOo', '"""', '▒▒▒'];
  for (let y = y0 + 2; y < y1 - 4; y += 6) {
    for (const x of [x0 + 2, x0 + 9]) {
      if (x + 5 > x1) continue;
      // mesón con mercadería
      box(t, x, x + 4, y, y + 3, 0, 1.5 - 0.5, { top: () => 0, left: () => cc('_'), bias: -0.2 });
      const T = new Face('T', 1);
      const g = rng.pick(goods);
      for (let i = 0; i < 3; i++) T.at(t, x + 1 + i, y + 1.5, g[i], -0.6);
      // toldo a rayas sobre palos
      segZ(t, x, y + 3, 0, 4, 47, -0.3);
      segZ(t, x + 4, y + 3, 0, 4, 47, -0.3);
      box(t, x - 0.5, x + 4.5, y - 0.5, y + 3.5, 4, 5, {
        top: (c, r, u) => (Math.round(u * 2) % 2 === 0 ? cc('\\') : 0),
        left: (c, r, u) => (Number.isInteger(u) ? cc('/') : 0),
        front: (c, r, u) => (Number.isInteger(u) ? cc('/') : 0),
        bias: -0.3,
      });
      stamp(t, CRATE, x + 4.5, y + 3.5, 0, -0.5);
      idlers.push({ x: x - 0.8, y: y + 2, kind: 'stand', look: rng.int(0, 3) });
      if (rng.chance(0.6)) idlers.push({ x: x + 5.2, y: y + 1.5, kind: 'stand', look: rng.int(0, 3) });
    }
  }
  // letrero de la feria
  const F = new Face('F', y0 + 1);
  segZ(t, x1 - 1.5, y0 + 1, 0, 5, 47, -0.4);
  F.rect(t, x1 - 5, x1 - 1, 5, 6, null, -0.5);
  F.text(t, x1 - 4.5, 5, 'FERIA', -1);
}

void segY;
void frontWindows;
void hash2;
