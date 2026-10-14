// Roots — motor. Ingeniería inversa de Root Toy (nicolino.zip/root-toy): mismo algoritmo y mismos parámetros.
//   1. La palabra se dibuja en un canvas y se convierte en un campo de distancia con signo (EDT exacta, Felzenszwalb).
//   2. Cada letra lanza un tallo desde su borde inferior, con presupuesto proporcional a su perímetro.
//   3. El tallo es una partícula de paso fijo que se agarra al contorno (a dTarget px), avanza por la tangente,
//      con ruido, algo de subida, repulsión de lo ya crecido y una "correa" que la frena si se aleja. Cada tanto
//      "envuelve" la letra cruzándola al otro lado. Las ramas alternan delante / detrás de la letra.
//   4. Render por capas: tallos de atrás, hojas de atrás, letra, tallos de adelante, hojas de adelante.
// Todo es determinista: la misma semilla da el mismo dibujo.

// ── utilidades ───────────────────────────────────────────────────────────────────────────────────────────────
export function rng(seed) {
  let t = seed >>> 0;
  return () => {
    let e = Math.imul((t = (t + 0x6d2b79f5) >>> 0) ^ (t >>> 15), 1 | t);
    return (((e = (e + Math.imul(e ^ (e >>> 7), 61 | e)) ^ e) ^ (e >>> 14)) >>> 0) / 0x100000000;
  };
}
const V = (x, y) => ({ x, y });
const scale = (a, k) => ({ x: a.x * k, y: a.y * k });
const perp = (a) => ({ x: -a.y, y: a.x });
const neg = (a) => ({ x: -a.x, y: -a.y });
const dot = (a, b) => a.x * b.x + a.y * b.y;
const norm = (a) => { const l = Math.hypot(a.x, a.y); return l > 1e-9 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 }; };
const sum = (...vs) => { let x = 0, y = 0; for (const v of vs) { x += v.x; y += v.y; } return { x, y }; };
const angle = (a) => Math.atan2(a.y, a.x);
const fromAngle = (t) => ({ x: Math.cos(t), y: Math.sin(t) });
const UP = { x: 0, y: -1 };
export const easeOut = (e) => 1 - (1 - e) ** 3;

function noise1(seed) {
  const r = rng(seed), tab = new Float32Array(256);
  for (let i = 0; i < 256; i++) tab[i] = 2 * r() - 1;
  return (x) => { const i = Math.floor(x), f = x - i, a = tab[255 & i]; return a + (tab[(i + 1) & 255] - a) * (f * f * (3 - 2 * f)); };
}

// ── parámetros (a 512 px de cuerpo; se escalan con el tamaño del texto) ───────────────────────────────────
export const PARAMS = {
  stepSize: 1.5, maxTurn: 0.12, dTarget: 6, sigma: 24, homing: 0.42, wUp: 0.03, wGrip: 0.95, wSeek: 0.6, seekScale: 12,
  wNoise: 0.25, noiseFreq: 0.02, arcPerPerimeter: 0.63, maxSteps: 1600, climbBias: 0.1, stallSteps: 75, strayLimit: 70,
  wWrap: 0.85, wrapMargin: 32, maxReach: 85, maxReachSide: 26, bridgeChance: 0.18, bridgeReachSide: 190, leashWidth: 22,
  wLeash: 1.4, cutoffSlack: 1.3, cutoffJitter: 0.14, wrapPeriod: 200, maxDepth: 2, branchEvery: 170, branchesPerStem: 2,
  branchAngle: 0.85, branchDecay: 0.6, sproutArc: 70, regrowths: 3, regrowMin: 60, columnLeash: 8, leafEvery: 165,
  leafJitter: 0.35, leafAngle: 0.9, leafSize: 34, flowerEvery: 750, flowerSize: 78, selfRadius: 150, wSelf: 0.9,
  selfSlide: 1, selfIgnore: 20,
};
const SCALED = ['stepSize', 'dTarget', 'sigma', 'seekScale', 'wrapMargin', 'wrapPeriod', 'maxReach', 'maxReachSide', 'bridgeReachSide',
  'leashWidth', 'columnLeash', 'branchEvery', 'leafEvery', 'leafSize', 'flowerEvery', 'flowerSize', 'sproutArc', 'selfRadius'];

