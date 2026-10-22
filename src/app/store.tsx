import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Repository, LocalStorageAdapter, STORE_KEY, LEGACY_KEY,
  type LoadIssue, type Locks, type RefusedReason, type StorageAdapter, type TransactContext, type TransactResult,
} from '../storage/storage';
import { emptyData } from '../storage/schema';
import { mergeData } from '../storage/transfer';
import { dateKey, keyFromIso } from '../engine/dates';
import { newId } from '../engine/id';
import type { AppData, DomainId, EveningReflection, IntentionCategory, JournalEntry, PlanOutcome, SessionMode, Settings } from '../types';
import { DAY0_ID } from '../data/programme';
import { recordRecall, sessionRecordId, wouldBeEarly } from '../engine/programme';

export type JournalDraft = Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>;
export type ReflectionDraft = Pick<EveningReflection, 'happened' | 'initial' | 'did' | 'alternative' | 'nextTime'>;

/** Cross-tab "something changed" messages. BroadcastChannel in browsers; injectable for tests. */
export interface ChangeChannel { post: () => void; subscribe: (cb: () => void) => () => void }

export function browserChannel(): ChangeChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  const ch = new BroadcastChannel('equanim');
  return {
    post: () => ch.postMessage({ type: 'changed' }),
    subscribe: (cb) => { const h = () => cb(); ch.addEventListener('message', h); return () => ch.removeEventListener('message', h); },
  };
}

export interface WriteIssue { reason: RefusedReason; unsavedKey: string | null }

interface StoreValue {
  data: AppData;
  loadIssue: LoadIssue | null;
  /** Set while a change could not be saved. The change stays on screen and is retried with the next change. */
  writeIssue: WriteIssue | null;
  saveError: boolean;
  /** Number of records set aside because the same item was changed in two places at once (not yet acknowledged). */
  setAsideNotice: number;
  dismissSetAside: () => void;
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
  // 6-week programme
  startProgramme: () => void;
  markDisclaimerSeen: () => void;
  /** Hides the short notice on Today ("Got it"). */
  dismissNotice: () => void;
  startMaintenance: () => void;
  saveValues: (choices: { id: string; sentence: string }[]) => void;
  saveBaseline: (kind: 'start' | 'finish' | 'checkin', ratings: Record<string, number>, situations: string[]) => void;
  completeSession: (sessionId: string, mode: SessionMode, answers: Record<string, string>, choices?: Record<string, string>, thinkResponses?: Record<string, string>) => void;
  saveReview: (week: number, review: { worked: string; gotInWay: string; noticed: string; rating: number | null; catchUp?: boolean }) => void;
  savePlan: (plan: { when: string; then: string; domain: DomainId | null; valueId?: string | null }) => void;
  checkPlan: (outcome: PlanOutcome, note: string) => void;
  answerRecall: (questionId: string, correct: boolean) => void;
  markExported: () => void;
  dismissBackupNudge: () => void;
}

type Change = (d: AppData, ctx: TransactContext) => AppData;
const PREVIEW: TransactContext = { setAside: () => {}, live: false };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const StoreContext = createContext<StoreValue | null>(null);

/** Marks a session complete. Completing again keeps the first completion time and updates the answers. */
/**
 * A first completion on a day when another programme session was already done is recorded as earlyStart: the
 * user chose "Do the next one now anyway". The flag is fixed at first completion and never changes on later edits.
 */
export function withSession(d: AppData, sessionId: string, mode: SessionMode, answers: Record<string, string>, choices: Record<string, string>, t: string, thinkResponses: Record<string, string> = {}): AppData {
  const id = sessionRecordId(sessionId);
  const prev = d.sessions.find((s) => s.id === id);
  const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v));
  const earlyStart = prev ? prev.earlyStart : wouldBeEarly(d, sessionId, keyFromIso(t));
  const rec = {
    id, sessionId, completedAt: prev?.completedAt ?? t, updatedAt: t, mode,
    answers: { ...(prev?.answers ?? {}), ...clean }, choices: { ...(prev?.choices ?? {}), ...choices },
    earlyStart, thinkResponses: { ...(prev?.thinkResponses ?? {}), ...thinkResponses },
  };
  return { ...d, sessions: prev ? d.sessions.map((s) => (s.id === id ? rec : s)) : [...d.sessions, rec] };
}

