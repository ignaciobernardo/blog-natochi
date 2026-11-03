// Muebles en perspectiva, armados con cajas (Kit.box) para que crezcan con la
// pantalla, y los objetos chicos (libros, tazas, ollas, cuadros) como sprites.
// Las medidas van en metros; la profundidad, en metros convertidos con K.dz().
import { SP, R, sprite, frames, hash2, now } from './casa-kit.js';

// --- objetos chicos ----------------------------------------------------------
export const OBJ = {
  cup: sprite(R`
 _
(_]`),
  cup2: sprite(R`
.-.
|_|)`),
  mug: sprite(R`
 __
|  |)
|__|`),
  glass: sprite(R`
\ /
|_|`),
  wine: sprite(R`
\_/
 |
 ¯`),
  bottle: sprite(R`
 _
| |
/ \
|_|`),
  vase: sprite(R`
\|/
(_)`),
  vase2: sprite(R`
 \:/
 ):(
(___)`),
  flowers: sprite(R`
o * o
 \|/
 (_)`),
  fruit: sprite(R`
 o°o
(___)`),
  bread: sprite(R`
 .--.
(____)`),
  book: sprite(R`
 ____
/___/`),
  books: sprite(R`
|‖|:|
|‖|:|`),
  books2: sprite(R`
 _
|:|‖/
|:|/|`),
  remote: sprite(R`[:::]`),
  phone: sprite(R`[=]`),
  frame: sprite(R`
 _
|o|
¯¯¯`),
  candle: sprite(R`
 ,
 |
_|_`),
  pot: sprite(R`
  ___
-|___|-`),
  pot2: sprite(R`
 _____
 |___|
-|___|-`),
  pan: sprite(R`
 ____
(____)----`),
  kettle: sprite(R`
  _
 (_)
/___\>`),
  teapot: sprite(R`
  _
 (_)_
(___)>`),
  radio: sprite(R`
  ___/
 |o::o|`),
  plantS: sprite(R`
\|/
(_)`),
  plantM: sprite(R`
 \ | /
\\|//
 \|/
 |_|`),
  plantL: sprite(R`
  \  |  /
 \ \ | / /
  \ \|/ /
 -.\\|//.-
    \|/
   |___|
    \_/`),
  cactus: sprite(R`
 _
| |_
|_| |
\___/`),
  palm: sprite(R`
 \\ //
\\\|///
 \\|//
  |||
 [___]`),
  hangPlant: sprite(R`
  |
 _|_
 \_/
 )|(
 ( )`),
  fern: sprite(R`
 .\|/.
(\\|//)
 \_|_/`),
  globe: sprite(R`
 .-.
(:::)
 ª-'
 _|_`),
  lampT: sprite(R`
 .-.
/___\
  |
 _|_`),
  lampD: sprite(R`
  __
 /_/
 |
_|_`),
  typewriter: sprite(R`
 _____
|_o_o_|
[:::::]`),
  metronome: sprite(R`
  .
 / \
/___\
`),
  record: sprite(R`
 _____
|(o)  |
|_____|`),
  speaker: sprite(R`
.---.
| o |
| O |
'---'`),
  basket: sprite(R`
\~~~/
|___|`),
  slippers: sprite(R`.. ..`),
  shoes: sprite(R`
 _  _
(_)(_)`),
  ball: sprite(R`(o)`),
  blocks: sprite(R`
 [A]
[B][C]`),
  bowl: sprite(R`\__/`),
  toaster: sprite(R`
 ____
|_||_|`),
  jar: sprite(R`
 _  _
|°||:|`),
  laptop: sprite(R`
 ____
|    |
|____|
/____\
`),
  papers: sprite(R`
 __
|==|_
|==|=|`),
  ashtray: sprite(R`(_)`),
  alarm: sprite(R`
 ___
|   |`),
  umbrella: sprite(R`
 /\
/||\
 ||
 J`),
};

// cuadros para colgar (el fondo de la pared queda opaco)
export const FRAMES = {
  paisaje: sprite(R`
 ________
| /\  _  |
|/  \/ \~|
|________|`),
  mar: sprite(R`
 _______
|  ☼    |
|~~~~~~~|
|_______|`),
  retrato: sprite(R`
  .---.
 / .-. \
| (· ·) |
 \ ) ( /
  ª---'`),
  flores: sprite(R`
 _____
| o*o |
|  Y  |
|_(_)_|`),
  abstracto: sprite(R`
 _________
| ::: /\  |
| :::/  ○ |
|_________|`),
  barco: sprite(R`
 _______
|   |\  |
|  _|_\ |
|~\___/~|
|_______|`),
  foto: sprite(R`
 ___
|o o|
|___|`),
  foto2: sprite(R`
 ____
| o  |
|_/\_|`),
  espejo: sprite(R`
 .-.
(   )
(   )
 ª-'`),
  afiche: sprite(R`
 _____
|JAZZ |
| ♪ ♫ |
| /|  |
|_____|`),
  mapa: sprite(R`
 ________
| .-~-.  |
|(  :  ) |
| ª-.-'° |
|________|`),
  diploma: sprite(R`
 ______
|::::::|
| ~~~~ |
|___o__|`),
  plato: sprite(R`
 .-.
( o )
 ª-'`),
  dibujo: sprite(R`
 _____
| ☼   |
| /\o |
|/__\|]`),
};

// --- relleno de libros ----------------------------------------------------------
// glifo de un lomo según una semilla de columna y repisa
export function spine(c, k, seed) {
  const h = hash2(c * 7 + seed, k * 13);
  return h < 0.5 ? '|' : h < 0.66 ? ':' : h < 0.76 ? '‖' : h < 0.82 ? '/' : h < 0.88 ? '¦' : h < 0.93 ? ' ' : 'Ø';
}

