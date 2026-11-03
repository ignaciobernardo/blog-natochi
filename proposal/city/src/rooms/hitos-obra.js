// LA OBRA por dentro (se entra por el portón de la cerca): el patio de faena
// con la estructura de hormigón a medio hacer en perspectiva (losas, pilares y
// fierros asomando arriba), las medianeras de los vecinos, la base de la grúa
// torre con el gancho subiendo y bajando una carga, el andamio, la betonera,
// pilas de ladrillos y fierro, la caseta con los planos, letreros de
// seguridad y el letrero del proyecto: EDIFICIO NATOCHI (el título cae ahí).
// Se anima: el gancho y su carga, la betonera girando, uno que acarrea
// sacos, otro con la carretilla, chispas del esmeril, martillazos, dos
// almorzando con la radio y el termo, el capataz con los planos. De noche:
// focos de faena con sus conos de luz, el nochero junto al brasero, un
// soldador y la luz roja de la grúa.
import { R, sprite, frames, mirror, SP, hash2, Capas, fillPoly } from './hitos-kit.js';

// --- obreros (con casco) ------------------------------------------------------------
const ACARREA = frames(R`
   .-^-.(___)
  (_____|___)
   (o  )/
   _) (_
  / |#|  \
 /  |#|   |
    |_|
    | |
    | |
   /   \
--
   .-^-.(___)
  (_____|___)
   (o  )/
   _) (_
  / |#|  \
 /  |#|   |
    |_|
    | |
    | \
   /   \
`);
const CARRETILLA = frames(R`
   .-^-.
  (_____)
   (o  )
   _) (_
  / |#| \_______
 /  |#|  \:::::/
    |_|   \___/
    | |    (o)
   /   \
--
   .-^-.
  (_____)
   (o  )
   _) (_
  / |#| \_______
 /  |#|  \:::::/
    |_|   \___/
    |  \   (o)
   /    \
`);
const CARRETILLA_I = CARRETILLA.map(mirror);
const ESMERIL = frames(R`
  .-^-.
 (_____)
  (o o)
  _) (_
 / |#| \__
/  |#|  [=]
   |_|
  _/ \_
--
  .-^-.
 (_____)
  (o o)
  _) (_
 / |#| \_
/  |#|  [=]
   |_|
  _/ \_
`);
const MARTILLO = frames(R`
 .-^-.  _
(o   )_|_|
 /|#|/
  |_|
  / \
--
 .-^-.
(o   )\
 /|#| \_
  |_|  |_|
  / \
`);
const ALMUERZO_A = frames(R`
   .-^-.
  (_____)
   (o o)  [=]
  _) - (_/
 / |#|  /
/__|#|___
  _/  \_
--
   .-^-.
  (_____)
   (o o)[=]
  _) o (_/
 / |#|  /
/__|#|___
  _/  \_
`);
const ALMUERZO_B = sprite(R`
   .-^-.
  (_____)
   (o o)
  _) - (_
 / |#| | \
/__|#|_[]_\
  _/  \_
`);
const CAPATAZ = frames(R`
  .-^-.
 (_____)
  (o o)
 __) (__
| |___| |
|_|___|_|
--
  .-^-.
 (_____)
  (- -)
 __) (__
| |___| |
|_|___|_|
`);
const NOCHERO = frames(R`
  .---.
 (o  o)
 _) - (_
/ |   | \
 _|___|_
(_______)
--
  .---.
 (-  -)
 _) - (_
/ |   | \
 _|___|_
(_______)
`);
const SOLDADOR = sprite(R`
 [##]
 (  )
 /|#|\
  |_|\--
  / \
`);

