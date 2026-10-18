import type { DomainId } from '../types';

/** Short daily practices (3 to 5 minutes). Each has an explanation, one concrete action and a response prompt. */
export interface DailyPractice {
  id: string;
  domain: DomainId;
  title: string;
  minutes: number;
  explanation: string;
  action: string;
  prompt: string;
}

export const PRACTICES: DailyPractice[] = [
  { id: 'pr-camera-view', domain: 'personalisation', title: 'The camera view', minutes: 4,
    explanation: 'A camera records what happened. It does not record what it meant. Separating the two is often enough to take the heat out of a memory.',
    action: 'Recall one moment from the last day that bothered you. Describe it as a camera would: only what could be seen and heard.',
    prompt: 'Write the camera version, then one sentence about the meaning you added.' },
  { id: 'pr-three-explanations', domain: 'inquiry', title: 'Three explanations', minutes: 3,
    explanation: 'The first explanation that arrives is rarely the only one that fits. Generating alternatives loosens the grip of the first.',
    action: 'Think of someone whose behaviour puzzled or annoyed you recently. List three different explanations that would fit the same facts.',
    prompt: 'Write your three explanations. Which one did you start with?' },
  { id: 'pr-accurate-sentence', domain: 'speech', title: 'The accurate sentence', minutes: 3,
    explanation: 'Harsh self-talk confuses a verdict with a description. Accuracy keeps the facts and drops the verdict.',
    action: 'Catch one critical sentence you said to yourself recently. Rewrite it as a factual description plus one next step.',
    prompt: 'Write the original sentence, then the accurate one.' },
  { id: 'pr-define-done', domain: 'effort', title: 'Define done', minutes: 4,
    explanation: 'Perfectionism has no finish line. Deciding in advance what "good enough for its purpose" means gives effort a place to stop.',
    action: 'Pick one task for today. Write one sentence describing what finished looks like.',
    prompt: 'What does "done" mean for this task today?' },
  { id: 'pr-one-breath', domain: 'personalisation', title: 'One breath', minutes: 3,
    explanation: 'A reaction arrives in under a second. One deliberate breath is often enough to turn it into a response.',
    action: 'Choose a trigger you expect today: a message, a meeting, traffic. Decide now that you will take one breath before responding to it.',
    prompt: 'Name the trigger and what you would like to do after the breath.' },
  { id: 'pr-mine-to-say', domain: 'speech', title: 'Mine to say?', minutes: 4,
    explanation: 'Some true things are not ours to pass on. Checking ownership before speaking protects trust.',
    action: 'Think of something you heard about someone else this week. Ask: is it accurate, is it needed, and is it mine to share?',
    prompt: 'What did you decide, and why?' },
  { id: 'pr-clarifying-question', domain: 'inquiry', title: 'One clarifying question', minutes: 3,
    explanation: 'Ten seconds of asking can replace an evening of guessing.',
    action: 'Find one instruction, message or plan today that is ambiguous. Write the simplest question that would clear it up.',
    prompt: 'Write the question. Will you ask it?' },
  { id: 'pr-smaller-version', domain: 'effort', title: 'The smaller version', minutes: 3,
    explanation: 'On low-energy days, the choice is rarely between everything and nothing. A smaller version keeps the thread unbroken.',
    action: 'Think of one thing you planned but may not have energy for. Design a version that takes a quarter of the time.',
    prompt: 'What is the smaller version?' },
  { id: 'pr-kind-no', domain: 'speech', title: 'A short, kind no', minutes: 4,
    explanation: 'A boundary does not need a long justification. Drafting it in advance makes it easier to say calmly.',
    action: 'Think of a request you would like to decline. Write a no in one or two sentences, without apology or accusation.',
    prompt: 'Write your sentence.' },
  { id: 'pr-what-i-know', domain: 'inquiry', title: 'Known and assumed', minutes: 4,
    explanation: 'Worry often treats an imagined future as already true. Writing down what you actually know brings you back.',
    action: 'Take one current worry. Split it into two lists: what I know, and what I am assuming.',
    prompt: 'Write both lists. How long is each?' },
  { id: 'pr-not-about-me', domain: 'personalisation', title: 'Not about me', minutes: 3,
    explanation: 'Other people act from inside their own day. Remembering this is not excusing behaviour; it is seeing it more accurately.',
    action: 'Recall a recent moment when someone was short or distant with you. Write what might have been going on in their day.',
    prompt: 'What else might have been true for them?' },
  { id: 'pr-recovery-step', domain: 'effort', title: 'The recovery step', minutes: 4,
    explanation: 'After a mistake or a lapse, the useful question is not "why did I fail?" but "what would help next time?"',
    action: 'Think of something that did not go as planned recently. Name one condition that contributed and one small adjustment.',
    prompt: 'What contributed, and what will you adjust?' },
];

export const PRACTICE_BY_ID: Record<string, DailyPractice> = Object.fromEntries(PRACTICES.map((p) => [p.id, p]));
