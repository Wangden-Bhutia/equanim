import { emptyData, migrate, validateAppData, MigrationError } from './schema';
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

export type LoadIssue =
  | { kind: 'unreadable'; backupKey: string; detail: string }
  | { kind: 'newer'; backupKey: string; detail: string };

export interface LoadResult { data: AppData; issue: LoadIssue | null }

export class Repository {
  constructor(private adapter: StorageAdapter) {}

  load(): LoadResult {
    let raw: string | null;
    try {
      raw = this.adapter.get(DATA_KEY);
    } catch {
      return { data: emptyData(), issue: null };
    }
    if (raw === null) return { data: emptyData(), issue: null };
    try {
      const parsed: unknown = JSON.parse(raw);
      const migrated = migrate(parsed);
      const v = validateAppData(migrated);
      if (!v.ok) throw new Error(v.errors.slice(0, 3).join(' '));
      // Persist the migrated form so migrations run only once.
      if ((parsed as { schemaVersion?: unknown }).schemaVersion !== v.data.schemaVersion) this.save(v.data);
      return { data: v.data, issue: null };
    } catch (e) {
      // Never silently discard: keep the unreadable copy under a separate key, then start fresh.
      const backupKey = `${CORRUPT_PREFIX}${Date.now()}`;
      try { this.adapter.set(backupKey, raw); } catch { /* storage full; nothing more we can do */ }
      const detail = e instanceof Error ? e.message : 'Unknown error';
      const kind = e instanceof MigrationError && detail.includes('newer') ? 'newer' : 'unreadable';
      const fresh = emptyData();
      return { data: fresh, issue: { kind, backupKey, detail } };
    }
  }

  /** Returns false if the write failed (for example, storage is full or disabled). */
  save(data: AppData): boolean {
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
  }
}
