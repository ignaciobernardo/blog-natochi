// v20 · silueta plateada sobre papel carbón.
//
// El árbol es una silueta plana, como una serigrafía o un fotograma: tronco
// fino y ramas como formas rellenas, y una copa alta hecha de racimos de hojas
// redondeados. Cada racimo es una mancha suave (una gaussiana grande y dos o
// tres chicas corridas) en el canal verde de la capa de tinta; las manchas se
// suman y print.js corta el campo contra un ruido de hojas y uno de huecos:
// donde el follaje es tupido queda una masa con agujeritos, y hacia el borde
// se deshace en hojas sueltas. Entre racimo y racimo hay huecos irregulares
// donde se ve el papel oscuro y las ramitas. Tronco, ramas, hojas de las
// ramitas y texto van en el canal rojo, tinta plena. Todo sale en una sola
// tinta: plata con grano de arena sobre carbón plano.

import { rng, hash, noise1, lerp, clamp, at, easeInOut, photoZoom } from './core.js';
import { createPrinter } from './print.js';
import { PLAYLIST } from '../music/playlist.js';

// colores de la lámina (descripción de la referencia); el resto lo hace la impresión
const LOOK = {
  paper: '#2a282c',
  ink: '#b8bbc3',
  rough: 0.5, // cuánto se corre el borde (px)
  thresh: 0.42, // umbral de la tinta
  edge: 0.07, // ancho del corte: bajo = borde nítido
  bleed: 0.5,
  void: 0.045, // poros de un píxel del dispositivo
  thin: 2.2, // cuántos poros más donde la capa quedó fina
  pins: 0.035, // poros redondos más grandes
  grain: 0.05, // grano del papel
  inkGrain: 0.1, // grano del tono de la tinta
  mottle: 0.035,
  specks: 0.002, // motas en el papel
  stray: 0.022, // motitas de plata sueltas
  leaf: 6, // tamaño de celda del ruido de hojas (px); lo fija resize()
  lace: 0.55, // cuánto pesan las hojas al cortar el follaje
  holes: 0.95, // cuánto pesan los huecos
  holeScale: 0.06, // escala del ruido de huecos (1/px)
  cap: 1.3, // tope del campo: más bajo, más agujeros adentro de la masa
  gain: 1.1, // el campo se multiplica: los centros de los racimos quedan macizos
  tone: 1.05, // fotos: cuánta tinta lleva la luz
  dot: 3.4, // fotos: tamaño de la celda del medio tono (px)
  frame: 0, // marco de la página (lo pone el renderer)
  frameW: 0,
  liteCov: 0.45, // tinta escasa: qué parte de la malla deja pasar tinta
  liteText: 0.72, // texto en tinta escasa: carga más para que se lea
  leafEdge: 0.006, // corte del follaje: nítido, sin grises
};
// para afinar desde la URL: ?lace=0.7&holes=0.4&spacing=0.8
const TUNE = {};
for (const [k, v] of new URLSearchParams(location.search)) {
  if (k in LOOK && k !== 'paper' && k !== 'ink') LOOK[k] = parseFloat(v);
  else if (/^[a-z]+$/i.test(k) && !isNaN(parseFloat(v))) TUNE[k] = parseFloat(v);
}
// "Volver": una pastilla como la del reproductor, plata llena, con una flecha
// calada adentro. ?back=rama | hoja | palitos | raiz | texto (la tecla b las
// recorre)
//   rama     una ramita que apunta a la izquierda; dos hojas hacen la punta
//   hoja     una hoja sola, con la punta a la izquierda y su tallo
//   palitos  tres palitos cruzados, como las flechas que se dejan en un sendero
//   raiz     una raíz que se curva hacia atrás (↩), con raicillas
//   texto    la palabra "back"
const BACKS = ['rama', 'hoja', 'palitos', 'raiz', 'texto'];
const BACK = (() => {
  const b = new URLSearchParams(location.search).get('back');
  return BACKS.includes(b) ? b : 'rama';
})();

// Marco de la página: ?frame=marco (por defecto) | rasgado | pliego | ninguno
// (la tecla f los recorre)
//   marco    un marco negro alrededor del papel, como las láminas de la referencia
//   rasgado  el pliego tiene el borde rasgado y se apoya sobre algo más oscuro
//   pliego   prueba de imprenta: marcas de corte y de registro en las esquinas
const FRAMES = ['ninguno', 'marco', 'rasgado', 'pliego'];
const FRAME = (() => {
  const f = new URLSearchParams(location.search).get('frame');
  // por defecto, el marco negro (lo pidió el usuario); ?frame=ninguno lo saca
  return FRAMES.includes(f) ? f : 'marco';
})();
const frameW = (vw) => (FRAME === 'marco' ? (vw < 700 ? 9 : 16) : FRAME === 'rasgado' ? (vw < 700 ? 8 : 15) : FRAME === 'pliego' ? (vw < 700 ? 12 : 18) : 0);
const frameInset = (vw) => (FRAME === 'marco' ? frameW(vw) + 4 : FRAME === 'rasgado' ? frameW(vw) + 12 : FRAME === 'pliego' ? frameW(vw) + 4 : 0);

// Foto de "me": ?foto=estampilla (por defecto, o la de content/tree.js) |
// camafeo | hoja | pegada | lisa (la tecla p las recorre). Cada estilo
// recorta la foto a su forma y le pone su marco en la misma tinta; la trama
// de la foto sigue anclada al papel. Las fotos de las notas no cambian.
//   estampilla  sello de borde dentado, apenas girado, "natochi" calado abajo
//   camafeo     óvalo de medallón con doble filete a mano y su argolla
//   hoja        la foto dentro de una hoja inclinada, con su tallo
//   pegada      recorte de borde rasgado, girado, con una cinta encima
//   lisa        el cuadrado tal cual
const FOTOS = ['estampilla', 'camafeo', 'hoja', 'pegada', 'lisa'];
const FOTO = (() => {
  const f = new URLSearchParams(location.search).get('foto');
  return FOTOS.includes(f) ? f : null;
})();

const INK = '#ff0000';
const LITE_TEXT = '#0000ff'; // texto en la capa escasa: canal azul

// medidas del árbol según la pantalla
function dims(vw, vh) {
  const narrow = vw < 700;
  const H = vh * 0.78; // alto del tronco (igual que layout.trunkHeight)
  const W = narrow ? clamp(vw * 0.145, 46, 62) : clamp(vh * 0.135, 84, 160);
  return {
    vw,
    vh,
    rootX: narrow ? vw * 0.5 : vw * 0.4, // dónde queda el tronco en la vista inicial
    narrow,
    H,
    W, // medio ancho máximo de la copa
    bot: H * 0.31, // altura donde empieza la copa
    top: H * 1.05, // la copa pasa un poco la punta del tronco
    trunkW: narrow ? 6.5 : clamp(vh * 0.0125, 8, 15),
    R: narrow ? W * 0.36 : W * 0.31, // radio típico de un racimo
    leaf: narrow ? 6.4 : clamp(vh * 0.0112, 7.5, 12), // largo típico de una hoja
    sc: narrow ? 0.82 : clamp(vh / 800, 0.9, 1.4), // grosor de ramas
    spacing: TUNE.spacing ?? 0.8, // distancia mínima entre racimos, en radios
  };
}

// medio ancho de la copa a la altura h (positiva hacia arriba), de cada lado
function crownHalf(D, h, side) {
  const s = (h - D.bot) / (D.top - D.bot);
  if (s <= 0 || s >= 1) return 0;
  const base = Math.pow(Math.sin(Math.PI * Math.pow(s, 0.86)), 0.6);
  return D.W * base * (1 + 0.12 * noise1(s * 5.5, side > 0 ? 3 : 8));
}

// ruido de valor 2D suave en [0, 1]
function vnoise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

// ---------------------------------------------------------------------------
// piezas

// rama: eje con ancho y t de crecimiento en cada punto
function limb() {
  return { xs: [], ys: [], ws: [], ts: [] };
}
function lpush(L, x, y, w, t) {
  L.xs.push(x);
  L.ys.push(y);
  L.ws.push(w);
  L.ts.push(t);
}
// rama curva de A a B (control C), con ancho w0 → w1
function curveLimb(A, C, B, w0, w1, t0, t1, n = 0) {
  const L = limb();
  const len = Math.hypot(B.x - A.x, B.y - A.y);
  const N = n || Math.max(4, Math.round(len / 5));
  for (let i = 0; i <= N; i++) {
    const u = i / N, m = 1 - u;
    lpush(L, m * m * A.x + 2 * m * u * C.x + u * u * B.x, m * m * A.y + 2 * m * u * C.y + u * u * B.y, lerp(w0, w1, Math.pow(u, 0.8)), lerp(t0, t1, u));
  }
  return L;
}
const bez = (A, C, B, u) => {
  const m = 1 - u;
  return { x: m * m * A.x + 2 * m * u * C.x + u * u * B.x, y: m * m * A.y + 2 * m * u * C.y + u * u * B.y };
};

// Racimo: una mancha grande y dos o tres chicas corridas (relativas al centro),
// cada una con su radio (donde el campo vale la mitad) y su intensidad.
function cluster(x, y, R, t, rand, opts = {}) {
  const core = TUNE.core ?? 0.75;
  const subs = [R * (rand() - 0.5) * 0.15, R * (rand() - 0.5) * 0.15, R * core, (opts.a ?? 0.85) * (0.88 + 0.24 * rand())];
  const nb = opts.subs ?? 3 + Math.floor(rand() * 2);
  const a0 = rand() * Math.PI * 2;
  for (let i = 0; i < nb; i++) {
    // repartidas alrededor, para que el racimo no sea un círculo
    const a = a0 + (i / nb) * Math.PI * 2 + (rand() - 0.5) * 1.2, r = R * (0.4 + 0.35 * rand());
    subs.push(Math.cos(a) * r, Math.sin(a) * r * 0.85, R * core * (0.5 + 0.26 * rand()), (opts.a ?? 0.85) * (0.6 + 0.3 * rand()));
  }
  return { x, y, R, t, subs: new Float32Array(subs) };
}

// hojas sueltas a lo largo de una ramita (de a pares alternados), como un
// racimo sin núcleo centrado en el primer punto
function leafSpray(A, C, B, from, to, count, leafLen, t0, t1, rand) {
  const o = bez(A, C, B, from);
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const u = lerp(from, to, count > 1 ? i / (count - 1) : 0.5);
    const p = bez(A, C, B, u);
    const q = bez(A, C, B, Math.min(1, u + 0.02));
    const dir = Math.atan2(q.y - p.y, q.x - p.x);
    const s = i % 2 ? 1 : -1;
    const len = leafLen * (0.85 + 0.4 * rand()) * lerp(1, 0.7, i / count);
    const ang = dir + s * (0.55 + rand() * 0.4);
    // la hoja nace en la ramita y se abre hacia un lado
    leaves.push(p.x - o.x + Math.cos(ang) * len * 0.45, p.y - o.y + Math.sin(ang) * len * 0.45, ang, len, len * (0.42 + 0.12 * rand()));
  }
  return { x: o.x, y: o.y, R: leafLen * 1.2, t: lerp(t0, t1, from), leaves: new Float32Array(leaves) };
}

// puntos del borde de un racimo, para que las otras ramas y etiquetas lo esquiven
function ringSample(out, q) {
  out.push({ x: q.x, y: q.y });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    out.push({ x: q.x + Math.cos(a) * q.R * 1.1, y: q.y + Math.sin(a) * q.R });
    out.push({ x: q.x + Math.cos(a) * q.R * 0.55, y: q.y + Math.sin(a) * q.R * 0.5 });
  }
}

// distancia de un punto a un rectángulo
function rectDist(px, py, r) {
  const dx = Math.max(r.x - px, 0, px - (r.x + r.w));
  const dy = Math.max(r.y - py, 0, py - (r.y + r.h));
  return Math.hypot(dx, dy);
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Suelo: la pradera arriba de la línea de tierra y la tierra debajo. No
// termina nunca, ni hacia los costados ni hacia abajo: se arma por baldosas
// (franjas de pradera de CW de ancho; baldosas de tierra de CW × CH) cuando la
// cámara llega, siempre iguales para la misma posición.

const CW = 420;
const CH = 420;
const chunkRand = (ix, iy, salt) => rng((Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(salt, 83492791)) >>> 0);
const groundK = (D) => (D.narrow ? 0.85 : clamp(D.vh / 900, 0.9, 1.3));

// polígono cerrado (piedra, cristal, grano): {pts, smooth}
function blobPoly(x, y, r, rand, { verts = 8, jag = 0.22, squash = 1, rot = rand() * Math.PI } = {}) {
  const pts = [];
  const cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < verts; i++) {
    const a = (i / verts) * Math.PI * 2;
    const rr = r * (1 + (rand() - 0.5) * 2 * jag);
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr * squash;
    pts.push(x + px * cr - py * sr, y + px * sr + py * cr);
  }
  return { pts: new Float32Array(pts), smooth: true };
}
function polyPath(c, P) {
  const p = P.pts, n = p.length / 2;
  if (!P.smooth) {
    c.moveTo(p[0], p[1]);
    for (let i = 1; i < n; i++) c.lineTo(p[2 * i], p[2 * i + 1]);
    c.closePath();
    return;
  }
  c.moveTo((p[2 * n - 2] + p[0]) / 2, (p[2 * n - 1] + p[1]) / 2);
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    c.quadraticCurveTo(p[2 * i], p[2 * i + 1], (p[2 * i] + p[2 * j]) / 2, (p[2 * i + 1] + p[2 * j + 1]) / 2);
  }
  c.closePath();
}
// rama corta de dos puntos (raya, costilla)
function stroke2(limbs, ax, ay, bx, by, w, t = 0) {
  const L = limb();
  lpush(L, ax, ay, w, t);
  lpush(L, bx, by, w * 0.85, t);
  limbs.push(L);
}

// arbustos contra el tronco: siempre los mismos, se reparten en su franja
function nearBushes(D) {
  const r = rng(4243);
  const out = [];
  for (let i = 0; i < 2; i++) {
    const x = (i ? 1 : -1) * (D.trunkW * 1.5 + r() * D.W * 0.7);
    const R = D.R * (0.75 + r() * 0.4) * (D.narrow ? 0.9 : 1);
    const t = 0.03;
    out.push(cluster(x, -R * 0.3, R, t, r, { a: 0.85 }));
    if (r() < 0.6) out.push(cluster(x + (r() - 0.5) * R * 1.6, -R * 0.15, R * 0.7, t + 0.01, r, { a: 0.8 }));
  }
  return out;
}

