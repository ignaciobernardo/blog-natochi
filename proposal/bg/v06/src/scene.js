// La escena: bajar por el corte del edificio guiado por el scroll.
//
//   0.00  cielo y azotea (tanque, antenas, ropa tendida, el gato)
//   0.05  departamentos, piso por piso, con la escalera y el ascensor al medio
//   0.55  planta baja: café y panadería
//   0.65  cocheras -1 y -2
//   0.80  caños y cloaca
//   1.00  la estación de metro con el tren que llega y se va
//
// Es una cámara 2D que baja: el edificio se mueve 1:1 y el fondo (cielo,
// ciudad lejana, vecinos) más lento, con parallax.
import { bayer, clamp } from './grid.js';
import { makeLayout, Building } from './building.js';
import { Roof } from './roof.js';
import { Backdrop } from './backdrop.js';
import { Under } from './under.js';

export class Scene {
  constructor(g, { seed = 6, title = 'NATOCHI' } = {}) {
    this.g = g;
    this.seed = seed;
    this.title = title;
    this.t = 0;
    this.p = 0;
    this.show = { backdrop: true, building: true, roof: true, under: true, title: true };
    this.resize();
  }

  resize() {
    const { g } = this;
    this.L = makeLayout(g.cols, g.rows, this.seed);
    this.building = new Building(this.L);
    this.roof = new Roof(this.L);
    this.backdrop = new Backdrop(this.L);
    this.under = new Under(this.L);
  }

  // filas que recorre la cámara de arriba a abajo
  get travel() {
    return Math.max(1, this.L.worldH - this.g.rows);
  }

  // input: { progress (0..1), dt, contentTop (px | null), reduced }
  frame(input) {
    const { g } = this;
    const dt = Math.min(input.dt || 0, 0.1);
    if (!input.reduced) this.t += dt;
    const t = this.t;
    // la cámara sigue al scroll con suavizado
    const target = clamp(input.progress, 0, 1);
    const ease = input.instant ? 1 : 1 - Math.exp(-dt * 7);
    this.p += (target - this.p) * ease;
    if (Math.abs(target - this.p) < 1e-4) this.p = target;
    const camY = Math.round(this.p * this.travel);
    this.camY = camY;

    const s = this.show;
    g.clear();
    if (s.backdrop) this.backdrop.draw(g, camY, t);
    if (s.under) this.under.drawEarth(g, camY);
    if (s.building) this.building.draw(g, camY, t);
    if (s.roof) this.roof.draw(g, camY, t);
    if (s.under) this.under.draw(g, camY, t);
    if (s.title) this.drawTitle();
    if (input.progress < 0.02) this.drawHint(1 - input.progress / 0.02);
    if (input.contentTop != null) this.drawDissolve(input.contentTop / g.cellH);
    g.flush();
  }

  // Título fijo al centro, como OPENFIELD: texto plano con un espacio opaco a
  // cada lado que tapa lo que pasa por detrás.
  drawTitle() {
    const { g } = this;
    const w = this.title.length;
    const r = Math.floor(g.rows / 2);
    const c = Math.floor(g.cols / 2 - w / 2);
    g.fill(c - 1, r, w + 2, 1, 32);
    g.text(c, r, this.title);
  }

  // Pista al inicio: "desliza" con una flecha que baja.
  drawHint(alpha) {
    const { g } = this;
    if (alpha < 0.3) return;
    const text = ' desliza ';
    const r = g.rows - 3;
    const c = Math.floor(g.cols / 2 - text.length / 2);
    const bob = Math.floor(this.t * 2) % 2;
    g.text(c, r, text);
    g.fill(Math.floor(g.cols / 2) - 1, r + 1, 3, 2, 32);
    g.put(Math.floor(g.cols / 2), r + 1 + bob, 8595);
  }

  // Disolución pegada al borde superior del contenido: dithering de Bayer que
  // termina en espacios opacos (el color de fondo) justo donde empieza la página.
  drawDissolve(contentRow) {
    const { g } = this;
    const G = Math.max(8, Math.round(g.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < g.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < g.cols; c++) if (amount >= 1 || bayer(c, r) < amount) g.put(c, r, 32);
    }
  }
}
