if (new URLSearchParams(location.search).has('perf')) window.__perf = { frames: [], cur: null };
import { start } from './core.js?v=f6a70213a6';
import { createSilhouette } from './silhouette.js?v=f6a70213a6';

start(createSilhouette(), document.getElementById('sheet'));
