// El edificio cortado: estructura, pisos, núcleo de escalera + ascensor,
// planta baja (café y panadería) y los dos subsuelos de cocheras.
//
// Coordenadas: x = columna de pantalla (no hay scroll horizontal), y = fila de
// mundo. Cada piso mide 8 filas: 7 de interior (techo en la 0, piso en la 6) y
// una losa rayada. La pantalla resta camY a todas las filas.
import { SP, ch } from './grid.js';
import { S } from './sprite.js';
import { Rng, hash2 } from './rng.js';
import { buildRoom, TYPES, FLOOR } from './rooms.js';
import { home, cafe, car, roof, plant, pet, person, kitchen, seat, misc, party } from './lib.js';
import { TEX, roomTex, theme, POSE, routine, flipped, steam, zzz, notes, bubbles, drips, waves, switchy, blink } from './fx.js';

export const FH = 8; // filas por piso
const MAC = ch('¯');
const UND = ch('_');
const BAR = ch('|');
const SL = ch('/');
const BS = ch('\\');
const DOT = ch('.');

// ---------------------------------------------------------------- disposición
export function makeLayout(cols, rows, seed = 6) {
  const narrow = cols < 100;
  const side = narrow ? 3 : Math.max(10, Math.round(cols * 0.12));
  const bw = Math.min(cols - 2 * side, 168);
  const bx = Math.floor((cols - bw) / 2);
  const x0 = bx + 3;
  const x1 = bx + bw - 3;
  const I = x1 - x0;
  // núcleo: escalera (tramos que zigzaguean) + pozo del ascensor
  const stepW = narrow ? 1 : 2;
  const LW = narrow ? 2 : 3;
  const SW = LW * 2 + 8 * stepW;
  const CW = SW + 11;
  const cx = narrow ? x1 - CW : x0 + Math.round((I - CW) * 0.47);
  const L = {
    cols,
    rows,
    narrow,
    side,
    bw,
    bx,
    x0,
    x1,
    stepW,
    LW,
    SW,
    CW,
    cx, // muro izquierdo del núcleo
    sx: cx + 1, // primera columna de la escalera
    ex: cx + SW + 1, // muro izquierdo del pozo
    roofY: Math.round(rows * 0.54), // línea del piso de la azotea
    nApt: 7,
    seed,
  };
  L.F0 = L.roofY + 2; // techo del último piso
  L.cafeTop = L.F0 + L.nApt * FH;
  L.G = L.cafeTop + FLOOR; // nivel de la vereda
  L.p1Top = L.cafeTop + FH;
  L.p2Top = L.p1Top + FH;
  L.foundation = L.p2Top + FH; // primera fila de la platea
  L.pipesTop = L.foundation + 2;
  L.sewerTop = L.pipesTop + 7;
  L.metroTop = L.sewerTop + 15;
  L.worldH = L.metroTop + 26;
  L.floorsTop = (k) => L.F0 + k * FH; // k: 0 = último piso ... nApt = PB, +1 = -1, +2 = -2
  L.nFloors = L.nApt + 3;
  return L;
}

// ---------------------------------------------------------------- composición
const DECK = ['kitchen', 'bedroom', 'tv', 'party', 'music', 'office', 'bath', 'plants', 'kids', 'dining', 'laundry', 'studio', 'gym', 'moving'];
const MUST = ['kitchen', 'bedroom', 'tv', 'party', 'music', 'office', 'bath', 'plants'];

// Reparte un ancho W en habitaciones (con tabiques de 1 columna entre ellas).
function splitZone(W, rng, deck, avoid = []) {
  const out = [];
  let left = W;
  let guard = 0;
  while (left >= 12 && guard++ < 20) {
    // tipos que entran y que no se repiten con los pisos de arriba
    const ok = deck.map((t, i) => (TYPES[t].min <= left && !avoid.includes(t) && !out.some((o) => o.type === t) ? i : -1)).filter((i) => i >= 0);
    let idx = ok.length ? ok[Math.min(ok.length - 1, Math.floor(rng.next() * Math.min(3, ok.length)))] : -1;
    if (idx < 0) idx = deck.findIndex((t) => TYPES[t].min <= left);
    if (idx < 0) break;
    const type = deck.splice(idx, 1)[0];
    deck.push(type);
    const { min, max } = TYPES[type];
    let w;
    if (left - min < 13) w = left;
    else w = Math.min(left, rng.int(min, Math.min(max, left - 13)));
    if (w > max + 8 && left === w) {
      // demasiado ancho para un solo cuarto: partir igual
      w = Math.min(max, left - 13);
    }
    out.push({ type, w });
    left -= w + 1;
  }
  if (left > 0 && out.length) out[out.length - 1].w += left + (left >= 0 ? 0 : 0);
  return out;
}

