// Gente (y bichos) de los locales.
//
// Los glifos no escalan: una persona cerca de la pantalla se dibuja con más
// filas que una junto a la pared del fondo. `persona(h, o)` arma la figura a
// cualquier alto por procedimiento (cabeza, hombros, brazos con contorno,
// torso, piernas y zapatos) y la guarda en caché. Debajo de 9 filas se usan
// figuras chicas dibujadas a mano.
//
// Cada figura devuelve un sprite { w, h, data, cx } donde cx es la columna del
// eje del cuerpo: los cuadros de una misma figura comparten cx, así que se
// pueden alternar sin que la figura salte.
import { SP, T, frames } from './util.js';

const R = String.raw;

// alto (en filas) de una persona de pie a profundidad z
// (en pantallas angostas un poco menos, para que quepan de a dos)
export const altoA = (room, z) => Math.max(4, Math.round((room.rows * (room.cols < 90 ? 0.28 : 0.33)) / z));

// --- figuras chicas (lejos) --------------------------------------------------

const CHICAS = {
  4: frames(R`
 o
/|\
 |
/ \
--
 o
/|\
 |
 |\
--
 o_
/|
 |
/ \
--
 o
/|\
 |
 ||
`),
  6: frames(R`
 _
(_)
/|\
 |
/ \
/ \
--
 _
(_)
/|\
 |
 |\
 | \
--
 _
(_)_
/|
 |
/ \
/ \
--
 _
(_)
/|\
 |
 ||
 ||
`),
  7: frames(R`
  _
 (_)
 /|\
/ | \
  |
 / \
/   \
--
  _
 (_)
 /|\
/ | \
  |
  |\
  | \
--
  _
 (_)_
 /|
/ |
  |
 / \
/   \
--
  _
 (_)
 /|\
/ | \
 _|_
 | |
 | |
`),
};
// orden de los cuadros chicos: parado, paso, alza, sentado
const CH_POSE = { parado: 0, pasoA: 0, pasoB: 1, alza: 2, saluda: 2, manos: 0, lleva: 0, toma: 2, sentado: 3 };

function chica(h, pose) {
  const k = h <= 5 ? 4 : h <= 6 ? 6 : 7;
  const s = CHICAS[k][CH_POSE[pose] ?? 0];
  return { ...s, cx: Math.floor(s.w / 2) };
}

// --- figuras grandes, por procedimiento --------------------------------------

class Lienzo {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.d = new Uint16Array(w * h);
  }
  p(c, r, ch) {
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return;
    this.d[r * this.w + c] = typeof ch === 'number' ? ch : ch.charCodeAt(0);
  }
  t(c, r, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== '¤') this.p(c + i, r, s[i] === '·' ? '·' : s[i]);
  }
  // relleno opaco entre el primer y el último glifo de cada fila; las filas
  // vacías de arriba se recortan (las figuras se apoyan por los pies)
  sprite(cx) {
    const { w, d } = this;
    let top = 0;
    while (top < this.h - 1 && !d.subarray(top * w, (top + 1) * w).some((v) => v)) top++;
    const h = this.h - top;
    const data = new Uint16Array(w * h);
    for (let r = 0; r < h; r++) {
      let a = -1;
      let b = -1;
      const o = (r + top) * w;
      for (let c = 0; c < w; c++) if (d[o + c]) {
        if (a < 0) a = c;
        b = c;
      }
      for (let c = 0; c < w; c++) {
        const v = d[o + c];
        data[r * w + c] = v === 32 ? SP : v ? v : a >= 0 && c > a && c < b ? SP : T;
      }
    }
    return { w, h, data, cx };
  }
}

// cabezas de 3 filas (5 de ancho); la tercera es el cuello con los hombros
const CARAS = {
  frente: ['.-.', '(o o)', ')-('],
  puntos: ['.-.', '(· ·)', ')-('],
  lentes: ['.-.', '(o-o)', ')-('],
  bigote: ['.-.', '(o o)', ')~('],
  barba: ['.-.', '(o o)', ')w('],
  espalda: ['.-.', '(   )', ')-('],
  feliz: ['.-.', '(^ ^)', ')-('],
  cierra: ['.-.', '(- -)', ')-('],
  lupa: ['.-.', '(O o)', ')-('],
};

