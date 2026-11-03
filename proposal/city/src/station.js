// Las estaciones: andén pegado a la ventana (f 1.8), con techo de reticulado,
// columnas, carteles con el nombre, reloj, bancas, máquinas, escalera de
// salida y gente esperando. El reloj marca la hora real.
//
// Filas relativas a S (la vereda de abajo): techo en S−30..S−28, cosas
// colgadas debajo, baranda del fondo en S−2..S+4, piso y borde en S+5..S+8.
import { Grid, SP, frames, sprite } from './grid.js';
import { Rng, hash2 } from './rng.js';
import { M, L, STATIONS } from './world.js';

export const STATION_F = 1.8;
const BASE = 32; // fila de la tira que corresponde a S
const HALF = 150;
const R = String.raw;

// gente del andén: 4 filas, dos cuadros de espera cada uno
export const WAITING = [
  frames(R`
 o
/|\
 |
/ \
--
 o
/|\
 |
/ |`, 'line'),
  frames(R`
 o
/|\_
 |  []
/ \
--
 o_
/|\_
 |  []
/ \
`, 'line'),
  frames(R`
 o
/|]
 |
/ \
--
 o
/|]
 |
| \
`, 'line'),
  frames(R`
 o
/|\
 |\
/ \
--
 \o
  |\
  |
 / \
`, 'line'),
  frames(R`
/¯¯¯\
  |o
  |\
 / \
--
/¯¯¯\
  |o
  |\
 / |`, 'line'),
  frames(R`
 o  o
/|\/|\
 |  |
/ \/ \
--
 o  o
/|\-|\
 |  |
/ \/ \
`, 'line'),
  frames(R`
 o
/|\
 |  [¯]
/ \ |_|
--
  o
 /|\
  | [¯]
 / \|_|`, 'line'),
  frames(R`
 o
<|)
 |
/ \
--
 o
<|\
 |
/ \
`, 'line'),
];

const SITTING = frames(R`
  o
 /|\
 _|_|
--
  o
 /|]
 _|_|`, 'line');

const BENCH = sprite(R`
 _______
|_______|
 |     |`);
const VENDING = sprite(R`
 _______
|  ___  |
| |:::| |
| |___| |
| o o o |
| [___] |`);
const BIN = sprite(R`
 ___
[___]
|:::|
|___|`);
const MAPA = sprite(R`
 _____________
| /\_   o  _  |
|/   \_/|_/ \ |
|  o---o---o  |
|_____________|
   |       |`);
const POSTERS = [
  sprite(R`
 _________
|  .-~-.  |
| (  o  ) |
|  '-.-'  |
| PLANETA |
|_________|`),
  sprite(R`
 _________
|  /\  /\ |
| /  \/  \|
|  CERROS |
|  ¯¯¯¯¯¯ |
|_________|`),
  sprite(R`
 _________
|   ♪ ♫   |
|  o  o   |
| /|\/|\  |
| CONCIERTO
|_________|`),
  sprite(R`
 _________
|  _____  |
| |o   o| |
| | ___ | |
| LEE MÁS |
|_________|`),
];

const CLOCK = sprite(R`
   .---.
  / . . \
 | .   . |
  \ . . /
   '---'`);

export function buildStation() {
  const W = Math.ceil(L * STATION_F + 2 * M + 80);
  const g = new Grid(W, BASE + 9);
  const st = { g, baseRow: BASE, spans: [], people: [], clocks: [], boards: [], lamps: [] };
  const rng = new Rng(77);
  for (const s of STATIONS) {
    const c = Math.round(s.x * STATION_F + M);
    const a = c - HALF;
    const b = s.end ? c + HALF + 40 : c + HALF;
    st.spans.push([a - 30, b + 30]);
    station(st, s, a, b, c, rng);
  }
  return st;
}

