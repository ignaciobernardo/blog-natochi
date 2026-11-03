// Herramientas para los departamentos y las oficinas.
//
// Todo se dibuja en la misma perspectiva de room.js, pero en metros: una
// persona mide 1,7 m, un mesón 0,9 m. `M` son las filas de adelante que mide
// un metro (unas 9,7 a 160×50) y `MX` las columnas (el doble: una celda es el
// doble de alta que de ancha).
//
// La grilla base guarda la profundidad de cada celda (ZGrid). Así lo que se
// mueve en `anim` (un gato, alguien que camina, el vapor) queda detrás de lo
// que tiene adelante: se escribe sólo donde lo de la base está más lejos.
import { Grid, SP, T, cc, sprite, frames, mirror, hash2, bayer, clamp } from './util.js';

export const R = String.raw;
export { sprite, frames, mirror, hash2, bayer, clamp, SP, T, cc };

export const FAR = 99;
const EPS = 1e-4;

// --- grilla con profundidad --------------------------------------------------
// Cada escritura lleva la profundidad `z` vigente y sólo pisa lo que está más
// lejos (o a la misma distancia). Paredes y piso quedan en FAR.
export class ZGrid extends Grid {
  constructor(w, h) {
    super(w, h, SP);
    this.zb = new Float32Array(w * h).fill(FAR);
    this.z = FAR;
  }

  put(x, y, ch) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (this.z > this.zb[i] + EPS) return;
    this.data[i] = typeof ch === 'number' ? ch : ch.charCodeAt(0);
    this.zb[i] = this.z;
  }

  rect(x, y, w, h, ch = SP) {
    for (let r = Math.floor(y); r < Math.floor(y) + h; r++) for (let c = Math.floor(x); c < Math.floor(x) + w; c++) this.put(c, r, ch);
  }

  blit(s, x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    for (let sy = 0; sy < s.h; sy++) {
      const ty = y + sy;
      if (ty < 0 || ty >= this.h) continue;
      for (let sx = 0; sx < s.w; sx++) {
        const ch = s.data[sy * s.w + sx];
        if (ch) this.put(x + sx, ty, ch);
      }
    }
  }
}

// Lo mismo, pero sobre la pantalla de cada cuadro y contra la profundidad de
// la base: se usa dentro de anim(out, t).
export class Dyn {
  constructor(zb, w, h) {
    this.zb = zb;
    this.w = w;
    this.h = h;
    this.data = null;
    this.z = 0;
  }

  put(x, y, ch) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x;
    if (this.z > this.zb[i] + EPS) return;
    this.data[i] = typeof ch === 'number' ? ch : ch.charCodeAt(0);
  }

  get(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T;
    return this.data[y * this.w + x];
  }

  blit(s, x, y, z = this.z) {
    const pz = this.z;
    this.z = z;
    x = Math.floor(x);
    y = Math.floor(y);
    for (let sy = 0; sy < s.h; sy++) {
      const ty = y + sy;
      if (ty < 0 || ty >= this.h) continue;
      for (let sx = 0; sx < s.w; sx++) {
        const ch = s.data[sy * s.w + sx];
        if (ch) this.put(x + sx, ty, ch);
      }
    }
    this.z = pz;
  }
}
for (const k of ['text', 'ink', 'hline', 'vline', 'line']) Dyn.prototype[k] = Grid.prototype[k];

// --- el tren que pasa por la calle ---------------------------------------------
// Mismo horario que traffic.js: desde t = 9 s, cada 34 s, unos 3 s a la vista.
// shake: 1 mientras pasa; swing: lo que queda oscilando la lámpara.
export function rumble(t) {
  if (t < 9) return { shake: 0, swing: 0, ph: -1 };
  const ph = (t - 9) % 34;
  const shake = ph < 3.2 ? 1 : 0;
  const swing = ph < 0.3 ? ph / 0.3 : ph < 3.2 ? 1 : Math.exp(-(ph - 3.2) / 2.2);
  return { shake, swing: swing < 0.04 ? 0 : swing, ph };
}

