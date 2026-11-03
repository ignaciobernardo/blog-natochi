// La cuadra: la fila de edificios del frente, la vereda, la calzada y la vereda
// de acá. Se dibuja una vez en una Grid (capa) y se mueve con el scroll.
//
// Proyección oblicua (cabinet): la fachada se ve de frente y la profundidad
// sube a la derecha una columna por fila, como las diagonales de Jgs. Así
// cada edificio muestra fachada, techo (un paralelogramo) y el costado
// derecho cuando le gana en altura al vecino. Los edificios se dibujan de
// izquierda a derecha y el de la derecha tapa el costado del anterior.
import { Grid, SP } from './grid.js';
import { Rng, hash2 } from './rng.js';
import * as A from './art.js';
import { Lights, Window, Neon, NeonRow, Shop, Lantern } from './lights.js';

const V_SIGNS = ['KARAOKE', 'BILLAR', 'CHIFA', 'SCHOP', 'TATTOO', 'DISCO', 'RAMEN', 'SALON', 'RELOJES', 'SUSHI', 'MOTEL', 'BAR', 'CAFE', 'ABIERTO', 'LIBROS', 'PIZZA'];
const H_SIGNS = ['FARMACIA', 'BOTILLERIA', 'LAVANDERIA', 'PELUQUERIA', 'BAZAR', 'FERRETERIA', 'MINIMARKET', 'COCINERIA', 'EMPORIO', 'ZAPATERIA', 'PANADERIA', 'RELOJERIA', 'FUENTE DE SODA', 'LIBRERIA'];
// vidrieras: siluetas de lo que se vende (2 filas)
const GOODS = [
  [' o o o o o o o o o o o o o o', '=============================='],
  [' i i  i i  i i  i i  i i  i i', ' i i  i i  i i  i i  i i  i i'],
  [' [] [] [] [] [] [] [] [] [] []', ''],
  [' \\_/ \\_/ \\_/ \\_/ \\_/ \\_/ \\_/', ''],
  ['  o    o    o    o    o    o', ' /|\\  /|\\  /|\\  /|\\  /|\\  /|\\'],
  [' .-. .-. .-. .-. .-. .-. .-.', ' |_| |_| |_| |_| |_| |_| |_|'],
];

// texturas de muro: (c, r) -> char o 0
const TEX = {
  colon: (c, r) => (c & 1 ? 0 : 58), //                         : : : :
  dot: (c, r) => (c & 1 ? 0 : 46), //                           . . . .
  sparse: (c, r) => ((c + 2 * (r & 1)) % 4 === 0 ? 46 : 0), //  .   .   .
  brick: (c, r) => ((c + 3 * (r & 1)) % 6 === 0 ? 124 : (c + 3 * (r & 1)) % 6 === 1 ? 95 : 0), // |_    |_
  hatch: (c, r) => ((c + r) % 3 === 0 ? 47 : 0), //             /  /  /
  none: () => 0,
};

const STYLES = {
  tenement: { tex: 'sparse', iw: 3, pitch: 7, gh: 2, fh: 5, cornice: 'brackets', fire: true, ac: 0.25, w: [24, 32] },
  hostal: { tex: 'none', iw: 2, pitch: 6, gh: 2, fh: 4, cornice: 'line', bigSign: true, w: [18, 22], tall: true },
  office: { tex: 'none', curtain: true, cornice: 'line', w: [20, 28] },
  deco: { tex: 'colon', iw: 3, pitch: 6, gh: 3, fh: 6, cornice: 'deco', piers: true, w: [20, 26] },
  shophouse: { tex: 'colon', iw: 4, pitch: 9, gh: 2, fh: 5, cornice: 'brackets', balcony: true, w: [22, 28], low: true },
  walkup: { tex: 'dot', iw: 3, pitch: 8, gh: 2, fh: 5, cornice: 'line', ac: 0.4, w: [20, 26] },
};
const ORDER = ['tenement', 'hostal', 'shophouse', 'deco', 'walkup', 'office', 'tenement', 'shophouse', 'hostal', 'walkup', 'deco', 'office'];

export function layout(C, R) {
  const SW = 4; //                                                vereda de enfrente
  const RD = Math.min(13, Math.max(9, Math.round(R * 0.2))); //    calzada
  const nsVis = Math.min(12, Math.max(7, Math.round(R * 0.15))); // vereda de acá visible
  // fila del pie de las fachadas al final del viaje: en pantallas altas
  // gana la fachada, la calle no se estira
  const gR = Math.max(Math.round(R * 0.56), R - SW - RD - nsVis);
  const T = Math.round(R * 1.3); //                               recorrido de la grúa
  const NS = R - gR - SW - RD + 3; //                              vereda de acá (con margen)
  return { C, R, gR, T, SW, RD, NS };
}

