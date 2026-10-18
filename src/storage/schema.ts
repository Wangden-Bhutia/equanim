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
const V1_OUTCOME_LABEL: Record<string, string> = {
  'in-the-moment': 'The intention came to mind in the moment.',
  afterwards: 'I noticed afterwards.',
  'slipped-past': 'It slipped past today.',
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
    const mapDomain = (v: unknown): DomainId | null => (typeof v === 'string' && V1_DOMAIN_MAP[v]) || null;
    const intentions = arr(d.intentions);
    const reflections = intentions
      .filter((i) => i.reflection && typeof i.reflection === 'object')
      .map((i) => {
        const r = i.reflection as Json;
        const label = V1_OUTCOME_LABEL[str(r.outcome)] ?? '';
        return {
          id: `ref_${str(i.id)}`,
          date: str(i.date),
          happened: [label, str(r.note)].filter(Boolean).join(' '),
          initial: '', did: '', alternative: '', nextTime: '',
          createdAt: str(r.at), updatedAt: str(r.at),
        };
      });
    const attempts = arr(d.attempts);
    // 1.0 had no explicit completion step; exploring a scenario counted as doing it. Preserve that as one completion per scenario.
    const byScenario = new Map<string, { at: string; options: Set<string> }>();
    for (const a of attempts) {
      const cur = byScenario.get(str(a.scenarioId)) ?? { at: str(a.at), options: new Set<string>() };
      if (str(a.at) > cur.at) cur.at = str(a.at);
      cur.options.add(str(a.optionId));
      byScenario.set(str(a.scenarioId), cur);
    }
    return {
      schemaVersion: 2,
      createdAt: d.createdAt,
      onboardingCompletedAt: d.onboardingCompletedAt ?? null,
      settings: d.settings,
      intentions: intentions.map((i) => ({
        id: i.id, date: i.date, category: 'custom', domain: mapDomain(i.domain), text: i.text, createdAt: i.createdAt, updatedAt: i.updatedAt,
      })),
      reflections,
      practices: [],
      attempts,
      completions: [...byScenario.entries()].map(([scenarioId, v]) => ({ id: `cmp_${scenarioId}_migrated`, scenarioId, at: v.at, optionIds: [...v.options], note: '' })),
      journal: arr(d.journal).map((j) => ({
        id: j.id,
        type: 'incident',
        answers: Object.fromEntries(
          Object.entries({ facts: str(j.situation), interpretation: str(j.story), response: str(j.response), better: str(j.nextTime), note: str(j.note) }).filter(([, v]) => v),
        ),
        domain: mapDomain(j.domain),
        scenarioId: j.scenarioId ?? null,
        themes: [],
        createdAt: j.createdAt,
        updatedAt: j.updatedAt,
      })),
      library: arr(d.library).map((r) => ({
        itemId: V1_LIBRARY_MAP[str(r.itemId)] ?? r.itemId,
        kind: r.kind === 'exercise' ? 'exercise' : 'opened', // 1.0 recorded "read" automatically on open, so it is not treated as a completion
        at: r.at,
      })),
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

  const list = (key: string, check: (x: Json) => boolean) => {
    const v = d[key];
    if (!Array.isArray(v)) return fail(`${key} must be a list.`);
    v.forEach((x, i) => {
      if (!isObj(x) || !check(x)) fail(`${key}[${i}] is invalid.`);
    });
  };

  list('intentions', (x) =>
    isId(x.id) && isDateKey(x.date) && CATEGORIES.includes(String(x.category)) && (x.domain === null || isDomain(x.domain)) &&
    isStr(x.text, 500) && isIso(x.createdAt) && isIso(x.updatedAt));
  list('reflections', (x) =>
    isId(x.id) && isDateKey(x.date) && isStr(x.happened) && isStr(x.initial) && isStr(x.did) && isStr(x.alternative) && isStr(x.nextTime) &&
    isIso(x.createdAt) && isIso(x.updatedAt));
  list('practices', (x) => isId(x.id) && isId(x.practiceId) && isDateKey(x.date) && isStr(x.response) && isIso(x.completedAt));
  list('attempts', (x) => isId(x.id) && isId(x.scenarioId) && isId(x.optionId) && isIso(x.at));
  list('completions', (x) =>
    isId(x.id) && isId(x.scenarioId) && isIso(x.at) && Array.isArray(x.optionIds) && x.optionIds.every((o) => isId(o)) && isStr(x.note));
  list('journal', (x) =>
    isId(x.id) && ['incident', 'daily', 'free'].includes(String(x.type)) && isObj(x.answers) &&
    Object.entries(x.answers).every(([k, v]) => k.length <= 40 && isStr(v)) &&
    (x.domain === null || isDomain(x.domain)) && (x.scenarioId === null || isId(x.scenarioId)) &&
    Array.isArray(x.themes) && x.themes.length <= 20 && x.themes.every((t) => isStr(t, 40)) &&
    isIso(x.createdAt) && isIso(x.updatedAt));
  list('library', (x) => isId(x.itemId) && ['opened', 'completed', 'exercise'].includes(String(x.kind)) && isIso(x.at));
  const ip = d.inProgress;
  if (!(ip === null || (isObj(ip) && (ip.kind === 'scenario' || ip.kind === 'practice') && isId(ip.refId) && isIso(ip.startedAt) && isStr(ip.draft))))
    fail('inProgress is invalid.');

  if (errors.length) return { ok: false, errors };
  return { ok: true, data: d as unknown as AppData };
}
