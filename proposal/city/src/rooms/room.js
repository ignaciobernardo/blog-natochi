// La caja de una habitación en perspectiva de un punto.
//
// La pantalla es el plano de adelante (profundidad z = 1) y la pared del fondo
// está a z = Z. El punto de fuga es el centro de la fila del título, igual que
// en la calle: las aristas del piso, el techo y las paredes convergen hacia
// NATOCHI. Un punto del plano de adelante (X, Y) a profundidad z se ve en
//   x = vx + (X − vx) / z      y = vy + (Y − vy) / z
// Los muebles se describen en esas "unidades de adelante": X en columnas, una
// altura H en filas (lo que mediría pegado a la pantalla) y su profundidad.
import { Grid, SP, cc, hash2 } from './util.js';

export class Room {
  constructor(cols, rows, opts = {}) {
    this.cols = cols;
    this.rows = rows;
    this.vx = cols / 2;
    this.vy = Math.floor(rows / 2) + 0.5;
    // en pantallas angostas la pared del fondo queda más cerca (más ancha)
    this.Z = opts.Z || (cols < 90 ? 1.75 : 2.3);
    this.g = new Grid(cols, rows, SP);
    // pared del fondo, en celdas de pantalla
    this.bx0 = this.x(0, this.Z);
    this.bx1 = this.x(cols, this.Z);
    this.by0 = this.y(0, this.Z);
    this.by1 = this.y(rows, this.Z);
  }

  x(X, z) {
    return this.vx + (X - this.vx) / z;
  }

  y(Y, z) {
    return this.vy + (Y - this.vy) / z;
  }

  floorY(z) {
    return this.y(this.rows, z);
  }

  ceilY(z) {
    return this.y(0, z);
  }

  leftX(z) {
    return this.x(0, z);
  }

  rightX(z) {
    return this.x(this.cols, z);
  }

  // rectángulo de la pared del fondo disponible para dibujar (enteros)
  get back() {
    return {
      x0: Math.ceil(this.bx0) + 1,
      x1: Math.floor(this.bx1) - 1,
      y0: Math.ceil(this.by0) + 1,
      y1: Math.floor(this.by1) - 1,
    };
  }

  // --- la caja ---------------------------------------------------------------

  // opts.floor: 'baldosa' | 'tablas' | 'liso' | 'damero'
  // opts.walls: 'liso' | 'puntos' | 'rayas' | 'ladrillo' | 'papel'
  // opts.ceiling: 'liso' | 'vigas'
  shell({ floor = 'tablas', walls = 'liso', ceiling = 'liso', back = 'liso', seed = 1 } = {}) {
    const { g, cols, rows, Z } = this;
    // paredes laterales: textura por franjas de profundidad
    this.sideWalls(walls, seed);
    this.ceiling(ceiling);
    this.floor(floor, seed);
    // pared del fondo
    this.backWall(back, seed);
    // aristas de la caja
    const { bx0, bx1, by0, by1 } = this;
    g.line(0, 0, bx0, by0);
    g.line(cols, 0, bx1, by0);
    g.line(0, rows, bx0, by1);
    g.line(cols, rows, bx1, by1);
    g.line(bx0, by0, bx1, by0);
    g.line(bx0, by1, bx1, by1);
    g.vline(Math.floor(bx0), Math.ceil(by0), Math.floor(by1) - 1, '|');
    g.vline(Math.floor(bx1), Math.ceil(by0), Math.floor(by1) - 1, '|');
    void Z;
  }

  sideWalls(kind, seed) {
    const { g, rows, Z } = this;
    if (kind === 'liso') return;
    // franjas verticales a profundidades crecientes (espaciadas en perspectiva)
    const steps = kind === 'papel' ? 14 : 9;
    for (let i = 1; i < steps; i++) {
      const z = 1 + ((Z - 1) * i) / steps;
      for (const side of [0, 1]) {
        const xs = side ? this.rightX(z) : this.leftX(z);
        const c = Math.floor(xs);
        const y0 = Math.ceil(this.ceilY(z));
        const y1 = Math.floor(this.floorY(z)) - 1;
        for (let r = y0; r <= y1; r++) {
          let ch = 0;
          if (kind === 'rayas') ch = '|';
          else if (kind === 'papel') ch = (r + i) % 3 === 0 ? ':' : 0;
          else if (kind === 'puntos') ch = (r & 1) === 0 ? '.' : 0;
          else if (kind === 'ladrillo') ch = (r + (i & 1)) % 2 === 0 ? '|' : 0;
          if (ch) g.put(c, r, ch);
        }
      }
    }
    // zócalo: una línea a media altura de la pared que también fuga
    if (kind === 'ladrillo' || kind === 'papel') {
      const Y = rows * 0.78;
      g.line(0, Y, this.bx0, this.y(Y, Z));
      g.line(this.cols, Y, this.bx1, this.y(Y, Z));
    }
    void seed;
  }

