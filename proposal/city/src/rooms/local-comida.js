// Locales de comida: panadería, sanguchería, completos, fuente de soda,
// heladería, café, bar y empanadas.
import {
  S, R, frames, SP, hash2, clamp, persona,
  planoMeson, letrero, pizarra, repisa, repisasLado, ventanaLado, puertaLado,
  lampara, brillo, ventilador, vapor, humo, relojPared, figura, clientes, gato, mosca,
  arco, ladrillo, lucesAnim, afiche, precio, cuadroLado, pizarraEn, CORDILLERA,
  tele, banquetas, mesonFondo, bocadillo, notas, mesa, silla, taburete, zCol, mesaGente, cola,
} from './local-kit.js';

// --- piezas de comida ----------------------------------------------------------------

const PANES = [['(||)'], ['(__)'], ['<==>'], ['(~~)'], ['.--.', '(__)'], ['(¨¨)'], ['()()']];

// canasto de pan sobre el mesón (ancho w)
function canasto(w, pan = '(|)') {
  const fill = (pan + ' ').repeat(Math.ceil(w / (pan.length + 1))).slice(0, w - 2);
  return S([' ' + fill.replace(/ /g, '¤') + ' ', '\\' + '_'.repeat(w - 2) + '/', ' ' + '¯'.repeat(w - 2) + ' ']);
}

const CAJA_REG = S([' ______ ', '|[0000]|', '|_::::_|', '/______\\']);
const BALANZA = S(['  _____ ', ' |0,000|', ' |_____|', '[_______]']);

// Horno de ladrillo con la boca en arco y fuego adentro. Devuelve la boca.
function horno(ctx, x0, y0, x1, y1) {
  const { g } = ctx;
  const w = x1 - x0;
  // cuerpo de ladrillo con la cúpula
  const cx = (x0 + x1) / 2;
  const domeH = Math.max(3, Math.round((y1 - y0) * 0.35));
  for (let r = y0; r <= y1; r++) {
    for (let c = x0; c <= x1; c++) {
      let inside = true;
      if (r < y0 + domeH) {
        const dy = (y0 + domeH - r) / domeH;
        const dx = (c + 0.5 - cx) / (w / 2);
        inside = dx * dx + dy * dy < 1;
      }
      if (inside) g.put(c, r, ladrillo(c, r));
    }
  }
  arco(ctx, cx, y0 + domeH, w / 2, domeH, { vaciar: false });
  g.vline(x0, y0 + domeH, y1, '|');
  g.vline(x1, y0 + domeH, y1, '|');
  // chimenea hasta el techo (si el horno ocupa la pared entera)
  const top = Math.ceil(ctx.room.by0) + 1;
  for (let r = top; r < y0 + 1 && y0 - top < 4; r++) {
    g.put(Math.round(cx) - 2, r, '|');
    g.put(Math.round(cx) + 2, r, '|');
    for (let c = Math.round(cx) - 1; c <= Math.round(cx) + 1; c++) g.put(c, r, r % 2 ? '_' : ' ');
  }
  // boca
  const my = y1 - Math.max(2, Math.round((y1 - y0) * 0.18));
  const mrx = Math.max(4, Math.round(w * 0.3));
  const mry = Math.max(3, Math.round((y1 - y0) * 0.35));
  const inside = arco(ctx, cx, my, mrx, mry);
  // repisa de la boca
  ctx.text(Math.round(cx - mrx - 2), my, '[' + '_'.repeat(Math.round(mrx * 2 + 2)) + ']');
  return { cx, my, mrx, mry, inside, x0, x1, y0, y1 };
}

// Fuego dentro de la boca del horno (y pan que se dora).
function fuego(ctx, boca) {
  const { cx, my, mrx, mry, inside } = boca;
  const LL = ['(', ')', '^', "'", ',', '(', ')', '.', '~'];
  ctx.anim(ctx.Z, (out, t) => {
    const k = Math.floor(t * 9);
    for (let r = my - 1; r >= my - mry + 1; r--) {
      const hgt = my - r;
      for (let c = Math.floor(cx - mrx) + 1; c < cx + mrx; c++) {
        if (!inside(c, r)) continue;
        const d = Math.abs(c + 0.5 - cx) / mrx;
        const v = hash2(c * 7 + k, r * 13 + (k >> 1));
        const lim = (1 - d) * (mry - 0.5) * (0.6 + 0.4 * Math.sin(t * 3 + c));
        if (hgt <= lim && v < 0.75) out.put(c, r, LL[Math.floor(v * LL.length)]);
        else out.put(c, r, ' ');
      }
    }
    // pan en la boca
    out.text(Math.round(cx - 3), my - 1, '(__)(_');
    if (ctx.night) for (let i = -1; i <= 1; i++) out.put(Math.round(cx + i * (mrx + 2)), my - mry - 1, Math.floor(t * 3 + i) % 2 ? '·' : '.');
  });
}

// --- PANADERÍA -------------------------------------------------------------------------

