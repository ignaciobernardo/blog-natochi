// Catálogo de habitaciones. Cada tipo arma su interior con los sprites de la
// biblioteca y una semilla: la misma cocina nunca sale igual dos veces.
//
// Coordenadas locales: x en [0, w), y en [0, 6]; la fila 0 es el techo y la 6
// el piso (los sprites "apoyan" su última fila en la 6).
import { S } from './sprite.js';
import { home, kitchen, bath, office, music, party, plant, pet, misc, seat } from './lib.js';
import { routine, flipped } from './fx.js';

export const FLOOR = 6;
const onFloor = (s) => FLOOR - s.h + 1;

// Mesada de cocina de largo L (2 filas): puertas con manija y horno opcional.
function counter(L, ovenSeg = -1) {
  let a = '';
  let b = '';
  for (let i = 0; i < L - 1; i++) {
    const seg = Math.floor(i / 4);
    const m = i % 4;
    if (m === 0) {
      a += '|';
      b += '|';
    } else {
      a += '¯';
      b += seg === ovenSeg ? (m === 1 ? '[' : m === 2 ? '=' : ']') : m === 2 ? 'o' : '_';
    }
  }
  return S(a + '|\n' + b + '|', 'solid');
}

// Armador: lleva la ocupación de la pared para no encimar cuadros y muebles.
class Room {
  constructor(type, w, rng) {
    this.type = type;
    this.w = w;
    this.rng = rng;
    this.items = []; // { s, x, y } | { fr, fps, x, y, ph } | { lit:[off,on], x, y }
    this.fx = []; // { k, x, y, ... } efectos por tiempo (vapor, zz, pantallas...)
    this.actors = []; // { steps, speed, phase, y }
    this.top = new Array(w).fill(7); // fila más alta ocupada por columna
    this.wallUsed = new Array(w).fill(false);
    this.wall = 'dots';
    this.lamps = [];
    this.light = { on: 0.75, period: 11 };
  }

  mark(x, y, s) {
    for (let c = Math.max(0, x); c < Math.min(this.w, x + s.w); c++) this.top[c] = Math.min(this.top[c], y);
  }

  // mueble apoyado en el piso
  floor(s, x) {
    if (!s || x < 0 || x + s.w > this.w) return false;
    const y = onFloor(s);
    this.items.push({ s, x, y });
    this.mark(x, y, s);
    return true;
  }

  at(s, x, y) {
    if (!s || x < 0 || x + s.w > this.w) return false;
    this.items.push({ s, x, y });
    this.mark(x, y, s);
    return true;
  }

  anim(fr, fps, x, y, ph = 0) {
    this.items.push({ fr, fps, x, y, ph, w: fr[0].w });
    this.mark(x, y, fr[0]);
  }

  // decoración de pared (cuadros, ventanas, repisas) donde haya lugar
  decor(s, y = 1, tries = 8) {
    const { w, rng } = this;
    for (let k = 0; k < tries; k++) {
      const x = rng.int(1, w - s.w - 1);
      if (x < 1) return false;
      let ok = true;
      for (let c = x - 1; c <= x + s.w; c++) {
        if (c < 0 || c >= w) continue;
        if (this.wallUsed[c] || this.top[c] <= y + s.h) ok = false;
      }
      if (!ok) continue;
      for (let c = x; c < x + s.w; c++) this.wallUsed[c] = true;
      this.items.push({ s, x, y });
      return true;
    }
    return false;
  }

  lamp(x) {
    if (x < 1 || x > this.w - 6) return;
    for (let c = x; c < x + 5; c++) this.wallUsed[c] = true;
    this.lamps.push(x);
  }

  actor(steps, opt = {}) {
    this.actors.push({ steps, speed: opt.speed || 4, phase: opt.phase ?? this.rng.range(0, 30), y: opt.y ?? FLOOR });
  }

  effect(k, x, y, extra = {}) {
    this.fx.push({ k, x, y, w: 1, ...extra });
  }

