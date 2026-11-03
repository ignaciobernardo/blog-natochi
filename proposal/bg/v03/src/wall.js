// La cuadra de enfrente (z = 1): la capa con más detalle.
//
// Edificios en alzado puestos uno al lado del otro, cada uno con su estilo:
//   depto     bloque de departamentos: balcones con ropa tendida, plantas,
//             bicicletas y parrillas; ventanas con reflejos, cortinas o
//             persianas; aires acondicionados que gotean
//   antiguo   casona de techos altos: balaustrada, ventanas con arco y
//             postigos, balconcitos de fierro
//   oficina   muro cortina de vidrio con reflejos en diagonal
//   galeria   la galería comercial: letrero vertical de neón, oficinas con
//             letreros en las ventanas, pasillo hacia el fondo
//   casa      fachada baja con mural y letrero publicitario en el techo
// La planta baja siempre son locales: letreros, toldos, vitrinas y cortinas
// metálicas con grafitis. Los muros llevan la textura de puntos de la
// referencia con su halo blanco; bajo losas y cornisas va la sombra \_\_\_.
import { Canvas, SP, sprite } from './grid.js';
import { W, resolve, vtext } from './paint.js';

const FH = 6; // filas por piso (departamentos)
const GH = 8; // filas de la planta baja (locales)

// ---------------------------------------------------------------------------
// Plantillas chicas

const AC = [
  sprite(String.raw`
.--.
|##|
´--´
`),
  sprite(String.raw`
.---.
|=:=|
´¯¯¯´
`),
  sprite(String.raw`
[::]
`),
];

// plantas que asoman sobre la baranda
const PLANTS = ['\\|/', 'vYv', ',^,', '*', '{}', 'ww', '\\v/', 'Y', '*.*', '(@)'.replace('@', '*')];

const ROOF = {
  tank: sprite(String.raw`
 .--.
 |::|
 |::|
/´¯¯´\
`),
  tank2: sprite(String.raw`
 ______
(______)
 |    |
 /¯¯¯¯\
`),
  antenna: sprite(String.raw`
-+-+-+-
   |
  _|_
`),
  antenna2: sprite(String.raw`
\|/
 |
 |
_|_
`),
  dish: sprite(String.raw`
 _
( )-
 |
`),
  laundry: sprite(String.raw`
|¯T¯¯n¯¯[]¯A¯¯Y¯|
|               |
`),
  vent: sprite(String.raw`
.-.
|=|
`),
  solar: sprite(String.raw`
 ______
/_/_/_/|
 |    |
`),
  dog: sprite(String.raw`
  __   _
o´  ´-´ ´)
 |´|¯¯|´|
`),
  cat: sprite(String.raw`
/\_/\
(o.o)~
`),
  coop: sprite(String.raw`
  /\
 /  \
|[::]|
|____|
`),
};

const BILLBOARD = sprite(String.raw`
.________________________.
|                        |
|                        |
|                        |
|________________________|
 ´|´¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯´|´
  |                    |
 _|_                  _|_
`);

const MURAL = sprite(String.raw`
     \   |   /              .-.
  ´.  .-´´´-.  .´          (   )   ~~
 ---- ( o  o ) ----         ´-´
  .´  ( ´--´ )  ´.    /\
     /´-...-´\       /  \    /\
  /\/   |  |  \/\  _/    \  /  \
 /  \/\/\  /\/\/  \/      \/    \__
`);

const SHOPS = [
  'BOTILLERÍA', 'FARMACIA', 'PELUQUERÍA', 'MINIMARKET', 'FUENTE DE SODA', 'COMPLETOS', 'EMPANADAS',
  'LAVASECO', 'CERRAJERÍA', 'AMASANDERÍA', 'FERRETERÍA', 'LIBRERÍA', 'BAZAR', 'VERDULERÍA',
  'ZAPATERÍA', 'CYBER', 'SANGUCHES', 'FOTOCOPIAS', 'ÓPTICA', 'CAFÉ', 'SUSHI', 'PAN AMASADO',
  'MOTE CON HUESILLO', 'PASTELERÍA', 'MASCOTAS', 'TELAS', 'RELOJERÍA', 'PICADA',
];
const GOODS = ['o o o o ', 'i!i!i!i!', '[] [] ', '(_) (_) ', 'U U U ', '^ ^ ^ ', '[#][#]', 'ooOOoo ', 'Y Y Y ', '{}{} '];
const TAGS = ['~KAOS~', 'WENA!', 'MAPU', '$ANTI', 'LUZ<3', 'ZUR', 'P1NO', 'ÑOÑO', 'CHAO', 'NTCH', 'OK!', 'TOTO'];
const ADS = [
  ['SE ARRIENDA', 'DEPTOS 2D1B', '+56 9 ....'],
  ['HELADOS', '¡HAY POLOS!', '~ $990 ~'],
  ['CINE AL', 'AIRE LIBRE', 'VIERNES 21H'],
  ['CLASES DE', 'CUECA', 'SÁB 18H'],
];
const OFFICES = ['DENTAL', 'TAROT', 'ABOGADO', 'SASTRE', 'CLASES', 'ARRIENDO', 'CONTADOR', 'PODÓLOGO', 'RELOJES', 'YOGA', 'CUECA', 'MANICURE', 'TATUAJES', 'ÓPTICA', 'COSTURA'];
const MURAL_TEXT = ['vecinos unidos', 'buena onda', 'aquí se baila', 'la calle es nuestra'];

