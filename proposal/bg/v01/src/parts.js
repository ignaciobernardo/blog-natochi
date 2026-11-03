// Biblioteca de piezas dibujadas a mano: cosas del techo, detalles de fachada y
// mobiliario de la calle. Las piezas con forma de caja usan las primitivas de la
// proyección (así comparten el mismo ángulo); las orgánicas son sprites.
//
// En los sprites los espacios del borde son transparentes, `$` también y `&` es
// un espacio opaco. El ancla (ax, ay) es la esquina que cae sobre el punto del
// mundo.
import { art, FX_WINDOW, FX_BLINK, FX_NIGHT } from './grid.js';

// ------------------------------------------------------------------ sprites
export const SPR = {
  // tanque de agua sobre patas (cilindro vertical: los costados siguen a H)
  tank: art(
    `
     .-~~-.
    (&&&&&&)
   /\`-..-'/
  /&&&&&&&/
 /&&&&&&&/
(&&&&&&&(
 \`-.__.-'
  /| $ /|
 / | $/ |`,
    1,
    9,
  ),
  // tanque bajo y ancho
  tank2: art(
    `
    _.----._
   (&&&&&&&&)
  /\`-.__.-'/
 /&&&&&&&&&/
(&&&&&&&&&(
 \`-.____.-'
 /|  $  /|`,
    1,
    7,
  ),
  // antena de televisión (espina de pescado)
  tv: art(
    `
   _/_
  _/_
  _/_
  /
 /`,
    0,
    5,
  ),
  // parabólica
  dish: art(
    `
  .-.
 (   )o
  '-'/
   _/_`,
    2,
    4,
  ),
  // helipuerto pintado en el techo
  heli: art(
    `
   .-""""-.
  /&&&&&&&&\\
 (&&&&H&&&&&)
  \\&&&&&&&&/
   '-....-'`,
    0,
    5,
  ),
  // jardín en macetas
  plants: art(
    `
 * v , * v
(_)(_)(_)(_)`,
    0,
    2,
  ),
  // pájaros posados
  pigeons: art(`v v  v`, 0, 1),
  // fuente redonda de la plaza: pileta con agua rayada
  fountain: art(
    String.raw`
       _.------._
    .-'==========''-.
   (=====.--''--.=====)
   |'-.=(  _||_  )=.-'|
    '-._'-.____.-'_.-'
        '--------'`,
    3,
    6,
  ),
  // bicicletero
  rack: art(String.raw`n n n n`, 0, 1),
  // hormigonera
  mixer: art(
    String.raw`
  .--.
 ( () )>
  '--'|
  /  /`,
    1,
    4,
  ),
  // sombrilla con alguien tomando sol
  umbrella: art(
    String.raw`
  _.-^-._
     /
 \_o__/`,
    1,
    3,
  ),
  // árbol de vereda: copa punteada y tronco que sube en H
  tree: art(
    String.raw`
    _.--._
   (.:'.:.)
  (:'.:'.:')
   '-._/_.-'
      /
    _/_`,
    5,
    6,
  ),
  tree2: art(
    String.raw`
     .
    /:\
   (:.:)
   (.:')
    \/
    /
  _/_`,
    3,
    7,
  ),
  // farol: poste en H, brazo y lámpara
  lamp: art(
    `
     _o
    /
   /
  /
 /
/`,
    0,
    6,
  ),
  // semáforo
  signal: art(
    `
  .-.
  |o|
  |o|
  '/'
  /
 /
/`,
    0,
    7,
  ),
  bench: art(
    `
  ______
 /_____/
 /    /`,
    0,
    3,
  ),
  hydrant: art(
    `
 n
(H)`,
    0,
    2,
  ),
  bin: art(
    `
 _
[_]`,
    0,
    2,
  ),
  // cartel de la parada
  stopSign: art(
    `
 .--.
 |21|
 '--'
  /
 /
/`,
    0,
    6,
  ),
  // sol de día
  sun: art(
    `
      .   |   .
       \\  :  /
    ' . .-~~-. . '
  _ _  (      )  _ _
    . ' '-..-' ' .
       /  :  \\
      '   |   '`,
    0,
    7,
  ),
  // luna de noche
  moon: art(
    `
   .-~~.
  (  .-'
 (  (
  (  '-.
   '-~~'`,
    0,
    5,
  ),
  // nubes, de grande a chica (versiones lejanas dibujadas aparte)
  cloud0: art(
    `
          .-~~~-.
    .-~~-(&&&&&&&)~-.
  .(&&&&&&&&&&&&&&&&&)-.
 (&&&&&&&&&&&&&&&&&&&&&&)
  '-.______.-~~-.____.-'`,
    0,
    5,
  ),
  cloud1: art(
    `
      .-~~-.
  .-~(&&&&&&)-.
 (&&&&&&&&&&&&&)
  '-..___..--'`,
    0,
    4,
  ),
  cloud2: art(
    `
   .-~-.
 .(&&&&&)-.
(____.____)`,
    0,
    3,
  ),
  cloud3: art(
    `
 .~~.
(____)`,
    0,
    2,
  ),
};

