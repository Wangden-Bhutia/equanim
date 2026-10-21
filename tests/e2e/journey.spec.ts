import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const SHOTS = process.env.SHOTS_DIR; // set to save screenshots
const shot = async (page: Page, name: string, fullPage = false) => {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage });
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

const primary = (page: Page) => page.getByRole('navigation', { name: 'Primary' }).locator('visible=true');

test('[SIMULATED phone: Pixel 7 profile in Chromium, not a real device] welcome, free practice (Keep practising) and a full classic day, every screen in light and dark', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');

  // Welcome (one screen), then look around without starting the programme: the free practice still works as before.
  await expect(page.getByRole('heading', { level: 1, name: /Respond, rather than react/ })).toBeVisible();
  await noHorizontalOverflow(page);
  await axe(page);
  await shot(page, '01-onboarding-welcome');
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await expect(page.getByRole('heading', { name: /6-week programme/ })).toBeVisible();

  await page.goto('./#/practise/p-one-word-reply');
  await expect(page.getByRole('heading', { name: 'The one-word reply' })).toBeVisible();
  await shot(page, '07-journey-scenario');
  await page.getByRole('button', { name: /notice the story forming/i }).click();
  await expect(page.getByRole('heading', { name: 'Observing the story' })).toBeVisible();
  await page.getByRole('heading', { name: 'Observing the story' }).scrollIntoViewIfNeeded();
  await shot(page, '08-scenario-feedback');
  await axe(page);
  await page.getByLabel(/personal note/i).fill('He replied "ok." I decided he was annoyed. He was in a meeting.');
  await page.getByRole('heading', { name: 'Why this matters' }).scrollIntoViewIfNeeded();
  await shot(page, '09-scenario-reflection');
  await page.getByRole('button', { name: 'Mark scenario complete' }).click();
  await expect(page.getByText('Scenario completed')).toBeVisible();
  await page.goto('./#/');
  await page.getByText('Ask before assuming').click();
  await page.getByRole('button', { name: 'Set intention' }).click();

  // Today
  await expect(page.getByText('Morning intention')).toBeVisible();
  await expect(page.getByText('Ask one clarifying question instead of guessing')).toBeVisible();
  await noHorizontalOverflow(page);
  await axe(page);
  await shot(page, '11-today');
  await page.getByRole('button', { name: 'Begin practice' }).click();
  await page.locator('#pr-resp').fill('Tried it on the bus.');
  await page.reload();
  await expect(page.getByText('Continue where you left off')).toBeVisible();
  await shot(page, '12-today-continue');
  await page.getByRole('button', { name: 'Mark practice complete' }).click();
  await page.getByRole('button', { name: 'Reflect on today' }).click();
  await page.getByLabel('What happened?').fill('Said yes to a meeting, then realised I had no time.');
  await page.getByLabel('What will I try next time?').fill('Pause before agreeing.');
  await page.locator('#evening-reflection').scrollIntoViewIfNeeded();
  await shot(page, '13-today-evening-reflection');
  await page.getByRole('button', { name: 'Save reflection' }).click();
  await page.reload();
  await expect(page.getByText('Said yes to a meeting')).toBeVisible();
  await shot(page, '14-today-full', true);
  await axe(page);

  // Keep practising: scenarios live inside the Library tab
  await primary(page).getByRole('link', { name: 'Library' }).click();
  await page.getByRole('link', { name: /Practice scenarios/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Practice scenarios' })).toBeVisible();
  await noHorizontalOverflow(page);
  await axe(page);
  await shot(page, '15-practise');
  // Revisit history
  await page.goto('./#/practise/p-one-word-reply');
  await expect(page.getByText('Your history with this scenario')).toBeVisible();
  await page.getByText('Your history with this scenario').scrollIntoViewIfNeeded();
  await shot(page, '16-scenario-history');

  // Journal: three types
  await primary(page).getByRole('link', { name: 'Journal' }).click();
  await shot(page, '17-journal-empty');
  await page.getByRole('link', { name: 'New entry' }).click();
  await shot(page, '18-journal-types');
  await page.getByRole('link', { name: /Incident reflection/ }).click();
  await page.getByLabel('What happened?').fill('My manager replied "ok." to my update.');
  await page.getByLabel('What did I interpret or assume?').fill('That she was unhappy with my work.');
  await page.getByLabel('What else might explain it?').fill('She was between meetings.');
  await shot(page, '19-journal-incident');
  await axe(page);
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('That she was unhappy with my work.')).toBeVisible();
  await shot(page, '20-journal-entry');
  // Edit the entry
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByLabel('What, if anything, should I do next?').fill('Ask how she prefers updates.');
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('Ask how she prefers updates.')).toBeVisible();
  await page.goto('./#/journal/new?type=daily');
  await page.getByLabel('Where did I respond deliberately today?').fill('In the standup.');
  await page.getByRole('button', { name: 'Save entry' }).click();
  await page.goto('./#/journal/new?type=free');
  await page.getByLabel('Reflection').fill('A quieter day.');
  await page.getByRole('button', { name: 'Save entry' }).click();
  await primary(page).getByRole('link', { name: 'Journal' }).click();
  await expect(page.getByText('A quieter day.')).toBeVisible();
  await shot(page, '21-journal-list');

  // Library
  await primary(page).getByRole('link', { name: 'Library' }).click();
  await shot(page, '22-library');
  await page.getByRole('link', { name: /Boundaries, Responsibility and Respect/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Boundaries, Responsibility and Respect' })).toBeVisible();
  await shot(page, '23-library-essay');
  await axe(page);
  await page.getByRole('button', { name: 'Mark as read' }).click();
  await page.getByRole('button', { name: 'I tried this' }).click();

  // Progress
  await primary(page).getByRole('link', { name: 'Progress' }).click();
  await expect(page.getByText('1/35')).toBeVisible();
  await expect(page.getByText('readings completed')).toBeVisible();
  await axe(page);
  await shot(page, '24-progress', true);

  // Close the app and open it again: everything is still there.
  const url = page.url().split('#')[0];
  await page.close();
  page = await context.newPage();
  await page.goto(`${url}#/journal`);
  await expect(page.getByText('A quieter day.')).toBeVisible();
  await page.goto(`${url}#/`);
  await expect(page.getByText('Said yes to a meeting')).toBeVisible();

  // Secondary pages with their specified names
  const secondary = [
    ['#/more', 'More', '25-more'],
    ['#/about', 'About Equanim', '26-about'],
    ['#/framework', 'Practice Framework', '27-framework'],
    ['#/evidence', 'Evidence and sources', '28-evidence'],
    ['#/settings', 'Settings and Data', '29-settings'],
    ['#/privacy', 'Privacy and Storage', '30-privacy'],
  ] as const;
  for (const [route, heading, name] of secondary) {
    await page.goto(`./${route}`);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await noHorizontalOverflow(page);
    await axe(page);
    await shot(page, name);
  }

  // Export produces a valid file
  await page.goto('./#/settings');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /export backup/i }).click()]);
  const json = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'));
  expect(json.app).toBe('equanim');
  expect(json.data.schemaVersion).toBe(4);
  expect(json.data.journal).toHaveLength(3);
  expect(json.data.reflections).toHaveLength(1);

  // Dark theme: same screens
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(300);
  const dark = [
    ['#/', '31-dark-today'],
    ['#/practise', '32-dark-practise'],
    ['#/journal', '34-dark-journal'],
    ['#/library', '35-dark-library'],
    ['#/library/section-speech', '36-dark-library-section'],
    ['#/progress', '37-dark-progress'],
    ['#/framework', '38-dark-framework'],
    ['#/settings', '39-dark-settings'],
  ] as const;
  for (const [route, name] of dark) {
    await page.goto(`./${route}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.waitForTimeout(150);
    await axe(page);
    await shot(page, name);
  }
  await page.goto('./#/practise/w-saturday-move');
  await page.getByRole('group', { name: 'Possible responses' }).getByRole('button').nth(1).click();
  await page.locator('[aria-labelledby="fb-h"]').scrollIntoViewIfNeeded();
  await axe(page);
  await shot(page, '33-dark-scenario-feedback');
});

test('no horizontal overflow at 360px on any route, with 1.0 data migrated', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('./');
  // Seed Equanim 1.0 (schema v1) data to confirm the live upgrade path works in a real browser.
  await page.evaluate(() => {
    const t = new Date().toISOString();
    localStorage.setItem('equanim:data', JSON.stringify({
      schemaVersion: 1, createdAt: t, onboardingCompletedAt: t,
      settings: { displayName: 'Asha', streaksEnabled: true, theme: 'light' },
      intentions: [{ id: 'i1', date: t.slice(0, 10), domain: 'words', text: 'Old intention', createdAt: t, updatedAt: t, reflection: null }],
      attempts: [{ id: 'a1', scenarioId: 'p-one-word-reply', optionId: 'a', at: t }],
      journal: [{ id: 'j1', createdAt: t, updatedAt: t, domain: 'perspective', scenarioId: null, situation: 'An old entry', story: '', response: '', nextTime: '', note: '' }],
      library: [],
    }));
  });
  await page.reload();
  await expect(page.locator('main h1').first()).toBeVisible();
  await page.goto('./#/journal');
  await expect(page.getByText('An old entry')).toBeVisible();
  const routes = ['#/', '#/practise', '#/practise/a-landlord-call', '#/practise/n-group-pressure', '#/journal', '#/journal/new', '#/journal/new?type=incident', '#/library', '#/library/section-personalisation', '#/progress', '#/more', '#/settings', '#/about', '#/framework', '#/references', '#/privacy', '#/nope'];
  for (const r of routes) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await noHorizontalOverflow(page);
  }
});

test('desktop sidebar, and the app makes no third-party requests', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const foreign: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http') && u.origin !== origin) foreign.push(r.url());
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('./');
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await expect(page.getByText('Morning intention')).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Sidebar' });
  await expect(sidebar).toBeVisible();
  for (const name of ['Today', 'Journal', 'Library', 'Progress', 'The 6-week programme', 'About Equanim', 'Practice Framework', 'Evidence and sources', 'Settings and Data', 'Privacy and Storage']) {
    await expect(sidebar.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await axe(page);
  await shot(page, '40-desktop-today');
  for (const r of ['#/practise', '#/practise/e-endless-polish', '#/journal', '#/library', '#/progress', '#/settings']) {
    await page.goto(`./${r}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    await noHorizontalOverflow(page);
  }
  await page.goto('./#/practise');
  await expect(page.getByRole('heading', { level: 1, name: 'Practice scenarios' })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Library', exact: true })).toHaveClass(/bg-accent/);
  await shot(page, '41-desktop-practise');
  expect(foreign).toEqual([]);
});

test('works offline after the first visit', async ({ page, context, baseURL }) => {
  test.skip(!!process.env.BASE_URL && !baseURL!.startsWith('https'), 'service workers need a secure origin');
  await page.goto('./');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await expect(page.getByText('Morning intention')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Morning intention')).toBeVisible();
  await page.goto('./#/library/essay-difficult-day');
  await expect(page.getByRole('heading', { level: 1, name: 'Learning from a Difficult Day' })).toBeVisible();
  await context.setOffline(false);
});
