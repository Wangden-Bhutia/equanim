/** Round 2 §2.3: plans can name a value; it shows on Today's evening check and in the weekly review. */
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/app/App';
import { STORE_KEY } from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { dateKey } from '../../src/engine/dates';
import type { AppData } from '../../src/types';

const now = () => new Date().toISOString();
const yesterday = () => new Date(Date.now() - 86400000).toISOString();
const ses = (...ids: string[]) => ids.map((sessionId) => ({ id: `ses_${sessionId}`, sessionId, completedAt: yesterday(), updatedAt: yesterday(), mode: 'think' as const, answers: {}, choices: {}, earlyStart: false, thinkResponses: {} }));
const values = [{ id: 'calm', sentence: 'I pause before I answer.', updatedAt: now() }, { id: 'honesty', sentence: 'I say what I mean.', updatedAt: now() }, { id: 'kindness', sentence: 'I assume good intent.', updatedAt: now() }];
const enrolled = (extra: Partial<AppData> = {}): AppData => ({ ...emptyData(), onboardingCompletedAt: now(), programme: { startedAt: yesterday(), disclaimerSeenAt: now(), maintenanceStartedAt: null, noticeDismissedAt: now() }, sessions: ses('w0d0'), ...extra });
const seed = (d: AppData) => localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: d.schemaVersion, revision: 1, nonce: 's', ancestors: [], legacy: null, data: d }));
const stored = () => (JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { data: AppData }).data;

beforeEach(() => { window.location.hash = '#/'; });

describe('values in plans', () => {
  it('the plan builder offers the user’s three values with their sentences, saves valueId, and Today shows it', async () => {
    seed(enrolled({ values }));
    window.location.hash = '#/plan';
    const u = userEvent.setup();
    render(<App />);
    expect(await screen.findByText('Which of your values does this serve?', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('I pause before I answer.')).toBeInTheDocument();
    await u.type(screen.getByLabelText('When…'), 'a message is unclear');
    await u.type(screen.getByLabelText('…I will'), 'ask one question');
    await u.click(screen.getByRole('checkbox', { name: /Calm/ }));
    await u.click(screen.getByRole('button', { name: 'Save plan' }));
    expect(stored().plans[0]).toMatchObject({ valueId: 'calm', date: dateKey() });
    expect(await screen.findByTestId('plan-value')).toHaveTextContent('You planned this for Calm.');
  });
  it('the value is optional', async () => {
    seed(enrolled({ values }));
    window.location.hash = '#/plan';
    const u = userEvent.setup();
    render(<App />);
    await u.type(await screen.findByLabelText('When…'), 'x');
    await u.type(screen.getByLabelText('…I will'), 'y');
    await u.click(screen.getByRole('button', { name: 'Save plan' }));
    expect(stored().plans[0]!.valueId).toBeNull();
  });
  it('without values, the builder shows a one-line link to /values instead of chips', async () => {
    seed(enrolled());
    window.location.hash = '#/plan';
    render(<App />);
    expect(await screen.findByTestId('plan-values-missing')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choose your values' })).toHaveAttribute('href', '#/values');
  });
  it('the weekly review lists the values the week’s plans served, with the values card collapsed', async () => {
    const plan = { id: 'p1', date: dateKey(), domain: null, valueId: 'honesty', when: 'a', then: 'b', outcome: 'tried' as const, note: '', createdAt: now(), updatedAt: now() };
    seed(enrolled({ values, plans: [plan], sessions: ses('w0d0', 'w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5') }));
    window.location.hash = '#/review/1';
    render(<App />);
    expect(await screen.findByTestId('review-values')).toHaveTextContent('Honesty: 1 plan');
    expect(screen.getByTestId('values-collapsed')).not.toHaveAttribute('open');
  });
});
