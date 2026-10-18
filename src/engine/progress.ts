import { SCENARIOS } from '../data/scenarios';
import { LIBRARY } from '../data/library';
import { PRACTICES } from '../data/practices';
import { addDays, dateKey, keyFromIso } from './dates';
import { DOMAIN_IDS, type AppData, type DomainId, type EveningReflection, type JournalType } from '../types';

export interface Progress {
  hasAnyRecord: boolean;
  daysEngaged: number;
  last14: { date: string; active: boolean }[];
  activeDaysLast14: number;
  // Practice completed in the app
  practicesCompleted: number;
  scenarioAttempts: number;
  scenariosCompleted: number;
  scenariosTotal: number;
  scenarioRevisits: number;
  domainParticipation: Record<DomainId, number>;
  // Self-reported
  intentionsSet: number;
  intentionDaysLast14: number;
  reflectionsRecorded: number;
  reflectionDaysLast14: number;
  journalByType: Record<JournalType, number>;
  journalEntries: number;
  recentReflections: EveningReflection[];
  recurringThemes: { theme: string; count: number }[];
  // Reading (kept separate from behaviour)
  readingsCompleted: number;
  readingsTotal: number;
  exercisesTried: number;
  streak: { current: number; longest: number };
}

export function activityDays(d: AppData): Set<string> {
  const days = new Set<string>();
  d.intentions.forEach((i) => days.add(i.date));
  d.reflections.forEach((r) => days.add(r.date));
  d.practices.forEach((p) => days.add(p.date));
  d.attempts.forEach((a) => days.add(keyFromIso(a.at)));
  d.completions.forEach((c) => days.add(keyFromIso(c.at)));
  d.journal.forEach((j) => days.add(keyFromIso(j.createdAt)));
  d.library.filter((r) => r.kind !== 'opened').forEach((r) => days.add(keyFromIso(r.at)));
  return days;
}

/** Current streak counts back from today, or from yesterday if today has no activity yet, so a day is never "lost" before it ends. */
export function computeStreak(days: Set<string>, today: string): { current: number; longest: number } {
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of [...days].sort()) {
    run = prev && addDays(prev, 1) === k ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = k;
  }
  return { current, longest };
}

export function computeProgress(d: AppData, now: Date = new Date()): Progress {
  const today = dateKey(now);
  const days = activityDays(d);
  const last14Keys = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));
  const in14 = new Set(last14Keys);
  const scenarioDomain = new Map(SCENARIOS.map((s) => [s.id, s.domain]));
  const practiceDomain = new Map(PRACTICES.map((p) => [p.id, p.domain]));
  const validCompletions = d.completions.filter((c) => scenarioDomain.has(c.scenarioId));
  const uniqueCompleted = new Set(validCompletions.map((c) => c.scenarioId));

  const participation = Object.fromEntries(DOMAIN_IDS.map((x) => [x, 0])) as Record<DomainId, number>;
  validCompletions.forEach((c) => participation[scenarioDomain.get(c.scenarioId) as DomainId]++);
  d.practices.forEach((p) => { const dom = practiceDomain.get(p.practiceId); if (dom) participation[dom]++; });
  d.journal.forEach((j) => { if (j.domain) participation[j.domain]++; });
  d.intentions.forEach((i) => { if (i.domain) participation[i.domain]++; });

  const themeCounts = new Map<string, { theme: string; count: number }>();
  d.journal.forEach((j) => j.themes.forEach((t) => {
    const key = t.trim().toLowerCase();
    if (!key) return;
    const cur = themeCounts.get(key) ?? { theme: t.trim(), count: 0 };
    cur.count++;
    themeCounts.set(key, cur);
  }));

  const libIds = new Set(LIBRARY.map((l) => l.id));
  const completedReadings = new Set(d.library.filter((r) => r.kind === 'completed' && libIds.has(r.itemId)).map((r) => r.itemId));
  const exercises = new Set(d.library.filter((r) => r.kind === 'exercise' && libIds.has(r.itemId)).map((r) => r.itemId));
  const journalByType: Record<JournalType, number> = { incident: 0, daily: 0, free: 0 };
  d.journal.forEach((j) => journalByType[j.type]++);

  return {
    hasAnyRecord: days.size > 0,
    daysEngaged: days.size,
    last14: last14Keys.map((date) => ({ date, active: days.has(date) })),
    activeDaysLast14: last14Keys.filter((k) => days.has(k)).length,
    practicesCompleted: d.practices.length,
    scenarioAttempts: d.attempts.length,
    scenariosCompleted: uniqueCompleted.size,
    scenariosTotal: SCENARIOS.length,
    scenarioRevisits: validCompletions.length - uniqueCompleted.size,
    domainParticipation: participation,
    intentionsSet: d.intentions.length,
    intentionDaysLast14: new Set(d.intentions.filter((i) => in14.has(i.date)).map((i) => i.date)).size,
    reflectionsRecorded: d.reflections.length,
    reflectionDaysLast14: new Set(d.reflections.filter((r) => in14.has(r.date)).map((r) => r.date)).size,
    journalByType,
    journalEntries: d.journal.length,
    recentReflections: [...d.reflections].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    recurringThemes: [...themeCounts.values()].sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme)).slice(0, 8),
    readingsCompleted: completedReadings.size,
    readingsTotal: LIBRARY.length,
    exercisesTried: exercises.size,
    streak: computeStreak(days, today),
  };
}

/** Scenario of the day: prefer not-yet-completed scenarios in the intention's domain, then any not-yet-completed, then rotate. */
export function suggestScenarioId(d: AppData, domain: DomainId | null, dayNumber: number): string {
  const done = new Set(d.completions.map((c) => c.scenarioId));
  const open = (list: typeof SCENARIOS) => list.filter((s) => !done.has(s.id));
  const inDomain = domain ? open(SCENARIOS.filter((s) => s.domain === domain)) : [];
  const anyOpen = open(SCENARIOS);
  const list = inDomain.length ? inDomain : anyOpen.length ? anyOpen : SCENARIOS;
  return (list[dayNumber % list.length] as (typeof SCENARIOS)[number]).id;
}

/** Daily practice: rotates by date; uses the intention's domain when set. */
export function practiceForDay(domain: DomainId | null, dayNumber: number): string {
  const list = domain ? PRACTICES.filter((p) => p.domain === domain) : PRACTICES;
  return (list[dayNumber % list.length] as (typeof PRACTICES)[number]).id;
}
