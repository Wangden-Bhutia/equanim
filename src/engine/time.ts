import { DAY_TYPES, SESSIONS } from '../data/programme';

/** Time for the morning if-then plan and the evening check, in minutes each. */
export const PLAN_MINUTES = 1;
export const EVENING_MINUTES = 1;

/**
 * The single source for every time claim in the app (Round 2 §2.6). Derived from SessionDef.minutes and DAY_TYPES,
 * so copy and data cannot drift. Day 6 (the weekly review) is counted separately.
 */
export function timeClaims() {
  const daily = SESSIONS.filter((s) => s.day !== 6).map((s) => s.minutes);
  const reviews = SESSIONS.filter((s) => s.day === 6).map((s) => s.minutes);
  const sessionMin = Math.min(...daily);
  const sessionMax = Math.max(...daily);
  const extra = PLAN_MINUTES + EVENING_MINUTES;
  const review = Math.max(DAY_TYPES[6]?.minutes ?? 0, ...reviews);
  return { sessionMin, sessionMax, dailyMin: sessionMin + extra, dailyMax: sessionMax + extra, review };
}

const t = timeClaims();
/** "about 8 to 12 minutes a day, including your morning plan and evening check" */
export const DAILY_TIME = `about ${t.dailyMin} to ${t.dailyMax} minutes a day, including your morning plan and evening check`;
/** "Day 6 reviews take about 12 minutes" */
export const REVIEW_TIME = `Day 6 reviews take about ${t.review} minutes`;
/** "About 8–12 min a day" for compact lists. */
export const DAILY_SHORT = `About ${t.dailyMin}–${t.dailyMax} min a day`;
/** "6–10 min" for the session itself. */
export const SESSION_RANGE = `${t.sessionMin}–${t.sessionMax} min`;
export const REVIEW_SHORT = `about ${t.review} min`;
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
