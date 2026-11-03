// Capas del fondo, cada una dibujada a su propia escala (los glifos no se
// escalan: lo lejano se dibuja más chico a mano):
//   patios    f 0.75  muros, galpones, árboles y autos estacionados, base E+12
//   media     f 0.5   piso = 2 filas, calle con autos chicos, base E+8
//   lejana    f 0.25  piso = 1 fila, base E+4
//   skyline   f 0.1   torres punteadas, grúas, la torre de TV, base E+2
//   cerros    f 0.035 la cordillera
// Todas dejan libres los corredores de las calles transversales y del río,
// que así se ven hasta el fondo convergiendo hacia el centro.
import { Grid, SP, sprite } from './grid.js';
import { Rng, hash2 } from './rng.js';
import { M, L, RIVER, PARK } from './world.js';

const R = String.raw;
const pick = (rng, a) => a[Math.floor(rng.next() * a.length)];

export function makeLayer(f, baseRow, height, extraW = 0) {
  const W = Math.ceil(L * f + 2 * M + 60 + extraW);
  return { f, baseRow, g: new Grid(W, height), boxes: [], windows: [], smokes: [], lights: [], W };
}

// corredores bloqueados en coordenadas locales de una capa
function corridors(streets, f, pad = 0) {
  const toL = (x) => Math.round(x * f + M);
  return [...streets.map(([a, b]) => [toL(a) - pad, toL(b) + pad]), [toL(RIVER[0]) - pad, toL(RIVER[1]) + pad]];
}

// avanza x hasta un lote libre de ancho w; devuelve [x, w] o null
function fit(x, w, blocked, minW) {
  const hit = blocked.find(([a, b]) => x < b && x + w > a);
  if (!hit) return [x, w];
  if (hit[0] - x >= minW) return [x, hit[0] - x - 1];
  return null;
}
const skipTo = (x, blocked) => {
  const hit = blocked.find(([a, b]) => x >= a && x < b);
  return hit ? hit[1] + 1 : x + 1;
};

// --- patios (f 0.75) ----------------------------------------------------------

const PATIO = [
  sprite(R`
 ____________
|  ¶¶¶¶¶¶¶¶  |
|  ¶¶¶¶¶¶¶¶  |
|____________|
`),
  sprite(R`
   _______
  /_/_/_/_\
  |  _   |
  | | |  |
`),
  sprite(R`
   .--.
  (  . )
 ( .   )
  '-||'
    ||
`),
  sprite(R`
 _|_|_|_|_|_|_
 _|_|_|_|_|_|_
`, 'line'),
  sprite(R`
 |¯¯¯¯¯¯¯¯¯|
 | []  /\  |
 |   {}    |
`, 'line'),
  sprite(R`
    __
 _/¯  \_
'-o--o-'
`),
  sprite(R`
  /\
 /__\
 |o |
`),
  sprite(R`
  ____
 |____|
 |    |
`),
];

export function buildPatio(streets, seed = 61) {
  const f = 0.75;
  const ly = makeLayer(f, 8, 13);
  const B = ly.baseRow;
  const rng = new Rng(seed);
  const { g } = ly;
  const blocked = corridors(streets, f, 1);
  // suelo punteado
  for (let y = B + 1; y < g.h; y++)
    for (let x = 0; x < ly.W; x++) {
      if (blocked.some(([a, b]) => x >= a && x < b)) continue;
      if ((x + 2 * y) % 6 === 0) g.put(x, y, '.');
      else if (hash2(x, y) < 0.03) g.put(x, y, ',');
    }
  let x = 2;
  while (x < ly.W - 12) {
    const s = pick(rng, PATIO);
    const ok = fit(x, s.w, blocked, s.w);
    if (!ok || ok[1] < s.w) {
      x = skipTo(x, blocked);
      continue;
    }
    // el muro con afiche recibe un dibujo distinto cada vez
    g.blit(s, x, B - s.h + 1);
    if (s === PATIO[0]) g.text(x + 3, B - 1, pick(rng, [' VOTE ', ' ~*~ ', ' AMOR ', ' <3 ', ' SOL ']).padEnd(8).slice(0, 8));
    x += s.w + rng.int(2, 10);
  }
  return ly;
}

