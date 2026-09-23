import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://natochi.cv',
  base: '/1',
  outDir: '../1',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
