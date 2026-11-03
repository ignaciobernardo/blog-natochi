// Calle y subsuelo: la vereda a los costados, la tierra, la rampa de la
// cochera, los caños, la cloaca y la estación de metro con su tren.
import { SP, ch } from './grid.js';
import { S } from './sprite.js';
import { Rng, hash2 } from './rng.js';
import { cafe, car, under, pet, plant, home, person } from './lib.js';
import { TEX, theme, POSE, routine, flipped, steam, drips, blink } from './fx.js';
import { FH } from './building.js';

const R = String.raw;
const DOT = ch('.');
const UND = ch('_');
const MAC = ch('¯');
const BAR = ch('|');
const EQ = ch('=');

const TREE = S(R`
  .--.
 (    )_
(  ()   )
 (_  _)_)
   ||
   ||
`);
const LAMP = cafe.post;
const BOAT = S(R`\_/
`);
const AWN = (w) => S('_'.repeat(w) + '\n' + '\\/'.repeat(Math.ceil(w / 2)).slice(0, w) + '\n' + ' ¨'.repeat(Math.ceil(w / 2)).slice(0, w), 'none');
const MANHOLE = S('[==]', 'solid');
const BRIDGE = S(R`
 _____
|_____|
`);

// tren: cabina + vagones con ventanillas y pasajeros. Puertas de 5 columnas
// con la juntura al medio; se abren en el andén.
function trainSprite(cars, rng) {
  const rows = [
    '     _________',
    '    /        |',
    '   / _____   |',
    '  / |     |  |',
    ' /  |_____|  |',
    '|____________|',
    "'-(o)(o)-----'",
  ];
  const doors = [];
  for (let k = 0; k < cars; k++) {
    const r = [' ' + '_'.repeat(32) + ' ', '|' + (k === 0 ? ' L6 ALAMEDA' : '').padEnd(32) + '|', '|', '|', '|', '|', "'-(o)(o)" + '-'.repeat(18) + "(o)(o)-'"];
    for (const seg of ['w6', 'd', 'w5', 'w5', 'd', 'w6']) {
      if (seg === 'd') {
        doors.push(rows[0].length + r[2].length);
        r[2] += ' ___ ';
        r[3] += '| | |';
        r[4] += '| | |';
        r[5] += '|_|_|';
      } else {
        const n = seg === 'w6' ? 4 : 3;
        const pax = rng.next();
        const a = pax < 0.4 ? ' o  ' : pax < 0.6 ? 'o  o' : '    ';
        const b = pax < 0.4 ? '/|\\ ' : pax < 0.6 ? '|  |' : '    ';
        r[2] += ' ' + '_'.repeat(n) + ' ';
        r[3] += '|' + a.slice(0, n) + '|';
        r[4] += '|' + b.slice(0, n) + '|';
        r[5] += '|' + '_'.repeat(n) + '|';
      }
    }
    for (let i = 2; i < 6; i++) r[i] += '|';
    for (let i = 0; i < 7; i++) rows[i] += r[i];
  }
  return { s: S(rows.join('\n'), 'solid'), doors };
}

export class Under {
  constructor(L) {
    this.L = L;
    const rng = new Rng(L.seed * 53 + L.cols);
    this.rng = rng;
    const { bx, bw, cols } = L;
    this.leftW = bx;
    this.rightX = bx + bw;
    // vereda: cosas a cada lado
    this.street = [];
    const add = (s, x) => this.street.push({ s, x });
    if (bx >= 9) {
      add(LAMP, bx - 9);
      if (bx >= 20) add(TREE, bx - 20);
      if (bx >= 26) add(cafe.hydrant, bx - 24);
    }
    if (cols - this.rightX >= 9) {
      add(cafe.bike, this.rightX + 2);
      add(LAMP, this.rightX + 9);
      if (cols - this.rightX >= 24) add(cafe.bench, this.rightX + 17);
      if (cols - this.rightX >= 30) add(cafe.bin, this.rightX + 25);
    }
    // tren
    this.train = trainSprite(L.narrow ? 2 : 3, rng);
    // gente esperando en el andén
    this.waiting = [];
    const poses = ['stand', 'phone', 'read', 'skirt', 'stand2', 'kid'];
    for (let x = 30; x < cols - 8; x += rng.int(9, 17)) {
      this.waiting.push({ x, pose: rng.pick(poses), face: rng.chance(0.5) ? 0 : 1, seed: rng.next() * 9 });
    }
    // trabajador y rata en la cloaca
    this.worker = routine(
      [
        { x: 4, dur: 3, pose: 'stand' },
        { x: cols - 10, dur: 4, pose: 'stand', face: -1 },
      ],
      { speed: 2.5 },
    );
    this.ladderX = bx >= 8 ? bx - 6 : cols - this.rightX >= 8 ? this.rightX + 3 : -1;
    // decoración del andén
    this.wall = [];
    let x = L.narrow ? 4 : 26;
    const deco = [under.poster1, under.map, under.poster2, under.vending];
    let i = 0;
    while (x < cols - 14) {
      this.wall.push({ s: deco[i % deco.length], x });
      x += deco[i % deco.length].w + rng.int(10, 22);
      i++;
    }
  }