// ---------------------------------------------------------------------------
// Vanos de un piso de departamentos (FH = 6 filas, desde y). Ventana:
//   fila 0    muro
//   fila 1     ______
//   fila 2-4  |  /  /|     vidrio con reflejos o lo que haya adentro
//   fila 5    ¯¯¯¯¯¯¯¯     alféizar; al lado cuelgan aires y jardineras

const INSIDE = {
  curtains: (iw) => ['\\' + ' '.repeat(iw - 2) + '/', ')' + ' '.repeat(iw - 2) + '(', ')' + ' '.repeat(iw - 2) + '('],
  blinds: (iw) => ['='.repeat(iw), '='.repeat(iw), '='.repeat(Math.ceil(iw / 2))],
  person: (iw) => center(iw, ['o', '/|\\', '|']),
  plant: (iw) => center(iw, ['\\|/', ' | ', '(_)'], -1),
  cat: (iw) => (iw >= 6 ? center(iw, ['', '/\\_/\\', '(o.o)'], 1) : ['', '', '']),
  lamp: (iw) => center(iw, ['/¯\\', ' | ', '_|_']),
  tv: (iw) => center(iw, ['', '.--.', '|==|'], 1),
  plain: (iw) => center(iw, ['|', '|', '|']),
  cross: (iw) => center(iw, ['|', '-'.repeat(Math.floor(iw / 2)) + '+' + '-'.repeat(iw - Math.floor(iw / 2) - 1), '|']),
};
function center(iw, rows, shift = 0) {
  return rows.map((r) => {
    const pad = Math.max(0, Math.floor((iw - r.length) / 2) + shift);
    return (' '.repeat(pad) + r + ' '.repeat(iw)).slice(0, iw);
  });
}

function windowBay(cv, rng, x, y, ww, kind, out, extras = true) {
  const iw = ww - 2;
  const c = x + 1;
  cv.text(c, y + 1, '_'.repeat(iw));
  for (let j = 2; j <= 4; j++) cv.text(x, y + j, '|' + ' '.repeat(iw) + '|');
  if (kind === 'reflect') {
    // reflejos: dos trazos diagonales paralelos, como en la referencia
    const a = rng.int(0, Math.max(0, iw - 6));
    for (let j = 0; j < 3; j++) {
      cv.put(c + a + 2 - j, y + 2 + j, 47);
      if (iw > 5) cv.put(c + a + 5 - j, y + 2 + j, 47);
    }
  } else if (kind === 'sign') {
    const fits = OFFICES.filter((o) => o.length <= iw && !out.usedSigns.has(o));
    const word = fits.length ? rng.pick(fits) : '';
    out.usedSigns.add(word);
    cv.text(c + Math.floor((iw - word.length) / 2), y + 3, word);
  } else if (INSIDE[kind]) {
    INSIDE[kind](iw).forEach((r, j) => cv.text(c, y + 2 + j, r));
  }
  for (let k = c; k < c + iw; k++) if (cv.get(k, y + 4) === SP) cv.put(k, y + 4, 95);
  cv.text(x, y + 5, '¯'.repeat(ww));
  out.windows.push([c, y + 2, iw, 3]);
  // aire acondicionado colgando al lado, con su gotera; o una jardinera
  const r = extras ? rng.next() : 1;
  if (r < 0.3) {
    const ac = rng.pick(AC);
    const ax = rng.chance(0.5) ? x + ww : x - ac.w;
    cv.stamp(ac, ax, y + 5 - ac.h + 1);
    out.drips.push([ax + 1, y + 6, rng.range(0, 5)]);
  } else if (r < 0.4) {
    cv.text(x, y + 5, '\\' + 'v*w,v*'.repeat(3).slice(0, ww - 2) + '/');
  }
}

const WINDOW_KINDS = [
  'reflect', 'reflect', 'reflect', 'reflect', 'curtains', 'curtains', 'blinds', 'blinds', 'plain',
  'person', 'plant', 'cross', 'lamp', 'tv', 'reflect', 'curtains', 'cat',
];

