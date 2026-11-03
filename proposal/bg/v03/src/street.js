// La calle: el suelo, la vereda con sus cosas, los postes con la maraña de
// cables, y lo que se mueve (micros, autos, taxis, bicicletas, gente, perros).
//
// Profundidades (z) de adelante hacia atrás, al final del viaje:
//   1.00  base de la cuadra (línea de fachada)
//   0.94  gente caminando por la vereda de enfrente
//   0.92  quiosco, paradero, árboles, faroles, carrito
//   0.89  postes y cables
//   0.88  solera
//   0.80  pista sólo bus (van a la derecha)
//   0.67  pista del medio (a la derecha)
//   0.56  pista de adelante (a la izquierda)
//   0.50  solera de este lado
//   0.47  gente en la vereda de este lado; 0.44 bolardos, bancas
import { Canvas, SP, sprite } from './grid.js';
import { rope } from './paint.js';
import { hash2 } from './rng.js';

// espejo horizontal de una plantilla (para lo que va hacia la izquierda)
const MIRROR = { '/': '\\', '\\': '/', '(': ')', ')': '(', '[': ']', ']': '[', '<': '>', '>': '<', '{': '}', '}': '{', '´': '`', '`': '´', "'": '`' };
function mirrorText(src) {
  const lines = src.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n');
  const frames = [];
  let cur = [];
  for (const l of lines) {
    if (l === '~~') {
      frames.push(cur);
      cur = [];
    } else cur.push(l);
  }
  frames.push(cur);
  return frames
    .map((f) => {
      const w = Math.max(...f.map((l) => [...l].length));
      return f.map((l) => [...l.padEnd(w, ' ')].reverse().map((c) => MIRROR[c] || c).join('')).join('\n');
    })
    .join('\n~~\n');
}
// las letras de los letreros no se espejan: se escriben aparte
const both = (src) => ({ r: sprite(src), l: sprite(mirrorText(src)) });

// ---------------------------------------------------------------------------
// Vehículos (de perfil, mirando a la derecha). Dos frames: ruedas que giran.

const CAR = both(String.raw`
      _______
  ___/__|___\___
 |  _      _    |=
 |_(o)____(o)___|
~~
      _______
  ___/__|___\___
 |  _      _    |=
 |_(+)____(+)___|
`);

const CAR2 = both(String.raw`
     ________
  __/  |  |  \____
 |_    |  |   __  |=
 ´-(o)-----(o)-´¯´
~~
     ________
  __/  |  |  \____
 |_    |  |   __  |=
 ´-(+)-----(+)-´¯´
`);

const TAXI = both(String.raw`
        [    ]
   ______||______
  /__|___|___\___\
 |  _    _    _   |=
 |_(o)________(o)_|
~~
        [    ]
   ______||______
  /__|___|___\___\
 |  _    _    _   |=
 |_(+)________(+)_|
`);

const MICRO = both(String.raw`
 ___________________________________________
|      |   |   |   |   |   |   |   |   |  |_\
|______|___|___|___|___|___|___|___|___|____|
|  .-.                            .-.       |
´-( o )--------------------------( o )------´
   ´-´                            ´-´
~~
 ___________________________________________
|      |   |   |   |   |   |   |   |   |  |_\
|______|___|___|___|___|___|___|___|___|____|
|  .-.                            .-.       |
´-( + )--------------------------( + )------´
   ´-´                            ´-´
`);

const GAS = both(String.raw`
 ___________
|    GAS    |___
| (=)(=)(=) |___\___
|___________|_  _   |
 ´(o)´¯¯¯¯´(o)´¯(o)´
~~
 ___________
|    GAS    |___
| (=)(=)(=) |___\___
|___________|_  _   |
 ´(+)´¯¯¯¯´(+)´¯(+)´
`);

const BIKE = both(String.raw`
   o
  /|\_
 (o)¯(o)
~~
   o
  /|>_
 (+)¯(+)
`);

const MOTO = both(String.raw`
      .--.
   o_ |##|
  /|_\|__|
 (o)¯¯¯(o)
~~
      .--.
   o_ |##|
  /|_\|__|
 (+)¯¯¯(+)
`);