function panaderia(ctx) {
  const { room, g, cols, rows, b, E, night, narrow, L } = ctx;
  room.shell({ floor: 'damero', walls: 'papel', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  // azulejos sólo en la mitad de abajo de la pared del fondo
  for (let r = L.bajo[0]; r <= b.y1; r++) for (let c = b.x0; c <= b.x1; c++) if (r % 3 === 0 ? c % 2 === 0 : c % 6 === 0 && r % 3 === 1) g.put(c, r, r % 3 === 0 ? '_' : '|');
  letrero(ctx, ctx.vx, L.cartel, 'PANADERÍA', 'doble');
  const pw = narrow ? Math.min(L.w - 4, 24) : clamp(Math.round(L.w * 0.3), 20, 30);
  const lineas = [['MARRAQUETA', '1.890'], ['HALLULLA', '1.990'], ['AMASADO', '2.200'], ['DOBLADITA', '2.100'], ['COLIZA', '2.300']];
  let boca;
  let shelfX;
  if (narrow) {
    // arriba la pizarra y el reloj; abajo el horno y un carro de bandejas
    const pr = L.x1 - 7;
    pizarraEn(ctx, L.x0, L.alto[0], pr, L.alto[1], lineas, { titulo: 'EL KILO' });
    relojPared(ctx, pr + 2, L.alto[0] + 2);
    repisa(ctx, pr + 2, L.x1, L.alto[1], [['()'], ['(_)']], { gap: 0, mensula: false });
    const ow = Math.round(L.w * 0.58);
    boca = horno(ctx, L.x0 + 1, L.bajo[0], L.x0 + 1 + ow, b.y1);
    shelfX = [L.x0 + ow + 3, L.x1];
    for (let y = L.bajo[0] + 2; y <= b.y1; y += 3) repisa(ctx, shelfX[0], shelfX[1], y, [['()'], ['(_)'], ['<>']], { gap: 0, mensula: false });
  } else {
    const ow = clamp(Math.round(L.w * 0.33), 16, 36);
    boca = horno(ctx, L.x0 + 1, b.y0 + 1, L.x0 + 1 + ow, b.y1);
    const px0 = L.x1 - pw;
    relojPared(ctx, px0 + Math.floor(pw / 2) - 2, b.y0 + 1);
    const pb = pizarraEn(ctx, px0, b.y0 + 3, L.x1, Math.min(b.y1 - 4, b.y0 + 3 + lineas.length + 3), lineas, { titulo: 'PRECIOS x KG' });
    // bandejas bajo la pizarra
    for (let y = pb.y1 + 3; y <= b.y1; y += 3) repisa(ctx, px0, L.x1, y, PANES, { gap: 0 });
    // al centro, repisas con pan arriba y abajo del título
    const cx0 = L.x0 + ow + 4;
    const cx1 = px0 - 3;
    shelfX = [cx0, cx1];
    for (let y = L.alto[1]; y >= L.alto[0] + 1; y -= 4) repisa(ctx, cx0, cx1, y, PANES);
    for (let y = L.bajo[0] + 2; y <= b.y1; y += 4) repisa(ctx, cx0, cx1, y, PANES);
    ctx.lines(cx0, b.y1 - 2, [' ______ ', '(HARINA)', '(______)']);
  }
  fuego(ctx, boca);

  // pared izquierda: carro de bandejas con pan
  repisasLado(ctx, -1, 1.1, narrow ? 1.55 : 1.9, [rows * 0.92, rows * 0.74, rows * 0.56, rows * 0.38, rows * 0.2], (c, k, i) => {
    if (i > 1) return 0;
    const m = c % 4;
    if (i === 1) return m === 1 || m === 2 ? '_' : 0;
    return m === 0 ? '(' : m === 3 ? ')' : hash2(c, k) < 0.3 ? '|' : '_';
  });
  // pared derecha: la ventana con el nombre al revés y la puerta al horno
  ventanaLado(ctx, 1, 1.1, 1.5, rows * 0.18, rows * 0.58, { letras: narrow ? 'PAN' : 'PAN AMASADO' });
  puertaLado(ctx, 1, narrow ? 1.55 : 1.75, narrow ? 1.7 : 2.05, { rotulo: narrow ? null : 'HORNO' });
  // calendario en la pared izquierda, sobre el carro
  cuadroLado(ctx, -1, 1.2, narrow ? 1.4 : 1.55, rows * 0.05, rows * 0.16, CORDILLERA);

  // mesón con vitrina de pasteles
  const VIT1 = '  (¨)  [::]  (o)  {==}  ';
  const VIT2 = '  .--.  (::)  <=>  (~)  ';
  const m = planoMeson(ctx, {
    X0: narrow ? 0.08 : 0.2,
    X1: narrow ? 0.92 : 0.8,
    cara: (c, r) => {
      if (r === 0) return 0;
      if (r === 1) return c % 7 === 3 ? '/' : 0;
      if (r === 2) return VIT1[c % VIT1.length] === ' ' ? 0 : VIT1[c % VIT1.length];
      if (r === 3) return '_';
      if (r === 4) return VIT2[c % VIT2.length] === ' ' ? 0 : VIT2[c % VIT2.length];
      if (r === 5) return '_';
      return c % 10 === 0 ? '|' : 0;
    },
  });
  const cw = narrow ? 8 : 12;
  ctx.at(m.z0, () => {
    g.blit(canasto(cw, '(|)'), m.c0 + 2, m.top - 2);
    g.blit(canasto(cw - 2, '(_)'), m.c0 + 3 + cw, m.top - 2);
    g.blit(CAJA_REG, m.c1 - CAJA_REG.w - 1, m.top - CAJA_REG.h + 1);
    if (!narrow) {
      g.blit(BALANZA, m.c1 - CAJA_REG.w - BALANZA.w - 3, m.top - BALANZA.h + 1);
      ctx.text(Math.round((m.c0 + m.c1) / 2) - 3, m.top, '[_][_]');
    }
  });
  const lamps = [lampara(ctx, cols * 0.32), lampara(ctx, cols * 0.68)];
  brillo(ctx, lamps);

  // el panadero junto al horno y la cajera en la caja
  const zV = ctx.zf(0.6);
  const Xof = (x) => room.vx + (x - room.vx) * zV;
  const Xp = Xof(narrow ? boca.x1 - 2 : boca.x1 + 4);
  figura(ctx, { X: Xp, z: zV, look: { gorro: 'gorro', ropa: 'delantal', cara: 'bigote' }, poses: [['manos', 2.5], ['alza', 1.2], ['manos', 1.5], ['parado', 1.5]] });
  const Xc = Xof(m.c1 - CAJA_REG.w - (narrow ? 4 : 8));
  figura(ctx, { X: Xc, z: zV + 0.02, look: { ropa: 'delantal', pelo: 'largo' }, poses: [['parado', 3], ['manos', 2], ['saluda', 0.8], ['parado', 2]] });
  // vapor del pan recién salido y la balanza
  ctx.anim(m.z0, (out, t) => {
    vapor(out, m.c0 + 2 + (cw >> 1), m.top - 3, t, { n: 3, h: 4 });
    vapor(out, m.c0 + 3 + cw + (cw >> 1), m.top - 3, t + 0.4, { n: 2, h: 3 });
    if (!narrow) {
      const k = Math.floor(t / 6);
      const kg = k % 3 === 0 ? '0,000' : (0.4 + hash2(k, 3)).toFixed(3).replace('.', ',');
      out.text(m.c1 - CAJA_REG.w - BALANZA.w - 1, m.top - BALANZA.h + 2, kg);
    }
  });
  // clientes
  const zC = ctx.zf(0.2);
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.3, z: zC }] : [{ X: cols * 0.38, z: zC }, { X: cols * 0.7, z: zC + 0.04 }],
    periodo: narrow ? 12 : 17,
    dice: ['6 marraquetas', '¿hay amasado?', 'un kilo, porfa', '¿y hallullas?'],
    responde: ['¡al tiro!', 'recién salido', '¿algo más?', 'son $1.890'],
    vend: { X: Xc, z: zV },
  });
  // polvo de harina en la luz de la ventana (de día)
  if (!night) {
    ctx.anim(1.05, (out, t) => {
      for (let k = 0; k < 7; k++) {
        const p = (t * 0.06 + k / 7) % 1;
        const x = Math.round(cols * 0.84 + Math.sin(t * 0.5 + k * 1.7) * 4 - p * cols * 0.1);
        const y = Math.round(rows * 0.25 + p * rows * 0.45);
        if (out.get(x, y) === SP) out.put(x, y, '·');
      }
    });
  }
  mosca(ctx, m.c0 + 4, m.top - 8, m.c0 + 20, m.top - 4, 1.2);
}

// --- comedores: plancha, barra y banquetas ---------------------------------------------

// Campana de cocina sobre (x0..x1), con el ducto al techo; abajo en la fila y.
function campana(ctx, x0, x1, y) {
  const { g, b } = ctx;
  const cx = Math.round((x0 + x1) / 2);
  for (let r = b.y0; r < y - 1; r++) {
    g.put(cx - 2, r, '|');
    g.put(cx + 2, r, '|');
    g.put(cx - 1, r, ' ');
    g.put(cx, r, r % 3 === 0 ? '=' : ' ');
    g.put(cx + 1, r, ' ');
  }
  ctx.text(x0 + 1, y - 1, '_'.repeat(x1 - x0 - 1));
  ctx.text(x0, y, '/' + ':'.repeat(0) + ' '.repeat(x1 - x0 - 1) + '\\');
  for (let c = x0 + 2; c < x1 - 1; c += 2) g.put(c, y, '.');
  ctx.text(x0 - 1, y + 1, '/' + '_'.repeat(x1 - x0 + 1) + '\\');
}

