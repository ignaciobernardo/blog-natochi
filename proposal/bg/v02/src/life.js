// La vida de la calle, que es la protagonista:
//
//   semáforos con ciclo propio en cada cruce (onda verde hacia el sur),
//   autos y micros que frenan ante la roja, hacen fila y arrancan,
//   micros que paran en el paradero (sube y baja gente),
//   autos en las transversales,
//   gente que camina por las veredas, espera en la esquina y cruza las cebras,
//   ciclistas por la ciclovía, perros con su dueño,
//   carritos con vapor, y palomas que se espantan cuando alguien pasa.
//
// Todo vive en coordenadas del mundo; se simula el paseo entero (es barato)
// y se dibuja solo lo que cae en la ventana.

import { stamp } from './iso.js';
import { Face } from './face.js';
import * as SP from './sprites.js';
import { X, STREET, POS } from './layout.js';
import { Rng } from './rng.js';

// --- semáforos ----------------------------------------------------------------
export const CYCLE = 24;
// fase de un cruce en [0, CYCLE): avenida verde [0, 11), amarilla [11, 13);
// transversal verde [14, 21), amarilla [21, 23). Los peatones cruzan la
// avenida con la transversal y la transversal con la avenida.
const phaseOf = (S, t) => (((t + S * 0.21) % CYCLE) + CYCLE) % CYCLE;
const avLight = (k) => (k < 11 ? 'G' : k < 13 ? 'Y' : 'R');
const xLight = (k) => (k >= 14 && k < 21 ? 'G' : k >= 21 && k < 23 ? 'Y' : 'R');
const walkAcross = (k) => k >= 14 && k < 20; // cruzar la avenida
const walkAlong = (k) => k >= 0 && k < 9; //    cruzar la transversal

const AV_LANES = [
  { x: POS.lanes[0], dir: 1, bus: true },
  { x: POS.lanes[1], dir: 1 },
  { x: POS.lanes[2], dir: -1 },
  { x: POS.lanes[3], dir: -1, bus: true },
];
const KINDS = ['auto', 'auto', 'auto', 'hatch', 'hatch', 'taxi', 'furgon', 'camion'];
const LEN = { auto: 7, hatch: 6, taxi: 7, furgon: 8, camion: 8, micro: 12 };
const XKINDS = ['auto', 'auto', 'sedan', 'furgon', 'moto', 'micro'];
const XLEN = { auto: 5, sedan: 6.5, furgon: 5.5, moto: 3, micro: 9 };

// carriles de las veredas: [x, dir]
const WALK_W = [
  [POS.walkS, 1],
  [POS.walkN, -1],
];
const WALK_E = [
  [POS.walkES, 1],
  [POS.walkEN, -1],
];

export class Life {
  constructor(world, seed, { dark = false, y0 = -110, y1 = 410 } = {}) {
    this.world = world;
    this.dark = dark;
    this.rng = new Rng(seed * 31 + 7);
    this.y0 = y0;
    this.y1 = y1;
    this.t = 0;
    this.streets = world.layout.streets.filter((s) => s > y0 - 20 && s < y1 + 20);
    this.cars = [];
    this.xcars = [];
    this.people = [];
    this.bikes = [];
    this.pigeons = [];
    this.spr = {};
    this.initSprites();
    this.initTraffic();
    this.initPeople();
    this.initPigeons();
    this.initStrays();
  }

  initSprites() {
    const s = this.spr;
    for (const k of Object.keys(LEN)) {
      if (k === 'micro') continue;
      s[`${k}+`] = SP.carY(k, 1);
      s[`${k}-`] = SP.carY(k, -1);
    }
    s['micro+'] = SP.busY(1, '210');
    s['micro-'] = SP.busY(-1, '405');
    for (const k of Object.keys(XLEN)) if (k !== 'micro') s[`x${k}`] = SP.carX(k, 1);
    s['xmicro+'] = SP.busX(1);
    s['xmicro-'] = SP.busX(-1);
  }

  // --- tráfico ----------------------------------------------------------------
  initTraffic() {
    const { rng } = this;
    const span = this.y1 - this.y0;
    for (const lane of AV_LANES) {
      let s = this.y0 + rng.range(0, 10);
      while (s < this.y1 - 8) {
        const bus = lane.bus && rng.chance(0.18);
        const kind = bus ? 'micro' : rng.pick(KINDS);
        const len = LEN[kind];
        const pos = lane.dir > 0 ? s + len : this.y1 - (s - this.y0) - len;
        this.cars.push({ lane, kind, len, pos, v: 0, vmax: bus ? 6 : rng.range(7, 10), dwell: 0, served: -1e9 });
        s += len + rng.range(4, 16);
      }
    }
    void span;
    for (const S of this.streets) {
      for (const [dy, dir] of [
        [4.5, -1],
        [7.5, 1],
      ]) {
        let x = -120 + rng.range(0, 20);
        while (x < 120) {
          const kind = rng.pick(XKINDS);
          const len = XLEN[kind];
          this.xcars.push({ S, y: S + dy, dir, kind, len, pos: dir > 0 ? x + len : x, v: 0, vmax: rng.range(5, 8) });
          x += len + rng.range(10, 40);
        }
      }
    }
    // ciclistas
    for (const [x, dir] of [
      [POS.bikeS, 1],
      [POS.bikeN, -1],
    ]) {
      let y = this.y0 + rng.range(0, 20);
      while (y < this.y1) {
        this.bikes.push({ x, dir, pos: y, v: 0, vmax: rng.range(3, 4.5), ph: rng.next() });
        y += rng.range(25, 60);
      }
    }
  }

