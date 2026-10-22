import type { DomainId } from '../types';
import { RETRIEVAL_MORE } from './programme/retrieval-more';
import { WEEK2, WEEK3, WEEK4, WEEK5, WEEK6 } from './programme/weeks';
export { PHRASE_BANKS, PHRASE_BANK_BY_ID, type PhraseBank } from './programme/phrases';
export { MICRO_CHECKS, THINK_RESPONSES } from './programme/checks';
export { INTEGRATION, INTEGRATION_BY_ID, type IntegrationScenario } from './programme/integration';
import { DOMAINS } from './domains';

/**
 * The 6-week programme, as data. The engine (src/engine/programme.ts) works for all six weeks. Week 0 and Week 1
 * live here; Weeks 2–6, phrase banks, integration scenarios and the extra retrieval questions live in
 * src/data/programme/. A session marked `available: false` would be shown as "arrives in a later update".
 * All wording is Equanim's own.
 */

export type SessionType = 'taster' | 'understand' | 'recognise' | 'rehearse' | 'apply' | 'retrieve' | 'review' | 'integrate' | 'consolidate';

export interface ReflectPrompt { id: string; label: string; hint?: string }

export interface Choice { id: string; text: string; feedback: string }

/** Spot-the-pattern item: a short situation and a question with feedback for every option. */
export interface RecogniseItem { id: string; situation: string; question: string; options: Choice[]; answerId: string }

/** Retrieval question. Every option carries an explanation, so a wrong answer always teaches something. */
export interface RetrievalQuestion {
  id: string;
  domain: DomainId;
  level: 'easy' | 'medium' | 'hard';
  question: string;
  options: Choice[];
  answerId: string;
}

export interface SessionDef {
  id: string;
  week: number;
  /** Day within the week, 1–6. Day 7 is rest and has no session. */
  day: number;
  type: SessionType;
  domain: DomainId | null;
  title: string;
  minutes: number;
  /** False until the session's content ships (Weeks 2–6 arrive in a later update). */
  available: boolean;
  intro?: string;
  lesson?: { body: string[]; example: string };
  /** Shown in every lesson: what this skill is not. */
  notThis?: string;
  recognise?: RecogniseItem[];
  phrases?: string[];
  rehearse?: string;
  apply?: { explain: string };
  retrieval?: { questionIds: string[]; scenarioId: string };
  /** Phrase bank ids (see programme/phrases.ts). */
  banks?: string[];
  /** Week 5 mixed situations (see programme/integration.ts). */
  integration?: string[];
  /** Show the user's three values with their sentences. */
  showValues?: boolean;
  /** Week 6 steps with their own screens or content. */
  special?: 'baseline-finish' | 'compare' | 'evidence' | 'maintenance';
  prompts?: ReflectPrompt[];
}

export interface WeekDef { week: number; title: string; domain: DomainId | null; summary: string }

export const WEEKS: WeekDef[] = [
  { week: 1, title: DOMAINS.personalisation.name, domain: 'personalisation', summary: 'Separating what happened from the meaning added to it.' },
  { week: 2, title: DOMAINS.inquiry.name, domain: 'inquiry', summary: 'Checking the story before acting on it.' },
  { week: 3, title: DOMAINS.speech.name, domain: 'speech', summary: 'Saying what is true, needed and yours to say.' },
  { week: 4, title: DOMAINS.effort.name, domain: 'effort', summary: 'Doing what is possible today, without demanding perfection.' },
  { week: 5, title: 'Integration', domain: null, summary: 'Using the four skills together in harder, mixed situations.' },
  { week: 6, title: 'Consolidate', domain: null, summary: 'Looking back at where you started, and planning how to keep going.' },
];

export const DAY_TYPES: Record<number, { type: SessionType; label: string; minutes: number }> = {
  1: { type: 'understand', label: 'Understand', minutes: 6 },
  2: { type: 'recognise', label: 'Recognise', minutes: 7 },
  3: { type: 'rehearse', label: 'Rehearse', minutes: 7 },
  4: { type: 'apply', label: 'Apply', minutes: 6 },
  5: { type: 'retrieve', label: 'Retrieve and extend', minutes: 8 },
  6: { type: 'review', label: 'Weekly review', minutes: 12 },
};

// ---------------------------------------------------------------------------------------------
// Week 0 · Day 0
// ---------------------------------------------------------------------------------------------