  // Espejo: las habitaciones se arman de izquierda a derecha y la mitad se da vuelta.
  flip() {
    const { w } = this;
    for (const it of this.items) {
      const sw = it.s ? it.s.w : it.w;
      it.x = w - it.x - sw;
      if (it.s) it.s = flipped(it.s);
      if (it.fr) it.fr = it.fr.map(flipped);
    }
    for (const f of this.fx) {
      f.x = w - f.x - f.w;
      if (f.dir) f.dir = -f.dir;
    }
    for (const a of this.actors) {
      for (const st of a.steps) {
        st.x = w - st.x - (st.sw || 3);
        st.face = -(st.face || 1);
      }
    }
    this.lamps = this.lamps.map((x) => w - x - 5);
  }

  done() {
    for (const a of this.actors) a.at = routine(a.steps, a);
    return this;
  }
}

const pick = (rng, arr) => arr[Math.floor(rng.next() * arr.length)];
const PLANTS = [plant.small, plant.tall, plant.leafy, plant.cactus, plant.fern, plant.flower];
const FRAMES = [home.frame1, home.frame2, home.frame3];

function decorate(r, n = 2) {
  const { rng } = r;
  for (let i = 0; i < n; i++) {
    const k = rng.next();
    if (k < 0.45) r.decor(pick(rng, FRAMES), rng.int(1, 2));
    else if (k < 0.65) r.decor(home.clock, 2);
    else if (k < 0.85) r.decor(r.rng.chance(0.5) ? home.window : home.windowCurtain, 1);
    else r.decor(home.shelf, 1);
  }
}

