// Versión 08 "Inscripción": dibuja la estela en puntos (frontón con roseta, marco con dentículos, basa escalonada),
// talla el título letra a letra, cuenta a las 270 personas del año pasado en puntos y pone la ofrenda y el plinto.
// Sin movimiento con prefers-reduced-motion (html sin .st-motion).
(function () {
  var doc = document, root = doc.documentElement, F = window.Forum;
  var motion = root.classList.contains('st-motion');

  function token(name, fallback) { return (getComputedStyle(root).getPropertyValue(name) || '').trim() || fallback; }
  var C = { lit: token('--dot-lit', '#0755bb'), amber: token('--dot-amber', '#5284c4'), dim: token('--dot-dim', '#98b0cd'), off: token('--dot-off', '#cfcec7') };
  var DOWN = { lit: 'amber', amber: 'dim', dim: 'dim' };

  // ruido determinista: la piedra se desgasta siempre igual
  function rnd(x, y, s) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  // Lienzo de puntos cuadrados. paint(cells, t) dibuja las celdas con c.t <= t.
  function surface(host, cols, rows, pitch, dot) {
    var cv = host.querySelector(':scope > canvas.st-dots');
    if (!cv) { cv = doc.createElement('canvas'); cv.className = 'st-dots'; cv.setAttribute('aria-hidden', 'true'); host.prepend(cv); }
    var k = Math.min(2, window.devicePixelRatio || 1), w = cols * pitch, h = rows * pitch;
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var x = cv.getContext('2d'), off = (pitch - dot) / 2;
    return function paint(cells, t) {
      x.setTransform(k, 0, 0, k, 0, 0); x.clearRect(0, 0, w, h);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (t != null && c.t > t) continue;
        x.globalAlpha = c.a == null ? 1 : c.a;
        x.fillStyle = C[c.c] || c.c;
        x.fillRect(c.x * pitch + off, c.y * pitch + off, dot, dot);
      }
      x.globalAlpha = 1;
    };
  }

  // Mapa de celdas con simetría y desgaste
  function grid(cols, rows) {
    var m = {};
    return {
      put: function (x, y, c) { x = Math.round(x); if (x < 0 || y < 0 || x >= cols || y >= rows) return; m[y * cols + x] = c; },
      mirror: function (x, y, c) { this.put(x, y, c); this.put(cols - 1 - x, y, c); },
      cells: function (seed, wear) {
        var out = [];
        for (var key in m) {
          var i = +key, x = i % cols, y = (i / cols) | 0, c = m[key];
          if (wear) {
            if (rnd(x, y, seed) < wear) continue;                       // punto saltado
            if (rnd(x, y, seed + 7) < wear * 2.2) c = DOWN[c] || c;       // punto gastado
          }
          out.push({ x: x, y: y, c: c });
        }
        return out;
      },
    };
  }

  // ---------------------------------------------------------------- la estela
  var stele = doc.querySelector('[data-stele]');
  var ped = stele && stele.querySelector('[data-stele-pediment]');
  var face = stele && stele.querySelector('[data-stele-face]');
  var base = stele && stele.querySelector('[data-stele-base]');
    var built = null;

  function build() {
    var host = stele.parentElement, cs = getComputedStyle(host);
    var avail = host.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var p = avail >= 600 ? 6 : 4, dot = p === 6 ? 4.2 : 3, extra = p === 6 ? 8 : 4;
    var cols = Math.min(Math.floor(avail / p) - extra, p === 6 ? 120 : 200);
    if (cols % 2) cols -= 1;                                              // ancho par: el eje cae entre dos columnas
    stele.style.width = cols * p + 'px';
    stele.style.setProperty('--p', p + 'px');
    stele.style.setProperty('--base-extra', extra);

    // Frontón: 4 filas de acrotera + 22 de tímpano, con una roseta al centro
    var A = 4, R = 22, prow = A + R, half = (cols - 1) / 2, g = grid(cols, prow);
    var edge = function (r) { return Math.round(half - r / (R - 1) * half); };  // x izquierda de la cornisa en la fila r
    for (var r = 0; r < R; r++) {
      var y = A + r, xl = edge(r), prev = r ? edge(r - 1) : xl;
      for (var x = xl; x <= Math.max(prev, xl + 1); x++) g.mirror(x, y, 'lit');            // cornisa inclinada (escalera continua)
      if (r >= 4 && r < R - 2) {                                                          // moldura interior, paralela
        var il = edge(r - 4), ip = edge(r - 5);
        for (var xi = il; xi <= Math.max(ip, il); xi++) g.mirror(xi, y, 'dim');
      }
    }
    for (var xb = 0; xb < cols; xb++) { g.put(xb, prow - 1, 'lit'); g.put(xb, prow - 2, 'lit'); }
    // acrotera: una palmeta chica sobre el vértice
    ['...##...', '.#.##.#.', '#..##..#', '.######.'].forEach(function (row, ry) {
      for (var i = 0; i < row.length; i++) if (row[i] === '#') g.put(Math.round(half - 3.5) + i, ry, ry < 3 ? 'amber' : 'lit');
    });
    var pedCells = g.cells(11, 0.035);
    // roseta (se talla al final)
    var rosette = ['..aaaa..', '.a....a.', 'a..ll..a', 'a.llll.a', 'a.llll.a', 'a..ll..a', '.a....a.', '..aaaa..'];
    var rx = Math.round(half - 3.5), ry0 = prow - 2 - 4 - rosette.length;
    rosette.forEach(function (row, ry) {
      for (var i = 0; i < row.length; i++) if (row[i] !== '.') pedCells.push({ x: rx + i, y: ry0 + ry, c: row[i] === 'l' ? 'lit' : 'amber', late: 1 });
    });

    // Cara: medir la altura natural y redondearla al pitch
    face.style.minHeight = '';
    var fh = face.offsetHeight, frow = Math.ceil(fh / p);
    face.style.minHeight = frow * p + 'px';
    var f = grid(cols, frow);
    for (var fy = 0; fy < frow; fy++) { f.mirror(0, fy, 'lit'); f.mirror(1, fy, 'lit'); }
    for (var fx = 0; fx < cols; fx++) f.put(fx, 0, 'lit');
    for (var dx = 4; dx < cols / 2; dx += 3) { f.mirror(dx, 2, 'amber'); f.mirror(dx + 1, 2, 'amber'); f.mirror(dx, 3, 'amber'); f.mirror(dx + 1, 3, 'amber'); }  // dentículos
    for (var lx2 = 3; lx2 < cols - 3; lx2++) { f.put(lx2, 6, 'dim'); f.put(lx2, frow - 4, 'dim'); }
    for (var ly2 = 6; ly2 <= frow - 4; ly2++) f.mirror(3, ly2, 'dim');
    for (var bx = 0; bx < cols; bx++) f.put(bx, frow - 1, 'lit');
    var faceCells = f.cells(23, 0.03);

    // Basa: dos escalones
    var bcols = cols + extra, s1 = extra / 4, b = grid(bcols, 6);
    for (var x1 = s1; x1 < bcols - s1; x1++) { b.put(x1, 1, 'lit'); }
    for (var x2 = 0; x2 < bcols; x2++) { b.put(x2, 3, 'lit'); b.put(x2, 4, 'amber'); b.put(x2, 5, 'lit'); }
    var baseCells = b.cells(37, 0.03);

    // Orden del tallado: de la basa hacia el vértice, la roseta al final
    var total = prow + frow + 6;
    function stamp(cells, y0) {
      cells.forEach(function (c) {
        var gy = y0 + c.y;
        c.t = c.late ? 0.82 + rnd(c.x, c.y, 5) * 0.18 : (1 - gy / total) * 0.8 + rnd(c.x, c.y, 3) * 0.06;
      });
    }
    stamp(pedCells, 0); stamp(faceCells, prow); stamp(baseCells, prow + frow);

    built = {
      ped: { paint: surface(ped, cols, prow, p, dot), cells: pedCells },
      face: { paint: surface(face, cols, frow, p, dot), cells: faceCells },
      base: { paint: surface(base, bcols, 6, p, dot), cells: baseCells },
    };
  }
  function paintStele(t) { ['ped', 'face', 'base'].forEach(function (k) { built[k].paint(built[k].cells, t); }); }

  // ---------------------------------------------------------------- tallado letra a letra
  function splitLetters(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.data.trim()) return;
          var frag = doc.createDocumentFragment();
          n.data.split('').forEach(function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(doc.createTextNode(ch)); return; }
            var s = doc.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--i', i++); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('st-punct')) { n.classList.add('ch'); n.style.setProperty('--i', i++); } else walk(n);
        }
      });
    })(el);
    el.classList.add('is-split');
    return i;
  }
  var carve = Array.prototype.slice.call(doc.querySelectorAll('[data-carve]'));
  var counts = motion ? carve.map(splitLetters) : [];

  function carveNow(el) { el.classList.add('is-carved'); }

  if (stele && ped && face && base) {
    var fontsReady = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
    build(); paintStele(motion ? -1 : null);
    var heroCarve = carve.filter(function (el) { return stele.contains(el); });
    fontsReady.then(function () {
      build();
      if (!motion) { paintStele(null); return; }
      var dur = 1500, t0 = 0;
      requestAnimationFrame(function step(now) {
        if (!t0) t0 = now;
        var t = Math.min(1, (now - t0) / dur);
        paintStele(1 - Math.pow(1 - t, 2));
        if (t < 1) requestAnimationFrame(step); else paintStele(null);
      });
      // el título se talla mientras termina el marco; la fecha después
      var at = 650;
      heroCarve.forEach(function (el) {
        var n = counts[carve.indexOf(el)] || 0;
        setTimeout(function () { carveNow(el); }, at);
        at += n * 70 + 250;
      });
    });
    var lastW = 0, timer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (stele.parentElement.clientWidth === lastW) return; lastW = stele.parentElement.clientWidth; build(); paintStele(null); }, 120);
    });
    lastW = stele.parentElement.clientWidth;
  }

  // Lo que se talla más abajo, al entrar en pantalla
  var later = carve.filter(function (el) { return !stele || !stele.contains(el); });
  function whenSeen(el, fn) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(el);
  }
  if (motion) later.forEach(function (el) { whenSeen(el, function () { carveNow(el); }); });

  // ---------------------------------------------------------------- tabula ansata: la tabla de la agenda, todavía sin tallar
  function tablet(el) {
    var host = el.parentElement, hs = getComputedStyle(host);
    var avail = host.clientWidth - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight);
    var p = avail >= 600 ? 6 : 4, dot = p === 6 ? 4.2 : 3, ansa = p === 6 ? 10 : 8;
    var cols = Math.min(Math.floor(avail / p), p === 6 ? 104 : 200);
    if (cols % 2) cols -= 1;
    el.style.width = cols * p + 'px';
    el.style.setProperty('--bp', p + 'px');
    el.style.setProperty('--ansa', ansa);
    el.style.minHeight = '';
    var rows = Math.ceil(el.offsetHeight / p); if (rows % 2 === 0) rows += 1;
    el.style.minHeight = rows * p + 'px';
    var g = grid(cols, rows), x0 = ansa, mid = (rows - 1) / 2, h = Math.round(ansa * 0.9);
    for (var x = x0; x < cols - x0; x++) { g.put(x, 0, 'amber'); g.put(x, rows - 1, 'amber'); }
    for (var y = 0; y < rows; y++) g.mirror(x0, y, 'amber');
    for (var xi = x0 + 2; xi < cols - x0 - 2; xi++) { g.put(xi, 2, 'dim'); g.put(xi, rows - 3, 'dim'); }
    for (var yi = 2; yi < rows - 2; yi++) g.mirror(x0 + 2, yi, 'dim');
    // asas en cola de milano: el vértice toca la tabla y la base queda afuera, con un clavo al centro
    for (var k = 0; k <= x0; k++) {
      var dy = Math.round(k / x0 * h);
      g.mirror(x0 - k, mid - dy, 'amber'); g.mirror(x0 - k, mid + dy, 'amber');
      if (k) { var py = Math.round((k - 1) / x0 * h); for (var yy = py + 1; yy < dy; yy++) { g.mirror(x0 - k, mid - yy, 'amber'); g.mirror(x0 - k, mid + yy, 'amber'); } }
    }
    for (var yb = mid - h; yb <= mid + h; yb++) g.mirror(0, yb, 'amber');
    g.mirror(Math.round(x0 * 0.38), mid, 'lit');
    var paint = surface(el, cols, rows, p, dot);
    paint(g.cells(51, 0.018), null);
  }
  var blanks = Array.prototype.slice.call(doc.querySelectorAll('[data-blank]'));
  function drawBlanks() { blanks.forEach(tablet); }
  if (blanks.length) {
    drawBlanks();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(drawBlanks);
    var bw = window.innerWidth, bt = 0;
    window.addEventListener('resize', function () { clearTimeout(bt); bt = setTimeout(function () { if (window.innerWidth !== bw) { bw = window.innerWidth; drawBlanks(); } }, 120); });
  }

  // ---------------------------------------------------------------- 270 personas, una por punto
  doc.querySelectorAll('[data-tally]').forEach(function (el) {
    var total = +el.dataset.total || 270, split = JSON.parse(el.dataset.split || '[52,28,20]');
    var raw = split.map(function (v) { return v * total / 100; }), cnt = raw.map(Math.floor);
    var left = total - cnt.reduce(function (a, b) { return a + b; }, 0);
    raw.map(function (v, i) { return [v - Math.floor(v), i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, left).forEach(function (r) { cnt[r[1]]++; });
    var tones = ['lit', 'amber', 'dim'], pitch = 14, dot = 8, cells = [], paint = null, lastCols = 0;
    function layout() {
      var host = el.parentElement, hs = getComputedStyle(host), w = host.clientWidth - parseFloat(hs.paddingLeft) - parseFloat(hs.paddingRight), rows = w >= 420 ? 10 : 15, cols = Math.ceil(total / rows);
      if (cols === lastCols && paint) return false;
      lastCols = cols; cells = [];
      var g = 0, used = 0;
      for (var i = 0; i < total; i++) {
        while (g < cnt.length - 1 && i >= used + cnt[g]) { used += cnt[g]; g++; }
        cells.push({ x: (i / rows) | 0, y: i % rows, c: tones[g] || 'dim', t: i / total });
      }
      paint = surface(el, cols, rows, pitch, dot);
      return true;
    }
    layout();
    if (!motion) { paint(cells, null); }
    else {
      paint(cells, -1);
      whenSeen(el, function () {
        var dur = 1800, t0 = 0;
        requestAnimationFrame(function step(now) {
          if (!t0) t0 = now;
          var t = Math.min(1, (now - t0) / dur);
          paint(cells, t);
          if (t < 1) requestAnimationFrame(step); else paint(cells, null);
        });
      });
    }
    window.addEventListener('resize', function () { if (layout()) paint(cells, null); });
  });

  // ---------------------------------------------------------------- corona de laurel y plinto
  if (F) {
    doc.querySelectorAll('[data-glyph]').forEach(function (el) {
      var small = window.innerWidth < 640;
      el.innerHTML = F.glyphSVG(el.dataset.glyph, { pitch: small ? 5 : 6, dot: small ? 3.6 : 4.2, color: 'var(--dot-lit)', label: '' });
      var svg = el.querySelector('svg'); if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.removeAttribute('role'); }
    });
    var plinth = doc.querySelector('[data-plinth]');
    if (plinth) F.Frieze(plinth, { pattern: 'meander', framed: true, pitch: 4, dot: 2.6, color: 'var(--dot-dim)' });
  }
})();
