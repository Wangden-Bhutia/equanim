import { DOMAINS } from '../domains';
import type { SessionDef } from '../programme';

/** Weeks 2–6. Original writing. Every lesson carries its "not this" caveat. */
const I = DOMAINS.inquiry;
const S = DOMAINS.speech;
const E = DOMAINS.effort;
const INTEGRATE_NOT_THIS = 'Putting the skills together is not about getting every moment right. Using one skill well in a hard moment is plenty.';
const CONSOLIDATE_NOT_THIS = 'Looking back is not measuring yourself. Your ratings are a private snapshot, not a score, and there is no pass mark.';

const review = (week: number, domain: SessionDef['domain'], intro: string): SessionDef => ({
  id: `w${week}d6`, week, day: 6, type: 'review', domain, title: `Week ${week} review`, minutes: 12, available: true, intro,
});

export const WEEK2: SessionDef[] = [
  {
    id: 'w2d1', week: 2, day: 1, type: 'understand', domain: 'inquiry', title: 'Knowing and guessing', minutes: 6, available: true,
    intro: 'This week is about checking the story before acting on it.',
    lesson: {
      body: [
        'When something is unclear, the mind fills the gap fast. A late reply becomes "they’re upset". A vague email becomes "I’m in trouble".',
        'These guesses feel like knowledge. They arrive with the same certainty as facts, which is why we so rarely check them.',
        'The discipline of inquiry is a simple habit: notice when you are guessing, and, when it matters, check. Often with one clear question.',
      ],
      example: 'Your landlord texts "Need to talk about the flat." Guess: "He’s putting the rent up or ending the lease." Known: he wants to talk about the flat. A question: "Sure. What’s it about, so I can come prepared?"',
    },
    notThis: I.notThis,
    prompts: [
      { id: 'guess', label: 'Think of a recent moment when you acted on a guess. What did you assume?' },
      { id: 'check', label: 'What could you have checked, and how?' },
    ],
  },
  {
    id: 'w2d2', week: 2, day: 2, type: 'recognise', domain: 'inquiry', title: 'Spot the assumption', minutes: 7, available: true,
    intro: 'Three short situations. In each one, find the assumption hiding inside a "fact".',
    notThis: I.notThis,
    recognise: [
      { id: 'r1', situation: 'Your friend left the group dinner early without saying much.', question: 'Which thought is an assumption?', answerId: 'c', options: [
        { id: 'a', text: 'She left before dessert.', feedback: 'This is an observation.' },
        { id: 'b', text: 'She didn’t say much as she left.', feedback: 'Also observed, though "much" is a little vague.' },
        { id: 'c', text: 'She was bored with us.', feedback: 'Yes. A guess about her inner state. She might have been tired, unwell, or had somewhere to be.' },
      ] },
      { id: 'r2', situation: 'Your manager forwards you an email with just "FYI".', question: 'Which thought is an assumption?', answerId: 'a', options: [
        { id: 'a', text: 'She wants me to fix this.', feedback: 'Yes. "FYI" might mean exactly that: for your information. A quick question settles it.' },
        { id: 'b', text: 'She forwarded the email.', feedback: 'This is an observation.' },
        { id: 'c', text: 'The message says "FYI".', feedback: 'Also an observation.' },
      ] },
      { id: 'r3', situation: 'A neighbour’s music is loud at 11 pm on a weeknight.', question: 'Which response checks rather than assumes?', answerId: 'b', options: [
        { id: 'a', text: 'Decide they don’t care about anyone else.', feedback: 'This turns one evening into a judgement of character.' },
        { id: 'b', text: 'Knock and ask if they could turn it down, as you have work early.', feedback: 'Yes. They may not know how far the sound carries.' },
        { id: 'c', text: 'Complain to the building committee straight away.', feedback: 'This skips the simplest check: telling them.' },
      ] },
    ],
    prompts: [{ id: 'own', label: 'Where did you assume something today or yesterday?' }],
  },
  {
    id: 'w2d3', week: 2, day: 3, type: 'rehearse', domain: 'inquiry', title: 'Questions to have ready', minutes: 7, available: true,
    intro: 'A good question is easier to ask if you’ve said it before. Practise a few now.',
    notThis: I.notThis,
    banks: ['pb-i-clarify', 'pb-i-check-story'],
    rehearse: 'Choose one question from each bank. Say each quietly aloud twice, or write it in your own words. Picture someone you might ask it to this week.',
    prompts: [
      { id: 'phrase', label: 'Which question will you keep, in your own words?' },
      { id: 'who', label: 'Who might you ask it to, and when?' },
    ],
  },
  {
    id: 'w2d4', week: 2, day: 4, type: 'apply', domain: 'inquiry', title: 'Check one story', minutes: 6, available: true,
    intro: 'Plan to check one real assumption today or tomorrow.',
    notThis: I.notThis,
    apply: { explain: 'Choose a moment when you are likely to guess (an unclear message, a worry about a plan) and the question or check you will use instead.' },
    prompts: [{ id: 'expect', label: 'What might make it hard to ask?' }],
  },
  {
    id: 'w2d5', week: 2, day: 5, type: 'retrieve', domain: 'inquiry', title: 'Remember, then stretch', minutes: 8, available: true,
    intro: 'Three questions from this week and one from last week, then a harder situation.',
    notThis: I.notThis,
    retrieval: { questionIds: ['rq-i-2', 'rq-i-6', 'rq-i-12', 'rq-p-9'], scenarioId: 'a-landlord-call' },
    prompts: [{ id: 'stretch', label: 'In the harder scenario, which assumption was most tempting?' }],
  },
  review(2, 'inquiry', 'Look back at the week. What did checking, or not checking, show you?'),
];

