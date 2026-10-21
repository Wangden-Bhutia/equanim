import { describe, expect, it } from 'vitest';
import { emptyData } from '../../src/storage/schema';
import {
  ORDER, TOTAL_DAYS, currentSessionId, dayNumber, dueRecall, isReturning, isUnlocked, pathProgress, pointer, recordRecall,
  reminderIcs, sessionRoute, shouldNudgeBackup, weekDayLabel,
} from '../../src/engine/programme';
import {
  BASELINE_ITEMS, DAY0_ID, PLAN_CHIPS, RETRIEVAL, RETRIEVAL_BY_ID, SESSIONS, TASTER, VALUES, WEEKS,
} from '../../src/data/programme';
import { SCENARIO_BY_ID } from '../../src/data/scenarios';
import { DOMAIN_IDS, type AppData } from '../../src/types';

const at = (day: string, h = 9) => `${day}T0${h}:00:00`;
const done = (d: AppData, ...ids: string[]): AppData => ({
  ...d,
  sessions: [...d.sessions, ...ids.map((id) => ({ id: `ses_${id}`, sessionId: id, completedAt: new Date(at('2026-10-20')).toISOString(), updatedAt: new Date(at('2026-10-20')).toISOString(), mode: 'think' as const, answers: {}, choices: {} }))],
});
const enrolled = (): AppData => ({ ...emptyData(), programme: { startedAt: new Date(at('2026-10-20')).toISOString(), disclaimerSeenAt: null } });

describe('programme engine: order and unlocking', () => {
  it('has Day 0 and six sessions in each of six weeks (Day 7 is rest)', () => {
    expect(ORDER).toHaveLength(37);
    expect(ORDER[0]).toBe(DAY0_ID);
    expect(ORDER.slice(1, 7)).toEqual(['w1d1', 'w1d2', 'w1d3', 'w1d4', 'w1d5', 'w1d6']);
    expect(dayNumber('w6d6')).toBe(41);
    expect(TOTAL_DAYS).toBe(42);
  });
  it('the day pointer counts completed sessions in order, not calendar days', () => {
    let d = enrolled();
    expect(currentSessionId(d)).toBe(DAY0_ID);
    expect(isUnlocked(d, 'w1d1')).toBe(false);
    d = done(d, DAY0_ID);
    expect(pointer(d)).toBe(1);
    expect(currentSessionId(d)).toBe('w1d1');
    expect(isUnlocked(d, 'w1d1')).toBe(true);
    expect(isUnlocked(d, 'w1d2')).toBe(false);
    d = done(d, 'w1d1', 'w1d2');
    expect(currentSessionId(d)).toBe('w1d3');
    // A session completed out of order (e.g. merged from another tab) does not skip the pointer past a gap.
    d = done(d, 'w1d5');
    expect(currentSessionId(d)).toBe('w1d3');
    expect(isUnlocked(d, 'w1d5')).toBe(true);
    expect(isUnlocked(d, 'w1d6')).toBe(false);
  });
  it('labels days on the 42-day path and fills the progress bar', () => {
    expect(weekDayLabel(DAY0_ID)).toBe('Week 0 · Day 0');
    expect(weekDayLabel('w1d3')).toBe('Week 1 · Day 3 of 42');
    expect(weekDayLabel('w2d3')).toBe('Week 2 · Day 10 of 42');
    expect(weekDayLabel(null)).toBe('Programme complete');
    expect(pathProgress(enrolled())).toBe(0);
    expect(pathProgress(done(enrolled(), DAY0_ID, 'w1d1', 'w1d2'))).toBeCloseTo(2 / 42);
  });
  it('routes Day 0 to values then baseline, reviews to /review/:week, others to /session/:id', () => {
    const d = enrolled();
    expect(sessionRoute(DAY0_ID, d)).toBe('/values');
    const withValues = { ...d, values: VALUES.slice(0, 3).map((v) => ({ id: v.id, sentence: 'x', updatedAt: '2026-10-20T00:00:00.000Z' })) };
    expect(sessionRoute(DAY0_ID, withValues)).toBe('/baseline');
    expect(sessionRoute('w1d6')).toBe('/review/1');
    expect(sessionRoute('w1d2')).toBe('/session/w1d2');
  });
  it('offers "pick up where you left off" after a gap, with no penalty', () => {
    const d = done(enrolled(), DAY0_ID);
    expect(isReturning(d, '2026-10-21')).toBe(false);
    expect(isReturning(d, '2026-10-24')).toBe(true);
    expect(currentSessionId(d)).toBe('w1d1'); // nothing was skipped or reset
  });
});

