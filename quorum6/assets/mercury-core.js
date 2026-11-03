/* Mercury: a port of the "Mercury" exhibit from aiforui.dev/lab (study), plus the hooks the Quorum
   network versions need (a `spread` that loosens the bead into separate points, and a gentle drift).

   Simulation, in a 600 × 600 stage:
   - 60 particles. Pairs closer than h = 42 interact: inside the core r0 = 11.5·(size_i + size_j) they repel
     (−45 000·(1 − d/r0)); between r0 and h they attract with F(d) = σ·sin(π(d − r0)/(h − r0)), σ = 1800,
     plus a damping term along the line between them, softened when they separate fast (that is what lets it tear).
   - Union-find on a 38.6 px link groups particles into drops; each drop is pulled to its own centroid, stray drops
     roll back to the biggest one, and the main drop is held near the centre (300, 288).
   - Hover pulls particles within 150 px toward the pointer; grabbing pins the nearest particles to it, and
     releasing throws them with the pointer's velocity. 4 substeps per frame, walls bounce at 0.6.
   Render: a metaball field Σ (1 − d²/50²)²·1.25 on a 104 × 85 grid of 5 px cells. Cells with field ≥ 1 are
   metal: their normal comes from the field gradient and is lit from (−0.42, −0.6, 0.68), and the light picks one
   of five dot sizes. Cells below 1 draw a faint halo, and a sparse checkerboard of tiny dots everywhere else. */