// ---------------------------------------------------------------- tipos
const BUILD = {
  // cocinar: heladera, mesada con olla humeante y alguien revolviendo
  kitchen(r) {
    const { rng, w } = r;
    r.wall = 'tiles';
    r.floor(kitchen.fridge, 0);
    const L = Math.min(17, Math.max(9, 4 * Math.floor((w - 10) / 4) + 1));
    const cx = 7;
    const oven = rng.int(0, Math.floor((L - 1) / 4) - 1);
    r.floor(counter(L, oven), cx);
    // olla sobre el horno, vapor arriba
    const px = cx + oven * 4 + 1;
    r.at(rng.chance(0.6) ? kitchen.pot : kitchen.kettle, px, 3);
    r.effect('steam', px + 1, 2, { n: 3 });
    // canilla y frascos en el resto de la mesada
    const sx = px + 5 < cx + L - 3 ? px + 5 : cx + 1;
    if (sx !== px) r.at(kitchen.faucet, sx, 3);
    if (cx + L - 6 > sx + 3) r.at(kitchen.jars, cx + L - 6, 3);
    // alacenas arriba (menos sobre la olla)
    for (let x = cx; x + 9 <= cx + L; x += 9) {
      if (px >= x - 2 && px <= x + 9) continue;
      r.at(kitchen.upper, x, 1);
      for (let c = x; c < x + 9; c++) r.wallUsed[c] = true;
    }
    for (let c = px - 1; c < px + 4; c++) if (c >= 0 && c < w) r.wallUsed[c] = true;
    // quien cocina: revuelve, va a la heladera, vuelve
    r.actor([
      { x: px - 3, dur: rng.range(5, 8), pose: ['cook1', 'cook2'], fps: 3 },
      { x: 1, dur: 1.5, pose: 'reach', face: -1 },
      { x: px + 5, dur: rng.range(2, 4), pose: 'stand' },
    ]);
    // mesa con alguien comiendo si sobra lugar
    let x = cx + L + 2;
    if (w - x >= 14) {
      r.floor(seat.eat1, x);
      r.items.pop();
      r.anim([seat.eat1, seat.eat2], 1.3, x, 4, rng.range(0, 3));
      r.floor(home.dtable, x + 3);
      r.at(kitchen.bowl, x + 5, 4);
      r.floor(flipped(seat.idle), x + 3 + home.dtable.w - 1);
      x += home.dtable.w + 7;
    } else if (w - x >= 5) {
      r.floor(rng.chance(0.5) ? pet.cat2 : kitchen.bin, x + 1);
      x += 6;
    }
    if (w - x >= 5) r.floor(pet.cat2, x + 1);
    r.decor(home.clock, 1) || r.decor(home.window, 1);
    r.lamp(Math.min(w - 6, Math.max(1, cx + L)));
    r.light = { on: 0.85, period: 13 };
  },

  // dormir: cama con alguien que ronca, mesa de luz, ropero
  bedroom(r) {
    const { rng, w } = r;
    r.wall = pick(rng, ['dots', 'stripes', 'diamonds']);
    r.floor(home.nightstand, 0);
    r.at(home.bedside, 1, 3);
    const bed = home.bedSleep;
    r.floor(bed, 5);
    r.effect('zzz', 5 + 7, 3, { seed: rng.range(0, 3) });
    if (rng.chance(0.6)) r.at(pet.catSleep, 5 + 9, 2);
    let x = 5 + bed.w + 2;
    if (w - x >= 9) {
      r.floor(home.wardrobe, x);
      x += home.wardrobe.w + 2;
    }
    if (w - x >= 4) r.floor(pick(rng, PLANTS), x);
    if (!r.decor(home.windowCurtain, 1)) r.decor(pick(rng, FRAMES), 1);
    r.decor(pick(rng, FRAMES), 1);
    r.bedside = 1;
    r.light = { on: 0.25, period: 9 };
  },

  // tele: el sillón de espaldas y la pantalla que parpadea
  tv(r) {
    const { rng, w } = r;
    r.wall = pick(rng, ['dots', 'stripes']);
    let x = 1;
    if (w >= 26) {
      r.floor(rng.chance(0.5) ? home.bookcase : home.floorLamp, x);
      x += 10;
    }
    const tvx = x + 1;
    r.at(home.tvWall, tvx, 0);
    r.effect('tv', tvx + 1, 1, { w: 9, h: 2 });
    const sofa = home.sofaBack;
    r.floor(sofa, x);
    // cabezas sobre el respaldo
    const n = rng.int(1, 3);
    for (let i = 0; i < n; i++) {
      const hx = x + 2 + i * 4 + rng.int(0, 1);
      r.effect('head', hx, 4, { seed: rng.range(0, 9), w: 2 });
    }
    if (rng.chance(0.5)) r.at(pet.cat2, x + sofa.w - 5, 3);
    x += sofa.w + 1;
    if (w - x >= 8 && rng.chance(0.6)) {
      r.floor(home.tank, x);
      r.effect('fish', x + 1, 2, { w: 6 });
      x += home.tank.w + 1;
    } else if (w - x >= 9) {
      r.floor(pet.dogLie, x);
      x += pet.dogLie.w + 1;
    }
    if (w - x >= 5) r.floor(pick(rng, PLANTS), x + 1);
    decorate(r, 1);
    r.light = { on: 0.35, period: 7 };
    r.tvGlow = true;
  },

  // fiesta: banderines, bola de espejos, parlantes y gente bailando
  party(r) {
    const { rng, w } = r;
    r.wall = 'diamonds';
    r.at(S(party.bunting ? '.v'.repeat(Math.floor((w - 2) / 2)) + '.' : '', 'none'), 1, 1);
    for (let c = 0; c < w; c++) r.wallUsed[c] = true;
    const bx = Math.floor(w / 2);
    r.at(party.ball, bx - 1, 0);
    r.effect('sparkle', bx - 4, 1, { w: 9, seed: rng.range(0, 5) });
    r.floor(music.speaker, 0);
    r.effect('waves', 5, 3, { dir: 1, seed: 0 });
    r.floor(music.speaker, w - 5);
    r.effect('waves', w - 6, 3, { dir: -1, seed: 1 });
    let x = 7;
    if (w >= 34) {
      r.floor(party.snacks, x);
      r.at(party.cake, x + 2, 2);
      x += party.snacks.w + 2;
    }
    const room = w - 7 - x;
    const n = Math.max(2, Math.min(6, Math.floor(room / 5)));
    for (let i = 0; i < n; i++) {
      const dx = x + Math.floor(((i + 0.5) * room) / n) - 1;
      const sets = [
        ['up', 'stand', 'up', 'dance1'],
        ['dance1', 'dance2'],
        ['up', 'dance2', 'stand', 'dance1'],
        ['wave', 'stand'],
      ];
      r.actor(
        [
          { x: dx, dur: rng.range(3, 6), pose: pick(rng, sets), fps: rng.range(2.5, 4) },
          { x: dx + rng.int(-2, 2), dur: rng.range(2, 4), pose: pick(rng, sets), fps: 3, face: -1 },
        ],
        { speed: 3 },
      );
    }
    if (rng.chance(0.6)) r.at(party.balloons, w - 12, 2);
    r.effect('notes', bx + 4, 3, { seed: 2 });
    r.strobe = true;
    r.light = { on: 0.9, period: 5 };
  },

  // música: piano, batería o trompeta, con notas que suben
  music(r) {
    const { rng, w } = r;
    r.wall = pick(rng, ['stripes', 'dots']);
    const kind = w >= 18 ? rng.int(0, 2) : 2;
    if (kind === 0) {
      r.floor(seat.stool, 1);
      r.anim([seat.piano1, seat.piano2], 4, 1, 4, rng.range(0, 2));
      r.floor(music.piano, 5);
      r.effect('notes', 8, 2, { seed: rng.range(0, 4) });
      if (w >= 22) r.floor(music.stand, 17);
    } else if (kind === 1) {
      r.anim([music.drummer1, music.drummer2], 5, 1, 3, 0);
      r.effect('waves', 12, 4, { dir: 1, seed: 3 });
      r.mark(1, 3, music.drums);
      if (w >= 20) r.floor(music.amp, 14);
    } else {
      r.floor(music.stand, 0);
      r.actor([{ x: 5, dur: 99, pose: ['trumpet', 'trumpet2'], fps: 2 }]);
      r.effect('notes', 9, 2, { seed: rng.range(0, 4) });
      if (w >= 15) r.floor(music.amp, w - 6);
    }
    decorate(r, 2);
    r.light = { on: 0.9, period: 15 };
  },

  // oficina en casa: escritorio, monitor con texto, alguien tecleando
  office(r) {
    const { rng, w } = r;
    r.wall = pick(rng, ['dots', 'clean', 'stripes']);
    let x = 0;
    if (w >= 22) {
      r.floor(rng.chance(0.5) ? home.bookcase : office.cabinet, 0);
      x = 10;
    }
    r.floor(seat.type1, x);
    r.items.pop();
    r.anim([seat.type1, seat.type2], 6, x, 4, rng.range(0, 2));
    const dx = x + 3;
    r.floor(office.desk, dx);
    r.at(office.monitor, dx + 1, 2);
    r.effect('screen', dx + 2, 3, { w: 5, seed: rng.range(0, 99) });
    r.at(office.mug, dx + 8, 4);
    r.effect('steam', dx + 9, 3, { n: 2, seed: 4 });
    if (rng.chance(0.5)) r.at(pet.cat2, dx + 10, 3);
    x = dx + office.desk.w + 1;
    if (w - x >= 5) r.floor(pick(rng, PLANTS), x);
    r.decor(office.board, 1) || r.decor(pick(rng, FRAMES), 1);
    r.light = { on: 0.8, period: 17 };
  },

  // baño: bañera con burbujas o ducha, inodoro, lavatorio
  bath(r) {
    const { rng, w } = r;
    r.wall = 'tiles';
    let x = 0;
    if (rng.chance(0.55) && w >= 16) {
      r.floor(bath.tubFull, 0);
      r.effect('bubbles', 7, 3, { w: 8, seed: rng.range(0, 4) });
      if (rng.chance(0.5)) r.at(bath.duck, 12, 3);
      x = bath.tubFull.w + 1;
    } else {
      r.at(bath.shower, 0, 1);
      r.effect('shower', 2, 3, { seed: rng.range(0, 4) });
      r.actor([{ x: 1, dur: 99, pose: ['stand', 'up'], fps: 0.7 }]);
      r.at(bath.curtain, 4, 1);
      x = 9;
    }
    if (w - x >= 6) {
      r.floor(bath.toilet, x);
      r.at(bath.paper, x + 4, 3);
      x += 7;
    }
    if (w - x >= 5) {
      r.floor(bath.sink, x);
      r.at(bath.mirror, x, 0);
      x += 6;
    }
    if (w - x >= 4) r.at(bath.towel, x, 2);
    r.light = { on: 0.6, period: 8 };
  },

  // plantas y mascotas: selva doméstica, jaula, pecera y alguien regando
  plants(r) {
    const { rng, w } = r;
    r.wall = 'stripes';
    let x = 0;
    while (x < w - 3) {
      const p = pick(rng, PLANTS);
      if (x + p.w > w) break;
      r.floor(p, x);
      x += p.w + rng.int(0, 2);
      if (rng.chance(0.25) && x + 8 < w) {
        r.floor(home.tank, x);
        r.effect('fish', x + 1, 2, { w: 6 });
        x += home.tank.w + 1;
      }
    }
    for (let i = 0; i < Math.floor(w / 9); i++) {
      const hx = rng.int(1, w - 4);
      if (r.wallUsed[hx] || r.wallUsed[hx + 2]) continue;
      r.at(rng.chance(0.7) ? plant.hang : pet.bird, hx, 0);
      for (let c = hx; c < hx + 5; c++) r.wallUsed[c] = true;
    }
    const wx = rng.int(2, Math.max(2, w - 8));
    r.actor([
      { x: wx, dur: 4, pose: 'water' },
      { x: Math.min(w - 5, wx + 6), dur: 3, pose: 'water' },
      { x: Math.max(0, wx - 5), dur: 2, pose: 'stand', face: -1 },
    ]);
    r.waterer = true;
    if (rng.chance(0.6)) r.floor(pet.cat2, Math.max(0, w - 6));
    r.light = { on: 0.9, period: 19 };
  },

  // cuarto de chicos: cama chica, juguetes y alguien que salta
  kids(r) {
    const { rng, w } = r;
    r.wall = 'diamonds';
    r.floor(home.kidBed, 0);
    r.actor([{ x: 3, dur: 99, pose: ['kid', 'kidUp'], fps: 2.5 }], { y: 5 });
    let x = home.kidBed.w + 2;
    r.floor(home.blocks, x);
    x += 8;
    if (w - x >= 6) r.floor(home.toyCar, x);
    r.floor(home.ball, Math.min(w - 2, x + 7));
    r.decor(pick(rng, FRAMES), 1);
    r.decor(home.window, 1);
    r.light = { on: 0.7, period: 10 };
  },

  // comedor: mesa larga con la familia, lámpara colgando
  dining(r) {
    const { rng, w } = r;
    r.wall = pick(rng, ['dots', 'stripes']);
    let x = 1;
    if (w >= 28) {
      r.floor(home.plates, 0);
      x = 10;
    }
    r.anim([seat.eat1, seat.eat2], 1.2, x, 4, rng.range(0, 2));
    r.floor(home.dtable, x + 3);
    r.at(kitchen.bowl, x + 6, 4);
    r.at(party.drinks, x + 10, 4);
    r.anim([flipped(seat.eat2), flipped(seat.eat1)], 1.1, x + 14, 4, rng.range(0, 2));
    r.lamp(x + 5);
    if (w - (x + 18) >= 4) {
      r.actor([
        { x: x + 18, dur: 3, pose: 'carry', face: -1 },
        { x: w - 4, dur: 4, pose: 'stand' },
      ]);
    }
    decorate(r, 2);
    r.light = { on: 0.85, period: 14 };
  },

  // lavadero: lavarropas girando, alguien planchando
  laundry(r) {
    const { rng, w } = r;
    r.wall = 'tiles';
    r.floor(misc.washer, 0);
    r.effect('drum', 3, 5, { w: 2 });
    r.floor(misc.basket, 8);
    let x = 13;
    if (w - x >= 9) {
      r.floor(misc.ironing, x);
      r.actor([{ x: x + 7, dur: 99, pose: ['cook1', 'cook2'], fps: 1.5, face: -1 }]);
      r.effect('steam', x + 7, 2, { n: 2, seed: 2 });
      x += 12;
    }
    if (w - x >= 13) r.at(misc.rack, x, 2);
    r.light = { on: 0.7, period: 9 };
  },

  // taller de pintura: atril y alguien que pinta
  studio(r) {
    const { rng, w } = r;
    r.wall = 'clean';
    r.floor(misc.canvases, 0);
    r.floor(misc.easel, 7);
    r.effect('canvas', 8, 2, { w: 5, seed: rng.range(0, 9) });
    r.actor([{ x: 14, dur: 99, pose: ['paint', 'paint2'], fps: 1.6, face: -1 }]);
    if (w >= 22) r.floor(misc.paints, 18);
    decorate(r, 1);
    r.light = { on: 0.9, period: 21 };
  },

  // mudanza: cajas, escalera y alguien pintando la pared
  moving(r) {
    const { rng, w } = r;
    r.wall = 'clean';
    r.floor(misc.boxes, 0);
    r.floor(misc.ladder, 10);
    r.floor(misc.bucket, 16);
    if (w >= 20) r.actor([{ x: w - 5, dur: 99, pose: ['paint', 'paint2'], fps: 1.2 }]);
    r.light = { on: 0.5, period: 9 };
  },

  // gimnasio en casa: estirar y saltar
  gym(r) {
    const { rng, w } = r;
    r.wall = 'stripes';
    r.at(misc.mat, 1, 6);
    r.actor([{ x: 2, dur: 99, pose: ['up', 'stand'], fps: 2 }]);
    r.floor(misc.dumbbell, 8);
    r.decor(home.mirror, 2);
    if (w >= 16) r.floor(pick(rng, PLANTS), w - 5);
    r.light = { on: 0.8, period: 12 };
  },
};

