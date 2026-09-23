import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://natochi.cv',
  base: '/30',
  outDir: '../30',
  build: { format: 'directory' },
});