// --- el kit ------------------------------------------------------------------------
export class Kit {
  constructor(room, place, target, night, rng) {
    const { cols, rows } = room;
    this.room = room;
    this.g = room.g = new ZGrid(cols, rows);
    this.cols = cols;
    this.rows = rows;
    this.vx = room.vx;
    this.vy = room.vy;
    // la pared del fondo más cerca que en room.js: el cuarto queda más íntimo y
    // los muebles del fondo, más grandes (misma perspectiva, otra caja)
    this.Z = cols < 90 ? 1.42 : 1.62;
    this.E = Math.floor(rows / 2);
    // filas de adelante por metro (en pantallas muy altas el cuarto es más grande)
    this.M = Math.min(rows, 60) * 0.194;
    this.MX = this.M * 2;
    this.HM = rows / this.M; // alto del cuarto, en metros
    this.WM = cols / this.MX; // ancho, en metros
    // metros de profundidad por unidad de z (como una cámara de unos 60°)
    this.DZ = clamp(0.866 * this.WM, 4, 9);
    this.night = night;
    this.rng = rng;
    this.place = place;
    this.target = target;
    this.win = target.win || null;
    this.key = target.key;
    this.zone = place.zone || 'barrio';
    this.level = this.win ? this.win.floor : 0;
    this.seed = ((place.seed || 1) * 131 + (this.win ? this.win.seed : 0)) >>> 0;
    this.narrow = cols < 90;
    this.wide = cols > 220;
    this.anims = [];
    this.lights = []; // fuentes de luz de noche: { x, y, r, k }
    this.noLightMask = false;
    this.dyn = new Dyn(this.g.zb, cols, rows);
    this.bx0 = this.sx(0, this.Z);
    this.bx1 = this.sx(cols, this.Z);
    this.by0 = this.sy(this.HM, this.Z);
    this.by1 = this.sy(0, this.Z);
    this.b = { x0: Math.ceil(this.bx0) + 1, x1: Math.floor(this.bx1) - 1, y0: Math.ceil(this.by0) + 1, y1: Math.floor(this.by1) - 1 };
  }

  // número estable entre 0 y 1 para una etiqueta
  h(k) {
    return hash2(this.seed, k * 7919 + 13);
  }

  pick(arr, k) {
    return arr[Math.floor(this.h(k) * arr.length)];
  }

  // --- geometría ---------------------------------------------------------------
  // profundidad a una fracción del fondo (0 adelante, 1 la pared del fondo)
  dz(m) {
    return m / this.DZ;
  }

  zf(f) {
    return 1 + f * (this.Z - 1);
  }

  // X de adelante a una fracción del ancho (0 izquierda, 1 derecha)
  xf(f) {
    return f * this.cols;
  }

  sx(X, z) {
    return this.vx + (X - this.vx) / z;
  }

  Yh(h) {
    return this.rows - h * this.M;
  }

  sy(h, z) {
    return this.vy + (this.rows - h * this.M - this.vy) / z;
  }

  zAtCol(X, c) {
    return (X - this.vx) / (c + 0.5 - this.vx);
  }

  zAtRow(h, r) {
    return (this.Yh(h) - this.vy) / (r + 0.5 - this.vy);
  }

  // X de adelante que se ve en la columna c a profundidad z
  Xat(c, z) {
    return this.vx + (c + 0.5 - this.vx) * z;
  }

  // altura (m) que se ve en la fila r a profundidad z
  hAt(r, z) {
    return (this.rows - (this.vy + (r + 0.5 - this.vy) * z)) / this.M;
  }

  at(z, fn) {
    const p = this.g.z;
    this.g.z = z;
    fn(this.g);
    this.g.z = p;
  }

