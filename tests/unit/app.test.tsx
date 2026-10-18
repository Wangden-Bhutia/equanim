import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { DATA_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { exportJson } from '../../src/storage/transfer';
import type { AppData } from '../../src/types';

function onboarded(extra: Partial<AppData> = {}) {
  const d = { ...emptyData(), onboardingCompletedAt: new Date().toISOString(), ...extra };
  localStorage.setItem(DATA_KEY, JSON.stringify(d));
}
const stored = () => JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null') as AppData;
const go = (hash: string) => { window.location.hash = hash; };
const now = () => new Date().toISOString();

beforeEach(() => {
  go('#/');
});

describe('onboarding sample journey', () => {
  it('walks orientation → intention → scenario → reflection → first progress entry', async () => {
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { name: /clarity in the midst of life/i })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/not a replacement for professional mental-health support/i)).toBeInTheDocument();
    expect(screen.getByText(/not affiliated with or endorsed by/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: /five places/i })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/clearing your browser data/i)).toBeInTheDocument();
    await u.type(screen.getByLabelText(/what should equanim call you/i), 'Asha');
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/1 of 4 · Orientation/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    await u.click(screen.getByText('Ask before assuming'));
    await u.click(screen.getByRole('button', { name: 'Set intention and continue' }));
    expect(await screen.findByRole('heading', { name: 'The one-word reply' })).toBeInTheDocument();
    expect(stored().intentions[0]).toMatchObject({ category: 'ask-before-assuming', domain: 'inquiry' });
    expect(stored().settings.displayName).toBe('Asha');
    await u.click(screen.getByRole('button', { name: /notice the story forming/i }));
    expect(screen.getByRole('heading', { name: 'Observing the story' })).toBeInTheDocument();
    expect(screen.getByText('What it may accomplish')).toBeInTheDocument();
    expect(screen.getByText('Risks and assumptions')).toBeInTheDocument();
    expect(screen.getByText('Why this matters')).toBeInTheDocument();
    // A second option gives different, option-specific feedback.
    await u.click(screen.getByRole('button', { name: /reply right away/i }));
    expect(screen.getByRole('heading', { name: 'Seeking reassurance' })).toBeInTheDocument();
    expect(screen.getByText('Another response to consider')).toBeInTheDocument();
    await u.type(screen.getByLabelText(/personal note/i), 'It was just ok.');
    await u.click(screen.getByRole('button', { name: 'Mark scenario complete' }));
    await u.click(await screen.findByRole('link', { name: /see your first progress entry/i }));
    expect(await screen.findByRole('heading', { name: 'Your first progress entry.' })).toBeInTheDocument();
    expect(screen.getByText('Morning intention set')).toBeInTheDocument();
    expect(screen.getByText('2 responses explored')).toBeInTheDocument();
    expect(screen.getByText('It was just ok.')).toBeInTheDocument();
    expect(stored().completions[0]).toMatchObject({ scenarioId: 'p-one-word-reply', optionIds: ['b', 'c'], note: 'It was just ok.' });
    await u.click(screen.getByRole('link', { name: 'Open Progress' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeInTheDocument();
    expect(screen.getByText('1/35')).toBeInTheDocument();
  });
  it('can be skipped at any step', async () => {
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole('button', { name: 'Skip' }));
    expect(await screen.findByText('Morning intention')).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('every primary tab and secondary page opens with its specified name', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    // Both the desktop sidebar and the mobile bar are labelled Primary; jsdom renders both.
    const nav = screen.getAllByRole('navigation', { name: 'Primary' }).at(-1)!;
    for (const tab of ['Practise', 'Journal', 'Library', 'Progress']) {
      await u.click(within(nav).getByRole('link', { name: tab }));
      expect(await screen.findByRole('heading', { level: 1, name: tab })).toBeInTheDocument();
    }
    await u.click(within(nav).getByRole('link', { name: 'Today' }));
    expect(await screen.findByText('Morning intention')).toBeInTheDocument();
    for (const name of ['About Equanim', 'Practice Framework', 'Reading and References', 'Settings and Data', 'Privacy and Storage']) {
      await u.click(screen.getByRole('link', { name: /^More:/ }));
      const list = await screen.findByRole('heading', { level: 1, name: 'More' });
      expect(list).toBeInTheDocument();
      await u.click(within(screen.getByRole('main')).getByRole('link', { name: new RegExp(`^${name}`) }));
      expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument();
    }
  });
  it('shows helplines and the disclaimer on About', async () => {
    onboarded();
    render(<App />);
    go('#/about');
    expect(await screen.findByText(/14416 or 1-800-891-4416/)).toBeInTheDocument();
    expect(screen.getByText(/not an official, authorised or endorsed product/)).toBeInTheDocument();
  });
});