// pasajeros que se asoman por las ventanas de la micro
const MICRO_WIN = [7, 11, 15, 19, 23, 27, 31, 35];

// ---------------------------------------------------------------------------
// Gente y perros (dos frames de caminata)

const PEOPLE = [
  both(String.raw`
 o
/|\
/ \
~~
 o
/|\
 |
`),
  both(String.raw`
 o
/|)
/ \
~~
 o
(|\
 |
`),
  both(String.raw`
 o
/|\b
/ \
~~
 o
/|\b
 |
`),
  both(String.raw`
 o
<|\
/ >
~~
 o
<|\
 |
`),
  // con paraguas (para el sol)
  both(String.raw`
.-.
 |o
/|\
/ \
~~
.-.
 |o
/|\
 |
`),
  // con carro de feria
  both(String.raw`
 o
/|\_
/ \(_)
~~
 o
/|\_
 | (_)
`),
];

const DOG = both(String.raw`
o´´´-.__~
 /\¯¯¯/\
~~
o´´´-.__~
 ||¯¯¯||
`);

// ---------------------------------------------------------------------------
// Cosas fijas de la vereda

const KIOSK = sprite(String.raw`
  ._______________________.
 /_|_|_|_|_|_|_|_|_|_|_|_|_\
  |  DIARIOS  ·  CONFITES |
.¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯.
|[]|##|[]|  ___  |[]|##|[]|
|[]|##|[]|   o   |[]|##|[]|
|[]|==|[]|  /|\  |[]|==|[]|
|__|__|__|_______|__|__|__|
`);

const PARADERO = sprite(String.raw`
.____________________________.
|____________________________|
 |   PARADERO 14           |
 |   210  B03  506  D18    |
 |                         |
 |   ___________________   |
 |  |___________________|  |
 |__|                   |__|
`);

const TREE = sprite(String.raw`
       _.--.--._
     .´:  .  :  ´.
   .´. :  .  : .  ´.
  ( . :  .  :  . :  )
 (. : . :  .  : . : .)
  ´-._ :  ||  : _.-´
      ´-. || .-´
         ´||´
          ||
          ||
          ||
         _||_
`);

const LAMP = sprite(String.raw`
 ___
(___)
  |
  |
  |
  |
  |
  |
  |
  |
 _|_
`);

const CART = sprite(String.raw`
       .-.
      (o o)
    ___|=|___
   [SOPAIPILLAS]
   |__________|
    (o)    (o)
`);

const BIN = sprite(String.raw`
 ___
[___]
|. .|
|___|
`);

const HYDRANT = sprite(String.raw`
 _
[=]
| |
`);

const SIGN = sprite(String.raw`
 .-.
(PARE)
 ´|´
  |
  |
  |
 _|_
`);

const STREET_SIGN = sprite(String.raw`
.-------------.
| AV. LOS AROMOS|
´-------------´
      |
      |
      |
      |
      |
     _|_
`);

const BENCH = sprite(String.raw`
 _______
|_______|
 |     |
`);

// ---------------------------------------------------------------------------
// Postes con cables. Devuelve el lienzo y los puntos donde se posan pájaros.

const POLE = sprite(String.raw`
_T__T_|_T__T_
      |
     [=]
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
      |
     _|_
`);

