(function () {
  // 01 · Mosaico de teselas: piedra cortada a mano, muy apagada, cubriendo toda la pantalla.
  function css(n, fb) { var v = getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); return v || fb; }
  function rnd(x, y, s) { var h = (x * 374761393 + y * 668265263 + s * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  (window.ForumBackdrops = window.ForumBackdrops || {})['01'] = {
    name: 'Mosaico de teselas',
    note: 'Teselas cuadradas irregulares, como piedra cortada a mano, en tonos muy apagados; algunas un poco más claras.',
    mount: function (target) {
      var c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
      target.appendChild(c);
      var ctx = c.getContext('2d'), off = css('dot-off', '#1a1706'), dim = css('dot-dim', '#5c4a12'), amber = css('dot-amber', '#f9bc12');
      function draw() {
        var W = target.clientWidth, H = target.clientHeight, dpr = window.devicePixelRatio || 1;
        if (!W || !H) return;
        c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
        var P = W < 640 ? 11 : 14;
        for (var gy = 0; gy * P < H + P; gy++) for (var gx = 0; gx * P < W + P; gx++) {
          var r = rnd(gx, gy, 1), s = P - 3 - Math.floor(rnd(gx, gy, 2) * 2.5);
          var jx = (rnd(gx, gy, 3) - 0.5) * 1.6, jy = (rnd(gx, gy, 4) - 0.5) * 1.6;
          var x = gx * P + (P - s) / 2 + jx, y = gy * P + (P - s) / 2 + jy;
          if (r < 0.02) { ctx.globalAlpha = 0.08; ctx.fillStyle = amber; }
          else if (r < 0.12) { ctx.globalAlpha = 0.22; ctx.fillStyle = dim; }
          else { ctx.globalAlpha = 0.3 + rnd(gx, gy, 5) * 0.25; ctx.fillStyle = off; }
          // Piedra irregular: rectángulo con una esquina recortada al azar.
          ctx.beginPath();
          var k = rnd(gx, gy, 6) * 1.8, w = s + (rnd(gx, gy, 7) - 0.5), h = s + (rnd(gx, gy, 8) - 0.5);
          ctx.moveTo(x + k, y); ctx.lineTo(x + w, y + (rnd(gx, gy, 9) - 0.5)); ctx.lineTo(x + w + (rnd(gx, gy, 10) - 0.5), y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + k);
          ctx.fill();
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