// --- sillón de frente, contra una pared -------------------------------------------
// Devuelve dónde se sienta la gente (X de cada lugar, z y alto del asiento).
export function sofaFront(K, Xc, z1, wm = 2, o = {}) {
  const W = Math.min(wm * K.MX, K.cols * 0.38);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const d = K.dz(0.85);
  const z0 = z1 - d;
  const zb = z1 - K.dz(0.22);
  const arm = Math.max(2, W * 0.08);
  const seed = K.seed;
  const n = W > K.MX * 1.4 ? 3 : 2;
  const pat = o.pattern || 'liso';
  const up = (c, r) => (pat === 'puntos' ? ((c + r) % 3 === 0 ? '.' : SP) : pat === 'rayas' ? (c % 3 === 0 ? ':' : SP) : SP);
  // respaldo
  K.box(X0 + arm * 0.5, X1 - arm * 0.5, 0.95, zb, z1, {
    front: (c, r, u, v) => {
      const i = Math.floor(u * n);
      const edge = Math.floor((u + 0.5 / (X1 - X0)) * n) !== i;
      if (edge && v > 0.12) return '|';
      if (v < 0.12) return SP;
      return up(c, r);
    },
  });
  // asiento con cojines
  K.box(X0 + arm, X1 - arm, 0.48, z0, zb, {
    base: 0.1,
    front: (c, r, u, v) => {
      const i = Math.floor(u * n);
      const j = Math.floor((u + 1 / Math.max(2, K.sx(X1, z0) - K.sx(X0, z0))) * n);
      if (i !== j) return '|';
      return v > 0.5 && (c + r) % 4 === 0 ? '.' : up(c, r);
    },
    top: (c, r, X) => {
      const u = (X - X0 - arm) / (W - arm * 2);
      const i = Math.floor(u * n);
      const j = Math.floor(((X + K.vx * 0 + 1) - X0 - arm) / (W - arm * 2) * n);
      return i !== j ? '|' : SP;
    },
  });
  // brazos
  for (const [a, b] of [[X0, X0 + arm], [X1 - arm, X1]]) K.box(a, b, 0.65, z0, z1 - 0.001, { base: 0.1, front: (c, r, u, v) => (v < 0.2 ? SP : (c + r) % 5 === 0 ? '.' : SP) });
  // patas
  for (const X of [X0 + 1, X1 - 1]) {
    const c = Math.round(K.sx(X, z0));
    const r = Math.round(K.sy(0.05, z0));
    K.at(z0, (g) => g.put(c, r, '¨'));
  }
  // cojín suelto
  if (o.cushion !== false && W > 14) {
    const c = Math.round(K.sx(X0 + arm + 1.5, zb));
    const r = Math.round(K.sy(0.78, zb));
    K.at(zb - 0.001, (g) => {
      g.text(c, r - 1, '.--.');
      g.text(c, r, '(::)');
      g.text(c, r + 1, "ª--'");
    });
  }
  const seats = [];
  for (let i = 0; i < n; i++) seats.push(X0 + arm + ((i + 0.5) * (W - arm * 2)) / n);
  void seed;
  return { X0, X1, z0, z1, zb, seats, seatH: 0.58, zs: (z0 + zb) / 2 };
}

// --- sillón visto de atrás (mirando a la tele) -----------------------------------------
export function sofaBack(K, Xc, z0, wm = 2) {
  const W = Math.min(wm * K.MX, K.cols * 0.5);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const d = K.dz(0.25);
  const arm = Math.max(2, W * 0.07);
  K.box(X0 + arm, X1 - arm, 0.9, z0, z0 + d, {
    front: (c, r, u, v) => (v < 0.1 ? SP : (Math.round(u * 24) % 4 === 0 && (r % 2 === 0)) ? '.' : (c + r) % 7 === 0 ? ':' : SP),
  });
  for (const [a, b] of [[X0, X0 + arm], [X1 - arm, X1]]) K.box(a, b, 0.62, z0 - 0.002, z0 + K.dz(0.85), { front: (c, r, u, v) => (v < 0.2 ? SP : (c + r) % 5 === 0 ? '.' : SP) });
  for (const X of [X0 + 1, X1 - 1]) K.at(z0 - 0.003, (g) => g.put(Math.round(K.sx(X, z0)), Math.round(K.sy(0.03, z0)), '¨'));
  return { X0, X1, z0, z1: z0 + d, topR: Math.round(K.sy(0.9, z0)) };
}

// --- sillón de un cuerpo, de frente ------------------------------------------------------------
export function armchair(K, Xc, z1, o = {}) {
  const W = Math.min(0.95 * K.MX, K.cols * 0.2);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const z0 = z1 - K.dz(0.8);
  const zb = z1 - K.dz(0.2);
  const arm = Math.max(2, W * 0.18);
  K.box(X0 + arm * 0.4, X1 - arm * 0.4, o.wing ? 1.15 : 0.95, zb, z1, { front: (c, r, u, v) => (v < 0.15 ? SP : (c + r) % 4 === 0 ? '.' : SP) });
  K.box(X0 + arm, X1 - arm, 0.45, z0, zb, { base: 0.12 });
  for (const [a, b] of [[X0, X0 + arm], [X1 - arm, X1]]) K.box(a, b, 0.62, z0, z1 - 0.001, { base: 0.12 });
  for (const X of [X0 + 1, X1 - 1]) K.at(z0, (g) => g.put(Math.round(K.sx(X, z0)), Math.round(K.sy(0.06, z0)), '¨'));
  return { X: Xc, z0, z1, zs: (z0 + zb) / 2, seatH: 0.57, X0, X1 };
}

// --- mesa con patas ---------------------------------------------------------------------------
// o.cloth: mantel que cae por adelante; devuelve la cubierta para poner cosas.
export function table(K, X0, X1, z0, z1, h = 0.75, o = {}) {
  const th = 0.05;
  const cloth = o.cloth;
  const res = K.box(X0, X1, cloth ? 0.22 : th, z0, z1, {
    base: h - (cloth ? 0.22 : th),
    top: (c, r, X, z) => (cloth === 'cuadros' ? ((Math.floor((X - X0) / (K.MX * 0.18)) + Math.floor((z - z0) / K.dz(0.15))) % 2 === 0 && (c + r) % 2 === 0 ? '.' : SP) : cloth ? SP : hash2(c * 5, r * 3) < 0.12 ? '-' : SP),
    front: cloth
      ? (c, r, u, v) => (v > 0.7 ? (c % 2 ? 'v' : '_') : cloth === 'cuadros' ? ((c >> 1) + r) % 2 === 0 ? ':' : SP : (c + r) % 4 === 0 ? '.' : SP)
      : null,
    bottomLine: !cloth,
  });
  const inset = Math.min(1.2, (X1 - X0) * 0.04);
  const legH = h - (cloth ? 0.22 : th);
  for (const X of [X0 + inset, X1 - inset]) {
    K.leg(X, z0 + 0.002, legH);
    K.leg(X, z1 - 0.002, legH);
  }
  return { ...res, h, X0, X1, z0, z1, zm: (z0 + z1) / 2 };
}

