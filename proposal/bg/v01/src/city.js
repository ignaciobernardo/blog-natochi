// La ciudad: cinco capas en la misma proyección oblicua, cada una con su
// parallax. Todas coinciden al final del viaje (a nivel de calle); hacia arriba
// las lejanas se quedan atrás y las cercanas pasan más rápido.
//
//   sky   0.12  sol o luna, estrellas (las nubes, el avión y los pájaros se mueven aparte)
//   far   0.40  horizonte de torres chicas, casi sin detalle
//   back  0.72  torres de atrás con ventanas simples
//   main  1.00  la manzana: torres, techos, la avenida, la esquina y el metro
//   near  1.45  primer plano: bordes de torres cercanas, árboles y faroles
//
// La cámara baja por el eje H (la vertical del mundo), así que en pantalla todo
// sube en diagonal `/` y las torres se quedan en sus columnas: es una grúa.
import { Layer, art, FX_NIGHT, FX_TWINKLE, FX_BLINK } from './grid.js';
import { Rng, hash2 } from './rng.js';
import { drawBuilding, pickStyle } from './buildings.js';
import * as P from './parts.js';

export const LAYER_DEFS = [
  { name: 'sky', f: 0.12, zBase: 50000 },
  { name: 'far', f: 0.4, zBase: 40000 },
  { name: 'back', f: 0.72, zBase: 30000 },
  { name: 'main', f: 1, zBase: 20000 },
  { name: 'near', f: 1.45, zBase: 10000 },
];

// la calle (en coordenadas de la capa main)
export const ST = {
  sw1: [0, 5], //   vereda de atrás
  road: [5, 17], // avenida (X)
  lanes: [
    { d0: 6, d1: 10, dir: 1 },
    { d0: 12, d1: 16, dir: -1 },
  ],
  sw2: [17, 22], // vereda de adelante
  plaza: [22, 44],
  cross: [8, 22], // calle que se aleja (D), de una mano hacia nosotros
  zebraX: [
    [0, 7],
    [23, 30],
  ],
  zebraD: [0, 5],
  stopX: [-1, 31],
  stopD: -1,
  busStop: -42,
  metro: { xa: -48, xb: -30, da: 25, db: 34 },
};

function makeLayer(def, env) {
  const { cols, rows, X0, Y0, S } = env;
  const hcMax = Math.ceil(def.f * S) + 2;
  return new Layer({
    ...def,
    c0: -X0 - 4,
    r0: -Y0 - hcMax - 4,
    w: hcMax + cols + 8,
    h: hcMax + rows + 8,
  });
}

export function buildCity(env) {
  const rng = new Rng(env.seed);
  const layers = LAYER_DEFS.map((d) => makeLayer(d, env));
  const [sky, far, back, main, near] = layers;
  drawSky(sky, env, rng.fork());
  drawSkyline(far, env, rng.fork(), 'far');
  drawSkyline(back, env, rng.fork(), 'back');
  drawMain(main, env, rng.fork());
  drawNear(near, env, rng.fork());
  return { layers, byName: { sky, far, back, main, near } };
}

// altura para que el techo de un edificio con fondo d0 aparezca en la fila `rs`
// al empezar el viaje
const heightFor = (L, env, d0, rs) => Math.round(env.Y0 + d0 + L.f * env.S - rs);

// rango de x visible para una fila de edificios (x + 2d es invariante al bajar)
function xBand(env, d0, d1, margin = 20) {
  const { cols, rows, X0, Y0 } = env;
  return [-X0 - Y0 - 2 * d1 - margin, cols + rows - X0 - Y0 - 2 * d0 + margin];
}

// ------------------------------------------------------------------- cielo
function drawSky(L, env, rng) {
  const { cols, rows, X0, Y0, dark } = env;
  const hc = L.f * env.S;
  // en coordenadas de capa, la pantalla al empezar va de (−X0 + hc, −Y0 − hc)
  const c0 = -X0 + Math.round(hc);
  const r0 = -Y0 - Math.round(hc);
  if (dark) {
    for (let r = r0 - 4; r < r0 + rows + 4; r++) {
      for (let c = c0 - 30; c < c0 + cols + 30; c++) {
        const v = hash2(c * 7 + 3, r * 13 + 1);
        if (v < 0.018) {
          const fx = L.addFx(FX_TWINKLE, v < 0.004 ? '*' : v < 0.009 ? '+' : '.', '·', hash2(c, r) * 9, 2 + hash2(r, c) * 5);
          L.put(c, r, v < 0.004 ? '*' : '.', fx);
        }
      }
    }
    L.sprite(c0 + Math.round(cols * 0.78), r0 + 7, P.SPR.moon);
  } else {
    L.sprite(c0 + Math.round(cols * 0.76), r0 + 9, P.SPR.sun);
  }
  void rng;
}

