import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { addDays, dateKey } from '../../src/engine/dates';
import { BASELINE_ITEMS, DIDNT_MANAGE_RESPONSE } from '../../src/data/programme';
import { DAILY_SHORT } from '../../src/engine/time';
import type { AppData } from '../../src/types';

const now = () => new Date().toISOString();
function seed(d: AppData) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 'seed', ancestors: [], legacy: null, data: d }));
}
const stored = () => (JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { data: AppData }).data;
const go = (hash: string) => { window.location.hash = hash; };
const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (...ids: string[]) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: now(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));
function enrolled(extra: Partial<AppData> = {}): AppData {
  return { ...emptyData(), onboardingCompletedAt: now(), programme: { startedAt: now(), disclaimerSeenAt: now(), maintenanceStartedAt: null, noticeDismissedAt: now() }, ...extra };
}

beforeEach(() => go('#/'));

describe('onboarding: welcome → Day 0', () => {
  it('one welcome screen with a safety footer leads to values, then the baseline, then Today, with the disclaimer after the first session', async () => {
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { level: 1, name: /respond, rather than react/i })).toBeInTheDocument();
    expect(screen.getByText('6 weeks')).toBeInTheDocument();
    expect(screen.getByText(DAILY_SHORT)).toBeInTheDocument();
    expect(screen.getByText(/Private on your device/)).toBeInTheDocument();
    expect(screen.getByText(/Tele-MANAS 14416 or 1-800-891-4416/)).toBeInTheDocument();
    expect(screen.queryByText(/Sample journey/)).not.toBeInTheDocument();

    await u.click(screen.getByRole('button', { name: 'Begin Day 0' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your values' })).toBeInTheDocument();
    const save = screen.getByRole('button', { name: 'Save and continue' });
    expect(save).toBeDisabled();
    for (const v of ['Honesty', 'Calm', 'Kindness']) await u.click(screen.getByRole('checkbox', { name: v }));
    expect(screen.getByRole('checkbox', { name: 'Courage' })).toBeDisabled(); // three at most
    await u.type(screen.getByRole('textbox', { name: 'Honesty' }), 'Say what I mean at work');
    await u.type(screen.getByRole('textbox', { name: 'Calm' }), 'Pause before replying');
    expect(save).toBeDisabled();
    await u.type(screen.getByRole('textbox', { name: 'Kindness' }), 'Ask how my sister is');
    await u.click(save);

    expect(await screen.findByRole('heading', { level: 1, name: 'Where you are starting' })).toBeInTheDocument();
    expect(screen.getByText(/not a validated test/)).toBeInTheDocument();
    const finish = screen.getByRole('button', { name: 'Finish Day 0' });
    expect(finish).toBeDisabled();
    for (const item of BASELINE_ITEMS) {
      await u.click(within(screen.getByRole('group', { name: new RegExp(item.text.slice(0, 30).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).getByRole('radio', { name: /^3/ }));
    }
    await u.type(screen.getByLabelText(/Describe a recent situation/), 'A curt email');
    await u.click(finish);

    expect(await screen.findByText('Week 1 · Day 1 of 42')).toBeInTheDocument();
    // No blocking dialog: a one-line notice at the top of Today, expanding in place, until "Got it".
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const notice = await screen.findByTestId('independence-notice');
    expect(within(notice).getByText('Independent, not therapy, no AI.')).toBeInTheDocument();
    expect(within(notice).queryByText(/not endorsed by or affiliated with/)).not.toBeInTheDocument();
    await u.click(within(notice).getByRole('button', { name: 'Read more' }));
    expect(within(notice).getByText(/not endorsed by or affiliated with/)).toBeInTheDocument();
    expect(within(notice).getByText(/Tele-MANAS on 14416/)).toBeInTheDocument();
    await u.click(within(notice).getByRole('button', { name: 'Got it' }));
    expect(screen.queryByTestId('independence-notice')).not.toBeInTheDocument();
    const d = stored();
    expect(d.programme?.noticeDismissedAt).toBeTruthy();
    expect(d.values.map((v) => v.id)).toEqual(['honesty', 'calm', 'kindness']);
    expect(d.baselines[0]).toMatchObject({ kind: 'start', situations: ['A curt email', ''] });
    expect(Object.keys(d.baselines[0]!.ratings)).toHaveLength(BASELINE_ITEMS.length);
    expect(d.sessions.map((s) => s.sessionId)).toEqual(['w0d0']);
  });

  it('offers a 2-minute taster first, without starting anything', async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole('link', { name: 'Try a 2-minute taster first' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'The camera view' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Complete session' }));
    await u.click(await screen.findByRole('link', { name: /Back to the welcome/ }));
    expect(await screen.findByRole('button', { name: 'Begin Day 0' })).toBeInTheDocument();
    expect(stored().onboardingCompletedAt).toBeNull();
    expect(stored().programme).toBeNull();
  });
});

describe('existing 1.1 users', () => {
  it('are offered the programme, not forced to restart', async () => {
    seed({ ...emptyData(), onboardingCompletedAt: now(), journal: [{ id: 'j', type: 'free', answers: { text: 'keep me' }, domain: null, scenarioId: null, themes: [], createdAt: now(), updatedAt: now() }] });
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Morning intention')).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: /Start with Day 0/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your values' })).toBeInTheDocument();
    expect(stored().programme?.startedAt).toBeTruthy();
    expect(stored().journal).toHaveLength(1);
  });
});

describe('Today and sessions', () => {
  it('starts today’s session in one tap; completing it moves the pointer, and later sessions stay locked', async () => {
    seed(enrolled({ sessions: ses('w0d0') }));
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Week 1 · Day 1 of 42')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Today’s steps' })).toHaveTextContent(/Morning plan.*Session.*Evening check/);
    await u.click(screen.getByRole('link', { name: 'Start session' }));
    expect(await screen.findByText(/Week 1 · Day 1 of 42 · Understand/)).toBeInTheDocument();
    expect(screen.getByText('Not this:')).toBeInTheDocument();
    await u.click(screen.getByRole('radio', { name: /Write it down/ }));
    const box = screen.getAllByRole('textbox')[0]!;
    await u.type(box, 'My note');
    expect(screen.getByTestId('check-first')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Complete session' })).not.toBeInTheDocument();
    // A different answer teaches and does not block.
    await u.click(screen.getByRole('radio', { name: 'She is ignoring me.' }));
    expect(screen.getByText(/meaning added to the silence/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Complete session' }));
    expect(await screen.findByText('Session complete')).toBeInTheDocument();
    const rec = stored().sessions.find((s) => s.sessionId === 'w1d1')!;
    expect(rec.mode).toBe('write');
    expect(Object.values(rec.answers)).toContain('My note');
    expect(rec.choices['mc-w1d1']).toBe('b');
    go('#/session/w1d3');
    expect(await screen.findByText(/opens after you finish the ones before it/)).toBeInTheDocument();
    go('#/');
    expect(await screen.findByText('Week 1 · Day 2 of 42')).toBeInTheDocument();
  });

  it('says "pick up where you left off" after a gap, with no penalty', async () => {
    const old = new Date(Date.now() - 5 * 86400000).toISOString();
    seed(enrolled({ programme: { startedAt: old, disclaimerSeenAt: old, maintenanceStartedAt: null, noticeDismissedAt: null }, sessions: ses('w0d0').map((s) => ({ ...s, completedAt: old })) }));
    render(<App />);
    expect(await screen.findByText(/Pick up where you left off/)).toBeInTheDocument();
    expect(screen.getByText('Week 1 · Day 1 of 42')).toBeInTheDocument();
  });

  it('shows Quick recall for questions that are due', async () => {
    seed(enrolled({ sessions: ses('w0d0'), recall: [{ id: 'rq-p-1', firstSeen: addDays(dateKey(), -2), reviewed: [], lastCorrect: true, updatedAt: now() }] }));
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByText('More for today'));
    expect(screen.getByRole('heading', { name: 'Quick recall' })).toBeInTheDocument();
  });
});

describe('habit loop', () => {
  it('if-then builder with a one-tap suggestion, then an evening check that answers "didn’t manage it" warmly', async () => {
    seed(enrolled({ sessions: ses('w0d0') }));
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole('link', { name: /Morning plan/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Today’s if-then plan' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Use a suggested plan/ }));
    expect(screen.getByText(/^When someone replies with one word, I will/)).toBeInTheDocument();
    await u.click(within(screen.getByRole('group', { name: 'Suggestions for what I will do' })).getByRole('button', { name: /wait ten minutes/ }));
    await u.click(screen.getByRole('button', { name: 'Save plan' }));
    const ev = await screen.findByRole('region', { name: 'Evening check' });
    expect(within(ev).getByText('When someone replies with one word, I will wait ten minutes before replying.')).toBeInTheDocument();
    expect(within(ev).getByText('Did the moment come up? What did you do?')).toBeInTheDocument();
    await u.click(within(ev).getByRole('radio', { name: 'I didn’t manage it' }));
    await u.type(within(ev).getByLabelText(/A note/), 'Replied too fast');
    await u.click(within(ev).getByRole('button', { name: 'Save evening check' }));
    expect(await within(ev).findByText(DIDNT_MANAGE_RESPONSE[0]!)).toBeInTheDocument();
    expect(stored().plans[0]).toMatchObject({ domain: 'personalisation', outcome: 'didnt-manage', note: 'Replied too fast' });
  });

  it('weekly review completes Day 6; Today then moves on to Week 2', async () => {
    const plan = { id: 'p1', date: dateKey(), domain: null, valueId: null, when: 'a', then: 'b', outcome: 'tried' as const, note: '', createdAt: now(), updatedAt: now() };
    seed(enrolled({ sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5'), plans: [plan] }));
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Week 1 · Day 6 of 42')).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: 'Start session' }));
    expect(await screen.findByRole('heading', { level: 1, name: /Week 1 review/ })).toBeInTheDocument();
    await u.type(screen.getByLabelText('What worked this week?'), 'Pausing');
    await u.click(screen.getByRole('radio', { name: /4/ }));
    await u.click(screen.getByRole('button', { name: 'Complete review' }));
    expect(await screen.findByText('Week 1 review saved')).toBeInTheDocument();
    expect(stored().reviews[0]).toMatchObject({ week: 1, worked: 'Pausing', rating: 4, catchUp: false });
    go('#/');
    expect(await screen.findByText('Week 2 · Day 8 of 42')).toBeInTheDocument();
  });
});

describe('settings: reminder and backup', () => {
  it('explains that the .ics reminder only works once added to a calendar, and records the last export date', async () => {
    seed(enrolled());
    const create = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const u = userEvent.setup();
    render(<App />);
    go('#/settings');
    expect(await screen.findByText(/only reminds you once you add it to your calendar app/)).toBeInTheDocument();
    expect(screen.getByTestId('last-export')).toHaveTextContent('Last export: never');
    await u.click(screen.getByRole('button', { name: /Download calendar reminder/ }));
    expect(stored().settings.reminderTime).toBe('08:00');
    await u.click(screen.getByRole('button', { name: /Export backup/ }));
    expect(stored().settings.lastExportAt).toBeTruthy();
    expect(screen.getByTestId('last-export')).not.toHaveTextContent('never');
  });
  it('nudges a backup after 7 days of use, and can be dismissed', async () => {
    const plans = Array.from({ length: 7 }, (_, i) => { const date = addDays(dateKey(), -i - 1); return { id: `p${i}`, date, domain: null, valueId: null, when: 'a', then: 'b', outcome: null, note: '', createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z` }; });
    seed(enrolled({ plans }));
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Time for a backup/ })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('heading', { name: /Time for a backup/ })).not.toBeInTheDocument();
    expect(stored().settings.backupNudgeDismissedOn).toBe(dateKey());
  });
});