  // --- caras -------------------------------------------------------------------------
  // Rectángulo paralelo a la pantalla a profundidad z. fn(c, r, u, v) con u, v
  // de 0 a 1 (izquierda→derecha, arriba→abajo). Devuelve sus celdas.
  face(X0, X1, h0, h1, z, fn) {
    const c0 = Math.round(this.sx(X0, z));
    const c1 = Math.round(this.sx(X1, z));
    const r0 = Math.round(this.sy(h1, z));
    const r1 = Math.round(this.sy(h0, z)) - 1;
    const g = this.g;
    const pz = g.z;
    g.z = z;
    if (fn) {
      const w = Math.max(1, c1 - c0);
      const hh = Math.max(1, r1 - r0);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const ch = fn(c, r, (c - c0) / w, (r - r0) / hh);
        if (ch) g.put(c, r, ch);
      }
    }
    g.z = pz;
    return { c0, c1, r0, r1 };
  }

  // Plano vertical X = cte (paredes, costados de muebles) entre z0 y z1 y entre
  // las alturas h0 y h1. fn(c, r, u, h, z): u de 0 (adelante) a 1 (atrás).
  side(X, z0, z1, h0, h1, fn) {
    const xa = this.sx(X, z0);
    const xb = this.sx(X, z1);
    const lo = Math.min(xa, xb);
    const hi = Math.max(xa, xb);
    const g = this.g;
    const pz = g.z;
    for (let c = Math.ceil(lo - 0.5); c <= Math.floor(hi - 0.5); c++) {
      if (Math.abs(c + 0.5 - this.vx) < 0.01) continue;
      const z = this.zAtCol(X, c);
      if (!(z >= z0 - EPS && z <= z1 + EPS)) continue;
      const top = this.sy(h1, z);
      const bot = this.sy(h0, z);
      g.z = z;
      const u = (z - z0) / (z1 - z0 || 1);
      for (let r = Math.round(top); r < Math.round(bot); r++) {
        const ch = fn(c, r, u, this.hAt(r, z), z);
        if (ch) g.put(c, r, ch);
      }
    }
    g.z = pz;
  }

  // Plano horizontal a la altura h (piso, techo, cubiertas) entre X0..X1 y
  // z0..z1. fn(c, r, X, z).
  flat(h, X0, X1, z0, z1, fn) {
    const ya = this.sy(h, z0);
    const yb = this.sy(h, z1);
    const lo = Math.min(ya, yb);
    const hi = Math.max(ya, yb);
    const g = this.g;
    const pz = g.z;
    for (let r = Math.ceil(lo - 0.5); r <= Math.floor(hi - 0.5); r++) {
      if (Math.abs(r + 0.5 - this.vy) < 0.01) continue;
      const z = this.zAtRow(h, r);
      if (!(z >= z0 - EPS && z <= z1 + EPS)) continue;
      const a = this.sx(X0, z);
      const b = this.sx(X1, z);
      g.z = z;
      for (let c = Math.round(a); c < Math.round(b); c++) {
        const ch = fn(c, r, this.Xat(c, z), z);
        if (ch) g.put(c, r, ch);
      }
    }
    g.z = pz;
  }

  // Caja apoyada a la altura o.base (m): X0..X1, alto h (m), entre z0 y z1.
  // Dibuja la cara de adelante, la de arriba (si queda bajo el horizonte), la
  // de abajo (si queda sobre él) y el costado que mira al centro, cada una con
  // su relleno opcional: o.front(c, r, u, v), o.top(c, r, X, z),
  // o.side(c, r, u, h, z), o.bottom(c, r, X, z).
  box(X0, X1, h, z0, z1, o = {}) {
    const g = this.g;
    const pz = g.z;
    const base = o.base || 0;
    const top = base + h;
    const fx0 = this.sx(X0, z0);
    const fx1 = this.sx(X1, z0);
    const kx0 = this.sx(X0, z1);
    const kx1 = this.sx(X1, z1);
    const fyT = this.sy(top, z0);
    const fyB = this.sy(base, z0);
    const kyT = this.sy(top, z1);
    const kyB = this.sy(base, z1);
    const blank = () => SP;
    const zm = (z0 + z1) / 2;
    // costado
    let sideX = null;
    if (fx1 < this.vx - 0.5) sideX = X1;
    else if (fx0 > this.vx + 0.5) sideX = X0;
    if (sideX !== null && o.side !== false) {
      this.side(sideX, z0, z1, base, top, o.side || blank);
      const xs = this.sx(sideX, z0);
      const xk = this.sx(sideX, z1);
      g.z = zm;
      g.line(xs, fyT, xk, kyT);
      if (o.sideBottom !== false) g.line(xs, fyB, xk, kyB);
      g.z = z1;
      g.vline(Math.floor(xk), Math.ceil(kyT), Math.ceil(kyB) - 1, '|');
    }
    // arriba
    if (fyT > this.vy + 0.5 && o.top !== false) {
      this.flat(top, X0, X1, z0, z1, o.top || blank);
      g.z = z1;
      g.line(kx0, kyT, kx1, kyT);
      g.z = zm;
      if (fx0 > this.vx - 0.5 || sideX === null || sideX === X1) g.line(fx0, fyT, kx0, kyT);
      if (fx1 < this.vx + 0.5 || sideX === null || sideX === X0) g.line(fx1, fyT, kx1, kyT);
    }
    // abajo
    if (fyB < this.vy - 0.5 && o.bottom !== false) {
      this.flat(base, X0, X1, z0, z1, o.bottom || blank);
      g.z = z1;
      g.line(kx0, kyB, kx1, kyB);
      g.z = zm;
      g.line(fx0, fyB, kx0, kyB);
      g.line(fx1, fyB, kx1, kyB);
    }
    // adelante
    const c0 = Math.round(fx0);
    const c1 = Math.round(fx1);
    const r0 = Math.round(fyT);
    const r1 = Math.max(r0, Math.round(fyB) - 1);
    g.z = z0;
    const w = Math.max(1, c1 - c0);
    const hh = Math.max(1, r1 - r0);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g.put(c, r, (o.front && o.front(c, r, (c - c0) / w, (r - r0) / hh)) || SP);
    if (o.edges !== false) {
      g.hline(c0, c1, r0 - 1, '_');
      if (o.bottomLine !== false) g.hline(c0 + 1, c1 - 1, r1, '_');
      g.vline(c0, r0, r1, '|');
      g.vline(c1, r0, r1, '|');
    }
    g.z = pz;
    return { c0, c1, r0, r1, z0, z1, kyT, fyT, kx0, kx1 };
  }

  // Sprite parado a profundidad z con su centro en X, apoyado a la altura h.
  stand(s, X, z, h = 0) {
    const x = Math.round(this.sx(X, z) - s.w / 2);
    const y = Math.round(this.sy(h, z)) - s.h;
    this.at(z, (g) => g.blit(s, x, y));
    return { x, y, z };
  }

  // posición de un sprite parado (para dibujarlo en anim)
  spot(s, X, z, h = 0) {
    return { x: Math.round(this.sx(X, z) - s.w / 2), y: Math.round(this.sy(h, z)) - s.h, z };
  }

  // Sprite en la pared del fondo, con su esquina en (x, y) de pantalla.
  onBack(s, x, y) {
    this.at(this.Z, (g) => g.blit(s, Math.round(x), Math.round(y)));
  }

  // Línea en el espacio: de (X0, h0, z0) a (X1, h1, z1).
  line3(X0, h0, z0, X1, h1, z1, ch = 0) {
    this.at(Math.min(z0, z1), (g) => g.line(this.sx(X0, z0), this.sy(h0, z0), this.sx(X1, z1), this.sy(h1, z1), ch));
  }

  // pata vertical (mesas, sillas) de la altura h al piso, a (X, z)
  leg(X, z, h, ch = '|') {
    const c = Math.round(this.sx(X, z));
    const a = Math.round(this.sy(h, z));
    const b = Math.round(this.sy(0, z)) - 1;
    this.at(z, (g) => g.vline(c, a, b, ch));
  }

  anim(fn) {
    this.anims.push(fn);
  }

  // una luz de noche en (x, y) de pantalla, de radio r columnas e intensidad k
  light(x, y, r, k = 1) {
    this.lights.push({ x, y, r, k });
  }

  // cuánta luz llega a la celda (c, r): la más fuerte de las fuentes
  lightAt(c, r, ambient) {
    let L = ambient;
    for (const l of this.lights) {
      const dx = c - l.x;
      const dy = (r - l.y) * 2;
      const d = Math.sqrt(dx * dx + dy * dy) / l.r;
      if (d < 1) L = Math.max(L, l.k * (1 - d * d * 0.85));
    }
    return L;
  }

  // ¿la celda está libre para el título?
  titleBand() {
    return { r: this.E, c0: Math.floor(this.cols / 2 - 3.5) - 2, c1: Math.floor(this.cols / 2 + 3.5) + 1 };
  }

  // --- el cierre: lo que devuelve buildHome -------------------------------------------
  finish() {
    // de noche el cuarto queda iluminado sólo por sus lámparas, la tele y las
    // ventanas: lo demás se apaga con dithering hacia los rincones
    if (this.night && !this.noLightMask && this.lights.length) {
      const g = this.g;
      this.full = new Uint16Array(g.data);
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const i = r * this.cols + c;
        if (g.data[i] === SP) continue;
        if (bayer(c, r) > this.lightAt(c, r, 0.3)) g.data[i] = SP;
      }
    }
    const anims = this.anims;
    const dyn = this.dyn;
    return {
      anim(out, t) {
        dyn.data = out.data;
        for (let i = 0; i < anims.length; i++) {
          dyn.z = 0;
          anims[i](dyn, t, out);
        }
      },
    };
  }
}

