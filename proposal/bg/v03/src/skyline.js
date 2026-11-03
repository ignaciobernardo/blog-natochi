// El skyline lejano (z ~3.4) y el cerro con el teleférico (z ~4.6).
//
// Torres en alzado con texturas finas (vidrio rayado, ventanas punteadas,
// franjas), coronas variadas (antenas con baliza, escalones, estanques) y dos
// protagonistas: la torre de vidrio muy alta con la corona calada y la torre
// de telecomunicaciones con su plato.
import { Canvas, SP, sprite } from './grid.js';
import { TEX, box, rope } from './paint.js';

// corona calada de la torre de vidrio: se ve el cielo a través del enrejado
const GLASS_CROWN = sprite(String.raw`
░░░.░░░.░░░
░░░|░░░|░░░
░░/|\░/|\░░
░/░|░X░|░\░
/░░|/░\|░░\
|\/\/░\/\/|
`);

const ANTENNA_TOP = sprite(String.raw`
░░░░░.░░░░░
░░░░░|░░░░░
░░░░-+-░░░░
░░░░░|░░░░░
░░░.´|´.░░░
░_.-´¯¯¯´-._
(=-=-=-=-=-=)
░´-._____.-´
░░░░|:.:|░░░
`);

const CHURCH = sprite(String.raw`
░░░+░░░
░░░|░░░
░░/:\░░
░/:.:\░
░|/¯\|░
░||░||░
.|¯¯¯|.
|¯¯¯¯¯|
|./¯\.|
|.|░|.|
`);

const TREE = [
  sprite(String.raw`
 .-.
(:.:)
 ´|´
`),
  sprite(String.raw`
  .-.
.(:.:).
 (.:.)
  ´|´
`),
  sprite(String.raw`
 ,
/:\
/.:\
 |
`),
];

const TANK = sprite(String.raw`
░_░
[_]
/¯\
`);

// Torre genérica. Devuelve las ventanas para encenderlas de noche.
function tower(cv, rng, x, w, top, base, style, out) {
  box(cv, x, top, w, base, TEX[style]);
  // zócalo: la planta baja más oscura
  for (let k = 1; k < w - 1; k++) cv.put(x + k, base, k % 2 ? 46 : 95);
  if (style === 'punched' || style === 'checker') {
    for (let j = top + 1; j < base - 1; j += 2) for (let k = 1; k < w - 2; k += 3) out.windows.push([x + k, j, 2]);
  } else if (style === 'ribbons') {
    for (let j = top + 2; j < base - 1; j += 3) out.windows.push([x + 1, j, w - 2]);
  }
  // corona
  const kind = rng.pick(['antenna', 'antenna', 'steps', 'tank', 'flat', 'pyramid']);
  const cx = x + Math.floor(w / 2);
  if (kind === 'antenna') {
    const hgt = rng.int(2, 5);
    for (let j = 1; j <= hgt; j++) cv.put(cx, top - j + 1, 124);
    cv.put(cx, top - hgt, 46);
    out.beacons.push([cx, top - hgt]);
    if (rng.chance(0.5) && w > 5) {
      cv.put(cx - 2, top, 124);
      cv.put(cx - 2, top - 1, 46);
    }
  } else if (kind === 'steps' && w > 6) {
    const w2 = w - 4;
    box(cv, x + 2, top - 2, w2, top, TEX.vfins);
    if (w2 > 6) box(cv, x + 4, top - 4, w2 - 4, top - 2, TEX.plain);
  } else if (kind === 'tank' && w > 5) {
    cv.stamp(TANK, x + 1 + rng.int(0, w - 5), top - 2);
  } else if (kind === 'pyramid' && w > 4) {
    const half = Math.floor((w - 1) / 2);
    for (let j = 0; j < half; j++) {
      cv.put(x + j + 1, top - j, 47);
      cv.put(x + w - 2 - j, top - j, 92);
      for (let k = x + j + 2; k < x + w - 2 - j; k++) cv.put(k, top - j, (k + j) % 2 ? 58 : SP);
    }
    cv.put(cx, top - half, 94);
  }
}

// La torre de vidrio: angosta arriba, se ensancha de a una columna por lado
// cada `step` filas; vidrio con reflejos diagonales y losas cada 3 filas.
function glassTower(cv, x0, top, base, out) {
  const wTop = 11;
  const step = 8;
  const cx = x0 + Math.floor(wTop / 2);
  cv.stamp(GLASS_CROWN, x0, top - GLASS_CROWN.h);
  out.beacons.push([x0 + 3, top - GLASS_CROWN.h], [x0 + 7, top - GLASS_CROWN.h]);
  for (let j = top; j <= base; j++) {
    const grow = Math.floor((j - top) / step);
    const half = Math.floor(wTop / 2) + grow;
    const l = cx - half;
    const r = cx + half;
    const stepRow = (j - top) % step === 0 && j > top;
    for (let x = l + 1; x < r; x++) {
      const k = x - l;
      const y = j - top;
      // reflejo: banda diagonal densa, el resto con rayado suelto
      // reflejo: franjas diagonales /__/ como el vidrio de la referencia
      let ch = SP;
      if ((k + y) % 3 === 0 && (k + y) % 12 < 8) ch = 47;
      else if (y % 3 === 0) ch = 95;
      cv.put(x, j, ch);
    }
    cv.put(l, j, stepRow ? 47 : 124);
    cv.put(r, j, stepRow ? 92 : 124);
    if (stepRow) {
      cv.put(l + 1, j - 1, 124);
      cv.put(r - 1, j - 1, 124);
    }
  }
  // el andamio colgante de los limpiavidrios
  const gy = top + 12;
  cv.text(cx + 1, gy, '[_]');
  for (let j = top + 1; j < gy; j++) cv.put(cx + 2, j, 39);
}

