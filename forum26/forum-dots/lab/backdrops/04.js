(function () {
  // 04 · Baldosas: baldosas cuadradas grandes con un motivo en puntos cada una; algunas gastadas.
  function tok(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function rand(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  // Motivos en una grilla n×n (coordenadas centradas): devuelven 0 vacío, 1 tenue, 2 marcado.
  var MOTIFS = [
    function rosette(x, y, r) { var d = Math.hypot(x, y), a = Math.atan2(y, x); var petal = d < r * (0.55 + 0.35 * Math.abs(Math.cos(a * 4))); return d < r * 0.14 ? 2 : petal && d > r * 0.22 ? 2 : Math.abs(d - r * 0.95) < 0.6 ? 1 : 0; },
    function cross(x, y, r) { var ax = Math.abs(x), ay = Math.abs(y); return (ax <= 1 && ay < r * 0.9) || (ay <= 1 && ax < r * 0.9) ? 2 : ax + ay < r * 0.35 ? 1 : 0; },
    function rhombus(x, y, r) { var s = Math.abs(x) + Math.abs(y); return Math.abs(s - r * 0.85) < 0.8 ? 2 : Math.abs(s - r * 0.45) < 0.8 ? 1 : s < 1.2 ? 2 : 0; },
    function squares(x, y, r) { var m = Math.max(Math.abs(x), Math.abs(y)); return Math.abs(m - Math.round(r * 0.85)) < 0.5 ? 2 : Math.abs(m - Math.round(r * 0.55)) < 0.5 ? 1 : Math.abs(m - Math.round(r * 0.25)) < 0.5 ? 2 : 0; },
  ];
  (window.ForumBackdrops = window.ForumBackdrops || {})['04'] = {
    name: 'Baldosas',
    note: 'Baldosas grandes separadas por juntas, cada una con una roseta, una cruz, un rombo o cuadrados; algunas gastadas por el tiempo.',
    mount: function (target) {
      var c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var ctx = c.getContext('2d');
      function draw() {
        var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        var P = W < 640 ? 6 : 8, D = W < 640 ? 2.2 : 3, N = W < 640 ? 17 : 18; // N celdas por baldosa (incluye la junta)
        var T = N * P, off = tok('dot-off', '#1a1706'), dim = tok('dot-dim', '#5c4a12'), amber = tok('dot-amber', '#f9bc12');
        var ox = Math.round((W % T) / 2 - T / 2), oy = 0;
        for (var ty = 0; ty * T + oy < H; ty++) for (var tx = -1; tx * T + ox < W; tx++) {
          var bx = tx * T + ox, by = ty * T + oy, motif = MOTIFS[Math.floor(rand(tx, ty, 7) * MOTIFS.length)];
          var worn = rand(tx, ty, 11) < 0.3, wearX = rand(tx, ty, 13) * N, wearY = rand(tx, ty, 17) * N, r = (N - 3) / 2;
          for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
            if (x === N - 1 || y === N - 1) continue; // junta
            var v = motif(x - (N - 2) / 2, y - (N - 2) / 2, r);
            // Borde de la baldosa: un marco tenue.
            if (x === 0 || y === 0 || x === N - 2 || y === N - 2) v = Math.max(v, 1);
            if (worn && Math.hypot(x - wearX, y - wearY) < N * 0.35 && rand(tx * 31 + x, ty * 31 + y, 3) < 0.7) continue;
            ctx.fillStyle = v === 2 ? amber : v === 1 ? dim : off;
            ctx.globalAlpha = v === 2 ? 0.16 : v === 1 ? 0.4 : 0.35;
            ctx.fillRect(bx + x * P + (P - D) / 2, by + y * P + (P - D) / 2, D, D);
          }
        }
        ctx.globalAlpha = 1;
        // Viñeta suave para que el centro quede más oscuro que los bordes.
        var g = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H * 0.45, Math.max(W, H) * 0.75);
        g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      draw();
      var ro = window.ResizeObserver ? new ResizeObserver(draw) : null;
      if (ro) ro.observe(target);
      return function () { if (ro) ro.disconnect(); c.remove(); };
    },
  };
})();
