// La caja del cuarto (paredes, piso, techo con sus texturas), las ventanas con
// lo que se ve afuera, las puertas, cortinas, persianas, alfombras y lámparas.
import { SP, R, sprite, hash2, bayer, rumble, now } from './casa-kit.js';

// --- paredes -----------------------------------------------------------------
// Patrones en coordenadas del mundo: en las laterales (z, h), en la del fondo
// (X, h). Se ponen glifos sueltos en una red, así la red se achica con la
// distancia y se lee la perspectiva.
function sidePoints(K, X, zs, hs, fn) {
  const g = K.g;
  for (let i = 0; i < zs.length; i++) {
    const z = zs[i];
    const c = Math.floor(K.sx(X, z));
    for (let j = 0; j < hs.length; j++) {
      const ch = fn(i, j, z, hs[j]);
      if (ch) g.put(c, Math.floor(K.sy(hs[j], z)), ch);
    }
  }
}

function range(a, b, step) {
  const out = [];
  for (let v = a; v <= b + 1e-6; v += step) out.push(v);
  return out;
}

// profundidades espaciadas para que en pantalla queden a ≥ minCols columnas
function depthSteps(K, z0, z1, dz, minCols = 2) {
  const out = [];
  let last = -1e9;
  for (let z = z0; z <= z1 + 1e-6; z += dz) {
    const x = K.sx(0, z);
    if (Math.abs(x - last) >= minCols) {
      out.push(z);
      last = x;
    }
  }
  return out;
}

export function walls(K, kind, o = {}) {
  const { g, Z, b } = K;
  const top = K.HM - (o.cornice ? 0.35 : 0.05);
  const bot = o.wainscot ? 1.05 : 0.18;
  g.z = 99;
  if (kind === 'papel') {
    const zs = depthSteps(K, 1.02, Z - 0.02, 0.05, 3);
    const hs = range(bot + 0.2, top - 0.1, 0.42);
    for (const X of [0, K.cols]) sidePoints(K, X, zs, hs, (i, j) => ((i + j) % 2 === 0 ? ((i * 3 + j) % 5 === 0 ? '*' : '.') : 0));
    for (let r = Math.ceil(K.sy(top - 0.1, Z)); r <= Math.floor(K.sy(bot + 0.2, Z)); r++) {
      const j = Math.round(K.hAt(r, Z) / 0.21);
      if (j % 2) continue;
      for (let c = b.x0 + 1; c < b.x1; c++) if ((c + (j % 4 ? 3 : 0)) % 6 === 0) g.put(c, r, (c + j) % 5 === 0 ? '*' : '.');
    }
  } else if (kind === 'rayas') {
    const zs = depthSteps(K, 1.03, Z - 0.03, 0.06, 3);
    for (const X of [0, K.cols]) for (const z of zs) {
      const c = Math.floor(K.sx(X, z));
      for (let r = Math.ceil(K.sy(top, z)); r < Math.floor(K.sy(bot, z)); r++) if (r % 2 === 0) g.put(c, r, ':');
    }
    for (let c = b.x0 + 2; c < b.x1 - 1; c += 4) for (let r = Math.ceil(K.sy(top, Z)); r < Math.floor(K.sy(bot, Z)); r++) if (r % 2 === 0) g.put(c, r, ':');
  } else if (kind === 'puntos') {
    const zs = depthSteps(K, 1.02, Z - 0.02, 0.04, 2);
    const hs = range(bot + 0.15, top - 0.1, 0.3);
    for (const X of [0, K.cols]) sidePoints(K, X, zs, hs, (i, j) => ((i + j) % 2 === 0 ? '.' : 0));
    for (let r = Math.ceil(K.sy(top, Z)); r < Math.floor(K.sy(bot, Z)); r += 2) for (let c = b.x0 + 1 + (r % 4 ? 2 : 0); c < b.x1; c += 4) g.put(c, r, '.');
  } else if (kind === 'ladrillo') {
    for (const X of [0, K.cols]) {
      for (let h = bot + 0.2; h < top; h += 0.25) K.line3(X, h, 1, X, h, Z);
      const zs = depthSteps(K, 1.02, Z, 0.07, 3);
      zs.forEach((z, i) => {
        for (let h = bot + 0.2, j = 0; h < top - 0.25; h += 0.25, j++) if ((i + j) % 2 === 0) g.put(Math.floor(K.sx(X, z)), Math.floor(K.sy(h + 0.12, z)), '|');
      });
    }
    for (let h = bot + 0.2, j = 0; h < top; h += 0.25, j++) {
      const r = Math.floor(K.sy(h, Z));
      for (let c = b.x0; c <= b.x1; c++) g.put(c, r, (c + j * 3) % 6 === 0 ? '|' : '_');
    }
  } else if (kind === 'azulejo') {
    // azulejos hasta 1,6 m en las laterales; arriba la pared lisa con puntos
    const tH = o.tileH || 1.6;
    for (const X of [0, K.cols]) {
      for (let h = 0.3; h <= tH + 1e-6; h += 0.3) K.line3(X, h, 1, X, h, Z);
      for (const z of depthSteps(K, 1.03, Z, 0.07, 4)) {
        const c = Math.floor(K.sx(X, z));
        for (let r = Math.round(K.sy(tH, z)); r < Math.round(K.sy(0.3, z)); r++) if (g.get(c, r) === SP && r % 2 === 0) g.put(c, r, ':');
      }
      for (const z of depthSteps(K, 1.02, Z - 0.02, 0.05, 3)) for (let h = tH + 0.4; h < top; h += 0.45) g.put(Math.floor(K.sx(X, z)), Math.floor(K.sy(h, z)), '.');
    }
  } else if (kind === 'hormigon') {
    // placas de encofrado con sus agujeros
    for (const X of [0, K.cols]) {
      for (let h = 1.2; h < top; h += 1.2) K.line3(X, h, 1, X, h, Z, 0);
      for (const z of depthSteps(K, 1.0, Z, 0.25, 4)) {
        const c = Math.floor(K.sx(X, z));
        for (let h = 0.6; h < top; h += 1.2) g.put(c, Math.floor(K.sy(h, z)), '°');
      }
    }
    for (let h = 0.6; h < top; h += 1.2) for (let c = b.x0 + 4; c < b.x1 - 2; c += 12) g.put(c, Math.floor(K.sy(h, Z)), '°');
  }
  // zócalo: una línea cerca del piso en las tres paredes
  const zh = o.wainscot ? 1.05 : 0.16;
  for (const X of [0, K.cols]) K.line3(X, zh, 1, X, zh, Z);
  const zr = Math.floor(K.sy(zh, Z));
  g.hline(b.x0, b.x1, zr, '_');
  if (o.wainscot) wainscot(K);
  if (o.cornice) cornice(K);
}