// tamaño en el techo (x, d) de cada cosa
export const PROP_SIZE = {
  tank: [9, 4],
  tank2: [11, 4],
  ac: [4, 3],
  ac2: [6, 3],
  vent: [2, 2],
  chimney: [3, 3],
  antenna: [3, 2],
  tv: [3, 2],
  dish: [5, 2],
  laundry: [13, 2],
  shed: [7, 5],
  solar: [9, 5],
  plants: [12, 2],
  billboard: [16, 2],
  skylight: [6, 4],
  pigeons: [6, 1],
  heli: [13, 5],
  pool: [14, 7],
  pile: [6, 3],
  mixer: [5, 3],
  umbrella: [7, 3],
};

// lista de cosas para un techo según su tamaño
export function pickProps(rng, w, dd, mode) {
  const out = [];
  if (mode === 'terrace') {
    if (rng.chance(0.5)) out.push(rng.pick(['plants', 'laundry', 'ac', 'pigeons']));
    if (rng.chance(0.4)) out.push(rng.pick(['ac', 'vent', 'chimney']));
    return out;
  }
  if (w > 14 && rng.chance(0.55)) out.push(rng.pick(['tank', 'tank2']));
  if (w > 10 && rng.chance(0.5)) out.push('shed');
  const n = Math.floor((w * dd) / 45) + 2;
  if (w > 18 && dd > 9 && rng.chance(0.3)) out.unshift('pool', 'umbrella');
  const pool = ['ac', 'ac', 'ac2', 'vent', 'chimney', 'antenna', 'tv', 'dish', 'laundry', 'solar', 'plants', 'skylight', 'pigeons', 'umbrella'];
  for (let i = 0; i < n; i++) out.push(rng.pick(pool));
  return out;
}

// emisores de humo y otras animaciones ancladas a la capa
function emit(L, kind, x, d, h, extra = {}) {
  (L.emitters ||= []).push({ kind, x, d, h, near: L.near, ...extra });
}

