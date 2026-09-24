(function () {
  // 07 · Mosaico en ruinas: piso de teselas con greca y olas en espiral en bandas desde los bordes,
  // del que solo sobreviven islas irregulares (como una excavación). Más presente en los bordes.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function hash(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function noise(x, y, sc, s) {
    var gx = x / sc, gy = y / sc, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    var a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  var MEANDER = ['#######.', '#.....#.', '#.###.#.', '#.#.#.#.', '#.#...#.', '#.#####.', '#.......', '########'];
  // Ola en espiral de 8×8 (se repite a lo largo de la banda).
  var WAVE = ['..####..', '.#....#.', '#..##..#', '#.#..#.#', '#.#.#..#', '.#..#.#.', '.....#..', '#######.'];
  function mount(target) {
    var c = document.createElement('canvas'), ctx = c.getContext('2d');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    target.appendChild(c);
    function draw() {
      var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1, P = 10, D = 7;
      if (!W || !H) return;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var cols = Math.ceil(W / P), rows = Math.ceil(H / P);
      var off = tok('dot-off', '#1a1706'), dim = tok('dot-dim', '#5c4a12'), amber = tok('dot-amber', '#f9bc12'), ink = tok('ink', '#d4d4d4');
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        var dl = x, dr = cols - 1 - x, dt = y, db = rows - 1 - y, d = Math.min(dl, dr, dt, db);
        // Qué sobrevive: ruido con umbral que baja cerca de los bordes (más ruina en el centro).
        var edge = Math.min(1, d / Math.max(12, Math.min(cols, rows) * 0.33));
        var n = noise(x, y, 11, 3) * 0.7 + noise(x, y, 4, 9) * 0.3;
        if (n < 0.46 + edge * 0.36) continue;
        var horiz = d === dt || d === db, i = horiz ? x : y, color = null, a = 0.5;
        if (d === 0 || d === 10 || d === 20) { color = amber; a = 0.32; }
        else if (d >= 1 && d <= 8) { var r = d - 1; if ((d === dl || d === db) && !horiz) r = 7 - r; if (horiz && d === db) r = 7 - r; color = MEANDER[r][((i % 8) + 8) % 8] === '#' ? ink : off; a = color === ink ? 0.2 : 0.55; }
        else if (d >= 11 && d <= 18) { var rw = d - 11; color = WAVE[rw][((i % 8) + 8) % 8] === '#' ? dim : off; a = color === dim ? 0.7 : 0.5; }
        else { color = (x + y) % 9 === 0 ? dim : off; a = 0.45; }
        // Teselas irregulares: tamaño y posición un poco al azar, algunas faltan.
        if (hash(x, y, 21) < 0.08) continue;
        var j = hash(x, y, 5), s = D - (j < 0.3 ? 1 : 0);
        ctx.globalAlpha = a * (0.75 + 0.25 * hash(x, y, 8));
        ctx.fillStyle = color;
        ctx.fillRect(x * P + (P - s) / 2 + (hash(x, y, 6) - 0.5), y * P + (P - s) / 2 + (hash(x, y, 7) - 0.5), s, s);
      }
      ctx.globalAlpha = 1;
    }
    draw();
    var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
    if (ro) ro.observe(target); else addEventListener('resize', draw);
    return function () { if (ro) ro.disconnect(); c.remove(); };
  }
  (window.ForumBackdrops = window.ForumBackdrops || {})['07'] = {
    name: 'Mosaico en ruinas',
    note: 'Piso de teselas con greca y olas desde los bordes, del que solo quedan islas, como una excavación. El centro queda casi limpio para el texto.',
    mount: mount,
  };
})();