// --- silla vista de frente o de atrás ------------------------------------------------------------
export function chair(K, Xc, z, facing = 'atras', o = {}) {
  const W = Math.min(0.45 * K.MX, K.cols * 0.08);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const d = K.dz(0.42);
  if (facing === 'atras') {
    // respaldo hacia nosotros
    K.box(X0, X1, 0.06, z, z + d, { base: 0.42 });
    K.box(X0, X1, 0.45, z - 0.002, z + K.dz(0.04), {
      base: 0.47,
      front: (c, r, u, v) => (v > 0.15 && v < 0.85 && (u > 0.2 && u < 0.8) ? ((c + r) % 2 ? '|' : SP) : SP),
    });
  } else {
    K.box(X0, X1, 0.45, z + d - K.dz(0.04), z + d, { base: 0.47 });
    K.box(X0, X1, 0.06, z, z + d, { base: 0.42 });
  }
  for (const X of [X0 + 0.5, X1 - 0.5]) {
    K.leg(X, z + 0.001, 0.42);
    K.leg(X, z + d - 0.001, 0.42);
  }
  void o;
  return { X0, X1, z, d };
}

// --- cama con respaldo contra la pared del fondo ----------------------------------------------------
// La frazada se ve desde arriba (estamos parados) y cae por adelante con su
// ruedo. o.quilt: 'colcha' | 'cuadros' | 'rayas'; o.antiguo: respaldo tallado
// y baranda a los pies.
export function bed(K, Xc, z1, wm = 1.5, o = {}) {
  const W = Math.min(wm * K.MX, K.cols * 0.42);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const L = Math.min(K.dz(o.len || 2.0), (K.Z - 1) * 0.62);
  const zh = z1 - K.dz(0.06);
  const z0 = zh - L;
  const quilt = o.quilt || 'colcha';
  const top = 0.6;
  // respaldo
  K.box(X0 - 0.6, X1 + 0.6, o.antiguo ? 1.35 : 1.1, zh, z1, {
    front: (c, r, u, v) => {
      if (o.antiguo) return v < 0.22 ? (Math.abs(u - 0.5) < 0.3 ? ((c + r) % 2 ? '~' : SP) : SP) : Math.round(u * 14) % 2 === 0 && v > 0.3 ? '|' : SP;
      if (K.zone === 'centro') return (c + r) % 3 === 0 && v > 0.12 ? ':' : SP;
      return v > 0.15 && Math.round(u * 10) % 2 === 0 ? '|' : SP;
    },
  });
  // la frazada: arriba y cayendo por adelante
  const qTop = (c, r, X, z) => {
    const u = (X - X0) / W;
    const v = (z - z0) / L;
    if (v > 0.8) return SP; // donde van las almohadas
    if (Math.abs(v - 0.72) < 0.03) return '_'; // el doblez de la sábana
    if (v > 0.72) return SP;
    if (quilt === 'cuadros') {
      const k = Math.floor(u * 8) + Math.floor(v * 6);
      return k % 2 === 0 ? ((c + r) % 2 ? ':' : '.') : SP;
    }
    if (quilt === 'rayas') return Math.floor(u * 12) % 2 === 0 ? ':' : SP;
    return (c * 2 + r) % 5 === 0 ? '~' : (c + r) % 3 === 0 ? '.' : SP;
  };
  const qFront = (c, r, u, v) => {
    if (v > 0.8) return c % 2 ? 'v' : '_';
    if (quilt === 'cuadros') return (Math.floor(u * 8) + Math.floor(v * 3)) % 2 === 0 ? ((c + r) % 2 ? ':' : '.') : SP;
    if (quilt === 'rayas') return Math.floor(u * 12) % 2 === 0 ? ':' : SP;
    return (c * 2 + r) % 5 === 0 ? '~' : SP;
  };
  const res = K.box(X0, X1, top - 0.2, z0, zh, { base: 0.2, top: qTop, front: qFront });
  // patas
  for (const X of [X0 + 0.6, X1 - 0.6]) K.leg(X, z0 + 0.003, 0.2, '|');
  if (o.antiguo) {
    // baranda de bronce a los pies
    const c0 = Math.round(K.sx(X0 - 0.3, z0 - 0.004));
    const c1 = Math.round(K.sx(X1 + 0.3, z0 - 0.004));
    const rr = Math.round(K.sy(0.85, z0));
    const rb = Math.round(K.sy(0, z0)) - 1;
    K.at(z0 - 0.004, (g) => {
      g.hline(c0, c1, rr, '_');
      for (const c of [c0, c1]) {
        g.vline(c, rr + 1, rb, '|');
        g.put(c, rr, 'o');
      }
      for (let c = c0 + 3; c < c1 - 1; c += 4) g.put(c, rr + 1, '|');
    });
  }
  // almohadas
  const pz = zh - Math.min(K.dz(0.25), L * 0.15);
  const pw = Math.max(5, Math.round((K.sx(X1, pz) - K.sx(X0, pz)) / 2) - 2);
  const pr = Math.round(K.sy(top + 0.05, pz));
  const pills = [];
  for (const k of o.two === false ? [0.5] : [0.25, 0.75]) {
    const c = Math.round(K.sx(X0 + W * k, pz) - pw / 2);
    K.at(pz, (g) => {
      g.text(c, pr - 1, '.' + '-'.repeat(pw - 2) + '.');
      g.text(c, pr, '(' + ' '.repeat(pw - 2) + ')');
    });
    pills.push({ c: c + Math.floor(pw / 2), r: pr, X: X0 + W * k });
  }
  return { X0, X1, z0, zh, z1, pz, pills, topH: top, top: res };
}

// --- mesa de noche con cajón ------------------------------------------------------------------------
export function nightstand(K, Xc, z1, o = {}) {
  const W = Math.min(0.5 * K.MX, K.cols * 0.07);
  const r = K.box(Xc - W / 2, Xc + W / 2, 0.55, z1 - K.dz(0.4), z1, {
    front: (c, rr, u, v) => (v > 0.35 && v < 0.45 ? '_' : Math.abs(u - 0.5) < 0.1 && v > 0.15 && v < 0.3 ? 'o' : SP),
  });
  void o;
  return { ...r, X: Xc, z: z1 - K.dz(0.2), h: 0.55 };
}