  // tierra de fondo: debajo de la vereda, a lo ancho
  drawEarth(g, camY) {
    const { L } = this;
    const r0 = Math.max(0, L.G + 1 - camY);
    for (let r = r0; r < g.rows; r++) {
      const wy = r + camY;
      for (let c = 0; c < g.cols; c++) g.put(c, r, TEX.earth(c, wy));
    }
  }

  draw(g, camY, t) {
    const { L } = this;
    this.drawStreet(g, camY, t);
    this.drawRamp(g, camY, t);
    this.drawPipes(g, camY, t);
    this.drawSewer(g, camY, t);
    this.drawMetro(g, camY, t);
  }

  drawStreet(g, camY, t) {
    const { L } = this;
    const y = L.G - camY;
    if (y < -12 || y > g.rows + 2) return;
    const { bx, bw, cols } = L;
    // vereda y cordón
    for (const [a, b] of [
      [0, bx - 1],
      [bx + bw, cols - 1],
    ]) {
      if (b < a) continue;
      g.hline(a, b, y, UND);
      for (let c = a; c <= b; c++) g.put(c, y + 1, (c & 3) === 0 ? BAR : ch('¯'));
    }
    for (const it of this.street) g.blit(it.s, it.x, y - it.s.h + 1);
    // farolas de noche
    if (theme.dark)
      for (const it of this.street)
        if (it.s === LAMP) {
          g.put(it.x + 1, y - it.s.h + 3, ch("'"));
          g.put(it.x + 5, y - it.s.h + 3, ch('`'));
        }
    // toldo del café y puerta en el muro
    const cafeLeft = true;
    const doorX = cafeLeft ? bx : bx + bw - 3;
    for (let r = y - 3; r <= y; r++) for (let c = doorX; c < doorX + 3; c++) g.put(c, r, r === y ? UND : SP);
    g.put(doorX + 1, y - 3, ch('¯'));
    const aw = Math.min(bx - 1, 12);
    if (aw > 3) g.blit(AWN(aw), bx - aw, y - 6);
    // letrero vertical del café
    if (bx >= 4) {
      const on = blink(t, 1.1, 0.3);
      const word = 'CAFE';
      for (let i = 0; i < word.length; i++) {
        g.put(bx - 3, y - 12 + i, BAR);
        g.put(bx - 2, y - 12 + i, ch(word[i]));
        g.put(bx - 1, y - 12 + i, BAR);
      }
      g.text(bx - 3, y - 13, on ? '*¯*' : '.¯.');
      g.text(bx - 3, y - 12 + word.length, on ? '*_*' : '._.');
    }
    // panadería: puerta del otro lado y su letrero
    const rx = bx + bw - 3;
    for (let r = y - 3; r <= y; r++) for (let c = rx; c < rx + 3; c++) g.put(c, r, r === y ? UND : SP);
    if (cols - (bx + bw) >= 4) {
      const word = 'PAN';
      for (let i = 0; i < word.length; i++) {
        g.put(bx + bw, y - 11 + i, BAR);
        g.put(bx + bw + 1, y - 11 + i, ch(word[i]));
        g.put(bx + bw + 2, y - 11 + i, BAR);
      }
      g.text(bx + bw, y - 12, '.¯.');
      g.text(bx + bw, y - 11 + word.length, '._.');
    }
    // alguien que pasea al perro por la vereda izquierda
    if (bx >= 14) {
      const span = bx - 12;
      const u = (t * 0.12) % 2;
      const p = u < 1 ? u : 2 - u;
      const px = Math.round(1 + p * span);
      const right = u < 1;
      const f = Math.floor(t * 5) & 1;
      g.blit(POSE[f ? 'walk1' : 'walk2'][right ? 0 : 1], px, y - 2);
      g.blit(right ? pet.dog2 : flipped(pet.dog2), right ? px + 4 : px - 8, y - 1);
    }
    // tapa de la cloaca
    if (this.ladderX >= 0) g.blit(MANHOLE, this.ladderX - 1, y);
  }

