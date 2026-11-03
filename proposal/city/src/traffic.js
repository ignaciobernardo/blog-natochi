// Todo lo que anda solo: autos en la calle de abajo y en la calle media,
// gente en la vereda, botes en el río y, de vez en cuando, el tren que pasa
// en sentido contrario.
//
// Los autos dan la vuelta a lo largo de toda la tira (posición = x0 + v·t
// módulo el largo), así el tráfico es infinito y determinista.
import { SP, mirror, sprite } from './grid.js';
import { CARS, MOTO, CICLISTA, WALK, PEOPLE, MID_CARS, MID_WALK } from './art.js';
import { L, M, RIVER } from './world.js';
import { hash2 } from './rng.js';

const STREET_F = 1.2;
const R = String.raw;

const BOATS = [
  sprite(R`
    |\
    | \
 ___|__\_
 \______/`),
  sprite(R`
  _|_
 \___/`),
  sprite(R`
 \_/`),
];

export class Traffic {
  constructor(rng) {
    this.W = Math.ceil(L * STREET_F + 2 * M + 200);
    // carriles: A (lejano, hacia la izquierda), B (cercano, hacia la derecha)
    const lane = (n, v, dir, row) => {
      const cars = [];
      for (let i = 0; i < n; i++) {
        let s = rng.next() < 0.1 ? MOTO : CARS[rng.int(0, CARS.length - (dir < 0 ? 2 : 1))];
        if (rng.next() < 0.06) s = CICLISTA[0];
        cars.push({ x0: (i / n) * this.W + rng.range(0, this.W / n - 16), s: dir < 0 ? mirror(s) : s });
      }
      return { cars, v: v * dir, row };
    };
    this.lanes = [lane(40, 11, -1, 3), lane(36, 14, 1, 5)];
    // gente en la vereda cercana
    const NW = Math.ceil(L + 2 * M + 60);
    this.NW = NW;
    this.walkers = [];
    for (let i = 0; i < 70; i++) {
      const dir = rng.next() < 0.5 ? -1 : 1;
      const r = rng.next();
      const fr = r < 0.6 ? WALK : r < 0.75 ? PEOPLE.bolsa : r < 0.85 ? PEOPLE.perro : r < 0.93 ? PEOPLE.nino : PEOPLE.paraguas;
      this.walkers.push({
        x0: rng.range(0, NW),
        v: dir * rng.range(1.6, 3.2),
        frames: dir < 0 ? fr.map(mirror) : fr,
        ph: rng.range(0, 10),
      });
    }
    // calle media
    this.MW = Math.ceil(L * 0.5 + 2 * M + 60);
    this.midCars = [];
    for (let i = 0; i < 26; i++) {
      const dir = i % 2 ? 1 : -1;
      const s = MID_CARS[rng.int(0, MID_CARS.length - 1)];
      this.midCars.push({ x0: rng.range(0, this.MW), v: dir * rng.range(3, 6), s: dir < 0 ? mirror(s) : s, row: dir < 0 ? 0 : 1 });
    }
    this.midWalkers = [];
    for (let i = 0; i < 40; i++) {
      const dir = rng.next() < 0.5 ? -1 : 1;
      this.midWalkers.push({ x0: rng.range(0, this.MW), v: dir * rng.range(0.6, 1.3), ph: rng.range(0, 5) });
    }
    // el tren de enfrente: cada cierto tiempo
    this.train = [0, 1, 2, 3].map((k) => this.wagonPeople(rng, k));
    this.boats = [
      { u: 0.3, f: 0.9, s: BOATS[0], v: 0.02 },
      { u: 0.6, f: 0.62, s: BOATS[1], v: -0.015 },
      { u: 0.45, f: 0.4, s: BOATS[2], v: 0.01 },
    ];
  }