// boiserie: paneles bajos con su moldura
function wainscot(K) {
  const { g, Z, b } = K;
  for (const X of [0, K.cols]) {
    K.line3(X, 0.95, 1, X, 0.95, Z);
    const zs = depthSteps(K, 1.0, Z, 0.16, 5);
    for (let i = 0; i + 1 < zs.length; i++) {
      const za = zs[i] + 0.02;
      const zb = zs[i + 1] - 0.02;
      K.line3(X, 0.82, za, X, 0.82, zb);
      K.line3(X, 0.3, za, X, 0.3, zb);
      for (const z of [za, zb]) {
        const c = Math.floor(K.sx(X, z));
        g.vline(c, Math.round(K.sy(0.8, z)), Math.round(K.sy(0.3, z)) - 1, '|');
      }
    }
  }
  const r0 = Math.round(K.sy(0.8, Z));
  const r1 = Math.round(K.sy(0.3, Z)) - 1;
  for (let x = b.x0 + 2; x + 9 < b.x1; x += 12) {
    g.hline(x + 1, x + 8, r0 - 1, '_');
    g.hline(x + 1, x + 8, r1, '_');
    g.vline(x, r0, r1, '|');
    g.vline(x + 9, r0, r1, '|');
  }
  g.hline(b.x0, b.x1, Math.round(K.sy(0.95, Z)), '_');
}

// cornisa: dos líneas bajo el techo que dan la vuelta al cuarto
function cornice(K) {
  const { g, Z, b } = K;
  for (const X of [0, K.cols]) K.line3(X, K.HM - 0.3, 1, X, K.HM - 0.3, Z);
  for (const h of [K.HM - 0.18, K.HM - 0.32]) g.hline(b.x0 - 1, b.x1 + 1, Math.floor(K.sy(h, Z)), h > K.HM - 0.2 ? '¯' : '_');
  // dentículos bajo la cornisa en la pared del fondo
  const r = Math.floor(K.sy(K.HM - 0.32, Z)) + 1;
  for (let c = b.x0 + 1; c < b.x1; c += 3) g.put(c, r, "'");
}

// --- pared del fondo con textura (azulejos, ladrillo, etc.) en un rectángulo ------
export function tiles(K, x0, x1, y0, y1, w = 4, ch = '_') {
  const g = K.g;
  for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) {
    const rr = r - y0;
    if (rr % 2 === 1) g.put(c, r, ch);
    else if ((c - x0 + (rr % 4 === 0 ? 0 : w >> 1)) % w === 0) g.put(c, r, '|');
  }
}

// --- piso --------------------------------------------------------------------------
export function floor(K, kind, seed = 1) {
  const { g, Z, cols, vx } = K;
  g.z = 99;
  const rowsOf = (dz) => {
    // filas de pantalla para líneas transversales cada dz de profundidad
    const out = [];
    let last = 1e9;
    for (let z = 1 + dz; z < Z; z += dz) {
      const y = K.sy(0, z);
      if (last - y >= 1.6) {
        out.push({ z, y });
        last = y;
      }
    }
    return out;
  };
  if (kind === 'baldosa' || kind === 'damero') {
    // baldosas: filas transversales y uniones alineadas que fugan; en el damero,
    // una de cada dos punteada
    const tr = rowsOf(0.1);
    const step = K.MX * 0.62;
    const x0 = vx % step;
    let prev = { z: 1, y: K.rows };
    const bands = [1];
    tr.forEach((row) => {
      g.line(K.sx(0, row.z), row.y, K.sx(cols, row.z), row.y);
      const zm = (row.z + prev.z) / 2;
      const ra = Math.ceil(row.y);
      const rb = Math.floor(prev.y) - (prev.y % 1 < 0.34 ? 1 : 0);
      for (let X = x0; X < cols; X += step) {
        const c = Math.round(K.sx(X, zm));
        const slope = (c + 0.5 - vx) / ((ra + rb) / 2 + 0.5 - K.vy || 1);
        for (let r = ra; r <= rb; r++) if (g.get(c, r) === SP) g.put(c, r, Math.abs(slope) < 0.6 ? '|' : slope < 0 ? '/' : '\\');
      }
      bands.push(row.z);
      prev = row;
    });
    if (kind === 'damero') {
      K.flat(0, 0, cols, 1, Z, (c, r, X, z) => {
        if (g.get(c, r) !== SP) return 0;
        let j = 0;
        while (j + 1 < bands.length && bands[j + 1] < z) j++;
        const i = Math.floor((X - x0) / step);
        return ((i + j) & 1) === 0 && (c + r) % 2 === 0 ? ':' : 0;
      });
    }
  } else if (kind === 'flexit') {
    // palmetas de flexit: líneas atravesadas finas y una trama de puntos
    for (const { z } of rowsOf(0.08)) g.line(K.sx(0, z), K.sy(0, z), K.sx(cols, z), K.sy(0, z));
    K.flat(0, 0, cols, 1, Z, (c, r) => (g.get(c, r) === SP && (c + r * 2) % 7 === 0 ? '.' : 0));
  } else if (kind === 'tablas' || kind === 'parquet') {
    // tablas atravesadas: filas que se juntan hacia el fondo, con las uniones
    // salteadas. En el parquet las uniones van rayadas en espiga.
    const pq = kind === 'parquet';
    const tr = rowsOf(pq ? 0.09 : 0.11);
    const step = K.MX * (pq ? 0.5 : 1.35);
    let prev = { z: 1, y: K.rows };
    tr.forEach((row, j) => {
      g.line(K.sx(0, row.z), row.y, K.sx(cols, row.z), row.y);
      const off = (j % 2) * step * 0.5 + (pq ? 0 : hash2(j, seed) * step * 0.4);
      const zm = (row.z + prev.z) / 2;
      const ra = Math.ceil(row.y);
      const rb = Math.floor(prev.y) - (prev.y % 1 < 0.34 ? 1 : 0);
      for (let X = off; X < cols; X += step) {
        const c = Math.round(K.sx(X, zm));
        const k = (c + 0.5 - vx) / (zm * 1);
        const slope = (c + 0.5 - vx) / ((ra + rb) / 2 - K.vy || 1);
        for (let r = ra; r <= rb; r++) {
          if (g.get(c, r) !== SP) continue;
          if (pq) g.put(c, r, (j + r) % 2 ? '/' : '\\');
          else g.put(c, r, Math.abs(slope) < 0.6 ? '|' : slope < 0 ? '/' : '\\');
        }
        void k;
      }
      prev = row;
    });
    K.flat(0, 0, cols, 1, Z, (c, r) => (g.get(c, r) === SP && hash2(c * 3 + seed, r * 5) < 0.025 ? (hash2(c, r) < 0.5 ? '.' : '-') : 0));
  } else if (kind === 'moqueta') {
    K.flat(0, 0, cols, 1, Z, (c, r) => (g.get(c, r) === SP && hash2(c * 13 + seed, r * 7) < 0.07 ? (hash2(c, r + seed) < 0.5 ? ',' : '.') : 0));
  } else if (kind === 'cemento') {
    for (const { z } of rowsOf(0.34)) g.line(K.sx(0, z), K.sy(0, z), K.sx(cols, z), K.sy(0, z));
    const step = K.MX * 1.4;
    for (let X = vx % step; X <= cols; X += step) g.line(X, K.rows, K.sx(X, Z), K.sy(0, Z));
    K.flat(0, 0, cols, 1, Z, (c, r) => (g.get(c, r) === SP && hash2(c * 13 + seed, r * 7) < 0.02 ? '.' : 0));
  }
}

