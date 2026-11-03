// La escena: compone las capas de la ciudad según el scroll, suma lo que se
// mueve en el tiempo y vuelca la grilla al <pre>.
//
// La cámara es una grúa que baja por el eje H del mundo. Cada capa baja a su
// ritmo (parallax): hc = f · (S − s) es la altura de la cámara en esa capa, y la
// celda de capa (c, r) cae en pantalla en (c + X0 − hc, r + Y0 + hc).
import { buildCity, ST } from './city.js';
import { FX_WINDOW, FX_BLINK, FX_NIGHT, FX_TWINKLE } from './grid.js';
import { Actors } from './actors.js';
import { hash2 } from './rng.js';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (c, r) => BAYER[((r & 3) << 2) | (c & 3)];
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const ARRIVE = 0.88;

// glifos de ventana prendida (de noche, tinta clara sobre fondo oscuro)
const LIT = ['▒'.charCodeAt(0), '░'.charCodeAt(0), ':'.charCodeAt(0)];
const GLOW = '░'.charCodeAt(0);

export class Scene {
  constructor(pre, { title = 'NATOCHI', seed = 7, dark = false } = {}) {
    this.pre = pre;
    this.title = title;
    this.seed = seed;
    this.dark = dark;
    this.t = 0;
    this.p = null;
    this.S = 240; // recorrido de la grúa, en unidades de H de la capa main
    this.rd = this; // compatibilidad con tools/perf.cjs (rd.cols, rd.rows)
    this.show = { sky: true, far: true, back: true, main: true, near: true, actors: true, title: true };
    this.resize();
  }

  // mide la celda real de la fuente y arma la ciudad para esta grilla
  resize() {
    const probe = document.createElement('span');
    probe.textContent = 'M'.repeat(200);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    this.pre.textContent = '';
    this.pre.appendChild(probe);
    const w = probe.getBoundingClientRect().width / 200;
    probe.remove();
    const lh = parseFloat(getComputedStyle(this.pre).lineHeight);
    this.cellW = w || 9;
    this.cellH = lh || 18;
    this.cols = Math.ceil(window.innerWidth / this.cellW);
    this.rows = Math.ceil(window.innerHeight / this.cellH);
    this.chars = new Uint16Array(this.cols * this.rows);
    this.depth = new Float32Array(this.cols * this.rows);
    this.build();
  }

  setDark(dark) {
    if (dark === this.dark) return;
    this.dark = dark;
    this.build();
  }

  build() {
    const { cols, rows } = this;
    this.X0 = Math.floor(cols / 2);
    this.Y0 = Math.round(rows / 2) - 15;
    this.env = { cols, rows, X0: this.X0, Y0: this.Y0, S: this.S, seed: this.seed, dark: this.dark };
    this.city = buildCity(this.env);
    this.layers = this.city.layers;
    this.actors = new Actors(this.city, this.env, this.seed);
  }

