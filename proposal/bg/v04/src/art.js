// Dibujos a mano (originales) para la calle con lluvia.
// Convención de las plantillas: ' ' transparente, '¤' espacio opaco; con
// { solid: true } la silueta de cada fila tapa lo de atrás.
import { spr, flipX } from './grid.js';

// --- techos ---------------------------------------------------------------

// tanque de agua de madera sobre patas, con aros y duelas punteadas
export const TANK = spr(
  String.raw`
     |
    /:\
   /:::\
  /_____\
  |=|=|=|
  |:|:|:|
  |:|:|:|
  |=|=|=|
  '-----'
   |\ /|
   | X |
   |/ \|
  _|___|_
`,
  { solid: true },
);

export const TANK_SMALL = spr(
  String.raw`
   /:\
  /___\
  |:|:|
  |=|=|
  '---'
   |X|
  _|_|_
`,
  { solid: true },
);

// caseta de la escalera con puerta y techo oblicuo
export const SHACK = spr(
  String.raw`
   _______
  /______/|
 |  _   | |
 | | |  | |
 | |o|  | /
 |_|_|__|/
`,
  { solid: true },
);

// equipos de aire acondicionado sobre el techo
export const ROOF_AC = spr(
  String.raw`
  ______
 /_____/|
 |(=)  ||
 |_____|/
`,
  { solid: true },
);

export const DISH = spr(
  String.raw`
  .-.
 (   )-.
  '-'\
     |
    _|_
`,
  { solid: false },
);

export const ANTENNA = spr(
  String.raw`
   *
   |
 --+--
   |
  -+-
   |
  /|\
`,
);

export const CHIMNEY = spr(
  String.raw`
 _
|=|
|_|
`,
  { solid: true },
);

// --- fachada --------------------------------------------------------------

// aire acondicionado colgado bajo una ventana
export const AC = spr(
  String.raw`
[==]
`,
);

export const PLANT = spr(
  String.raw`
\|/
`,
);

// --- calle ----------------------------------------------------------------

// taxi hacia la derecha; el faro es el '°' y el foco va adelante
export const TAXI = spr(
  String.raw`
       _[TAXI]_
  ____/__|_|___\___
 |  __ : |  : __  °|
 '-(o)--------(o)--'
`,
  { solid: true },
);

export const CAR = spr(
  String.raw`
     ________
  __/__|__|__\___
 |  _  :  |  _  °|
 '-(o)-------(o)-'
`,
  { solid: true },
);

// micro (bus) hacia la derecha
export const BUS = spr(
  String.raw`
 ____________________________
|[_][_][_][_][_][_]  |[_]| \_|
|  : : : : : : : : : | : |  °|
'--(o)--------------(o)------'
`,
  { solid: true },
);

// persona con paraguas: copa + cuerpo, cuatro cuadros de caminata (hacia la derecha)
// copas de dos filas: cúpula y varillas
export const CANOPIES = [
  [' .-^-. ', '/__|__\\'],
  [' _.-._ ', '/_/|\\_\\'],
  [" .-'-. ", '(__|__)'],
  ['  ___  ', ' /_|_\\ '],
  [' .-^-. ', '/_/|\\_\\'],
];
const LEGS = ['  / >', '   | ', '  < \\', '   | '];
function walkerFrames([a, b]) {
  return LEGS.map((legs) => spr([a, b, '   |o', "  /|'", legs].join('\n'), { solid: true }));
}
export const WALKERS = CANOPIES.map(walkerFrames);
export const WALKERS_L = WALKERS.map((fr) => fr.map(flipX));
export const WALKER = WALKERS[0];

// persona sin paraguas, encogida, apurada
export const RUNNER = [
  String.raw`
 o
/|\
/ >
`,
  String.raw`
 o
/|\
 |
`,
].map((s) => spr(s, { solid: true }));
export const RUNNER_L = RUNNER.map(flipX);

export const PIGEON = spr(String.raw`(o>`);
export const PIGEON_L = flipX(PIGEON);

export const HYDRANT = spr(
  String.raw`
 _n_
(=o=)
 |_|
`,
  { solid: true },
);

export const BIN = spr(
  String.raw`
.---.
|:::|
|___|
`,
  { solid: true },
);

// tapa de alcantarilla en el plano del suelo
export const MANHOLE = spr(
  String.raw`
 .---.
(:::::)
 '---'
`,
);

// persona con el diario sobre la cabeza
export const PAPER = [
  String.raw`
 _==_
  o
 /|\
 / >
`,
  String.raw`
 _==_
  o
 /|\
  |
`,
].map((s) => spr(s, { solid: true }));
export const PAPER_L = PAPER.map(flipX);

// personas quietas: esperando bajo el paraguas, comiendo en el puesto
export const STANDER = spr(
  String.raw`
 .-'-.
(__|__)
  o|
  /|'
  / \
`,
  { solid: true },
);