// La plancha sobre un mesón del fondo: comida que chisporrotea y humo.
function plancha(ctx, x0, x1, y, comida = ['(==)', '(o)', '[==]', '~~~']) {
  let row = '';
  let k = 0;
  while (row.length < x1 - x0 - 1) row += comida[k++ % comida.length] + ' ';
  ctx.text(x0, y, '[' + row.slice(0, x1 - x0 - 1) + ']');
  ctx.text(x0, y + 1, '|' + '='.repeat(x1 - x0 - 1) + '|');
  ctx.anim(ctx.Z - 0.01, (out, t) => {
    humo(out, x0 + 1, x1 - 1, y - 1, t, 5);
    for (let c = x0 + 1; c < x1; c++) if (hash2(c, Math.floor(t * 8)) < 0.12) out.put(c, y - 1, "'");
  });
}

// Una olla que hierve (vienesas, cazuela).
function olla(ctx, x, y, w = 9, { dentro = '°o~' } = {}) {
  ctx.lines(x, y - 2, [' ' + '_'.repeat(w - 2) + ' ', '(' + '_'.repeat(w - 2) + ')', '|' + ' '.repeat(w - 2) + '|', '|' + '_'.repeat(w - 2) + '|']);
  ctx.anim(ctx.Z - 0.01, (out, t) => {
    const k = Math.floor(t * 6);
    for (let i = 1; i < w - 1; i++) out.put(x + i, y, dentro[(i * 7 + k) % dentro.length]);
    vapor(out, x + (w >> 1), y - 3, t, { n: 3, h: 4 });
  });
}

// El comedor: mesón de trabajo y menú en el fondo, barra con banquetas
// adelante, el cocinero entre los dos y clientes que vienen a pedir.
function comedor(ctx, cfg) {
  const { room, g, cols, rows, b, E, narrow, L } = ctx;
  room.shell({ floor: cfg.piso || 'baldosa', walls: cfg.paredes || 'puntos', back: 'liso', ceiling: cfg.techo || 'liso', seed: ctx.seed });
  // azulejos detrás de la cocina
  const kx0 = cfg.cocinaDer && !narrow ? Math.round(L.x0 + L.w * 0.5) : L.x0;
  const kx1 = narrow || cfg.cocinaDer ? L.x1 : Math.round(L.x0 + L.w * 0.46);
  for (let r = L.bajo[0] - 1; r <= b.y1; r++) for (let c = kx0; c <= kx1; c++) if (r % 2 === 0 ? (c + (r >> 1) * 2) % 4 === 0 : false) g.put(c, r, '|');
  const sign = letrero(ctx, ctx.vx, L.cartel, ctx.shop.name, cfg.estilo || 'caja');
  // el menú
  if (narrow) pizarraEn(ctx, L.x0, L.alto[0], L.x1, L.alto[1], cfg.menu, { titulo: cfg.tituloMenu });
  else if (cfg.cocinaDer) {
    const mx1 = Math.min(L.tit.x0 - 2, Math.round(L.x0 + L.w * 0.44));
    pizarraEn(ctx, L.x0 + 1, b.y0, mx1, Math.min(b.y1 - 3, b.y0 + cfg.menu.length + 5), cfg.menu, { titulo: cfg.tituloMenu });
  } else {
    const mx0 = Math.max(L.tit.x1 + 2, Math.round(L.x0 + L.w * 0.56));
    pizarraEn(ctx, mx0, b.y0, L.x1, Math.min(b.y1 - 3, b.y0 + cfg.menu.length + 5), cfg.menu, { titulo: cfg.tituloMenu });
  }
  // mesón de trabajo con la cocina encima
  const X0 = cols * (cfg.cocinaDer && !narrow ? 0.5 : 0.02);
  const X1 = narrow ? cols * 0.98 : cols * (cfg.cocinaDer ? 0.98 : 0.47);
  const mf = mesonFondo(ctx, X0, X1, rows * 0.18, 'azulejo');
  const k0 = mf.c0 + 2;
  const k1 = mf.c1 - 2;
  const top = mf.top;
  cfg.cocina(ctx, k0, k1, top, mf);
  // la barra
  const mb = cfg.meson || {};
  const m = planoMeson(ctx, { X0: narrow ? 0.06 : mb.X0 ?? 0.12, X1: narrow ? 0.94 : mb.X1 ?? 0.88, f0: mb.f0 ?? 0.3, cara: cfg.cara || 'tablas' });
  ctx.at(m.z0, () => cfg.barra && cfg.barra(ctx, m));
  // banquetas con gente comiendo
  if (cfg.banquetas !== false) banquetas(ctx, m, { n: narrow ? 3 : 5, ocupadas: narrow ? [0] : [0, 3], looks: cfg.comensales || [{ ropa: 'abrigo' }, { ropa: 'rayas', gorro: 'jockey' }] });
  // cocinero
  const zV = ctx.zf(0.62);
  const Xk = room.vx + (((k0 + k1) / 2) - room.vx) * zV;
  figura(ctx, {
    X: Xk,
    z: zV,
    look: { gorro: 'gorro', ropa: 'delantal', ...(cfg.cocinero || {}) },
    poses: (t) => {
      const u = t % 9;
      if (u < 4) return Math.floor(u * 1.5) % 2 ? 'manos' : 'parado';
      if (u < 5.5) return 'alza';
      return 'manos';
    },
  });
  // quien atiende
  const Xa = cfg.Xmozo ?? cols * (narrow ? 0.72 : 0.68);
  if (!narrow) figura(ctx, { X: Xa, z: zV - 0.05, look: cfg.mozo || { ropa: 'camisa', cara: 'bigote' }, poses: [['parado', 3], ['manos', 2.5], ['saluda', 0.8], ['parado', 2]] });
  const vend = { X: narrow ? Xk : Xa, z: zV };
  if (cfg.cola) cola(ctx, { slots: cfg.cola, dice: cfg.dice, responde: cfg.responde, vend });
  else
    clientes(ctx, {
      puntos: cfg.puntos || (narrow ? [{ X: cols * 0.62, z: ctx.zf(0.12) }] : [{ X: cols * 0.56, z: ctx.zf(0.14) }]),
      periodo: 15,
      dice: cfg.dice,
      responde: cfg.responde,
      vend,
    });
  // lámparas y ventilador
  const lamps = [lampara(ctx, cols * 0.25, 1.3, cfg.lampara || 'campana'), lampara(ctx, cols * 0.75, 1.3, cfg.lampara || 'campana')];
  brillo(ctx, lamps);
  if (!narrow) ventilador(ctx, cols * 0.5, 1.45);
  return { m, mf, sign, zV, k0, k1, top };
}

// --- SANGUCHES ----------------------------------------------------------------------------

