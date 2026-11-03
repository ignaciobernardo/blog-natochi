// La ciudad cercana: los edificios que pasan al lado del viaducto, a la altura
// de su cuarto piso. Se dibujan una sola vez en una tira larga (Grid); lo que
// cambia con el tiempo (interiores, letreros, gente, faroles) se registra
// aparte y se pinta encima en cada cuadro.
//
// Filas de la tira: NBASE es la vereda (en pantalla, la fila S). La planta
// baja ocupa 5 filas y cada piso 4:
//   r0  dintel  " _____ "
//   r1  interior
//   r2  interior (con el antepecho "_")
//   r3  muro entre pisos: balcones, jardineras, letreros
import { Grid, SP } from './grid.js';
import { Rng, hash2 } from './rng.js';
import { ROOF, STREET, sprite } from './art.js';
import { M, L, zoneAt, RIVER, PARK } from './world.js';
import { landmark, LANDMARKS } from './landmarks.js';
import { PERSONAL, laguna } from './personal.js';

export const NBASE = 76;
export const NH = NBASE + 1;

const R = String.raw;
const pick = (rng, a) => a[Math.floor(rng.next() * a.length)];

// --- piezas de fachada ------------------------------------------------------

export const SHOPS = [
  { name: 'PANADERÍA', goods: [' () (_)  ()', '(__) () (_)'] },
  { name: 'FRUTERÍA', goods: [' ooo  o o ', ' \\_/ \\_/ '] },
  { name: 'FARMACIA', goods: [' + [] [] ', ' ¡! [] ¡!'] },
  { name: 'FLORES', goods: ['* \\|/ * ', '(_)(_)(_)'] },
  { name: 'LIBROS', goods: ['|:||:|||', '||:|||:|'] },
  { name: 'DISCOS', goods: [' ○    ○  ', '   ○     '] },
  { name: 'RELOJERÍA', goods: ['(·) (·) ', '  (·) (·)'] },
  { name: 'LAVANDERÍA', goods: ['[○] [○] ', '[__] [__]'] },
  { name: 'ALMACÉN', goods: ['[] ¡! ()', '[][] ¡!['] },
  { name: 'BOTILLERÍA', goods: ['¡ ! ¡ ! ', '¡!¡!¡!¡!'] },
  { name: 'SANGUCHES', goods: [' o  _  ', '/|\\ h| '] },
  { name: 'COMPLETOS', goods: [' o   o ', '/|\\ (|\\'] },
  { name: 'FUENTE DE SODA', goods: [' o  _  o ', '/|  T  |\\'] },
  { name: 'BICICLETAS', goods: ['_o   _o ', '(o)(o)(o)'] },
  { name: 'PELUQUERÍA', goods: [' o  h  ', '/|\\ |  '] },
  { name: 'ZAPATOS', goods: ['  _/ _/ ', ' _/ _/  '] },
  { name: 'HELADOS', goods: ['() () ()', '\\/ \\/ \\/'] },
  { name: 'FERRETERÍA', goods: ['T  F  y ', '|  |  | '] },
  { name: 'CAFÉ', goods: [' o  _   ', '/|\\ T  h'] },
  { name: 'BAR', goods: [' o  o   ', '/)  (\\ T'] },
  { name: 'EMPANADAS', goods: ['  __  __ ', ' (__)(__)'] },
  { name: 'MERCERÍA', goods: [' ○  *  ○ ', ' ~~  ~~  '] },
];

const BLADE = ['PENSIÓN', 'CINE', 'BAR', 'HOSTAL', 'BAILE', 'RADIO', 'TANGO', 'SALÓN', 'DENTISTA', 'BILLAR', 'POSADA'];

const BILLBOARDS = [
  { text: 'HELADOS LA NONA', art: [' () () ', ' \\/ \\/ '] },
  { text: 'CAFÉ AROMA', art: ['  ) )  ', ' c[_]  '] },
  { text: 'RADIO 97.3', art: ['((o))', ' /_\\ '] },
  { text: 'SE ARRIENDA', art: ['TEL 2 233 4455'] },
  { text: 'JABÓN LUNA', art: [' o O o ', ' [___] '] },
  { text: 'CINE REX', art: ['* * *', ' HOY '] },
  { text: 'MUEBLES SOTO', art: ['  _h_ ', ' |___|'] },
  { text: 'DULCES DOÑA ROSA', art: [' ○ ○ ', '(_)(_)'] },
  { text: 'VIAJE AL SUR', art: ['/\\/\\  ~~', ' ¯¯¯¯ ~~ '] },
];