export class Building {
  constructor(L) {
    this.L = L;
    const rng = new Rng(L.seed * 7919 + L.cols);
    this.rng = rng;
    // mazo: primero lo obligatorio mezclado, después el resto
    const shuffle = (a) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const deck = [...shuffle([...MUST]), ...shuffle(DECK.filter((t) => !MUST.includes(t)))];
    this.floors = [];
    let id = 1;
    const zones = [
      [L.x0, L.cx],
      [L.cx + L.CW, L.x1],
    ].filter(([a, b]) => b - a >= 12);
    const hist = zones.map(() => []);
    for (let k = 0; k < L.nApt; k++) {
      const top = L.floorsTop(k);
      const fl = { k, top, kind: 'apt', rooms: [], walls: [] };
      for (const [zi, [a, b]] of zones.entries()) {
        const parts = splitZone(b - a, rng, deck, hist[zi].slice(-6));
        hist[zi].push(...parts.map((p) => p.type));
        let x = a;
        parts.forEach((p, i) => {
          const room = buildRoom(p.type, p.w, rng.fork());
          room.id = id++;
          room.x = x;
          fl.rooms.push(room);
          x += p.w;
          if (i < parts.length - 1) {
            fl.walls.push({ x, door: rng.chance(0.6) });
            x += 1;
          }
        });
      }
      this.floors.push(fl);
    }
    // planta baja y cocheras
    this.floors.push(this.groundFloor(zones, rng));
    this.floors.push(this.parking(L.nApt + 1, zones, rng, 1));
    this.floors.push(this.parking(L.nApt + 2, zones, rng, 2));
    this.setupCore(rng);
    // cosas colgadas afuera de los muros
    this.extras = [];
    for (let k = 0; k < L.nApt; k++) {
      for (const side of [-1, 1]) {
        const roll = rng.next();
        const kind = roll < 0.3 ? 'balcony' : roll < 0.5 ? 'ac' : roll < 0.72 ? 'flowers' : roll < 0.8 ? 'cat' : '';
        if (kind) this.extras.push({ k, side, kind, seed: rng.next() * 9, who: rng.int(0, 3) });
      }
    }
  }

  // ------------------------------------------------------------ planta baja
  groundFloor(zones, rng) {
    const { L } = this;
    const top = L.floorsTop(L.nApt);
    const fl = { k: L.nApt, top, kind: 'ground', rooms: [], walls: [] };
    zones.forEach(([a, b], i) => {
      const w = b - a;
      const r = i === 0 ? buildCafe(w, rng.fork(), a === L.x0) : buildBakery(w, rng.fork());
      r.x = a;
      r.id = 900 + i;
      fl.rooms.push(r);
    });
    if (zones.length === 1) fl.rooms[0].fullWidth = true;
    return fl;
  }

  parking(k, zones, rng, level) {
    const { L } = this;
    const top = L.floorsTop(k);
    const fl = { k, top, kind: 'parking', level, rooms: [], walls: [] };
    zones.forEach(([a, b], zi) => {
      const r = buildParking(b - a, rng.fork(), level, zi);
      r.x = a;
      r.id = 950 + level * 4 + zi;
      fl.rooms.push(r);
    });
    return fl;
  }

  // ------------------------------------------------------------ escalera y ascensor
  setupCore(rng) {
    const { L } = this;
    // tramos: del piso k sube al k-1 (y del último a la azotea). El k par
    // sube hacia la derecha y está "adelante" (cortado, rayado); el impar
    // sube a la izquierda y queda detrás (solo contorno).
    this.flights = [];
    const lastK = L.nApt + 2;
    for (let k = lastK; k >= 0; k--) {
      const Fb = L.floorsTop(k) + FLOOR;
      const Ft = Fb - FH;
      const dir = k % 2 === 0 ? 1 : -1;
      this.flights.push({ k, Fb, Ft, dir, front: dir === 1 });
    }
    // camino de los que suben: puntos (x, fila de pies) con tiempos
    const pts = [];
    const { sx, SW, LW, stepW } = L;
    const startX = (dir) => (dir === 1 ? sx + 0 : sx + SW - 3);
    for (const f of this.flights) {
      const x0 = f.dir === 1 ? sx + LW - 2 : sx + SW - LW - 1;
      pts.push({ x: startX(f.dir), y: f.Fb, d: 0.8 });
      pts.push({ x: x0, y: f.Fb, d: 0.3 });
      for (let i = 1; i <= 8; i++) pts.push({ x: x0 + f.dir * i * stepW, y: f.Fb - i, d: 0.42, k: f.k });
    }
    pts.push({ x: sx + SW - 3, y: L.roofY, d: 1.2 });
    pts.push({ x: L.cx + 1, y: L.roofY, d: 0.8 });
    pts.push({ x: L.cx - 5, y: L.roofY, d: 5 });
    this.stairPath = pts;
    // dos personas: una sube, la otra baja (el mismo camino al revés)
    const total = pts.reduce((a, p) => a + p.d, 0);
    this.stairT = total;
    this.climbers = [
      { phase: 0, up: true },
      { phase: total * 0.55, up: false },
    ];
    // ascensor: paradas al azar entre -2 y el último piso
    const stops = [];
    let cur = L.nApt;
    for (let i = 0; i < 12; i++) {
      let n;
      do n = rng.int(0, L.nApt + 2);
      while (n === cur);
      stops.push(n);
      cur = n;
    }
    const sched = [];
    let T = 0;
    let from = stops[stops.length - 1];
    for (const to of stops) {
      const dist = Math.abs(to - from) * FH;
      const d = dist / 5;
      sched.push({ k: 0, t0: T, d, a: from, b: to });
      T += d;
      const wait = rng.range(2.5, 4.5);
      sched.push({ k: 1, t0: T, d: wait, a: to, who: rng.int(0, 4) });
      T += wait;
      from = to;
    }
    this.lift = { sched, T };
  }

