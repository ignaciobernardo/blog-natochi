// Primer plano (f 2.6): postes de la catenaria con su ménsula, los cables
// que cuelgan entre poste y poste, y la baranda del viaducto. Pasan rápido.
// Sobre el río la baranda se vuelve el reticulado del puente.
import { RIVER } from './world.js';

const F = 2.6;
const P = 150; // distancia entre postes (columnas de esta capa)
const UND = 95;

export class Foreground {
  draw(scene, t) {
    const { rd, S, cx } = scene;
    const off = Math.round(scene.camX * F) - cx;
    const cols = rd.cols;
    const rows = rd.rows;
    // ¿sobre el río? (en x de vía, lo que está bajo el centro de la pantalla)
    const onBridge = (c) => {
      const wx = scene.camX + (c - cx) / F;
      return wx > RIVER[0] - 10 && wx < RIVER[1] + 10;
    };
    // baranda: pasamanos, postes y zócalo
    const yR = S + 6;
    for (let c = 0; c < cols; c++) {
      const lx = c + off;
      const m = ((lx % 12) + 12) % 12;
      if (yR < rows) rd.put(c, yR, UND);
      if (onBridge(c)) {
        // reticulado del puente: diagonales grandes
        const k = ((lx % 8) + 8) % 8;
        if (yR + 1 < rows) rd.put(c, yR + 1, k === 0 ? '|' : k < 4 ? (k === 1 ? '\\' : ' ') : k === 7 ? '/' : ' ');
        if (yR + 2 < rows) rd.put(c, yR + 2, k === 0 ? '|' : k === 2 ? '\\' : k === 6 ? '/' : ' ');
        if (yR + 3 < rows) rd.put(c, yR + 3, k === 0 ? '|' : k === 3 ? '\\' : k === 5 ? '/' : k === 4 ? 'V' : '_');
      } else {
        if (yR + 1 < rows) rd.put(c, yR + 1, m === 0 ? '|' : m === 6 ? ':' : ' ');
        if (yR + 2 < rows) rd.put(c, yR + 2, m === 0 ? '|' : '_');
      }
    }
    // interior del vagón bajo la ventana (pantallas altas): no se mueve
    if (yR + 3 < rows) this.interior(rd, yR + 3, rows, cols);
    // postes
    const k0 = Math.floor((off - 30) / P);
    const k1 = Math.floor((off + cols + 30) / P);
    const masts = [];
    for (let k = k0; k <= k1; k++) masts.push(k * P + 37 - off);
    // cables: dos catenarias entre postes
    for (let i = 0; i < masts.length - 1; i++) {
      const a = masts[i];
      const b = masts[i + 1];
      this.catenary(rd, a + 1, b + 1, 0.15, 3.6);
    }
    for (const x of masts) {
      if (x < -16 || x > cols + 2) continue;
      // mástil de reticulado
      for (let r = 0; r < Math.min(rows, yR + 3); r++) {
        rd.put(x, r, '|');
        rd.put(x + 1, r, r % 4 === 0 ? '=' : ' ');
        rd.put(x + 2, r, '|');
      }
      // ménsula con aislador
      for (let c = x - 14; c < x; c++) {
        rd.put(c, 1, UND);
        rd.put(c, 2, (c - x) % 2 ? '/' : '\\');
        rd.put(c, 3, '¯');
      }
      rd.put(x - 15, 2, '<');
      rd.put(x - 13, 4, 'o');
      rd.put(x - 13, 5, '|');
    }
    void t;
  }

  // Lo que se ve del vagón bajo el marco de la ventana: el alféizar, el
  // panel con la rejilla de la calefacción y los respaldos de los asientos.
  interior(rd, y0, rows, cols) {
    for (let r = y0; r < rows; r++) for (let c = 0; c < cols; c++) rd.put(c, r, ' ');
    rd.hline(0, cols - 1, y0, '¯');
    rd.hline(0, cols - 1, y0 + 1, '=');
    rd.hline(0, cols - 1, y0 + 2, '¯');
    const h = rows - y0;
    if (h < 6) return;
    // panel con remaches y rejilla
    for (let c = 2; c < cols - 2; c += 6) rd.put(c, y0 + 3, '.');
    const gy = y0 + 4;
    const span = 46;
    for (let x = 6; x < cols - 10; x += span + 14) {
      rd.text(x, gy, '.' + '-'.repeat(span) + '.');
      rd.text(x, gy + 1, '|' + '|'.repeat(span).split('').map((ch, i) => (i % 2 ? '|' : ' ')).join('') + '|');
      rd.text(x, gy + 2, "'" + '-'.repeat(span) + "'");
    }
    // respaldos de los asientos con alguien sentado de espaldas
    if (h < 10) return;
    const by = gy + 4;
    for (let x = 3, k = 0; x < cols - 20; x += 36, k++) {
      rd.text(x, by, '.-----------------------.');
      for (let r = by + 1; r < rows; r++) rd.text(x, r, '|                       |');
      if (k % 2 === 0) {
        rd.text(x + 9, by - 2, '.-.');
        rd.text(x + 8, by - 1, '(   )');
        rd.text(x + 7, by, '.-'.padEnd(2) + "'---'" + '-.');
      }
      for (let r = by + 2; r < rows; r += 2) rd.text(x + 3, r, ': : : : : : : : : :');
    }
  }

  // Cable colgando entre dos puntos (y0 al apoyarse, sag de flecha).
  catenary(rd, xa, xb, y0, sag) {
    const cols = rd.cols;
    const c0 = Math.max(0, Math.ceil(xa));
    const c1 = Math.min(cols - 1, Math.floor(xb));
    for (let c = c0; c <= c1; c++) {
      const u = (c + 0.5 - xa) / (xb - xa);
      const y = y0 + sag * 4 * u * (1 - u);
      const row = Math.floor(y);
      const f = y - row;
      const slope = sag * 4 * (1 - 2 * u) / (xb - xa);
      let ch = f < 0.34 ? '¯' : f < 0.67 ? '-' : '_';
      if (Math.abs(slope) > 0.35) ch = slope > 0 ? '\\' : '/';
      rd.put(c, row, ch);
    }
  }
}
