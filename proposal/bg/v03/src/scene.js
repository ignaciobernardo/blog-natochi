// La escena: Santiago en capas de fachadas, con la técnica de of.domains.
//
// Cada capa es un dibujo en alzado (de frente, sin perspectiva) que vive a una
// profundidad z. La cámara es una grúa que baja con el scroll: la base de una
// capa queda en la fila  horizonte + C/z,  donde C es la altura de la cámara.
// Así lo lejano casi no se mueve y lo cercano sube rápido (parallax 1/z). Los
// glifos nunca se escalan: lo lejano se dibuja chico a mano.
//
//   z 16   cielo: sol o luna, nubes, pájaros
//   z 9    la cordillera nevada
//   z 6    la precordillera
//   z 4.5  el cerro con el teleférico
//   z 3.4  el skyline: la torre de vidrio, la torre de la antena
//   z 2    bloques de departamentos y oficinas
//   z 1    la cuadra de enfrente: balcones, aires acondicionados, locales
//   z <1   la calle: postes y cables, quiosco, micros, autos, gente, perros
//
// El suelo entre capas es un "fragment shader" por fila: z = C / (fila - horizonte).
import { clamp, lerp, bayer } from './grid.js';
import { Rng, hash2 } from './rng.js';
import { buildAndes, buildFoothills } from './andes.js';
import { Sky } from './sky.js';
import { buildSkyline, buildCerro } from './skyline.js';
import { buildWall } from './wall.js';
import { buildBlocks } from './blocks.js';
import { buildPoles, buildSidewalk, buildNearProps, drawGround, Traffic, Z } from './street.js';

// filas de calle que quedan a la vista al final (vereda, calzada, vereda)
const STREET = 11;

export class Scene {
  constructor(scr, { seed = 7, title = 'NATOCHI', night = false } = {}) {
    this.scr = scr;
    this.rd = scr; // las herramientas leen rd.cols / rd.rows
    this.title = title;
    this.night = night;
    this.t = 0;
    this.p = 0;
    this.look = [0, 0];
    this.show = {};
    this.seed = seed;
    this.extra = -1;
    this.resize();
  }

  // Arma todas las capas. `extra` agrega pisos a los edificios altos de la
  // cuadra en pantallas muy altas, para que al final la fachada llene la vista.
  build(extra) {
    const { night } = this;
    const show = this.show;
    const rng = new Rng(this.seed);
    this.layers = [];
    const sky = new Sky(rng.fork(), night);
    this.add('sky', 16, { draw: (scr, ox, oy, t) => sky.draw(scr, this, t) });
    this.add('andes', 9, { cv: buildAndes(rng.fork(), { night }) });
    this.add('foothills', 6, { cv: buildFoothills(rng.fork(), { night }) });
    this.add('birds', 6.5, { draw: (scr, ox, oy, t) => sky.drawBirds(scr, this, t) });
    const cerro = buildCerro(rng.fork());
    this.add('cerro', 4.6, { cv: cerro.cv, draw: (scr, ox, oy, t) => this.drawCable(scr, ox, oy, t, cerro) });
    const sk = buildSkyline(rng.fork());
    this.add('skyline', 3.4, { cv: sk.cv, draw: (scr, ox, oy, t) => this.drawLights(scr, ox, oy, t, sk) });
    const bl = buildBlocks(rng.fork());
    this.add('blocks', 2, { cv: bl.cv, draw: (scr, ox, oy, t) => this.drawBlocksLife(scr, ox, oy, t, bl) });
    const wall = buildWall(rng.fork(), { extra });
    this.add('wall', 1, { cv: wall.cv, draw: (scr, ox, oy, t) => this.drawWallLife(scr, ox, oy, t, wall) });
    this.add('ground', 12, { draw: (scr) => drawGround(scr, this) });
    const side = buildSidewalk(rng.fork(), wall.cv.w);
    this.add('sidewalk', Z.props, { cv: side.cv, draw: (scr, ox, oy, t) => this.drawSidewalkLife(scr, ox, oy, t, side) });
    const poles = buildPoles(rng.fork(), wall.cv.w);
    this.add('poles', Z.poles, { cv: poles.cv, draw: (scr, ox, oy, t) => this.drawPerches(scr, ox, oy, t, poles) });
    const traffic = new Traffic(rng.fork());
    for (const k of ['walkersFar', 'laneFar', 'laneMid', 'laneNear', 'walkersNear']) {
      this.add(k, Z[k === 'walkersFar' ? 'walkers' : k], { draw: (scr, ox, oy, t) => traffic.draw(scr, this, t, k) });
    }
    this.add('nearProps', Z.propsNear, { cv: buildNearProps(rng.fork(), wall.cv.w).cv });
    this.layers.sort((a, b) => b.z - a.z);
    for (const l of this.layers) if (!(l.name in show)) show[l.name] = true;
    this.nearH = wall.cv.h;
  }

