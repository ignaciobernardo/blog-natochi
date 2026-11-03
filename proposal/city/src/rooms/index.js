// Elige y arma el interior de un lugar.
//
// Cada interior es una habitación en perspectiva (room.js) armada una vez en
// una grilla base; lo que se mueve (gente, vapor, relojes, la tele) lo dibuja
// `anim(g, t)` encima en cada cuadro. Los constructores reciben:
//   room    la caja (con sus ayudas de perspectiva) ya creada
//   place   el lugar de la calle: { kind, shop, zone, floors, street, number, seed, ... }
//   target  por dónde se entró: { type: 'puerta' | 'ventana', win }
//   night   de noche o de día
//   rng     azar con la semilla del lugar
// y devuelven { anim(g, t) } (opcional) y pueden fijar room.name / room.sub.
import { Room } from './room.js';
import { Rng, copyGrid } from './util.js';
import { buildShop } from './local.js';
import { buildHome } from './casa.js';
import { buildLandmark } from './hitos.js';
import { buildPersonal } from './personal.js';

export class Interior {
  constructor(place, target, cols, rows, night) {
    this.place = place;
    this.target = target;
    const seed = (place.seed || 1) * 31 + (target.win ? target.win.seed % 9973 : 7);
    const rng = new Rng(seed);
    const room = new Room(cols, rows);
    this.room = room;
    let built;
    if (place.personal) built = buildPersonal(room, place, target, night, rng);
    else if (place.kind === 'local' && target.type === 'puerta') built = buildShop(room, place, target, night, rng);
    else if (place.kind === 'local' || place.kind === 'casa') built = buildHome(room, place, target, night, rng);
    else built = buildLandmark(room, place, target, night, rng);
    this.anim = (built && built.anim) || null;
    this.name = room.name || place.name || '';
    this.sub = room.sub || '';
    this.base = room.g;
  }

  draw(out, t) {
    copyGrid(out, this.base);
    if (this.anim) this.anim(out, t);
  }
}

export function makeInterior(place, target, cols, rows, night) {
  return new Interior(place, target, cols, rows, night);
}
