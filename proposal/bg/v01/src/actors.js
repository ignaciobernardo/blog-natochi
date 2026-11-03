// Lo que se mueve en el tiempo: nubes, avión y pájaros en el cielo; humo de
// chimeneas; y en la esquina, el tránsito con semáforo (autos y colectivo por
// la avenida, autos que bajan por la calle D y doblan), ciclistas, peatones que
// cruzan por las cebras y gente que entra y sale del metro.
import { Layer, art } from './grid.js';
import { ST } from './city.js';
import { Rng } from './rng.js';
import { SPR } from './parts.js';

// ------------------------------------------------------------ sprites cocinados
// Se dibujan una vez con las primitivas de la proyección y se recortan: así los
// autos tienen el mismo ángulo que los edificios. El ancla es el origen del
// mundo (0, 0, 0) del dibujo.
function bake(fn) {
  const L = new Layer({ name: 'tmp', f: 1, zBase: 0, c0: -40, r0: -40, w: 120, h: 80 });
  fn(L);
  let cA = Infinity;
  let cB = -Infinity;
  let rA = Infinity;
  let rB = -Infinity;
  for (let r = 0; r < L.h; r++) {
    for (let c = 0; c < L.w; c++) {
      if (!L.chars[r * L.w + c]) continue;
      cA = Math.min(cA, c);
      cB = Math.max(cB, c);
      rA = Math.min(rA, r);
      rB = Math.max(rB, r);
    }
  }
  const w = cB - cA + 1;
  const h = rB - rA + 1;
  const cells = new Uint16Array(w * h);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) cells[r * w + c] = L.chars[(r + rA) * L.w + c + cA];
  return { w, h, cells, ax: L.c0 * -1 - cA, ay: L.r0 * -1 - rA };
}

// autos por la avenida, dibujados a mano sobre la caja de la proyección.
// R va a la derecha (se ve la cola a la izquierda), L va a la izquierda (faros).
// El ancla es la esquina trasera-izquierda-baja de la caja (x, d0, 0).
const R = String.raw;
// Vistos casi desde arriba, como los autos de la referencia: un paralelogramo
// con las ruedas `(0)` asomando, el techo al medio y las luces en las puntas.
// Ancla: esquina trasera-izquierda (x, d0, 0), abajo a la izquierda del dibujo.
const CAR_R = [
  // sedán
  art(
    R`
  _(0)________(0)_
  \'  \¯¯¯¯¯\    o\
   \'  \_____\    o\
    \_(0)________(0)\ `,
    4,
    4,
  ),
  // taxi
  art(
    R`
  _(0)________(0)_
  \'  \¯TAXI¯\   o\
   \'  \______\   o\
    \_(0)________(0)\ `,
    4,
    4,
  ),
  // descapotable: se ven los asientos
  art(
    R`
  _(0)________(0)_
  \'  ^  ^ \¯¯\  o\
   \'  ^  ^ \__\  o\
    \_(0)________(0)\ `,
    4,
    4,
  ),
  // camioneta con caja
  art(
    R`
  _(0)________(0)_
  \[:::::]\¯¯¯\  o\
   \[:::::]\___\  o\
    \_(0)________(0)\ `,
    4,
    4,
  ),
];
const CAR_L = [
  art(
    R`
  _(0)________(0)_
  \o    \¯¯¯¯¯\  '\
   \o    \_____\  '\
    \(0)________(0)_\ `,
    4,
    4,
  ),
  art(
    R`
  _(0)________(0)_
  \o    \¯TAXI¯\ '\
   \o    \______\ '\
    \(0)________(0)_\ `,
    4,
    4,
  ),
  art(
    R`
  _(0)________(0)_
  \o  \¯¯\ ^  ^  '\
   \o  \__\ ^  ^  '\
    \(0)________(0)_\ `,
    4,
    4,
  ),
  art(
    R`
  _(0)________(0)_
  \o  \¯¯¯\[:::::]\
   \o  \___\[:::::]\
    \(0)________(0)_\ `,
    4,
    4,
  ),
];
// de noche: faros y luces de cola
const nightCar = (s, ch) => {
  const cells = s.cells.slice();
  for (let i = 0; i < cells.length; i++) if (cells[i] === 111) cells[i] = ch.charCodeAt(0);
  return { ...s, cells };
};

