/**
 * Original daily orientation prompts. Selected by date so the same prompt does not return
 * for as many days as there are prompts.
 */
export const ORIENTATIONS: string[] = [
  'Between what happens and what you do, there is a moment. Today, look for it once.',
  'Which of today\u2019s conversations matters most? What would you like to bring to it?',
  'A fact is usually small. The story around it is usually large. Which will you meet first today?',
  'What are you expecting from today that you have not said out loud?',
  'Notice one thing today that you would normally hurry past.',
  'Who might be carrying something you cannot see? Let that soften one reply.',
  'Effort that fits the day is still effort. What fits today?',
  'Where are you likely to react on autopilot today? Picture it now, calmly.',
  'What would you say today if you only said what you meant?',
  'A silence is not yet a message. Can you leave one unexplained today?',
  'What is one thing you can finish properly, rather than many things partly?',
  'Which question have you been avoiding asking? Today might be the day.',
  'You do not have to win every exchange. Which one is worth your energy?',
  'If someone is short with you today, what else might be true?',
  'Rest is part of effort. Where will you allow a pause today?',
  'What did yesterday teach you that you could use this morning?',
  'Listen to one person today without preparing your reply.',
  'Before agreeing to something, check whether you can really do it.',
  'What would steadiness look like in the hardest part of your day?',
  'Notice the voice you use with yourself today. Is it accurate?',
  'Which of your conclusions about someone could do with another look?',
  'Something will go differently from the plan. How would you like to meet it?',
  'Is there a boundary you have been meaning to state? It can be stated kindly.',
  'What is yours to do today, and what is not?',
  'Take one moment today to notice your breathing before you speak.',
  'Praise and criticism both pass through. Let them pass a little more lightly today.',
  'What is the smallest honest step you could take on something you have been putting off?',
  'When you feel the urge to defend yourself today, get curious first.',
  'Imagine the end of today. What would you like to have noticed?',
  'A difficult moment today will be information, not a verdict.',
];

export function orientationFor(dayNumber: number): string {
  return ORIENTATIONS[((dayNumber % ORIENTATIONS.length) + ORIENTATIONS.length) % ORIENTATIONS.length] as string;
}
