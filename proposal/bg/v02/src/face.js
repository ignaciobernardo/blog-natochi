// Ayudas para dibujar sobre una cara plana del mundo con sus propias
// coordenadas (u, v):
//
//   'L' lado oeste  (x = k): u = y (\), v = z (/)   — las vidrieras del este
//   'F' frente sur  (y = k): u = x (_), v = z (/)   — las caras a la transversal
//   'T' techo       (z = k): u = x (_), v = y (\)
//
// En una cara 'L' cada celda cae sobre una línea u entera (trazo /) o una
// línea v entera (trazo \), alternadas: la cara es una red de rombos.

import { fillFace, faceSeg, facePoint, code } from './iso.js';

export const ch = code;

export class Face {
  constructor(kind, k) {
    this.kind = kind;
    this.k = k;
  }

  P(u, v) {
    return facePoint(this.kind, this.k, u, v);
  }

  fill(t, u0, u1, v0, v1, tex = null, bias = -0.2) {
    fillFace(t, this.kind, this.k, u0, u1, v0, v1, tex, bias);
  }

  seg(t, u, v, axis, n, glyph, bias = -0.9) {
    if (n > 0) faceSeg(t, this.kind, this.k, u, v, axis, n, glyph == null ? undefined : code(glyph), bias);
  }

  // marco con relleno (tex o espacio opaco)
  rect(t, u0, u1, v0, v1, tex = null, bias = -0.3) {
    this.fill(t, u0, u1, v0, v1, tex, bias);
    this.frame(t, u0, u1, v0, v1, bias - 0.6);
  }

  frame(t, u0, u1, v0, v1, bias = -0.9) {
    this.seg(t, u0, v0, 'u', u1 - u0, null, bias);
    this.seg(t, u0, v1, 'u', u1 - u0, null, bias);
    this.seg(t, u0, v0, 'v', v1 - v0, null, bias);
    this.seg(t, u1, v0, 'v', v1 - v0, null, bias);
  }

  // un carácter en la celda cuyo centro es (u, v) de la cara
  at(t, u, v, glyph, bias = -1.2) {
    const [x, y, z] = this.P(u, v);
    const c = Math.round(2 * x + y + z - 0.5);
    const r = Math.round(y - z - 0.5);
    t.put(c, r, code(glyph), x - y - z + bias);
  }

  // Texto sobre la cara. En 'L' a lo largo de u baja en diagonal: las letras
  // van en las celdas del medio de una franja de una unidad de alto (v + ½).
  text(t, u, v, str, bias = -1.2, step = 1) {
    for (let i = 0; i < str.length; i++) {
      if (str[i] === ' ') continue;
      if (this.kind === 'L') this.at(t, u + i * step, v + 0.5, str[i], bias);
      else this.at(t, u + (i * step) / 2, v + 0.5, str[i], bias);
    }
  }

  // un sprite parado en el punto (u, v) de la cara
  stamp(t, s, u, v, bias = -1.2) {
    const [x, y, z] = this.P(u, v);
    const C = Math.round(2 * x + y + z);
    const R = Math.round(y - z);
    const d0 = x - y - z + bias;
    for (let j = 0; j < s.h; j++) {
      for (let i = 0; i < s.w; i++) {
        const g = s.cells[j * s.w + i];
        if (g) t.put(C + i - s.ax, R + j - s.ay, g, d0 - (s.ay - 1 - j) * s.up * 0.1);
      }
    }
  }
}

// --- texturas: (c, r, u, v) → código (0 = espacio) -------------------------
const COLON = 58;
const DOT = 46;
const TICK = 39;

export const TEX = {
  blank: () => 0,
  // la grilla de dos puntos de la referencia
  colon: (c) => (c & 1 ? 0 : COLON),
  colonOdd: (c) => (c & 1 ? COLON : 0),
  // puntos sueltos
  dots: (c, r) => ((c & 1) === 0 && (r & 1) === 0 ? DOT : 0),
  dotsDense: (c) => (c & 1 ? 0 : DOT),
  // ladrillo: ticks alternados
  ticks: (c, r) => ((c + 2 * r) % 6 === 0 ? TICK : 0),
};

// rayado a lo largo de las líneas v enteras cada `n` (en una cara 'L' son \)
export const hatchV = (n, glyph = 92) => (c, r, u, v) => (Number.isInteger(v) && v % n === 0 ? glyph : 0);
export const hatchU = (n, glyph = 47) => (c, r, u, v) => (Number.isInteger(u) && u % n === 0 ? glyph : 0);