function sanguches(ctx) {
  const { cols, rows, narrow, L, b } = ctx;
  const r = comedor(ctx, {
    paredes: 'puntos',
    menu: [['BARROS LUCO', '6.900'], ['CHACARERO', '7.500'], ['ITALIANO', '6.500'], ['AVE PALTA', '5.900'], ['LOMITO', '7.900'], ['CHURRASCO', '6.900']],
    tituloMenu: 'LA CARTA',
    cocina: (ctx, k0, k1, top) => {
      const pw = Math.min(k1 - k0 - 2, narrow ? 16 : 22);
      plancha(ctx, k0, k0 + pw, top - 1, ['(==)', '(o)', '[==]', '~~']);
      if (!narrow) campana(ctx, k0 - 1, k0 + pw + 1, Math.max(b.y0 + 3, top - 8));
      // pan y tomates
      ctx.text(k0 + pw + 2, top - 1, '(__)(__)');
      ctx.text(k0 + pw + 2, top, 'ooo ~~');
    },
    barra: (ctx, m) => {
      // salsas, servilletero y un sánguche servido
      const y = m.top;
      ctx.text(m.c0 + 3, y - 1, ' n  n  n ');
      ctx.text(m.c0 + 3, y, '[M][K][A]');
      ctx.text(m.c0 + 14, y, '|||]');
      ctx.text(Math.round((m.c0 + m.c1) / 2) + 4, y, '(====)');
      ctx.text(m.c1 - 10, y - 1, ' _  ');
      ctx.text(m.c1 - 10, y, '|_|)');
    },
    dice: ['un barros luco', '¿chacarero sin ají?', 'un lomito, porfa', 'para llevar'],
    responde: ['¡sale uno!', 'diez minutos', '¿con bebida?', '¡marchando!'],
    comensales: [{ ropa: 'abrigo', gorro: 'boina' }, { ropa: 'polera', pelo: 'largo' }],
  });
  // pared izquierda: una vitrina refrigerada con bebidas
  cuadroLado(ctx, -1, 1.12, narrow ? 1.35 : 1.5, rows * 0.32, rows * 0.98, (c, rr, u, v) => (v < 0.08 ? '_' : v > 0.93 ? '_' : u > 0.92 ? '|' : rr % 3 === 0 ? '¯' : c % 2 ? '!' : '¡'), { z: 1.12 });
  cuadroLado(ctx, -1, 1.6, 1.95, rows * 0.1, rows * 0.24, CORDILLERA);
  ventanaLado(ctx, 1, 1.1, 1.45, rows * 0.2, rows * 0.55, { letras: 'SANGUCHES' });
  // afiche de la promo
  if (!narrow) afiche(ctx, L.x0 + 1, b.y0 + 1, ['BEBIDA + PAPAS', '   $2.000']);
  void r;
}

// --- COMPLETOS ------------------------------------------------------------------------------

const COMPLETO = [
  '   .~~~~~~~~~~~~.   ',
  ' .(:::::::::::::::). ',
  '(_~-~-~-~-~-~-~-~-~_)',
  ' `-----------------\' ',
];

function completos(ctx) {
  const { cols, rows, narrow, L, b, night } = ctx;
  const r = comedor(ctx, {
    paredes: 'papel',
    estilo: 'neon',
    lampara: 'globo',
    menu: [['ITALIANO', '2.500'], ['DINÁMICO', '2.900'], ['AS ITALIANO', '3.500'], ['COMPLETO', '2.200'], ['VIENESA', '1.500']],
    tituloMenu: 'AL PASO',
    cocina: (ctx, k0, k1, top) => {
      olla(ctx, k0, top - 1, narrow ? 8 : 10, { dentro: '~°o=' });
      // calientapán y el bote de chucrut
      const x = k0 + (narrow ? 10 : 12);
      ctx.lines(x, top - 3, [' _________ ', '|(__)(__) |', '|(__)(__)_|']);
      if (!narrow) ctx.lines(x + 12, top - 2, [' ___ ', '|CHU|', '|___|']);
    },
    barra: (ctx, m) => {
      // vitrina de agregados: palta, tomate, mayo, chucrut, ají
      const w = Math.min(m.c1 - m.c0 - 6, narrow ? 24 : 40);
      const x = m.c0 + 3;
      const y = m.top;
      ctx.text(x, y - 2, ' ' + '_'.repeat(w - 2) + ' ');
      const tr = ['[::::]', '[oooo]', '[~~~~]', '[####]', '[^^^^]'];
      let row = '';
      for (let i = 0; row.length < w - 2; i++) row += tr[i % tr.length];
      ctx.text(x, y - 1, '/' + row.slice(0, w - 2) + '\\');
      ctx.text(x, y, '¯'.repeat(w));
      ctx.text(m.c1 - 8, y - 1, ' n  n');
      ctx.text(m.c1 - 8, y, '[M][K]');
    },
    dice: ['un italiano', '¿un as con palta?', 'dos dinámicos', 'con harta mayo'],
    responde: ['¡al tiro!', '¿pa servir?', 'sale un italiano', 'son $5.000'],
    cocinaDer: true,
    banquetas: false,
    meson: { X0: 0.44, X1: 0.94, f0: 0.3 },
    Xmozo: cols * 0.82,
    puntos: narrow ? [{ X: cols * 0.62, z: ctx.zf(0.12) }] : [{ X: cols * 0.62, z: ctx.zf(0.14) }],
  });
  // barra de pared a la izquierda: gente comiendo de pie
  const Yb = rows * 0.64;
  const zb0 = 1.1;
  const zb1 = narrow ? 1.45 : 1.75;
  repisasLado(ctx, -1, zb0, zb1, [Yb + 0.6, Yb], () => 0, { montantes: 2 });
  ctx.at(zb0, () => {
    for (let z = zb0 + 0.1; z < zb1; z += 0.18) ctx.text(ctx.px(0, z) + 1, ctx.py(Yb, z) - 1, z < 1.3 ? '(~~)' : 'u');
  });
  const comen = narrow ? [1.28] : [1.25, 1.52];
  comen.forEach((z, i) => {
    const X = (ctx.room.vx + (ctx.px(0, z) + (narrow ? 5 : 7) - ctx.room.vx) * z);
    figura(ctx, { X, z, look: { cara: 'espalda', ...(i ? { ropa: 'vestido', pelo: 'largo' } : { ropa: 'abrigo', gorro: 'jockey' }) }, poses: [['toma', 1.3 + i * 0.4], ['parado', 2], ['manos', 1.6]] });
  });
  // el completo gigante pintado en la pared, al centro
  if (!narrow) ctx.lines(Math.round(ctx.vx - COMPLETO[0].length / 2), L.bajo[0] + 1, COMPLETO);
  ventanaLado(ctx, 1, 1.1, 1.45, rows * 0.2, rows * 0.55, { letras: 'COMPLETOS' });
  cuadroLado(ctx, -1, 1.15, 1.45, rows * 0.1, rows * 0.3, (c, rr, u, v) => (v < 0.25 ? (c % 2 ? '~' : 0) : v < 0.6 ? ':' : v < 0.8 ? '=' : 0));
  // el completo que se arma en la barra, paso a paso
  const m = r.m;
  const ax = Math.round((m.c0 + m.c1) / 2) + (narrow ? -3 : -4);
  const ay = m.top;
  const PASOS = ['(______)', '(_====_)', '(:====:)', '(oooooo)', '(~~~~~~)', '(~~~~~~)'];
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t / 1.2) % (PASOS.length + 2);
    if (k < PASOS.length) out.text(ax, ay, PASOS[k]);
  });
  void night;
}

// --- FUENTE DE SODA ---------------------------------------------------------------------------

