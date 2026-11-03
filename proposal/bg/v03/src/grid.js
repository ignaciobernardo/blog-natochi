// Grilla de celdas de v03.
//
// Todo es una grilla de char codes (Uint16Array). Hay dos tipos de grilla:
//   Canvas  un lienzo fijo: una capa entera (la cordillera, la fachada de la
//           cuadra) o un sprite grande. Puede repetirse en mosaico horizontal
//           (wrap), así la capa no se acaba en pantallas anchas.
//   Screen  el cuadro que se vuelca al <pre>: recibe las capas de lejos a cerca
//           (algoritmo del pintor) con su desplazamiento 1/z.
//
// Transparencia como en of.domains: 0 no pinta nada (en las plantillas se
// escribe `░`); el espacio es opaco y tapa lo que queda detrás.

export const TR = 0;
export const SP = 32;
const SHADE = 0x2591; // ░

export const cc = (ch) => (typeof ch === 'number' ? ch : ch.charCodeAt(0));

// Sprite desde una plantilla de texto (usar String.raw para no escapar las \).
// - `´` se convierte en backtick (no se puede escribir dentro de un template)
// - `░` es transparente; el espacio es opaco
// - trim: los espacios al principio y al final de cada línea pasan a ser
//   transparentes, así el dibujo tapa solo su silueta
// - varios frames en un mismo texto se separan con una línea `~~`
export function sprite(src, { trim = true } = {}) {
  const frames = src
    .replace(/^\n/, '')
    .replace(/\n\s*$/, '')
    .split(/\n~~\n/);
  const rows = frames.map((f) => f.split('\n'));
  const w = Math.max(...rows.flat().map((l) => [...l].length));
  const h = Math.max(...rows.map((r) => r.length));
  const data = rows.map((lines) => {
    const d = new Uint16Array(w * h);
    lines.forEach((line, y) => {
      const chars = [...line];
      let a = 0;
      let b = chars.length;
      if (trim) {
        while (a < b && chars[a] === ' ') a++;
        while (b > a && chars[b - 1] === ' ') b--;
      }
      for (let x = a; x < b; x++) {
        let c = chars[x].codePointAt(0);
        if (c === SHADE) c = TR;
        else if (c === 0xb4) c = 96; // ´ -> `
        d[y * w + x] = c;
      }
    });
    return d;
  });
  return { w, h, data, n: data.length };
}

export class Canvas {
  constructor(w, h, wrap = false) {
    this.w = w;
    this.h = h;
    this.wrap = wrap;
    this.d = new Uint16Array(w * h);
  }

  i(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (y < 0 || y >= this.h) return -1;
    if (this.wrap) x = ((x % this.w) + this.w) % this.w;
    else if (x < 0 || x >= this.w) return -1;
    return y * this.w + x;
  }

  get(x, y) {
    const i = this.i(x, y);
    return i < 0 ? -1 : this.d[i];
  }

  put(x, y, ch) {
    const i = this.i(x, y);
    if (i >= 0) this.d[i] = cc(ch);
  }

  // escribe solo si la celda ya tiene algo (no se sale de la silueta)
  over(x, y, ch) {
    const i = this.i(x, y);
    if (i >= 0 && this.d[i]) this.d[i] = cc(ch);
  }

  // escribe solo si la celda es un espacio (no pisa trazos)
  soft(x, y, ch) {
    const i = this.i(x, y);
    if (i >= 0 && this.d[i] === SP) this.d[i] = cc(ch);
  }

  // texto: `░` no pinta, el espacio sí
  text(x, y, str) {
    let k = 0;
    for (const ch of str) {
      const c = ch.codePointAt(0);
      if (c !== SHADE) this.put(x + k, y, c === 0xb4 ? 96 : c);
      k++;
    }
  }

