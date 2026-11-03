// El cielo: sol o luna, estrellas, nubes con textura de puntos, pájaros y un
// cóndor planeando frente a la cordillera. Va directo a la pantalla (no es un
// lienzo fijo) porque casi todo se mueve.
import { sprite } from './grid.js';
import { hash2 } from './rng.js';

const CLOUDS = [
  sprite(String.raw`
           _.--._
      .--'´  .   ´-.   _
   .-'  .  .   .   .´-' ´-.
  (  .   .   .   .   .   . )
 (  .  .   .   .   .   .  .´.
  ´-.__.-´´-.__.--.___.-´-.-´
`),
  sprite(String.raw`
      .-.
  .-.(   )-.
 (  .  .   .)
  ´-´´---´´-´
`),
  sprite(String.raw`
          .--.
   .--.-'´ .  ´-.
 .´  .   .   .   )-.
(   .   .   .   .   )
 ´--´´-.__.-´´--.__.´
`),
  sprite(String.raw`
  .-.
 (  .)-.
(__.-´_)
`),
];

const SUN = sprite(String.raw`
       .   |   .
        ´. | .´
   .     .---.     .
    ´-. ( . . ) .-´
  ----  ( . . )  ----
    .-´ ´-._.-´ ´-.
   ´     .´|´.     ´
       .´  |  ´.
`);

const MOON = sprite(String.raw`
   _.-.
 .´ .´
(  (
 ´. ´-._
   ´-..-´
`);

// pájaros chicos: alas arriba / abajo
const BIRD = sprite(String.raw`
v
~~
-
`);

// el cóndor: alas largas con las plumas abiertas en la punta
const CONDOR = sprite(String.raw`
-=.__      __.=-
     ´-.o.-´
~~
     __.o.__
-=-´´      ´´-=-
`);

// volantines (septiembre): rombo con su cola que se mueve
const KITE = sprite(String.raw`
 /\
<-->
 \/
  )
  (
~~
 /\
<-->
 \/
  (
  )
`);

export class Sky {
  constructor(rng, night) {
    this.night = night;
    this.W = 420; // período de la capa de nubes
    this.clouds = [];
    for (let i = 0; i < 12; i++) {
      this.clouds.push({
        s: CLOUDS[i % CLOUDS.length],
        x: rng.range(0, this.W),
        y: rng.range(0, 1),
        v: rng.range(0.6, 1.6),
        z: rng.range(10, 18),
      });
    }
    this.birds = [];
    for (let f = 0; f < 3; f++) {
      const flock = { x: rng.range(0, 300), y: rng.range(0, 1), v: rng.range(5, 9), z: rng.range(3, 7), n: rng.int(3, 7), ph: rng.range(0, 6) };
      this.birds.push(flock);
    }
    this.condor = { x: rng.range(0, 200), y: 9, v: 3.2 };
    this.kites = [];
    for (let i = 0; i < 3; i++) this.kites.push({ x: rng.range(-15, 15) + i * 130 - 160, y: 0.62 + ((i * 0.37) % 0.25), z: rng.range(4, 6), ph: rng.range(0, 6) });
  }

  // hr: fila del horizonte, C: altura de la cámara, camX: desplazamiento
  draw(scr, scene, t) {
    const { cols, rows } = scr;
    const lift = (z) => Math.floor(scene.hr + (scene.C - 70) / z);
    // estrellas (de noche): fijas en el cielo, algunas titilan
    if (this.night) {
      const top = lift(30) - 26;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const h = hash2(c, r - top);
          if (h > 0.035) continue;
          const tw = hash2(c * 7, r * 3);
          const on = Math.sin(t * (1 + tw * 3) + tw * 50) > -0.6;
          scr.put(c, r, h < 0.004 ? (on ? 42 : 43) : h < 0.012 ? 39 : on ? 46 : 32);
        }
      }
    }
    // sol / luna: casi fijos (z muy grande)
    const body = this.night ? MOON : SUN;
    const by = lift(24) - Math.round(scene.hr * 0.75);
    scr.stamp(body, Math.floor(cols * 0.78 - scene.camX / 24), by);

    // nubes: derivan despacio, más lento cuanto más lejos
    for (const c of this.clouds) {
      const x = c.x + t * c.v - scene.camX / c.z;
      // repartidas en la altura del cielo (más cielo en pantallas altas)
      const y = lift(c.z) - Math.round(scene.hr * (0.25 + c.y * 0.7));
      scr.stampWrap(c.s, scene.cx - this.W / 2 + (((x % this.W) + this.W) % this.W), y, this.W);
    }
  }

  // pájaros y cóndor van por delante de la cordillera
  drawBirds(scr, scene, t) {
    const P = scr.cols + 60;
    for (const f of this.birds) {
      const bx = (((f.x + t * f.v - scene.camX / f.z) % P) + P) % P - 30;
      const by = Math.floor(scene.hr + (scene.C - 64) / f.z - scene.hr * (0.3 + f.y * 0.35));
      for (let i = 0; i < f.n; i++) {
        // formación en V
        const dx = -Math.ceil(i / 2) * 2;
        const dy = Math.ceil(i / 2) * (i % 2 ? -1 : 1) * 0.5;
        const fr = Math.floor(t * 4 + i * 1.3 + f.ph) % 3;
        scr.stamp(BIRD, bx + dx, by + dy, fr === 2 ? 0 : fr);
      }
    }
    // volantines con su hilo bajando hacia la izquierda
    for (let i = 0; i < this.kites.length; i++) {
      // en pantallas angostas basta con uno
      if (scr.cols < 90 && i !== 1) continue;
      const k = this.kites[i];
      const kx = Math.floor(scene.cx + (k.x - scene.camX) / k.z + Math.sin(t * 0.7 + k.ph) * 1.5);
      const ky = Math.floor(scene.hr + (scene.C - 64) / k.z - scene.hr * k.y + Math.sin(t * 1.1 + k.ph) * 0.8);
      scr.stamp(KITE, kx - 1, ky, Math.floor(t * 3 + k.ph) % 2);
      for (let j = 1; j < 14; j++) if (j % 2 === 0) scr.put(kx - 1 - Math.floor(j * 0.8), ky + 2 + j, 46);
    }
    const P2 = scr.cols + 80;
    const cx = (((this.condor.x + t * this.condor.v - scene.camX / 7) % P2) + P2) % P2 - 40;
    const cy = Math.floor(scene.hr + (scene.C - 66) / 7 - scene.hr * 0.45) + Math.sin(t * 0.5) * 1.2;
    scr.stamp(CONDOR, cx, cy, Math.floor(t * 0.7) % 4 === 0 ? 1 : 0);
  }
}
