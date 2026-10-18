import type { DomainId, IntentionCategory } from '../types';

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  question: string;
  description: string;
  /** How Equanim's domain relates to the source's broad theme, in Equanim's own words. */
  relation: string;
  /** What the domain is not, so it is never used to suppress emotion, avoid conflict or remove accountability. */
  notThis: string;
}

export const DOMAINS: Record<DomainId, Domain> = {
  speech: {
    id: 'speech',
    name: 'Integrity of Speech',
    short: 'Saying what is true, needed and yours to say',
    question: 'Is what I am about to say accurate, useful and mine to say?',
    description:
      'Words leave the mouth quickly and stay in the room for a long time. This area is about noticing what you say to others and to yourself, and letting speech match what you actually mean.',
    relation: 'Equanim\u2019s interpretation of the book\u2019s broad theme of using words with care. The practice here is Equanim\u2019s own.',
    notThis: 'Integrity is not the same as disclosing everything, and honesty is not a licence for harshness.',
  },
  personalisation: {
    id: 'personalisation',
    name: 'Freedom from Personalisation',
    short: 'Separating what happened from the meaning added',
    question: 'What did I actually observe, and what meaning did I add to it?',
    description:
      'Much of what stings is not the event but the meaning that arrives with it. This area is about noticing when other people\u2019s moods, words or silences say more about their day than about your worth.',
    relation: 'Equanim\u2019s interpretation of the book\u2019s broad theme about not making other people\u2019s actions into statements about yourself.',
    notThis: 'Not personalising is not the same as tolerating mistreatment. Harm can still be named and addressed.',
  },
  inquiry: {
    id: 'inquiry',
    name: 'The Discipline of Inquiry',
    short: 'Checking the story before acting on it',
    question: 'What am I treating as known that I have not checked?',
    description:
      'The mind dislikes gaps and fills them with stories, often the worst available. This area is about catching the leap from a few facts to a firm conclusion, and asking instead of guessing.',
    relation: 'Equanim\u2019s interpretation of the book\u2019s broad theme about assumptions, extended into practical methods for asking better questions.',
    notThis: 'Inquiry is not the same as ignoring evidence. Sometimes the facts do support the conclusion.',
  },
  effort: {
    id: 'effort',
    name: 'Sincere Effort',
    short: 'Doing what is possible today, without demanding perfection',
    question: 'What would a sincere effort look like with the energy I actually have today?',
    description:
      'A sincere effort changes with the day. Tired days have a smaller best than rested ones. This area is about showing up honestly, stopping at good enough when that is wise, and treating a hard day as information rather than a verdict.',
    relation: 'Equanim\u2019s interpretation of the book\u2019s broad theme of doing one\u2019s best, with an emphasis on realistic effort and recovery.',
    notThis: 'Sincere effort is not overwork, and it does not remove responsibility for what was promised.',
  },
};

export const DOMAIN_LIST: Domain[] = [DOMAINS.speech, DOMAINS.personalisation, DOMAINS.inquiry, DOMAINS.effort];

export interface IntentionOption {
  id: Exclude<IntentionCategory, 'custom'>;
  label: string;
  domain: DomainId | null;
  example: string;
}

export const INTENTION_OPTIONS: IntentionOption[] = [
  { id: 'speak-carefully', label: 'Speak carefully', domain: 'speech', example: 'Before an important sentence today, check that it is accurate and mine to say.' },
  { id: 'separate-observation', label: 'Separate observation from interpretation', domain: 'personalisation', example: 'When something stings, name what happened before naming what it meant.' },
  { id: 'ask-before-assuming', label: 'Ask before assuming', domain: 'inquiry', example: 'Ask one clarifying question instead of guessing what someone meant.' },
  { id: 'pause-before-responding', label: 'Pause before responding', domain: null, example: 'Take one breath before replying to anything that irritates me.' },
  { id: 'sincere-effort', label: 'Make a sincere effort without demanding perfection', domain: 'effort', example: 'Decide what "good enough" means for one task, and stop there.' },
];
