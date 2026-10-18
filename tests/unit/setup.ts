import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

window.scrollTo = (() => {}) as typeof window.scrollTo;
if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}

// Cross-tab tests inject their own channel and lock manager, so delivery order is fully deterministic.
// (Node provides a real BroadcastChannel, which would deliver asynchronously between test "tabs".)
(globalThis as { BroadcastChannel?: unknown }).BroadcastChannel = undefined;
