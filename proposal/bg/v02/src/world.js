// El mundo quieto: trazado, lotes y edificios, generado con semilla.
//
// Cada cuadra se arma con lotes a los dos lados de la avenida. Al este la
// primera fila son edificios con local abajo (la vidriera mira a la avenida);
// detrás, torres. Al oeste, que queda adelante, la primera fila es baja
// (locales de un piso, plaza, parque, estacionamiento) para no tapar el
// paseo; detrás crece de a poco.

import { Rng } from './rng.js';
import { Layout, X } from './layout.js';
import { paintGround } from './ground.js';
import { eastBuilding, westShop, tower, NIGHT } from './buildings.js';
import * as SPC from './specials.js';
import * as P from './props.js';
import { STREET, POS } from './layout.js';

export class World {
  constructor(seed, y0, y1, opts = {}) {
    this.seed = seed;
    this.opts = opts;
    this.layout = new Layout(seed, y0, y1);
    this.things = []; // { bbox: [cMin, rMin, cMax, rMax], draw(t) }
    this.anims = []; // detalles animados anclados al mundo
    // lugares que la vida de la calle necesita conocer
    this.busStops = [];
    this.flocks = [];
    this.vendors = [];
    this.signals = [];
    this.idlers = []; // gente quieta que igual se mueve (músico, niños, vendedores)
    this.ducks = [];
    this.dogs = [];
    this.benchSitters = [];
    this.strolls = []; // senderos con paseantes (plaza, parque)
    this.birds = [];
    const rng = new Rng(seed);
    // programa de cuadras a partir de la primera transversal del paseo
    const first = this.layout.blocks.findIndex((b) => b.y0 >= 8);
    for (const b of this.layout.blocks) b.k = b.i - first;
    for (const b of this.layout.blocks) this.genBlock(b, rng.fork());
    for (const S of this.layout.streets) this.genCorner(S, rng.fork());
  }

  // mobiliario de una cuadra de avenida
  genStreetFurniture(b, rng) {
    const { y0, y1 } = b;
    const at = (x0, x1, ya, yb, z, fn) => this.add([x0, x1, ya, yb, 0, z], fn);
    // paradero en cuadras alternas
    let stop = null;
    if (b.i % 2 === 0) {
      const ys = y0 + Math.floor((y1 - y0) / 2) - 3;
      stop = [ys - 2, ys + 8];
      this.busStops.push({ y0: ys, y1: ys + 6, x: POS.stop + 1 });
      at(POS.stop - 1, POS.stop + 4, ys - 2, ys + 7, 6, (t) => P.busStop(t, POS.stop, ys, 6));
    }
    const nearStop = (y) => stop && y > stop[0] && y < stop[1];
    // franja verde: árboles, faroles, bancas
    let k = rng.int(0, 3);
    for (let y = y0 + 4; y < y1 - 2; y += rng.int(7, 9)) {
      if (nearStop(y)) continue;
      const kind = k++ % 3;
      if (kind === 0 || kind === 2) {
        const tk = rng.int(0, 3);
        at(POS.tree - 2, POS.tree + 5, y - 2, y + 2, 7, (t) => P.tree(t, POS.tree, y, tk));
      } else {
        at(POS.tree - 1, POS.tree + 4, y - 2, y + 3, 8, (t) => {
          P.lamp(t, POS.tree + 0.5, y, 1, 7, this.anims);
          P.bench(t, POS.tree - 1, y + 1, 3);
        });
        if (rng.chance(0.55)) this.benchSitters.push({ x: POS.tree - 0.4, y: y + 2.6, kind: 'sit', look: rng.int(0, 1) });
      }
    }
    // bandada que da vueltas alto sobre la cuadra
    if (rng.chance(0.6)) this.birds.push({ x: rng.range(-30, 30), y: (y0 + y1) / 2, z: rng.range(16, 24), r: rng.range(3, 6), n: rng.int(3, 6), sp: rng.range(0.25, 0.45) });
    // palomas en el paseo
    this.flocks.push({ x: POS.walkN + 0.5, y: y0 + rng.int(6, Math.max(7, y1 - y0 - 6)), n: rng.int(4, 7) });
    // carrito en la esquina norte del paseo
    if (rng.chance(0.8)) this.vendors.push({ x: POS.tree, y: y0 + 2, kind: rng.pick(['mani', 'helados', 'sopaipillas', 'mote']) });
    // quiosco en la terraza
    if (rng.chance(0.5)) {
      const yk = y1 - rng.int(6, 9);
      at(X.lotW, X.lotW + 4, yk - 1, yk + 4, 5, (t) => P.kiosk(t, X.lotW + 0.5, yk, rng.chance(0.5) ? 'DIARIOS' : 'REVISTAS'));
    }
    // entrada del metro en cuadras alternas, en la vereda este
    if (b.i % 3 === 1) {
      const ym = y0 + rng.int(4, Math.max(5, y1 - y0 - 10));
      at(X.curbE, X.lotE, ym - 2, ym + 6, 6, (t) => P.metro(t, X.curbE + 1, ym, 5));
    }
    // vereda este: faroles, árboles, basureros, bicicletero
    for (let y = y0 + 4; y < y1 - 2; y += 17) at(X.curbE - 1, X.curbE + 3, y - 2, y + 2, 9, (t) => P.lamp(t, X.curbE + 0.5, y, -1, 7, this.anims));
    for (let y = y0 + 11; y < y1 - 3; y += rng.int(14, 18)) {
      const tk = rng.int(0, 3);
      at(X.curbE - 2, X.lotE + 1, y - 2, y + 2, 7, (t) => P.tree(t, X.curbE + 1, y, tk));
    }
    for (let y = y0 + 6; y < y1 - 2; y += rng.int(8, 14)) {
      const kind = rng.int(0, 3);
      at(X.curbE, X.lotE, y - 1, y + 1, 3, (t) => (kind === 0 ? P.trash(t, X.curbE + 0.5, y) : kind === 1 ? P.rack(t, X.curbE + 2.5, y) : kind === 2 ? P.pot(t, X.lotE - 0.5, y, y) : P.hydrant(t, X.curbE + 0.5, y)));
    }
    // bandejón: farol doble y palmeras
    for (let y = y0 + 6; y < y1 - 3; y += 18) at(-2, 3, y - 2, y + 2, 9, (t) => P.lamp2(t, 0, y, 8, this.anims));
  }