export const WEEK3: SessionDef[] = [
  {
    id: 'w3d1', week: 3, day: 1, type: 'understand', domain: 'speech', title: 'Accurate, needed, mine to say', minutes: 6, available: true,
    intro: 'This week is about the words you use, with others and with yourself.',
    lesson: {
      body: [
        'Words shape what happens next. A sharp sentence can undo a week of goodwill; a clear one can save an hour of confusion.',
        'Three quick checks catch most regrets: Is it accurate? Is it needed? Is it mine to say?',
        'The same checks apply to how you speak to yourself. "I always ruin things" fails the first check. "I made one mistake, and here is the fix" passes all three.',
      ],
      example: 'You are tempted to tell a friend that a mutual friend "only calls when she needs something". Accurate? Partly. Needed? Not really. Yours to say? It is about her, not you. Perhaps it is something to raise with her directly, or let go.',
    },
    notThis: S.notThis,
    prompts: [
      { id: 'regret', label: 'Think of something you said recently that you would phrase differently. Which check did it miss?' },
      { id: 'self', label: 'What is one thing you often say to yourself? Does it pass the accuracy check?' },
    ],
  },
  {
    id: 'w3d2', week: 3, day: 2, type: 'recognise', domain: 'speech', title: 'Spot the slip', minutes: 7, available: true,
    intro: 'Three short situations. Find the words that miss one of the checks.',
    notThis: S.notThis,
    recognise: [
      { id: 'r1', situation: 'A colleague asks how your weekend was. You were exhausted and lonely.', question: 'Which reply has integrity without over-sharing?', answerId: 'b', options: [
        { id: 'a', text: '"Amazing, best weekend ever!"', feedback: 'Fails the accuracy check, and you don’t need to perform.' },
        { id: 'b', text: '"Quiet, a bit tiring. How was yours?"', feedback: 'Yes. True, private, and friendly. Integrity doesn’t require telling everything.' },
        { id: 'c', text: 'A detailed account of how lonely you felt.', feedback: 'Honest, but perhaps more than this moment or relationship calls for.' },
      ] },
      { id: 'r2', situation: 'You notice yourself thinking, "I’m so stupid," after forgetting a bill.', question: 'Which is an accurate rephrase?', answerId: 'c', options: [
        { id: 'a', text: '"It doesn’t matter."', feedback: 'It may matter: there could be a late fee to sort out.' },
        { id: 'b', text: '"I’m brilliant, actually."', feedback: 'Not accurate either. The aim is accuracy, not flattery.' },
        { id: 'c', text: '"I forgot the bill. I’ll pay it now and set a reminder."', feedback: 'Yes. A fact and a next step.' },
      ] },
      { id: 'r3', situation: 'A friend asks your opinion of their new business idea. You see a serious problem.', question: 'Which reply passes all three checks?', answerId: 'a', options: [
        { id: 'a', text: '"I like the idea. I’m worried about the costs. Can we look at them together?"', feedback: 'Yes. Accurate, needed, yours to say because they asked, and kind.' },
        { id: 'b', text: '"It’ll never work."', feedback: 'A prediction stated as fact, and without anything they can use.' },
        { id: 'c', text: '"Sounds great!"', feedback: 'Kind in the moment, but not accurate, and they asked for your view.' },
      ] },
    ],
    prompts: [{ id: 'own', label: 'Where did your words miss a check today or yesterday?' }],
  },
  {
    id: 'w3d3', week: 3, day: 3, type: 'rehearse', domain: 'speech', title: 'Saying it well', minutes: 7, available: true,
    intro: 'Clear words are easier to find if you’ve practised them. Try a no and a way of raising a problem.',
    notThis: S.notThis,
    banks: ['pb-s-no', 'pb-s-raise', 'pb-s-repair'],
    rehearse: 'Choose one phrase from any bank. Say it quietly aloud three times, in a calm voice. If you like, write a version for a real situation.',
    prompts: [
      { id: 'phrase', label: 'Write the phrase you chose, adapted to a real situation.' },
      { id: 'where', label: 'Where might you use it this week?' },
    ],
  },
  {
    id: 'w3d4', week: 3, day: 4, type: 'apply', domain: 'speech', title: 'One clear sentence', minutes: 6, available: true,
    intro: 'Plan one moment where you will use the three checks before speaking.',
    notThis: S.notThis,
    apply: { explain: 'Choose a moment that is likely to come up: a request you want to decline, a complaint about someone, a mistake you might talk about harshly to yourself. Decide what you will do instead.' },
    prompts: [{ id: 'expect', label: 'What might make it hard?' }],
  },
  {
    id: 'w3d5', week: 3, day: 5, type: 'retrieve', domain: 'speech', title: 'Remember, then stretch', minutes: 8, available: true,
    intro: 'Three questions from this week and one from earlier, then a harder situation.',
    notThis: S.notThis,
    retrieval: { questionIds: ['rq-s-3', 'rq-s-7', 'rq-s-12', 'rq-i-7'], scenarioId: 'w-honest-opinion' },
    prompts: [{ id: 'stretch', label: 'In the harder scenario, which check was hardest to apply?' }],
  },
  review(3, 'speech', 'Look back at the week. What did you notice about your words, out loud and inside?'),
];