// lo que va encima de la cabeza (filas extra)
const SOMBREROS = {
  gorro: [' .-.-. ', '(     )'],
  jockey: ['___', '(___)_'],
  moño: ['o'],
  pañuelo: ['.-.', '/___\\'],
  sombrero: ['_|_|_'],
  boina: ['_,_'],
  audifonos: ['.-.', '[(   )]'],
};

// opciones: { pose, cara, gorro, ropa, pelo }
//   pose: parado | pasoA | pasoB | manos | alza | saluda | lleva | toma | sentado
//   ropa: camisa | delantal | bata | vestido | rayas | abrigo | polera
export function persona(h, o = {}) {
  const pose = o.pose || 'parado';
  if (h < 9) return chica(h, pose);
  const key = [h, pose, o.cara, o.gorro, o.ropa, o.pelo, o.objeto, o.sienta || 0].join('|');
  let s = cache.get(key);
  if (!s) {
    s = grande(h, pose, o);
    cache.set(key, s);
  }
  return s;
}
const cache = new Map();

function grande(h, pose, o) {
  const cara = CARAS[o.cara || 'frente'] || CARAS.frente;
  const hat = o.gorro ? SOMBREROS[o.gorro] || [] : [];
  const ropa = o.ropa || 'camisa';
  // medidas
  const iw = h < 12 ? 1 : h < 17 ? 3 : h < 23 ? 5 : 7; // ancho interior del torso
  const half = (iw + 1) / 2; // del eje a la línea del torso
  const big = h >= 19; // cabeza grande, de 4 filas
  const tRows = Math.max(4, Math.round(h * (big ? 0.33 : 0.34))); // filas de torso (hombro a cadera)
  const a = tRows - 1; // filas de brazo (hombro a mano)
  const sitting = pose === 'sentado' || !!o.sienta;
  const hr = hat.length;
  const headRows = 3;
  let L = h - headRows - tRows - 1; // filas de pierna
  if (sitting) L = Math.max(2, Math.round(L * 0.55));
  const busto = o.sienta === 'busto'; // sentado, sin piernas (las tapa la mesa o el asiento)
  if (busto) L = -1;
  const dmax = h < 14 ? 2 : h < 20 ? 3 : 4; // cuánto se abren los brazos
  const W = iw + 2 + 2 * (dmax + 4) + 2;
  const cx = Math.floor(W / 2);
  const pad = 4; // lugar para un brazo levantado
  const H = pad + hr + headRows + tRows + L + 1;
  const g = new Lienzo(W, H);
  const tl = cx - half; // línea izquierda del torso
  const tr = cx + half;
  // sombrero
  for (let i = 0; i < hr; i++) g.t(cx - Math.floor(hat[i].length / 2), pad + i, hat[i]);
  // cabeza
  const r0 = pad + hr;
  const covered = o.gorro === 'gorro' || o.gorro === 'pañuelo' || o.gorro === 'audifonos';
  const ojos = cara[1].slice(1, 4);
  let rn;
  if (big) {
    // cabeza grande: frente, ojos, mandíbula y cuello
    if (!covered) g.t(cx - 2, r0, '.---.');
    else if (o.gorro === 'gorro') g.t(cx - 2, r0, '|___|');
    g.t(cx - 3, r0 + 1, '( ' + ojos + ' )');
    rn = r0 + 2;
    g.t(cx - 2, rn, ojos === '   ' ? '\\   /' : cara[2][1] === '~' ? '\\~~~/' : cara[2][1] === 'w' ? '\\www/' : '\\ - /');
    if (o.pelo === 'largo') {
      g.p(cx - 4, r0 + 1, '(');
      g.p(cx + 4, r0 + 1, ')');
      g.p(cx - 4, r0 + 2, '(');
      g.p(cx + 4, r0 + 2, ')');
    }
    if (o.gorro === 'audifonos') {
      g.p(cx - 4, r0 + 1, '[');
      g.p(cx + 4, r0 + 1, ']');
    }
  } else {
    if (!covered) g.t(cx - 1, r0, cara[0]);
    else if (o.gorro === 'gorro') g.t(cx - 2, r0, '|___|');
    if (o.gorro === 'audifonos') g.t(cx - 3, r0 + 1, '[');
    g.t(cx - 2, r0 + 1, cara[1]);
    if (o.gorro === 'audifonos') g.t(cx + 3, r0 + 1, ']');
    if (o.pelo === 'largo') {
      g.p(cx - 3, r0 + 1, '(');
      g.p(cx + 3, r0 + 1, ')');
      g.p(cx - 3, r0 + 2, '/');
      g.p(cx + 3, r0 + 2, '\\');
    }
    rn = r0 + 2;
  }
  // cuello y hombros
  if (!big) g.t(cx - 1, rn, cara[2]);
  const nk = big ? 2 : 1; // medio ancho del cuello
  for (let c = tl - 1 + (iw === 1 ? 1 : 0); c < cx - nk; c++) g.p(c, rn, '_');
  for (let c = cx + nk + 1; c <= tr + 1 - (iw === 1 ? 1 : 0); c++) g.p(c, rn, '_');
  const s0 = rn + 1; // fila de los hombros
  const hip = s0 + tRows - 1;
  // torso
  for (let r = s0 + 1; r <= hip; r++) {
    g.p(tl, r, '|');
    g.p(tr, r, '|');
  }
  for (let c = tl + 1; c < tr; c++) g.p(c, hip, '_');
  for (let c = tl; c <= tr; c++) if (!g.d[s0 * W + c]) g.p(c, s0, ' ');
  ropaTorso(g, ropa, cx, tl, tr, s0, hip, iw);
  // brazos
  brazo(g, -1, pose, cx, tl, tr, s0, a, dmax, o);
  brazo(g, 1, pose, cx, tl, tr, s0, a, dmax, o);
  // piernas
  if (!busto) piernas(g, sitting ? 'sentado' : pose, ropa, cx, tl, tr, hip, L, H, iw);
  return g.sprite(cx);
}