  // calzada y autos de la calle de abajo (f 1.2)
  draw(scene, t) {
    const { rd, S, cx } = scene;
    const off = Math.round(scene.camX * STREET_F) + M - cx;
    const cols = rd.cols;
    const data = rd.data;
    // cruces peatonales: donde las calles transversales cortan esta calle
    const zebra = [];
    for (const [a, b] of scene.streets) {
      const xa = Math.round(cx + (a - scene.camX) * STREET_F) + 1;
      const xb = Math.round(cx + (b - scene.camX) * STREET_F) - 1;
      if (xb >= 0 && xa < cols) zebra.push([xa, xb]);
    }
    for (let r = S + 1; r <= S + 5 && r < rd.rows; r++) {
      const k = r - S;
      for (let c = 0; c < cols; c++) {
        const lx = c + off;
        let ch = SP;
        if (k === 3 && lx % 9 < 4) ch = 45; // -
        else {
          const h = hash2(lx, r);
          if (h < 0.025) ch = 46; // .
          else if (k === 5 && h < 0.032) ch = 111; // o (tapa)
          else if (k === 2 && h > 0.996) ch = 126; // ~ (charco)
        }
        data[r * cols + c] = ch;
      }
      for (const [xa, xb] of zebra) {
        for (let c = Math.max(0, xa); c <= Math.min(cols - 1, xb); c++) data[r * cols + c] = k % 2 ? 61 : SP;
      }
    }
    // marcas pintadas junto a los cruces
    for (const [xa, xb] of zebra) {
      if (xa - 7 >= 0) rd.text(xa - 7, S + 5, 'PARE ');
      if (xb + 3 < cols) rd.text(xb + 3, S + 2, ' ←  ');
    }
    // autos
    for (const ln of this.lanes) {
      for (const car of ln.cars) {
        let x = (car.x0 + ln.v * t) % this.W;
        if (x < 0) x += this.W;
        const sx = Math.round(x - off);
        if (sx > cols || sx + car.s.w < 0) continue;
        rd.blit(car.s, sx, S + ln.row - car.s.h + 1);
      }
    }
  }

  drawSidewalk(scene, off, y0, t) {
    const { rd, S } = scene;
    const cols = rd.cols;
    for (const w of this.walkers) {
      let x = (w.x0 + w.v * t) % this.NW;
      if (x < 0) x += this.NW;
      const wx = x - M;
      if (wx > RIVER[0] - 8 && wx < RIVER[1] + 8) continue;
      const sx = Math.round(x - off);
      if (sx > cols || sx < -8) continue;
      const fr = w.frames[Math.floor(t * Math.abs(w.v) * 1.3 + w.ph) % w.frames.length];
      rd.blit(fr, sx, S - fr.h + 1);
    }
    void y0;
  }

  drawMid(scene, off, y0, t) {
    const { rd } = scene;
    const ly = scene.mid;
    const base = ly.baseRow + y0; // vereda media en pantalla
    const cols = rd.cols;
    for (const c of this.midCars) {
      let x = (c.x0 + c.v * t) % this.MW;
      if (x < 0) x += this.MW;
      const sx = Math.round(x - off);
      if (sx > cols || sx + c.s.w < 0) continue;
      rd.blit(c.s, sx, base + c.row + 1 - c.s.h + 1);
    }
    for (const w of this.midWalkers) {
      let x = (w.x0 + w.v * t) % this.MW;
      if (x < 0) x += this.MW;
      const sx = Math.round(x - off);
      if (sx > cols || sx < -2) continue;
      const fr = MID_WALK[Math.floor(t * 2 + w.ph) % 2];
      rd.blit(fr, sx, base - 1);
    }
  }

  drawBoats(scene, t) {
    const { rd, cx, E } = scene;
    for (const b of this.boats) {
      const u = (((b.u + b.v * t) % 1) + 1) % 1;
      const x = RIVER[0] + 18 + u * (RIVER[1] - RIVER[0] - 36);
      const sx = Math.round(cx + (x - scene.camX) * b.f - b.s.w / 2);
      const sy = Math.round(E + 16 * b.f) - b.s.h + (Math.sin(t * 2 + b.u * 9) > 0.6 ? 1 : 0);
      rd.blit(b.s, sx, sy);
    }
  }

  // pasajeros de cada vagón: [ventana, columna, tipo]
  wagonPeople(rng) {
    const out = [];
    for (let w = 0; w < 5; w++) {
      const n = rng.int(0, 3);
      for (let k = 0; k < n; k++) out.push([w, rng.int(1, 10), rng.int(0, 5)]);
    }
    return out;
  }

  // El tren de enfrente: pasa pegado a la ventana (es lo más cercano de
  // todo), cada 34 s, a 170 columnas por segundo. Se dibuja entero en cada
  // cuadro porque su largo depende del alto de la pantalla.
  drawTrain(scene, t) {
    const T0 = 9;
    const period = 34;
    if (t < T0) return;
    const { rd, E } = scene;
    const ph = (t - T0) % period;
    const k = Math.floor((t - T0) / period);
    const WW = 98; // largo de un vagón
    const N = 3;
    const x0 = Math.round(rd.cols + 12 - ph * 170);
    if (x0 + N * (WW + 2) < -10) return;
    const top = E - 6;
    const rows = rd.rows;
    // cabina (va adelante, a la izquierda)
    this.cab(rd, x0 - 14, top, rows);
    for (let i = 0; i < N; i++) {
      const wx = x0 + i * (WW + 2);
      if (wx > rd.cols || wx + WW < 0) continue;
      this.wagon(rd, wx, top, WW, rows, this.train[(i + k) % this.train.length], i === N - 1);
      // fuelle entre vagones
      for (let r = top + 2; r < rows; r++) rd.text(wx + WW, r, r % 2 ? '))' : '((');
    }
  }