// --- techo -------------------------------------------------------------------------
export function ceiling(K, kind) {
  const { g, Z, cols, HM } = K;
  g.z = 99;
  if (kind === 'vigas') {
    // dos vigas que corren hacia el fondo
    for (const f of [0.3, 0.7]) {
      for (const dx of [-0.13, 0.13]) {
        const X = cols * f + dx * K.MX;
        g.line(X, 0, K.sx(X, Z), K.sy(HM, Z));
      }
    }
  } else if (kind === 'spots') {
    for (let z = 1.25; z < Z - 0.1; z += 0.35) for (let f = 0.2; f < 0.85; f += 0.3) g.put(Math.round(K.sx(cols * f, z)), Math.floor(K.sy(HM, z)), 'o');
  } else if (kind === 'moldura') {
    // un marco de yeso en el techo, separado de las paredes
    const X0 = K.MX * 0.5;
    const X1 = cols - K.MX * 0.5;
    const z0 = 1.12;
    const z1 = Z - 0.12;
    K.line3(X0, HM, z0, X1, HM, z0);
    K.line3(X0, HM, z1, X1, HM, z1);
    K.line3(X0, HM, z0, X0, HM, z1);
    K.line3(X1, HM, z0, X1, HM, z1);
  }
}

// rosetón de yeso en el techo, de donde cuelga la lámpara
export function rosette(K, X, z) {
  const c = Math.round(K.sx(X, z));
  const r = Math.floor(K.sy(K.HM, z));
  K.at(z, (g) => {
    g.text(c - 4, r, "'-.__.-'");
    g.put(c - 5, r - 1, '(');
    g.put(c + 4, r - 1, ')');
  });
}

// aristas de la caja (al final, para que queden limpias)
export function edges(K) {
  const { g, cols, rows } = K;
  const { bx0, bx1, by0, by1 } = K;
  g.z = 99;
  g.line(0, 0, bx0, by0);
  g.line(cols, 0, bx1, by0);
  g.line(0, rows, bx0, by1);
  g.line(cols, rows, bx1, by1);
  g.line(bx0, by0, bx1, by0);
  g.line(bx0, by1, bx1, by1);
  g.vline(Math.floor(bx0), Math.ceil(by0), Math.floor(by1) - 1, '|');
  g.vline(Math.floor(bx1), Math.ceil(by0), Math.floor(by1) - 1, '|');
}

export function shell(K, o = {}) {
  walls(K, o.walls || 'liso', o);
  if (o.back && o.back !== o.walls) backTexture(K, o.back);
  ceiling(K, o.ceil || 'liso');
  floor(K, o.floor || 'tablas', K.seed);
  edges(K);
}

function backTexture(K, kind) {
  const { g, b } = K;
  if (kind === 'liso') {
    // borrar lo que dejó el patrón de las laterales
    for (let r = b.y0; r <= b.y1 - 1; r++) for (let c = b.x0; c <= b.x1; c++) if (g.zb[r * g.w + c] >= 99) g.data[r * g.w + c] = SP;
  }
}

// --- lo que se ve por una ventana ------------------------------------------------------
// Rellena el rectángulo (x0..x1, y0..y1) con el afuera según el piso y la zona:
// azoteas y cerros desde arriba, el edificio del frente a media altura y un
// árbol desde abajo. Devuelve una función para animar el cielo.
const CLOUD = sprite(R`
  .--.
.(    ).
ª-.__.-'`);
const CLOUD2 = sprite(R`
 .-.
(   ).
ª--'`);
const MOON = sprite(R`
 .-.
(  (
 ª-'`);