  // próxima transversal hacia adelante desde una posición en y
  nextStreet(pos, dir) {
    const st = this.streets;
    if (dir > 0) {
      for (const S of st) if (S - 3 >= pos - 0.6) return S;
    } else {
      for (let i = st.length - 1; i >= 0; i--) if (st[i] + STREET + 3 <= pos + 0.6) return st[i];
    }
    return null;
  }

  updateTraffic(dt) {
    const { t } = this;
    const span = this.y1 - this.y0;
    for (const lane of AV_LANES) {
      const list = this.cars.filter((c) => c.lane === lane);
      // orden por avance (s = dir · pos)
      list.sort((a, b) => lane.dir * a.pos - lane.dir * b.pos);
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        const s = lane.dir * c.pos;
        const lead = list[(i + 1) % list.length];
        let gap = lane.dir * lead.pos - lead.len - s;
        if (i === list.length - 1) gap += span;
        let room = gap - 1.5;
        // semáforo
        const S = this.nextStreet(c.pos, lane.dir);
        if (S !== null) {
          const line = lane.dir > 0 ? S - 3 : S + STREET + 3;
          const d = lane.dir * (line - c.pos);
          if (d < 30) {
            const L = avLight(phaseOf(S, t));
            if (L === 'R' || (L === 'Y' && d > 2.5)) room = Math.min(room, d);
          }
        }
        // paradero
        if (c.kind === 'micro' && lane.dir > 0) {
          if (c.dwell > 0) {
            c.dwell -= dt;
            room = 0;
            if (c.dwell <= 0) c.dwell = 0;
          } else {
            for (const b of this.world.busStops) {
              const at = b.y1 + 2;
              const d = at - c.pos;
              if (d > -0.5 && d < 20 && c.served !== b.y0) {
                room = Math.min(room, d);
                if (d < 0.4 && c.v < 0.6) {
                  c.dwell = 4.5;
                  c.served = b.y0;
                  this.busArrived(b, c);
                }
              }
            }
          }
        }
        const vdes = Math.max(0, Math.min(c.vmax, room * 1.4));
        const dv = vdes - c.v;
        c.v += Math.max(-14 * dt, Math.min(4 * dt, dv));
        if (c.v < 0) c.v = 0;
        c.pos += lane.dir * c.v * dt;
        // vuelta al principio del paseo
        if (lane.dir > 0 && c.pos - c.len > this.y1) c.pos -= span;
        if (lane.dir < 0 && c.pos + c.len < this.y0) c.pos += span;
      }
    }
    // transversales
    for (const S of this.streets) {
      for (const dir of [-1, 1]) {
        const list = this.xcars.filter((c) => c.S === S && c.dir === dir);
        list.sort((a, b) => dir * a.pos - dir * b.pos);
        for (let i = 0; i < list.length; i++) {
          const c = list[i];
          const lead = list[(i + 1) % list.length];
          let gap = dir * lead.pos - lead.len - dir * c.pos;
          if (i === list.length - 1) gap += 240;
          let room = gap - 1.5;
          const line = dir > 0 ? X.lotW - 1 : X.lotE + 1;
          const d = dir * (line - c.pos);
          if (d > -0.5 && d < 25) {
            const L = xLight(phaseOf(S, t));
            if (L === 'R' || (L === 'Y' && d > 2)) room = Math.min(room, d);
          }
          const vdes = Math.max(0, Math.min(c.vmax, room * 1.3));
          c.v += Math.max(-12 * dt, Math.min(4 * dt, vdes - c.v));
          if (c.v < 0) c.v = 0;
          c.pos += dir * c.v * dt;
          if (dir > 0 && c.pos - c.len > 120) c.pos -= 240;
          if (dir < 0 && c.pos + c.len < -120) c.pos += 240;
        }
      }
    }
    // ciclistas: respetan la luz de la avenida
    for (const b of this.bikes) {
      let room = 99;
      const S = this.nextStreet(b.pos, b.dir);
      if (S !== null) {
        const line = b.dir > 0 ? S + 1 : S + STREET - 1;
        const d = b.dir * (line - b.pos);
        if (d > -0.3 && d < 10) {
          const L = avLight(phaseOf(S, t));
          if (L !== 'G') room = d;
        }
      }
      const vdes = Math.max(0, Math.min(b.vmax, room * 1.5));
      b.v += Math.max(-8 * dt, Math.min(2 * dt, vdes - b.v));
      b.pos += b.dir * b.v * dt;
      b.ph += b.v * dt * 0.6;
      if (b.dir > 0 && b.pos > this.y1) b.pos -= span;
      if (b.dir < 0 && b.pos < this.y0) b.pos += span;
    }
  }

  // --- gente ------------------------------------------------------------------
  newWalker(side, y, dir) {
    const { rng } = this;
    const lanes = side === 'W' ? WALK_W : WALK_E;
    const [x] = lanes.find((l) => l[1] === dir) || lanes[0];
    const p = {
      x,
      y,
      dir,
      side,
      speed: rng.range(1.0, 1.7),
      look: rng.int(0, SP.PEOPLE.walk.length - 1),
      mode: 'walk',
      ph: rng.next(),
      cool: 0,
      dog: rng.chance(0.08) ? { ph: rng.next() } : null,
      umbrella: rng.chance(0.05),
      kid: rng.chance(0.08),
    };
    this.people.push(p);
    return p;
  }

  initPeople() {
    const { rng } = this;
    for (let y = this.y0; y < this.y1; y += rng.range(2.5, 5.5)) {
      const side = rng.chance(0.55) ? 'W' : 'E';
      this.newWalker(side, y, rng.chance(0.5) ? 1 : -1);
    }
    // gente esperando en los paraderos
    for (const b of this.world.busStops) {
      const n = rng.int(2, 4);
      for (let i = 0; i < n; i++) this.addWaiting(b, i);
    }
    // gente en las veredas de las transversales (va y vuelve a lo largo de x)
    this.xwalk = [];
    for (const S of this.streets) {
      for (const [dy, x0, x1] of [
        [1.5, -70, X.lotW - 1],
        [10.5, -70, X.lotW - 1],
        [1.5, X.lotE + 1, 70],
        [10.5, X.lotE + 1, 70],
      ]) {
        const n = rng.int(1, 3);
        for (let i = 0; i < n; i++) {
          this.xwalk.push({ y: S + dy + rng.range(-0.4, 0.4), x: rng.range(x0, x1), x0, x1, dir: rng.chance(0.5) ? 1 : -1, speed: rng.range(0.9, 1.5), look: rng.int(0, 3), ph: rng.next() });
        }
      }
    }
    // vendedores
    for (const v of this.world.vendors) {
      this.people.push({ x: v.x - 1.2, y: v.y + 1, dir: 1, mode: 'vendor', look: rng.int(0, 3), ph: rng.next(), cart: v });
    }
  }

  addWaiting(b, i) {
    const { rng } = this;
    const sit = i === 0 && rng.chance(0.6);
    this.people.push({
      x: sit ? POS.stop + 0.4 : rng.pick([POS.stop + 1.1, POS.stop + 1.4]),
      y: b.y0 + 1.5 + rng.range(0, b.y1 - b.y0 - 2.5),
      dir: rng.chance(0.5) ? 1 : -1,
      mode: sit ? 'sit' : 'stop',
      look: rng.int(0, SP.PEOPLE.stand.length - 1),
      stop: b,
      ph: rng.next(),
    });
  }

  busArrived(b, bus) {
    // suben los que esperan; bajan uno o dos
    for (const p of this.people) {
      if (p.stop === b && (p.mode === 'stop' || (p.mode === 'sit' && this.rng.chance(0.5)))) {
        p.mode = 'board';
        p.tx = X.curbW;
        p.ty = bus.pos - 4.5;
      }
    }
    const n = this.rng.int(1, 2);
    for (let i = 0; i < n; i++) {
      const w = this.newWalker('W', bus.pos - 4 - i, this.rng.chance(0.5) ? 1 : -1);
      w.x = X.curbW - 0.2;
      w.mode = 'toLane';
      w.tx = this.rng.pick([POS.walkS, POS.walkN]);
      w.dir = w.tx === POS.walkS ? 1 : -1;
      w.delay = 0.6 + i * 0.7;
    }
  }

  updatePeople(dt) {
    const { t, rng } = this;
    for (const w of this.xwalk) {
      w.ph += dt;
      w.x += w.dir * w.speed * dt;
      if (w.x > w.x1) w.dir = -1;
      if (w.x < w.x0) w.dir = 1;
    }
    const span = this.y1 - this.y0;
    const out = [];
    for (const p of this.people) {
      p.ph += dt;
      if (p.delay > 0) {
        p.delay -= dt;
        out.push(p);
        continue;
      }
      switch (p.mode) {
        case 'walk': {
          const ny = p.y + p.dir * p.speed * dt;
          // ¿llega a una transversal?
          for (const S of this.streets) {
            const curb = p.dir > 0 ? S + 2.6 : S + STREET - 2.6;
            if ((p.dir > 0 && p.y < curb && ny >= curb) || (p.dir < 0 && p.y > curb && ny <= curb)) {
              if (rng.chance(0.45)) {
                // cruzar la avenida por la cebra
                p.mode = 'toCurb';
                p.ty = p.dir > 0 ? S + 1.5 : S + STREET - 1.5;
                p.tx = p.side === 'W' ? X.curbW - 0.6 : X.curbE + 0.6;
                p.S = S;
              } else {
                p.mode = 'ywait';
                p.S = S;
              }
              break;
            }
          }
          if (p.mode === 'walk') {
            p.y = ny;
            // pasar al paradero
            if (p.side === 'W' && p.cool <= 0) {
              for (const b of this.world.busStops) {
                if (p.y > b.y0 + 1 && p.y < b.y1 - 1 && rng.chance(dt * 0.25)) {
                  p.mode = 'toStop';
                  p.stop = b;
                  p.tx = rng.pick([POS.stop + 1.1, POS.stop + 1.4]);
                }
              }
            }
            p.cool -= dt;
          }
          if (p.y > this.y1) p.y -= span;
          if (p.y < this.y0) p.y += span;
          break;
        }
        case 'ywait': {
          if (walkAlong(phaseOf(p.S, t))) p.mode = 'walk';
          // se mueve un poquito para salir de la línea de espera
          if (p.mode === 'walk') p.y += p.dir * 0.05;
          break;
        }
        case 'toCurb': {
          // primero a la línea de la cebra, después hacia la solera
          if (Math.abs(p.y - p.ty) > 0.05) {
            const dy = p.ty - p.y;
            p.y += Math.sign(dy) * Math.min(Math.abs(dy), p.speed * dt);
          } else {
            const dx = p.tx - p.x;
            if (Math.abs(dx) < 0.05) p.mode = 'xwait';
            else p.x += Math.sign(dx) * Math.min(Math.abs(dx), p.speed * dt);
          }
          break;
        }
        case 'xwait': {
          if (walkAcross(phaseOf(p.S, t))) {
            p.mode = 'cross';
            p.tx = p.side === 'W' ? X.curbE + 0.8 : X.curbW - 0.8;
          }
          break;
        }
        case 'cross': {
          const dx = p.tx - p.x;
          const sp = p.speed * 1.15;
          if (Math.abs(dx) < 0.05) {
            p.side = p.side === 'W' ? 'E' : 'W';
            p.dir = rng.chance(0.5) ? 1 : -1;
            const lanes = p.side === 'W' ? WALK_W : WALK_E;
            p.tx = lanes.find((l) => l[1] === p.dir)[0];
            p.mode = 'toLane';
          } else p.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
          break;
        }
        case 'toLane': {
          const dx = p.tx - p.x;
          if (Math.abs(dx) < 0.05) {
            p.mode = 'walk';
            p.cool = 6;
          } else p.x += Math.sign(dx) * Math.min(Math.abs(dx), p.speed * dt);
          break;
        }
        case 'toStop': {
          const dx = p.tx - p.x;
          if (Math.abs(dx) < 0.05) p.mode = 'stop';
          else p.x += Math.sign(dx) * Math.min(Math.abs(dx), p.speed * dt);
          break;
        }
        case 'board': {
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.2) {
            p.gone = true;
            break;
          }
          if (Math.abs(dy) > 0.1) p.y += Math.sign(dy) * Math.min(Math.abs(dy), 1.6 * dt);
          else p.x += Math.sign(dx) * Math.min(Math.abs(dx), 1.6 * dt);
          break;
        }
        default:
          break;
      }
      if (!p.gone) out.push(p);
    }
    // los que subieron vuelven a aparecer lejos (la población se mantiene)
    const gone = this.people.length - out.length;
    this.people = out;
    for (let i = 0; i < gone; i++) {
      const dir = rng.chance(0.5) ? 1 : -1;
      this.newWalker(rng.chance(0.5) ? 'W' : 'E', dir > 0 ? this.y0 + 1 : this.y1 - 1, dir);
    }
    // de vez en cuando llega alguien nuevo al paradero
    for (const b of this.world.busStops) {
      if (rng.chance(dt * 0.08)) {
        const n = this.people.filter((p) => p.stop === b && (p.mode === 'stop' || p.mode === 'sit')).length;
        if (n < 5) this.addWaiting(b, n);
      }
    }
  }

  // --- palomas -------------------------------------------------------------------
  // tras reconstruir la capa: las bandadas pueden haber cambiado
  sync() {
    this.pigeons = [];
    this.initPigeons();
    this.initStrays();
  }

  // perros sueltos en los parques y patos en las lagunas
  initStrays() {
    const { rng } = this;
    // paseantes de plaza y parque: van y vienen por su sendero
    this.strollers = [];
    for (const s of this.world.strolls) {
      for (let i = 0; i < s.n; i++) {
        this.strollers.push({ s, k: rng.range(s.a, s.b), dir: rng.chance(0.5) ? 1 : -1, speed: rng.range(0.6, 1.1), look: rng.int(0, 3), ph: rng.next(), stop: 0 });
      }
    }
    this.strays = this.world.dogs.map((d) => ({ d, x: (d.x0 + d.x1) / 2, y: (d.y0 + d.y1) / 2, tx: d.x0, ty: d.y0, wait: 0, ph: 0, face: 1 }));
    this.ducks = [];
    for (const p of this.world.ducks) {
      for (let i = 0; i < 3; i++) this.ducks.push({ p, k: rng.next() * 10, sp: rng.range(0.05, 0.12) });
    }
  }

  updateStrays(dt) {
    const { rng } = this;
    for (const p of this.strollers) {
      p.ph += dt;
      if (p.stop > 0) {
        p.stop -= dt;
        continue;
      }
      p.k += p.dir * p.speed * dt;
      if (p.k > p.s.b) p.dir = -1;
      if (p.k < p.s.a) p.dir = 1;
      if (rng.chance(dt * 0.05)) p.stop = rng.range(2, 5);
    }
    for (const g of this.strays) {
      g.ph += dt;
      if (g.wait > 0) {
        g.wait -= dt;
        continue;
      }
      const dx = g.tx - g.x;
      const dy = g.ty - g.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.2) {
        g.wait = rng.range(1.5, 4);
        g.tx = rng.range(g.d.x0, g.d.x1);
        g.ty = rng.range(g.d.y0, g.d.y1);
        continue;
      }
      const sp = 2.2;
      g.x += (dx / dist) * Math.min(dist, sp * dt);
      g.y += (dy / dist) * Math.min(dist, sp * dt);
      g.face = dy > 0 || (Math.abs(dy) < 0.1 && dx > 0) ? 1 : -1;
    }
  }

  initPigeons() {
    const { rng } = this;
    for (const f of this.world.flocks) {
      f.cool = 0;
      f.state = 'ground';
      for (let i = 0; i < f.n; i++) {
        const hx = f.x + rng.range(-1.2, 1.2);
        const hy = f.y + rng.range(-2, 2);
        this.pigeons.push({ f, hx, hy, x: hx, y: hy, z: 0, vx: 0, vy: 0, st: 'ground', ph: rng.next() * 3, face: rng.chance(0.5) ? 1 : -1, delay: 0 });
      }
    }
  }

  updatePigeons(dt) {
    const { rng } = this;
    for (const f of this.world.flocks) {
      f.cool -= dt;
      if (f.state !== 'ground' || f.cool > 0) continue;
      // ¿alguien se acerca?
      let scare = false;
      for (const p of this.people) {
        if (p.mode === 'vendor' || p.mode === 'sit' || p.mode === 'stop') continue;
        if (Math.abs(p.y - f.y) < 2.6 && Math.abs(p.x - f.x) < 1.8) {
          scare = true;
          break;
        }
      }
      if (!scare) {
        for (const b of this.bikes) if (Math.abs(b.pos - f.y) < 2.5 && Math.abs(b.x - f.x) < 2.2) scare = true;
        for (const g of this.strays) if (Math.abs(g.y - f.y) < 2.5 && Math.abs(g.x - f.x) < 2.5) scare = true;
        for (const p of this.strollers) {
          const x = p.s.axis === 'y' ? p.s.x : p.k;
          const y = p.s.axis === 'y' ? p.k : p.s.y;
          if (Math.abs(y - f.y) < 2 && Math.abs(x - f.x) < 1.6) scare = true;
        }
      }
      if (scare) {
        f.state = 'fly';
        f.t = 0;
        const away = rng.chance(0.5) ? 1 : -1;
        for (const g of this.pigeons) {
          if (g.f !== f) continue;
          g.st = 'fly';
          g.delay = rng.range(0, 0.35);
          g.vx = rng.range(-1.5, 2.5);
          g.vy = away * rng.range(1.5, 4);
          g.vz = rng.range(3.5, 5.5);
          g.face = g.vy > 0 ? 1 : -1;
        }
      }
    }
    for (const g of this.pigeons) {
      g.ph += dt;
      if (g.delay > 0) {
        g.delay -= dt;
        continue;
      }
      if (g.st === 'ground') {
        // pasitos y picotazos
        if (rng.chance(dt * 0.6)) {
          g.face = rng.chance(0.5) ? 1 : -1;
          g.y += g.face * 0.5;
          if (Math.abs(g.y - g.hy) > 2) g.y = g.hy;
        }
      } else if (g.st === 'fly') {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.z += g.vz * dt;
        g.vz *= 1 - 0.5 * dt;
        if (g.z > 9) g.vz = Math.min(g.vz, 0.5);
        g.f.t += dt / this.flockSize(g.f);
        if (g.f.t > 4.5) g.st = 'back';
      } else if (g.st === 'back') {
        // planea de vuelta a su lugar
        const k = Math.min(1, dt * 0.7);
        g.x += (g.hx - g.x) * k;
        g.y += (g.hy - g.y) * k;
        g.z += (0 - g.z) * k * 0.9;
        g.face = g.hy > g.y ? 1 : -1;
        if (Math.abs(g.x - g.hx) < 0.2 && Math.abs(g.y - g.hy) < 0.3 && g.z < 0.3) {
          g.st = 'ground';
          g.x = g.hx;
          g.y = g.hy;
          g.z = 0;
          const f = g.f;
          if (this.pigeons.every((o) => o.f !== f || o.st === 'ground')) {
            f.state = 'ground';
            f.cool = rng.range(5, 10);
          }
        }
      }
    }
  }

  flockSize(f) {
    return f.n;
  }

  update(dt, cy) {
    this.t += dt;
    this.updateTraffic(dt);
    this.updatePeople(dt);
    this.updatePigeons(dt);
    this.updateStrays(dt);
    void cy;
  }

  // --- dibujo ------------------------------------------------------------------
  draw(rd, time, cy) {
    const { t } = this;
    const ya = cy - rd.rows - 10;
    const yb = cy + rd.rows + 20;
    const vis = (y) => y > ya && y < yb;
    // semáforos
    for (const sig of this.world.signals) {
      if (!vis(sig.S)) continue;
      const k = phaseOf(sig.S, t);
      for (const h of sig.heads) {
        const L = h.axis === 'av' ? avLight(k) : xLight(k);
        drawHead(rd, h, L);
      }
    }
    // autos de la avenida
    for (const c of this.cars) {
      const yc = c.pos - c.lane.dir * (c.kind === 'micro' ? c.len : c.len / 2);
      if (!vis(yc)) continue;
      const s = this.spr[`${c.kind}${c.lane.dir > 0 ? '+' : '-'}`];
      if (this.dark) {
        // haces de los focos sobre el pavimento
        for (let k = 1; k <= 4; k++) {
          const yy = c.pos + c.lane.dir * k;
          for (const dx of [-0.75, 0.75]) {
            const x = c.lane.x + dx * (1 + k * 0.15);
            rd.putBlank(Math.round(2 * x + yy), Math.round(yy) - 1, k < 3 ? 58 : 46, x - yy + 1.3);
          }
        }
      }
      if (c.kind === 'micro') stamp(rd, s, c.lane.x - 1.5, c.lane.dir > 0 ? c.pos - 11 : c.pos, 0, -0.5);
      else stamp(rd, s, c.lane.x, Math.round(yc), 0, -0.5);
    }
    for (const c of this.xcars) {
      if (!vis(c.y)) continue;
      if (c.kind === 'micro') {
        // la caja va de x a x + 9 desde su cola
        const x0 = c.dir > 0 ? c.pos - c.len : c.pos;
        stamp(rd, this.spr[c.dir > 0 ? 'xmicro+' : 'xmicro-'], x0, c.y - 1, 0, -0.5);
        continue;
      }
      const s = this.spr[`x${c.kind}`];
      stamp(rd, s, c.pos - (c.dir * c.len) / 2, c.y + 1, 0, -0.5, c.dir < 0);
    }
    // ciclistas
    for (const b of this.bikes) {
      if (!vis(b.pos)) continue;
      const fr = SP.BIKE[Math.floor(b.ph * 4) % 2];
      stamp(rd, fr, b.x, b.pos, 0, -0.8, b.dir < 0);
    }
    // gente
    for (const w of this.xwalk) {
      if (!vis(w.y)) continue;
      stamp(rd, SP.PEOPLE.walk[w.look][Math.floor(w.ph * 4.5) % 2], w.x, w.y, 0, -1, w.dir < 0);
    }
    for (const p of this.people) {
      if (!vis(p.y)) continue;
      drawPerson(rd, p, t);
    }
    // carritos con vapor
    for (const v of this.world.vendors) {
      if (!vis(v.y)) continue;
      stamp(rd, SP.CARTS[v.kind], v.x, v.y + 1, 0, -0.8);
      if (v.kind !== 'helados') drawSteam(rd, v.x + 0.5, v.y + 1, 4, t, 3);
    }
    // palomas
    for (const g of this.pigeons) {
      if (!vis(g.y)) continue;
      let fr;
      if (g.st === 'ground') {
        const peck = (Math.floor(g.ph * 1.7) % 4) === 0;
        fr = peck ? SP.PIGEON.ground[1] : g.face > 0 ? SP.PIGEON.ground[0] : SP.PIGEON.ground[2];
      } else fr = SP.PIGEON.fly[Math.floor(g.ph * 7) % 2];
      stamp(rd, fr, g.x, g.y, g.z, -1);
    }
    // gente quieta: músico, globero, niños, lectores
    for (const p of this.world.benchSitters) {
      if (!vis(p.y)) continue;
      drawIdler(rd, p, t);
    }
    // bandadas que dan vueltas alto
    for (const b of this.world.birds) {
      if (!vis(b.y - b.z)) continue;
      for (let i = 0; i < b.n; i++) {
        const a = t * b.sp + (i / b.n) * Math.PI * 2 + Math.sin(t * 0.3 + i) * 0.4;
        const fr = Math.floor(t * 6 + i * 1.7) % 3 === 0 ? '^' : 'v';
        putW(rd, b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r * 0.8, b.z + Math.sin(t + i) * 0.6, fr, -40);
      }
    }
    for (const p of this.world.idlers) {
      if (!vis(p.y)) continue;
      drawIdler(rd, p, t);
    }
    for (const p of this.strollers) {
      const x = p.s.axis === 'y' ? p.s.x : p.k;
      const y = p.s.axis === 'y' ? p.k : p.s.y;
      if (!vis(y)) continue;
      const fr = p.stop > 0 ? SP.PEOPLE.stand[p.look] : SP.PEOPLE.walk[p.look][Math.floor(p.ph * 4) % 2];
      stamp(rd, fr, x, y, 0, -1, p.dir < 0);
    }
    // perros sueltos y patos
    for (const g of this.strays) {
      if (!vis(g.y)) continue;
      const fr = g.wait > 0 ? SP.DOG[2] : SP.DOG[Math.floor(g.ph * 6) % 2];
      stamp(rd, fr, g.x, g.y, 0, -1, g.face < 0);
    }
    for (const d of this.ducks) {
      const { p } = d;
      const k = t * d.sp + d.k;
      const x = p.x0 + ((Math.sin(k * 1.3) + 1) / 2) * (p.x1 - p.x0);
      const y = p.y0 + ((Math.sin(k * 0.7 + 2) + 1) / 2) * (p.y1 - p.y0);
      if (!vis(y)) continue;
      const dirx = Math.cos(k * 1.3);
      putW(rd, x, y, 0, dirx > 0 ? ')>' : '<(', -0.9);
      putW(rd, x + (dirx > 0 ? -1 : 1), y, 0, '~', -0.8);
    }
    // detalles animados de los edificios y la plaza
    for (const a of this.world.anims) {
      const ay = a.y ?? a.y0;
      if (!vis(ay)) continue;
      drawAnim(rd, a, t, this.dark);
    }
    void time;
  }
}

