// La cordillera en alzado y, adelante, la precordillera. Lienzos que se
// repiten en horizontal.
//
// Cada cordón es una sola silueta: el mínimo de varios macizos, con flancos de
// pendiente cuantizada a lo que Jgs dibuja como trazo continuo:
//   1 col/fila   /  \
//   2 col/fila   _/  \_
//   3 col/fila   __/  \__
// Adentro:
//   - la arista que baja de cada cumbre separa la cara al sol de la cara en
//     sombra (a la derecha, rayada / con puntos)
//   - la nieve termina en un borde dentado \/\_/\ con lenguas por las quebradas
//   - abajo, roca con la grilla de puntos de la referencia
// De noche (tema oscuro) la nieve es lo que brilla: se invierte la tinta.
import { Canvas, SP } from './grid.js';

const DOT = 46; // .
const COLON = 58; // :
const COMMA = 44; // ,

function massif(rng, ax, ay, floor, gentle) {
  const side = () => {
    const segs = [];
    let y = ay;
    let first = true;
    while (y < floor + 2) {
      const s = gentle ? rng.pick([2, 2, 3, 3, 4]) : first ? 1 : rng.pick([1, 1, 2, 2, 3]);
      const n = first && !gentle ? rng.int(2, 5) : rng.int(1, 4);
      segs.push([s, n]);
      y += n;
      first = false;
    }
    return segs;
  };
  return { ax, ay, L: side(), R: side(), spur: rng.range(0.6, 1.0) };
}

function heightAt(m, x) {
  const segs = x < m.ax ? m.L : m.R;
  let d = Math.abs(x - m.ax);
  let y = m.ay;
  for (const [s, n] of segs) {
    if (d <= s * n) return y + d / s;
    d -= s * n;
    y += n;
  }
  return y + d / 4;
}

// glifo de borde según la pendiente (filas por columna; + baja a la derecha)
// y la altura dentro de la celda (0 arriba, 1 abajo)
function edgeGlyph(slope, f) {
  const a = Math.abs(slope);
  if (a > 0.7) return slope < 0 ? 47 : 92;
  if (a < 0.12) return f < 0.5 ? 175 : 95;
  if (f < 0.42) return slope < 0 ? 47 : 92;
  return 95;
}

function texture(kind, x, y, night) {
  switch (kind) {
    case 'snowSun':
      return night ? (x % 2 === 0 && y % 2 === 0 ? DOT : SP) : SP;
    case 'snowShade':
      if (night) return x % 2 === 0 ? COLON : SP;
      return (x - y + 400) % 5 === 0 ? 92 : SP;
    case 'rockSun':
      return night ? ((x + 3 * y) % 8 === 0 ? DOT : SP) : x % 2 === 0 ? DOT : SP;
    case 'rockShade':
      return night ? (x % 4 === 0 && y % 2 === 0 ? DOT : SP) : x % 2 === 0 ? COLON : SP;
    case 'scrubSun':
      return (x * 7 + y * 13) % 9 === 0 ? COMMA : (x + y) % 2 === 0 && x % 2 === 0 ? DOT : SP;
    case 'scrubShade':
      return x % 2 === 0 ? COLON : (x * 3 + y * 5) % 7 === 0 ? COMMA : SP;
  }
  return SP;
}

