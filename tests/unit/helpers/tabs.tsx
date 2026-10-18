/**
 * Deterministic multi-tab harness. Every "tab" is a real StoreProvider (the code that ships) or the real
 * Equanim 1.0 storage code (vendored verbatim from main @ 225d9db in tests/fixtures/equanim-1.0). All tabs share
 * jsdom's localStorage, exactly as tabs of one origin share it. Nothing is timed: cross-tab notifications are
 * delivered only when a test calls deliver(), so "missed" and "late" notifications are reproducible.
 */
import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { StoreProvider, useStore } from '../../../src/app/store';
import { Repository as V1Repository, LocalStorageAdapter as V1Adapter } from '../../fixtures/equanim-1.0/storage';
import type { AppData as V1Data } from '../../fixtures/equanim-1.0/types';

type Store = ReturnType<typeof useStore>;

/** Lets all queued promises and zero-delay timers run. No real waiting. */
export async function settle() {
  await act(async () => {
    for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0));
  });
}

/** Delivers the browser's cross-tab `storage` event for a key, as another tab's write would. */
export async function deliver(key: string) {
  await act(async () => {
    window.dispatchEvent(new StorageEvent('storage', { key, storageArea: window.localStorage, newValue: window.localStorage.getItem(key) }));
  });
  await settle();
}

export interface NewTab { store: () => Store; unmount: () => void }

export async function openNewTab(props: Record<string, unknown> = {}): Promise<NewTab> {
  let current: Store | null = null;
  const Probe = () => { current = useStore(); return null; };
  const P = StoreProvider as unknown as (p: { children: ReactNode } & Record<string, unknown>) => JSX.Element;
  const r = render(<P {...props}><Probe /></P>);
  await settle();
  return { store: () => current as unknown as Store, unmount: r.unmount };
}

/** A tab still running Equanim 1.0: loads once, keeps its own copy, and writes the whole store on every change. */
export function openOldTab() {
  const repo = new V1Repository(new V1Adapter());
  let d: V1Data = repo.load().data;
  let n = 0;
  const save = (next: V1Data) => { d = next; repo.save(d); };
  return {
    data: () => d,
    addJournal(situation: string) {
      const t = new Date(Date.UTC(2026, 9, 18, 12, 0, n++)).toISOString();
      save({ ...d, journal: [...d.journal, { id: `jrn_old_${situation}`, createdAt: t, updatedAt: t, domain: null, scenarioId: null, situation, story: '', response: '', nextTime: '', note: '' }] });
    },
    editJournal(id: string, situation: string) {
      const t = new Date(Date.UTC(2026, 9, 18, 13, 0, n++)).toISOString();
      save({ ...d, journal: d.journal.map((j) => (j.id === id ? { ...j, situation, updatedAt: t } : j)) });
    },
    recordAttempt(scenarioId: string, optionId: string) {
      const t = new Date(Date.UTC(2026, 9, 18, 14, 0, n++)).toISOString();
      save({ ...d, attempts: [...d.attempts, { id: `att_old_${n}`, scenarioId, optionId, at: t }] });
    },
    setIntention(text: string) {
      const t = new Date(Date.UTC(2026, 9, 18, 6, 0, n++)).toISOString();
      const date = '2026-10-18';
      const rest = d.intentions.filter((i) => i.date !== date);
      save({ ...d, intentions: [...rest, { id: 'int_old_today', date, domain: 'words', text, createdAt: t, updatedAt: t, reflection: null }] });
    },
  };
}

export const journalTexts = (s: Store) => s.data.journal.map((j) => j.answers.facts ?? j.answers.text ?? '').sort();

/** The 1.0 document used to seed "before the upgrade". */
export function v1Seed() {
  const t = (d: number, h = 9) => new Date(Date.UTC(2026, 9, d, h)).toISOString();
  return {
    schemaVersion: 1, createdAt: t(1), onboardingCompletedAt: t(1, 10),
    settings: { displayName: 'Asha', streaksEnabled: false, theme: 'system' },
    intentions: [{ id: 'int_a', date: '2026-10-02', domain: 'words', text: 'Say a clear no', createdAt: t(2), updatedAt: t(2), reflection: { outcome: 'afterwards', note: 'At lunch', at: t(2, 21) } }],
    attempts: [{ id: 'att_1', scenarioId: 'p-one-word-reply', optionId: 'a', at: t(2, 12) }],
    journal: [{ id: 'jrn_seed', createdAt: t(2, 20), updatedAt: t(2, 20), domain: null, scenarioId: null, situation: 'seed', story: '', response: '', nextTime: '', note: '' }],
    library: [{ itemId: 'section-words', kind: 'read', at: t(2, 7) }],
  };
}
