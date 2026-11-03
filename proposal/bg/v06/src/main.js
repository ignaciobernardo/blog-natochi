import { Grid } from './grid.js';
import { Scene } from './scene.js';
import { theme } from './fx.js';

const params = new URLSearchParams(location.search);

// tema: ?theme=dark|light (noche / día); si no, el del sistema
const wanted = params.get('theme');
const dark = wanted ? wanted === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = dark ? 'dark' : 'light';
theme.dark = dark;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const scroller = document.getElementById('scroller');
const content = document.getElementById('content');

const g = new Grid(pre);
const scene = new Scene(g, {
  title: (params.get('title') || 'NATOCHI').toUpperCase(),
  seed: Number(params.get('seed')) || 6,
});
window.scene = scene;

// largo del recorrido: unos px de scroll por cada fila que baja la cámara
const scrollLength = () => Math.round(scene.travel * (window.innerWidth < 768 ? 34 : 44));
scroller.style.height = scrollLength() + 'px';
// la cámara llega al fondo justo cuando empieza la disolución hacia el hero
const dissolvePx = () => Math.max(8, Math.round(g.rows * 0.35)) * g.cellH;
const progress = () => window.scrollY / Math.max(1, scrollLength() - dissolvePx());
scene.p = Math.min(1, progress());
window.sceneScrollLength = scrollLength;

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    g.resize();
    scene.resize();
    scroller.style.height = scrollLength() + 'px';
  }, 120);
});

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  const top = content.getBoundingClientRect().top;
  // cuando el contenido ya tapa todo, no hace falta dibujar
  if (top > 0) {
    scene.frame({
      progress: progress(),
      dt,
      contentTop: top < window.innerHeight * 1.5 ? top : null,
      reduced: reducedMotion.matches,
    });
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

if (params.has('debug')) {
  const { default: debug } = await import('./debug.js');
  debug(scene, g, progress);
}
