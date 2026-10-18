/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the project at https://<user>.github.io/equanim/
export default defineConfig({
  base: '/equanim/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts?(x)'],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
