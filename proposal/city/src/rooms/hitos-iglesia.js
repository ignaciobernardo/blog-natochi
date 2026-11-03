// LA PARROQUIA por dentro: la nave central en perspectiva desde la puerta,
// con columnas y arcos de medio punto que fugan hacia el altar, la bóveda
// con sus nervios, el rosetón con tracería y vidrios de colores (░ ▒ ▓), los
// ventanales de las naves laterales, bancas, el altar con el estandarte
// (NATOCHI cae en él), el órgano con sus tubos, el candelero de velas, la
// pila de agua bendita y la cuerda de la campana.
// Se anima: velas que titilan, gente que reza (uno se persigna), el órgano
// que suena, la cuerda que baja y "dong", el polvo en los rayos de sol (de
// día) o los halos de los cirios (de noche), el cura en el púlpito y el
// sacristán que cruza el presbiterio.
import { R, sprite, frames, SP, hash2, Capas, arc, curve, fillPoly, flame } from './hitos-kit.js';

// gente rezando, de espaldas, a tres tamaños
const FIELES = {
  5: [
    sprite(R`
   .--.
  (::::)
   ):(
 .-'  '-.
/        \
`),
    // señora con mantilla de encaje
    sprite(R`
   .--.
  /\/\/\
 /\/\/\/\
 '-'  '-'
/        \
`),
    // el abuelo pelado
    sprite(R`
   .--.
  ( '  )
   )  (
 .-'  '-.
/        \
`),
    // cabeza gacha, rezando
    sprite(R`

   .--.
 _(::::)_
/  '  '  \
`),
  ],
  3: [
    sprite(R`
 .-.
(:::)
/' '\
`),
    sprite(R`
 /\
/\/\
/''\
`),
    sprite(R`
 .-.
( ' )
/' '\
`),
  ],
  2: [
    sprite(R`
 (:)
/' '\
`),
    sprite(R`
 /\
/''\
`),
  ],
};
// la mano que se persigna, por cuadros (arriba, abajo, izquierda, derecha)
const PERSIGNA = [[0, -1], [0, 2], [-2, 0], [2, 0]];

// la señora que prende una vela (de perfil, mirando a la derecha)
const DEVOTA = frames(R`
   .-.
  /\/\\
  (  o)
   ) (
 .'   '.
 |  |  |--
 |  |  |
 |  |  |
 |_____|
  |   |
  |   |
 _|   |_
--
   .-.
  /\/\\
  (  o)
   ) (
 .'   '.
 |  |  |__,
 |  |  |  '*
 |  |  |
 |_____|
  |   |
  |   |
 _|   |_
`);

// el sacristán, chico, junto al altar, con el apagavelas
const SACRISTAN = frames(R`
  o /
 /|/
 /|
 / \
--
  o  /
 /|_/
  |
 / \
`);

const ORGANISTA = frames(R`
 .-.
(:::)
/|-|\
--
 .-.
(:::)
\|-|/
`);

const CURA = frames(R`
   .-.
  ( o )
 __) (__
/  |+|  \
--
   .-.
  ( o )
 __) (__/
/  |+|
`);

const PILA = sprite(R`
 .-------.
 \:::::::/
  '-._.-'
    | |
    | |
   _| |_
  (_____)
`);


