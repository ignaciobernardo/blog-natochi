// Interiores de los lugares propios (personal.js en la calle):
//   platanus  la casa del 667 en una build night
//   laguna    sentado en la orilla de la laguna de Los Ángeles, leyendo
import { sprite, frames, SP, hash2, frameAt } from './util.js';
import { canopy } from '../personal.js';

const R = String.raw;

export function buildPersonal(room, place, target, night, rng) {
  if (place.kind === 'laguna') return laguna(room, place, night);
  return platanus(room, place, night, rng);
}

// --- PLATANUS: build night ------------------------------------------------------

const PANTALLA = (w) => {
  const top = ' ' + '_'.repeat(w - 2) + ' ';
  return { w, top };
};

// alguien del otro lado de la mesa, de frente, con el notebook
const FUNDADOR = [
  frames(R`
   ___
  (o o)
  _\-/_
 /     \
--
   ___
  (- -)
  _\-/_
 /     \
`),
  frames(R`
   ,,,
  (o o)
  _\o/_
 /     \
--
   ,,,
  (- -)
  _\o/_
 /     \
`),
  frames(R`
   ___
  ('.')
  _\_/_
 /     \
--
   ___
  (-.-)
  _\_/_
 /     \
`),
];

// alguien de espaldas en primer plano, mirando su pantalla
// (ª es el acento grave: un ` no se puede escribir dentro del template)
const ESPALDA = sprite(R`
     .-""""-.
    /,''''',\
   | '''''''' |
    \ ''''''' /
  .-'ª""""""ª'-.
 /              \
|                |
|________________|
`);

const NOTEBOOK_ATRAS = sprite(R`
 ________
|  (::)  |
|________|
`);

const PIZZA = sprite(R`
 ________
|\/\/\/\/|
|/\/\/\/\|
`);

const MONSTERA = sprite(R`
    __   __
  .(  \_/  ).
 (   \ | /   )
(_.--'\|/'--._)
    .-'|'-.
   (   |   )
    '-.|.-'
     [___]
     |___|
`);

const PERRO = frames(R`
   __
 _/ o\___
(_____  _)>
 '-'  '-'
--
   __
 _/ -\___
(_____  _)>
 '-'  '-'
`);

const PIZARRA = sprite(R`
 ________________________
|                        |
|  [idea] -> [mvp] ->    |
|              |         |
|           [demo!]      |
|                        |
|  [ ] [x] [ ]   :)      |
|________________________|
   /                  \
  /                    \
`);

