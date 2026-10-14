// Enredaderas en los títulos, con el motor de Roots (ingeniería inversa de Root Toy, en ./roots/).
// Al pasar el mouse por un título (o al seleccionarlo), cada línea del título se convierte en un campo de distancia y le
// crecen tallos que se agarran al contorno de las letras y las envuelven: los de atrás van en un canvas detrás del texto y
// los de adelante en otro delante, así la letra real queda en medio. Al salir, se recogen.
// Los canvas viven dentro del título: hacen scroll con el texto. Solo títulos grandes; nada con reduced-motion.
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var canHover = !(window.matchMedia && window.matchMedia('(hover: none)').matches);
  var script = document.currentScript, BASE = script && script.src ? script.src.replace(/vines\.js.*$/, 'roots/') : 'roots/', VER = script && script.src && script.src.indexOf('?') > 0 ? script.src.slice(script.src.indexOf('?')) : '';
  var MIN_SIZE = 32, GROW_MS = 2400, SHRINK_MS = 900, HOLD = 350;
  var mods = null;
  function load() { if (!mods) mods = Promise.all([import(BASE + 'engine.js' + VER), import(BASE + 'sprites.js' + VER)]).then(function (m) { return { E: m[0], S: m[1] }; }); return mods; }

  function isTitle(el) {
    if (!el || !el.matches('h1,h2,h3,h4,[data-vine-title]')) return false;
    return parseFloat(getComputedStyle(el).fontSize) >= MIN_SIZE;
  }
  function titles() { return Array.prototype.filter.call(document.querySelectorAll('h1,h2,h3,h4,[data-vine-title]'), isTitle); }

  // colores del tema (azules) en lugar del verde de Root Toy
  function theme() {
    var cs = getComputedStyle(document.documentElement), g = function (n, d) { return (cs.getPropertyValue(n) || '').trim() || d; };
    var ink = g('--ink', '#0755bb'), lit = g('--dot-lit', '#0755bb'), mid = g('--dot-amber', '#5284c4'), dim = g('--dot-dim', '#98b0cd');
    return { outline: '#0a3474', tones: [dim, '#b7c8de', mid], leaf: { ink: '#0a3474', leafLight: dim, leafDark: mid, sepal: mid, neck: mid, heart: lit, pollen: ink, petal: dim } };
  }

  // Líneas visuales del título: caracteres agrupados por renglón, con la posición real de cada uno.
  function lines(title) {
    var out = [], walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT), n;
    while ((n = walker.nextNode())) {
      if (n.parentElement.closest('.fd-roots')) continue;
      var cs = getComputedStyle(n.parentElement), up = cs.textTransform === 'uppercase';
      for (var i = 0; i < n.nodeValue.length; i++) {
        var ch = n.nodeValue.charAt(i), rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1);
        var r = rg.getBoundingClientRect(); if (!r.width && !/\s/.test(ch)) continue;
        var key = Math.round(r.top), line = out.find(function (l) { return Math.abs(l.top - key) < 4; });
        if (!line) { line = { top: key, chars: [], cs: cs }; out.push(line); }
        line.chars.push({ ch: up ? ch.toUpperCase() : ch, r: r });
      }
    }
    return out.map(function (l) {
      var chars = l.chars; while (chars.length && /\s/.test(chars[0].ch)) chars.shift(); while (chars.length && /\s/.test(chars[chars.length - 1].ch)) chars.pop();
      return { text: chars.map(function (c) { return c.ch; }).join(''), first: chars[0], cs: l.cs };
    }).filter(function (l) { return l.text.trim().length; });
  }

  function makeCanvas(cls, host, x, y, w, h, k) {
    var c = document.createElement('canvas'); c.className = 'fd-roots ' + cls; c.setAttribute('aria-hidden', 'true');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.style.cssText = 'left:' + x.toFixed(1) + 'px;top:' + y.toFixed(1) + 'px;width:' + w + 'px;height:' + h + 'px';
    host.appendChild(c); return c;
  }

  async function buildTitle(title) {
    var M = await load(), E = M.E, S = M.S, T = theme(), pieces = [];
    if (getComputedStyle(title).position === 'static') title.style.position = 'relative';
    title.classList.add('fd-roots-host');
    var box = title.getBoundingClientRect(), bx = box.left + title.clientLeft, by = box.top + title.clientTop;
    var ls = lines(title);
    for (var li = 0; li < ls.length; li++) {
      var L = ls[li], cs = L.cs, size = parseFloat(cs.fontSize), spacing = parseFloat(cs.letterSpacing) || 0;
      var scene = await E.buildScene({ text: L.text, fontFamily: cs.fontFamily, fontWeight: cs.fontWeight, align: 'left' },
        { size: size, tracking: spacing, lineHeight: 1.1, branches: 50, leaves: 30, flowers: 0, width: 50, seed: 7 + li * 31 + L.text.length },
        { capital: false });
      // los títulos son chicos para Root Toy (pensado a 200 px): tallos y hojas más gruesos para que se lean
      var k = Math.max(1, 150 / size);
      scene.stemWidth *= k * 0.8; scene.outline *= k * 0.7; scene.taperArc *= 1.4;
      scene.stems.forEach(function (st) { st.leaves.forEach(function (lf) { lf.size *= k * 0.6; }); });
      // alinear la línea base y el primer carácter del layout con el texto real
      var run = scene.glyph.lines[0].runs[0], ctx = document.createElement('canvas').getContext('2d');
      ctx.font = cs.fontWeight + ' ' + size + 'px ' + cs.fontFamily;
      var m = ctx.measureText(L.text.charAt(0)), asc = ctx.measureText('Hg').fontBoundingBoxAscent;
      var domX = L.first.r.left - bx, domBase = L.first.r.top - by + asc;
      var x = domX - run.x, y = domBase - run.y, W = scene.glyph.width, H = scene.glyph.height;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      pieces.push({ scene: scene, back: makeCanvas('fd-roots--back', title, x, y, W, H, dpr), front: makeCanvas('fd-roots--front', title, x, y, W, H, dpr), dpr: dpr });
    }
    return { pieces: pieces, E: E, S: S, T: T };
  }

  function paint(st, now) {
    var E = st.E, S = st.S, T = st.T;
    st.pieces.forEach(function (pc) {
      var s = pc.scene, upTo = E.easeOut(Math.max(0, Math.min(1, st.prog))) * s.totalArc, pop = Math.exp(-(now - st.born) / 520);
      [[pc.back, false], [pc.front, true]].forEach(function (pair) {
        var c = pair[0].getContext('2d'), front = pair[1];
        c.setTransform(pc.dpr, 0, 0, pc.dpr, 0, 0); c.clearRect(0, 0, s.glyph.width, s.glyph.height); c.lineCap = 'round'; c.lineJoin = 'round';
        s.stems.forEach(function (stem) {
          if (stem.front[0] !== front) return;
          var a = upTo - stem.startArc; if (a <= 0) return;
          c.strokeStyle = T.outline; E.drawStem(c, stem, front, s.stemWidth, s.outline, s.taperArc, a);
          c.strokeStyle = T.tones[Math.min(stem.depth, 2)]; E.drawStem(c, stem, front, s.stemWidth, 0, s.taperArc, a);
        });
        s.stems.forEach(function (stem) {
          if (stem.front[0] !== front) return;
          var u = upTo - stem.startArc; if (u <= 0) return;
          stem.leaves.forEach(function (lf) {
            if (lf.arc > u) return;
            var n = Math.max(1, Math.min((55 * s.opts.fontSize) / 512, s.totalArc - stem.startArc - lf.arc)), k = E.easeOut(Math.min(1, (u - lf.arc) / n));
            if (k <= 0) return;
            var ph = 0.021 * lf.p.x + 0.013 * lf.p.y, w = 0.18 * Math.sin(0.0016 * now + ph), p = 0.5 * Math.max(1 - k, pop) * Math.sin(0.011 * now + ph);
            c.save(); c.translate(lf.p.x, lf.p.y); c.rotate(Math.atan2(lf.dir.y, lf.dir.x) + Math.PI / 2 + w + p);
            S.drawSprite(c, S.LEAVES[lf.kind % S.LEAVES.length], lf.size * k, s.outline * k, T.leaf);
            c.restore();
          });
        });
      });
    });
  }

  var live = new Map();                                     // título -> estado
  function tick(now) {
    var any = false;
    live.forEach(function (st, title) {
      if (!st.pieces) return;
      var dt = now - (st.last || now); st.last = now;
      if (st.dir > 0) st.prog = Math.min(1, st.prog + dt / GROW_MS); else st.prog = Math.max(0, st.prog - dt / SHRINK_MS);
      paint(st, now);
      if (st.dir < 0 && st.prog <= 0) { st.pieces.forEach(function (pc) { pc.back.remove(); pc.front.remove(); }); live.delete(title); return; }
      any = true;
    });
    raf = any ? requestAnimationFrame(tick) : 0;
  }
  var raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }

  function grow(title) {
    var st = live.get(title);
    if (st) { clearTimeout(st.timer); st.dir = 1; kick(); return; }
    st = { dir: 1, prog: 0, born: performance.now(), pieces: null, timer: 0 }; live.set(title, st);
    buildTitle(title).then(function (b) {
      if (live.get(title) !== st) { b.pieces.forEach(function (pc) { pc.back.remove(); pc.front.remove(); }); return; }
      st.pieces = b.pieces; st.E = b.E; st.S = b.S; st.T = b.T; st.born = performance.now(); st.last = 0; kick();
    }).catch(function (e) { live.delete(title); if (window.console) console.warn('vines', e); });
  }
  function release(title) {
    var st = live.get(title); if (!st) return;
    clearTimeout(st.timer);
    st.timer = setTimeout(function () { st.dir = -1; if (!st.pieces) live.delete(title); kick(); }, HOLD);
  }

  var selected = new Set(), selTimer = 0;
  function wire() {
    titles().forEach(function (t) {
      if (t._fdVines) return; t._fdVines = true;
      if (canHover) {
        t.addEventListener('mouseenter', function () { grow(t); });
        t.addEventListener('mouseleave', function () { if (!selected.has(t)) release(t); });
      }
    });
  }
  document.addEventListener('selectionchange', function () {
    clearTimeout(selTimer);
    selTimer = setTimeout(function () {
      var sel = window.getSelection(), now = new Set();
      if (sel && !sel.isCollapsed && sel.rangeCount) { var rg = sel.getRangeAt(0); titles().forEach(function (t) { if (rg.intersectsNode(t)) now.add(t); }); }
      now.forEach(function (t) { if (!selected.has(t)) grow(t); });
      selected.forEach(function (t) { if (!now.has(t)) release(t); });
      selected = now;
    }, 120);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
  window.addEventListener('load', wire);
  window.addEventListener('resize', function () { live.forEach(function (st) { if (st.pieces) st.pieces.forEach(function (pc) { pc.back.remove(); pc.front.remove(); }); }); live.clear(); });
  window.FdVines = { grow: grow, release: release, titles: titles, live: live };
})();