// ── cobertura (modo "capital": cada letra en su caja) ──────────────────────────────────────────────────────
const boxW = (b) => b.width ?? b.size, boxH = (b) => b.height ?? b.size;
function grownBox(b) { const t = 0.16 * b.size; return { x: b.x - t, y: b.y - t, size: b.size + 2 * t, width: boxW(b) + 2 * t, height: boxH(b) + 2 * t }; }
const inBox = (p, b) => p.x >= b.x && p.x <= b.x + boxW(b) && p.y >= b.y && p.y <= b.y + boxH(b);
class Coverage {
  constructor(bounds, seed) {
    this.bounds = bounds; this.counts = new Float32Array(36);
    const r = rng(seed);
    this.targets = Array.from({ length: 36 }, (_, n) => ({
      x: bounds.x + boxW(bounds) * (((n % 6) / 5) * 1.16 - 0.08 + (r() - 0.5) * 0.04),
      y: bounds.y + boxH(bounds) * ((Math.floor(n / 6) / 5) * 1.16 - 0.08 + (r() - 0.5) * 0.04),
    }));
  }
  visit(p, step) {
    const b = this.bounds;
    const cx = Math.max(0, Math.min(5, Math.floor(((p.x - b.x) / boxW(b)) * 6)));
    const cy = Math.max(0, Math.min(5, Math.floor(((p.y - b.y) / boxH(b)) * 6)));
    this.counts[6 * cy + cx] += step / (b.size / 6);
  }
  navigator(P, depth) {
    let target = null, since = 0;
    const box = grownBox(this.bounds), margin = 0.08 * this.bounds.size;
    return (pos, dir, arc, want, noise, repel) => {
      if (!target || Math.hypot(target.x - pos.x, target.y - pos.y) < 0.075 * box.size || arc - since > 0.8 * Math.max(boxW(box), boxH(box))) { target = this.choose(pos, dir); since = arc; }
      const toT = norm(V(target.x - pos.x, target.y - pos.y));
      const wall = {
        x: Math.max(0, 1 - (pos.x - box.x) / margin) - Math.max(0, 1 - (box.x + boxW(box) - pos.x) / margin),
        y: Math.max(0, 1 - (pos.y - box.y) / margin) - Math.max(0, 1 - (box.y + boxH(box) - pos.y) / margin),
      };
      const k = depth > 0 ? 1 : Math.min(1, arc / Math.max(1, P.sproutArc));
      const nav = norm(sum(scale(toT, 1.25), scale(noise, 0.25), scale(repel, 0.65), scale(wall, 4)));
      return norm(sum(scale(want, 1 - k), scale(nav, k)));
    };
  }
  choose(pos, dir) {
    let best = this.targets[0], bc = Infinity;
    this.targets.forEach((t, i) => {
      const dx = t.x - pos.x, dy = t.y - pos.y, d = Math.hypot(dx, dy);
      if (d < 0.1 * this.bounds.size) return;
      const c = 2 * this.counts[i] + (d / this.bounds.size) * 0.5 + 0.22 * (1 - (dx * dir.x + dy * dir.y) / d);
      if (c < bc) { bc = c; best = t; }
    });
    return best;
  }
}

// ── repulsión de lo ya crecido (rejilla espacial) ────────────────────────────────────────────────────────────
class SelfHash {
  constructor(radius, step) { this.radius = radius; this.cell = Math.max(1, radius); this.stride = Math.max(1, Math.floor(radius / Math.max(1e-6, 12 * step))); this.bins = new Map(); this.pts = []; this.since = 0; }
  key(x, y) { return x + ',' + y; }
  add(p) {
    if (++this.since < this.stride) return;
    this.since = 0;
    const i = this.pts.length; this.pts.push(p);
    const k = this.key(Math.floor(p.x / this.cell), Math.floor(p.y / this.cell)), b = this.bins.get(k);
    b ? b.push(i) : this.bins.set(k, [i]);
  }
  repel(p, ignore) {
    const last = this.pts.length - 1 - Math.ceil(ignore / this.stride);
    if (this.radius <= 0 || last < 0) return V(0, 0);
    const cx = Math.floor(p.x / this.cell), cy = Math.floor(p.y / this.cell);
    let ax = 0, ay = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const b = this.bins.get(this.key(cx + i, cy + j)); if (!b) continue;
      for (const q of b) {
        if (q > last) continue;
        const o = this.pts[q], dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
        if (d >= this.radius || d < 1e-6) continue;
        const u = 1 - d / this.radius; ax += (dx / d) * u; ay += (dy / d) * u;
      }
    }
    ax *= this.stride; ay *= this.stride;
    const l = Math.hypot(ax, ay); if (l < 1e-9) return V(0, 0);
    const k = Math.min(1, l) / l; return V(ax * k, ay * k);
  }
}

