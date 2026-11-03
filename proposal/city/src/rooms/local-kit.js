// Piezas comunes de los locales: profundidad, repisas, mesones, letreros,
// pizarras, lámparas, ventanas, vapor, relojes y los actores (vendedor,
// clientes, gente sentada, gatos).
//
// La base del cuarto se arma una vez; lo que se mueve se dibuja encima en cada
// cuadro. Para que alguien quede detrás del mesón sin rearmar la base, la base
// lleva un mapa de profundidad: cada celda guarda la z del mueble que la
// pintó. Un actor a profundidad z sólo escribe donde la base está más lejos.
import { SP, T, sprite, frames, mirror, hash2 } from './util.js';
import { persona, altoA, GATO } from './local-gente.js';

const R = String.raw;
const LEJOS = 1e9;

// --- contexto ----------------------------------------------------------------

export function crearCtx(room, place, night, rng) {
  const { g, cols, rows } = room;
  const W = g.w;
  const zb = new Float32Array(g.w * g.h).fill(LEJOS);
  const ctx = {
    room,
    g,
    cols,
    rows,
    night,
    rng,
    place,
    shop: place.shop,
    seed: place.seed || 1,
    b: room.back,
    E: Math.floor(rows / 2), // fila del título
    vx: room.vx,
    vy: room.vy,
    Z: room.Z,
    zb,
    z: 0, // profundidad con la que se pinta la base (0: sin marcar)
    actores: [],
    narrow: cols < 90,
    wide: cols > 220,
  };
  // la grilla base marca la profundidad de lo que se pinta
  const proto = Object.getPrototypeOf(g);
  g.put = function (x, y, ch) {
    proto.put.call(this, x, y, ch);
    if (ctx.z) {
      x = Math.floor(x);
      y = Math.floor(y);
      if (x >= 0 && y >= 0 && x < W && y < this.h) zb[y * W + x] = ctx.z;
    }
  };
  g.blit = function (s, x, y) {
    proto.blit.call(this, s, x, y);
    if (!ctx.z) return;
    x = Math.floor(x);
    y = Math.floor(y);
    for (let sy = 0; sy < s.h; sy++) {
      const ty = y + sy;
      if (ty < 0 || ty >= this.h) continue;
      for (let sx = 0; sx < s.w; sx++) {
        const tx = x + sx;
        if (tx < 0 || tx >= W) continue;
        if (s.data[sy * s.w + sx]) zb[ty * W + tx] = ctx.z;
      }
    }
  };
  // zonas de la pared del fondo: el letrero arriba, una banda alta y otra
  // baja separadas por la fila del título, y el hueco del título al centro
  const b = room.back;
  const E = ctx.E;
  ctx.L = {
    x0: b.x0 + 1,
    x1: b.x1 - 1,
    w: b.x1 - b.x0 - 1,
    cartel: b.y0 + 2,
    alto: [b.y0 + 4, E - 2],
    bajo: [E + 2, b.y1],
    tit: { x0: Math.floor(room.vx) - 7, x1: Math.ceil(room.vx) + 7, y0: E - 1, y1: E + 1 },
  };
  // ¿el rectángulo pisa el título?
  ctx.pisaTitulo = (x0, x1, y0, y1) => {
    const t = ctx.L.tit;
    return x1 >= t.x0 && x0 <= t.x1 && y1 >= t.y0 && y0 <= t.y1;
  };
  // profundidad: fracción de la sala (0 adelante, 1 la pared del fondo)
  ctx.zf = (f) => 1 + f * (room.Z - 1);
  ctx.alto = (z) => altoA(room, z);
  ctx.at = (z, fn) => {
    const prev = ctx.z;
    ctx.z = z;
    const r = fn();
    ctx.z = prev;
    return r;
  };
  ctx.px = (X, z) => Math.round(room.x(X, z));
  ctx.py = (Y, z) => Math.round(room.y(Y, z));
  ctx.piso = (z) => Math.round(room.floorY(z));
  // actores: se dibujan de lo lejano a lo cercano
  ctx.anim = (z, fn) => ctx.actores.push({ z, fn });
  // escribir en la pantalla respetando lo que tapa la base
  ctx.blitZ = (out, s, x, y, z) => blitZ(out, s, x, y, z, zb, W);
  ctx.putZ = (out, x, y, ch, z) => {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= W || y >= out.h) return;
    if (zb[y * W + x] >= z) out.put(x, y, ch);
  };
  ctx.textZ = (out, x, y, s, z) => {
    for (let i = 0; i < s.length; i++) if (s[i] !== '¤') ctx.putZ(out, x + i, y, s[i], z);
  };
  // texto en la base (con o sin espacios opacos)
  ctx.text = (x, y, s) => {
    for (let i = 0; i < s.length; i++) if (s[i] !== '¤') g.put(x + i, y, s[i]);
  };
  ctx.ink = (x, y, s) => {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && s[i] !== '¤') g.put(x + i, y, s[i]);
  };
  ctx.lines = (x, y, arr, ink = false) => arr.forEach((l, i) => (ink ? ctx.ink : ctx.text)(x, y + i, l));
  ctx.clear = (x0, y0, x1, y1) => {
    for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) g.put(c, r, SP);
  };
  return ctx;
}

function blitZ(out, s, x, y, z, zb, W) {
  x = Math.floor(x);
  y = Math.floor(y);
  const sx0 = Math.max(0, -x);
  const sy0 = Math.max(0, -y);
  const sx1 = Math.min(s.w, out.w - x);
  const sy1 = Math.min(s.h, out.h - y);
  const src = s.data;
  const dst = out.data;
  for (let sy = sy0; sy < sy1; sy++) {
    let si = sy * s.w + sx0;
    let di = (sy + y) * W + sx0 + x;
    for (let sx = sx0; sx < sx1; sx++, si++, di++) {
      const c = src[si];
      if (c && zb[di] >= z) dst[di] = c;
    }
  }
}

// Arma la función anim del cuarto con los actores ordenados por profundidad.
export function cerrar(ctx) {
  const list = ctx.actores.slice().sort((a, b) => b.z - a.z);
  return {
    anim(out, t) {
      for (const a of list) a.fn(out, t);
    },
  };
}

// --- sprites -------------------------------------------------------------------

// Sprite desde un arreglo de filas (modo 'solid').
export const S = (rowsArr, mode = 'solid') => sprite(Array.isArray(rowsArr) ? rowsArr.join('\n') : rowsArr, mode);
export { R, sprite, frames, mirror };

// --- pared del fondo -----------------------------------------------------------

// Franja libre del título: dos filas arriba y abajo de E no deberían tener
// nada importante al centro.
export function libreTitulo(ctx, y) {
  return Math.abs(y - ctx.E) <= 1;
}

// Una repisa en la pared del fondo: la tabla en la fila y, con cosas apoyadas
// encima. items: arreglo de dibujos (arreglos de filas) que se reparten de
// izquierda a derecha con un hueco de `gap`.
export function repisa(ctx, x0, x1, y, items, { gap = 1, tabla = '¯', rng = ctx.rng, mensula = true } = {}) {
  const { g } = ctx;
  g.hline(x0, x1, y, tabla);
  if (mensula) {
    g.put(x0 + 1, y + 1, '\\');
    g.put(x1 - 1, y + 1, '/');
  }
  let x = x0 + 1;
  while (x < x1) {
    const it = items[Math.floor(rng.next() * items.length)];
    const w = Math.max(...it.map((l) => l.length));
    if (x + w > x1) break;
    it.forEach((l, i) => ctx.ink(x, y - it.length + i, l));
    x += w + gap + (rng.next() < 0.15 ? 1 : 0);
  }
}

// Estante de varias repisas entre las filas y0 (arriba) y y1 (abajo), cada
// `paso` filas; salta la franja del título. Devuelve las filas de las tablas.
export function estante(ctx, x0, x1, y0, y1, paso, items, opts = {}) {
  const ys = [];
  for (let y = y1; y >= y0 + paso - 1; y -= paso) {
    if (opts.titulo !== false && Math.abs(y - ctx.E) <= 0 && y - paso >= y0) {
      // la tabla cae en el título: se corre una fila
      y += 0;
    }
    ys.push(y);
  }
  const { g } = ctx;
  if (opts.marco !== false) {
    g.vline(x0, y0, y1, '|');
    g.vline(x1, y0, y1, '|');
    g.hline(x0, x1, y0 - 1, '_');
  }
  for (const y of ys) repisa(ctx, x0, x1, y, items, { ...opts, mensula: false });
  return ys;
}

