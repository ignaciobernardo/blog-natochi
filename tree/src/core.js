// Núcleo de v20 (copia de v13 con cambios para la copa).
//
// El árbol crece desde el suelo hacia arriba. Las secciones salen de la copa:
// cada ramita nace del tronco y se estira hasta asomar fuera del follaje, y la
// etiqueta queda en su punta. Al abrir una carpeta nace una rama desde esa
// punta y sus ítems aparecen a medida que la rama los alcanza. Todo se mide en
// px de mundo (y hacia abajo, el suelo en y = 0). El dibujo lo pone un
// "renderer" aparte:
//
//   renderer.layout            parámetros de forma (ver DEFAULTS)
//   renderer.reach(p, ang)     largo de una ramita de la raíz para salir de la copa
//   renderer.build(node, L)    arma la geometría de una rama recién ubicada
//   renderer.frame(F)          dibuja un cuadro completo
//   renderer.titleAt(vw, vh)   dónde va el título (palabra suelta)
//   renderer.hud(vw, vh)       controles extra: [{text, x, y, align, action}]

import { TREE } from './data.js';
import { POSTS } from '../posts/posts.js';

export const PHI = (1 + Math.sqrt(5)) / 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (u) => 1 - Math.pow(1 - u, 3);
export const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// Una foto pegada al pasar el mouse: crece hasta ~380 px de lado largo (470 si
// es muy apaisada; como mucho 3 veces), derecha y entera dentro de la pantalla. `b` es su caja en
// pantalla; devuelve la caja agrandada y la escala.
export function photoZoom(b, vw, vh, pad = 28) {
  // las muy apaisadas (una foto grupal) crecen más, para que se vean las caras
  const L = b.w / b.h > 1.5 ? 470 : 380;
  const s = Math.max(1, Math.min(3, L / Math.max(b.w, b.h), (vw - pad * 2) / b.w, (vh - pad * 2) / b.h));
  const w = b.w * s, h = b.h * s;
  const cx = clamp(b.x + b.w / 2, pad + w / 2, vw - pad - w / 2);
  const cy = clamp(b.y + b.h / 2, pad + h / 2, vh - pad - h / 2);
  return { s, x: cx - w / 2, y: cy - h / 2, w, h };
}

// mulberry32
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// ruido de valor 1D suave en [-1, 1]
export function noise1(x, s = 0) {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return lerp(hash(i, 0, s), hash(i + 1, 0, s), u) * 2 - 1;
}

const DEFAULTS = {
  trunkHeight: 0.78, // fracción del alto de la pantalla
  trunkWobble: 0.004, // ondulación del tronco, fracción del largo
  branchWobble: 0.03,
  rootItemsFrom: 0.46, // las secciones salen de la copa, entre estas dos alturas del tronco
  rootItemsTo: 0.9,
  rootTwig: [1.38, 1.62], // ángulo de la ramita respecto del tronco (rad): casi horizontal
  rootTwigLen: [0.07, 0.11], // fracción del ancho de la pantalla
  childTwig: [0.75, 1.0],
  childTwigLen: [30, 46], // px
  childSteep: [62, 50, 74, 35, 22], // grados con que sale la rama de una carpeta abierta
  curl: 0.15, // cuánto se levanta la punta
};

// aire (px) que una rama nueva y sus etiquetas dejan alrededor de las
// etiquetas que ya están en la hoja
const CLEAR = 30;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// Las notas del blog llevan la fecha arriba; las updates ya se llaman por su fecha.
function postDoc(post, data) {
  const blocks = post.blocks.slice();
  if (data.href.startsWith('/blog/')) {
    const [y, m, d] = post.date.split('-').map(Number);
    blocks.unshift({ t: 'meta', runs: [{ s: `${MONTHS[m - 1]} ${d}, ${y}` }] });
  }
  return blocks;
}

let nextId = 1;
export class Node {
  constructor(data, parent) {
    this.id = nextId++;
    this.name = data.name;
    this.href = data.href || null;
    this.parent = parent;
    this.depth = parent ? parent.depth + 1 : 0;
    // Una rama con `text` se abre como carpeta y saca un texto (un hijo `para`).
    // Las notas y updates (posts/posts.js) también: al abrirlas, su texto se
    // imprime al lado de la rama, igual que "me". `para` es una lista de
    // bloques: {t:'p'|'li'|'h'|'meta', runs:[{s, href?}]} o {t:'img', src, w, h}.
    this.post = (data.href && POSTS[data.href]) || null;
    this.para = data.doc || null;
    this.typed = 0; // cuánto del texto ya se escribió (0..1)
    this.isDir = !!data.kids || !!data.text || !!this.post;
    // "me": párrafos con links y subrayados (`rich`), o el texto en plano
    const doc = data.rich
      ? data.rich.map((runs) => ({ t: 'p', runs }))
      : data.text
        ? [{ t: 'p', runs: [{ s: data.text }] }]
        : this.post
          ? postDoc(this.post, data)
          : null;
    // "me" puede llevar fotos pegadas (`photos`: {style, beside, items})
    if (doc && data.photos) doc.unshift({ t: 'pile', ...data.photos });
    this.kids = data.kids ? data.kids.map((k) => new Node(k, this)) : doc ? [new Node({ name: data.name + ' (texto)', doc }, this)] : [];
    this.open = false;
    // 1 = la ramita y la etiqueta a la vista; 0 = recogidas en la copa. Las
    // secciones que no abriste se recogen mientras otra está abierta.
    this.fold = 1;
    this.foldU = 1;
    this.u = 0;
    this.g = 0;
    this.branch = null; // {pts, len}
    this.geo = null; // lo que arma el renderer
    // ubicación en la rama del padre
    this.t = 0;
    this.side = 1;
    this.twig = null; // {from, to, angle}
    this.anchor = null;
    this.align = 'left';
    this.rect = null; // {x, y, w, h} de la etiqueta, en mundo
  }
  get root() {
    return this.depth === 0;
  }
}

// ---------------------------------------------------------------------------
// ocupación: puntos de ramas en una grilla gruesa + rectángulos de etiquetas

