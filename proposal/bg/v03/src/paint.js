// Herramientas para pintar edificios en alzado sobre un Canvas.
import { SP } from './grid.js';

// Texturas de pared/vidrio: (x, y) locales -> char code (SP = muro liso)
export const TEX = {
  plain: () => SP,
  // la grilla de puntos de la referencia
  dots: (x) => (x % 2 === 0 ? 58 : SP),
  dotsLight: (x, y) => (x % 2 === 0 && y % 2 === 0 ? 46 : SP),
  dotsSparse: (x, y) => ((x + 2 * y) % 6 === 0 ? 46 : SP),
  // vidrio: rayas diagonales que forman reflejos
  glass: (x, y) => ((x + y) % 4 === 0 ? 47 : SP),
  glassBand: (x, y) => ((x + y) % 12 < 5 && (x + y) % 2 === 0 ? 47 : y % 3 === 2 ? 95 : SP),
  // franjas
  vfins: (x) => (x % 2 === 0 ? 124 : SP),
  hbands: (x, y) => (y % 2 === 0 ? 61 : SP),
  ribbons: (x, y) => (y % 3 === 0 ? 95 : y % 3 === 1 ? SP : x % 3 === 0 ? 124 : SP),
  // ladrillo
  brick: (x, y) => (y % 2 === 0 ? ((x + (y % 4 ? 2 : 0)) % 4 === 0 ? 124 : 95) : SP),
  // ventanas cuadradas de lejos
  punched: (x, y) => (y % 2 === 0 ? (x % 3 === 0 ? 91 : x % 3 === 1 ? 93 : SP) : SP),
  checker: (x, y) => (y % 2 === 0 ? (x % 4 < 2 ? (x % 4 === 0 ? 91 : 93) : 58) : x % 2 === 0 ? 46 : SP),
};

// Códigos de textura pendientes: se pintan como "muro" mientras se compone el
// edificio y al final `resolve` los cambia por el glifo. Las texturas de
// puntos dejan un halo en blanco alrededor de cada objeto, como en la
// referencia: los puntos se cortan una celda antes de cada ventana o letrero.
export const W = {
  blank: 1,
  dots: 2, //    : : :
  light: 3, //   . . .  (filas alternas)
  sparse: 4, //  .   .
  shade: 5, //   \_\_\_  sombra bajo losas y cornisas
  rshade: 6, //  /_/_/_
  brick: 7,
  siding: 8, //  - - -
  hatch: 9, //   /   /  rayado suelto
  dense: 10, //  : : :  sin halo (sombra de nichos)
};
const HALO = new Set([W.dots, W.light, W.sparse, W.brick, W.siding, W.hatch]);

function texChar(code, x, y) {
  switch (code) {
    case W.dots:
    case W.dense:
      return x % 2 === 0 ? 58 : SP;
    case W.light:
      return x % 2 === 0 ? 46 : SP;
    case W.sparse:
      return (x + 2 * y) % 6 === 0 ? 46 : SP;
    case W.shade:
      return x % 2 === 0 ? 92 : 95;
    case W.rshade:
      return x % 2 === 0 ? 47 : 95;
    case W.brick:
      return y % 2 === 0 ? ((x + (y % 4 ? 2 : 0)) % 4 === 0 ? 124 : 95) : SP;
    case W.siding:
      return y % 2 === 0 && x % 3 !== 2 ? 45 : SP;
    case W.hatch:
      return (x + y) % 4 === 0 ? 47 : SP;
  }
  return SP;
}

export function resolve(cv) {
  const src = cv.d.slice();
  const { w, h } = cv;
  const at = (x, y) => {
    if (y < 0 || y >= h) return 0;
    if (cv.wrap) x = ((x % w) + w) % w;
    else if (x < 0 || x >= w) return 0;
    return src[y * w + x];
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = src[y * w + x];
      if (c === 0 || c >= 32) continue;
      let ink = false;
      if (HALO.has(c)) {
        // halo de una celda a cada lado en la misma fila, y arriba/abajo solo
        // justo encima o debajo
        ink = at(x - 1, y) > 32 || at(x + 1, y) > 32;
      }
      cv.d[y * w + x] = ink ? SP : texChar(c, x, y);
    }
  }
}

// Caja de edificio: techo `_` en la fila `y`, costados `|` desde y+1 hasta la
// base (fila `base`, incluida). Rellena el interior con `tex`.
export function box(cv, x, y, w, base, tex = TEX.plain, { roof = 95, side = 124 } = {}) {
  for (let j = y + 1; j <= base; j++) {
    cv.put(x, j, side);
    cv.put(x + w - 1, j, side);
    for (let k = 1; k < w - 1; k++) cv.put(x + k, j, tex(k - 1, j - y - 1));
  }
  if (roof) for (let k = 1; k < w - 1; k++) cv.put(x + k, y, roof);
}

// texto vertical (letreros)
export function vtext(cv, x, y, str, gap = 1) {
  let k = 0;
  for (const ch of str) {
    cv.put(x, y + k * gap, ch);
    k++;
  }
}

// cuerda colgada (catenaria) entre (x0, y0) y (x1, y1) con flecha `sag`
// en filas; elige `_ - ¯ . ' ´` por la altura dentro de la celda
export function rope(cv, x0, y0, x1, y1, sag, { onlyBlank = false } = {}) {
  if (x1 < x0) [x0, y0, x1, y1] = [x1, y1, x0, y0];
  const n = Math.max(1, x1 - x0);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
    const row = Math.floor(y);
    const f = y - row;
    const slope = (y1 - y0) / n + (sag * 4 * (1 - 2 * t)) / n;
    let g;
    if (Math.abs(slope) > 0.7) g = slope > 0 ? 92 : 47;
    else if (Math.abs(slope) < 0.15) g = f < 0.34 ? 175 : f < 0.67 ? 45 : 95;
    else if (f >= 0.6) g = 46;
    else if (f <= 0.4) g = slope < 0 ? 39 : 96;
    else g = 45;
    const x = x0 + i;
    if (onlyBlank) cv.soft(x, row, g);
    else cv.put(x, row, g);
  }
}

