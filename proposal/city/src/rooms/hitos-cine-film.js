// La película del Cine Rex: "NATOCHI en EL VIAJE", un corto mudo de unos
// 37 segundos que se repite. Cuenta regresiva, cartel de título, la ciudad
// de noche con el metro cruzando, un intertítulo, el andén (ella sube al
// tren de las 8, él llega corriendo y lo alcanza colgado del último carro),
// otro intertítulo, los dos en el vagón con la ciudad pasando y un corazón,
// y FIN con un iris que se cierra.
//
// Todo se dibuja en un Clip con origen en la esquina de la pantalla, en
// relación a su ancho W, su alto H y la fila del título `ty` (NATOCHI cae
// siempre en esa fila: en el cartel es el nombre de la película).
import { R, sprite, SP, hash2, arc, timeline, ease, lerp } from './hitos-kit.js';

export const FILM = [
  { id: 'cuenta', d: 3 },
  { id: 'titulo', d: 4.5 },
  { id: 'ciudad', d: 6 },
  { id: 'cartelA', d: 3.2 },
  { id: 'anden', d: 8.5 },
  { id: 'cartelB', d: 3.2 },
  { id: 'vagon', d: 6.5 },
  { id: 'fin', d: 4 },
];

export const filmAt = (t) => timeline(FILM, t);

// --- dibujos ------------------------------------------------------------------

const DIGITS = {
  3: sprite(R`
 .--.
  __)
    )
 '--'
`),
  2: sprite(R`
 .--.
    )
  .'
 (___
`),
  1: sprite(R`
  /|
   |
   |
  _|_
`),
};

const FIN = sprite(R`
 _____   _   _   _
|  ___| | | | \ | |
| |_    | | |  \| |
|  _|   | | | |\  |
|_|     |_| |_| \_|
`);

const LUNA = sprite(R`
  .-.
 (   ).
  '-'
`);

const NUBE = sprite(R`
   .--.
.-(    )-.
'--------'
`);

// el metro visto de costado, chico (para la ciudad)
const TREN_CHICO = sprite(R`
 ___________ ___________ __________
|[] [] [] []|[] [] [] []|[] [] [] [\
'-o--o--o-o-'-o--o--o-o-'-o--o--o-o-'
`);

// el carro del andén, grande: puertas que se abren
const CARRO = sprite(R`
 ___________________________________
|  ___   ___   _____   ___   ___    |
| |   | |   | |  |  | |   | |   |   |
| |___| |___| |  |  | |___| |___|   |
|_____________|__|__|_______________|
  '-(o)-(o)-'          '-(o)-(o)-'
`);
const CARRO_PUERTA = { x: 14, w: 5, y: 2, h: 2 };
const CARRO_CHICO = sprite(R`
 _______________________
|  ___   _____   ___    |
| |   | |  |  | |   |   |
| |___| |  |  | |___|   |
|_______|__|__|_________|
  '-(o)-(o)-'  '-(o)-(o)'
`);
const CHICO_PUERTA = { x: 8, w: 5, y: 2, h: 2 };

const ELLA = sprite(R`
  .=.
  (.)
 /)|\
 /___\
  | |
`);

const ELLA_SENTADA = sprite(R`
  .=.
  (.)
 /)|\
 /___\_
`);

const EL_CORRE = [
  sprite(R`
  _=_
  (.)
 --|\
   |\
  / /
`),
  sprite(R`
  _=_
  (.)
 \-|-
   |
  /|
`),
];
const EL_SIN_SOMBRERO = sprite(R`
  ._
  (.)
 --|--
   |\
  /  \
`);
const EL_COLGADO = sprite(R`
  (.)
 --|=
   |\
  ~ ~
`);
const EL_SENTADO = [
  sprite(R`
  ._
  (.)
  /|\
 _/_\
`),
  sprite(R`
  ._
  (.)
 *-|\
 _/_\
`),
];
const SOMBRERO = sprite(R`
_=_
`);

const CORAZON = sprite(R`
 _  _
( \/ )
 \  /
  \/
`);

// --- escenas ------------------------------------------------------------------

function marco(c, W, H) {
  c.hline(2, W - 3, 0, '_');
  c.hline(2, W - 3, H - 1, '_');
  c.vline(1, 1, H - 1, '|');
  c.vline(W - 2, 1, H - 1, '|');
  c.put(1, 0, '.');
  c.put(W - 2, 0, '.');
  if (W > 50) {
    c.hline(4, W - 5, 2, '-');
    c.hline(4, W - 5, H - 3, '-');
    c.put(3, 2, '*');
    c.put(W - 4, 2, '*');
    c.put(3, H - 3, '*');
    c.put(W - 4, H - 3, '*');
  }
}

