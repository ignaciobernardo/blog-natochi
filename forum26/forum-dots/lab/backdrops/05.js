(function () {
  // 05 · Mosaico que se ilumina: teselas apenas visibles; alrededor del mouse se encienden en ámbar y se apagan lento.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function rnd(x, y) { var h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  (window.ForumBackdrops = window.ForumBackdrops || {})['05'] = {
    name: 'Mosaico que se ilumina',
    note: 'Un piso de teselas casi invisible; donde pasa el mouse, las teselas se encienden en ámbar y se apagan despacio.',
    mount: function (target) {
      var c = document.createElement('canvas'), ctx = c.getContext('2d');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var P = 14, T = 10, R = 180, cols, rows, heat, W, H, dpr, raf = 0, mouse = null, dead = false;
      var off = tok('dot-off', '#1a1706'), amber = tok('dot-amber', '#f9bc12'), lit = tok('dot-lit', '#ffec40');
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      function size() {
        dpr = window.devicePixelRatio || 1; W = target.clientWidth; H = target.clientHeight;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cols = Math.ceil(W / P) + 1; rows = Math.ceil(H / P) + 1; heat = new Float32Array(cols * rows);
        base();
      }
      // Teselas con leve irregularidad (como el mosaico real): tamaño y offset por celda.
      function tile(x, y, color, a) {
        var j = rnd(x, y), s = T - (j < 0.3 ? 1 : 0), ox = (rnd(y, x) - 0.5) * 1.2, oy = (j - 0.5) * 1.2;
        ctx.globalAlpha = a; ctx.fillStyle = color;
        ctx.fillRect(x * P + (P - s) / 2 + ox, y * P + (P - s) / 2 + oy, s, s);
      }
      function base() {
        ctx.clearRect(0, 0, W, H);
        for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) tile(x, y, off, 0.55 + rnd(x + 7, y) * 0.35);
        ctx.globalAlpha = 1;
      }
      function frame() {
        raf = 0; if (dead) return;
        var r = target.getBoundingClientRect(), mx = mouse ? mouse[0] - r.left : -1e4, my = mouse ? mouse[1] - r.top : -1e4, alive = false;
        var x0 = 0, x1 = cols - 1, y0 = 0, y1 = rows - 1;
        for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
          var i = y * cols + x, h = heat[i];
          var d = Math.hypot(x * P + P / 2 - mx, y * P + P / 2 - my) / R, want = d < 1 ? Math.pow(1 - d, 1.6) : 0;
          var nh = want > h ? h + (want - h) * 0.35 : h * 0.965;
          if (nh < 0.01) nh = 0;
          if (nh === h) continue;
          heat[i] = nh; if (nh > 0) alive = true;
          ctx.clearRect(x * P - 1, y * P - 1, P + 2, P + 2);
          tile(x, y, off, 0.55 + rnd(x + 7, y) * 0.35);
          if (nh > 0) tile(x, y, nh > 0.7 ? lit : amber, nh * 0.42);
        }
        ctx.globalAlpha = 1;
        if (alive || mouse) raf = requestAnimationFrame(frame);
      }
      function move(e) { if (e.pointerType === 'touch') return; mouse = [e.clientX, e.clientY]; if (!raf) raf = requestAnimationFrame(frame); }
      function leave() { mouse = null; if (!raf) raf = requestAnimationFrame(frame); }
      size();
      var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(target);
      if (!reduce) { addEventListener('pointermove', move, { passive: true }); document.addEventListener('mouseleave', leave); }
      return function () { dead = true; cancelAnimationFrame(raf); removeEventListener('pointermove', move); document.removeEventListener('mouseleave', leave); if (ro) ro.disconnect(); c.remove(); };
    }
  };
})();
