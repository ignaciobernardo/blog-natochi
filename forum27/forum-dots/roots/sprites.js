// Hojas y flores de Roots, dibujadas como paths en unidades: la base está en (0, 0) y la pieza crece hacia y negativo
// (alto 1). Sirven igual para el canvas (Path2D) y para el SVG exportado.
const f = (n) => Number(n.toFixed(3));

function leafShape(w, tip, lean, teeth) {
  // contorno aserrado: se muestrea la silueta lisa y cada tramo sale con un diente hacia afuera
  const N = teeth * 2, side = (sgn) => {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, y = -0.1 - (tip - 0.1) * u, half = w * Math.sin(Math.PI * Math.pow(u, 0.85)) * (1 - 0.15 * u);
      const tooth = i % 2 === 1 && i < N - 1 ? 0.045 + 0.02 * (1 - u) : 0;
      pts.push([sgn * (half + tooth) + lean * u, y - (tooth ? 0.02 : 0)]);
    }
    return pts;
  };
  const L = side(-1), R = side(1).reverse();
  const blade = 'M' + [...L, ...R].map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + 'Z';
  const shade = 'M' + [...L.slice(0, Math.ceil(N * 0.55)), [lean * 0.4, -tip * 0.5]].map(([x, y]) => `${f(x * 0.92)} ${f(y)}`).join(' L') + ' L0 -0.1Z';
  const veins = [`M0 -0.06 Q${f(lean * 0.4)} ${f(-tip * 0.55)} ${f(lean)} ${f(-tip + 0.05)}`];
  for (const [y, s] of [[0.22, -1], [0.3, 1], [0.42, -1], [0.5, 1], [0.62, -1], [0.7, 1]]) {
    const yy = -0.1 - (tip - 0.1) * y, x0 = lean * y;
    veins.push(`M${f(x0)} ${f(yy)} L${f(x0 + s * w * 0.7)} ${f(yy - 0.09)}`);
  }
  return { parts: [
    { d: 'M0 0 L0 -0.12', stroke: true },
    { d: blade, fill: 'leafLight' },
    { d: shade, fill: 'leafDark', noStroke: true },
    { d: veins.join(' '), stroke: true, thin: true },
    { d: blade, stroke: true },
  ], height: 1 };
}
export const LEAVES = [leafShape(0.3, 1, 0.02, 6), leafShape(0.34, 0.86, -0.03, 5)];

