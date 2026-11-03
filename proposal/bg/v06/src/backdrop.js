// Fondo con parallax: cielo (0.12), ciudad lejana (0.35) y los edificios
// vecinos (0.7), que asoman a los costados con fachadas punteadas.
// Todo se dibuja solo por encima de la vereda: abajo tapa la tierra.
import { SP, ch } from './grid.js';
import { S } from './sprite.js';
import { Rng, hash2 } from './rng.js';
import { sky, roof, person, plant, pet } from './lib.js';
import { theme, TEX, blink, steam } from './fx.js';

const R = String.raw;
const DOT = ch('.');
const COLON = ch(':');

const SPEED = { sky: 0.12, far: 0.35, near: 0.7 };

// ventanas de los vecinos (4x2 por dentro)
const WIN_IN = [
  ['    ', '    '],
  ['    ', '    '],
  [')  (', ')  ('],
  [' o  ', '/|\\ '],
  ['    ', '\\|/ '],
  ['----', '----'],
  ['  o ', ' /) '],
  ['    ', '    '],
];

const BILLBOARD = S(R`
 _______________
|  .-.     _    |
| (   )  _( )_  |
|  '-'  (_____) |
|_______________|
  |           |
  |           |
`);

const BALLOON = S(R`
 .-.
(   )
 \ /
 [_]
`);

const FIRE = S(R`
|¯¯¯¯¯¯¯|
|\_\_\_ |
|      \|
`, 'none');

export class Backdrop {
  constructor(L) {
    this.L = L;
    const rng = new Rng(L.seed * 101 + L.cols);
    this.rng = rng;
    const { cols, bx, bw } = L;
    // torres lejanas
    this.towers = [];
    let x = -rng.int(0, 6);
    while (x < cols) {
      const w = rng.int(7, 15);
      const top = L.roofY - rng.int(3, 18);
      this.towers.push({ x, w, top, roof: rng.int(0, 4), shade: rng.chance(0.5), seed: rng.next() * 99 });
      x += w + rng.int(-2, 2);
    }
    // una grúa de obra sobre una de las torres lejanas
    const mids = this.towers.filter((tw) => tw.x > cols * 0.3 && tw.x < cols * 0.7);
    if (mids.length) {
      const tw = rng.pick(mids);
      this.crane = { x: tw.x + 2, base: tw.top - 1, h: 9, jib: Math.min(26, Math.floor(cols * 0.12)), back: 7 };
    }
    // vecinos: el de la izquierda y el de la derecha
    const gapL = L.narrow ? 1 : rng.int(3, 6);
    const gapR = L.narrow ? 1 : rng.int(3, 6);
    // el izquierdo es más alto (tanque y letrero de pensión); el derecho más
    // bajo, con escalera de incendio y cartel en la terraza
    const wl = bx - gapL;
    this.neighbors = [
      { side: 'L', x0: Math.min(-2, wl - 60), x1: wl, top: L.roofY - 9, sign: 'PENSION', tank: true, fire: wl > 40, seed: 3 },
      { side: 'R', x0: bx + bw + gapR, x1: cols + 2, top: L.roofY + 5, sign: 'BAR', bill: true, fire: true, seed: 7 },
    ].filter((n) => n.x1 - n.x0 > 2);
    // nubes, pájaros, avión
    this.clouds = [];
    for (let i = 0; i < Math.max(3, Math.floor(cols / 35)); i++) {
      this.clouds.push({
        s: rng.pick([sky.cloud1, sky.cloud2, sky.cloud3, sky.cloud3]),
        x: rng.range(0, cols),
        y: rng.int(1, Math.max(3, L.roofY - 16)),
        v: rng.range(0.4, 1.2),
      });
    }
    this.birds = [];
    for (let i = 0; i < 5; i++) this.birds.push({ x: rng.range(0, cols), y: rng.int(3, Math.max(5, L.roofY - 10)), v: rng.range(2, 4), ph: rng.next() });
    this.stars = [];
    for (let i = 0; i < Math.floor((cols * L.roofY) / 40); i++) this.stars.push([rng.int(0, cols), rng.int(0, L.roofY), rng.next()]);
  }

