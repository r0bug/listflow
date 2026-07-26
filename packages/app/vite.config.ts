import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../extension/app',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3005',
      '/uploads': 'http://localhost:3005',
      '/public-images': 'http://localhost:3005',
    },
  },
});
