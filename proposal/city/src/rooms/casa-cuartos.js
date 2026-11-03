// Los cuartos de los departamentos: living, living con tele, cocina, dormitorio,
// pieza de niños, escritorio, biblioteca, sala de música, comedor, taller de
// pintura, invernadero y el cuarto a oscuras. Cada uno arma la base con el kit
// y registra lo que se mueve. `feat` trae lo que se vio en la ventana (un gato,
// una pecera, alguien que saluda) para que esté adentro.
import { SP, R, sprite, hash2, bayer as bay, mirror, rumble, clockAnim, CLOCK_S, CLOCK_L, steam, notes, bubbles, zzz, hhmm, now } from './casa-kit.js';
import { shell, backWindow, curtains, backDoor, frontCurtains, frontBlinds, hangingLamp, floorLamp, rug, outlet, cable, rosette, tiles, darken, reveal, sideFrame, sideDoor, sideWindow, crosses } from './casa-shell.js';
import { OBJ, FRAMES, sofa2d, sofaBackSprite, sofaFront, sofaBack, armchair, table, chair, bed, nightstand, wardrobe, bookcase, sideShelves, counter, upperCabinets, fridge, tv, tvScreen, piano, desk, monitor, screenText, wallShelf, calendar, radiator, HEATER } from './casa-muebles.js';
import * as P from './casa-gente.js';

// --- estilo según el barrio ---------------------------------------------------------
export function style(K) {
  const z = K.zone;
  if (z === 'antiguo') return { walls: K.pick(['papel', 'liso', 'rayas'], 1), wainscot: true, cornice: true, floor: 'parquet', ceil: 'moldura', win: 'balcon', lamp: 'arana', tv: 'consola', rug: 'persa' };
  if (z === 'centro') return { walls: K.pick(['liso', 'hormigon'], 1), floor: K.pick(['cemento', 'tablas'], 2), ceil: 'spots', win: 'ventanal', lamp: K.pick(['globo', 'campana'], 3), tv: 'plana', rug: 'lisa' };
  return { walls: K.pick(['puntos', 'papel', 'rayas', 'liso'], 1), floor: K.pick(['flexit', 'baldosa', 'tablas'], 2), ceil: 'liso', win: K.pick(['persiana', 'doble'], 4), lamp: K.pick(['pantalla', 'foco'], 5), tv: 'tubo', rug: 'trenzada' };
}

// --- piezas de la pared del fondo -------------------------------------------------------
// ventana centrada sobre el título (el título queda debajo, sobre la pared)
export function mainWindow(K, st, o = {}) {
  const { b, E } = K;
  const bw = b.x1 - b.x0;
  const ww = Math.round(Math.max(10, Math.min(o.w || 34, bw * (o.f || 0.36))));
  const cx = o.cx != null ? o.cx : Math.round(K.vx);
  const x0 = Math.round(cx - ww / 2);
  const x1 = x0 + ww;
  const tall = st.win === 'balcon' || st.win === 'ventanal';
  const y0 = b.y0 + (st.cornice ? 3 : 2);
  const y1 = o.y1 || (tall && o.tall ? b.y1 - 1 : E - 2);
  const glass = backWindow(K, x0, x1, y0, y1, { kind: o.kind || (tall && !o.tall ? 'doble' : st.win), sill: !(tall && o.tall), down: o.down });
  if (o.curtains !== false) curtains(K, x0, x1, y0, y1, { w: Math.max(2, Math.round(ww * 0.12)), sheer: K.zone === 'centro', tied: K.zone === 'antiguo' });
  return { x0, x1, y0, y1, glass };
}

// cuadros colgados a los lados, sin pisar el rectángulo [x0, x1]
export function hangFrames(K, xa, xb, y0, y1, n = 2, kinds) {
  const list = kinds || ['paisaje', 'retrato', 'foto', 'flores', 'barco', 'mapa', 'foto2', 'abstracto', 'plato'];
  let x = xa;
  const placed = [];
  for (let i = 0; i < n * 3 && placed.length < n; i++) {
    const s = FRAMES[list[Math.floor(K.h(40 + i) * list.length)]];
    if (x + s.w > xb) break;
    const y = Math.round(y0 + (y1 - y0 - s.h) * K.h(60 + i));
    if (y < y0) continue;
    K.onBack(s, x, y);
    // el clavo
    K.at(K.Z, (g) => g.put(x + Math.floor(s.w / 2), y - 1, '.'));
    placed.push({ x, y, s });
    x += s.w + 2 + Math.floor(K.h(70 + i) * 3);
  }
  return placed;
}

// reloj de pared con la hora de verdad
export function wallClock(K, x, y, big = false) {
  const s = big ? CLOCK_L : CLOCK_S;
  K.onBack(s, x - Math.floor(s.w / 2), y - Math.floor(s.h / 2));
  clockAnim(K, x, y, big, K.Z - 0.005);
}

// --- personas en el cuarto -----------------------------------------------------------------
// Alguien que camina a profundidad z cada tanto. mode 'cruza' va de x0 a x1
// (y la vuelta siguiente al revés); 'visita' entra por x0, llega a xm, se
// queda un rato de frente y vuelve.
export function walker(K, z, o = {}) {
  const set = o.set || P.WALK;
  const fr = P.tier(K, z, set);
  const frL = fr.map(mirror);
  const stand = P.tier(K, z, P.STAND);
  const period = o.period || 15 + K.h(90) * 8;
  const speed = o.speed || 6;
  const x0 = o.x0 != null ? o.x0 : K.sx(0, z) + 3;
  const x1 = o.x1 != null ? o.x1 : K.sx(K.cols, z) - 3;
  const ph0 = o.phase || 0;
  const visit = o.mode === 'visita';
  const xm = o.xm != null ? o.xm : (x0 + x1) / 2;
  const pause = o.pause || 4;
  const y = Math.round(K.sy(0, z));
  K.anim((d, t) => {
    const p = (t + ph0) % period;
    let x;
    let s;
    if (visit) {
      const dist = Math.abs(xm - x0);
      const dur = dist / speed;
      const dir = xm > x0 ? 1 : -1;
      if (p < dur) {
        x = x0 + dir * p * speed;
        s = (dir > 0 ? fr : frL)[Math.floor(p * 4) % fr.length];
      } else if (p < dur + pause) {
        x = xm;
        s = stand[Math.floor(t * 0.8) % 7 === 0 ? 1 : 0] || stand[0];
      } else if (p < dur * 2 + pause) {
        x = xm - dir * (p - dur - pause) * speed;
        s = (dir > 0 ? frL : fr)[Math.floor(p * 4) % fr.length];
      } else return;
    } else {
      const dur = Math.abs(x1 - x0) / speed;
      if (p > dur) return;
      const dir = Math.floor((t + ph0) / period) % 2 ? -1 : 1;
      x = dir > 0 ? x0 + p * speed : x1 - p * speed;
      s = (dir > 0 ? fr : frL)[Math.floor(p * 4) % fr.length];
    }
    d.blit(s, Math.round(x - s.w / 2), y - s.h, z);
  });
}