export function view(K, x0, x1, y0, y1, o = {}) {
  const { g, night } = K;
  const w = x1 - x0 + 1;
  const hgt = y1 - y0 + 1;
  const seed = K.seed + (o.seed || 0);
  const level = o.level != null ? o.level : K.level;
  const z = o.z || K.Z + 0.6;
  const fg = new Uint8Array(w * hgt); // celdas con algo delante del cielo
  const set = (c, r, ch) => {
    if (c < x0 || c > x1 || r < y0 || r > y1) return;
    g.put(c, r, ch);
    fg[(r - y0) * w + (c - x0)] = 1;
  };
  const fillRect = (c0, c1, r0, r1, fn) => {
    for (let r = Math.max(y0, r0); r <= Math.min(y1, r1); r++) for (let c = Math.max(x0, c0); c <= Math.min(x1, c1); c++) set(c, r, fn ? fn(c, r) || SP : SP);
  };
  const lit = [];
  K.at(z, () => {
    for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) g.put(c, r, SP);
    if (level >= 6) {
      // desde arriba: el horizonte a la altura de los ojos, la cordillera atrás
      // y las azoteas de la ciudad con sus ventanas, estanques y antenas
      const hz = Math.max(y0 + 2, Math.min(y1 - 2, Math.round(K.vy) - 1));
      if (o.mountains !== false) {
        let prev = null;
        for (let c = x0; c <= x1; c++) {
          const m = Math.sin((c + seed) * 0.19) * 1.4 + Math.sin((c + seed) * 0.061) * 2.2 + 2.4;
          const top = Math.round(hz - 1 - m);
          if (top >= y0) {
            set(c, top, prev === null || prev === top ? '_' : prev > top ? '/' : '\\');
            if (m > 4 && top + 1 < hz) set(c, top + 1, (c + seed) % 2 ? '.' : SP);
          }
          prev = top;
        }
      }
      let c = x0 - 2;
      let k = 0;
      while (c <= x1) {
        const bw2 = 3 + Math.floor(hash2(seed, k * 3) * 6);
        const top = Math.min(y1, hz + 2 - Math.floor(hash2(seed + 1, k * 5) * 7));
        fillRect(c, c + bw2, top, y1, (cc, rr) => {
          if (rr === top) return '_';
          if (cc === c || cc === c + bw2) return '|';
          if ((rr - top) % 2 === 0 && (cc - c) % 2 === 0) {
            if (night && hash2(cc * 7 + seed, rr) < 0.4) {
              lit.push([cc, rr]);
              return '░';
            }
            return ':';
          }
          return SP;
        });
        const roof = hash2(seed + 7, k);
        if (roof < 0.3 && top - 2 >= y0) {
          set(c + 2, top - 1, '|');
          set(c + 1, top - 2, '_');
          set(c + 2, top - 2, '|');
          set(c + 3, top - 2, '_');
        } else if (roof < 0.55 && top - 2 >= y0) {
          set(c + 1, top - 2, '.');
          set(c + 2, top - 2, '-');
          set(c + 3, top - 2, '.');
          set(c + 1, top - 1, '|');
          set(c + 3, top - 1, '|');
        } else if (roof < 0.7 && top - 3 >= y0) {
          set(c + 2, top - 1, '|');
          set(c + 2, top - 2, '|');
          set(c + 2, top - 3, 'T');
        }
        c += bw2 + (hash2(seed, k + 50) < 0.3 ? 1 : 0);
        k++;
      }
    } else if (level >= 3) {
      // el edificio del frente: muro punteado con ventanas oscuras, un balcón con
      // macetas y el cordel con ropa colgada
      const top = y0 + Math.max(1, Math.round(hgt * 0.24));
      fillRect(x0, x1, top, y1, (cc, rr) => (rr === top ? '_' : (cc + rr) % 2 === 0 && rr % 2 === 1 ? ':' : SP));
      // cornisa con canaleta
      if (top - 1 >= y0) for (let c = x0; c <= x1; c++) set(c, top - 1, c % 6 === 0 ? '|' : SP);
      const winW = Math.max(3, Math.min(6, Math.round(w / 4)));
      for (let wy = top + 2, k = 0; wy + 2 <= y1; wy += 5, k++) {
        for (let wx = x0 + 1 + (k % 2) * 2; wx + winW <= x1; wx += winW + 4) {
          const on = night ? hash2(wx * 3 + seed, wy) < 0.5 : false;
          for (let r = wy; r <= Math.min(y1, wy + 2); r++) for (let cc = wx; cc < wx + winW; cc++) set(cc, r, on ? '░' : r === wy && !night ? '/' : SP);
          if (wy + 3 <= y1) for (let cc = wx - 1; cc <= wx + winW; cc++) set(cc, wy + 3, '¯');
          if (on) lit.push([wx + 1, wy + 1]);
          else if (hash2(wx, wy + seed) < 0.35 && wy + 2 <= y1) set(wx + 1, wy + 2, hash2(wx, wy) < 0.5 ? 'o' : ')');
        }
      }
      // cordel con ropa
      const ly = top + 1;
      if (ly <= y1 - 1 && w > 8) {
        for (let c = x0; c <= x1; c++) set(c, ly, '-');
        o.laundry = { y: ly, x0, x1 };
      }
    } else {
      // abajo: un árbol del patio llena la ventana, con un muro y un farol
      const wallTop = y1 - Math.max(1, Math.round(hgt * 0.22));
      fillRect(x0, x1, wallTop, y1, (cc, rr) => (rr === wallTop ? '_' : (cc + rr * 3) % 6 === 0 ? '|' : rr % 2 ? '_' : SP));
      const cx = x0 + Math.round(w * (0.3 + hash2(seed, 2) * 0.4));
      const rx = Math.max(4, w * 0.42);
      const ry = Math.max(3, hgt * 0.5);
      const cy = y0 + ry * 0.8;
      for (let r = y0; r <= wallTop; r++) for (let c = x0; c <= x1; c++) {
        const dx = (c + 0.5 - cx) / rx;
        const dy = (r + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy + (hash2(c, r + seed) - 0.5) * 0.25;
        if (d < 1) {
          const edge = d > 0.78;
          set(c, r, edge ? (c < cx ? '(' : ')') : hash2(c * 5, r * 3 + seed) < 0.3 ? ':' : hash2(c, r * 11) < 0.25 ? '.' : SP);
        }
      }
      for (let r = Math.round(cy + ry * 0.6); r <= wallTop; r++) {
        set(Math.round(cx), r, '|');
        set(Math.round(cx) + 1, r, '|');
      }
      o.tree = { cx, cy, rx, ry, wallTop };
    }
  });
  // el cielo se anima: nubes que pasan de día, estrellas y la luna de noche
  const skyFree = (c, r) => !fg[(r - y0) * w + (c - x0)];
  const stars = [];
  if (night) {
    for (let r = y0; r <= y1; r++) for (let c = x0; c <= x1; c++) if (skyFree(c, r) && hash2(c * 7 + seed, r * 13) < 0.045) stars.push([c, r, hash2(c, r) * 10]);
  }
  const moonX = x0 + Math.round(w * (0.2 + hash2(seed, 9) * 0.55));
  const clouds = [CLOUD, CLOUD2];
  return (d, t) => {
    d.z = z;
    if (night) {
      for (const [c, r, ph] of stars) d.put(c, r, (t * 0.7 + ph) % 4 < 3.5 ? '.' : '*');
      if (o.moon !== false && w > 8 && hgt > 4) {
        for (let r = 0; r < MOON.h; r++) for (let c = 0; c < MOON.w; c++) {
          const ch = MOON.data[r * MOON.w + c];
          const cc = moonX + c;
          const rr = y0 + 1 + r;
          if (ch && cc <= x1 && rr <= y1 && skyFree(cc, rr)) d.put(cc, rr, ch);
        }
      }
      // un avión que cruza con su luz
      const p = ((t + seed % 17) / 23) % 1;
      const ax = Math.round(x1 - p * (w + 10));
      if (ax >= x0 && ax <= x1 && Math.floor(t * 2) % 2 && skyFree(ax, y0 + 1)) d.put(ax, y0 + 1, '·');
      // las ventanas del frente se apagan y se prenden
      for (let i = 0; i < lit.length; i++) {
        const [c, r] = lit[i];
        if (hash2(i + seed, Math.floor(t / 7 + i * 0.37)) < 0.18) d.put(c, r, ' ');
      }
    } else {
      for (let i = 0; i < 2; i++) {
        const s = clouds[i];
        const span = w + s.w + 6;
        const cx = x0 - s.w + Math.round((t * (0.5 + i * 0.35) + hash2(seed, i) * span) % span);
        const cy = y0 + i * 2 + (o.cloudRow || 0);
        for (let r = 0; r < s.h; r++) for (let c = 0; c < s.w; c++) {
          const ch = s.data[r * s.w + c];
          const xx = cx + c;
          const yy = cy + r;
          if (ch && xx >= x0 && xx <= x1 && yy <= y1 && skyFree(xx, yy)) d.put(xx, yy, ch);
        }
      }
      // pájaros
      const p = ((t + (seed % 11)) / 13) % 1;
      if (p < 0.6) {
        const bx = Math.round(x0 + (p / 0.6) * (w + 4)) - 2;
        const by = y0 + 1 + Math.round(Math.sin(p * 9) * 0.8);
        const f = Math.floor(t * 4) % 2 ? 'v' : '-';
        if (bx >= x0 && bx <= x1 && by <= y1 && skyFree(bx, by)) d.put(bx, by, f);
        if (bx + 3 >= x0 && bx + 3 <= x1 && by + 1 <= y1 && skyFree(bx + 3, by + 1)) d.put(bx + 3, by + 1, f === 'v' ? '-' : 'v');
      }
    }
    // la ropa colgada se mueve
    if (o.laundry) {
      const { y, x0: a, x1: bb } = o.laundry;
      const pieces = ['[]', '/\\', '||', '{}'];
      for (let i = 0, c = a + 1; c + 2 <= bb; i++, c += 4) {
        const sw = Math.round(Math.sin(t * 1.6 + i) * 0.6);
        const p = pieces[i % pieces.length];
        d.put(c + Math.max(0, sw), y + 1, p[0]);
        d.put(c + 1 + Math.max(0, sw), y + 1, p[1]);
      }
    }
    // el árbol se mueve con el viento: los bordes de la copa respiran
    if (o.tree) {
      const { cx, cy, rx, ry } = o.tree;
      const k = Math.floor(t * 1.3);
      for (let i = 0; i < 6; i++) {
        const a = hash2(i, k) * Math.PI * 2;
        const c = Math.round(cx + Math.cos(a) * rx * 0.7);
        const r = Math.round(cy + Math.sin(a) * ry * 0.6);
        if (c >= x0 && c <= x1 && r >= y0 && r <= y1) d.put(c, r, hash2(i, k + 1) < 0.5 ? "'" : ',');
      }
    }
  };
}