  // fila del piso (pies) de la cabina en el tiempo t, y si está con puertas abiertas
  liftAt(t) {
    const { sched, T } = this.lift;
    const u = ((t % T) + T) % T;
    let s = sched[0];
    for (const x of sched) if (u >= x.t0 && u < x.t0 + x.d) s = x;
    const F = (k) => this.L.floorsTop(k) + FLOOR;
    if (s.k === 1) return { y: F(s.a), open: true, who: s.who, k: s.a };
    const e = (u - s.t0) / s.d;
    const ease = e * e * (3 - 2 * e);
    const y = F(s.a) + (F(s.b) - F(s.a)) * ease;
    return { y: Math.round(y), open: false, who: (s.b * 7 + s.a) % 5, k: -1 };
  }

  climberAt(c, t) {
    const pts = this.stairPath;
    const T = this.stairT;
    let u = (((t + c.phase) % T) + T) % T;
    if (!c.up) u = T - u;
    let acc = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i];
      if (u <= acc + p.d) {
        const q = pts[i + 1];
        const e = (u - acc) / p.d;
        const x = Math.round(p.x + (q.x - p.x) * e);
        const y = e < 0.5 ? p.y : q.y;
        const dx = q.x - p.x;
        const face = (c.up ? dx >= 0 : dx < 0) ? 0 : 1;
        const moving = dx !== 0 || q.y !== p.y;
        const f = moving ? (Math.floor((u - acc) * 5) & 1 ? 'walk2' : 'walk1') : 'stand';
        return { x, y, s: POSE[f][face] };
      }
      acc += p.d;
    }
    const p = pts[pts.length - 1];
    return { x: p.x, y: p.y, s: POSE.stand[0] };
  }

  // ------------------------------------------------------------ dibujo
  draw(g, camY, t) {
    const { L } = this;
    this.t = t;
    const top = camY;
    const bot = camY + g.rows;
    // muros exteriores y losas
    this.drawShell(g, camY);
    // pisos visibles
    const climbers = this.climbers.map((c) => this.climberAt(c, t));
    this.climbNow = climbers;
    for (const fl of this.floors) {
      if (fl.top + FH < top || fl.top > bot) continue;
      this.drawFloor(g, fl, camY, t);
    }
    this.drawCore(g, camY, t, climbers);
  }

  drawShell(g, camY) {
    const { L } = this;
    const yA = L.roofY - 1 - camY;
    const yB = L.foundation + 1 - camY;
    const r0 = Math.max(0, yA);
    const r1 = Math.min(g.rows - 1, yB);
    // muros
    for (let r = r0; r <= r1; r++) {
      const wy = r + camY;
      for (const x of [L.bx, L.bx + L.bw - 3]) {
        let a = BAR;
        let b = SL;
        let c = BAR;
        // ventanas cortadas en los pisos de departamentos
        const k = Math.floor((wy - L.F0) / FH);
        const local = wy - L.F0 - k * FH;
        if (k >= 0 && k < L.nApt && local >= 2 && local <= 4) {
          a = SP;
          b = local === 4 ? UND : BAR;
          c = SP;
          if (local === 4) a = c = UND;
        }
        g.put(x, r, a);
        g.put(x + 1, r, b);
        g.put(x + 2, r, c);
      }
    }
    this.drawExtras(g, camY);
    // parapeto: tapa del muro
    if (yA - 1 >= 0 && yA - 1 < g.rows) {
      g.text(L.bx, yA - 1, '___');
      g.text(L.bx + L.bw - 3, yA - 1, '___');
    }
    // losas: el techo de cada piso
    const slab = (wy, ch1 = SL) => {
      const r = wy - camY;
      if (r < 0 || r >= g.rows) return;
      g.hline(L.bx, L.bx + L.bw - 1, r, ch1);
    };
    slab(L.roofY + 1);
    for (let k = 0; k < L.nFloors; k++) slab(L.floorsTop(k) + FH - 1, k >= L.nApt ? SL : SL);
    // platea de fundación: dos filas rayadas que asoman a los lados
    for (let i = 0; i < 2; i++) {
      const r = L.foundation + i - camY;
      if (r >= 0 && r < g.rows) g.hline(L.bx - 2, L.bx + L.bw + 1, r, SL);
    }
  }

  drawExtras(g, camY) {
    const { L } = this;
    if (L.bx < 7) return;
    const t = this.t || 0;
    // bajada pluvial por el muro izquierdo
    const px = L.bx - 1;
    for (let r = Math.max(0, L.roofY - 1 - camY); r < Math.min(g.rows, L.G - camY); r++) {
      const wy = r + camY;
      g.put(px, r, wy % 8 === 3 ? ch('=') : BAR);
    }
    for (const e of this.extras) {
      const top = L.floorsTop(e.k) - camY;
      if (top < -9 || top > g.rows + 2) continue;
      const wx = e.side < 0 ? L.bx : L.bx + L.bw - 1; // borde exterior del muro
      const out = (i) => (e.side < 0 ? wx - 1 - i : wx + 1 + i);
      if (e.kind === 'balcony') {
        // losa en voladizo, baranda y alguien o una planta
        for (let i = 0; i < 6; i++) {
          g.put(out(i), top + 7, SL);
          g.put(out(i), top + 6, UND);
          g.put(out(i), top + 4, i === 5 ? (e.side < 0 ? ch('.') : ch('.')) : UND);
          if (i % 2 === 1) g.put(out(i), top + 5, BAR);
        }
        g.put(out(5), top + 5, BAR);
        g.put(out(5), top + 6, BAR);
        // la ventana se vuelve puerta
        for (let r = top + 2; r <= top + 6; r++) for (let i = 0; i < 3; i++) g.put(e.side < 0 ? wx + i : wx - i, r, r === top + 6 ? UND : SP);
        if (e.who === 0) g.blit(POSE.smoke[e.side < 0 ? 1 : 0], e.side < 0 ? out(3) : out(1), top + 3);
        else if (e.who === 1) g.blit(plant.tall, e.side < 0 ? out(4) : out(1), top + 3);
        else g.blit(plant.leafy, e.side < 0 ? out(4) : out(0), top + 4);
      } else if (e.kind === 'ac') {
        const ax = e.side < 0 ? out(4) : out(0);
        g.text(ax, top + 1, ' ___ ');
        g.text(ax, top + 2, '|(+)|');
        g.text(ax, top + 3, '|___|');
        g.put(ax + 2, top + 2, Math.floor(this.t * 6 + e.seed) & 1 ? ch('x') : ch('+'));
        drips(g, ax + 2, top + 4, top + 7, this.t, 0.8, e.seed);
      } else if (e.kind === 'flowers') {
        const fx = e.side < 0 ? out(4) : out(0);
        g.text(fx, top + 4, '\\|/o');
        g.text(fx, top + 5, '|___|');
      } else if (e.kind === 'cat') {
        const cx = e.side < 0 ? out(4) : out(0);
        g.text(cx, top + 5, '_____');
        g.blit(e.side < 0 ? pet.cat2 : flipped(pet.cat2), cx + 1, top + 3);
      }
    }
  }

  drawFloor(g, fl, camY, t) {
    const Y = fl.top - camY;
    for (const rm of fl.rooms) drawRoom(g, rm, rm.x, Y, t, camY);
    for (const wl of fl.walls) {
      for (let r = 0; r < 7; r++) {
        if (wl.door && r >= 3) continue;
        g.put(wl.x, Y + r, BAR);
      }
      if (wl.door) g.put(wl.x, Y + 6, UND);
    }
    // número de piso en el muro del núcleo
    const label = fl.kind === 'apt' ? String(this.L.nApt - fl.k) : fl.kind === 'ground' ? 'PB' : '-' + fl.level;
    const lx = this.L.cx - label.length;
    const bg = (c) => c === SP || c === DOT || c === ch(':') || c === ch('+');
    let free = true;
    for (let i = 0; i < label.length; i++) if (!bg(g.get(lx + i, Y + 1))) free = false;
    if (free) g.text(lx, Y + 1, label);
  }

  // núcleo: fondo de la caja de escalera, tramos, gente y ascensor
  drawCore(g, camY, t, climbers) {
    const { L } = this;
    const { sx, SW, ex, cx } = L;
    const yTop = L.roofY + 2;
    const yBot = L.floorsTop(L.nApt + 2) + FLOOR;
    const r0 = Math.max(0, yTop - camY);
    const r1 = Math.min(g.rows - 1, yBot - camY);
    if (r0 > r1) return;
    // luz de escalera "minutero": prendida donde hay alguien
    const litFloor = new Set();
    for (const c of climbers) {
      const k = Math.floor((c.y - L.F0) / FH);
      litFloor.add(k);
      litFloor.add(Math.floor((c.y - 3 - L.F0) / FH));
    }
    for (let r = r0; r <= r1; r++) {
      const wy = r + camY;
      const k = Math.floor((wy - L.F0) / FH);
      const local = wy - L.F0 - k * FH;
      const lit = litFloor.has(k);
      const tex = theme.dark ? (lit ? TEX.dense : TEX.clean) : lit ? TEX.clean : TEX.dense;
      for (let x = sx; x < sx + SW; x++) g.put(x, r, local === 7 ? SP : tex(x, wy));
      // muros del núcleo
      g.put(cx, r, BAR);
      g.put(ex, r, BAR);
      g.put(ex + 9, r, BAR);
      // pozo del ascensor: oscuro, con guías
      const stex = theme.dark ? TEX.clean : TEX.dense;
      for (let x = ex + 1; x < ex + 9; x++) g.put(x, r, stex(x, wy));
      if (local === 7) {
        // losa cortada a los costados del núcleo
        g.put(cx, r, SL);
        g.put(ex + 9, r, SL);
      }
      if (local >= 2 && local <= 6) {
        // marco de la puerta del pozo en la pared del fondo
        g.put(ex + 1, r, local === 2 ? ch('.') : ch(':'));
        g.put(ex + 7, r, local === 2 ? ch('.') : ch(':'));
      }
    }
    this.drawHeadHouse(g, camY, t);
    // tramos de atrás (contorno), gente detrás, tramos de adelante (rayados)
    for (const f of this.flights) if (!f.front) this.drawFlight(g, f, camY, false);
    for (const c of climbers) if (this.onBackFlight(c)) g.blit(c.s, c.x, c.y - camY - 2);
    for (const f of this.flights) if (f.front) this.drawFlight(g, f, camY, true);
    for (const c of climbers) if (!this.onBackFlight(c)) g.blit(c.s, c.x, c.y - camY - 2);
    // descansos (los pisos de la caja de escalera)
    for (const f of this.flights) {
      const y = f.Fb - camY;
      if (y < 0 || y >= g.rows) continue;
      const a = f.dir === 1 ? sx : sx + SW - L.LW;
      for (let x = a; x < a + L.LW; x++) if (g.get(x, y) === SP || g.get(x, y) === ch(':') || g.get(x, y) === DOT) g.put(x, y, UND);
      for (let x = a; x < a + L.LW; x++) {
        const ys = y + 1;
        if (ys >= 0 && ys < g.rows) g.put(x, ys, SL);
      }
    }
    // la azotea: descanso final
    this.drawLift(g, camY, t);
  }

  // casilla de la azotea: tapa la escalera y guarda la sala de máquinas
  drawHeadHouse(g, camY, t) {
    const { L } = this;
    const y = L.roofY - camY;
    if (y < -1 || y - 8 > g.rows) return;
    const x = L.cx;
    const w = L.CW;
    const top = y - 6;
    const dark = theme.dark ? TEX.clean : TEX.dense;
    for (let r = top + 1; r <= y; r++) {
      for (let c = x + 1; c < x + w - 1; c++) g.put(c, r, r === y ? UND : c > L.ex && c < L.ex + 9 ? SP : dark(c, r + camY));
      g.put(x, r, BAR);
      g.put(L.ex, r, BAR);
      g.put(x + w - 1, r, BAR);
    }
    // puerta abierta a la azotea, del lado izquierdo
    for (let r = y - 3; r < y; r++) g.put(x, r, SP);
    g.put(x, y - 4, UND);
    g.hline(x, x + w - 1, top - 1, UND);
    g.hline(x, x + w - 1, top, SL);
    // sala de máquinas: motor y polea que giran según el ascensor
    g.text(L.ex + 1, top + 1, ' ______ ');
    g.text(L.ex + 1, top + 2, '|(' + '○Ø'[Math.floor(t * 3) & 1] + ')=[]|');
    g.text(L.ex + 1, top + 3, '|______|');
    g.put(L.ex + 4, top + 4, BAR);
    g.put(L.ex + 4, top + 5, BAR);
    g.put(L.ex + 8, top + 4, ch('¦'));
    g.put(L.ex + 8, top + 5, ch('¦'));
    // ventilación y una lamparita
    g.text(x + 2, top + 1, '[=]');
    g.put(x + Math.floor(L.SW / 2), top + 1, BAR);
    g.put(x + Math.floor(L.SW / 2), top + 2, ch('o'));
  }

  onBackFlight(c) {
    const { L } = this;
    const k = Math.floor((c.y - 1 - L.F0) / FH);
    return k % 2 !== 0 && k >= 0;
  }

  drawFlight(g, f, camY, front) {
    const { L } = this;
    const { sx, SW, LW, stepW } = L;
    const Fb = f.Fb - camY;
    if (Fb < -1 || Fb - 9 > g.rows) return;
    const x0 = f.dir === 1 ? sx + LW : sx + SW - LW - 1;
    for (let i = 0; i < 8; i++) {
      const r = Fb - i;
      for (let s = 0; s < stepW; s++) {
        const c = f.dir === 1 ? x0 + i * stepW + s : x0 - i * stepW - s;
        const last = s === stepW - 1;
        let glyph;
        if (stepW === 1) glyph = f.dir === 1 ? SL : BS;
        else glyph = last ? BAR : UND;
        g.put(c, r, glyph);
        // cuña rayada debajo (adelante) o solo la zanca (atrás)
        if (front) {
          for (let rr = r + 1; rr <= Fb; rr++) g.put(c, rr, ((c + rr) & 1) === 0 ? BS : SP);
        } else {
          const rr = r + 2;
          if (rr <= Fb) g.put(c, rr, s === 0 ? (f.dir === 1 ? SL : BS) : SP);
          if (r + 1 <= Fb) g.put(c, r + 1, SP);
        }
      }
    }
    // baranda: postes cada 2 escalones en los tramos de adelante
    if (front)
      for (let i = 1; i < 8; i += 2) {
        const c = f.dir === 1 ? x0 + i * stepW : x0 - i * stepW;
        const r = Fb - i - 1;
        if (g.get(c, r) === SP || g.get(c, r) === ch(':') || g.get(c, r) === DOT) g.put(c, r, ch('¦'));
      }
    // descanso de arriba
    const a = f.dir === 1 ? sx + SW - LW : sx;
    const yt = Fb - 8;
    for (let x = a; x < a + LW; x++) g.put(x, yt, UND);
  }

  drawLift(g, camY, t) {
    const { L } = this;
    const { ex } = L;
    const st = this.liftAt(t);
    const yb = st.y - camY; // fila del piso de la cabina
    // cables desde la sala de máquinas
    const top = L.roofY - 2 - camY;
    for (let r = Math.max(0, top); r < Math.min(g.rows, yb - 5); r++) g.put(ex + 4, r, BAR);
    // contrapeso, que baja cuando la cabina sube
    const span = L.floorsTop(L.nApt + 2) + FLOOR - (L.roofY + 2);
    const cw = L.roofY + 2 + span - (st.y - (L.roofY + 2)) - camY;
    for (let r = Math.max(0, top); r < Math.min(g.rows, cw - 2); r++) g.put(ex + 8, r, ch('¦'));
    g.put(ex + 8, cw - 2, ch('▒'));
    g.put(ex + 8, cw - 1, ch('▒'));
    // indicador de piso sobre cada puerta (muestra dónde está la cabina)
    for (let k = 0; k <= L.nApt + 2; k++) {
      const r = L.floorsTop(k) - camY;
      if (r < 0 || r >= g.rows) continue;
      const lab = k < L.nApt ? String(L.nApt - k) : k === L.nApt ? 'PB' : '-' + (k - L.nApt);
      const here = st.k === k;
      const s = here ? '[' + lab + ']' : ' ' + lab + ' ';
      g.text(ex + 1 + Math.floor((8 - s.length) / 2), r, s);
    }
    if (yb - 6 > g.rows || yb < 0) return;
    // cabina
    g.text(ex + 1, yb - 5, '__|___');
    g.put(ex + 7, yb - 5, UND);
    for (let r = yb - 4; r <= yb; r++) {
      g.put(ex + 1, r, st.open && r > yb - 4 ? SP : BAR);
      for (let x = ex + 2; x < ex + 7; x++) g.put(x, r, r === yb ? UND : SP);
      g.put(ex + 7, r, BAR);
    }
    // pasajeros
    const who = st.who;
    if (who === 1 || who === 3) g.blit(POSE.stand[0], ex + 3, yb - 2);
    if (who === 2) {
      g.blit(POSE.skirt[1], ex + 2, yb - 2);
      g.blit(pet.cat2, ex + 4, yb - 1);
    }
    if (who === 3) g.blit(POSE.stand2[1], ex + 4, yb - 2);
    if (who === 4) {
      g.blit(POSE.phone[0], ex + 2, yb - 2);
      g.put(ex + 6, yb, ch('o'));
    }
    if (st.open) g.put(ex + 2, yb - 4, ch('.'));
  }
}

