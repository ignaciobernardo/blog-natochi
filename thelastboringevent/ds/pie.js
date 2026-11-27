/* The Last Boring Event · footers (window.PIE), built on MC from metr.js.
   Each footer is made from the loader's own materials, at the dialog's width, in Arial:
   the grey well (#eee), its #9a9a9a border, the #3f6fb5 fill, #a9c0e2 for what is projected.
   Data: METR 50% time horizon of frontier models (CC-BY), fit doubling every 3.6 months,
   extrapolated to the event date. Every footer "loads" once it scrolls into view.

   PIE.pozo(el, json, iso, {cta})  the bar grown into a box; the fill's edge is the curve; optional button in the middle
   PIE.barras(el, json, iso)    one loader per model; the fills trace the curve
   PIE.columnas(el, json, iso)  quarterly loaders standing up; the tops trace the curve
   PIE.puntos(el, json, iso)    METR's dots and whiskers, shrunk to the dialog
   PIE.desborde(el, json, iso)  the bar fills, then spills upward */
(function () {
  const { el, day } = MC;
  const MONTH = 30.4375 * 864e5;
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const K = () => ({ blue: css('--blue') || '#3f6fb5', stripe: css('--stripe') || '#a9c0e2', well: '#eee', line: '#9a9a9a', ink: '#000', dim: '#404040', grey: '#7f7f7f' });

  function series(json, iso) {
    const p = json.panels[0];
    const tr = p.tables.find((t) => t.name === 'frontier trends').rows[0];
    const t0 = day(tr.from), h0 = tr.horizon_minutes_from / 60, dbl = tr.doubling_months * MONTH;
    const fit = (t) => h0 * Math.pow(2, (t - t0) / dbl);
    const rows = p.tables.find((t) => t.name === 'models').rows.filter((r) => r.frontier).map((r) => ({
      name: r.model.replace('Claude ', ''), t: day(r.released), h: r.horizon_minutes / 60,
      lo: r.horizon_minutes_low_80 / 60, hi: r.horizon_minutes_high_80 / 60,
    }));
    const te = day(iso);
    return { rows, fit, t0, t1: day(tr.to), te, he: fit(te), now: Math.min(Date.now(), te), dbl: tr.doubling_months };
  }
  const hours = (h) => (h < 1 ? Math.round(h * 60) + ' min' : h < 10 ? h.toFixed(1).replace('.', ',') + ' h' : Math.round(h) + ' h');
  const dateLabel = (t) => { const d = new Date(t); return d.getUTCDate() + ' ' + MES[d.getUTCMonth()]; };
  function onView(node, fn) {
    if (reduce) return fn(true);
    new IntersectionObserver((es, io) => es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); fn(false); } }), { threshold: 0.45 }).observe(node);
  }
  /** same stepped rhythm as the hero loader, ending at `to` */
  function steps(to, onStep, stops = [0.07, 0.19, 0.2, 0.42, 0.45, 0.63, 0.71, 0.86]) {
    const seq = stops.filter((s) => s < to).concat([to]);
    let k = 0;
    (function step() {
      if (k >= seq.length) return;
      const ms = 140 + (k % 3) * 120;
      onStep(seq[k], ms);
      k++;
      setTimeout(step, ms + 90 + ((k * 137) % 5) * 80);
    })();
  }
  const svgIn = (box, h) => {
    const s = el('svg', { width: '100%', height: h, 'aria-hidden': 'true' });
    s.style.display = 'block'; s.style.overflow = 'visible';
    box.appendChild(s);
    return s;
  };
  const ends = (a, b) => `<div class="pie-ends"><span>${a}</span><span>${b}</span></div>`;

  // ── the bar grown into a box: area under the curve, blue up to today, light after
  function pozo(root, json, iso, { cta } = {}) {
    const c = K(), d = series(json, iso), x0 = day('2024-01-01');
    const btn = cta ? `<a class="btn" href="${cta.href}"><span>${cta.text}</span></a>` : '';
    root.innerHTML = `<div class="pozo">${btn}</div>${ends('2024', dateLabel(d.te))}`;
    const box = root.querySelector('.pozo');
    const s = svgIn(box, '100%');
    if (cta) box.appendChild(box.querySelector('.btn'));
    let reveal = 0;
    const draw = () => {
      const W = box.clientWidth, H = box.clientHeight;
      s.innerHTML = '';
      s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const X = (t) => ((t - x0) / (d.te - x0)) * W, Y = (h) => H * (1 - h / d.he);
      const area = (a, b) => { let p = `M${X(a)},${H}`; for (let i = 0; i <= 120; i++) { const t = a + ((b - a) * i) / 120; p += `L${X(t).toFixed(1)},${Y(d.fit(t)).toFixed(1)}`; } return p + `L${X(b)},${H}Z`; };
      const id = 'pz' + Math.random().toString(36).slice(2, 7);
      el('rect', { x: 0, y: 0, width: W * reveal, height: H }, el('clipPath', { id }, el('defs', {}, s)));
      const g = el('g', { 'clip-path': `url(#${id})` }, s);
      el('path', { d: area(d.now, d.te), fill: c.stripe }, g);
      el('path', { d: area(x0, d.now), fill: c.blue }, g);
      s._clip = s.querySelector('clipPath rect');
    };
    draw();
    new ResizeObserver(draw).observe(box);
    onView(root, (now) => {
      if (now) { reveal = 1; draw(); return; }
      steps(1, (v, ms) => { reveal = v; const r = s._clip; r.style.transition = `width ${ms}ms linear`; r.setAttribute('width', box.clientWidth * v); });
    });
  }

  // ── one loader per frontier model, filled to its horizon over the event's (projected) one
  function barras(root, json, iso) {
    const d = series(json, iso);
    const list = d.rows.map((r) => ({ n: r.name, h: r.h })).concat([{ n: dateLabel(d.te), h: d.he, ev: true }]);
    root.innerHTML = `<div class="pie-barras">${list.map((r) => `<div class="pr${r.ev ? ' ev' : ''}"><span class="pn">${r.n}</span><span class="pb"><i></i></span><span class="pv">${r.ev ? '≈ ' : ''}${hours(r.h)}</span></div>`).join('')}</div>`;
    const fills = [...root.querySelectorAll('.pb i')];
    onView(root, (now) => fills.forEach((f, i) => {
      const w = (list[i].h / d.he) * 100 + '%';
      if (now) { f.style.width = w; return; }
      setTimeout(() => { f.style.transition = 'width .45s linear'; f.style.width = w; }, i * 140);
    }));
  }

  // ── quarterly loaders standing up; the last one is the projection for the event
  function columnas(root, json, iso) {
    const d = series(json, iso), cols = [];
    for (let y = 2024, q = 1; y < 2027; q === 3 ? (y++, q = 0) : q++) {
      const end = Date.UTC(y, (q + 1) * 3, 0);
      if (end < d.rows[0].t) continue;
      if (end > d.now) break;
      cols.push({ h: Math.max(...d.rows.filter((r) => r.t <= end).map((r) => r.h)) });
    }
    cols.push({ h: d.he, ev: true });
    root.innerHTML = `<div class="pie-cols">${cols.map((c) => `<span class="pc${c.ev ? ' ev' : ''}"><i></i></span>`).join('')}</div>${ends('2024', dateLabel(d.te))}`;
    const fills = [...root.querySelectorAll('.pc i')];
    onView(root, (now) => fills.forEach((f, i) => {
      const h = Math.max(0, (cols[i].h / d.he) * 100) + '%';
      if (now) { f.style.height = h; return; }
      setTimeout(() => { f.style.transition = 'height .45s linear'; f.style.height = h; }, i * 150);
    }));
  }

  // ── METR's dots, 80% whiskers and fit, at the dialog's size, in Arial
  function puntos(root, json, iso) {
    const c = K(), d = series(json, iso), x0 = day('2024-01-01'), x1 = day('2027-01-01');
    root.innerHTML = `<div class="pie-pts"></div>${ends('2024', '2027')}`;
    const box = root.querySelector('.pie-pts');
    const s = svgIn(box, '100%');
    let shown = false;
    const draw = () => {
      const W = box.clientWidth, H = box.clientHeight, top = 0, ymax = d.he * 1.12;
      s.innerHTML = '';
      s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const X = (t) => ((t - x0) / (x1 - x0)) * W, Y = (h) => H - (h / ymax) * (H - top);
      const id = 'pp' + Math.random().toString(36).slice(2, 7);
      el('rect', { x: -8, y: 0, width: W + 16, height: H }, el('clipPath', { id }, el('defs', {}, s)));
      const g = el('g', { 'clip-path': `url(#${id})` }, s);
      const curve = (a, b) => { let p = ''; for (let i = 0; i <= 120; i++) { const t = a + ((b - a) * i) / 120; p += (i ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(d.fit(t)).toFixed(1); } return p; };
      el('line', { x1: 0, x2: W, y1: H - 0.5, y2: H - 0.5, stroke: c.line, 'stroke-width': 1 }, s);
      const fit = el('path', { d: curve(d.t0, d.t1), fill: 'none', stroke: c.blue, 'stroke-width': 1.6, pathLength: 1, class: 'pp-fit' }, g);
      el('path', { d: curve(d.t1, d.te), fill: 'none', stroke: c.blue, 'stroke-width': 1.6, 'stroke-dasharray': '4 4', 'stroke-opacity': 0.55, class: 'pp-late' }, g);
      d.rows.forEach((r, i) => {
        const x = X(r.t);
        const w = el('line', { x1: x, x2: x, y1: Y(r.lo), y2: Y(r.hi), stroke: c.blue, 'stroke-width': 2, 'stroke-opacity': 0.35, class: 'pp-dot' }, g);
        const dot = el('circle', { cx: x, cy: Y(r.h), r: 3.4, fill: c.blue, stroke: '#fff', 'stroke-width': 1, class: 'pp-dot' }, g);
        [w, dot].forEach((n) => (n.style.transitionDelay = 0.15 + i * 0.07 + 's'));
      });
      const ex = X(d.te), ey = Y(d.he);
      el('circle', { cx: ex, cy: ey, r: 4.2, fill: c.ink, class: 'pp-late' }, s);
      const t = el('text', { x: ex - 10, y: ey + 4, 'text-anchor': 'end', fill: c.ink, 'font-size': 13, stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke', 'stroke-linejoin': 'round', class: 'pp-late' }, s);
      t.textContent = dateLabel(d.te);
      if (!shown && !reduce) s.classList.add('pp-anim');
    };
    draw();
    new ResizeObserver(draw).observe(box);
    onView(root, () => { shown = true; requestAnimationFrame(() => s.classList.add('pp-in')); });
  }

  // ── the bar from the top of the page fills, then spills upward along the curve
  function desborde(root, json, iso) {
    const c = K(), d = series(json, iso), x0 = day('2024-01-01');
    root.innerHTML = `<div class="pie-spill"></div>`;
    const box = root.querySelector('.pie-spill');
    const s = svgIn(box, '100%');
    let reveal = 0;
    const draw = () => {
      const W = box.clientWidth, H = box.clientHeight, bh = 14, top = H - bh;
      s.innerHTML = '';
      s.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const X = (t) => ((t - x0) / (d.te - x0)) * W;
      const base = d.fit(day('2025-08-07')); // the bar is "full" at GPT-5's horizon; above it, the excess spills
      const Y = (h) => top - Math.max(0, (h - base) / (d.he - base)) * (top - 2);
      const area = (a, b) => { let p = `M${X(a)},${H}`; for (let i = 0; i <= 160; i++) { const t = a + ((b - a) * i) / 160; p += `L${X(t).toFixed(1)},${Math.min(top, Y(d.fit(t))).toFixed(1)}`; } return p + `L${X(b)},${H}Z`; };
      const id = 'sp' + Math.random().toString(36).slice(2, 7);
      el('rect', { x: 0, y: 0, width: W * reveal, height: H }, el('clipPath', { id }, el('defs', {}, s)));
      el('rect', { x: 0.5, y: top + 0.5, width: W - 1, height: bh - 1, fill: c.well }, s);
      const g = el('g', { 'clip-path': `url(#${id})` }, s);
      el('path', { d: area(d.now, d.te), fill: c.stripe }, g);
      el('path', { d: area(x0, d.now), fill: c.blue }, g);
      el('rect', { x: 0.5, y: top + 0.5, width: W - 1, height: bh - 1, fill: 'none', stroke: c.line, 'stroke-width': 1 }, s);
      s._clip = s.querySelector('clipPath rect');
    };
    draw();
    new ResizeObserver(draw).observe(box);
    onView(root, (now) => {
      if (now) { reveal = 1; draw(); return; }
      steps(1, (v, ms) => { reveal = v; const r = s._clip; r.style.transition = `width ${ms}ms linear`; r.setAttribute('width', box.clientWidth * v); });
    });
  }

  window.PIE = { pozo, barras, columnas, puntos, desborde, series };
})();