export function buildStreet(L, dark, seed) {
  const { C, R, gR, T, SW, RD, NS } = L;
  const rng = new Rng(seed);
  const M = 10;
  const W = C + 2 * M;
  const hMin = Math.round(T + gR - 0.86 * R);
  const hMax = Math.round(T + gR - 0.42 * R);
  const TOP = 26;
  const G = TOP + hMax;
  const H = G + SW + RD + NS;
  const g = new Grid(W, H);
  const lights = new Lights(dark);
  lights.grid = g;
  const out = { grid: g, lights, G, W, H, M, puddles: [], manholes: [], steam: [], drips: [], lamps: [], blinkers: [], signals: [], stand: null, buildings: [] };

  // --- reparto de edificios ---
  // Desde el centro hacia los costados: en el medio siempre quedan la casa con
  // el cartel en el techo y el conventillo con tanques (lo primero que se ve,
  // también en mobile). Después se sigue el orden de estilos a cada lado.
  const make = (kind, x, prevH) => {
    const S = STYLES[kind];
    let w = rng.int(S.w[0], S.w[1]);
    if (C < 70) w = Math.max(16, Math.round(w * 0.85));
    let h = rng.int(hMin, hMax);
    if (S.tall) h = rng.int(Math.round((hMin + hMax * 2) / 3), hMax);
    if (S.low) h = rng.int(hMin, Math.round((hMin + hMax) / 2));
    // que dos vecinos no queden casi iguales
    if (prevH && Math.abs(prevH - h) < 4) h = prevH + (h > prevH ? 5 : -5);
    h = Math.max(hMin - 4, Math.min(hMax, h));
    return { kind, x, w, h, D: rng.int(3, 5), S, seed: rng.int(1, 1e6) };
  };
  const mid = Math.round(W / 2);
  const hero = make('shophouse', 0, 0);
  hero.h = Math.round(hMin + (hMax - hMin) * 0.45);
  hero.x = mid - hero.w + 4;
  const tank = make('tenement', hero.x + hero.w, hero.h);
  tank.h = Math.max(tank.h, hero.h + 8);
  const right = [hero, tank];
  let k = rng.int(0, ORDER.length - 1);
  let x = tank.x + tank.w;
  while (x < W + 4) {
    const last = right[right.length - 1];
    if (rng.chance(0.16) && last.kind !== 'alley') {
      const w = rng.int(5, 7);
      right.push({ kind: 'alley', x, w });
      x += w;
      continue;
    }
    const b = make(ORDER[k++ % ORDER.length], x, last.h);
    right.push(b);
    x += b.w;
  }
  const left = [];
  x = hero.x;
  let prevH = hero.h;
  while (x > -4) {
    if (rng.chance(0.16) && left.length && left[0].kind !== 'alley') {
      const w = rng.int(5, 7);
      x -= w;
      left.unshift({ kind: 'alley', x, w });
      continue;
    }
    const b = make(ORDER[k++ % ORDER.length], 0, prevH);
    x -= b.w;
    b.x = x;
    prevH = b.h;
    left.unshift(b);
  }
  const B = [...left, ...right];
  out.buildings = B;

  // callejones: el muro del fondo es más bajo que los vecinos
  B.forEach((b, i) => {
    if (b.kind !== 'alley') return;
    const l = B[i - 1];
    const r = B[i + 1];
    b.h = Math.round(Math.min(l?.h ?? hMin, r?.h ?? hMin) * 0.55);
  });

  let vs = rng.int(0, V_SIGNS.length - 1);
  let hs = rng.int(0, H_SIGNS.length - 1);
  const nextV = () => V_SIGNS[vs++ % V_SIGNS.length];
  const nextH = () => H_SIGNS[hs++ % H_SIGNS.length];

  for (const b of B) {
    if (b.kind === 'alley') drawAlley(g, b, G, rng, out);
    else drawBuilding(g, b, G, rng, lights, dark, out, nextV, nextH);
  }

  drawGround(g, L, G, W, rng, out, dark);
  placeStreetFurniture(g, L, G, W, M, rng, lights, dark, out);
  placeStand(g, L, G, W, M, rng, lights, dark, out);

  lights.finish();
  return out;
}

// --- edificio ---------------------------------------------------------------

