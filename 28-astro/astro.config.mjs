import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://natochi.cv',
  base: '/28',
  outDir: '../28',
  build: { format: 'directory' },
});
