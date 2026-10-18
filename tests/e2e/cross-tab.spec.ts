import { test, expect, type Page } from '@playwright/test';

/**
 * Real Chromium, several tabs (pages) of one browser context: real localStorage, real `storage` events, real
 * BroadcastChannel and real Web Locks. The "1.0 tab" is SIMULATED: a page that writes a whole 1.0 document to
 * Equanim 1.0's key exactly as 1.0's Repository.save does. Not a real phone.
 */
const v1 = () => {
  const t = '2026-10-02T09:00:00.000Z';
  return {
    schemaVersion: 1, createdAt: t, onboardingCompletedAt: t, settings: { displayName: 'Asha', streaksEnabled: false, theme: 'light' },
    intentions: [], attempts: [], library: [],
    journal: [{ id: 'jrn_seed', createdAt: t, updatedAt: t, domain: null, scenarioId: null, situation: 'Seed entry from 1.0', story: '', response: '', nextTime: '', note: '' }],
  };
};

async function write(page: Page, text: string) {
  await page.goto('./#/journal/new?type=free');
  await page.getByLabel('Reflection').fill(text);
  await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText(text)).toBeVisible();
}

test('[real Chromium, simulated 1.0 tab] tabs never overwrite each other, and a 1.0 whole-store write is merged', async ({ context }) => {
  const a = await context.newPage();
  await a.goto('./');
  await a.evaluate((d) => { localStorage.clear(); localStorage.setItem('equanim:data', JSON.stringify(d)); }, v1());
  await a.reload();
  await expect(a.getByText('Morning intention')).toBeVisible();
  expect(await a.evaluate(() => 'locks' in navigator)).toBe(true); // the Web Locks path is the one under test
  const b = await context.newPage();
  await b.goto('./#/journal');
  await expect(b.getByText('Seed entry from 1.0')).toBeVisible();

  await write(a, 'Written in tab A');
  await write(b, 'Written in tab B'); // B never reloaded
  // A tab still running 1.0 writes its old whole-store copy (it has never seen A's or B's entries).
  const old = await context.newPage();
  await old.goto('./#/privacy');
  await old.evaluate((d) => {
    d.journal.push({ id: 'jrn_old', createdAt: '2026-10-18T08:00:00.000Z', updatedAt: '2026-10-18T08:00:00.000Z', domain: null, scenarioId: null, situation: 'Written in a 1.0 tab', story: '', response: '', nextTime: '', note: '' });
    localStorage.setItem('equanim:data', JSON.stringify(d));
  }, v1());

  await a.goto('./#/journal');
  for (const t of ['Seed entry from 1.0', 'Written in tab A', 'Written in tab B', 'Written in a 1.0 tab']) await expect(a.getByText(t)).toBeVisible();
  const fresh = await context.newPage();
  await fresh.goto('./#/journal');
  for (const t of ['Seed entry from 1.0', 'Written in tab A', 'Written in tab B', 'Written in a 1.0 tab']) await expect(fresh.getByText(t)).toBeVisible();
  // 1.1 never rewrote the 1.0 key; the exact original before the upgrade was kept.
  const keys = await fresh.evaluate(() => Object.keys(localStorage));
  expect(keys.some((k) => k.startsWith('equanim:pre-migration:v1:'))).toBe(true);
  expect(await fresh.evaluate(() => JSON.parse(localStorage.getItem('equanim:data')!).schemaVersion)).toBe(1);
});