// --- paredes laterales en perspectiva -------------------------------------------

// Profundidad de la columna c sobre la pared lateral (side -1 izq, 1 der).
export function zCol(ctx, side, c) {
  const X = side < 0 ? 0 : ctx.cols;
  const dx = c + 0.5 - ctx.vx;
  if (Math.abs(dx) < 1e-6) return LEJOS;
  return (X - ctx.vx) / dx;
}

// Repisas en la pared lateral entre z0 y z1, con tablas a las alturas Ys
// (unidades de adelante, de abajo hacia arriba). relleno(c, k, i, n, z)
// devuelve el glifo para la columna c, el tramo k (0 el de abajo), la fila i
// desde abajo dentro del tramo (0..n-1).
export function repisasLado(ctx, side, z0, z1, Ys, relleno, { montantes = 3, z = null } = {}) {
  const { room, g } = ctx;
  const X = side < 0 ? 0 : ctx.cols;
  const xa = room.x(X, z0);
  const xb = room.x(X, z1);
  const lo = Math.ceil(Math.min(xa, xb));
  const hi = Math.floor(Math.max(xa, xb));
  const draw = () => {
    // relleno entre tablas
    for (let c = lo; c <= hi; c++) {
      const zc = zCol(ctx, side, c);
      if (zc < z0 || zc > z1) continue;
      for (let k = 0; k < Ys.length - 1; k++) {
        const yb = Math.floor(room.y(Ys[k], zc)) - 1;
        const yt = Math.ceil(room.y(Ys[k + 1], zc)) + 1;
        const n = yb - yt + 1;
        for (let r = yb, i = 0; r >= yt; r--, i++) {
          const ch = relleno(c, k, i, n, zc);
          if (ch) g.put(c, r, ch);
        }
      }
    }
    // tablas
    for (const Y of Ys) g.line(xa, room.y(Y, z0), xb, room.y(Y, z1));
    // montantes
    for (let i = 0; i < montantes; i++) {
      const zm = z0 + ((z1 - z0) * i) / Math.max(1, montantes - 1);
      const xm = Math.round(room.x(X, zm));
      g.vline(xm, Math.ceil(room.y(Ys[Ys.length - 1], zm)), Math.floor(room.y(Ys[0], zm)) - 1, '|');
    }
  };
  if (z) ctx.at(z, draw);
  else draw();
  return { xa, xb };
}

// Rellenos típicos para repisasLado
export const RELLENO = {
  libros: (ctx) => (c, k, i, n) => {
    const h = hash2(c * 3 + k * 101, 7);
    const top = Math.max(1, Math.floor(n * (0.55 + h * 0.45)));
    if (i >= top) return 0;
    if (h < 0.08) return i === top - 1 ? '/' : 0;
    return i === top - 1 && h > 0.7 ? '¯' : h < 0.3 ? ':' : '|';
  },
  botellas: (ctx) => (c, k, i, n) => {
    const h = hash2(c * 5 + k * 31, 3);
    if (c % 2) return i === 0 && h < 0.3 ? '_' : 0;
    const top = Math.min(n - 1, 3 + Math.floor(h * 2));
    if (i >= top) return 0;
    if (i === top - 1) return h < 0.5 ? '¡' : '!';
    if (i === top - 2) return '|';
    return h < 0.4 ? '[' : '|';
  },
  cajas: (ctx) => (c, k, i, n) => {
    if (i >= n - 1) return 0;
    const m = c % 4;
    if (i % 2 === 0) return '_';
    if (m === 0) return '|';
    return m === 2 && hash2(c, k * 7 + i) < 0.5 ? '·' : ' ';
  },
  frascos: (ctx) => (c, k, i, n) => {
    const cc = c % 3;
    if (i > 1) return 0;
    if (i === 1) return cc === 0 ? 'n' : 0;
    return cc === 2 ? 0 : cc === 0 ? '(' : ')';
  },
  zapatos: (ctx) => (c, k, i, n) => {
    if (i > 1) return 0;
    const cc = c % 4;
    if (i === 1) return cc === 1 ? '_' : cc === 2 ? '/' : 0;
    return cc === 0 ? '(' : cc === 3 ? 0 : '_';
  },
  latas: (ctx) => (c, k, i, n) => {
    const h = hash2(c * 11 + k, 9);
    if (i >= Math.min(n, 2 + (h < 0.5 ? 1 : 0))) return 0;
    const cc = c % 2;
    return cc ? (i % 2 ? '¯' : 'o') : '|';
  },
};

// --- muebles -----------------------------------------------------------------

// Un mesón en perspectiva con la cara de adelante decorada.
//   cara: 'paneles' | 'tablas' | 'vidrio' | 'azulejo' | 'reja' | 'liso' | fn(c, r, w, h)
export function meson(ctx, X0, X1, z0, z1, H, cara = 'paneles', base) {
  const { room } = ctx;
  let fill = null;
  if (typeof cara === 'function') fill = cara;
  else
    fill = (c, r) => {
      if (cara === 'paneles') return c % 8 === 0 && r > 0 ? '|' : r === 1 && c % 8 === 4 ? 'o' : 0;
      if (cara === 'tablas') return r > 0 && r % 2 === 0 ? '_' : c % 11 === 0 && r % 2 ? '|' : 0;
      if (cara === 'azulejo') return r % 2 === 0 && r > 0 ? '_' : (c + (r % 4 < 2 ? 0 : 2)) % 4 === 0 ? '|' : 0;
      if (cara === 'puntos') return (c + r) % 2 === 0 && r > 0 && c % 2 === 0 ? '.' : 0;
      return 0;
    };
  return ctx.at(z0, () => room.box(X0, X1, H, z0, z1, fill, base));
}

// La fila de la cubierta de un mesón a la profundidad z (para apoyar cosas).
export function cubierta(ctx, H, z, base = ctx.rows) {
  return Math.round(ctx.room.y(base - H, z));
}

// Taburete visto de frente, de alto h filas.
export function taburete(h) {
  const rows = [' ___ ', '(___)'];
  for (let i = 2; i < h - 1; i++) rows.push('  |  ');
  rows.push(' /|\\ ');
  return S(rows.slice(0, Math.max(3, h)));
}

// Mesa redonda de frente (ancho w, alto h filas)
export function mesa(w, h) {
  const rows = [' ' + '_'.repeat(w - 2) + ' ', '(' + '_'.repeat(w - 2) + ')'];
  const m = Math.floor(w / 2);
  for (let i = 2; i < h - 1; i++) rows.push(' '.repeat(m - 1) + '| |');
  rows.push(' '.repeat(m - 2) + '_/ \\_');
  return S(rows);
}

// Silla de frente
export function silla(h) {
  const rows = ['.---.', '|   |', '|___|'];
  for (let i = 3; i < h - 1; i++) rows.push('|   |');
  rows.push('|   |');
  return S(rows.slice(0, Math.max(4, h)));
}

// --- letreros y carteles ------------------------------------------------------

