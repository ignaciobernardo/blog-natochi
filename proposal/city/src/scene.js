// La escena: viaje en metro elevado. El scroll mueve el tren; la ciudad se
// desliza de costado con parallax fuerte entre capas.
//
//   cielo y cordillera   casi quietos
//   skyline              f 0.1
//   ciudad lejana        f 0.25
//   ciudad media         f 0.5   calle con autos chicos
//   edificios cercanos   f 1     a la altura del viaducto, con interiores
//   calle de abajo       f 1.2   autos y gente
//   andén (estaciones)   f 1.8
//   postes y baranda     f 2.6   pasan rápido
//
// Todas las capas escalan alrededor del centro de la pantalla, que es el punto
// de fuga: ahí está el título, y hacia ahí convergen las caras laterales de
// los edificios, las calles que cruzan y el río.
//
// v11: los edificios cercanos se pueden tocar. Al pasar el mouse se marca la
// puerta o la ventana; al hacer click la cámara entra por ese vano con un zoom
// (zoom.js) y aparece el interior (rooms/). Adentro, esc, el botón o el scroll
// vuelven al tren.
import { SP, bayer, clamp, mirror, cc, Grid } from './grid.js';
import { composeZoom } from './zoom.js';
import { makeInterior } from './rooms/index.js';
import { Route, L, M, RIVER, STATIONS, crossStreets } from './world.js';
import { buildNear, NBASE, SHOPS } from './near.js';
import { buildPatio, buildMid, buildMidFar, buildFar, buildMountains } from './layers.js';
import { buildStation, drawStationDyn, STATION_F } from './station.js';
import { interior, interiorKey, GLOW } from './interiors.js';
import { Traffic } from './traffic.js';
import { Sky } from './sky.js';
import { Foreground } from './fg.js';
import { Rng, hash2 } from './rng.js';

const UND = 95;
const GLOWC = 0x2591; // ░

export class CityScene {
  constructor(rd, { title = 'NATOCHI', seed = 7, night = false } = {}) {
    this.rd = rd;
    this.title = title;
    this.night = night;
    this.t = 0;
    this.p = 0;
    this.camX = 0;
    this.route = new Route();
    this.streets = crossStreets(seed);
    this.near = buildNear(this.streets, seed + 4);
    this.mid = buildMid(this.streets, seed + 14);
    this.patio = buildPatio(this.streets, seed + 74);
    this.midfar = buildMidFar(this.streets, seed + 24);
    this.far = buildFar(seed + 34);
    this.mountains = buildMountains(seed + 44);
    this.station = buildStation();
    this.traffic = new Traffic(new Rng(seed + 54), this);
    this.sky = new Sky(new Rng(seed + 64));
    this.fg = new Foreground();
    this.show = { sky: true, far: true, mid: true, near: true, street: true, station: true, fg: true, title: true };
    // lugares: calle | entrando | adentro | saliendo
    this.mode = 'calle';
    this.hover = null;
    this.tr = null;
    this.onMode = null;
    this.resize();
  }

  resize() {
    const { rd } = this;
    this.cx = Math.floor(rd.cols / 2);
    this.E = Math.floor(rd.rows / 2);
    this.S = this.E + 16;
    this.src = new Grid(rd.cols, rd.rows, SP);
    this.ins = new Grid(rd.cols, rd.rows, SP);
    this.nearSnap = new Uint16Array(rd.cols * rd.rows);
    this.finalSnap = new Uint16Array(rd.cols * rd.rows);
    this.hover = null;
    // si se cambia el tamaño estando adentro, el cuarto se rearma a la medida
    if (this.tr && this.mode === 'adentro') this.tr.interior = makeInterior(this.tr.place, this.tr.target, rd.cols, rd.rows, this.night);
    else if (this.tr) this.finish();
  }

