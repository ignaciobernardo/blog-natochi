if (new URLSearchParams(location.search).has('perf')) window.__perf = { frames: [], cur: null };
import { start } from './core.js?v=809d14674b';
import { createSilhouette } from './silhouette.js?v=809d14674b';

start(createSilhouette(), document.getElementById('sheet'));
