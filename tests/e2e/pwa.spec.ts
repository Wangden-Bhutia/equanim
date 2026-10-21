/**
 * PWA, install and offline checks in real (headless) Chromium.
 * Anything that needs a real phone, a real install prompt or a screen reader is in docs/manual-testing.md.
 */
import { test, expect, devices, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SHOTS = process.env.SHOTS_DIR;
const LOCAL = !process.env.BASE_URL;
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};
const onboard = async (page: Page) => {
  await page.goto('./');
  await page.evaluate(() => {
    const t = new Date().toISOString();
    localStorage.setItem('equanim:data', JSON.stringify({ schemaVersion: 2, createdAt: t, onboardingCompletedAt: t, settings: { displayName: 'Asha', streaksEnabled: false, theme: 'light' }, intentions: [], reflections: [], practices: [], attempts: [], completions: [], journal: [], library: [], inProgress: null }));
  });
  await page.reload();
  await expect(page.getByText('Morning intention')).toBeVisible();
};
const swReady = async (page: Page) => {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
};

test('manifest is valid and Chromium reports no installability errors', async ({ page, baseURL }) => {
  await page.goto('./');
  await swReady(page);
  const manifest = await (await page.request.get(new URL('manifest.webmanifest', baseURL).href)).json();
  expect(manifest).toMatchObject({ name: 'Equanim', short_name: 'Equanim', display: 'standalone', start_url: './', scope: './', background_color: '#F6F3EB', theme_color: '#F6F3EB' });
  const icons = manifest.icons as { src: string; sizes: string; purpose: string }[];
  expect(icons.some((i) => i.sizes === '192x192')).toBe(true);
  expect(icons.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
  expect(icons.some((i) => i.sizes === '512x512' && i.purpose === 'maskable')).toBe(true);
  for (const i of icons) expect((await page.request.get(new URL(i.src, new URL('manifest.webmanifest', baseURL)).href)).ok(), i.src).toBe(true);

  const cdp = await page.context().newCDPSession(page);
  const app = await cdp.send('Page.getAppManifest');
  expect(app.errors).toEqual([]);
  const parsed = (app as unknown as { manifest?: { startUrl?: string; scope?: string } }).manifest;
  if (parsed?.startUrl) expect(new URL(parsed.startUrl).pathname).toBe('/equanim/');
  if (parsed?.scope) expect(new URL(parsed.scope).pathname).toBe('/equanim/');
  const inst = await cdp.send('Page.getInstallabilityErrors');
  expect(inst.installabilityErrors).toEqual([]);
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope);
  expect(new URL(scope!).pathname).toBe('/equanim/');
});

test('every request stays under the /equanim/ base path', async ({ page, baseURL }) => {
  const base = new URL(baseURL!);
  const outside: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.origin === base.origin && !u.pathname.startsWith(base.pathname)) outside.push(u.pathname);
  });
  await onboard(page);
  for (const r of ['#/practise', '#/library/essay-boundaries', '#/settings']) await page.goto(`./${r}`);
  await swReady(page);
  expect(outside).toEqual([]);
});

