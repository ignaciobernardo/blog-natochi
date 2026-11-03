// Edificios especiales de la capa cercana, dibujados a mano uno por uno:
// el cine, la iglesia, la obra con su grúa y el mercado. Aparecen en puntos
// fijos del recorrido para que el viaje tenga hitos.
//
// Cada uno devuelve su ancho y registra lo que se anima: las luces de la
// marquesina, la campana, el gancho de la grúa, los toldos del mercado.
import { sprite, SP } from './grid.js';

const R = String.raw;

const CINE = sprite(R`
             _______________
            |  ___________  |
            | |    * * *  | |
            | |     C     | |
            | |     I     | |
            | |     N     | |
            | |     E     | |
            | |           | |
            | |     R     | |
            | |     E     | |
            | |     X     | |
            | |    * * *  | |
            | |___________| |
            |   :   :   :   |
 ___________|_______________|____________
|  _________________________________    |
| |                                 |   |
| |                                 |   |
| |_________________________________|   |
|_______________________________________|
 \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_/
 |  ____    ____   _________   ____     |
 | |    |  |    | |BOLETERÍA| |    |    |
 | | /\ |  | () | |   [o]   | | ** |    |
 | |____|  |____| |_________| |____|    |
 |______________________________________|
`);

const IGLESIA = sprite(R`
                 +
                /|\
               / | \
              /__|__\
              |  _  |
              | ( ) |
              |_____|
              |  .  |
              |  *  |
              |     |
              |  .  |
        ______|_____|______
       /|                 |\
      / |   _    _    _   | \
     /  |  / \  / \  / \  |  \
    |   | |   ||   ||   | |   |
    |   | |___||___||___| |   |
    |   |                 |   |
    |   |      _____      |   |
    |   |     /     \     |   |
    |   |    |   |   |    |   |
    |___|____|___|___|____|___|
`);

const MERCADO = sprite(R`
       __________________________________________
    .-'  / / / / / / / / / / / / / / / / / / /  ª-.
  .'  / / / / / / / / / / / / / / / / / / / / /    ª.
 |__________________________________________________|
 |   M E R C A D O   C E N T R A L   ·   1 9 2 8    |
 |¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯|
 |  .---.   .---.   .---.   .---.   .---.   .---.  |
 | /     \ /     \ /     \ /     \ /     \ /     \ |
 | |     | |     | |     | |     | |     | |     | |
 | |_____| |_____| |_____| |_____| |_____| |_____| |
 |   ___     ___     ___     ___     ___     ___   |
 |  |ooo|   |)()|   |\_/|   |~~~|   |o o|   |[][]  |
 |__|___|___|___|___|___|___|___|___|___|___|____|_|
`);

// la obra: el edificio a medio hacer con andamio, la grúa y la cerca
function obra(g, x, B, ctx) {
  const w = 44;
  const floors = 7;
  const top = B - 5 - 4 * floors;
  // estructura: pilares y losas, casi todo transparente
  for (let k = 0; k <= floors; k++) {
    const y = B - 5 - 4 * k;
    if (k < floors - 1 || k === floors) g.hline(x + 2, x + 30, y, '_');
    if (k < floors) for (const px of [x + 2, x + 12, x + 22, x + 30]) for (let r = y - 3; r <= y; r++) if (r > top) g.put(px, r, '|');
  }
  // andamio con diagonales a la derecha
  for (let y = top + 2; y < B - 4; y++) {
    const k = (y - top) % 4;
    g.put(x + 32, y, '|');
    g.put(x + 36, y, '|');
    g.put(x + 33 + (k < 2 ? k : 3 - k) * 1, y, k < 2 ? '\\' : '/');
    if (k === 0) g.hline(x + 32, x + 36, y, '_');
  }
  // cerca con afiches
  g.hline(x, x + w - 1, B - 5, '_');
  for (let y = B - 4; y < B; y++) for (let c = x; c < x + w; c++) g.put(c, y, ' ');
  for (let c = x; c < x + w; c += 11) for (let y = B - 4; y < B; y++) g.put(c, y, '|');
  g.text(x + 2, B - 3, 'PELIGRO');
  g.text(x + 3, B - 2, '/!\\');
  g.text(x + 13, B - 3, ' OBRA EN ');
  g.text(x + 13, B - 2, 'MARCHA');
  g.text(x + 24, B - 3, ' ▲ CASCO');
  g.text(x + 35, B - 3, ' * *');
  g.hline(x, x + w - 1, B - 1, '_');
  // grúa torre
  const mx = x + 16;
  const jibY = top - 14;
  for (let y = jibY + 1; y < B - 5; y++) g.text(mx, y, y % 2 ? '|\\|' : '|/|');
  g.text(mx - 1, jibY - 3, ' /\\ ');
  g.text(mx - 1, jibY - 2, '/__\\');
  g.text(mx, jibY - 1, '|X|');
  // pluma hacia la derecha y contrapluma a la izquierda
  for (let c = mx - 12; c <= mx + 34; c++) {
    g.put(c, jibY, '_');
    g.put(c, jibY + 1, (c - mx) % 2 ? '/' : '\\');
    g.put(c, jibY + 2, '¯');
  }
  g.text(mx - 12, jibY + 3, '[####]');
  // tirantes
  g.line(mx + 1.5, jibY - 2.5, mx + 30, jibY + 0.5);
  g.line(mx + 1.5, jibY - 2.5, mx - 10, jibY + 0.5);
  g.text(mx + 5, jibY + 3, '[=]');
  ctx.signs.push({ type: 'gancho', x: mx + 24, y: jibY + 3, top, B });
  ctx.boxes.push({ x0: x + 2, x1: x + 30, top: top + 4, bottom: B - 5 });
  return w;
}

