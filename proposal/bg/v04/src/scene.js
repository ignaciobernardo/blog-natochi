// "Neón y lluvia": la grúa baja desde los carteles y tanques de los techos
// hasta la calle mojada.
//
// Capas, de atrás hacia adelante (f = cuánto se mueve con la grúa):
//   cielo 0.12 · ciudad lejana 0.3 · ciudad media 0.6 · la cuadra 1
//   · primer plano 1.35 (poste, cables, palomas, farol)
// La lluvia va en tres planos (0.4, 1, 1.6) intercalados entre las capas.
import { SP, bayer, clamp, flipX } from './grid.js';
import { Rng, hash2 } from './rng.js';
import * as A from './art.js';
import { LIT, DIM } from './lights.js';
import { layout, buildStreet } from './street.js';
import { buildSkyline, buildSky } from './skyline.js';
import { buildFore } from './fore.js';

const STIPPLE = [58, 39, 46, 58]; // : ' . :

export class StreetScene {
  constructor(scr, { title = 'NATOCHI', seed = 4, dark = true } = {}) {
    this.scr = scr;
    this.rd = scr; // las herramientas leen rd.cols / rd.rows
    this.title = title;
    this.seed = seed;
    this.dark = dark;
    this.t = 0;
    this.p = 0;
    this.look = [0, 0];
    this.show = { sky: true, far: true, mid: true, street: true, life: true, fore: true, rain: true, title: true };
    this.resize();
  }

  resize() {
    const { scr, dark, seed } = this;
    const L = (this.L = layout(scr.cols, scr.rows));
    this.sky = buildSky(L, dark, seed + 1);
    this.far = buildSkyline(L, dark, seed + 2, { f: 0.3, anchor: 0.5, lo: 0.12, hi: 0.36, detail: false });
    this.mid = buildSkyline(L, dark, seed + 3, { f: 0.6, anchor: 0.3, lo: 0.26, hi: 0.52, detail: true });
    this.st = buildStreet(L, dark, seed + 4);
    this.fore = buildFore(L, dark, seed + 5);
    this.spawnLife();
  }

