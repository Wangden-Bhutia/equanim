import type { DomainId } from '../types';

export interface LibraryItem {
  id: string;
  kind: 'section' | 'essay';
  domain: DomainId | null;
  title: string;
  subtitle: string;
  minutes: number;
  body: string[];
  example: { title: string; text: string };
  question: string;
  exercise: { title: string; steps: string[] };
  scenarioId: string;
}

export const LIBRARY: LibraryItem[] = [
  // ---- Four sections ----
  {
    id: 'section-speech', kind: 'section', domain: 'speech', title: 'The Integrity of Speech', subtitle: 'Language, trust and responsibility', minutes: 4,
    body: [
      'Most of what we say is said quickly. A sentence forms, and before we have weighed it, it is out in the world, shaping relationships, building or eroding trust, and quietly teaching us what we believe. Speech feels light because it costs so little to produce. Its effects are rarely light.',
      'Integrity of speech is not the same as bluntness. Honesty tells the truth; harshness adds force that the truth does not need. A sentence can be completely accurate and still be delivered as an attack. The practice is to keep the honesty and question the harshness.',
      'Accuracy matters as much as honesty. \u201cYou always interrupt\u201d is usually an exaggeration of \u201cyou interrupted me twice today\u201d. Exaggeration feels emphatic in the moment, but it invites argument about the word \u201calways\u201d instead of attention to what happened.',
      'Silence has its place too. Some things are not ours to say, and some moments are better met with quiet. But useful silence is a choice; avoidance is a flinch. The question is whether you are staying quiet because it serves the situation, or because speaking feels uncomfortable.',
      'Finally, speech is a form of responsibility. Each promise we make and keep, or quietly drop, teaches others how much our words are worth. The voice we use inwards follows the same rules: careless self-talk, repeated often enough, becomes self-understanding.',
    ],
    example: { title: 'A small example', text: 'Asked to join a project you have no time for, you notice the yes forming. You pause and say, \u201cI can\u2019t take it on properly this month. I could review the plan once it\u2019s drafted.\u201d It is less than they hoped for, and it is true.' },
    question: 'Where today did you choose silence, and was it useful silence or avoidance?',
    exercise: { title: 'The three-question pause', steps: ['Choose one conversation today that matters to you.', 'Before an important sentence, ask silently: is it accurate, is it mine to say, and why am I saying it?', 'Afterwards, note in your journal whether the pause changed anything.'] },
    scenarioId: 'w-borrowed-complaint',
  },
  {
    id: 'section-personalisation', kind: 'section', domain: 'personalisation', title: 'Freedom from Personalisation', subtitle: 'Events, stories and the self', minutes: 4,
    body: [
      'Something happens: a message, a look, a tone of voice. Almost instantly a meaning arrives with it. He is annoyed with me. She thinks I am incompetent. They do not respect me. The event and the meaning arrive so close together that they feel like one thing.',
      'They are not one thing. The event is usually small and observable. The meaning is a story, built from our own fears, expectations and history. Someone who expects to be overlooked will find evidence of being overlooked; someone who fears criticism will hear it in neutral words.',
      'Other people act from inside their own lives. Their tiredness, worries and habits shape what they say far more than anything about us. A sharp remark often reflects the speaker\u2019s day. This works in both directions: praise, too, is partly about the person giving it.',
      'Freedom from personalisation does not mean pretending nothing affects you, or that harm is not harm. If someone treats you badly, that is real, and it may need addressing. It also does not remove your own accountability: sometimes criticism is accurate. The practice is to respond to what actually happened, rather than to the largest story available.',
    ],
    example: { title: 'A small example', text: 'A friend cancels plans with a one-line message. The first story is \u201cshe doesn\u2019t value me.\u201d You write down the fact instead: \u201cShe cancelled, by text, two hours before.\u201d Then you notice how much of the hurt came from the first sentence, not the second.' },
    question: 'Which of your own fears most often supplies the meaning to other people\u2019s actions?',
    exercise: { title: 'Two columns', steps: ['Think of one moment today that stung.', 'In one column, write only what a camera would have recorded.', 'In the other, write what you concluded from it.', 'Ask which column you have been reacting to, and whether anything in it needs addressing.'] },
    scenarioId: 'p-one-word-reply',
  },
  {
    id: 'section-inquiry', kind: 'section', domain: 'inquiry', title: 'The Discipline of Inquiry', subtitle: 'Assumptions, evidence and better questions', minutes: 4,
    body: [
      'The mind does not like empty spaces. Give it a silence, a delay or an ambiguous instruction, and it will fill the gap with a story, often a confident one and often an unflattering one. Assumptions are useful; we cannot check everything. The trouble starts when a guess is treated as knowledge and then acted upon.',
      'Once a story forms, we tend to notice what confirms it and overlook what does not. If you have decided a colleague dislikes you, every short reply counts as evidence, and every friendly one is an exception. This confirmation habit makes first impressions feel more certain than they are.',
      'Inquiry is not doubting everything, and it is not ignoring evidence. Sometimes the facts do support the conclusion. The discipline is to know the difference between what you know and what you are guessing, and to check the guesses you are about to act on.',
      'Better questions help. Open questions (\u201cWhat did you have in mind?\u201d) gather more than closed ones (\u201cYou mean the short version, right?\u201d). Neutral questions (\u201cIs everything all right?\u201d) invite more honesty than leading ones (\u201cAre you annoyed with me?\u201d). Asking about specifics (\u201cWhich part feels unfinished?\u201d) turns vague worries into something you can work with.',
      'There is a quieter form of assumption too: expecting others to know what we need without telling them. Saying plainly what you want is a form of inquiry turned outward.',
    ],
    example: { title: 'A small example', text: 'Your manager says \u201cLet\u2019s talk tomorrow.\u201d You feel the familiar dread and start planning a defence. Instead, you reply: \u201cSure. Anything I should prepare?\u201d The answer is a routine planning question.' },
    question: 'What are you treating as known that you have not checked?',
    exercise: { title: 'Name the leap', steps: ['When you notice a strong conclusion about someone, stop.', 'Write: \u201cWhat I know is\u2026\u201d and \u201cWhat I am assuming is\u2026\u201d.', 'Add two other explanations that would fit the facts.', 'If it matters, write one open, neutral question that would test your assumption.'] },
    scenarioId: 'a-quick-summary',
  },
  {
    id: 'section-effort', kind: 'section', domain: 'effort', title: 'Sincere Effort', subtitle: 'Responsibility without perfectionism', minutes: 4,
    body: [
      'Effort is not a fixed quantity. What you can give on a rested morning differs from what you can give with a fever, after bad news or at the end of a long week. A sincere effort is measured against the day you actually have, and circumstances change from day to day.',
      'Realistic expectations make effort sustainable. Perfectionism looks like high standards, but it often works as protection: if the work is never finished, it can never be judged. Real standards include knowing when something is good enough for its purpose, and stopping there.',
      'Consistency matters more than intensity. Ten minutes on most days usually does more than three hours once a fortnight. A smaller version of a practice, done on a tired day, keeps the thread unbroken.',
      'Effort also means responsibility. Sincere effort does not excuse missed commitments; when something slips, it is acknowledged and repaired. Commitment is keeping faith with what matters over time. Perfectionism is demanding that every instance be flawless. They feel similar and work very differently.',
      'Recovery is part of effort. Mistakes and lapses are information about conditions, not verdicts about character. The question after a hard day is not \u201cwhy did I fail?\u201d but \u201cwhat would help tomorrow?\u201d',
    ],
    example: { title: 'A small example', text: 'You planned a long walk but slept badly. Instead of skipping it with guilt or forcing a full hour, you walk for fifteen minutes and notice the trees. It was smaller than planned, and it was real.' },
    question: 'Where are you confusing commitment with perfectionism?',
    exercise: { title: 'Define done', steps: ['Pick one task you have been avoiding or over-polishing.', 'Write one sentence describing what \u201cgood enough for its purpose\u201d means.', 'Work until you meet that sentence, then stop.', 'Notice what it felt like to stop on purpose.'] },
    scenarioId: 'e-tired-evening',
  },

  // ---- Seven essays ----
  {
    id: 'essay-stories-we-add', kind: 'essay', domain: 'personalisation', title: 'The Stories We Add to Events', subtitle: 'Facts, stories and feelings', minutes: 3,
    body: [
      'In most difficult moments, three things arrive at once: what happened, what we tell ourselves about it, and how we feel. Because they arrive together, they feel like a single experience.',
      'Pulling them apart is surprisingly clarifying. The fact is usually small: a delay, a sentence, a look. The story is usually large: about intentions, character, the future. The feeling is real, but it is responding to the story at least as much as to the fact.',
      'None of this makes feelings wrong. It simply gives you more places to stand. You can acknowledge the feeling, question the story and respond to the fact, a much wider set of options than reacting to all three as one.',
    ],
    example: { title: 'In ordinary life', text: 'Fact: your partner forgot to call at lunch. Story: \u201cI am not a priority.\u201d Feeling: hurt. Separating them, you see the hurt is mostly about the story, and decide to mention the call simply, without the story attached.' },
    question: 'Which of the three, fact, story or feeling, do you tend to skip past?',
    exercise: { title: 'Three lines', steps: ['Think of one moment from today that stayed with you.', 'Write one line each: the fact, the story, the feeling.', 'Read the story line again and ask how certain you are of it.'] },
    scenarioId: 'a-seen-no-reply',
  },
  {
    id: 'essay-defending-self', kind: 'essay', domain: 'personalisation', title: 'The Habit of Defending the Self', subtitle: 'When every comment feels like a trial', minutes: 3,
    body: [
      'Some of us live as if we were permanently on trial. A question about our work sounds like an accusation; a suggestion sounds like a verdict. Before the other person has finished, the defence is already being prepared.',
      'Defending ourselves feels necessary because it seems to protect something precious: our competence, our goodness, our place. But the defence often costs more than the criticism would have. It makes conversations adversarial, hides useful information and exhausts everyone involved.',
      'The alternative is not to accept every judgement. It is to delay the defence long enough to find out what is actually being said. Often it is smaller than feared. Sometimes it is accurate, and useful. Occasionally it is unfair, and then a calm, specific response serves far better than a reflexive one.',
    ],
    example: { title: 'In ordinary life', text: 'Your partner says, \u201cYou didn\u2019t mention the bill was due.\u201d You feel the familiar rush: a list of everything you do remember. Instead you say, \u201cYou\u2019re right, I didn\u2019t. Is it sorted now?\u201d The conversation is over in a minute.' },
    question: 'What are you protecting when you defend yourself quickly?',
    exercise: { title: 'Delay the defence', steps: ['Next time you feel criticised, notice the urge to explain.', 'Ask one question first: \u201cWhat do you mean?\u201d or \u201cWhich part?\u201d', 'Afterwards, note whether the criticism was smaller, larger or the same as you first heard it.'] },
    scenarioId: 'p-meeting-critique',
  },
  {
    id: 'essay-space-between', kind: 'essay', domain: 'personalisation', title: 'The Space Between Impulse and Action', subtitle: 'Noticing the gap', minutes: 3,
    body: [
      'Between an impulse and the action that follows, there is a gap. Usually it is so small we never notice it. The horn sounds and we are already angry. The criticism lands and we are already defending.',
      'Practice does not remove impulses. The jolt of anger or hurt will still arrive; it is the body doing its job. What practice can change is the width of the gap after the jolt: the moment in which you notice what is happening before you act on it.',
      'That moment does not need to be long. A single breath is often enough to change a reply. Over time, noticing becomes a little quicker and the gap a little wider. This is not detachment from life. It is being present enough to choose.',
    ],
    example: { title: 'In ordinary life', text: 'A colleague interrupts you for the third time. You feel the heat rise. You notice it, take one breath and say, \u201cI\u2019d like to finish this point.\u201d The sentence is firm and calm because it came after the breath, not before it.' },
    question: 'Where did you notice the gap today, even briefly?',
    exercise: { title: 'One breath', steps: ['Choose a situation that often irritates you: traffic, a queue, a particular message.', 'When it happens, take one deliberate breath before doing anything.', 'Note afterwards what you did with that breath.'] },
    scenarioId: 'p-traffic-horn',
  },
  {
    id: 'essay-listening', kind: 'essay', domain: 'speech', title: 'Listening Without Preparing a Defence', subtitle: 'Attention as a form of respect', minutes: 3,
    body: [
      'Much of what passes for listening is waiting. We hear the first part of a sentence, recognise where it is heading and begin drafting the reply. By the time the other person finishes, we are answering what we expected them to say.',
      'Real listening is quieter and harder. It means letting the other person finish, checking you have understood, and only then deciding what to say. It is especially difficult when the subject is you: your work, your choices, your behaviour.',
      'Listening fully does not mean agreeing. You can hear someone out completely and still disagree. But people who feel heard are far more able to hear you in return, and you will often find that what they meant was different from what you were preparing to answer.',
    ],
    example: { title: 'In ordinary life', text: 'Your teenager starts to complain about a family rule. You feel your reply forming. Instead you say, \u201cTell me more,\u201d and listen to the end. The complaint turns out to be about something else entirely.' },
    question: 'In which conversations do you start replying before the other person has finished?',
    exercise: { title: 'Reflect before replying', steps: ['In one conversation today, let the other person finish completely.', 'Before giving your view, say back in one sentence what you heard.', 'Notice whether they correct you.'] },
    scenarioId: 'n-misunderstood',
  },
  {
    id: 'essay-boundaries', kind: 'essay', domain: 'speech', title: 'Boundaries, Responsibility and Respect', subtitle: 'Equanimity is not passivity', minutes: 3,
    body: [
      'It is easy to mistake calm for compliance: the composed person who absorbs everything and never objects. That is not equanimity. It is often suppression wearing a peaceful face.',
      'A boundary is a clear statement of what you will and will not do. It is a form of responsibility: for your own time, energy and wellbeing. It is also a form of respect, because it tells others honestly where you stand rather than leaving them to guess or to discover your resentment later.',
      'Boundaries can be spoken warmly. They do not require the other person\u2019s agreement or a long justification. Practising awareness often makes them easier: when you are not reacting from hurt, you can say no without hostility, and raise how someone spoke to you without starting a fight.',
    ],
    example: { title: 'In ordinary life', text: 'A relative keeps commenting on your weight at gatherings. You have laughed it off for years. This time you say quietly, \u201cI\u2019d rather you didn\u2019t comment on my body,\u201d and change the subject. Nothing dramatic happens. Something has still changed.' },
    question: 'Where are you staying quiet when a clear, kind sentence would serve better?',
    exercise: { title: 'Draft one sentence', steps: ['Think of a situation where a limit keeps being crossed.', 'Write one short sentence that states the limit, with no apology and no accusation.', 'Read it aloud once. You do not have to use it yet.'] },
    scenarioId: 'w-saturday-move',
  },
  {
    id: 'essay-difficult-day', kind: 'essay', domain: 'effort', title: 'Learning from a Difficult Day', subtitle: 'Reflection without self-punishment', minutes: 3,
    body: [
      'Some days the practice disappears. You react, you assume, you say the thing you meant not to say. By evening it can feel as though nothing has been learned at all.',
      'A difficult day is not evidence of failure. It is information: about tiredness, about pressure, about which situations still pull hardest. Noticing afterwards is itself part of the practice. A month ago, you might not have noticed at all.',
      'The useful questions are practical and gentle. What were the conditions? When did it get harder? What is one small thing that might help next time? Questions like these turn a hard day into something you can use, rather than something you have to carry.',
    ],
    example: { title: 'In ordinary life', text: 'After a day of short temper, you open your journal and write only: \u201cTired. Snapped twice. Both times when hungry.\u201d That sentence is not a confession. It is a useful observation for tomorrow.' },
    question: 'What did a hard day recently teach you about your conditions?',
    exercise: { title: 'Three neutral notes', steps: ['At the end of a hard day, write three short observations about what happened.', 'Use no adjectives about yourself.', 'Add one small adjustment for tomorrow, or none at all.'] },
    scenarioId: 'e-tired-evening',
  },
  {
    id: 'essay-returning', kind: 'essay', domain: 'effort', title: 'Returning to Practice After a Lapse', subtitle: 'Beginning again, without a penalty', minutes: 3,
    body: [
      'Every practice lapses. A busy week becomes a busy month; the app goes unopened; the intentions stop being set. Then comes the second difficulty: the reluctance to return, because returning means admitting the gap.',
      'Equanim does not hold the gap against you. Nothing you practised before is erased, and there is nothing to catch up on. The only step that matters is the next one, and it can be very small: one intention, one scenario, one line in the journal.',
      'Lapses can be useful, too. They show what crowds out practice, and what you miss when it is gone. Coming back after a lapse is not starting over. It is the practice itself: noticing that you have drifted, and choosing to return.',
    ],
    example: { title: 'In ordinary life', text: 'You open Equanim after three weeks away and feel a flicker of guilt. Instead of planning a big restart, you set one intention for the day and close the app. It took a minute, and you are back.' },
    question: 'What usually crowds out practice for you, and what is the smallest way back?',
    exercise: { title: 'The one-minute return', steps: ['Choose the smallest possible practice: one intention, or one sentence in the journal.', 'Do only that today.', 'Tomorrow, decide whether to do the same again.'] },
    scenarioId: 'n-missed-commitment',
  },
];

export const LIBRARY_BY_ID: Record<string, LibraryItem> = Object.fromEntries(LIBRARY.map((i) => [i.id, i]));
