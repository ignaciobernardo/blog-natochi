/* @ds-bundle: {"format": 4, "namespace": "GS", "components": [{"name": "Panel"}, {"name": "IconCell"}, {"name": "StatusDot"}, {"name": "Pill"}, {"name": "Tag"}, {"name": "Callout"}, {"name": "KeyValue"}, {"name": "ProgressBar"}, {"name": "SegmentedMeter"}, {"name": "Stat"}, {"name": "Plot"}, {"name": "AreaChart"}, {"name": "Globe"}, {"name": "LogList"}, {"name": "Tabs"}, {"name": "Button"}, {"name": "PageGrid"}, {"name": "StationFooter"}, {"name": "Signup"}, {"name": "Photo"}, {"name": "VideoTestimonial"}, {"name": "Tracker"}]} */
/* M3 Ground Station helpers. Components are CSS classes (bundle.css); this
   script adds Lucide icons, the Ø lettering, and the SVG/canvas instruments.
   The globe needs d3-geo, topojson-client and the 110m land atlas, loaded
   from components/lib (globals d3, topojson, GS_LAND) or passed in opts.deps. */
(function () {
  var ICONS = {
"arrow-up-right": "<path d=\"M7 7h10v10\" /><path d=\"M7 17 17 7\" />",
"maximize-2": "<polyline points=\"15 3 21 3 21 9\" /><polyline points=\"9 21 3 21 3 15\" /><line x1=\"21\" x2=\"14\" y1=\"3\" y2=\"10\" /><line x1=\"3\" x2=\"10\" y1=\"21\" y2=\"14\" />",
"image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /><circle cx=\"9\" cy=\"9\" r=\"2\" /><path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />",
"zap": "<path d=\"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z\" />",
"radio": "<path d=\"M4.9 19.1C1 15.2 1 8.8 4.9 4.9\" /><path d=\"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5\" /><circle cx=\"12\" cy=\"12\" r=\"2\" /><path d=\"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5\" /><path d=\"M19.1 4.9C23 8.8 23 15.1 19.1 19\" />",
"satellite": "<path d=\"M13 7 9 3 5 7l4 4\" /><path d=\"m17 11 4 4-4 4-4-4\" /><path d=\"m8 12 4 4 6-6-4-4Z\" /><path d=\"m16 8 3-3\" /><path d=\"M9 21a6 6 0 0 0-6-6\" />",
"globe": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\" /><path d=\"M2 12h20\" />",
"activity": "<path d=\"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2\" />",
"cpu": "<rect width=\"16\" height=\"16\" x=\"4\" y=\"4\" rx=\"2\" /><rect width=\"6\" height=\"6\" x=\"9\" y=\"9\" rx=\"1\" /><path d=\"M15 2v2\" /><path d=\"M15 20v2\" /><path d=\"M2 15h2\" /><path d=\"M2 9h2\" /><path d=\"M20 15h2\" /><path d=\"M20 9h2\" /><path d=\"M9 2v2\" /><path d=\"M9 20v2\" />",
"shield": "<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\" />",
"lock": "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\" /><path d=\"M7 11V7a5 5 0 0 1 10 0v4\" />",
"key-round": "<path d=\"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z\" /><circle cx=\"16.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" />",
"scan-line": "<path d=\"M3 7V5a2 2 0 0 1 2-2h2\" /><path d=\"M17 3h2a2 2 0 0 1 2 2v2\" /><path d=\"M21 17v2a2 2 0 0 1-2 2h-2\" /><path d=\"M7 21H5a2 2 0 0 1-2-2v-2\" /><path d=\"M7 12h10\" />",
"terminal": "<polyline points=\"4 17 10 11 4 5\" /><line x1=\"12\" x2=\"20\" y1=\"19\" y2=\"19\" />",
"clock": "<circle cx=\"12\" cy=\"12\" r=\"10\" /><polyline points=\"12 6 12 12 16 14\" />",
"map-pin": "<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\" /><circle cx=\"12\" cy=\"10\" r=\"3\" />",
"users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" /><circle cx=\"9\" cy=\"7\" r=\"4\" /><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" /><path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
"file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\" /><path d=\"M14 2v4a2 2 0 0 0 2 2h4\" /><path d=\"M10 9H8\" /><path d=\"M16 13H8\" /><path d=\"M16 17H8\" />",
"flask-conical": "<path d=\"M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2\" /><path d=\"M6.453 15h11.094\" /><path d=\"M8.5 2h7\" />",
"rocket": "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\" /><path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\" /><path d=\"M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0\" /><path d=\"M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5\" />",
"hammer": "<path d=\"m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9\" /><path d=\"m18 15 4-4\" /><path d=\"m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5\" />",
"presentation": "<path d=\"M2 3h20\" /><path d=\"M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3\" /><path d=\"m7 21 5-5 5 5\" />",
"calendar": "<path d=\"M8 2v4\" /><path d=\"M16 2v4\" /><rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" /><path d=\"M3 10h18\" />",
"check": "<path d=\"M20 6 9 17l-5-5\" />",
"plus": "<path d=\"M5 12h14\" /><path d=\"M12 5v14\" />",
"x": "<path d=\"M18 6 6 18\" /><path d=\"m6 6 12 12\" />",
"chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
"arrow-right": "<path d=\"M5 12h14\" /><path d=\"m12 5 7 7-7 7\" />",
"mail": "<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" /><path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />",
"signal": "<path d=\"M2 20h.01\" /><path d=\"M7 20v-4\" /><path d=\"M12 20v-8\" /><path d=\"M17 20V8\" /><path d=\"M22 4v16\" />",
"radar": "<path d=\"M19.07 4.93A10 10 0 0 0 6.99 3.34\" /><path d=\"M4 6h.01\" /><path d=\"M2.29 9.62A10 10 0 1 0 21.31 8.35\" /><path d=\"M16.24 7.76A6 6 0 1 0 8.23 16.67\" /><path d=\"M12 18h.01\" /><path d=\"M17.99 11.66A6 6 0 0 1 15.77 16.67\" /><circle cx=\"12\" cy=\"12\" r=\"2\" /><path d=\"m13.41 10.59 5.66-5.66\" />",
"orbit": "<circle cx=\"12\" cy=\"12\" r=\"3\" /><circle cx=\"19\" cy=\"5\" r=\"2\" /><circle cx=\"5\" cy=\"19\" r=\"2\" /><path d=\"M10.4 21.9a10 10 0 0 0 9.941-15.416\" /><path d=\"M13.5 2.1a10 10 0 0 0-9.841 15.416\" />",
"gauge": "<path d=\"m12 14 4-4\" /><path d=\"M3.34 19a10 10 0 1 1 17.32 0\" />",
"battery-charging": "<path d=\"M15 7h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2\" /><path d=\"M6 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h1\" /><path d=\"m11 7-3 5h4l-3 5\" /><line x1=\"22\" x2=\"22\" y1=\"11\" y2=\"13\" />",
"wifi": "<path d=\"M12 20h.01\" /><path d=\"M2 8.82a15 15 0 0 1 20 0\" /><path d=\"M5 12.859a10 10 0 0 1 14 0\" /><path d=\"M8.5 16.429a5 5 0 0 1 7 0\" />",
"server": "<rect width=\"20\" height=\"8\" x=\"2\" y=\"2\" rx=\"2\" ry=\"2\" /><rect width=\"20\" height=\"8\" x=\"2\" y=\"14\" rx=\"2\" ry=\"2\" /><line x1=\"6\" x2=\"6.01\" y1=\"6\" y2=\"6\" /><line x1=\"6\" x2=\"6.01\" y1=\"18\" y2=\"18\" />",
"microscope": "<path d=\"M6 18h8\" /><path d=\"M3 22h18\" /><path d=\"M14 22a7 7 0 1 0 0-14h-1\" /><path d=\"M9 14h2\" /><path d=\"M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z\" /><path d=\"M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3\" />",
"building-2": "<path d=\"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z\" /><path d=\"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2\" /><path d=\"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2\" /><path d=\"M10 6h4\" /><path d=\"M10 10h4\" /><path d=\"M10 14h4\" /><path d=\"M10 18h4\" />",
"network": "<rect x=\"16\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\" /><rect x=\"2\" y=\"16\" width=\"6\" height=\"6\" rx=\"1\" /><rect x=\"9\" y=\"2\" width=\"6\" height=\"6\" rx=\"1\" /><path d=\"M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3\" /><path d=\"M12 12V8\" />",
"eye": "<path d=\"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
"fingerprint": "<path d=\"M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4\" /><path d=\"M14 13.12c0 2.38 0 6.38-1 8.88\" /><path d=\"M17.29 21.02c.12-.6.43-2.3.5-3.02\" /><path d=\"M2 12a10 10 0 0 1 18-6\" /><path d=\"M2 16h.01\" /><path d=\"M21.8 16c.2-2 .131-5.354 0-6\" /><path d=\"M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2\" /><path d=\"M8.65 22c.21-.66.45-1.32.57-2\" /><path d=\"M9 6.8a6 6 0 0 1 9 5.2v2\" />",
"scale": "<path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\" /><path d=\"M7 21h10\" /><path d=\"M12 3v18\" /><path d=\"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2\" />",
"square-check": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" /><path d=\"m9 12 2 2 4-4\" />",
"square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
"more-vertical": "<circle cx=\"12\" cy=\"12\" r=\"1\" /><circle cx=\"12\" cy=\"5\" r=\"1\" /><circle cx=\"12\" cy=\"19\" r=\"1\" />"
};
  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;
  var reduced = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };

  function icon(name, opts) {
    opts = opts || {};
    var body = ICONS[name];
    if (!body) return "";
    var size = opts.size || 14, sw = opts.strokeWidth || 1.25;
    return '<svg xmlns="' + NS + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";
  }

  /* Ø for O, as the reference sets its labels. Screen readers keep the word. */
  function zero(text) { return String(text).replace(/O/g, "Ø").replace(/o/g, "ø"); }

  function css(el, name) { return getComputedStyle(el).getPropertyValue(name).trim(); }

  function meter(el, o) {
    o = o || {};
    var n = o.segments || +el.getAttribute("data-segments") || 24;
    var v = o.value != null ? o.value : +(el.getAttribute("data-meter") || 0);
    var lit = Math.round((v / 100) * n);
    var html = "";
    for (var i = 0; i < n; i++) html += '<i class="' + (i < lit ? "on" : "") + '"></i>';
    el.innerHTML = html;
    el.setAttribute("role", "meter");
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "100");
    el.setAttribute("aria-valuenow", String(v));
  }

  function hydrate(root) {
    root = root || document;
    root.querySelectorAll("[data-icon]").forEach(function (el) {
      el.innerHTML = icon(el.getAttribute("data-icon"), { size: +(el.getAttribute("data-size") || 14) });
    });
    root.querySelectorAll("[data-zero]").forEach(function (el) {
      if (el.dataset.zeroDone) return;
      var t = el.textContent;
      el.setAttribute("aria-label", t);
      el.textContent = zero(t);
      el.dataset.zeroDone = "1";
    });
    root.querySelectorAll("[data-meter]").forEach(function (el) { meter(el); });
  }

  function svg(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* Catmull-Rom through the points, as cubic Béziers. */
  function smooth(pts) {
    if (pts.length < 2) return "";
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6) + "," + (p1[1] + (p2[1] - p0[1]) / 6) + " " +
        (p2[0] - (p3[0] - p1[0]) / 6) + "," + (p2[1] - (p3[1] - p1[1]) / 6) + " " + p2[0] + "," + p2[1];
    }
    return d;
  }

  /* Monotone cubic (Fritsch–Carlson): smooth, but never overshoots the data,
     so a flat stretch stays flat. Use it for anything measured. */
  function monotone(pts) {
    var n = pts.length;
    if (n < 3) return stepPath(pts).replace(/ H([^ ]+) V([^ ]+)/g, " L$1,$2");
    var dx = [], m = [], t = [];
    for (var i = 0; i < n - 1; i++) { dx[i] = pts[i + 1][0] - pts[i][0]; m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i]; }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
    for (i = 0; i < n - 1; i++) {
      if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
      var a = t[i] / m[i], b = t[i + 1] / m[i], h = a * a + b * b;
      if (h > 9) { var k = 3 / Math.sqrt(h); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
    }
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (i = 0; i < n - 1; i++) {
      var h3 = dx[i] / 3;
      d += " C" + (pts[i][0] + h3) + "," + (pts[i][1] + t[i] * h3) + " " + (pts[i + 1][0] - h3) + "," + (pts[i + 1][1] - t[i + 1] * h3) + " " + pts[i + 1][0] + "," + pts[i + 1][1];
    }
    return d;
  }

  /* Plot: a glowing line over the boxed cell grid. points are [x, y] in 0..1
     (y up). marks: [{x, label}] draw a dashed tick and a caption. */
  function plot(el, o) {
    var w = el.clientWidth || 600, h = el.clientHeight || 144, pad = o.pad == null ? 18 : o.pad;
    el.querySelectorAll("svg").forEach(function (s) { s.remove(); });
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, preserveAspectRatio: "none", "aria-hidden": "true" }, el);
    (o.marks || []).forEach(function (m) {
      var x = m.x * w;
      svg("line", { class: "tick", x1: x, x2: x, y1: 0, y2: h }, s);
      if (m.label) { var t = svg("text", { class: "ann", x: x + 6, y: 14 }, s); t.textContent = m.label; }
    });
    var pts = o.points.map(function (p) { return [p[0] * w, pad + (1 - p[1]) * (h - pad * 2)]; });
    var d = o.step ? stepPath(pts) : smooth(pts);
    svg("path", { class: "glow", d: d }, s);
    svg("path", { class: "line", d: d }, s);
    return s;
  }
  function stepPath(pts) {
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 1; i < pts.length; i++) d += " H" + pts[i][0] + " V" + pts[i][1];
    return d;
  }

  /* AreaChart: line over a mint-to-clear gradient, a vertical gridline per
     label and the last point marked. values in data units; max sets the top.
     The curve is monotone by default (true to the data); curve: "smooth"
     gives the looser Catmull-Rom shape for schematic series. */
  function area(el, o) {
    var w = el.clientWidth || 360, h = el.clientHeight || 220, axis = 30, top = 12;
    el.querySelectorAll("svg").forEach(function (s) { s.remove(); });
    var id = "gs-area-grad-" + (++uid);
    var s = svg("svg", { viewBox: "0 0 " + w + " " + h, "aria-hidden": "true" }, el);
    var defs = svg("defs", {}, s), g = svg("linearGradient", { id: id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svg("stop", { offset: "0", "stop-color": css(el, "--chart-fill-from") || "rgba(" + (css(el, "--accent-rgb") || "95,227,192") + ",.42)" }, g);
    svg("stop", { offset: "1", "stop-color": css(el, "--chart-fill-to") || "rgba(" + (css(el, "--accent-rgb") || "95,227,192") + ",0)" }, g);
    var vals = o.values, n = vals.length, max = o.max || Math.max.apply(null, vals);
    var ph = h - axis - top;
    var X = function (i) { return (i / (n - 1)) * w; };
    var Y = function (v) { return top + (1 - v / max) * ph; };
    // ticks: [{i, label}] pins a label to the i-th value; labels (one per
    // value, or spread evenly when the counts differ) is the short form.
    var ticks = o.ticks || (o.labels || []).map(function (lab, i, arr) {
      return { i: arr.length === n ? i : (i / Math.max(1, arr.length - 1)) * (n - 1), label: lab };
    });
    ticks.forEach(function (tk, i, arr) {
      var lab = tk.label;
      var x = Math.min(w - 0.5, Math.max(0.5, X(tk.i)));
      svg("line", { class: "vgrid", x1: x, x2: x, y1: top, y2: h - axis }, s);
      // End labels anchor inward so they never run past the chart edge.
      var anchor = x < 24 ? "start" : x > w - 24 ? "end" : "middle";
      var t = svg("text", { class: "axis", x: x, y: h - 10, "text-anchor": anchor }, s);
      t.textContent = lab;
    });
    svg("line", { class: "base", x1: 0, x2: w, y1: h - axis + 0.5, y2: h - axis + 0.5 }, s);
    var pts = vals.map(function (v, i) { return [X(i), Y(v)]; });
    var d = o.step ? stepPath(pts) : o.curve === "smooth" ? smooth(pts) : monotone(pts);
    svg("path", { d: d + " L" + w + "," + (h - axis) + " L0," + (h - axis) + " Z", fill: "url(#" + id + ")" }, s);
    svg("path", { class: "line", d: d }, s);
    var last = pts[pts.length - 1];
    svg("circle", { class: "tip", cx: last[0], cy: last[1], r: 4 }, s);
    return s;
  }

  /* Leader: an elbow from a point to a callout, diagonal then level. */
  function leader(x1, y1, x2, y2) {
    var mx = x2 - Math.sign(x2 - x1 || 1) * Math.min(Math.abs(x2 - x1) * 0.4, 120);
    return "M" + x1 + "," + y1 + " L" + mx + "," + y2 + " L" + x2 + "," + y2;
  }

  /* Globe: orthographic, 15° graticule, land, a dashed orbit and markers.
     markers: [{lon, lat, label, home}] · center: [lon, lat] · speed: deg/s · fps (30).
     onHover(marker|null, x, y) fires as the pointer finds a marker. */
  function globe(canvas, o) {
    o = o || {};
    var deps = o.deps || {};
    var d3 = deps.d3 || window.d3, topo = deps.topojson || window.topojson, landTopo = deps.land || window.GS_LAND;
    if (!d3 || !topo || !landTopo) return null;
    var land = topo.feature(landTopo, landTopo.objects.land);
    var gstep = o.step || 15;
    var grat = d3.geoGraticule().step([gstep, gstep])();
    var proj = d3.geoOrthographic().clipAngle(90).precision(0.4);
    // lock: [lon, lat] faces that point exactly; center keeps the old tilted view.
    var rot = o.lock ? [-o.lock[0], 0, 0] : [-(o.center ? o.center[0] : 0), -(o.center ? o.center[1] : 20) * 0.6, 0];
    var tilt = o.lock ? -o.lock[1] : o.center ? -o.center[1] * 0.6 : -12;
    // parallax: the pointer nudges the view by up to this many degrees.
    var par = { x: 0, y: 0, tx: 0, ty: 0 }, lit = {}, fast = {};
    var markers = o.markers || [];
    var speed = o.speed == null ? 3 : o.speed;
    var ctx, W, H, R, dpr, raf = 0, last = 0, visible = true, hover = null, sat = 0;
    var C = {};
    function colors() {
      ["--land", "--land-edge", "--graticule", "--accent-400", "--fg-tertiary", "--bg-panel", "--fg-primary"].forEach(function (k) { C[k] = css(canvas, k); });
    }
    function size() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) / 2 * (o.scale || 0.82);
      proj.translate([W / 2 + (o.offset ? o.offset[0] * W : 0), H / 2 + (o.offset ? o.offset[1] * H : 0)]).scale(R);
      // anchor: {lon, lat, x, y} moves the globe so that place sits at
      // (x, y) of the canvas, which lets a large globe live in a corner.
      if (o.anchor) {
        proj.rotate([rot[0], tilt, 0]).translate([0, 0]);
        var p0 = proj([o.anchor.lon, o.anchor.lat]);
        proj.translate([o.anchor.x * W - p0[0], o.anchor.y * H - p0[1]]);
      }
    }
    // A graticule cell under the pointer lights and fades, like the page grid.
    function cellAt(x, y) {
      var ll = proj.invert([x, y]);
      if (!ll || d3.geoDistance(ll, proj.invert(proj.translate())) > Math.PI / 2 - 0.01) return null;
      return Math.floor(ll[0] / gstep) + "," + Math.floor(ll[1] / gstep);
    }
    function drawCells() {
      var rgb = css(canvas, "--accent-rgb") || "95, 227, 192";
      for (var k in lit) {
        var g = lit[k], c = k.split(","), lo = +c[0] * gstep, la = +c[1] * gstep, pts = [], i, n = 8;
        for (i = 0; i <= n; i++) pts.push([lo + gstep * i / n, la]);
        for (i = 0; i <= n; i++) pts.push([lo + gstep, la + gstep * i / n]);
        for (i = 0; i <= n; i++) pts.push([lo + gstep * (1 - i / n), la + gstep]);
        for (i = 0; i <= n; i++) pts.push([lo, la + gstep * (1 - i / n)]);
        ctx.beginPath();
        pts.forEach(function (q, j) { var p = proj(q); if (j) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
        ctx.closePath();
        ctx.fillStyle = "rgba(" + rgb + "," + 0.12 * g + ")"; ctx.fill();
        ctx.strokeStyle = "rgba(" + rgb + "," + 0.7 * g + ")"; ctx.lineWidth = 1; ctx.stroke();
        // Burst cells fade fast so the sweep reads as a wave, not a stain.
        g *= fast[k] ? 0.8 : 0.93;
        if (g < 0.03) { delete lit[k]; delete fast[k]; } else lit[k] = g;
      }
    }
    function visibleAt(m) {
      var c = proj.invert([proj.translate()[0], proj.translate()[1]]);
      return d3.geoDistance([m.lon, m.lat], c) < Math.PI / 2 - 0.02;
    }
    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      proj.rotate([rot[0] + par.x, tilt + par.y, 0]);
      var path = d3.geoPath(proj, ctx);
      var t = proj.translate();
      ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = C["--bg-panel"] || "#111213"; ctx.fill();
      ctx.beginPath(); path(grat); ctx.strokeStyle = C["--graticule"]; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); path(land); ctx.fillStyle = C["--land"]; ctx.fill(); ctx.strokeStyle = C["--land-edge"]; ctx.lineWidth = 0.8; ctx.stroke();
      if (o.cells) drawCells();
      ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = C["--land-edge"]; ctx.lineWidth = 1; ctx.stroke();
      if (o.orbit !== false) {
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = C["--fg-tertiary"];
        ctx.beginPath();
        var orb = R * (o.orbitGap || 1.13);
        // Sampled rather than ctx.arc: a dashed arc whose centre sits far off
        // canvas gets clipped short.
        var a0 = o.orbitFull ? 0 : Math.PI * 1.02, a1 = o.orbitFull ? Math.PI * 2 : Math.PI * 1.98, steps = 360;
        for (var si = 0; si <= steps; si++) {
          var aa = a0 + (a1 - a0) * (si / steps), ox = t[0] + Math.cos(aa) * orb, oy = t[1] + Math.sin(aa) * orb;
          if (si) ctx.lineTo(ox, oy); else ctx.moveTo(ox, oy);
        }
        ctx.stroke();
        ctx.restore();
        var a = Math.PI * (1.12 + 0.76 * ((sat % 1 + 1) % 1));
        var sx = t[0] + Math.cos(a) * orb, sy = t[1] + Math.sin(a) * orb;
        glowDot(sx, sy, 5);
      }
      markers.forEach(function (m) {
        m._vis = visibleAt(m);
        if (!m._vis) return;
        var p = proj([m.lon, m.lat]); m._x = p[0]; m._y = p[1];
        if (m.home) {
          ctx.beginPath(); ctx.arc(p[0], p[1], 9, 0, Math.PI * 2); ctx.strokeStyle = C["--accent-400"]; ctx.lineWidth = 1; ctx.stroke();
          glowDot(p[0], p[1], 4);
        } else {
          glowDot(p[0], p[1], m === hover ? 4 : 2.6, m === hover ? 1 : 0.85);
        }
      });
    }
    function glowDot(x, y, r, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.shadowColor = C["--accent-400"]; ctx.shadowBlur = 12;
      ctx.fillStyle = C["--accent-400"];
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    var step = 1000 / (o.fps || 30); // the turn is slow; 30 fps reads the same and halves the cost
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (last && now - last < step - 1) return;
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now;
      rot[0] += speed * dt; sat += dt / 40;
      par.x += (par.tx - par.x) * 0.08; par.y += (par.ty - par.y) * 0.08;
      draw();
      // Standing still: stop once the parallax has settled and no cell glows.
      if (!speed && Math.abs(par.tx - par.x) < 0.01 && Math.abs(par.ty - par.y) < 0.01 && !Object.keys(lit).length) { cancelAnimationFrame(raf); raf = 0; }
    }
    function start() { cancelAnimationFrame(raf); raf = 0; last = 0; if (visible && speed && !reduced()) raf = requestAnimationFrame(frame); }
    function kick() { if (!raf && visible && !reduced()) { last = 0; raf = requestAnimationFrame(frame); } else if (reduced()) draw(); }
    colors(); size(); draw();
    new ResizeObserver(function () { size(); draw(); }).observe(canvas);
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else cancelAnimationFrame(raf); }).observe(canvas);
    canvas.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, best = null, bd = 14;
      markers.forEach(function (m) { if (!m._vis) return; var d = Math.hypot(m._x - x, m._y - y); if (d < bd) { bd = d; best = m; } });
      if (best !== hover) { hover = best; canvas.style.cursor = best ? "pointer" : ""; draw(); if (o.onHover) o.onHover(best, best && best._x, best && best._y); }
      if (o.parallax) { par.tx = (x / W - 0.5) * o.parallax; par.ty = (y / H - 0.5) * o.parallax * 0.5; }
      if (o.cells) { var k = cellAt(x, y); if (k) { lit[k] = 1; delete fast[k]; } }
      if (o.parallax || o.cells) kick();
    });
    // Click a cell: rings of cells light outward from it, one ring every
    // 70ms, each fading as the next goes up, out to `burst` cells away.
    if (o.cells) canvas.addEventListener("click", function (e) {
      var r = canvas.getBoundingClientRect(), k = cellAt(e.clientX - r.left, e.clientY - r.top);
      if (!k) return;
      var c = k.split(","), cx = +c[0], cy = +c[1], cols = Math.round(360 / gstep), rowsN = Math.round(180 / gstep);
      var lon0 = (cx + 0.5) * gstep, lat0 = (cy + 0.5) * gstep;
      // burst: a number of rings, or "all" (default) to sweep the whole globe.
      var maxDeg = o.burst && o.burst !== "all" ? o.burst * gstep : 180;
      var step = reduced() ? 0 : o.burstStep || 34, rings = [];
      for (var x = -cols / 2; x < cols / 2; x++) for (var y = -rowsN / 2; y < rowsN / 2; y++) {
        var deg = d3.geoDistance([lon0, lat0], [(x + 0.5) * gstep, (y + 0.5) * gstep]) * 180 / Math.PI;
        if (deg > maxDeg) continue;
        var ring = Math.round(deg / gstep);
        (rings[ring] = rings[ring] || []).push(x + "," + y);
      }
      var last = rings.length;
      rings.forEach(function (cellsInRing, ring) {
        setTimeout(function () {
          cellsInRing.forEach(function (key) { lit[key] = 1 - ring / (last + 8); fast[key] = 1; });
          kick();
        }, ring * step);
      });
    });
    canvas.addEventListener("pointerleave", function () {
      if (o.parallax) { par.tx = 0; par.ty = 0; kick(); }
      if (hover) { hover = null; draw(); if (o.onHover) o.onHover(null); }
    });
    start();
    return {
      redraw: function () { colors(); draw(); },
      pause: function () { speed = 0; cancelAnimationFrame(raf); },
      resume: function (v) { speed = v || o.speed || 3; start(); },
      point: function (m) { return m._vis ? [m._x, m._y] : null; }
    };
  }

  /* GridGlow: the page grid answers the pointer. A fixed canvas behind the
     panels lights the 48px cell under the cursor and lets it fade, like the
     floor tiles of the perspective grid, only fainter. Cells are counted in
     page coordinates so they stay locked to the grid as the page scrolls. */
  function gridGlow(canvas, o) {
    o = o || {};
    var pitch = o.pitch || parseFloat(css(canvas, "--grid-page")) || 48;
    var fill = o.fill == null ? 0.07 : o.fill, edge = o.edge == null ? 0.32 : o.edge;
    var rgb = css(canvas, "--grid-glow-rgb") || css(canvas, "--accent-rgb") || "95, 227, 192";
    var ctx, dpr, W, H, raf = 0, lit = {}, px = -1, py = -1, inside = false;
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mark() {
      if (!inside) return;
      var cx = Math.floor((px + scrollX) / pitch), cy = Math.floor((py + scrollY) / pitch);
      lit[cx + "," + cy] = 1;
    }
    function frame() {
      raf = 0;
      ctx.clearRect(0, 0, W, H);
      var any = false;
      for (var k in lit) {
        var g = lit[k], p = k.split(","), x = p[0] * pitch - scrollX + 0.5, y = p[1] * pitch - scrollY + 0.5;
        ctx.fillStyle = "rgba(" + rgb + "," + (fill * g) + ")";
        ctx.fillRect(x, y, pitch - 1, pitch - 1);
        ctx.strokeStyle = "rgba(" + rgb + "," + (edge * g) + ")";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, pitch - 1, pitch - 1);
        g *= 0.94;
        if (g < 0.03) delete lit[k]; else { lit[k] = g; any = true; }
      }
      if (any) raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    if (reduced()) return null;
    size();
    addEventListener("resize", function () { size(); kick(); });
    addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; inside = true; mark(); kick(); }, { passive: true });
    addEventListener("pointerleave", function () { inside = false; });
    document.addEventListener("pointerleave", function () { inside = false; });
    addEventListener("scroll", kick, { passive: true });
    return { clear: function () { lit = {}; kick(); } };
  }

  /* Signup: an email form. With data-endpoint it POSTs {email} as JSON;
     without one it says plainly that it is not connected yet, and stores
     nothing. */
  function signup(form) {
    var input = form.querySelector("input[type=email]"), msg = form.querySelector(".gs-signup-msg");
    var say = function (state, text) { form.dataset.state = state; if (msg) msg.textContent = text; };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!input.checkValidity()) { say("error", "Enter an email address, like name@example.com."); input.focus(); return; }
      var url = form.getAttribute("data-endpoint");
      if (!url) { say("idle", "Preview: this form is not connected yet, so nothing was saved."); return; }
      say("busy", "Sending…");
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: input.value }) })
        .then(function (r) { if (!r.ok) throw 0; say("done", "Saved. We will write when applications open."); form.reset(); })
        .catch(function () { say("error", "That did not go through. Try again, or email us instead."); });
    });
  }

  /* VideoTestimonial: swap the poster for the video on play. */
  function video(el) {
    var btn = el.querySelector(".gs-video-play"), frame = el.querySelector(".gs-video-frame");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var v = document.createElement("video");
      v.src = el.getAttribute("data-src"); v.controls = true; v.autoplay = true; v.playsInline = true;
      frame.appendChild(v); el.setAttribute("data-playing", ""); v.focus();
    });
  }

  /* Ticks an element with the time. opts.tz: an IANA zone (default UTC);
     opts.seconds: false drops the seconds; opts.suffix: text after it. */
  function clock(el, opts) {
    opts = opts || {};
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: opts.tz || "UTC", hour: "2-digit", minute: "2-digit", second: opts.seconds === false ? undefined : "2-digit", hourCycle: "h23" });
    var suffix = opts.suffix != null ? opts.suffix : (opts.tz ? "" : " UTC");
    var tick = function () { el.textContent = fmt.format(new Date()) + suffix; };
    tick();
    return setInterval(tick, 1000);
  }

  window.GS = { icons: ICONS, icon: icon, zero: zero, hydrate: hydrate, meter: meter, plot: plot, area: area, leader: leader, globe: globe, gridGlow: gridGlow, signup: signup, video: video, clock: clock };
})();

