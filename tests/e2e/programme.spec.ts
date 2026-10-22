/**
 * The full 6-week programme, Day 0 to maintenance, end to end in EMULATED Chromium (Pixel 7 profile; not a real device).
 * axe runs on every screen at 390x844 in light and dark, and at 360px wide.
 * Set PROG_SHOTS (Weeks 0–1) and PROG2_SHOTS (Weeks 2–6, finish, maintenance) to folders to save screenshots.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

let SHOTS = process.env.PROG_SHOTS;
const SHOTS2 = process.env.PROG2_SHOTS;
test.setTimeout(900000);

async function axe(page: Page, where: string) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${where}: ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

/** Checks (and optionally photographs) the current screen in light and dark at 390x844, and at 360px wide. */
async function check(page: Page, name: string, opts: { narrow?: boolean; fullPage?: boolean } = {}) {
  if (process.env.E2E_TRACE) console.log(`check ${name} ${new Date().toISOString()}`);
  const fullPage = opts.fullPage ?? true;
  const variants: { scheme: 'light' | 'dark'; width: number; suffix: string }[] = [
    { scheme: 'light', width: 390, suffix: '390-light' },
    { scheme: 'dark', width: 390, suffix: '390-dark' },
    { scheme: 'light', width: 360, suffix: '360-light' },
  ];
  for (const v of variants) {
    await page.setViewportSize({ width: v.width, height: 844 });
    await page.emulateMedia({ colorScheme: v.scheme });
    await expect(page.locator('html')).toHaveAttribute('data-theme', v.scheme);
    // Let colour transitions settle so contrast is never sampled mid-change.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${name} @${v.suffix}: horizontal overflow`).toBeLessThanOrEqual(0);
    await axe(page, `${name} @${v.suffix}`);
    if (SHOTS && (v.width === 390 || opts.narrow)) {
      fs.mkdirSync(SHOTS, { recursive: true });
      // What the phone screen shows.
      await page.screenshot({ path: `${SHOTS}/${name}-${v.suffix}.png` });
      // The whole page, with the bottom bar unpinned for the capture only (a fixed bar would otherwise be painted mid-page).
      if (fullPage) {
        const style = await page.addStyleTag({ content: 'nav[aria-label="Primary"]{position:static!important}' });
        await page.screenshot({ path: `${SHOTS}/${name}-${v.suffix}-full.png`, fullPage: true });
        await style.evaluate((el) => el.remove());
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
}

const startNext = async (page: Page) => {
  await page.goto('./#/programme');
  await page.goto('./#/');
  await page.getByRole('link', { name: 'Start session' }).click();
};

/** Faked clock: the path advances one calendar day per session, as the programme intends. */
let dayN = 0;
const START = new Date(2026, 10, 2, 8, 0, 0);
const nextDay = async (page: Page) => { dayN += 1; await page.clock.setSystemTime(new Date(START.getFullYear(), START.getMonth(), START.getDate() + dayN, 8, 0, 0)); };

/** Answers the lesson's quick check, if it has one, so Complete appears. Any answer counts. */
const answerCheck = async (page: Page) => {
  const q = page.getByRole('region', { name: 'Quick check' });
  if (await q.count()) await q.first().locator('label').nth(1).click();
};

const makePlan = async (page: Page, valueName?: string) => {
  await page.goto('./#/plan');
  await page.getByRole('button', { name: /Use a suggested plan/ }).click();
  if (valueName) await page.locator('label').filter({ hasText: new RegExp(`^${valueName}`) }).click();
  await page.getByRole('button', { name: /Save plan|Update plan/ }).click();
};

test('[SIMULATED phone] full 6-week path with a faked clock, one day per session: welcome → Day 0 → Weeks 1–6 → finish → maintenance', async ({ page }) => {
  dayN = 0;
  await page.clock.install({ time: START });
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');

  // Welcome
  await expect(page.getByRole('heading', { level: 1, name: /Respond, rather than react/ })).toBeVisible();
  await expect(page.getByText(/Tele-MANAS 14416/)).toBeVisible();
  await check(page, '01-onboarding-welcome', { narrow: true });
  await page.getByRole('button', { name: 'Begin Day 0' }).click();

  // Day 0: values
  await expect(page.getByRole('heading', { level: 1, name: 'Your values' })).toBeVisible();
  for (const v of ['Honesty', 'Calm', 'Kindness']) await page.locator('label').filter({ hasText: new RegExp(`^${v}$`) }).click();
  await page.getByRole('textbox', { name: 'Honesty' }).fill('Say what I actually mean in meetings.');
  await page.getByRole('textbox', { name: 'Calm' }).fill('Take one breath before replying to a sharp message.');
  await page.getByRole('textbox', { name: 'Kindness' }).fill('Call my mother on Sunday and listen.');
  await check(page, '02-day0-values', { narrow: true });
  await page.getByRole('button', { name: 'Save and continue' }).click();

  // Day 0: baseline
  await expect(page.getByRole('heading', { level: 1, name: 'Where you are starting' })).toBeVisible();
  const groups = page.locator('main fieldset');
  const n = await groups.count();
  for (let i = 0; i < n; i++) await groups.nth(i).locator('label').nth((i % 4) + 1).click();
  await page.getByLabel(/Describe a recent situation/).fill('A colleague replied "fine." and I spent the evening replaying it.');
  await check(page, '03-day0-baseline', { narrow: true });
  await page.getByRole('button', { name: 'Finish Day 0' }).click();

  // No blocking dialog: a one-line notice on Today, and Week 1 opens tomorrow.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const notice = page.getByTestId('independence-notice');
  await expect(notice).toBeVisible();
  await notice.getByRole('button', { name: 'Read more' }).click();
  await check(page, '04-notice-expanded', { fullPage: false });
  await expect(page.getByTestId('session-gated')).toBeVisible();
  await check(page, '05a-today-gated', { narrow: true });
  await notice.getByRole('button', { name: 'Got it' }).click();
  await expect(notice).toHaveCount(0);

  // Next day: Week 1 is open.
  await nextDay(page);
  await page.goto('./#/programme');
  await page.goto('./#/');
  await expect(page.getByText('Week 1 · Day 1 of 42')).toBeVisible();
  await expect(page.getByTestId('session-ready')).toBeVisible();
  await check(page, '05-today-new-user', { narrow: true });

  // If-then builder with value chips
  await page.getByRole('link', { name: /Morning plan/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Today’s if-then plan' })).toBeVisible();
  await page.getByRole('button', { name: /Use a suggested plan/ }).click();
  await page.locator('label').filter({ hasText: /^Calm/ }).click();
  await check(page, '06-if-then-builder', { narrow: true });
  await page.getByRole('button', { name: 'Save plan' }).click();

  // Week 1, Day 1: Understand, with a quick check
  await startNext(page);
  await expect(page.getByText(/Week 1 · Day 1 of 42 · Understand/)).toBeVisible();
  await expect(page.getByTestId('check-first')).toBeVisible();
  await answerCheck(page);
  await check(page, '07-w1d1-understand');
  await page.getByRole('button', { name: 'Complete session' }).click();
  await expect(page.getByTestId('completion-moment')).toBeVisible();
  await check(page, '07b-completion-moment', { fullPage: false });

  // Day 2: Recognise
  await nextDay(page);
  await startNext(page);
  await expect(page.getByText(/Day 2 of 42 · Recognise/)).toBeVisible();
  await page.locator('main fieldset').nth(1).locator('label').first().click();
  await check(page, '08-w1d2-recognise');
  await page.getByRole('button', { name: 'Complete session' }).click();

  // Day 3: Rehearse, in "Write it down" mode
  await nextDay(page);
  await startNext(page);
  await expect(page.getByText(/Day 3 of 42 · Rehearse/)).toBeVisible();
  await page.locator('label').filter({ hasText: 'Write it down' }).click();
  await page.locator('main textarea').first().fill('“I may be reading too much into this.”');
  await check(page, '09-w1d3-rehearse-write');
  await page.getByRole('button', { name: 'Complete session' }).click();

  // A plan for today, then the evening check, and Today mid-week (gated)
  await makePlan(page, 'Honesty');
  await page.goto('./#/');
  const ev = page.getByRole('region', { name: 'Evening check' });
  await expect(ev.getByTestId('plan-value')).toHaveText('You planned this for Honesty.');
  await ev.locator('label').filter({ hasText: 'I didn’t manage it' }).click();
  await ev.getByLabel(/A note/).fill('Replied straight away. Noticed afterwards.');
  await ev.getByRole('button', { name: 'Save evening check' }).click();
  await expect(ev.getByText(/useful information, not a verdict/)).toBeVisible();
  await ev.scrollIntoViewIfNeeded();
  await check(page, '10-evening-check', { narrow: true, fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByText('Week 1 · Day 4 of 42')).toBeVisible();
  await check(page, '11-today-mid-week', { narrow: true });

  // Day 4: Apply (this week has plans, so Complete is enabled)
  await nextDay(page);
  await startNext(page);
  await expect(page.getByText(/Day 4 of 42 · Apply/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete session' })).toBeEnabled();
  await check(page, '12-w1d4-apply');
  await page.getByRole('button', { name: 'Complete session' }).click();

  // Day 5: Retrieve and extend
  await nextDay(page);
  await startNext(page);
  await expect(page.getByText(/Day 5 of 42 · Retrieve/)).toBeVisible();
  await page.locator('main fieldset').nth(1).locator('label').nth(1).click();
  await check(page, '13-w1d5-retrieve');
  await page.getByRole('button', { name: 'Complete session' }).click();

  // Day 6: Weekly review
  await nextDay(page);
  await startNext(page);
  await expect(page.getByRole('heading', { level: 1, name: /Week 1 review/ })).toBeVisible();
  await expect(page.getByTestId('review-values')).toContainText('Honesty: 1 plan');
  await page.getByLabel('What worked this week?').fill('Writing down what happened before what it meant.');
  await page.getByLabel('What got in the way?').fill('Busy mornings.');
  await page.locator('label').filter({ hasText: /^4/ }).last().click();
  await check(page, '14-weekly-review', { narrow: true });
  await page.getByRole('button', { name: 'Complete review' }).click();
  await expect(page.getByText('Week 1 review saved')).toBeVisible();
  await expect(page.getByTestId('moment-idea')).toBeVisible();
  await check(page, '14b-review-moment', { fullPage: false });

  await nextDay(page); // Day 7: rest
  await nextDay(page);
  await page.goto('./#/programme');
  await page.goto('./#/');
  await expect(page.getByText('Week 2 · Day 8 of 42')).toBeVisible();
  await check(page, '15-today-week1-done');

  // Everything is saved under the store key; the 1.0 key is never written.
  const saved = await page.evaluate(() => ({ store: JSON.parse(localStorage.getItem('equanim:store') ?? 'null'), legacy: localStorage.getItem('equanim:data') }));
  expect(saved.legacy).toBeNull();
  expect(saved.store.schemaVersion).toBe(5);
  expect(saved.store.data.sessions.map((s: { sessionId: string }) => s.sessionId)).toEqual(['w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5', 'w1d6']);
  expect(saved.store.data.sessions.every((s: { earlyStart: boolean }) => s.earlyStart === false)).toBe(true);
  expect(saved.store.data.plans.map((p: { valueId: string | null }) => p.valueId)).toEqual(['calm', 'honesty']);
  expect(saved.store.data.plans[1]).toMatchObject({ outcome: 'didnt-manage' });

  // ---------- Weeks 2–6, every session, one per day, through Today ----------
  SHOTS = SHOTS2;
  const shotAt: Record<string, string> = { w2d1: '31-w2d1-inquiry-understand', w3d3: '32-w3d3-speech-rehearse', w4d4: '33-w4d4-effort-apply', w5d2: '34-w5d2-integration', w5d4: '35-w5d4-hardest-situation' };
  for (let week = 2; week <= 6; week++) {
    for (let day = 1; day <= 6; day++) {
      const id = `w${week}d${day}`;
      if (day === 1) await makePlan(page); // a real plan each week, for Apply and the review
      await startNext(page);
      if (day === 6) {
        await expect(page.getByRole('heading', { level: 1, name: new RegExp(`Week ${week} review`) })).toBeVisible();
        await page.getByLabel('What worked this week?').fill(`Week ${week}: catching it earlier.`);
        await page.getByRole('button', { name: 'Complete review' }).click();
        await expect(page.getByText(week === 6 ? 'Six weeks complete' : `Week ${week} review saved`)).toBeVisible();
        if (week === 6) await check(page, '36b-week6-moment', { fullPage: false });
        await nextDay(page); // rest day
        await nextDay(page);
        continue;
      }
      if (id === 'w6d1') {
        await expect(page.getByRole('heading', { level: 1, name: 'Where you are now' })).toBeVisible();
        const g = page.locator('main fieldset');
        const k = await g.count();
        for (let i = 0; i < k; i++) await g.nth(i).locator('label').nth(Math.min(4, (i % 4) + 2)).click();
        await page.getByRole('button', { name: 'Save today’s snapshot' }).click();
        await expect(page.getByTestId('session-gated')).toBeVisible();
        await nextDay(page);
        continue;
      }
      await expect(page.getByText(new RegExp(`Week ${week} · Day ${(week - 1) * 7 + day} of 42`))).toBeVisible();
      await answerCheck(page);
      const ta = page.locator('main textarea');
      if (id === 'w6d4' || id === 'w6d5') {
        await page.locator('label').filter({ hasText: 'Write it down' }).click();
        await ta.first().fill(id === 'w6d4' ? 'Dear me in six months: you know how to pause. Use it.' : 'Three short sessions a week: Monday, Wednesday, Saturday.', { timeout: 10000 });
      }
      if (id === 'w6d2') await check(page, '36-w6d2-compare');
      if (shotAt[id]) await check(page, shotAt[id]);
      await page.getByRole('button', { name: 'Complete session' }).click();
      await expect(page.getByText('Session complete')).toBeVisible();
      await nextDay(page);
    }
  }

  // Finish: side by side, evidence of change, letter, plan, then maintenance
  await page.goto('./#/finish');
  await expect(page.getByText('Day 0').first()).toBeVisible();
  await expect(page.getByTestId('finish-early')).toHaveCount(0);
  await check(page, '37-finish-comparison');
  await page.getByRole('button', { name: 'Start maintenance mode' }).first().click();
  await page.goto('./#/');
  await expect(page.getByText(/Maintenance · \d of 3 this week/)).toBeVisible();
  await check(page, '38-maintenance-today');
  await page.goto('./#/progress');
  await expect(page.getByRole('navigation', { name: 'Your six-week journey' }).getByRole('link')).toHaveCount(6);
  await check(page, '39-progress-journey-map');
  await page.goto('./#/evidence');
  await expect(page.getByRole('heading', { level: 1, name: 'Evidence and sources' })).toBeVisible();
  await check(page, '40-evidence');
  await page.goto('./#/about');
  await expect(page.getByRole('heading', { name: 'The six-week path' })).toBeVisible();
  await check(page, '41-about');
  await page.goto('./#/phrases');
  await check(page, '42-phrases');

  const end = await page.evaluate(() => ({ store: JSON.parse(localStorage.getItem('equanim:store') ?? 'null'), legacy: localStorage.getItem('equanim:data') }));
  expect(end.legacy).toBeNull();
  expect(end.store.data.sessions).toHaveLength(37);
  expect(end.store.data.sessions.filter((s: { earlyStart: boolean }) => s.earlyStart)).toHaveLength(0);
  expect(end.store.data.reviews).toHaveLength(6);
  expect(end.store.data.reviews.every((r: { catchUp: boolean }) => !r.catchUp)).toBe(true);
  expect(end.store.data.baselines.map((b: { kind: string }) => b.kind).sort()).toEqual(['finish', 'start']);
  expect(end.store.data.programme.maintenanceStartedAt).toBeTruthy();
  SHOTS = process.env.PROG_SHOTS;
});

test('[SIMULATED phone] taster, then the programme offer for an existing 1.1 user', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
  await page.getByRole('link', { name: 'Try a 2-minute taster first' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The camera view' })).toBeVisible();
  await check(page, '16-taster');
  await page.goto('./#/welcome');
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await expect(page.getByRole('heading', { name: /6-week programme/ })).toBeVisible();
  await check(page, '17-today-existing-user-offer');
});
