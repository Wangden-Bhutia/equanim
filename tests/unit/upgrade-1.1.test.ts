/**
 * Equanim 1.1 (schema 2, deployed) → 1.2 (schema 3, the 6-week programme). The 1.1 side is the real 1.1 storage
 * code (tests/fixtures/equanim-1.1, copied from main @ 2aae1a7). Deterministic: no timers.
 */
import { describe, expect, it } from 'vitest';
import { Repository, MemoryAdapter, STORE_KEY, PRE_MIGRATION_PREFIX, UNSAVED_PREFIX, type StorageAdapter } from '../../src/storage/storage';
import { SCHEMA_VERSION } from '../../src/storage/schema';
import { exportJson, parseImport } from '../../src/storage/transfer';
import { merge3 } from '../../src/storage/reconcile';
import { emptyData } from '../../src/storage/schema';
import { Repository as Repo11 } from '../fixtures/equanim-1.1/storage/storage';
import type { AppData as Data11 } from '../fixtures/equanim-1.1/types';
import type { AppData } from '../../src/types';

const T = (d: number, h = 9) => new Date(Date.UTC(2026, 9, d, h)).toISOString();

/** A 1.1 document using every record type and field 1.1 can store. */
function rich11(base: Data11): Data11 {
  return {
    ...base,
    onboardingCompletedAt: T(1, 10),
    settings: { displayName: 'Asha', streaksEnabled: true, theme: 'dark' },
    intentions: [{ id: 'int_1', date: '2026-10-05', category: 'ask-before-assuming', domain: 'inquiry', text: 'Ask first', createdAt: T(5), updatedAt: T(5, 10) }],
    reflections: [
      { id: 'ref_1', date: '2026-10-05', happened: 'Meeting', initial: 'Annoyed', did: 'Asked', alternative: 'Wait', nextTime: 'Ask sooner', createdAt: T(5, 20), updatedAt: T(5, 21) },
      { id: 'ref_int_old', date: '2026-10-02', happened: '', initial: '', did: '', alternative: '', nextTime: '', createdAt: T(2, 21), updatedAt: T(2, 21), legacyCheckIn: { outcome: 'afterwards', note: 'Later' } },
    ],
    practices: [{ id: 'prc_1', practiceId: 'pr-camera-view', date: '2026-10-05', response: 'Camera version', completedAt: T(5, 11) }],
    attempts: [{ id: 'att_1', scenarioId: 'p-one-word-reply', optionId: 'a', at: T(5, 12) }],
    completions: [{ id: 'cmp_1', scenarioId: 'p-one-word-reply', at: T(5, 13), optionIds: ['a', 'b'], note: 'He was busy' }],
    journal: [{ id: 'jrn_1', type: 'incident', answers: { facts: 'Ok.', interpretation: 'Upset', nextTime: '1.0 label kept' }, domain: 'personalisation', scenarioId: null, themes: ['work'], createdAt: T(6), updatedAt: T(7) }],
    library: [{ itemId: 'section-speech', kind: 'opened', at: T(6, 7) }, { itemId: 'section-speech', kind: 'completed', at: T(6, 8) }],
    inProgress: { kind: 'practice', refId: 'pr-define-done', startedAt: T(8), draft: 'half written' },
  };
}

async function written11(a: StorageAdapter = new MemoryAdapter()) {
  const r11 = new Repo11(a, { locks: null });
  await r11.open();
  const res = await r11.transact((d) => rich11(d));
  if (!res.ok) throw new Error('1.1 write failed');
  return { a, r11, data11: res.data, raw11: a.get(STORE_KEY)! };
}

const V3_KEYS = ['programme', 'sessions', 'values', 'baselines', 'reviews', 'plans', 'recall'];
const strip = (d: AppData) => {
  const o: Record<string, unknown> = { ...d, settings: { displayName: d.settings.displayName, streaksEnabled: d.settings.streaksEnabled, theme: d.settings.theme } };
  for (const k of V3_KEYS) delete o[k];
  delete o.schemaVersion;
  return o;
};

