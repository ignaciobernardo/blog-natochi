// Grillas de caracteres con z-buffer.
//
// Layer: la capa estática (piso, edificios, árboles…) del viaje completo,
// rasterizada una vez en celdas del mundo. Renderer: el cuadro de cada frame;
// copia la ventana visible de la capa y encima dibuja lo que se mueve.
// Las dos tienen put(c, r, code, d) en celdas del mundo: gana el d menor.

export const SPACE = 32;

export class Layer {
  constructor(c0, r0, w, h) {
    this.c0 = c0;
    this.r0 = r0;
    this.w = w;
    this.h = h;
    this.chars = new Uint16Array(w * h).fill(SPACE);
    this.depth = new Float32Array(w * h).fill(Infinity);
  }

  put(c, r, ch, d) {
    c -= this.c0;
    r -= this.r0;
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return;
    const i = r * this.w + c;
    if (d < this.depth[i]) {
      this.depth[i] = d;
      this.chars[i] = ch;
    }
  }

  get(c, r) {
    c -= this.c0;
    r -= this.r0;
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return SPACE;
    return this.chars[r * this.w + c];
  }
}

export class Renderer {
  constructor(pre) {
    this.pre = pre;
    this.cols = 0;
    this.rows = 0;
    this.cellW = 9;
    this.cellH = 18;
    this.oc = 0; // celda del mundo en la esquina de arriba a la izquierda
    this.or = 0;
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
    this.depth = new Float32Array(this.cols * this.rows);
  }

  // Copia la ventana de la capa estática que empieza en la celda (oc, or).
  blit(layer, oc, or) {
    this.oc = oc;
    this.or = or;
    const { cols, rows, chars, depth } = this;
    chars.fill(SPACE);
    depth.fill(Infinity);
    for (let r = 0; r < rows; r++) {
      const lr = r + or - layer.r0;
      if (lr < 0 || lr >= layer.h) continue;
      let a = oc - layer.c0;
      let b = a + cols;
      let off = 0;
      if (a < 0) {
        off = -a;
        a = 0;
      }
      if (b > layer.w) b = layer.w;
      if (b <= a) continue;
      const src = lr * layer.w;
      chars.set(layer.chars.subarray(src + a, src + b), r * cols + off);
      depth.set(layer.depth.subarray(src + a, src + b), r * cols + off);
    }
  }

  // celdas del mundo
  put(c, r, ch, d) {
    c -= this.oc;
    r -= this.or;
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const i = r * this.cols + c;
    if (d < this.depth[i]) {
      this.depth[i] = d;
      this.chars[i] = ch;
    }
  }

  // solo si la celda está en blanco (luz de los faroles sobre el piso)
  putBlank(c, r, ch, d) {
    c -= this.oc;
    r -= this.or;
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const i = r * this.cols + c;
    if (this.chars[i] === SPACE && d < this.depth[i]) {
      this.depth[i] = d;
      this.chars[i] = ch;
    }
  }

  // celdas de pantalla (título, pista, disolución)
  putS(c, r, ch, d) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const i = r * this.cols + c;
    if (d < this.depth[i]) {
      this.depth[i] = d;
      this.chars[i] = ch;
    }
  }

  textS(c, r, str, d) {
    for (let i = 0; i < str.length; i++) this.putS(c + i, r, str.charCodeAt(i), d);
  }

  flush() {
    const { cols, rows, chars } = this;
    const lines = new Array(rows);
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
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
export const lerp = (a, b, t) => a + (b - a) * t;