export function StoreProvider({ children, adapter, locks, channel }: {
  children: ReactNode;
  adapter?: StorageAdapter;
  /** Web Locks implementation; default navigator.locks when present. null disables locking (fallback path). */
  locks?: Locks | null;
  /** Cross-tab notifications; default BroadcastChannel when present. null disables them (storage events still work). */
  channel?: ChangeChannel | null;
}) {
  const chan = useMemo(() => (channel === undefined ? browserChannel() : channel), [channel]);
  const repo = useMemo(
    () => new Repository(adapter ?? new LocalStorageAdapter(), { locks, onCommit: () => chan?.post() }),
    [adapter, locks, chan],
  );
  const initial = useMemo(() => repo.load(), [repo]);
  const [data, setData] = useState<AppData>(initial.data);
  const [loadIssue, setLoadIssue] = useState<LoadIssue | null>(initial.issue);
  const [writeIssue, setWriteIssue] = useState<WriteIssue | null>(initial.blocked ? { reason: 'newer', unsavedKey: null } : null);
  const [setAsideNotice, setSetAsideNotice] = useState(0);
  const dataRef = useRef(data);
  const pending = useRef(0);
  /** Changes that were refused. They stay applied on screen and are re-applied, in order, with the next write. */
  const unsaved = useRef<Change[]>([]);

  const show = (d: AppData) => {
    const withUnsaved = unsaved.current.reduce((acc, f) => f(acc, PREVIEW), d);
    dataRef.current = withUnsaved;
    setData(withUnsaved);
  };

  const settle = (r: TransactResult, batch: Change[]) => {
    pending.current--;
    if (r.ok) {
      setWriteIssue(null);
      if (r.setAside) setSetAsideNotice((n) => n + r.setAside);
      if (pending.current === 0) show(r.data);
    } else {
      // Refused: keep the changes on screen and in memory, and re-apply them with the next change.
      unsaved.current = [...batch, ...unsaved.current];
      setWriteIssue({ reason: r.reason, unsavedKey: r.unsavedKey });
    }
  };

  /** Applies a change on screen at once, then to the latest stored data under the lock. */
  const update = (fn: Change) => {
    const before = dataRef.current;
    const batch = [...unsaved.current, fn];
    unsaved.current = [];
    const next = fn(before, PREVIEW);
    dataRef.current = next;
    setData(next);
    pending.current++;
    const all: Change = (d, ctx) => batch.reduce((acc, f) => f(acc, ctx), d);
    void repo.transact(all, before).then((r) => settle(r, batch));
  };

  /** Re-reads storage after another tab may have written. Never writes unless a merge must be stored; never reloads the page. */
  const refresh = () => {
    if (pending.current > 0) return; // the write in flight re-reads storage itself
    const r = repo.load();
    if (r.blocked) {
      setWriteIssue({ reason: 'newer', unsavedKey: null });
      setLoadIssue(r.issue);
      return;
    }
    show(r.data);
    if (r.needsWrite) {
      pending.current++;
      void repo.open().then((o) => {
        pending.current--;
        if (o.setAside) setSetAsideNotice((n) => n + o.setAside);
        if (o.issue?.kind === 'backup-failed') setLoadIssue(o.issue);
        if (pending.current === 0) show(o.data);
      });
    }
  };
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  // Opening: the 1.0 upgrade, recovery or a 1.0 merge is written once, under the lock.
  useEffect(() => {
    pending.current++;
    let alive = true;
    void repo.open().then((r) => {
      pending.current--;
      if (!alive) return;
      if (r.issue) setLoadIssue(r.issue);
      if (r.setAside) setSetAsideNotice((n) => n + r.setAside);
      if (pending.current === 0) show(r.data);
    });
    return () => { alive = false; };
  }, [repo]);

  // Another tab (1.1 or 1.0) wrote, or this tab was in the background: re-read. Messages may be missed;
  // that is safe, because every write re-reads storage first.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key === null || e.key === STORE_KEY || e.key === LEGACY_KEY) refreshRef.current();
    };
    const onVisible = () => { if (document.visibilityState === 'visible') refreshRef.current(); };
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisible);
    const off = chan?.subscribe(() => refreshRef.current());
    return () => {
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisible);
      off?.();
    };
  }, [chan]);

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

  /** Replaces today's intention or reflection. If another tab changed it since this tab showed it, that version is set aside, not lost. */
  function replaceForDay<T extends { id: string; date: string; updatedAt: string }>(
    collection: 'intentions' | 'reflections' | 'plans', make: (existing: T | undefined) => T,
  ): void {
    const date = dateKey();
    const seen = (dataRef.current[collection] as unknown as T[]).find((x) => x.date === date);
    const created = make(undefined);
    update((d, ctx) => {
      const list = d[collection] as unknown as T[];
      const cur = list.find((x) => x.date === date);
      if (cur && ctx.live && !same(cur, seen)) ctx.setAside({ collection, reason: 'edited-in-two-places', record: cur, keptId: cur.id });
      const next = cur ? list.map((x) => (x.date === date ? make(x) : x)) : [...list, created];
      return { ...d, [collection]: next };
    });
  }

  const value: StoreValue = {
    data,
    loadIssue,
    writeIssue,
    saveError: writeIssue !== null,
    setAsideNotice,
    dismissSetAside: () => setSetAsideNotice(0),
    dismissLoadIssue: () => setLoadIssue(null),
    completeOnboarding: (displayName) => {
      const t = now();
      update((d) => ({
        ...d,
        onboardingCompletedAt: d.onboardingCompletedAt ?? t,
        settings: { ...d.settings, displayName: (displayName ?? d.settings.displayName).trim().slice(0, 80) },
      }));
    },
    updateSettings: (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    setIntention: (category, text, domain) => {
      const t = now();
      const id = newId('int');
      replaceForDay<AppData['intentions'][number]>('intentions', (x) =>
        x ? { ...x, category, domain, text: text.trim(), updatedAt: t } : { id, date: dateKey(), category, domain, text: text.trim(), createdAt: t, updatedAt: t });
    },
    saveReflection: (draft) => {
      const t = now();
      const id = newId('ref');
      const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()])) as ReflectionDraft;
      replaceForDay<AppData['reflections'][number]>('reflections', (x) =>
        x ? { ...x, ...clean, updatedAt: t } : { id, date: dateKey(), ...clean, createdAt: t, updatedAt: t });
    },
    setPracticeDraft: (practiceId, draft) => {
      const t = now();
      update((d) => ({ ...d, inProgress: { kind: 'practice', refId: practiceId, startedAt: d.inProgress?.refId === practiceId ? d.inProgress.startedAt : t, draft } }));
    },
    completePractice: (practiceId, response) => {
      const rec = { id: newId('prc'), practiceId, date: dateKey(), response: response.trim(), completedAt: now() };
      update((d) => ({
        ...d,
        practices: d.practices.some((p) => p.id === rec.id) ? d.practices : [...d.practices, rec],
        inProgress: d.inProgress?.kind === 'practice' && d.inProgress.refId === practiceId ? null : d.inProgress,
      }));
    },
    recordAttempt: (scenarioId, optionId) => {
      const rec = { id: newId('att'), scenarioId, optionId, at: now() };
      update((d) => ({
        ...d,
        attempts: d.attempts.some((a) => a.id === rec.id) ? d.attempts : [...d.attempts, rec],
        inProgress: { kind: 'scenario', refId: scenarioId, startedAt: d.inProgress?.refId === scenarioId ? d.inProgress.startedAt : rec.at, draft: '' },
      }));
    },
    completeScenario: (scenarioId, optionIds, note) => {
      const rec = { id: newId('cmp'), scenarioId, at: now(), optionIds, note: note.trim() };
      update((d) => ({
        ...d,
        completions: d.completions.some((c) => c.id === rec.id) ? d.completions : [...d.completions, rec],
        inProgress: d.inProgress?.kind === 'scenario' && d.inProgress.refId === scenarioId ? null : d.inProgress,
      }));
    },
    clearInProgress: () => update((d) => ({ ...d, inProgress: null })),
    createJournal: (draft) => {
      const t = now();
      const entry = { ...draft, id: newId('jrn'), createdAt: t, updatedAt: t };
      update((d) => (d.journal.some((j) => j.id === entry.id) ? d : { ...d, journal: [...d.journal, entry] }));
      return entry.id;
    },
    updateJournal: (id, draft) => {
      const t = now();
      const seen = dataRef.current.journal.find((j) => j.id === id);
      update((d, ctx) => {
        const cur = d.journal.find((j) => j.id === id);
        if (!cur) {
          // Deleted in another tab while being edited here: the edit is kept, not lost.
          return seen ? { ...d, journal: [...d.journal, { ...seen, ...draft, updatedAt: t }] } : d;
        }
        if (ctx.live && !same(cur, seen)) ctx.setAside({ collection: 'journal', reason: 'edited-in-two-places', record: cur, keptId: id });
        return { ...d, journal: d.journal.map((j) => (j.id === id ? { ...j, ...draft, updatedAt: t } : j)) };
      });
    },
    deleteJournal: (id) => {
      const seen = dataRef.current.journal.find((j) => j.id === id);
      update((d, ctx) => {
        const cur = d.journal.find((j) => j.id === id);
        if (cur && ctx.live && !same(cur, seen)) ctx.setAside({ collection: 'journal', reason: 'edited-in-two-places', record: cur });
        return { ...d, journal: d.journal.filter((j) => j.id !== id) };
      });
    },
    recordLibrary: (itemId, kind) => {
      const t = now();
      update((d) => (d.library.some((r) => r.itemId === itemId && r.kind === kind) ? d : { ...d, library: [...d.library, { itemId, kind, at: t }] }));
    },
    importData: (incoming, mode) =>
      update((d, ctx) => {
        if (ctx.live) repo.saveBackup(d); // the restore point is the latest stored data, not this tab's copy
        return mode === 'replace' ? incoming : mergeData(d, incoming);
      }),
    restoreBackup: () => {
      const b = repo.readBackup();
      if (!b) return false;
      update(() => b.data);
      return true;
    },
    backupInfo: () => {
      const b = repo.readBackup();
      return b ? { savedAt: b.savedAt } : null;
    },
    resetAll: () => {
      repo.clearAll();
      unsaved.current = [];
      dataRef.current = emptyData();
      setData(dataRef.current);
      setLoadIssue(null);
      setWriteIssue(null);
      chan?.post();
    },
    safetyCopies: () => repo.safetyCopies(),
    readSafetyCopy: (key) => repo.readRaw(key),

    startProgramme: () => {
      const t = now();
      update((d) => (d.programme ? d : { ...d, programme: { startedAt: t, disclaimerSeenAt: null, maintenanceStartedAt: null, noticeDismissedAt: null } }));
    },
    startMaintenance: () => {
      const t = now();
      update((d) => ({ ...d, programme: { startedAt: d.programme?.startedAt ?? t, disclaimerSeenAt: d.programme?.disclaimerSeenAt ?? t, maintenanceStartedAt: d.programme?.maintenanceStartedAt ?? t, noticeDismissedAt: d.programme?.noticeDismissedAt ?? null } }));
    },
    markDisclaimerSeen: () => {
      const t = now();
      update((d) => ({ ...d, programme: d.programme ? { ...d.programme, disclaimerSeenAt: d.programme.disclaimerSeenAt ?? t } : d.programme }));
    },
    dismissNotice: () => {
      const t = now();
      update((d) => ({ ...d, programme: d.programme ? { ...d.programme, disclaimerSeenAt: d.programme.disclaimerSeenAt ?? t, noticeDismissedAt: d.programme.noticeDismissedAt ?? t } : d.programme }));
    },
    saveValues: (choices) => {
      const t = now();
      update((d) => ({
        ...d,
        values: choices.map((c) => {
          const prev = d.values.find((v) => v.id === c.id);
          const sentence = c.sentence.trim();
          return prev && prev.sentence === sentence ? prev : { id: c.id, sentence, updatedAt: t };
        }),
      }));
    },
    saveBaseline: (kind, ratings, situations) => {
      const t = now();
      const id = kind === 'checkin' ? `bl_checkin_${dateKey().slice(0, 7)}` : `bl_${kind}`;
      update((d) => {
        const prev = d.baselines.find((b) => b.id === id);
        const rec = { id, kind, ratings, situations: situations.map((x) => x.trim()), completedAt: prev?.completedAt ?? t, updatedAt: t };
        const next = { ...d, baselines: prev ? d.baselines.map((b) => (b.id === id ? rec : b)) : [...d.baselines, rec] };
        if (kind === 'start') return withSession(next, DAY0_ID, 'write', {}, {}, t);
        if (kind === 'finish') return withSession(next, 'w6d1', 'write', {}, {}, t);
        return next;
      });
    },
    completeSession: (sessionId, mode, answers, choices = {}, thinkResponses = {}) => {
      const t = now();
      update((d) => withSession(d, sessionId, mode, answers, choices, t, thinkResponses));
    },
    saveReview: (week, review) => {
      const t = now();
      const id = `rev_w${week}`;
      update((d) => {
        const prev = d.reviews.find((r) => r.id === id);
        const rec = { id, week, worked: review.worked.trim(), gotInWay: review.gotInWay.trim(), noticed: review.noticed.trim(), rating: review.rating, catchUp: prev ? prev.catchUp && (review.catchUp ?? false) : review.catchUp ?? false, completedAt: prev?.completedAt ?? t, updatedAt: t };
        const next = { ...d, reviews: prev ? d.reviews.map((r) => (r.id === id ? rec : r)) : [...d.reviews, rec] };
        return withSession(next, `w${week}d6`, 'write', {}, {}, t);
      });
    },
    savePlan: (plan) => {
      const t = now();
      const id = newId('pln');
      replaceForDay<AppData['plans'][number]>('plans', (x) =>
        x ? { ...x, when: plan.when.trim(), then: plan.then.trim(), domain: plan.domain, valueId: plan.valueId ?? null, updatedAt: t }
          : { id, date: dateKey(), domain: plan.domain, valueId: plan.valueId ?? null, when: plan.when.trim(), then: plan.then.trim(), outcome: null, note: '', createdAt: t, updatedAt: t });
    },
    checkPlan: (outcome, note) => {
      const t = now();
      const date = dateKey();
      update((d) => ({ ...d, plans: d.plans.map((p) => (p.date === date ? { ...p, outcome, note: note.trim(), updatedAt: t } : p)) }));
    },
    answerRecall: (questionId, correct) => {
      const t = now();
      const today = dateKey();
      update((d) => ({ ...d, recall: recordRecall(d.recall, questionId, today, correct, t) }));
    },
    markExported: () => {
      const t = now();
      update((d) => ({ ...d, settings: { ...d.settings, lastExportAt: t } }));
    },
    dismissBackupNudge: () => {
      const today = dateKey();
      update((d) => ({ ...d, settings: { ...d.settings, backupNudgeDismissedOn: today } }));
    },
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error('useStore must be used inside StoreProvider');
  return v;
}
