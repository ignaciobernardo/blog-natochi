(function () {
  // 09 · Stoa: pórtico de columnas tenues a los costados y piso de teselas en perspectiva abajo.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function mount(target) {
    var c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    target.appendChild(c);
    var ctx = c.getContext('2d');
    function draw() {
      var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
      if (!W || !H) return;
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var narrow = W < 640, P = narrow ? 6 : 8, D = narrow ? 3 : 4, off = (P - D) / 2;
      var cols = Math.floor(W / P), rows = Math.floor(H / P);
      var dim = tok('dot-dim', '#5c4a12'), amber = tok('dot-amber', '#f9bc12'), dark = tok('dot-off', '#1a1706');
      function dot(x, y, col, a) { if (x < 0 || y < 0 || x >= cols || y >= rows) return; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x * P + off, y * P + off, D, D); }
      var floorRows = Math.max(8, Math.round(rows * (narrow ? 0.18 : 0.22))), floorTop = rows - floorRows;

      // Columnas: capitel (ábaco + equino), fuste acanalado, basa. Solo en escritorio.
      if (!narrow) {
        var cw = Math.max(9, Math.round(cols * 0.045)) | 1, gap = cw + Math.round(cw * 1.2);
        var n = W >= 1100 ? 2 : 1, top = 3, bottom = floorTop - 1;
        // Arquitrabe continuo sobre las columnas de cada lado
        [0, 1].forEach(function (side) {
          var span = n * gap, x0 = side ? cols - 2 - span : 2;
          for (var x = x0 - 1; x <= x0 + span; x++) { dot(x, top - 2, amber, 0.18); dot(x, top - 1, dim, 0.28); }
          for (var k = 0; k < n; k++) {
            var cx = x0 + k * gap + Math.floor(cw / 2), half = Math.floor(cw / 2);
            for (var x = cx - half - 2; x <= cx + half + 2; x++) dot(x, top, amber, 0.22);             // ábaco
            for (var x = cx - half - 1; x <= cx + half + 1; x++) dot(x, top + 1, dim, 0.3);           // equino
            dot(cx - half - 2, top + 2, dim, 0.3); dot(cx + half + 2, top + 2, dim, 0.3);             // volutas
            for (var y = top + 2; y < bottom - 2; y++) for (var x = cx - half; x <= cx + half; x++) {
              var flute = (x - cx + half) % 2 === 0;                                                  // acanaladuras
              if (flute) dot(x, y, (x === cx - half || x === cx + half) ? amber : dim, (x === cx - half || x === cx + half) ? 0.2 : 0.22);
            }
            for (var x = cx - half - 1; x <= cx + half + 1; x++) dot(x, bottom - 2, dim, 0.3);        // toro
            for (var x = cx - half - 2; x <= cx + half + 2; x++) dot(x, bottom - 1, amber, 0.2);      // plinto
          }
        });
      }

      // Piso: teselas en perspectiva hacia un punto de fuga central, más grandes hacia abajo.
      var vx = cols / 2, vy = floorTop - floorRows * 1.4;
      var bands = []; for (var t = 0; t <= 1.0001; t += 1 / 7) bands.push(floorTop + Math.round(floorRows * t * t));
      for (var y = floorTop; y < rows; y++) {
        var onBand = bands.indexOf(y) >= 0, depth = (y - floorTop) / floorRows;
        for (var x = 0; x < cols; x++) {
          // líneas que convergen: cada 14 columnas en la base
          var baseX = vx + (x - vx) * (rows - vy) / Math.max(1, y - vy), onRay = Math.abs(((baseX % 14) + 14) % 14) < 0.9;
          if (onBand || onRay) dot(x, y, (x + y) % 5 === 0 ? amber : dim, 0.12 + depth * 0.2);
          else if ((x + y) % 2 === 0) dot(x, y, dark, 0.5);
        }
      }
      // Borde del piso: una greca muy tenue
      var m = (window.Forum && Forum.friezes && Forum.friezes.meander) || null;
      if (m && floorTop > 12) {
        var tw = m[0].length, nT = Math.floor((cols - 1) / tw), s0 = Math.floor((cols - (nT * tw + 1)) / 2), yy = floorTop - m.length - 1;
        for (var ty = 0; ty < m.length; ty++) for (var tx = 0; tx <= nT * tw; tx++) { var cc = tx === nT * tw ? 0 : tx % tw; if (m[ty][cc] === '#') dot(s0 + tx, yy + ty, dim, 0.18); }
      }
      ctx.globalAlpha = 1;
    }
    draw();
    var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
    if (ro) ro.observe(target);
    return function () { if (ro) ro.disconnect(); c.remove(); };
  }
  (window.ForumBackdrops = window.ForumBackdrops || {})['09'] = {
    name: 'Stoa', note: 'Un pórtico: columnas tenues a los costados y un piso de teselas en perspectiva; el centro queda libre para el texto.', mount: mount,
  };
})();