// ---------------------------------------------------------------- habitaciones
const FXDRAW = {
  steam: (g, X, Y, t, f) => steam(g, X, Y, t, f.n || 3, f.seed || 0),
  zzz: (g, X, Y, t, f) => zzz(g, X, Y, t, f.seed || 0),
  notes: (g, X, Y, t, f) => notes(g, X, Y, t, f.seed || 0),
  bubbles: (g, X, Y, t, f) => bubbles(g, X, Y, t, f.w, f.seed || 0),
  waves: (g, X, Y, t, f) => waves(g, X, Y, t, f.dir || 1, f.seed || 0),
  shower: (g, X, Y, t, f) => {
    for (let i = 0; i < 3; i++) drips(g, X + i, Y, Y + 3, t, 1.6, i * 0.45 + (f.seed || 0));
  },
  tv: (g, X, Y, t, f, lit) => {
    const k = Math.floor(t * 5);
    const scene = Math.floor(t / 4) % 3;
    for (let r = 0; r < f.h; r++)
      for (let c = 0; c < f.w; c++) {
        let v = SP;
        const h = hash2(c + k * 13, r + (f.x | 0));
        if (scene === 0) v = h < 0.35 ? ch(':') : h < 0.5 ? DOT : SP;
        else if (scene === 1) v = (c + k) % 9 === 0 ? ch('o') : r === 1 && c > 1 ? UND : SP;
        else v = h < 0.6 ? (r ? ch('~') : ch('^')) : SP;
        g.put(X + c, Y + r, v);
      }
  },
  screen: (g, X, Y, t, f) => {
    for (let r = 0; r < 2; r++) {
      const len = Math.floor((t * 2.2 + (f.seed || 0) + r * 2.3) % 7);
      for (let c = 0; c < f.w; c++) g.put(X + c, Y + r, c < len ? (hash2(c, r + Math.floor(t / 3)) < 0.6 ? ch('=') : ch('-')) : SP);
    }
  },
  fish: (g, X, Y, t, f) => {
    const w = f.w - 3;
    const u = (t * 0.5) % 2;
    const p = u < 1 ? u : 2 - u;
    const x = Math.round(p * w);
    g.text(X + x, Y, u < 1 ? '><>' : '<><');
    g.put(X + ((Math.floor(t * 0.7) * 3) % (f.w - 1)), Y - 1 + (Math.floor(t * 2) % 2), ch('°'));
  },
  head: (g, X, Y, t, f) => {
    const k = Math.floor(t / 2.5 + f.seed);
    const dx = hash2(k, 9) < 0.25 ? 1 : 0;
    g.put(X + dx, Y, ch('o'));
    if (hash2(k, 4) < 0.15) g.put(X + dx + 1, Y, ch('/'));
  },
  sparkle: (g, X, Y, t, f) => {
    const k = Math.floor(t * 4);
    for (let i = 0; i < 4; i++) {
      const c = Math.floor(hash2(k, i) * f.w);
      const r = Math.floor(hash2(i, k) * 3);
      g.put(X + c, Y + r, i & 1 ? ch("'") : ch('.'));
    }
  },
  drum: (g, X, Y, t) => {
    const k = Math.floor(t * 6) % 4;
    g.put(X, Y, k === 0 ? DOT : k === 3 ? ch("'") : SP);
    g.put(X + 1, Y, k === 1 ? ch("'") : k === 2 ? DOT : SP);
  },
  canvas: (g, X, Y, t, f) => {
    const n = Math.floor((t * 0.6 + (f.seed || 0)) % 14);
    const marks = '~/o.:\\-';
    for (let i = 0; i < Math.min(n, 10); i++) {
      const c = i % f.w;
      const r = Math.floor(i / f.w);
      g.put(X + c, Y + r, ch(marks[(i * 3 + (f.seed | 0)) % marks.length]));
    }
  },
  sign: (g, X, Y, t, f) => {
    // letrero vertical con luces
    for (let i = 0; i < f.text.length; i++) g.put(X, Y + i, ch(f.text[i]));
    const on = blink(t, 1.2, f.seed || 0);
    g.put(X - 1, Y - 1, on ? ch('*') : DOT);
  },
  oven: (g, X, Y, t) => {
    for (let c = 0; c < 5; c++) g.put(X + c, Y, (Math.floor(t * 6) + c) % 3 ? ch('^') : ch('~'));
  },
};