  // input: { progress, dt, contentTop (px) | null, reduced }
  frame(input) {
    const { rd } = this;
    const dt = clamp(input.dt || 0, 0, 0.1);
    if (!input.reduced) this.t += dt;
    const t = this.t;
    if (this.mode === 'adentro') {
      this.tr.interior.draw(rd, t);
      if (this.show.title) this.drawTitle();
      this.drawInsideUI();
      rd.flush();
      return;
    }
    if (this.mode === 'calle') {
      const ease = 1 - Math.exp(-dt * 5);
      this.p += (clamp(input.progress, -0.05, 1) - this.p) * (input.dt ? ease : 1);
      this.camX = this.route.camAt(this.p);
    }
    this.drawStreet(input, t);
    if (this.mode === 'calle') {
      this.finalSnap.set(rd.data);
      this.drawHover(t);
      rd.flush();
      return;
    }
    // transición: la calle como fuente, el interior detrás del vano
    const tr = this.tr;
    tr.k = clamp(tr.k + (this.mode === 'entrando' ? 1 : -1) * (dt / tr.dur), 0, 1);
    this.src.data.set(rd.data);
    tr.interior.draw(this.ins, t);
    composeZoom(rd, this.src, this.ins, tr.hole, tr.k, t);
    if (this.show.title) this.drawTitle();
    rd.flush();
    if (this.mode === 'entrando' && tr.k >= 1) this.setMode('adentro');
    else if (this.mode === 'saliendo' && tr.k <= 0) this.finish();
  }

  drawStreet(input, t) {
    const { rd } = this;
    const s = this.show;
    rd.clear();
    if (s.sky) this.sky.draw(this, t);
    if (s.far) {
      this.layer(this.mountains, this.E + 1);
      if (s.sky) this.sky.drawClouds(this, t);
      this.drawFar(t);
      this.drawGround(t);
      this.drawMidFar(t);
    }
    if (s.mid) {
      this.drawMid(t);
      this.layer(this.patio, this.E + 12);
    }
    if (s.near) {
      this.drawNear(t);
      this.nearSnap.set(rd.data);
    }
    if (s.street) this.traffic.draw(this, t);
    if (s.station) this.drawStation(t);
    if (s.fg) this.fg.draw(this, t);
    if (s.street) this.traffic.drawTrain(this, t);
    if (this.mode !== 'calle') return;
    if (s.title) this.drawTitle();
    if (input.contentTop != null) this.drawDissolve(input.contentTop / rd.cellH);
  }

  // --- lugares -----------------------------------------------------------------

  setMode(mode) {
    this.mode = mode;
    if (this.onMode) this.onMode(mode);
  }

  // ¿Qué lugar hay en la celda (c, r) de la pantalla? Sólo cuenta si lo que se
  // ve ahí es la capa cercana (no un poste, el andén, el tren o el título).
  pickAt(c, r) {
    const { rd } = this;
    c = Math.floor(c);
    r = Math.floor(r);
    if (this.mode !== 'calle' || !this.nearInfo || c < 0 || r < 0 || c >= rd.cols || r >= rd.rows) return null;
    const i = r * rd.cols + c;
    if (this.finalSnap[i] !== this.nearSnap[i]) return null;
    const { off, y0 } = this.nearInfo;
    const lx = c + off;
    const ly = r - y0;
    const places = this.near.places;
    let pl = null;
    for (const p of places) {
      if (p.x0 > lx) break;
      if (lx <= p.x1 && ly >= p.top - 1 && ly <= p.bottom + 1) pl = p;
    }
    if (!pl) return null;
    // planta baja (o un hito): la puerta; más arriba, la ventana más cercana
    let target = { type: 'puerta', hole: pl.door };
    if (pl.windows.length && ly < NBASE - 6) {
      let best = null;
      let bd = Infinity;
      for (const w of pl.windows) {
        const d = Math.abs(w.y + 1 - ly) * 3 + Math.abs(w.x + w.w / 2 - lx);
        if (d < bd) {
          bd = d;
          best = w;
        }
      }
      if (best) target = { type: 'ventana', win: best, hole: { x0: best.x - 0.5, x1: best.x + best.w + 0.5, y0: best.y, y1: best.y + 2 } };
    }
    return { place: pl, target, off, y0 };
  }

  setHover(c, r) {
    this.hover = c == null ? null : this.pickAt(c, r);
    return this.hover;
  }