export const STREET_NAMES = ['LOS OLIVOS', 'AV. ESPERANZA', 'SANTA ROSA', 'EL TELAR', 'LAS VIOLETAS', 'SAN DIEGO', 'PORVENIR', 'LA COSTURA', 'EL ROBLE', 'AV. DEL MAR', 'LAS TORRES', 'COPIHUE', 'ALMENDROS', 'LIBERTAD'];

// --- piezas ---------------------------------------------------------------

// Escalera de incendio: plataforma con baranda y escalera rayada "\_\".
function fireEscape(g, x, w, rTop, nFloors, B) {
  for (let k = 0; k < nFloors; k++) {
    const r3 = rTop + 4 * k + 3; // fila del muro bajo cada piso
    const r2 = r3 - 1;
    for (let i = 0; i < w; i++) g.put(x + i, r2, i % 2 ? '¯' : '|');
    g.put(x + w - 1, r2, '|');
    for (let i = 0; i < w; i++) g.put(x + i, r3, '¯');
    if (r3 + 4 < B - 5) {
      const left = k % 2 === 0;
      for (let s = 0; s < 4; s++) {
        if (left) g.text(x + 1 + s, r3 + 1 + s, '\\_\\');
        else g.text(x + w - 4 - s, r3 + 1 + s, '/_/');
      }
    }
  }
}

// Letrero vertical con luces (las luces las anima la escena)
function blade(g, x, r, word, signs) {
  const h = word.length + 2;
  g.text(x, r, ' ___ ');
  for (let i = 0; i < h; i++) g.text(x, r + 1 + i, '|   |');
  for (let i = 0; i < word.length; i++) g.put(x + 2, r + 2 + i, word[i]);
  g.text(x, r + 1 + h, ' ¯¯¯ ');
  signs.push({ type: 'blade', x, y: r + 1, h, word });
}

function billboard(g, x, r, w, bb, signs) {
  // r = fila del techo; el cartel va arriba sobre patas de reticulado
  const top = r - 8;
  g.rect(x, top + 1, w, 5, SP);
  g.hline(x, x + w - 1, top, '_');
  for (let y = top + 1; y <= top + 5; y++) {
    g.put(x, y, '|');
    g.put(x + w - 1, y, '|');
  }
  g.hline(x + 1, x + w - 2, top + 5, '_');
  const t = bb.text;
  g.text(x + Math.floor((w - t.length) / 2), top + 2, t);
  bb.art.forEach((a, i) => g.text(x + Math.floor((w - a.length) / 2), top + 3 + i, a.replace(/ +$/, '')));
  for (const px of [x + 3, x + w - 6]) for (let y = top + 6; y <= r; y++) g.text(px, y, (y - top) % 2 ? '|\\|' : '|/|');
  signs.push({ type: 'billboard', x: x + 1, y: top + 1, w: w - 2 });
}

// textura del muro (solo sobre celdas vacías)
function texture(g, x0, x1, y0, y1, kind, seed) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (g.get(x, y) !== SP) continue;
      const h = hash2(x * 3 + seed, y * 7 + seed);
      let ch = 0;
      switch (kind) {
        case 'puntos':
          if ((x & 1) === 0) ch = ':';
          break;
        case 'puntitos':
          if (((x + y) & 1) === 0 && (x & 1) === 0) ch = '.';
          break;
        case 'ladrillo': {
          // hiladas de ladrillo insinuadas, en grupos
          const band = Math.floor(y / 2);
          if (y % 2 === 0 && hash2(Math.floor(x / 9) + seed, band) < 0.45) ch = (x + (band & 1) * 2) % 4 === 0 ? '|' : '_';
          break;
        }
        case 'grano':
          if (h < 0.05) ch = '.';
          else if (h < 0.075) ch = "'";
          else if (h < 0.085) ch = ',';
          break;
        case 'tablas':
          if (y % 2 === 0 && x % 2 === 0) ch = '-';
          break;
        default:
          break;
      }
      if (ch) g.put(x, y, ch);
    }
  }
}

// --- edificios -------------------------------------------------------------