// ------------------------------------------------------------ cosas del techo
export function prop(L, kind, x, d, H, w, dd, rng, b) {
  switch (kind) {
    case 'tank':
    case 'tank2':
      L.spriteAt(x, d + dd, H, SPR[kind]);
      return;
    case 'ac':
    case 'ac2': {
      const ww = kind === 'ac' ? 4 : 6;
      L.box(x, x + ww, d, d + 2, H, H + 2, { top: (xx, dd2, c) => ((c & 1) === 0 ? 61 : 0) });
      // ventilador en el frente
      L.put(x + d + 2 + H + 2, d + 2 - H - 2, 'o');
      if (kind === 'ac2') L.put(x + d + 2 + H + 4, d + 2 - H - 2, 'o');
      return;
    }
    case 'vent':
      L.eh(x, d + 1, H, 2, 124 === 0 ? 0 : 47);
      L.put(x + d + 1 + H + 2, d + 1 - H - 3, 'o');
      emit(L, 'smoke', x + 1, d + 1, H + 3, { small: true });
      return;
    case 'chimney':
      L.box(x, x + 2, d, d + 2, H, H + 4);
      emit(L, 'smoke', x + 1, d + 1, H + 4);
      return;
    case 'antenna':
      mast(L, x + 1, d + 1, H, 6 + Math.floor(rng.next() * 8), rng);
      return;
    case 'tv':
      L.spriteAt(x, d + 1, H, SPR.tv);
      return;
    case 'dish':
      L.spriteAt(x + 1, d + 1, H, SPR.dish);
      return;
    case 'laundry':
      laundry(L, x, d + 1, H, w - 1, rng);
      return;
    case 'shed':
      L.box(x, x + 6, d, d + 4, H, H + 4, { top: (xx, dd2, c, r) => ((c + r) % 3 === 0 ? 46 : 0) });
      L.winFront(x + 2, d + 4, H, 2, 3, 0, (dx, dh) => (dx === 1 && dh === 1 ? 46 : 0));
      return;
    case 'solar':
      for (let i = 0; i < 2; i++) {
        const dz = d + i * 2;
        L.box(x, x + 8, dz, dz + 1, H + 1, H + 2, {
          top: (xx) => ((xx - x) % 2 === 0 ? 92 : 0),
          front: (xx) => ((xx - x) % 2 === 0 ? 92 : 95),
          base: false,
        });
        L.eh(x + 1, dz + 1, H, 1);
        L.eh(x + 7, dz + 1, H, 1);
      }
      return;
    case 'plants':
      L.spriteAt(x, d + 1, H, SPR.plants);
      return;
    case 'pigeons':
      L.spriteAt(x, d + 1, H, SPR.pigeons);
      return;
    case 'skylight':
      L.box(x, x + 6, d, d + 3, H, H + 1, { top: (xx, dd2, c) => ((c & 1) === 0 ? 92 : 0) });
      return;
    case 'billboard':
      billboard(L, x, d + 1, H, w - 1, rng);
      return;
    case 'heli':
      L.spriteAt(x, d + dd, H, SPR.heli);
      return;
    case 'pool': {
      // pileta hundida: agua rayada `=` con ondas `(` y una escalerita
      const x1 = x + w;
      const d1 = d + dd;
      L.top(x, x1, d, d1, H, (xx, dz, c, r) => {
        if ((c * 7 + r * 3) % 11 === 0) return 40;
        return 61;
      });
      L.ex(x, d, H, w);
      L.ex(x, d1, H, w);
      L.ed(x, d, H, dd);
      L.ed(x1, d, H, dd);
      L.put(x + d + H + 2, d - H, 'H');
      return;
    }
    case 'pile':
      // pila de ladrillos o vigas
      L.box(x, x + 5, d, d + 2, H, H + 1, { top: (xx, dz, c) => ((c & 1) === 0 ? 61 : 0), front: (xx) => ((xx & 1) === 0 ? 124 : 0) });
      return;
    case 'mixer':
      L.spriteAt(x, d + 2, H, SPR.mixer);
      return;
    case 'umbrella':
      L.spriteAt(x, d + 2, H, SPR.umbrella);
      return;
    default:
  }
  void b;
}

// mástil con travesaños y baliza
export function mast(L, x, d, H, len, rng) {
  const c = x + d + H;
  const r = d - H - 1;
  for (let i = 0; i < len; i++) {
    L.put(c + i, r - i, 47);
    if (i > 1 && i % 3 === 1 && i < len - 1) {
      L.put(c + i - 1, r - i, 45);
      L.put(c + i + 1, r - i, 45);
    }
  }
  const fx = L.addFx(FX_BLINK, '*', '.', rng.next() * 2, 0.7 + rng.next() * 0.6);
  L.put(c + len, r - len, '*', fx);
}