  enter(pick) {
    if (!pick || this.mode !== 'calle') return false;
    const { rd } = this;
    const { place, target, off, y0 } = pick;
    const hole = { x0: target.hole.x0 - off, x1: target.hole.x1 - off, y0: target.hole.y0 + y0, y1: target.hole.y1 + y0 };
    // lo que se veía en la ventana en ese momento
    if (target.win) target.key = interiorKey(target.win, this.t, this.night);
    this.tr = { place, target, hole, k: 0, dur: 1.35, interior: makeInterior(place, target, rd.cols, rd.rows, this.night) };
    this.hover = null;
    this.setMode('entrando');
    return true;
  }

  // Para herramientas y pruebas: abrir un interior sin pasar por la calle.
  //   spec = { kind: 'local'|'casa'|'oficina'|'cine'|'iglesia'|'mercado'|'obra',
  //            shop: 'PANADERÍA', key: 'gato', floor: 3, zone: 'barrio', seed: 5 }
  openInterior(spec = {}) {
    const { rd } = this;
    const seed = spec.seed || 7;
    const places = this.near.places;
    let place = null;
    let target = { type: 'puerta' };
    const kind = spec.kind || 'local';
    if (kind === 'local') {
      const shop = SHOPS.find((s) => s.name === spec.shop) || SHOPS[seed % SHOPS.length];
      place = { kind: 'local', shop, street: 'LOS OLIVOS', number: 100 + seed, seed, zone: spec.zone || 'barrio', floors: 4, windows: [] };
    } else if (kind === 'casa' || kind === 'oficina') {
      const office = kind === 'oficina';
      const win = { x: 0, y: 0, w: 5, kind: office ? 'oficina' : 'casa', seed: 1000 + seed * 7919, floor: spec.floor || 3, bay: seed % 4 };
      place = { kind: 'casa', shop: null, street: 'SANTA ROSA', number: 200 + seed, seed, zone: spec.zone || (office ? 'centro' : 'barrio'), floors: 8, windows: [win] };
      target = { type: 'ventana', win, key: spec.key === undefined ? 'persona' : spec.key };
    } else {
      place = places.find((p) => p.kind === kind) || { kind, name: kind.toUpperCase(), street: 'EL TELAR', seed, windows: [] };
    }
    this.tr = { place, target, hole: { x0: 0, x1: 1, y0: 0, y1: 1 }, k: 1, dur: 1.1, interior: makeInterior(place, target, rd.cols, rd.rows, this.night) };
    this.hover = null;
    this.setMode('adentro');
    return this.tr.interior;
  }

  leave() {
    if (this.mode === 'adentro' || this.mode === 'entrando') {
      this.tr.dur = 1.1;
      this.setMode('saliendo');
    }
  }

  finish() {
    this.tr = null;
    this.setMode('calle');
  }

  // marca de la puerta o ventana bajo el mouse, con su nombre
  drawHover(t) {
    const h = this.hover;
    if (!h) return;
    const { rd } = this;
    const { place, target, off, y0 } = h;
    const x0 = Math.floor(target.hole.x0 - off);
    const x1 = Math.ceil(target.hole.x1 - off);
    const yTop = Math.floor(target.hole.y0 + y0);
    const yBot = Math.ceil(target.hole.y1 + y0) - 1;
    const blink = Math.floor(t * 3) % 2;
    const ym = Math.floor((yTop + yBot) / 2);
    rd.put(x0 - 2 - blink, ym, '»');
    rd.put(x1 + 1 + blink, ym, '«');
    // esquinas
    rd.put(x0 - 1, yTop - 1, '.');
    rd.put(x1, yTop - 1, '.');
    rd.put(x0 - 1, yBot + 1, "'");
    rd.put(x1, yBot + 1, "'");
    let label;
    if (target.type === 'ventana') label = `piso ${target.win.floor}`;
    else if (place.shop) label = `entrar · ${place.shop.name}`;
    else if (place.name) label = `entrar · ${place.name}`;
    else label = `entrar · ${place.street} ${place.number}`;
    label = ` ${label} `;
    const ly = yTop - 3 >= 0 ? yTop - 3 : yBot + 2;
    const lx = clamp(Math.round((x0 + x1) / 2 - label.length / 2), 0, rd.cols - label.length);
    rd.text(lx, ly, label);
  }

