import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Repository, LocalStorageAdapter, DATA_KEY, type LoadIssue, type StorageAdapter } from '../storage/storage';
import { emptyData } from '../storage/schema';
import { mergeData } from '../storage/transfer';
import { dateKey } from '../engine/dates';
import { newId } from '../engine/id';
import type { AppData, DomainId, EveningReflection, IntentionCategory, JournalEntry, Settings } from '../types';

export type JournalDraft = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type ReflectionDraft = Pick<EveningReflection, 'happened' | 'initial' | 'did' | 'alternative' | 'nextTime'>;

interface StoreValue {
  data: AppData;
  loadIssue: LoadIssue | null;
  saveError: boolean;
  dismissLoadIssue: () => void;
  completeOnboarding: (displayName?: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setIntention: (category: IntentionCategory, text: string, domain: DomainId | null) => void;
  saveReflection: (draft: ReflectionDraft) => void;
  setPracticeDraft: (practiceId: string, draft: string) => void;
  completePractice: (practiceId: string, response: string) => void;
  recordAttempt: (scenarioId: string, optionId: string) => void;
  completeScenario: (scenarioId: string, optionIds: string[], note: string) => void;
  clearInProgress: () => void;
  createJournal: (draft: JournalDraft) => string;
  updateJournal: (id: string, draft: JournalDraft) => void;
  deleteJournal: (id: string) => void;
  recordLibrary: (itemId: string, kind: 'opened' | 'completed' | 'exercise') => void;
  importData: (incoming: AppData, mode: 'merge' | 'replace') => void;
  restoreBackup: () => boolean;
  backupInfo: () => { savedAt: string } | null;
  resetAll: () => void;
  safetyCopies: () => ReturnType<Repository['safetyCopies']>;
  readSafetyCopy: (key: string) => string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, adapter }: { children: ReactNode; adapter?: StorageAdapter }) {
  const repo = useMemo(() => new Repository(adapter ?? new LocalStorageAdapter()), [adapter]);
  const initial = useMemo(() => repo.load(), [repo]);
  const [data, setData] = useState<AppData>(initial.data);
  const [loadIssue, setLoadIssue] = useState<LoadIssue | null>(initial.issue);
  const [saveError, setSaveError] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setSaveError(!repo.save(data));
  }, [data, repo]);

  // Another tab wrote Equanim data: reload it instead of later overwriting it with this tab's older copy.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== DATA_KEY || e.storageArea !== window.localStorage) return;
      const r = repo.load();
      skipSave.current = true;
      setData(r.data);
      if (r.issue) setLoadIssue(r.issue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [repo]);

  useEffect(() => {
    const apply = () => {
      const t = data.settings.theme;
      const dark = t === 'dark' || (t === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1E2320' : '#F6F3EB');
    };
    apply();
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [data.settings.theme]);

  const now = () => new Date().toISOString();
  const update = (fn: (d: AppData) => AppData) => setData((d) => fn(d));

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
    setIntention: (category, text, domain) =>
      update((d) => {
        const date = dateKey();
        const t = now();
        const existing = d.intentions.find((i) => i.date === date);
        if (existing) {
          return { ...d, intentions: d.intentions.map((i) => (i.date === date ? { ...i, category, domain, text: text.trim(), updatedAt: t } : i)) };
        }
        return { ...d, intentions: [...d.intentions, { id: newId('int'), date, category, domain, text: text.trim(), createdAt: t, updatedAt: t }] };
      }),
    saveReflection: (draft) =>
      update((d) => {
        const date = dateKey();
        const t = now();
        const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()])) as ReflectionDraft;
        const existing = d.reflections.find((r) => r.date === date);
        if (existing) return { ...d, reflections: d.reflections.map((r) => (r.date === date ? { ...r, ...clean, updatedAt: t } : r)) };
        return { ...d, reflections: [...d.reflections, { id: newId('ref'), date, ...clean, createdAt: t, updatedAt: t }] };
      }),
    setPracticeDraft: (practiceId, draft) =>
      update((d) => ({ ...d, inProgress: { kind: 'practice', refId: practiceId, startedAt: d.inProgress?.refId === practiceId ? d.inProgress.startedAt : now(), draft } })),
    completePractice: (practiceId, response) =>
      update((d) => ({
        ...d,
        practices: [...d.practices, { id: newId('prc'), practiceId, date: dateKey(), response: response.trim(), completedAt: now() }],
        inProgress: d.inProgress?.kind === 'practice' && d.inProgress.refId === practiceId ? null : d.inProgress,
      })),
    recordAttempt: (scenarioId, optionId) =>
      update((d) => ({
        ...d,
        attempts: [...d.attempts, { id: newId('att'), scenarioId, optionId, at: now() }],
        inProgress: { kind: 'scenario', refId: scenarioId, startedAt: d.inProgress?.refId === scenarioId ? d.inProgress.startedAt : now(), draft: '' },
      })),
    completeScenario: (scenarioId, optionIds, note) =>
      update((d) => ({
        ...d,
        completions: [...d.completions, { id: newId('cmp'), scenarioId, at: now(), optionIds, note: note.trim() }],
        inProgress: d.inProgress?.kind === 'scenario' && d.inProgress.refId === scenarioId ? null : d.inProgress,
      })),
    clearInProgress: () => update((d) => ({ ...d, inProgress: null })),
    createJournal: (draft) => {
      const id = newId('jrn');
      const t = now();
      update((d) => ({ ...d, journal: [...d.journal, { ...draft, id, createdAt: t, updatedAt: t }] }));
      return id;
    },
    updateJournal: (id, draft) => update((d) => ({ ...d, journal: d.journal.map((j) => (j.id === id ? { ...j, ...draft, updatedAt: now() } : j)) })),
    deleteJournal: (id) => update((d) => ({ ...d, journal: d.journal.filter((j) => j.id !== id) })),
    recordLibrary: (itemId, kind) =>
      update((d) => (d.library.some((r) => r.itemId === itemId && r.kind === kind) ? d : { ...d, library: [...d.library, { itemId, kind, at: now() }] })),
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
      skipSave.current = true; // do not immediately write the empty state back
      setData(emptyData());
      setLoadIssue(null);
    },
    safetyCopies: () => repo.safetyCopies(),
    readSafetyCopy: (key) => repo.readRaw(key),
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
