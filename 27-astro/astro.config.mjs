import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://natochi.cv',
  base: '/27',
  outDir: '../27',
  build: { format: 'directory' },
});