  // adentro: volver, nombre del lugar y cómo salir
  drawInsideUI() {
    const { rd } = this;
    const tr = this.tr;
    const back = ' ← volver al tren ';
    rd.text(1, 1, back);
    this.backRect = { c0: 1, c1: back.length, r0: 0, r1: 2 };
    const it = tr.interior;
    const line = it.sub ? ` ${it.name} · ${it.sub} ` : ` ${it.name} `;
    rd.text(Math.max(0, Math.floor(rd.cols / 2 - line.length / 2)), rd.rows - 2, line);
  }

  hitBack(c, r) {
    const b = this.backRect;
    return this.mode === 'adentro' && b && c >= b.c0 && c <= b.c1 && r >= b.r0 && r <= b.r1;
  }

  // desplazamiento de una capa: columna local = columna de pantalla + off
  offset(f) {
    return Math.round(this.camX * f) + M - this.cx;
  }

  // Copia la ventana visible de una tira. screenBase = fila de pantalla de
  // su fila base.
  layer(ly, screenBase) {
    const off = this.offset(ly.f);
    const y0 = screenBase - ly.baseRow;
    this.rd.blitWindow(ly.g, off, 0, this.rd.cols, ly.g.h, 0, y0);
    return { off, y0 };
  }

  // --- caras laterales y techos hacia el punto de fuga -----------------------
  // Cada edificio es una caja: la cara de atrás es la de adelante escalada
  // por k alrededor del punto de fuga. Se ve la cara que mira al centro.
  sides(ly, off, y0, k, floorRows) {
    const { rd, cx, E } = this;
    const vx = cx + 0.5;
    const vy = E + 0.5;
    const cols = rd.cols;
    for (const b of ly.boxes) {
      const X0 = b.x0 - off;
      const X1 = b.x1 - off;
      if (X1 < -40 || X0 > cols + 40) continue;
      const yT = b.top + y0 + 0.92;
      const yB = b.bottom + y0 + 1;
      if (X0 + 0.5 > vx + 1) this.sideFace(X0 + 0.5, -1, yT, yB, vx, vy, k, floorRows, b);
      else if (X1 + 0.5 < vx - 1) this.sideFace(X1 + 0.5, 1, yT, yB, vx, vy, k, floorRows, b);
      if (yT > vy + 1.5) this.roofFace(X0 + 0.5, X1 + 0.5, yT, vx, vy, k);
    }
  }

  sideFace(xf, dir, yT, yB, vx, vy, k, floorRows) {
    const { rd } = this;
    const xb = vx + (xf - vx) * k;
    const ybT = vy + (yT - vy) * k;
    const ybB = vy + (yB - vy) * k;
    const c0 = Math.min(xf, xb);
    const c1 = Math.max(xf, xb);
    if (c1 - c0 < 0.8) return;
    // relleno opaco
    for (let c = Math.floor(c0); c < Math.ceil(c1); c++) {
      const u = clamp((c + 0.5 - xf) / (xb - xf), 0, 1);
      const top = yT + (ybT - yT) * u;
      const bot = yB + (ybB - yB) * u;
      for (let r = Math.ceil(top); r < Math.min(rd.rows, bot); r++) rd.put(c, r, SP);
    }
    // rayado: las losas de cada piso hacia el punto de fuga
    if (floorRows) {
      for (let y = yB - 5; y > yT + 1; y -= floorRows) {
        const yb = vy + (y - vy) * k;
        rd.line(xf, y, xb, yb);
      }
    }
    rd.line(xf, yT, xb, ybT);
    // arista del fondo
    for (let r = Math.ceil(ybT); r < Math.min(rd.rows, ybB); r++) rd.put(xb, r, '|');
    void dir;
  }