function fuente(ctx) {
  const { cols, rows, narrow, L, b } = ctx;
  const r = comedor(ctx, {
    piso: 'damero',
    paredes: 'papel',
    techo: 'vigas',
    estilo: 'doble',
    menu: [['LOMO A LO POBRE', '8.900'], ['CHURRASCO', '6.900'], ['CAZUELA', '5.500'], ['SCHOP', '2.800'], ['JUGO NATURAL', '2.500'], ['ONCE COMPLETA', '4.500']],
    tituloMenu: 'HOY',
    cocina: (ctx, k0, k1, top) => {
      const pw = Math.min(k1 - k0 - 2, narrow ? 14 : 18);
      plancha(ctx, k0, k0 + pw, top - 1, ['(==)', '(o)', '~~', '(o)']);
      if (!narrow) {
        campana(ctx, k0 - 1, k0 + pw + 1, Math.max(b.y0 + 3, top - 8));
        olla(ctx, k0 + pw + 3, top - 1, 8);
      }
    },
    barra: (ctx, m) => {
      const y = m.top;
      // schopero con dos llaves, juguera y una torta bajo campana
      ctx.lines(m.c0 + 3, y - 3, [' _T__T_ ', '|______|', '|SCHOP |', '|______|'].slice(0, 4));
      ctx.lines(m.c1 - 14, y - 3, ['  .-~-.  ', ' /     \\ ', '( ##### )', '¯¯¯¯¯¯¯¯¯']);
      if (!narrow) ctx.lines(Math.round((m.c0 + m.c1) / 2) + 6, y - 3, [' .--.', ' |  |', ' |__|', ' [__]']);
    },
    dice: ['un lomo a lo pobre', 'un schop, porfa', '¿hay cazuela?', 'la cuenta'],
    responde: ['¡sale!', 'bien helado', 'de vacuno', 'son $8.900'],
    comensales: [{ ropa: 'abrigo', cara: 'bigote' }, { ropa: 'vestido', pelo: 'largo' }],
    mozo: { ropa: 'camisa', cara: 'bigote', gorro: 'jockey' },
    meson: { X0: 0.2, X1: 0.8, f0: 0.46 },
    puntos: narrow ? [{ X: cols * 0.5, z: ctx.zf(0.3) }] : [{ X: cols * 0.5, z: ctx.zf(0.34) }],
  });
  // reservados adelante, con gente almorzando
  if (narrow) mesaGente(ctx, cols * 0.22, ctx.zf(0.1), { a: { ropa: 'abrigo', cara: 'bigote' }, solo: true, cosas: '(~)' });
  else {
    mesaGente(ctx, cols * 0.14, ctx.zf(0.1), { a: { ropa: 'abrigo', cara: 'bigote' }, b: { ropa: 'vestido', pelo: 'largo' }, cosas: '(~) |]' });
    mesaGente(ctx, cols * 0.86, ctx.zf(0.1), { a: { ropa: 'camisa', cara: 'lentes' }, b: { ropa: 'rayas', gorro: 'jockey' }, cosas: '[==] u' });
  }
  const m = r.m;
  // la juguera que bate de a ratos y el schop que corre
  const jx = Math.round((m.c0 + m.c1) / 2) + 7;
  ctx.anim(m.z0 - 0.001, (out, t) => {
    if (!narrow) {
      const on = Math.floor(t / 3) % 2 === 0;
      const f = Math.floor(t * 12) % 3;
      out.text(jx, m.top - 2, on ? ['|~~|', '|=~|', '|~=|'][f] : '|~~|');
      if (on) out.put(jx + 4, m.top, f ? ')' : '(');
    }
    const p = (t % 5) / 5;
    if (p < 0.5) {
      out.put(m.c0 + 5, m.top - 1, '|');
      out.text(m.c0 + 4, m.top, p < 0.25 ? '[_]' : '[:]');
    }
  });
  // la tele en la esquina con el partido
  if (!narrow) tele(ctx, L.x0 + 2, b.y0 + 1, 16, 5, { cuelga: false });
  else tele(ctx, 2, Math.round(rows * 0.12), 12, 4, { z: 1.15 });
  // mesas con gente en la pared izquierda (en desktop)
  cuadroLado(ctx, -1, 1.15, 1.5, rows * 0.1, rows * 0.3, (c, rr, u, v) => (v < 0.2 ? '~' : (c + rr) % 3 === 0 ? ':' : 0));
  ventanaLado(ctx, 1, 1.1, 1.45, rows * 0.2, rows * 0.55, { letras: 'FUENTE DE SODA' });
  // la garzona que pasa con una bandeja
  ctx.anim(ctx.zf(0.24), (out, t) => {
    const P = 14;
    const u = (t + 4) % P;
    if (u > 7) return;
    const z = ctx.zf(0.24);
    const X = cols * (0.25 + (u / 7) * 0.5);
    const pose = Math.floor(u * 4) % 2 ? 'pasoA' : 'pasoB';
    const s = persona(ctx.alto(z), { ropa: 'delantal', pelo: 'largo', pose: u > 3 && u < 4 ? 'alza' : pose, objeto: 'bandeja' });
    const x = ctx.px(X, z) - s.cx;
    ctx.blitZ(out, s, x, ctx.piso(z) - s.h, z);
  });
}

// --- EMPANADAS ------------------------------------------------------------------------------------

function empanadas(ctx) {
  const { cols, rows, narrow, L, b, g } = ctx;
  const r = comedor(ctx, {
    piso: 'tablas',
    paredes: 'ladrillo',
    estilo: 'colgante',
    menu: [['PINO', '2.800'], ['QUESO', '2.200'], ['NAPOLITANA', '2.900'], ['CAMARÓN QUESO', '3.500'], ['CHAMPIÑÓN', '2.700']],
    tituloMenu: 'HORNEADAS · FRITAS',
    cocina: (ctx, k0, k1, top) => {
      // horno de acero con dos puertas de vidrio y la freidora
      const ow = Math.min(k1 - k0 - 2, narrow ? 14 : 18);
      const oy = top - 6;
      ctx.lines(k0, oy, [
        ' ' + '_'.repeat(ow - 2) + ' ',
        '|' + ' o'.repeat(Math.floor((ow - 2) / 2)).padEnd(ow - 2) + '|',
        '|' + '_'.repeat(ow - 2) + '|',
        '|' + '(__)'.repeat(Math.floor((ow - 2) / 4)).padEnd(ow - 2) + '|',
        '|' + '='.repeat(ow - 2) + '|',
        '|' + '(__)'.repeat(Math.floor((ow - 2) / 4)).padEnd(ow - 2) + '|',
        '|' + '_'.repeat(ow - 2) + '|',
      ]);
      ctx.anim(ctx.Z - 0.01, (out, t) => {
        // luz del horno y el calor
        out.put(k0 + ow - 3, oy + 1, Math.floor(t * 2) % 2 ? '*' : 'o');
        vapor(out, k0 + (ow >> 1), oy - 1, t, { n: 2, h: 3, glifos: '~~.' });
      });
      if (!narrow) {
        const fx = k0 + ow + 2;
        ctx.lines(fx, top - 3, [' _________ ', '|         |', '|=========|', '|_|_____|_|']);
        ctx.anim(ctx.Z - 0.01, (out, t) => {
          const k = Math.floor(t * 7);
          for (let i = 1; i < 10; i++) out.put(fx + i, top - 2, '°oO.'[(i * 5 + k) % 4]);
          out.text(fx + 2, top - 3, Math.floor(t / 2) % 2 ? '_(__)_' : '______');
        });
      }
    },
    barra: (ctx, m) => {
      // vitrina caliente con empanadas
      const w = Math.min(m.c1 - m.c0 - 6, narrow ? 22 : 34);
      const x = m.c0 + 3;
      const y = m.top;
      ctx.text(x, y - 3, ' ' + '_'.repeat(w - 2) + ' ');
      ctx.text(x, y - 2, '|' + '(¨¨) '.repeat(Math.ceil(w / 5)).slice(0, w - 2) + '|');
      ctx.text(x, y - 1, '|' + ' (__)'.repeat(Math.ceil(w / 5)).slice(0, w - 2) + '|');
      ctx.text(x, y, '|' + '_'.repeat(w - 2) + '|');
      if (!narrow) ctx.text(m.c1 - 12, y, '(o)=====(o)');
    },
    dice: ['dos de pino', '¿hay de queso?', 'una napolitana', 'media docena'],
    responde: ['¡calentitas!', 'recién fritas', '¿con pebre?', 'son $5.600'],
    cocinero: { pelo: 'largo', cara: 'feliz' },
    mozo: { ropa: 'delantal', gorro: 'pañuelo' },
    banquetas: false,
    meson: { X0: 0.16, X1: 0.84, f0: 0.34 },
    cola: narrow
      ? [{ X: cols * 0.4, z: ctx.zf(0.2) }, { X: cols * 0.3, z: ctx.zf(0.08) }]
      : [{ X: cols * 0.42, z: ctx.zf(0.22) }, { X: cols * 0.35, z: ctx.zf(0.13) }, { X: cols * 0.27, z: ctx.zf(0.05) }],
  });
  // banderines de fiestas patrias que se mecen bajo el techo
  const zB = 1.35;
  const y0 = Math.ceil(ctx.room.ceilY(zB)) + 2;
  const x0 = Math.round(ctx.room.leftX(zB)) + 1;
  const x1 = Math.round(ctx.room.rightX(zB)) - 1;
  ctx.anim(zB, (out, t) => {
    for (let c = x0; c <= x1; c++) {
      const sag = Math.round(Math.sin(((c - x0) / (x1 - x0)) * Math.PI) * 2 + Math.sin(t * 1.5 + c * 0.2) * 0.4);
      const y = y0 + sag;
      const k = (c - x0) % 4;
      out.put(c, y, k === 0 ? '.' : '-');
      if (k === 2) out.put(c, y + 1, (Math.floor(t * 2) + c) % 3 ? 'v' : 'V');
    }
  });
  ventanaLado(ctx, 1, 1.1, 1.45, rows * 0.22, rows * 0.55, { letras: 'HAY EMPANADAS' });
  cuadroLado(ctx, -1, 1.12, 1.45, rows * 0.12, rows * 0.34, (c, rr, u, v) => (v < 0.33 ? (u < 0.5 ? ' ' : 0) : v < 0.66 ? ':' : 0));
  // uslero y bolas de masa en la mesa de trabajo
  if (!narrow) ctx.text(r.k1 - 10, r.top, '=O= oo');
  void cols;
  void L;
  void b;
  void g;
}

