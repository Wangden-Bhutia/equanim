import { DOMAIN_IDS, type AppData, type DomainId } from '../types';

export const SCHEMA_VERSION = 2;
export const MAX_TEXT = 20000;

export function emptyData(now: Date = new Date()): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now.toISOString(),
    onboardingCompletedAt: null,
    settings: { displayName: '', streaksEnabled: false, theme: 'system' },
    intentions: [],
    reflections: [],
    practices: [],
    attempts: [],
    completions: [],
    journal: [],
    library: [],
    inProgress: null,
  };
}

type Json = Record<string, unknown>;
type Migration = (input: Json) => Json;

const arr = (v: unknown): Json[] => (Array.isArray(v) ? (v as Json[]) : []);
/** Records that are not objects are passed through untouched, so salvage() counts and sets them aside with the raw copy kept. */
const objs = (v: unknown): Json[] => arr(v).filter((x) => typeof x === 'object' && x !== null && !Array.isArray(x));
const passThrough = (v: unknown): unknown[] => arr(v).filter((x) => !(typeof x === 'object' && x !== null && !Array.isArray(x)));
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** v1 domain ids (shipped in 1.0) mapped to the specified domain names. */
export const V1_DOMAIN_MAP: Record<string, DomainId> = { words: 'speech', perspective: 'personalisation', assumptions: 'inquiry', effort: 'effort' };
/** v1 library ids mapped to their v2 equivalents. Items without an equivalent keep their id and are ignored by progress. */
export const V1_LIBRARY_MAP: Record<string, string> = {
  'section-words': 'section-speech',
  'section-perspective': 'section-personalisation',
  'section-assumptions': 'section-inquiry',
  'section-effort': 'section-effort',
  'essay-facts-stories-feelings': 'essay-stories-we-add',
  'essay-space-between': 'essay-space-between',
  'essay-boundary-not-wall': 'essay-boundaries',
  'essay-difficult-days': 'essay-difficult-day',
};
/**
 * Migrations keyed by the version they upgrade FROM. Each returns data at version + 1.
 * Version 0 means "no schemaVersion field".
 */
