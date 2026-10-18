import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { DATA_KEY } from '../../src/lib/storage';
import { emptyData } from '../../src/lib/schema';
import { exportJson } from '../../src/lib/transfer';

function onboarded(extra: Partial<ReturnType<typeof emptyData>> = {}) {
  const d = { ...emptyData(), onboardingCompletedAt: new Date().toISOString(), ...extra };
  localStorage.setItem(DATA_KEY, JSON.stringify(d));
}
const stored = () => JSON.parse(localStorage.getItem(DATA_KEY) ?? 'null');
const go = (hash: string) => { window.location.hash = hash; };

beforeEach(() => {
  go('#/');
  window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);
});

describe('onboarding', () => {
  it('leads into a usable first practice and records the attempt', async () => {
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByRole('heading', { name: /clarity in the midst of life/i })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByRole('heading', { name: /practice takes a few minutes/i })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByText(/not affiliated with or endorsed by/i)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Continue' }));
    await u.type(screen.getByLabelText(/what should equanim call you/i), 'Asha');
    await u.click(screen.getByRole('button', { name: 'Begin first practice' }));
    expect(await screen.findByRole('heading', { name: 'The one-word reply' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /notice the story forming/i }));
    expect(screen.getByRole('heading', { name: 'Observing the story' })).toBeInTheDocument();
    expect(screen.getByText(/what it may cost/i)).toBeInTheDocument();
    const d = stored();
    expect(d.settings.displayName).toBe('Asha');
    expect(d.onboardingCompletedAt).toBeTruthy();
    expect(d.attempts).toHaveLength(1);
    // Comparing a second response gives different, option-specific feedback.
    await u.click(screen.getByRole('button', { name: /reply right away/i }));
    expect(screen.getByRole('heading', { name: 'Seeking reassurance' })).toBeInTheDocument();
    expect(stored().attempts).toHaveLength(2);
    await u.click(screen.getByRole('link', { name: /continue to today/i }));
    expect(await screen.findByText(/, Asha\./)).toBeInTheDocument();
  });
});

describe('navigation', () => {
  it('every primary tab opens a real screen', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Primary' });
    for (const [tab, heading] of [['Practise', 'Practise'], ['Journal', 'Journal'], ['Library', 'Library'], ['Progress', 'Progress']] as const) {
      await u.click(within(nav).getByRole('link', { name: tab }));
      expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    }
    await u.click(within(nav).getByRole('link', { name: 'Today' }));
    expect(screen.getByText(/today’s intention/i)).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: /more: settings/i }));
    for (const name of ['Settings & data', 'Framework', 'About Equanim', 'References', 'Privacy']) {
      await u.click(screen.getByRole('link', { name: new RegExp(name) }));
      expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
      await u.click(screen.getByRole('link', { name: /more: settings/i }));
    }
  });
});

describe('today', () => {
  it('morning intentions and evening reflections persist across reloads', async () => {
    onboarded();
    const u = userEvent.setup();
    const { unmount } = render(<App />);
    await u.click(screen.getByText('Words'));
    await u.type(screen.getByLabelText('Intention'), 'Say a clear no once today');
    await u.click(screen.getByRole('button', { name: 'Set intention' }));
    unmount();
    render(<App />);
    expect(screen.getByText('Say a clear no once today')).toBeInTheDocument();
    const u2 = userEvent.setup();
    await u2.click(screen.getByRole('button', { name: 'Reflect on today' }));
    await u2.click(screen.getByText('I noticed afterwards'));
    await u2.click(screen.getByRole('button', { name: 'Save reflection' }));
    expect(stored().intentions[0].reflection.outcome).toBe('afterwards');
    expect(stored().intentions[0].domain).toBe('words');
  });
});