function ropaTorso(g, ropa, cx, tl, tr, s0, hip, iw) {
  if (iw < 3) {
    if (ropa === 'delantal' || ropa === 'bata') g.p(cx, hip - 1, ropa === 'bata' ? '·' : ':');
    return;
  }
  if (ropa === 'camisa' || ropa === 'bata' || ropa === 'abrigo') {
    // cuello de la camisa
    g.t(cx - 1, s0, '\\ /');
    for (let r = s0 + 2; r < hip; r += 2) g.p(cx, r, '·');
  } else if (ropa === 'delantal') {
    g.p(tl + 1, s0 + 1, '\\');
    g.p(tr - 1, s0 + 1, '/');
    for (let r = s0 + 2; r < hip; r++) {
      g.p(tl + 1, r, '|');
      g.p(tr - 1, r, '|');
    }
    if (hip - s0 > 3) g.t(cx - 1 + (iw > 3 ? 0 : 0), hip - 1, iw > 3 ? '[_]' : '_');
  } else if (ropa === 'rayas') {
    for (let r = s0 + 1; r < hip; r++) for (let c = tl + 1; c < tr; c++) g.p(c, r, r % 2 ? '-' : ' ');
  } else if (ropa === 'polera') {
    if (hip - s0 > 3) g.t(cx - 1, s0 + 2, iw > 3 ? '(*)' : '*');
  } else if (ropa === 'vestido') {
    g.t(cx - 1, s0, '\\_/');
  }
}

// un brazo: side -1 izquierdo (de la pantalla), 1 derecho
function brazo(g, side, pose, cx, tl, tr, s0, a, dmax, o) {
  const A0 = side < 0 ? tl - 1 : tr + 1; // dónde arranca la línea de afuera
  const out = side < 0 ? '/' : '\\';
  const inw = side < 0 ? '\\' : '/';
  const P = (k, d, ch) => g.p(A0 + side * d, s0 + k, ch);
  const right = side > 0;
  const up = (pose === 'alza' || pose === 'saluda' || pose === 'toma') && right;
  if (up) return brazoArriba(g, pose, A0, s0, a, o);
  const work = pose === 'manos' || (pose === 'mano1' && right);
  const carry = pose === 'lleva' && right;
  P(0, 0, out);
  const d0 = Math.min(dmax, a - 1);
  for (let k = 1; k < a; k++) {
    const d = Math.min(k, d0);
    const diag = k <= d0;
    const ch = diag ? out : '|';
    if (k === a - 1 && work) {
      // la mano se dobla hacia adelante y al centro (apoyada en el mesón)
      const dd = Math.min(k - 1, d0);
      P(k, dd - 1, inw);
      P(k, dd - 2, '_');
      P(k, dd - 3, side < 0 ? ')' : '(');
    } else if (k === a - 1) {
      // la mano
      P(k, d, side < 0 ? '(' : ')');
      P(k, d - 1, '_');
      P(k, d - 2, diag ? out : side < 0 ? ')' : '(');
    } else {
      P(k, d, ch);
      P(k, d - 2, ch);
    }
  }
  if (carry) {
    // una bolsa colgando de la mano
    const c = A0 + side * (d0 - 1);
    g.t(c - 2, s0 + a, '.-^-.');
    g.t(c - 2, s0 + a + 1, '|___|');
  }
}