// Ropa tendida: dos filas por prenda
const CLOTHES = [
  ['/T\\', '|_|'],
  ['|¯|', '| |'],
  ['[¯]', '[_]'],
  [' A ', '/_\\'],
  ['l l', '´ ´'],
  ['n', 'U'],
  ['T', '|'],
];
const BALCONY_PLANTS = [['', '\\|/'], ['', 'vYv'], ['', ',^,'], ['', '*'], ['', '{}'], ['\\|/', ' | '], ['.^.', '\\|/'], ['', 'ww'], ['*', '|']];

// Balcón: nicho en sombra con la puerta, baranda adelante.
//   fila 0    :::::::::      fondo del nicho
//   fila 1    :: ____ ::     dintel de la puerta (o el cordel con ropa)
//   fila 2-3  ::|  | |::     puerta, plantas, gente
//   fila 4   -|-|-|-|-|-     baranda
//   fila 5   ´¯¯¯¯¯¯¯¯¯`     canto de la losa
function balconyBay(cv, rng, x, y, bw, kind, out) {
  cv.fill(x + 1, y, bw - 2, 4, W.dense);
  const dw = Math.min(bw - 4, 8);
  const dx = x + Math.floor((bw - dw) / 2);
  cv.text(dx + 1, y + 1, '_'.repeat(dw - 2));
  for (let j = 2; j <= 3; j++) cv.text(dx, y + j, '|' + ' '.repeat(dw - 2) + '|');
  const dm = dx + Math.floor(dw / 2);
  cv.put(dm, y + 2, 124);
  cv.put(dm, y + 3, 124);
  out.windows.push([dx + 1, y + 2, dw - 2, 2]);
  const rail = rng.pick(['-|', '-|', '|=', '-+', '#', '::']);
  for (let k = 0; k < bw; k++) {
    let g;
    if (rail === '-|') g = k % 2 ? 124 : 45;
    else if (rail === '|=') g = k % 2 ? 61 : 124;
    else if (rail === '-+') g = k % 3 ? 45 : 43;
    else if (rail === '#') g = 35;
    else g = k % 2 ? 58 : 124;
    cv.put(x + k, y + 4, g);
  }
  cv.text(x, y + 5, '´' + '¯'.repeat(bw - 2) + '`');
  const c0 = x + 1;
  const c1 = x + bw - 2;
  if (kind === 'laundry') {
    cv.text(c0, y + 1, '¯'.repeat(c1 - c0 + 1));
    let k = c0 + rng.int(0, 1);
    while (k < c1) {
      const it = rng.pick(CLOTHES);
      if (k + it[0].length > c1 + 1) break;
      cv.text(k, y + 1, it[0]);
      cv.text(k, y + 2, it[1]);
      out.laundry.push([k, y + 1, it[0]]);
      k += it[0].length + rng.int(0, 1);
    }
  } else if (kind === 'plants') {
    let k = c0;
    while (k < c1) {
      const p = rng.pick(BALCONY_PLANTS);
      const pw = Math.max(p[0].length, p[1].length);
      if (k + pw > c1 + 1) break;
      if (p[0]) cv.text(k, y + 2, p[0]);
      cv.text(k, y + 3, p[1]);
      k += pw + rng.int(0, 1);
    }
  } else if (kind === 'bike') {
    cv.text(c0 + 1, y + 2, ' _\\');
    cv.text(c0 + 1, y + 3, 'o¯o');
  } else if (kind === 'grill') {
    cv.text(c1 - 3, y + 3, '[#]');
    out.smoke.push([c1 - 2, y + 2]);
  } else if (kind === 'person') {
    const px = c0 + rng.int(0, Math.max(0, c1 - c0 - 3));
    cv.put(px + 1, y + 2, 111);
    cv.text(px, y + 3, '/|\\');
  } else if (kind === 'couple') {
    const px = c0 + rng.int(0, Math.max(0, c1 - c0 - 4));
    cv.text(px, y + 2, 'o o');
    cv.text(px, y + 3, '|\\|');
  } else if (kind === 'chairs') {
    cv.text(c0, y + 3, 'h_h');
  } else if (kind === 'lights') {
    // guirnalda de ampolletas (de noche titilan)
    for (let k = c0; k <= c1; k++) cv.put(k, y + 1, (k - c0) % 2 ? 176 : 46);
    out.garlands.push([c0, y + 1, c1 - c0 + 1]);
  }
  if (rng.chance(0.2)) cv.text(x + rng.int(1, bw - 2), y + 6, '{');
}

// ---------------------------------------------------------------------------
// Planta baja: locales. Filas [y, y+GH-1]:
//   0 dintel  1-2 letrero  3-4 toldo  5-7 vitrina y puerta

