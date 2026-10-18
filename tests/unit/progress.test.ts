import { describe, expect, it } from 'vitest';
import { emptyData } from '../../src/lib/schema';
import { computeProgress, computeStreak, suggestScenarioId } from '../../src/lib/progress';
import { SCENARIOS } from '../../src/data/scenarios';

const at = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h).toISOString();

describe('progress', () => {
  it('shows nothing for a new user', () => {
    const p = computeProgress(emptyData());
    expect(p.hasAnyRecord).toBe(false);
    expect(p.scenariosExplored).toBe(0);
    expect(p.activeDaysLast14).toBe(0);
  });
  it('derives counts only from real records', () => {
    const d = emptyData();
    d.attempts.push(
      { id: '1', scenarioId: 'w-saturday-move', optionId: 'a', at: at(2026, 10, 17) },
      { id: '2', scenarioId: 'w-saturday-move', optionId: 'c', at: at(2026, 10, 17) },
      { id: '3', scenarioId: 'p-traffic-horn', optionId: 'b', at: at(2026, 10, 18) },
      { id: '4', scenarioId: 'removed-scenario', optionId: 'a', at: at(2026, 10, 18) },
    );
    d.intentions.push({ id: 'i', date: '2026-10-18', domain: 'words', text: 'x', createdAt: at(2026, 10, 18), updatedAt: at(2026, 10, 18), reflection: { outcome: 'afterwards', note: '', at: at(2026, 10, 18, 21) } });
    const p = computeProgress(d, new Date(2026, 9, 18, 22));
    expect(p.scenariosExplored).toBe(2);
    expect(p.scenariosCompared).toBe(1);
    expect(p.byDomain.words.explored).toBe(1);
    expect(p.byDomain.perspective.explored).toBe(1);
    expect(p.reflections).toBe(1);
    expect(p.outcomes.afterwards).toBe(1);
    expect(p.activeDaysLast14).toBe(2);
    expect(p.last14.at(-1)).toEqual({ date: '2026-10-18', active: true });
  });
});

describe('streaks', () => {
  it('does not break before today is over', () => {
    const days = new Set(['2026-10-15', '2026-10-16', '2026-10-17']);
    expect(computeStreak(days, '2026-10-18')).toEqual({ current: 3, longest: 3 });
  });
  it('resets after a missed day without touching the longest run', () => {
    const days = new Set(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-18']);
    expect(computeStreak(days, '2026-10-18')).toEqual({ current: 1, longest: 4 });
  });
});

describe('suggestion', () => {
  it('prefers unexplored scenarios in the intention\u2019s domain', () => {
    const d = emptyData();
    const id = suggestScenarioId(d, 'effort', 3);
    expect(SCENARIOS.find((s) => s.id === id)!.domain).toBe('effort');
  });
  it('still suggests something when everything is explored', () => {
    const d = emptyData();
    SCENARIOS.forEach((s, i) => d.attempts.push({ id: String(i), scenarioId: s.id, optionId: 'a', at: new Date().toISOString() }));
    expect(suggestScenarioId(d, null, 5)).toBeTruthy();
  });
});
