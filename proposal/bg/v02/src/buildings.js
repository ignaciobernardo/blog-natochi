// Edificios armados con piezas dibujadas a mano: vidrieras con toldo y
// letrero, ventanas en rombo, balcones con baranda rayada, cornisas, techos
// con estanques, antenas, tendederos y equipos de aire.
//
// Cada función dibuja en la capa estática y puede registrar detalles animados
// (vapor, luces, letreros que parpadean) en `anims`.

import { box, segX, segY, segZ, sprite, stamp, fillFace } from './iso.js';
import { Face, TEX } from './face.js';
import { hash2 } from './rng.js';

const cc = (s) => s.charCodeAt(0);
const US = 95;

// de noche (tema oscuro) algunas ventanas se prenden
export const NIGHT = { on: false };
const LITW = 0x2592; // ▒

// --- texturas de muro y techo ------------------------------------------------
export const WALLS = [TEX.colon, TEX.blank, TEX.dots, TEX.colon, TEX.colonOdd];
// techos: grava de puntos en grilla (como los campos de la referencia) con
// algún tick suelto; varía por edificio
export const ROOFS = [
  (c, r) => ((c & 1) === 0 && (r & 1) === 0 ? cc('.') : 0),
  (c, r) => ((c + r) % 4 === 0 ? cc('.') : 0),
  (c, r) => ((c & 3) === 0 ? cc('.') : 0),
  (c, r) => {
    const h = hash2(c * 7 + 3, r * 11 + 5);
    return h < 0.06 ? cc('.') : h < 0.075 ? cc("'") : 0;
  },
];
const roofTex = ROOFS[0];

// --- locales: nombre y lo que muestran en la vidriera -------------------------
export const SHOPS = [
  { name: 'PANADERIA', goods: 'o0oO' },
  { name: 'PAN', goods: 'o0o' },
  { name: 'FLORES', goods: '*+*' },
  { name: 'LIBROS', goods: '|/|' },
  { name: 'FARMACIA', goods: '+ ' },
  { name: 'CAFE', goods: 'cu ' },
  { name: 'ZAPATOS', goods: 'L_' },
  { name: 'FERRETERIA', goods: 'T/' },
  { name: 'HELADOS', goods: 'vV' },
  { name: 'BAZAR', goods: '%&*' },
  { name: 'VERDURAS', goods: 'o.o' },
  { name: 'RELOJES', goods: '○O' },
  { name: 'FOTOS', goods: '▒ ' },
  { name: 'DULCES', goods: 'o*' },
  { name: 'TELAS', goods: '▒░' },
  { name: 'DISCOS', goods: '○●' },
  { name: 'JUGUETES', goods: '^o*' },
  { name: 'OPTICA', goods: 'oo-' },
  { name: 'EMPANADAS', goods: 'D)' },
  { name: 'LAVANDERIA', goods: '○ ' },
  { name: 'BICICLETAS', goods: 'o-o' },
  { name: 'PELUQUERIA', goods: '§ ' },
  { name: 'ALMACEN', goods: 'o▒|' },
  { name: 'MERCERIA', goods: '+:' },
];

// --- sprites de techo y vereda ----------------------------------------------
const S = (rows, ax = 0) => sprite(rows, ax, rows.length, 1);
const TANK = S([' .--.', '(____)', ' /  /'], 1);
const TANK2 = S([' ____', '|____|', ' /  /'], 1);
const DISH = S(['(\\', ' |)'], 0);
const LAUNDRY = [S(['/¯¯¯¯¯¯¯/', '▼ ▲ ▼ ¶', '/       /'], 0), S(['/¯¯¯¯¯¯/', 'n ▼ ▲ ▼', '/      /'], 0)];
const PLANT = [S(['*'], 0), S(['&'], 0), S(["*'"], 0), S(['"*'], 0)];
const CHAIR = S(['_|'], 0);
const UMBRELLA = S(['.-^-.', '  |', ' _|_'], 2);
const BOARD = S(['/\\'], 0);
export const CRATE = S(['ooo', '[_]'], 0);

// --- piezas de fachada (cara 'L', la que mira a la avenida) -------------------