  roofFace(xL, xR, yT, vx, vy, k) {
    const { rd } = this;
    const bL = vx + (xL - vx) * k;
    const bR = vx + (xR - vx) * k;
    const yb = vy + (yT - vy) * k;
    if (yT - yb < 0.6) return;
    for (let r = Math.floor(yb); r < Math.floor(yT); r++) {
      const u = (r + 0.5 - yb) / (yT - yb);
      const a = bL + (xL - bL) * u;
      const b = bR + (xR - bR) * u;
      for (let c = Math.ceil(a); c < b; c++) rd.put(c, r, (c + r) % 3 === 0 ? '.' : ' ');
    }
    rd.line(bL, yb, bR, yb);
    rd.line(xL, yT, bL, yb);
    rd.line(xR, yT, bR, yb);
  }

  // --- capas ---------------------------------------------------------------

  drawFar(t) {
    const { off, y0 } = this.layer(this.far, this.E + 2);
    const { rd } = this;
    if (this.night) {
      for (const l of this.far.lights) {
        const x = l.x - off;
        if (x < 0 || x >= rd.cols) continue;
        rd.put(x, l.y + y0, (t + l.x * 0.37) % 2 < 1 ? '*' : '.');
      }
    }
  }

  drawMidFar(t) {
    const { rd } = this;
    const ly = this.midfar;
    const off = this.offset(ly.f);
    const y0 = this.E + 4 - ly.baseRow;
    this.sides(ly, off, y0, 0.96, 0);
    rd.blitWindow(ly.g, off, 0, rd.cols, ly.g.h, 0, y0);
    if (this.night) this.nightDots(ly, off, y0, t, 0.3);
    this.smokes(ly, off, y0, t, 3);
  }

  drawMid(t) {
    const { rd } = this;
    const ly = this.mid;
    const off = this.offset(ly.f);
    const y0 = this.E + 8 - ly.baseRow;
    this.sides(ly, off, y0, 0.93, 2);
    rd.blitWindow(ly.g, off, 0, rd.cols, ly.g.h, 0, y0);
    if (this.night) this.nightDots(ly, off, y0, t, 0.42);
    this.smokes(ly, off, y0, t, 4);
    this.traffic.drawMid(this, off, y0, t);
  }

  nightDots(ly, off, y0, t, rate) {
    const { rd } = this;
    const ws = ly.windows;
    const lo = lowerBound(ws, off - 3);
    for (let i = lo; i < ws.length; i++) {
      const w = ws[i];
      const x = w.x - off;
      if (x >= rd.cols) break;
      const ep = Math.floor(t / (14 + w.s * 30) + w.s * 5);
      const lit = hash2(Math.floor(w.s * 1e6), ep) < rate;
      if (lit) {
        rd.put(x, w.y + y0, GLOW);
        if (w.w === 2) rd.put(x + 1, w.y + y0, GLOW);
      } else if (w.dot) rd.put(x, w.y + y0, ' ');
    }
  }

  smokes(ly, off, y0, t, n) {
    const { rd } = this;
    for (const s of ly.smokes) {
      const x = s.x - off;
      if (x < -6 || x > rd.cols + 2) continue;
      for (let k = 0; k < n; k++) {
        const ph = (t * 0.9 + k * 0.7 + s.x * 0.13) % n;
        const yy = s.y + y0 - Math.floor(ph);
        const xx = x + Math.round(ph * 0.9 + Math.sin(t + k) * 0.6);
        rd.put(xx, yy, ph < 1.2 ? '~' : ph < n - 1 ? '~' : '.');
      }
    }
  }