// adornos a los dos lados del título (que la página dibuja encima)
function flores(c, ty, tx0, tx1, n, W) {
  const L = '~-~-~-~-~-~-~-~-~-~-<{';
  const Rr = '}>-~-~-~-~-~-~-~-~-~-~';
  const k = Math.max(0, Math.min(L.length, n, tx0 - 3));
  c.text(tx0 - k, ty, L.slice(L.length - k));
  const k2 = Math.max(0, Math.min(Rr.length, n, W - tx1 - 4));
  c.text(tx1 + 1, ty, Rr.slice(0, k2));
}

function cuenta(c, s) {
  const { W, ty, lt } = s;
  const cx = W / 2;
  const ry = Math.max(3, Math.floor(ty / 2) - 0.5);
  const cy = ty / 2 - 0.5;
  const rx = ry * 2.1;
  const sweep = lt % 1;
  // sector que ya pasó, sombreado
  for (let r = Math.floor(cy - ry); r <= Math.ceil(cy + ry); r++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (r + 0.5 - cy) / ry;
      if (dx * dx + dy * dy > 0.86) continue;
      let a = Math.atan2(dx, -dy) / (2 * Math.PI);
      if (a < 0) a += 1;
      if (a < sweep) c.put(x, r, '░');
    }
  }
  arc(c, cx, cy, rx, ry, 0, Math.PI * 2, { round: true });
  arc(c, cx, cy, rx + 3, ry + 1.5, 0, Math.PI * 2, { round: true });
  c.hline(Math.round(cx - rx - 5), Math.round(cx + rx + 4), Math.floor(cy), '-');
  c.vline(Math.floor(cx), Math.floor(cy - ry - 1), Math.floor(cy + ry + 1), '|');
  const a = sweep * Math.PI * 2;
  c.line(cx, cy, cx + Math.sin(a) * rx * 0.95, cy - Math.cos(a) * ry * 0.95);
  const d = DIGITS[3 - Math.min(2, Math.floor(lt))];
  c.blit(d, Math.round(cx - d.w / 2), Math.round(cy - d.h / 2));
}

function titulo(c, s) {
  const { W, H, ty, tx0, tx1, lt, t } = s;
  marco(c, W, H);
  const cx = W / 2;
  const top = Math.max(2, Math.round(ty * 0.35));
  const a = 'C I N E   R E X';
  const b = 'presenta';
  const n = Math.floor(lt * 16);
  c.text(Math.round(cx - a.length / 2), top, a.slice(0, n));
  if (lt > 1) c.text(Math.round(cx - b.length / 2), top + 2, b);
  flores(c, ty, tx0, tx1, Math.floor(Math.max(0, lt - 1.2) * 14), W);
  if (lt > 2) {
    const e = '«  EL VIAJE  »';
    c.text(Math.round(cx - e.length / 2), ty + 2, e);
  }
  if (lt > 2.6 && H - ty > 5) {
    const f = 'una película muda';
    c.text(Math.round(cx - f.length / 2), ty + 4, f);
  }
  // estrellitas
  for (let i = 0; i < 10; i++) {
    const x = 4 + Math.floor(hash2(i, 3) * (W - 8));
    const y = 3 + Math.floor(hash2(i, 7) * (H - 6));
    if (y === ty || y === top || y === top + 2 || y === ty + 2 || y === ty + 4) continue;
    const k = Math.floor(t * 3 + i) % 4;
    c.put(x, y, k === 0 ? '*' : k === 1 ? '+' : '.');
  }
}

function cartel(c, s, lines) {
  const { W, H, ty, tx0, tx1, lt } = s;
  marco(c, W, H);
  const cx = W / 2;
  const y1 = Math.max(2, ty - 6);
  const n = Math.floor(lt * 22);
  let used = 0;
  lines.forEach((l, i) => {
    const k = Math.max(0, Math.min(l.length, n - used));
    used += l.length;
    c.text(Math.round(cx - l.length / 2), y1 + i * 2, l.slice(0, k));
  });
  flores(c, ty, tx0, tx1, 6, W);
  if (H - ty > 3) c.text(Math.round(cx - 4), ty + 3, '. ~ * ~ .');
}