// ------------------------------------------------- horizonte lejano y fondo
function drawSkyline(L, env, rng, kind) {
  const { rows } = env;
  const far = kind === 'far';
  const rowsDef = far
    ? [{ d1: -40, depth: [8, 14], w: [7, 14], gap: [0, 3], rs: [0.5, 0.8] }]
    : [
        { d1: -96, depth: [12, 20], w: [10, 20], gap: [1, 5], rs: [0.44, 0.8] },
        { d1: -70, depth: [12, 20], w: [12, 22], gap: [2, 8], rs: [0.52, 1.0] },
      ];
  for (const R of rowsDef) {
    const list = [];
    const d0max = R.d1 - R.depth[1];
    const [xa, xb] = xBand(env, d0max, R.d1, 24);
    let x = xa;
    while (x < xb) {
      const w = rng.int(R.w[0], R.w[1]);
      const depth = rng.int(R.depth[0], R.depth[1]);
      const d0 = R.d1 - depth;
      const rs = rows * (R.rs[0] + rng.next() * (R.rs[1] - R.rs[0]));
      const H = Math.max(10, heightFor(L, env, d0, rs));
      const st = pickStyle(rng);
      if (far) {
        st.tex = rng.pick(['sparse', 'grid4', 'none']);
        st.left = 'floors';
        st.F = 3;
      } else {
        st.tex = rng.pick(['sparse', 'dots', 'grid4']);
        st.balcony = 0;
      }
      const tiers = rng.chance(far ? 0.2 : 0.35) ? [Math.round(H * (0.6 + rng.next() * 0.25))] : [];
      list.push({
        x0: x,
        x1: x + w,
        d0,
        d1: R.d1,
        H,
        tiers,
        style: st,
        rng: rng.fork(),
        antenna: rng.chance(0.35) ? rng.int(4, 9) : 0,
        props: far ? [] : undefined,
      });
      x += w + rng.int(R.gap[0], R.gap[1]);
    }
    list.sort((a, b) => b.x0 - a.x0);
    for (const b of list) drawBuilding(L, b, { lod: far ? 'far' : 'mid' });
  }
}