  ceiling(kind) {
    const { g, cols, Z } = this;
    if (kind !== 'vigas') return;
    for (let i = 1; i < 5; i++) {
      const z = 1 + ((Z - 1) * i) / 5;
      g.line(this.leftX(z), this.ceilY(z), this.rightX(z), this.ceilY(z));
    }
    void cols;
  }

  floor(kind, seed) {
    const { g, cols, rows, Z, vx } = this;
    if (kind === 'liso') return;
    // líneas que fugan desde el borde de abajo
    const step = kind === 'tablas' ? 9 : 12;
    for (let X = vx % step; X <= cols; X += step) g.line(X, rows, this.x(X, Z), this.by1);
    if (kind === 'tablas') {
      // vetas sueltas: un punto aquí y allá sobre las tablas
      for (let r = Math.ceil(this.by1) + 1; r < rows; r++) {
        for (let c = 0; c < cols; c++) if (g.get(c, r) === SP && hash2(c + seed, r * 3) < 0.035) g.put(c, r, '.');
      }
      return;
    }
    // baldosas: filas transversales en perspectiva
    const n = kind === 'damero' ? 8 : 6;
    for (let i = 0; i <= n; i++) {
      const z = 1 / (1 - (i / n) * (1 - 1 / Z));
      g.line(this.leftX(z), this.floorY(z), this.rightX(z), this.floorY(z));
    }
    if (kind === 'damero') {
      // punteado en una de cada dos baldosas
      for (let r = Math.ceil(this.by1) + 1; r < rows; r++) {
        const z = (rows - this.vy) / (r + 0.5 - this.vy);
        const fz = (1 - 1 / z) / (1 - 1 / Z);
        const row = Math.floor(fz * n);
        for (let c = 0; c < cols; c++) {
          const X = vx + (c + 0.5 - vx) * z;
          const col = Math.floor((X - (vx % step)) / step);
          if (((row + col) & 1) === 0 && g.get(c, r) === SP && (c + r) % 2 === 0) g.put(c, r, '.');
        }
      }
    }
  }

  backWall(kind, seed) {
    const { g } = this;
    const b = this.back;
    if (kind === 'liso') return;
    for (let r = b.y0; r <= b.y1; r++) {
      for (let c = b.x0; c <= b.x1; c++) {
        let ch = 0;
        if (kind === 'puntos') ch = (c & 1) === 0 && (r & 1) === 0 ? '.' : 0;
        else if (kind === 'papel') ch = (c % 4 === 0 && (r + (c >> 2)) % 3 === 0) ? ':' : 0;
        else if (kind === 'ladrillo') ch = r % 2 === 0 ? ((c + (r >> 1) * 3) % 6 === 0 ? '|' : '_') : 0;
        else if (kind === 'azulejo') ch = r % 3 === 0 ? '-' : c % 6 === 0 ? '|' : 0;
        if (ch && hash2(c + seed, r) < 0.92) g.put(c, r, ch);
      }
    }
  }

  // --- objetos -----------------------------------------------------------------

