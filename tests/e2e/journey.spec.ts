import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const SHOTS = process.env.SHOTS_DIR; // set to save phone screenshots
const shot = async (page: Page, name: string) => {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(0);
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test('first session to first saved reflection, then every screen', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');

  // Onboarding
  await expect(page.getByRole('heading', { name: 'Clarity in the midst of life.' })).toBeVisible();
  await noHorizontalOverflow(page);
  await axe(page);
  await shot(page, '01-onboarding-welcome');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /practice takes a few minutes/i })).toBeVisible();
  await shot(page, '02-onboarding-sample-day');
  await page.getByRole('button', { name: 'Continue' }).click();
  await shot(page, '03-onboarding-privacy');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel(/what should equanim call you/i).fill('Asha');
  await page.getByRole('button', { name: 'Begin first practice' }).click();

  // First practice
  await expect(page.getByRole('heading', { name: 'The one-word reply' })).toBeVisible();
  await shot(page, '04-first-scenario');
  await page.getByRole('button', { name: /notice the story forming/i }).click();
  await expect(page.getByRole('heading', { name: 'Observing the story' })).toBeVisible();
  await page.getByRole('heading', { name: 'Observing the story' }).scrollIntoViewIfNeeded();
  await shot(page, '05-scenario-feedback');
  await axe(page);
  await page.getByRole('link', { name: /continue to today/i }).click();

  // Today: intention
  await expect(page.getByRole('heading', { name: /, Asha\./ })).toBeVisible();
  await shot(page, '06-today-empty');
  await page.getByText('Words', { exact: true }).click();
  await page.getByLabel('Intention', { exact: true }).fill('Before agreeing to anything today, pause and check whether I can really do it.');
  await page.getByRole('button', { name: 'Set intention' }).click();
  await expect(page.getByText('Before agreeing to anything today')).toBeVisible();

  // Evening reflection
  await page.getByRole('button', { name: 'Reflect on today' }).click();
  await page.getByText('I noticed afterwards').click();
  await page.getByLabel(/what did you observe/i).fill('Said yes to a meeting, then realised I had no time.');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await expect(page.getByText('I noticed afterwards')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Before agreeing to anything today')).toBeVisible();
  await expect(page.getByText('Said yes to a meeting')).toBeVisible();
  await shot(page, '07-today-with-intention');
  await axe(page);

  // Practise list
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Practise' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Practise' })).toBeVisible();
  await noHorizontalOverflow(page);
  await shot(page, '08-practise');
  await axe(page);

  // Journal
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Journal' }).click();
  await shot(page, '09-journal-empty');
  await page.getByRole('link', { name: 'New entry' }).click();
  await page.getByLabel('What happened').fill('My manager replied "ok." to my update.');
  await page.getByLabel('The meaning I added').fill('She was unhappy with my work.');
  await page.getByLabel('How I responded').fill('Spent an hour rewriting it.');
  await shot(page, '10-journal-editor');
  await axe(page);
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('She was unhappy with my work.')).toBeVisible();
  await shot(page, '11-journal-entry');

  // Library
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Library' }).click();
  await shot(page, '12-library');
  await page.getByRole('link', { name: /A boundary is not a wall/ }).click();
  await expect(page.getByRole('heading', { name: 'A boundary is not a wall' })).toBeVisible();
  await shot(page, '13-library-essay');
  await axe(page);
  await page.getByRole('button', { name: 'I tried this' }).click();

  // Progress
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByText('1/24')).toBeVisible();
  await shot(page, '14-progress');
  await axe(page);

  // Secondary pages
  for (const [route, heading, name] of [
    ['#/settings', 'Settings & data', '15-settings'],
    ['#/framework', 'The framework', '16-framework'],
    ['#/about', 'About Equanim', '17-about'],
    ['#/references', 'References', '18-references'],
    ['#/privacy', 'Privacy', '19-privacy'],
    ['#/more', 'More', '20-more'],
  ] as const) {
    await page.goto(`./${route}`);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await noHorizontalOverflow(page);
    await axe(page);
    await shot(page, name);
  }

  // Export produces a valid file
  await page.goto('./#/settings');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /export backup/i }).click()]);
  const path = await download.path();
  const json = JSON.parse(fs.readFileSync(path!, 'utf8'));
  expect(json.app).toBe('equanim');
  expect(json.data.journal).toHaveLength(1);

  // Dark theme
  await page.getByRole('button', { name: 'Dark' }).click();
  await page.goto('./#/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(400);
  await axe(page);
  await shot(page, '21-today-dark');
  await page.goto('./#/practise/w-saturday-move');
  await page.getByRole('button', { name: /clear, kind no|not able to this saturday/i }).click();
  await page.getByRole('heading', { name: 'Clear, kind no' }).scrollIntoViewIfNeeded();
  await shot(page, '22-scenario-dark');
});

test('no horizontal overflow at 360px on any route', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('./');
  await page.evaluate(() => {
    localStorage.setItem('equanim:data', JSON.stringify({
      schemaVersion: 1, createdAt: new Date().toISOString(), onboardingCompletedAt: new Date().toISOString(),
      settings: { displayName: 'Asha', streaksEnabled: true, theme: 'light' }, intentions: [], attempts: [], journal: [], library: [],
    }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: /, Asha\./ })).toBeVisible();
  const routes = ['#/', '#/practise', '#/practise/a-landlord-call', '#/journal', '#/journal/new', '#/library', '#/library/section-perspective', '#/progress', '#/more', '#/settings', '#/about', '#/framework', '#/references', '#/privacy', '#/nope'];
  for (const r of routes) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await noHorizontalOverflow(page);
  }
  await page.goto('./#/practise/a-landlord-call');
  await page.getByRole('button', { name: /write down what you actually know/i }).click();
  await noHorizontalOverflow(page);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/23-scenario-360.png`, fullPage: true });
});

test('desktop width works and the app makes no third-party requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== origin) foreign.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.getByRole('button', { name: 'Go to Today instead' }).click();
  await expect(page.getByText('Today’s intention')).toBeVisible();
  for (const r of ['#/practise', '#/practise/e-endless-polish', '#/journal', '#/library', '#/progress', '#/settings']) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await noHorizontalOverflow(page);
  }
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/24-desktop-settings.png` });
  expect(foreign).toEqual([]);
});