const STYLE = {
  barrio: {
    floors: [3, 7], width: [20, 32], ww: [7, 7, 9], gap: [4, 7], tex: ['puntitos', 'grano', 'puntos', 'liso', 'puntos'],
    frame: ['rect', 'rect', 'persiana', 'doble', 'arco'], balcony: 0.3, box: 0.18, aire: 0.08, toldito: 0.12,
    cornice: ['=', '¯', 'dent', 'zig'], shop: 0.8, blade: 0.08, escape: 0.12, bill: 0.06, roof: 0.8, pil: 0.1,
  },
  antiguo: {
    floors: [4, 8], width: [22, 38], ww: [7, 7], gap: [4, 6], tex: ['ladrillo', 'puntos', 'puntos', 'puntitos'],
    frame: ['arco', 'rect', 'arco', 'persiana'], balcony: 0.2, box: 0.15, aire: 0.12, toldito: 0.08,
    cornice: ['dent', 'zig', '='], shop: 0.9, blade: 0.35, escape: 0.55, bill: 0.08, roof: 0.85, pil: 0.35,
  },
  centro: {
    floors: [6, 12], width: [24, 40], ww: [7], gap: [1, 2], tex: ['liso', 'puntos', 'grano'],
    frame: ['oficina', 'oficina', 'rect'], balcony: 0.04, box: 0, aire: 0.05, toldito: 0,
    cornice: ['=', '¯', 'zig'], shop: 0.7, blade: 0.2, escape: 0, bill: 0.3, roof: 0.6, pil: 0,
  },
};

function cornice(g, x0, x1, y, kind) {
  for (let x = x0; x <= x1; x++) {
    const i = x - x0;
    let ch = ' ';
    if (kind === '=') ch = '=';
    else if (kind === '¯') ch = '¯';
    else if (kind === 'dent') ch = i % 2 ? '¯' : '|';
    else if (kind === 'zig') ch = i % 2 ? '/' : '\\';
    g.put(x, y, ch);
  }
}

function windowFrame(g, wx, r0, ww, kind) {
  const r1 = r0 + 1;
  const r2 = r0 + 2;
  if (kind !== 'oficina') {
    if (kind === 'arco') g.text(wx + 1, r0, '.' + '-'.repeat(ww - 4) + '.');
    else g.hline(wx + 1, wx + ww - 2, r0, '_');
  }
  g.put(wx, r1, '|');
  g.put(wx, r2, '|');
  g.put(wx + ww - 1, r1, '|');
  g.put(wx + ww - 1, r2, '|');
  if (kind === 'persiana') {
    // postigos abiertos a los costados
    g.put(wx - 1, r1, '‖');
    g.put(wx - 1, r2, '‖');
    g.put(wx + ww, r1, '‖');
    g.put(wx + ww, r2, '‖');
  }
  if (kind === 'doble') {
    g.put(wx + (ww >> 1), r1, '|');
    g.put(wx + (ww >> 1), r2, '|');
  }
}

// Una fila de pisos con ventanas. Devuelve la grilla de vanos usada.
function floorsBlock(ctx, x0, w, rTopFloor, nFloors, st, frame, rng, seed, escape) {
  const { g } = ctx;
  const B = NBASE;
  const x1 = x0 + w - 1;
  const office = frame === 'oficina';
  const ww = office ? pick(rng, [7, 7, 11]) : pick(rng, st.ww);
  const spandrel = office ? pick(rng, [' ', ':', '=', '-', ' ']) : ' ';
  const gap = office ? 0 : rng.int(st.gap[0], st.gap[1]);
  const step = office ? ww - 1 : ww + gap;
  const mg = office ? 1 : 2;
  const n = Math.max(1, Math.floor((w - 2 * mg - ww) / step) + 1);
  const total = (n - 1) * step + ww;
  const start = x0 + Math.floor((w - total) / 2);
  const kind = office ? 'oficina' : 'casa';
  const escapeBay = escape && n >= 2 ? rng.int(0, n - 1) : -1;
  for (let k = 0; k < nFloors; k++) {
    const r0 = rTopFloor + 4 * k;
    if (office) {
      g.hline(x0 + 1, x1 - 1, r0 + 3, '_');
      for (let c = x0 + 1; c < x1; c++) g.put(c, r0, spandrel === ':' ? (c & 1 ? ':' : ' ') : spandrel === '-' ? (c % 3 ? '-' : ' ') : spandrel);
    }
    for (let i = 0; i < n; i++) {
      const wx = start + i * step;
      windowFrame(g, wx, r0, ww, office ? 'oficina' : frame);
      const win = { x: wx + 1, y: r0 + 1, w: ww - 2, kind, seed: Math.floor(hash2(wx, r0 + seed) * 1e9), floor: Math.round((B - 5 - r0) / 4), bay: i };
      ctx.windows.push(win);
      if (office || i === escapeBay) continue;
      const roll = hash2(wx * 13 + seed, r0);
      const r3 = r0 + 3;
      if (r3 >= B - 5) continue;
      if (roll < st.balcony) {
        // balcón con baranda; tapa el antepecho
        g.put(wx - 1, r0 + 2, '.');
        for (let j = 0; j < ww; j++) g.put(wx + j, r0 + 2, j % 2 ? '¯' : '|');
        g.put(wx + ww, r0 + 2, '.');
        g.hline(wx - 1, wx + ww, r3, '¯');
        if (hash2(wx, r0 * 3) < 0.6) g.put(wx - 1, r0 + 1, hash2(wx, r0) < 0.5 ? '*' : 'Y');
        if (hash2(wx * 3, r0) < 0.35) g.put(wx + ww, r0 + 1, '*');
        win.balcony = true;
      } else if (roll < st.balcony + st.box) {
        g.text(wx, r3, '\\' + '*,'.repeat(ww).slice(0, ww - 2) + '/');
      } else if (roll < st.balcony + st.box + st.aire) {
        g.text(wx + ww - 4, r3, '[==]');
      }
      if (hash2(wx * 7, r0 + seed * 3) < st.toldito) {
        // toldito rayado sobre la ventana
        g.text(wx - 1, r0, '_'.repeat(ww + 2));
        g.text(wx - 1, r0 + 1, '/' + '_/'.repeat(ww).slice(0, ww) + '/');
        win.awning = true;
      }
    }
  }
  if (escapeBay >= 0) fireEscape(g, start + escapeBay * step - 2, ww + 4, rTopFloor, nFloors, B);
  return { start, step, n, ww, gap };
}

