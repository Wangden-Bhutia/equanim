// Renders the SVG icons to the PNG sizes the web manifest needs. Run: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const jobs = [
  ['public/icon.svg', 192, 'public/icon-192.png'],
  ['public/icon.svg', 512, 'public/icon-512.png'],
  // Maskable: full-bleed background, symbol inside the central 80% safe zone.
  ['public/icon-maskable.svg', 512, 'public/icon-maskable-512.png'],
];
const browser = await chromium.launch();
for (const [src, size, out] of jobs) {
  const svg = readFileSync(src, 'utf8');
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg', `<svg width="${size}" height="${size}"`)}</body></html>`);
  await page.screenshot({ path: out, omitBackground: true });
  await page.close();
}
await browser.close();
