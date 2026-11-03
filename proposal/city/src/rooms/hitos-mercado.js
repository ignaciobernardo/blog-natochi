// EL MERCADO CENTRAL por dentro (fierro y vidrio, 1928): el pasillo central
// visto desde la entrada, con las cerchas de fierro en arco que fugan hacia
// el fondo, el techo de vidrio, columnas de fundición, puestos a los dos
// lados (frutas en pirámide, pescados en hielo, ristras de ajos y ajíes,
// quesos, flores, abarrotes), letreros con precios en pesos y, al fondo, la
// cocinería "DONDE NATOCHI": el título cae en su letrero.
// Se anima: los caseros que gritan, gente que cruza con bolsas y carro, las
// palomas en las cerchas, un gato, el vapor de las ollas, el reloj (con la
// hora de verdad), los rayos de sol por el vidrio. De noche se está cerrando:
// cortinas metálicas a media altura, ampolletas prendidas, alguien barre.
import { R, sprite, frames, mirror, SP, hash2, Capas, arc, curve, fillPoly } from './hitos-kit.js';

// --- caseros (detrás del mesón: sólo asoman de la cintura para arriba) -------
const FRUTERO = frames(R`
   _____
  |_____|_
   (o o)
    \-/
 .--' '--.
/ |  :  | \
| |  :  | |
--
   _____
  |_____|_
   (o o)
    \O/
 .--' '--.\
/ |  :  |  )
| |  :  |
`);
const PESCADOR = frames(R`
   .---.
  ( o o )
   \ - /
 .-'---'-.
/ |#####| \
| |#####| |
--
   .---.
  ( o o )
   \ O /   ><>
 .-'---'-.//
/ |#####|/
| |#####|
`);
const CASERA = frames(R`
  .-.
 (o.o)
 _)-(_
/ |:| \
--
  .-.
 (o.o)
 _)O(_/
/ |:|
`);

// --- gente que cruza (de perfil, va a la derecha) ----------------------------
const SENORA = frames(R`
   .-.
  (  o)
  _) (_
 /     \
/ |   | \
  |   |  [__]
  |___|  |  |
   | |   '--'
   | |
  /   \
--
   .-.
  (  o)
  _) (_
 /     \
/ |   | \
  |   |  [__]
  |___|  |  |
   | |   '--'
   |  \
  /    \
`);
const CARRO = sprite(R`
 .----.
 |::::|
 |::::|
 '-oo-'
`);
const SENOR = frames(R`
   ___
  (  o)
   )_(
  /   \
 /|   |\
  |   | [=]
  |___|
  |  |
  |  |
  /  \
--
   ___
  (  o)
   )_(
  /   \
 /|   |\
  |   | [=]
  |___|
  |  \
  |   \
  /    \
`);
const BARRENDERO = frames(R`
   .-.
  (o  )
  _) (_
 /     \
/ |   |\\
  |   | \\
  |___|  \\
   | |    \\
   | |   _\\\
  /   \ /////
--
   .-.
  (o  )
  _) (_
 /     \
/ |   | |
  |   | |
  |___| |
   | |  |
   | |  |
  /   \///
`);

// los mismos, caminando hacia la izquierda
const ESPEJO = new Map([SENORA, SENOR, BARRENDERO].map((f) => [f, f.map(mirror)]));

const GATO = frames(R`
 /\_/\
( o.o )
 =\ /=
 /   \
(_)_(_)~
--
 /\_/\
( o.o )
 =\ /=
 /   \
(_)_(_)_
--
 /\_/\
( -.- )
 =\ /=
 /  _\
(_)_(/)_
`);

// baldes con flores al borde del pasillo
const FLORES = sprite(R`
*\|/o o\|*
\|/*| *|/
 |_|  |_|
`);

const PALOMA = [sprite('(o>'), sprite('<o)'), sprite('(o<'), sprite('\\v/'), sprite('-v-')];

const OLLA = sprite(R`
.-----.
|_____|
`);

const COCINERO = frames(R`
  .---.
  |   |
  '---'
  (o o)
 .-)-(-.
/|     |\
--
  .---.
  |   |
  '---'
  (o o)
 .-)-(-.  ~
/|     |\/
`);
const COMENSAL = sprite(R`
 .-.
(:::)
/' '\
|   |
`);

const AMPOLLETA = sprite(R`
 |
 |
/_\
`);

