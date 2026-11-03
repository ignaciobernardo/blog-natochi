// Lugares propios: cosas importantes para natochi metidas en la ciudad.
//
// Cada uno es una entrada de PERSONAL con
//   id      nombre corto (y el kind del lugar, para su interior en rooms/personal.js)
//   x       dónde va en el recorrido (unidades de vía; ver world.js)
//   w       ancho que ocupa en la capa cercana
//   draw    lo dibuja en la tira; puede registrar lugares (para entrar) y
//           animaciones { type: 'anim', x, y, w, draw(rd, x, y, t, night) }
// La laguna no es un lote: reemplaza al parque (world.js PARK).
//
// Para agregar otro lugar: una entrada más acá y, si se puede entrar, su
// interior en rooms/personal.js.
import { SP, sprite, frames } from './grid.js';
import { hash2 } from './rng.js';

const R = String.raw;

// --- ayudas -------------------------------------------------------------------

// Copa de árbol orgánica: contorno irregular con "( )" a los lados, "~ - ." arriba,
// "' -" abajo, y adentro puntos y comas (más densos si dense).
export function canopy(g, cx, cy, rx, ry, seed, dense = 0.1) {
  const lump = (th) => 1 + 0.16 * Math.sin(th * 3 + seed) + 0.1 * Math.sin(th * 7 + seed * 2.3) + 0.06 * Math.sin(th * 11 + seed);
  const inside = (c, r) => {
    const dx = (c + 0.5 - cx) / rx;
    const dy = (r + 0.5 - cy) / ry;
    return Math.hypot(dx, dy) < lump(Math.atan2(dy, dx));
  };
  const x0 = Math.floor(cx - rx * 1.4);
  const x1 = Math.ceil(cx + rx * 1.4);
  const y0 = Math.floor(cy - ry * 1.4);
  const y1 = Math.ceil(cy + ry * 1.4);
  for (let r = y0; r <= y1; r++) {
    for (let c = x0; c <= x1; c++) {
      if (!inside(c, r)) continue;
      const up = inside(c, r - 1);
      const dn = inside(c, r + 1);
      const lf = inside(c - 1, r);
      const rt = inside(c + 1, r);
      const h = hash2(c * 7 + seed, r * 13);
      let ch;
      if (!up) ch = !lf ? '.' : !rt ? '.' : h < 0.45 ? '~' : h < 0.8 ? '-' : '.';
      else if (!dn) ch = !lf ? "'" : !rt ? "'" : h < 0.5 ? '-' : h < 0.75 ? '.' : "'";
      else if (!lf) ch = '(';
      else if (!rt) ch = ')';
      else ch = h < dense * 0.45 ? ':' : h < dense * 0.8 ? '.' : h < dense ? "'" : h < dense * 1.12 ? ',' : SP;
      g.put(c, r, ch);
    }
  }
}

// tronco con dos ramas
function trunk(g, x, yTop, yBot) {
  for (let y = yTop; y <= yBot; y++) g.text(x, y, '||');
  g.put(x - 1, yTop, '\\');
  g.put(x + 2, yTop, '/');
}

// --- PLATANUS · SORIA 667 -------------------------------------------------------------
// La casa blanca detrás del portón gris: muro con el 667 (con la enredadera
// que hay que podar), portón de malla con púas y su puerta, primer piso con
// buganvilia, segundo piso con la losa sobre pilares delgados y árboles en la
// terraza; detrás, la torre de ladrillo y vidrio, y los cables.
const ARBOL_IZQ = sprite(R`
          .-~~~~-.
     .-~~'   .    '~-.
   .'   .  '    .   . '.
  (  '    .   '     '   )
 (   .  '    .    .   .  )
  ( '    .   '  .    '  )
   '.   '  .    '  .  .'
     '-._  '  .  _.-'
         '-.  .-'
           |  |
           |  |
`);