function drawBuilding(g, b, G, rng, lights, dark, out, nextV, nextH) {
  const { x, w, h, D, S } = b;
  const y0 = G - h; // primera fila de la fachada
  const x1 = x + w - 1;
  const r = new Rng(b.seed);

  // costado derecho (se ve si el vecino es más bajo): pisos en diagonal y puntos
  for (let j = 1; j <= D; j++) {
    const c = x1 + j;
    for (let row = y0 - j + 1; row <= G - 1 - j; row++) {
      const fl = (row + j - y0) % (S.fh || 4) === 0;
      g.put(c, row, fl ? 47 : (row + c) % 4 === 0 ? 46 : SP);
    }
    g.put(c, y0 - j, 47); // arista del techo
  }
  for (let row = y0 - D + 1; row <= G - 1 - D; row++) g.put(x1 + D + 1, row, 124);

  // techo: paralelogramo con grava rala
  for (let j = 0; j < D; j++) {
    const row = y0 - 1 - j;
    for (let c = x + 1 + j; c <= x1 + 1 + j; c++) {
      const e = c === x + 1 + j || c === x1 + 1 + j;
      // azotea: grilla de puntos como el suelo de la referencia, con alguna mancha de agua
      const wet = hash2(c >> 2, row + b.seed) < 0.15;
      g.put(c, row, e ? 47 : j === 0 ? 95 : wet ? 45 : (c + j) % 2 === 0 ? (j % 2 ? 58 : 46) : SP);
    }
  }
  g.hline(x + 1 + D, x1 + D, y0 - 1 - D, '_');

  // fachada: fondo opaco + textura
  const tex = TEX[S.tex];
  for (let row = y0; row < G; row++)
    for (let c = x; c <= x1; c++) g.put(c, row, c === x || c === x1 ? 124 : tex(c - x, row) || SP);

  // cornisa
  if (S.cornice === 'brackets') {
    g.hline(x + 1, x1 - 1, y0, '=');
    for (let c = x + 1; c < x1; c++) g.put(c, y0 + 1, (c - x) % 2 ? 124 : 95);
  } else if (S.cornice === 'deco') {
    g.hline(x + 1, x1 - 1, y0, '_');
    for (let c = x + 1; c < x1; c++) g.put(c, y0 + 1, (c - x) % 4 === 0 ? 124 : (c - x) % 4 === 2 ? 118 : SP);
  } else {
    g.hline(x + 1, x1 - 1, y0, '-');
    g.hline(x + 1, x1 - 1, y0 + 1, SP);
  }

  const gfH = 7; // planta baja: letrero, toldo, vidriera
  const top = y0 + 3;
  const bottom = G - gfH - 1; // última fila útil de los pisos

  if (S.curtain) officeFacade(g, b, top, bottom, lights, dark);
  else windowsFacade(g, b, top, bottom, lights, dark, r, out);

  // letreros verticales de neón colgados de la fachada
  const nSigns = S.bigSign ? 1 : r.chance(0.8) ? (w > 24 && r.chance(0.45) ? 2 : 1) : 0;
  for (let i = 0; i < nSigns; i++) {
    const text = S.bigSign ? (r.chance(0.5) ? 'HOSTAL' : 'PENSION') : nextV();
    const step = S.bigSign ? 2 : 1;
    const len = text.length * step;
    const sx = S.bigSign ? x + (w >> 1) : i === 0 ? x + 4 + r.int(0, 2) : x1 - 4 - r.int(0, 2);
    const maxTop = G - gfH - 3 - len;
    const sy = Math.max(top + 2, maxTop - r.int(0, S.bigSign ? 12 : 9));
    neonSign(g, sx, sy, text, step, lights, dark, r, i === 0 ? -1 : 1);
  }

  groundFloor(g, b, G, gfH, lights, dark, r, nextH, out);
  roofStuff(g, b, y0, D, r, lights, dark, out);
}