// tendedero: dos postes en H, cuerda en X y ropa colgada
const CLOTHES = ['[]', '/\\', '||', '()', 'TT', '{}', '<>'];
function laundry(L, x, d, H, w, rng) {
  L.eh(x, d, H, 3);
  L.eh(x + w, d, H, 3);
  L.ex(x, d, H + 3, w);
  // la ropa cuelga de la cuerda: fila de abajo de la línea
  const c0 = x + d + H + 3;
  const r = d - H - 3;
  for (let i = 1; i < w - 2; ) {
    if (rng.chance(0.3)) {
      i++;
      continue;
    }
    const piece = rng.pick(CLOTHES);
    L.put(c0 + i, r, piece[0]);
    L.put(c0 + i + 1, r, piece[1]);
    i += 3;
  }
}

// cartel sobre patas con texto
const SLOGANS = ['CAFE 24H', 'RADIO 98', 'VUELVE', 'HELADOS', 'SUBE YA', 'TE VEO', 'FM CIELO', 'MATE'];
function billboard(L, x, d, H, w, rng) {
  L.eh(x + 2, d, H, 3);
  L.eh(x + w - 2, d, H, 3);
  L.box(x, x + w, d - 1, d, H + 3, H + 8, { top: false });
  const text = rng.pick(SLOGANS).slice(0, w - 3);
  const h = H + 5;
  const c = x + d + h + Math.floor((w - text.length) / 2);
  const fx = L.addFx(FX_NIGHT, 0, 0);
  L.text(c, d - h - 1, text, fx);
}

// ------------------------------------------------------------ fachada
// rombo de cuatro paños en un lado izquierdo, con su moldura `(` `)`
export function diamond(L, X, d, h, a, fx, rng) {
  L.winLeft(X, d, h, a, a, fx);
  if (a >= 3 || rng.chance(0.6)) {
    // cruz interior
    for (let i = 1; i < a; i++) {
      L.ed(X, d, h + i, a);
      L.eh(X, d + i, h, a);
    }
    if (a < 3) {
      // con la cruz no queda vidrio libre: la cruz misma se ilumina de noche
      // (se recolorea con la ventana) — se marca la celda central
    }
  }
  // molduras curvas en los vértices izquierdo y derecho
  if (rng.chance(0.5)) {
    const c = X + d + h;
    const r = d - h;
    L.put(c - 1, r - 1, 40);
    L.put(c + 2 * a, r - 1 + 0, 41);
  }
  if (rng.chance(0.25)) L.put(X + d + a + h + 1, d + a - h, 126); // ~ bajo el rombo
}

// balcón: losa que sale en D y baranda de barrotes `/`
export function balcony(L, x0, x1, D, h, rng) {
  const keep = L.near;
  L.near = D + 1;
  // losa fina de una unidad de fondo
  L.top(x0, x1, D, D + 1, h + 1);
  L.ed(x0, D, h + 1, 1);
  L.ed(x1, D, h + 1, 1);
  L.ex(x0, D + 1, h + 1, x1 - x0);
  // baranda: frente transparente, barrotes cada 3 y pasamanos
  L.front(x0, x1, D + 1, h + 1, h + 3, (x, hh, c, r) => {
    if ((x - x0) % 3 === 0) L.put(c, r, 47);
    return -1;
  });
  L.ex(x0, D + 1, h + 3, x1 - x0);
  L.eh(x0, D + 1, h + 1, 2);
  L.eh(x1, D + 1, h + 1, 2);
  // macetas, ropa o una bici apoyada
  if (rng.chance(0.6)) {
    const c = x0 + 2 + D + 1 + h + 2;
    L.text(c, D + 1 - h - 3, rng.pick(['v * v', '* , *', 'v v', '[] ()', 'o  o']));
  }
  L.near = keep;
}

// aire acondicionado colgado bajo una ventana
export function acUnit(L, x, D, h) {
  const keep = L.near;
  L.near = D + 1;
  L.box(x, x + 3, D, D + 1, h - 1, h, { top: false });
  L.put(x + D + 1 + h - 1 + 1, D + 1 - h, 'o');
  L.near = keep;
}