const ARBOL_DER = sprite(R`
         .-~~-.  .-~~-.
      .-'  :   '-'  .  '-.
    .'  .    :   .    :   '.
   (  :   .    '   :    .   )
  (  .  :   '  .  :   '   :  )
 (  :  '   .  :   .  '  .   : )
  (   .  :   '  .   :   .  ' )
 (  '  .   :   .  '   .  :  )
  '.  :  '   .  :   '  .  .'
    '-._  .  :  '  .  _.-'
        '--.  ..  .--'
            |  |
            |  |
`);

const ARBOLITO = sprite(R`
   .-~~-.
 .(  .  :).
(  :  .  ' )
 '-.  :  .-'
    '||'
`);

const PISO2 = sprite(R`
 __________________________________
|__________________________________|
|  .--.  |                    |  |
| |[__]| |                    |  |
|  '--'  |                    |  |
|________|____________________|__|
`);

const PISO1 = sprite(R`
 ____________________________________________
|                       ;:;:;:;:;:;:;:;:;:;:;|
|                                            |
|____________________________________________|
`);

const BUGANVILIA = sprite(R`
    *o*,
  *o* *'o*,
 o*,*o * *o*
*'o* ,*o*' *o
 '*o*,*o' *'
   '*,o*'
     '*'
`, 'line');

const MURO_667 = sprite(R`
;,(;';,(;,';.
(;',;,(;',;,;'.______
;(';,;(;,',;'       |
(;,;(',;,'          |
;',(;,;'      667   |
(;,;',(             |
;,(;'               |
(;,'                |
;_'_________________|
`);

function platanus(g, x, B, ctx) {
  const W = 66;
  // torre de atrás: franjas de ladrillo entre paños de vidrio, losa cada 3 filas
  const tx0 = x + 8;
  const tTop = B - 44;
  const mods = 4;
  const tx1 = tx0 + mods * 6;
  g.hline(tx0 + 1, tx1 - 1, tTop, '_');
  for (let r = tTop + 1; r <= B - 15; r++) {
    let row = '|';
    for (let k = 0; k < mods; k++) row += ((r - tTop) % 3 === 0 ? '___' : '   ') + '|:|';
    g.text(tx0, r, row.slice(0, tx1 - tx0) + '|');
  }
  // árbol grande de la derecha (detrás del portón)
  g.blit(ARBOL_DER, x + 44, B - 29);
  // segundo piso con su terraza y árboles bajo la losa
  g.blit(PISO2, x + 22, B - 21);
  g.blit(ARBOLITO, x + 33, B - 19);
  g.blit(ARBOLITO, x + 43, B - 19);
  // primer piso
  g.blit(PISO1, x + 16, B - 13);
  g.blit(BUGANVILIA, x + 14, B - 16);
  // planta baja detrás del portón: muros blancos y la entrada en sombra
  g.rect(x + 22, B - 8, W - 22, 8, SP);
  for (let r = B - 6; r <= B - 1; r++) for (let c = x + 41; c <= x + 47; c++) g.put(c, r, '░');
  g.vline(x + 40, B - 7, B - 1, '|');
  g.vline(x + 48, B - 7, B - 1, '|');
  g.hline(x + 41, x + 47, B - 7, '_');
  // árbol de la izquierda sobre el muro
  g.blit(ARBOL_IZQ, x - 3, B - 19);
  // muro con el 667 y la enredadera
  g.blit(MURO_667, x, B - 9);

  // portón gris de malla con púas y su puerta peatonal
  const gx0 = x + 21;
  const gx1 = x + W - 1;
  for (let c = gx0; c <= gx1; c++) g.put(c, B - 9, (c - gx0) % 2 ? '\\' : '/');
  g.hline(gx0, gx1, B - 8, '_');
  for (let r = B - 7; r <= B - 2; r++) {
    for (let c = gx0 + 1; c < gx1; c++) {
      if ((c - gx0) % 2 === 0) g.put(c, r, '|');
      else if ((B - r) % 2 === 0) g.put(c, r, '_');
    }
  }
  g.hline(gx0, gx1, B - 1, '_');
  for (const px of [gx0, gx1]) g.vline(px, B - 8, B - 1, '‖');
  const d0 = x + 42;
  const d1 = x + 51;
  g.vline(d0, B - 8, B - 1, '‖');
  g.vline(d1, B - 8, B - 1, '‖');
  g.put(d1 - 1, B - 4, 'o');

  // cables cruzando el cielo
  g.line(x - 14, B - 50, x + W + 12, B - 42, '_');
  g.line(x - 14, B - 47, x + W + 12, B - 40);

  ctx.places.push({
    kind: 'platanus',
    personal: true,
    name: 'PLATANUS',
    street: 'SORIA',
    number: 667,
    x0: x,
    x1: x + W - 1,
    top: B - 44,
    bottom: B - 1,
    door: { x0: d0 + 0.5, x1: d1 + 0.5, y0: B - 8, y1: B },
    windows: [],
    seed: 667,
  });
  ctx.boxes.push({ x0: x + 21, x1: x + W - 1, top: B - 13, bottom: B - 1 });
  return W + 4;
}