  wagon(rd, x, top, W, rows, people, last) {
    const x1 = x + W - 1;
    for (let r = top; r < rows; r++) for (let c = Math.max(0, x); c <= Math.min(rd.cols - 1, x1); c++) rd.put(c, r, ' ');
    rd.hline(x + 1, x1 - 1, top, '_');
    for (let r = top + 1; r < rows; r++) {
      rd.put(x, r, '|');
      rd.put(x1, r, '|');
    }
    // techo redondeado
    rd.put(x, top + 1, '/');
    rd.put(x1, top + 1, '\\');
    rd.hline(x + 1, x1 - 1, top + 1, '¯');
    // ventanas y puertas
    const wy = top + 3;
    let c = x + 3;
    let w = 0;
    while (c < x1 - 16) {
      if (w === 2) {
        // puerta doble
        rd.text(c, wy - 1, ' ______ ');
        for (let r = wy; r < rows - 4; r++) rd.text(c, r, '|  ||  |');
        rd.text(c + 1, wy + 2, '[]||[]');
        c += 11;
        w++;
        continue;
      }
      rd.hline(c + 1, c + 14, wy - 1, '_');
      for (let r = wy; r < wy + 6; r++) {
        rd.put(c, r, '|');
        rd.put(c + 15, r, '|');
      }
      rd.hline(c + 1, c + 14, wy + 5, '_');
      // asientos
      rd.text(c + 2, wy + 4, '[__]');
      rd.text(c + 10, wy + 4, '[__]');
      // pasajeros
      for (const [pw, pc, kind] of people) {
        if (pw !== w) continue;
        const px = c + pc;
        const fig = PASSENGERS[kind];
        for (let i = 0; i < fig.length; i++) rd.ink(px, wy + 1 + i, fig[i]);
      }
      // reflejo
      rd.put(c + 12, wy + 1, '/');
      rd.put(c + 11, wy + 2, '/');
      c += 18;
      w++;
    }
    // franja, número y rejillas
    for (let r = wy + 8; r <= wy + 9 && r < rows; r++) rd.hline(x + 1, x1 - 1, r, '=');
    if (wy + 11 < rows - 4) {
      rd.text(x + 4, wy + 11, `N° ${2000 + ((W * 7 + (people.length * 131)) % 900)}`);
      rd.text(x1 - 16, wy + 11, '[|||||]  [|||||]');
    }
    // panel bajo con puntos
    for (let r = wy + 12; r < rows - 4; r++) for (let q = x + 2; q < x1 - 1; q++) if ((q + r) % 4 === 0) rd.put(q, r, '.');
    // borde inferior y bogies abajo de todo
    rd.hline(x + 1, x1 - 1, rows - 4, '_');
    for (const bx of [x + 8, x1 - 22]) {
      rd.text(bx, rows - 3, ' ___________ ');
      rd.text(bx, rows - 2, '(O)_______(O)');
      rd.text(bx, rows - 1, "'¯'       '¯'");
    }
    void last;
  }

  cab(rd, x, top, rows) {
    for (let r = top; r < rows; r++) {
      const k = r - top;
      const slope = Math.max(0, 8 - k * 2);
      for (let c = x + slope; c < x + 16; c++) rd.put(c, r, ' ');
      if (k === 0) rd.hline(x + slope, x + 15, r, '_');
      else if (k < 5) rd.text(x + slope, r, '_/');
      else rd.put(x, r, '|');
    }
    rd.text(x + 3, top + 5, '.---.');
    rd.text(x + 2, top + 6, '|  o |');
    rd.text(x + 2, top + 7, "'----'");
    rd.text(x + 3, top + 11, '(o)');
    rd.text(x + 1, top + 13, 'L1');
  }
}

const PASSENGERS = [
  [' \\o', '  |\\', '  |'],
  ['  o', ' /|\\', '  |'],
  ['  o', ' /|]', '  |'],
  ['  o_', ' /|[]', '  |'],
  [' o o', '/|\\|\\', ' | |'],
  ['  o', ' (|\\', '  |'],
];