// cartel vertical perpendicular a la fachada: letras que suben en diagonal
export function bladeSign(L, x, D, h, text, rng) {
  const keep = L.near;
  L.near = D + 3;
  const n = text.length;
  const len = 2 * n + 1;
  const fxOn = L.addFx(FX_BLINK, 0, 32, rng.next() * 3, 1.1 + rng.next());
  L.left(x, D, D + 3, h, h + len);
  L.ed(x, D, h + len, 3);
  L.ed(x, D, h, 3);
  L.eh(x, D, h, len);
  L.eh(x, D + 3, h, len);
  // las letras, de abajo hacia arriba, en el medio del cartel
  for (let i = 0; i < n; i++) {
    const hh = h + 1 + 2 * i;
    const dd = D + 1.5;
    const c = Math.round(x + dd + hh);
    const r = Math.round(dd - hh - 1);
    L.put(c, r, text[n - 1 - i] === ' ' ? 32 : text.charCodeAt(n - 1 - i), text[0] === '*' ? fxOn : 0);
  }
  // soporte
  L.ed(x, D, h + len - 1, 0);
  L.near = keep;
}

// cartel largo pegado a un lado izquierdo: una banda en D con letras que bajan
// en diagonal `\`, como un letrero corrido sobre la pared que se aleja
export function bandSign(L, X, d0, h, text, rng) {
  const keep = L.near;
  L.near = d0 + text.length * 2 + 2;
  const len = text.length * 2 + 1;
  const fx = rng.chance(0.5) ? L.addFx(FX_BLINK, 0, 32, rng.next() * 3, 2.2 + rng.next() * 2) : 0;
  L.left(X, d0, d0 + len, h, h + 3);
  L.ed(X, d0, h + 3, len);
  L.ed(X, d0, h, len);
  L.eh(X, d0, h, 3);
  L.eh(X, d0 + len, h, 3);
  for (let i = 0; i < text.length; i++) {
    const d = d0 + 1 + 2 * i;
    // celda del centro de la banda en (d + 0.5, h + 1.5)
    L.put(X + d + h + 2, d - h - 1, text.charCodeAt(i), fx);
  }
  L.near = keep;
}

// escalera de incendio sobre un frente: plataformas con baranda y tramos que
// zigzaguean. En esta proyección un tramo que sube hacia la derecha (X + H) se
// dibuja `_/_/` y uno que sube hacia la izquierda queda vertical (escalerita H).
export function fireEscape(L, xa, xb, D, h0, h1, F, rng) {
  const keep = L.near;
  // fondo liso detrás, para que se lea
  L.near = D + 0.5;
  L.front(xa - 1, xb + 1, D, h0 - 1, h1 + 1, (x, hh, c, r) => ((c & 3) === 0 && (r & 1) === 0 ? 46 : 0));
  L.near = D + 1.5;
  let k = 0;
  for (let h = h0; h + F <= h1 + F; h += F, k++) {
    // plataforma: losa fina, pasamanos y postes en las puntas
    L.top(xa, xb, D, D + 1, h);
    L.ed(xa, D, h, 1);
    L.ed(xb, D, h, 1);
    L.ex(xa, D + 1, h, xb - xa);
    L.ex(xa, D + 1, h + 2, xb - xa);
    L.eh(xa, D + 1, h, 2);
    L.eh(xb, D + 1, h, 2);
    if (h + F > h1) break;
    // tramo hasta la plataforma de arriba
    const c = xa + 1 + D + 1 + h;
    const r = D + 1 - h;
    if (k % 2 === 0) {
      for (let i = 0; i < F; i++) {
        L.put(c + 2 * i, r - 1 - i, 95);
        L.put(c + 2 * i + 1, r - 1 - i, 47);
      }
    } else {
      const cl = c + 2 * F - 1;
      for (let i = 0; i < F; i++) L.put(cl - (i === 0 ? 0 : 0), r - 1 - i, 72);
    }
  }
  L.near = keep;
  void rng;
}

