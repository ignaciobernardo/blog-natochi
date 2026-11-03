// Tiendas: frutería, farmacia, flores, libros, discos, almacén, botillería,
// zapatos y mercería.
import {
  S, SP, hash2, clamp, persona,
  planoMeson, meson, letrero, pizarraEn, repisa, repisas, repisasLado, RELLENO, ventanaLado, puertaLado,
  lampara, brillo, ventilador, vapor, notas, relojPared, figura, clientes, cola, gato, mosca,
  lucesAnim, afiche, cuadroLado, CORDILLERA, tele, mesaGente, bocadillo, zCol,
} from './local-kit.js';


// --- FRUTERÍA ---------------------------------------------------------------------------

const FRUTAS = [
  { n: 'PALTA', f: '()()()', p: '3.990' },
  { n: 'TOMATE', f: 'oOoOoO', p: '1.290' },
  { n: 'PLÁTANO', f: ')))))', p: '1.490' },
  { n: 'NARANJA', f: '(·)(·)', p: '990' },
  { n: 'MANZANA', f: 'ò ó ò ', p: '1.190' },
  { n: 'UVA', f: '°°°°°°', p: '2.490' },
  { n: 'LIMÓN', f: '<><><>', p: '1.590' },
  { n: 'PAPAS', f: 'ooOooO', p: '890' },
];

function fruteria(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'baldosa', walls: 'puntos', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'FRUTERÍA', 'colgante');
  // cajones con fruta en la pared del fondo
  const caj = [['[ooo]'], ['[)))]'], ['[°°°]'], ['[()()]'], ['[<><>]'], ['[OoO]']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0] + 1, b.y1 - 1, 3, caj, { gap: 0 });
  // sacos de papas y cebollas abajo
  if (!narrow) {
    ctx.lines(L.x0 + 2, b.y1 - 2, ['.______.', '(PAPAS )', '(______)']);
    ctx.lines(L.x1 - 10, b.y1 - 2, ['.______.', '(CEBOLL)', '(______)']);
  }
  // pared izquierda: cajones apilados con fruta
  repisasLado(ctx, -1, 1.1, narrow ? 1.5 : 1.85, [rows * 0.95, rows * 0.8, rows * 0.65, rows * 0.5, rows * 0.35], (c, k, i, n) => {
    if (i === 0) return '_';
    if (i === n - 1) return c % 3 ? '¯' : '|';
    const ch = ['o', ')', '°', 'O'][k % 4];
    return (c + i) % 2 ? ch : ' ';
  });
  ventanaLado(ctx, 1, 1.1, 1.5, rows * 0.18, rows * 0.55, { letras: 'FRUTAS Y VERDURAS' });
  // el mesón al fondo, con la balanza de aguja
  const m = planoMeson(ctx, { X0: narrow ? 0.1 : 0.3, X1: narrow ? 0.9 : 0.72, f0: 0.46, cara: 'tablas' });
  const bx = m.c1 - 12;
  ctx.at(m.z0, () => {
    ctx.lines(bx, m.top - 4, ['  .---.  ', ' ( \\|/ ) ', "  `---'  ", ' ___|___ ', '[_______]'].slice(0, 5));
    ctx.text(m.c0 + 2, m.top, '[bolsas]');
  });
  // aguja de la balanza
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t / 5) % 4;
    out.text(bx + 3, m.top - 3, ['\\  ', ' | ', '  /', ' | '][k].replace(/ /g, ' '));
  });
  // puestos de fruta adelante, en gradas, con sus precios
  const puestos = narrow ? [{ X: 0.18, z: 0.12 }, { X: 0.82, z: 0.12 }] : [{ X: 0.17, z: 0.1 }, { X: 0.36, z: 0.24 }, { X: 0.65, z: 0.24 }, { X: 0.84, z: 0.1 }];
  puestos.forEach((p, i) => {
    const z = ctx.zf(p.z);
    const fr = FRUTAS[(i + ctx.seed) % FRUTAS.length];
    const w = (narrow ? 8 : 12) * z;
    const H = rows * 0.12;
    const box = meson(ctx, cols * p.X - w, cols * p.X + w, z, z + (ctx.Z - 1) * 0.08, H, (c, r) => (r === 0 ? 0 : c % 4 === 0 ? '|' : r % 2 ? '_' : 0));
    ctx.at(z, () => {
      const ww = box.c1 - box.c0 - 1;
      const fill = fr.f.repeat(Math.ceil(ww / fr.f.length)).slice(0, ww);
      ctx.text(box.c0 + 1, box.r0 - 2, fill);
      ctx.text(box.c0 + 2, box.r0 - 3, fill.slice(1, -1).replace(/[^ ]/g, (ch, k) => (k % 2 ? ch : ' ')));
      // el precio en un palito
      const tag = `${fr.n} $${fr.p}`;
      const tx = Math.round((box.c0 + box.c1) / 2 - tag.length / 2);
      ctx.text(tx - 1, box.r0 - 6, ' ' + tag + ' ');
      ctx.text(tx, box.r0 - 5, '¯'.repeat(tag.length));
      g.put(tx + (tag.length >> 1), box.r0 - 4, '|');
    });
  });
  // racimo de plátanos colgando que se mece
  const zb = 1.35;
  const xb = Math.round(room.x(cols * (narrow ? 0.5 : 0.45), zb));
  const yb = Math.ceil(room.ceilY(zb));
  ctx.anim(zb, (out, t) => {
    const sw = Math.round(Math.sin(t * 1.3) * 1.2);
    for (let r = yb; r < yb + 3; r++) out.put(xb + (r - yb > 1 ? sw : 0), r, '|');
    out.text(xb - 2 + sw, yb + 3, ')))))');
    out.text(xb - 1 + sw, yb + 4, ')))');
  });
  // el casero
  const zV = ctx.zf(0.64);
  const Xv = cols * 0.46;
  figura(ctx, { X: Xv, z: zV, look: { gorro: 'jockey', ropa: 'delantal', cara: 'bigote' }, poses: [['parado', 2], ['manos', 2.5], ['saluda', 0.8], ['alza', 1.2]] });
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.5, z: ctx.zf(0.32) }] : [{ X: cols * 0.5, z: ctx.zf(0.34) }],
    periodo: 15,
    dice: ['¿a cómo la palta?', 'un kilo de tomates', '¿están dulces?', 'medio de uvas'],
    responde: ['a luca, casera', '¡pruebe no más!', 'de la mañana', 'son $1.290'],
    vend: { X: Xv, z: zV },
  });
  mosca(ctx, Math.round(cols * 0.3), Math.round(rows * 0.55), Math.round(cols * 0.45), Math.round(rows * 0.7), 1.2);
  mosca(ctx, Math.round(cols * 0.6), Math.round(rows * 0.5), Math.round(cols * 0.75), Math.round(rows * 0.62), 1.2);
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'ampolleta'), lampara(ctx, cols * 0.7, 1.3, 'ampolleta')];
  brillo(ctx, lamps);
  void night;
}