// --- ropero (contra una pared lateral, con las puertas mirando al centro) -----------------------------
export function wardrobe(K, side, z0, z1, o = {}) {
  const deep = Math.min(0.6 * K.MX, K.cols * 0.12);
  const X0 = side < 0 ? 0 : K.cols - deep;
  const X1 = side < 0 ? deep : K.cols;
  const H = o.h || 2.15;
  const antiguo = o.antiguo;
  const res = K.box(X0, X1, H, z0, z1, {
    side: (c, r, u, h) => {
      if (h > H - 0.12) return antiguo ? ((c + r) % 2 ? '^' : '_') : SP;
      if (Math.abs(u - 0.5) < 0.012) return '|';
      if (h < 0.15) return '_';
      if (Math.abs(h - 1.05) < 0.06 && (Math.abs(u - 0.45) < 0.025 || Math.abs(u - 0.55) < 0.025)) return 'o';
      if (antiguo && o.mirror && u > 0.6 && u < 0.9 && h > 0.5 && h < 1.8) return Math.abs(u - 0.75) > 0.13 || h > 1.75 || h < 0.55 ? ')' : SP;
      // paneles
      const pu = (u % 0.5) / 0.5;
      if ((pu < 0.1 || pu > 0.9) && h > 0.3 && h < H - 0.3) return ':';
      return SP;
    },
    front: (c, r, u, v) => (v < 0.06 ? SP : antiguo && v > 0.02 && v < 0.07 ? '_' : SP),
  });
  if (antiguo) {
    // corona tallada
    K.line3(side < 0 ? X1 + 0.3 : X0 - 0.3, H + 0.08, z0 - 0.01, side < 0 ? X1 + 0.3 : X0 - 0.3, H + 0.08, z1);
  }
  return res;
}

// --- estante de libros contra la pared del fondo ---------------------------------------------------------
export function bookcase(K, X0, X1, z1, o = {}) {
  const H = o.h || 2.0;
  const d = K.dz(0.32);
  const sh = o.shelf || 0.36;
  const seed = K.seed + Math.round(X0);
  const zf = z1 - d;
  const res = K.box(X0, X1, H, zf, z1, {
    front: (c, r) => {
      const h = K.hAt(r, zf);
      if (h > H - 0.08 || h < 0.1) return SP;
      const k = Math.floor(h / sh);
      const kTop = Math.floor(K.hAt(r - 1, zf) / sh);
      if (kTop !== k) return '_';
      const fill = hash2(k * 31 + seed, Math.floor(c / 5)) < 0.2 ? 0.45 : 1;
      if (hash2(c + seed, k) > fill) return hash2(c, k + 3) < 0.15 ? 'o' : SP;
      return spine(c, k, seed);
    },
    side: (c, r, u, h) => (h > H - 0.08 ? SP : Math.floor(h / sh) !== Math.floor((h + 0.12) / sh) ? '_' : u > 0.15 && (c + r) % 2 ? ':' : SP),
  });
  return res;
}

// estante a lo largo de una pared lateral: los lomos miran al centro
export function sideShelves(K, side, z0, z1, o = {}) {
  const deep = Math.min(0.32 * K.MX, K.cols * 0.07);
  const X0 = side < 0 ? 0 : K.cols - deep;
  const X1 = side < 0 ? deep : K.cols;
  const H = o.h || Math.min(K.HM - 0.2, 2.6);
  const sh = o.shelf || 0.38;
  const seed = K.seed + side * 17;
  return K.box(X0, X1, H, z0, z1, {
    side: (c, r, u, h) => {
      if (h > H - 0.06 || h < 0.08) return SP;
      const k = Math.floor(h / sh);
      const kk = Math.floor((h + (0.5 * K.M) / K.M / 3) / sh);
      if (kk !== k && Math.floor(K.hAt(r - 1, K.zAtCol(side < 0 ? X1 : X0, c)) / sh) !== k) return '_';
      const gap = hash2(k * 7 + seed, Math.floor(u * 9)) < 0.12;
      if (gap) return hash2(c, k) < 0.2 ? 'o' : SP;
      return spine(c, k, seed);
    },
    front: (c, r, u, v) => SP,
  });
}

// --- mueble de cocina con cubierta -------------------------------------------------------------------
export function counter(K, X0, X1, z1, o = {}) {
  const d = K.dz(0.6);
  const z0 = z1 - d;
  const H = 0.9;
  const doorW = K.MX * 0.5;
  const res = K.box(X0, X1, H, z0, z1, {
    front: (c, r, u, v) => {
      const h = K.hAt(r, z0);
      if (h > H - 0.06) return SP;
      if (h < 0.1) return r % 2 ? '_' : SP;
      const X = K.Xat(c, z0);
      const k = Math.floor((X - X0) / doorW);
      const kk = Math.floor((K.Xat(c - 1, z0) - X0) / doorW);
      if (k !== kk && c > Math.round(K.sx(X0, z0))) return '|';
      if (Math.abs(h - 0.7) < 0.05) return '_';
      if (Math.abs(h - 0.62) < 0.04 && (X - X0) % doorW < doorW * 0.25 && (X - X0) % doorW > doorW * 0.12) return '-';
      return SP;
    },
    top: (c, r) => (r % 3 === 0 && (c % 7 === 0) ? '.' : SP),
  });
  return { ...res, X0, X1, z0, z1, H, zm: z0 + d * 0.55 };
}

// muebles colgados en la pared del fondo (en pantalla, sobre z = Z)
export function upperCabinets(K, x0, x1, y0, y1, o = {}) {
  const g = K.g;
  const w = o.door || 7;
  K.at(K.Z - 0.02, () => {
    for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) g.put(c, r, SP);
    g.hline(x0, x1, y0 - 1, '_');
    g.hline(x0 + 1, x1 - 1, y1, '_');
    for (let c = x0; c <= x1; c += w) g.vline(Math.min(c, x1), y0, y1, '|');
    g.vline(x1, y0, y1, '|');
    for (let c = x0; c + w <= x1; c += w) {
      const k = Math.floor((c - x0) / w);
      g.put(c + (k % 2 ? 1 : w - 1), y1 - 1, 'o');
    }
    g.hline(x0 - 1, x1 + 1, y0 - 2, '_');
  });
}