function station(st, s, a, b, c, rng) {
  const { g } = st;
  const y = (k) => BASE + k; // fila relativa a S
  const WT = -13; // borde superior del muro del fondo
  // --- techo: borde, reticulado, viga inferior
  g.hline(a, b, y(-30), '_');
  for (let x = a; x <= b; x++) g.put(x, y(-29), (x - a) % 2 ? '/' : '\\');
  g.hline(a + 1, b - 1, y(-28), '¯');
  // --- muro del fondo
  for (let x = a - 2; x <= b + 2; x++) {
    for (let r = WT + 1; r <= 4; r++) {
      let ch = ' ';
      if (r === -4) ch = '_';
      else if (r === -3) ch = '=';
      else if (r === -2) ch = '¯';
      else if (x % 4 === 0 && r % 2 === 0) ch = '.';
      g.put(x, y(r), ch);
    }
    g.put(x, y(WT), '_');
    g.put(x, y(4), '_');
  }
  g.vline(a - 3, y(WT + 1), y(4));
  g.vline(b + 3, y(WT + 1), y(4));
  // columnas entre el techo y el muro
  const cols = [];
  for (let x = a + 12; x < b - 6; x += 34) cols.push(x);
  for (const x of cols) {
    g.text(x - 1, y(-27), '\\:/');
    for (let r = -26; r < WT; r++) g.text(x - 1, y(r), '|:|');
    g.text(x - 2, y(WT), '_|:|_');
  }
  // parte alta del muro: ventanales al barrio y el nombre de la estación
  const big = s.name.split('').join(' ');
  let x = a + 2;
  let k = rng.int(0, 1);
  while (x < b - 18) {
    if (k % 3 === 1 && x + big.length + 6 < b) {
      const w = big.length + 6;
      g.text(x, y(-11), ' ' + '_'.repeat(w - 2) + ' ');
      g.text(x, y(-10), '|' + ' '.repeat(w - 2) + '|');
      g.text(x + 3, y(-10), big);
      g.text(x, y(-9), '|' + ' '.repeat(w - 2) + '|');
      g.text(x + 3, y(-9), `línea ${s.line.slice(1)}`.toUpperCase());
      g.text(x, y(-8), ' ' + '¯'.repeat(w - 2) + ' ');
      x += w + 4;
    } else {
      const w = 18;
      g.hline(x + 1, x + w - 2, y(-12), '_');
      for (let r = -11; r <= -6; r++) {
        g.put(x, y(r), '|');
        g.put(x + w - 1, y(r), '|');
        for (let i = 1; i < w - 1; i++) g.put(x + i, y(r), 0);
      }
      g.put(x + (w >> 1), y(-12), '_');
      for (let r = -11; r <= -6; r++) g.put(x + (w >> 1), y(r), '|');
      g.hline(x, x + w - 1, y(-5), '¯');
      x += w + 4;
    }
    k++;
  }
  // parte baja: afiches, mapa, máquinas, basureros
  x = a + 4;
  const items = [MAPA, POSTERS[0], VENDING, POSTERS[1], BIN, POSTERS[2], VENDING, POSTERS[3], MAPA, BIN];
  let i = rng.int(0, 3);
  const sx = a + Math.round((b - a) * 0.68);
  while (x < b - 20) {
    const it = items[i++ % items.length];
    if (x + it.w > sx - 3 && x < sx + 24) {
      x = sx + 24;
      continue;
    }
    g.blit(it, x, y(4) - it.h + 1);
    x += it.w + rng.int(10, 20);
  }
  // escalera de salida (rayada), con baranda
  g.text(sx - 1, y(-4), '_'.repeat(18));
  for (let r = 0; r < 8; r++) {
    for (let q = 0; q < 14; q++) g.put(sx + r + q, y(-3 + r), q % 2 ? '_' : '\\');
    g.put(sx + r - 1, y(-3 + r), '\\');
    g.put(sx + r + 14, y(-3 + r), '\\');
  }
  // --- piso, línea amarilla y borde
  for (let xx = a - 4; xx <= b + 4; xx++) {
    g.put(xx, y(5), (xx & 1) === 0 ? '.' : ' ');
    g.put(xx, y(6), xx % 4 < 2 ? '-' : ' ');
    g.put(xx, y(7), '_');
    g.put(xx, y(8), xx % 8 === 0 ? '|' : ':');
  }
  for (let r = 0; r < 4; r++) {
    g.put(a - 5 - r, y(5 + r), '/');
    if (!s.end) g.put(b + 5 + r, y(5 + r), '\\');
  }
  if (s.end) {
    // tope de vía
    g.text(b + 8, y(2), ' ___ ');
    g.text(b + 8, y(3), '|=|=|');
    g.text(b + 8, y(4), '|_|_|');
  }
  // bancas con gente sentada
  for (let q = 0; q < 4; q++) {
    const bx = a + 20 + q * 70 + rng.int(-6, 6);
    if (bx > b - 12 || (bx + 9 > sx - 2 && bx < sx + 24)) continue;
    g.blit(BENCH, bx, y(2));
    if (rng.chance(0.7)) st.people.push({ x: bx + 2, y: y(1), kind: -1, seed: rng.int(0, 1e6) });
  }
  // gente esperando
  let px = a + 6;
  while (px < b - 6) {
    px += rng.int(9, 26);
    if (px > b - 6) break;
    st.people.push({ x: px, y: y(2), kind: rng.int(0, WAITING.length - 1), seed: rng.int(0, 1e6) });
  }
  // --- cosas colgadas del techo (sin pisarse)
  const used = [];
  const hang = (x0, w, fn) => {
    if (used.some(([p, q]) => x0 < q + 3 && x0 + w > p - 3)) return false;
    if (cols.some((cx) => cx + 2 > x0 && cx - 2 < x0 + w)) return false;
    used.push([x0, x0 + w]);
    fn();
    return true;
  };
  // reloj en el centro
  hang(c - 19, 10, () => {
    g.text(c - 15, y(-27), '|');
    g.blit(CLOCK, c - 19, y(-26));
    st.clocks.push({ x: c - 15, y: y(-24) });
  });
  // tablero de próximos trenes (o fin del recorrido)
  const msg = s.next ? `PRÓXIMO: ${s.next}` : 'FIN DEL RECORRIDO';
  const bw = msg.length + 4;
  for (let bx = c - 4; bx < c + 40; bx += 3) {
    if (
      hang(bx, bw, () => {
        g.text(bx + 2, y(-27), '|');
        g.text(bx + bw - 3, y(-27), '|');
        g.text(bx, y(-26), '_'.repeat(bw));
        g.text(bx, y(-25), '|' + ' '.repeat(bw - 2) + '|');
        g.text(bx + 2, y(-25), msg);
        g.text(bx, y(-24), '|' + ' '.repeat(bw - 2) + '|');
        g.text(bx, y(-23), '¯'.repeat(bw));
        if (s.next) st.boards.push({ x: bx + 2, y: y(-24), w: bw - 4 });
      })
    )
      break;
  }
  // salida
  hang(sx, 11, () => {
    g.text(sx + 2, y(-27), '|');
    g.text(sx, y(-26), '__________');
    g.text(sx, y(-25), '|SALIDA →|');
    g.text(sx, y(-24), '¯¯¯¯¯¯¯¯¯¯');
  });
  // lámparas
  for (let lx = a + 6; lx < b - 4; lx += 17) {
    hang(lx - 1, 3, () => {
      g.put(lx, y(-27), '|');
      g.text(lx - 1, y(-26), '/_\\');
      st.lamps.push({ x: lx, y: y(-25) });
    });
  }
}

