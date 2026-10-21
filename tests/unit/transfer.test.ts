import { describe, expect, it } from 'vitest';
import { emptyData, SCHEMA_VERSION } from '../../src/storage/schema';
import { exportJson, mergeData, parseImport, summarize } from '../../src/storage/transfer';
import type { AppData } from '../../src/types';

const t1 = '2026-10-10T08:00:00.000Z';
const t2 = '2026-10-11T08:00:00.000Z';

function sample(): AppData {
  const d = emptyData(new Date(t1));
  d.onboardingCompletedAt = t1;
  d.intentions.push({ id: 'i1', date: '2026-10-10', category: 'speak-carefully', domain: 'speech', text: 'Speak plainly', createdAt: t1, updatedAt: t1 });
  d.reflections.push({ id: 'r1', date: '2026-10-10', happened: 'A meeting', initial: '', did: '', alternative: '', nextTime: '', createdAt: t1, updatedAt: t1 });
  d.practices.push({ id: 'p1', practiceId: 'speech-pause', date: '2026-10-10', response: '', completedAt: t1 });
  d.attempts.push({ id: 'a1', scenarioId: 'w-saturday-move', optionId: 'b', at: t1 });
  d.completions.push({ id: 'c1', scenarioId: 'w-saturday-move', at: t1, optionIds: ['b'], note: '' });
  d.journal.push({ id: 'j1', type: 'incident', answers: { facts: 'A thing happened' }, domain: null, scenarioId: null, themes: [], createdAt: t1, updatedAt: t1 });
  d.library.push({ itemId: 'section-speech', kind: 'completed', at: t1 });
  return d;
}

describe('export and import', () => {
  it('round-trips through the export envelope', () => {
    const d = sample();
    const r = parseImport(exportJson(d));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual(d);
      expect(r.summary).toEqual(summarize(d));
      expect(r.exportedAt).not.toBeNull();
    }
  });
  it('accepts a bare data object', () => {
    expect(parseImport(JSON.stringify(sample())).ok).toBe(true);
  });
  it('migrates a 1.0 backup on import', () => {
    const t = t1;
    const v1 = { schemaVersion: 1, createdAt: t, onboardingCompletedAt: t, settings: { displayName: '', streaksEnabled: false, theme: 'system' }, intentions: [], attempts: [], journal: [], library: [] };
    const r = parseImport(JSON.stringify({ app: 'equanim', exportedAt: t, data: v1 }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.schemaVersion).toBe(SCHEMA_VERSION);
  });
  it('rejects invalid files with a helpful message', () => {
    expect(parseImport('hello')).toEqual({ ok: false, error: 'This file is not valid JSON.' });
    expect(parseImport(JSON.stringify({ app: 'other', data: {} })).ok).toBe(false);
    const bad = parseImport(JSON.stringify({ app: 'equanim', data: { ...sample(), attempts: 'x' } }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/attempts/);
    const badType = parseImport(JSON.stringify({ app: 'equanim', data: { ...sample(), journal: [{ ...sample().journal[0], type: 'poem' }] } }));
    expect(badType.ok).toBe(false);
  });
});

describe('merge', () => {
  it('unions records, dedupes by id and keeps current settings', () => {
    const current = sample();
    current.settings.displayName = 'Current';
    const incoming = sample();
    incoming.settings.displayName = 'Incoming';
    incoming.journal.push({ ...incoming.journal[0]!, id: 'j2', answers: { facts: 'Another' } });
    incoming.journal[0] = { ...incoming.journal[0]!, answers: { facts: 'Edited later' }, updatedAt: t2 };
    const m = mergeData(current, incoming);
    expect(m.settings.displayName).toBe('Current');
    expect(m.journal).toHaveLength(2);
    expect(m.journal.find((j) => j.id === 'j1')!.answers.facts).toBe('Edited later');
    expect(m.attempts).toHaveLength(1);
    expect(m.completions).toHaveLength(1);
    expect(m.library).toHaveLength(1);
  });
  it('keeps one intention and one reflection per day, preferring the more recently updated', () => {
    const current = sample();
    const incoming = sample();
    incoming.intentions = [{ ...incoming.intentions[0]!, id: 'other', text: 'Newer', updatedAt: t2 }];
    incoming.reflections = [{ ...incoming.reflections[0]!, id: 'r2', happened: 'Newer', updatedAt: t2 }];
    const m = mergeData(current, incoming);
    expect(m.intentions).toHaveLength(1);
    expect(m.intentions[0]!.text).toBe('Newer');
    expect(m.reflections).toHaveLength(1);
    expect(m.reflections[0]!.happened).toBe('Newer');
  });
});