describe('spaced retrieval', () => {
  it('resurfaces a question 2, 7 and 21 days after it was first answered, at most 2 a day', () => {
    let list = recordRecall([], 'q1', '2026-10-01', true, 'now');
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-01')).toEqual([]);
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-02')).toEqual([]);
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-03')).toEqual(['q1']);
    list = recordRecall(list, 'q1', '2026-10-03', false, 'now');
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-03')).toEqual([]); // not twice on one day
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-07')).toEqual([]);
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-08')).toEqual(['q1']);
    list = recordRecall(list, 'q1', '2026-10-08', true, 'now');
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-21')).toEqual([]);
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-10-22')).toEqual(['q1']);
    list = recordRecall(list, 'q1', '2026-10-22', true, 'now');
    expect(dueRecall({ ...emptyData(), recall: list }, '2026-12-31')).toEqual([]); // schedule finished
    const many = ['a', 'b', 'c', 'd'].reduce((l, id) => recordRecall(l, id, '2026-10-01', true, 'now'), [] as AppData['recall']);
    expect(dueRecall({ ...emptyData(), recall: many }, '2026-10-05')).toHaveLength(2);
  });
  it('answering early does not advance the schedule', () => {
    let list = recordRecall([], 'q1', '2026-10-01', true, 'now');
    list = recordRecall(list, 'q1', '2026-10-02', true, 'now');
    expect(list[0]!.reviewed).toEqual([]);
  });
});

describe('calendar reminder (.ics)', () => {
  it('is a daily recurring event at the chosen local time, with CRLF line endings', () => {
    const ics = reminderIcs('07:30', '2026-10-21', new Date(Date.UTC(2026, 9, 21, 4, 5, 6)));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('\r\nDTSTART:20261021T073000\r\n'); // floating local time: follows the device time zone
    expect(ics).toContain('\r\nRRULE:FREQ=DAILY\r\n');
    expect(ics).toContain('\r\nDTSTAMP:20261021T040506Z\r\n');
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75)).toBe(true);
  });
});