// cuerpo: relleno opaco, línea de techo, cornisa, textura, aristas
function body(g, x0, w, top, bottom, corn, tex, seed) {
  const x1 = x0 + w - 1;
  g.rect(x0, top + 1, w, bottom - top, SP);
  g.hline(x0, x1, top, '_');
  cornice(g, x0 + 1, x1 - 1, top + 1, corn);
  if (tex) texture(g, x0 + 1, x1 - 1, top + 2, bottom, tex, seed);
}

export function building(ctx, x0, w, floors, styleName, rng) {
  const { g } = ctx;
  const st = STYLE[styleName];
  const B = NBASE;
  const x1 = x0 + w - 1;
  const seed = rng.int(1, 1e6);
  let top = B - 3 - 4 * floors;
  const frame = pick(rng, st.frame);
  const corn = pick(rng, st.cornice);
  const tex = pick(rng, st.tex);

  // tipo de techo
  let roof = 'plano';
  const r = rng.next();
  if (styleName === 'centro' && floors >= 9 && w >= 26 && r < 0.55) roof = 'escalonado';
  else if (styleName !== 'centro' && r < 0.2 && w <= 34) roof = 'mansarda';
  else if (styleName === 'barrio' && r < 0.42 && w <= 30) roof = 'calamina';
  else if (styleName === 'antiguo' && r < 0.45) roof = 'cupula';

  // cuerpo principal
  const w0 = ctx.windows.length;
  const tex2 = frame === 'oficina' && tex === 'puntos' ? 'liso' : tex;
  body(g, x0, w, top, B - 6, corn, tex2 === 'liso' ? 0 : tex2, seed);
  const grid = floorsBlock(ctx, x0, w, B - 5 - 4 * (floors - 1), floors - 1, st, frame, rng, seed, st.escape && rng.chance(st.escape));

  // pilastras entre vanos
  if (frame !== 'oficina' && rng.chance(st.pil) && grid.gap >= 3) {
    for (let i = 1; i < grid.n; i++) {
      const px = grid.start + i * grid.step - Math.ceil(grid.gap / 2);
      for (let y = top + 2; y <= B - 6; y++) {
        const c = g.get(px, y);
        if (c === SP || c === 58 || c === 46 || c === 95 || c === 124 || c === 39) g.put(px, y, '|');
      }
    }
  }

  const door = groundFloor(ctx, x0, w, rng, st);
  g.vline(x0, top + 1, B - 1, '|');
  g.vline(x1, top + 1, B - 1, '|');
  ctx.boxes.push({ x0, x1, top, bottom: B - 1, floors });
  const place = {
    kind: door.shop ? 'local' : 'casa',
    x0,
    x1,
    top,
    bottom: B - 1,
    floors,
    zone: styleName,
    frame,
    tex,
    shop: door.shop,
    door: door.hole,
    number: door.number,
    windows: ctx.windows.slice(w0),
    seed,
  };
  ctx.places.push(place);

  // letrero vertical colgado de la fachada
  if (rng.chance(st.blade) && floors >= 4) {
    const word = pick(rng, BLADE);
    const left = rng.chance(0.5);
    const by = B - 6 - (word.length + 3) - rng.int(0, 2);
    if (by > top + 2) {
      g.put(left ? x0 - 1 : x1 + 1, by + 2, '-');
      blade(g, left ? x0 - 6 : x1 + 2, by, word, ctx.signs);
    }
  }

  // techo
  let free = [x0 + 1, x1 - 1]; // tramo de azotea libre para cosas
  if (roof === 'escalonado') {
    const d = rng.int(3, 5);
    const uf = rng.int(2, 3);
    const ux0 = x0 + d;
    const uw = w - 2 * d;
    const utop = top - 4 * uf;
    body(g, ux0, uw, utop, top, '=', 0, seed + 1);
    const u0 = ctx.windows.length;
    floorsBlock(ctx, ux0, uw, utop + 2, uf, st, 'oficina', rng, seed + 7, false);
    place.windows.push(...ctx.windows.slice(u0));
    place.top = utop;
    g.hline(ux0 + 1, ux0 + uw - 2, top, '_');
    g.vline(ux0, utop + 1, top, '|');
    g.vline(ux0 + uw - 1, utop + 1, top, '|');
    ctx.boxes.push({ x0: ux0, x1: ux0 + uw - 1, top: utop, bottom: top, floors: uf });
    if (rng.chance(0.6)) ctx.signs.push({ type: 'gondola', x: x0 + 2 + rng.int(0, Math.max(0, w - 12)), y: top, top: top + 1, bottom: NBASE - 7 });
    // mástil con baliza
    const mx = ux0 + (uw >> 1);
    for (let y = utop - 6; y < utop; y++) g.put(mx, y, '|');
    g.text(mx - 1, utop - 3, '-+-');
    ctx.signs.push({ type: 'baliza', x: mx, y: utop - 7 });
    // terrazas a los lados
    if (d >= 4) g.blit(ROOF.plantas, x0 + 1, top - ROOF.plantas.h);
    free = null;
    top = utop;
  } else if (roof === 'mansarda' || roof === 'calamina') {
    const rows = 3;
    for (let k = 0; k < rows; k++) {
      const y = top - k;
      const a = x0 + k;
      const b = x1 - k;
      for (let x = a + 1; x < b; x++) {
        let ch;
        if (roof === 'calamina') ch = (x + y) % 2 ? '/' : '_';
        else ch = k === 0 ? '_' : (x + y) % 4 === 0 ? ':' : ' ';
        g.put(x, y, ch);
      }
      g.put(a, y, '/');
      g.put(b, y, '\\');
    }
    g.hline(x0 + rows, x1 - rows, top - rows, '_');
    if (roof === 'mansarda') {
      // buhardillas
      for (let x = x0 + 5; x < x1 - 6; x += 7) {
        g.text(x, top - 2, ' _ ');
        g.text(x, top - 1, '|_|');
        ctx.dormers.push({ x: x + 1, y: top - 1 });
      }
    }
    free = [x0 + rows + 1, x1 - rows - 1];
    top -= rows;
  } else if (roof === 'cupula') {
    const left = rng.chance(0.5);
    const cx0 = left ? x0 + 1 : x1 - 8;
    const cup = sprite(R`
    _|_
   /   \
  |  *  |
  |_____|
`);
    g.blit(cup, cx0, top - cup.h + 1);
    free = left ? [x0 + 10, x1 - 1] : [x0 + 1, x1 - 10];
  }

  // azotea: cartel o cosas
  if (free && rng.chance(st.bill) && free[1] - free[0] >= 22) {
    const bb = pick(rng, BILLBOARDS);
    const bw = Math.min(free[1] - free[0], Math.max(bb.text.length + 6, rng.int(20, 26)));
    const bwx = free[0] + Math.floor((free[1] - free[0] - bw) / 2);
    billboard(g, bwx, top - 1, bw, bb, ctx.signs);
    free = null;
  }
  // un gato tomando sol o una bandera
  if (free && free[1] - free[0] > 14 && rng.chance(0.18)) {
    const gx = free[1] - 7;
    ctx.signs.push({ type: 'gato', x: gx, y: top - 2 });
    free = [free[0], gx - 2];
  } else if (free && free[1] - free[0] > 14 && rng.chance(0.15)) {
    const fx = free[1] - 6;
    for (let y = top - 5; y < top; y++) g.put(fx, y, '|');
    g.put(fx, top - 6, 'o');
    ctx.signs.push({ type: 'bandera', x: fx, y: top - 5 });
    free = [free[0], fx - 2];
  }
  if (free && rng.chance(st.roof)) {
    const items = ['estanque', 'estanque2', 'antena', 'antena2', 'parabola', 'chimenea', 'caseta', 'palomar', 'solar', 'plantas', 'ropa', 'aire'];
    let rx = free[0] + rng.int(0, 3);
    let count = 0;
    while (rx < free[1] - 3 && count < 3) {
      const it = ROOF[pick(rng, items)];
      if (rx + it.w > free[1]) break;
      g.blit(it, rx, top - it.h);
      if (it === ROOF.chimenea) ctx.smokes.push({ x: rx + 1, y: top - it.h - 1 });
      if (it === ROOF.ropa) ctx.laundry.push({ x: rx + 1, y: top - it.h + 1, w: it.w - 2 });
      rx += it.w + rng.int(2, 8);
      count++;
    }
  }
  return { top };
}

