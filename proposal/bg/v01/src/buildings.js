// Edificios: cajas apiladas (base + retranqueos) con fachadas texturadas.
//
// Cada edificio tiene un estilo que decide la altura de piso, el tipo y ritmo
// de ventanas del frente (paralelogramos `/¯¯/`), el tratamiento del lado
// izquierdo (rombos de cuatro paños, pisos `\`, puntos) y el remate. Los
// detalles chicos (balcones, toldos, carteles, cosas del techo) salen de
// parts.js.
import { FX_WINDOW, FX_BLINK, FX_NIGHT } from './grid.js';
import * as P from './parts.js';

const DOT = 46; //   .
const COLON = 58; // :
const TICK = 39; //  '

// ---------------------------------------------------------------- texturas
// Anclada a la celda de la capa (no al mundo): las grillas de puntos quedan
// verticales como en la referencia aunque la pared esté inclinada.
export const TEX = {
  none: () => 0,
  dots: (x, h, c, r) => ((c & 1) === 0 ? DOT : 0),
  colon: (x, h, c, r) => ((c & 1) === 0 && (r & 1) === 0 ? COLON : 0),
  sparse: (x, h, c, r) => ((c & 3) === 0 && (r & 1) === 0 ? DOT : 0),
  grid4: (x, h, c, r) => ((c & 3) === 2 && r % 3 === 0 ? DOT : 0),
  ticks: (x, h, c, r) => ((c + r * 3) % 7 === 0 ? TICK : 0),
};

// estilos de fachada; se eligen con el rng del edificio
const STYLES = [
  // ladrillo con ventanas simples y grilla de puntos
  { F: 4, win: 'single', winW: 4, bay: 7, tex: 'dots', left: 'diamond', crown: 'cornice' },
  // oficinas: ventanas corridas con montantes
  { F: 3, win: 'ribbon', winW: 0, bay: 3, tex: 'none', left: 'floors', crown: 'flat' },
  // residencial con balcones
  { F: 4, win: 'double', winW: 6, bay: 9, tex: 'sparse', left: 'diamond', crown: 'cornice', balcony: 0.35 },
  // torre con pilastras
  { F: 4, win: 'single', winW: 3, bay: 5, tex: 'colon', left: 'slits', crown: 'stepped' },
  // viejo, ventanas altas
  { F: 5, win: 'tall', winW: 6, bay: 9, tex: 'dots', left: 'dots', crown: 'cornice', balcony: 0.2 },
  // moderno liso, rombos grandes en el lado
  { F: 4, win: 'double', winW: 8, bay: 11, tex: 'grid4', left: 'bigdiamond', crown: 'flat' },
  // torre de vidrio: muro cortina en grilla
  { F: 3, win: 'curtain', winW: 0, bay: 3, tex: 'none', left: 'floors', crown: 'flat' },
  // conventillo con escalera de incendio
  { F: 4, win: 'single', winW: 4, bay: 7, tex: 'dots', left: 'diamond', crown: 'cornice', escape: true },
];

export function pickStyle(rng, i = -1) {
  const s = STYLES[i >= 0 ? i : Math.floor(rng.next() * STYLES.length)];
  return { ...s };
}