// Pone el hito en la tira; devuelve el ancho ocupado.
// Busca en el dibujo la fila y columna de un texto (para ubicar puertas).
function locate(s, text, from = 0) {
  for (let r = from; r < s.h; r++) {
    let row = '';
    for (let c = 0; c < s.w; c++) row += String.fromCharCode(s.data[r * s.w + c] || 32);
    const i = row.indexOf(text);
    if (i >= 0) return { r, c: i };
  }
  return null;
}

export function landmark(kind, g, x, B, ctx) {
  if (kind === 'obra') {
    const w = obra(g, x, B, ctx);
    // se entra por el portón de la cerca ("OBRA EN MARCHA")
    ctx.places.push({ kind: 'obra', name: 'OBRA', x0: x, x1: x + w - 1, top: B - 5 - 4 * 7 - 17, bottom: B - 1, door: { x0: x + 11.5, x1: x + 22.5, y0: B - 4, y1: B }, windows: [], seed: x });
    return w;
  }
  const s = kind === 'cine' ? CINE : kind === 'iglesia' ? IGLESIA : MERCADO;
  const y = B - s.h;
  g.blit(s, x, y);
  if (kind === 'cine') {
    ctx.signs.push({ type: 'marquee', x: x + 3, y: y + 16, w: 33, text: 'HOY · EL VIAJE · 20:30 · 22:45 · ' });
    ctx.signs.push({ type: 'cartel', x: x + 15, y: y + 2 });
    ctx.boxes.push({ x0: x, x1: x + s.w - 2, top: y + 14, bottom: B - 1 });
    ctx.boxes.push({ x0: x + 12, x1: x + 28, top: y, bottom: y + 14 });
    // se entra por la boletería
    const b = locate(s, '|BOLETER');
    const e = locate(s, '|', 0) && b ? b.c + 'BOLETERÍA'.length + 1 : 0;
    ctx.places.push({ kind: 'cine', name: 'CINE REX', x0: x, x1: x + s.w - 2, top: y, bottom: B - 1, door: { x0: x + b.c + 0.5, x1: x + e + 0.5, y0: y + b.r - 1 + 1, y1: y + b.r + 3 }, windows: [], seed: x });
  } else if (kind === 'iglesia') {
    ctx.signs.push({ type: 'campana', x: x + 16, y: y + 5 });
    ctx.boxes.push({ x0: x + 4, x1: x + 30, top: y + 11, bottom: B - 1 });
    ctx.boxes.push({ x0: x + 14, x1: x + 20, top: y + 3, bottom: y + 11 });
    // la puerta en arco del medio
    const a = locate(s, '/     \\');
    ctx.places.push({ kind: 'iglesia', name: 'PARROQUIA', x0: x + 4, x1: x + 30, top: y, bottom: B - 1, door: { x0: x + a.c + 0.5, x1: x + a.c + 7.5, y0: y + a.r + 0.5, y1: B }, windows: [], seed: x });
  } else {
    ctx.signs.push({ type: 'mercado', x: x + 3, y: y + 11 });
    ctx.boxes.push({ x0: x + 1, x1: x + s.w - 1, top: y + 3, bottom: B - 1 });
    // el arco central
    const a = locate(s, '.---.');
    const k = x + a.c + 24;
    ctx.places.push({ kind: 'mercado', name: 'MERCADO CENTRAL', x0: x + 1, x1: x + s.w - 1, top: y, bottom: B - 1, door: { x0: k + 0.5, x1: k + 6.5, y0: y + a.r + 1, y1: y + a.r + 4 }, windows: [], seed: x });
  }
  return s.w;
}

// dónde va cada hito (x de vía)
export const LANDMARKS = [
  { x: 112, kind: 'cine' },
  { x: 556, kind: 'iglesia' },
  { x: 950, kind: 'obra' },
  { x: 1420, kind: 'mercado' },
  { x: 1560, kind: 'iglesia' },
];

export { SP };
