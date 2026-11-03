// Laboratorio: muestra toda la biblioteca de sprites con su nombre.
// Se abre en lab.html (?filtro=texto para ver solo algunos).
import * as LIB from './lib.js';

const filter = new URLSearchParams(location.search).get('filtro') || '';
const W = Math.floor(window.innerWidth / 9) - 2;
const items = [];
const collect = (name, v) => {
  if (!v) return;
  if (v.data && v.w) items.push([name, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => collect(`${name}.${i}`, x));
  else if (typeof v === 'object') for (const k of Object.keys(v)) collect(`${name}.${k}`, v[k]);
};
for (const k of Object.keys(LIB)) collect(k, LIB[k]);

// Acomoda los sprites en filas tipo texto corrido
const rows = [];
let line = [];
let used = 0;
const flushLine = () => {
  if (!line.length) return;
  const h = Math.max(...line.map(([, s]) => s.h)) + 2;
  const grid = Array.from({ length: h }, () => new Array(W).fill(' '));
  let x = 0;
  for (const [name, s] of line) {
    const label = name.split('.').slice(1).join('.') || name;
    for (let i = 0; i < label.length && x + i < W; i++) grid[0][x + i] = label[i];
    for (let r = 0; r < s.h; r++)
      for (let c = 0; c < s.w; c++) {
        const v = s.data[r * s.w + c];
        if (x + c < W) grid[1 + (h - 2 - s.h) + r][x + c] = v ? String.fromCharCode(v) : ' ';
      }
    x += Math.max(s.w, label.length) + 3;
  }
  rows.push(grid.map((r) => r.join('')).join('\n'));
  line = [];
  used = 0;
};
let lastGroup = '';
for (const it of items) {
  const g = it[0].split('.')[0];
  if (filter && !it[0].includes(filter)) continue;
  if (g !== lastGroup) { flushLine(); rows.push('== ' + g.toUpperCase()); lastGroup = g; }
  const w = Math.max(it[1].w, (it[0].split('.').slice(1).join('.') || it[0]).length) + 3;
  if (used + w > W) flushLine();
  line.push(it);
  used += w;
}
flushLine();
document.getElementById('lab').textContent = rows.join('\n\n');