// --- capa media (f 0.5) -------------------------------------------------------

const MID_ROOF = [
  sprite(R`
 /\
|__|
 ||
`),
  sprite(R`
 _|_
  |
`, 'line'),
  sprite(R`
 .-.
(___)
`),
  sprite(R`
  +
 /_\
 |_|
`),
  sprite(R`
 _
|=|
`),
  sprite(R`
 ______
|[____]|
 |    |
`),
  sprite(R`
 ~ ~
 |~|
`, 'line'),
];

function midBuilding(ly, x0, w, floors, rng) {
  const { g } = ly;
  const B = ly.baseRow; // fila de la vereda
  const top = B - 3 - 2 * floors;
  const x1 = x0 + w - 1;
  g.rect(x0, top + 1, w, B - top - 1, SP);
  const style = rng.int(0, 4);
  const pitched = style !== 4 && rng.chance(0.22) && w <= 16;
  if (pitched) {
    // techo de dos aguas con rayado
    const rise = Math.min(4, Math.floor(w / 4));
    for (let k = 0; k < rise; k++) {
      const a = x0 + 2 * k;
      const b = x1 - 2 * k;
      g.put(a, top - k, '/');
      g.put(b, top - k, '\\');
      for (let xx = a + 1; xx < b; xx++) g.put(xx, top - k, k === rise - 1 ? '_' : (xx + k) % 2 ? '/' : ' ');
    }
    g.hline(x0, x1, top, '_');
    g.put(x0, top, '/');
    g.put(x1, top, '\\');
  } else {
    g.hline(x0, x1, top, '_');
    if (rng.chance(0.5)) g.hline(x0 + 1, x1 - 1, top + 1, rng.chance(0.5) ? '=' : '¯');
  }
  const seed = rng.int(1, 1e5);
  // pisos: fila a = dintel / muro, fila b = ventanas
  const pitch = style === 1 ? 3 : 4;
  const n = Math.max(1, Math.floor((w - 3) / pitch));
  const x0w = x0 + Math.floor((w - n * pitch + (pitch - 3)) / 2);
  for (let k = 0; k < floors; k++) {
    const ra = top + 2 + 2 * k;
    const rb = ra + 1;
    if (rb >= B - 3) break;
    for (let i = 0; i < n; i++) {
      const x = x0w + i * pitch;
      switch (style) {
        case 0: // |_| con dintel
          g.put(x + 1, ra, '_');
          g.text(x, rb, '|_|');
          ly.windows.push({ x: x + 1, y: rb, s: hash2(x, rb + seed) });
          break;
        case 1: // [] [] []
          g.text(x, rb, '[]');
          ly.windows.push({ x, y: rb, s: hash2(x, rb + seed), w: 2 });
          break;
        case 2: // oblicuas /_/
          g.put(x + 1, ra, '_');
          g.text(x, rb, '/_/');
          ly.windows.push({ x: x + 1, y: rb, s: hash2(x, rb + seed) });
          break;
        case 3: // con baranda de balcón cada dos pisos
          g.put(x + 1, ra, '_');
          g.text(x, rb, k % 2 ? '|=|' : '|_|');
          ly.windows.push({ x: x + 1, y: rb, s: hash2(x, rb + seed) });
          break;
        default: // muro punteado con ventanas sueltas
          if ((i + k) % 2 === 0) {
            g.text(x, rb, '[]');
            ly.windows.push({ x, y: rb, s: hash2(x, rb + seed), w: 2 });
          }
      }
    }
    if (style === 4)
      for (let xx = x0 + 1; xx < x1; xx++) {
        if (g.get(xx, ra) === SP && (xx & 1) === 0) g.put(xx, ra, ':');
        if (g.get(xx, rb) === SP && (xx & 1) === 0) g.put(xx, rb, ':');
      }
  }
  // planta baja: toldito rayado, puerta y vitrina
  const shop = rng.chance(0.6);
  if (shop) {
    const a = x0 + 1;
    const b = x1 - 1;
    for (let xx = a; xx <= b; xx++) g.put(xx, B - 3, (xx - a) % 2 ? '_' : '\\');
    g.hline(a, b, B - 4, '_');
  } else g.hline(x0 + 1, x1 - 1, B - 3, '_');
  const dx = x0 + 2 + Math.floor(hash2(x0, 7) * Math.max(1, w - 6));
  g.text(dx, B - 2, '|¯|');
  g.text(dx, B - 1, '| |');
  if (w > 11) {
    const vx = dx > x0 + w / 2 ? x0 + 2 : dx + 4;
    if (vx + 4 < x1) g.text(vx, B - 2, shop ? '|oo|' : '[__]');
  }
  g.hline(x0 + 1, x1 - 1, B - 1, '_');
  g.text(dx, B - 1, '| |');
  g.vline(x0, top + 1, B - 1);
  g.vline(x1, top + 1, B - 1);
  // azotea
  if (!pitched && rng.chance(0.7)) {
    const it = pick(rng, MID_ROOF);
    const rx = x0 + rng.int(1, Math.max(1, w - it.w - 1));
    g.blit(it, rx, top - it.h);
    if (it === MID_ROOF[6]) ly.smokes.push({ x: rx + 1, y: top - it.h - 1 });
  }
  ly.boxes.push({ x0, x1, top, bottom: B - 1, floors });
}