// figura quieta con cuadros que cambian (period s por cuadro)
export function figure(K, frames, X, z, h = 0, period = 1.2, o = {}) {
  const s0 = frames[0];
  const p = K.spot(s0, X, z, h);
  K.anim((d, t) => {
    const k = o.seq ? o.seq(t) : Math.floor(t / period + (o.phase || 0)) % frames.length;
    d.blit(frames[k], p.x, p.y + (o.dy || 0), z);
  });
  return p;
}

// gato sentado con la cola que se mueve; a veces parpadea o se lava
export function cat(K, X, z, h = 0, o = {}) {
  const want = (0.45 * K.M) / z;
  const size = o.size || (want > 6 ? 'L' : want > 3.2 ? 'M' : 'S');
  const fr = P.CAT[size];
  const tail = P.TAIL[size];
  const p = o.y != null ? { x: Math.round(K.sx(X, z) - fr[0].w / 2), y: o.y - fr[0].h + 1 } : K.spot(fr[0], X, z, h);
  const seed = Math.round(X);
  K.anim((d, t) => {
    const k = Math.floor(t * 1.6 + seed);
    const blink = hash2(k, 5) < 0.18;
    const lick = !blink && Math.floor(t / 6 + seed) % 3 === 2;
    const s = lick && fr[2] ? fr[2] : blink ? fr[1] : fr[0];
    d.blit(s, p.x, p.y, z);
    const tk = Math.floor(t * 1.2 + seed * 0.3) % tail.length;
    const ts = tail[tk];
    d.blit(ts, p.x + s.w - 1, p.y + s.h - ts.h, z);
  });
  return p;
}

// --- rellenos según lo que se vio en la ventana -------------------------------------------------
// pecera sobre un mueble: peces que van y vienen y burbujas
export function aquarium(K, X, z, h = 0.8) {
  const W = Math.min(1.2 * K.MX, K.cols * 0.26);
  const stand = K.box(X - W / 2, X + W / 2, h, z, z + K.dz(0.4), { front: (c, r, u, v) => (Math.abs(u - 0.5) < 0.02 ? '|' : Math.abs(v - 0.3) < 0.08 ? '_' : SP) });
  const tank = K.box(X - W / 2 + 0.5, X + W / 2 - 0.5, 0.5, z + 0.001, z + K.dz(0.35), {
    base: h,
    front: (c, r, u, v) => (v < 0.12 ? '~' : v > 0.82 ? ((c + r) % 2 ? '.' : ':') : SP),
  });
  const x0 = tank.c0 + 1;
  const x1 = tank.c1 - 1;
  const y0 = tank.r0 + 1;
  const y1 = tank.r1 - 1;
  // algas
  K.at(z, (g) => {
    for (let r = y1 - 2; r <= y1; r++) {
      g.put(x0 + 2, r, r % 2 ? ')' : '(');
      if (x1 - 3 > x0 + 4) g.put(x1 - 3, r, r % 2 ? '(' : ')');
    }
    g.text(Math.round((x0 + x1) / 2) - 1, y1, '_n_');
  });
  K.anim((d, t) => {
    d.z = z - 0.001;
    const w = x1 - x0;
    for (let i = 0; i < 3; i++) {
      const sp = 0.25 + i * 0.12;
      const ph = (t * sp + i * 0.37) % 2;
      const right = ph < 1;
      const u = right ? ph : 2 - ph;
      const fx = Math.round(x0 + u * (w - 3));
      const fy = y0 + ((i * 2 + 1) % Math.max(1, y1 - y0));
      d.text(fx, fy, right ? '><>' : '<><');
    }
    bubbles(d, x0 + 3, y0, y1 - 1, t, 3, 1);
  });
  return stand;
}

// jaula colgada con un pájaro que salta
export function birdcage(K, x, y) {
  const s = sprite(R`
   _
  (_)
 .-'-.
/|||||\
|||||||
|||||||
'-----'`);
  K.onBack(s, x - 3, y);
  K.anim((d, t) => {
    d.z = K.Z - 0.02;
    const k = Math.floor(t * 1.5) % 3;
    const f = P.BIRD[k];
    for (let r = 0; r < f.h; r++) for (let c = 0; c < f.w; c++) {
      const ch = f.data[r * f.w + c];
      if (ch) d.put(x - 2 + c + (k === 1 ? 1 : 0), y + 3 + r, ch);
    }
    if (Math.floor(t / 3) % 3 === 0) d.put(x + 4, y + 2, '♪');
  });
}

// reloj de pie con péndulo (para el living antiguo)
export function grandfather(K, X, z1) {
  const W = Math.min(0.5 * K.MX, K.cols * 0.08);
  const res = K.box(X - W / 2, X + W / 2, 2.05, z1 - K.dz(0.3), z1, {
    front: (c, r, u, v) => (v < 0.06 ? '^' : v > 0.34 && v < 0.36 ? '_' : v > 0.38 && v < 0.84 && (u < 0.18 || u > 0.82) ? ':' : SP),
  });
  const cx = Math.round((res.c0 + res.c1) / 2);
  const cy = res.r0 + Math.max(2, Math.round((res.r1 - res.r0) * 0.17));
  K.at(res.z0 - 0.001, (g) => {
    g.text(cx - 2, cy - 1, '.-.');
    g.put(cx - 3, cy, '(');
    g.put(cx + 3, cy, ')');
    g.text(cx - 2, cy + 1, "ª-'".replace('ª', '`'));
  });
  clockAnim(K, cx, cy, false, res.z0 - 0.002);
  // péndulo
  const py = cy + 3;
  const len = Math.max(3, Math.round((res.r1 - py) * 0.6));
  K.anim((d, t) => {
    d.z = res.z0 - 0.002;
    const a = Math.sin(t * Math.PI) * 0.35;
    const ex = cx + Math.sin(a) * len * 1.2;
    const ey = py + len;
    d.line(cx, py, ex, ey, 0);
    d.put(Math.round(ex), Math.round(ey), 'O');
    // tic tac
    if (Math.floor(t * 2) % 2) d.text(res.c1 + 2, cy - 1, Math.floor(t) % 2 ? 'tic' : 'tac');
  });
  return res;
}