// Letrero con el nombre del local. estilo: caja | doble | neon | pintado | colgante
// Devuelve { x0, x1, y0, y1, luces: [[x,y]...] }.
export function letrero(ctx, cx, y, texto, estilo = 'caja') {
  const { g } = ctx;
  const w = texto.length + 4;
  const x0 = Math.round(cx - w / 2);
  const x1 = x0 + w - 1;
  const luces = [];
  if (estilo === 'pintado') {
    const s = texto.split('').join(' ');
    const xs = Math.round(cx - s.length / 2);
    ctx.text(xs - 1, y, ' ' + s + ' ');
    g.hline(xs, xs + s.length - 1, y + 1, '¯');
    return { x0: xs, x1: xs + s.length, y0: y, y1: y + 1, luces };
  }
  if (estilo === 'colgante') {
    g.put(x0 + 2, y - 2, '|');
    g.put(x1 - 2, y - 2, '|');
    g.put(x0 + 2, y - 1, '|');
    g.put(x1 - 2, y - 1, '|');
  }
  ctx.text(x0, y - 1, ' ' + '_'.repeat(w - 2) + ' ');
  ctx.text(x0, y, '|' + ' ' + texto + ' ' + '|');
  ctx.text(x0, y + 1, '|' + '_'.repeat(w - 2) + '|');
  if (estilo === 'doble') {
    ctx.text(x0 - 1, y - 1, ' ');
    g.put(x0 - 1, y, '[');
    g.put(x1 + 1, y, ']');
  }
  if (estilo === 'neon') {
    // ampolletas alrededor
    for (let x = x0 + 1; x < x1; x += 2) {
      luces.push([x, y - 2]);
    }
    luces.push([x0 - 1, y], [x1 + 1, y]);
    for (const [lx, ly] of luces) g.put(lx, ly, '·');
  }
  return { x0, x1, y0: y - 1, y1: y + 1, luces };
}

// Luces de un letrero que titilan en orden (de noche brillan).
export function lucesAnim(ctx, luces, z = ctx.Z) {
  if (!luces.length) return;
  ctx.anim(z, (out, t) => {
    const k = Math.floor(t * 4);
    for (let i = 0; i < luces.length; i++) {
      const on = ctx.night ? (i + k) % 3 !== 0 : (i + k) % 6 === 0;
      out.put(luces[i][0], luces[i][1], on ? '*' : '·');
    }
  });
}

// Pizarra con el menú y los precios. lineas: [['ITALIANO', '2.500'], 'texto', ...]
export function pizarra(ctx, x, y, w, lineas, { titulo = null, tiza = true, marco = 'madera' } = {}) {
  const h = lineas.length + (titulo ? 2 : 0) + 2;
  const { g } = ctx;
  ctx.text(x, y, ' ' + '_'.repeat(w - 2) + ' ');
  for (let r = 1; r < h; r++) ctx.text(x, y + r, '|' + ' '.repeat(w - 2) + '|');
  ctx.text(x, y + h, '|' + '_'.repeat(w - 2) + '|');
  if (marco === 'madera') {
    g.put(x, y + h, '|');
  }
  let r = y + 1;
  if (titulo) {
    const tx = x + Math.floor((w - titulo.length) / 2);
    ctx.text(tx, r, titulo);
    ctx.ink(tx, r + 1, '~'.repeat(titulo.length));
    r += 2;
  }
  for (const l of lineas) {
    if (Array.isArray(l)) {
      const [a, p] = l;
      const dots = Math.max(1, w - 4 - a.length - p.length);
      ctx.text(x + 2, r, a + (tiza ? ' ' + '.'.repeat(Math.max(0, dots - 2)) + ' ' : ' '.repeat(dots)) + p);
    } else if (l) ctx.text(x + 2, r, l.slice(0, w - 4));
    r++;
  }
  // polvo de tiza
  if (tiza) {
    for (let k = 0; k < w; k += 3) {
      const rr = y + 1 + Math.floor(hash2(x + k, y) * (h - 1));
      const cc = x + 1 + Math.floor(hash2(k, y + 9) * (w - 2));
      if (g.get(cc, rr) === SP) g.put(cc, rr, '.');
    }
  }
  return { x0: x, x1: x + w - 1, y0: y, y1: y + h };
}

// Cartel o afiche simple: un marco con filas de texto o dibujo adentro.
export function afiche(ctx, x, y, filas, { borde = true } = {}) {
  const w = Math.max(...filas.map((f) => f.length)) + 2;
  if (borde) ctx.text(x, y, ' ' + '_'.repeat(w - 2) + ' ');
  filas.forEach((f, i) => ctx.text(x, y + 1 + i, '|' + f.padEnd(w - 2) + '|'));
  ctx.text(x, y + 1 + filas.length, '|' + '_'.repeat(w - 2) + '|');
  return { x0: x, x1: x + w - 1, y0: y, y1: y + filas.length + 1 };
}

// --- techo y luces -----------------------------------------------------------------

// Lámpara colgando del techo a profundidad z, en la columna de adelante X.
// tipo: campana | globo | tubo | ampolleta. Devuelve su posición en pantalla.
export function lampara(ctx, X, z = 1.3, tipo = 'campana', largo = 3) {
  const { room, g } = ctx;
  const x = ctx.px(X, z);
  const yc = Math.ceil(room.ceilY(z));
  // el cable no baja más allá del borde de arriba de la pared del fondo
  const yl = Math.max(yc + 1, Math.min(yc + largo, Math.floor(room.by0) - 2));
  return ctx.at(z, () => {
    g.vline(x, yc, yl - 1, '|');
    if (tipo === 'campana') {
      ctx.text(x - 2, yl, ' _|_ ');
      ctx.text(x - 2, yl + 1, '/___\\');
      return { x, y: yl + 2, tipo };
    }
    if (tipo === 'globo') {
      ctx.text(x - 1, yl, '.-.');
      ctx.text(x - 1, yl + 1, '(_)');
      return { x, y: yl + 2, tipo };
    }
    if (tipo === 'tubo') {
      ctx.text(x - 6, yl, '[===========]');
      g.put(x - 4, yl - 1, '|');
      g.put(x + 4, yl - 1, '|');
      return { x, y: yl + 1, tipo, w: 13 };
    }
    ctx.text(x, yl, 'o');
    return { x, y: yl + 1, tipo };
  });
}

// Brillo de las lámparas: de noche un cono de puntos que respira.
export function brillo(ctx, lamps, z) {
  ctx.anim(z || ctx.Z, (out, t) => {
    if (!ctx.night) return;
    for (const l of lamps) {
      if (l.tipo === 'tubo') {
        const flick = hash2(Math.floor(t * 12), l.x) < 0.04;
        if (!flick) for (let i = -5; i <= 5; i += 2) out.put(l.x + i, l.y - 1, '=');
        continue;
      }
      out.put(l.x, l.y - 1, '*');
      const k = Math.floor(t * 1.5) % 2;
      for (let r = 1; r <= 3; r++) {
        for (let c = -r * 2; c <= r * 2; c += 2) {
          if ((c / 2 + r + k) % 2) continue;
          const xx = l.x + c;
          const yy = l.y + r;
          if (out.get(xx, yy) === SP) out.put(xx, yy, r === 3 ? '.' : '·');
        }
      }
    }
  });
}

// Ventilador de techo que gira.
export function ventilador(ctx, X, z) {
  const { room, g } = ctx;
  const x = ctx.px(X, z);
  const yc = Math.ceil(room.ceilY(z));
  const y = yc + 2;
  ctx.at(z, () => {
    g.vline(x, yc, y - 1, '|');
  });
  const ASPAS = ['--==(o)==--', ' \\_ (o) _/ ', '  ¯-(o)-¯  ', ' /¯ (o) ¯\\ '];
  ctx.anim(z, (out, t) => {
    const s = ASPAS[Math.floor(t * 10) % ASPAS.length];
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') out.put(x - 5 + i, y, s[i]);
  });
}

// --- aberturas ----------------------------------------------------------------------

