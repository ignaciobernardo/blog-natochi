// Oficios: relojería, lavandería, bicicletas, peluquería y ferretería.
import { Grid } from './util.js';
import {
  S, SP, hash2, clamp, persona,
  planoMeson, meson, letrero, pizarraEn, repisa, repisas, repisasLado, RELLENO, ventanaLado, puertaLado,
  lampara, brillo, ventilador, vapor, notas, relojPared, relojChico, esfera, agujas, figura, clientes, gato, mosca,
  lucesAnim, afiche, cuadroLado, CORDILLERA, bocadillo, zCol, circulo, esfera2, agujas2,
} from './local-kit.js';

// La hora de una ciudad (desfase en horas respecto de UTC).
function horaDe(off) {
  const d = new Date();
  return new Date(d.getTime() + (d.getTimezoneOffset() + off * 60) * 60000);
}

// --- RELOJERÍA ------------------------------------------------------------------------------

const CIUDADES = [['SANTIAGO', -3], ['PARÍS', 1], ['TOKIO', 9], ['NUEVA YORK', -4], ['LONDRES', 0], ['LIMA', -5]];

function relojeria(ctx) {
  const { room, g, cols, rows, b, E, narrow, L, night } = ctx;
  room.shell({ floor: 'tablas', walls: 'papel', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'RELOJERÍA', 'caja');
  // la pared de relojes con la hora real de varias ciudades
  const esferas = [];
  const r = ctx.wide ? 3 : 2;
  const cy = L.alto[0] + r;
  const n = narrow ? 2 : ctx.wide ? 6 : 4;
  const xs = [];
  if (narrow) xs.push(L.x0 + 6, L.x1 - 6);
  else {
    const left = [L.x0 + 2 * r + 2, L.tit.x0 - 2 * r - 3];
    const right = [L.tit.x1 + 2 * r + 3, L.x1 - 2 * r - 2];
    const k = n / 2;
    for (let i = 0; i < k; i++) xs.push(Math.round(left[0] + ((left[1] - left[0]) * i) / Math.max(1, k - 1)));
    for (let i = 0; i < k; i++) xs.push(Math.round(right[0] + ((right[1] - right[0]) * i) / Math.max(1, k - 1)));
  }
  xs.forEach((x, i) => {
    const e = esfera2(ctx, x, cy, r);
    const [city, off] = CIUDADES[i % CIUDADES.length];
    ctx.text(x - Math.floor(city.length / 2), cy + r + 1, city);
    esferas.push({ e, off });
  });
  ctx.anim(ctx.Z, (out) => {
    for (const { e, off } of esferas) agujas2(out, e, horaDe(off), true);
  });
  // abajo: despertadores en una repisa, muchos relojes chicos y un cucú
  const kx = narrow ? L.x0 + 1 : L.x1 - 8;
  const ky = narrow ? L.bajo[0] + 1 : L.bajo[0];
  repisas(ctx, L.x0 + 1, L.x1 - 1, b.y1, b.y1, 4, [[' _ ', '(·)', '¨ ¨'], ['.-.', '|·|'], ['[12:00]']], { gap: 2 });
  const chicos = [];
  for (let y = L.bajo[0] + 1; y <= b.y1 - (narrow ? 3 : 4); y += 3) {
    for (let x = L.x0 + 2; x + 3 <= L.x1; x += 5) {
      if (ctx.pisaTitulo(x, x + 3, y, y)) continue;
      if (hash2(x, y) < 0.25) continue;
      if (x + 3 >= kx - 1 && y >= ky - 2 && y <= ky + 6) continue;
      chicos.push([x, y, Math.floor(hash2(y, x) * 12)]);
    }
  }
  for (const [x, y] of chicos) g.put(x + 1, y + 1, '¯');
  ctx.anim(ctx.Z, (out) => {
    const d = new Date();
    for (const [x, y, off] of chicos) relojChico(out, x, y, d, off);
  });
  // el reloj cucú, a la izquierda del letrero
  ctx.lines(kx, ky - 1, ['  /\\  ', ' /  \\ ', '/[  ]\\', '|(·) |', '|____|', '  ||  ', '  oo  ']);
  ctx.anim(ctx.Z, (out, t) => {
    const s = new Date().getSeconds();
    const pop = s < 4 || (t % 15) < 1.2;
    out.text(kx + 2, ky + 1, pop ? '[>' : '[ ');
    if (pop) out.text(kx + 7, ky + 1, '¡cucú!');
    // las pesas suben y bajan
    out.put(kx + 2, ky + 5, Math.floor(t) % 2 ? 'o' : '|');
    out.put(kx + 3, ky + 5, Math.floor(t) % 2 ? '|' : 'o');
  });
  // reloj de pie a la izquierda, con el péndulo
  const pz = ctx.zf(0.78);
  const ph = Math.round(ctx.alto(pz) * 1.05);
  const pw = 7;
  const PIE = [' _____ ', '|.---.|', '|( · )|', "|`---'|", '|_____|'];
  for (let i = 0; i < ph - 8; i++) PIE.push('|     |');
  PIE.push('|_____|', '[_____]');
  const pie = S(PIE);
  const pX = narrow ? cols * 0.12 : cols * 0.14;
  const px = ctx.px(pX, pz) - (pw >> 1);
  const py = ctx.piso(pz) - pie.h;
  ctx.at(pz, () => g.blit(pie, px, py));
  ctx.anim(pz - 0.001, (out, t) => {
    const d = new Date();
    out.put(px + 3, py + 2, ['|', '/', '-', '\\'][Math.round((d.getMinutes() / 60) * 8) % 4]);
    // el péndulo
    const a = Math.sin(t * Math.PI);
    const len = Math.max(2, ph - 9);
    for (let i = 1; i < len; i++) out.put(px + 3 + Math.round(a * (i / len) * 1.6), py + 4 + i, i === len - 1 ? 'O' : '|');
    out.text(px + pw + 1, py + 6, Math.floor(t * 2) % 2 ? 'tic' : 'tac');
  });
  // más relojes colgados en las paredes de los costados
  const lado = [];
  for (const side of [-1, 1]) {
    for (const [z, Y] of [[1.18, 0.3], [1.42, 0.22], [1.42, 0.42], [1.7, 0.3]]) {
      if (z > ctx.Z - 0.1) continue;
      const x = Math.round(room.x(side < 0 ? 0 : cols, z)) + (side < 0 ? 2 : -6);
      const y = Math.round(room.y(rows * Y, z));
      const big = z < 1.3;
      if (big) ctx.lines(x, y - 1, [' .-. ', '(   )', " `-' "]);
      else ctx.text(x + 1, y, '( )');
      lado.push([x + 1, y, Math.floor(hash2(x, y) * 12)]);
    }
  }
  ctx.anim(1.15, (out) => {
    const d = new Date();
    for (const [x, y, off] of lado) relojChico(out, x, y, d, off);
  });
  // vitrina con relojes de pulsera
  const m = planoMeson(ctx, {
    X0: narrow ? 0.22 : 0.3,
    X1: narrow ? 0.94 : 0.86,
    f0: 0.38,
    cara: (c, rr) => (rr === 0 ? 0 : rr === 1 ? (c % 8 === 3 ? '/' : 0) : rr === 2 ? (c % 6 === 1 ? '(' : c % 6 === 2 ? '·' : c % 6 === 3 ? ')' : c % 6 === 4 ? '=' : 0) : rr === 3 ? '_' : c % 12 === 0 ? '|' : 0),
  });
  // el banco del relojero: lámpara, herramientas y un reloj abierto
  const wx = m.c0 + 3;
  ctx.at(m.z0, () => {
    ctx.lines(wx, m.top - 4, [' __   ', '(_ \\  ', '   |  ', '  _|_ ']);
    ctx.text(wx + 7, m.top, '(·) ¦¦ ~');
    if (!narrow) ctx.text(m.c1 - 10, m.top, '[PILAS]');
  });
  const zV = ctx.zf(0.58);
  const Xv = room.vx + (wx + 11 - room.vx) * zV;
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'bata', cara: 'lupa', gorro: 'boina' }, poses: [['manos', 4], ['parado', 1], ['alza', 0.8, 'lupa'], ['manos', 3]], parpadea: false });
  ctx.anim(m.z0 - 0.001, (out, t) => {
    // la luz de la lámpara sobre el reloj abierto, y una chispa del destornillador
    out.put(wx + 2, m.top - 1, Math.floor(t * 2) % 2 ? ':' : '.');
    if (hash2(Math.floor(t * 4), 3) < 0.2) out.put(wx + 9, m.top - 1, '*');
  });
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.62 : 0.6), z: ctx.zf(0.22) }],
    periodo: 16,
    dice: ['se me paró', '¿le cambia la pila?', '¿lo arregla?', 'era de mi abuelo'],
    responde: ['déjemelo', 'cinco minutos', 'para el jueves', 'qué joya'],
    vend: { X: Xv, z: zV },
  });
  brillo(ctx, [lampara(ctx, cols * 0.5, 1.3, 'campana')]);
  void E;
  void night;
}

