// Cabalgata: cordillera en puntos con una caravana de jinetes y un cielo estrellado. Usa los tokens del design system.
(function () {
  var RIDER = [["...............+##...............", "...............####..............", "..............+###...............", "...............+##...............", "..............###................", "..............####...............", "..............####...........+...", ".............+####+.......++##...", ".............######.....+######..", ".............#######...########..", ".............########.#########..", "............########+##########+.", "........###################+####.", ".....+#####################..###.", "....########################+.#+.", "...##+####################.......", "...##.####################.......", "..+##.####################.......", "..###.###################+.......", "..###.###################........", "..###.#######..+#########+.......", ".+###.###.##+.......+#####+......", ".###+###..##........+#+..##......", "..+#+#+..+##........+#....#......", "....##....##........+#....#......", "....##.....#........+#...+#......", "....#+.....##.......+#...##......", "....#.......#+......##..##.......", "....#+.......#......+#..+........", "....##.......#+......##.........."], ["...............+##...............", "...............####..............", "..............+###...............", "...............###...............", "..............###................", "..............####...............", "..............####...........+...", ".............+####+.......++##...", ".............######.....+######..", ".............#######...########..", "............+########.#########..", "............########+##########+.", "........###################+####.", ".....+#####################..+##.", "....########################+.#+.", "...+#+####################.......", "...##.####################.......", "..+##.###################+.......", "..###.###################........", "..###.###################........", "..###.#######..+#########........", ".+###.###.##+.......+#####.......", ".###+###..##........+#+.+##......", "..+#+#+..+##........+#...##......", "....##....##........+#...#+......", "....##.....#+.......+#..+#.......", "....#+.....+#.......+#.+##.......", "....#.......##......##.##........", "....#+.......#......+#...........", "....##.......#+......##.........."], ["...............###...............", "...............####..............", "...............###...............", "...............###...............", "..............###................", "..............####...............", "..............####...........+...", ".............+####+.......++##...", ".............######.....+######..", ".............#######+..########..", "............+########.#########..", "............########+##########+.", "........###################.####.", ".....+#####################..###.", "....########################+.#+.", "...##+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.+##################........", "..###.+#####...+########+........", ".+###+######........#####........", ".######..##.........##..##.......", "..+#+#..+##.........##...#.......", "....+#...##.........##..##.......", "....+#...##.........#+.+#........", "....##....#.........#.##+........", "...+#+....##........#.#..........", "...##.....+#+.......##...........", "...........##.......+#..........."], ["...............##+...............", "..............+###+..............", "...............###...............", "...............##+...............", "..............###................", "..............####...............", ".............+####...........+...", ".............#####........++##...", ".............######.....+######..", ".............#######...########..", "............#########.#########..", "............###################+.", "........###################.####.", ".....+#####################..###.", "....########################+.#+.", "...##+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.+##################........", "..###.+#####+..+#########........", ".+###+######........#####+.......", ".###+##+.##.........##..##.......", "..+#+#..+##.........##...#+......", "....+#...+#.........##...#.......", "....+#....##........##...#.......", "....##.....##.......#+..+#.......", "....#+......#.......#+.+#+.......", "...##.......#.......##.+#........", "...+.................#+.........."], ["...............+##...............", "...............####..............", "...............+##...............", "...............+##...............", "..............+##+...............", "..............####...............", "..............####+..........+...", ".............+#####.......++##...", ".............######.....+######..", ".............#######...########..", ".............########.#########..", "............###################+.", "........###################+####.", ".....+#####################..+##.", "....#######################+#.##.", "...+#+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.##################+........", "..###.#######..+#########........", ".+###.###.##........######.......", ".###+##+.##+........##..###......", "..##+##..##.........##...+#......", "....+#....##........##...+#......", "....+#.....#+.......#....##......", "....##.....+#.......#....#+......", "....#+......##.....+#...##.......", "....##......##......#...#+.......", "....+#+.............##..........."], ["...............+##...............", "...............####..............", "...............+##...............", "...............+##...............", "..............+##+...............", "..............####...............", "..............####+..........+...", ".............+#####.......++##...", ".............######.....+######..", ".............#######...########..", ".............########.#########..", "............###################..", "........###################+####.", ".....+#####################..###.", "....#######################+#.##.", "...+#+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.+#################+........", "..###.#######..+########+........", ".+###+###.##........+####+.......", ".######+.+##........+#+.##.......", "..####...##.........+#...#.......", "....##....#+........+#..##.......", "....##....+#........+#.##........", "....#+.....##.......+###.........", "...+#.......#+......##+..........", "...##.......##......+#...........", "...+........++.......##.........."], ["...............+##...............", "...............####..............", "...............+##+..............", "...............+##...............", "..............+##+...............", "..............####...............", "..............####+..........+...", "..............#####.......++##...", ".............+#####.....+######..", ".............#######...########..", ".............########.#########..", "............###################+.", "........###################+####.", ".....+#####################..###.", "....#######################+#+##.", "...+#+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.+##################........", "..###.#######..+########+........", ".+###.###.##........+####........", ".###+###.+##........+##+##.......", "..##.##..##..........#+..#+......", ".....#....#+........+#..+#.......", "....+#....+#.........#..#+.......", "....+#.....##........#.##........", "....##......#+......+###.........", "....+#......##.......##..........", ".....#+......#.......+#.........."], ["...............+##...............", "...............####..............", "...............+##...............", "...............+##...............", "..............+##................", "..............####...............", "..............####+..........+...", ".............+#####.......++##...", ".............######.....+######..", ".............#######...########..", ".............########.#########..", "............###################+.", "........###################+####.", ".....+#####################..###.", "....#######################+#.##.", "...+#+####################.......", "...##.###################+.......", "..+##.###################........", "..###.###################........", "..###.+#####+############........", "..###.######...+#########........", "..#########+........#####+.......", ".######+.##.........##.+##.......", "..##+#..##+........+#....##......", "....+#..+#.........##....+#......", "....##...#+........#+.....#+.....", "....##...+#........#......##.....", "...+#+....#+......+#.......#.....", "...##.....##.......#.......##....", "...........##......#+.......+...."]];
  function tok(n, fb) { return getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim() || fb; }
  function rnd(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function colors() { return [tok('dot-off', '#1a1706'), tok('dot-dim', '#5c4a12'), tok('dot-amber', '#f9bc12'), tok('dot-lit', '#ffec40')]; }
  function surface(el, label) {
    var c = document.createElement('canvas');
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', label);
    c.style.display = 'block'; c.style.width = '100%';
    el.appendChild(c);
    return c;
  }
  function size(c, cols, rows, pitch) {
    var dpr = window.devicePixelRatio || 1;
    c.width = Math.round(cols * pitch * dpr); c.height = Math.round(rows * pitch * dpr);
    c.style.aspectRatio = cols + ' / ' + rows;
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); return x;
  }

  // Perfil de la cordillera: suma de ondas + picos, en filas desde arriba.
  function ridge(cols, rows, seed, base, amp) {
    var h = [];
    for (var x = 0; x < cols; x++) {
      var t = x / cols, v = 0;
      v += Math.sin(t * 6.3 + seed) * 0.35 + Math.sin(t * 13.1 + seed * 2) * 0.2 + Math.sin(t * 29 + seed * 3) * 0.08;
      v += Math.pow(Math.max(0, Math.sin(t * 3.7 + seed * 1.7)), 3) * 0.9;
      h.push(Math.round(base - v * amp));
    }
    return h;
  }

  function Andes(el, opts) {
    opts = opts || {};
    var flip = !!opts.flip;
    var c = surface(el, 'The Andes in dots, with a caravan of riders crossing the mountains'), ctx, cols, rows, pitch, dot, far, mid, near, trail, stars, riders, raf = 0, last = 0, t0 = 0;
    function build() {
      var W = el.clientWidth || 1000, narrow = W < 640;
      pitch = opts.pitch ? opts.pitch(narrow) : narrow ? 5 : 7; dot = Math.max(2, pitch - (pitch > 5 ? 2 : 1));
      cols = Math.floor(W / pitch); rows = opts.rows ? opts.rows(narrow) : narrow ? 70 : 88;
      ctx = size(c, cols, rows, pitch);
      // Cordillera lejana alta con nieve, cordón medio y una loma baja justo sobre el sendero de la caravana.
      far = ridge(cols, rows, 1.3, rows * 0.52, rows * 0.3);
      mid = ridge(cols, rows, 4.1, rows * 0.7, rows * 0.14);
      trail = rows - 3;
      near = ridge(cols, rows, 7.7, trail - 5, 3);
      // Ninguna cumbre toca el borde de arriba: si el pico más alto se sale, se aplana el perfil hacia la base.
      var top = rows * 0.14, minF = Math.min.apply(null, far), baseF = rows * 0.52;
      if (minF < top) far = far.map(function (v) { return Math.round(baseF - (baseF - v) * (baseF - top) / (baseF - minF)); });
      stars = [];
      // Estrellas en todo el cielo, hasta justo encima de la silueta de la cordillera.
      for (var i = 0; i < cols * (opts.stars || 0.9) * 1.6; i++) { var sx = Math.floor(rnd(i, 1, 3) * cols), sy = Math.floor(rnd(i, 2, 3) * (far[sx] - 1)); if (sy < far[sx] - 1) stars.push([sx, sy, rnd(i, 3, 3)]); }
      var n = opts.riders ? Math.max(2, Math.floor(cols / opts.riders)) : Math.max(2, Math.min(6, Math.floor(cols / 45))), gapc = cols / n;
      riders = []; for (var k = 0; k < n; k++) riders.push({ x: k * gapc + rnd(k, 9, 2) * 8, f: k * 3 });
      draw(0);
    }
    function dotAt(x, y, color, a) { ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = color; var o = (pitch - dot) / 2; ctx.fillRect(x * pitch + o, y * pitch + o, dot, dot); }
    function draw(t) {
      var col = colors();
      ctx.globalAlpha = 1; ctx.clearRect(0, 0, cols * pitch, rows * pitch);
      stars.forEach(function (s) { var tw = reduced ? 0.6 : 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + s[2]) + s[2] * 9)); dotAt(s[0], s[1], s[2] > 0.85 ? col[3] : col[1], tw); });
      for (var x = 0; x < cols; x++) {
        for (var y = far[x]; y < rows; y++) {
          var layer = y >= near[x] ? 3 : y >= mid[x] ? 2 : 1, v;
          if (layer === 1) { var snow = y - far[x] < 3 && far[x] < rows * 0.34; v = snow ? [col[3], 0.9] : (x + y) % 2 ? null : [col[1], 0.55]; }
          else if (layer === 2) { var edge = y === mid[x]; v = edge ? [col[2], 0.9] : (x + y) % 2 ? null : [col[0], 1]; }
          else { v = y === near[x] ? [col[2], 1] : y >= trail ? (y === trail ? [col[1], 1] : null) : (x % 3 === 0 && y % 3 === 0 ? [col[0], 1] : null); }
          if (y === far[x] && layer === 1) v = [col[2], 0.7];
          if (v) dotAt(x, y, v[0], v[1]);
        }
      }
      if (opts.sky === 'moon') {
        // Luna llena con cráteres tenues.
        var mx = cols * 0.78, my = rows * 0.28, mr = rows * 0.16;
        for (var yy2 = Math.floor(my - mr); yy2 <= my + mr; yy2++) for (var xx2 = Math.floor(mx - mr); xx2 <= mx + mr; xx2++) {
          var dd = Math.hypot(xx2 - mx, yy2 - my); if (dd > mr) continue;
          if (yy2 >= far[Math.max(0, Math.min(cols - 1, xx2))]) continue;
          dotAt(xx2, yy2, rnd(xx2, yy2, 44) < 0.18 ? col[2] : col[3], dd > mr - 1 ? 0.7 : 0.9);
        }
      }
      if (opts.sky === 'sun') {
        // Sol naciendo detrás de la cordillera lejana, con rayos que laten.
        var sx0 = cols * 0.5, sy0 = rows * 0.55, sr = rows * 0.2;
        for (var ry = 0; ry < rows; ry++) for (var rx = 0; rx < cols; rx++) {
          if (ry >= far[rx]) continue;
          var dx2 = rx - sx0, dy2 = ry - sy0, d2 = Math.hypot(dx2, dy2);
          if (d2 <= sr) { dotAt(rx, ry, col[3], 0.9); continue; }
          var ang = Math.atan2(dy2, dx2), k2 = Math.round(ang / (Math.PI / 12));
          if (Math.abs(ang - k2 * Math.PI / 12) * d2 < 0.6 && d2 < sr + rows * (k2 % 2 ? 0.35 : 0.55)) dotAt(rx, ry, col[2], reduced ? 0.6 : 0.35 + 0.35 * Math.max(0, Math.sin(d2 * 0.5 - t * 4)));
        }
      }
      if (opts.camp) {
        // Campamento: dos carpas triangulares y una fogata que titila, sobre el sendero.
        var cxp = Math.floor(cols * 0.72), ty0 = trail - 1;
        [[cxp - 16, 7], [cxp - 6, 6]].forEach(function (tn) { for (var h2 = 0; h2 < tn[1]; h2++) for (var w2 = -h2; w2 <= h2; w2++) { var ex = Math.abs(w2) === h2 || h2 === tn[1] - 1; dotAt(tn[0] + w2, ty0 - tn[1] + 1 + h2, ex ? col[2] : col[0], 1); } });
        var fx = cxp + 8;
        for (var fh2 = 0; fh2 < 7; fh2++) for (var fw2 = -3; fw2 <= 3; fw2++) {
          var fl = (7 - fh2) / 7 - Math.abs(fw2) / 4 + (reduced ? 0 : Math.sin(t * 9 + fw2 * 2 + fh2) * 0.25);
          if (fl > 0.2) dotAt(fx + fw2, ty0 - fh2, fl > 0.6 ? col[3] : col[2], Math.min(1, fl + 0.2));
        }
        dotAt(fx - 3, ty0, col[1], 1); dotAt(fx + 3, ty0, col[1], 1);
      }
      // Caravana: la mancha negra borra la cordillera y el contorno se enciende.
      riders.forEach(function (r) {
        var fr = RIDER[r.f % RIDER.length], fw = fr[0].length, fh = fr.length, x0 = Math.round(flip ? cols - r.x - fw : r.x), y0 = trail - fh;
        for (var yy = 0; yy < fh; yy++) for (var xx = 0; xx < fw; xx++) {
          var ch = fr[yy][flip ? fw - 1 - xx : xx], gx = x0 + xx; if (ch === '.' || gx < 0 || gx >= cols) continue;
          ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(gx * pitch, (y0 + yy) * pitch, pitch, pitch);
          dotAt(gx, y0 + yy, ch === '#' ? col[3] : col[2], ch === '#' ? 1 : 0.7);
        }
      });
      ctx.globalAlpha = 1;
    }
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!t0) t0 = now;
      if (now - last < 120) return;
      var dt = (now - last) / 1000; last = now;
      riders.forEach(function (r) { r.x += 1; r.f++; if (r.x > cols + 2) r.x = -RIDER[0][0].length - rnd(r.f, 1, 4) * 20; });
      draw((now - t0) / 1000);
    }
    build();
    var lastW = el.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () { if (el.clientWidth !== lastW) { lastW = el.clientWidth; build(); } }).observe(el);
    if (!reduced) raf = requestAnimationFrame(tick);
  }

  // Cielo estrellado con la Cruz del Sur.
  function Stars(el) {
    var c = surface(el, 'A night sky full of stars, with the Southern Cross'), ctx, cols, rows, pitch = 6, dot = 3, pts, t0 = 0, last = 0;
    var CRUX = [[0.62, 0.18], [0.66, 0.62], [0.52, 0.38], [0.76, 0.42], [0.69, 0.52]];
    function build() {
      cols = Math.floor((el.clientWidth || 600) / pitch); rows = Math.floor((el.clientHeight || 300) / pitch);
      ctx = size(c, cols, rows, pitch);
      pts = [];
      for (var i = 0; i < cols * rows * 0.05; i++) pts.push([Math.floor(rnd(i, 4, 7) * cols), Math.floor(rnd(i, 5, 7) * rows), rnd(i, 6, 7), 0]);
      CRUX.forEach(function (p, k) { pts.push([Math.round(p[0] * cols), Math.round(p[1] * rows), 1, k === 4 ? 1 : 2]); });
      draw(0);
    }
    function draw(t) {
      var col = colors(); ctx.clearRect(0, 0, cols * pitch, rows * pitch);
      pts.forEach(function (p) {
        var big = p[3] === 2, a = reduced ? 0.7 : 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + p[2] * 1.4) + p[2] * 20));
        ctx.globalAlpha = big ? 1 : a; ctx.fillStyle = big ? col[3] : p[2] > 0.8 ? col[2] : col[1];
        var o = (pitch - dot) / 2;
        ctx.fillRect(p[0] * pitch + o, p[1] * pitch + o, dot, dot);
        if (big) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { ctx.globalAlpha = 0.6; ctx.fillRect((p[0] + d[0]) * pitch + o, (p[1] + d[1]) * pitch + o, dot, dot); });
      });
      ctx.globalAlpha = 1;
    }
    build();
    if (window.ResizeObserver) new ResizeObserver(build).observe(el);
    if (!reduced) requestAnimationFrame(function tick(now) { requestAnimationFrame(tick); if (!t0) t0 = now; if (now - last < 90) return; last = now; draw((now - t0) / 1000); });
  }


  // Cielo del hero en 5 versiones. Todas en puntos, detrás del título centrado.
  // 1 campo de estrellas · 2 Vía Láctea · 3 constelaciones · 4 estrellas fugaces · 5 estelas alrededor del polo sur.
  var CONST = [
    { name: 'Crux', pts: [[0.70, 0.20], [0.72, 0.52], [0.63, 0.36], [0.80, 0.38], [0.745, 0.44]], lines: [[0, 1], [2, 3]] },
    { name: 'Three Marys', pts: [[0.20, 0.30], [0.25, 0.33], [0.30, 0.36], [0.16, 0.12], [0.34, 0.14], [0.14, 0.56], [0.33, 0.58]], lines: [[0, 1], [1, 2], [3, 0], [4, 2], [0, 5], [2, 6]] },
    { name: 'Scorpius', pts: [[0.45, 0.62], [0.49, 0.66], [0.53, 0.72], [0.56, 0.80], [0.60, 0.84], [0.64, 0.82], [0.66, 0.76], [0.42, 0.58], [0.40, 0.52]], lines: [[8, 7], [7, 0], [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
  ];
  function Sky(el, opts) {
    opts = opts || {};
    var mode = +opts.mode || 1, c = surface(el, mode === 6 ? 'Riding a horse through the Andes, seen from the saddle, drawn in dots' : 'A night sky over the Andes, drawn in dots'), ctx, cols, rows, pitch, dot, stars, far, mid, meteors = [], t0 = 0, last = 0;
    c.style.height = '100%';
    function build() {
      var W = el.clientWidth || 1000, H = el.clientHeight || 520;
      pitch = W < 640 ? 5 : 6; dot = W < 640 ? 3 : 3;
      cols = Math.floor(W / pitch); rows = Math.floor(H / pitch);
      ctx = size(c, cols, rows, pitch);
      c.style.aspectRatio = '';
      stars = [];
      var n = cols * rows * (mode === 2 ? 0.035 : mode === 4 ? 0.02 : 0.03);
      for (var i = 0; i < n; i++) stars.push({ x: rnd(i, 1, 11) * cols, y: rnd(i, 2, 11) * rows, b: rnd(i, 3, 11), p: rnd(i, 4, 11) * 20 });
      if (mode === 6) {
        // POV: cordillera al frente, horizonte del valle y estrellas solo sobre las cumbres.
        far = ridge(cols, rows, 1.3, rows * 0.56, rows * 0.26);
        mid = ridge(cols, rows, 4.1, rows * 0.64, rows * 0.08);
        stars = stars.filter(function (s) { return s.y < far[Math.min(cols - 1, Math.floor(s.x))] - 1; });
      }
      if (mode === 2) {
        // Banda de la Vía Láctea en diagonal: muchos más puntos cerca de la línea, con un núcleo más denso.
        for (var j = 0; j < cols * rows * 0.12; j++) {
          var u = rnd(j, 5, 13), off = (rnd(j, 6, 13) + rnd(j, 7, 13) + rnd(j, 8, 13) - 1.5) * 0.16;
          stars.push({ x: (u + off * 0.4) * cols, y: (0.9 - u * 0.8 + off) * rows, b: rnd(j, 9, 13) * (1 - Math.abs(off) * 4), p: rnd(j, 10, 13) * 20, band: 1 });
        }
      }
      draw(0);
    }
    function pt(x, y, color, a, s) { ctx.globalAlpha = a; ctx.fillStyle = color; var d = s || dot, o = (pitch - d) / 2; ctx.fillRect(Math.round(x) * pitch + o, Math.round(y) * pitch + o, d, d); }
    function draw(t) {
      var col = colors();
      ctx.globalAlpha = 1; ctx.clearRect(0, 0, cols * pitch, rows * pitch);
      if (mode === 6) { pov(t, col); ctx.globalAlpha = 1; return; }
      if (mode === 5) {
        // Estelas: cada estrella dibuja un arco alrededor del polo sur (abajo a la derecha, fuera del título).
        var cx = cols * 0.5, cy = rows * 1.05, rot = t * 0.02;
        stars.forEach(function (s, i) {
          var r = Math.hypot(s.x - cx, s.y - cy), a0 = Math.atan2(s.y - cy, s.x - cx) + rot, len = 0.25 + s.b * 0.35;
          for (var k = 0; k < 24; k++) { var a = a0 - len * k / 24; pt(cx + r * Math.cos(a), cy + r * Math.sin(a), k === 0 ? col[2] : s.b > 0.8 ? col[2] : col[1], (1 - k / 24) * (0.15 + s.b * 0.3)); } // más tenue
        });
        ctx.globalAlpha = 1; return;
      }
      stars.forEach(function (s) {
        var tw = reduced ? 0.7 : 0.3 + 0.7 * Math.abs(Math.sin(t * (0.5 + s.b) + s.p));
        var color = s.band ? (s.b > 0.75 ? col[2] : col[1]) : s.b > 0.93 ? col[3] : s.b > 0.7 ? col[2] : col[1];
        pt(s.x, s.y, color, s.band ? 0.25 + s.b * 0.6 : tw);
      });
      if (mode === 1 || mode === 3) CONST.slice(0, mode === 1 ? 1 : 3).forEach(function (cn, ci) {
        var P = cn.pts.map(function (q) { return [q[0] * cols, q[1] * rows]; });
        if (mode === 3) {
          // Líneas de puntos que se trazan de a una y se quedan.
          var prog = reduced ? 1 : Math.min(1, Math.max(0, (t - ci * 1.2) / 2.4));
          cn.lines.forEach(function (l, li) {
            var lp = Math.min(1, Math.max(0, prog * cn.lines.length - li)), a = P[l[0]], b = P[l[1]], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2);
            for (var k = 1; k < n * lp; k++) pt(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n, col[2], 0.45, 2);
          });
        }
        P.forEach(function (q, qi) {
          var big = mode === 1 || qi < 3;
          pt(q[0], q[1], col[3], 1, dot + 1);
          if (big) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pt(q[0] + d[0], q[1] + d[1], col[3], 0.5); });
        });
      });
      if (mode === 4) {
        // Fugaces: aparecen cada tanto arriba y cruzan en diagonal dejando una cola.
        if (!reduced && Math.random() < 0.04 && meteors.length < 3) meteors.push({ x: rnd(t * 100 | 0, 1, 5) * cols * 0.8, y: rnd(t * 100 | 0, 2, 5) * rows * 0.4, age: 0 });
        meteors.forEach(function (m) {
          m.age += 1;
          for (var k = 0; k < 14; k++) pt(m.x + m.age * 1.6 - k * 1.6, m.y + m.age * 0.7 - k * 0.7, k < 2 ? col[3] : col[2], Math.max(0, (1 - k / 14) * (1 - m.age / 40)));
        });
        meteors = meteors.filter(function (m) { return m.age < 40; });
      }
      ctx.globalAlpha = 1;
    }
    // 6: POV desde la montura. Sendero que avanza hacia uno, orejas y crin del caballo, riendas en las manos.
    function pov(t, col) {
      var cx = cols / 2, s = Math.min(rows * 1.15, cols * 1.5), yh = rows * 0.62;
      var gait = reduced ? 0 : t * 5.2, bob = Math.sin(gait) * s * 0.012, nod = Math.sin(gait + 0.9) * s * 0.01;
      function blk(x, y) { ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(x) * pitch, Math.round(y) * pitch, pitch, pitch); }
      stars.forEach(function (st) { pt(st.x, st.y, st.b > 0.93 ? col[3] : st.b > 0.7 ? col[2] : col[1], reduced ? 0.6 : 0.25 + 0.6 * Math.abs(Math.sin(t * (0.5 + st.b) + st.p))); });
      // Cordillera: nieve en las cumbres altas, cordón medio más oscuro.
      for (var x = 0; x < cols; x++) {
        for (var y = far[x]; y < yh; y++) {
          if (y >= mid[x]) { if (y === mid[x]) pt(x, y, col[2], 0.9); else if ((x + y) % 2 === 0) pt(x, y, col[0], 1); continue; }
          if (y === far[x]) pt(x, y, col[2], 0.8);
          else if (y - far[x] < 4 && far[x] < rows * 0.4) pt(x, y, col[3], 0.85 - (y - far[x]) * 0.15);
          else if ((x + y) % 2 === 0) pt(x, y, col[1], 0.5);
        }
      }
      // Suelo en perspectiva: la textura corre hacia abajo con el paso; el sendero se abre hacia el jinete.
      var run = reduced ? 0 : t * 2.2;
      for (var gy = Math.ceil(yh); gy < rows; gy++) {
        var d = (gy - yh + 1) / (rows - yh + 1), z = 1 / d, half = d * s * 0.5 + 0.5;
        for (var gx = 0; gx < cols; gx++) {
          var lx = (gx - cx) / (d * s), key = Math.floor(z * 5 - run);
          if (Math.abs(gx - cx) <= half) {
            if (Math.abs(Math.abs(gx - cx) - half) < 1) pt(gx, gy, col[1], 0.8);
            else if (rnd(Math.floor(lx * 30), key, 21) < 0.06) pt(gx, gy, col[2], 0.35 + d * 0.5);
          } else if (rnd(Math.floor(lx * 14), key, 7) < 0.14 + d * 0.22) pt(gx, gy, rnd(gx, key, 3) > 0.85 ? col[2] : col[1], 0.3 + d * 0.6);
        }
      }
      // Caballo desde atrás: cuello que se abre hacia abajo, nuca redonda y dos orejas encima.
      var yTop = rows - s * 0.36 + bob + nod, bottom = rows + 2, headW = s * 0.1, headH = s * 0.07;
      function neckHalf(y) { var k = Math.max(0, (y - yTop) / (bottom - yTop)); return s * (0.085 + 0.24 * Math.pow(k, 1.1)); }
      function hide(x, y, lit) {
        blk(x, y);
        // Pelaje: todo el cuerpo con puntos oscuros y vetas verticales que dan volumen.
        var vein = rnd(Math.round(x), 5, 41) > 0.72;
        pt(x, y, lit ? col[2] : vein ? col[1] : col[1], lit ? 1 : vein ? 0.55 : 0.28);
      }
      for (var hy = Math.floor(yTop - headH); hy < rows; hy++) {
        var hw = neckHalf(hy);
        if (hy < yTop + headH * 0.6) { var q2 = (hy - yTop) / headH; hw = Math.max(hy < yTop ? 0 : hw, headW * Math.sqrt(Math.max(0, 1 - q2 * q2))); }
        for (var hx = Math.ceil(cx - hw); hx <= cx + hw; hx++) hide(hx, hy, Math.abs(hx - cx) > hw - 1 || hy === Math.floor(yTop - headH));
      }
      // Orejas: copas abiertas hacia adelante, borde encendido e interior oscuro, con un tic de vez en cuando.
      [-1, 1].forEach(function (sd, i) {
        var twitch = reduced ? 0 : Math.max(0, Math.sin(t * 0.7 + i * 2.4)) > 0.97 ? sd * s * 0.015 : 0;
        var bx = cx + sd * s * 0.055, by = yTop - headH * 0.55, tx = bx + sd * s * 0.018 + twitch, ty = by - s * 0.13, bw = s * 0.038;
        for (var ey = Math.floor(ty); ey <= by + 1; ey++) {
          var k = Math.min(1, (ey - ty) / (by - ty)), ex = tx + (bx - tx) * k, w = Math.max(0.6, bw * Math.sin(Math.min(1, k * 1.25) * Math.PI / 2));
          for (var exx = Math.ceil(ex - w); exx <= ex + w; exx++) {
            var rim = Math.abs(exx - ex) > w - 1.2 || ey === Math.floor(ty);
            blk(exx, ey); pt(exx, ey, rim ? col[3] : col[0], rim ? 1 : 1);
          }
        }
      });
      // Crin: franja clara al centro que se mece con el viento; el tupé cae entre las orejas.
      for (var my = Math.floor(yTop - headH * 0.9); my < rows; my++) {
        var mk = Math.max(0, (my - yTop) / (bottom - yTop)), sway = reduced ? 0 : Math.sin(t * 3 + my * 0.35) * s * 0.01 * (0.3 + mk);
        var mw = s * (my < yTop ? 0.025 : 0.018 + 0.03 * mk) + (rnd(my, 1, 31) - 0.5) * s * 0.018, mc = cx + sway;
        for (var mx = Math.ceil(mc - mw); mx <= mc + mw; mx++) pt(mx, my, rnd(mx, my, 17) > 0.4 ? col[3] : col[2], 0.95);
      }
      // Riendas y manos.
      var hands = [-1, 1].map(function (sd) { return [cx + sd * Math.min(s * 0.36, cols * 0.4), rows - s * 0.09 + bob * 0.5]; });
      [-1, 1].forEach(function (sd, i) {
        var ry = yTop + s * 0.1, a = [cx + sd * (neckHalf(ry) - 1), ry], b = hands[i], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
        for (var k = 0; k <= n; k++) { var u = k / n; pt(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u + Math.sin(u * Math.PI) * s * 0.03, col[2], 1, dot + 1); }
      });
      hands.forEach(function (h) {
        var rx = s * 0.06, ry = s * 0.04;
        for (var y2 = Math.floor(h[1] - ry); y2 <= h[1] + ry; y2++) for (var x2 = Math.floor(h[0] - rx); x2 <= h[0] + rx; x2++) {
          var q = Math.pow((x2 - h[0]) / rx, 2) + Math.pow((y2 - h[1]) / ry, 2); if (q > 1) continue;
          blk(x2, y2);
          var knuckle = y2 === Math.floor(h[1] - ry * 0.4) && (x2 % 2 === 0);
          pt(x2, y2, q > 0.7 || knuckle ? col[2] : col[1], q > 0.7 ? 1 : 0.7);
        }
      });
    }
    build();
    var lw = el.clientWidth;
    if (window.ResizeObserver) new ResizeObserver(function () { if (el.clientWidth !== lw) { lw = el.clientWidth; build(); } }).observe(el);
    if (!reduced) requestAnimationFrame(function tick(now) { requestAnimationFrame(tick); if (!t0) t0 = now; if (now - last < 70) return; last = now; draw((now - t0) / 1000); });
  }

  window.Cabalgata = { Andes: Andes, Stars: Stars, Sky: Sky };
})();