// --- ventanas en la pared del fondo ------------------------------------------------
// kind: 'doble' (dos hojas con travesaño), 'balcon' (puerta ventana alta con
// baranda), 'ventanal' (vidrio de piso a techo), 'persiana' (con la caja de la
// persiana de enrollar a media altura). Devuelve el rectángulo del vidrio.
export function backWindow(K, x0, x1, y0, y1, o = {}) {
  const { g } = K;
  const kind = o.kind || 'doble';
  const z = K.Z;
  const vy0 = y0;
  let vy1 = y1;
  g.z = z;
  // marco
  g.hline(x0, x1, y0 - 1, '_');
  g.vline(x0, y0, y1, '|');
  g.vline(x1, y0, y1, '|');
  g.hline(x0, x1, y1, '_');
  const glass = { x0: x0 + 1, x1: x1 - 1, y0: vy0, y1: vy1 - 1 };
  if (K.night) K.light((x0 + x1) / 2, (y0 + y1) / 2, Math.max(x1 - x0, (y1 - y0) * 2) * 0.75, 0.75);
  const sky = view(K, glass.x0, glass.x1, glass.y0, glass.y1, o);
  K.anim(sky);
  g.z = z - 0.001;
  const mid = Math.round((x0 + x1) / 2);
  if (kind === 'doble' || kind === 'persiana') {
    g.vline(mid, y0, y1 - 1, '|');
    const tr = y0 + Math.max(2, Math.round((y1 - y0) * 0.3));
    if (o.transom !== false) g.hline(x0 + 1, x1 - 1, tr, '_');
    // manillas
    g.put(mid - 1, Math.round((tr + y1) / 2), 'o');
  } else if (kind === 'balcon') {
    const n = Math.max(2, Math.round((x1 - x0) / 7));
    for (let i = 1; i < n; i++) g.vline(x0 + Math.round(((x1 - x0) * i) / n), y0, y1 - 1, '|');
    for (let r = y0 + 3; r < y1 - 1; r += 4) g.hline(x0 + 1, x1 - 1, r, '_');
    // baranda de fierro afuera, en la mitad de abajo
    const br = y1 - Math.max(3, Math.round((y1 - y0) * 0.28));
    g.z = z + 0.05;
    for (let c = x0 + 1; c < x1; c++) {
      g.put(c, br, '_');
      for (let r = br + 1; r < y1; r++) if (c % 2 === 0) g.put(c, r, '|');
      if (c % 4 === 0) g.put(c, br + 1, 'o');
    }
  } else if (kind === 'ventanal') {
    const n = Math.max(2, Math.round((x1 - x0) / 14));
    for (let i = 1; i < n; i++) g.vline(x0 + Math.round(((x1 - x0) * i) / n), y0, y1 - 1, '|');
  }
  if (kind === 'persiana') {
    // la persiana de enrollar baja hasta un tercio: tablillas
    const down = y0 + Math.max(1, Math.round((y1 - y0) * (o.down != null ? o.down : 0.3)));
    for (let r = y0; r < down; r++) for (let c = x0 + 1; c < x1; c++) g.put(c, r, r === down - 1 ? '_' : '=');
    g.hline(x0 - 1, x1 + 1, y0 - 2, '_');
    g.put(x0 - 1, y0 - 1, '|');
    g.put(x1 + 1, y0 - 1, '|');
    // la cinta
    g.vline(x1 + 2, y0, Math.round((y0 + y1) / 2), ':');
  }
  // alféizar
  if (o.sill !== false) {
    g.z = z - 0.01;
    g.text(x0 - 1, y1 + 1, '¯'.repeat(x1 - x0 + 3));
  }
  return glass;
}

// Cortinas a los lados de una ventana del fondo, que se mueven con la brisa.
// En la base no se dibujan: las pone anim (así se pueden mover).
export function curtains(K, x0, x1, y0, y1, o = {}) {
  const z = K.Z - 0.02;
  const w = Math.max(2, o.w || Math.round((x1 - x0) * 0.16));
  const sheer = o.sheer;
  // barra
  K.at(z, (g) => g.hline(x0 - 2, x1 + 2, y0 - 2, '='));
  K.anim((d, t) => {
    d.z = z;
    const breeze = Math.sin(t * 0.8) * 0.5 + Math.sin(t * 2.1) * 0.3;
    for (const side of [-1, 1]) {
      for (let r = y0 - 1; r <= y1 + 1; r++) {
        const k = (r - y0) / (y1 - y0 + 1);
        const bulge = Math.round(breeze * k * k * 2 * (o.open ? 0.5 : 1));
        const ww = w + (o.tied ? Math.round(-Math.abs(k - 0.62) * w * 0.9 + w * 0.3) : 0) + bulge * side * -1;
        const ww2 = Math.max(1, ww);
        for (let i = 0; i < ww2; i++) {
          const c = side < 0 ? x0 - 1 + i : x1 + 1 - i;
          const fold = (i + (r >> 2)) % 3 === 0;
          const edge = i === ww2 - 1;
          d.put(c, r, edge ? (side < 0 ? ')' : '(') : fold ? (sheer ? ':' : '|') : sheer ? ' ' : ' ');
        }
      }
    }
  });
}