export const WEEK4: SessionDef[] = [
  {
    id: 'w4d1', week: 4, day: 1, type: 'understand', domain: 'effort', title: 'Your best, today', minutes: 6, available: true,
    intro: 'This week is about doing what is possible today, without demanding perfection.',
    lesson: {
      body: [
        'Your best is not a fixed amount. On a rested day it is large; on a sick or grieving day it is small. Both count.',
        'Sincere effort means giving what today allows, then stopping. Two tools help: deciding in advance what "done" looks like, and having a smaller version ready for low days.',
        'After a hard day, a short review helps more than a verdict: one thing that helped, one thing to adjust.',
      ],
      example: 'You planned to clean the whole flat, but you’re worn out after a long week. The smaller version: clear the kitchen counter and take out the rubbish. Done means: counter clear, bin empty. Then stop.',
    },
    notThis: E.notThis,
    prompts: [
      { id: 'done', label: 'Pick a task for this week. In one sentence, what does "done" look like?' },
      { id: 'small', label: 'What is the smaller version, for a low-energy day?' },
    ],
  },
  {
    id: 'w4d2', week: 4, day: 2, type: 'recognise', domain: 'effort', title: 'Spot the trap', minutes: 7, available: true,
    intro: 'Three short situations. Find the thought that turns effort into overwork, or into a verdict.',
    notThis: E.notThis,
    recognise: [
      { id: 'r1', situation: 'You have rewritten an email five times. It was fine after the second.', question: 'Which thought keeps you stuck?', answerId: 'b', options: [
        { id: 'a', text: '"It says what it needs to say."', feedback: 'This is the definition of done. It lets you stop.' },
        { id: 'b', text: '"It has to be perfect, or they’ll think less of me."', feedback: 'Yes. Perfection has no stopping point, and it ties the email to your worth.' },
        { id: 'c', text: '"I can send it and improve the next one."', feedback: 'This is a helpful thought: it lets you move on.' },
      ] },
      { id: 'r2', situation: 'You skipped your evening walk three days running.', question: 'Which thought turns a gap into a verdict?', answerId: 'a', options: [
        { id: 'a', text: '"I have no discipline. Why bother?"', feedback: 'Yes. Three days have become a judgement of character.' },
        { id: 'b', text: '"I’ll walk to the end of the road today."', feedback: 'This is the smaller version. It gets you going again.' },
        { id: 'c', text: '"The evenings have been busy this week."', feedback: 'An observation that might help you choose a better time.' },
      ] },
      { id: 'r3', situation: 'You were ill and couldn’t finish your share of a group task.', question: 'Which response fits sincere effort?', answerId: 'c', options: [
        { id: 'a', text: 'Work through the night while still ill.', feedback: 'Overwork while ill tends to cost more than it saves.' },
        { id: 'b', text: 'Say nothing and hope nobody notices.', feedback: 'Effort doesn’t remove responsibility for what you promised. Telling them matters.' },
        { id: 'c', text: 'Tell the group, say what you can do and by when.', feedback: 'Yes. Honest about today’s capacity, and still responsible.' },
      ] },
    ],
    prompts: [{ id: 'own', label: 'Where did perfection or a harsh verdict show up for you recently?' }],
  },
  {
    id: 'w4d3', week: 4, day: 3, type: 'rehearse', domain: 'effort', title: 'Words for steady effort', minutes: 7, available: true,
    intro: 'Have a few words ready for the moments when effort tips into overwork or giving up.',
    notThis: E.notThis,
    banks: ['pb-e-done', 'pb-e-low-day', 'pb-e-capacity'],
    rehearse: 'Choose one phrase you need most. Say it quietly aloud, or write it on a note where you’ll see it.',
    prompts: [
      { id: 'phrase', label: 'Which phrase will you keep, in your own words?' },
      { id: 'where', label: 'When are you most likely to need it?' },
    ],
  },
  {
    id: 'w4d4', week: 4, day: 4, type: 'apply', domain: 'effort', title: 'Define done, then stop', minutes: 6, available: true,
    intro: 'Plan one task where you decide in advance what done looks like.',
    notThis: E.notThis,
    apply: { explain: 'Choose a task you are likely to over-polish, or one you are likely to avoid. Plan what you will do when you start it: define done, or do the smaller version.' },
    prompts: [{ id: 'expect', label: 'What might pull you past "done", or away from starting?' }],
  },
  {
    id: 'w4d5', week: 4, day: 5, type: 'retrieve', domain: 'effort', title: 'Remember, then stretch', minutes: 8, available: true,
    intro: 'Three questions from this week and one from earlier, then a harder situation.',
    notThis: E.notThis,
    retrieval: { questionIds: ['rq-e-2', 'rq-e-6', 'rq-e-13', 'rq-s-9'], scenarioId: 'e-endless-polish' },
    prompts: [{ id: 'stretch', label: 'In the harder scenario, what would "done" have looked like?' }],
  },
  review(4, 'effort', 'Look back at the week. Where did you give what the day allowed?'),
];