// cartel grande sobre un frente: marco con texto y lamparitas que titilan
const ADS = ['CAFE NEGRO', 'TANGO HOY', 'HELADOS', 'RADIO 98', 'VUELVE YA', 'LA ESQUINA', 'MATE AMARGO', 'CINE REX'];
export function wallAd(L, xa, D, h, rng) {
  const keep = L.near;
  L.near = D + 1;
  const text = rng.pick(ADS);
  const w = text.length + 6;
  L.box(xa, xa + w, D, D + 1, h, h + 4, { top: false });
  L.front(xa, xa + w, D + 1, h, h + 4, (x, hh, c, r) => {
    if (hh === h + 3 && (x - xa) % 2 === 1) {
      L.put(c, r, 42, L.addFx(FX_BLINK, '*', '·', ((x - xa) >> 1) * 0.25, 0.5));
      return -1;
    }
    return 0;
  });
  // texto centrado en la fila del medio
  const hh = h + 1;
  const r = D + 1 - hh - 1;
  const c = xa + D + 1 + hh + 3;
  L.text(c, r, text, L.addFx(FX_NIGHT, 0, 0));
  L.near = keep;
}

// local comercial en planta baja: vidriera, puerta, toldo y nombre
const SHOPS = [
  { name: 'PAN', goods: 'o0o0o' },
  { name: 'CAFE', goods: 'u u u' },
  { name: 'LIBROS', goods: '|/||/' },
  { name: 'FLORES', goods: '*v*v*' },
  { name: 'FRUTAS', goods: 'o.0.o' },
  { name: 'DISCOS', goods: 'o o o' },
  { name: 'FARMACIA', goods: '+ . +' },
  { name: 'BAR', goods: 'i i i' },
  { name: 'TELAS', goods: '/// /' },
  { name: 'RELOJES', goods: 'o . o' },
];
export function storefront(L, b, m, rng) {
  const D = m.d1;
  const w = m.x1 - m.x0;
  const shop = b.shop === true ? rng.pick(SHOPS) : b.shop;
  // puerta
  const xd = m.x0 + 2 + Math.floor(rng.next() * Math.max(1, w - 14));
  L.winFront(xd, D, 0, 3, 4, 0, (dx, dh) => (dx === 2 && dh === 1 ? 46 : 0));
  // vidrieras
  for (let x = m.x0 + 2; x + 7 < m.x1 - 1; x += 9) {
    if (x + 7 > xd - 1 && x < xd + 5) continue;
    const fx = L.addFx(FX_NIGHT, 0, 0);
    L.winFront(x, D, 1, 7, 3, fx, (dx, dh) => (dh === 0 && dx > 0 ? shop.goods.charCodeAt((dx - 1) % shop.goods.length) : 0));
  }
  // toldo a rayas con volado
  if (rng.chance(0.75)) {
    const keep = L.near;
    L.near = D + 3;
    const x0 = m.x0 + 1;
    const x1 = Math.min(m.x1 - 1, x0 + Math.max(10, Math.floor(w * 0.6)));
    L.top(x0, x1, D, D + 3, 5, (x) => ((x - x0) % 2 === 0 ? 92 : 0));
    L.ex(x0, D, 5, x1 - x0);
    L.ed(x0, D, 5, 3);
    L.ed(x1, D, 5, 3);
    L.front(x0, x1, D + 3, 4, 5, (x) => ((x - x0) % 2 === 0 ? 118 : 39));
    L.near = keep;
  }
  // nombre sobre la puerta
  const fx = L.addFx(FX_NIGHT, 0, 0);
  const tx = m.x0 + Math.max(2, Math.floor((w - shop.name.length) / 2));
  L.text(tx + D + 6, D - 7, shop.name, fx);
}

// ------------------------------------------------------------ calle
export function lamp(L, x, d, rng) {
  L.spriteAt(x, d, 0, SPR.lamp);
  const fx = L.addFx(FX_NIGHT, '○', 0);
  L.put(x + d + 6, d - 6, 'o', fx);
  emit(L, 'lamp', x, d, 6);
  void rng;
}

export function tree(L, x, d, rng) {
  L.spriteAt(x, d, 0, rng.chance(0.6) ? SPR.tree : SPR.tree2);
}

export { emit };