export const VALUES: { id: string; label: string }[] = [
  { id: 'honesty', label: 'Honesty' }, { id: 'calm', label: 'Calm' }, { id: 'courage', label: 'Courage' },
  { id: 'kindness', label: 'Kindness' }, { id: 'growth', label: 'Growth' }, { id: 'reliability', label: 'Reliability' },
  { id: 'curiosity', label: 'Curiosity' }, { id: 'fairness', label: 'Fairness' }, { id: 'humility', label: 'Humility' },
  { id: 'freedom', label: 'Freedom' }, { id: 'connection', label: 'Connection' }, { id: 'health', label: 'Health' },
];
export const VALUE_BY_ID: Record<string, string> = Object.fromEntries(VALUES.map((v) => [v.id, v.label]));
export const VALUE_SENTENCE_PROMPT = 'What would living this look like on an ordinary day?';

/** Self-ratings, 1 (rarely) to 5 (almost always). Not a validated instrument: a private snapshot to compare against later. */
export const BASELINE_ITEMS: { id: string; domain: DomainId; text: string }[] = [
  { id: 'b-p1', domain: 'personalisation', text: 'When someone is short with me, I can see it may be about their day, not about me.' },
  { id: 'b-p2', domain: 'personalisation', text: 'I can describe what happened separately from what I felt it meant.' },
  { id: 'b-p3', domain: 'personalisation', text: 'Criticism of my work stings, but it does not decide my worth.' },
  { id: 'b-i1', domain: 'inquiry', text: 'I ask a clarifying question before I act on a guess.' },
  { id: 'b-i2', domain: 'inquiry', text: 'I can tell what I know from what I am assuming.' },
  { id: 'b-s1', domain: 'speech', text: 'What I say matches what I actually mean.' },
  { id: 'b-s2', domain: 'speech', text: 'I talk to myself about mistakes in an accurate, not harsh, way.' },
  { id: 'b-s3', domain: 'speech', text: 'I can say no clearly without a long justification.' },
  { id: 'b-e1', domain: 'effort', text: 'I can decide what "good enough" means and stop there.' },
  { id: 'b-e2', domain: 'effort', text: 'After a hard day, I return to what matters without beating myself up.' },
];
export const RATING_LABELS = ['Rarely', 'Sometimes', 'About half the time', 'Often', 'Almost always'];
export const BASELINE_SITUATIONS: ReflectPrompt[] = [
  { id: 'situation-1', label: 'Describe a recent situation that bothered you more than you would have liked.', hint: 'A sentence or two is enough.' },
  { id: 'situation-2', label: 'What would handling a situation like that well look like for you?' },
];

// ---------------------------------------------------------------------------------------------
// If-then plans and the evening check
// ---------------------------------------------------------------------------------------------

export const PLAN_CHIPS: Record<DomainId, { when: string[]; then: string[]; suggested: { when: string; then: string } }> = {
  personalisation: {
    when: ['someone replies with one word', 'I get feedback on my work', 'someone cancels on me', 'a family member compares me'],
    then: ['write down only what happened, before what it meant', 'take one breath and name one other explanation', 'ask myself: what else might be true for them?', 'wait ten minutes before replying'],
    suggested: { when: 'someone replies with one word', then: 'write down only what happened, before what it meant' },
  },
  inquiry: {
    when: ['a message is unclear', 'I start to worry about a plan', 'I hear something second-hand'],
    then: ['ask one clarifying question', 'list what I know and what I am assuming', 'check before I repeat it'],
    suggested: { when: 'a message is unclear', then: 'ask one clarifying question' },
  },
  speech: {
    when: ['I am about to complain about someone', 'I make a mistake', 'someone asks for a favour I cannot do'],
    then: ['check: is it accurate, needed and mine to say?', 'describe it to myself as a fact plus a next step', 'say a short, kind no'],
    suggested: { when: 'I make a mistake', then: 'describe it to myself as a fact plus a next step' },
  },
  effort: {
    when: ['I start a task I care about', 'I feel too tired to do everything', 'something goes wrong'],
    then: ['write one sentence about what "done" means', 'do the smaller version', 'name one thing that helped and one adjustment'],
    suggested: { when: 'I feel too tired to do everything', then: 'do the smaller version' },
  },
};

export const OUTCOME_LABELS = {
  'not-came-up': 'It didn’t come up',
  tried: 'I tried it',
  'didnt-manage': 'I didn’t manage it',
} as const;