  // esquinas de una transversal: semáforos, teléfono, buzón
  genCorner(S, rng) {
    const heads = [];
    // norte-oeste: para las pistas al sur, brazo sobre ellas
    this.add([X.curbW - 1, -1, S - 2, S, 0, 8], (t) => P.signalPole(t, X.curbW - 0.5, S - 1, -1.5));
    heads.push({ x: -6.5, y: S - 1, z: 7, axis: 'av' }, { x: -3, y: S - 1, z: 7, axis: 'av' });
    // sur-este: para las pistas al norte
    this.add([1, X.curbE + 1, S + 12, S + 14, 0, 8], (t) => P.signalPole(t, X.curbE + 0.5, S + 13, 1.5));
    heads.push({ x: 5.5, y: S + 13, z: 7, axis: 'av' }, { x: 2, y: S + 13, z: 7, axis: 'av' });
    // transversal: postes cortos en las esquinas
    this.add([X.lotW - 2, X.lotW, S + 9, S + 11, 0, 6], (t) => P.signalPole(t, X.lotW - 0.5, S + 10, X.lotW - 0.5, 5));
    heads.push({ x: X.lotW - 0.25, y: S + 10, z: 5, axis: 'x' });
    this.add([X.lotE, X.lotE + 2, S + 1, S + 3, 0, 6], (t) => P.signalPole(t, X.lotE + 0.5, S + 2, X.lotE + 0.5, 5));
    heads.push({ x: X.lotE + 0.75, y: S + 2, z: 5, axis: 'x' });
    this.signals.push({ S, heads });
    if (rng.chance(0.6)) this.add([X.curbE, X.lotE, S - 2, S + 1, 0, 4], (t) => P.phone(t, X.lotE - 1.5, S - 1));
    if (rng.chance(0.5)) this.add([X.lotW, X.lotW + 3, S + 12, S + 15, 0, 4], (t) => P.mailbox(t, X.lotW + 1.5, S + 13));
    void STREET;
  }