describe('journal', () => {
  it('creates, revisits, edits and deletes entries', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/journal/new');
    await u.click(await screen.findByRole('button', { name: 'Save entry' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least one field/);
    await u.type(screen.getByLabelText('What happened'), 'My friend cancelled by text.');
    await u.type(screen.getByLabelText('The meaning I added'), 'She does not value me.');
    await u.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByText('She does not value me.')).toBeInTheDocument();
    await u.click(screen.getByRole('link', { name: 'Edit' }));
    const field = screen.getByLabelText('What I might try next time');
    await u.type(field, 'Ask her how she is.');
    await u.click(screen.getByRole('button', { name: 'Save entry' }));
    expect(await screen.findByText('Ask her how she is.')).toBeInTheDocument();
    expect(stored().journal).toHaveLength(1);
    go('#/journal');
    await screen.findByRole('heading', { level: 1, name: 'Journal' });
    expect(await screen.findByText('My friend cancelled by text.')).toBeInTheDocument();
    await u.click(screen.getByText('My friend cancelled by text.'));
    await u.click(await screen.findByRole('button', { name: 'Delete' }));
    const dlg = screen.getByRole('dialog');
    await u.click(within(dlg).getByRole('button', { name: 'Delete entry' }));
    expect(await screen.findByText('No entries yet')).toBeInTheDocument();
    expect(stored().journal).toHaveLength(0);
  });
});

describe('library and progress', () => {
  it('records reading and exercises, and progress reflects real records', async () => {
    onboarded();
    const u = userEvent.setup();
    render(<App />);
    go('#/progress');
    expect(await screen.findByText('Nothing recorded yet')).toBeInTheDocument();
    go('#/library/essay-boundary-not-wall');
    expect(await screen.findByRole('heading', { name: 'A boundary is not a wall' })).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'I tried this' }));
    expect(screen.getByRole('button', { name: /marked as tried/i })).toBeDisabled();
    expect(screen.getByRole('link', { name: /the saturday favour/i })).toBeInTheDocument();
    go('#/progress');
    expect(await screen.findByText('readings opened')).toBeInTheDocument();
    expect(screen.getByText('1/11')).toBeInTheDocument();
    expect(screen.queryByText(/current run/i)).not.toBeInTheDocument();
  });
});

describe('settings and data', () => {
  it('reset requires typing ERASE and returns to onboarding', async () => {
    onboarded({ journal: [{ id: 'j', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), domain: null, scenarioId: null, situation: 'x', story: '', response: '', nextTime: '', note: '' }] });
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
    const backup = { ...emptyData(), onboardingCompletedAt: new Date().toISOString() };
    backup.attempts.push({ id: 'x1', scenarioId: 'a-seen-no-reply', optionId: 'b', at: new Date().toISOString() });
    const file = new File([exportJson(backup)], 'b.json', { type: 'application/json' });
    const input = await screen.findByTestId('import-input');
    await u.upload(input, file);
    const dlg = await screen.findByRole('dialog');
    expect(within(dlg).getByText(/1 scenarios explored/)).toBeInTheDocument();
    await u.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect(stored()?.attempts ?? []).toHaveLength(0);
    await u.upload(input, file);
    await u.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Merge with my data' }));
    expect(stored().attempts).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Undo last import' })).toBeInTheDocument();
  });

  it('rejects an invalid import file', async () => {
    onboarded();
    const u = userEvent.setup({ applyAccept: false });
    render(<App />);
    go('#/settings');
    await u.upload(await screen.findByTestId('import-input'), new File(['{"app":"equanim","data":{"schemaVersion":1}}'], 'bad.json', { type: 'application/json' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/does not match/);
  });

  it('shows a calm notice when stored data is unreadable, without deleting it', async () => {
    localStorage.setItem(DATA_KEY, '{{broken');
    render(<App />);
    // Fresh start goes to onboarding; the unreadable copy is preserved under a separate key.
    expect(await screen.findByRole('heading', { name: /clarity in the midst of life/i })).toBeInTheDocument();
    expect(Object.keys(localStorage).some((k) => k.startsWith('equanim:unreadable:'))).toBe(true);
  });
});
