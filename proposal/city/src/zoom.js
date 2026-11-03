// Zoom de cámara sobre una grilla de caracteres.
//
// Los glifos no se pueden agrandar, así que cada carácter se trata como un
// dibujo vectorial: "|" es una recta vertical al medio de la celda, "_" una
// horizontal abajo, "/" la diagonal de esquina a esquina, "(" una curva, "o"
// una elipse, una letra un punto. Al ampliar s veces, cada celda de la imagen
// de origen ocupa s×s celdas de salida y se vuelve a trazar con glifos de una
// celda de grosor. Así las líneas siguen siendo líneas (no bloques repetidos),
// como un zoom de verdad sobre un dibujo a pluma.
import { SP, cc } from './grid.js';

const G = (ch) => ch.charCodeAt(0);
const PIPE = G('|');
const US = G('_');
const DASH = G('-');
const MAC = G('¯');
const SL = G('/');
const BS = G('\\');

// primitivas, en coordenadas de la celda de origen (0..1, y hacia abajo)
const v = (x, ya = 0, yb = 1) => ({ t: 'v', x, ya, yb });
const h = (y, xa = 0, xb = 1, ch = 0) => ({ t: 'h', y, xa, xb, ch });
const d = (a, b, ya = 0, yb = 1) => ({ t: 'd', a, b, ya, yb }); // x = a + b·y
const curve = (fx, dfx) => ({ t: 'c', fx, dfx });
const pt = (x, y, ch) => ({ t: 'p', x, y, ch });
const ell = (x, y, rx, ry, fill = 0) => ({ t: 'e', x, y, rx, ry, fill });
const FILL = { t: 'f' };

const SHAPES = new Map();
const def = (chars, prims) => {
  for (const ch of chars) SHAPES.set(G(ch), prims);
};
def('|', [v(0.5)]);
def('‖', [v(0.3), v(0.7)]);
def('¦', [v(0.5, 0, 0.42), v(0.5, 0.58, 1)]);
def('_', [h(1)]);
def('¯', [h(0)]);
def('-', [h(0.5, 0.08, 0.92)]);
def('=', [h(0.36), h(0.7)]);
def('~', [h(0.5, 0, 1, G('~'))]);
def('/', [d(1, -1)]);
def('\\', [d(0, 1)]);
def('(', [curve((y) => 0.78 - 0.5 * Math.sin(Math.PI * y), (y) => -0.5 * Math.PI * Math.cos(Math.PI * y))]);
def(')', [curve((y) => 0.22 + 0.5 * Math.sin(Math.PI * y), (y) => 0.5 * Math.PI * Math.cos(Math.PI * y))]);
def('[', [v(0.35), h(0, 0.35, 0.85), h(1, 0.35, 0.85)]);
def(']', [v(0.65), h(0, 0.15, 0.65), h(1, 0.15, 0.65)]);
def('{', [v(0.45, 0, 0.4), v(0.45, 0.6, 1), pt(0.3, 0.5, G('<'))]);
def('}', [v(0.55, 0, 0.4), v(0.55, 0.6, 1), pt(0.7, 0.5, G('>'))]);
def('<', [d(0.85, -1.3, 0, 0.5), d(-0.45, 1.3, 0.5, 1)]);
def('>', [d(0.15, 1.3, 0, 0.5), d(1.45, -1.3, 0.5, 1)]);
def('+', [v(0.5, 0.18, 0.82), h(0.5, 0.18, 0.82)]);
def('oø', [ell(0.5, 0.62, 0.32, 0.26)]);
def('O0○Ø', [ell(0.5, 0.5, 0.38, 0.4)]);
def('●◙', [ell(0.5, 0.5, 0.38, 0.4, G('▒'))]);
def('◘', [FILL]);
def('.', [pt(0.5, 0.92, G('.'))]);
def(',', [pt(0.5, 0.92, G(','))]);
def("'", [pt(0.5, 0.08, G("'"))]);
def('`', [pt(0.5, 0.08, G('`'))]);
def('·', [pt(0.5, 0.5, G('·'))]);
def(':', [pt(0.5, 0.3, G('.')), pt(0.5, 0.86, G('.'))]);
def('░▒▓█▄▀▌▐', [FILL]);

// ¿la recta pasa por la celda de salida? (una celda por fila o por columna)
const within = (p, c, hw) => p >= c - hw && p < c + hw;
// Una recta pegada al borde de la celda ("_" abajo, "¯" arriba) la tocaría la
// celda de salida centrada en la celda vecina, que no la conoce. Para el
// cruce se la corre hacia adentro (a hw del borde); el glifo sale de la
// posición verdadera.
const inside = (p, hw) => (p < hw ? hw : p > 1 - hw ? 1 - hw : p);