// Franja de pradera: pasto tupido con matas y claros (más alto junto al
// tronco), tallos altos con espiga o cabezuela, helechos que se arquean y
// arbustos bajos medio enterrados en la línea de tierra. Crece desde el
// tronco hacia los costados.
function meadowChunk(ix, D) {
  const rand = chunkRand(ix, -1, 3);
  const k = D.narrow ? 0.85 : clamp(D.vh / 900, 0.9, 1.4);
  const x0 = ix * CW, x1 = x0 + CW;
  const reach = Math.max(300, D.vw * 0.7);
  const tAt = (x) => 0.01 + Math.min(1, Math.abs(x) / reach) * 0.12;
  const limbs = [], out = [], sprays = [];
  const clump = (x) => Math.pow(vnoise(x / 150, 0.5, 31), 1.8) * 1.3 + 0.35 * vnoise(x / 40, 1.5, 32) + 0.6 * Math.exp(-Math.abs(x) / (D.W * 0.9));
  const blades = Math.round(CW * (D.narrow ? 0.9 : 1.1));
  for (let i = 0; i < blades; i++) {
    const x = x0 + rand() * CW;
    const c = clump(x);
    const h = (3 + rand() * 7 + c * (10 + rand() * 34)) * k;
    const lean = (rand() - 0.5) * 1.3 + Math.sign(x) * 0.15;
    limbs.push(curveLimb({ x, y: 3 }, { x: x + lean * h * 0.25, y: -h * 0.6 }, { x: x + lean * h, y: -h }, (1.3 + rand() * 1.4) * k, 0.25, tAt(x), tAt(x) + 0.04, 4));
  }
  const tries = Math.round(CW / (D.narrow ? 45 : 55));
  for (let i = 0; i < tries; i++) {
    const cx = x0 + rand() * CW;
    if (Math.abs(cx) < D.trunkW * 2.5 || rand() > 0.25 + clump(cx) * 0.6) continue;
    const n = 1 + Math.floor(rand() * rand() * 6);
    for (let j = 0; j < n; j++) {
      const x = cx + (rand() - 0.5) * 22 * k;
      const h = (28 + rand() * rand() * 110) * k * (0.6 + 0.5 * clump(x));
      const lean = (rand() - 0.5) * 0.7;
      const A = { x, y: 3 }, C = { x: x + lean * h * 0.3, y: -h * 0.55 }, B = { x: x + lean * h * 0.8, y: -h };
      limbs.push(curveLimb(A, C, B, 1.5 * k, 0.6, tAt(x) + 0.01, tAt(x) + 0.07, 8));
      if (rand() < 0.75) sprays.push(leafSpray(A, C, B, 0.7, 1, 6 + Math.floor(rand() * 5), (4.5 + rand() * 2.5) * k, tAt(x) + 0.05, tAt(x) + 0.08, rand));
      else out.push(cluster(B.x, B.y, (4 + rand() * 4) * k, tAt(x) + 0.07, rand, { a: 0.75, subs: 2 }));
    }
  }
  const ferns = D.narrow ? (rand() < 0.35 ? 1 : 0) : Math.floor(rand() * 2.4);
  for (let i = 0; i < ferns; i++) {
    const x = x0 + 20 + rand() * (CW - 40);
    const side = x < 0 ? -1 : 1;
    const h = (36 + rand() * 40) * k;
    const A = { x, y: 3 }, C = { x: x + side * h * 0.25, y: -h * 0.95 }, B = { x: x + side * h * 0.85, y: -h * 0.5 };
    limbs.push(curveLimb(A, C, B, 1.8 * k, 0.5, tAt(x) + 0.01, tAt(x) + 0.08, 12));
    sprays.push(leafSpray(A, C, B, 0.1, 1, 16 + Math.floor(rand() * 6), (9 + rand() * 4) * k, tAt(x) + 0.03, tAt(x) + 0.1, rand));
  }
  const far = rand() < 0.6 ? 1 + (rand() < 0.4 ? 1 : 0) : 0;
  for (let i = 0; i < far; i++) {
    const x = x0 + rand() * CW;
    if (Math.abs(x) < D.W * 1.2) continue;
    const R = D.R * (0.55 + rand() * 0.6) * (D.narrow ? 0.9 : 1);
    out.push(cluster(x, -R * 0.3, R, tAt(x) + 0.02, rand, { a: 0.85 }));
    if (rand() < 0.6) out.push(cluster(x + (rand() - 0.5) * R * 1.6, -R * 0.15, R * 0.7, tAt(x) + 0.03, rand, { a: 0.8 }));
  }
  for (const q of nearBushes(D)) if (q.x >= x0 && q.x < x1) out.push(q);
  return { limbs, clusters: out, sprays };
}

// Raíces del árbol: bajan del pie y se abren en la tierra, cada vez más
// finas, tirando siempre un poco hacia abajo.
function rootSystem(limbs, D, rand) {
  const k = groundK(D);
  const grow = (x, y, ang, len, w, t0, depth) => {
    const L = limb();
    const n = Math.max(4, Math.round(len / 5));
    const ph = rand() * 10;
    let px = x, py = y, a = ang;
    const pts = [{ x: px, y: py, a }];
    lpush(L, px, py, w, t0);
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      a += noise1(u * 3 + ph, 61) * 0.16 + (Math.PI / 2 - a) * 0.035;
      px += (Math.cos(a) * len) / n;
      py = Math.max(3, py + (Math.sin(a) * len) / n);
      lpush(L, px, py, Math.max(0.6, lerp(w, w * 0.18, Math.pow(u, 0.7))), t0 + u * 0.08);
      pts.push({ x: px, y: py, a });
    }
    limbs.push(L);
    if (depth >= 3) return;
    const kids = depth === 0 ? 3 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 3);
    for (let j = 0; j < kids; j++) {
      const u = 0.18 + rand() * 0.66;
      const p = pts[Math.floor(u * n)];
      const side = rand() < 0.5 ? -1 : 1;
      grow(p.x, p.y, p.a + side * (0.45 + rand() * 0.6), len * (0.35 + rand() * 0.35) * (1 - u * 0.4), lerp(w, w * 0.18, u) * 0.75, t0 + u * 0.08, depth + 1);
    }
  };
  const mains = 6 + Math.floor(rand() * 3);
  for (let i = 0; i < mains; i++) {
    const f = mains > 1 ? i / (mains - 1) : 0.5;
    const ang = lerp(Math.PI * 0.94, Math.PI * 0.06, f) + (rand() - 0.5) * 0.2;
    const x0 = (f - 0.5) * D.trunkW * 0.9;
    grow(x0, 2, ang, (110 + rand() * 240) * k * (0.55 + 0.45 * Math.sin(Math.PI * f)), D.trunkW * (0.45 + rand() * 0.2), 0.02, 0);
  }
}

// cristales: un racimo de cuarzo. Prismas de punta afilada que salen hacia
// arriba de una piedra madre, cada uno con una arista calada que separa dos
// caras, y esquirlas sueltas alrededor.
function crystals(x, y, k, rand, polys, cuts) {
  const a0 = -Math.PI / 2 + (rand() - 0.5) * 1.1;
  const R = (9 + rand() * 7) * k;
  const n = 6 + Math.floor(rand() * 5);
  const prisms = [];
  for (let i = 0; i < n; i++) {
    const spread = (rand() - 0.5) * 1.5;
    const a = a0 + spread;
    // los del centro, más largos
    const L = (10 + rand() * 26) * k * (1.25 - Math.abs(spread) * 0.5) * (i === 0 ? 1.3 : 1);
    const w = Math.max(3.2 * k, L * (0.17 + rand() * 0.08));
    const bx = x + (rand() - 0.5) * R * 1.3, by = y + (rand() - 0.5) * R * 0.25;
    prisms.push({ a, L, w, bx, by });
  }
  // los más largos atrás
  prisms.sort((p, q) => q.L - p.L);
  for (const { a, L, w, bx, by } of prisms) {
    const ca = Math.cos(a), sa = Math.sin(a);
    const nx = -sa, ny = ca;
    const P = (u, v) => [bx + ca * L * u + nx * w * v, by + sa * L * u + ny * w * v];
    polys.push({ pts: new Float32Array([...P(-0.05, -0.5), ...P(0.76, -0.5), ...P(1, (rand() - 0.5) * 0.12), ...P(0.76, 0.5), ...P(-0.05, 0.5)]), smooth: false });
    const f = (rand() < 0.5 ? -1 : 1) * (0.1 + rand() * 0.12);
    cuts.push({ pts: new Float32Array([...P(0.12, f), ...P(0.76, f), ...P(0.97, 0)]), w: Math.max(0.8, w * 0.1) });
  }
  // piedra madre, encima de las bases
  polys.push(blobPoly(x, y + R * 0.25, R, rand, { verts: 11, jag: 0.16, squash: 0.5, rot: (rand() - 0.5) * 0.4 }));
  const chips = 3 + Math.floor(rand() * 5);
  for (let i = 0; i < chips; i++) {
    const a = rand() * Math.PI * 2, d = (R + 6 + rand() * 18 * k);
    polys.push(blobPoly(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, (1.2 + rand() * 2.2) * k, rand, { verts: 3, jag: 0.25 }));
  }
}

// amonite: espiral que se cierra, con costillas entre una vuelta y la otra
function ammonite(x, y, k, rand, limbs) {
  const R = (11 + rand() * 9) * k;
  const b = 0.2;
  const rot = rand() * Math.PI * 2;
  const rAt = (th) => R * Math.exp(-b * th);
  const L = limb();
  for (let th = 0; th <= 4.5 * Math.PI; th += 0.16) {
    const r = rAt(th);
    lpush(L, x + Math.cos(th + rot) * r, y + Math.sin(th + rot) * r, Math.max(0.8, 1.9 * k * (r / R) + 0.5), 0);
  }
  limbs.push(L);
  for (let th = 0.2; th <= 2.7 * Math.PI; th += 0.3) {
    const r1 = rAt(th) * 0.93, r0 = rAt(th + 2 * Math.PI) * 1.08;
    const a = th + rot;
    stroke2(limbs, x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1, 0.95 * k);
  }
}

// Baldosa de tierra. En la primera fila, bajo el pasto, la tierra suelta:
// raicillas y grava que se ralea hacia abajo. En todas: vetas de sedimento
// que siguen de una baldosa a otra, piedritas, a veces un lecho de grava, una
// roca con grietas, un racimo de cristales (más hondo, más seguido), un
// fósil, el túnel de un gusano o un bulbo con su brote.
function soilChunk(ix, iy, D) {
  const rand = chunkRand(ix, iy, 7);
  const k = groundK(D);
  const x0 = ix * CW, y0 = iy * CH, x1 = x0 + CW, y1 = y0 + CH;
  const ymid = (y0 + y1) / 2;
  const limbs = [], polys = [], cuts = [], sprays = [];
  const at2 = (m, top = 0) => ({ x: x0 + m + rand() * (CW - 2 * m), y: Math.max(y0 + m, top) + rand() * Math.max(1, y1 - m - Math.max(y0 + m, top)) });

  if (iy === 0) {
    const hairs = Math.round(CW * 0.5);
    for (let i = 0; i < hairs; i++) {
      const x = x0 + rand() * CW;
      const len = (4 + rand() * rand() * 26) * k;
      const w = (0.8 + rand() * 0.7) * k;
      let a = Math.PI / 2 + (rand() - 0.5) * 1.0;
      let px = x, py = 2;
      const L = limb();
      lpush(L, px, py, w, 0);
      for (let st = 1; st <= 4; st++) {
        a += (rand() - 0.5) * 0.6;
        px += (Math.cos(a) * len) / 4;
        py = Math.max(2, py + (Math.sin(a) * len) / 4);
        lpush(L, px, py, w * (1 - st / 5), 0);
      }
      limbs.push(L);
    }
    const grains = Math.round(CW * 1.4);
    for (let i = 0; i < grains; i++) {
      const y = 2 - Math.log(1 - rand() * 0.999) * 16 * k;
      if (y > y1 - 4) continue;
      polys.push(blobPoly(x0 + rand() * CW, y, (0.5 + rand() * rand() * 1.8) * k, rand, { verts: 5, jag: 0.3 }));
    }
  }

  // vetas: ancladas al mundo, para que sigan de una baldosa a la otra
  const S0 = 150, SP = 270;
  const j0 = Math.max(0, Math.floor((y0 - S0 - 90) / SP)), j1 = Math.ceil((y1 - S0 + 90) / SP);
  for (let j = j0; j <= j1; j++) {
    const base = S0 + j * SP + 60 * (hash(j, 0, 70) - 0.5);
    const sy = (x) => base + 18 * k * noise1(x / 170 + j * 13.1, 72) + 5 * k * noise1(x / 37 + j * 5.3, 73);
    const keep = (x) => noise1(x / 110 + j * 3.3, 76) > -0.35;
    const style = Math.floor(hash(j, 1, 74) * 4);
    const step = [8, 6, 8, 13][style];
    for (let xs = Math.ceil(x0 / step) * step; xs < x1; xs += step) {
      if (!keep(xs)) continue;
      const hh = hash(xs / step, j, 77);
      const y = sy(xs);
      if (y < y0 || y >= y1) continue;
      if (style === 0 && hh < 0.8) stroke2(limbs, xs, y, xs + (2 + hh * 5) * k, sy(xs + 5), 1.3 * k);
      else if (style === 1 && hh < 0.85) polys.push(blobPoly(xs, y, 0.95 * k, rand, { verts: 5, jag: 0.2 }));
      else if (style === 2 && hh < 0.75) {
        stroke2(limbs, xs, y, xs + (2 + hh * 4) * k, sy(xs + 4), 1.2 * k);
        if (hh < 0.5) stroke2(limbs, xs + 3, y + 5 * k, xs + 3 + (2 + hh * 4) * k, sy(xs + 7) + 5 * k, 1.1 * k);
      } else if (style === 3 && hh < 0.6) polys.push(blobPoly(xs, y + (hash(xs, j, 78) - 0.5) * 6 * k, (1.2 + hash(xs, j, 79) * 2.6) * k, rand, { verts: 7 }));
    }
  }

  // piedritas, más seguidas cerca de la superficie
  const pebbles = Math.round(18 + 14 * Math.exp(-ymid / 600));
  for (let i = 0; i < pebbles; i++) {
    const p = at2(4, 24);
    const r = (1.3 + rand() * rand() * 9) * k;
    polys.push(blobPoly(p.x, p.y, r, rand, { verts: 8, jag: 0.2, squash: 0.65 + rand() * 0.3 }));
    if (r > 4.5 && rand() < 0.35) {
      const a = rand() * Math.PI;
      cuts.push({ pts: new Float32Array([p.x - Math.cos(a) * r * 0.45, p.y - Math.sin(a) * r * 0.3, p.x + Math.cos(a) * r * 0.4, p.y + Math.sin(a) * r * 0.25]), w: 0.9 });
    }
  }
  if (rand() < 0.45) {
    const p = at2(40, 40);
    const a = (18 + rand() * 24) * k, b = a * 0.35;
    const n = 16 + Math.floor(rand() * 22);
    for (let i = 0; i < n; i++) {
      const th = rand() * Math.PI * 2, d = Math.sqrt(rand());
      polys.push(blobPoly(p.x + Math.cos(th) * a * d, p.y + Math.sin(th) * b * d, (0.6 + rand() * 1.1) * k, rand, { verts: 5 }));
    }
  }
  const rocks = (rand() < 0.6 ? 1 : 0) + (rand() < 0.25 ? 1 : 0);
  for (let ri = 0; ri < rocks; ri++) {
    const r = (13 + rand() * 26) * k;
    const p = at2(r + 6, 60);
    const squash = 0.62 + rand() * 0.23;
    polys.push(blobPoly(p.x, p.y, r, rand, { verts: 14, jag: 0.14, squash, rot: (rand() - 0.5) * 0.6 }));
    // grietas: entran desde el borde y se curvan apenas hacia adentro
    const cracks = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < cracks; i++) {
      const e = rand() * Math.PI * 2;
      let cx = p.x + Math.cos(e) * r * 0.95, cy = p.y + Math.sin(e) * r * squash * 0.95;
      let a = e + Math.PI + (rand() - 0.5) * 0.6;
      const pts = [cx, cy];
      const len = r * (0.45 + rand() * 0.4);
      for (let sgi = 1; sgi <= 6; sgi++) {
        a += (rand() - 0.5) * 0.35;
        cx += (Math.cos(a) * len) / 6;
        cy += (Math.sin(a) * len * squash) / 6;
        pts.push(cx, cy);
      }
      cuts.push({ pts: new Float32Array(pts), w: (1.0 + rand() * 0.5) * k });
    }
  }
  // veta mineral: una línea que serpentea con cristalitos pegados
  if (rand() < 0.28) {
    const p = at2(50, 60);
    let x = p.x, y = p.y, a = (rand() - 0.5) * 1.2 + (rand() < 0.5 ? 0 : Math.PI);
    const L = limb();
    const n = 16 + Math.floor(rand() * 14);
    for (let i = 0; i <= n; i++) {
      lpush(L, x, y, (1.4 + 1.6 * Math.sin((Math.PI * i) / n)) * k, 0);
      if (i % 3 === 1 && rand() < 0.7) {
        const side = rand() < 0.5 ? -1 : 1;
        const ca = a + side * (Math.PI / 2 + (rand() - 0.5) * 0.8);
        const l = (3 + rand() * 7) * k, w = l * 0.35;
        const nx = -Math.sin(ca), ny = Math.cos(ca);
        polys.push({ pts: new Float32Array([x + nx * w * 0.5, y + ny * w * 0.5, x + Math.cos(ca) * l, y + Math.sin(ca) * l, x - nx * w * 0.5, y - ny * w * 0.5]), smooth: false });
      }
      a += (rand() - 0.5) * 0.45;
      x += Math.cos(a) * 7 * k;
      y += Math.sin(a) * 4 * k;
    }
    limbs.push(L);
  }
  if (rand() < 0.32 + Math.min(0.3, ymid / 3000)) {
    const p = at2(50, 70);
    crystals(p.x, p.y, k, rand, polys, cuts);
  }
  if (ymid > 260 && rand() < 0.13) {
    const p = at2(40, 80);
    if (rand() < 0.6) ammonite(p.x, p.y, k, rand, limbs);
    else {
      // helecho fósil: una hoja de helecho aplastada en la piedra
      const a = rand() * Math.PI * 2, L = (34 + rand() * 24) * k;
      const A = { x: p.x, y: p.y }, B = { x: p.x + Math.cos(a) * L, y: p.y + Math.sin(a) * L };
      const C = { x: (A.x + B.x) / 2 + Math.sin(a) * L * 0.18, y: (A.y + B.y) / 2 - Math.cos(a) * L * 0.18 };
      limbs.push(curveLimb(A, C, B, 1.3 * k, 0.5, 0, 0, 10));
      sprays.push(leafSpray(A, C, B, 0.08, 1, 14, 6.5 * k, 0, 0, rand));
    }
  }
  if (rand() < 0.14) {
    // túnel de gusano: un punteado que serpentea
    const p = at2(30, 50);
    let x = p.x, y = p.y, a = rand() * Math.PI * 2;
    const n = 28 + Math.floor(rand() * 32);
    for (let i = 0; i < n; i++) {
      a += (rand() - 0.5) * 0.7;
      x += Math.cos(a) * 4.5 * k;
      y = Math.max(y0 + 8, y + Math.sin(a) * 4.5 * k);
      polys.push(blobPoly(x, y, 0.85 * k, rand, { verts: 5 }));
    }
  }
  if (ymid < 600 && rand() < 0.16) {
    // bulbo con su brote y unas raicillas
    const p = at2(30, 40);
    const r = (5 + rand() * 3) * k;
    polys.push(blobPoly(p.x, p.y, r, rand, { verts: 9, jag: 0.08, squash: 0.85 }));
    const h = (14 + rand() * 18) * k, lean = (rand() - 0.5) * 0.8;
    limbs.push(curveLimb({ x: p.x, y: p.y - r * 0.6 }, { x: p.x + lean * h * 0.2, y: p.y - r - h * 0.5 }, { x: p.x + lean * h * 0.6, y: p.y - r - h }, 1.5 * k, 0.5, 0, 0, 6));
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 2 + (rand() - 0.5) * 1.6, l = (5 + rand() * 9) * k;
      stroke2(limbs, p.x, p.y + r * 0.6, p.x + Math.cos(a) * l, p.y + r * 0.6 + Math.sin(a) * l, 0.8 * k);
    }
  }
  return { limbs, clusters: [], sprays, polys, cuts };
}