// ------------------------------------------------------------ grúa torre
// Mástil reticulado en H, pluma en X hacia la derecha, contrapluma con
// contrapeso, tirantes punteados y balizas. El carro y el gancho se mueven
// (actors.js, emisor 'crane').
export function crane(L, x, d, H, M, J, rng) {
  const keep = L.near;
  L.near = d + 2;
  const c0 = x + d + H;
  const r0 = d - H - 1;
  // mástil: dos montantes `/` y celosía alternada entre ellos
  for (let i = 0; i < M; i++) {
    L.put(c0 + i, r0 - i, 47);
    L.put(c0 + i + 2, r0 - i, 47);
    L.put(c0 + i + 1, r0 - i, i % 2 ? 92 : 95);
  }
  // pluma y contrapluma a la altura de la punta del mástil
  const rt = r0 - M; // fila de la celosía
  const cj = c0 + M; // columna del mástil arriba
  const K = 11;
  for (let j = -K; j <= J; j++) {
    L.put(cj + j, rt - 1, 95);
    const k = ((j % 3) + 3) % 3;
    L.put(cj + j, rt, k === 0 ? 92 : k === 1 ? 95 : 47);
  }
  L.put(cj + J + 1, rt, 47);
  // cabina
  L.text(cj - 2, rt + 1, '[o]');
  // contrapeso
  L.text(cj - K, rt + 1, '|▓▓|');
  L.text(cj - K, rt + 2, '¯¯¯¯');
  // torreta (sigue a H) y tirantes punteados hasta las puntas
  for (let i = 1; i <= 4; i++) L.put(cj + i, rt - 1 - i, 47);
  const ac = cj + 4;
  const ar = rt - 5;
  const tie = (tc) => {
    const n = Math.abs(tc - ac);
    for (let k = 2; k < n; k += 2) {
      const cc = Math.round(ac + ((tc - ac) * k) / n);
      const rr = Math.round(ar + ((rt - 1 - ar) * k) / n);
      if (rr < rt - 1) L.put(cc, rr, 46);
    }
  };
  tie(cj + J);
  tie(cj - K + 1);
  const fx1 = L.addFx(FX_BLINK, '*', '.', 0, 0.9);
  const fx2 = L.addFx(FX_BLINK, '*', '.', 0.45, 0.9);
  L.put(ac + 1, ar - 1, '*', fx1);
  L.put(cj + J + 1, rt - 1, '*', fx2);
  emit(L, 'crane', x, d, H, { c: cj, r: rt, J, near: d + 2 });
  L.near = keep;
  void rng;
}

// kiosco de diarios: caja chica con revistas colgadas, toldo y nombre
export function kiosk(L, x, d) {
  const keep = L.near;
  L.near = d + 4;
  L.box(x, x + 9, d, d + 4, 0, 5, {
    top: (xx, dd, c, r) => ((c + r) % 4 === 0 ? 46 : 0),
    left: (dd, hh, c) => (hh > 1 && hh < 4 && (c & 1) === 0 ? 58 : 0),
    front: (xx, hh) => (hh === 2 ? ((xx & 1) === 0 ? 91 : 93) : hh === 1 ? ((xx & 1) === 0 ? 61 : 0) : 0),
  });
  // toldo corto
  L.top(x - 1, x + 10, d + 4, d + 6, 4, (xx) => ((xx & 1) === 0 ? 92 : 0));
  L.ed(x - 1, d + 4, 4, 2);
  L.ed(x + 10, d + 4, 4, 2);
  L.ex(x - 1, d + 6, 4, 11);
  L.front(x - 1, x + 10, d + 6, 3, 4, (xx) => ((xx & 1) === 0 ? 118 : 39));
  // nombre en el techo, que se lee desde arriba
  const fx = L.addFx(FX_NIGHT, 0, 0);
  L.text(x + d + 5 + 2, d + 2 - 5, 'DIARIOS', fx);
  L.near = keep;
}

// macetero con árbol
export function planter(L, x, d, rng) {
  const keep = L.near;
  L.near = d + 3;
  L.box(x, x + 5, d, d + 3, 0, 1, { top: (xx, dd, c) => ((c & 1) === 0 ? 46 : 0) });
  L.spriteAt(x + 1, d + 2, 1, rng.chance(0.5) ? SPR.tree : SPR.tree2);
  L.near = keep;
}