function windowsFacade(g, b, top, bottom, lights, dark, r, out) {
  const { x, w, S } = b;
  const x1 = x + w - 1;
  const { iw, pitch, fh, gh } = S;
  const n = Math.max(1, Math.floor((w - 4 + (pitch - iw)) / pitch));
  const span = n * pitch - (pitch - iw);
  const cx0 = x + Math.floor((w - span) / 2);
  // pilastras (art déco): franjas verticales entre ventanas
  if (S.piers) {
    for (let i = 0; i <= n; i++) {
      const c = cx0 - 3 + i * pitch;
      if (c <= x || c >= x1) continue;
      for (let row = top - 1; row <= bottom; row++) {
        g.put(c, row, 124);
        g.put(c + 1, row, SP);
      }
    }
  }
  // escalera de incendio sobre dos columnas de ventanas
  const fire = S.fire && n >= 3 ? r.int(0, n - 2) : -1;
  let floor = 0;
  for (let fy = top; fy + gh + 1 <= bottom; fy += fh, floor++) {
    for (let i = 0; i < n; i++) {
      const cx = cx0 + i * pitch;
      const seed = b.seed * 131 + floor * 17 + i;
      const kind = hash2(seed, 1);
      // ventana: dintel (recto o en arco), marco, vidrio (luz), alféizar
      if (kind < 0.15 && iw >= 3) {
        g.put(cx, fy, 46);
        g.hline(cx + 1, cx + iw - 2, fy, '-');
        g.put(cx + iw - 1, fy, 46);
      } else g.hline(cx, cx + iw - 1, fy, '_');
      for (let y = fy + 1; y <= fy + gh; y++) {
        g.put(cx - 1, y, 124);
        g.put(cx + iw, y, 124);
      }
      g.hline(cx - 1, cx + iw, fy + gh + 1, '¯');
      const Lw = lights.add(new Window(cx, fy + 1, iw, gh, seed, dark, { mullion: iw >= 4 ? iw >> 1 : -1 }));
      tagRect(g, cx, fy + 1, iw, gh, Lw.id);
      // aire acondicionado de ventana y su goteo
      if (S.ac && hash2(seed, 3) < S.ac && iw >= 3) {
        g.text(cx, fy + gh, '[=]');
        out.drips.push({ x: cx + 1, y: fy + gh + 2, seed });
      } else if (hash2(seed, 5) < 0.2) {
        // macetero bajo la ventana
        g.text(cx - 1, fy + gh + 1, '\\v/v/v'.slice(0, iw + 2));
      }
      // balcón con baranda
      if (S.balcony && floor % 2 === 0 && hash2(seed, 6) < 0.6) {
        const bx = cx - 2;
        const bw = iw + 4;
        g.hline(bx, bx + bw - 1, fy + gh + 1, '=');
        for (let c = bx; c < bx + bw; c += 2) g.put(c, fy + gh, 124);
        g.put(bx - 1, fy + gh + 1, 47);
        if (hash2(seed, 8) < 0.5) g.text(bx + 1, fy + gh - 1, ',v,');
      }
    }
    // escalera de incendio: descanso, baranda y tramo en zigzag
    if (fire >= 0) {
      const a = cx0 + fire * pitch - 2;
      const z = cx0 + (fire + 1) * pitch + iw + 1;
      const sill = fy + gh + 1;
      g.hline(a, z, sill, '=');
      for (let c = a; c <= z; c += 3) g.put(c, sill - 1, 124);
      g.hline(a, z, sill - 2, '_');
      if (fy + fh + gh + 1 <= bottom) {
        // tramo hacia el descanso de abajo, alternando el sentido
        const len = fh - 1;
        for (let i = 0; i < len; i++) {
          const row = sill + 1 + i;
          if (floor % 2) {
            const c = a + 2 + i;
            g.put(c, row, 92);
            g.put(c + 1, row, 95);
            g.put(c + 2, row, 92);
          } else {
            const c = z - 2 - i;
            g.put(c, row, 47);
            g.put(c - 1, row, 95);
            g.put(c - 2, row, 47);
          }
        }
      } else {
        // escalera de gato colgando
        for (let k = 1; k <= 2; k++) g.text(a + 3, sill + k, '|=|');
      }
    }
  }
}

function officeFacade(g, b, top, bottom, lights, dark) {
  const { x, w } = b;
  const x1 = x + w - 1;
  // muro cortina: montantes cada 4, antepecho punteado cada piso
  let floor = 0;
  for (let fy = top; fy + 3 <= bottom; fy += 4, floor++) {
    g.hline(x + 1, x1 - 1, fy, '_');
    for (let c = x + 1; c < x1; c++) g.put(c, fy + 3, (c & 1) === 0 ? 46 : SP);
    for (let c = x + 2; c < x1 - 1; c += 4) {
      g.put(c, fy + 1, 124);
      g.put(c, fy + 2, 124);
      const ww = Math.min(3, x1 - c - 1);
      if (ww < 1) continue;
      const seed = b.seed * 97 + floor * 31 + c;
      const Lw = lights.add(new Window(c + 1, fy + 1, ww, 2, seed, dark));
      tagRect(g, c + 1, fy + 1, ww, 2, Lw.id);
    }
  }
}

function tagRect(g, x, y, w, h, id) {
  for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (g.inside(c, r)) g.tag[r * g.w + c] = id;
}

// letrero vertical: caja | K | con tapas, ménsulas hacia la pared y un margen
// opaco alrededor para que se despegue de la fachada
function neonSign(g, sx, sy, text, step, lights, dark, r, side) {
  const len = text.length * step;
  for (let row = sy - 2; row < sy + len + 2; row++) for (let c = sx - 3; c <= sx + 3; c++) g.put(c, row, SP);
  for (let row = sy; row < sy + len; row++) {
    g.put(sx - 2, row, 124);
    g.put(sx + 2, row, 124);
  }
  g.text(sx - 2, sy - 1, '.---.');
  g.text(sx - 2, sy + len, "'---'");
  // ménsulas
  const bc = side < 0 ? sx - 3 : sx + 3;
  g.put(bc, sy, 61);
  g.put(bc, sy + len - 1, 61);
  const N = lights.add(new Neon(sx, sy, text, r.int(1, 1e6), dark, { step }));
  tagRect(g, sx - 1, sy, 3, len, N.id);
}

