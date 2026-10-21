import { describe, expect, it } from 'vitest';
import { Repository, MemoryAdapter, DATA_KEY, STORE_KEY, CORRUPT_PREFIX, PRE_MIGRATION_PREFIX, RECOVERY_PREFIX, BACKUP_KEY } from '../../src/storage/storage';

/** The 1.1 store's data. DATA_KEY is Equanim 1.0's key, which 1.1 reads but never writes. */
const storeData = (a: MemoryAdapter) => (JSON.parse(a.get(STORE_KEY)!) as { data: { schemaVersion: number } }).data;
import { exportJson, parseImport } from '../../src/storage/transfer';
import { emptyData, migrate, MigrationError, SCHEMA_VERSION, validateAppData } from '../../src/storage/schema';

const T = '2026-10-17T10:00:00.000Z';

describe('repository', () => {
  it('returns empty data when nothing is stored', () => {
    const r = new Repository(new MemoryAdapter()).load();
    expect(r.issue).toBeNull();
    expect(r.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(r.data.onboardingCompletedAt).toBeNull();
  });
  it('round-trips saved data', () => {
    const a = new MemoryAdapter();
    const repo = new Repository(a);
    const d = emptyData();
    d.settings.displayName = 'Asha';
    expect(repo.save(d)).toBe(true);
    expect(repo.load().data.settings.displayName).toBe('Asha');
  });
  it('keeps unreadable JSON under a separate key and starts fresh', async () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, '{not json');
    const r = await new Repository(a).open();
    expect(r.issue?.kind).toBe('unreadable');
    const key = r.issue!.backupKey!;
    expect(a.get(key)).toBe('{not json');
    expect(key.startsWith(CORRUPT_PREFIX)).toBe(true);
    expect(r.data.journal).toEqual([]);
  });
  it('recovers valid records from partly malformed current data and keeps the original', async () => {
    const a = new MemoryAdapter();
    const good = { id: 'j1', type: 'free', answers: { text: 'kept' }, domain: null, scenarioId: null, themes: [], createdAt: T, updatedAt: T };
    const raw = JSON.stringify({ ...emptyData(), journal: [good, { id: 5 }, 'junk'], settings: { displayName: 'Asha', streaksEnabled: 'yes', theme: 'dark' } });
    a.set(DATA_KEY, raw);
    const r = await new Repository(a).open();
    expect(r.issue?.kind).toBe('partial');
    if (r.issue?.kind !== 'partial') throw new Error();
    expect(r.issue.dropped).toBe(3); // two journal items + the settings value
    expect(r.data.journal).toEqual([good]);
    expect(r.data.settings).toEqual({ displayName: 'Asha', streaksEnabled: false, theme: 'dark', lastExportAt: null, backupNudgeDismissedOn: null, reminderTime: null });
    expect(r.issue.backupKey.startsWith(RECOVERY_PREFIX)).toBe(true);
    expect(a.get(r.issue.backupKey)).toBe(raw);
  });
  it('reports data from a newer schema without deleting it', async () => {
    const a = new MemoryAdapter();
    const raw = JSON.stringify({ ...emptyData(), schemaVersion: SCHEMA_VERSION + 1 });
    a.set(DATA_KEY, raw);
    const r = await new Repository(a).open();
    expect(r.issue?.kind).toBe('newer');
    expect(a.get(r.issue!.backupKey!)).toBe(raw);
  });
  it('migrates unversioned (v0) data and persists the migrated form', async () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, JSON.stringify({ createdAt: new Date().toISOString(), onboardingCompletedAt: null, settings: { displayName: 'Old' } }));
    const r = await new Repository(a).open();
    expect(r.issue).toBeNull();
    expect(r.data.settings).toEqual({ displayName: 'Old', streaksEnabled: false, theme: 'system', lastExportAt: null, backupNudgeDismissedOn: null, reminderTime: null });
    expect(storeData(a).schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('clearAll removes only Equanim keys', () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, '{}');
    a.set('equanim:pre-import-backup', '{}');
    a.set('other-app', 'x');
    new Repository(a).clearAll();
    expect(a.keys()).toEqual(['other-app']);
  });
  it('save reports failure when storage throws', () => {
    const a = new MemoryAdapter();
    a.set = () => { throw new Error('QuotaExceeded'); };
    expect(new Repository(a).save(emptyData())).toBe(false);
  });
});

