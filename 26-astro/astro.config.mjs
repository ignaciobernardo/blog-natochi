import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://natochi.cv',
  base: '/26',
  outDir: '../26',
  build: { format: 'directory' },
});