// --- dos ventanas altas en la pared del fondo, con el título al medio --------------------------
export function twinWindows(K, st, o = {}) {
  const { b, Z } = K;
  const bw = b.x1 - b.x0;
  const ww = Math.max(6, Math.round(bw * (K.narrow ? 0.24 : o.f || 0.2)));
  const tall = K.zone === 'antiguo' && o.balcony !== false;
  const h0 = tall ? 0.02 : o.h0 || 1.0;
  const h1 = Math.min(K.HM - (st.cornice ? 0.85 : 0.6), o.h1 || (K.HM > 5.6 ? K.HM - 1.1 : 4.3));
  const y0 = Math.round(K.sy(h1, Z));
  const y1 = Math.round(K.sy(h0, Z));
  const out = [];
  const centers = o.single ? [Math.round(K.vx)] : [b.x0 + bw * 0.21, b.x1 - bw * 0.21];
  centers.forEach((cx, i) => {
    const x0 = Math.round(cx - ww / 2);
    const x1 = x0 + ww;
    const glass = backWindow(K, x0, x1, y0, y1, { kind: tall ? 'balcon' : st.win === 'ventanal' ? 'ventanal' : st.win, sill: !tall, seed: i * 7, down: 0.18 });
    if (o.curtains !== false) curtains(K, x0, x1, y0, y1, { w: Math.max(2, Math.round(ww * 0.18)), sheer: K.zone === 'centro', tied: K.zone === 'antiguo' });
    out.push({ x0, x1, y0, y1, glass });
  });
  return out;
}

// el centro de la pared del fondo: un cuadro grande arriba del título y fotos debajo
export function backCenter(K, xa, xb, o = {}) {
  const { E, Z } = K;
  const w = xb - xa;
  const big = K.pick(['paisaje', 'mar', 'barco', 'abstracto', 'mapa', 'flores'], 33);
  const s = FRAMES[o.big || big];
  if (w > s.w + 2) {
    const y = Math.max(K.b.y0 + 2, E - 2 - s.h);
    K.onBack(s, Math.round((xa + xb) / 2 - s.w / 2), y);
  }
  // debajo del título: un reloj o fotos
  const yb = E + 2;
  const yLow = Math.round(K.sy(0.95, Z)) - 1;
  if (yLow - yb >= 3 && w > 12) {
    if (o.clock !== false) wallClock(K, Math.round((xa + xb) / 2), yb + 1, false);
    if (w > 22) {
      K.onBack(FRAMES.foto, xa + 1, yb);
      K.onBack(FRAMES.foto2, xb - FRAMES.foto2.w - 1, yb);
    }
  }
}

// chimenea con repisa, reloj y velas; el fuego se mueve
export function fireplace(K, X, z1, W) {
  const z0 = z1 - K.dz(0.4);
  const res = K.box(X - W / 2, X + W / 2, 1.15, z0, z1, {
    front: (c, r, u, v) => {
      if (v < 0.12) return SP;
      const inside = u > 0.22 && u < 0.78 && v > 0.32;
      if (inside) return SP;
      if (Math.abs(u - 0.22) < 0.02 || Math.abs(u - 0.78) < 0.02) return v > 0.32 ? '|' : SP;
      if (Math.abs(v - 0.3) < 0.05 && u > 0.2 && u < 0.8) return '_';
      return (c + r) % 2 ? ':' : SP;
    },
  });
  const w = res.c1 - res.c0;
  const fx0 = res.c0 + Math.round(w * 0.22) + 1;
  const fx1 = res.c0 + Math.round(w * 0.78) - 1;
  const fy1 = res.r1 - 1;
  const fy0 = res.r0 + Math.round((res.r1 - res.r0) * 0.38);
  if (K.night) K.light((fx0 + fx1) / 2, fy1, 30, 1);
  K.at(z0 - 0.001, (g) => {
    for (let r = fy0; r <= fy1; r++) for (let c = fx0; c <= fx1; c++) g.put(c, r, (c + r) % 2 === 0 && r < fy1 - 1 ? '.' : SP);
    g.text(Math.round((fx0 + fx1) / 2) - 3, fy1, '=/==\\=');
  });
  // repisa: reloj y candelabros
  K.stand(OBJ.candle, X - W * 0.38, z0 + K.dz(0.15), 1.15);
  K.stand(OBJ.candle, X + W * 0.38, z0 + K.dz(0.15), 1.15);
  K.stand(OBJ.vase2, X + W * 0.2, z0 + K.dz(0.2), 1.15);
  K.anim((d, t) => {
    d.z = z0 - 0.002;
    const cx = Math.round((fx0 + fx1) / 2);
    const h = fy1 - fy0;
    for (let i = -2; i <= 2; i++) {
      const fl = Math.round(h * (0.5 + 0.4 * Math.sin(t * 7 + i * 1.9)) - Math.abs(i));
      for (let k = 1; k <= fl; k++) d.put(cx + i, fy1 - k, k === fl ? (i % 2 ? ')' : '(') : k > fl - 2 ? "'" : (i + k) % 2 ? '(' : ')');
    }
    if (K.night) for (let c = fx0; c <= fx1; c++) if ((c + Math.floor(t * 5)) % 3 === 0) d.put(c, fy0, '.');
  });
  return res;
}