export function roomLit(rm, t) {
  if (rm.strobe) return switchy(t, rm.id, 0.95, 5) && blink(t, 2.3, rm.id * 0.1, 0.75);
  const on = Math.min(0.97, rm.light.on + (theme.dark ? 0.12 : 0));
  return switchy(t, rm.id, on, rm.light.period);
}

export function drawRoom(g, rm, X, Y, t, camY) {
  const w = rm.w;
  const lit = rm.alwaysLit ? true : roomLit(rm, t);
  const tex = roomTex(lit, rm.wall);
  const H = rm.h || 7;
  const fr = H - 1;
  for (let r = 0; r < H; r++) {
    const y = Y + r;
    if (y < 0 || y >= g.rows) continue;
    if (r === 0) g.hline(X, X + w - 1, y, MAC);
    else if (r === fr) g.hline(X, X + w - 1, y, UND);
    else for (let c = 0; c < w; c++) g.put(X + c, y, tex(X + c, y + camY));
  }
  const dy = H - 7; // las habitaciones altas apoyan todo en su propio piso
  // personajes "de atrás" (detrás de mostradores): van antes que los muebles
  for (const a of rm.actors) {
    if (!a.back) continue;
    const { x, s } = a.at(t);
    g.blit(s, X + x, Y + a.y + dy - s.h + 1);
  }
  for (const it of rm.items) {
    if (it.s) g.blit(it.s, X + it.x, Y + it.y + dy);
    else if (it.fr) g.blit(it.fr[Math.floor(t * it.fps + it.ph) % it.fr.length], X + it.x, Y + it.y + dy);
  }
  for (const lx of rm.lamps) g.blit(lit ? home.lampOn : home.lampOff, X + lx, Y);
  if (rm.bedside !== undefined && lit) {
    g.put(X + (rm.flipBedside ? w - 2 : 1), Y + 2 + dy, ch('.'));
  }
  for (const f of rm.fx) {
    const draw = FXDRAW[f.k];
    if (draw) draw(g, X + f.x, Y + f.y + dy, t, f, lit);
  }
  for (const a of rm.actors) {
    if (a.back) continue;
    const { x, s } = a.at(t);
    g.blit(s, X + x, Y + a.y + dy - s.h + 1);
  }
  if (rm.post) rm.post(g, X, Y + dy, t, lit);
  // reponer la línea de piso y techo donde quedó un hueco
  const yf = Y + fr;
  if (yf >= 0 && yf < g.rows)
    for (let c = 0; c < w; c++) if (g.get(X + c, yf) === SP) g.put(X + c, yf, UND);
  if (Y >= 0 && Y < g.rows) for (let c = 0; c < w; c++) if (g.get(X + c, Y) === SP) g.put(X + c, Y, MAC);
}

