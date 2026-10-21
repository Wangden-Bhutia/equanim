/** Keyboard and layout checks at phone width in EMULATED Chromium (Pixel 7 profile). Not a real device or screen reader. */
import { test, expect, type Page } from '@playwright/test';

const onboard = async (page: Page) => {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.goto('./');
  await page.getByRole('button', { name: 'Look around without starting' }).click();
  await expect(page.getByText('Morning intention')).toBeVisible();
};

async function focusIsVisible(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return { ok: true, what: 'body' };
    const target = (el.matches('input.sr-only') ? (el.closest('label') as HTMLElement | null) : null) ?? el;
    const s = getComputedStyle(target);
    const ok = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
    return { ok, what: `${target.tagName} ${target.textContent?.slice(0, 40) ?? ''}` };
  });
}

test('keyboard: every focus stop on core screens has a visible focus indicator', async ({ page }) => {
  await onboard(page);
  for (const route of ['#/', '#/practise/p-one-word-reply', '#/journal/new?type=incident', '#/library/section-speech', '#/settings']) {
    await page.goto(`./${route}`);
    await page.reload();
    await page.locator('main h1').first().waitFor();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      const r = await focusIsVisible(page);
      expect(r.ok, `${route}: no visible focus on ${r.what}`).toBe(true);
    }
  }
});

test('keyboard: skip link, then complete a scenario without a mouse', async ({ page }) => {
  await onboard(page);
  await page.goto('./#/practise/p-traffic-horn');
  await page.reload();
  await page.locator('main h1').first().waitFor();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  // With hash routing, a plain #main link would navigate away; the skip link must only move focus.
  await expect(page.locator('main')).toBeFocused();
  await expect(page.getByRole('heading', { level: 1, name: 'The horn in traffic' })).toBeVisible();
  const first = page.getByRole('group', { name: 'Possible responses' }).getByRole('button').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[aria-labelledby="fb-h"]')).toBeFocused(); // focus moves to the feedback
  await page.getByRole('button', { name: 'Mark scenario complete' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Scenario completed' })).toBeFocused();
});

test('narrow width: nothing hidden behind the bottom navigation, no overflow, no layout shift on load', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await onboard(page);
  for (const route of ['#/', '#/practise', '#/journal', '#/library', '#/progress', '#/settings', '#/more', '#/practise/a-landlord-call', '#/programme', '#/plan', '#/session/taster']) {
    await page.goto(`./${route}`);
    await page.locator('main h1').first().waitFor();
    // Scroll until the page is really at the bottom (fonts and lazy layout can still grow it after the first scroll).
    await expect.poll(() => page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      return Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    })).toBe(true);
    const r = await page.evaluate(() => {
      const nav = document.querySelectorAll('nav[aria-label="Primary"]');
      const bar = nav[nav.length - 1]!.getBoundingClientRect();
      const main = document.querySelector('main')!;
      const items = Array.from(main.querySelectorAll('a, button, input, textarea, p, h2')).filter((e) => (e as HTMLElement).offsetParent);
      const last = items[items.length - 1]!.getBoundingClientRect();
      return { lastBottom: last.bottom, barTop: bar.top, overflow: document.documentElement.scrollWidth - window.innerWidth };
    });
    expect(r.overflow, route).toBeLessThanOrEqual(0);
    expect(r.lastBottom, `${route}: last content is behind the bottom bar`).toBeLessThanOrEqual(r.barTop);
  }
  // Cumulative layout shift while Today loads.
  await page.goto('./#/');
  const cls = await page.evaluate(() => new Promise<number>((resolve) => {
    let total = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) total += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve(total), 1000);
  }));
  expect(cls).toBeLessThan(0.1);
});

test('touch targets: interactive controls are at least 44px tall on core screens', async ({ page }) => {
  await onboard(page);
  for (const route of ['#/', '#/practise', '#/journal', '#/settings', '#/practise/p-one-word-reply', '#/programme', '#/plan', '#/session/taster']) {
    await page.goto(`./${route}`);
    await page.locator('main h1').first().waitFor();
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main button, main a.btn-primary, main a.btn-secondary, nav a'))
        .filter((e) => (e as HTMLElement).offsetParent)
        .map((e) => ({ t: (e.textContent ?? '').trim().slice(0, 30), h: e.getBoundingClientRect().height }))
        .filter((x) => x.h < 44));
    expect(small, route).toEqual([]);
  }
});