// pinta una baldosa del suelo: lo de siempre, las piedras y cristales como
// polígonos llenos, y las grietas y aristas caladas
function paintGround(c, geo, g) {
  paintGeo(c, geo, g, 'base');
  c.globalCompositeOperation = 'source-over';
  for (const P of geo.polys || []) {
    c.beginPath();
    polyPath(c, P);
    c.fill();
  }
  if (geo.cuts && geo.cuts.length) {
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const K of geo.cuts) {
      c.lineWidth = K.w;
      c.beginPath();
      c.moveTo(K.pts[0], K.pts[1]);
      for (let i = 2; i < K.pts.length; i += 2) c.lineTo(K.pts[i], K.pts[i + 1]);
      c.stroke();
    }
    c.restore();
  }
}

// raíz: tronco, raíces, copa y las ramitas de las secciones

function buildRoot(node, D, labels) {
  const pts = node.branch.pts;
  const H = node.branch.len;
  const rand = rng(4241 + node.id);
  const limbs = [];
  const out = [];
  const sprays = [];
  const trunkX = (h) => at(pts, clamp(h / H, 0, 1)).x;
  const sc = D.sc;

  // tronco: delgado, con el pie que se abre
  {
    const L = limb();
    const W0 = D.trunkW;
    for (const p of pts) {
      // adentro de la copa se afina rápido: ahí lo que se ve son ramas
      const inCrown = clamp((p.t * H - D.bot) / (H - D.bot), 0, 1);
      const w = W0 * Math.pow(1 - 0.8 * p.t, 1.15) * (1 + 1.1 * Math.exp(-p.t * 30)) * (1 - 0.55 * inCrown) + 1.1;
      lpush(L, p.x, p.y, w, p.t * 0.98);
    }
    limbs.push(L);
  }
  // pie: unas raíces cortas y una mata de pasto, tupida junto al tronco
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1;
    const x0 = side * D.trunkW * 0.25;
    const len = D.trunkW * (1.3 + rand() * 1.4);
    limbs.push(curveLimb({ x: x0, y: -D.trunkW * 0.6 }, { x: x0 + side * len * 0.5, y: -1 }, { x: x0 + side * len, y: 1.5 }, D.trunkW * 0.5, 0.9, 0, 0.03, 6));
  }
  // raíces bajo tierra (con su propio azar, para no mover la copa); la
  // pradera y la tierra van aparte, por baldosas
  rootSystem(limbs, D, rng(5151));

  // racimos: muestreo con distancia mínima dentro de la copa; un ruido grande
  // deja huecos irregulares por donde se ven las ramas
  const clusters = [];
  const gs = D.W * 0.5;
  const gseed = 17 + node.id;
  for (let tries = 0; tries < 7000 && clusters.length < 500; tries++) {
    const h = lerp(D.bot, D.top, rand());
    const side = rand() < 0.5 ? -1 : 1;
    const half = crownHalf(D, h, side);
    if (half <= 2) continue;
    const R = D.R * (0.75 + 0.45 * rand()) * (0.6 + 0.4 * Math.min(1, half / (D.W * 0.7)));
    const x = trunkX(h) + side * rand() * Math.max(0, half - R * 0.5);
    const y = -h;
    if (h + R * 0.55 > D.top || h - R * 0.45 < D.bot) continue;
    const gap = vnoise(x / gs, y / gs, gseed);
    if (gap > 0.66 && Math.abs(x - trunkX(h)) < half - R * 0.9) continue;
    if (clusters.some((q) => Math.hypot(q.x - x, q.y - y) < (q.R + R) * D.spacing)) continue;
    clusters.push({ x, y, R, h });
  }

  // estructura: cada racimo cuelga del tronco o de un racimo más adentro
  const dxOf = (q) => q.x - trunkX(q.h);
  const order = clusters.map((q, i) => i).sort((a, b) => Math.abs(dxOf(clusters[a])) - Math.abs(dxOf(clusters[b])));
  const parent = new Array(clusters.length).fill(-1);
  const base = new Array(clusters.length).fill(null);
  const done = [];
  for (const i of order) {
    const q = clusters[i];
    const dx = dxOf(q);
    const hb = clamp(q.h - Math.abs(dx) * 0.85 - 4, D.bot * 0.9, H * 0.97);
    const tb = { x: trunkX(hb), y: -hb, h: hb };
    let best = Math.hypot(q.x - tb.x, q.y - tb.y) * 1.25, pick = -1;
    for (const j of done) {
      const p = clusters[j];
      const pdx = dxOf(p);
      if (Math.sign(pdx) !== Math.sign(dx) && Math.abs(pdx) > 6) continue;
      if (Math.abs(pdx) > Math.abs(dx) - q.R * 0.25) continue;
      if (p.h > q.h + q.R * 0.3) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < best && d < q.R * 2.8) {
        best = d;
        pick = j;
      }
    }
    parent[i] = pick;
    base[i] = pick < 0 ? tb : clusters[pick];
    done.push(i);
  }
  const desc = new Array(clusters.length).fill(0);
  for (const i of [...order].reverse()) if (parent[i] >= 0) desc[parent[i]] += desc[i] + 1;
  for (const i of order) {
    const q = clusters[i];
    const b = base[i];
    const tq = clamp(q.h / H, 0, 1) * 0.97;
    const t0 = clamp(b.h / H, 0, 1) * 0.97;
    // rama algo arqueada hacia arriba
    const mid = { x: lerp(b.x, q.x, 0.55), y: lerp(b.y, q.y, 0.5) + Math.abs(q.x - b.x) * 0.12 };
    const w0 = (1.2 + 0.7 * Math.sqrt(desc[i] + 1)) * sc;
    limbs.push(curveLimb(b, mid, { x: q.x, y: q.y }, w0, 1.1 * sc, t0, tq));
    // ramitas finas que salen del racimo: asoman en el borde y en los huecos
    const nt = 1 + Math.floor(rand() * 3);
    for (let k = 0; k < nt; k++) {
      const out0 = Math.atan2(q.y - b.y, q.x - b.x);
      const a = out0 + (rand() - 0.5) * 1.7;
      const L = q.R * (0.55 + rand() * 0.45);
      const E = { x: q.x + Math.cos(a) * L, y: q.y + Math.sin(a) * L };
      limbs.push(curveLimb({ x: q.x, y: q.y }, { x: lerp(q.x, E.x, 0.5) + (rand() - 0.5) * 6, y: lerp(q.y, E.y, 0.5) - rand() * 4 }, E, 1.25 * sc, 0.8, tq, tq + 0.02, 5));
    }
    out.push(cluster(q.x, q.y, q.R, tq + 0.01, rand));
  }

  // ramitas de las secciones
  for (const L of navTwigs(node, D, rand, sprays)) limbs.push(L);
  // las etiquetas siempre quedan limpias
  dropNear(out, sprays, labels);
  return { limbs, clusters: out, sprays };
}

// Ramitas de los ítems: salen de la rama y llegan a la etiqueta. Llevan hojas
// sueltas en el tramo del medio; la punta queda pelada, junto a la etiqueta.
function navTwigs(node, D, rand, sprays) {
  const limbs = [];
  const sc = D.sc;
  for (const k of node.kids) {
    if (!k.twig) continue;
    const { from } = k.twig;
    let to = k.twig.to;
    const len0 = Math.hypot(to.x - from.x, to.y - from.y);
    // la punta se queda un poco antes de la etiqueta
    const back = Math.min(4, len0 * 0.1);
    to = { x: to.x - ((to.x - from.x) / len0) * back, y: to.y - ((to.y - from.y) / len0) * back };
    const len = len0 - back;
    const dx = (to.x - from.x) / len;
    const sag = len * (node.root ? 0.06 : 0.1);
    const C = { x: lerp(from.x, to.x, 0.5), y: lerp(from.y, to.y, 0.5) + sag * (Math.abs(dx) > 0.3 ? 1 : 0.3) };
    const span = node.root ? 0.06 : 0.04;
    const t0 = k.t;
    // cada ramita sabe de qué ítem es: se imprime con la tinta de ese ítem
    const L = curveLimb(from, C, to, (node.root ? 4.8 : 2.4) * sc, 1.3 * sc, t0, t0 + span);
    L.kid = k;
    limbs.push(L);
    if (k.para) continue;
    const count = node.root ? 4 + Math.floor(rand() * 2) : 3;
    const a = node.root ? 0.5 : 0.3, b = node.root ? 0.8 : 0.62;
    const q = leafSpray(from, C, to, a, b, count, D.leaf * (node.root ? 1.05 : 0.95), t0, t0 + span, rand);
    q.kid = k;
    sprays.push(q);
  }
  return limbs;
}

// saca manchas de follaje y hojas sueltas que caerían sobre una etiqueta
function dropNear(clusters, sprays, labels) {
  if (!labels.length) return;
  for (const q of sprays) {
    const keep = [];
    const L = q.leaves;
    for (let i = 0; i < L.length; i += 5) {
      if (labels.some((r) => rectDist(q.x + L[i], q.y + L[i + 1], r) < L[i + 3] * 0.6 + 3)) continue;
      keep.push(L[i], L[i + 1], L[i + 2], L[i + 3], L[i + 4]);
    }
    q.leaves = new Float32Array(keep);
  }
  for (const q of clusters) {
    const S = q.subs;
    const keep = [];
    for (let i = 0; i < S.length; i += 4) {
      // la mancha se achica hasta dejar libre la etiqueta, o se va
      let r = S[i + 2];
      const d = Math.min(...labels.map((L) => rectDist(q.x + S[i], q.y + S[i + 1], L)));
      if (d < r * 1.35 + 5) r = (d - 5) / 1.35;
      if (r < 3) continue;
      keep.push(S[i], S[i + 1], r, S[i + 3]);
    }
    q.subs = new Float32Array(keep);
  }
}

// ---------------------------------------------------------------------------
// rama de una carpeta abierta: un brazo de silueta con racimos a lo largo

function buildChild(node, D, labels) {
  const pts = node.branch.pts;
  const rand = rng(1301 + node.id * 7);
  const sc = D.sc;
  const limbs = [];
  const clusters = [];
  const len = node.branch.len;
  {
    const L = limb();
    for (const p of pts) lpush(L, p.x, p.y, lerp(3.8 * sc, 1.3, Math.pow(p.t, 0.75)), p.t);
    limbs.push(L);
  }
  // racimos pegados al brazo, alternados, más chicos hacia la punta; de cada
  // lado se elige el que queda más lejos de las etiquetas
  // racimos más seguidos que su tamaño, para que se junten en una rama tupida
  const step = D.R * (D.narrow ? 0.95 : 0.9);
  const n = Math.max(2, Math.floor((len * 0.84) / step));
  let side = rand() < 0.5 ? -1 : 1;
  for (let i = 0; i < n; i++) {
    const t = 0.12 + (0.8 * (i + 0.5)) / n + (rand() - 0.5) * 0.04;
    const p = at(pts, t);
    const nx = -p.ty, ny = p.tx;
    let R = D.R * lerp(0.9, 0.55, t) * (0.85 + rand() * 0.3);
    const off = R * (0.3 + rand() * 0.25);
    const along = (rand() - 0.2) * R * 0.5;
    const spot = (s) => ({ x: p.x + nx * s * off + p.tx * along, y: p.y + ny * s * off + p.ty * along });
    const room = (c) => Math.min(...labels.map((r) => rectDist(c.x, c.y, r)), 1e9);
    let c = spot(side);
    if (room(c) < R + 6 && room(spot(-side)) > room(c)) {
      side = -side;
      c = spot(side);
    }
    const free = room(c);
    if (free < R * 1.3 + 6) R = Math.max(0, (free - 6) / 1.3);
    if (R >= 7) {
      limbs.push(curveLimb({ x: p.x, y: p.y }, { x: lerp(p.x, c.x, 0.5) + p.tx * 3, y: lerp(p.y, c.y, 0.5) + p.ty * 3 }, c, 1.8 * sc, 1.1, t, t + 0.03, 4));
      clusters.push(cluster(c.x, c.y, R, t + 0.035, rand));
    }
    side = -side;
  }
  // ramito en la punta
  {
    const p = at(pts, 1);
    const R = D.R * 0.36;
    clusters.push(cluster(p.x + p.tx * R * 0.4, p.y + p.ty * R * 0.4, R, 0.97, rand, { subs: 1, a: 0.75 }));
  }
  const sprays = [];
  for (const L of navTwigs(node, D, rand, sprays)) limbs.push(L);
  dropNear(clusters, sprays, labels);
  return { limbs, clusters, sprays };
}

// ---------------------------------------------------------------------------
// pintar