// ── un tallo ────────────────────────────────────────────────────────────────────────────────────────────────
function walkStem(field, t, P, seed, hash, ctx) {
  const noise = noise1(seed);
  const cutoff = 1 + (2 * rng(0x9e3779b9 ^ seed)() - 1) * P.cutoffJitter;
  const rnd = rng(0x85ebca6b ^ seed), tint = rng(0x27d4eb2f ^ seed)();
  let pos = { ...t.p }, dir = norm(t.dir), arc = 0;
  const points = [{ ...pos }], arcs = [0], front = [t.front], sprouts = [];
  hash.add(points[0]);
  let side = t.side, wasInside = false, lastWrap = 0, wrapDir = V(side, 0);
  const isFront = t.front, lowStart = t.p.y > ctx.midY;
  let bestY = pos.y, stall = 0, stray = 0, touched = false, lastBranch = 0, anchor = null, why = 'budget';
  const nav = ctx.coverage?.navigator(P, t.depth);
  for (let n = 0; n < t.budget; n++) {
    if (!field.contains(pos)) { why = 'outside'; break; }
    const s = field.sample(pos), g = field.gradient(pos), tg0 = perp(g);
    const tangent = dot(tg0, dir) < 0 ? neg(tg0) : tg0;
    const seek = scale(g, -(s < 0 ? -1 : Math.min(1, (s - P.dTarget) / P.seekScale)));
    const near = Math.exp(-((s - P.dTarget) ** 2) / (2 * P.sigma ** 2));
    const upness = (1 + dot(tangent, UP)) / 2;
    const grip = near * (1 - P.climbBias * (1 - upness));
    const wander = fromAngle(angle(dir) + noise(arc * P.noiseFreq) * Math.PI);
    const rep = n < P.selfIgnore ? V(0, 0) : hash.repel(pos, P.selfIgnore);
    const slide = dot(rep, g) * near * P.selfSlide;
    const self = V(rep.x - g.x * slide, rep.y - g.y * slide);
    const inside = s < 0, close = !!ctx.bounds || s < P.sigma;
    if (inside) wasInside = true;
    if (close) { touched = true; stray = 0; anchor = { p: { ...pos }, dir: { ...dir }, arc }; } else stray++;
    if ((wasInside && s > P.wrapMargin) || arc - lastWrap > P.wrapPeriod) { wrapDir = s > 0 ? scale(g, -1) : neg(wrapDir); side = -side; wasInside = false; lastWrap = arc; }
    const gx = Math.abs(g.x), sideReach = t.bridge ? P.bridgeReachSide : P.maxReachSide;
    const reach = P.maxReach * (1 - gx) + sideReach * gx;
    const leash = Math.min(1, Math.max(0, s - reach) / P.leashWidth);
    const back = scale(g, -1);
    const col = Math.min(1, (t.bridge ? 0 : Math.max(0, t.home.x0 - pos.x, pos.x - t.home.x1)) / P.columnLeash);
    const toCol = V(pos.x < t.home.x0 ? 1 : -1, 0);
    if (!ctx.bounds && s > (reach + P.leashWidth * P.cutoffSlack) * cutoff) { why = 'leash'; break; }
    const wrap = scale(wrapDir, Math.max(near, 0.3) * (1 - Math.max(leash, col)));
    const want = norm(sum(scale(UP, P.wUp), scale(tangent, P.wGrip * grip), scale(seek, P.wSeek * Math.max(near, P.homing)), scale(wander, P.wNoise),
      scale(self, P.wSelf), scale(wrap, P.wWrap), scale(back, P.wLeash * leash), scale(toCol, P.wLeash * col)));
    let goal = nav ? nav(pos, dir, arc, want, wander, rep) : want;
    if (lowStart && arc < P.sproutArc) { const e = 1 - arc / P.sproutArc; goal = norm(sum(scale(goal, 1 - e), scale(UP, e))); }
    { const a0 = angle(dir); let d = angle(goal) - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; dir = fromAngle(a0 + Math.max(-P.maxTurn, Math.min(P.maxTurn, d))); }
    const next = V(pos.x + dir.x * P.stepSize, pos.y + dir.y * P.stepSize), hab = ctx.habitat;
    if (hab && (next.x < hab.x || next.x > hab.x + boxW(hab) || next.y < hab.y || next.y > hab.y + boxH(hab))) { why = 'cell'; break; }
    if (next.y > ctx.floorY) { next.y = ctx.floorY; if (dir.y > 0) dir = norm(V(dir.x, -dir.y)); }
    pos = next; arc += P.stepSize;
    points.push({ ...pos }); arcs.push(arc); front.push(isFront); hash.add(points[points.length - 1]); ctx.coverage?.visit(pos, P.stepSize);
    if (close && t.depth < P.maxDepth && sprouts.length < P.branchesPerStem && arc - lastBranch > P.branchEvery) {
      lastBranch = arc;
      const e = sprouts.length % 2 === 0 ? P.branchAngle : -P.branchAngle;
      sprouts.push({ p: { ...pos }, dir: fromAngle(angle(dir) + e), depth: t.depth + 1, budget: Math.round(t.budget * P.branchDecay), front: !isFront, side: -side, bridge: rnd() < P.bridgeChance, startArc: t.startArc + arc, home: t.home });
    }
    if (pos.y < bestY) { bestY = pos.y; stall = 0; } else if (ctx.bounds || s < P.sigma || !touched) stall = 0; else stall++;
    if (stall > P.stallSteps) { why = 'stalled'; break; }
    if (touched && stray > P.strayLimit) { why = 'strayed'; break; }
  }
  return { stem: { points, arc: arcs, front, leaves: [], flowers: [], startArc: t.startArc, why, bounds: ctx.bounds, depth: t.depth, tint }, sprouts, spent: points.length, anchor, why };
}

