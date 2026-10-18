import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Repository, LocalStorageAdapter, type LoadIssue, type StorageAdapter } from '../lib/storage';
import { emptyData } from '../lib/schema';
import { mergeData } from '../lib/transfer';
import { dateKey } from '../lib/dates';
import { newId } from '../lib/id';
import type { AppData, DomainId, JournalEntry, ReflectionOutcome, Settings } from '../lib/types';

export type JournalDraft = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;

interface StoreValue {
  data: AppData;
  loadIssue: LoadIssue | null;
  saveError: boolean;
  dismissLoadIssue: () => void;
  completeOnboarding: (displayName?: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setIntention: (domain: DomainId, text: string) => void;
  clearIntention: (date: string) => void;
  reflectOnIntention: (date: string, outcome: ReflectionOutcome, note: string) => void;
  recordAttempt: (scenarioId: string, optionId: string) => void;
  createJournal: (draft: JournalDraft) => string;
  updateJournal: (id: string, draft: JournalDraft) => void;
  deleteJournal: (id: string) => void;
  recordLibrary: (itemId: string, kind: 'read' | 'exercise') => void;
  importData: (incoming: AppData, mode: 'merge' | 'replace') => void;
  restoreBackup: () => boolean;
  backupInfo: () => { savedAt: string } | null;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, adapter }: { children: ReactNode; adapter?: StorageAdapter }) {
  const repo = useMemo(() => new Repository(adapter ?? new LocalStorageAdapter()), [adapter]);
  const initial = useMemo(() => repo.load(), [repo]);
  const [data, setData] = useState<AppData>(initial.data);
  const [loadIssue, setLoadIssue] = useState<LoadIssue | null>(initial.issue);
  const [saveError, setSaveError] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSaveError(!repo.save(data));
  }, [data, repo]);

  useEffect(() => {
    const apply = () => {
      const t = data.settings.theme;
      const dark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [data.settings.theme]);

  const now = () => new Date().toISOString();
  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);

  const value: StoreValue = {
    data,
    loadIssue,
    saveError,
    dismissLoadIssue: () => setLoadIssue(null),
    completeOnboarding: (displayName) =>
      update((d) => ({
        ...d,
        onboardingCompletedAt: d.onboardingCompletedAt ?? now(),
        settings: { ...d.settings, displayName: (displayName ?? d.settings.displayName).trim().slice(0, 80) },
      })),
    updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    setIntention: (domain, text) =>
      update((d) => {
        const date = dateKey();
        const existing = d.intentions.find((i) => i.date === date);
        const t = now();
        if (existing) {
          return { ...d, intentions: d.intentions.map((i) => (i.date === date ? { ...i, domain, text: text.trim(), updatedAt: t } : i)) };
        }
        return { ...d, intentions: [...d.intentions, { id: newId('int'), date, domain, text: text.trim(), createdAt: t, updatedAt: t, reflection: null }] };
      }),
    clearIntention: (date) => update((d) => ({ ...d, intentions: d.intentions.filter((i) => i.date !== date) })),
    reflectOnIntention: (date, outcome, note) =>
      update((d) => ({
        ...d,
        intentions: d.intentions.map((i) => (i.date === date ? { ...i, updatedAt: now(), reflection: { outcome, note: note.trim(), at: now() } } : i)),
      })),
    recordAttempt: (scenarioId, optionId) =>
      update((d) => ({ ...d, attempts: [...d.attempts, { id: newId('att'), scenarioId, optionId, at: now() }] })),
    createJournal: (draft) => {
      const id = newId('jrn');
      const t = now();
      update((d) => ({ ...d, journal: [...d.journal, { ...draft, id, createdAt: t, updatedAt: t }] }));
      return id;
    },
    updateJournal: (id, draft) =>
      update((d) => ({ ...d, journal: d.journal.map((j) => (j.id === id ? { ...j, ...draft, updatedAt: now() } : j)) })),
    deleteJournal: (id) => update((d) => ({ ...d, journal: d.journal.filter((j) => j.id !== id) })),
    recordLibrary: (itemId, kind) =>
      update((d) =>
        d.library.some((r) => r.itemId === itemId && r.kind === kind) ? d : { ...d, library: [...d.library, { itemId, kind, at: now() }] },
      ),
    importData: (incoming, mode) => {
      repo.saveBackup(data);
      setData((d) => (mode === 'replace' ? incoming : mergeData(d, incoming)));
    },
    restoreBackup: () => {
      const b = repo.readBackup();
      if (!b) return false;
      setData(b.data);
      return true;
    },
    backupInfo: () => {
      const b = repo.readBackup();
      return b ? { savedAt: b.savedAt } : null;
    },
    resetAll: () => {
      repo.clearAll();
      const fresh = emptyData();
      first.current = true; // do not immediately write the empty state back
      setData(fresh);
      setLoadIssue(null);
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