// Ventana en una pared lateral con la calle detrás: de día luz que entra en
// rayas por el piso; de noche estrellas, la luna o un farol. Devuelve el hueco.
export function ventanaLado(ctx, side, z0, z1, Y0, Y1, { rayos = true, letras = null } = {}) {
  const { room, g, night } = ctx;
  const h = room.sideOpening(side, z0, z1, Y0, Y1, 'ventana');
  const lo = Math.ceil(Math.min(h.xa, h.xb)) + 1;
  const hi = Math.floor(Math.max(h.xa, h.xb)) - 1;
  const zm = (z0 + z1) / 2;
  const xm = Math.round(room.x(side < 0 ? 0 : ctx.cols, zm));
  // vista: de noche estrellas, de día algo de cielo
  for (let c = lo; c <= hi; c++) {
    if (c === xm) continue;
    const u = (c + 0.5 - h.xa) / (h.xb - h.xa);
    const top = h.ta + (h.tb - h.ta) * u;
    const bot = h.ba + (h.bb - h.ba) * u;
    for (let r = Math.ceil(top) + 1; r < bot - 1; r++) {
      const v = hash2(c * 13, r * 7);
      if (night) {
        if (v < 0.07) g.put(c, r, v < 0.015 ? '*' : '.');
      } else if (v < 0.05 && !letras) g.put(c, r, '~');
    }
  }
  // letras pintadas en el vidrio, al revés (se leen desde la calle)
  if (letras) {
    // vistas desde adentro las letras quedan al revés: de izquierda a derecha
    // en pantalla se lee el texto invertido
    const n = letras.length;
    const pos = [];
    for (let i = 0; i < n; i++) {
      const u = (i + 1) / (n + 1);
      const z = z0 + (z1 - z0) * u;
      pos.push([Math.round(room.x(side < 0 ? 0 : ctx.cols, z)), Math.round(room.y(Math.min(Y1 - 1, ctx.vy + 1), z))]);
    }
    pos.sort((a, b2) => a[0] - b2[0]);
    const rev = letras.split('').reverse();
    let last = -9;
    pos.forEach(([c, r], i) => {
      const cc2 = Math.max(c, last + 1);
      last = cc2;
      if (rev[i] !== ' ') g.put(cc2, r, rev[i]);
    });
  }
  // rayos de sol en el piso
  if (rayos && !night) {
    const X = side < 0 ? 0 : ctx.cols;
    for (let k = 0; k < 4; k++) {
      const z = z0 + ((z1 - z0) * (k + 0.5)) / 4;
      const xs = room.x(X, z);
      const ys = room.floorY(z);
      const len = Math.round((ctx.cols * 0.12) / z);
      for (let i = 0; i < len; i++) {
        const cx = Math.round(xs - side * (i * 1.6 + 2));
        const ry = Math.round(ys + i * 0.15 - 1);
        if (g.get(cx, ry) === SP || g.get(cx, ry) === 46) g.put(cx, ry, side < 0 ? '\\' : '/');
      }
    }
  }
  return h;
}

// Puerta a la trastienda con cortina de tiras que se mece.
export function puertaLado(ctx, side, z0, z1, { cortina = true, rotulo = null } = {}) {
  const { room, g } = ctx;
  const h = room.sideOpening(side, z0, z1, ctx.rows * 0.24, ctx.rows, 'puerta');
  const lo = Math.ceil(Math.min(h.xa, h.xb)) + 1;
  const hi = Math.floor(Math.max(h.xa, h.xb)) - 1;
  const tiras = [];
  if (cortina) {
    for (let c = lo; c <= hi; c += 2) {
      const u = (c + 0.5 - h.xa) / (h.xb - h.xa);
      const top = Math.ceil(h.ta + (h.tb - h.ta) * u) + 1;
      const bot = Math.floor(h.ba + (h.bb - h.ba) * u) - 3;
      tiras.push({ c, top, bot });
      for (let r = top; r <= bot; r++) g.put(c, r, (r + c) % 3 ? '|' : '¦');
    }
  }
  if (rotulo) {
    const c = Math.round((h.xa + h.xb) / 2 - rotulo.length / 2);
    const r = Math.round(Math.min(h.ta, h.tb)) - 1;
    ctx.text(c, r, rotulo);
  }
  if (tiras.length) {
    ctx.anim(z1, (out, t) => {
      // la cortina se mueve de a ratos
      const gust = Math.max(0, Math.sin(t * 0.7 + ctx.seed));
      if (gust < 0.6) return;
      for (const s of tiras) {
        const off = Math.round(Math.sin(t * 6 + s.c) * gust);
        for (let r = s.bot - 3; r <= s.bot; r++) {
          out.put(s.c, r, ' ');
          out.put(s.c + off, r, off ? (off > 0 ? '\\' : '/') : '|');
        }
      }
    });
  }
  return h;
}

// --- partículas ------------------------------------------------------------------

// Vapor que sube desde (x, y): n hilos de alto h que se mecen.
export function vapor(out, x, y, t, { n = 3, h = 4, ancho = 1.2, glifos = '~~(.', vel = 0.8 } = {}) {
  for (let k = 0; k < n; k++) {
    const p = (t * vel + k / n) % 1;
    const r = y - Math.floor(p * h);
    const c = x + Math.round(Math.sin(t * 2 + k * 2.1) * ancho) + (k - (n >> 1));
    const gi = Math.min(glifos.length - 1, Math.floor(p * glifos.length));
    out.put(c, r, glifos[gi]);
  }
}

// Humo de una plancha: nubes que suben y se abren.
export function humo(out, x0, x1, y, t, h = 5) {
  for (let c = x0; c <= x1; c += 2) {
    const p = (t * 0.5 + hash2(c, 3)) % 1;
    const r = y - Math.floor(p * h);
    const dx = Math.round(Math.sin(t * 1.3 + c) * p * 2);
    out.put(c + dx, r, p < 0.3 ? '~' : p < 0.7 ? '(' : p < 0.85 ? ')' : '.');
  }
}

// Notas musicales flotando.
export function notas(out, x, y, t, n = 3, h = 6) {
  for (let k = 0; k < n; k++) {
    const p = (t * 0.35 + k / n) % 1;
    const r = y - Math.floor(p * h);
    const c = x + Math.round(Math.sin(t + k * 2) * 3) + k * 2;
    out.put(c, r, (k + Math.floor(t)) % 2 ? '♪' : '♫');
  }
}

// --- relojes ------------------------------------------------------------------------

// Reloj de la hora real: chico (1 fila "(·)" con la aguja como glifo), mediano
// (3 filas) o grande (radio en filas). horas: desfase de huso horario.
const AGUJA = ['|', '/', '-', '\\', '|', '/', '-', '\\'];
export function relojChico(out, x, y, d = new Date(), horas = 0) {
  const m = d.getMinutes();
  const k = Math.round(((((d.getHours() + horas) % 12) + m / 60) / 12) * 8) % 8;
  out.put(x, y, '(');
  out.put(x + 1, y, AGUJA[k]);
  out.put(x + 2, y, ')');
}

// Reloj redondo de radio r filas (r >= 2): dibuja la esfera en la base y las
// agujas en cada cuadro. Devuelve { cx, cy, r }.
export function esfera(ctx, cx, cy, r, { numeros = true, marco = true } = {}) {
  const { g } = ctx;
  const rx = r * 2;
  for (let a = 0; a < 64; a++) {
    const th = (a / 64) * Math.PI * 2;
    const c = Math.round(cx + Math.cos(th) * rx);
    const rr = Math.round(cy + Math.sin(th) * r);
    const s = Math.sin(th);
    const co = Math.cos(th);
    let ch = Math.abs(s) > 0.92 ? (s < 0 ? '_' : '_') : Math.abs(co) > 0.85 ? (co < 0 ? '(' : ')') : s * co < 0 ? '/' : '\\';
    if (s < -0.92) ch = '_';
    if (marco) g.put(c, s < -0.92 ? rr - 0 : rr, ch);
  }
  // el interior opaco
  for (let rr = cy - r + 1; rr <= cy + r - 1; rr++) {
    const dy = (rr - cy) / r;
    const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - dy * dy))) - 1;
    for (let c = cx - half; c <= cx + half; c++) g.put(c, rr, ' ');
  }
  if (numeros) {
    g.put(cx, cy - r + 1, r >= 3 ? '12'[0] : '·');
    if (r >= 3) g.put(cx + 1, cy - r + 1, '2');
    g.put(cx + rx - 2, cy, r >= 3 ? '3' : '·');
    g.put(cx, cy + r - 1, r >= 3 ? '6' : '·');
    g.put(cx - rx + 2, cy, r >= 3 ? '9' : '·');
  }
  g.put(cx, cy, 'o');
  return { cx, cy, r };
}

