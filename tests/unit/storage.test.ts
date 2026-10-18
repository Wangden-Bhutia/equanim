import { describe, expect, it } from 'vitest';
import { Repository, MemoryAdapter, DATA_KEY, CORRUPT_PREFIX } from '../../src/lib/storage';
import { emptyData, migrate, MigrationError, SCHEMA_VERSION, validateAppData } from '../../src/lib/schema';

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
  it('keeps unreadable JSON under a separate key and starts fresh', () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, '{not json');
    const r = new Repository(a).load();
    expect(r.issue?.kind).toBe('unreadable');
    expect(a.get(r.issue!.backupKey)).toBe('{not json');
    expect(r.issue!.backupKey.startsWith(CORRUPT_PREFIX)).toBe(true);
    expect(r.data.journal).toEqual([]);
  });
  it('treats structurally invalid data as unreadable', () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, JSON.stringify({ ...emptyData(), journal: [{ id: 5 }] }));
    expect(new Repository(a).load().issue?.kind).toBe('unreadable');
  });
  it('reports data from a newer schema without deleting it', () => {
    const a = new MemoryAdapter();
    const raw = JSON.stringify({ ...emptyData(), schemaVersion: SCHEMA_VERSION + 1 });
    a.set(DATA_KEY, raw);
    const r = new Repository(a).load();
    expect(r.issue?.kind).toBe('newer');
    expect(a.get(r.issue!.backupKey)).toBe(raw);
  });
  it('migrates unversioned (v0) data and persists the migrated form', () => {
    const a = new MemoryAdapter();
    a.set(DATA_KEY, JSON.stringify({ createdAt: new Date().toISOString(), onboardingCompletedAt: null, settings: { displayName: 'Old' } }));
    const r = new Repository(a).load();
    expect(r.issue).toBeNull();
    expect(r.data.settings).toEqual({ displayName: 'Old', streaksEnabled: false, theme: 'system' });
    expect(JSON.parse(a.get(DATA_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
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
    expect(() => migrate({}, { 0: (d) => d }, 1)).toThrow(/did not advance/);
    expect(() => migrate('nope')).toThrow(MigrationError);
  });
  it('validator rejects bad domains, dates and outcomes', () => {
    const d = emptyData();
    const t = new Date().toISOString();
    const bad = { ...d, intentions: [{ id: 'i', date: '18-10-2026', domain: 'karma', text: 'x', createdAt: t, updatedAt: t, reflection: { outcome: 'great', note: '', at: t } }] };
    expect(validateAppData(bad).ok).toBe(false);
  });
});