// --- LAVANDERÍA ------------------------------------------------------------------------------

const LAVADORA = [' _______ ', '|[]  ·· |', '| .---. |', '|(     )|', "| `---' |", '|_______|'];
const LAVADORA_CH = [' _____ ', '|[] ··|', '|(   )|', '|_____|'];

function lavanderia(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'baldosa', walls: 'liso', back: 'azulejo', ceiling: 'liso', seed: ctx.seed });
  ctx.clear(L.x0, b.y0, L.x1, L.cartel + 1);
  letrero(ctx, ctx.vx, L.cartel, 'LAVANDERÍA', 'caja');
  // precios
  if (!narrow) {
    ctx.clear(L.x1 - 22, L.alto[0] - 1, L.x1, L.alto[0] + 6);
    pizarraEn(ctx, L.x1 - 21, L.alto[0] - 1, L.x1, L.alto[0] + 5, [['LAVADO 30\'', '3.500'], ['SECADO', '2.500'], ['PLANCHADO', '1.000']], { tiza: false });
  }
  // la fila de lavadoras al fondo
  const lav = [];
  const LAV = narrow ? LAVADORA_CH : LAVADORA;
  const lw = LAV[0].length;
  const ly = b.y1 - LAV.length + 1;
  const nl = Math.floor((L.w - 1) / (lw + 1));
  const lx0 = Math.round(ctx.vx - (nl * (lw + 1)) / 2);
  for (let i = 0; i < nl; i++) {
    const x = lx0 + i * (lw + 1);
    ctx.lines(x, ly, LAV);
    lav.push({ x, y: ly, on: hash2(i, ctx.seed) < 0.75, k: i });
  }
  // secadoras encima (las de los costados, para no pisar el título)
  const sec = [];
  const SECA = [' _______ ', '|  ( )  |', '|_______|'];
  const sy = ly - (narrow ? 3 : 4);
  for (let i = 0; i < nl; i++) {
    const x = lx0 + i * (lw + 1);
    if (ctx.pisaTitulo(x, x + lw, sy, sy + 2)) continue;
    if (sy < L.alto[0] + (narrow ? 0 : 7) && !narrow && x > L.x1 - 24) continue;
    ctx.lines(x, sy, SECA);
    sec.push({ x, y: sy });
  }
  // los tambores giran, la espuma sube y el tiempo corre
  ctx.anim(ctx.Z, (out, t) => {
    const k = Math.floor(t * 6);
    for (const l of lav) {
      if (!l.on) {
        out.text(l.x + 2, l.y + (narrow ? 2 : 3), narrow ? '   ' : '     ');
        continue;
      }
      const ROPA = ['~o~-°', 'o~-°~', '~-°~o', '-°~o~', '°~o~-'];
      const mins = 30 - (Math.floor(t / 2 + l.k * 7) % 30);
      if (narrow) {
        out.text(l.x + 2, l.y + 2, ROPA[(k + l.k) % ROPA.length].slice(0, 3));
        out.text(l.x + 4, l.y + 1, String(mins).padStart(2, '0'));
        continue;
      }
      out.text(l.x + 2, l.y + 3, ROPA[(k + l.k) % ROPA.length]);
      if ((k + l.k) % 5 === 0) out.text(l.x + 3, l.y + 2, 'o°o');
      out.text(l.x + 5, l.y + 1, String(mins).padStart(2, '0'));
      out.put(l.x + 1, l.y + 1, Math.floor(t * 2 + l.k) % 2 ? '·' : 'o');
    }
    for (const s of sec) out.text(s.x + 3, s.y + 1, ['(o )', '( o)', '(  o', '( o)'][(k + s.x) % 4].slice(0, 3));
  });
  // afiche de burbujas y la máquina de jabón en la pared izquierda
  cuadroLado(ctx, -1, 1.3, narrow ? 1.5 : 1.65, rows * 0.1, rows * 0.36, (c, r, u, v) => (v < 0.25 ? (c % 3 === 0 ? 'o' : c % 3 === 1 ? '°' : 0) : v < 0.45 ? 'O' : v < 0.7 ? (c % 2 ? '~' : 0) : '='));
  cuadroLado(ctx, -1, 1.1, 1.24, rows * 0.32, rows * 0.66, (c, r, u, v) => (v < 0.3 ? (c % 2 ? 'o' : '·') : v < 0.5 ? '=' : u > 0.6 ? '[' : 0), { z: 1.1 });
  // la mesa de doblar a la izquierda con ropa doblada
  const tz = ctx.zf(0.4);
  const mt = meson(ctx, cols * 0.04, cols * (narrow ? 0.3 : 0.26), tz, tz + (ctx.Z - 1) * 0.14, rows * 0.17, (c, r) => (r && c % 8 === 0 ? '|' : 0));
  ctx.at(tz, () => {
    for (let x = mt.c0 + 2, i = 0; x + 5 < mt.c1; x += 7, i++) for (let k = 0; k < 2 + (i % 2); k++) ctx.text(x, mt.r0 - 2 - k, k % 2 ? '[~~~]' : '[___]');
  });
  // la que dobla
  const zV = tz + (ctx.Z - 1) * 0.22;
  const Xv = cols * (narrow ? 0.18 : 0.16);
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'delantal', pelo: 'largo' }, poses: [['manos', 2], ['alza', 1, 'paño'], ['manos', 2], ['parado', 1]] });
  // colgador con camisas en la pared derecha
  const rz0 = 1.15;
  const rz1 = narrow ? 1.5 : 1.75;
  const rY = rows * 0.3;
  ctx.at(rz0, () => g.line(room.x(cols, rz0) - 2, room.y(rY, rz0), room.x(cols, rz1) - 2, room.y(rY, rz1)));
  const camisas = [];
  for (let z = rz0 + 0.04; z < rz1; z += 0.09) camisas.push({ x: Math.round(room.x(cols, z)) - 4, y: Math.round(room.y(rY, z)) + 1, z });
  ctx.at(rz0, () => {
    for (const c of camisas) ctx.lines(c.x - 1, c.y, [' ? ', '/V\\', '| |', '|_|'], true);
  });
  // banca con alguien leyendo una revista mientras espera
  const bz = ctx.zf(0.16);
  const bX = cols * (narrow ? 0.72 : 0.78);
  const bh = Math.round((rows * 0.12) / bz);
  const bw = Math.round(22 / bz) | 0;
  const BANCA = S([' ' + '_'.repeat(bw - 2) + ' ', '|' + '_'.repeat(bw - 2) + '|', ...Array(Math.max(1, bh - 2)).fill('|' + ' '.repeat(bw - 2) + '|')]);
  const bx = ctx.px(bX, bz) - (bw >> 1);
  const byy = ctx.piso(bz) - BANCA.h;
  ctx.at(bz + 0.01, () => g.blit(BANCA, bx, byy));
  const H = ctx.alto(bz);
  figura(ctx, { X: bX - 3 * bz, z: bz, look: { ropa: 'rayas', cara: 'lentes', sienta: true }, h: H, poses: [['manos', 3], ['toma', 1.2], ['manos', 2.5]], dy: -bh + 2 });
  ctx.anim(bz - 0.001, (out, t) => {
    const k = Math.floor(t / 2.5) % 4;
    const x = ctx.px(bX - 3 * bz, bz) - 3;
    const y = byy - Math.round(H * 0.22);
    out.text(x, y, ['[LUNA]', '[::|:]', '[:|::]', '[LUNA]'][k]);
  });
  // un canasto de ropa en el piso
  const cz = ctx.zf(0.22);
  ctx.at(cz, () => ctx.lines(ctx.px(cols * 0.42, cz) - 4, ctx.piso(cz) - 3, [' ~o~~°~ ', '\\::::::/', ' \\____/ ']));
  clientes(ctx, {
    puntos: [{ X: cols * 0.5, z: ctx.zf(0.3) }],
    periodo: 18,
    dice: ['¿está lista mi ropa?', 'vengo a buscar', '¿a qué hora cierran?', 'con suavizante'],
    responde: ['falta el secado', 'aquí está', 'a las nueve', '¡listo!'],
    vend: { X: Xv, z: zV },
  });
  brillo(ctx, [lampara(ctx, cols * 0.3, 1.3, 'tubo'), lampara(ctx, cols * 0.7, 1.3, 'tubo')]);
  void night;
}