describe('today', () => {
  it('intention: create, persist across reload, and change', async () => {
    onboarded();
    const u = userEvent.setup();
    const { unmount } = render(<App />);
    await u.click(await screen.findByText('Write my own'));
    await u.type(screen.getByLabelText('Your intention'), 'Say a clear no once today');
    await u.click(screen.getByRole('button', { name: 'Set intention' }));
    unmount();
    render(<App />);
    expect(await screen.findByText('Say a clear no once today')).toBeInTheDocument();
    expect(stored().intentions[0]).toMatchObject({ category: 'custom', text: 'Say a clear no once today' });
    await u.click(screen.getByRole('button', { name: /change intention/i }));
    await u.click(screen.getByText('Speak carefully'));
    await u.click(screen.getByRole('button', { name: 'Set intention' }));
    expect(stored().intentions).toHaveLength(1);
    expect(stored().intentions[0]!.category).toBe('speak-carefully');
  });
  it('daily practice autosaves a draft, offers continue-where-left-off, and completes', async () => {
    onboarded();
    const u = userEvent.setup();
    const { unmount } = render(<App />);
    await u.click(await screen.findByRole('button', { name: 'Begin practice' }));
    const box = document.getElementById('pr-resp') as HTMLTextAreaElement;
    await u.type(box, 'Half way');
    expect(stored().inProgress).toMatchObject({ kind: 'practice', draft: 'Half way' });
    unmount();
    render(<App />);
    expect(await screen.findByText('Continue where you left off')).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Mark practice complete' }));
    expect(stored().practices).toHaveLength(1);
    expect(stored().practices[0]!.response).toBe('Half way');
    expect(stored().inProgress).toBeNull();
    expect(screen.queryByText('Continue where you left off')).not.toBeInTheDocument();
  });
  it('evening reflection saves the five questions', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    await u.click(await screen.findByRole('button', { name: 'Reflect on today' }));
    for (const q of ['What happened?', 'What did I initially think or feel?', 'What did I do?', 'What alternative response was available?', 'What will I try next time?']) {
      expect(screen.getByLabelText(q)).toBeInTheDocument();
    }
    const save = screen.getByRole('button', { name: 'Save reflection' });
    expect(save).toBeDisabled();
    await u.type(screen.getByLabelText('What happened?'), 'A tense call');
    await u.type(screen.getByLabelText('What will I try next time?'), 'Pause first');
    await u.click(save);
    expect(stored().reflections[0]).toMatchObject({ happened: 'A tense call', nextTime: 'Pause first' });
    expect(await screen.findByText('A tense call')).toBeInTheDocument();
  });
});

describe('scenario completion and revisits', () => {
  it('records completion with a note and shows history on revisit', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/practise/p-traffic-horn');
    await screen.findByRole('heading', { level: 1, name: 'The horn in traffic' });
    await u.click(screen.getAllByRole('button', { pressed: false })[0]!);
    await u.type(screen.getByLabelText(/personal note/i), 'First time');
    await u.click(screen.getByRole('button', { name: 'Mark scenario complete' }));
    expect(await screen.findByText('Scenario completed')).toBeInTheDocument();
    go('#/practise');
    await screen.findByRole('heading', { level: 1, name: 'Practise' });
    go('#/practise/p-traffic-horn');
    expect(await screen.findByText(/You completed this on/)).toBeInTheDocument();
    expect(screen.getByText('Your history with this scenario')).toBeInTheDocument();
    expect(screen.getByText('First time')).toBeInTheDocument();
    await u.click(screen.getAllByRole('group', { name: 'Possible responses' })[0]!.querySelector('button')!);
    await u.click(screen.getByRole('button', { name: 'Mark scenario complete' }));
    expect(stored().completions.filter((c) => c.scenarioId === 'p-traffic-horn')).toHaveLength(2);
    expect(await screen.findByText(/completed 2 times/)).toBeInTheDocument();
  });
});

