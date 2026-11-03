// Gente y animales de los departamentos, en varios tamaños: los glifos no se
// agrandan, así que cada tamaño está dibujado a mano.
//   L  ~14 filas (muy cerca, z ≈ 1,1)
//   M  ~11 filas (al medio, z ≈ 1,6)
//   S  ~7 filas (junto a la pared del fondo)
//   XS ~4 filas (lejos, en un pasillo)
// Todos miran de frente salvo los "Side" (miran a la derecha; mirror() los da
// vuelta) y los "Back" (de espaldas, con el pelo `:::`).
import { R, sprite, frames, mirror } from './casa-kit.js';

const F = (s) => frames(s);

// --- de pie ------------------------------------------------------------------
export const STAND = {
  L: F(R`
     .-.
    (· ·)
     )-(
   .'   ª.
  / |:::| \
 /  |:::|  \
(   |:::|   )
 ª-'|___|ª-'
    |   |
    | | |
    | | |
    | | |
    | | |
   (__|__)
--
     .-.
    (- -)
     )-(
   .'   ª.
  / |:::| \
 /  |:::|  \
(   |:::|   )
 ª-'|___|ª-'
    |   |
    | | |
    | | |
    | | |
    | | |
   (__|__)`),
  M: F(R`
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::| \
(  |:::|  )
 ª.|___|.'
   | | |
   | | |
   |_|_|
  (__|__)
--
    .-.
   (- -)
    )-(
  .'   ª.
 / |:::| \
(  |:::|  )
 ª.|___|.'
   | | |
   | | |
   |_|_|
  (__|__)`),
  S: F(R`
  _
 (_)
 /|\
/ | \
 /_\
 | |
 ' '
--
  _
 (_)
 /|\
' | '
 /_\
 | |
 ' '`),
  XS: F(R`
 o
/|\
 |
/ \
`),
};

// vestido (para variar)
export const STAND_DRESS = {
  M: F(R`
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::| \
(  |:::|  )
 ª/     \'
 /       \
/_________\
   |   |
  (_| |_)`),
  S: F(R`
  _
 (_)
 /|\
/ | \
 /:\
/___\
 | |`),
};

// saludando (hacia nosotros, que estamos en la ventana)
export const WAVE = {
  L: F(R`
     .-.      _
    (· ·)    ( )
     )-(     / /
   .'   ª.  / /
  / |:::| \/ /
 /  |:::|  _/
(   |:::|
 ª-'|___|
    |   |
    | | |
    | | |
    | | |
    | | |
   (__|__)
--
     .-.  __
    (· ·)(_ \
     )-(   \ \
   .'   ª.  ) )
  / |:::| \/ /
 /  |:::|  _/
(   |:::|
 ª-'|___|
    |   |
    | | |
    | | |
    | | |
    | | |
   (__|__)`),
  M: F(R`
    .-.    _
   (· ·)  ( )
    )-(   / /
  .'   ª./ /
 / |:::|  /
(  |:::|-'
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)
--
    .-. __
   (· ·)\_)
    )-(  \ \
  .'   ª. ) )
 / |:::|  /
(  |:::|-'
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)`),
};

// caminando de perfil, hacia la derecha
export const WALK = {
  M: F(R`
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\
  |:::| \
  |___|  '
   / \
  /   \
 /     \
'-     '-
--
   .-.
  (  ·)
   )-(
  .' ª.
 /|:::|
/ |:::|
' |___|
   | |
   | |
   | |
   '-'-
--
   .-.
  (  ·)
   )-(
  .' ª.
 /|:::|
/ |:::|
' |___|
   | \
   |  \
   |   \
   '-  '-
--
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\
  |:::| \
  |___|  '
   | |
   | |
   | |
   '-'-`),
  S: F(R`
  _
 (_)
 /|\
' | '
 / \
/   \
--
  _
 (_)
 /|\
' | '
  |
  |\
--
  _
 (_)
 /|\
' | '
  |
 /|
--
  _
 (_)
 /|\
' | '
  |
  |`),
  XS: F(R`
 o
/|\
/ \
--
 o
/|\
 |`),
};

// con bolsas o con un perro (vecinos en la escalera, el hall)
export const WALK_BAG = {
  M: F(R`
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\
  |:::| \ _
  |___| [:]
   / \  |_|
  /   \
 /     \
'-     '-
--
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\
  |:::| \ _
  |___| [:]
   | |  |_|
   | |
   | |
   '-'-`),
};