export function buildMercado(room, place, target, night, rng) {
  const { cols, rows, vx, vy } = room;
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
  room.name = 'MERCADO CENTRAL';
  room.sub = `${place.street || 'SANTA ROSA'} · 1928 · ${night ? 'cerrando' : 'abierto'}`;

  // --- medidas del galpón ------------------------------------------------------------
  const Zb = narrow ? 2.2 : 2.6;
  const Wh = cols * (narrow ? 0.72 : 0.55); // columnas y arranque de las cerchas
  const aw = cols * (narrow ? 0.13 : 0.1); // medio pasillo
  const Yr = rows * 0.02; // arranque del arco del techo
  const Rv = Wh * 0.25; // flecha del arco (rebajado)
  const Hc = rows * 0.26; // alto de los mesones
  const units = narrow ? [[1.06, 1.3], [1.48, 1.9]] : [[1.06, 1.38], [1.58, 2.3]];
  const trussZ = narrow ? [1.4, 1.75, 2.05] : [1.5, 1.9, 2.3];

  // --- el fondo: la luneta de vidrio, el reloj y la fachada de la cocinería -------------
  const fondo = capas.at(Zb);
  const bx0 = X(vx - Wh, Zb);
  const bx1 = X(vx + Wh, Zb);
  const bSpring = Y(Yr, Zb);
  const bFloor = floorY(Zb);
  const arcPts = (z, k = 1) => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI - (Math.PI * i) / 40;
      pts.push([vx + ((Wh * k) / z) * Math.cos(a), Y(Yr - Rv * k * Math.sin(a), z)]);
    }
    return pts;
  };
  {
    const pts = [[bx0, bFloor], ...arcPts(Zb), [bx1, bFloor]];
    fillPoly(fondo, pts, SP);
    const cy = bSpring;
    curve(fondo, arcPts(Zb));
    for (let r = Math.ceil(Y(Yr - Rv, Zb)) + 1; r < cy; r++) for (let c = Math.ceil(bx0) + 1; c < bx1; c++) if ((c * 5 + r * 3) % 17 === 0) fondo.put(c, r, '/');
    fondo.hline(Math.round(bx0), Math.round(bx1), Math.round(cy) + 2, '¯');
    fondo.vline(Math.round(bx0), Math.ceil(cy), Math.floor(bFloor), '|');
    fondo.vline(Math.round(bx1), Math.ceil(cy), Math.floor(bFloor), '|');
  }
  // el reloj del mercado en el centro de la luneta
  const reloj = { x: vx, y: Math.min(ty - 7, Math.round(Y(Yr - Rv * 0.3, Zb - 0.2))), rx: narrow ? 3.4 : 5.2, ry: narrow ? 1.6 : 2.4 };
  fillPoly(
    fondo,
    Array.from({ length: 20 }, (_, i) => [reloj.x + Math.cos((i / 20) * Math.PI * 2) * (reloj.rx + 0.6), reloj.y - Math.sin((i / 20) * Math.PI * 2) * (reloj.ry + 0.4)]),
    SP,
  );
  arc(fondo, reloj.x, reloj.y, reloj.rx + 0.6, reloj.ry + 0.4, 0, Math.PI * 2, { round: true });
  for (let r = 0; r < reloj.y - reloj.ry - 1; r++) fondo.put(reloj.x, r, r % 2 ? ':' : '|');
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    if (k % 3 === 0) fondo.put(reloj.x + Math.sin(a) * reloj.rx * 0.95, reloj.y - Math.cos(a) * reloj.ry * 0.95, '.');
  }
  fondo.text(Math.round(reloj.x - 2), Math.round(reloj.y + reloj.ry + 1), '1928');
  // la cocinería: letrero (con el título), pizarra, mesón con ollas, cocinero y comensales
  const coc = capas.at(Zb - 0.05);
  const sW = Math.min(Math.round((bx1 - bx0) * 0.5), 27);
  const sx0 = Math.round(vx - sW / 2);
  const sx1 = sx0 + sW;
  {
    for (let r = ty - 2; r <= ty + 2; r++) for (let c = sx0; c <= sx1; c++) coc.put(c, r, SP);
    coc.hline(sx0 + 1, sx1 - 1, ty - 3, '_');
    coc.vline(sx0, ty - 2, ty + 2, '|');
    coc.vline(sx1, ty - 2, ty + 2, '|');
    coc.hline(sx0 + 1, sx1 - 1, ty + 2, '_');
    coc.text(Math.round(vx - 2.5), ty - 1, 'DONDE');
    const sub = narrow ? 'mariscos' : 'pescados · mariscos';
    coc.text(Math.round(vx - sub.length / 2), ty + 1, sub);
    coc.put(sx0 + 2, ty, '*');
    coc.put(sx1 - 2, ty, '*');
    // colgado del techo con dos cadenas
    for (let r = Math.max(0, Math.round(bSpring) + 3); r < ty - 3; r++) {
      coc.put(sx0 + 3, r, r % 2 ? ':' : '|');
      coc.put(sx1 - 3, r, r % 2 ? ':' : '|');
    }
  }
  // la pizarra del menú y el mesón de la cocinería
  const mesonTop = Math.round(Y(rows * 0.8, Zb - 0.1));
  const mesonBot = Math.round(floorY(Zb - 0.1));
  const mx0 = Math.round(X(vx - Wh * 0.42, Zb - 0.1));
  const mx1 = Math.round(X(vx + Wh * 0.42, Zb - 0.1));
  const ollas = [];
  const comensales = [];
  {
    const L = capas.at(Zb - 0.1);
    for (let r = mesonTop; r < mesonBot; r++) for (let c = mx0; c <= mx1; c++) L.put(c, r, SP);
    L.hline(mx0 - 1, mx1 + 1, mesonTop - 1, '_');
    L.vline(mx0, mesonTop, mesonBot - 1, '|');
    L.vline(mx1, mesonTop, mesonBot - 1, '|');
    for (let c = mx0 + 3; c < mx1; c += 4) for (let r = mesonTop + 1; r < mesonBot; r++) L.put(c, r, '|');
    // ollas sobre el mesón
    for (let k = 0; k < (narrow ? 2 : 3); k++) {
      const x = Math.round(mx0 + 3 + k * (OLLA.w + 3));
      if (x + OLLA.w > mx1 - 2) break;
      L.blit(OLLA, x, mesonTop - OLLA.h);
      ollas.push({ x: x + 3, y: mesonTop - OLLA.h - 1 });
    }
    // pizarra a la derecha
    if (!narrow) {
      const px = sx1 + 3;
      const py = ty - 1;
      const menu = ['MENU DEL DIA', 'caldillo de', '  congrio', 'paila marina', '   $6.990'];
      if (px + 15 < bx1) {
        for (let r = py - 1; r <= py + menu.length; r++) for (let c = px; c <= px + 15; c++) L.put(c, r, SP);
        L.hline(px, px + 15, py - 1, '_');
        L.vline(px, py, py + menu.length, '|');
        L.vline(px + 15, py, py + menu.length, '|');
        L.hline(px + 1, px + 14, py + menu.length, '_');
        menu.forEach((m, i) => L.text(px + 2, py + i, m));
      }
    }
    // comensales en sus pisos, de espaldas
    for (let k = 0; k < (narrow ? 2 : 4); k++) {
      const x = Math.round(mx0 + 2 + (k + 0.5) * ((mx1 - mx0 - 4) / (narrow ? 2 : 4))) - 2;
      comensales.push({ x, y: mesonTop + 1, seed: k });
    }
  }
  const cocX = Math.round(vx + (narrow ? 2 : 6));
  const cocY = Math.max(ty + 3, mesonTop - COCINERO[0].h + 1);

  // --- el techo: cerchas de fierro en arco, vidrio y correas ----------------------------
  const techo = capas.at(Zb + 0.5);
  {
    const t = techo;
    // correas que fugan, con vidrios entre medio
    for (let k = 1; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const z = 1 + ((Zb - 1) * i) / 24;
        pts.push([X(vx + Wh * Math.cos(a), z), Y(Yr - Rv * Math.sin(a), z)]);
      }
      curve(t, pts, { ch: '.' });
    }
    // vidrios: reflejos o estrellas
    for (let r = 0; r < ty - 4; r++) {
      for (let c = 0; c < cols; c++) {
        const h = hash2(c * 3, r * 11);
        if (night) {
          if (h < 0.025) t.put(c, r, h < 0.008 ? '*' : '.');
        } else if (h < 0.012) t.put(c, r, h < 0.006 ? '/' : '.');
      }
    }
  }
  const cerchas = [];
  for (const z of trussZ) {
    const L = capas.at(z);
    const outer = arcPts(z);
    const inner = arcPts(z, 0.86).map(([x, y]) => [x, y + 0.6 / z]);
    // relleno opaco entre los dos cordones y celosía en zigzag
    const band = outer.concat(inner.slice().reverse());
    fillPoly(L, band, SP);
    curve(L, outer);
    curve(L, inner);
    for (let i = 4; i + 4 < outer.length; i += 4) {
      const [ox, oy] = outer[i];
      const [ix, iy] = inner[i];
      if (Math.abs(oy - iy) >= 1.5) L.line(ox, oy, ix, iy);
      else L.put((ox + ix) / 2, (oy + iy) / 2, 'o');
    }
    cerchas.push({ z, pts: outer });
    // columnas de fundición con capitel y ménsula
    for (const side of [-1, 1]) {
      const xc = X(vx + side * Wh, z);
      const top = Math.round(Y(Yr, z));
      const bot = Math.round(floorY(z));
      const w = Math.max(1, Math.round(1.6 / z));
      for (let r = top; r < bot; r++) {
        for (let c = Math.round(xc) - w; c <= Math.round(xc) + w; c++) L.put(c, r, SP);
        L.put(Math.round(xc) - w, r, '|');
        L.put(Math.round(xc) + w, r, '|');
      }
      L.text(Math.round(xc) - w - 1, top, '}' + '='.repeat(2 * w - 1) + '{');
      L.text(Math.round(xc) - w - 1, bot - 1, '[' + '_'.repeat(2 * w - 1) + ']');
      // ménsula curva hacia adentro
      for (let k = 1; k <= 3; k++) L.put(Math.round(xc) - side * (w + k), top + k - 1, side < 0 ? '\\' : '/');
    }
  }
  // ampolletas colgando del techo, a lo largo del pasillo
  const luces = [];
  for (const z of trussZ.slice(1)) {
    for (const side of narrow ? [0] : [-1, 1]) {
      const x = Math.round(X(vx + side * aw * 1.1, z));
      if (Math.abs(x - vx) < 7 && z > 2.1) continue;
      const yb = Math.round(Y(Yr + rows * 0.08, z));
      if (Math.abs(yb + 2 - ty) < 2) continue;
      const L = capas.at(z - 0.01);
      const top = Math.max(0, Math.round(Y(Yr - Rv * 0.95, z)));
      for (let r = top; r < yb; r++) L.put(x, r, '|');
      L.blit(AMPOLLETA, x - 1, yb);
      luces.push({ x, y: yb + 3 });
    }
  }

  // --- el piso: baldosas y charcos ------------------------------------------------------------
  const piso = capas.at(Zb + 0.3);
  {
    const step = cols * 0.07;
    for (let Xk = vx - aw * 3; Xk <= vx + aw * 3; Xk += step) piso.line(X(Xk, 1), rows, X(Xk, Zb), bFloor);
    for (let i = 1; i < 7; i++) {
      const z = 1 / (1 - (i / 7) * (1 - 1 / Zb));
      piso.line(X(vx - aw * 3, z), floorY(z), X(vx + aw * 3, z), floorY(z));
    }
    for (let k = 0; k < 4; k++) {
      const z = 1.15 + k * 0.3;
      const x = Math.round(X(vx + (hash2(k, 2) - 0.5) * aw, z));
      piso.text(x - 2, Math.round(floorY(z)) - 1, '~~ ~');
    }
  }

  // --- los puestos ---------------------------------------------------------------------------
  const PUESTOS = [
    { side: -1, u: 0, name: 'DON TITO', front: 'FRUTAS Y VERDURAS', goods: 'frutas', shout: ['¡a luca el kilo!', '¡pruebe, caserita!', '¡llévelo!'], v: FRUTERO },
    { side: 1, u: 0, name: 'LA CALETA', front: 'PESCADOS Y MARISCOS', goods: 'pescados', shout: ['¡fresquito el congrio!', '¡reineta, reineta!', '¡pase, mi reina!'], v: PESCADOR },
    { side: -1, u: 1, name: 'AJOS · AJÍES', goods: 'ajos', shout: ['¡el ajo chilote!'], v: CASERA },
    { side: 1, u: 1, name: 'QUESOS', goods: 'quesos', shout: ['¡queso de cabra!'], v: CASERA },
  ];
  const caseros = [];
  const cortinas = [];
  for (const p of PUESTOS.slice().sort((a, b) => b.u - a.u)) {
    const [za, zb] = units[p.u];
    const L = capas.at(za);
    const s = p.side;
    const Xin = vx + s * aw;
    const Xout = vx + s * (Wh - cols * 0.04);
    const box = onLayer(L, () =>
      room.box(Math.min(Xin, Xout), Math.max(Xin, Xout), Hc, za, zb, (c, r) => (r === 0 ? '=' : c % 9 === 0 ? '|' : 0)),
    );
    const { c0, c1, r0, r1 } = box;
    const vis0 = Math.max(0, c0);
    const vis1 = Math.min(cols - 1, c1);
    const near = p.u === 0;
    // nombre pintado en el frente (los cercanos) y precios
    const midC = Math.round((Math.max(c0, 1) + Math.min(c1, cols - 2)) / 2);
    if (near) {
      const label = ` ${p.front || p.name} `;
      if (vis1 - vis0 > label.length + 4) L.text(midC - Math.floor(label.length / 2), r0 + 1, label);
      const prices = {
        frutas: ['$1.000 kg', '3x$2.000', '$990', '$1.490 kg'],
        pescados: ['$4.990 kg', 'CONGRIO', '$3.500', 'REINETA'],
      }[p.goods].slice(0, narrow ? 1 : 4);
      prices.forEach((pr, i) => {
        const x = Math.round(vis0 + 3 + ((i + 0.5) * (vis1 - vis0 - 6)) / prices.length - pr.length / 2 - 1);
        if (x < vis0 + 1 || x + pr.length + 2 > vis1) return;
        const y = r0 + 3;
        if (y + 2 > r1) return;
        L.text(x, y, '.' + '-'.repeat(pr.length) + '.');
        L.text(x, y + 1, '|' + pr + '|');
        L.text(x, y + 2, "'" + '-'.repeat(pr.length) + "'");
      });
    }
    // mercadería sobre el mesón: pilas paradas en el borde de adelante
    const top = r0 - 1;
    const goods = (x0, x1, fn) => {
      for (let x = x0; x < x1; ) x += fn(x) || 1;
    };
    const left = Math.max(c0 + 1, 0);
    const right = Math.min(c1 - 1, cols - 1);
    if (!night || !near) {
      if (p.goods === 'frutas') {
        const kinds = [
          ['  o  ', ' ooo ', 'ooooo'],
          ['  ()  ', ' ()() ', '()()()'],
          ['  Ø  ', ' ØØØ ', 'ØØØØØ'],
          [' ))) ', ')))))', '(===)'],
          [' .--. ', '(====)', '(====)'],
        ];
        let k = 0;
        goods(left + 1, right - 6, (x) => {
          const pile = kinds[k++ % kinds.length];
          const h = near ? pile.length : 2;
          for (let i = 0; i < h; i++) L.text(x, top - h + 1 + i, pile[pile.length - h + i]);
          return pile[0].length + 1;
        });
      } else if (p.goods === 'pescados') {
        // hielo y pescados
        for (let c = left; c <= right; c++) L.put(c, top, (c % 3) ? ':' : '.');
        const fish = ['<°)))><', '><(((°>', '<°))><', '(\\/)'];
        let k = 0;
        goods(left + 1, right - 7, (x) => {
          const f = fish[k++ % fish.length];
          L.text(x, top - (k % 2), f);
          if (near && k % 3 === 0) L.text(x + 1, top - 2, '><>');
          return f.length + 1;
        });
      } else if (p.goods === 'quesos') {
        goods(left + 1, right - 6, (x) => {
          L.text(x, top - 1, ' ___ ');
          L.text(x, top, '(___)');
          return 6;
        });
      } else if (p.goods === 'flores') {
        goods(left + 1, right - 4, (x) => {
          L.text(x, top - 1, hash2(x, 3) < 0.5 ? '*\\|/' : 'o\\|*');
          L.text(x, top, ' |_|');
          return 5;
        });
      } else if (p.goods === 'abarrotes') {
        goods(left + 1, right - 4, (x) => {
          L.text(x, top, '[==]');
          if (hash2(x, 5) < 0.5) L.text(x, top - 1, '[::]');
          return 5;
        });
      } else if (p.goods === 'ajos') {
        goods(left + 1, right - 4, (x) => {
          L.text(x, top, 'oOo');
          return 4;
        });
      }
    }
    // armazón: pilares en las esquinas y travesaño con letrero (los de atrás)
    const Ya = rows * 0.3;
    const awT = Math.round(Y(Ya - rows * 0.06, za));
    const awB = Math.round(Y(Ya, za));
    const pillarX = [c0, c1].filter((x) => x >= 0 && x < cols);
    const postTop = near ? Math.round(Y(Ya - rows * 0.1, za)) : awT;
    for (const x of pillarX) for (let r = postTop; r < top; r++) L.put(x, r, '|');
    const aisleX = s < 0 ? c1 : c0;
    if (!near) {
      for (let r = awT; r <= awB; r++) for (let c = Math.max(0, c0 - 1); c <= Math.min(cols - 1, c1 + 1); c++) L.put(c, r, SP);
      L.hline(Math.max(0, c0 - 1), Math.min(cols - 1, c1 + 1), awT - 1, '_');
      L.hline(Math.max(0, c0 - 1), Math.min(cols - 1, c1 + 1), awB, '_');
      {
        const label = ` ${p.name} `;
        const span = Math.min(c1, cols - 1) - Math.max(c0, 0);
        const lx = span > label.length + 2 ? Math.round((Math.max(c0, 0) + Math.min(c1, cols - 1)) / 2 - label.length / 2) : -99;
        const ly = Math.round((awT + awB) / 2);
        if (lx > 0 && ly !== ty) L.text(lx, ly, label);
        else for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c += 2) L.put(c, ly, '/');
      }
    } else {
      // los cercanos: letrero colgado de la esquina del pasillo, de cara a nosotros
      const label = p.name;
      const w = Math.min(label.length, 12);
      const words = label.split(' ');
      const linesL = [];
      let cur = '';
      for (const wd of words) {
        if ((cur + ' ' + wd).trim().length > w) {
          linesL.push(cur.trim());
          cur = wd;
        } else cur += ' ' + wd;
      }
      if (cur.trim()) linesL.push(cur.trim());
      const bw = Math.max(...linesL.map((l) => l.length)) + 4;
      const bx = s < 0 ? aisleX - bw + 1 : aisleX;
      const by = postTop + 2;
      for (let r = by; r <= by + linesL.length + 1; r++) for (let c = bx; c < bx + bw; c++) L.put(c, r, SP);
      L.hline(bx + 1, bx + bw - 2, by, '_');
      L.vline(bx, by + 1, by + linesL.length + 1, '|');
      L.vline(bx + bw - 1, by + 1, by + linesL.length + 1, '|');
      L.hline(bx + 1, bx + bw - 2, by + linesL.length + 1, '_');
      linesL.forEach((l, i) => L.text(bx + Math.floor((bw - l.length) / 2), by + 1 + i, l));
      L.put(bx + 2, by - 1, '|');
      L.put(bx + bw - 3, by - 1, '|');
    }
    // cosas colgando del travesaño
    const hangY = near ? postTop + 1 : awB + 1;
    const hang = (x, str) => {
      for (let i = 0; i < str.length; i++) if (hangY + i < top - (near ? 4 : 1)) L.put(x, hangY + i, str[i]);
    };
    const hx0 = Math.max(1, Math.min(c0, c1) + 2);
    const hx1 = Math.min(cols - 2, Math.max(c0, c1) - 2);
    if (!night || near) {
      if (p.goods === 'ajos') for (let x = hx0; x <= hx1; x += 3) hang(x, x % 2 ? '|8o8o8o' : '|)>)>)>');
      if (p.goods === 'quesos') for (let x = hx0 + 1; x <= hx1; x += 4) hang(x, '|()');
      if (p.goods === 'flores') for (let x = hx0 + 1; x <= hx1; x += 4) hang(x, "|*'");
    }
    // la balanza colgada del puesto de frutas
    if (p.goods === 'frutas' && near) {
      const bx = Math.round((Math.max(c0, 0) + Math.min(c1, cols - 1)) / 2) + 2;
      hang(bx, '||');
      L.text(bx - 3, hangY + 2, '\\_____/');
      L.text(bx - 1, hangY + 3, '(o)');
    }
    // de noche: la cortina metálica a media altura
    if (night) {
      const ca = Math.max(0, Math.min(c0, c1));
      const cb = Math.min(cols - 1, Math.max(c0, c1));
      const ctop = near ? postTop + 1 : awB + 1;
      const half = Math.round(ctop + (top - ctop) * (near ? 0.55 : 0.6));
      for (let r = ctop; r <= half; r++) for (let c = ca; c <= cb; c++) L.put(c, r, r === half ? '_' : (r - ctop) % 2 ? '=' : SP);
      L.put(Math.round((ca + cb) / 2), half + 1, 'o');
      cortinas.push({ ca, cb, ctop, half, z: za, near });
    }
    if (p.v) {
      const fr = p.v[0];
      const vxp = Math.round((Math.max(c0, 2) + Math.min(c1, cols - 3)) / 2 - fr.w / 2 + (near ? -s * 6 : 0));
      caseros.push({ p, x: vxp, y: top - fr.h + (near ? -1 : 1), z: za + 0.12, seed: p.u * 7 + (s > 0 ? 3 : 0) });
    }
  }

  // la casera de las flores, con sus baldes en el claro entre los puestos
  const zFl = 1.03;
  const flX = Math.round(X(vx + aw * 0.55, zFl)) - FLORES.w + 1;
  const flY = rows - FLORES.h - 2;
  capas.at(zFl).blit(FLORES, flX, flY);
  capas.at(zFl).text(flX + 1, flY - 1, ' $1.500 ');

  // el gato en un cajón, al pie del puesto de frutas
  const gatoX = Math.round(X(vx - aw * 0.75, 1.04)) - GATO[0].w;
  const gatoY = rows - GATO[0].h - 2;
  {
    const L = capas.at(1.03);
    L.text(gatoX - 1, gatoY + GATO[0].h, '|______|');
    L.text(gatoX - 1, gatoY + GATO[0].h + 1, '|_|__|_|');
  }

  capas.bake();

  // palomas en las cerchas (posadas o volando)
  const palomas = [];
  for (let i = 0; i < (narrow ? 3 : 6); i++) {
    const c = cerchas[1 + (i % Math.max(1, cerchas.length - 1))] || cerchas[0];
    const k = 6 + Math.floor(hash2(i, 9) * (c.pts.length - 12));
    palomas.push({ c, k, seed: i });
  }
  // gente que cruza el pasillo en los claros entre puestos
  const zc1 = (units[0][1] + units[1][0]) / 2;
  const zc2 = (units[1][1] + Zb - 0.1) / 2;
  const reach = (z) => [X(vx - Wh, z), X(vx + Wh, z)];

  return {
    anim(out, t) {
      // --- luz -------------------------------------------------------------------------
      if (!night) {
        // rayos de sol que bajan del techo de vidrio
        for (let b = 0; b < (narrow ? 2 : 3); b++) {
          const x0 = vx - cols * 0.25 + b * cols * 0.22;
          for (let y = 0; y < rows - 6; y++) {
            const x = Math.round(x0 + y * 0.9);
            for (let w = 0; w < 5; w++) {
              const c = x + w;
              if (out.get(c, y) !== SP) continue;
              if (w === 0 && y % 2 === 0) out.put(c, y, '.');
              else if (hash2(c * 5 + Math.floor(t * 1.2), y * 3) < 0.05) out.put(c, y, (t + c) % 4 < 0.4 ? '°' : '.');
            }
          }
        }
      } else {
        // ampolletas prendidas
        for (const l of luces) {
          out.put(l.x, l.y - 1, '*');
          for (let k = 1; k <= 3; k++) {
            if ((k + Math.floor(t * 2)) % 3 === 0) continue;
            for (const x of [l.x - k * 2, l.x + k * 2]) if (out.get(x, l.y + k - 1) === SP) out.put(x, l.y + k - 1, '.');
          }
        }
      }

      // --- el reloj con la hora de verdad --------------------------------------------------
      {
        const d = new Date();
        const m = d.getMinutes() + d.getSeconds() / 60;
        const h = (d.getHours() % 12) + m / 60;
        const hand = (a, len, ch) => {
          const ex = reloj.x + Math.sin(a) * reloj.rx * len;
          const ey = reloj.y - Math.cos(a) * reloj.ry * len;
          out.line(reloj.x, reloj.y, ex, ey, ch);
        };
        hand((h / 12) * Math.PI * 2, 0.55, 0);
        hand((m / 60) * Math.PI * 2, 0.95, 0);
        out.put(reloj.x, reloj.y, 'o');
      }

      // --- palomas -------------------------------------------------------------------------
      for (const pg of palomas) {
        const ph = (t * 0.25 + pg.seed * 0.37) % 1;
        const [px, py] = pg.c.pts[pg.k];
        if (ph < 0.75) {
          // posada, camina un poco y picotea
          const step = Math.round(Math.sin(t * 0.8 + pg.seed) * 2);
          const fr = PALOMA[Math.floor(t * 2 + pg.seed) % 3];
          out.blit(fr, Math.round(px) + step - 1, Math.round(py) - 1);
        } else {
          // vuela a la cercha de al lado
          const u = (ph - 0.75) / 0.25;
          const x = Math.round(px + u * 18 * (pg.seed % 2 ? 1 : -1));
          const y = Math.round(py - 1 - Math.sin(u * Math.PI) * 4);
          if (y > 0) out.blit(PALOMA[3 + (Math.floor(t * 6) % 2)], x, y);
        }
      }

      // --- vapor de las ollas, el cocinero y los comensales --------------------------------
      for (const o of ollas) {
        for (let k = 0; k < 3; k++) {
          const u = (t * 0.7 + k * 0.33 + o.x * 0.1) % 1;
          const y = Math.round(o.y - u * 5);
          const x = Math.round(o.x + Math.sin(t * 2 + k + u * 4) * 1.5);
          if (y !== ty && out.get(x, y) === SP) out.put(x, y, u < 0.5 ? '~' : u < 0.8 ? '(' : '.');
        }
      }
      capas.blit(out, COCINERO[Math.floor(t * 1.5) % 3 === 0 ? 1 : 0], cocX, cocY, Zb - 0.07);
      for (const c of comensales) {
        if (night && c.seed % 2) continue;
        const dy = Math.floor(t * 1.3 + c.seed * 1.7) % 4 === 0 ? 1 : 0;
        capas.blit(out, COMENSAL, c.x, c.y - COMENSAL.h + 1 + dy, Zb - 0.12);
      }

      // --- caseros ---------------------------------------------------------------------------
      // gritan por turnos: uno a la vez en pantallas angostas; en las anchas, dos
      // de lados opuestos (uno de atrás y uno de adelante)
      const slot = Math.floor(t / 3.2);
      const gritos = [];
      caseros.forEach((k, idx) => {
        if (night && k.p.u > 0) return;
        const turn = narrow ? idx === slot % caseros.length : k.p.u > 0 ? idx === slot % 2 : idx === 2 + ((slot + 1) % 2);
        const shouting = k.p.shout.length && turn;
        const fr = k.p.v[shouting ? 1 : 0];
        capas.blit(out, fr, k.x, k.y, k.z);
        if (shouting && !night) {
          const msg = k.p.shout[Math.floor(slot / 2) % k.p.shout.length];
          // la burbuja va hacia afuera, lejos del pasillo
          const bx = Math.max(1, Math.min(cols - msg.length - 3, k.x + (k.p.side < 0 ? -msg.length + 2 : fr.w - 2)));
          const by = k.y - 2;
          if (by > 1 && by !== ty && by !== rows - 2) gritos.push([bx, by, msg, k.x + Math.floor(fr.w / 2), k.p.side]);
        }
        if (night && k.p.u === 0) {
          const b = Math.floor(t * 2) % 2;
          if (k.p.side > 0) out.text(k.x + fr.w, k.y + 2, b ? ' $ ' : '$$ ');
        }
      });
      // las burbujas, encima de todos los caseros
      for (const [bx, by, msg, tx, side] of gritos) {
        out.text(bx, by, ` ${msg} `);
        out.put(tx, by + 1, side < 0 ? '\\' : '/');
      }

      // --- gente que cruza ---------------------------------------------------------------------
      const walkers = night
        ? [{ s: BARRENDERO, z: zc1, period: 18, dir: 1, off: 0, broom: true }]
        : [
            { s: SENORA, z: zc1, period: 14, dir: 1, off: 0, cart: true },
            { s: SENOR, z: zc2, period: 11, dir: -1, off: 4 },
            { s: SENOR, z: zc1, period: 17, dir: -1, off: 8 },
          ];
      for (const w of walkers) {
        const [xa, xb] = reach(w.z);
        const u = ((t + w.off) % w.period) / w.period;
        const span = xb - xa;
        let x = w.dir > 0 ? xa + span * u : xb - span * u;
        if (w.broom) x = vx - aw * 0.8 + Math.sin(t * 0.4) * aw * 0.9;
        const k = Math.floor(t * 3) % 2;
        const fr = w.dir > 0 || w.broom ? w.s[k] : ESPEJO.get(w.s)[k];
        const y = Math.round(floorY(w.z)) - fr.h + 1;
        capas.blit(out, fr, Math.round(x), y, w.z);
        if (w.cart) capas.blit(out, CARRO, Math.round(x) + fr.w, Math.round(floorY(w.z)) - CARRO.h + 1, w.z);
        if (w.broom) {
          // polvo que levanta la escoba
          for (let k = 0; k < 3; k++) {
            const px = Math.round(x) + 10 + k * 2 + (Math.floor(t * 4) % 2);
            const py = Math.round(floorY(w.z)) - 1 - (k % 2);
            if (out.get(px, py) === SP) out.put(px, py, k % 2 ? "'" : '.');
          }
        }
      }

      // --- el gato -----------------------------------------------------------------------------
      {
        const k = (t % 11) < 3 ? 2 : Math.floor(t * 1.4) % 2;
        out.blit(GATO[k], gatoX, gatoY);
        if (night && (t % 20) < 2) out.text(gatoX + 8, gatoY - 1, ' miau ');
      }
    },
  };
}