/* parts:begin */
/* ── part: bento-layouts.js ── */
/* Bento layouts: small helpers the bento compositions share. Extends GS. */
(function () {
  var GS = (window.GS = window.GS || {});

  /* Picker: buttons [data-bl-pick="key"] inside root fill the detail slots
     [data-bl-slot="name"] from <template data-bl-for="key"> children with
     matching [data-bl-slot]. Arrow keys move between buttons. */
  GS.blPicker = function (root) {
    var picks = [].slice.call(root.querySelectorAll("[data-bl-pick]"));
    function show(i, focus) {
      picks.forEach(function (b, k) { b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1; });
      var tpl = root.querySelector('template[data-bl-for="' + picks[i].getAttribute("data-bl-pick") + '"]');
      if (tpl) tpl.content.querySelectorAll("[data-bl-slot]").forEach(function (src) {
        var dst = root.querySelector('[data-bl-slot="' + src.getAttribute("data-bl-slot") + '"]');
        if (dst) dst.innerHTML = src.innerHTML;
      });
      if (GS.hydrate) GS.hydrate(root);
      if (focus) picks[i].focus();
    }
    picks.forEach(function (b, i) {
      b.setAttribute("role", "tab");
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (d) { e.preventDefault(); show((i + d + picks.length) % picks.length, true); }
      });
    });
    var start = picks.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; });
    if (picks.length) show(start < 0 ? 0 : start);
  };

  /* Countdown to an ISO date: fills [data-bl-days] and [data-bl-hms] under
     el, and lights a meter of the time already elapsed since `from`. */
  GS.blCountdown = function (el, o) {
    var to = new Date(o.to).getTime(), from = o.from ? new Date(o.from).getTime() : null;
    var days = el.querySelector("[data-bl-days]"), hms = el.querySelector("[data-bl-hms]"), meter = el.querySelector("[data-bl-elapsed]");
    var p2 = function (n) { return String(n).padStart(2, "0"); };
    function tick() {
      var ms = Math.max(0, to - Date.now()), s = Math.floor(ms / 1000);
      if (days) days.textContent = String(Math.floor(s / 86400));
      if (hms) hms.textContent = p2(Math.floor(s / 3600) % 24) + ":" + p2(Math.floor(s / 60) % 60) + ":" + p2(s % 60);
      if (meter && from && GS.meter) GS.meter(meter, { value: Math.min(100, Math.max(0, ((Date.now() - from) / (to - from)) * 100)) });
    }
    tick();
    return setInterval(tick, 1000);
  };

  /* Redraw an instrument whenever its box changes size. */
  GS.blKeep = function (el, draw) {
    draw();
    if (window.ResizeObserver) new ResizeObserver(function () { draw(); }).observe(el);
  };
})();

