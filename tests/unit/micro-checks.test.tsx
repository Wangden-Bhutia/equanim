/** Round 2 §2.2: a micro-check in every lesson, and self-commit taps in Think mode stored as thinkResponses. */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { MICRO_CHECKS, SESSIONS } from '../../src/data/programme';
import type { AppData } from '../../src/types';

const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (...ids: string[]) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: yesterday(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));

describe('micro-checks content', () => {
  it('every lesson session in the programme has one or two checks, each with feedback on every option', () => {
    const lessons = SESSIONS.filter((s) => s.lesson);
    expect(lessons.map((s) => s.id)).toEqual(['w1d1', 'w2d1', 'w3d1', 'w4d1', 'w5d1']);
    for (const s of lessons) {
      const cs = MICRO_CHECKS[s.id] ?? [];
      expect(cs.length, s.id).toBeGreaterThanOrEqual(1);
      expect(cs.length, s.id).toBeLessThanOrEqual(2);
      for (const c of cs) {
        expect(c.options.some((o) => o.id === c.answerId)).toBe(true);
        for (const o of c.options) expect(o.feedback.length).toBeGreaterThan(20);
      }
      expect(s.notThis, s.id).toBeTruthy();
    }
  });
});

describe('Think mode', () => {
  it('records self-commit taps as thinkResponses, and typing is never required', async () => {
    const d: AppData = { ...emptyData(), onboardingCompletedAt: yesterday(), programme: { startedAt: yesterday(), disclaimerSeenAt: yesterday(), maintenanceStartedAt: null, noticeDismissedAt: yesterday() }, sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5', 'w1d6') };
    localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
    window.location.hash = '#/session/w2d1';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Nothing needs to be typed/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    const [first, second] = screen.getAllByRole('radio', { name: 'I have one in mind' });
    await u.click(first!);
    await u.click(screen.getAllByRole('radio', { name: 'Nothing came up' })[1]!);
    expect(second).toBeDefined();
    await u.click(screen.getByRole('radio', { name: 'She must be unhappy with my work.' }));
    await u.click(screen.getByRole('button', { name: 'Complete session' }));
    const rec = (JSON.parse(localStorage.getItem(STORE_KEY)!) as { data: AppData }).data.sessions.find((s) => s.sessionId === 'w2d1')!;
    expect(rec.thinkResponses).toEqual({ guess: 'have-one', check: 'nothing' });
    expect(rec.choices['mc-w2d1']).toBe('b');
  });
});