// ------------------------------------------------------------- la manzana
function drawMain(L, env, rng) {
  const { rows } = env;
  ground(L, env, rng);

  // dos filas de torres: la de atrás (M2) y la que da a la avenida (M1)
  const gapA = ST.cross[0];
  const gapB = ST.cross[1];
  const rowsDef = [
    { d1: -34, depth: [16, 26], w: [16, 30], gap: [1, 6], rs: [0.6, 2.2] },
    { d1: 0, depth: [16, 26], w: [18, 34], gap: [2, 7], rs: [0.66, 5.2] },
  ];
  for (const R of rowsDef) {
    const front = R.d1 === 0;
    const d0max = R.d1 - R.depth[1];
    const [xa, xb] = xBand(env, d0max, R.d1, 30);
    const list = [];
    let centerUsed = false;
    // de la esquina hacia los costados, para que la calle D quede limpia
    const place = (from, to, dir) => {
      let x = from;
      while (dir > 0 ? x < to : x > to) {
        const w = rng.int(R.w[0], R.w[1]);
        const x0 = dir > 0 ? x : x - w;
        const x1 = x0 + w;
        const depth = rng.int(R.depth[0], R.depth[1]);
        const d0 = R.d1 - depth;
        // altura: la torre más alta queda centrada al empezar el viaje; el
        // resto se reparte para que aparezcan techos durante toda la bajada
        const dm = (d0 + R.d1) / 2;
        const xc = rows * R.rs[0] - env.Y0 - 2 * dm;
        const center = Math.abs((x0 + x1) / 2 - xc) < w / 2 + 2 && !centerUsed;
        if (center) centerUsed = true;
        const rsFrac = center ? R.rs[0] : R.rs[0] + 0.12 + Math.pow(rng.next(), 1.3) * (R.rs[1] - R.rs[0]);
        const H = Math.max(front ? 14 : 30, heightFor(L, env, d0, rows * rsFrac));
        const st = pickStyle(rng);
        const tiers = [];
        if (H > 60 && rng.chance(0.55)) tiers.push(Math.round(H * (0.55 + rng.next() * 0.2)));
        if (H > 120 && rng.chance(0.5)) tiers.unshift(Math.round(H * (0.3 + rng.next() * 0.15)));
        const b = {
          x0,
          x1,
          d0,
          d1: R.d1,
          H,
          tiers,
          style: st,
          rng: rng.fork(),
          shop: front ? true : false,
          roofTex: rng.int(0, 2),
        };
        if (rng.chance(front ? 0.45 : 0.25) && H > 30) {
          const words = ['HOTEL', 'BAR', 'CINE', 'PENSION', 'RADIO', 'TANGO', 'DISCO', 'SALON', '* * *'];
          const text = rng.pick(words);
          b.sign = { x: x0 + 2 + rng.int(0, Math.max(0, w - 6)), h: front ? 9 + rng.int(0, 10) : rng.int(20, Math.max(21, H - 30)), text };
        }
        // cartel corrido sobre el lado izquierdo
        if (rng.chance(0.3) && H > 40) {
          const text = rng.pick(['FERRETERIA', 'TALLER', 'IMPRENTA', 'HOTEL SUR', 'CINE REX', 'TELEFONOS', 'ALMACEN']);
          b.band = { text, h: rng.int(10, Math.max(11, Math.min(H - 12, 90))) };
        }
        list.push(b);
        x = dir > 0 ? x1 + rng.int(R.gap[0], R.gap[1]) : x0 - rng.int(R.gap[0], R.gap[1]);
      }
    };
    place(gapB, xb, 1);
    place(gapA, xa, -1);
    const tallest = list.reduce((a, b) => (b.H > a.H ? b : a), list[0]);
    if (front && tallest.x0 < gapB && tallest.x1 > gapA) tallest.x1 = gapA;
    if (front) {
      tallest.skeleton = 8;
      tallest.crane = { M: 16, J: Math.min(40, Math.round(env.cols * 0.22)) };
      tallest.tiers = [];
      tallest.sign = null;
    } else tallest.antenna = 14;
    list.sort((a, b) => b.x0 - a.x0);
    for (const b of list) drawBuilding(L, b);
  }

  // mobiliario de la vereda de atrás
  furniture(L, env, rng);
  // la boca del metro
  metro(L, env, rng);
  // edificios bajos de adelante, a los costados de la plaza
  frontLow(L, env, rng);
}

// suelo: veredas, avenida, la calle que se aleja, cruces peatonales y plaza
function ground(L, env, rng) {
  const [xa, xb] = xBand(env, -80, ST.plaza[1], 40);
  const [c0, c1] = ST.cross;
  L.near = -5000;
  L.top(xa - 120, xb + 40, -80, ST.plaza[1] + 20, 0, (x, d, c, r) => {
    const inCross = x > c0 && x < c1 && d < ST.sw1[0];
    if (inCross) {
      if (x === (c0 + c1) / 2 && (d & 1) === 0) return 92; // línea central \
      return hash2(c, r) < 0.012 ? 46 : 0;
    }
    if (d < ST.sw1[0]) return 0; // bajo los edificios
    if (d < ST.sw1[1] || (d >= ST.sw2[0] && d < ST.sw2[1])) {
      // baldosas de vereda
      return (c & 3) === 0 && (r & 1) === 0 ? 46 : 0;
    }
    if (d < ST.road[1]) {
      if (d === 10 && ((x >> 2) & 1) === 0) return 95; // línea central de la avenida
      return hash2(c, r) < 0.01 ? 46 : 0;
    }
    // plaza: baldosas en diagonal, punteadas
    if ((x + 2 * d) % 8 === 0 && (d & 1) === 0) return 46;
    if ((x - d) % 12 === 0) return 39;
    return 0;
  });
  // cordones
  L.ex(xa - 120, ST.road[0], 0, xb - xa + 160);
  L.ex(xa - 120, ST.road[1], 0, xb - xa + 160);
  L.ex(xa - 120, ST.plaza[0], 0, xb - xa + 160, 46);
  // cordones de la calle D
  L.ed(c0, -80, 0, 80);
  L.ed(c1, -80, 0, 80);
  // cebras sobre la avenida (franjas en D)
  for (const [za, zb] of ST.zebraX) {
    for (let x = za; x < zb; x += 3) {
      L.ed(x, ST.road[0], 0, ST.road[1] - ST.road[0]);
    }
  }
  // cebra sobre la calle D (franjas en X)
  for (let d = ST.zebraD[0] + 1; d < ST.zebraD[1]; d++) L.ex(c0 + 1, d, 0, c1 - c0 - 1, 61);
  // líneas de detención
  L.ed(ST.stopX[0], ST.lanes[0].d0 - 1, 0, 5, 124);
  L.ex(c0 + 1, ST.stopD, 0, c1 - c0 - 1);
  // tapas de alcantarilla
  for (let x = xa; x < xb; x += 37) L.put(x + 13, 13, 'Ø');
  void rng;
}

