// Más cuartos: cocina, pieza de niños, escritorio, biblioteca, sala de música,
// comedor, taller de pintura e invernadero. Mismo esquema que casa-cuartos.js:
// la pared del fondo es el escenario (ahí va lo importante, con el título al
// medio), las laterales llevan muebles en perspectiva y el piso, poca cosa.
import { SP, R, sprite, frames, hash2, mirror, rumble, steam, notes, bubbles, hhmm, now } from './casa-kit.js';
import { shell, backWindow, curtains, hangingLamp, floorLamp, rug, outlet, cable, tiles, sideFrame, sideDoor, sideWindow, crosses } from './casa-shell.js';
import { OBJ, FRAMES, sofa2d, table, chair, bed, bookcase, sideShelves, counter, upperCabinets, fridge, piano, pianoSprite, bunkSprite, desk, monitor, screenText, wallShelf, calendar } from './casa-muebles.js';
import { style, twinWindows, hangFrames, wallClock, walker, figure, cat, birdcage, grandfather } from './casa-cuartos.js';
import * as P from './casa-gente.js';

// --- la cocina --------------------------------------------------------------------------
export function kitchen(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  const floorK = K.zone === 'antiguo' ? 'damero' : K.zone === 'centro' ? 'cemento' : 'baldosa';
  shell(K, { ...st, walls: 'azulejo', floor: floorK, cornice: st.cornice });
  // ventana sobre el lavaplatos, a un lado
  const bw = b.x1 - b.x0;
  const right = K.h(71) < 0.5;
  const wcx = Math.round(right ? b.x0 + bw * 0.72 : b.x0 + bw * 0.28);
  const ww = Math.max(8, Math.round(bw * (K.narrow ? 0.34 : 0.22)));
  const wy0 = Math.round(K.sy(Math.min(K.HM - 1.0, 3.5 + Math.max(0, K.HM - 5.2)), Z));
  const wy1 = Math.round(K.sy(1.25, Z));
  const win = backWindow(K, wcx - Math.round(ww / 2), wcx + Math.round(ww / 2), wy0, wy1, { kind: st.win === 'ventanal' ? 'ventanal' : 'doble', down: 0.2 });
  curtains(K, wcx - Math.round(ww / 2), wcx + Math.round(ww / 2), wy0, Math.round((wy0 + wy1) / 2), { w: 2, sheer: true });
  // azulejos del fondo: entre la cubierta y los muebles de arriba
  const ctop = Math.round(K.sy(0.9, Z));
  const tTop = Math.round(K.sy(1.65, Z));
  tiles(K, b.x0, b.x1, tTop, ctop - 1, 4, '_');
  // limpiar los azulejos donde va la ventana
  for (let r = wy0 - 1; r <= wy1 + 1; r++) for (let c = wcx - Math.round(ww / 2); c <= wcx + Math.round(ww / 2); c++) {
    const i = r * cols + c;
    if (K.g.zb[i] >= 99) K.g.data[i] = SP;
  }
  // mueble de cocina de pared a pared
  const zc = Z - 0.004;
  const fW = Math.min(0.75 * K.MX, cols * 0.14);
  const fz0 = zc - K.dz(0.68);
  const fSide = right ? -1 : 1;
  const fX0 = fSide < 0 ? 0 : cols - fW;
  fridge(K, fX0, fX0 + fW, fz0, zc, { magnets: true });
  const cX0 = fSide < 0 ? fW + 0.4 : 0;
  const cX1 = fSide < 0 ? cols : cols - fW - 0.4;
  const cn = counter(K, cX0, cX1, zc, {});
  // cocina a gas en la cubierta, lejos de la ventana
  const stoveX = right ? cols * 0.34 : cols * 0.66;
  const sz = cn.zm;
  const sc = Math.round(K.sx(stoveX, sz));
  const sr = Math.round(K.sy(0.9, sz));
  K.at(sz - 0.001, (g) => {
    g.text(sc - 6, sr, '(_) (_) ');
    g.text(sc - 6, sr - 1, ' _   _  ');
  });
  // perillas en el frente
  const kr = Math.round(K.sy(0.8, cn.z0));
  K.at(cn.z0 - 0.001, (g) => g.text(sc - 5, kr, 'o o o o'));
  // campana sobre la cocina
  const hood = sprite(R`
    |  |
    |  |
 ___|__|___
/__________\
`);
  const hy = Math.round(K.sy(2.35, Z)) - hood.h + 1;
  // la luz de la campana alumbra la cocina
  if (K.night) K.light(sc, sr - 2, 28, 1);
  if (hy > E) K.onBack(hood, sc - 6, hy);
  else K.onBack(hood, sc - 6, E + 1);
  // ollas que hierven
  const pots = [];
  const BIG = sprite(R`
   _n_
 .-----.
-|:::::|-
 |_____|`);
  const potA = K.spot(BIG, stoveX - K.MX * 0.2, sz - 0.002, 0.9);
  const potB = K.spot(OBJ.pan, stoveX + K.MX * 0.3, sz - 0.002, 0.9);
  K.at(sz - 0.002, (g) => {
    g.blit(BIG, potA.x, potA.y);
    g.blit(OBJ.pan, potB.x, potB.y);
  });
  pots.push({ x: potA.x + 4, y: potA.y - 1 }, { x: potB.x + 2, y: potB.y - 1 });
  // el horno bajo la cocina, con su vidrio
  const ov0 = Math.round(K.sx(stoveX - K.MX * 0.38, cn.z0));
  const ov1 = Math.round(K.sx(stoveX + K.MX * 0.38, cn.z0));
  const ovT = Math.round(K.sy(0.66, cn.z0));
  const ovB = Math.round(K.sy(0.14, cn.z0));
  K.at(cn.z0 - 0.001, (g) => {
    g.hline(ov0, ov1, ovT - 1, '_');
    for (let r = ovT; r < ovB; r++) {
      g.put(ov0, r, '|');
      g.put(ov1, r, '|');
      for (let c = ov0 + 1; c < ov1; c++) g.put(c, r, r === ovT ? '=' : r === ovB - 1 ? '_' : c > ov0 + 1 && c < ov1 - 1 && (c + r) % 2 ? ':' : ' ');
    }
  });
  K.anim((d, t) => {
    d.z = sz - 0.003;
    steam(d, pots[0].x, pots[0].y, t, 6, 8, 1);
    steam(d, pots[0].x + 2, pots[0].y, t * 1.2, 3, 6, 5);
    steam(d, pots[1].x, pots[1].y, t * 0.8, 3, 4, 3);
    // la tapa salta cuando hierve fuerte
    if (Math.floor(t * 3) % 5 === 0) d.text(potA.x + 2, potA.y - 1, '_n_');
    // la llama bajo la olla
    d.text(potA.x + 2, potA.y + BIG.h, Math.floor(t * 8) % 2 ? '^^^' : '^v^');
  });
  // lavaplatos bajo la ventana con la llave que gotea
  const sinkX = K.Xat(wcx, sz);
  const kc = Math.round(K.sx(sinkX, sz));
  K.at(sz - 0.001, (g) => {
    g.text(kc - 5, sr, '\\________/');
    g.text(kc - 1, sr - 2, ',-.');
    g.text(kc - 1, sr - 1, '| ');
  });
  K.anim((d, t) => {
    d.z = sz - 0.003;
    const p = (t * 1.3) % 1;
    if (p < 0.7) d.put(kc - 1, sr - 1 + (p > 0.35 ? 1 : 0), p > 0.35 ? '.' : "'");
  });
  // escurridor con platos y otras cosas en la cubierta
  K.at(sz - 0.001, (g) => g.text(kc + 6, sr - 1, '|||/'));
  const onC = (s, X) => K.stand(s, X, sz + K.dz(0.1), 0.9);
  onC(OBJ.toaster, cols * (right ? 0.12 : 0.88));
  onC(OBJ.jar, cols * (right ? 0.2 : 0.8));
  onC(OBJ.kettle, stoveX + K.MX * (right ? -0.6 : 0.6));
  onC(OBJ.fruit, cols * 0.5);
  // microondas con la hora
  const mwX = cols * (right ? 0.22 : 0.78);
  if (!K.narrow) {
    const mw = K.box(mwX - K.MX * 0.3, mwX + K.MX * 0.3, 0.32, sz - K.dz(0.1), zc - K.dz(0.05), { base: 0.9 });
    K.anim((d, t) => {
      d.z = mw.z0 - 0.002;
      d.text(mw.c1 - 6, mw.r0 + 1, hhmm(true, t));
    });
  }
  // muebles colgados (arriba del título) y una repisa con frascos
  const uy0 = Math.round(K.sy(Math.min(K.HM - 1.0, 3.4 + Math.max(0, K.HM - 5.2) * 0.6), Z));
  const uy1 = E - 1;
  if (uy1 - uy0 >= 2) {
    const ua = right ? b.x0 + 2 : wcx + Math.round(ww / 2) + 3;
    const ub = right ? wcx - Math.round(ww / 2) - 3 : b.x1 - 2;
    const ts = Math.floor(K.cols / 2 - 3.5) - 2;
    const te = Math.floor(K.cols / 2 + 3.5) + 1;
    // los muebles no pasan por encima del título (terminan antes o empiezan después)
    if (ub - ua > 10) upperCabinets(K, ua, ub, uy0, uy1 - 1, { door: Math.max(5, Math.round((ub - ua) / Math.max(2, Math.round((ub - ua) / 9)))) });
    void ts;
    void te;
  }
  // lateral: calendario, reloj, utensilios colgados y una puerta
  const os = -fSide;
  sideFrame(K, fSide, K.zf(0.35), K.zf(0.55), 2.0, 2.9, 'afiche');
  wallClock(K, Math.round(K.sx(fSide < 0 ? 0 : cols, K.zf(0.15))) + (fSide < 0 ? 3 : -3), Math.round(K.sy(3.0, K.zf(0.15))), false);
  if (!K.narrow) sideDoor(K, os, K.zf(0.45), K.zf(0.75), 2.2, 'pasillo');
  // riel con utensilios en la otra lateral
  const uz0 = K.zf(0.08);
  const uz1 = K.zf(0.3);
  const ux = os < 0 ? 0 : cols;
  K.line3(ux, 2.2, uz0, ux, 2.2, uz1);
  for (let i = 0; i < 4; i++) {
    const z = uz0 + ((uz1 - uz0) * (i + 0.5)) / 4;
    const c = Math.round(K.sx(ux, z));
    const r = Math.round(K.sy(2.2, z));
    K.at(z, (g) => {
      g.put(c, r + 1, '|');
      g.put(c, r + 2, ['o', 'J', 'Y', '°'][i]);
    });
  }
  // calendario en la pared del fondo, del lado del refrigerador
  const calX = right ? b.x0 + 3 : b.x1 - 14;
  if (!K.narrow) calendar(K, calX, E + 2);
  // la mesa de la cocina con mantel, adelante
  const tz0 = K.zf(0.14);
  const tw = Math.min(1.3 * K.MX, cols * 0.34);
  const td = Math.min(K.dz(0.75), (Z - 1) * 0.28);
  const tb = table(K, K.vx - tw / 2, K.vx + tw / 2, tz0, tz0 + td, 0.76, { cloth: K.zone === 'centro' ? 'liso' : 'cuadros' });
  const onT = (s, f, k) => K.stand(s, K.vx - tw / 2 + tw * f, tz0 + td * k, 0.76);
  onT(OBJ.bread, 0.25, 0.5);
  onT(OBJ.mug, 0.6, 0.4);
  onT(OBJ.bottle, 0.8, 0.6);
  // sillas atrás de la mesa
  for (const f of [0.28, 0.72]) chair(K, K.vx - tw / 2 + tw * f, tz0 + td + K.dz(0.05), 'frente');
  // pocillo del gato en el piso
  const bowlX = cols * (right ? 0.68 : 0.32);
  K.stand(sprite(R`(___)`), bowlX, K.zf(0.6));
  // lámpara sobre la mesa
  hangingLamp(K, K.vx - tw * 0.3, tz0 + td / 2, Math.min(1.6, K.HM - 3.2), st.lamp === 'arana' ? 'pantalla' : st.lamp, { reach: 3 });
  // quién cocina: de espaldas, al lado de la cocina, revolviendo
  if (feat.cook !== false) {
    const cz = cn.z0 - K.dz(0.3);
    const cx = stoveX - K.MX * 0.55 * (right ? 1 : -1);
    const fr = P.tier(K, cz, P.BACK);
    const frs = right ? fr : fr.map(mirror);
    const p = K.spot(frs[0], cx, cz);
    K.anim((d, t) => d.blit(frs[Math.floor(t * 1.6) % frs.length], p.x, p.y, cz));
  }
  if (feat.cat !== false) {
    // el gato comiendo en su pocillo
    const cz = K.zf(0.58);
    const cfr = P.CAT.M;
    const p = K.spot(cfr[0], bowlX + K.MX * 0.3, cz);
    K.anim((d, t) => {
      const k = Math.floor(t * 1.5) % 4 === 0 ? 1 : 0;
      d.blit(cfr[k], p.x, p.y, cz);
      d.blit(P.TAIL.M[Math.floor(t) % 3], p.x + cfr[0].w - 1, p.y + cfr[0].h - 2, cz);
    });
  }
  if (feat.cage && !K.narrow) birdcage(K, right ? b.x1 - 8 : b.x0 + 8, E + 2);
  return { st, win, tb };
}