// --- puerta abierta en la pared del fondo, con un pasillo detrás ------------------------------
// X0..X1 en unidades de adelante, alto h (m). En el pasillo se ve otra cosa
// (un baño, otra pieza). Devuelve datos para que alguien cruce.
export function backDoor(K, X0, X1, h = 2.15, o = {}) {
  const { g, Z } = K;
  const depth = o.depth || 0.7;
  const z1 = Z + depth;
  const c0 = Math.round(K.sx(X0, Z));
  const c1 = Math.round(K.sx(X1, Z));
  const r0 = Math.round(K.sy(h, Z));
  const r1 = Math.round(K.sy(0, Z)) - 1;
  // vaciar el vano
  g.z = Z;
  for (let r = r0; r <= r1; r++) for (let c = c0 + 1; c < c1; c++) g.put(c, r, SP);
  // el pasillo: piso, techo bajo y la pared del fondo, en la misma perspectiva
  const pz = Z + 0.01;
  K.at(pz, () => {
    const b0 = Math.round(K.sx(X0, z1));
    const b1 = Math.round(K.sx(X1, z1));
    const t0 = Math.round(K.sy(h, z1));
    const t1 = Math.round(K.sy(0, z1)) - 1;
    // pared del fondo del pasillo
    for (let r = t0; r <= t1; r++) for (let c = Math.max(b0, c0 + 1); c <= Math.min(b1, c1 - 1); c++) {
      const tile = o.room === 'baño';
      g.put(c, r, tile && r > t0 + (t1 - t0) * 0.35 ? ((r - t0) % 2 ? '_' : c % 3 === 0 ? '|' : SP) : SP);
    }
    // aristas del pasillo que fugan
    g.line(c0 + 0.5, r1 + 1, b0, t1 + 1);
    g.line(c1 - 0.5, r1 + 1, b1, t1 + 1);
    g.line(c0 + 0.5, r0, b0, t0);
    g.line(c1 - 0.5, r0, b1, t0);
    g.hline(Math.max(b0, c0 + 1), Math.min(b1, c1 - 1), t1, '_');
    if (o.room === 'baño') {
      // lavamanos, espejo y toalla
      const mx = Math.round((b0 + b1) / 2);
      const sr = t0 + Math.round((t1 - t0) * 0.55);
      g.text(mx - 2, sr, '\\___/');
      g.put(mx, sr + 1, '|');
      g.text(mx - 1, sr - 3, '.-.');
      g.text(mx - 1, sr - 2, '(_)');
      if (b1 - 2 > mx + 3) {
        g.text(b1 - 2, sr - 2, '|‖|'.slice(0, 3));
        g.text(b1 - 2, sr - 1, '|_|');
      }
    } else if (o.room === 'pieza') {
      const mx = Math.round((b0 + b1) / 2);
      g.text(mx - 2, t0 + 2, '|¯¯|');
      g.text(mx - 2, t0 + 3, '|__|');
      g.text(mx - 3, t1 - 1, '.____.');
    } else {
      // un perchero y un cuadro
      const mx = Math.round((b0 + b1) / 2);
      g.text(mx - 1, t0 + 2, '_|_');
      g.text(mx - 1, t0 + 3, '(|)');
      g.put(mx, t0 + 4, '|');
    }
  });
  // marco y la hoja abierta hacia adentro (contra la pared)
  g.z = Z - 0.005;
  g.hline(c0, c1, r0 - 1, '_');
  g.vline(c0, r0, r1, '|');
  g.vline(c1, r0, r1, '|');
  const leaf = o.leaf || 'izq';
  if (leaf !== 'none') {
    const hz = Z - 0.32;
    const Xh = leaf === 'izq' ? X0 : X1;
    K.box(Math.min(Xh, Xh + (leaf === 'izq' ? -0.06 : 0.06) * K.MX), Math.max(Xh, Xh + (leaf === 'izq' ? -0.06 : 0.06) * K.MX), h - 0.02, hz, Z - 0.01, {
      side: (c, r, u, hh) => (Math.abs(hh - 1.0) < 0.06 && u > 0.1 && u < 0.3 ? 'o' : SP),
    });
  }
  return { c0, c1, r0, r1, z: Z + depth * 0.5, X0, X1 };
}

// --- cosas de adelante: estamos en la ventana por la que entramos ---------------------------
// Cortinas que cuelgan en los bordes de la pantalla y se mueven con la brisa.
export function frontCurtains(K, o = {}) {
  const { rows, cols } = K;
  const w = Math.max(3, Math.round(cols * (o.w || 0.055)));
  const sides = o.sides || [-1, 1];
  const y0 = 2;
  K.anim((d, t) => {
    d.z = 0.5;
    const breeze = Math.sin(t * 0.7) * 0.6 + Math.sin(t * 1.9 + 1) * 0.35;
    for (const side of sides) {
      for (let r = y0; r < rows; r++) {
        const k = (r - y0) / (rows - y0);
        const ww = Math.max(1, Math.round(w + breeze * k * k * w * 0.8 * (side < 0 ? 1 : -1) + Math.sin(r * 0.35 + t) * 0.6));
        for (let i = 0; i < ww; i++) {
          const c = side < 0 ? i : cols - 1 - i;
          const edge = i === ww - 1;
          const fold = (i + 1) % 3 === 0;
          d.put(c, r, edge ? (side < 0 ? ')' : '(') : fold ? (o.sheer ? ':' : '|') : r % 4 === 0 && o.pattern ? '.' : ' ');
        }
      }
      // barra y argollas arriba
      for (let i = 0; i < w + 2; i++) d.put(side < 0 ? i : cols - 1 - i, y0 - 0, i % 3 === 1 ? 'o' : '=');
    }
  });
}

// Persiana veneciana arriba de la pantalla (la de la ventana por la que entramos).
export function frontBlinds(K, o = {}) {
  const { cols } = K;
  const n = o.rows || 3;
  K.anim((d, t) => {
    d.z = 0.5;
    const sway = Math.round(Math.sin(t * 0.9) * 0.8);
    for (let r = 2; r < 2 + n; r++) for (let c = 0; c < cols; c++) d.put(c, r, r === 1 + n ? (c === 0 || c === cols - 1 ? '|' : '_') : '=');
    // el cordón con su borla
    const x = cols - 6 + sway;
    for (let r = 2 + n; r < 2 + n + 6; r++) d.put(x, r, ':');
    d.put(x, 2 + n + 6, 'Ø');
  });
}

// --- lámparas --------------------------------------------------------------------------------
// Lámpara colgante en (X, z), a `drop` metros del techo. Se mece cuando pasa
// el tren. kind: 'pantalla' | 'foco' | 'arana' | 'campana' | 'globo'.
const SHADES = {
  pantalla: sprite(R`
  _/¯\_
 /_____\
`),
  foco: sprite(R`
 _
(_)`),
  campana: sprite(R`
  .-.
 /___\
`),
  globo: sprite(R`
 .-.
(   )
 ª-'`),
  arana: sprite(R`
    _|_
 .-' | ª-.
 i  -o-  i
 ª-._|_.-'`),
};