describe('migration engine', () => {
  it('runs a chain of migrations in order', () => {
    const chain = {
      0: (d: Record<string, unknown>) => ({ ...d, schemaVersion: 1, a: true }),
      1: (d: Record<string, unknown>) => ({ ...d, schemaVersion: 2, b: true }),
    };
    expect(migrate({}, chain, 2)).toEqual({ schemaVersion: 2, a: true, b: true });
  });
  it('fails clearly when a step is missing or does not advance', () => {
    expect(() => migrate({ schemaVersion: 0 }, {}, 1)).toThrow(MigrationError);
    expect(() => migrate({}, { 0: (d: Record<string, unknown>) => d }, 1)).toThrow(/did not advance/);
    expect(() => migrate('nope')).toThrow(MigrationError);
  });
  it('validator rejects bad domains, dates and outcomes', () => {
    const d = emptyData();
    const t = new Date().toISOString();
    const bad = { ...d, intentions: [{ id: 'i', date: '18-10-2026', category: 'karma', domain: 'words', text: 'x', createdAt: t, updatedAt: t }] };
    expect(validateAppData(bad).ok).toBe(false);
  });
});


// ---------------------------------------------------------------------------
// Equanim 1.0 (schema v1, live at the time of writing) → 1.1 (schema v2)
// ---------------------------------------------------------------------------
const t = (d: number, h = 9) => new Date(Date.UTC(2026, 9, d, h)).toISOString();

/** A synthetic 1.0 document exercising every record type and field 1.0 could store. */
function v1Fixture() {
  return {
    schemaVersion: 1,
    createdAt: t(1),
    onboardingCompletedAt: t(1, 10),
    settings: { displayName: 'Asha', streaksEnabled: true, theme: 'dark' },
    intentions: [
      { id: 'int_a', date: '2026-10-02', domain: 'words', text: 'Say a clear no', createdAt: t(2), updatedAt: t(2, 11), reflection: { outcome: 'in-the-moment', note: 'Did it at lunch.', at: t(2, 21) } },
      { id: 'int_b', date: '2026-10-03', domain: 'perspective', text: 'Not about me', createdAt: t(3), updatedAt: t(3), reflection: { outcome: 'afterwards', note: '', at: t(3, 22) } },
      { id: 'int_c', date: '2026-10-04', domain: 'assumptions', text: 'Ask first', createdAt: t(4), updatedAt: t(4), reflection: { outcome: 'slipped-past', note: 'Busy day', at: t(4, 23) } },
      { id: 'int_d', date: '2026-10-05', domain: 'effort', text: 'Good enough', createdAt: t(5), updatedAt: t(5), reflection: null },
    ],
    attempts: [
      { id: 'att_1', scenarioId: 'p-one-word-reply', optionId: 'a', at: t(2, 12) },
      { id: 'att_2', scenarioId: 'p-one-word-reply', optionId: 'b', at: t(2, 13) },
      { id: 'att_3', scenarioId: 'p-one-word-reply', optionId: 'a', at: t(6, 8) },
      { id: 'att_4', scenarioId: 'w-saturday-move', optionId: 'c', at: t(3, 12) },
      { id: 'att_5', scenarioId: 'retired-scenario', optionId: 'x', at: t(3, 13) },
    ],
    journal: [
      { id: 'jrn_full', createdAt: t(2, 20), updatedAt: t(7), domain: 'perspective', scenarioId: 'p-one-word-reply', situation: 'Manager said ok.', story: 'She is unhappy.', response: 'Rewrote it.', nextTime: 'Ask at check-in.', note: 'Tired that day.' },
      { id: 'jrn_sparse', createdAt: t(3, 20), updatedAt: t(3, 20), domain: null, scenarioId: null, situation: 'Only this.', story: '', response: '', nextTime: '', note: '' },
    ],
    library: [
      { itemId: 'section-words', kind: 'read', at: t(2, 7) },
      { itemId: 'essay-boundary-not-wall', kind: 'read', at: t(3, 7) },
      { itemId: 'essay-boundary-not-wall', kind: 'exercise', at: t(3, 8) },
      { itemId: 'essay-difficult-days', kind: 'exercise', at: t(4, 7) },
    ],
  };
}

