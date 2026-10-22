import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { addDays, dateKey } from '../../src/engine/dates';
import { BASELINE_ITEMS } from '../../src/data/programme';
import { ORDER, checkinDue, daysPractisedThisWeek, latestSnapshot, weekStart, weekStatuses } from '../../src/engine/programme';
import type { AppData, Baseline } from '../../src/types';

const now = () => new Date().toISOString();
function seed(d: AppData) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 'seed', ancestors: [], legacy: null, data: d }));
}
const stored = () => (JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { data: AppData }).data;
const go = (hash: string) => { window.location.hash = hash; };
const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (ids: string[], at = yesterday()) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: at, updatedAt: at, mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));
const ratings = (v: number) => Object.fromEntries(BASELINE_ITEMS.map((i) => [i.id, v]));
const bl = (kind: Baseline['kind'], v: number, at: string): Baseline => ({ id: `bl_${kind}_${at}`, kind, ratings: ratings(v), situations: [], completedAt: at, updatedAt: at });
function enrolled(extra: Partial<AppData> = {}, maintenance: string | null = null): AppData {
  return { ...emptyData(), onboardingCompletedAt: now(), programme: { startedAt: now(), disclaimerSeenAt: now(), maintenanceStartedAt: maintenance, noticeDismissedAt: now() }, ...extra };
}
const upTo = (id: string) => ORDER.slice(0, ORDER.indexOf(id));

beforeEach(() => go('#/'));

describe('engine: progress and maintenance helpers', () => {
  it('weekStart returns the Monday of the week', () => {
    expect(weekStart('2026-10-21')).toBe('2026-10-19'); // Wednesday
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // Sunday
  });
  it('counts days practised since Monday, once per day', () => {
    const today = '2026-10-21';
    const d = enrolled({ sessions: [...ses(['w1d1'], '2026-10-19T09:00:00'), ...ses(['w1d2'], '2026-10-19T19:00:00'), ...ses(['w1d3'], '2026-10-21T09:00:00'), ...ses(['w1d4'], '2026-10-17T09:00:00')] });
    expect(daysPractisedThisWeek(d, today)).toBe(2);
  });
  it('weekStatuses marks done, current and upcoming; all done after the last session', () => {
    expect(weekStatuses(enrolled({ sessions: ses(upTo('w3d1')) }))).toEqual(['done', 'done', 'current', 'upcoming', 'upcoming', 'upcoming']);
    expect(weekStatuses(enrolled({ sessions: ses(ORDER) }))).toEqual(Array(6).fill('done'));
  });
  it('latestSnapshot ignores the start baseline and picks the newest', () => {
    const d = enrolled({ baselines: [bl('start', 2, '2026-08-01T10:00:00.000Z'), bl('finish', 3, '2026-09-12T10:00:00.000Z'), bl('checkin', 4, '2026-10-02T10:00:00.000Z')] });
    expect(latestSnapshot(d)?.kind).toBe('checkin');
    expect(latestSnapshot(enrolled({ baselines: [bl('start', 2, '2026-08-01T10:00:00.000Z')] }))).toBeNull();
  });
  it('a check-in is due once a month, only in maintenance', () => {
    const base = [bl('start', 2, '2026-08-01T10:00:00.000Z'), bl('finish', 3, '2026-09-12T10:00:00.000Z')];
    expect(checkinDue(enrolled({ baselines: base }), '2026-10-21')).toBe(false);
    expect(checkinDue(enrolled({ baselines: base }, '2026-09-13T10:00:00.000Z'), '2026-09-20')).toBe(false);
    expect(checkinDue(enrolled({ baselines: base }, '2026-09-13T10:00:00.000Z'), '2026-10-21')).toBe(true);
  });
});