// --- dibujantes --------------------------------------------------------------------

const LIT = 0x25d9; // ◙
const OFF = 0x25cb; // ○
function drawHead(rd, h, L) {
  const F = new Face('F', h.y);
  const u = h.x;
  const v0 = h.z - 3;
  F.seg(rd, u, v0, 'v', 3, '/', -1.5);
  F.seg(rd, u + 1, v0, 'v', 3, '/', -1.5);
  F.seg(rd, u, h.z, 'u', 1, '_', -1.5);
  F.at(rd, u + 0.5, v0 + 2.5, L === 'R' ? LIT : OFF, -1.6);
  F.at(rd, u + 0.5, v0 + 1.5, L === 'Y' ? LIT : OFF, -1.6);
  F.at(rd, u + 0.5, v0 + 0.5, L === 'G' ? LIT : OFF, -1.6);
}

function drawPerson(rd, p, t) {
  const W = SP.PEOPLE;
  let s;
  let flip = false;
  const moving = p.mode === 'walk' || p.mode === 'cross' || p.mode === 'toCurb' || p.mode === 'toLane' || p.mode === 'toStop' || p.mode === 'board';
  const step = Math.floor(p.ph * 4.5) % 2;
  if (p.mode === 'sit') s = W.sit[p.look % W.sit.length];
  else if (p.mode === 'vendor') s = W.stand[(Math.floor(p.ph / 1.7) % 2) * 1 + 2];
  else if (p.kid) s = W.kid[moving ? step : 0];
  else if (p.umbrella) s = W.umbrella[moving ? step : 0];
  else if (moving) s = W.walk[p.look % W.walk.length][step];
  else s = W.stand[p.look % W.stand.length];
  // mirando hacia donde va
  if (p.mode === 'cross' || p.mode === 'toLane' || p.mode === 'toStop' || p.mode === 'board' || (p.mode === 'toCurb' && Math.abs(p.y - p.ty) < 0.05)) {
    flip = p.tx < p.x;
  } else flip = p.dir < 0;
  stamp(rd, s, p.x, p.y, 0, -1, flip);
  if (p.dog) {
    const fr = SP.DOG[moving ? step : 2];
    const off = p.mode === 'cross' ? 0 : 1.6 * p.dir;
    stamp(rd, fr, p.x + (p.mode === 'cross' ? Math.sign(p.tx - p.x) * 1.5 : 1), p.y + off, 0, -1, flip);
  }
  void t;
}

