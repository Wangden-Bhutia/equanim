import { describe, expect, it } from 'vitest';
import { emptyData } from '../../src/lib/schema';
import { exportJson, mergeData, parseImport, summarize } from '../../src/lib/transfer';
import type { AppData } from '../../src/lib/types';

const t1 = '2026-10-10T08:00:00.000Z';
const t2 = '2026-10-11T08:00:00.000Z';

function sample(): AppData {
  const d = emptyData(new Date(t1));
  d.onboardingCompletedAt = t1;
  d.intentions.push({ id: 'i1', date: '2026-10-10', domain: 'words', text: 'Speak plainly', createdAt: t1, updatedAt: t1, reflection: null });
  d.attempts.push({ id: 'a1', scenarioId: 'w-saturday-move', optionId: 'b', at: t1 });
  d.journal.push({ id: 'j1', createdAt: t1, updatedAt: t1, domain: null, scenarioId: null, situation: 'A thing happened', story: '', response: '', nextTime: '', note: '' });
  d.library.push({ itemId: 'section-words', kind: 'read', at: t1 });
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
  it('rejects invalid files with a helpful message', () => {
    expect(parseImport('hello')).toEqual({ ok: false, error: 'This file is not valid JSON.' });
    const wrongApp = parseImport(JSON.stringify({ app: 'other', data: {} }));
    expect(wrongApp.ok).toBe(false);
    const bad = parseImport(JSON.stringify({ app: 'equanim', data: { ...sample(), attempts: 'x' } }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toMatch(/attempts/);
  });
});

describe('merge', () => {
  it('unions records, dedupes by id and keeps current settings', () => {
    const current = sample();
    current.settings.displayName = 'Current';
    const incoming = sample();
    incoming.settings.displayName = 'Incoming';
    incoming.journal.push({ ...incoming.journal[0]!, id: 'j2', situation: 'Another' });
    incoming.journal[0] = { ...incoming.journal[0]!, situation: 'Edited later', updatedAt: t2 };
    const m = mergeData(current, incoming);
    expect(m.settings.displayName).toBe('Current');
    expect(m.journal).toHaveLength(2);
    expect(m.journal.find((j) => j.id === 'j1')!.situation).toBe('Edited later');
    expect(m.attempts).toHaveLength(1);
    expect(m.library).toHaveLength(1);
  });
  it('keeps one intention per day, preferring the more recently updated', () => {
    const current = sample();
    const incoming = sample();
    incoming.intentions = [{ ...incoming.intentions[0]!, id: 'other', text: 'Newer', updatedAt: t2 }];
    const m = mergeData(current, incoming);
    expect(m.intentions).toHaveLength(1);
    expect(m.intentions[0]!.text).toBe('Newer');
  });
});