// --- BICICLETAS --------------------------------------------------------------------------------

// Una bicicleta de perfil con ruedas de radio r (filas); devuelve filas y los
// centros de las ruedas.
function bici(r) {
  const rueda = circulo(r);
  const rw = rueda[0].length;
  const gap = Math.max(4, 2 * r);
  const w = rw * 2 + gap;
  const h = rueda.length + 2;
  const g = new Grid(w, h, 0);
  const cy = r + 2;
  const c1 = 2 * r;
  const c2 = rw + gap + 2 * r;
  for (const x0 of [0, rw + gap]) rueda.forEach((l, i) => g.ink(x0, 2 + i, l));
  // el cuadro: pedalier en el hueco, tubo del asiento derecho, tubo de arriba
  // plano hasta la dirección y la horquilla bajando a la maza de adelante
  const pc = rw + (gap >> 1) - 1;
  const ty = cy - r + 1;
  const hc = c2 - r;
  for (let c = c1 + 1; c < pc; c++) g.put(c, cy, '_');
  for (let y = ty; y < cy; y++) g.put(pc, y, '|');
  g.text(pc - 1, ty - 1, '__');
  for (let c = pc + 1; c < hc; c++) g.put(c, ty - 1, '_');
  for (let k = 0; ty + k < cy; k++) g.put(hc + k, ty + k, '\\');
  g.line(hc - 0.5, ty + 0.2, pc + 1, cy + 0.5);
  g.put(hc, ty - 1, '_');
  g.put(hc + 1, ty - 2, '/');
  g.put(c1, cy, 'o');
  g.put(c2, cy, 'o');
  g.put(pc, cy, 'O');
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(String.fromCharCode(...[...g.data.subarray(y * w, (y + 1) * w)].map((v) => v || 32)));
  return { rows, c1, c2, cy, w, h };
}

