/* @ds-bundle: {"format":4,"namespace":"Quorum","components":[{"name":"Mark"},{"name":"Logo"},{"name":"Icon"},{"name":"Button"},{"name":"Tag"},{"name":"SectionLabel"},{"name":"Panel"},{"name":"Field"},{"name":"NodeGrid"},{"name":"Globe"},{"name":"Orbits"},{"name":"Schematic"},{"name":"Highlight"}]} */
(function () {
/* Quorum geometry: pure functions shared by the components and the static SVG exports. */

// The mark, traced from the supplied construction drawing: 18 vertices,
// 180° symmetric and mirrored on the NE–SW diagonal. Units: 1 = 1px of the
// 929px-wide source drawing, origin at the centre.
var MARK = {
  extent: 464.5,
  path: 'M-34.5-464.5H34.5L54.5-126.5L202.25-250.5L250.5-202.25L126.5-54.5L464.5-34.5V34.5L58.5 58.5L34.5 464.5H-34.5L-54.5 126.5L-202.25 250.5L-250.5 202.25L-126.5 54.5L-464.5 34.5V-34.5L-58.5-58.5Z',
  vertices: [[-34.5, -464.5], [34.5, -464.5], [54.5, -126.5], [202.25, -250.5], [250.5, -202.25], [126.5, -54.5], [464.5, -34.5], [464.5, 34.5], [58.5, 58.5], [34.5, 464.5], [-34.5, 464.5], [-54.5, 126.5], [-202.25, 250.5], [-250.5, 202.25], [-126.5, 54.5], [-464.5, 34.5], [-464.5, -34.5], [-58.5, -58.5]]
};

function rnd(n) { return Math.round(n * 10) / 10; }
function rad(d) { return d * Math.PI / 180; }

// One path for many dots: two arcs per dot keeps a diagram to a single node.
function dotsPath(dots, r) {
  var out = '';
  for (var i = 0; i < dots.length; i++) {
    var x = dots[i][0], y = dots[i][1];
    out += 'M' + rnd(x - r) + ' ' + rnd(y) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
  }
  return out;
}

function runsToPath(runs) {
  var d = '';
  for (var i = 0; i < runs.length; i++) {
    var run = runs[i];
    if (run.length < 2) continue;
    d += 'M' + rnd(run[0][0]) + ' ' + rnd(run[0][1]);
    for (var j = 1; j < run.length; j++) d += 'L' + rnd(run[j][0]) + ' ' + rnd(run[j][1]);
  }
  return d;
}

// Split a sampled line into front (z >= 0) and back runs. Closed lines start
// at a back point so a front run never breaks at the seam.
function splitRuns(pts, closed) {
  var start = 0;
  if (closed) {
    for (var k = 0; k < pts.length; k++) if (pts[k][2] < 0) { start = k; break; }
  }
  var front = [], back = [], cur = null, curFront = null;
  var n = closed ? pts.length + 1 : pts.length;
  for (var i = 0; i < n; i++) {
    var p = pts[(start + i) % pts.length];
    var isFront = p[2] >= 0;
    if (cur === null || isFront !== curFront) {
      if (cur && cur.length) (curFront ? front : back).push(cur);
      cur = cur && cur.length ? [cur[cur.length - 1]] : [];
      curFront = isFront;
    }
    cur.push(p);
  }
  if (cur && cur.length) (curFront ? front : back).push(cur);
  return { front: front, back: back };
}

// Wireframe globe in a size×size box: meridians and parallels in orthographic
// projection, dots at an even arc spacing, and a ring of radial ticks whose
// length swells toward the upper left (the band reads as tilted).
function globeGeometry(o) {
  o = o || {};
  var S = o.size || 1000, c = S / 2;
  var R = S * (o.globeScale || 0.56), rRing = S * (o.ringScale || 0.4);
  var tilt = rad(o.tilt == null ? 20 : o.tilt), roll = rad(o.roll == null ? -18 : o.roll);
  var rot = rad(o.rotation || 0);
  var M = o.meridians || 12, P = o.parallels || 5, step = o.dotStep || 4.5;
  var ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(roll), sr = Math.sin(roll);
  function proj(lat, lon) {
    var cp = Math.cos(lat), x = cp * Math.sin(lon + rot), y = Math.sin(lat), z = cp * Math.cos(lon + rot);
    var y2 = y * ct - z * st, z2 = y * st + z * ct;
    var X = x * R, Y = -y2 * R;
    return [c + X * cr - Y * sr, c + X * sr + Y * cr, z2];
  }
  var lines = [], back = [], dots = [];
  var i, j, lat, lon, pts, runs;
  for (i = 0; i < M; i++) {
    lon = i * 2 * Math.PI / M; pts = [];
    for (j = -90; j <= 90; j += 2) pts.push(proj(rad(j), lon));
    runs = splitRuns(pts, false);
    lines.push(runsToPath(runs.front)); back.push(runsToPath(runs.back));
    for (j = -90 + step; j < 90; j += step) { var p = proj(rad(j), lon); if (p[2] > 0.04) dots.push(p); }
  }
  for (i = 0; i < P; i++) {
    lat = rad(-90 + 180 * (i + 1) / (P + 1)); pts = [];
    for (j = 0; j < 360; j += 2) pts.push(proj(lat, rad(j)));
    runs = splitRuns(pts, true);
    lines.push(runsToPath(runs.front)); back.push(runsToPath(runs.back));
    var dl = step / Math.cos(lat), off = (i % 2) * dl / 2;
    for (j = off; j < 360; j += dl) { var q = proj(lat, rad(j)); if (q[2] > 0.04) dots.push(q); }
  }
  var ring = null, ticks = '';
  if (o.ring !== false) {
    var w = S * 0.005, tw = S * 0.0025, N = o.ticks || 180, peak = rad(-135);
    ring = { r: rRing, w: w, tw: tw };
    for (i = 0; i < N; i++) {
      var a = i * 2 * Math.PI / N;
      var len = rRing * (0.06 + 0.06 * (0.5 + 0.5 * Math.cos(a - peak)));
      var r0 = rRing + w / 2, r1 = r0 + len;
      ticks += 'M' + rnd(c + r0 * Math.cos(a)) + ' ' + rnd(c + r0 * Math.sin(a)) + 'L' + rnd(c + r1 * Math.cos(a)) + ' ' + rnd(c + r1 * Math.sin(a));
    }
  }
  return { size: S, lines: lines.filter(Boolean), back: back.filter(Boolean), dots: dots, ring: ring, ticks: ticks };
}

// A swarm of inclined orbits around one body, in a 480×360 box. Dots sit at an
// even arc spacing; `phase` (seconds) slides them along their orbit.
var ORBITS = [
  { cx: 300, cy: 170, rx: 225, ry: 130, rot: 12, v: 7 },
  { cx: 330, cy: 140, rx: 250, ry: 110, rot: -18, v: -5 },
  { cx: 310, cy: 190, rx: 210, ry: 150, rot: 28, v: 6 },
  { cx: 345, cy: 160, rx: 240, ry: 125, rot: -6, v: -8 },
  { cx: 290, cy: 150, rx: 195, ry: 140, rot: 40, v: 5 },
  { cx: 355, cy: 185, rx: 260, ry: 105, rot: 4, v: -6 }
];

function orbitsGeometry(o) {
  o = o || {};
  var spacing = o.spacing || 14, phase = o.phase || 0;
  var orbits = (o.orbits || ORBITS).slice(0, o.count || 6);
  var dots = [];
  orbits.forEach(function (e) {
    var cr = Math.cos(rad(e.rot)), sr = Math.sin(rad(e.rot));
    var steps = 720, pts = [], len = [0];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps * 2 * Math.PI, x = e.rx * Math.cos(t), y = e.ry * Math.sin(t);
      pts.push([e.cx + x * cr - y * sr, e.cy + x * sr + y * cr]);
      if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    var total = len[steps], n = Math.max(1, Math.round(total / spacing)), gap = total / n;
    var off = (((phase * (e.v || 0)) % gap) + gap) % gap, k = 0;
    for (var d = 0; d < n; d++) {
      var target = off + d * gap;
      while (k < steps && len[k + 1] < target) k++;
      var f = (target - len[k]) / Math.max(1e-6, len[k + 1] - len[k]);
      dots.push([pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]);
    }
  });
  return { width: 480, height: 360, sun: o.sun || { x: 360, y: 112, r: 140 }, orbits: orbits, dots: dots };
}

// The node grid: hairlines broken around hollow square nodes. One node sits at
// the centre of the box so content centred on the grid lands on a node.
function nodeGridGeometry(w, h, o) {
  var cw = o.cellW, ch = o.cellH, s = o.node, g = o.gap;
  var x0 = w / 2, y0 = h / 2;
  var ci = Math.ceil(x0 / cw) + 1, cj = Math.ceil(y0 / ch) + 1;
  var xs = [], ys = [], i, j;
  for (i = -ci; i <= ci; i++) xs.push(x0 + i * cw);
  for (j = -cj; j <= cj; j++) ys.push(y0 + j * ch);
  var d = '', nodes = [], segs = [], e = s / 2 + g;
  var dist = function (x, y) { return Math.hypot(x - x0, y - y0); };
  // segs run from the end nearer the centre outward, with that end's distance, for draw-in animations
  var seg = function (ax, ay, bx, by, ux, uy) {
    var da = dist(ax, ay), db = dist(bx, by);
    if (db < da) segs.push([bx - ux * e, by - uy * e, ax + ux * e, ay + uy * e, db]);
    else segs.push([ax + ux * e, ay + uy * e, bx - ux * e, by - uy * e, da]);
  };
  for (j = 0; j < ys.length; j++) for (i = 0; i < xs.length - 1; i++) {
    d += 'M' + rnd(xs[i] + e) + ' ' + rnd(ys[j]) + 'H' + rnd(xs[i + 1] - e);
    seg(xs[i], ys[j], xs[i + 1], ys[j], 1, 0);
  }
  for (i = 0; i < xs.length; i++) for (j = 0; j < ys.length - 1; j++) {
    d += 'M' + rnd(xs[i]) + ' ' + rnd(ys[j] + e) + 'V' + rnd(ys[j + 1] - e);
    seg(xs[i], ys[j], xs[i], ys[j + 1], 0, 1);
  }
  for (i = 0; i < xs.length; i++) for (j = 0; j < ys.length; j++) nodes.push([xs[i], ys[j], dist(xs[i], ys[j])]);
  return { d: d, nodes: nodes, segs: segs };
}

/* Quorum drafting kit: the technical-drawing grammar as data → SVG.
   schematic({ width, height, items }) returns SVG markup. Each item is one primitive:
   marker · line · curve · arc · circle · ellipse · tag · leader · ref · label · sup · dimension ·
   bracket · scale · ladder · box · projection · axes · legend · orbitPlane · fan · lattice · screen.
   Styling is by class (q-sx-*), so the tokens and themes apply; pass { inline: PALETTE } for standalone files. */

var SX_FONT = "'IBM Plex Mono', ui-monospace, Menlo, monospace";
var SX_INLINE = {
  hair: 'fill:none;stroke:{line-strong};stroke-width:.75',
  solid: 'fill:none;stroke:{ink-line};stroke-width:1.25',
  dashed: 'fill:none;stroke:{ink-line};stroke-width:1;stroke-dasharray:6 5',
  construction: 'fill:none;stroke:{line-strong};stroke-width:1;stroke-dasharray:5 4',
  ink: 'fill:{ink-line};stroke:none',
  hollow: 'fill:{surface};stroke:{ink-line};stroke-width:1.25',
  tagbox: 'fill:{surface};stroke:{ink-line};stroke-width:1.25',
  legendbox: 'fill:{surface};stroke:{ink-line};stroke-width:1',
  hatch: 'fill:none;stroke:{ink-line};stroke-width:.75',
  text: 'font-family:' + SX_FONT + ';font-size:12px;letter-spacing:.06em;fill:{ink}',
  note: 'font-family:' + SX_FONT + ';font-size:11px;fill:{ink-muted}',
  ref: 'font-family:' + SX_FONT + ';font-size:10px;fill:{ink-muted}',
  big: 'font-family:' + SX_FONT + ';font-size:22px;fill:{ink}',
  halo: 'paint-order:stroke;stroke:{surface};stroke-width:5px;stroke-linejoin:round'
};

function sxNum(n) { return Math.round(n * 100) / 100; }
function sxEsc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
// IBM Plex Mono advances 0.6 em; tracking adds per character.
function sxTextW(s, size, track) { var n = String(s).length; return n * size * 0.6 + Math.max(0, n - 1) * size * (track || 0); }

function sxCtx(opts) {
  var pal = opts && opts.inline;
  var uid = 'sx' + Math.floor(Math.random() * 1e9).toString(36);
  return {
    uid: uid,
    // a class attribute, or the inline style for standalone files
    c: function () {
      var names = Array.prototype.slice.call(arguments).filter(Boolean);
      if (!pal) return ' class="' + names.map(function (n) { return 'q-sx-' + n; }).join(' ') + '"';
      return ' style="' + names.map(function (n) {
        return (SX_INLINE[n] || '').replace(/\{([a-z-]+)\}/g, function (_, k) { return pal[k]; });
      }).join(';') + '"';
    },
    defs: [],
    n: 0
  };
}

function sxPath(d, ctx, cls) { return '<path d="' + d + '"' + ctx.c.apply(null, cls) + '/>'; }
function sxLineD(a, b) { return 'M' + sxNum(a[0]) + ' ' + sxNum(a[1]) + 'L' + sxNum(b[0]) + ' ' + sxNum(b[1]); }

// Line endings: arrow (filled triangle), open (chevron), bar (perpendicular tick).
function sxEnd(kind, tip, dir, ctx) {
  if (!kind || kind === 'none') return '';
  var ux = dir[0], uy = dir[1], px = -uy, py = ux;
  if (kind === 'arrow') {
    var L = 10, W = 3.6, bx = tip[0] - ux * L, by = tip[1] - uy * L;
    return '<path d="M' + sxNum(tip[0]) + ' ' + sxNum(tip[1]) + 'L' + sxNum(bx + px * W) + ' ' + sxNum(by + py * W) + 'L' + sxNum(bx - px * W) + ' ' + sxNum(by - py * W) + 'Z"' + ctx.c('ink') + '/>';
  }
  if (kind === 'open') {
    var L2 = 8, W2 = 4.5, cx = tip[0] - ux * L2, cy = tip[1] - uy * L2;
    return sxPath('M' + sxNum(cx + px * W2) + ' ' + sxNum(cy + py * W2) + 'L' + sxNum(tip[0]) + ' ' + sxNum(tip[1]) + 'L' + sxNum(cx - px * W2) + ' ' + sxNum(cy - py * W2), ctx, ['solid']);
  }
  if (kind === 'bar') return sxPath(sxLineD([tip[0] + px * 6, tip[1] + py * 6], [tip[0] - px * 6, tip[1] - py * 6]), ctx, ['solid']);
  return '';
}
function sxUnit(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; }

function sxMarker(at, shape, size, ctx) {
  var x = at[0], y = at[1], s = size || 1;
  switch (shape || 'dot') {
    case 'dot': return '<circle cx="' + sxNum(x) + '" cy="' + sxNum(y) + '" r="' + sxNum(2.6 * s) + '"' + ctx.c('ink') + '/>';
    case 'ring': return '<circle cx="' + sxNum(x) + '" cy="' + sxNum(y) + '" r="' + sxNum(6 * s) + '"' + ctx.c('hollow') + '/>';
    case 'target': return '<circle cx="' + sxNum(x) + '" cy="' + sxNum(y) + '" r="' + sxNum(11 * s) + '"' + ctx.c('hollow') + '/><circle cx="' + sxNum(x) + '" cy="' + sxNum(y) + '" r="' + sxNum(3.2 * s) + '"' + ctx.c('ink') + '/>';
    case 'node': var h = 5 * s; return '<rect x="' + sxNum(x - h) + '" y="' + sxNum(y - h) + '" width="' + sxNum(2 * h) + '" height="' + sxNum(2 * h) + '"' + ctx.c('hollow') + '/>';
    case 'cross': var a = 7 * s; return sxPath(sxLineD([x - a, y], [x + a, y]) + sxLineD([x, y - a], [x, y + a]), ctx, ['solid']);
    case 'tick': return sxPath(sxLineD([x, y - 5 * s], [x, y + 5 * s]), ctx, ['solid']);
  }
  return '';
}

function sxText(at, text, ctx, o) {
  o = o || {};
  var kind = o.kind || 'text', anchor = o.anchor || 'start';
  var t = o.upper === false || kind !== 'text' ? String(text) : String(text).toUpperCase();
  var rot = o.rotate ? ' transform="rotate(' + sxNum(o.rotate) + ' ' + sxNum(at[0]) + ' ' + sxNum(at[1]) + ')"' : '';
  return '<text x="' + sxNum(at[0]) + '" y="' + sxNum(at[1]) + '" text-anchor="' + anchor + '" dominant-baseline="' + (o.baseline || 'alphabetic') + '"' + rot + ctx.c(kind, o.halo ? 'halo' : '') + '>' + sxEsc(t) + '</text>';
}

// A framed mono label centred on `at`; returns markup and its box for leaders.
function sxTag(at, text, ctx, o) {
  o = o || {};
  var t = String(text).toUpperCase(), w = sxTextW(t, 12, 0.06) + 20, h = 24;
  var x = at[0] - w / 2, y = at[1] - h / 2;
  var out = '<rect x="' + sxNum(x) + '" y="' + sxNum(y) + '" width="' + sxNum(w) + '" height="' + h + '"' + ctx.c('tagbox') + '/>'
    + sxText([at[0], at[1] + 4.3], t, ctx, { anchor: 'middle', upper: false });
  var notes = o.note ? [].concat(o.note) : [];
  notes.forEach(function (line, i) {
    var ny = y + h + 15 + i * 15;
    out += sxText([at[0], ny], line, ctx, { kind: 'note', anchor: 'middle' });
    if (o.underline && i === notes.length - 1) {
      var nw = sxTextW(line, 11, 0) / 2;
      out += sxPath(sxLineD([at[0] - nw, ny + 4], [at[0] + nw, ny + 4]), ctx, ['hair']);
    }
  });
  return { svg: out, box: { x: x, y: y, w: w, h: h + (notes.length ? notes.length * 15 + 6 : 0) } };
}

// Where a line from the box centre toward `to` leaves the box.
function sxBoxExit(box, to) {
  var cx = box.x + box.w / 2, cy = box.y + box.h / 2, dx = to[0] - cx, dy = to[1] - cy;
  var sx = dx ? (box.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (box.h / 2) / Math.abs(dy) : Infinity, s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

var SX_ITEMS = {
  marker: function (it, ctx) { return sxMarker(it.at, it.shape, it.size, ctx); },

  line: function (it, ctx) {
    var u = sxUnit(it.from, it.to);
    return sxPath(sxLineD(it.from, it.to), ctx, [it.stroke || 'solid'])
      + sxEnd(it.end, it.to, u, ctx) + sxEnd(it.start, it.from, [-u[0], -u[1]], ctx);
  },

  // A quadratic arc; bend is the control point's offset as a share of the chord, to the left of travel.
  curve: function (it, ctx) {
    var a = it.from, b = it.to, dx = b[0] - a[0], dy = b[1] - a[1], bend = it.bend == null ? 0.3 : it.bend;
    var c = [(a[0] + b[0]) / 2 - dy * bend, (a[1] + b[1]) / 2 + dx * bend];
    var d = 'M' + sxNum(a[0]) + ' ' + sxNum(a[1]) + 'Q' + sxNum(c[0]) + ' ' + sxNum(c[1]) + ' ' + sxNum(b[0]) + ' ' + sxNum(b[1]);
    return sxPath(d, ctx, [it.stroke || 'solid']) + sxEnd(it.end, b, sxUnit(c, b), ctx) + sxEnd(it.start, a, sxUnit(c, a), ctx);
  },

  arc: function (it, ctx) {
    var r = it.r, c = it.center, a0 = (it.start || 0) * Math.PI / 180, a1 = (it.end == null ? 360 : it.end) * Math.PI / 180;
    var p0 = [c[0] + r * Math.cos(a0), c[1] + r * Math.sin(a0)], p1 = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)];
    var large = Math.abs(a1 - a0) > Math.PI ? 1 : 0, sweep = a1 > a0 ? 1 : 0;
    var d = 'M' + sxNum(p0[0]) + ' ' + sxNum(p0[1]) + 'A' + r + ' ' + r + ' 0 ' + large + ' ' + sweep + ' ' + sxNum(p1[0]) + ' ' + sxNum(p1[1]);
    var tangent = sweep ? [-Math.sin(a1), Math.cos(a1)] : [Math.sin(a1), -Math.cos(a1)];
    return sxPath(d, ctx, [it.stroke || 'solid']) + sxEnd(it.endCap, p1, tangent, ctx);
  },

  // Circle, optionally hatched: hatch { angle (deg), gap, half: 'lower' | 'upper' | null }.
  circle: function (it, ctx) {
    var c = it.center, r = it.r, out = '';
    if (it.hatch) {
      var id = ctx.uid + 'c' + (ctx.n++), ang = (it.hatch.angle || 0) * Math.PI / 180, gap = it.hatch.gap || 7;
      var clip = '<clipPath id="' + id + '"><circle cx="' + sxNum(c[0]) + '" cy="' + sxNum(c[1]) + '" r="' + r + '"/></clipPath>';
      if (it.hatch.half) {
        var tilt = (it.hatch.split || 0) * Math.PI / 180, s = it.hatch.half === 'lower' ? 1 : -1;
        var ex = Math.cos(tilt) * r * 2, ey = Math.sin(tilt) * r * 2, nx = -Math.sin(tilt) * r * 2 * s, ny = Math.cos(tilt) * r * 2 * s;
        clip = '<clipPath id="' + id + '"><path d="M' + sxNum(c[0] - ex) + ' ' + sxNum(c[1] - ey) + 'L' + sxNum(c[0] + ex) + ' ' + sxNum(c[1] + ey) + 'L' + sxNum(c[0] + ex + nx) + ' ' + sxNum(c[1] + ey + ny) + 'L' + sxNum(c[0] - ex + nx) + ' ' + sxNum(c[1] - ey + ny) + 'Z"/></clipPath>';
        out += '<g clip-path="url(#' + id + 'b)">';
        ctx.defs.push('<clipPath id="' + id + 'b"><circle cx="' + sxNum(c[0]) + '" cy="' + sxNum(c[1]) + '" r="' + r + '"/></clipPath>');
      }
      ctx.defs.push(clip);
      var d = '', ca = Math.cos(ang), sa = Math.sin(ang);
      for (var k = -r; k <= r; k += gap) d += sxLineD([c[0] - ca * r * 1.5 - sa * k, c[1] - sa * r * 1.5 + ca * k], [c[0] + ca * r * 1.5 - sa * k, c[1] + sa * r * 1.5 + ca * k]);
      out += '<g clip-path="url(#' + id + ')">' + sxPath(d, ctx, ['hatch']) + '</g>' + (it.hatch.half ? '</g>' : '');
      if (it.hatch.half) {
        var tl = (it.hatch.split || 0) * Math.PI / 180;
        out += sxPath(sxLineD([c[0] - Math.cos(tl) * r, c[1] - Math.sin(tl) * r], [c[0] + Math.cos(tl) * r, c[1] + Math.sin(tl) * r]), ctx, ['solid']);
      }
    }
    return out + '<circle cx="' + sxNum(c[0]) + '" cy="' + sxNum(c[1]) + '" r="' + r + '"' + ctx.c(it.stroke || 'solid') + '/>';
  },

  // Ellipse, optionally carrying evenly spaced dots (a dotted orbit).
  ellipse: function (it, ctx) {
    var c = it.center, rot = it.rotate || 0, out = '<ellipse cx="' + sxNum(c[0]) + '" cy="' + sxNum(c[1]) + '" rx="' + it.rx + '" ry="' + it.ry + '"'
      + (rot ? ' transform="rotate(' + rot + ' ' + sxNum(c[0]) + ' ' + sxNum(c[1]) + ')"' : '') + ctx.c(it.stroke || 'hair') + '/>';
    if (it.dots) {
      var cr = Math.cos(rot * Math.PI / 180), sr = Math.sin(rot * Math.PI / 180), pts = [], len = [0], N = 720;
      for (var i = 0; i <= N; i++) {
        var t = i / N * Math.PI * 2, x = it.rx * Math.cos(t), y = it.ry * Math.sin(t);
        pts.push([c[0] + x * cr - y * sr, c[1] + x * sr + y * cr]);
        if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
      var n = Math.max(1, Math.round(len[N] / it.dots)), step = len[N] / n, k = 0, d = '';
      for (var j = 0; j < n; j++) {
        var target = j * step;
        while (k < N && len[k + 1] < target) k++;
        var f = (target - len[k]) / Math.max(1e-6, len[k + 1] - len[k]), px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
        d += 'M' + sxNum(px - 1.8) + ' ' + sxNum(py) + 'a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0 -3.6 0';
      }
      out += '<path d="' + d + '"' + ctx.c('ink') + '/>';
    }
    return out;
  },

  tag: function (it, ctx) { return sxTag(it.at, it.text, ctx, it).svg; },

  // A tag at `from`, a straight leader to `to`, a marker at `to`.
  leader: function (it, ctx) {
    var t = sxTag(it.from, it.text, ctx, it), tag = { x: t.box.x, y: t.box.y, w: t.box.w, h: 24 }, start = sxBoxExit(tag, it.to);
    // with a note under the tag, a leader heading down leaves from the tag's side instead of crossing the note
    if (it.note && it.to[1] > tag.y + tag.h) start = [it.to[0] >= it.from[0] ? tag.x + tag.w : tag.x, tag.y + tag.h / 2];
    return sxPath(sxLineD(start, it.to), ctx, [it.stroke || 'solid']) + sxMarker(it.to, it.marker || 'ring', 1, ctx) + t.svg;
  },

  ref: function (it, ctx) { return sxText(it.at, it.text, ctx, { kind: 'ref', anchor: it.anchor }); },
  label: function (it, ctx) { return sxText(it.at, it.text, ctx, { kind: it.size === 'big' ? 'big' : (it.muted ? 'note' : 'text'), anchor: it.anchor, upper: it.upper, halo: it.halo }); },

  // Base text with a raised index, as in R¹² or F¹⁵·⁸.
  sup: function (it, ctx) {
    var w = sxTextW(it.text, 12, 0);
    return sxText(it.at, it.text, ctx, { anchor: 'start', upper: false })
      + sxText([it.at[0] + w + 1, it.at[1] - 6], it.index, ctx, { kind: 'ref', anchor: 'start' });
  },

  // A measured span: the line, end bars, and the value centred on it.
  dimension: function (it, ctx) {
    var u = sxUnit(it.from, it.to), n = [-u[1], u[0]], off = it.offset || 0;
    var a = [it.from[0] + n[0] * off, it.from[1] + n[1] * off], b = [it.to[0] + n[0] * off, it.to[1] + n[1] * off];
    var mid = [(a[0] + b[0]) / 2 - n[0] * 8, (a[1] + b[1]) / 2 - n[1] * 8];
    var ang = Math.atan2(u[1], u[0]) * 180 / Math.PI;
    if (ang > 90 || ang < -90) ang += 180;
    var out = sxPath(sxLineD(a, b), ctx, ['solid']) + sxEnd('bar', a, u, ctx) + sxEnd('bar', b, u, ctx);
    if (off) out += sxPath(sxLineD(it.from, a) + sxLineD(it.to, b), ctx, ['hair']);
    return out + (it.text ? sxText(mid, it.text, ctx, { anchor: 'middle', rotate: ang, upper: false, halo: true }) : '');
  },

  // A square bracket under (or over) a span, with a label at its stem.
  bracket: function (it, ctx) {
    var a = it.from, b = it.to, dep = it.depth || 10, s = it.side === 'above' ? -1 : 1, mx = (a[0] + b[0]) / 2;
    var d = 'M' + sxNum(a[0]) + ' ' + sxNum(a[1] - s * dep) + 'V' + sxNum(a[1]) + 'H' + sxNum(b[0]) + 'V' + sxNum(b[1] - s * dep);
    var out = sxPath(d, ctx, ['solid']);
    if (it.stem) out += sxPath(sxLineD([mx, a[1]], [mx, a[1] + s * it.stem]), ctx, ['solid']);
    return out + (it.text ? sxText([mx, a[1] - s * (dep + 6)], it.text, ctx, { anchor: 'middle', upper: false }) : '');
  },

  // A ruler between two points: `divisions` minor ticks, every `major`-th long, labels under the majors.
  scale: function (it, ctx) {
    var a = it.from, b = it.to, u = sxUnit(a, b), n = [-u[1], u[0]], div = it.divisions || 10, maj = it.major || 5, side = it.side === 'left' ? -1 : 1;
    var d = sxLineD(a, b), out = '', labels = it.labels || [];
    for (var i = 0; i <= div; i++) {
      var f = i / div, p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], L = i % maj === 0 ? 9 : 4.5;
      d += sxLineD([p[0] - n[0] * L * side, p[1] - n[1] * L * side], [p[0] + n[0] * L * side * 0.0001, p[1] + n[1] * L * side * 0.0001]);
      var li = i / maj;
      if (i % maj === 0 && labels[li] != null) out += sxText([p[0] + n[0] * 16 * side, p[1] + n[1] * 16 * side + 3.5], labels[li], ctx, { kind: 'ref', anchor: Math.abs(u[0]) > 0.5 ? 'middle' : (side > 0 ? 'start' : 'end') });
    }
    return sxPath(d, ctx, ['solid']) + out;
  },

  // A vertical scale between two tags, with value pairs either side of each stop.
  ladder: function (it, ctx) {
    var x = it.from[0], y0 = it.from[1], y1 = it.to[1], out = '';
    var d = sxLineD([x, y0], [x, y1]) + sxLineD([x - 6, y0], [x + 6, y0]) + sxLineD([x - 6, y1], [x + 6, y1]);
    (it.stops || []).forEach(function (s) {
      var y = y0 + (y1 - y0) * s.at;
      d += sxLineD([x - 5, y], [x + 5, y]);
      if (s.left) out += sxText([x - 18, y + 4], s.left, ctx, { anchor: 'end', upper: false });
      if (s.right) out += sxText([x + 18, y + 4], s.right, ctx, { anchor: 'start', upper: false });
    });
    out += sxPath(d, ctx, ['solid']);
    if (it.ends) {
      if (it.ends[0]) out += sxTag([x, y0 - 22], it.ends[0], ctx).svg;
      if (it.ends[1]) out += sxTag([x, y1 + 22], it.ends[1], ctx).svg;
    }
    return out;
  },

  // A dashed construction rectangle with its index in the top-left corner.
  box: function (it, ctx) {
    return '<rect x="' + sxNum(it.x) + '" y="' + sxNum(it.y) + '" width="' + sxNum(it.w) + '" height="' + sxNum(it.h) + '"' + ctx.c('construction') + '/>'
      + (it.label ? sxText([it.x + 8, it.y + 16], it.label, ctx, { kind: 'ref', upper: false }) : '');
  },

  // Dashed lines joining two circles along their outer tangents.
  projection: function (it, ctx) {
    var A = it.a, B = it.b, dx = B.center[0] - A.center[0], dy = B.center[1] - A.center[1], dist = Math.hypot(dx, dy);
    var base = Math.atan2(dy, dx), off = Math.acos(Math.max(-1, Math.min(1, (A.r - B.r) / dist))), d = '';
    [1, -1].forEach(function (s) {
      var t = base + s * off;
      d += sxLineD([A.center[0] + A.r * Math.cos(t), A.center[1] + A.r * Math.sin(t)], [B.center[0] + B.r * Math.cos(t), B.center[1] + B.r * Math.sin(t)]);
    });
    return sxPath(d, ctx, ['dashed']);
  },

  axes: function (it, ctx) {
    var c = it.center, w = it.w || 200, h = it.h || 200;
    return sxPath(sxLineD([c[0] - w / 2, c[1]], [c[0] + w / 2, c[1]]) + sxLineD([c[0], c[1] - h / 2], [c[0], c[1] + h / 2]), ctx, ['hair']);
  },

  // A framed key: symbol = meaning, one row per item.
  legend: function (it, ctx) {
    var rows = it.items || [], wMax = 0;
    rows.forEach(function (r) { wMax = Math.max(wMax, sxTextW('= ' + r.text, 11, 0)); });
    var w = wMax + 56, h = rows.length * 22 + 10, x = it.at[0], y = it.at[1];
    var out = '<rect x="' + sxNum(x) + '" y="' + sxNum(y) + '" width="' + sxNum(w) + '" height="' + h + '"' + ctx.c('legendbox') + '/>';
    rows.forEach(function (r, i) {
      var cy = y + 16 + i * 22;
      out += sxMarker([x + 20, cy], r.shape, 0.7, ctx) + sxText([x + 38, cy + 4], '= ' + r.text, ctx, { kind: 'note' });
    });
    return out;
  },

  // Concentric orbits seen at a low angle, with hairline axes; bodies sit on chosen orbits.
  orbitPlane: function (it, ctx) {
    var c = it.center, ratio = it.ratio || 0.22, radii = it.radii || [60, 120, 200, 300], out = '';
    var maxR = radii[radii.length - 1];
    if (it.axes !== false) out += SX_ITEMS.axes({ center: c, w: maxR * 2.1, h: maxR * ratio * 2.6 }, ctx);
    radii.forEach(function (r) { out += SX_ITEMS.ellipse({ center: c, rx: r, ry: r * ratio, stroke: 'hair' }, ctx); });
    (it.bodies || []).forEach(function (b) {
      var r = radii[b.orbit], t = (b.angle || 0) * Math.PI / 180;
      out += sxMarker([c[0] + r * Math.cos(t), c[1] + r * ratio * Math.sin(t)], b.shape || 'ring', b.size || 1, ctx);
    });
    return out + sxMarker(c, it.centre || 'ring', 1.4, ctx);
  },

  // Trajectories from one origin: alternating solid and dashed arcs ending in arrows.
  fan: function (it, ctx) {
    var out = '';
    (it.targets || []).forEach(function (t, i) {
      out += SX_ITEMS.curve({ from: it.origin, to: t, bend: (it.bend == null ? 0.35 : it.bend) * (i % 2 ? 0.8 : 1), stroke: i % 2 ? 'dashed' : 'solid', end: 'arrow' }, ctx);
    });
    return out + sxMarker(it.origin, 'ring', 1.6, ctx);
  },

  // A hexagon cut into a triangular lattice, nodes dotted on its outline.
  lattice: function (it, ctx) {
    var c = it.center, r = it.r || 80, n = it.n || 3, s = r / n, d = '', h = Math.sqrt(3) / 2, dots = '';
    var hex = [];
    for (var k = 0; k < 6; k++) hex.push([c[0] + r * Math.cos(k * Math.PI / 3), c[1] + r * Math.sin(k * Math.PI / 3)]);
    var id = ctx.uid + 'h' + (ctx.n++);
    ctx.defs.push('<clipPath id="' + id + '"><path d="M' + hex.map(function (p) { return sxNum(p[0]) + ' ' + sxNum(p[1]); }).join('L') + 'Z"/></clipPath>');
    for (var a = 0; a < 3; a++) {
      var t = a * Math.PI / 3, ux = Math.cos(t), uy = Math.sin(t), px = -uy, py = ux;
      for (var j = -n * 2; j <= n * 2; j++) {
        var o = j * s * h;
        d += sxLineD([c[0] + px * o - ux * r * 2, c[1] + py * o - uy * r * 2], [c[0] + px * o + ux * r * 2, c[1] + py * o + uy * r * 2]);
      }
    }
    hex.forEach(function (p) { dots += sxMarker(p, 'dot', 0.8, ctx); });
    return '<g clip-path="url(#' + id + ')">' + sxPath(d, ctx, ['hair']) + '</g>'
      + sxPath('M' + hex.map(function (p) { return sxNum(p[0]) + ' ' + sxNum(p[1]); }).join('L') + 'Z', ctx, ['solid']) + dots + sxMarker(c, 'dot', 0.8, ctx);
  },

  // A regular dot screen over a rectangle.
  screen: function (it, ctx) {
    var g = it.gap || 10, r = it.r || 1.1, d = '';
    for (var y = it.y + g / 2; y < it.y + it.h; y += g) for (var x = it.x + g / 2; x < it.x + it.w; x += g) d += 'M' + sxNum(x - r) + ' ' + sxNum(y) + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0';
    return '<path d="' + d + '"' + ctx.c('ink') + '/>';
  }
};

function schematic(spec, opts) {
  var ctx = sxCtx(opts), body = '';
  (spec.items || []).forEach(function (it) { var f = SX_ITEMS[it.type]; if (f) body += f(it, ctx); });
  var w = spec.width || 960, h = spec.height || 540;
  var bg = opts && opts.inline && opts.background ? '<rect width="' + w + '" height="' + h + '" fill="' + opts.inline.surface + '"/>' : '';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '"'
    + (opts && opts.inline ? '' : ' class="q-sx"') + '>' + (ctx.defs.length ? '<defs>' + ctx.defs.join('') + '</defs>' : '') + bg + body + '</svg>';
}

/* Quorum components. Plain React.createElement; React 18 is read from window at render time. */

function Rx() { return window.React; }
function h() { var r = Rx(); return r.createElement.apply(r, arguments); }
function cls() { return Array.prototype.filter.call(arguments, Boolean).join(' '); }
function omit(o, keys) { var out = {}; for (var k in o) if (keys.indexOf(k) < 0) out[k] = o[k]; return out; }

var uidCount = 0;
function useUid(prefix) {
  var ref = Rx().useRef(null);
  if (ref.current == null) ref.current = prefix + '-' + (++uidCount);
  return ref.current;
}

function useReducedMotion() {
  var r = Rx(), s = r.useState(false);
  r.useEffect(function () {
    if (!window.matchMedia) return;
    var m = window.matchMedia('(prefers-reduced-motion: reduce)');
    var on = function () { s[1](m.matches); };
    on();
    if (m.addEventListener) m.addEventListener('change', on);
    return function () { if (m.removeEventListener) m.removeEventListener('change', on); };
  }, []);
  return s[0];
}

// Seconds since start, at most 30 updates a second, only while `on`.
function useTicker(on) {
  var r = Rx(), s = r.useState(0);
  r.useEffect(function () {
    if (!on) return;
    var raf, start = null, last = -1;
    function frame(ts) {
      if (start == null) start = ts;
      var t = (ts - start) / 1000;
      if (t - last >= 1 / 30) { last = t; s[1](t); }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return function () { cancelAnimationFrame(raf); };
  }, [on]);
  return s[0];
}

function useSize(ref) {
  var r = Rx(), s = r.useState([0, 0]);
  r.useLayoutEffect(function () {
    var el = ref.current;
    if (!el) return;
    var update = function () {
      var b = el.getBoundingClientRect();
      s[1](function (prev) { return prev[0] === b.width && prev[1] === b.height ? prev : [b.width, b.height]; });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    var ro = new ResizeObserver(update);
    ro.observe(el);
    return function () { ro.disconnect(); };
  }, []);
  return s[0];
}

// True once the element has been at least a fifth on screen; stays true.
function useSeen(ref, on) {
  var r = Rx(), s = r.useState(false);
  r.useEffect(function () {
    if (!on || s[0]) return;
    var el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { s[1](true); return; }
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { s[1](true); io.disconnect(); }
    }, { threshold: 0.2 });
    io.observe(el);
    return function () { io.disconnect(); };
  }, [on, s[0]]);
  return s[0];
}

/* ---------- Brand ---------- */

function Mark(p) {
  var size = p.size || 32, variant = p.variant || 'solid';
  var pad = variant === 'construction' ? 26 : variant === 'outline' ? 8 : 0;
  var half = MARK.extent + pad, unit = 2 * half / size;
  var kids = [];
  if (p.title) kids.push(h('title', { key: 't' }, p.title));
  if (variant === 'solid') {
    kids.push(h('path', { key: 'p', d: MARK.path, className: 'q-mark-solid' }));
  } else {
    var strokePx = Math.max(1, size * 0.0032);
    kids.push(h('path', { key: 'p', d: MARK.path, className: 'q-mark-outline', strokeWidth: strokePx * unit }));
    if (variant === 'construction') {
      var hs = Math.min(12, Math.max(6, size * 0.022)) * unit;
      MARK.vertices.forEach(function (v, i) {
        kids.push(h('rect', { key: 'h' + i, x: v[0] - hs / 2, y: v[1] - hs / 2, width: hs, height: hs, className: 'q-mark-handle', strokeWidth: strokePx * unit }));
      });
    }
  }
  return h('svg', {
    className: cls('q-mark', p.className), style: p.style, width: size, height: size,
    viewBox: [-half, -half, 2 * half, 2 * half].join(' '),
    role: p.title ? 'img' : undefined, 'aria-hidden': p.title ? undefined : true
  }, kids);
}

function Logo(p) {
  var size = p.size || 24;
  return h('span', { className: cls('q-logo', p.className), style: Object.assign({ fontSize: size + 'px' }, p.style), role: 'img', 'aria-label': 'Quorum' },
    h(Mark, { size: Math.round(size * 1.05) }),
    h('span', { className: 'q-logo-word', 'aria-hidden': true }, 'Quorum'));
}

var ICONS = {
  globe: [
    ['g', { transform: 'rotate(-20 12 12)' }, [
      ['circle', { cx: 12, cy: 12, r: 8 }],
      ['ellipse', { cx: 12, cy: 12, rx: 4, ry: 8 }],
      ['path', { d: 'M4 12h16M5.07 8h13.86M5.07 16h13.86M12 1.5V4M12 20v2.5' }]
    ]]
  ],
  orbit: [
    ['circle', { cx: 12, cy: 12, r: 3.25 }],
    ['ellipse', { cx: 12, cy: 12, rx: 10, ry: 4.5, transform: 'rotate(-25 12 12)' }],
    ['circle', { cx: 5.1, cy: 17.7, r: 1.25, fill: 'currentColor', stroke: 'none' }]
  ],
  node: [
    ['rect', { x: 9, y: 9, width: 6, height: 6 }],
    ['path', { d: 'M2 12h4.5M17.5 12H22M12 2v4.5M12 17.5V22' }]
  ],
  'arrow-right': [['path', { d: 'M3.75 12h16.5M13.5 5.25 20.25 12 13.5 18.75' }]],
  'arrow-up-right': [['path', { d: 'M6.5 17.5l11-11M8.5 6.5h9v9' }]]
};

function iconNodes(list) {
  return list.map(function (n, i) { return h(n[0], Object.assign({ key: i }, n[1]), n[2] ? iconNodes(n[2]) : undefined); });
}

function Icon(p) {
  var size = p.size || 24;
  if (p.name === 'mark') return h(Mark, { size: size, title: p.title, className: cls('q-icon', p.className) });
  var def = ICONS[p.name];
  if (!def) return null;
  return h('svg', {
    className: cls('q-icon', p.className), style: p.style, width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'square', strokeLinejoin: 'miter',
    role: p.title ? 'img' : undefined, 'aria-hidden': p.title ? undefined : true
  }, p.title ? h('title', null, p.title) : null, iconNodes(def));
}

/* ---------- Actions ---------- */

function Button(p) {
  var variant = p.variant || 'default', size = p.size || 'md';
  var rest = omit(p, ['variant', 'size', 'className', 'children', 'icon', 'external']);
  var props = Object.assign(rest, { className: cls('q-btn', 'q-btn-' + variant, 'q-btn-' + size, p.className) });
  if (!p.href && !props.type) props.type = 'button';
  if (p.href && p.external) { props.target = '_blank'; props.rel = 'noopener noreferrer'; }
  var kids;
  if (variant === 'mark') {
    kids = [
      h('span', { key: 'c', className: 'q-btn-cell', 'aria-hidden': true }, p.icon || h(Mark, { size: size === 'lg' ? 28 : 20 })),
      h('span', { key: 'l', className: 'q-btn-label' }, p.children)
    ];
  } else if (variant === 'text') {
    kids = [
      h('span', { key: 'l', className: 'q-btn-label' }, p.children),
      h(Icon, { key: 'i', name: p.external ? 'arrow-up-right' : 'arrow-right', size: 18 })
    ];
  } else {
    kids = [p.icon ? h('span', { key: 'i', className: 'q-btn-icon', 'aria-hidden': true }, p.icon) : null, h('span', { key: 'l', className: 'q-btn-label' }, p.children)];
  }
  return h(p.href ? 'a' : 'button', props, kids);
}

/* ---------- Content ---------- */

function Tag(p) {
  var rest = omit(p, ['tone', 'size', 'className', 'children', 'as']);
  return h(p.as || 'span', Object.assign(rest, { className: cls('q-tag', 'q-tag-' + (p.tone || 'ink'), p.size === 'sm' && 'q-tag-sm', p.className) }), p.children);
}

function SectionLabel(p) {
  return h(p.as || 'h2', { id: p.id, className: cls('q-section-label', p.className), style: p.style },
    h('span', { className: 'q-section-label-node', 'aria-hidden': true }),
    h('span', { className: 'q-section-label-text' }, p.children),
    h('span', { className: 'q-section-label-rule', 'aria-hidden': true }),
    p.meta ? h('span', { className: 'q-section-label-meta' }, p.meta) : null);
}

function Panel(p) {
  var icon = typeof p.icon === 'string' ? h(Icon, { name: p.icon, size: 28 }) : p.icon;
  var body = typeof p.children === 'string' ? h('p', { className: 'q-panel-text' }, p.children) : p.children;
  var TitleTag = p.titleAs || 'h3';
  return h(p.as || 'div', {
    className: cls('q-panel', 'q-panel-' + (p.surface || 'fill'), p.className),
    style: Object.assign({ minHeight: p.minHeight }, p.style)
  },
    (icon || p.tag) ? h('div', { className: 'q-panel-head' }, icon ? h('span', { className: 'q-panel-icon' }, icon) : h('span'), p.tag || null) : null,
    h('div', { className: 'q-panel-body' },
      p.title ? h(TitleTag, { className: 'q-panel-title' }, p.title) : null,
      body || null,
      p.actions ? h('div', { className: 'q-panel-actions' }, p.actions) : null));
}

/* ---------- Forms ---------- */

function Field(p) {
  var generated = useUid('q-field');
  var id = p.id || generated, msg = p.error || p.hint, msgId = id + '-msg';
  var rest = omit(p, ['label', 'hint', 'error', 'multiline', 'className', 'style', 'id']);
  return h('div', { className: cls('q-field', p.error && 'q-field-invalid', p.className), style: p.style },
    h('label', { className: 'q-field-label', htmlFor: id }, p.label),
    h(p.multiline ? 'textarea' : 'input', Object.assign(rest, {
      id: id, className: 'q-field-input',
      'aria-invalid': p.error ? true : undefined,
      'aria-describedby': msg ? msgId : undefined
    })),
    msg ? h('p', { id: msgId, className: 'q-field-msg' }, msg) : null);
}

/* ---------- Diagrams ---------- */

function NodeGrid(p) {
  var ref = Rx().useRef(null), size = useSize(ref), pid = useUid('q-tex');
  var o = { cellW: p.cellWidth || 240, cellH: p.cellHeight || 200, node: p.node || 16, gap: p.gap == null ? 10 : p.gap };
  var g = size[0] ? nodeGridGeometry(size[0], size[1], o) : null;
  var sw = Math.max(1, o.node * 0.19), inset = sw / 2;
  // intro="assemble": once the grid is on screen it draws itself from the centre node outward, then holds still;
  // until then it stays empty, and its content rises in after the lines
  var reduce = useReducedMotion(), doneState = Rx().useState(false), END = 3.6;
  var intro = p.intro === 'assemble' && !reduce && !doneState[0];
  var seen = useSeen(ref, intro), speed = +p.introSpeed > 0 ? +p.introSpeed : 1;
  var playing = intro && seen && !!g;
  var t = useTicker(playing) * speed;
  Rx().useEffect(function () { if (playing && t > END) doneState[1](true); }, [playing, t > END]);
  var easeOut = function (x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - Math.pow(1 - x, 3); };
  var maxD = 1, lines = g ? g.d : '', nodeAt = function () { return 1; }, texture = 1;
  if (intro && !playing) { lines = ''; nodeAt = function () { return 0; }; texture = 0; }
  if (playing && g) {
    g.nodes.forEach(function (n) { if (n[2] > maxD) maxD = n[2]; });
    var grow = 2.4;
    lines = '';
    g.segs.forEach(function (sg) {
      var q = easeOut((t - (sg[4] / maxD) * grow - 0.25) / 0.55);
      if (q > 0) lines += 'M' + sg[0] + ' ' + sg[1] + 'L' + (sg[0] + (sg[2] - sg[0]) * q) + ' ' + (sg[1] + (sg[3] - sg[1]) * q);
    });
    nodeAt = function (n) { return easeOut((t - (n[2] / maxD) * grow) / 0.45); };
    texture = Math.max(0, Math.min(1, (t - 2.0) / 1.0));
  }
  return h('div', { ref: ref, className: cls('q-nodegrid', p.className), 'data-intro': intro ? (playing ? 'play' : 'wait') : undefined, style: Object.assign({ height: p.height == null ? 320 : p.height }, intro ? { '--q-intro-delay': (1.5 / speed) + 's' } : null, p.style) },
    h('svg', { className: 'q-nodegrid-svg', width: '100%', height: '100%', 'aria-hidden': true },
      p.texture === false ? null : h('defs', null,
        h('pattern', { id: pid, width: 28, height: 28, patternUnits: 'userSpaceOnUse' },
          h('path', { d: MARK.path, transform: 'translate(14 14) scale(0.0075)', className: 'q-nodegrid-tex' }))),
      p.texture === false ? null : h('rect', { width: '100%', height: '100%', fill: 'url(#' + pid + ')', style: texture < 1 ? { opacity: texture } : undefined }),
      g ? h('path', { d: lines, className: 'q-nodegrid-line' }) : null,
      g ? g.nodes.map(function (n, i) {
        var a = nodeAt(n);
        if (a <= 0) return null;
        var rect = h('rect', { x: -o.node / 2 + inset, y: -o.node / 2 + inset, width: o.node - sw, height: o.node - sw, strokeWidth: sw, className: 'q-nodegrid-node' });
        return h('g', { key: i, transform: 'translate(' + n[0] + ' ' + n[1] + ')' + (a < 1 ? ' rotate(' + ((1 - a) * 45) + ') scale(' + a + ')' : '') }, rect);
      }) : null),
    p.children ? h('div', { className: 'q-nodegrid-content' }, p.children) : null);
}

function Globe(p) {
  var reduce = useReducedMotion(), t = useTicker(!!p.animate && !reduce);
  var g = globeGeometry({
    size: 1000, rotation: (p.rotation || 0) + t * (p.speed == null ? 3 : p.speed),
    tilt: p.tilt, roll: p.roll, meridians: p.meridians, parallels: p.parallels, ring: p.ring
  });
  var box = p.size ? { width: p.size } : null;
  return h('div', { className: cls('q-globe', p.tone === 'ink' ? 'q-tone-ink' : 'q-tone-line', p.className), style: Object.assign({}, box, p.style) },
    h('svg', { viewBox: '0 0 1000 1000', role: p.title ? 'img' : undefined, 'aria-hidden': p.title ? undefined : true },
      p.title ? h('title', null, p.title) : null,
      p.back ? h('path', { d: g.back.join(''), className: 'q-globe-back', vectorEffect: 'non-scaling-stroke' }) : null,
      h('path', { d: g.lines.join(''), className: 'q-globe-lines', vectorEffect: 'non-scaling-stroke' }),
      h('path', { d: dotsPath(g.dots, 3.6), className: 'q-globe-dots' }),
      g.ring ? h('circle', { cx: 500, cy: 500, r: g.ring.r, strokeWidth: g.ring.w, className: 'q-globe-ring' }) : null,
      g.ring ? h('path', { d: g.ticks, strokeWidth: g.ring.tw, className: 'q-globe-ticks' }) : null),
    p.children ? h('div', { className: 'q-globe-content' }, p.children) : null);
}

function Orbits(p) {
  var reduce = useReducedMotion(), t = useTicker(!!p.animate && !reduce);
  var g = orbitsGeometry({ phase: t, count: p.count, sun: p.sun });
  return h('div', { className: cls('q-orbits', p.className), style: p.style },
    h('svg', { viewBox: '0 0 480 360', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': true },
      p.sunVisible === false ? null : h('circle', { cx: g.sun.x, cy: g.sun.y, r: g.sun.r, className: 'q-orbits-sun', vectorEffect: 'non-scaling-stroke' }),
      g.orbits.map(function (e, i) {
        return h('ellipse', { key: i, cx: e.cx, cy: e.cy, rx: e.rx, ry: e.ry, transform: 'rotate(' + e.rot + ' ' + e.cx + ' ' + e.cy + ')', className: 'q-orbits-path', vectorEffect: 'non-scaling-stroke' });
      }),
      h('path', { d: dotsPath(g.dots, 1.6), className: 'q-orbits-dots' })),
    (p.labels || []).map(function (l, i) {
      return h('span', { key: i, className: 'q-orbits-label', style: { left: l.x + '%', top: l.y + '%' } }, h(Tag, { tone: l.tone || 'ink' }, l.text));
    }),
    p.children ? h('div', { className: 'q-orbits-content' }, p.children) : null);
}

/* ---------- Drafting ---------- */

// A technical drawing composed as data: each item is one primitive of the drafting kit (drafting.js).
function Schematic(p) {
  var spec = { width: p.width || 960, height: p.height || 540, items: p.items || [] };
  var key = JSON.stringify(spec);
  var markup = Rx().useMemo(function () { return schematic(spec); }, [key]);
  return h('div', {
    className: cls('q-schematic', p.className), style: p.style,
    role: p.title ? 'img' : undefined, 'aria-label': p.title || undefined, 'aria-hidden': p.title ? undefined : true,
    dangerouslySetInnerHTML: { __html: markup }
  });
}

/* ---------- Behaviour ---------- */

// Paints the text selection underneath the words, one block per line, so it can carry a gradient, grain and a
// wipe. Renders nothing visible; mount one per page and it works inside the nearest themed root. Each block goes
// into the nearest ancestor that paints a background (a cell, a panel, the page), which is made a stacking
// context only while it holds a selection.
function Highlight(p) {
  var ref = Rx().useRef(null), reduce = useReducedMotion();
  var variant = p.variant || 'flow', grain = p.grain !== false, wipe = p.wipe !== false && !reduce;
  Rx().useEffect(function () {
    var anchor = ref.current;
    var scope = (anchor && anchor.closest('[data-theme]')) || document.body;
    scope.setAttribute('data-q-highlight', '');
    var held = new Map(), raf = 0;

    function clear(c) { return c === 'transparent' || /,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c); }
    function surfaceOf(el, memo) {
      if (memo.has(el)) return memo.get(el);
      var s = scope;
      for (var n = el; n && n !== scope; n = n.parentElement) {
        var cs = getComputedStyle(n);
        if (cs.backgroundImage !== 'none' || !clear(cs.backgroundColor)) { s = n; break; }
      }
      memo.set(el, s);
      return s;
    }
    // Selected text, as line boxes grouped by the surface each line sits on.
    function collect() {
      var sel = document.getSelection(), groups = new Map(), memo = new Map();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return groups;
      var sub = document.createRange();
      for (var r = 0; r < sel.rangeCount; r++) {
        var range = sel.getRangeAt(r);
        if (!range.intersectsNode(scope)) continue;
        var root = range.commonAncestorContainer;
        if (root.nodeType === 3) root = root.parentNode;
        var walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (var t = walk.nextNode(); t; t = walk.nextNode()) {
          if (!range.intersectsNode(t) || !scope.contains(t) || !t.parentElement || t.parentElement.closest('.q-hl-layer')) continue;
          var a = t === range.startContainer ? range.startOffset : 0, b = t === range.endContainer ? range.endOffset : t.length;
          if (a >= b || !/\S/.test(t.data.slice(a, b))) continue;
          sub.setStart(t, a); sub.setEnd(t, b);
          var surf = surfaceOf(t.parentElement, memo), lines = groups.get(surf);
          if (!lines) groups.set(surf, lines = []);
          var rects = sub.getClientRects();
          for (var i = 0; i < rects.length; i++) {
            var q = rects[i];
            if (q.width < 1 || q.height < 4) continue;
            var hit = null;
            for (var k = 0; k < lines.length; k++) if (Math.abs(lines[k].top - q.top) < 4 && Math.abs(lines[k].bottom - q.bottom) < 6) { hit = lines[k]; break; }
            if (hit) { hit.left = Math.min(hit.left, q.left); hit.right = Math.max(hit.right, q.right); }
            else lines.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom });
          }
        }
      }
      return groups;
    }
    function hold(el) {
      var cs = getComputedStyle(el), st = el.style;
      var s = { layer: document.createElement('span'), pool: [], keys: {}, iso: st.isolation, z: st.zIndex };
      if (cs.isolation !== 'isolate' && cs.zIndex === 'auto') {
        if (cs.position === 'static') st.isolation = 'isolate'; else st.zIndex = '1';
      }
      s.layer.className = 'q-hl-layer';
      s.layer.setAttribute('aria-hidden', 'true');
      el.appendChild(s.layer);
      held.set(el, s);
      return s;
    }
    function release(el) {
      var s = held.get(el);
      s.layer.remove(); el.style.isolation = s.iso; el.style.zIndex = s.z;
      held.delete(el);
    }
    function render() {
      raf = 0;
      var groups = collect();
      held.forEach(function (s, el) { if (!groups.has(el)) release(el); });
      groups.forEach(function (lines, el) {
        var s = held.get(el) || hold(el), o = s.layer.getBoundingClientRect(), keys = {};
        lines.forEach(function (L, i) {
          var d = s.pool[i];
          if (!d) { d = document.createElement('span'); s.pool.push(d); s.layer.appendChild(d); }
          var key = Math.round(L.top - o.top);
          keys[key] = 1;
          var on = wipe && (!s.keys[key] || d.classList.contains('q-hl-wipe'));
          d.className = 'q-hl-line q-hl-' + (variant === 'line' ? 'line-grad' : variant) + (grain ? ' q-hl-grain' : '') + (on ? ' q-hl-wipe' : '');
          d.style.left = (L.left - o.left - 3) + 'px';
          d.style.top = (L.top - o.top - 1) + 'px';
          d.style.width = (L.right - L.left + 6) + 'px';
          d.style.height = (L.bottom - L.top + 2) + 'px';
          d.hidden = false;
        });
        for (var j = lines.length; j < s.pool.length; j++) { s.pool[j].hidden = true; s.pool[j].className = 'q-hl-line'; }
        s.keys = keys;
      });
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(render); }
    document.addEventListener('selectionchange', schedule);
    window.addEventListener('resize', schedule);
    schedule();
    return function () {
      document.removeEventListener('selectionchange', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
      Array.from(held.keys()).forEach(release);
      scope.removeAttribute('data-q-highlight');
    };
  }, [variant, grain, wipe]);
  return h('span', { ref: ref, hidden: true });
}

var Quorum = {
  Mark: Mark, Logo: Logo, Icon: Icon, Button: Button, Tag: Tag, SectionLabel: SectionLabel,
  Panel: Panel, Field: Field, NodeGrid: NodeGrid, Globe: Globe, Orbits: Orbits, Schematic: Schematic, Highlight: Highlight,
  geometry: { MARK: MARK, globe: globeGeometry, orbits: orbitsGeometry, nodeGrid: nodeGridGeometry, dotsPath: dotsPath, schematic: schematic }
};

window.Quorum = Object.assign(window.Quorum || {}, Quorum);
})();