function placeLeaves(stem, P, seed) {
  if (P.leafEvery <= 0 || !isFinite(P.leafEvery) || stem.points.length < 4) return;
  const r = rng(0x2545f491 ^ seed), jit = () => 1 + (2 * r() - 1) * P.leafJitter;
  let next = P.leafEvery * jit() * 0.6, sideSign = r() < 0.5 ? 1 : -1;
  for (let i = 1; i < stem.points.length - 1; i++) {
    if (stem.arc[i] < next) continue;
    next = stem.arc[i] + P.leafEvery * jit(); sideSign = -sideSign;
    const a = stem.points[i - 1], b = stem.points[i + 1], tg = norm(V(b.x - a.x, b.y - a.y));
    stem.leaves.push({ p: { ...stem.points[i] }, dir: fromAngle(angle(tg) + P.leafAngle * sideSign), arc: stem.arc[i], size: P.leafSize * jit(), kind: r() < 0.5 ? 0 : 1 });
  }
}
function placeFlowers(stem, P, seed) {
  if (P.flowerEvery <= 0 || !isFinite(P.flowerEvery) || stem.points.length < 4) return;
  const r = rng(0x9e3779b9 ^ seed), jit = () => 1 + (2 * r() - 1) * P.leafJitter;
  let next = P.flowerEvery * jit() * 0.6;
  for (let i = 1; i < stem.points.length - 1; i++) {
    if (stem.arc[i] < next) continue;
    next = stem.arc[i] + P.flowerEvery * jit();
    const a = stem.points[i - 1], b = stem.points[i + 1], tg = norm(V(b.x - a.x, b.y - a.y));
    const u = fromAngle(angle(tg) + P.leafAngle), c = fromAngle(angle(tg) - P.leafAngle);
    stem.flowers.push({ p: { ...stem.points[i] }, dir: u.y <= c.y ? u : c, arc: stem.arc[i], size: P.flowerSize * jit(), ending: Math.floor(3 * r()), tint: Math.floor(3 * r()) });
  }
}

function growTree(field, root, P, seed, hash, ctx) {
  const stems = [], queue = [root];
  let u = 0, regrow = 0;
  while (queue.length) {
    const t = queue.shift();
    const w = walkStem(field, t, P, seed + 7919 * u, hash, ctx);
    placeLeaves(w.stem, P, seed + 104729 * u);
    placeFlowers(w.stem, P, seed + 0xec4ba7 * u);
    if (ctx.bounds) { w.stem.leaves = w.stem.leaves.filter((l) => inBox(l.p, ctx.bounds)); w.stem.flowers = w.stem.flowers.filter((f) => inBox(f.p, ctx.bounds)); }
    stems.push(w.stem); queue.push(...w.sprouts); u++;
    const left = t.budget - w.spent;
    if (w.why === 'strayed' && w.anchor && regrow < P.regrowths && left > P.regrowMin) {
      const e = ++regrow % 2 === 1 ? P.branchAngle : -P.branchAngle;
      queue.push({ p: { ...w.anchor.p }, dir: fromAngle(angle(w.anchor.dir) + e), depth: t.depth, budget: left, front: t.front, side: -t.side, bridge: false, startArc: t.startArc + w.anchor.arc, home: t.home });
    }
  }
  return stems;
}
function growAll(field, seeds, P, seed, ctx, budget) {
  const hash = new SelfHash(P.selfRadius, P.stepSize), out = [];
  seeds.forEach((t, u) => {
    out.push(...growTree(field, {
      p: t.p, dir: t.dir, depth: 0, budget: budget ?? Math.min(P.maxSteps, Math.round((t.perimeter * P.arcPerPerimeter) / P.stepSize)),
      front: !ctx.coverage, side: t.dir.x >= 0 ? 1 : -1, bridge: false, startArc: 0, home: t.home,
    }, P, 101 * seed + 31 * u, hash, { ...ctx, floorY: ctx.habitat ? ctx.habitat.y + boxH(ctx.habitat) : t.floorY, midY: t.midY }));
  });
  return out;
}

