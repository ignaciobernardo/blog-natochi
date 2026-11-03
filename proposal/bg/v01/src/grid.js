// Capas de dibujo en proyección oblicua (el lenguaje de la referencia).
//
// Tres ejes del mundo y su trazo en pantalla (una celda Jgs mide 1×2):
//   X  este              → una columna a la derecha                 _ ¯ -
//   D  hacia nosotros    → una columna a la derecha y una fila abajo  \
//   H  arriba            → una columna a la derecha y una fila arriba /
// El punto del mundo (x, d, h) cae en la ESQUINA de celda (x + d + h, d − h).
// Las caras visibles de una caja son el techo (X×D), el frente (X×H) y el lado
// izquierdo (D×H, un rombo): el ojo mira desde arriba, adelante y a la izquierda.
//
// Cada capa es un búfer de celdas más grande que la pantalla que se dibuja UNA
// sola vez (algoritmo del pintor: de atrás hacia adelante). En cada cuadro la
// escena las compone desplazadas según su parallax. 0 es transparente; el
// espacio es opaco y tapa lo de atrás, como en of.domains.

export const SP = 32;
const US = 95; //    _
const SL = 47; //    /
const BS = 92; //    \

export const code = (ch) => (typeof ch === 'number' ? ch : ch.charCodeAt(0));

// Sprite dibujado a mano. En el texto: los espacios del principio y del final de
// cada línea son transparentes, `$` es transparente en cualquier lugar y `&` es
// un espacio opaco. (ax, ay) es la esquina de anclaje dentro del dibujo; por
// defecto abajo a la izquierda.
export function art(str, ax = 0, ay = null) {
  let lines = str.split('\n');
  if (lines[0].trim() === '') lines = lines.slice(1);
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const h = lines.length;
  const w = Math.max(...lines.map((l) => l.length));
  const cells = new Uint16Array(w * h);
  for (let r = 0; r < h; r++) {
    const line = lines[r];
    const a = line.search(/\S/);
    const b = line.trimEnd().length;
    for (let c = Math.max(0, a); c < b; c++) {
      const ch = line[c];
      cells[r * w + c] = ch === '$' ? 0 : ch === '&' ? SP : ch.charCodeAt(0);
    }
  }
  return { w, h, cells, ax, ay: ay == null ? h : ay };
}

// efectos por celda que la composición resuelve en el tiempo
export const FX_WINDOW = 1; // ventana: de noche se prende y se apaga
export const FX_BLINK = 2; //  alterna entre dos glifos (balizas, neones)
export const FX_NIGHT = 3; //  glifo distinto de noche (faroles, carteles iluminados)
export const FX_TWINKLE = 4; // estrella: aparece y desaparece de noche

export class Layer {
  // f: factor de parallax. (c0, r0): esquina del búfer en coordenadas de capa.
  constructor({ name, f, zBase, c0, r0, w, h }) {
    this.name = name;
    this.f = f;
    this.zBase = zBase;
    this.c0 = c0;
    this.r0 = r0;
    this.w = w;
    this.h = h;
    this.chars = new Uint16Array(w * h);
    this.depth = new Float32Array(w * h).fill(Infinity);
    this.fx = new Uint32Array(w * h);
    // tabla de efectos: tipo, glifo A, glifo B, fase, período
    this.fxKind = [];
    this.fxA = [];
    this.fxB = [];
    this.fxP = [];
    this.fxT = [];
    this.near = 0; // cercanía del objeto que se está dibujando (más = más adelante)
    this.curFx = 0; // efecto que se asigna a lo que se pinta (0 = ninguno)
  }

  // registra un efecto y devuelve su id (1..n)
  addFx(kind, a = 0, b = 0, phase = 0, period = 1) {
    this.fxKind.push(kind);
    this.fxA.push(code(a));
    this.fxB.push(code(b));
    this.fxP.push(phase);
    this.fxT.push(period);
    return this.fxKind.length;
  }

  idx(c, r) {
    c -= this.c0;
    r -= this.r0;
    if (c < 0 || r < 0 || c >= this.w || r >= this.h) return -1;
    return r * this.w + c;
  }

  put(c, r, ch, fx = this.curFx) {
    const i = this.idx(c, r);
    if (i < 0) return;
    this.chars[i] = typeof ch === 'number' ? ch : ch.charCodeAt(0);
    this.depth[i] = this.zBase - this.near;
    this.fx[i] = fx;
  }

  get(c, r) {
    const i = this.idx(c, r);
    return i < 0 ? 0 : this.chars[i];
  }

  // borra (vuelve transparente)
  clear(c, r) {
    const i = this.idx(c, r);
    if (i < 0) return;
    this.chars[i] = 0;
    this.fx[i] = 0;
    this.depth[i] = Infinity;
  }

  text(c, r, str, fx = this.curFx) {
    for (let i = 0; i < str.length; i++) this.put(c + i, r, str.charCodeAt(i), fx);
  }

  // sprite con la esquina de anclaje en la esquina de celda (c, r)
  sprite(c, r, s, fx = this.curFx) {
    const c0 = c - s.ax;
    const r0 = r - s.ay;
    for (let y = 0; y < s.h; y++) {
      for (let x = 0; x < s.w; x++) {
        const ch = s.cells[y * s.w + x];
        if (ch) this.put(c0 + x, r0 + y, ch, fx);
      }
    }
  }

  // sprite anclado a un punto del mundo
  spriteAt(x, d, h, s, fx) {
    this.sprite(x + d + h, d - h, s, fx);
  }