// edificios de la ciudad: alturas y ventanas con semilla
function skyline(c, s, base, seed, scroll = 0, lit = true) {
  const { W, t } = s;
  let x = -((scroll % 60) + 60) % 60 - 4;
  let i = Math.floor(scroll / 60) * 11;
  while (x < W) {
    const h = 3 + Math.floor(hash2(i, seed) * Math.max(3, base - 3));
    const w = 6 + Math.floor(hash2(i, seed + 1) * 7);
    const top = base - h;
    for (let r = top + 1; r <= base; r++) for (let k = x + 1; k < x + w; k++) c.put(k, r, SP);
    c.hline(x + 1, x + w - 1, top, '_');
    c.vline(x, top + 1, base, '|');
    c.vline(x + w, top + 1, base, '|');
    if (hash2(i, seed + 2) < 0.3) {
      c.put(x + 2, top - 1, '|');
      c.put(x + 2, top - 2, "'");
    }
    for (let r = top + 2; r < base; r += 2) {
      for (let k = x + 2; k < x + w - 1; k += 2) {
        const on = hash2(k * 3 + i, r + seed);
        if (!lit) {
          if (on < 0.3) c.put(k, r, '.');
        } else if (on < 0.55) c.put(k, r, (t * 0.7 + on * 9) % 5 < 4.6 ? ':' : '.');
      }
    }
    x += w + 1 + Math.floor(hash2(i, seed + 3) * 3);
    i++;
  }
}

function estrellas(c, s, rows) {
  const { W, t } = s;
  for (let i = 0; i < W / 4; i++) {
    const x = Math.floor(hash2(i, 31) * W);
    const y = Math.floor(hash2(i, 37) * rows);
    const k = (t * 2 + hash2(i, 41) * 7) % 7;
    c.put(x, y, k < 0.5 ? '*' : k < 4 ? '.' : "'");
  }
}

function ciudad(c, s) {
  const { W, H, ty, lt, t } = s;
  estrellas(c, s, ty - 3);
  c.blit(LUNA, Math.round(W * 0.78), 1);
  c.blit(NUBE, Math.round(W * 0.95 - lt * 3), 2);
  skyline(c, s, ty - 1, 5);
  // viaducto: tablero en la fila del título, reticulado y pilares
  c.hline(0, W - 1, ty, '=');
  for (let x = 0; x < W; x++) c.put(x, ty + 1, x % 2 ? '/' : '\\');
  for (let x = 4; x < W; x += 14) {
    c.vline(x, ty + 2, H - 2, '|');
    c.vline(x + 2, ty + 2, H - 2, '|');
    c.put(x + 1, ty + 2, '_');
  }
  // la calle con un auto y faroles
  c.hline(0, W - 1, H - 1, '_');
  for (let x = 9; x < W; x += 14) {
    c.vline(x, H - 4, H - 2, '|');
    c.put(x, H - 5, 'o');
  }
  const ax = Math.round(W - ((lt * 9) % (W + 10)));
  c.text(ax, H - 2, '.-=-.');
  c.text(ax, H - 1, "'o-o'");
  // el tren cruza
  const tx = Math.round(lerp(-TREN_CHICO.w, W + 2, ease(Math.min(1, Math.max(0, (lt - 0.4) / 5)))));
  c.blit(TREN_CHICO, tx, ty - 3);
  // pájaros
  for (let k = 0; k < 3; k++) {
    const bx = Math.round(((lt * 6 + k * 9) % (W + 10)) - 5);
    const by = 2 + k + Math.round(Math.sin(t * 3 + k));
    c.put(bx, by, (Math.floor(t * 5) + k) % 2 ? 'v' : '-');
  }
}

