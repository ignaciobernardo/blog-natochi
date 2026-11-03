// Laboratorio: dibuja piezas sueltas para diseñarlas con la fuente real.
import { Layer } from './engine.js';
import * as S from './sprites.js';
import { stamp } from './iso.js';

const pre = document.getElementById('lab');
const W = 150;
const H = 46;
const L = new Layer(0, 0, W, H);
const show = (s, c, r, label) => {
  // ancla en (c, r)
  const t = { put: (cc, rr, ch, d) => L.put(cc, rr, ch, d) };
  const fake = { ...s };
  stamp(t, fake, 0, 0, 0, 0);
  // stamp dibuja con el ancla en el vértice (0,0): lo corremos
  for (let i = 0; i < (label || '').length; i++) L.put(c + i, r + 2, label.charCodeAt(i), -9);
};

// dibujo con desplazamiento
function at(s, c, r, label = '') {
  const t = { put: (cc, rr, ch, d) => L.put(cc + c, rr + r, ch, d) };
  stamp(t, s, 0, 0, 0, 0);
  for (let i = 0; i < label.length; i++) L.put(c + i - 2, r + 1, label.charCodeAt(i), -9);
}

const items = S.labItems();
let c = 4;
let r = 8;
for (const [name, s] of items) {
  const w = Math.max(s.w, name.length) + 3;
  if (c + w > W) {
    c = 4;
    r += 12;
  }
  at(s, c + s.ax, r, name);
  c += w;
}
void show;

const lines = [];
for (let y = 0; y < H; y++) lines.push(String.fromCharCode(...L.chars.subarray(y * W, (y + 1) * W)));
pre.textContent = lines.join('\n');
