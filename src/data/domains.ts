import type { DomainId } from '../lib/types';

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  question: string;
  description: string;
  intentionIdeas: string[];
}

export const DOMAINS: Record<DomainId, Domain> = {
  words: {
    id: 'words',
    name: 'Words',
    short: 'Speaking with care and integrity',
    question: 'Is what I am about to say true, needed and mine to say?',
    description:
      'Words leave the mouth quickly and stay in the room for a long time. This domain is about noticing what you say to others and to yourself, and letting speech match what you actually mean.',
    intentionIdeas: [
      'Before agreeing to something today, pause and check whether I can really do it.',
      'Speak about people as if they could hear me.',
      'Notice one harsh sentence I say to myself and restate it accurately.',
      'Say a clear no once today, kindly, without a long excuse.',
    ],
  },
  perspective: {
    id: 'perspective',
    name: 'Perspective',
    short: 'Separating what happened from the meaning added',
    question: 'What did I actually observe, and what meaning did I add to it?',
    description:
      'Much of what stings is not the event but the meaning that arrives with it. This domain is about noticing when other people\u2019s moods, words or silences say more about their day than about your worth.',
    intentionIdeas: [
      'When someone is short with me, look for one explanation that is not about me.',
      'Notice praise and criticism landing, and let both pass through a little more lightly.',
      'Once today, write down only the facts of a situation that bothered me.',
      'When I feel stung, name the feeling before I answer.',
    ],
  },
  assumptions: {
    id: 'assumptions',
    name: 'Assumptions',
    short: 'Checking the story before acting on it',
    question: 'What am I treating as known that I have not checked?',
    description:
      'The mind dislikes gaps and fills them with stories, often the worst available. This domain is about catching the leap from a few facts to a firm conclusion, and asking instead of guessing.',
    intentionIdeas: [
      'Ask one clarifying question instead of guessing what someone meant.',
      'When I notice a worst-case story, list two other possibilities.',
      'Say plainly what I need instead of expecting someone to know.',
      'Hold one conclusion about someone loosely until I have more information.',
    ],
  },
  effort: {
    id: 'effort',
    name: 'Effort',
    short: 'Doing what is possible today, without demanding perfection',
    question: 'What would a sincere effort look like with the energy I actually have today?',
    description:
      'A sincere effort changes with the day. Tired days have a smaller best than rested ones. This domain is about showing up honestly, stopping at good enough when that is wise, and treating a hard day as information rather than a verdict.',
    intentionIdeas: [
      'Choose one task and decide in advance what "done" looks like.',
      'On a low-energy moment, do a smaller version instead of nothing.',
      'Rest once today without apologising for it.',
      'After a mistake, name one thing I will adjust, then move on.',
    ],
  },
};

export const DOMAIN_LIST: Domain[] = [DOMAINS.words, DOMAINS.perspective, DOMAINS.assumptions, DOMAINS.effort];

export const DOMAIN_TEXT_CLASS: Record<DomainId, string> = {
  words: 'text-words',
  perspective: 'text-perspective',
  assumptions: 'text-assumptions',
  effort: 'text-effort',
};
export const DOMAIN_BG_CLASS: Record<DomainId, string> = {
  words: 'bg-words',
  perspective: 'bg-perspective',
  assumptions: 'bg-assumptions',
  effort: 'bg-effort',
};
