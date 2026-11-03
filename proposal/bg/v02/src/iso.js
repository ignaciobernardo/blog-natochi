// Proyección oblicua de la avenida, en el lenguaje de la referencia.
//
//   x  a lo ancho de la avenida  → 2 columnas a la derecha                ( _ )
//   y  a lo largo de la avenida  → 1 columna a la derecha y 1 fila abajo  ( \ )
//   z  altura                    → 1 columna a la derecha y 1 fila arriba ( / )
//
// Un punto entero del mundo cae justo en un vértice de la grilla de celdas:
//
//   C = 2x + y + z      R = y − z
//
// y la celda (c, r) cubre los vértices [c, c+1] × [r, r+1]. Así cada arista
// del mundo es un trazo continuo de Jgs: `_` sobre el borde de abajo de la
// celda, `\` y `/` de esquina a esquina (una columna por fila).
//
// Profundidad para el z-buffer: el rayo de vista va por (1, −1, −1), así que
// D = x − y − z y gana el menor. El lado oeste (x < 0) queda adelante, por eso
// ahí la ciudad es baja: los edificios altos van al este, con la vidriera
// mirando a la avenida.
//
// Todas las funciones dibujan sobre un "blanco" con put(c, r, code, d) en
// celdas del mundo: la capa estática o el cuadro de cada frame.

export const SP = 32; //  espacio (opaco)
export const US = 95; //  _
export const BS = 92; //  \
export const SL = 47; //  /
export const PIPE = 124; // |
export const NONE = 0; // transparente
export const T = 0x2591; // ░ en los sprites = transparente

export const EDGE = -0.6; // las aristas le ganan a su propia cara
export const SPRITE = -1; //  los sprites le ganan al piso donde se paran

export const code = (ch) => (typeof ch === 'number' ? ch : ch.charCodeAt(0));
export const vc = (x, y, z) => 2 * x + y + z;
export const vr = (x, y, z) => y - z;
export const dep = (x, y, z) => x - y - z;

// --- trazos a lo largo de los ejes, desde (x, y, z), n unidades -----------

export function segX(t, x, y, z, n, ch = US, bias = EDGE) {
  const C = Math.round(2 * x + y + z);
  const R = Math.round(y - z);
  const cells = Math.round(2 * n);
  for (let k = 0; k < cells; k++) t.put(C + k, R - 1, ch, x + (k + 0.5) / 2 - y - z + bias);
}

export function segY(t, x, y, z, n, ch = BS, bias = EDGE) {
  const C = Math.round(2 * x + y + z);
  const R = Math.round(y - z);
  for (let k = 0; k < n; k++) t.put(C + k, R + k, ch, x - y - k - 0.5 - z + bias);
}

export function segZ(t, x, y, z, n, ch = SL, bias = EDGE) {
  const C = Math.round(2 * x + y + z);
  const R = Math.round(y - z);
  for (let k = 0; k < n; k++) t.put(C + k, R - 1 - k, ch, x - y - z - k - 0.5 + bias);
}

// --- caras -----------------------------------------------------------------
//
// kind 'T' techo   (z = k; u = x, v = y)
//      'L' lado    (x = k; u = y, v = z)  — mira al oeste, a la avenida en la vereda este
//      'F' frente  (y = k; u = x, v = z)  — mira al sur, a la calle transversal
//
// Rellena las celdas cuyo centro cae estrictamente adentro; las del borde son
// de las aristas. tex(c, r, u, v) devuelve el código del carácter (0 = espacio).

export function faceCorners(kind, k, u0, u1, v0, v1) {
  const pts = [];
  for (const u of [u0, u1]) {
    for (const v of [v0, v1]) {
      if (kind === 'T') pts.push([2 * u + v + k, v - k]);
      else if (kind === 'L') pts.push([2 * k + u + v, u - v]);
      else pts.push([2 * u + k + v, k - v]);
    }
  }
  return pts;
}

