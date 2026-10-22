import { DAY0_ID, SESSIONS, SESSION_BY_ID, type SessionDef } from '../data/programme';
import type { AppData, RecallRecord } from '../types';
import { addDays, keyFromIso } from './dates';
import { activityDays } from './progress';

/** Every session in order. Day 0 first; Day 7 of each week is rest and has no session. */
export const ORDER: string[] = [DAY0_ID, ...SESSIONS.map((s) => s.id)];
export const TOTAL_DAYS = 42;

export const sessionRecordId = (sessionId: string) => `ses_${sessionId}`;
export const isDone = (d: AppData, sessionId: string) => d.sessions.some((s) => s.sessionId === sessionId);

/**
 * The day pointer is the number of sessions completed in order, not the calendar. Sessions unlock one after
 * another and can be done late; there is no penalty for a gap.
 */
export function pointer(d: AppData): number {
  const i = ORDER.findIndex((id) => !isDone(d, id));
  return i === -1 ? ORDER.length : i;
}

export function currentSessionId(d: AppData): string | null {
  return ORDER[pointer(d)] ?? null;
}

export function isUnlocked(d: AppData, sessionId: string): boolean {
  const i = ORDER.indexOf(sessionId);
  return i !== -1 && (i <= pointer(d) || isDone(d, sessionId));
}

export function parseSessionId(id: string): { week: number; day: number } | null {
  const m = /^w(\d)d(\d)$/.exec(id);
  return m ? { week: Number(m[1]), day: Number(m[2]) } : null;
}

/** Day number on the 42-day path: Week 1 Day 1 is day 1; Day 0 is 0. */
export function dayNumber(sessionId: string): number {
  const p = parseSessionId(sessionId);
  if (!p || p.week === 0) return 0;
  return (p.week - 1) * 7 + p.day;
}

export function weekDayLabel(sessionId: string | null): string {
  if (sessionId === null) return 'Programme complete';
  const p = parseSessionId(sessionId);
  if (!p || p.week === 0) return 'Week 0 · Day 0';
  return `Week ${p.week} · Day ${dayNumber(sessionId)} of ${TOTAL_DAYS}`;
}

/** Share of the 42-day path behind the user, 0–1, for the thin progress bar. */
export function pathProgress(d: AppData): number {
  const cur = currentSessionId(d);
  if (cur === null) return 1;
  return Math.max(0, (dayNumber(cur) - 1) / TOTAL_DAYS);
}

export function sessionRoute(sessionId: string, d?: AppData): string {
  if (sessionId === DAY0_ID) return d && d.values.length >= 3 ? '/baseline' : '/values';
  const p = parseSessionId(sessionId);
  if (p && p.day === 6) return `/review/${p.week}`;
  if (sessionId === 'w6d1') return '/baseline/finish';
  return `/session/${sessionId}`;
}

export function sessionDef(sessionId: string): SessionDef | null {
  return SESSION_BY_ID[sessionId] ?? null;
}

// ---------- Calendar pacing (schema v5) ----------

const IN_ORDER = new Set(ORDER);

/** True when a programme session was completed for the first time on this local day. */
export function doneNewOn(d: AppData, day: string): boolean {
  return d.sessions.some((s) => IN_ORDER.has(s.sessionId) && keyFromIso(s.completedAt) === day);
}

/**
 * One new session per calendar day. Returns the day key the next session opens on, or null when it is open now.
 * A gap never matters: the check only looks at today, so after any absence the next session is simply open.
 */
export function opensOn(d: AppData, today: string): string | null {
  if (currentSessionId(d) === null || inMaintenance(d)) return null;
  return doneNewOn(d, today) ? addDays(today, 1) : null;
}

/** Would completing this session now be ahead of schedule? Only a first completion of a programme session can be. */
export function wouldBeEarly(d: AppData, sessionId: string, today: string): boolean {
  return IN_ORDER.has(sessionId) && !isDone(d, sessionId) && doneNewOn(d, today);
}

/** Sessions the user chose to do ahead of schedule ("Do the next one now anyway"). */
export const earlyCount = (d: AppData) => d.sessions.filter((s) => s.earlyStart).length;

/** "Thursday 23 October", for "opens tomorrow" lines. */
export function dayLabel(key: string, opts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
  const [y, m, dd] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, dd).toLocaleDateString(undefined, opts);
}

/** When the user has been away for more than a day, Today says "pick up where you left off". Never a penalty. */
export function isReturning(d: AppData, today: string): boolean {
  if (!d.programme) return false;
  const last = d.sessions.map((s) => keyFromIso(s.completedAt)).sort().pop() ?? keyFromIso(d.programme.startedAt);
  return last < addDays(today, -1) && currentSessionId(d) !== null;
}

// ---------- Spaced retrieval ----------

/** Earlier questions come back 2, 7 and 21 days after they were first answered. */
export const RECALL_OFFSETS = [2, 7, 21];
export const MAX_RECALL_PER_DAY = 2;

