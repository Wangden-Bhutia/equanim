import { DOMAIN_IDS, type AppData, type DomainId } from './types';

export const SCHEMA_VERSION = 1;
export const MAX_TEXT = 20000;

export function emptyData(now: Date = new Date()): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    onboardingCompletedAt: null,
    settings: { displayName: '', streaksEnabled: false, theme: 'system' },
    intentions: [],
    attempts: [],
    journal: [],
    library: [],
  };
}

type Json = Record<string, unknown>;
type Migration = (input: Json) => Json;

/**
 * Migrations keyed by the version they upgrade FROM. Each returns data at version + 1.
 * Version 0 means "no schemaVersion field": the shape is assumed to be the v1 shape with
 * possibly missing collections or settings, which are filled with safe defaults.
 */
export const MIGRATIONS: Record<number, Migration> = {
  0: (d) => {
    const base = emptyData();
    const settings = (typeof d.settings === 'object' && d.settings !== null ? d.settings : {}) as Json;
    return {
      ...base,
      ...d,
      schemaVersion: 1,
      settings: { ...base.settings, ...settings },
      intentions: Array.isArray(d.intentions) ? d.intentions : [],
      attempts: Array.isArray(d.attempts) ? d.attempts : [],
      journal: Array.isArray(d.journal) ? d.journal : [],
      library: Array.isArray(d.library) ? d.library : [],
    };
  },
};

export class MigrationError extends Error {}

export function migrate(input: unknown, migrations: Record<number, Migration> = MIGRATIONS, target = SCHEMA_VERSION): Json {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw new MigrationError('Data is not an object.');
  let data = input as Json;
  let version = typeof data.schemaVersion === 'number' ? data.schemaVersion : 0;
  if (!Number.isInteger(version) || version < 0) throw new MigrationError('Unknown schema version.');
  if (version > target) throw new MigrationError(`This data was created by a newer version of Equanim (schema ${version}).`);
  while (version < target) {
    const step = migrations[version];
    if (!step) throw new MigrationError(`No migration from schema ${version}.`);
    data = step(data);
    const next = data.schemaVersion;
    if (next !== version + 1) throw new MigrationError(`Migration from ${version} did not advance the version.`);
    version = next;
  }
  return data;
}

// ---------- Validation ----------

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown, max = MAX_TEXT): v is string => typeof v === 'string' && v.length <= max;
const isIso = (v: unknown): v is string => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
const isDateKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isDomain = (v: unknown): v is DomainId => typeof v === 'string' && (DOMAIN_IDS as string[]).includes(v);
const isId = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length <= 120;

export function validateAppData(d: unknown): { ok: true; data: AppData } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const fail = (m: string) => errors.push(m);
  if (!isObj(d)) return { ok: false, errors: ['Data is not an object.'] };
  if (d.schemaVersion !== SCHEMA_VERSION) fail('Unsupported schema version.');
  if (!isIso(d.createdAt)) fail('createdAt is missing or invalid.');
  if (!(d.onboardingCompletedAt === null || isIso(d.onboardingCompletedAt))) fail('onboardingCompletedAt is invalid.');
  const s = d.settings;
  if (!isObj(s) || !isStr(s.displayName, 80) || typeof s.streaksEnabled !== 'boolean' || !['system', 'light', 'dark'].includes(String(s.theme)))
    fail('settings are invalid.');

  const arr = (key: string, check: (x: Json) => boolean) => {
    const v = d[key];
    if (!Array.isArray(v)) return fail(`${key} must be a list.`);
    v.forEach((x, i) => {
      if (!isObj(x) || !check(x)) fail(`${key}[${i}] is invalid.`);
    });
  };

  arr('intentions', (x) =>
    isId(x.id) && isDateKey(x.date) && isDomain(x.domain) && isStr(x.text, 500) && isIso(x.createdAt) && isIso(x.updatedAt) &&
    (x.reflection === null ||
      (isObj(x.reflection) && ['in-the-moment', 'afterwards', 'slipped-past'].includes(String(x.reflection.outcome)) &&
        isStr(x.reflection.note) && isIso(x.reflection.at))),
  );
  arr('attempts', (x) => isId(x.id) && isId(x.scenarioId) && isId(x.optionId) && isIso(x.at));
  arr('journal', (x) =>
    isId(x.id) && isIso(x.createdAt) && isIso(x.updatedAt) && (x.domain === null || isDomain(x.domain)) &&
    (x.scenarioId === null || isId(x.scenarioId)) &&
    isStr(x.situation) && isStr(x.story) && isStr(x.response) && isStr(x.nextTime) && isStr(x.note),
  );
  arr('library', (x) => isId(x.itemId) && (x.kind === 'read' || x.kind === 'exercise') && isIso(x.at));

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: d as unknown as AppData };
}
