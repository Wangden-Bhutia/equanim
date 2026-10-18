import type { DomainId } from '../lib/types';

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
  // ---- Four domain sections ----
  {
    id: 'section-words', kind: 'section', domain: 'words', title: 'The weight of words', subtitle: 'Speaking with care and integrity', minutes: 4,
    body: [
      'Most of what we say is said quickly. A sentence forms, and before we have weighed it, it is out in the world, doing whatever it does. Speech feels light because it costs so little to produce. Its effects are rarely light.',
      'Careful speech is not the same as polite speech. A polite sentence can be untrue, and a blunt one can be accurate. Care here means three things: that what you say is as true as you can make it, that it is yours to say, and that it is said for a reason you would be willing to name.',
      'The same care applies to the voice that speaks inwards. We narrate our own lives constantly, and that narration shapes what we believe about ourselves. A careless inner sentence repeated a thousand times becomes a conviction.',
      'Integrity of speech also shows in small promises. Each \u201cI\u2019ll do it\u201d that is not done teaches others, and you, that your words are approximate. Fewer, truer commitments tend to build more trust than many hopeful ones.',
    ],
    example: { title: 'A small example', text: 'Asked to join a project you have no time for, you notice the yes forming. You pause and say, \u201cI can\u2019t take it on properly this month. I could review the plan once it\u2019s drafted.\u201d It is less than they hoped for, and it is true.' },
    question: 'Which of your words today were said on autopilot?',
    exercise: { title: 'The three-question pause', steps: ['Choose one conversation today that matters to you.', 'Before an important sentence, ask silently: is it true, is it mine to say, and why am I saying it?', 'Afterwards, note in your journal whether the pause changed anything.'] },
    scenarioId: 'w-borrowed-complaint',
  },
  {
    id: 'section-perspective', kind: 'section', domain: 'perspective', title: 'What happened, and what it meant', subtitle: 'Separating events from the meaning added', minutes: 4,
    body: [
      'Something happens: a message, a look, a tone of voice. Almost instantly, a meaning arrives with it. He is annoyed with me. She thinks I am incompetent. They do not respect me. The event and the meaning arrive together so quickly that they feel like one thing.',
      'They are not one thing. The event is usually small and observable. The meaning is a story, built from memory, mood and old fears. It may be accurate, but it has not yet earned that status.',
      'Other people act from inside their own lives. Their tiredness, worries, histories and habits shape what they say far more than anything about you. A sharp remark often reflects the speaker\u2019s day. This works in both directions: praise, too, is partly about the person giving it.',
      'Seeing this does not mean ignoring how others treat you. It means you can respond to what actually happened, rather than to the largest story available, and choose when a behaviour genuinely needs addressing.',
    ],
    example: { title: 'A small example', text: 'A friend cancels plans with a one-line message. The first story is \u201cshe doesn\u2019t value me.\u201d You write down the fact instead: \u201cShe cancelled, by text, two hours before.\u201d Then you notice how much of the hurt came from the first sentence, not the second.' },
    question: 'What did you observe today, and what meaning did you add to it?',
    exercise: { title: 'Two columns', steps: ['Think of one moment today that stung.', 'In one column, write only what a camera would have recorded.', 'In the other, write what you concluded from it.', 'Ask which column you have been reacting to.'] },
    scenarioId: 'p-one-word-reply',
  },
  {
    id: 'section-assumptions', kind: 'section', domain: 'assumptions', title: 'The stories that fill the gaps', subtitle: 'Checking before acting', minutes: 4,
    body: [
      'The mind does not like empty spaces. Give it a silence, a delay or an ambiguous instruction and it will fill the gap with a story, often a confident one and often an unflattering one.',
      'Assumptions are useful. We cannot check everything, and most of our guesses about the world are good enough. The trouble comes when a guess is treated as a fact and then acted upon: the cold reply, the withdrawn friendship, the evening spent preparing for a catastrophe that never arrives.',
      'The practice is simple to describe and hard to do: notice when you are treating something as known that you have not checked, and, where it matters, ask. A short question costs a little pride and saves a great deal of misunderstanding.',
      'There is a quieter form of assumption too: expecting others to know what you need without telling them. Saying what you want plainly can feel exposing. It is also the only reliable way to be understood.',
    ],
    example: { title: 'A small example', text: 'Your manager says \u201cLet\u2019s talk tomorrow.\u201d You feel the familiar dread and start planning a defence. Instead, you reply: \u201cSure. Anything I should prepare?\u201d The answer is a routine planning question.' },
    question: 'What are you treating as known that you have not checked?',
    exercise: { title: 'Name the leap', steps: ['When you notice a strong conclusion about someone, stop.', 'Write: \u201cWhat I know is\u2026\u201d and \u201cWhat I am assuming is\u2026\u201d.', 'Add two other explanations that would fit the facts.', 'Decide whether this one is worth asking about.'] },
    scenarioId: 'a-quick-summary',
  },
  {
    id: 'section-effort', kind: 'section', domain: 'effort', title: 'Enough for today', subtitle: 'Sincere effort without perfectionism', minutes: 4,
    body: [
      'Effort is not a fixed quantity. What you can give on a rested morning is different from what you can give with a fever, after bad news or at the end of a long week. A sincere effort is measured against the day you actually have.',
      'Perfectionism looks like high standards, but it often works as protection: if the work is never finished, it can never be judged. Real standards include knowing when something is good enough for its purpose, and stopping there.',
      'Effort also has limits in breadth. Spread across too many commitments, even great energy becomes thin. Choosing where to put effort, and declining what you cannot do well, is part of doing your best rather than its opposite.',
      'Finally, effort that comes from self-punishment rarely lasts. Mistakes and low days are information about conditions, not verdicts about character. The question after a hard day is not \u201cwhy did I fail?\u201d but \u201cwhat would help tomorrow?\u201d',
    ],
    example: { title: 'A small example', text: 'You planned a long walk but slept badly. Instead of skipping it with guilt or forcing a full hour, you walk for fifteen minutes and notice the trees. It was smaller than planned, and it was real.' },
    question: 'What would a sincere effort look like with the energy you have right now?',
    exercise: { title: 'Define done', steps: ['Pick one task you have been avoiding or over-polishing.', 'Write one sentence describing what \u201cgood enough for its purpose\u201d means.', 'Work until you meet that sentence, then stop.', 'Notice what it felt like to stop on purpose.'] },
    scenarioId: 'e-tired-evening',
  },

  // ---- Seven essays ----
  {
    id: 'essay-space-between', kind: 'essay', domain: 'perspective', title: 'The space between', subtitle: 'On the gap between event and response', minutes: 3,
    body: [
      'Between something happening and our response to it, there is a gap. Usually it is so small we never notice it. The horn sounds and we are already angry. The criticism lands and we are already defending.',
      'Practice does not remove reactions. The jolt of anger or hurt will still arrive; it is the body doing its job. What practice can change is the width of the gap after the jolt, the moment in which you notice what is happening before you act on it.',
      'That moment does not need to be long. A single breath is often enough to change a reply. Over time, noticing becomes a little quicker, and the gap a little wider. This is not detachment from life. It is being present enough to choose.',
    ],
    example: { title: 'In ordinary life', text: 'A colleague interrupts you for the third time. You feel the heat rise. You notice it, take one breath and say, \u201cI\u2019d like to finish this point.\u201d The sentence is firm and calm because it came after the breath, not before it.' },
    question: 'Where did you notice the gap today, even briefly?',
    exercise: { title: 'One breath', steps: ['Choose a situation that often irritates you: traffic, a queue, a particular message.', 'When it happens, take one deliberate breath before doing anything.', 'Note afterwards what you did with that breath.'] },
    scenarioId: 'p-traffic-horn',
  },
  {
    id: 'essay-facts-stories-feelings', kind: 'essay', domain: 'assumptions', title: 'Facts, stories and feelings', subtitle: 'Three things that arrive together', minutes: 3,
    body: [
      'In most difficult moments, three things arrive at once: what happened, what we tell ourselves about it, and how we feel. Because they arrive together, they feel like a single experience.',
      'Pulling them apart is surprisingly clarifying. The fact is usually small: a delay, a sentence, a look. The story is usually large: about intentions, character, the future. The feeling is real, but it is responding to the story at least as much as to the fact.',
      'None of this makes feelings wrong. It simply gives you more places to stand. You can acknowledge the feeling, question the story and respond to the fact. That is a much wider set of options than reacting to all three as one.',
    ],
    example: { title: 'In ordinary life', text: 'Fact: your partner forgot to call at lunch. Story: \u201cI am not a priority.\u201d Feeling: hurt. Separating them, you see the hurt is mostly about the story, and decide to mention the call simply, without the story attached.' },
    question: 'Which of the three, fact, story or feeling, do you tend to skip past?',
    exercise: { title: 'Three lines', steps: ['Think of one moment from today that stayed with you.', 'Write one line each: the fact, the story, the feeling.', 'Read the story line again and ask how certain you are of it.'] },
    scenarioId: 'a-seen-no-reply',
  },
  {
    id: 'essay-boundary-not-wall', kind: 'essay', domain: 'words', title: 'A boundary is not a wall', subtitle: 'Equanimity is not passivity', minutes: 3,
    body: [
      'It is easy to misunderstand calm as compliance: the composed person who absorbs everything and never objects. That is not equanimity. It is often suppression wearing a peaceful face.',
      'A boundary is a clear statement of what you will and will not do. It can be spoken warmly. It does not require the other person to agree, and it does not need a long justification. \u201cI can\u2019t help this Saturday\u201d is a complete sentence.',
      'Practising awareness often makes boundaries easier, not harder. When you are not reacting from hurt, you can say no without hostility, and raise how someone spoke to you without starting a fight. The calm is what makes the clarity possible.',
    ],
    example: { title: 'In ordinary life', text: 'A relative keeps commenting on your weight at gatherings. You have laughed it off for years. This time you say quietly, \u201cI\u2019d rather you didn\u2019t comment on my body,\u201d and change the subject. Nothing dramatic happens. Something has still changed.' },
    question: 'Where are you staying quiet when a clear, kind sentence would serve better?',
    exercise: { title: 'Draft one sentence', steps: ['Think of a situation where a limit keeps being crossed.', 'Write one short sentence that states the limit, with no apology and no accusation.', 'Read it aloud once. You do not have to use it yet.'] },
    scenarioId: 'w-saturday-move',
  },
  {
    id: 'essay-inner-voice', kind: 'essay', domain: 'words', title: 'The voice you speak to yourself in', subtitle: 'Careful speech, turned inwards', minutes: 3,
    body: [
      'Most people speak to themselves in a voice they would never use with a friend. \u201cIdiot.\u201d \u201cYou always ruin this.\u201d \u201cWhat is wrong with you?\u201d The voice sounds like conscience, but it rarely helps anything get better.',
      'Harsh self-talk confuses accountability with punishment. Accountability looks at what happened and what to do next. Punishment looks at who you are and finds you lacking. Only one of them tends to produce change.',
      'The practice is not to replace harshness with empty praise. It is accuracy. \u201cI forgot the meeting\u201d is accurate. \u201cI am hopeless\u201d is not. Accurate inner speech is steadier, and it leaves more energy for repair.',
    ],
    example: { title: 'In ordinary life', text: 'You snap at your child and immediately think, \u201cI\u2019m a terrible parent.\u201d You restate it: \u201cI was tired and I snapped. I\u2019ll apologise and get to bed earlier.\u201d Both sentences take the event seriously. Only the second one helps.' },
    question: 'What is one sentence your inner voice repeats? Is it accurate?',
    exercise: { title: 'Restate it', steps: ['Catch one harsh inner sentence today.', 'Write it down exactly.', 'Rewrite it as a factual description plus one next step.'] },
    scenarioId: 'w-inner-voice',
  },
  {
    id: 'essay-difficult-days', kind: 'essay', domain: 'effort', title: 'On difficult days', subtitle: 'Reflection without self-punishment', minutes: 3,
    body: [
      'Some days the practice disappears. You react, you assume, you say the thing you meant not to say. By evening it can feel as though nothing has been learned at all.',
      'A difficult day is not evidence of failure. It is information: about tiredness, about pressure, about which situations still pull hardest. Noticing afterwards is itself part of the practice. A week ago, you might not have noticed at all.',
      'This app will never count a missed day against you. Progress here is not a line that must always rise. It is the slow accumulation of moments in which you saw a little more clearly, and those remain yours whatever tomorrow brings.',
    ],
    example: { title: 'In ordinary life', text: 'After a day of short temper, you open your journal and write only: \u201cTired. Snapped twice. Both times when hungry.\u201d That sentence is not a confession. It is a useful observation for tomorrow.' },
    question: 'What did a hard day recently teach you about your conditions?',
    exercise: { title: 'Three neutral notes', steps: ['At the end of a hard day, write three short observations about what happened.', 'Use no adjectives about yourself.', 'Add one small adjustment for tomorrow, or none at all.'] },
    scenarioId: 'e-tired-evening',
  },
  {
    id: 'essay-habit-speed', kind: 'essay', domain: 'perspective', title: 'Habits move faster than thought', subtitle: 'Observing automatic reactions', minutes: 3,
    body: [
      'Much of how we respond is habit: grooves worn by years of repetition. The defensive reply, the immediate apology, the urge to check the phone when uncomfortable. They are fast because they do not wait for thought.',
      'You cannot think your way out of a habit in the moment it fires. What you can do is notice it, first afterwards, then during, and eventually just before. Each stage is real progress, even the first one.',
      'Observation works better than resistance. When you fight a habit, it tends to push back. When you watch it with curiosity, asking when it appears and what it protects, it often loosens by itself. Habits that are seen clearly have less power than habits that run in the dark.',
    ],
    example: { title: 'In ordinary life', text: 'You notice that whenever someone disagrees with you, you start talking faster. You do not try to stop it yet. For a week, you just notice when it happens. By the end of the week, you catch it mid-sentence once.' },
    question: 'Which of your reactions are fastest? When do they appear?',
    exercise: { title: 'Habit log', steps: ['Choose one automatic reaction you would like to understand.', 'For three days, note each time you notice it, even afterwards.', 'Look for the common situation, feeling or time of day.'] },
    scenarioId: 'w-group-chat',
  },
  {
    id: 'essay-asking', kind: 'essay', domain: 'assumptions', title: 'Asking instead of guessing', subtitle: 'The courage of a simple question', minutes: 3,
    body: [
      'Asking can feel like admitting weakness. If I ask what you meant, perhaps I should have known. If I ask whether you are upset, perhaps I look insecure. So we guess, and act on the guess.',
      'Yet a well-placed question is one of the most efficient tools available. It replaces hours of interpretation with a few seconds of information. It also signals care: you are interested enough in what the other person actually thinks to find out.',
      'Not every uncertainty needs a question. Some are small enough to let go. The skill is noticing which assumptions you are about to act on, and checking those ones before you do.',
    ],
    example: { title: 'In ordinary life', text: 'A friend seems distant at dinner. You could decide she is annoyed with you. Instead, on the walk home, you ask, \u201cYou seemed quiet tonight. Everything all right?\u201d Her mother is unwell. The evening looks completely different.' },
    question: 'What question have you been avoiding asking?',
    exercise: { title: 'One question', steps: ['Identify one assumption you are currently acting on.', 'Write the simplest question that would test it.', 'If it is appropriate, ask it in the next day or two.'] },
    scenarioId: 'a-lunch-photo',
  },
];

export const LIBRARY_BY_ID: Record<string, LibraryItem> = Object.fromEntries(LIBRARY.map((i) => [i.id, i]));
