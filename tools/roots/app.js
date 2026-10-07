import { buildScene, drawStem, stemTone, easeOut, cellStyle } from './engine.js';
import { LEAVES, FLOWER_FRAMES, FLOWER_ENDINGS, FLOWER_TINTS, PALETTE, drawSprite, spriteSVG } from './sprites.js';

// ── estado ──────────────────────────────────────────────────────────────────────────────────────────────────
const SYSTEM_FONTS = [
  ['georgia', 'Georgia', 'Georgia, serif'], ['times', 'Times', '"Times New Roman", Times, serif'], ['helvetica', 'Helvetica', 'Helvetica, Arial, sans-serif'],
  ['arialblack', 'Arial Black', '"Arial Black", Impact, sans-serif'], ['courier', 'Courier', '"Courier New", Courier, monospace'],
];
const GOOGLE_FONTS = [['Playfair Display', '400;500;600;700;800;900'], ['Fraunces', '100..900'], ['Bodoni Moda', '400;500;600;700;800;900'], ['EB Garamond', '400;500;600;700;800'],
  ['Cormorant Garamond', '300;400;500;600;700'], ['Libre Baskerville', '400;700'], ['Lora', '400;500;600;700'], ['Bitter', '100..900'], ['Abril Fatface', '400'],
  ['DM Serif Display', '400'], ['Anton', '400'], ['Archivo Black', '400'], ['Space Grotesk', '300;400;500;600;700'], ['Unica One', '400']];
const FONTS = [...SYSTEM_FONTS.map(([id, label, css]) => ({ id, label, css, kind: 'system' })),
  ...GOOGLE_FONTS.map(([family, weights]) => ({ id: 'g:' + family, label: family, css: `"${family}", serif`, kind: 'google', family, weights }))];
const FORMATS = { auto: null, '1:1': 1, '4:5': 0.8, '3:2': 1.5, '9:16': 9 / 16 };

const state = {
  words: { text: 'Root', fontFamily: 'georgia', fontWeight: 400, align: 'left' },
  values: { size: 200, tracking: 0, lineHeight: 1.1, branches: 50, leaves: 50, flowers: 50, width: 50, breeze: 75, time: 10, seed: 1 },
  ink: { fill: '#1d1d1b', stroke: '#1d1d1b' },
  paper: { tone: '#fdfce8', cellTone: '#e6e2cf' },
  flags: { capital: false, monotone: false, visible: true, wind: true, grow: true, transparent: false },
  format: 'auto',
};

const $ = (id) => document.getElementById(id);
const canvas = $('preview'), ctx = canvas.getContext('2d');
let scene = null, bornAt = performance.now(), dirty = true, building = 0, stemLayers = null, glyphLayer = null, dpr = 1;

