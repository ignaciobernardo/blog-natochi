// Cableado: tema, scroll, resize y el loop de animación.
import { Scene } from './scene.js';

const params = new URLSearchParams(location.search);

// tema: ?theme=dark|light (noche / día); si no, el del sistema
const wanted = params.get('theme');
const scheme = matchMedia('(prefers-color-scheme: dark)');
const isDark = () => (wanted ? wanted === 'dark' : scheme.matches);
document.documentElement.dataset.theme = isDark() ? 'dark' : 'light';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const scroller = document.getElementById('scroller');
const content = document.getElementById('content');

const scene = new Scene(pre, {
  title: (params.get('title') || 'NATOCHI').toUpperCase(),
  seed: Number(params.get('seed')) || 7,
  dark: isDark(),
});
window.scene = scene;
window.space = scene; // las herramientas del proyecto usan este nombre

// largo del viaje en px de scroll
const scrollLength = () => (window.innerWidth < 768 ? 5200 : 8000);
scroller.style.height = scrollLength() + 'px';
const progress = () => window.scrollY / scrollLength();

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    scroller.style.height = scrollLength() + 'px';
    scene.resize();
  }, 150);
});

// si cambia el tema del sistema (y no se fijó por URL), la ciudad pasa a noche o a día
scheme.addEventListener('change', () => {
  if (wanted) return;
  document.documentElement.dataset.theme = isDark() ? 'dark' : 'light';
  scene.setDark(isDark());
});

let last = performance.now();
function loop(now) {
  const dt = Math.max(0, (now - last) / 1000);
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
  debug(scene);
}