function bicicletas(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'liso', walls: 'ladrillo', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'BICICLETAS', 'caja');
  // tablero de herramientas
  const TOOLS = [['(_)', ' | ', ' U '], [' |', ' |', '[_]'], ['\\ /', ' X ', '/ \\'], ['.==.', ' || '], ['(=)'], ['_C_', ' | ']];
  const px0 = narrow ? L.x0 + 1 : L.x1 - 26;
  for (let r = L.alto[0]; r <= L.alto[1] + (narrow ? 0 : 4); r++) for (let c = px0; c <= L.x1 - 1; c++) if (!ctx.pisaTitulo(c, c, r, r) && (c + r) % 2 === 0 && r % 2 === 0) g.put(c, r, '·');
  repisas(ctx, px0 + 1, L.x1 - 2, L.alto[0], L.alto[1] + (narrow ? 0 : 4), 5, TOOLS, { gap: 2, tabla: ' ', mensula: false });
  // bicicletas colgadas en el fondo
  const bs = bici(narrow ? 2 : ctx.wide ? 3 : 2);
  const hb = [];
  const bx0 = narrow ? L.x0 + 1 : L.x0 + 2;
  const bx1 = narrow ? L.x1 : px0 - 2;
  for (let x = bx0; x + bs.w <= bx1; x += bs.w + 2) hb.push(x);
  const byTop = narrow ? L.bajo[0] + 1 : L.alto[0];
  hb.forEach((x, i) => {
    const y = byTop + (i % 2) * (narrow ? 0 : 2);
    if (ctx.pisaTitulo(x, x + bs.w, y, y + bs.h)) {
      ctx.lines(x, L.bajo[0] + 1, bs.rows, true);
      return;
    }
    g.put(x + bs.c1, y - 1, '?');
    ctx.lines(x, y, bs.rows, true);
  });
  // neumáticos colgados en la pared derecha
  const nz = [1.2, 1.38, 1.56, 1.74].filter((z) => z < ctx.Z - 0.1);
  ctx.at(1.2, () => {
    for (const z of nz) {
      const x = Math.round(room.x(cols, z)) - 3;
      const y = Math.round(room.y(rows * 0.3, z));
      const ring = circulo(z < 1.45 ? 2 : 1);
      ctx.lines(x - ring[0].length + 2, y, [' '.repeat(ring[0].length >> 1) + '?', ...ring], true);
    }
  });
  repisasLado(ctx, -1, 1.1, narrow ? 1.5 : 1.8, [rows * 0.95, rows * 0.75, rows * 0.55], RELLENO.cajas(ctx));
  // la bici en el atril al centro, con la rueda que gira
  const az = ctx.zf(0.28);
  const big = bici(narrow ? 3 : ctx.wide ? 5 : 4);
  const aX = cols * (narrow ? 0.52 : 0.46);
  const ax = ctx.px(aX, az) - (big.w >> 1);
  const ay = ctx.piso(az) - big.h - Math.round((rows * 0.12) / az);
  ctx.at(az, () => {
    ctx.lines(ax, ay, big.rows, true);
    // el atril
    const sx = ax + (big.w >> 1);
    for (let r = ay + 2; r < ctx.piso(az) - 1; r++) g.put(sx, r, '|');
    ctx.text(sx - 1, ay + 1, '[=]');
    ctx.text(sx - 3, ctx.piso(az) - 1, '_/|\\_');
  });
  const R = narrow ? 3 : ctx.wide ? 5 : 4;
  ctx.anim(az - 0.001, (out, t) => {
    // rayos de la rueda de adelante
    const cx = ax + big.c2;
    const cy = ay + big.cy;
    const sp = t * 3;
    for (let k = 0; k < 3; k++) {
      const th = sp + (k * Math.PI) / 3;
      for (let i = 1; i < R; i++) {
        const c = Math.round(cx + Math.cos(th) * i * 1.8);
        const rr = Math.round(cy + Math.sin(th) * i * 0.85);
        const a = ((((th % Math.PI) + Math.PI) % Math.PI) / Math.PI) * 4;
        out.put(c, rr, ['-', '\\', '|', '/'][Math.floor(a + 0.5) % 4]);
      }
    }
    out.put(cx, cy, 'o');
    // la cadena
    const k = Math.floor(t * 6) % 2;
    for (let c = ax + big.c1 + 1; c < ax + Math.round((big.c1 + big.c2) / 2); c++) out.put(c, cy + 1, (c + k) % 2 ? '·' : '-');
  });
  // el mecánico la hace girar
  const zV = az + (ctx.Z - 1) * 0.08;
  const Xm = aX + big.w * 0.5 * az + 4 * az;
  figura(ctx, { X: Xm, z: zV, look: { ropa: 'delantal', gorro: 'jockey', cara: 'barba' }, poses: [['manos', 2], ['alza', 1.2, 'llave'], ['manos', 2.5], ['parado', 1]] });
  // inflador y aceitera
  const iz = ctx.zf(0.12);
  ctx.at(iz, () => {
    ctx.lines(ctx.px(cols * 0.16, iz), ctx.piso(iz) - 6, [' _T_', '  | ', ' | |', ' | |', ' |_|~~', '[___]']);
    ctx.lines(ctx.px(cols * 0.76, iz), ctx.piso(iz) - 2, [' _/', '[_]']);
  });
  // el gato del taller, sentado junto al inflador
  gato(ctx, ctx.px(cols * 0.22, iz), ctx.piso(iz), iz - 0.002, 'sentado');
  // la radio con música en el mesón de la caja
  const m = planoMeson(ctx, { X0: narrow ? 0.66 : 0.72, X1: narrow ? 0.96 : 0.94, f0: 0.5, cara: 'paneles' });
  ctx.at(m.z0, () => ctx.lines(m.c0 + 1, m.top - 1, [' _/__ ', '[o::o]']));
  ctx.anim(m.z0 - 0.001, (out, t) => notas(out, m.c0 + 3, m.top - 2, t, 2, 5));
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.3 : 0.24), z: ctx.zf(0.2) }],
    periodo: 16,
    dice: ['¿me infla las ruedas?', 'se me cortó la cadena', '¿cuánto el parche?', '¿tiene cámaras?'],
    responde: ['¡al tiro!', 'déjela ahí', 'dos lucas', 'de todas'],
    vend: { X: Xm, z: zV },
  });
  brillo(ctx, [lampara(ctx, cols * 0.3, 1.3, 'campana'), lampara(ctx, cols * 0.7, 1.3, 'campana')]);
  void night;
}