  // --- actores ---------------------------------------------------------------
  spawnLife() {
    const { st, L, dark } = this;
    const rng = new Rng(this.seed * 7 + 1);
    const W = st.W;
    // autos: carril de allá (hacia la izquierda) y de acá (hacia la derecha)
    const mid = st.yR + (L.RD >> 1);
    this.lanes = [
      { y: mid - 1, dir: -1, speed: [7, 11] },
      { y: st.yN - 2, dir: 1, speed: [9, 15] },
    ];
    this.cars = [];
    for (const [li, lane] of this.lanes.entries()) {
      let x = rng.int(-10, 20);
      while (x < W) {
        this.cars.push(this.newCar(rng, li, x));
        x += rng.int(45, 90);
      }
    }
    // gente: de día salen más paraguas
    this.people = [];
    const tracks = [st.G + 2, st.yN + 4, st.yN + 6, Math.min(st.H - 2, st.yN + 9)];
    const n = Math.round((W / (dark ? 14 : 8)) * (L.R > 55 ? 1.2 : 1));
    for (let i = 0; i < n; i++) {
      const track = tracks[i % tracks.length];
      if (track >= st.H - 1) continue;
      const dir = rng.chance(0.5) ? 1 : -1;
      const roll = rng.next();
      const kind = roll < (dark ? 0.72 : 0.9) ? 'umb' : roll < 0.93 ? 'paper' : 'run';
      this.people.push({
        x: rng.range(0, W),
        y: track,
        dir,
        kind,
        canopy: rng.int(0, A.WALKERS.length - 1),
        speed: kind === 'run' ? rng.range(5, 7) : rng.range(1.6, 3.2),
        phase: rng.range(0, 10),
      });
    }
    // alguien comiendo en el puesto y alguien esperando el semáforo
    if (st.stand) this.people.push({ x: st.stand.x + 4, y: st.G + 2, dir: 0, kind: 'stand' });
    this.people.push({ x: st.crossing.x - 9, y: st.G + 2, dir: 0, kind: 'stand' });
    this.people.sort((a, b) => a.y - b.y);

    // palomas en los cables del primer plano
    this.pigeons = [];
    const spots = this.fore.pigeonSpots;
    const np = Math.min(spots.length, Math.round(L.C / 9));
    for (let i = 0; i < np; i++) {
      const s = spots[Math.floor(rng.next() * spots.length)];
      this.pigeons.push({ s, state: 0, t0: rng.range(2, 30), fx: 0, fy: 0, left: rng.chance(0.5) });
    }
    // lluvia: tres planos
    const area = L.C * L.R;
    this.rain = [0.4, 1, 1.6].map((f, k) => {
      const n = Math.round(area / [120, 110, 300][k]);
      const d = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        d[i * 3] = rng.range(0, L.C + 20);
        d[i * 3 + 1] = rng.range(0, L.R + 8);
        d[i * 3 + 2] = rng.range(0.8, 1.2);
      }
      return { f, d, n, speed: [14, 24, 38][k] };
    });
    this.splashes = [];
    this.puffs = [];
    this.wind = 0.7;
  }

  newCar(rng, li, x) {
    const lane = this.lanes[li];
    const roll = rng.next();
    const base = roll < 0.55 ? A.TAXI : roll < 0.82 ? A.CAR : A.BUS;
    const spr = lane.dir > 0 ? base : flipCache(base);
    // dónde está el faro
    let hx = -1;
    let hy = -1;
    for (let i = 0; i < spr.d.length; i++)
      if (spr.d[i] === 176) {
        hx = i % spr.w;
        hy = (i / spr.w) | 0;
      }
    return { li, x, spr, hx, hy, speed: rng.range(lane.speed[0], lane.speed[1]) * (base === A.BUS ? 0.75 : 1) };
  }

  // --- frame -------------------------------------------------------------------
  frame(input) {
    const { scr, L, st, dark } = this;
    const dt = Math.min(input.dt, 0.1);
    const moving = !input.reduced;
    if (moving) this.t += dt;
    const t = this.t;
    const ease = 1 - Math.exp(-dt * 5);
    this.p += (clamp(input.progress, 0, 1) - this.p) * ease;
    this.look[0] += (input.look[0] - this.look[0]) * ease * 0.5;
    // la grúa llega abajo un poco antes del final: el último tramo es la calle quieta
    // mientras sube el contenido con la disolución
    const k = clamp(this.p / 0.88, 0, 1);
    const cy = (k * k * (3 - 2 * k) * 0.35 + k * 0.65) * L.T;
    this.cy = cy;
    const lx = this.look[0];
    const s = this.show;

    if (moving) this.update(dt, t);

    scr.clear();
    // cielo
    if (s.sky) scr.blit(this.sky.grid, -this.sky.M - Math.round(lx * 1), Math.round(-2 - cy * this.sky.f));
    // ciudad lejana
    for (const [key, layer] of [['far', this.far], ['mid', this.mid]]) {
      if (key === 'mid' && s.rain) this.drawRain(0, cy);
      if (!s[key]) continue;
      const ox = -layer.M - Math.round(lx * 3 * layer.f);
      const oy = Math.round(layer.groundRow - layer.G + (L.T - cy) * layer.f);
      scr.blit(layer.grid, ox, oy);
      layer.lights.update(t);
      layer.lights.draw(scr, ox, oy, t);
      this.drawBlinkers(layer.blinkers, ox, oy, t);
    }
    // la cuadra
    const ox = -st.M - Math.round(lx * 3);
    const oy = Math.round(L.gR - st.G + (L.T - cy));
    this.ox = ox;
    this.oy = oy;
    if (s.street) {
      scr.blit(st.grid, ox, oy);
      st.lights.update(t);
      st.lights.draw(scr, ox, oy, t);
      this.drawBlinkers(st.blinkers, ox, oy, t);
      this.drawSignals(ox, oy, t);
      this.drawPuddles(ox, oy, t);
      if (dark) this.drawLampLight(st.lamps, ox, oy, t);
      this.drawDrips(ox, oy, t);
    }
    if (s.life) this.drawLife(ox, oy, t);
    if (s.rain) this.drawRain(1, cy);
    // primer plano
    if (s.fore) {
      const F = this.fore;
      const fx = -F.M - Math.round(lx * 3 * F.f);
      const fy = Math.round(-F.top + (L.T - cy) * F.f);
      scr.blit(F.grid, fx, fy);
      this.drawPigeons(fx, fy, t);
      if (dark && F.lamp) this.drawLampLight([{ x: F.lamp.x, y: F.lamp.y - 1, kind: 'street', reach: 12 }], fx, fy, t);
    }
    if (s.rain) this.drawRain(2, cy);
    if (s.title) this.drawTitle();
    if (input.progress < 0.02) this.drawHint(1 - input.progress / 0.02);
    if (input.contentTop != null) this.drawDissolve(input.contentTop / scr.cellH);
    scr.flush();
  }

  // --- simulación --------------------------------------------------------------
  update(dt, t) {
    const { st, L } = this;
    // viento con ráfagas: la lluvia se inclina más o menos
    this.wind = 0.55 + 0.25 * Math.sin(t * 0.21) + 0.2 * Math.max(0, Math.sin(t * 0.9 + Math.sin(t * 0.37) * 3));
    const W = st.W;
    for (const car of this.cars) {
      const lane = this.lanes[car.li];
      car.x += lane.dir * car.speed * dt;
      if (lane.dir > 0 && car.x > W + 4) Object.assign(car, this.newCar(new Rng((t * 1000) | 0), car.li, -car.spr.w - 30 - ((t * 37) % 40)));
      if (lane.dir < 0 && car.x < -car.spr.w - 4) Object.assign(car, this.newCar(new Rng((t * 1000) | 0), car.li, W + 30 + ((t * 53) % 40)));
    }
    for (const p of this.people) {
      if (!p.dir) continue;
      p.x += p.dir * p.speed * dt;
      if (p.x > W + 6) p.x = -8;
      if (p.x < -8) p.x = W + 6;
    }
    // lluvia
    for (const layer of this.rain) {
      const { d, n, speed } = layer;
      const H = L.R + 8;
      const Wd = L.C + 20;
      for (let i = 0; i < n; i++) {
        const v = speed * d[i * 3 + 2] * dt;
        d[i * 3 + 1] += v;
        d[i * 3] -= v * this.wind;
        if (d[i * 3 + 1] > H) d[i * 3 + 1] -= H;
        if (d[i * 3] < 0) d[i * 3] += Wd;
      }
    }
    // salpicaduras en el suelo visible (coordenadas de la cuadra)
    const g0 = Math.max(st.G, -this.oy);
    const g1 = Math.min(st.H, L.R - this.oy);
    if (g1 > g0) {
      const rate = (L.C * (g1 - g0)) / 30;
      let k = rate * dt;
      while (k > 0) {
        if (k < 1 && Math.random() > k) break;
        k -= 1;
        this.splashes.push({ x: Math.floor(Math.random() * L.C) - this.ox, y: g0 + Math.floor(Math.random() * (g1 - g0)), t0: t });
      }
    }
    this.splashes = this.splashes.filter((s) => t - s.t0 < 0.45);
    // vapor
    for (const e of st.steam) {
      const rate = 3.2 * (e.power || 1);
      if (Math.random() < rate * dt) this.puffs.push({ x: e.x + Math.random() * 2 - 1, y: e.y, t0: t, life: 1.8 + Math.random() * 1.4, w: Math.random() });
    }
    for (const p of this.puffs) {
      p.y -= dt * 2.4;
      p.x -= dt * (this.wind * 1.6 + Math.sin(t * 2 + p.w * 6) * 0.8);
    }
    this.puffs = this.puffs.filter((p) => t - p.t0 < p.life);
    // palomas: a veces se espantan, vuelan y vuelven
    for (const pg of this.pigeons) {
      if (pg.state === 0 && t > pg.t0) {
        pg.state = 1;
        pg.t0 = t;
        pg.vx = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 6);
      } else if (pg.state === 1 && t - pg.t0 > 2.5 + (pg.s.k % 3)) {
        pg.state = 0;
        pg.t0 = t + 6 + Math.random() * 30;
      }
    }
  }

  // --- dibujo --------------------------------------------------------------------
  drawRain(k, cy) {
    const { scr, L } = this;
    const layer = this.rain[k];
    const { d, n, f } = layer;
    const H = L.R + 8;
    const shift = (L.T - cy) * f;
    const steep = this.wind < 0.35;
    const far = k === 0;
    const near = k === 2;
    for (let i = 0; i < n; i++) {
      let r = (d[i * 3 + 1] + shift) % H;
      if (r < 0) r += H;
      r = Math.floor(r) - 4;
      const c = Math.floor(d[i * 3]) - 10;
      // lejos: puntos; al medio: ticks ' ; cerca: trazos / (o | sin viento)
      if (far) scr.put(c, r, i & 1 ? 46 : 39);
      else if (near) scr.put(c, r, steep ? 124 : 47);
      else scr.put(c, r, steep ? 58 : 39);
    }
  }

  drawTitle() {
    const { scr } = this;
    const w = this.title.length;
    const r = Math.floor(scr.rows / 2);
    const c = Math.floor(scr.cols / 2 - w / 2);
    scr.text(c - 1, r, ' ' + this.title + ' ');
  }

  drawHint(alpha) {
    const { scr } = this;
    if (alpha < 0.3) return;
    const text = ' desliza ';
    const r = scr.rows - 4;
    const c = Math.floor(scr.cols / 2 - text.length / 2);
    const bob = Math.floor(this.t * 2) % 2;
    scr.text(c, r, text);
    scr.fill(Math.floor(scr.cols / 2) - 1, r + 1, 3, 2, ' ');
    scr.put(Math.floor(scr.cols / 2), r + 1 + bob, '↓');
  }

  drawDissolve(contentRow) {
    const { scr } = this;
    const G = Math.max(8, Math.round(scr.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < scr.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < scr.cols; c++) if (amount >= 1 || bayer(c, r) < amount) scr.put(c, r, SP);
    }
  }

  drawBlinkers(list, ox, oy, t) {
    const { scr, dark } = this;
    for (const b of list) {
      const on = dark ? Math.floor(t * 1.2 + (b.seed % 7) * 0.3) % 2 === 0 : false;
      scr.put(b.x + ox, b.y + oy, on ? 42 : 46);
    }
  }

  drawSignals(ox, oy, t) {
    const { scr } = this;
    for (const s of this.st.signals) {
      const k = t % 14;
      const light = k < 6 ? 2 : k < 8 ? 1 : 0; // 0 rojo arriba, 1 amarillo, 2 verde
      for (let i = 0; i < 3; i++) scr.put(s.x + ox, s.y + oy + i, i === light ? 0x25cf : 46);
    }
  }

  // charcos: espejo de la fachada respecto del pie de los edificios, punteado,
  // con un temblor que cambia con el tiempo; lo que brilla se ve con ':'
  drawPuddles(ox, oy, t) {
    const { scr, st, dark } = this;
    const g = st.grid;
    const tags = g.tag;
    const on = st.lights.on;
    const G = st.G;
    const R = scr.rows;
    const Wc = scr.cols;
    for (const p of st.puddles) {
      if (p.bot + oy < 0 || p.top + oy >= R) continue;
      const cells = p.cells;
      for (let i = 0; i < cells.length; i += 2) {
        const c = cells[i];
        const r = cells[i + 1];
        const sc = c + ox;
        const sr = r + oy;
        if (sc < 0 || sc >= Wc || sr < 0 || sr >= R) continue;
        const depth = r - G + 1;
        const wob = Math.round(Math.sin(t * 1.8 + r * 1.7 + c * 0.21) * 0.8);
        const srcR = G - 1 - Math.round(depth * 1.25);
        const srcC = c + wob;
        let ch = SP;
        if (srcR >= 0 && srcC >= 0 && srcC < g.w) {
          const idx = srcR * g.w + srcC;
          const tag = tags[idx];
          const k = g.ch[idx];
          if (tag && on[tag]) {
            // luz: punteado; las letras de neón quedan como ':' fuertes y las
            // ventanas como ticks; titila con la lluvia que cae en el charco
            const letter = k === SP && st.lights.list[tag].text;
            if (hash2(c * 3 + Math.floor(t * 6), r) < 0.85) ch = letter || (k !== SP && k !== LIT && k !== DIM) ? 58 : STIPPLE[(c + r) & 3];
          } else if (k && k !== SP) {
            ch = -1; // lo oscuro de la fachada queda como hueco en el agua
          }
        }
        // agua: rayado horizontal denso (como el agua de la referencia) que se
        // corre con el viento; los huecos son el reflejo de la fachada
        if (ch === SP) ch = (c + 3 * r + Math.floor(t * 2)) % 6 === 0 ? SP : dark ? 45 : 61;
        else if (ch === -1) ch = bayer(c, r) < 0.2 ? 46 : SP;
        scr.ch[sr * Wc + sc] = ch;
      }
    }
  }

  // conos de luz de faroles: solo sobre celdas vacías
  drawLampLight(list, ox, oy, t) {
    const { scr } = this;
    for (const l of list) {
      const reach = l.reach || 8;
      for (let i = 1; i <= reach; i++) {
        const hw = Math.round(i * (l.kind === 'board' ? 0.5 : 0.75));
        const r = l.y + oy + i;
        if (r < 0 || r >= scr.rows) continue;
        for (let dx = -hw; dx <= hw; dx++) {
          const c = l.x + ox + dx;
          if (c < 0 || c >= scr.cols) continue;
          const idx = r * scr.cols + c;
          if (scr.ch[idx] !== SP) continue;
          const h = hash2(l.x * 31 + dx, i + Math.floor(t * 1.5) * (l.kind === 'street' ? 0 : 1));
          if (h < 0.22 + (1 - i / reach) * 0.2) scr.ch[idx] = Math.abs(dx) === hw ? (dx < 0 ? 47 : 92) : 46;
        }
      }
    }
  }

  drawDrips(ox, oy, t) {
    const { scr } = this;
    for (const d of this.st.drips) {
      const per = 1.2 + (d.seed % 7) * 0.3;
      const ph = ((t + (d.seed % 13) * 0.17) % per) / per;
      const fall = Math.floor(ph * 9);
      if (fall < 7) scr.put(d.x + ox, d.y + oy + fall, fall === 0 ? 46 : 44);
    }
  }

  drawLife(ox, oy, t) {
    const { scr, st, dark } = this;
    const R = scr.rows;
    // gente de la vereda de enfrente (detrás de los autos)
    const far = this.people.filter((p) => p.y < st.yR);
    const near = this.people.filter((p) => p.y >= st.yR);
    for (const p of far) this.drawPerson(p, ox, oy, t);
    // autos con focos y reflejo en el asfalto
    for (const li of [0, 1]) {
      for (const car of this.cars) {
        if (car.li !== li) continue;
        const lane = this.lanes[li];
        const cx = Math.round(car.x) + ox;
        const top = lane.y - car.spr.h + 1 + oy;
        if (cx > scr.cols + 2 || cx + car.spr.w < -30 || top > R || top + car.spr.h < -2) continue;
        // reflejo: filas de abajo espejadas y punteadas
        for (let k = 1; k <= 2; k++) {
          const rr = lane.y + oy + k;
          if (rr < 0 || rr >= R || lane.y + k >= st.yN) continue;
          const srow = car.spr.h - 1 - k;
          for (let x = 0; x < car.spr.w; x++) {
            const ch = car.spr.d[srow * car.spr.w + x];
            if (ch && ch !== SP && (x + k) % 2 === 0) scr.put(cx + x, rr, k === 1 ? 58 : 46);
          }
        }
        scr.spr(car.spr, cx, top);
        if (car.hx >= 0) this.drawBeam(cx + car.hx, top + car.hy, lane.dir, lane.y + oy);
      }
    }
    // vapor de alcantarillas y del puesto
    for (const p of this.puffs) {
      const a = (t - p.t0) / p.life;
      const c = Math.round(p.x) + ox;
      const r = Math.round(p.y) + oy;
      // bocanada: ~~ al salir, después se abre en ( ) y se deshace en ticks
      if (a < 0.35) {
        scr.put(c, r, 126);
        scr.put(c + 1, r, 126);
      } else if (a < 0.7) {
        const sway = Math.sin(t * 3 + p.w * 9) > 0;
        scr.put(c, r, sway ? 40 : 41);
        scr.put(c + 2, r, 126);
      } else scr.put(c, r, a < 0.85 ? 126 : 39);
    }
    for (const p of near) this.drawPerson(p, ox, oy, t);
    // salpicaduras
    for (const s of this.splashes) {
      const a = (t - s.t0) / 0.45;
      const c = s.x + ox;
      const r = s.y + oy;
      if (r < 0 || r >= R) continue;
      const under = scr.ch[r * scr.cols + c];
      if (under !== SP && under !== 126 && under !== 46) continue;
      if (a < 0.33) scr.put(c, r, 46);
      else if (a < 0.66) {
        scr.put(c - 1, r, 96);
        scr.put(c, r, 46);
        scr.put(c + 1, r, 39);
      } else {
        scr.put(c - 1, r, 46);
        scr.put(c + 1, r, 46);
      }
    }
    // farol de papel del puesto
    if (st.stand) {
      const ln = st.stand.lantern;
      ln.draw(scr, ox, oy, t);
    }
  }

  drawBeam(hx, hy, dir, roadRow) {
    const { scr, dark } = this;
    if (!dark) return;
    const main = '==--- -- -  -   -';
    const glare = ' .:.:. .  .   .';
    for (let i = 0; i < main.length; i++) {
      const c = hx + dir * (i + 1);
      if (main[i] !== ' ') scr.put(c, hy, main.charCodeAt(i));
      if (glare[i] && glare[i] !== ' ') scr.put(c + dir, hy + 1, glare.charCodeAt(i));
    }
    // reflejo largo del foco en el asfalto mojado
    for (let i = 2; i < 12; i += 2) scr.put(hx + dir * (i + 2), roadRow + 1 + (i > 6 ? 1 : 0), 46);
  }

  drawPerson(p, ox, oy, t) {
    const { scr } = this;
    let s;
    if (p.kind === 'stand') s = A.STANDER;
    else {
      const fr = Math.floor(p.x * 0.8 + p.phase) & 3;
      if (p.kind === 'umb') s = (p.dir > 0 ? A.WALKERS : A.WALKERS_L)[p.canopy][fr];
      else if (p.kind === 'paper') s = (p.dir > 0 ? A.PAPER : A.PAPER_L)[fr & 1];
      else s = (p.dir > 0 ? A.RUNNER : A.RUNNER_L)[fr & 1];
    }
    scr.spr(s, Math.round(p.x) + ox, p.y - s.h + 1 + oy);
  }

  drawPigeons(fx, fy, t) {
    const { scr } = this;
    const F = this.fore;
    for (const pg of this.pigeons) {
      const pts = F.cables[pg.s.cable];
      const [c, y] = pts[pg.s.k];
      const row = Math.floor(y);
      const sitRow = y - row > 0.6 ? row : row - 1;
      if (pg.state === 0) {
        const hop = Math.floor(t * 0.7 + pg.s.k) % 9 === 0;
        scr.spr(hop !== pg.left ? A.PIGEON_L : A.PIGEON, c - 1 + fx, sitRow + fy);
      } else {
        const a = t - pg.t0;
        const dur = 2.5 + (pg.s.k % 3);
        // sube, da una vuelta y baja al mismo lugar
        const u = a / dur;
        const px = c + Math.sin(u * Math.PI * 2) * pg.vx * 0.9;
        const py = sitRow - Math.sin(u * Math.PI) * 7;
        scr.put(Math.round(px) + fx, Math.round(py) + fy, Math.floor(t * 8) % 2 ? 118 : 94);
      }
    }
  }
}

const flips = new Map();
function flipCache(s) {
  if (!flips.has(s)) flips.set(s, flipX(s));
  return flips.get(s);
}