function awning(cv, rng, x, y, w) {
  const kind = rng.int(0, 4);
  if (kind === 0) {
    cv.text(x, y, '/' + '_|'.repeat(w).slice(0, w - 2) + '\\');
    cv.text(x, y + 1, '\\/'.repeat(w).slice(0, w));
  } else if (kind === 1) {
    cv.text(x, y, '/' + '¯'.repeat(w - 2) + '\\');
    cv.text(x, y + 1, '/\\'.repeat(w).slice(0, w));
  } else if (kind === 2) {
    cv.text(x, y, '/' + '||:'.repeat(w).slice(0, w - 2) + '\\');
    cv.text(x, y + 1, ' ' + 'v'.repeat(w - 2) + ' ');
  } else if (kind === 3) {
    cv.text(x, y, '.' + '-=-'.repeat(w).slice(0, w - 2) + '.');
    cv.text(x, y + 1, '(' + ')'.repeat(w - 2) + ')');
  } else {
    cv.text(x, y, '/' + '\\\\\\/'.repeat(w).slice(0, w - 2) + '\\');
    cv.text(x, y + 1, '¯'.repeat(w));
  }
}

function shop(cv, rng, x, y, w, out, name = null) {
  // nombre que quepa en el letrero
  const fits = SHOPS.filter((s) => s.length <= w - 4);
  name = name || (fits.length ? rng.pick(fits) : 'BAR');
  const closed = rng.chance(0.2);
  // letrero
  const sw = Math.min(w - 2, name.length + 4 + rng.int(0, 4));
  const sx = x + Math.floor((w - sw) / 2);
  const style = rng.int(0, 2);
  const lx = sx + Math.floor((sw - name.length) / 2);
  if (style === 0) {
    cv.text(sx, y + 1, '.' + '¯'.repeat(sw - 2) + '.');
    cv.text(sx, y + 2, '|' + ' '.repeat(sw - 2) + '|');
    cv.text(lx, y + 2, name);
  } else if (style === 1) {
    cv.text(sx, y + 1, '_'.repeat(sw));
    cv.text(sx, y + 2, '[' + ' '.repeat(sw - 2) + ']');
    cv.text(lx, y + 2, name);
  } else {
    cv.text(lx - 2, y + 2, '* ' + name + ' *');
    cv.text(sx, y + 1, '.'.repeat(0));
  }
  out.neons.push({ x: lx, y: y + 2, text: name, kind: 'sign', flick: rng.chance(0.4) });
  if (closed) {
    // cortina metálica con grafiti y candado
    cv.text(x, y + 3, '_'.repeat(w));
    for (let j = y + 4; j < y + GH; j++) cv.text(x, j, '|' + '='.repeat(w - 2) + '|');
    const tag = rng.pick(TAGS);
    if (tag.length < w - 4) cv.text(x + 2 + rng.int(0, w - 4 - tag.length), y + 5, tag);
    cv.text(x + Math.floor(w / 2), y + GH - 1, 'ô');
    return;
  }
  awning(cv, rng, x, y + 3, w);
  // puerta
  const dw = 5;
  const doorLeft = rng.chance(0.5);
  const dx = doorLeft ? x + 1 : x + w - 1 - dw;
  cv.text(dx, y + 5, '|' + '¯'.repeat(dw - 2) + '|');
  cv.text(dx, y + 6, '|' + ' '.repeat(dw - 2) + '|');
  cv.text(dx, y + 7, '|' + ' '.repeat(dw - 2) + '|');
  cv.put(dx + dw - 2, y + 6, 111);
  if (rng.chance(0.4)) {
    // alguien en la puerta
    cv.put(dx + 1, y + 5, 111);
    cv.text(dx + 1, y + 6, '|');
  }
  // vitrina con mercadería
  const vx0 = doorLeft ? dx + dw + 1 : x + 1;
  const vx1 = doorLeft ? x + w - 2 : dx - 2;
  if (vx1 - vx0 >= 3) {
    cv.text(vx0, y + 5, '.' + '¯'.repeat(vx1 - vx0 - 1) + '.');
    const goods = rng.pick(GOODS);
    cv.put(vx0, y + 6, 124);
    cv.put(vx1, y + 6, 124);
    for (let k = vx0 + 1; k < vx1; k++) cv.put(k, y + 6, goods.charCodeAt((k - vx0) % goods.length));
    cv.text(vx0, y + 7, '|' + '_'.repeat(vx1 - vx0 - 1) + '|');
    out.shopLights.push([vx0 + 1, y + 6, vx1 - vx0 - 1]);
  }
}

// ---------------------------------------------------------------------------
// Techos

