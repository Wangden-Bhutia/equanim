/**
 * "Install App" support.
 *
 * - Chromium (Android Chrome, desktop Chrome/Edge, Samsung Internet): the browser fires `beforeinstallprompt`
 *   when the app meets its install criteria. We prevent the automatic mini-infobar, keep the event, and show it
 *   only when the user presses Install App. Each event can be prompted once.
 * - iOS/iPadOS: there is no install API. We show the Share > Add to Home Screen steps for the detected browser.
 * - Everything else: the button opens guidance explaining why installing is not offered and how to do it manually.
 * Nothing here prompts on its own, and nothing is sent anywhere.
 */
import { useSyncExternalStore } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform?: string }>;
}

export type Platform =
  | { os: 'ios'; browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'other' }
  | { os: 'android'; browser: 'chrome' | 'samsung' | 'firefox' | 'other' }
  | { os: 'desktop'; browser: 'chromium' | 'safari' | 'firefox' | 'other' };

export function detectPlatform(ua: string, platform = '', maxTouchPoints = 0): Platform {
  const iPadOS = platform === 'MacIntel' && maxTouchPoints > 1; // iPadOS reports itself as a Mac
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) {
    const browser = /CriOS/.test(ua) ? 'chrome' : /FxiOS/.test(ua) ? 'firefox' : /EdgiOS/.test(ua) ? 'edge' : /Safari/.test(ua) && !/(OPiOS|YaBrowser|DuckDuckGo|GSA)\//.test(ua) ? 'safari' : 'other';
    return { os: 'ios', browser };
  }
  if (/Android/.test(ua)) {
    const browser = /SamsungBrowser/.test(ua) ? 'samsung' : /Firefox/.test(ua) ? 'firefox' : /Chrome\//.test(ua) && !/(OPR|EdgA|wv\))/.test(ua) ? 'chrome' : 'other';
    return { os: 'android', browser };
  }
  const browser = /Firefox\//.test(ua) ? 'firefox' : /(Chrome|Chromium|Edg)\//.test(ua) ? 'chromium' : /Safari\//.test(ua) ? 'safari' : 'other';
  return { os: 'desktop', browser };
}

export type InstallStatus =
  /** Running as the installed app (standalone display mode). */
  | 'installed'
  /** The browser offered an install prompt; pressing the button shows it. */
  | 'available'
  /** The prompt is showing. */
  | 'prompting'
  /** The user dismissed the prompt; the browser may offer it again later. */
  | 'dismissed'
  /** iOS/iPadOS: manual Add to Home Screen. */
  | 'ios'
  /** No prompt is available here (unsupported browser, already installed in another window, or not yet eligible). */
  | 'unavailable';

interface State { status: InstallStatus; justInstalled: boolean }

let deferred: BeforeInstallPromptEvent | null = null;
let state: State = { status: 'unavailable', justInstalled: false };
const listeners = new Set<() => void>();
let started = false;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches || !!window.matchMedia?.('(display-mode: minimal-ui)').matches;
}

function baseStatus(): InstallStatus {
  if (isStandalone()) return 'installed';
  if (deferred) return 'available';
  return currentPlatform().os === 'ios' ? 'ios' : 'unavailable';
}

export function currentPlatform(): Platform {
  if (typeof navigator === 'undefined') return { os: 'desktop', browser: 'other' };
  return detectPlatform(navigator.userAgent, navigator.platform, navigator.maxTouchPoints ?? 0);
}

/** Starts listening for install events. Call once, as early as possible (before the browser fires the event). */
export function startInstallListener(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // no automatic browser banner; the user decides when
    deferred = e as BeforeInstallPromptEvent;
    if (state.status !== 'prompting') set({ status: isStandalone() ? 'installed' : 'available' });
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    set({ status: 'installed', justInstalled: true });
  });
  window.matchMedia?.('(display-mode: standalone)').addEventListener?.('change', () => set({ status: baseStatus() }));
  set({ status: baseStatus() });
}

/** Shows the stored browser prompt. Returns the user's choice, or 'unavailable' if there was nothing to show. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const e = deferred;
  if (!e) {
    set({ status: baseStatus() });
    return 'unavailable';
  }
  deferred = null; // an event can only be used once
  set({ status: 'prompting' });
  try {
    await e.prompt();
    const choice = await e.userChoice;
    if (choice.outcome === 'accepted') set({ status: 'installed', justInstalled: true });
    else set({ status: 'dismissed' });
    return choice.outcome;
  } catch {
    // Already used or blocked by the browser.
    set({ status: baseStatus() === 'available' ? 'available' : 'unavailable' });
    return 'unavailable';
  }
}

export function useInstall(): State {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

/** Test helper: forget all state so each test starts clean. */
export function __resetInstallForTests(): void {
  deferred = null;
  state = { status: baseStatus(), justInstalled: false };
  listeners.forEach((l) => l());
}