export const TYPES = {
  kitchen: { min: 20, max: 34 },
  bedroom: { min: 20, max: 32 },
  tv: { min: 18, max: 34 },
  party: { min: 24, max: 44 },
  music: { min: 14, max: 26 },
  office: { min: 17, max: 30 },
  bath: { min: 14, max: 22 },
  plants: { min: 12, max: 24 },
  kids: { min: 18, max: 26 },
  dining: { min: 20, max: 32 },
  laundry: { min: 14, max: 28 },
  studio: { min: 17, max: 24 },
  moving: { min: 18, max: 24 },
  gym: { min: 12, max: 18 },
};

export function buildRoom(type, w, rng) {
  const r = new Room(type, w, rng);
  BUILD[type](r);
  // lámpara de techo en el lugar libre más central
  if (!r.lamps.length) {
    const mid = Math.floor(w / 2) - 2;
    for (let d = 0; d < w; d++) {
      const x = mid + (d & 1 ? -1 : 1) * (d >> 1);
      if (x < 1 || x > w - 6) continue;
      let ok = true;
      for (let c = x; c < x + 5; c++) if (r.wallUsed[c] || r.top[c] <= 3) ok = false;
      if (ok) {
        r.lamp(x);
        break;
      }
    }
  }
  if (rng.chance(0.5)) r.flip();
  return r.done();
}
