import type { RecogniseItem } from '../programme';

/**
 * Micro-checks: one or two taps inside every lesson session (Round 2 §2.2). Every option teaches; a different
 * answer shows its feedback and never blocks completion. All wording is Equanim's own.
 */
export const MICRO_CHECKS: Record<string, RecogniseItem[]> = {
  w1d1: [{
    id: 'mc-w1d1',
    situation: 'You message a friend. The ticks show she has read it. Three hours later, still no reply.',
    question: 'Which of these is what a camera would record?',
    options: [
      { id: 'a', text: 'She read it and has not replied yet.', feedback: 'Yes. That is the event, with nothing added. Everything else is a guess about why.' },
      { id: 'b', text: 'She is ignoring me.', feedback: 'That is a meaning added to the silence. She might be at work, driving, or planning to reply properly later.' },
      { id: 'c', text: 'I must have said something wrong.', feedback: 'This one turns her silence into a verdict about you. It is worth noticing how quickly it arrives.' },
    ],
    answerId: 'a',
  }],
  w2d1: [{
    id: 'mc-w2d1',
    situation: 'Your manager writes: "Can you stay back ten minutes after the meeting?" You think: "She wants to talk about the delay, so she must be unhappy with my work."',
    question: 'Which part is the assumption?',
    options: [
      { id: 'a', text: 'She asked you to stay back after the meeting.', feedback: 'This part you know. It is in the message.' },
      { id: 'b', text: 'She must be unhappy with my work.', feedback: 'Yes. Nothing in the message says this. One question, or simply waiting ten minutes, would tell you.' },
      { id: 'c', text: 'It will take about ten minutes.', feedback: 'This is also in the message, so it counts as known.' },
    ],
    answerId: 'b',
  }],
  w3d1: [{
    id: 'mc-w3d1',
    situation: 'A colleague’s report for tomorrow’s client meeting has a wrong figure on page 3.',
    question: 'Which comment passes all three checks: accurate, needed, yours to say?',
    options: [
      { id: 'a', text: 'To her: "I think the figure on page 3 may be off. Want to check it together?"', feedback: 'Yes. It is specific, it matters before tomorrow, and you are saying it to the person who can fix it.' },
      { id: 'b', text: 'To her: "You always rush these."', feedback: '"Always" is rarely accurate, and it turns one error into a judgement about her. The figure is what needs fixing.' },
      { id: 'c', text: 'To someone else: "Did you see the mess in her report?"', feedback: 'This does not help the report get fixed, and it is not yours to say to a third person.' },
    ],
    answerId: 'a',
  }],
  w4d1: [{
    id: 'mc-w4d1',
    situation: 'You planned a 20-minute walk each evening. Late work has meant you missed three days in a row.',
    question: 'What is the most useful next step?',
    options: [
      { id: 'a', text: 'Tomorrow, take a five-minute walk and count it as done.', feedback: 'Yes. A smaller version gets you moving again without needing a perfect day.' },
      { id: 'b', text: 'Make up for it with an hour on Sunday.', feedback: 'Catch-up plans often turn into all or nothing. Returning in a small way tends to last longer.' },
      { id: 'c', text: 'Drop the plan. It clearly does not suit you.', feedback: 'Three missed days tell you about the size of the plan, not about you. Try adjusting it before dropping it.' },
    ],
    answerId: 'a',
  }],
  w5d1: [{
    id: 'mc-w5d1',
    situation: 'You suggest a restaurant for Saturday. Your friend replies: "fine." You feel a small jolt.',
    question: 'Which first step fits best?',
    options: [
      { id: 'a', text: 'Ask: "Fine as in good, or would you rather go somewhere else?"', feedback: 'Yes. One light question checks the guess before it grows, and it is kind to both of you.' },
      { id: 'b', text: 'Reply: "Forget it then."', feedback: 'This answers the jolt, not the message. It is worth pausing before words that are hard to take back.' },
      { id: 'c', text: 'Decide she is tired of your choices.', feedback: 'That is a meaning added to one word. It may be true, but you do not know yet.' },
    ],
    answerId: 'a',
  }],
};

/** Self-commit taps for Think mode prompts. Stored as thinkResponses: data for the weekly review, never a grade. */
export const THINK_RESPONSES: { id: 'have-one' | 'not-sure' | 'nothing'; label: string }[] = [
  { id: 'have-one', label: 'I have one in mind' },
  { id: 'not-sure', label: 'I’m not sure yet' },
  { id: 'nothing', label: 'Nothing came up' },
];
