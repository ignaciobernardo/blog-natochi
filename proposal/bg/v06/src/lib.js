// Biblioteca de sprites dibujados a mano para el corte del edificio.
// Todos miran a la derecha; mirror() da la versión que mira a la izquierda.
// Alturas pensadas para un piso de 7 filas (techo en la 0, piso en la 6).
import { S } from './sprite.js';

const R = String.raw;

// ---------------------------------------------------------------- personas
// 3 filas: cabeza, torso, piernas. Las poses se combinan por fila.
export const person = {
  stand: S(R`
 o
/|\
/ \
`),
  stand2: S(R`
 o
(|\
 |\
`),
  walk1: S(R`
 o
/|\
/ >
`),
  walk2: S(R`
 o
 |\
 |)
`),
  wave: S(R`
 o/
/|
/ \
`),
  up: S(R`
\o/
 |
/ \
`),
  dance1: S(R`
\o
 |\
/ >
`),
  dance2: S(R`
 o/
/|
< \
`),
  cook1: S(R`
 o
/|_
/ \
`),
  cook2: S(R`
 o
/|¯
/ \
`),
  reach: S(R`
 o_
/|
/ \
`),
  skirt: S(R`
 o
/|\
/_\
`),
  sit: S(R`
 o
 |\
 |_|
`),
  sit2: S(R`
 o
 |\_
 |_
`),
  kid: S(R`
¤
 o
/^\
`),
  kidUp: S(R`
\o/
 ^
¤
`),
  water: S(R`
 o
/|-[>
/ \
`),
  paint: S(R`
 o
/|-/
/ \
`),
  paint2: S(R`
 o /
/|/
/ \
`),
  carry: S(R`
 o
/|¯o
/ \
`),
  phone: S(R`
 o]
/|
/ \
`),
  read: S(R`
 o
/|[]
/ \
`),
  trumpet: S(R`
 o=<
/|\
/ \
`),
  trumpet2: S(R`
 o=<
/|
/ \
`),
  yoga: S(R`
 o
 |\
 |/
`),
  smoke: S(R`
 o
/|-·
/ \
`),
};

// sentados: silla + persona, mirando a la derecha (el brazo apoya en la mesa)
export const seat = {
  type1: S(R`
| o
||\_
|¯¯|
`),
  type2: S(R`
| o
||\.
|¯¯|
`),
  eat1: S(R`
| o
||\_
|¯¯|
`),
  eat2: S(R`
| o
||¯
|¯¯|
`),
  idle: S(R`
| o
||\
|¯¯|
`),
  piano1: S(R`
 o
 |\_
_|¯|_
`),
  piano2: S(R`
 o
 |¯
_|¯|_
`),
  stool: S(R`
_|¯|_
`),
};

// ---------------------------------------------------------------- mascotas
export const pet = {
  cat: S(R`
 /\_
(  )~
`),
  cat2: S(R`
  ^^
~(__)
`),
  catWalk: S(R`
     ^^
~-.__o'
  /  \
`),
  catSleep: S(R`
 .-.^^
(___)~
`),
  dog: S(R`
 _____o)
(_____)
 |   |
`),
  dog2: S(R`
    __
o(  )-'
/\ /\
`),
  dogLie: S(R`
  __n_
_(____)o~
`),
  fish: S(R`><>
`),
  bird: S(R`
  _
 /|\
(|v|)
 '-'
`),
};

// ---------------------------------------------------------------- plantas
export const plant = {
  small: S(R`
\|/
\_/
`),
  tall: S(R`
 \ /
 \|/
 _|_
 \_/
`),
  leafy: S(R`
(\|/)
 \|/
 |_|
`),
  cactus: S(R`
 _
| |_
|_| |
\___/
`),
  palm: S(R`
\\ //
 \\//
  ||
 [__]
`),
  fern: S(R`
 .\|/.
(\\|//)
 \_|_/
`),
  hang: S(R`
 |
_|_
\_/
)|(
 (
`),
  vine: S(R`
 |
(_)
)|(
(|)
 )
`),
  flower: S(R`
 o
\|/
|_|
`),
};

