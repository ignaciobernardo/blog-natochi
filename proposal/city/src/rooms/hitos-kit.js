// Herramientas compartidas por los hitos (cine, parroquia, mercado y obra):
// capas por profundidad para tapar lo que se mueve, arcos con glifos según la
// pendiente, rellenos de polígonos, recortes y textos.
import { Grid, SP, T, cc, sprite, frames, mirror, hash2 } from './util.js';

export const R = String.raw;
export { Grid, SP, T, cc, sprite, frames, mirror, hash2 };

const PIPE = 124; // |

// --- capas ------------------------------------------------------------------
// Lo estático se dibuja en capas transparentes, cada una con su profundidad.
// `bake()` las vuelca en la base de la más lejana a la más cercana. En cada
// cuadro, lo que se mueve se dibuja encima y `cover()` vuelve a pintar, sólo
// en su rectángulo, lo estático que está más adelante.
export class Capas {
  constructor(room) {
    this.room = room;
    this.list = [];
  }

  at(z) {
    const g = new Grid(this.room.cols, this.room.rows, T);
    g.z = z;
    this.list.push(g);
    return g;
  }

  bake() {
    this.list.sort((a, b) => b.z - a.z);
    for (const g of this.list) this.room.g.blit(g, 0, 0);
  }

  cover(out, z, x0, y0, x1, y1) {
    x0 = Math.max(0, Math.floor(x0));
    y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(out.w - 1, Math.ceil(x1));
    y1 = Math.min(out.h - 1, Math.ceil(y1));
    if (x1 < x0 || y1 < y0) return;
    const o = out.data;
    const w = out.w;
    for (const g of this.list) {
      if (g.z >= z) continue;
      const d = g.data;
      for (let r = y0; r <= y1; r++) {
        let i = r * w + x0;
        for (let c = x0; c <= x1; c++, i++) {
          const v = d[i];
          if (v) o[i] = v;
        }
      }
    }
  }

  // un sprite a profundidad z: se dibuja y se tapa con lo que está delante
  blit(out, s, x, y, z) {
    x = Math.round(x);
    y = Math.round(y);
    out.blit(s, x, y);
    this.cover(out, z, x, y, x + s.w - 1, y + s.h - 1);
  }

  // texto a profundidad z
  text(out, x, y, s, z) {
    x = Math.round(x);
    y = Math.round(y);
    out.text(x, y, s);
    this.cover(out, z, x, y, x + s.length - 1, y);
  }
}

// --- recorte ----------------------------------------------------------------
// Un lienzo con origen propio que sólo escribe dentro de su rectángulo
// (la pantalla del cine, un vitral). Sirve para `line` y `arc` también.
export class Clip {
  constructor(g, x0, y0, x1, y1) {
    this.g = g;
    this.x0 = x0;
    this.y0 = y0;
    this.w = x1 - x0 + 1;
    this.h = y1 - y0 + 1;
  }

  put(x, y, ch) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.g.put(this.x0 + x, this.y0 + y, ch);
  }

  get(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T;
    return this.g.get(this.x0 + x, this.y0 + y);
  }

  text(x, y, s) {
    for (let i = 0; i < s.length; i++) this.put(x + i, y, s.charCodeAt(i));
  }

  ink(x, y, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.put(x + i, y, s.charCodeAt(i));
  }

  fill(ch = SP) {
    for (let r = 0; r < this.h; r++) for (let c = 0; c < this.w; c++) this.g.put(this.x0 + c, this.y0 + r, ch);
  }

  hline(x0, x1, y, ch) {
    for (let x = x0; x <= x1; x++) this.put(x, y, ch);
  }

  vline(x, y0, y1, ch = PIPE) {
    for (let y = y0; y <= y1; y++) this.put(x, y, ch);
  }

  blit(s, x, y) {
    x = Math.round(x);
    y = Math.round(y);
    for (let sy = 0; sy < s.h; sy++) {
      const ty = y + sy;
      if (ty < 0 || ty >= this.h) continue;
      for (let sx = 0; sx < s.w; sx++) {
        const tx = x + sx;
        if (tx < 0 || tx >= this.w) continue;
        const v = s.data[sy * s.w + sx];
        if (v) this.g.put(this.x0 + tx, this.y0 + ty, v);
      }
    }
  }

  line(c0, r0, c1, r1, ch = 0) {
    Grid.prototype.line.call(this, c0, r0, c1, r1, ch);
  }
}

// --- trazos -----------------------------------------------------------------

// Curva por puntos densos: se corta en un tramo por fila y cada tramo se
// traza con `line`, así cada fila lleva un solo trazo y las pendientes suaves
// salen con "_/" como en el resto del dibujo.
//   opt.round  usa ( ) en los tramos casi verticales (según opt.cx)
//   opt.ch     glifo fijo
export function curve(g, pts, opt = {}) {
  if (pts.length < 2) return;
  const cx = opt.cx === undefined ? (pts[0][0] + pts[pts.length - 1][0]) / 2 : opt.cx;
  const seg = (p, q) => {
    const steep = Math.abs(q[0] - p[0]) < 0.75;
    const ch = opt.ch || (opt.round && steep ? ((p[0] + q[0]) / 2 < cx ? '(' : ')') : 0);
    if (Math.abs(q[0] - p[0]) < 1e-6 && Math.abs(q[1] - p[1]) < 1e-6) {
      g.put(p[0], p[1], ch || '|');
      return;
    }
    g.line(p[0], p[1], q[0], q[1], ch);
  };
  let start = pts[0];
  let prev = start;
  for (let i = 1; i < pts.length; i++) {
    const cur = pts[i];
    const r0 = Math.floor(prev[1]);
    const r1 = Math.floor(cur[1]);
    if (r1 !== r0) {
      const step = r1 > r0 ? 1 : -1;
      for (let r = r0; r !== r1; r += step) {
        const edge = step > 0 ? r + 1 : r;
        const u = (edge - prev[1]) / (cur[1] - prev[1]);
        const x = prev[0] + (cur[0] - prev[0]) * u;
        seg(start, [x, edge - step * 1e-3]);
        start = [x, edge + step * 1e-3];
      }
    }
    prev = cur;
  }
  seg(start, prev);
}