function anden(c, s) {
  const { W, H, ty, tx1, lt, t } = s;
  const gp = Math.min(H - 3, ty + 3);
  // techo del andén con su cercha
  c.hline(0, W - 1, 0, '_');
  for (let x = 0; x < W; x++) c.put(x, 1, x % 4 === 1 ? '/' : x % 4 === 3 ? '\\' : x % 4 === 2 ? '¯' : '_');
  // el andén
  c.hline(0, W - 1, gp, '_');
  for (let r = gp + 1; r < H; r++) for (let x = (r - gp) % 2 ? 3 : 0; x < W; x += 6) c.put(x, r, '|');
  if (gp + 1 < H) for (let x = 0; x < W; x++) if (x % 6) c.put(x, gp + 1, x % 2 ? '.' : ' ');

  // ella espera a la derecha del título; la puerta del carro para frente a ella
  const car = W < 50 ? CARRO_CHICO : CARRO;
  const door = W < 50 ? CHICO_PUERTA : CARRO_PUERTA;
  const gx = tx1 + 3;
  const stopX = gx - 1 - door.x;
  const tailAt = (u) => (u < 1.4 ? W + 5 : u < 3.2 ? lerp(W + 2, stopX, 1 - Math.pow(1 - (u - 1.4) / 1.8, 2)) : u < 4.6 ? stopX : stopX + 1.5 * Math.pow(u - 4.6, 2));
  const cxr = Math.round(tailAt(lt));
  const cy = gp - car.h + 1;
  c.blit(car, cxr, cy);
  if (lt > 3.3 && lt < 4.3) for (let r = 0; r < door.h; r++) c.text(cxr + door.x + 1, cy + door.y + r, '     ');
  // pilares, el reloj (marca las 8) y el letrero de la estación
  const p1 = Math.round(W * 0.06);
  for (const x of [p1, W - 3]) c.vline(x, 2, gp - 1, '|');
  const kx = gx;
  c.put(kx + 2, 2, '|');
  c.text(kx, 3, ' .-. ');
  const m = lt < 1.4 ? (Math.floor(lt * 3) % 2 ? '/' : '|') : '|';
  c.text(kx, 4, `( ${m} )`);
  c.text(kx, 5, " '-' ");
  const sx = p1 + 3;
  if (sx + 12 < gx) {
    c.put(sx + 1, 2, '|');
    c.put(sx + 10, 2, '|');
    c.text(sx, 3, '|LOS AROMOS|');
    c.text(sx, 4, ' ¯¯¯¯¯¯¯¯¯¯ ');
  }
  if (lt < 3.6) {
    c.blit(ELLA, gx, gp - ELLA.h + 1);
    // mira el reloj, golpea el pie
    if (lt < 1.4 && Math.floor(lt * 2) % 2) c.put(gx + 2, gp - ELLA.h, "'");
    if (Math.floor(t * 4) % 2) c.put(gx + 4, gp, '/');
  } else if (lt < 3.9) c.blit(ELLA, gx, gp - ELLA.h);

  // él llega corriendo desde la izquierda y persigue al tren
  if (lt > 4.3) {
    const run = (u) => -8 + 13 * (u - 4.3);
    let tc = 99;
    for (let u = 4.6; u < 8.5; u += 0.02) {
      if (run(u) >= tailAt(u) - 5) {
        tc = u;
        break;
      }
    }
    if (lt < tc) {
      const f = EL_CORRE[Math.floor(t * 8) % 2];
      const bx = Math.round(run(lt));
      c.blit(f, bx, gp - f.h + 1);
      // polvo de los zapatos
      c.put(bx - 1, gp, Math.floor(t * 8) % 2 ? '~' : '.');
      if (lt < 6) c.text(bx + 5, gp - 7, ' ¡espere! ');
    } else {
      const hx0 = cxr - 4;
      c.blit(EL_COLGADO, hx0, cy + 1);
      // el sombrero se le vuela y cae, dando vueltas, al andén
      const k = lt - tc;
      const hx = Math.round(hx0 - k * 5 + Math.sin(k * 5) * 1.5);
      const hy = Math.min(gp, Math.round(cy - 1 + k * 3));
      c.blit(SOMBRERO, Math.max(0, hx), hy);
      if (k < 1.2) c.text(hx0 + 6, cy - 2, ' ¡uf! ');
    }
  }
}