// --- refrigerador alto contra la pared lateral --------------------------------------------------------
export function fridge(K, X0, X1, z0, z1, o = {}) {
  return K.box(X0, X1, 1.85, z0, z1, {
    front: (c, r, u, v) => {
      if (Math.abs(v - 0.3) < 0.03) return '_';
      if (u > 0.82 && u < 0.9 && ((v > 0.08 && v < 0.24) || (v > 0.36 && v < 0.6))) return '|';
      if (o.magnets) {
        const k = Math.floor(u * 5) + Math.floor(v * 7) * 5;
        if (u < 0.7 && v > 0.36 && hash2(k, K.seed) < 0.12 && (c + r) % 3 === 0) return hash2(k, 3) < 0.3 ? '♥' : hash2(k, 4) < 0.5 ? 'o' : '[';
      }
      return SP;
    },
    side: (c, r, u, h) => (Math.abs(h - 1.3) < 0.05 ? '_' : SP),
  });
}

// --- tele --------------------------------------------------------------------------------------------
// kind: 'tubo' (la de siempre, con antena), 'plana', 'consola' (mueble de madera)
// Devuelve el rectángulo de la pantalla para animarla.
export function tv(K, Xc, z, h0, kind = 'tubo') {
  const g = K.g;
  if (kind === 'plana') {
    const W = Math.min(1.25 * K.MX, K.cols * 0.32);
    const res = K.box(Xc - W / 2, Xc + W / 2, 0.72, z, z + K.dz(0.06), { base: h0 + 0.08 });
    const sc = { x0: res.c0 + 1, x1: res.c1 - 1, y0: res.r0, y1: res.r1 - 1 };
    // pie
    const c = Math.round(K.sx(Xc, z));
    K.at(z, () => {
      g.put(c, res.r1 + 1, '|');
      g.text(c - 2, Math.round(K.sy(h0, z)) - 1, '_/ \\_');
    });
    return { ...sc, z };
  }
  if (kind === 'consola') {
    const W = Math.min(1.1 * K.MX, K.cols * 0.3);
    const res = K.box(Xc - W / 2, Xc + W / 2, 0.85, z, z + K.dz(0.5), {
      base: h0 + 0.2,
      front: (c, r, u, v) => (u > 0.72 ? (v > 0.2 && v < 0.8 && (r % 2 === 0) ? (u > 0.85 ? 'o' : ':') : SP) : SP),
    });
    for (const X of [Xc - W / 2 + 1, Xc + W / 2 - 1]) K.leg(X, z + 0.001, h0 + 0.2, '|');
    const x1 = Math.round(res.c0 + (res.c1 - res.c0) * 0.68);
    const sc = { x0: res.c0 + 2, x1, y0: res.r0 + 1, y1: res.r1 - 1 };
    K.at(z - 0.001, () => {
      g.vline(sc.x1 + 1, sc.y0, sc.y1, '|');
      g.hline(sc.x0, sc.x1, sc.y0 - 1, '_');
      g.vline(sc.x0 - 1, sc.y0, sc.y1, '|');
      g.hline(sc.x0, sc.x1, sc.y1 + 1 <= res.r1 ? sc.y1 + 1 : sc.y1, '¯');
    });
    sc.y1 -= 0;
    return { ...sc, z };
  }
  const W = Math.min(0.95 * K.MX, K.cols * 0.22);
  const res = K.box(Xc - W / 2, Xc + W / 2, 0.72, z, z + K.dz(0.45), {
    base: h0,
    front: (c, r, u, v) => (u > 0.8 ? (v > 0.2 && v < 0.75 ? (r % 2 ? 'o' : ':') : SP) : SP),
  });
  const x1 = Math.round(res.c0 + (res.c1 - res.c0) * 0.76);
  const sc = { x0: res.c0 + 2, x1: x1 - 1, y0: res.r0 + 1, y1: res.r1 - 1 };
  K.at(z - 0.001, () => {
    g.put(sc.x0 - 1, sc.y0, '(');
    g.put(sc.x1 + 1, sc.y0, ')');
    for (let r = sc.y0 + 1; r < sc.y1; r++) {
      g.put(sc.x0 - 1, r, '|');
      g.put(sc.x1 + 1, r, '|');
    }
    g.put(sc.x0 - 1, sc.y1, '(');
    g.put(sc.x1 + 1, sc.y1, ')');
    g.hline(sc.x0, sc.x1, sc.y0 - 1, '_');
    g.hline(sc.x0, sc.x1, sc.y1, '_');
  });
  // antena de conejo
  const c = Math.round(K.sx(Xc, z + K.dz(0.2)));
  const r = res.r0 - 2;
  K.at(z + K.dz(0.2), () => {
    g.text(c - 3, r - 2, '\\   /');
    g.text(c - 2, r - 1, '\\ /');
    g.text(c - 1, r, '/_\\');
  });
  sc.y1 -= 1;
  return { ...sc, z };
}