  // El suelo entre capas: el río y las calles que cruzan, que convergen al
  // punto de fuga. Para una fila y del suelo la profundidad es f = (y−E)/16.
  drawGround(t) {
    const { rd, cx, E, S } = this;
    const cam = this.camX;
    const rowsEnd = Math.min(rd.rows - 1, S + 8);
    // río
    const [ra, rb] = RIVER;
    if ((ra - cam) * 2 < rd.cols && (rb - cam) * 2 > -rd.cols) {
      for (let y = E + 1; y <= rowsEnd; y++) {
        const f = (y + 0.5 - E) / 16;
        const xa = cx + (ra - cam) * f;
        const xb = cx + (rb - cam) * f;
        const c0 = Math.max(0, Math.ceil(xa));
        const c1 = Math.min(rd.cols - 1, Math.floor(xb));
        const flow = Math.floor(t * 2 * f + y * 3);
        for (let c = c0; c <= c1; c++) {
          const u = c - xa;
          const v = xb - c;
          let ch = '=';
          const h = hash2(c + flow, y);
          if (u < 1.2 || v < 1.2) ch = u < v ? '(' : ')';
          else if ((y & 1) === 1) ch = h < 0.55 ? '-' : ' ';
          else if (h < 0.12) ch = ' ';
          else if (h < 0.18) ch = '~';
          rd.put(c, y, ch);
        }
      }
      this.traffic.drawBoats(this, t);
    }
    // calles transversales (solo el trazado de veredas y la línea del medio)
    for (const [a, b] of this.streets) {
      if ((a - cam) > rd.cols * 2 || (b - cam) < -rd.cols * 2) continue;
      const fN = (S + 0.5 - E) / 16;
      const fF = 4.5 / 16;
      const xa = (f) => cx + (a - cam) * f;
      const xb = (f) => cx + (b - cam) * f;
      // calzada opaca
      for (let y = E + 5; y <= S; y++) {
        const f = (y + 0.5 - E) / 16;
        for (let c = Math.ceil(xa(f)); c < xb(f); c++) rd.put(c, y, ' ');
      }
      rd.line(xa(fN), S + 0.5, xa(fF), E + 4.5);
      rd.line(xb(fN), S + 0.5, xb(fF), E + 4.5);
      // línea del medio, punteada
      const m = (a + b) / 2;
      for (let y = E + 6; y <= S; y += 2) {
        const f = (y + 0.5 - E) / 16;
        rd.put(cx + (m - cam) * f, y, ':');
      }
    }
  }