// Arco de elipse de centro (cx, cy) y radios rx (columnas) y ry (filas), de
// a0 a a1 en radianes (0 a la derecha, π/2 arriba).
export function arc(g, cx, cy, rx, ry, a0, a1, opt = {}) {
  const n = Math.max(16, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry * 2) * 4));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + rx * Math.cos(a), cy - ry * Math.sin(a)]);
  }
  curve(g, pts, { ...opt, cx });
}

// Línea punteada: un glifo cada `step` celdas a lo largo del trazo.
export function dotted(g, x0, y0, x1, y1, ch = '.', step = 2, phase = 0) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0) * 2)));
  for (let i = phase % step; i <= n; i += step) {
    const u = i / n;
    g.put(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, ch);
  }
}

// Polilínea con `line`.
export function poly(g, pts, closed = false) {
  for (let i = 0; i + 1 < pts.length; i++) g.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  if (closed) g.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
}

// Rellena un polígono (celdas cuyo centro cae adentro). `ch` puede ser una
// función (c, r) → glifo | 0.
export function fillPoly(g, pts, ch = SP) {
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    if (p[1] < y0) y0 = p[1];
    if (p[1] > y1) y1 = p[1];
  }
  const fn = typeof ch === 'function' ? ch : null;
  const code = fn ? 0 : cc(ch);
  const H = g.h;
  for (let r = Math.max(0, Math.floor(y0)); r <= Math.min(H - 1, Math.ceil(y1)); r++) {
    const yc = r + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + ((yc - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let c = Math.ceil(xs[k] - 0.5); c <= Math.floor(xs[k + 1] - 0.5); c++) {
        if (fn) {
          const v = fn(c, r);
          if (v) g.put(c, r, v);
        } else g.put(c, r, code);
      }
    }
  }
}

// Rectángulo opaco con marco: tapa de "_" arriba, "|" a los lados y "_" abajo.
export function frame(g, x0, y0, x1, y1, fill = SP) {
  for (let r = y0 + 1; r <= y1; r++) for (let c = x0 + 1; c < x1; c++) if (fill) g.put(c, r, fill);
  g.hline(x0 + 1, x1 - 1, y0, '_');
  g.hline(x0 + 1, x1 - 1, y1, '_');
  g.vline(x0, y0 + 1, y1, '|');
  g.vline(x1, y0 + 1, y1, '|');
}

// Texto centrado en cx.
export function ctext(g, cx, y, s) {
  const x = Math.round(cx - s.length / 2);
  g.text(x, y, s);
  return x;
}

// Burbuja de diálogo chica: el texto con un espacio opaco a cada lado y una
// colita hacia (tx). Devuelve el rectángulo.
export function bubble(g, x, y, s, tail = 0) {
  const t = ` ${s} `;
  g.text(Math.round(x), Math.round(y), t);
  if (tail) g.put(Math.round(x) + (tail > 0 ? 1 : t.length - 2), Math.round(y) + 1, tail > 0 ? '/' : '\\');
  return { x0: Math.round(x), y0: Math.round(y), x1: Math.round(x) + t.length - 1, y1: Math.round(y) + (tail ? 1 : 0) };
}

// Texturas de puntos ancladas a la celda (como en la referencia).
export function dots(g, x0, y0, x1, y1, fn) {
  for (let r = Math.max(0, Math.ceil(y0)); r <= Math.min(g.h - 1, Math.floor(y1)); r++) {
    for (let c = Math.max(0, Math.ceil(x0)); c <= Math.min(g.w - 1, Math.floor(x1)); c++) {
      const v = fn(c, r);
      if (v) g.put(c, r, v);
    }
  }
}

// Sólo escribe donde hay espacio vacío (no pisa el dibujo).
export function putEmpty(g, x, y, ch) {
  const v = g.get(x, y);
  if (v === SP || v === T) g.put(x, y, ch);
}

// Ciclo con fases: devuelve la fase en que cae t dentro de una lista de
// duraciones [{ id, d }] y el avance u dentro de ella.
export function timeline(list, t) {
  const total = list.reduce((s, p) => s + p.d, 0);
  let k = ((t % total) + total) % total;
  for (const p of list) {
    if (k < p.d) return { id: p.id, u: k / p.d, lt: k, d: p.d, total };
    k -= p.d;
  }
  const p = list[list.length - 1];
  return { id: p.id, u: 1, lt: p.d, d: p.d, total };
}

export const lerp = (a, b, u) => a + (b - a) * u;
export const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// Llama de vela: cambia con el tiempo y la semilla.
const FLAMES = ["'", '°', "'", '*', '`', '°', "'"];
export function flame(t, seed) {
  return FLAMES[Math.floor(hash2(Math.floor(t * 7 + seed * 13), seed) * FLAMES.length)];
}
