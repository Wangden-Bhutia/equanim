import type { RetrievalQuestion } from '../programme';

/**
 * Retrieval questions for the whole programme: 16 per skill (Personalisation adds 10 to the 6 in programme.ts).
 * Every option carries feedback, and every wrong answer explains why. Original writing.
 */
type Q = RetrievalQuestion;
const q = (id: string, domain: Q['domain'], level: Q['level'], question: string, answerId: string, options: [string, string, string][]): Q => ({
  id, domain, level, question, answerId, options: options.map(([oid, text, feedback]) => ({ id: oid, text, feedback })),
});

const personalisation: Q[] = [
  q('rq-p-7', 'personalisation', 'easy', 'Which question best pulls the event apart from the meaning?', 'b', [
    ['a', '"Why does this always happen to me?"', 'This question assumes a pattern and a target. It tends to deepen the story rather than check it.'],
    ['b', '"What exactly happened, and what did I make it mean?"', 'Yes. Two separate questions: the facts, then the meaning.'],
    ['c', '"How do I stop caring?"', 'The aim is not to stop caring. It is to see more accurately what happened.'],
  ]),
  q('rq-p-8', 'personalisation', 'easy', 'Someone is curt with you at a shop counter. Which is a fair alternative explanation?', 'c', [
    ['a', 'They clearly dislike people like me.', 'That is a large conclusion from one short exchange. It is possible, but untested.'],
    ['b', 'I must have said something wrong.', 'Maybe, but this jumps straight to blaming yourself without any evidence.'],
    ['c', 'They may be at the end of a long, busy shift.', 'Yes. A plausible explanation that has nothing to do with you.'],
  ]),
  q('rq-p-9', 'personalisation', 'easy', 'What is the "meaning added" in: "He forgot my birthday, so I don\'t matter to him"?', 'a', [
    ['a', '"I don\'t matter to him."', 'Yes. The forgetting is the event; the verdict about your worth is the meaning.'],
    ['b', '"He forgot my birthday."', 'This is the event, the part a calendar could confirm.'],
    ['c', 'Both parts are facts.', 'Only the first part is checkable. The second is an interpretation, even if it feels true.'],
  ]),
  q('rq-p-10', 'personalisation', 'medium', 'You notice the story "they think I\'m incompetent". What is a useful next step?', 'b', [
    ['a', 'Argue with the story until it goes away.', 'Arguing often keeps the story at the centre. Checking it is usually lighter.'],
    ['b', 'Ask: what do I actually know, and what else might explain it?', 'Yes. You treat the story as a guess to check, not a fact to obey.'],
    ['c', 'Act as if it were true, to be safe.', 'Acting on an untested story can create the very problem you fear.'],
  ]),
  q('rq-p-11', 'personalisation', 'medium', 'A relative criticises your cooking at a family meal. Which response keeps both your dignity and accuracy?', 'c', [
    ['a', 'Silently decide never to cook for them again.', 'A big decision made in the heat of a moment, based on one comment.'],
    ['b', 'Tell yourself you are a bad cook.', 'One comment about one dish has become a verdict about you.'],
    ['c', 'Notice the sting, and take the comment as one opinion about one dish.', 'Yes. You feel it, you size it correctly, and you choose what to do next.'],
  ]),
  q('rq-p-12', 'personalisation', 'medium', 'Why can praise be personalised too?', 'a', [
    ['a', 'Because your worth can come to depend on it, so its absence hurts.', 'Yes. Leaning on praise for your sense of worth makes silence feel like criticism.'],
    ['b', 'Because praise is always insincere.', 'Not at all. Praise can be genuine and still not be the measure of you.'],
    ['c', 'It cannot; only criticism is personalised.', 'Both can be. Either way, someone else\'s reaction is being treated as a verdict on you.'],
  ]),
  q('rq-p-13', 'personalisation', 'medium', 'Which sign suggests you might be personalising?', 'b', [
    ['a', 'You can name what happened plainly.', 'That is a sign of the skill working, not of personalising.'],
    ['b', 'A small event leaves a big, lasting feeling about who you are.', 'Yes. When the size of the feeling outgrows the event, a meaning about you has often been added.'],
    ['c', 'You ask a question to understand.', 'Asking is a way out of personalising, not a sign of it.'],
  ]),
  q('rq-p-14', 'personalisation', 'hard', 'Someone really is treating you unfairly. What does freedom from personalisation suggest?', 'c', [
    ['a', 'Assume it is all in your head.', 'No. Sometimes the facts do show unfair treatment. The skill is accuracy, not denial.'],
    ['b', 'Accept it, because it is about them, not you.', 'Seeing that it is about them does not mean you must accept it.'],
    ['c', 'See it clearly, without making it a verdict on your worth, and decide how to respond.', 'Yes. You can name and address harm without letting it define you.'],
  ]),
  q('rq-p-15', 'personalisation', 'hard', 'You catch yourself replaying a comment at night. What is a helpful move?', 'a', [
    ['a', 'Write the facts in one line, then one other explanation, then put it down.', 'Yes. Writing it out once can stop the loop from repeating the same story.'],
    ['b', 'Keep replaying until you find the real meaning.', 'Replaying tends to strengthen one meaning rather than reveal the truth.'],
    ['c', 'Message the person immediately to settle it.', 'Late-night messages are often written by the story, not by you. Morning is usually wiser.'],
  ]),
  q('rq-p-16', 'personalisation', 'hard', 'Which statement best describes the skill after a few weeks?', 'b', [
    ['a', 'Nothing bothers you any more.', 'That is not the goal. Things will still sting; the skill is what happens next.'],
    ['b', 'You notice the added meaning sooner, and have more choice about what to do.', 'Yes. Earlier noticing and more choice, not the absence of feeling.'],
    ['c', 'You never think about what others think of you.', 'Caring what others think is human. The skill is not letting guesses decide your worth.'],
  ]),
];

