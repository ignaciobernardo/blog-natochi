(function () {
  // 10 · Mosaico con emblemas: campo de teselas tenue con emblemas griegos en una grilla diagonal; titilan apenas.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function rnd(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function mount(target) {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    target.appendChild(c);
    var ctx = c.getContext('2d'), stamps = [], W = 0, H = 0, raf = 0, last = 0, dead = false;
    var names = ['amphora', 'olive', 'owl', 'laurel', 'column', 'lyre', 'helmet', 'torch'];
    function field() {
      var P = 6, D = 5, off = (P - D) / 2, dark = tok('dot-off', '#1a1706'), dim = tok('dot-dim', '#5c4a12');
      for (var y = 0; y * P < H; y++) for (var x = 0; x * P < W; x++) {
        var r = rnd(x, y, 7);
        ctx.globalAlpha = 0.22 + r * 0.25;
        ctx.fillStyle = r > 0.97 ? dim : dark;
        ctx.fillRect(x * P + off, y * P + off, D, D);
      }
    }
    function drawStamp(s, a) {
      var m = s.m, P = s.p, D = P - 1, amber = tok('dot-amber', '#f9bc12'), dim = tok('dot-dim', '#5c4a12');
      ctx.clearRect(s.x - 2, s.y - 2, m[0].length * P + 4, m.length * P + 4);
      for (var y = 0; y < m.length; y++) for (var x = 0; x < m[y].length; x++) {
        var ch = m[y][x];
        if (ch === '.') continue;
        ctx.globalAlpha = (ch === '#' ? 1 : 0.5) * a;
        ctx.fillStyle = ch === '#' ? amber : dim;
        ctx.fillRect(s.x + x * P, s.y + y * P, D, D);
      }
    }
    function draw() {
      W = target.clientWidth; H = target.clientHeight;
      if (!W || !H) return;
      var dpr = window.devicePixelRatio || 1;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      field();
      var G = (window.Forum && Forum.glyphs) || {}, list = names.filter(function (n) { return G[n]; });
      stamps = [];
      var step = W < 640 ? 150 : 210, P = W < 640 ? 2 : 3, k = 0;
      for (var row = 0, y = 40; y < H; row++, y += step * 0.75) {
        for (var x = (row % 2 ? step / 2 : 0) + 30; x < W; x += step) {
          var m = G[list[k++ % list.length]];
          if (!m) continue;
          var s = { m: m, p: P, x: Math.round(x - m[0].length * P / 2), y: Math.round(y - m.length * P / 2), base: 0.16, a: 0.16 };
          stamps.push(s);
        }
      }
      // limpiar debajo de cada emblema y dibujarlo
      stamps.forEach(function (s) { drawStamp(s, s.base); });
      ctx.globalAlpha = 1;
    }
    function tick(t) {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      if (t - last < 420 || !stamps.length) return;
      last = t;
      var s = stamps[Math.floor(Math.random() * stamps.length)];
      s.a = s.a > s.base ? s.base : s.base + 0.1;
      drawStamp(s, s.a);
    }
    draw();
    var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
    if (ro) ro.observe(target);
    if (!reduced()) raf = requestAnimationFrame(tick);
    return function () { dead = true; cancelAnimationFrame(raf); if (ro) ro.disconnect(); c.remove(); };
  }
  (window.ForumBackdrops = window.ForumBackdrops || {})['10'] = {
    name: 'Mosaico con emblemas', note: 'Un piso de teselas tenue con ánforas, olivos, lechuzas y laureles en diagonal; titilan de a uno.', mount: mount,
  };
})();
