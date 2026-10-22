/** Round 2 §2.5: Progress in programme order, legacy blocks only when they have records, and an honest early-start line. */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { earlyLine } from '../../src/pages/Progress';
import type { AppData } from '../../src/types';

const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (ids: string[], early: string[] = []) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: yesterday(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: early.includes(sessionId), thinkResponses: {} }));
const enrolled = (extra: Partial<AppData> = {}): AppData => ({ ...emptyData(), onboardingCompletedAt: yesterday(), programme: { startedAt: yesterday(), disclaimerSeenAt: yesterday(), maintenanceStartedAt: null, noticeDismissedAt: yesterday() }, ...extra });
function open(d: AppData) {
  localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
  window.location.hash = '#/progress';
  render(<App />);
}

describe('Progress cleanup', () => {
  it('a programme-only user sees no legacy blocks and no 0 tiles', async () => {
    open(enrolled({ sessions: ses(['w0d0', 'w1d1']) }));
    expect(await screen.findByRole('heading', { name: 'Your six weeks' })).toBeInTheDocument();
    expect(screen.queryByTestId('legacy-activity')).not.toBeInTheDocument();
    for (const t of ['Domain participation', 'Reading', 'daily practices completed', 'Recent reflections', 'Recurring themes']) expect(screen.queryByText(t)).not.toBeInTheDocument();
    expect(screen.queryByTestId('early-line')).not.toBeInTheDocument();
  });
  it('legacy blocks appear, collapsed, only for the kinds with records', async () => {
    const at = yesterday();
    open(enrolled({ sessions: ses(['w0d0']), completions: [{ id: 'c1', scenarioId: 'p-meeting-critique', at, optionIds: [], note: '' }] }));
    const box = await screen.findByTestId('legacy-activity');
    expect(box).not.toHaveAttribute('open');
    expect(screen.getByText('scenarios completed')).toBeInTheDocument();
    expect(screen.queryByText('daily practices completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Reading')).not.toBeInTheDocument();
  });
  it('shows one honest line for sessions done ahead of schedule', async () => {
    open(enrolled({ sessions: ses(['w0d0', 'w1d1', 'w1d2', 'w1d3'], ['w1d1', 'w1d2', 'w1d3']) }));
    expect(await screen.findByTestId('early-line')).toHaveTextContent('3 sessions done ahead of schedule. Spacing helps, but your pace is yours.');
    expect(earlyLine(1)).toBe('1 session done ahead of schedule. Spacing helps, but your pace is yours.');
    expect(earlyLine(0)).toBeNull();
  });
});