// --- la pieza de los niños --------------------------------------------------------------
export function kids(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, { ...st, walls: 'rayas', floor: K.zone === 'centro' ? 'moqueta' : 'tablas' });
  const wins = twinWindows(K, st, { f: 0.15 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // estrellas pintadas arriba y un afiche con un cohete sobre el título
  for (let i = 0; i < 22; i++) {
    const c = Math.round(b.x0 + 2 + hash2(i, 3) * (b.x1 - b.x0 - 4));
    const r = Math.round(b.y0 + 1 + hash2(i, 4) * (E - b.y0 - 4));
    if (wins.some((w) => c > w.x0 - 3 && c < w.x1 + 3)) continue;
    K.at(K.Z, (g) => g.put(c, r, i % 3 ? '*' : '+'));
  }
  const rocket = sprite(R`
    /\
   |  |
   |()|
  /|  |\
 /_|__|_\
   /^^\
`);
  if (cB - cA > rocket.w + 4) K.onBack(rocket, Math.round(K.vx - rocket.w / 2), E - 1 - rocket.h);
  // dibujos pegados con cinta debajo del título
  if (cB - cA > 26) {
    K.onBack(FRAMES.dibujo, cA + 1, E + 2);
    K.onBack(FRAMES.dibujo, cB - FRAMES.dibujo.w - 1, E + 3);
  }
  // camarote contra el fondo, a un lado
  const left = K.h(81) < 0.5;
  const zb = Z - 0.08;
  const bX = left ? cols * 0.3 : cols * 0.7;
  const bk = bunkSprite(Math.min((1.05 * K.MX) / zb, cols * 0.26), (1.75 * K.M) / zb);
  const bp = K.stand(bk.s, bX, zb);
  // repisa con juguetes al otro lado
  const tX = left ? cols * 0.68 : cols * 0.32;
  const tW = Math.min(1.1 * K.MX, cols * 0.2);
  const zt = Z - 0.004;
  K.box(tX - tW / 2, tX + tW / 2, 0.55, zt - K.dz(0.4), zt, { front: (c, r, u, v) => (Math.abs(v - 0.45) < 0.1 ? '_' : (c + r) % 4 === 0 ? '.' : SP) });
  K.stand(OBJ.blocks, tX - tW * 0.25, zt - K.dz(0.2), 0.55);
  K.stand(OBJ.ball, tX + tW * 0.05, zt - K.dz(0.2), 0.55);
  K.stand(sprite(R`
 ,_,
(o,o)
{'''}
 " "`), tX + tW * 0.3, zt - K.dz(0.2), 0.55);
  // un niño salta en la cama de abajo
  const kfr = P.KID.S;
  const kx = bp.x + Math.round(bk.s.w * 0.45) - 2;
  const ky = bp.y + bk.lower - 2 - kfr[0].h + 1;
  K.anim((d, t) => {
    const up = Math.floor(t * 2.4) % 2;
    d.blit(kfr[up], kx, ky - up, zb - 0.01);
  });
  // móvil colgado del techo que gira
  const mz = K.zf(0.45);
  let mX = cols * (left ? 0.62 : 0.38);
  if (Math.abs(K.sx(mX, mz) - K.vx) < 10) mX = K.vx + 11 * mz * (left ? 1 : -1);
  const mx = Math.round(K.sx(mX, mz));
  const my = Math.round(K.sy(K.HM - 1.0, mz));
  K.at(mz, (g) => {
    g.vline(mx, Math.round(K.sy(K.HM, mz)) + 1, my - 1, '|');
    g.text(mx - 4, my, '---+---');
  });
  K.anim((d, t) => {
    d.z = mz;
    const items = ['*', '☼', ')', '*'];
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + (i * Math.PI) / 2;
      const x = Math.round(mx + Math.cos(a) * 4);
      d.put(x, my + 1, '|');
      d.put(x, my + 2, items[i]);
    }
  });
  // el trencito en su pista ovalada, en el piso adelante
  const tz = K.zf(0.45);
  const rx = Math.min(K.MX * 1.2, cols * 0.22);
  const tzd = (Z - 1) * 0.2;
  K.flat(0, K.vx - rx * 1.05, K.vx + rx * 1.05, tz - tzd * 1.05, tz + tzd * 1.05, (c, r, X, z) => {
    const u = (X - K.vx) / rx;
    const v = (z - tz) / tzd;
    const dd = Math.sqrt(u * u + v * v);
    return dd < 1.05 && dd > 0.9 ? (dd > 0.98 ? '=' : '-') : 0;
  });
  K.anim((d, t) => {
    for (let i = 0; i < 4; i++) {
      const a = -t * 0.7 + i * 0.3;
      const X = K.vx + Math.cos(a) * rx * 0.97;
      const z = tz + Math.sin(a) * tzd * 0.97;
      const c = Math.round(K.sx(X, z));
      const r = Math.round(K.sy(0, z)) - 1;
      d.z = z - 0.01;
      d.text(c - 1, r, i === 0 ? '[o]>' : '[_]');
      if (i === 0) d.put(c, r - 1 - (Math.floor(t * 3) % 2), '°');
    }
  });
  // el niño jugando en el suelo, al lado de la pista
  const kz = K.zf(0.16);
  const sxk = cols * (left ? 0.7 : 0.3);
  figure(K, P.KID.sit, sxk, kz, 0, 0.7);
  // pelota que rebota y bloques en el piso
  const bz = K.zf(0.12);
  const bx = Math.round(K.sx(cols * (left ? 0.86 : 0.14), bz));
  const by = Math.round(K.sy(0, bz)) - 1;
  K.anim((d, t) => {
    d.z = bz;
    const h = Math.abs(Math.sin(t * 2.6)) * 4;
    d.text(bx, by - Math.round(h), '(o)');
  });
  K.stand(OBJ.blocks, cols * (left ? 0.18 : 0.82), K.zf(0.2));
  // de noche, la lucecita de compañía
  if (K.night) K.light(b.x0 + 3, Math.round(K.sy(0.35, Z)), 14, 0.9);
  if (K.night) K.anim((d) => {
    d.z = K.Z - 0.01;
    d.text(b.x0 + 2, Math.round(K.sy(0.35, Z)), '[o]');
  });
  hangingLamp(K, cols * (left ? 0.36 : 0.64), K.zf(0.25), 1.6, 'globo', { on: true });
  sideFrame(K, -1, K.zf(0.15), K.zf(0.35), 2.0, 2.8, 'afiche');
  sideFrame(K, 1, K.zf(0.2), K.zf(0.4), 2.1, 2.9, 'paisaje');
  if (!K.narrow) sideDoor(K, left ? 1 : -1, K.zf(0.55), K.zf(0.85), 2.1, 'pasillo');
  if (feat.kitten) {
    const z = K.zf(0.08);
    const p = K.spot(P.KITTEN[0], cols * (left ? 0.45 : 0.55), z);
    K.anim((d, t) => {
      d.blit(P.KITTEN[Math.floor(t * 2) % 2], p.x, p.y, z);
      const yx = p.x + P.KITTEN[0].w + 2 + Math.round(Math.sin(t * 0.9) * 3);
      d.blit(P.YARN[Math.floor(t * 3) % 2], yx, p.y + 1, z);
    });
  }
  return { st, wins };
}