  // input: { progress (0..1), dt, contentTop (px o null), reduced }
  frame(input) {
    // el primer rAF puede llegar con una marca anterior a la de arranque: dt ≥ 0
    const dt = clamp(input.dt || 0, 0, 0.1);
    if (!input.reduced) this.t += dt;
    const target = clamp(input.progress, 0, 1);
    if (this.p == null) this.p = target;
    this.p += (target - this.p) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - this.p) < 1e-4) this.p = target;
    // la grúa llega al suelo un poco antes del final del scroll y se queda ahí
    // mientras sube el contenido: así el cuadro final se ve entero
    const s = Math.min(1, this.p / ARRIVE) * this.S;
    for (const L of this.layers) {
      L.hc = Math.round(L.f * (this.S - s));
      L.vc = L.hc - this.X0; // pantalla = capa − v
      L.vr = -this.Y0 - L.hc;
    }
    this.compose();
    if (this.show.actors) {
      if (!input.reduced) this.actors.update(dt, this.t);
      this.actors.draw(this, this.t);
    }
    if (this.show.title) this.drawTitle();
    if (input.progress < 0.03) this.drawHint(1 - input.progress / 0.03);
    if (input.contentTop != null) this.drawDissolve(input.contentTop / this.cellH);
    this.flush();
  }

  // compone las capas de atrás hacia adelante; 0 es transparente
  compose() {
    const { cols, rows, chars, depth, t, dark } = this;
    chars.fill(32);
    depth.fill(Infinity);
    for (const L of this.layers) {
      if (!this.show[L.name]) continue;
      const lc0 = L.vc - L.c0;
      const lr0 = L.vr - L.r0;
      const lw = L.w;
      const lch = L.chars;
      const ldp = L.depth;
      const lfx = L.fx;
      const cA = Math.max(0, -lc0);
      const cB = Math.min(cols, lw - lc0);
      for (let r = 0; r < rows; r++) {
        const lr = r + lr0;
        if (lr < 0 || lr >= L.h) continue;
        const base = lr * lw + lc0;
        const o = r * cols;
        for (let c = cA; c < cB; c++) {
          const j = base + c;
          let ch = lch[j];
          if (!ch) continue;
          const fx = lfx[j];
          if (fx) ch = this.fx(L, fx - 1, ch, t, dark);
          if (!ch) continue;
          chars[o + c] = ch;
          depth[o + c] = ldp[j];
        }
      }
    }
  }

  // efectos por celda en el tiempo
  fx(L, id, ch, t, dark) {
    switch (L.fxKind[id]) {
      case FX_WINDOW: {
        if (!dark || ch !== 32) return ch;
        const T = L.fxT[id];
        const k = Math.floor(t / T + L.fxP[id]);
        const v = hash2(id * 3 + L.zBase, k);
        if (v < 0.4) return LIT[(id + L.zBase) % 3 === 0 ? 1 : 0];
        if (v < 0.47) return LIT[2];
        return ch;
      }
      case FX_BLINK: {
        const on = ((t + L.fxP[id]) / L.fxT[id]) % 2 < 1;
        return on ? L.fxA[id] || ch : L.fxB[id];
      }
      case FX_NIGHT:
        if (!dark) return ch;
        if (L.fxA[id]) return L.fxA[id];
        return ch === 32 ? GLOW : ch;
      case FX_TWINKLE: {
        const v = ((t / L.fxT[id] + L.fxP[id]) % 1 + 1) % 1;
        return v < 0.12 ? L.fxB[id] : v < 0.16 ? 32 : ch;
      }
      default:
        return ch;
    }
  }

  // escritura con prueba de profundidad (para lo que se mueve)
  put(c, r, ch, z) {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return;
    const i = r * this.cols + c;
    if (z <= this.depth[i]) {
      this.chars[i] = ch;
      this.depth[i] = z;
    }
  }

  // sprite de capa: (c, r) en coordenadas de capa, `near` según profundidad
  sprite(L, c, r, s, near, clipRow = Infinity) {
    const z = L.zBase - near;
    const c0 = c - s.ax - L.vc;
    const r0 = r - s.ay - L.vr;
    const clip = clipRow - L.vr;
    for (let y = 0; y < s.h; y++) {
      const rr = r0 + y;
      if (rr < 0 || rr >= this.rows || rr >= clip) continue;
      for (let x = 0; x < s.w; x++) {
        const ch = s.cells[y * s.w + x];
        if (ch) this.put(c0 + x, rr, ch, z);
      }
    }
  }

  // ¿se ve algo de esta caja de capa en pantalla?
  visible(L, c, r, w, h) {
    const sc = c - L.vc;
    const sr = r - L.vr;
    return sc + w >= 0 && sc - w < this.cols && sr + h >= 0 && sr - h < this.rows;
  }

  // Título fijo al centro, como el OPENFIELD de of.domains: texto plano en la
  // grilla con un espacio opaco a cada lado, que tapa lo que pasa detrás.
  drawTitle() {
    const w = this.title.length;
    const r = Math.floor(this.rows / 2);
    const c = Math.floor(this.cols / 2 - w / 2);
    for (let i = -1; i <= w; i++) this.put(c + i, r, i < 0 || i >= w ? 32 : this.title.charCodeAt(i), -1);
  }

  // pista al inicio: "desliza" y una flecha que baja; se apaga al scrollear
  drawHint(alpha) {
    if (alpha < 0.3) return;
    const text = ' desliza ';
    const r = this.rows - 4;
    const c = Math.floor(this.cols / 2 - text.length / 2);
    const bob = Math.floor(this.t * 2) % 2;
    for (let i = 0; i < text.length; i++) this.put(c + i, r, text.charCodeAt(i), -1);
    const m = Math.floor(this.cols / 2);
    for (let y = 1; y <= 2; y++) for (let x = -1; x <= 1; x++) this.put(m + x, r + y, 32, -1);
    this.put(m, r + 1 + bob, 0x2193, -1);
  }

  // disolución pegada al borde superior del contenido: dithering que se vuelve
  // opaco (espacios del color del fondo) justo donde empieza la página
  drawDissolve(contentRow) {
    const G = Math.max(8, Math.round(this.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < this.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < this.cols; c++) {
        if (amount >= 1 || bayer(c, r) < amount) this.put(c, r, 32, -2);
      }
    }
  }

  flush() {
    const { cols, rows, chars } = this;
    const lines = new Array(rows);
    for (let r = 0; r < rows; r++) lines[r] = String.fromCharCode.apply(null, chars.subarray(r * cols, (r + 1) * cols));
    this.pre.textContent = lines.join('\n');
  }
}

export { ST };