// lo que pasa en la pantalla: un programa que cambia (noticiero, fútbol,
// dibujos, un paisaje) con parpadeo. Para dibujar en anim.
const TICKER = '  NOTICIAS · LLUEVE EN LA CORDILLERA · EL METRO CIRCULA NORMAL · ';
export function tvScreen(d, sc, t, seed = 0) {
  const w = sc.x1 - sc.x0 + 1;
  const h = sc.y1 - sc.y0 + 1;
  if (w < 3 || h < 1) return;
  d.z = sc.z - 0.002;
  const prog = Math.floor(t / 9 + seed) % 4;
  const flick = hash2(Math.floor(t * 8), seed) < 0.12;
  for (let r = sc.y0; r <= sc.y1; r++) for (let c = sc.x0; c <= sc.x1; c++) {
    let ch = ' ';
    const u = (c - sc.x0) / w;
    const v = (r - sc.y0) / h;
    if (prog === 0) {
      // noticiero: el locutor y el zócalo con texto que corre
      if (r === sc.y1 && h > 2) ch = TICKER[(Math.floor(t * 6) + c) % TICKER.length];
      else if (h > 2 && Math.abs(u - 0.5) < 0.12 && v < 0.6) ch = v < 0.3 ? 'o' : '|';
      else if (h > 2 && Math.abs(u - 0.5) < 0.3 && Math.abs(v - 0.62) < 0.1) ch = '_';
    } else if (prog === 1) {
      // fútbol: la cancha y la pelota que va y viene
      const bx = Math.round(sc.x0 + (Math.sin(t * 1.3) * 0.45 + 0.5) * (w - 1));
      const by = Math.round(sc.y0 + (Math.sin(t * 2.1) * 0.35 + 0.5) * (h - 1));
      if (c === bx && r === by) ch = 'o';
      else if (Math.abs(u - 0.5) < 0.03) ch = ':';
      else if ((c + r * 3) % 7 === 0) ch = '.';
    } else if (prog === 2) {
      // dibujos animados: un monito que salta
      const jx = Math.round(sc.x0 + ((t * 2) % w));
      const jy = sc.y1 - (Math.floor(t * 3) % 2);
      if (c === jx && r === jy) ch = '☺';
      else if (r === sc.y1 && c % 2 === 0) ch = '_';
      else if (v < 0.3 && (c + Math.floor(t)) % 5 === 0) ch = '~';
    } else {
      // un paisaje con el sol
      if (v > 0.6) ch = (c + r) % 2 ? '~' : ' ';
      else if (Math.abs(u - 0.7) < 0.07 && v < 0.45) ch = '☼';
    }
    if (flick && (c + r) % 2) ch = '░';
    d.put(c, r, ch);
  }
}

// --- piano vertical contra la pared del fondo -----------------------------------------------------------
export function piano(K, Xc, z1) {
  const W = Math.min(1.5 * K.MX, K.cols * 0.36);
  const X0 = Xc - W / 2;
  const X1 = Xc + W / 2;
  const d = K.dz(0.6);
  const z0 = z1 - d;
  const body = K.box(X0, X1, 1.25, z0, z1, {
    front: (c, r, u, v) => {
      const h = K.hAt(r, z0);
      if (h > 1.17) return SP;
      if (h > 0.82 && h < 1.08 && u > 0.38 && u < 0.62) return h > 1.05 ? '_' : r % 2 ? ':' : '=';
      if (h < 0.15) return u > 0.42 && u < 0.58 && c % 2 ? "'" : SP;
      if (h < 0.7 && (u < 0.04 || u > 0.96)) return SP;
      return SP;
    },
  });
  // teclado: una cubierta que sobresale
  const kz0 = z0 - K.dz(0.22);
  const keys = K.box(X0 + 0.6, X1 - 0.6, 0.06, kz0, z0 - 0.001, {
    base: 0.72,
    top: (c) => (c % 7 === 1 || c % 7 === 3 || c % 7 === 5 ? '‖' : '|'),
    front: () => SP,
  });
  for (const X of [X0 + 1, X1 - 1]) K.leg(X, kz0 + 0.002, 0.72, '|');
  // la partitura en el atril
  const pc = Math.round(K.sx(Xc, z0));
  const pr = Math.round(K.sy(1.0, z0));
  K.at(z0 - 0.002, (g) => {
    g.text(pc - 3, pr - 1, '_____');
    g.text(pc - 4, pr, '|♪_♫_|');
    g.text(pc - 4, pr + 1, '|_♫__|');
  });
  return { X0, X1, z0, z1, kz0, keys, body, Xc };
}

// --- escritorio con monitor (la pantalla mira hacia nosotros) ---------------------------------------------
export function desk(K, X0, X1, z0, z1, o = {}) {
  const top = table(K, X0, X1, z0, z1, 0.76, {});
  // cajonera a un lado
  const dw = (X1 - X0) * 0.3;
  const right = o.drawers !== 'izq';
  const a = right ? X1 - dw : X0;
  K.box(a + 0.3, a + dw - 0.3, 0.7, z0 + K.dz(0.03), z1, {
    front: (c, r, u, v) => (Math.abs(v - 0.33) < 0.06 || Math.abs(v - 0.66) < 0.06 ? '_' : Math.abs(u - 0.5) < 0.12 && (Math.abs(v - 0.18) < 0.06 || Math.abs(v - 0.5) < 0.06 || Math.abs(v - 0.83) < 0.06) ? '-' : SP),
  });
  return top;
}

export function monitor(K, Xc, z, h0, o = {}) {
  const W = Math.min((o.w || 0.6) * K.MX, K.cols * 0.16);
  const res = K.box(Xc - W / 2, Xc + W / 2, o.hh || 0.38, z, z + K.dz(0.04), { base: h0 + 0.12 });
  const c = Math.round(K.sx(Xc, z));
  K.at(z, (g) => {
    g.put(c, res.r1 + 1, '|');
    g.text(c - 1, Math.round(K.sy(h0, z)) - 1, '/_\\');
  });
  return { x0: res.c0 + 1, x1: res.c1 - 1, y0: res.r0, y1: res.r1 - 1, z };
}

// pantalla con texto que se escribe (código, una planilla, un correo)
const CODE = ['if (gato) {', '  dormir();', '}', 'for i in 0..9', '= SUMA(B2:B9)', 'Querida Ana:', 'te escribo', 'desde el 4º', '$ make', 'ok v', 'x = 42', 'fin'];
export function screenText(d, sc, t, seed = 0, speed = 9) {
  const w = sc.x1 - sc.x0 + 1;
  const h = sc.y1 - sc.y0 + 1;
  if (w < 2 || h < 1) return;
  d.z = sc.z - 0.002;
  const typed = Math.floor(t * speed);
  for (let r = 0; r < h; r++) {
    const lineNo = Math.floor(typed / 14) - (h - 1 - r);
    if (lineNo < 0) continue;
    const s = CODE[(lineNo + seed) % CODE.length];
    const n = r === h - 1 ? Math.min(s.length, typed % 14) : s.length;
    for (let i = 0; i < w; i++) d.put(sc.x0 + i, sc.y0 + r, i < n ? s[i] : ' ');
    if (r === h - 1 && Math.floor(t * 3) % 2 && n < w) d.put(sc.x0 + n, sc.y0 + r, '_');
  }
}