// --- INDIES · "is indies dead?" -------------------------------------------------
// Un edificio bajo con un cartel grande en la azotea: el gato de indies con la
// lengua afuera y la pregunta, con un cursor que parpadea.
const GATO = frames(R`
   /\           /\
  /::\_.-----._/::\
 |    |  | |  |    |
=|   .-.     .-.   |=
 |        v        |
  \    \_____/    /
   '._   (U)   _.'
      '-------'
--
   /\           /\
  /::\_.-----._/::\
 |    |  | |  |    |
=|   .-.     .-.   |=
 |        v        |
  \    \_____/    /
   '._   (u)   _.'
      '-------'
--
   /\           /\
  /::\_.-----._/::\
 |    |  | |  |    |
=|   ^ ^     ^ ^   |=
 |        v        |
  \    \_____/    /
   '._   (U)   _.'
      '-------'
`);

function indies(g, x, B, ctx) {
  const W = 50;
  // edificio bajo de tres pisos con ventanas y un local
  const top = B - 17;
  g.rect(x, top + 1, W, B - top - 1, SP);
  g.hline(x, x + W - 1, top, '_');
  g.vline(x, top + 1, B - 1, '|');
  g.vline(x + W - 1, top + 1, B - 1, '|');
  for (let k = 0; k < 3; k++) {
    const r0 = top + 2 + k * 4;
    for (let wx = x + 3; wx + 6 < x + W - 2; wx += 9) {
      g.hline(wx + 1, wx + 5, r0, '_');
      g.put(wx, r0 + 1, '|');
      g.put(wx + 6, r0 + 1, '|');
      g.put(wx, r0 + 2, '|');
      g.put(wx + 6, r0 + 2, '|');
      g.hline(wx + 1, wx + 5, r0 + 2, '_');
      ctx.windows.push({ x: wx + 1, y: r0 + 1, w: 5, kind: 'casa', seed: Math.floor(hash2(wx, r0) * 1e9), floor: 3 - k, bay: (wx - x) / 9 });
    }
  }
  g.hline(x + 1, x + W - 2, B - 1, '_');
  g.text(x + 4, B - 3, '|¯¯¯|');
  g.text(x + 4, B - 2, '|  o|');
  // el cartel sobre patas de reticulado
  const bw = W;
  const bh = 13;
  const by = top - 6 - bh;
  g.rect(x, by + 1, bw, bh - 1, SP);
  g.hline(x, x + bw - 1, by, '_');
  g.vline(x, by + 1, by + bh - 1, '|');
  g.vline(x + bw - 1, by + 1, by + bh - 1, '|');
  g.hline(x + 1, x + bw - 2, by + bh - 1, '_');
  for (const px of [x + 6, x + bw - 9]) for (let y = by + bh; y < top; y++) g.text(px, y, (y - by) % 2 ? '|\\|' : '|/|');
  g.text(x + 27, by + 5, 'is indies');
  g.text(x + 27, by + 6, 'dead?');
  g.text(x + 27, by + 9, 'indies.la');
  ctx.signs.push({
    type: 'anim',
    x,
    y: by,
    w: bw,
    draw(rd, sx, sy, t, night) {
      const k = Math.floor(t * 2.2) % 9;
      const f = GATO[k === 4 ? 2 : k % 2 ? 1 : 0];
      rd.blit(f, sx + 3, sy + 2);
      // cursor que parpadea después de la pregunta
      rd.put(sx + 32, sy + 6, Math.floor(t * 2) % 2 ? '_' : ' ');
      if (night) {
        // focos encendidos abajo del cartel
        for (let c = 2; c < bw - 2; c += 4) rd.put(sx + c, sy + bh, (c / 4 + Math.floor(t * 3)) % 2 ? '*' : '.');
      }
    },
  });
  ctx.boxes.push({ x0: x, x1: x + W - 1, top, bottom: B - 1 });
  return W + 3;
}

