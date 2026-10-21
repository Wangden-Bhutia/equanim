import { migrate, validateAppData } from './schema';
import type { AppData } from '../types';

export const EXPORT_APP = 'equanim';

export interface ExportEnvelope { app: typeof EXPORT_APP; exportedAt: string; data: AppData }

export function exportJson(data: AppData, now: Date = new Date()): string {
  const env: ExportEnvelope = { app: EXPORT_APP, exportedAt: now.toISOString(), data };
  return JSON.stringify(env, null, 2);
}

export function exportFileName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `equanim-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

export interface DataSummary {
  intentions: number; reflections: number; practices: number; attempts: number; scenarios: number; journal: number; library: number; sessions: number;
}

export function summarize(d: AppData): DataSummary {
  return {
    intentions: d.intentions.length,
    reflections: d.reflections.length,
    practices: d.practices.length,
    attempts: d.attempts.length,
    scenarios: new Set(d.completions.map((c) => c.scenarioId)).size,
    journal: d.journal.length,
    library: d.library.length,
    sessions: d.sessions.length,
  };
}

export type ParseResult = { ok: true; data: AppData; summary: DataSummary; exportedAt: string | null } | { ok: false; error: string };

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function parseImport(text: string): ParseResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'The file is larger than 5 MB, which is too large to be an Equanim backup.' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' };
  }
  let payload: unknown = parsed;
  let exportedAt: string | null = null;
  if (typeof parsed === 'object' && parsed !== null && 'app' in parsed) {
    const env = parsed as { app?: unknown; exportedAt?: unknown; data?: unknown };
    if (env.app !== EXPORT_APP) return { ok: false, error: 'This file was not exported from Equanim.' };
    payload = env.data;
    exportedAt = typeof env.exportedAt === 'string' ? env.exportedAt : null;
  }
  try {
    const v = validateAppData(migrate(payload));
    if (!v.ok) return { ok: false, error: `The file does not match Equanim's data format: ${v.errors.slice(0, 3).join(' ')}` };
    return { ok: true, data: v.data, summary: summarize(v.data), exportedAt };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'The file could not be read.' };
  }
}

function mergeById<T extends { id: string }>(a: T[], b: T[], time: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const x of a) map.set(x.id, x);
  for (const y of b) {
    const x = map.get(y.id);
    if (!x || Date.parse(time(y)) > Date.parse(time(x))) map.set(y.id, y);
  }
  return [...map.values()];
}

function onePerDay<T extends { date: string; updatedAt: string }>(a: T[], b: T[]): T[] {
  const byDate = new Map<string, T>();
  for (const i of [...a, ...b]) {
    const prev = byDate.get(i.date);
    if (!prev || Date.parse(i.updatedAt) > Date.parse(prev.updatedAt)) byDate.set(i.date, i);
  }
  return [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date));
}

/** Merge imported data into current data. Current settings and in-progress item are kept. One intention and one evening reflection per day: the more recently updated wins. */
export function mergeData(current: AppData, incoming: AppData): AppData {
  const lib = new Map<string, AppData['library'][number]>();
  for (const r of [...current.library, ...incoming.library]) lib.set(`${r.itemId}|${r.kind}|${r.at}`, r);
  const onboard = [current.onboardingCompletedAt, incoming.onboardingCompletedAt].filter((x): x is string => !!x).sort()[0] ?? null;
  return {
    ...current,
    createdAt: [current.createdAt, incoming.createdAt].sort()[0] as string,
    onboardingCompletedAt: onboard,
    intentions: onePerDay(current.intentions, incoming.intentions),
    reflections: onePerDay(current.reflections, incoming.reflections),
    practices: mergeById(current.practices, incoming.practices, (p) => p.completedAt),
    attempts: mergeById(current.attempts, incoming.attempts, (x) => x.at),
    completions: mergeById(current.completions, incoming.completions, (x) => x.at),
    journal: mergeById(current.journal, incoming.journal, (x) => x.updatedAt),
    library: [...lib.values()],
    programme: current.programme ?? incoming.programme,
    sessions: mergeById(current.sessions, incoming.sessions, (x) => x.updatedAt),
    values: current.values.length ? current.values : incoming.values,
    baselines: mergeById(current.baselines, incoming.baselines, (x) => x.updatedAt),
    reviews: mergeById(current.reviews, incoming.reviews, (x) => x.updatedAt),
    plans: onePerDay(current.plans, incoming.plans),
    recall: mergeById(current.recall, incoming.recall, (x) => x.updatedAt),
  };
}