// --- estantería de pared en la pared del fondo, con cosas encima -----------------------------------------
export function wallShelf(K, x0, x1, y, items) {
  const g = K.g;
  K.at(K.Z - 0.01, () => {
    g.hline(x0, x1, y, '¯');
    g.put(x0 + 1, y + 1, '\\');
    g.put(x1 - 1, y + 1, '/');
    let c = x0 + 1;
    for (const it of items) {
      const s = typeof it === 'string' ? OBJ[it] : it;
      if (!s || c + s.w > x1) continue;
      g.blit(s, c, y - s.h);
      c += s.w + 1;
    }
  });
}

// calendario con el mes de verdad
const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
export function calendar(K, x, y) {
  const d = new Date();
  const m = MESES[d.getMonth()];
  const w = Math.max(9, m.length + 2);
  K.at(K.Z - 0.01, (g) => {
    g.text(x, y, ' ' + '_'.repeat(w - 2) + ' ');
    g.text(x, y + 1, '|' + m.padEnd(w - 2).slice(0, w - 2) + '|');
    g.text(x, y + 2, '|' + ': : : :'.padEnd(w - 2).slice(0, w - 2) + '|');
    g.text(x, y + 3, '|' + ': : x :'.padEnd(w - 2).slice(0, w - 2) + '|');
    g.text(x, y + 4, '|' + '_'.repeat(w - 2) + '|');
    g.put(x + Math.floor(w / 2), y, 'o');
  });
  return w;
}

// radiador de fierro (antiguo) bajo una ventana, en la pared del fondo
export function radiator(K, x0, x1, y1) {
  K.at(K.Z - 0.01, (g) => {
    g.hline(x0, x1, y1 - 3, '_');
    for (let c = x0; c <= x1; c++) {
      for (let r = y1 - 2; r <= y1; r++) g.put(c, r, (c - x0) % 2 === 0 ? '|' : r === y1 ? '_' : SP);
    }
  });
}

// estufa a gas del barrio (con su llama azul que titila en anim)
export const HEATER = sprite(R`
 ______
|::::::|
|:/¯¯\:|
|:\__/:|
|______|
 ¨    ¨`);

export { now };
export const FR = frames;

// --- muebles blandos dibujados de frente, a la medida de su distancia ------------------------
// Un sillón visto de frente con w columnas y h filas (h ≥ 5): respaldo con
// cojines, brazos y asiento. Devuelve el sprite y la fila del asiento.
export function sofaSprite(w, h, o = {}) {
  w = Math.max(11, Math.round(w));
  h = Math.max(6, Math.round(h));
  const aw = Math.max(3, Math.round(w * 0.08));
  const inner = w - aw * 2;
  const n = o.n || (inner > 26 ? 3 : inner > 13 ? 2 : 1);
  const seat = h - 3; // fila de los cojines del asiento
  const armTop = Math.max(1, Math.min(seat - 1, Math.round(h * 0.32)));
  const pat = o.pattern || 'liso';
  const edges = [];
  for (let i = 0; i <= n; i++) edges.push(aw + Math.round((i * inner) / n));
  const grid = [];
  for (let r = 0; r < h; r++) grid.push(new Array(w).fill(' '));
  const put = (c, r, ch) => {
    if (c >= 0 && c < w && r >= 0 && r < h) grid[r][c] = ch;
  };
  // cojines del respaldo
  for (let i = 0; i < n; i++) {
    const a = edges[i];
    const b = edges[i + 1] - 1;
    put(a, 0, '.');
    put(b, 0, '.');
    for (let c = a + 1; c < b; c++) put(c, 0, '-');
    for (let r = 1; r < seat; r++) {
      put(a, r, '|');
      put(b, r, '|');
      for (let c = a + 1; c < b; c++) {
        if (r === seat - 1) put(c, r, '_');
        else if (pat === 'puntos' && (c + r) % 3 === 0) put(c, r, '.');
        else if (pat === 'rayas' && (c - a) % 3 === 0) put(c, r, ':');
      }
    }
    // cojín del asiento
    put(a, seat, '(');
    put(b, seat, ')');
    for (let c = a + 1; c < b; c++) put(c, seat, '_');
  }
  // brazos
  for (const left of [true, false]) {
    const e0 = left ? 0 : w - aw;
    const e1 = left ? aw - 1 : w - 1;
    for (let c = e0; c <= e1; c++) put(c, armTop, '-');
    put(left ? e0 : e1, armTop, '.');
    put(left ? e1 : e0, armTop, '.');
    for (let r = armTop + 1; r < h - 1; r++) {
      put(e0, r, r === armTop + 1 && left ? '(' : '|');
      put(e1, r, r === armTop + 1 && !left ? ')' : '|');
      if (r === h - 2) for (let c = e0 + 1; c < e1; c++) put(c, r, '_');
    }
  }
  // base del asiento
  for (let r = seat + 1; r < h - 1; r++) for (let c = aw; c < w - aw; c++) put(c, r, r === h - 2 ? '_' : ' ');
  put(1, h - 1, '¨');
  put(w - 2, h - 1, '¨');
  const spr = sprite(grid.map((l) => l.join('')).join('\n'), 'solid');
  // arriba de los brazos y entre las patas: transparente
  for (let r = 0; r < armTop; r++) for (let c = 0; c < w; c++) if (c < aw || c >= w - aw) spr.data[r * spr.w + c] = 0;
  for (let c = 2; c < w - 2; c++) spr.data[(h - 1) * spr.w + c] = 0;
  return { s: spr, seat, armTop, aw, n };
}

// Un sillón de frente apoyado en el piso a profundidad z, centrado en X.
export function sofa2d(K, X, z, wm = 2.2, o = {}) {
  const w = Math.min((wm * K.MX) / z, K.cols * (o.maxF || 0.42));
  const h = (o.hm || 0.95) * K.M / z;
  const sp = sofaSprite(w, h, o);
  const p = K.stand(sp.s, X, z);
  const inner = sp.s.w - sp.aw * 2;
  const seats = [];
  for (let i = 0; i < sp.n; i++) seats.push(p.x + sp.aw + Math.round(((i + 0.5) * inner) / sp.n));
  void inner;
  return { ...p, w: sp.s.w, h: sp.s.h, seatRow: p.y + sp.seat, seats, z, X0: K.Xat(p.x, z), X1: K.Xat(p.x + sp.s.w, z) };
}