// Lo que se mueve en el andén: gente, reloj, tablero, lámparas de noche.
export function drawStationDyn(scene, st, off, y0, t) {
  const { rd, night } = scene;
  const cols = rd.cols;
  for (const p of st.people) {
    const x = p.x - off;
    if (x < -8 || x > cols + 2) continue;
    const fr = p.kind < 0 ? SITTING : WAITING[p.kind];
    const k = hash2(p.seed, Math.floor(t / (1.5 + (p.seed % 5) * 0.4))) < 0.7 ? 0 : 1;
    rd.blit(fr[k], x, p.y + y0);
  }
  const now = new Date();
  const hr = (now.getHours() % 12) + now.getMinutes() / 60;
  const mn = now.getMinutes() + now.getSeconds() / 60;
  for (const c of st.clocks) {
    const x = c.x - off;
    if (x < -10 || x > cols + 10) continue;
    const y = c.y + y0;
    hand(rd, x, y, mn / 60, 2);
    hand(rd, x, y, hr / 12, 1);
    rd.put(x, y, 'o');
  }
  for (const b of st.boards) {
    const x = b.x - off;
    if (x < -40 || x > cols + 2) continue;
    const mins = 1 + (Math.floor(t / 20) % 4);
    const on = Math.floor(t * 1.5) % 2 === 0;
    rd.text(x, b.y + y0, (`EN ${mins} MIN ` + (on ? '●' : ' ')).padEnd(b.w).slice(0, b.w));
  }
  if (night) {
    for (const l of st.lamps) {
      const x = l.x - off;
      if (x < -2 || x > cols + 2) continue;
      rd.put(x, l.y + y0, '*');
      rd.put(x - 1, l.y + y0 + 1, "'");
      rd.put(x + 1, l.y + y0 + 1, '`');
    }
  }
}

// aguja de reloj: 8 direcciones, cada una con su glifo
const HAND = [
  [0, -1, '|'], [1, -1, '/'], [1, 0, '-'], [1, 1, '\\'],
  [0, 1, '|'], [-1, 1, '/'], [-1, 0, '-'], [-1, -1, '\\'],
];
function hand(rd, x, y, frac, len) {
  const [dx, dy, ch] = HAND[Math.round(frac * 8) % 8];
  rd.put(x + dx, y + dy, ch);
  if (len > 1 && dy === 0) rd.put(x + 2 * dx, y, ch);
}

export { SP };
