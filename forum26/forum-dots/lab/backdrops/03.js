(function () {
  // 03 · Piso de greca: meandro continuo en puntos cubriendo la pantalla, con viñeta oscura al centro.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  var TILE = ['#######.', '#.....#.', '#.###.#.', '#.#.#.#.', '#.#...#.', '#.#####.', '#.......', '########'];
  (window.ForumBackdrops = window.ForumBackdrops || {})['03'] = {
    name: 'Piso de greca',
    note: 'Un piso continuo de meandros en puntos, como el suelo de una villa; se apaga hacia el centro para dejar leer.',
    mount: function (target) {
      var t = (window.Forum && window.Forum.friezes && window.Forum.friezes.meander) || TILE;
      var c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var ctx = c.getContext('2d');
      function draw() {
        var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var P = W < 640 ? 7 : 9, D = W < 640 ? 2.4 : 3, TW = t[0].length, TH = t.length;
        var dim = tok('dot-dim', '#5c4a12'), off = tok('dot-off', '#1a1706');
        var cols = Math.ceil(W / P), rows = Math.ceil(H / P);
        for (var y = 0; y < rows; y++) {
          var band = Math.floor(y / TH), ly = y % TH;
          for (var x = 0; x < cols; x++) {
            // Bandas alternadas espejadas: el meandro corre en un sentido y en el otro, como un piso tejido.
            var lx = x % TW, ch = band % 2 ? t[TH - 1 - ly][TW - 1 - lx] : t[ly][lx];
            ctx.fillStyle = ch === '#' ? dim : off;
            ctx.globalAlpha = ch === '#' ? 0.3 : 0.18; // más oscuro
            ctx.fillRect(x * P + (P - D) / 2, y * P + (P - D) / 2, D, D);
          }
        }
        ctx.globalAlpha = 1;
        // Viñeta: negro hacia el centro, el piso asoma en los bordes.
        var g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.15, W / 2, H * 0.45, Math.max(W, H) * 0.7);
        g.addColorStop(0, 'rgba(0,0,0,0.92)'); g.addColorStop(0.55, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      draw();
      var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
      if (ro) ro.observe(target);
      return function () { if (ro) ro.disconnect(); c.remove(); };
    },
  };
})();