  genBlock(b, rng) {
    const { y0, y1, k } = b;
    this.genStreetFurniture(b, rng.fork());
    const A = this.anims;
    const I = this.idlers;
    // --- programa: qué tiene cada cuadra
    const PROG = [
      { east: 'bencinera', west: 'parque' },
      { east: 'cine', west: 'estacionamiento' },
      { east: 'iglesia', west: 'plaza' },
      { east: 'hostal', west: 'feria' },
      { east: 'obra', west: 'parque' },
      { east: 'cine', west: 'estacionamiento' },
    ];
    const prog = k >= 0 ? PROG[k % PROG.length] : { east: null, west: null };

    // --- este, primera fila
    let ea = y0;
    let eb = y1;
    if (prog.east === 'bencinera') {
      const ya = y0;
      const yb = y0 + 18;
      this.add([X.lotE - 2, X.lotE + 18, ya, yb, 0, 12], (t) => SPC.gasStation(t, X.lotE, ya, yb, new Rng(b.i * 7 + 1), A, I));
      ea = yb;
    } else if (prog.east === 'iglesia') {
      const ya = y0 + 2;
      const yb = ya + 22;
      this.add([X.lotE, X.lotE + 30, ya, yb, 0, 34], (t) => SPC.church(t, X.lotE, ya, yb, A, I, this));
      this.row(rng, y0, ya, 2, 2, () => {});
      this.row(rng, yb, y1, 6, 12, (r, a, c) => this.eastLot(r, a, c));
      eb = ya;
      ea = y0;
      if (eb - ea >= 2) this.eastLot(rng.fork(), ea, eb);
      ea = eb = 0;
    } else if (prog.east === 'obra') {
      const ya = y0 + rng.int(4, 10);
      const yb = ya + 16;
      this.add([X.lotE - 2, X.lotE + 20, ya - 8, yb + 16, 0, 40], (t) => SPC.obra(t, X.lotE, ya, yb, A));
      this.row(rng, y0, ya, 5, 12, (r, a, c) => this.eastLot(r, a, c));
      ea = yb;
    } else if (prog.east === 'cine' || prog.east === 'hostal') {
      const ya = y0 + rng.int(6, 12);
      const yb = ya + (prog.east === 'cine' ? 12 : 9);
      const box = { x0: X.lotE, x1: X.lotE + 14, y0: ya, y1: yb };
      const fn = prog.east === 'cine' ? SPC.cinema : SPC.hostal;
      const r2 = rng.fork();
      this.add([box.x0 - 2, box.x1, ya, yb, 0, 30], (t) => fn(t, box, new Rng(r2.s), A));
      this.row(rng, y0, ya, 5, 12, (r, a, c) => this.eastLot(r, a, c));
      ea = yb;
    }
    if (eb > ea) this.row(rng, ea, eb, 6, 12, (r, a, c) => this.eastLot(r, a, c));

    // --- este, filas de atrás
    for (let x = X.lotE + 16; x < 110; x += 15) {
      if (prog.east === 'iglesia' && x < X.lotE + 32) continue;
      this.row(rng, y0, y1, 6, 14, (r, ya, yb) => {
        const box = { x0: x + r.int(0, 2), x1: x + r.int(10, 13), y0: ya, y1: yb };
        this.add([box.x0, box.x1, ya, yb, 0, 40], (t) => tower(t, box, new Rng(r.s), A, 38));
      });
    }

    // --- oeste, primera fila
    const wx0 = X.lotW - 16;
    let wa = y0;
    if (prog.west === 'parque' || prog.west === 'plaza') {
      const fn = prog.west === 'parque' ? SPC.park : SPC.plaza;
      const r2 = rng.fork();
      this.add([wx0, X.lotW, y0, y1, 0, 10], (t) => fn(t, wx0, X.lotW, y0, y1, new Rng(r2.s), A, I, this));
      if (prog.west === 'parque') {
        // los datos de la vida (patos, perro, palomas) se registran al construir:
        // hay que construirlo una vez aunque no se vea
        void 0;
      }
      wa = y1;
    } else if (prog.west === 'estacionamiento' || prog.west === 'feria') {
      const len = prog.west === 'feria' ? Math.min(26, y1 - y0) : 15;
      const ya = y0 + (prog.west === 'feria' ? 0 : rng.int(4, 10));
      const yb = ya + len;
      const r2 = rng.fork();
      if (prog.west === 'feria') this.add([wx0, X.lotW, ya, yb, 0, 8], (t) => SPC.feria(t, wx0 + 1, X.lotW, ya, yb, new Rng(r2.s), I));
      else this.add([wx0, X.lotW, ya, yb, 0, 8], (t) => SPC.parking(t, wx0, X.lotW, ya, yb, new Rng(r2.s), I));
      this.row(rng, y0, ya, 5, 10, (r, a, c) => this.westLot(r, a, c));
      wa = yb;
    }
    if (wa < y1) this.row(rng, wa, y1, 5, 10, (r, a, c) => this.westLot(r, a, c));

    // --- oeste, filas de atrás: barrio bajo que crece de a poco. Este lado
    // queda adelante, así que lo alto taparía el paseo (y la plaza o el
    // parque): la altura máxima depende de cuánto hay que dejar ver delante.
    const open = prog.west === 'parque' || prog.west === 'plaza';
    const front = open ? X.lotW - 16 : X.lotW - 9;
    let xr = front - (open ? 0 : 3);
    while (xr > -118) {
      const xe = xr;
      const hm = Math.max(3, Math.floor((front - xe) * (open ? 0.3 : 0.4) + (open ? 2 : 4)));
      this.row(rng, y0, y1, 5, 12, (r, ya, yb) => {
        const box = { x0: xe - r.int(8, 11), x1: xe - r.int(0, 1), y0: ya, y1: yb };
        if (hm <= 9) this.add([box.x0, box.x1 + 2, ya, yb, 0, hm + 2], (t) => westShop(t, box, new Rng(r.s), A, { h: Math.min(hm, new Rng(r.s).int(3, hm)), back: true }));
        else this.add([box.x0, box.x1, ya, yb, 0, hm + 2], (t) => tower(t, box, new Rng(r.s), A, hm));
      });
      xr -= 13;
    }
  }

