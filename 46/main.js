/* full reality distortion — 1:1 study of the reference recording.
 *
 * What the recording does (measured frame by frame):
 *  - The scene only repaints every 8 video frames (133 ms, 7.5 fps) and uses the pointer
 *    position from ~150 ms earlier, offset by (+2.5, +33.5) px.  That point is the "lens".
 *  - Four dotted rings and a dotted crosshair are centred on the lens.
 *  - A fixed wavy chain of binary digits ("01101" repeating, 16 px apart) crosses the panel.
 *  - Three hidden copies of that chain ("strands") live elsewhere in the panel.  Every chain
 *    point is blended from its base position to its hidden position by how close the base
 *    position is to the lens, so the three strands peel away from the string near the lens.
 *  - Every run of 1s between two 0s is a leaf.  Inside the inner ring the leaves swell into
 *    bubbles: cyan with beige cores in the middle of the chain, orange and magenta at its ends.
 */
(() => {
  'use strict';

  const W = 930, H = 347.5;
  const STEP_MS = 1000 / 7.5;       // scene repaint cadence in the recording
  const LAG_MS = 150;               // pointer -> scene latency
  const OFFSET = { x: 2.5, y: 33.5 };
  const DOT = 3.2, DOT_PITCH = 5.667;
  const PATTERN = [0, 1, 1, 0, 1];
  const MIN_R = 1.6;                // thinner than this a strand is only digits

  const stage = document.getElementById('stage');
  const panel = document.getElementById('panel') || document.getElementById('scene');
  const canvas = document.getElementById('scene');
  const ctx = canvas.getContext('2d');

  const params = new URLSearchParams(location.search);
  const STEPPED = params.has('stepped');        // ?stepped -> the recording's cadence: 7.5 fps, 150 ms behind the pointer
  const EASE_MS = 55;                           // default: repaint every frame, the lens eases towards the pointer
  const DEBUG = params.has('debug');
  const ORDER = new URLSearchParams(location.search).get('order') || 'r';   // paint order of the discs (experiment)

  // <html data-fill> (or ?fill): the canvas covers the whole window; the panel is fitted inside it and the
  // scene simply continues above / below (or beside) it.
  const FILL = document.documentElement.hasAttribute('data-fill') || params.has('fill');
  let M = null, dpr = 1, scale = 1, dirty = true;
  let VX0 = 0, VY0 = 0, VW = W, VH = H;          // visible rectangle, in panel px
  const LB = 2 * (248.4 + 72);                   // bubbles are centred inside the inner ring but a fat one reaches past it: their layers are this box
  let LX = 0, LY = 0;                            // where that box sits this frame
  let overshoot = -Infinity;                     // test hook: how far any bubble has reached past the layer box
  let quality = 1;                               // lowered on machines that cannot keep up

  function fit() {
    if (FILL) {
      scale = Math.min(window.innerWidth / W, window.innerHeight / H);
      VW = window.innerWidth / scale; VH = window.innerHeight / scale; VX0 = (W - VW) / 2; VY0 = (H - VH) / 2;
      dpr = Math.min(2, window.devicePixelRatio || 1) * scale * quality;
    } else {
      // the recording shows the panel at 930 px in a 1335 px wide viewport (69.7 %); phones: nearly full width
      scale = Math.min(window.innerWidth * (window.innerWidth < 900 ? 0.94 : 0.697) / W, window.innerHeight * 0.92 / H);
      if (params.has('scale')) scale = parseFloat(params.get('scale'));
      if (stage) stage.style.transform = `scale(${scale})`;
      dpr = Math.min(2, Math.max(1, (window.devicePixelRatio || 1) * scale)) * quality;   // 2 px per CSS px is as sharp as the recording
    }
    if (params.has('dpr')) dpr = parseFloat(params.get('dpr'));
    canvas.width = Math.round(VW * dpr);
    canvas.height = Math.round(VH * dpr);
    dirty = true;
  }

  /* ---------- pointer -> lens ---------- */
  const hist = [];                               // {t,x,y} in panel px
  let lens = { x: 409.5, y: 206.5 };             // resting state seen in the recording
  function push(cx, cy) {
    const r = canvas.getBoundingClientRect();
    hist.push({ t: performance.now(), x: (cx - r.left) / scale + VX0, y: (cy - r.top) / scale + VY0 });
    if (hist.length > 400) hist.splice(0, 200);
  }
  window.addEventListener('mousemove', (e) => push(e.clientX, e.clientY), { passive: true });
  for (const ev of ['touchstart', 'touchmove']) window.addEventListener(ev, (e) => { const t = e.touches[0]; if (t) push(t.clientX, t.clientY); }, { passive: true });
  function pointerAt(t) {
    for (let i = hist.length - 1; i >= 0; i--) if (hist[i].t <= t) return hist[i];
    return null;
  }

  /* ---------- model ---------- */
  const sstep = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  let NS = 0, bx, by, di, NQ = 0, SUB = 3, qA;

  // base position at a fractional chain coordinate c
  function baseAt(c, out) {
    let lo = 0, hi = NS - 1;
    if (c <= di[0]) { out[0] = bx[0]; out[1] = by[0]; return; }
    if (c >= di[hi]) { out[0] = bx[hi]; out[1] = by[hi]; return; }
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (di[m] <= c) lo = m; else hi = m; }
    const t = (c - di[lo]) / (di[hi] - di[lo]);
    out[0] = bx[lo] + (bx[hi] - bx[lo]) * t; out[1] = by[lo] + (by[hi] - by[lo]) * t;
  }
  const tmp = [0, 0];

  function prepare(model) {
    M = model;
    NS = M.base.length;
    bx = new Float32Array(NS); by = new Float32Array(NS); di = Float32Array.from(M.di);
    for (let j = 0; j < NS; j++) { bx[j] = M.base[j][0]; by[j] = M.base[j][1]; }
    SUB = M.sub; NQ = (M.n - 1) * SUB + 1;       // SUB samples per digit along the chain
    qA = new Float32Array(2 * NQ);
    for (let q = 0; q < NQ; q++) { baseAt(M.i0 + q / SUB, tmp); qA[2 * q] = tmp[0]; qA[2 * q + 1] = tmp[1]; }
    for (let j = 1; j < NS; j++) if (bx[j] >= DROP_X) { dropY = by[j - 1] + (by[j] - by[j - 1]) * (DROP_X - bx[j - 1]) / (bx[j] - bx[j - 1]); break; }
    for (const s of M.strands) {
      s.px = new Float32Array(NQ); s.py = new Float32Array(NQ); s.r = new Float32Array(NQ); s.rn = new Float32Array(NQ);
      s.uu = new Float32Array(NQ); s.far = new Uint8Array(NQ); s.lm = new Float32Array(NQ); s.gap = new Float32Array(M.n);
      s.cdx = new Float32Array(M.n); s.cdy = new Float32Array(M.n); s.cl = new Float32Array(M.n); s.cs = new Float32Array(M.n); s.ca = new Float32Array(M.n);
    }
  }

  // piecewise-linear table lookup (the blend weights and the size law are fitted curves)
  const tab = (t, d, step) => {
    const n = t.length; let x = d / step;
    if (x >= n - 1) return t[n - 1];
    if (x < 0) x = 0;
    const i = Math.floor(x); return t[i] + (t[i + 1] - t[i]) * (x - i);
  };
  const DROP_X = 195; let dropY = 0;               // left of this the base string runs below the panel
  const FADE0 = 400, FADE1 = 500;
  const THIN = 0.6, NODE_MIN = 6.5;                 // thinnest ribbon drawn; smallest disc drawn as a disc
  const STEM = 1.1;                                 // half-width of the thin stem (CSS px)
  const FAR_R = 700, SLIDE = 1.95, SLIDE_R = 920;   // far-field doubling: 1.93 digits at 400 px, 1.36 at 692 px, gone past ~700

  // Displayed strand k for lens C.  For every chain sample with base position A:
  //   P = A + W(|A-C|) D + W2(|A-C|) E + radial/tangential push,   r = R * U(|P-C|) * Sz(|A-C|)
  // Leaves run along the 1 digits (radius R), every 0 digit carries a disc (radius Rn).
  function buildStrand(s, C, k) {
    const { D, E, R, Rn, W, W2, Gr, Gt, Sz, px, py, r, rn, uu, far } = s, kw = M.kw, ku = M.ku, U = M.U, n = M.n;
    let qn = 0, dn = Infinity;                    // chain sample nearest the lens (the slide is towards it)
    if (k === 1) for (let q = 0; q < NQ; q++) { const d = Math.hypot(qA[2 * q] - C.x, qA[2 * q + 1] - C.y); if (d < dn) { dn = d; qn = q; } }
    for (let q = 0; q < NQ; q++) {
      const i = Math.min(Math.floor(q / SUB), n - 2), f = (q - i * SUB) / SUB;
      let ax = qA[2 * q], ay = qA[2 * q + 1];
      const dA = Math.hypot(ax - C.x, ay - C.y);
      // the fitted curves are only constrained where bubbles or digits were observed: fade them out beyond that
      const fd = dA <= FADE0 ? 1 : dA >= FADE1 ? 0 : 1 - sstep((dA - FADE0) / (FADE1 - FADE0));
      const w = tab(W, dA, kw) * fd, w2 = tab(W2, dA, kw) * fd, gr = tab(Gr, dA, kw) * fd, gt = tab(Gt, dA, kw) * fd;
      const ux = (ax - C.x) / Math.max(dA, 0.5), uy = (ay - C.y) / Math.max(dA, 0.5);
      far[q] = 0;
      const still = Math.max(0, 1 - 3 * (Math.abs(w) + Math.abs(w2)));     // 1 = this point is not displaced at all
      if (k === 1) {
        if (dA >= FAR_R) far[q] = 1;
        else if (still > 0) {
          const t = dA / SLIDE_R, slide = SLIDE * (1 - t * t * t * t) * still;
          baseAt(M.i0 + q / SUB + (q > qn ? -slide : slide), tmp); ax = tmp[0]; ay = tmp[1];
        }
      }
      // the undisplaced string leaves the panel through the bottom edge and keeps going down (see README)
      if (ax < DROP_X) ay += Math.max(0, 1 - Math.abs(w)) * (dropY + 0.5 * (DROP_X - ax) - ay);
      const x = ax + w * (D[i][0] + (D[i + 1][0] - D[i][0]) * f) + w2 * (E[i][0] + (E[i + 1][0] - E[i][0]) * f) + gr * ux - gt * uy;
      const y = ay + w * (D[i][1] + (D[i + 1][1] - D[i][1]) * f) + w2 * (E[i][1] + (E[i + 1][1] - E[i][1]) * f) + gr * uy + gt * ux;
      px[q] = x; py[q] = y;
      const u = Math.max(0, tab(U, Math.hypot(x - C.x, y - C.y), ku));
      uu[q] = u;
      const sz = u * tab(Sz, dA, kw);
      r[q] = (R[i] + (R[i + 1] - R[i]) * f) * sz;          // leaf radius (0 on the 0 digits, so leaves pinch there)
      rn[q] = q % SUB === 0 ? Rn[q / SUB] * sz : 0;         // disc on the 0 digits
    }
    if (RES) correct(s, C, k);
  }

  /* ---------- correction field ----------
     The shared law above is a few px off everywhere.  At every lens position seen in the recording the
     leftover shift / size error of each chain element was fitted too; here those corrections are blended
     over lens space (Gaussian kernel), and they vanish away from the recorded positions. */
  let RES = null;
  const resJ = [], resK = [];                    // active control points and their weights for the current lens
  function resWeights(C) {
    resJ.length = 0; resK.length = 0;
    const h2 = 2 * RES.h * RES.h; let sum = RES.eps;
    for (let j = 0; j < RES.c.length; j++) {
      const dx = RES.c[j][0] - C.x, dy = RES.c[j][1] - C.y, kj = Math.exp(-(dx * dx + dy * dy) / h2);
      sum += kj;
      if (kj > 1e-4) { resJ.push(j); resK.push(kj); }
    }
    for (let a = 0; a < resK.length; a++) resK[a] /= sum;
  }
  function correct(s, C, k) {
    const n = M.n, { px, py, r, rn, cdx, cdy, cl, cs, ca } = s, o = k * n;
    cdx.fill(0); cdy.fill(0); cl.fill(0); cs.fill(0); ca.fill(0); s.gap.fill(0);
    for (let a = 0; a < resJ.length; a++) {
      const j = resJ[a], w = resK[a], d = RES.d[j], l = RES.l[j], sn = RES.s[j], al = RES.a[j];
      for (let i = 0; i < n; i++) {
        cdx[i] += w * d[2 * (o + i)]; cdy[i] += w * d[2 * (o + i) + 1];
        cl[i] += w * l[o + i]; cs[i] += w * sn[o + i];
        if (RES.g) s.gap[i] += w * RES.g[j][o + i];
        if (PATTERN[(((M.i0 + i) % 5) + 5) % 5]) ca[i] += w * al[o + i];
      }
    }
    for (let q = 0; q < NQ; q++) {
      const i = Math.min(Math.floor(q / SUB), n - 2), f = (q - i * SUB) / SUB;
      px[q] += cdx[i] + (cdx[i + 1] - cdx[i]) * f; py[q] += cdy[i] + (cdy[i + 1] - cdy[i]) * f;
      const t = Math.hypot(px[q] - C.x, py[q] - C.y) / M.R1, inside = Math.max(0, 1 - t * t * t * t);
      r[q] = Math.max(0, r[q] * Math.exp(cl[i] + (cl[i + 1] - cl[i]) * f) + (ca[i] + (ca[i + 1] - ca[i]) * f) * inside);
      if (q % SUB === 0) rn[q] *= Math.exp(cs[q / SUB]);
    }
  }

  /* ---------- palette (sampled from the recording) ---------- */
  const mix = (a, b, t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const COL = {
    beige: [226, 211, 197], cyan: [130, 229, 207], green: [146, 219, 170], yellow: [215, 203, 142],
    orange: [220, 165, 126], orangeHi: [224, 184, 122], salmon: [220, 155, 137],
    magenta: [218, 131, 208], red: [214, 106, 135], pink: [212, 111, 161], white: [224, 215, 218],
    rimDark: [118, 128, 126], rimPink: [214, 140, 150], ink: [117, 116, 113], inkDeep: [90, 86, 104],
  };
  // flat body colour of a tube of radius r; family 0 cyan, 1 orange, 2 magenta (voted from the recording)
  function bodyColor(r, fam) {
    if (r < 3.4) return mix(COL.pink, COL.magenta, r / 3.4);
    if (fam === 2) return COL.magenta;
    if (fam === 1) return r < 8.5 ? mix(COL.magenta, COL.orange, (r - 3.4) / 5.1) : COL.orange;
    return r < 5.6 ? mix(COL.magenta, COL.salmon, (r - 3.4) / 2.2) : r < 8.8 ? mix(COL.salmon, COL.green, (r - 5.6) / 3.2) : mix(COL.green, COL.cyan, (r - 8.8) / 4.5);
  }

  // Colour along a ribbon, read off the recording: bubbles fade to a pale tip (orange through green and cyan),
  // thin leaves are magenta with red ends and a dark band where they pinch.
  const PALE = [233, 236, 226], DARK = [88, 90, 86], NECK = [128, 132, 124];
  function ribbonColor(r, fam, lmax) {
    if (fam === 2 || lmax < 4.2) {
      const t = r / Math.max(1.2, Math.min(lmax, 3.4));
      if (lmax < 1.6) return r < 1.2 ? mix(DARK, COL.magenta, 0.55) : COL.magenta;
      return t < 0.5 ? DARK : t < 0.62 ? mix(DARK, COL.red, (t - 0.5) / 0.12) : t < 0.86 ? mix(COL.red, COL.magenta, (t - 0.62) / 0.24) : COL.magenta;
    }
    if (r < 1.5) return r < 1.25 ? NECK : mix(NECK, PALE, (r - 1.25) / 0.25);
    if (fam === 1) {
      return r < 2.4 ? mix(PALE, COL.cyan, (r - 1.5) / 0.9) : r < 4 ? mix(COL.cyan, COL.green, (r - 2.4) / 1.6)
        : r < 6.8 ? mix(COL.green, COL.orange, (r - 4) / 2.8) : COL.orange;
    }
    return r < 2.6 ? mix(PALE, COL.green, (r - 1.5) / 1.1) : r < 4.2 ? mix(COL.green, COL.salmon, (r - 2.6) / 1.6)
      : r < 5.4 ? COL.salmon : mix(COL.salmon, COL.cyan, (r - 5.4) / 2.8);
  }

  const ribbonCache = new Map();
  function ribbonCss(r, fam, lmax) {                // colours only change over the first ~9 px of radius: cache by 0.2 px
    const rq = Math.min(48, Math.round(r * 5)), lq = lmax < 1.6 ? 0 : lmax < 4.2 ? Math.min(13, Math.round(lmax * 4)) : 14;
    const key = (fam * 15 + lq) * 64 + rq;
    let c = ribbonCache.get(key);
    if (!c) { c = css(ribbonColor(rq / 5, fam, lq === 14 ? 5 : lq === 0 ? 1 : lq / 4)); ribbonCache.set(key, c); }
    return c;
  }

  /* ---------- drawing ---------- */
  const TAU = Math.PI * 2;
  const disc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };
  const dot = (g, x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };

  // offscreen layers.  res = canvas px per CSS px; the soft layers are drawn small and upscaled, which
  // blurs them without ctx.filter (slow in software, missing in Safari).
  const lay = {};
  function layer(name, res = dpr) {
    let c = lay[name];
    if (!c) c = lay[name] = document.createElement('canvas');
    const w = Math.ceil(LB * res) + 1;
    if (c.width !== w || c.height !== w) { c.width = w; c.height = w; }
    const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, w, w);
    g.setTransform(res, 0, 0, res, -LX * res, -LY * res);
    return g;
  }
  const SOFT = 0.42;                              // soft-layer resolution: one pixel per 2.4 CSS px
  // the worn texture never moves, so it is rendered once and stamped inside the bubbles with one drawImage
  let tex = null;
  function texture() {
    const w = Math.ceil(VW * dpr), h = Math.ceil(VH * dpr);
    if (tex && tex.width === w && tex.height === h && tex.x0 === VX0 && tex.y0 === VY0) return tex;
    tex = document.createElement('canvas'); tex.width = w; tex.height = h; tex.x0 = VX0; tex.y0 = VY0;
    const g = tex.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, -VX0 * dpr, -VY0 * dpr);
    for (const k of ['milk', 'blush', 'grain']) { g.fillStyle = patterns()[k]; g.fillRect(VX0, VY0, VW, VH); }
    return tex;
  }

  // tileable textures for the worn look: milky blotches, a faint pink/green blush, fine grain
  let pats = null;
  function patterns() {
    if (pats) return pats;
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const blotch = (size, count, rgb, amax) => {
      const big = document.createElement('canvas'); big.width = big.height = size;
      const bg = big.getContext('2d');
      for (let i = 0; i < count; i++) {
        const x = rnd() * size, y = rnd() * size, r = size * (0.07 + rnd() * 0.13), al = amax * (0.35 + 0.65 * rnd());
        for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) {   // wrap so the tile repeats without a seam
          const cx = x + ix * size, cy = y + iy * size;
          if (cx < -r || cx > size + r || cy < -r || cy > size + r) continue;
          const g = bg.createRadialGradient(cx, cy, 0, cx, cy, r);
          g.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${al})`); g.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
          bg.fillStyle = g; bg.fillRect(cx - r, cy - r, 2 * r, 2 * r);
        }
      }
      return big;
    };
    const fine = document.createElement('canvas'); fine.width = fine.height = 128;
    const fg = fine.getContext('2d'), fd = fg.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i++) {
      const v = rnd(), lightp = v > 0.5;
      fd.data[i * 4] = fd.data[i * 4 + 1] = fd.data[i * 4 + 2] = lightp ? 255 : 60;
      fd.data[i * 4 + 3] = Math.abs(v - 0.5) * 2 * 14;
    }
    fg.putImageData(fd, 0, 0);
    const mk = (cv, scale) => { const p = ctx.createPattern(cv, 'repeat'); if (p.setTransform) p.setTransform(new DOMMatrix().scale(scale)); return p; };
    pats = {
      milk: mk(blotch(320, 26, [244, 250, 244], 0.3), 0.5),
      blush: mk(blotch(288, 14, [238, 196, 208], 0.2), 0.62),
      grain: mk(fine, 0.5),
    };
    return pats;
  }

  // after a click the recording holds the lens ~8 steps while the outer, then the inner ring turn solid red
  let flashStep = -1;
  function drawFlash(C) {
    if (flashStep < 0 || flashStep > 4) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(186,104,116,0.95)'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(C.x, C.y, flashStep < 2 ? M.rings[3] : M.rings[0], 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawRings(C) {
    ctx.save();
    ctx.setLineDash([DOT, DOT_PITCH - DOT]);
    for (const pass of [0, 1]) {                // yellow fringe first, then the dark dot
      ctx.strokeStyle = pass ? css(COL.ink) : 'rgba(232,238,170,0.75)';
      ctx.lineWidth = pass ? DOT : DOT + 0.5;
      for (const r of M.rings) { ctx.beginPath(); ctx.arc(C.x + (pass ? 0 : 0.6), C.y + (pass ? 0 : 0.6), r, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }

  // the crosshair shifts hue with what is underneath (grey on the panel, violet on cyan, teal on warm);
  // hueAt(x, y) answers that from the bubbles just laid out, so nothing is read back from the canvas
  const CROSS = { cyan: [126, 98, 170], warm: [72, 138, 122] };
  function drawCross(C, hueAt) {
    const h = DOT / 2;
    for (let i = -3; i <= 3; i++) {
      for (const [x, y] of i ? [[C.x + i * DOT_PITCH, C.y], [C.x, C.y + i * DOT_PITCH]] : [[C.x, C.y]]) {
        ctx.fillStyle = css(CROSS[hueAt(x, y)] || COL.inkDeep, 0.96); ctx.fillRect(x - h, y - h, DOT, DOT);
      }
    }
  }

  function drawStatic() {
    for (const x of [384.5, 881]) {             // vertical guides: thin dark core with a pink fringe
      ctx.fillStyle = 'rgba(226,150,208,0.5)'; ctx.fillRect(x, VY0, 1.7, VH);
      ctx.fillStyle = 'rgba(126,106,110,0.92)'; ctx.fillRect(x - 0.55, VY0, 0.65, VH);
    }
    ctx.save();                                 // target
    ctx.strokeStyle = 'rgba(126,130,126,0.95)'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(632.5, 117.5, 5.6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(632.5, 117.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // digits: hollow outlined glyphs on the panel; inside a bubble they become faint light fills
  function glyph(d, x, y, r) {
    // glyph box measured in the recording: a 0 is 6.5 x 9.5 px including its outline
    ctx.beginPath();
    if (d === 0) {
      ctx.ellipse(x, y, 2.75, 4.2, 0, 0, Math.PI * 2);
      ctx.moveTo(x + 1.45, y);
      ctx.ellipse(x, y, 1.45, 2.9, 0, 0, Math.PI * 2, true);
    } else {
      ctx.moveTo(x - 2.5, y + 4.2); ctx.lineTo(x + 2.5, y + 4.2); ctx.lineTo(x + 2.5, y + 3.05);
      ctx.lineTo(x + 0.7, y + 3.05); ctx.lineTo(x + 0.7, y - 4.2); ctx.lineTo(x - 0.35, y - 4.2);
      ctx.lineTo(x - 2.4, y - 2.65); ctx.lineTo(x - 1.85, y - 1.8); ctx.lineTo(x - 0.7, y - 2.65);
      ctx.lineTo(x - 0.7, y + 3.05); ctx.lineTo(x - 2.5, y + 3.05); ctx.closePath();
    }
    if (r > 4.5) {
      const a = r < 9 ? 0.42 : Math.max(0, 0.42 - (r - 9) * 0.07);
      if (a > 0.02) { ctx.fillStyle = `rgba(255,248,230,${a.toFixed(3)})`; ctx.fill('evenodd'); }
    } else { ctx.fillStyle = 'rgba(232,242,230,0.92)'; ctx.fill('evenodd'); ctx.stroke(); }
  }


  function render(C) {
    ctx.setTransform(dpr, 0, 0, dpr, -VX0 * dpr, -VY0 * dpr);
    ctx.clearRect(VX0, VY0, VW, VH);
    LX = VX0 + Math.floor((C.x - LB / 2 - VX0) * dpr) / dpr; LY = VY0 + Math.floor((C.y - LB / 2 - VY0) * dpr) / dpr;
    if (!M) return;
    const strands = M.strands;
    const vis = (x, y, r) => !(x < VX0 - r - 4 || x > VX0 + VW + r + 4 || y < VY0 - r - 4 || y > VY0 + VH + r + 4);
    // stamps [x, y, r, family]: leaves along the 1s, lobes = fattest point of each leaf, nodes = discs on the 0s
    const leaves = [], lobes = [], nodes = [], digits = [];
    if (RES) resWeights(C);
    strands.forEach((s, k) => {
      buildStrand(s, C, k);
      const { px, py, r, rn, uu, far, tl, tn, lm } = s;
      // inside the inner ring the strand never breaks: a thin stem joins the leaves and discs
      let q0 = 0, mx = 0;
      for (let q = 0; q < NQ; q++) {
        // ...except on the few segments where the recording shows it broken
        const st = STEM * sstep((uu[q] - 0.3) / 0.14) * (1 - sstep(s.gap[Math.min(Math.floor(q / SUB), M.n - 1)] * 2));
        if (r[q] < st) r[q] = st;
        const zero = q % SUB === 0 && PATTERN[(((M.i0 + q / SUB) % 5) + 5) % 5] === 0;
        if (zero || q === NQ - 1) { if (r[q] > mx) mx = r[q]; for (let j = q0; j <= q; j++) lm[j] = mx; q0 = q; mx = 0; }
        if (r[q] > mx) mx = r[q];
      }
      let best = null;
      for (let q = 0; q < NQ; q++) {
        const i = Math.min(Math.floor(q / SUB), M.n - 1);
        if (q % SUB === 0) {
          const n = M.i0 + i, d = PATTERN[((n % 5) + 5) % 5];
          if (!far[q] && vis(px[q], py[q], 8)) digits.push([px[q], py[q], d, d ? r[q] : rn[q], uu[q]]);
          if (d === 0) {
            // only the large discs read as discs; a small one is just a swelling of the ribbon
            if (rn[q] >= NODE_MIN) { if (vis(px[q], py[q], rn[q])) nodes.push([px[q], py[q], rn[q], tn[i], Math.max(q > 0 ? r[q - 1] : 0, q < NQ - 1 ? r[q + 1] : 0) / rn[q]]); }
            else if (rn[q] >= THIN && vis(px[q], py[q], rn[q])) leaves.push([px[q], py[q], rn[q], tl[Math.min(i + 1, M.n - 1)], Math.max(lm[q], rn[q])]);
            if (best && best[2] > 5.5 && vis(best[0], best[1], best[2])) lobes.push(best);
            best = null;
          }
        }
        if (q === NQ - 1 || (r[q] < THIN && r[q + 1] < THIN)) continue;
        // a leaf takes the family of the 1 digit it hangs on
        const fam = tl[PATTERN[(((M.i0 + i) % 5) + 5) % 5] ? i : Math.min(i + 1, M.n - 1)];
        const x0 = px[q], y0 = py[q], x1 = px[q + 1], y1 = py[q + 1];
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(1.4, 0.22 * Math.max(r[q], r[q + 1]))));
        for (let j = 0; j < steps; j++) {
          const t = j / steps, rr = r[q] + (r[q + 1] - r[q]) * t;
          if (rr < THIN) continue;
          const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
          if (!best || rr > best[2]) best = [x, y, rr, fam];
          if (vis(x, y, rr)) leaves.push([x, y, rr, fam, Math.max(lm[q], lm[q + 1])]);
        }
      }
    });
    if (ORDER === 'chain') { /* as built: strand 0..2, along the chain */ }
    else if (ORDER === 'rchain') nodes.reverse();
    else if (ORDER === 'rdesc') nodes.sort((a, b) => b[2] - a[2]);
    else nodes.sort((a, b) => a[2] - b[2]);      // small first, so large discs read as clean circles
    lobes.sort((a, b) => a[2] - b[2]);
    // orange sits on top of cyan and magenta, except its thin stems, which pass underneath the discs
    const orange = (e) => e[3] === 1 && !(e.length > 4 && e[2] < 2.6), under = (e) => !orange(e);
    const rims = (...lists) => {                 // dark crescent lower-left, pink edge upper-right: one path, filled twice
      const path = new Path2D();
      for (const list of lists) for (const [x, y, r] of list) { path.moveTo(x + r + 0.28, y); path.arc(x, y, r + 0.28, 0, TAU); }
      ctx.save();
      ctx.translate(-0.75, 0.75); ctx.fillStyle = css(COL.rimDark); ctx.fill(path);
      ctx.translate(1.2, -1.2); ctx.fillStyle = css(COL.rimPink); ctx.fill(path);
      ctx.restore();
    };
    // ribbon stamps: consecutive stamps of the same colour go into one path (order is kept)
    const ribbon = (g, list) => {
      let cur = '';
      for (const [x, y, r, fam, lmax] of list) {
        const c = ribbonCss(r, fam, lmax);
        if (c !== cur) { if (cur) g.fill(); cur = c; g.fillStyle = c; g.beginPath(); }
        g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
      }
      if (cur) g.fill();
    };

    // 0. fine dotted thread joining the digits just inside the inner ring, before the leaves open
    ctx.save();
    ctx.strokeStyle = 'rgba(104,132,146,0.85)'; ctx.lineWidth = 0.9; ctx.setLineDash([0.9, 2.3]);
    for (const s of strands) {
      ctx.beginPath();
      let pen = false;
      for (let q = 0; q < NQ; q++) {
        const on = s.uu[q] > 0.004 && s.uu[q] < 0.34;
        if (on) { if (pen) ctx.lineTo(s.px[q], s.py[q]); else ctx.moveTo(s.px[q], s.py[q]); }
        pen = on;
      }
      ctx.stroke();
    }
    ctx.restore();

    const inDisc = (e, x, y, k = 1) => { const dx = x - e[0], dy = y - e[1], r = e[2] * k; return dx * dx + dy * dy < r * r; };
    const hueAt = (x, y) => {
      for (let i = nodes.length - 1; i >= 0; i--) { const e = nodes[i]; if (e[3] === 1 && inDisc(e, x, y)) return 'warm'; }
      for (const e of leaves) if (e[3] === 1 && e[2] >= 4 && inDisc(e, x, y)) return 'warm';
      for (let i = nodes.length - 1; i >= 0; i--) {
        const e = nodes[i]; if (e[3] === 1 || !inDisc(e, x, y)) continue;
        if (e[3] === 2) return 'warm';
        return e[2] >= 16 && e[4] < 0.4 && inDisc(e, x, y, 0.7) ? 'core' : 'cyan';       // beige cores read grey
      }
      for (const e of leaves) if (e[3] !== 1 && inDisc(e, x, y)) { if (e[3] === 2 || e[4] < 4.2) return 'warm'; if (e[2] > 5) return 'cyan'; }
      return 'none';
    };

    // --- bubbles -----------------------------------------------------------------------------
    // Crisp silhouettes, washed interiors: the soft cores, milky patches and grain are painted on a
    // separate layer, blurred, and kept inside the silhouette (source-atop).
    const hash = (x, y, k) => { const v = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v); };
    const wash = (g, paint) => {                  // paint(t) -> soft layer t, composited inside g's shapes
      const t = layer('t', SOFT); painted = false; paint(t);
      if (!painted) return;
      g.save(); g.globalCompositeOperation = 'source-atop'; g.imageSmoothingEnabled = true;
      if (bw > 0 && bh > 0) blit(g, lay.t, SOFT, LX, LY);
      g.restore();
    };
    // everything below only touches the rectangle the bubbles occupy (snapped to device pixels)
    let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
    for (const list of [leaves, nodes]) for (const e of list) {
      if (e[0] - e[2] < bx0) bx0 = e[0] - e[2]; if (e[0] + e[2] > bx1) bx1 = e[0] + e[2];
      if (e[1] - e[2] < by0) by0 = e[1] - e[2]; if (e[1] + e[2] > by1) by1 = e[1] + e[2];
    }
    const some = bx1 > bx0;
    if (some) overshoot = Math.max(overshoot, LX - bx0, LY - by0, bx1 - LX - LB, by1 - LY - LB);   // > 0 would mean a clipped bubble
    bx0 = VX0 + Math.floor((Math.max(VX0, LX, bx0 - 3) - VX0) * dpr) / dpr; by0 = VY0 + Math.floor((Math.max(VY0, LY, by0 - 3) - VY0) * dpr) / dpr;
    bx1 = VX0 + Math.ceil((Math.min(VX0 + VW, LX + LB, bx1 + 3) - VX0) * dpr) / dpr; by1 = VY0 + Math.ceil((Math.min(VY0 + VH, LY + LB, by1 + 3) - VY0) * dpr) / dpr;
    const bw = bx1 - bx0, bh = by1 - by0;
    // draw that rectangle of src (a canvas whose origin is ox, oy at res px per panel px) onto g
    const blit = (g, src, res, ox, oy) => g.drawImage(src, (bx0 - ox) * res, (by0 - oy) * res, bw * res, bh * res, bx0, by0, bw, bh);
    let painted = false;
    const stamp = (g, x, y, r, stops) => {
      painted = true;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      for (const [o, c, al] of stops) gr.addColorStop(o, css(c, al));
      g.fillStyle = gr; dot(g, x, y, r);
    };
    const MAG = [[0, COL.white, 1], [0.07, COL.white, 1], [0.1, [214, 178, 180], 1], [0.13, [217, 152, 152], 1], [0.17, COL.red, 1],
      [0.5, COL.red, 1], [0.58, [216, 113, 150], 1], [0.66, [218, 119, 165], 1], [0.74, [218, 122, 185], 1], [0.82, [218, 128, 203], 0.9], [0.92, [217, 134, 209], 0]];
    const ORA = [[0, [220, 165, 126], 0.92], [0.6, [221, 170, 123], 0.92], [0.85, [217, 163, 140], 0.92], [1, [214, 165, 150], 0.92]];

    // 1. cyan and magenta: leaves, then the discs on the 0s
    const uLeaves = leaves.filter(under), uNodes = nodes.filter(under);
    if (uLeaves.length || uNodes.length) rims(uLeaves, uNodes);
    const ga = layer('a');
    ribbon(ga, uLeaves);
    for (const [x, y, r, fam] of uNodes) { ga.fillStyle = css(fam === 0 && r >= 10.5 ? COL.cyan : bodyColor(r, fam)); dot(ga, x, y, r); }
    wash(ga, (t) => {
      for (const [x, y, r, fam] of lobes) {
        if (fam === 0 && r >= 9) {                // teardrops: a pale heart where they are fattest
          stamp(t, x, y, r * 0.8, [[0, COL.beige, r > 14 ? 0.8 : 0.35], [0.45, COL.beige, r > 14 ? 0.6 : 0.2], [1, COL.beige, 0]]);
        } else if (fam === 2 && r >= 9) stamp(t, x, y, r, MAG);
      }
      for (const [x, y, r, fam, tube] of uNodes) {
        if (r < 4) continue;
        if (fam === 2) { stamp(t, x, y, r, MAG); continue; }    // magenta disc: white heart, salmon and red bands
        if (r < 10.5) continue;
        // In the recording a cyan disc has a beige core 76% of the time above 30 px radius, 30% at 20-30 px,
        // ~12% below, and hardly ever when it is just the fat part of a tube (tools/analysis/tcore.py).
        const core = sstep((r - 11.5) / 8) * (1 - sstep((tube - 0.4) / 0.4));
        const c = 1 - Math.min(0.45, 6.5 / r + 0.02);
        // each disc hides the ones painted before it; beige core with a soft, slightly off-centre edge
        const ox = (hash(x, y, 1) - 0.5) * r * 0.1, oy = (hash(x, y, 2) - 0.5) * r * 0.1;
        stamp(t, x, y, r, [[0, COL.cyan, 1], [0.86, COL.cyan, 1], [1, COL.cyan, 0]]);
        if (core > 0.04) stamp(t, x + ox, y + oy, r * (c + 0.03), [[0, COL.beige, 0.97 * core], [0.8, COL.beige, 0.95 * core], [1, COL.beige, 0]]);
        stamp(t, x, y, r, [[0, COL.green, 0], [0.9, COL.green, 0], [0.96, COL.green, 0.55], [1, COL.yellow, 0.8]]);
        const an = hash(x, y, 3) * 6.283, rr = r * (0.55 + 0.3 * hash(x, y, 4));           // milky patch on the ring
        stamp(t, x + Math.cos(an) * rr, y + Math.sin(an) * rr, r * 0.42, [[0, [240, 248, 240], 0.55], [1, [240, 248, 240], 0]]);
        const an2 = an + 2.2 + hash(x, y, 6) * 1.8, r2 = r * (0.62 + 0.2 * hash(x, y, 7));   // ghost of another core
        if (core > 0.04) stamp(t, x + Math.cos(an2) * r2, y + Math.sin(an2) * r2, r * 0.3, [[0, COL.beige, 0.5 * core], [0.6, COL.beige, 0.35 * core], [1, COL.beige, 0]]);
      }
    });

    // 2. orange leaves and discs sit on top
    const oLeaves = leaves.filter(orange), oNodes = nodes.filter(orange);
    if (oLeaves.length || oNodes.length) rims(oLeaves, oNodes);
    const gb = layer('b');
    ribbon(gb, oLeaves);
    for (const [x, y, r, fam] of oNodes) { gb.fillStyle = css(bodyColor(r, fam)); dot(gb, x, y, r); }
    wash(gb, (t) => {
      for (const [x, y, r, fam] of lobes.concat(oNodes)) {
        if (fam !== 1 || r < 5.5) continue;
        stamp(t, x, y, r, ORA);
        const an = hash(x, y, 5) * 6.283;        // pale highlight, as where a leaf pinches into a magenta heart
        stamp(t, x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.6, r * 0.3, [[0, [246, 232, 214], 0.4], [1, [246, 232, 214], 0]]);
      }
    });

    // white hearts of the large magenta discs stay visible on top of the orange
    gb.save(); gb.globalCompositeOperation = 'source-atop';
    for (const [x, y, r, fam] of nodes.concat(lobes)) {
      if (fam !== 2 || r < 17) continue;
      const hr = Math.min(7.5, r * 0.11);
      stamp(gb, x, y, hr * 2.6, [[0, COL.white, 0.95], [0.36, COL.white, 0.92], [0.45, [228, 190, 190], 0.75], [0.7, [222, 160, 160], 0.4], [1, [222, 160, 160], 0]]);
    }
    gb.restore();

    // orange over the rest, the worn texture inside everything, then one blit to the screen
    if (some && bw > 0 && bh > 0) {
      blit(ga, lay.b, dpr, LX, LY);
      ga.save(); ga.globalCompositeOperation = 'source-atop'; blit(ga, texture(), dpr, VX0, VY0); ga.restore();
      blit(ctx, lay.a, dpr, LX, LY);
    }

    drawStatic();
    drawRings(C);
    drawFlash(C);
    ctx.lineWidth = 0.55; ctx.strokeStyle = css([96, 98, 94]);
    for (const [x, y, d, r, u] of digits) {
      // deep inside the lens the digits are gone: they only show on the outer part of the ribbon
      const al = 1 - sstep((u - 0.52) / 0.24);
      if (al < 0.03) continue;
      ctx.globalAlpha = al;
      // digits swallowed by a large disc are not visible in the recording
      let hidden = false;
      for (let i = nodes.length - 1; i >= 0 && !hidden; i--) {
        const nd = nodes[i]; if (nd[2] < 10.5) break;
        if (Math.hypot(x - nd[0], y - nd[1]) < nd[2] * 0.93) hidden = true;
      }
      if (!hidden) glyph(d, x, y, r);
    }
    ctx.globalAlpha = 1;
    drawCross(C, hueAt);

    if (DEBUG) {
      const cols = ['#00f', '#080', '#f00'];
      strands.forEach((s, k) => {
        ctx.strokeStyle = cols[k]; ctx.lineWidth = 0.8; ctx.beginPath();
        for (let q = 0; q < NQ; q++) (q ? ctx.lineTo(s.px[q], s.py[q]) : ctx.moveTo(s.px[q], s.py[q]));
        ctx.stroke();
      });
    }
  }

  /* ---------- loop ---------- */
  let lastStep = 0, clicked = null;
  panel.addEventListener('mouseup', (e) => { const r = canvas.getBoundingClientRect(); clicked = { x: (e.clientX - r.left) / scale + VX0, y: (e.clientY - r.top) / scale + VY0 }; });
  let lastNow = 0, flashT0 = 0;
  function tick(now) {
    const dt = lastNow ? Math.min(100, now - lastNow) : 16; lastNow = now;
    if (STEPPED) {
      let p = null;
      if (now - lastStep >= STEP_MS) {
        lastStep = now - ((now - lastStep) % STEP_MS);
        if (clicked) { p = clicked; clicked = null; flashStep = 0; dirty = true; }
        else if (flashStep >= 0) { flashStep = flashStep >= 7 ? -1 : flashStep + 1; dirty = true; }
        else p = pointerAt(now - LAG_MS);
      }
      if (p) {
        const nx = p.x + OFFSET.x, ny = p.y + OFFSET.y;
        if (nx !== lens.x || ny !== lens.y) { lens = { x: nx, y: ny }; dirty = true; }
      }
    } else {
      if (clicked) { lens = { x: clicked.x + OFFSET.x, y: clicked.y + OFFSET.y }; clicked = null; flashT0 = now; flashStep = 0; dirty = true; }
      if (flashStep >= 0) {                        // the lens holds while the rings flash, as in the recording
        const st = Math.floor((now - flashT0) / STEP_MS), next = st > 7 ? -1 : st;
        if (next !== flashStep) { flashStep = next; dirty = true; }
      } else {
        const p = hist[hist.length - 1];
        if (p) {
          const tx = p.x + OFFSET.x, ty = p.y + OFFSET.y, k = 1 - Math.exp(-dt / EASE_MS);
          let nx = lens.x + (tx - lens.x) * k, ny = lens.y + (ty - lens.y) * k;
          if (Math.abs(tx - nx) < 0.05 && Math.abs(ty - ny) < 0.05) { nx = tx; ny = ty; }
          if (nx !== lens.x || ny !== lens.y) { lens = { x: nx, y: ny }; dirty = true; }
        }
      }
    }
    if (dirty) {
      dirty = false;
      const t0 = performance.now(); render(lens); cost += performance.now() - t0;
      if (++drawn >= 24) { if (cost / drawn > 14 && quality > 0.5) { quality -= 0.25; fit(); } drawn = 0; cost = 0; }
    }
    requestAnimationFrame(tick);
  }
  let drawn = 0, cost = 0;

  // test hook: render a given lens position immediately
  window.__rd = { setLens(x, y) { lens = { x, y }; hist.length = 0; render(lens); }, get lens() { return lens; }, get overshoot() { return overshoot; } };

  window.addEventListener('resize', fit);
  const V = (document.currentScript && document.currentScript.src.split('?')[1]) || '';      // cache-busting tag, if the page gave one
  const ver = (u) => (V ? `${u}?${V}` : u);
  const useRes = !new URLSearchParams(location.search).has('nores');    // ?nores = shared law only
  Promise.all([
    fetch(ver('model.json')).then((r) => r.json()),
    useRes ? fetch(ver('residual.json')).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null,
  ]).then(([m, res]) => { prepare(m); if (res && res.n === m.n) RES = res; fit(); window.__rd.ready = true; requestAnimationFrame(tick); });
})();
