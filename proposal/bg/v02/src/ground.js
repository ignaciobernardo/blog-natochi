// El piso: veredas, ciclovía, pistas, bandejón, cebras, líneas de detención y
// calles transversales. Se pinta una vez sobre la capa estática, celda por
// celda: en esta proyección la fila fija y (y = r + ½) y la diferencia c − r
// fija x (x = (c − r) / 2), así que cada celda sabe qué pisa.
//
// Las celdas con x entero caen sobre una línea a lo largo de y (\); las de x
// con medio quedan en el medio de su franja.

import { X } from './layout.js';
import { hash2 } from './rng.js';

const mod = (a, n) => ((a % n) + n) % n;

export const GROUND = 1.5; // el piso queda atrás de todo lo que se para encima

const DOT = 46; //   .
const TICK = 39; //  '
const COMMA = 44; // ,
const BS = 92; //    \
const US = 95; //    _
const QUOTE = 34; // "
const RING = 0x25cb; // ○
const EQ = 61; //    =
const COLON = 58; // :

// baldosas: un punto cada dos columnas en filas alternas
const tiles = (x2, r) => ((x2 & 1) === 1 && (r & 1) === 0 ? DOT : 0);

// pasto: ticks y comas dispersos
function grass(c, r, density) {
  const h = hash2(c * 3 + 7, r * 5 + 1);
  if (h > density) return 0;
  const k = h / density;
  return k < 0.35 ? TICK : k < 0.7 ? COMMA : k < 0.9 ? DOT : QUOTE;
}

const inWalk = (x) => (x > X.lotW && x < X.bikeW) || (x > X.treeE && x < X.curbW) || (x > X.curbE && x < X.lotE);

export function paintGround(layer, layout) {
  const { c0, r0, w, h } = layer;
  for (let r = r0; r < r0 + h; r++) {
    const y = r + 0.5;
    const S = layout.streetAt(y);
    const ahead = layout.ahead(y);
    const behind = layout.behind(y);
    for (let c = c0; c < c0 + w; c++) {
      const x2 = c - r;
      const x = x2 / 2;
      const ch = S === null ? avenue(x, x2, y, c, r, ahead, behind) : street(x, x2, y - S, c, r);
      layer.put(c, r, ch || 32, x - y + GROUND);
    }
  }
}

// Tramo de avenida entre transversales
function avenue(x, x2, y, c, r, ahead, behind) {
  if (x < X.lotW || x > X.lotE) return (c & 1) === 0 ? COLON : 0; // patios entre edificios
  const on = (x2 & 1) === 0;
  const yi = Math.floor(y);
  // la fila justo antes de una cebra: el borde de arriba de cada franja
  if (ahead < 1 && x > X.curbW && x < X.curbE && stripe(x) && !on) return US;
  if (on) {
    if (x === X.curbW || x === X.curbE || x === X.medW || x === X.medE) return BS;
    if (x === -13) return mod(yi, 5) === 0 ? BS : 0; // eje de la ciclovía
  }
  if (x === X.laneS || x === X.laneN) return ahead < 8 || behind < 8 ? BS : mod(yi, 7) < 2 ? BS : 0;
  // ciclovía: bicicletas pintadas
  if ((x === -13.5 || x === -12.5) && mod(yi, 23) === 4) return 0x25cb;
  // líneas de detención
  if (x > X.curbW && x < X.medW && ahead > 2 && ahead < 3) return US;
  if (x > X.medE && x < X.curbE && behind > 1 && behind < 2) return US;
  if (x > X.bikeE && x < X.treeE) return grass(c, r, 0.3);
  if (x > X.medW && x < X.medE) return grass(c, r, 0.55);
  if (inWalk(x)) return tiles(x2, r);
  if (x > X.curbW && x < X.curbE && !on) {
    if (hash2(yi * 13 + 5, x2 + 99) < 0.01) return RING;
    if ((x === X.curbW + 0.5 || x === X.curbE - 0.5) && yi % 17 === 0) return EQ;
  }
  return 0;
}

// franjas de la cebra de la avenida: [a, a+1] con a impar entre −7 y 7
const stripe = (x) => {
  const a = Math.floor(x);
  return (a & 1) === 1 && a >= -7 && a < 7;
};

// Franja de una calle transversal (sy = y − S en [0, 12))
function street(x, x2, sy, c, r) {
  const on = (x2 & 1) === 0;
  const lots = x < X.lotW || x > X.lotE;
  const avenueZone = x > X.curbW && x < X.curbE;
  const road = sy > 3 && sy < 9;
  if (avenueZone) {
    // cebras a lo largo de y en las veredas de la transversal
    if (!road && stripe(x)) {
      if (on) return BS;
      if ((sy > 2 && sy < 3) || (sy > 11 && sy < 12)) return US;
      return 0;
    }
    // borde de arriba de la cebra sur
    if (sy > 8 && sy < 9 && stripe(x) && !on) return US;
    return 0;
  }
  if (road) {
    if (lots) {
      if (sy > 5 && sy < 6 && mod(x2, 8) < 4) return US; // eje segmentado
      if (sy > 8 && sy < 9) return US; // solera sur
      return 0;
    }
    // la transversal cruza el paseo y la vereda este: cebras de barras
    if (x > X.bikeW && x < X.bikeE) return 0;
    if ((sy > 3 && sy < 4) || (sy > 5 && sy < 6) || (sy > 7 && sy < 8)) return US;
    if (sy > 8 && sy < 9) return US;
    return 0;
  }
  // veredas de la transversal: solera norte al final de la vereda norte
  if (sy > 2 && sy < 3) return US;
  if (on && (x === X.curbW || x === X.curbE)) return BS;
  if (x > X.bikeW && x < X.bikeE) return 0;
  return tiles(x2, r);
}