// --- relleno de caras ------------------------------------------------------------
// Devuelven una función (c, r, ...) → glifo.
export const fills = {
  dots: (k = 2) => (c, r) => ((c % k === 0 && r % 2 === 0) ? '.' : SP),
  colon: () => (c, r) => ((c + r) % 2 === 0 ? ':' : SP),
  sparse: (seed, p = 0.08, ch = '.') => (c, r) => (hash2(c * 3 + seed, r * 7) < p ? ch : SP),
  hatch: (ch = '/') => (c, r) => ((c + (ch === '/' ? r : -r)) % 3 === 0 ? ch : SP),
};

// --- reloj de pared con la hora real ----------------------------------------------------
const HAND = [
  [0, -1, '|'], [1, -1, '/'], [1, 0, '-'], [1, 1, '\\'],
  [0, 1, '|'], [-1, 1, '/'], [-1, 0, '-'], [-1, -1, '\\'],
];
// aguja: frac de vuelta (0 arriba), largo en celdas (las columnas cuentan doble)
export function hand(d, x, y, frac, len) {
  const a = frac * Math.PI * 2;
  for (let i = 1; i <= len; i++) {
    const cx = x + Math.round(Math.sin(a) * i * 2);
    const cy = y - Math.round(Math.cos(a) * i);
    const k = Math.round((frac * 8) % 8) % 8;
    d.put(cx, cy, HAND[k][2]);
    if (i === 1 && Math.abs(Math.sin(a)) > 0.7) d.put(x + Math.round(Math.sin(a)), cy, '-');
  }
}