  draw(g, camY, t) {
    const { L } = this;
    // filas visibles por encima de la vereda
    const limit = Math.min(g.rows, L.G - camY + 1);
    if (limit <= 0) return;
    this.drawSky(g, camY, t, limit);
    this.drawFar(g, camY, t, limit);
    for (const n of this.neighbors) this.drawNeighbor(g, n, camY, t, limit);
  }

  drawSky(g, camY, t, limit) {
    const off = Math.floor(camY * SPEED.sky);
    const { cols } = g;
    if (theme.dark) {
      for (const [x, y, k] of this.stars) {
        const r = y - off;
        if (r < 0 || r >= limit) continue;
        const tw = blink(t, 0.3 + k * 0.5, k * 7, 0.85);
        g.put(x, r, k < 0.1 ? ch('*') : tw ? (k < 0.5 ? DOT : ch("'")) : SP);
      }
      const m = sky.moon;
      g.blit(m, cols - Math.floor(cols * 0.22), 3 - off);
    } else {
      // sol con rayos que giran
      const sx = Math.floor(cols * 0.78);
      const sy = 3 - off;
      g.blit(sky.sun, sx, sy);
      if (Math.floor(t * 1.5) & 1) {
        g.put(sx + 1, sy, SP);
        g.put(sx + 5, sy, SP);
        g.put(sx + 1, sy + 2, SP);
        g.put(sx + 5, sy + 2, SP);
      }
    }
    for (const c of this.clouds) {
      const w = cols + c.s.w + 4;
      const x = Math.floor((((c.x + t * c.v) % w) + w) % w) - c.s.w;
      if (c.y - off < limit) g.blit(c.s, x, c.y - off);
    }
    if (!theme.dark)
      for (const b of this.birds) {
        const w = cols + 10;
        const x = Math.floor((b.x + t * b.v) % w) - 5;
        const y = b.y - off + Math.round(Math.sin(t * 0.8 + b.ph * 6));
        if (y < limit) g.put(x, y, Math.floor(t * 4 + b.ph * 4) & 1 ? ch('v') : ch('^'));
      }
    // globo que deriva de día
    if (!theme.dark) {
      const w = cols + 10;
      const bx = Math.floor((cols * 0.15 + t * 0.35) % w) - 5;
      const by = 4 - off + Math.round(Math.sin(t * 0.2) * 1.5);
      if (by + BALLOON.h <= limit) g.blit(BALLOON, bx, by);
    } else {
      // estrella fugaz de vez en cuando
      const k = Math.floor(t / 9);
      const u = (t % 9) / 0.8;
      if (u < 1 && hash2(k, 5) < 0.7) {
        const sx = Math.floor(hash2(k, 1) * cols * 0.8);
        const sy = 2 + Math.floor(hash2(k, 2) * 6) - off;
        const i = Math.floor(u * 6);
        for (let j = 0; j < 3; j++) if (sy + i - j < limit && i - j >= 0) g.put(sx + (i - j) * 2, sy + i - j, j === 0 ? ch('*') : ch('\\'));
      }
    }
    // avión que cruza de vez en cuando
    const pu = (t * 3) % (cols * 3);
    if (pu < cols + 12) {
      const py = 2 - off;
      if (py + 2 < limit) {
        g.blit(sky.plane, Math.floor(cols - pu), py);
        if (theme.dark && blink(t, 1.5)) g.put(Math.floor(cols - pu) + 3, py, ch('*'));
      }
    }
  }