// faroles, árboles, parada de colectivo, semáforos
function furniture(L, env, rng) {
  const [xa, xb] = xBand(env, 0, 22, 20);
  const items = [];
  // vereda de atrás
  for (let x = Math.floor(xa / 26) * 26; x < xb; x += 26) {
    if (x > ST.cross[0] - 3 && x < ST.cross[1] + 3) continue;
    items.push({ kind: 'lamp', x: x + 3, d: 4 });
    if (rng.chance(0.55)) items.push({ kind: 'tree', x: x + 15, d: 3 });
  }
  // vereda de adelante
  for (let x = Math.floor(xa / 30) * 30; x < xb; x += 30) {
    items.push({ kind: 'lamp', x: x + 9, d: 18 });
    if (rng.chance(0.4)) items.push({ kind: 'bin', x: x + 18, d: 18 });
  }
  items.push({ kind: 'signal', x: ST.cross[0] - 2, d: 4 });
  items.push({ kind: 'signal', x: ST.cross[1] + 9, d: 18 });
  items.push({ kind: 'hydrant', x: ST.cross[1] + 4, d: 4 });
  items.push({ kind: 'stop', x: ST.busStop, d: 1 });
  items.sort((a, b) => a.d - b.d || b.x - a.x);
  for (const it of items) {
    L.near = it.d;
    if (it.kind === 'lamp') P.lamp(L, it.x, it.d, rng);
    else if (it.kind === 'tree') P.tree(L, it.x, it.d, rng);
    else if (it.kind === 'signal') {
      L.spriteAt(it.x, it.d, 0, P.SPR.signal);
      (L.emitters ||= []).push({ kind: 'signal', x: it.x, d: it.d, h: 0, near: it.d });
    } else if (it.kind === 'hydrant') L.spriteAt(it.x, it.d, 0, P.SPR.hydrant);
    else if (it.kind === 'bin') L.spriteAt(it.x, it.d, 0, P.SPR.bin);
    else if (it.kind === 'stop') busShelter(L, it.x, it.d);
  }
}

// refugio de la parada: techo, banco y cartel
function busShelter(L, x, d) {
  L.near = d + 3;
  L.eh(x, d + 3, 0, 5);
  L.eh(x + 11, d + 3, 0, 5);
  L.eh(x, d, 0, 5);
  L.box(x - 1, x + 13, d - 1, d + 3, 5, 6, { front: (xx, hh, c) => 0 });
  L.text(x + d + 3 + 6 + 4, d + 3 - 6 - 1, '21');
  L.spriteAt(x + 3, d + 2, 0, P.SPR.bench);
  L.spriteAt(x + 15, d + 3, 0, P.SPR.stopSign);
}

