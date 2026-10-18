import type { JournalType } from '../types';

export interface JournalQuestion { key: string; label: string; hint?: string }
export interface JournalTypeDef { id: JournalType; name: string; description: string; questions: JournalQuestion[] }

export const JOURNAL_TYPES: Record<JournalType, JournalTypeDef> = {
  incident: {
    id: 'incident',
    name: 'Incident reflection',
    description: 'Look closely at one moment that stayed with you.',
    questions: [
      { key: 'facts', label: 'What happened?', hint: 'The observable facts, as a camera would record them.' },
      { key: 'interpretation', label: 'What did I interpret or assume?' },
      { key: 'emotion', label: 'What emotion or impulse arose?' },
      { key: 'response', label: 'How did I respond?' },
      { key: 'otherExplanation', label: 'What else might explain it?' },
      { key: 'better', label: 'What response would better reflect my values?' },
      { key: 'next', label: 'What, if anything, should I do next?' },
    ],
  },
  daily: {
    id: 'daily',
    name: 'Daily review',
    description: 'A short look back at the day as a whole.',
    questions: [
      { key: 'deliberate', label: 'Where did I respond deliberately today?' },
      { key: 'automatic', label: 'Where did I react automatically?' },
      { key: 'learned', label: 'What did I learn?' },
      { key: 'tomorrow', label: 'One practical intention for tomorrow' },
    ],
  },
  free: {
    id: 'free',
    name: 'Free reflection',
    description: 'Open space for anything you want to write.',
    questions: [{ key: 'text', label: 'Reflection' }],
  },
};

export const JOURNAL_TYPE_LIST = [JOURNAL_TYPES.incident, JOURNAL_TYPES.daily, JOURNAL_TYPES.free];

/** Labels for answer keys carried over from Equanim 1.0 entries. */
/** Equanim 1.0 journal fields without an exact equivalent keep their original key and label, so their meaning does not change. */
export const LEGACY_LABELS: Record<string, string> = { nextTime: 'What I might try next time', note: 'Anything else' };

export function labelFor(type: JournalType, key: string): string {
  return JOURNAL_TYPES[type].questions.find((q) => q.key === key)?.label ?? LEGACY_LABELS[key] ?? key;
}