// ------------------------------------------------------------- edificio
// b = { x0, x1, d0, d1, H, style, tiers, rng, shop, sign, roof }
// Dibuja con el pintor: base, retranqueos, techo y sus cosas.
export function drawBuilding(L, b, opts = {}) {
  const { rng } = b;
  const st = b.style;
  const masses = massesOf(b);
  // para depurar: qué edificio cae en cada lugar
  b.masses = masses;
  (L.buildings ||= []).push(b);
  L.near = b.d1;
  for (let i = 0; i < masses.length; i++) {
    const m = masses[i];
    const last = i === masses.length - 1;
    L.box(m.x0, m.x1, m.d0, m.d1, m.h0, m.h1, {
      front: TEX[st.tex],
      left: leftTex(st.left),
      top: roofTex(b, m),
    });
    if (opts.lod === 'far') {
      farWindows(L, m, rng);
      continue;
    }
    frontWindows(L, b, m, i === 0);
    leftFace(L, b, m);
    const w = m.x1 - m.x0;
    if (st.escape && i === 0 && w > 14 && m.h1 - m.h0 > 20) {
      const xa = m.x1 - 12;
      P.fireEscape(L, xa, xa + 10, m.d1, (b.shop ? 8 : 4) + m.h0, m.h1 - 4, st.F, rng);
    }
    if (i === 0 && w > 22 && m.h1 > 40 && rng.chance(0.22)) {
      const hAd = m.h0 + 10 + Math.floor(rng.next() * Math.max(1, m.h1 - m.h0 - 24));
      P.wallAd(L, m.x0 + 2 + Math.floor(rng.next() * Math.max(1, w - 22)), m.d1, hAd, rng);
    }
    if (st.crown === 'cornice') cornice(L, m);
    if (!last) roofProps(L, b, m, 'terrace');
  }
  const top = masses[masses.length - 1];
  if (b.skeleton) {
    // materiales en el piso de obra, que se ven entre las columnas
    const keep = b.props;
    b.props = ['pile', 'mixer', 'pile', 'shed', 'pile', 'pile', 'mixer', 'pigeons'];
    roofProps(L, b, top, 'roof');
    b.props = keep;
    skeleton(L, b, top);
  }
  if (opts.lod === 'far') {
    if (b.antenna) P.mast(L, top.x0 + 3, top.d0 + 3, top.h1, b.antenna, rng);
    return;
  }
  if (b.crane) {
    const hTop = top.h1 + b.skeleton;
    // la obra: la grúa al medio de la losa y materiales en la mitad de adelante
    const xm = Math.round((top.x0 + top.x1) / 2) - 2;
    const dm = Math.round((top.d0 + top.d1) / 2) - 1;
    const slab = { x0: top.x0 + 1, x1: top.x1 - 2, d0: dm + 3, d1: top.d1 - 1, h0: top.h1, h1: hTop };
    b.props = ['pile', 'pile', 'tank2', 'pile', 'pigeons', 'pile'];
    roofProps(L, b, { ...slab, d0: top.d0 + 1, d1: dm - 1 }, 'terrace-full');
    b.props = ['shed', 'pile', 'pile', 'mixer', 'ac', 'pigeons'];
    roofProps(L, b, slab, 'roof');
    P.crane(L, xm, dm, hTop, b.crane.M, b.crane.J, rng);
  } else roofProps(L, b, top, 'roof');
  if (b.sign) P.bladeSign(L, b.sign.x, b.d1, b.sign.h, b.sign.text, rng);
  if (b.band) {
    const m = masses[0];
    if (m.d1 - m.d0 > b.band.text.length * 2 + 3) P.bandSign(L, m.x0, m.d0 + 2, b.band.h, b.band.text, rng);
  }
}

// base + retranqueos hacia atrás y hacia adentro
function massesOf(b) {
  const out = [];
  let { x0, x1, d0, d1 } = b;
  let h0 = 0;
  const tiers = b.tiers || [];
  const levels = [...tiers, b.H];
  for (let i = 0; i < levels.length; i++) {
    const h1 = levels[i];
    out.push({ x0, x1, d0, d1, h0, h1 });
    h0 = h1;
    // el piso siguiente se achica
    const w = x1 - x0;
    const dx = Math.max(2, Math.round(w * 0.15));
    x0 += dx;
    x1 -= Math.max(1, Math.round(dx * 0.6));
    d1 -= Math.max(2, Math.round((d1 - d0) * 0.18));
    d0 += 1;
  }
  return out;
}

function leftTex(kind) {
  if (kind === 'dots' || kind === 'diamond' || kind === 'bigdiamond') return TEX.dots;
  if (kind === 'slits') return TEX.sparse;
  return TEX.none;
}

function roofTex(b, m) {
  // grava punteada o membrana con juntas
  const k = b.roofTex ?? 0;
  if (k === 0) return (x, d, c, r) => ((c + r) % 4 === 0 && (r & 1) === 0 ? DOT : 0);
  if (k === 1) return (x, d, c, r) => ((x - m.x0) % 6 === 0 ? COLON : 0);
  return TEX.none;
}