// ── fuentes ─────────────────────────────────────────────────────────────────────────────────────────────────
const loadingFonts = new Map();
function ensureFont(id) {
  const f = FONTS.find((x) => x.id === id);
  if (!f || f.kind !== 'google') return Promise.resolve();
  if (!loadingFonts.has(id)) loadingFonts.set(id, new Promise((res) => {
    const l = document.createElement('link'); l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${f.family.replace(/ /g, '+')}:wght@${f.weights}&display=block`;
    l.onload = res; l.onerror = res; document.head.appendChild(l);
  }));
  return loadingFonts.get(id);
}
const fontCss = (id) => (FONTS.find((x) => x.id === id) || FONTS[0]).css;

// ── construir escena ───────────────────────────────────────────────────────────────────────────────────────
async function rebuild() {
  const my = ++building;
  setStatus('Creciendo…');
  await ensureFont(state.words.fontFamily);
  const words = { ...state.words, fontFamily: fontCss(state.words.fontFamily) };
  let page;
  const ratio = FORMATS[state.format];
  if (ratio) {
    const probe = await buildScene({ ...words }, { ...state.values, branches: 0, leaves: 0, flowers: 0 }, state.flags);
    const W = probe.glyph.width, H = probe.glyph.height, w = Math.max(W, H * ratio);
    page = { w: Math.round(w), h: Math.round(w / ratio) };
  }
  const s = await buildScene(words, state.values, state.flags, page);
  if (my !== building) return;
  scene = s; bornAt = performance.now(); stemLayers = null;
  dpr = Math.min(window.devicePixelRatio || 1, Math.sqrt(8e6 / (s.glyph.width * s.glyph.height)));
  canvas.width = Math.round(s.glyph.width * dpr); canvas.height = Math.round(s.glyph.height * dpr);
  canvas.style.aspectRatio = `${s.glyph.width} / ${s.glyph.height}`;
  glyphLayer = makeGlyphLayer(s, dpr);
  $('dimensionLabel').textContent = `${s.glyph.width} × ${s.glyph.height} PX`;
  setStatus(`${s.stems.length} tallos · ${s.stems.reduce((a, t) => a + t.leaves.length, 0)} hojas · ${s.stems.reduce((a, t) => a + t.flowers.length, 0)} flores`);
  dirty = true;
}
let rebuildTimer = 0;
const scheduleRebuild = () => { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(rebuild, 140); };

// ── render ──────────────────────────────────────────────────────────────────────────────────────────────────
function offscreen(w, h, k, draw) {
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, 0); x.lineCap = 'round'; x.lineJoin = 'round'; draw(x); return c;
}
function makeGlyphLayer(s, k) {
  return offscreen(s.glyph.width, s.glyph.height, k, (c) => {
    const o = s.opts;
    c.font = `${o.fontWeight} ${o.fontSize}px ${o.fontFamily}`; c.letterSpacing = `${o.capital ? 0 : o.letterSpacing}px`; c.textBaseline = 'alphabetic';
    c.fillStyle = state.ink.fill; c.strokeStyle = state.ink.stroke; c.lineWidth = s.outline; c.lineJoin = 'round'; c.miterLimit = 2;
    for (const line of s.glyph.lines) {
      if (!line.text.length) continue;
      if (line.cell) { c.save(); c.beginPath(); c.rect(line.cell.x, line.cell.y, line.cell.width, line.cell.height); c.clip(); }
      for (const r of line.runs) { c.font = `${o.fontWeight} ${r.fontSize ?? o.fontSize}px ${o.fontFamily}`; c.fillText(r.text, r.x, r.y); c.strokeText(r.text, r.x, r.y); }
      if (line.cell) c.restore();
    }
  });
}
function colors(tint) {
  if (state.flags.monotone) { const bg = state.flags.capital ? state.paper.cellTone : state.paper.tone, ink = state.ink.fill; return { ink, leafLight: bg, leafDark: bg, sepal: bg, neck: bg, heart: bg, pollen: ink, petal: bg }; }
  return { ...PALETTE, ink: '#1d1d1b', petal: FLOWER_TINTS[tint ?? 0] };
}
function stems(c, s, front, upTo) {
  for (const st of s.stems) {
    if (st.front[0] !== front) continue;
    const a = upTo - st.startArc; if (a <= 0) continue;
    c.save();
    if (st.bounds) { c.beginPath(); c.roundRect(st.bounds.x, st.bounds.y, st.bounds.width, st.bounds.height, st.bounds.radius ?? 0); c.clip(); }
    c.strokeStyle = state.flags.monotone ? state.ink.fill : '#1d1d1b';
    drawStem(c, st, front, s.stemWidth, s.outline, s.taperArc, a);
    c.strokeStyle = state.flags.monotone ? (state.flags.capital ? state.paper.cellTone : state.paper.tone) : stemTone(st.depth, st.tint);
    drawStem(c, st, front, s.stemWidth, 0, s.taperArc, a);
    c.restore();
  }
}
function foliage(c, s, front, upTo, now, pop) {
  const breeze = state.flags.wind ? state.values.breeze : 0;
  for (const st of s.stems) {
    if (st.front[0] !== front) continue;
    const u = upTo - st.startArc; if (u <= 0) continue;
    for (const lf of st.leaves) {
      if (lf.arc > u) continue;
      const n = Math.max(1, Math.min((55 * s.opts.fontSize) / 512, s.totalArc - st.startArc - lf.arc)), k = easeOut(Math.min(1, (u - lf.arc) / n));
      if (k <= 0) continue;
      const ph = 0.021 * lf.p.x + 0.013 * lf.p.y, w = (breeze / 50) * 0.182 * Math.sin(0.0016 * now + ph), p = 0.5 * Math.max(1 - k, pop) * Math.sin(0.011 * now + ph);
      c.save(); c.translate(lf.p.x, lf.p.y); c.rotate(Math.atan2(lf.dir.y, lf.dir.x) + Math.PI / 2 + w + p);
      drawSprite(c, LEAVES[lf.kind % LEAVES.length], lf.size * k, s.outline * k, colors());
      c.restore();
    }
    for (const fl of st.flowers) {
      if (fl.arc > u) continue;
      const n = u - fl.arc, span = Math.min(s.bloomArc, s.totalArc - (st.startArc + fl.arc)), d = span > 0 ? Math.min(1, n / span) : 1;
      const idx = Math.min(3, Math.max(0, Math.floor(d * 4))), sprite = idx < 3 ? FLOWER_FRAMES[idx] : FLOWER_ENDINGS[fl.ending % FLOWER_ENDINGS.length];
      const k = easeOut(Math.min(1, n / Math.min(s.popArc, Math.max(1, span)))); if (k <= 0) continue;
      const ph = 0.021 * fl.p.x + 0.013 * fl.p.y, w = (breeze / 50) * 0.182 * Math.sin(0.0016 * now + ph), p = 0.5 * Math.max(1 - k, pop) * Math.sin(0.011 * now + ph);
      c.save(); c.translate(fl.p.x, fl.p.y); c.rotate(Math.atan2(fl.dir.y, fl.dir.x) + Math.PI / 2 + w + p);
      drawSprite(c, sprite, fl.size * k, s.outline * k, colors(fl.tint));
      c.restore();
    }
  }
}
function paintFrame(c, s, now, layers, gl) {
  const W = s.glyph.width, H = s.glyph.height, elapsed = now - bornAt, T = 1000 * state.values.time;
  const prog = !state.flags.grow || T <= 0 ? 1 : Math.min(1, elapsed / T), upTo = easeOut(prog) * s.totalArc, pop = state.flags.grow ? Math.exp(-elapsed / 520) : 0;
  if (state.flags.transparent && !state.flags.monotone) c.clearRect(0, 0, W, H); else { c.fillStyle = state.paper.tone; c.fillRect(0, 0, W, H); }
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const line of s.glyph.lines) {
    const cell = line.cell; if (!cell) continue;
    const st = cellStyle(cell, s.outline);
    c.fillStyle = state.paper.cellTone; c.beginPath(); c.roundRect(cell.x, cell.y, cell.width, cell.height, st.outerRadius); c.fill();
    c.strokeStyle = state.flags.monotone ? state.ink.fill : state.ink.stroke; c.lineWidth = st.outerWidth; c.stroke();
    c.lineWidth = st.innerWidth; c.beginPath(); c.roundRect(cell.x + st.inset, cell.y + st.inset, cell.width - 2 * st.inset, cell.height - 2 * st.inset, st.innerRadius); c.stroke();
  }
  const done = prog >= 1;
  const layer = (front) => { if (!state.flags.visible) return; if (done && layers) c.drawImage(layers[front ? 'front' : 'back'], 0, 0, W, H); else stems(c, s, front, upTo); };
  const leaves = (front) => { if (state.flags.visible) foliage(c, s, front, upTo, now, pop); };
  layer(false); leaves(false);
  c.drawImage(gl, 0, 0, W, H);
  layer(true); leaves(true);
  return { done, prog };
}
function loop(now) {
  requestAnimationFrame(loop);
  if (!scene) return;
  const growing = state.flags.grow && now - bornAt < Math.max(1000 * state.values.time, 2600);
  const windy = state.flags.wind && state.values.breeze > 0;
  if (!dirty && !growing && !windy && !recording) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const r = paintFrame(ctx, scene, now, stemLayers, glyphLayer);
  if (r.done && !stemLayers && state.flags.visible) stemLayers = {
    back: offscreen(scene.glyph.width, scene.glyph.height, dpr, (c) => stems(c, scene, false, scene.totalArc)),
    front: offscreen(scene.glyph.width, scene.glyph.height, dpr, (c) => stems(c, scene, true, scene.totalArc)),
  };
  dirty = false;
}
requestAnimationFrame(loop);

// ── exportar ────────────────────────────────────────────────────────────────────────────────────────────────
function download(blob, name) { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 0); }
const slug = () => (state.words.text.replace(/\s+/g, '-').replace(/[^\w-]/g, '').toLowerCase() || 'roots') + '-' + state.values.seed;
function exportPNG() {
  if (!scene) return;
  const k = Math.min(2, Math.sqrt(3.2e7 / (scene.glyph.width * scene.glyph.height)));
  const savedBorn = bornAt; bornAt = -1e12;
  const c = offscreen(scene.glyph.width, scene.glyph.height, k, (x) => paintFrame(x, scene, 0, null, makeGlyphLayer(scene, k)));
  bornAt = savedBorn;
  c.toBlob((b) => download(b, slug() + '.png'), 'image/png');
}
const N2 = (n) => Number(n.toFixed(2));
function stemSVG(st, front, width, outline, taper) {
  const pts = st.points, last = pts.length - 1, end = st.arc[last], taperFrom = Math.max(0, end - taper), out = [];
  if (st.front[0] !== front || last < 1) return '';
  let u = 0; while (u < last && st.arc[u] < taperFrom) u++;
  if (u > 0) {
    let d = `M${N2(pts[0].x)} ${N2(pts[0].y)}`;
    for (let i = 0; i < u; i++) { const a = pts[i - 1] ?? pts[i], b = pts[i], c = pts[i + 1], e = pts[i + 2] ?? c; if (!c) break; d += `C${N2(b.x + (c.x - a.x) / 6)} ${N2(b.y + (c.y - a.y) / 6)} ${N2(c.x - (e.x - b.x) / 6)} ${N2(c.y - (e.y - b.y) / 6)} ${N2(c.x)} ${N2(c.y)}`; }
    out.push(`<path d="${d}" stroke-width="${N2(width + 2 * outline)}"/>`);
  }
  const c0 = Math.max(0, u - 1);
  for (let k = 0; k < 12; k++) {
    const a = c0 + Math.floor(((last - c0) * k) / 12), b = c0 + Math.ceil(((last - c0) * (k + 1)) / 12); if (b <= a) continue;
    const arc = st.arc[Math.min(last, Math.floor((a + b) / 2))], w = width * (1 - 0.88 * (taper > 0 ? Math.min(1, Math.max(0, (arc - taperFrom) / taper)) : 0)) + 2 * outline;
    const pl = []; for (let i = a; i <= Math.min(b, last); i++) pl.push(`${N2(pts[i].x)} ${N2(pts[i].y)}`);
    out.push(`<polyline points="${pl.join(' ')}" stroke-width="${N2(w)}"/>`);
  }
  return out.join('');
}
function exportSVG() {
  if (!scene) return;
  const s = scene, o = s.opts, mono = state.flags.monotone;
  const piece = (x, y, dir, sprite, size, cols) => `<g transform="translate(${N2(x)} ${N2(y)}) rotate(${N2((Math.atan2(dir.y, dir.x) * 180) / Math.PI + 90)})">${spriteSVG(sprite, size, s.outline, cols)}</g>`;
  const layer = (front) => {
    if (!state.flags.visible) return '';
    let g = '<g fill="none" stroke-linecap="round" stroke-linejoin="round">';
    s.stems.forEach((st, i) => {
      if (st.front[0] !== front) return;
      g += `<g${st.bounds ? ` clip-path="url(#cell-${i})"` : ''}><g stroke="${mono ? state.ink.fill : '#1d1d1b'}">${stemSVG(st, front, s.stemWidth, s.outline, s.taperArc)}</g><g stroke="${mono ? state.paper.tone : stemTone(st.depth, st.tint)}">${stemSVG(st, front, s.stemWidth, 0, s.taperArc)}</g></g>`;
    });
    g += '</g>';
    for (const st of s.stems) if (st.front[0] === front) {
      for (const lf of st.leaves) g += piece(lf.p.x, lf.p.y, lf.dir, LEAVES[lf.kind % LEAVES.length], lf.size, colors());
      for (const fl of st.flowers) g += piece(fl.p.x, fl.p.y, fl.dir, FLOWER_ENDINGS[fl.ending % FLOWER_ENDINGS.length], fl.size, colors(fl.tint));
    }
    return g;
  };
  const clips = s.stems.map((st, i) => st.bounds ? `<clipPath id="cell-${i}"><rect x="${N2(st.bounds.x)}" y="${N2(st.bounds.y)}" width="${N2(st.bounds.width)}" height="${N2(st.bounds.height)}" rx="${N2(st.bounds.radius ?? 0)}"/></clipPath>` : '').join('');
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cells = s.glyph.lines.map((l) => { const c = l.cell; if (!c) return ''; const st = cellStyle(c, s.outline);
    return `<rect x="${N2(c.x)}" y="${N2(c.y)}" width="${N2(c.width)}" height="${N2(c.height)}" rx="${N2(st.outerRadius)}" fill="${state.paper.cellTone}" stroke="${state.ink.stroke}" stroke-width="${N2(st.outerWidth)}"/><rect x="${N2(c.x + st.inset)}" y="${N2(c.y + st.inset)}" width="${N2(c.width - 2 * st.inset)}" height="${N2(c.height - 2 * st.inset)}" rx="${N2(st.innerRadius)}" fill="${state.paper.cellTone}" stroke="${state.ink.stroke}" stroke-width="${N2(st.innerWidth)}"/>`; }).join('');
  const text = s.glyph.lines.flatMap((l) => l.runs).map((r) => `<text x="${N2(r.x)}" y="${N2(r.y)}" fill="${state.ink.fill}" stroke="${state.ink.stroke}" stroke-width="${N2(s.outline)}" paint-order="fill stroke" stroke-linejoin="round" font-family="${esc(o.fontFamily)}" font-size="${N2(r.fontSize ?? o.fontSize)}" font-weight="${o.fontWeight}" letter-spacing="${N2(o.capital ? 0 : o.letterSpacing)}">${esc(r.text)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.glyph.width}" height="${s.glyph.height}" viewBox="0 0 ${s.glyph.width} ${s.glyph.height}"><defs>${clips}</defs>` +
    (state.flags.transparent && !mono ? '' : `<rect width="${s.glyph.width}" height="${s.glyph.height}" fill="${state.paper.tone}"/>`) + cells + layer(false) + text + layer(true) + '</svg>';
  download(new Blob([svg], { type: 'image/svg+xml' }), slug() + '.svg');
}
let recording = false;
function exportVideo(kind) {
  if (!scene || recording || typeof MediaRecorder === 'undefined') return;
  const type = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) { setStatus('Este navegador no graba video.'); return; }
  const rec = new MediaRecorder(canvas.captureStream(60), { mimeType: type, videoBitsPerSecond: 12e6 }), chunks = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => { recording = false; download(new Blob(chunks, { type }), slug() + (kind === 'wind' ? '-viento' : '-crece') + (type.includes('mp4') ? '.mp4' : '.webm')); setStatus('Video listo.'); };
  recording = true;
  const ms = kind === 'wind' ? (2 * Math.PI) / 0.0016 : 1000 * state.values.time + 1200;
  if (kind !== 'wind') { bornAt = performance.now(); stemLayers = null; }
  setStatus(kind === 'wind' ? 'Grabando el bucle de viento…' : 'Grabando el crecimiento…');
  rec.start(); setTimeout(() => rec.stop(), ms);
}

// ── controles ───────────────────────────────────────────────────────────────────────────────────────────────
function setStatus(t) { $('status').textContent = t; }
const fontSel = $('font');
fontSel.innerHTML = `<optgroup label="Sistema">${SYSTEM_FONTS.map(([id, l]) => `<option value="${id}">${l}</option>`).join('')}</optgroup><optgroup label="Google Fonts">${GOOGLE_FONTS.map(([f]) => `<option value="g:${f}">${f}</option>`).join('')}</optgroup><optgroup id="uploaded" label="Tus fuentes"></optgroup>`;
fontSel.value = state.words.fontFamily;
fontSel.onchange = () => { state.words.fontFamily = fontSel.value; scheduleRebuild(); };
$('text').oninput = (e) => { state.words.text = e.target.value.split('\n').slice(0, 4).join('\n').slice(0, 48); scheduleRebuild(); };
$('weight').onchange = (e) => { state.words.fontWeight = +e.target.value; scheduleRebuild(); };
$('align').onchange = (e) => { state.words.align = e.target.value; scheduleRebuild(); };
$('format').onchange = (e) => { state.format = e.target.value; scheduleRebuild(); };
const units = { size: ' px', tracking: ' px', lineHeight: '', branches: '%', leaves: '%', flowers: '%', width: '%', breeze: '%', time: ' s' };
for (const k of Object.keys(units)) {
  const el = $(k), out = $(k + 'Val');
  const show = () => { out.textContent = state.values[k] + units[k]; };
  el.value = state.values[k]; show();
  el.oninput = () => { state.values[k] = +el.value; show(); if (k === 'breeze') dirty = true; else if (k !== 'time') scheduleRebuild(); };
}
$('seed').value = state.values.seed;
$('seed').oninput = (e) => { state.values.seed = Math.max(1, Math.min(9999, +e.target.value || 1)); scheduleRebuild(); };
$('dice').onclick = () => { state.values.seed = 1 + Math.floor(Math.random() * 9999); $('seed').value = state.values.seed; scheduleRebuild(); };
for (const k of Object.keys(state.flags)) {
  const el = $('flag-' + k); el.checked = state.flags[k];
  el.onchange = () => {
    state.flags[k] = el.checked;
    if (k === 'capital') scheduleRebuild();
    else { if (k === 'monotone' || k === 'visible') stemLayers = null; if (k === 'grow' && el.checked) { bornAt = performance.now(); stemLayers = null; } if (scene) glyphLayer = makeGlyphLayer(scene, dpr); dirty = true; }
    document.body.classList.toggle('is-capital', state.flags.capital);
  };
}
for (const [id, obj, key] of [['paperTone', 'paper', 'tone'], ['cellTone', 'paper', 'cellTone'], ['inkFill', 'ink', 'fill'], ['inkStroke', 'ink', 'stroke']]) {
  const el = $(id); el.value = state[obj][key];
  el.oninput = () => { state[obj][key] = el.value; if (scene) glyphLayer = makeGlyphLayer(scene, dpr); stemLayers = null; dirty = true; };
}
$('replay').onclick = () => { bornAt = performance.now(); stemLayers = null; dirty = true; };
$('png').onclick = exportPNG;
$('svg').onclick = exportSVG;
$('videoGrow').onclick = () => exportVideo('grow');
$('videoWind').onclick = () => exportVideo('wind');
$('fontFile').onchange = async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const name = file.name.replace(/\.[^.]+$/, ''), fam = 'RootsUpload' + Date.now();
  const face = new FontFace(fam, await file.arrayBuffer()); await face.load(); document.fonts.add(face);
  const id = 'u:' + name; FONTS.push({ id, label: name, css: `"${fam}"`, kind: 'upload' });
  $('uploaded').insertAdjacentHTML('beforeend', `<option value="${id}">${name}</option>`);
  fontSel.value = id; state.words.fontFamily = id; scheduleRebuild();
};
document.body.classList.toggle('is-capital', state.flags.capital);
window.addEventListener('resize', () => { dirty = true; });
window.Roots = { state, get scene() { return scene; }, rebuild };
rebuild();