const inquiry: Q[] = [
  q('rq-i-1', 'inquiry', 'easy', 'Which of these is something you know, rather than assume?', 'a', [
    ['a', 'The message says the meeting moved to 4 pm.', 'Yes. You can point to it.'],
    ['b', 'They moved it to inconvenience me.', 'That is a guess about intentions. You have not seen their reasons.'],
    ['c', 'Nobody else will come either.', 'A prediction, not something you know yet.'],
  ]),
  q('rq-i-2', 'inquiry', 'easy', 'What is the simplest tool of inquiry?', 'c', [
    ['a', 'Waiting until you are certain.', 'Certainty rarely comes. Inquiry is about checking, not waiting.'],
    ['b', 'Assuming the worst, to be prepared.', 'Preparing for the worst can be useful, but treating it as fact is not inquiry.'],
    ['c', 'Asking one clear question.', 'Yes. One honest question often replaces an hour of guessing.'],
  ]),
  q('rq-i-3', 'inquiry', 'easy', 'Your friend says "I\'m fine" in a flat voice. What is an inquiring response?', 'b', [
    ['a', 'Decide she is angry with you.', 'Possible, but untested. The flat voice could have many causes.'],
    ['b', '"You sound a bit flat. Is everything all right?"', 'Yes. You name what you noticed and ask, rather than conclude.'],
    ['c', 'Take "fine" at face value and forget it.', 'Sometimes fine is fine, but here you noticed something worth a gentle question.'],
  ]),
  q('rq-i-4', 'inquiry', 'easy', 'Which phrase marks a guess as a guess?', 'a', [
    ['a', '"My guess is…, but I don\'t know yet."', 'Yes. Labelling a guess keeps it open to checking.'],
    ['b', '"Obviously…"', '"Obviously" tends to close a question before it has been asked.'],
    ['c', '"Everyone knows…"', 'This presents an assumption as shared fact.'],
  ]),
  q('rq-i-5', 'inquiry', 'easy', 'What does the "not this" caveat for inquiry remind you?', 'c', [
    ['a', 'All conclusions are wrong.', 'No. Some conclusions are well supported.'],
    ['b', 'You must ask questions about everything.', 'Inquiry is for the moments that matter, not every detail of the day.'],
    ['c', 'Sometimes the facts do support the conclusion.', 'Yes. Inquiry is not ignoring evidence; it is checking it.'],
  ]),
  q('rq-i-6', 'inquiry', 'medium', 'Your manager asks to "have a quick word tomorrow". What is the most useful response to the worry?', 'b', [
    ['a', 'Prepare a defence for every possible complaint.', 'This treats a guess as a certainty and costs a whole evening.'],
    ['b', 'Notice the story, and ask what the conversation is about if it helps.', 'Yes. A simple question, or simply noticing the story, can save hours of worry.'],
    ['c', 'Avoid your manager until then.', 'Avoiding keeps the uncertainty alive and can create new problems.'],
  ]),
  q('rq-i-7', 'inquiry', 'medium', 'Which question tests an assumption rather than confirming it?', 'c', [
    ['a', '"Don\'t you think she was being rude?"', 'A leading question invites agreement rather than information.'],
    ['b', '"Why are you always late?"', '"Always" assumes a pattern; the question invites defence, not information.'],
    ['c', '"What would I expect to see if I were wrong about this?"', 'Yes. Looking for disconfirming evidence is the heart of inquiry.'],
  ]),
  q('rq-i-8', 'inquiry', 'medium', 'You hear second-hand that a colleague criticised you. What does inquiry suggest?', 'a', [
    ['a', 'Treat it as unconfirmed, and check directly if it matters.', 'Yes. Second-hand accounts lose and add detail on the way.'],
    ['b', 'Confront the colleague with what you heard.', 'Confronting on unconfirmed information can damage trust on all sides.'],
    ['c', 'Believe it, since someone took the trouble to tell you.', 'The teller may be sincere and still have it wrong.'],
  ]),
  q('rq-i-9', 'inquiry', 'medium', 'Why do we fill gaps with guesses so quickly?', 'b', [
    ['a', 'Because we are careless.', 'It is not a character flaw. Everyone does it.'],
    ['b', 'Because uncertainty is uncomfortable, and a story feels better than not knowing.', 'Yes. The mind prefers a quick answer, even a painful one, to an open question.'],
    ['c', 'Because our guesses are usually right.', 'Sometimes they are. The point is that we rarely check.'],
  ]),
  q('rq-i-10', 'inquiry', 'medium', 'Your partner hasn\'t replied for hours. Which is the inquiring thought?', 'c', [
    ['a', '"They\'re ignoring me."', 'This is one possible story, presented as fact.'],
    ['b', '"Something terrible has happened."', 'Possible but unlikely, and it is still a guess.'],
    ['c', '"I don\'t know why yet. What are the likely reasons?"', 'Yes. You hold the uncertainty and list possibilities.'],
  ]),
  q('rq-i-11', 'inquiry', 'medium', 'Which is a good clarifying question at work?', 'a', [
    ['a', '"When you say urgent, do you mean today or this week?"', 'Yes. Specific, neutral, and it saves a wrong guess.'],
    ['b', '"Why didn\'t you explain this properly?"', 'This carries blame, which makes an honest answer less likely.'],
    ['c', '"I suppose you want it perfect, as usual?"', 'Sarcasm turns a question into an accusation.'],
  ]),
  q('rq-i-12', 'inquiry', 'hard', 'You have checked, and the facts do support the worrying conclusion. What now?', 'b', [
    ['a', 'Keep looking for reasons it might not be true.', 'Inquiry is not endless doubt. Once the facts are clear, act on them.'],
    ['b', 'Accept what the facts show, and decide on a sensible response.', 'Yes. Inquiry led you to an accurate picture; now you can act on it.'],
    ['c', 'Blame yourself for not knowing sooner.', 'Finding out is the purpose of inquiry. Knowing now is better than not knowing.'],
  ]),
  q('rq-i-13', 'inquiry', 'hard', 'You catch yourself predicting how a family discussion will go. What is the most helpful stance?', 'c', [
    ['a', 'Rehearse every argument in advance.', 'Some preparation helps, but over-rehearsing tends to lock in the prediction.'],
    ['b', 'Skip the discussion, since you know how it will go.', 'You know how you predict it will go. That is different from knowing.'],
    ['c', 'Hold the prediction lightly and go in curious about what they actually think.', 'Yes. Curiosity leaves room for the conversation to surprise you.'],
  ]),
  q('rq-i-14', 'inquiry', 'hard', 'Asking feels risky because you might hear something unwelcome. What does inquiry offer?', 'a', [
    ['a', 'An accurate picture you can act on, even if it is uncomfortable.', 'Yes. An unwelcome fact is usually easier to handle than an imagined one.'],
    ['b', 'A guarantee that the answer will be good.', 'No such guarantee exists. Inquiry offers accuracy, not comfort.'],
    ['c', 'A way to avoid difficult feelings.', 'It can sometimes create them. It still tends to lead to better decisions.'],
  ]),
  q('rq-i-15', 'inquiry', 'hard', 'Which question is most likely to get an honest answer?', 'b', [
    ['a', '"You\'re not upset with me, are you?"', 'This invites the answer you hope for, not necessarily the true one.'],
    ['b', '"I noticed you went quiet after the meeting. How did it land for you?"', 'Yes. You describe what you saw and ask an open question without blame.'],
    ['c', '"What is wrong with you today?"', 'This frames the other person as the problem, which invites defence.'],
  ]),
  q('rq-i-16', 'inquiry', 'hard', 'When is it reasonable not to ask?', 'c', [
    ['a', 'Never. You should always ask.', 'Asking about everything is tiring for everyone and not what inquiry means.'],
    ['b', 'Whenever asking feels awkward.', 'Awkwardness alone is not a good reason. Many useful questions feel awkward.'],
    ['c', 'When it does not matter much, or asking could put you at risk.', 'Yes. Choose the moments that matter, and keep yourself safe.'],
  ]),
];

