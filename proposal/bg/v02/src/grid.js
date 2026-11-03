// Grilla local para armar sprites a partir de cajas del mundo: se dibuja con
// las mismas primitivas (box, Face) y después se recorta a un sprite que
// guarda la profundidad relativa de cada celda, para que un auto o un
// paradero se tapen bien con lo que tienen alrededor.

import { NONE } from './iso.js';

export class Grid {
  constructor(r = 24) {
    this.R = r;
    this.n = 2 * r;
    this.chars = new Uint16Array(this.n * this.n);
    this.depth = new Float32Array(this.n * this.n).fill(Infinity);
  }

  put(c, r, ch, d) {
    c += this.R;
    r += this.R;
    if (c < 0 || r < 0 || c >= this.n || r >= this.n) return;
    const i = r * this.n + c;
    if (d < this.depth[i]) {
      this.depth[i] = d;
      this.chars[i] = ch;
    }
  }

  // borra una celda (vuelve a transparente)
  erase(c, r) {
    c += this.R;
    r += this.R;
    const i = r * this.n + c;
    this.chars[i] = NONE;
    this.depth[i] = Infinity;
  }

  // Recorta lo dibujado. El ancla queda en el vértice (0, 0) del mundo local.
  toSprite() {
    const { n, chars, depth } = this;
    let c0 = n;
    let c1 = -1;
    let r0 = n;
    let r1 = -1;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (depth[r * n + c] === Infinity) continue;
        if (c < c0) c0 = c;
        if (c > c1) c1 = c;
        if (r < r0) r0 = r;
        if (r > r1) r1 = r;
      }
    }
    const w = c1 - c0 + 1;
    const h = r1 - r0 + 1;
    const cells = new Uint16Array(w * h);
    const dd = new Float32Array(w * h);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const i = (r + r0) * n + c + c0;
        if (depth[i] === Infinity) continue;
        cells[r * w + c] = chars[i] || 32;
        dd[r * w + c] = depth[i];
      }
    }
    return { w, h, cells, dd, ax: this.R - c0, ay: this.R - r0, up: 0 };
  }
}
