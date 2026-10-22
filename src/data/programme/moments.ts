import type { SessionType } from '../programme';

/**
 * One short sentence after each session, tied to its type (Round 2 §2.8). Calm and factual: no points, badges,
 * streaks or praise inflation. Picked in turn so the same line never shows twice in a row.
 */
export const MOMENT_LINES: Record<SessionType, string[]> = {
  taster: ['That’s a first look. The rest builds on it.'],
  understand: ['That’s one new idea, read and thought through.', 'That’s the idea for this week. The rest of the week puts it to use.', 'One idea, taken in. That’s the start of the week.'],
  recognise: ['That’s some pattern-spotting practice done.', 'Spotting it on the page makes it easier to spot in the day.', 'That’s a little more practice at seeing what was added.'],
  rehearse: ['That’s one small rehearsal done.', 'Words practised now are easier to find later.', 'That’s a phrase ready for when you need it.'],
  apply: ['That’s a plan for a real moment. Tonight, see how it went.', 'One small experiment, set up for real life.', 'That’s today’s try, planned.'],
  retrieve: ['That’s recall done. Remembering is part of learning.', 'Bringing it back from memory helps it stay.', 'That’s this week’s ideas, recalled and stretched.'],
  review: ['That’s the week looked back on.'],
  integrate: ['That’s the skills used together.', 'One more mixed situation, worked through.', 'That’s practice at choosing the skill that fits.'],
  consolidate: ['That’s one more step in pulling it together.', 'Looking back is part of keeping it.', 'That’s another piece of your six weeks, recorded.'],
};

export function momentLine(type: SessionType, nth: number): string {
  const pool = MOMENT_LINES[type];
  return pool[((nth % pool.length) + pool.length) % pool.length] ?? '';
}