function groundFloor(ctx, x0, w, rng, st) {
  const { g } = ctx;
  const B = NBASE;
  const x1 = x0 + w - 1;
  g.rect(x0 + 1, B - 5, w - 2, 5, SP);
  if (!rng.chance(st.shop)) {
    // portal de vivienda: puerta con arco y ventanas con reja
    const dx = x0 + Math.floor(w / 2) - 3;
    g.text(dx, B - 5, ' .--. ');
    g.text(dx, B - 4, '|    |');
    g.text(dx, B - 3, '|   o|');
    g.text(dx, B - 2, '|    |');
    g.text(dx, B - 1, '|____|');
    g.put(dx + 1, B - 6, '_');
    g.text(dx + 1, B - 6, ' ' + String(10 + Math.floor(hash2(x0, 1) * 990)).padEnd(4).slice(0, 4));
    for (const wx of [x0 + 2, x1 - 6]) {
      if (wx < dx - 5 || wx > dx + 6) {
        g.text(wx, B - 4, ' ___ ');
        g.text(wx, B - 3, '|‖‖‖|');
        g.text(wx, B - 2, '|‖‖‖|');
        g.text(wx, B - 1, '¯¯¯¯¯');
      }
    }
    g.hline(x0 + 1, x1 - 1, B - 1, '_');
    g.text(dx, B - 1, '|____|');
    // vano de la puerta: entre las jambas y del dintel a la vereda
    return { shop: null, hole: { x0: dx + 0.5, x1: dx + 5.5, y0: B - 4, y1: B }, number: 10 + Math.floor(hash2(x0, 1) * 990) };
  }
  const shop = pick(rng, SHOPS);
  const name = shop.name;
  const nx = x0 + Math.floor((w - name.length) / 2);
  g.text(nx - 1, B - 6, ' ' + name + ' ');
  // toldo rayado
  const aw = rng.int(0, 2);
  g.hline(x0, x1, B - 5, '_');
  const pat = aw === 0 ? '\\_' : aw === 1 ? '/_' : '\\/';
  for (let x = x0; x <= x1; x++) g.put(x, B - 4, pat[(x - x0) % 2]);
  if (aw === 1) g.put(x1, B - 4, '/');
  // vidriera + puerta
  const doorX = rng.chance(0.5) ? x0 + 2 : x1 - 6;
  g.text(doorX, B - 3, '|¯¯¯|');
  g.text(doorX, B - 2, '|  o|');
  g.text(doorX, B - 1, '|___|');
  const segs = doorX === x0 + 2 ? [[doorX + 6, x1 - 2]] : [[x0 + 2, doorX - 2]];
  for (const [a, b] of segs) {
    if (b - a < 4) continue;
    g.put(a, B - 3, '|');
    g.put(a, B - 2, '|');
    g.put(b, B - 3, '|');
    g.put(b, B - 2, '|');
    g.hline(a, b, B - 1, '_');
    g.put(a, B - 1, '|');
    g.put(b, B - 1, '|');
    const [ga, gb] = shop.goods;
    for (let x = a + 1; x < b; x++) {
      const ca = ga[(x - a - 1) % ga.length];
      const cb = gb[(x - a - 1) % gb.length];
      if (ca !== ' ') g.put(x, B - 3, ca);
      if (cb !== ' ') g.put(x, B - 2, cb);
    }
    ctx.shops.push({ x: a + 1, y: B - 3, w: b - a - 1 });
  }
  g.hline(x0 + 1, x1 - 1, B - 1, '_');
  g.put(doorX, B - 1, '|');
  g.put(doorX + 4, B - 1, '|');
  return { shop, hole: { x0: doorX + 0.5, x1: doorX + 4.5, y0: B - 3, y1: B }, number: 10 + Math.floor(hash2(x0, 3) * 990) };
}