function roofProps(cv, rng, x, w, y, out) {
  let k = x + 2;
  const opts = ['tank', 'tank2', 'antenna', 'antenna2', 'dish', 'laundry', 'vent', 'solar', 'dog', 'cat', 'coop'];
  while (k < x + w - 5) {
    const name = rng.pick(opts);
    const s = ROOF[name];
    if (rng.chance(0.25) || k + s.w > x + w - 1) {
      k += rng.int(2, 5);
      continue;
    }
    cv.stamp(s, k, y - s.h + 1);
    if (name === 'laundry') out.laundry.push([k + 2, y - 1, 'T'], [k + 5, y - 1, 'n'], [k + 11, y - 1, 'A']);
    if (name === 'antenna2') out.beacons.push([k + 1, y - s.h + 1]);
    k += s.w + rng.int(1, 4);
  }
}

// cuerpo de un edificio: muro con textura, costados y base
function body(cv, x, w, top, base, tex) {
  cv.fill(x + 1, top, w - 2, base - top + 1, tex);
  cv.vline(x, top, base, 124);
  cv.vline(x + w - 1, top, base, 124);
}

function groundFloor(cv, rng, x, w, gy, out) {
  cv.text(x, gy, '|' + '_'.repeat(w - 2) + '|');
  let k = x + 1;
  while (k < x + w - 6) {
    let sw = Math.min(x + w - 1 - k, rng.int(13, 21));
    if (x + w - 1 - (k + sw) < 9) sw = x + w - 1 - k; // que no quede un resto chico
    shop(cv, rng, k, gy, sw, out);
    k += sw;
    if (k < x + w - 1) {
      for (let j = gy + 1; j < gy + GH; j++) cv.put(k, j, 124);
      // medidor de luz en el pilar
      cv.text(k - 1, gy + 3, rng.chance(0.5) ? '[o]' : '|');
    }
    k += 1;
  }
}

// bajada de aguas lluvia por un costado
function drainpipe(cv, x, top, bottom) {
  for (let j = top; j <= bottom; j++) cv.put(x, j, (j - top) % 5 === 4 ? 43 : 124);
  cv.put(x, bottom, 76);
}

function depto(cv, rng, x, w, floors, base, out) {
  const gy = base - GH + 1;
  const top = gy - floors * FH - 2;
  // estilo: todo balcones (muro claro) / todo ventanas (muro punteado) / mixto
  const mode = rng.pick(['balcony', 'window', 'mixed', 'mixed']);
  const tex = mode === 'balcony' ? rng.pick([W.light, W.sparse, W.blank]) : rng.pick([W.dots, W.dots, W.light]);
  body(cv, x, w, top + 2, base, tex);
  // cornisa: línea doble y sombra
  cv.text(x, top, '_'.repeat(w));
  cv.text(x, top + 1, '|' + rng.pick(['¯', '¯', '=', '-.']).repeat(w).slice(0, w - 2) + '|');
  for (let k = x + 1; k < x + w - 1; k++) cv.put(k, top + 2, (k - x) % 2 ? 92 : SP);
  // vanos: cuántos caben y de qué ancho, para llenar la fachada
  const pier = 3;
  const n = Math.max(1, Math.min(3, Math.floor((w - 1) / 12)));
  const bw = Math.min(14, Math.floor((w - 4 - (n - 1) * pier) / n));
  const used = n * bw + (n - 1) * pier;
  const x0 = x + Math.floor((w - used) / 2);
  const colKind = [];
  for (let i = 0; i < n; i++) colKind.push(mode === 'mixed' ? (i % 2 === 0 ? 'balcony' : 'window') : mode);
  for (let f = 0; f < floors; f++) {
    const fy = gy - (f + 1) * FH;
    for (let i = 0; i < n; i++) {
      const bx = x0 + i * (bw + pier);
      if (colKind[i] === 'balcony') {
        const kind = rng.pick(['laundry', 'plants', 'plants', 'empty', 'bike', 'grill', 'person', 'laundry', 'couple', 'chairs', 'lights']);
        balconyBay(cv, rng, bx, fy, bw, kind, out);
      } else {
        const kind = rng.pick(WINDOW_KINDS);
        const ww = bw - 3;
        windowBay(cv, rng, bx + 1, fy, ww, kind, out);
      }
    }
  }
  if (x0 - x >= 3) drainpipe(cv, x + 1, top + 3, gy - 1);
  groundFloor(cv, rng, x, w, gy, out);
  roofProps(cv, rng, x, w, top - 1, out);
}