// ---------------------------------------------------------------- café
// Una "habitación" armada a mano con el mismo formato que las del catálogo.
function blankRoom(w, rng, type) {
  return {
    type,
    w,
    rng,
    items: [],
    fx: [],
    actors: [],
    lamps: [],
    wall: 'dots',
    light: { on: 0.97, period: 30 },
  };
}

const MENU = S(String.raw`
 ______
|CAFE 2|
|TE   1|
|PAN  1|
 ¯¯¯¯¯¯
`);
const ESPRESSO = S(String.raw`
 ______
|(o)(o)|
|_|__|_|
`);
const CASE = S(String.raw`
 _____
|°o°o°|
`);

const BAR_FRONT = (L) => S('|' + '¯'.repeat(L - 2) + '|\n|' + ':'.repeat(L - 2) + '|', 'solid');
const SHELF_CUPS = (L) => S(' ' + 'u '.repeat(Math.floor((L - 1) / 2)) + '\n' + '¯'.repeat(L), 'none');

// Café: mesas con clientes del lado de la puerta, barra con cafetera contra
// el núcleo, menú en la pared y alguien que entra a pedir.
function buildCafe(w, rng) {
  const r = blankRoom(w, rng, 'cafe');
  r.wall = 'stripes';
  const bl = Math.min(17, Math.max(13, Math.floor(w * 0.38)));
  const bx = w - bl;
  r.items.push({ s: SHELF_CUPS(bl - 10), x: bx + 9, y: 1 });
  // barista detrás de la barra: la barra le tapa las piernas
  r.actors.push({
    at: routine(
      [
        { x: bx + 8, dur: 4, pose: ['cook1', 'cook2'], fps: 2, face: -1 },
        { x: bx + bl - 7, dur: 3, pose: 'stand' },
      ],
      { phase: rng.range(0, 9), speed: 3 },
    ),
    y: 5,
    back: true,
  });
  r.items.push({ s: BAR_FRONT(bl), x: bx, y: 5 });
  r.items.push({ s: ESPRESSO, x: bx + 1, y: 2 });
  r.fx.push({ k: 'steam', x: bx + 3, y: 1, n: 1, seed: 1, w: 1 });
  r.items.push({ s: cafe.register, x: bx + bl - 4, y: 3 });
  // mesas
  let x = 1;
  const lamps = [];
  while (x + 17 <= bx - 1) {
    r.items.push({ fr: [seat.eat1, seat.eat2], fps: 0.9, ph: rng.range(0, 3), x, y: 4, w: 4 });
    r.items.push({ s: home.dtable, x: x + 3, y: 5 });
    r.items.push({ s: S('u  u'), x: x + 6, y: 4 });
    if (rng.chance(0.7)) r.items.push({ fr: [flipped(seat.eat2), flipped(seat.idle)], fps: 0.7, ph: rng.range(0, 3), x: x + 13, y: 4, w: 4 });
    else r.items.push({ s: pet.dogLie, x: x + 6, y: 5 });
    lamps.push(x + 6);
    x += 19;
  }
  if (bx - x >= MENU.w + 1) r.items.push({ s: MENU, x: Math.max(x, bx - MENU.w - 1), y: 0 });
  // cliente que entra, pide y se va
  r.actors.push({
    at: routine(
      [
        { x: 0, dur: 2, pose: 'stand', face: 1 },
        { x: bx - 3, dur: 5, pose: ['stand', 'phone'], fps: 0.6 },
      ],
      { speed: 3, phase: rng.range(0, 20) },
    ),
    y: 6,
  });
  r.lamps = lamps;
  r.alwaysLit = true;
  return r;
}