  // rampa de la cochera: del -1 sube por la tierra hasta la vereda (lado derecho)
  drawRamp(g, camY, t) {
    const { L } = this;
    const right = L.bx + L.bw;
    const room = g.cols - right;
    const yF = L.floorsTop(L.nApt + 1) + 6 - camY; // piso del -1
    if (yF < -2 || yF - 10 > g.rows) return;
    // abertura en el muro
    for (let r = yF - 3; r <= yF; r++) for (let c = right - 3; c < right; c++) g.put(c, r, r === yF ? UND : SP);
    if (room < 6) return;
    // la rampa: sube 6 filas hasta la vereda
    const rise = L.G - (L.floorsTop(L.nApt + 1) + 6);
    for (let i = 0; i <= rise + 1; i++) {
      const r = yF - i;
      const c0 = right + i * 2;
      for (let c = c0; c < c0 + 2 && c < g.cols; c++) {
        g.put(c, r, c === c0 + 1 ? ch('/') : UND);
        // túnel: aire arriba de la rampa
        for (let rr = r - 4; rr < r; rr++) if (rr > L.G - camY) g.put(c, rr, SP);
        g.put(c, r + 1, ch('\\'));
      }
      for (let c = right; c < c0; c++) for (let rr = r - 4; rr < r && rr > L.G - camY; rr++) g.put(c, rr, SP);
    }
    // techo del túnel
    for (let c = right; c < g.cols; c++) {
      const r = yF - 5 - Math.floor((c - right) / 2);
      if (r > L.G - camY) g.put(c, r, ch('¯'));
    }
    // un auto que sube y baja por la rampa
    const cyc = 24;
    const u = (t + 7) % cyc;
    let cx;
    let cy;
    let face = 0;
    if (u < 4) {
      const e = u / 4;
      cx = right + Math.round((1 - e) * rise * 2);
      cy = yF - Math.round((1 - e) * rise);
      face = 1;
    } else if (u < 14) {
      cx = -100;
    } else if (u < 18) {
      const e = (u - 14) / 4;
      cx = right + Math.round(e * rise * 2);
      cy = yF - Math.round(e * rise);
    } else cx = -100;
    if (cx > -50) {
      const s = face ? flipped(car.hatch) : car.hatch;
      g.blit(s, cx - 2, cy - s.h + 1);
    }
  }

  drawPipes(g, camY, t) {
    const { L } = this;
    const y = L.pipesTop - camY;
    if (y > g.rows || y + 7 < 0) return;
    const { cols } = g;
    // caño maestro de agua: dos líneas con collares y el agua que corre adentro
    for (let c = 0; c < cols; c++) {
      const j = c % 22;
      const collar = j === 0 || j === 1;
      g.put(c, y + 1, collar ? BAR : UND);
      g.put(c, y + 2, collar ? BAR : (c + Math.floor(t * 6)) % 9 === 0 ? ch('~') : (c + Math.floor(t * 6)) % 9 === 4 ? ch('-') : SP);
      g.put(c, y + 3, collar ? BAR : MAC);
    }
    // gas: línea doble con válvulas
    for (let c = 0; c < cols; c++) g.put(c, y + 5, c % 31 === 15 ? ch('○') : EQ);
    // cables
    for (let c = 0; c < cols; c++) if ((c + 2) % 4 < 3) g.put(c, y + 6, ch('~'));
    // bajada del edificio a la cloaca, con gotas
    const dx = L.x0 + 6;
    for (let r = Math.max(0, L.foundation + 2 - camY); r < Math.min(g.rows, L.sewerTop - camY); r++) {
      g.put(dx - 1, r, BAR);
      g.put(dx, r, SP);
      g.put(dx + 1, r, BAR);
    }
    drips(g, dx, L.foundation + 2 - camY, L.sewerTop + 9 - camY, t, 0.9);
    // escalera de la boca de tormenta
    if (this.ladderX >= 0) {
      for (let r = Math.max(0, L.G + 2 - camY); r < Math.min(g.rows, L.sewerTop - camY); r++) {
        g.put(this.ladderX - 1, r, BAR);
        g.put(this.ladderX, r, ch('-'));
        g.put(this.ladderX + 1, r, ch('-'));
        g.put(this.ladderX + 2, r, BAR);
      }
    }
  }