// boca del metro. En esta proyección una escalera que baja hacia nosotros se ve
// como líneas horizontales (los escalones, siempre en las mismas columnas)
// entre el borde `\` del hueco y una línea vertical `|` donde empieza la pared
// derecha, que se ve como un triángulo oscuro. Barandas, y al fondo un portal
// con el nombre.
function metro(L, env, rng) {
  const { xa, xb, da, db } = ST.metro;
  const SH = '░'.charCodeAt(0);
  L.near = da;
  const wallC = xb + da; // columna donde la escalera toca la pared derecha
  for (let r = da; r < db; r++) {
    const k = r - da;
    for (let c = xa + r + 1; c < xb + r; c++) {
      let ch;
      if (c > wallC) ch = (c + r) % 2 === 0 ? 47 : k > 4 ? SH : 32; // pared
      else if (c === wallC) ch = 124;
      else if ((k & 1) === 0) ch = 95; // canto del escalón
      else ch = k > 5 ? SH : k > 2 ? ((c & 1) === 0 ? 58 : 32) : (c & 3) === 0 ? 46 : 32;
      L.put(c, r, ch);
    }
  }
  // borde del hueco
  L.ex(xa, da, 0, xb - xa);
  L.ed(xa, da, 0, db - da);
  L.ed(xb, da, 0, db - da);
  // barandas: pasamanos `\` a los costados y baranda de adelante con barrotes
  L.near = db;
  L.front(xa, xb, db, 0, 2, (x, hh, c, r) => {
    if ((x - xa) % 3 === 0) L.put(c, r, 47);
    return -1;
  });
  L.ex(xa, db, 2, xb - xa);
  L.eh(xa, db, 0, 2);
  L.eh(xb, db, 0, 2);
  // portal al fondo: postes dobles en H y un dintel con el nombre
  L.near = da;
  const H = 5;
  for (const x of [xa, xb]) L.eh(x, da, 0, H);
  L.box(xa - 1, xb + 1, da - 1, da, H, H + 2, { top: (x, d, c) => ((c & 1) === 0 ? 46 : 0) });
  const r = da - H - 2;
  const cL = xa - 1 + da + H;
  const w = xb - xa + 2;
  const label = 'METRO';
  const fx = L.addFx(FX_NIGHT, 0, 0);
  const tc = cL + Math.floor((w - label.length) / 2) + 1;
  L.text(tc, r, label, fx);
  const fxb = L.addFx(FX_BLINK, '○', 'o', 0, 1.6);
  L.put(tc - 3, r, '○', fxb);
  L.put(tc + label.length + 2, r, '○', fxb);
  (L.emitters ||= []).push({ kind: 'metro', x: xa, d: da, h: 0, near: da });
  // plaza: kiosco, maceteros y bancos
  L.near = 30;
  P.kiosk(L, xb + 12, da + 1);
  P.planter(L, xa - 16, da - 1, rng);
  L.near = db + 4;
  L.spriteAt(xa - 4, db + 4, 0, P.SPR.bench);
  L.spriteAt(xb + 30, da + 2, 0, P.SPR.bench);
  L.spriteAt(xb + 14, da + 1, 0, P.SPR.rack);
  // más adentro de la plaza (se ve en pantallas altas): fuente, bancos y árboles
  L.near = db + 12;
  const fxx = xa + 6;
  const fd = db + 12;
  L.spriteAt(fxx, fd, 0, P.SPR.fountain);
  (L.emitters ||= []).push({ kind: 'fountain', x: fxx + 9, d: fd - 3, h: 2, near: fd });
  P.planter(L, xa - 22, db + 10, rng);
  P.planter(L, xb + 26, db + 9, rng);
  L.near = db + 18;
  L.spriteAt(fxx - 10, fd + 4, 0, P.SPR.bench);
  L.spriteAt(fxx + 20, fd + 5, 0, P.SPR.bench);
  L.spriteAt(fxx + 2, fd + 8, 0, P.SPR.pigeons);
}

// edificios bajos adelante, a los costados de la plaza
function frontLow(L, env, rng) {
  const { cols, rows, X0, Y0 } = env;
  const list = [];
  // derecha
  let x = ST.zebraX[1][1] + 8;
  const xbR = cols + rows - X0 - Y0 - 2 * ST.plaza[0] + 30;
  while (x < xbR) {
    const w = rng.int(16, 26);
    const d0 = ST.plaza[0] + 3;
    const depth = rng.int(14, 22);
    list.push({ x0: x, x1: x + w, d0, d1: d0 + depth, H: rng.int(9, 16), tiers: [], style: pickStyle(rng), rng: rng.fork(), shop: false, roofTex: rng.int(0, 2) });
    x += w + rng.int(2, 6);
  }
  // izquierda, lejos del metro
  x = ST.metro.xa - 70;
  const xaL = -X0 - Y0 - 2 * 60 - 40;
  while (x > xaL) {
    const w = rng.int(16, 26);
    const d0 = ST.plaza[0] + 3;
    const depth = rng.int(14, 22);
    list.push({ x0: x - w, x1: x, d0, d1: d0 + depth, H: rng.int(9, 16), tiers: [], style: pickStyle(rng), rng: rng.fork(), shop: false, roofTex: rng.int(0, 2) });
    x -= w + rng.int(2, 6);
  }
  list.sort((a, b) => b.x0 - a.x0);
  for (const b of list) drawBuilding(L, b);
}