// --- FARMACIA ---------------------------------------------------------------------------

function farmacia(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'baldosa', walls: 'liso', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  // cruz verde a la izquierda del letrero
  letrero(ctx, ctx.vx + (narrow ? 0 : 4), L.cartel, 'FARMACIA', 'caja');
  const cx = narrow ? L.x0 + 2 : Math.round(ctx.vx) - 16;
  const CRUZ = ['  ___  ', ' _| |_ ', '|_ + _|', '  |_|  '];
  if (!narrow) ctx.lines(cx, L.cartel - 2, CRUZ);
  // repisas de remedios en todo el fondo
  const REM = [['[+]'], ['[]'], ['|Rx|'], ['(o)'], ['[::]'], ['¡!'], ['[=]'], ['n', '[]']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 3, REM, { gap: 1 });
  // paredes con repisas de cajas
  repisasLado(ctx, -1, 1.1, narrow ? 1.5 : 1.95, [rows * 0.95, rows * 0.8, rows * 0.65, rows * 0.5, rows * 0.35, rows * 0.2], RELLENO.cajas(ctx));
  repisasLado(ctx, 1, 1.35, narrow ? 1.6 : 2.0, [rows * 0.95, rows * 0.8, rows * 0.65, rows * 0.5, rows * 0.35, rows * 0.2], RELLENO.cajas(ctx));
  // el mesón de vidrio
  const m = planoMeson(ctx, {
    X0: narrow ? 0.06 : 0.14,
    X1: narrow ? 0.94 : 0.86,
    f0: 0.32,
    cara: (c, r) => (r === 0 ? 0 : r === 1 ? (c % 9 === 4 ? '/' : 0) : r === 2 ? (c % 5 === 0 ? '[' : c % 5 === 2 ? ']' : 0) : r === 3 ? '_' : c % 14 === 0 ? '|' : 0),
  });
  ctx.at(m.z0, () => {
    // el turnero y la caja
    ctx.lines(m.c1 - 14, m.top - 3, [' ________ ', '|ATENDEMOS|', '|  N°    |', '¯¯¯¯¯¯¯¯¯¯']);
    ctx.lines(m.c0 + 2, m.top - 2, [' ___ ', '|[o]|', '|___|']);
    ctx.text(m.c0 + 9, m.top, '(·)[+]');
  });
  // pesa de farmacia en la esquina (de pie, con su visor)
  const pz = ctx.zf(0.2);
  const pX = cols * (narrow ? 0.88 : 0.92);
  const PESA = S([' ____ ', '|KG  |', '|____|', '  ||  ', '  ||  ', ' _||_ ', '[____]']);
  const px = ctx.px(pX, pz) - 3;
  const py = ctx.piso(pz) - PESA.h;
  ctx.at(pz, () => g.blit(PESA, px, py));
  // números del turnero y del visor de la pesa
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const n = 40 + Math.floor((t + ctx.seed) / 7) % 60;
    out.text(m.c1 - 9, m.top - 1, String(n).padStart(2, '0'));
    if (night && Math.floor(t * 2) % 2) out.put(m.c1 - 6, m.top - 1, '·');
  });
  // la cruz titila
  if (!narrow)
    ctx.anim(ctx.Z, (out, t) => {
      const on = night ? Math.floor(t * 2) % 4 !== 0 : Math.floor(t) % 6 !== 0;
      out.put(cx + 3, L.cartel, on ? '+' : ' ');
      if (night && on) {
        out.put(cx - 1, L.cartel, '*');
        out.put(cx + 7, L.cartel, '*');
      }
    });
  // un niño que se sube a la pesa
  ctx.anim(pz - 0.01, (out, t) => {
    const u = t % 12;
    out.text(px + 3, py + 1, u > 4 && u < 9 ? String(20 + Math.floor(hash2(Math.floor(t / 12), 1) * 18)) : '00');
    if (u < 4 || u > 9) return;
    const s = persona(Math.round(ctx.alto(pz) * 0.6), { ropa: 'polera', cara: 'feliz', pose: u < 5 ? 'pasoA' : 'parado' });
    ctx.blitZ(out, s, ctx.px(pX - 4 * pz, pz) - s.cx - 1, py + PESA.h - 1 - s.h, pz - 0.01);
  });
  // la farmacéutica y el vendedor
  const zV = ctx.zf(0.6);
  const Xq = cols * 0.38;
  figura(ctx, { X: Xq, z: zV, look: { ropa: 'bata', cara: 'lentes', pelo: 'largo' }, poses: [['parado', 3], ['manos', 2], ['alza', 1], ['parado', 2]] });
  if (!narrow) figura(ctx, { X: cols * 0.6, z: zV + 0.04, look: { ropa: 'bata', cara: 'espalda' }, poses: [['alza', 1.5], ['parado', 2], ['manos', 2]] });
  // la fila
  cola(ctx, {
    slots: narrow ? [{ X: cols * 0.36, z: ctx.zf(0.18) }, { X: cols * 0.24, z: ctx.zf(0.06) }] : [{ X: cols * 0.38, z: ctx.zf(0.18) }, { X: cols * 0.28, z: ctx.zf(0.1) }, { X: cols * 0.18, z: ctx.zf(0.03) }],
    periodo: 10,
    dice: ['¿tiene paracetamol?', 'vengo con receta', 'algo pa la tos', '¿el genérico?'],
    responde: ['¿de 500?', 'déjeme ver', 'este es bueno', 'sí, más barato'],
    vend: { X: Xq, z: zV },
  });
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'tubo'), lampara(ctx, cols * 0.7, 1.3, 'tubo')];
  brillo(ctx, lamps);
  void b;
}

// --- FLORES ------------------------------------------------------------------------------

const RAMO = ['*', 'o', '°', 'w', 'Y', 'v', 'Ø'];

// un balde con flores de ancho w: devuelve filas (las flores arriba)
function balde(w, k) {
  const fl = RAMO[k % RAMO.length];
  const fl2 = RAMO[(k + 3) % RAMO.length];
  let t1 = '';
  let t2 = '';
  let mid = '';
  for (let i = 0; i < w; i++) {
    t1 += i % 2 ? fl : ' ';
    t2 += i % 2 ? ' ' : fl2;
    mid += i % 3 === 0 ? '\\' : i % 3 === 1 ? '|' : '/';
  }
  return [t1, t2, mid, '\\' + '_'.repeat(w - 2) + '/'];
}

