import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' + HashRouter lets the built site work from any static host or sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
});
