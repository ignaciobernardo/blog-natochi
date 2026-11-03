// Luces: ventanas, letreros de neón, vitrinas y faroles.
//
// Cada luz conoce sus celdas en la capa y decide en cada frame si está
// prendida. La capa guarda en `tag` el índice de la luz de cada celda: así
// los charcos saben si lo que reflejan brilla, y el parpadeo se ve también
// en el reflejo.
import { hash2 } from './rng.js';

export const LIT = 0x2592; //   ▒
export const DIM = 0x2591; //   ░
const DOT = 0xb7; //            ·

export class Lights {
  constructor(dark) {
    this.dark = dark;
    this.list = [null]; // el tag 0 es "sin luz"
    this.on = new Uint8Array(1);
  }

  add(light) {
    light.id = this.list.length;
    this.list.push(light);
    return light;
  }

  finish() {
    this.on = new Uint8Array(this.list.length);
  }

  update(t) {
    const { list, on } = this;
    for (let i = 1; i < list.length; i++) on[i] = list[i].state(t) ? 1 : 0;
  }

  // pinta las luces que caen dentro de la pantalla; cada luz pinta solo las
  // celdas de la capa que siguen siendo suyas (etiqueta)
  draw(scr, ox, oy, t) {
    const { list, on, grid } = this;
    const W = scr.w;
    const H = scr.h;
    for (let i = 1; i < list.length; i++) {
      const L = list[i];
      const r0 = L.y + oy;
      if (r0 > H || r0 + L.h < -2) continue;
      const c0 = L.x + ox;
      if (c0 > W + 2 || c0 + L.w < -2) continue;
      L.draw(scr, ox, oy, t, on[i], grid);
    }
  }
}

// --- ventanas --------------------------------------------------------------

// silueta opcional dentro de una ventana prendida (fila, texto)
const INSIDE = [
  null,
  null,
  null,
  [1, ' o '],
  [0, ' o '],
  [1, '/|\\'],
  [1, '\\|/'],
  [0, ' * '],
];

export class Window {
  constructor(x, y, w, h, seed, dark, opts = {}) {
    Object.assign(this, { x, y, w, h, seed });
    const r = hash2(seed, 7);
    // proporción de ventanas prendidas: de noche muchas, de día pocas
    this.pOn = dark ? 0.45 : 0.1;
    this.period = 7 + r * 25;
    this.phase = hash2(seed, 11) * 100;
    this.inside = w >= 3 && hash2(seed, 13) < 0.35 ? INSIDE[(hash2(seed, 17) * INSIDE.length) | 0] : null;
    // de día los vidrios son trama; de noche algunas apagadas quedan negras
    this.offCh = dark ? (hash2(seed, 19) < 0.5 ? DIM : 32) : hash2(seed, 19) < 0.75 ? DIM : 32;
    this.onCh = LIT;
    if (opts.on) this.onCh = opts.on;
    if (opts.off != null) this.offCh = opts.off;
    if (opts.inside === false) this.inside = null;
    this.mullion = opts.mullion ?? -1;
    // persiana a medio bajar (más de día)
    this.blind = h >= 2 && hash2(seed, 23) < (dark ? 0.1 : 0.3);
  }

  state(t) {
    const k = Math.floor((t + this.phase) / this.period);
    return hash2(this.seed, k) < this.pOn;
  }

  draw(scr, ox, oy, t, on, g) {
    const ch = on ? this.onCh : this.offCh;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (g && g.tag[(this.y + y) * g.w + this.x + x] !== this.id) continue;
        scr.put(this.x + ox + x, this.y + oy + y, x === this.mullion ? 124 : ch);
      }
    if (on && this.inside) {
      const [row, s] = this.inside;
      if (row < this.h) scr.ink(this.x + ox + ((this.w - 3) >> 1), this.y + oy + row, s);
    }
    if (this.blind && (!g || g.tag[this.y * g.w + this.x] === this.id))
      for (let x = 0; x < this.w; x++) scr.put(this.x + ox + x, this.y + oy, 61);
  }
}

// --- neón vertical -----------------------------------------------------------

