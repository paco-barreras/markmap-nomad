import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'MarkmapNomad',
      fileName: (format) => (format === 'iife' ? 'index.iife.js' : 'index.js'),
      formats: ['es', 'iife'],
      cssFileName: 'style',
    },
  },
});