(function () {
  'use strict';
  const N = 60;
  const AREA = { nx: 104, ny: 85, cell: 5, x0: 40, y0: 74 };
  const X1 = AREA.x0 + AREA.nx * AREA.cell, Y1 = AREA.y0 + AREA.ny * AREA.cell;
  const LIGHT = (() => { const t = Math.hypot(-0.42, -0.6, 0.68); return [-0.42 / t, -0.6 / t, 0.68 / t]; })();
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const pad = (v, n) => String(Math.round(v)).padStart(n, ' ');

  function rng(seed) {
    let t = seed >>> 0;
    return () => {
      let e = (t = (t + 0x6d2b79f5) >>> 0);
      e = Math.imul(e ^ (e >>> 15), 1 | e);
      return (((e ^= e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ (e >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- state ----------
  function createState() {
    const r = rng(452544), x = new Float32Array(N), y = new Float32Array(N), sz = new Float32Array(N);
    let k = 0;
    for (const [cx, cy, n] of [[150, 170, 12], [430, 150, 9], [470, 390, 8], [130, 400, 7], [300, 120, 6], [520, 270, 6], [90, 280, 5], [300, 450, 4], [230, 300, 3]])
      for (let s = 0; s < n && k < N; s++, k++) {
        const rad = 11.5 * Math.sqrt(s + 0.5) * 1.05, a = 2.39996 * s;
        x[k] = cx + Math.cos(a) * rad; y[k] = cy + Math.sin(a) * rad; sz[k] = 0.8 + 0.4 * r();
      }
    const ph = new Float32Array(2 * N); for (let i = 0; i < 2 * N; i++) ph[i] = r() * Math.PI * 2;
    return {
      x, y, sz, ph, vx: new Float32Array(N), vy: new Float32Array(N), ax: new Float32Array(N), ay: new Float32Array(N),
      held: new Uint8Array(N), ox: new Float32Array(N), oy: new Float32Array(N), comp: new Int32Array(N),
      bx: new Float32Array(N), by: new Float32Array(N), nHeld: 0, main: 0, drops: 1, mcx: 300, mcy: 288,
      lpx: 0, lpy: 0, lpOk: false, field: new Float32Array(AREA.nx * AREA.ny), mine: new Float32Array(AREA.nx * AREA.ny), speed: 0
    };
  }

  // Drops: union-find on a 38.6 px link (scaled with the spread)
  function components(S, sp) {
    const { x, y, comp } = S;
    for (let i = 0; i < N; i++) comp[i] = i;
    const find = i => { while (comp[i] !== i) i = comp[i] = comp[comp[i]]; return i; };
    const th = 1493.0496 * sp * sp;
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
      const dx = x[j] - x[i], dy = y[j] - y[i];
      if (dx * dx + dy * dy < th) { const a = find(i), b = find(j); if (a !== b) comp[a] = b; }
    }
    const cnt = new Int32Array(N); let drops = 0;
    for (let i = 0; i < N; i++) { comp[i] = find(i); if (cnt[comp[i]]++ === 0) drops++; }
    let main = 0; for (let i = 0; i < N; i++) if (cnt[i] > cnt[main]) main = i;
    const { bx, by } = S; bx.fill(0); by.fill(0);
    for (let i = 0; i < N; i++) { bx[comp[i]] += x[i] / cnt[comp[i]]; by[comp[i]] += y[i] / cnt[comp[i]]; }
    let mx = 0, my = 0; for (let i = 0; i < N; i++) if (comp[i] === main) { mx += x[i]; my += y[i]; }
    S.main = main; S.drops = drops; S.mcx = mx / cnt[main]; S.mcy = my / cnt[main];
  }

  // One frame of simulation. opt.spread (1 = mercury) scales every distance; opt.drift adds a slow wander.
  function step(S, dt, px, py, inside, reduced, opt) {
    const sp = (opt && opt.spread) || 1, drift = (opt && opt.drift) || 0, time = (opt && opt.t) || 0;
    const { x, y, vx, vy, ax, ay, held, ox, oy, comp, sz } = S;
    components(S, sp);
    const b = dt / 4;
    if (!S.lpOk) { S.lpx = px; S.lpy = py; S.lpOk = true; }
    const pvx = (px - S.lpx) / dt, pvy = (py - S.lpy) / dt, k = S.nHeld > 0, damp = Math.exp(-0.6 * b), A = 11.2;
    const H = 42 * sp, H2 = H * H;
    let R = 0;
    for (let sub = 0; sub < 4; sub++) {
      const T = (sub + 1) / 4;
      let E = 0, F = 0, P = 0;
      for (let i = 0; i < N; i++) if (comp[i] === S.main) { E += vx[i]; F += vy[i]; P++; }
      E /= P; F /= P;
      const qx = S.lpx + (px - S.lpx) * T, qy = S.lpy + (py - S.lpy) * T;
      ax.fill(0); ay.fill(0);
      let X = 0, J = 0;
      for (let i = 0; i < N; i++) {
        const xi = x[i], yi = y[i];
        for (let j = i + 1; j < N; j++) {
          const dx = x[j] - xi, dy = y[j] - yi, s = dx * dx + dy * dy;
          if (s >= H2) continue;
          const h = Math.sqrt(s) || 0.01, nx = dx / h, ny = dy / h;
          const rv = (vx[j] - vx[i]) * nx + (vy[j] - vy[i]) * ny, m = 11.5 * (sz[i] + sz[j]) * sp;
          let f;
          if (h < m) f = -45e3 * (1 - h / m) + 8 * rv;
          else { const e = rv > 0 ? rv : 0; f = (1800 * Math.sin((Math.PI * (h - m)) / (H - m)) + 8 * rv) * (28900 / (28900 + e * e)); }
          ax[i] += f * nx; ay[i] += f * ny; ax[j] -= f * nx; ay[j] -= f * ny;
        }
      }
      for (let i = 0; i < N; i++) {
        if (held[i]) {
          ax[i] += 1100 * (qx + ox[i] - x[i]) + 30 * (pvx - vx[i]);
          ay[i] += 1100 * (qy + oy[i] - y[i]) + 30 * (pvy - vy[i]);
        } else if (inside && !k) {
          const lx = qx - x[i], ly = qy - y[i], d = Math.hypot(lx, ly);
          if (d > 4 && d < 150) {
            const a = 1600 * (1 - d / 150);
            ax[i] += (a * lx) / d; ay[i] += (a * ly) / d;
            if (comp[i] === S.main) { X += (a * lx) / d; J += (a * ly) / d; }
          }
        }
        ax[i] += 10 * (S.bx[comp[i]] - x[i]); ay[i] += 10 * (S.by[comp[i]] - y[i]);
        if (comp[i] !== S.main) {
          const lx = S.mcx - x[i], ly = S.mcy - y[i], d = Math.hypot(lx, ly) || 1;
          ax[i] += (170 * lx) / d; ay[i] += (170 * ly) / d;
        } else if (!k && !reduced) {
          ax[i] += 2.2 * (300 - S.mcx) - 2.2 * E; ay[i] += 2.2 * (288 - S.mcy) - 2.2 * F;
        }
        if (drift) {
          ax[i] += drift * Math.sin(time * 0.37 + S.ph[2 * i]) ; ay[i] += drift * Math.cos(time * 0.29 + S.ph[2 * i + 1]);
        }
      }
      if (X || J) {
        let c = 0; for (let i = 0; i < N; i++) if (comp[i] === S.main) c++;
        const lx = (X / c) * 0.8, ly = (J / c) * 0.8;
        for (let i = 0; i < N; i++) if (comp[i] === S.main) { ax[i] -= lx; ay[i] -= ly; }
      }
      for (let i = 0; i < N; i++) {
        let lx = (vx[i] + ax[i] * b) * damp, ly = (vy[i] + ay[i] * b) * damp;
        const v = Math.hypot(lx, ly);
        if (v > 2600) { lx *= 2600 / v; ly *= 2600 / v; }
        let nx = x[i] + lx * b, ny = y[i] + ly * b;
        if (nx < AREA.x0 + A) { nx = AREA.x0 + A; lx = 0.6 * Math.abs(lx); } else if (nx > X1 - A) { nx = X1 - A; lx = -0.6 * Math.abs(lx); }
        if (ny < AREA.y0 + A) { ny = AREA.y0 + A; ly = 0.6 * Math.abs(ly); } else if (ny > Y1 - A) { ny = Y1 - A; ly = -0.6 * Math.abs(ly); }
        x[i] = nx; y[i] = ny; vx[i] = lx; vy[i] = ly;
        if (sub === 3) R = Math.max(R, Math.hypot(lx, ly));
      }
    }
    S.lpx = px; S.lpy = py; S.speed = R;
  }

  // Grab: the nearest particle within 46 px and its drop-mates within 42 px stick to the pointer
  function grab(S, tx, ty) {
    const { x, y, held, ox, oy } = S;
    S.nHeld = 0; held.fill(0);
    let s = -1, best = 46;
    for (let i = 0; i < N; i++) { const d = Math.hypot(x[i] - tx, y[i] - ty); if (d < best) { best = d; s = i; } }
    if (s < 0) return;
    const c = S.comp[s];
    for (let i = 0; i < N; i++) {
      const d = Math.hypot(x[i] - tx, y[i] - ty);
      if (i === s || (S.comp[i] === c && d < 42)) { held[i] = 1; ox[i] = (x[i] - tx) * 0.85; oy[i] = (y[i] - ty) * 0.85; S.nHeld++; }
    }
    S.lpx = tx; S.lpy = ty; S.lpOk = true;
  }
  // Release: throw what was held with the pointer's velocity (capped at 2200 px/s)
  function release(S, pvx, pvy) {
    const v = Math.hypot(pvx, pvy), n = v > 2200 ? 2200 / v : 1;
    for (let i = 0; i < N; i++) if (S.held[i]) { S.vx[i] = 0.4 * S.vx[i] + pvx * n * 0.6; S.vy[i] = 0.4 * S.vy[i] + pvy * n * 0.6; S.held[i] = 0; }
    S.nHeld = 0;
  }

  // ---------- the halftone metal ----------
  function metalDot(dot, x, y, a) { a > 0.9 ? dot(8, x, y, 2.1) : a > 0.6 ? dot(7, x, y, 1.85) : a > 0.4 ? dot(6, x, y, 1.7) : a > 0.2 ? dot(5, x, y, 1.55) : dot(4, x, y, 1.4); }
  function haloDot(dot, col, row, x, y, f, grid) { f > 0.6 ? dot(3, x, y, 0.85) : f > 0.38 ? dot(2, x, y, 0.65) : f > 0.22 ? dot(1, x, y, 0.55) : grid && (col + row) % 2 === 0 && dot(0, x, y, 0.4); }
  function renderField(S, dot, grid = true, kr = 50) {
    const { nx, ny, cell, x0, y0 } = AREA, { field, mine, x, y, held } = S;
    field.fill(0); mine.fill(0);
    const R2 = kr * kr, G = 1.25, reach = Math.ceil(kr / cell);
    for (let i = 0; i < N; i++) {
      const cc = Math.round((x[i] - x0) / cell - 0.5), cr = Math.round((y[i] - y0) / cell - 0.5);
      const c0 = Math.max(0, cc - reach), c1 = Math.min(nx - 1, cc + reach), r0 = Math.max(0, cr - reach), r1 = Math.min(ny - 1, cr + reach), h = held[i] === 1;
      for (let r = r0; r <= r1; r++) {
        const dy = y0 + r * cell + cell / 2 - y[i], row = r * nx;
        for (let c = c0; c <= c1; c++) {
          const dx = x0 + c * cell + cell / 2 - x[i], o = 1 - (dx * dx + dy * dy) / R2;
          if (o <= 0) continue;
          const v = o * o * G; field[row + c] += v; if (h) mine[row + c] += v;
        }
      }
    }
    const g = e => 1 - 1 / Math.max(1, e);
    let inside = 0;
    for (let r = 0; r < ny; r++) {
      const py = y0 + r * cell + cell / 2, row = r * nx;
      for (let c = 0; c < nx; c++) {
        const px = x0 + c * cell + cell / 2, f = field[row + c];
        if (f < 1) { haloDot(dot, c, r, px, py, f, grid); continue; }
        inside++;
        if (mine[row + c] > 0.5 * f) { dot(9, px, py, f < 1.25 ? 1.75 : 1.6); continue; }
        const L = c > 0 ? field[row + c - 1] : 0, Rr = c < nx - 1 ? field[row + c + 1] : 0, U = r > 0 ? field[row - nx + c] : 0, D = r < ny - 1 ? field[row + nx + c] : 0;
        const gx = (g(Rr) - g(L)) * 3.2, gy = (g(D) - g(U)) * 3.2, len = Math.hypot(gx, gy, 1);
        const lit = (-gx * LIGHT[0] - gy * LIGHT[1] + LIGHT[2]) / len;
        metalDot(dot, px, py, f < 1.2 ? Math.max(lit, 0.3) : lit);
      }
    }
    return inside;
  }

  // ---------- DotRaster: anti-aliased dots stamped into an ImageData (8×8 supersampled masks, quarter-pixel positions) ----------
  const colorCache = new Map();
  function parseColor(s) {
    let v = colorCache.get(s); if (v !== undefined) return v;
    if (s[0] === '#') v = (0xff000000 + parseInt(s.slice(1, 7), 16)) >>> 0;
    else { const t = (s.match(/[\d.]+/g) || [0, 0, 0, 1]).map(Number); v = (0x1000000 * Math.round((t[3] ?? 1) * 255) + ((t[0] << 16) | (t[1] << 8) | t[2])) >>> 0; }
    colorCache.set(s, v); return v;
  }
  function colorize(out, cov, color, alpha) {
    const a = parseColor(color), o = ((a >>> 24) / 255) * alpha, bgr = ((255 & a) << 16) | (65280 & a) | ((a >> 16) & 255);
    for (let i = 0; i < cov.length; i++) { const r = Math.round(cov[i] * o); out[i] = r ? ((r << 24) | bgr) >>> 0 : 0; }
  }
  function trim(d, w, h, ox, oy) {
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) if (d[r * w + c]) { if (c < x0) x0 = c; if (c > x1) x1 = c; if (r < y0) y0 = r; if (r > y1) y1 = r; }
    if (x1 < 0) return { w: 0, h: 0, ox: 0, oy: 0, cov: new Uint8Array(0) };
    const W = x1 - x0 + 1, H = y1 - y0 + 1, cov = new Uint8Array(W * H);
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cov[r * W + c] = d[(r + y0) * w + c + x0];
    return { w: W, h: H, ox: ox + x0, oy: oy + y0, cov };
  }
  function discMask(rad, cx, cy) {
    const x0 = Math.floor(cx - rad) - 1, y0 = Math.floor(cy - rad) - 1, w = Math.ceil(cx + rad) + 1 - x0, h = Math.ceil(cy + rad) + 1 - y0;
    const d = new Uint8Array(w * h), r2 = rad * rad;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      let n = 0;
      for (let sy = 0; sy < 8; sy++) { const fy = y0 + r + (sy + 0.5) / 8 - cy; for (let sx = 0; sx < 8; sx++) { const fx = x0 + c + (sx + 0.5) / 8 - cx; if (fx * fx + fy * fy <= r2) n++; } }
      d[r * w + c] = Math.round((n / 64) * 255);
    }
    return trim(d, w, h, x0, y0);
  }
  class DotRaster {
    constructor() { this.cv = null; this.oc = null; this.img = null; this.u32 = new Uint32Array(0); this.W = 0; this.H = 0; this.masks = new Map(); this.tmp = new Uint32Array(256); }
    begin(ctx) {
      const t = ctx.getTransform(), W = ctx.canvas.width, H = ctx.canvas.height;
      this.a = t.a; this.b = t.b; this.c = t.c; this.d = t.d; this.e = t.e; this.f = t.f; this.k = Math.hypot(t.a, t.b);
      if (this.masks.size > 4000) this.masks.clear();
      if (this.cv && W === this.W && H === this.H) { if (this.bx1 > this.bx0) for (let r = this.by0; r < this.by1; r++) this.u32.fill(0, r * W + this.bx0, r * W + this.bx1); }
      else { this.cv = this.cv || document.createElement('canvas'); this.cv.width = W; this.cv.height = H; this.oc = this.cv.getContext('2d'); this.img = new ImageData(W, H); this.u32 = new Uint32Array(this.img.data.buffer); this.W = W; this.H = H; }
      this.bx0 = W; this.by0 = H; this.bx1 = 0; this.by1 = 0;
    }
    dot(x, y, r, color, alpha = 1) {
      const sx = this.a * x + this.c * y + this.e, sy = this.b * x + this.d * y + this.f, ix = Math.floor(sx), iy = Math.floor(sy);
      const qx = Math.min(3, Math.floor((sx - ix) * 4)), qy = Math.min(3, Math.floor((sy - iy) * 4)), p = Math.round(r * this.k * 16);
      const key = ((2 * p * 48) * 4 + qx) * 4 + qy;
      let m = this.masks.get(key);
      if (!m) { m = discMask(p / 16, (qx + 0.5) / 4, (qy + 0.5) / 4); this.masks.set(key, m); }
      this.blit(m, ix, iy, color, alpha);
    }
    blit(m, ix, iy, color, alpha) {
      let words;
      if (alpha === 1) { if (!m.words) m.words = new Map(); words = m.words.get(color); if (!words) { words = new Uint32Array(m.cov.length); colorize(words, m.cov, color, 1); m.words.set(color, words); } }
      else { if (alpha <= 0) return; if (this.tmp.length < m.cov.length) this.tmp = new Uint32Array(2 * m.cov.length); words = this.tmp; colorize(words, m.cov, color, alpha); }
      const W = this.W, H = this.H, cx = ix + m.ox, cy = iy + m.oy, u0 = Math.max(0, -cx), v0 = Math.max(0, -cy), u1 = Math.min(m.w, W - cx), v1 = Math.min(m.h, H - cy);
      if (u1 <= u0 || v1 <= v0) return;
      if (cx + u0 < this.bx0) this.bx0 = cx + u0; if (cy + v0 < this.by0) this.by0 = cy + v0; if (cx + u1 > this.bx1) this.bx1 = cx + u1; if (cy + v1 > this.by1) this.by1 = cy + v1;
      const g = this.u32, mw = m.w;
      for (let v = v0; v < v1; v++) {
        const row = (cy + v) * W + cx, mr = v * mw;
        for (let u = u0; u < u1; u++) {
          const s = words[mr + u]; if (s === 0) continue;
          const n = row + u, dst = g[n];
          if (dst === 0 || s >>> 24 === 255) { g[n] = s; continue; }
          const la = (s >>> 24) / 255, ra = ((dst >>> 24) / 255) * (1 - la), oa = la + ra;
          g[n] = ((Math.round(255 * oa) << 24) | (Math.round((((s >> 16) & 255) * la + ((dst >> 16) & 255) * ra) / oa) << 16) | (Math.round((((s >> 8) & 255) * la + ((dst >> 8) & 255) * ra) / oa) << 8) | Math.round(((255 & s) * la + (255 & dst) * ra) / oa)) >>> 0;
        }
      }
    }
    flush(ctx) {
      if (this.bx1 <= this.bx0 || !this.oc) return;
      const w = this.bx1 - this.bx0, h = this.by1 - this.by0;
      this.oc.putImageData(this.img, 0, 0, this.bx0, this.by0, w, h);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.cv, this.bx0, this.by0, w, h, this.bx0, this.by0, w, h); ctx.restore();
    }
  }
  // Dots are collected per class (0–9) and drawn darkest first, so the lit metal lands on top
  function dotBatch(raster, palette) {
    const lists = Array.from({ length: 10 }, () => []);
    return {
      begin() { for (const l of lists) l.length = 0; },
      dot: (cls, x, y, r) => { lists[cls].push(x, y, r); },
      flush(ctx, alpha = 1) {
        raster.begin(ctx);
        for (let c = 0; c < 10; c++) { const l = lists[c], col = palette[c]; for (let i = 0; i < l.length; i += 3) raster.dot(l[i], l[i + 1], l[i + 2], col, alpha); }
        raster.flush(ctx);
      }
    };
  }

  // ---------- stage + pointer (a 600 × 600 drawing scaled to the element) ----------
  function stage(wrap, canvas, draw, maxDpr = 3) {
    const ctx = canvas.getContext('2d'), mq = matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0, visible = false, last = 0, time = 0, dpr = 1, scale = 1;
    const frame = now => {
      raf = 0;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now; if (!mq.matches) time += dt;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      if (draw({ ctx, dt, t: time, reduced: mq.matches }) && visible) raf = requestAnimationFrame(frame); else last = 0;
    };
    const wake = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };
    const resize = () => { const r = wrap.getBoundingClientRect(); dpr = Math.min(maxDpr, devicePixelRatio || 1); canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr)); scale = r.width / 600; wake(); };
    new ResizeObserver(resize).observe(wrap);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); else { cancelAnimationFrame(raf); raf = 0; last = 0; } }).observe(wrap);
    mq.addEventListener('change', wake);
    resize();
    return { wake };
  }
  function pointer(el, wake) {
    const p = { x: 300, y: 300, vx: 0, vy: 0, inside: false, down: false, taps: [], releases: [], moved: 0 };
    let lastT = 0;
    const at = e => { const r = el.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 600, ((e.clientY - r.top) / r.height) * 600]; };
    el.addEventListener('pointermove', e => { const [x, y] = at(e), dt = Math.max(1, e.timeStamp - lastT) / 1000; lastT = e.timeStamp; if (p.inside && dt < 0.1) { p.vx += ((x - p.x) / dt - p.vx) * 0.5; p.vy += ((y - p.y) / dt - p.vy) * 0.5; } p.x = x; p.y = y; p.inside = true; p.moved = performance.now(); wake(); });
    el.addEventListener('pointerdown', e => { const [x, y] = at(e); p.x = x; p.y = y; p.inside = true; p.down = true; p.taps.push({ x, y }); p.moved = performance.now(); el.setPointerCapture && el.setPointerCapture(e.pointerId); wake(); });
    el.addEventListener('pointerup', e => { const [x, y] = at(e); p.down = false; p.releases.push({ x, y }); wake(); });
    el.addEventListener('pointercancel', () => { p.down = false; p.inside = false; wake(); });
    el.addEventListener('pointerleave', () => { p.down = false; p.inside = false; p.vx = 0; p.vy = 0; wake(); });
    return p;
  }
  // Pointer bookkeeping shared by every version: grabs, releases, and whether the pointer is over the field
  function handlePointer(S, ptr) {
    const over = ptr.inside && ptr.x > AREA.x0 - 12 && ptr.x < X1 + 12 && ptr.y > AREA.y0 - 12 && ptr.y < Y1 + 12;
    for (const t of ptr.taps) grab(S, clamp(t.x, AREA.x0, X1), clamp(t.y, AREA.y0, Y1));
    ptr.taps.length = 0;
    if (S.nHeld > 0 && (ptr.releases.length > 0 || !ptr.down)) release(S, ptr.vx, ptr.vy);
    ptr.releases.length = 0;
    if (!over && S.nHeld === 0) S.lpOk = false;
    return { over, px: clamp(ptr.x, AREA.x0, X1), py: clamp(ptr.y, AREA.y0, Y1) };
  }

  window.Mercury = { N, AREA, X1, Y1, clamp, pad, rng, createState, components, step, grab, release, renderField, DotRaster, dotBatch, stage, pointer, handlePointer };
})();
