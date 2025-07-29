import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget/loader.ts'),
      name: 'VibeQAWidget',
      fileName: () => 'widget.js',
      formats: ['iife'], // Immediately Invoked Function Expression for browser
    },
    outDir: 'dist-widget',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        // Ensure all code is bundled into a single file
        inlineDynamicImports: true,
        // Don't split chunks
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});