// --- máquinas y cosas -----------------------------------------------------------------
const BETONERA = [0, 1, 2, 3].map((k) => {
  const d = ['/ \\ / \\ /', '\\ / \\ / \\', '| | | | |', '- - - - -'][k];
  return sprite(R`
     .-------.
   .'         '.
  (  ${d}  )___
   '.         .'   |
     '-------'   []|
    /    |    \   |
   /_____|_____\__|
   (o)       (o)
`);
});
const ARENA = sprite(R`
     . .
   .:.:.:.
 .:.:.:.:.:.
:.:.:.:.:.:.:.
`);
const LADRILLOS = sprite(R`
 [__][__][__][__]
 [__][__][__][__]
 [__][__][__][__]
_|____________|___
`);
const FIERROS = sprite(R`
===|======|======|===
===|======|======|===
`);
const CONO = sprite(R`
  /\
 /==\
/____\
`);
const RADIO = sprite(R`
 _|_____
[o|:::|o]
`);
const TERMO = sprite(R`
[]
||
`);
const BRASERO = sprite(R`
 |::::|
 |::::|
 |____|
`);
const FOCO = sprite(R`
 [####]
  \  /
   ||
`);
const GANCHO = sprite(R`
 [o]
  |
  J
`);
const CARGA = [
  sprite(R`
 /|  |\
[_][_][_]
[_][_][_]
`),
  sprite(R`
 \    /
 |::::|
 |::::|
  \__/
`),
];