  drawNear(t) {
    const { rd, night } = this;
    const ly = this.near;
    const off = this.offset(1);
    const y0 = this.S - NBASE;
    this.nearInfo = { off, y0 };
    this.sides({ boxes: ly.boxes }, off, y0, 0.88, 4);
    rd.blitWindow(ly.g, off, 0, rd.cols, ly.g.h, 0, y0);
    // ventanas
    const ws = ly.windows;
    const cols = rd.cols;
    for (let i = lowerBound(ws, off - 10); i < ws.length; i++) {
      const w = ws[i];
      const x = w.x - off;
      if (x >= cols) break;
      const y = w.y + y0;
      if (y + 1 < 0 || y >= rd.rows) continue;
      const fr = interior(w, t, night);
      const iw = w.w;
      const pad = (iw - 5) >> 1;
      const glow = fr && night;
      for (let row = 0; row < 2; row++) {
        if (row === 0 && w.awning) continue;
        if (row === 1 && w.balcony) continue;
        const yy = y + row;
        for (let c = 0; c < iw; c++) {
          const j = c - pad;
          let ch = fr && j >= 0 && j < 5 ? fr[row].charCodeAt(j) : SP;
          if (ch === SP) ch = glow ? GLOWC : row === 1 ? UND : SP;
          rd.put(x + c, yy, ch);
        }
      }
      // alguien sale al balcón; si el tren pasa cerca, saluda
      if (w.balcony && hash2(w.seed, Math.floor(t / 17 + (w.seed % 7))) < 0.3) {
        const near = Math.abs(x + 2 - this.cx) < 26;
        const wave = near && Math.floor(t * 3) % 2;
        rd.text(x + 1, y, near ? (wave ? '\\o/' : '_o_') : ' o ');
        rd.put(x + 2, y + 1, '|');
      }
    }
    // vidrieras encendidas de noche
    if (night) {
      for (const sh of ly.shops) {
        const x = sh.x - off;
        if (x > cols || x + sh.w < 0) continue;
        for (let r = 0; r < 2; r++)
          for (let c = 0; c < sh.w; c++) {
            const i = (sh.y + r) * ly.g.w + sh.x + c;
            if (ly.g.data[i] === SP) rd.put(x + c, sh.y + r + y0, GLOW);
          }
      }
    }
    // letreros
    for (const s of ly.signs) {
      const x = s.x - off;
      if (x > cols + 2 || x + (s.w || 6) < -2) continue;
      const y = s.y + y0;
      if (s.type === 'blade') {
        const on = Math.floor(t * 2 + s.x) % 2 === 0;
        const a = on ? '*' : '+';
        const b = on ? '+' : '*';
        rd.put(x + 1, y, a);
        rd.put(x + 3, y, b);
        rd.put(x + 1, y + s.h - 1, b);
        rd.put(x + 3, y + s.h - 1, a);
        if (night) {
          // a veces una letra se apaga
          const k = Math.floor(t * 3 + s.x);
          if (hash2(s.x, k) < 0.08) rd.put(x + 2, y + 1 + Math.floor(hash2(k, s.x) * s.word.length), ' ');
        }
      } else if (s.type === 'billboard' && night) {
        const ph = Math.floor(t * 6);
        for (let c = 1; c < s.w - 1; c += 2) rd.put(x + c, y + 4, (c / 2 + ph) % 3 < 1 ? '*' : '.');
      } else if (s.type === 'baliza') {
        rd.put(x, y, (t + s.x * 0.1) % 1.6 < 0.5 ? '*' : '.');
      } else if (s.type === 'marquee') {
        // texto que corre y focos que persiguen
        const txt = s.text;
        const sh = Math.floor(t * 4);
        let line = '';
        for (let i = 0; i < s.w; i++) line += txt[(i + sh) % txt.length];
        rd.text(x, y, line);
        const ph = Math.floor(t * 6);
        for (let i = 0; i < s.w; i++) rd.put(x + i, y + 1, (i + ph) % 4 === 0 ? '*' : (i + ph) % 4 === 2 ? '.' : ' ');
      } else if (s.type === 'cartel') {
        const on = Math.floor(t * 2.5) % 2;
        for (const dy of [0, 9]) for (let i = 0; i < 3; i++) rd.put(x + 4 + i * 2, y + dy, (i + on) % 2 ? '*' : '+');
      } else if (s.type === 'campana') {
        // cada 9 s la campana suena un rato
        const ph = t % 9;
        if (ph < 2.4) {
          const k = Math.floor(ph * 5) % 2;
          rd.text(x, y, k ? '(o)' : '/o/');
          rd.text(x - 4, y, k ? '((' : ' (');
          rd.text(x + 5, y, k ? '))' : ') ');
        }
      } else if (s.type === 'bandera') {
        const k = Math.floor(t * 2.5 + s.x) % 3;
        rd.text(x + 1, y, ['¯¯¯)', '¯~¯\\', '¯¯~)'][k]);
        rd.text(x + 1, y + 1, ['___)', '__~/', '_~_)'][k]);
      } else if (s.type === 'gato') {
        const k = Math.floor(t / 1.7 + s.x) % 4;
        rd.text(x, y, '/\\_/\\');
        rd.text(x, y + 1, k === 3 ? '(-.-)' : '(o.o)');
        rd.put(x + 5, y + 1, k % 2 ? '~' : '_');
      } else if (s.type === 'gondola') {
        // limpiavidrios que sube y baja por la fachada
        const span = s.bottom - s.top - 6;
        const gy = s.top + 1 + Math.round(span * (0.5 + 0.5 * Math.sin(t * 0.08 + s.x)));
        for (let r = s.top; r < gy; r++) {
          rd.put(x, r + y0, '|');
          rd.put(x + 8, r + y0, '|');
        }
        rd.text(x, gy + y0, '|  o/  |');
        rd.text(x, gy + y0 + 1, '[======]');
      } else if (s.type === 'anim') {
        // lugares propios (personal.js): cada uno se anima solo
        s.draw(rd, x, y, t, night);
      } else if (s.type === 'gancho') {
        const len = 8 + Math.round(6 * Math.sin(t * 0.35 + s.x));
        for (let k = 0; k < len; k++) rd.put(x, y + k, '|');
        rd.put(x, y + len, 'J');
        if (Math.sin(t * 0.175 + s.x) > -0.2) rd.text(x - 2, y + len + 1, '[==]');
      }
    }
    // faroles: de noche, la luz
    if (night) {
      for (let i = lowerBound(ly.lamps, off - 4); i < ly.lamps.length; i++) {
        const l = ly.lamps[i];
        const x = l.x - off;
        if (x > cols + 4) break;
        const y = l.y + y0;
        rd.put(x, y, '*');
        rd.put(x - 1, y + 1, '/');
        rd.put(x + 1, y + 1, '\\');
        for (let k = 2; k <= 4; k++) {
          rd.put(x - k, y + k, (k + Math.floor(t * 2)) % 2 ? '.' : ' ');
          rd.put(x + k, y + k, (k + Math.floor(t * 2) + 1) % 2 ? '.' : ' ');
        }
      }
    }
    // semáforos: rojo, amarillo, verde (el foco encendido es "●")
    for (let i = lowerBound(ly.lights, off - 4); i < ly.lights.length; i++) {
      const l = ly.lights[i];
      const x = l.x - off;
      if (x > cols + 4) break;
      const ph = Math.floor((t + l.x * 0.31) % 12);
      const on = ph < 5 ? 0 : ph < 6 ? 1 : 2;
      for (let k = 0; k < 3; k++) rd.put(x, l.y + y0 + k, k === on ? '●' : 'o');
    }
    // buhardillas que se prenden de noche
    if (night) {
      for (let i = lowerBound(ly.dormers, off - 2); i < ly.dormers.length; i++) {
        const d = ly.dormers[i];
        const x = d.x - off;
        if (x > cols + 2) break;
        if (hash2(d.x, Math.floor(t / 13 + d.x * 0.01)) < 0.5) rd.put(x, d.y + y0, GLOW);
      }
    }
    // ropa tendida que flamea
    for (let i = lowerBound(ly.laundry, off - 12); i < ly.laundry.length; i++) {
      const l = ly.laundry[i];
      const x = l.x - off;
      if (x > cols + 2) break;
      const ph = Math.floor(t * 3 + l.x);
      rd.text(x, l.y + y0, ph % 2 ? '[] /\\ []' : '[]/\\  []');
    }
    this.smokes(ly, off, y0, t, 5);
    for (const f of ly.fountains) {
      const x = f.x - off;
      if (x < -6 || x > cols + 6) continue;
      const ph = Math.floor(t * 4);
      rd.ink(x - 3, f.y + y0, ph % 2 ? ' .   . ' : '.  |  .');
      rd.ink(x - 2, f.y + y0 + 1, ph % 2 ? "'  |  '" : " ' | ' ");
    }
    this.traffic.drawSidewalk(this, off, y0, t);
  }