describe('Equanim 1.0 → 1.1 migration', () => {
  const load = async (raw: string) => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, raw);
    return { a, r: await new Repository(a).open() };
  };

  it('recognises 1.0 data and migrates it without an issue', async () => {
    const { r } = await load(JSON.stringify(v1Fixture()));
    expect(r.issue).toBeNull();
    expect(r.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(validateAppData(r.data).ok).toBe(true);
  });

  it('keeps preferences and onboarding state', async () => {
    const { r } = await load(JSON.stringify(v1Fixture()));
    expect(r.data.settings).toEqual({ displayName: 'Asha', streaksEnabled: true, theme: 'dark', lastExportAt: null, backupNudgeDismissedOn: null, reminderTime: null });
    expect(r.data.createdAt).toBe(t(1));
    expect(r.data.onboardingCompletedAt).toBe(t(1, 10));
  });

  it('keeps every intention with its id, date, text and timestamps', async () => {
    const v1 = v1Fixture();
    const { r } = await load(JSON.stringify(v1));
    expect(r.data.intentions).toHaveLength(4);
    v1.intentions.forEach((i, n) => {
      expect(r.data.intentions[n]).toEqual({ id: i.id, date: i.date, category: 'custom', domain: { words: 'speech', perspective: 'personalisation', assumptions: 'inquiry', effort: 'effort' }[i.domain], text: i.text, createdAt: i.createdAt, updatedAt: i.updatedAt });
    });
  });

  it('keeps each evening check-in exactly, with its outcome, note and time', async () => {
    const { r } = await load(JSON.stringify(v1Fixture()));
    expect(r.data.reflections).toHaveLength(3);
    expect(r.data.reflections.map((x) => x.legacyCheckIn)).toEqual([
      { outcome: 'in-the-moment', note: 'Did it at lunch.' },
      { outcome: 'afterwards', note: '' },
      { outcome: 'slipped-past', note: 'Busy day' },
    ]);
    expect(r.data.reflections[0]).toMatchObject({ id: 'ref_int_a', date: '2026-10-02', createdAt: t(2, 21), updatedAt: t(2, 21), happened: '' });
  });

  it('keeps every scenario attempt unchanged and derives one completion per explored scenario', async () => {
    const v1 = v1Fixture();
    const { r } = await load(JSON.stringify(v1));
    expect(r.data.attempts).toEqual(v1.attempts);
    expect(r.data.completions).toEqual([
      { id: 'cmp_p-one-word-reply_migrated', scenarioId: 'p-one-word-reply', at: t(6, 8), optionIds: ['a', 'b'], note: '' },
      { id: 'cmp_w-saturday-move_migrated', scenarioId: 'w-saturday-move', at: t(3, 12), optionIds: ['c'], note: '' },
      { id: 'cmp_retired-scenario_migrated', scenarioId: 'retired-scenario', at: t(3, 13), optionIds: ['x'], note: '' },
    ]);
  });

  it('keeps every journal entry, its text under same-meaning questions or its original 1.0 label', async () => {
    const { r } = await load(JSON.stringify(v1Fixture()));
    expect(r.data.journal).toEqual([
      { id: 'jrn_full', type: 'incident', domain: 'personalisation', scenarioId: 'p-one-word-reply', themes: [], createdAt: t(2, 20), updatedAt: t(7),
        answers: { facts: 'Manager said ok.', interpretation: 'She is unhappy.', response: 'Rewrote it.', nextTime: 'Ask at check-in.', note: 'Tired that day.' } },
      { id: 'jrn_sparse', type: 'incident', domain: null, scenarioId: null, themes: [], createdAt: t(3, 20), updatedAt: t(3, 20), answers: { facts: 'Only this.' } },
    ]);
  });

  it('keeps reading progress: 1.0 "read" stays shown as read, exercises stay tried', async () => {
    const { r } = await load(JSON.stringify(v1Fixture()));
    expect(r.data.library).toEqual([
      { itemId: 'section-speech', kind: 'opened', at: t(2, 7) },
      { itemId: 'section-speech', kind: 'completed', at: t(2, 7) },
      { itemId: 'essay-boundaries', kind: 'opened', at: t(3, 7) },
      { itemId: 'essay-boundaries', kind: 'completed', at: t(3, 7) },
      { itemId: 'essay-boundaries', kind: 'exercise', at: t(3, 8) },
      { itemId: 'essay-difficult-day', kind: 'exercise', at: t(4, 7) },
    ]);
  });

  it('keeps the exact original before rewriting it, and the original can be imported back', async () => {
    const raw = JSON.stringify(v1Fixture());
    const { a } = await load(raw);
    const copies = a.keys().filter((k) => k.startsWith(`${PRE_MIGRATION_PREFIX}v1:`));
    expect(copies).toHaveLength(1);
    expect(a.get(copies[0]!)).toBe(raw);
    expect(storeData(a).schemaVersion).toBe(SCHEMA_VERSION);
    expect(a.get(DATA_KEY)).toBe(raw); // 1.1 never rewrites the 1.0 key
    const imported = parseImport(raw);
    expect(imported.ok).toBe(true);
  });

  it('is idempotent: reloading, or the same 1.0 data arriving again, creates no duplicates', async () => {
    const raw = JSON.stringify(v1Fixture());
    const { a, r } = await load(raw);
    const again = await new Repository(a).open();
    expect(again.data).toEqual(r.data);
    expect(a.keys().filter((k) => k.startsWith(PRE_MIGRATION_PREFIX))).toHaveLength(1); // no second copy when nothing migrates
    expect(migrate(JSON.parse(raw))).toEqual(migrate(JSON.parse(raw)));
    // e.g. an old 1.0 tab writes the same data back: the result is identical, ids included
    const second = (await load(raw)).r.data;
    expect(second).toEqual(r.data);
    const ids = (xs: { id: string }[]) => xs.map((x) => x.id);
    for (const k of ['intentions', 'reflections', 'attempts', 'completions', 'journal'] as const) expect(new Set(ids(second[k])).size).toBe(second[k].length);
  });

  it('handles incomplete and malformed 1.0 records: keeps the rest, reports, and keeps the original', async () => {
    const v1 = v1Fixture() as Record<string, unknown> & ReturnType<typeof v1Fixture>;
    const bad = {
      ...v1,
      settings: { theme: 'neon' },
      intentions: [...v1.intentions, { id: 'int_bad', date: 'yesterday', domain: 'words', text: 'x', createdAt: t(8), updatedAt: t(8), reflection: { outcome: 'great', note: '', at: 'never' } }, null],
      attempts: [...v1.attempts, { id: 'att_bad', scenarioId: 7 }],
      journal: [...v1.journal, { id: 'jrn_bad', situation: 12 }],
      library: [...v1.library, { itemId: 'section-words', kind: 'skimmed', at: t(9) }],
    };
    const raw = JSON.stringify(bad);
    const { a, r } = await load(raw);
    expect(r.issue?.kind).toBe('partial');
    if (r.issue?.kind !== 'partial') throw new Error();
    // Everything valid survives.
    expect(r.data.intentions.map((i) => i.id)).toEqual(['int_a', 'int_b', 'int_c', 'int_d']);
    expect(r.data.reflections).toHaveLength(3);
    expect(r.data.attempts).toHaveLength(5);
    expect(r.data.journal.map((j) => j.id)).toEqual(['jrn_full', 'jrn_sparse']);
    expect(r.data.library).toHaveLength(6);
    expect(r.data.settings).toEqual({ displayName: '', streaksEnabled: false, theme: 'system', lastExportAt: null, backupNudgeDismissedOn: null, reminderTime: null });
    expect(r.issue.dropped).toBe(7);
    // The original is kept twice over: before migration and before recovery.
    expect(a.get(r.issue.backupKey)).toBe(raw);
    expect(a.keys().some((k) => k.startsWith(PRE_MIGRATION_PREFIX) && a.get(k) === raw)).toBe(true);
  });

  it('never overwrites the original when the safety copy cannot be written', async () => {
    const raw = JSON.stringify(v1Fixture());
    const a = new MemoryAdapter();
    a.set(DATA_KEY, raw);
    const realSet = a.set.bind(a);
    a.set = (k: string, v: string) => { if (k !== DATA_KEY) throw new Error('QuotaExceeded'); realSet(k, v); };
    const repo = new Repository(a);
    const r = await repo.open();
    expect(r.issue?.kind).toBe('backup-failed');
    expect(r.data.intentions).toHaveLength(4); // still readable in memory
    expect(repo.save(r.data)).toBe(false); // saving is paused
    expect(a.get(DATA_KEY)).toBe(raw); // the original is untouched
  });

  it('never overwrites unreadable data when its copy cannot be written', async () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, '{broken');
    const realSet = a.set.bind(a);
    a.set = (k: string, v: string) => { if (k !== DATA_KEY) throw new Error('QuotaExceeded'); realSet(k, v); };
    const repo = new Repository(a);
    expect((await repo.open()).issue?.kind).toBe('backup-failed');
    expect(repo.save(emptyData())).toBe(false);
    expect(a.get(DATA_KEY)).toBe('{broken');
  });

  it('lists safety copies so they can be downloaded, and erasing removes them only on reset', async () => {
    const { a } = await load(JSON.stringify(v1Fixture()));
    const repo = new Repository(a);
    const copies = repo.safetyCopies();
    expect(copies.map((c) => c.kind)).toEqual(['pre-migration']);
    expect(repo.readRaw(copies[0]!.key)).toContain('"schemaVersion":1');
    expect(repo.readRaw(DATA_KEY)).toBeNull(); // only safety keys are readable this way
    repo.clearAll();
    expect(repo.safetyCopies()).toEqual([]);
  });
});

describe('backup and restore', () => {
  it('migrated data survives export, erase and import unchanged', async () => {
    const a0 = new MemoryAdapter(); a0.set(DATA_KEY, JSON.stringify(v1Fixture()));
    const r = await new Repository(a0).open();
    const file = exportJson(r.data);
    const fresh = new MemoryAdapter();
    const repo = new Repository(fresh);
    repo.clearAll();
    const imported = parseImport(file);
    expect(imported.ok).toBe(true);
    if (!imported.ok) return;
    repo.save(imported.data);
    expect(repo.load().data).toEqual(r.data);
  });
  it('the pre-import restore point round-trips', () => {
    const a = new MemoryAdapter();
    const repo = new Repository(a);
    const d = emptyData();
    d.settings.displayName = 'Before import';
    expect(repo.saveBackup(d)).toBe(true);
    expect(a.get(BACKUP_KEY)).not.toBeNull();
    expect(repo.readBackup()!.data).toEqual(d);
  });
});
