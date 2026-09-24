(function () {
  // 08 · Opus sectile: losas grandes de mármol (cuadrado, rombo, círculo inscrito) en contorno de puntos finos,
  // algunas rellenas con teselas muy tenues.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function hash(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function mount(target) {
    var c = document.createElement('canvas'), ctx = c.getContext('2d');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    target.appendChild(c);
    function draw() {
      var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
      if (!W || !H) return;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var dim = tok('dot-dim', '#5c4a12'), amber = tok('dot-amber', '#f9bc12'), off = tok('dot-off', '#1a1706');
      var S = W < 640 ? 120 : 176, STEP = 7, DOT = 2;
      var ox = ((W % S) - S) / 2, oy = 0;
      function dotAt(x, y, color, a) { ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(Math.round(x - DOT / 2), Math.round(y - DOT / 2), DOT, DOT); }
      function line(x1, y1, x2, y2, color, a) {
        var n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / STEP));
        for (var i = 0; i <= n; i++) dotAt(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, color, a);
      }
      function circle(cx, cy, r, color, a) {
        var n = Math.max(12, Math.round(2 * Math.PI * r / STEP));
        for (var i = 0; i < n; i++) dotAt(cx + r * Math.cos(i / n * 2 * Math.PI), cy + r * Math.sin(i / n * 2 * Math.PI), color, a);
      }
      function tesserae(inside, x0, y0, color, a) {
        for (var y = y0 + 6; y < y0 + S - 3; y += 9) for (var x = x0 + 6; x < x0 + S - 3; x += 9)
          if (inside(x, y)) { ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(x - 2.5, y - 2.5, 5, 5); }
      }
      for (var gy = 0; oy + gy * S < H; gy++) for (var gx = 0; ox + gx * S < W; gx++) {
        var x0 = ox + gx * S, y0 = oy + gy * S, cx = x0 + S / 2, cy = y0 + S / 2, h = S / 2 - 12;
        // Marco de la losa (junta).
        line(x0, y0, x0 + S, y0, dim, 0.55); line(x0, y0, x0, y0 + S, dim, 0.55);
        var t = (gx + gy) % 2, fill = hash(gx, gy, 4) < 0.28;
        if (t === 0) {
          // Rombo con círculo inscrito.
          line(cx, cy - h, cx + h, cy, dim, 0.5); line(cx + h, cy, cx, cy + h, dim, 0.5);
          line(cx, cy + h, cx - h, cy, dim, 0.5); line(cx - h, cy, cx, cy - h, dim, 0.5);
          circle(cx, cy, h * 0.68, dim, 0.45);
          if (fill) tesserae(function (x, y) { return Math.hypot(x - cx, y - cy) < h * 0.6; }, x0, y0, amber, 0.07);
          else tesserae(function (x, y) { return Math.abs(x - cx) + Math.abs(y - cy) < h && Math.hypot(x - cx, y - cy) > h * 0.76; }, x0, y0, off, 0.6);
        } else {
          // Cuadrado dentro de cuadrado, con un punto al centro.
          var q = h * 0.78;
          line(cx - q, cy - q, cx + q, cy - q, dim, 0.45); line(cx + q, cy - q, cx + q, cy + q, dim, 0.45);
          line(cx + q, cy + q, cx - q, cy + q, dim, 0.45); line(cx - q, cy + q, cx - q, cy - q, dim, 0.45);
          circle(cx, cy, q * 0.35, dim, 0.4);
          if (fill) tesserae(function (x, y) { return Math.abs(x - cx) < q - 4 && Math.abs(y - cy) < q - 4 && Math.hypot(x - cx, y - cy) > q * 0.45; }, x0, y0, amber, 0.06);
        }
      }
      ctx.globalAlpha = 1;
    }
    draw();
    var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
    if (ro) ro.observe(target); else addEventListener('resize', draw);
    return function () { if (ro) ro.disconnect(); c.remove(); };
  }
  (window.ForumBackdrops = window.ForumBackdrops || {})['08'] = {
    name: 'Opus sectile',
    note: 'Losas grandes de mármol en contorno de puntos: rombos con círculo y cuadrados anidados, algunas con teselas muy tenues.',
    mount: mount,
  };
})();
