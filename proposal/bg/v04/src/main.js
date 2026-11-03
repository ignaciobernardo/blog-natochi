// Cableado: tema, fuente, scroll, resize y el loop.
import { Screen } from './grid.js';
import { StreetScene } from './scene.js';

const params = new URLSearchParams(location.search);

// tema: ?theme=dark|light (noche con neón / día gris de lluvia), si no el del sistema
const wanted = params.get('theme');
const dark = wanted ? wanted === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = dark ? 'dark' : 'light';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const scroller = document.getElementById('scroller');
const content = document.getElementById('content');

const scr = new Screen(pre);
const scene = new StreetScene(scr, {
  title: (params.get('title') || 'NATOCHI').toUpperCase(),
  seed: Number(params.get('seed')) || 4,
  dark,
});
window.scene = scene;
window.space = scene; // las herramientas comunes usan este nombre

// largo del viaje en px de scroll
const scrollLength = () => (window.innerWidth < 768 ? 5200 : 8000);
scroller.style.height = scrollLength() + 'px';
const progress = () => window.scrollY / scrollLength();
scene.p = Math.min(1, progress());

let resizeTimer = 0;
let lastW = window.innerWidth;
let lastH = window.innerHeight;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // en mobile la barra de direcciones cambia el alto: solo reconstruir si cambia de verdad
    if (Math.abs(window.innerHeight - lastH) < 120 && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    lastH = window.innerHeight;
    scr.resize();
    scene.resize();
    scroller.style.height = scrollLength() + 'px';
  }, 150);
});

// mirar a los costados con el mouse (parallax horizontal)
const look = [0, 0];
window.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  look[0] = (e.clientX / window.innerWidth) * 2 - 1;
  look[1] = (e.clientY / window.innerHeight) * 2 - 1;
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
      look,
      contentTop: top < window.innerHeight * 1.5 ? top : null,
      reduced: reducedMotion.matches,
    });
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