export function buildMid(streets, seed = 21) {
  const f = 0.5;
  const ly = makeLayer(f, 46, 50);
  const B = ly.baseRow; // vereda: en pantalla E+8
  const rng = new Rng(seed);
  const { g } = ly;
  const blocked = corridors(streets, f, 0);
  const toL = (x) => Math.round(x * f + M);
  const river = [toL(RIVER[0]), toL(RIVER[1])];
  let x = 4;
  while (x < ly.W - 10) {
    const want = rng.int(10, 20);
    const ok = fit(x, want, blocked, 8);
    if (!ok) {
      x = skipTo(x, blocked);
      continue;
    }
    const [bx, w] = ok;
    if (rng.chance(0.1)) {
      // árbol
      g.text(bx + 1, B - 4, ' .-. ');
      g.text(bx + 1, B - 3, '( : )');
      g.text(bx + 1, B - 2, " '|' ");
      g.text(bx + 1, B - 1, '  |  ');
      x = bx + 8;
      continue;
    }
    midBuilding(ly, bx, w, rng.int(3, 9), rng);
    x = bx + w + (rng.chance(0.3) ? rng.int(1, 3) : 0);
  }
  // vereda y calzada de la calle media; sobre el río, puente de arcos
  for (let x2 = 0; x2 < ly.W; x2++) {
    const onRiver = x2 >= river[0] - 3 && x2 < river[1] + 3;
    if (onRiver) {
      g.put(x2, B - 1, (x2 & 1) ? '¯' : '|');
      g.put(x2, B, '_');
      g.put(x2, B + 1, ' ');
      g.put(x2, B + 2, '¯');
      const k = (x2 - river[0] + 3) % 12;
      g.put(x2, B + 3, k === 0 ? '|' : k === 1 ? '(' : k === 11 ? ')' : 0);
      if (k === 0) g.put(x2, B + 4, '|');
    } else {
      g.put(x2, B, x2 % 5 === 0 ? '.' : '_');
      if (x2 % 6 < 2) g.put(x2, B + 2, '-');
    }
  }
  return ly;
}

// --- capa lejana (f 0.25) -------------------------------------------------------

const FAR_ROOF = [
  sprite(R`
|
|
`, 'line'),
  sprite(R`
T
`, 'line'),
  sprite(R`
n
`, 'line'),
  sprite(R`
 .-.
(___)
`),
  sprite(R`
  +
 / \
`),
  sprite(R`
 /\
/__\
`),
];