test('nested hash routes survive a refresh', async ({ page }) => {
  await onboard(page);
  for (const [route, h1] of [['#/library/essay-boundaries', 'Boundaries, Responsibility and Respect'], ['#/practise/n-group-pressure', 'Everyone agrees'], ['#/journal/new?type=daily', 'Daily review']] as const) {
    await page.goto(`./${route}`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
  }
});

test('offline: reopen after the first visit, keep working, then reconnect', async ({ page, context }) => {
  await onboard(page);
  await swReady(page);
  await context.setOffline(true);
  // Reopen in a new tab while offline (as if the app was closed and opened again).
  const again = await context.newPage();
  await again.goto(page.url().split('#')[0] + '#/');
  await expect(again.getByText('Morning intention')).toBeVisible();
  await again.getByText('Write my own').click();
  await again.getByLabel('Your intention').fill('Written offline');
  await again.getByRole('button', { name: 'Set intention' }).click();
  await again.goto(page.url().split('#')[0] + '#/library/essay-difficult-day');
  await expect(again.getByRole('heading', { level: 1, name: 'Learning from a Difficult Day' })).toBeVisible();
  // Icons and styles came from the cache too.
  const bg = await again.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(246, 243, 235)');
  await context.setOffline(false);
  await again.reload();
  await again.goto(page.url().split('#')[0] + '#/');
  await expect(again.getByText('Written offline')).toBeVisible();
});

test.describe('Install App states (screenshots; prompt events simulated where noted)', () => {
  test('mobile Settings: Install App shown; with no browser prompt it opens manual guidance', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    const btn = page.getByRole('main').getByRole('button', { name: 'Install App' });
    await expect(btn).toBeVisible();
    await btn.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await shot(page, 'install-01-settings-install-button');
    await btn.click();
    await expect(page.getByRole('dialog', { name: 'Installing Equanim' })).toBeVisible();
    await shot(page, 'install-02-install-unavailable-guide');
    await page.keyboard.press('Escape');
    await expect(btn).toBeFocused();
    await page.goto('./#/more');
    await expect(page.getByRole('main').getByRole('button', { name: 'Install App' })).toBeVisible();
    await shot(page, 'install-03-more-install');
  });

  test('SIMULATED beforeinstallprompt: button prompts on click and hides once accepted', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    await page.evaluate(() => {
      const e = new Event('beforeinstallprompt', { cancelable: true }) as Event & Record<string, unknown>;
      (window as unknown as { __prompted: number }).__prompted = 0;
      e.prompt = () => { (window as unknown as { __prompted: number }).__prompted++; return Promise.resolve(); };
      e.userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(e);
    });
    const btn = page.getByRole('main').getByRole('button', { name: 'Install App' });
    await btn.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await shot(page, 'install-04-install-available-simulated');
    await btn.click();
    await expect(page.getByRole('main').getByText(/Equanim is installed/)).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __prompted: number }).__prompted)).toBe(1);
    await expect(page.getByRole('main').getByRole('button', { name: 'Install App' })).toHaveCount(0);
    await shot(page, 'install-05-install-accepted-simulated');
  });

  test('desktop sidebar shows Install App', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await onboard(page);
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
    await expect(sidebar.getByRole('button', { name: 'Install App' })).toBeVisible();
    await shot(page, 'install-06-desktop-sidebar-install');
  });
});

test.describe('iPhone Safari (EMULATED user agent and viewport, not a real iPhone)', () => {
  test.use({ userAgent: devices['iPhone 13'].userAgent, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('Install App opens the Share › Add to Home Screen guide', async ({ page }) => {
    await onboard(page);
    await page.goto('./#/settings');
    const btn = page.getByRole('main').getByRole('button', { name: 'Install App' });
    await btn.click();
    const dlg = page.getByRole('dialog', { name: 'Add Equanim to your Home Screen' });
    await expect(dlg).toContainText('Add to Home Screen');
    await shot(page, 'install-07-ios-guide');
  });
});

test('a new version waits for "Update now", then takes over', async ({ browser }) => {
  test.skip(!LOCAL, 'needs a local build to serve a changed copy');
  // Serve a private copy of dist so the real build artifact is never modified.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eq-update-'));
  fs.cpSync('dist', root, { recursive: true });
  const port = 4175;
  const server: ChildProcess = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(port), '--strictPort', '--outDir', root], { stdio: 'ignore' });
  const url = `http://localhost:${port}/equanim/`;
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 250)); }
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(url);
    await page.getByRole('button', { name: 'Look around without starting' }).click();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    const oldCache = await page.evaluate(async () => (await caches.keys()).find((k) => k.startsWith('equanim-')));
    // Publish a "new version".
    const sw = path.join(root, 'sw.js');
    fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = 'equanim-[^']+'/, "const CACHE = 'equanim-test-update'"));
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())!.update(); });
    const update = page.getByRole('button', { name: 'Update now' });
    await expect(update).toBeVisible({ timeout: 15000 });
    // The old version keeps running until the user chooses; nothing reloads on its own.
    expect(await page.evaluate(async () => (await caches.keys()).includes('equanim-test-update'))).toBe(true);
    await Promise.all([page.waitForEvent('load'), update.click()]);
    await expect(page.getByText('Morning intention')).toBeVisible();
    await expect.poll(() => page.evaluate(async () => caches.keys())).not.toContain(oldCache);
    expect(await page.evaluate(() => localStorage.getItem('equanim:store'))).toContain('"onboardingCompletedAt":"');
    await context.close();
  } finally {
    server.kill();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