function vagon(c, s) {
  const { W, H, ty, tx0, tx1, lt, t } = s;
  const cx = W / 2;
  // ventanas con la ciudad pasando
  const w0 = 2;
  const w1 = Math.max(w0 + 3, ty - 3);
  const scroll = t * 22;
  const sub = { W, t, H };
  // la ciudad de afuera en un clip dentro de las ventanas
  const inner = { put: (x, y, ch) => y >= w0 && y <= w1 && c.put(x, y, ch), text: () => {}, hline: (a, b, y, ch) => { for (let x = a; x <= b; x++) inner.put(x, y, ch); }, vline: (x, a, b, ch) => { for (let y = a; y <= b; y++) inner.put(x, y, ch); } };
  estrellas(inner, sub, w1);
  inner.put(Math.round(W * 0.7 - lt * 0.6), w0 + 1, 'C');
  skyline(inner, sub, w1 + 2, 17, scroll, true);
  // marcos de las ventanas
  c.hline(0, W - 1, 0, '_');
  c.hline(0, W - 1, 1, '=');
  for (let x = 0; x < W; x += 12) {
    c.vline(x, w0, w1 + 1, '|');
    c.vline(x + 1, w0, w1 + 1, '|');
  }
  c.hline(0, W - 1, w1 + 1, '_');
  // las manillas colgando se mecen
  for (let x = 6; x < W; x += 12) {
    const k = Math.round(Math.sin(t * 2.2 + x * 0.3) * 1.2);
    c.put(x, 2, k < 0 ? '/' : k > 0 ? '\\' : '|');
    c.put(x + k, 3, 'o');
  }
  // el asiento
  const sy = ty + 1;
  c.hline(0, W - 1, w1 + 2, '¯');
  for (let r = w1 + 2; r < sy; r++) for (let x = 3; x < W; x += 8) c.put(x, r, ':');
  c.hline(0, W - 1, sy, '_');
  for (let r = sy + 1; r < H; r++) for (let x = 0; x < W; x += 10) c.put(x, r, '|');
  if (sy + 1 < H) c.hline(0, W - 1, H - 1, '_');
  // ella sentada a la izquierda del título; él llega y se sienta
  const lean = lt > 3.2 ? 1 : 0;
  const gx = tx0 - ELLA_SENTADA.w - 1 + lean;
  c.blit(ELLA_SENTADA, gx, sy - ELLA_SENTADA.h + 1);
  const bxSeat = tx1 + 2 - lean;
  if (lt < 1.6) {
    const f = EL_CORRE[Math.floor(t * 4) % 2];
    const bx = Math.round(lerp(W + 2, bxSeat, ease(lt / 1.6)));
    c.blit(f, bx, sy - f.h + 1);
  } else {
    const f = EL_SENTADO[lt > 2.2 && lt < 3.6 ? 1 : 0];
    c.blit(f, bxSeat, sy - f.h + 1);
  }
  // un corazón sube entre los dos
  if (lt > 3.4) {
    const u = (lt - 3.4) / 3.1;
    const hy = Math.round(lerp(sy - 6, -4, u));
    if (hy < ty - 4) c.blit(CORAZON, Math.round(cx - 3 + Math.sin(lt * 3)), hy);
  }
}

function fin(c, s) {
  const { W, H, ty, tx0, tx1, lt } = s;
  const cx = W / 2;
  const fy = Math.max(1, ty - FIN.h - 2);
  c.blit(FIN, Math.round(cx - FIN.w / 2), fy);
  flores(c, ty, tx0, tx1, 9, W);
  if (H - ty > 3) c.text(Math.round(cx - 4), ty + 3, '. ~ * ~ .');
  // el iris se cierra
  if (lt > 2) {
    const u = Math.min(1, (lt - 2) / 1.7);
    const ry = lerp(H * 0.9, 0, ease(u));
    const rx = ry * 2.2;
    const icy = fy + FIN.h / 2;
    for (let r = 0; r < H; r++) {
      for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - cx) / Math.max(rx, 0.01);
        const dy = (r + 0.5 - icy) / Math.max(ry, 0.01);
        if (dx * dx + dy * dy > 1) c.put(x, r, '▒');
      }
    }
    if (ry > 1) arc(c, cx, icy, rx, ry, 0, Math.PI * 2, { round: true });
  }
}

// rayas y motas de película vieja
function rayas(c, s) {
  const { W, H, t } = s;
  const f = Math.floor(t * 9);
  for (let k = 0; k < 2; k++) {
    if (hash2(f, k * 5 + 1) < 0.45) continue;
    const x = Math.floor(hash2(f, k * 5 + 2) * W);
    const y0 = Math.floor(hash2(f, k * 5 + 3) * H * 0.6);
    const len = 2 + Math.floor(hash2(f, k * 5 + 4) * H * 0.6);
    for (let y = y0; y < Math.min(H, y0 + len); y++) c.put(x, y, hash2(x, y + f) < 0.7 ? '|' : ':');
  }
  for (let k = 0; k < 3; k++) c.put(Math.floor(hash2(f, 40 + k) * W), Math.floor(hash2(f, 50 + k) * H), hash2(f, 60 + k) < 0.5 ? '.' : "'");
}

// Dibuja el cuadro de la película en el instante t. info: { W, H, ty, tx0, tx1 }
export function drawFilm(c, t, info) {
  const ph = filmAt(t);
  const s = { ...info, t, lt: ph.lt, u: ph.u };
  c.fill(SP);
  if (ph.id === 'cuenta') cuenta(c, s);
  else if (ph.id === 'titulo') titulo(c, s);
  else if (ph.id === 'ciudad') ciudad(c, s);
  else if (ph.id === 'cartelA') cartel(c, s, ['Ella siempre tomaba', 'el tren de las 8.']);
  else if (ph.id === 'anden') anden(c, s);
  else if (ph.id === 'cartelB') cartel(c, s, ['Él, por primera vez,', 'llegó a tiempo.']);
  else if (ph.id === 'vagon') vagon(c, s);
  else fin(c, s);
  if (ph.id !== 'fin' || ph.lt < 2) rayas(c, s);
  return ph;
}
