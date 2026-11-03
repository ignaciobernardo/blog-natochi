// Mobiliario de la calle: árboles, faroles, bancas, basureros, paraderos,
// quioscos, postes de semáforo, bicicleteros. Todo original, en la misma
// proyección (los postes suben en diagonal como las aristas de los edificios).

import { box, segX, segY, segZ, sprite, stamp } from './iso.js';
import { Face } from './face.js';

const cc = (s) => s.charCodeAt(0);
const S = (rows, ax = 0) => sprite(rows, ax, rows.length, 1);

// copas de árbol: el ancla es la base del tronco
export const TREES = [
  S(['   .-~~-.', ' .(  : : ).', '( : .  ` : )', " `-.__.-'", '     /', '    /'], 5),
  S(['  .--.', '.( : `).', '(` : : )', " `-/-'", '   /'], 3),
  S(['   .-.-.', ' .( :  :).', '( `  : ` )', ' (_ : :_)', "   `/-'", '   /'], 4),
  S(['  _', ' (:)', '(:`:)', " `/'", ' /'], 2),
];
// palmera del bandejón
export const PALM = S(['  \\|/', ' --o--', '  /|\\', '  /', ' /', '/'], 2);
const TRASH = S(['.-.', '|_|'], 1);
const HYDRANT = S(['o', 'U'], 0);
const RACK = S(['n n n'], 2);
const POTS = [S(['*'], 0), S(['&'], 0), S(['"*'], 0)];
const PHONE = S(['.-.', '|T|', '| |'], 1);
const MAILBOX = S(['.--.', '|==|', ' ||'], 1);
const SIGN_BUS = S(['.---.', '|210|', "'---'", '  |', '  |', '  |'], 2);

export function tree(t, x, y, k = 0) {
  stamp(t, TREES[k % TREES.length], x, y, 0, -1);
  // alcorque
  segX(t, x - 0.5, y + 0.5, 0, 1, cc('_'), -0.2);
}

export function palm(t, x, y) {
  stamp(t, PALM, x, y, 0, -1);
}

// farol: poste en diagonal, brazo hacia `side` (+1 este, −1 oeste) y foco
export function lamp(t, x, y, side = 1, h = 7, anims) {
  segZ(t, x, y, 0, h, 47, -1);
  if (side > 0) {
    segX(t, x, y, h, 1, cc('_'), -1);
    const F = new Face('F', y);
    F.at(t, x + 1.25, h - 0.5, 'o', -1.2);
  } else {
    segX(t, x - 1, y, h, 1, cc('_'), -1);
    const F = new Face('F', y);
    F.at(t, x - 0.75, h - 0.5, 'o', -1.2);
  }
  if (anims) anims.push({ type: 'lamp', x: x + side * 1.25, y, z: h - 1 });
}

// farol doble del bandejón
export function lamp2(t, x, y, h = 8, anims) {
  segZ(t, x, y, 0, h, 47, -1);
  segX(t, x - 1, y, h, 2, cc('_'), -1);
  const F = new Face('F', y);
  F.at(t, x - 0.75, h - 0.5, 'o', -1.2);
  F.at(t, x + 1.25, h - 0.5, 'o', -1.2);
  if (anims) {
    anims.push({ type: 'lamp', x: x - 0.75, y, z: h - 1 });
    anims.push({ type: 'lamp', x: x + 1.25, y, z: h - 1 });
  }
}

// banca a lo largo de y, con respaldo al oeste
export function bench(t, x, y, len = 3) {
  box(t, x, x + 1, y, y + len, 0, 1, { top: (c, r, u) => (u === x + 0.5 ? cc('_') : 0), left: () => cc('_'), bias: -0.4 });
}

