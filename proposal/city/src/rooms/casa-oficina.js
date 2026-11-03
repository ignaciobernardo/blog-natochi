// Oficinas: se entra por una ventana de una torre del centro. Escritorios con
// computadores y gente que escribe de espaldas, una sala de reuniones de
// vidrio al fondo (el título queda sobre su marco, como un letrero), la
// impresora, el bidón de agua con burbujas, plantas, persianas y el reloj.
// De noche quedan pocos: alguien trasnochando con su lámpara o el aseo.
import { SP, R, sprite, frames, hash2, mirror, rumble, bubbles, steam, hhmm } from './casa-kit.js';
import { walls, floor, edges, backWindow, frontBlinds, hangingLamp, sideFrame, sideWindow, sideDoor, crosses, outlet, cable } from './casa-shell.js';
import { OBJ, FRAMES, table, monitor, screenText, wallShelf, sideShelves } from './casa-muebles.js';
import { wallClock, walker } from './casa-cuartos.js';
import * as P from './casa-gente.js';

// alguien con un trapero (el aseo de noche)
const MOP = {
  M: frames(R`
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::|\
(  |:::| \
 ª.|___|  \
   | | |   \
   | | |    \
   |_|_|   _\_
  (__|__) (___)
--
    .-.
   (· ·)
    )-(
  .'   ª.
 / |:::|\
(  |:::| |
 ª.|___| |
   | | | |
   | | | |
   |_|_| |
  (__|__)(___)`),
};

// con una taza o unos papeles, caminando
const CARRY = {
  M: frames(R`
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\_[]
  |:::|
  |___|
   / \
  /   \
 /     \
'-     '-
--
   .-.
  (  ·)
   )-(
  .' ª.
  |:::|\_[]
  |:::|
  |___|
   | |
   | |
   | |
   '-'-`),
};

// gráfico de barras en la pizarra: crece y vuelve a empezar
function chart(d, x0, y0, w, h, t) {
  const n = Math.max(3, Math.floor(w / 3));
  const k = (t / 4) % 1;
  for (let i = 0; i < n; i++) {
    const hh = Math.max(1, Math.round((0.3 + 0.7 * hash2(i, 5)) * h * Math.min(1, k * 1.6 + 0.2) * (0.5 + i / n / 2)));
    for (let r = 0; r < hh; r++) d.put(x0 + i * 3, y0 + h - 1 - r, '|');
  }
}