// ventana sobre la cara L, con su estilo y algún detalle de vida adentro
function windowL(t, L, u, v, style, rng) {
  if (NIGHT.on && rng.chance(0.38)) {
    // ventana prendida
    const w = style === 'alta' ? 1 : 2;
    L.rect(t, u, u + w, v, v + 2, () => LITW);
    return;
  }
  if (style === 'rombo4') {
    L.rect(t, u, u + 2, v, v + 2);
    L.seg(t, u + 1, v, 'v', 2);
    L.seg(t, u, v + 1, 'u', 2);
  } else if (style === 'rombo') {
    L.rect(t, u, u + 2, v, v + 2);
    const k = rng.next();
    if (k < 0.3) {
      // cortinas
      L.at(t, u + 0.5, v + 1, '(');
      L.at(t, u + 1.5, v + 1, ')');
    } else if (k < 0.45) {
      // alguien mirando
      L.at(t, u + 1, v + 1.5, 'o');
      L.at(t, u + 1, v + 0.5, '|');
    } else if (k < 0.52) {
      // un gato en el alféizar
      L.at(t, u + 0.5, v + 1, '^');
      L.at(t, u + 1, v + 0.5, 'Ö');
    } else if (k < 0.62) {
      L.at(t, u + 1, v + 0.5, '▒');
      L.at(t, u + 1, v + 1.5, '▒');
      L.at(t, u + 0.5, v + 1, '▒');
      L.at(t, u + 1.5, v + 1, '▒');
    } else if (k < 0.66) {
      // aviso de arriendo
      L.at(t, u + 0.5, v + 1, 'S');
      L.at(t, u + 1.5, v + 1, 'E');
    }
  } else if (style === 'alta') {
    L.rect(t, u, u + 1, v, v + 2);
    if (rng.chance(0.4)) L.at(t, u + 0.5, v + 1, rng.pick(['o', ')', '▒', '(']));
  } else if (style === 'doble') {
    L.rect(t, u, u + 1, v, v + 2);
    L.rect(t, u + 1, u + 2, v, v + 2);
    if (rng.chance(0.3)) L.at(t, u + 0.5, v + 1, rng.pick(['o', '▒', ')']));
  }
  // macetero con flores bajo la ventana
  if (style !== 'alta' && rng.chance(0.28)) {
    L.at(t, u + 0.5, v, rng.pick(['*', '&']), -1.4);
    L.at(t, u + 1.5, v, rng.pick(['*', '"', '*']), -1.4);
  }
}

// equipo de aire acondicionado: un cubito que asoma de la fachada
function acUnit(t, x0, u, v) {
  box(t, x0 - 1, x0, u, u + 1, v, v + 1, { left: () => cc('#'), front: () => cc('='), bias: -0.3 });
}

// balcón: losa que sale 1 hacia la avenida con baranda rayada \_\_\_
function balconyL(t, x0, u0, u1, z, rng) {
  box(t, x0 - 1, x0, u0, u1, z, z + 1, { left: () => US, top: false, bias: -0.2 });
  // macetas y alguna silla arriba de la losa
  const T = new Face('T', z + 1);
  void T;
  if (rng.chance(0.5)) stamp(t, rng.pick(PLANT), x0 - 0.5, u0 + 1, z + 1, -1.6);
  if (rng.chance(0.4)) stamp(t, rng.pick(PLANT), x0 - 0.5, u1 - 1, z + 1, -1.6);
  // ropa colgada en la baranda
  if (rng.chance(0.25)) {
    const L = new Face('L', x0 - 1);
    for (let u = u0 + 1; u < u1; u++) L.at(t, u, z + 0.5, rng.pick(['▼', '▲', '¶', 'n']), -0.6);
  }
}

// cornisa: franja de una unidad con relleno rayado
function corniceL(t, L, u0, u1, v, glyph = '_') {
  L.rect(t, u0, u1, v, v + 1, (c, r, u) => (Number.isInteger(u) ? cc(glyph) : 0));
}

// letrero: franja de una unidad con el nombre bajando en diagonal
export function signL(t, L, u0, u1, v, name, frame = true) {
  const slots = u1 - u0 - 1;
  const txt = name.length > slots ? name.slice(0, slots) : name;
  const start = u0 + 1 + Math.floor((slots - txt.length) / 2);
  if (frame) L.rect(t, u0, u1, v, v + 1);
  L.text(t, start, v, txt, -1.3);
}

