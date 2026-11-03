// El recorrido: dónde están las estaciones, el río, el parque y las calles
// que cruzan. Todo en "unidades de vía": una columna de la capa cercana.
//
// Cada capa tiene su factor de parallax f (la cercana 1, el horizonte casi 0)
// y su coordenada local lx = x·f + M. En pantalla:
//   columna = cx + (x − camX)·f
// es decir, todas las capas escalan alrededor del centro de la pantalla, que
// es también el punto de fuga: las calles que cruzan y las caras laterales de
// los edificios convergen hacia NATOCHI.
import { Rng } from './rng.js';

export const L = 1780; // largo del viaje (unidades de vía)
export const M = 200; // margen a cada lado en las tiras

export const STATIONS = [
  { x: 420, name: 'LOS AROMOS', line: 'L1', next: 'PLAZA TELAR' },
  { x: 1120, name: 'PLAZA TELAR', line: 'L1', next: 'MIRADOR' },
  { x: L, name: 'MIRADOR', line: 'L1', next: '', end: true },
];
export const RIVER = [690, 840];
export const PARK = [1255, 1395];

// Zonas de la ciudad cercana según x
export function zoneAt(x) {
  if (x >= RIVER[0] && x < RIVER[1]) return 'rio';
  if (x >= PARK[0] && x < PARK[1]) return 'parque';
  if (x < 250) return 'barrio';
  if (x < RIVER[0]) return 'antiguo';
  if (x < 1080) return 'centro';
  if (x < PARK[0]) return 'barrio';
  if (x < 1600) return 'antiguo';
  return 'barrio';
}

// Calles transversales: corredores que atraviesan todas las capas.
export function crossStreets(seed = 7) {
  const rng = new Rng(seed);
  const out = [];
  let x = -460;
  while (x < L + 520) {
    x += rng.int(120, 200);
    const w = rng.int(15, 21);
    // ni dentro del río ni pegadas a él
    if (x + w > RIVER[0] - 30 && x < RIVER[1] + 30) {
      x = RIVER[1] + 30;
      continue;
    }
    // v11: la laguna ocupa el parque entero, sin calles que la corten
    if (x + w > PARK[0] - 20 && x < PARK[1] + 20) {
      x = PARK[1] + 20;
      continue;
    }
    out.push([x, x + w]);
    x += w;
  }
  return out;
}

export const inRange = (a, b, ranges) => ranges.some(([c, d]) => a < d && b > c);

// Scroll -> posición del tren. Cerca de cada estación el tren frena: hace falta
// más scroll para avanzar lo mismo, así se "detiene" en el andén.
export class Route {
  constructor() {
    const N = 4096;
    this.N = N;
    this.cum = new Float64Array(N + 1);
    let acc = 0;
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * L;
      let cost = 1;
      for (const s of STATIONS) {
        const d = (x - s.x) / (s.end ? 70 : 34);
        cost += (s.end ? 2.2 : 3.4) * Math.exp(-d * d);
      }
      if (i) acc += cost;
      this.cum[i] = acc;
    }
    for (let i = 0; i <= N; i++) this.cum[i] /= acc;
  }

  // p en [0, 1] -> x en [0, L]
  camAt(p) {
    if (p <= 0) return p * L * 0.3;
    if (p >= 1) return L;
    const { cum, N } = this;
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < p) lo = mid;
      else hi = mid;
    }
    const t = (p - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return ((lo + t) / N) * L;
  }
}
