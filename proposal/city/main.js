// The ASCII city from natochi-city v11 as a background: the page scroll moves the train,
// with no title and no doors to open, so it stays behind the proposal.
import { Screen } from './src/grid.js';
import { CityScene } from './src/scene.js';

const params = new URLSearchParams(location.search);
const wanted = params.get('theme');
const isDark = () => (wanted ? wanted === 'dark' : true);
document.documentElement.dataset.theme = isDark() ? 'dark' : 'light';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

await Promise.all([document.fonts.load('18px jgs9'), document.fonts.load('14px jgs7')]);

const pre = document.getElementById('city');
const rd = new Screen(pre);
const scene = new CityScene(rd, { title: '', seed: Number(params.get('seed')) || 7, night: isDark() });
scene.show.title = false;

const progress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
};

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { rd.resize(); scene.resize(); }, 120);
});

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  scene.frame({ progress: progress(), dt, contentTop: null, reduced: reduced.matches });
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
