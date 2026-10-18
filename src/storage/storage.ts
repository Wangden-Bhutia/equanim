import { emptyData, migrate, salvage, validateAppData, MigrationError } from './schema';
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

export const DATA_KEY = 'equanim:data';
export const BACKUP_KEY = 'equanim:pre-import-backup';
export const CORRUPT_PREFIX = 'equanim:unreadable:';
/** Raw copy of the stored document taken before any schema migration rewrites it. Never overwritten. */
export const PRE_MIGRATION_PREFIX = 'equanim:pre-migration:';
/** Raw copy taken before malformed records were set aside during recovery. */
export const RECOVERY_PREFIX = 'equanim:recovered-original:';
export const SAFETY_PREFIXES = [CORRUPT_PREFIX, PRE_MIGRATION_PREFIX, RECOVERY_PREFIX];

export type LoadIssue =
  | { kind: 'unreadable'; backupKey: string; detail: string }
  | { kind: 'newer'; backupKey: string; detail: string }
  | { kind: 'partial'; backupKey: string; detail: string; dropped: number }
  /** A safety copy could not be written (storage full or blocked), so saving is paused to protect the original. */
  | { kind: 'backup-failed'; backupKey: null; detail: string };

export interface LoadResult { data: AppData; issue: LoadIssue | null }

export class Repository {
  /** When true, save() refuses to write, so an original that could not be backed up is never overwritten. */
  locked = false;

  constructor(private adapter: StorageAdapter) {}

  /** Writes a safety copy. Returns false if it could not be written; the caller must then not overwrite the original. */
  private keep(key: string, raw: string): boolean {
    try {
      this.adapter.set(key, raw);
      return this.adapter.get(key) === raw;
    } catch {
      return false;
    }
  }

  load(): LoadResult {
    let raw: string | null;
    try {
      raw = this.adapter.get(DATA_KEY);
    } catch {
      return { data: emptyData(), issue: null };
    }
    if (raw === null) return { data: emptyData(), issue: null };
    const stamp = Date.now();

    let parsed: unknown;
    let migrated: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
      migrated = migrate(parsed);
    } catch (e) {
      // Never silently discard: keep the unreadable copy under a separate key, then start fresh.
      const detail = e instanceof Error ? e.message : 'Unknown error';
      const kind = e instanceof MigrationError && detail.includes('newer') ? 'newer' : 'unreadable';
      const backupKey = `${CORRUPT_PREFIX}${stamp}`;
      if (!this.keep(backupKey, raw)) return this.lockedResult(detail);
      return { data: emptyData(), issue: { kind, backupKey, detail } };
    }

    const fromVersion = (parsed as { schemaVersion?: unknown }).schemaVersion;
    const didMigrate = fromVersion !== migrated.schemaVersion;
    // Before a migration rewrites the stored document, keep the original exactly as it was.
    if (didMigrate && !this.keep(`${PRE_MIGRATION_PREFIX}v${typeof fromVersion === 'number' ? fromVersion : 0}:${stamp}`, raw)) {
      const v = validateAppData(migrated);
      const s = v.ok ? { data: v.data, dropped: 0 } : salvage(migrated);
      this.locked = true;
      return { data: s?.data ?? emptyData(), issue: { kind: 'backup-failed', backupKey: null, detail: 'Could not keep a copy before upgrading.' } };
    }

    const v = validateAppData(migrated);
    if (v.ok) {
      if (didMigrate) this.save(v.data); // persist the migrated form so migrations run only once
      return { data: v.data, issue: null };
    }

    // Some values are malformed. Keep the original, then continue with every record that is still valid.
    const s = salvage(migrated);
    const backupKey = `${s ? RECOVERY_PREFIX : CORRUPT_PREFIX}${stamp}`;
    if (!this.keep(backupKey, raw)) return this.lockedResult(v.errors.slice(0, 3).join(' '));
    if (!s) return { data: emptyData(), issue: { kind: 'unreadable', backupKey, detail: v.errors.slice(0, 3).join(' ') } };
    this.save(s.data);
    return { data: s.data, issue: { kind: 'partial', backupKey, detail: v.errors.slice(0, 3).join(' '), dropped: s.dropped } };
  }

  private lockedResult(detail: string): LoadResult {
    this.locked = true;
    return { data: emptyData(), issue: { kind: 'backup-failed', backupKey: null, detail } };
  }

  /** Safety copies kept on this device (unreadable data, pre-migration originals, pre-recovery originals). */
  safetyCopies(): { key: string; kind: 'unreadable' | 'pre-migration' | 'recovered'; at: number; size: number }[] {
    const out: { key: string; kind: 'unreadable' | 'pre-migration' | 'recovered'; at: number; size: number }[] = [];
    for (const key of this.adapter.keys()) {
      const kind = key.startsWith(CORRUPT_PREFIX) ? 'unreadable' : key.startsWith(PRE_MIGRATION_PREFIX) ? 'pre-migration' : key.startsWith(RECOVERY_PREFIX) ? 'recovered' : null;
      if (!kind) continue;
      const at = Number(key.split(':').pop());
      out.push({ key, kind, at: Number.isFinite(at) ? at : 0, size: (this.adapter.get(key) ?? '').length });
    }
    return out.sort((a, b) => b.at - a.at);
  }

  readRaw(key: string): string | null {
    return SAFETY_PREFIXES.some((p) => key.startsWith(p)) ? this.adapter.get(key) : null;
  }

  /** Returns false if the write failed (for example, storage is full or disabled). */
  save(data: AppData): boolean {
    if (this.locked) return false;
    try {
      this.adapter.set(DATA_KEY, JSON.stringify(data));
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
    const raw = this.adapter.get(BACKUP_KEY);
    if (!raw) return null;
    try {
      const p = JSON.parse(raw) as { savedAt?: unknown; data?: unknown };
      const v = validateAppData(migrate(p.data));
      if (!v.ok || typeof p.savedAt !== 'string') return null;
      return { savedAt: p.savedAt, data: v.data };
    } catch {
      return null;
    }
  }

  /** Removes every Equanim key from this device. */
  clearAll(): void {
    for (const k of this.adapter.keys()) if (k.startsWith('equanim:')) this.adapter.remove(k);
    this.locked = false;
  }
}
