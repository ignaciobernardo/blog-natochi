(function () {
  // 02 · Borde de mosaico: campo de teselas lisas muy tenue y bandas de greca y olas enmarcando la pantalla.
  function css(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function rnd(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  var MEANDER = ['#######.', '#.....#.', '#.###.#.', '#.#.#.#.', '#.#...#.', '#.#####.', '#.......', '########'];
  var WAVE = [ // ola en espiral (vitruviana) de 10×7
    '....###...',
    '...#...#..',
    '..#..#..#.',
    '..#.#.#.#.',
    '..#..#..#.',
    '.#......#.',
    '#########.',
  ];
  function rot(m) { var o = []; for (var x = 0; x < m[0].length; x++) { var r = ''; for (var y = m.length - 1; y >= 0; y--) r += m[y][x]; o.push(r); } return o; }
  (window.ForumBackdrops = window.ForumBackdrops || {})['02'] = {
    name: 'Borde de mosaico',
    note: 'Campo de teselas lisas casi invisible y, en los bordes, bandas de greca y olas hechas de teselas, como un piso romano.',
    mount: function (target) {
      var c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var ctx = c.getContext('2d'), off = css('dot-off', '#1a1706'), dim = css('dot-dim', '#5c4a12'), amber = css('dot-amber', '#f9bc12');
      function tess(x, y, s, gx, gy, color, a) {
        var j = (rnd(gx, gy, 3) - 0.5) * 1.2, k = (rnd(gx, gy, 4) - 0.5) * 1.2;
        ctx.globalAlpha = a * 0.5 * (0.8 + rnd(gx, gy, 5) * 0.2); ctx.fillStyle = color; // 0.5: más oscuro
        ctx.fillRect(x + j, y + k, s - rnd(gx, gy, 6), s - rnd(gx, gy, 7));
      }
      // Estampa un patrón repetido en módulos enteros, centrados en [a, a+len), en celdas de P.
      function band(m, horiz, x0, y0, len, P, color, a, seed) {
        var tw = horiz ? m[0].length : m.length, n = Math.floor(len / (tw * P));
        if (n < 1) return;
        var start = Math.floor((len - n * tw * P) / 2);
        for (var i = 0; i < n; i++) for (var y = 0; y < m.length; y++) for (var x = 0; x < m[0].length; x++) {
          if (m[y][x] !== '#') continue;
          var px = horiz ? x0 + start + (i * tw + x) * P : x0 + x * P;
          var py = horiz ? y0 + y * P : y0 + start + (i * tw + y) * P;
          tess(px, py, P - 2, Math.round(px), Math.round(py), color, a);
        }
      }
      function square(x, y, n, P, color, a) {
        for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) {
          var edge = xx === 0 || yy === 0 || xx === n - 1 || yy === n - 1, mid = xx === Math.floor(n / 2) && yy === Math.floor(n / 2);
          if (edge || mid) tess(x + xx * P, y + yy * P, P - 2, x + xx * 7, y + yy * 7, color, a);
        }
      }
      function draw() {
        var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
        if (!W || !H) return;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var narrow = W < 640, P = narrow ? 5 : 7, m = P * 2;
        // Campo: teselas lisas.
        var F = narrow ? 11 : 13;
        for (var gy = 0; gy * F < H; gy++) for (var gx = 0; gx * F < W; gx++) tess(gx * F, gy * F, F - 3, gx, gy, rnd(gx, gy, 1) < 0.12 ? dim : off, rnd(gx, gy, 1) < 0.12 ? 0.35 : 0.6);
        // Bandas: greca por fuera y olas por dentro (en móvil solo greca).
        var g = 8 * P, cornerG = g;
        ctx.globalAlpha = 1; ctx.fillStyle = '#000';
        ctx.fillRect(m - P, m - P, W - 2 * m + 2 * P, g + 2 * P); ctx.fillRect(m - P, H - m - g - P, W - 2 * m + 2 * P, g + 2 * P);
        ctx.fillRect(m - P, m - P, g + 2 * P, H - 2 * m + 2 * P); ctx.fillRect(W - m - g - P, m - P, g + 2 * P, H - 2 * m + 2 * P);
        var inner = W - 2 * m - 2 * cornerG, innerH = H - 2 * m - 2 * cornerG;
        band(MEANDER, true, m + cornerG, m, inner, P, amber, 0.2);
        band(MEANDER.slice().reverse(), true, m + cornerG, H - m - g, inner, P, amber, 0.2);
        band(rot(MEANDER), false, m, m + cornerG, innerH, P, amber, 0.2);
        band(rot(rot(rot(MEANDER))), false, W - m - g, m + cornerG, innerH, P, amber, 0.2);
        [[m, m], [W - m - g, m], [m, H - m - g], [W - m - g, H - m - g]].forEach(function (q) { square(q[0], q[1], 8, P, amber, 0.2); });
        if (!narrow) {
          var o = m + g + 3 * P, wh = WAVE.length * P, cw = wh;
          ctx.globalAlpha = 1; ctx.fillStyle = '#000';
          ctx.fillRect(o - P, o - P, W - 2 * o + 2 * P, wh + 2 * P); ctx.fillRect(o - P, H - o - wh - P, W - 2 * o + 2 * P, wh + 2 * P);
          ctx.fillRect(o - P, o - P, wh + 2 * P, H - 2 * o + 2 * P); ctx.fillRect(W - o - wh - P, o - P, wh + 2 * P, H - 2 * o + 2 * P);
          var iw = W - 2 * o - 2 * cw, ih = H - 2 * o - 2 * cw;
          band(WAVE, true, o + cw, o, iw, P, amber, 0.13);
          band(WAVE.slice().reverse(), true, o + cw, H - o - wh, iw, P, amber, 0.13);
          band(rot(WAVE), false, o, o + cw, ih, P, amber, 0.13);
          band(rot(rot(rot(WAVE))), false, W - o - wh, o + cw, ih, P, amber, 0.13);
          [[o, o], [W - o - cw, o], [o, H - o - cw], [W - o - cw, H - o - cw]].forEach(function (q) { square(q[0], q[1], 7, P, amber, 0.13); });
        }
        ctx.globalAlpha = 1;
      }
      draw();
      var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
      if (ro) ro.observe(target); else addEventListener('resize', draw);
      return function () { if (ro) ro.disconnect(); else removeEventListener('resize', draw); c.remove(); };
    },
  };
})();