function petal(cx, cy, len, wid, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const P = (x, y) => `${f(cx + x * c - y * s)} ${f(cy + x * s + y * c)}`;
  return `M${P(0, 0)} C${P(-wid, len * 0.25)} ${P(-wid * 1.1, len * 0.9)} ${P(0, len)} C${P(wid * 1.1, len * 0.9)} ${P(wid, len * 0.25)} ${P(0, 0)}Z`;
}
function neck(h) { return { d: `M0 0 C0.03 ${f(-h * 0.4)} -0.03 ${f(-h * 0.7)} 0 ${f(-h)}`, stroke: true, wide: true, color: 'neck' }; }
function sepals(y, w) { return { d: `M0 ${f(y + 0.02)} C${f(-w)} ${f(y + 0.01)} ${f(-w * 0.9)} ${f(y - 0.08)} ${f(-w * 0.35)} ${f(y - 0.1)} L0 ${f(y - 0.03)} L${f(w * 0.35)} ${f(y - 0.1)} C${f(w * 0.9)} ${f(y - 0.08)} ${f(w)} ${f(y + 0.01)} 0 ${f(y + 0.02)}Z`, fill: 'sepal' }; }
function bud(h, w, open) {
  const top = -h, mid = -h * 0.55;
  const parts = [neck(h * 0.45), sepals(-h * 0.42, w * 0.9)];
  parts.push({ d: `M0 ${f(-h * 0.42)} C${f(-w)} ${f(mid)} ${f(-w * 0.6)} ${f(top + 0.04)} 0 ${f(top)} C${f(w * 0.6)} ${f(top + 0.04)} ${f(w)} ${f(mid)} 0 ${f(-h * 0.42)}Z`, fill: 'petal' });
  if (open) for (const s of [-1, 1]) parts.push({ d: petal(0, -h * 0.5, -h * 0.5, w * 0.55, s * 0.55), fill: 'petal' });
  parts.push({ d: `M0 ${f(-h * 0.45)} L0 ${f(top + 0.05)}`, stroke: true, thin: true });
  return { parts, height: h };
}
function bloom(n, notch, rot) {
  const cy = -0.58, parts = [neck(0.36), sepals(-0.34, 0.2)];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n;
    parts.push({ d: petal(0, cy, -0.42, notch ? 0.2 : 0.23, a + Math.PI), fill: 'petal' });
  }
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n + Math.PI, c = Math.cos(a), s = Math.sin(a);
    parts.push({ d: `M${f(-s * 0.06)} ${f(cy + c * 0.06)} L${f(-s * 0.3)} ${f(cy + c * 0.3)}`, stroke: true, thin: true });
  }
  parts.push({ d: `M0.105 ${f(cy)} A0.105 0.105 0 1 0 -0.105 ${f(cy)} A0.105 0.105 0 1 0 0.105 ${f(cy)}Z`, fill: 'heart' });
  for (let i = 0; i < 7; i++) { const a = (i * 2 * Math.PI) / 7, x = Math.cos(a) * 0.05, y = cy + Math.sin(a) * 0.05; parts.push({ d: `M${f(x - 0.012)} ${f(y)} A0.012 0.012 0 1 0 ${f(x + 0.012)} ${f(y)} A0.012 0.012 0 1 0 ${f(x - 0.012)} ${f(y)}Z`, fill: 'pollen', noStroke: true }); }
  return { parts, height: 1 };
}
// cuadros del capullo (en proporción al alto de la flor abierta) y tres finales
export const FLOWER_FRAMES = [bud(0.32, 0.09, false), bud(0.5, 0.13, false), bud(0.6, 0.16, true)];
export const FLOWER_ENDINGS = [bloom(5, false, 0), bloom(6, false, 0.3), bloom(5, true, 0.6)];
export const FLOWER_TINTS = ['#eead3c', '#d88b4c', '#efdbbf'];

export const PALETTE = { leafLight: '#2daa47', leafDark: '#198557', sepal: '#367e5f', neck: '#367e5f', heart: '#35240c', pollen: '#c4c035' };

const cache = new Map();
const path2d = (d) => { let p = cache.get(d); if (!p) { p = new Path2D(d); cache.set(d, p); } return p; };

// Dibuja una pieza ya trasladada/rotada: el eje "arriba" de la pieza apunta a dir. size = alto en px; outline en px.
export function drawSprite(ctx, sprite, size, outline, colors) {
  ctx.save();
  ctx.scale(size, size);
  const lw = outline / size;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const part of sprite.parts) {
    const p = path2d(part.d);
    if (part.fill) { ctx.fillStyle = colors[part.fill]; ctx.fill(p); if (!part.noStroke) { ctx.strokeStyle = colors.ink; ctx.lineWidth = lw; ctx.stroke(p); } }
    else if (part.stroke) {
      if (part.wide) { ctx.strokeStyle = colors.ink; ctx.lineWidth = lw * 3.4; ctx.stroke(p); ctx.strokeStyle = colors[part.color]; ctx.lineWidth = lw * 1.6; ctx.stroke(p); }
      else { ctx.strokeStyle = colors.ink; ctx.lineWidth = part.thin ? lw * 0.7 : lw; ctx.stroke(p); }
    }
  }
  ctx.restore();
}
export function spriteSVG(sprite, size, outline, colors) {
  const lw = outline / size, out = [];
  for (const part of sprite.parts) {
    if (part.fill) out.push(`<path d="${part.d}" fill="${colors[part.fill]}"${part.noStroke ? '' : ` stroke="${colors.ink}" stroke-width="${f(lw)}"`}/>`);
    else if (part.wide) out.push(`<path d="${part.d}" fill="none" stroke="${colors.ink}" stroke-width="${f(lw * 3.4)}"/><path d="${part.d}" fill="none" stroke="${colors[part.color]}" stroke-width="${f(lw * 1.6)}"/>`);
    else out.push(`<path d="${part.d}" fill="none" stroke="${colors.ink}" stroke-width="${f(part.thin ? lw * 0.7 : lw)}"/>`);
  }
  return `<g transform="scale(${f(size)})" stroke-linejoin="round" stroke-linecap="round">${out.join('')}</g>`;
}