  add(name, z, opts) {
    this.layers.push({ name, z, lift: 0, ...opts });
  }

  resize() {
    const { cols, rows } = this.scr;
    // en pantallas altas la calle ocupa un poco más
    const street = Math.max(STREET, Math.round(rows * 0.2));
    const extra = Math.max(0, Math.ceil((rows - street - 44) / 6));
    if (extra !== this.extra) {
      this.extra = extra;
      this.build(extra);
    }
    this.cx = cols / 2;
    this.hr = Math.round(rows * 0.6);
    this.C1 = rows - this.hr - street;
    this.C0 = rows - this.hr + this.nearH + 3;
  }

  // fila de pantalla de la base de una capa a profundidad z
  baseRow(z, lift = 0) {
    return Math.floor(this.hr + (this.C - lift) / z);
  }

  // columna de pantalla del centro de una capa
  centerCol(z) {
    return Math.floor(this.cx - this.camX / z);
  }

  frame(input) {
    const { scr } = this;
    const dt = clamp(input.dt, 0, 0.1);
    if (!input.reduced) this.t += dt;
    const t = this.t;
    const ease = 1 - Math.exp(-dt * 5);
    this.p += (clamp(input.progress, 0, 1) - this.p) * ease;
    this.look[0] += (input.look[0] - this.look[0]) * ease * 0.4;
    // la grúa termina de bajar un poco antes del final: el último tramo del
    // scroll es la disolución hacia el contenido
    const cp = clamp(this.p / 0.94, 0, 1);
    this.C = lerp(this.C0, this.C1, cp);
    this.camX = this.look[0] * 10;

    scr.clear();
    for (const l of this.layers) {
      if (!this.show[l.name]) continue;
      const base = this.baseRow(l.z, l.lift);
      const ox = this.centerCol(l.z) - (l.cv ? Math.floor(l.cv.w / 2) : 0);
      const oy = l.cv ? base - l.cv.h + 1 : base;
      if (l.cv) scr.blit(l.cv, ox, oy);
      l.draw?.(scr, ox, oy, t, this);
    }
    this.drawTitle();
    if (input.progress < 0.02) this.drawHint(1 - input.progress / 0.02);
    if (input.contentTop != null) this.drawDissolve(input.contentTop / scr.cellH);
    scr.flush();
  }

  // cabinas del teleférico: dos que suben y bajan colgadas del cable
  drawCable(scr, ox, oy, t, { cv, cable }) {
    const { a, b, sag, cabin } = cable;
    for (let i = 0; i < 3; i++) {
      let u = (t * 0.025 + i / 3) % 1;
      const x = a[0] + (b[0] - a[0]) * u;
      const y = a[1] + (b[1] - a[1]) * u + sag * 4 * u * (1 - u);
      scr.stampWrap(cabin, ox + x - 1, oy + Math.floor(y) + 1, cv.w);
    }
  }

  // balizas que parpadean y, de noche, ventanas que se prenden y apagan
  drawLights(scr, ox, oy, t, { cv, windows, beacons }) {
    const W = cv.w;
    const blink = t % 1.6 < 0.35;
    for (const [x, y] of beacons) scr.putWrap(ox + x, oy + y, blink ? 42 : 46, W);
    if (!this.night) return;
    for (let i = 0; i < windows.length; i++) {
      const [x, y, len] = windows[i];
      const h = hash2(x, y);
      // cada ventana cambia de estado cada tanto, a su ritmo
      const on = hash2(i, Math.floor(t / (6 + h * 20) + h * 9)) < 0.38;
      if (!on) continue;
      for (let k = 0; k < len; k++) scr.putWrap(ox + x + k, oy + y, 9618, W);
    }
  }