export function fillFace(t, kind, k, u0, u1, v0, v1, tex, bias = 0) {
  const pts = faceCorners(kind, k, u0, u1, v0, v1);
  let cMin = Infinity;
  let cMax = -Infinity;
  let rMin = Infinity;
  let rMax = -Infinity;
  for (const [C, R] of pts) {
    if (C < cMin) cMin = C;
    if (C > cMax) cMax = C;
    if (R < rMin) rMin = R;
    if (R > rMax) rMax = R;
  }
  const e = 0.1;
  for (let r = Math.floor(rMin); r < Math.ceil(rMax); r++) {
    for (let c = Math.floor(cMin); c < Math.ceil(cMax); c++) {
      const Cc = c + 0.5;
      const Rc = r + 0.5;
      let u;
      let v;
      let d;
      if (kind === 'T') {
        v = Rc + k;
        u = (Cc - v - k) / 2;
        d = u - v - k;
      } else if (kind === 'L') {
        u = (Cc - 2 * k + Rc) / 2;
        v = (Cc - 2 * k - Rc) / 2;
        d = k - u - v;
      } else {
        v = k - Rc;
        u = (Cc - k - v) / 2;
        d = u - k - v;
      }
      if (u <= u0 + e || u >= u1 - e || v <= v0 + e || v >= v1 - e) continue;
      const ch = tex ? tex(c, r, u, v) : SP;
      t.put(c, r, ch || SP, d + bias);
    }
  }
}

// Punto de una cara en coordenadas del mundo
export function facePoint(kind, k, u, v) {
  if (kind === 'T') return [u, v, k];
  if (kind === 'L') return [k, u, v];
  return [u, k, v];
}

// Segmento sobre una cara, a lo largo de su eje u o v
export function faceSeg(t, kind, k, u, v, axis, n, ch, bias = EDGE) {
  const [x, y, z] = facePoint(kind, k, u, v);
  const dir = kind === 'T' ? (axis === 'u' ? 'x' : 'y') : kind === 'L' ? (axis === 'u' ? 'y' : 'z') : axis === 'u' ? 'x' : 'z';
  if (dir === 'x') segX(t, x, y, z, n, ch ?? US, bias);
  else if (dir === 'y') segY(t, x, y, z, n, ch ?? BS, bias);
  else segZ(t, x, y, z, n, ch ?? SL, bias);
}

// Rectángulo sobre una cara: borde + relleno opcional (tex o espacio)
export function faceRect(t, kind, k, u0, u1, v0, v1, tex = null, bias = -0.3) {
  fillFace(t, kind, k, u0, u1, v0, v1, tex, bias);
  faceSeg(t, kind, k, u0, v0, 'u', u1 - u0, undefined, bias + EDGE);
  faceSeg(t, kind, k, u0, v1, 'u', u1 - u0, undefined, bias + EDGE);
  faceSeg(t, kind, k, u0, v0, 'v', v1 - v0, undefined, bias + EDGE);
  faceSeg(t, kind, k, u1, v0, 'v', v1 - v0, undefined, bias + EDGE);
}

// Caja sólida: techo (z1), lado oeste (x0) y frente sur (y1), con sus 9 aristas.
// st = { top, left, front } texturas; st.noFloor quita las aristas del piso.
export function box(t, x0, x1, y0, y1, z0, z1, st = {}) {
  const b = st.bias || 0;
  if (st.top !== false) fillFace(t, 'T', z1, x0, x1, y0, y1, st.top, b);
  if (st.left !== false) fillFace(t, 'L', x0, y0, y1, z0, z1, st.left, b);
  if (st.front !== false) fillFace(t, 'F', y1, x0, x1, z0, z1, st.front, b);
  const e = EDGE + b;
  segX(t, x0, y0, z1, x1 - x0, US, e);
  segX(t, x0, y1, z1, x1 - x0, US, e);
  segY(t, x0, y0, z1, y1 - y0, BS, e);
  segY(t, x1, y0, z1, y1 - y0, BS, e);
  segZ(t, x0, y0, z0, z1 - z0, SL, e);
  segZ(t, x0, y1, z0, z1 - z0, SL, e);
  segZ(t, x1, y1, z0, z1 - z0, SL, e);
  if (!st.noFloor) {
    segY(t, x0, y0, z0, y1 - y0, BS, e);
    segX(t, x0, y1, z0, x1 - x0, US, e);
  }
}