// auto que baja por la calle D hacia nosotros: planta con ruedas `0)` y faros
const CAR_D = art(
  R`
   _____
   \'  '\
  0)\¯¯¯\\
    \\   \\
   0)\___\\
      \o  o\
       \____\ `,
  3,
  1,
);

// colectivo: caja larga con ventanillas `/o/` y número
function bus(night) {
  return bake((L) => {
    const len = 28;
    L.box(0, len, 0, 5, 0, 6, { top: (x, d, c) => (d === 2 && (x & 3) === 0 ? 61 : 0) });
    // ventanillas con pasajeros
    for (let x = 2; x + 3 < len - 1; x += 3) {
      L.winFront(x, 5, 3, 3, 2, 0, (dx, dh) => (dh === 1 && dx === 1 && (x * 7) % 5 < 3 ? 111 : 0));
    }
    // puertas
    L.winFront(len - 6, 5, 0, 3, 5, 0, () => 0);
    // franja
    L.ex(1, 5, 2, len - 2, 95);
    // ruedas
    for (const x of [4, len - 9]) {
      const c = x + 5;
      L.put(c - 1, 4, '(');
      L.put(c, 4, '0');
      L.put(c + 1, 4, '/');
    }
    // número de línea y faros en la cola (cara izquierda)
    L.put(0 + 2 + 4, 2 - 4 - 1, '2');
    L.put(0 + 2 + 4 + 1, 2 - 4 - 1 + 1, '1');
    L.put(0 + 1 + 1, 1 - 1 - 1, night ? '*' : 'o');
    L.put(0 + 4 + 1, 4 - 1 - 1, night ? '*' : 'o');
  });
}

// peatones (cuadro A y B de la caminata)
const WALK = [
  [art(' o\n/|\\\n/ \\', 1, 3), art(' o\n/|\\\n | ', 1, 3)],
  [art(' o\n(|\\\n/ \\', 1, 3), art(' o\n(|\\\n |\\', 1, 3)],
  [art(' o\n/|]\n/ \\', 1, 3), art(' o\n/|]\n | ', 1, 3)],
  [art(' °\n/#\\\n/ \\', 1, 3), art(' °\n/#\\\n | ', 1, 3)],
  [art(' o\n/|\\.\n/ \\ ;', 1, 3), art(' o\n/|\\.\n | ,;', 1, 3)], // con perro
];
const UMBRELLA = art(' _\n(_)\n o|\n/|\\\n/ \\', 1, 5);
const BIKE_R = [art('  _o\n _\\<_\n(_)/(_)', 1, 3), art('  _o\n _\\<_\n(_)\\(_)', 1, 3)];
const BIKE_L = [art('  o_\n _>/_\n(_)\\(_)', 1, 3), art('  o_\n _>/_\n(_)/(_)', 1, 3)];

const PLANE = art(
  `
     __
 ____\\ \\____________
<__o_o_o_o_o_o_o__.-'
       \\_\\`,
  0,
  4,
);
const BIRD = [art('v', 0, 1), art('-', 0, 1)];
const BIRD_BIG = [art('\\/', 0, 1), art('¯¯', 0, 1)];
const CLOUDS = [SPR.cloud0, SPR.cloud1, SPR.cloud2, SPR.cloud3];

// ciclo del semáforo (s): A = avenida en verde, B = calle D en verde
const CYCLE = 20;
function phaseAt(t) {
  const u = t % CYCLE;
  if (u < 10) return 'A';
  if (u < 11.5) return 'a'; // amarillo de la avenida
  if (u < 18.5) return 'B';
  return 'b';
}

// para el banco de piezas (lab/)
export function LAB_SPRITES(dark) {
  return [...CAR_R, ...CAR_L, CAR_D, bus(dark), ...WALK.flat(), UMBRELLA, ...BIKE_R, ...BIKE_L, PLANE];
}