// ---------------------------------------------------------------- casa
export const home = {
  tvWall: S(R`
 _________
|         |
|         |
|_________|
`),
  sofaBack: S(R`
.¯¯¯¯¯¯¯¯¯¯¯¯.
|____________|
`),
  sofaBack2: S(R`
.¯¯¯¯¯¯¯¯¯.
|_________|
`),
  tank: S(R`
 ______
|      |
|__~___|
 |    |
 |____|
`),
  bedside: S(R`
 _
/_\
`),
  kidBed: S(R`
_       _
|(_)____|
|_______|
`),
  blocks: S(R`
 [o]
[a][b]
`),
  ball: S(R`o
`),
  toyCar: S(R`
 _
(o-o)
`),
  slippers: S(R`.. 
`),
  plates: S(R`
 _______
|o o o o|
|¯¯¯¯¯¯¯|
|o_o_o_o|
|_______|
`),
  dtable: S(R`
____________
 |        |
`),
  stool2: S(R`
_
|
`),
  lampOff: S(R`
  |
 /¯\
`),
  lampOn: S(R`
  |
 /¯\
' : '
`, 'none'),
  bulbOff: S(R`
|
o
`),
  floorLamp: S(R`
 ___
/___\
  |
  |
 _|_
`),
  frame1: S(R`
 ____
|/\/\|
|____|
`),
  frame2: S(R`
 ___
|o~|
|___|
`),
  frame3: S(R`
 ______
| .:'. |
|______|
`),
  clock: S(R`(')
`),
  window: S(R`
 _______
|   |   |
|---+---|
|___|___|
`),
  windowCurtain: S(R`
 _________
(|   |   |)
(|---+---|)
(|___|___|)
`),
  shelf: S(R`
._______.
||||/|:||
|¯¯¯¯¯¯¯|
|:|||\||
`),
  bookcase: S(R`
._______.
||||/|:||
|¯¯¯¯¯¯¯|
|:|||\|||
|¯¯¯¯¯¯¯|
|_o___o_|
`),
  wardrobe: S(R`
 _______
|   |   |
|  o|o  |
|   |   |
|___|___|
`),
  dresser: S(R`
 ______
|__o___|
|__o___|
`),
  nightstand: S(R`
 ___
|_o_|
|   |
`),
  table: S(R`
 ________
|        |
|        |
`),
  chairR: S(R`
|
|__
| |
`),
  rug: S(R`.:.:.:.:.:.:.
`, 'solid'),
  coat: S(R`
_|_
 |
 |
_|_
`),
  mirror: S(R`
 .-.
(   )
 '-'
`),
  bed: S(R`
_
| (__)  ________
|_______________|
|_|           |_|
`),
  bedSleep: S(R`
_
| (__)o.-------.
|______\_______|
|_|           |_|
`),
  sofa: S(R`
 ____________
(|          |)
 |__________|
 ¨          ¨
`),
  sofaSide: S(R`
|¯|
| |_____
|_______|
 ¨     ¨
`),
  tvFlat: S(R`
 _________
|         |
|_________|
    _|_
`),
  tvStand: S(R`
 _______
|_o___o_|
`),
  tvOld: S(R`
  \  /
 .-\/--.
 |     |o
 |     |o
 '-----'
 _|___|_
`),
  armchair: S(R`
 _
| |__
|____|
 ¨  ¨
`),
};

// ---------------------------------------------------------------- cocina
export const kitchen = {
  fridge: S(R`
 ____
|    |
|°  :|
|¯¯¯¯|
|   :|
|____|
`),
  upper: S(R`
|¯¯¯|¯¯¯|
|__o|o__|
`),
  hood: S(R`
  |
 _|_
/___\
`),
  pot: S(R`
 _n_
-|_|-
`),
  pan: S(R`\__/--
`),
  kettle: S(R`
 _
(_)>
`),
  faucet: S(R`
,-.
| '
`),
  jars: S(R`
 _  _
|°||:|
`),
  rack: S(R`
|||/
¯¯¯¯
`),
  hanging: S(R`
-.-.-.-
 | | |
 ° o J
`, 'none'),
  bowl: S(R`\_/
`),
  bin: S(R`
.-.
|_|
`),
};