// Texto sobre los ejes: 'y' baja en diagonal (\), 'z' sube en diagonal (/),
// 'x' horizontal (una letra cada `step` columnas)
export function axisText(t, x, y, z, str, axis, bias = -0.8, step = 1) {
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    if (ch === 32 && axis !== 'x') continue;
    let X = x;
    let Y = y;
    let Z = z;
    if (axis === 'y') Y += i;
    else if (axis === 'z') Z += i;
    else X += (i * step) / 2;
    // la letra va en la celda cuyo centro está a media unidad del vértice
    const C = Math.round(2 * X + Y + Z);
    const R = Math.round(Y - Z);
    if (axis === 'y') t.put(C, R, ch, X - Y - Z - 0.5 + bias);
    else if (axis === 'z') t.put(C, R - 1, ch, X - Y - Z - 0.5 + bias);
    else t.put(C, R - 1, ch, X - Y - Z + bias);
  }
}

// --- sprites ---------------------------------------------------------------
//
// Un sprite es una lista de filas. Los espacios al principio y al final de
// cada fila son transparentes; `░` es transparente en cualquier lugar; el
// resto (incluido el espacio de adentro) es opaco y tapa lo de atrás.

export function sprite(rows, ax = 0, ay = rows.length, up = 1) {
  const lines = typeof rows === 'string' ? rows.split('\n') : rows;
  const h = lines.length;
  const w = Math.max(...lines.map((l) => l.length));
  const cells = new Uint16Array(w * h);
  for (let j = 0; j < h; j++) {
    const l = lines[j];
    const first = l.search(/\S/);
    const last = l.length - 1 - l.split('').reverse().join('').search(/\S/);
    for (let i = 0; i < w; i++) {
      const ch = i < l.length ? l.charCodeAt(i) : 32;
      cells[j * w + i] = first < 0 || i < first || i > last || ch === T ? NONE : ch;
    }
  }
  return { w, h, cells, ax, ay, up };
}

// Dibuja un sprite con su ancla (ax, ay) en el vértice del punto (x, y, z).
// Cada fila por encima del ancla cuenta como `up` unidades más alta (más cerca).
export function stamp(t, s, x, y, z, bias = SPRITE, flip = false) {
  const C = Math.round(2 * x + y + z);
  const R = Math.round(y - z);
  const d0 = x - y - z + bias;
  const { w, h, cells, ax, ay, up, dd } = s;
  if (dd) {
    // sprite armado con cajas: profundidad propia de cada celda
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const k = j * w + i;
        if (cells[k]) t.put(C + i - ax, R + j - ay, cells[k], d0 + dd[k]);
      }
    }
    return;
  }
  for (let j = 0; j < h; j++) {
    const dz = (ay - 1 - j) * up;
    for (let i = 0; i < w; i++) {
      const ch = cells[j * w + (flip ? w - 1 - i : i)];
      if (ch) t.put(C + i - ax, R + j - ay, flip ? mirror(ch) : ch, d0 - dz);
    }
  }
}

const MIRROR = { 47: 92, 92: 47, 40: 41, 41: 40, 60: 62, 62: 60, 91: 93, 93: 91, 123: 125, 125: 123, 39: 96, 96: 39 };
export const mirror = (ch) => MIRROR[ch] || ch;

// Un sprite con varios cuadros separados por una línea que empieza con `~~`
export function frames(src, ax, ay, up) {
  return src
    .split(/\n~~[^\n]*\n/)
    .map((f) => sprite(f.replace(/^\n/, '').split('\n'), ax, ay, up));
}