export function buildPoles(rng, w, h = 28) {
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  const poles = [];
  const top = base - POLE.h + 1;
  for (let x = 6; x < w - 10; x += rng.int(38, 52)) poles.push(x);
  const perches = [];
  const shoes = [];
  // cables: de cada poste al siguiente, pocos y con flechas bien distintas
  // para que se lean como curvas (y no como una maraña plana)
  for (let i = 0; i < poles.length; i++) {
    const a = poles[i];
    const b = i + 1 < poles.length ? poles[i + 1] : poles[0] + w;
    const anchors = [
      [0, 0, rng.range(2.4, 3.4)],
      [12, 0, rng.range(4.6, 6)],
      [4, 0, rng.range(1.2, 1.8)],
    ];
    for (const [k, dy, sag] of anchors) {
      if (rng.chance(0.1)) continue;
      const y = top + dy + 0.5;
      rope(cv, a + k, y, b + k, y, sag);
      if (rng.chance(0.5)) {
        const t = rng.range(0.25, 0.75);
        const px = Math.round(a + k + (b - a) * t);
        const py = Math.floor(y + sag * 4 * t * (1 - t)) - 1;
        perches.push([px, py]);
      }
    }
    // un rollo de cable enredado en el poste
    if (rng.chance(0.5)) cv.text(a + 5, top + 6, '(O)');
    // zapatillas colgando de un cable
    if (rng.chance(0.45)) {
      const t = rng.range(0.3, 0.7);
      const sag = 2.6;
      const sx = Math.round(a + (b - a) * t);
      const sy = Math.floor(top + 0.5 + sag * 4 * t * (1 - t));
      shoes.push([sx, sy]);
    }
  }
  for (const [sx, sy] of shoes) {
    cv.put(sx, sy + 1, 124);
    cv.put(sx + 2, sy + 1, 124);
    cv.put(sx, sy + 2, 74);
    cv.put(sx + 2, sy + 2, 76);
  }
  // volantín enredado
  const kx = poles[1] + 18;
  cv.text(kx, top - 3, '/\\');
  cv.text(kx, top - 2, '\\/');
  cv.text(kx + 1, top - 1, '~');
  cv.text(kx + 2, top, '~');
  // acometida: un cable que baja del poste hacia una fachada
  for (const a of poles) {
    if (rng.chance(0.4)) rope(cv, a + 13, top + 0.5, a + 22, top - 4, -0.6);
    cv.stamp(POLE, a, top);
  }
  return { cv, perches, poles };
}

// ---------------------------------------------------------------------------
// La vereda de enfrente: lienzo con quiosco, paradero, árboles, faroles...

export function buildSidewalk(rng, w, h = 14) {
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  const steam = [];
  const lamps = [];
  const mid = Math.floor(w / 2);
  const place = (s, x) => cv.stamp(s, x, base - s.h + 1);
  // los protagonistas cerca del centro de pantalla
  place(KIOSK, mid + 22);
  place(PARADERO, mid - 58);
  place(CART, mid - 16);
  steam.push([mid - 16 + 7, base - CART.h]);
  place(BIN, mid + 52);
  place(HYDRANT, mid - 24);
  place(BENCH, mid + 60);
  // árboles, faroles y señales repartidos
  let x = 4;
  while (x < w - 20) {
    if (Math.abs(x - (mid + 22)) < 34 || Math.abs(x - (mid - 58)) < 36 || Math.abs(x - (mid - 16)) < 16) {
      x += 8;
      continue;
    }
    const r = rng.next();
    if (r < 0.35) {
      place(TREE, x);
      x += TREE.w + rng.int(6, 16);
    } else if (r < 0.6) {
      place(LAMP, x);
      lamps.push([x + 1, base - LAMP.h + 1]);
      x += rng.int(14, 24);
    } else if (r < 0.7) {
      place(SIGN, x);
      x += rng.int(12, 20);
    } else if (r < 0.78) {
      place(BIN, x);
      x += rng.int(8, 14);
    } else if (r < 0.84) {
      place(STREET_SIGN, x);
      x += STREET_SIGN.w + 8;
    } else x += rng.int(6, 12);
  }
  return { cv, steam, lamps };
}

// ---------------------------------------------------------------------------
// La vereda de este lado (z ~0.44): solo asoma abajo de la pantalla.

const BOLLARD = sprite(String.raw`
.-.
| |
| |
`);
const RACK = sprite(String.raw`
 .-. .-. .-.
 | | |o| | |
_|_|_|_|_|_|_
`);
const PARKED_BIKE = sprite(String.raw`
  __o
 /\ \
(o)¯(o)
`);
const NEWS = sprite(String.raw`
 ______
|DIARIO|
|¯¯¯¯¯¯|
|______|
`);
const TRUNK = sprite(String.raw`
 ||  |
 | | |
 |  ||
`);

export function buildNearProps(rng, w, h = 6) {
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  let x = 3;
  while (x < w - 16) {
    const s = rng.pick([BOLLARD, BOLLARD, BOLLARD, BOLLARD, RACK, PARKED_BIKE, PARKED_BIKE, TRUNK, TRUNK, BENCH, BIN, HYDRANT]);
    cv.stamp(s, x, base - s.h + 1);
    x += s.w + rng.int(8, 26);
  }
  return { cv };
}

