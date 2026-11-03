// Grillas de caracteres: la pantalla, las tiras de cada capa y los sprites
// comparten la misma forma { w, h, data: Uint16Array }.
//
// En las tiras y los sprites el código 0 es transparente (deja ver lo de
// atrás); el espacio (32) es opaco y tapa. La pantalla se pinta con el
// algoritmo del pintor: de lo lejano a lo cercano, sin z-buffer.

export const T = 0; // transparente
export const SP = 32;
const US = 95; //  _  borde de abajo de la celda
const DASH = 45; // -  medio
const MAC = 175; // ¯  borde de arriba
const PIPE = 124; // |
const SL = 47; //   /
const BS = 92; //   \

export const cc = (ch) => (typeof ch === 'number' ? ch : ch.charCodeAt(0));

// Marcadores dentro de los dibujos:
//   ¤  transparente aunque esté dentro de la silueta
//   ¶  espacio opaco aunque esté fuera de la silueta
//   ª  acento grave (el ` no se puede escribir en un template literal)
const MARK_T = '¤'.charCodeAt(0);
const MARK_O = '¶'.charCodeAt(0);
const MARK_G = 'ª'.charCodeAt(0);

// Convierte un dibujo de texto en sprite.
//   mode 'solid'  entre el primer y el último glifo de cada fila los espacios
//                 son opacos; afuera, transparentes (la silueta tapa lo de atrás)
//   mode 'line'   todos los espacios son transparentes (cables, rejas, pájaros)
//   mode 'box'    todo el rectángulo es opaco
export function sprite(src, mode = 'solid') {
  let lines = src.split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  // sangría común (la del código fuente) fuera
  let indent = Infinity;
  for (const l of lines) if (l.trim()) indent = Math.min(indent, l.length - l.trimStart().length);
  if (!isFinite(indent)) indent = 0;
  lines = lines.map((l) => l.slice(indent).replace(/\s+$/, ''));
  const h = lines.length;
  const w = Math.max(1, ...lines.map((l) => l.length));
  const data = new Uint16Array(w * h);
  for (let y = 0; y < h; y++) {
    const l = lines[y];
    let a = 0;
    let b = l.length - 1;
    if (mode === 'solid') {
      while (a < l.length && l[a] === ' ') a++;
      while (b >= 0 && l[b] === ' ') b--;
    }
    for (let x = 0; x < w; x++) {
      let c = x < l.length ? l.charCodeAt(x) : SP;
      if (c === SP) {
        if (mode === 'box') c = SP;
        else if (mode === 'solid' && x >= a && x <= b) c = SP;
        else c = T;
      } else if (c === MARK_T) c = T;
      else if (c === MARK_O) c = SP;
      else if (c === MARK_G) c = 96;
      data[y * w + x] = c;
    }
  }
  return { w, h, data };
}

// Varios cuadros de animación separados por una línea con "--".
export function frames(src, mode = 'solid') {
  return src.split(/\n\s*--\s*\n/).map((s) => sprite(s, mode));
}

// Espejo horizontal (para que los autos y la gente vayan para el otro lado).
const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{', "'": '`', '`': "'", '┌': '┐', '┐': '┌', '◢': '◣', '◣': '◢' };
const MIRROR_C = new Map(Object.entries(MIRROR).map(([a, b]) => [a.charCodeAt(0), b.charCodeAt(0)]));
export function mirror(s) {
  const data = new Uint16Array(s.w * s.h);
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const c = s.data[y * s.w + (s.w - 1 - x)];
      data[y * s.w + x] = MIRROR_C.get(c) || c;
    }
  return { w: s.w, h: s.h, data };
}

export class Grid {
  constructor(w, h, fill = T) {
    this.w = w;
    this.h = h;
    this.data = new Uint16Array(w * h);
    if (fill) this.data.fill(fill);
  }

