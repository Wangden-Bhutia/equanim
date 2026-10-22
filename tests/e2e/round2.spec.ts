/**
 * Round 2 in EMULATED Chromium (Pixel 7 profile; not a real device), with a faked clock: the override, the Apply
 * requirement, the four-tab bar, and axe at 390 light/dark and 360 on every new or changed screen.
 * Set R2_SHOTS to a folder to save 390×844 screenshots in light and dark.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const SHOTS = process.env.R2_SHOTS;
const NOW = new Date(2026, 10, 10, 9, 0, 0);
const iso = (daysAgo: number, h = 9) => new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo, h).toISOString();
const key = (daysAgo: number) => { const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

async function check(page: Page, name: string) {
  for (const v of [{ scheme: 'light' as const, width: 390 }, { scheme: 'dark' as const, width: 390 }, { scheme: 'light' as const, width: 360 }]) {
    await page.setViewportSize({ width: v.width, height: 844 });
    await page.emulateMedia({ colorScheme: v.scheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', v.scheme);
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${name} ${v.scheme} ${v.width}: overflow`).toBeLessThanOrEqual(0);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical');
    expect(serious.map((x) => `${name} ${v.scheme} ${v.width}: ${x.id}: ${x.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    if (SHOTS && v.width === 390) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/${name}-390-${v.scheme}.png` });
      const style = await page.addStyleTag({ content: 'nav[aria-label="Primary"]{position:static!important}' });
      await page.screenshot({ path: `${SHOTS}/${name}-390-${v.scheme}-full.png`, fullPage: true });
      await style.evaluate((el) => el.remove());
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
}

const ses = (id: string, daysAgo: number, extra: Record<string, unknown> = {}) => ({ id: `ses_${id}`, sessionId: id, completedAt: iso(daysAgo), updatedAt: iso(daysAgo), mode: 'think', answers: {}, choices: {}, earlyStart: false, thinkResponses: {}, ...extra });
const VALUES = [
  { id: 'honesty', sentence: 'Say what I actually mean in meetings.', updatedAt: iso(20) },
  { id: 'calm', sentence: 'Take one breath before replying to a sharp message.', updatedAt: iso(20) },
  { id: 'kindness', sentence: 'Call my mother on Sunday and listen.', updatedAt: iso(20) },
];
function store(data: Record<string, unknown>) {
  return {
    format: 'equanim-store', schemaVersion: 5, revision: 1, nonce: 'seed', ancestors: [], legacy: null,
    data: {
      schemaVersion: 5, createdAt: iso(30), onboardingCompletedAt: iso(30),
      settings: { displayName: '', streaksEnabled: false, theme: 'system', lastExportAt: iso(1), backupNudgeDismissedOn: null, reminderTime: null },
      intentions: [], reflections: [], practices: [], attempts: [], completions: [], journal: [], library: [], inProgress: null,
      programme: { startedAt: iso(30), disclaimerSeenAt: iso(30), maintenanceStartedAt: null, noticeDismissedAt: iso(30) },
      sessions: [], values: VALUES, baselines: [], reviews: [], plans: [], recall: [],
      ...data,
    },
  };
}
async function open(page: Page, data: Record<string, unknown> | null, hash = '#/') {
  await page.clock.install({ time: NOW });
  await page.goto('./');
  await page.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem('equanim:store', JSON.stringify(s)); }, data ? store(data) : null);
  await page.reload();
  await page.goto(`./${hash}`);
}
const ORDER = ['w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5', 'w1d6', 'w2d1', 'w2d2', 'w2d3', 'w2d4', 'w2d5', 'w2d6', 'w3d1', 'w3d2'];
const upTo = (n: number) => ORDER.slice(0, n).map((id, i) => ses(id, 20 - i));

test('[SIMULATED phone] override: "Do the next one now anyway" is confirmed once, recorded, and shown honestly on Progress', async ({ page }) => {
  await open(page, { sessions: [ses('w0d0', 1), ses('w1d1', 0)] });
  await expect(page.getByTestId('session-gated')).toBeVisible();
  await expect(page.getByText(/Next session opens tomorrow, /)).toBeVisible();
  await check(page, 'r2-01-today-gated');
  await page.getByRole('button', { name: 'Do the next one now anyway' }).click();
  await expect(page.getByText(/Spacing sessions across days helps the learning stick/)).toBeVisible();
  await check(page, 'r2-02-override-confirm');
  await page.getByRole('button', { name: 'Start it now' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Spot the added meaning' })).toBeVisible();
  await page.getByRole('button', { name: 'Complete session' }).click();
  await expect(page.getByTestId('completion-moment')).toBeVisible();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('equanim:store')!).data.sessions);
  expect(s.find((x: { sessionId: string }) => x.sessionId === 'w1d2').earlyStart).toBe(true);
  await page.goto('./#/progress');
  await expect(page.getByTestId('early-line')).toHaveText('1 session done ahead of schedule. Spacing helps, but your pace is yours.');
  // A deep link to the next one shows "Opens tomorrow", not the content.
  await page.goto('./#/session/w1d3');
  await expect(page.getByText('Opens tomorrow', { exact: true })).toBeVisible();
  await check(page, 'r2-03-session-opens-tomorrow');
  // Ten days later it is simply open, nothing reset.
  await page.clock.setSystemTime(new Date(NOW.getTime() + 10 * 86400000));
  await page.goto('./#/');
  await expect(page.getByTestId('session-ready')).toBeVisible();
  await expect(page.getByText('Week 1 · Day 3 of 42')).toBeVisible();
});

test('[SIMULATED phone] Apply needs a plan this week; "I’ll do this later" leaves without completing', async ({ page }) => {
  await open(page, { sessions: upTo(4) }, '#/session/w1d4');
  await expect(page.getByTestId('apply-needs-plan')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete session' })).toBeDisabled();
  await check(page, 'r2-04-apply-needs-plan');
  await page.getByRole('link', { name: 'I’ll do this later' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Today' })).toBeVisible();
  await page.goto('./#/session/w1d4');
  await page.getByRole('link', { name: /Make today’s plan/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Today’s if-then plan' })).toBeVisible();
  await page.getByRole('button', { name: /Use a suggested plan/ }).click();
  await page.locator('label').filter({ hasText: /^Calm/ }).click();
  await check(page, 'r2-05-plan-builder-values');
  await page.getByRole('button', { name: 'Save plan' }).click();
  await expect(page).toHaveURL(/#\/session\/w1d4/);
  await expect(page.getByRole('button', { name: 'Complete session' })).toBeEnabled();
  await page.getByTestId('values-collapsed').locator('summary').click();
  await check(page, 'r2-06-apply-ready-values');
  await page.getByRole('button', { name: 'Complete session' }).click();
  await expect(page.getByTestId('completion-moment')).toBeVisible();
  await page.getByTestId('completion-moment').evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await check(page, 'r2-07-completion-moment');
  await page.goto('./#/');
  await expect(page.getByTestId('plan-value')).toHaveText('You planned this for Calm.');
});

test('[SIMULATED phone] weekly review without practice offers a labelled catch-up', async ({ page }) => {
  await open(page, { sessions: upTo(6) }, '#/review/1');
  await expect(page.getByTestId('review-needs-practice')).toBeVisible();
  await check(page, 'r2-08-review-needs-practice');
  await page.getByRole('button', { name: 'Do the catch-up version' }).click();
  await expect(page.getByTestId('catchup-label')).toBeVisible();
  await page.getByLabel('What worked this week?').fill('Some pausing.');
  await page.getByRole('button', { name: 'Complete catch-up review' }).click();
  await expect(page.getByTestId('moment-idea')).toBeVisible();
  await check(page, 'r2-09-review-moment');
});

test('[SIMULATED phone] tab bar: Today / Programme / Journal / Progress; old deep links still work', async ({ page }) => {
  await open(page, { sessions: upTo(8) });
  const bar = page.getByRole('navigation', { name: 'Primary' }).last();
  await expect(bar.getByRole('link')).toHaveText(['Today', 'Programme', 'Journal', 'Progress']);
  await expect(page.getByTestId('session-ready')).toBeVisible();
  await check(page, 'r2-10-today-ready');
  await page.getByRole('link', { name: /Week 2 · Day 9 of 42. Open the programme/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The 6-week programme' })).toBeVisible();
  await expect(bar.getByRole('link', { name: 'Programme' })).toHaveClass(/text-accent/);
  await expect(page.getByRole('navigation', { name: 'Your six-week journey' }).getByRole('link')).toHaveCount(6);
  await check(page, 'r2-11-programme-journey');
  await page.getByTestId('keep-practising-link').click();
  await expect(page.getByRole('heading', { level: 1, name: 'Keep practising' })).toBeVisible();
  await page.goto('./#/session/w2d2');
  await expect(bar.getByRole('link', { name: 'Programme' })).toHaveClass(/text-accent/);
  await answerAndShoot(page);
  for (const [hash, h1] of [['#/practise', 'Practice scenarios'], ['#/practise/p-one-word-reply', null], ['#/library', 'Keep practising'], ['#/references', 'Evidence and sources'], ['#/more', 'More']] as const) {
    await page.goto(`./${hash}`);
    if (h1) await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
    else await expect(page.locator('main h1').first()).toBeVisible();
  }
  await expect(page.getByText(/Tele-MANAS 14416/)).toBeVisible();
  await check(page, 'r2-12-more');
});

async function answerAndShoot(page: Page) {
  // Week 2 Day 1 is the lesson: show it with its quick check answered.
  await page.goto('./#/session/w2d1');
  await expect(page.getByRole('region', { name: 'Quick check' })).toBeVisible();
  await page.getByRole('region', { name: 'Quick check' }).locator('label').nth(1).click();
  await expect(page.getByText(/Nothing in the message says this/)).toBeVisible();
  await page.getByRole('region', { name: 'Quick check' }).evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await check(page, 'r2-13-lesson-micro-check');
}

test('[SIMULATED phone] Progress: empty, then populated, with no empty legacy tiles', async ({ page }) => {
  await open(page, null, '#/welcome');
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await page.goto('./#/progress');
  await expect(page.getByText('Nothing recorded yet')).toBeVisible();
  await check(page, 'r2-14-progress-empty');

  await page.evaluate((s) => localStorage.setItem('equanim:store', JSON.stringify(s)), store({
    sessions: [...upTo(14).map((x, i) => (i === 9 ? { ...x, earlyStart: true } : x))],
    baselines: [{ id: 'bl_start', kind: 'start', ratings: { 'b-p1': 2, 'b-p2': 3, 'b-p3': 2, 'b-i1': 2, 'b-i2': 3, 'b-s1': 3, 'b-s2': 2, 'b-s3': 2, 'b-e1': 3, 'b-e2': 2 }, situations: ['A curt email', ''], completedAt: iso(20), updatedAt: iso(20) }],
    reviews: [
      { id: 'rev_w1', week: 1, worked: 'Writing down what happened first.', gotInWay: 'Busy mornings.', noticed: 'I replay short replies less.', rating: 3, catchUp: false, completedAt: iso(15), updatedAt: iso(15) },
      { id: 'rev_w2', week: 2, worked: 'One clarifying question.', gotInWay: '', noticed: 'Most guesses were wrong.', rating: 4, catchUp: false, completedAt: iso(8), updatedAt: iso(8) },
    ],
    plans: [
      { id: 'p1', date: key(18), domain: 'personalisation', valueId: 'calm', when: 'someone replies with one word', then: 'write down only what happened', outcome: 'tried', note: '', createdAt: iso(18), updatedAt: iso(18) },
      { id: 'p2', date: key(12), domain: 'inquiry', valueId: 'honesty', when: 'a message is unclear', then: 'ask one clarifying question', outcome: 'didnt-manage', note: '', createdAt: iso(12), updatedAt: iso(12) },
      { id: 'p3', date: key(0), domain: 'speech', valueId: null, when: 'I make a mistake', then: 'describe it as a fact plus a next step', outcome: null, note: '', createdAt: iso(0), updatedAt: iso(0) },
    ],
  }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your six weeks' })).toBeVisible();
  await expect(page.getByTestId('legacy-activity')).toHaveCount(0);
  await expect(page.getByTestId('early-line')).toHaveText('1 session done ahead of schedule. Spacing helps, but your pace is yours.');
  await check(page, 'r2-15-progress-populated');
});
