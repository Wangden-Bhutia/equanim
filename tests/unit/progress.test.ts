import { describe, expect, it } from 'vitest';
import { emptyData } from '../../src/storage/schema';
import { computeProgress, computeStreak, practiceForDay, suggestScenarioId } from '../../src/engine/progress';
import { SCENARIOS } from '../../src/data/scenarios';
import { PRACTICE_BY_ID } from '../../src/data/practices';
import { LIBRARY } from '../../src/data/library';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).toISOString();

describe('progress', () => {
  it('shows nothing for a new user', () => {
    const p = computeProgress(emptyData());
    expect(p.hasAnyRecord).toBe(false);
    expect(p.scenariosCompleted).toBe(0);
    expect(p.activeDaysLast14).toBe(0);
    expect(p.daysEngaged).toBe(0);
  });
  it('derives every metric only from real records', () => {
    const d = emptyData();
    d.attempts.push(
      { id: '1', scenarioId: 'w-saturday-move', optionId: 'a', at: at(2026, 10, 16) },
      { id: '2', scenarioId: 'w-saturday-move', optionId: 'c', at: at(2026, 10, 16) },
      { id: '3', scenarioId: 'p-traffic-horn', optionId: 'b', at: at(2026, 10, 18) },
    );
    d.completions.push(
      { id: 'c1', scenarioId: 'w-saturday-move', at: at(2026, 10, 16), optionIds: ['a', 'c'], note: '' },
      { id: 'c2', scenarioId: 'w-saturday-move', at: at(2026, 10, 17), optionIds: ['a'], note: '' },
      { id: 'c3', scenarioId: 'p-traffic-horn', at: at(2026, 10, 18), optionIds: ['b'], note: '' },
      { id: 'c4', scenarioId: 'removed-scenario', at: at(2026, 10, 18), optionIds: ['a'], note: '' },
    );
    d.practices.push({ id: 'p', practiceId: Object.keys(PRACTICE_BY_ID)[0]!, date: '2026-10-18', response: '', completedAt: at(2026, 10, 18) });
    d.intentions.push({ id: 'i', date: '2026-10-18', category: 'speak-carefully', domain: 'speech', text: 'x', createdAt: at(2026, 10, 18), updatedAt: at(2026, 10, 18) });
    d.reflections.push({ id: 'r', date: '2026-10-18', happened: 'h', initial: '', did: '', alternative: '', nextTime: '', createdAt: at(2026, 10, 18, 21), updatedAt: at(2026, 10, 18, 21) });
    d.journal.push(
      { id: 'j1', type: 'incident', answers: { facts: 'a' }, domain: null, scenarioId: null, themes: ['work', 'Tone'], createdAt: at(2026, 10, 17), updatedAt: at(2026, 10, 17) },
      { id: 'j2', type: 'daily', answers: { learned: 'b' }, domain: null, scenarioId: null, themes: ['tone'], createdAt: at(2026, 10, 18), updatedAt: at(2026, 10, 18) },
    );
    d.library.push(
      { itemId: LIBRARY[0]!.id, kind: 'opened', at: at(2026, 10, 18) },
      { itemId: LIBRARY[1]!.id, kind: 'completed', at: at(2026, 10, 18) },
      { itemId: LIBRARY[1]!.id, kind: 'exercise', at: at(2026, 10, 18) },
    );
    const p = computeProgress(d, new Date(2026, 9, 18, 22));
    expect(p.scenariosCompleted).toBe(2); // the removed scenario is ignored
    expect(p.scenariosTotal).toBe(SCENARIOS.length);
    expect(p.scenarioRevisits).toBe(1);
    expect(p.scenarioAttempts).toBe(3);
    expect(p.practicesCompleted).toBe(1);
    expect(p.domainParticipation.speech).toBeGreaterThanOrEqual(1);
    expect(p.domainParticipation.personalisation).toBeGreaterThanOrEqual(1);
    expect(p.intentionsSet).toBe(1);
    expect(p.reflectionsRecorded).toBe(1);
    expect(p.journalByType).toEqual({ incident: 1, daily: 1, free: 0 });
    expect(p.recurringThemes[0]).toEqual({ theme: 'Tone', count: 2 });
    expect(p.readingsCompleted).toBe(1); // opening is not completing
    expect(p.readingsTotal).toBe(LIBRARY.length);
    expect(p.exercisesTried).toBe(1);
    expect(p.activeDaysLast14).toBe(3);
    expect(p.daysEngaged).toBe(3);
    expect(p.last14.at(-1)).toEqual({ date: '2026-10-18', active: true });
    expect(p.recentReflections[0]!.id).toBe('r');
  });
});

describe('streaks', () => {
  it('does not break before today is over', () => {
    expect(computeStreak(new Set(['2026-10-15', '2026-10-16', '2026-10-17']), '2026-10-18')).toEqual({ current: 3, longest: 3 });
  });
  it('resets after a missed day without touching the longest run', () => {
    expect(computeStreak(new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-18']), '2026-10-18')).toEqual({ current: 1, longest: 4 });
  });
});

describe('suggestions', () => {
  it('scenario of the day prefers uncompleted scenarios in the intention’s domain', () => {
    const id = suggestScenarioId(emptyData(), 'effort', 3);
    expect(SCENARIOS.find((s) => s.id === id)!.domain).toBe('effort');
  });
  it('still suggests something when everything is completed', () => {
    const d = emptyData();
    SCENARIOS.forEach((s, i) => d.completions.push({ id: String(i), scenarioId: s.id, at: new Date().toISOString(), optionIds: ['a'], note: '' }));
    expect(suggestScenarioId(d, null, 5)).toBeTruthy();
  });
  it('daily practice rotates and follows the domain', () => {
    expect(PRACTICE_BY_ID[practiceForDay('inquiry', 4)]!.domain).toBe('inquiry');
    expect(practiceForDay(null, 1)).not.toBe(practiceForDay(null, 2));
  });
});