export function buildMidFar(streets, seed = 31) {
  const f = 0.25;
  const ly = makeLayer(f, 45, 46);
  const B = ly.baseRow;
  const rng = new Rng(seed);
  const { g } = ly;
  const blocked = corridors(streets, f, 0);
  let x = 2;
  while (x < ly.W - 6) {
    const ok = fit(x, rng.int(6, 14), blocked, 5);
    if (!ok) {
      x = skipTo(x, blocked);
      continue;
    }
    const [bx, w] = ok;
    const h = rng.int(6, 17) + (rng.chance(0.12) ? rng.int(4, 8) : 0);
    const top = B - h;
    const x1 = bx + w - 1;
    g.rect(bx, top + 1, w, h - 1, SP);
    g.hline(bx, x1, top, '_');
    g.vline(bx, top + 1, B - 1);
    g.vline(x1, top + 1, B - 1);
    const tex = rng.int(0, 2);
    const seedB = rng.int(1, 1e5);
    for (let y = top + 2; y < B; y++) {
      for (let xx = bx + 2; xx < x1 - 1; xx++) {
        const i = xx - bx;
        if (y % 2 === 1 || i % 2 === 1) continue;
        g.put(xx, y, tex === 0 ? '.' : tex === 1 ? "'" : ':');
        ly.windows.push({ x: xx, y, s: hash2(xx, y + seedB), dot: 1 });
      }
    }
    if (rng.chance(0.55)) {
      const it = pick(rng, FAR_ROOF);
      g.blit(it, bx + rng.int(1, Math.max(1, w - it.w - 1)), top - it.h);
    }
    if (rng.chance(0.1)) ly.smokes.push({ x: bx + 1, y: top - 1 });
    ly.boxes.push({ x0: bx, x1, top, bottom: B - 1 });
    x = bx + w + (rng.chance(0.4) ? rng.int(1, 2) : 0);
  }
  ly.windows.sort((a, b) => a.x - b.x);
  return ly;
}

// --- skyline (f 0.1) ---------------------------------------------------------------

const LANDMARKS = [
  // torre de TV
  sprite(R`
    |
    |
   _|_
  (___)
   |:|
   |:|
   |:|
   |:|
   |:|
  /|:|\
`),
  // grúa
  sprite(R`
  __________________
 |\/\/\/\/\/\/\/|\/\|¯¯|
   |       |    |  |
   o       |    |
   [            |
`, 'line'),
  // cúpula
  sprite(R`
     +
    .-.
  .'   '.
 |   :   |
 |_______|
 |: : : :|
 |: : : :|
`),
  // estadio
  sprite(R`
  *              *
  |______________|
 /: : : : : : : : \
|: : : : : : : : : |
`),
];

export function buildFar(seed = 41) {
  const f = 0.1;
  const ly = makeLayer(f, 39, 40);
  const B = ly.baseRow;
  const rng = new Rng(seed);
  const { g } = ly;
  const toL = (x) => Math.round(x * f + M);
  const river = [toL(RIVER[0]) + 1, toL(RIVER[1]) - 1];
  let x = 0;
  let lm = 0;
  while (x < ly.W - 4) {
    if (x >= river[0] && x < river[1]) {
      x = river[1];
      continue;
    }
    if (rng.chance(0.06) && x > 8) {
      const s = LANDMARKS[lm++ % LANDMARKS.length];
      if (!(x + s.w > river[0] && x < river[1])) {
        g.blit(s, x, B - s.h + 1);
        if (s === LANDMARKS[0]) ly.lights.push({ x: x + 4, y: B - s.h });
        if (s === LANDMARKS[3]) ly.lights.push({ x: x + 2, y: B - s.h + 1 }, { x: x + 17, y: B - s.h + 1 });
        x += s.w + rng.int(0, 2);
        continue;
      }
    }
    const w = rng.int(3, 8);
    if (x + w > river[0] && x < river[1]) {
      x = river[1];
      continue;
    }
    const h = rng.int(3, 11) + (rng.chance(0.25) ? rng.int(3, 7) : 0);
    const top = B - h;
    const x1 = x + w - 1;
    g.rect(x, top + 1, w, h - 1, SP);
    g.hline(x, x1, top, '_');
    g.vline(x, top + 1, B - 1);
    g.vline(x1, top + 1, B - 1);
    const tex = rng.int(0, 3);
    for (let y = top + 1; y < B; y++)
      for (let xx = x + 1; xx < x1; xx++) {
        const i = xx - x;
        let ch = 0;
        if (tex <= 1 && i % 2 === 1) ch = ':';
        else if (tex === 2 && i % 2 === 1 && y % 2 === 0) ch = '.';
        if (ch) g.put(xx, y, ch);
        if (ch && y % 2 === 0) ly.windows.push({ x: xx, y, s: hash2(xx * 5, y), dot: 1 });
      }
    const crown = rng.int(0, 5);
    if (crown === 0 && w >= 3) {
      g.put(x + (w >> 1), top - 1, '|');
      g.put(x + (w >> 1), top - 2, '|');
      ly.lights.push({ x: x + (w >> 1), y: top - 3 });
    } else if (crown === 1 && w >= 5) {
      // escalonado
      g.rect(x + 1, top - 2, w - 2, 2, SP);
      g.hline(x + 1, x1 - 1, top - 3, '_');
      g.put(x + 1, top - 2, '|');
      g.put(x + 1, top - 1, '|');
      g.put(x1 - 1, top - 2, '|');
      g.put(x1 - 1, top - 1, '|');
    } else if (crown === 2 && w % 2 === 0) {
      g.put(x + w / 2 - 1, top - 1, '/');
      g.put(x + w / 2, top - 1, '\\');
    }
    x += w + (rng.chance(0.25) ? 1 : 0);
  }
  ly.windows.sort((a, b) => a.x - b.x);
  return ly;
}