function antiguo(cv, rng, x, w, floors, base, out) {
  const gy = base - GH + 1;
  const FH2 = 7;
  const top = gy - floors * FH2 - 4;
  body(cv, x, w, top + 3, base, rng.pick([W.light, W.sparse]));
  // balaustrada, cornisa y su sombra
  cv.text(x, top, '.' + '_'.repeat(w - 2) + '.');
  cv.text(x, top + 1, '|' + 'i'.repeat(w - 2) + '|');
  cv.text(x - 1, top + 2, '<' + '='.repeat(w) + '>');
  for (let k = x + 1; k < x + w - 1; k++) cv.put(k, top + 3, (k - x) % 2 ? 92 : SP);
  cv.text(x + 1, top - 1, '(_)');
  cv.text(x + w - 4, top - 1, '(_)');
  const bw = 9;
  const pier = 5;
  const n = Math.max(1, Math.floor((w - 4 + pier) / (bw + pier)));
  const used = n * bw + (n - 1) * pier;
  const x0 = x + Math.floor((w - used) / 2);
  for (let f = 0; f < floors; f++) {
    const fy = gy - (f + 1) * FH2;
    // moldura entre pisos
    if (f > 0) cv.text(x + 1, fy + FH2 - 1, '-.'.repeat(w).slice(0, w - 2));
    for (let i = 0; i < n; i++) {
      const bx = x0 + i * (bw + pier);
      const wx = bx + 2;
      const ww = bw - 4;
      // clave del arco y arco
      cv.put(wx + Math.floor(ww / 2), fy, 118);
      cv.text(wx - 1, fy + 1, '.-' + '¯'.repeat(ww - 2) + '-.');
      for (let j = 2; j <= 4; j++) cv.text(wx - 1, fy + j, '|' + ' '.repeat(ww) + '|');
      const m = wx + Math.floor(ww / 2) - 1;
      const kind = rng.pick(['cross', 'cross', 'curtains', 'open']);
      for (let j = 2; j <= 4; j++) cv.put(m, fy + j, 124);
      if (kind === 'cross') cv.text(wx, fy + 3, '-'.repeat(ww));
      if (kind === 'cross') cv.put(m, fy + 3, 43);
      if (kind === 'curtains') {
        cv.put(wx, fy + 2, 92);
        cv.put(wx + ww - 1, fy + 2, 47);
        cv.put(wx, fy + 3, 41);
        cv.put(wx + ww - 1, fy + 3, 40);
      }
      if (kind === 'open') {
        cv.put(m + 1, fy + 2, 47);
        cv.put(m + 1, fy + 3, 124);
      }
      for (let k = wx; k < wx + ww; k++) if (cv.get(k, fy + 4) === SP) cv.put(k, fy + 4, 95);
      out.windows.push([wx, fy + 2, m - wx, 3], [m + 1, fy + 2, wx + ww - m - 1, 3]);
      // postigos abiertos
      for (let j = 2; j <= 4; j++) {
        cv.put(wx - 2, fy + j, 61);
        cv.put(wx + ww + 1, fy + j, 61);
      }
      // balconcito de fierro y ménsulas
      cv.text(bx, fy + 5, '(' + 'xXxXxXxXxXx'.slice(0, bw - 2) + ')');
      cv.text(bx + 2, fy + 6, '´v´');
      cv.text(bx + bw - 5, fy + 6, '´v´');
      if (rng.chance(0.5)) cv.text(wx + rng.int(0, ww - 3), fy + 4, rng.pick(['\\|/', '*v*', ',^,']));
    }
  }
  // planta baja: portón con arco y número, y un local
  const pw = 9;
  const px = x + 2;
  cv.text(x, gy, '|' + '_'.repeat(w - 2) + '|');
  cv.text(px, gy + 1, '.-´¯¯¯`-.');
  cv.text(px, gy + 2, '|' + ' '.repeat(pw - 2) + '|');
  for (let j = gy + 3; j < gy + GH; j++) cv.text(px, j, '|' + '¦¦¦ ¦¦¦'.slice(0, pw - 2) + '|');
  cv.text(px + 3, gy + 2, String(rng.int(100, 999)));
  shop(cv, rng, px + pw + 1, gy, w - pw - 4, out);
}