// --------------------------------------------------------- primer plano
// Lo que pasa cerca de la cámara, más rápido: cables de la calle con pájaros
// posados (cruzan el título durante la bajada) y, al final, la copa de un
// árbol y un farol grandes en las esquinas de abajo.
function drawNear(L, env, rng) {
  const { cols, rows, X0, Y0, S } = env;
  const f = L.f;
  // cables: cada tanda cruza el centro de la pantalla en una fracción q del viaje
  const passes = [0.2, 0.47, 0.71];
  for (const q of passes) {
    const d = 40;
    const hc = f * S * (1 - Math.min(1, q / 0.88));
    const h = Math.round(d - rows / 2 + Y0 + hc);
    // dos o tres cables paralelos, con la misma comba
    // dos cables con comba distinta que se cruzan, como en cualquier esquina
    cable(L, env, rng, d, h, hc, 3 + rng.next() * 1.5, 0.5, true);
    cable(L, env, rng, d + 1, h, hc, 6.5 + rng.next() * 2, 0.35 + rng.next() * 0.3, false);
  }
  // esquinas de abajo al final: copa de árbol a la izquierda y farol a la derecha
  L.near = 60;
  const bottom = rows - Y0; // d − h de la última fila al final
  // en pantallas angostas quedan medio afuera para no tapar el metro
  const narrow = cols < 100;
  const tc = narrow ? -X0 - 17 : -X0 + 2;
  const lc = narrow ? cols - X0 - 9 : cols - X0 - 22;
  L.sprite(tc, bottom + 1, NEAR_TREE);
  L.sprite(lc, bottom + 1, NEAR_LAMP);
  const fx = L.addFx(FX_NIGHT, '○', 0);
  L.put(lc + NEAR_LAMP_HEAD[0], bottom + 1 - NEAR_LAMP.ay + NEAR_LAMP_HEAD[1], 'O', fx);
}

// cable que cuelga entre dos postes fuera de pantalla, con pájaros y una
// zapatilla colgada de vez en cuando
function cable(L, env, rng, d, h, hc, sag, mid, first) {
  const { cols, X0 } = env;
  L.near = d;
  // columnas de pantalla que cubre en el momento en que cruza: se estira para
  // seguir cubriendo mientras sube en diagonal
  const { rows } = env;
  const c0 = Math.round(hc) - X0 - rows - 50;
  const c1 = Math.round(hc) - X0 + cols + 50;
  const r0 = d - h;
  // un solo tramo más ancho que la pantalla: los postes quedan afuera
  const span = c1 - c0;
  let birdsLeft = rng.int(2, 6);
  let shoes = first && rng.chance(0.4);
  for (let c = c0; c < c1; c++) {
    const u = ((c - c0) % span) / span; // 0..1 entre postes
    // curva cuantizada a tercios de fila: ¯ - _ se tocan y no hacen falta barras
    // comba asimétrica: el punto más bajo cae en `mid`
    const v = u < mid ? u / mid : (1 - u) / (1 - mid);
    const y = r0 + sag * (1 - (1 - v) * (1 - v));
    const q = Math.floor(y * 3);
    const row = Math.floor(q / 3);
    const ch = [175, 45, 95][q - row * 3];
    L.put(c, row, ch);
    // pájaros posados sobre la línea y, muy de vez en cuando, unas zapatillas
    if (birdsLeft > 0 && u > 0.15 && u < 0.85 && rng.chance(0.03)) {
      L.put(c, ch === 95 ? row : row - 1, 118);
      if (ch === 95) L.put(c, row, 118);
      birdsLeft--;
    } else if (shoes && u > 0.3 && u < 0.7 && rng.chance(0.02)) {
      L.put(c, row + 1, 74);
      L.put(c + 1, row + 1, 74);
      shoes = false;
    }
  }
}

const NEAR_TREE = art(
  String.raw`
       _.-~~-._    _
   .-~' .  :  . '~-' '~.
 .' :  .' . : ' .  : .  '.
(  . ' :  . ' .  : ' . :  )
 ( : . ' . : ' . : .  ' :  )
(  ' . : ' . :  ' . : ' . : )
 '-._ : ' . : ' . ' : _.--'
     '~--.__/ /__.--~'
            / /`,
  0,
  10,
);
const NEAR_LAMP = art(
  String.raw`
         ____
        /    \
       '--  --'
          //
         //
        //
       //
      //
     //
    //`,
  0,
  10,
);
const NEAR_LAMP_HEAD = [11, 2];