  drawStation(t) {
    const st = this.station;
    const off = this.offset(STATION_F);
    const y0 = this.S - st.baseRow;
    const { rd } = this;
    // ¿hay alguna estación a la vista?
    if (!st.spans.some(([a, b]) => b - off > -4 && a - off < rd.cols + 4)) return;
    rd.blitWindow(st.g, off, 0, rd.cols, st.g.h, 0, y0);
    drawStationDyn(this, st, off, y0, t);
  }

  // Título fijo al centro, texto plano con un espacio opaco a cada lado.
  drawTitle() {
    const { rd } = this;
    const w = this.title.length;
    const c = Math.floor(rd.cols / 2 - w / 2);
    rd.text(c - 1, this.E, ' ' + this.title + ' ');
  }

  // Disolución pegada al borde superior del contenido.
  drawDissolve(contentRow) {
    const { rd } = this;
    const G = Math.max(8, Math.round(rd.rows * 0.35));
    const start = Math.floor(contentRow - G);
    for (let r = Math.max(0, start); r < rd.rows; r++) {
      const amount = (r - start) / G;
      for (let c = 0; c < rd.cols; c++) if (amount >= 1 || bayer(c, r) < amount) rd.put(c, r, ' ');
    }
  }
}

// primer índice con x >= v (lista ordenada por x)
export function lowerBound(arr, v) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (arr[m].x < v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

export { mirror, L, STATIONS };