export const WEEK5: SessionDef[] = [
  {
    id: 'w5d1', week: 5, day: 1, type: 'integrate', domain: null, title: 'When the skills meet', minutes: 7, available: true,
    intro: 'This week, the four skills work together, as they do in real life.',
    lesson: {
      body: [
        'Real moments rarely need just one skill. A curt message from your manager might call for noticing the sting, checking what is meant, choosing your words, and keeping your effort steady.',
        'You don’t need to run through all four every time. Ask: which skill would help most right now? Often one is enough to change what happens next.',
      ],
      example: 'Your brother cancels on your parents’ anniversary dinner by text. Personalisation: "This might not be about me." Inquiry: "Do I know why?" Speech: "I was disappointed. Is everything OK?" Effort: you still make the dinner good for your parents.',
    },
    notThis: INTEGRATE_NOT_THIS,
    integration: ['ix-1', 'ix-2'],
    prompts: [{ id: 'which', label: 'Which of the four skills comes most naturally to you now? Which needs most attention?' }],
  },
  {
    id: 'w5d2', week: 5, day: 2, type: 'integrate', domain: null, title: 'Mixed moments', minutes: 8, available: true,
    intro: 'Three situations that call for more than one skill.',
    notThis: INTEGRATE_NOT_THIS,
    integration: ['ix-3', 'ix-4', 'ix-5'],
    prompts: [{ id: 'own', label: 'Think of a recent moment that needed two skills at once. Which were they?' }],
  },
  {
    id: 'w5d3', week: 5, day: 3, type: 'integrate', domain: null, title: 'Choosing your words, together', minutes: 8, available: true,
    intro: 'Three more mixed situations, then phrases from across the weeks.',
    notThis: INTEGRATE_NOT_THIS,
    integration: ['ix-6', 'ix-7', 'ix-8'],
    banks: ['pb-p-criticism', 'pb-i-clarify', 'pb-s-raise', 'pb-e-capacity'],
    rehearse: 'Choose the one phrase from these banks you are most likely to need in the coming week. Say it quietly aloud, or write it down.',
    prompts: [{ id: 'phrase', label: 'Which phrase did you choose, and for what situation?' }],
  },
  {
    id: 'w5d4', week: 5, day: 4, type: 'integrate', domain: null, title: 'Your hardest situation', minutes: 10, available: true,
    intro: 'Plan for the situation you find hardest. Planning when you are calm makes the hard moment a little easier.',
    notThis: 'This plan is for everyday difficulty. If a situation involves abuse, threats or a risk to your safety, please talk to someone you trust or contact a helpline: in India, 112 for emergencies, or Tele-MANAS on 14416 or 1-800-891-4416.',
    showValues: true,
    apply: { explain: 'When you have written your plan below, turn its first step into an if-then plan for this week.' },
    prompts: [
      { id: 'situation', label: 'What is the situation you find hardest? Describe it as a camera would.' },
      { id: 'signs', label: 'What are the early signs that it is starting (in your body, your thoughts, the room)?' },
      { id: 'skills', label: 'Which skills would help most, and how?' },
      { id: 'words', label: 'What words could you use?' },
      { id: 'value', label: 'Which of your values does this situation touch, and what would acting on it look like?' },
    ],
  },
  {
    id: 'w5d5', week: 5, day: 5, type: 'retrieve', domain: null, title: 'Remember, then stretch', minutes: 9, available: true,
    intro: 'One question from each week, then four of the hardest mixed situations.',
    notThis: INTEGRATE_NOT_THIS,
    retrieval: { questionIds: ['rq-p-14', 'rq-i-14', 'rq-s-15', 'rq-e-12'], scenarioId: 'n-group-pressure' },
    integration: ['ix-9', 'ix-10', 'ix-11', 'ix-12'],
    prompts: [{ id: 'stretch', label: 'Which situation this week felt closest to your own life?' }],
  },
  review(5, null, 'Look back at the week of putting the skills together.'),
];