// --- el living ---------------------------------------------------------------------------------
// feat.people: 'sofa' | 'read' | 'couple' | 'walk' | 'wave' | 'iron' | 'phone' | 'stand' | 'none'
export function living(K, feat = {}) {
  const st = style(K);
  const { b, cols, Z, E } = K;
  shell(K, st);
  const wins = twinWindows(K, st, { f: 0.19 });
  const win = wins[0];
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // un cuadro grande arriba del título
  const bigK = K.pick(['paisaje', 'mar', 'barco', 'abstracto', 'mapa', 'flores'], 33);
  const big = FRAMES[bigK];
  if (cB - cA > big.w + 2) K.onBack(big, Math.round(K.vx - big.w / 2), Math.max(b.y0 + 3, E - 3 - big.h));
  // la jaula del pájaro colgada junto a la ventana
  if (feat.cage) birdcage(K, Math.min(cA + 4, Math.round(K.vx - big.w / 2) - 5), Math.max(b.y0 + 2, E - 9));
  // al fondo, debajo del título: el sillón (o la chimenea con dos sillones en el antiguo)
  const zb = Z - 0.004;
  const zs = Z - 0.07;
  let sofa = null;
  if (K.zone === 'antiguo' && !K.narrow) {
    const fw = Math.min(1.5 * K.MX, (cB - cA) * Z * 0.55);
    fireplace(K, K.vx, zb, fw);
    // dos sillones de un cuerpo a los lados de la chimenea
    const seats = [];
    for (const sd of [-1, 1]) {
      const X = K.vx + sd * (fw / 2 + K.MX * 0.55);
      const a = sofa2d(K, X, zs, 0.95, { n: 1, hm: 1.1, pattern: 'rayas' });
      seats.push(a.seats[0]);
      sofa = sofa || { ...a, seats: [] };
      sofa.seats.push(a.seats[0]);
    }
    sofa.zs = zs - 0.005;
  } else if (feat.people !== 'tv') {
    sofa = sofa2d(K, K.vx, zs, K.narrow ? 1.5 : 2.4, { pattern: K.pick(['liso', 'puntos', 'rayas'], 8), maxF: 0.5 });
    sofa.zs = zs - 0.005;
    // un cuadro chico arriba del sillón (debajo del título)
    if (cB - cA > 24) {
      K.onBack(FRAMES.foto, Math.round(K.vx - 12), E + 2);
      if (!feat.bigClock) wallClock(K, Math.round(K.vx), E + 3, false);
      K.onBack(FRAMES.foto2, Math.round(K.vx + 8), E + 2);
    }
    // lámpara de pie a un lado y mesita con planta al otro
    const lx = sofa.X1 + K.MX * 0.45;
    if (K.sx(lx, zs) < b.x1 - 3) floorLamp(K, lx, zs + 0.004);
    const tx = sofa.X0 - K.MX * 0.4;
    if (K.sx(tx, zs) > b.x0 + 3) {
      const tw = Math.min(0.45 * K.MX, cols * 0.06);
      table(K, tx - tw / 2, tx + tw / 2, Z - K.dz(0.42), Z - 0.004, 0.6);
      K.stand(feat.radio ? OBJ.radio : OBJ.lampT, tx, Z - K.dz(0.2), 0.6);
    }
  }
  // bajo cada ventana: la estufa (barrio), un radiador (antiguo) o una planta
  wins.forEach((w, i) => {
    const X = K.Xat(Math.round((w.x0 + w.x1) / 2), Z - 0.02);
    if (K.zone === 'centro') K.stand(i ? OBJ.palm : OBJ.cactus, X, Z - 0.03);
    else if (K.zone === 'barrio' && i === 0) {
      const p = K.stand(HEATER, X, Z - 0.03);
      K.anim((d, t) => {
        d.z = Z - 0.031;
        const k = Math.floor(t * 6) % 3;
        d.text(p.x + 3, p.y + 2, k === 0 ? '^^' : k === 1 ? '^~' : '~^');
      });
    } else if (K.zone === 'barrio') K.stand(OBJ.plantM, X, Z - 0.03);
  });

  // una pared: estante de libros grande adelante y una puerta atrás
  const shelfSide = K.h(5) < 0.5 ? -1 : 1;
  sideShelves(K, shelfSide, K.zf(0.04), K.zf(0.5), { h: Math.min(K.HM - 0.7, 3.2) });
  let door = null;
  if (!feat.noDoor) door = sideDoor(K, shelfSide, K.zf(0.62), K.zf(0.9), 2.2, K.pick(['baño', 'pasillo', 'pieza'], 11));
  // la otra: cuadros, una ventana y un mueble bajo con cosas encima
  const os = -shelfSide;
  sideFrame(K, os, K.zf(0.1), K.zf(0.28), 2.1, 3.2, K.pick(['paisaje', 'retrato', 'afiche'], 12));
  sideFrame(K, os, K.zf(0.36), K.zf(0.47), 2.3, 3.0, K.pick(['retrato', 'espejo', 'paisaje'], 13));
  if (!K.narrow) sideWindow(K, os, K.zf(0.6), K.zf(0.9), 1.0, 3.8);
  const cab = Math.min(0.45 * K.MX, cols * 0.08);
  const cX0 = os < 0 ? 0 : cols - cab;
  K.box(cX0, cX0 + cab, 0.8, K.zf(0.08), K.zf(0.45), {
    side: (c, r, u, h) => (Math.abs(u - 0.5) < 0.015 ? '|' : Math.abs(h - 0.6) < 0.05 && (Math.abs(u - 0.44) < 0.02 || Math.abs(u - 0.56) < 0.02) ? 'o' : h < 0.12 ? '_' : SP),
  });
  K.stand(OBJ.vase, os < 0 ? cab * 0.5 : cols - cab * 0.5, K.zf(0.18), 0.8);
  K.stand(OBJ.books2, os < 0 ? cab * 0.5 : cols - cab * 0.5, K.zf(0.36), 0.8);

  // alfombra y mesa de centro
  rug(K, cols * 0.25, cols * 0.75, K.zf(0.1), K.zf(0.72), st.rug);
  const tw = Math.min(1.2 * K.MX, cols * 0.3);
  const td = Math.min(K.dz(0.6), (Z - 1) * 0.16);
  const tz0 = K.zf(0.18);
  table(K, K.vx - tw / 2, K.vx + tw / 2, tz0, tz0 + td, 0.42, {});
  const cups = [];
  const at = (s, f, k) => ({ s, ...K.spot(s, K.vx - tw / 2 + tw * f, tz0 + td * k, 0.42) });
  cups.push(at(OBJ.cup, 0.18, 0.4), at(OBJ.cup2, 0.74, 0.6));
  K.stand(OBJ.book, K.vx + tw * 0.04, tz0 + td * 0.4, 0.42);
  K.stand(OBJ.fruit, K.vx - tw * 0.12, tz0 + td * 0.7, 0.42);
  // las tazas tiritan cuando pasa el tren
  K.anim((d, t) => {
    const { shake } = rumble(t);
    for (let i = 0; i < cups.length; i++) {
      const c = cups[i];
      const j = shake ? (Math.floor(t * 18 + i) % 2) : 0;
      d.blit(c.s, c.x + j, c.y, c.z);
      if (shake && Math.floor(t * 9 + i) % 3 === 0) d.put(c.x + c.s.w + 1, c.y, "'");
    }
  });
  // una planta grande en el rincón de adelante
  K.stand(OBJ.plantL, os < 0 ? K.MX * 0.9 : cols - K.MX * 0.9, K.zf(0.03));
  // lámpara del techo, a un lado para no tapar el título
  const lz = K.zf(0.45);
  const lX = K.vx + (K.narrow ? 0 : cols * 0.17) * (shelfSide < 0 ? 1 : -1);
  if (K.zone === 'antiguo') rosette(K, lX, lz);
  hangingLamp(K, lX, lz, K.zone === 'antiguo' ? 2.0 : 1.7, st.lamp, { reach: 4 });
  outlet(K, os < 0 ? 1 : cols - 1, K.zf(0.55), 0.3);
  return { st, win, wins, sofa, door, shelfSide };
}