// vapor: tres tildes que suben y se corren
function drawSteam(rd, x, y, z, t, n) {
  for (let i = 0; i < n; i++) {
    const k = (t * 0.9 + i / n) % 1;
    const zz = z + k * 3.5;
    const xx = x + Math.sin((t + i) * 1.7) * 0.25;
    const C = Math.round(2 * xx + y + zz);
    const R = Math.round(y - zz);
    rd.put(C, R, k < 0.7 ? 126 : 46, xx - y - zz - 2);
  }
}

// texto horizontal en un punto del mundo
function putW(rd, x, y, z, str, bias = -1) {
  const C = Math.round(2 * x + y + z);
  const R = Math.round(y - z);
  for (let i = 0; i < str.length; i++) rd.put(C + i, R - 1, str.charCodeAt(i), x - y - z + bias);
}

const MUSICIAN = [sprite_([' o', '/|8', '/ \\']), sprite_([' o', '(|8', ' |\\'])];
const BALLOONS = sprite_([' \\|/', '  o', ' /|', ' / \\'], 2);
function sprite_(rows, ax = 1) {
  return SP.person(rows, ax);
}

function drawIdler(rd, p, t) {
  const W = SP.PEOPLE;
  const ph = t + Math.abs(p.x * 7 + p.y * 3) * 0.13;
  if (p.kind === 'stand') {
    const s = W.stand[(p.look + (Math.floor(ph / 2.3) % 3 === 0 ? 1 : 0)) % W.stand.length];
    stamp(rd, s, p.x, p.y, 0, -1, Math.floor(ph / 3.1) % 2 === 1);
  } else if (p.kind === 'sit') {
    stamp(rd, W.sit[p.look % W.sit.length], p.x, p.y, 0, -1);
  } else if (p.kind === 'kid') {
    // salta
    const up = Math.floor(ph * 3) % 4 === 0 ? 1 : 0;
    stamp(rd, W.kid[(p.look + up) % 2], p.x, p.y, up * 0.6, -1);
  } else if (p.kind === 'musician') {
    stamp(rd, MUSICIAN[Math.floor(ph * 2) % 2], p.x, p.y, 0, -1);
    // notas que suben
    for (let i = 0; i < 3; i++) {
      const k = (ph * 0.35 + i / 3) % 1;
      const note = i % 2 ? '\u266b' : '\u266a';
      putW(rd, p.x + 0.5 + Math.sin(k * 6 + i) * 0.5, p.y, 3 + k * 4, note, -2);
    }
  } else if (p.kind === 'balloons') {
    stamp(rd, BALLOONS, p.x, p.y, 0, -1);
    for (let i = 0; i < 3; i++) {
      const bob = Math.sin(ph * 1.5 + i * 2) > 0.3 ? 0.5 : 0;
      putW(rd, p.x - 0.5 + i * 0.5, p.y, 4.5 + (i === 1 ? 1 : 0) + bob, i === 1 ? '\u25cf' : '\u25cb', -1.5);
    }
  }
}

