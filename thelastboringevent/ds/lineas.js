/* The Last Boring Event · background lines (window.LINEAS)
   Only the chart grid's line: grey, 1px, dashed 4/4. Drawn in an SVG layer behind the page
   (z-index -1), sized to the whole document, redrawn on resize. Works on /04-shaped pages:
   .load .dlg (hero dialog), main.list .row (speakers), .pie .pozo (footer), .brand (logo).

   LINEAS.margenes({step, gap, col})  a grid only in the side margins (squares of `step` px, `gap` px from the column)
   LINEAS.hover()     lines appear through a speaker when you point at them
   LINEAS.raices()    roots that mark where each section starts
   LINEAS.sauce()     the same roots let loose, hanging over the page like a willow
   LINEAS.contornos() contour lines around the content, like a map
   LINEAS.semilog()   semi-log graph paper: log columns, rows that double going down
   LINEAS.futuros()   a fan of doubling curves rising from the footer
   LINEAS.mira()      a crosshair that follows the pointer
   LINEAS.hilo()      one thread through every face, from the bar to the footer */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const STROKE = '#cfcfcf', DASH = '4 4';
  const el = (t, a = {}, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const R = (n) => { const r = n.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const $$ = (s) => [...document.querySelectorAll(s)];
  const rnd = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const line = (g, x1, y1, x2, y2, extra = {}) => el('line', { x1, y1, x2, y2, stroke: STROKE, 'stroke-width': 1, 'stroke-dasharray': DASH, 'shape-rendering': 'crispEdges', ...extra }, g);
  const path = (g, d, extra = {}) => el('path', { d, fill: 'none', stroke: STROKE, 'stroke-width': 1, 'stroke-dasharray': DASH, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra }, g);
  // smooth path through points (Catmull-Rom → cubic Bézier)
  const smooth = (pts) => {
    if (pts.length < 2) return '';
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };

  /** the layer + a redraw loop; draw(svg, W, H) */
  function mount(draw) {
    const s = el('svg', { 'aria-hidden': 'true' });
    Object.assign(s.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', zIndex: '-1', overflow: 'visible' });
    document.body.style.position = 'relative';
    document.body.prepend(s);
    let last = '';
    const run = () => {
      const W = document.documentElement.clientWidth, H = document.documentElement.scrollHeight;
      const key = W + 'x' + H;
      if (key === last) return;
      last = key;
      s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      s.innerHTML = '';
      draw(s, W, H);
    };
    let t;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(run, 80); }).observe(document.body);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(run, 60));
    return { svg: s, redraw: () => { last = ''; run(); } };
  }

  // 1 · a grid only in the side margins, centred on the column so both sides match
  function margenes({ step = 48, gap = 40, col: sel = 'main.list' } = {}) {
    mount((s, W, H) => {
      const col = R(document.querySelector(sel));
      const cx = col.x + col.w / 2, half = col.w / 2 + gap;
      if (cx - half < step) return;
      for (let k = 0; ; k++) {
        const off = half + k * step;
        if (cx - off < 8) break;
        line(s, Math.round(cx - off) + 0.5, 0, Math.round(cx - off) + 0.5, H);
        line(s, Math.round(cx + off) + 0.5, 0, Math.round(cx + off) + 0.5, H);
      }
      for (let y = step; y < H; y += step) {
        line(s, 0, y + 0.5, Math.round(cx - half) + 0.5, y + 0.5);
        line(s, Math.round(cx + half) + 0.5, y + 0.5, W, y + 0.5);
      }
    });
  }

  // 2 · pointing at a speaker draws the grid through them, out to the page edges
  function hover() {
    const css = document.createElement('style');
    css.textContent = '.lin-h{opacity:0;transition:opacity .25s}.lin-h.on{opacity:1}@media (prefers-reduced-motion:reduce){.lin-h{transition:none}}';
    document.head.appendChild(css);
    let groups = [];
    mount((s, W, H) => {
      groups = $$('main.list .row').map((row) => {
        const g = el('g', { class: 'lin-h' }, s);
        const r = R(row), f = R(row.querySelector('.f') || row);
        line(g, 0, Math.round(r.y - 6) + 0.5, W, Math.round(r.y - 6) + 0.5);
        line(g, 0, Math.round(r.y + r.h + 6) + 0.5, W, Math.round(r.y + r.h + 6) + 0.5);
        line(g, Math.round(f.x) + 0.5, 0, Math.round(f.x) + 0.5, H);
        line(g, Math.round(f.x + f.w) + 0.5, 0, Math.round(f.x + f.w) + 0.5, H);
        return g;
      });
    });
    $$('main.list .row').forEach((row, i) => {
      const on = () => groups.forEach((g, j) => g.classList.toggle('on', j === i));
      row.addEventListener('pointerenter', on);
      row.addEventListener('pointerleave', () => groups[i] && groups[i].classList.remove('on'));
      row.addEventListener('touchstart', on, { passive: true });
    });
  }

  // 3 · roots: a taproot from the bar, then a band of roots where each section begins.
  //     Laterals run almost level to the page edges; short rootlets hang from them.
  function raices() {
    mount((s, W, H) => {
      const r = rnd(26);
      const bar = R(document.querySelector('.load .bar'));
      const load = R(document.querySelector('.load'));
      const list = R(document.querySelector('main.list'));
      const pie = R(document.querySelector('.pie') || document.querySelector('.end'));
      const STEP = 6;
      const out = [];
      // grow toward `target` (radians) with strength `pull`
      const grow = (x, y, ang, len, target, pull, depth, kids) => {
        const pts = [[x, y]];
        let a = ang;
        for (let d = 0; d < len; d += STEP) {
          a += (r() - 0.5) * 0.28;
          a += (target - a) * pull;
          x += Math.cos(a) * STEP; y += Math.sin(a) * STEP;
          pts.push([x, y]);
          if (x < -30 || x > W + 30) break;
          if (depth > 0 && d > 24 && r() < kids) {
            const l = 18 + r() * 54;
            grow(x, y, Math.PI / 2 + (r() - 0.5) * 1.1, l, Math.PI / 2 + (r() - 0.5) * 0.6, 0.12, depth - 1, kids * 0.8);
          }
        }
        out.push(pts);
      };
      const band = (y) => {
        const x0 = W / 2 + (r() - 0.5) * 30;
        grow(x0, y, Math.PI + 0.1, W, Math.PI - 0.08, 0.06, 1, 0.045);   // left, sagging a little
        grow(x0, y, -0.1, W, 0.08, 0.06, 1, 0.045);                       // right
      };
      const yA = Math.min(load.y + load.h - 30, list.y - 30);
      grow(bar.x + bar.w / 2, bar.y + bar.h + 44, Math.PI / 2, Math.max(30, yA - bar.y - bar.h - 44), Math.PI / 2, 0.2, 1, 0.05);
      band(yA);
      band(list.y + list.h + Math.max(24, (pie.y - list.y - list.h) * 0.5));
      out.forEach((pts) => path(s, smooth(pts)));
    });
  }

  // 3b · willow: the same roots, let loose; long strands hang over the whole page
  function sauce() {
    mount((s, W, H) => {
      const r = rnd(26);
      const bar = R(document.querySelector('.load .bar'));
      const load = R(document.querySelector('.load'));
      const list = R(document.querySelector('main.list'));
      const pie = R(document.querySelector('.pie') || document.querySelector('.end'));
      const STEP = 7, out = [];
      const grow = (x, y, ang, len, depth, pull) => {
        const pts = [[x, y]];
        let a = ang;
        for (let d = 0; d < len; d += STEP) {
          a += (r() - 0.5) * 0.32;
          a += (Math.PI / 2 - a) * pull;
          x += Math.cos(a) * STEP; y += Math.sin(a) * STEP;
          pts.push([x, y]);
          if (x < -40 || x > W + 40) break;
          if (depth > 0 && d > 18 && r() < 0.045 * depth) {
            const side = r() < 0.5 ? -1 : 1;
            grow(x, y, a + side * (0.5 + r() * 0.5), len * (0.25 + r() * 0.3), depth - 1, Math.min(0.2, pull + 0.05));
          }
        }
        out.push(pts);
      };
      const yA = Math.min(load.y + load.h - 24, list.y - 8);
      grow(bar.x + bar.w / 2, bar.y + bar.h + 40, Math.PI / 2, Math.max(40, yA - bar.y - 60), 2, 0.08);
      const band = (y, len) => { const x0 = W / 2 + (r() - 0.5) * 40; grow(x0, y, Math.PI + 0.06, len, 3, 0.004); grow(x0, y, -0.06, len, 3, 0.004); };
      band(yA, W * 0.62);
      band(list.y + list.h + Math.max(20, (pie.y - list.y - list.h) * 0.45), W * 0.62);
      out.forEach((pts) => path(s, smooth(pts)));
    });
  }

  // 4 · contour lines around every block of content, like a relief map (marching squares)
  function contornos() {
    mount((s, W, H) => {
      const blocks = [...$$('.load .dlg'), ...$$('main.list .row'), ...$$('.pie .pozo'), ...$$('.pie .pie-cap'), ...$$('.brand')].map(R);
      const C = W < 600 ? 10 : 14, sig = W < 600 ? 46 : 84;
      const nx = Math.ceil(W / C) + 1, ny = Math.ceil(H / C) + 1;
      const F = new Float32Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = i * C, y = j * C; let v = 0;
        for (const b of blocks) {
          const dx = Math.max(b.x - x, 0, x - b.x - b.w), dy = Math.max(b.y - y, 0, y - b.y - b.h);
          const d2 = dx * dx + dy * dy;
          if (d2 < 9 * sig * sig) v += Math.exp(-d2 / (sig * sig));
        }
        F[j * nx + i] = v;
      }
      const levels = [0.06, 0.16, 0.32, 0.56, 0.9];
      for (const lv of levels) {
        const segs = [];
        for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
          const a = F[j * nx + i], b = F[j * nx + i + 1], c = F[(j + 1) * nx + i + 1], d = F[(j + 1) * nx + i];
          const idx = (a > lv) | ((b > lv) << 1) | ((c > lv) << 2) | ((d > lv) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = i * C, y = j * C;
          const T = [x + C * (lv - a) / (b - a), y], Rr = [x + C, y + C * (lv - b) / (c - b)], B = [x + C * (lv - d) / (c - d), y + C], L = [x, y + C * (lv - a) / (d - a)];
          const map = { 1: [[L, T]], 2: [[T, Rr]], 3: [[L, Rr]], 4: [[Rr, B]], 5: [[L, T], [Rr, B]], 6: [[T, B]], 7: [[L, B]], 8: [[B, L]], 9: [[B, T]], 10: [[T, Rr], [B, L]], 11: [[B, Rr]], 12: [[Rr, L]], 13: [[Rr, T]], 14: [[T, L]] };
          map[idx].forEach((sg) => segs.push(sg));
        }
        // join segments into polylines so the dashes run continuously
        const key = (p) => p[0].toFixed(1) + ',' + p[1].toFixed(1);
        const ends = new Map();
        segs.forEach((sg, k) => { [0, 1].forEach((e) => { const kk = key(sg[e]); (ends.get(kk) || ends.set(kk, []).get(kk)).push([k, e]); }); });
        const used = new Uint8Array(segs.length);
        for (let k = 0; k < segs.length; k++) {
          if (used[k]) continue;
          used[k] = 1;
          const pts = [segs[k][0], segs[k][1]];
          for (const dir of [1, 0]) {
            for (;;) {
              const tip = dir ? pts[pts.length - 1] : pts[0];
              const nxt = (ends.get(key(tip)) || []).find(([m]) => !used[m]);
              if (!nxt) break;
              used[nxt[0]] = 1;
              const p = segs[nxt[0]][1 - nxt[1]];
              dir ? pts.push(p) : pts.unshift(p);
            }
          }
          if (pts.length > 3) path(s, smooth(pts.filter((_, n) => n % 2 === 0 || n === pts.length - 1)));
        }
      }
    });
  }

  // 5 · semi-log graph paper: decade columns (1–9 ×10ⁿ) across, rows that double going down
  function semilog() {
    mount((s, W, H) => {
      const decades = W < 600 ? 2 : 4, dw = W / decades;
      for (let d = 0; d < decades; d++) for (let m = 1; m <= 9; m++) {
        const x = Math.round(d * dw + Math.log10(m) * dw) + 0.5;
        line(s, x, 0, x, H, m === 1 ? { stroke: '#c4c4c4' } : {});
      }
      let gap = 6, y = 0;
      while (y < H) { y += gap; line(s, 0, Math.round(y) + 0.5, W, Math.round(y) + 0.5); gap *= 2; if (gap > 640) gap = 6; }
    });
  }

  // 6 · futures: a fan of doubling curves, flat along the footer's top, each shooting up at its own moment
  function futuros() {
    mount((s, W, H) => {
      const pozo = document.querySelector('.pie .pozo');
      const oy = pozo ? R(pozo).y : H - 300;
      const n = 9;
      for (let i = 0; i < n; i++) {
        const xe = W * (0.28 + 0.72 * (i / (n - 1)));   // where this future hits the top of the page
        const k = 6.5 + (i % 3) * 1.2;                   // how sudden it is
        const pts = [];
        for (let t = 0; t <= 1.0001; t += 0.01) pts.push([t * xe, oy - ((Math.pow(2, k * t) - 1) / (Math.pow(2, k) - 1)) * (oy - 24)]);
        path(s, smooth(pts));
      }
    });
  }

  // 7 · a crosshair that follows the pointer (rests on the bar until you move)
  function mira() {
    let gx, gy, W = 0, H = 0, px = null, py = null;
    const m = mount((s, w, h) => {
      W = w; H = h;
      gx = line(s, 0, 0, 0, h); gy = line(s, 0, 0, w, 0);
      place();
    });
    function place() {
      if (!gx) return;
      let x = px, y = py;
      if (x === null) { const b = R(document.querySelector('.load .bar')); x = b.x + b.w * 0.94; y = b.y + b.h / 2; }
      gx.setAttribute('x1', Math.round(x) + 0.5); gx.setAttribute('x2', Math.round(x) + 0.5); gx.setAttribute('y2', H);
      gy.setAttribute('y1', Math.round(y) + 0.5); gy.setAttribute('y2', Math.round(y) + 0.5); gy.setAttribute('x2', W);
    }
    addEventListener('pointermove', (e) => { px = e.pageX; py = e.pageY; place(); }, { passive: true });
    addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) { px = t.pageX; py = t.pageY; place(); } }, { passive: true });
    return m;
  }

  // 8 · one thread: from the end of the bar, through every face, swinging out to the margins, into the pozo
  function hilo() {
    mount((s, W, H) => {
      const bar = R(document.querySelector('.load .bar'));
      const faces = $$('main.list .row .f').map(R);
      const pozo = document.querySelector('.pie .pozo');
      const pts = [[bar.x + bar.w, bar.y + bar.h / 2]];
      const col = R(document.querySelector('main.list'));
      const swing = Math.min(220, Math.max(30, (W - col.w) / 2 - 40));
      pts.push([bar.x + bar.w + swing * 0.6, (bar.y + (faces[0] ? faces[0].y : H)) / 2]);
      faces.forEach((f, i) => {
        const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
        pts.push([cx, cy]);
        const nxt = faces[i + 1];
        if (nxt) pts.push([i % 2 ? col.x - swing : col.x + col.w + swing * 0.4, (cy + nxt.y + nxt.h / 2) / 2]);
      });
      if (pozo) { const p = R(pozo); pts.push([col.x + col.w + swing * 0.5, (pts[pts.length - 1][1] + p.y) / 2]); pts.push([p.x + p.w - 2, p.y + 2]); }
      path(s, smooth(pts), { 'stroke-width': 1.1 });
    });
  }

  window.LINEAS = { margenes, hover, raices, sauce, contornos, semilog, futuros, mira, hilo };
})();