// --- living con la tele: el sillón de espaldas, la tele contra el fondo --------------------------------
export function livingTV(K, feat = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, st);
  const wins = twinWindows(K, st, { f: 0.17 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // mueble de la tele al centro, con repisas encima
  const zt = Z - 0.004;
  const uw = Math.min(1.8 * K.MX, (cB - cA) * Z * 0.9);
  const uz0 = zt - K.dz(0.42);
  K.box(K.vx - uw / 2, K.vx + uw / 2, 0.5, uz0, zt, {
    front: (c, r, u, v) => (Math.abs(u - 0.33) < 0.012 || Math.abs(u - 0.66) < 0.012 ? '|' : Math.abs(v - 0.45) < 0.12 && (Math.abs(u - 0.16) < 0.03 || Math.abs(u - 0.84) < 0.03) ? 'o' : v > 0.4 && Math.abs(u - 0.5) < 0.14 && r % 2 ? '=' : SP),
  });
  const sc = tv(K, K.vx, uz0 + K.dz(0.04), 0.5, st.tv);
  K.stand(OBJ.plantS, K.vx + uw * 0.4, zt - K.dz(0.2), 0.5);
  K.stand(OBJ.remote, K.vx - uw * 0.36, zt - K.dz(0.25), 0.5);
  K.stand(OBJ.speaker, K.vx - uw * 0.62, Z - 0.02);
  K.stand(OBJ.speaker, K.vx + uw * 0.62, Z - 0.02);
  // repisa con libros y fotos sobre la tele, debajo del título
  const shY = Math.round(K.sy(2.05, Z));
  if (shY > E + 2) wallShelf(K, Math.round(K.vx - Math.min(16, (cB - cA) / 2)), Math.round(K.vx + Math.min(16, (cB - cA) / 2)), shY, ['books', 'plantS', 'frame', 'books2', 'vase']);
  hangFrames(K, cA + 1, cB - 1, b.y0 + 3, E - 2, 1, ['abstracto', 'paisaje', 'mapa']);
  if (cB - cA > 30) wallClock(K, cB - 4, b.y0 + 5, false);
  const seed = K.seed % 7;
  const tcx = (sc.x0 + sc.x1) / 2;
  const tcy = (sc.y0 + sc.y1) / 2;
  if (K.night) K.light(tcx, tcy, 34, 1);
  // la tele: imagen y parpadeo; de noche su luz baña la pared y el piso
  K.anim((d, t) => {
    tvScreen(d, sc, t, seed);
    // cuando la imagen se pone clara, el cuarto se ve un poco más lejos
    if (K.night && K.full) {
      const k = hash2(Math.floor(t * 6), 9);
      if (k > 0.5) {
        const Rr = 34 + k * 30;
        const full = K.full;
        const W = K.cols;
        for (let r = Math.max(2, Math.round(tcy - Rr / 2)); r < Math.min(K.rows - 2, tcy + Rr / 2); r++) {
          for (let c = Math.max(0, Math.round(tcx - Rr)); c < Math.min(W, tcx + Rr); c++) {
            const i = r * W + c;
            if (d.data[i] !== 32 || full[i] === 32) continue;
            const dd = Math.sqrt((c - tcx) ** 2 + ((r - tcy) * 2) ** 2) / Rr;
            if (dd < 1 && bay(c, r) < (1 - dd) * 0.9) d.data[i] = full[i];
          }
        }
      }
    }
    if (K.night) {
      const k = 0.5 + hash2(Math.floor(t * 7), 9) * 0.5;
      d.z = sc.z + 0.01;
      for (let r = sc.y0 - 3; r <= sc.y1 + 6; r++) for (let c = sc.x0 - 9; c <= sc.x1 + 9; c++) {
        if (c >= sc.x0 - 2 && c <= sc.x1 + 2 && r >= sc.y0 - 1 && r <= sc.y1 + 1) continue;
        const dd = Math.abs(c - (sc.x0 + sc.x1) / 2) / 14 + Math.abs(r - (sc.y0 + sc.y1) / 2) / 7;
        if (d.get(c, r) === 32 && bayerish(c, r, Math.floor(t * 7)) < (1 - dd) * 0.35 * k) d.put(c, r, '.');
      }
    }
  });
  // estantes en una pared, planta y lámpara en la otra
  sideShelves(K, -1, K.zf(0.3), K.zf(0.92), { h: 2.4 });
  sideFrame(K, 1, K.zf(0.25), K.zf(0.45), 2.0, 3.0, 'paisaje');
  if (!K.narrow) sideDoor(K, 1, K.zf(0.6), K.zf(0.88), 2.2, 'pasillo');
  K.stand(OBJ.palm, cols - K.MX * 0.6, K.zf(0.3));
  rug(K, cols * 0.28, cols * 0.72, K.zf(0.2), K.zf(0.8), st.rug);
  // el sillón de espaldas, cerca, con la gente mirando la tele
  const zs = K.zf(K.narrow ? 0.18 : 0.14);
  const sw = Math.min((K.narrow ? 1.5 : 2.3) * K.MX / zs, cols * 0.6);
  const sh = (0.9 * K.M) / zs;
  const sb = sofaBackSprite(sw, sh);
  const sp = K.stand(sb, K.vx, zs);
  const heads = P.tier(K, zs, { L: P.SOFA_BACK.L, M: P.SOFA_BACK.M, S: P.SOFA_BACK.S }, 0.75);
  const n = feat.couple || !K.narrow ? 2 : 1;
  for (let i = 0; i < n; i++) {
    const cx = n === 1 ? K.vx : K.vx + (i ? 1 : -1) * sw * 0.24;
    const x = Math.round(cx - heads[0].w / 2);
    const y = sp.y - heads[0].h + 2;
    K.anim((d, t) => {
      const k = Math.floor(t / 2.7 + i * 1.3) % 5 === 0 ? 1 : 0;
      d.blit(heads[k % heads.length], x, y, zs - 0.01);
    });
  }
  // un bol de cabritas en el respaldo y el gato arriba
  if (feat.cat) cat(K, K.Xat(sp.x + sb.w - 9, zs), zs - 0.012, 0.0, { size: 'M', y: sp.y });
  else K.at(zs - 0.012, (g) => g.text(sp.x + sb.w - 8, sp.y - 1, '\\°o°/'));
  hangingLamp(K, K.vx + cols * 0.18, K.zf(0.5), 1.8, st.lamp, { on: false });
  return { st, wins, sc };
}

// trama estable para la luz de la tele
function bayerish(c, r, k) {
  return hash2(c * 3 + k, r * 5);
}

// --- detalles que cualquier cuarto puede llevar según lo visto ---------------------------------------
export function applyFeatures(K, base, feat) {
  const { cols } = K;
  if (feat.cat) {
    // un gato bien visible: grande, en el piso cerca, a un costado
    const X = K.h(21) < 0.5 ? cols * 0.3 : cols * 0.7;
    cat(K, X, K.zf(0.06), 0, { size: K.narrow ? 'M' : 'L' });
  }
  if (feat.kitten) {
    const z = K.zf(0.2);
    const X = cols * (K.h(22) < 0.5 ? 0.35 : 0.65);
    const p = K.spot(P.KITTEN[0], X, z);
    K.anim((d, t) => {
      const roll = Math.sin(t * 0.9) * 6;
      const k = Math.floor(t * 2) % 2;
      d.blit(P.KITTEN[k], p.x + Math.round(roll * 0.3), p.y, z);
      const yx = p.x + P.KITTEN[0].w + 2 + Math.round(roll);
      d.blit(P.YARN[Math.floor(t * 3) % 2], yx, p.y + P.KITTEN[0].h - 2, z);
      // la lana que se desenrolla
      for (let c = p.x + P.KITTEN[0].w; c < yx; c++) d.put(c, p.y + P.KITTEN[0].h - 1, c % 2 ? '~' : '-');
    });
  }
  if (feat.fish) aquarium(K, cols * (K.h(23) < 0.5 ? 0.24 : 0.76), K.zf(0.22), 0.7);
  if (feat.plants) {
    const z = K.zf(0.08);
    K.stand(OBJ.plantL, cols * 0.1, z);
    K.stand(OBJ.fern, cols * 0.9, K.zf(0.15));
    const hp = K.spot(OBJ.hangPlant, cols * 0.85, K.zf(0.3), K.HM - 0.4 - OBJ.hangPlant.h / K.M);
    K.anim((d, t) => {
      const sw = Math.round(Math.sin(t * 0.8) * 0.6 + rumble(t).swing * Math.sin(t * 3));
      d.blit(OBJ.hangPlant, hp.x + sw, Math.round(K.sy(K.HM - 0.05, K.zf(0.3))) + 1, K.zf(0.3));
    });
  }
  if (feat.front === 'cortinas') frontCurtains(K, { sides: [-1, 1], pattern: K.zone === 'barrio' });
  else if (feat.front === 'cortinaI') frontCurtains(K, { sides: [-1], pattern: K.zone === 'barrio' });
  else if (feat.front === 'persiana') frontBlinds(K, { rows: 4 });
  else if (feat.front === 'persianaM') frontBlinds(K, { rows: 2 });
  void base;
}

// --- gente en el living ----------------------------------------------------------------------------
export function livingPeople(K, L, feat) {
  const { cols } = K;
  const kind = feat.people || 'sofa';
  const sofa = L.sofa;
  if (sofa && (kind === 'sofa' || kind === 'read' || kind === 'couple')) {
    const z = sofa.zs;
    const set = kind === 'read' ? P.SIT_FRONT.M : P.SIT_FRONT.cup;
    const sit = (fr, cx, period, phase) => {
      const x = cx - Math.floor(fr[0].w / 2);
      const y = sofa.seatRow - 5;
      K.anim((d, t) => d.blit(fr[Math.floor(t / period + phase) % fr.length], x, y, z));
    };
    sit(set, sofa.seats[0], 2.6, 0);
    if (kind === 'couple') sit(P.SIT_FRONT.idle.concat(P.SIT_FRONT.cup), sofa.seats[sofa.seats.length - 1], 3.1, 0.5);
  }
  if (kind === 'walk') walker(K, K.zf(K.narrow ? 0.4 : 0.24), { speed: 5, period: 16 });
  if (kind === 'wave') {
    // alguien muy cerca, saludando hacia la ventana (o sea, hacia nosotros)
    const z = K.narrow ? 1.12 : 1.14;
    figure(K, P.tier(K, z, P.WAVE), cols * (K.h(31) < 0.5 ? 0.36 : 0.64), z, 0, 0.45);
  }
  if (kind === 'iron') {
    // tabla de planchar a la izquierda
    const z = K.zf(0.3);
    const X = cols * 0.28;
    const bw = Math.min(1.2 * K.MX, cols * 0.22);
    K.box(X - bw / 2, X + bw / 2, 0.04, z, z + K.dz(0.35), { base: 0.85 });
    K.line3(X - bw * 0.3, 0.85, z + 0.01, X + bw * 0.2, 0, z + 0.01);
    K.line3(X + bw * 0.3, 0.85, z + 0.01, X - bw * 0.2, 0, z + 0.01);
    // quien plancha: el torso asoma detrás de la tabla y la plancha va y viene sobre ella
    const ix = Math.round(K.sx(X, z) - P.IRON[0].w / 2);
    const iy = Math.round(K.sy(0.85, z)) - P.IRON[0].h + 1;
    K.anim((d, t) => {
      d.blit(P.IRON[Math.floor(t * 1.25) % 2], ix, iy, z - 0.001);
      steam(d, ix + 11, iy + 4, t, 3, 3, 2);
    });
  }
  if (kind === 'phone') {
    const z = K.zf(0.35);
    figure(K, P.PHONE, cols * 0.7, z, 0, 3);
    K.anim((d, t) => {
      const p = K.spot(P.PHONE[0], cols * 0.7, z);
      if (Math.floor(t * 1.5) % 4 < 3) d.text(p.x + 9, p.y, ['bla', 'sí, sí', 'jaja', '...'][Math.floor(t / 2) % 4]);
    });
  }
  if (kind === 'stand') figure(K, P.tier(K, K.zf(0.35), P.STAND), cols * 0.62, K.zf(0.35), 0, 2.4, { seq: (t) => (hash2(Math.floor(t * 1.5), 2) < 0.15 ? 1 : 0) });
  // alguien entra por la puerta lateral, se asoma y vuelve
  if (L.door && feat.cross !== false) {
    const dz = L.door.z + 0.02;
    const xd = K.sx(L.door.X, dz) + (L.door.X < K.vx ? 3 : -3);
    walker(K, dz, { mode: 'visita', x0: xd, xm: xd + (L.door.X < K.vx ? 1 : -1) * K.cols * 0.12, speed: 3, period: 23, phase: 6, pause: 5 });
  }
}

// --- el cuarto a oscuras (la ventana estaba apagada) -----------------------------------------------------
export function dark(K) {
  const { cols, rows, Z } = K;
  const kind = K.h(51) < 0.65 ? 'dormitorio' : 'living';
  const info = kind === 'dormitorio' ? bedroom(K, { sleeper: true, lampOff: true }) : living(K, { people: 'none', noDoor: true });
  K.noLightMask = true;
  K.lights.length = 0;
  const wins = info.wins;
  const fy = Math.round(K.sy(0, Z));
  // rayos de luna: cada ventana proyecta su trapecio hacia nosotros por el piso
  const beams = wins.map((w) => ({ a: w.glass.x0, b: w.glass.x1, m: Math.round((w.glass.x0 + w.glass.x1) / 2), y1: w.y1 }));
  const beamAt = (bm, r) => {
    const k = Math.max(0, (r - fy) / (rows - fy));
    const sh = k * 10;
    return [bm.a + (bm.a - K.vx) * k * 0.6 + sh, bm.b + (bm.b - K.vx) * k * 0.6 + sh, bm.m + (bm.m - K.vx) * k * 0.6 + sh];
  };
  const light = (c, r) => {
    for (const w of wins) if (c >= w.x0 - 1 && c <= w.x1 + 1 && r >= w.y0 - 2 && r <= w.y1 + 1) return 1;
    if (r >= fy - 1) for (const bm of beams) {
      const [a, b2] = beamAt(bm, r);
      if (c >= a && c <= b2) return 0.8;
    }
    // la luna alcanza a la cama y a quien duerme
    if (info.bed) {
      const p = info.bed.pills[0];
      const dx = (c - p.c) / 16;
      const dy = (r - p.r) / 5;
      if (dx * dx + dy * dy < 1) return 0.7;
    }
    return 0.06;
  };
  const full = darken(K, light);
  const g = K.g;
  for (let r = fy; r < rows - 2; r++) for (const bm of beams) {
    const [a, b2, m] = beamAt(bm, r);
    for (let c = Math.round(a); c <= Math.round(b2); c++) {
      if (c < 0 || c >= cols || Math.abs(c - m) < 1) continue;
      const i = r * cols + c;
      if (g.data[i] === SP && (c + r) % 2 === 0) g.data[i] = 46;
    }
  }
  // barridos de luz: un auto que pasa (cada 11 s) por el techo y el tren (cada 34 s)
  K.anim((d, t) => {
    const p = (t % 11) / 2.4;
    if (p < 1) {
      const x = cols * (1.15 - p * 1.3);
      reveal(d, full, cols, rows, x - 4, x + 4, 2, Math.round(rows * 0.42), true);
    }
    const { shake, ph } = rumble(t);
    if (shake) {
      for (let k = 0; k < 5; k++) {
        const x = cols + 10 - ((ph * 170 + k * 31) % (cols + 60));
        reveal(d, full, cols, rows, x, x + 7, 2, rows - 3, true);
      }
    }
  });
  // los ojos del gato brillan en la oscuridad, y a veces parpadean
  if (K.h(52) < 0.55) {
    const z = K.zf(0.25);
    const cx = Math.round(K.sx(cols * (K.h(53) < 0.5 ? 0.22 : 0.78), z));
    const cy = Math.round(K.sy(0.35, z));
    K.anim((d, t) => {
      d.z = z;
      if (hash2(Math.floor(t * 1.3), 7) > 0.14) d.text(cx, cy, 'o o');
    });
  }
  return info;
}

// --- el dormitorio ------------------------------------------------------------------------------------
// o.sleeper: alguien durmiendo; o.reader: sentado leyendo; o.lampOff
export function bedroom(K, o = {}) {
  const st = style(K);
  const { b, E, cols, Z } = K;
  shell(K, { ...st, floor: K.zone === 'centro' ? 'moqueta' : st.floor });
  const wins = twinWindows(K, st, { f: 0.16 });
  const cA = wins[0].x1 + 3;
  const cB = (wins[1] || wins[0]).x0 - 3;
  // la cama al medio contra el fondo
  const bd = bed(K, K.vx, Z - 0.004, K.narrow ? 1.2 : 1.6, { quilt: K.pick(['colcha', 'cuadros', 'rayas'], 61), antiguo: K.zone === 'antiguo', len: K.narrow ? 1.4 : 2.0 });
  // cuadro sobre la cama, arriba del título
  hangFrames(K, cA + 1, cB - 1, b.y0 + 3, E - 2, 1, ['flores', 'paisaje', 'mar', 'retrato']);
  if (cB - cA > 20) {
    K.onBack(FRAMES.foto, Math.round(K.vx - 9), E + 2);
    K.onBack(FRAMES.espejo, Math.round(K.vx + 5), E + 1);
  }
  // mesas de noche con lámpara y despertador
  const nsw = (bd.X1 - bd.X0) / 2 + Math.min(0.4 * K.MX, cols * 0.07);
  const stands = [];
  for (const s of [-1, 1]) {
    if (K.narrow && s > 0) continue;
    const ns = nightstand(K, K.vx + s * nsw, Z - 0.004);
    stands.push(ns);
    if (s < 0) K.stand(OBJ.lampT, ns.X, ns.z, 0.55);
    else K.stand(OBJ.books2, ns.X, ns.z, 0.55);
  }
  // despertador digital con la hora real
  const ns0 = stands[0];
  const az = ns0.z - K.dz(0.12);
  const ap = K.spot(OBJ.alarm, ns0.X + 1.5, az, 0.55);
  K.anim((d, t) => {
    d.z = az;
    d.text(ap.x, ap.y, ' _____ ');
    d.text(ap.x, ap.y + 1, '|' + hhmm(true, t) + '|');
  });
  // lámpara de la mesa de noche encendida de noche
  if (K.night && !o.lampOff) {
    const lp = K.spot(OBJ.lampT, ns0.X, ns0.z, 0.55);
    K.light(lp.x + 2, lp.y + 1, 24, 1);
    K.anim((d) => {
      d.z = ns0.z - 0.01;
      d.put(lp.x - 1, lp.y + 2, '.');
      d.put(lp.x + 5, lp.y + 2, '.');
      d.put(lp.x - 2, lp.y + 3, '.');
      d.put(lp.x + 6, lp.y + 3, '.');
    });
  }
  // ropero grande en una pared lateral, cómoda con espejo en la otra
  const wside = K.h(62) < 0.5 ? -1 : 1;
  wardrobe(K, wside, K.zf(0.08), K.zf(0.08) + Math.min(K.dz(1.4), (Z - 1) * 0.42), { antiguo: K.zone === 'antiguo', mirror: true });
  const os = -wside;
  const dX0 = os < 0 ? 0 : cols - Math.min(0.5 * K.MX, cols * 0.1);
  const dX1 = os < 0 ? Math.min(0.5 * K.MX, cols * 0.1) : cols;
  K.box(dX0, dX1, 0.85, K.zf(0.2), K.zf(0.55), {
    side: (c, r, u, h) => (crosses(K, r, K.zAtCol(os < 0 ? dX1 : dX0, c), 0.28, 0.02) ? '_' : Math.abs(u - 0.5) < 0.03 && h < 0.8 && h > 0.1 && Math.floor(h / 0.28) !== Math.floor((h + 0.06) / 0.28) ? 'o' : SP),
  });
  sideFrame(K, os, K.zf(0.25), K.zf(0.5), 1.1, 2.1, 'espejo');
  K.stand(OBJ.vase, (dX0 + dX1) / 2, K.zf(0.3), 0.85);
  K.stand(OBJ.frame, (dX0 + dX1) / 2, K.zf(0.45), 0.85);
  if (!K.narrow) sideWindow(K, os, K.zf(0.66), K.zf(0.92), 1.0, 3.6);
  // silla con ropa y pantuflas
  const cx = os < 0 ? K.MX * 1.3 : cols - K.MX * 1.3;
  chair(K, cx, K.zf(0.62), 'frente');
  K.stand(sprite(R`
 _
/ \__
\_.:_)`), cx, K.zf(0.62) + K.dz(0.2), 0.48);
  rug(K, cols * 0.33, cols * 0.67, K.zf(0.1), bd.z0 - 0.005, st.rug);
  K.stand(OBJ.slippers, K.vx - 4, bd.z0 - K.dz(0.25));
  hangingLamp(K, K.vx + cols * 0.15, K.zf(0.4), 1.8, st.lamp === 'arana' ? 'pantalla' : st.lamp, { on: !o.lampOff });
  // de día, alguien guarda ropa en el ropero
  if (o.person && !o.sleeper) {
    const z = K.zf(0.3);
    const x0 = K.sx(wside < 0 ? K.MX * 0.7 : cols - K.MX * 0.7, z);
    walker(K, z, { mode: 'visita', x0, xm: x0 + (wside < 0 ? 1 : -1) * cols * 0.14, speed: 2.5, period: 18, phase: 2, pause: 7 });
  }
  // quién está en la cama
  const pill = bd.pills[0];
  if (o.sleeper) {
    K.at(bd.pz - 0.01, (g) => g.blit(P.SLEEPER[0], pill.c - 2, pill.r - 1));
    // la frazada sube y baja con la respiración
    const bz = bd.pz - K.dz(0.5);
    const by = Math.round(K.sy(0.6, bz));
    const bx = Math.round(K.sx(pill.X, bz));
    K.anim((d, t) => {
      // la cabeza en la almohada siempre se ve (la luna le da en la cara)
      d.blit(P.SLEEPER[0], pill.c - 2, pill.r - 1, bd.pz - 0.01);
      d.z = bz;
      const up = Math.sin(t * 1.4) > 0;
      d.text(bx - 4, by - (up ? 1 : 0), up ? '.-~~~~-.' : '_.-~~-._');
      zzz(d, pill.c + 3, pill.r - 2, t);
    });
  } else if (o.reader) {
    const rd = sprite(R`
  .-.
 (· ·)
 .)-(.___
/ |:|/__/`);
    const x = pill.c - 3;
    const y = pill.r - 3;
    K.anim((d, t) => {
      d.blit(rd, x, y, bd.pz - 0.01);
      // pasa la página cada tanto
      if (Math.floor(t / 4) % 3 === 0 && Math.floor(t * 4) % 4 < 2) d.put(x + 7, y + 2, '/');
    });
  }
  return { st, wins, win: wins[0], bed: bd };
}
