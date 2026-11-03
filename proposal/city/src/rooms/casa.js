// Interior de un departamento o una oficina: se entra por la ventana que se
// tocó, así que lo que se veía en ella (un gato, alguien cocinando, la tele)
// está adentro. Por la puerta de calle de un edificio se entra al hall.
//
// La clave de la ventana elige el tipo de cuarto y lo que tiene que estar
// (casa-cuartos.js, casa-cuartos2.js); el barrio da el estilo (barrio
// modesto, antiguo con molduras y parquet, centro moderno) y el piso lo que
// se ve por las ventanas del fondo (azoteas y cerros desde arriba, el edificio
// del frente a media altura, un árbol desde abajo). Las oficinas están en
// casa-oficina.js y el hall en casa-hall.js.
import { Kit } from './casa-kit.js';
import * as C from './casa-cuartos.js';
import * as C2 from './casa-cuartos2.js';
import { office } from './casa-oficina.js';
import { lobby } from './casa-hall.js';

// qué cuarto y qué detalles para cada cosa vista en la ventana
function plan(K) {
  const key = K.key;
  const alt = K.h(1);
  switch (key) {
    case 'tele':
      return { room: 'tele', feat: { cat: alt < 0.35, couple: alt > 0.5 } };
    case 'gato':
      return { room: 'living', feat: { cat: true, people: alt < 0.5 ? 'sofa' : 'read' } };
    case 'gatito':
      return alt < 0.5 ? { room: 'ninos', feat: { kitten: true } } : { room: 'living', feat: { kitten: true, people: 'read' } };
    case 'cocina':
      return { room: 'cocina', feat: {} };
    case 'musica':
      return { room: 'musica', feat: { guitar: alt < 0.4 } };
    case 'pareja':
      return alt < 0.65 ? { room: 'comedor', feat: {} } : { room: 'living', feat: { people: 'couple' } };
    case 'escritorio':
      return { room: 'estudio', feat: {} };
    case 'libros':
      return { room: 'biblioteca', feat: {} };
    case 'planta':
    case 'planta2':
      return { room: 'plantas', feat: { cat: alt < 0.3 } };
    case 'reloj':
      return { room: 'living', feat: { people: 'read', bigClock: true, clocks: true } };
    case 'cuadro':
      return { room: 'taller', feat: {} };
    case 'pecera':
      return { room: 'living', feat: { fish: true, people: 'read' } };
    case 'jaula':
      return alt < 0.5 ? { room: 'cocina', feat: { cage: true } } : { room: 'living', feat: { cage: true, people: 'sofa', radio: true } };
    case 'nino':
      return { room: 'ninos', feat: {} };
    case 'persona':
      return { room: 'living', feat: { people: 'walk' } };
    case 'personaI':
      return { room: 'living', feat: { people: 'iron' } };
    case 'personaD':
      return { room: 'living', feat: { people: 'phone' } };
    case 'saluda':
      return { room: 'living', feat: { people: 'wave' } };
    case 'lampara':
      return alt < 0.5 ? { room: 'biblioteca', feat: {} } : { room: 'living', feat: { people: 'read' } };
    case 'cortinas':
    case 'cortinaI':
      return { room: 'dormitorio', feat: { front: key } };
    case 'persiana':
    case 'persianaM':
      return alt < 0.5 ? { room: 'dormitorio', feat: { front: key } } : { room: 'estudio', feat: { front: key } };
    case null:
    case undefined:
      // apagada: de noche el cuarto está a oscuras; de día (sólo en pruebas) tranquilo
      if (K.night) return { room: 'oscuro', feat: {} };
      return { room: 'dormitorio', feat: {} };
    default:
      // brillo, brillo2, vacio: no se veía a nadie; el cuarto está tranquilo
      if (alt < 0.4) return { room: 'living', feat: { people: alt < 0.2 ? 'none' : 'stand' } };
      if (alt < 0.7) return { room: 'dormitorio', feat: {} };
      return { room: 'cocina', feat: { cook: false } };
  }
}

export function buildHome(room, place, target, night, rng) {
  const K = new Kit(room, place, target, night, rng);
  const win = target.win;
  // la puerta de calle de un edificio (o la clave de prueba 'hall'): el hall
  if (target.type === 'puerta' || target.key === 'hall') {
    room.name = `${place.street} ${place.number}`;
    room.sub = 'hall de entrada';
    lobby(K);
    return K.finish();
  }
  if (win && win.kind === 'oficina') {
    room.name = `${place.street} ${place.number}`;
    room.sub = `piso ${win.floor} · oficina ${win.floor}0${(win.bay % 6) + 1}`;
    office(K);
    return K.finish();
  }
  const floor = win ? win.floor : 0;
  room.name = `${place.street} ${place.number}`;
  room.sub = `piso ${floor}${win ? ' · depto ' + floor + 'ABCDEF'[win.bay % 6] : ''}`;
  const { room: kind, feat } = plan(K);
  switch (kind) {
    case 'tele':
      C.livingTV(K, feat);
      break;
    case 'dormitorio':
      C.bedroom(K, { reader: night, person: !night });
      break;
    case 'oscuro':
      C.dark(K);
      break;
    case 'cocina':
      C2.kitchen(K, feat);
      break;
    case 'ninos':
      C2.kids(K, feat);
      break;
    case 'estudio':
      C2.study(K, feat);
      break;
    case 'biblioteca':
      C2.library(K, feat);
      break;
    case 'musica':
      C2.music(K, feat);
      break;
    case 'comedor':
      C2.dining(K, feat);
      break;
    case 'taller':
      C2.studio(K, feat);
      break;
    case 'plantas':
      C2.plants(K, feat);
      break;
    default: {
      const L = C.living(K, feat);
      if (feat.clocks) C2.clockRoom(K, feat);
      C.livingPeople(K, L, feat);
    }
  }
  C.applyFeatures(K, null, { ...feat, cat: kind === 'living' && feat.cat, kitten: kind === 'living' && feat.kitten, fish: kind === 'living' && feat.fish, plants: false });
  return K.finish();
}