  drawFar(g, camY, t, limit) {
    const off = Math.floor(camY * SPEED.far);
    // grúa: torre rayada, pluma, carro que va y viene y gancho con carga
    if (this.crane) {
      const c = this.crane;
      const top = c.base - c.h - off;
      for (let r = 0; r < c.h; r++) {
        const y = top + r + 1;
        if (y < 0 || y >= limit) continue;
        g.put(c.x, y, ch('|'));
        g.put(c.x + 1, y, (r & 1) === 0 ? ch('/') : ch('\\'));
        g.put(c.x + 2, y, ch('|'));
      }
      if (top >= 0 && top < limit) {
        for (let i = -c.back; i <= c.jib; i++) g.put(c.x + 1 + i, top, ch('='));
        g.text(c.x - c.back, top + 1, '[##]');
        g.put(c.x + 1, top - 1, ch('^'));
        const u = (t * 0.06) % 2;
        const pos = u < 1 ? u : 2 - u;
        const tx = c.x + 5 + Math.round(pos * (c.jib - 6));
        const drop = 2 + Math.round((Math.sin(t * 0.35) + 1) * 2.5);
        g.put(tx, top, ch('o'));
        for (let r = 1; r < drop; r++) if (top + r < limit) g.put(tx, top + r, ch('|'));
        if (top + drop < limit) g.text(tx - 1, top + drop, '[_]');
      }
    }
    for (const tw of this.towers) {
      const top = tw.top - off;
      if (top - 3 >= limit) continue;
      const x0 = tw.x;
      const x1 = tw.x + tw.w - 1;
      const mid = x0 + (tw.w >> 1);
      // remates: antena, techo a dos aguas, tanque, cúpula
      if (tw.roof === 1) {
        g.put(mid, top - 3, ch('+'));
        g.put(mid, top - 2, ch('|'));
        g.put(mid, top - 1, ch('|'));
      } else if (tw.roof === 2) {
        for (let i = 1; i < (tw.w >> 1); i++) {
          g.put(x0 + i, top - i, ch('/'));
          g.put(x1 - i, top - i, ch('\\'));
        }
      } else if (tw.roof === 3) {
        g.text(x0 + 2, top - 2, '.-.');
        g.text(x0 + 2, top - 1, '|_|');
      } else if (tw.roof === 4 && tw.w > 8) {
        g.text(mid - 2, top - 2, '.---.');
        g.put(mid - 3, top - 1, ch('('));
        g.put(mid + 3, top - 1, ch(')'));
      }
      g.hline(x0, x1, top - 1, ch('_'));
      for (let r = Math.max(0, top); r < limit; r++) {
        const wy = r + off;
        const lr = wy - tw.top;
        g.put(x0, r, ch('|'));
        g.put(x1, r, ch('|'));
        for (let c = x0 + 1; c < x1; c++) {
          const lc = c - x0;
          let v = SP;
          if (lr % 3 === 1 && lc % 3 === 2 && c < x1 - 1) {
            const on = hash2(c, wy) < (theme.dark ? 0.3 : 0.12);
            v = on ? COLON : ch('.');
          } else if (tw.shade && lc > tw.w - 4 && (c + wy) % 2 === 0) v = ch('.');
          g.put(c, r, v);
        }
      }
    }
  }