export function hangingLamp(K, X, z, drop, kind = 'pantalla', o = {}) {
  const s = SHADES[kind];
  // si el cordón cruzaría el título, la lámpara se corre a un lado
  const bottom = K.sy(K.HM - drop, z) + s.h + 3;
  if (bottom >= K.E && Math.abs(K.sx(X, z) - K.vx) < 9 + s.w / 2) X = K.vx + (9 + s.w / 2 + 1) * z * (X >= K.vx ? 1 : -1);
  const cx = K.sx(X, z);
  const top = Math.floor(K.sy(K.HM, z)) + 1;
  const len = Math.max(2, Math.round(drop * K.M / z));
  const night = K.night && o.on !== false;
  if (night) K.light(cx, top + len + s.h, (o.reach || 3) * 7 + 12, 1);
  const seed = o.seed || 0;
  K.anim((d, t) => {
    const { swing } = rumble(t);
    const a = swing * Math.sin(t * 3.1 + seed) * 0.28 + Math.sin(t * 0.6 + seed) * 0.015;
    const ex = cx + Math.sin(a) * len * 2;
    const ey = top + Math.cos(a) * len;
    d.z = z;
    d.line(cx, top, ex, ey, Math.abs(a) < 0.12 ? '|' : 0);
    const x = Math.round(ex - s.w / 2);
    const y = Math.round(ey);
    d.blit(s, x, y, z);
    if (night) {
      // luz que cae
      const by = y + s.h;
      const r = o.reach || 3;
      for (let i = 0; i < r; i++) {
        const half = 1 + i;
        d.put(Math.round(ex) - half - 1, by + i, '.');
        d.put(Math.round(ex) + half + 1, by + i, '.');
        if (i < r - 1) d.put(Math.round(ex), by + i + 1, i % 2 ? ':' : '·');
      }
      if (kind === 'foco') d.put(Math.round(ex), y + 1, '●');
    }
  });
}

// Lámpara de pie (en el piso a X, z). Encendida de noche, con su cono de luz.
export const FLOOR_LAMP = {
  M: sprite(R`
  _____
 /     \
/_______\
    |
    |
    |
    |
    |
    |
   _|_
  (___)`),
  S: sprite(R`
  ___
 /   \
/_____\
   |
   |
   |
   |
  _|_`),
};

export function floorLamp(K, X, z, o = {}) {
  const tier = K.M / z > 7 ? 'M' : 'S';
  const s = FLOOR_LAMP[tier];
  const p = K.stand(s, X, z);
  if (K.night && o.on !== false) {
    K.light(p.x + s.w / 2, p.y + 3, 22, 1);
    K.anim((d, t) => {
      d.z = z;
      const cx = p.x + Math.floor(s.w / 2);
      const y = p.y + 3;
      const flick = hash2(Math.floor(t * 9), 3) < 0.04;
      if (flick) return;
      d.put(cx - 3, p.y + 2, "'");
      d.put(cx + 3, p.y + 2, "'");
      for (let i = 0; i < 3; i++) {
        d.put(cx - 5 - i, y + i, '.');
        d.put(cx + 5 + i, y + i, '.');
      }
    });
  }
  return p;
}

// --- alfombra en el piso ---------------------------------------------------------------------
// kind: 'persa' (con borde y rombos), 'trenzada' (óvalo), 'lisa' (con flecos)
export function rug(K, X0, X1, z0, z1, kind = 'persa') {
  // alfombra: borde de puntos dobles, una trama interior y flecos adelante
  K.flat(0, X0, X1, z0, z1, (c, r, X, z) => {
    const u = (X - X0) / (X1 - X0);
    const v = (z - z0) / (z1 - z0);
    const bu = Math.min(u, 1 - u) * (X1 - X0) / K.MX;
    const bv = Math.min(v, 1 - v) * (z1 - z0) * K.DZ;
    const border = bu < 0.12 || bv < 0.1;
    if (border) return (c + r) % 2 ? '.' : ':';
    if (kind === 'lisa') return (c * 3 + r) % 7 === 0 ? '.' : SP;
    if (kind === 'trenzada') return (c + r) % 4 === 0 ? ':' : (c + r) % 4 === 2 ? '.' : SP;
    // persa: rombos
    const a = Math.abs(u - 0.5) * 2 + Math.abs(v - 0.5) * 2;
    const k = Math.round(a * 5);
    return k % 2 === 0 ? ((c + r) % 2 ? ':' : SP) : (c % 2 ? '.' : SP);
  });
  const r = Math.round(K.sy(0, z0));
  const a = Math.round(K.sx(X0, z0));
  const b = Math.round(K.sx(X1, z0));
  K.at(z0 - 0.001, (gg) => {
    for (let c = a; c < b; c++) gg.put(c, r, c % 2 ? '|' : "'");
  });
}

// --- enchufe con su cable -----------------------------------------------------------------------
export function outlet(K, X, z, h = 0.3) {
  const c = Math.round(K.sx(X, z));
  const r = Math.round(K.sy(h, z));
  K.at(z, (g) => g.text(c, r, '[:]'));
  return { c, r };
}

// cable que serpentea por el piso de (c0, r0) a (c1, r1), en la base
export function cable(K, c0, r0, c1, r1, z) {
  K.at(z, (g) => {
    const n = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0));
    for (let i = 0; i <= n; i++) {
      const c = Math.round(c0 + ((c1 - c0) * i) / n);
      const r = Math.round(r0 + ((r1 - r0) * i) / n);
      if (g.get(c, r) === SP) g.put(c, r, i % 2 ? '~' : '-');
    }
  });
}

// --- oscuridad: el cuarto apagado, iluminado sólo por la ventana --------------------------------
// light(c, r) → 0..1. Borra con dithering lo que queda a oscuras y deja una
// copia del cuarto entero para los barridos de luz (autos, el tren).
export function darken(K, light) {
  const { g, cols, rows } = K;
  const full = new Uint16Array(g.data);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const L = light(c, r);
    if (g.data[i] !== SP && bayer(c, r) > L) g.data[i] = SP;
  }
  return full;
}

// barrido de luz: copia el cuarto entero dentro de una franja vertical
export function reveal(d, full, cols, rows, x0, x1, y0 = 2, y1 = rows - 3, dots = true) {
  const a = Math.max(0, Math.floor(x0));
  const b = Math.min(cols - 1, Math.ceil(x1));
  for (let r = Math.max(0, y0); r <= Math.min(rows - 1, y1); r++) {
    for (let c = a; c <= b; c++) {
      const i = r * cols + c;
      const ch = full[i];
      if (ch !== SP) d.data[i] = ch;
      else if (dots && (c + r) % 3 === 0) d.data[i] = 46;
    }
  }
}

export { now };

