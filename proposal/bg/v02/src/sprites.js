// Biblioteca de sprites originales. Los vehículos y el mobiliario grande se
// arman con cajas en la misma proyección (así sus aristas siguen la grilla);
// la gente, los animales y los árboles son dibujos a mano, de pie.

import { box, sprite, frames, segZ, segX, segY, SP } from './iso.js';
import { Face } from './face.js';
import { Grid } from './grid.js';

const g = () => new Grid(30);
const P = (rows, ax = 1) => sprite(rows, ax, rows.length, 1);

// --- vehículos a lo largo de y (la avenida) ---------------------------------
// Dibujados a mano en diagonal: se ven desde arriba, con las ruedas del lado
// oeste asomando. dir +1 va al sur (abajo a la derecha, trompa abajo);
// dir −1 va al norte (trompa arriba). Ancla: el centro del auto en el piso.

const V = (rows, ax, ay) => ({ ...sprite(rows, ax, ay, 0) });

const CAR_ROWS = {
  auto: ['  _____', ' (_R_R_\\', '0)\\ ___ \\', '   \\|   |\\', '    \\|___|\\', '   0)\\ .-. \\', '      \\F___F)'],
  taxi: ['  _____', ' (_R_R_\\', '0)\\ ___ \\', '   \\|▒▒▒|\\', '    \\|___|\\', '   0)\\ .-. \\', '      \\F___F)'],
  hatch: ['  _____', ' (_R_R_\\', '0)\\|   |\\', '   \\|___|\\', '    \\ .-. \\', '   0)\\F___F)'],
  furgon: ['  _____', ' (_R_R_\\', '0)\\     \\', '   \\     \\', '    \\     \\', '   0)\\_____\\', '      \\ .-. \\', '       \\F___F)'],
  camion: ['  _____', ' (_R_R_\\', '0)\\:::::\\', '   \\:::::\\', '    \\:::::\\', '   0)\\_____\\', '      \\|___|\\', '     0)\\F___F)'],
};

export function carY(kind = 'auto', dir = 1) {
  const rows = CAR_ROWS[kind].map((r) =>
    dir > 0 ? r.replace(/R/g, '.').replace(/F/g, 'o') : r.replace(/R/g, 'o').replace(/F/g, '.'),
  );
  // el centro del auto: fila del medio, columna del medio de esa fila
  const h = rows.length;
  const mid = Math.floor(h / 2);
  return V(rows, mid + 3, mid + 1);
}

export function busY(dir = 1, route = '210') {
  const G = g();
  box(G, 0, 3, 0, 11, 0, 3, { noFloor: true });
  const L = new Face('L', 0);
  // banda de ventanas con pasajeros entre v = 1 y v = 2
  L.seg(G, 0, 1, 'u', 11, null, -0.4);
  L.seg(G, 0, 2, 'u', 11, null, -0.4);
  for (let u = 1; u < 11; u++) L.at(G, u, 1.5, u % 3 === 0 ? '/' : u % 3 === 1 ? 'o' : ' ', -0.5);
  if (dir > 0) {
    L.at(G, 8, 0.5, '|', -0.5);
    L.at(G, 7, 0.5, '|', -0.5);
  }
  L.at(G, 2, 0.5, '0', -0.5);
  L.at(G, 9.5, 1, '0', -0.5);
  const F = new Face('F', 11);
  if (dir > 0) {
    F.text(G, 0.5, 2, route, -0.6);
    F.at(G, 0.5, 0.5, 'o', -0.5);
    F.at(G, 2.5, 0.5, 'o', -0.5);
    F.seg(G, 0, 1, 'u', 3, '_', -0.5);
  } else {
    F.at(G, 0.5, 0.5, '.', -0.5);
    F.at(G, 2.5, 0.5, '.', -0.5);
    F.text(G, 0.5, 1, route, -0.6);
  }
  // en el techo: ventilación
  const T = new Face('T', 3);
  T.at(G, 1.5, 3.5, '=', -0.5);
  T.at(G, 1.5, 8.5, '=', -0.5);
  const s = G.toSprite();
  // ancla al centro (y = 5.5)
  s.ay -= 0;
  return s;
}

// --- vehículos a lo largo de x (las transversales), de perfil -----------------
const CARX_ROWS = {
  auto: ['   ____', ' _/_|__\\_', '(_0)__(0_)'],
  sedan: ['    _____', ' __/_/_|_\\__', '(__(0)__(0)_)'],
  furgon: [' _______', '|  |    \\_', '(0)____(0_)'],
  moto: ['  o', ' _|>', '(o)(o)'],
};
export function carX(kind = 'auto', dir = 1) {
  const rows = CARX_ROWS[kind];
  const s = V(rows, Math.floor(rows[rows.length - 1].length / 2), rows.length);
  s.flip = dir < 0;
  return s;
}

// micro de perfil (a lo largo de x): ventanillas /o/ en la cara sur
export function busX(dir = 1, route = '312') {
  const G = g();
  box(G, 0, 9, 0, 2, 0, 3, { noFloor: true });
  const F = new Face('F', 2);
  for (let i = 0; i < 7; i++) {
    const u = 1 + i;
    F.seg(G, u, 1, 'v', 1, '/', -0.4);
    F.at(G, u + 0.5, 1.5, i % 3 === 1 ? ' ' : 'o', -0.5);
  }
  F.seg(G, 8, 1, 'v', 1, '/', -0.4);
  F.seg(G, 1, 1, 'u', 7, '_', -0.4);
  F.seg(G, 1, 2, 'u', 7, '_', -0.4);
  F.at(G, 1.5, 0.5, '0', -0.5);
  F.at(G, 7.5, 0.5, '0', -0.5);
  void route;
  void dir;
  return G.toSprite();
}