// brazo derecho levantado (tijeras, saludar, la pala del pan) o a la boca
function brazoArriba(g, pose, A0, s0, a, o) {
  const fl = a < 5 ? 1 : a < 7 ? 2 : 3; // largo del antebrazo
  if (pose === 'toma') {
    // la taza junto a la boca
    g.t(A0 - 1, s0 - 2, ' _ ');
    g.t(A0 - 1, s0 - 1, '|_|)');
    g.t(A0, s0, '\\ \\');
    g.t(A0 + 1, s0 + 1, '\\_)');
    return;
  }
  // antebrazo vertical junto a la cabeza
  for (let k = 1; k <= fl; k++) {
    g.p(A0 + 2, s0 - k, '|');
    g.p(A0 + 4, s0 - k, '|');
  }
  g.t(A0, s0, '\\_| |');
  g.t(A0 + 1, s0 + 1, '\\__/');
  const yh = s0 - fl - 1;
  const hand = o.objeto || (pose === 'saluda' ? 'mano' : 'puño');
  const ob = OBJ[hand] || OBJ.puño;
  const dx = hand === 'mano' ? 1 : 2;
  for (let i = 0; i < ob.length; i++) g.t(A0 + dx, yh - (ob.length - 1 - i), ob[i]);
}

// lo que se tiene en la mano levantada: filas de arriba hacia la mano
const OBJ = {
  puño: ['(_)'],
  mano: ['\\|//'],
  tijera: ['(><'],
  peineta: ['(_)E'],
  pala: ['(_)'],
  espatula: ['   _', '(_)/'],
  cono: [' ()', ' \\/', '(_)'],
  vaso: [' _', '(_)|]'],
  taza: ['  ~', '(_)D'],
  lupa: ['(_)O'],
  llave: ['(_)<'],
  disco: [' ___', '(_○_)'],
  flor: [' *', '\\|', '(_)'],
  bandeja: ['()()', '¯¯¯¯¯', '(_)'],
  paño: ['(_)~'],
  libro: [' __', '(_)|'],
};