  put(x, y, ch) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = cc(ch);
  }

  get(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return T;
    return this.data[y * this.w + x];
  }

  // Texto horizontal: los espacios también escriben (opacos).
  text(x, y, s) {
    for (let i = 0; i < s.length; i++) this.put(x + i, y, s.charCodeAt(i));
  }

  // Texto donde los espacios no escriben.
  ink(x, y, s) {
    for (let i = 0; i < s.length; i++) if (s[i] !== ' ') this.put(x + i, y, s.charCodeAt(i));
  }

  rect(x, y, w, h, ch = SP) {
    const c = cc(ch);
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.floor(x) + w);
    const y1 = Math.min(this.h, Math.floor(y) + h);
    for (let r = y0; r < y1; r++) this.data.fill(c, r * this.w + x0, r * this.w + Math.max(x0, x1));
  }

  hline(x0, x1, y, ch) {
    for (let x = x0; x <= x1; x++) this.put(x, y, ch);
  }

  vline(x, y0, y1, ch = PIPE) {
    for (let y = y0; y <= y1; y++) this.put(x, y, ch);
  }

  // Copia otra grilla o sprite respetando la transparencia, con recorte.
  blit(s, x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    const sx0 = Math.max(0, -x);
    const sy0 = Math.max(0, -y);
    const sx1 = Math.min(s.w, this.w - x);
    const sy1 = Math.min(s.h, this.h - y);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    const src = s.data;
    const dst = this.data;
    const sw = s.w;
    const dw = this.w;
    for (let sy = sy0; sy < sy1; sy++) {
      let si = sy * sw + sx0;
      let di = (sy + y) * dw + sx0 + x;
      for (let sx = sx0; sx < sx1; sx++, si++, di++) {
        const c = src[si];
        if (c) dst[di] = c;
      }
    }
  }

  // Copia una ventana [sx, sx+w) x [sy, sy+h) de otra grilla en (x, y).
  blitWindow(s, sx, sy, w, h, x, y) {
    for (let r = 0; r < h; r++) {
      const ty = y + r;
      const syr = sy + r;
      if (ty < 0 || ty >= this.h || syr < 0 || syr >= s.h) continue;
      let c0 = 0;
      let c1 = w;
      if (x + c0 < 0) c0 = -x;
      if (x + c1 > this.w) c1 = this.w - x;
      if (sx + c0 < 0) c0 = -sx;
      if (sx + c1 > s.w) c1 = s.w - sx;
      const src = s.data;
      const dst = this.data;
      let si = syr * s.w + sx + c0;
      let di = ty * this.w + x + c0;
      for (let c = c0; c < c1; c++, si++, di++) {
        const v = src[si];
        if (v) dst[di] = v;
      }
    }
  }

  // Línea con glifo según la pendiente física (una fila mide dos columnas):
  //   casi horizontal  ¯ - _ según la altura dentro de la celda
  //   diagonal         / \ y "_/" "\_" cuando avanza más de una columna por fila
  //   casi vertical    |
  line(c0, r0, c1, r1, ch = 0) {
    const dx = c1 - c0;
    const dy = r1 - r0;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx < 1e-6 && ady < 1e-6) return;
    const forced = ch ? cc(ch) : 0;
    if (adx > ady * 2.6) {
      const lo = Math.min(c0, c1);
      const hi = Math.max(c0, c1);
      for (let c = Math.floor(lo); c <= Math.floor(hi); c++) {
        const xc = Math.min(Math.max(c + 0.5, lo), hi);
        const y = r0 + (dy * (xc - c0)) / dx;
        const row = Math.floor(y);
        const f = y - row;
        this.put(c, row, forced || (f < 0.34 ? MAC : f < 0.67 ? DASH : US));
      }
      return;
    }
    const lo = Math.min(r0, r1);
    const hi = Math.max(r0, r1);
    const steep = adx < ady * 0.34;
    const glyph = dx * dy < 0 ? SL : BS;
    for (let r = Math.floor(lo); r <= Math.floor(hi); r++) {
      const ya = Math.max(r, lo);
      const yb = Math.min(r + 1, hi);
      const xa = c0 + (dx * (ya - r0)) / dy;
      const xb = c0 + (dx * (yb - r0)) / dy;
      if (steep) {
        this.put((xa + xb) / 2, r, forced || PIPE);
        continue;
      }
      const xl = Math.min(xa, xb);
      const xr = Math.max(xa, xb);
      if (forced || xr - xl <= 1.4) this.put((xl + xr) / 2, r, forced || glyph);
      else if (glyph === SL) {
        const top = Math.floor(xr - 0.01);
        for (let c = Math.floor(xl); c < top; c++) this.put(c, r, US);
        this.put(top, r, SL);
      } else {
        const first = Math.floor(xl);
        this.put(first, r, BS);
        for (let c = first + 1; c <= Math.floor(xr - 0.01); c++) this.put(c, r, US);
      }
    }
  }
}

const PLAIN = new Map([...'ÁÉÍÓÚ'].map((ch, i) => [ch.charCodeAt(0), 'AEIOU'.charCodeAt(i)]));

// La pantalla: una grilla opaca que se vuelca al <pre>.
export class Screen extends Grid {
  constructor(pre) {
    super(1, 1, SP);
    this.pre = pre;
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
    const lh = parseFloat(getComputedStyle(this.pre).lineHeight);
    this.cellW = width || 9;
    this.cellH = lh || 18;
    this.w = this.cols = Math.ceil(window.innerWidth / this.cellW);
    this.h = this.rows = Math.ceil(window.innerHeight / this.cellH);
    this.data = new Uint16Array(this.w * this.h);
  }

  clear() {
    this.data.fill(SP);
  }

  flush() {
    const { w, h, data } = this;
    // con jgs7 (mobile) las mayúsculas con tilde quedan apretadas: van sin tilde
    if (this.cellH < 16) {
      for (let i = 0; i < data.length; i++) {
        const c = data[i];
        if (c > 192 && c < 219) {
          const k = PLAIN.get(c);
          if (k) data[i] = k;
        }
      }
    }
    const lines = new Array(h);
    for (let r = 0; r < h; r++) lines[r] = String.fromCharCode.apply(null, data.subarray(r * w, (r + 1) * w));
    this.pre.textContent = lines.join('\n');
  }
}

// Umbrales de dithering ordenado (Bayer 4x4) en [0, 1)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (c, r) => BAYER[((r & 3) << 2) | (c & 3)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
