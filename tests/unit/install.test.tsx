/**
 * Install App behaviour. These tests SIMULATE the browser install events (beforeinstallprompt, appinstalled)
 * and platform user agents in jsdom. They do not show a real browser prompt; see docs/manual-testing.md.
 */
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstallApp } from '../../src/components/InstallApp';
import { App } from '../../src/app/App';
import { DATA_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { detectPlatform, startInstallListener, __resetInstallForTests } from '../../src/engine/install';

const UA = {
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1',
  ipadDesktopMode: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  androidFirefox: 'Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  desktopFirefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
};

const realUA = navigator.userAgent;
const setUA = (ua: string) => Object.defineProperty(window.navigator, 'userAgent', { value: ua, configurable: true });
const realMatchMedia = window.matchMedia;
const setStandalone = (on: boolean) => {
  window.matchMedia = ((q: string) => ({ matches: on && q.includes('standalone'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
};

function fakePrompt(outcome: 'accepted' | 'dismissed', opts: { throws?: boolean } = {}) {
  const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
  e.prompt = vi.fn(() => (opts.throws ? Promise.reject(new Error('already used')) : Promise.resolve()));
  e.userChoice = Promise.resolve({ outcome });
  return e;
}

beforeEach(() => {
  startInstallListener();
  setStandalone(false);
  setUA(UA.androidChrome);
  act(() => __resetInstallForTests());
});
afterEach(() => {
  setUA(realUA);
  window.matchMedia = realMatchMedia;
});

describe('platform detection', () => {
  it('recognises iOS browsers, including iPadOS reporting as a Mac', () => {
    expect(detectPlatform(UA.iphoneSafari)).toEqual({ os: 'ios', browser: 'safari' });
    expect(detectPlatform(UA.iphoneChrome)).toEqual({ os: 'ios', browser: 'chrome' });
    expect(detectPlatform(UA.ipadDesktopMode, 'MacIntel', 5)).toEqual({ os: 'ios', browser: 'safari' });
    expect(detectPlatform(UA.macSafari, 'MacIntel', 0)).toEqual({ os: 'desktop', browser: 'safari' });
  });
  it('recognises Android and desktop browsers', () => {
    expect(detectPlatform(UA.androidChrome)).toEqual({ os: 'android', browser: 'chrome' });
    expect(detectPlatform(UA.samsung)).toEqual({ os: 'android', browser: 'samsung' });
    expect(detectPlatform(UA.androidFirefox)).toEqual({ os: 'android', browser: 'firefox' });
    expect(detectPlatform(UA.desktopChrome)).toEqual({ os: 'desktop', browser: 'chromium' });
    expect(detectPlatform(UA.desktopFirefox)).toEqual({ os: 'desktop', browser: 'firefox' });
  });
});

describe('Install App (simulated events)', () => {
  it('shows a guidance state, never a dead button, when no prompt is available', async () => {
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    const btn = screen.getByRole('button', { name: 'Install App' });
    expect(btn).toBeEnabled();
    expect(screen.getByText(/not offered by this browser right now/i)).toBeInTheDocument();
    await u.click(btn);
    const dlg = screen.getByRole('dialog', { name: 'Installing Equanim' });
    expect(within(dlg).getByText(/Install app or Add to Home screen/)).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(btn).toHaveFocus(); // focus returns to the opener
  });

  it('captures beforeinstallprompt, prompts only on click, and hides after accepting', async () => {
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    const e = fakePrompt('accepted');
    act(() => { window.dispatchEvent(e); });
    expect(e.defaultPrevented).toBe(true); // no automatic browser banner
    expect(e.prompt).not.toHaveBeenCalled();
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(/Equanim is installed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Install App' })).not.toBeInTheDocument();
  });

  it('handles a cancelled prompt calmly and does not re-prompt with a used event', async () => {
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    const e = fakePrompt('dismissed');
    act(() => { window.dispatchEvent(e); });
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    expect(await screen.findByText(/Not installed\. You can install later/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    expect(e.prompt).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toHaveTextContent(/install prompt was closed/i);
  });

  it('falls back to guidance if the browser refuses the prompt', async () => {
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    act(() => { window.dispatchEvent(fakePrompt('accepted', { throws: true })); });
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    expect(await screen.findByRole('dialog', { name: 'Installing Equanim' })).toBeInTheDocument();
  });

  it('reacts to appinstalled (e.g. installed from the browser menu)', () => {
    render(<InstallApp variant="card" />);
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(screen.getByText(/Equanim is installed/)).toBeInTheDocument();
  });

  it('in standalone mode shows no install action', () => {
    setStandalone(true);
    act(() => __resetInstallForTests());
    const { unmount } = render(<InstallApp variant="card" />);
    expect(screen.queryByRole('button', { name: 'Install App' })).not.toBeInTheDocument();
    expect(screen.getByText('You are using the installed app.')).toBeInTheDocument();
    unmount();
    const { container } = render(<InstallApp variant="sidebar" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('on iPhone Safari shows the Share › Add to Home Screen guide', async () => {
    setUA(UA.iphoneSafari);
    act(() => __resetInstallForTests());
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    const dlg = screen.getByRole('dialog', { name: 'Add Equanim to your Home Screen' });
    expect(dlg).toHaveTextContent(/Share button/);
    expect(dlg).toHaveTextContent(/Add to Home Screen/);
    expect(dlg).not.toHaveTextContent(/iOS or iPadOS 16\.4/);
  });

  it('on Chrome for iPhone mentions the iOS 16.4 requirement and Safari fallback', async () => {
    setUA(UA.iphoneChrome);
    act(() => __resetInstallForTests());
    const u = userEvent.setup();
    render(<InstallApp variant="card" />);
    await u.click(screen.getByRole('button', { name: 'Install App' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/16\.4 or later.*Safari/);
  });

  it('is placed in Settings and Data, More, and the desktop sidebar, not in the bottom navigation', async () => {
    localStorage.setItem(DATA_KEY, JSON.stringify({ ...emptyData(), onboardingCompletedAt: new Date().toISOString() }));
    window.location.hash = '#/settings';
    render(<App />);
    await screen.findByRole('heading', { level: 1, name: 'Settings and Data' });
    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(within(sidebar).getByRole('button', { name: 'Install App' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Install App' })).toBeInTheDocument();
    const bottom = screen.getAllByRole('navigation', { name: 'Primary' }).at(-1)!;
    expect(within(bottom).queryByRole('button', { name: 'Install App' })).not.toBeInTheDocument();
    window.location.hash = '#/more';
    await screen.findByRole('heading', { level: 1, name: 'More' });
    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Install App' })).toBeInTheDocument();
  });
});
