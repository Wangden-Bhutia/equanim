/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';

const PUBLIC_FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'theme-init.js'];

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
// Caches only Equanim's own files. User entries live in localStorage and are never read or sent by this worker.
const CACHE = 'equanim-${version}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', (e) => {
  // cache: 'reload' bypasses the HTTP cache so the precache always matches this build.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
  // The first install activates at once (no clients yet); updates wait for the user to press "Update now".
  if (!self.registration.active) self.skipWaiting();
});
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('equanim-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Network first, so an online visit always gets the latest page. The cached page is not replaced here,
    // so the offline copy always matches the cached scripts and styles of this version.
    e.respondWith(fetch(req).catch(() => caches.open(CACHE).then((c) => c.match('./')).then((r) => r || caches.match('index.html'))));
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