// el tramo de una rama que ya creció, como polígono relleno
function limbPath(c, L, g) {
  const n = L.xs.length;
  if (L.ts[0] > g || n < 2) return;
  let m = n;
  let ex = 0, ey = 0, ew = 0, cut = false;
  for (let i = 1; i < n; i++) {
    if (L.ts[i] > g) {
      const u = (g - L.ts[i - 1]) / (L.ts[i] - L.ts[i - 1] || 1);
      ex = lerp(L.xs[i - 1], L.xs[i], u);
      ey = lerp(L.ys[i - 1], L.ys[i], u);
      ew = lerp(L.ws[i - 1], L.ws[i], u);
      m = i;
      cut = true;
      break;
    }
  }
  const X = L.xs.slice(0, m), Y = L.ys.slice(0, m), Wd = L.ws.slice(0, m);
  if (cut) {
    X.push(ex);
    Y.push(ey);
    Wd.push(ew);
  }
  const k = X.length;
  if (k < 2) return;
  const nrm = (i) => {
    const a = Math.max(0, i - 1), b = Math.min(k - 1, i + 1);
    const tx = X[b] - X[a], ty = Y[b] - Y[a];
    const tl = Math.hypot(tx, ty) || 1;
    return [-ty / tl, tx / tl];
  };
  for (let i = 0; i < k; i++) {
    const [nx, ny] = nrm(i);
    const h = Wd[i] / 2;
    i ? c.lineTo(X[i] + nx * h, Y[i] + ny * h) : c.moveTo(X[i] + nx * h, Y[i] + ny * h);
  }
  // punta redondeada
  {
    const [nx, ny] = nrm(k - 1);
    const h = Wd[k - 1] / 2;
    c.arc(X[k - 1], Y[k - 1], h, Math.atan2(ny, nx), Math.atan2(ny, nx) - Math.PI, true);
  }
  for (let i = k - 1; i >= 0; i--) {
    const [nx, ny] = nrm(i);
    const h = Wd[i] / 2;
    c.lineTo(X[i] - nx * h, Y[i] - ny * h);
  }
  c.closePath();
}

const pop = (g, t) => {
  const u = clamp((g - t) / 0.05, 0, 1);
  return u <= 0 ? 0 : 1 - Math.pow(1 - u, 3);
};

// hoja: dos curvas entre las puntas
function leafPath(c, x, y, a, len, w) {
  const hl = len / 2;
  const ca = Math.cos(a), sa = Math.sin(a);
  const ax = x + ca * hl, ay = y + sa * hl;
  const bx = x - ca * hl, by = y - sa * hl;
  c.moveTo(ax, ay);
  c.quadraticCurveTo(x - sa * w, y + ca * w, bx, by);
  c.quadraticCurveTo(x + sa * w, y - ca * w, ax, ay);
}

// mancha verde, (1 - r²)², vale la mitad a 1/1.85 de su radio: el borde
// cae rápido y la masa queda redonda
const SPOT = 1.85;
let sprite = null;
function spot() {
  if (sprite) return sprite;
  sprite = document.createElement('canvas');
  sprite.width = sprite.height = 128;
  const s = sprite.getContext('2d');
  const gr = s.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (let i = 0; i <= 16; i++) {
    const r = i / 16;
    gr.addColorStop(r, `rgba(0,255,0,${Math.pow(1 - r * r, 2).toFixed(4)})`);
  }
  s.fillStyle = gr;
  s.fillRect(0, 0, 128, 128);
  return sprite;
}

// `only`: qué piezas pintar. 'base' = todo menos las ramitas de los ítems;
// un nodo = sólo la ramita (y sus hojas) de ese ítem.
// `view` (opcional): rectángulo del mundo que se ve; lo que cae afuera no se
// arma (las raíces bajo tierra mientras crece el árbol, por ejemplo)
function paintGeo(c, geo, g, only = 'base', view = null) {
  const inView = (x0, y0, x1, y1) => !view || (x1 >= view.x0 && x0 <= view.x1 && y1 >= view.y0 && y0 <= view.y1);
  const take = (it) => (only === 'base' ? !it.kid : it.kid === only);
  // ramas y hojas sueltas: tinta plena
  c.globalCompositeOperation = 'source-over';
  c.beginPath();
  for (const L of geo.limbs) {
    if (!take(L)) continue;
    if (view) {
      if (!L.bb) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (let i = 0; i < L.xs.length; i++) {
          x0 = Math.min(x0, L.xs[i] - L.ws[i]);
          x1 = Math.max(x1, L.xs[i] + L.ws[i]);
          y0 = Math.min(y0, L.ys[i] - L.ws[i]);
          y1 = Math.max(y1, L.ys[i] + L.ws[i]);
        }
        L.bb = [x0, y0, x1, y1];
      }
      if (!inView(...L.bb)) continue;
    }
    limbPath(c, L, g);
  }
  c.fill('nonzero');
  c.beginPath();
  for (const q of geo.sprays) {
    if (!take(q)) continue;
    if (!inView(q.x - q.R - 16, q.y - q.R - 16, q.x + q.R + 16, q.y + q.R + 16)) continue;
    const k = pop(g, q.t);
    if (k <= 0) continue;
    const L = q.leaves;
    for (let i = 0; i < L.length; i += 5) leafPath(c, q.x + L[i] * k, q.y + L[i + 1] * k, L[i + 2], L[i + 3] * k, L[i + 4] * k);
  }
  c.fill();
  // follaje: las manchas se suman en el canal verde. Al crecer, el campo sube
  // de a poco: primero aparecen hojas sueltas y después la masa
  c.globalCompositeOperation = 'lighter';
  const sp = spot();
  for (const q of only === 'base' ? geo.clusters : []) {
    if (!inView(q.x - q.R * 2.5, q.y - q.R * 2.5, q.x + q.R * 2.5, q.y + q.R * 2.5)) continue;
    const k = clamp((g - q.t) / 0.09, 0, 1);
    if (k <= 0) continue;
    const S = q.subs;
    for (let i = 0; i < S.length; i += 4) {
      const r = S[i + 2] * SPOT * (0.75 + 0.25 * k);
      c.globalAlpha = Math.min(1, S[i + 3] * k);
      c.drawImage(sp, q.x + S[i] - r, q.y + S[i + 1] - r, r * 2, r * 2);
    }
  }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

function bounds(geo) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const add = (x, y, r = 0) => {
    x0 = Math.min(x0, x - r);
    x1 = Math.max(x1, x + r);
    y0 = Math.min(y0, y - r);
    y1 = Math.max(y1, y + r);
  };
  for (const L of geo.limbs) for (let i = 0; i < L.xs.length; i++) add(L.xs[i], L.ys[i], L.ws[i]);
  for (const q of geo.sprays) add(q.x, q.y, q.R + 16);
  for (const q of geo.clusters) for (let i = 0; i < q.subs.length; i += 4) add(q.x + q.subs[i], q.y + q.subs[i + 1], q.subs[i + 2] * SPOT);
  for (const P of geo.polys || []) for (let i = 0; i < P.pts.length; i += 2) add(P.pts[i], P.pts[i + 1], 2);
  return { x: Math.floor(x0 - 4), y: Math.floor(y0 - 4), w: Math.ceil(x1 - x0 + 8), h: Math.ceil(y1 - y0 + 8) };
}

// ---------------------------------------------------------------------------