// Agujas de una esfera con la hora real (+ desfase).
export function agujas(out, e, d = new Date(), horas = 0, segundero = true) {
  const { cx, cy, r } = e;
  const h = ((d.getHours() + horas + 24) % 12) + d.getMinutes() / 60;
  const m = d.getMinutes() + d.getSeconds() / 60;
  const s = d.getSeconds() + d.getMilliseconds() / 1000;
  const hand = (frac, len, ch) => {
    const th = frac * Math.PI * 2 - Math.PI / 2;
    for (let i = 1; i <= len; i++) {
      const c = Math.round(cx + Math.cos(th) * i * 2 * (r / Math.max(1, r)) * 0.95);
      const rr = Math.round(cy + Math.sin(th) * i * 0.95);
      const a = ((frac * 8 + 0.5) | 0) % 8;
      out.put(c, rr, ch || AGUJA[a]);
    }
  };
  hand(h / 12, Math.max(1, Math.round(r * 0.5)));
  hand(m / 60, Math.max(1, r - 1));
  if (segundero && r >= 3) {
    const th = (s / 60) * Math.PI * 2 - Math.PI / 2;
    out.put(Math.round(cx + Math.cos(th) * (r - 1) * 2), Math.round(cy + Math.sin(th) * (r - 1)), '·');
  }
  out.put(cx, cy, 'o');
}

// Reloj de pared redondo de 3 filas "(·)" ancho 5 con la hora real.
export function relojPared(ctx, x, y) {
  ctx.text(x, y - 1, ' .-. ');
  ctx.text(x, y, '( · )');
  ctx.text(x, y + 1, " `-' ");
  ctx.anim(ctx.Z, (out) => {
    const d = new Date();
    const k = Math.round(((d.getMinutes() / 60) * 8)) % 8;
    const kh = Math.round((((d.getHours() % 12) / 12) * 8)) % 8;
    // la aguja de los minutos en el centro, la de las horas como tic al lado
    out.put(x + 2, y, AGUJA[k]);
    const off = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]][kh];
    if (off[1] === 0) out.put(x + 2 + off[0], y, off[0] > 0 ? '-' : '-');
    void off;
  });
}

// --- bocadillos -------------------------------------------------------------------

export function bocadillo(out, x, y, s, dir = 1) {
  const w = s.length + 2;
  let x0 = Math.round(x - (dir > 0 ? 1 : w - 2));
  x0 = Math.max(0, Math.min(out.w - w - 1, x0));
  out.text(x0, y - 2, ' ' + '_'.repeat(w - 2) + ' ');
  out.text(x0, y - 1, '(' + s + ')');
  out.text(x0, y, ' ' + '¯'.repeat(w - 2) + ' ');
  const tx = Math.max(x0 + 1, Math.min(x0 + w - 2, Math.round(x)));
  out.put(tx, y, dir > 0 ? '\\' : '/');
}

// --- actores --------------------------------------------------------------------------

// Una persona quieta o haciendo algo en (X, z), anclada por los pies.
// poses: arreglo de [pose, segundos] que se repite; o fn(t) → pose.
export function figura(ctx, { X, z, look = {}, poses = [['parado', 2]], h = null, parpadea = true, dy = 0, clip = null }) {
  const H = h || ctx.alto(z);
  const total = Array.isArray(poses) ? poses.reduce((a, p) => a + p[1], 0) : 0;
  const ph = hash2(ctx.seed, Math.round(X)) * 10;
  ctx.anim(z, (out, t) => {
    let pose = 'parado';
    let objeto = look.objeto;
    if (typeof poses === 'function') pose = poses(t);
    else {
      let u = (t + ph) % total;
      for (const p of poses) {
        if (u < p[1]) {
          pose = p[0];
          if (p[2]) objeto = p[2];
          break;
        }
        u -= p[1];
      }
    }
    let cara = look.cara;
    if (parpadea && !cara && hash2(Math.floor((t + ph) * 3), 17) < 0.07) cara = 'cierra';
    const s = persona(H, { ...look, cara: cara || look.cara, pose, objeto });
    const x = ctx.px(X, z) - s.cx;
    const y = ctx.piso(z) - s.h + dy;
    if (clip) {
      // sólo se dibujan las filas por encima de clip (p. ej. tras un mostrador)
      ctx.blitZ(out, recorte(s, clip - y), x, y, z);
    } else ctx.blitZ(out, s, x, y, z);
  });
}

const recortes = new Map();
function recorte(s, n) {
  if (n >= s.h) return s;
  const k = s;
  let m = recortes.get(k);
  if (!m) recortes.set(k, (m = new Map()));
  let r = m.get(n);
  if (!r) {
    r = { w: s.w, h: Math.max(0, n), data: s.data.slice(0, Math.max(0, n) * s.w), cx: s.cx };
    m.set(n, r);
  }
  return r;
}

// Clientes que entran desde atrás de la cámara (las esquinas de abajo), van
// hasta un punto frente al mesón, piden algo, esperan y se van.
//   puntos: [{X, z}] lugares donde se paran
//   dice / responde: frases (la respuesta va sobre el vendedor)
//   vend: {X, z} posición del vendedor para su respuesta
export function clientes(ctx, { puntos, periodo = 18, looks = null, dice = [], responde = [], vend = null, bolsa = true, entra = null }) {
  const { cols } = ctx;
  const n = puntos.length;
  const LOOKS = looks || [
    { ropa: 'abrigo', gorro: 'boina' },
    { ropa: 'vestido', pelo: 'largo' },
    { ropa: 'rayas', gorro: 'jockey' },
    { ropa: 'polera' },
    { ropa: 'camisa', cara: 'lentes' },
    { ropa: 'vestido', gorro: 'moño' },
    { ropa: 'abrigo', cara: 'bigote' },
  ];
  for (let i = 0; i < n; i++) {
    const p = puntos[i];
    const fromLeft = entra ? entra[i % entra.length] < 0 : (i + ctx.seed) % 2 === 0;
    const e = { X: fromLeft ? -cols * 0.08 : cols * 1.08, z: 1.02 };
    const ph = (periodo / n) * i + hash2(ctx.seed, i) * 3;
    const tIn = 3.2;
    const tStay = Math.min(periodo * 0.45, 7);
    const tOut = 3;
    const lookBase = LOOKS[(i * 3 + ctx.seed) % LOOKS.length];
    const lineA = dice.length ? dice[(i + ctx.seed) % dice.length] : null;
    const lineB = responde.length ? responde[(i + ctx.seed) % responde.length] : null;
    ctx.anim(p.z - 0.001 * i, (out, t) => {
      const u = (t + ph) % periodo;
      const cycle = Math.floor((t + ph) / periodo);
      let X;
      let z;
      let pose;
      let cara;
      const look = (cycle % 2 ? LOOKS[(i * 3 + ctx.seed + cycle) % LOOKS.length] : lookBase);
      let conBolsa = false;
      if (u < tIn) {
        const k = u / tIn;
        const kk = k * k * (3 - 2 * k);
        X = e.X + (p.X - e.X) * kk;
        z = e.z + (p.z - e.z) * k;
        pose = Math.floor(u * 4) % 2 ? 'pasoA' : 'pasoB';
        cara = 'espalda';
      } else if (u < tIn + tStay) {
        X = p.X;
        z = p.z;
        pose = 'parado';
        cara = 'espalda';
        const v = u - tIn;
        if (v > tStay * 0.55) pose = 'manos';
      } else if (u < tIn + tStay + tOut) {
        const k = (u - tIn - tStay) / tOut;
        X = p.X + (e.X - p.X) * k * k;
        z = p.z + (e.z - p.z) * k;
        pose = Math.floor(u * 4) % 2 ? 'pasoA' : 'pasoB';
        cara = undefined;
        conBolsa = bolsa;
      } else return;
      const H = ctx.alto(z);
      const s = persona(H, { ...look, cara: cara || look.cara, pose: conBolsa && pose === 'pasoB' ? 'lleva' : pose });
      const x = ctx.px(X, z) - s.cx;
      const y = ctx.piso(z) - s.h;
      ctx.blitZ(out, s, x, y, z);
      // diálogo
      const v = u - tIn;
      if (v > 0.6 && v < 3.2 && lineA) bocadillo(out, x + s.cx + 2, y - 1, lineA, 1);
      if (v > 3.4 && v < 5.6 && lineB && vend) {
        const vx = ctx.px(vend.X, vend.z);
        const vy = ctx.piso(vend.z) - ctx.alto(vend.z) - 1;
        bocadillo(out, vx + 3, vy, lineB, -1);
      }
    });
  }
}