const BREAD = S(String.raw`
|(__)(_)<==>(_)(__)|
|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|
|<==>(__)(_)(_)<==>|
|¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|
`);
const OVEN = S(String.raw`
 _______
|.-----.|
||     ||
||_____||
|_______|
`);

function buildBakery(w, rng) {
  const r = blankRoom(w, rng, 'bakery');
  r.wall = 'dots';
  r.items.push({ s: OVEN, x: 1, y: 2 });
  r.fx.push({ k: 'oven', x: 3, y: 4, w: 5 });
  r.items.push({ s: BREAD, x: 10, y: 1 });
  // mostrador con caja registradora y panadero detrás
  const cl = 11;
  const cx = Math.min(w - cl - 1, 32);
  r.actors.push({
    at: routine([
      { x: cx + 3, dur: 5, pose: 'stand' },
      { x: cx + cl - 7, dur: 3, pose: 'reach' },
    ], { phase: rng.range(0, 9) }),
    y: 5,
    back: true,
  });
  r.items.push({ s: BAR_FRONT(cl), x: cx, y: 5 });
  r.items.push({ s: cafe.register, x: cx + cl - 4, y: 3 });
  r.items.push({ s: S('(_)(__)'), x: cx + 1, y: 4 });
  // fila de clientes
  let x = cx + cl + 2;
  while (x + 3 < w) {
    r.actors.push({ at: routine([{ x, dur: 99, pose: rng.chance(0.5) ? 'stand' : 'skirt', face: -1 }]), y: 6 });
    x += 5;
    if (x + 7 < w && rng.chance(0.3)) {
      r.items.push({ s: flipped(pet.dog2), x, y: 5 });
      x += 8;
    }
  }
  r.lamps = [Math.min(w - 6, cx + 3)];
  r.alwaysLit = true;
  return r;
}