function drawRange(cv, rng, { count, yMin, yMax, gentle, snow, night }) {
  const { w, h } = cv;
  const ms = [];
  const step = w / count;
  for (let i = 0; i < count; i++) {
    const ax = Math.round(i * step + rng.range(-step * 0.3, step * 0.3));
    const m = massif(rng, ax, Math.round(rng.range(yMin, yMax)), h, gentle);
    // línea de nieve: profundidad base + lenguas en V por las quebradas
    m.snow = snow > 0 ? m.ay + (h - m.ay) * snow * rng.range(0.7, 1.15) : -1;
    m.tongues = [];
    for (let x = -50; x < 50; x += rng.int(3, 7)) m.tongues.push([x, rng.range(1, 2.5), rng.range(1.5, 4)]);
    ms.push(m);
    // cumbres secundarias en los flancos: la arista queda dentada
    if (!gentle) {
      for (let k = rng.int(1, 3); k > 0; k--) {
        const sx = ax + rng.pick([-1, 1]) * rng.int(6, 16);
        const sub = massif(rng, sx, m.ay + rng.int(2, 7), h, false);
        sub.snow = m.snow;
        sub.tongues = m.tongues.map(([tx, hw, d]) => [tx + ax - sx, hw, d]);
        ms.push(sub);
      }
    }
  }
  const all = [...ms, ...ms.map((m) => ({ ...m, ax: m.ax - w })), ...ms.map((m) => ({ ...m, ax: m.ax + w }))];
  const top = new Float32Array(w + 1);
  const owner = new Array(w + 1);
  for (let x = 0; x <= w; x++) {
    let best = Infinity;
    for (const m of all) {
      if (Math.abs(x + 0.5 - m.ax) > 80) continue;
      const y = heightAt(m, x + 0.5);
      if (y < best) {
        best = y;
        owner[x] = m;
      }
    }
    top[x] = best;
  }
  const snowAt = (m, x) => {
    if (m.snow < 0) return -1;
    const rel = x - m.ax;
    let y = m.snow + Math.sin(x * 0.37 + m.ax) * 0.8;
    for (const [tx, hw, d] of m.tongues) {
      const u = Math.abs(rel - tx) / hw;
      if (u < 1) y += d * (1 - u);
    }
    return y;
  };

  for (let x = 0; x < w; x++) {
    const m = owner[x];
    const y0 = top[x];
    const row = Math.floor(y0);
    const slope = (heightAt(m, x + 0.52) - heightAt(m, x + 0.48)) / 0.04;
    const rel = x + 0.5 - m.ax;
    const sl = snowAt(m, x + 0.5);
    for (let y = row + 1; y < h; y++) {
      const shade = rel > (y - m.ay) * m.spur;
      let kind;
      if (sl > 0 && y < sl) kind = shade ? 'snowShade' : 'snowSun';
      else if (gentle) kind = shade ? 'scrubShade' : 'scrubSun';
      else kind = shade ? 'rockShade' : 'rockSun';
      cv.put(x, y, texture(kind, x, y, night));
    }
    // borde de la nieve: dientes \/ en las lenguas, _ entre medio
    if (sl > 0) {
      const ys = Math.floor(sl);
      if (ys > row + 1 && ys < h) {
        const d = snowAt(m, x + 1) - snowAt(m, x);
        cv.put(x, ys, d > 0.45 ? 92 : d < -0.45 ? 47 : 95);
      }
    }
    cv.put(x, row, edgeGlyph(slope, y0 - row));
  }
  // canaletas: desde la punta de cada lengua de nieve baja una línea por la roca
  for (const m of ms) {
    if (m.snow < 0) continue;
    for (const [tx, , d] of m.tongues) {
      if (d < 2.5) continue;
      const x0 = Math.round(m.ax + tx);
      const xi = ((x0 % w) + w) % w;
      if (owner[xi] !== m) continue;
      const y0 = Math.floor(snowAt(m, x0 + 0.5)) + 1;
      const len = 2 + ((x0 * 7) % 4);
      for (let k = 0; k < len && y0 + k < h; k++) if (k % 2 === 0 || k < 2) cv.put(x0 + (k > 2 ? 1 : 0), y0 + k, k > 2 ? 92 : 124);
    }
  }
  // aristas: desde cada cumbre, la línea que separa sol y sombra
  for (const m of ms) {
    const len = (h - m.ay) * (m.snow > 0 ? 0.55 : 0.35);
    for (let k = 1; k < len; k++) {
      const x = Math.round(m.ax + k * m.spur);
      const y = Math.round(m.ay + k);
      const xi = ((x % w) + w) % w;
      if (y <= top[xi] + 0.5 || owner[xi] !== m) continue;
      if (k % 3 !== 2) cv.put(x, y, 92);
    }
  }
}

// cordón alto, nevado
export function buildAndes(rng, { w = 480, h = 26, night = false } = {}) {
  const cv = new Canvas(w, h, true);
  drawRange(cv, rng, { count: Math.round(w / 44), yMin: 0, yMax: 7, gentle: false, snow: 0.5, night });
  return cv;
}

// precordillera: lomas bajas adelante, sin nieve, con matorral
export function buildFoothills(rng, { w = 420, h = 12, night = false } = {}) {
  const cv = new Canvas(w, h, true);
  drawRange(cv, rng, { count: Math.round(w / 55), yMin: 1, yMax: 6, gentle: true, snow: 0, night });
  // antenas en las lomas
  for (let x = rng.int(10, 40); x < w; x += rng.int(50, 110)) {
    let y = 0;
    while (y < h - 1 && cv.get(x, y) === 0) y++;
    cv.put(x, y - 1, 124);
    cv.put(x, y - 2, 89);
  }
  return cv;
}