function evalPrim(pr, ch, fx, fy, hw) {
  switch (pr.t) {
    case 'v':
      if (within(inside(pr.x, hw), fx, hw) && fy + hw >= pr.ya && fy - hw <= pr.yb) return PIPE;
      return 0;
    case 'h': {
      if (!within(inside(pr.y, hw), fy, hw) || fx + hw < pr.xa || fx - hw > pr.xb) return 0;
      if (pr.ch) return pr.ch;
      const pos = (pr.y - (fy - hw)) / (2 * hw);
      return pos < 0.34 ? MAC : pos < 0.67 ? DASH : US;
    }
    case 'd': {
      if (fy + hw < pr.ya || fy - hw > pr.yb) return 0;
      if (!within(pr.a + pr.b * fy, fx, hw)) return 0;
      const ab = Math.abs(pr.b);
      if (ab < 0.35) return PIPE;
      return pr.b < 0 ? SL : BS;
    }
    case 'c': {
      if (!within(pr.fx(fy), fx, hw)) return 0;
      const s = pr.dfx(fy);
      if (Math.abs(s) < 0.35) return PIPE;
      if (Math.abs(s) > 2.6) return fy < 0.5 ? MAC : US;
      return s < 0 ? SL : BS;
    }
    case 'p':
      return within(inside(pr.x, hw), fx, hw) && within(inside(pr.y, hw), fy, hw) ? pr.ch : 0;
    case 'e': {
      const nx = (fx - pr.x) / pr.rx;
      const ny = (fy - pr.y) / pr.ry;
      const r = Math.hypot(nx, ny);
      const th = Math.atan2(ny, nx);
      const px = pr.x + pr.rx * Math.cos(th);
      const py = pr.y + pr.ry * Math.sin(th);
      if (Math.abs(px - fx) <= hw && Math.abs(py - fy) <= hw) {
        // tangente física (una fila mide dos columnas)
        const tx = -pr.rx * Math.sin(th);
        const ty = pr.ry * Math.cos(th) * 2;
        const ang = (Math.atan2(Math.abs(ty), Math.abs(tx)) * 180) / Math.PI;
        if (ang < 24) return Math.sin(th) < 0 ? MAC : US;
        if (ang > 66) return Math.cos(th) < 0 ? G('(') : G(')');
        return tx * ty < 0 ? SL : BS;
      }
      return pr.fill && r < 1 ? pr.fill : 0;
    }
    case 'f':
      return ch;
    default:
      return 0;
  }
}

// Carácter de salida para el punto (x, y) de la grilla de origen (en celdas,
// continuo) visto con ampliación s.
export function zoomAt(src, x, y, s) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || iy < 0 || ix >= src.w || iy >= src.h) return SP;
  const ch = src.data[iy * src.w + ix];
  if (s < 1.02 || ch === SP || !ch) return ch || SP;
  const fx = x - ix;
  const fy = y - iy;
  const hw = 0.5 / s;
  let prims = SHAPES.get(ch);
  // las curvas y las letras redondas recién se vuelven dibujo con bastante
  // aumento; antes siguen siendo letras (si no, una "O" chica sería un ")")
  if (prims && s < 2.5 && (prims[0].t === 'e' || prims[0].t === 'c')) prims = null;
  if (!prims) {
    // letras, números, signos: una sola vez, al centro de su bloque
    return within(0.5, fx, hw) && within(0.5, fy, hw) ? ch : SP;
  }
  for (const pr of prims) {
    const g = evalPrim(pr, ch, fx, fy, hw);
    if (g) return g;
  }
  return SP;
}

export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Compone un cuadro de la transición:
//   out   pantalla (se sobreescribe)
//   src   la calle tal como se ve (sin zoom)
//   ins   el interior a escala 1
//   hole  el vano por donde se entra, en celdas de src {x0, x1, y0, y1}
//   k     avance 0..1 (0 = afuera, 1 = adentro)
//   t     tiempo, para que las rayas de velocidad titilen
export function composeZoom(out, src, ins, hole, k, t) {
  const cols = out.w;
  const rows = out.h;
  const hx = (hole.x0 + hole.x1) / 2;
  const hy = (hole.y0 + hole.y1) / 2;
  const hwid = hole.x1 - hole.x0;
  const hhei = hole.y1 - hole.y0;
  // ampliación final: el vano tapa la pantalla con margen
  const smax = Math.max(cols / hwid, rows / hhei) * 1.25;
  const e = easeInOut(k);
  const s = Math.exp(Math.log(smax) * e);
  // el vano viaja de donde estaba al centro de la pantalla
  const m = easeInOut(Math.min(1, k * 1.6));
  const qx = hx + (cols / 2 - hx) * m;
  const qy = hy + (rows / 2 - hy) * m;
  // el interior está más atrás: se acerca menos y termina a escala 1
  const si = 1 + 1.6 * (1 - e) ** 2;
  const icx = ins.w / 2;
  const icy = ins.h / 2;
  // rayas de velocidad: más cuanto más rápido crece el zoom
  const speed = Math.sin(Math.PI * Math.min(1, k)) ** 2;
  const data = out.data;
  for (let r = 0; r < rows; r++) {
    const py = r + 0.5;
    const sy = hy + (py - qy) / s;
    for (let c = 0; c < cols; c++) {
      const px = c + 0.5;
      const sx = hx + (px - qx) / s;
      let ch;
      if (sx > hole.x0 + 0.5 / s && sx < hole.x1 - 0.5 / s && sy > hole.y0 + 0.5 / s && sy < hole.y1 - 0.5 / s) {
        ch = zoomAt(ins, icx + (px - qx) / si, icy + (py - qy) / si, si);
      } else {
        ch = zoomAt(src, sx, sy, s);
        if (ch === SP && speed > 0.05) {
          const dx = px - qx;
          const dy = (py - qy) * 2;
          const dist = Math.hypot(dx, dy) / Math.hypot(cols / 2, rows);
          const n = hash(c, r, Math.floor(t * 30));
          if (n < speed * dist * dist * dist * 0.16) ch = radial(dx, dy);
        }
      }
      data[r * cols + c] = ch;
    }
  }
}

// glifo de una raya que sale del centro
function radial(dx, dy) {
  const a = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
  if (a < 22 || a > 158) return DASH;
  if (a > 68 && a < 112) return PIPE;
  return (dx > 0) === (dy > 0) ? BS : SL;
}

function hash(x, y, z) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export { cc };