describe('backup nudge', () => {
  const days = (n: number, from = 1) => Array.from({ length: n }, (_, i) => `2026-10-${String(from + i).padStart(2, '0')}`);
  const withPlans = (ds: string[]): AppData => ({ ...emptyData(), plans: ds.map((date, i) => ({ id: `p${i}`, date, domain: null, when: 'a', then: 'b', outcome: null, note: '', createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z` })) });
  it('appears after 7 days of use without an export, and not before', () => {
    expect(shouldNudgeBackup(withPlans(days(6)))).toBe(false);
    expect(shouldNudgeBackup(withPlans(days(7)))).toBe(true);
  });
  it('resets after an export, and stays quiet for 7 days of use after being dismissed', () => {
    const d = withPlans(days(10));
    expect(shouldNudgeBackup({ ...d, settings: { ...d.settings, lastExportAt: new Date(2026, 9, 5, 12).toISOString() } })).toBe(false);
    expect(shouldNudgeBackup({ ...d, settings: { ...d.settings, backupNudgeDismissedOn: '2026-10-08' } })).toBe(false);
    const later = withPlans(days(16));
    expect(shouldNudgeBackup({ ...later, settings: { ...later.settings, backupNudgeDismissedOn: '2026-10-08' } })).toBe(true);
  });
});

describe('content completeness (Week 0 and Week 1)', () => {
  const available = [TASTER, ...SESSIONS.filter((s) => s.available)];
  it('ships Week 1 in full, and keeps Weeks 2–6 on the path for the next update', () => {
    expect(SESSIONS.filter((s) => s.week === 1).every((s) => s.available)).toBe(true);
    expect(SESSIONS.filter((s) => s.week > 1).every((s) => !s.available)).toBe(true);
    expect(WEEKS.map((w) => w.domain)).toEqual(['personalisation', 'inquiry', 'speech', 'effort', null, null]);
  });
  it('every available session has a title, a time estimate and an intro; every lesson has a body, an example and a not-this caveat', () => {
    for (const s of available) {
      expect(s.title.length, s.id).toBeGreaterThan(3);
      expect(s.minutes, s.id).toBeGreaterThanOrEqual(1);
      expect(s.minutes, s.id).toBeLessThanOrEqual(15);
      expect(s.intro, s.id).toBeTruthy();
      if (s.type !== 'review') expect(s.notThis, s.id).toBeTruthy();
      if (s.type === 'understand' || s.type === 'taster') {
        expect(s.lesson?.body.length, s.id).toBeGreaterThan(1);
        expect(s.lesson?.example, s.id).toBeTruthy();
      }
    }
  });
  it('each day type has what it needs', () => {
    const w1 = Object.fromEntries(SESSIONS.filter((s) => s.week === 1).map((s) => [s.type, s]));
    expect(w1.recognise!.recognise).toHaveLength(3);
    expect(w1.rehearse!.phrases!.length).toBeGreaterThanOrEqual(3);
    expect(w1.apply!.apply).toBeTruthy();
    expect(w1.retrieve!.retrieval!.questionIds).toHaveLength(3);
    expect(SCENARIO_BY_ID[w1.retrieve!.retrieval!.scenarioId]).toBeTruthy();
    for (const id of w1.retrieve!.retrieval!.questionIds) expect(RETRIEVAL_BY_ID[id]).toBeTruthy();
  });
  it('recognise items and retrieval questions have feedback for every option, including an explanation for each wrong answer', () => {
    const items = [...SESSIONS.flatMap((s) => s.recognise ?? []), ...RETRIEVAL];
    for (const q of items) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
      expect(q.options.map((o) => o.id), q.id).toContain(q.answerId);
      for (const o of q.options) expect(o.feedback.length, `${q.id}/${o.id}`).toBeGreaterThan(12);
    }
    const levels = new Set(RETRIEVAL.map((q) => q.level));
    expect([...levels].sort()).toEqual(['easy', 'hard', 'medium']);
  });
  it('Day 0 has 12 values and 8–10 baseline items covering all four skills; every domain has plan chips and a suggested plan', () => {
    expect(VALUES).toHaveLength(12);
    expect(BASELINE_ITEMS.length).toBeGreaterThanOrEqual(8);
    expect(BASELINE_ITEMS.length).toBeLessThanOrEqual(10);
    expect(new Set(BASELINE_ITEMS.map((b) => b.domain)).size).toBe(4);
    for (const d of DOMAIN_IDS) {
      expect(PLAN_CHIPS[d].when.length).toBeGreaterThanOrEqual(3);
      expect(PLAN_CHIPS[d].then.length).toBeGreaterThanOrEqual(3);
      expect(PLAN_CHIPS[d].suggested.when).toBeTruthy();
    }
  });
  it('never quotes the source book and never shames', () => {
    const text = JSON.stringify({ SESSIONS, RETRIEVAL, TASTER }).toLowerCase();
    for (const banned of ['be impeccable', 'don\'t take anything personally', 'don\'t make assumptions', 'always do your best', 'failure', 'you failed', 'lazy']) {
      expect(text, banned).not.toContain(banned);
    }
  });
});