// planta baja: letrero, toldo o marquesina, vidriera y puerta
function groundFloor(g, b, G, gfH, lights, dark, r, nextH, out) {
  const { x, w } = b;
  const x1 = x + w - 1;
  const y = G - gfH;
  for (let row = y; row < G; row++) for (let c = x + 1; c < x1; c++) g.put(c, row, SP);
  g.hline(x + 1, x1 - 1, y, '=');
  // letrero
  const name = nextH();
  const label = name.length + 6 <= w ? name : name.slice(0, w - 6);
  const lx = x + Math.floor((w - label.length) / 2);
  g.put(lx - 2, y + 1, 91);
  g.put(lx + label.length + 1, y + 1, 93);
  if (r.chance(0.55)) {
    const N = lights.add(new NeonRow(lx, y + 1, label, r.int(1, 1e6), dark));
    tagRect(g, lx, y + 1, label.length, 1, N.id);
  } else g.text(lx, y + 1, label);

  const style = r.pick(['awning', 'awning', 'canopy', 'shutter']);
  // vidriera (2 filas) y puerta
  const doorLeft = r.chance(0.5);
  const doorX = doorLeft ? x + 3 : x1 - 5;
  const winX = doorLeft ? x + 8 : x + 3;
  const winW = w - 12;
  const wy = G - 3;
  if (style === 'shutter' && !dark) {
    // cortina metálica baja (local cerrado)
    g.hline(winX, winX + winW - 1, wy - 1, '_');
    for (let row = wy; row < G; row++) g.hline(winX, winX + winW - 1, row, row === G - 1 ? '_' : '=');
    g.put(winX - 1, wy, 124);
    g.put(winX + winW, wy, 124);
  } else {
    g.hline(winX, winX + winW - 1, wy - 1, '_');
    for (let row = wy; row < G; row++) {
      g.put(winX - 1, row, 124);
      g.put(winX + winW, row, 124);
    }
    const goods = r.pick(GOODS).map((s) => s.slice(0, winW));
    const S = lights.add(new Shop(winX, wy, winW, 2, r.int(1, 1e6), dark, goods));
    tagRect(g, winX, wy, winW, 2, S.id);
    g.hline(winX, winX + winW - 1, G - 1, '_');
  }
  // puerta
  g.hline(doorX, doorX + 2, wy - 1, '_');
  for (let row = wy; row < G; row++) {
    g.put(doorX - 1, row, 124);
    g.put(doorX + 3, row, 124);
    g.hline(doorX, doorX + 2, row, row === G - 1 ? '_' : ' ');
  }
  g.put(doorX + 2, wy + 1, 111);

  // toldo a rayas oblicuas con flecos, o marquesina plana
  const ay = y + 2;
  if (style === 'awning') {
    const a0 = x + 2;
    const a1 = x1 - 1;
    g.hline(a0 + 1, a1, ay, '_');
    for (let c = a0; c < a1; c++) g.put(c, ay + 1, (c - a0) % 2 ? 95 : 47);
    g.put(a1, ay + 1, 47);
    for (let c = a0; c < a1; c++) g.put(c, ay + 2, (c - a0) % 2 ? 39 : 46);
  } else if (style === 'canopy') {
    g.hline(x + 1, x1 - 1, ay + 1, '=');
    for (let c = x + 3; c < x1 - 1; c += 6) {
      g.put(c, ay + 2, 111);
      out.lamps.push({ x: c, y: ay + 2, kind: 'spot', reach: 3 });
    }
  }
}

// --- techos -------------------------------------------------------------------

function roofStuff(g, b, y0, D, r, lights, dark, out) {
  const { x, w, kind } = b;
  // posición sobre el techo: u a lo largo, j de profundidad (0 = borde de adelante)
  const at = (u, j) => [x + 1 + j + u, y0 - 1 - j];
  const items = [];
  if (kind === 'tenement' || kind === 'walkup') {
    items.push([A.TANK, r.int(2, Math.max(2, w - 12)), D - 1]);
    if (w > 24 && r.chance(0.6)) items.push([A.TANK_SMALL, r.int(1, 3), Math.max(0, D - 2)]);
    items.push([A.CHIMNEY, w - 4, 1]);
    if (r.chance(0.7)) laundry(g, x + 3, Math.min(14, w - 10), y0 - 2, r);
  } else if (kind === 'hostal') {
    items.push([A.ANTENNA, w - 7, D - 1]);
    const [ax, ay] = at(w - 7, D - 1);
    out.blinkers.push({ x: ax + 3, y: ay - A.ANTENNA.h + 1, seed: b.seed });
    rooftopSign(g, x + 1, y0 - D - 1, w - 6, r, lights, dark);
  } else if (kind === 'office') {
    items.push([A.ROOF_AC, 2, D - 1]);
    if (w > 22) items.push([A.ROOF_AC, 10, D - 1]);
    items.push([A.SHACK, w - 11, D - 1]);
    items.push([A.DISH, 3, 0]);
  } else if (kind === 'deco') {
    // remate escalonado con mástil
    const cw = Math.max(7, (w >> 1) | 1);
    const cx = x + ((w - cw) >> 1) + D;
    let yy = y0 - D - 1;
    for (let s = 0; s < 3; s++) {
      const ww = cw - s * 4;
      if (ww < 3) break;
      const xx = cx + s * 2;
      const hh = 3;
      for (let row = yy - hh + 1; row <= yy; row++)
        for (let c = xx; c < xx + ww; c++) g.put(c, row, c === xx || c === xx + ww - 1 ? 124 : (c - xx) % 2 ? SP : 58);
      g.hline(xx + 1, xx + ww - 2, yy - hh, '_');
      yy -= hh;
    }
    const mx = cx + (cw >> 1);
    g.put(mx, yy, 124);
    g.put(mx, yy - 1, 124);
    g.put(mx, yy - 2, 42);
    out.blinkers.push({ x: mx, y: yy - 2, seed: b.seed });
  } else if (kind === 'shophouse') {
    billboard(g, x + 1, y0 - D, w + 2, r, lights, dark, out);
  }
  for (const [s, u, j] of items) {
    const [c, row] = at(u, j);
    g.spr(s, c, row - s.h + 1);
  }
}