const CELL = 10;
const ckey = (ix, iy) => (ix + 100000) * 200003 + (iy + 100000);
class Occ {
  constructor() {
    this.cells = new Set();
    this.list = []; // las mismas celdas, como pares ix, iy
    this.rects = [];
  }
  addPts(pts) {
    for (const p of pts) {
      const ix = Math.floor(p.x / CELL), iy = Math.floor(p.y / CELL), k = ckey(ix, iy);
      if (this.cells.has(k)) continue;
      this.cells.add(k);
      this.list.push(ix, iy);
    }
  }
  // celdas ocupadas por ramas dentro de un rect. Un rect con más celdas que
  // las ocupadas (el texto de una update larga, miles de px de alto) se
  // cuenta recorriendo las ocupadas: antes, abrir una así trababa un cuadro
  // hasta 2 s (2026-11-09). El resultado es el mismo.
  hits(r, pad = 0) {
    let n = 0;
    const x0 = Math.floor((r.x - pad) / CELL), x1 = Math.floor((r.x + r.w + pad) / CELL);
    const y0 = Math.floor((r.y - pad) / CELL), y1 = Math.floor((r.y + r.h + pad) / CELL);
    const L = this.list;
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > L.length / 2) {
      for (let i = 0; i < L.length; i += 2) if (L[i] >= x0 && L[i] <= x1 && L[i + 1] >= y0 && L[i + 1] <= y1) n++;
      return n;
    }
    for (let iy = y0; iy <= y1; iy++) for (let ix = x0; ix <= x1; ix++) if (this.cells.has(ckey(ix, iy))) n++;
    return n;
  }
}
export const overlaps = (a, b, pad = 0) =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

// ---------------------------------------------------------------------------
// forma de una rama: Bézier cúbica + ondulación, muestreada cada ~4 px

export function makePath(origin, a0, aEnd, len, wob, rand) {
  const aMid = a0 * 0.55 + aEnd * 0.45;
  const P0 = origin;
  const P3 = { x: P0.x + len * Math.cos(aMid), y: P0.y + len * Math.sin(aMid) };
  const P1 = { x: P0.x + len * 0.42 * Math.cos(a0), y: P0.y + len * 0.42 * Math.sin(a0) };
  const P2 = { x: P3.x - len * 0.3 * Math.cos(aEnd), y: P3.y - len * 0.3 * Math.sin(aEnd) };
  const n = Math.max(12, Math.round(len / 4));
  const f1 = 1.2 + rand() * 1.4, p1 = rand() * 6.28;
  const f2 = 3 + rand() * 3, p2 = rand() * 6.28;
  const amp = wob * len;
  const raw = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, m = 1 - t;
    raw.push({
      x: m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x,
      y: m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y,
      t,
    });
  }
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = raw[i], q = raw[Math.min(n, i + 1)], o = raw[Math.max(0, i - 1)];
    let tx = q.x - o.x, ty = q.y - o.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const w = (Math.sin(p.t * f1 * Math.PI + p1) + 0.35 * Math.sin(p.t * f2 * Math.PI + p2)) * amp * Math.min(1, p.t * 4);
    pts.push({ x: p.x - ty * w, y: p.y + tx * w, t: p.t, tx, ty });
  }
  return pts;
}

export function at(pts, t) {
  const f = clamp(t, 0, 1) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i;
  const a = pts[i], b = pts[i + 1];
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), tx: a.tx, ty: a.ty, t };
}

// ---------------------------------------------------------------------------

