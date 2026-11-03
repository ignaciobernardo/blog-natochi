// Lo que comparten los interiores: grillas, sprites y azar con semilla.
export { Grid, SP, T, cc, sprite, frames, mirror, bayer, clamp, smoothstep } from '../grid.js';
export { Rng, hash2 } from '../rng.js';

// Copia una grilla entera sobre otra del mismo tamaño.
export function copyGrid(dst, src) {
  dst.data.set(src.data.subarray(0, dst.data.length));
}

// Cuadro de animación según el tiempo: k cuadros cada `period` segundos.
export const frameAt = (t, n, period = 0.5, phase = 0) => Math.floor(t / period + phase) % n;