function laundry(g, x, w, y, r) {
  // cordel de ropa entre dos palos
  const clothes = ['[]', '/\\', 'II', '\\/', 'U', 'm', '[ ]'];
  g.put(x, y, 124);
  g.put(x, y - 1, 124);
  g.put(x + w, y, 124);
  g.put(x + w, y - 1, 124);
  for (let c = x + 1; c < x + w; c++) g.put(c, y - 1, 45);
  for (let c = x + 2; c < x + w - 2; c += r.int(3, 4)) g.ink(c, y, r.pick(clothes));
}

function rooftopSign(g, x, y, w, r, lights, dark) {
  // letras sueltas sobre una estructura en el techo
  const text = r.pick(['HOSTAL', 'NOCHE', 'LUNA']);
  const spaced = text.split('').join(' ');
  const sx = x + Math.max(0, (w - spaced.length) >> 1);
  const sy = y - 3;
  for (let i = 0; i < text.length; i++) {
    g.put(sx + i * 2, sy + 1, 124);
    g.put(sx + i * 2, sy + 2, 124);
  }
  g.hline(sx - 1, sx + spaced.length, sy + 2, '=');
  const N = lights.add(new NeonRow(sx, sy, spaced, r.int(1, 1e6), dark));
  tagRect(g, sx, sy, spaced.length, 1, N.id);
}

const ADS = [
  ['PARAGUAS 2 x 1', 'en la esquina'],
  ['CALDO CALIENTE', 'abierto toda la noche'],
  ['RADIO LLUVIA', '98.5 FM'],
  ['TOME ONCE', 'con pan amasado'],
];

function billboard(g, x, base, w, r, lights, dark, out) {
  // cartel en el techo: lámparas, marco, texto y andamio con cruces
  const [l1, l2] = r.pick(ADS);
  const bw = Math.min(w - 2, Math.max(l1.length, l2.length) + 6);
  const bx = x + Math.max(0, (w - bw) >> 1);
  const legH = 4;
  const bh = 5;
  const by = base - legH - bh;
  g.fill(bx, by, bw, bh, SP);
  g.hline(bx + 1, bx + bw - 2, by - 1, '_');
  for (let row = by; row < by + bh; row++) {
    g.put(bx, row, 124);
    g.put(bx + bw - 1, row, 124);
  }
  g.hline(bx + 1, bx + bw - 2, by + bh - 1, '_');
  // trama del papel
  for (let row = by; row < by + bh - 1; row++) for (let c = bx + 1; c < bx + bw - 1; c++) if ((c + row) % 4 === 0) g.put(c, row, 46);
  const t1 = l1.slice(0, bw - 4);
  const t2 = l2.slice(0, bw - 4);
  const N = lights.add(new NeonRow(bx + ((bw - t1.length) >> 1), by + 1, t1, r.int(1, 1e6), dark, { steady: true }));
  g.text(N.x - 1, by + 1, ' '.repeat(t1.length + 2));
  tagRect(g, N.x, by + 1, t1.length, 1, N.id);
  g.text(bx + ((bw - t2.length) >> 1) - 1, by + 3, ' ' + t2 + ' ');
  // lámparas con brazo
  for (let c = bx + 3; c < bx + bw - 3; c += 8) {
    g.text(c, by - 3, '_o_');
    g.put(c + 1, by - 2, 124);
    out.lamps.push({ x: c + 1, y: by - 3, kind: 'board', reach: bh - 1 });
  }
  // andamio
  const legs = [];
  for (let c = bx + 2; c < bx + bw - 1; c += 6) legs.push(c);
  for (const c of legs) for (let row = by + bh; row < base; row++) g.put(c, row, 124);
  for (let i = 0; i + 1 < legs.length; i++) {
    const a = legs[i];
    for (let k = 0; k < legH; k++) {
      g.put(a + 1 + Math.round((k * 4) / legH), by + bh + k, 92);
      g.put(legs[i + 1] - 1 - Math.round((k * 4) / legH), by + bh + k, 47);
    }
  }
}