// --- relleno: cosas bajas entre edificios ------------------------------------

function lowStuff(ctx, x0, w, rng) {
  const { g } = ctx;
  const B = NBASE;
  const r = rng.next();
  if (r < 0.3 && w >= 14) {
    const k = STREET.kiosco;
    g.blit(k, x0 + Math.floor((w - k.w) / 2), B - k.h);
  } else if (r < 0.65) {
    // muro con reja
    g.hline(x0, x0 + w - 1, B - 4, '_');
    for (let x = x0; x < x0 + w; x++) {
      g.put(x, B - 3, x % 2 ? '|' : ' ');
      g.put(x, B - 2, x % 2 ? '|' : ' ');
      g.put(x, B - 1, '_');
    }
    for (let x = x0; x < x0 + w; x += 2) g.put(x, B - 4, '.');
  } else {
    const t = rng.chance(0.5) ? STREET.arbol : STREET.arbol2;
    if (t.w <= w + 2) g.blit(t, x0 + Math.floor((w - t.w) / 2), B - t.h);
  }
}

function park(ctx, a, b, rng) {
  const { g } = ctx;
  const B = NBASE;
  let x = a + 2;
  while (x < b - 10) {
    const r = rng.next();
    let s;
    if (r < 0.42) s = rng.chance(0.6) ? STREET.arbol : STREET.arbol2;
    else if (r < 0.56) s = STREET.palmera;
    else if (r < 0.68) s = STREET.banca;
    else if (r < 0.76) s = STREET.farol;
    else if (r < 0.84 && !ctx.fountains.length) s = STREET.fuente;
    else s = STREET.arbol;
    if (x + s.w > b - 2) break;
    g.blit(s, x, B - s.h);
    if (s === STREET.fuente) ctx.fountains.push({ x: x + 6, y: B - s.h - 2 });
    if (s === STREET.farol) ctx.lamps.push({ x: x + 1, y: B - s.h + 1 });
    x += s.w + rng.int(1, 5);
  }
  for (let x2 = a; x2 < b; x2++) if (g.get(x2, B - 1) === 0 && hash2(x2, 5) < 0.45) g.put(x2, B - 1, hash2(x2, 9) < 0.5 ? ',' : "'");
}