// --- cordillera (f 0.035) -------------------------------------------------------

// Dibuja un perfil (una altura por columna) con glifos según la pendiente:
// suave con "_.-'¯" y empinado con "/" "\".
export function profile(g, ys, fillBelow = true) {
  const W = Math.min(g.w, ys.length - 1);
  if (fillBelow) for (let c = 0; c < W; c++) for (let y = Math.ceil(ys[c]); y < g.h; y++) g.put(c, y, SP);
  for (let c = 0; c < W; c++) {
    const y0 = ys[c];
    const y1 = ys[c + 1];
    const d = y1 - y0;
    if (Math.abs(d) <= 0.7) {
      const mid = (y0 + y1) / 2;
      const row = Math.floor(mid);
      const f = mid - row;
      let ch;
      if (f < 0.22) ch = '¯';
      else if (f < 0.45) ch = d < 0 ? "'" : '`';
      else if (f < 0.6) ch = '-';
      else if (f < 0.8) ch = '.';
      else ch = '_';
      g.put(c, row, ch);
    } else {
      // empinado: un solo glifo por columna (las laderas no pasan de 63°)
      g.put(c, Math.floor((y0 + y1) / 2), d < 0 ? '/' : '\\');
    }
  }
}

export function buildMountains(seed = 51) {
  const f = 0.035;
  const ly = makeLayer(f, 29, 30, 60);
  const B = ly.baseRow;
  const rng = new Rng(seed);
  const { g } = ly;
  const W = ly.W;
  const peaks = [];
  for (let x = -10; x < W + 20; x += rng.int(18, 34)) {
    const h = rng.range(7, 20);
    peaks.push({ x, h, w: h * rng.range(1.5, 2.3) });
  }
  const ys = new Float32Array(W + 1);
  for (let c = 0; c <= W; c++) {
    let h = 2.5 + Math.sin(c * 0.21) * 0.6;
    for (const p of peaks) {
      const u = Math.abs(c - p.x) / p.w;
      if (u < 1) h = Math.max(h, p.h * Math.pow(1 - u, 1.4));
    }
    ys[c] = B - h;
  }
  profile(g, ys);
  // nieve: debajo de la cumbre queda blanco; más abajo, la ladera de la
  // derecha se sombrea con puntos
  for (const p of peaks) {
    if (p.h < 12) continue;
    const top = Math.round(B - p.h);
    const snow = top + Math.round(p.h * 0.32);
    for (let y = snow; y < B; y++) {
      for (let c = Math.round(p.x) + 1; c < p.x + p.w; c++) {
        if (c < 0 || c >= W) continue;
        if (g.get(c, y) !== SP || ys[c] > y - 1) continue;
        if ((c + y) % 3 === 0 && c - p.x < (y - top) * 1.6) g.put(c, y, '.');
      }
    }
    // borde de la nieve
    for (let c = Math.round(p.x) - 6; c < p.x + 7; c++) {
      if (c < 0 || c >= W || ys[c] > snow - 1) continue;
      if (g.get(c, snow) === SP) g.put(c, snow, (c & 1) ? '.' : ' ');
    }
  }
  return ly;
}