  drawSewer(g, camY, t) {
    const { L } = this;
    const y = L.sewerTop - camY;
    if (y > g.rows || y + 15 < 0) return;
    const { cols } = g;
    // bóveda de ladrillos
    for (let r = 0; r < 2; r++) for (let c = 0; c < cols; c++) g.put(c, y + r, TEX.brick(c, L.sewerTop + r));
    // interior oscuro
    const tex = theme.dark ? TEX.clean : TEX.dense;
    for (let r = 2; r < 10; r++) for (let c = 0; c < cols; c++) g.put(c, y + r, tex(c, L.sewerTop + r));
    g.hline(0, cols - 1, y + 2, MAC);
    // caño por el techo y lámparas enjauladas
    for (let c = 0; c < cols; c++) g.put(c, y + 3, c % 23 === 7 ? ch('○') : EQ);
    for (let c = 12; c < cols - 3; c += 28) {
      g.text(c, y + 4, '(o)');
      if (theme.dark || blink(t, 0.4, c)) {
        g.put(c - 1, y + 5, ch('/'));
        g.put(c + 3, y + 5, ch('\\'));
      }
      drips(g, c + 9, y + 4, y + 9, t, 0.7, c * 0.1);
    }
    // nervios de la bóveda: pilares y arcos rebajados
    const bay = 30;
    for (let x = 4; x < cols; x += bay) {
      for (let r = 2; r < 7; r++) {
        g.put(x, y + r, BAR);
        g.put(x + 1, y + r, ch('/'));
        g.put(x + 2, y + r, BAR);
      }
      g.put(x + 3, y + 3, ch('\\'));
      g.put(x - 1, y + 3, ch('/'));
    }
    // vereda angosta con baranda
    for (let c = 0; c < cols; c++) {
      g.put(c, y + 7, c % 6 === 0 ? BAR : UND);
      g.put(c, y + 8, c % 6 === 0 ? BAR : SP);
      g.put(c, y + 9, UND);
    }
    // canal: agua que corre a la derecha con ondas "((("
    for (let r = 10; r < 14; r++) {
      for (let c = 0; c < cols; c++) {
        const fl = c - Math.floor(t * 4);
        let v = r === 10 ? (((fl % 5) + 5) % 5 === 0 ? ch('~') : SP) : EQ;
        if (r > 10 && ((fl + r * 7) % 19 + 19) % 19 === 0) v = ch('(');
        g.put(c, y + r, v);
      }
    }
    // barquito de papel y pato que flotan
    const bxp = Math.floor((t * 4 + 20) % (cols + 20)) - 10;
    g.blit(BOAT, bxp, y + 10);
    // ladrillos del fondo
    for (let c = 0; c < cols; c++) g.put(c, y + 14, TEX.brick(c, L.sewerTop + 14));
    // trabajador con linterna y rata
    const wk = this.worker(t);
    g.blit(wk.s, wk.x, y + 7 - 2);
    g.put(wk.x + 1, y + 4, ch('°'));
    const ru = (t * 0.3) % 2;
    const rp = ru < 1 ? ru : 2 - ru;
    const rx = Math.round(2 + rp * (cols - 12));
    g.text(rx, y + 8, ru < 1 ? '~(__)°>' : '<°(__)~');
    // escalera que baja de la calle
    if (this.ladderX >= 0)
      for (let r = y; r < y + 9; r++) {
        g.put(this.ladderX - 1, r, BAR);
        g.put(this.ladderX, r, ch('-'));
        g.put(this.ladderX + 1, r, ch('-'));
        g.put(this.ladderX + 2, r, BAR);
      }
    // la bajada del edificio desemboca en el canal
    const dx = L.x0 + 6;
    for (let r = y; r < y + 3; r++) {
      g.put(dx - 1, r, BAR);
      g.put(dx, r, SP);
      g.put(dx + 1, r, BAR);
    }
  }

