// La escena: un paseo por la avenida guiado por el scroll.
//
// La ciudad es una proyección oblicua sin perspectiva, así que caminar por la
// avenida es deslizar el mundo por su diagonal: avanzar una unidad en y corre
// todo una columna y una fila. La parte quieta (piso, edificios, árboles) se
// rasteriza una vez en una capa larga y cada frame se copia la ventana
// visible; encima va la vida de la calle, el título, la pista y la disolución.

import { Layer, bayer, clamp } from './engine.js';
import { World } from './world.js';
import { Life } from './life.js';

// el paseo: centro de la pantalla desde y = 0 hasta y = LENGTH
export const LENGTH = 300;

export class AvenueScene {
  constructor(rd, { seed = 7, title = 'NATOCHI', dark = false } = {}) {
    this.rd = rd;
    this.title = title;
    this.dark = dark;
    this.t = 0;
    this.p = 0;
    this.world = new World(seed, -140, LENGTH + 140, { dark });
    this.life = null;
    this.seed = seed;
    this.resize();
  }

  // Encuadre: el centro de la pantalla cae un poco al oeste del bandejón,
  // para que entre más paseo (y la plaza o el parque) sin que el título deje
  // de estar sobre las pistas. En mobile, casi centrado en la avenida.
  offset() {
    const { cols, rows } = this.rd;
    const xc = cols >= 100 ? -5 : -2;
    return { dc: Math.floor(cols / 2) - 2 * xc, dr: Math.floor(rows / 2) };
  }

  resize() {
    const { cols, rows } = this.rd;
    const { dc, dr } = this.offset();
    const m = 4;
    const c0 = -dc - m;
    const r0 = -dr - m;
    const layer = new Layer(c0, r0, LENGTH + cols + 2 * m, LENGTH + rows + 2 * m);
    const t0 = performance.now();
    this.world.build(layer);
    this.buildMs = performance.now() - t0;
    this.layer = layer;
    // la vida necesita lo que registró la construcción (palomas de la plaza, patos…)
    if (!this.life) this.life = new Life(this.world, this.seed, { dark: this.dark });
    else this.life.sync();
  }

  // input: { progress (0..1), dt, contentTop (px) | null, reduced }
  frame(input) {
    const { rd } = this;
    const dt = Math.max(0, Math.min(input.dt, 0.1));
    if (!input.reduced) this.t += dt;

    // el paseo sigue al scroll con suavizado (las ruedas de mouse saltan)
    const ease = 1 - Math.exp(-dt * 5);
    this.p += (clamp(input.progress, 0, 1) - this.p) * ease;
    const cy = Math.round(this.p * LENGTH);
    const { dc, dr } = this.offset();
    rd.blit(this.layer, cy - dc, cy - dr);

    if (!input.reduced) this.life.update(dt, cy);
    this.life.draw(rd, this.t, cy);

    this.drawTitle();
    if (input.progress < 0.02) this.drawHint(1 - input.progress / 0.02);
    if (input.contentTop != null) this.drawDissolve(input.contentTop / rd.cellH);
    rd.flush();
  }

  // Título fijo al centro, como el OPENFIELD de of.domains: texto plano en la
  // grilla con un espacio opaco a cada lado, que tapa lo que pasa detrás.
  drawTitle() {
    const { rd } = this;
    const w = this.title.length;
    const r = Math.floor(rd.rows / 2);
    const c = Math.floor(rd.cols / 2 - w / 2);
    for (let i = -1; i <= w; i++) rd.putS(c + i, r, 32, -1e8);
    rd.textS(c, r, this.title, -1e9);
  }

  // Pista al inicio: "desliza" con una flecha que baja; se apaga al scrollear.
  drawHint(alpha) {
    const { rd } = this;
    if (alpha < 0.3) return;
    const text = ' desliza ';
    const r = rd.rows - 4;
    const c = Math.floor(rd.cols / 2 - text.length / 2);
    const bob = Math.floor(this.t * 2) % 2;
    rd.textS(c, r, text, -1e8);
    for (let y = 1; y <= 2; y++) for (let x = -1; x <= 1; x++) rd.putS(Math.floor(rd.cols / 2) + x, r + y, 32, -1e8);
    rd.putS(Math.floor(rd.cols / 2), r + 1 + bob, 0x2193, -1e9);
  }

  // Disolución pegada al borde superior del contenido: dithering que se vuelve
  // opaco (espacios del color del fondo) justo donde empieza la página.
  drawDissolve(contentRow) {
    const { rd } = this;
    const G = Math.max(8, Math.round(rd.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < rd.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < rd.cols; c++) {
        if (amount >= 1 || bayer(c, r) < amount) rd.putS(c, r, 32, -2e9);
      }
    }
  }
}
