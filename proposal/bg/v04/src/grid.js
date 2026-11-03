// Grillas de caracteres y el volcado al <pre>.
//
// Todo el dibujo es "algoritmo del pintor" sobre grillas de char codes:
//   - una Grid de capa usa 0 como transparente (deja ver lo de atrás) y 32
//     (espacio) como opaco, igual que los sprites de of.domains con ░.
//   - la pantalla es otra Grid que se limpia con espacios y se vuelca entera
//     a textContent en cada frame.
// Las capas estáticas (edificios, calle) se dibujan una vez en su Grid y en
// cada frame se copian corridas según la cámara (parallax). Lo animado se
// pinta encima, directo en la pantalla.

export const SP = 32;
export const code = (ch) => (typeof ch === 'number' ? ch : ch.charCodeAt(0));

export class Grid {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.ch = new Uint16Array(w * h);
    // etiqueta por celda: índice de luz (ventana, letrero) para reflejos y parpadeo
    this.tag = new Uint16Array(w * h);
  }

  inside(c, r) {
    return c >= 0 && r >= 0 && c < this.w && r < this.h;
  }

  // escribir una celda le saca la etiqueta de luz (lo último dibujado manda):
  // así un aire acondicionado o un letrero pintados sobre una ventana no
  // quedan tapados por la luz de la ventana
  put(c, r, ch, tag = 0) {
    c |= 0;
    r |= 0;
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return;
    const i = r * this.w + c;
    this.ch[i] = typeof ch === 'number' ? ch : ch.charCodeAt(0);
    if (this.tag) this.tag[i] = tag;
  }

  get(c, r) {
    c |= 0;
    r |= 0;
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return 0;
    return this.ch[r * this.w + c];
  }

  // texto horizontal; los espacios del texto son opacos
  text(c, r, str, tag = 0) {
    for (let i = 0; i < str.length; i++) this.put(c + i, r, str.charCodeAt(i), tag);
  }

  // texto donde el espacio es transparente
  ink(c, r, str, tag = 0) {
    for (let i = 0; i < str.length; i++) if (str[i] !== ' ') this.put(c + i, r, str.charCodeAt(i), tag);
  }

  fill(c, r, w, h, ch = SP, tag = 0) {
    const k = code(ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.put(c + x, r + y, k, tag);
  }

  hline(c0, c1, r, ch) {
    const k = code(ch);
    for (let c = c0; c <= c1; c++) this.put(c, r, k);
  }

  vline(c, r0, r1, ch = '|') {
    const k = code(ch);
    for (let r = r0; r <= r1; r++) this.put(c, r, k);
  }

  // diagonal oblicua: una columna por fila, de (c, r) hacia arriba a la derecha
  diag(c, r, n, ch = '/') {
    const k = code(ch);
    for (let i = 0; i < n; i++) this.put(c + i, r - i, k);
  }

  // sprite = { w, h, d: Uint16Array } con 0 transparente
  spr(s, c, r, tag = 0) {
    c |= 0;
    r |= 0;
    const { w, h, d } = s;
    for (let y = 0; y < h; y++) {
      const rr = r + y;
      if (rr < 0 || rr >= this.h) continue;
      for (let x = 0; x < w; x++) {
        const k = d[y * w + x];
        if (!k) continue;
        const cc = c + x;
        if (cc < 0 || cc >= this.w) continue;
        const i = rr * this.w + cc;
        this.ch[i] = k;
        if (this.tag) this.tag[i] = tag;
      }
    }
  }

  // copia otra grilla (capa) con su origen en (ox, oy); 0 = transparente
  blit(src, ox, oy) {
    ox |= 0;
    oy |= 0;
    const r0 = Math.max(0, oy);
    const r1 = Math.min(this.h, oy + src.h);
    const c0 = Math.max(0, ox);
    const c1 = Math.min(this.w, ox + src.w);
    if (r0 >= r1 || c0 >= c1) return;
    const dst = this.ch;
    const sc = src.ch;
    for (let r = r0; r < r1; r++) {
      let si = (r - oy) * src.w + (c0 - ox);
      let di = r * this.w + c0;
      for (let c = c0; c < c1; c++, si++, di++) {
        const k = sc[si];
        if (k) dst[di] = k;
      }
    }
  }
}