// el respaldo de un sillón visto de atrás: capitoné y los brazos más bajos
export function sofaBackSprite(w, h) {
  w = Math.max(12, Math.round(w));
  h = Math.max(4, Math.round(h));
  const aw = Math.max(3, Math.round(w * 0.07));
  const armTop = Math.max(1, Math.round(h * 0.3));
  const g = [];
  for (let r = 0; r < h; r++) g.push(new Array(w).fill(' '));
  const put = (c, r, ch) => (c >= 0 && c < w && r >= 0 && r < h ? (g[r][c] = ch) : 0);
  const a = aw;
  const b = w - aw - 1;
  put(a, 0, '.');
  put(b, 0, '.');
  for (let c = a + 1; c < b; c++) put(c, 0, '-');
  for (let r = 1; r < h - 1; r++) {
    put(a, r, '|');
    put(b, r, '|');
    for (let c = a + 1; c < b; c++) {
      if (r === h - 2) put(c, r, '_');
      else if (r % 2 === 1 && (c - a) % 5 === 2) put(c, r, '.');
      else if (r % 2 === 0 && (c - a) % 5 === 0) put(c, r, '.');
    }
  }
  for (const left of [true, false]) {
    const e0 = left ? 0 : b;
    const e1 = left ? a : w - 1;
    for (let c = e0; c <= e1; c++) put(c, armTop, '-');
    put(left ? e0 : e1, armTop, '.');
    for (let r = armTop + 1; r < h - 1; r++) {
      put(left ? e0 : e1, r, r === armTop + 1 ? (left ? '(' : ')') : '|');
      if (r === h - 2) for (let c = e0 + 1; c < e1; c++) put(c, r, '_');
    }
  }
  put(1, h - 1, '¨');
  put(w - 2, h - 1, '¨');
  const spr = sprite(g.map((l) => l.join('')).join('\n'), 'solid');
  for (let r = 0; r < armTop; r++) for (let c = 0; c < w; c++) if (c < a || c > b) spr.data[r * spr.w + c] = 0;
  for (let c = 2; c < w - 2; c++) spr.data[(h - 1) * spr.w + c] = 0;
  return spr;
}

// --- piano vertical de frente, a la medida de su distancia ------------------------------------
// Devuelve el sprite, la fila del teclado y el centro.
export function pianoSprite(w, h) {
  w = Math.max(16, Math.round(w));
  h = Math.max(7, Math.round(h));
  const g = [];
  for (let r = 0; r < h; r++) g.push(new Array(w).fill(' '));
  const put = (c, r, ch) => (c >= 0 && c < w && r >= 0 && r < h ? (g[r][c] = ch) : 0);
  const keys = h - 3;
  // tapa y caja
  for (let c = 1; c < w - 1; c++) put(c, 0, '_');
  for (let r = 1; r < keys; r++) {
    put(0, r, '|');
    put(w - 1, r, '|');
  }
  for (let c = 1; c < w - 1; c++) put(c, keys - 1, '_');
  // atril con la partitura
  const a = Math.round(w * 0.32);
  const b = Math.round(w * 0.68);
  if (keys - 2 >= 2) {
    for (let c = a; c <= b; c++) put(c, 1, '_');
    for (let r = 2; r < keys - 1; r++) {
      put(a, r, '|');
      put(b, r, '|');
      for (let c = a + 1; c < b; c++) put(c, r, r === 2 ? ((c - a) % 3 === 1 ? '♪' : (c - a) % 3 === 2 ? '-' : ' ') : (c - a) % 2 ? '-' : ' ');
    }
  }
  // candelabros a los lados del atril
  put(Math.round(w * 0.12), 1, 'i');
  put(Math.round(w * 0.88), 1, 'i');
  // teclado: blancas y negras
  put(0, keys, '[');
  put(w - 1, keys, ']');
  for (let c = 1; c < w - 1; c++) {
    const k = (c - 1) % 7;
    put(c, keys, k === 1 || k === 2 || k === 4 || k === 5 || k === 6 ? (k === 2 || k === 6 ? '|' : '‖') : '|');
  }
  // patas y pedales
  for (let r = keys + 1; r < h - 1; r++) {
    put(1, r, '|');
    put(w - 2, r, '|');
  }
  for (let c = 2; c < w - 2; c++) put(c, h - 2, '_');
  put(1, h - 2, '|');
  put(w - 2, h - 2, '|');
  put(Math.round(w / 2) - 1, h - 2, 'o');
  put(Math.round(w / 2) + 1, h - 2, 'o');
  put(1, h - 1, '¨');
  put(w - 2, h - 1, '¨');
  const spr = sprite(g.map((l) => l.join('')).join('\n'), 'solid');
  for (let c = 2; c < w - 2; c++) spr.data[(h - 1) * spr.w + c] = 0;
  return { s: spr, keys };
}

// camarote de frente: dos camas con su escalera
export function bunkSprite(w, h) {
  w = Math.max(14, Math.round(w));
  h = Math.max(10, Math.round(h));
  const g = [];
  for (let r = 0; r < h; r++) g.push(new Array(w).fill(' '));
  const put = (c, r, ch) => (c >= 0 && c < w && r >= 0 && r < h ? (g[r][c] = ch) : 0);
  const iw = w - 3; // la escalera va a la derecha
  for (let r = 0; r < h - 1; r++) {
    put(0, r, '|');
    put(iw, r, '|');
  }
  const upper = Math.round(h * 0.42);
  const lower = h - 2;
  for (const base of [upper, lower]) {
    // colchón con frazada y almohada
    for (let c = 1; c < iw; c++) {
      put(c, base, '_');
      put(c, base - 1, (c + base) % 3 === 0 ? ':' : ' ');
      put(c, base - 2, '_');
    }
    put(2, base - 3, '.');
    put(3, base - 3, '-');
    put(4, base - 3, '-');
    put(5, base - 3, '.');
    put(2, base - 2, '(');
    put(5, base - 2, ')');
  }
  for (let c = 1; c < iw; c++) put(c, 0, '¯');
  // escalera
  for (let r = 0; r < h - 1; r++) {
    put(iw + 2, r, '|');
    if (r % 2 === 0) put(iw + 1, r, '-');
  }
  put(0, h - 1, '¨');
  put(iw, h - 1, '¨');
  const spr = sprite(g.map((l) => l.join('')).join('\n'), 'solid');
  return { s: spr, upper, lower };
}