// --- LA LAGUNA (Los Ángeles) ---------------------------------------------------
// Reemplaza al parque: el puente rojo de arco de piedra con su baranda de
// rombos (y su reflejo), la isla con árboles, botes a pedal en el muelle, patos,
// y en la orilla una banca donde alguien lee.
const PUENTE = sprite(R`
 ____________________________________
||/\/\/|/\/\/|/\/\/|/\/\/|/\/\/|/\/\||
||\/\/\|\/\/\|\/\/\|\/\/\|\/\/\|\/\/||
 ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
  ::.:.::._.-~¯¯¯¯¯¯¯¯¯¯¯¯¯¯~-._.::.:.:
  :.::.-'                        '-.::.
  :.-'                              '-.
 _/                                    \_
`);
// el reflejo del arco en el agua, punteado
const PUENTE_REFLEJO = sprite(R`
   '.                                  .'
     '.  .                        .  .'
        '  .  .  .  .  .  .  .  .  '
`, 'line');

const ISLA = sprite(R`
            .-~~~-.      .-~~~~-.
        .-~'  .   '~-.-~'  :    '~-.
      .'   :    '    .   .    '    '.
     (  .    '   :    '    :   .     )
    (   '  .   :   .   '  .    '  .   )
     '.  :   '   .   :   '   .   :  .'
       '-._   .   _.-'-._  '  _.-'
           '-||-'        '-||-'
  ,'.,'  ,.',' || ,'. ,',. ||,'., ,'.,
 (_______________________________________)
`);

const MUELLE = sprite(R`
   _o_    _o_    _o_
  (___)  (___)  (___)
 _|___|__|___|__|___|_
`);

const ARBOL_ORILLA = sprite(R`
       .-~~~~-.
   .-~'  .    '~-.
  (   '    .   '  )
 (  .   '    .   . )
  '.   .   '   . .'
    '-._  '  _.-'
        '|  |'
         |  |
         |  |
         |  |
`);

const CASITA = sprite(R`
  /\
 /__\
 |[]|
`);

const BOTE = frames(R`
  _o__o_
 (______)
--
  _o__o_
 (_____ )
`);
const LECTOR = frames(R`
   o
  /[]\
 |____|
 /    \
--
   o
  /[]>
 |____|
 /    \
`);
const PATO = ['<o)_', '<o)~'];