// --- PELUQUERÍA ----------------------------------------------------------------------------------

function peluqueria(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'damero', walls: 'liso', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'PELUQUERÍA', 'doble');
  // afiches de cortes de pelo
  if (!narrow) {
    afiche(ctx, L.x0 + 1, L.cartel - 2, ['  .-.  ', ' (o o) ', ' _)-(_ ', 'CLÁSICO']);
    afiche(ctx, L.x1 - 9, L.cartel - 2, [' ,,,,  ', ' (o o) ', ' _)-(_ ', 'MODERNO']);
  } else {
    afiche(ctx, L.x0 + 2, L.alto[0], [' .-. ', '(o o)', 'CORTE']);
    afiche(ctx, L.x1 - 8, L.alto[0], [',,,, ', '(o o)', 'BARBA']);
    ctx.text(Math.round(ctx.vx) - 4, L.alto[0] + 2, '$ 8.000');
  }
  // productos y un afiche en la pared izquierda
  repisasLado(ctx, -1, 1.35, narrow ? 1.6 : 1.95, [rows * 0.55, rows * 0.42, rows * 0.29], RELLENO.frascos(ctx), { montantes: 2 });
  cuadroLado(ctx, -1, 1.12, 1.28, rows * 0.12, rows * 0.4, (c, r, u, v) => (v < 0.2 ? '_' : v < 0.45 ? (Math.abs(u - 0.5) < 0.3 ? 'o' : 0) : v < 0.7 ? ')' : '='));
  // espejos sobre una repisa con lociones
  const sillas = narrow ? [0.5] : [0.33, 0.67];
  const espejos = [];
  sillas.forEach((fx) => {
    const cx = Math.round(L.x0 + L.w * fx);
    const w = narrow ? 18 : ctx.wide ? 30 : 20;
    const y0 = narrow ? L.bajo[0] : L.alto[0] + 2;
    const y1 = b.y1 - 3;
    const x0 = cx - (w >> 1);
    for (let r = y0; r <= y1; r++) {
      for (let c = x0; c <= x0 + w; c++) {
        if (ctx.pisaTitulo(c, c, r, r)) continue;
        const edge = r === y0 || r === y1 || c === x0 || c === x0 + w;
        g.put(c, r, edge ? (r === y0 ? '_' : r === y1 ? '_' : '|') : (c + r) % 9 === 0 ? '/' : ' ');
      }
    }
    // repisa con frascos y peinetas en desinfectante
    ctx.text(x0 - 1, y1 + 1, '[' + '_'.repeat(w + 1) + ']');
    ctx.ink(x0 + 1, y1, 'n ¡ [EEE] o');
    espejos.push({ cx, y0, y1, x0, w });
  });
  // poste de barbero en la pared derecha, adelante
  const pz0 = 1.1;
  const pz1 = 1.16;
  const pX = Math.round(room.x(cols, (pz0 + pz1) / 2)) - 3;
  const pY0 = Math.round(room.y(rows * 0.28, pz0));
  const pY1 = Math.round(room.y(rows * 0.5, pz0));
  ctx.at(pz0, () => {
    ctx.text(pX - 1, pY0 - 1, ' .-. ');
    ctx.text(pX - 1, pY1 + 1, " `-' ");
  });
  ctx.anim(pz0, (out, t) => {
    const k = Math.floor(t * 6);
    for (let r = pY0; r <= pY1; r++) {
      out.put(pX - 1, r, '(');
      out.put(pX + 3, r, ')');
      for (let i = 0; i < 3; i++) out.put(pX + i, r, (r + i + k) % 3 === 0 ? '/' : ' ');
    }
  });
  // sillones de barbero con clientes de espaldas y su cara en el espejo
  const cz = ctx.zf(0.55);
  const H = ctx.alto(cz);
  sillas.forEach((fx, i) => {
    const e = espejos[i];
    const X = room.vx + (e.cx - room.vx) * cz;
    const sx = ctx.px(X, cz);
    const sw = Math.max(11, Math.round(H * 0.85)) | 1;
    const seat = ctx.piso(cz) - Math.round(H * 0.34);
    const SIL = [];
    SIL.push(' ' + '_'.repeat(sw - 2) + ' ');
    SIL.push('(' + '_'.repeat(sw - 2) + ')');
    SIL.push(' ' + '\\' + ' '.repeat(sw - 4) + '/' + ' ');
    for (let r = seat + 3; r < ctx.piso(cz) - 1; r++) SIL.push(' '.repeat((sw >> 1) - 1) + '| |' + ' '.repeat((sw >> 1) - 1));
    SIL.push(' '.repeat((sw >> 1) - 3) + '(_____)');
    ctx.at(cz + 0.004, () => g.blit(S(SIL), sx - (sw >> 1), seat));
    // el cliente con la capa
    figura(ctx, { X, z: cz + 0.002, look: { cara: 'espalda', ropa: 'abrigo', sienta: 'busto' }, h: H, poses: [['parado', 9]], dy: seat - ctx.piso(cz) + 1, parpadea: false });
    // la capa: un triángulo hasta las rodillas
    ctx.anim(cz + 0.001, (out) => {
      const top = seat - Math.round(H * 0.32);
      for (let r = top, k = 0; r <= seat + 1; r++, k++) {
        const hw = Math.min(sw >> 1, 2 + Math.round(k * 0.9));
        ctx.putZ(out, sx - hw, r, '/', cz + 0.001);
        ctx.putZ(out, sx + hw, r, '\\', cz + 0.001);
        for (let c = sx - hw + 1; c < sx + hw; c++) ctx.putZ(out, c, r, r === seat + 1 ? '_' : (c + r) % 4 === 0 ? ':' : ' ', cz + 0.001);
      }
    });
    // su cara en el espejo
    ctx.anim(ctx.Z, (out, t) => {
      const fy = Math.round((e.y0 + e.y1) / 2) - 1;
      const fc = e.cx;
      if (ctx.pisaTitulo(fc - 3, fc + 3, fy, fy + 2)) return;
      out.text(fc - 2, fy, ' .-. ');
      out.text(fc - 2, fy + 1, hash2(Math.floor(t * 2), i) < 0.1 ? '(- -)' : '(o o)');
      out.text(fc - 2, fy + 2, ' )-( ');
    });
    // el peluquero al lado, con tijeras y peineta
    const bX = X + (i === 0 && !narrow ? -1 : 1) * sw * 0.65 * cz;
    figura(ctx, { X: bX, z: cz - 0.03, look: { ropa: i ? 'bata' : 'delantal', cara: i ? 'bigote' : 'frente', gorro: i ? null : 'moño' }, poses: [['alza', 0.4, 'tijera'], ['alza', 0.4, 'peineta'], ['alza', 0.4, 'tijera'], ['manos', 1.2], ['alza', 0.5, 'tijera'], ['parado', 1]] });
    // pelos que caen
    ctx.anim(cz - 0.04, (out, t) => {
      for (let k = 0; k < 4; k++) {
        const p = ((t * 0.6 + k * 0.27 + i * 0.5) % 1);
        const x = sx + Math.round(Math.sin(t * 3 + k * 2) * 3);
        const y = seat - Math.round(H * 0.45) + Math.floor(p * Math.round(H * 0.8));
        out.put(x, y, p < 0.5 ? ',' : "'");
      }
      // tijeretazo
      if (Math.floor(t * 5) % 2) out.text(sx - 1, seat - Math.round(H * 0.5), '><');
    });
  });
  // pelo en el piso
  ctx.at(cz - 0.05, () => {
    for (let k = 0; k < 14; k++) {
      const c = Math.round(cols * (0.2 + 0.6 * hash2(k, 5)));
      const r = ctx.piso(cz) + 1 + Math.floor(hash2(k, 9) * 4);
      if (g.get(c, r) === SP || g.get(c, r) === 46) g.put(c, r, k % 2 ? ',' : "'");
    }
  });
  // banca de espera a la izquierda con un señor leyendo el diario
  const wz = ctx.zf(0.14);
  const wX = cols * (narrow ? 0.18 : 0.12);
  const wH = ctx.alto(wz);
  const bh = Math.round((rows * 0.13) / wz);
  ctx.at(wz + 0.01, () => {
    const x = ctx.px(wX, wz) - 7;
    const y = ctx.piso(wz) - bh;
    ctx.text(x, y, ' ____________ ');
    ctx.text(x, y + 1, '|____________|');
    for (let r = y + 2; r < ctx.piso(wz); r++) ctx.text(x, r, '||          ||');
  });
  figura(ctx, { X: wX, z: wz, look: { ropa: 'camisa', cara: 'bigote', sienta: true }, h: wH, poses: [['manos', 9]], dy: -bh + 2, parpadea: false });
  ctx.anim(wz - 0.001, (out, t) => {
    const k = Math.floor(t / 3) % 3;
    const x = ctx.px(wX, wz) - 5;
    const y = ctx.piso(wz) - bh - Math.round(wH * 0.42);
    const D = [[' _________ ', '|EL  DIARIO|', '|:::: ::::|', '|:: ::::::|', '¯¯¯¯¯¯¯¯¯¯¯'], [' _________ ', '|DEPORTES |', '|o  ::: ::|', '|:: : ::::|', '¯¯¯¯¯¯¯¯¯¯¯'], [' ____/____ ', '|::: |  ::|', '|::  |::::|', '|:::/:: ::|', '¯¯¯¯¯¯¯¯¯¯¯']][k];
    D.forEach((l, i) => ctx.textZ(out, x, y + i, l, wz - 0.001));
  });
  // la radio con un bolero
  if (!narrow) {
    const rx = espejos[0].x0 + espejos[0].w + 3;
    ctx.lines(rx, b.y1 - 2, [' _/__ ', '[o::o]']);
    ctx.anim(ctx.Z, (out, t) => notas(out, rx + 2, b.y1 - 3, t, 2, 5));
  }
  clientes(ctx, {
    puntos: [{ X: cols * 0.5, z: ctx.zf(0.22) }],
    periodo: 18,
    dice: ['¿hay que esperar?', 'el corte de siempre', 'sólo las puntas', '¿y la barba?'],
    responde: ['dos antes que usted', 'tome asiento', '¡como nuevo!', 'también'],
    vend: { X: room.vx, z: cz },
  });
  ventilador(ctx, cols * 0.5, 1.4);
  brillo(ctx, [lampara(ctx, cols * 0.25, 1.25, 'globo'), lampara(ctx, cols * 0.75, 1.25, 'globo')]);
  void night;
}