export function office(K) {
  const { g, b, E, cols, Z, night } = K;
  const key = K.key;
  // la caja: paredes lisas o de hormigón, alfombra de palmetas y luces de tubo
  walls(K, K.zone === 'antiguo' ? 'papel' : K.pick(['liso', 'hormigon'], 2), { cornice: K.zone === 'antiguo' });
  floor(K, 'flexit', K.seed);
  // palmetas de alfombra: la mitad punteadas
  K.flat(0, 0, cols, 1, Z, (c, r, X, z) => {
    if (g.get(c, r) !== SP) return 0;
    const i = Math.floor(X / (K.MX * 0.6));
    const j = Math.floor((z - 1) / 0.08);
    return (i + j) % 2 === 0 && (c + r) % 3 === 0 ? '.' : 0;
  });
  // luces de tubo en el techo (de noche algunas apagadas, una titila)
  const tubes = [];
  for (let z = 1.12; z < Z - 0.05; z += 0.16) for (const f of [0.25, 0.5, 0.75]) tubes.push({ X: cols * f, z });
  for (const tb of tubes) {
    const a = Math.round(K.sx(tb.X - K.MX * 0.5, tb.z));
    const bb = Math.round(K.sx(tb.X + K.MX * 0.5, tb.z));
    const r = Math.round(K.sy(K.HM, tb.z)) + 1;
    K.at(tb.z, () => {
      g.put(a - 1, r, '[');
      g.put(bb + 1, r, ']');
      for (let c = a; c <= bb; c++) g.put(c, r, '=');
    });
    tb.a = a;
    tb.b = bb;
    tb.r = r;
  }
  if (night) tubes.forEach((tb, i) => {
    if (hash2(i, 11) >= 0.55) K.light((tb.a + tb.b) / 2, tb.r + 3, 26, 0.9);
  });
  K.anim((d, t) => {
    for (let i = 0; i < tubes.length; i++) {
      const tb = tubes[i];
      const off = night ? hash2(i, 11) < 0.55 : false;
      const flick = i === 4 && hash2(Math.floor(t * 9), 2) < (night ? 0.3 : 0.08);
      if (off || flick) {
        d.z = tb.z;
        for (let c = tb.a; c <= tb.b; c++) d.put(c, tb.r, '-');
      }
    }
  });
  edges(K);

  // ventanas altas con persianas a los lados del fondo
  const bw = b.x1 - b.x0;
  const hy0 = Math.round(K.sy(4.3, Z));
  const hy1 = Math.round(K.sy(2.8, Z));
  for (const f of K.narrow ? [0.5] : [0.18, 0.82]) {
    const cx = Math.round(b.x0 + bw * f);
    const ww = Math.round(bw * (K.narrow ? 0.5 : 0.26));
    if (K.narrow && hy1 >= E - 1) continue;
    backWindow(K, cx - Math.round(ww / 2), cx + Math.round(ww / 2), hy0, hy1, { kind: 'persiana', down: key === 'persianaM' ? 0.6 : 0.35, level: 8, transom: false, sill: false });
  }
  // el reloj al centro, arriba del título
  wallClock(K, Math.round(K.vx), Math.round((hy0 + E) / 2) - 1, !K.narrow);
  // logo de la empresa
  if (!K.narrow) K.at(K.Z, (gg) => gg.text(Math.round(K.vx) - 5, hy0 - 1, '· A R C O ·'));

  // la sala de reuniones de vidrio, al centro del fondo
  const mw = Math.round(Math.min(bw * 0.46, 56));
  const m0 = Math.round(K.vx - mw / 2);
  const m1 = m0 + mw;
  const mt = E + 1;
  const mb = Math.round(K.sy(0, Z)) - 1;
  K.at(Z - 0.002, () => {
    g.hline(m0, m1, mt - 1, '_');
    for (let r = mt; r <= mb; r++) {
      g.put(m0, r, '|');
      g.put(m1, r, '|');
      for (let c = m0 + 1; c < m1; c++) g.put(c, r, SP);
    }
    for (let c = m0 + Math.round(mw / 4); c < m1; c += Math.round(mw / 4)) g.vline(c, mt, mb, ':');
    // reflejos en el vidrio
    for (let i = 0; i < 3; i++) g.put(m0 + 3 + i * 9, mt + 1 + i, '/');
  });
  // adentro: la pizarra y la mesa con gente
  const wbx0 = m0 + 4;
  const wbx1 = m0 + Math.round(mw * 0.42);
  const wby0 = mt + 1;
  const wby1 = Math.min(mb - 3, mt + 6);
  K.at(Z - 0.003, () => {
    g.hline(wbx0, wbx1, wby0 - 1, '_');
    g.vline(wbx0 - 1, wby0, wby1, '|');
    g.vline(wbx1 + 1, wby0, wby1, '|');
    g.hline(wbx0, wbx1, wby1, '_');
  });
  const tableY = Math.round(mt + (mb - mt) * 0.55);
  K.at(Z - 0.003, () => {
    g.text(m0 + Math.round(mw * 0.5), tableY, '_'.repeat(Math.round(mw * 0.4)));
    g.put(m0 + Math.round(mw * 0.5), tableY + 1, '|');
    g.put(m0 + Math.round(mw * 0.9), tableY + 1, '|');
  });
  const meet = !night || key === 'lampara' ? 3 : 0;
  K.anim((d, t) => {
    d.z = Z - 0.004;
    chart(d, wbx0 + 1, wby0, wbx1 - wbx0 - 1, wby1 - wby0, t);
    for (let i = 0; i < meet; i++) {
      const x = m0 + Math.round(mw * 0.54) + i * 6;
      d.text(x, tableY - 2, hash2(Math.floor(t / 2), i) < 0.2 ? ' o/' : ' o ');
      d.text(x, tableY - 1, '/|\\');
    }
    // quien presenta apunta a la pizarra
    if (meet) {
      const k = Math.floor(t / 1.5) % 2;
      d.text(wbx1 + 2, tableY - 3, ' o');
      d.text(wbx1 + 2, tableY - 2, k ? '/|' : '-|');
      d.text(wbx1 + 2, tableY - 1, '/ \\');
    }
  });

  // pared izquierda: archivadores, impresora y bidón de agua
  const fz0 = K.zf(0.08);
  const fz1 = K.zf(0.45);
  const fd = Math.min(0.5 * K.MX, cols * 0.08);
  K.box(0, fd, 1.3, fz0, fz1, {
    side: (c, r, u, h) => (crosses(K, r, K.zAtCol(fd, c), 0.32, 0.02) ? '_' : Math.abs(((u * 4) % 1) - 0.5) < 0.06 && h > 0.1 ? '|' : ((u * 4) % 1) > 0.42 && ((u * 4) % 1) < 0.58 && Math.abs((h % 0.32) - 0.2) < 0.04 ? '-' : SP),
  });
  // impresora arriba de los archivadores, con la hoja que sale
  const prz = K.zf(0.2);
  const prX = fd * 0.5;
  const pr = K.spot(sprite(R`
 _____
|=====|
|_[o]_|`), prX, prz, 1.3);
  K.at(prz, (gg) => gg.blit(sprite(R`
 _____
|=====|
|_[o]_|`), pr.x, pr.y));
  K.anim((d, t) => {
    d.z = prz - 0.002;
    const p = (t % 6) / 6;
    if (p < 0.5) {
      const n = Math.floor(p * 8);
      for (let i = 0; i < n; i++) d.text(pr.x + 1, pr.y - 1 - i, '|¯¯|'.slice(0, 4));
      d.put(pr.x + 6, pr.y + 1, Math.floor(t * 6) % 2 ? '*' : 'o');
    }
  });
  // bidón de agua con burbujas
  const wz = K.zf(0.62);
  const wX = cols - K.MX * 0.45;
  const wc = K.spot(sprite(R`
 .-.
(   )
 ) (
(___)
|[ ]|
|   |
|___|`), wX, wz);
  K.at(wz, (gg) => gg.blit(sprite(R`
 .-.
(   )
 ) (
(___)
|[ ]|
|   |
|___|`), wc.x, wc.y));
  K.anim((d, t) => {
    d.z = wz - 0.002;
    if (Math.floor(t / 5) % 3 === 0) bubbles(d, wc.x + 2, wc.y + 1, wc.y + 3, t * 2, 2, 1);
  });
  K.stand(OBJ.plantL, K.sx(0, K.zf(0.85)) < 0 ? fd : fd * 0.8, K.zf(0.85));
  // pared derecha: ventanas con persianas, una pizarra de corcho y un perchero
  sideWindow(K, 1, K.zf(0.06), K.zf(0.42), 1.0, 3.8);
  sideFrame(K, 1, K.zf(0.52), K.zf(0.7), 1.4, 2.4, 'afiche');
  K.stand(sprite(R`
 _|_
(\|/)
  |
  |
  |
 /|\
`), cols - K.MX * 0.45, K.zf(0.85));
  K.stand(OBJ.palm, cols - K.MX * 0.6, K.zf(0.4));

  // escritorios adelante a los dos lados del pasillo, con la gente de espaldas
  const dz0 = K.zf(0.22);
  const dd = Math.min(K.dz(0.75), (Z - 1) * 0.25);
  const dw = Math.min(1.5 * K.MX, cols * 0.2);
  const people = night ? (key === 'escritorio' || key === 'persona' || key === 'lampara' ? 1 : 0) : 3;
  const desks = K.narrow ? [0.5] : [0.2, 0.42, 0.58, 0.8];
  let seat = 0;
  desks.forEach((f, i) => {
    const X = cols * f;
    table(K, X - dw / 2, X + dw / 2, dz0, dz0 + dd, 0.75);
    // separador bajo entre puestos
    const sc = monitor(K, X - dw * 0.1, dz0 + dd * 0.6, 0.75, { w: 0.55, hh: 0.36 });
    const k = i;
    const on = !night || seat < people;
    K.anim((d, t) => {
      if (on) screenText(d, sc, t + k * 3.1, k + 2, 7 + k);
      else {
        d.z = sc.z - 0.001;
        for (let r = sc.y0; r <= sc.y1; r++) for (let c = sc.x0; c <= sc.x1; c++) d.put(c, r, ' ');
        if (Math.floor(t) % 4 === 0) d.put(sc.x1, sc.y1, '.');
      }
    });
    if (i % 2) {
      // la taza tirita cuando pasa el tren
      const mp = K.spot(OBJ.mug, X + dw * 0.32, dz0 + dd * 0.5, 0.75);
      K.anim((d, t) => d.blit(OBJ.mug, mp.x + (rumble(t).shake && Math.floor(t * 18) % 2 ? 1 : 0), mp.y, dz0 + dd * 0.5));
    } else K.stand(OBJ.papers, X + dw * 0.32, dz0 + dd * 0.5, 0.75);
    if (i === 1) K.stand(OBJ.plantS, X - dw * 0.38, dz0 + dd * 0.5, 0.75);
    // la persona de espaldas, tecleando
    if (seat < people && (!K.narrow || i === 0)) {
      const pz = dz0 - K.dz(0.25);
      const fr = P.SIT_BACK.type;
      const pp = K.spot(fr[0], X - dw * 0.1, pz);
      K.anim((d, t) => d.blit(fr[Math.floor(t * (3.5 + k)) % 2], pp.x, pp.y, pz));
      if (night) {
        // la lámpara de escritorio encendida
        const lp = K.spot(OBJ.lampD, X + dw * 0.38, dz0 + dd * 0.6, 0.75);
        K.light(lp.x, lp.y + 2, 26, 1);
        K.light((sc.x0 + sc.x1) / 2, (sc.y0 + sc.y1) / 2, 16, 0.9);
        K.at(dz0 + dd * 0.6, (gg) => gg.blit(OBJ.lampD, lp.x, lp.y));
        K.anim((d) => {
          d.z = dz0 + dd * 0.55;
          d.put(lp.x - 1, lp.y + 2, "'");
          d.put(lp.x - 2, lp.y + 3, '.');
        });
      }
    } else if (i % 2 === 0) {
      // silla vacía
      K.stand(sprite(R`
 ___
|   |
|___|
 /|\
`), X - dw * 0.1, dz0 - K.dz(0.25));
    }
    seat++;
  });
  // cables a los enchufes del piso
  outlet(K, Math.round(cols * 0.5), dz0 + dd + 0.01, 0.05);
  // alguien que pasa con su café (de día) o el aseo con el trapero (de noche)
  if (!night) walker(K, K.zf(0.6), { set: CARRY, speed: 4, period: 17, phase: 3 });
  else if (key === 'vacio' || !people) {
    const mz = K.zf(0.6);
    walker(K, mz, { set: MOP, speed: 1.2, period: 70, phase: 12 });
  }
  if (key === 'persianaM') frontBlinds(K, { rows: 3 });
  // 'planta': la oficina llena de plantas; 'persona': alguien mira por la ventana
  if (key === 'planta' || key === 'planta2') {
    K.stand(OBJ.palm, cols * 0.33, K.zf(0.04));
    K.stand(OBJ.plantL, cols * 0.67, K.zf(0.05));
    K.stand(OBJ.fern, K.Xat(m0 - 4, Z - 0.02), Z - 0.02);
    K.stand(OBJ.fern, K.Xat(m1 + 4, Z - 0.02), Z - 0.02);
  }
  if (key === 'persona') {
    const z = K.zf(0.3);
    const fr = P.tier(K, z, P.BACK);
    const p = K.spot(fr[0], cols - K.MX * 1.1, z);
    K.anim((d, t) => d.blit(fr[hash2(Math.floor(t / 3), 4) < 0.3 ? 1 : 0], p.x, p.y, z));
  }
  // las plantas se mueven con el aire acondicionado
  const pz = K.zf(0.05);
  const pp = K.spot(OBJ.plantL, cols * 0.06, pz);
  K.anim((d, t) => d.blit(OBJ.plantL, pp.x + (Math.sin(t * 1.3) > 0.5 ? 1 : 0), pp.y, pz));
  void hangingLamp;
  void sideDoor;
  void cable;
  void wallShelf;
  void sideShelves;
  void FRAMES;
  void rumble;
  void steam;
  void hhmm;
  void mirror;
}
