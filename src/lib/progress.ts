import { SCENARIOS } from '../data/scenarios';
import { LIBRARY } from '../data/library';
import { addDays, dateKey, keyFromIso } from './dates';
import { DOMAIN_IDS, type AppData, type DomainId, type ReflectionOutcome } from './types';

export interface Progress {
  hasAnyRecord: boolean;
  activeDays: Set<string>;
  last14: { date: string; active: boolean }[];
  activeDaysLast14: number;
  scenariosExplored: number;
  scenariosTotal: number;
  scenariosCompared: number; // explored at least two responses
  attempts: number;
  byDomain: Record<DomainId, { explored: number; total: number }>;
  journalEntries: number;
  intentionsSet: number;
  reflections: number;
  outcomes: Record<ReflectionOutcome, number>;
  libraryRead: number;
  libraryTotal: number;
  exercisesTried: number;
  streak: { current: number; longest: number };
}

export function activityDays(d: AppData): Set<string> {
  const days = new Set<string>();
  d.intentions.forEach((i) => {
    days.add(keyFromIso(i.createdAt));
    if (i.reflection) days.add(keyFromIso(i.reflection.at));
  });
  d.attempts.forEach((a) => days.add(keyFromIso(a.at)));
  d.journal.forEach((j) => days.add(keyFromIso(j.createdAt)));
  d.library.forEach((r) => days.add(keyFromIso(r.at)));
  return days;
}

/** Current streak counts back from today, or from yesterday if today has no activity yet (so the day is never "lost" before it ends). */
export function computeStreak(days: Set<string>, today: string): { current: number; longest: number } {
  let start = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(start)) {
    current++;
    start = addDays(start, -1);
  }
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of sorted) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest };
}

export function computeProgress(d: AppData, now: Date = new Date()): Progress {
  const today = dateKey(now);
  const days = activityDays(d);
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i - 13);
    return { date, active: days.has(date) };
  });
  const validScenarioIds = new Set(SCENARIOS.map((s) => s.id));
  const optionsByScenario = new Map<string, Set<string>>();
  for (const a of d.attempts) {
    if (!validScenarioIds.has(a.scenarioId)) continue;
    const set = optionsByScenario.get(a.scenarioId) ?? new Set<string>();
    set.add(a.optionId);
    optionsByScenario.set(a.scenarioId, set);
  }
  const byDomain = Object.fromEntries(
    DOMAIN_IDS.map((dom) => {
      const ids = SCENARIOS.filter((s) => s.domain === dom).map((s) => s.id);
      return [dom, { explored: ids.filter((id) => optionsByScenario.has(id)).length, total: ids.length }];
    }),
  ) as Record<DomainId, { explored: number; total: number }>;
  const outcomes: Record<ReflectionOutcome, number> = { 'in-the-moment': 0, afterwards: 0, 'slipped-past': 0 };
  d.intentions.forEach((i) => { if (i.reflection) outcomes[i.reflection.outcome]++; });
  const libIds = new Set(LIBRARY.map((l) => l.id));
  const read = new Set(d.library.filter((r) => r.kind === 'read' && libIds.has(r.itemId)).map((r) => r.itemId));
  const ex = new Set(d.library.filter((r) => r.kind === 'exercise' && libIds.has(r.itemId)).map((r) => r.itemId));
  return {
    hasAnyRecord: days.size > 0,
    activeDays: days,
    last14,
    activeDaysLast14: last14.filter((x) => x.active).length,
    scenariosExplored: optionsByScenario.size,
    scenariosTotal: SCENARIOS.length,
    scenariosCompared: [...optionsByScenario.values()].filter((s) => s.size >= 2).length,
    attempts: d.attempts.length,
    byDomain,
    journalEntries: d.journal.length,
    intentionsSet: d.intentions.length,
    reflections: d.intentions.filter((i) => i.reflection).length,
    outcomes,
    libraryRead: read.size,
    libraryTotal: LIBRARY.length,
    exercisesTried: ex.size,
    streak: computeStreak(days, today),
  };
}

/** Suggest a scenario for today: prefer unexplored ones in the intention's domain, then any unexplored, then rotate by date. */
export function suggestScenarioId(d: AppData, domain: DomainId | null, dayNumber: number): string {
  const explored = new Set(d.attempts.map((a) => a.scenarioId));
  const pool = (list: typeof SCENARIOS) => list.filter((s) => !explored.has(s.id));
  const inDomain = domain ? pool(SCENARIOS.filter((s) => s.domain === domain)) : [];
  const anyUnexplored = pool(SCENARIOS);
  const list = inDomain.length ? inDomain : anyUnexplored.length ? anyUnexplored : SCENARIOS;
  return (list[dayNumber % list.length] as (typeof SCENARIOS)[number]).id;
}