export function buildIglesia(room, place, target, night, rng) {
  const { cols, rows, vx, vy } = room;
  const narrow = cols < 90;
  const ty = Math.floor(rows / 2);
  const X = (x, z) => room.x(x, z);
  const Y = (y, z) => room.y(y, z);
  const capas = new Capas(room);
  room.name = 'PARROQUIA';
  room.sub = `${place.street || 'SANTA ROSA'} · ${night ? 'adoración nocturna' : 'misa de 12'}`;

  // --- medidas de la nave ---------------------------------------------------------
  const Zb = narrow ? 2.2 : 2.5; // muro del ábside
  const Wn = cols * (narrow ? 0.42 : 0.3); // media nave central
  const Wo = cols * (narrow ? 0.7 : 0.55); // muro de las naves laterales
  const Ys = rows * 0.2; // capiteles
  const Ha = rows * 0.12; // flecha de los arcos laterales
  const Yv = Ys - Ha - rows * 0.04; // arranque de la bóveda
  const Rv = Wn / 2; // radio vertical de la bóveda (una fila mide dos columnas)
  const nb = narrow ? 4 : 6;
  const zs = [];
  for (let k = 0; k < nb; k++) zs.push(1.1 + ((Zb - 0.3 - 1.1) * k) / (nb - 1));
  const zLast = zs[nb - 1];
  const floorY = (z) => room.floorY(z);

  // --- el fondo: muro del ábside con el rosetón, el estandarte y el altar ----------
  const fondo = capas.at(Zb);
  const ax0 = X(vx - Wn, Zb);
  const ax1 = X(vx + Wn, Zb);
  const aSpring = Y(Yv, Zb);
  const aFloor = floorY(Zb);
  // silueta del muro: rectángulo hasta el arranque y medio punto arriba
  {
    const pts = [[ax0, aFloor], [ax0, aSpring]];
    for (let i = 1; i < 32; i++) {
      const a = Math.PI - (Math.PI * i) / 32;
      pts.push([vx + (Wn / Zb) * Math.cos(a), aSpring - (Rv / Zb) * Math.sin(a)]);
    }
    pts.push([ax1, aSpring], [ax1, aFloor]);
    fillPoly(fondo, pts, (c, r) => ((c * 3 + r * 5) % 11 === 0 ? '.' : SP));
    arc(fondo, vx, aSpring, Wn / Zb, Rv / Zb, 0, Math.PI, { round: true });
    fondo.vline(Math.round(ax0), Math.ceil(aSpring), Math.floor(aFloor), '|');
    fondo.vline(Math.round(ax1), Math.ceil(aSpring), Math.floor(aFloor), '|');
  }
  // el rosetón: aro doble, tracería en rayos, vidrios por sector
  const roseCy = Math.max(aSpring - (Rv / Zb) * 0.35, ty - (narrow ? 11 : rows * 0.24));
  const roseRy = Math.max(3, Math.min((Rv / Zb) * 0.62, ty - roseCy - 3.5));
  const roseRx = roseRy * 2.15;
  const roseCx = vx;
  const vidrios = [];
  {
    const f = fondo;
    for (let r = Math.floor(roseCy - roseRy); r <= Math.ceil(roseCy + roseRy); r++) {
      for (let c = Math.floor(roseCx - roseRx); c <= Math.ceil(roseCx + roseRx); c++) {
        const dx = (c + 0.5 - roseCx) / roseRx;
        const dy = (r + 0.5 - roseCy) / roseRy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 0.97) continue;
        const a = (Math.atan2(dy, dx) / (2 * Math.PI) + 1) % 1;
        const sector = Math.floor(a * 12);
        const ring = d < 0.3 ? 0 : d < 0.62 ? 1 : 2;
        let glyph = ring === 0 ? '▒' : ring === 1 ? ['░', '▒'][sector % 2] : ['░', '░', '▒', '▓', '▒', '░'][(sector * 5 + 1) % 6];
        // de noche el rosetón está casi apagado: sólo la luna en un sector
        if (night) glyph = sector === 2 && ring === 2 ? '▒' : (c + r) % 2 ? '░' : '.';
        f.put(c, r, glyph);
        vidrios.push({ c, r, glyph, ring, sector });
      }
    }
    arc(f, roseCx, roseCy, roseRx, roseRy, 0, Math.PI * 2, { round: true });
    arc(f, roseCx, roseCy, roseRx + 2.2, roseRy + 1.1, 0, Math.PI * 2, { round: true });
    arc(f, roseCx, roseCy, roseRx * 0.62, roseRy * 0.62, 0, Math.PI * 2, { round: true });
    arc(f, roseCx, roseCy, roseRx * 0.3, roseRy * 0.3, 0, Math.PI * 2, { round: true });
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      f.line(roseCx + Math.cos(a) * roseRx * 0.3, roseCy - Math.sin(a) * roseRy * 0.3, roseCx + Math.cos(a) * roseRx * 0.97, roseCy - Math.sin(a) * roseRy * 0.97);
    }
    f.put(roseCx, roseCy, '+');
  }
  // cornisa bajo el rosetón y el estandarte colgado en la fila del título
  const cornice = Math.round(roseCy + roseRy + 2);
  fondo.hline(Math.ceil(ax0) + 1, Math.floor(ax1) - 1, cornice, '_');
  for (let c = Math.ceil(ax0) + 2; c < ax1 - 1; c += 3) fondo.put(c, cornice + 1, "'");
  const banW = Math.min(Math.round((ax1 - ax0) * 0.62), 25);
  const bx0 = Math.round(vx - banW / 2);
  const bx1 = bx0 + banW;
  if (ty - 1 > cornice + 1) {
    for (let r = cornice + 2; r < ty - 1; r++) {
      fondo.put(bx0 + 2, r, '|');
      fondo.put(bx1 - 2, r, '|');
    }
  }
  fondo.text(bx0, ty - 1, ' ' + '_'.repeat(banW - 1) + ' ');
  fondo.text(bx0 - 1, ty, '<|' + ' '.repeat(banW - 3) + '|>');
  let fr = ' ';
  for (let i = 0; i < banW - 1; i++) fr += i % 2 ? '/' : '\\';
  fondo.text(bx0, ty + 1, fr + ' ');
  for (let c = bx0 + 2; c < bx1 - 1; c++) if (c < Math.floor(cols / 2 - 3.5) - 1 || c > Math.floor(cols / 2 - 3.5) + 7) fondo.put(c, ty, (c - bx0) % 3 === 0 ? '+' : ' ');

  // el presbiterio: gradas, el altar con su mantel, el sagrario y las velas
  const pres = capas.at(Zb - 0.08);
  const stepsN = narrow ? 2 : rows > 60 ? 4 : 3;
  const gx0 = X(vx - Wn * 0.8, Zb - 0.08);
  const gx1 = X(vx + Wn * 0.8, Zb - 0.08);
  const gBot = Math.round(floorY(Zb - 0.08));
  for (let k = 0; k < stepsN; k++) {
    const y = gBot - k;
    const inset = k * 2;
    for (let c = Math.round(gx0) + inset; c <= Math.round(gx1) - inset; c++) pres.put(c, y, '_');
    pres.put(Math.round(gx0) + inset - 1, y, '|');
    pres.put(Math.round(gx1) - inset + 1, y, '|');
  }
  const altW = Math.min(Math.round((ax1 - ax0) * 0.5), 30);
  const altTop = Math.max(ty + 4, gBot - stepsN - (narrow ? 4 : rows > 60 ? 7 : 5));
  const altBot = gBot - stepsN;
  const alx0 = Math.round(vx - altW / 2);
  const alx1 = alx0 + altW;
  for (let r = altTop; r <= altBot; r++) for (let c = alx0; c <= alx1; c++) pres.put(c, r, SP);
  pres.hline(alx0 - 1, alx1 + 1, altTop - 1, '_');
  pres.vline(alx0, altTop, altBot, '|');
  pres.vline(alx1, altTop, altBot, '|');
  // el mantel con su encaje y la cruz bordada
  for (let c = alx0 + 1; c < alx1; c++) pres.put(c, altTop, (c - alx0) % 2 ? 'v' : ' ');
  if (altBot - altTop >= 3) {
    const mid = Math.round(vx);
    pres.put(mid, altTop + 1, '|');
    pres.text(mid - 1, altTop + 2, '-+-');
    if (altBot - altTop >= 4) pres.put(mid, altTop + 3, '|');
    for (const s of [-1, 1]) {
      const px = mid + s * Math.round(altW * 0.3);
      pres.text(px - 2, altTop + 1, '.---.');
      pres.text(px - 2, altTop + 2, '|:::|');
      if (altBot - altTop >= 4) pres.text(px - 2, altTop + 3, "'---'");
    }
  }
  // sobre el altar: el sagrario y las flores
  pres.text(Math.round(vx) - 2, altTop - 2, '.-+-.');
  pres.text(Math.round(vx) - 2, altTop - 1, '|[_]|');
  pres.text(alx0 + 2, altTop - 2, '\\|/');
  pres.text(alx0 + 2, altTop - 1, '(_)');
  pres.text(alx1 - 4, altTop - 2, '\\|/');
  pres.text(alx1 - 4, altTop - 1, '(_)');
  // velas sobre el altar
  const velas = [];
  for (const s of [-1, 1]) {
    for (let k = 0; k < (narrow ? 1 : 2); k++) {
      const x = Math.round(vx + s * (altW * 0.2 + k * 3 + 2));
      pres.put(x, altTop - 1, '|');
      velas.push({ x, y: altTop - 2, s: velas.length });
    }
  }
  // --- la bóveda y los muros de la nave ------------------------------------------------
  const boveda = capas.at(Zb + 0.5);
  {
    const b = boveda;
    // nervios longitudinales: fugan al punto de fuga
    for (const a of [0.12, 0.25, 0.375, 0.5, 0.625, 0.75, 0.88].map((u) => u * Math.PI)) {
      const pts = [];
      for (let i = 0; i <= 20; i++) {
        const z = 1 + ((Zb - 1) * i) / 20;
        pts.push([X(vx + Wn * Math.cos(a), z), Y(Yv - Rv * Math.sin(a), z)]);
      }
      curve(b, pts, { ch: a === 0.5 * Math.PI ? 0 : '.' });
    }
    // piedra de la bóveda: puntos que se aprietan hacia el fondo
    for (let r = 0; r < ty; r++) for (let c = 0; c < cols; c++) if (hash2(c, r * 7) < 0.035) b.put(c, r, '.');
  }
  // arcos fajones: uno por tramo, del más lejano al más cercano
  zs.forEach((z, k) => {
    const L = capas.at(z + 0.004);
    const cy = Y(Yv, z);
    const rx = Wn / z;
    const ry = Rv / z;
    arc(L, vx, cy, rx, ry, 0, Math.PI);
    if (k >= nb - 2) arc(L, vx, cy + 1, rx - 2.2 / z, ry - 1 / z, 0.05, Math.PI - 0.05);
  });
  // muros sobre los arcos laterales (enjutas) y los arcos de cada tramo
  for (const side of [-1, 1]) {
    const Xs = vx + side * Wn;
    for (let k = 0; k + 1 < nb; k++) {
      const za = zs[k];
      const zb = zs[k + 1];
      const L = capas.at(za + 0.002);
      const archPts = [];
      for (let i = 0; i <= 28; i++) {
        const th = (Math.PI * i) / 28;
        const z = za + ((zb - za) * (1 - Math.cos(th))) / 2;
        archPts.push([X(Xs, z), Y(Ys - Ha * Math.sin(th), z)]);
      }
      // enjuta: entre el arco y el arranque de la bóveda
      const poly = [[X(Xs, za), Y(Yv, za)], ...archPts, [X(Xs, zb), Y(Yv, zb)]];
      fillPoly(L, poly, (c, r) => ((c * 7 + r * 3) % 13 === 0 ? '.' : SP));
      curve(L, archPts);
      // dovelas: un segundo arco por fuera
      curve(
        L,
        archPts.map((p, i) => {
          const th = (Math.PI * i) / 28;
          const z = za + ((zb - za) * (1 - Math.cos(th))) / 2;
          return [X(Xs, z), Y(Ys - Ha * Math.sin(th) - 1.2, z)];
        }),
      );
      // línea de la imposta del triforio
      L.line(X(Xs, za), Y(Yv + 0.5, za), X(Xs, zb), Y(Yv + 0.5, zb));
    }
  }
  // columnas con capitel y basa
  for (const side of [-1, 1]) {
    for (const z of zs) {
      const L = capas.at(z);
      const cw = cols * 0.028;
      const xc = X(vx + side * Wn, z);
      const half = Math.max(1, cw / z / 2);
      const x0 = Math.round(xc - half);
      const x1 = Math.round(xc + half);
      const yt = Math.round(Y(Ys, z));
      const yb = Math.round(floorY(z));
      const top = Math.max(0, Math.round(Y(Yv, z)));
      // fuste que sube hasta la bóveda
      for (let r = top; r < yb; r++) {
        for (let c = x0; c <= x1; c++) L.put(c, r, SP);
        L.put(x0, r, '|');
        L.put(x1, r, '|');
        if (x1 - x0 >= 4 && r > yt) L.put(Math.round(xc), r, r % 2 ? ':' : ' ');
      }
      // capitel
      L.hline(x0 - 1, x1 + 1, yt - 1, '_');
      L.put(x0 - 1, yt, '\\');
      L.put(x1 + 1, yt, '/');
      L.hline(x0, x1, yt, '_');
      if (x1 - x0 >= 4) L.text(Math.round(xc) - 1, yt - 1, '(o)');
      // basa
      L.hline(x0 - 1, x1 + 1, yb - 2, '_');
      L.put(x0 - 1, yb - 1, '|');
      L.put(x1 + 1, yb - 1, '|');
      L.hline(x0, x1, yb - 1, '_');
    }
  }

  // --- naves laterales: ventanales con vidrios y el piso -------------------------------
  const lateral = capas.at(Zb + 0.3);
  const ventanas = [];
  for (const side of [-1, 1]) {
    const Xo = vx + side * Wo;
    // arista del muro exterior con el piso y el cielo de la nave lateral
    lateral.line(X(Xo, 1), floorY(1), X(Xo, Zb), floorY(Zb));
    const Ya = Ys - Ha * 0.6;
    lateral.line(X(Xo, 1), Y(Ya, 1), X(Xo, Zb), Y(Ya, Zb));
    for (let k = 0; k < nb; k++) {
      const za = (k === 0 ? 1.0 : zs[k - 1]) + 0.06;
      const zb = zs[k] - 0.06;
      if (zb - za < 0.05) continue;
      const xa = X(Xo, za);
      const xb = X(Xo, zb);
      if (Math.max(xa, xb) < 0 || Math.min(xa, xb) > cols) continue;
      const Yt = rows * 0.3;
      const Yb = rows * 0.64;
      const pts = [];
      const n = 16;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const z = za + (zb - za) * u;
        pts.push([X(Xo, z), Y(Yt - Math.sin(u * Math.PI) * rows * 0.06, z)]);
      }
      pts.push([xb, Y(Yb, zb)], [xa, Y(Yb, za)]);
      fillPoly(lateral, pts, (c, r) => {
        const z = (Xo - vx) / (c + 0.5 - vx);
        const u = (z - za) / (zb - za);
        if (Math.abs(u - 0.5) < 0.08) return '|';
        const q = Math.floor(r / 2) + Math.floor(u * 6);
        if (night) return (q + k) % 3 ? '░' : (r + c) % 2 ? '.' : ' ';
        return ['░', '▒', '▓', '▒'][(q + k) & 3];
      });
      curve(lateral, pts.slice(0, n + 1), { round: true });
      lateral.vline(Math.round(xa), Math.ceil(Y(Yt, za)), Math.floor(Y(Yb, za)), '|');
      lateral.vline(Math.round(xb), Math.ceil(Y(Yt, zb)), Math.floor(Y(Yb, zb)), '|');
      lateral.line(xa, Y(Yb, za), xb, Y(Yb, zb));
      ventanas.push({ side, x: (xa + xb) / 2, y: Y((Yt + Yb) / 2, (za + zb) / 2), z: (za + zb) / 2 });
    }
  }

  // --- el piso: baldosas y la alfombra del pasillo ---------------------------------------
  const piso = capas.at(Zb + 0.2);
  {
    const p = piso;
    const step = cols * 0.06;
    for (let Xk = vx - Wo; Xk <= vx + Wo; Xk += step) p.line(X(Xk, 1), rows, X(Xk, Zb), aFloor);
    for (let i = 1; i < 6; i++) {
      const z = 1 / (1 - (i / 6) * (1 - 1 / Zb));
      p.line(X(vx - Wo, z), floorY(z), X(vx + Wo, z), floorY(z));
    }
    const aw = cols * 0.05;
    for (let r = Math.ceil(aFloor); r < rows; r++) {
      const z = (rows - vy) / (r + 0.5 - vy);
      const a = X(vx - aw, z);
      const b = X(vx + aw, z);
      for (let c = Math.ceil(a); c < b; c++) p.put(c, r, (c + r) % 4 === 0 ? ':' : SP);
      p.put(Math.floor(a), r, '/');
      p.put(Math.ceil(b) - 1, r, '\\');
    }
  }

  // --- bancas y fieles ------------------------------------------------------------------
  const aisle = cols * 0.06;
  const zP0 = 1.14;
  const zP1 = zLast - 0.3;
  const nP = narrow ? 5 : 6;
  const bancas = [];
  const fieles = [];
  for (let i = nP - 1; i >= 0; i--) {
    const z = zP0 + ((zP1 - zP0) * i) / (nP - 1);
    const L = capas.at(z);
    const yt = Math.round(Y(rows * 0.84, z));
    const yb = Math.round(Y(rows * 0.95, z));
    for (const side of [-1, 1]) {
      const xa = Math.round(X(vx + side * aisle, z));
      const xb = Math.round(X(vx + side * (Wn - cols * 0.03), z));
      const x0 = Math.min(xa, xb);
      const x1 = Math.max(xa, xb);
      const bh = Math.max(1, Math.round((yb - yt) * 0.55));
      for (let r = yt; r < yt + bh; r++) for (let c = x0; c <= x1; c++) L.put(c, r, SP);
      L.hline(x0, x1, yt - 1, '_');
      for (let r = yt; r < yt + bh; r++) {
        L.put(x0, r, '|');
        L.put(x1, r, '|');
      }
      if (bh >= 3) L.hline(x0 + 1, x1 - 1, yt + 1, '-');
      L.hline(x0 + 1, x1 - 1, yt + bh - 1, '_');
      // patas y el canto del asiento
      for (let r = yt + bh; r <= yb; r++) for (const c of [x0 + 1, x1 - 1, Math.round((x0 + x1) / 2)]) L.put(c, r, '|');
      if (yb > yt + bh) L.hline(x0 + 1, x1 - 1, yt + bh, '-');
      // la cabecera tallada del lado del pasillo
      const xe = side < 0 ? x1 : x0;
      L.put(xe, yt - 1, '.');
      L.put(xe + (side < 0 ? -1 : 1), yt - 1, '_');
      bancas.push({ z, yt, x0, x1, side });
    }
  }
  // de noche, un cirio en la cabecera de cada banca, a lo largo del pasillo
  if (night) {
    for (const b of bancas) {
      const L = capas.at(b.z - 0.001);
      const xe = b.side < 0 ? b.x1 : b.x0;
      const h = b.z < 1.4 ? 3 : b.z < 1.8 ? 2 : 1;
      for (let r = b.yt - 2 - h; r < b.yt - 2; r++) L.put(xe, r, '|');
      velas.push({ x: xe, y: b.yt - 3 - h, s: velas.length + 40, big: b.z < 1.4 });
    }
  }
  // quién reza dónde (más de día, la misa; de noche, los de la adoración)
  const n = night ? 5 : 9;
  for (let k = 0; k < n * 3 && fieles.length < n; k++) {
    const b = bancas[Math.floor(rng.next() * bancas.length)];
    const size = b.z < 1.35 ? 5 : b.z < 1.75 ? 3 : 2;
    const vs = FIELES[size];
    const s = vs[Math.floor(rng.next() * vs.length)];
    const x = Math.round(b.x0 + 2 + rng.next() * Math.max(1, b.x1 - b.x0 - s.w - 3));
    if (fieles.some((f) => Math.abs(f.z - b.z) < 0.01 && Math.abs(f.x - x) < s.w + 2)) continue;
    fieles.push({ z: b.z + 0.003, x, y: b.yt - s.h + (size === 5 ? 2 : 1), s, size, seed: k * 7 + 3, role: null });
  }
  if (fieles.length) fieles[0].role = 'persigna';
  if (fieles.length > 1) fieles[1].role = 'asiente';
  if (fieles.length > 2) fieles[2].role = 'asiente';
  for (const f of fieles) if (!f.role) capas.list.find((l) => Math.abs(l.z - (f.z - 0.003)) < 1e-9).blit(f.s, f.x, f.y);
  const fielesMov = fieles.filter((f) => f.role).sort((a, b) => b.z - a.z);

  // --- el órgano a la izquierda del presbiterio y el púlpito a la derecha -------------
  const zO = zLast - 0.15;
  const organo = { pipes: [], x0: 0, y: 0, z: zO };
  {
    const L = capas.at(zO);
    const x0 = Math.round(X(vx - Wn + cols * 0.012, zO));
    const x1 = Math.round(X(vx - Wn * 0.56, zO));
    const yb = Math.round(floorY(zO));
    const caseTop = Math.round(Y(rows * 0.7, zO));
    const pTop = Math.round(Y(rows * 0.2, zO));
    if (x1 - x0 >= 6) {
      for (let r = pTop - 1; r < yb; r++) for (let c = x0; c <= x1; c++) L.put(c, r, r < caseTop ? 0 : SP);
      // la caja con el teclado y el banco
      L.hline(x0, x1, caseTop - 1, '_');
      L.vline(x0, caseTop, yb - 1, '|');
      L.vline(x1, caseTop, yb - 1, '|');
      L.hline(x0 + 1, x1 - 1, yb - 1, '_');
      L.hline(x0 + 1, x1 - 1, caseTop + 1, '=');
      for (let c = x0 + 2; c < x1 - 1; c += 3) for (let r = caseTop + 2; r < yb - 1; r++) L.put(c, r, ':');
      // tubos: más altos al medio, con su boca
      const np = Math.floor((x1 - x0 - 1) / 2);
      for (let i = 0; i < np; i++) {
        const c = x0 + 1 + i * 2;
        const u = (i + 0.5) / np;
        const h = Math.round((caseTop - pTop) * (0.5 + 0.5 * Math.sin(u * Math.PI)));
        const top = caseTop - 1 - h;
        L.put(c, top, '.');
        L.put(c + 1, top, '.');
        for (let r = top + 1; r < caseTop - 1; r++) {
          L.put(c, r, '|');
          L.put(c + 1, r, '|');
        }
        if (top + 2 < caseTop - 2) L.text(c, top + 2, '()');
        organo.pipes.push({ x: c, top });
      }
      // coronación
      L.text(Math.round((x0 + x1) / 2) - 1, Math.max(0, pTop - 2), '\\|/');
      organo.x0 = Math.round((x0 + x1) / 2) - 2;
      organo.y = caseTop + 1;
      organo.ok = true;
    }
  }
  const pulpito = { ok: false };
  {
    const L = capas.at(zO);
    const x0 = Math.round(X(vx + Wn * 0.6, zO));
    const x1 = Math.round(X(vx + Wn - cols * 0.012, zO));
    const yb = Math.round(floorY(zO));
    const top = Math.round(Y(rows * 0.56, zO));
    if (x1 - x0 >= 6) {
      // la copa del púlpito sobre su pie y la escalera
      for (let r = top; r <= top + 3; r++) for (let c = x0; c <= x1; c++) L.put(c, r, SP);
      L.hline(x0 - 1, x1 + 1, top - 1, '_');
      L.vline(x0, top, top + 3, '|');
      L.vline(x1, top, top + 3, '|');
      for (let c = x0 + 2; c < x1 - 1; c += 2) L.put(c, top + 1, '+');
      L.text(x0, top + 4, '\\' + '_'.repeat(x1 - x0 - 1) + '/');
      const mx = Math.round((x0 + x1) / 2);
      for (let r = top + 5; r < yb; r++) L.text(mx - 1, r, '| |');
      L.text(mx - 2, yb - 1, '[___]');
      for (let k = 0; k < Math.min(5, yb - top - 4); k++) L.put(x1 + 1 + k, top + 4 + k, '\\');
      pulpito.x = mx - 3;
      pulpito.y = top - 4;
      pulpito.ok = true;
    }
  }

  // --- el candelero de velas (nave derecha) y la devota ----------------------------------
  const cand = { flames: [] };
  {
    const z = narrow ? 1.25 : 1.3;
    const L = capas.at(z);
    const cx = X(vx + Wn + (Wo - Wn) * 0.45, z);
    const yb = Math.round(floorY(z));
    const w = narrow ? 8 : 13;
    const x0 = Math.round(cx - w / 2);
    if (x0 + w < cols) {
      const tiers = narrow ? 2 : 3;
      for (let t = 0; t < tiers; t++) {
        const y = yb - 3 - t * 2;
        const a = x0 + t * 2;
        const b = x0 + w - t * 2;
        L.hline(a, b, y, '_');
        L.put(a - 1, y, '/');
        L.put(b + 1, y, '\\');
        for (let c = a + 1; c < b; c += 2) {
          L.put(c, y - 1, 'i');
          cand.flames.push({ x: c, y: y - 2, s: cand.flames.length, lit: hash2(c, y) < (night ? 0.85 : 0.6) });
        }
      }
      L.hline(x0, x0 + w, yb - 1, '_');
      L.vline(x0 + 1, yb - 2, yb - 1, '|');
      L.vline(x0 + w - 1, yb - 2, yb - 1, '|');
      L.text(Math.round(cx) - 1, yb - 2, '[$]');
      cand.dx = x0 - DEVOTA[0].w + 1;
      cand.dy = yb - DEVOTA[0].h + 1;
      cand.z = z + 0.01;
      cand.ok = cand.dx > 0;
    }
  }

  // --- la pila de agua bendita y la cuerda de la campana (cerca de la puerta) ------------
  if (!narrow) capas.at(1.02).blit(PILA, Math.round(cols - PILA.w - cols * 0.03), rows - PILA.h - 1);
  const rope = { x: Math.max(2, Math.round(cols * 0.035)), y1: Math.round(rows * 0.72) };

  capas.bake();

  // rayos de sol: desde los ventanales de la derecha bajan hacia la izquierda
  const rayos = night
    ? []
    : ventanas
        .filter((v) => v.side > 0 && v.x < cols - 1 && v.z > 1.2)
        .slice(0, 3)
        .map((v, i) => ({ x: v.x, y: v.y, len: rows * (0.9 + i * 0.1), w: Math.max(2, 5 - i) }));
  const polvo = [];
  for (let i = 0; i < 40; i++) polvo.push({ u: hash2(i, 3), v: hash2(i, 5) - 0.5, s: 0.01 + hash2(i, 7) * 0.02, b: i % Math.max(1, rayos.length) });

  return {
    anim(out, t) {
      // --- luz -------------------------------------------------------------------------
      // rayos de sol con polvo (sólo sobre lo vacío)
      for (const ry of rayos) {
        const dx = -2.1;
        const dy = 1;
        const nrm = Math.hypot(dx, dy * 2);
        for (let k = 0; k < ry.len; k++) {
          const px = ry.x + (dx * k) / nrm;
          const py = ry.y + (dy * k) / nrm;
          if (py > rows - 3) break;
          for (let w = -ry.w; w <= ry.w; w++) {
            const x = Math.round(px + w * 0.5);
            const y = Math.round(py - w * 0.5);
            if (hash2(x * 3 + Math.floor(t * 1.5), y * 5) < 0.11 && out.get(x, y) === SP) out.put(x, y, '.');
          }
          if (k % 2 === 0) {
            for (const e of [-1, 1]) {
              const ex = Math.round(px + e * ry.w * 0.5);
              const ey = Math.round(py - e * ry.w * 0.5);
              if (out.get(ex, ey) === SP) out.put(ex, ey, e < 0 ? "'" : '.');
            }
          }
        }
      }
      for (const p of polvo) {
        const ry = rayos[p.b];
        if (!ry) break;
        const k = ((p.u + t * p.s) % 1) * ry.len;
        const nrm = Math.hypot(2.1, 2);
        const x = Math.round(ry.x - (2.1 * k) / nrm + p.v * ry.w + Math.sin(t * 0.5 + p.u * 9) * 0.6);
        const y = Math.round(ry.y + k / nrm - p.v * ry.w * 0.5);
        if (out.get(x, y) === SP) out.put(x, y, (t + p.u * 5) % 3 < 0.4 ? '°' : '.');
      }
      // los vidrios del rosetón brillan distinto según la hora
      if (!night) {
        const k = Math.floor(t * 0.8);
        for (let i = 0; i < 6; i++) {
          const v = vidrios[Math.floor(hash2(k, i) * vidrios.length)];
          if (v && v.ring) out.put(v.c, v.r, '░');
        }
      }

      // --- velas -------------------------------------------------------------------------
      for (const v of velas) {
        out.put(v.x, v.y, flame(t, v.s + 1));
        if (night) {
          // halo de luz alrededor, que respira con la llama
          const big = v.big ? 1.6 : 1;
          const pulse = 1 + 0.15 * Math.sin(t * 5 + v.s);
          for (let k = 0; k < 14; k++) {
            const a = (k / 14) * Math.PI * 2;
            const x = Math.round(v.x + Math.cos(a) * 4 * big * pulse);
            const y = Math.round(v.y - Math.sin(a) * 2 * big * pulse);
            if (out.get(x, y) === SP && (k + Math.floor(t * 4)) % 3) out.put(x, y, k % 2 ? '.' : "'");
          }
          if (out.get(v.x, v.y - 1) === SP) out.put(v.x, v.y - 1, '.');
        }
      }
      for (const f of cand.flames) {
        if (!f.lit) continue;
        out.put(f.x, f.y, flame(t, f.s + 20));
        if (night && out.get(f.x, f.y - 1) === SP && Math.floor(t * 4 + f.s) % 3 === 0) out.put(f.x, f.y - 1, '.');
      }

      // --- la devota prende una vela ---------------------------------------------------
      if (cand.ok) {
        const ph = t % 16;
        const lighting = ph > 6 && ph < 10;
        capas.blit(out, DEVOTA[lighting ? 1 : 0], cand.dx, cand.dy, cand.z);
        if (ph > 9 && cand.flames.length) {
          const f = cand.flames[cand.flames.length - 1];
          out.put(f.x, f.y, flame(t, 99));
        }
      }

      // --- los fieles ---------------------------------------------------------------------
      for (const f of fielesMov) {
        let dy = 0;
        if (f.role === 'asiente') dy = Math.floor(t * 0.7 + f.seed) % 4 === 0 ? 1 : 0;
        capas.blit(out, f.s, f.x, f.y + dy, f.z);
        if (f.role === 'persigna') {
          const ph = t % 12;
          if (ph < 4) {
            const [hx, hy] = PERSIGNA[Math.min(3, Math.floor(ph))];
            const cx = f.x + Math.floor(f.s.w / 2) + hx;
            const cy = f.y + 1 + hy;
            out.put(cx, cy, '+');
          }
        }
      }

      // --- el órgano ----------------------------------------------------------------------
      if (pulpito.ok && !night) {
        const ph2 = t % 20;
        const fr = CURA[ph2 < 9 ? Math.floor(t * 1.5) % 2 : 0];
        out.blit(fr, pulpito.x, pulpito.y);
        if (ph2 < 9) {
          const lines = ['...y el tren', 'llegó a tiempo.', 'Amén.'];
          const l = lines[Math.min(2, Math.floor(ph2 / 3))];
          const bx = Math.min(cols - l.length - 2, pulpito.x + 6);
          const by = pulpito.y - 2;
          if (by > 1 && by !== ty) out.text(bx, by, ` ${l} `);
        }
      }
      if (organo.ok) {
        const playing = t % 24 < 15;
        const fr = ORGANISTA[playing ? Math.floor(t * 4) % 2 : 0];
        out.blit(fr, organo.x0, organo.y - 1);
        if (playing) {
          for (let i = 0; i < 4; i++) {
            const p = organo.pipes[Math.floor(hash2(i, Math.floor(t * 0.6 + i * 0.25)) * organo.pipes.length)];
            if (!p) continue;
            const u = (t * 0.6 + i * 0.25) % 1;
            const x = Math.round(p.x + u * 6 + Math.sin(t * 2 + i) * 1.2);
            const y = Math.round(p.top - 1 - u * 6);
            if (y >= 0 && out.get(x, y) === SP) out.put(x, y, i % 2 ? '♪' : '♫');
          }
        }
      }

      // --- la cuerda de la campana -----------------------------------------------------------
      const ph = t % 13;
      const ringing = ph < 3.2;
      const pull = ringing ? Math.round(Math.abs(Math.sin(ph * Math.PI * 0.95)) * 3) : 0;
      const sway = ringing ? 0 : Math.round(Math.sin(t * 0.7) * 0.6);
      for (let r = 0; r < rope.y1 + pull; r++) out.put(rope.x + (r > rope.y1 - 8 ? sway : 0), r, r % 2 ? ')' : '(');
      const gy = rope.y1 + pull;
      out.text(rope.x - 1 + sway, gy, '{|}');
      out.text(rope.x - 1 + sway, gy + 1, '{|}');
      out.put(rope.x + sway, gy + 2, '|');
      out.put(rope.x + sway, gy + 3, "'");
      if (ringing) {
        const k = Math.floor(ph / 1.05);
        const words = ['¡dong!', 'dong', 'dong...'];
        for (let i = 0; i <= Math.min(2, k); i++) {
          const y = 3 + i * 3;
          if (y === 1 || y === ty) continue;
          out.text(rope.x + 2 + i * 2, y, ` ${words[i]} `);
          out.text(rope.x + 2 + i * 2 + words[i].length + 2, y, ')))'.slice(0, 1 + ((Math.floor(t * 6) + i) % 3)));
        }
      }

      // --- el sacristán cruza el presbiterio ----------------------------------------------
      {
        const cyc = t % 30;
        if (cyc < 12) {
          const u = cyc / 12;
          const x = Math.round(alx0 - 6 + u * (alx1 - alx0 + 12));
          const fr = SACRISTAN[Math.floor(t * 3) % 2];
          capas.blit(out, fr, x, altTop - fr.h + 2, Zb - 0.06);
        }
      }
    },
  };
}