function flores(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'tablas', walls: 'papel', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'FLORES', 'pintado');
  ctx.text(Math.round(ctx.vx) - 9, L.cartel, '*');
  ctx.text(Math.round(ctx.vx) + 9, L.cartel, '*');
  // maceteros en repisas al fondo
  const MAC = [['\\|/', '|_|'], [' * ', '\\|/', '(_)'], ['(\\|/)', ' |_| '], ['o o', '\\|/', '[_]'], ['.v.', '(_)']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 4, MAC, { gap: 1 });
  // repisas de maceteros en la pared izquierda
  repisasLado(ctx, -1, 1.1, narrow ? 1.5 : 1.9, [rows * 0.9, rows * 0.7, rows * 0.5, rows * 0.3], (c, k, i) => {
    const m = c % 3;
    if (i === 0) return m === 0 ? '\\' : m === 1 ? '_' : '/';
    if (i === 1) return m === 1 ? '|' : 0;
    if (i === 2) return m === 1 ? RAMO[(c + k) % RAMO.length] : m === 0 ? '\\' : '/';
    return 0;
  });
  ventanaLado(ctx, 1, 1.1, 1.5, rows * 0.18, rows * 0.58, { letras: 'FLORES' });
  // el mesón con papel de envolver
  const m = planoMeson(ctx, { X0: narrow ? 0.2 : 0.34, X1: narrow ? 0.9 : 0.76, f0: 0.44, cara: 'tablas' });
  ctx.at(m.z0, () => {
    ctx.text(m.c0 + 2, m.top, '[≡]'.replace('≡', '='));
    ctx.text(m.c1 - 8, m.top, '><  ~~');
    ctx.lines(m.c0 + 6, m.top - 1, ['_____', '|___|']);
  });
  // gradas de baldes adelante, a los costados
  const gradas = narrow ? [{ X: 0.12, z: 0.1, w: 12 }] : [{ X: 0.14, z: 0.08, w: 20 }, { X: 0.86, z: 0.08, w: 20 }, { X: 0.25, z: 0.3, w: 14 }];
  const bals = [];
  gradas.forEach((p, i) => {
    const z = ctx.zf(p.z);
    const wf = p.w * z;
    // dos escalones
    for (let k = 0; k < 2; k++) {
      const zz = z + k * (ctx.Z - 1) * 0.06;
      const H = rows * (0.08 + k * 0.08);
      const bx = meson(ctx, cols * p.X - wf / 2, cols * p.X + wf / 2, zz, zz + (ctx.Z - 1) * 0.05, H, (c, r) => (r && c % 5 === 0 ? '|' : 0));
      ctx.at(zz, () => {
        for (let x = bx.c0 + 1; x + 5 <= bx.c1; x += 5) {
          const rowsB = balde(5, x + k + i);
          ctx.lines(x, bx.r0 - 1 - rowsB.length, rowsB, true);
          bals.push({ x, y: bx.r0 - 1 - rowsB.length, z: zz });
        }
      });
    }
  });
  // las flores se mecen
  ctx.anim(1.01, (out, t) => {
    for (let i = 0; i < bals.length; i++) {
      const p = bals[i];
      if (hash2(i, Math.floor(t * 1.5)) < 0.7) continue;
      const c = out.get(p.x + 1, p.y);
      if (c !== 32) {
        out.put(p.x + 1, p.y, ' ');
        out.put(p.x + 2, p.y, c);
      }
    }
  });
  // plantas colgantes que sueltan pétalos
  const colg = narrow ? [0.5] : [0.38, 0.62, 0.82];
  colg.forEach((fx, i) => {
    const z = 1.3 + i * 0.05;
    const x = Math.round(room.x(cols * fx, z));
    const y = Math.ceil(room.ceilY(z));
    ctx.at(z, () => ctx.lines(x - 2, y, ['  |  ', '  |  ', ' _|_ ', ' \\_/ ', '(\\|/)', ' )|( ', '  (  '], true));
    ctx.anim(z, (out, t) => {
      const p = ((t * 0.25 + i * 0.37) % 1);
      const yy = y + 7 + Math.floor(p * rows * 0.4);
      out.put(x + Math.round(Math.sin(t * 2 + i) * 2), yy, p < 0.5 ? '°' : ',');
    });
  });
  // la florista arma un ramo
  const zV = ctx.zf(0.66);
  const Xv = cols * 0.55;
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'delantal', pelo: 'largo', cara: 'feliz' }, poses: [['manos', 2.5], ['alza', 1.4], ['manos', 1.5], ['parado', 1.5]], h: null });
  ctx.anim(m.z0 - 0.002, (out, t) => {
    const k = Math.floor(t / 1.5) % 4;
    const x = Math.round((m.c0 + m.c1) / 2) - 2;
    out.text(x, m.top - 2, ['     ', ' *o* ', '*o*°*', '*o*°*'][k]);
    out.text(x, m.top - 1, ['     ', ' \\|/ ', '\\\\|//', '\\¯¯¯/'][k]);
    out.text(x, m.top, ['_____', ' \\_/ ', ' \\_/ ', ' \\_/ '][k]);
  });
  // una abeja
  mosca(ctx, Math.round(cols * 0.08), Math.round(rows * 0.55), Math.round(cols * 0.3), Math.round(rows * 0.72), 1.05);
  // regadera en el piso
  const rz = ctx.zf(0.2);
  ctx.at(rz, () => ctx.lines(ctx.px(cols * 0.55, rz), ctx.piso(rz) - 2, ['  ___', '=(___)']));
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.55, z: ctx.zf(0.3) }] : [{ X: cols * 0.48, z: ctx.zf(0.28) }],
    periodo: 15,
    dice: ['¿tiene rosas?', 'un ramo, porfa', 'para mi mamá', '¿y claveles?'],
    responde: ['¡las más lindas!', '¿con papel?', 'qué lindo', 'recién llegados'],
    vend: { X: Xv, z: zV },
  });
  if (night) brillo(ctx, [lampara(ctx, cols * 0.5, 1.3, 'globo')]);
}

// --- LIBROS -----------------------------------------------------------------------------