function platanus(room, place, night, rng) {
  const { g, cols, rows, vx } = room;
  room.name = 'PLATANUS';
  room.sub = 'SORIA 667 · build night';
  room.shell({ floor: 'liso', walls: 'liso', back: 'liso', ceiling: 'liso', seed: 667 });
  const b = room.back;

  // la pared del fondo es un ventanal al jardín
  const gx0 = b.x0 + 1;
  const gx1 = b.x1 - 1;
  const gy0 = b.y0 + 2;
  const gy1 = b.y1 - 1;
  g.hline(gx0, gx1, gy0 - 1, '_');
  g.hline(gx0, gx1, gy1, '_');
  const mull = [];
  const step = Math.max(10, Math.round((gx1 - gx0) / 5));
  for (let c = gx0; c <= gx1; c += step) mull.push(c);
  mull.push(gx1);
  for (const c of mull) g.vline(c, gy0, gy1, '|');
  // jardín: dos árboles, buganvilia y la torre de ladrillo detrás
  const garden = [];
  const tw0 = Math.round(gx0 + (gx1 - gx0) * 0.55);
  const tw1 = Math.min(gx1 - 2, tw0 + 14);
  for (let r = gy0; r < gy1; r++) {
    for (let c = tw0; c <= tw1; c++) {
      if (mull.includes(c)) continue;
      const k = (c - tw0) % 6;
      g.put(c, r, k === 0 ? '|' : k === 5 ? ':' : (r - gy0) % 3 === 0 ? '_' : SP);
      if (k > 0 && k < 5 && (r - gy0) % 3 !== 0) garden.push({ c, r });
    }
  }
  canopy(g, gx0 + (gx1 - gx0) * 0.18, gy0 + (gy1 - gy0) * 0.45, Math.max(6, (gx1 - gx0) * 0.14), (gy1 - gy0) * 0.42, 5, 0.08);
  canopy(g, gx0 + (gx1 - gx0) * 0.86, gy0 + (gy1 - gy0) * 0.4, Math.max(5, (gx1 - gx0) * 0.12), (gy1 - gy0) * 0.45, 17, 0.1);
  for (let r = gy1 - 3; r < gy1; r++) {
    for (let c = gx0 + 1; c < gx1; c++) {
      if (mull.includes(c)) continue;
      const h = hash2(c * 3, r * 7);
      if (h < 0.16) g.put(c, r, h < 0.07 ? '*' : h < 0.12 ? ',' : "'");
    }
  }

  // puerta al jardín a la izquierda; pizarra con notas a la derecha
  room.sideOpening(-1, 1.25, 1.7, rows * 0.22, rows, 'puerta');
  const wb = room.sideOpening(1, 1.2, 1.75, rows * 0.24, rows * 0.62, 'puerta');
  const notes = [];
  for (let i = 0; i < 6; i++) {
    const u = 0.15 + (i % 3) * 0.3;
    const z = 1.2 + u * 0.55;
    const x = Math.round(room.x(cols, z)) - 3;
    const y = Math.round(room.y(rows * (0.3 + Math.floor(i / 3) * 0.14), z));
    notes.push({ x, y });
    g.text(x, y, i === 4 ? '[x]' : '[ ]');
  }
  void wb;

  // plantas en las esquinas del fondo
  room.stand(MONSTERA, cols * 0.04, 1.95);
  room.stand(MONSTERA, cols * 0.96, 1.95);

  // lámparas colgando sobre la mesa
  const lamps = [0.38, 0.62].map((f) => {
    const z = 1.7;
    const x = Math.round(room.x(cols * f, z));
    const yl = Math.round(room.by0) + 1;
    g.vline(x, Math.ceil(room.ceilY(z)), yl - 1, '|');
    g.text(x - 2, yl, '/___\\');
    return { x, y: yl + 1 };
  });

  // la mesa larga
  const tbl = room.box(cols * 0.28, cols * 0.72, rows * 0.15, 1.42, 1.85);
  const tableTop = Math.round(room.y(rows - rows * 0.15, 1.85)); // borde de atrás
  const seats = [];
  const n = Math.max(2, Math.min(5, Math.floor((tbl.c1 - tbl.c0) / 14)));
  for (let i = 0; i < n; i++) {
    const cx = Math.round(tbl.c0 + ((i + 0.5) * (tbl.c1 - tbl.c0)) / n);
    seats.push({ x: cx - 4, y: tableTop - 5, who: i % FUNDADOR.length, seed: i * 17 + 3 });
  }
  // sobre la mesa: notebooks, la pizza y latas
  for (const st of seats) g.blit(NOTEBOOK_ATRAS, st.x - 1, tbl.r0 - NOTEBOOK_ATRAS.h);
  g.blit(PIZZA, Math.round(vx - 4), tbl.r0 - 2);
  g.text(tbl.c0 + 3, tbl.r0 - 1, '[]');
  g.text(tbl.c1 - 5, tbl.r0 - 1, '[]');

  // en primer plano, a los costados, dos de espaldas con sus pantallas
  const backs = [0.13, 0.87].map((f) => {
    const x = Math.round(cols * f - ESPALDA.w / 2);
    const y = rows - ESPALDA.h - 2;
    const sw = ESPALDA.w + 4;
    const scr = { x: x - 2, y: y - 7, w: sw };
    g.rect(scr.x, scr.y + 1, sw, 5, SP);
    g.hline(scr.x + 1, scr.x + sw - 2, scr.y, '_');
    g.vline(scr.x, scr.y + 1, scr.y + 5, '|');
    g.vline(scr.x + sw - 1, scr.y + 1, scr.y + 5, '|');
    g.hline(scr.x, scr.x + sw - 1, scr.y + 6, '¯');
    g.blit(ESPALDA, x, y);
    return { x, y, scr };
  });
  // el perro duerme adelante, al medio
  const dog = { x: Math.round(vx - 6), y: rows - 7 };
  g.text(dog.x - 2, dog.y + 4, "'-.-.-.-.-.-.-.'");

  const CODE = ['const idea = await mvp()', 'if (!demo) ship()', 'git push origin main', 'npm run deploy', 'fix: ya funciona', '// 4am y seguimos', 'return ok'];
  const label = (s2) => {
    const x = Math.round(vx - s2.length / 2);
    return { x, s: s2 };
  };

  return {
    anim(out, t) {
      // letrero: cuenta regresiva hasta las 9 de la mañana (el demo)
      const now = new Date();
      const end = new Date(now);
      end.setHours(9, 0, 0, 0);
      if (end <= now) end.setDate(end.getDate() + 1);
      const left = Math.floor((end - now) / 1000);
      const hh = String(Math.floor(left / 3600)).padStart(2, '0');
      const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
      const ss = String(left % 60).padStart(2, '0');
      const sign = label(` platanus · build night · demo en ${hh}:${mm}:${ss} `);
      out.text(sign.x, b.y0, sign.s);
      // fundadores del otro lado de la mesa (sólo asoman sobre la mesa)
      for (const st of seats) {
        const fr = FUNDADOR[st.who][hash2(st.seed, Math.floor(t / 2.5)) < 0.25 ? 1 : 0];
        for (let r = 0; r < fr.h; r++) {
          const y = st.y + r;
          if (y >= tbl.r0 - NOTEBOOK_ATRAS.h) break;
          for (let c = 0; c < fr.w; c++) {
            const ch = fr.data[r * fr.w + c];
            if (ch) out.put(st.x + c, y, ch);
          }
        }
        // tecleo
        if (Math.floor(t * 6 + st.seed) % 3 === 0) out.put(st.x + 3 + (Math.floor(t * 9 + st.seed) % 3), tbl.r0 - 1, "'");
      }
      // en las pantallas de adelante, el código corre
      backs.forEach((bk, i) => {
        const s2 = bk.scr;
        const shown = s2.w - 4;
        for (let k = 0; k < 4; k++) out.text(s2.x + 2, s2.y + 1 + k, CODE[(Math.floor(t * 0.8) + k + i * 3) % CODE.length].slice(0, shown).padEnd(shown));
        if (Math.floor(t * 2) % 2) out.put(s2.x + 2 + Math.min(shown - 1, CODE[(Math.floor(t * 0.8) + 3 + i * 3) % CODE.length].length), s2.y + 4, '_');
        if (t % 12 > 9.5 && i === 0) out.text(s2.x + 2, s2.y + 4, 'deploy ok !'.padEnd(shown));
      });
      // vapor de un café sobre la mesa
      out.text(tbl.c1 - 10, tbl.r0 - 1, 'c[_]');
      for (let k = 0; k < 3; k++) {
        const p = (t * 0.7 + k * 0.33) % 1;
        out.put(tbl.c1 - 8 + Math.round(Math.sin(t * 2 + k)), tbl.r0 - 2 - Math.floor(p * 3), p < 0.6 ? '~' : '.');
      }
      // alguien cruza por detrás con un café
      const cyc = t % 16;
      if (cyc < 7) {
        const x = Math.round(b.x1 - 5 - (cyc / 7) * (b.x1 - b.x0 - 10));
        const y = tableTop - 9;
        out.text(x, y, ' o c');
        out.text(x, y + 1, '/|\\|');
        out.text(x, y + 2, cyc % 0.5 < 0.25 ? '/ \\ ' : ' |  ');
      }
      // el perro
      out.blit(PERRO[frameAt(t, 2, 1.4)], dog.x, dog.y);
      const z = Math.floor(t) % 3;
      if (z === 0) out.put(dog.x + 9, dog.y - 1, 'z');
      if (z === 1) out.put(dog.x + 10, dog.y - 2, 'Z');
      // una nota se mueve de "por hacer" a "hecho" cada tanto
      const ni = Math.floor(t / 6) % notes.length;
      out.text(notes[ni].x, notes[ni].y, t % 6 < 3 ? '[ ]' : '[x]');
      // de noche: lámparas, ventanas de la torre y guirnaldas en el jardín
      if (night) {
        for (const l of lamps) {
          out.put(l.x, l.y - 1, '*');
          for (let k = 1; k <= 3; k++) {
            if ((k + Math.floor(t * 2)) % 2) continue;
            out.put(l.x - k * 2, l.y + k, '.');
            out.put(l.x + k * 2, l.y + k, '.');
          }
        }
        for (const w of garden) if (hash2(w.c, w.r + Math.floor(t / 9)) < 0.3) out.put(w.c, w.r, '░');
        for (let c = gx0 + 1; c < gx1; c += 3) if (!mull.includes(c)) out.put(c, gy0, (c + Math.floor(t * 2)) % 2 ? '*' : '.');
      } else {
        const k = Math.floor(t * 1.5);
        for (let i = 0; i < 5; i++) {
          const c = gx0 + 2 + Math.floor(hash2(i, k) * (gx1 - gx0 - 4));
          const r = gy0 + 1 + Math.floor(hash2(k, i) * (gy1 - gy0 - 2));
          if (!mull.includes(c) && out.get(c, r) === SP) out.put(c, r, i % 2 ? '~' : ',');
        }
      }
    },
  };
}