  // Estación: andén al fondo con gente esperando, el tren adelante sobre las
  // vías. Cuando el tren está parado tapa el andén; al irse, la gente cambió.
  drawMetro(g, camY, t) {
    const { L } = this;
    const y = L.metroTop - camY;
    if (y > g.rows || y + 26 < 0) return;
    const { cols } = g;
    // losa
    for (let c = 0; c < cols; c++) {
      g.put(c, y, ch('/'));
      g.put(c, y + 1, ch('/'));
    }
    // pared del fondo con azulejos punteados
    for (let r = 2; r < 12; r++) {
      const wy = L.metroTop + r;
      for (let c = 0; c < cols; c++) {
        let v = SP;
        if (r === 2) v = MAC;
        else if ((wy & 1) === 0 && (c + (wy & 2)) % 4 === 0) v = DOT;
        g.put(c, y + r, v);
      }
    }
    g.hline(0, cols - 1, y + 8, ch('-'));
    // tubos de luz, carteles, reloj
    for (let c = 8; c < cols - 8; c += 22) {
      g.text(c, y + 2, '\\____/');
      if (theme.dark) g.text(c + 1, y + 3, "'  '");
    }
    for (const it of this.wall) g.blit(it.s, it.x, y + 3);
    const sign = under.sign;
    const mid = Math.floor(cols / 2);
    for (let c = mid - 40 - sign.w; c < cols; c += 80) if (c >= 0) g.blit(sign, c, y + 3);
    if (L.narrow) g.blit(sign, Math.max(0, mid - 6), y + 3);
    g.blit(under.clock, mid + 14, y + 2);
    const hands = ["'", '-', '.', '|'];
    g.put(mid + 15, y + 3, ch(hands[Math.floor(t / 2) % 4]));
    // andén: superficie en la fila 11, frente rayado hasta las vías
    const cyc = 30;
    const round = Math.floor(t / cyc);
    for (const p of this.waiting) {
      if (hash2(p.x, round) < 0.3) continue; // se subieron al tren
      const pose = ['stand', 'phone', 'read', 'skirt', 'stand2', 'kid'][Math.floor(hash2(p.x, round + 7) * 6)];
      const sp = POSE[pose][hash2(round, p.x) < 0.5 ? 0 : 1];
      g.blit(sp, p.x + Math.floor(hash2(p.x, round + 3) * 3), y + 11 - sp.h + 1);
    }
    for (let c = 0; c < cols; c++) {
      if (g.get(c, y + 11) === SP || g.get(c, y + 11) === DOT) g.put(c, y + 11, UND);
      for (let r = 12; r < 16; r++) g.put(c, y + r, r === 12 ? (c % 2 ? EQ : SP) : ch('/'));
    }
    // escalera fija que baja al andén desde la izquierda (rayada \_)
    if (!L.narrow) {
      const sx = 1;
      for (let i = 0; i < 8; i++) {
        const r = y + 3 + i;
        const c = sx + i * 2;
        for (let rr = r + 1; rr <= y + 11; rr++) {
          g.put(c, rr, (rr + c) & 1 ? ch('\\') : SP);
          g.put(c + 1, rr, (rr + c + 1) & 1 ? ch('\\') : SP);
        }
        g.put(c, r, ch('\\'));
        g.put(c + 1, r, UND);
      }
      g.hline(0, 0, y + 3, UND);
      const walker = (t * 0.9) % 12;
      const wi = Math.min(8, Math.floor(walker));
      const sp = POSE[Math.floor(t * 4) & 1 ? 'walk1' : 'walk2'][0];
      if (walker < 8) g.blit(sp, 1 + wi * 2, y + 1 + wi);
      else g.blit(sp, 17 + Math.floor((walker - 8) * 3), y + 9);
    }
    // vías: rieles y durmientes
    for (let c = 0; c < cols; c++) {
      g.put(c, y + 16, EQ);
      g.put(c, y + 17, c % 3 === 0 ? BAR : TEX.earth(c, L.metroTop + 17) === SP ? UND : DOT);
    }
    // tren: llega desde la derecha, frena, abre puertas y se va a la izquierda
    const tr = this.train;
    const u = t % cyc;
    const stopX = L.narrow ? 2 : Math.max(2, Math.floor((cols - tr.s.w) / 2));
    let x = null;
    let open = false;
    if (u < 6) {
      const e = 1 - u / 6;
      x = stopX + Math.round(e * e * (cols + 10 - stopX));
    } else if (u < 14) {
      x = stopX;
      open = u > 7 && u < 13;
    } else if (u < 21) {
      const e = (u - 14) / 7;
      x = stopX - Math.round(e * e * (tr.s.w + stopX + 10));
    }
    if (x !== null) {
      g.blit(tr.s, x, y + 9);
      if (open)
        for (const d of tr.doors) {
          g.text(x + d, y + 12, '|   |');
          g.text(x + d, y + 13, '|   |');
          // alguien que baja o sube
          if (hash2(d, round) < 0.5) g.blit(POSE.stand[hash2(round, d) < 0.5 ? 0 : 1], x + d + 1, y + 12);
        }
    }
    // roca debajo
    for (let r = 18; r < 26; r++) for (let c = 0; c < cols; c++) g.put(c, y + r, TEX.earth(c, L.metroTop + r));
  }
}