// vidriera de planta baja: letrero, toldo, ventanas con mercadería y puerta
export function shopfront(t, x0, y0, y1, rng, shop, anims) {
  const L = new Face('L', x0);
  const len = y1 - y0;
  // letrero arriba
  signL(t, L, y0, y1, 5, shop.name);
  // puerta a un lado
  const doorAt = rng.chance(0.5) ? y0 + 1 : y1 - 3;
  L.rect(t, doorAt, doorAt + 2, 0, 4);
  L.seg(t, doorAt + 1, 0, 'v', 4, null, -1.2);
  L.at(t, doorAt + 0.5, 2, '.', -1.4);
  // peldaño rayado frente a la puerta
  if (rng.chance(0.5)) box(t, x0 - 1, x0, doorAt - 0.5 + 0.5, doorAt + 2, 0, 1, { left: () => US, top: () => 0, bias: -0.4 });
  // vidrieras con mercadería
  const segs = doorAt === y0 + 1 ? [[y0 + 3, y1 - 1]] : [[y0 + 1, y1 - 3]];
  for (const [a, b] of segs) {
    if (b - a < 2) continue;
    L.rect(t, a, b, 1, 4, NIGHT.on ? () => 0x2591 : null);
    let i = 0;
    for (let u = a + 1; u < b; u++) {
      L.at(t, u, 1.5, shop.goods[i++ % shop.goods.length], -1.4);
      if (rng.chance(0.5)) L.at(t, u, 2.5, shop.goods[(i + 1) % shop.goods.length], -1.4);
    }
  }
  // toldo de una unidad sobre la vereda, con flecos en zigzag
  if (rng.chance(0.75) && len >= 4) {
    const stripes = rng.pick(['\\', ':', 0]);
    box(t, x0 - 1, x0, y0 + 0.0, y1, 4, 5, {
      left: (c, r, u) => (Number.isInteger(u) ? cc('/') : 0),
      top: (c, r, u) => (stripes && u === x0 - 0.5 ? cc(stripes) : 0),
      front: () => cc('/'),
      bias: -0.3,
    });
  }
  // letrero de bandera (perpendicular, se lee de frente)
  if (rng.chance(0.3)) {
    const yb = rng.chance(0.5) ? y0 + 1 : y1 - 1;
    box(t, x0 - 2, x0, yb - 0.0, yb + 0.0 + 1, 6, 8, { bias: -0.4 });
    const F = new Face('F', yb + 1);
    F.at(t, x0 - 1, 6.5, shop.goods[0] === ' ' ? '+' : shop.goods[0], -0.9);
  }
  void anims;
}