// de espaldas, de pie (cocinando: revolviendo la olla)
export const BACK = {
  M: F(R`
    .-.
   (:::)
    )-(
  .'   ª.__
 / |:::|  _)
(  |:::|
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)
--
    .-.
   (:::)
    )-(
  .'   ª._
 / |:::|  \_
(  |:::|
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)`),
  S: F(R`
  _
 (:)
 /|\_
/ |
 /_\
 | |
 ' '
--
  _
 (:)
 /|\
/ | '-
 /_\
 | |
 ' '`),
};

// cabezas y hombros de espaldas sobre el respaldo del sillón (viendo la tele)
export const SOFA_BACK = {
  L: F(R`
    .--.
   (::::)
   (::::)
  .-)--(-.
 / :::::: \
--
    .--.
   (::::)
   (::::)
  .-)--(-.
 / :::::: \
`),
  M: F(R`
   .-.
  (:::)
 .-)-(-.
/ ::::: \
--
   .-.
  ( :::)
 .-)-(-.
/ ::::: \
`),
  S: F(R`
  _
 (:)
/:::\
`),
};

// sentado de frente (en un sillón): leyendo, con una taza, quieto
export const SIT_FRONT = {
  M: F(R`
   .-.
  (· ·)
  .)-(.  ___
 / |:| \/__/
|  |:|__|
|__|_|__|
|  | |  |
'  | |  '
--
   .-.
  (· ·)
  .)-(. ___
 / |:| \\__\
|  |:|__|
|__|_|__|
|  | |  |
'  | |  '`),
  cup: F(R`
   .-.
  (· ·)
  .)-(.
 / |:| \
|  |:|  |
|__|_|_[]
|  | |  |
'  | |  '
--
   .-.
  (· ·)[]
  .)-(./
 / |:| /
|  |:||
|__|_|__|
|  | |  |
'  | |  '`),
  idle: F(R`
   .-.
  (· ·)
  .)-(.
 / |:| \
|  |:|  |
|__|_|__|
|  | |  |
'  | |  '`),
  S: F(R`
  _
 (_)
/(:)\
 |¯|`),
};

// sentado de espaldas en una silla, frente a un escritorio o un piano
export const SIT_BACK = {
  type: F(R`
    .-.
   (:::)
  .-)-(-.
 / ::::: \
 \_:::::_/
  |_____|
  |  |  |
--
    .-.
   (:::)
  .-)-(-.
 / ::::: \_
 \_:::::
  |_____|
  |  |  |`),
  piano: F(R`
    .-.
   (:::)
  .-)-(-.
_/ ::::: \
   :::::  ª-
 __|___|___
 |_________|
 |         |
--
    .-.
   (:::)
  .-)-(-.
 / ::::: \_
-' :::::
 __|___|___
 |_________|
 |         |`),
};

// sentado de perfil, mirando a la derecha, con su silla (comer, brindar)
export const SIT_SIDE = {
  M: F(R`
|  .-.
| (  ·)
|  )-(
| .' ª.
| |:::|\__
| |:::| ¯¯
|_|___|__
|   ¯¯¯| |
|      | |
|      ' '
--
|  .-.
| (  ·)
|  )-( _
| .' ª/ )
| |:::|/
| |:::|
|_|___|__
|   ¯¯¯| |
|      | |
|      ' '`),
};

// con guitarra, sentado en un banquito, de frente
export const GUITAR = F(R`
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::|\_
 | |:(¯¯)===]
 \_|:(__)
   |___|
  _|   |_
 | |   | |
 ' |   | '
--
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::| \
 | |:(¯¯)===]
 \_|:(__)/
   |___|
  _|   |_
 | |   | |
 ' |   | '`);

// regando, de perfil hacia la derecha
export const WATER = F(R`
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|ª-.__
  |:::|  [__>.
  |___|   ¯¯
   | |
   | |
   | |
   '-'-
--
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|ª-.___
  |:::|  [___>
  |___|   ¯¯¯ .
   | |
   | |
   | |
   '-'-`);

// pintando en el caballete, de perfil hacia la derecha
export const PAINT = F(R`
   .-.
  (  ·)
   )-(
  .' ª.   /
  |:::|\ /
  |:::| ª
  |___|
   / \
  /   \
 /     \
'-     '-
--
   .-.
  (  ·)
   )-(
  .' ª._
  |:::| ª--
  |:::|
  |___|
   / \
  /   \
 /     \
'-     '-`);

// planchando, de frente detrás de la tabla
export const IRON = F(R`
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::| \
(  |:::| _\_
 ª.|___||___>
--
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::| \
(  |:::|  )_
 ª.|___| |___>`);