// Plantilla de texto -> sprite. ' ' es transparente y '¤' es un espacio opaco.
// solid: los espacios entre el primer y el último trazo de cada fila se
// vuelven opacos (la silueta tapa lo de atrás, como en of.domains).
export function spr(str, { solid = false } = {}) {
  let lines = str.split('\n');
  if (lines[0].trim() === '') lines = lines.slice(1);
  if (lines.length && lines[lines.length - 1].trim() === '') lines = lines.slice(0, -1);
  const w = Math.max(...lines.map((l) => l.length));
  const h = lines.length;
  const d = new Uint16Array(w * h);
  lines.forEach((l, y) => {
    let a = -1;
    let b = -1;
    for (let x = 0; x < l.length; x++) {
      if (l[x] !== ' ') {
        if (a < 0) a = x;
        b = x;
      }
    }
    for (let x = 0; x < l.length; x++) {
      const ch = l[x];
      if (ch === '¤') d[y * w + x] = SP;
      else if (ch !== ' ') d[y * w + x] = ch.charCodeAt(0);
      else if (solid && x > a && x < b) d[y * w + x] = SP;
    }
  });
  return { w, h, d };
}

const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '{': '}', '}': '{', "'": '`', '`': "'", d: 'b', b: 'd', p: 'q', q: 'p' };
const MIRROR_CODES = new Map(Object.entries(MIRROR).map(([a, b]) => [a.charCodeAt(0), b.charCodeAt(0)]));

// espejo horizontal (personas y autos que van para el otro lado)
export function flipX(s) {
  const d = new Uint16Array(s.w * s.h);
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const k = s.d[y * s.w + x];
      d[y * s.w + (s.w - 1 - x)] = MIRROR_CODES.get(k) ?? k;
    }
  // los textos (TAXI) se vuelven a leer de izquierda a derecha
  const word = (k) => (k >= 65 && k <= 90) || (k >= 48 && k <= 57);
  for (let y = 0; y < s.h; y++) {
    let x = 0;
    while (x < s.w) {
      if (!word(d[y * s.w + x])) {
        x++;
        continue;
      }
      let e = x;
      while (e < s.w && word(d[y * s.w + e])) e++;
      for (let a = x, b = e - 1; a < b; a++, b--) {
        const tmp = d[y * s.w + a];
        d[y * s.w + a] = d[y * s.w + b];
        d[y * s.w + b] = tmp;
      }
      x = e;
    }
  }
  return { w: s.w, h: s.h, d };
}

// La pantalla: mide la celda real de la fuente y vuelca la grilla al <pre>.
export class Screen extends Grid {
  constructor(pre) {
    super(1, 1);
    this.pre = pre;
    this.resize();
  }

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
    this.w = Math.ceil(window.innerWidth / this.cellW);
    this.h = Math.ceil(window.innerHeight / this.cellH);
    this.ch = new Uint16Array(this.w * this.h);
    this.tag = null; // la pantalla no guarda etiquetas
  }

  get cols() {
    return this.w;
  }

  get rows() {
    return this.h;
  }

  clear() {
    this.ch.fill(SP);
  }

  flush() {
    const { w, h, ch } = this;
    const lines = new Array(h);
    for (let r = 0; r < h; r++) lines[r] = String.fromCharCode.apply(null, ch.subarray(r * w, (r + 1) * w));
    this.pre.textContent = lines.join('\n');
  }
}

// Umbrales de dithering ordenado (Bayer 4x4) en [0, 1)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (c, r) => BAYER[((r & 3) << 2) | (c & 3)];

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
