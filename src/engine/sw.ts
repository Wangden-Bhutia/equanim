/**
 * Service worker registration and user-controlled updates.
 * A new version installs in the background and waits. The app then offers "Update now"; only when the user
 * presses it does the new worker take over, and the page reloads once. Nothing is sent anywhere.
 */
import { useSyncExternalStore } from 'react';

let waiting: ServiceWorker | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function track(reg: ServiceWorkerRegistration) {
  const check = () => {
    // Only an *update* waits; the very first install activates straight away (there is no older version).
    if (reg.waiting && navigator.serviceWorker.controller) { waiting = reg.waiting; emit(); }
  };
  check();
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => { if (w.state === 'installed') check(); });
  });
}

export function registerServiceWorker(base: string): void {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!navigator.serviceWorker.controller || reloading || !waitingRequested) return;
    reloading = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).then((reg) => {
      track(reg);
      // Look for a new version when the app comes back to the foreground, at most every 30 minutes.
      let last = Date.now();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && Date.now() - last > 30 * 60 * 1000) { last = Date.now(); void reg.update().catch(() => {}); }
      });
    }).catch(() => { /* Offline support is optional; the app works without it. */ });
  });
}

let waitingRequested = false;
export function applyUpdate(): void {
  if (!waiting) return;
  waitingRequested = true;
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function useUpdateAvailable(): boolean {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => waiting !== null, () => false);
}
