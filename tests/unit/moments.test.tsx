/** Round 2 §2.8: completion moments are calm, typed, non-repeating, and text-only under reduced motion. */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { MOMENT_LINES, momentLine } from '../../src/data/programme/moments';
import type { AppData } from '../../src/types';

const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (...ids: string[]) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: yesterday(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));

describe('completion moments', () => {
  it('lines never repeat back to back within a type, and use no streak, points or badge language', () => {
    for (const [type, pool] of Object.entries(MOMENT_LINES)) {
      if (pool.length > 1) for (let i = 0; i < 6; i++) expect(momentLine(type as never, i)).not.toBe(momentLine(type as never, i + 1));
      for (const l of pool) expect(l).not.toMatch(/streak|points?\b|badge|level up|amazing|awesome|🎉/i);
    }
  });
  it('the stylesheet keeps the animation within 600 ms and hides the icon under reduced motion', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/styles/index.css'), 'utf8');
    for (const m of css.matchAll(/(\d+)ms(?: (\d+)ms)?/g)) expect(Number(m[1]) + Number(m[2] ?? 0)).toBeLessThanOrEqual(600);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*{\s*\.moment-icon { display: none; }/);
  });
  it('after a session, shows the moment with a line for its type', async () => {
    const d: AppData = { ...emptyData(), onboardingCompletedAt: yesterday(), programme: { startedAt: yesterday(), disclaimerSeenAt: yesterday(), maintenanceStartedAt: null, noticeDismissedAt: yesterday() }, sessions: ses('w0d0', 'w1d1', 'w1d2') };
    localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
    window.location.hash = '#/session/w1d3';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByTestId('session-mark')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Complete session' }));
    const m = await screen.findByTestId('completion-moment');
    expect(MOMENT_LINES.rehearse).toContain(m.querySelector('p:not([role])')?.textContent);
  });
});