const speech: Q[] = [
  q('rq-s-1', 'speech', 'easy', 'What are the three quick checks before you say something charged?', 'a', [
    ['a', 'Is it accurate? Is it needed? Is it mine to say?', 'Yes. Three short questions that catch most regrets.'],
    ['b', 'Is it clever? Is it funny? Will they agree?', 'These are about effect, not integrity.'],
    ['c', 'Is it polite? Is it short? Is it safe?', 'Politeness matters, but it can hide inaccuracy.'],
  ]),
  q('rq-s-2', 'speech', 'easy', 'Which is a clear, kind no?', 'b', [
    ['a', '"Maybe, let me see…" (meaning no)', 'Vague answers often lead to more pressure later.'],
    ['b', '"I can\'t do it this time, but thank you for asking."', 'Yes. Clear, warm and short. No long justification needed.'],
    ['c', '"I can\'t, because I\'m so busy with everything and also…"', 'A long list of reasons invites negotiation.'],
  ]),
  q('rq-s-3', 'speech', 'easy', 'You made a mistake at work. Which self-talk is accurate and useful?', 'c', [
    ['a', '"I\'m hopeless."', 'A verdict on yourself, not a description of what happened.'],
    ['b', '"It doesn\'t matter at all."', 'It may matter. Pretending it doesn\'t can stop you fixing it.'],
    ['c', '"I sent the wrong file. Next step: send the right one and say so."', 'Yes. A fact plus a next step.'],
  ]),
  q('rq-s-4', 'speech', 'easy', 'What does the "not this" caveat for speech remind you?', 'a', [
    ['a', 'Integrity does not mean disclosing everything, or being harsh.', 'Yes. You can be truthful and private, honest and kind.'],
    ['b', 'Honesty means saying whatever you think.', 'That confuses honesty with having no filter.'],
    ['c', 'It is better to say nothing at all.', 'Silence can be wise, but integrity is not avoiding speech.'],
  ]),
  q('rq-s-5', 'speech', 'easy', 'Which is gossip rather than a needed conversation?', 'b', [
    ['a', 'Telling a manager about a safety problem caused by a colleague.', 'This is needed and yours to raise.'],
    ['b', 'Sharing a friend\'s private trouble to explain why they seem off.', 'Yes. It is not yours to share, even with good intentions.'],
    ['c', 'Asking a friend for advice about your own conflict, without names.', 'Seeking advice about your own situation is reasonable.'],
  ]),
  q('rq-s-6', 'speech', 'medium', 'You want to raise a problem with a flatmate. Which opening is most likely to help?', 'c', [
    ['a', '"You never clean up after yourself."', '"Never" invites a defence instead of a conversation.'],
    ['b', '"Some people around here are messy."', 'Indirect hints are easy to miss and can feel passive-aggressive.'],
    ['c', '"The dishes have been in the sink since Monday. Can we sort out a plan?"', 'Yes. A specific fact and an invitation.'],
  ]),
  q('rq-s-7', 'speech', 'medium', 'You said yes and now realise you can\'t keep the promise. What fits integrity of speech?', 'a', [
    ['a', 'Tell them early, say what you can do instead, and apologise once.', 'Yes. Early, honest, and with an alternative.'],
    ['b', 'Say nothing and hope it is forgotten.', 'Silence usually makes the broken promise worse.'],
    ['c', 'Invent a reason that sounds better.', 'An invented reason trades one problem for another.'],
  ]),
  q('rq-s-8', 'speech', 'medium', 'Why does "accurate" come first in the three checks?', 'b', [
    ['a', 'Because accuracy is more important than kindness.', 'They work together. Accuracy comes first because inaccurate words cannot be kind for long.'],
    ['b', 'Because a statement that isn\'t accurate fails before the other questions matter.', 'Yes. If it is not accurate, whether it is needed is beside the point.'],
    ['c', 'Because it is the easiest one.', 'It is often the hardest, especially about yourself.'],
  ]),
  q('rq-s-9', 'speech', 'medium', 'You feel the urge to complain about someone who isn\'t present. What is a good check?', 'c', [
    ['a', '"Will this make me look good?"', 'This is about image, not about whether it is fair.'],
    ['b', '"Has anyone else noticed?"', 'Agreement does not make it accurate or needed.'],
    ['c', '"Would I say this, in this way, if they were here?"', 'Yes. A quick test of fairness and of whether it is yours to say.'],
  ]),
  q('rq-s-10', 'speech', 'medium', 'Which apology is the most complete?', 'a', [
    ['a', '"I interrupted you twice in the meeting. I\'m sorry. I\'ll wait until you\'ve finished."', 'Yes. It names what happened, owns it, and says what will change.'],
    ['b', '"Sorry if you felt interrupted."', '"If you felt" moves the problem onto their feelings.'],
    ['c', '"Sorry, but you were taking a long time."', 'The "but" cancels the apology.'],
  ]),
  q('rq-s-11', 'speech', 'medium', 'Someone asks your honest opinion of their work, and you have concerns. What fits?', 'b', [
    ['a', 'Say it is great to avoid hurting them.', 'Kind in the moment, but it denies them useful information they asked for.'],
    ['b', 'Name one real strength and one specific thing to improve.', 'Yes. Honest, specific and usable.'],
    ['c', 'List everything that is wrong, to be thorough.', 'Thoroughness without care can bury the useful point.'],
  ]),
  q('rq-s-12', 'speech', 'hard', 'You are angry and about to send a message. What is the most useful step?', 'c', [
    ['a', 'Send it now, while the feeling is honest.', 'The feeling is honest. The words written in it may not be accurate.'],
    ['b', 'Delete it and never raise the issue.', 'The issue may still need raising, just not in this form.'],
    ['c', 'Write it, wait, then reread it with the three checks before sending.', 'Yes. You keep what is true and needed, and lose what is not.'],
  ]),
  q('rq-s-13', 'speech', 'hard', 'Your inner voice says "you always mess things up". What does integrity of speech suggest?', 'a', [
    ['a', 'Apply the same accuracy check to self-talk as to speech.', 'Yes. "Always" is rarely accurate, about anyone, including you.'],
    ['b', 'Replace it with "I am perfect".', 'That is not accurate either. The aim is accuracy, not flattery.'],
    ['c', 'Ignore your inner voice completely.', 'Ignoring it rarely works. Checking it usually works better.'],
  ]),
  q('rq-s-14', 'speech', 'hard', 'A family member asks something you would rather keep private. What fits integrity?', 'b', [
    ['a', 'Tell a small lie to end the conversation.', 'It may work once, but lies tend to need maintenance.'],
    ['b', '"I\'d rather keep that to myself for now."', 'Yes. Truthful and private. Integrity does not require disclosure.'],
    ['c', 'Tell them everything to avoid seeming secretive.', 'Privacy is not dishonesty. You can choose what to share.'],
  ]),
  q('rq-s-15', 'speech', 'hard', 'You said something unkind in the heat of a moment. Which repair is most likely to help?', 'c', [
    ['a', 'Wait for them to bring it up.', 'They may never raise it, and the hurt may grow.'],
    ['b', 'Explain why they deserved it.', 'Justifying it reopens the wound.'],
    ['c', 'Name what you said, apologise without "but", and leave room for their response.', 'Yes. A short, clean repair that does not demand forgiveness.'],
  ]),
  q('rq-s-16', 'speech', 'hard', 'When is silence the right choice?', 'a', [
    ['a', 'When speaking would not be accurate, needed or yours to say.', 'Yes. Choosing not to speak can itself be integrity.'],
    ['b', 'Whenever speaking feels uncomfortable.', 'Discomfort alone is not a reason. Some needed things are uncomfortable to say.'],
    ['c', 'Never; it is always better to speak up.', 'Not every thought needs saying. Silence can be wise.'],
  ]),
];