function libros(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'tablas', walls: 'liso', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  // libreros en las dos paredes, del piso al techo
  const Ys = [];
  for (let k = 0; k <= 7; k++) Ys.push(rows * (0.98 - k * 0.12));
  repisasLado(ctx, -1, 1.06, ctx.Z - 0.02, Ys, RELLENO.libros(ctx), { montantes: 5 });
  repisasLado(ctx, 1, 1.06, ctx.Z - 0.02, Ys, RELLENO.libros(ctx), { montantes: 5 });
  // librero del fondo
  const LIB = [['|||:|'], ['|:||'], ['||/'], ['|[]|'], ['||||:|'], ['\\\\|'], ['|::|']];
  ctx.clear(L.x0, b.y0, L.x1, L.cartel + 1);
  letrero(ctx, ctx.vx, L.cartel, 'LIBROS', 'caja');
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 3, LIB, { gap: 0 });
  // escalera apoyada en el librero de la izquierda
  const ez = narrow ? 1.25 : 1.4;
  const ex = Math.round(room.x(0, ez)) + 2;
  const ey0 = Math.round(room.y(rows * 0.15, ez));
  const ey1 = ctx.piso(ez);
  ctx.at(ez, () => {
    for (let r = ey0; r < ey1; r++) {
      const k = (r - ey0) / (ey1 - ey0);
      const off = Math.round(k * 4);
      g.put(ex + off, r, '\\');
      g.put(ex + off + 4, r, '\\');
      if ((r - ey0) % 3 === 0) for (let c = ex + off + 1; c < ex + off + 4; c++) g.put(c, r, '_');
    }
  });
  // mesa de novedades al centro
  const nz = ctx.zf(0.22);
  const nb = meson(ctx, cols * (narrow ? 0.3 : 0.38), cols * (narrow ? 0.7 : 0.62), nz, nz + (ctx.Z - 1) * 0.1, rows * 0.14, (c, r) => (r && c % 7 === 0 ? '|' : 0));
  ctx.at(nz, () => {
    const pilas = ['|_|', '[_]', '|=|', '[_]', '|:|'];
    for (let x = nb.c0 + 2, i = 0; x + 3 < nb.c1; x += 5, i++) {
      const h = 1 + ((i * 3 + ctx.seed) % 3);
      for (let k = 0; k < h; k++) ctx.text(x, nb.r0 - 2 - k, pilas[(i + k) % pilas.length]);
    }
    const tag = ' NOVEDADES ';
    ctx.text(Math.round((nb.c0 + nb.c1) / 2 - tag.length / 2), nb.r0 + 1, tag);
  });
  // el sillón con un lector a la derecha
  const sz = ctx.zf(narrow ? 0.5 : 0.42);
  const sX = cols * (narrow ? 0.72 : 0.78);
  const sH = ctx.alto(sz);
  const sw = Math.max(9, Math.round(sH * 0.8)) | 1;
  const SILLON = [' ' + '_'.repeat(sw - 2) + ' ', '|' + ' '.repeat(sw - 2) + '|'];
  for (let i = 0; i < Math.round(sH * 0.28); i++) SILLON.push('|' + ' '.repeat(sw - 2) + '|');
  SILLON.push('(' + '_'.repeat(sw - 2) + ')');
  SILLON.push('|' + '_'.repeat(sw - 2) + '|');
  SILLON.push(' ¨' + ' '.repeat(sw - 4) + '¨ ');
  const sil = S(SILLON);
  const sx = ctx.px(sX, sz) - (sw >> 1);
  const sy = ctx.piso(sz) - sil.h;
  ctx.at(sz + 0.02, () => g.blit(sil, sx, sy));
  figura(ctx, { X: sX, z: sz + 0.01, look: { ropa: 'abrigo', cara: 'lentes', sienta: 'busto' }, h: sH, poses: [['manos', 3.5], ['toma', 1], ['manos', 3]], dy: sy + sil.h - 3 - ctx.piso(sz) + 1 });
  // el libro abierto que pasa páginas
  ctx.anim(sz, (out, t) => {
    const k = Math.floor(t * 0.5) % 6;
    const x = sx + (sw >> 1) - 2;
    const y = sy + sil.h - 5;
    out.text(x, y, k === 5 ? '_\\|_' : '_|/_'.replace('|/', k % 2 ? '|_' : '_|'));
  });
  // lámpara de pie verde junto al sillón
  ctx.at(sz + 0.02, () => ctx.lines(sx + sw, sy - 4, [' __ ', '(_ \\', '   |', '   |', '   |', '   |', '  _|_'].slice(0, Math.min(7, sil.h + 4)), true));
  // el gato durmiendo sobre una pila de libros
  const gz = nz;
  gato(ctx, nb.c1 - 10, nb.r0 - 3, gz - 0.001, 'echado');
  // la librera detrás de un mesón chico
  const m = planoMeson(ctx, { X0: narrow ? 0.08 : 0.16, X1: narrow ? 0.4 : 0.34, f0: 0.5, cara: 'paneles' });
  ctx.at(m.z0, () => ctx.text(m.c0 + 2, m.top, '[$] |=|'));
  const zV = ctx.zf(0.66);
  const Xv = cols * (narrow ? 0.24 : 0.25);
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'abrigo', cara: 'lentes', pelo: 'largo' }, poses: [['parado', 3], ['alza', 1, 'libro'], ['manos', 2.5]] });
  // alguien que hojea frente al librero de la derecha
  const hz = ctx.zf(0.3);
  figura(ctx, { X: cols * (narrow ? 0.84 : 0.9), z: hz, look: { ropa: 'rayas', cara: 'espalda', gorro: 'boina' }, poses: [['parado', 2], ['alza', 1.6], ['manos', 3]] });
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.3 : 0.28), z: ctx.zf(0.36) }],
    periodo: 18,
    dice: ['¿tiene a Neruda?', 'busco uno de cocina', '¿hay usados?', 'éste, porfa'],
    responde: ['al fondo, arriba', 'segunda repisa', '¡muchos!', 'son $8.000'],
    vend: { X: Xv, z: zV },
  });
  // polvo en la luz
  ctx.anim(1.02, (out, t) => {
    for (let k = 0; k < 8; k++) {
      const p = (t * 0.03 + k / 8) % 1;
      const x = Math.round(cols * (0.3 + 0.4 * hash2(k, 2)) + Math.sin(t * 0.4 + k) * 3);
      const y = Math.round(rows * (0.15 + 0.6 * p));
      if (out.get(x, y) === SP) out.put(x, y, '·');
    }
  });
  const lamps = [lampara(ctx, cols * 0.4, 1.3, 'campana'), lampara(ctx, cols * 0.6, 1.3, 'campana')];
  brillo(ctx, lamps);
  void night;
}

// --- DISCOS ---------------------------------------------------------------------------------

const TAPAS = [
  [' ___ ', '|( )|', '|___|'],
  [' ___ ', '|/\\/|', '|___|'],
  [' ___ ', '|~~~|', '|___|'],
  [' ___ ', '|:::|', '|___|'],
  [' ___ ', '|>>>|', '|___|'],
  [' ___ ', '|o.o|', '|___|'],
  [' ___ ', '| ♪ |', '|___|'],
];