export function trash(t, x, y) {
  stamp(t, TRASH, x, y, 0, -1);
}
export function hydrant(t, x, y) {
  stamp(t, HYDRANT, x, y, 0, -1);
}
export function rack(t, x, y) {
  stamp(t, RACK, x, y, 0, -1);
}
export function pot(t, x, y, k) {
  stamp(t, POTS[(((k | 0) % POTS.length) + POTS.length) % POTS.length], x, y, 0, -1);
}
export function phone(t, x, y) {
  stamp(t, PHONE, x, y, 0, -1);
}
export function mailbox(t, x, y) {
  stamp(t, MAILBOX, x, y, 0, -1);
}

// paradero: techo delgado, panel con mapa al norte, banca y letrero
export function busStop(t, x0, y0, len = 6) {
  const x1 = x0 + 2;
  // postes
  segZ(t, x0 + 0.5, y0 + 0.5, 0, 3, 47, -0.8);
  segZ(t, x0 + 0.5, y0 + len - 0.5, 0, 3, 47, -0.8);
  // panel norte con el mapa de recorridos
  const F = new Face('F', y0 + 0.5);
  F.rect(t, x0 + 0.5, x1, 0.5, 3, (c, r) => ((c + r) % 3 === 0 ? cc('▒') : cc(':')), -0.6);
  // banca
  box(t, x0 + 0.5, x0 + 1.5, y0 + 1.5, y0 + len - 1, 0, 1, { top: () => cc('_'), bias: -0.5 });
  // techo
  box(t, x0, x1 + 0.5, y0, y0 + len, 3, 4, { left: (c, r, u) => (Number.isInteger(u) ? cc('_') : 0), bias: -0.4 });
  // letrero de la parada
  stamp(t, SIGN_BUS, x1 + 0.5, y0 - 1, 0, -1);
}

// quiosco de diarios
export function kiosk(t, x0, y0, name = 'DIARIOS') {
  box(t, x0, x0 + 2.5, y0, y0 + 3, 0, 3, {
    left: (c, r) => ((c + r) % 2 ? cc('▒') : cc(':')),
    front: (c) => (c & 1 ? cc('|') : 0),
    bias: -0.3,
  });
  box(t, x0 - 0.5, x0 + 3.5, y0 - 0.5, y0 + 3.5, 3, 4, { left: (c, r, u) => (Number.isInteger(u) ? cc('/') : 0), bias: -0.4 });
  const F = new Face('F', y0 + 3.5);
  F.text(t, x0, 3, name.slice(0, 7), -1);
}

// entrada del metro: escalera que baja (rayada), baranda y letrero
export function metro(t, x0, y0, len = 5) {
  const x1 = x0 + 2;
  // los peldaños: rayas a lo largo de x, cada vez más hundidas
  for (let k = 0; k < len; k++) segX(t, x0 + 0.5, y0 + k + 1, 0, 1.5, cc('_'), 1.2);
  segY(t, x0, y0, 0, len, cc('\\'), 1.2);
  segY(t, x1, y0, 0, len, cc('\\'), 1.2);
  // baranda
  segY(t, x0, y0, 1, len, cc('\\'), -0.6);
  segY(t, x1, y0, 1, len, cc('\\'), -0.6);
  segX(t, x0, y0, 1, 2, cc('_'), -0.6);
  for (const [x, y] of [
    [x0, y0],
    [x0, y0 + len],
    [x1, y0],
    [x1, y0 + len],
  ]) {
    segZ(t, x, y, 0, 1, 47, -0.5);
  }
  // letrero
  segZ(t, x0 - 0.5, y0 - 1, 0, 4, 47, -0.8);
  const F = new Face('F', y0 - 1);
  F.rect(t, x0 - 1, x0 + 2, 4, 5, null, -2.4);
  F.text(t, x0 - 0.5, 4, 'METRO', -2.8);
}

// poste de semáforo con brazo sobre las pistas; los focos los dibuja la vida
export function signalPole(t, x, y, armTo, h = 7) {
  segZ(t, x, y, 0, h, 47, -1);
  const a = Math.min(x, armTo);
  segX(t, a, y, h, Math.abs(armTo - x), cc('_'), -1);
  // botonera peatonal
  const F = new Face('F', y);
  F.at(t, x + 0.25, 2.5, '=', -1.2);
}

void segY;