// --- techos --------------------------------------------------------------------
export function roof(t, x0, x1, y0, y1, H, rng, density = 1, anims = null) {
  // pretil: línea interior
  const T = new Face('T', H);
  if (x1 - x0 >= 3 && y1 - y0 >= 3) {
    T.frame(t, x0 + 0.5, x1 - 0.5, y0 + 1, y1 - 1, -0.3);
  }
  const area = (x1 - x0) * (y1 - y0);
  const n = Math.round((area / 18) * density);
  const used = [];
  const free = (x, y, w, h) => {
    for (const [a, b, c, d] of used) if (x < c + 0.5 && x + w > a - 0.5 && y < d + 0.5 && y + h > b - 0.5) return false;
    return x >= x0 + 1 && x + w <= x1 - 1 && y >= y0 + 1.5 && y + h <= y1 - 1;
  };
  for (let i = 0; i < n * 3 && used.length < n; i++) {
    const kind = rng.pick(['tank', 'tank', 'ac', 'ac', 'antenna', 'house', 'sky', 'laundry', 'dish', 'plants', 'chimney', 'solar']);
    const w = kind === 'house' ? 3 : kind === 'laundry' ? 4 : kind === 'solar' ? 3 : kind === 'sky' ? 2 : 1;
    const h = kind === 'house' ? 3 : kind === 'laundry' ? 1 : kind === 'solar' ? 2 : kind === 'sky' ? 2 : 1;
    const x = Math.floor(rng.range(x0 + 1, x1 - w - 1) * 2) / 2;
    const y = Math.floor(rng.range(y0 + 1, y1 - h - 1));
    if (!free(x, y, w, h)) continue;
    used.push([x, y, x + w, y + h]);
    if (kind === 'tank') stamp(t, rng.chance(0.6) ? TANK : TANK2, x, y + 1, H, -0.5);
    else if (kind === 'ac') {
      box(t, x, x + 1, y, y + 1, H, H + 1, { front: () => cc('#'), bias: -0.2 });
    } else if (kind === 'antenna') {
      const hh = rng.int(3, 5);
      segZ(t, x, y, H, hh, 47, -0.3);
      segX(t, x - 0.5, y, H + hh - 1, 1, US, -0.35);
      segX(t, x - 1, y, H + hh - 2, 2, US, -0.35);
      if (rng.chance(0.4)) stamp(t, S(['o']), x + 0.5, y, H + hh, -0.6);
    } else if (kind === 'house') {
      box(t, x, x + 2.5, y, y + 2, H, H + 3, { left: TEX.colonOdd, bias: -0.2 });
      const F = new Face('F', y + 2);
      F.rect(t, x + 0.5, x + 1.5, H, H + 2, null, -0.4);
    } else if (kind === 'sky') {
      box(t, x, x + 1.5, y, y + 2, H, H + 1, { top: (c, r, u) => (u === x + 0.5 || u === x + 1 ? cc('\\') : 0), bias: -0.2 });
    } else if (kind === 'laundry') {
      stamp(t, rng.pick(LAUNDRY), x, y + 1, H, -0.5);
      if (anims) anims.push({ type: 'laundry', x, y: y + 1, z: H });
    } else if (kind === 'dish') {
      stamp(t, DISH, x, y + 1, H, -0.5);
    } else if (kind === 'plants') {
      for (let k = 0; k < 3; k++) stamp(t, rng.pick(PLANT), x + k * 0.5, y + 1 - k * 0.5, H, -0.4);
    } else if (kind === 'chimney') {
      box(t, x, x + 1, y, y + 1, H, H + 2, { bias: -0.2 });
      if (anims) anims.push({ type: 'steam', x: x + 0.5, y: y + 0.5, z: H + 2, seed: rng.next() });
    } else if (kind === 'solar') {
      box(t, x, x + 3, y, y + 2, H, H + 1, {
        top: (c, r, u) => (Number.isInteger(u * 2) && Math.abs(u * 2) % 2 === 1 ? cc('\\') : 0),
        left: () => cc('_'),
        bias: -0.2,
      });
    }
  }
}

// --- letrero publicitario en el techo, mirando a la avenida ------------------------
const ADS = ['CAFE TOSTAO', 'RADIO 96.5', 'GALLETAS LUNA', 'TE DEL ABUELO', 'LEA MAS', 'PILAS SOL', 'JUGO NARANJA', 'BICIS YA', 'HELADOS POLO', 'VIAJE EN MICRO', 'PAN AMASADO'];
const ICONS = ['☺', '♥', '☼', '♪', '♣', '♦'];
export function billboard(t, x0, y0, y1, H, rng) {
  const len = y1 - y0;
  const ad = ADS.filter((a) => a.length + 3 <= len);
  if (!ad.length) return;
  const name = rng.pick(ad);
  const xb = x0 + 1.5;
  const ua = y0 + Math.floor((len - name.length - 3) / 2);
  const ub = ua + name.length + 3;
  const L = new Face('L', xb);
  // patas y tirantes
  for (const u of [ua + 1, ub - 1]) {
    segZ(t, xb, u, H, 2, 47, -0.4);
    segZ(t, xb + 1, u, H, 2, 47, -0.4);
  }
  L.rect(t, ua, ub, H + 2, H + 5, null, -0.8);
  L.rect(t, ua + 0.0, ub, H + 2, H + 3, null, -0.9);
  L.text(t, ua + 1, H + 2, name, -1.4);
  L.at(t, ua + 1.5, H + 4, rng.pick(ICONS), -1.4);
  L.at(t, ub - 1.5, H + 4, rng.pick(ICONS), -1.4);
}