function finishRoom(r) {
  if (r.rng.chance(0.5)) {
    // espejo: mismo criterio que el catálogo
    const w = r.w;
    for (const it of r.items) {
      const sw = it.s ? it.s.w : it.w;
      it.x = w - it.x - sw;
      if (it.s) it.s = flipped(it.s);
      if (it.fr) it.fr = it.fr.map(flipped);
    }
    for (const f of r.fx) f.x = w - f.x - (f.w || 1);
    r.lamps = r.lamps.map((x) => w - x - 5);
    r.flipX = true;
    const ats = r.actors.map((a) => a.at);
    r.actors = r.actors.map((a, i) => ({
      y: a.y,
      at: (t) => {
        const o = ats[i](t);
        return { x: w - o.x - o.s.w, s: flipped(o.s) };
      },
    }));
  }
  return r;
}

// ---------------------------------------------------------------- cocheras
const PILLAR = S('|/|\n|/|\n|/|\n|/|\n|/|\n|/|\n|/|', 'solid');
const TUBE = S('_|__|_\n¯¯¯¯¯¯', 'none');
const CARS = [car.sedan, car.hatch, car.van];

function buildParking(w, rng, level, zi) {
  const r = blankRoom(w, rng, 'parking');
  r.wall = 'clean';
  r.light = { on: 0.97, period: 40 };
  r.alwaysLit = true;
  const bay = 17;
  let n = 0;
  for (let x = 1; x + bay <= w; x += bay + 3) {
    r.items.push({ s: PILLAR, x: x + bay, y: 0 });
    const num = String(level * 20 + zi * 10 + ++n).padStart(2, '0');
    r.items.push({ s: S(num, 'none'), x: x + 7, y: 1 });
    if (rng.chance(0.78)) {
      const c = CARS[rng.int(0, CARS.length - 1)];
      r.items.push({ s: rng.chance(0.5) ? c : flipped(c), x: x + Math.floor((bay - c.w) / 2), y: 7 - c.h });
    } else if (rng.chance(0.5)) {
      r.items.push({ s: rng.chance(0.5) ? car.moto : cafe.bike, x: x + 6, y: 4 });
    }
    r.items.push({ s: TUBE, x: x + 6, y: 0 });
  }
  // alguien que camina hasta su auto
  r.actors.push({
    at: routine([
      { x: 2, dur: 3, pose: 'stand' },
      { x: Math.max(3, w - 6), dur: 4, pose: 'phone' },
    ], { speed: 3, phase: rng.range(0, 20) }),
    y: 6,
  });
  // un tubo que titila
  r.post = (g, X, Y, t) => {
    const fx = 8;
    if (hash2(Math.floor(t * 9), level) < 0.35) g.text(X + fx, Y + 1, '      ');
  };
  return r;
}
