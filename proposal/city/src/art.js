// Biblioteca de dibujos hechos a mano, todos originales.
//
// Convenciones (ver sprite() en grid.js):
//   ¤ transparente dentro de la silueta, ¶ espacio opaco, ª acento grave
//   String.raw deja las "\" tal cual.
// Las escalas: "cerca" (edificios al lado del viaducto, piso = 4 filas),
// "medio" (piso = 2 filas), "lejos" (piso = 1 fila) y el horizonte.
import { sprite, frames, mirror } from './grid.js';

const R = String.raw;

// ---------------------------------------------------------------------------
// Interiores de ventana: 5 columnas x 2 filas. En la fila de abajo los
// espacios se vuelven "_" (el antepecho), salvo que el dibujo diga otra cosa.
// ---------------------------------------------------------------------------
export const INTERIOR = {
  vacio: ['     ', '     '],
  brillo: ['  / /', ' / / '],
  brillo2: [' /   ', '/  / '],
  cortinas: [')   (', '/   \\'],
  cortinaI: [')    ', '/    '],
  persianaM: ['=====', '     '],
  persiana: ['=====', '====='],
  persona: ['  o  ', ' /|\\ '],
  personaI: [' o   ', '/|)  '],
  personaD: ['   o ', '  (|\\'],
  pareja: ['o   o', '|) (|'],
  saluda: [' \\o/ ', '  |  '],
  planta: [' \\|/ ', ' |_| '],
  planta2: ['\\|/ ,', '(_) |'],
  gato: [' /\\_/', ' (o.o'],
  gatito: ['   /\\', '  (_)'],
  libros: ['|:|||', '||:||'],
  cocina: [' ~ ~ ', ' n n '],
  reloj: [' (·) ', '   h '],
  lampara: [' /¯\\ ', '  |  '],
  cuadro: ['[~]  ', '  o  '],
  pecera: ['     ', '[><>]'],
  musica: ['♪  o ', '  /|>'],
  escritorio: [' o  _', '/)_|_'],
  jaula: [' (:) ', '  ¨  '],
  nino: [' o  o', '/|\\ |'],
};

// qué interiores pueden tocar de día y de noche, con peso
export const DAY_POOL = [
  ['brillo', 6], ['brillo2', 5], ['vacio', 3], ['cortinas', 4], ['cortinaI', 2], ['persianaM', 3],
  ['persiana', 2], ['planta', 3], ['planta2', 2], ['persona', 2], ['personaI', 1], ['personaD', 1],
  ['gato', 1], ['gatito', 1], ['libros', 1], ['reloj', 1], ['cuadro', 1], ['pecera', 1], ['jaula', 1],
];
export const NIGHT_POOL = [
  ['persona', 3], ['personaI', 2], ['personaD', 2], ['pareja', 2], ['lampara', 3], ['libros', 2],
  ['cocina', 2], ['reloj', 1], ['cuadro', 1], ['musica', 1], ['escritorio', 2], ['planta', 2],
  ['gato', 1], ['gatito', 1], ['tele', 4], ['cortinas', 3], ['persianaM', 2], ['vacio', 3], ['nino', 1],
];

// ---------------------------------------------------------------------------
// Techos, cosas en las azoteas (escala cerca)
// ---------------------------------------------------------------------------
export const ROOF = {
  estanque: sprite(R`
     /\
    /__\
   |::::|
   |____|
    |/\|
    |  |`),
  estanque2: sprite(R`
    .--.
   (____)
   |    |
   |____|
    /  \
`),
  antena: sprite(R`
    _|_
   __|__
  ___|___
     |
     |`, 'line'),
  antena2: sprite(R`
   -+-
    |
   -+-
    |
    |`, 'line'),
  parabola: sprite(R`
   _
  ( \_o
   \_/
    |`),
  chimenea: sprite(R`
   _
  |=|
  | |`),
  caseta: sprite(R`
   _______
  |  ___  |
  | |   | |
  | |   | |`),
  palomar: sprite(R`
    /\/\
   /_/\_\
   |o::o|
   |::::|`),
  solar: sprite(R`
     ____
    /// /
   /// /|
   ¯¯¯¯ |`),
  plantas: sprite(R`
   \|/ * ,|,
   |_| | (_)`),
  ropa: sprite(R`
  |¯¯¯¯¯¯¯¯¯¯|
  |[] /\ []  |
  |   ¯¯   {}|`, 'line'),
  aire: sprite(R`
   ____
  |=|::|`),
};