export const WEEK6: SessionDef[] = [
  {
    id: 'w6d1', week: 6, day: 1, type: 'consolidate', domain: null, title: 'Where you are now', minutes: 8, available: true,
    intro: 'Answer the same statements you rated on Day 0. Answer for how things are now; don’t try to remember your old answers.',
    notThis: CONSOLIDATE_NOT_THIS,
    special: 'baseline-finish',
  },
  {
    id: 'w6d2', week: 6, day: 2, type: 'consolidate', domain: null, title: 'Side by side', minutes: 7, available: true,
    intro: 'Your Day 0 answers next to today’s. There is no score and no right direction: just two snapshots, in your own words.',
    notThis: CONSOLIDATE_NOT_THIS,
    special: 'compare',
    prompts: [
      { id: 'notice', label: 'Looking at the two side by side, what do you notice?' },
      { id: 'surprise', label: 'Did anything surprise you?' },
    ],
  },
  {
    id: 'w6d3', week: 6, day: 3, type: 'consolidate', domain: null, title: 'Evidence of change', minutes: 8, available: true,
    intro: 'Feelings about progress can be unreliable. Here are your own notes from the past weeks. Look for small, concrete moments.',
    notThis: CONSOLIDATE_NOT_THIS,
    special: 'evidence',
    prompts: [
      { id: 'e1', label: 'One moment where you handled something a little differently:' },
      { id: 'e2', label: 'Another moment, however small:' },
      { id: 'e3', label: 'Something you noticed about yourself that you hadn’t before:' },
    ],
  },
  {
    id: 'w6d4', week: 6, day: 4, type: 'consolidate', domain: null, title: 'A letter to your future self', minutes: 10, available: true,
    intro: 'Write a short letter to yourself, to read on a hard day in a few months. Writing is suggested for this one, but thinking it through is fine too.',
    notThis: CONSOLIDATE_NOT_THIS,
    showValues: true,
    prompts: [
      { id: 'letter', label: 'Dear me…', hint: 'What would help you remember on a hard day? What have you learned? What do you want to keep?' },
    ],
  },
  {
    id: 'w6d5', week: 6, day: 5, type: 'consolidate', domain: null, title: 'Your maintenance plan', minutes: 8, available: true,
    intro: 'Skills fade without use and stay with a little regular practice. Plan a light rhythm you can keep.',
    notThis: CONSOLIDATE_NOT_THIS,
    special: 'maintenance',
    prompts: [
      { id: 'rhythm', label: 'When in the week could you practise for a few minutes, about three times?' },
      { id: 'skill', label: 'Which skill do you most want to keep sharp?' },
      { id: 'warning', label: 'What is an early sign that you are slipping back into old habits?' },
      { id: 'return', label: 'When you notice that sign, what will you do?' },
    ],
  },
  review(6, null, 'The last review of the programme. Look back at the whole six weeks.'),
];
