// CINE REX por dentro: la sala vista desde atrás, con la pantalla al fondo
// pasando "NATOCHI en EL VIAJE" (hitos-cine-film.js), el telón recogido a los
// lados, el haz del proyector con polvo, palcos, filas de butacas con el
// público de espaldas, las salidas iluminadas y un acomodador con linterna.
// El público reacciona a la película: se ríe en la persecución, alguien hace
// callar, una pareja se acerca cuando sale el corazón y aplauden en el FIN.
// De noche la sala está llena; de día es la matiné, con menos gente y niños.
import { R, sprite, frames, SP, hash2, Capas, Clip, arc, fillPoly } from './hitos-kit.js';
import { drawFilm } from './hitos-cine-film.js';

// --- cabezas de espalda, de la más grande a la más chica ---------------------
// Cada clase tiene variantes: pelo, pelado, moño, sombrero, crespo.
const CABEZAS = [
  {
    h: 6,
    v: [
      R`
    .----.
   (::::::)
   (::::::)
    ')  (' 
 .--'    '--.
/            \
`,
      R`
    .----.
   (  '   )
   (      )
    ')  (' 
 .--'    '--.
/            \
`,
      R`
     (::)
   .-'::'-.
   (::::::)
    ')::('
 .--'::::'--.
/            \
`,
      R`
    .----.
 ___|____|___
   (::::::)
    ')  (' 
 .--'    '--.
/            \
`,
      R`
   .-.-.-.-.
  (::::::::)
   (::::::)
    ')  (' 
 .--'    '--.
/            \
`,
    ],
  },
  {
    h: 4,
    v: [
      R`
  .--.
 (::::)
  )  (
/'    '\
`,
      R`
  .--.
 ( '  )
  )  (
/'    '\
`,
      R`
  _()_
 (::::)
  ):(
/'    '\
`,
      R`
 _.--._
'(::::)'
  )  (
/'    '\
`,
    ],
  },
  {
    h: 3,
    v: [
      R`
 .-.
(:::)
/' '\
`,
      R`
 .-.
( ' )
/' '\
`,
      R`
 _o_
(:::)
/' '\
`,
    ],
  },
  {
    h: 2,
    v: [
      R`
 (:)
/' '\
`,
      R`
 _o_
/' '\
`,
    ],
  },
  { h: 1, v: ['(:)', '(_)'] },
].map((k) => ({ h: k.h, v: k.v.map((s) => sprite(s)) }));
for (const k of CABEZAS) k.w = Math.max(...k.v.map((s) => s.w));

// de perfil, haciendo callar (mira hacia el que se ríe)
const CALLA = {
  6: sprite(R`
    .----.
   (:::::  ª.
   (::::   o )
    '):   _/
 .--'    '--.
/            \
`),
  4: sprite(R`
  .--.
 (:: ª\
  ): o)
/'    '\
`),
  3: sprite(R`
 .-.
(::o)
/' '\
`),
};

// la caja de cabritas que alguien tiene en alto
const CABRITAS = frames(R`
 °.°
\:::/
 \_/
--
 .°.
\:::/
 \_/
`);

// el acomodador, con gorra y linterna
const ACOMODADOR = frames(R`
     .---.
   _|_____|_
     (   )
      \ /
 .---'---'---.
/  |   o   |  \
|  |   o   |  |
|  |   o   |  |
|  |   o   |  |=[)
|  |_______|
   |   |   |
--
     .---.
   _|_____|_
     (   )
      \ /
 .---'---'---.
/  |   o   |  \___
|  |   o   |   =[)
|  |   o   |
|  |   o   |
|  |_______|
   |   |   |
`);

// el que llega tarde, de espaldas, pasando por la fila
const TARDE = frames(R`
   .--.
  /::::\
  \::::/
 .-'  '-.
/|      |\
--
   .--.
  /::::\
  \::::/
 .-'  '-.
 |      |\
`);

const SALIDA_I = sprite(R`
 _________
|< SALIDA |
 ¯¯¯¯¯¯¯¯¯
`);
const SALIDA_D = sprite(R`
 _________
| SALIDA >|
 ¯¯¯¯¯¯¯¯¯
`);

const APLIQUE = sprite(R`
\ | /
 \|/
(___)
`);