export class Actors {
  constructor(city, env, seed) {
    this.city = city;
    this.env = env;
    this.rng = new Rng(seed * 31 + 5);
    const rng = this.rng;
    const { main, sky } = city.byName;
    this.main = main;
    this.sky = sky;
    const night = env.dark;
    this.spr = {
      carR: CAR_R.map((c) => (night ? nightCar(c, '*') : c)),
      carL: CAR_L.map((c) => (night ? nightCar(c, '○') : c)),
      carD: night ? nightCar(CAR_D, '○') : CAR_D,
      bus: bus(night),
    };
    // rango de x de la avenida que alguna vez se ve
    const { cols, rows, X0, Y0 } = env;
    this.xa = -X0 - Y0 - 2 * 16 - 40;
    this.xb = cols + rows - X0 - Y0 - 2 * 6 + 20;
    // autos por carril
    this.lanes = ST.lanes.map((l) => ({ ...l, cars: [] }));
    for (const lane of this.lanes) {
      for (let x = this.xa; x < this.xb; x += 30 + rng.next() * 40) {
        lane.cars.push(this.newCar(lane, x));
      }
      lane.target = lane.cars.length;
    }
    // colectivo en el carril 1
    const b = { x: this.xa + 10, len: 28, v: 0, v0: 9, bus: true, dwell: 0, served: false };
    this.lanes[0].cars.push(b);
    this.sortLanes();
    // autos que bajan por la calle D
    this.dcars = [];
    for (let d = -70; d < -10; d += 20 + rng.next() * 15) this.dcars.push({ d, v: 0, v0: 9 + rng.next() * 3, turn: rng.chance(0.5) ? 0 : 1 });
    // peatones
    this.walkers = [];
    for (let i = 0; i < 26; i++) this.walkers.push(this.newWalker(true));
    // ciclistas
    this.bikes = [];
    for (let i = 0; i < 3; i++) this.bikes.push({ x: this.xa + rng.next() * (this.xb - this.xa), d: i === 1 ? 16 : 7, dir: i === 1 ? -1 : 1, v0: 6 + rng.next() * 2, v: 6 });
    // cielo: nubes, avión, pájaros (coordenadas de la capa sky)
    this.clouds = [];
    const sc0 = sky.c0;
    const sw = sky.w;
    const top = -Y0 - Math.round(sky.f * env.S);
    for (let i = 0; i < Math.max(4, Math.round(cols / 22)); i++) {
      const k = Math.min(3, Math.floor(rng.next() * 4));
      this.clouds.push({ x: sc0 + rng.next() * sw, r: top + 3 + Math.round(rng.next() * rows * 0.55), s: CLOUDS[k], v: 0.6 + (3 - k) * 0.35 });
    }
    this.plane = { x: sc0 + sw, r: top + 4 + Math.round(rows * 0.08), v: -7 };
    this.flocks = [];
    for (let i = 0; i < 3; i++) {
      const n = 3 + Math.floor(rng.next() * 5);
      const birds = [];
      for (let j = 0; j < n; j++) birds.push({ dx: j * 3 + rng.next() * 2, dr: Math.round(Math.abs(j - n / 2) * 0.7 + rng.next()), ph: rng.next() });
      this.flocks.push({ x: sc0 + rng.next() * sw, r: top + 6 + Math.round(rng.next() * rows * 0.45), v: 4 + rng.next() * 3, birds, big: i === 0 });
    }
  }

  newCar(lane, x) {
    const rng = this.rng;
    return { x, len: 17, v: 0, v0: 10 + rng.next() * 6, kind: rng.next() < 0.5 ? 0 : Math.floor(1 + rng.next() * 3) };
  }

