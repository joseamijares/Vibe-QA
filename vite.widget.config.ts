import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget/loader.ts'),
      name: 'VibeQA',
      fileName: 'widget',
      formats: ['iife'], // Immediately Invoked Function Expression for browsers
    },
    outDir: 'dist-widget',
    emptyOutDir: true,
    minify: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Ensure the widget is self-contained
        inlineDynamicImports: true,
        // Add banner with version and copyright
        banner: `/*! VibeQA Widget v1.0.0 | (c) ${new Date().getFullYear()} VibeQA | MIT License */`,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});