  // ---------------------------------------------------------------- aristas
  // a lo largo de X: '_' en la fila de arriba de la línea (o '¯' en la de abajo)
  ex(x, d, h, n, ch = US) {
    const c = x + d + h;
    const r = ch === 175 || ch === '¯' ? d - h : d - h - 1;
    for (let i = 0; i < n; i++) this.put(c + i, r, ch);
  }
  // a lo largo de H (vertical del mundo): '/'
  eh(x, d, h, n, ch = SL) {
    const c = x + d + h;
    const r = d - h - 1;
    for (let i = 0; i < n; i++) this.put(c + i, r - i, ch);
  }
  // a lo largo de D (profundidad): '\'
  ed(x, d, h, n, ch = BS) {
    const c = x + d + h;
    const r = d - h;
    for (let i = 0; i < n; i++) this.put(c + i, r + i, ch);
  }

  // ----------------------------------------------------------------- caras
  // tex(...) devuelve un glifo para la celda o 0 para dejar el espacio opaco.
  // Frente: plano X×H en la profundidad D. tex(x, h, c, r) con x entero (centro
  // de celda) y h la base de la celda.
  front(x0, x1, D, h0, h1, tex) {
    for (let r = D - h1; r <= D - h0 - 1; r++) {
      const hh = D - r - 1;
      const ca = x0 + 2 * D - r;
      const cb = x1 + 2 * D - r - 2;
      for (let c = ca; c <= cb; c++) {
        const t = tex ? tex(c + r + 1 - 2 * D, hh, c, r) : 0;
        if (t !== -1) this.put(c, r, t || SP);
      }
    }
  }

  // Lado izquierdo: plano D×H en X. tex(d, h, c, r) con d y h del centro de celda.
  left(X, d0, d1, h0, h1, tex) {
    for (let r = d0 - h1; r <= d1 - h0 - 1; r++) {
      const dlo = Math.max(d0, h0 + r + 0.5);
      const dhi = Math.min(d1, h1 + r + 0.5);
      if (dhi <= dlo) continue;
      const ca = Math.floor(2 * dlo + X - r - 1) + 1;
      const cb = Math.ceil(2 * dhi + X - r - 1) - 1;
      for (let c = ca; c <= cb; c++) {
        const d = (c + r + 1 - X) / 2;
        const t = tex ? tex(d, d - r - 0.5, c, r) : 0;
        if (t !== -1) this.put(c, r, t || SP);
      }
    }
  }

  // Techo / suelo: plano X×D a la altura H. tex(x, d, c, r) con x entero y d la
  // base de la fila.
  top(x0, x1, d0, d1, H, tex) {
    for (let r = d0 - H; r <= d1 - H - 1; r++) {
      const ca = x0 + 1 + r + 2 * H;
      const cb = x1 - 1 + r + 2 * H;
      for (let c = ca; c <= cb; c++) {
        const t = tex ? tex(c - r - 2 * H, r + H, c, r) : 0;
        if (t !== -1) this.put(c, r, t || SP);
      }
    }
  }

  // Caja completa: caras opacas, texturas y aristas. Las horizontales van primero
  // para que las diagonales ganen en las esquinas (`/___/`, `\___\`).
  box(x0, x1, d0, d1, h0, h1, o = {}) {
    const w = x1 - x0;
    const dd = d1 - d0;
    const hh = h1 - h0;
    if (o.left !== false && dd > 0 && hh > 0) this.left(x0, d0, d1, h0, h1, o.left);
    if (o.top !== false && dd > 0) this.top(x0, x1, d0, d1, h1, o.top);
    if (o.front !== false && hh > 0) this.front(x0, x1, d1, h0, h1, o.front);
    if (o.top !== false) this.ex(x0, d0, h1, w);
    this.ex(x0, d1, h1, w);
    if (o.base !== false && hh > 0) this.ex(x0, d1, h0, w);
    if (o.top !== false) {
      this.ed(x0, d0, h1, dd);
      this.ed(x1, d0, h1, dd);
    }
    if (o.base !== false && o.left !== false) this.ed(x0, d0, h0, dd);
    if (o.left !== false) this.eh(x0, d0, h0, hh);
    this.eh(x0, d1, h0, hh);
    this.eh(x1, d1, h0, hh);
  }

  // Ventana paralelogramo en un frente: `_` arriba, `/` a los costados.
  // Devuelve las celdas interiores para efectos.
  winFront(x, D, h, w, k, fx = 0, fill) {
    // vidrio (con su efecto), marcos horizontales, adentro y por último los costados
    this.front(x, x + w, D, h, h + k, (xx, hh, c, r) => {
      this.put(c, r, SP, fx);
      return -1;
    });
    this.ex(x, D, h + k, w);
    this.ex(x, D, h, w);
    if (fill) {
      this.front(x, x + w, D, h, h + k, (xx, hh, c, r) => {
        const t = fill(xx - x, hh - h);
        if (t) this.put(c, r, t, 0);
        return -1;
      });
    }
    this.eh(x, D, h, k);
    this.eh(x + w, D, h, k);
  }

  // Ventana rombo en un lado izquierdo: `/\` arriba, `\/` abajo.
  winLeft(X, d, h, a, k, fx = 0) {
    this.left(X, d, d + a, h, h + k, (dd, hh, c, r) => {
      if (fx) this.put(c, r, SP, fx);
      return fx ? -1 : 0;
    });
    this.ed(X, d, h + k, a);
    this.ed(X, d, h, a);
    this.eh(X, d, h, k);
    this.eh(X, d + a, h, k);
  }
}