describe('1.1 → 1.2 upgrade', () => {
  it('is lossless: every 1.1 value is carried over exactly, programme data starts empty and unenrolled', async () => {
    const { a, data11 } = await written11();
    const r = await new Repository(a, { locks: null }).open();
    expect(r.issue).toBeNull();
    expect(r.data.schemaVersion).toBe(SCHEMA_VERSION);
    const { schemaVersion: _v, ...rest11 } = data11;
    expect(strip(r.data)).toEqual(rest11);
    expect(r.data.settings).toEqual({ ...data11.settings, lastExportAt: null, backupNudgeDismissedOn: null, reminderTime: null });
    expect(r.data.programme).toBeNull(); // existing users are offered the programme, never enrolled automatically
    for (const k of V3_KEYS.slice(1)) expect((r.data as unknown as Record<string, unknown[]>)[k]).toEqual([]);
  });

  it('keeps the exact 1.1 store text before upgrading it, and upgrading again changes nothing', async () => {
    const { a, raw11 } = await written11();
    await new Repository(a, { locks: null }).open();
    const copies = a.keys().filter((k) => k.startsWith(`${PRE_MIGRATION_PREFIX}store-v2:`));
    expect(copies).toHaveLength(1);
    expect(a.get(copies[0]!)).toBe(raw11);
    const after = a.get(STORE_KEY);
    await new Repository(a, { locks: null }).open();
    expect(a.get(STORE_KEY)).toBe(after);
    expect(a.keys().filter((k) => k.startsWith(PRE_MIGRATION_PREFIX))).toHaveLength(1);
  });

  it('stops without replacing the 1.1 store if the safety copy cannot be written', async () => {
    const { a, raw11 } = await written11();
    const realSet = a.set.bind(a);
    a.set = (k, v) => { if (k.startsWith('equanim:pre-migration:')) throw new Error('QuotaExceeded'); realSet(k, v); };
    const repo = new Repository(a, { locks: null });
    const r = await repo.open();
    expect(r.issue?.kind).toBe('backup-failed');
    expect(a.get(STORE_KEY)).toBe(raw11);
    expect((await repo.transact((d) => d)).ok).toBe(false);
    expect(a.get(STORE_KEY)).toBe(raw11);
  });

  it('a 1.1 write landing during the upgrade is re-read and kept (check-and-set)', async () => {
    const { a: base, r11 } = await written11();
    let fired = false;
    const a: StorageAdapter = {
      get: (k) => base.get(k), remove: (k) => base.remove(k), keys: () => base.keys(),
      set: (k, v) => {
        base.set(k, v);
        if (!fired && k.startsWith(PRE_MIGRATION_PREFIX)) {
          fired = true;
          r11.load();
          const d = r11.load().data;
          r11.save({ ...d, journal: [...d.journal, { id: 'jrn_late', type: 'free', answers: { text: 'written by 1.1 mid-upgrade' }, domain: null, scenarioId: null, themes: [], createdAt: T(9), updatedAt: T(9) }] });
        }
      },
    };
    const r = await new Repository(a, { locks: null }).open();
    expect(fired).toBe(true);
    expect(r.data.journal.map((j) => j.id)).toEqual(['jrn_1', 'jrn_late']);
  });

  it('a 1.1 tab still open after the upgrade refuses to write, and keeps its change as a copy', async () => {
    const { a, r11 } = await written11();
    await new Repository(a, { locks: null }).open();
    const v3 = a.get(STORE_KEY);
    const res = await r11.transact((d) => ({ ...d, journal: [...d.journal, { id: 'jrn_stale', type: 'free', answers: { text: 'from the old tab' }, domain: null, scenarioId: null, themes: [], createdAt: T(10), updatedAt: T(10) }] }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('newer');
    expect(a.get(STORE_KEY)).toBe(v3); // the upgraded store is untouched
    const kept = a.keys().filter((k) => k.startsWith(UNSAVED_PREFIX)).map((k) => a.get(k)).join();
    expect(kept).toContain('from the old tab');
  });

  it('a 1.1 export imports into 1.2 unchanged', async () => {
    const { data11 } = await written11();
    const parsed = parseImport(JSON.stringify({ app: 'equanim', exportedAt: T(10), data: data11 }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { schemaVersion: _v, ...rest11 } = data11;
    expect(strip(parsed.data)).toEqual(rest11);
    // and a 1.2 export round-trips
    const again = parseImport(exportJson(parsed.data));
    expect(again.ok && again.data).toEqual(parsed.data);
  });
});

describe('programme data across tabs (record-level merge)', () => {
  const ses = (sessionId: string, at: string) => ({ id: `ses_${sessionId}`, sessionId, completedAt: at, updatedAt: at, mode: 'think' as const, answers: {}, choices: {} });
  const plan = (when: string, at: string) => ({ id: `pln_${when}`, date: '2026-10-21', domain: 'personalisation' as const, when, then: 'pause', outcome: null, note: '', createdAt: at, updatedAt: at });
  it('keeps sessions completed in different tabs, and sets aside the older of two plans for the same day', () => {
    const base: AppData = { ...emptyData(), programme: { startedAt: T(20), disclaimerSeenAt: null } };
    const ours = { ...base, sessions: [ses('w1d1', T(21, 8))], plans: [plan('meeting', T(21, 8))] };
    const theirs = { ...base, sessions: [ses('w1d2', T(21, 9))], plans: [plan('call', T(21, 9))], programme: { startedAt: T(20), disclaimerSeenAt: T(21, 9) } };
    const m = merge3(base, ours, theirs);
    expect(m.data.sessions.map((s) => s.sessionId).sort()).toEqual(['w1d1', 'w1d2']);
    expect(m.data.plans.map((p) => p.when)).toEqual(['call']);
    expect(m.setAside).toEqual([expect.objectContaining({ collection: 'plans', reason: 'same-day-duplicate' })]);
    expect(m.data.programme?.disclaimerSeenAt).toBe(T(21, 9));
  });
  it('an enrolment in one tab is never undone by another tab that had not enrolled', () => {
    const base = emptyData();
    const m = merge3(base, base, { ...base, programme: { startedAt: T(21), disclaimerSeenAt: null } });
    expect(m.data.programme?.startedAt).toBe(T(21));
  });
});