// ---------------------------------------------------------------------------
// El suelo: un "fragment shader" por fila. Para cada fila bajo el horizonte,
// la profundidad del suelo es z = C / (fila - horizonte).

export const Z = {
  facade: 1.0,
  walkers: 0.94,
  props: 0.92,
  poles: 0.89,
  curb: 0.88,
  laneFar: 0.8,
  laneMid: 0.67,
  laneNear: 0.56,
  curbNear: 0.5,
  walkersNear: 0.47,
  propsNear: 0.44,
};

export function drawGround(scr, scene) {
  const { hr, C, camX, cx } = scene;
  const { cols, rows } = scr;
  // líneas entre pistas: un poco detrás de cada pista (la base de los autos)
  const laneA = Z.laneMid + 0.035;
  const laneB = Z.laneNear + 0.03;
  const busRow = Math.floor(hr + C / (Z.laneFar + 0.02));
  for (let r = hr + 1; r < rows; r++) {
    const z = C / (r + 0.5 - hr);
    const zTop = C / (r - hr);
    const zBot = C / (r + 1 - hr);
    const row = r * cols;
    const cross = (a) => zTop >= a && zBot < a;
    for (let c = 0; c < cols; c++) {
      const X = (c + 0.5 - cx) * z + camX;
      const xi = Math.floor(X);
      let ch = SP;
      if (z > Z.facade) {
        // detrás de la fachada (se ve por los pasajes): calle lateral
        ch = (Math.floor(X / 2) + r) % 3 === 0 ? 46 : SP;
      } else if (z > Z.curb) {
        // vereda: baldosas y alcorques
        ch = xi % 3 === 0 ? 46 : SP;
      } else if (cross(Z.curb)) {
        ch = 175; // solera
      } else if (z > Z.curbNear) {
        // calzada: línea segmentada entre las pistas que van al mismo lado,
        // doble línea al centro; asfalto con grietas, parches y manchas
        if (cross(laneA)) ch = Math.floor(X / 3) % 3 === 0 ? SP : 45;
        else if (cross(laneB)) ch = Math.floor(X / 2) % 2 ? 61 : 45;
        else {
          const h = hash2(Math.floor(X / 1.5), Math.floor(z * 50));
          ch = h < 0.07 ? 46 : h < 0.085 ? 44 : h < 0.092 ? 39 : h < 0.097 ? 95 : SP;
        }
      } else if (cross(Z.curbNear)) {
        ch = 95;
      } else {
        // vereda de este lado: baldosas grandes
        ch = (xi % 4 === 0) ? 124 : (r % 2 ? 46 : SP);
      }
      scr.d[row + c] = ch;
    }
  }
  // tapas de alcantarilla junto a la solera
  const curbRow = Math.floor(hr + C / Z.curb);
  const nearRow = Math.floor(hr + C / Z.curbNear);
  for (let X = -600; X < 600; X += 70) {
    const c = Math.floor(cx + (X - camX) / Z.curb);
    if (c > -6 && c < cols) scr.text(c, curbRow + 1, '[|||]');
  }
  // SOLO BUS pintado en la pista de atrás
  if (busRow > hr && busRow < rows) {
    for (let X = -900; X < 900; X += 150) {
      const c = Math.floor(cx + (X - camX) / 0.8);
      if (c > -10 && c < cols) scr.text(c, busRow, 'SOLO BUS');
    }
  }
  // flechas pintadas en las pistas
  for (const [z, txt, step] of [[Z.laneMid + 0.01, '--->', 110], [Z.laneNear + 0.005, '<---', 130]]) {
    const r = Math.floor(hr + C / z);
    if (r <= hr || r >= rows) continue;
    for (let X = -900; X < 900; X += step) {
      const c = Math.floor(cx + (X - camX) / z);
      if (c > -6 && c < cols) scr.text(c, r, txt);
    }
  }
}

// ---------------------------------------------------------------------------
// Lo que se mueve