  // peatón: recorre la vereda, a veces cruza por la cebra o va al metro
  newWalker(initial) {
    const rng = this.rng;
    const side = rng.next() < 0.55 ? 0 : 1;
    const dir = rng.next() < 0.5 ? 1 : -1;
    const span = this.xb - this.xa;
    const x = initial ? this.xa + rng.next() * span : dir > 0 ? this.xa : this.xb;
    const d = side === 0 ? 1.5 + rng.next() * 2.5 : 18 + rng.next() * 2.5;
    const w = { x, d, h: 0, dir, v: 2.2 + rng.next() * 1.6, legs: [], kind: Math.floor(rng.next() * WALK.length), ph: rng.next(), clip: Infinity, gone: false, umbrella: rng.next() < 0.06 };
    const r = rng.next();
    if (r < 0.3) {
      // cruza la avenida por una cebra
      const zx = rng.next() < 0.5 ? 3 : 26;
      w.legs.push({ axis: 'x', to: zx });
      w.legs.push({ axis: 'd', to: side === 0 ? 19.5 : 2.5, wait: 'B' });
      w.legs.push({ axis: 'x', to: rng.next() < 0.5 ? this.xa - 5 : this.xb + 5 });
    } else if (r < 0.45 && side === 1) {
      // baja al metro
      const mx = (ST.metro.xa + ST.metro.xb) / 2 - 1 + rng.next() * 4;
      w.legs.push({ axis: 'x', to: mx });
      w.legs.push({ axis: 'd', to: ST.metro.da + 1 });
      w.legs.push({ axis: 'metro', to: ST.metro.db });
    } else {
      w.legs.push({ axis: 'x', to: dir > 0 ? this.xb + 5 : this.xa - 5 });
    }
    return w;
  }

  // gente que sale del metro
  newRider() {
    const rng = this.rng;
    const mx = (ST.metro.xa + ST.metro.xb) / 2 - 1 + rng.next() * 4;
    const w = { x: mx, d: ST.metro.db - 1, h: -6, dir: 1, v: 2.4, legs: [], kind: Math.floor(rng.next() * 4), ph: rng.next(), clip: ST.metro.db, gone: false };
    w.legs.push({ axis: 'up', to: ST.metro.da + 0.5 });
    w.legs.push({ axis: 'd', to: 19 + rng.next() * 2 });
    w.legs.push({ axis: 'x', to: rng.next() < 0.5 ? this.xa - 5 : this.xb + 5 });
    return w;
  }

  sortLanes() {
    for (const lane of this.lanes) lane.cars.sort((a, b) => (a.x - b.x) * lane.dir);
  }

