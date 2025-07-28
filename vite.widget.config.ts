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
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug'], // Remove debug logs in production
      },
      format: {
        comments: 'some', // Keep important comments like license
      },
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        // Ensure the widget is self-contained
        inlineDynamicImports: true,
        // Add banner with version and copyright
        banner: `/*! VibeQA Widget v1.0.0 | (c) ${new Date().getFullYear()} VibeQA | MIT License | https://vibeqa.com */`,
        // Optimize chunk size
        manualChunks: undefined,
      },
    },
    // Set chunk size warning limit (widget should be under 500KB)
    chunkSizeWarningLimit: 500,
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  // Optimize dependencies
  optimizeDeps: {
    exclude: [], // Widget should be self-contained
  },
});