export class Traffic {
  constructor(rng) {
    this.L = 900; // largo del circuito (unidades de mundo)
    const fleet = (dir, n, bus = false) => {
      const list = [];
      let x = 0;
      for (let i = 0; i < n; i++) {
        const kind = bus ? rng.pick(['micro', 'micro', 'micro', 'taxi', 'bike']) : rng.pick(['car', 'car2', 'car', 'taxi', 'micro', 'gas', 'moto', 'bike', 'car2', 'car']);
        const s = { car: CAR, car2: CAR2, taxi: TAXI, micro: MICRO, gas: GAS, moto: MOTO, bike: BIKE }[kind];
        list.push({ kind, s: dir > 0 ? s.r : s.l, x, route: rng.pick(['210', 'B03', '506', 'D18', '401', 'I09']) });
        x += s.r.w + rng.int(6, 40);
      }
      list.L = Math.max(900, x + 20);
      return list;
    };
    this.far = { dir: 1, v: 13, list: fleet(1, 14, true) };
    this.mid = { dir: 1, v: 19, list: fleet(1, 14) };
    this.near = { dir: -1, v: 22, list: fleet(-1, 15) };
    this.walkers = [];
    for (let i = 0; i < 40; i++) {
      const dir = rng.chance(0.5) ? 1 : -1;
      const dog = rng.chance(0.18);
      const s = dog ? DOG : rng.pick(PEOPLE);
      this.walkers.push({ s: dir > 0 ? s.r : s.l, dir, x: rng.range(0, this.L), v: dog ? rng.range(2.5, 4) : rng.range(1.2, 2.4), near: rng.chance(0.35), ph: rng.range(0, 1) });
    }
  }

  draw(scr, scene, t, which) {
    const { cx, camX, hr, C } = scene;
    const L = this.L;
    if (which === 'walkersFar' || which === 'walkersNear') {
      const z = which === 'walkersFar' ? Z.walkers : Z.walkersNear;
      const base = Math.floor(hr + C / z);
      for (const p of this.walkers) {
        if (p.near !== (which === 'walkersNear')) continue;
        const x = p.x + p.dir * p.v * t;
        const f = Math.floor(t * p.v * 1.4 + p.ph * 2) % 2;
        scr.stampWrap(p.s, cx + (x - camX) / z, base - p.s.h + 1, Math.round(L / z), f);
      }
      return;
    }
    const lane = which === 'laneFar' ? this.far : which === 'laneMid' ? this.mid : this.near;
    const z = Z[which];
    const base = Math.floor(hr + C / z);
    const P = Math.round(lane.list.L / z);
    for (const v of lane.list) {
      const x = v.x + lane.dir * lane.v * t;
      const col = cx + (x - camX) / z;
      const f = Math.floor(t * 8) % 2;
      const y = base - v.s.h + 1 + (v.kind === 'micro' || v.kind === 'gas' ? 0 : 0);
      scr.stampWrap(v.s, col, y, P, f);
      // detalles que no se espejan: número de la micro, pasajeros, faros
      const left = ((Math.floor(col) % P) + P) % P;
      for (let k = left - P; k < scr.cols; k += P) {
        if (k + v.s.w < 0) continue;
        if (v.kind === 'micro') {
          const nx = lane.dir > 0 ? k + 2 : k + v.s.w - 6;
          scr.text(nx, y + 1, v.route);
          for (const wx of MICRO_WIN) {
            const px = lane.dir > 0 ? k + wx + 2 : k + v.s.w - wx - 3;
            if (hash2(wx, v.x) < 0.6) scr.put(px, y + 1, 111);
          }
        } else if (v.kind === 'taxi') {
          scr.text(lane.dir > 0 ? k + 9 : k + v.s.w - 13, y, 'TAXI');
        } else if (v.kind === 'gas') {
          scr.text(lane.dir > 0 ? k + 5 : k + v.s.w - 8, y + 1, 'GAS');
        }
        if (scene.night && v.kind !== 'bike') {
          // haz de los focos
          const fy = y + v.s.h - 2;
          const fx = lane.dir > 0 ? k + v.s.w : k - 4;
          scr.text(fx, fy, lane.dir > 0 ? '=--·' : '·--=');
        }
      }
    }
  }
}

