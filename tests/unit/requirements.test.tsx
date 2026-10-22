/** Round 2 §2.1: Day 4 Apply needs a real plan; the weekly review needs a real-life attempt, or is a labelled catch-up. */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { addDays, dateKey } from '../../src/engine/dates';
import { applyReady, weekHasPractice } from '../../src/engine/programme';
import type { AppData } from '../../src/types';

const now = () => new Date().toISOString();
const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (...ids: string[]) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: yesterday(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));
const plan = (date: string) => ({ id: `p_${date}`, date, domain: null, valueId: null, when: 'a', then: 'b', outcome: null, note: '', createdAt: now(), updatedAt: now() });
const enrolled = (extra: Partial<AppData> = {}): AppData => ({ ...emptyData(), onboardingCompletedAt: now(), programme: { startedAt: yesterday(), disclaimerSeenAt: now(), maintenanceStartedAt: null, noticeDismissedAt: now() }, ...extra });
const seed = (d: AppData) => localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
const stored = () => (JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { data: AppData }).data;

beforeEach(() => { window.location.hash = '#/'; });

describe('engine', () => {
  it('Apply is ready with a plan made today or earlier in the week, not one from before the week', () => {
    const today = dateKey();
    const base = enrolled({ sessions: ses('w0d0', 'w1d1') });
    expect(applyReady(base, 1, today)).toBe(false);
    expect(applyReady({ ...base, plans: [plan(addDays(today, -5))] }, 1, today)).toBe(false);
    expect(applyReady({ ...base, plans: [plan(today)] }, 1, today)).toBe(true);
    expect(applyReady({ ...base, plans: [plan(addDays(today, -1))] }, 1, today)).toBe(true);
  });
  it('the review counts a plan or an evening reflection', () => {
    const today = dateKey();
    const base = enrolled({ sessions: ses('w0d0', 'w1d1') });
    expect(weekHasPractice(base, 1, today)).toBe(false);
    const refl = { id: 'r', date: today, happened: 'x', initial: '', did: '', alternative: '', nextTime: '', createdAt: now(), updatedAt: now() };
    expect(weekHasPractice({ ...base, reflections: [refl] }, 1, today)).toBe(true);
  });
});

describe('Day 4 Apply', () => {
  it('keeps Complete disabled until a plan exists, links to /plan, and "I’ll do this later" leaves without completing', async () => {
    seed(enrolled({ sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3') }));
    window.location.hash = '#/session/w1d4';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByTestId('apply-needs-plan')).toHaveTextContent('Make today’s plan first');
    expect(screen.getByRole('button', { name: 'Complete session' })).toBeDisabled();
    expect(screen.getByRole('link', { name: /Make today’s plan/ })).toHaveAttribute('href', '#/plan?from=w1d4');
    await u.click(screen.getByRole('link', { name: 'I’ll do this later' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Today' })).toBeInTheDocument();
    expect(stored().sessions.some((s) => s.sessionId === 'w1d4')).toBe(false);
  });
  it('enables Complete once there is a plan this week', async () => {
    seed(enrolled({ sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3'), plans: [plan(dateKey())] }));
    window.location.hash = '#/session/w1d4';
    render(<App />);
    expect(await screen.findByRole('button', { name: 'Complete session' })).toBeEnabled();
  });
});

describe('weekly review', () => {
  it('without practice, offers a plan or a catch-up version, saved and labelled as catch-up', async () => {
    seed(enrolled({ sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5') }));
    window.location.hash = '#/review/1';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByTestId('review-needs-practice')).toBeInTheDocument();
    expect(screen.queryByLabelText('What worked this week?')).not.toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Do the catch-up version' }));
    expect(screen.getByTestId('catchup-label')).toBeInTheDocument();
    await u.type(screen.getByLabelText('What worked this week?'), 'Some');
    await u.click(screen.getByRole('button', { name: 'Complete catch-up review' }));
    expect(stored().reviews[0]).toMatchObject({ week: 1, catchUp: true });
    expect(stored().sessions.some((s) => s.sessionId === 'w1d6')).toBe(true);
  });
});
