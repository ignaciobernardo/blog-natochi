if (new URLSearchParams(location.search).has('perf')) window.__perf = { frames: [], cur: null };
import { start } from './core.js?v=5d2cc0e008';
import { createSilhouette } from './silhouette.js?v=5d2cc0e008';

start(createSilhouette(), document.getElementById('sheet'));