  update(dt, t) {
    const ph = phaseAt(t);
    this.phase = ph;
    const greenX = ph === 'A';
    const greenD = ph === 'B';
    // ------------------------------------------------------------ avenida
    for (const lane of this.lanes) {
      const cars = lane.cars;
      const dir = lane.dir;
      // del de adelante hacia atrás
      for (let i = cars.length - 1; i >= 0; i--) {
        const car = cars[i];
        const front = dir > 0 ? car.x + car.len : car.x;
        let limit = Infinity; // distancia libre hacia adelante
        const ahead = cars[i + 1];
        if (ahead) {
          const back = dir > 0 ? ahead.x : ahead.x + ahead.len;
          limit = Math.min(limit, (back - front) * dir - 3);
        }
        // semáforo
        const stop = dir > 0 ? ST.stopX[0] : ST.stopX[1];
        const toStop = (stop - front) * dir;
        if (!greenX && toStop > -0.5) {
          const yellow = ph === 'a' && toStop < 3;
          if (!yellow) limit = Math.min(limit, toStop);
        }
        // parada del colectivo
        if (car.bus && dir > 0) {
          const stopAt = ST.busStop + 24;
          const toBus = stopAt - front;
          if (!car.served && toBus > -0.5 && toBus < 30) {
            limit = Math.min(limit, toBus);
            if (toBus < 0.3) {
              car.dwell += dt;
              if (car.dwell > 3.5) car.served = true;
            }
          }
        }
        const want = limit < 0.2 ? 0 : Math.min(car.v0, limit * 2.2);
        car.v += (want - car.v) * Math.min(1, dt * 3);
        if (car.v < 0.05 && limit < 0.2) car.v = 0;
        car.x += car.v * dt * dir;
      }
      // reciclar los que salieron
      for (let i = cars.length - 1; i >= 0; i--) {
        const car = cars[i];
        if ((dir > 0 && car.x > this.xb) || (dir < 0 && car.x + car.len < this.xa)) {
          cars.splice(i, 1);
          const entry = dir > 0 ? this.xa - car.len : this.xb;
          const first = cars[0];
          const free = !first || (dir > 0 ? first.x - entry > car.len + 6 : entry - (first.x + first.len) > 6);
          if (free) {
            if (car.bus) {
              car.x = entry;
              car.served = false;
              car.dwell = 0;
              cars.unshift(car);
            } else cars.unshift(this.newCar(lane, entry));
          } else if (car.bus) {
            car.x = entry - 40;
            car.served = false;
            car.dwell = 0;
            cars.unshift(car);
          }
        }
      }
    }
    // repone autos por la punta de entrada cuando faltan
    for (const lane of this.lanes) {
      const cars = lane.cars;
      if (cars.filter((c) => !c.bus).length >= lane.target) continue;
      const len = 17;
      const entry = lane.dir > 0 ? this.xa - len : this.xb;
      const first = cars[0];
      const free = !first || (lane.dir > 0 ? first.x - entry > len + 8 : entry - (first.x + first.len) > 8);
      if (free && this.rng.next() < dt * 0.8) cars.unshift(this.newCar(lane, entry));
    }
    // --------------------------------------------------------- calle D
    const dl = 8;
    this.dcars.sort((a, b) => a.d - b.d);
    for (let i = this.dcars.length - 1; i >= 0; i--) {
      const car = this.dcars[i];
      const front = car.d + dl;
      let limit = Infinity;
      const ahead = this.dcars[i + 1];
      if (ahead) limit = ahead.d - front - 3;
      const toStop = ST.stopD - front;
      const lane = this.lanes[car.turn];
      const x = car.turn === 0 ? ST.cross[0] + 6 : ST.cross[0];
      // solo cruza la línea con verde y con lugar en el carril al que dobla;
      // una vez adentro de la esquina, dobla sí o sí
      const room = !lane.cars.some((c) => c.x < x + 22 && c.x + c.len > x - 8);
      if ((!greenD || !room) && toStop > -0.5) limit = Math.min(limit, toStop);
      if (front >= lane.d1 - 0.3) {
        const nc = this.newCar(lane, x);
        nc.v = 4;
        lane.cars.push(nc);
        this.sortLanes();
        this.dcars.splice(i, 1);
        this.dcars.push({ d: -90 - this.rng.next() * 30, v: 0, v0: 9 + this.rng.next() * 3, turn: this.rng.chance(0.5) ? 0 : 1 });
        continue;
      }
      const want = limit < 0.2 ? 0 : Math.min(car.v0, limit * 2.2);
      car.v += (want - car.v) * Math.min(1, dt * 3);
      car.d += car.v * dt;
    }
    // ---------------------------------------------------------- ciclistas
    for (const b of this.bikes) {
      const stop = b.dir > 0 ? ST.stopX[0] - 4 : ST.stopX[1] + 1;
      const toStop = (stop - b.x) * b.dir;
      const want = !greenX && toStop > 0 && toStop < 6 ? 0 : b.v0;
      b.v += (want - b.v) * Math.min(1, dt * 3);
      b.x += b.v * dt * b.dir;
      if (b.dir > 0 && b.x > this.xb) b.x = this.xa;
      if (b.dir < 0 && b.x < this.xa) b.x = this.xb;
    }
    // ----------------------------------------------------------- peatones
    for (const w of this.walkers) {
      const leg = w.legs[0];
      if (!leg) {
        w.gone = true;
        continue;
      }
      let v = w.v;
      if (leg.axis === 'x') {
        const dir = Math.sign(leg.to - w.x) || 1;
        w.dir = dir;
        // la boca de la calle D se cruza con la avenida en verde
        if (w.d < ST.sw1[1] && !greenX) {
          const next = w.x + dir * 1.5;
          const inMouth = (x) => x > ST.cross[0] - 1 && x < ST.cross[1] + 1;
          if (!inMouth(w.x) && inMouth(next)) v = 0;
        }
        w.x += dir * v * dt;
        if ((leg.to - w.x) * dir <= 0) {
          w.x = leg.to;
          w.legs.shift();
        }
      } else if (leg.axis === 'd') {
        if (leg.wait && !(ph === leg.wait) && Math.abs(w.d - (w.d < 10 ? 2.5 : 19.5)) < 3) {
          // espera en el cordón
          w.waiting = true;
          continue;
        }
        w.waiting = false;
        const dir = Math.sign(leg.to - w.d) || 1;
        w.d += dir * v * 0.8 * dt;
        if ((leg.to - w.d) * dir <= 0) {
          w.d = leg.to;
          w.legs.shift();
        }
      } else if (leg.axis === 'metro') {
        // baja: avanza en D y se hunde en H, recortado por el borde del hueco
        w.clip = ST.metro.db;
        w.d += v * 0.6 * dt;
        w.h = -(w.d - ST.metro.da - 1) * 1.1;
        if (w.d >= leg.to) w.legs.shift();
      } else if (leg.axis === 'up') {
        w.d -= v * 0.6 * dt;
        w.h = Math.min(0, -(w.d - ST.metro.da - 1) * 1.1);
        if (w.d <= leg.to) {
          w.h = 0;
          w.clip = Infinity;
          w.legs.shift();
        }
      }
    }
    for (let i = 0; i < this.walkers.length; i++) {
      if (this.walkers[i].gone) this.walkers[i] = this.rng.next() < 0.18 ? this.newRider() : this.newWalker(false);
    }
    // ---------------------------------------------------------------- cielo
    const sky = this.sky;
    const wrap = (x, w) => {
      const a = sky.c0 - 30;
      const b = sky.c0 + sky.w + 10;
      if (x > b) return a;
      if (x + w < a) return b;
      return x;
    };
    for (const c of this.clouds) c.x = wrap(c.x + c.v * dt, c.s.w);
    this.plane.x = wrap(this.plane.x + this.plane.v * dt, PLANE.w + 40);
    for (const f of this.flocks) f.x = wrap(f.x + f.v * dt, 30);
  }