// ---------------------------------------------------------------- baño
export const bath = {
  tub: S(R`
_
| |   .----------.
| |___\          /
       '-.____.-'
`),
  tubFull: S(R`
_
| |   .---o------.
| |___\  °  ° °  /
       '-.____.-'
`),
  shower: S(R`
  _
 | \_
 |   ¨
 |
 |
 |
`),
  toilet: S(R`
 _
| |__
|_|__)
  |_|
`),
  sink: S(R`
 ___
\___/
  |
 _|_
`),
  mirror: S(R`
 .-.
(   )
 '-'
`),
  towel: S(R`
-.-.-
 |‖|
 |_|
`, 'none'),
  duck: S(R`
 o
(_>
`),
  paper: S(R`(o)
`),
  curtain: S(R`
__
))
))
))
))
`),
};

// ---------------------------------------------------------------- lavadero, taller, gimnasio, mudanza
export const misc = {
  washer: S(R`
 _____
|o ::.|
| (  )|
|_____|
`),
  basket: S(R`
\~~/
|__|
`),
  ironing: S(R`
______<]
 \  /
  \/
  /\
`),
  rack: S(R`
 _____________
 | V  [] V  |
 |          |
 /\        /\
`, 'none'),
  easel: S(R`
 _____
|     |
|     |
|_____|
 / | \
/  |  \
`),
  canvases: S(R`
 _
| |_
| | |
|_|_|
`),
  paints: S(R`
 _  _
|_||_|
`),
  boxes: S(R`
 ____
|____|
|____|__
|____|__|
`),
  ladder: S(R`
  /\
 /-¯\
 /--\
/    \
`),
  mat: S(R`¯¯¯¯¯¯
`),
  dumbbell: S(R`o-o
`),
  bucket: S(R`
 _
|_|
`),
};

// ---------------------------------------------------------------- oficina
export const office = {
  desk: S(R`
______________
 |        |_o|
`),
  monitor: S(R`
 _____
|     |
|_____|
 _|_
`),
  laptop: S(R`
  /
_/__
`),
  chair: S(R`
|
|__
 |
o¯o
`),
  board: S(R`
 _______
|:| |::.|
|.|:|_|:|
|_______|
`),
  mug: S(R`
 _
|_|)
`),
  lampDesk: S(R`
 __
(_ \
   |
  _|_
`),
  cabinet: S(R`
 ____
|_o__|
|_o__|
|_o__|
`),
  printer: S(R`
 ____
|____|_
|______|
`),
};

// ---------------------------------------------------------------- música
export const music = {
  piano: S(R`
 __________
|  ♪  ♫    |
|__________|
|=|        |
| |        |
|_|________|
`),
  amp: S(R`
 ____
|::::|
|::::|
|_o_o|
`),
  drums: S(R`
_\      _/
 |  __  |
(=)(  )(=)
 | (__) |
`),
  drummer1: S(R`
_\  o   _/
 | \|\_ |
(=)(¯¯)(=)
 | (__) |
`),
  drummer2: S(R`
_\  o   _/
 | _|/  |
(=)(¯¯)(=)
 | (__) |
`),
  stand: S(R`
 ___
|♪ ♫|
 ¯|¯
  |
 /|\
`),
  mic: S(R`
 o
 |
 |
/|\
`),
  speaker: S(R`
 ___
| o |
| ○ |
|___|
`),
};

// ---------------------------------------------------------------- fiesta
export const party = {
  ball: S(R`
 |
 Ø
`),
  balloons: S(R`
O o O
)(|)(
 (|)
`, 'none'),
  bunting: S(R`.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.v.
`, 'none'),
  cake: S(R`
 i i i
[_____]
`),
  drinks: S(R`
Y ] Y
`),
  snacks: S(R`
 _________
|_o_°_o_°_|
 |       |
`),
};