  // la vida de la cuadra: luces, neón, goteras, ropa al viento, humo
  drawWallLife(scr, ox, oy, t, L) {
    const W = L.cv.w;
    const cv = L.cv;
    const blink = t % 1.6 < 0.35;
    for (const [x, y] of L.beacons) scr.putWrap(ox + x, oy + y, blink ? 42 : 46, W);
    // neón: algunos letreros tienen una letra que falla y a veces se apagan
    // un instante; las estrellas del letrero vertical corren
    for (let i = 0; i < L.neons.length; i++) {
      const n = L.neons[i];
      if (n.kind === 'vertical') {
        const [sx, sy, len] = n.stars;
        const k = Math.floor(t * 5) % len;
        for (let j = 0; j < len; j++) {
          const on = j === k || j === (k + Math.floor(len / 2)) % len;
          scr.putWrap(ox + sx, oy + sy + j * 2, on ? 42 : 46, W);
          scr.putWrap(ox + sx + 2, oy + sy + j * 2, on ? 42 : 46, W);
        }
        continue;
      }
      if (!n.flick) continue;
      const bad = Math.floor(hash2(i, 7) * n.text.length);
      if (n.text[bad] !== ' ' && hash2(i, Math.floor(t * 9)) < 0.45) scr.putWrap(ox + n.x + bad, oy + n.y, 32, W);
      if (hash2(i + 99, Math.floor(t * 4)) < 0.03) for (let k = 0; k < n.text.length; k++) scr.putWrap(ox + n.x + k, oy + n.y, 32, W);
    }
    // goteras de los aires acondicionados
    for (const [x, y, ph] of L.drips) {
      const u = (t * 0.5 + ph) % 3;
      if (u < 1.2) scr.putWrap(ox + x, oy + y + Math.floor(u * 3), u < 0.3 ? 39 : 46, W);
    }
    // ropa tendida que flamea con las rachas
    const SWAP = { T: 'Y', n: 'h', A: '^', j: 'J', Y: 'T', '[]': '[)' };
    for (let i = 0; i < L.laundry.length; i++) {
      const [x, y, it] = L.laundry[i];
      if (Math.sin(t * 2.3 + i * 1.7) + Math.sin(t * 0.7) > 1.1) scr.textWrap(ox + x, oy + y, SWAP[it] || it, W);
    }
    // humo de las parrillas
    for (const [x, y] of L.smoke) {
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.8 + k / 3) % 1;
        const yy = oy + y - Math.floor(u * 4);
        scr.putWrap(ox + x + Math.round(Math.sin(t * 2 + k) * 1 + u * 2), yy, u < 0.5 ? 126 : 39, W);
      }
    }
    if (!this.night) return;
    // guirnaldas de ampolletas en los balcones
    for (const [x, y, w] of L.garlands) {
      for (let k = 0; k < w; k += 2) scr.putWrap(ox + x + k, oy + y, Math.sin(t * 3 + k * 1.7 + x) > 0 ? 42 : 176, W);
    }
    // ventanas encendidas: el vidrio se ilumina, los detalles quedan de silueta
    for (let i = 0; i < L.windows.length; i++) {
      const [x, y, w, h] = L.windows[i];
      const hh = hash2(x, y);
      if (hash2(i, Math.floor(t / (8 + hh * 25) + hh * 9)) > 0.42) continue;
      for (let j = 0; j < h; j++) {
        for (let k = 0; k < w; k++) if (cv.get(x + k, y + j) === 32) scr.putWrap(ox + x + k, oy + y + j, 9618, W);
      }
    }
    for (const [x, y, w] of L.shopLights) {
      for (let k = 0; k < w; k++) if (cv.get(x + k, y) === 32) scr.putWrap(ox + x + k, oy + y, 9617, W);
    }
  }

  // la grúa de la obra, balizas y, de noche, ventanas encendidas
  drawBlocksLife(scr, ox, oy, t, L) {
    const W = L.cv.w;
    const cv = L.cv;
    const blink = (t + 0.7) % 1.6 < 0.35;
    for (const [x, y] of L.beacons) scr.putWrap(ox + x, oy + y, blink ? 42 : 46, W);
    if (L.crane) {
      const { x0, x1, y, hookMax } = L.crane;
      // el carro va y viene por la pluma; el gancho baja y sube
      const u = 0.5 - 0.5 * Math.cos(t * 0.13);
      const cx = Math.round(x0 + (x1 - x0) * u);
      const len = 2 + Math.round((hookMax - 3) * (0.5 - 0.5 * Math.cos(t * 0.31)));
      scr.textWrap(ox + cx - 1, oy + y, '[=]', W);
      for (let j = 1; j < len; j++) scr.putWrap(ox + cx, oy + y + j, 124, W);
      scr.putWrap(ox + cx, oy + y + len, 74, W);
      if (Math.sin(t * 0.13) > 0) scr.textWrap(ox + cx - 2, oy + y + len + 1, '[###]', W);
    }
    if (!this.night) return;
    for (let i = 0; i < L.windows.length; i++) {
      const [x, y, w] = L.windows[i];
      for (let k = 0; k < w; k++) {
        const c = cv.get(x + k, y);
        if (c !== 91 && c !== 93 && c !== 175 && c !== 32) continue;
        const g = Math.floor((x + k) / 3);
        const hh = hash2(g, y);
        if (hash2(g * 3 + y, Math.floor(t / (10 + hh * 30) + hh * 7)) < 0.4) scr.putWrap(ox + x + k, oy + y, 9618, W);
      }
    }
  }

  // vapor del carrito y, de noche, la luz de los faroles
  drawSidewalkLife(scr, ox, oy, t, L) {
    const W = L.cv.w;
    for (const [x, y] of L.steam) {
      for (let k = 0; k < 4; k++) {
        const u = (t * 0.6 + k / 4) % 1;
        scr.putWrap(ox + x + Math.round(Math.sin(t * 1.5 + k * 2) + u * 2), oy + y - Math.floor(u * 5), u < 0.5 ? 126 : 39, W);
      }
    }
    if (!this.night) return;
    for (const [x, y] of L.lamps) {
      scr.putWrap(ox + x, oy + y + 1, 42, W);
      for (let j = 2; j < 10; j++) {
        const half = Math.floor(j / 2);
        scr.putWrap(ox + x - half, oy + y + j, 47, W);
        scr.putWrap(ox + x + half, oy + y + j, 92, W);
      }
    }
  }

  // pájaros posados en los cables; de vez en cuando se van volando y vuelven
  drawPerches(scr, ox, oy, t, P) {
    const W = P.cv.w;
    for (let i = 0; i < P.perches.length; i++) {
      const [x, y] = P.perches[i];
      const cycle = 14 + hash2(i, 3) * 20;
      const u = (t + hash2(i, 5) * 40) % cycle;
      if (u < cycle - 3) scr.putWrap(ox + x, oy + y, 111, W);
      else {
        const k = u - (cycle - 3);
        scr.putWrap(ox + x + Math.round(k * 6), oy + y - Math.round(k * 3), Math.floor(t * 8) % 2 ? 118 : 45, W);
      }
    }
  }

  // Título fijo al centro, como el OPENFIELD de of.domains: texto plano en una
  // fila con un espacio opaco a cada lado; tapa lo que pasa por detrás.
  drawTitle() {
    const { scr } = this;
    const w = this.title.length;
    const r = Math.floor(scr.rows / 2);
    const c = Math.floor(scr.cols / 2 - w / 2);
    scr.text(c - 1, r, ' ' + this.title + ' ');
  }

  // Pista al inicio: "desliza" y una flecha que baja; se apaga al scrollear.
  drawHint(alpha) {
    const { scr } = this;
    if (alpha < 0.3) return;
    const text = ' desliza ';
    const r = scr.rows - 4;
    const c = Math.floor(scr.cols / 2 - text.length / 2);
    const bob = Math.floor(this.t * 2) % 2;
    scr.text(c, r, text);
    scr.fill(Math.floor(scr.cols / 2) - 1, r + 1, 3, 2, ' ');
    scr.put(scr.cols / 2, r + 1 + bob, '↓');
  }

  // Disolución pegada al borde superior del contenido: dithering que se vuelve
  // opaco (espacios del color del fondo) justo donde empieza la página.
  drawDissolve(contentRow) {
    const { scr } = this;
    const G = Math.max(8, Math.round(scr.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < scr.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < scr.cols; c++) if (amount >= 1 || bayer(c, r) < amount) scr.put(c, r, ' ');
    }
  }
}
