// Helpers de las versiones dot-matrix de Forum '25. Usa window.Forum (bundle del design system).
(function () {
  function tok(n) { return getComputedStyle(document.documentElement).getPropertyValue('--' + n).trim(); }
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function canvasFor(el, cols, rows, pitch, label) {
    var c = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
    c.width = Math.round(cols * pitch * dpr);
    c.height = Math.round(rows * pitch * dpr);
    c.style.width = '100%';
    c.style.display = 'block';
    c.style.aspectRatio = cols + ' / ' + rows;
    if (label) { c.setAttribute('role', 'img'); c.setAttribute('aria-label', label); } else c.setAttribute('aria-hidden', 'true');
    el.appendChild(c);
    var ctx = c.getContext('2d');
    ctx.scale(dpr, dpr);
    return { c: c, ctx: ctx };
  }
  // g: niveles por celda (-1 = sin punto); colors: color por nivel
  function paint(ctx, g, pitch, dot, colors) {
    var off = (pitch - dot) / 2;
    ctx.clearRect(0, 0, g[0].length * pitch, g.length * pitch);
    for (var y = 0; y < g.length; y++) for (var x = 0; x < g[0].length; x++) {
      var lv = g[y][x];
      if (lv < 0) continue;
      ctx.fillStyle = colors[lv];
      ctx.fillRect(x * pitch + off, y * pitch + off, dot, dot);
    }
  }
  function levels() { return [tok('dot-off'), tok('dot-dim'), tok('dot-amber'), tok('dot-lit')]; }

  function loadImg(src) {
    return new Promise(function (res, rej) { var i = new Image(); i.onload = function () { res(i); }; i.onerror = rej; i.src = src; });
  }
  // Luminancia normalizada (percentiles 4–96) de la imagen recortada tipo "cover".
  function sample(img, cols, rows, focusY) {
    var c = document.createElement('canvas'); c.width = cols; c.height = rows;
    var x = c.getContext('2d', { willReadFrequently: true });
    var s = Math.max(cols / img.width, rows / img.height), w = img.width * s, h = img.height * s;
    x.drawImage(img, (cols - w) / 2, (rows - h) * (focusY == null ? 0.3 : focusY), w, h);
    var d = x.getImageData(0, 0, cols, rows).data, lum = [];
    for (var i = 0; i < d.length; i += 4) lum.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    var sorted = lum.slice().sort(function (a, b) { return a - b; });
    var lo = sorted[Math.floor(sorted.length * 0.04)], hi = sorted[Math.floor(sorted.length * 0.96)] || 255;
    return lum.map(function (v) { return Math.max(0, Math.min(1, (v - lo) / Math.max(1, hi - lo))); });
  }

  // Foto en puntos. tone 'lit': lo claro se enciende. tone 'clay': figura negra sobre panel ámbar.
  function dotPhoto(el) {
    var src = el.dataset.src, cols = +el.dataset.cols || 24, rows = +el.dataset.rows || cols;
    var pitch = +el.dataset.pitch || 4, dot = +el.dataset.dot || 3, tone = el.dataset.tone || 'lit', mask = el.dataset.mask;
    var R = (cols - 1) / 2;
    function inside(x, y) {
      if (mask === 'arch') return y >= R || Math.hypot(x - R, y - R) <= R + 0.35;
      if (mask === 'circle') return Math.hypot(x - R, y - (rows - 1) / 2) <= R + 0.35;
      return true;
    }
    var photo = document.createElement('img');
    photo.src = src; photo.alt = ''; photo.className = 'fd-photo__img';
    if (el.dataset.reveal != null) el.appendChild(photo);
    var cv = canvasFor(el, cols, rows, pitch, el.dataset.label);
    cv.c.className = 'fd-photo__dots';
    return loadImg(src).then(function (img) {
      var lum = sample(img, cols, rows, el.dataset.focus ? +el.dataset.focus : 0.25), lv = levels();
      var rim = mask === 'arch' && el.dataset.rim != null;
      function edge(x, y) { return inside(x, y) && (x === 0 || x === cols - 1 || !inside(x, y - 1) || y === rows - 1); }
      var ctx = cv.ctx, off = (pitch - dot) / 2;
      ctx.clearRect(0, 0, cols * pitch, rows * pitch);
      for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
        if (!inside(x, y)) continue;
        var v = lum[y * cols + x], cx = x * pitch + pitch / 2, cy = y * pitch + pitch / 2, size, color;
        if (rim && edge(x, y)) { ctx.fillStyle = lv[3]; ctx.fillRect(x * pitch + off, y * pitch + off, dot, dot); continue; }
        if (tone === 'clay') {
          // Figura negra: lo oscuro se vuelve punto negro sobre el panel ámbar.
          var k = Math.pow(1 - v, 1.2);
          if (k < 0.18) continue;
          size = dot * (0.45 + 0.55 * k); color = k > 0.55 ? tok('ground') : lv[1];
        } else {
          // Medios tonos: el punto crece con la luz y sube de nivel de color.
          var t = Math.pow(v, 1.25);
          if (t < 0.1) { ctx.fillStyle = lv[0]; ctx.fillRect(x * pitch + off, y * pitch + off, Math.max(1, dot * 0.5), Math.max(1, dot * 0.5)); continue; }
          size = dot * (0.3 + 0.7 * t); color = t > 0.68 ? lv[3] : t > 0.38 ? lv[2] : lv[1];
        }
        ctx.fillStyle = color;
        ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      }
    });
  }

  // 150 personas: un punto por persona, repartidas por el porcentaje de cada grupo.
  function people(el) {
    var total = +el.dataset.total, split = JSON.parse(el.dataset.split), cols = +el.dataset.cols || 30;
    var rows = Math.ceil(total / cols), pitch = +el.dataset.pitch || 14, dot = +el.dataset.dot || 8;
    var counts = split.map(function (s) { return Math.round(total * s / 100); });
    var cv = canvasFor(el, cols, rows, pitch, el.dataset.label), lv = [3, 2, 1], g = [], i = 0;
    cv.c.style.maxWidth = cols * pitch + 'px';
    for (var y = 0; y < rows; y++) { g.push([]); for (var x = 0; x < cols; x++) g[y].push(-1); }
    // Se llena por columnas para que cada grupo forme un bloque continuo, como una barra.
    counts.forEach(function (n, k) { for (var j = 0; j < n; j++, i++) { var x = Math.floor(i / rows), y = i % rows; if (x < cols) g[y][x] = lv[k]; } });
    paint(cv.ctx, g, pitch, dot, levels());
  }

  function mins(t) { var p = t.split(':'); return +p[0] * 60 + +p[1]; }
  // La jornada 08:30–22:00 en celdas de 15 minutos. Tipos: fireside lleno, pausa tenue, sesión ámbar.
  function dayBar(el) {
    var items = JSON.parse(el.dataset.schedule), start = mins('08:30'), end = mins('22:00');
    var cols = (end - start) / 15, rows = 5, pitch = +el.dataset.pitch || 10, dot = +el.dataset.dot || 6;
    var cv = canvasFor(el, cols, rows, pitch, 'Jornada del 20 de noviembre, de 08:30 a 22:00, en bloques de 15 minutos');
    var lvOf = { fireside: 3, coliseo: 2, session: 2, break: 1 };
    function draw(active) {
      var g = [];
      for (var y = 0; y < rows; y++) { g.push([]); for (var x = 0; x < cols; x++) g[y].push(0); }
      items.forEach(function (it, k) {
        var a = (mins(it.start) - start) / 15, b = (mins(it.end) - start) / 15;
        for (var x = a; x < b; x++) for (var y = 0; y < rows; y++) {
          var lv = lvOf[it.kind];
          if (active != null && active !== k) lv = Math.min(lv, 1);
          if (x === a && (y === 0 || y === rows - 1)) continue;
          g[y][x] = lv;
        }
      });
      paint(cv.ctx, g, pitch, dot, levels());
    }
    draw(null);
    el._highlight = draw;
  }

  // Texto dibujado con VCR OSD Mono y reducido a puntos, sobre la grilla con un meandro.
  function dotText(el) {
    var lines = el.dataset.text.split('|'), pitch = +el.dataset.pitch || 10, dot = +el.dataset.dot || 6;
    var cv, cols, rows, lh = +el.dataset.lineRows || 16;
    function build() {
      el.innerHTML = '';
      cols = Math.max(20, Math.floor(el.clientWidth / pitch));
      rows = lines.length * lh + 16;
      cv = canvasFor(el, cols, rows, pitch, el.dataset.label || lines.join(' '));
      // Se dibuja a 8× y se promedia cada celda: letras limpias, con una celda de aire entre ellas.
      var S = 8, off = document.createElement('canvas'); off.width = cols * S; off.height = rows * S;
      var x = off.getContext('2d', { willReadFrequently: true });
      var size = lh * 0.78 * S;
      function setFont() { x.font = size + 'px "VCR OSD Mono"'; if ('letterSpacing' in x) x.letterSpacing = Math.round(size * 0.12) + 'px'; }
      setFont();
      var widest = Math.max.apply(null, lines.map(function (l) { return x.measureText(l).width; }));
      if (widest > (cols - 4) * S) { size *= (cols - 4) * S / widest; setFont(); }
      x.fillStyle = '#fff'; x.textBaseline = 'middle'; x.textAlign = 'center';
      lines.forEach(function (l, i) { x.fillText(l, cols * S / 2, (8 + i * lh + lh / 2) * S); });
      var big = x.getImageData(0, 0, cols * S, rows * S).data, cov = new Float32Array(cols * rows);
      for (var py = 0; py < rows * S; py++) for (var px = 0; px < cols * S; px++) cov[Math.floor(py / S) * cols + Math.floor(px / S)] += big[(py * cols * S + px) * 4] / 255 / (S * S);
      var g = [], mt = window.Forum.friezes.meander;
      for (var yy = 0; yy < rows; yy++) {
        g.push([]);
        for (var xx = 0; xx < cols; xx++) {
          var a = cov[yy * cols + xx];
          var bg = xx % 3 === 0 && yy % 3 === 0 ? 0 : -1;
          g[yy].push(a > 0.42 ? (lines.length > 1 && yy < 8 + lh ? 2 : 3) : bg);
        }
      }
      // Meandro en la franja inferior
      var nT = Math.floor((cols - 1) / 8), s0 = Math.floor((cols - (nT * 8 + 1)) / 2);
      for (var ty = 0; ty < 8; ty++) for (var tx = 0; tx <= nT * 8; tx++) { var cc = tx === nT * 8 ? 0 : tx % 8; if (mt[ty][cc] === '#') g[rows - 8 + ty][s0 + tx] = 1; }
      paint(cv.ctx, g, pitch, dot, levels());
    }
    build();
    if (window.ResizeObserver) new ResizeObserver(function () { if (Math.floor(el.clientWidth / pitch) !== cols) build(); }).observe(el);
  }

  function boot() {
    document.querySelectorAll('[data-dot-photo]').forEach(dotPhoto);
    document.querySelectorAll('[data-people]').forEach(people);
    document.querySelectorAll('[data-day-bar]').forEach(dayBar);
    document.querySelectorAll('[data-dot-text]').forEach(dotText);
    // Las filas de agenda con data-index iluminan su tramo en la barra del día.
    var bar = document.querySelector('[data-day-bar]');
    if (bar) document.querySelectorAll('[data-index]').forEach(function (row) {
      var k = +row.dataset.index;
      row.addEventListener('mouseenter', function () { bar._highlight(k); });
      row.addEventListener('focusin', function () { bar._highlight(k); });
      row.addEventListener('mouseleave', function () { bar._highlight(null); });
      row.addEventListener('focusout', function () { bar._highlight(null); });
    });
  }
  window.ForumDots = { boot: boot, reduced: reduced };
  var ready = document.fonts && document.fonts.load ? document.fonts.load('16px "VCR OSD Mono"') : Promise.resolve();
  ready.catch(function () {}).then(function () {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  });
})();
