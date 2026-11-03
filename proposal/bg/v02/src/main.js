import { Renderer } from './engine.js';
import { AvenueScene } from './scene.js';

const params = new URLSearchParams(location.search);

// tema: ?theme=dark|light (noche / día), si no el del sistema
const wanted = params.get('theme');
const dark = wanted ? wanted === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = dark ? 'dark' : 'light';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const scroller = document.getElementById('scroller');

const rd = new Renderer(pre);
const scene = new AvenueScene(rd, {
  title: (params.get('title') || 'NATOCHI').toUpperCase(),
  seed: Number(params.get('seed')) || 7,
  dark,
});
window.scene = scene;
window.space = scene; // las herramientas del proyecto usan este nombre

// largo del paseo en px de scroll
const scrollLength = () => (window.innerWidth < 768 ? 5200 : 8000);
scroller.style.height = scrollLength() + 'px';
const progress = () => window.scrollY / scrollLength();
scene.p = Math.min(1, progress());

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    rd.resize();
    scene.resize();
    scroller.style.height = scrollLength() + 'px';
  }, 120);
});

const content = document.getElementById('content');
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