function piernas(g, pose, ropa, cx, tl, tr, hip, L, H, iw) {
  const feet = H - 1;
  const sit = pose === 'sentado';
  const walkA = pose === 'pasoA';
  let r = hip + 1;
  // faldas y batas por encima de las piernas
  let skirt = 0;
  if (ropa === 'vestido') skirt = Math.max(2, Math.round(L * 0.5));
  if (ropa === 'bata' || ropa === 'abrigo') skirt = Math.max(2, Math.round(L * 0.6));
  if (ropa === 'delantal') skirt = Math.max(1, Math.round(L * 0.35));
  if (sit) skirt = Math.min(skirt, 1);
  for (let k = 0; k < skirt && r < feet; k++, r++) {
    const flare = ropa === 'vestido' ? k + 1 : ropa === 'delantal' ? 0 : Math.floor(k / 2);
    const lc = tl - flare;
    const rc = tr + flare;
    const last = k === skirt - 1;
    g.p(lc, r, ropa === 'vestido' || flare ? '/' : '|');
    g.p(rc, r, ropa === 'vestido' || flare ? '\\' : '|');
    for (let c = lc + 1; c < rc; c++) g.p(c, r, last ? '_' : ' ');
    if (!last && (ropa === 'bata' || ropa === 'abrigo')) g.p(cx, r, k % 2 ? ' ' : '·');
    if (ropa === 'delantal' && !last && iw >= 3) g.p(cx, r, ' ');
  }
  const n = feet - r; // filas que quedan para las piernas
  if (sit) {
    // rodillas hacia adelante y canillas
    g.p(tl, r, '|');
    g.p(tr, r, '|');
    for (let c = tl + 1; c < tr; c++) g.p(c, r, '_');
    g.p(cx, r, '|');
    r++;
    for (; r < feet; r++) {
      g.p(tl, r, '|');
      g.p(tr, r, '|');
      g.p(cx, r, '|');
    }
    g.t(tl - 1, feet, '(_');
    g.t(tr, feet, '_)');
    for (let c = tl + 1; c < tr; c++) g.p(c, feet, '_');
    g.p(cx, feet, '|');
    return;
  }
  const thin = ropa === 'vestido';
  if (walkA) {
    // piernas abiertas: una adelante y otra atrás
    const cap = iw >= 5 ? 4 : iw >= 3 ? 3 : 2;
    // los muslos bajan rectos y las canillas se abren
    const k0 = Math.max(0, n - cap - 1);
    for (let k = 0; k < n; k++, r++) {
      const d = Math.max(0, Math.min(k - k0, cap));
      const sl = k > k0 ? '/' : '|';
      const bs = k > k0 ? '\\' : '|';
      if (thin) {
        g.p(cx - 1 - d, r, sl);
        g.p(cx + 1 + d, r, bs);
      } else {
        g.p(tl - d, r, sl);
        g.p(tr + d, r, bs);
        if (k <= k0) g.p(cx, r, '|');
        else {
          g.p(cx - d, r, sl);
          g.p(cx + d, r, bs);
        }
      }
    }
    const d = Math.min(n, cap);
    if (thin) {
      g.t(cx - 2 - d, feet, '_/');
      g.t(cx + 1 + d, feet, '\\_');
    } else {
      g.p(tl - d - 1, feet, '(');
      for (let c = tl - d; c < cx - d; c++) g.p(c, feet, '_');
      g.p(cx - d, feet, '/');
      g.p(cx + d, feet, '\\');
      for (let c = cx + d + 1; c <= tr + d; c++) g.p(c, feet, '_');
      g.p(tr + d + 1, feet, ')');
    }
    return;
  }
  for (; r < feet; r++) {
    if (thin) {
      g.p(cx - 1, r, '|');
      g.p(cx + 1, r, '|');
    } else {
      g.p(tl, r, '|');
      g.p(tr, r, '|');
      g.p(cx, r, '|');
    }
  }
  if (pose === 'pasoB' && n > 2) {
    // una rodilla doblada
    g.p(tr, feet - 2, '\\');
    g.p(tr + 1, feet - 1, ')');
    g.p(tr, feet - 1, ' ');
  }
  if (thin) g.t(cx - 2, feet, '_| |_'.replace(' ', '_'));
  else {
    g.t(tl - 1, feet, '(');
    for (let c = tl; c < tr; c++) g.p(c, feet, '_');
    g.p(cx, feet, '|');
    g.t(tr, feet, '_)');
  }
}

// --- sentados, gatos y perros --------------------------------------------------

export const GATO = {
  sentado: frames(R`
 /\_/\
( o.o )
 > ^ <
 (   )~
--
 /\_/\
( -.- )
 > ^ <
 (   )~
--
 /\_/\
( o.o )
 > ^ <
~(   )
`),
  echado: frames(R`
  /\_/\
 ( -.- )___
  ¯¯¯¯(___)~
--
  /\_/\
 ( -.- )___
  ¯¯¯¯(___)
`),
  chico: frames(R`
 /\_/\
(_o.o_)~
--
 /\_/\
(_-.-_)~
--
 /\_/\
(_o.o_)
`),
  lava: frames(R`
 /\_/\
( o.o )
 > ^ <
 (   )~
--
 /\_/\
( -.- )
 > v<|
 (   )~
--
 /\_/\
( -.- )
 > ^ <
 (   )~
`),
};

export const PERRO = frames(R`
   __
o-''|\_____/)
 \_/|_)     )
    \  __  /
    (_/ (_/
--
   __
o-''|\_____/)
 \_/|_)     )~
    \  __  /
    (_/ (_/
`);