// Gato: sentado, echado o lavándose, en (x, y) de pantalla (pies) y prof. z.
export function gato(ctx, x, y, z, tipo = 'sentado') {
  const fr = GATO[tipo] || GATO.sentado;
  ctx.anim(z, (out, t) => {
    let k = 0;
    if (tipo === 'echado') k = Math.floor(t / 1.6) % 2;
    else if (tipo === 'lava') k = Math.floor(t * 1.5) % 6 < 2 ? 1 : hash2(Math.floor(t * 2), 3) < 0.1 ? 2 : 0;
    else k = hash2(Math.floor(t * 2), 7) < 0.12 ? 1 : Math.floor(t * 0.8) % 3 === 2 ? 2 : 0;
    const s = fr[Math.min(k, fr.length - 1)];
    ctx.blitZ(out, s, x, y - s.h, z);
    if (tipo === 'echado' && Math.floor(t / 1.6) % 2 === 0) {
      const p = (t % 1.6) / 1.6;
      out.put(x + 1 + Math.floor(p * 3), y - s.h - 1 - Math.floor(p * 2), p < 0.5 ? 'z' : 'Z');
    }
  });
}

// Mosca que da vueltas por una zona.
export function mosca(ctx, x0, y0, x1, y1, z = 1.01) {
  ctx.anim(z, (out, t) => {
    const a = t * 2.3;
    const x = Math.round((x0 + x1) / 2 + Math.sin(a) * (x1 - x0) * 0.5 + Math.sin(a * 3.1) * 2);
    const y = Math.round((y0 + y1) / 2 + Math.sin(a * 1.7) * (y1 - y0) * 0.5);
    out.put(x, y, Math.floor(t * 10) % 2 ? '°' : '·');
  });
}

// --- utilidades -----------------------------------------------------------------------

// rellena un sprite de filas con el fondo de la pared hecho de `: :` u otra textura
export function textura(ctx, x0, y0, x1, y1, fn) {
  const { g } = ctx;
  for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) {
    const ch = fn(c, r);
    if (ch) g.put(c, r, ch);
  }
}

export const precio = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export { persona, SP, T, hash2 };

// --- planos y formas ------------------------------------------------------------------

// El plano típico: un mesón de lado a lado con el vendedor detrás.
//   X0, X1 fracciones del ancho; f0 profundidad (fracción de la sala); H alto
//   (fracción de las filas). Devuelve la cara del mesón y sus medidas.
export function planoMeson(ctx, { X0 = 0.2, X1 = 0.8, f0 = 0.33, prof = 0.1, H = 0.18, cara = 'paneles' } = {}) {
  const { cols, rows } = ctx;
  const z0 = ctx.zf(f0);
  const z1 = z0 + (ctx.Z - 1) * prof;
  const h = rows * H;
  const m = meson(ctx, cols * X0, cols * X1, z0, z1, h, cara);
  return {
    ...m,
    z0,
    z1,
    H: h,
    top: m.r0 - 2, // fila donde se apoyan las cosas
    X0: cols * X0,
    X1: cols * X1,
    // columna de pantalla de una X de adelante sobre el mesón
    cx: (X) => ctx.px(X, z0),
  };
}

// Arco (media elipse de arriba) con base en la fila yb; vacía el interior si
// `vaciar`. Devuelve una función que dice si (c, r) queda adentro.
export function arco(ctx, cx, yb, rx, ry, { vaciar = true, z = null } = {}) {
  const { g } = ctx;
  const inside = (c, r) => {
    const dx = (c + 0.5 - cx) / rx;
    const dy = (yb - r - 0.5) / ry;
    return dy >= -0.01 && dx * dx + dy * dy < 1;
  };
  const draw = () => {
    if (vaciar) for (let r = Math.floor(yb - ry); r <= yb; r++) for (let c = Math.floor(cx - rx); c <= cx + rx; c++) if (inside(c, r) && r < yb) g.put(c, r, SP);
    const N = 24;
    let px = cx - rx;
    let py = yb;
    for (let i = 1; i <= N; i++) {
      const a = Math.PI - (i / N) * Math.PI;
      const x = cx + Math.cos(a) * rx;
      const y = yb - Math.sin(a) * ry;
      g.line(px, py, x, y);
      px = x;
      py = y;
    }
  };
  if (z) ctx.at(z, draw);
  else draw();
  return inside;
}

// Ladrillos: el patrón "_|___|___" corrido en filas alternas.
export const ladrillo = (c, r) => ((c + (r % 2) * 2) % 4 === 0 ? '|' : '_');

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

// Un cuadro, espejo o afiche colgado en una pared lateral, en perspectiva:
// de z0 a z1 y de alto Y0..Y1 (unidades de adelante). fill(c, r, u, v) da el
// glifo de adentro (u a lo hondo, v hacia abajo, ambos en 0..1).
export function cuadroLado(ctx, side, z0, z1, Y0, Y1, fill = null, { z = null, marco = true } = {}) {
  const { room, g } = ctx;
  const X = side < 0 ? 0 : ctx.cols;
  const xa = room.x(X, z0);
  const xb = room.x(X, z1);
  const draw = () => {
    for (let c = Math.ceil(Math.min(xa, xb)); c <= Math.floor(Math.max(xa, xb)); c++) {
      const zc = zCol(ctx, side, c);
      if (zc < z0 || zc > z1) continue;
      const u = (zc - z0) / (z1 - z0);
      const top = room.y(Y0, zc);
      const bot = room.y(Y1, zc);
      for (let r = Math.ceil(top); r < bot; r++) {
        const v = (r + 0.5 - top) / (bot - top);
        const ch = fill ? fill(c, r, u, v) : SP;
        if (ch) g.put(c, r, ch);
      }
    }
    if (marco) {
      g.line(xa, room.y(Y0, z0), xb, room.y(Y0, z1));
      g.line(xa, room.y(Y1, z0), xb, room.y(Y1, z1));
      g.vline(Math.round(xa), Math.ceil(room.y(Y0, z0)), Math.floor(room.y(Y1, z0)) - 1, '|');
      g.vline(Math.round(xb), Math.ceil(room.y(Y0, z1)), Math.floor(room.y(Y1, z1)) - 1, '|');
    }
  };
  if (z) ctx.at(z, draw);
  else draw();
  return { xa, xb };
}

// Pizarra que cabe en un rectángulo: recorta líneas y título según el alto.
export function pizarraEn(ctx, x0, y0, x1, y1, lineas, { titulo = null, tiza = true } = {}) {
  const h = y1 - y0 + 1;
  let tit = titulo;
  let n = h - 2 - (tit ? 2 : 0);
  if (n < 2 && tit) {
    tit = null;
    n = h - 2;
  }
  n = Math.max(1, Math.min(lineas.length, n));
  const w = x1 - x0 + 1;
  const ls = lineas.slice(0, n).map((l) => (Array.isArray(l) && l[0].length + l[1].length + 5 > w ? [l[0].slice(0, Math.max(3, w - l[1].length - 6)), l[1]] : l));
  return pizarra(ctx, x0, y0, w, ls, { titulo: tit && tit.length <= w - 2 ? tit : null, tiza });
}

// Un cuadro de cordillera para las paredes de los costados.
export const CORDILLERA = (c, r, u, v) => {
  const m = 0.75 - 0.45 * Math.abs(Math.sin(u * 7.5)) - 0.1 * Math.sin(u * 17);
  if (v > m) return (c + r) % 2 ? ':' : '.';
  if (Math.abs(v - m) < 0.12) return '_';
  return 0;
};

// --- tele, banquetas y mesones del fondo -------------------------------------------------