// ── tipografía → máscara ─────────────────────────────────────────────────────────────────────────────────────
const splitLines = (t) => { const l = t.split('\n'); return l.length ? l : ['']; };
export async function layoutGlyph(o) {
  const font = `${o.fontWeight} ${o.fontSize}px ${o.fontFamily}`;
  await document.fonts.load(font, o.text || 'A');
  const m = document.createElement('canvas').getContext('2d');
  m.font = font; m.letterSpacing = `${o.letterSpacing}px`;
  if (o.capital) return layoutCapital(o, m);
  const lines = splitLines(o.text).map((text) => { const t = m.measureText(text); return { text, left: t.actualBoundingBoxLeft, right: t.actualBoundingBoxRight, ascent: t.actualBoundingBoxAscent, descent: t.actualBoundingBoxDescent }; });
  const lh = o.fontSize * o.lineHeight, asc = Math.max(...lines.map((l) => l.ascent), 0), desc = lines[lines.length - 1].descent;
  const tw = Math.ceil(Math.max(...lines.map((l) => l.left + l.right), 0)), th = Math.ceil(asc + lh * (lines.length - 1) + desc);
  const W = Math.max(1, Math.round(o.page?.w ?? tw + 2 * o.margin)), H = Math.max(1, Math.round(o.page?.h ?? th + 2 * o.margin));
  const ox = (W - tw) / 2, oy = (H - th) / 2;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true });
  c.font = font; c.letterSpacing = `${o.letterSpacing}px`; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
  const out = lines.map((l, i) => {
    const baseline = oy + asc + lh * i, slack = tw - (l.left + l.right);
    const x0 = ox + l.left + (o.align === 'center' ? slack / 2 : o.align === 'right' ? slack : 0);
    const words = l.text.split(' '), justify = o.align === 'justify' && i < lines.length - 1 && words.length > 1, cuts = [], runs = [];
    if (justify) {
      const gap = (tw - words.reduce((a, w) => a + m.measureText(w).width, 0)) / (words.length - 1);
      let x = ox + l.left;
      words.forEach((w, k) => {
        c.fillText(w, x, baseline); runs.push({ text: w, x, y: baseline });
        for (let j = 0; j < w.length; j++) cuts.push(x + m.measureText(w.slice(0, j)).width);
        x += m.measureText(w).width; if (k < words.length - 1) { cuts.push(x); x += gap; }
      });
      cuts.push(x);
    } else {
      c.fillText(l.text, x0, baseline); runs.push({ text: l.text, x: x0, y: baseline });
      for (let j = 0; j <= l.text.length; j++) cuts.push(x0 + m.measureText(l.text.slice(0, j)).width);
    }
    return { runs, text: l.text, baseline, glyphHeight: Math.ceil(l.ascent + l.descent), ascent: l.ascent, descent: l.descent, cuts, perimeterByColumn: new Int32Array(W) };
  });
  return scanMask(c, W, H, out);
}
function layoutCapital(o, m) {
  const rows = splitLines(o.text).map((l) => Array.from(l));
  m.letterSpacing = '0px';
  const H0 = m.measureText('H'), ascH = H0.actualBoundingBoxAscent;
  const cellH = Math.ceil(Math.max(0.68 * o.fontSize, H0.actualBoundingBoxAscent + H0.actualBoundingBoxDescent) + 0.18 * o.fontSize), pad = 0.055 * cellH;
  const cells = rows.map((r) => r.map((ch) => { const t = m.measureText(ch); return { text: ch, m: t, width: Math.max(cellH, t.actualBoundingBoxLeft + t.actualBoundingBoxRight + 2 * pad) }; }));
  const gapX = Math.max(0.04 * o.fontSize, 0.09 * o.fontSize + o.letterSpacing), gapY = Math.max(gapX, o.fontSize * (o.lineHeight - 1));
  const rowW = cells.map((r) => r.reduce((a, c) => a + c.width, 0) + Math.max(0, r.length - 1) * gapX);
  const tw = Math.max(cellH, ...rowW), th = rows.length * cellH + (rows.length - 1) * gapY;
  const W = Math.max(1, Math.round(o.page?.w ?? tw + 2 * o.margin)), H = Math.max(1, Math.round(o.page?.h ?? th + 2 * o.margin));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d', { willReadFrequently: true }); c.font = m.font; c.fillStyle = '#fff';
  const out = []; let y = (H - th) / 2;
  cells.forEach((r, i) => {
    const slack = tw - rowW[i], off = o.align === 'center' ? slack / 2 : o.align === 'right' ? slack : 0;
    const extra = o.align === 'justify' && i < rows.length - 1 && r.length > 1 ? slack / (r.length - 1) : 0;
    let x = (W - tw) / 2 + off;
    r.forEach(({ text, m: t, width }) => {
      const cx = x; x += width + gapX + extra;
      if (/\s/.test(text)) return;
      const gx = cx + (width - t.actualBoundingBoxLeft - t.actualBoundingBoxRight) / 2 + t.actualBoundingBoxLeft, base = y + (cellH + ascH) / 2;
      c.fillText(text, gx, base);
      out.push({ text, baseline: base, ascent: t.actualBoundingBoxAscent, descent: t.actualBoundingBoxDescent, glyphHeight: t.actualBoundingBoxAscent + t.actualBoundingBoxDescent,
        cuts: [cx, cx + width], cell: { x: cx, y, size: cellH, width, height: cellH }, runs: [{ text, x: gx, y: base, fontSize: o.fontSize }], perimeterByColumn: new Int32Array(W) });
    });
    y += cellH + gapY;
  });
  return scanMask(c, W, H, out);
}
function scanMask(c, W, H, lines) {
  const d = c.getImageData(0, 0, W, H).data, inside = new Uint8Array(W * H);
  for (let i = 0; i < inside.length; i++) inside[i] = +(d[4 * i + 3] > 127);
  let perimeter = 0;
  lines.forEach((l, i) => {
    const prev = lines[i - 1], next = lines[i + 1];
    const top = l.cell?.y ?? (prev ? (prev.baseline + prev.descent + l.baseline - l.ascent) / 2 : 0);
    const bot = l.cell ? l.cell.y + boxH(l.cell) : next ? (l.baseline + l.descent + next.baseline - next.ascent) / 2 : H;
    const x0 = Math.max(1, Math.floor(l.cell?.x ?? 1)), x1 = Math.min(W - 1, Math.ceil(l.cell ? l.cell.x + boxW(l.cell) : W - 1));
    for (let y = Math.max(1, Math.ceil(top)); y < Math.min(H - 1, Math.ceil(bot)); y++) for (let x = x0; x < x1; x++) {
      const k = y * W + x;
      if (inside[k] === 1 && (!inside[k - 1] || !inside[k + 1] || !inside[k - W] || !inside[k + W])) { perimeter++; l.perimeterByColumn[x]++; }
    }
  });
  return { width: W, height: H, inside, lines, perimeter };
}