// --- LA LAGUNA: leer en la orilla ------------------------------------------------

const BOTE = frames(R`
    ___________
   /  o     o  \
  |   |\   /|   |
 (_______________)
--
    ___________
   /  o     o  \
  |   |/   \|   |
 (_______________)
`);
const PATO = frames(R`
  _
 (o>
\_)
--
  _
 (o>
\_)~
`);

function laguna(room, place, night) {
  const { g, cols, rows, vx } = room;
  room.name = 'LAGUNA';
  room.sub = 'LOS ÁNGELES · a los 16, a leer';
  const E = Math.floor(rows / 2);
  const hy = E - 4; // orilla del fondo
  const wide = cols >= 90;

  // orilla del fondo: árboles, casas y el edificio alto
  for (let k = 0; k < Math.ceil(cols / 14); k++) {
    const cx = 4 + k * 14 + hash2(k, 3) * 5;
    canopy(g, cx, hy - 3, 5 + hash2(k, 1) * 3, 2.6 + hash2(k, 2) * 1.4, k * 11 + 3, 0.07);
  }
  for (let k = 0; k < Math.floor(cols / 30); k++) {
    const hx = 10 + k * 30 + Math.floor(hash2(k, 9) * 10);
    g.text(hx, hy - 3, ' /\\ ');
    g.text(hx, hy - 2, '/__\\');
    g.text(hx, hy - 1, '|[]|');
  }
  const bx0 = Math.round(cols * 0.74);
  const bx1 = bx0 + (wide ? 16 : 9);
  const btop = hy - (wide ? 14 : 10);
  g.rect(bx0, btop + 1, bx1 - bx0 + 1, hy - btop, SP);
  g.hline(bx0, bx1, btop, '_');
  g.vline(bx0, btop + 1, hy, '|');
  g.vline(bx1, btop + 1, hy, '|');
  const bwin = [];
  for (let r = btop + 2; r < hy; r += 2) for (let c = bx0 + 2; c < bx1 - 1; c += 3) {
    g.text(c, r, '[]');
    bwin.push({ c, r });
  }
  g.hline(0, cols - 1, hy, '_');

  // agua: ondas que se abren hacia adelante (perspectiva)
  const water = [];
  for (let r = hy + 1; r < rows; r++) {
    const d = (r - hy) / (rows - hy); // 0 lejos, 1 cerca
    for (let c = 0; c < cols; c++) {
      const h = hash2(c * 5, r * 3);
      if (h < 0.012 + d * 0.028) {
        g.put(c, r, d < 0.3 ? '-' : '~');
        water.push({ c, r });
      }
    }
  }
  // reflejo de los árboles del fondo, punteado
  for (let r = hy + 1; r < hy + 3; r++) for (let c = 0; c < cols; c++) if (hash2(c, r * 9) < 0.1) g.put(c, r, '.');

  // la isla a la derecha con sus árboles
  const ix0 = Math.round(cols * 0.6);
  const iy = E + 3;
  g.rect(ix0, iy - 1, cols - ix0, 2, SP);
  g.text(ix0, iy, '(' + '_'.repeat(Math.max(1, cols - ix0 - 1)));
  for (let c = ix0 + 1; c < cols; c++) g.put(c, iy - 1, hash2(c, 5) < 0.5 ? ',' : "'");
  canopy(g, ix0 + (cols - ix0) * 0.3, iy - 7, (cols - ix0) * 0.2, 6, 41, 0.09);
  canopy(g, ix0 + (cols - ix0) * 0.72, iy - 9, (cols - ix0) * 0.24, 8, 53, 0.11);
  for (const f of [0.3, 0.72]) {
    const tx = Math.round(ix0 + (cols - ix0) * f);
    for (let r = iy - 3; r < iy; r++) g.text(tx, r, '||');
  }

  // el puente rojo: arco de piedra y baranda de rombos, con su reflejo
  const p0 = Math.round(cols * 0.04);
  const p1 = ix0 + 2;
  const pm = (p0 + p1) / 2;
  const half = (p1 - p0) / 2;
  const deck = E - 2;
  const feet = E + 6;
  const archTop = E + 1;
  const ya = (c) => {
    const u = (c - pm) / half;
    return archTop + (feet - archTop) * u * u;
  };
  for (let c = p0; c <= p1; c++) {
    for (let r = deck + 1; r < ya(c); r++) g.put(c, r, hash2(c * 5, r * 3) < 0.06 ? (hash2(c, r) < 0.5 ? '_' : '|') : SP);
  }
  // anillo de piedra: dos curvas, una fila de por medio, con dovelas
  for (let c = p0; c < p1; c++) {
    g.line(c, ya(c) - 1, c + 1, ya(c + 1) - 1);
    g.line(c, ya(c), c + 1, ya(c + 1));
  }
  for (let c = p0 + 3; c < p1 - 2; c += 5) g.put(c, Math.round(ya(c) - 0.5), c < pm ? '\\' : '/');
  // pilares del arco
  g.text(p0 - 1, feet, '_/');
  g.text(p1, feet, '\\_');
  // reflejo del arco (más corto y punteado)
  const refl = [];
  for (let c = p0; c <= p1; c++) {
    for (const off of [0, 1]) {
      const yr = Math.round(feet + 1 + (feet - ya(c)) * 0.7 + off);
      if (yr < rows - 8 && yr > feet) {
        if ((c + off) % 2 === 0) g.put(c, yr, '.');
        refl.push({ c, r: yr });
      }
    }
  }
  // reflejo de la baranda, cortado por las ondas
  for (let c = p0; c <= p1; c++) if (hash2(c, 77) < 0.35) g.put(c, Math.min(rows - 9, feet + Math.round((feet - deck) * 0.7) + 3), (c - p0) % 2 ? '/' : '\\');
  // baranda
  g.hline(p0, p1, deck - 3, '_');
  for (let c = p0; c <= p1; c++) {
    const k = (c - p0) % 8;
    g.put(c, deck - 2, k === 0 ? '|' : k % 2 ? '/' : '\\');
    g.put(c, deck - 1, k === 0 ? '|' : k % 2 ? '\\' : '/');
  }
  g.hline(p0, p1, deck, '¯');
  for (let c = p0; c <= p1; c += 8) g.put(c, deck - 4, 'o');

  // primer plano: pasto con juncos y flores rojas, y el libro abierto
  const grass = rows - 7;
  for (let r = grass; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const edge = Math.abs(c - vx) > cols * 0.28;
      if (!edge && r < rows - 3) continue;
      const h = hash2(c * 7, r * 5);
      g.put(c, r, h < 0.16 ? ',' : h < 0.28 ? "'" : h < 0.31 ? '*' : SP);
    }
  }
  for (const c of [2, 6, cols - 4, cols - 9, cols - 14]) {
    for (let r = grass - 3; r < grass + 2; r++) g.put(c, r, '|');
    g.put(c - 1, grass - 3, '\\');
    g.put(c + 1, grass - 3, '/');
  }
  const bw = Math.min(46, cols - 8);
  const bh = 8;
  const bxL = Math.round(vx - bw / 2);
  const byT = rows - bh - 3;
  const half2 = Math.floor(bw / 2);
  g.rect(bxL, byT, bw, bh, SP);
  g.text(bxL, byT, ' ' + '_'.repeat(half2 - 2) + '  ' + '_'.repeat(bw - half2 - 2) + ' ');
  for (let r = byT + 1; r < byT + bh - 1; r++) {
    g.put(bxL, r, '|');
    g.put(bxL + half2 - 1, r, '|');
    g.put(bxL + half2, r, '|');
    g.put(bxL + bw - 1, r, '|');
  }
  g.text(bxL, byT + bh - 1, '\\' + '_'.repeat(half2 - 2) + '/\\' + '_'.repeat(bw - half2 - 2) + '/');
  // líneas de texto (borrosas: se lee, no se entiende)
  const lines = [];
  for (let r = byT + 1; r < byT + bh - 2; r++) {
    for (const [x0, x1] of [[bxL + 2, bxL + half2 - 3], [bxL + half2 + 2, bxL + bw - 3]]) {
      let s = '';
      for (let c = x0; c <= x1; c++) s += hash2(c, r * 3) < 0.18 ? ' ' : '~';
      g.text(x0, r, s);
      lines.push({ x0, r, s });
    }
  }
  g.text(bxL + half2 - 5, byT + bh - 2, '16');

  return {
    anim(out, t) {
      // cielo: nubes de día; luna y estrellas de noche
      if (night) {
        for (let r = 1; r < hy - 6; r++) for (let c = 0; c < cols; c++) if (hash2(c * 13, r * 7) < 0.015) out.put(c, r, (t + c) % 4 < 3.5 ? '.' : '*');
        const mx = Math.round(cols * 0.2);
        out.text(mx, 3, ' .-.');
        out.text(mx, 4, '(   )');
        out.text(mx, 5, " '-'");
        // la luna en el agua
        for (let r = hy + 2; r < E + 9; r += 2) if ((r + Math.floor(t * 3)) % 3) out.put(mx + 2 + Math.round(Math.sin(t + r) * 1.2), r, ':');
        for (const w of bwin) if (hash2(w.c, w.r + Math.floor(t / 11)) < 0.4) out.text(w.c, w.r, '▒▒');
        for (let c = p0; c <= p1; c += 8) out.put(c, deck - 4, '*');
      } else {
        for (let i = 0; i < 3; i++) {
          const w = 16 + i * 4;
          const x = Math.round(((t * (1.2 + i * 0.4) + i * cols * 0.4) % (cols + w)) - w);
          const y = 3 + i * 3;
          out.ink(x, y, '  .-~~-.' + '~'.repeat(Math.max(0, w - 14)) + '-.');
          out.ink(x, y + 1, " (__________" + '_'.repeat(Math.max(0, w - 14)) + ')');
        }
      }
      // ondas que titilan y el reflejo del puente que se mueve
      for (let i = 0; i < water.length; i += 3) {
        const w = water[i];
        const k = Math.floor(t * 1.4 + w.c * 0.31 + w.r) % 4;
        out.put(w.c, w.r, k === 0 ? ' ' : k === 1 ? '~' : '-');
      }
      for (const p of refl) if ((p.c + Math.floor(t * 2)) % 3 === 0) out.put(p.c + (Math.floor(t * 2) % 2), p.r, '.');
      // un bote a pedal que pasa bajo el puente, otro quieto junto a la isla
      const span = cols + 40;
      const bxp = Math.round(((t * 2.2) % span) - 20);
      out.blit(BOTE[frameAt(t, 2, 0.4)], bxp, feet + 1);
      // patos
      for (let i = 0; i < 2; i++) {
        const px = Math.round(cols - 10 - ((t * (1.1 + i * 0.3) + i * 30) % (cols * 0.5)));
        out.blit(PATO[frameAt(t, 2, 0.6, i)], px, E + 9 + i * 2);
      }
      // dar vuelta la página cada tanto
      const ph = t % 14;
      if (ph < 1.2) {
        const u = ph / 1.2;
        const x = Math.round(bxL + bw - 2 - u * (half2 - 1));
        for (let r = byT + 1; r < byT + bh - 1; r++) out.put(x, r, u < 0.5 ? '\\' : '/');
        for (const l of lines) if (l.x0 > bxL + half2 && l.x0 < x) out.text(l.x0, l.r, ' '.repeat(l.s.length));
      }
      // una hoja que cae sobre el agua
      const fp = (t * 0.17) % 1;
      out.put(Math.round(cols * 0.85 + Math.sin(t * 1.6) * 3), Math.round(2 + fp * (E + 6)), fp < 0.5 ? ',' : "'");
    },
  };
}

void PANTALLA;
