// PRNG con semilla (mulberry32): la ciudad es la misma en cada carga.
export class Rng {
  constructor(seed = 1) {
    this.s = seed >>> 0;
  }

  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(a, b) {
    return a + (b - a) * this.next();
  }

  // entero en [a, b]
  int(a, b) {
    return a + Math.floor((b - a + 1) * this.next());
  }

  pick(arr) {
    return arr[Math.floor(arr.length * this.next())];
  }

  chance(p) {
    return this.next() < p;
  }

  fork() {
    return new Rng(Math.floor(this.next() * 4294967296));
  }
}

// hash entero estable para texturas ancladas al mundo
export function hash2(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