// ── campo de distancia con signo (EDT exacta) ───────────────────────────────────────────────────────────────
function edt1d(f, d, v, z, n) {
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    v[++k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt(mask, W, H) {
  const g = new Float32Array(W * H);
  for (let i = 0; i < g.length; i++) g[i] = mask[i] === 1 ? 0 : 1e20;
  const n = Math.max(W, H), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < W; x++) { for (let y = 0; y < H; y++) f[y] = g[y * W + x]; edt1d(f, d, v, z, H); for (let y = 0; y < H; y++) g[y * W + x] = d[y]; }
  for (let y = 0; y < H; y++) { const r = y * W; for (let x = 0; x < W; x++) f[x] = g[r + x]; edt1d(f, d, v, z, W); for (let x = 0; x < W; x++) g[r + x] = Math.sqrt(d[x]); }
  return g;
}
export class Field {
  constructor(W, H, data) { this.width = W; this.height = H; this.data = data; }
  static fromGlyph(gl) {
    const out = new Uint8Array(gl.inside.length);
    for (let i = 0; i < out.length; i++) out[i] = +(gl.inside[i] !== 1);
    const a = edt(gl.inside, gl.width, gl.height), b = edt(out, gl.width, gl.height);
    for (let i = 0; i < a.length; i++) a[i] -= b[i];                         // + fuera de la letra, − dentro
    return new Field(gl.width, gl.height, a);
  }
  at(x, y) { const X = x < 0 ? 0 : x >= this.width ? this.width - 1 : x, Y = y < 0 ? 0 : y >= this.height ? this.height - 1 : y; return this.data[Y * this.width + X]; }
  sample(p) {
    const x = Math.floor(p.x), y = Math.floor(p.y), fx = p.x - x, fy = p.y - y;
    const a = this.at(x, y), b = this.at(x + 1, y), c = this.at(x, y + 1), d = this.at(x + 1, y + 1), u = a + (b - a) * fx;
    return u + (c + (d - c) * fx - u) * fy;
  }
  gradient(p, e = 1.5) {
    const gx = (this.sample(V(p.x + e, p.y)) - this.sample(V(p.x - e, p.y))) / (2 * e);
    const gy = (this.sample(V(p.x, p.y + e)) - this.sample(V(p.x, p.y - e))) / (2 * e);
    const l = Math.hypot(gx, gy); return l > 1e-6 ? V(gx / l, gy / l) : V(0, -1);
  }
  contains(p) { return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height; }
}

// ── caja interior de una celda (modo capital) ──────────────────────────────────────────────────────────────
export function cellStyle(cell, outline) { return { outerWidth: outline, innerWidth: outline, inset: 0.035 * cell.size, outerRadius: 0.022 * cell.size, innerRadius: 0.005 * cell.size }; }
function innerCell(cell, outline) {
  const s = cellStyle(cell, outline), k = s.inset + outline / 2;
  return { x: cell.x + k, y: cell.y + k, size: cell.size - 2 * k, width: boxW(cell) - 2 * k, height: boxH(cell) - 2 * k, radius: Math.max(0, s.innerRadius - outline / 2) };
}

// ── escena completa ─────────────────────────────────────────────────────────────────────────────────────────
// values: { size, tracking, lineHeight, branches, leaves, flowers, width, seed }  (branches/leaves/flowers/width en %, 50 = normal)
export async function buildScene(words, values, flags, page) {
  const size = values.size;
  const opts = { text: words.text, fontSize: size, fontFamily: words.fontFamily, fontWeight: words.fontWeight, margin: Math.round(0.62 * size),
    letterSpacing: values.tracking, lineHeight: values.lineHeight, align: words.align, capital: flags.capital, page };
  const glyph = await layoutGlyph(opts);
  const field = Field.fromGlyph(glyph);
  const v = size / 512, P0 = { ...PARAMS };
  for (const k of SCALED) P0[k] = PARAMS[k] * v;
  P0.noiseFreq = PARAMS.noiseFreq / v;
  const kb = values.branches / 50, kl = values.leaves / 50, kf = values.flowers / 50, kw = values.width / 50;
  const P = { ...P0, bridgeChance: flags.capital ? 0 : P0.bridgeChance, arcPerPerimeter: P0.arcPerPerimeter * kb, leafEvery: kl > 0 ? P0.leafEvery / kl : Infinity, flowerEvery: kf > 0 ? P0.flowerEvery / kf : Infinity };
  const stemWidth = 6 * v * kw, outline = 1.4 * v, stems = [];
  glyph.lines.forEach((line, li) => {
    const floor = line.cell ? line.cell.y + boxH(line.cell) : li === glyph.lines.length - 1 ? glyph.height : (line.baseline + line.descent + glyph.lines[li + 1].baseline - glyph.lines[li + 1].ascent) / 2;
    const seeds = [];
    for (let k = 0; k < line.cuts.length - 1; k++) {
      const x0 = line.cuts[k], x1 = line.cuts[k + 1];
      let per = 0; for (let x = Math.max(0, Math.floor(x0)); x < Math.min(glyph.width, Math.ceil(x1)); x++) per += line.perimeterByColumn[x];
      if (per < 40) continue;
      const top = Math.max(0, Math.floor(line.baseline - line.ascent)), ic = line.cell ? innerCell(line.cell, outline) : null;
      const bot = Math.min(glyph.height, Math.ceil(line.baseline + line.descent) + 1, ic ? Math.floor(ic.y + boxH(ic)) : Infinity);
      let minY = bot, maxY = top;
      const cx0 = Math.max(0, Math.floor(x0)), cx1 = Math.min(glyph.width, Math.ceil(x1));
      for (let y = top; y < bot; y++) { const r = y * glyph.width; for (let x = cx0; x < cx1; x++) if (glyph.inside[r + x] === 1) { if (y < minY) minY = y; if (y > maxY) maxY = y; break; } }
      if (maxY < minY) continue;
      let bx = cx0, bd = Infinity;                                                // punto del borde inferior de la letra
      for (let x = cx0; x < cx1; x++) { const d = Math.abs(field.sample(V(x, maxY))); if (d < bd) { bd = d; bx = x; } }
      if (cx0 >= cx1) continue;
      const lean = ((x0 + x1) / 2 - bx) / Math.max(1, (x1 - x0) / 2);
      seeds.push({ p: V(bx, maxY), dir: V(0.6 * Math.max(-1, Math.min(1, lean)), -1), perimeter: per, floorY: Math.min(floor, maxY + P.dTarget + stemWidth / 2 + outline), midY: (minY + maxY) / 2, home: { x0, x1 } });
    }
    if (!seeds.length) return;
    const base = { floorY: floor, midY: line.baseline - line.glyphHeight / 2, perimeter: glyph.perimeter };
    if (line.cell) {
      const seed = values.seed + 997 * li, bounds = innerCell(line.cell, outline);
      const Pc = { ...P, selfRadius: 0.09 * bounds.size, maxSteps: 2400, bridgeChance: 0, branchEvery: 0.55 * bounds.size };
      const c = (boxW(bounds) + boxH(bounds)) / 2;
      stems.push(...growAll(field, seeds, Pc, seed, { ...base, bounds, habitat: grownBox(bounds), coverage: new Coverage(bounds, seed) }, Math.min(Pc.maxSteps, Math.round((7.5 * c * Pc.arcPerPerimeter) / Pc.stepSize))));
    } else stems.push(...growAll(field, seeds, P, values.seed, base));
  });
  let totalArc = 0;
  for (const s of stems) totalArc = Math.max(totalArc, s.startArc + s.arc[s.arc.length - 1]);
  return { glyph, field, opts, stems, stemWidth, outline, taperArc: 150 * v, bloomArc: 280 * v, popArc: 40 * v, totalArc, v };
}

// color del tallo según profundidad y tinte (verde Root Toy)
export function stemTone(depth, tint) {
  const r = Math.min(depth, 3), n = tint - 0.5;
  return `hsl(${(154 + 3 * r + 16 * n).toFixed(0)} ${(68 + 14 * n).toFixed(0)}% ${(26 + 4 * r + 8 * n).toFixed(0)}%)`;
}

// ── dibujo de un tallo hasta un largo dado, con la punta afinada ──────────────────────────────────────────────
export function drawStem(ctx, stem, front, width, outline, taperArc, upTo = Infinity) {
  const pts = stem.points; if (pts.length < 2) return;
  const end = Math.min(stem.arc[stem.arc.length - 1], upTo); if (end <= 0) return;
  let lo = 0, hi = pts.length;
  while (lo < hi) { const m = (lo + hi) >>> 1; stem.arc[m] <= end ? (lo = m + 1) : (hi = m); }
  const last = lo - 1; if (last < 1) return;
  const taperFrom = Math.max(0, end - taperArc);
  let p = 0;
  while (p < last) {
    if (stem.front[p] !== front) { p++; continue; }
    let q = p; while (q < last && stem.front[q] === front) q++;
    let u = p; while (u < q && stem.arc[u] < taperFrom) u++;
    if (u > p) {
      ctx.lineWidth = width + 2 * outline; ctx.beginPath(); ctx.moveTo(pts[p].x, pts[p].y);
      for (let i = p; i < u; i++) {
        const a = pts[i - 1] ?? pts[i], b = pts[i], c = pts[i + 1], d = pts[i + 2] ?? c;
        ctx.bezierCurveTo(b.x + (c.x - a.x) / 6, b.y + (c.y - a.y) / 6, c.x - (d.x - b.x) / 6, c.y - (d.y - b.y) / 6, c.x, c.y);
      }
      ctx.stroke();
    }
    const c0 = Math.max(p, u - 1), n = Math.min(12, q - c0);
    for (let k = 0; k < n; k++) {
      const a = c0 + Math.floor(((q - c0) * k) / n), b = c0 + Math.ceil(((q - c0) * (k + 1)) / n), mid = Math.floor((a + b) / 2);
      ctx.lineWidth = width * (1 - 0.88 * (taperArc > 0 ? Math.min(1, Math.max(0, (stem.arc[mid] - taperFrom) / taperArc)) : 0)) + 2 * outline;
      ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y);
      for (let i = a + 1; i <= b; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    p = q;
  }
}
