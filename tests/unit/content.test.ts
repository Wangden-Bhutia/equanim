import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { SCENARIOS, SCENARIO_BY_ID, FIRST_SCENARIO_ID, THEMES, type ThemeId } from '../../src/data/scenarios';
import { LIBRARY } from '../../src/data/library';
import { DOMAINS, DOMAIN_LIST, INTENTION_OPTIONS } from '../../src/data/domains';
import { JOURNAL_TYPES } from '../../src/data/journal';
import { ORIENTATIONS } from '../../src/data/orientation';
import { PRACTICES } from '../../src/data/practices';
import { SECONDARY_NAV, PRIMARY_NAV } from '../../src/components/nav';
import { DOMAIN_IDS } from '../../src/types';

describe('domains and naming', () => {
  it('uses the four specified domain names', () => {
    expect(DOMAIN_LIST.map((d) => d.name)).toEqual(['Integrity of Speech', 'Freedom from Personalisation', 'The Discipline of Inquiry', 'Sincere Effort']);
    for (const d of DOMAIN_LIST) expect(d.notThis.length).toBeGreaterThan(20);
  });
  it('offers the five intention categories', () => {
    expect(INTENTION_OPTIONS.map((o) => o.label)).toEqual([
      'Speak carefully', 'Separate observation from interpretation', 'Ask before assuming', 'Pause before responding', 'Make a sincere effort without demanding perfection',
    ]);
  });
  it('names primary and secondary pages as specified', () => {
    expect(PRIMARY_NAV.map((n) => n.label)).toEqual(['Today', 'Programme', 'Journal', 'Progress']);
    expect(SECONDARY_NAV.map((n) => n.label)).toEqual(['Keep practising', 'About Equanim', 'Practice Framework', 'Evidence and sources', 'Settings and Data', 'Privacy and Storage']);
  });
});

describe('scenarios', () => {
  it('has at least 20 scenarios with unique ids', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });
  it('covers all four domains with at least five each', () => {
    for (const d of DOMAIN_IDS) expect(SCENARIOS.filter((s) => s.domain === d).length).toBeGreaterThanOrEqual(5);
  });
  it('covers every one of the 20 specified themes', () => {
    expect(Object.keys(THEMES)).toHaveLength(20);
    const covered = new Set(SCENARIOS.flatMap((s) => s.themes));
    for (const t of Object.keys(THEMES) as ThemeId[]) expect(covered.has(t), t).toBe(true);
  });
  it('every scenario has the full structure, with option-specific feedback', () => {
    for (const s of SCENARIOS) {
      expect(s.options.length, s.id).toBeGreaterThanOrEqual(3);
      expect(s.options.length, s.id).toBeLessThanOrEqual(4);
      expect(new Set(s.options.map((o) => o.id)).size).toBe(s.options.length);
      expect(s.situation.length).toBeGreaterThan(60);
      expect(s.reflection.length, s.id).toBeGreaterThan(20);
      expect(s.insight.length, s.id).toBeGreaterThan(30);
      expect(s.themes.length, s.id).toBeGreaterThan(0);
      expect(s.options.some((o) => o.feedback.alternative), `${s.id} alternative`).toBe(true);
      for (const o of s.options) {
        const f = o.feedback;
        for (const k of ['what', 'protects', 'costs', 'notice'] as const) expect(f[k].trim().length, `${s.id}/${o.id}/${k}`).toBeGreaterThan(5);
      }
      const whats = s.options.map((o) => o.feedback.what);
      expect(new Set(whats).size).toBe(whats.length);
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

describe('today content', () => {
  it('has rotating orientation prompts and short daily practices', () => {
    expect(ORIENTATIONS.length).toBeGreaterThanOrEqual(14);
    expect(PRACTICES.length).toBeGreaterThanOrEqual(8);
    for (const p of PRACTICES) {
      expect(p.minutes, p.id).toBeGreaterThanOrEqual(3);
      expect(p.minutes, p.id).toBeLessThanOrEqual(5);
    }
    for (const d of DOMAIN_IDS) expect(PRACTICES.some((p) => p.domain === d)).toBe(true);
  });
});

describe('journal', () => {
  it('has the three entry types with the specified questions', () => {
    expect(JOURNAL_TYPES.incident.questions.map((q) => q.label)).toEqual([
      'What happened?', 'What did I interpret or assume?', 'What emotion or impulse arose?', 'How did I respond?', 'What else might explain it?', 'What response would better reflect my values?', 'What, if anything, should I do next?',
    ]);
    expect(JOURNAL_TYPES.daily.questions.map((q) => q.label)).toEqual(['Where did I respond deliberately today?', 'Where did I react automatically?', 'What did I learn?', 'One practical intention for tomorrow']);
    expect(JOURNAL_TYPES.free.questions).toHaveLength(1);
  });
});

describe('library', () => {
  it('has the four specified sections and seven essays with exact titles', () => {
    expect(LIBRARY.filter((l) => l.kind === 'section').map((s) => s.title)).toEqual(['The Integrity of Speech', 'Freedom from Personalisation', 'The Discipline of Inquiry', 'Sincere Effort']);
    expect(LIBRARY.filter((l) => l.kind === 'essay').map((s) => s.title)).toEqual([
      'The Stories We Add to Events', 'The Habit of Defending the Self', 'The Space Between Impulse and Action', 'Listening Without Preparing a Defence',
      'Boundaries, Responsibility and Respect', 'Learning from a Difficult Day', 'Returning to Practice After a Lapse',
    ]);
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
  const forbidden = ['be impeccable with your word', "don't take anything personally", 'don\u2019t take anything personally', "don't make assumptions", 'don\u2019t make assumptions', 'always do your best', 'toltec'];
  it('content does not reproduce the source book’s distinctive formulations', () => {
    const all = JSON.stringify({ SCENARIOS, LIBRARY, DOMAINS, PRACTICES, ORIENTATIONS, JOURNAL_TYPES }).toLowerCase();
    for (const f of forbidden) expect(all).not.toContain(f);
  });
});

describe('GitHub Pages base path', () => {
  it('builds under /equanim/ with relative manifest and icon paths', () => {
    const vite = readFileSync('vite.config.ts', 'utf8');
    expect(vite).toMatch(/base:\s*'\/equanim\/'/);
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as { start_url: string; scope?: string; icons: { src: string }[] };
    expect(manifest.start_url.startsWith('/')).toBe(false);
    for (const i of manifest.icons) expect(i.src.startsWith('/')).toBe(false);
    const html = readFileSync('index.html', 'utf8');
    expect(html).not.toMatch(/href="\/(?!\/)/);
  });
});