// --- edificio del este: local abajo, departamentos arriba -----------------------
export function eastBuilding(t, b, rng, anims, opts = {}) {
  const { x0, x1, y0, y1 } = b;
  const floors = opts.floors ?? rng.int(1, 5);
  const G = 6;
  const FH = 4;
  const H = G + floors * FH + 1;
  const wall = opts.wall ?? rng.pick(WALLS);
  const wallF = rng.pick([TEX.colon, TEX.dots, TEX.blank]);
  box(t, x0, x1, y0, y1, 0, H, { left: wall, front: wallF, top: rng.pick(ROOFS) });
  const L = new Face('L', x0);
  const shop = opts.shop ?? rng.pick(SHOPS);
  shopfront(t, x0, y0, y1, rng, shop, anims);
  // separación entre planta baja y pisos
  corniceL(t, L, y0, y1, G - 0, '_');
  // pisos de departamentos
  const style = rng.pick(['rombo4', 'rombo4', 'rombo', 'alta', 'doble']);
  const len = y1 - y0;
  const w = style === 'alta' ? 1 : 2;
  const gap = style === 'alta' ? 2 : rng.int(1, 2);
  const n = Math.max(1, Math.floor((len - 1) / (w + gap)));
  const start = y0 + Math.floor((len - (n * w + (n - 1) * gap)) / 2);
  const balconies = rng.chance(0.45);
  for (let f = 0; f < floors; f++) {
    const zf = G + 1 + f * FH;
    for (let i = 0; i < n; i++) {
      const u = start + i * (w + gap);
      windowL(t, L, u, zf, style, rng);
      if (balconies && style !== 'alta' && rng.chance(0.6)) balconyL(t, x0, u, u + w, zf, rng);
      else if (rng.chance(0.18) && u + w + 1 <= y1 - 0.5) acUnit(t, x0, u + w, zf + 1);
    }
  }
  // cornisa arriba
  corniceL(t, L, y0, y1, H - 1, '_');
  // cara sur (se ve cuando el vecino es más bajo o en la esquina)
  frontWindows(t, x0, x1, y1, G, FH, floors, rng);
  // bajada de agua
  if (rng.chance(0.4)) L.seg(t, y1 - 0.5, 0.5, 'v', H - 1, '/', -0.25);
  // limpiavidrios colgando del techo
  if (anims && floors >= 4 && y1 - y0 >= 7 && rng.chance(0.3)) anims.push({ type: 'gondola', x: x0, y: y0 + 2, len: 3, z0: G + 1, z1: H - 1, seed: rng.next() });
  if (y1 - y0 >= 9 && rng.chance(0.4)) billboard(t, x0, y0, y1, H, rng);
  else roof(t, x0, x1, y0, y1, H, rng, 1.3, anims);
  return H;
}

// ventanas de paralelogramo /¯¯/ en la cara sur
export function frontWindows(t, x0, x1, y, G, FH, floors, rng, ground = true) {
  const F = new Face('F', y);
  const span = x1 - x0;
  const n = Math.max(1, Math.floor((span - 0.5) / 2.5));
  const s0 = x0 + (span - n * 2.5 + 1) / 2;
  const s = Math.round(s0 * 2) / 2;
  for (let f = 0; f < floors; f++) {
    const zf = G + 1 + f * FH;
    for (let i = 0; i < n; i++) {
      const u = s + i * 2.5;
      F.rect(t, u, u + 1.5, zf, zf + 2, NIGHT.on && rng.chance(0.35) ? () => LITW : null);
      if (rng.chance(0.5)) F.seg(t, u + 0.5, zf, 'v', 2, '/', -1);
      else if (rng.chance(0.3)) F.at(t, u + 0.75, zf + 0.5, 'o', -1.2);
    }
  }
  if (ground && span >= 4) {
    F.rect(t, x0 + 1, x0 + 2.5, 0, 4);
    if (span >= 7) F.rect(t, x0 + 3.5, x1 - 1, 1, 4);
  }
  // cornisa rayada
  F.rect(t, x0, x1, G, G + 1, (c, r, u) => (Number.isInteger(u) ? cc('/') : 0));
}

