/** Round 2 §2.6: every time claim comes from one helper, computed from session data. Fails if copy and data drift. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DAY_TYPES, SESSIONS } from '../../src/data/programme';
import { DAILY_SHORT, DAILY_TIME, REVIEW_TIME, SESSION_RANGE, timeClaims } from '../../src/engine/time';
import { reminderIcs } from '../../src/engine/programme';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : [p]; });
}

describe('time claims', () => {
  it('are computed from SessionDef.minutes and DAY_TYPES', () => {
    const daily = SESSIONS.filter((s) => s.day !== 6).map((s) => s.minutes);
    const t = timeClaims();
    expect(t.sessionMin).toBe(Math.min(...daily));
    expect(t.sessionMax).toBe(Math.max(...daily));
    expect(t.dailyMin).toBe(t.sessionMin + 2);
    expect(t.dailyMax).toBe(t.sessionMax + 2);
    expect(t.review).toBe(DAY_TYPES[6]!.minutes);
    for (const s of SESSIONS.filter((x) => x.day === 6)) expect(s.minutes).toBe(t.review);
    expect(DAILY_TIME).toBe(`about ${t.dailyMin} to ${t.dailyMax} minutes a day, including your morning plan and evening check`);
    expect(REVIEW_TIME).toBe(`Day 6 reviews take about ${t.review} minutes`);
    expect(DAILY_SHORT).toBe(`About ${t.dailyMin}–${t.dailyMax} min a day`);
    expect(reminderIcs('08:00', '2026-10-01')).toContain(`About ${SESSION_RANGE}.`);
  });
  it('no source file hard-codes a daily or weekly-review time outside the helper', () => {
    const bad = /(\b\d+\s*(?:–|-|to)?\s*\d*\s*min(?:ute)?s?\s+a\s+day|(?:six|eight|ten|few)[\s-]+(?:to[\s-]+\w+[\s-]+)?minutes?[\s-]+a[\s-]+day|\d+[\s-]minute review|review[^.\n]{0,20}\b\d+\s*min)/i;
    const offenders = files('src').filter((f) => !f.endsWith('engine/time.ts') && /\.(tsx?|html)$/.test(f))
      .flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => ({ f, i: i + 1, l })).filter((x) => bad.test(x.l)));
    expect(offenders.map((o) => `${o.f}:${o.i}: ${o.l.trim()}`)).toEqual([]);
  });
});