/* ── part: forms.js ── */
/* M3 Ground Station — forms and data parts. Extends window.GS with
   message, form, stackedBar, delta, countdown, table, accordion, slideDots.
   Plain ES5-style so it can sit next to bundle.js unchanged. */
(function () {
  window.GS = window.GS || {};
  var GS = window.GS;
  var zero = GS.zero || function (t) { return String(t).replace(/O/g, "Ø").replace(/o/g, "ø"); };
  var icon = function (n, o) { return GS.icon ? GS.icon(n, o) : ""; };
  var uid = 0;
  var id = function (p) { return "gs-" + p + "-" + (++uid); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  /* Ø-lettered text that screen readers still read as the word. */
  var zspan = function (t) { return '<span aria-hidden="true">' + esc(zero(t)) + '</span><span class="gs-sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap">' + esc(t) + "</span>"; };

  /* InlineMessage: set the state and text of a .gs-msg line.
     state: "neutral" | "done" | "error" | "warn" | "sending". */
  function message(el, state, text) {
    if (!el) return;
    if (!el.hasAttribute("aria-live")) el.setAttribute("aria-live", "polite");
    if (!el.hasAttribute("role")) el.setAttribute("role", "status");
    el.dataset.state = state || "neutral";
    if (text != null) el.textContent = text;
  }

  /* ───────── Form: validate, then POST JSON or say it is not connected ───────── */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function fieldOf(input) { return input.closest(".gs-field, .gs-chips"); }
  function helpOf(input) {
    var f = fieldOf(input);
    var m = f && f.querySelector(".gs-field-msg");
    if (m && m.dataset.help == null) m.dataset.help = m.textContent;
    return m;
  }
  function mark(input, text) {
    var f = fieldOf(input), m = helpOf(input);
    input.setAttribute("aria-invalid", text ? "true" : "false");
    if (f) f.classList.toggle("is-bad", !!text);
    if (m) m.textContent = text || m.dataset.help || "";
  }
  function check(input) {
    var v = (input.value || "").trim(), t = input.type, label = input.getAttribute("data-label") || "this field";
    if (input.disabled) return "";
    if (input.required && !v) return t === "email" ? "Add your email so we can write to you." : "Add " + label + ".";
    if (!v) return "";
    if (t === "email" && !EMAIL.test(v)) return "That email looks incomplete, like name@example.com.";
    if (t === "url" && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v)) return "Use a full link starting with https://";
    if (t === "number") {
      var n = Number(v), min = input.min !== "" ? Number(input.min) : -Infinity, max = input.max !== "" ? Number(input.max) : Infinity;
      if (Number.isNaN(n) || n < min || n > max) return "Use a number from " + input.min + " to " + input.max + ".";
    }
    return "";
  }
  function serialize(form) {
    var fd = new FormData(form), out = {};
    fd.forEach(function (v, k) {
      var many = form.querySelectorAll('[name="' + k + '"][type="checkbox"]').length > 0;
      if (many) (out[k] = out[k] || []).push(v);
      else out[k] = typeof v === "string" ? v.trim() : v;
    });
    form.querySelectorAll('input[type="checkbox"][name]').forEach(function (c) { if (!out[c.name]) out[c.name] = []; });
    return out;
  }
  function form(el, opts) {
    opts = opts || {};
    el.setAttribute("novalidate", "");
    var msg = el.querySelector("[data-msg], .gs-msg");
    var inputs = function () { return Array.prototype.slice.call(el.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select, textarea")); };
    inputs().forEach(function (i) {
      helpOf(i);
      i.addEventListener("input", function () { if (i.getAttribute("aria-invalid") === "true" && !check(i)) mark(i, ""); });
      i.addEventListener("blur", function () { if (i.value) mark(i, check(i)); });
    });
    function validate() {
      var bad = [];
      inputs().forEach(function (i) { var e = check(i); mark(i, e); if (e) bad.push(i); });
      return bad;
    }
    var api = {
      state: "idle",
      validate: function () { return validate().length === 0; },
      data: function () { return serialize(el); },
      endpoint: function () { return opts.endpoint !== undefined ? opts.endpoint : el.getAttribute("data-endpoint"); }
    };
    function set(state, text) { api.state = state; el.dataset.state = state; message(msg, state === "idle" ? "neutral" : state, text); }
    el.addEventListener("submit", function (e) {
      e.preventDefault();
      if (api.state === "sending") return;
      var bad = validate();
      if (bad.length) {
        set("error", bad.length === 1 ? (check(bad[0]) || "Check the marked field.") : "Check the " + bad.length + " marked fields.");
        bad[0].focus();
        return;
      }
      var data = serialize(el);
      data.source = location.href; data.at = new Date().toISOString();
      if (opts.extra) for (var k in opts.extra) data[k] = opts.extra[k];
      var url = api.endpoint();
      if (!url) {
        set("neutral", opts.offlineText || "Everything checks out, but this form is not connected yet, so nothing was sent.");
        if (opts.onResult) opts.onResult("offline", data);
        return;
      }
      set("sending", opts.sendingText || "Sending…");
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (r) {
          if (!r.ok) throw new Error(String(r.status));
          var first = String(data.name || "").split(" ")[0];
          el.reset();
          set("done", typeof opts.doneText === "function" ? opts.doneText(data) : opts.doneText || (first ? "Thanks, " + first + ". We'll write when applications open." : "Saved. We'll write when applications open."));
          if (opts.onResult) opts.onResult("done", data);
        })
        .catch(function () {
          set("error", opts.errorText || "That didn't go through. Try again, or email fernando@m3fellowship.com.");
          if (opts.onResult) opts.onResult("error", data);
        });
    });
    return api;
  }

  /* ───────── StackedBar ───────── */
  function stackedBar(el, o) {
    o = o || {};
    var items = o.items || [], total = o.total || items.reduce(function (s, x) { return s + x.n; }, 0);
    var tone = function (x, i) { return "t" + (x.tone || Math.min(i + 1, 5)); };
    var head = o.label ? '<div class="gs-sbar-head"><span>' + zspan(o.label) + "</span><span>" + esc(o.note || "n = " + total) + "</span></div>" : "";
    var summary = (o.label ? o.label + ": " : "") + items.map(function (x) { return x.label + " " + x.n; }).join(", ") + ", of " + total + ".";
    el.classList.add("gs-sbar");
    el.innerHTML = head +
      '<div class="gs-sbar-track" role="img" aria-label="' + esc(summary) + '">' + items.map(function (x, i) { return '<i class="' + tone(x, i) + '" style="flex:' + x.n + '"></i>'; }).join("") + "</div>" +
      '<ul class="gs-sbar-legend">' + items.map(function (x, i) { return '<li><i class="' + tone(x, i) + '"></i><span>' + esc(x.label) + "</span><b>" + x.n + (o.showTotal ? "<small>/" + total + "</small>" : "") + "</b></li>"; }).join("") + "</ul>";
    return el;
  }

  /* ───────── Delta: before → after ───────── */
  function delta(el, o) {
    var max = o.max || 1, dec = o.decimals == null ? 2 : o.decimals;
    var f = function (v) { return Number(v).toFixed(dec); };
    var d = o.after - o.before, sign = d > 0 ? "+" : d < 0 ? "−" : "±";
    var chg = sign + f(Math.abs(d));
    var labels = o.labels || ["Before", "After"];
    var aria = (o.label ? o.label + ": " : "") + f(o.before) + " to " + f(o.after) + " out of " + max + ", " + (d >= 0 ? "up " : "down ") + f(Math.abs(d)) + ".";
    if (o.inline || el.classList.contains("gs-delta-inline")) {
      el.classList.add("gs-delta-inline");
      el.setAttribute("aria-label", aria); el.setAttribute("role", "img");
      el.innerHTML = '<span class="from">' + f(o.before) + '</span><span class="arrow" aria-hidden="true">→</span><span class="to">' + f(o.after) + "<small>/" + max + '</small></span><span class="chg' + (d < 0 ? " down" : "") + '">' + chg + "</span>";
      return el;
    }
    el.classList.add("gs-delta");
    var bar = function (cls, lab, v) {
      return '<div class="gs-delta-row ' + cls + '"><span>' + zspan(lab) + '</span><span class="gs-track"><span class="gs-fill" style="--v:' + (v / max * 100).toFixed(2) + '"></span></span><span>' + f(v) + "</span></div>";
    };
    el.innerHTML =
      '<div class="gs-delta-figs" role="img" aria-label="' + esc(aria) + '">' +
      '<div class="gs-delta-fig before" aria-hidden="true"><span class="gs-micro">' + esc(zero(labels[0])) + "</span><b>" + f(o.before) + "</b></div>" +
      '<span class="gs-delta-arrow" aria-hidden="true">' + icon("arrow-right", { size: 18 }) + "</span>" +
      '<div class="gs-delta-fig after" aria-hidden="true"><span class="gs-micro">' + esc(zero(labels[1])) + "</span><b>" + f(o.after) + "<small>/" + max + "</small></b></div>" +
      '<span class="gs-pill gs-delta-change' + (d < 0 ? " err" : "") + '" aria-hidden="true">' + chg + "</span></div>" +
      '<div class="gs-delta-bars" aria-hidden="true">' + bar("before", labels[0], o.before) + bar("after", labels[1], o.after) +
      '<div class="gs-scale" style="margin-left:66px;margin-right:50px"><span>0</span><span>' + max + "</span></div></div>";
    return el;
  }

  /* ───────── Countdown: days to a deadline over a draining meter ───────── */
  function noon(d) {
    if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(d + "T12:00:00");
    var x = new Date(d == null ? Date.now() : d); x.setHours(12, 0, 0, 0); return x;
  }
  function countdown(el, o) {
    o = o || {};
    var fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
    var api = {};
    function render(now) {
      var dl = noon(o.deadline), days = Math.round((dl - noon(now)) / 864e5);
      var total = Math.max(1, Number(o.windowDays) || 30);
      var closed = days < 0 || Number.isNaN(days), last = days === 0;
      var state = closed ? "closed" : last ? "last" : "open";
      var segs = o.segments || Math.min(total, 30);
      // As social.ts: lit share = days left / window. The last day keeps one segment, in warn.
      var lit = closed ? 0 : last ? 1 : Math.max(0, Math.round((Math.min(days, total) / total) * segs));
      var big = closed ? "Closed" : last ? "Last day" : String(days);
      var unit = closed ? (o.closedText || "Deadline passed") : last ? (o.lastText || "Final day · apply today") : (days === 1 ? "day" : "days") + " " + (o.unitText || "to deadline");
      var html = "";
      for (var i = 0; i < segs; i++) html += '<i class="' + (i < lit ? "on" : "") + '"></i>';
      el.classList.add("gs-countdown");
      el.dataset.state = state;
      el.innerHTML =
        '<div class="gs-countdown-fig"><b>' + esc(zero(big)) + "</b><span>" + esc(zero(unit)) + "</span></div>" +
        '<div class="gs-meter" role="meter" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + (closed ? 0 : Math.min(days, total)) +
        '" aria-valuetext="' + esc(closed ? "Closed" : last ? "Last day" : days + " of " + total + " days left") + '" aria-label="' + esc(o.label || "Days left in the window") + '">' + html + "</div>" +
        '<div class="gs-countdown-keys"><span>' + zspan(o.startText || "Open") + "</span><span>" + zspan("Deadline · " + fmt.format(dl)) + "</span></div>";
      el.setAttribute("aria-label", closed ? "Applications closed" : last ? "Last day to apply" : days + (days === 1 ? " day" : " days") + " until the deadline, " + fmt.format(dl));
      api.days = days; api.state = state;
      return api;
    }
    api.update = render;
    render(o.now);
    // live: re-check every hour so the page turns over at midnight on its own
    if (o.live) api.timer = setInterval(function () { render(); }, 36e5);
    return api;
  }

  /* ───────── DataTable: sortable headers ───────── */
  function cellValue(td) {
    var raw = td.getAttribute("data-v");
    if (raw == null) raw = td.textContent.trim();
    var n = Number(String(raw).replace(/[,%$\s]/g, "").replace("−", "-"));
    return raw !== "" && !Number.isNaN(n) ? n : String(raw).toLowerCase();
  }
  function table(tbl) {
    var body = tbl.tBodies[0];
    Array.prototype.forEach.call(body.rows, function (r, i) { r.dataset.i = i; });
    var ths = Array.prototype.slice.call(tbl.tHead.rows[0].cells);
    function sort(col, dir) {
      var rows = Array.prototype.slice.call(body.rows);
      rows.sort(function (a, b) {
        var x = cellValue(a.cells[col]), y = cellValue(b.cells[col]);
        var c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return (dir === "descending" ? -c : c) || a.dataset.i - b.dataset.i;
      });
      rows.forEach(function (r) { body.appendChild(r); });
      ths.forEach(function (th, i) { if (i === col) th.setAttribute("aria-sort", dir); else if (th.hasAttribute("aria-sort")) th.setAttribute("aria-sort", "none"); });
    }
    ths.forEach(function (th, i) {
      var b = th.querySelector(".gs-sort");
      if (!b) return;
      if (!th.hasAttribute("aria-sort")) th.setAttribute("aria-sort", "none");
      b.addEventListener("click", function () {
        var cur = th.getAttribute("aria-sort");
        var first = th.getAttribute("data-first") || (th.classList.contains("num") ? "descending" : "ascending");
        sort(i, cur === "none" ? first : cur === "ascending" ? "descending" : "ascending");
      });
    });
    var wrap = tbl.closest(".gs-table-wrap");
    // a scrolling region needs to be reachable by keyboard
    if (wrap && !wrap.hasAttribute("tabindex")) {
      var fits = function () { var over = wrap.scrollWidth > wrap.clientWidth + 1 || wrap.scrollHeight > wrap.clientHeight + 1; if (over) wrap.setAttribute("tabindex", "0"); else wrap.removeAttribute("tabindex"); };
      fits();
      if (window.ResizeObserver) new ResizeObserver(fits).observe(wrap);
    }
    return { sort: sort };
  }

  /* ───────── Accordion ───────── */
  function accordion(el, o) {
    o = o || {};
    var btns = Array.prototype.slice.call(el.querySelectorAll(".gs-acc-btn"));
    function set(b, open) {
      var p = document.getElementById(b.getAttribute("aria-controls"));
      b.setAttribute("aria-expanded", String(open));
      if (p) p.hidden = !open;
    }
    btns.forEach(function (b, i) {
      var p = b.closest(".gs-acc-item").querySelector(".gs-acc-panel");
      if (p) {
        if (!p.id) p.id = id("acc");
        if (!b.id) b.id = p.id + "-btn";
        b.setAttribute("aria-controls", p.id);
        p.setAttribute("role", "region");
        p.setAttribute("aria-labelledby", b.id);
      }
      set(b, b.getAttribute("aria-expanded") === "true");
      b.addEventListener("click", function () {
        var open = b.getAttribute("aria-expanded") !== "true";
        if (open && o.single) btns.forEach(function (x) { if (x !== b) set(x, false); });
        set(b, open);
        if (o.onToggle) o.onToggle(i, open);
      });
      b.addEventListener("keydown", function (e) {
        var k = e.key, j = k === "ArrowDown" ? i + 1 : k === "ArrowUp" ? i - 1 : k === "Home" ? 0 : k === "End" ? btns.length - 1 : null;
        if (j == null) return;
        e.preventDefault();
        btns[(j + btns.length) % btns.length].focus();
      });
    });
    return { open: function (i) { set(btns[i], true); }, close: function (i) { set(btns[i], false); }, closeAll: function () { btns.forEach(function (b) { set(b, false); }); } };
  }

  /* ───────── SlideDots ───────── */
  function slideDots(el, o) {
    o = o || {};
    var n = o.count || 1, cur = Math.max(0, Math.min(n - 1, o.index || 0));
    var label = o.label || "Slide";
    el.classList.add("gs-sdots");
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", o.ariaLabel || "Slides");
    var html = '<div class="gs-sdots-track" style="--n:' + n + '">';
    for (var i = 0; i < n; i++) html += '<button type="button" aria-label="' + esc(label + " " + (i + 1) + " of " + n) + '"></button>';
    html += '</div><span class="gs-sdots-count" aria-hidden="true"></span>';
    if (o.swipe !== false) html += '<button type="button" class="gs-sdots-swipe"></button>';
    el.innerHTML = html;
    var dots = Array.prototype.slice.call(el.querySelectorAll(".gs-sdots-track button"));
    var count = el.querySelector(".gs-sdots-count"), swipe = el.querySelector(".gs-sdots-swipe");
    function go(i, focus) {
      cur = (i + n) % n;
      dots.forEach(function (d, k) {
        d.classList.toggle("past", k < cur);
        if (k === cur) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current");
        d.tabIndex = k === cur ? 0 : -1;
      });
      count.innerHTML = "<b>" + pad(cur + 1) + "</b> / " + pad(n);
      if (swipe) {
        var last = cur === n - 1, t = last ? (o.lastText || "Back to start ←") : (o.swipeText || "Swipe →");
        swipe.textContent = zero(t);
        swipe.setAttribute("aria-label", last ? "Back to the first slide" : "Next slide");
      }
      if (focus) dots[cur].focus();
      if (o.onChange) o.onChange(cur);
    }
    dots.forEach(function (d, k) {
      d.addEventListener("click", function () { go(k); });
      d.addEventListener("keydown", function (e) {
        var j = e.key === "ArrowRight" ? cur + 1 : e.key === "ArrowLeft" ? cur - 1 : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : null;
        if (j == null) return;
        e.preventDefault(); go(Math.max(0, Math.min(n - 1, j)), true);
      });
    });
    if (swipe) swipe.addEventListener("click", function () { go(cur === n - 1 ? 0 : cur + 1); });
    // swipeTarget: horizontal drags on this element move a slide
    if (o.swipeTarget) {
      var x0 = null;
      o.swipeTarget.addEventListener("pointerdown", function (e) { x0 = e.clientX; });
      o.swipeTarget.addEventListener("pointerup", function (e) {
        if (x0 == null) return;
        var dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) go(Math.max(0, Math.min(n - 1, cur + (dx < 0 ? 1 : -1))));
      });
    }
    go(cur);
    return { go: go, next: function () { go(Math.min(n - 1, cur + 1)); }, prev: function () { go(Math.max(0, cur - 1)); }, get index() { return cur; } };
  }

  GS.message = message;
  GS.form = form;
  GS.stackedBar = stackedBar;
  GS.delta = delta;
  GS.countdown = countdown;
  GS.table = table;
  GS.accordion = accordion;
  GS.slideDots = slideDots;
})();