function discos(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'damero', walls: 'puntos', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  const sign = letrero(ctx, ctx.vx, L.cartel, 'DISCOS', 'neon');
  lucesAnim(ctx, sign.luces);
  // muro de tapas de discos
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 4, TAPAS, { gap: 1, tabla: '_' });
  // afiches de conciertos en las paredes
  cuadroLado(ctx, -1, 1.12, 1.4, rows * 0.1, rows * 0.42, (c, r, u, v) => (v < 0.2 ? (c % 2 ? '*' : 0) : v < 0.5 ? (Math.abs(u - 0.5) < 0.25 ? 'O' : 0) : v < 0.75 ? '=' : (c + r) % 2 ? ':' : 0));
  cuadroLado(ctx, -1, 1.5, 1.8, rows * 0.12, rows * 0.4, (c, r, u, v) => (v < 0.3 ? '~' : v < 0.6 ? (c % 3 ? '/' : '\\') : 0));
  cuadroLado(ctx, 1, 1.12, 1.4, rows * 0.1, rows * 0.42, (c, r, u, v) => (v < 0.25 ? '♪' : v < 0.7 ? (u > 0.3 && u < 0.7 ? '|' : 0) : '_'));
  // el mesón con la tornamesa y los parlantes
  const m = planoMeson(ctx, { X0: narrow ? 0.1 : 0.5, X1: narrow ? 0.9 : 0.9, f0: 0.4, cara: 'paneles' });
  const tx = m.c0 + 3;
  ctx.at(m.z0, () => {
    ctx.lines(tx, m.top - 2, [' _________ ', '|  .---.  |', '|_( (o) )_|']);
    ctx.lines(m.c1 - 7, m.top - 4, [' ____', '|( )|', '|(o)|', '|___|', '¯¯¯¯¯']);
  });
  // parlantes grandes en el piso del fondo
  const pz = ctx.Z - 0.1;
  const PARL = S([' _____ ', '| (o) |', '|     |', '|( O )|', '|_____|']);
  ctx.at(pz, () => {
    g.blit(PARL, L.x0 + 1, ctx.piso(pz) - PARL.h);
    if (!narrow) g.blit(PARL, Math.round(room.x(cols * 0.42, pz)) - 3, ctx.piso(pz) - PARL.h);
  });
  // bateas de discos en el medio
  const bateas = narrow ? [{ X: 0.3, z: 0.16 }] : [{ X: 0.18, z: 0.14 }, { X: 0.34, z: 0.3 }];
  const TABS = ['ROCK', 'JAZZ', 'CUECA', 'SALSA', 'TANGO', 'CUMBIA', 'BOLERO'];
  const bats = [];
  bateas.forEach((p, i) => {
    const z = ctx.zf(p.z);
    const wf = (narrow ? 16 : 22) * z;
    const bx = meson(ctx, cols * p.X - wf / 2, cols * p.X + wf / 2, z, z + (ctx.Z - 1) * 0.1, rows * 0.16, (c, r) => (r && c % 6 === 0 ? '|' : r === 2 ? '_' : 0));
    ctx.at(z, () => {
      for (let x = bx.c0 + 1; x < bx.c1; x++) g.put(x, bx.r0 - 2, x % 2 ? '|' : '¦');
      const t1 = TABS[(i * 2 + ctx.seed) % TABS.length];
      const t2 = TABS[(i * 2 + 1 + ctx.seed) % TABS.length];
      ctx.text(bx.c0 + 2, bx.r0 - 3, '[' + t1 + ']');
      if (bx.c1 - bx.c0 > 16) ctx.text(bx.c1 - t2.length - 3, bx.r0 - 3, '[' + t2 + ']');
    });
    bats.push({ ...bx, z });
  });
  // la tornamesa gira, los parlantes laten y salen notas
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t * 8) % 4;
    out.text(tx + 3, m.top - 1, ['.---.', '.-·-.', '.---.', '·---.'][k]);
    out.put(tx + 6, m.top, ['o', 'O', 'o', '0'][k] === '0' ? 'o' : ['o', 'O', 'o', 'o'][k]);
    const beat = Math.floor(t * 2.2) % 2;
    out.text(m.c1 - 6, m.top - 2, beat ? '((o))'.slice(1, 4) : '(o)');
    notas(out, m.c1 - 4, m.top - 6, t, 3, 6);
  });
  ctx.anim(pz - 0.001, (out, t) => {
    const beat = Math.floor(t * 2.2) % 2;
    const y = ctx.piso(pz) - PARL.h + 3;
    out.text(L.x0 + 2, y, beat ? '((O))' : '( O )');
    notas(out, L.x0 + 3, y - 4, t + 1.3, 2, 5);
  });
  // el vendedor con audífonos que mueve la cabeza
  const zV = ctx.zf(0.62);
  const Xv = room.vx + (tx + 16 - room.vx) * zV;
  figura(ctx, { X: Xv, z: zV, look: { gorro: 'audifonos', ropa: 'polera', cara: 'cierra' }, poses: [['parado', 0.45], ['manos', 0.45], ['parado', 0.45], ['saluda', 0.45], ['parado', 0.45], ['manos', 1.5]], parpadea: false });
  // alguien que busca en la batea
  const bt = bats[0];
  const hz = bt.z - (ctx.Z - 1) * 0.06;
  const hX = cols * bateas[0].X;
  figura(ctx, { X: hX, z: hz, look: { cara: 'espalda', ropa: 'abrigo', pelo: 'largo' }, poses: [['manos', 1.2], ['parado', 0.8], ['alza', 1, 'disco'], ['manos', 2]] });
  ctx.anim(bt.z - 0.001, (out, t) => {
    // los discos se corren al buscar
    const k = Math.floor(t * 1.5) % (bt.c1 - bt.c0 - 2);
    out.put(bt.c0 + 1 + k, bt.r0 - 2, '/');
  });
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.66 : 0.68), z: ctx.zf(0.26) }],
    periodo: 16,
    dice: ['¿tiene vinilos?', '¿qué está sonando?', 'busco boleros', '¿lo puedo oír?'],
    responde: ['¡un montón!', 'un clásico', 'en esa batea', '¡dele no más!'],
    vend: { X: Xv, z: zV },
  });
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'globo'), lampara(ctx, cols * 0.7, 1.3, 'globo')];
  brillo(ctx, lamps);
  // luces de la bola de espejos de noche
  if (night && !narrow) {
    const bz = 1.4;
    const bx2 = Math.round(room.x(cols * 0.5, bz));
    const by = Math.ceil(room.ceilY(bz));
    ctx.at(bz, () => ctx.lines(bx2 - 1, by, [' | ', ' | ', '(Ø)']));
    ctx.anim(bz, (out, t) => {
      for (let k = 0; k < 10; k++) {
        const a = t * 0.8 + k * 0.63;
        const x = Math.round(bx2 + Math.cos(a) * cols * 0.3);
        const y = Math.round(by + 6 + Math.abs(Math.sin(a * 1.3)) * rows * 0.4);
        if (out.get(x, y) === SP) out.put(x, y, '*');
      }
    });
  }
}