/** Warm, practical response after "I didn't manage it". Information, not a verdict. */
export const DIDNT_MANAGE_RESPONSE = [
  'That is useful information, not a verdict. Most plans miss a few times before they start to land.',
  'Two small adjustments often help: make the "when" more specific (a place or a time), or make the "I will" smaller, something you could do even on a rushed day.',
];

export const EVENING_QUESTION = 'Did the moment come up? What did you do?';

// ---------------------------------------------------------------------------------------------
// Weekly review
// ---------------------------------------------------------------------------------------------

export const REVIEW_PROMPTS: ReflectPrompt[] = [
  { id: 'worked', label: 'What worked this week?', hint: 'Even something small counts.' },
  { id: 'gotInWay', label: 'What got in the way?' },
  { id: 'noticed', label: 'What did I notice about myself?' },
];

// ---------------------------------------------------------------------------------------------
// Retrieval questions (Week 1: Freedom from Personalisation)
// ---------------------------------------------------------------------------------------------

const RETRIEVAL_W1: RetrievalQuestion[] = [
  {
    id: 'rq-p-1', domain: 'personalisation', level: 'easy',
    question: 'Your colleague replies "ok." to a long message. Which of these is the observation, not the meaning?',
    options: [
      { id: 'a', text: 'She replied with one word.', feedback: 'Yes. A camera could record this. Everything else is meaning added afterwards.' },
      { id: 'b', text: 'She is annoyed with me.', feedback: 'This is a possible meaning, not something you observed. She may simply be busy.' },
      { id: 'c', text: 'She did not read it properly.', feedback: 'This is a guess about what happened in her head. The observation is only the reply itself.' },
    ],
    answerId: 'a',
  },
  {
    id: 'rq-p-2', domain: 'personalisation', level: 'easy',
    question: 'What is the first step of the "camera view"?',
    options: [
      { id: 'a', text: 'Decide whether the other person was wrong.', feedback: 'Judging comes later, if at all. The first step only describes.' },
      { id: 'b', text: 'Describe only what could be seen and heard.', feedback: 'Right. Facts first, meaning second.' },
      { id: 'c', text: 'Tell yourself it does not matter.', feedback: 'The aim is not to dismiss what you feel. It is to see the event and the meaning separately.' },
    ],
    answerId: 'b',
  },
  {
    id: 'rq-p-3', domain: 'personalisation', level: 'medium',
    question: 'A friend cancels plans at the last minute. Which thought adds the most meaning to the facts?',
    options: [
      { id: 'a', text: '"She cancelled an hour before."', feedback: 'This one sticks to the facts. It is the observation.' },
      { id: 'b', text: '"Something may have come up for her."', feedback: 'This is an alternative explanation. It is a meaning too, but a more open one.' },
      { id: 'c', text: '"I am never a priority for anyone."', feedback: 'Yes. One cancellation has become a statement about your worth and about everyone. That is a large jump from the facts.' },
    ],
    answerId: 'c',
  },
  {
    id: 'rq-p-4', domain: 'personalisation', level: 'medium',
    question: 'Which of these is NOT what this skill asks of you?',
    options: [
      { id: 'a', text: 'Separating what happened from what you felt it meant.', feedback: 'This is exactly what the skill asks.' },
      { id: 'b', text: 'Putting up with being treated badly.', feedback: 'Correct. Not personalising never means tolerating mistreatment. Harm can still be named and addressed.' },
      { id: 'c', text: 'Considering what might be going on in the other person’s day.', feedback: 'This is part of the skill: seeing their behaviour more accurately, not excusing it.' },
    ],
    answerId: 'b',
  },
  {
    id: 'rq-p-5', domain: 'personalisation', level: 'hard',
    question: 'Your manager points out an error in front of others. You feel your face go hot. What is the most useful first move?',
    options: [
      { id: 'a', text: 'Notice the heat and name the facts to yourself: "one error was pointed out in a meeting."', feedback: 'Yes. Naming the body’s reaction and the bare facts gives you a moment of choice before the story takes over.' },
      { id: 'b', text: 'Decide she is trying to embarrass you.', feedback: 'That may or may not be true, but deciding it now closes the question before you have any evidence.' },
      { id: 'c', text: 'Pretend it did not bother you.', feedback: 'Suppressing the feeling tends to make it louder later. You can feel it and still respond deliberately.' },
    ],
    answerId: 'a',
  },
  {
    id: 'rq-p-6', domain: 'personalisation', level: 'hard',
    question: 'You took something personally and only noticed an hour later. What does that mean?',
    options: [
      { id: 'a', text: 'The practice is not working for you.', feedback: 'Noticing afterwards is the usual first stage. The gap between reaction and noticing tends to shrink with practice.' },
      { id: 'b', text: 'You noticed. That is the skill beginning.', feedback: 'Yes. Noticing later still lets you check the story, and it is how noticing sooner develops.' },
      { id: 'c', text: 'You should have stayed calm in the moment.', feedback: '"Should have" turns information into a verdict. A more useful question: what would help me notice a little sooner?' },
    ],
    answerId: 'b',
  },
];
export const RETRIEVAL: RetrievalQuestion[] = [...RETRIEVAL_W1, ...RETRIEVAL_MORE];
export const RETRIEVAL_BY_ID: Record<string, RetrievalQuestion> = Object.fromEntries(RETRIEVAL.map((q) => [q.id, q]));

