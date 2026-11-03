// Grilla de caracteres con el algoritmo del pintor.
//
// Todo se dibuja de atrás para adelante sobre un Uint16Array de char codes y al
// final se vuelca a <pre>.textContent. No hay z-buffer: el orden de las llamadas
// es la profundidad. En los sprites el 0 es transparente; el espacio (32) es
// opaco y tapa lo de atrás, como en of.domains.

export const SP = 32;
export const ch = (c) => (typeof c === 'number' ? c : c.charCodeAt(0));

export class Grid {
  constructor(pre) {
    this.pre = pre;
    this.cols = 0;
    this.rows = 0;
    this.cellW = 9;
    this.cellH = 18;
    this.resize();
  }

  // Mide la celda real de la fuente y dimensiona la grilla para cubrir el viewport.
  resize() {
    const probe = document.createElement('span');
    probe.textContent = 'M'.repeat(200);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    this.pre.textContent = '';
    this.pre.appendChild(probe);
    const width = probe.getBoundingClientRect().width / 200;
    probe.remove();
    const lineHeight = parseFloat(getComputedStyle(this.pre).lineHeight);
    this.cellW = width || 9;
    this.cellH = lineHeight || 18;
    this.cols = Math.ceil(window.innerWidth / this.cellW);
    this.rows = Math.ceil(window.innerHeight / this.cellH);
    this.chars = new Uint16Array(this.cols * this.rows);
    this.lines = new Array(this.rows);
  }

  clear(c = SP) {
    this.chars.fill(c);
  }

  put(x, y, c) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.chars[y * this.cols + x] = c;
  }

  get(x, y) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return 0;
    return this.chars[y * this.cols + x];
  }

  // Texto horizontal: los espacios también escriben (son opacos).
  text(x, y, str) {
    if (y < 0 || y >= this.rows) return;
    for (let i = 0; i < str.length; i++) this.put(x + i, y, str.charCodeAt(i));
  }

  fill(x, y, w, h, c = SP) {
    const x0 = Math.max(0, x);
    const x1 = Math.min(this.cols, x + w);
    const y0 = Math.max(0, y);
    const y1 = Math.min(this.rows, y + h);
    for (let r = y0; r < y1; r++) this.chars.fill(c, r * this.cols + x0, r * this.cols + x1);
  }

  hline(x0, x1, y, c) {
    if (y < 0 || y >= this.rows) return;
    const a = Math.max(0, x0);
    const b = Math.min(this.cols - 1, x1);
    if (b >= a) this.chars.fill(c, y * this.cols + a, y * this.cols + b + 1);
  }

  vline(x, y0, y1, c) {
    if (x < 0 || x >= this.cols) return;
    const a = Math.max(0, y0);
    const b = Math.min(this.rows - 1, y1);
    for (let r = a; r <= b; r++) this.chars[r * this.cols + x] = c;
  }

  // Rectángulo con textura: fn(wx, wy) -> char code (0 = no tocar). `ox, oy`
  // pasan de pantalla a coordenadas de mundo, así la textura queda anclada.
  pattern(x, y, w, h, fn, ox = 0, oy = 0) {
    const x0 = Math.max(0, x);
    const x1 = Math.min(this.cols, x + w);
    const y0 = Math.max(0, y);
    const y1 = Math.min(this.rows, y + h);
    for (let r = y0; r < y1; r++) {
      const base = r * this.cols;
      for (let c = x0; c < x1; c++) {
        const v = fn(c + ox, r + oy);
        if (v) this.chars[base + c] = v;
      }
    }
  }

  // Sprite { w, h, data } con 0 transparente.
  blit(s, x, y) {
    if (!s) return;
    if (x >= this.cols || y >= this.rows || x + s.w <= 0 || y + s.h <= 0) return;
    const { cols, rows, chars } = this;
    const { w, h, data } = s;
    const r0 = Math.max(0, -y);
    const r1 = Math.min(h, rows - y);
    const c0 = Math.max(0, -x);
    const c1 = Math.min(w, cols - x);
    for (let r = r0; r < r1; r++) {
      const src = r * w;
      const dst = (y + r) * cols + x;
      for (let c = c0; c < c1; c++) {
        const v = data[src + c];
        if (v) chars[dst + c] = v;
      }
    }
  }

  // Igual que blit pero solo escribe donde la celda de destino es un espacio:
  // sirve para "pintar debajo" (texturas que no deben tapar el dibujo).
  under(s, x, y) {
    if (!s) return;
    const { cols, rows, chars } = this;
    for (let r = 0; r < s.h; r++) {
      const yy = y + r;
      if (yy < 0 || yy >= rows) continue;
      for (let c = 0; c < s.w; c++) {
        const xx = x + c;
        const v = s.data[r * s.w + c];
        if (!v || xx < 0 || xx >= cols) continue;
        const i = yy * cols + xx;
        if (chars[i] === SP) chars[i] = v;
      }
    }
  }

  flush() {
    const { cols, rows, chars, lines } = this;
    for (let r = 0; r < rows; r++) {
      lines[r] = String.fromCharCode.apply(null, chars.subarray(r * cols, (r + 1) * cols));
    }
    this.pre.textContent = lines.join('\n');
  }
}

// Umbrales de dithering ordenado (Bayer 4x4) en [0, 1)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (c, r) => BAYER[((r & 3) << 2) | (c & 3)];

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