  drawNeighbor(g, n, camY, t, limit) {
    const off = Math.floor(camY * SPEED.near);
    const top = n.top - off;
    if (top - 10 >= limit) return;
    const x0 = Math.max(n.x0, -1);
    const x1 = n.x1;
    const W = x1 - n.x0;
    // escalera de incendio: ocupa una franja sin ventanas
    const fire = n.fire && W >= 24 ? (n.side === 'L' ? x1 - 15 : n.x0 + 3) : null;
    const r0 = Math.max(0, top);
    for (let r = r0; r < limit; r++) {
      const wy = r + off;
      const lr = wy - n.top;
      for (let c = x0; c <= x1; c++) {
        if (c === x1 && n.side === 'L') {
          g.put(c, r, ch('|'));
          continue;
        }
        if (c === n.x0 && n.side === 'R') {
          g.put(c, r, ch('|'));
          continue;
        }
        // fachada punteada ": : :"
        let v = ((c + wy) & 1) === 0 ? COLON : SP;
        const lc = c - n.x0 - 2;
        const ix = ((lc % 8) + 8) % 8;
        const iy = (lr - 2) % 5;
        const inFire = fire !== null && c >= fire - 1 && c <= fire + 12;
        if (lr >= 2 && lc >= 0 && ix < 6 && iy < 4 && !inFire && Math.abs(c - x1) > 1 && c > n.x0 + 1) {
          const col = Math.floor(lc / 8);
          const row = Math.floor((lr - 2) / 5);
          const k = hash2(col + n.seed * 31, row);
          const lit = theme.dark && hash2(row + n.seed, col + Math.floor(t / 11 + k * 5)) < 0.4;
          if (iy === 0) v = ix === 0 || ix === 5 ? SP : ch('_');
          else if (iy === 3) v = ix === 0 || ix === 5 ? ch('|') : ch('_');
          else if (ix === 0 || ix === 5) v = ch('|');
          else {
            const tpl = WIN_IN[Math.floor(k * WIN_IN.length)];
            const cc = tpl[iy - 1][ix - 1];
            v = cc !== ' ' ? ch(cc) : lit ? COLON : SP;
          }
        }
        g.put(c, r, v);
      }
    }
    // cornisa
    if (top - 1 >= 0 && top - 1 < limit) g.hline(x0, x1, top - 1, ch('_'));
    if (top >= 0 && top < limit) g.hline(x0, x1, top, ch('/'));
    if (fire !== null) this.drawFire(g, fire, top, limit, n.side === 'L' ? 1 : -1);
    // letrero vertical con luces
    if (n.sign) {
      const sxp = n.side === 'L' ? x1 - 3 : n.x0 + (fire !== null ? 18 : 3);
      const syp = top + 4;
      for (let i = 0; i < n.sign.length; i++) {
        const r = syp + i;
        if (r < 0 || r >= limit) continue;
        g.put(sxp - 1, r, ch('|'));
        g.put(sxp, r, ch(n.sign[i]));
        g.put(sxp + 1, r, ch('|'));
      }
      const on = blink(t, 0.9, n.seed);
      if (syp - 1 >= 0 && syp - 1 < limit) g.text(sxp - 1, syp - 1, on ? '*¯*' : '.¯.');
      if (syp + n.sign.length < limit) g.text(sxp - 1, syp + n.sign.length, on ? '*_*' : '._.');
    }
    // terraza: tanque o cartel
    if (n.bill && W > 22 && top - 1 < limit) g.blit(BILLBOARD, n.side === 'L' ? x1 - 20 : n.x0 + 4, top - BILLBOARD.h);
    if (n.tank && top - 1 < limit) g.blit(roof.tank, n.side === 'L' ? Math.max(1, x1 - 12) : n.x0 + 4, top - 9);
  }

  // escalera de incendio en zigzag con descansos (rayado \_\_)
  drawFire(g, fx, top, limit, dir) {
    for (let k = 0; k < 14; k++) {
      const fy = top + 3 + k * 5;
      if (fy >= limit) break;
      if (fy + 5 < 0) continue;
      const right = k % 2 === 0;
      for (let i = 0; i < 4; i++) {
        const r = fy + i + 1;
        if (r < 0 || r >= limit) continue;
        const xx = right ? fx + 1 + i * 2 : fx + 9 - i * 2;
        g.put(xx, r, right ? ch('\\') : ch('/'));
        g.put(xx + (right ? 1 : -1), r, ch('_'));
      }
      const pr = fy + 5;
      if (pr >= 0 && pr < limit) {
        g.hline(fx - 1, fx + 12, pr, ch('_'));
        for (const xx of [fx - 1, fx + 12]) if (pr - 1 >= 0) g.put(xx, pr - 1, ch('|'));
      }
    }
  }
}