export function laguna(ctx, a, b, B) {
  const { g } = ctx;
  const W = b - a;
  const water0 = B - 7; // primera fila de agua
  // orilla del fondo: casitas, árboles y el edificio alto del lado derecho
  for (let c = a; c < b; c++) g.put(c, water0 - 1, '_');
  for (let k = 0; k * 11 < W - 8; k++) {
    const cx = a + 2 + k * 11;
    if (cx > a + 34 && cx < a + 76) continue; // ahí va la isla
    g.blit(CASITA, cx + (k % 2) * 3, water0 - 4);
  }
  // agua: opaca, con pocas ondas
  const waves = [];
  for (let r = water0; r < B; r++) {
    for (let c = a; c < b; c++) {
      const h = hash2(c * 3, r * 11);
      g.put(c, r, h < 0.035 ? '~' : h < 0.06 ? '-' : SP);
      if (h > 0.985) waves.push({ x: c, y: r });
    }
  }
  // la isla
  const i0 = a + 34;
  g.blit(ISLA, i0, water0 - 9);
  const i1 = i0 + ISLA.w;
  // el puente de la orilla a la isla, y su reflejo
  const p0 = a + 1;
  g.blit(PUENTE, p0, water0 - 4);
  g.blit(PUENTE_REFLEJO, p0, water0 + 4);
  const p1 = p0 + PUENTE.w;
  // muelle con botes a pedal y la orilla de pasto con la banca
  const m0 = i1 + 8;
  g.blit(MUELLE, m0, B - MUELLE.h);
  const bank = b - 26;
  g.rect(bank, water0 - 1, b - bank, B - water0 + 1, SP);
  for (let r = water0; r < B; r++) for (let c = bank + 1; c < b; c++) if (hash2(c, r * 3) < 0.12) g.put(c, r, hash2(c, r) < 0.5 ? ',' : "'");
  g.vline(bank, water0, B - 1, '(');
  g.blit(ARBOL_ORILLA, bank + 3, B - ARBOL_ORILLA.h);
  // farol de la orilla
  g.text(bank + 21, water0 - 3, '(_)');
  g.vline(bank + 22, water0 - 2, B - 1, '|');
  ctx.lamps.push({ x: bank + 22, y: water0 - 2 });
  // juncos
  for (const c of [bank + 1, a + 1]) g.text(c, B - 2, '\\|/');

  // lo que se mueve: ondas, botes, patos, la que lee y hojas que caen
  const lx = bank + 13;
  ctx.signs.push({
    type: 'anim',
    x: a,
    y: water0 - 12,
    w: W,
    draw(rd, sx, sy, t, night) {
      const ox = sx - a;
      const oy = sy - (water0 - 12);
      for (const w of waves) {
        const k = Math.floor(t * 1.5 + w.x * 0.37) % 3;
        rd.put(w.x + ox, w.y + oy, k === 0 ? '~' : k === 1 ? '-' : ' ');
      }
      // dos botes que van y vienen entre la isla y el muelle
      const span = Math.max(4, m0 - i1 - 10);
      for (let i = 0; i < 2; i++) {
        const u = (Math.sin(t * 0.07 + i * 2.4) + 1) / 2;
        const bx = Math.round(i1 + 1 + u * span);
        rd.blit(BOTE[Math.floor(t * 3 + i) % 2], bx + ox, B - 3 - i * 2 + oy);
      }
      // patos
      for (let i = 0; i < 3; i++) {
        const u = ((t * 0.9 + i * 13) % (W - 30)) / (W - 30);
        const px = Math.round(bank - 4 - u * (bank - p1 - 6));
        rd.text(px + ox, B - 5 + (i % 2) * 2 + oy, PATO[Math.floor(t * 2 + i) % 2]);
      }
      // la que lee: da vuelta la página cada tanto
      rd.blit(LECTOR[t % 9 < 0.8 ? 1 : 0], lx + ox, B - 4 + oy);
      // una hoja que cae del árbol de la orilla
      const fp = (t * 0.3) % 1;
      rd.put(bank + 9 + Math.round(Math.sin(t * 2) * 2) + ox, water0 - 3 + Math.floor(fp * 8) + oy, fp < 0.5 ? ',' : "'");
      if (night) {
        // luces del puente y su reflejo
        for (let c = p0 + 1; c < p1; c += 6) {
          rd.put(c + ox, water0 - 5 + oy, '*');
          if ((c + Math.floor(t * 2)) % 2) rd.put(c + ox, B - 1 + oy, '.');
        }
      }
    },
  });
  ctx.places.push({
    kind: 'laguna',
    personal: true,
    name: 'LAGUNA',
    street: 'LOS ÁNGELES',
    x0: a,
    x1: b - 1,
    top: water0 - 20,
    bottom: B - 1,
    door: { x0: lx - 0.5, x1: lx + 6.5, y0: B - 5, y1: B },
    windows: [],
    seed: 16,
  });
}

// --- el registro ---------------------------------------------------------------

export const PERSONAL = [
  { id: 'platanus', x: 196, w: 70, draw: platanus },
  { id: 'indies', x: 872, w: 53, draw: indies },
];