// ---------------------------------------------------------------------------
// Cosas de la vereda y la calle (escala cerca)
// ---------------------------------------------------------------------------
export const STREET = {
  farol: sprite(R`
    _
   (_)
    |
    |
    |
    |
   _|_`, 'line'),
  farol2: sprite(R`
   __
  |  \_
  |   ()
  |
  |
  |
 _|_`, 'line'),
  arbol: sprite(R`
     .-~~-.
   .(  :  .)-.
  ( .  : .  : )
   '-._ .:_.-'
       ||
       ||`),
  arbol2: sprite(R`
     ,-.
   ,(  .)
  ( : .  )
   '-.-'
     |
     |`),
  palmera: sprite(R`
   _\ | /_
  ¯ /\|/\ ¯
     (
      )
     (
      )`, 'line'),
  semaforo: sprite(R`
   .-.
   |o|
   |o|
   |o|
   '-'
    |
    |`),
  kiosco: sprite(R`
   ____________
  /____________\
  | DIARIOS    |
  |[=][~][=][#]|
  |____________|`),
  banca: sprite(R`
   ______
   |____|
   /    \
`),
  basurero: sprite(R`
   ___
  [___]
  |:::|`),
  hidrante: sprite(R`
   _
  [o]
  |_|`),
  buzon: sprite(R`
   ___
  /   \
  |===|
  |___|`),
  parada: sprite(R`
  _____
 |MICRO|
 |  4  |
  ¯|¯¯¯
   |
   |
  _|_
`, 'line'),
  telefono: sprite(R`
  ___
 |T |
 |[]|
 |  |
 |__|
`),
  bici: sprite(R`
   _o
 (o)/(o)
`, 'line'),
  fuente: sprite(R`
      _|_
     (___)
   .-'   '-.
  (_________)
`),
};

// ---------------------------------------------------------------------------
// Gente (escala cerca: 3 filas). Cuadros de caminata hacia la derecha.
// ---------------------------------------------------------------------------
export const WALK = frames(R`
 o
/|\
/ \
--
 o
/|\
 |
--
 o
(|\
/ )
--
 o
/|\
 |`, 'line');

export const PEOPLE = {
  bolsa: frames(R`
 o
/|\[]
/ \
--
 o
/|\[]
 |`, 'line'),
  paraguas: frames(R`
/¯¯¯\
  |o
  |\
  / \
--
/¯¯¯\
  |o
  |\
   |`, 'line'),
  perro: frames(R`
 o
/|\
/ \_¸._
   /¯ \
--
 o
/|\
 |__¸._
  /\ /\
`, 'line'),
  nino: frames(R`
 o  o
/|\-|\
/ \ /\
--
 o  o
/|\-|\
 |  |`, 'line'),
};

export const CICLISTA = frames(R`
   _o
  _\|<
 (o)/(o)
--
   _o
  _\|<
 (o)\(o)`, 'line');

// ---------------------------------------------------------------------------
// Autos de perfil (escala cerca, 3 filas), mirando a la derecha.
// ---------------------------------------------------------------------------
export const CARS = [
  sprite(R`
    ____
  _/_|__\__
 '(o)---(o)'`),
  sprite(R`
   ______
  |__|___\___
  '(o)----(o)'`),
  sprite(R`
     ___
   _/_|_\_
  '(o)-(o)'`),
  sprite(R`
   _____[T]_
  /___|____\\_
  '(o)----(o)'`),
  sprite(R`
   ______________
  |o |o |o | o|  \
  |__|__|__|__|___|
  '(o)--------(o)'`),
  sprite(R`
   _________
  |  FRUTA  |__
  |_________|__\
  '(o)-----(o)'`),
];
export const MOTO = sprite(R`
    o_
  _/|¯
 (o)-(o)`, 'line');

// ---------------------------------------------------------------------------
// Escala media: autos y gente chicos (2 filas)
// ---------------------------------------------------------------------------
export const MID_CARS = [
  sprite(R`
 _/¯\_
'o-o'`),
  sprite(R`
 _|¯¯\_
'o--o'`),
  sprite(R`
 ______
|o_o_o|\
'o---o'`),
  sprite(R`
 __|¯\
'o-o'`),
];
export const MID_WALK = frames(R`
o
/\
--
o
|`, 'line');

// ---------------------------------------------------------------------------
// Pájaros (cielo) y nubes
// ---------------------------------------------------------------------------
export const BIRD = frames(R`
\v/
--
_v_
--
/v\
--
_v_`, 'line');
export const BIRD_SMALL = frames(R`
v
--
-`, 'line');

export const CLOUDS = [
  sprite(R`
          _.-¯¯-._
   _.--.-'        ª-.__
 .'                    ª.
(                        )
 ª-.____________________.-'
`),
  sprite(R`
     _.-¯-._
  .-'       ª-.
 (             )
  ª-._______.-'
`),
  sprite(R`
       _.--.
  _.--'     ª-.__
 (               )
  ª--.._____..--'
`),
  sprite(R`
    _.-.    _.-._
 .-'    ª--'     ª.
(                  )
 ª-.____________.-'
`),
];

export const MOON = sprite(R`
   .-.
  (  (
   '-'`);
export const SUN = sprite(R`
   \ | /
  -  O  -
   / | \
`, 'line');

// helpers para los generadores
export { sprite, frames, mirror };
