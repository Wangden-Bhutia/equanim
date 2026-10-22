/** Round 2 §2.1: one new session per calendar day, an explicit override recorded as earlyStart, and no penalty for gaps. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { withSession } from '../../src/app/store';
import { dateKey } from '../../src/engine/dates';
import { currentSessionId, earlyCount, opensOn, wouldBeEarly, dueRecall, recordRecall } from '../../src/engine/programme';
import type { AppData } from '../../src/types';

const iso = (day: string, h = 9) => new Date(`${day}T${String(h).padStart(2, '0')}:00:00`).toISOString();
const enrolled = (): AppData => ({ ...emptyData(), onboardingCompletedAt: iso('2026-10-01'), programme: { startedAt: iso('2026-10-01'), disclaimerSeenAt: null, maintenanceStartedAt: null, noticeDismissedAt: iso('2026-10-01') } });
const complete = (d: AppData, id: string, day: string, h = 9) => withSession(d, id, 'think', {}, {}, iso(day, h));

describe('calendar pacing (engine)', () => {
  it('after a session, the next one opens tomorrow; on the next day it is open', () => {
    let d = complete(enrolled(), 'w0d0', '2026-10-01');
    expect(currentSessionId(d)).toBe('w1d1');
    expect(opensOn(d, '2026-10-01')).toBe('2026-10-02');
    expect(wouldBeEarly(d, 'w1d1', '2026-10-01')).toBe(true);
    expect(opensOn(d, '2026-10-02')).toBeNull();
    d = complete(d, 'w1d1', '2026-10-02');
    expect(d.sessions.find((s) => s.sessionId === 'w1d1')?.earlyStart).toBe(false);
  });
  it('after a 10-day gap the next session is simply open, with nothing reset or skipped', () => {
    const d = complete(complete(enrolled(), 'w0d0', '2026-10-01'), 'w1d1', '2026-10-02');
    expect(opensOn(d, '2026-10-12')).toBeNull();
    expect(currentSessionId(d)).toBe('w1d2');
    expect(d.sessions).toHaveLength(2);
  });
  it('the override records earlyStart: true, once, and editing later does not change it', () => {
    let d = complete(enrolled(), 'w0d0', '2026-10-01');
    d = complete(d, 'w1d1', '2026-10-01', 11);
    const rec = d.sessions.find((s) => s.sessionId === 'w1d1')!;
    expect(rec.earlyStart).toBe(true);
    expect(earlyCount(d)).toBe(1);
    d = withSession(d, 'w1d1', 'write', { a: 'later' }, {}, iso('2026-10-05'));
    expect(d.sessions.find((s) => s.sessionId === 'w1d1')?.earlyStart).toBe(true);
    expect(d.sessions.find((s) => s.sessionId === 'w1d1')?.completedAt).toBe(rec.completedAt);
  });
  it('revisiting a done session, the taster and maintenance are never gated', () => {
    let d = complete(enrolled(), 'w0d0', '2026-10-01');
    expect(wouldBeEarly(d, 'w0d0', '2026-10-01')).toBe(false);
    expect(wouldBeEarly(d, 'taster', '2026-10-01')).toBe(false);
    d = { ...d, programme: { ...d.programme!, maintenanceStartedAt: iso('2026-10-01') } };
    expect(opensOn(d, '2026-10-01')).toBeNull();
  });
  it('spaced recall stays on calendar days from first exposure, even when sessions were done early', () => {
    let r = recordRecall([], 'rq-p-1', '2026-10-01', true, iso('2026-10-01'));
    r = recordRecall(r, 'rq-p-3', '2026-10-01', true, iso('2026-10-01'));
    const d = { ...enrolled(), recall: r };
    expect(dueRecall(d, '2026-10-02')).toEqual([]);
    expect(dueRecall(d, '2026-10-03')).toEqual(['rq-p-1', 'rq-p-3']);
  });
});

describe('calendar pacing (screens, faked clock)', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-02T09:00:00')); });
  afterEach(() => vi.useRealTimers());
  const seed = (d: AppData) => localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
  const stored = () => (JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { data: AppData }).data;

  it('Today shows "opens tomorrow" with the date; the override is confirmed once and recorded', async () => {
    seed(complete(complete(enrolled(), 'w0d0', '2026-10-01'), 'w1d1', '2026-10-02', 8));
    window.location.hash = '#/';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Next session opens tomorrow, /)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Start session/ })).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Do the next one now anyway' }));
    expect(screen.getByText(/Spacing sessions across days helps the learning stick/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Start it now' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Spot the added meaning' })).toBeInTheDocument();
    for (const name of ['He’s still angry about the parking.', 'They think my ideas are useless.']) await u.click(screen.getByRole('radio', { name }));
    await u.click(screen.getByRole('radio', { name: /"He said I look tired/ }));
    await u.click(screen.getByRole('button', { name: 'Complete session' }));
    expect(stored().sessions.find((s) => s.sessionId === 'w1d2')?.earlyStart).toBe(true);
  });
  it('a deep link to the next session shows "Opens tomorrow" instead of the content', async () => {
    seed(complete(complete(enrolled(), 'w0d0', '2026-10-01'), 'w1d1', '2026-10-02', 8));
    window.location.hash = '#/session/w1d2';
    render(<App />);
    expect(await screen.findByText('Opens tomorrow')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete session' })).not.toBeInTheDocument();
  });
  it('the next day, Today shows the session as ready', async () => {
    seed(complete(complete(enrolled(), 'w0d0', '2026-09-30'), 'w1d1', '2026-10-01'));
    window.location.hash = '#/';
    render(<App />);
    expect(await screen.findByRole('link', { name: /Start session/ })).toBeInTheDocument();
    expect(dateKey()).toBe('2026-10-02');
  });
});
