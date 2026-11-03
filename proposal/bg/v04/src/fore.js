// Primer plano: poste de luz con transformador, cables combados con palomas y
// un farol en la vereda de acá. Va más rápido que la cuadra (parallax > 1):
// los cables altos cruzan la pantalla mientras la grúa baja.
//
// Coordenadas: la fila local r cae en la fila de pantalla r + top al final del
// viaje (p = 1), así que lo que se diseña acá se ve tal cual abajo de todo.
import { Grid, SP } from './grid.js';
import { Rng } from './rng.js';

export function buildFore(L, dark, seed) {
  const { C, R, T } = L;
  const rng = new Rng(seed);
  const f = 1.35;
  const M = 14;
  const W = C + 2 * M;
  const top = Math.ceil(f * T) + 6; // filas por encima de la pantalla final
  const H = top + R + 2;
  const g = new Grid(W, H);
  const out = { grid: g, f, W, H, M, top, cables: [], pigeonSpots: [] };

  // poste a la izquierda (en mobile, pegado al borde)
  // en pantallas angostas el poste va contra el borde derecho y no hay farol
  const narrow = C < 70;
  const px = M + (narrow ? C - 3 : Math.max(3, Math.round(C * 0.12)));
  const lampX = M + Math.min(C - 6, Math.round(C * 0.9));
  const poleTop = top + Math.round(R * 0.06);
  // dos alturas de cables: unos que se ven al final y otros que cruzan antes
  const sets = [poleTop, top - Math.round(R * 0.8)];

  // cables (catenarias): de borde a borde, enganchados al poste
  const wire = (x0, y0, x1, y1, sag) => {
    const pts = [];
    for (let c = Math.min(x0, x1); c <= Math.max(x0, x1); c++) {
      const t = (c - x0) / (x1 - x0);
      const y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
      pts.push([c, y]);
    }
    out.cables.push(pts);
    for (let i = 0; i < pts.length; i++) {
      const [c, y] = pts[i];
      const row = Math.floor(y);
      const fr = y - row;
      const prev = pts[i - 1]?.[1] ?? y;
      const next = pts[i + 1]?.[1] ?? y;
      const slope = next - prev;
      // como '-.___.-' : ticks donde el cable baja o sube, rayas donde va plano
      let ch;
      const tilt = Math.abs(slope) > 0.35;
      if (Math.abs(slope) > 1.3) ch = slope > 0 ? 92 : 47;
      else ch = fr < 0.34 ? (tilt ? 39 : 175) : fr < 0.67 ? 45 : tilt ? 46 : 95;
      g.put(c, row, ch);
    }
    return pts;
  };

  for (const y of sets) {
    // tres cables por tanda, distintos combados
    const arms = y === poleTop ? [y, y + 3] : [y + 1];
    arms.forEach((ay, i) => {
      const sag = 2 + i * 1.2 + rng.next() * 1.5 + Math.min(2, C / 90);
      wire(-2, ay - 2 + rng.int(-1, 1), px - 2, ay, 1);
      const pts = wire(px + 2, ay, W + 2, ay - 1 + rng.int(-1, 1), sag);
      // lugares para palomas: en los tramos casi planos
      if (i < 2) for (let k = 4; k < pts.length - 4; k += 3) out.pigeonSpots.push({ cable: out.cables.length - 1, k });
    });
  }

  // poste de madera con travesaños, aisladores y transformador
  const pBottom = H - 1;
  for (let row = sets[1] - 2; row <= pBottom; row++) {
    g.put(px - 1, row, 124);
    g.put(px, row, (row & 1) === 0 ? 58 : SP);
    g.put(px + 1, row, 124);
  }
  for (const y of sets) {
    g.text(px - 5, y, '=o===o===o=');
    g.text(px - 4, y + 3, '-o-----o-');
    // transformador (tambor)
    g.text(px + 2, y + 9, '.---.');
    g.text(px + 2, y + 10, '|:::|');
    g.text(px + 2, y + 11, '|:::|');
    g.text(px + 2, y + 12, "'---'");
    g.text(px + 2, y + 13, ' | | ');
    // afiches pegados en el poste
    g.text(px - 1, y + 18, '[#]');
  }
  // escalones de fierro en el poste
  for (let row = poleTop + 20; row < pBottom - 6; row += 3) g.put(px + 2, row, 45);
  // aviso pegado
  g.text(px - 3, top + R - 9, '.---.');
  g.text(px - 3, top + R - 8, '|SE |');
  g.text(px - 3, top + R - 7, '|ARR|');
  g.text(px - 3, top + R - 6, "'---'");

  out.pole = { x: px };
  if (narrow) return out;
  // farol de la vereda de acá: poste alto con brazo curvo y pantalla
  const lt = top + Math.round(R * 0.3);
  for (let row = lt + 2; row <= pBottom; row++) g.put(lampX, row, 124);
  g.text(lampX - 7, lt - 1, '.------.');
  g.text(lampX - 8, lt, '/');
  g.put(lampX, lt, 124);
  g.put(lampX, lt + 1, 124);
  g.text(lampX - 10, lt + 1, '/__\\');
  g.text(lampX - 1, pBottom - 1, '/_\\');
  out.lamp = { x: lampX - 8, y: lt + 2 };
  out.pole = { x: px };
  return out;
}