// --- ALMACÉN ----------------------------------------------------------------------------------

function almacen(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'tablas', walls: 'papel', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'ALMACÉN', 'doble');
  // repisas repletas
  const ITEMS = [['[]'], ['(=)'], ['|¯|', '|_|'], ['n', '[]'], ['[::]'], ['¡'], ['(_)'], ['.-.', '|A|'], ['[ARROZ]'], ['[TÉ]']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 3, ITEMS, { gap: 0 });
  // paredes: repisas con latas y frascos
  const Ys = [rows * 0.95, rows * 0.8, rows * 0.65, rows * 0.5, rows * 0.35, rows * 0.2];
  repisasLado(ctx, -1, 1.1, narrow ? 1.6 : 2.1, Ys, RELLENO.latas(ctx));
  repisasLado(ctx, 1, 1.4, narrow ? 1.65 : 2.1, Ys, RELLENO.frascos(ctx));
  // refrigerador de bebidas a la derecha, adelante
  const fz = 1.12;
  cuadroLado(ctx, 1, fz, 1.33, rows * 0.25, rows * 0.97, (c, r, u, v) => (v < 0.1 ? (c % 2 ? '=' : ' ') : u > 0.9 ? '|' : r % 3 === 0 ? '¯' : (c + r) % 2 ? 'o' : '!'), { z: fz });
  // el mesón de madera con frascos de dulces y la caja
  const m = planoMeson(ctx, { X0: narrow ? 0.06 : 0.14, X1: narrow ? 0.94 : 0.8, f0: 0.34, cara: 'tablas' });
  ctx.at(m.z0, () => {
    ctx.lines(m.c0 + 2, m.top - 2, [' _   _   _ ', '(°) (:) (o)', '|_| |_| |_|']);
    ctx.lines(m.c1 - 10, m.top - 3, [' ______ ', '|[0000]|', '|_::::_|', '/______\\']);
    if (!narrow) {
      ctx.lines(Math.round((m.c0 + m.c1) / 2) - 2, m.top - 1, ['\\ooo/', ' ¯¯¯ ']);
      ctx.text(Math.round((m.c0 + m.c1) / 2) + 5, m.top, '[libreta]');
    }
  });
  // el cartel del fiado
  if (!narrow) afiche(ctx, L.x0 + 1, L.cartel - 2, ['HOY NO SE FÍA', 'MAÑANA SÍ']);
  relojPared(ctx, L.x1 - 6, L.cartel);
  // longanizas colgando de una vara
  const lz = 1.45;
  const lx0 = Math.round(room.x(cols * 0.3, lz));
  const lx1 = Math.round(room.x(cols * 0.7, lz));
  const ly = Math.ceil(room.ceilY(lz)) + 2;
  ctx.at(lz, () => {
    g.hline(lx0, lx1, ly, '_');
    g.vline(lx0, Math.ceil(room.ceilY(lz)), ly, '|');
    g.vline(lx1, Math.ceil(room.ceilY(lz)), ly, '|');
  });
  ctx.anim(lz, (out, t) => {
    for (let x = lx0 + 2, i = 0; x < lx1 - 1; x += 3, i++) {
      const sw = Math.round(Math.sin(t * 1.1 + i) * 0.6);
      out.put(x, ly + 1, ')');
      out.put(x + sw, ly + 2, i % 2 ? '(' : ')');
      out.put(x + sw, ly + 3, 'U');
    }
  });
  // la almacenera y el gato en el mesón
  const zV = ctx.zf(0.6);
  const Xv = cols * 0.45;
  figura(ctx, { X: Xv, z: zV, look: { gorro: 'pañuelo', ropa: 'delantal', cara: 'feliz' }, poses: [['parado', 3], ['manos', 2], ['saluda', 0.8], ['alza', 1.2]] });
  gato(ctx, m.c0 + 14, m.top + 1, m.z0 - 0.002, 'lava');
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.42, z: ctx.zf(0.2) }] : [{ X: cols * 0.4, z: ctx.zf(0.2) }, { X: cols * 0.66, z: ctx.zf(0.22) }],
    periodo: 17,
    dice: ['un cuarto de jamón', 'medio de pan y leche', 'anóteme, vecina', '¿tiene cambio?'],
    responde: ['¿algo más?', '¡al tiro!', 'ya, en la libreta', 'sí, mijo'],
    vend: { X: Xv, z: zV },
  });
  mosca(ctx, Math.round(cols * 0.4), Math.round(rows * 0.5), Math.round(cols * 0.6), Math.round(rows * 0.6), 1.3);
  const lamps = [lampara(ctx, cols * 0.5, 1.3, 'ampolleta')];
  brillo(ctx, lamps);
  // de noche el refri brilla
  ctx.anim(fz, (out, t) => {
    if (!night) return;
    const x = Math.round(room.x(cols, fz + 0.12));
    const y = Math.round(room.y(rows * 0.3, fz + 0.12));
    out.put(x, y, Math.floor(t * 3) % 2 ? '*' : '·');
  });
}

// --- BOTILLERÍA ---------------------------------------------------------------------------