// --- vereda y mobiliario ------------------------------------------------------

function sidewalk(ctx, streets, rng) {
  const { g } = ctx;
  const B = NBASE;
  const W = g.w;
  const toL = (x) => x + M;
  const corr = streets.map(([a, b]) => [toL(a), toL(b)]);
  const river = [toL(RIVER[0]) - 6, toL(RIVER[1]) + 6];
  const inCorr = (x) => corr.some(([a, b]) => x >= a && x < b);
  for (let x = 0; x < W; x++) {
    if (x >= river[0] && x < river[1]) g.put(x, B, (x & 1) === 0 ? '|' : '¯');
    else if (inCorr(x)) g.put(x, B, ' ');
    else g.put(x, B, x % 6 === 0 ? '.' : '_');
  }
  // esquinas: semáforo y letrero con el nombre de la calle
  corr.forEach(([a, b], i) => {
    const name = STREET_NAMES[i % STREET_NAMES.length];
    const sx = a - 3;
    g.blit(STREET.semaforo, sx - 1, B - STREET.semaforo.h);
    ctx.lights.push({ x: sx, y: B - STREET.semaforo.h + 1 });
    const w = name.length + 2;
    const px = b - 3;
    g.text(px - w, B - 9, ' ' + '_'.repeat(w) + ' ');
    g.text(px - w, B - 8, '|' + ' ' + name + ' ' + '|');
    g.text(px - w, B - 7, ' ' + '¯'.repeat(w) + ' ');
    g.vline(px, B - 6, B - 1, '|');
  });
  // faroles y cosas de vereda
  let x = 6;
  while (x < W - 6) {
    x += rng.int(16, 30);
    if (x >= river[0] - 4 && x < river[1] + 4) continue;
    if (corr.some(([a, b]) => x + 8 > a - 6 && x < b + 6)) continue;
    const wx = x - M;
    if (wx >= PARK[0] && wx < PARK[1]) continue;
    const r = rng.next();
    let s;
    if (r < 0.4) s = rng.chance(0.5) ? STREET.farol : STREET.farol2;
    else if (r < 0.52 && zoneAt(wx) !== 'centro') s = STREET.arbol2;
    else if (r < 0.6) s = STREET.hidrante;
    else if (r < 0.68) s = STREET.basurero;
    else if (r < 0.74) s = STREET.buzon;
    else if (r < 0.82) s = STREET.telefono;
    else if (r < 0.9) s = STREET.bici;
    else s = STREET.parada;
    g.blit(s, x, B - s.h);
    if (s === STREET.farol) ctx.lamps.push({ x: x + 1, y: B - s.h + 1 });
    if (s === STREET.farol2) ctx.lamps.push({ x: x + 4, y: B - s.h + 2 });
  }
}