// --- callejón --------------------------------------------------------------------

function drawAlley(g, b, G, rng, out) {
  const { x, w, h } = b;
  // muro del fondo oscuro: caños, una escalera de gato, basurero, vapor y un farolito
  for (let row = G - h; row < G; row++)
    for (let c = x; c < x + w; c++) g.put(c, row, row === G - h ? 95 : (c + row) % 5 === 0 && row % 2 === 0 ? 46 : SP);
  g.vline(x + 1, G - h + 1, G - 4, '|');
  for (let row = G - h + 2; row < G - 10; row++) g.text(x + w - 4, row, row % 2 ? '|-|' : '| |');
  g.spr(A.BIN, x + 1, G - 3);
  out.steam.push({ x: x + w - 2, y: G - 2, seed: rng.int(1, 1e6), power: 0.5 });
  g.text(x + w - 3, G - 9, '-o');
  out.lamps.push({ x: x + w - 2, y: G - 9, kind: 'wall', reach: 4 });
}

// --- suelo -------------------------------------------------------------------------

function drawGround(g, L, G, W, rng, out, dark) {
  const { SW, RD } = L;
  const yR = G + SW; //       primera fila de la calzada
  const yN = yR + RD; //      primera fila de la vereda de acá
  const H = g.h;
  out.yR = yR;
  out.yN = yN;
  // vereda de enfrente: grilla de puntos : : : (como el suelo de la referencia) y el cordón
  for (let row = G; row < yR; row++)
    for (let c = 0; c < W; c++) g.put(c, row, row === yR - 1 ? 95 : row === G ? (c % 2 ? SP : 46) : c % 2 ? SP : 58);
  // calzada: asfalto mojado casi vacío, cordón arriba y línea discontinua al medio
  const mid = yR + (RD >> 1);
  for (let row = yR; row < yN; row++)
    for (let c = 0; c < W; c++) {
      let ch = SP;
      if (row === yR) ch = (c & 1) === 0 ? 175 : SP;
      else if (row === mid) ch = c % 10 < 5 ? 45 : SP;
      else if (hash2(c, row) < 0.03) ch = 46;
      g.put(c, row, ch);
    }
  // cruce peatonal: cuatro franjas anchas en oblicua (paralelogramos /___/)
  const zx = Math.floor(W * 0.62);
  for (let row = yR + 1; row < yN; row++) {
    const k = yN - 1 - row;
    for (let s = 0; s < 4; s++) {
      const c = zx + s * 6 + k;
      g.put(c, row, 47);
      g.put(c + 3, row, 47);
      if (row === yN - 1) g.hline(c + 1, c + 2, row, '_');
      if (row === yR + 1) g.hline(c + 1, c + 2, row - 1, '_');
    }
  }
  out.crossing = { x: zx, w: 24 };
  // vereda de acá: borde y grilla de puntos más abierta
  for (let row = yN; row < H; row++)
    for (let c = 0; c < W; c++) {
      let ch = SP;
      if (row === yN) ch = 95;
      else if ((row - yN) % 2 === 0 && (c + (row >> 1)) % 4 === 0) ch = 46;
      g.put(c, row, ch);
    }
  // rejillas de desagüe junto al cordón
  for (let c = 6; c < W - 6; c += rng.int(26, 40)) g.text(c, yN - 1, '|||');

  // alcantarillas con vapor
  for (let c = rng.int(4, 14); c < W - 8; c += rng.int(30, 48)) {
    const row = rng.int(yR + 2, yN - 4);
    if (c > zx - 8 && c < zx + 30) continue;
    g.spr(A.MANHOLE, c, row);
    out.manholes.push({ x: c, y: row });
    out.steam.push({ x: c + 3, y: row, seed: rng.int(1, 1e6), power: 1 });
  }

  // charcos en la calzada y en las veredas
  const add = (x, y, a, n) => out.puddles.push({ x, y, a, n });
  for (let c = rng.int(2, 10); c < W - 6; c += rng.int(26, 40)) add(c + rng.int(4, 8), rng.int(yR + 2, yN - 3), rng.int(6, 10), 2);
  for (let c = rng.int(4, 16); c < W - 6; c += rng.int(34, 50)) add(c + 6, rng.int(yN + 2, H - 4), rng.int(8, 13), 3);
  for (const p of out.puddles) puddleRim(g, p);
}