// carrito de vendedor ambulante
export const CARTS = {
  mani: P([' .-^^-.', '   |', ' __|__', '|MANI |', "'o---o'"], 3),
  helados: P([' .-^^-.', '   |', ' __|__', '|HELAD|', "'o---o'"], 3),
  sopaipillas: P(['  ___', ' |___|', '|SOPAI|', "'o---o'"], 3),
  mote: P([' .-^^-.', '   |', ' __|__', '|MOTE |', "'o---o'"], 3),
};

// --- gente, bichos y bicicletas (dibujados de pie) ------------------------

export const PEOPLE = {
  walk: [
    [P([' o', '/)', '/ \\']), P([' o', '(|', ' |\\'])],
    [P([' o', '(|)', ' /\\']), P([' o', '(|)', ' ||'])],
    [P([' °', '/|o', '/ \\']), P([' °', '/|o', ' |\\'])],
    [P([' o', '/▒\\', ' /\\']), P([' o', '/▒\\', ' ||'])],
  ],
  stand: [P([' o', '(|)', ' ||']), P([' o', '/|\\', ' ||']), P([' o', '|▒|', ' ||']), P([' °', '(|o', ' ||'])],
  sit: [P([' o', '(|_', ' |']), P([' o', '/|_', ' L'])],
  kid: [P([' o', ' ^'], 1), P([' °', ' A'], 1)],
  umbrella: [P(['.-^-.', '  o', ' /)', ' /\\'], 2), P(['.-^-.', '  o', ' (|', '  |\\'], 2)],
};

export const person = (rows, ax = 1) => P(rows, ax);

export const DOG = [P(['  ,o', '~(__)', ' /  \\'], 2), P(['  ,o', '-(__)', ' |  |'], 2), P(['  ,o', '~(__)', ' ||'], 2)];
export const PIGEON = {
  ground: [P(['o>'], 0), P(['o.'], 0), P(['<o'], 0)],
  fly: [P(['v'], 0), P(['^'], 0), P(['-v-'], 1)],
};

export const BIKE = [P(['  o', ' <|\\', 'O-\\\\', '   \\O'], 1), P(['  o', ' (|\\', 'O-\\|', '   \\O'], 1)];
export const BIKE_X = [P(['  o', ' /\\,', "O-'O"], 1), P(['  o', ' |\\,', "O-'O"], 1)];

// --- mobiliario -----------------------------------------------------------

export const TREE = [
  P(['  .-~~-.', ' (: : ` )', '(  : :  _)', " `-._.-'", '    /', '   /'], 4),
  P([' .--.', "( : ')", " `/-'", '  /'], 2),
  P(['   _.-._', ' .( : : ).', '( : ` : : )', ' `-.___.-\'', '     /', '    /'], 5),
];

export function lamp(h = 6) {
  const G = g();
  segZ(G, 0, 0, 0, h, 47, -0.2);
  segX(G, 0, 0, h, 1, 175, -0.2);
  const F = new Face('F', 0);
  F.at(G, 1.25, h - 0.5, 'o', -0.4);
  return G.toSprite();
}

export function bench() {
  const G = g();
  box(G, 0, 1, 0, 3, 0, 1, { top: () => 95 });
  return G.toSprite();
}


export function labItems() {
  const items = [
    ['auto', carY('auto', 1)],
    ['taxi', carY('taxi', -1)],
    ['hatch', carY('hatch', 1)],
    ['furgon', carY('furgon', -1)],
    ['camion', carY('camion', 1)],
    ['micro', busY(1)],
    ['micro N', busY(-1)],
    ['autoX', carX('auto', 1)],
    ['sedanX', carX('sedan', 1)],
    ['furgonX', carX('furgon', -1)],
    ['moto', carX('moto', 1)],
    ['microX', busX(-1)],
    ...Object.entries(CARTS),
  ];
  PEOPLE.walk.forEach((f, i) => f.forEach((s, j) => items.push([`w${i}${j}`, s])));
  PEOPLE.stand.forEach((s, i) => items.push([`s${i}`, s]));
  PEOPLE.sit.forEach((s, i) => items.push([`sit${i}`, s]));
  PEOPLE.kid.forEach((s, i) => items.push([`k${i}`, s]));
  PEOPLE.umbrella.forEach((s, i) => items.push([`u${i}`, s]));
  DOG.forEach((s, i) => items.push([`dog${i}`, s]));
  PIGEON.ground.forEach((s, i) => items.push([`pg${i}`, s]));
  PIGEON.fly.forEach((s, i) => items.push([`pf${i}`, s]));
  BIKE.forEach((s, i) => items.push([`bk${i}`, s]));
  BIKE_X.forEach((s, i) => items.push([`bx${i}`, s]));
  TREE.forEach((s, i) => items.push([`tree${i}`, s]));
  items.push(['farol', lamp()]);
  items.push(['banca', bench()]);
  return items;
}

void frames;
void segY;
void SP;
