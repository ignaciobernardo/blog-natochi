// Forum '26 · 06 "Vasija".
// La banda pintada de un ánfora en puntos (figura negra): Atenas, Florencia, Silicon Valley y Santiago en un solo registro
// que da la vuelta a la vasija. Al hacer scroll la vasija gira y cada leyenda gira con su panel.
// Con prefers-reduced-motion la banda se desenrolla: queda plana, quieta y con scroll lateral propio.
(function () {
  'use strict';
  var F = window.Forum, S = window.V06_SCENES;
  if (!F || !S) return;

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var DPR = Math.min(2, window.devicePixelRatio || 1);
  var DOT = 0.78;                 // lado del punto respecto del pitch
  var TILT = 0.05;                // la vasija se ve apenas desde arriba: los bordes de la banda sonríen
  var ALPHA = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52, 0.44];   // la vasija se oscurece hacia los bordes
  var css = getComputedStyle(document.documentElement);
  function tok(n, d) { return (css.getPropertyValue('--' + n) || '').trim() || d; }
  var C = { off: tok('dot-off', '#cfcec7'), dim: tok('dot-dim', '#98b0cd'), mid: tok('dot-amber', '#5284c4'), lit: tok('dot-lit', '#0755bb') };

  function rand(x, y, s) {
    var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function snap(v) { return Math.round(v * DPR) / DPR; }

  // Pinta rectángulos agrupados por color y nivel de brillo (un path por grupo).
  function Painter(ctx) {
    var groups = {};
    return {
      // Bordes alineados a píxeles del dispositivo: columnas parejas, sin saltos de ancho entre puntos vecinos.
      add: function (color, lv, x, y, w, h) {
        var k = color + lv, a = groups[k] || (groups[k] = []);
        if (w < 3) { a.push(x, y, w, h); return; }   // puntos muy angostos (bordes de la vasija): sin redondear, así no hay moiré
        var x0 = snap(x), y0 = snap(y);
        a.push(x0, y0, Math.max(1 / DPR, snap(x + w) - x0), Math.max(1 / DPR, snap(y + h) - y0));
      },
      flush: function () {
        for (var lv = 0; lv < ALPHA.length; lv++) ['off', 'dim', 'mid', 'lit'].forEach(function (c) {
          var a = groups[c + lv]; if (!a) return;
          ctx.globalAlpha = ALPHA[lv]; ctx.fillStyle = C[c]; ctx.beginPath();
          for (var i = 0; i < a.length; i += 4) ctx.rect(a[i], a[i + 1], a[i + 2], a[i + 3]);
          ctx.fill();
        });
        ctx.globalAlpha = 1; groups = {};
      },
    };
  }
  function sizeCanvas(c, w, h) {
    c.width = Math.round(w * DPR); c.height = Math.round(h * DPR);
    c.style.width = w + 'px'; c.style.height = h + 'px';
    var ctx = c.getContext('2d'); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return ctx;
  }

  // ---------- frisos sueltos ----------
  document.querySelectorAll('[data-v6-frieze]').forEach(function (el) {
    var name = el.getAttribute('data-v6-frieze');
    if (!F.friezes[name]) return;
    var band = name !== 'meander';
    F.Frieze(el, { pattern: name, pitch: band ? 4 : 3, dot: band ? 3 : 2, color: band ? 'var(--dot-dim)' : 'var(--dot-amber)' });
  });

  // ---------- la vasija ----------
  var ORDER = ['athens', 'florence', 'silicon', 'santiago'];
  var ROWS = S.athens.length, PW = S.athens[0].length, SW = S.separator[0].length, SEG = PW + SW, NP = ORDER.length, N = SEG * NP;
  function regCell(u, v) { var k = (u / SEG) | 0, x = u - k * SEG; return x < PW ? S[ORDER[k]][v].charAt(x) : S.separator[v].charAt(x - PW); }
  function framed(t) { var line = t[0].replace(/./g, '#'), gap = t[0].replace(/./g, '.'); return [line, gap].concat(t, [gap, line]); }
  function patternRing(name, frame) {
    var t = F.friezes[name]; if (!t) return null;
    if (frame) t = framed(t);
    var tw = t[0].length;
    return { rows: t.length, tile: tw, cell: function (u, v) { return t[v].charAt(u % tw); } };
  }
  function fillRing(rows, ch) { return { rows: rows, tile: 1, cell: function () { return ch; } }; }
  function makeRings(bandScale) {
    var list = [patternRing('tongues'), fillRing(1, '.'), patternRing('meander', true), fillRing(2, '.'),
      { rows: ROWS, tile: N, reg: true, cell: regCell },
      fillRing(2, '.'), fillRing(1, '#'), fillRing(1, '.'), patternRing('wave'), fillRing(1, '.'), fillRing(1, '#')].filter(Boolean);
    list.forEach(function (r, i) {
      r.seed = i * 97 + 11;
      r.cols = r.reg ? N : r.tile * Math.max(1, Math.round(N / bandScale / r.tile));
    });
    return list;
  }
  // Color de cada celda: figura en azul eléctrico, bordes y líneas de fondo en azul medio, arcilla en azul claro con motas.
  // `clay` queda en true cuando la celda es arcilla: esos puntos van un poco más chicos y la figura resalta.
  var clay = false, CLAY = 0.84;
  function pick(r, u, v, t) {
    var ch = r.cell(u, v);
    clay = false;
    if (ch === '#') return t != null && rand(u, v + r.seed, t) < 0.006 ? 'mid' : 'lit';
    if (ch === '+' || ch === '~') return 'mid';
    clay = true;
    if (t != null && rand(u, v + r.seed, t + 5000) < 0.002) return 'lit';
    return rand(u, v + r.seed, 7) < 0.035 ? 'mid' : 'dim';
  }

  var story = document.querySelector('[data-v6-story]');
  var stage = document.querySelector('[data-v6-stage]');
  var vase = document.querySelector('[data-v6-vase]');
  var canvas = vase && vase.querySelector('canvas');
  var capsList = document.querySelector('[data-v6-captions]');
  var caps = capsList ? Array.prototype.slice.call(capsList.querySelectorAll('.v6-cap')) : [];
  var turn = document.querySelector('[data-v6-turn]');
  var buttons = turn ? Array.prototype.slice.call(turn.querySelectorAll('button')) : [];

  if (story && canvas) {
    var flat = reduce;
    var L = null, ctx = null, phi = 2 * Math.PI * (PW / 2) / N, active = -1, tick = 0, dirty = true, visible = true;
    var phiStep = 2 * Math.PI * SEG / N;

    story.classList.add(flat ? 'is-flat' : 'is-pinned');
    story.style.setProperty('--v6-turns', NP - 1);
    capsList.classList.add('is-live');
    if (flat) vase.appendChild(capsList);

    var layout = function () {
      var W = vase.clientWidth, vh = window.innerHeight, narrow = W < 720;
      var rings = makeRings(flat ? (narrow ? 0.8 : 0.6) : (narrow ? 1 : 0.6));
      var R, pitch, H, capW;
      if (flat) {
        pitch = narrow ? 2.7 : 5.2;
        R = N * pitch / (2 * Math.PI);
      } else {
        R = narrow ? (W / 2) / Math.sin(48 * Math.PI / 180) : Math.min(W - 112, 1360) / 2;
      }
      var heightFor = function (R) {
        var Cc = 2 * Math.PI * R, h = 0;
        rings.forEach(function (r) { h += r.rows * Cc / r.cols; });
        return h + (flat ? 0 : R * TILT) + 2;
      };
      var setCaps = function () {
        var front = flat ? PW * 2 * Math.PI * R / N : 2 * R * Math.sin(Math.PI * PW / N);
        capW = Math.max(220, Math.min(560, front - 40, W - 32));
        capsList.style.setProperty('--cap-w', capW + 'px');
        var hmax = 0; caps.forEach(function (c) { hmax = Math.max(hmax, c.offsetHeight); });
        capsList.style.height = hmax + 'px';
        return hmax;
      };
      var capsH = setCaps();
      if (!flat) {
        var navH = turn ? turn.offsetHeight : 0;
        var avail = Math.max(220, vh - capsH - navH - (narrow ? 92 : 116));
        H = heightFor(R);
        if (H > avail) { R *= avail / H; capsH = setCaps(); }
      }
      H = heightFor(R);
      var Cc = 2 * Math.PI * R, y = 0;
      rings.forEach(function (r) { r.pitch = Cc / r.cols; r.y0 = y; y += r.rows * r.pitch; });
      var CW = flat ? Cc : W;
      ctx = sizeCanvas(canvas, Math.round(CW), Math.ceil(H));
      if (flat) capsList.style.width = Math.round(CW) + 'px';
      L = { W: CW, H: H, R: R, rings: rings, capW: capW, narrow: narrow };
      dirty = true;
      measureStage();
    };
    // El escenario mide lo que su contenido y se queda centrado en la pantalla mientras la vasija gira.
    var stageTop = 0, stageH = 0;
    var measureStage = function () {
      if (flat) return;
      stageH = stage.offsetHeight;
      stageTop = Math.max(0, Math.round((window.innerHeight - stageH) / 2));
      story.style.setProperty('--v6-stage-h', stageH + 'px');
      story.style.setProperty('--v6-top', stageTop + 'px');
    };

    var draw = function () {
      if (!L) return;
      var P = Painter(ctx), t = reduce ? null : tick;
      ctx.clearRect(0, 0, L.W, L.H);
      if (flat) {
        L.rings.forEach(function (r) {
          var pr = r.pitch, ds = pr * DOT, inset = (pr - ds) / 2;
          for (var u = 0; u < r.cols; u++) for (var v = 0; v < r.rows; v++) {
            var c = pick(r, u, v, null), q = clay ? ds * CLAY : ds, o = (pr - q) / 2;
            P.add(c, 0, u * pr + o, r.y0 + v * pr + o, q, q);
          }
        });
      } else {
        var cx = L.W / 2, R = L.R, tilt = R * TILT;
        L.rings.forEach(function (r) {
          var cols = r.cols, pr = r.pitch, dA = 2 * Math.PI / cols, ds = pr * DOT, inset = (pr - ds) / 2;
          var k0 = Math.ceil((phi - Math.PI / 2) / dA - 0.5), k1 = Math.floor((phi + Math.PI / 2) / dA - 0.5);
          for (var k = k0; k <= k1; k++) {
            var a = (k + 0.5) * dA - phi, ca = Math.cos(a);
            if (ca < 0.035) continue;
            var x = cx + R * Math.sin(a), w = pr * ca;
            if (x + w < 0 || x - w > L.W) continue;
            var u = ((k % cols) + cols) % cols;
            var lv = Math.min(ALPHA.length - 1, Math.floor((1 - ca) * 1.15 * ALPHA.length));
            var dw = Math.max(0.6, w * DOT), x0 = x - dw / 2, y0 = r.y0 + tilt * ca + inset;
            var cw = dw * CLAY, cx0 = x - cw / 2, ch = ds * CLAY, cy0 = y0 + (ds - ch) / 2;
            for (var v = 0; v < r.rows; v++) {
              var col = pick(r, u, v, t);
              if (clay) P.add(col, lv, cx0, cy0 + v * pr, cw, ch); else P.add(col, lv, x0, y0 + v * pr, dw, ds);
            }
          }
        });
      }
      P.flush();
      placeCaptions();
    };

    var placeCaptions = function () {
      var now = -1;
      caps.forEach(function (c, k) {
        var x, sc = 1, op = 1, centerU = k * SEG + PW / 2;
        if (flat) {
          x = centerU * L.W / N;
        } else {
          var a = 2 * Math.PI * centerU / N - phi;
          a = Math.atan2(Math.sin(a), Math.cos(a));
          var ca = Math.cos(a);
          x = L.W / 2 + L.R * Math.sin(a);
          sc = Math.max(0.001, ca);
          op = smooth(0.62, 0.96, ca);
          if (ca > 0.9) now = k;
        }
        c.style.transform = 'translateX(' + (x - L.capW / 2).toFixed(1) + 'px) scaleX(' + sc.toFixed(3) + ')';
        c.style.opacity = op.toFixed(3);
        c.style.visibility = op < 0.01 ? 'hidden' : '';
      });
      if (flat) return;
      if (now < 0) now = Math.round((phi - Math.PI * PW / N) / phiStep);
      if (now !== active) {
        active = now;
        buttons.forEach(function (b, i) { if (i === active) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      }
    };

    var progress = function () {
      var span = story.offsetHeight - stageH;
      if (span <= 0) return 0;
      return Math.min(1, Math.max(0, (stageTop - story.getBoundingClientRect().top) / span));
    };
    var phiAt = function (p) {
      var s = p * (NP - 1), i = Math.min(NP - 2, Math.floor(s)), f = s - i;
      var e = i + 0.86 * smooth(0.16, 0.84, f) + 0.14 * f;
      return 2 * Math.PI * (e * SEG + PW / 2) / N;
    };

    buttons.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (flat) {
          vase.scrollLeft = (i * SEG + PW / 2) * L.W / N - vase.clientWidth / 2;
          return;
        }
        var top = story.getBoundingClientRect().top + window.scrollY - stageTop;
        var span = story.offsetHeight - stageH;
        window.scrollTo({ top: top + span * i / (NP - 1) + 1, behavior: 'smooth' });
      });
    });
    if (flat) {
      // Sin movimiento: los numerales marcan el panel que está al centro de la banda desenrollada.
      var syncFlat = function () {
        var c = (vase.scrollLeft + vase.clientWidth / 2) / L.W * N, k = Math.max(0, Math.min(NP - 1, Math.floor(c / SEG)));
        buttons.forEach(function (b, i) { if (i === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      };
      vase.addEventListener('scroll', syncFlat, { passive: true });
      setTimeout(syncFlat, 0);
      vase.setAttribute('tabindex', '0');
      vase.setAttribute('aria-label', 'Banda de la vasija, desenrollada: desliza para recorrerla');
    }

    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); if (flat) draw(); });
    var lastW = vase.clientWidth, lastH = window.innerHeight, pending = 0;
    var onResize = function () {
      if (pending) return;
      pending = requestAnimationFrame(function () {
        pending = 0;
        var w = vase.clientWidth, h = window.innerHeight;
        if (w === lastW && Math.abs(h - lastH) < 120) { measureStage(); return; }   // la barra del navegador en móvil no rearma la vasija
        lastW = w; lastH = h; layout(); if (flat) draw();
      });
    };
    if (window.ResizeObserver) new ResizeObserver(onResize).observe(vase);
    window.addEventListener('resize', onResize);

    if (flat) {
      draw();
    } else {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(story);
      var lastTick = 0;
      var loop = function (now) {
        requestAnimationFrame(loop);
        if (!visible) return;
        if (now - lastTick > 170) { tick++; lastTick = now; dirty = true; }
        var ph = phiAt(progress());
        if (Math.abs(ph - phi) > 1e-6) { phi = ph; dirty = true; }
        if (dirty) { dirty = false; draw(); }
      };
      phi = phiAt(progress());
      draw();
      requestAnimationFrame(loop);
    }
  }

  // ---------- agenda: un panel todavía sin pintar ----------
  var blankEl = document.querySelector('[data-v6-blank]');
  if (blankEl) {
    var bc = document.createElement('canvas'); bc.setAttribute('aria-hidden', 'true'); blankEl.appendChild(bc);
    var bctx, BL;
    var blankLayout = function () {
      var W = blankEl.clientWidth, narrow = W < 600;
      var cols = Math.max(49, Math.floor(W / (narrow ? 3 : 4) / 24) * 24 + 1), p = Math.floor(W / cols * 4) / 4;
      var top = framed(F.friezes.meander), bottom = F.friezes['tongues-up'] || F.friezes.tongues;
      var field = narrow ? 24 : 30;
      BL = { p: p, cols: cols, top: top, bottom: bottom, field: field, side: S.separator.map(function (r) { return r.slice(4, 16); }), rows: top.length + 1 + field + 1 + bottom.length };
      bctx = sizeCanvas(bc, cols * p, BL.rows * p);
      blankEl.parentNode.style.setProperty('--blank-w', cols * p + 'px');
      blankEl.parentNode.style.setProperty('--blank-pad', Math.max(0, BL.side[0].length * p - 14) + 'px');
    };
    // Un panel más de la misma vasija, todavía sin pintar: marco de greca, arcilla apenas marcada y la línea del día.
    var blankDraw = function (t) {
      var P = Painter(bctx), p = BL.p, ds = p * DOT, ins = (p - ds) / 2, y = 0, x, v;
      var dot = function (c, lv, x, y) { P.add(c, lv, x * p + ins, y * p + ins, ds, ds); };
      bctx.clearRect(0, 0, BL.cols * p, BL.rows * p);
      var band = function (m, color) {
        for (v = 0; v < m.length; v++) for (x = 0; x < BL.cols; x++) {
          var ch = m[v].charAt(x % m[0].length);
          if (ch === '#') dot(color, 0, x, y + v); else if (ch === '+') dot(color, 6, x, y + v);
        }
        y += m.length;
      };
      band(BL.top, 'mid'); y += 1;
      var sw = BL.side[0].length, y0 = y;
      for (v = 0; v < BL.field; v++) {
        var sr = BL.side[(v + 3) % BL.side.length];
        for (x = 0; x < BL.cols; x++) {
          var edge = x < sw ? sr.charAt(x) : x >= BL.cols - sw ? sr.charAt(sw - 1 - (x - (BL.cols - sw))) : null;
          if (edge === '#') { dot('mid', 0, x, y + v); continue; }
          if (edge !== null) continue;
          var spark = t != null && rand(x, v, t) < 0.0018;
          if (spark) dot('mid', 2, x, y + v);
          else if (x % 2 === 0 && v % 2 === 0) dot('dim', 4, x, y + v);
        }
      }
      // la línea del día, de 08:30 a 22:00: una marca por hora
      var gy = y0 + BL.field - 2;
      for (x = sw + 1; x < BL.cols - sw - 1; x++) dot('mid', 2, x, gy + 1);
      for (var h = 9; h <= 22; h++) { x = sw + 1 + Math.round((h - 8.5) / 13.5 * (BL.cols - 2 * sw - 3)); dot('lit', 0, x, gy); dot('lit', 0, x, gy - 1); }
      y += BL.field + 1;
      band(BL.bottom, 'dim');
      P.flush();
    };
    blankLayout(); blankDraw(null);
    var bw = blankEl.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () { if (blankEl.clientWidth !== bw) { bw = blankEl.clientWidth; blankLayout(); blankDraw(null); } }).observe(blankEl);
    if (!reduce && 'IntersectionObserver' in window) {
      var bt = 0, bTimer = 0;
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting && !bTimer) bTimer = setInterval(function () { blankDraw(++bt); }, 220);
        else if (!e[0].isIntersecting && bTimer) { clearInterval(bTimer); bTimer = 0; }
      }).observe(blankEl);
    }
  }

  // ---------- el año pasado: una procesión de 270 figuras ----------
  var crowdEl = document.querySelector('[data-v6-crowd]');
  if (crowdEl && S.mini) {
    var counts = JSON.parse(crowdEl.getAttribute('data-split') || '[]');
    var tones = ['lit', 'mid', 'dim'];
    var seq = [];
    counts.forEach(function (n, g) { for (var i = 0; i < n; i++) seq.push(g); });
    var cc = document.createElement('canvas'); cc.setAttribute('aria-hidden', 'true'); crowdEl.appendChild(cc);
    var cctx, CL, shown = reduce ? seq.length : 0;
    var crowdLayout = function () {
      var W = crowdEl.clientWidth, narrow = W < 600, p = narrow ? 2 : 2.6, gap = 2;
      var cols = Math.floor(W / p), fh = S.mini[0].length, rowH = fh + 4;
      var rows = [], cur = [], cw = 0;
      seq.forEach(function (g, i) {
        var m = S.mini[Math.floor(rand(i, 3, 17) * S.mini.length)], w = m[0].length;
        if (cw + w > cols && cur.length) { rows.push({ figs: cur, w: cw - gap }); cur = []; cw = 0; }
        cur.push({ g: g, m: m, x: cw, i: i }); cw += w + gap;
      });
      if (cur.length) rows.push({ figs: cur, w: cw - gap });
      // filas parejas: se reparte el sobrante entre los huecos
      rows.forEach(function (r, ri) {
        var extra = ri < rows.length - 1 ? cols - r.w : 0, n = r.figs.length - 1;
        r.figs.forEach(function (f, k) { f.x += n > 0 ? Math.round(extra * k / n) : 0; });
        r.off = ri < rows.length - 1 ? 0 : Math.floor((cols - r.w) / 2);
      });
      CL = { p: p, cols: cols, rows: rows, fh: fh, rowH: rowH };
      cctx = sizeCanvas(cc, cols * p, rows.length * rowH * p);
    };
    var crowdDraw = function () {
      var P = Painter(cctx), p = CL.p, ds = p * 0.8, ins = (p - ds) / 2;
      cctx.clearRect(0, 0, CL.cols * p, CL.rows.length * CL.rowH * p);
      CL.rows.forEach(function (r, ri) {
        var y0 = ri * CL.rowH;
        r.figs.forEach(function (f) {
          if (f.i >= shown) return;
          for (var v = 0; v < f.m.length; v++) for (var x = 0; x < f.m[v].length; x++) {
            var ch = f.m[v].charAt(x);
            if (ch === '.') continue;
            P.add(tones[f.g], ch === '#' ? 0 : 6, (r.off + f.x + x) * p + ins, (y0 + v) * p + ins, ds, ds);
          }
        });
        for (var x = 0; x < CL.cols; x += 1) P.add('dim', x % 2 ? 6 : 2, x * p + ins, (y0 + CL.fh + 1) * p + ins, ds, ds);
      });
      P.flush();
    };
    crowdLayout(); crowdDraw();
    var cw0 = crowdEl.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () { if (crowdEl.clientWidth !== cw0) { cw0 = crowdEl.clientWidth; crowdLayout(); crowdDraw(); } }).observe(crowdEl);
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now();
        (function step(now) {
          shown = Math.min(seq.length, Math.ceil((now - t0) / 1500 * seq.length));
          crowdDraw();
          if (shown < seq.length) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.35 });
      io.observe(crowdEl);
    } else { shown = seq.length; crowdDraw(); }
  }

  // ---------- footer ----------
  var foot = document.querySelector('[data-v6-footer]');
  if (foot) F.DotField(foot, { glyphs: ['olive', 'amphora', 'olive'], rows: 22, pitch: 6, dot: 3.5, animate: false, seed: 6, label: 'Ramas de olivo y un ánfora en una franja de puntos' });
})();