describe('journal', () => {
  const create = async (u: ReturnType<typeof userEvent.setup>, type: string, label: string, text: string) => {
    go('#/journal/new');
    await u.click(await screen.findByRole('link', { name: new RegExp(type) }));
    await u.type(await screen.findByLabelText(label), text);
    await u.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByText(text)).toBeInTheDocument();
  };
  it('creates, edits and deletes each of the three entry types', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/journal/new?type=incident');
    await u.click(await screen.findByRole('button', { name: 'Save entry' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least one/i);
    for (const q of ['What did I interpret or assume?', 'What emotion or impulse arose?', 'What else might explain it?', 'What response would better reflect my values?', 'What, if anything, should I do next?']) {
      expect(screen.getByLabelText(q)).toBeInTheDocument();
    }
    await create(u, 'Incident reflection', 'What happened?', 'My friend cancelled by text.');
    await create(u, 'Daily review', 'Where did I respond deliberately today?', 'In the standup.');
    await create(u, 'Free reflection', 'Reflection', 'Just thinking.');
    expect(stored().journal.map((j) => j.type).sort()).toEqual(['daily', 'free', 'incident']);
    // Edit the free entry (currently shown).
    await u.click(screen.getByRole('link', { name: 'Edit' }));
    const field = await screen.findByLabelText('Reflection');
    await u.clear(field);
    await u.type(field, 'Thinking, revised.');
    await u.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByText('Thinking, revised.')).toBeInTheDocument();
    expect(stored().journal).toHaveLength(3);
    // Delete with confirmation.
    await u.click(screen.getByRole('button', { name: 'Delete' }));
    await u.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete entry' }));
    await screen.findByRole('heading', { level: 1, name: 'Journal' });
    expect(stored().journal).toHaveLength(2);
    expect(await screen.findByText('My friend cancelled by text.')).toBeInTheDocument();
  });
});

describe('library and progress', () => {
  it('keeps opening, reading completion and exercises separate, and progress reflects them', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/progress');
    expect(await screen.findByText('Nothing recorded yet')).toBeInTheDocument();
    go('#/library/essay-boundaries');
    expect(await screen.findByRole('heading', { level: 1, name: 'Boundaries, Responsibility and Respect' })).toBeInTheDocument();
    expect(stored().library).toEqual([expect.objectContaining({ itemId: 'essay-boundaries', kind: 'opened' })]);
    await u.click(screen.getByRole('button', { name: 'Mark as read' }));
    await u.click(screen.getByRole('button', { name: 'I tried this' }));
    expect(stored().library.map((r) => r.kind).sort()).toEqual(['completed', 'exercise', 'opened']);
    go('#/progress');
    expect(await screen.findByText('readings completed')).toBeInTheDocument();
    expect(screen.getByText('1/11')).toBeInTheDocument();
    expect(screen.queryByText(/current run/i)).not.toBeInTheDocument();
  });
});

describe('settings and data', () => {
  it('reset requires typing ERASE and returns to onboarding', async () => {
    onboarded({ journal: [{ id: 'j', type: 'free', answers: { text: 'x' }, domain: null, scenarioId: null, themes: [], createdAt: now(), updatedAt: now() }] });
    const u = userEvent.setup();
    render(<App />);
    go('#/settings');
    await u.click(await screen.findByRole('button', { name: 'Erase all data' }));
    const dlg = screen.getByRole('dialog');
    const confirm = within(dlg).getByRole('button', { name: 'Erase everything' });
    expect(confirm).toBeDisabled();
    await u.type(within(dlg).getByLabelText(/type erase/i), 'erase');
    expect(confirm).toBeEnabled();
    await u.click(confirm);
    expect(await screen.findByRole('heading', { name: /clarity in the midst of life/i })).toBeInTheDocument();
    expect(localStorage.getItem(DATA_KEY)).toBeNull();
  });

  it('import shows a summary, can be cancelled, and merges on request', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/settings');
    const backup = { ...emptyData(), onboardingCompletedAt: now() };
    backup.attempts.push({ id: 'x1', scenarioId: 'a-seen-no-reply', optionId: 'b', at: now() });
    backup.completions.push({ id: 'c1', scenarioId: 'a-seen-no-reply', at: now(), optionIds: ['b'], note: '' });
    const file = new File([exportJson(backup)], 'b.json', { type: 'application/json' });
    const input = await screen.findByTestId('import-input');
    await u.upload(input, file);
    const dlg = await screen.findByRole('dialog');
    expect(within(dlg).getByText(/1 scenario completions/)).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect(stored()?.completions ?? []).toHaveLength(0);
    await u.upload(input, file);
    await u.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Merge with my data' }));
    expect(stored().completions).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Undo last import' })).toBeInTheDocument();
  });

  it('rejects an invalid import file', async () => {
    onboarded();
    const u = userEvent.setup({ applyAccept: false });
    render(<App />);
    go('#/settings');
    await u.upload(await screen.findByTestId('import-input'), new File(['{"app":"equanim","data":{"schemaVersion":2}}'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match/);
  });

  it('shows a calm notice when stored data is unreadable, without deleting it', async () => {
    localStorage.setItem(DATA_KEY, '{{broken');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /clarity in the midst of life/i })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(/could not be opened/);
    expect(Object.keys(localStorage).some((k) => k.startsWith('equanim:unreadable:'))).toBe(true);
  });
});
