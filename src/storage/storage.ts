import { emptyData, migrate, salvage, validateAppData, MigrationError, SCHEMA_VERSION } from './schema';
import { merge3, type SetAside } from './reconcile';
import type { AppData } from '../types';

/** Minimal key-value persistence interface so the backing store can be swapped (e.g. for Capacitor Preferences or IndexedDB). */
export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  keys(): string[];
}

export class LocalStorageAdapter implements StorageAdapter {
  get(key: string) { return window.localStorage.getItem(key); }
  set(key: string, value: string) { window.localStorage.setItem(key, value); }
  remove(key: string) { window.localStorage.removeItem(key); }
  keys() { return Object.keys(window.localStorage); }
}

export class MemoryAdapter implements StorageAdapter {
  private m = new Map<string, string>();
  get(key: string) { return this.m.has(key) ? (this.m.get(key) as string) : null; }
  set(key: string, value: string) { this.m.set(key, value); }
  remove(key: string) { this.m.delete(key); }
  keys() { return [...this.m.keys()]; }
}

/**
 * Equanim 1.0's key. 1.1 READS it but never writes it, so a 1.0 tab that is still open (code that can no longer be
 * changed) can only ever overwrite its own copy. Changes it makes there are merged record by record into the 1.1 store.
 */
export const DATA_KEY = 'equanim:data';
export const LEGACY_KEY = DATA_KEY;
/** The 1.1 store: a versioned envelope with a revision, written only through Repository.transact(). */
export const STORE_KEY = 'equanim:store';
export const BACKUP_KEY = 'equanim:store:pre-import-backup';
/** 1.0's restore point; still read if 1.1 has none of its own. */
export const LEGACY_BACKUP_KEY = 'equanim:pre-import-backup';
export const CORRUPT_PREFIX = 'equanim:unreadable:';
/** Raw copy of the stored document taken before any schema migration rewrites it. Never overwritten. */
export const PRE_MIGRATION_PREFIX = 'equanim:pre-migration:';
/** Raw copy taken before malformed records were set aside during recovery. */
export const RECOVERY_PREFIX = 'equanim:recovered-original:';
/** Versions of records that lost a conflict between two tabs (both edited the same record). */
export const SET_ASIDE_PREFIX = 'equanim:set-aside:';
/** A change that could not be saved (for example, another tab runs a newer version). */
export const UNSAVED_PREFIX = 'equanim:unsaved:';
export const SAFETY_PREFIXES = [CORRUPT_PREFIX, PRE_MIGRATION_PREFIX, RECOVERY_PREFIX, SET_ASIDE_PREFIX, UNSAVED_PREFIX];
export const LOCK_NAME = 'equanim:store';

export type LoadIssue =
  | { kind: 'unreadable'; backupKey: string; detail: string }
  | { kind: 'newer'; backupKey: string | null; detail: string }
  | { kind: 'partial'; backupKey: string; detail: string; dropped: number }
  /** A safety copy could not be written (storage full or blocked), so saving is paused to protect the original. */
  | { kind: 'backup-failed'; backupKey: null; detail: string };

export interface LoadResult { data: AppData; issue: LoadIssue | null }

export type RefusedReason = 'locked' | 'newer' | 'backup-failed' | 'write-failed' | 'busy';
export type TransactResult =
  | { ok: true; data: AppData; setAside: number; setAsideKey: string | null }
  | { ok: false; reason: RefusedReason; attempted: AppData; unsavedKey: string | null };

export interface TransactContext {
  setAside: (item: SetAside) => void;
  /** False while the change is only being previewed on screen; true when it is applied to the latest stored data. */
  live: boolean;
}

/** Subset of the Web Locks API used here. */
export interface Locks { request<T>(name: string, cb: () => T | Promise<T>): Promise<T> }

export function browserLocks(): Locks | null {
  const l = (globalThis as { navigator?: { locks?: { request?: unknown } } }).navigator?.locks;
  if (!l || typeof l.request !== 'function') return null;
  const lm = l as unknown as { request: (n: string, o: { mode: 'exclusive' }, cb: () => Promise<unknown>) => Promise<unknown> };
  return { request: <T,>(name: string, cb: () => T | Promise<T>) => lm.request(name, { mode: 'exclusive' }, async () => cb()) as Promise<T> };
}

