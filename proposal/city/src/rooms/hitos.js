// Interiores de los hitos: el Cine Rex, la parroquia, el Mercado Central y la
// obra. Cada uno vive en su archivo (hitos-*.js); acá sólo se elige.
import { buildCine } from './hitos-cine.js';
import { buildIglesia } from './hitos-iglesia.js';
import { buildMercado } from './hitos-mercado.js';
import { buildObra } from './hitos-obra.js';

const BUILDERS = { cine: buildCine, iglesia: buildIglesia, mercado: buildMercado, obra: buildObra };

export function buildLandmark(room, place, target, night, rng) {
  room.name = place.name || place.kind.toUpperCase();
  room.sub = place.street || '';
  const build = BUILDERS[place.kind] || buildCine;
  return build(room, place, target, night, rng);
}