// hablando por teléfono, de pie
export const PHONE = F(R`
    .-.
   (· ·)]
    )-(/
  .'   |
 / |:::|
(  |:::|
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)
--
    .-.
   (· ·)]
    )-(/
  .'   |
 / |:::|
(  |:::|
 ª.|___|
   | | |
   | | |
   |_|_|
  (__|__)`);

// niños: más chicos que un adulto a la misma distancia
export const KID = {
  M: F(R`
   .-.
  (· ·)
 .-)-(-.
/ |:::| \
  |___|
  | | |
  (_|_)
--
\  .-.  /
 \(· ·)/
  )-:-(
  |:::|
  |___|
  | | |
  (_|_)`),
  S: F(R`
  _
 (_)
/(:)\
 | |
--
\ _ /
 (_)
 (:)
 | |`),
  sit: F(R`
  .-.
 (· ·)
.-)-(-.
'|:::|'
_|___|_
--
  .-.
 (· ·)
.-)-(-._
'|:::|
_|___|_`),
};

// --- animales ---------------------------------------------------------------------
// gato sentado: grande (cerca), mediano y chico. La cola la mueve anim.
export const CAT = {
  L: F(R`
  /\_/\
 ( o o )
 =\ ^ /=
  /   \
 /     \
(  | |  )
 \_|_|_/
 (_| |_)
--
  /\_/\
 ( - - )
 =\ ^ /=
  /   \
 /     \
(  | |  )
 \_|_|_/
 (_| |_)
--
  /\_/\
 ( o o )
 =\ ^ /=
  /   \_/)
 /     \/
(  | |  )
 \_|_|_/
 (_| |_)`),
  M: F(R`
 /\_/\
( o o )
=\ ^ /=
 /   \
(_|_|_)
--
 /\_/\
( - - )
=\ ^ /=
 /   \
(_|_|_)
--
 /\_/\
( o o )
=\ ^ /=
 /   \)
(_|_|/`),
  S: F(R`
/\_/\
(o.o)
(")(")
--
/\_/\
(-.-)
(")(")`),
};
// colas para cada tamaño (se dibujan al lado, a la derecha)
export const TAIL = {
  L: F(R`
 ~~.
    )
 __/
--
  .
 ( )
 _/
--
   _
  ( )
 _/`, ),
  M: F(R`
 ~.
 _)
--
 .
_)
--
 _
_)`),
  S: F(R`
~
--
)`),
};

// gato echado durmiendo (respira)
export const CAT_SLEEP = F(R`
  _.--.__
 (  ^^   )-.
  ª--.____.'
--
  _.--.__
 (  ^^   )-.
  ª-.______.'`);

// gato caminando de perfil, hacia la derecha
export const CAT_WALK = F(R`
 /\_/\
( o.o )____
 =\ /=     \~
   |_|¯¯|_|
--
 /\_/\
( o.o )____
 =\ /=     \~
   /_/¯¯\_\
`);

// gatito con un ovillo
export const KITTEN = F(R`
 /\_/\
(o . o)
 (")(")~
--
 /\_/\
(o . o)
 (")-(")~`);
export const YARN = F(R`
.-.
(%)
--
.-.
(~)`);

// pájaro en su jaula (la jaula la dibuja el cuarto)
export const BIRD = F(R`
 _
(v)
/)
--
 _
(v)>
 )\
--
 _
<v)
 (\
`);

export const FISH = { r: sprite('><>'), l: sprite('<><'), rs: sprite('>'), ls: sprite('<') };

// perro echado
export const DOG = F(R`
   __
 _/ o\__
(___ __ )~
 ¨ ¨  ¨ ¨
--
   __
 _/ -\__
(___ __ )~~
 ¨ ¨  ¨ ¨`);

// alguien acostado: cabeza en la almohada (la frazada la dibuja la cama)
export const SLEEPER = F(R`
 .-.
(- -)
--
 .-.
(- -)`);

// --- tamaño según la distancia -----------------------------------------------------
// el tamaño disponible más parecido a lo que mediría algo de `m` metros a z
// (se compara con el alto real de cada dibujo)
export function tier(K, z, set, m = 1.7) {
  const want = (m * K.M) / z;
  let best = null;
  let bd = Infinity;
  for (const k of Object.keys(set)) {
    const fr = set[k];
    if (!Array.isArray(fr) || !fr[0] || !fr[0].h) continue;
    const d = Math.abs(fr[0].h - want);
    if (d < bd) {
      bd = d;
      best = k;
    }
  }
  return set[best];
}

export { mirror };
