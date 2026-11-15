import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Standalone marketing site. It shares nothing with the analyst workbench
// runtime except the product data and the design language.
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    target: 'es2019',
    sourcemap: false,
  },
});