// --- HELADOS -----------------------------------------------------------------------------------

const SABORES = ['FRUTILLA', 'CHOCOLATE', 'LÚCUMA', 'MANJAR', 'VAINILLA', 'MENTA', 'PISTACHO', 'LIMÓN', 'CAFÉ', 'MORA'];

function helados(ctx) {
  const { room, g, cols, rows, b, E, night, narrow, L } = ctx;
  room.shell({ floor: 'damero', walls: 'puntos', back: 'liso', ceiling: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, L.cartel, 'HELADOS', 'neon');
  // el cono gigante pintado en el fondo, a la izquierda
  const CONO = ['  .--.  ', ' (    ) ', '(.-..-.)', ' \\::::/ ', '  \\::/  ', '   \\/   '];
  if (!narrow) {
    ctx.lines(L.x0 + 3, b.y0 + 1, CONO);
    ctx.lines(L.x0 + 12, b.y0 + 2, [' _____ ', '|HECHO|', '| ACÁ |', '|_____|']);
  }
  // el menú de tamaños
  const menu = [['1 BOLA', '1.500'], ['2 BOLAS', '2.500'], ['3 BOLAS', '3.200'], ['BARQUILLO', '+300'], ['COPA', '3.900']];
  if (narrow) pizarraEn(ctx, L.x0, L.alto[0], L.x1, L.alto[1], menu, { titulo: 'PRECIOS' });
  else pizarraEn(ctx, Math.max(L.tit.x1 + 2, L.x1 - 26), b.y0, L.x1, b.y0 + 9, menu, { titulo: 'PRECIOS' });
  // máquina de helado suave y repisa con copas
  if (!narrow) {
    const mx = L.x0 + 2;
    ctx.lines(mx, L.bajo[0], [' .______. ', ' | SOFT | ', ' |_(__)_| ', ' |  ||  | ', ' |__||__| ']);
    repisa(ctx, mx + 12, Math.round(ctx.vx) - 6, L.bajo[0] + 1, [['Y'], ['V'], ['\\/']], { gap: 1 });
  }
  repisa(ctx, narrow ? L.x0 : Math.round(ctx.vx) + 8, L.x1, L.bajo[0] + 4, [['(_)'], ['[]'], ['\\/']], { gap: 1 });
  // conos apilados en la pared derecha
  repisasLado(ctx, 1, 1.15, narrow ? 1.5 : 1.85, [rows * 0.6, rows * 0.45, rows * 0.3], (c, k, i) => (i === 0 ? (c % 2 ? '/' : '\\') : i === 1 ? (c % 2 ? ')' : '(') : 0));
  ventanaLado(ctx, -1, 1.1, 1.45, rows * 0.2, rows * 0.55, { letras: 'HELADOS' });

  // la vitrina congeladora con los sabores
  const m = planoMeson(ctx, {
    X0: narrow ? 0.06 : 0.15,
    X1: narrow ? 0.94 : 0.85,
    f0: 0.34,
    H: 0.2,
    cara: (c, r) => {
      if (r === 0) return 0;
      if (r === 1) return c % 9 === 0 ? '|' : '_';
      if (r === 2) return c % 9 === 0 ? '|' : '~';
      if (r === 3) return c % 9 === 0 ? '|' : 0;
      if (r === 4) return '_';
      if (r === 5) return c % 6 === 2 ? 'o' : 0;
      return c % 12 === 0 ? '|' : 0;
    },
  });
  // nombres de los sabores en la vitrina
  const tubs = [];
  for (let c = m.c0 + 1, i = 0; c + 8 <= m.c1; c += 9, i++) {
    const name = SABORES[(i + ctx.seed) % SABORES.length].slice(0, 8);
    ctx.at(m.z0, () => ctx.text(c + 1 + Math.floor((8 - name.length) / 2), m.r0 + 3, name));
    tubs.push(c);
  }
  // conos sobre la vitrina
  ctx.at(m.z0, () => {
    ctx.lines(m.c0 + 2, m.top - 2, [' \\/\\/\\/ ', '  \\/\\/  ']);
    ctx.text(m.c1 - 10, m.top, '[CAJA]');
    ctx.lines(m.c1 - 18, m.top - 1, [' _ ', '|~|']);
  });
  // escarcha en el vidrio
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t * 3);
    for (let i = 0; i < 6; i++) {
      const c = m.c0 + 1 + Math.floor(hash2(i, k) * (m.c1 - m.c0 - 2));
      if (out.get(c, m.r0 + 3) === SP) out.put(c, m.r0 + 3, i % 2 ? '*' : '·');
    }
  });
  // la heladera sirve con la cuchara
  const zV = ctx.zf(0.58);
  const Xv = cols * 0.42;
  figura(ctx, { X: Xv, z: zV, look: { gorro: 'jockey', ropa: 'delantal', pelo: 'largo' }, poses: [['manos', 2], ['alza', 1.4], ['parado', 2], ['saluda', 0.8]] });
  if (!narrow) figura(ctx, { X: cols * 0.64, z: zV, look: { ropa: 'rayas', cara: 'feliz' }, poses: [['parado', 2.5], ['manos', 2]] });
  // un niño con su cono que se va achicando
  const kz = ctx.zf(0.15);
  const kX = cols * (narrow ? 0.7 : 0.8);
  ctx.anim(kz, (out, t) => {
    const H = Math.round(ctx.alto(kz) * 0.62);
    const s = persona(H, { pose: 'alza', objeto: 'cono', ropa: 'polera', cara: Math.floor(t * 2) % 3 ? 'feliz' : 'cierra' });
    const x = ctx.px(kX, kz) - s.cx;
    const y = ctx.piso(kz) - s.h;
    ctx.blitZ(out, s, x, y, kz);
    // lame: la lengua sale de a ratos y cae una gota
    if (Math.floor(t * 2) % 2) out.put(x + s.cx + 1, y + 3, '~');
    const p = (t % 3) / 3;
    out.put(x + s.cx + 5, y + Math.floor(p * 6), p < 0.8 ? '.' : ' ');
  });
  clientes(ctx, {
    puntos: narrow ? [{ X: cols * 0.32, z: ctx.zf(0.2) }] : [{ X: cols * 0.3, z: ctx.zf(0.2) }, { X: cols * 0.56, z: ctx.zf(0.22) }],
    periodo: 16,
    dice: ['¿me da a probar?', 'lúcuma y manjar', 'un barquillo', 'dos bolas, porfa'],
    responde: ['¡claro!', '¿en vaso o cono?', 'son $2.500', '¡que lo disfrute!'],
    vend: { X: Xv, z: zV },
  });
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'globo'), lampara(ctx, cols * 0.7, 1.3, 'globo')];
  brillo(ctx, lamps);
  if (!narrow) ventilador(ctx, cols * 0.5, 1.5);
  void E;
  void night;
  void g;
}