// --- el escritorio: alguien escribe frente a la pantalla -------------------------------------
export function study(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, st);
  const wins = twinWindows(K, st, { f: 0.16 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // corcho con papeles sobre el escritorio, debajo del título
  const cw = Math.min(26, cB - cA - 2);
  if (cw > 10) {
    const cx0 = Math.round(K.vx - cw / 2);
    const cy0 = E + 2;
    const cy1 = Math.round(K.sy(1.55, Z)) - 1;
    if (cy1 - cy0 >= 2) {
      K.at(K.Z - 0.01, (g) => {
        g.hline(cx0, cx0 + cw, cy0 - 1, '_');
        g.hline(cx0 + 1, cx0 + cw - 1, cy1, '_');
        g.vline(cx0, cy0, cy1, '|');
        g.vline(cx0 + cw, cy0, cy1, '|');
        for (let r = cy0; r < cy1; r++) for (let c = cx0 + 1; c < cx0 + cw; c++) g.put(c, r, (c + r) % 3 === 0 ? '.' : SP);
        for (let i = 0; i < Math.floor(cw / 6); i++) {
          const x = cx0 + 2 + i * 6;
          const y = cy0 + (i % 2);
          if (y + 1 >= cy1) continue;
          g.text(x, y, '[==]');
          if (y + 1 < cy1) g.text(x, y + 1, '[__]');
          g.put(x + 1, y, 'o');
        }
      });
    }
  }
  hangFrames(K, cA + 1, cB - 1, b.y0 + 3, E - 2, 2, ['diploma', 'mapa', 'foto']);
  if (cB - cA > 30) wallClock(K, cB - 4, E - 3, false);
  // el escritorio contra el fondo con su monitor, lámpara y papeles
  const zd = Z - 0.004;
  const dw = Math.min(1.6 * K.MX, (cB - cA + 10) * Z);
  const dz0 = zd - K.dz(0.7);
  desk(K, K.vx - dw / 2, K.vx + dw / 2, dz0, zd, {});
  const sc = monitor(K, K.vx - dw * 0.08, zd - K.dz(0.25), 0.76, { w: 0.62, hh: 0.4 });
  K.stand(OBJ.lampD, K.vx + dw * 0.36, zd - K.dz(0.3), 0.76);
  K.stand(OBJ.papers, K.vx + dw * 0.2, dz0 + K.dz(0.2), 0.76);
  const mug = K.spot(OBJ.mug, K.vx - dw * 0.38, dz0 + K.dz(0.25), 0.76);
  K.at(dz0, (g) => g.blit(OBJ.mug, mug.x, mug.y));
  K.anim((d, t) => {
    screenText(d, sc, t, K.seed % 5);
    d.z = dz0;
    steam(d, mug.x + 1, mug.y - 1, t, 3, 3, 2);
  });
  // de noche, la lámpara del escritorio alumbra
  if (K.night) {
    const lp = K.spot(OBJ.lampD, K.vx + dw * 0.36, zd - K.dz(0.3), 0.76);
    K.light(lp.x, lp.y + 2, 26, 1);
    K.light((sc.x0 + sc.x1) / 2, (sc.y0 + sc.y1) / 2, 14, 0.8);
    K.anim((d) => {
      d.z = dz0 - 0.001;
      d.put(lp.x - 1, lp.y + 2, "'");
      d.put(lp.x - 2, lp.y + 3, '.');
      d.put(lp.x - 3, lp.y + 4, '.');
    });
  }
  // quien escribe, de espaldas, en su silla
  const pz = dz0 - K.dz(0.25);
  const fr = P.SIT_BACK.type;
  const pp = K.spot(fr[0], K.vx - dw * 0.08, pz);
  K.anim((d, t) => {
    const k = Math.floor(t * 4) % 2;
    d.blit(fr[k], pp.x, pp.y, pz);
  });
  // el gato durmiendo arriba del escritorio
  if (feat.cat !== false && dw > 30) {
    const cz = zd - K.dz(0.35);
    const p = K.spot(P.CAT_SLEEP[0], K.vx + dw * 0.18 + K.MX * 0.15, cz, 0.76);
    K.anim((d, t) => d.blit(P.CAT_SLEEP[Math.floor(t * 0.7) % 2], p.x, p.y, cz));
  }
  // estantes llenos en las dos paredes
  sideShelves(K, -1, K.zf(0.05), K.zf(0.6), { h: Math.min(K.HM - 0.6, 3.4) });
  sideShelves(K, 1, K.zf(0.05), K.zf(0.45), { h: Math.min(K.HM - 0.6, 3.4) });
  if (!K.narrow) sideDoor(K, 1, K.zf(0.6), K.zf(0.88), 2.2, 'pasillo');
  // cables al enchufe y el canasto de papeles
  const ot = outlet(K, cols - 1, K.zf(0.95), 0.3);
  cable(K, Math.round(K.sx(K.vx + dw * 0.3, zd)), Math.round(K.sy(0.05, zd)), ot.c - 1, ot.r, zd - 0.01);
  K.stand(OBJ.basket, cols * 0.62, K.zf(0.4));
  K.stand(sprite(R`
 _ _
(_(_)
`), cols * 0.64, K.zf(0.36));
  // pila de libros en el piso y una silla de lectura
  K.stand(sprite(R`
 ____
|____|
|____|_
|______|`), cols * 0.3, K.zf(0.2));
  rug(K, cols * 0.3, cols * 0.7, K.zf(0.06), K.zf(0.6), 'lisa');
  hangingLamp(K, K.vx - cols * 0.16, K.zf(0.35), 1.8, st.lamp, { reach: 3 });
  return { st, wins };
}

// --- la biblioteca: estantes por todas partes y alguien leyendo ---------------------------------
export function library(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, { ...st, walls: 'liso' });
  // al centro del fondo, una ventana alta; a los lados, estantes hasta el techo
  const wins = twinWindows(K, st, { single: true, f: K.narrow ? 0.36 : 0.18, h0: 0.9 });
  const w = wins[0];
  const zb = Z - 0.004;
  const H = Math.min(K.HM - 0.4, 4.2);
  const l0 = K.Xat(b.x0, zb);
  const l1 = K.Xat(w.x0 - 3, zb);
  const r0 = K.Xat(w.x1 + 3, zb);
  const r1 = K.Xat(b.x1, zb);
  if (l1 - l0 > K.MX * 0.5) bookcase(K, l0, l1, zb, { h: H });
  if (r1 - r0 > K.MX * 0.5) bookcase(K, r0, r1, zb, { h: H });
  // estantes en las laterales, de punta a punta
  sideShelves(K, -1, K.zf(0.02), K.zf(0.98), { h: H });
  sideShelves(K, 1, K.zf(0.02), K.zf(0.6), { h: H });
  if (!K.narrow) sideDoor(K, 1, K.zf(0.66), K.zf(0.94), 2.3, 'pasillo');
  // escalera de biblioteca apoyada en el estante izquierdo
  const lz = K.zf(0.4);
  const lx = K.sx(K.MX * 0.34, lz);
  for (let h = 0.2; h < 3.2; h += 0.35) {
    const z = lz - 0.02 + (h / 3.2) * 0.04;
    K.at(z - 0.03, (g) => g.text(Math.round(lx + h * 1.2), Math.round(K.sy(h, z)), '|-|'));
  }
  // sillón de lectura con lámpara de pie y mesita con té
  const az = K.zf(0.3);
  const ac = sofa2d(K, cols * 0.42, az, 0.95, { n: 1, hm: 1.15, pattern: 'rayas' });
  const rd = P.SIT_FRONT.M;
  const rx = ac.seats[0] - Math.floor(rd[0].w / 2);
  K.anim((d, t) => {
    const k = Math.floor(t / 3.5) % 2;
    d.blit(rd[k], rx, ac.seatRow - 5, az - 0.005);
  });
  floorLamp(K, cols * 0.42 - K.MX * 0.85, az + 0.003);
  const tx = cols * 0.42 + K.MX * 0.8;
  table(K, tx - K.MX * 0.22, tx + K.MX * 0.22, az - K.dz(0.15), az + K.dz(0.2), 0.55);
  const tp = K.spot(OBJ.teapot, tx, az, 0.55);
  K.at(az, (g) => g.blit(OBJ.teapot, tp.x, tp.y));
  K.anim((d, t) => {
    d.z = az - 0.01;
    steam(d, tp.x + 3, tp.y - 1, t, 3, 4, 5);
  });
  // globo terráqueo, pilas de libros
  K.stand(OBJ.globe, cols * 0.66, K.zf(0.5), 0);
  K.stand(sprite(R`
 ___
|___|
|___|_
|_____|`), cols * 0.75, K.zf(0.2));
  // un busto sobre su columna bajo la ventana
  K.stand(sprite(R`
  .-.
 (· ·)
  )-(
 /___\
  | |
  | |
 _|_|_`), K.Xat(Math.round((w.x0 + w.x1) / 2), zb - 0.02), zb - 0.02);
  rug(K, cols * 0.28, cols * 0.72, K.zf(0.06), K.zf(0.7), 'persa');
  hangingLamp(K, cols * 0.62, K.zf(0.4), 2.0, st.lamp, { reach: 4 });
  // alguien busca un libro arriba de la escalera de vez en cuando
  walker(K, K.zf(0.75), { mode: 'visita', x0: K.sx(cols, K.zf(0.75)) - 6, xm: K.sx(cols * 0.7, K.zf(0.75)), speed: 2.5, period: 26, phase: 9, pause: 6 });
  return { st, wins };
}