// ventanas del frente, piso por piso
function frontWindows(L, b, m, isBase) {
  const st = b.style;
  const { rng } = b;
  const F = st.F;
  const w = m.x1 - m.x0;
  const ground = isBase && b.shop ? b.shopH || 6 : 0;
  const top = m.h1 - 2;
  if (isBase && b.shop) P.storefront(L, b, m, rng);

  if (st.win === 'curtain') {
    // muro cortina: montantes `/` cada 3 y travesaños `_` cada piso; cada paño
    // es una ventana para las luces de noche
    const fxs = new Map();
    L.front(m.x0, m.x1, m.d1, m.h0 + ground + 1, top, (x, hh, c, r) => {
      const bay = Math.floor((x - m.x0) / 3);
      const fl = Math.floor((hh - m.h0) / F);
      const key = bay * 1000 + fl;
      if (!fxs.has(key)) fxs.set(key, L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 8 + rng.next() * 30));
      const ch = (x - m.x0) % 3 === 0 ? 47 : (hh - m.h0) % F === 0 ? 95 : 32;
      L.put(c, r, ch, ch === 32 ? fxs.get(key) : 0);
      return -1;
    });
    return;
  }

  if (st.win === 'ribbon') {
    // ventanas corridas: dos líneas por piso y montantes `/` cada `bay`
    for (let h = m.h0 + ground + 1; h + 2 <= top; h += F) {
      const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 8 + rng.next() * 30);
      L.ex(m.x0 + 1, m.d1, h + 2, w - 2);
      L.ex(m.x0 + 1, m.d1, h, w - 2);
      L.front(m.x0 + 1, m.x1 - 1, m.d1, h, h + 2, (x, hh, c, r) => {
        L.put(c, r, (x - m.x0) % st.bay === 0 ? 47 : hh === h ? 95 : 32, fx);
        return -1;
      });
    }
    return;
  }

  const ww = st.winW;
  const bay = st.bay;
  const n = Math.max(1, Math.floor((w - 2) / bay));
  const margin = Math.floor((w - n * bay) / 2) + Math.floor((bay - ww) / 2);
  const k = st.win === 'tall' ? 3 : 2;
  let floor = 0;
  for (let h = m.h0 + ground + 1; h + k + 1 <= top; h += F, floor++) {
    const balconyFloor = st.balcony && rng.chance(st.balcony) && h > 8;
    for (let j = 0; j < n; j++) {
      const x = m.x0 + margin + j * bay;
      if (x + ww >= m.x1 - 1) break;
      const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 6 + rng.next() * 34);
      const deco = rng.next();
      const mid = Math.floor(ww / 2);
      L.winFront(x, m.d1, h, ww, k, fx, (dx, dh) => {
        // montante, travesaño, cortinas y alguien mirando
        if (st.win === 'double' && dx === mid) return 47;
        if (st.win === 'tall') {
          // tres paños: dos laterales angostos y un travesaño corto al medio
          if (dx === 1 || dx === ww - 1) return 47;
          if (dh === k - 1 && dx === mid) return 95;
        }
        if (deco > 0.3 && deco < 0.42 && dh === k - 1) {
          if (dx === 1) return 40;
          if (dx === ww - 1) return 41;
        }
        if (deco < 0.05 && dh === k - 1 && dx === ww - 2) return 111;
        if (deco > 0.93 && dh === 0 && dx > 0 && dx < ww - 1 && st.win !== 'double') return dx & 1 ? 118 : 42;
        return 0;
      });
      if (deco > 0.82 && deco <= 0.88 && !balconyFloor) P.acUnit(L, x + ww - 2, m.d1, h - 1);
    }
    if (balconyFloor) P.balcony(L, m.x0 + margin - 1, m.x0 + margin + (n - 1) * bay + ww + 1, m.d1, h - 1, rng);
  }
}

// cara izquierda: rombos, pisos o ranuras
function leftFace(L, b, m) {
  const st = b.style;
  const { rng } = b;
  const dd = m.d1 - m.d0;
  const F = st.F;
  if (dd < 4) return;
  if (st.left === 'floors') {
    for (let h = m.h0 + F; h < m.h1 - 1; h += F) L.ed(m.x0, m.d0 + 1, h, dd - 1, 92);
    // ventanas angostas entre las líneas de piso
    for (let h = m.h0 + 1; h + 2 < m.h1; h += F) {
      for (let d = m.d0 + 2; d + 2 < m.d1; d += 4) {
        const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 6 + rng.next() * 30);
        L.winLeft(m.x0, d, h, 2, 2, fx);
      }
    }
    return;
  }
  if (st.left === 'slits') {
    for (let h = m.h0 + 2; h + 2 < m.h1; h += F) {
      for (let d = m.d0 + 2; d + 1 < m.d1; d += 3) {
        const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 6 + rng.next() * 30);
        L.eh(m.x0, d, h, 2);
        L.put(m.x0 + d + h + 1, d - h - 1, 32, fx);
      }
    }
    return;
  }
  if (st.left === 'dots') st.left = 'diamond';
  if (st.left === 'diamond' || st.left === 'bigdiamond') {
    const a = st.left === 'bigdiamond' ? 3 : 2;
    const step = a + 3;
    for (let h = m.h0 + 2; h + a + 1 < m.h1; h += F + (a > 2 ? 2 : 1)) {
      for (let d = m.d0 + 2; d + a + 1 < m.d1; d += step) {
        const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 6 + rng.next() * 30);
        P.diamond(L, m.x0, d, h, a, fx, rng);
      }
    }
  }
}