export interface RepositoryOptions {
  /** Web Locks (default: navigator.locks when available). null = no cross-tab lock; check-and-set is used alone. */
  locks?: Locks | null;
  /** Called after every successful write, so other tabs can be told (BroadcastChannel). */
  onCommit?: (revision: number) => void;
  /** Test seam: runs just before the store is written, inside the lock. Used to interleave another writer deterministically. */
  beforeWrite?: () => void;
}

interface Envelope {
  format: 'equanim-store';
  schemaVersion: number;
  revision: number;
  nonce: string;
  /** Nonces of earlier revisions (newest first), used to notice a write of ours that another tab overwrote. */
  ancestors: string[];
  /** The exact 1.0 document last merged in, used as the common base for the next merge. */
  legacy: string | null;
  data: unknown;
}

interface State {
  data: AppData;
  issue: LoadIssue | null;
  blocked: boolean;
  storeRaw: string | null;
  legacyRaw: string | null;
  env: Envelope | null;
  copies: { key: string; raw: string }[];
  setAside: SetAside[];
  dirty: boolean;
}

const nonce = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

export class Repository {
  /** When true, writes are refused, so an original that could not be backed up is never overwritten. */
  locked = false;
  private locks: Locks | null;
  private chain: Promise<unknown> = Promise.resolve();
  /** What this tab last wrote, and what it was based on, to detect and repair an overwritten write. */
  private last: { nonce: string; data: AppData; base: AppData } | null = null;
  /** Raw store value as this tab last saw it; save() refuses to write over anything newer. */
  private seen: string | null = null;
  private lastRead: AppData | null = null;
  private stampSeq = 0;

  constructor(private adapter: StorageAdapter, private opts: RepositoryOptions = {}) {
    this.locks = opts.locks === undefined ? browserLocks() : opts.locks;
  }

  get hasLocks() { return this.locks !== null; }

  private stamp() { return Date.now() * 100 + (this.stampSeq++ % 100); }

  /** Writes a safety copy. Returns false if it could not be written; the caller must then not overwrite the original. */
  private keep(key: string, raw: string): boolean {
    try {
      this.adapter.set(key, raw);
      return this.adapter.get(key) === raw;
    } catch {
      return false;
    }
  }

  /** The key of an existing safety copy with exactly this content, so reloading never multiplies copies. */
  private existingCopy(prefix: string, raw: string): string | null {
    for (const k of this.adapter.keys()) if (k.startsWith(prefix) && this.adapter.get(k) === raw) return k;
    return null;
  }

  private copyKey(prefix: string, raw: string, copies: State['copies']): string {
    const existing = this.existingCopy(prefix, raw) ?? copies.find((c) => c.key.startsWith(prefix) && c.raw === raw)?.key;
    if (existing) return existing;
    const key = `${prefix}${this.stamp()}`;
    copies.push({ key, raw });
    return key;
  }