// modos: fijo, parpadeo, letra muerta, recorrido (las letras se prenden de
// arriba hacia abajo y después destellan)
export class Neon {
  constructor(x, y, text, seed, dark, opts = {}) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.w = 1;
    this.h = text.length * (opts.step || 1);
    this.step = opts.step || 1;
    this.seed = seed;
    this.dark = dark;
    this.glow = opts.glow ?? 2; // columnas de halo a cada lado
    this.box = opts.box ?? 1;
    const r = hash2(seed, 3);
    this.mode = opts.mode || (r < 0.3 ? 'steady' : r < 0.55 ? 'flicker' : r < 0.8 ? 'dead' : 'chase');
    this.dead = Math.floor(hash2(seed, 5) * text.length);
    // de día casi todos apagados; alguno queda tenue
    this.dayOn = hash2(seed, 9) < 0.18;
  }

  letterOn(i, t) {
    if (!this.dark) return this.dayOn && hash2(this.seed + i, Math.floor(t * 3)) > 0.08;
    switch (this.mode) {
      case 'flicker': {
        const burst = hash2(this.seed, Math.floor(t / 1.7)) < 0.35;
        return !(burst && hash2(this.seed, Math.floor(t * 14)) < 0.55);
      }
      case 'dead':
        return i !== this.dead || hash2(this.seed, Math.floor(t * 11)) < 0.07;
      case 'chase': {
        const n = this.text.length;
        const k = Math.floor(t * 5) % (n + 6);
        if (k < n) return i <= k;
        return k % 2 === 0;
      }
      default:
        return true;
    }
  }

  state(t) {
    return this.letterOn(0, t) || this.letterOn(this.text.length - 1, t);
  }

  draw(scr, ox, oy, t, on, g) {
    const c = this.x + ox;
    let any = false;
    for (let i = 0; i < this.text.length; i++) {
      if (g && g.tag[(this.y + i * this.step) * g.w + this.x] !== this.id) continue;
      const r = this.y + oy + i * this.step;
      const lit = this.letterOn(i, t);
      any ||= lit;
      const ch = this.text.charCodeAt(i);
      if (this.dark) {
        scr.put(c, r, lit ? ch : ch === 32 ? 32 : DOT);
        // el tubo encendido llena la caja de resplandor ░
        const fill = lit ? DIM : 32;
        for (let k = 0; k < this.step; k++) {
          scr.put(c - 1, r + k, fill);
          scr.put(c + 1, r + k, fill);
          if (k) scr.put(c, r + k, fill);
        }
      } else scr.put(c, r, ch);
    }
    // halo: chispas que titilan en el margen de la caja mientras está prendido
    if (this.dark && any && this.glow) {
      const k = Math.floor(t * 4);
      for (let y = -2; y <= this.h + 1; y++) {
        const r = this.y + oy + y;
        for (const dx of [-3, 3]) {
          const h = hash2(this.seed + y * 3 + dx, k);
          if (h < 0.35) scr.put(c + dx, r, h < 0.12 ? 39 : h < 0.24 ? 46 : 0xb7);
        }
        if (y === -2 || y === this.h + 1)
          for (let dx = -2; dx <= 2; dx++) if (hash2(this.seed + dx, k + y) < 0.3) scr.put(c + dx, r, 46);
      }
    }
  }
}

// --- letrero horizontal de neón (sobre vitrinas y en techos) ---------------------
export class NeonRow {
  constructor(x, y, text, seed, dark, opts = {}) {
    Object.assign(this, { x, y, text, seed, dark });
    this.w = text.length;
    this.h = 1;
    this.blink = opts.blink || false;
    this.steady = opts.steady || false;
    this.dayOn = hash2(seed, 9) < 0.2;
    this.dead = hash2(seed, 4) < 0.5 ? Math.floor(hash2(seed, 6) * text.length) : -1;
  }

  state(t) {
    if (!this.dark) return this.dayOn;
    if (this.blink) return Math.floor(t * 1.4) % 2 === 0;
    if (this.steady) return hash2(this.seed, Math.floor(t * 9)) > 0.03;
    return hash2(this.seed, Math.floor(t / 2.3)) > 0.12 || hash2(this.seed, Math.floor(t * 12)) > 0.5;
  }

  draw(scr, ox, oy, t, on, g) {
    const c = this.x + ox;
    const r = this.y + oy;
    for (let i = 0; i < this.text.length; i++) {
      const ch = this.text.charCodeAt(i);
      if (ch === 32) continue;
      if (g && g.tag[this.y * g.w + this.x + i] !== this.id) continue;
      let lit = on;
      if (i === this.dead && this.dark) lit = lit && hash2(this.seed + i, Math.floor(t * 9)) < 0.15;
      scr.put(c + i, r, !this.dark || lit ? ch : DOT);
    }
  }
}

// vitrina iluminada (interior de un local)
export class Shop {
  constructor(x, y, w, h, seed, dark, goods) {
    Object.assign(this, { x, y, w, h, seed, dark, goods });
  }

  state(t) {
    return this.dark ? hash2(this.seed, Math.floor(t / 9)) > 0.1 : hash2(this.seed, 2) < 0.5;
  }

  draw(scr, ox, oy, t, on, grid) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (grid && grid.tag[(this.y + y) * grid.w + this.x + x] !== this.id) continue;
        const g = this.goods[y]?.charCodeAt(x) || 32;
        scr.put(this.x + ox + x, this.y + oy + y, g !== 32 ? g : on ? (this.dark ? LIT : DIM) : 32);
      }
  }
}

// farol de papel: titila un poco, el halo cambia
export class Lantern {
  constructor(x, y, seed, dark) {
    Object.assign(this, { x, y, seed, dark, w: 3, h: 3 });
  }

  state() {
    return true;
  }

  draw(scr, ox, oy, t) {
    const c = this.x + ox;
    const r = this.y + oy;
    scr.text(c, r, '.-.');
    scr.text(c, r + 1, hash2(this.seed, Math.floor(t * 6)) < 0.85 ? '(=)' : '(-)');
    scr.text(c, r + 2, "'-'");
    if (this.dark) {
      const k = Math.floor(t * 3);
      const sp = ['·', "'", '.', '·'];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + k * 0.3;
        if (hash2(this.seed + i, k) < 0.45) continue;
        scr.put(c + 1 + Math.round(Math.cos(a) * 3), r + 1 + Math.round(Math.sin(a) * 1.4), sp[i & 3]);
      }
    }
  }
}