// obra en construcción sobre el techo: losas y columnas sin paredes
function skeleton(L, b, m) {
  const n = b.skeleton;
  const x0 = m.x0 + 1;
  const x1 = m.x1 - 2;
  const d0 = m.d0 + 1;
  const d1 = m.d1 - 1;
  for (let k = 4; k <= n; k += 4) {
    const h = m.h1 + k;
    // columnas del piso
    for (let x = x0; x <= x1; x += 6) L.eh(x, d1, h - 4, 4);
    for (let d = d0; d < d1; d += 6) L.eh(x0, d, h - 4, 4);
    // losa
    if (k < n) {
      L.ex(x0, d1, h, x1 - x0);
      L.ed(x0, d0, h, d1 - d0);
    } else {
      L.box(x0, x1, d0, d1, h - 1, h, { top: TEX.sparse, left: false });
    }
  }
}

// cornisa: una línea doble bajo el borde del techo
function cornice(L, m) {
  const w = m.x1 - m.x0;
  L.ex(m.x0, m.d1, m.h1 - 1, w, 95);
  L.ed(m.x0, m.d0, m.h1 - 1, m.d1 - m.d0, 92);
}

// ventanas lejanas: marcas chicas
function farWindows(L, m, rng) {
  for (let h = m.h0 + 2; h < m.h1 - 2; h += 3) {
    for (let x = m.x0 + 2; x < m.x1 - 2; x += 3) {
      if (rng.chance(0.25)) continue;
      const fx = L.addFx(FX_WINDOW, 0, 0, rng.next() * 40, 8 + rng.next() * 30);
      L.put(x + m.d1 + h, m.d1 - h - 1, 95, fx);
    }
  }
}

// cosas del techo, de atrás hacia adelante
function roofProps(L, b, m, mode) {
  const { rng } = b;
  const w = m.x1 - m.x0;
  const dd = m.d1 - m.d0;
  if (w < 6 || dd < 4) return;
  // parapeto: un borde interior
  if (mode !== 'terrace' && w > 8 && dd > 5) {
    L.ex(m.x0 + 1, m.d0 + 1, m.h1, w - 2, 95);
    L.ed(m.x1 - 1, m.d0 + 1, m.h1, dd - 2, 92);
  }
  const props = [];
  const H = m.h1;
  const list = b.props || P.pickProps(rng, w, dd, mode);
  for (const kind of list) {
    const pw = P.PROP_SIZE[kind]?.[0] ?? 4;
    const pd = P.PROP_SIZE[kind]?.[1] ?? 3;
    if (pw >= w - 3 || pd >= dd - 2) continue;
    // busca lugar libre
    for (let tries = 0; tries < 14; tries++) {
      const x = m.x0 + 2 + Math.floor(rng.next() * (w - pw - 3));
      const d = m.d0 + 2 + Math.floor(rng.next() * (dd - pd - 3));
      if (props.some((p) => x < p.x + p.w + 1 && p.x < x + pw + 1 && d < p.d + p.dd + 1 && p.d < d + pd + 1)) continue;
      props.push({ kind, x, d, w: pw, dd: pd });
      break;
    }
  }
  props.sort((a, b2) => a.d + a.dd - (b2.d + b2.dd) || b2.x - a.x);
  for (const p of props) {
    L.near = b.d1 + 0.5;
    P.prop(L, p.kind, p.x, p.d, H, p.w, p.dd, rng, b);
  }
}

export { FX_BLINK, FX_NIGHT };