export function start(renderer, canvas) {
  const P = { ...DEFAULTS, ...(renderer.layout || {}) };
  const q = new URLSearchParams(location.search);
  const theme = q.get('theme');
  if (theme) document.documentElement.dataset.theme = theme;
  const SEED = parseInt(q.get('seed') || '7', 10);
  const SPEED = parseFloat(q.get('speed') || '1');
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const measure = document.createElement('canvas').getContext('2d');
  let vw = 0, vh = 0, dpr = 1;
  let fontSize = 15;
  const FAMILY = '"Libre Franklin", "Helvetica Neue", Arial, sans-serif';
  const font = () => `500 ${fontSize}px ${FAMILY}`;
  const textW = (s) => {
    measure.font = font();
    return measure.measureText(s).width;
  };

  const root = new Node(TREE, null);
  root.open = true;
  let active = root;
  let hover = null;
  let hoverLink = null;
  let hoverPhoto = null; // src de la foto pegada bajo el mouse
  let hoverHud = null; // control bajo el mouse (una canción de la lista)
  let hits = [];
  let hudHits = [];
  const cam = { x: 0, y: 0, tx: 0, ty: 0 };
  const state = { guides: q.has('guides') };

  // etiqueta: carpeta abierta con punto final, como "peace."
  const labelOf = (n) => (n.isDir && n.open ? n.name + '.' : n.name);
  // párrafos: se cortan en líneas al ancho de columna
  const paraW = () => (vw < 700 ? Math.min(vw - 70, 300) : 330);
  const postW = () => (vw < 700 ? Math.min(vw - 56, 360) : 440);
  const lineH = () => Math.round(fontSize * 1.6);
  // Un texto se arma en líneas al ancho de su columna. Cada palabra sabe en
  // qué carácter empieza, para escribirlo de a poco; las fotos cuentan como
  // 90 caracteres. Los links son tramos clickeables.
  const docs = new Map();
  const PILE_ROT = [-0.07, 0.05, -0.035, 0.08, -0.055, 0.03];
  function docOf(n) {
    const W = n.parent && n.parent.post ? postW() : paraW();
    const key = n.id + '|' + fontSize + '|' + W;
    if (docs.has(key)) return docs.get(key);
    const lh = lineH();
    const spW = textW(' ');
    const lines = [], imgs = [];
    let y = 0, chars = 0;
    // Fotos pegadas (las de "me"). En pantalla ancha, un collage al costado
    // de la columna que no corre el texto: cada una apenas girada y montada
    // sobre la anterior. En el teléfono van después del texto, una por fila y
    // casi a lo ancho, para que siempre se vean bien.
    const pile = n.para.find((b) => b.t === 'pile');
    const blocks = n.para.filter((b) => b.t !== 'pile');
    if (pile && vw < 700)
      // en el teléfono, después del texto: cada foto con su nota abajo (↑)
      pile.items.forEach((p, i) => {
        blocks.push({ t: 'img', pile: true, src: p.src, w: p.w, h: p.h, style: pile.style, seed: i + 1, rot: PILE_ROT[i % PILE_ROT.length] * 0.4, first: i === 0 });
        if (p.note) blocks.push({ t: 'cap', runs: [{ s: '↑ ' + p.note.replace(/\n/g, ' ') }] });
      });
    const wide = vw >= 700;
    let boxW = W, boxH = 0;
    if (pile && wide) {
      const A = pile.beside, x0 = W + 28;
      let py = 0;
      pile.items.forEach((p, i) => {
        const r = p.w / p.h;
        const L = A * (r > 1.15 ? 0.58 : 0.5); // las apaisadas, más anchas
        const w = Math.round(r >= 1 ? L : L * r), h = Math.round(r >= 1 ? L / r : L);
        const jit = ((i * 37) % 11) - 5;
        const x = x0 + (i % 2 ? A - w - 4 + jit * 0.6 : 4 + jit);
        imgs.push({ src: p.src, style: pile.style, pile: true, seed: i + 1, rot: PILE_ROT[i % PILE_ROT.length], note: p.note || '', x, y: py, w, h, c0: 0, c1: 0 });
        boxW = Math.max(boxW, x + w);
        boxH = Math.max(boxH, py + h);
        py += Math.round(h * 0.6);
      });
    }
    blocks.forEach((b, bi) => {
      if (bi > 0) y += Math.round(lh * (b.t === 'li' && blocks[bi - 1].t === 'li' ? 0.12 : b.t === 'cap' ? 0.3 : 0.55));
      if (b.t === 'img' && b.pile) {
        // una foto pegada (teléfono): casi a lo ancho, alternando el lado
        y += Math.round(lh * (b.first ? 0.75 : 0.35));
        const r = b.w / b.h;
        const w = Math.round(W * (r > 1.15 ? 1 : r < 0.87 ? 0.78 : 0.86)), h = Math.round(w / r);
        imgs.push({ src: b.src, style: b.style, pile: true, seed: b.seed, rot: b.rot, x: (b.seed - 1) % 2 ? W - w : 0, y, w, h, c0: chars, c1: chars + 90 });
        chars += 90;
        y += h;
        return;
      }
      if (b.t === 'img') {
        const h = Math.round((W * b.h) / b.w);
        imgs.push({ src: b.src, x: 0, y, w: W, h, c0: chars, c1: chars + 90 });
        chars += 90;
        y += h;
        return;
      }
      const indent = b.t === 'li' ? Math.round(fontSize * 1.1) : 0;
      // cada palabra sabe si es parte de un link o de un tramo subrayado a
      // mano (`mark`: el mismo número para todas las palabras del tramo)
      const words = [];
      let prevEndsSpace = true;
      b.runs.forEach((r, ri) => {
        // un tramo que empieza sin espacio (", based…") justo después de uno
        // que terminó sin espacio sigue pegado a la palabra anterior
        const glue = words.length && !prevEndsSpace && !/^\s/.test(r.s);
        prevEndsSpace = /\s$/.test(r.s);
        const parts = r.s.split(/\s+/);
        parts.forEach((s, pi) => {
          if (!s) return;
          const w = { s, href: r.href || null, mark: r.mark ? bi * 1000 + ri + 1 : 0 };
          if (pi === 0 && glue) {
            const prev = words[words.length - 1];
            (prev.tail ||= []).push(w);
          } else words.push(w);
        });
      });
      let line = null;
      const open = (first) => ({ y, segs: [], bullet: first && b.t === 'li', kind: b.t, end: indent });
      for (const wd of words) {
        if (!line) line = open(true);
        // una palabra con lo que lleva pegado ("dropout" + ",") no se corta
        const group = [wd, ...(wd.tail || [])];
        const ws = group.map((g) => textW(g.s));
        const gw = ws.reduce((a, b) => a + b, 0);
        let x = line.segs.length ? line.end + spW : indent;
        if (line.segs.length && x + gw > W) {
          lines.push(line);
          y += lh;
          line = open(false);
          x = indent;
        }
        group.forEach((g, gi) => {
          line.segs.push({ s: g.s, x, w: ws[gi], href: g.href, mark: g.mark, c0: chars });
          x += ws[gi];
          chars += g.s.length;
        });
        line.end = x;
        chars += 1;
      }
      if (line) {
        lines.push(line);
        y += lh;
      }
    });
    if (pile && wide) {
      // el collage se imprime de a una foto mientras se escribe el texto
      const k = pile.items.length;
      imgs.forEach((im) => {
        if (!im.pile) return;
        im.c0 = Math.round((chars * 0.85 * (im.seed - 1)) / k);
        im.c1 = Math.min(chars, im.c0 + 50);
      });
    }
    const d = { lines, imgs, w: boxW, h: Math.max(lh, y, boxH), chars: Math.max(1, chars) };
    docs.set(key, d);
    return d;
  }
  const labelRect = (n, anchor, align, text = labelOf(n)) => {
    if (n.para) {
      const d = docOf(n);
      const gap = fontSize * 0.5;
      return { x: align === 'right' ? anchor.x - gap - d.w : anchor.x + gap, y: anchor.y - lineH() / 2, w: d.w, h: d.h, doc: d };
    }
    const w = textW(text);
    const h = fontSize * 1.25;
    const gap = fontSize * 0.5;
    return { x: align === 'right' ? anchor.x - gap - w : anchor.x + gap, y: anchor.y - h / 2, w, h };
  };

  // ------------------------------------------------------------------ ubicación

  function occupancy(skip) {
    const occ = new Occ();
    const walk = (n) => {
      if (n === skip || !n.branch || !n.open) return;
      occ.addPts(n.branch.pts);
      // lo que el renderer dibujó alrededor (repisas, agujas): también ocupa
      if (n.geo && n.geo.sample) occ.addPts(n.geo.sample);
      for (const k of n.kids) {
        if (k.twig) occ.addPts([k.twig.from, k.twig.to]);
        if (k.rect) occ.rects.push(k.rect);
        if (k.isDir) walk(k);
      }
    };
    walk(root);
    return occ;
  }

  // en la vista inicial la cámara está fija: las etiquetas de la raíz tienen
  // que caber en pantalla y no pisar el título
  function rootScreenBad(r) {
    const s = rootSpot();
    const x = r.x + s.x, y = r.y + s.y;
    const m = (vw < 700 ? 12 : 24) + INS();
    let bad = 0;
    const over = Math.max(0, m - x, x + r.w - (vw - m), m - y);
    if (over > 0) bad += 2 + over / 10;
    if (overlaps({ x, y, w: r.w, h: r.h }, rootTitleRect(), 8)) bad += 3;
    return bad;
  }
  function rootTitleRect() {
    const t = renderer.titleAt(vw, vh);
    const size = Math.round(fontSize * 1.2);
    measure.font = `500 ${size}px ${FAMILY}`;
    const w = measure.measureText('natochi.').width;
    return { x: t.x - 10, y: t.y - size, w: w + 20, h: size * 2 };
  }

  function placeItems(node, pts, rand, occ, own, maxW, originX) {
    const kids = node.kids;
    const list = [];
    const placed = [];
    let conflicts = 0;
    let side = rand() < 0.5 ? -1 : 1;
    const lo = node.root ? P.rootItemsFrom : 0.22;
    const hi = node.root ? P.rootItemsTo : 0.95;
    const gap = kids.length > 1 ? (hi - lo) / (kids.length - 1) : 0;
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i];
      // un hijo solo (un texto o un único link) va en la punta de la rama
      const t0 = kids.length === 1 ? (k.para ? 0.9 : 0.93) : lo + gap * i;
      const jit = (rand() - 0.5) * gap * 0.3;
      const spread = rand();
      const twA = node.root ? P.rootTwig : P.childTwig;
      const twL = node.root ? P.rootTwigLen.map((f) => f * Math.max(vw, 700)) : P.childTwigLen;
      let pick = null;
      const dts = [0, 0.03, -0.03, 0.06, -0.06, 0.09, -0.09, 0.13, -0.13];
      const extras = [0, 0.4, 0.8];
      outer: for (const ex of extras)
        for (const s of [side, -side])
          for (const dt of dts) {
            const t = clamp(t0 + jit + dt, 0.12, 0.98);
            const p = at(pts, t);
            const ang = Math.atan2(p.ty, p.tx) + s * lerp(twA[0], twA[1], spread);
            // en la raíz la ramita se estira hasta asomar fuera de la copa
            const len = node.root && renderer.reach ? renderer.reach(p, ang) * (1 + ex * 0.2) : lerp(twL[0], twL[1], spread) * (1 + ex);
            const to = { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len };
            const natural = Math.cos(ang) < -0.15 ? 'right' : 'left';
            // en pantallas angostas la etiqueta puede ir del otro lado de la ramita
            for (const align of maxW ? [natural, natural === 'left' ? 'right' : 'left'] : [natural]) {
            const rect = labelRect(k, to, align, k.name + '.');
            let bad = 0;
            for (const o of placed) if (overlaps(o, rect, 14)) bad += 3;
            // con las etiquetas de otras ramas, más aire todavía
            for (const o of occ.rects) if (overlaps(o, rect, CLEAR)) bad += 3;
            bad += occ.hits(rect, 10);
            bad += own.hits(rect, 4);
            if (maxW) {
              const over = Math.max(0, rect.x + rect.w - (originX + maxW), originX - maxW * 0.3 - rect.x);
              if (over > 0) bad += 1 + over / 30;
            }
            if (align !== natural) bad += 0.5;
            if (node.root) bad += rootScreenBad(rect);
            // nada bajo tierra (un texto largo sí puede bajar: es papel)
            if (!k.para && rect.y + rect.h > -6) bad += 4;
            if (!pick || bad < pick.bad) pick = { bad, at: { t, side: s, twig: { from: { x: p.x, y: p.y }, to, angle: ang }, anchor: to, align, rect } };
            if (bad === 0) break outer;
            }
          }
      conflicts += pick.bad;
      placed.push(pick.at.rect);
      list.push({ node: k, at: pick.at });
      side = -pick.at.side;
    }
    return { list, conflicts };
  }

  function layoutBranch(node, origin, baseAng, len, occ, selfRect, maxW) {
    const tries = [];
    if (node.root) tries.push({ a0: -Math.PI / 2, aEnd: -Math.PI / 2, f: 1 });
    else {
      const out = Math.cos(baseAng) >= 0 ? 1 : -1;
      for (const rise of [-1, 1])
        for (const steep of P.childSteep)
          for (const f of [1, 0.8, 1.25, 0.65]) {
            const a0 = baseAng + rise * out * (steep * Math.PI) / 180;
            const aEnd = baseAng + rise * out * P.curl;
            tries.push({ a0, aEnd, f });
          }
    }
    let best = null;
    for (let i = 0; i < tries.length; i++) {
      const T = tries[i];
      const rand = rng(SEED * 7919 + node.id * 104729 + i * 31);
      const pts = makePath(origin, T.a0, T.aEnd, len * T.f, node.root ? P.trunkWobble : P.branchWobble, rand);
      const own = new Occ();
      own.addPts(pts);
      let score = i * 0.4;
      for (let j = 0; j < pts.length; j++) {
        const p = pts[j];
        // cruzar otra rama o meterse en una copa ya dibujada
        if (j > 3 && occ.cells.has(ckey(Math.floor(p.x / CELL), Math.floor(p.y / CELL)))) score += 2.5;
        // una rama no crece bajo tierra
        if (!node.root && p.y > -16) score += 4;
        for (const r of occ.rects) {
          // la etiqueta de la carpeta de la que nace sólo se ignora al arrancar
          if (r === selfRect && Math.hypot(p.x - origin.x, p.y - origin.y) < 40) continue;
          // una rama no pasa pegada a otra etiqueta: le deja aire alrededor
          const m = CLEAR;
          if (p.x > r.x - m && p.x < r.x + r.w + m && p.y > r.y - m && p.y < r.y + r.h + m) score += 2;
        }
      }
      const placed = placeItems(node, pts, rand, occ, own, maxW, origin.x);
      score += placed.conflicts * 10;
      if (maxW) {
        let x0 = Infinity, x1 = -Infinity;
        for (const p of placed.list) {
          x0 = Math.min(x0, p.at.rect.x);
          x1 = Math.max(x1, p.at.rect.x + p.at.rect.w);
        }
        if (x1 - x0 > maxW) score += (x1 - x0 - maxW) / 3;
      }
      if (!best || score < best.score) best = { score, pts, placed, len: len * T.f };
      if (score < 1) break;
    }
    for (const p of best.placed.list) Object.assign(p.node, p.at);
    node.layoutScore = { score: +best.score.toFixed(2), conflicts: best.placed.conflicts };
    node.branch = { pts: best.pts, len: best.len };
    node.geo = renderer.build(node, { vw, vh, fontSize, rng, P });
  }

  function layoutRoot() {
    const h = vh * P.trunkHeight;
    layoutBranch(root, { x: 0, y: 0 }, -Math.PI / 2, h, new Occ(), null, 0);
  }

  function layoutChild(node) {
    const occ = occupancy(node);
    const widest = Math.max(...node.kids.map((k) => textW(k.name + '.')));
    const narrow = vw < 700;
    // una rama con muchos ítems (todas las updates) puede crecer bastante: en
    // pantalla ancha hasta casi el alto de la pantalla; en el teléfono, si no
    // entra a lo ancho, sube
    const maxLen = narrow ? Math.max(120, vw - widest - 70, Math.min(vh * 0.6, 150 + 42 * node.kids.length)) : Math.max(440, Math.min(vh * 0.9, 780));
    // en pantalla ancha la rama sale más larga, para que sus ítems respiren
    const len = Math.min(maxLen, narrow ? 150 + 42 * node.kids.length : 200 + 56 * node.kids.length);
    const origin = renderer.childOrigin ? renderer.childOrigin(node) : node.anchor;
    // en el teléfono, los ítems tienen que entrar en el ancho que de verdad
    // queda: sin el marco ni los márgenes de la cámara
    const usable = vw - 2 * (Math.min(48, vw * 0.06) + INS()) - 6;
    layoutBranch(node, origin, node.twig.angle, len, occ, node.rect, narrow ? usable : 0);
  }

  function relayoutAll() {
    const walk = (n) => {
      for (const k of n.kids) if (k.isDir) {
        if (k.open) {
          layoutChild(k);
          walk(k);
        } else {
          k.branch = null;
          k.geo = null;
        }
      }
    };
    layoutRoot();
    walk(root);
  }

  // ------------------------------------------------------------------ cámara

  function extent(node, kidsOnly) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const add = (x, y) => {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    };
    if (!kidsOnly) for (const p of node.branch.pts) add(p.x, p.y);
    for (const k of node.kids) {
      if (!k.rect) continue;
      add(k.rect.x, k.rect.y);
      add(k.rect.x + k.rect.w, k.rect.y + k.rect.h);
    }
    return { x0, x1, y0, y1 };
  }

  // dónde queda la base del tronco en pantalla en la vista inicial
  const rootSpot = () => renderer.rootSpot ? renderer.rootSpot(vw, vh) : { x: vw * 0.3, y: vh - Math.max(40, vh * 0.07) };

  function lookAt(node, jump) {
    if (node.root) {
      const s = rootSpot();
      cam.tx = -s.x;
      cam.ty = -s.y;
    } else {
      const e = extent(node);
      const k = extent(node, true);
      const pad = Math.min(48, vw * 0.06) + INS();
      const fit = (a0, a1, b0, b1, size, top, bottom) =>
        a1 - a0 <= size - top - bottom ? (a0 + a1) / 2 - (size + top - bottom) / 2 + 0 : Math.min(b0 - top, Math.max(a0 - top, b1 + bottom - size));
      cam.tx = fit(e.x0, e.x1, k.x0, k.x1, vw, pad, pad);
      cam.ty = fit(e.y0, e.y1, k.y0, k.y1, vh, pad + 30, pad + 30);
    }
    clearTitle(node);
    if (jump || REDUCED) {
      cam.x = cam.tx;
      cam.y = cam.ty;
    }
  }

  // controles fijos en pantalla (volver y lo que agregue el renderer, por
  // ejemplo el reproductor). Respetan el marco de la página.
  function hudList(forActive = active) {
    const hud = [];
    const m = INS();
    if (forActive !== root) {
      const x = Math.max(16, vw * 0.03) + m, y = vh - Math.max(22, vh * 0.035) - m;
      // el renderer puede dibujar su propio "volver" (una flecha) con su caja
      const box = renderer.backBox ? renderer.backBox(vw, vh, m) : null;
      hud.push(box ? { kind: 'back', action: 'back', box } : { text: 'back', x, y, align: 'left', action: 'back' });
    }
    for (const h of renderer.hud ? renderer.hud(vw, vh, state, m, forActive === root) : []) hud.push(h);
    return hud;
  }
  // un control puede traer su propio rectángulo (`box`), si no es texto suelto
  function hudRects(hud) {
    return hud.map((h) => {
      if (h.box) return { action: h.action, ...h.box };
      const w = textW(h.text);
      return { action: h.action, x: h.align === 'right' ? h.x - w : h.x, y: h.y - fontSize, w, h: fontSize * 1.6 };
    });
  }

  // El título queda fijo en pantalla y el árbol se mueve debajo: si con la
  // cámara elegida alguna etiqueta visible cae sobre el título, se corre la
  // cámara de a poco hasta que no, sin dejar afuera los ítems de la carpeta.
  // Sin título arriba (el usuario lo pidió: le quita belleza). Lo abierto ya
  // se marca en su propia etiqueta, en negrita y con punto final.
  const SHOW_TITLE = renderer.title !== false;
  // marco de la página: cuánto se come de cada borde
  const INS = () => (renderer.inset ? renderer.inset(vw, vh) : 0);
  function titleRect() {
    if (!SHOW_TITLE) return { x: -9999, y: -9999, w: 0, h: 0 };
    const t = renderer.titleAt(vw, vh);
    const size = Math.round(fontSize * 1.2);
    measure.font = `500 ${size}px ${FAMILY}`;
    const w = measure.measureText((active.root ? 'natochi' : active.name) + '.').width;
    return { x: t.x - 10, y: t.y - size, w: w + 20, h: size * 2 };
  }
  function visibleRects() {
    const out = [];
    const walk = (n) => {
      if (!n.branch || !n.open) return;
      for (const k of n.kids) {
        if (k.rect) out.push({ r: k.rect, own: n });
        if (k.isDir && k.open) walk(k);
      }
    };
    walk(root);
    return out;
  }
  function clearTitle(node) {
    // lo fijo en pantalla: el título y los controles (de la carpeta que va a quedar abierta)
    // (lo blando y lo que flota encima, como la lista abierta, no la mueven)
    const fixed = [titleRect(), ...hudRects(hudList(deepest(root)).filter((h) => !h.soft && !h.float))];
    const rects = visibleRects();
    const base = { x: cam.tx, y: cam.ty };
    const open = [];
    const walkOpen = (n) => {
      if (!n.branch || !n.open) return;
      open.push(n);
      for (const k of n.kids) if (k.isDir) walkOpen(k);
    };
    walkOpen(root);
    const ok = (cx, cy) => {
      // tampoco puede quedar follaje debajo del título o de los controles
      if (renderer.blocks && fixed.some((T) => renderer.blocks({ x: T.x + cx - 4, y: T.y + cy - 4, w: T.w + 8, h: T.h + 8 }, open))) return false;
      for (const { r, own } of rects) {
        const s = { x: r.x - cx, y: r.y - cy, w: r.w, h: r.h };
        if (fixed.some((T) => overlaps(s, T, 6))) return false;
        if (own === node && (s.x < 0 || s.y < 0 || s.x + s.w > vw || s.y + s.h > vh)) return false;
      }
      return true;
    };
    if (ok(base.x, base.y)) return;
    for (let step = 1; step <= 8; step++)
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const cx = base.x + dx * step * 30, cy = base.y + dy * step * 30;
        if (ok(cx, cy)) {
          cam.tx = cx;
          cam.ty = cy;
          return;
        }
      }
  }

  // ------------------------------------------------------------------ navegación

  const deepest = (n) => {
    for (const k of n.kids) if (k.isDir && k.open) return deepest(k);
    return n;
  };
  function shut(n) {
    n.open = false;
    for (const k of n.kids) if (k.isDir && k.open) shut(k);
  }
  function openDir(n) {
    userScrolled = false;
    if (!n.isDir || n.open) return;
    for (const s of n.parent.kids) if (s !== n && s.isDir && s.open) shut(s);
    if (!n.branch || n.g <= 0) layoutChild(n);
    n.open = true;
    active = deepest(root);
    lookAt(n);
  }
  function closeDir(n) {
    userScrolled = false;
    if (!n.isDir || !n.open || n.root) return;
    shut(n);
    active = deepest(root);
    lookAt(n.parent);
  }
  const back = () => active !== root && closeDir(active);

  // ------------------------------------------------------------------ cuadro

  // abrir y cerrar (la rama, las otras que se recogen y el texto) van PACE veces
  // más rápido. Estuvo en 1,4 por un malentendido (el 40% era para la nota de
  // las fotos); queda en 1, como perilla. El árbol que crece al cargar no la usa
  const PACE = 1;
  const GROW = 1.1 / PACE, SHRINK = 0.55 / PACE, ROOT_GROW = 1.9;
  let last = 0;
  let time = 0;
  let dirty = true;
  let userScrolled = false;
  // ?fold=0: las otras secciones no se recogen (para comparar)
  const FOLD = q.get('fold') !== '0';
  const foldTarget = (k) => (!FOLD || (k.isDir && k.open) || k.parent === active ? 1 : 0);

  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * SPEED;
    last = now;
    time += dt;
    // cualquier valor que cambie pide un cuadro, también el último paso
    // (cuando el párrafo termina de escribirse o la rama de crecer)
    let changed = false;
    const walk = (n) => {
      const target = n.open ? 1 : 0;
      if (n.u !== target) changed = true;
      if (REDUCED) n.u = target;
      else if (n.u !== target) {
        const dur = n.root ? ROOT_GROW : n.open ? GROW : SHRINK;
        n.u = n.open ? Math.min(1, n.u + dt / dur) : Math.max(0, n.u - dt / dur);
      }
      n.g = n.open ? easeOut(n.u) : easeInOut(n.u);
      for (const k of n.kids) {
        if (k.isDir) walk(k);
        // lo que no está en el camino de lo abierto ni a mano para abrir se
        // recoge: la ramita vuelve a la copa y la etiqueta se borra
        if (!k.para) {
          const ft = foldTarget(k);
          if (k.foldU !== ft) {
            changed = true;
            k.foldU = REDUCED ? ft : ft ? Math.min(1, k.foldU + dt / (0.55 / PACE)) : Math.max(0, k.foldU - dt / (0.4 / PACE));
          }
          k.fold = easeInOut(k.foldU);
        }
        // el párrafo se escribe cuando la rama llega, y se borra rápido al cerrar
        if (k.para) {
          const target = n.open && n.g >= k.t ? 1 : 0;
          if (k.typed !== target) changed = true;
          if (REDUCED) k.typed = target;
          else if (k.typed !== target) {
            const total = docOf(k).chars;
            // un texto largo se escribe más rápido: nunca tarda más de unos 4 s
            k.typed = target ? Math.min(1, k.typed + (dt * PACE * Math.max(220, total / 4.2)) / total) : Math.max(0, k.typed - dt * 4 * PACE);
          }
        }
      }
    };
    walk(root);
    const a = 1 - Math.pow(0.03, dt);
    const moving = Math.abs(cam.tx - cam.x) > 0.05 || Math.abs(cam.ty - cam.y) > 0.05;
    cam.x += (cam.tx - cam.x) * a;
    cam.y += (cam.ty - cam.y) * a;
    if (!moving) {
      if (cam.x !== cam.tx || cam.y !== cam.ty) changed = true;
      cam.x = cam.tx;
      cam.y = cam.ty;
    }
    // sólo se redibuja si algo cambió: quieto, el sitio no gasta nada
    let growing = false;
    const busy = (n) => {
      if (n.u !== (n.open ? 1 : 0)) growing = true;
      for (const k of n.kids) {
        if (k.isDir) busy(k);
        if (!k.para && k.foldU !== foldTarget(k)) growing = true;
        if (k.para && k.typed > 0 && k.typed < 1) growing = true;
      }
    };
    busy(root);
    const anim = renderer.animating ? renderer.animating(state, time) : false;
    // Un cuadro completo redibuja la tinta y la sube a la GPU; si lo único
    // que cambió es el papel (el fondo que sigue al mouse), alcanza con
    // volver a pasar el shader sobre la tinta que ya está subida.
    const full = dirty || changed || moving || growing;
    if (full || anim) {
      dirty = false;
      const t0 = performance.now();
      frame(full);
      sampleQuality(now, full, performance.now() - t0);
    } else lastDraw = 0;
    requestAnimationFrame(step);
  }

  // Calidad adaptativa: si los cuadros completos tardan mucho (una máquina
  // lenta, o Safari, que sube la tinta a la GPU pasando por la CPU), se baja
  // la resolución interna de a un escalón hasta que el sitio fluya. Nunca por
  // debajo de 1 píxel por píxel CSS. Se recuerda para la próxima visita.
  // Que los cuadros vengan espaciados no alcanza: Safari en modo de bajo
  // consumo (y algunos monitores) da 30 cuadros por segundo aunque la página
  // no cueste nada. Por eso también se mira cuánto trabaja cada cuadro, salvo
  // que vaya claramente lento (menos de 25 por segundo).
  const QUALITY = [1, 0.8, 0.65, 0.5];
  let qi = 0;
  try {
    qi = Math.min(QUALITY.length - 1, Math.max(0, parseInt(localStorage.getItem('natochi-q2') || '0', 10) || 0));
  } catch {}
  if (q.has('quality')) qi = Math.max(0, QUALITY.indexOf(parseFloat(q.get('quality'))));
  let lastDraw = 0;
  let slow = [];
  let work = [];
  let seen = null;
  let trial = null;
  let locked = q.has('quality');
  const median = (v) => v.slice().sort((a, b) => a - b)[v.length >> 1];
  function sampleQuality(now, full, ms) {
    if (!full) return (lastDraw = 0);
    if (lastDraw) {
      slow.push(now - lastDraw);
      work.push(ms);
    }
    lastDraw = now;
    if (slow.length < 24) return;
    const gap = median(slow), busy = median(work);
    seen = { gap: Math.round(gap), busy: Math.round(busy * 10) / 10 };
    slow = [];
    work = [];
    // ¿sirvió el último escalón? Si los cuadros no quedaron al menos un
    // cuarto más livianos (o más seguidos), se vuelve a la resolución de antes
    // y no se prueba más: en Safari, por ejemplo, subir la tinta cuesta casi
    // lo mismo a cualquier tamaño, y bajar sólo haría la hoja más borrosa.
    if (trial) {
      const helped = busy < trial.busy * 0.75 || gap < trial.gap * 0.75;
      if (helped) {
        try {
          localStorage.setItem('natochi-q2', String(qi));
        } catch {}
      } else {
        qi = trial.qi;
        locked = true;
        applyQuality();
      }
      trial = null;
      return;
    }
    const base = Math.min(2, devicePixelRatio || 1);
    const tooSlow = gap > 40 || (gap > 24 && busy > 9);
    if (!locked && tooSlow && qi < QUALITY.length - 1 && base * QUALITY[qi + 1] >= 1) {
      trial = { qi, gap, busy };
      qi++;
      applyQuality();
    }
  }
  // cambia sólo la resolución de los lienzos: la hoja, la cámara y lo que se
  // está animando siguen igual
  function applyQuality() {
    const base = Math.min(2, devicePixelRatio || 1);
    dpr = Math.max(1, base * QUALITY[qi]);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    if (renderer.resize) renderer.resize(vw, vh, dpr, canvas);
    dirty = true;
  }

  function frame(full = true) {
    const branches = [];
    const items = [];
    hits = [];
    const visit = (n) => {
      if (!n.branch || n.g <= 0) return;
      branches.push(n);
      for (const k of n.kids) {
        if (k.para) {
          if (k.typed <= 0) continue;
          const r = labelRect(k, k.anchor, k.align);
          const sx = r.x - cam.x, sy = r.y - cam.y;
          const d = r.doc;
          const chars = Math.ceil(d.chars * k.typed);
          const st = { hover: false, open: false, inactive: n !== active, reveal: k.typed, lite: false };
          items.push({ node: k, para: true, doc: d, chars, lh: lineH(), text: ' ', full: null, x: sx, y: sy, align: 'left', rect: { x: sx, y: sy, w: r.w, h: r.h }, st, grow: 1 });
          hits.push({ node: k, x: sx, y: sy, w: r.w, h: r.h, inert: true });
          // links del texto, ya escritos: van primero para ganarle al párrafo
          for (const ln of d.lines)
            for (const sg of ln.segs)
              if (sg.href && chars >= sg.c0 + sg.s.length) hits.unshift({ node: k, link: sg.href, word: sg.s, x: sx + sg.x, y: sy + ln.y, w: sg.w, h: lineH() });
          // fotos pegadas ya impresas (sólo con mouse: en el teléfono no se
          // agrandan). La de arriba gana; la agrandada, con su caja grande.
          if (vw >= 700)
            for (const im of d.imgs.slice().sort((a, b) => (a.src === hoverPhoto) - (b.src === hoverPhoto))) {
              if (!im.pile || chars < im.c1) continue;
              const b = { x: sx + im.x, y: sy + im.y, w: im.w, h: im.h };
              hits.unshift({ node: k, photo: im.src, inert: true, ...(im.src === hoverPhoto ? photoZoom(b, vw, vh) : b) });
            }
          continue;
        }
        if (k.t > n.g) continue;
        if (k.fold <= 0.001) {
          if (k.isDir) visit(k);
          continue;
        }
        const reveal = Math.min(k.fold, n.g >= 0.999 ? 1 : Math.min(1, (n.g - k.t) * 8));
        const full = labelOf(k);
        const text = full.slice(0, Math.ceil(full.length * reveal));
        const r = labelRect(k, k.anchor, k.align, full);
        const sx = r.x - cam.x, sy = r.y - cam.y;
        // una etiqueta de otra rama que el borde de la pantalla cortaría no se
        // imprime: o se ve entera, con el arranque de su ramita, o no se ve
        const fx = k.twig ? k.twig.from.x - cam.x : sx, fy = k.twig ? k.twig.from.y - cam.y : sy;
        const ins = INS();
        if (n !== active && (sx < ins + 1 || sy < ins + 1 || sx + r.w > vw - ins - 1 || sy + r.h > vh - ins - 1 || fx < ins || fx > vw - ins || fy < ins || fy > vh - ins)) {
          if (k.isDir) visit(k);
          continue;
        }
        // lo que abriste (y el camino hasta ahí) va en negrita y con punto
        const strong = k.isDir && k.open;
        const st = { hover: hover === k, open: k.isDir && k.open, inactive: n !== active, reveal, strong, lite: false };
        items.push({ node: k, text, full, x: k.align === 'right' ? sx + r.w : sx, y: sy + r.h / 2, align: k.align, rect: { x: sx, y: sy, w: r.w, h: r.h }, st, grow: Math.min(1, (n.g - k.t) * 5) });
        // sólo se puede tocar lo que está entero a la vista
        if (k.fold >= 0.999) hits.push({ node: k, x: sx, y: sy, w: r.w, h: r.h });
        if (k.isDir) visit(k);
      }
    };
    visit(root);

    const title = SHOW_TITLE ? (active.root ? 'natochi' : active.name) + '.' : '';
    const tAt = renderer.titleAt(vw, vh);
    // un control blando (la nota del reproductor) que pisaría una etiqueta no va
    const hud = hudList().filter((h) => !h.soft || !hits.some((x) => !x.photo && !x.inert && overlaps(x, h.box, 4)));
    hudHits = hudRects(hud);

    // una sola tinta para todo (la tinta escasa quedó descartada)
    for (const n of branches) {
      n.inkLite = false;
      for (const k of n.kids) k.inkLite = false;
    }
    renderer.frame({ full, canvas, vw, vh, dpr, cam, time, root, active, branches, items, title, titleAt: tAt, hud, font, fontSize, state, textW, hoverLink, hoverPhoto, hoverHud, fixed: [titleRect(), ...hudHits].filter((r) => r.w > 0), redraw: () => (dirty = true) });
  }

  // ------------------------------------------------------------------ input

  const find = (list, x, y) => list.find((h) => x >= h.x - 4 && x < h.x + h.w + 4 && y >= h.y - 3 && y < h.y + h.h + 3) || null;
  // mover la hoja: rueda o arrastre, sólo si lo abierto no entra en pantalla
  function scrollBy(dy) {
    if (active.root) return;
    const e = extent(active);
    const top = e.y0 - 70, bottom = e.y1 + 70 - vh;
    if (bottom <= top) return;
    cam.ty = clamp(cam.ty + dy, Math.min(top, cam.ty), Math.max(bottom, cam.ty));
    userScrolled = true;
    dirty = true;
  }
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    scrollBy(ev.deltaY);
  }, { passive: false });
  let drag = null;
  let dragged = false;
  canvas.addEventListener('pointerdown', (ev) => {
    dragged = false;
    if (ev.pointerType !== 'mouse') drag = { y: ev.clientY };
  });
  canvas.addEventListener('pointerup', () => (drag = null));
  canvas.addEventListener('pointercancel', () => (drag = null));
  canvas.addEventListener('pointermove', (ev) => {
    if (drag) {
      const dy = drag.y - ev.clientY;
      if (dragged || Math.abs(dy) > 6) {
        dragged = true;
        drag.y = ev.clientY;
        scrollBy(dy);
        cam.y = cam.ty;
      }
    }
    const h = find(hits, ev.clientX, ev.clientY);
    const nh = h && !h.link && !h.photo ? h.node : null;
    const nl = h && h.link ? h.link : null;
    const np = h && h.photo ? h.photo : null;
    if (nh !== hover || nl !== hoverLink || np !== hoverPhoto) dirty = true;
    hover = nh;
    hoverLink = nl;
    hoverPhoto = np;
    const hh = find(hudHits, ev.clientX, ev.clientY);
    const na = hh ? hh.action : null;
    if (na !== hoverHud) dirty = true;
    hoverHud = na;
    canvas.style.cursor = (h && !h.inert) || hh ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerleave', () => {
    hover = null;
    hoverLink = null;
    hoverPhoto = null;
    hoverHud = null;
    dirty = true;
  });
  canvas.addEventListener('click', (ev) => {
    const hh = find(hudHits, ev.clientX, ev.clientY);
    if (hh) return act(hh.action);
    if (dragged) {
      dragged = false;
      return;
    }
    // algo abierto del renderer (la lista de canciones) se cierra primero
    if (renderer.dismiss && renderer.dismiss()) return (dirty = true);
    const h = find(hits, ev.clientX, ev.clientY);
    if (!h) return back();
    if (h.link) return window.open(h.link, '_blank', 'noopener');
    if (h.inert) return;
    const n = h.node;
    if (n.isDir) n.open ? closeDir(n) : openDir(n);
    else if (n.href) window.open(n.href, '_blank', 'noopener');
  });
  addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' && ev.key !== 'Backspace') return;
    if (renderer.dismiss && renderer.dismiss()) return (dirty = true);
    back();
  });
  function act(a) {
    dirty = true;
    if (renderer.act) renderer.act(a);
    if (a === 'back') back();
    if (a === 'guides') {
      state.guides = !state.guides;
      state.guidesT = time;
    }
  }

  function resize() {
    dpr = Math.max(1, Math.min(2, devicePixelRatio || 1) * QUALITY[qi]);
    vw = innerWidth;
    vh = innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px';
    canvas.style.height = vh + 'px';
    fontSize = vw < 700 ? 14 : 15;
    if (renderer.resize) renderer.resize(vw, vh, dpr, canvas);
    relayoutAll();
    lookAt(active, true);
    dirty = true;
  }
  addEventListener('resize', resize);

  // para las herramientas de captura
  window.__tree = {
    root,
    get active() {
      return active;
    },
    open(path) {
      let n = root;
      for (const name of path) {
        n = n.kids.find((k) => k.name === name);
        if (!n) throw new Error('no such node: ' + name);
        openDir(n);
      }
    },
    back,
    act,
    // fotos pegadas a la vista: [{src, x, y, w, h}] en pantalla
    photos: () => hits.filter((h) => h.photo).map(({ photo: src, x, y, w, h }) => ({ src, x, y, w, h })),
    get hoverPhoto() {
      return hoverPhoto;
    },
    where(name) {
      const h = hits.find((x) => x.node.name === name && !x.photo && !x.link);
      const m = INS();
      if (!h || h.x < m || h.y < m || h.x + h.w > vw - m || h.y + h.h > vh - m) return null;
      return { x: h.x + Math.min(h.w / 2, 20), y: h.y + h.h / 2 };
    },
    empty() {
      for (let y = vh * 0.25; y < vh * 0.8; y += 13)
        for (let x = vw * 0.92; x > vw * 0.05; x -= 13) {
          const busy = hits.some((h) => x > h.x - 30 && x < h.x + h.w + 30 && y > h.y - 20 && y < h.y + h.h + 20) || hudHits.some((h) => x > h.x - 20 && x < h.x + h.w + 20 && y > h.y - 20 && y < h.y + h.h + 20);
          if (!busy) return { x, y };
        }
      return null;
    },
    cut() {
      // un texto más alto que la pantalla se recorre moviendo la hoja: ahí
      // sólo cuenta que entre a lo ancho y que su comienzo se vea
      return hits
        .filter((h) => !h.link && !h.photo && h.node.parent === active)
        .filter((h) => h.x < INS() || h.x + h.w > vw - INS() || h.y < INS() || (h.h <= vh - 60 && h.y + h.h > vh - INS()))
        .map((h) => h.node.name);
    },
    // calidad actual (para las pruebas de rendimiento)
    get quality() {
      return { dpr, level: QUALITY[qi], seen };
    },
    // centro (px) de un link del texto abierto, por su palabra
    link(word) {
      const h = hits.find((x) => x.link && x.word === word);
      return h ? { x: h.x + h.w / 2, y: h.y + h.h / 2 } : null;
    },
    // centro (px) de un control fijo, por ejemplo 'back'
    control(action) {
      const h = hudHits.find((x) => x.action === action);
      return h ? { x: h.x + h.w / 2, y: h.y + h.h / 2 } : null;
    },
    scroll(dy) {
      scrollBy(dy);
      cam.y = cam.ty;
    },
    overlaps() {
      const out = [];
      const vis = hits.filter((h) => !h.link && !h.photo && h.x + h.w > 0 && h.x < vw && h.y + h.h > 0 && h.y < vh);
      const T = titleRect();
      if (T.w > 0) vis.push({ fixed: true, node: { name: '(título)' }, x: T.x + 10, y: T.y + T.h / 4, w: T.w - 20, h: T.h / 2 });
      for (const h of hudHits) vis.push({ fixed: true, node: { name: '(' + h.action + ')' }, x: h.x, y: h.y + 3, w: h.w, h: h.h - 6 });
      for (let i = 0; i < vis.length; i++)
        for (let j = i + 1; j < vis.length; j++) {
          const a = vis[i], b = vis[j];
          // un texto pasa por debajo del título y de "back" a propósito: ahí
          // la hoja tiene un margen que lo esconde
          if ((a.inert && b.fixed) || (b.inert && a.fixed)) continue;
          if (overlaps(a, b, 0)) out.push(a.node.name + ' / ' + b.node.name);
        }
      return out;
    },
    // true cuando no queda nada animándose (para las capturas)
    idle() {
      let busy = Math.abs(cam.x - cam.tx) > 0.5 || Math.abs(cam.y - cam.ty) > 0.5;
      const walk = (n) => {
        if (n.u !== (n.open ? 1 : 0)) busy = true;
        for (const k of n.kids) {
          if (k.isDir) walk(k);
          if (!k.para && k.foldU !== foldTarget(k)) busy = true;
          if (k.para && k.typed !== (n.open ? 1 : 0)) busy = true;
        }
      };
      walk(root);
      // y lo que anima el renderer (una foto que crece, la lista que se abre)
      if (renderer.busy && renderer.busy()) busy = true;
      return !busy;
    },
    settle() {
      const walk = (n) => {
        n.u = n.open ? 1 : 0;
        n.g = n.u;
        for (const k of n.kids) if (k.isDir) walk(k);
      };
      walk(root);
      cam.x = cam.tx;
      cam.y = cam.ty;
    },
  };

  document.fonts.load(`500 15px "Libre Franklin"`).then(() => {
    resize();
    requestAnimationFrame((t) => {
      last = t;
      step(t);
    });
  });
}
