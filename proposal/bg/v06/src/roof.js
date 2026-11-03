// La azotea: casilla de la escalera con la sala de máquinas del ascensor,
// tanque de agua, antenas, ropa tendida, plantas, un gato y palomas.
import { SP, ch } from './grid.js';
import { S } from './sprite.js';
import { Rng, hash2 } from './rng.js';
import { roof, plant, pet, cafe, misc } from './lib.js';
import { POSE, routine, flipped, steam, theme } from './fx.js';

const R = String.raw;

const LINE_CLOTHES = [
  S(R`
|¯|
|_|
`),
  S(R`
\¯/
|_|
`),
  S(R`
V
`),
  S(R`
/¯\
`),
  S(R`
||
`),
  S(R`
_
)
`),
];

const TELESCOPE = S(R`
  _/
 //
/|\
`);
const MOTOR = S(R`
 ______
|(○)=[]|
|______|
`);
const SUNBED = S(R`
  o
\_/|__
 /  \
`);
const PLANTER = S(R`
\|/\|/\|/
|_______|
`);

export class Roof {
  constructor(L) {
    this.L = L;
    const rng = new Rng(L.seed * 31 + L.cols);
    this.rng = rng;
    const y = L.roofY; // fila del piso de la azotea
    const items = [];
    const used = [];
    const free = (a, b) => used.every(([u, v]) => b < u - 1 || a > v + 1);
    const place = (s, x, dy = 0) => {
      if (x < L.x0 || x + s.w > L.x1 || !free(x, x + s.w - 1)) return false;
      used.push([x, x + s.w - 1]);
      items.push({ s, x, y: y - s.h + 1 + dy });
      return true;
    };
    // casilla del núcleo (la dibuja el edificio)
    used.push([L.cx, L.cx + L.CW - 1]);
    const zones = [
      [L.x0 + 1, L.cx - 2],
      [L.cx + L.CW + 1, L.x1 - 1],
    ].filter(([a, b]) => b - a >= 8);
    const left = zones[0];
    const right = zones[1] || zones[0];
    // a la izquierda: tanque sobre patas, antena, chimenea y macetas
    const seq = (zone, list) => {
      let x = zone[0];
      for (const s of list) {
        if (x + s.w > zone[1]) continue;
        if (place(s, x)) {
          if (s === roof.chimney) this.chimney = x + 2;
          if (s === roof.fan) this.fan = x + 3;
          x += s.w + rng.int(1, 3);
        }
      }
      return x;
    };
    const lx = seq(left, L.narrow ? [roof.tank, plant.small] : [roof.tank, roof.antenna, PLANTER, roof.dish, roof.chimney]);
    // tendedero
    this.lines = [];
    const tryLine = (zone, from) => {
      const len = Math.min(18, zone[1] - from - 1);
      if (len >= 10) {
        used.push([from, from + len]);
        this.lines.push({ x: from, len, seed: rng.range(0, 9) });
        return from + len + 2;
      }
      return from;
    };
    let rx = right === left ? tryLine(left, lx) : tryLine(right, right[0] + 1);
    if (right !== left) {
      // reposera / telescopio, ventilador, panel solar, plantas
      if (rx + 8 < right[1]) {
        used.push([rx, rx + 6]);
        this.chill = rx;
        rx += 9;
      }
      let x = rx;
      for (const s of [roof.fan, roof.solar, plant.leafy, roof.antenna, plant.tall]) {
        if (x + s.w > right[1]) break;
        if (place(s, x)) {
          if (s === roof.fan) this.fan = x + 3;
          x += s.w + rng.int(1, 3);
        }
      }
    }
    this.items = items;
    // gato que camina por el parapeto y palomas
    this.catSpan = [L.x0, L.x1 - 6];
    this.pigeons = [L.bx + 1, L.bx + L.bw - 5];
  }

  draw(g, camY, t) {
    const { L } = this;
    const y = L.roofY - camY;
    if (y < -12 || y - 14 > g.rows) return;
    for (const it of this.items) g.blit(it.s, it.x, it.y - camY);
    // humo de la chimenea y aspas del ventilador
    if (this.chimney) steam(g, this.chimney, y - 4, t, 4, 2);
    if (this.fan) g.put(this.fan, y - 1, Math.floor(t * 8) & 1 ? ch('x') : ch('+'));
    // tendederos con ropa que se mece
    for (const ln of this.lines) {
      const yy = y - 5;
      g.vline(ln.x, yy, y, ch('|'));
      g.vline(ln.x + ln.len, yy, y, ch('|'));
      g.put(ln.x, yy - 1, ch('_'));
      g.put(ln.x + ln.len, yy - 1, ch('_'));
      for (let c = ln.x + 1; c < ln.x + ln.len; c++) g.put(c, yy - 1, ch('_'));
      let c = ln.x + 2;
      let i = 0;
      while (c < ln.x + ln.len - 2) {
        const s = LINE_CLOTHES[Math.floor(hash2(i, ln.seed * 10) * LINE_CLOTHES.length)];
        const sway = Math.sin(t * 1.5 + i) > 0.6 ? 1 : 0;
        if (c + s.w + sway < ln.x + ln.len) g.blit(s, c + sway, yy);
        c += s.w + 2;
        i++;
      }
      // alguien colgando ropa
      const px = ln.x + Math.floor(ln.len / 2) - 1;
      const f = Math.floor(t * 0.8 + ln.seed) % 3;
      g.blit(f === 0 ? POSE.up[0] : f === 1 ? POSE.wave[0] : POSE.stand[0], px, y - 2);
    }
    // descanso: sol de día, estrellas de noche
    if (this.chill !== undefined) {
      if (theme.dark) {
        g.blit(TELESCOPE, this.chill, y - 2);
        g.blit(POSE.stand[1], this.chill + 3, y - 2);
      } else g.blit(SUNBED, this.chill, y - 2);
    }
    // la azotea: parapeto con gato y palomas
    const py = y - 2;
    const span = this.catSpan;
    const u = (t * 0.25) % 2;
    const p = u < 1 ? u : 2 - u;
    const cxp = Math.round(span[0] + p * (span[1] - span[0]));
    const cat = u < 1 ? pet.cat : flipped(pet.cat);
    const stop = Math.sin(t * 0.7) > 0.7;
    g.blit(stop ? pet.cat2 : cat, cxp, y - 1);
    for (const px of this.pigeons) {
      const hop = Math.floor(t * 1.3 + px) % 5 === 0 ? 1 : 0;
      g.blit(roof.pigeon, px + hop, py - 2);
    }
  }
}