  draw(sc, t) {
    const { main, sky } = this;
    const night = this.env.dark;
    // ------------------------------------------------------------- cielo
    for (const c of this.clouds) sc.sprite(sky, Math.round(c.x), c.r, c.s, 1);
    const pl = this.plane;
    sc.sprite(sky, Math.round(pl.x), pl.r, PLANE, 2);
    // estela
    for (let i = 0; i < 26; i += 3) sc.sprite(sky, Math.round(pl.x) + PLANE.w + 1 + i, pl.r - 2, BIRD[1], 2);
    if (night && Math.floor(t * 1.5) % 2 === 0) sc.sprite(sky, Math.round(pl.x) + 3, pl.r - 3, art('*'), 3);
    for (const f of this.flocks) {
      for (const b of f.birds) {
        const k = Math.floor(t * (f.big ? 3 : 4) + b.ph * 2) & 1;
        const s = f.big ? BIRD_BIG[k] : BIRD[k];
        sc.sprite(sky, Math.round(f.x + b.dx), f.r + b.dr, s, 3);
      }
    }
    // --------------------------------------------- humo y emisores de capas
    for (const L of this.city.layers) {
      if (!L.emitters) continue;
      for (const e of L.emitters) this.emitter(sc, L, e, t, night);
    }
    // ------------------------------------------------------------ calle
    // solo si la calle está cerca de la pantalla
    const streetRow = 0 - main.vr; // fila de pantalla del suelo en d = 0
    if (streetRow > sc.rows + 30) return;
    const sp = this.spr;
    for (const lane of this.lanes) {
      for (const car of lane.cars) {
        const s = car.bus ? sp.bus : lane.dir > 0 ? sp.carR[car.kind] : sp.carL[car.kind];
        const d0 = car.bus ? lane.d0 - 1 : lane.d0 + 1;
        sc.sprite(main, Math.round(car.x) + d0, d0, s, lane.d1 + 0.2);
      }
    }
    for (const car of this.dcars) {
      const x = ST.cross[0] + 5;
      const d = Math.round(car.d);
      sc.sprite(main, x + d, d, sp.carD, d + 8.2);
    }
    for (const b of this.bikes) {
      const s = (b.dir > 0 ? BIKE_R : BIKE_L)[Math.floor(t * 5) & 1];
      const x = Math.round(b.x);
      const d = Math.round(b.d);
      sc.sprite(main, x + d, d, s, b.d + 0.3);
    }
    for (const w of this.walkers) {
      if (w.gone) continue;
      const frames = WALK[w.kind];
      const moving = !w.waiting;
      const k = moving ? Math.floor(t * 4 + w.ph * 2) & 1 : 1;
      const s = w.umbrella ? UMBRELLA : frames[k];
      const x = Math.round(w.x);
      const d = Math.round(w.d);
      const h = Math.round(w.h);
      sc.sprite(main, x + d + h, d - h, s, w.d + 0.5, w.clip === Infinity ? Infinity : w.clip);
    }
  }

