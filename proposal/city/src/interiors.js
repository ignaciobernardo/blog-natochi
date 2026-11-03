// Qué se ve en cada ventana según la hora y el tiempo que pasa.
//
// De día: reflejos, cortinas, plantas y a veces alguien.
// De noche: cada ventana se prende y se apaga en su propio ciclo; las
// prendidas muestran el interior sobre un fondo "░" (la luz) y algunas
// tienen el parpadeo azul de la tele.
import { INTERIOR, DAY_POOL, NIGHT_POOL } from './art.js';
import { hash2 } from './rng.js';

const GLOW = '░';
const TV = ['░▒░░▒', '▒░▒░░', '░░▒▒░', '▒▒░░▒', '░▒▒░░'];

// algunos interiores tienen dos cuadros que se alternan
const ANIM = {
  persona: [
    ['  o  ', ' /|\\ '],
    ['  o  ', ' /|_ '],
  ],
  saluda: [
    [' \\o/ ', '  |  '],
    [' _o_ ', '  |  '],
  ],
  gato: [
    [' /\\_/', ' (o.o'],
    [' /\\_/', ' (-.-'],
  ],
  gatito: [
    ['   /\\', '  (_)'],
    ['   /\\', ' ~(_)'],
  ],
  cocina: [
    [' ~ ~ ', ' n n '],
    [' ~  ~', ' n n '],
  ],
  musica: [
    ['♪  o ', '  /|>'],
    [' ♪ o ', '  /|>'],
  ],
  pareja: [
    ['o   o', '|) (|'],
    ['o  o ', '|)(| '],
  ],
};

function weighted(pool, r) {
  let total = 0;
  for (const [, w] of pool) total += w;
  let x = r * total;
  for (const [k, w] of pool) {
    x -= w;
    if (x < 0) return k;
  }
  return pool[0][0];
}

const OFFICE_DAY = [['brillo', 5], ['brillo2', 5], ['vacio', 3], ['persianaM', 2], ['persona', 1]];
const OFFICE_NIGHT = [['escritorio', 4], ['vacio', 3], ['persona', 1], ['lampara', 1], ['planta', 1]];

// Qué se está viendo en la ventana: la clave del interior ('gato', 'tele',
// 'cocina'...) o null si está apagada. Los cuartos de rooms/ la usan para que
// adentro esté lo mismo que se veía desde el tren.
export function interiorKey(w, t, night) {
  const s = w.seed;
  const office = w.kind === 'oficina';
  if (!night) {
    const period = 24 + (s % 50);
    const ep = Math.floor(t / period + (s % 97) / 97);
    return weighted(office ? OFFICE_DAY : DAY_POOL, hash2(s, ep));
  }
  const period = 9 + (s % 31);
  const ep = Math.floor(t / period + (s % 89) / 89);
  const lit = hash2(s * 3 + 1, ep) < (office ? 0.5 : 0.46);
  if (!lit) return null;
  return weighted(office ? OFFICE_NIGHT : NIGHT_POOL, hash2(s, ep * 7 + 3));
}

// Devuelve [fila1, fila2] (5 columnas) o null si está apagada.
export function interior(w, t, night) {
  const s = w.seed;
  const office = w.kind === 'oficina';
  if (!night) {
    const period = 24 + (s % 50);
    const ep = Math.floor(t / period + (s % 97) / 97);
    const key = weighted(office ? OFFICE_DAY : DAY_POOL, hash2(s, ep));
    return frameOf(key, t, s, false);
  }
  const period = 9 + (s % 31);
  const ep = Math.floor(t / period + (s % 89) / 89);
  const lit = hash2(s * 3 + 1, ep) < (office ? 0.5 : 0.46);
  if (!lit) return null;
  const key = weighted(office ? OFFICE_NIGHT : NIGHT_POOL, hash2(s, ep * 7 + 3));
  if (key === 'tele') {
    const f = Math.floor(t * 7 + (s % 13));
    const g = TV[Math.floor(hash2(s, f) * TV.length)];
    return [g.slice(0, 1) + 'o' + g.slice(2), ' )' + '   '];
  }
  return frameOf(key, t, s, true);
}

function frameOf(key, t, s, glow) {
  let fr = INTERIOR[key] || INTERIOR.vacio;
  const a = ANIM[key];
  if (a) {
    const k = Math.floor(t / (0.8 + (s % 7) * 0.25) + (s % 5));
    fr = a[hash2(s, k) < 0.7 ? 0 : 1];
  }
  if (!glow) return fr;
  return [fr[0].replace(/ /g, GLOW), fr[1]];
}

export { GLOW };