describe('Week 6 and maintenance', () => {
  it('the Week 6 baseline is locked until Week 6 Day 1', async () => {
    seed(enrolled({ sessions: ses(upTo('w5d1')) }));
    render(<App />);
    go('#/baseline/finish');
    expect(await screen.findByText('Week 5 · Day 29 of 42')).toBeInTheDocument();
  });
  it('finish shows Day 0 and Week 6 side by side, then starts maintenance; Today switches rhythm', async () => {
    const start = bl('start', 2, '2026-08-01T10:00:00.000Z');
    const finish = bl('finish', 4, yesterday());
    seed(enrolled({ sessions: ses(ORDER), baselines: [start, finish] }));
    const u = userEvent.setup();
    render(<App />);
    go('#/finish');
    expect(await screen.findAllByText('Day 0')).not.toHaveLength(0);
    expect(screen.getAllByText('Week 6').length).toBeGreaterThan(0);
    await u.click(screen.getByRole('button', { name: 'Start maintenance mode' }));
    const p = stored().programme!;
    expect(p.maintenanceStartedAt).toBeTruthy();
    expect(p.startedAt).toBeTruthy();
    go('#/');
    expect(await screen.findByText(/Maintenance · \d of 3 this week/)).toBeInTheDocument();
  });
  it('a monthly check-in saves a checkin baseline and returns to Progress', async () => {
    seed(enrolled({ sessions: ses(ORDER), baselines: [bl('start', 2, '2026-01-01T10:00:00.000Z'), bl('finish', 3, '2026-02-01T10:00:00.000Z')] }, '2026-02-02T10:00:00.000Z'));
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('link', { name: /Start check-in/ })).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: /Start check-in/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Monthly check-in' })).toBeInTheDocument();
    for (const item of BASELINE_ITEMS) {
      await u.click(within(screen.getByRole('group', { name: new RegExp(item.text.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).getByRole('radio', { name: /^3/ }));
    }
    await u.click(screen.getByRole('button', { name: 'Save check-in' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeInTheDocument();
    expect(stored().baselines.filter((b) => b.kind === 'checkin')).toHaveLength(1);
  });
});

describe('Progress, Evidence, About and Phrases', () => {
  it('Progress shows a six-node journey map, days this week, notes timeline and Day 0 vs now', async () => {
    seed(enrolled({
      sessions: ses(upTo('w3d1')),
      baselines: [bl('start', 2, '2026-08-01T10:00:00.000Z')],
      reviews: [{ id: 'rv1', week: 1, worked: 'Pausing first', gotInWay: '', noticed: 'Less replaying', rating: 3, catchUp: false, completedAt: yesterday(), updatedAt: yesterday() }],
    }));
    render(<App />);
    go('#/progress');
    const map = await screen.findByRole('navigation', { name: 'Your six-week journey' });
    expect(within(map).getAllByRole('link')).toHaveLength(6);
    expect(within(map).getByRole('link', { name: /Week 3.*you are here/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/practised this week/)).toBeInTheDocument();
    expect(screen.getByText('Pausing first')).toBeInTheDocument();
    expect(screen.getByText(/You will see it side by side with Week 6/)).toBeInTheDocument();
  });
  it('Evidence lists real DOIs, says Equanim is untested, and makes no network calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    seed(enrolled());
    render(<App />);
    go('#/references');
    expect(await screen.findByRole('heading', { level: 1, name: 'Evidence and sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equanim itself has not been tested' })).toBeInTheDocument();
    expect(screen.getByText(/10\.1002\/ejsp\.674/)).toBeInTheDocument();
    expect(screen.getByText(/not endorsed by, sponsored by or affiliated with the author/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  it('About covers every section in the brief', async () => {
    seed(enrolled());
    render(<App />);
    go('#/about');
    for (const h of ['What it does', 'Who it is for', 'The four skills, and what they are not', 'The six-week path', 'A typical day', 'How change tends to happen', 'What Equanim isn’t', 'Credit and independence', 'How to get the most from it']) {
      expect(await screen.findByRole('heading', { name: h })).toBeInTheDocument();
    }
    expect(screen.getAllByText(/Not this:/)).toHaveLength(4);
    expect(screen.getByText(/14416 or 1-800-891-4416/)).toBeInTheDocument();
    expect(screen.getByText(/Week 6: /)).toBeInTheDocument();
  });
  it('the Phrases page lists all 12 banks', async () => {
    seed(enrolled());
    render(<App />);
    go('#/phrases');
    expect(await screen.findByRole('heading', { level: 1, name: 'Phrase banks' })).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: /^Phrases: / })).toHaveLength(12);
  });
});

void addDays; void dateKey;
