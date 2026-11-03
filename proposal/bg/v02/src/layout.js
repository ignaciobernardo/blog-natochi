// Trazado de la avenida y sus cuadras (en unidades del mundo).
//
// x crece hacia el este (a la derecha de la pantalla), y hacia el sur (abajo a
// la derecha), z hacia arriba. La avenida corre a lo largo de y.
//
//   x ≤ −20      lotes del oeste (adelante: bajos, se ven los techos)
//   −20 … −17    terrazas y mercadería de los locales
//   −17 … −14    vereda del paseo
//   −14 … −12    ciclovía de doble sentido
//   −12 … −10    franja de árboles, bancas, faroles y palomas
//   −10 …  −8    vereda de la parada de micro
//    −8 …  −1    dos pistas hacia el sur (+y), de 3½
//    −1 …   1    bandejón central
//     1 …   8    dos pistas hacia el norte (−y)
//     8 …  12    vereda este
//    12 ≤ x      lotes del este (atrás: altos, con la vidriera a la avenida)
//
// Las calles transversales cruzan a lo largo de x. Cada una ocupa una franja
// y ∈ [S, S + 12]: vereda norte [S, S+3], calzada [S+3, S+9], vereda sur [S+9, S+12].

import { Rng } from './rng.js';

export const X = {
  lotW: -20,
  front: -17,
  bikeW: -14,
  bikeE: -12,
  treeE: -10,
  curbW: -8,
  laneS: -4.5,
  medW: -1,
  medE: 1,
  laneN: 4.5,
  curbE: 8,
  lotE: 12,
};

// posiciones derivadas: carriles de la gente, ciclovía, franja de árboles
export const POS = {
  walkS: -16, // vereda del paseo, hacia el sur
  walkN: -15, //                  hacia el norte
  walkES: 9.5, // vereda este
  walkEN: 10.5,
  bikeS: -13.5,
  bikeN: -12.5,
  tree: -11,
  stop: -10, // borde oeste del paradero
  lanes: [-6.25, -2.75, 2.75, 6.25],
};

export const STREET = 12;

export class Layout {
  constructor(seed, y0, y1) {
    const rng = new Rng(seed * 7919 + 13);
    this.streets = [];
    // la primera transversal queda un poco más abajo del centro al empezar
    const first = 8;
    let y = first;
    while (y > y0) {
      y -= STREET + rng.int(32, 40);
      this.streets.push(y);
    }
    y = first;
    while (y < y1) {
      this.streets.push(y);
      y += STREET + rng.int(34, 44);
    }
    this.streets.sort((a, b) => a - b);
    this.blocks = [];
    for (let i = 0; i < this.streets.length - 1; i++) {
      this.blocks.push({ y0: this.streets[i] + STREET, y1: this.streets[i + 1], i });
    }
  }

  // ¿qué transversal contiene a y? (su S, o null)
  streetAt(y) {
    for (const s of this.streets) if (y >= s && y < s + STREET) return s;
    return null;
  }

  // distancia a la próxima transversal hacia +y y a la anterior hacia −y
  ahead(y) {
    for (const s of this.streets) if (s >= y) return s - y;
    return 1e9;
  }
  behind(y) {
    for (let i = this.streets.length - 1; i >= 0; i--) {
      const e = this.streets[i] + STREET;
      if (e <= y) return y - e;
    }
    return 1e9;
  }
}
