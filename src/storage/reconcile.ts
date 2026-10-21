import type { AppData } from '../types';

/**
 * Record-level three-way merge of two versions of the store that both descend from `base`.
 * Used when another tab (or an Equanim 1.0 tab) changed the stored data after this tab last read it.
 *
 * Rules, per record (matched by id; reading records by item, kind and time):
 * - changed on one side only: that change is taken (including a deletion);
 * - changed on both sides to the same value: taken;
 * - changed on both sides differently: the more recently updated version is kept and the other is SET ASIDE;
 * - deleted on one side and edited on the other: the edited version is kept (an edit is never lost to a delete);
 * - a record deleted because the other side deleted it is also set aside, so it stays recoverable.
 * Afterwards there is at most one intention and one evening reflection per day; extra ones are set aside.
 * Nothing is ever dropped without appearing in `setAside`.
 */
export interface SetAside { collection: string; reason: 'edited-in-two-places' | 'deleted-elsewhere' | 'same-day-duplicate'; record: unknown; keptId?: string }
export interface MergeResult { data: AppData; setAside: SetAside[] }

type Rec = Record<string, unknown>;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const TIME: Record<string, string> = {
  intentions: 'updatedAt', reflections: 'updatedAt', journal: 'updatedAt', practices: 'completedAt', attempts: 'at', completions: 'at',
  // Schema v3 (programme). Same rules: record-level, newest edit kept, the other set aside.
  sessions: 'updatedAt', values: 'updatedAt', baselines: 'updatedAt', reviews: 'updatedAt', plans: 'updatedAt', recall: 'updatedAt',
};
export const ID_COLLECTIONS = Object.keys(TIME) as (keyof Pick<AppData,
  'intentions' | 'reflections' | 'journal' | 'practices' | 'attempts' | 'completions' | 'sessions' | 'values' | 'baselines' | 'reviews' | 'plans' | 'recall'>)[];
const libKey = (r: AppData['library'][number]) => `${r.itemId}|${r.kind}|${r.at}`;

function mergeList<T>(collection: string, key: (x: T) => string, time: (x: T) => string, base: T[], ours: T[], theirs: T[], out: SetAside[]): T[] {
  const B = new Map(base.map((x) => [key(x), x]));
  const O = new Map(ours.map((x) => [key(x), x]));
  const Th = new Map(theirs.map((x) => [key(x), x]));
  const order = [...new Set([...ours.map(key), ...theirs.map(key)])];
  const result: T[] = [];
  for (const k of order) {
    const b = B.get(k), o = O.get(k), t = Th.get(k);
    if (o !== undefined && t !== undefined) {
      if (same(o, t) || same(t, b)) result.push(o);
      else if (same(o, b)) result.push(t);
      else {
        const keepOurs = Date.parse(time(o)) >= Date.parse(time(t));
        result.push(keepOurs ? o : t);
        out.push({ collection, reason: 'edited-in-two-places', record: keepOurs ? t : o, keptId: k });
      }
    } else {
      const present = (o ?? t) as T;
      // Present on one side only. If the other side never had it, it is new: keep it.
      if (b === undefined) { result.push(present); continue; }
      // The other side deleted it. If this side did not change it, the deletion stands, but a copy is set aside.
      if (same(present, b)) out.push({ collection, reason: 'deleted-elsewhere', record: present });
      else result.push(present); // edited here, deleted there: the edit wins
    }
  }
  return result;
}

function onePerDay<T extends { id: string; date: string; updatedAt: string; legacyCheckIn?: unknown }>(collection: string, xs: T[], out: SetAside[]): T[] {
  const byDate = new Map<string, T>();
  for (const x of xs) {
    const prev = byDate.get(x.date);
    if (!prev) { byDate.set(x.date, x); continue; }
    const [keep, drop] = Date.parse(x.updatedAt) > Date.parse(prev.updatedAt) ? [x, prev] : [prev, x];
    // A 1.0 check-in answer is carried over onto the kept reflection, so its meaning stays visible.
    const kept = keep.legacyCheckIn === undefined && drop.legacyCheckIn !== undefined ? { ...keep, legacyCheckIn: drop.legacyCheckIn } : keep;
    byDate.set(x.date, kept);
    out.push({ collection, reason: 'same-day-duplicate', record: drop, keptId: keep.id });
  }
  const kept = new Set([...byDate.values()].map((x) => x.id));
  return xs.filter((x) => kept.has(x.id)).map((x) => byDate.get(x.date) as T);
}

function scalar<T>(b: T, o: T, t: T): T {
  if (same(o, t) || same(t, b)) return o;
  if (same(o, b)) return t;
  return o; // both changed: this tab's value is kept (settings and the in-progress draft have no timestamps)
}

function fieldwise<T extends object>(b: T, o: T, t: T): T {
  const out = { ...o } as Record<string, unknown>;
  const B = b as Record<string, unknown>, O = o as Record<string, unknown>, Th = t as Record<string, unknown>;
  for (const k of new Set([...Object.keys(O), ...Object.keys(Th)])) out[k] = scalar(B[k], O[k], Th[k]);
  return out as T;
}

export function merge3(base: AppData, ours: AppData, theirs: AppData): MergeResult {
  const out: SetAside[] = [];
  const d: AppData = { ...ours };
  for (const c of ID_COLLECTIONS) {
    const f = TIME[c] as string;
    (d as unknown as Rec)[c] = mergeList<Rec>(c, (x) => String(x.id), (x) => String(x[f]), base[c] as unknown as Rec[], ours[c] as unknown as Rec[], theirs[c] as unknown as Rec[], out);
  }
  d.library = mergeList('library', libKey, (x) => x.at, base.library, ours.library, theirs.library, out);
  d.intentions = onePerDay('intentions', d.intentions, out);
  d.reflections = onePerDay('reflections', d.reflections, out);
  d.plans = onePerDay('plans', d.plans, out);
  d.settings = fieldwise(base.settings, ours.settings, theirs.settings);
  d.inProgress = scalar(base.inProgress, ours.inProgress, theirs.inProgress);
  // Enrolment: field by field; if only one side has started the programme, it stays started.
  d.programme = !ours.programme || !theirs.programme
    ? ours.programme ?? theirs.programme ?? null
    : fieldwise(base.programme ?? ours.programme, ours.programme, theirs.programme);
  const onboard = [ours.onboardingCompletedAt, theirs.onboardingCompletedAt].filter((x): x is string => !!x).sort()[0] ?? null;
  d.onboardingCompletedAt = onboard;
  d.createdAt = [ours.createdAt, theirs.createdAt].sort()[0] as string;
  return { data: d, setAside: out };
}