// Tele colgada (ancho w, alto h filas de pantalla) con un partido o noticias.
export function tele(ctx, x, y, w = 14, h = 5, { cuelga = true, que = 'futbol', z = ctx.Z } = {}) {
  const { g } = ctx;
  ctx.at(z === ctx.Z ? 0 : z, () => {
    if (cuelga) for (let r = Math.ceil(ctx.room.ceilY(z)); r < y; r++) g.put(x + (w >> 1), r, '|');
    ctx.text(x, y, ' ' + '_'.repeat(w - 2) + ' ');
    for (let r = 1; r < h; r++) ctx.text(x, y + r, '|' + ' '.repeat(w - 2) + '|');
    ctx.text(x, y + h, '|' + '_'.repeat(w - 2) + '|');
    ctx.text(x + (w >> 1) - 2, y + h + 1, ' ¯¯¯ ');
  });
  const ix0 = x + 1;
  const ix1 = x + w - 2;
  const iy0 = y + 1;
  const iy1 = y + h - 1;
  ctx.anim(z, (out, t) => {
    if (que === 'futbol') {
      const iw = ix1 - ix0 + 1;
      // cancha: línea del medio, arcos y la pelota que va y viene
      for (let r = iy0; r <= iy1; r++) out.put(ix0 + (iw >> 1), r, ':');
      out.put(ix0, iy0 + ((iy1 - iy0) >> 1), ']');
      out.put(ix1, iy0 + ((iy1 - iy0) >> 1), '[');
      const bx = ix0 + 1 + Math.round(((Math.sin(t * 0.9) + 1) / 2) * (iw - 3));
      const by = iy0 + Math.round(((Math.sin(t * 1.7) + 1) / 2) * (iy1 - iy0));
      for (let k = 0; k < 4; k++) {
        const px = ix0 + 1 + Math.round(((Math.sin(t * 0.9 - 0.4 - k * 0.7) + 1) / 2) * (iw - 3));
        const py = iy0 + ((k * 7 + Math.floor(t)) % (iy1 - iy0 + 1));
        out.put(px, py, 'i');
      }
      out.put(bx, by, 'o');
      if (Math.floor(t / 7) % 4 === 3) out.text(ix0 + 1, iy0, 'GOOOL'.slice(0, iw - 2));
    } else {
      // noticias: una cara que habla y la franja que corre
      const msg = ' ULTIMO MINUTO · LLUEVE EN LA CAPITAL · METRO NORMAL · ';
      const k = Math.floor(t * 4);
      const iw = ix1 - ix0 + 1;
      for (let i = 0; i < iw; i++) out.put(ix0 + i, iy1, msg[(i + k) % msg.length]);
      out.text(ix0 + (iw >> 1) - 2, iy0, ' .-. ');
      out.text(ix0 + (iw >> 1) - 2, iy0 + 1, Math.floor(t * 5) % 2 ? '(o o)' : '(o-o)');
    }
  });
  return { x0: x, x1: x + w - 1, y0: y, y1: y + h };
}

// Banquetas delante de un mesón, con gente sentada de espaldas en algunas.
//   m: el mesón (de planoMeson); n banquetas; ocupadas: índices con alguien
export function banquetas(ctx, m, { n = 4, ocupadas = [0, 2], looks = [], poses = null, dz = 0.07, desde = 0.08, hasta = 0.92 } = {}) {
  const { room, g } = ctx;
  const zs = m.z0 - (ctx.Z - 1) * dz;
  const fy = ctx.piso(zs);
  const hst = Math.max(3, Math.round((m.H * 0.62) / zs));
  const st = taburete(hst);
  const xs = [];
  for (let i = 0; i < n; i++) {
    const X = m.X0 + (m.X1 - m.X0) * (desde + ((hasta - desde) * (i + 0.5)) / n);
    xs.push(X);
    ctx.at(zs, () => g.blit(st, ctx.px(X, zs) - (st.w >> 1), fy - st.h));
  }
  const H = ctx.alto(zs);
  ocupadas.forEach((i, k) => {
    if (i >= n) return;
    // de espaldas y sentados: sólo el busto, apoyado en el asiento
    const look = { cara: 'espalda', ...(looks[k % Math.max(1, looks.length)] || {}), sienta: 'busto' };
    const ps = poses || [['parado', 2.2 + k * 0.7], ['toma', 1.4], ['parado', 1.5], ['manos', 1.2]];
    figura(ctx, { X: xs[i], z: zs - 0.002, look, poses: ps, h: H, dy: 1 - hst, parpadea: false });
  });
  return { zs, xs, hst, fy };
}

// Mesón de trabajo pegado a la pared del fondo (para la plancha, la cafetera…).
export function mesonFondo(ctx, X0, X1, H = ctx.rows * 0.2, cara = 'azulejo') {
  const z1 = ctx.Z - 0.02;
  const z0 = z1 - (ctx.Z - 1) * 0.12;
  const m = meson(ctx, X0, X1, z0, z1, H, cara);
  return { ...m, z0, z1, H, top: m.r0 - 2 };
}

// Una mesa con dos personas: una de frente detrás de la mesa y otra de
// espaldas adelante, en su silla. cosas: lo que hay sobre la mesa.
export function mesaGente(ctx, X, z, { a = {}, b = { ropa: 'abrigo' }, w = null, cosas = 'u  u', posesA = null, posesB = null, solo = false, vapor: humea = true } = {}) {
  const { room, rows, cols } = ctx;
  const dz = (ctx.Z - 1) * 0.07;
  const H = ctx.alto(z);
  const wf = w || Math.max(10, Math.round(H * 0.85)) * z; // ancho en unidades de adelante
  const th = rows * 0.15; // alto de la mesa
  const m = meson(ctx, X - wf / 2, X + wf / 2, z, z + dz, th, (c, r) => (r > 0 && c % 6 === 3 ? '¦' : 0));
  ctx.at(z, () => ctx.text(Math.round((m.c0 + m.c1) / 2 - cosas.length / 2), m.r0 - 2, cosas));
  // de frente, detrás de la mesa (la mesa le tapa la cintura)
  const zA = z + dz * 1.6;
  const HA = ctx.alto(zA);
  const hipA = ctx.piso(zA) - Math.round(HA * 0.3);
  figura(ctx, { X, z: zA, look: { ...a, sienta: 'busto' }, h: HA, poses: posesA || [['parado', 2.4], ['toma', 1.5], ['parado', 2], ['saluda', 0.6]], dy: hipA - ctx.piso(zA) + 1 });
  // respaldo de su silla
  ctx.at(zA + 0.01, () => {
    const sx = ctx.px(X, zA);
    const sy = hipA - Math.round(HA * 0.32);
    ctx.text(sx - 3, sy, '.-----.');
    for (let r = sy + 1; r < hipA; r++) ctx.text(sx - 3, r, '|     |');
  });
  if (!solo) {
    // de espaldas, adelante, en una silla que le tapa la espalda baja
    const zB = z - dz * 0.9;
    const HB = ctx.alto(zB);
    const hipB = ctx.piso(zB) - Math.round(HB * 0.3);
    figura(ctx, { X: X + wf * 0.18, z: zB, look: { cara: 'espalda', ...b, sienta: 'busto' }, h: HB, poses: posesB || [['manos', 2], ['parado', 2.6], ['toma', 1.3]], dy: hipB - ctx.piso(zB) + 1, parpadea: false });
    const sx = ctx.px(X + wf * 0.18, zB);
    const top = hipB - Math.round(HB * 0.18);
    const bw = Math.max(7, Math.round(HB * 0.55)) | 1;
    const ch = ['.' + '-'.repeat(bw - 2) + '.'];
    for (let r = top + 1; r <= hipB; r++) ch.push('|' + (r === hipB ? '_' : ' ').repeat(bw - 2) + '|');
    for (let r = hipB + 1; r < ctx.piso(zB); r++) ch.push('|' + ' '.repeat(bw - 2) + '|');
    ctx.anim(zB - 0.004, (out) => {
      for (let i = 0; i < ch.length; i++) {
        const l = ch[i];
        for (let j = 0; j < l.length; j++) {
          const c = l[j];
          if (c === ' ' && i > hipB - top) continue;
          ctx.putZ(out, sx - (bw >> 1) + j, top + i, c, zB - 0.004);
        }
      }
    });
  }
  if (humea) ctx.anim(z - 0.001, (out, t) => vapor(out, Math.round((m.c0 + m.c1) / 2 - cosas.length / 2), m.r0 - 3, t + X, { n: 2, h: 3 }));
  void room;
  void cols;
  return m;
}

