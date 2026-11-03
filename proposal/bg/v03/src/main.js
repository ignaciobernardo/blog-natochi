// Cableado: tema, fuente, scroll, resize y el loop de animación.
import { Screen } from './grid.js';
import { Scene } from './scene.js';

const params = new URLSearchParams(location.search);

// tema: ?theme=dark|light (noche / día); si no, el del sistema
const wanted = params.get('theme');
const dark = wanted ? wanted === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = dark ? 'dark' : 'light';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const scroller = document.getElementById('scroller');
const content = document.getElementById('content');

const scr = new Screen(pre);
const scene = new Scene(scr, {
  title: (params.get('title') || 'NATOCHI').toUpperCase(),
  seed: Number(params.get('seed')) || 7,
  night: dark,
});
window.scene = scene;
// ?solo=wall,sky muestra solo esas capas (para revisar)
if (params.get('solo')) {
  const solo = params.get('solo').split(',');
  for (const k in scene.show) scene.show[k] = solo.includes(k);
}
window.space = scene; // las herramientas del proyecto usan este nombre

// largo del viaje en px de scroll
const scrollLength = () => (window.innerWidth < 768 ? 5200 : 8000);
scroller.style.height = scrollLength() + 'px';
const progress = () => window.scrollY / scrollLength();
scene.p = Math.min(1, progress());

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    scr.resize();
    scene.resize();
    scroller.style.height = scrollLength() + 'px';
  }, 120);
});

// mirar un poco a los costados con el mouse (parallax horizontal)
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
  // cuando el contenido ya tapa todo no hace falta dibujar
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

if (params.has('debug')) {
  const { default: debug } = await import('./debug.js');
  debug(scene, scr, progress);
}