// --- toda la tira ----------------------------------------------------------

export function buildNear(streets, seed = 11) {
  const rng = new Rng(seed);
  const W = Math.ceil(L + 2 * M + 60);
  const g = new Grid(W, NH);
  const ctx = { g, windows: [], signs: [], boxes: [], shops: [], smokes: [], fountains: [], lots: [], lamps: [], lights: [], dormers: [], laundry: [], places: [] };
  for (const m of LANDMARKS) m.done = false;
  for (const m of PERSONAL) m.done = false;
  const edges = [[-1e9, -400], ...streets, [L + 300, 1e9]];
  for (let i = 0; i < edges.length - 1; i++) {
    const a = Math.max(-M + 4, edges[i][1]);
    const b = Math.min(L + M + 40, edges[i + 1][0]);
    if (b - a < 8) continue;
    let x = a;
    while (x < b - 6) {
      const z = zoneAt(x);
      if (z === 'rio') {
        x = RIVER[1];
        continue;
      }
      if (z === 'parque') {
        // v11: en el parque está la laguna de Los Ángeles (personal.js)
        laguna(ctx, PARK[0] + M, PARK[1] + M, NBASE);
        x = PARK[1];
        continue;
      }
      // lugares propios (personal.js): el primero pendiente que caiga acá
      const pp = PERSONAL.find((m) => !m.done && x >= m.x - 30 && x < m.x + 60);
      if (pp && b - x >= pp.w + 2) {
        const pw = pp.draw(g, x + M, NBASE, ctx);
        pp.done = true;
        ctx.lots.push([x, x + pw]);
        x += pw;
        continue;
      }
      // hitos: el primero pendiente que caiga en este tramo
      const lm = LANDMARKS.find((m) => !m.done && x >= m.x - 30 && x < m.x + 60);
      if (lm) {
        const need = { cine: 41, iglesia: 34, obra: 44, mercado: 53 }[lm.kind];
        if (b - x >= need + 2) {
          const lw = landmark(lm.kind, g, x + M, NBASE, ctx);
          lm.done = true;
          ctx.lots.push([x, x + lw]);
          x += lw + rng.int(1, 3);
          continue;
        }
      }
      const st = STYLE[z];
      let w = rng.int(st.width[0], st.width[1]);
      const limit = Math.min(b, x < RIVER[0] ? RIVER[0] : b, x < PARK[0] ? PARK[0] : b);
      if (x + w > limit - 2) w = limit - x;
      if (w < 16) {
        if (w >= 6) lowStuff(ctx, x + M, w, rng);
        x += Math.max(w, 1);
        continue;
      }
      // a veces un pasaje o un sitio entre edificios
      if (rng.chance(0.22) && x > a) {
        const gw = rng.int(4, 14);
        if (gw >= 8) lowStuff(ctx, x + M, gw, rng);
        x += gw;
        continue;
      }
      const floors = rng.int(st.floors[0], st.floors[1]);
      building(ctx, x + M, w, floors, z, rng);
      ctx.lots.push([x, x + w]);
      x += w + (rng.chance(0.3) ? rng.int(1, 4) : 0);
    }
  }
  sidewalk(ctx, streets, rng);
  const byX = (p, q) => p.x - q.x;
  for (const k of ['windows', 'signs', 'lamps', 'lights', 'dormers', 'laundry']) ctx[k].sort(byX);
  ctx.boxes.sort((p, q) => p.x0 - q.x0);
  ctx.places.sort((p, q) => p.x0 - q.x0);
  // la calle de cada lugar (la transversal más cercana hacia atrás)
  for (const pl of ctx.places) {
    let k = 0;
    for (let i = 0; i < streets.length; i++) if (streets[i][1] + M <= pl.x0) k = i;
    pl.street = STREET_NAMES[k % STREET_NAMES.length];
  }
  return ctx;
}
