/**
 * Schema 4 → 5 (Round 2: calendar pacing, think responses, catch-up reviews, values on plans, inline notice).
 * Additive and lossless, with an exact copy of the v4 store kept first. Nothing is gated retroactively.
 */
import { describe, expect, it } from 'vitest';
import { Repository, MemoryAdapter, STORE_KEY, PRE_MIGRATION_PREFIX } from '../../src/storage/storage';
import { SCHEMA_VERSION, emptyData, migrate, salvage, validateAppData } from '../../src/storage/schema';
import { parseImport } from '../../src/storage/transfer';

const T = (d: number, h = 9) => new Date(Date.UTC(2026, 9, d, h)).toISOString();

function v4Doc() {
  const d = emptyData() as unknown as Record<string, unknown>;
  return {
    ...d,
    schemaVersion: 4,
    onboardingCompletedAt: T(1),
    programme: { startedAt: T(1), disclaimerSeenAt: T(2, 10), maintenanceStartedAt: null },
    // Two sessions on the same day under v4 (no gating then): both must stay earlyStart: false.
    sessions: [
      { id: 'ses_w0d0', sessionId: 'w0d0', completedAt: T(1), updatedAt: T(1), mode: 'write', answers: {}, choices: {} },
      { id: 'ses_w1d1', sessionId: 'w1d1', completedAt: T(1, 10), updatedAt: T(1, 10), mode: 'think', answers: { a: 'x' }, choices: {} },
    ],
    values: [{ id: 'calm', sentence: 'Pause first', updatedAt: T(1) }],
    reviews: [{ id: 'rev_w1', week: 1, worked: 'w', gotInWay: 'g', noticed: 'n', rating: 3, completedAt: T(7), updatedAt: T(7) }],
    plans: [{ id: 'pln_1', date: '2026-10-02', domain: 'personalisation', when: 'a', then: 'b', outcome: 'tried', note: 'ok', createdAt: T(2), updatedAt: T(2, 20) }],
  };
}

describe('schema 4 → 5', () => {
  it('is lossless, adds safe defaults, and keeps an exact copy of the v4 store', async () => {
    const doc = v4Doc();
    const a = new MemoryAdapter();
    const raw = JSON.stringify({ format: 'equanim-store', schemaVersion: 4, revision: 9, nonce: 'n', ancestors: [], legacy: null, data: doc });
    a.set(STORE_KEY, raw);
    const r = await new Repository(a, { locks: null }).open();
    expect(r.issue).toBeNull();
    expect(SCHEMA_VERSION).toBe(5);
    expect(r.data).toEqual({
      ...doc, schemaVersion: 5,
      programme: { ...doc.programme, noticeDismissedAt: T(2, 10) },
      sessions: doc.sessions.map((x) => ({ ...x, earlyStart: false, thinkResponses: {} })),
      reviews: doc.reviews.map((x) => ({ ...x, catchUp: false })),
      plans: doc.plans.map((x) => ({ ...x, valueId: null })),
    });
    const copies = a.keys().filter((k) => k.startsWith(`${PRE_MIGRATION_PREFIX}store-v4:`));
    expect(copies).toHaveLength(1);
    expect(a.get(copies[0]!)).toBe(raw);
  });
  it('is deterministic and leaves an unenrolled user unenrolled', () => {
    const doc = { ...v4Doc(), programme: null };
    expect(migrate(doc)).toEqual(migrate(JSON.parse(JSON.stringify(doc))));
    expect(migrate(doc).programme).toBeNull();
  });
  it('a user who never saw the old notice still sees the new one', () => {
    const out = migrate({ ...v4Doc(), programme: { startedAt: T(1), disclaimerSeenAt: null, maintenanceStartedAt: null } });
    expect((out.programme as Record<string, unknown>).noticeDismissedAt).toBeNull();
  });
  it('does not overwrite fields that are already present', () => {
    const out = migrate({ ...v4Doc(), plans: [{ ...v4Doc().plans[0], valueId: 'calm' }] });
    expect((out.plans as { valueId: string }[])[0]!.valueId).toBe('calm');
  });
  it('imports a schema 4 export losslessly', () => {
    const r = parseImport(JSON.stringify({ app: 'equanim', exportedAt: T(8), data: v4Doc() }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.sessions.every((s) => s.earlyStart === false)).toBe(true);
  });
  it('rejects invalid v5 fields on import, and salvage sets them aside without losing the rest', () => {
    const good = migrate(v4Doc());
    const bad = { ...good, sessions: [...(good.sessions as object[]), { id: 'ses_x', sessionId: 'w1d2', completedAt: T(3), updatedAt: T(3), mode: 'think', answers: {}, choices: {}, earlyStart: 'yes', thinkResponses: {} }] };
    expect(validateAppData(bad).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: 'equanim', exportedAt: T(8), data: bad })).ok).toBe(false);
    const s = salvage(bad);
    expect(s?.dropped).toBe(1);
    expect(s?.data.sessions).toHaveLength(2);
    const badThink = { ...good, sessions: [{ ...(good.sessions as Record<string, unknown>[])[0], thinkResponses: { p: 'maybe' } }] };
    expect(validateAppData(badThink).ok).toBe(false);
  });
});
