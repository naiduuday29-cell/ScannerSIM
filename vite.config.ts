import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative asset paths so it works on GitHub Pages subpaths and root domains
  server: {
    port: 3000,
    open: false
  }
});
