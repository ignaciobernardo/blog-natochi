// El cielo: de día sol, nubes y pájaros; de noche luna y estrellas que
// titilan. Casi no se mueve con el scroll (f 0.02) y las nubes derivan solas.
import { CLOUDS, BIRD, BIRD_SMALL, MOON, SUN } from './art.js';
import { hash2 } from './rng.js';

export class Sky {
  constructor(rng) {
    this.clouds = [];
    for (let i = 0; i < 9; i++) this.clouds.push({ x: rng.range(0, 600), y: rng.range(0, 1), s: CLOUDS[i % CLOUDS.length], v: rng.range(0.4, 1.1) });
    this.flocks = [];
    for (let i = 0; i < 4; i++) {
      const n = rng.int(3, 7);
      const birds = [];
      for (let k = 0; k < n; k++) birds.push({ dx: k * 4 + rng.int(-1, 1), dy: Math.abs(k - n / 2) | 0, ph: rng.int(0, 3) });
      this.flocks.push({ x: rng.range(0, 900), y: rng.range(0.05, 0.45), v: rng.range(4, 8) * (rng.next() < 0.5 ? -1 : 1), birds, small: i % 2 });
    }
  }

  // nubes: van delante de la cordillera y detrás de la ciudad
  drawClouds(scene, t) {
    const { rd, E } = scene;
    if (scene.night) return;
    const skyRows = Math.max(4, E - 2);
    const drift = scene.camX * 0.03;
    for (const c of this.clouds) {
      const span = rd.cols + 140;
      let x = (c.x + t * c.v - drift * 2) % span;
      if (x < 0) x += span;
      rd.blit(c.s, Math.floor(x - 70), Math.floor(1 + c.y * skyRows * 0.75));
    }
  }

  draw(scene, t) {
    const { rd, E } = scene;
    const cols = rd.cols;
    const drift = scene.camX * 0.02;
    const skyRows = Math.max(4, E - 2);
    if (scene.night) {
      for (let r = 0; r < E + 2; r++)
        for (let c = 0; c < cols; c++) {
          const wx = Math.floor(c + drift);
          const h = hash2(wx, r);
          if (h < 0.022) {
            const tw = hash2(wx, Math.floor(t * 1.5 + h * 300));
            rd.put(c, r, h < 0.003 ? (tw < 0.5 ? '*' : '+') : tw < 0.15 ? ' ' : h < 0.012 ? '.' : "'");
          }
        }
      rd.blit(MOON, Math.floor(cols * 0.78 - drift * 0.5), Math.max(1, Math.floor(skyRows * 0.25)));
    } else {
      rd.blit(SUN, Math.floor(cols * 0.8 - drift * 0.5), Math.max(1, Math.floor(skyRows * 0.2)));
    }
    for (const f of this.flocks) {
      const span = cols + 80;
      let x = (f.x + t * f.v - drift) % span;
      if (x < 0) x += span;
      x -= 40;
      const y = Math.floor(2 + f.y * skyRows);
      for (const b of f.birds) {
        const fr = (f.small ? BIRD_SMALL : BIRD)[Math.floor(t * 5 + b.ph) % (f.small ? 2 : 4)];
        rd.blit(fr, Math.floor(x + b.dx * Math.sign(f.v) * -1), y + b.dy);
      }
    }
  }
}
