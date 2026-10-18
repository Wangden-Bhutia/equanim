import { describe, expect, it } from 'vitest';
import { SCENARIOS, SCENARIO_BY_ID, FIRST_SCENARIO_ID } from '../../src/data/scenarios';
import { LIBRARY } from '../../src/data/library';
import { DOMAINS } from '../../src/data/domains';
import { DOMAIN_IDS } from '../../src/lib/types';

describe('scenarios', () => {
  it('has at least 20 scenarios with unique ids', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });
  it('covers all four domains with at least five each', () => {
    for (const d of DOMAIN_IDS) expect(SCENARIOS.filter((s) => s.domain === d).length).toBeGreaterThanOrEqual(5);
  });
  it('every scenario has 3+ options with complete, option-specific feedback', () => {
    for (const s of SCENARIOS) {
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(3);
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length);
      expect(s.situation.length).toBeGreaterThan(60);
      expect(s.reflection.length).toBeGreaterThan(20);
      for (const o of s.options) {
        const f = o.feedback;
        for (const k of ['what', 'protects', 'costs', 'notice'] as const) expect(f[k].trim().length, `${s.id}/${o.id}/${k}`).toBeGreaterThan(5);
        expect(f.what.length + f.costs.length, `${s.id}/${o.id}`).toBeGreaterThan(80);
      }
      // No two options share feedback text: feedback is specific to each choice.
      const whats = s.options.map((o) => o.feedback.what);
      expect(new Set(whats).size).toBe(whats.length);
      const patterns = s.options.map((o) => o.pattern);
      expect(new Set(patterns).size).toBe(patterns.length);
    }
  });
  it('feedback never grades choices as right or wrong', () => {
    const text = JSON.stringify(SCENARIOS).toLowerCase();
    for (const w of ['correct answer', 'wrong answer', 'you failed', 'the right answer', 'your score', 'points']) expect(text).not.toContain(w);
  });
  it('the onboarding scenario exists', () => {
    expect(SCENARIO_BY_ID[FIRST_SCENARIO_ID]).toBeDefined();
  });
});

describe('library', () => {
  it('has four domain sections and seven essays', () => {
    const sections = LIBRARY.filter((l) => l.kind === 'section');
    expect(sections.map((s) => s.domain).sort()).toEqual([...DOMAIN_IDS].sort());
    expect(LIBRARY.filter((l) => l.kind === 'essay').length).toBe(7);
  });
  it('each item has an example, question, exercise and valid linked scenario', () => {
    for (const l of LIBRARY) {
      expect(l.body.length, l.id).toBeGreaterThanOrEqual(3);
      expect(l.example.text.length).toBeGreaterThan(40);
      expect(l.question.endsWith('?')).toBe(true);
      expect(l.exercise.steps.length).toBeGreaterThanOrEqual(3);
      expect(SCENARIO_BY_ID[l.scenarioId], l.id).toBeDefined();
    }
  });
});

describe('intellectual property guard', () => {
  // The four principles from the source book must not be reproduced as app content.
  const forbidden = ['be impeccable with your word', "don't take anything personally", 'don\u2019t take anything personally', "don't make assumptions", 'don\u2019t make assumptions', 'always do your best', 'toltec'];
  it('content does not reproduce the source book\u2019s distinctive formulations', () => {
    const all = JSON.stringify({ SCENARIOS, LIBRARY, DOMAINS }).toLowerCase();
    for (const f of forbidden) expect(all).not.toContain(f);
  });
});