function botilleria(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'baldosa', walls: 'ladrillo', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  // el letrero va colgado de la reja (más abajo)
  const BOT = [['¡', '|'], ['!', '|'], ['n', '|', '|'], ['n', '[]'], ['.', '|', 'U'], ['¡', '[]']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1 - 4, 4, BOT, { gap: 0 });
  // javas de cerveza apiladas abajo
  for (let x = L.x0 + 1; x + 7 <= L.x1; x += 8) {
    const h = 1 + Math.floor(hash2(x, 3) * 2);
    for (let k = 0; k < h; k++) ctx.text(x, b.y1 - k * 2, '[:::::]');
    ctx.text(x, b.y1 - h * 2 + 1, ' ¡¡¡¡¡ ');
  }
  // refrigeradores de vidrio en la pared izquierda
  cuadroLado(ctx, -1, 1.1, narrow ? 1.45 : 1.75, rows * 0.22, rows * 0.97, (c, r, u, v) => (v < 0.06 ? '_' : Math.abs(u - 0.5) < 0.04 ? '|' : r % 3 === 0 ? '¯' : (c + r) % 2 ? 'o' : 'u'));
  // rótulo pintado en la pared derecha
  ventanaLado(ctx, 1, 1.15, 1.5, rows * 0.2, rows * 0.5, { letras: 'HIELO', rayos: false });
  // el mesón con la reja hasta el techo
  const m = planoMeson(ctx, { X0: narrow ? 0.04 : 0.1, X1: narrow ? 0.96 : 0.9, f0: 0.3, cara: 'paneles' });
  const z = m.z0 - 0.001;
  const top = Math.ceil(room.ceilY(m.z0));
  const ventX0 = Math.round((m.c0 + m.c1) / 2) - 5;
  const ventX1 = ventX0 + 10;
  ctx.at(z, () => {
    for (let c = m.c0; c <= m.c1; c += 3) {
      if (c > ventX0 && c < ventX1) {
        for (let r = top; r < m.r0 - 6; r++) g.put(c, r, '|');
        continue;
      }
      for (let r = top; r < m.r0 - 1; r++) g.put(c, r, '|');
    }
    for (const r of [top + 2, Math.round((top + m.r0) / 2)]) for (let c = m.c0; c <= m.c1; c++) if (g.get(c, r) === 124 || c % 3) g.put(c, r, c % 3 === 0 ? '+' : '-');
    // la ventanilla
    g.hline(ventX0, ventX1, m.r0 - 6, '_');
    ctx.text(m.c0 + 2, m.r0 - 3, '¡18!');
  });
  ctx.at(m.z0 - 0.002, () => {
    letrero(ctx, ctx.vx, Math.max(top + 5, L.cartel), 'BOTILLERÍA', 'caja');
    if (!narrow) ctx.lines(m.c0 + 4, top + 5, [' ___________ ', '| VINOS     |', '| CERVEZAS  |', '|___________|']);
  });
  // el vendedor mirando la tele
  const tz = m.z0 + 0.25;
  if (!narrow) tele(ctx, L.x1 - 16, L.cartel - 2, 14, 5, { cuelga: false });
  const zV = ctx.zf(0.55);
  const Xv = room.vx + ((ventX0 + ventX1) / 2 - room.vx) * zV;
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'polera', cara: 'barba', gorro: 'jockey' }, poses: [['parado', 3], ['manos', 2], ['alza', 1, 'vaso'], ['parado', 2]] });
  // letrero ABIERTO que titila de noche
  const ax = narrow ? L.x0 + 1 : Math.round(ctx.vx) - 24;
  ctx.anim(m.z0 - 0.002, (out, t) => {
    const on = !night || Math.floor(t * 3) % 7 !== 0;
    out.text(ax, top + 3, on ? (night ? '*ABIERTO*' : ' ABIERTO ') : '         ');
  });
  clientes(ctx, {
    puntos: [{ X: cols * 0.48, z: ctx.zf(0.16) }],
    periodo: 14,
    dice: ['una cerveza y hielo', 'un pisco, porfa', '¿hay vino en caja?', 'dos bebidas'],
    responde: ['¿heladita?', '¿de cuántos grados?', 'el último', 'son $3.500'],
    vend: { X: Xv, z: zV },
  });
  // el zumbido del refri
  ctx.anim(1.2, (out, t) => {
    const x = Math.round(room.x(0, 1.3)) + 1;
    const y = Math.round(room.y(rows * 0.2, 1.3));
    if (Math.floor(t * 2) % 3) out.text(x, y, Math.floor(t * 4) % 2 ? '~ ' : ' ~');
  });
  brillo(ctx, [lampara(ctx, cols * 0.3, 1.25, 'tubo'), lampara(ctx, cols * 0.7, 1.25, 'tubo')]);
  void tz;
}

// --- ZAPATOS -------------------------------------------------------------------------------

function zapatos(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'damero', walls: 'liso', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'ZAPATOS', 'pintado');
  // cajas numeradas al fondo
  const CAJ = [['[38]'], ['[39]'], ['[40]'], ['[41]'], ['[37]'], ['[42]'], ['[36]']];
  repisas(ctx, L.x0 + 1, L.x1 - 1, L.alto[0], b.y1, 2, CAJ, { gap: 0, tabla: '_' });
  // repisas inclinadas de zapatos en los costados
  const Ys = [rows * 0.9, rows * 0.76, rows * 0.62, rows * 0.48, rows * 0.34, rows * 0.2];
  repisasLado(ctx, -1, 1.08, narrow ? 1.6 : 2.1, Ys, RELLENO.zapatos(ctx));
  repisasLado(ctx, 1, 1.35, narrow ? 1.65 : 2.1, Ys, RELLENO.zapatos(ctx));
  // espejo de piso a la derecha, adelante
  cuadroLado(ctx, 1, 1.08, 1.25, rows * 0.4, rows * 0.97, (c, r) => ((c + r) % 4 === 0 ? '/' : 0));
  // el banco de probarse al centro
  const bz = ctx.zf(0.3);
  const banco = meson(ctx, cols * 0.34, cols * 0.66, bz, bz + (ctx.Z - 1) * 0.12, rows * 0.1, (c, r) => (r && c % 10 === 0 ? '|' : 0));
  // la clienta sentada que se prueba un zapato
  const sz = bz + (ctx.Z - 1) * 0.1;
  const H = ctx.alto(sz);
  figura(ctx, { X: cols * 0.46, z: sz, look: { ropa: 'vestido', pelo: 'largo', sienta: true }, h: H, poses: [['parado', 2.5], ['saluda', 0.6], ['manos', 2]], dy: -Math.round((rows * 0.1) / sz) + 1 });
  // el vendedor arrodillado con la caja
  const kz = bz - (ctx.Z - 1) * 0.06;
  const kH = Math.round(ctx.alto(kz) * 0.7);
  const kX = cols * 0.58;
  figura(ctx, { X: kX, z: kz, look: { ropa: 'camisa', cara: 'espalda', sienta: true }, h: kH, poses: [['manos', 2], ['parado', 1.2], ['alza', 1]] });
  // el pie que golpetea y la caja abierta
  ctx.anim(kz - 0.001, (out, t) => {
    const x = ctx.px(cols * 0.5, kz);
    const y = ctx.piso(kz) - 1;
    out.text(x, y, Math.floor(t * 3) % 2 ? '_/¯' : '__/');
    out.text(ctx.px(kX + 10 * kz, kz), y, Math.floor(t / 3) % 2 ? '[__]' : '[_/ ');
  });
  // el medidor de pies en el piso
  const mz = ctx.zf(0.12);
  ctx.at(mz, () => ctx.lines(ctx.px(cols * 0.3, mz), ctx.piso(mz) - 2, [' _____ ', '[=|=|=]']));
  // mesón de la caja a la izquierda, al fondo
  const m = planoMeson(ctx, { X0: narrow ? 0.06 : 0.1, X1: narrow ? 0.32 : 0.3, f0: 0.55, cara: 'paneles' });
  ctx.at(m.z0, () => ctx.text(m.c0 + 1, m.top, '[$]'));
  const zV = ctx.zf(0.7);
  figura(ctx, { X: cols * 0.2, z: zV, look: { ropa: 'camisa', cara: 'bigote' }, poses: [['parado', 3], ['manos', 2]] });
  // otra clienta que mira la vitrina
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.8 : 0.82), z: ctx.zf(0.2) }],
    periodo: 16,
    dice: ['¿en 38?', '¿tiene en negro?', 'me aprietan', 'me los llevo'],
    responde: ['voy a ver', 'en bodega', 'un número más', '¡buena elección!'],
    vend: { X: kX, z: kz },
  });
  relojPared(ctx, L.x1 - 6, L.cartel);
  brillo(ctx, [lampara(ctx, cols * 0.35, 1.3, 'globo'), lampara(ctx, cols * 0.65, 1.3, 'globo')]);
  void night;
  void g;
  void banco;
}