  /** Reads a stored document of any version: migrates it, and recovers valid records from a partly damaged one. */
  private readDocument(raw: string, copies: State['copies'], preMigrationCopy = true): { data: AppData | null; issue: LoadIssue | null } {
    let parsed: unknown;
    let migrated: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
      migrated = migrate(parsed);
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Unknown error';
      const kind = e instanceof MigrationError && detail.includes('newer') ? 'newer' : 'unreadable';
      return { data: null, issue: { kind, backupKey: this.copyKey(CORRUPT_PREFIX, raw, copies), detail } };
    }
    const fromVersion = (parsed as { schemaVersion?: unknown }).schemaVersion;
    if (preMigrationCopy && fromVersion !== migrated.schemaVersion) {
      this.copyKey(`${PRE_MIGRATION_PREFIX}v${typeof fromVersion === 'number' ? fromVersion : 0}:`, raw, copies);
    }
    const v = validateAppData(migrated);
    if (v.ok) return { data: v.data, issue: null };
    const s = salvage(migrated);
    const detail = v.errors.slice(0, 3).join(' ');
    if (!s) return { data: null, issue: { kind: 'unreadable', backupKey: this.copyKey(CORRUPT_PREFIX, raw, copies), detail } };
    return { data: s.data, issue: { kind: 'partial', backupKey: this.copyKey(RECOVERY_PREFIX, raw, copies), detail, dropped: s.dropped } };
  }

  /** Reads a 1.0 document quietly (for use as a merge base): no copies, no issues. */
  private quiet(raw: string | null): AppData | null {
    if (raw === null) return null;
    try {
      const m = migrate(JSON.parse(raw));
      const v = validateAppData(m);
      return v.ok ? v.data : salvage(m)?.data ?? null;
    } catch {
      return null;
    }
  }

  private parseEnvelope(raw: string): Envelope | 'newer' | null {
    try {
      const e = JSON.parse(raw) as Partial<Envelope>;
      if (e.format !== 'equanim-store' || typeof e.revision !== 'number' || typeof e.schemaVersion !== 'number' || typeof e.nonce !== 'string') return null;
      if (e.schemaVersion > SCHEMA_VERSION) return 'newer';
      return { ...e, ancestors: Array.isArray(e.ancestors) ? e.ancestors.filter((x) => typeof x === 'string') : [], legacy: typeof e.legacy === 'string' ? e.legacy : null } as Envelope;
    } catch {
      return null;
    }
  }

  /** Reads everything that is stored, without writing. Pure apart from reading. */
  private readState(): State {
    const copies: State['copies'] = [];
    const setAside: SetAside[] = [];
    let storeRaw: string | null;
    let legacyRaw: string | null;
    try {
      storeRaw = this.adapter.get(STORE_KEY);
      legacyRaw = this.adapter.get(LEGACY_KEY);
    } catch {
      return { data: emptyData(), issue: null, blocked: false, storeRaw: null, legacyRaw: null, env: null, copies, setAside, dirty: false };
    }
    let issue: LoadIssue | null = null;
    let data: AppData | null = null;
    let env: Envelope | null = null;
    let dirty = false;

    if (storeRaw !== null) {
      const e = this.parseEnvelope(storeRaw);
      if (e === 'newer') {
        // Another tab runs a newer Equanim. This tab must not write anything until it is reloaded.
        return {
          data: emptyData(), blocked: true, storeRaw, legacyRaw, env: null, copies, setAside, dirty: false,
          issue: { kind: 'newer', backupKey: null, detail: 'Equanim was updated in another tab or window.' },
        };
      }
      if (e) {
        env = e;
        const r = this.readDocument(JSON.stringify(e.data), []);
        if (r.data && !r.issue) data = r.data;
        else if (r.data && r.issue?.kind === 'partial') {
          data = r.data;
          issue = { ...r.issue, backupKey: this.copyKey(RECOVERY_PREFIX, storeRaw, copies) };
          dirty = true;
        } else {
          issue = { kind: 'unreadable', backupKey: this.copyKey(CORRUPT_PREFIX, storeRaw, copies), detail: r.issue?.detail ?? 'Unreadable.' };
          env = null;
        }
      } else {
        issue = { kind: 'unreadable', backupKey: this.copyKey(CORRUPT_PREFIX, storeRaw, copies), detail: 'The saved data could not be read.' };
      }
    }

    if (data && env) {
      // A 1.0 tab wrote since this store last merged its document: merge its changes record by record.
      if (legacyRaw !== null && legacyRaw !== env.legacy) {
        // No new pre-upgrade copy here: 1.1 never writes the 1.0 key, so this exact document stays where 1.0 put it.
        const now = this.readDocument(legacyRaw, copies, false);
        if (now.data) {
          const base = this.quiet(env.legacy) ?? { ...emptyData(), createdAt: now.data.createdAt };
          const m = merge3(base, data, now.data);
          data = m.data;
          setAside.push(...m.setAside);
        }
        if (now.issue && now.issue.kind !== 'partial' && !issue) issue = now.issue;
        dirty = true;
      }
    } else if (!data) {
      // No usable store yet: this is the upgrade from 1.0 (or a first run, or a recovery from an unreadable store).
      if (legacyRaw !== null) {
        const r = this.readDocument(legacyRaw, copies);
        data = r.data;
        if (r.issue && !(issue && r.issue.kind === 'unreadable')) issue = issue ?? r.issue;
        dirty = true;
      }
      if (!data) data = emptyData();
      if (storeRaw !== null) dirty = true;
    }

    // Detect a write of ours that another tab overwrote (possible only without Web Locks) and put it back.
    if (env && this.last && env.nonce !== this.last.nonce && !env.ancestors.includes(this.last.nonce)) {
      const m = merge3(this.last.base, this.last.data, data);
      data = m.data;
      setAside.push(...m.setAside);
      dirty = true;
    }
    return { data, issue, blocked: false, storeRaw, legacyRaw, env, copies, setAside, dirty };
  }

  /** Runs fn exclusively: across tabs with Web Locks when available, and always in order within this tab. */
  private exclusive<T>(fn: () => T): Promise<T> {
    const run = () => (this.locks ? this.locks.request(LOCK_NAME, fn) : Promise.resolve().then(fn));
    const p = this.chain.then(run, run);
    this.chain = p.catch(() => undefined);
    return p;
  }

  /**
   * One write attempt: keeps every safety copy first, then writes the store only if neither the store nor the
   * 1.0 key changed since they were read (check-and-set). Returns 'retry' if something changed.
   */
  private commit(st: State, next: AppData, setAside: SetAside[]): TransactResult | 'retry' {
    for (const c of st.copies) {
      if (!this.keep(c.key, c.raw)) { this.locked = true; return this.refuse('backup-failed', next); }
    }
    let setAsideKey: string | null = null;
    if (setAside.length) {
      setAsideKey = `${SET_ASIDE_PREFIX}${this.stamp()}`;
      if (!this.keep(setAsideKey, JSON.stringify({ savedAt: new Date().toISOString(), items: setAside }))) return this.refuse('backup-failed', next);
    }
    if (this.adapter.get(STORE_KEY) !== st.storeRaw || this.adapter.get(LEGACY_KEY) !== st.legacyRaw) {
      if (setAsideKey) this.adapter.remove(setAsideKey); // recomputed on the retry
      return 'retry';
    }
    this.opts.beforeWrite?.();
    const env: Envelope = {
      format: 'equanim-store',
      schemaVersion: SCHEMA_VERSION,
      revision: (st.env?.revision ?? 0) + 1,
      nonce: nonce(),
      ancestors: st.env ? [st.env.nonce, ...st.env.ancestors].slice(0, 100) : [],
      legacy: st.legacyRaw,
      data: next,
    };
    const raw = JSON.stringify(env);
    try {
      this.adapter.set(STORE_KEY, raw);
    } catch {
      return this.refuse('write-failed', next);
    }
    this.seen = raw;
    this.last = { nonce: env.nonce, data: next, base: st.data };
    this.opts.onCommit?.(env.revision);
    return { ok: true, data: next, setAside: setAside.length, setAsideKey };
  }

  /** A write that cannot be made is never silently dropped: the attempted data is kept as a copy (if storage allows) and returned. */
  private refuse(reason: RefusedReason, attempted: AppData): TransactResult {
    const key = `${UNSAVED_PREFIX}${this.stamp()}`;
    const kept = this.keep(key, JSON.stringify({ savedAt: new Date().toISOString(), reason, data: attempted }));
    return { ok: false, reason, attempted, unsavedKey: kept ? key : null };
  }

  /**
   * The only way the app changes stored data. `fn` is applied to the LATEST stored data (re-read inside the lock,
   * including changes from other tabs and from 1.0 tabs), never to this tab's possibly older copy.
   * `fallback` is this tab's copy, used only to keep the attempted change if the write must be refused.
   */
  transact(fn: (d: AppData, ctx: TransactContext) => AppData, fallback?: AppData): Promise<TransactResult> {
    return this.exclusive(() => {
      if (this.locked) return this.refuse('locked', fn(fallback ?? this.readState().data, { setAside: () => {}, live: false }));
      for (let attempt = 0; attempt < 5; attempt++) {
        const st = this.readState();
        const extra: SetAside[] = [];
        const next = fn(st.data, { setAside: (x) => extra.push(x), live: !st.blocked });
        if (st.blocked) return this.refuse('newer', next);
        const r = this.commit(st, next, [...st.setAside, ...extra]);
        if (r !== 'retry') return r;
      }
      return this.refuse('busy', fn(fallback ?? this.readState().data, { setAside: () => {}, live: false }));
    });
  }

  /** Read-only: what is stored now, merged with any 1.0 changes, without writing. Safe to call any time. */
  load(): LoadResult & { needsWrite: boolean; blocked: boolean } {
    const st = this.readState();
    this.seen = st.storeRaw;
    this.lastRead = st.data;
    return { data: st.data, issue: st.issue, needsWrite: st.dirty || st.copies.length > 0 || st.setAside.length > 0, blocked: st.blocked };
  }

  /**
   * Opens the store: performs the 1.0 upgrade (keeping the exact original first), recovery or 1.0 merge if needed,
   * under the lock and only once. If a safety copy cannot be written, nothing is overwritten and saving is paused.
   */
  open(): Promise<LoadResult & { setAside: number }> {
    return this.exclusive(() => {
      for (let attempt = 0; attempt < 5; attempt++) {
        const st = this.readState();
        this.seen = st.storeRaw;
        if (st.blocked || !(st.dirty || st.copies.length || st.setAside.length)) return { data: st.data, issue: st.issue, setAside: 0 };
        const r = this.commit(st, st.data, st.setAside);
        if (r === 'retry') continue;
        if (r.ok) return { data: r.data, issue: st.issue, setAside: r.setAside };
        const detail = r.reason === 'backup-failed' ? 'Could not keep a safety copy before changing stored data.' : 'Could not save.';
        return { data: st.data, issue: { kind: 'backup-failed', backupKey: null, detail }, setAside: 0 };
      }
      const st = this.readState();
      return { data: st.data, issue: st.issue, setAside: 0 };
    });
  }

  /** Safety copies kept on this device. */
  safetyCopies(): { key: string; kind: 'unreadable' | 'pre-migration' | 'recovered' | 'set-aside' | 'unsaved'; at: number; size: number }[] {
    const kinds: [string, 'unreadable' | 'pre-migration' | 'recovered' | 'set-aside' | 'unsaved'][] = [
      [CORRUPT_PREFIX, 'unreadable'], [PRE_MIGRATION_PREFIX, 'pre-migration'], [RECOVERY_PREFIX, 'recovered'], [SET_ASIDE_PREFIX, 'set-aside'], [UNSAVED_PREFIX, 'unsaved'],
    ];
    const out: ReturnType<Repository['safetyCopies']> = [];
    for (const key of this.adapter.keys()) {
      const kind = kinds.find(([p]) => key.startsWith(p))?.[1];
      if (!kind) continue;
      const n = Number(key.split(':').pop());
      const at = Number.isFinite(n) ? (n > 1e14 ? Math.floor(n / 100) : n) : 0;
      out.push({ key, kind, at, size: (this.adapter.get(key) ?? '').length });
    }
    return out.sort((a, b) => b.at - a.at);
  }

  readRaw(key: string): string | null {
    return SAFETY_PREFIXES.some((p) => key.startsWith(p)) ? this.adapter.get(key) : null;
  }

  /**
   * Whole-store write for tools and tests. Refuses (returns false) if the store changed since this repository last
   * read or wrote it, so a stale snapshot can never replace newer data. The app itself uses transact().
   */
  save(data: AppData): boolean {
    if (this.locked) return false;
    try {
      const cur = this.adapter.get(STORE_KEY);
      if (cur !== this.seen) return false;
      const prev = cur === null ? null : this.parseEnvelope(cur);
      if (prev === 'newer') return false;
      const env: Envelope = {
        format: 'equanim-store', schemaVersion: SCHEMA_VERSION, revision: (prev?.revision ?? 0) + 1, nonce: nonce(),
        ancestors: prev ? [prev.nonce, ...prev.ancestors].slice(0, 100) : [], legacy: prev ? prev.legacy : this.adapter.get(LEGACY_KEY), data,
      };
      const raw = JSON.stringify(env);
      this.adapter.set(STORE_KEY, raw);
      this.seen = raw;
      this.last = { nonce: env.nonce, data, base: this.lastRead ?? data };
      return true;
    } catch {
      return false;
    }
  }

  saveBackup(data: AppData): boolean {
    try {
      this.adapter.set(BACKUP_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data }));
      return true;
    } catch {
      return false;
    }
  }

  readBackup(): { savedAt: string; data: AppData } | null {
    for (const key of [BACKUP_KEY, LEGACY_BACKUP_KEY]) {
      const raw = this.adapter.get(key);
      if (!raw) continue;
      try {
        const p = JSON.parse(raw) as { savedAt?: unknown; data?: unknown };
        const v = validateAppData(migrate(p.data));
        if (v.ok && typeof p.savedAt === 'string') return { savedAt: p.savedAt, data: v.data };
      } catch {
        /* try the next one */
      }
    }
    return null;
  }

  /** Removes every Equanim key from this device (the user's "Erase all data"). */
  clearAll(): void {
    for (const k of this.adapter.keys()) if (k.startsWith('equanim:')) this.adapter.remove(k);
    this.locked = false;
    this.last = null;
    this.seen = null;
    this.lastRead = null;
  }
}