export function recallDueOn(r: RecallRecord): string | null {
  const off = RECALL_OFFSETS[r.reviewed.length];
  return off === undefined ? null : addDays(r.firstSeen, off);
}

/** Up to two questions due today, oldest due first. A question answered today is never due again today. */
export function dueRecall(d: AppData, today: string, max = MAX_RECALL_PER_DAY): string[] {
  return d.recall
    .filter((r) => r.firstSeen !== today && !r.reviewed.includes(today))
    .map((r) => ({ id: r.id, due: recallDueOn(r) }))
    .filter((x): x is { id: string; due: string } => x.due !== null && x.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id))
    .slice(0, max)
    .map((x) => x.id);
}

/** Records an answer: the first answer starts the schedule; a later answer on or after the due day advances it. */
export function recordRecall(list: RecallRecord[], questionId: string, today: string, correct: boolean, now: string): RecallRecord[] {
  const cur = list.find((r) => r.id === questionId);
  if (!cur) return [...list, { id: questionId, firstSeen: today, reviewed: [], lastCorrect: correct, updatedAt: now }];
  const due = recallDueOn(cur);
  const advance = due !== null && due <= today && !cur.reviewed.includes(today);
  return list.map((r) => (r.id === questionId ? { ...r, reviewed: advance ? [...r.reviewed, today] : r.reviewed, lastCorrect: correct, updatedAt: now } : r));
}

// ---------- Calendar reminder (.ics) ----------

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * A daily recurring calendar event at a local time. It only reminds the user once they add it to their calendar
 * app; Equanim sends nothing and has no server. Floating local time (no time zone), so it follows the device.
 */
export function reminderIcs(time: string, startDay: string, now: Date = new Date()): string {
  const [h, m] = time.split(':');
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Equanim//Daily reminder//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:equanim-daily-reminder@equanim.app',
    `DTSTAMP:${stamp}`,
    `DTSTART:${startDay.replace(/-/g, '')}T${h}${m}00`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Equanim: today’s session',
    'DESCRIPTION:About 8 minutes. Open Equanim when you have a moment.',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'TRIGGER:PT0M', 'DESCRIPTION:Equanim: today’s session', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}

// ---------- Backup nudge ----------

export const NUDGE_EVERY_DAYS = 7;

/** Days of use (days with any activity) after a given day key, exclusive. */
function usageDaysAfter(d: AppData, after: string | null): number {
  let n = 0;
  for (const day of activityDays(d)) if (after === null || day > after) n++;
  return n;
}

/** True after 7 days of use since the last export (or ever), unless dismissed within the last 7 days of use. */
export function shouldNudgeBackup(d: AppData): boolean {
  const lastExport = d.settings.lastExportAt ? keyFromIso(d.settings.lastExportAt) : null;
  if (usageDaysAfter(d, lastExport) < NUDGE_EVERY_DAYS) return false;
  const dismissed = d.settings.backupNudgeDismissedOn;
  return dismissed === null || usageDaysAfter(d, dismissed) >= NUDGE_EVERY_DAYS;
}

// ---------- Progress views ----------

/** Monday of the week containing `today` (a date key). */
export function weekStart(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const dow = (new Date(y!, m! - 1, d!).getDay() + 6) % 7; // Monday = 0
  return addDays(today, -dow);
}

/** Days with any recorded practice since Monday, including today. */
export function daysPractisedThisWeek(d: AppData, today: string): number {
  const start = weekStart(today);
  return [...activityDays(d)].filter((k) => k >= start && k <= today).length;
}

/** Status of each of the six weeks for the journey map. */
export type WeekStatus = 'done' | 'current' | 'upcoming';
export function weekStatuses(d: AppData): WeekStatus[] {
  const cur = currentSessionId(d);
  const curWeek = cur === null ? 7 : Math.max(1, parseSessionId(cur)?.week ?? 1);
  return [1, 2, 3, 4, 5, 6].map((w) => (w < curWeek ? 'done' : w === curWeek ? 'current' : 'upcoming'));
}

/** The most recent "now" snapshot: the Week 6 baseline or a later monthly check-in. Null if none. */
export function latestSnapshot(d: AppData) {
  return [...d.baselines].filter((b) => b.kind !== 'start').sort((a, b) => a.completedAt.localeCompare(b.completedAt)).pop() ?? null;
}

// ---------- Maintenance mode ----------

export const MAINTENANCE_PER_WEEK = 3;
export const inMaintenance = (d: AppData) => !!d.programme?.maintenanceStartedAt;

/** A monthly check-in is due when no snapshot (Week 6 or check-in) exists for the current month. */
export function checkinDue(d: AppData, today: string): boolean {
  if (!inMaintenance(d)) return false;
  const month = today.slice(0, 7);
  return !d.baselines.some((b) => b.kind !== 'start' && keyFromIso(b.completedAt).slice(0, 7) === month);
}

/** Week ids that can be restarted in maintenance: every week whose sessions are available. */
export function restartTarget(week: number): string {
  return `w${week}d1`;
}