  // humo, luces del semáforo, faroles de noche
  emitter(sc, L, e, t, night) {
    const c = e.x + e.d + e.h;
    const r = e.d - e.h;
    if (!sc.visible(L, c, r, 14, 14)) return;
    const z = L.zBase - e.near - 0.2;
    if (e.kind === 'smoke') {
      // bocanadas que suben en H y se corren con el viento
      const n = e.small ? 3 : 5;
      for (let k = 0; k < n; k++) {
        const age = (t * 1.6 + k * (6 / n) + (e.x % 7)) % 6;
        const hh = Math.floor(age * 1.3);
        const dx = Math.floor(age * 0.9 + Math.sin(t * 0.7 + k) * 0.6);
        const ch = age < 2 ? 126 : age < 4 ? (e.small ? 46 : 126) : age < 5 ? 45 : 46;
        const cc = c + hh + dx - L.vc;
        const rr = r - hh - 1 - L.vr;
        sc.put(cc, rr, ch, z);
        if (!e.small && age < 3.5) sc.put(cc + 1, rr, 126, z);
      }
    } else if (e.kind === 'signal') {
      // dos luces: arriba la de la avenida, abajo la de la calle D
      const ph = this.phase || 'A';
      const top = ph === 'A' ? '●' : ph === 'a' ? 'Ø' : 'o';
      const bot = ph === 'B' ? '●' : ph === 'b' ? 'Ø' : 'o';
      sc.put(c + 3 - L.vc, r - 6 - L.vr, top.charCodeAt(0), z - 0.5);
      sc.put(c + 3 - L.vc, r - 5 - L.vr, bot.charCodeAt(0), z - 0.5);
    } else if (e.kind === 'crane') {
      // carro que va y viene por la pluma, cable en H y una viga colgada
      const cc = e.c - L.vc;
      const rr = e.r - L.vr;
      if (cc + e.J < -5 || cc - 20 > sc.cols || rr < -20 || rr - 5 > sc.rows) return;
      const u = Math.round(e.J * (0.5 + 0.38 * Math.sin(t * 0.23)));
      const len = 3 + Math.round(2.5 * (1 + Math.sin(t * 0.37 + 1)));
      const zc = z - 1;
      sc.put(cc + u, rr + 1, 61, zc); // carro =
      for (let i = 1; i <= len; i++) sc.put(cc + u - i + 1, rr + 1 + i, 47, zc);
      const hc = cc + u - len;
      const hr = rr + 2 + len;
      sc.put(hc, hr, 74, zc); // gancho J
      const beam = '[▒▒▒▒]';
      for (let i = 0; i < beam.length; i++) sc.put(hc - 3 + i, hr + 1, beam.charCodeAt(i), zc);
    } else if (e.kind === 'fountain') {
      // chorro que sube y cae en gotas
      const cc = c - L.vc;
      const rr = r - L.vr;
      const k = Math.floor(t * 6);
      for (let i = 0; i < 3; i++) sc.put(cc, rr - 1 - i, i === 2 ? (k & 1 ? 39 : 46) : 124, z - 1);
      for (let i = 0; i < 4; i++) {
        const ph = (k + i * 2) % 6;
        sc.put(cc - 1 - (ph >> 1), rr - 3 + (ph >> 1), ph & 1 ? 46 : 39, z - 1);
        sc.put(cc + 1 + (ph >> 1), rr - 3 + (ph >> 1), ph & 1 ? 46 : 96, z - 1);
      }
    } else if (e.kind === 'lamp' && night) {
      // halo del farol
      const hc = c + 6 - L.vc;
      const hr = r - 7 - L.vr;
      const tw = Math.floor(t * 3 + e.x) % 7 === 0;
      sc.put(hc - 1, hr + 1, 46, z + 50);
      sc.put(hc + 1, hr + 1, tw ? 32 : 46, z + 50);
      sc.put(hc, hr + 2, 58, z + 50);
      sc.put(hc - 2, hr + 2, 46, z + 50);
      sc.put(hc + 2, hr + 2, 46, z + 50);
    }
  }
}
