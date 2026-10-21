import type { DomainId } from '../../types';
import type { Choice } from '../programme';

/** Twelve mixed situations for Week 5, each needing two or more skills together. Original writing. */
export interface IntegrationScenario { id: string; domains: DomainId[]; situation: string; question: string; options: Choice[]; answerId: string }

const s = (id: string, domains: DomainId[], situation: string, question: string, answerId: string, options: [string, string, string][]): IntegrationScenario => ({
  id, domains, situation, question, answerId, options: options.map(([oid, text, feedback]) => ({ id: oid, text, feedback })),
});

export const INTEGRATION: IntegrationScenario[] = [
  s('ix-1', ['personalisation', 'inquiry'], 'Your team lead schedules a one-to-one with no agenda, the day after you missed a deadline.', 'What combines the skills best?', 'b', [
    ['a', 'Prepare an apology for everything you might have done wrong.', 'This acts on the worst story before checking it, and costs you an evening.'],
    ['b', 'Notice the story ("I\'m in trouble"), then ask what the meeting is about.', 'Yes. You notice the meaning you added, then check it with one question.'],
    ['c', 'Decide it has nothing to do with the deadline.', 'That is also a guess. It may be about the deadline, and that is fine to find out.'],
  ]),
  s('ix-2', ['speech', 'effort'], 'A friend asks you to help them move house this weekend. You have promised yourself a rest after a very long month.', 'Which response fits both skills?', 'c', [
    ['a', 'Say yes and quietly resent it.', 'Your words and your capacity don\'t match, which tends to cost both of you.'],
    ['b', 'Ignore the message until the weekend is over.', 'Silence avoids the conversation but leaves your friend guessing.'],
    ['c', '"I need this weekend to rest. I could help for two hours next Saturday, if that helps."', 'Yes. Clear and kind, honest about capacity, and still helpful.'],
  ]),
  s('ix-3', ['personalisation', 'speech'], 'At a family dinner, an aunt says, "Still not married? Your cousin has two children already."', 'What combines the skills best?', 'a', [
    ['a', 'Notice the sting, see it as her worry speaking, and answer briefly and warmly.', 'Yes. You keep your worth separate from her comment, and your words calm.'],
    ['b', 'Explain at length why your life choices are valid.', 'A long defence often treats the comment as a verdict you must overturn.'],
    ['c', 'Make a sharp comment about her own family.', 'It may feel satisfying, but it fails the "needed" and "kind" checks.'],
  ]),
  s('ix-4', ['inquiry', 'speech'], 'A colleague tells you that another colleague called your presentation "a mess" in a meeting you weren\'t at.', 'What combines the skills best?', 'b', [
    ['a', 'Confront the second colleague in front of the team.', 'Acting publicly on second-hand words risks a scene built on a misquote.'],
    ['b', 'Treat it as unconfirmed, and if it matters, ask them privately for their feedback.', 'Yes. You check the facts, and your words are direct and private.'],
    ['c', 'Tell others what you heard, to get them on your side.', 'This spreads an unconfirmed report and fails the "mine to say" check.'],
  ]),
  s('ix-5', ['effort', 'personalisation'], 'You put weeks into a community event. Attendance is low, and someone posts "bit of a flop" in the group chat.', 'What combines the skills best?', 'c', [
    ['a', 'Decide you are no good at organising things.', 'One event and one comment have become a verdict on your abilities.'],
    ['b', 'Reply defensively in the chat.', 'Replying in the heat of it often makes the story bigger.'],
    ['c', 'Separate the comment from your worth, then note one thing that helped and one to change.', 'Yes. You keep the comment in proportion and learn from the event.'],
  ]),
  s('ix-6', ['inquiry', 'effort'], 'Your manager says a task is "urgent". You are already working late most nights.', 'What combines the skills best?', 'a', [
    ['a', 'Ask what "urgent" means and what can move, then plan a sustainable version.', 'Yes. You check the assumption and stay honest about capacity.'],
    ['b', 'Assume it means tonight and stay until midnight.', 'You may be right, but you may be burning energy on a guess.'],
    ['c', 'Ignore the word "urgent", since everything is urgent.', 'Dismissing it is also a guess. A quick question settles it.'],
  ]),
  s('ix-7', ['speech', 'personalisation'], 'Your partner snaps at you after a long day. You feel the urge to snap back.', 'What combines the skills best?', 'b', [
    ['a', 'Snap back so they know how it feels.', 'Matching the tone usually escalates, and it may not reflect what you mean.'],
    ['b', 'Notice it may be about their day, and say: "That came out sharp. Rough day?"', 'Yes. You don\'t take on the whole weight of it, and your words are honest and calm.'],
    ['c', 'Say nothing and stay hurt all evening.', 'Staying silent with a hurt story leaves it unexamined.'],
  ]),
  s('ix-8', ['inquiry', 'personalisation', 'speech'], 'A friend hasn\'t replied to your last three messages, but is posting online.', 'What combines the skills best?', 'c', [
    ['a', 'Post something pointed so they notice.', 'Indirect messages are easy to misread and often add distance.'],
    ['b', 'Conclude the friendship is over and stop contacting them.', 'A large conclusion from silence, before checking.'],
    ['c', 'Notice the story, then send one warm, direct message asking how they are.', 'Yes. You check rather than assume, and your words leave the door open.'],
  ]),
  s('ix-9', ['effort', 'speech'], 'You realise you promised two people help on the same afternoon.', 'What combines the skills best?', 'a', [
    ['a', 'Tell one of them now, apologise once, and offer another time.', 'Yes. Early honesty and a real alternative keep your word as far as you can.'],
    ['b', 'Try to do both, rushing each.', 'Both people get less than you promised, and you are stretched thin.'],
    ['c', 'Hope one of them cancels.', 'Hoping puts off a conversation that will be harder later.'],
  ]),
  s('ix-10', ['personalisation', 'effort'], 'Your manager praises a colleague\'s work in the team meeting but says nothing about yours, which you worked hard on.', 'What combines the skills best?', 'b', [
    ['a', 'Decide your work isn\'t valued and do the minimum from now on.', 'Silence has become a verdict, and the response hurts you most.'],
    ['b', 'Notice the sting, remember you can\'t read silence, and judge your work by your own definition of done.', 'Yes. Your effort is measured by you, not by one meeting.'],
    ['c', 'Point out your own work loudly in the meeting.', 'Asking for recognition can be fine, but doing it from a sting rarely lands well.'],
  ]),
  s('ix-11', ['inquiry', 'speech', 'effort'], 'A family member asks you to organise a relative\'s birthday. You assume they expect a big party, and you\'re overwhelmed.', 'What combines the skills best?', 'c', [
    ['a', 'Plan the big party anyway and exhaust yourself.', 'You may be working towards an expectation nobody actually holds.'],
    ['b', 'Refuse outright to avoid the stress.', 'This may be right, but you haven\'t yet checked what is actually wanted.'],
    ['c', 'Ask what they have in mind, then say clearly what you can manage.', 'Yes. Check the assumption, then be honest about your capacity.'],
  ]),
  s('ix-12', ['personalisation', 'inquiry', 'speech', 'effort'], 'You make a visible mistake at work, your manager is curt about it, and you have to update the team.', 'What combines the skills best?', 'a', [
    ['a', 'Notice the sting, check what is actually needed, tell the team the facts and the fix, and do a calm review later.', 'Yes. All four skills: proportion, checking, honest words and steady effort.'],
    ['b', 'Apologise repeatedly to everyone and work all night to make up for it.', 'Over-apologising and overwork treat one mistake as a verdict.'],
    ['c', 'Play it down so nobody notices.', 'Hiding it fails the accuracy check and often makes the fix harder.'],
  ]),
];
export const INTEGRATION_BY_ID: Record<string, IntegrationScenario> = Object.fromEntries(INTEGRATION.map((x) => [x.id, x]));