// Una fila de clientes: el primero pide en el mesón, se va con su bolsa y los
// demás avanzan; entra uno nuevo desde atrás de la cámara.
//   slots: [{X, z}] del primero (en el mesón) al último (más cerca)
export function cola(ctx, { slots, periodo = 9, dice = [], responde = [], vend = null, looks = null }) {
  const LOOKS = looks || [
    { ropa: 'abrigo', gorro: 'boina' },
    { ropa: 'vestido', pelo: 'largo' },
    { ropa: 'rayas', gorro: 'jockey' },
    { ropa: 'polera' },
    { ropa: 'camisa', cara: 'lentes' },
    { ropa: 'vestido', gorro: 'moño' },
    { ropa: 'abrigo', cara: 'bigote' },
  ];
  const n = slots.length;
  const salida = { X: ctx.cols * 1.1, z: 1.02 };
  const entrada = { X: -ctx.cols * 0.1, z: 1.02 };
  const lerp = (a, b, k) => ({ X: a.X + (b.X - a.X) * k, z: a.z + (b.z - a.z) * k });
  for (let i = 0; i <= n; i++) {
    // i: puesto en la fila al comienzo del ciclo (n = el que entra)
    ctx.anim(slots[Math.min(i, n - 1)].z - 0.001 * i, (out, t) => {
      const cyc = Math.floor(t / periodo);
      const u = (t % periodo) / periodo;
      const who = cyc + n - i; // identidad estable mientras avanza
      const look = LOOKS[(who * 5 + ctx.seed) % LOOKS.length];
      let p;
      let pose = 'parado';
      let cara = 'espalda';
      const mov = 0.72; // desde acá se mueven
      if (u < mov) {
        if (i === n) return;
        p = slots[i];
        if (i === 0 && u > mov * 0.6) pose = 'manos';
      } else {
        const k = (u - mov) / (1 - mov);
        if (i === 0) {
          p = lerp(slots[0], salida, k);
          cara = undefined;
          pose = Math.floor(t * 4) % 2 ? 'pasoA' : 'lleva';
        } else if (i === n) {
          p = lerp(entrada, slots[n - 1], k);
          pose = Math.floor(t * 4) % 2 ? 'pasoA' : 'pasoB';
        } else {
          p = lerp(slots[i], slots[i - 1], k);
          pose = Math.floor(t * 4) % 2 ? 'pasoA' : 'pasoB';
        }
      }
      const s = persona(ctx.alto(p.z), { ...look, cara: cara || look.cara, pose });
      const x = ctx.px(p.X, p.z) - s.cx;
      const y = ctx.piso(p.z) - s.h;
      ctx.blitZ(out, s, x, y, p.z);
      if (i === 0 && u > 0.08 && u < 0.32 && dice.length) bocadillo(out, x + s.cx + 2, y - 1, dice[cyc % dice.length], 1);
      if (i === 0 && u > 0.36 && u < 0.62 && responde.length && vend) {
        const vx = ctx.px(vend.X, vend.z);
        const vy = ctx.piso(vend.z) - ctx.alto(vend.z) - 1;
        bocadillo(out, vx + 3, vy, responde[cyc % responde.length], -1);
      }
    });
  }
}

// Repisas que llenan un rectángulo de la pared del fondo cada `paso` filas.
// Si las cosas de una repisa caen en el título, la repisa se corta en dos.
export function repisas(ctx, x0, x1, y0, y1, paso, items, opts = {}) {
  const ih = Math.max(...items.map((it) => it.length));
  const t = ctx.L.tit;
  const ys = [];
  for (let y = y1; y - ih >= y0; y -= paso) {
    ys.push(y);
    const hits = y >= t.y0 && y - ih <= t.y1;
    if (!hits) {
      repisa(ctx, x0, x1, y, items, opts);
      continue;
    }
    // la repisa se corta alrededor del título
    const a1 = Math.min(x1, t.x0 - 2);
    const b0 = Math.max(x0, t.x1 + 2);
    if (a1 - x0 > 3) repisa(ctx, x0, a1, y, items, opts);
    if (x1 - b0 > 3) repisa(ctx, b0, x1, y, items, opts);
  }
  return ys;
}

// Un círculo redondeado de radio r filas (2r columnas de radio), como filas de
// texto: ".---." arriba, "/ \" en las curvas, "( )" o "| |" a los lados.
export function circulo(r, p = 2.4) {
  const rx = 2 * r;
  const W = 2 * rx + 1;
  const hwAt = (dy) => rx * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(dy) / (r + 0.3), p)), 1 / p);
  const hws = [];
  for (let dy = -r; dy <= r; dy++) hws.push(Math.round(hwAt(dy)));
  const rows = [];
  for (let dy = -r; dy <= r; dy++) {
    const a = Array(W).fill(' ');
    const i = dy + r;
    const hw = hws[i];
    if (Math.abs(dy) === r) {
      a[rx - hw] = dy < 0 ? '.' : '`';
      a[rx + hw] = dy < 0 ? '.' : "'";
      for (let c = rx - hw + 1; c < rx + hw; c++) a[c] = '-';
    } else {
      const edge = hws[dy < 0 ? i - 1 : i + 1];
      if (hw - edge >= 2) {
        const m = Math.round((hw + edge) / 2);
        a[rx - m] = dy < 0 ? '/' : '\\';
        a[rx + m] = dy < 0 ? '\\' : '/';
      } else {
        const flat = hws[i - 1] === hw && hws[i + 1] === hw;
        a[rx - hw] = flat ? '|' : '(';
        a[rx + hw] = flat ? '|' : ')';
      }
    }
    rows.push(a.join(''));
  }
  return rows;
}

// Esfera de reloj redonda hecha con circulo(); las agujas van en agujas2().
export function esfera2(ctx, cx, cy, r, { numeros = true } = {}) {
  const rows = circulo(r);
  const x0 = cx - 2 * r;
  rows.forEach((l, i) => {
    const a = l.search(/\S/);
    const b = l.length - 1 - l.split('').reverse().join('').search(/\S/);
    for (let k = a; k <= b; k++) ctx.g.put(x0 + k, cy - r + i, l[k] === ' ' ? SP : l[k]);
  });
  if (numeros && r >= 3) {
    ctx.text(cx - 1, cy - r + 1, '12');
    ctx.g.put(cx + 2 * r - 2, cy, '3');
    ctx.g.put(cx, cy + r - 1, '6');
    ctx.g.put(cx - 2 * r + 2, cy, '9');
  } else if (numeros) {
    ctx.g.put(cx, cy - r + 1, '·');
    ctx.g.put(cx, cy + r - 1, '·');
  }
  ctx.g.put(cx, cy, 'o');
  return { cx, cy, r };
}

const DIRS = ['|', '/', '-', '\\', '|', '/', '-', '\\'];
export function agujas2(out, e, d = new Date(), segundero = true) {
  const { cx, cy, r } = e;
  const h = (d.getHours() % 12) + d.getMinutes() / 60;
  const m = d.getMinutes() + d.getSeconds() / 60;
  const s = d.getSeconds() + d.getMilliseconds() / 1000;
  const rxi = 2 * r - 1.6;
  const ryi = r - 0.55;
  const hand = (frac, fs) => {
    const th = frac * Math.PI * 2;
    const g = DIRS[Math.round(frac * 8) % 8];
    for (const f of fs) out.put(Math.round(cx + Math.sin(th) * rxi * f), Math.round(cy - Math.cos(th) * ryi * f), g);
  };
  hand(m / 60, r >= 3 ? [0.35, 0.65, 0.95] : [0.5, 1]);
  hand(h / 12, r >= 3 ? [0.35, 0.6] : [0.55]);
  if (segundero && r >= 3) {
    const th = (s / 60) * Math.PI * 2;
    out.put(Math.round(cx + Math.sin(th) * rxi), Math.round(cy - Math.cos(th) * ryi), '·');
  }
  out.put(cx, cy, 'o');
}