// ---------------------------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------------------------

const P = DOMAINS.personalisation;

/** The 2-minute taster offered on the welcome screen. Not part of the 6-week order. */
export const TASTER: SessionDef = {
  id: 'taster', week: 0, day: 0, type: 'taster', domain: 'personalisation', title: 'The camera view', minutes: 2, available: true,
  intro: 'A two-minute taste of how Equanim works.',
  lesson: {
    body: [
      'Much of what stings is not the event but the meaning that arrives with it, often within a second.',
      'A camera records what happened. It does not record what it meant. Separating the two is often enough to take some heat out of a moment.',
    ],
    example: 'Event: "My friend didn’t reply all day." Meaning added: "She’s upset with me."',
  },
  notThis: P.notThis,
  prompts: [{ id: 'camera', label: 'Recall one small moment from the last day that bothered you. What would a camera have recorded?', hint: 'Only what could be seen and heard.' }],
};

const week1: SessionDef[] = [
  {
    id: 'w1d1', week: 1, day: 1, type: 'understand', domain: 'personalisation', title: 'What happened, and what it meant', minutes: 6, available: true,
    intro: 'This week is about one skill: noticing the meaning you add to events, so you can choose what to do with it.',
    lesson: {
      body: [
        'Something happens: a short reply, a look, a missed call. Within a second, a meaning arrives with it: "they’re annoyed", "I’ve done something wrong", "I don’t matter to them".',
        'The meaning feels like part of the event. It isn’t. It is your mind filling a gap quickly, usually with the explanation that hurts most.',
        'Freedom from personalisation means pulling the two apart: first what happened, then what you made it mean. Once they are separate, you can ask whether the meaning fits the facts, and what else might be true.',
      ],
      example: 'Your sister doesn’t comment on the photos you shared in the family group. Event: "No comment on my photos yet." Meaning added: "She doesn’t care about my life." Other possibilities: she hasn’t opened the chat, she’s travelling, she saw them and meant to reply later.',
    },
    notThis: P.notThis,
    prompts: [
      { id: 'event', label: 'Think of one recent moment that stung. What happened, as a camera would record it?' },
      { id: 'meaning', label: 'What meaning did you add to it?' },
    ],
  },
  {
    id: 'w1d2', week: 1, day: 2, type: 'recognise', domain: 'personalisation', title: 'Spot the added meaning', minutes: 7, available: true,
    intro: 'Three short situations. In each one, find the part that was added, not observed.',
    notThis: P.notThis,
    recognise: [
      {
        id: 'r1', situation: 'Your neighbour walks past you in the lift lobby without saying hello.',
        question: 'Which thought is added meaning?',
        options: [
          { id: 'a', text: 'He didn’t say hello.', feedback: 'This is the observation: what a camera would show.' },
          { id: 'b', text: 'He’s still angry about the parking.', feedback: 'Yes. That is a story about his reasons. He may have been on the phone, or lost in thought.' },
          { id: 'c', text: 'He was walking quickly.', feedback: 'This is also an observation. It might even explain the missed hello.' },
        ],
        answerId: 'b',
      },
      {
        id: 'r2', situation: 'In a team chat, your suggestion gets no replies, and the next message changes the topic.',
        question: 'Which thought is added meaning?',
        options: [
          { id: 'a', text: 'Nobody replied to my message.', feedback: 'This is the observation.' },
          { id: 'b', text: 'The next message was about something else.', feedback: 'Also an observation.' },
          { id: 'c', text: 'They think my ideas are useless.', feedback: 'Yes. That is a conclusion about what everyone thinks, drawn from silence. Silence in group chats has many causes.' },
        ],
        answerId: 'c',
      },
      {
        id: 'r3', situation: 'Your father says, "You look tired," when you visit.',
        question: 'Which response separates event from meaning?',
        options: [
          { id: 'a', text: '"He said I look tired. I heard it as criticism; he may have meant concern."', feedback: 'Yes. You have named the event, the meaning you heard, and another possibility.' },
          { id: 'b', text: '"He always finds something wrong with me."', feedback: 'This turns one sentence into a pattern about his view of you. It may be worth checking against the facts.' },
          { id: 'c', text: '"It doesn’t matter what he says."', feedback: 'Dismissing it can feel safer, but it skips the step of seeing what actually happened.' },
        ],
        answerId: 'a',
      },
    ],
    prompts: [{ id: 'own', label: 'Where did you add meaning to something today or yesterday?' }],
  },
  {
    id: 'w1d3', week: 1, day: 3, type: 'rehearse', domain: 'personalisation', title: 'Words for the moment', minutes: 7, available: true,
    intro: 'When the sting arrives, it helps to have a few words ready. Practise them now, when the stakes are low.',
    notThis: P.notThis,
    banks: ['pb-p-moment'],
    rehearse: 'Pick the phrase that feels most natural. Say it quietly aloud three times, or write it in your own words. Then imagine using it in a situation from this week.',
    prompts: [
      { id: 'phrase', label: 'Which phrase will you keep, in your own words?' },
      { id: 'where', label: 'Where might you use it this week?' },
    ],
  },
  {
    id: 'w1d4', week: 1, day: 4, type: 'apply', domain: 'personalisation', title: 'A small experiment', minutes: 6, available: true,
    intro: 'Today you will make a plan for one real moment. Plans that name when and where are much easier to follow than general intentions.',
    notThis: P.notThis,
    apply: { explain: 'Choose a moment that is likely to happen today or tomorrow, and one small thing you will do when it does. Keep it small enough to do on a rushed day.' },
    prompts: [{ id: 'expect', label: 'What do you expect will be hard about it?' }],
  },
  {
    id: 'w1d5', week: 1, day: 5, type: 'retrieve', domain: 'personalisation', title: 'Remember, then stretch', minutes: 8, available: true,
    intro: 'Recalling what you learned, without looking, helps it stay. Then try a harder situation.',
    notThis: P.notThis,
    retrieval: { questionIds: ['rq-p-1', 'rq-p-3', 'rq-p-5'], scenarioId: 'p-meeting-critique' },
    prompts: [{ id: 'stretch', label: 'In the harder scenario, what was the first meaning you noticed yourself adding?' }],
  },
  {
    id: 'w1d6', week: 1, day: 6, type: 'review', domain: 'personalisation', title: 'Week 1 review', minutes: 12, available: true,
    intro: 'Look back at the week. There are no right answers, and a hard week is as useful to review as an easy one.',
  },
];

export const SESSIONS: SessionDef[] = [...week1, ...WEEK2, ...WEEK3, ...WEEK4, ...WEEK5, ...WEEK6];
export const SESSION_BY_ID: Record<string, SessionDef> = Object.fromEntries([TASTER, ...SESSIONS].map((s) => [s.id, s]));

/** Day 0 is two steps (values, then baseline); it counts as the first completed session. */
export const DAY0_ID = 'w0d0';

export const INDEPENDENCE_TEXT = [
  'Equanim’s broad themes are inspired by Don Miguel Ruiz’s book The Four Agreements. Everything in the app is original writing. Equanim does not reproduce or summarise the book, and it is independent: not endorsed by or affiliated with the author or publisher.',
  'Equanim is not therapy, and it does not diagnose or treat anything. If you are in danger, or thinking about harming yourself, please reach out now: in India, call 112 for emergencies, or Tele-MANAS on 14416 or 1-800-891-4416.',
];
export const SAFETY_LINE = 'Not a crisis service. In India: emergencies 112 · Tele-MANAS 14416 or 1-800-891-4416.';