let nowCache = { t: -1, h: 0, m: 0, s: 0 };
export function now() {
  const ms = Date.now();
  if (Math.abs(ms - nowCache.t) > 250) {
    const d = new Date(ms);
    nowCache = { t: ms, h: d.getHours(), m: d.getMinutes(), s: d.getSeconds() };
  }
  return nowCache;
}

export const hhmm = (blink = true, t = 0) => {
  const n = now();
  return String(n.h).padStart(2, '0') + (blink && Math.floor(t * 2) % 2 ? ' ' : ':') + String(n.m).padStart(2, '0');
};

// Reloj redondo: 'chico' (3 filas) o 'grande' (5 filas). Devuelve su centro.
export const CLOCK_S = sprite(R`
 .-.
( · )
 ª-'`);
export const CLOCK_L = sprite(R`
   .---.
 .'  ·  ª.
(·       ·)
 ª.  ·  .'
   ª---'`);
export function clockAnim(K, x, y, big, z) {
  K.anim((d) => {
    const n = now();
    const hr = (n.h % 12) + n.m / 60;
    const mn = n.m + n.s / 60;
    d.z = z;
    if (big) {
      hand(d, x, y, mn / 60, 2);
      hand(d, x, y, hr / 12, 1);
      d.put(x, y, 'o');
    } else {
      // en el chico sólo cabe una aguja: la de los minutos, y el centro
      const a = (mn / 60) * Math.PI * 2;
      const k = Math.round(((mn / 60) * 8) % 8) % 8;
      d.put(x + Math.round(Math.sin(a) * 1.2), y - Math.round(Math.cos(a) * 0.4), HAND[k][2]);
      d.put(x, y, '·');
    }
  });
}

// --- vapor, notas, burbujas -----------------------------------------------------------
// Volutas que suben desde (x, y). n partículas, alto en filas.
export function steam(d, x, y, t, n = 4, height = 5, seed = 0) {
  for (let i = 0; i < n; i++) {
    const p = (t * 0.45 + i / n + seed * 0.37) % 1;
    const yy = Math.round(y - p * height);
    const xx = Math.round(x + Math.sin(p * 5 + i * 1.7 + seed) * 1.3);
    const ch = p < 0.3 ? '(' : p < 0.55 ? ')' : p < 0.8 ? '~' : "'";
    d.put(xx, yy, ch);
  }
}

export function notes(d, x, y, t, n = 3, height = 7, seed = 0) {
  for (let i = 0; i < n; i++) {
    const p = (t * 0.28 + i / n + seed * 0.29) % 1;
    if (p > 0.92) continue;
    const yy = Math.round(y - p * height);
    const xx = Math.round(x + p * 6 * (i % 2 ? 1 : -0.6) + Math.sin(p * 7 + i) * 1.2);
    d.put(xx, yy, (i + Math.floor(t * 0.7)) % 3 === 0 ? '♫' : '♪');
  }
}

export function bubbles(d, x, y0, y1, t, n = 3, seed = 0) {
  const hgt = y1 - y0;
  for (let i = 0; i < n; i++) {
    const p = (t * 0.5 + i / n + seed * 0.41) % 1;
    const yy = Math.round(y1 - p * hgt);
    d.put(x + (Math.floor(p * 6 + i) % 2), yy, p < 0.4 ? '.' : p < 0.8 ? 'o' : '°');
  }
}

// zzz de alguien que duerme
export function zzz(d, x, y, t) {
  const p = (t * 0.35) % 1;
  const k = Math.floor(p * 4);
  if (k >= 1) d.put(x, y, 'z');
  if (k >= 2) d.put(x + 1, y - 1, 'z');
  if (k >= 3) d.put(x + 2, y - 2, 'Z');
}