// --- torre de atrás: campos de puntos con pocas ventanas grandes ------------
// Como en la referencia: superficies texturadas que dan profundidad sin
// competir con la primera fila.
export function tower(t, b, rng, anims, hMax = 34) {
  const { x0, x1, y0, y1 } = b;
  const floors = rng.int(3, Math.max(3, Math.floor((hMax - 3) / 4)));
  const H = 3 + floors * 4;
  const plain = rng.chance(0.35);
  box(t, x0, x1, y0, y1, 0, H, {
    left: plain ? TEX.blank : rng.pick([TEX.colon, TEX.colonOdd, TEX.dots]),
    front: rng.pick([TEX.colon, TEX.blank, TEX.dots]),
    top: rng.pick(ROOFS),
  });
  const L = new Face('L', x0);
  const style = rng.pick(['rombo4', 'rombo', 'alta']);
  const len = y1 - y0;
  const w = style === 'alta' ? 1 : 2;
  const gap = style === 'alta' ? 3 : 3;
  const n = Math.max(1, Math.floor((len - 2) / (w + gap)));
  const start = y0 + Math.floor((len - (n * w + (n - 1) * gap)) / 2);
  const every = rng.pick([1, 2, 2]);
  for (let f = 0; f < floors; f += every) {
    const zf = 2 + f * 4;
    for (let i = 0; i < n; i++) windowL(t, L, start + i * (w + gap), zf, style, rng);
  }
  // cara sur: ventanas /¯¯/ en filas alternas
  const F = new Face('F', y1);
  const span = x1 - x0;
  const m = Math.max(1, Math.floor((span - 1) / 3.5));
  for (let f = 0; f < floors; f += 2) {
    for (let i = 0; i < m; i++) {
      const u = x0 + 1 + i * 3.5;
      F.rect(t, u, u + 1.5, 2 + f * 4, 4 + f * 4);
    }
  }
  roof(t, x0, x1, y0, y1, H, rng, 0.35, anims);
  return H;
}

// --- local bajo del oeste: se le ve el techo, el toldo y la mercadería --------
export function westShop(t, b, rng, anims, opts = {}) {
  const { x0, x1, y0, y1 } = b; // x1 = borde del paseo
  const H = opts.h ?? rng.int(3, 4);
  const shop = opts.shop ?? rng.pick(SHOPS);
  box(t, x0, x1, y0, y1, 0, H, { left: rng.pick([TEX.colon, TEX.dots]), front: TEX.colonOdd, top: rng.pick(ROOFS) });
  // cara sur: puerta y ventana (en la esquina se ve)
  const F = new Face('F', y1);
  F.rect(t, x1 - 2.5, x1 - 1, 0, 2.5);
  F.rect(t, x0 + 1, x0 + 3, 1, 2.5);
  roof(t, x0, x1, y0, y1, H, rng, 0.55, anims);
  // letrero sobre el techo mirando al sur (si el nombre cabe)
  const room = 2 * (x1 - x0 - 1.5);
  let name = shop.name;
  if (name.length > room) name = (SHOPS.find((s) => s.name.length <= room) || { name: '' }).name;
  if (name && rng.chance(0.75)) {
    const sx1 = x1 - 0.5;
    const sx0 = sx1 - Math.ceil((name.length + 1) / 2);
    const sy = Math.min(y1 - 1, y0 + 2 + Math.floor((y1 - y0 - 3) / 2));
    const SF = new Face('F', sy);
    segZ(t, sx0 + 0.5, sy, H, 1, 47, -0.5);
    segZ(t, sx1 - 0.5, sy, H, 1, 47, -0.5);
    SF.rect(t, sx0, sx1, H + 1, H + 2, null, -2.2);
    SF.text(t, sx0 + 0.5, H + 1, name, -2.8);
  }
  if (opts.back) return H;
  // toldo hacia el paseo
  box(t, x1, x1 + 1.5, y0 + 1, y1 - 1, H - 1, H - 0, {
    top: (c, r, u) => (u === x1 + 0.5 || u === x1 + 1 ? cc('\\') : 0),
    front: () => cc('/'),
    bias: -0.3,
  });
  // mercadería, mesas o pizarras en la terraza
  const kind = rng.pick(['crates', 'tables', 'board', 'plants', 'crates']);
  for (let y = y0 + 1; y < y1 - 1; y += rng.int(2, 3)) {
    if (kind === 'crates') stamp(t, CRATE, x1 + 1.5, y + 1, 0, -1);
    else if (kind === 'tables' && rng.chance(0.7)) {
      stamp(t, UMBRELLA, x1 + 2, y + 1, 0, -1);
      stamp(t, CHAIR, x1 + 1, y + 1, 0, -1);
    } else if (kind === 'board' && rng.chance(0.4)) stamp(t, BOARD, x1 + 2, y + 1, 0, -1);
    else if (kind === 'plants') stamp(t, rng.pick(PLANT), x1 + 1, y + 1, 0, -1);
  }
  return H;
}

void segY;
void fillFace;
void hash2;