/* ── part: media.js ── */
/* M3 Ground Station · media: the lens carousel, the testimonial player, the
   scroll timeline and its photo gallery, the tile burst and CRT scan reveals,
   and the motion-kit graphics (name badge, subtitles, chapter and end cards).
   Ported from the m3-website repo (scripts/bulge.ts, console/Testimonials,
   console/ProgramScroll, scripts/motion.ts). Plain JS, no dependencies.
   Every animation stops under prefers-reduced-motion and shows its resting
   frame instead. */
(function () {
  window.GS = window.GS || {};
  var GS = window.GS;

  // ── helpers ────────────────────────────────────────────────────────────
  var reduced = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };
  var clamp = function (x, a, b) { a = a == null ? 0 : a; b = b == null ? 1 : b; return Math.min(b, Math.max(a, x)); };
  var seg = function (t, a, b) { return clamp((t - a) / (b - a)); };
  var eo = function (x) { return 1 - Math.pow(1 - x, 3); };
  var eio = function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var zero = function (s) { return GS.zero ? GS.zero(String(s)) : String(s).replace(/O/g, "Ø").replace(/o/g, "ø"); };
  var cssv = function (el, n, d) { var v = getComputedStyle(el).getPropertyValue(n).trim(); return v || d; };
  var rgbOf = function (el) { return cssv(el, "--accent-rgb", "95, 227, 192"); };
  var pad2 = function (n) { return String(n).padStart(2, "0"); };
  var uid = 0;
  var hexRgb = function (h, d) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim());
    if (!m) return d;
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  var icon = function (n, o) { return GS.icon ? GS.icon(n, o) : ""; };
  var onScreen = function (el) { var r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };

  /* A canvas over el, at device pixels; returns {c, ctx, w, h} in CSS pixels. */
  function overlay(el, cls) {
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    var c = document.createElement("canvas");
    c.className = cls;
    c.setAttribute("aria-hidden", "true");
    el.appendChild(c);
    var w = el.clientWidth, h = el.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    c.width = Math.max(1, Math.round(w * dpr)); c.height = Math.max(1, Math.round(h * dpr));
    var ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    return { c: c, ctx: ctx, w: w, h: h };
  }

  /* Plays draw(t) for t in seconds. Loops pause off screen. Under reduced
     motion it draws o.rest (default: the end) once and stops. */
  function runner(el, draw, o) {
    var raf = 0, t0 = 0, t = 0, vis = true, running = false, until = o.dur;
    var frame = function (now) {
      raf = 0;
      if (!t0) t0 = now - t * 1000;
      t = (now - t0) / 1000;
      if (t >= until) {
        if (o.loop && until >= o.dur) { t0 = now; t = 0; }
        else { t = until; draw(t); running = false; if (o.onDone) o.onDone(); return; }
      }
      draw(Math.min(t, o.dur));
      if (vis) raf = requestAnimationFrame(frame);
    };
    var stop = function () { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; };
    var api = {
      dur: o.dur,
      /** Play from `from` (s) to `to` (s, default the end; a loop ignores it). */
      play: function (from, to) {
        stop();
        if (reduced()) { t = o.rest != null ? o.rest : o.dur; draw(t); return api; }
        t = from || 0; t0 = 0; until = to != null ? to : o.dur + (o.loop ? o.gap || 0 : 0);
        running = true;
        if (vis) raf = requestAnimationFrame(frame);
        return api;
      },
      seek: function (x) { stop(); t = x; draw(clamp(x, 0, o.dur)); return api; },
      stop: stop,
      get time() { return t; },
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis && running && !raf) { t0 = 0; raf = requestAnimationFrame(frame); }
      if (!vis && raf) { cancelAnimationFrame(raf); raf = 0; }
    }).observe(el);
    return api;
  }

  /* Perspective plane (floor dir 1, ceiling -1), lines drifting toward the viewer. */
  function plane(ctx, rgb, w, h, o) {
    var dir = o.dir, cy = o.cy, g = o.gap, sp = w / o.cols, cx = w / 2, a = o.alpha == null ? 1 : o.alpha;
    var start = cy + dir * g, limit = dir === 1 ? (o.bottom == null ? h : o.bottom) : 0;
    var edge = dir === 1 ? limit + h * 0.6 : -h * 0.6, K = g * 4.5;
    var grad = ctx.createLinearGradient(0, start, 0, limit);
    grad.addColorStop(0, "rgba(" + rgb + ",0)");
    grad.addColorStop(0.18, "rgba(" + rgb + "," + 0.16 * a + ")");
    grad.addColorStop(1, "rgba(" + rgb + "," + 0.62 * a + ")");
    ctx.save();
    ctx.beginPath(); ctx.rect(0, Math.min(start, limit), w, Math.abs(limit - start)); ctx.clip();
    ctx.strokeStyle = grad; ctx.lineWidth = Math.max(0.8, h / 900);
    ctx.beginPath();
    var span = Math.ceil((cx * 1.6 + 48) / sp) + 1;
    for (var j = -span; j < span; j++) {
      ctx.moveTo(cx + (j + 0.5) * sp, start);
      ctx.lineTo(cx + (j + 0.5) * sp * ((edge - cy) / (start - cy)), edge);
    }
    for (var i = 0; i < 40; i++) {
      var zz = 4.5 - (i + (o.phase % 1));
      if (zz <= 0.05) break;
      var y = cy + dir * (K / zz);
      if ((dir === 1 && y > limit + 2) || (dir === -1 && y < -2)) break;
      ctx.moveTo(-w * 0.2, y); ctx.lineTo(w * 1.2, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* A background canvas that keeps its size in step with el. */
  function bgCanvas(el) {
    var c = document.createElement("canvas");
    c.setAttribute("aria-hidden", "true");
    el.insertBefore(c, el.firstChild);
    var s = { c: c, ctx: c.getContext("2d"), w: 0, h: 0 };
    var fit = function () {
      var dpr = Math.min(2, devicePixelRatio || 1);
      s.w = el.clientWidth; s.h = el.clientHeight;
      c.width = Math.max(1, Math.round(s.w * dpr)); c.height = Math.max(1, Math.round(s.h * dpr));
      s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (s.redraw) s.redraw();
    };
    fit();
    if ("ResizeObserver" in window) new ResizeObserver(fit).observe(el);
    return s;
  }

  // ── LensCarousel ───────────────────────────────────────────────────────
  var VERT = "attribute vec2 a; varying vec2 v; void main(){ v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }";
  var FRAG = [
    "precision highp float;",
    "varying vec2 v; uniform sampler2D t; uniform float aspect, zoom, falloff, shade, blur; uniform vec3 bg;",
    "vec3 smear(vec2 uv){ if (blur < 1e-4) return texture2D(t, uv).rgb; vec3 acc = vec3(0.0);",
    "  for (int i = 0; i < 7; i++) { float f = float(i) / 6.0 - 0.5; acc += texture2D(t, uv + vec2(f * blur, 0.0)).rgb; } return acc / 7.0; }",
    "void main(){ vec2 uv = vec2(v.x, 1.0 - v.y); vec2 c = vec2(0.5); vec2 p = (uv - c) * vec2(aspect, 1.0);",
    "  float r = length(p) / (0.5 * aspect); float m = mix(zoom, 1.0, pow(min(r, 1.6), falloff));",
    "  vec2 q = c + (p * m) / vec2(aspect, 1.0);",
    "  vec3 col = (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) ? bg : smear(q);",
    "  col = mix(col, bg, shade * smoothstep(0.25, 1.05, r)); gl_FragColor = vec4(col, 1.0); }",
  ].join("\n");

  /* Cards seen through a lens: drawn into a 2D scene, magnified at the centre
     by a WebGL pass that falls off toward the rim. Infinite; drag, wheel,
     arrows or a click on a side card move it; it always settles on a card.
     The centred card's muted loop (card.src) plays only while on screen. */
  GS.bulge = function (host, cards, o) {
    o = o || {};
    if (!cards || !cards.length) return null;
    var bg = o.bg || cssv(host, "--bg-panel", "#111213");
    var accent = o.accent || cssv(host, "--accent-400", "#5fe3c0");
    var rgb = rgbOf(host);
    var strength = o.strength != null ? o.strength : 0.5;
    var falloff = o.falloff != null ? o.falloff : 1.6;
    var cardSize = o.cardSize != null ? o.cardSize : 0.82;
    var gapK = o.gap != null ? o.gap : 0.06;
    var shade = o.shade != null ? o.shade : 0.55;
    var ratio = o.ratio != null ? o.ratio : 9 / 16;
    var serif = cssv(host, "--font-serif", "Georgia, serif"), mono = cssv(host, "--font-mono", "monospace");
    var still = reduced();

    host.classList.add("gs-bulge");
    if (!host.hasAttribute("tabindex")) host.tabIndex = 0;
    host.setAttribute("role", "slider");
    host.setAttribute("aria-valuemin", "1");
    host.setAttribute("aria-valuemax", String(cards.length));
    if (!host.hasAttribute("aria-label")) host.setAttribute("aria-label", "Testimonials. Arrow keys move, Enter opens the centred one.");

    var view = document.createElement("canvas");
    view.className = "gs-bulge-view";
    view.setAttribute("aria-hidden", "true");
    host.appendChild(view);
    var gl = view.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    var scene = gl ? document.createElement("canvas") : view; // no WebGL: draw flat, no lens
    var sx = scene.getContext("2d");
    var U = function () { return null; };
    if (gl) {
      var sh = function (type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      var prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR); });
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(function (k) { gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); });
      U = function (n) { return gl.getUniformLocation(prog, n); };
      gl.uniform1f(U("zoom"), 1 - strength);
      gl.uniform1f(U("falloff"), falloff);
      gl.uniform1f(U("shade"), shade);
      gl.uniform3fv(U("bg"), hexRgb(bg, [0.067, 0.071, 0.075]));
    }
    var lens = gl ? strength : 0;

    // media: posters load with the page; a card's loop loads only when centred and on screen
    var posters = cards.map(function (c) {
      if (!c.poster) return null;
      if (typeof c.poster !== "string") return c.poster; // a canvas or image element
      var im = new Image(); im.onload = function () { dirty = true; kick(); }; im.src = c.poster; return im;
    });
    var videos = cards.map(function (c) {
      if (!c.src) return null;
      var vd = document.createElement("video");
      vd.muted = true; vd.loop = true; vd.playsInline = true; vd.preload = "none"; vd.crossOrigin = "anonymous";
      vd.dataset.src = c.src;
      return vd;
    });
    var mediaOf = function (i) {
      var v = videos[i];
      if (v && v.readyState >= 2) return v;
      var p = posters[i];
      if (!p) return null;
      if (p.tagName === "IMG") return p.complete && p.naturalWidth ? p : null;
      return p.width ? p : null;
    };
    var playing = null, inView = false;
    var W = 0, H = 0, dpr = 1, scale = 1, pos = 0, target = 0, vel = 0, dirty = true, raf = 0;
    var wrapIdx = function (v) { var n = cards.length; return ((Math.round(v) % n) + n) % n; };
    var syncLoop = function () {
      var want = inView && !still ? videos[wrapIdx(target)] : null;
      if (playing && playing !== want) { playing.pause(); playing = null; }
      if (want && playing !== want) {
        if (!want.src) want.src = want.dataset.src;
        playing = want;
        want.play().catch(function () { playing = null; });
        kick();
      }
    };

    var resize = function () {
      var r = host.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      if (!W || !H) return;
      view.width = Math.round(W * dpr); view.height = Math.round(H * dpr);
      // the lens magnifies the centre about 1/zoom, so the scene is drawn that much sharper
      scale = gl ? Math.min(dpr / (1 - strength), 4096 / Math.max(W, H)) : dpr;
      if (gl) {
        scene.width = Math.round(W * scale); scene.height = Math.round(H * scale);
        gl.viewport(0, 0, view.width, view.height);
        gl.uniform1f(U("aspect"), W / H);
      }
      dirty = true; kick();
    };
    var geom = function () { var ch = H * cardSize * (1 - lens); var cw = ch * ratio; return { ch: ch, cw: cw, step: cw + ch * gapK }; };
    var rr = function (x, y, w, h, r) {
      sx.beginPath(); sx.moveTo(x + r, y); sx.arcTo(x + w, y, x + w, y + h, r); sx.arcTo(x + w, y + h, x, y + h, r); sx.arcTo(x, y + h, x, y, r); sx.arcTo(x, y, x + w, y, r); sx.closePath();
    };
    var wrap = function (text, x, y, maxW, lh) {
      var words = String(text).split(" "), line = "", yy = y, n = 0;
      for (var k = 0; k < words.length; k++) {
        var t = line ? line + " " + words[k] : words[k];
        if (sx.measureText(t).width > maxW && line) { sx.fillText(line, x, yy); line = words[k]; yy += lh; if (++n >= 3) return; } else line = t;
      }
      sx.fillText(line, x, yy);
    };
    var playMark = function (px, py, pr, ring) {
      sx.fillStyle = "rgba(11,11,12,0.7)"; sx.beginPath(); sx.arc(px, py, pr, 0, Math.PI * 2); if (!ring) sx.fill();
      sx.strokeStyle = accent; sx.stroke();
      sx.fillStyle = accent; sx.beginPath(); sx.moveTo(px - pr * 0.28, py - pr * 0.4); sx.lineTo(px + pr * 0.45, py); sx.lineTo(px - pr * 0.28, py + pr * 0.4); sx.closePath(); sx.fill();
    };
    var drawScene = function () {
      var g0 = geom(), ch = g0.ch, cw = g0.cw, step = g0.step;
      var u = Math.min(cw, (ch * 9) / 16); // type scales with a 9:16-equivalent width
      sx.setTransform(scale, 0, 0, scale, 0, 0);
      sx.fillStyle = bg; sx.fillRect(0, 0, W, H);
      var cy = H / 2 - ch / 2, n = cards.length, span = Math.ceil(W / 2 / step) + 1;
      for (var k = Math.floor(pos) - span; k <= Math.ceil(pos) + span; k++) {
        var i = ((k % n) + n) % n, c = cards[i];
        var x = W / 2 + (k - pos) * step - cw / 2;
        if (x > W || x + cw < 0) continue;
        sx.save();
        rr(x, cy, cw, ch, Math.max(2, cw * 0.02)); sx.clip();
        var media = mediaOf(i);
        if (media) {
          var mw = media.videoWidth || media.naturalWidth || media.width, mh = media.videoHeight || media.naturalHeight || media.height;
          var s = Math.max(cw / mw, ch / mh);
          sx.drawImage(media, x + (cw - mw * s) / 2, cy + (ch - mh * s) / 2, mw * s, mh * s);
          var g = sx.createLinearGradient(0, cy, 0, cy + ch);
          g.addColorStop(0, "rgba(0,0,0,0.55)"); g.addColorStop(0.35, "rgba(0,0,0,0)"); g.addColorStop(0.6, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.7)");
          sx.fillStyle = g; sx.fillRect(x, cy, cw, ch);
          if (c.full) { sx.lineWidth = Math.max(1, u * 0.006); var pr = u * 0.075; playMark(x + cw - u * 0.07 - pr, cy + ch - u * 0.07 - pr, pr); }
        } else {
          // placeholder: a dark card in the signal's tint, scanlined, with a play mark
          var g2 = sx.createLinearGradient(x, cy, x + cw, cy + ch);
          g2.addColorStop(0, "rgba(" + rgb + ",0.13)"); g2.addColorStop(1, "rgba(" + rgb + ",0.03)");
          sx.fillStyle = "#0f1112"; sx.fillRect(x, cy, cw, ch);
          sx.fillStyle = g2; sx.fillRect(x, cy, cw, ch);
          sx.fillStyle = "rgba(" + rgb + ",0.05)";
          for (var yy = cy; yy < cy + ch; yy += 3) sx.fillRect(x, yy, cw, 1);
          sx.lineWidth = Math.max(1, u * 0.008);
          playMark(x + cw / 2, cy + ch * 0.52, u * 0.11, true);
        }
        sx.restore();
        sx.strokeStyle = "rgba(237,235,230,0.12)"; sx.lineWidth = (1 / scale) * 1.5;
        rr(x + 0.5 / scale, cy + 0.5 / scale, cw - 1 / scale, ch - 1 / scale, Math.max(2, cw * 0.02)); sx.stroke();
        var padd = u * 0.07;
        sx.textBaseline = "top";
        sx.fillStyle = accent; sx.font = "500 " + u * 0.052 + "px " + mono;
        sx.fillText(zero(c.subtitle || "").toUpperCase(), x + padd, cy + padd, cw - padd * 2);
        sx.fillStyle = "#e8e9e6"; sx.font = "300 " + u * 0.1 + "px " + serif;
        wrap(c.title || "", x + padd, cy + padd + u * 0.09, cw - padd * 2, u * 0.115);
        if (c.footer) {
          sx.textBaseline = "bottom"; sx.fillStyle = "rgba(232,233,230,0.6)"; sx.font = "400 " + u * 0.045 + "px " + mono;
          sx.fillText(zero(c.footer).toUpperCase(), x + padd, cy + ch - padd, cw - padd * 2);
        }
      }
    };
    var render = function () {
      drawScene();
      if (!gl) return;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, scene);
      gl.uniform1f(U("blur"), still ? 0 : Math.min(0.06, Math.abs(vel) * 0.25));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    var frame = function () {
      raf = 0;
      if (!W) return;
      var prev = pos;
      pos += (target - pos) * (still ? 1 : Math.abs(target - pos) > 1.5 ? 0.06 : 0.14);
      if (Math.abs(target - pos) < 0.0005) pos = target;
      vel = pos - prev;
      if (pos !== prev || dirty || playing) { render(); dirty = false; }
      if (pos !== target || (playing && inView)) kick();
    };
    function kick() { if (!raf) raf = requestAnimationFrame(frame); }
    var go = function (i) {
      target = Math.round(i);
      host.setAttribute("aria-valuenow", String(wrapIdx(target) + 1));
      host.setAttribute("aria-valuetext", cards[wrapIdx(target)].title || "");
      kick();
      host.dispatchEvent(new CustomEvent("bulge:change", { detail: wrapIdx(target) }));
      if (o.onChange) o.onChange(wrapIdx(target), cards[wrapIdx(target)]);
      syncLoop();
    };
    /* The centre card was chosen: the page opens its full video. */
    var open = function (i) {
      if (!cards[i].full) return;
      host.dispatchEvent(new CustomEvent("bulge:open", { detail: i }));
      if (o.onOpen) o.onOpen(i, cards[i]);
    };

    var down = false, sxp = 0, sPos = 0, moved = 0;
    host.addEventListener("pointerdown", function (e) { down = true; sxp = e.clientX; sPos = target; moved = 0; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", function (e) {
      if (!down) return;
      var dx = e.clientX - sxp; moved = Math.max(moved, Math.abs(dx));
      target = sPos - dx / (geom().step / (1 - lens)); kick();
    });
    host.addEventListener("pointerup", function (e) {
      down = false;
      if (moved < 6) {
        var r = host.getBoundingClientRect();
        var off = (e.clientX - r.left - W / 2) / (geom().cw / (1 - lens));
        if (Math.abs(off) < 0.5) open(wrapIdx(target)); else go(target + Math.sign(off) * Math.max(1, Math.round(Math.abs(off) * 0.8)));
      } else go(target);
    });
    var wheelT = 0;
    host.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical intent: the page scrolls
      e.preventDefault();
      target += e.deltaX / 300; kick();
      clearTimeout(wheelT); wheelT = setTimeout(function () { go(target); }, 120);
    }, { passive: false });
    host.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); go(target + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(target - 1); }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(wrapIdx(target)); }
    });

    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; syncLoop(); if (inView) kick(); }, { threshold: 0.25 }).observe(host);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { dirty = true; kick(); });
    resize();
    // the slide to the start card plays when the carousel first comes into view
    if (o.start != null) {
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; io.disconnect(); setTimeout(function () { go(o.start); }, 150); }, { threshold: 0.45 });
        io.observe(host);
      } else go(o.start);
    } else go(0);
    return { go: go, open: open, get index() { return wrapIdx(target); }, redraw: function () { dirty = true; kick(); } };
  };

  // ── VideoPlayer ────────────────────────────────────────────────────────
  var PLAYER_HTML =
    '<div class="gs-vplayer-head"><span class="gs-label" data-vp-title></span>' +
    '<button type="button" class="gs-icell" data-vp-close aria-label="Close">' + icon("x") + "</button></div>" +
    '<div class="gs-vplayer-stage"><video playsinline preload="none"></video>' +
    '<button type="button" class="gs-vplayer-big" data-vp-big aria-label="Play"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg></button></div>' +
    '<div class="gs-vplayer-bar">' +
    '<button type="button" class="gs-vp-btn" data-vp-play aria-label="Play"><svg viewBox="0 0 16 16" aria-hidden="true"><path class="vp-pause" d="M4 3h3v10H4zM9 3h3v10H9z"/><path class="vp-playic" d="M4 2.5v11l9-5.5z"/></svg></button>' +
    '<input type="range" class="gs-vp-seek" data-vp-seek min="0" max="1000" value="0" step="1" aria-label="Seek">' +
    '<span class="gs-micro gs-vp-time" data-vp-time>0:00 / 0:00</span>' +
    '<button type="button" class="gs-vp-btn" data-vp-mute aria-label="Mute"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10l-4-3H2z"/><path class="vp-wave" d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path class="vp-x" d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.3"/></svg></button>' +
    '<button type="button" class="gs-vp-btn" data-vp-full aria-label="Full screen">' + icon("maximize-2") + "</button></div>";

  /* Wires a player: a <dialog class="gs gs-vplayer"> (a sheet) or any
     element with .gs-vplayer.inline. Fills it if empty. The video streams only
     after open(); closing pauses it and drops the source, so the download stops. */
  GS.player = function (root) {
    root.classList.add("gs-vplayer", "is-paused");
    if (!root.querySelector("video")) root.innerHTML = PLAYER_HTML;
    var q = function (s) { return root.querySelector(s); };
    var vid = q("video"), seek = q("[data-vp-seek]"), title = q("[data-vp-title]"), isDlg = typeof root.showModal === "function";
    var fmt = function (t) { return isFinite(t) ? Math.floor(t / 60) + ":" + pad2(Math.floor(t % 60)) : "0:00"; };
    var paint = function () {
      var p = vid.duration ? (vid.currentTime / vid.duration) * 1000 : 0;
      if (document.activeElement !== seek) seek.value = String(p);
      seek.style.setProperty("--p", (Number(seek.value) / 10).toFixed(2) + "%");
      var buf = vid.buffered.length && vid.duration ? (vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100 : 0;
      seek.style.setProperty("--b", buf.toFixed(2) + "%");
      q("[data-vp-time]").textContent = fmt(vid.currentTime) + " / " + fmt(vid.duration);
      root.classList.toggle("is-paused", vid.paused);
      root.classList.toggle("is-muted", vid.muted);
      q("[data-vp-play]").setAttribute("aria-label", vid.paused ? "Play" : "Pause");
    };
    ["timeupdate", "progress", "play", "pause", "volumechange", "loadedmetadata", "emptied"].forEach(function (ev) { vid.addEventListener(ev, paint); });
    var toggle = function () { if (!vid.currentSrc && !vid.src) return; if (vid.paused) vid.play().catch(function () {}); else vid.pause(); };
    q("[data-vp-play]").addEventListener("click", toggle);
    q("[data-vp-big]").addEventListener("click", toggle);
    vid.addEventListener("click", toggle);
    seek.addEventListener("input", function () { if (vid.duration) vid.currentTime = (Number(seek.value) / 1000) * vid.duration; paint(); });
    q("[data-vp-mute]").addEventListener("click", function () { vid.muted = !vid.muted; });
    q("[data-vp-full]").addEventListener("click", function () {
      var st = q(".gs-vplayer-stage");
      if (document.fullscreenElement) document.exitFullscreen();
      else if (st.requestFullscreen) st.requestFullscreen().catch(function () {});
      else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();
    });
    root.addEventListener("keydown", function (e) {
      if (e.target.tagName === "INPUT" && e.key.indexOf("Arrow") === 0) return;
      if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowRight") { e.preventDefault(); vid.currentTime += 5; }
      if (e.key === "ArrowLeft") { e.preventDefault(); vid.currentTime -= 5; }
      if (e.key === "m") vid.muted = !vid.muted;
    });
    var stopDownload = function () { vid.pause(); vid.removeAttribute("src"); vid.load(); paint(); };
    var api = {
      video: vid,
      paint: paint,
      /** Show the sheet (or the inline player) and stream src from the start. */
      open: function (m) {
        m = m || {};
        title.textContent = zero(m.title || "");
        vid.poster = m.poster || "";
        if (m.src) vid.src = m.src; else vid.removeAttribute("src");
        if (isDlg && !root.open) root.showModal();
        paint();
        if (m.src && m.autoplay !== false) vid.play().catch(function () {});
        return api;
      },
      close: function () { if (isDlg && root.open) root.close(); else stopDownload(); },
    };
    q("[data-vp-close]").addEventListener("click", api.close);
    if (isDlg) {
      root.addEventListener("click", function (e) { if (e.target === root) api.close(); });
      root.addEventListener("close", function () { stopDownload(); if (api.returnFocus) api.returnFocus.focus(); });
    } else q("[data-vp-close]").hidden = !root.hasAttribute("data-closable");
    paint();
    return api;
  };

  var sheet = null;
  /* One shared sheet for the page: GS.openVideo({src, poster, title}). */
  GS.openVideo = function (m) {
    if (!sheet) {
      var d = document.createElement("dialog");
      d.className = "gs gs-vplayer";
      d.setAttribute("aria-label", "Video");
      if (document.documentElement.dataset.theme) d.dataset.theme = document.documentElement.dataset.theme;
      document.body.appendChild(d);
      sheet = GS.player(d);
    }
    sheet.returnFocus = document.activeElement;
    return sheet.open(m);
  };

  // ── PhaseGallery ───────────────────────────────────────────────────────
  /* Three photo slots that follow the phase. sets[phase] is a list of
     {src, alt, caption} or {label} (an empty slot that says what goes there);
     phase -1 is the resting set. The first photos arrive with a tile burst,
     only if they are on screen; later swaps are plain. */
  GS.gallery = function (el, o) {
    o = o || {};
    var sets = o.sets || {}, n = o.slots || 3;
    el.classList.add("gs-gallery");
    if (!el.querySelector(".gs-shot")) {
      var h = "";
      for (var k = 0; k < n; k++) h += '<figure class="gs-shot" data-shot="' + k + '"><img alt="" hidden><span class="gs-shot-empty"><span data-icon="image"></span><span data-shot-label>Photo</span></span><figcaption data-shot-cap></figcaption></figure>';
      el.innerHTML = h;
      if (GS.hydrate) GS.hydrate(el);
    }
    var shots = [].slice.call(el.querySelectorAll(".gs-shot"));
    var first = true, cur = null;
    var show = function (phase) {
      var set = sets[String(phase)] || sets[phase] || [];
      if (phase === cur) return;
      cur = phase;
      var burstNow = first && o.burst !== false && onScreen(el);
      first = false;
      shots.forEach(function (f, k) {
        var it = set[k] || { label: "Photo" };
        var img = f.querySelector("img"), cap = f.querySelector("[data-shot-cap]");
        f.classList.remove("is-in"); void f.offsetWidth;
        if (it.src) {
          var reveal = function () { img.style.visibility = ""; if (burstNow) GS.burst(f, { origin: k % 2 ? "tr" : "tl", size: 36, duration: 900, delay: k * 120, ifVisible: false }); else f.classList.add("is-in"); };
          img.alt = it.alt || ""; img.hidden = false; f.classList.remove("empty"); cap.textContent = zero(it.caption || "");
          if (img.getAttribute("src") === it.src && img.complete) reveal();
          else { img.style.visibility = "hidden"; img.onload = reveal; img.src = it.src; }
        } else {
          img.hidden = true; img.removeAttribute("src"); f.classList.add("empty", "is-in");
          f.querySelector("[data-shot-label]").textContent = zero(it.label || "Photo"); cap.textContent = "";
        }
      });
    };
    if (o.phase != null) show(o.phase);
    return { show: show, get phase() { return cur; } };
  };

  // ── ScrollTimeline ─────────────────────────────────────────────────────
  /* The program timeline: a text tile and a calendar tile. Scroll (or
     progress(p)) opens each phase in turn and a playhead rides its weeks.
     The calendar's height is fixed to rows + the tallest phase text, so
     opening a phase never moves the page. */
  GS.timeline = function (root, o) {
    o = o || {};
    var phases = o.phases || [], N = phases.length;
    var weeks = o.weeks || ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "+2 mo"];
    var idle = o.idle || { eyebrow: "Scroll to step through", title: "Timeline", when: "Six weeks, then an extension" };
    root.classList.add("gs-tl");
    root.style.setProperty("--cols", String(weeks.length));
    root.innerHTML =
      '<div class="gs-tl-grid">' +
      '<div class="gs-panel gs-tl-side"><div class="gs-tl-now" aria-live="polite"><span class="gs-label" data-tl-eyebrow>' + esc(zero(idle.eyebrow)) + "</span>" +
      '<strong class="gs-tl-title" data-tl-title>' + esc(idle.title) + '</strong><span class="gs-micro" data-tl-when>' + esc(idle.when) + "</span></div>" +
      '<div class="gs-tl-foot"><span class="gs-tag" data-tl-count>00 / ' + pad2(N) + '</span><span class="gs-meter mini" data-tl-meter aria-hidden="true"></span></div></div>' +
      '<div class="gs-panel gs-tl-cal"><div class="gs-tl-ruler" aria-hidden="true"><span class="gs-micro">' + esc(zero("Phase")) + "</span>" +
      weeks.map(function (w) { return '<span class="gs-micro">' + esc(w) + "</span>"; }).join("") + "</div>" +
      '<div class="gs-tl-rows"><span class="gs-tl-playhead" aria-hidden="true"></span>' +
      phases.map(function (p, i) {
        var id = "gs-tl-" + ++uid;
        return '<div class="gs-tl-phase' + (p.from >= weeks.length ? " ext" : "") + '" role="button" tabindex="0" aria-expanded="false" aria-controls="' + id + '" data-from="' + p.from + '" data-to="' + p.to + '">' +
          '<div class="gs-tl-name"><b>' + esc(zero(p.title)) + '</b><span class="gs-micro">' + esc(p.when || "") + "</span></div>" +
          '<div class="gs-tl-lane"><div class="gs-tl-bar" style="grid-column:' + p.from + " / " + (p.to + 1) + '">' + pad2(i + 1) + "</div></div></div>" +
          '<div class="gs-tl-body" id="' + id + '" aria-hidden="true"><div><p class="gs-prose">' + esc(p.body || "") + "</p></div></div>";
      }).join("") + "</div></div></div>";
    var q = function (s) { return root.querySelector(s); };
    var rows = [].slice.call(root.querySelectorAll(".gs-tl-phase"));
    var bodies = [].slice.call(root.querySelectorAll(".gs-tl-body p"));
    var cal = q(".gs-tl-cal"), meter = q("[data-tl-meter]");
    var pin = root.parentElement && root.parentElement.classList.contains("gs-tl-pin") && o.scroll !== false ? root.parentElement : null;
    if (pin) pin.style.setProperty("--n", String(N));
    var fit = function () {
      root.style.setProperty("--body-h", "0px");
      var h = Math.max.apply(null, bodies.map(function (b) { return b.scrollHeight; }).concat([0]));
      root.style.setProperty("--body-h", h + "px");
      root.style.setProperty("--cal-h", "auto");
      var rowsH = rows.reduce(function (a, r) { return a + r.offsetHeight; }, 0);
      root.style.setProperty("--cal-h", q(".gs-tl-ruler").offsetHeight + rowsH + h + 2 + "px");
    };
    fit();
    if ("ResizeObserver" in window) { var lastW = 0; new ResizeObserver(function () { if (root.clientWidth !== lastW) { lastW = root.clientWidth; fit(); } }).observe(root); }
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { fit(); root.classList.add("is-fitted"); });

    var current = -2;
    var open = function (i) {
      if (i === current) return;
      current = i;
      rows.forEach(function (r, k) {
        r.setAttribute("aria-expanded", String(k === i));
        document.getElementById(r.getAttribute("aria-controls")).setAttribute("aria-hidden", String(k !== i));
      });
      q("[data-tl-count]").textContent = (i < 0 ? "00" : pad2(i + 1)) + " / " + pad2(N);
      if (GS.meter) GS.meter(meter, { segments: N, value: ((i + 1) / N) * 100 });
      root.dataset.idle = String(i < 0);
      var p = phases[i];
      q("[data-tl-eyebrow]").textContent = zero(i < 0 ? idle.eyebrow : o.label || "Timeline");
      q("[data-tl-title]").textContent = i < 0 ? idle.title : p.title;
      q("[data-tl-when]").textContent = i < 0 ? idle.when : p.when || "";
      if (o.gallery) o.gallery.show(i);
      if (o.onChange) o.onChange(i);
    };
    /** p < 0 rests on "Timeline"; 0..1 runs through the phases. */
    var progress = function (p) {
      if (p < 0 || !N) { open(-1); return; }
      p = Math.min(1, p);
      var i = Math.min(N - 1, Math.floor(p * N)), local = Math.min(1, p * N - i);
      open(i);
      // the playhead crosses the open phase's own weeks, so it rides its bar
      var from = Number(rows[i].dataset.from) - 1, to = Number(rows[i].dataset.to);
      root.style.setProperty("--p", String((from + local * (to - from)) / weeks.length));
    };
    var top = o.top != null ? o.top : 64;
    var onScroll = function () {
      var t = pin.getBoundingClientRect().top - top;
      if (t > 0) return progress(-1);
      progress(-t / Math.max(1, pin.offsetHeight - root.offsetHeight));
    };
    if (pin) { addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); onScroll(); } else progress(o.progress != null ? o.progress : -1);
    rows.forEach(function (r, i) {
      var go = function () {
        if (pin) {
          var y = pin.getBoundingClientRect().top + scrollY - top + ((i + 0.5) / N) * (pin.offsetHeight - root.offsetHeight);
          scrollTo({ top: y, behavior: reduced() ? "auto" : "smooth" });
        } else progress((i + 0.5) / N);
        if (o.onSelect) o.onSelect(i);
      };
      r.addEventListener("click", go);
      r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    return { progress: progress, open: open, fit: fit, get index() { return current; } };
  };

  // ── TileBurst ──────────────────────────────────────────────────────────
  var ORIGINS = { tl: [0, 0], tr: [1, 0], bl: [0, 1], br: [1, 1], c: [0.5, 0.5] };
  /* Square cells light up in rings from an origin. mode "reveal" (default):
     el starts covered and clears, a load-in. mode "through": cells cover el,
     onCover() fires at the cut (swap content there), then they clear: a
     transition. Resolves when done. */
  GS.burst = function (el, o) {
    o = o || {};
    var mode = o.mode || "reveal";
    return new Promise(function (done) {
      if (reduced() || (mode === "reveal" && o.ifVisible !== false && !onScreen(el))) { if (o.onCover) o.onCover(); return done(); }
      var prev = el.querySelector(":scope > canvas.gs-burst-canvas");
      if (prev) prev.remove();
      var s = overlay(el, "gs-burst-canvas"), ctx = s.ctx, w = s.w, h = s.h;
      if (!w || !h) { s.c.remove(); if (o.onCover) o.onCover(); return done(); }
      var rgb = rgbOf(el), fill = o.fill || cssv(el, "--bg-panel", "#111213");
      var size = o.size || (mode === "through" ? 64 : 36), cols = Math.ceil(w / size), rows = Math.ceil(h / size);
      var org = typeof o.origin === "string" ? ORIGINS[o.origin] || ORIGINS.c : o.origin || ORIGINS.c;
      var ox = org[0] * cols, oy = org[1] * rows, maxD = 0;
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) maxD = Math.max(maxD, Math.hypot(i + 0.5 - ox, j + 0.5 - oy));
      var dur = o.duration || (mode === "through" ? 1300 : 900), t0 = performance.now() + (o.delay || 0), covered = false;
      var cell = function (x, y, a) {
        var edge = 4 * a * (1 - a);
        ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.fillRect(x, y, size, size); ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(" + rgb + "," + 0.3 * edge + ")"; ctx.fillRect(x, y, size, size);
        ctx.strokeStyle = "rgba(" + rgb + "," + (0.1 * a + 0.8 * edge) + ")"; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      };
      var paint = function (u) {
        ctx.clearRect(0, 0, w, h);
        var r1 = mode === "through" ? eio(seg(u, 0, 0.46)) * (maxD + 3) : Infinity;
        var r2 = mode === "through" ? eio(seg(u, 0.52, 1)) * (maxD + 3) : u * (maxD + 3);
        for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) {
          var d = Math.hypot(i + 0.5 - ox, j + 0.5 - oy);
          var a = clamp((r1 - d) / 2.2) * (1 - clamp((r2 - d) / 2.2));
          if (a > 0) cell(i * size, j * size, a);
        }
      };
      paint(0);
      var frame = function (now) {
        var u = Math.max(0, (now - t0) / dur);
        if (!covered && (mode === "reveal" || u >= 0.48)) { covered = true; if (o.onCover) o.onCover(); }
        paint(Math.min(1, u));
        if (u < 1) requestAnimationFrame(frame); else { s.c.remove(); done(); }
      };
      requestAnimationFrame(frame);
    });
  };

  // ── CRTScan ────────────────────────────────────────────────────────────
  /* A bright scan line sweeps down pulling a scanlined dark frame behind it,
     with glitched slices at its edge, then sweeps on to reveal. mode "through"
     (default): onCover() fires when el is covered (swap content there).
     mode "reveal": el starts covered and the second sweep uncovers it. */
  GS.scan = function (el, o) {
    o = o || {};
    var mode = o.mode || "through";
    return new Promise(function (done) {
      if (reduced() || (o.ifVisible && !onScreen(el))) { if (o.onCover) o.onCover(); return done(); }
      var prev = el.querySelector(":scope > canvas.gs-scan-canvas");
      if (prev) prev.remove();
      var s = overlay(el, "gs-scan-canvas"), ctx = s.ctx, w = s.w, h = s.h;
      var rgb = rgbOf(el), fill = o.fill || cssv(el, "--bg-base", "#0b0b0c");
      var dur = o.duration || (mode === "reveal" ? 450 : 900), t0 = performance.now() + (o.delay || 0), covered = false;
      var jit = h * 0.083, line = Math.max(2, h * 0.0037);
      var paint = function (u, now) {
        ctx.clearRect(0, 0, w, h);
        var a = mode === "reveal" ? h : h * eio(seg(u, 0, 0.5));
        var b = mode === "reveal" ? h * eio(u) : h * eio(seg(u, 0.5, 1));
        if (a - b < 1) return;
        ctx.fillStyle = fill; ctx.fillRect(0, b, w, a - b);
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        for (var y = Math.floor(b / 3) * 3; y < a; y += 3) ctx.fillRect(0, y, w, 1);
        var down = mode !== "reveal" && u < 0.5, lead = down ? a : b, fr = Math.floor(now / 33);
        for (var k = 0; k < 7; k++) {
          var r = Math.abs(Math.sin(fr * 12.9898 + k * 78.233) * 43758.5453) % 1;
          ctx.fillStyle = "rgba(" + rgb + "," + (0.12 + r * 0.2) + ")";
          ctx.fillRect((r - 0.5) * w * 0.05, lead + (down ? -1 : 1) * r * jit, w, Math.max(1, (2 + r * 6) * (h / 1080)));
        }
        if (lead > 0.5 && lead < h - 0.5) {
          ctx.shadowColor = "rgba(" + rgb + ",0.9)"; ctx.shadowBlur = 30;
          ctx.fillStyle = "rgba(" + rgb + ",0.95)"; ctx.fillRect(0, lead - line / 2, w, line);
          ctx.shadowBlur = 0;
        }
      };
      paint(0, 0);
      var frame = function (now) {
        var u = Math.max(0, (now - t0) / dur);
        if (!covered && (mode === "reveal" || u >= 0.5)) { covered = true; if (o.onCover) o.onCover(); }
        paint(Math.min(1, u), now);
        if (u < 1) requestAnimationFrame(frame); else { s.c.remove(); done(); }
      };
      requestAnimationFrame(frame);
    });
  };

  // ── NameBadge ──────────────────────────────────────────────────────────
  /* The lower third: a dot pops, a leader line draws, the cut-corner box
     opens, the name types in and the role rises in Ø caps. In for 1.3 s; it
     holds (o.hold, default) or plays out at 4.9 s like the video version. */
  GS.nameBadge = function (el, o) {
    o = o || {};
    var name = o.name || "";
    el.classList.add("gs-lt");
    el.innerHTML =
      '<span class="gs-lt-dot"></span><span class="gs-lt-line"></span>' +
      '<div class="gs-lt-clip"><div class="gs-lt-box"><div class="gs-lt-in">' +
      (o.tag ? '<span class="gs-lt-tag"><i></i>' + esc(zero(o.tag)) + "</span>" : "") +
      '<b class="gs-lt-name"><span class="gs-lt-ghost" aria-hidden="true">' + esc(name) + '</span><span class="gs-lt-live"><span class="gs-lt-typed"></span><span class="gs-lt-cur"></span></span></b>' +
      '<span class="gs-lt-role">' + esc(zero(o.role || "")) + "</span></div></div></div>";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", [name, o.role].filter(Boolean).join(", "));
    var q = function (s) { return el.querySelector(s); };
    var draw = function (t) {
      var out = seg(t, 4.9, 5.4);
      q(".gs-lt-dot").style.transform = "scale(" + eo(seg(t, 0, 0.25)) * (1 - seg(t, 5.55, 5.85)) + ")";
      q(".gs-lt-line").style.transform = "scaleX(" + eo(seg(t, 0.15, 0.45)) * (1 - seg(t, 5.3, 5.6)) + ")";
      q(".gs-lt-clip").style.clipPath = "inset(0 " + (1 - eo(seg(t, 0.35, 0.85)) + eio(out)) * 100 + "% 0 0)";
      if (q(".gs-lt-tag")) q(".gs-lt-tag").style.opacity = String(seg(t, 0.5, 0.8));
      q(".gs-lt-typed").textContent = name.slice(0, Math.round(name.length * seg(t, 0.6, 1.25)));
      q(".gs-lt-cur").style.opacity = t < 1.7 && (t < 1.25 || Math.floor(t * 4) % 2 === 0) ? "1" : "0";
      var r = eo(seg(t, 0.9, 1.3));
      q(".gs-lt-role").style.opacity = String(r);
      q(".gs-lt-role").style.transform = "translateY(" + (1 - r) * 8 + "px)";
      q(".gs-lt-box").style.filter = "brightness(" + (1 + 0.6 * (seg(t, 0.35, 0.5) - seg(t, 0.5, 0.75))) + ")";
    };
    var hold = o.hold !== false && !o.loop;
    var api = runner(el, draw, { dur: 6, rest: 2, loop: o.loop, gap: 0.6 });
    var play = api.play;
    api.play = function () { return play(0, hold ? 1.8 : undefined); };
    api.out = function () { return play(4.9, 6); };
    draw(0);
    if (o.autoplay !== false) api.play();
    return api;
  };

  // ── Subtitles ──────────────────────────────────────────────────────────
  /* Who speaks decides the look: participant (no role) bright read-along;
     interviewer {role:"interviewer"} lit in the signal colour; person
     {role:"person", tint:"mint"|"blue"|"amber", name, label} a tick per line
     and the name above the first line of a turn; voice {role:"voice", name}
     the name above every line. "[sounds]" stay grey. top: true moves a
     subtitle up when the footage has text at the bottom. */
  GS.subtitles = function (el, o) {
    o = o || {};
    var evs = o.events || [];
    var word = function (x) { return /^\[.*\]$/.test(x) ? '<span class="snd">' + esc(x) + "</span>" : '<span class="w">' + esc(x) + "</span>"; };
    var tick = function (t) { return t ? '<i class="gs-sub-tick ' + t + '"></i>' : ""; };
    var html = evs.map(function (e, i) {
      var who = e.who || {}, isQ = who.role === "interviewer";
      var label = (who.label || who.role === "voice") && who.name ? '<span class="gs-sub-spk">' + tick(who.tint) + esc(zero(who.name)) + "</span>" : "";
      var lines = e.lines.map(function (l) {
        var toks = typeof l === "string" ? l.split(" ") : l.slice(), t = who.tint;
        if (toks[0] && toks[0].charAt(0) === "@") { t = toks.shift().slice(1); }
        return '<span class="gs-sub-line">' + tick(who.role === "person" ? t : null) + toks.map(word).join(" ") + "</span>";
      }).join("");
      return '<div class="gs-sub' + (isQ ? " is-q" : "") + (e.top ? " is-top" : "") + '" data-ev="' + i + '" style="visibility:hidden">' + label + '<span class="gs-sub-box">' + lines + "</span></div>";
    }).join("");
    var wrapEl = document.createElement("div");
    wrapEl.className = "gs-subs";
    wrapEl.innerHTML = html;
    while (wrapEl.firstChild) el.appendChild(wrapEl.firstChild);
    var els = [].slice.call(el.querySelectorAll(".gs-sub[data-ev]"));
    var dur = o.dur || Math.max.apply(null, evs.map(function (e) { return e.b; }).concat([1])) + 0.6;
    var draw = function (t) {
      els.forEach(function (n, i) {
        var e = evs[i], on = t >= e.a && t < e.b;
        n.style.visibility = on ? "visible" : "hidden";
        if (!on) return;
        var ws = n.querySelectorAll(".w"), k = Math.floor(seg(t, e.a, e.b - 0.3) * (ws.length + 0.999));
        for (var j = 0; j < ws.length; j++) ws[j].classList.toggle("said", j < k);
      });
    };
    // reduced motion: the first subtitle, fully lit
    var rest = evs.length ? evs[0].b - 0.01 : 0;
    var api = runner(el, draw, { dur: dur, rest: rest, loop: o.loop !== false });
    draw(o.at != null ? o.at : rest);
    if (o.autoplay !== false) api.play();
    return api;
  };

  // ── ChapterCard ────────────────────────────────────────────────────────
  /* Full-frame card between parts: ceiling and floor grids moving, a Ø-caps
     kicker, the serif title rising word by word, a meter for the step.
     In and out over 4 s (o.hold keeps it up). */
  GS.chapter = function (el, o) {
    o = o || {};
    var steps = o.steps || 4, step = o.step || 1;
    el.querySelectorAll(":scope > .gs-ch, :scope > canvas").forEach(function (n) { n.remove(); });
    var bg = bgCanvas(el);
    var box = document.createElement("div");
    box.className = "gs-ch";
    box.style.setProperty("--steps", String(steps));
    box.innerHTML =
      '<span class="gs-ch-k">' + esc(zero(o.kicker || "")) + "</span>" +
      '<h2 class="gs-ch-t">' + String(o.title || "").split(" ").map(function (x) { return "<span>" + esc(x) + "</span>"; }).join(" ") + "</h2>" +
      (o.sub ? '<span class="gs-ch-s">' + esc(o.sub) + "</span>" : "") +
      '<div class="gs-ch-m" aria-label="Step ' + step + " of " + steps + '">' + new Array(steps + 1).join("<i></i>") + "</div>";
    el.appendChild(box);
    var words = [].slice.call(box.querySelectorAll(".gs-ch-t span")), segs = [].slice.call(box.querySelectorAll(".gs-ch-m i"));
    var last = 0, hold = !!o.hold;
    var draw = function (t) {
      last = t;
      var a = seg(t, 0, 0.35) * (hold ? 1 : 1 - seg(t, 3.6, 4));
      box.style.opacity = String(a); bg.c.style.opacity = String(a);
      var rgb = rgbOf(el), ctx = bg.ctx;
      ctx.clearRect(0, 0, bg.w, bg.h);
      [1, -1].forEach(function (dir) { plane(ctx, rgb, bg.w, bg.h, { dir: dir, cy: bg.h / 2, gap: bg.h * 0.3, cols: bg.w < bg.h ? 22 : 36, phase: t / 2.4 }); });
      var k = box.querySelector(".gs-ch-k");
      k.style.opacity = String(seg(t, 0.3, 0.7)); k.style.letterSpacing = 0.3 - 0.14 * eo(seg(t, 0.3, 1)) + "em";
      words.forEach(function (wd, i) {
        var r = eo(seg(t, 0.45 + i * 0.12, 1.0 + i * 0.12));
        wd.style.opacity = String(r); wd.style.transform = "translateY(" + (1 - r) * 0.19 + "em)"; wd.style.filter = "blur(" + (1 - r) * 6 + "px)";
      });
      var s = box.querySelector(".gs-ch-s");
      if (s) s.style.opacity = String(seg(t, 1.0, 1.4));
      segs.forEach(function (n, i) { n.classList.toggle("on", i < step && t > 1.1 + i * 0.12); });
    };
    bg.redraw = function () { draw(last); };
    var api = runner(el, draw, { dur: hold ? 2 : 4, rest: 2, loop: !!o.loop, gap: 0.4 });
    draw(reduced() ? 2 : 0);
    if (o.autoplay !== false) api.play();
    return api;
  };

  // ── EndCard ────────────────────────────────────────────────────────────
  var MARK_D = "M34 156 V76 A24 24 0 0 1 82 76 V156 M82 76 A24 24 0 0 1 106 52 H132 A23.25 23.25 0 0 1 132 98.5 H119 M119 98.5 H132 A23.25 23.25 0 0 1 132 145 H119";
  /* Closing card: the floor moves, the M3 mark draws itself, then the line,
     the link and a status pill. Holds on the last frame. */
  GS.endCard = function (el, o) {
    o = o || {};
    el.querySelectorAll(":scope > .gs-ec, :scope > canvas").forEach(function (n) { n.remove(); });
    var bg = bgCanvas(el), id = "gs-ec-" + ++uid;
    var box = document.createElement("div");
    box.className = "gs-ec";
    box.innerHTML =
      '<svg class="gs-ec-mark" viewBox="20 38 150 121" role="img" aria-label="M3"><defs>' +
      '<pattern id="' + id + '-h" width="3" height="200" patternUnits="userSpaceOnUse"><rect width="3" height="200" style="fill:rgba(var(--accent-rgb),0.28)"/><line x1="1" y1="0" x2="1" y2="200" style="stroke:rgba(var(--accent-rgb),0.22)" stroke-width="0.8"/></pattern>' +
      '<mask id="' + id + '-k"><path d="' + MARK_D + '" fill="none" stroke="#fff" stroke-width="22" stroke-linejoin="round"/></mask></defs>' +
      '<path class="gs-ec-out" d="' + MARK_D + '" pathLength="1" fill="none" style="stroke:var(--accent-300)" stroke-width="25" stroke-linejoin="round"/>' +
      '<path class="gs-ec-bg" d="' + MARK_D + '" pathLength="1" fill="none" style="stroke:var(--bg-base)" stroke-width="21" stroke-linejoin="round"/>' +
      '<rect class="gs-ec-fill" width="200" height="200" fill="url(#' + id + '-h)" mask="url(#' + id + '-k)"/></svg>' +
      (o.line ? '<p class="gs-ec-line">' + esc(o.line) + "</p>" : "") +
      (o.url ? '<span class="gs-ec-url">' + esc(o.url) + "</span>" : "") +
      (o.status ? '<span class="gs-ec-status"><i></i>' + esc(zero(o.status)) + "</span>" : "");
    el.appendChild(box);
    var q = function (s) { return box.querySelector(s); };
    var last = 0;
    var draw = function (t) {
      last = t;
      var a = seg(t, 0, 0.3);
      box.style.opacity = String(a); bg.c.style.opacity = String(a);
      bg.ctx.clearRect(0, 0, bg.w, bg.h);
      plane(bg.ctx, rgbOf(el), bg.w, bg.h, { dir: 1, cy: bg.h * (bg.w < bg.h ? 0.7 : 0.68), gap: bg.h * 0.04, cols: bg.w < bg.h ? 22 : 36, phase: t / 2.4 });
      var d = eio(seg(t, 0.2, 1.5));
      [".gs-ec-out", ".gs-ec-bg"].forEach(function (s) { q(s).style.strokeDasharray = "1 1"; q(s).style.strokeDashoffset = String(1 - d); });
      q(".gs-ec-fill").style.opacity = String(seg(t, 1.3, 1.8));
      [[".gs-ec-line", 1.5], [".gs-ec-url", 1.9], [".gs-ec-status", 2.2]].forEach(function (p) {
        var n = q(p[0]);
        if (!n) return;
        var r = eo(seg(t, p[1], p[1] + 0.5));
        n.style.opacity = String(r); n.style.transform = "translateY(" + (1 - r) * 12 + "px)";
      });
    };
    bg.redraw = function () { draw(last); };
    var api = runner(el, draw, { dur: 5, rest: 5, loop: !!o.loop, gap: 1 });
    draw(reduced() ? 5 : 0);
    if (o.autoplay !== false) api.play();
    return api;
  };
})();

