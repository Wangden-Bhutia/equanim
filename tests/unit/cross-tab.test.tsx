/**
 * Cross-tab data safety (docs/cross-tab-fix-brief.md, tests 1–15). Deterministic: no timers, no randomness in
 * ordering. Interleavings are forced with the repository's beforeWrite seam, a wrapped storage adapter, a FIFO
 * lock stand-in (FakeLocks) and a queued notification bus (FakeBus). "1.0 tab" = the real 1.0 storage code.
 */
import { describe, expect, it } from 'vitest';
import { act } from '@testing-library/react';
import {
  Repository, MemoryAdapter, LocalStorageAdapter, browserLocks, DATA_KEY, STORE_KEY, PRE_MIGRATION_PREFIX, SET_ASIDE_PREFIX, UNSAVED_PREFIX,
  type StorageAdapter,
} from '../../src/storage/storage';
import { emptyData } from '../../src/storage/schema';
import { exportJson, parseImport } from '../../src/storage/transfer';
import type { AppData, JournalEntry } from '../../src/types';
import { FakeBus, FakeLocks, deliver, journalTexts, mountNewTab, openNewTab, openOldTab, settle, v1Seed } from './helpers/tabs';

const T = '2026-10-18T10:00:00.000Z';
const entry = (id: string, text: string, at = T): JournalEntry => ({ id, type: 'free', answers: { text }, domain: null, scenarioId: null, themes: [], createdAt: at, updatedAt: at });
const add = (e: JournalEntry) => (d: AppData) => (d.journal.some((j) => j.id === e.id) ? d : { ...d, journal: [...d.journal, e] });
const texts = (d: AppData) => d.journal.map((j) => j.answers.facts ?? j.answers.text ?? '').sort();
const draft = (text: string) => ({ type: 'free' as const, answers: { text }, domain: null, scenarioId: null, themes: [] });
const envelope = (a: StorageAdapter) => JSON.parse(a.get(STORE_KEY)!) as { revision: number; nonce: string; legacy: string | null; data: AppData };
const keysWith = (a: StorageAdapter, p: string) => a.keys().filter((k) => k.startsWith(p));

/** Equanim 1.0 writing into a MemoryAdapter, exactly as its Repository.save does (whole document, one key). */
function oldWrite(a: StorageAdapter, mutate: (d: ReturnType<typeof v1Seed>) => void, from?: ReturnType<typeof v1Seed>) {
  const d = from ?? (JSON.parse(a.get(DATA_KEY)!) as ReturnType<typeof v1Seed>);
  mutate(d);
  a.set(DATA_KEY, JSON.stringify(d));
  return d;
}
const oldEntry = (situation: string, at = T) => ({ id: `jrn_old_${situation}`, createdAt: at, updatedAt: at, domain: null, scenarioId: null, situation, story: '', response: '', nextTime: '', note: '' });

function seeded() {
  const a = new MemoryAdapter();
  a.set(DATA_KEY, JSON.stringify(v1Seed()));
  return a;
}