export function createSilhouette() {
  let ink, c, printer, D;
  let dpr = 1;
  let redraw = () => {};
  // fotos pegadas: cuánto está agrandada cada una (src → 0..1) y el reloj
  const zoomT = new Map();
  // la nota de la foto agrandada: cuánto se dibujó (src → 0..1)
  const capT = new Map();
  // ¿quedó algo animándose (zoom, nota, lista)? para __tree.idle()
  let animBusy = false;
  let zoomClock = 0;

  // ---------------------------------------------------------------- música
  // Reproductor: una pastilla impresa en la misma tinta, abajo a la derecha.
  // Toca las vistas previas de 30 s de la playlist (music/playlist.js) con un
  // <audio> común; al terminar una, sigue con la próxima. Arranca en una
  // canción al azar.
  // (una playlist de prueba no se publica: tools/v20-deploy.py la deja vacía)
  const tracks = (PLAYLIST && PLAYLIST.tracks) || [];
  // una lista armada a mano (order: 'fixed') arranca por la primera; una
  // playlist larga, por una al azar
  const music = { i: tracks.length && PLAYLIST.order !== 'fixed' ? Math.floor(Math.random() * tracks.length) : 0, audio: null, started: false, errors: 0 };
  function player() {
    if (music.audio) return music.audio;
    const a = new Audio();
    a.preload = 'none';
    for (const ev of ['play', 'pause', 'loadedmetadata']) a.addEventListener(ev, () => redraw());
    // la línea de avance se redibuja una vez por segundo, no en cada aviso
    let sec = -1;
    a.addEventListener('timeupdate', () => {
      const t = Math.floor(a.currentTime);
      if (t !== sec) {
        sec = t;
        redraw();
      }
    });
    a.addEventListener('playing', () => (music.errors = 0));
    a.addEventListener('ended', () => playTrack(music.i + 1));
    a.addEventListener('error', () => {
      // una vista previa que no carga: se pasa a la próxima (sin dar vueltas
      // para siempre si no carga ninguna)
      if (++music.errors < Math.min(5, tracks.length)) playTrack(music.i + 1);
      else redraw();
    });
    music.audio = a;
    return a;
  }
  function playTrack(i) {
    if (!tracks.length) return;
    music.i = ((i % tracks.length) + tracks.length) % tracks.length;
    const a = player();
    a.src = tracks[music.i].preview;
    music.started = true;
    a.play().catch(() => redraw());
    redraw();
  }
  function toggle() {
    const a = player();
    if (!music.started) playTrack(music.i);
    else if (a.paused) a.play().catch(() => {});
    else a.pause();
  }
  // para las pruebas
  window.__music = {
    get state() {
      const a = music.audio;
      return { started: music.started, playing: !!a && !a.paused, i: music.i, t: a ? a.currentTime : 0, title: tracks[music.i] && tracks[music.i].title, list: listOpen };
    },
  };

  // medidas de la pastilla: a la altura de "back", alineada a la derecha
  let pill = null;
  let pillM = 0; // el margen del marco con que se midió (para rehacerla al animar)
  // la lista: abierta o no, y cuánto (0..1, se anima)
  let listOpen = false;
  let listT = 0;
  const pillFont = (vw) => `500 ${vw < 700 ? 14 : 15}px "Libre Franklin", "Helvetica Neue", Arial, sans-serif`;
  function pillGeom(vw, vh, m) {
    const fs = vw < 700 ? 14 : 15;
    const H = Math.round(fs * 1.95);
    const padL = Math.round(H * 0.5), gw = Math.round(H * 0.5), gap = Math.round(H * 0.34), nw = Math.round(H * 0.72), padR = Math.round(H * 0.32);
    // ↗: la canción completa, afuera (la pastilla toca 30 s)
    const fw = Math.round(H * 0.7);
    // ▴ después del nombre: abre la lista de canciones
    const cw = Math.round(H * 0.5);
    const maxW = vw < 700 ? vw - 2 * (16 + m) - 70 : Math.min(380, vw * 0.34);
    const t = tracks[music.i];
    let label = t ? t.title + (t.artist ? ' · ' + t.artist : '') : '';
    const mc = c || document.createElement('canvas').getContext('2d');
    mc.font = pillFont(vw);
    const room = maxW - (padL + gw + gap + cw + gap + fw + nw + padR);
    if (mc.measureText(label).width > room) {
      while (label.length > 1 && mc.measureText(label + '…').width > room) label = label.slice(0, -1);
      label = label.trimEnd() + '…';
    }
    const tw = mc.measureText(label).width;
    const W0 = Math.round(padL + gw + gap + tw + cw + gap + fw + nw + padR);
    // Abierta, la pastilla crece hacia arriba con todas las canciones adentro
    // (en la columna del nombre) y un separador sobre la fila de los
    // controles. En la pantalla ancha se ensancha lo justo para los nombres;
    // en el teléfono no, porque pisaría "back", y los nombres se cortan.
    const lead = padL + gw + gap;
    const maxOpen = vw < 700 ? maxW : Math.min(470, vw * 0.42);
    const fitRow = (sTxt, room) => {
      if (mc.measureText(sTxt).width <= room) return sTxt;
      while (sTxt.length > 1 && mc.measureText(sTxt + '…').width > room) sTxt = sTxt.slice(0, -1);
      return sTxt.trimEnd() + '…';
    };
    const full = tracks.map((tr) => tr.title + (tr.artist ? ' · ' + tr.artist : ''));
    const widest = Math.max(0, ...full.map((sTxt) => mc.measureText(sTxt).width));
    // ancho abierto fijo (no depende de la que suena): el de los nombres, como
    // mínimo el más ancho que puede tener cerrada
    const W1 = Math.max(W0, Math.round(Math.min(Math.max(lead + widest + padR + 10, maxW), Math.max(maxW, maxOpen))));
    const rowsTxt = full.map((sTxt) => fitRow(sTxt, W1 - lead - padR - 6));
    const e = easeInOut(listT);
    const W = Math.round(lerp(W0, W1, e));
    const lh = Math.round(fs * 1.72), n = tracks.length;
    const extra = n * lh + 18; // filas + aire arriba + separador
    const right = vw - Math.max(16, vw * 0.03) - m;
    const cy = vh - Math.max(22, vh * 0.035) - m;
    const x = right - W, y = Math.round(cy - H / 2);
    const top = Math.round(y - extra * e);
    return {
      x, y, w: W, h: H, cy, label, padL, gw, gap, nw, padR, fw, cw, tw, e, lh,
      panel: { x, y: top, w: W, h: y + H - top },
      sepY: y - 4,
      rows: rowsTxt.map((sTxt, i) => {
        const rcy = Math.round(y - 10 - (n - i - 0.5) * lh);
        return { i, s: sTxt, cy: rcy, box: { x, y: rcy - lh / 2, w: W, h: lh } };
      }),
      play: { x, y, w: padL + gw + Math.round(gap / 2), h: H },
      title: { x: x + padL + gw + Math.round(gap / 2), y, w: W - nw - padR - fw - (padL + gw + Math.round(gap / 2)), h: H },
      full: { x: x + W - nw - padR - fw, y, w: fw, h: H },
      next: { x: x + W - nw - padR, y, w: nw + padR, h: H },
    };
  }
  // Nota a mano sobre la pastilla, en la portada y hasta que suena algo: dos líneas alineadas
  // con el nombre de la canción y una flecha curva que baja al play. Es parte
  // de los controles (click: suena), así que el texto de las notas no se le
  // mete abajo.
  const NOTE = ["maybe you'll know me better", 'if you listen to what i like!'];
  let noteMc = null;
  function noteGeom(P, vw) {
    const fs = vw < 700 ? 13 : 14, lh = Math.round(fs * 1.32);
    noteMc ||= document.createElement('canvas').getContext('2d');
    noteMc.font = fontOf(fs, 500);
    const w = Math.max(...NOTE.map((s) => noteMc.measureText(s).width));
    const x = P.x + P.padL + P.gw + P.gap;
    const yb = P.y - 15; // línea de base de la última línea
    const top = yb - lh * (NOTE.length - 1) - fs;
    return { x: x - 22, y: top - 4, w: w + 30, h: P.y - top + 2, tx: x, yb, fs, lh, top, gx: P.x + P.padL + P.gw / 2 };
  }
  function drawNote(cx, P, vw) {
    const N = noteGeom(P, vw);
    // la flecha: sale de la primera línea, se curva y baja al play
    const pts = [];
    const ax = N.tx - 7, ay = N.top + N.fs * 0.45, bx = N.gx + 0.5, by = P.y - 6;
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const px = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * (N.gx - 6) + u * u * bx;
      const py = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * (ay + 2) + u * u * by;
      pts.push([px + noise1(u * 3, 71) * 0.6, py]);
    }
    const head = [[bx - 3.6, by - 5.2], [bx, by], [bx + 3.8, by - 4.6]];
    const path = (k) => {
      k.beginPath();
      pts.forEach(([px, py], i) => (i ? k.lineTo(px, py) : k.moveTo(px, py)));
      k.moveTo(...head[0]);
      k.lineTo(...head[1]);
      k.lineTo(...head[2]);
    };
    cx.save();
    cx.font = fontOf(N.fs, 500);
    cx.textAlign = 'left';
    cx.textBaseline = 'alphabetic';
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    // aire alrededor, como las etiquetas sobre el follaje
    cx.globalCompositeOperation = 'destination-out';
    cx.lineWidth = N.fs * 0.7;
    NOTE.forEach((s, i) => cx.strokeText(s, N.tx, N.top + N.fs + i * N.lh));
    cx.lineWidth = 7;
    path(cx);
    cx.stroke();
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = INK;
    cx.strokeStyle = INK;
    NOTE.forEach((s, i) => cx.fillText(s, N.tx, N.top + N.fs + i * N.lh));
    cx.lineWidth = 1.5;
    path(cx);
    cx.stroke();
    cx.restore();
  }
  const capsule = (cx, x, y, w, h) => pillShape(cx, x, y, w, h, h / 2);
  // cápsula (r = la mitad del alto de la pastilla); más alta, un rectángulo
  // con esas mismas puntas redondas
  function pillShape(cx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.lineTo(x + w - r, y);
    cx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
    cx.lineTo(x + w, y + h - r);
    cx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    cx.lineTo(x + r, y + h);
    cx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    cx.lineTo(x, y + r);
    cx.arc(x + r, y + r, r, Math.PI, (Math.PI * 3) / 2);
    cx.closePath();
  }
  // la pastilla: plata llena, con lo de adentro calado (se ve el papel)
  function drawPill(cx, P, vw, hoverHud) {
    const a = music.audio;
    const playing = !!a && !a.paused;
    const B = P.panel, r = P.h / 2;
    cx.save();
    // aire alrededor, para que no se pegue al pasto ni al follaje
    cx.globalCompositeOperation = 'destination-out';
    pillShape(cx, B.x - 6, B.y - 6, B.w + 12, B.h + 12, r + 6);
    cx.fill();
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = INK;
    pillShape(cx, B.x, B.y, B.w, B.h, r);
    cx.fill();
    cx.globalCompositeOperation = 'destination-out';
    cx.fillStyle = '#000';
    cx.strokeStyle = '#000';
    const gx = P.x + P.padL + P.gw / 2, s = P.h * 0.2;
    if (playing) {
      cx.fillRect(gx - s * 0.85, P.cy - s, s * 0.6, s * 2);
      cx.fillRect(gx + s * 0.25, P.cy - s, s * 0.6, s * 2);
    } else {
      cx.beginPath();
      cx.moveTo(gx - s * 0.7, P.cy - s * 1.05);
      cx.lineTo(gx + s * 1.0, P.cy);
      cx.lineTo(gx - s * 0.7, P.cy + s * 1.05);
      cx.closePath();
      cx.fill();
    }
    cx.font = pillFont(vw);
    cx.textAlign = 'left';
    cx.textBaseline = 'middle';
    cx.fillText(P.label, P.x + P.padL + P.gw + P.gap, P.cy + 0.5);
    // ▴ (lista cerrada) o ▾ (abierta), después del nombre
    const kx = P.x + P.padL + P.gw + P.gap + P.tw + P.cw / 2, ks = P.h * 0.11;
    cx.beginPath();
    cx.moveTo(kx - ks * 1.1, P.cy + (listOpen ? -ks * 0.55 : ks * 0.55));
    cx.lineTo(kx + ks * 1.1, P.cy + (listOpen ? -ks * 0.55 : ks * 0.55));
    cx.lineTo(kx, P.cy + (listOpen ? ks * 0.75 : -ks * 0.75));
    cx.closePath();
    cx.fill();
    // ↗ completa: una diagonal con su punta
    const fx = P.full.x + P.full.w / 2, fsz = P.h * 0.15;
    cx.lineWidth = 1.7;
    cx.lineCap = 'round';
    cx.lineJoin = 'round';
    cx.beginPath();
    cx.moveTo(fx - fsz, P.cy + fsz);
    cx.lineTo(fx + fsz, P.cy - fsz);
    cx.moveTo(fx - fsz * 0.25, P.cy - fsz);
    cx.lineTo(fx + fsz, P.cy - fsz);
    cx.lineTo(fx + fsz, P.cy + fsz * 0.25);
    cx.stroke();
    // próxima: un triángulo con su barra
    const nx = P.next.x + P.next.w / 2 - P.padR / 2, ns = P.h * 0.17;
    cx.beginPath();
    cx.moveTo(nx - ns * 0.9, P.cy - ns);
    cx.lineTo(nx + ns * 0.6, P.cy);
    cx.lineTo(nx - ns * 0.9, P.cy + ns);
    cx.closePath();
    cx.fill();
    cx.fillRect(nx + ns * 0.7, P.cy - ns, ns * 0.42, ns * 2);
    // la lista, calada en la parte que creció: aparece de abajo arriba a
    // medida que la pastilla se abre. La que suena lleva un ▸ a la altura del
    // play; la que está bajo el mouse, una línea a mano
    if (P.e > 0) {
      cx.save();
      pillShape(cx, B.x, B.y, B.w, B.h, r);
      cx.clip();
      cx.lineCap = 'round';
      cx.lineWidth = 1.2;
      cx.beginPath();
      cx.moveTo(P.x + P.padL * 0.8, P.sepY);
      cx.lineTo(P.x + P.w - P.padR - 2, P.sepY);
      cx.stroke();
      const tx = P.x + P.padL + P.gw + P.gap, ts = P.h * 0.15;
      for (const row of P.rows) {
        if (row.cy + P.lh / 2 < B.y) continue;
        cx.fillText(row.s, tx, row.cy + 0.5);
        if (row.i === music.i && music.started) {
          cx.beginPath();
          cx.moveTo(gx - ts * 0.7, row.cy - ts);
          cx.lineTo(gx + ts, row.cy);
          cx.lineTo(gx - ts * 0.7, row.cy + ts);
          cx.closePath();
          cx.fill();
        }
        if (hoverHud === 'music-track-' + row.i) underline(cx, tx, row.cy + P.h * 0.3, cx.measureText(row.s).width, 30 + row.i, 1.4);
      }
      cx.restore();
    }
    // avance: una línea fina calada abajo, mientras suena
    if (music.started && a && a.duration > 0) {
      const x0 = P.x + P.h * 0.45, x1 = P.x + P.w - P.h * 0.45;
      cx.lineWidth = 1.6;
      cx.lineCap = 'round';
      cx.beginPath();
      cx.moveTo(x0, P.y + P.h - 4.5);
      cx.lineTo(x0 + (x1 - x0) * clamp(a.currentTime / a.duration, 0, 1), P.y + P.h - 4.5);
      cx.stroke();
    }
    cx.restore();
  }

  // ---------------------------------------------------------------- fondo
  // Con el mouse, el papel se corre apenas (hasta PAR px) para el lado
  // contrario; la tinta queda quieta. Con movimiento reducido no se mueve.
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PAR = REDUCED ? 0 : 7;
  const par = { x: 0, y: 0, tx: 0, ty: 0, last: 0 };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || !PAR) return;
    par.tx = -((e.clientX / innerWidth) - 0.5) * 2 * PAR;
    par.ty = -((e.clientY / innerHeight) - 0.5) * 2 * PAR * 0.6;
    // sin redraw(): el núcleo ve que el papel se está moviendo (animating) y
    // pasa sólo el shader, sin redibujar ni volver a subir la tinta
  });
  // En el teléfono: el papel sigue al dedo mientras toca y vuelve al centro
  // al soltar; y si el teléfono informa su inclinación (Android lo hace sin
  // pedir permiso), inclinarlo también lo corre. La inclinación se mide
  // contra una posición de reposo que se va acomodando sola, así que
  // sostenerlo torcido no deja el papel corrido.
  let touching = false;
  const tilt = { x: 0, y: 0, b0: null, g0: null };
  const touchTo = (e) => {
    par.tx = -((e.clientX / innerWidth) - 0.5) * 2 * PAR;
    par.ty = -((e.clientY / innerHeight) - 0.5) * 2 * PAR * 0.6;
  };
  const restTarget = () => {
    par.tx = -tilt.x * PAR;
    par.ty = -tilt.y * PAR * 0.6;
  };
  addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !PAR) return;
    touching = true;
    touchTo(e);
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' || !PAR || !touching) return;
    touchTo(e);
  });
  for (const ev of ['pointerup', 'pointercancel'])
    addEventListener(ev, (e) => {
      if (e.pointerType === 'mouse' || !PAR) return;
      touching = false;
      restTarget();
    });
  addEventListener('deviceorientation', (e) => {
    if (!PAR || e.gamma == null || e.beta == null) return;
    if (tilt.g0 == null) {
      tilt.g0 = e.gamma;
      tilt.b0 = e.beta;
    }
    tilt.g0 += (e.gamma - tilt.g0) * 0.01;
    tilt.b0 += (e.beta - tilt.b0) * 0.01;
    tilt.x = clamp((e.gamma - tilt.g0) / 18, -1, 1);
    tilt.y = clamp((e.beta - tilt.b0) / 18, -1, 1);
    if (!touching) restTarget();
  });
  const parBusy = () => Math.abs(par.tx - par.x) > 0.2 || Math.abs(par.ty - par.y) > 0.2;
  // el papel se acerca a donde tiene que ir, con suavidad y en píxeles enteros
  function stepPaper() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - (par.last || now)) / 1000);
    par.last = now;
    const ease = 1 - Math.exp(-dt * 5);
    par.x += (par.tx - par.x) * ease;
    par.y += (par.ty - par.y) * ease;
    if (!parBusy()) {
      par.x = par.tx;
      par.y = par.ty;
    }
    return { x: Math.round(par.x * dpr) / dpr, y: Math.round(par.y * dpr) / dpr };
  }
  // dónde estaba la cámara en el último cuadro completo (la tinta subida)
  let lastCam = null;
  window.__paper = par; // para las pruebas

  // ---------------------------------------------------------------- volver
  let backG = null;
  let backHover = false;
  function backGeom(vw, vh, m) {
    const fs = vw < 700 ? 14 : 15;
    const H = Math.round(fs * 1.95);
    const W = BACK === 'texto' ? Math.round(H * 2.2) : Math.round(H * 1.8);
    const x = Math.max(16, vw * 0.03) + m;
    const cy = vh - Math.max(22, vh * 0.035) - m;
    return { x, y: Math.round(cy - H / 2), w: W, h: H, cy };
  }
  // una vara que se afina: polígono a lo largo de puntos {x, y, w}
  function taper(cx, pts) {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      let tx = q.x - o.x, ty = q.y - o.y;
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl;
      ty /= tl;
      L.push(p.x - ty * p.w, p.y + tx * p.w);
      R.push(p.x + ty * p.w, p.y - tx * p.w);
    }
    cx.moveTo(L[0], L[1]);
    for (let i = 2; i < L.length; i += 2) cx.lineTo(L[i], L[i + 1]);
    const e = pts[pts.length - 1];
    cx.arc(e.x, e.y, e.w, 0, Math.PI * 2);
    cx.moveTo(R[R.length - 2], R[R.length - 1]);
    for (let i = R.length - 4; i >= 0; i -= 2) cx.lineTo(R[i], R[i + 1]);
    cx.lineTo(L[0], L[1]);
    cx.closePath();
    const b = pts[0];
    cx.moveTo(b.x + b.w, b.y);
    cx.arc(b.x, b.y, b.w, 0, Math.PI * 2);
  }
  // curva cuadrática muestreada con ancho que va de w0 a w1 y un temblor
  function bendPts(A, C, B, w0, w1, n, seed) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, m = 1 - u;
      out.push({
        x: m * m * A.x + 2 * m * u * C.x + u * u * B.x,
        y: m * m * A.y + 2 * m * u * C.y + u * u * B.y + noise1(u * 3 + seed, 95) * 0.35,
        w: lerp(w0, w1, u),
      });
    }
    return out;
  }
  // la flecha, en coordenadas de la pastilla: punta a la izquierda
  function backArrow(cx, G, dx) {
    const H = G.h, cy = G.cy;
    const x0 = G.x + H * 0.42 + dx, x1 = G.x + G.w - H * 0.4 + dx;
    const L = x1 - x0;
    cx.beginPath();
    if (BACK === 'rama') {
      taper(cx, bendPts({ x: x1, y: cy + 1.2 }, { x: x0 + L * 0.5, y: cy + 2.2 }, { x: x0 + 2.5, y: cy }, 1.5, 0.9, 10, 1));
      // punta: dos hojas hacia atrás
      leafPath(cx, x0 + H * 0.2, cy - H * 0.13, -0.7, H * 0.4, H * 0.15);
      leafPath(cx, x0 + H * 0.2, cy + H * 0.13, 0.7, H * 0.4, H * 0.15);
      // una hojita en la vara y una yema en el corte
      leafPath(cx, x0 + L * 0.62, cy - H * 0.15, -1.05, H * 0.3, H * 0.11);
      cx.moveTo(x1 + 2.2, cy + 1.2);
      cx.arc(x1, cy + 1.2, 2.2, 0, Math.PI * 2);
      cx.fill();
    } else if (BACK === 'hoja') {
      // hoja: aguda a la izquierda, redonda a la derecha
      const hx0 = x0, hx1 = x1 - H * 0.18, hh = H * 0.27;
      cx.moveTo(hx0, cy);
      cx.bezierCurveTo(hx0 + L * 0.3, cy - hh * 1.15, hx1 - L * 0.05, cy - hh * 1.05, hx1, cy - hh * 0.05);
      cx.bezierCurveTo(hx1 - L * 0.08, cy + hh * 1.0, hx0 + L * 0.32, cy + hh * 1.1, hx0, cy);
      cx.closePath();
      // tallo con una curva
      taper(cx, bendPts({ x: hx1 - 1, y: cy }, { x: x1 + 1, y: cy + 1 }, { x: x1 + 3, y: cy + H * 0.2 }, 1.1, 0.7, 6, 2));
      cx.fill();
      // nervaduras en plata, de vuelta sobre lo calado
      cx.save();
      cx.globalCompositeOperation = 'source-over';
      cx.fillStyle = INK;
      cx.beginPath();
      taper(cx, bendPts({ x: hx0 + 3, y: cy }, { x: hx0 + L * 0.5, y: cy - 0.6 }, { x: hx1 - 2, y: cy }, 0.45, 0.75, 8, 3));
      for (let i = 1; i <= 3; i++) {
        const bx = hx0 + L * (0.22 + i * 0.17);
        for (const sgn of [-1, 1]) taper(cx, bendPts({ x: bx, y: cy }, { x: bx - 1.5, y: cy + sgn * hh * 0.35 }, { x: bx - 3.5, y: cy + sgn * hh * 0.62 }, 0.45, 0.3, 4, i + sgn));
      }
      cx.fill();
      cx.restore();
    } else if (BACK === 'palitos') {
      // la vara con un nudo, y dos palitos cruzados en la punta
      taper(cx, bendPts({ x: x1 + 1, y: cy + 1.5 }, { x: x0 + L * 0.55, y: cy + 0.4 }, { x: x0 + 1, y: cy - 0.3 }, 1.35, 1.2, 10, 4));
      cx.moveTo(x0 + L * 0.58 + 2, cy + 0.6);
      cx.arc(x0 + L * 0.58, cy + 0.6, 2.0, 0, Math.PI * 2);
      const a = 0.68, l = H * 0.44;
      taper(cx, bendPts({ x: x0 - 1.5, y: cy - 1 }, { x: x0 + Math.cos(-a) * l * 0.5, y: cy + Math.sin(-a) * l * 0.5 }, { x: x0 + Math.cos(-a) * l, y: cy + Math.sin(-a) * l }, 1.15, 1.0, 6, 5));
      taper(cx, bendPts({ x: x0 - 1, y: cy + 1.2 }, { x: x0 + Math.cos(a) * l * 0.5, y: cy + 1 + Math.sin(a) * l * 0.5 }, { x: x0 + Math.cos(a) * l, y: cy + 1 + Math.sin(a) * l }, 1.15, 1.0, 6, 6));
      // una ramita que sale de un palito
      taper(cx, bendPts({ x: x0 + L * 0.3, y: cy }, { x: x0 + L * 0.34, y: cy - 2.5 }, { x: x0 + L * 0.4, y: cy - 4.5 }, 0.7, 0.45, 4, 7));
      cx.fill();
    } else if (BACK === 'raiz') {
      // ↩: baja por la derecha, vuelve hacia la izquierda y termina en punta
      const yb = cy + H * 0.12, yt = cy - H * 0.2;
      const pts = [
        ...bendPts({ x: x1 - L * 0.12, y: yt }, { x: x1 + L * 0.14, y: (yt + yb) / 2 - 1 }, { x: x1 - L * 0.12, y: yb }, 1.9, 1.6, 8, 8),
        ...bendPts({ x: x1 - L * 0.12, y: yb }, { x: x0 + L * 0.45, y: yb + 1.2 }, { x: x0 + 2, y: yb }, 1.6, 0.9, 10, 9).slice(1),
      ];
      taper(cx, pts);
      const a = 0.72, l = H * 0.3;
      taper(cx, bendPts({ x: x0 + 2, y: yb }, { x: x0 + 2 + Math.cos(-a) * l * 0.5, y: yb + Math.sin(-a) * l * 0.5 + 0.6 }, { x: x0 + 2 + Math.cos(-a) * l, y: yb + Math.sin(-a) * l }, 1.0, 0.55, 5, 10));
      taper(cx, bendPts({ x: x0 + 2, y: yb }, { x: x0 + 2 + Math.cos(a) * l * 0.5, y: yb + Math.sin(a) * l * 0.5 - 0.6 }, { x: x0 + 2 + Math.cos(a) * l, y: yb + Math.sin(a) * l }, 1.0, 0.55, 5, 11));
      // raicillas que cuelgan
      for (let i = 0; i < 3; i++) {
        const bx = x0 + L * (0.3 + i * 0.2);
        taper(cx, bendPts({ x: bx, y: yb + 1 }, { x: bx + 1, y: yb + 3 }, { x: bx - 0.5 + i, y: yb + 4.5 + i }, 0.55, 0.35, 4, 12 + i));
      }
      cx.fill();
    } else {
      cx.font = `500 ${H > 28 ? 15 : 14}px "Libre Franklin", "Helvetica Neue", Arial, sans-serif`;
      cx.textAlign = 'center';
      cx.textBaseline = 'middle';
      cx.fillText('back', G.x + G.w / 2 + dx, cy + 0.5);
    }
  }
  function drawBack(cx, G) {
    cx.save();
    cx.globalCompositeOperation = 'destination-out';
    capsule(cx, G.x - 6, G.y - 6, G.w + 12, G.h + 12);
    cx.fill();
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = INK;
    capsule(cx, G.x, G.y, G.w, G.h);
    cx.fill();
    cx.globalCompositeOperation = 'destination-out';
    cx.fillStyle = '#000';
    // al pasar el mouse, la flecha se corre un poco hacia atrás
    backArrow(cx, G, backHover ? -2.5 : 0);
    cx.restore();
  }
  addEventListener('pointermove', (e) => {
    const h = !!backG && e.clientX >= backG.x - 4 && e.clientX <= backG.x + backG.w + 4 && e.clientY >= backG.y - 3 && e.clientY <= backG.y + backG.h + 3;
    if (h !== backHover) {
      backHover = h;
      redraw();
    }
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'b' || e.metaKey || e.ctrlKey || e.altKey) return;
    const u = new URL(location.href);
    u.searchParams.set('back', BACKS[(BACKS.indexOf(BACK) + 1) % BACKS.length]);
    location.href = u.toString();
  });

  // marcas de imprenta (pliego): de corte en las esquinas y de registro en el
  // medio de cada lado, en la misma tinta
  function cropMarks(cx, vw, vh, T) {
    cx.save();
    cx.lineWidth = 1.1;
    cx.strokeStyle = INK;
    cx.beginPath();
    for (const [x, sx] of [[T, -1], [vw - T, 1]])
      for (const [y, sy] of [[T, -1], [vh - T, 1]]) {
        cx.moveTo(x + sx * 4, y);
        cx.lineTo(x + sx * T, y);
        cx.moveTo(x, y + sy * 4);
        cx.lineTo(x, y + sy * T);
      }
    const r = T * 0.26, l = T * 0.42;
    for (const [x, y] of [[vw / 2, T / 2], [vw / 2, vh - T / 2], [T / 2, vh / 2], [vw - T / 2, vh / 2]]) {
      cx.moveTo(x + r, y);
      cx.arc(x, y, r, 0, Math.PI * 2);
      cx.moveTo(x - l, y);
      cx.lineTo(x + l, y);
      cx.moveTo(x, y - l);
      cx.lineTo(x, y + l);
    }
    cx.stroke();
    cx.restore();
  }
  addEventListener('keydown', (e) => {
    if (e.key !== 'p' || e.metaKey || e.ctrlKey || e.altKey) return;
    const u = new URL(location.href);
    u.searchParams.set('foto', FOTOS[(FOTOS.indexOf(FOTO || 'estampilla') + 1) % FOTOS.length]);
    location.href = u.toString();
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'f' || e.metaKey || e.ctrlKey || e.altKey) return;
    const u = new URL(location.href);
    u.searchParams.set('frame', FRAMES[(FRAMES.indexOf(FRAME) + 1) % FRAMES.length]);
    location.href = u.toString();
  });

  // baldosas del suelo: la geometría se guarda; el lienzo pintado sólo
  // mientras la baldosa se ve (si vuelve a entrar, se repinta)
  const chunks = new Map();
  function chunk(key, build) {
    let e = chunks.get(key);
    if (e) {
      chunks.delete(key);
      chunks.set(key, e);
      return e;
    }
    e = { geo: build(), cache: null };
    chunks.set(key, e);
    if (chunks.size > 400) chunks.delete(chunks.keys().next().value);
    return e;
  }
  function chunkCanvas(e) {
    if (e.cache && e.cache.dpr === dpr) return e.cache;
    const b = bounds(e.geo);
    if (!(b.w > 0 && b.h > 0 && isFinite(b.w) && isFinite(b.h))) return null;
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(b.w * dpr);
    cv.height = Math.ceil(b.h * dpr);
    const cc = cv.getContext('2d');
    cc.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
    cc.fillStyle = INK;
    cc.strokeStyle = INK;
    paintGround(cc, e.geo, 1.2);
    e.cache = { cv, x: b.x, y: b.y, w: cv.width / dpr, h: cv.height / dpr, dpr };
    return e.cache;
  }
  function blit(cx, e) {
    const k = chunkCanvas(e);
    if (!k) return;
    cx.globalCompositeOperation = 'lighter';
    cx.drawImage(k.cv, k.x, k.y, k.w, k.h);
    cx.globalCompositeOperation = 'source-over';
  }
  // suelo visible: franjas de pradera si la línea de tierra anda cerca, y
  // baldosas de tierra si se ve algo debajo de ella
  function drawGround(cx, vx, vy, vw, vh, g) {
    const used = new Set();
    const ix0 = Math.floor((vx - 140) / CW), ix1 = Math.floor((vx + vw + 140) / CW);
    if (vy + vh > -260 && vy < 40)
      for (let ix = ix0; ix <= ix1; ix++) {
        const key = 'm' + ix;
        const e = chunk(key, () => meadowChunk(ix, D));
        used.add(key);
        if (g < 1) {
          // mientras crece, el pasto aparece desde el tronco hacia los
          // costados: la franja ya pintada se descubre con un recorte que se
          // abre (antes se armaban miles de briznas por cuadro)
          const reach = Math.max(300, D.vw * 0.7);
          const r = clamp((g * 1.1 - 0.01) / 0.12, 0, 1) * reach + 24;
          cx.save();
          cx.beginPath();
          cx.rect(-r, -400, 2 * r, 420);
          cx.clip();
          blit(cx, e);
          cx.restore();
        } else blit(cx, e);
      }
    if (vy + vh > 0) {
      const iy0 = Math.max(0, Math.floor((vy - 60) / CH)), iy1 = Math.floor((vy + vh + 60) / CH);
      for (let iy = iy0; iy <= iy1; iy++)
        for (let ix = ix0; ix <= ix1; ix++) {
          const key = 's' + ix + ':' + iy;
          const e = chunk(key, () => soilChunk(ix, iy, D));
          used.add(key);
          blit(cx, e);
        }
    }
    for (const [key, e] of chunks) if (!used.has(key)) e.cache = null;
  }

  // la base de una rama ya crecida se pinta una vez en su propio canvas y
  // después se calca; las ramitas de los ítems se pintan aparte, porque cada
  // una puede ir en tinta plena o escasa
  function cached(geo) {
    if (geo.cache && geo.cache.dpr === dpr) return geo.cache;
    const b = bounds(geo);
    const cv = document.createElement('canvas');
    cv.width = Math.ceil(b.w * dpr);
    cv.height = Math.ceil(b.h * dpr);
    const cc = cv.getContext('2d');
    cc.setTransform(dpr, 0, 0, dpr, -b.x * dpr, -b.y * dpr);
    cc.fillStyle = INK;
    paintGeo(cc, geo, 1.2, 'base');
    geo.cache = { cv, x: b.x, y: b.y, w: cv.width / dpr, h: cv.height / dpr, dpr };
    return geo.cache;
  }

  // Fotos: se cargan en gris y se pasan al canal azul (alfa = luz). El
  // shader las imprime con una trama estocástica.
  const photos = new Map();
  function photo(src) {
    let p = photos.get(src);
    if (p) return p.cv;
    p = { cv: null };
    photos.set(src, p);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const x = cv.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = d.data[i];
        d.data[i] = 0;
        d.data[i + 1] = 0;
        d.data[i + 2] = 255;
        d.data[i + 3] = v;
      }
      x.putImageData(d, 0, 0);
      p.cv = cv;
      redraw();
    };
    // las rutas de posts.js son relativas a la carpeta de la versión (una
    // arriba de src/): así funciona igual en natochi-city y en natochi.cv
    img.src = new URL('../' + src, import.meta.url).href;
    return null;
  }

  // ---- foto de "me" con estilo ----
  // La caja (w × h) es la de afuera, con el origen en su centro. Cada estilo
  // da la forma de la foto (`clip`), el rectángulo que la foto cubre (`win`) y
  // su marco (`frame`), que se pinta una vez en su propio lienzo y se calca.
  // `m`: cuánto puede salirse el marco de la caja (giro, argolla, tallo).
  const TAU = Math.PI * 2;
  function wobble(x, pts, close = true) {
    x.beginPath();
    pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
    if (close) x.closePath();
  }
  // contorno a mano de un óvalo
  const handOval = (rx, ry, cy, seed, amp = 0.7) =>
    Array.from({ length: 72 }, (_, i) => {
      const a = (i / 72) * TAU;
      const j = noise1((i / 72) * 6 + seed, 33) * amp;
      return [(rx + j) * Math.cos(a), cy + (ry + j) * Math.sin(a)];
    });
  // hoja: eje inclinado, más ancha hacia la base, punta fina
  function leafPts(w) {
    const L = w * 1.2, Wm = w * 0.35, th = 0.6;
    const d = [Math.sin(th), -Math.cos(th)], n = [Math.cos(th), Math.sin(th)];
    const side = (sg) =>
      Array.from({ length: 33 }, (_, i) => {
        const t = sg > 0 ? i / 32 : 1 - i / 32;
        const hw = Wm * Math.pow(Math.sin(Math.PI * t), 0.75) * (1.12 - 0.3 * t) + noise1(t * 7 + sg, 41) * 0.5;
        const p = -L / 2 + L * t;
        return [d[0] * p + n[0] * hw * sg, d[1] * p + n[1] * hw * sg];
      });
    return { pts: [...side(1), ...side(-1)], base: [-d[0] * L / 2, -d[1] * L / 2], d, n };
  }
  // borde rasgado: el contorno de un rectángulo con dientes chicos y algún
  // desgarro más grande
  function tornPts(w, h, inset, seed = 0) {
    const pts = [];
    const x0 = -w / 2 + inset, y0 = -h / 2 + inset, x1 = w / 2 - inset, y1 = h / 2 - inset;
    const edges = [[x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0], [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0]];
    edges.forEach(([ax, ay, bx, by, nx, ny], e) => {
      const len = Math.hypot(bx - ax, by - ay), k = Math.round(len / 2.5);
      for (let i = 0; i < k; i++) {
        const u = i / k;
        const q = e * 3.1 + seed * 17.3;
        const j = noise1(u * 9 + q, 51) * 1.3 + Math.max(0, noise1(u * 2.3 + q, 52)) * 2.6 + ((i * 7 + e + seed) % 3) * 0.35;
        pts.push([ax + (bx - ax) * u - nx * j, ay + (by - ay) * u - ny * j]);
      }
    });
    return pts;
  }
  const PHOTO_STYLES = {
    lisa: { m: 0, clip: (x, w, h) => x.rect(-w / 2, -h / 2, w, h), win: (w, h) => [-w / 2, -h / 2, w, h] },
    estampilla: {
      rot: -0.06,
      m: 8,
      win: (w, h) => [-w / 2 + 9, -h / 2 + 9, w - 18, h - 32],
      clip(x, w, h) {
        x.rect(...this.win(w, h));
      },
      frame(x, w, h) {
        x.fillRect(-w / 2, -h / 2, w, h);
        x.globalCompositeOperation = 'destination-out';
        const [a, b, ww, hh] = this.win(w, h);
        x.fillRect(a - 1.5, b - 1.5, ww + 3, hh + 3);
        // dientes: medios agujeros sobre el borde, también en las esquinas
        const r = 3, step = 8.5;
        x.beginPath();
        for (const [ax, ay, bx, by] of [[-w / 2, -h / 2, w / 2, -h / 2], [w / 2, -h / 2, w / 2, h / 2], [w / 2, h / 2, -w / 2, h / 2], [-w / 2, h / 2, -w / 2, -h / 2]]) {
          const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
          for (let i = 0; i < k; i++) {
            const px = ax + ((bx - ax) * i) / k, py = ay + ((by - ay) * i) / k;
            x.moveTo(px + r, py);
            x.arc(px, py, r, 0, TAU);
          }
        }
        x.fill();
        x.font = fontOf(10, 700);
        x.textBaseline = 'middle';
        x.textAlign = 'left';
        x.fillText('natochi', -w / 2 + 10, h / 2 - 12);
        x.textAlign = 'right';
        x.fillText('26', w / 2 - 10, h / 2 - 12);
        x.globalCompositeOperation = 'source-over';
      },
    },
    camafeo: {
      m: 6,
      zoom: 1.1,
      oval: (w, h) => [w * 0.34, h * 0.4, 6],
      win(w, h) {
        const [rx, ry, cy] = this.oval(w, h);
        return [-rx, cy - ry, rx * 2, ry * 2];
      },
      clip(x, w, h) {
        const [rx, ry, cy] = this.oval(w, h);
        x.ellipse(0, cy, rx, ry, 0, 0, TAU);
      },
      frame(x, w, h) {
        const [rx, ry, cy] = this.oval(w, h);
        x.lineJoin = 'round';
        wobble(x, handOval(rx + 4.5, ry + 4.5, cy, 1.3));
        x.lineWidth = 2.6;
        x.stroke();
        wobble(x, handOval(rx + 9.5, ry + 9.5, cy, 4.1, 0.9));
        x.lineWidth = 1;
        x.stroke();
        // argolla arriba
        const top = cy - ry - 9.5;
        x.beginPath();
        x.ellipse(0, top - 5.5, 4.2, 5.2, 0, 0, TAU);
        x.lineWidth = 1.8;
        x.stroke();
      },
    },
    hoja: {
      m: 22,
      win: (w, h) => [-w / 2, -h / 2, w, h],
      clip(x, w) {
        const { pts } = leafPts(w);
        pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
        x.closePath();
      },
      frame(x, w) {
        const { pts, base, d, n } = leafPts(w);
        x.lineJoin = 'round';
        wobble(x, pts);
        x.lineWidth = 1.4;
        x.stroke();
        // tallo: sale de la base, se curva apenas y se afina
        const L = 20;
        x.beginPath();
        x.moveTo(base[0] + n[0] * 1.6, base[1] + n[1] * 1.6);
        x.quadraticCurveTo(base[0] - d[0] * L * 0.5 + n[0] * 3, base[1] - d[1] * L * 0.5 + n[1] * 3, base[0] - d[0] * L + n[0] * 5, base[1] - d[1] * L + n[1] * 5);
        x.quadraticCurveTo(base[0] - d[0] * L * 0.5 + n[0] * 1, base[1] - d[1] * L * 0.5 + n[1] * 1, base[0] - n[0] * 1.6, base[1] - n[1] * 1.6);
        x.fill();
      },
    },
    pegada: {
      rot: 0.05,
      m: 14,
      win: (w, h) => [-w / 2, -h / 2, w, h],
      clip(x, w, h, seed) {
        tornPts(w, h, 3, seed).forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py)));
        x.closePath();
      },
      // cinta: media tinta sobre la foto, cortes en zigzag y un filete calado
      // que la separa de lo de abajo. Cada foto la lleva distinto (seed):
      // una arriba al medio, dos en las esquinas de arriba, o en diagonal.
      // Se dibuja directo (no se calca), a la escala de la foto (`s`).
      tapes(x, w, h, seed, s) {
        const tw = clamp(w * 0.34, 34, 62), th = 13;
        const v = seed % 3;
        const spots =
          v === 1
            ? [[-w * 0.05, -h / 2 + 2, -0.12]]
            : v === 2
              ? [[-w / 2 + 9, -h / 2 + 9, -0.75], [w / 2 - 9, -h / 2 + 9, 0.72]]
              : [[-w / 2 + 9, -h / 2 + 9, -0.78], [w / 2 - 9, h / 2 - 9, -0.74]];
        spots.forEach(([tx, ty, tr], k) => {
          x.save();
          x.translate(tx, ty);
          x.rotate(tr);
          const pts = [];
          for (let i = 0; i <= 5; i++) pts.push([-tw / 2 + (i % 2) * 1.8, -th / 2 + (th * i) / 5]);
          for (let i = 5; i >= 0; i--) pts.push([tw / 2 - ((i + 1) % 2) * 1.8 + noise1(i + seed * 3 + k, 61), -th / 2 + (th * i) / 5]);
          wobble(x, pts);
          x.globalCompositeOperation = 'destination-out';
          x.lineWidth = 2.6 / s;
          x.stroke();
          x.globalCompositeOperation = 'source-over';
          x.globalAlpha = 0.42;
          x.fill();
          x.restore();
        });
      },
    },
  };
  const photoFrames = new Map(); // marco ya pintado, por estilo, tamaño y dpr
  function photoFrame(name, st, w, h) {
    const key = name + '|' + w + '|' + h + '|' + dpr;
    let f = photoFrames.get(key);
    if (f) return f;
    f = document.createElement('canvas');
    f.width = Math.ceil((w + 2 * st.m) * dpr);
    f.height = Math.ceil((h + 2 * st.m) * dpr);
    const x = f.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, (w / 2 + st.m) * dpr, (h / 2 + st.m) * dpr);
    x.fillStyle = INK;
    x.strokeStyle = INK;
    st.frame(x, w, h);
    photoFrames.set(key, f);
    return f;
  }
  // la foto cubre su rectángulo (recortada al centro, `zoom` la acerca)
  function photoIn(cx, cv, [x, y, w, h], zoom = 1) {
    let sw = cv.width, sh = cv.height;
    if (sw / sh > w / h) sw = sh * (w / h);
    else sh = sw / (w / h);
    sw /= zoom;
    sh /= zoom;
    cx.drawImage(cv, (cv.width - sw) / 2, (cv.height - sh) / 2, sw, sh, x, y, w, h);
  }
  // Nota de una foto agrandada: unas palabras a mano arriba de la foto (o
  // abajo, si no hay lugar), con una flecha curva que se dibuja hacia ella y
  // el texto que se escribe detrás (t: 0..1). `\n` corta la línea.
  function drawCaption(cx, G, note, t, vw, vh, seed, avoid = []) {
    const fs = 14, lh = Math.round(fs * 1.38), maxW = Math.max(220, Math.min(320, G.w - 40));
    cx.save();
    cx.font = fontOf(fs, 500);
    cx.textAlign = 'left';
    cx.textBaseline = 'alphabetic';
    cx.lineJoin = 'round';
    cx.lineCap = 'round';
    const lines = [];
    for (const para of note.split('\n')) {
      let cur = '';
      for (const w of para.split(/\s+/)) {
        const tryS = cur ? cur + ' ' + w : w;
        if (cur && cx.measureText(tryS).width > maxW) {
          lines.push(cur);
          cur = w;
        } else cur = tryS;
      }
      if (cur) lines.push(cur);
    }
    const bw = Math.max(...lines.map((l) => cx.measureText(l).width));
    const bh = (lines.length - 1) * lh + fs;
    // dónde: arriba de la foto (ahí suele haber papel libre, el cielo) o
    // abajo, corriéndose a la derecha de las líneas del texto que pisaría
    // (`avoid`); si no entra, al costado. La flecha sale del texto y se curva
    // hasta el borde de la foto
    const hit = (x, y) => avoid.filter((r) => r.y < y + bh + 6 && r.y + r.h > y - 6 && r.x < x + bw + 8 && r.x + r.w > x - 8);
    let side = null, tx = 0, ty = 0;
    for (const up of [true, false]) {
      ty = up ? G.y - 38 - bh : G.y + G.h + 38;
      if (ty < 18 || ty + bh > vh - 70) continue;
      tx = clamp(G.x + 40, 26, vw - bw - 26);
      const hs = hit(tx, ty);
      if (hs.length) tx = Math.max(tx, ...hs.map((r) => r.x + r.w + 26));
      if (tx + bw > vw - 26 || hit(tx, ty).length) continue;
      side = up ? 'above' : 'below';
      break;
    }
    if (!side) {
      side = vw - (G.x + G.w) >= bw + 76 ? 'right' : 'left';
      tx = side === 'right' ? G.x + G.w + 54 : G.x - 54 - bw;
      ty = clamp(G.y + G.h * 0.2, 24, vh - bh - 90);
    }
    const midOf = (i) => ty + fs * 0.62 + i * lh;
    let ax, ay, bx, by, qx, qy;
    if (side === 'above' || side === 'below') {
      ay = side === 'above' ? midOf(lines.length - 1) : midOf(0);
      ax = tx - 9;
      bx = clamp(tx - 20, G.x + 14, G.x + G.w - 14);
      by = side === 'above' ? G.y - 7 : G.y + G.h + 7;
      qx = Math.min(ax, bx) - 14;
      qy = ay + (side === 'above' ? 2 : -2);
    } else {
      ay = midOf(0);
      ax = side === 'right' ? tx - 9 : tx + bw + 9;
      bx = side === 'right' ? G.x + G.w + 9 : G.x - 9;
      by = ay + 34;
      qx = (ax + bx) / 2 + (side === 'right' ? 4 : -4);
      qy = ay - 14;
    }
    const ua = clamp(t / 0.45, 0, 1), N = 20;
    const pts = [];
    for (let i = 0; i <= Math.round(N * ua); i++) {
      const u = i / N;
      const px = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * qx + u * u * bx;
      const py = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * qy + u * u * by;
      pts.push([px + noise1(u * 4 + seed, 81) * 0.7, py + noise1(u * 4 + seed, 82) * 0.7]);
    }
    let head = null;
    if (ua >= 1 && pts.length > 2) {
      const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[pts.length - 3];
      const ang = Math.atan2(y1 - y0, x1 - x0), L = 7.5;
      head = [[x1 - L * Math.cos(ang - 0.5), y1 - L * Math.sin(ang - 0.5)], [x1, y1], [x1 - L * Math.cos(ang + 0.5), y1 - L * Math.sin(ang + 0.5)]];
    }
    const arrow = () => {
      cx.beginPath();
      pts.forEach(([px, py], i) => (i ? cx.lineTo(px, py) : cx.moveTo(px, py)));
      if (head) {
        cx.moveTo(...head[0]);
        cx.lineTo(...head[1]);
        cx.lineTo(...head[2]);
      }
    };
    // el texto se escribe cuando la flecha va por la mitad
    let left = Math.round(lines.join('').length * clamp((t - 0.25) / 0.75, 0, 1));
    const shown = lines.map((l) => {
      const k = Math.min(l.length, Math.max(0, left));
      left -= l.length;
      return l.slice(0, k);
    });
    // aire alrededor y después la tinta
    cx.globalCompositeOperation = 'destination-out';
    cx.lineWidth = fs * 0.72;
    shown.forEach((l, i) => l && cx.strokeText(l, tx, ty + fs + i * lh));
    cx.lineWidth = 7;
    arrow();
    cx.stroke();
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = INK;
    cx.strokeStyle = INK;
    shown.forEach((l, i) => l && cx.fillText(l, tx, ty + fs + i * lh));
    cx.lineWidth = 1.6;
    arrow();
    cx.stroke();
    cx.restore();
  }

  // Se imprime de arriba abajo (f: 0..1), con centro, giro y escala (T: {cx,
  // cy, rot, s}). Antes borra la tinta bajo su forma, con un filete: así tapa
  // de verdad lo que tiene debajo (otra foto, su cinta, el pasto), porque las
  // fotos se suman en el azul y si no se verían una a través de la otra.
  function styledPhoto(cx, cv, im, f, name, T) {
    const st = PHOTO_STYLES[name] || PHOTO_STYLES.lisa;
    const { w, h } = im, m = st.m, seed = im.seed || 0;
    cx.save();
    cx.translate(T.cx, T.cy);
    if (T.rot) cx.rotate(T.rot);
    if (T.s !== 1) cx.scale(T.s, T.s);
    cx.beginPath();
    cx.rect(-w / 2 - m, -h / 2 - m, w + 2 * m, (h + 2 * m) * f);
    cx.clip();
    cx.save();
    cx.globalCompositeOperation = 'destination-out';
    cx.beginPath();
    st.clip(cx, w, h, seed);
    cx.fill();
    cx.lineWidth = 4 / T.s;
    cx.stroke();
    cx.restore();
    cx.save();
    cx.beginPath();
    st.clip(cx, w, h, seed);
    cx.clip();
    cx.globalCompositeOperation = 'lighter';
    photoIn(cx, cv, st.win(w, h), st.zoom);
    cx.restore();
    if (st.tapes) st.tapes(cx, w, h, seed, T.s);
    else if (st.frame) cx.drawImage(photoFrame(name, st, w, h), -w / 2 - m, -h / 2 - m, w + 2 * m, h + 2 * m);
    cx.restore();
  }

  // trazo a mano debajo de una etiqueta o un link (hover)
  function underline(cx, x, y, w, seed, lw = 1.5) {
    cx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      const px = x + (w + 2) * u - 1;
      const py = y + noise1(u * 3 + seed, 21) * 0.8;
      i ? cx.lineTo(px, py) : cx.moveTo(px, py);
    }
    cx.lineWidth = lw;
    cx.stroke();
  }

  const fontOf = (size, weight = 500) => `${weight} ${size}px "Libre Franklin", "Helvetica Neue", Arial, sans-serif`;

  // un texto (el de "me" o el de una nota): líneas, viñetas, links y fotos,
  // hasta el carácter `chars`. Los links llevan una línea fina debajo.
  // Lo fijo en pantalla ("back") no se tapa: una línea que lo tocaría se
  // esconde entera (nunca a medias). Las fotos se imprimen enteras; si pasan
  // por debajo de "back", la palabra se cala en ellas como en el follaje.
  function drawDoc(cx, it, fontSize, hoverLink, fixed = [], Z = {}) {
    const d = it.doc;
    const lh = it.lh;
    const hidden = (y) => fixed.some((r) => y + lh > r.y - 4 && y < r.y + r.h + 4 && it.x < r.x + r.w + 8 && it.x + d.w > r.x - 8);
    cx.textAlign = 'left';
    cx.textBaseline = 'middle';
    const vhC = cx.canvas.height / dpr;
    for (const ln of d.lines) {
      if (!ln.segs.length || it.chars <= ln.segs[0].c0) continue;
      if (it.y + ln.y + lh < 0 || it.y + ln.y > vhC) continue;
      if (hidden(it.y + ln.y)) continue;
      cx.font = fontOf(fontSize, ln.kind === 'h' ? 700 : 500);
      const y = it.y + ln.y + lh / 2;
      if (ln.bullet) cx.fillText('·', it.x + Math.round(fontSize * 0.25), y);
      for (const sg of ln.segs) {
        const n = it.chars - sg.c0;
        if (n <= 0) break;
        cx.fillText(n >= sg.s.length ? sg.s : sg.s.slice(0, n), it.x + sg.x, y);
        if (sg.href && n >= sg.s.length) {
          if (sg.href === hoverLink) underline(cx, it.x + sg.x, y + fontSize * 0.62, sg.w, sg.c0, 1.6);
          else cx.fillRect(it.x + sg.x, y + fontSize * 0.58, sg.w, 1);
        }
      }
    }
    // subrayados a mano: un trazo de marcador que se afina en las puntas,
    // ondula y sube apenas; aparece de izquierda a derecha cuando la palabra
    // termina de escribirse
    for (const ln of d.lines) {
      const y = it.y + ln.y + lh / 2;
      if (y + lh < 0 || y - lh > vhC) continue;
      if (hidden(it.y + ln.y)) continue;
      for (let i = 0; i < ln.segs.length; ) {
        const m = ln.segs[i].mark;
        let j = i;
        while (j + 1 < ln.segs.length && m && ln.segs[j + 1].mark === m) j++;
        if (m) {
          const a = ln.segs[i], b = ln.segs[j];
          const f = it.chars >= d.chars ? 1 : clamp((it.chars - (b.c0 + b.s.length)) / 10, 0, 1);
          if (f > 0) handMark(cx, it.x + a.x - 2, it.x + b.x + b.w + 3, y + fontSize * 0.66, f, m);
        }
        i = j + 1;
      }
    }
    // fotos: se imprimen de arriba abajo a medida que el texto llega. Una
    // pegada bajo el mouse se agranda, se endereza y va al final, encima de
    // todo (Z.zoom: src → 0..1)
    const zoomOf = (im) => (Z.zoom && Z.zoom.get(im.src)) || 0;
    // se piden todas apenas se abre el texto, para que ninguna deje un hueco
    // mientras carga cuando la hoja llega hasta ella
    for (const im of d.imgs) photo(im.src);
    const order = d.imgs.slice().sort((a, b) => zoomOf(a) - zoomOf(b));
    for (const im of order) {
      const f = clamp((it.chars - im.c0) / Math.max(1, im.c1 - im.c0), 0, 1);
      if (f <= 0) continue;
      const z = zoomOf(im);
      if (!z && (it.y + im.y + im.h < -20 || it.y + im.y > vhC + 20)) continue;
      const cv = photo(im.src);
      if (!cv) continue;
      if (im.style) {
        const name = FOTO || im.style;
        const st = PHOTO_STYLES[name] || PHOTO_STYLES.lisa;
        const B = { x: it.x + im.x, y: it.y + im.y, w: im.w, h: im.h };
        const r0 = im.rot ?? st.rot ?? 0;
        const T = { cx: B.x + B.w / 2, cy: B.y + B.h / 2, rot: r0, s: 1 };
        let G = null;
        if (z > 0) {
          G = photoZoom(B, Z.vw, Z.vh);
          const e = easeInOut(z);
          T.cx = lerp(T.cx, G.x + G.w / 2, e);
          T.cy = lerp(T.cy, G.y + G.h / 2, e);
          T.rot = lerp(r0, 0, e);
          T.s = lerp(1, G.s, e);
        }
        styledPhoto(cx, cv, im, f, name, T);
        const ct = G && im.note && Z.cap ? Z.cap.get(im.src) || 0 : 0;
        if (ct > 0) drawCaption(cx, G, im.note, ct, Z.vw, Z.vh, im.seed, d.lines.map((ln) => ({ x: it.x, y: it.y + ln.y, w: ln.end, h: lh })));
        continue;
      }
      const h = im.h * f;
      cx.save();
      cx.globalCompositeOperation = 'lighter';
      cx.beginPath();
      cx.rect(it.x + im.x, it.y + im.y, im.w, h);
      cx.clip();
      cx.drawImage(cv, it.x + im.x, it.y + im.y, im.w, im.h);
      cx.restore();
    }
  }

  function handMark(cx, x0, x1, y, f, seed) {
    const n = 18;
    const len = x1 - x0;
    const top = [], bot = [];
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * f;
      const px = x0 + len * u;
      const py = y + noise1(u * 2.2 + seed * 0.37, 91) * 1.6 - u * 1.2;
      const w = 0.5 + 1.25 * Math.pow(Math.sin(Math.PI * Math.min(1, u / Math.max(f, 0.001) * 0.94 + 0.03)), 0.45) * (0.85 + 0.3 * noise1(u * 6 + seed, 92));
      top.push(px, py - w);
      bot.push(px, py + w);
    }
    cx.beginPath();
    cx.moveTo(top[0], top[1]);
    for (let i = 2; i < top.length; i += 2) cx.lineTo(top[i], top[i + 1]);
    for (let i = bot.length - 2; i >= 0; i -= 2) cx.lineTo(bot[i], bot[i + 1]);
    cx.closePath();
    cx.fill();
  }

  // limpia la tinta (de las dos capas) debajo de un texto, para que se lea
  function clearDoc(cx, it, fontSize) {
    const d = it.doc;
    cx.lineWidth = fontSize * 0.7;
    cx.textBaseline = 'middle';
    cx.textAlign = 'left';
    const vhC = cx.canvas.height / dpr;
    for (const ln of d.lines) {
      const y = it.y + ln.y + it.lh / 2;
      if (y + it.lh < 0 || y - it.lh > vhC) continue;
      cx.font = fontOf(fontSize, ln.kind === 'h' ? 700 : 500);
      for (const sg of ln.segs) cx.strokeText(sg.s, it.x + sg.x, y);
    }
    // (una foto con estilo se gira o saca su marco afuera de la caja)
    for (const im of d.imgs) {
      if (im.pile) continue; // las pegadas borran sólo su forma (styledPhoto)
      const p = im.style ? 6 + (PHOTO_STYLES[FOTO || im.style] || PHOTO_STYLES.lisa).m : 6;
      cx.fillRect(it.x + im.x - p, it.y + im.y - p, im.w + p * 2, im.h + p * 2);
    }
  }

  function label(cx, it, textW, fontSize) {
    if (!it.text) return;
    cx.textAlign = 'left';
    cx.font = fontOf(fontSize, it.st.strong ? 700 : 500);
    const full = it.st.strong ? cx.measureText(it.full).width : textW(it.full);
    cx.fillText(it.text, it.align === 'right' ? it.x - full : it.x, it.y);
  }

  return {
    layout: { trunkHeight: 0.78, childTwigLen: [34, 52] },
    title: false, // sin "natochi." ni nombre de sección arriba
    resize(vw, vh, d, canvas) {
      dpr = d;
      if (!printer) printer = createPrinter(canvas, LOOK);
      ink = document.createElement('canvas');
      ink.width = Math.round(vw * dpr);
      ink.height = Math.round(vh * dpr);
      c = ink.getContext('2d');
      lastCam = null;
      D = dims(vw, vh);
      chunks.clear();
      // celda del ruido de hojas: la hoja mide más o menos 1.5 celdas
      printer.set('leaf', D.leaf * 0.68);
      printer.set('dot', vw < 700 ? 2.9 : 3.4);
      printer.set('frame', FRAME === 'marco' ? 1 : FRAME === 'rasgado' ? 2 : 0);
      printer.set('frameW', frameW(vw));
    },
    // la base del tronco y el pasto quedan justo en el borde de abajo
    rootSpot(vw, vh) {
      return { x: vw < 700 ? vw * 0.5 : vw * 0.4, y: vh + 1 };
    },
    titleAt(vw, vh) {
      if (vw < 700) return { x: 18, y: Math.max(30, vh * 0.045) };
      return { x: Math.max(32, vw * 0.04), y: Math.max(44, vh * 0.065) };
    },
    inset(vw) {
      return frameInset(vw);
    },
    animating() {
      return parBusy();
    },
    busy: () => animBusy,
    // un click afuera o esc cierran la lista primero (y no hacen nada más)
    dismiss() {
      if (!listOpen) return false;
      listOpen = false;
      redraw();
      return true;
    },
    backBox(vw, vh, m) {
      const G = backGeom(vw, vh, m);
      return { x: G.x, y: G.y, w: G.w, h: G.h };
    },
    hud(vw, vh, state, m, atRoot) {
      if (!tracks.length) return [];
      pill = pillGeom(vw, vh, m);
      const hud = [
        { kind: 'pill', action: 'music-next', box: pill.next },
        { kind: 'pill', action: 'music', box: pill.play },
        { kind: 'pill', action: 'music-list', box: pill.title },
        { kind: 'pill', action: 'music-full', box: pill.full },
      ];
      pillM = m;
      // las canciones (y el resto de la pastilla abierta, que no hace nada):
      // flotan, no mueven la cámara
      if (listOpen) {
        for (const r of pill.rows) hud.push({ kind: 'track', float: true, action: 'music-track-' + r.i, box: r.box });
        hud.push({ kind: 'panel', float: true, action: 'music-panel', box: { x: pill.panel.x, y: pill.panel.y, w: pill.panel.w, h: pill.y - pill.panel.y } });
      }
      // la nota que apunta al reproductor: en la portada, hasta que suena algo
      if (!music.started && atRoot && !listOpen) {
        const N = noteGeom(pill, vw);
        // blanda: no mueve la cámara, y si pisa una etiqueta no se muestra
        hud.push({ kind: 'note', soft: true, action: 'music', box: { x: N.x, y: N.y, w: N.w, h: N.h } });
      }
      return hud;
    },
    act(a) {
      if (a === 'music') toggle();
      if (a === 'music-next') playTrack(music.i + 1);
      if (a === 'music-list') {
        listOpen = !listOpen;
        redraw();
      }
      if (a.startsWith('music-track-')) playTrack(Number(a.slice(12)));
      if (a === 'music-full') {
        const t = tracks[music.i];
        if (t) window.open(t.full || t.href, '_blank', 'noopener');
      }
    },
    // largo de una ramita de la raíz: hasta salir del follaje, y un trecho
    // pelado más, para que la rama se lea afuera de la copa
    reach(p, ang) {
      const side = Math.cos(ang) >= 0 ? 1 : -1;
      const margin = D.R * 0.75 + (D.narrow ? 16 : 30);
      for (let d = 4; d < 900; d += 2) {
        const x = p.x + Math.cos(ang) * d, y = p.y + Math.sin(ang) * d;
        if (Math.abs(x) > crownHalf(D, -y, side) + margin && Math.abs(x) > D.R * 0.5 + margin) return d;
      }
      return 120;
    },
    // la rama de una carpeta nace de su ramita, justo afuera de la copa
    childOrigin(node) {
      const { from, to } = node.twig;
      const u = node.parent.root ? 0.66 : 0.8;
      return { x: lerp(from.x, to.x, u), y: lerp(from.y, to.y, u) };
    },
    // ¿hay follaje o ramas dentro de este rectángulo (en mundo)?
    blocks(r, nodes) {
      for (const n of nodes) {
        const geo = n.geo;
        if (!geo) continue;
        for (const q of geo.clusters)
          for (let i = 0; i < q.subs.length; i += 4) if (rectDist(q.x + q.subs[i], q.y + q.subs[i + 1], r) < q.subs[i + 2] * 1.3) return true;
        for (const L of geo.limbs) {
          if (L.ys[0] > -8 && L.ys[L.ys.length - 1] > -8) continue; // el pasto no cuenta
          for (let i = 0; i < L.xs.length; i += 2) if (rectDist(L.xs[i], L.ys[i], r) < L.ws[i]) return true;
        }
      }
      return false;
    },
    build(node, env) {
      // etiquetas que la rama tiene que dejar limpias: las propias y las de
      // la carpeta de la que nace
      const labels = [];
      for (const k of node.kids) if (k.rect) labels.push(k.rect);
      if (node.parent) for (const k of node.parent.kids) if (k.rect) labels.push(k.rect);
      const geo = node.root ? buildRoot(node, D, labels) : buildChild(node, D, labels);
      const sample = [];
      for (const L of geo.limbs) for (let i = 0; i < L.xs.length; i += 2) if (L.ys[i] < -8) sample.push({ x: L.xs[i], y: L.ys[i] });
      for (const q of geo.clusters) ringSample(sample, q);
      for (const q of geo.sprays) sample.push({ x: q.x, y: q.y });
      geo.sample = sample;
      return geo;
    },
    frame(F) {
      // ?perf: mide cada cuadro (dibujo 2D, subida a la GPU, shader)
      const P = window.__perf;
      if (P) {
        if (P.cur) P.frames.push(P.cur);
        P.cur = { t: performance.now(), full: F.full };
      }
      const { cam, branches, items, title, titleAt, hud, font, fontSize, textW, hoverLink, fixed } = F;
      dpr = F.dpr;
      redraw = F.redraw;
      // si sólo se movió el papel, se reusa la tinta que ya está en la GPU
      if (!F.full && lastCam) {
        if (P) P.cur.d2 = 0;
        printer.render(null, lastCam, dpr, null, stepPaper());
        return;
      }
      // la foto bajo el mouse crece (~0,22 s) y las demás vuelven; mientras
      // alguna se mueve, se piden más cuadros
      animBusy = false;
      const now = performance.now();
      const dtZ = zoomClock && now - zoomClock < 200 ? (now - zoomClock) / 1000 : 1 / 60;
      zoomClock = now;
      if (F.hoverPhoto && !zoomT.has(F.hoverPhoto)) zoomT.set(F.hoverPhoto, 0);
      for (const [src, t] of zoomT) {
        const on = src === F.hoverPhoto;
        const nt = on ? Math.min(1, t + dtZ / 0.22) : Math.max(0, t - dtZ / 0.18);
        if (!on && nt === 0) zoomT.delete(src);
        else zoomT.set(src, nt);
        if (nt !== (on ? 1 : 0)) {
          redraw();
          animBusy = true;
        }
      }
      // la nota aparece cuando la foto terminó de crecer y se dibuja en ~0,64 s
      // (un 40% más rápido que al principio: lo pidió el usuario); se va con ella
      for (const src of [...capT.keys()]) if (src !== F.hoverPhoto) capT.delete(src);
      if (F.hoverPhoto && (zoomT.get(F.hoverPhoto) || 0) >= 1) {
        const ct = capT.get(F.hoverPhoto) || 0;
        if (ct < 1) {
          capT.set(F.hoverPhoto, Math.min(1, ct + dtZ / (0.9 / 1.4)));
          redraw();
          animBusy = true;
        }
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = 'source-over';
      c.clearRect(0, 0, ink.width, ink.height);
      // cámara redondeada al píxel del dispositivo, para calcar sin desenfoque
      const ox = Math.round(cam.x * dpr), oy = Math.round(cam.y * dpr);
      c.setTransform(dpr, 0, 0, dpr, -ox, -oy);
      c.fillStyle = INK;
      c.strokeStyle = INK;
      // el suelo, debajo de todo
      if (F.root.g > 0) drawGround(c, ox / dpr, oy / dpr, F.vw, F.vh, F.root.g);
      for (const n of branches) {
        if (n.g >= 1) {
          const k = cached(n.geo);
          c.globalCompositeOperation = 'source-over';
          c.drawImage(k.cv, k.x, k.y, k.w, k.h);
        } else paintGeo(c, n.geo, n.g * 1.1, 'base', { x0: ox / dpr - 40, y0: oy / dpr - 40, x1: ox / dpr + F.vw + 40, y1: oy / dpr + F.vh + 40 });
        // ramitas de los ítems
        for (const kid of n.kids) {
          if (!kid.twig || kid.fold <= 0.001) continue;
          // una sección recogida: la ramita vuelve a la copa desde la punta
          let g = n.g >= 1 ? 1.2 : n.g * 1.1;
          if (kid.fold < 1) g = Math.min(g, kid.t + (n.root ? 0.06 : 0.04) * kid.fold);
          paintGeo(c, n.geo, g, kid);
        }
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalCompositeOperation = 'source-over';

      // las etiquetas y los textos se abren paso entre las hojas
      const tfont = fontOf(Math.round(fontSize * 1.2));
      c.globalCompositeOperation = 'destination-out';
      c.lineJoin = 'round';
      c.textBaseline = 'middle';
      c.lineWidth = fontSize * 0.7;
      for (const it of items) {
        if (!it.text) continue;
        if (it.doc) {
          clearDoc(c, it, fontSize);
          continue;
        }
        c.font = fontOf(fontSize, it.st.strong ? 700 : 500);
        c.textAlign = it.align;
        c.strokeText(it.full, it.x, it.y);
      }
      c.globalCompositeOperation = 'source-over';

      // y se imprimen. Los textos quedan fuera de "back", que se queda quieto
      // mientras la hoja se mueve
      for (const it of items) {
        if (it.doc) drawDoc(c, it, fontSize, hoverLink, fixed, { zoom: zoomT, cap: capT, vw: F.vw, vh: F.vh });
        else label(c, it, textW, fontSize);
      }
      for (const it of items) if (it.st.hover && !it.doc) underline(c, it.rect.x, it.rect.y + it.rect.h + 1, it.rect.w, it.node.id);
      // título y controles quedan fijos mientras el árbol pasa por debajo: si
      // caen sobre el follaje se calan en él (letra al revés, color papel)
      c.globalCompositeOperation = 'xor';
      c.font = tfont;
      c.textAlign = 'left';
      if (title) c.fillText(title, titleAt.x, titleAt.y);
      c.font = font();
      for (const h of hud) {
        if (!h.text) continue;
        c.textAlign = h.align;
        c.fillText(h.text, h.x, h.y);
      }
      c.globalCompositeOperation = 'source-over';
      // la lista se abre (~0,2 s) o se cierra; mientras se mueve, la pastilla
      // se vuelve a medir y se piden más cuadros
      const lt = listOpen ? Math.min(1, listT + dtZ / 0.2) : Math.max(0, listT - dtZ / 0.16);
      if (lt !== listT) {
        listT = lt;
        if (pill) pill = pillGeom(F.vw, F.vh, pillM);
        if (lt !== (listOpen ? 1 : 0)) {
          redraw();
          animBusy = true;
        }
      }
      if (pill && tracks.length) drawPill(c, pill, F.vw, F.hoverHud);
      if (pill && tracks.length && F.hud.some((h) => h.kind === 'note')) drawNote(c, pill, F.vw);
      const bh = hud.find((h) => h.kind === 'back');
      backG = bh ? { ...bh.box, cy: bh.box.y + bh.box.h / 2 } : null;
      if (backG) drawBack(c, backG);
      if (FRAME === 'pliego') cropMarks(c, F.vw, F.vh, frameW(F.vw));
      if (P) {
        P.cur.d2 = performance.now() - P.cur.t;
        P.bench = (kind, n = 20) => printer.bench(kind, n, ink);
      }
      lastCam = { x: ox / dpr, y: oy / dpr };
      printer.render(ink, lastCam, dpr, null, stepPaper());
    },
  };
}