export const MIGRATIONS: Record<number, Migration> = {
  0: (d) => {
    const settings = (typeof d.settings === 'object' && d.settings !== null ? d.settings : {}) as Json;
    return {
      createdAt: typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString(),
      onboardingCompletedAt: d.onboardingCompletedAt ?? null,
      ...d,
      schemaVersion: 1,
      settings: { displayName: '', streaksEnabled: false, theme: 'system', ...settings },
      intentions: arr(d.intentions),
      attempts: arr(d.attempts),
      journal: arr(d.journal),
      library: arr(d.library),
    };
  },
  1: (d) => {
    // Equanim 1.0 → 1.1. Pure and deterministic: running it twice on the same input gives the same output.
    // Malformed records are passed through as they are and dealt with by salvage(), never silently rewritten here.
    const mapDomain = (v: unknown): DomainId | null => (typeof v === 'string' && V1_DOMAIN_MAP[v]) || null;
    const intentions = objs(d.intentions);
    const reflections = intentions
      .filter((i) => i.reflection && typeof i.reflection === 'object')
      .map((i) => {
        const r = i.reflection as Json;
        return {
          id: `ref_${str(i.id)}`,
          date: i.date,
          happened: '', initial: '', did: '', alternative: '', nextTime: '',
          createdAt: r.at, updatedAt: r.at,
          legacyCheckIn: { outcome: r.outcome, note: r.note ?? '' },
        };
      });
    const attempts = objs(d.attempts);
    // 1.0 had no explicit completion step; exploring a scenario counted as doing it. Preserve that as one completion per scenario.
    const byScenario = new Map<string, { at: string; options: string[] }>();
    for (const a of attempts) {
      if (typeof a.scenarioId !== 'string' || typeof a.at !== 'string') continue;
      const cur = byScenario.get(a.scenarioId) ?? { at: a.at, options: [] };
      if (a.at > cur.at) cur.at = a.at;
      if (typeof a.optionId === 'string' && !cur.options.includes(a.optionId)) cur.options.push(a.optionId);
      byScenario.set(a.scenarioId, cur);
    }
    const library: Json[] = [];
    for (const r of objs(d.library)) {
      const itemId = V1_LIBRARY_MAP[str(r.itemId)] ?? r.itemId;
      if (r.kind === 'read') {
        // 1.0 recorded "read" on opening and showed the item as Read. Keep both meanings: opened, and shown as read.
        library.push({ itemId, kind: 'opened', at: r.at }, { itemId, kind: 'completed', at: r.at });
      } else library.push({ itemId, kind: r.kind, at: r.at });
    }
    library.push(...(passThrough(d.library) as Json[]));
    return {
      schemaVersion: 2,
      createdAt: d.createdAt,
      onboardingCompletedAt: d.onboardingCompletedAt ?? null,
      settings: d.settings,
      intentions: [...intentions.map((i) => ({
        id: i.id, date: i.date, category: 'custom', domain: mapDomain(i.domain), text: i.text, createdAt: i.createdAt, updatedAt: i.updatedAt,
      })), ...passThrough(d.intentions)],
      reflections,
      practices: [],
      attempts: [...attempts, ...passThrough(d.attempts)],
      completions: [...byScenario.entries()].map(([scenarioId, v]) => ({ id: `cmp_${scenarioId}_migrated`, scenarioId, at: v.at, optionIds: v.options, note: '' })),
      journal: [...passThrough(d.journal), ...objs(d.journal).map((j) => ({
        id: j.id,
        type: 'incident',
        // Same-meaning fields map to the incident questions; the two without an exact equivalent keep their 1.0 key and label.
        answers: Object.fromEntries(
          Object.entries({ facts: j.situation, interpretation: j.story, response: j.response, nextTime: j.nextTime, note: j.note })
            .filter(([, v]) => typeof v !== 'string' || v.length > 0),
        ),
        domain: mapDomain(j.domain),
        scenarioId: j.scenarioId ?? null,
        themes: [],
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      }))],
      library,
      inProgress: null,
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
const CATEGORIES = ['speak-carefully', 'separate-observation', 'ask-before-assuming', 'pause-before-responding', 'sincere-effort', 'custom'];

const isLegacyCheckIn = (v: unknown) =>
  v === undefined || (isObj(v) && ['in-the-moment', 'afterwards', 'slipped-past'].includes(String(v.outcome)) && isStr(v.note));

const RECORD_CHECKS: Record<string, (x: Json) => boolean> = {
  intentions: (x) =>
    isId(x.id) && isDateKey(x.date) && CATEGORIES.includes(String(x.category)) && (x.domain === null || isDomain(x.domain)) &&
    isStr(x.text, 500) && isIso(x.createdAt) && isIso(x.updatedAt),
  reflections: (x) =>
    isId(x.id) && isDateKey(x.date) && isStr(x.happened) && isStr(x.initial) && isStr(x.did) && isStr(x.alternative) && isStr(x.nextTime) &&
    isIso(x.createdAt) && isIso(x.updatedAt) && isLegacyCheckIn(x.legacyCheckIn),
  practices: (x) => isId(x.id) && isId(x.practiceId) && isDateKey(x.date) && isStr(x.response) && isIso(x.completedAt),
  attempts: (x) => isId(x.id) && isId(x.scenarioId) && isId(x.optionId) && isIso(x.at),
  completions: (x) =>
    isId(x.id) && isId(x.scenarioId) && isIso(x.at) && Array.isArray(x.optionIds) && x.optionIds.every((o) => isId(o)) && isStr(x.note),
  journal: (x) =>
    isId(x.id) && ['incident', 'daily', 'free'].includes(String(x.type)) && isObj(x.answers) &&
    Object.entries(x.answers).every(([k, v]) => k.length <= 40 && isStr(v)) &&
    (x.domain === null || isDomain(x.domain)) && (x.scenarioId === null || isId(x.scenarioId)) &&
    Array.isArray(x.themes) && x.themes.length <= 20 && x.themes.every((t) => isStr(t, 40)) &&
    isIso(x.createdAt) && isIso(x.updatedAt),
  library: (x) => isId(x.itemId) && ['opened', 'completed', 'exercise'].includes(String(x.kind)) && isIso(x.at),
};
const COLLECTIONS = Object.keys(RECORD_CHECKS);
const isSettings = (s: unknown) =>
  isObj(s) && isStr(s.displayName, 80) && typeof s.streaksEnabled === 'boolean' && ['system', 'light', 'dark'].includes(String(s.theme));
const isInProgress = (ip: unknown) =>
  ip === null || (isObj(ip) && (ip.kind === 'scenario' || ip.kind === 'practice') && isId(ip.refId) && isIso(ip.startedAt) && isStr(ip.draft));

export function validateAppData(d: unknown): { ok: true; data: AppData } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const fail = (m: string) => errors.push(m);
  if (!isObj(d)) return { ok: false, errors: ['Data is not an object.'] };
  if (d.schemaVersion !== SCHEMA_VERSION) fail('Unsupported schema version.');
  if (!isIso(d.createdAt)) fail('createdAt is missing or invalid.');
  if (!(d.onboardingCompletedAt === null || isIso(d.onboardingCompletedAt))) fail('onboardingCompletedAt is invalid.');
  if (!isSettings(d.settings)) fail('settings are invalid.');
  for (const key of COLLECTIONS) {
    const v = d[key];
    if (!Array.isArray(v)) { fail(`${key} must be a list.`); continue; }
    v.forEach((x, i) => { if (!isObj(x) || !RECORD_CHECKS[key]!(x)) fail(`${key}[${i}] is invalid.`); });
  }
  if (!isInProgress(d.inProgress)) fail('inProgress is invalid.');
  if (errors.length) return { ok: false, errors };
  return { ok: true, data: d as unknown as AppData };
}

/**
 * Recovery for stored data with some malformed values: keeps every record that is valid, replaces invalid
 * top-level values with safe defaults, and counts what was set aside. The caller must keep the original raw
 * text before using the result, so nothing set aside is lost. Import does NOT use this: imports are all-or-nothing.
 */
export function salvage(d: Json): { data: AppData; dropped: number } | null {
  if (d.schemaVersion !== SCHEMA_VERSION) return null;
  const base = emptyData();
  let dropped = 0;
  const out: Json = { ...base };
  out.createdAt = isIso(d.createdAt) ? d.createdAt : base.createdAt;
  out.onboardingCompletedAt = d.onboardingCompletedAt === null || isIso(d.onboardingCompletedAt) ? d.onboardingCompletedAt ?? null : base.createdAt;
  if (isSettings(d.settings)) out.settings = d.settings;
  else {
    const s = isObj(d.settings) ? d.settings : {};
    out.settings = {
      displayName: isStr(s.displayName, 80) ? s.displayName : '',
      streaksEnabled: typeof s.streaksEnabled === 'boolean' ? s.streaksEnabled : false,
      theme: ['system', 'light', 'dark'].includes(String(s.theme)) ? s.theme : 'system',
    };
    dropped++;
  }
  for (const key of COLLECTIONS) {
    const v = Array.isArray(d[key]) ? (d[key] as unknown[]) : [];
    if (!Array.isArray(d[key]) && d[key] !== undefined) dropped++;
    const kept = v.filter((x) => isObj(x) && RECORD_CHECKS[key]!(x));
    dropped += v.length - kept.length;
    out[key] = kept;
  }
  out.inProgress = isInProgress(d.inProgress) ? d.inProgress ?? null : null;
  const v = validateAppData(out);
  return v.ok ? { data: v.data, dropped } : null;
}
