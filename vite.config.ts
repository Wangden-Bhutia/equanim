/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';

const PUBLIC_FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'theme-init.js'];

/**
 * Emits sw.js at build time with the exact list of built files, so the app works offline after the first visit.
 * Navigation is network-first (new deploys arrive promptly), hashed assets are cache-first.
 * The cache holds only app files; user data stays in localStorage and is never touched by the worker.
 */
function offlineServiceWorker(): Plugin {
  return {
    name: 'equanim-offline-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const assets = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const files = [...PUBLIC_FILES, ...assets];
      const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 12);
      const source = `// Generated at build time by vite.config.ts. Do not edit.
const CACHE = 'equanim-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('equanim-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put('./', copy));
      return res;
    }).catch(() => caches.match('./').then((r) => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

// GitHub Pages serves the project at https://<user>.github.io/equanim/
export default defineConfig({
  base: '/equanim/',
  plugins: [react(), offlineServiceWorker()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts?(x)'],
    setupFiles: ['tests/unit/setup.ts'],
  },
});