  // Caja apoyada en el piso: de X0 a X1, alto H (unidades de adelante), entre
  // las profundidades z0 (frente) y z1 (fondo). Dibuja la cara de adelante, el
  // techo si queda debajo del horizonte y la cara lateral que mira al centro.
  // fill(c, r) opcional decide el relleno de la cara de adelante.
  box(X0, X1, H, z0, z1, fill = null, base = this.rows) {
    const { g } = this;
    const fx0 = this.x(X0, z0);
    const fx1 = this.x(X1, z0);
    const fyB = this.y(base, z0);
    const fyT = this.y(base - H, z0);
    const kx0 = this.x(X0, z1);
    const kx1 = this.x(X1, z1);
    const kyT = this.y(base - H, z1);
    const kyB = this.y(base, z1);
    // cara lateral (la que mira al punto de fuga)
    const side = fx1 < this.vx ? 1 : fx0 > this.vx ? -1 : 0;
    if (side) {
      const xs = side > 0 ? fx1 : fx0;
      const xk = side > 0 ? kx1 : kx0;
      const a = Math.min(xs, xk);
      const b = Math.max(xs, xk);
      for (let c = Math.ceil(a); c < b; c++) {
        const u = (c + 0.5 - xs) / (xk - xs);
        const top = fyT + (kyT - fyT) * u;
        const bot = fyB + (kyB - fyB) * u;
        for (let r = Math.ceil(top); r < bot; r++) g.put(c, r, SP);
      }
      g.line(xs, fyT, xk, kyT);
      g.line(xs, fyB, xk, kyB);
      for (let r = Math.ceil(kyT); r < kyB; r++) g.put(Math.floor(xk), r, '|');
    }
    // techo de la caja
    if (fyT > this.vy + 0.5) {
      for (let r = Math.floor(kyT); r < Math.floor(fyT); r++) {
        const u = (r + 0.5 - kyT) / (fyT - kyT);
        const a = kx0 + (fx0 - kx0) * u;
        const b = kx1 + (fx1 - kx1) * u;
        for (let c = Math.ceil(a); c < b; c++) g.put(c, r, SP);
      }
      g.line(kx0, kyT, kx1, kyT);
      g.line(fx0, fyT, kx0, kyT);
      g.line(fx1, fyT, kx1, kyT);
    }
    // cara de adelante
    const c0 = Math.round(fx0);
    const c1 = Math.round(fx1);
    const r0 = Math.round(fyT);
    const r1 = Math.round(fyB) - 1;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) g.put(c, r, fill ? fill(c - c0, r - r0) || SP : SP);
    g.hline(c0, c1, r0 - 1, '_');
    g.hline(c0 + 1, c1 - 1, r1, '_');
    g.vline(c0, r0, r1, '|');
    g.vline(c1, r0, r1, '|');
    return { c0, c1, r0, r1 };
  }

  // Un sprite parado en el piso a profundidad z, con su centro en X.
  stand(s, X, z) {
    const x = Math.round(this.x(X, z) - s.w / 2);
    const y = Math.round(this.floorY(z)) - s.h;
    this.g.blit(s, x, y);
    return { x, y };
  }

  // Un sprite colgado en la pared del fondo, con su centro en (fx, fy) en
  // fracciones de esa pared (0..1).
  onBack(s, fx, fy) {
    const b = this.back;
    const x = Math.round(b.x0 + (b.x1 - b.x0) * fx - s.w / 2);
    const y = Math.round(b.y0 + (b.y1 - b.y0) * fy - s.h / 2);
    this.g.blit(s, x, y);
    return { x, y };
  }

  // Un hueco en una pared lateral (puerta o ventana) entre z0 y z1, de alto
  // Y0..Y1 (unidades de adelante). Devuelve sus cuatro esquinas en pantalla.
  sideOpening(side, z0, z1, Y0, Y1, kind = 'puerta') {
    const { g } = this;
    const X = side < 0 ? 0 : this.cols;
    const xa = this.x(X, z0);
    const xb = this.x(X, z1);
    const ta = this.y(Y0, z0);
    const tb = this.y(Y0, z1);
    const ba = this.y(Y1, z0);
    const bb = this.y(Y1, z1);
    // vaciar
    const lo = Math.min(xa, xb);
    const hi = Math.max(xa, xb);
    for (let c = Math.ceil(lo); c < hi; c++) {
      const u = (c + 0.5 - xa) / (xb - xa);
      const top = ta + (tb - ta) * u;
      const bot = ba + (bb - ba) * u;
      for (let r = Math.ceil(top); r < bot; r++) g.put(c, r, SP);
    }
    g.line(xa, ta, xb, tb);
    g.line(xa, ba, xb, bb);
    g.vline(Math.round(xa), Math.ceil(ta), Math.floor(ba), '|');
    g.vline(Math.round(xb), Math.ceil(tb), Math.floor(bb), '|');
    if (kind === 'ventana') {
      // travesaño y montante
      const zm = (z0 + z1) / 2;
      const xm = this.x(X, zm);
      g.vline(Math.round(xm), Math.ceil(this.y(Y0, zm)), Math.floor(this.y(Y1, zm)), '|');
      const Ym = (Y0 + Y1) / 2;
      g.line(xa, this.y(Ym, z0), xb, this.y(Ym, z1));
    }
    return { xa, xb, ta, tb, ba, bb };
  }
}

export { cc };