// borde del charco: filas corridas una columna a la izquierda por fila (el
// suelo en oblicua), ( ) en las puntas, _ arriba y ¯ abajo. El interior se
// pinta en cada frame con el reflejo.
function puddleRim(g, p) {
  const { x, y, a, n } = p;
  const cells = [];
  const rows = [];
  for (let i = 0; i < n; i++) {
    const v = (i + 0.5) / n - 0.5;
    const half = Math.round(a * Math.sqrt(1 - v * v * 2.2));
    const cx = x - i;
    rows.push([cx - half, cx + half]);
  }
  rows.forEach(([c0, c1], i) => {
    const row = y + i;
    for (let c = c0; c <= c1; c++) {
      g.put(c, row, SP);
      cells.push(c, row);
    }
    g.put(c0 - 1, row, 40);
    g.put(c1 + 1, row, 41);
  });
  // borde de arriba y de abajo, más cortos que el charco: la punta la cierran ( )
  const [t0, t1] = rows[0];
  const m0 = Math.round((t1 - t0) * 0.2);
  g.hline(t0 + m0, t1 - m0, y - 1, '_');
  const [b0, b1] = rows[n - 1];
  const m1 = Math.round((b1 - b0) * 0.2);
  g.hline(b0 + m1, b1 - m1, y + n, '¯');
  p.cells = new Int32Array(cells);
  p.top = y - 1;
  p.bot = y + n;
}

// --- puesto de empanadas ----------------------------------------------------------------

const STAND = [
  '    ________________________',
  '   /_/_/_/_/_/_/_/_/_/_/_/_/|',
  "   '.'.'.'.'.'.'.'.'.'.'.'. |",
  '    | EMPANADAS |          ||',
  '    | de pino   |          ||',
  '   _|___________|__________||_',
  '  |  .-. .-.  [====]  ____   |',
  '  |  |~| |~|  |::::| |o o|   |',
  '  |__|_|_|_|__|____|_|___|___|',
  "  '-(o)-----------------(o)--'",
];

function placeStand(g, L, G, W, M, rng, lights, dark, out) {
  const { C } = L;
  // a la izquierda del centro, para que el título no lo tape
  const sx = M + Math.max(0, Math.round(C * 0.5 - 36));
  const top = G + 2 - STAND.length + 1; // las ruedas apoyan en la vereda
  STAND.forEach((line, i) => {
    const a = line.search(/\S/);
    const b = line.trimEnd().length;
    for (let k = a; k < b; k++) g.put(sx + k, top + i, line.charCodeAt(k));
  });
  // vendedor detrás del mostrador
  g.text(sx + 21, top + 3, 'o');
  g.text(sx + 20, top + 4, '/|\\');
  const lant = lights.add(new Lantern(sx, top + 3, rng.int(1, 1e6), dark));
  g.put(sx + 1, top + 2, 124);
  out.stand = { x: sx, y: top, w: 30, h: STAND.length, lantern: lant };
  out.standSteam = [{ x: sx + 6, y: top + 6 }, { x: sx + 10, y: top + 6 }];
}

// --- faroles, semáforo, kiosco ----------------------------------------------------------

function placeStreetFurniture(g, L, G, W, M, rng, lights, dark, out) {
  const { C } = L;
  const yR = out.yR;
  // faroles en la vereda de enfrente
  const xs = [M + Math.round(C * 0.5 + 14), M + Math.round(C * 0.5 + 14) + 52, M + Math.round(C * 0.5 - 50)];
  for (const x of xs) {
    if (x < 3 || x > W - 4) continue;
    const top = G - 15;
    for (let row = top + 2; row < yR - 1; row++) g.put(x, row, 124);
    g.text(x - 1, top, '.-.');
    g.text(x - 2, top + 1, '(___)');
    g.text(x - 1, yR - 1, '/_\\');
    out.lamps.push({ x, y: top + 1, kind: 'street', reach: 10 });
  }
  // semáforo junto al cruce
  const sx = out.crossing.x - 3;
  const top = G - 12;
  for (let row = top + 5; row < yR - 1; row++) g.put(sx, row, 124);
  g.text(sx - 1, top, '.-.');
  for (let i = 0; i < 3; i++) g.text(sx - 1, top + 1 + i, '| |');
  g.text(sx - 1, top + 4, "'-'");
  g.text(sx - 1, yR - 1, '/_\\');
  out.signals.push({ x: sx, y: top + 1 });
  // grifo
  g.spr(A.HYDRANT, M + Math.round(C * 0.5 + 24), G + 1);
  // kiosco de diarios en la vereda de acá
  const kx = M + Math.round(C * 0.5 + 30);
  const ky = out.yN + 2;
  if (kx + 16 < W && ky + 5 < g.h) {
    const K = [' ______________', '/______________\\', '| DIARIOS  [] |', '|[][][]|::::: |', '|______|______|'];
    K.forEach((l, i) => g.text(kx, ky - 3 + i, l));
  }
}