export function buildObra(room, place, target, night, rng) {
  const { cols, rows, vx } = room;
  const narrow = cols < 90;
  const ty = Math.floor(rows / 2);
  const X = (x, z) => room.x(x, z);
  const Y = (y, z) => room.y(y, z);
  const floorY = (z) => room.floorY(z);
  const capas = new Capas(room);
  const g0 = room.g;
  const onLayer = (L, fn) => {
    room.g = L;
    const r = fn();
    room.g = g0;
    return r;
  };
  room.name = 'OBRA';
  room.sub = `${place.street || 'SANTA ROSA'} · ${night ? 'turno de noche' : 'faena'}`;

  // --- cielo, medianeras de los vecinos y el piso de tierra --------------------------------
  const cielo = capas.at(9);
  {
    for (let r = 0; r < ty; r++) {
      for (let c = 0; c < cols; c++) {
        const h = hash2(c * 7, r * 13);
        if (night) {
          if (h < 0.02) cielo.put(c, r, h < 0.005 ? '*' : '.');
        }
      }
    }
    if (night) cielo.text(Math.round(cols * 0.86), 3, 'C');
    else {
      cielo.text(Math.round(cols * 0.2), 4, '.--~~-.');
      cielo.text(Math.round(cols * 0.18), 5, '(_______)');
      cielo.text(Math.round(cols * 0.7), 3, '.-~-.');
      cielo.text(Math.round(cols * 0.69), 4, '(_____)');
    }
  }
  const zV = 3.2;
  const vecinos = capas.at(zV);
  for (const side of [-1, 1]) {
    // medianera alta con ventanas y un aviso viejo
    const xa = X(vx + side * cols * 0.18, zV);
    const xb = X(vx + side * cols * 0.95, zV);
    const x0 = Math.round(Math.min(xa, xb));
    const x1 = Math.round(Math.max(xa, xb));
    const top = Math.round(Y(-rows * (side < 0 ? 0.9 : 0.5), zV));
    const bot = Math.round(floorY(zV));
    for (let r = Math.max(0, top); r < bot; r++) for (let c = x0; c <= x1; c++) vecinos.put(c, r, (c + r * 2) % 5 === 0 ? '.' : SP);
    vecinos.vline(side < 0 ? x1 : x0, Math.max(0, top), bot - 1, '|');
    vecinos.hline(x0, x1, Math.max(0, top - 1), '_');
    for (let r = Math.max(1, top + 2); r < bot - 3; r += 3) {
      for (let c = x0 + 2; c < x1 - 2; c += 4) {
        const lit = night && hash2(c, r) < 0.35;
        vecinos.text(c, r, lit ? '[:]' : '[ ]');
      }
    }
  }
  const piso = capas.at(8);
  {
    for (let r = Math.ceil(floorY(zV)); r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const h = hash2(c * 3, r * 5);
        if (h < 0.06) piso.put(c, r, h < 0.02 ? ',' : '.');
      }
    }
    // huellas de neumático que fugan
    for (const off of [-0.06, -0.03, 0.03, 0.06]) piso.line(X(vx + cols * off - cols * 0.12, 1), rows, X(vx + cols * off - cols * 0.12, zV), floorY(zV), ':');
    piso.text(Math.round(X(vx + cols * 0.1, 1.3)), Math.round(floorY(1.3)), '~~~ ~');
  }

  // --- la estructura de hormigón ----------------------------------------------------------
  const zs = narrow ? [1.75, 2.4] : [1.7, 2.25, 2.8];
  const nC = narrow ? 3 : 5;
  const bay = cols * (narrow ? 0.26 : 0.17);
  const Xs = Array.from({ length: nC }, (_, k) => vx + (k - (nC - 1) / 2) * bay);
  const Hf = rows * 0.24;
  const levels = [];
  for (let k = 0; k < 6; k++) levels.push(rows - k * Hf);
  const topLevel = 4; // la losa 4 es la última; arriba sólo pilares con fierros
  const xMin = Xs[0] - cols * 0.02;
  const xMax = Xs[nC - 1] + cols * 0.02;
  // de atrás hacia adelante: pilares de cada fila y las losas
  for (let iz = zs.length - 1; iz >= 0; iz--) {
    const z = zs[iz];
    const L = capas.at(z);
    const w = Math.max(1, Math.round(2.4 / z));
    for (const Xc of Xs) {
      const xc = Math.round(X(Xc, z));
      for (let k = 0; k <= topLevel; k++) {
        const y0 = Math.round(Y(levels[k + 1] + 1, z));
        const y1 = Math.round(Y(levels[k], z)) - 1;
        const last = k === topLevel;
        const ya = last ? Math.round(Y(levels[k] - Hf * 0.45, z)) : y0;
        for (let r = Math.max(0, ya); r <= y1; r++) {
          for (let c = xc - w; c <= xc + w; c++) L.put(c, r, SP);
          L.put(xc - w, r, '|');
          L.put(xc + w, r, '|');
          if (w >= 2 && !last && r % 3 === 0) L.put(xc, r, '.');
        }
        if (last) {
          // fierros que asoman del último pilar
          for (let c = xc - w; c <= xc + w; c += Math.max(1, w)) for (let r = Math.max(0, ya - 3); r < ya; r++) L.put(c, r, '|');
          if (ya - 4 >= 0) L.text(xc - w, ya - 4, '.'.repeat(2 * w + 1));
        }
      }
    }
  }
  // losas: canto de adelante, cantos laterales y la cara que se ve (arriba o abajo)
  const losas = capas.at(zs[0] - 0.001);
  for (let k = 1; k <= topLevel; k++) {
    const Yk = levels[k];
    const z0 = zs[0];
    const z1 = zs[zs.length - 1];
    const fx0 = X(xMin, z0);
    const fx1 = X(xMax, z0);
    const kx0 = X(xMin, z1);
    const kx1 = X(xMax, z1);
    const fy = Y(Yk, z0);
    const ky = Y(Yk, z1);
    const th = Math.max(1, Math.round(1.6 / z0));
    // la cara visible (encima si está bajo los ojos, por debajo si está arriba)
    const face = [[fx0, fy], [fx1, fy], [kx1, ky], [kx0, ky]];
    fillPoly(losas, face, (c, r) => ((c + r * 3) % 9 === 0 ? '.' : SP));
    losas.line(kx0, ky, kx1, ky);
    losas.line(fx0, fy, kx0, ky);
    losas.line(fx1, fy, kx1, ky);
    // canto de adelante
    const r0 = Math.round(fy);
    for (let r = r0; r < r0 + th; r++) for (let c = Math.round(fx0); c <= Math.round(fx1); c++) losas.put(c, r, SP);
    losas.hline(Math.round(fx0), Math.round(fx1), r0 - 1, '_');
    losas.hline(Math.round(fx0), Math.round(fx1), r0 + th - 1, '_');
    losas.put(Math.round(fx0), r0 + th - 1, '|');
    losas.put(Math.round(fx1), r0 + th - 1, '|');
    // moldajes y puntales en la última losa
    if (k === topLevel) for (let c = Math.round(fx0) + 2; c < fx1 - 1; c += 5) losas.text(c, r0 - 2, '|=|');
  }
  // los pilares de adelante tapan el canto de las losas
  {
    const z = zs[0];
    const L = capas.at(z - 0.002);
    const w = Math.max(1, Math.round(2.4 / z));
    for (const Xc of Xs) {
      const xc = Math.round(X(Xc, z));
      for (let k = 0; k < topLevel; k++) {
        const y0 = Math.round(Y(levels[k + 1], z));
        const y1 = Math.round(Y(levels[k], z)) - 1;
        for (let r = Math.max(0, y0 + 1); r <= y1; r++) {
          for (let c = xc - w; c <= xc + w; c++) L.put(c, r, SP);
          L.put(xc - w, r, '|');
          L.put(xc + w, r, '|');
          if (w >= 2 && r % 3 === 0) L.put(xc, r, ':');
        }
      }
    }
  }
  // el letrero del proyecto, colgado en el frente: el título cae en su fila
  const cartel = capas.at(zs[0] - 0.01);
  {
    const lines = narrow ? ['EDIFICIO', '', '10 pisos'] : ['E D I F I C I O', '', '12 pisos · entrega 2027'];
    const w = narrow ? 16 : 29;
    const x0 = Math.round(vx - w / 2);
    for (let r = ty - 2; r <= ty + 2; r++) for (let c = x0; c <= x0 + w; c++) cartel.put(c, r, SP);
    cartel.hline(x0 + 1, x0 + w - 1, ty - 3, '_');
    cartel.vline(x0, ty - 2, ty + 2, '|');
    cartel.vline(x0 + w, ty - 2, ty + 2, '|');
    cartel.hline(x0 + 1, x0 + w - 1, ty + 2, '_');
    lines.forEach((l, i) => l && cartel.text(Math.round(vx - l.length / 2), ty - 1 + i, l));
    if (!narrow) {
      cartel.text(x0 + 2, ty, '/!\\');
      cartel.text(x0 + w - 4, ty, '/!\\');
    }
  }

  // --- el andamio (a la derecha del frente) --------------------------------------------------
  const andamio = capas.at(zs[0] - 0.05);
  const anX0 = Math.round(X(xMax, zs[0] - 0.05)) + 1;
  const anX1 = anX0 + (narrow ? 5 : 9);
  const anTop = Math.max(1, Math.round(Y(levels[3], zs[0] - 0.05)));
  const anBot = Math.round(floorY(zs[0] - 0.05));
  {
    const a = andamio;
    for (const x of [anX0, anX1]) a.vline(x, anTop, anBot - 1, '|');
    const step = Math.max(3, Math.round(Hf / zs[0] / 2));
    for (let y = anBot - 1; y >= anTop; y -= step) {
      a.hline(anX0, anX1, y, '_');
      a.text(anX0, y + 1, '=' + '='.repeat(anX1 - anX0 - 1) + '=');
      a.line(anX0 + 0.5, y + 0.5, anX1 - 0.5, y - step + 1.5);
    }
  }

  // --- la grúa torre (la base y el mástil a la izquierda) -----------------------------------
  const zG = narrow ? 1.5 : 1.45;
  const gx = Math.round(X(vx - cols * (narrow ? 0.4 : 0.36), zG));
  const grua = capas.at(zG);
  {
    const yb = Math.round(floorY(zG));
    // base de hormigón con lastre
    grua.text(gx - 5, yb - 3, '._________.');
    grua.text(gx - 5, yb - 2, '|[##][##]|_');
    grua.text(gx - 5, yb - 1, '|_________|');
    for (let r = 0; r < yb - 3; r++) grua.text(gx - 1, r, r % 2 ? '|\\|' : '|/|');
    // escalerilla
    for (let r = 2; r < yb - 3; r += 2) grua.put(gx + 2, r, '=');
    grua.text(gx + 3, Math.round(yb * 0.55), ' GRUA ');
  }

  // --- caseta con los planos (derecha, adelante) ---------------------------------------------
  const caseta = capas.at(1.12);
  let ventana = null;
  {
    const X0 = vx + cols * (narrow ? 0.18 : 0.24);
    const X1 = vx + cols * (narrow ? 0.62 : 0.56);
    const box = onLayer(caseta, () => room.box(X0, X1, rows * 0.34, 1.12, 1.4, (c, r) => (r % 2 === 0 && c % 3 === 0 ? '|' : 0)));
    const { c0, c1, r0, r1 } = box;
    const vis1 = Math.min(cols - 2, c1);
    // techo plano con alero
    caseta.hline(c0 - 1, Math.min(cols - 1, c1 + 1), r0 - 2, '_');
    // ventana con los planos y el capataz
    const wx0 = c0 + 3;
    const wx1 = Math.min(vis1 - 2, c0 + (narrow ? 14 : 22));
    const wy0 = r0 + 2;
    const wy1 = Math.min(r1 - 3, r0 + 7);
    if (wx1 - wx0 >= 10 && wy1 - wy0 >= 4) {
      for (let r = wy0; r <= wy1; r++) for (let c = wx0; c <= wx1; c++) caseta.put(c, r, SP);
      caseta.hline(wx0, wx1, wy0 - 1, '_');
      caseta.hline(wx0, wx1, wy1, '_');
      caseta.vline(wx0, wy0, wy1, '|');
      caseta.vline(wx1, wy0, wy1, '|');
      // plano clavado en la pared del fondo
      caseta.text(wx1 - 8, wy0 + 1, '.-----.');
      caseta.text(wx1 - 8, wy0 + 2, '|_|¯|_|');
      caseta.text(wx1 - 8, wy0 + 3, "'-----'");
      ventana = { x: wx0 + 2, y: wy1 - CAPATAZ[0].h + 1 };
    }
    // puerta
    const dx0 = Math.min(vis1 - 8, wx1 + 4);
    if (dx0 > wx1 + 2 && dx0 + 6 <= vis1) {
      for (let r = r0 + 2; r <= r1; r++) for (let c = dx0; c <= dx0 + 6; c++) caseta.put(c, r, SP);
      caseta.hline(dx0, dx0 + 6, r0 + 1, '_');
      caseta.vline(dx0, r0 + 2, r1, '|');
      caseta.vline(dx0 + 6, r0 + 2, r1, '|');
      caseta.put(dx0 + 5, Math.round((r0 + r1) / 2) + 1, 'o');
      caseta.text(dx0 + 1, r0 + 3, 'OFIC');
    }
    // letreros de seguridad
    const signs = narrow ? [['/!\\', 'CASCO']] : [['/!\\', 'USO OBLIGATORIO', 'DE CASCO'], ['(X)', 'PROHIBIDO', 'EL PASO']];
    let sy = r1 - 6;
    signs.forEach((sg, i) => {
      const w = Math.max(...sg.map((l) => l.length)) + 2;
      const sx = c0 + 3 + i * (w + 2);
      if (sx + w > vis1 - (dx0 > 0 ? 0 : 0) || sy < r0 + 1) return;
      if (dx0 > 0 && sx + w > dx0 - 1) return;
      for (let r = sy; r < sy + sg.length + 1; r++) for (let c = sx; c < sx + w; c++) caseta.put(c, r, SP);
      caseta.hline(sx, sx + w - 1, sy - 1, '_');
      caseta.vline(sx - 1, sy, sy + sg.length, '|');
      caseta.vline(sx + w, sy, sy + sg.length, '|');
      caseta.hline(sx, sx + w - 1, sy + sg.length, '_');
      sg.forEach((l, j) => caseta.text(sx + Math.floor((w - l.length) / 2), sy + j, l));
    });
  }

  // --- el patio: betonera, arena, ladrillos, fierros, conos --------------------------------
  const patio = capas.at(1.22);
  const betX = Math.round(X(vx - cols * (narrow ? 0.34 : 0.3), 1.22)) - 4;
  const betY = Math.round(floorY(1.22)) - BETONERA[0].h + 1;
  patio.blit(ARENA, betX - ARENA.w + 2, Math.round(floorY(1.22)) - ARENA.h + 1);
  const pal = capas.at(1.08);
  const ladX = Math.round(X(vx + cols * 0.03, 1.08)) - (narrow ? 14 : 10);
  const ladY = rows - LADRILLOS.h - 1;
  pal.blit(LADRILLOS, ladX, ladY);
  if (!narrow) pal.blit(FIERROS, ladX + LADRILLOS.w + 2, rows - FIERROS.h - 2);
  for (const [Xc, z] of narrow ? [[vx + cols * 0.05, 1.3]] : [[vx + cols * 0.04, 1.35], [vx - cols * 0.02, 1.6], [vx + cols * 0.12, 1.25]]) {
    capas.at(z).blit(CONO, Math.round(X(Xc, z)) - 3, Math.round(floorY(z)) - CONO.h + 1);
  }
  // los que almuerzan, sentados sobre los ladrillos (de día)
  const almX = ladX + 1;
  const almY = ladY - ALMUERZO_A[0].h + 2;
  // focos de faena (de noche)
  const focos = [];
  if (night) {
    for (const side of [-1, 1]) {
      const z = 1.15;
      const x = Math.round(X(vx + side * cols * (narrow ? 0.4 : 0.45), z));
      const L = capas.at(z);
      const top = Math.round(Y(rows * 0.12, z));
      const bot = Math.round(floorY(z));
      for (let r = top + 3; r < bot; r++) if (L.get(x, r) === 0) L.put(x, r, '|');
      L.text(x - 2, bot - 1, '/_|_\\');
      L.blit(FOCO, x - 3, top);
      focos.push({ x, y: top + 1, side });
    }
  }
  const brasero = { x: betX + (narrow ? -2 : 2), y: Math.round(floorY(1.2)) - BRASERO.h + 1 };
  if (night) capas.at(1.19).blit(BRASERO, brasero.x, brasero.y);

  capas.bake();

  // posiciones de la gente
  const zW = narrow ? 1.5 : 1.55;
  const walkY = (s) => Math.round(floorY(zW)) - s.h + 1;
  const grindX = Math.round(X(Xs[narrow ? 0 : 1], zs[0])) + 3;
  const grindY = Math.round(floorY(zs[0])) - ESMERIL[0].h + 1;
  const hamX = Math.round(X(Xs[nC - 2], zs[0])) - 8;
  const hamY = Math.round(Y(levels[1], zs[0])) - MARTILLO[0].h;
  const weldX = Math.round(X(Xs[nC - 2], zs[0])) + 4;
  const weldY = Math.round(Y(levels[2], zs[0])) - SOLDADOR.h;

  return {
    anim(out, t) {
      // --- focos de noche ------------------------------------------------------------------
      for (const f of focos) {
        out.put(f.x - 2 + (Math.floor(t * 8) % 4), f.y - 1, '*');
        // cono de luz hacia la estructura: bordes punteados y polvo adentro
        const tx = vx - f.side * cols * 0.04;
        const tyy = ty + rows * 0.08;
        const spread = rows * 0.22;
        const n = Math.round(Math.abs(tx - f.x) / 1.5);
        for (let k = 2; k < n; k++) {
          const u = k / n;
          const x = f.x + (tx - f.x) * u;
          const yc = f.y + 1 + (tyy - f.y - 1) * u;
          const hw = u * spread * 0.5;
          const free = (x, y) => {
            const v = out.get(x, y);
            return v === SP || v === 46;
          };
          for (const e of [-1, 1]) {
            const y = Math.round(yc + e * hw);
            if (k % 2 === 0 && free(x, y)) out.put(x, y, ':');
          }
          for (let y = Math.ceil(yc - hw) + 1; y < yc + hw; y++) {
            if (hash2(Math.round(x) * 7 + Math.floor(t * 2), y * 3) < 0.07 && free(x, y)) out.put(x, y, "'");
          }
        }
      }
      // ampolletas colgando dentro de los pisos
      if (night) {
        for (const [k, i] of [[1, 1], [2, nC - 2], [3, 0]]) {
          if (i < 0 || i + 1 >= nC) continue;
          const z = zs[Math.min(1, zs.length - 1)];
          const x = Math.round(X((Xs[i] + Xs[i + 1]) / 2, z));
          const y = Math.round(Y(levels[k + 1], z)) + 2;
          if (y === ty || y + 1 === ty) continue;
          out.put(x, y - 1, '|');
          out.put(x, y, Math.floor(t * 3 + k) % 9 === 0 ? 'o' : '*');
          for (const d of [-2, 2]) if (out.get(x + d, y + 1) === SP) out.put(x + d, y + 1, '.');
        }
      }
      // luz roja de la grúa (arriba del mástil)
      if (night && Math.floor(t * 1.5) % 2) out.put(gx, 0, '*');

      // --- el gancho de la grúa con su carga ---------------------------------------------------
      {
        const per = 22;
        const ph = (t % per) / per;
        // recoger abajo a la izquierda, subir, correr, bajar sobre la losa, soltar, volver
        const xA = gx + 6;
        const xB = Math.round(X(Xs[nC - 2], zs[0]));
        const yLow = Math.round(floorY(1.5)) - 6;
        const yHigh = 3;
        const yDrop = Math.round(Y(levels[3], zs[0])) - 5;
        let hx;
        let hy;
        let loaded;
        if (ph < 0.25) {
          hx = xA;
          hy = yLow + (yHigh - yLow) * (ph / 0.25);
          loaded = true;
        } else if (ph < 0.5) {
          hx = xA + (xB - xA) * ((ph - 0.25) / 0.25);
          hy = yHigh;
          loaded = true;
        } else if (ph < 0.62) {
          hx = xB;
          hy = yHigh + (yDrop - yHigh) * ((ph - 0.5) / 0.12);
          loaded = true;
        } else if (ph < 0.7) {
          hx = xB;
          hy = yDrop;
          loaded = false;
        } else {
          const u = (ph - 0.7) / 0.3;
          hx = xB + (xA - xB) * u;
          hy = yDrop + (yLow - yDrop) * u;
          loaded = false;
        }
        hx = Math.round(hx + Math.sin(t * 1.3) * (loaded ? 0.6 : 0));
        hy = Math.round(hy);
        for (let r = 0; r < hy; r++) out.put(hx + 1, r, '|');
        out.blit(GANCHO, hx - 1, hy);
        if (loaded) {
          const c = CARGA[Math.floor(t / per) % 2];
          capas.blit(out, c, hx + 1 - Math.floor(c.w / 2), hy + GANCHO.h, 1.4);
        }
      }

      // --- la betonera gira ----------------------------------------------------------------------
      capas.blit(out, BETONERA[Math.floor(t * 5) % 4], betX, betY, 1.21);
      if (!night) {
        // salpica un poco de mezcla
        if (Math.floor(t * 3) % 5 === 0) out.put(betX + 15, betY + 2, '.');
      }

      // --- el brasero y el nochero (de noche) ------------------------------------------------------
      if (night) {
        for (let k = 0; k < 4; k++) {
          const u = (t * 1.1 + k * 0.25) % 1;
          const x = brasero.x + 2 + k % 3 + Math.round(Math.sin(t * 3 + k) * 0.7);
          const y = brasero.y - 1 - Math.floor(u * 4);
          out.put(x, y, u < 0.3 ? ')' : u < 0.55 ? '(' : u < 0.8 ? "'" : '.');
        }
        const nf = NOCHERO[(t % 9) < 1.5 ? 1 : 0];
        capas.blit(out, nf, brasero.x + BRASERO.w + 1, Math.round(floorY(1.2)) - nf.h + 1, 1.18);
        if ((t % 30) < 4) out.text(brasero.x + BRASERO.w + 1, Math.round(floorY(1.2)) - nf.h - 2, ' ¿quién anda ahí? ');
      }

      // --- obreros ------------------------------------------------------------------------------
      if (!night) {
        // el que acarrea sacos cruza el patio
        {
          const per = 16;
          const u = (t % per) / per;
          const fr = ACARREA[Math.floor(t * 3) % 2];
          const x = Math.round(-14 + u * (cols + 20));
          capas.blit(out, fr, x, walkY(fr), zW);
        }
        // el de la carretilla, al revés
        {
          const per = 19;
          const u = ((t + 7) % per) / per;
          const fr = CARRETILLA_I[Math.floor(t * 3) % 2];
          const x = Math.round(cols + 6 - u * (cols + 26));
          capas.blit(out, fr, x, walkY(fr) + 1, zW + 0.02);
        }
        // los que almuerzan con la radio
        {
          const a = ALMUERZO_A[Math.floor(t * 0.8) % 2];
          capas.blit(out, a, almX, almY, 1.07);
          capas.blit(out, ALMUERZO_B, almX + a.w + 1, almY, 1.07);
          const rx = almX + a.w + ALMUERZO_B.w + 2;
          const ryy = ladY - RADIO.h;
          out.blit(RADIO, rx, ryy);
          for (let k = 0; k < 2; k++) {
            const u = (t * 0.5 + k * 0.5) % 1;
            const x = Math.round(rx + 3 + u * 6);
            const y = Math.round(ryy - 1 - u * 4);
            if (out.get(x, y) === SP) out.put(x, y, k ? '♪' : '♫');
          }
          // el termo humea
          out.blit(TERMO, almX + a.w - 1, ladY - TERMO.h);
          for (let k = 0; k < 3; k++) {
            const u = (t * 0.8 + k * 0.33) % 1;
            const x = Math.round(almX + a.w - 1 + Math.sin(t * 2 + k) * 1.2);
            const y = Math.round(ladY - TERMO.h - 1 - u * 3);
            if (out.get(x, y) === SP) out.put(x, y, u < 0.6 ? '~' : '.');
          }
        }
        // el capataz mira los planos por la ventana
        if (ventana) out.blit(CAPATAZ[(t % 7) < 0.5 ? 1 : 0], ventana.x, ventana.y);
        // martillazos en la primera losa
        {
          const k = Math.floor(t * 3) % 2;
          capas.blit(out, MARTILLO[k], hamX, hamY, zs[0] - 0.003);
          if (k && (hamY - 1 < ty - 3 || hamY - 1 > ty + 2)) out.text(hamX + 9, hamY - 1, 'toc');
        }
      }
      // el esmeril corta fierro y tira chispas (también de noche, el soldador)
      {
        const fr = ESMERIL[Math.floor(t * 10) % 2];
        if (!night) capas.blit(out, fr, grindX, grindY, zs[0] - 0.003);
        const sx = night ? weldX + 7 : grindX + 11;
        const sy = night ? weldY + 3 : grindY + 5;
        if (night) out.blit(SOLDADOR, weldX, weldY);
        const n = night ? 10 : 7;
        for (let k = 0; k < n; k++) {
          const u = (t * 2.2 + hash2(k, 7)) % 1;
          const a = -0.4 + hash2(k, 3) * 1.6;
          const x = Math.round(sx + Math.cos(a) * u * 8);
          const y = Math.round(sy - Math.sin(a) * u * 3 + u * u * 4);
          if (y === ty) continue;
          out.put(x, y, u < 0.3 ? '*' : u < 0.7 ? "'" : '.');
        }
      }
    },
  };
}
