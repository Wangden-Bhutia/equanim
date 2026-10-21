import type { DomainId } from '../../types';

/** Twelve phrase banks, three per skill: short words to have ready for common moments. Original writing. */
export interface PhraseBank { id: string; domain: DomainId; title: string; when: string; phrases: string[] }

export const PHRASE_BANKS: PhraseBank[] = [
  { id: 'pb-p-moment', domain: 'personalisation', title: 'When something stings', when: 'A reply, a look or a silence lands badly.', phrases: [
    'What actually happened here?',
    'That’s one explanation. What are two others?',
    'This might be about their day, not about me.',
    'I can check before I decide what it means.',
    'It stings. I can feel that and still choose what to do next.',
  ] },
  { id: 'pb-p-criticism', domain: 'personalisation', title: 'Hearing criticism', when: 'Someone points out a mistake or a weakness.', phrases: [
    'Thanks. Can you show me the part you mean?',
    'This is about one piece of work, not about all of me.',
    'Let me think about that and come back to you.',
    'Which part of this is useful to me?',
  ] },
  { id: 'pb-p-family', domain: 'personalisation', title: 'Family comparisons', when: 'A relative compares you with someone else.', phrases: [
    'Their worry is speaking. It doesn’t decide who I am.',
    'I’m on my own path, and I’m fine with that.',
    'I hear you. I’m doing it my way for now.',
    'That comparison says more about their hopes than about my worth.',
  ] },
  { id: 'pb-i-clarify', domain: 'inquiry', title: 'Clarifying questions', when: 'A message or request is unclear.', phrases: [
    'When you say “soon”, do you mean today or this week?',
    'Just to check I’ve understood: you’d like…?',
    'What would a good result look like for you?',
    'Is there anything you’re worried about that I should know?',
  ] },
  { id: 'pb-i-check-story', domain: 'inquiry', title: 'Checking the story', when: 'You notice yourself predicting or assuming.', phrases: [
    'What do I actually know here?',
    'What would I expect to see if I were wrong?',
    'Is this a fact, or my guess about a fact?',
    'I don’t know yet, and that’s all right.',
  ] },
  { id: 'pb-i-second-hand', domain: 'inquiry', title: 'Second-hand news', when: 'You hear something about someone through someone else.', phrases: [
    'I’ll wait until I hear it from them.',
    'Do you know that, or is that how it came across?',
    'I’d rather not guess. I’ll ask them directly.',
    'Let’s not decide what they meant without them.',
  ] },
  { id: 'pb-s-no', domain: 'speech', title: 'A clear, kind no', when: 'You are asked for something you can’t or won’t do.', phrases: [
    'I can’t this time, but thank you for asking.',
    'That doesn’t work for me.',
    'I’d rather not, but I hope it goes well.',
    'I can’t do all of it. I can do this part.',
  ] },
  { id: 'pb-s-raise', domain: 'speech', title: 'Raising a problem', when: 'Something needs saying, and you want it to land well.', phrases: [
    'Can I mention something that’s been on my mind?',
    'Here’s what I noticed… Here’s what I’d like…',
    'I might be missing something. How does it look to you?',
    'Can we find a plan that works for both of us?',
  ] },
  { id: 'pb-s-repair', domain: 'speech', title: 'Repair after a misstep', when: 'You said something you regret.', phrases: [
    'What I said earlier wasn’t fair. I’m sorry.',
    'I spoke too quickly. Here’s what I meant.',
    'I’d like to try that conversation again.',
    'You don’t have to respond now. I wanted you to know.',
  ] },
  { id: 'pb-e-done', domain: 'effort', title: 'Knowing when to stop', when: 'You keep polishing something that is already good enough.', phrases: [
    'Done means: … I’ve reached it.',
    'Good enough to send is good enough.',
    'More time here is time taken from somewhere else.',
    'I can improve it next time, with fresh eyes.',
  ] },
  { id: 'pb-e-low-day', domain: 'effort', title: 'Low-energy days', when: 'You’re tired and the plan feels too big.', phrases: [
    'What is the smaller version?',
    'Today’s best is allowed to be small.',
    'Showing up for five minutes still counts.',
    'Rest is part of the plan, not a break from it.',
  ] },
  { id: 'pb-e-capacity', domain: 'effort', title: 'Being honest about capacity', when: 'More work or commitments are coming your way.', phrases: [
    'I can take this on well if something else moves.',
    'I want to do this properly, so I can’t take it now.',
    'I can do it by Friday, not by tomorrow.',
    'Let me check what I’ve already promised first.',
  ] },
];
export const PHRASE_BANK_BY_ID: Record<string, PhraseBank> = Object.fromEntries(PHRASE_BANKS.map((b) => [b.id, b]));