const effort: Q[] = [
  q('rq-e-1', 'effort', 'easy', 'What does sincere effort ask for?', 'b', [
    ['a', 'Your maximum every single day.', 'That is not sustainable, and it is not what sincere effort means.'],
    ['b', 'The best you can do with what you have today.', 'Yes. Your best changes with your energy and circumstances.'],
    ['c', 'Perfect results.', 'Effort is in your hands; results often are not.'],
  ]),
  q('rq-e-2', 'effort', 'easy', 'You are exhausted and planned a long workout. What fits sincere effort?', 'c', [
    ['a', 'Push through the full workout regardless.', 'Ignoring exhaustion can lead to injury or giving up altogether.'],
    ['b', 'Skip it and call the day wasted.', '"Wasted" turns a tired day into a verdict.'],
    ['c', 'Do a shorter, gentler version.', 'Yes. The smaller version keeps the habit alive.'],
  ]),
  q('rq-e-3', 'effort', 'easy', 'What is a "definition of done"?', 'a', [
    ['a', 'One sentence saying what finished looks like, decided before you start.', 'Yes. It tells you when to stop.'],
    ['b', 'A promise to keep going until it is perfect.', 'That is the opposite: it removes the stopping point.'],
    ['c', 'A deadline set by someone else.', 'A deadline says when, not what finished looks like.'],
  ]),
  q('rq-e-4', 'effort', 'easy', 'What does the "not this" caveat for effort remind you?', 'b', [
    ['a', 'Effort does not matter if you are tired.', 'Effort still matters; it simply looks different on tired days.'],
    ['b', 'Sincere effort is not overwork, and it does not cancel what you promised.', 'Yes. Both halves matter.'],
    ['c', 'You should never say no to more work.', 'Taking on everything is not sincere effort.'],
  ]),
  q('rq-e-5', 'effort', 'easy', 'Which review of a difficult day is most useful?', 'c', [
    ['a', '"Today was a write-off."', 'A verdict with nothing to act on.'],
    ['b', '"Today doesn\'t count."', 'It does count: it shows you something.'],
    ['c', '"One thing helped, one thing I\'d adjust."', 'Yes. Specific and usable for tomorrow.'],
  ]),
  q('rq-e-6', 'effort', 'medium', 'You keep polishing a report that was good enough an hour ago. What helps?', 'a', [
    ['a', 'Check it against your definition of done, then send it.', 'Yes. The definition gives you permission to stop.'],
    ['b', 'Keep going until it feels perfect.', 'That feeling may not come. Time spent here is time taken from elsewhere.'],
    ['c', 'Start again from scratch.', 'Usually the opposite of what is needed.'],
  ]),
  q('rq-e-7', 'effort', 'medium', 'You missed three days of a habit. What does sincere effort suggest?', 'b', [
    ['a', 'Start a stricter plan to make up for it.', 'Making up tends to raise the bar just when energy is low.'],
    ['b', 'Return today with the smallest version, without making up for lost days.', 'Yes. Returning matters more than catching up.'],
    ['c', 'Give up, since the streak is broken.', 'Streaks are a tool. Breaking one says nothing about you.'],
  ]),
  q('rq-e-8', 'effort', 'medium', 'Your best today is clearly less than last week\'s. What does that mean?', 'c', [
    ['a', 'You are getting worse.', 'Energy and circumstances change. One day is not a trend.'],
    ['b', 'You should hide it.', 'There is nothing to hide. Variation is normal.'],
    ['c', 'Your best varies, and today\'s best still counts.', 'Yes. Sincere effort is measured against today, not your best day.'],
  ]),
  q('rq-e-9', 'effort', 'medium', 'Which plan is most likely to survive a busy week?', 'a', [
    ['a', '"After my morning tea, I\'ll write one line in my journal."', 'Yes. Small and tied to something you already do.'],
    ['b', '"I\'ll journal for an hour every day."', 'Ambitious plans tend to break first in busy weeks.'],
    ['c', '"I\'ll journal when I feel inspired."', 'Inspiration is unreliable. A cue works better.'],
  ]),
  q('rq-e-10', 'effort', 'medium', 'Something went wrong despite your effort. Which thought fits sincere effort?', 'b', [
    ['a', '"If I had really tried, it would have worked."', 'Effort does not control every outcome.'],
    ['b', '"I did what I could with what I knew. What would I change next time?"', 'Yes. You keep responsibility without the verdict.'],
    ['c', '"It was entirely someone else\'s fault."', 'Possibly partly, but this skips anything you could learn.'],
  ]),
  q('rq-e-11', 'effort', 'medium', 'You are asked to take on a fourth project. What fits?', 'c', [
    ['a', 'Say yes to show commitment.', 'Commitment shown by overload often ends in broken promises.'],
    ['b', 'Say yes and quietly do less on everything.', 'This lowers quality without telling anyone.'],
    ['c', 'Say what you can take on well, and what would have to move.', 'Yes. Honest about capacity, and still helpful.'],
  ]),
  q('rq-e-12', 'effort', 'hard', 'How do you tell rest from avoidance?', 'a', [
    ['a', 'Rest is chosen and restores you; avoidance is drifting away from something that matters.', 'Yes. The difference is usually in the choosing.'],
    ['b', 'Rest is never needed if you are motivated.', 'Everyone needs rest. Motivation does not replace it.'],
    ['c', 'Any time off is avoidance.', 'This turns rest into a fault, which leads to burnout.'],
  ]),
  q('rq-e-13', 'effort', 'hard', 'You promised a friend help on Saturday, but you are worn out. What fits sincere effort?', 'b', [
    ['a', 'Cancel at the last minute without explanation.', 'Effort does not remove responsibility for what was promised.'],
    ['b', 'Tell them early, offer a smaller or later version, and keep that.', 'Yes. Honest about your limits, and still honouring the promise.'],
    ['c', 'Go and resent it the whole day.', 'You keep the letter of the promise but not its spirit, and it costs you.'],
  ]),
  q('rq-e-14', 'effort', 'hard', 'Which question best supports steady effort over months?', 'c', [
    ['a', '"How can I do more?"', 'More is not always better; it can lead to burnout.'],
    ['b', '"Why am I not further along?"', 'This invites comparison and discouragement.'],
    ['c', '"What is the smallest step I can repeat?"', 'Yes. Repetition of small steps tends to outlast bursts of effort.'],
  ]),
  q('rq-e-15', 'effort', 'hard', 'A colleague seems to effortlessly do more than you. What fits?', 'a', [
    ['a', 'Notice the comparison, and return to your own definition of done.', 'Yes. You cannot see their costs or circumstances.'],
    ['b', 'Work longer hours to match them.', 'Matching someone else\'s output ignores your own limits.'],
    ['c', 'Decide you are not good enough for this job.', 'One comparison has become a verdict about you.'],
  ]),
  q('rq-e-16', 'effort', 'hard', 'What is the role of self-kindness in sincere effort?', 'b', [
    ['a', 'It lets you off the hook.', 'Kindness is not the same as letting things slide. You can be kind to yourself and still keep your promises.'],
    ['b', 'It helps you return after setbacks instead of giving up.', 'Yes. Kindness keeps the door open to trying again.'],
    ['c', 'It replaces the need for effort.', 'Kindness supports effort; it does not replace it.'],
  ]),
];

export const RETRIEVAL_MORE: Q[] = [...personalisation, ...inquiry, ...speech, ...effort];