describe('cross-tab data safety', () => {
  it('1: a 1.0 tab saving after the upgrade is merged in, and never overwrites 1.1 data', async () => {
    const a = seeded();
    const oldCopy = JSON.parse(a.get(DATA_KEY)!) as ReturnType<typeof v1Seed>; // the 1.0 tab's in-memory copy
    const b = new Repository(a, { locks: new FakeLocks() });
    await b.open();
    await b.transact(add(entry('jrn_b1', 'B1')));
    const storeBefore = a.get(STORE_KEY);
    oldWrite(a, (d) => d.journal.push(oldEntry('A1')), oldCopy); // whole-store write of an older snapshot
    expect(a.get(STORE_KEY)).toBe(storeBefore); // it could only touch its own key
    const r = await b.transact(add(entry('jrn_b2', 'B2')));
    expect(r.ok && texts(r.data)).toEqual(['A1', 'B1', 'B2', 'seed']);
    expect(texts(new Repository(a).load().data)).toEqual(['A1', 'B1', 'B2', 'seed']);
  });

  it('2: a 1.0 save landing in the middle of the upgrade is not lost (check-and-set retries)', async () => {
    const base = seeded();
    let fired = false;
    // Fires after the upgrade has read storage and while it writes its safety copy, before the store write.
    const a: StorageAdapter = {
      get: (k) => base.get(k), remove: (k) => base.remove(k), keys: () => base.keys(),
      set: (k, v) => {
        base.set(k, v);
        if (!fired && k.startsWith(PRE_MIGRATION_PREFIX)) { fired = true; oldWrite(base, (d) => d.journal.push(oldEntry('A1'))); }
      },
    };
    const r = await new Repository(a, { locks: new FakeLocks() }).open();
    expect(fired).toBe(true);
    expect(texts(r.data)).toEqual(['A1', 'seed']);
    expect(texts(envelope(base).data)).toEqual(['A1', 'seed']);
    // The exact pre-upgrade original is kept.
    expect(keysWith(base, PRE_MIGRATION_PREFIX).map((k) => base.get(k))).toContain(JSON.stringify(v1Seed()));
  });

  it('2b: a 1.0 save landing between the check and the write is merged on the next read', async () => {
    const a = seeded();
    let fired = false;
    const b = new Repository(a, { locks: new FakeLocks(), beforeWrite: () => { if (!fired) { fired = true; oldWrite(a, (d) => d.journal.push(oldEntry('A1'))); } } });
    await b.open();
    expect(texts(envelope(a).data)).toEqual(['seed']); // the store was written from the earlier read...
    expect(texts(new Repository(a).load().data)).toEqual(['A1', 'seed']); // ...but A1 is still in 1.0's key and merged in
    const r = await b.transact((d) => d);
    expect(r.ok && texts(r.data)).toEqual(['A1', 'seed']);
  });

  it('3: two 1.1 tabs upgrading at once: one upgrade, one copy, identical result', async () => {
    const a = seeded();
    const locks = new FakeLocks();
    const [r1, r2] = await Promise.all([new Repository(a, { locks }).open(), new Repository(a, { locks }).open()]);
    expect(locks.requests).toBe(2);
    expect(envelope(a).revision).toBe(1); // the second tab found the upgrade done and wrote nothing
    expect(keysWith(a, PRE_MIGRATION_PREFIX)).toHaveLength(1);
    expect(r1.data).toEqual(r2.data);
  });

  it('4: two 1.1 tabs adding different records from stale views keep both', async () => {
    const bus = new FakeBus();
    const locks = new FakeLocks();
    const b = await openNewTab({ locks, channel: bus.channel() });
    const c = await openNewTab({ locks, channel: bus.channel() });
    b.store().createJournal(draft('B1'));
    c.store().createJournal(draft('C1')); // C has not seen B1
    await settle();
    bus.drop(); // no notifications at all
    const fresh = new Repository(new LocalStorageAdapter()).load();
    expect(texts(fresh.data)).toEqual(['B1', 'C1']);
  });

  it('5: the same record edited in two tabs: the newest edit is kept, the other is set aside, the user is told', async () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ format: 'equanim-store', schemaVersion: 3, revision: 1, nonce: 'n0', ancestors: [], legacy: null, data: { ...emptyData(), journal: [entry('j1', 'original')] } }));
    const bus = new FakeBus();
    const locks = new FakeLocks();
    const b = await openNewTab({ locks, channel: bus.channel() });
    const c = await openNewTab({ locks, channel: bus.channel() });
    b.store().updateJournal('j1', draft('edited in B'));
    await settle();
    bus.drop(); // C misses the notification and still shows "original"
    c.store().updateJournal('j1', draft('edited in C'));
    await settle();
    expect(journalTexts(c.store())).toEqual(['edited in C']);
    expect(c.store().setAsideNotice).toBe(1);
    const copies = keysWith(new LocalStorageAdapter(), SET_ASIDE_PREFIX);
    expect(copies).toHaveLength(1);
    expect(localStorage.getItem(copies[0]!)).toContain('edited in B');
    expect(c.store().safetyCopies().map((x) => x.kind)).toContain('set-aside');
  });

  it('6: a stale whole-store snapshot cannot replace newer data', async () => {
    const a = new MemoryAdapter();
    const b = new Repository(a, { locks: null });
    b.load();
    expect(b.save({ ...emptyData(), journal: [entry('j0', 'first')] })).toBe(true);
    const stale = b.load().data;
    const c = new Repository(a, { locks: null });
    await c.transact(add(entry('j1', 'newer, from C')));
    expect(b.save({ ...stale, journal: [...stale.journal, entry('j2', 'stale')] })).toBe(false); // refused
    expect(texts(new Repository(a).load().data)).toEqual(['first', 'newer, from C']);
    // The transact path never writes a snapshot: it applies the change to what is stored now.
    const r = await b.transact(add(entry('j2', 'from B')));
    expect(r.ok && texts(r.data)).toEqual(['first', 'from B', 'newer, from C']);
  });

  it('7: a missed notification, then the tab resumes: it re-reads before writing, and on returning', async () => {
    const bus = new FakeBus();
    const locks = new FakeLocks();
    const b = await openNewTab({ locks, channel: bus.channel() });
    const c = await openNewTab({ locks, channel: bus.channel() });
    c.store().createJournal(draft('C1'));
    await settle();
    bus.drop(); // B was suspended and never got the message
    expect(journalTexts(b.store())).toEqual([]);
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); }); // tab comes back
    await settle();
    expect(journalTexts(b.store())).toEqual(['C1']);
    b.store().createJournal(draft('B1'));
    await settle();
    expect(texts(new Repository(new LocalStorageAdapter()).load().data)).toEqual(['B1', 'C1']);
    // No loop: delivering every message now changes nothing and writes nothing.
    const rev = envelope(new LocalStorageAdapter()).revision;
    await bus.flush();
    await deliver(STORE_KEY);
    expect(envelope(new LocalStorageAdapter()).revision).toBe(rev);
  });

  it('8: without Web Locks, a write overwritten in the unlocked window is detected and restored', async () => {
    expect(browserLocks()).toBeNull(); // jsdom, like older browsers, has no navigator.locks
    const a = seeded();
    const c = new Repository(a, { locks: null });
    let fired = false;
    const b = new Repository(a, {
      locks: null,
      beforeWrite: () => {
        if (fired) return;
        fired = true;
        // Tab C completes the upgrade and adds an entry inside B's window between check and write.
        const d = c.load().data;
        expect(c.save({ ...d, journal: [...d.journal, entry('jrn_c1', 'C1')] })).toBe(true);
      },
    });
    expect(b.hasLocks).toBe(false);
    await b.open(); // B overwrites C's write: the one race localStorage alone cannot prevent
    expect(texts(envelope(a).data)).toEqual(['seed']);
    // C notices its write is no longer in the store's history and puts it back, record by record.
    const view = c.load();
    expect(view.needsWrite).toBe(true);
    expect(texts(view.data)).toEqual(['C1', 'seed']);
    await c.open();
    expect(texts(envelope(a).data)).toEqual(['C1', 'seed']);
  });

  it('9: if the safety copy cannot be written, the upgrade stops and nothing is replaced', async () => {
    const a = seeded();
    const raw = a.get(DATA_KEY);
    const realSet = a.set.bind(a);
    a.set = (k, v) => { if (k !== DATA_KEY) throw new Error('QuotaExceeded'); realSet(k, v); };
    const repo = new Repository(a, { locks: new FakeLocks() });
    const r = await repo.open();
    expect(r.issue?.kind).toBe('backup-failed');
    expect(texts(r.data)).toEqual(['seed']);
    const w = await repo.transact(add(entry('j1', 'new')), r.data);
    expect(w.ok).toBe(false);
    if (!w.ok) { expect(w.reason).toBe('locked'); expect(texts(w.attempted)).toEqual(['new', 'seed']); }
    expect(a.get(DATA_KEY)).toBe(raw);
    expect(a.get(STORE_KEY)).toBeNull();
  });

  it('10: an upgrade that fails part-way leaves the original intact and completes cleanly later', async () => {
    const a = seeded();
    const raw = a.get(DATA_KEY);
    const realSet = a.set.bind(a);
    let failStore = true;
    a.set = (k, v) => { if (k === STORE_KEY && failStore) throw new Error('QuotaExceeded'); realSet(k, v); };
    const first = await new Repository(a, { locks: new FakeLocks() }).open();
    expect(first.issue?.kind).toBe('backup-failed');
    expect(a.get(STORE_KEY)).toBeNull();
    expect(a.get(DATA_KEY)).toBe(raw);
    expect(keysWith(a, PRE_MIGRATION_PREFIX)).toHaveLength(1); // the copy was made first
    failStore = false;
    const second = await new Repository(a, { locks: new FakeLocks() }).open();
    expect(second.issue).toBeNull();
    expect(texts(second.data)).toEqual(['seed']);
    expect(keysWith(a, PRE_MIGRATION_PREFIX)).toHaveLength(1); // not duplicated
  });

  it('11: running the upgrade twice changes nothing the second time', async () => {
    const a = seeded();
    const r1 = await new Repository(a).open();
    const after1 = a.get(STORE_KEY);
    const r2 = await new Repository(a).open();
    expect(a.get(STORE_KEY)).toBe(after1);
    expect(r2.data).toEqual(r1.data);
    expect(keysWith(a, PRE_MIGRATION_PREFIX)).toHaveLength(1);
  });

  it('12: a record created in one tab while another tab is upgrading is kept', async () => {
    localStorage.setItem(DATA_KEY, JSON.stringify(v1Seed()));
    const locks = new FakeLocks();
    const bus = new FakeBus();
    mountNewTab({ locks, channel: bus.channel() }); // starts upgrading (queued on the lock)
    const tc = mountNewTab({ locks, channel: bus.channel() }); // opens during the upgrade
    tc.store().createJournal(draft('C1')); // before either upgrade has run
    await settle();
    expect(texts(new Repository(new LocalStorageAdapter()).load().data)).toEqual(['C1', 'seed']);
    expect(Object.keys(localStorage).filter((k) => k.startsWith(PRE_MIGRATION_PREFIX))).toHaveLength(1);
  });

  it('13: a journal edit is not lost when a 1.0 tab writes its older copy, even of the same entry', async () => {
    localStorage.setItem(DATA_KEY, JSON.stringify(v1Seed()));
    const old = openOldTab();
    const bus = new FakeBus();
    const b = await openNewTab({ locks: new FakeLocks(), channel: bus.channel() });
    b.store().updateJournal('jrn_seed', { ...b.store().data.journal[0]!, answers: { facts: 'seed, edited in 1.1' } });
    await settle();
    old.addJournal('A1'); // whole-store write that still contains the unedited seed entry
    await deliver(DATA_KEY);
    expect(journalTexts(b.store())).toEqual(['A1', 'seed, edited in 1.1']);
    old.editJournal('jrn_seed', 'seed, edited in 1.0'); // the same entry, edited earlier in 1.0 time
    await deliver(DATA_KEY);
    const kept = journalTexts(b.store());
    expect(kept).toEqual(['A1', 'seed, edited in 1.1']);
    const aside = Object.keys(localStorage).filter((k) => k.startsWith(SET_ASIDE_PREFIX)).map((k) => localStorage.getItem(k)).join();
    expect(aside).toContain('seed, edited in 1.0'); // the other version is recoverable
    expect(b.store().setAsideNotice).toBe(1);
  });

  it('14: a refused write (another tab runs a newer version) keeps the content on screen and as a copy', async () => {
    const bus = new FakeBus();
    const b = await openNewTab({ locks: new FakeLocks(), channel: bus.channel() });
    const newer = JSON.stringify({ format: 'equanim-store', schemaVersion: 99, revision: 9, nonce: 'future', ancestors: [], legacy: null, data: { schemaVersion: 99 } });
    localStorage.setItem(STORE_KEY, newer); // a newer Equanim in another tab; this tab missed the message
    b.store().createJournal(draft('typed before the other tab updated'));
    await settle();
    expect(localStorage.getItem(STORE_KEY)).toBe(newer); // nothing overwritten
    expect(b.store().writeIssue?.reason).toBe('newer');
    expect(journalTexts(b.store())).toEqual(['typed before the other tab updated']); // still on screen
    const copies = Object.keys(localStorage).filter((k) => k.startsWith(UNSAVED_PREFIX));
    expect(copies).toHaveLength(1);
    expect(localStorage.getItem(copies[0]!)).toContain('typed before the other tab updated');
  });

  it('15: export, import (merge and replace) and restore still work, and an import does not drop another tab\'s record', async () => {
    const a = seeded();
    const b = new Repository(a, { locks: new FakeLocks() });
    const opened = await b.open();
    const file = exportJson(opened.data);
    const parsed = parseImport(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    // Another tab adds a record B has not seen; B then imports with merge.
    await new Repository(a).transact(add(entry('j_other', 'other tab')));
    const merged = await b.transact((d) => { b.saveBackup(d); return { ...d, journal: [...d.journal, ...parsed.data.journal.filter((j) => !d.journal.some((x) => x.id === j.id))] }; });
    expect(merged.ok && texts(merged.data)).toEqual(['other tab', 'seed']);
    // Replace, then restore the restore point.
    await b.transact((d) => { b.saveBackup(d); return { ...emptyData(), journal: [entry('j_r', 'replaced')] }; });
    expect(texts(new Repository(a).load().data)).toEqual(['replaced']);
    const backup = b.readBackup();
    expect(backup && texts(backup.data)).toEqual(['other tab', 'seed']);
    await b.transact(() => backup!.data);
    expect(texts(new Repository(a).load().data)).toEqual(['other tab', 'seed']);
  });

  it('a 1.0 write delivered to two 1.1 tabs is merged and stored exactly once (no loop)', async () => {
    localStorage.setItem(DATA_KEY, JSON.stringify(v1Seed()));
    const old = openOldTab();
    const bus = new FakeBus();
    const locks = new FakeLocks();
    const b = await openNewTab({ locks, channel: bus.channel() });
    const c = await openNewTab({ locks, channel: bus.channel() });
    await bus.flush();
    const rev = envelope(new LocalStorageAdapter()).revision;
    old.addJournal('A1');
    await deliver(DATA_KEY);
    await bus.flush();
    await deliver(DATA_KEY);
    expect(envelope(new LocalStorageAdapter()).revision).toBe(rev + 1);
    expect(journalTexts(b.store())).toEqual(['A1', 'seed']);
    expect(journalTexts(c.store())).toEqual(['A1', 'seed']);
  });
});
