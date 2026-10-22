import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/** WCAG 2.x contrast of the per-skill accent colours, read from the real stylesheet, in light and dark. */
const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/index.css'), 'utf8');

function block(selector: string): string {
  const i = css.indexOf(selector);
  if (i === -1) throw new Error(`no ${selector}`);
  return css.slice(i, css.indexOf('}', i));
}
function rgb(b: string, name: string): [number, number, number] {
  const m = new RegExp(`--${name}:\\s*(\\d+) (\\d+) (\\d+);`).exec(b);
  if (!m) throw new Error(`no --${name}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
const lum = ([r, g, b]: number[]) => {
  const c = [r!, g!, b!].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
const contrast = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x! + 0.05) / (y! + 0.05); };

describe('per-skill accent colours', () => {
  for (const [theme, sel] of [['light', ':root'], ['dark', "[data-theme='dark']"]] as const) {
    it(`have at least 4.5:1 contrast on the page and card backgrounds (${theme})`, () => {
      const b = block(sel);
      for (const d of ['speech', 'personalisation', 'inquiry', 'effort']) {
        for (const bg of ['bg', 'surface']) {
          const c = contrast(rgb(b, `d-${d}`), rgb(b, bg));
          expect(c, `${theme} ${d} on ${bg}: ${c.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    });
  }
});

describe('journey map and completion marks (Round 2)', () => {
  for (const [theme, sel] of [['light', ':root'], ['dark', "[data-theme='dark']"]] as const) {
    it(`a done node's check (surface on skill colour, on-accent on accent) has at least 4.5:1 contrast (${theme})`, () => {
      const b = block(sel);
      for (const d of ['speech', 'personalisation', 'inquiry', 'effort']) {
        const c = contrast(rgb(b, 'surface'), rgb(b, `d-${d}`));
        expect(c, `${theme} check on ${d}: ${c.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(rgb(b, 'on-accent'), rgb(b, 'accent'))).toBeGreaterThanOrEqual(4.5);
    });
    it(`the completion check (accent on accent-soft) and node rings are visible (${theme})`, () => {
      const b = block(sel);
      expect(contrast(rgb(b, 'accent'), rgb(b, 'accent-soft'))).toBeGreaterThanOrEqual(4.5);
      // Upcoming nodes are outlined in --line on --surface; their label text carries the meaning, and the ring is decorative.
      for (const d of ['speech', 'personalisation', 'inquiry', 'effort']) expect(contrast(rgb(b, `d-${d}`), rgb(b, 'surface'))).toBeGreaterThanOrEqual(3);
    });
  }
});