// --- cosas en las paredes laterales, en perspectiva -------------------------------------------
// ¿la altura `step` se cruza dentro de la celda r a profundidad z?
export function crosses(K, r, z, step, off = 0) {
  const a = Math.floor((K.hAt(r - 0.5, z) - off) / step);
  const b = Math.floor((K.hAt(r + 0.5, z) - off) / step);
  return a !== b;
}

// Cuadro en una pared lateral: marco con el contenido rayado.
export function sideFrame(K, side, z0, z1, h0, h1, kind = 'paisaje') {
  const X = side < 0 ? 0 : K.cols;
  const g = K.g;
  const zc = (z0 + z1) / 2;
  K.side(X, z0, z1, h0, h1, (c, r, u, h) => {
    const v = (h - h0) / (h1 - h0);
    if (kind === 'espejo') return u > 0.15 && u < 0.85 && v > 0.1 && v < 0.9 ? (hash2(c, r) < 0.15 ? '/' : SP) : SP;
    if (kind === 'paisaje') return v < 0.35 ? ((c + r) % 3 === 0 ? '~' : SP) : v < 0.55 && Math.abs(u - 0.4) < 0.5 - v * 0.6 ? '^' : (c + r) % 5 === 0 ? '.' : SP;
    if (kind === 'retrato') return Math.abs(u - 0.5) < 0.18 && v > 0.45 && v < 0.75 ? 'o' : Math.abs(u - 0.5) < 0.3 && v < 0.42 ? ':' : SP;
    if (kind === 'afiche') return Math.abs(v - 0.7) < 0.08 ? '=' : (c + r) % 4 === 0 ? ':' : SP;
    return (c + r) % 3 === 0 ? ':' : SP;
  });
  K.at(z0, () => {
    K.line3(X, h1, z0, X, h1, z1);
    K.line3(X, h0, z0, X, h0, z1);
    for (const z of [z0, z1]) {
      const c = Math.round(K.sx(X, z) + (side < 0 ? 0 : -1));
      g.vline(c, Math.round(K.sy(h1, z)), Math.round(K.sy(h0, z)) - 1, '|');
    }
    // el clavo
    g.put(Math.round(K.sx(X, zc)), Math.round(K.sy(h1 + 0.12, zc)), '.');
  });
}

// Puerta abierta en una pared lateral, con algo que se ve del otro lado.
// glimpse: 'baño' (azulejos, toalla), 'pasillo' (oscuro con un perchero),
// 'pieza' (una cama).
export function sideDoor(K, side, z0, z1, h = 2.15, glimpse = 'pasillo') {
  const X = side < 0 ? 0 : K.cols;
  const g = K.g;
  const night = K.night;
  K.side(X, z0, z1, 0, h, (c, r, u, hh) => {
    if (glimpse === 'baño') {
      if (hh > 1.4) return hash2(c, r) < 0.08 ? '.' : SP;
      return r % 2 ? '_' : (c + (r >> 1)) % 3 === 0 ? '|' : SP;
    }
    if (glimpse === 'pieza') return hh < 0.55 && hh > 0.25 && u > 0.3 ? (hh > 0.5 ? '_' : (c + r) % 2 ? ':' : SP) : (c + r) % 7 === 0 ? '.' : SP;
    return night ? ((c + r) % 2 ? '.' : SP) : (c + r) % 4 === 0 ? '.' : SP;
  });
  K.at(z0, () => {
    // marco
    for (const z of [z0, z1]) {
      const c = Math.round(K.sx(X, z) + (side < 0 ? 0 : -1));
      g.vline(c, Math.round(K.sy(h, z)), Math.round(K.sy(0, z)) - 1, '|');
    }
    K.line3(X, h, z0, X, h, z1);
    K.line3(X, h + 0.12, z0 - 0.02, X, h + 0.12, z1 + 0.02);
  });
  // lo que asoma: una toalla colgada, un perchero o el pie de una cama
  const zm = z0 + (z1 - z0) * 0.6;
  const c = Math.round(K.sx(X, zm));
  const r = Math.round(K.sy(1.3, zm));
  K.at(z0 + 0.001, () => {
    if (glimpse === 'baño') {
      g.text(c - 1, r - 1, '_._');
      g.text(c - 1, r, '|:|');
      g.text(c - 1, r + 1, '|_|');
    } else if (glimpse === 'pasillo') {
      g.text(c - 1, r - 2, '_|_');
      g.text(c - 1, r - 1, '(|)');
      g.text(c - 1, r, ' | ');
    }
  });
  // la hoja abierta hacia el cuarto: un paño fino perpendicular a la pared
  const deep = Math.min(0.85 * K.MX, K.cols * 0.16);
  const Xa = side < 0 ? 0 : K.cols - deep;
  const Xb = side < 0 ? deep : K.cols;
  const zl = z0;
  K.box(Xa, Xb, h - 0.03, zl - K.dz(0.04), zl, {
    front: (cc, rr, u, v) => {
      // dos tableros con su moldura y la manilla del lado de afuera
      const uu = side < 0 ? u : 1 - u;
      if (Math.abs(v - 0.5) < 0.04 && uu > 0.8 && uu < 0.9) return 'o';
      const inU = uu > 0.15 && uu < 0.72;
      const top = v > 0.08 && v < 0.42;
      const bot = v > 0.56 && v < 0.92;
      if (inU && (top || bot)) {
        if (Math.abs(uu - 0.15) < 0.04 || Math.abs(uu - 0.72) < 0.04) return '|';
        return SP;
      }
      if (uu > 0.15 && uu < 0.72 && (Math.abs(v - 0.08) < 0.035 || Math.abs(v - 0.42) < 0.035 || Math.abs(v - 0.56) < 0.035 || Math.abs(v - 0.92) < 0.035)) return '_';
      return SP;
    },
  });
  return { z: zm, X };
}

// Ventana en una pared lateral (con el cielo que se ve de refilón).
export function sideWindow(K, side, z0, z1, h0, h1) {
  const X = side < 0 ? 0 : K.cols;
  const g = K.g;
  const night = K.night;
  K.side(X, z0, z1, h0, h1, (c, r, u, h) => {
    const v = (h - h0) / (h1 - h0);
    if (Math.abs(u - 0.5) < 0.04) return '|';
    if (crosses(K, r, K.zAtCol(X, c), (h1 - h0) / 2, h0)) return '_';
    if (night) return hash2(c * 3, r * 7) < 0.06 ? '.' : SP;
    return v > 0.75 && (c + r) % 4 === 0 ? '~' : SP;
  });
  K.at(z0, () => {
    for (const z of [z0, z1]) {
      const c = Math.round(K.sx(X, z) + (side < 0 ? 0 : -1));
      g.vline(c, Math.round(K.sy(h1, z)), Math.round(K.sy(h0, z)) - 1, '|');
    }
    K.line3(X, h1, z0, X, h1, z1);
    K.line3(X, h0, z0, X, h0, z1);
    K.line3(X, h0 - 0.06, z0 - 0.01, X, h0 - 0.06, z1 + 0.01);
  });
}