  fill(x, y, w, h, ch = SP) {
    const c = cc(ch);
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) this.put(x + k, y + j, c);
  }

  hline(x0, x1, y, ch) {
    for (let x = x0; x <= x1; x++) this.put(x, y, ch);
  }

  vline(x, y0, y1, ch) {
    for (let y = y0; y <= y1; y++) this.put(x, y, ch);
  }

  // estampa un sprite (frame f); los 0 no pintan
  stamp(s, x, y, f = 0) {
    const d = s.data[((f % s.n) + s.n) % s.n];
    x = Math.floor(x);
    y = Math.floor(y);
    for (let j = 0; j < s.h; j++) {
      for (let k = 0; k < s.w; k++) {
        const c = d[j * s.w + k];
        if (c) this.put(x + k, y + j, c);
      }
    }
  }

  // Línea entre centros de celda con el glifo según la pendiente. En Jgs una
  // fila mide dos columnas: `/` avanza una columna por fila (~63°).
  //   pendiente suave   .-' y `-.  (ticks que se tocan), ¯ - _ si es plana
  //   media             _/ y \_
  //   empinada          / \ y | si es casi vertical
  line(x0, y0, x1, y1, ch = 0) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return this.put(x0, y0, ch || '.');
    const forced = ch ? cc(ch) : 0;
    if (Math.abs(dx) > Math.abs(dy) * 2.2) {
      const lo = Math.min(x0, x1);
      const hi = Math.max(x0, x1);
      const rising = dx * dy < 0;
      const flat = Math.abs(dy) < 0.5;
      for (let x = Math.round(lo); x <= Math.round(hi); x++) {
        const y = y0 + (dy * (x - x0)) / dx;
        const row = Math.floor(y + 0.5);
        const f = y + 0.5 - row;
        let g;
        if (forced) g = forced;
        else if (flat) g = f < 0.34 ? 175 : f < 0.67 ? 45 : 95;
        else if (f < 0.3) g = rising ? 39 : 96;
        else if (f < 0.62) g = 45;
        else g = rising ? 46 : 46;
        this.put(x, row, g);
      }
      return;
    }
    const lo = Math.min(y0, y1);
    const hi = Math.max(y0, y1);
    const glyph = dx * dy < 0 ? 47 : 92;
    const steep = Math.abs(dx) < Math.abs(dy) * 0.4;
    for (let y = Math.round(lo); y <= Math.round(hi); y++) {
      const ya = Math.max(y - 0.5, lo);
      const yb = Math.min(y + 0.5, hi);
      const xa = x0 + (dx * (ya - y0)) / dy;
      const xb = x0 + (dx * (yb - y0)) / dy;
      if (forced || steep) {
        this.put(Math.round((xa + xb) / 2), y, forced || 124);
        continue;
      }
      const xl = Math.min(xa, xb);
      const xr = Math.max(xa, xb);
      if (xr - xl <= 1.3) this.put(Math.round((xl + xr) / 2), y, glyph);
      else if (glyph === 47) {
        const top = Math.round(xr);
        for (let x = Math.round(xl); x < top; x++) this.put(x, y, 95);
        this.put(top, y, 47);
      } else {
        const first = Math.round(xl);
        this.put(first, y, 92);
        for (let x = first + 1; x <= Math.round(xr); x++) this.put(x, y, 95);
      }
    }
  }
}

// El cuadro de pantalla.
export class Screen extends Canvas {
  constructor(pre) {
    super(1, 1);
    this.pre = pre;
    this.cellW = 9;
    this.cellH = 18;
    this.resize();
  }

  // mide la celda real de la fuente y dimensiona la grilla al viewport
  resize() {
    const probe = document.createElement('span');
    probe.textContent = 'M'.repeat(200);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    this.pre.textContent = '';
    this.pre.appendChild(probe);
    const width = probe.getBoundingClientRect().width / 200;
    probe.remove();
    const lh = parseFloat(getComputedStyle(this.pre).lineHeight);
    this.cellW = width || 9;
    this.cellH = lh || 18;
    this.w = this.cols = Math.ceil(window.innerWidth / this.cellW);
    this.h = this.rows = Math.ceil(window.innerHeight / this.cellH);
    this.d = new Uint16Array(this.w * this.h);
  }

  clear(ch = SP) {
    this.d.fill(cc(ch));
  }

  // Vuelca un lienzo con su esquina en (ox, oy). Si el lienzo es wrap se
  // repite en horizontal y cubre todo el ancho.
  blit(cv, ox, oy) {
    ox = Math.floor(ox);
    oy = Math.floor(oy);
    const { w, h, d } = cv;
    const r0 = Math.max(0, oy);
    const r1 = Math.min(this.h, oy + h);
    const W = this.w;
    for (let r = r0; r < r1; r++) {
      const src = (r - oy) * w;
      const dst = r * W;
      if (cv.wrap) {
        let sx = (((0 - ox) % w) + w) % w;
        for (let c = 0; c < W; c++) {
          const v = d[src + sx];
          if (v) this.d[dst + c] = v;
          if (++sx === w) sx = 0;
        }
      } else {
        const c0 = Math.max(0, ox);
        const c1 = Math.min(W, ox + w);
        for (let c = c0; c < c1; c++) {
          const v = d[src + c - ox];
          if (v) this.d[dst + c] = v;
        }
      }
    }
  }

  // Estampa un sprite que vive en una capa repetida de ancho `period`:
  // aparece en cada repetición que cae en pantalla.
  stampWrap(s, x, y, period, f = 0) {
    x = Math.floor(x);
    let k = x - Math.ceil((x + s.w) / period) * period;
    for (; k < this.w; k += period) if (k + s.w > 0) this.stamp(s, k, y, f);
  }

  // put en cada repetición de una capa de ancho `period`
  putWrap(x, y, ch, period) {
    x = Math.floor(x);
    for (let k = ((x % period) + period) % period; k < this.w; k += period) this.put(k, y, ch);
  }

  textWrap(x, y, str, period) {
    x = Math.floor(x);
    let k = x - Math.ceil((x + str.length) / period) * period;
    for (; k < this.w; k += period) if (k + str.length > 0) this.text(k, y, str);
  }

  flush() {
    const { cols, rows, d } = this;
    const lines = new Array(rows);
    for (let r = 0; r < rows; r++) lines[r] = String.fromCharCode.apply(null, d.subarray(r * cols, (r + 1) * cols));
    this.pre.textContent = lines.join('\n');
  }
}

// Umbrales de dithering ordenado (Bayer 4x4) en [0, 1)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (c, r) => BAYER[((r & 3) << 2) | (c & 3)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
