import { start } from './core.js';
import { createSilhouette } from './silhouette.js';

start(createSilhouette(), document.getElementById('sheet'));