// --- CAFÉ ----------------------------------------------------------------------------------

const CAFETERA = [
  ' .______________. ',
  ' |  (·)    (·)  | ',
  ' |______________| ',
  ' |_/|_|____|_|\\_| ',
  '    ¯¯      ¯¯    ',
];

function cafe(ctx) {
  const { room, g, cols, rows, b, E, night, narrow, L } = ctx;
  room.shell({ floor: 'tablas', walls: 'ladrillo', back: 'ladrillo', ceiling: 'vigas', seed: ctx.seed });
  // limpiar zonas de la pared para los letreros
  ctx.clear(L.x0, b.y0, L.x1, L.cartel + 1);
  letrero(ctx, ctx.vx, L.cartel, 'CAFÉ', 'pintado');
  ctx.text(Math.round(ctx.vx) - 5, L.cartel - 2, '  ) ) )  ');
  const menu = [['ESPRESSO', '1.800'], ['CORTADO', '2.200'], ['CAPUCHINO', '2.600'], ['TÉ', '1.500'], ['KUCHEN', '2.900'], ['MEDIALUNA', '1.200']];
  if (narrow) {
    ctx.clear(L.x0, L.alto[0], L.x1, L.alto[1]);
    pizarraEn(ctx, L.x0, L.alto[0], L.x1, L.alto[1], menu, { titulo: 'PIZARRA' });
  } else {
    const x0 = L.x1 - 24;
    ctx.clear(x0, b.y0, L.x1, b.y0 + 10);
    pizarraEn(ctx, x0, b.y0, L.x1, b.y0 + 10, menu, { titulo: 'PIZARRA' });
    // repisa con tazas y frascos de grano a la izquierda
    ctx.clear(L.x0, b.y0, L.x0 + 22, b.y0 + 9);
    for (const y of [b.y0 + 3, b.y0 + 6, b.y0 + 9]) repisa(ctx, L.x0 + 1, L.x0 + 22, y, [['u'], ['U'], ['(_)'], ['[o]'], ['D']], { gap: 1 });
  }
  // la barra con la cafetera
  const m = planoMeson(ctx, { X0: narrow ? 0.04 : 0.18, X1: narrow ? 0.7 : 0.66, f0: 0.4, cara: 'tablas' });
  const cfx = m.c0 + 2;
  ctx.at(m.z0, () => {
    ctx.lines(cfx, m.top - CAFETERA.length + 1, CAFETERA);
    if (!narrow) {
      ctx.lines(cfx + CAFETERA[0].length + 1, m.top - 3, [' _ ', '\\_/', '| |', '|_|']);
      // vitrina de pasteles
      ctx.lines(m.c1 - 16, m.top - 2, [' .------------.', '/ (##) (::) () \\', '¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯']);
    }
  });
  // barista
  const zV = ctx.zf(0.62);
  const Xb = room.vx + (cfx + CAFETERA[0].length + (narrow ? 4 : 10) - room.vx) * zV;
  figura(ctx, { X: Xb, z: zV, look: { ropa: 'delantal', cara: 'barba', gorro: 'boina' }, poses: [['manos', 2.5], ['alza', 1], ['manos', 1.5], ['parado', 2]] });
  // vapor de la cafetera y el chorro de café
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const k = Math.floor(t / 4) % 2;
    vapor(out, cfx + (k ? 13 : 4), m.top - CAFETERA.length, t, { n: 3, h: 4 });
    if (Math.floor(t / 2) % 2) out.put(cfx + 5, m.top, ':');
    out.put(cfx + 5, m.top + 1 - 1, Math.floor(t * 4) % 2 ? '·' : ':');
  });
  // mesas con gente: dos adelante y una al fondo a la derecha
  const mesas = narrow ? [{ X: cols * 0.72, z: ctx.zf(0.62) }] : [{ X: cols * 0.8, z: ctx.zf(0.55) }, { X: cols * 0.84, z: ctx.zf(0.25) }];
  // mesas con gente conversando
  if (narrow) mesaGente(ctx, cols * 0.78, ctx.zf(0.55), { a: { ropa: 'vestido', pelo: 'largo' }, solo: true, cosas: 'u' });
  else {
    mesaGente(ctx, cols * 0.8, ctx.zf(0.5), { a: { ropa: 'abrigo', cara: 'lentes' }, b: { ropa: 'rayas', gorro: 'boina' }, cosas: 'u [=]' });
    mesaGente(ctx, cols * 0.86, ctx.zf(0.14), { a: { ropa: 'vestido', pelo: 'largo' }, b: { ropa: 'camisa' }, cosas: 'u  (o)' });
  }
  // un gato durmiendo en la repisa de la ventana
  const win = ventanaLado(ctx, -1, 1.12, 1.5, rows * 0.2, rows * 0.58, { letras: 'CAFÉ' });
  gato(ctx, Math.round(Math.max(win.xa, win.xb)) - 9, Math.round(Math.max(win.ba, win.bb)), 1.3, 'echado');
  // plantas colgando
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'globo'), lampara(ctx, cols * 0.5, 1.3, 'globo'), lampara(ctx, cols * 0.7, 1.3, 'globo')];
  brillo(ctx, lamps);
  if (!narrow) {
    const px = Math.round(room.x(cols * 0.9, 1.25));
    const py = Math.ceil(room.ceilY(1.25)) + 1;
    ctx.at(1.25, () => ctx.lines(px - 2, py, ['  |  ', ' _|_ ', ' \\_/ ', '(\\|/)', ' )|( ', '  (  ']));
  }
  clientes(ctx, {
    puntos: [{ X: cols * (narrow ? 0.34 : 0.4), z: ctx.zf(0.25) }],
    periodo: 14,
    dice: ['un cortado', '¿tiene descafeinado?', 'un capuchino', 'para llevar'],
    responde: ['¡enseguida!', 'sí, de grano', '¿con canela?', '¡que esté rico!'],
    vend: { X: Xb, z: zV },
  });
  void E;
  void night;
  void g;
}