function oficina(cv, rng, x, w, floors, base, out) {
  const gy = base - GH + 1;
  const top = gy - floors * 4 - 2;
  cv.vline(x, top, base, 124);
  cv.vline(x + w - 1, top, base, 124);
  // muro cortina: losas cada 4 filas, montantes cada 5 col, reflejos /__/
  for (let j = top + 1; j < gy - 1; j++) {
    const y = j - top;
    for (let k = x + 1; k < x + w - 1; k++) {
      const u = k - x;
      let ch = SP;
      if (u % 9 === 0) ch = 124;
      else if ((u * 1 + y) % 3 === 0 && (u + y) % 11 < 7) ch = 47;
      if (y % 4 === 0 && ch === SP) ch = 95;
      cv.put(k, j, ch);
    }
    if (y % 4 === 2) out.windows.push([x + 1, j, w - 2, 1]);
  }
  // gente en algunas oficinas
  for (let f = 1; f < floors; f++) {
    if (!rng.chance(0.45)) continue;
    const j = top + f * 4 - 1;
    const k = x + 2 + rng.int(0, w - 6);
    cv.text(k, j - 1, ' o ');
    cv.text(k, j, '/|\\');
  }
  cv.text(x, top, '_'.repeat(w));
  cv.text(x - 1, top - 1, '[' + '='.repeat(w) + ']');
  cv.text(x + 3, top - 2, '|');
  cv.text(x + 3, top - 3, '|');
  cv.text(x + 3, top - 4, '.');
  out.beacons.push([x + 3, top - 4]);
  cv.text(x + w - 13, top - 3, '.--------.');
  cv.text(x + w - 13, top - 2, '|  ~oo~  |');
  cv.text(x + w - 13, top - 1, '´--------´'.replace(/-/g, '¯'));
  // planta baja: columnas y vidrio
  cv.text(x, gy - 1, '|' + '='.repeat(w - 2) + '|');
  cv.text(x, gy, '|' + '¯'.repeat(w - 2) + '|');
  for (let j = gy + 1; j <= base; j++) {
    for (let k = x + 1; k < x + w - 1; k++) cv.put(k, j, (k - x) % 6 === 0 ? 124 : j === gy + 4 ? 175 : SP);
  }
  const label = rng.pick(['FARMACIA', 'BANCO', 'CAJERO', 'NOTARÍA', 'SEGUROS']);
  const lx = x + Math.floor((w - label.length - 2) / 2);
  cv.text(lx, gy + 2, ' ' + label + ' ');
  out.neons.push({ x: lx + 1, y: gy + 2, text: label, kind: 'sign', flick: false });
  cv.text(x + Math.floor(w / 2) - 2, gy + 5, '(|||)');
  cv.text(x + Math.floor(w / 2) - 2, gy + 6, '(|||)');
  cv.text(x + Math.floor(w / 2) - 2, gy + 7, '(|||)');
}

function galeria(cv, rng, x, w, floors, base, out) {
  out.usedSigns.clear();
  const gy = base - GH + 1;
  const top = gy - floors * FH - 2;
  body(cv, x, w, top + 2, base, W.dots);
  cv.text(x, top, '_'.repeat(w));
  cv.text(x, top + 1, '|' + '¯'.repeat(w - 2) + '|');
  for (let k = x + 1; k < x + w - 1; k++) cv.put(k, top + 2, (k - x) % 2 ? 92 : SP);
  // oficinas: ventanas, algunas con letreros pegados
  for (let f = 0; f < floors; f++) {
    const fy = gy - (f + 1) * FH;
    let k = x + 3;
    while (k + 10 < x + w - 8) {
      windowBay(cv, rng, k, fy, 10, rng.chance(0.4) ? 'sign' : rng.pick(['reflect', 'blinds', 'plain', 'person', 'reflect']), out, rng.chance(0.25));
      k += 13;
    }
  }
  // letrero vertical de neón con estrellas que corren
  const word = rng.pick(['HOSTAL', 'BILLAR', 'BAILES', 'KARAOKE', 'SALÓN']);
  const sx = x + w - 5;
  const sy = top + 4;
  cv.text(sx - 1, sy - 1, '.¯¯¯.');
  for (let i = 0; i < word.length * 2 + 1; i++) cv.text(sx - 1, sy + i, '|   |');
  cv.text(sx - 1, sy + word.length * 2 + 1, '´¯¯¯´');
  cv.text(sx, sy + word.length * 2 + 2, '´|´');
  vtext(cv, sx + 1, sy + 1, word, 2);
  out.neons.push({ x: sx + 1, y: sy + 1, text: word, kind: 'vertical', stars: [sx, sy + 2, word.length] });
  // entrada: arco con el nombre y el pasillo hacia el fondo
  const ew = 18;
  const ex = x + 3;
  cv.text(x, gy, '|' + '_'.repeat(w - 2) + '|');
  cv.text(ex, gy + 1, '.-' + '¯'.repeat(ew - 4) + '-.');
  cv.text(ex, gy + 2, '|' + ' '.repeat(ew - 2) + '|');
  const gname = 'GALERÍA ' + rng.pick(['SOL', 'ANDES', 'CENTRO', 'LUZ']);
  cv.text(ex + Math.floor((ew - gname.length) / 2), gy + 2, gname);
  out.neons.push({ x: ex + Math.floor((ew - gname.length) / 2), y: gy + 2, text: gname, kind: 'sign', flick: true });
  for (let j = gy + 3; j <= base; j++) {
    cv.text(ex, j, '|' + ' '.repeat(ew - 2) + '|');
    const d = j - gy - 3;
    cv.put(ex + 1 + d, j, 92);
    cv.put(ex + ew - 2 - d, j, 47);
  }
  // fondo del pasillo: vitrinas chiquitas y alguien caminando
  cv.text(ex + 6, gy + 6, '[][][]');
  cv.text(ex + 5, gy + 7, '_______');
  cv.text(ex + 8, gy + 4, 'o');
  cv.text(ex + 7, gy + 5, '/|\\');
  if (w - ew - 6 > 10) shop(cv, rng, ex + ew + 1, gy, w - ew - 5, out);
}

