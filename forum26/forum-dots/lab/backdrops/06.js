(function () {
  // 06 · Mosaico en parallax: dos capas de mosaico (teselas finas y grecas grandes) que se desplazan a distinta velocidad con el scroll.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function rnd(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  var MEANDER = ['#######.', '#.....#.', '#.###.#.', '#.#.#.#.', '#.#...#.', '#.#####.', '#.......', '########'];
  // Una baldosa grande: marco de greca (8 módulos por lado) alrededor de un campo de teselas.
  function tilePattern(P, color, bg) {
    var M = 8, N = 4, size = M * N + 8, c = document.createElement('canvas'), x = c.getContext('2d');
    c.width = size * P; c.height = size * P;
    for (var gy = 0; gy < size; gy++) for (var gx = 0; gx < size; gx++) {
      var inBand = gx < M || gy < M || gx >= size - M || gy >= size - M, on = false;
      if (inBand) {
        var bx = gx % M, by = gy % M;
        on = gy < M || gy >= size - M ? MEANDER[by][bx] === '#' : MEANDER[bx][by] === '#';
      }
      var s = P * 0.7, o = (P - s) / 2 + (rnd(gx, gy) - 0.5);
      x.fillStyle = on ? color : bg;
      x.globalAlpha = on ? 1 : 0.55 + rnd(gy, gx) * 0.3;
      x.fillRect(gx * P + o, gy * P + o, s, s);
    }
    return c;
  }
  function dots(P, color) {
    var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = c.height = P * 6;
    for (var y = 0; y < 6; y++) for (var i = 0; i < 6; i++) { x.globalAlpha = 0.6 + rnd(i, y) * 0.4; x.fillStyle = color; x.fillRect(i * P + P * 0.2, y * P + P * 0.2, P * 0.6, P * 0.6); }
    return c;
  }
  (window.ForumBackdrops = window.ForumBackdrops || {})['06'] = {
    name: 'Mosaico en parallax',
    note: 'Dos capas: teselas finas cerca y baldosas con greca más lejos; al hacer scroll se mueven a distinta velocidad y el fondo gana profundidad.',
    mount: function (target) {
      var c = document.createElement('canvas'), ctx = c.getContext('2d');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var off = tok('dot-off', '#1a1706'), dim = tok('dot-dim', '#5c4a12');
      var far = tilePattern(9, dim, off), near = dots(6, off);
      var W, H, dpr, raf = 0, dead = false, farPat, nearPat;
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      function size() {
        dpr = window.devicePixelRatio || 1; W = target.clientWidth; H = target.clientHeight;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        farPat = ctx.createPattern(far, 'repeat'); nearPat = ctx.createPattern(near, 'repeat');
        draw();
      }
      function draw() {
        raf = 0; if (dead) return;
        var sy = reduce ? 0 : scrollY;
        ctx.clearRect(0, 0, W, H);
        ctx.save(); ctx.globalAlpha = 0.5; ctx.translate(0, -(sy * 0.12) % far.height); ctx.fillStyle = nearPat; ctx.fillRect(0, 0, W, H + far.height); ctx.restore();
        ctx.save(); ctx.globalAlpha = 0.32; ctx.translate(-far.width / 4, -(sy * 0.35) % far.height); ctx.fillStyle = farPat; ctx.fillRect(0, 0, W + far.width, H + far.height); ctx.restore();
      }
      function onScroll() { if (!raf) raf = requestAnimationFrame(draw); }
      size();
      var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(target);
      if (!reduce) addEventListener('scroll', onScroll, { passive: true });
      return function () { dead = true; cancelAnimationFrame(raf); removeEventListener('scroll', onScroll); if (ro) ro.disconnect(); c.remove(); };
    }
  };
})();