function antennaTower(cv, x0, top, base, out) {
  cv.stamp(ANTENNA_TOP, x0, top);
  out.beacons.push([x0 + 5, top]);
  for (let j = top + ANTENNA_TOP.h; j <= base; j++) {
    cv.text(x0 + 4, j, (j - top) % 6 === 0 ? '|=-=|' : (j - top) % 2 ? '|:.:|' : '|.:.|');
  }
}

export function buildSkyline(rng, { w = 320, h = 40 } = {}) {
  const cv = new Canvas(w, h, true);
  const base = h - 1;
  const out = { windows: [], beacons: [] };
  const mid = Math.floor(w / 2);
  const styles = ['punched', 'glassBand', 'dots', 'vfins', 'ribbons', 'checker', 'hbands', 'dotsLight'];

  // Lista de torres: primero las altas (atrás), después las bajas (adelante).
  const list = [];
  let x = 0;
  while (x < w) {
    const bw = rng.int(6, 14);
    // cerca del cerro (a la izquierda del centro) el skyline es bajo: parque
    const nearCerro = Math.abs(x - (mid - 62)) < 34;
    const nearGlass = Math.abs(x - (mid + 14)) < 14;
    const hgt = nearCerro ? rng.int(3, 6) : nearGlass ? rng.int(6, 11) : rng.int(5, rng.chance(0.2) ? 19 : 13);
    list.push({ x: x + rng.int(-2, 1), w: bw, top: base - hgt, style: rng.pick(styles) });
    x += bw - rng.int(0, 3);
  }
  list.sort((a, b) => a.top - b.top);
  for (const b of list) tower(cv, rng, b.x, b.w, b.top, base, b.style, out);

  // parque con árboles frente al cerro
  for (let px = mid - 92; px < mid - 32; px += rng.int(4, 7)) {
    const t = rng.pick(TREE);
    cv.stamp(t, px, base - t.h + 1);
  }
  cv.stamp(CHURCH, mid - 40, base - CHURCH.h + 1);

  // las protagonistas
  antennaTower(cv, mid - 24, base - 21, base, out);
  glassTower(cv, mid + 8, base - 27, base, out);
  return { cv, ...out };
}

// ---------------------------------------------------------------------------
// El cerro: una loma redonda con bosque, el santuario y la estatua arriba, y
// el teleférico subiendo por el flanco con cabinas que se mueven.

const STATUE = sprite(String.raw`
░.░
(|)
/|\
[_]
|¯|
`);

const CABIN = sprite(String.raw`
░|░
[o]
`);

export function buildCerro(rng, { w = 360, h = 18 } = {}) {
  const cv = new Canvas(w, h, true);
  const cx = Math.floor(w / 2) - 64; // la cumbre queda a la izquierda del centro
  const peakY = 5;
  const half = 40;
  // perfil: domo con copas de árboles en el borde
  const top = [];
  for (let x = cx - half; x <= cx + half; x++) {
    const u = (x - cx) / half;
    const y = peakY + (h - peakY) * Math.pow(Math.abs(u), 1.6);
    top.push([x, y]);
  }
  for (const [x, y] of top) {
    const row = Math.round(y);
    for (let j = row + 1; j < h; j++) {
      const ch = x % 2 === 0 ? ((x * 3 + j * 7) % 5 === 0 ? 44 : 58) : SP;
      cv.put(x, j, ch);
    }
    // borde: copas de árboles `.-.` y `( )`
    const k = (x - cx + 200) % 4;
    const steep = Math.abs(x - cx) > half * 0.55;
    if (steep) cv.put(x, row, x < cx ? 47 : 92);
    else cv.put(x, row, k === 0 ? 46 : k === 1 ? 45 : k === 2 ? 46 : 39);
  }
  // copas de árboles sueltas sobre la ladera
  for (let i = 0; i < 26; i++) {
    const x = cx + rng.int(-half + 8, half - 8);
    const y = Math.round(peakY + (h - peakY) * Math.pow(Math.abs((x - cx) / half), 1.6)) + rng.int(2, 6);
    if (y < h - 1) cv.text(x - 1, y, rng.pick(['.^.', '(:)', '/\\', '.-.']));
  }
  // santuario y estatua en la cumbre
  cv.stamp(STATUE, cx - 1, peakY - STATUE.h + 1);
  cv.text(cx - 6, peakY - 1, '_/¯\\_');
  cv.text(cx + 4, peakY - 2, '|');
  cv.text(cx + 4, peakY - 3, '+');
  // antenas
  cv.text(cx + 14, peakY - 1, '|');
  cv.text(cx + 14, peakY - 2, 'Y');
  // cable del teleférico: de la base izquierda a la cumbre
  const a = [cx - 34, h - 3];
  const b = [cx - 6, peakY + 1];
  rope(cv, a[0], a[1], b[0], b[1], 1.2);
  cv.text(a[0] - 2, a[1], '[#]');
  cv.text(b[0] - 1, b[1] - 1, '[#]');
  return { cv, cable: { a, b, sag: 1.2, cabin: CABIN } };
}