// gente en el palco
const PALCO_A = sprite(R`
 .-.
(:::)oo
/' '\|
`);
const PALCO_B = sprite(R`
  _
 (::)
/'  '\
`);

export function buildCine(room, place, target, night, rng) {
  const { cols, rows, vx } = room;
  const narrow = cols < 90;
  const ty = Math.floor(rows / 2);
  const Zb = narrow ? 1.7 : 1.85;
  const XL = narrow ? -cols * 0.2 : 0;
  const XR = cols - XL;
  const Yc = -rows * 0.32;
  const X = (x, z) => room.x(x, z);
  const Y = (y, z) => room.y(y, z);
  const capas = new Capas(room);
  const g0 = room.g;

  room.name = 'CINE REX';
  room.sub = `${place.street || 'SANTA ROSA'} · ${night ? 'EL VIAJE · función de las 22:45' : 'matiné · EL VIAJE'}`;

  // --- la pared del fondo y la pantalla -------------------------------------------
  const bx0 = X(XL, Zb);
  const bx1 = X(XR, Zb);
  const byT = Y(Yc, Zb);
  const backW = bx1 - bx0;
  const W = Math.round(Math.min(backW - (narrow ? 8 : 22), 112));
  const H = Math.round(W / (narrow ? 2.5 : 3.1));
  const sx0 = Math.round(vx - W / 2);
  const sx1 = sx0 + W - 1;
  const sy1 = ty + Math.max(3, Math.round(H * 0.2));
  const sy0 = sy1 - H + 1;
  const stage = sy1 + 2; // fila del borde del escenario
  const fondo = capas.at(Zb);
  for (let r = Math.max(0, Math.ceil(byT)); r <= stage + 2; r++) for (let c = Math.ceil(bx0); c < bx1; c++) fondo.put(c, r, SP);
  fondo.line(bx0, byT, bx1, byT);
  for (let r = sy0; r <= sy1; r++) for (let c = sx0; c <= sx1; c++) fondo.put(c, r, SP);
  fondo.hline(sx0 - 1, sx1 + 1, sy0 - 1, '_');
  fondo.vline(sx0 - 1, sy0, sy1 + 1, '|');
  fondo.vline(sx1 + 1, sy0, sy1 + 1, '|');
  fondo.hline(sx0, sx1, sy1 + 1, '_');

  // el escenario: borde con candilejas y frente con paneles
  const esc = capas.at(Zb - 0.05);
  {
    const x0 = Math.floor(bx0) - (narrow ? 1 : 3);
    const x1 = Math.ceil(bx1) + (narrow ? 1 : 3);
    for (let r = stage; r <= stage + 2; r++) for (let c = x0; c <= x1; c++) esc.put(c, r, SP);
    esc.hline(x0, x1, stage - 1, '_');
    esc.hline(x0, x1, stage + 2, '_');
    const p = Math.max(6, Math.round(W / 9));
    for (let c = x0; c <= x1; c += p) {
      esc.put(c, stage + 1, '|');
      esc.put(c, stage + 2, '|');
      if (c + 3 < x1) esc.text(c + 2, stage + 1, p > 8 ? '<>' : '.');
    }
    for (let c = x0 + 3; c < x1; c += 6) esc.put(c, stage - 1, 'o');
  }

  // --- el telón recogido a los dos lados ----------------------------------------
  // Cuelga de la bambalina; los pliegues bajan juntándose en el lazo y se abren
  // otra vez hasta el piso del escenario.
  const tel = capas.at(Zb - 0.1);
  const telTop = Math.max(1, sy0 - 3);
  const tie = sy0 + Math.round(H * 0.62);
  const telBot = stage - 1;
  const spill = narrow ? 2 : Math.round(cols * 0.04);
  const telon = (side) => {
    const outer = side < 0 ? Math.floor(bx0) - spill : Math.ceil(bx1) + spill;
    const inner = side < 0 ? sx0 + (narrow ? 1 : 2) : sx1 - (narrow ? 1 : 2);
    const wTop = Math.abs(inner - outer);
    const wTie = Math.max(3, Math.round(wTop * 0.4));
    const wBot = Math.max(4, Math.round(wTop * 0.66));
    const edge = (r) => {
      if (r <= tie) {
        const u = (r - telTop) / Math.max(1, tie - telTop);
        return wTop + (wTie - wTop) * Math.sin((u * Math.PI) / 2);
      }
      const u = (r - tie) / Math.max(1, telBot - tie);
      return wTie + (wBot - wTie) * Math.pow(u, 0.7);
    };
    for (let r = telTop; r <= telBot; r++) {
      const w = edge(r);
      for (let i = 0; i <= Math.round(w); i++) tel.put(outer - side * i, r, SP);
    }
    // pliegues
    const n = Math.max(3, Math.round(wTop / 4));
    for (let k = 1; k < n; k++) {
      const f = k / n;
      tel.line(outer - side * wTop * f, telTop + 1, outer - side * wTie * f, tie);
      tel.line(outer - side * wTie * f, tie + 1, outer - side * wBot * f, telBot);
    }
    // borde de adentro y de afuera
    let prev = null;
    for (let r = telTop; r <= telBot; r++) {
      const p = [outer - side * edge(r), r];
      if (prev) tel.line(prev[0], prev[1], p[0], p[1]);
      prev = p;
    }
    tel.vline(outer, telTop + 1, telBot, '|');
    // lazo con borla
    const tx = Math.round(outer - side * wTie);
    tel.text(tx - 1, tie, '=Ø=');
    tel.put(tx, tie + 1, '|');
    tel.put(tx, tie + 2, 'V');
    tel.hline(Math.min(outer, outer - side * wBot), Math.max(outer, outer - side * wBot), telBot, '_');
  };
  telon(-1);
  telon(1);
  // bambalina con festón y flecos
  {
    const x0 = Math.floor(bx0) - spill;
    const x1 = Math.ceil(bx1) + spill;
    const y = telTop;
    for (let c = x0; c <= x1; c++) {
      tel.put(c, y - 1, '_');
      const k = (c - x0) % 6;
      tel.put(c, y, k === 0 ? '\\' : k === 5 ? '/' : '_');
      tel.put(c, y + 1, k === 2 ? "'" : k === 3 ? ' ' : tel.get(c, y + 1));
    }
  }

  // --- paredes, palcos y cielo raso ----------------------------------------------
  const muros = capas.at(Zb + 0.2);
  {
    const m = muros;
    m.line(X(XL, 1), Y(Yc, 1), bx0, byT);
    m.line(X(XR, 1), Y(Yc, 1), bx1, byT);
    // cielo raso con casetones
    for (const z of [1.35, 1.5, 1.66]) m.line(X(XL, z), Y(Yc, z), X(XR, z), Y(Yc, z));
    for (let k = 1; k < 6; k++) {
      const Xk = XL + ((XR - XL) * k) / 6;
      m.line(X(Xk, 1.1), Y(Yc, 1.1), X(Xk, Zb), byT);
    }
    for (const side of [-1, 1]) {
      const Xw = side < 0 ? XL : XR;
      const fr = -rows * 0.02;
      // cornisa con zigzag
      m.line(X(Xw, 1), Y(fr, 1), X(Xw, Zb), Y(fr, Zb));
      m.line(X(Xw, 1), Y(fr + 1.4, 1), X(Xw, Zb), Y(fr + 1.4, Zb));
      for (let i = 0; i < 46; i++) {
        const z = 1 + ((Zb - 1) * i) / 46;
        const r = Math.floor(Y(fr + 0.7, z));
        if (r >= 0) m.put(Math.floor(X(Xw, z)), r, i % 2 ? '/' : '\\');
      }
      // tela de la pared: puntos que se aprietan hacia el fondo
      for (let c = 0; c < cols; c++) {
        const z = (Xw - vx) / (c + 0.5 - vx);
        if (!(z >= 1 && z <= Zb)) continue;
        for (let r = Math.max(0, Math.ceil(Y(fr + 1.4, z)) + 1); r < room.floorY(z); r++) if ((c + r * 3) % 7 === 0) m.put(c, r, '.');
      }
      // zócalo de madera
      const zc = rows * 0.64;
      m.line(X(Xw, 1), Y(zc, 1), X(Xw, Zb), Y(zc, Zb));
      for (let i = 0; i < 20; i++) {
        const z = 1 + ((Zb - 1) * i) / 20;
        for (let r = Math.ceil(Y(zc, z)) + 1; r < room.floorY(z); r++) m.put(Math.floor(X(Xw, z)), r, '|');
      }
      // pilastra cerca nuestro
      const z = 1.05;
      const x0 = X(Xw, z);
      const x1 = X(Xw, z + 0.05);
      for (let r = Math.max(0, Math.ceil(Y(fr + 1.4, z)) + 1); r < rows; r++) {
        for (let c = Math.ceil(Math.min(x0, x1)); c <= Math.floor(Math.max(x0, x1)); c++) m.put(c, r, SP);
        m.put(Math.round(x0), r, '|');
        m.put(Math.round(x1), r, '|');
        if (Math.abs(x1 - x0) > 3) m.put(Math.round((x0 + x1) / 2), r, r % 2 ? ':' : ' ');
      }
    }
  }
  // palcos del primer piso: cajas que salen de las paredes, con gente asomada
  const palcos = [];
  if (!narrow) {
    for (const side of [-1, 1]) {
      const Xw = side < 0 ? XL : XR;
      const d = cols * 0.075;
      const Xf = Xw - side * d;
      const za = 1.16;
      const zb = 1.32;
      const Yt = rows * 0.12;
      const Yb = Yt + rows * 0.07;
      const pl = capas.at(1.15);
      const fx0 = X(Math.min(Xw, Xf), za);
      const fx1 = X(Math.max(Xw, Xf), za);
      const fyT = Y(Yt, za);
      const fyB = Y(Yb, za);
      const kx = X(Xf, zb);
      const kyT = Y(Yt, zb);
      const kyB = Y(Yb, zb);
      const sideX = side < 0 ? fx1 : fx0;
      // el hueco oscuro del palco, con cortinitas a los lados
      const top = Math.max(0, Math.round(Y(Yt - rows * 0.14, za)));
      const ktop = Y(Yt - rows * 0.14, zb);
      fillPoly(pl, [[fx0, top], [fx1, top], [fx1, fyB + 3], [fx0, fyB + 3]], SP);
      fillPoly(pl, [[sideX, top], [kx, ktop], [kx, kyB + 2], [sideX, fyB + 3]], SP);
      for (let r = top + 1; r < fyT; r++) for (let c = Math.ceil(fx0) + 2; c < fx1 - 1; c++) if ((c + r) % 3 === 0) pl.put(c, r, '.');
      pl.hline(Math.round(fx0), Math.round(fx1), top - 1, '_');
      pl.line(sideX, top - 0.5, kx, ktop - 0.5);
      pl.vline(Math.round(fx0), top, Math.floor(fyB) + 2, '|');
      pl.vline(Math.round(fx1), top, Math.floor(fyB) + 2, '|');
      pl.vline(Math.round(kx), Math.ceil(ktop), Math.floor(kyB) + 1, '|');
      for (let r = top; r < fyT; r++) {
        pl.put(Math.round(fx0) + 1, r, r < fyT - 2 ? ')' : '\\');
        pl.put(Math.round(fx1) - 1, r, r < fyT - 2 ? '(' : '/');
      }
      // antepecho con balaustres
      for (let r = Math.ceil(fyT); r < fyB; r++) for (let c = Math.ceil(fx0) + 1; c < fx1; c++) pl.put(c, r, SP);
      pl.line(fx0, fyT, fx1, fyT);
      pl.line(fx0, fyB, fx1, fyB);
      pl.line(sideX, fyT, kx, kyT);
      pl.line(sideX, fyB, kx, kyB);
      for (let c = Math.ceil(fx0) + 2; c < fx1 - 1; c += 2) for (let r = Math.ceil(fyT) + 1; r < fyB; r++) pl.put(c, r, '|');
      // la panza del palco
      arc(pl, (fx0 + fx1) / 2, fyB + 0.5, (fx1 - fx0) / 2, 2.2, Math.PI, Math.PI * 2, { round: true });
      pl.line(sideX, fyB + 2.5, kx, kyB + 1.5);
      palcos.push({ x0: fx0, x1: fx1, y: Math.round(fyT) - 1, side });
    }
  }
  // las salidas: letrero encendido y puerta en la pared, bajo el palco
  const salidas = [];
  for (const side of [-1, 1]) {
    const s = side < 0 ? SALIDA_I : SALIDA_D;
    if (narrow) {
      const x = side < 0 ? 1 : cols - s.w - 1;
      const y = Math.max(3, telTop - 6);
      capas.at(1.4).blit(s, x, y);
      salidas.push({ x, y, side });
      continue;
    }
    const Xw = side < 0 ? XL : XR;
    const za = 1.4;
    const zb = 1.58;
    const dl = capas.at(1.39);
    room.g = dl;
    const o = room.sideOpening(side, za, zb, rows * 0.46, rows, 'puerta');
    room.g = g0;
    const midX = (o.xa + o.xb) / 2;
    // hojas de la puerta con sus ojos de buey
    const zm = (za + zb) / 2;
    dl.vline(Math.round(X(Xw, zm)), Math.ceil(Y(rows * 0.46, zm)), rows - 1, '|');
    dl.put(Math.round(X(Xw, zm - 0.05)), Math.round(Y(rows * 0.56, zm - 0.05)), 'o');
    dl.put(Math.round(X(Xw, zm + 0.05)), Math.round(Y(rows * 0.56, zm + 0.05)), 'o');
    const x = Math.round(midX - s.w / 2);
    const y = Math.round(Math.min(o.ta, o.tb)) - s.h - 1;
    capas.at(1.38).blit(s, x, y);
    salidas.push({ x, y, side });
  }
  // apliques art déco en la pilastra de adelante y bajo los palcos
  const apliques = [];
  for (const side of [-1, 1]) {
    const Xw = side < 0 ? XL : XR;
    for (const [z, Yh] of narrow ? [[1.5, rows * 0.2]] : [[1.075, rows * 0.4], [1.25, rows * 0.36]]) {
      const x = Math.round(X(Xw, z) - APLIQUE.w / 2);
      const y = Math.round(Y(Yh, z));
      if (x < 0 || x + APLIQUE.w > cols) continue;
      capas.at(z - 0.01).blit(APLIQUE, x, y);
      apliques.push({ x: x + 2, y: y + 2, r: 3 });
    }
  }

  // --- butacas y público --------------------------------------------------------
  // Filas desde el escenario hasta abajo, con el espaciado de 1/z. Cada fila es
  // una banda: el canto de los respaldos y las cabezas encima.
  const N = narrow || rows > 60 ? 7 : 6;
  const zN = 1.06;
  const zF = Zb - 0.1;
  const yF = stage + 4;
  const yN = rows - 2;
  const sp = narrow ? cols * 0.2 : rows * 0.28;
  const aisle = narrow ? cols * 0.14 : cols * 0.1;
  const zOf = (i) => zN + ((zF - zN) * i) / (N - 1);
  const yOf = (i) => Math.round(yF + (yN - yF) * ((1 / zOf(i) - 1 / zF) / (1 / zN - 1 / zF)));
  const filas = [];
  const gente = [];
  for (let i = N - 1; i >= 0; i--) {
    const z = zOf(i);
    const y = yOf(i);
    const gap = i === N - 1 ? 1 : y - yOf(i + 1);
    const pitch = sp / z;
    let cls = CABEZAS.findIndex((k) => k.h <= gap * 1.7 + 0.5 && k.w <= pitch + 1);
    if (cls < 0) cls = CABEZAS.length - 1;
    const layer = capas.at(z);
    const fila = { z, y, cls, seats: [], layer };
    filas[i] = fila;
    const seatW = Math.max(3, Math.round(pitch) - 1);
    const stag = i % 2 ? 0.5 : 0;
    for (const side of [-1, 1]) {
      for (let k = 0; ; k++) {
        const Xs = vx + side * (aisle / 2 + sp * (k + 0.5 + stag * 0.4));
        const cx = X(Xs, z);
        if (cx < -seatW || cx > cols + seatW) break;
        const x0 = Math.round(cx - seatW / 2);
        for (let r = y; r < rows; r++) for (let c = x0; c < x0 + seatW; c++) layer.put(c, r, SP);
        layer.text(x0, y, '.' + '-'.repeat(Math.max(1, seatW - 2)) + '.');
        if (y + 1 < rows) {
          layer.put(x0, y + 1, '|');
          layer.put(x0 + seatW - 1, y + 1, '|');
          if (seatW >= 7) for (let c = x0 + 3; c < x0 + seatW - 3; c += 3) layer.put(c, y + 1, ':');
        }
        fila.seats.push({ cx, side, k, x0, w: seatW });
      }
    }
    // el pasillo: el borde del escalón con sus lucecitas
    const ax0 = Math.ceil(X(vx - aisle / 2, z));
    const ax1 = Math.floor(X(vx + aisle / 2, z));
    for (let r = y - 1; r < rows; r++) for (let c = ax0; c <= ax1; c++) layer.put(c, r, SP);
    layer.hline(ax0, ax1, y, '_');
    layer.put(ax0, y, '.');
    layer.put(ax1, y, '.');
  }
  // quién se sienta dónde
  const lleno = night ? 0.92 : 0.55;
  const libres = [];
  filas.forEach((fila, i) => {
    for (const s of fila.seats) {
      const h = hash2(Math.round(s.cx * 7) + i * 131, 3);
      if (h > lleno) {
        libres.push({ fila: i, s });
        continue;
      }
      const kid = !night && hash2(i * 3, Math.round(s.cx)) < 0.45 && fila.cls < CABEZAS.length - 1;
      const cls = kid ? fila.cls + 1 : fila.cls;
      const KK = CABEZAS[cls];
      const v = KK.v[Math.floor(hash2(Math.round(s.cx), i + 7) * KK.v.length)];
      gente.push({ fila: i, z: fila.z - 0.001, cls, kid, v, x: Math.round(s.cx - v.w / 2), y: fila.y - v.h + (kid ? 1 : 0), side: s.side, role: null, seed: Math.round(s.cx * 3) + i * 17 });
    }
  });
  const pick = (role, pred) => {
    const c = gente.filter((p) => !p.role && pred(p));
    if (!c.length) return null;
    const p = c[Math.floor(rng.next() * c.length)];
    p.role = role;
    return p;
  };
  const vis = (p) => p.x > 2 && p.x + p.v.w < cols - 2;
  for (let k = 0; k < (night ? 4 : 2); k++) pick('rie', (p) => vis(p) && p.fila >= 1 && p.fila <= 3);
  pick('calla', (p) => vis(p) && p.fila === 0 && CALLA[CABEZAS[p.cls].h] && !p.kid && Math.abs(p.x - vx) > 10);
  pick('cabritas', (p) => vis(p) && p.fila <= 1 && p.cls <= 1 && Math.abs(p.x - vx) > 14);
  for (const p of gente) {
    if (p.role || p.fila < 1 || p.fila > 2 || !vis(p)) continue;
    const q = gente.find((o) => !o.role && o.fila === p.fila && o.side === p.side && o.x > p.x && o.x - p.x < CABEZAS[p.cls].w + 6);
    if (q) {
      p.role = 'parejaI';
      q.role = 'parejaD';
      break;
    }
  }
  if (!night) for (let k = 0; k < 3; k++) pick('salta', (p) => p.kid && vis(p));
  for (let k = 0; k < (night ? 9 : 5); k++) pick('aplaude', vis);
  for (const p of gente) if (!p.role) filas[p.fila].layer.blit(p.v, p.x, p.y);
  const movidos = gente.filter((p) => p.role).sort((a, b) => b.z - a.z);
  const tarde = night ? libres.find((l) => l.fila === 2 && l.s.side > 0 && l.s.cx < cols - 12) || libres.find((l) => l.fila >= 1 && l.fila <= 3 && l.s.cx > 10 && l.s.cx < cols - 10) : null;

  capas.bake();

  // --- lo que se anima ------------------------------------------------------------
  const scr = new Clip(null, sx0, sy0, sx1, sy1);
  const tx0 = Math.floor(cols / 2 - 3.5) - 1 - sx0;
  const info = { W, H, ty: ty - sy0, tx0, tx1: tx0 + 8 };
  // el haz del proyector: un cono que baja desde arriba al medio hasta el borde
  // de la pantalla; adentro se borra el cielo raso (es luz) y flota el polvo
  const ay = -0.3 * sy0;
  const beamY1 = telTop - 2;
  const half = (y) => (W / 2) * ((y - ay) / (sy0 - ay));
  const haz = [];
  for (let y = 0; y <= beamY1; y++) haz.push([Math.round(vx - half(y + 0.5)), Math.round(vx + half(y + 0.5)) - 1]);
  for (let y = 0; y < haz.length; y++) {
    const [a, b] = haz[y];
    for (let c = a + 1; c < b; c++) room.g.put(c, y, SP);
  }
  const polvo = [];
  for (let i = 0; i < (narrow ? 16 : 28); i++) polvo.push({ u: hash2(i, 11), v: hash2(i, 12) * 2 - 1, s: 0.012 + hash2(i, 13) * 0.025, ph: hash2(i, 14) * 6 });
  // acomodador en el pasillo, cerca nuestro
  const yAt = (z) => yF + (yN - yF) * ((1 / z - 1 / zF) / (1 / zN - 1 / zF));
  const uz = narrow ? 1.25 : 1.3;
  const ux = Math.round(vx - 7);
  const uy = Math.round(yAt(uz)) + 1 - ACOMODADOR[0].h;

  return {
    anim(out, t) {
      scr.g = out;
      const ph = drawFilm(scr, t, info);
      const id = ph.id;
      const lt = ph.lt;

      // el haz: bordes punteados que tiemblan y polvo que flota
      const flick = Math.floor(t * 10) % 11 === 0;
      for (let y = 0; y < haz.length; y++) {
        const [a, b] = haz[y];
        const ch = flick ? "'" : y % 2 ? ':' : '.';
        out.put(a, y, ch);
        out.put(b, y, ch);
      }
      const tk = Math.floor(t * 2);
      for (let y = 0; y < haz.length; y++) {
        const [a, b] = haz[y];
        for (let c = a + 1; c < b; c++) if (hash2(c * 7 + tk, y * 13) < 0.045 && out.get(c, y) === SP) out.put(c, y, '.');
      }
      for (const p of polvo) {
        const u = (p.u + t * p.s) % 1;
        const y = Math.floor(u * (haz.length - 0.01));
        const [a, b] = haz[y];
        const x = Math.round((a + b) / 2 + ((b - a) / 2 - 1) * (p.v * 0.9 + Math.sin(t * 0.6 + p.ph) * 0.08));
        if (x > a && x < b && out.get(x, y) === SP) out.put(x, y, (t * 1.3 + p.ph) % 4 < 0.5 ? '°' : (t * 2 + p.ph) % 2 < 1 ? '.' : "'");
      }

      // los apliques dan una luz baja que titila
      for (const a of apliques) {
        if (hash2(Math.floor(t * 4), a.x) > (night ? 0.9 : 0.75)) continue;
        for (let k = 1; k <= a.r; k++) {
          for (const x of [a.x - k * 2, a.x + k * 2]) if (out.get(x, a.y + k) === SP) out.put(x, a.y + k, '.');
          if (out.get(a.x, a.y + k) === SP) out.put(a.x, a.y + k, k % 2 ? "'" : '.');
        }
      }
      // las salidas brillan
      for (const s of salidas) {
        if (Math.floor(t * 1.5) % 7 === 0) continue;
        out.put(s.side < 0 ? s.x - 1 : s.x + SALIDA_I.w, s.y + 1, '*');
      }
      // en los palcos: uno mira con binoculares, la señora se abanica
      for (const pc of palcos) {
        const cx = (pc.x0 + pc.x1) / 2;
        const ax = Math.round(cx - PALCO_A.w + (pc.side < 0 ? 1 : 2));
        const bx = Math.round(cx + (pc.side < 0 ? 2 : -4));
        out.blit(PALCO_A, ax, pc.y - PALCO_A.h + 1);
        out.blit(PALCO_B, bx, pc.y - PALCO_B.h + 1);
        const k = Math.floor(t * 3 + pc.side) % 3;
        out.put(bx + PALCO_B.w, pc.y - 1, k === 0 ? '/' : k === 1 ? '-' : '\\');
        if (id === 'fin' && Math.floor(t * 3) % 2) out.text(Math.round(cx - 4), pc.y - 3, ' ¡bravo! ');
      }

      // el público que se mueve, de atrás hacia adelante
      for (const p of movidos) {
        let s = p.v;
        let dx = 0;
        let dy = 0;
        let say = null;
        if (p.role === 'rie') {
          if ((id === 'anden' && lt > 4.6) || (id === 'cartelB' && lt < 0.8)) {
            dy = Math.floor(t * 6 + p.seed) % 2 ? -1 : 0;
            say = hash2(p.seed, Math.floor(t * 1.5)) < 0.5 ? 'ja ja' : '¡ja!';
          }
        } else if (p.role === 'calla') {
          if (id === 'cartelB' && lt > 0.5) {
            s = CALLA[CABEZAS[p.cls].h];
            say = '¡shhh!';
          }
        } else if (p.role === 'parejaI' || p.role === 'parejaD') {
          if (id === 'vagon' && lt > 3.2) dx = p.role === 'parejaI' ? 1 : -1;
          if (id === 'vagon' && lt > 4 && p.role === 'parejaI') say = 'ay...';
        } else if (p.role === 'salta') {
          if (id === 'ciudad' || (id === 'anden' && lt > 4)) dy = Math.floor(t * 4 + p.seed) % 2 ? -1 : 0;
          if (id === 'ciudad' && lt > 1 && lt < 3.5) say = '¡el tren!';
        } else if (p.role === 'aplaude') {
          if (id === 'fin' && hash2(p.seed, Math.floor(t * 3)) < 0.55) say = hash2(p.seed, 2) < 0.5 ? 'plas' : 'plas plas';
          else if (id === 'titulo' && lt < 1.2 && hash2(p.seed, 9) < 0.35) say = '¡empieza!';
        }
        const x = p.x + dx;
        const y = p.y + dy;
        capas.blit(out, s, x, y, p.z);
        if (p.role === 'cabritas') {
          const fr = CABRITAS[Math.floor(t * 2 + p.seed) % 2];
          const bx = x + s.w - 2;
          const by = y + Math.max(0, s.h - 4);
          capas.blit(out, fr, bx, by, p.z);
          const k = (t + p.seed * 0.1) % 3.5;
          if (k < 0.8) out.put(bx + 2 + Math.round(k * 3), by - 1 - Math.round(Math.sin(k * 3.9) * 2), '°');
        }
        if (say) {
          const bx = Math.max(0, Math.min(cols - say.length - 2, x + Math.round(s.w / 2) - 1));
          const by = y - 2;
          if (by > 1 && by !== ty) {
            out.text(bx, by, ` ${say} `);
            out.put(bx + 1, by + 1, '/');
          }
        }
      }

      // el que llega tarde pasa por delante de la fila pidiendo permiso
      const cyc = t % 37;
      if (tarde) {
        const f = filas[tarde.fila];
        if (cyc > 6 && cyc < 15) {
          const u = Math.min(1, (cyc - 6) / 6.5);
          const xs = X(vx + aisle * 0.6, f.z);
          const fr = TARDE[u < 1 ? Math.floor(t * 3) % 2 : 0];
          const x = Math.round(xs + (tarde.s.cx - xs) * u - fr.w / 2);
          const y = f.y - fr.h + 1;
          capas.blit(out, fr, x, y, f.z - 0.002);
          if (u < 1) {
            out.text(x + fr.w - 2, y - 2, ' permiso ');
            out.put(x + fr.w - 1, y - 1, '/');
          }
        } else if (cyc >= 15) {
          const s = CABEZAS[f.cls].v[0];
          capas.blit(out, s, Math.round(tarde.s.cx - s.w / 2), f.y - s.h, f.z - 0.001);
        }
      }

      // el acomodador y su linterna
      const torch = cyc > 5 && cyc < 15.5;
      const fr = ACOMODADOR[torch ? 1 : 0];
      capas.blit(out, fr, ux, uy, uz);
      if (torch) {
        const hx = ux + fr.w;
        const hy = uy + 6;
        const tf = tarde ? filas[tarde.fila] : filas[1];
        const xs = X(vx + aisle * 0.6, tf.z);
        const tx = tarde ? xs + (tarde.s.cx - xs) * Math.min(1, Math.max(0, (cyc - 6) / 6.5)) : vx + cols * 0.18 + Math.sin(t) * 6;
        const tyy = tf.y - 1;
        const n = Math.max(4, Math.round(Math.hypot(tx - hx, (tyy - hy) * 2) / 2));
        for (let k = 2; k <= n; k++) {
          const u = k / n;
          const x = hx + (tx - hx) * u;
          const y = hy + (tyy - hy) * u;
          const wv = Math.floor(u * 2.5);
          for (let w = -wv; w <= wv; w++) if ((k + w) % 2 === 0) out.put(x + w, y, u > 0.85 ? ':' : '.');
        }
      }
    },
  };
}