// --- BAR ----------------------------------------------------------------------------------------

function bar(ctx) {
  const { room, g, cols, rows, b, E, night, narrow, L } = ctx;
  room.shell({ floor: 'tablas', walls: 'papel', back: 'liso', ceiling: 'vigas', seed: ctx.seed });
  const sign = letrero(ctx, ctx.vx, L.cartel, ' BAR ', 'neon');
  lucesAnim(ctx, sign.luces);
  // la pared de botellas con el espejo
  const x0 = L.x0 + 1;
  const x1 = L.x1 - 1;
  const ytop = L.cartel + 3;
  const BOT = [['¡', '|'], ['!', '|'], ['n', '|', '|'], ['¡', 'U'], ['n', '[]'], ['.', '|', '|']];
  const repis = narrow ? [L.alto[1], L.bajo[0] + 3, L.bajo[0] + 7] : [ytop + 3, L.alto[1], L.bajo[0] + 3, L.bajo[0] + 7];
  for (const y of repis) if (y <= b.y1 - 1) repisa(ctx, x0, x1, y, BOT, { gap: 0 });
  // el espejo detrás, con reflejos
  for (let r = L.bajo[0] + 8; r <= b.y1; r++) for (let c = x0; c <= x1; c++) if ((c + r) % 7 === 0) g.put(c, r, '/');
  // la barra con los schoperos
  const m = planoMeson(ctx, { X0: narrow ? 0.04 : 0.1, X1: narrow ? 0.96 : 0.9, f0: 0.32, cara: 'paneles' });
  const tx = Math.round((m.c0 + m.c1) / 2) - 6;
  ctx.at(m.z0, () => {
    ctx.lines(tx, m.top - 3, [' _T__T__T__T_ ', '|____________|', ' |  |  |  |  ']);
    ctx.text(m.c0 + 3, m.top, ' [_] u ');
    ctx.text(m.c1 - 9, m.top, '[MANÍ]');
  });
  // el barman sacando un schop
  const zV = ctx.zf(0.6);
  const Xb = room.vx + (tx + 4 - room.vx) * zV;
  figura(ctx, { X: Xb, z: zV, look: { ropa: 'camisa', cara: 'bigote' }, poses: [['manos', 3], ['alza', 0.8], ['parado', 2]] });
  ctx.anim(m.z0 - 0.001, (out, t) => {
    const p = (t % 6) / 6;
    if (p < 0.6) {
      out.put(tx + 3, m.top - 1, '|');
      const fill = Math.floor((p / 0.6) * 3);
      out.text(tx + 2, m.top, ['[_]', '[.]', '[:]', '[#]'][fill]);
      if (fill > 1) out.put(tx + 3, m.top - 1, '°');
    }
  });
  // parroquianos en la barra
  banquetas(ctx, m, { n: narrow ? 3 : 6, ocupadas: narrow ? [0, 2] : [0, 1, 4], looks: [{ ropa: 'abrigo', gorro: 'boina' }, { ropa: 'camisa', cara: 'barba' }, { ropa: 'vestido', pelo: 'largo' }], poses: [['sentado', 2.5], ['toma', 1.6], ['sentado', 1], ['manos', 2]] });
  // la tele, el tiro al blanco y la pizarra
  if (!narrow) {
    tele(ctx, Math.round(room.x(cols * 0.86, 1.4)) - 8, Math.ceil(room.ceilY(1.4)) + 2, 14, 5, { z: 1.4 });
    pizarraEn(ctx, L.x1 - 22, L.alto[0] - 2, L.x1, L.alto[1] + 0, [['SCHOP', '3.000'], ['PISCOLA', '4.500'], ['TERREMOTO', '3.500']], {});
  }
  // tiro al blanco en la pared izquierda
  const dz = 1.4;
  const dX = Math.round(room.x(0, dz));
  const dY = Math.round(room.y(rows * 0.3, dz));
  ctx.at(dz, () => ctx.lines(dX - 1, dY - 2, [' .', '(◘)', " '"]));
  cuadroLado(ctx, -1, 1.12, 1.3, rows * 0.15, rows * 0.4, (c, r, u, v) => (v < 0.2 ? '*' : v < 0.7 ? (c % 2 ? ':' : 0) : '='));
  ventanaLado(ctx, 1, 1.1, 1.4, rows * 0.22, rows * 0.55, { letras: 'BAR', rayos: false });
  const lamps = [lampara(ctx, cols * 0.3, 1.3, 'campana'), lampara(ctx, cols * 0.7, 1.3, 'campana')];
  brillo(ctx, lamps);
  // un dardo que vuela de vez en cuando
  ctx.anim(1.2, (out, t) => {
    const p = (t % 7) / 1.2;
    if (p > 1) return;
    const x = Math.round(dX + 30 - p * 30);
    const y = Math.round(dY - 4 + p * 4 - Math.sin(p * Math.PI) * 3);
    out.text(x, y, '>-');
  });
  clientes(ctx, {
    puntos: [{ X: cols * 0.5, z: ctx.zf(0.12) }],
    periodo: 16,
    dice: ['un schop, maestro', 'dos piscolas', '¿quién va ganando?', 'la cuenta'],
    responde: ['¡salud!', 'al tiro', 'empate', 'son $6.000'],
    vend: { X: Xb, z: zV },
  });
  void E;
  void night;
}

// --- un plano genérico (mientras falte alguno) -------------------------------------------

export function generico(ctx) {
  const { room, cols, b } = ctx;
  room.shell({ floor: 'damero', walls: 'puntos', back: 'liso', seed: ctx.seed });
  letrero(ctx, ctx.vx, b.y0 + 2, ctx.shop.name, 'caja');
  const [ga, gb] = ctx.shop.goods;
  for (const y of [b.y0 + 7, ctx.E - 2, ctx.E + 5, b.y1 - 1]) {
    for (let x = b.x0 + 2; x <= b.x1 - 2; x++) {
      const i = x - b.x0 - 2;
      if (ga[i % ga.length] !== ' ') ctx.g.put(x, y - 2, ga[i % ga.length]);
      if (gb[i % gb.length] !== ' ') ctx.g.put(x, y - 1, gb[i % gb.length]);
    }
    ctx.g.hline(b.x0 + 1, b.x1 - 1, y, '¯');
  }
  const m = planoMeson(ctx, {});
  const zV = ctx.zf(0.6);
  figura(ctx, { X: cols * 0.5, z: zV, look: { ropa: 'delantal' }, poses: [['parado', 2], ['manos', 2]] });
  clientes(ctx, { puntos: [{ X: cols * 0.35, z: ctx.zf(0.2) }], dice: ['¿tiene?'], responde: ['¡claro!'], vend: { X: cols * 0.5, z: zV } });
  void m;
}

export const COMIDA = {
  PANADERÍA: panaderia,
  SANGUCHES: sanguches,
  COMPLETOS: completos,
  'FUENTE DE SODA': fuente,
  EMPANADAS: empanadas,
  HELADOS: helados,
  CAFÉ: cafe,
  BAR: bar,
};
