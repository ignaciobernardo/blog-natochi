/* The Last Boring Event · METR chart kit (window.MC)
   Grammar from METR's published charts (metr.org, data CC-BY): dashed grid, white-ringed
   markers, 80% (opaque) / 95% (faint) interval whiskers, solid fit with a faded dashed
   extrapolation, dotted reference lines, leader-line labels, segmented colour scales and
   step histograms. Colours come from metr.css tokens. No dependencies.

   MC.mount(svg, P => { ... })   redraws on resize; P is a Plot sized to the svg box
   MC.horizon(svg, json, opts)   50% time horizon on a linear axis (the parabolic one)
   MC.scatter(svg, json, opts)   lifecycle cost vs task time, log–log, coloured by success
   MC.hist(svg, json, opts)      bootstrap doubling-time histogram
   MC.scale(el, opts)            segmented colour scale / loader
   MC.progress(iso, onStep)      the stuck loader: steps from 0 to (today / event) */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = {};
  const readColors = () => {
    Object.assign(C, {
      ink: css('--ink') || '#000', axis: css('--axis') || '#333', blue: css('--blue') || '#3f6fb5',
      stripe: css('--stripe') || '#a9c0e2', faint: css('--faint') || '#c9ced6', well: css('--well') || '#eee',
      success: ['--s0', '--s1', '--s2', '--s3', '--s4'].map(css),
      sets: { 'Time Horizon 1.1': css('--th11'), MirrorCode: css('--mirror'), 'TH2 Verifiable': css('--th2v'), 'TH2 Hard-to-verify + Judgment': css('--th2h') },
    });
  };
  const el = (tag, a = {}, p) => {
    const e = document.createElementNS(NS, tag);
    for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };
  const lin = (d0, d1, r0, r1) => (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  const log = (d0, d1, r0, r1) => { const a = Math.log(d0), b = Math.log(d1); return (v) => r0 + ((Math.log(v) - a) / (b - a)) * (r1 - r0); };
  const day = (s) => Date.parse(s + 'T00:00:00Z');
  const MONTH = 30.4375 * 864e5;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const num = (v, d = 1) => v.toFixed(d).replace('.', ',');
  let uid = 0;

  class Plot {
    constructor(svg, W, H) {
      this.svg = svg; this.W = W; this.H = H; this.narrow = W < 560; this.fs = this.narrow ? 11 : 13;
      this.frame({ l: 0, r: 0, t: 0, b: 0 });
    }
    frame({ l, r, t, b }) { this.L = l; this.R = this.W - r; this.T = t; this.B = this.H - b; return this; }
    g(cls, parent) { return el('g', { class: cls }, parent || this.svg); }
    /** group clipped to the plot area (whiskers and curves can leave through the top) */
    area() {
      const id = 'mc' + ++uid;
      const cp = el('clipPath', { id }, el('defs', {}, this.svg));
      el('rect', { x: this.L, y: this.T, width: this.R - this.L, height: this.B - this.T }, cp);
      return el('g', { 'clip-path': `url(#${id})` }, this.svg);
    }
    text(s, x, y, a = {}, parent) { const t = el('text', { x, y, ...a }, parent || this.svg); t.textContent = s; return t; }
    grid(xs = [], ys = [], parent) {
      const g = this.g('mc-grid', parent);
      xs.forEach((v) => el('line', { x1: this.x(v), x2: this.x(v), y1: this.T, y2: this.B }, g));
      ys.forEach((v) => el('line', { x1: this.L, x2: this.R, y1: this.y(v), y2: this.y(v) }, g));
      return g;
    }
    /** left + bottom axis lines, outside tick labels, METR-style titles (y on top-left, x centred below) */
    axes({ x = [], y = [], xLabel, yLabel, lines = true } = {}) {
      const g = this.g('mc-axis'), fs = this.fs;
      if (lines) {
        el('line', { x1: this.L, x2: this.L, y1: this.T, y2: this.B }, g);
        el('line', { x1: this.L, x2: this.R, y1: this.B, y2: this.B }, g);
      }
      x.forEach(([v, s]) => this.text(s, this.x(v), this.B + fs * 1.5, { 'text-anchor': 'middle', class: 'mc-tick' }, g));
      y.forEach(([v, s]) => this.text(s, this.L - fs * 0.6, this.y(v), { 'text-anchor': 'end', 'dominant-baseline': 'middle', class: 'mc-tick' }, g));
      if (yLabel) this.text(yLabel, this.L - fs * 3.2, this.T - fs * 1.4, { class: 'mc-title' }, g);
      if (xLabel) this.text(xLabel, (this.L + this.R) / 2, this.B + fs * 3.3, { 'text-anchor': 'middle', class: 'mc-title' }, g);
      return g;
    }
    /** circle | square | triangle | diamond, with METR's white ring */
    point(x, y, { shape = 'circle', r = 4, fill = C.blue, ring = '#fff', cls = 'mc-dot', parent } = {}) {
      const a = { fill, stroke: ring, 'stroke-width': 1, class: cls };
      const p = parent || this.svg;
      if (shape === 'square') return el('rect', { ...a, x: x - r * 0.9, y: y - r * 0.9, width: r * 1.8, height: r * 1.8 }, p);
      if (shape === 'triangle') return el('path', { ...a, d: `M${x - r * 1.1},${y - r * 0.75}H${x + r * 1.1}L${x},${y + r * 1.15}Z` }, p);
      if (shape === 'diamond') return el('path', { ...a, d: `M${x},${y - r * 1.25}L${x + r * 1.1},${y}L${x},${y + r * 1.25}L${x - r * 1.1},${y}Z` }, p);
      return el('circle', { ...a, cx: x, cy: y, r }, p);
    }
    /** interval whisker: 95% faint and thin, 80% opaque and thick (vertical by default) */
    ci(x, lo95, hi95, lo80, hi80, { color = C.blue, horizontal = false, parent } = {}) {
      const g = el('g', { class: 'mc-ci' }, parent || this.svg);
      const seg = (a, b, w, o) => el('line', horizontal
        ? { x1: a, x2: b, y1: x, y2: x, stroke: color, 'stroke-width': w, 'stroke-opacity': o }
        : { x1: x, x2: x, y1: a, y2: b, stroke: color, 'stroke-width': w, 'stroke-opacity': o }, g);
      seg(lo95, hi95, 1.4, 0.32);
      seg(lo80, hi80, 2.8, 0.9);
      return g;
    }
    line(pts, { stroke = C.blue, width = 2.4, dash, opacity, cls, fill = 'none', parent } = {}) {
      const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
      return el('path', { d, fill, stroke, 'stroke-width': width, 'stroke-dasharray': dash, 'stroke-opacity': opacity, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: cls === 'mc-fit' ? 1 : null, class: cls }, parent || this.svg);
    }
    /** dotted reference line with its note above the left end */
    ref(v, { label, parent } = {}) {
      const g = el('g', {}, parent || this.svg), y = this.y(v);
      el('line', { x1: this.L, x2: this.R, y1: y, y2: y, class: 'mc-ref' }, g);
      if (label) this.text(label, this.L + this.fs * 0.6, y - this.fs * 0.6, { class: 'mc-note' }, g);
      return g;
    }
    /** text with a thin leader line to the point it names */
    label(s, [tx, ty], [px, py], { anchor = 'end', cls, gap = 6, parent } = {}) {
      const g = el('g', { class: cls }, parent || this.svg), fs = this.fs;
      const lx = anchor === 'end' ? tx + 3 : anchor === 'start' ? tx - 3 : tx, ly = ty + fs * 0.25;
      const dx = px - lx, dy = py - ly, len = Math.hypot(dx, dy) || 1;
      el('line', { x1: lx, y1: ly, x2: px - (dx / len) * gap, y2: py - (dy / len) * gap, class: 'mc-lead' }, g);
      const t = this.text('', tx, ty, { 'text-anchor': anchor, class: cls === 'mc-evt' ? 'mc-lab mc-strong' : 'mc-lab' }, g);
      String(s).split('\n').forEach((line, i) => { const sp = el('tspan', { x: tx, dy: i ? '1.25em' : null, class: i ? 'mc-sub' : null }, t); sp.textContent = line; });
      return g;
    }
  }

  /** draw now, redraw on resize; first time on screen adds the draw-in classes */
  function mount(svg, draw, { animate = true } = {}) {
    readColors();
    svg.classList.add('mc');
    let shown = false;
    const run = () => {
      const W = svg.clientWidth, H = svg.clientHeight;
      if (!W || !H) return;
      svg.innerHTML = '';
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      draw(new Plot(svg, W, H));
    };
    if (animate && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
      svg.classList.add('mc-anim');
      new IntersectionObserver((es, io) => es.forEach((e) => {
        if (e.isIntersecting && !shown) { shown = true; io.disconnect(); requestAnimationFrame(() => svg.classList.add('mc-in')); }
      }), { threshold: 0.35 }).observe(svg);
    }
    let t;
    new ResizeObserver(() => { clearTimeout(t); t = setTimeout(run, 50); }).observe(svg);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(run);
    return run;
  }

  /** 50% time horizon by release date, linear hours axis, frontier fit + extrapolation to `until` */
  function horizon(svg, json, o = {}) {
    const panel = json.panels[0];
    const rows = panel.tables.find((t) => t.name === 'models').rows;
    const tr = panel.tables.find((t) => t.name === 'frontier trends').rows[0];
    const t0 = day(tr.from), t1 = day(tr.to), h0 = tr.horizon_minutes_from / 60, dbl = tr.doubling_months * MONTH;
    const fit = (t) => h0 * Math.pow(2, (t - t0) / dbl);
    const x0 = day(o.from || '2024-01-01'), x1 = day(o.until || '2027-08-01'), ymax = o.ymax || 240;
    const ev = o.event ? day(o.event) : null;
    horizon.stats = { doubling: tr.doubling_months, lo: tr.doubling_months_low_95, hi: tr.doubling_months_high_95, r2: tr.r_squared, at: ev && fit(ev) };
    return mount(svg, (P) => {
      const fs = P.fs, n = P.narrow;
      P.frame({ l: fs * (n ? 3.2 : 3.8), r: fs * 1.2, t: fs * 3, b: fs * 4.4 });
      P.x = lin(x0, x1, P.L, P.R);
      P.y = lin(0, ymax, P.B, P.T);
      const yt = [0, 50, 100, 150, 200].filter((v) => v <= ymax);
      const xt = [];
      for (let y = 2024; y <= 2027; y++) for (const m of n ? [0] : [0, 6]) { const t = Date.UTC(y, m, 1); if (t >= x0 && t <= x1) xt.push(t); }
      P.grid(xt, yt);
      P.axes({
        x: xt.map((t) => [t, n ? String(new Date(t).getUTCFullYear()) : MES[new Date(t).getUTCMonth()] + ' ' + String(new Date(t).getUTCFullYear()).slice(2)]),
        y: yt.map((v) => [v, v ? v + ' h' : '0']),
        xLabel: o.xLabel, yLabel: o.yLabel,
      });
      const A = P.area();
      if (o.refAt) P.ref(o.refAt, { label: o.refLabel, parent: A });
      const curve = (a, b) => { const r = []; for (let i = 0; i <= 200; i++) { const t = a + ((b - a) * i) / 200; r.push([P.x(t), P.y(fit(t))]); } return r; };
      P.line(curve(t1, x1), { width: 2, dash: '6 5', opacity: 0.5, cls: 'mc-extra', parent: A });
      P.line(curve(t0, t1), { width: 2.4, cls: 'mc-fit', parent: A });
      const H = (m) => P.y(m / 60);
      rows.forEach((r, i) => {
        const g = P.ci(P.x(day(r.released)), H(r.horizon_minutes_low_95), H(r.horizon_minutes_high_95), H(r.horizon_minutes_low_80), H(r.horizon_minutes_high_80), { color: r.frontier ? C.blue : C.faint, parent: A });
        g.style.transitionDelay = 0.25 + i * 0.06 + 's';
      });
      rows.forEach((r, i) => {
        const d = P.point(P.x(day(r.released)), H(r.horizon_minutes), { fill: r.frontier ? C.blue : C.faint, r: n ? 3.4 : 4, parent: A });
        d.style.transitionDelay = 0.25 + i * 0.06 + 's';
      });
      (o.labels || []).forEach(([name, dx, dy, anchor, wide]) => {
        if (n && !wide) return;
        const r = rows.find((q) => q.model === name || q.model.endsWith(' ' + name));
        if (!r) return;
        const px = P.x(day(r.released)), py = H(r.horizon_minutes);
        P.label(name, [px + dx * fs, py + dy * fs], [px, py], { anchor: anchor || 'end' });
      });
      if (ev) {
        const ex = P.x(ev), ey = P.y(fit(ev));
        const g = P.g('mc-evt');
        P.point(ex, ey, { fill: C.ink, r: n ? 4 : 5, cls: null, parent: g });
        const [dx, dy, anchor] = (n ? o.eventAtNarrow : o.eventAt) || [-1.6, -4.2, 'end'];
        P.label(o.eventLabel || '', [ex + dx * fs, ey + dy * fs], [ex, ey], { anchor, cls: 'mc-evt', parent: g, gap: 8 });
      }
    });
  }

  /** METR lifecycle-cost scatter: x task time (log), y cost (log), colour = success rate bin, shape = task set */
  const SHAPE = { 'Time Horizon 1.1': 'circle', MirrorCode: 'square', 'TH2 Verifiable': 'triangle', 'TH2 Hard-to-verify + Judgment': 'diamond' };
  function scatter(svg, json, o = {}) {
    const panel = json.panels[0];
    const rows = panel.tables.find((t) => t.name === 'tasks').rows.slice().sort((a, b) => a.task_time_minutes - b.task_time_minutes);
    const ft = panel.tables.find((t) => t.name === 'fitted line').rows[0];
    let dots = [];
    const run = mount(svg, (P) => {
      const fs = P.fs, pad = o.pad ?? fs * 2;
      P.frame({ l: pad + fs * 3.4, r: pad, t: pad + fs, b: pad + fs * 2 });
      P.x = log(1 / 60, 14400 * 1.6, P.L, P.R);
      P.y = log(50, 260000, P.B, P.T);
      const xt = [[1 / 60, '1 s'], [8 / 60, '8 s'], [1, '1 min'], [8, '8 min'], [60, '1 h'], [480, '8 h'], [3840, '8 d']];
      const yt = [[100, '$100'], [1000, '$1.000'], [10000, '$10.000'], [100000, '$100.000']];
      P.grid(xt.map((t) => t[0]), yt.map((t) => t[0]));
      P.axes({ x: P.narrow ? xt.filter((_, i) => i % 2 === 0) : xt, y: yt, lines: o.axisLines !== false });
      P.line([[P.x(ft.task_time_minutes_from), P.y(ft.lifecycle_cost_usd_from)], [P.x(ft.task_time_minutes_to), P.y(ft.lifecycle_cost_usd_to)]], { stroke: C.axis, width: 1.6, dash: '6 5', cls: 'mc-trend' });
      if (o.stat !== false) P.text(`R² = ${num(ft.r_squared, 2)} · n = ${ft.points}`, P.L + fs * 0.8, P.T + fs * 1.2, { class: 'mc-note' });
      dots = rows.map((r) => {
        const bin = Math.min(4, Math.floor(r.success_rate * 5));
        const d = P.point(P.x(r.task_time_minutes), P.y(r.lifecycle_cost_usd), { shape: SHAPE[r.task_set], fill: C.success[bin], r: P.narrow ? 2.8 : 3.6, cls: 'mc-pt' });
        return d;
      });
      reveal(shown, true);
    }, { animate: false });
    let shown = o.revealed ?? 1;
    function reveal(v, instant) {
      shown = v;
      const k = Math.round(v * dots.length);
      dots.forEach((d, i) => {
        d.style.transition = instant ? 'none' : 'opacity .35s';
        d.style.opacity = i < k ? 1 : 0;
      });
    }
    return { run, reveal };
  }

  /** bootstrap distribution of doubling times, as a filled step histogram with the median dashed */
  function hist(svg, json, o = {}) {
    const rows = json.panels[1].tables[0].rows;
    const tr = json.panels[0].tables.find((t) => t.name === 'frontier trends').rows[0];
    let clip;
    const run = mount(svg, (P) => {
      const fs = P.fs;
      P.frame({ l: 1, r: 1, t: fs * 1.5, b: fs * 1.8 });
      P.x = lin(0, 8, P.L, P.R);
      const top = Math.max(...rows.map((r) => r.share_of_draws));
      P.y = lin(0, top * 1.08, P.B, P.T);
      const pts = [[P.x(0), P.B]];
      rows.forEach((r) => { if (r.months_from >= 8) return; pts.push([P.x(r.months_from), P.y(r.share_of_draws)], [P.x(Math.min(8, r.months_to)), P.y(r.share_of_draws)]); });
      pts.push([P.x(8), P.B]);
      const id = 'mc' + ++uid;
      const cp = el('clipPath', { id }, el('defs', {}, svg));
      clip = el('rect', { x: 0, y: 0, width: P.W * shown, height: P.H }, cp);
      const g = el('g', { 'clip-path': `url(#${id})` }, svg);
      P.line(pts, { stroke: C.blue, width: 1.4, fill: C.stripe, parent: g }).setAttribute('fill-opacity', 0.55);
      const mx = P.x(tr.doubling_months);
      el('line', { x1: mx, x2: mx, y1: P.T - fs * 0.5, y2: P.B, stroke: C.blue, 'stroke-width': 1.4, 'stroke-dasharray': '4 3' }, svg);
      if (o.median) P.text(o.median, mx + fs * 0.45, P.T - fs * 0.45, { class: 'mc-note' });
      el('line', { x1: P.L, x2: P.R, y1: P.B, y2: P.B, stroke: C.axis, 'stroke-width': 1 }, svg);
      [0, 2, 4, 6, 8].forEach((v) => P.text(String(v), P.x(v), P.B + fs * 1.4, { 'text-anchor': v === 0 ? 'start' : v === 8 ? 'end' : 'middle', class: 'mc-tick' }));
    }, { animate: false });
    let shown = o.revealed ?? 1;
    return { run, reveal(v, ms = 0) { shown = v; if (clip) { clip.style.transition = ms ? `width ${ms}ms linear` : 'none'; clip.setAttribute('width', svg.clientWidth * v); } } };
  }

  /** segmented colour scale; value 0..1 fills it segment by segment */
  function scale(root, { colors, ticks = ['0,0', '0,2', '0,4', '0,6', '0,8', '1,0'], label } = {}) {
    readColors();
    colors = colors || C.success;
    root.classList.add('mc-scale');
    root.innerHTML = (label ? `<span class="mc-scale-label">${label}</span>` : '') +
      `<div class="mc-scale-ticks">${ticks.map((t, i) => `<span style="left:${(i / (ticks.length - 1)) * 100}%">${t}</span>`).join('')}</div>` +
      `<div class="mc-scale-bar">${colors.map((c) => `<i><b style="background:${c}"></b></i>`).join('')}</div>`;
    const bs = [...root.querySelectorAll('.mc-scale-bar b')];
    return {
      set(v, ms = 0) {
        bs.forEach((b, i) => {
          const f = Math.max(0, Math.min(1, v * bs.length - i));
          b.style.transition = ms ? `width ${ms}ms linear` : 'none';
          b.style.width = f * 100 + '%';
        });
      },
    };
  }

  /** the stuck loader: jumps from 0 to the share of the year that has gone by before `iso` */
  function progress(iso, onStep, { from = '2026-01-01', stops = [0.07, 0.19, 0.2, 0.42, 0.45, 0.63, 0.71] } = {}) {
    const a = day(from), b = day(iso);
    const p = Math.max(0, Math.min(1, (Date.now() - a) / (b - a)));
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) { onStep(p, 0, true); return p; }
    const seq = stops.filter((s) => s < p).concat([p]);
    let k = 0;
    (function step() {
      if (k >= seq.length) return;
      const ms = 140 + (k % 3) * 120;
      onStep(seq[k], ms, k === seq.length - 1);
      k++;
      setTimeout(step, ms + 90 + ((k * 137) % 5) * 80);
    })();
    return p;
  }

  window.MC = { mount, horizon, scatter, hist, scale, progress, Plot, lin, log, day, num, el, C, readColors };
})();