function drawAnim(rd, a, t, dark) {
  switch (a.type) {
    case 'steam':
      drawSteam(rd, a.x, a.y, a.z, t + a.seed * 10, 3);
      break;
    case 'marquee': {
      // luces que corren por el borde de la marquesina
      const F = new Face('L', a.x);
      let i = 0;
      for (let u = a.y0 + 0.5; u < a.y1; u += 1, i++) {
        const on = (i + Math.floor(t * 4) + (a.off || 0)) % 3 === 0;
        if (on) F.at(rd, u, a.z, '*', -1.1);
      }
      break;
    }
    case 'blinkZ': {
      const F = new Face('F', a.y);
      for (let i = 0; i < a.n; i++) {
        const on = (i + Math.floor(t * 3)) % 2 === 0;
        F.at(rd, a.x + 0.5 - 0.5, a.z0 + i + 0.5, on ? '*' : ' ', -0.9);
      }
      break;
    }
    case 'blink': {
      if (Math.floor(t * 1.5) % 2 === 0) putW(rd, a.x - 0.5, a.y, a.z, '*', -1.5);
      break;
    }
    case 'bell': {
      // la campana tañe cada tanto
      const k = t % 14;
      if (k < 3) {
        const g = ['(', 'A', ')', 'A'][Math.floor(t * 4) % 4];
        const F = new Face('L', a.x);
        F.at(rd, a.y, a.z, g, -1.5);
        F.at(rd, a.y - 0.5, a.z + 1.5, Math.floor(t * 4) % 2 ? '°' : ' ', -1.5);
      }
      break;
    }
    case 'pond': {
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.25 + i * 0.37) % 1;
        const x = a.x0 + ((i * 0.618 + k * 0.3) % 1) * (a.x1 - a.x0);
        const y = a.y0 + k * (a.y1 - a.y0);
        putW(rd, x, y, 0, '~', -0.5);
      }
      break;
    }
    case 'fountainWater': {
      for (let i = 0; i < 6; i++) {
        const k = (t * 0.6 + i / 6) % 1;
        const ang = i * 1.05 + t * 0.3;
        const x = (a.x0 + a.x1) / 2 + Math.cos(ang) * (1 + k * 1.3);
        const y = (a.y0 + a.y1) / 2 + Math.sin(ang) * (1 + k * 1.3);
        putW(rd, x, y, a.z, k < 0.5 ? '~' : '-', -0.4);
      }
      break;
    }
    case 'fountain': {
      // chorro que sube y cae en la taza
      // cuatro chorros en arco que caen en la taza grande
      for (let i = 0; i < 16; i++) {
        const k = (t * 0.7 + i / 16) % 1;
        const dir = i % 4;
        const dx = dir === 0 ? 1 : dir === 1 ? -1 : 0;
        const dy = dir === 2 ? 1 : dir === 3 ? -1 : 0;
        const h = 4 * k * (1 - k) * 3 - k * 5;
        const x = a.x + dx * k * 3.5;
        const y = a.y + dy * k * 2.8;
        putW(rd, x, y, a.z + h, k < 0.45 ? "'" : k < 0.8 ? ',' : '.', -1.2);
      }
      // chorro del centro
      const top = 2.5 + (Math.floor(t * 5) % 2) * 0.5;
      for (let z = 0.5; z < top; z += 1) putW(rd, a.x - 0.5, a.y, a.z + z, z + 1 > top ? '°' : ':', -1.2);
      break;
    }
    case 'crane': {
      // el carro corre por la pluma y el gancho sube y baja
      const k = (Math.sin(t * 0.18) + 1) / 2;
      const u = a.y0 + k * (a.y1 - a.y0);
      const h = a.ground + (Math.sin(t * 0.45) + 1) * 0.5 * (a.z - a.ground - 3);
      const L = new Face('L', a.x);
      const U = Math.round(u);
      L.at(rd, U + 0.5, a.z, '▀', -1.5);
      const hz = Math.floor(h);
      for (let z = hz + 1; z < a.z; z++) L.at(rd, U, z + 0.5, '/', -1.2);
      L.at(rd, U, hz + 0.5, 'J', -1.3);
      // carga: un paquete de vigas
      L.at(rd, U - 0.5, hz, '=', -1.3);
      L.at(rd, U + 0.5, hz, '=', -1.3);
      break;
    }
    case 'gondola': {
      // baja y sube lento por la fachada
      const k = (Math.sin(t * 0.12 + a.seed * 6) + 1) / 2;
      const z = Math.floor(a.z0 + k * (a.z1 - a.z0 - 2));
      const L = new Face('L', a.x - 0.5);
      for (let u = a.y; u < a.y + a.len; u++) L.at(rd, u + 0.5, z, '_', -1.2);
      L.at(rd, a.y + 1, z + 1.5, 'o', -1.3);
      L.at(rd, a.y + 1, z + 0.5, Math.floor(t * 2) % 2 ? '/' : '|', -1.3);
      // cuerdas hasta el techo
      for (let zz = z + 1; zz < a.z1 + 1; zz++) {
        L.at(rd, a.y, zz + 0.5, '/', -0.9);
        L.at(rd, a.y + a.len, zz + 0.5, '/', -0.9);
      }
      break;
    }
    case 'ball': {
      // la pelota va y viene entre los dos niños, con un botecito
      const k = (Math.sin(t * 1.3) + 1) / 2;
      const y = a.y0 + 0.5 + k * (a.y1 - a.y0 - 1);
      const hop = Math.abs(Math.sin(t * 2.6)) * 1.2;
      putW(rd, a.x, y, hop, 'o', -1.2);
      break;
    }
    case 'swing': {
      const k = Math.sin(t * 2.2);
      const off = k > 0.4 ? 1 : k < -0.4 ? -1 : 0;
      putW(rd, a.x + off * 0.5, a.y - 1, 1, '_o', -0.8);
      break;
    }
    case 'lamp': {
      if (!dark) break;
      putW(rd, a.x - 0.25, a.y, a.z, '\u263c', -1.6);
      // charco de luz en el piso
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -1.5; dx <= 1.5; dx += 0.5) {
          if (Math.abs(dx) + Math.abs(dy) * 0.6 > 2) continue;
          if (((dx * 2 + dy) & 1) !== 0) continue;
          const x = a.x + dx;
          const y = a.y + dy + 0.5;
          const C = Math.round(2 * x + y);
          const R = Math.round(y);
          rd.putBlank(C, R - 1, 46, x - y + 1.4);
        }
      }
      break;
    }
    default:
      break;
  }
}