  eastLot(r, ya, yb) {
    if (yb - ya < 3) return;
    const d = r.int(10, 15);
    const box = { x0: X.lotE, x1: X.lotE + d, y0: ya, y1: yb };
    this.add([box.x0 - 2, box.x1, ya, yb, 0, 30], (t) => eastBuilding(t, box, new Rng(r.s), this.anims));
  }

  westLot(r, ya, yb) {
    if (yb - ya < 3) return;
    const d = r.int(6, 9);
    const box = { x0: X.lotW - d, x1: X.lotW, y0: ya, y1: yb };
    this.add([box.x0, box.x1 + 3, ya, yb, 0, 8], (t) => westShop(t, box, new Rng(r.s), this.anims));
  }

  // reparte [y0, y1] en lotes de ancho [a, b] y llama a fn por cada uno
  row(rng, y0, y1, a, b, fn) {
    let y = y0;
    while (y < y1 - 2) {
      let len = rng.int(a, b);
      if (y1 - (y + len) < a) len = y1 - y;
      fn(rng.fork(), y, y + len);
      y += len;
    }
  }

  // registra algo dibujable con su caja en el mundo [x0, x1, y0, y1, z0, z1]
  add(b, draw) {
    const [x0, x1, y0, y1, z0, z1] = b;
    const cMin = 2 * x0 + y0 + z0 - 4;
    const cMax = 2 * x1 + y1 + z1 + 4;
    const rMin = y0 - z1 - 4;
    const rMax = y1 - z0 + 4;
    this.things.push({ bbox: [cMin, rMin, cMax, rMax], draw });
  }

  build(layer) {
    NIGHT.on = !!this.opts.dark;
    this.anims.length = 0;
    this.idlers.length = 0;
    this.ducks.length = 0;
    this.dogs.length = 0;
    this.strolls.length = 0;
    this.flocks = this.flocks.filter((f) => !f.special);
    paintGround(layer, this.layout);
    const c1 = layer.c0 + layer.w;
    const r1 = layer.r0 + layer.h;
    for (const th of this.things) {
      const [a, b, c, d] = th.bbox;
      if (c < layer.c0 || a > c1 || d < layer.r0 || b > r1) continue;
      th.draw(layer);
    }
  }
}
