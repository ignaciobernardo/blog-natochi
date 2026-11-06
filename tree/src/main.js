if (new URLSearchParams(location.search).has('perf')) window.__perf = { frames: [], cur: null };
import { start } from './core.js';
import { createSilhouette } from './silhouette.js';

start(createSilhouette(), document.getElementById('sheet'));