// --- la sala de música -----------------------------------------------------------------------
export function music(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, st);
  const wins = twinWindows(K, st, { f: 0.16 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  hangFrames(K, cA + 1, cB - 1, b.y0 + 3, E - 2, 2, ['afiche', 'retrato', 'afiche']);
  const zb = Z - 0.004;
  const guitar = feat.guitar;
  // el piano contra el fondo, al centro (dibujado de frente a su medida)
  const pzb = zb - K.dz(0.3);
  const pw = Math.min((1.8 * K.MX) / pzb, (cB - cA) * 0.95);
  const ph = (1.3 * K.M) / pzb;
  const ps = pianoSprite(pw, ph);
  const pp0 = K.stand(ps.s, K.vx, pzb);
  const pn = { X0: K.Xat(pp0.x, pzb), X1: K.Xat(pp0.x + ps.s.w, pzb), kz0: pzb - K.dz(0.05) };
  const topY = pp0.y;
  // las velas del piano alumbran la partitura
  if (K.night) K.light(K.sx(K.vx, pzb), topY + 2, 30, 1);
  // metrónomo arriba del piano
  const mpX = pp0.x + 3;
  K.at(pzb - 0.001, (g) => g.blit(OBJ.metronome, mpX, topY - OBJ.metronome.h));
  K.anim((d, t) => {
    d.z = pzb - 0.002;
    const k = Math.floor(t * 2) % 2;
    d.put(mpX + 2 + (k ? 1 : -1), topY - 3, k ? '/' : '\\');
  });
  K.at(pzb - 0.001, (g) => g.blit(OBJ.vase, pp0.x + ps.s.w - 6, topY - OBJ.vase.h));
  // quien toca: de espaldas en el banquito, con los brazos que van y vienen
  const pz = pzb - K.dz(0.35);
  if (!guitar) {
    const fr = P.SIT_BACK.piano;
    const pp = K.spot(fr[0], K.Xat(pp0.x + Math.round(ps.s.w * 0.3), pz), pz);
    K.anim((d, t) => {
      d.blit(fr[Math.floor(t * 2.2) % 2], pp.x, pp.y, pz);
      d.z = pzb - 0.01;
      notes(d, Math.round(K.vx) + 6, topY - 1, t, 4, 9, 1);
    });
  }
  // guitarra en su atril y parlantes
  K.stand(sprite(R`
   _
  | |
  |=|
  |=|
 (   )
(  o  )
 (___)
  /|\
`), cols * 0.7, K.zf(0.75));
  K.stand(OBJ.speaker, K.Xat(cA - 2, zb - 0.02), zb - 0.02);
  K.stand(OBJ.speaker, K.Xat(cB + 2, zb - 0.02), zb - 0.02);
  // atril con partitura
  K.stand(sprite(R`
 _____
|♪ ♫ ♪|
|_____|
   |
   |
  /|\
`), cols * 0.3, K.zf(0.55));
  // tocadiscos en una mesita que gira
  const tz = K.zf(0.35);
  const tx = cols * 0.18;
  table(K, tx - K.MX * 0.35, tx + K.MX * 0.35, tz - K.dz(0.2), tz + K.dz(0.25), 0.6);
  const rp = K.spot(OBJ.record, tx, tz, 0.6);
  K.at(tz, (g) => g.blit(OBJ.record, rp.x, rp.y));
  K.anim((d, t) => {
    d.z = tz - 0.01;
    d.put(rp.x + 2, rp.y + 1, ['(', '|', ')', '-'][Math.floor(t * 6) % 4]);
  });
  // repisa con discos en la lateral
  sideShelves(K, -1, K.zf(0.5), K.zf(0.9), { h: 1.2, shelf: 0.4 });
  sideFrame(K, 1, K.zf(0.15), K.zf(0.4), 2.0, 3.2, 'afiche');
  sideFrame(K, -1, K.zf(0.1), K.zf(0.35), 2.1, 3.1, 'retrato');
  if (!K.narrow) sideWindow(K, 1, K.zf(0.55), K.zf(0.9), 1.0, 3.6);
  // con guitarra: alguien sentado de frente en un banquito, adelante
  if (guitar) {
    const gz = K.zf(0.25);
    const p = K.spot(P.GUITAR[0], cols * 0.55, gz);
    K.anim((d, t) => {
      d.blit(P.GUITAR[Math.floor(t * 3) % 2], p.x, p.y, gz);
      d.z = gz - 0.01;
      notes(d, p.x + 13, p.y + 3, t, 3, 7, 2);
    });
    cat(K, cols * 0.35, K.zf(0.3), 0, { size: 'M' });
  } else if (feat.cat !== false) {
    // el gato escucha arriba del piano
    cat(K, K.Xat(pp0.x + ps.s.w - 10, pzb), pzb - 0.003, 0, { size: 'S', y: topY - 1 });
  }
  rug(K, cols * 0.3, cols * 0.7, K.zf(0.08), K.zf(0.6), st.rug);
  hangingLamp(K, cols * 0.66, K.zf(0.35), 1.8, st.lamp, { reach: 3 });
  return { st, wins };
}

// --- el comedor: una pareja cenando ----------------------------------------------------------
export function dining(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, st);
  const wins = twinWindows(K, st, { f: 0.18 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // platos colgados en la pared y un aparador con loza
  if (cB - cA > 20) {
    for (let i = 0; i < 3; i++) K.onBack(FRAMES.plato, Math.round(K.vx - 11 + i * 8), E - 4);
  }
  const zb = Z - 0.004;
  const aw = Math.min(1.8 * K.MX, (cB - cA) * Z * 0.95);
  K.box(K.vx - aw / 2, K.vx + aw / 2, 0.9, zb - K.dz(0.45), zb, {
    front: (c, r, u, v) => (Math.abs(v - 0.35) < 0.06 ? '_' : Math.abs(u - 0.5) < 0.01 || Math.abs(u - 0.25) < 0.01 || Math.abs(u - 0.75) < 0.01 ? '|' : v > 0.4 && (Math.abs(u - 0.2) < 0.02 || Math.abs(u - 0.8) < 0.02) && Math.abs(v - 0.6) < 0.08 ? 'o' : SP),
  });
  // loza arriba del aparador: vitrina
  const vy0 = E + 2;
  const vy1 = Math.round(K.sy(0.92, Z)) - 1;
  const vc0 = Math.round(K.sx(K.vx - aw * 0.42, Z));
  const vc1 = Math.round(K.sx(K.vx + aw * 0.42, Z));
  if (vy1 - vy0 >= 3) {
    K.at(Z - 0.01, (g) => {
      g.hline(vc0, vc1, vy0 - 1, '_');
      g.vline(vc0, vy0, vy1, '|');
      g.vline(vc1, vy0, vy1, '|');
      for (let r = vy0; r <= vy1; r++) for (let c = vc0 + 1; c < vc1; c++) g.put(c, r, (r - vy0) % 2 === 1 ? '_' : (c - vc0) % 3 === 0 ? 'o' : (c - vc0) % 3 === 1 ? 'Y' : SP);
    });
  }
  // la mesa al medio con mantel
  const tz0 = K.zf(0.3);
  const tw = Math.min(1.5 * K.MX, cols * 0.34);
  const td = Math.min(K.dz(0.9), (Z - 1) * 0.3);
  table(K, K.vx - tw / 2, K.vx + tw / 2, tz0, tz0 + td, 0.76, { cloth: 'liso' });
  const at = (s, f, k) => K.spot(s, K.vx - tw / 2 + tw * f, tz0 + td * k, 0.76);
  const g = K.g;
  const pl = [at(OBJ.bowl, 0.3, 0.5), at(OBJ.bowl, 0.7, 0.5)];
  K.at(tz0 + td * 0.5, () => {
    for (const p of pl) g.blit(OBJ.bowl, p.x, p.y);
  });
  const wine = [at(OBJ.wine, 0.4, 0.45), at(OBJ.wine, 0.6, 0.45)];
  const cand = at(OBJ.candle, 0.5, 0.55);
  if (K.night) K.light(cand.x + 1, cand.y, 26, 1);
  K.at(tz0 + td * 0.55, () => g.blit(OBJ.candle, cand.x, cand.y));
  K.anim((d, t) => {
    const { shake } = rumble(t);
    d.z = tz0 + td * 0.44;
    // las copas tintinean cuando pasa el tren
    for (let i = 0; i < 2; i++) d.blit(OBJ.wine, wine[i].x + (shake && Math.floor(t * 16 + i) % 2 ? 1 : 0), wine[i].y, tz0 + td * 0.44);
    if (shake && Math.floor(t * 8) % 3 === 0) d.put(wine[1].x + 4, wine[1].y, '*');
    // la llama de la vela
    d.z = tz0 + td * 0.54;
    d.put(cand.x + 1, cand.y, ['(', ')', "'", ','][Math.floor(t * 7) % 4]);
    // el vapor de los platos
    steam(d, pl[0].x + 1, pl[0].y - 1, t, 2, 3, 1);
    steam(d, pl[1].x + 1, pl[1].y - 1, t, 2, 3, 4);
  });
  // la pareja, de perfil, uno frente al otro
  const sz = tz0 + td * 0.5;
  const L = P.SIT_SIDE.M;
  const Rr = L.map(mirror);
  const xl = Math.round(K.sx(K.vx - tw / 2, sz)) - L[0].w + 3;
  const xr = Math.round(K.sx(K.vx + tw / 2, sz)) - 3;
  const y = Math.round(K.sy(0, sz)) - L[0].h;
  K.anim((d, t) => {
    d.blit(L[Math.floor(t / 2.2) % 2], xl, y, sz);
    d.blit(Rr[Math.floor(t / 2.2 + 0.5) % 2], xr, y, sz);
  });
  hangingLamp(K, K.vx, sz, K.HM - 1.8 - 0.3, st.lamp === 'arana' ? 'arana' : 'pantalla', { reach: 3 });
  rug(K, cols * 0.25, cols * 0.75, K.zf(0.15), K.zf(0.75), st.rug);
  // laterales: cuadros y una puerta a la cocina iluminada
  sideFrame(K, -1, K.zf(0.12), K.zf(0.35), 2.0, 3.1, 'paisaje');
  sideFrame(K, 1, K.zf(0.12), K.zf(0.3), 2.1, 3.0, 'retrato');
  if (!K.narrow) sideDoor(K, 1, K.zf(0.5), K.zf(0.8), 2.2, 'baño');
  K.stand(OBJ.plantL, cols * 0.08, K.zf(0.6));
  wallClock(K, Math.round(K.sx(0, K.zf(0.6))) + 3, Math.round(K.sy(2.8, K.zf(0.6))), false);
  return { st, wins };
}

// --- el taller: alguien pinta en el caballete ----------------------------------------------------
export function studio(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, { ...st, walls: K.zone === 'antiguo' ? 'liso' : st.walls, floor: 'tablas' });
  const wins = twinWindows(K, st, { f: 0.2, curtains: false });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // cuadros colgados y apoyados
  hangFrames(K, cA + 1, cB - 1, b.y0 + 3, E - 2, 2, ['abstracto', 'paisaje', 'retrato', 'barco']);
  const zb = Z - 0.004;
  for (let i = 0; i < 3; i++) {
    const X = K.Xat(cA + 2 + i * 7, zb);
    K.box(X, X + K.MX * 0.35, 0.7 - i * 0.12, zb - K.dz(0.06) - i * 0.003, zb - i * 0.003, { front: (c, r) => ((c + r) % 3 === 0 ? ':' : SP) });
  }
  // la naturaleza muerta en una mesita: florero
  const nz = K.zf(0.6);
  const nx = cols * 0.6;
  table(K, nx - K.MX * 0.3, nx + K.MX * 0.3, nz - K.dz(0.2), nz + K.dz(0.2), 0.7, { cloth: 'liso' });
  K.stand(OBJ.flowers, nx, nz, 0.7);
  // el caballete con la tela, que se va llenando de trazos
  const ez = K.zf(0.28);
  const ex = cols * 0.42;
  const ew = Math.min(0.75 * K.MX, cols * 0.2);
  const cv = K.box(ex - ew / 2, ex + ew / 2, 0.9, ez, ez + K.dz(0.03), { base: 0.85 });
  K.line3(ex - ew * 0.35, 0.85, ez - 0.002, ex - ew * 0.5, 0, ez - 0.002);
  K.line3(ex + ew * 0.35, 0.85, ez - 0.002, ex + ew * 0.5, 0, ez - 0.002);
  K.line3(ex, 1.75, ez + 0.01, ex, 0, ez + K.dz(0.35));
  const marks = [];
  for (let r = cv.r0; r <= cv.r1 - 1; r++) for (let c = cv.c0 + 1; c < cv.c1; c++) marks.push([c, r]);
  marks.sort((a, b2) => hash2(a[0], a[1]) - hash2(b2[0], b2[1]));
  const GL = ['~', '.', ':', '/', '(', ')', 'o', '*'];
  K.anim((d, t) => {
    d.z = ez - 0.001;
    const n = Math.floor(((t * 1.4) % 60) / 60 * marks.length);
    for (let i = 0; i < n; i++) {
      const [c, r] = marks[i];
      // el cuadro es el florero de la mesita
      const u = (c - cv.c0) / (cv.c1 - cv.c0);
      const v = (r - cv.r0) / Math.max(1, cv.r1 - cv.r0);
      const ch = v > 0.6 && Math.abs(u - 0.5) < 0.18 ? '(' : v < 0.55 && Math.abs(u - 0.5) < 0.35 ? (hash2(c, r) < 0.5 ? 'o' : '*') : GL[Math.floor(hash2(c * 3, r) * GL.length)];
      d.put(c, r, ch);
    }
  });
  // el pintor de perfil, con el pincel
  const pz = ez + 0.002;
  const fr = P.PAINT;
  const p = K.spot(fr[0], ex - ew / 2 - K.MX * 0.35, pz);
  K.anim((d, t) => d.blit(fr[Math.floor(t * 1.8) % 2], p.x, p.y, pz));
  // frascos de pintura y pinceles en un banquito
  const bz = K.zf(0.18);
  table(K, cols * 0.66 - K.MX * 0.25, cols * 0.66 + K.MX * 0.25, bz - K.dz(0.15), bz + K.dz(0.15), 0.5);
  K.stand(sprite(R`
 \|/ _
 |_|(_)[]`), cols * 0.66, bz, 0.5);
  sideShelves(K, -1, K.zf(0.3), K.zf(0.9), { h: 1.4 });
  sideFrame(K, 1, K.zf(0.1), K.zf(0.35), 1.8, 3.4, 'abstracto');
  sideFrame(K, 1, K.zf(0.45), K.zf(0.62), 2.0, 3.0, 'paisaje');
  K.stand(OBJ.palm, cols * 0.9, K.zf(0.5));
  // salpicaduras en el piso
  K.flat(0, cols * 0.3, cols * 0.6, K.zf(0.1), K.zf(0.4), (c, r) => (hash2(c * 7, r * 3) < 0.05 ? (hash2(c, r) < 0.5 ? '°' : '.') : 0));
  hangingLamp(K, cols * 0.4, K.zf(0.2), 2.0, 'campana', { reach: 4 });
  if (feat.cat !== false) cat(K, cols * 0.78, K.zf(0.15), 0, { size: 'M' });
  return { st, wins };
}

// --- invernadero: plantas por todos lados y alguien que riega -----------------------------------
export function plants(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, { ...st, floor: 'baldosa' });
  const wins = twinWindows(K, st, { f: 0.22, curtains: false });
  const zb = Z - 0.004;
  // repisas con macetas en la pared del fondo, al centro
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  if (cB - cA > 12) {
    for (const h of [1.2, 1.9]) wallShelf(K, cA + 1, cB - 1, Math.round(K.sy(h, Z)), ['plantS', 'cactus', 'plantS', 'vase', 'plantS', 'cactus']);
  }
  // macetas grandes en el piso del fondo
  const kinds = [OBJ.plantL, OBJ.palm, OBJ.fern, OBJ.plantM, OBJ.cactus, OBJ.plantL];
  for (let i = 0; i < 6; i++) K.stand(kinds[i], cols * (0.12 + i * 0.152), zb - K.dz(0.25) - i * 0.002);
  // colgantes que se mecen
  const hangs = [];
  for (let i = 0; i < 4; i++) {
    const z = K.zf(0.2 + i * 0.15);
    const X = cols * (0.2 + i * 0.2);
    hangs.push({ z, x: Math.round(K.sx(X, z)), top: Math.round(K.sy(K.HM, z)) + 1, len: 3 + (i % 2) * 2 });
  }
  K.anim((d, t) => {
    const sw = rumble(t).swing;
    for (let i = 0; i < hangs.length; i++) {
      const hg = hangs[i];
      d.z = hg.z;
      const off = Math.round(Math.sin(t * 0.9 + i) * 0.6 + sw * Math.sin(t * 3 + i) * 1.5);
      for (let r = 0; r < hg.len; r++) d.put(hg.x + Math.round((off * r) / hg.len), hg.top + r, '|');
      d.blit(OBJ.hangPlant, hg.x + off - 2, hg.top + hg.len, hg.z);
    }
  });
  // las plantas del frente se mueven con la brisa
  const big = [];
  for (const [f, z] of [[0.08, K.zf(0.04)], [0.92, K.zf(0.06)]]) big.push(K.spot(OBJ.plantL, cols * f, z));
  K.anim((d, t) => {
    for (let i = 0; i < big.length; i++) {
      const p = big[i];
      d.z = K.zf(0.03);
      const k = Math.sin(t * 1.1 + i * 2) > 0.3;
      d.blit(OBJ.plantL, p.x + (k ? 1 : 0), p.y, K.zf(0.03));
    }
  });
  // estantes laterales con macetas
  sideShelves(K, -1, K.zf(0.3), K.zf(0.85), { h: 1.6, shelf: 0.5 });
  sideWindow(K, 1, K.zf(0.15), K.zf(0.75), 0.9, 3.8);
  // quien riega, de perfil, con las gotas que caen
  const wz = K.zf(0.35);
  const fr = P.WATER;
  const left = K.h(91) < 0.5;
  const wx = cols * (left ? 0.36 : 0.56);
  const p = K.spot(fr[0], wx, wz);
  K.stand(OBJ.plantM, wx + K.MX * 0.75, wz + 0.002);
  K.anim((d, t) => {
    const k = Math.floor(t * 1.2) % 2;
    d.blit(fr[k], p.x, p.y, wz);
    d.z = wz - 0.01;
    const q = (t * 2) % 1;
    d.put(p.x + 13, p.y + 6 + Math.floor(q * 3), q < 0.5 ? "'" : '.');
    d.put(p.x + 14, p.y + 6 + Math.floor(((q + 0.4) % 1) * 3), '.');
  });
  // regadera grande y un saco de tierra
  K.stand(sprite(R`
 ____
(____)
|::::|
|____|`), cols * 0.72, K.zf(0.2));
  // mariposa que entra por la ventana
  K.anim((d, t) => {
    d.z = K.zf(0.5);
    const x = Math.round(cols * 0.5 + Math.sin(t * 0.5) * cols * 0.2);
    const y = Math.round(K.E + 4 + Math.sin(t * 1.7) * 3);
    d.put(x, y, Math.floor(t * 6) % 2 ? '>' : 'x');
  });
  if (feat.cat) cat(K, cols * 0.3, K.zf(0.12), 0, { size: 'M' });
  hangingLamp(K, K.vx + cols * 0.18, K.zf(0.6), 1.6, 'campana', { reach: 3 });
  void E;
  void b;
  return { st, wins };
}

// --- salón con reloj de pie (y un cucú) ------------------------------------------------------------
export function clockRoom(K, feat = {}) {
  // un living con un reloj de pie al fondo y una colección de relojes en la pared
  const { b, E, Z } = K;
  const gx = K.Xat(b.x1 - 5, Z - 0.02);
  grandfather(K, gx, Z - 0.006);
  // cucú: cada minuto sale el pajarito
  const cx = b.x0 + 5;
  const cy = E + 2;
  K.onBack(sprite(R`
  /\
 /__\
 |[]|
 |__|
  ||
  ()`), cx - 2, cy);
  K.anim((d, t) => {
    d.z = Z - 0.02;
    const s = now().s;
    if (s < 4 && Math.floor(t * 3) % 2) d.text(cx - 4, cy + 2, '>v cucú');
  });
  void feat;
}