// ---------------------------------------------------------------- azotea
export const roof = {
  tank: S(R`
   ____
  /____\
 |======|
 |      |
 |======|
 |______|
  |/\/\|
  |\/\/|
  |    |
`),
  antenna: S(R`
--+--
 -+-
--+--
  |
  |
  |
 /|\
`),
  dish: S(R`
 \
 (\
 (_\=o
   |
  /|\
`),
  fan: S(R`
 ______
|  ()  |
|______|
`),
  chimney: S(R`
 ___
|___|
 | |
 |_|
`),
  solar: S(R`
 _______
/_/_/_/_/
   |  |
`),
  house: S(R`
 ________________
|////////////////|
|  ____   ____   |
| |    | |    |  |
| |    | |  o |  |
| |    | |    |  |
| |____| |____|  |
`),
  chair: S(R`
\
 \__
 / \
`),
  pigeon: S(R`
 _
(o>
`),
  pole: S(R`
|
|
|
|
|
`),
};

// ---------------------------------------------------------------- café y calle
export const cafe = {
  espresso: S(R`
 ______
|.-..-.|
|[o][o]|
|_|__|_|
`),
  grinder: S(R`
 _
\_/
| |
`),
  case_: S(R`
 _________
|°  o  °  |
|_o__°__o_|
`),
  register: S(R`
 __
|::|
`),
  menu: S(R`
 _________
| CAFE  1 |
| TE    1 |
| PAN   2 |
|_________|
`),
  table: S(R`
_____
  |
 _|_
`),
  stool: S(R`
_|_
 |
_|_
`),
  cups: S(R`
u u u u
¯¯¯¯¯¯¯
`, 'none'),
  lamp: S(R`
 |
/_\
`),
  awning: S(R`
_____________
\/\/\/\/\/\/\
 ¨ ¨ ¨ ¨ ¨ ¨
`),
  board: S(R`
 ___
|ME |
|NU |
/   \
`),
  post: S(R`
 _____
(_____)
   |
   |
   |
   |
   |
   |
  _|_
`),
  hydrant: S(R`
 _
(_)
[ ]
`),
  bike: S(R`
  __
 /\/>
(o)(o)
`),
  bench: S(R`
|_____|
|_____|
 |   |
`),
  bin: S(R`
_____
|:::|
|___|
`),
};

// ---------------------------------------------------------------- autos (de perfil)
export const car = {
  sedan: S(R`
     _____
 ___/__|__\___
|_    _    _ _]
 ¨-(o)----(o)'
`),
  hatch: S(R`
    ______
 __/__|___|
|_   _   _]
 '(o)---(o)
`),
  van: S(R`
 ______________
|  |  |  |   |_\
|__|__|__|__ __]
  (o)      (o)'
`),
  moto: S(R`
  _\
o¯¯\o
`),
};

// ---------------------------------------------------------------- cloaca y metro
export const under = {
  rat: S(R`~(__)°>
`),
  ladder: S(R`
H
H
H
H
`),
  valve: S(R`
 _|_
=(o)=
`),
  gauge: S(R`
(')
 |
`),
  worker: S(R`
 o°
/|\
/ \
`),
  bench: S(R`
 __________
|__________|
 |        |
`),
  clock: S(R`
 _
(')
 |
`),
  poster1: S(R`
 _____
| .-. |
|(   )|
| '-' |
|_____|
`),
  poster2: S(R`
 _____
|  /\ |
| /  \|
|/____|
|_____|
`),
  map: S(R`
 _____________
| o-o-o-o-o   |
|     \       |
|      o-o-o-o|
|_____________|
`),
  vending: S(R`
 _____
|ooo|°|
|ooo|:|
|ooo|_|
|_____|
`),
  sign: S(R`
 ___________
| ALAMEDA M |
 ¯¯¯¯|¯|¯¯¯¯
`),
  suitcase: S(R`
 _
|_|
`),
};

// ---------------------------------------------------------------- cielo
export const sky = {
  cloud1: S(R`
    .--.
 .-(    )-.
(__________)
`),
  cloud2: S(R`
   _  _
 _( )( )_
(________)
`),
  cloud3: S(R`
  .-.
-(   )-
`),
  sun: S(R`
 \ | /
-(   )-
 / | \
`),
  moon: S(R`
 .-.
(  (
 '-'
`),
  plane: S(R`
    __
---/_/___
 ¨-------'>
`),
  bird1: S(R`v
`),
  bird2: S(R`^
`),
};
