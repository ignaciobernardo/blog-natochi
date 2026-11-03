// Sprites de texto dibujados a mano.
//
// Se escriben con String.raw (las barras quedan tal cual) y se parsean a
// { w, h, data } con 0 = transparente. Reglas de opacidad:
//   'span'  (por defecto) en cada fila, lo que queda entre el primer y el último
//           carácter visible es opaco: el mueble tapa la textura de la pared
//           pero alrededor de su silueta se ve el fondo.
//   'solid' todo el rectángulo es opaco.
//   'none'  solo los caracteres visibles.
// Marcas: '$' = espacio opaco, '¤' = transparente forzado, 'ˋ' = acento grave
// (el ` no se puede escribir dentro de un template literal).

const OPAQUE = 36; // $
const HOLE = 164; // ¤
const GRAVE = 715; // ˋ

export function S(src, mode = 'span') {
  let lines = src.split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  lines = lines.map((l) => l.replace(/\s+$/, ''));
  const h = lines.length;
  const w = Math.max(1, ...lines.map((l) => l.length));
  const data = new Uint16Array(w * h);
  for (let r = 0; r < h; r++) {
    const l = lines[r];
    let first = -1;
    let last = -1;
    for (let c = 0; c < l.length; c++) {
      const k = l.charCodeAt(c);
      if (k !== 32 && k !== HOLE) {
        if (first < 0) first = c;
        last = c;
      }
    }
    for (let c = 0; c < w; c++) {
      const k = c < l.length ? l.charCodeAt(c) : 32;
      let v;
      if (k === OPAQUE) v = 32;
      else if (k === HOLE) v = 0;
      else if (k === GRAVE) v = 96;
      else if (k === 32) v = mode === 'solid' || (mode === 'span' && c > first && c < last) ? 32 : 0;
      else v = k;
      data[r * w + c] = v;
    }
  }
  return { w, h, data };
}

// Espejo horizontal: invierte las filas y cambia los glifos con dirección.
const PAIRS = [
  ['/', '\\'],
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
  ['<', '>'],
  ["'", '`'],
  ['d', 'b'],
  ['p', 'q'],
  ['┌', '┐'],
  ['└', '┘'],
  ['╱', '╲'],
  ['◤', '◥'],
  ['◣', '◢'],
  ['▌', '▐'],
  ['J', 'L'],
  ['ʃ', 'ʅ'],
];
const MIRROR = new Map();
for (const [a, b] of PAIRS) {
  MIRROR.set(a.charCodeAt(0), b.charCodeAt(0));
  MIRROR.set(b.charCodeAt(0), a.charCodeAt(0));
}

export function mirror(s) {
  const { w, h, data } = s;
  const out = new Uint16Array(w * h);
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const v = data[r * w + (w - 1 - c)];
      out[r * w + c] = MIRROR.get(v) || v;
    }
  }
  return { w, h, data: out };
}

// Pares [derecha, izquierda] para sprites que miran hacia un lado.
export const both = (s) => [s, mirror(s)];

// Sprite de una sola fila desde un string (todos opacos salvo '¤').
export const row = (str) => S(str, 'solid');