function casa(cv, rng, x, w, floors, base, out) {
  const gy = base - GH + 1;
  const top = gy - 9;
  body(cv, x, w, top + 1, base, W.light);
  // tejado
  cv.text(x - 1, top, '/' + '¯'.repeat(w) + '\\');
  cv.text(x, top - 1, '/' + '\\/'.repeat(w).slice(0, w - 2) + '\\');
  // mural
  const mx = x + Math.floor((w - MURAL.w) / 2);
  cv.fill(mx - 1, top + 1, MURAL.w + 2, MURAL.h + 1, SP);
  cv.stamp(MURAL, mx, top + 1);
  const txt = rng.pick(MURAL_TEXT);
  cv.text(x + Math.floor((w - txt.length) / 2), gy - 1, txt);
  groundFloor(cv, rng, x, w, gy, out);
  const ad = rng.pick(ADS);
  const bx = x + Math.floor((w - BILLBOARD.w) / 2);
  const by = top - 1 - BILLBOARD.h;
  cv.stamp(BILLBOARD, bx, by);
  ad.forEach((l, i) => cv.text(bx + Math.floor((BILLBOARD.w - l.length) / 2), by + 1 + i, l));
  out.bulbs.push([bx + 2, by, BILLBOARD.w - 4]);
}

function pasaje(cv, rng, x, w, base) {
  // portón de reja entre dos edificios; arriba queda abierto
  cv.text(x, base - 5, '_'.repeat(w));
  cv.text(x, base - 4, '|' + '^'.repeat(w - 2) + '|');
  for (let j = base - 3; j <= base; j++) cv.text(x, j, '|' + '|:'.repeat(w).slice(0, w - 2) + '|');
  cv.text(x + 1, base - 7, '.' + '-'.repeat(w - 4) + '.');
  cv.text(x + 1, base - 6, '| PJE |'.slice(0, w - 2));
}

// grafitis y afiches en los muros bajos
function streetMarks(cv, rng, x, w, base) {
  for (let i = 0; i < 3; i++) {
    const tag = rng.pick(TAGS);
    const tx = x + rng.int(1, Math.max(1, w - tag.length - 1));
    const ty = base - rng.int(0, 2);
    let ok = true;
    for (let k = 0; k < tag.length; k++) if (cv.get(tx + k, ty) !== SP && cv.get(tx + k, ty) >= 32) ok = false;
    if (ok) cv.text(tx, ty, tag);
  }
}

// ---------------------------------------------------------------------------

export function buildWall(rng, { extra = 0 } = {}) {
  const h = 52 + extra * FH;
  // secuencia de la cuadra: tipo, ancho, pisos
  const plan = [
    ['antiguo', 34, 3],
    ['depto', 34, 6],
    ['pasaje', 9, 0],
    ['galeria', 40, 5],
    ['depto', 30, 4],
    ['casa', 32, 1],
    ['oficina', 30, 9],
    ['depto', 36, 6],
    ['pasaje', 9, 0],
    ['antiguo', 30, 2],
    ['depto', 30, 5],
    ['casa', 30, 1],
    ['depto', 38, 6],
    ['galeria', 34, 4],
    ['depto', 40, 5],
  ];
  // el ancho del lienzo es la suma de los anchos: la cuadra se repite sin costura
  const w = plan.reduce((a, b) => a + b[1], 0);
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  const out = { windows: [], drips: [], laundry: [], neons: [], smoke: [], shopLights: [], beacons: [], bulbs: [], garlands: [], usedSigns: new Set() };
  const mid = Math.floor(w / 2);
  let x = mid - 86;
  for (let [type, bw, floors] of plan) {
    // en pantallas altas los edificios altos crecen
    if (floors >= 5) floors += extra;
    if (type === 'depto') depto(cv, rng, x, bw, floors, base, out);
    else if (type === 'antiguo') antiguo(cv, rng, x, bw, floors, base, out);
    else if (type === 'oficina') oficina(cv, rng, x, bw, floors, base, out);
    else if (type === 'galeria') galeria(cv, rng, x, bw, floors, base, out);
    else if (type === 'casa') casa(cv, rng, x, bw, floors, base, out);
    else if (type === 'pasaje') pasaje(cv, rng, x, bw, base);
    if (type !== 'pasaje') streetMarks(cv, rng, x + 1, bw - 2, base - 1);
    x += bw;
  }
  resolve(cv);
  return { cv, ...out };
}