// --- MERCERÍA ------------------------------------------------------------------------------

function merceria(ctx) {
  const { room, g, cols, rows, b, narrow, L, night } = ctx;
  room.shell({ floor: 'tablas', walls: 'papel', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'MERCERÍA', 'colgante');
  // cajoncitos con botones a la izquierda y carretes de hilo a la derecha
  const half = Math.round((L.x0 + L.x1) / 2);
  const cj1 = narrow ? L.x1 : Math.min(L.tit.x0 - 2, half - 2);
  for (let r = L.alto[0]; r <= b.y1; r++) {
    if (ctx.pisaTitulo(L.x0, cj1, r, r)) continue;
    for (let c = L.x0 + 1; c <= cj1; c++) {
      const k = (c - L.x0 - 1) % 6;
      const rr = (r - L.alto[0]) % 3;
      g.put(c, r, rr === 2 ? '_' : k === 0 ? '|' : rr === 1 && k === 3 ? (hash2(c, r) < 0.5 ? 'o' : '·') : ' ');
    }
  }
  if (!narrow) {
    const HIL = [['8'], ['(|)'], ['Ø'], ['(:)'], ['8']];
    repisas(ctx, half + 2, L.x1 - 1, L.alto[0] + 1, b.y1, 3, HIL, { gap: 1 });
  }
  // cintas que cuelgan de una vara, en la pared derecha
  const cz0 = 1.15;
  const cz1 = narrow ? 1.5 : 1.8;
  const cintas = [];
  for (let z = cz0; z <= cz1; z += 0.07) cintas.push({ x: Math.round(room.x(cols, z)) - 1, y: Math.round(room.y(rows * 0.25, z)), n: Math.round(rows * 0.18 / z) });
  ctx.at(cz0, () => g.line(room.x(cols, cz0) - 1, room.y(rows * 0.25, cz0) - 1, room.x(cols, cz1) - 1, room.y(rows * 0.25, cz1) - 1));
  ctx.anim(cz0, (out, t) => {
    cintas.forEach((c, i) => {
      for (let k = 0; k < c.n; k++) {
        const sw = Math.round(Math.sin(t * 1.4 + i + k * 0.3) * 0.6 * (k / c.n));
        out.put(c.x + sw, c.y + k, k % 2 ? '(' : ')');
      }
    });
  });
  // el maniquí con vestido, a la izquierda
  const mz = ctx.zf(0.26);
  const MAN = S([' .-. ', '(   )', ' )-( ', '/   \\', '|   |', '/ : \\', '/  :  \\', '/___:___\\', '   |   ', '   |   ', '  _|_  ']);
  ctx.at(mz, () => g.blit(MAN, ctx.px(cols * (narrow ? 0.14 : 0.13), mz) - (MAN.w >> 1), ctx.piso(mz) - MAN.h));
  // mesón de vidrio con tarjetas de botones y la huincha de medir
  const m = planoMeson(ctx, {
    X0: narrow ? 0.24 : 0.3,
    X1: narrow ? 0.94 : 0.86,
    f0: 0.38,
    cara: (c, r) => (r === 0 ? 0 : r === 2 ? (c % 4 === 1 ? 'o' : c % 4 === 3 ? 'o' : 0) : r === 3 ? '_' : r === 4 ? (c % 6 === 2 ? '8' : 0) : c % 12 === 0 ? '|' : 0),
  });
  ctx.at(m.z0, () => {
    ctx.text(m.c0 + 2, m.top, '~~~~~~~~~~~~');
    ctx.text(m.c0 + 15, m.top, '><');
  });
  // la máquina de coser con la costurera
  const sx = m.c1 - 16;
  ctx.at(m.z0, () => ctx.lines(sx, m.top - 3, ['  ________ ', ' |  ____  |', ' |_|    | |', '  ¯¯¯¯¯¯¯¯¯']));
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t * 10) % 2;
    out.put(sx + 4, m.top - 1, k ? '|' : "'");
    const off = Math.floor(t * 4) % 3;
    out.text(sx + 1, m.top, '~'.repeat(off) + '=~=~=~'.slice(off));
  });
  const zV = ctx.zf(0.6);
  const Xv = room.vx + (sx + 4 - room.vx) * zV;
  figura(ctx, { X: Xv, z: zV, look: { ropa: 'vestido', cara: 'lentes', gorro: 'moño' }, poses: [['manos', 4], ['parado', 1], ['alza', 0.8]] });
  // el gato que persigue un ovillo por el piso
  const gz = ctx.zf(0.12);
  ctx.anim(gz, (out, t) => {
    const P = 10;
    const u = (t % P) / P;
    const xx = Math.round(cols * (0.25 + 0.5 * u));
    const y = ctx.piso(gz) - 1;
    const roll = '(Ø)';
    out.text(xx + 9, y, roll);
    for (let k = 1; k < 6; k++) out.put(xx + 9 - k * 2, y + (k % 2), '~');
    const s = Math.floor(t * 4) % 2 ? [' /\\_/\\ ', '( o.o )~', ' / /\\ \\'] : [' /\\_/\\ ', '( o.o )~', ' \\ \\/ /'];
    s.forEach((l, i) => ctx.textZ(out, xx, y - 2 + i, l, gz));
  });
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.55, z: ctx.zf(0.24) }] : [{ X: cols * 0.5, z: ctx.zf(0.24) }],
    periodo: 16,
    dice: ['¿tiene botones así?', 'un metro de cinta', 'hilo azul, porfa', 'un cierre de 20'],
    responde: ['¿de cuatro hoyos?', '¿de raso?', 'el marino', 'aquí tiene'],
    vend: { X: Xv, z: zV },
  });
  relojPared(ctx, L.x1 - 6, L.cartel);
  brillo(ctx, [lampara(ctx, cols * 0.4, 1.3, 'campana'), lampara(ctx, cols * 0.65, 1.3, 'campana')]);
  void night;
}

export const TIENDAS = {
  FRUTERÍA: fruteria,
  FARMACIA: farmacia,
  FLORES: flores,
  LIBROS: libros,
  DISCOS: discos,
  ALMACÉN: almacen,
  BOTILLERÍA: botilleria,
  ZAPATOS: zapatos,
  MERCERÍA: merceria,
};