/* ── part: structure.js ── */
/* Structure parts for the Ground Station bundle: grain, perspective grid,
   the M3 mark and its brand menu, the logo band, the side-sheet drawer and
   the redaction device. Ported from the M3 console landings (grid.ts,
   Mark.astro, BrandMenu.astro, Drawer.astro, console/6.astro). */
(function () {
  window.GS = window.GS || {};
  var GS = window.GS;
  var reduced = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };
  var hoverless = function () { return !!(window.matchMedia && matchMedia("(hover: none)").matches); };
  var ico = function (n) { return GS.icon ? GS.icon(n) : ""; };
  function els(target, root) {
    if (!target) return [];
    if (typeof target === "string") return Array.prototype.slice.call((root || document).querySelectorAll(target));
    if (target.nodeType) return [target];
    return Array.prototype.slice.call(target);
  }
  function cssVar(el, name, fallback) { return getComputedStyle(el).getPropertyValue(name).trim() || fallback; }

  /* Toggles .is-off on elements while they are off screen, so CSS can pause
     their animations (grain, logo band). One observer for the page. */
  var offIO = null;
  function watchOff(el) {
    if (!("IntersectionObserver" in window)) return;
    offIO = offIO || new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("is-off", !e.isIntersecting); }); });
    offIO.observe(el);
  }

  /* ───────── Grain ───────── */
  var tileCache = {};
  /* A tile of grey static, made once, for a CSS background. The layer moves
     it with a stepped transform, so the flicker is compositor-only. */
  function noiseTile(size) {
    size = size || 160;
    if (tileCache[size]) return tileCache[size];
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d"), img = ctx.createImageData(size, size);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return (tileCache[size] = c.toDataURL("image/png"));
  }
  /* GS.grain(panels, {opacity}): prepends a .gs-grain layer to each panel
     (element, NodeList or selector) and pauses it while off screen. */
  function grain(target, o) {
    o = o || {};
    var url = noiseTile(o.size);
    return els(target).map(function (p) {
      var n = p.querySelector(":scope > .gs-grain");
      if (!n) {
        n = document.createElement("div");
        n.className = "gs-grain";
        n.setAttribute("aria-hidden", "true");
        p.insertBefore(n, p.firstChild);
      }
      n.style.backgroundImage = "url(" + url + ")";
      if (o.opacity != null) n.style.setProperty("--grain", String(o.opacity));
      if (!p.parentElement || !p.parentElement.classList.contains("gs-bento")) p.classList.add("gs-grained");
      watchOff(p);
      return n;
    });
  }
  grain.tile = noiseTile;

  /* ───────── PerspectiveGrid ─────────
     A ceiling and a floor in one-point perspective, converging on the
     horizon and stopping short of it, so copy sits in an empty band.
     Horizontal lines drift toward the viewer; the tile under the pointer
     lights and fades; a click sends rings of tiles across the plane. */
  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }
  function grid(canvas, o) {
    o = o || {};
    var gap = o.gap == null ? 0.22 : o.gap, ceiling = o.ceiling !== false, floor = o.floor !== false;
    var columns = o.columns || 22, period = o.period || 5, horizon = o.horizon == null ? 0.5 : o.horizon;
    var curve = o.curve == null ? 0.08 : o.curve, sparkle = !!o.sparkle, fps = o.fps || 30;
    // Colours come from CSS so each page can retint the grid; the signal by default.
    var accent = cssVar(canvas, "--accent-rgb", "95, 227, 192");
    var LINE = cssVar(canvas, "--grid-rgb", accent), TILE = cssVar(canvas, "--tile-rgb", accent), GLOW = cssVar(canvas, "--glow-rgb", accent);
    var size = fit(canvas);
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 }, hover = { x: -1, y: -1, in: false }, clickAt = null;
    var lit = new Map(); // "plane,row,col" (plane 1 floor, -1 ceiling) → glow 0..1
    var ZMAX = 4.5, STEPS = 40, timers = [];

    function draw(t) {
      var ctx = size.ctx, w = size.w, h = size.h;
      ctx.clearRect(0, 0, w, h);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      var cx = w / 2 + pointer.x * 24, cy = h * horizon + pointer.y * 12;
      var g = h * gap, sp = w / columns;
      var T = reduced() ? 0.35 : t / period, phase = T % 1, scroll = Math.floor(T);
      var mx = w / 2, my = h / 2;
      // Barrel warp around the centre, as on a curved CRT.
      function warp(x, y) {
        var nx = (x - mx) / mx, ny = (y - my) / my, k = 1 / (1 + curve * (nx * nx + ny * ny) * 0.5);
        return [mx + (x - mx) * k, my + (y - my) * k];
      }
      function line(x0, y0, x1, y1) {
        for (var i = 0; i <= STEPS; i++) {
          var f = i / STEPS, p = warp(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f);
          if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
        }
      }
      function unwarp(X, Y) {
        var x = X, y = Y;
        for (var i = 0; i < 5; i++) {
          var nx = (x - mx) / mx, ny = (y - my) / my, f = 1 + curve * (nx * nx + ny * ny) * 0.5;
          x = mx + (X - mx) * f; y = my + (Y - my) * f;
        }
        return [x, y];
      }
      var over = 1.6, left = mx - mx * over, right = mx + mx * over;

      function paintTiles(dir, start, edge) {
        var K = g * ZMAX;
        var off = function (y) { return dir * (y - cy); };
        var r, q;
        if (hover.in) {
          r = canvas.getBoundingClientRect(); q = unwarp(hover.x - r.left, hover.y - r.top);
          if (off(q[1]) > g + 1) {
            var z = K / off(q[1]);
            var row = Math.floor(ZMAX - phase - z) - scroll;
            var col = Math.round(((q[0] - cx) / sp) * (g / off(q[1])));
            lit.set(dir + "," + row + "," + col, 1);
          }
        }
        if (clickAt) {
          r = canvas.getBoundingClientRect(); q = unwarp(clickAt.x - r.left, clickAt.y - r.top);
          if (off(q[1]) > g + 1) {
            clickAt = null;
            var local0 = Math.floor(ZMAX - phase - K / off(q[1]));
            var col0 = Math.round(((q[0] - cx) / sp) * (g / off(q[1])));
            var R = Math.ceil(columns * 1.2), rows = Math.ceil(ZMAX) + 1, rings = [], scroll0 = scroll;
            for (var lr = 0; lr < rows; lr++) for (var dc = -R; dc <= R; dc++) {
              var d = Math.round(Math.hypot(dc, (lr - local0) * 1.5));
              if (d > R) continue;
              (rings[d] = rings[d] || []).push([lr, col0 + dc]);
            }
            rings.forEach(function (cells, d) {
              timers.push(setTimeout(function () {
                cells.forEach(function (c) { lit.set(dir + "," + (c[0] - scroll0) + "," + c[1], 1 - d / (R + 6)); });
                kick();
              }, reduced() ? 0 : d * 28));
            });
          }
        }
        if (!lit.size) return;
        var yAt = function (z) {
          var y = z <= 0.02 ? edge : cy + dir * (K / z);
          return dir === 1 ? Math.min(edge, y) : Math.max(edge, y);
        };
        var xAt = function (u, y) { return cx + u * sp * (off(y) / g); };
        lit.forEach(function (glow, key) {
          var k = key.split(",").map(Number);
          if (k[0] !== dir) return;
          var local = k[1] + scroll, zFar = ZMAX - phase - local, zNear = zFar - 1;
          if (zFar <= 0.02) { lit.delete(key); return; }
          var y0 = dir === 1 ? Math.max(start, yAt(zFar)) : Math.min(start, yAt(zFar)), y1 = yAt(zNear);
          var pts = [];
          var edgeTo = function (ax, ay, bx, by) { for (var i = 0; i < 8; i++) pts.push(warp(ax + (bx - ax) * (i / 8), ay + (by - ay) * (i / 8))); };
          var a = k[2] - 0.5, b = k[2] + 0.5;
          edgeTo(xAt(a, y0), y0, xAt(b, y0), y0);
          edgeTo(xAt(b, y0), y0, xAt(b, y1), y1);
          edgeTo(xAt(b, y1), y1, xAt(a, y1), y1);
          edgeTo(xAt(a, y1), y1, xAt(a, y0), y0);
          ctx.beginPath();
          pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
          ctx.closePath();
          ctx.fillStyle = "rgba(" + TILE + "," + 0.2 * glow + ")"; ctx.fill();
          ctx.strokeStyle = "rgba(" + GLOW + "," + 0.85 * glow + ")"; ctx.lineWidth = 1.2; ctx.stroke();
          var next = glow * 0.93;
          if (next < 0.03) lit.delete(key); else lit.set(key, next);
        });
      }

      var planes = [];
      if (floor) planes.push(1);
      if (ceiling) planes.push(-1);
      planes.forEach(function (dir) {
        var edge = my + dir * my * over, start = cy + dir * g;
        if (Math.abs(edge - start) <= 0) return;
        paintTiles(dir, start, edge); // tiles first, the lines draw over them
        var ws = warp(mx, start)[1], we = warp(mx, dir === 1 ? h : 0)[1];
        var grad = ctx.createLinearGradient(0, ws, 0, we);
        grad.addColorStop(0, "rgba(" + LINE + ",0)");
        grad.addColorStop(0.18, "rgba(" + LINE + ",0.16)");
        grad.addColorStop(1, "rgba(" + LINE + ",0.62)");
        ctx.strokeStyle = grad; ctx.lineWidth = 1;
        // Radials, offset half a column so no line runs down the middle.
        ctx.beginPath();
        var span = Math.ceil((mx * over + 48) / sp) + 1, j;
        for (j = -span; j < span; j++) line(cx + (j + 0.5) * sp, start, cx + (j + 0.5) * sp * ((edge - cy) / (start - cy)), edge);
        ctx.stroke();
        // Horizontals: y = cy + K / z, the farthest on the band edge.
        var K = g * ZMAX, i, z, y;
        ctx.beginPath();
        for (i = 0; i < 40; i++) {
          z = ZMAX - (i + phase);
          if (z <= 0.05) break;
          y = cy + dir * (K / z);
          if ((dir === 1 && y > edge) || (dir === -1 && y < edge)) break;
          line(left, y, right, y);
        }
        ctx.stroke();
        if (sparkle) {
          for (i = 0; i < 40; i++) {
            z = ZMAX - (i + phase);
            if (z <= 0.05) break;
            y = cy + dir * (K / z);
            if ((dir === 1 && y > edge) || (dir === -1 && y < edge)) break;
            var row = i - scroll;
            for (j = -span; j < span; j++) {
              var hsh = Math.abs(Math.sin(row * 12.9898 + j * 78.233 + dir) * 43758.5453) % 1;
              if (hsh > 0.16) continue;
              var p = warp(cx + (j + 0.5) * sp * ((y - cy) / (start - cy)), y);
              var tw = 0.5 + 0.5 * Math.sin(t * 1.6 + hsh * 60);
              var depth = Math.min(1, Math.abs(y - start) / Math.abs(edge - start) + 0.15);
              ctx.fillStyle = "rgba(" + GLOW + "," + (0.35 + 0.65 * tw) * depth + ")";
              ctx.beginPath(); ctx.arc(p[0], p[1], 1 + depth * 1.2, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
        // The band edge itself, faint and neutral.
        ctx.strokeStyle = "rgba(237,235,230,0.07)";
        ctx.beginPath(); line(left, start, right, start); ctx.stroke();
      });
    }

    // Runs while on screen. Under reduced motion it holds still and only
    // redraws on demand (hover, clicks, resizes), so tiles still answer.
    var raf = 0, last = 0, visible = true, step = 1000 / fps, settle = 0;
    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (now - last < step) return;
      last = now;
      draw(now / 1000);
      if (reduced() && !lit.size && !hover.in && --settle <= 0) { cancelAnimationFrame(raf); raf = 0; }
    }
    function kick() { settle = 30; if (!raf && visible) raf = requestAnimationFrame(tick); }
    function start() { cancelAnimationFrame(raf); raf = 0; if (visible) { if (reduced()) { draw(0); } else raf = requestAnimationFrame(tick); } }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); });
    io.observe(canvas);
    var ro = new ResizeObserver(function () { size = fit(canvas); draw(performance.now() / 1000); });
    ro.observe(canvas);
    draw(0);
    var onMove = function (e) {
      pointer.tx = reduced() ? 0 : e.clientX / innerWidth - 0.5;
      pointer.ty = reduced() ? 0 : e.clientY / innerHeight - 0.5;
      var r = canvas.getBoundingClientRect();
      hover.x = e.clientX; hover.y = e.clientY;
      hover.in = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (hover.in) kick();
    };
    // Listens on the window so a canvas behind copy (pointer-events: none) still answers.
    var onClick = function (e) {
      var r = canvas.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { clickAt = { x: e.clientX, y: e.clientY }; kick(); }
    };
    var onLeave = function () { hover.in = false; };
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("click", onClick);
    document.addEventListener("pointerleave", onLeave);
    addEventListener("scroll", onLeave, { passive: true });
    return {
      redraw: function () { draw(performance.now() / 1000); },
      destroy: function () {
        cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); timers.forEach(clearTimeout);
        removeEventListener("pointermove", onMove); removeEventListener("click", onClick);
        document.removeEventListener("pointerleave", onLeave); removeEventListener("scroll", onLeave);
      }
    };
  }

  /* ───────── Mark ───────── */
  var MARK_D = "M34 156 V76 A24 24 0 0 1 82 76 V156 M82 76 A24 24 0 0 1 106 52 H132 A23.25 23.25 0 0 1 132 98.5 H119 M119 98.5 H132 A23.25 23.25 0 0 1 132 145 H119";
  /* The standalone file (public/brand/m3-mark.svg), colours baked in. */
  var MARK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 32 162 133" width="648" height="532">\n  <title>M3</title>\n  <defs>\n' +
    '    <pattern id="h" width="3" height="200" patternUnits="userSpaceOnUse"><rect width="3" height="200" fill="rgba(95,227,192,0.42)"/><line x1="1" y1="0" x2="1" y2="200" stroke="rgba(95,227,192,0.3)" stroke-width="0.8"/></pattern>\n' +
    '    <mask id="ring" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><path d="' + MARK_D + '" fill="none" stroke="#fff" stroke-width="25" stroke-linejoin="round"/><path d="' + MARK_D + '" fill="none" stroke="#000" stroke-width="21" stroke-linejoin="round"/></mask>\n' +
    '    <mask id="band" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><path d="' + MARK_D + '" fill="none" stroke="#fff" stroke-width="22" stroke-linejoin="round"/></mask>\n' +
    '  </defs>\n  <rect width="200" height="200" fill="#8fefd5" mask="url(#ring)"/>\n  <rect width="200" height="200" fill="url(#h)" mask="url(#band)"/>\n</svg>\n';
  var markUid = 0;
  /* GS.mark({height, nav, draw, label}) → SVG markup for the band logo.
     Colours follow the theme; dark grounds only. */
  function mark(o) {
    o = o || {};
    var id = "gsm" + (++markUid), cls = "gs-mark" + (o.nav ? " nav" : "") + (o.draw ? " draw" : "");
    return '<svg class="' + cls + '" viewBox="20 38 150 121" height="' + (o.height || 30) + '" role="img" aria-label="' + (o.label || "M3") + '">' +
      '<defs><pattern id="h-' + id + '" width="3" height="200" patternUnits="userSpaceOnUse"><rect width="3" height="200" class="m3-fill"/>' +
      '<line x1="1" y1="0" x2="1" y2="200" class="m3-hatch" stroke-width="0.8"/></pattern>' +
      '<mask id="k-' + id + '"><path d="' + MARK_D + '" fill="none" stroke="#fff" stroke-width="22" stroke-linejoin="round"/></mask></defs>' +
      '<path d="' + MARK_D + '" fill="none" class="m3-out" pathLength="1" stroke-width="25" stroke-linejoin="round"/>' +
      '<path d="' + MARK_D + '" fill="none" class="m3-bg" pathLength="1" stroke-width="21" stroke-linejoin="round"/>' +
      '<rect class="m3-tex" x="0" y="0" width="200" height="200" fill="url(#h-' + id + ')" mask="url(#k-' + id + ')"/></svg>';
  }
  mark.path = MARK_D;
  mark.svg = MARK_SVG;
  /* Fills every [data-mark] under root: data-mark="nav draw", data-height. */
  mark.hydrate = function (root) {
    els("[data-mark]", root).forEach(function (el) {
      var f = (el.getAttribute("data-mark") || "").split(/\s+/);
      el.innerHTML = mark({ height: +(el.getAttribute("data-height") || 30), nav: f.indexOf("nav") > -1, draw: f.indexOf("draw") > -1 });
    });
  };
  /* Replays the draw-in on an element holding a .gs-mark.draw. */
  mark.replay = function (el) {
    var s = el.matches && el.matches(".gs-mark") ? el : el.querySelector(".gs-mark");
    if (!s) return;
    s.classList.remove("draw"); void s.getBoundingClientRect(); s.classList.add("draw");
  };

  /* ───────── BrandMenu ───────── */
  var DL = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
  /* GS.brandMenu(anchor, {svg, svgUrl, assets, openUrl, title, onClick}).
     Right click (or the ContextMenu key, or Shift+F10) on the anchor opens a
     small menu just under it: open in a new tab, copy the mark as SVG,
     download the brand assets. Arrow keys move, Esc closes. */
  function brandMenu(anchor, o) {
    o = o || {};
    var menu = document.createElement("div");
    menu.className = "gs-bmenu";
    menu.setAttribute("role", "menu");
    menu.setAttribute("aria-label", o.label || "M3 brand");
    menu.hidden = true;
    var title = o.title || "M3 · BRAND";
    menu.innerHTML =
      '<div class="gs-bmenu-head"><span class="gs-dot" aria-hidden="true"></span><span aria-label="' + title + '">' + (GS.zero ? GS.zero(title) : title) + "</span></div>" +
      '<button type="button" role="menuitem" data-act="open"><span class="gs-icell">' + ico("arrow-up-right") + "</span>Open in new tab</button><hr />" +
      '<button type="button" role="menuitem" data-act="copy"><span class="gs-icell"><svg class="gs-bmenu-glyph" viewBox="20 38 150 121" aria-hidden="true"><path d="' + MARK_D + '" fill="none" stroke="currentColor" stroke-width="22" stroke-linejoin="round"/></svg></span><span data-copy-label>Copy logo as SVG</span><span class="gs-bmenu-kbd">SVG</span></button>' +
      (o.assets
        ? '<a role="menuitem" href="' + o.assets + '" download><span class="gs-icell">' + DL + '</span>Download brand assets<span class="gs-bmenu-kbd">ZIP</span></a>'
        : '<a role="menuitem" aria-disabled="true" title="No assets file linked"><span class="gs-icell">' + DL + '</span>Download brand assets<span class="gs-bmenu-kbd">ZIP</span></a>');
    // On the body: a header with a backdrop filter would anchor a fixed menu to itself.
    (o.container || document.body).appendChild(menu);
    var svgText = o.svg || null;
    var getSvg = function () {
      if (svgText) return Promise.resolve(svgText);
      if (!o.svgUrl) return Promise.resolve(svgText = MARK_SVG);
      return fetch(o.svgUrl).then(function (r) { return r.text(); }).then(function (t) { return (svgText = t); });
    };
    var items = function () { return Array.prototype.slice.call(menu.querySelectorAll("[role=menuitem]:not([aria-disabled=true])")); };
    function close(focusBack) { if (menu.hidden) return; menu.hidden = true; if (focusBack) anchor.focus(); }
    // Always opens just under the mark, wherever the click landed.
    function open() {
      getSvg();
      var a = anchor.getBoundingClientRect();
      menu.style.left = Math.max(8, Math.min(a.left - 6, innerWidth - 276)) + "px";
      menu.style.top = a.bottom + 10 + "px";
      menu.hidden = false;
      items()[0].focus({ preventScroll: true });
    }
    anchor.setAttribute("aria-haspopup", "menu");
    anchor.addEventListener("contextmenu", function (e) { e.preventDefault(); open(); });
    anchor.addEventListener("keydown", function (e) {
      if (e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) { e.preventDefault(); open(); }
    });
    if (o.onClick) anchor.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      o.onClick(e);
    });
    menu.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "open") { window.open(o.openUrl || location.href.split("#")[0], "_blank", "noopener"); close(); }
      if (b.dataset.act === "copy") {
        var label = menu.querySelector("[data-copy-label]");
        var done = function (ok) { label.textContent = ok ? "Copied" : "Copy failed"; setTimeout(function () { label.textContent = "Copy logo as SVG"; close(true); }, 900); };
        var fallback = function () {
          // Older browsers and some embedded views refuse the clipboard API.
          var ta = document.createElement("textarea");
          ta.value = svgText || MARK_SVG; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          var ok = false; try { ok = document.execCommand("copy"); } catch (x) { ok = false; }
          ta.remove(); done(ok);
        };
        // Write straight away, while the click still counts as a user action.
        if (navigator.clipboard && svgText) navigator.clipboard.writeText(svgText).then(function () { done(true); }, fallback);
        else getSvg().then(function (t) { return navigator.clipboard.writeText(t); }).then(function () { done(true); }, fallback);
      }
    });
    var link = menu.querySelector("a[download]");
    if (link) link.addEventListener("click", function () { setTimeout(close, 100); });
    var onDown = function (e) { if (!menu.hidden && !menu.contains(e.target)) close(); };
    var onKey = function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(true); return; }
      if (e.key === "Tab") { close(); return; }
      var list = items(), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      if (e.key === "Home") { e.preventDefault(); list[0].focus(); }
      if (e.key === "End") { e.preventDefault(); list[list.length - 1].focus(); }
    };
    var onScroll = function () { close(); };
    addEventListener("pointerdown", onDown);
    addEventListener("keydown", onKey);
    addEventListener("scroll", onScroll, { passive: true });
    return {
      el: menu, open: open, close: function () { close(); },
      destroy: function () { removeEventListener("pointerdown", onDown); removeEventListener("keydown", onKey); removeEventListener("scroll", onScroll); menu.remove(); }
    };
  }

  /* ───────── LogoBand ───────── */
  /* GS.logoBand(el, {orgs, speed}): fills a .gs-logoband with one cell per
     org, then a second, hidden copy so the loop is seamless. org: {name,
     logo?, href?, solid?, height?}. Without a logo the name is set as a
     wordmark. Pauses on hover, on focus and while off screen. */
  function logoBand(el, o) {
    o = o || {};
    var row = el.querySelector(".gs-logoband-row");
    if (!row) { row = document.createElement("div"); row.className = "gs-logoband-row"; el.appendChild(row); }
    if (o.orgs) {
      var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
      var cell = function (org, copy) {
        var tag = org.href ? "a" : "span";
        return "<" + tag + ' class="gs-logoband-org' + (org.solid ? " solid" : "") + '"' +
          (org.href ? ' href="' + esc(org.href) + '" target="_blank" rel="noopener"' : "") + ' title="' + esc(org.name) + '"' +
          (copy ? ' aria-hidden="true" tabindex="-1"' : "") + ">" +
          (org.logo ? '<img src="' + esc(org.logo) + '" alt="' + esc(org.name) + '" decoding="async"' + (org.height ? ' style="height:' + org.height + 'px"' : "") + " />"
            : '<span class="gs-wordmark">' + esc(org.name) + "</span>") + "</" + tag + ">";
      };
      row.innerHTML = o.orgs.map(function (x) { return cell(x, false); }).join("") + o.orgs.map(function (x) { return cell(x, true); }).join("");
    } else if (!row.dataset.doubled) {
      // Markup given: duplicate it once for the seamless loop.
      Array.prototype.slice.call(row.children).forEach(function (c) {
        var k = c.cloneNode(true); k.setAttribute("aria-hidden", "true"); k.setAttribute("tabindex", "-1"); row.appendChild(k);
      });
    }
    row.dataset.doubled = "1";
    if (o.speed) el.style.setProperty("--speed", o.speed + "s");
    watchOff(el);
    return el;
  }

  /* ───────── Drawer ───────── */
  /* GS.drawer({root}): one side sheet for the page. Any element with
     data-drawer="<id>" opens it with the contents of <template id="<id>">
     (its data-title fills the Ø caps header). Native <dialog>: Esc, focus
     trapping and the backdrop come for free; focus returns to the opener. */
  var sheetApi = null;
  function drawer(o) {
    o = o || {};
    if (sheetApi) return sheetApi;
    var sheet = document.createElement("dialog");
    sheet.className = "gs-drawer";
    sheet.setAttribute("aria-labelledby", "gs-drawer-title");
    sheet.innerHTML = '<div class="gs-drawer-head"><span id="gs-drawer-title" class="gs-label"></span>' +
      '<button class="gs-icell" type="button" data-drawer-close aria-label="Close">' + ico("x") + "</button></div>" +
      '<div class="gs-drawer-body"></div>';
    // Inside the .gs root when there is one, so the tokens and fonts apply.
    (o.root || document.querySelector(".gs") || document.body).appendChild(sheet);
    var body = sheet.querySelector(".gs-drawer-body"), title = sheet.querySelector("#gs-drawer-title"), opener = null;
    function open(id, from) {
      var tpl = document.getElementById(id);
      if (!tpl || !tpl.content) return false;
      opener = from || document.activeElement;
      body.replaceChildren(tpl.content.cloneNode(true));
      var t = tpl.getAttribute("data-title") || "";
      title.setAttribute("aria-label", t);
      title.textContent = GS.zero ? GS.zero(t) : t;
      if (GS.hydrate) GS.hydrate(sheet);
      if (sheet.showModal) sheet.showModal(); else sheet.setAttribute("open", "");
      sheet.scrollTop = 0;
      return true;
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-drawer]");
      if (!t) return;
      if (open(t.getAttribute("data-drawer"), t)) e.preventDefault();
    });
    sheet.querySelector("[data-drawer-close]").addEventListener("click", function () { sheet.close(); });
    // A click on the backdrop lands on the dialog itself: close.
    sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.close(); });
    sheet.addEventListener("close", function () { if (opener && opener.focus) opener.focus(); });
    return (sheetApi = { el: sheet, open: function (id) { return open(id); }, close: function () { sheet.close(); } });
  }

  /* ───────── Redaction ───────── */
  /* GS.redact(hosts, {delay}): on touch screens (no hover), lifts the
     .gs-redact blur inside each host a beat after most of it is on screen.
     On pointer screens, hover and focus lift it in CSS; this does nothing. */
  function redact(target, o) {
    o = o || {};
    var hosts = els(target || ".gs-redact-host");
    if (!hoverless() || !("IntersectionObserver" in window)) return hosts;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        setTimeout(function () { e.target.classList.add("is-seen"); }, o.delay == null ? 700 : o.delay);
        io.unobserve(e.target);
      });
    }, { threshold: o.threshold || 0.6 });
    hosts.forEach(function (h) { io.observe(h); });
    return hosts;
  }

  GS.grain = grain;
  GS.grid = grid;
  GS.mark = mark;
  GS.brandMenu = brandMenu;
  GS.logoBand = logoBand;
  GS.drawer = drawer;
  GS.redact = redact;
})();
/* parts:end */