// --- FERRETERÍA -----------------------------------------------------------------------------------

const HERR = [
  ['.==.', ' || ', ' || '],
  [' Ü', ' |', ' |', ' U'],
  ['\\ /', ' X ', '/ \\'],
  [' |', ' |', '[_]'],
  ['(=)'],
  ['|||', '|_|', ' | '],
  ['______', '\\/\\/\\|'],
  ['O O', ' X ', '/ \\'],
];

function ferreteria(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'baldosa', walls: 'puntos', back: 'puntos', ceiling: 'liso', seed: ctx.seed });
  ctx.clear(L.x0, b.y0, L.x1, L.cartel + 1);
  letrero(ctx, ctx.vx, L.cartel, 'FERRETERÍA', 'caja');
  // tablero perforado con herramientas colgadas
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1 - 4, 5, HERR, { gap: 2, tabla: ' ', mensula: false });
  // tarros de pintura apilados abajo
  for (let x = L.x0 + 1; x + 5 <= L.x1; x += 6) {
    if (hash2(x, 1) < 0.3) continue;
    ctx.text(x, b.y1 - 1, ' ___ ');
    ctx.text(x, b.y1, '[PIN]');
  }
  // pared izquierda: cajonera de tornillos; derecha: rollos y latas
  cuadroLado(ctx, -1, 1.1, narrow ? 1.5 : 1.9, rows * 0.25, rows * 0.97, (c, r, u, v) => (Math.floor(v * 12) % 2 === 0 && (v * 12) % 1 < 0.25 ? '_' : c % 3 === 0 ? '|' : (r + c) % 5 === 0 ? '·' : 0));
  repisasLado(ctx, 1, 1.3, narrow ? 1.6 : 2.0, [rows * 0.95, rows * 0.75, rows * 0.55, rows * 0.35], RELLENO.latas(ctx));
  // escalera apoyada en la pared derecha, adelante
  const ez = 1.12;
  const ex = Math.round(room.x(cols, ez)) - 7;
  const ey0 = Math.round(room.y(rows * 0.2, ez));
  const ey1 = ctx.piso(ez);
  ctx.at(ez, () => {
    for (let r = ey0; r < ey1; r++) {
      g.put(ex, r, '|');
      g.put(ex + 4, r, '|');
      if ((r - ey0) % 3 === 0) ctx.text(ex + 1, r, '___');
    }
  });
  // cadenas que cuelgan del techo y se mecen
  const cads = narrow ? [0.4] : [0.36, 0.42, 0.62];
  cads.forEach((fx, i) => {
    const z = 1.3;
    const x = Math.round(room.x(cols * fx, z));
    const y0 = Math.ceil(room.ceilY(z));
    const len = 5 + i * 2;
    ctx.anim(z, (out, t) => {
      for (let k = 0; k < len; k++) {
        const sw = Math.round(Math.sin(t * 1.2 + i) * (k / len) * 1.5);
        out.put(x + sw, y0 + k, k % 2 ? '8' : 'o');
      }
    });
  });
  // el mesón con la máquina de copiar llaves
  const m = planoMeson(ctx, { X0: narrow ? 0.06 : 0.16, X1: narrow ? 0.94 : 0.84, f0: 0.34, cara: 'tablas' });
  const kx = m.c0 + 3;
  ctx.at(m.z0, () => {
    ctx.lines(kx, m.top - 3, ['  ____  ', ' |(o)=|-', ' |____| ', '[______]']);
    ctx.text(Math.round((m.c0 + m.c1) / 2) - 3, m.top, '[clavos]');
    if (!narrow) ctx.lines(m.c1 - 10, m.top - 3, [' ______ ', '|[0000]|', '|_::::_|', '/______\\']);
  });
  ctx.anim(m.z0 - 0.001, (out, t) => {
    // chispas cuando corta
    if (Math.floor(t / 2) % 3 === 2) return;
    for (let k = 0; k < 5; k++) {
      const p = (t * 3 + k / 5) % 1;
      out.put(kx + 8 + Math.round(p * 4), m.top - 2 - Math.round(Math.sin(p * Math.PI) * 2) + (k % 2), p < 0.5 ? '*' : "'");
    }
    out.put(kx + 3, m.top - 2, ['o', 'O'][Math.floor(t * 12) % 2]);
  });
  const zV = ctx.zf(0.58);
  const Xv = room.vx + (kx + 12 - room.vx) * zV;
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'delantal', gorro: 'jockey', cara: 'bigote' }, poses: [['manos', 3], ['parado', 1.5], ['alza', 1, 'llave'], ['manos', 2]] });
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.6, z: ctx.zf(0.2) }] : [{ X: cols * 0.58, z: ctx.zf(0.2) }],
    periodo: 16,
    dice: ['tornillos de 1/2', '¿me copia esta llave?', 'un tarro de esmalte', '¿tiene tarugos?'],
    responde: ['¿cruz o paleta?', 'son dos lucas', '¿qué color?', 'de los dos tipos'],
    vend: { X: Xv, z: zV },
  });
  relojPared(ctx, narrow ? L.x1 - 6 : L.x1 - 8, L.cartel);
  brillo(ctx, [lampara(ctx, cols * 0.3, 1.3, 'tubo'), lampara(ctx, cols * 0.7, 1.3, 'tubo')]);
  void night;
}

export const OFICIOS = {
  RELOJERÍA: relojeria,
  LAVANDERÍA: lavanderia,
  BICICLETAS: bicicletas,
  PELUQUERÍA: peluqueria,
  FERRETERÍA: ferreteria,
};
