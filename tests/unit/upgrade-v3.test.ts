/**
 * Schema 3 (programme part 1) → 4 (part 2: maintenance mode, monthly check-ins). Additive and lossless,
 * with an exact copy of the v3 store kept first. A v3 document is written by hand in the exact v3 shape.
 */
import { describe, expect, it } from 'vitest';
import { Repository, MemoryAdapter, STORE_KEY, PRE_MIGRATION_PREFIX } from '../../src/storage/storage';
import { SCHEMA_VERSION, emptyData, migrate } from '../../src/storage/schema';
import { parseImport } from '../../src/storage/transfer';

const T = (d: number, h = 9) => new Date(Date.UTC(2026, 9, d, h)).toISOString();

function v3Doc() {
  const d = emptyData() as unknown as Record<string, unknown>;
  const p = { startedAt: T(1), disclaimerSeenAt: T(1, 10) };
  return {
    ...d,
    schemaVersion: 3,
    onboardingCompletedAt: T(1),
    programme: p,
    sessions: [{ id: 'ses_w0d0', sessionId: 'w0d0', completedAt: T(1), updatedAt: T(1), mode: 'write', answers: {}, choices: {} },
      { id: 'ses_w1d1', sessionId: 'w1d1', completedAt: T(2), updatedAt: T(2), mode: 'think', answers: { a: 'x' }, choices: { r: 'b' } }],
    values: [{ id: 'calm', sentence: 'Pause first', updatedAt: T(1) }],
    baselines: [{ id: 'bl_start', kind: 'start', ratings: { 'b-p1': 2 }, situations: ['A', ''], completedAt: T(1), updatedAt: T(1) }],
    reviews: [{ id: 'rev_w1', week: 1, worked: 'w', gotInWay: 'g', noticed: 'n', rating: 3, completedAt: T(7), updatedAt: T(7) }],
    plans: [{ id: 'pln_1', date: '2026-10-02', domain: 'personalisation', when: 'a', then: 'b', outcome: 'tried', note: 'ok', createdAt: T(2), updatedAt: T(2, 20) }],
    recall: [{ id: 'rq-p-1', firstSeen: '2026-10-05', reviewed: ['2026-10-07'], lastCorrect: true, updatedAt: T(7) }],
  };
}

describe('schema 3 → 4', () => {
  it('is lossless: everything is carried over and only maintenanceStartedAt (null) is added', async () => {
    const doc = v3Doc();
    const a = new MemoryAdapter();
    const raw = JSON.stringify({ format: 'equanim-store', schemaVersion: 3, revision: 4, nonce: 'n', ancestors: [], legacy: null, data: doc });
    a.set(STORE_KEY, raw);
    const r = await new Repository(a, { locks: null }).open();
    expect(r.issue).toBeNull();
    expect(r.data.schemaVersion).toBe(SCHEMA_VERSION);
    expect(r.data).toEqual({ ...doc, schemaVersion: SCHEMA_VERSION, programme: { ...doc.programme, maintenanceStartedAt: null } });
    const copies = a.keys().filter((k) => k.startsWith(`${PRE_MIGRATION_PREFIX}store-v3:`));
    expect(copies).toHaveLength(1);
    expect(a.get(copies[0]!)).toBe(raw);
  });
  it('leaves an unenrolled user unenrolled', () => {
    const out = migrate({ ...v3Doc(), programme: null });
    expect(out.programme).toBeNull();
  });
  it('imports a schema 3 export losslessly, and accepts monthly check-in baselines', () => {
    const doc = v3Doc();
    const r = parseImport(JSON.stringify({ app: 'equanim', exportedAt: T(8), data: doc }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.sessions).toEqual(doc.sessions);
    expect(r.data.programme?.maintenanceStartedAt).toBeNull();
    const withCheckin = { ...r.data, baselines: [...r.data.baselines, { id: 'bl_checkin_2026-12', kind: 'checkin', ratings: { 'b-p1': 4 }, situations: [], completedAt: T(9), updatedAt: T(9) }] };
    const again = parseImport(JSON.stringify({ app: 'equanim', exportedAt: T(9), data: withCheckin }));
    expect(again.ok).toBe(true);
  });
});
