# Round 2 brief (full spec from user, sections 2.1 tail through 2.8; sections 1,3,4,5,6 as in the original prompt — repeated at the end)

NOTE: real storage key is `equanim:store` (prompt said equanim:data; that is legacy 1.0 read-only key). Do not change key, base path, manifest id.

## 2.1 Pace by calendar (highest priority)
- One new session per calendar day (local date via dateKey()). After completing, next shows "Opens tomorrow" (not an error).
- Override "Do the next one now anyway", confirmed once with short note that spacing helps learning stick. Record `earlyStart: true` on that session record; Progress and Week 6 summary say honestly "X sessions done ahead of schedule".
- Gaps never penalise: next session simply available; never reset/skip content.
- Day 4 Apply: can finish only if user made >=1 if-then plan that day or earlier that week. Else inline prompt "Make today's plan first" linking /plan, Complete disabled. Honest alternative "I'll do this later" exits without completing.
- Weekly review Day 6: require week had >=1 plan or >=1 evening check. If not, gentle note that review is most useful after a real-life attempt, and offer a lighter "catch-up" version (same questions, no data requirement) labelled as such in the record.
- Retrieval Day 5 and Quick recall: keep 2/7/21-day schedule; if sessions done early, schedule recall by calendar days from first exposure, not session order.
- Show gating: on Today a quiet line "Next session opens tomorrow" with the date; on Programme overview a small "opens {weekday}" label on next locked session.
- Schema v5 migration: lossless, exact pre-upgrade copy, defaults existing records safely (earlyStart:false, no retroactive gating), update export/import validation and merge logic.

## 2.2 Make "Think it through" active
- Add a micro-check (1-2 taps, no typing) inside every lesson session (Day 1 of Weeks 1-4, and Week 5/6 lesson-type sessions). Examples: choose which of three statements is the event vs added meaning; tap the assumption in a short text; pick next step after a lapse. Each option has specific feedback, same style as existing RecogniseItem. One or two per lesson, original, "not this" spirit preserved.
- "Complete session" button appears after micro-check answered, in Think and Write modes. Wrong answer teaches, does not block: show feedback then allow completion.
- Reflective prompts in Think mode: replace "answer in your head" with a self-commit tap, 3 choices e.g. "I have one in mind / I'm not sure yet / Nothing came up", stored on session record as `thinkResponses`. Data for weekly review, not a grade.
- Keep Write mode as is. Typing never required.

## 2.3 Connect values to daily practice
- Plan builder (/plan): optional "Which of your values does this serve?" row of three chips (user's own values, labelled with their one-sentence meaning). Save as optional `valueId` on plan record.
- Show chosen value on Today (plan card), evening check ("You planned this for *Calm*"), weekly review ("Which values did your plans serve this week?").
- In Day 4 Apply and weekly review, show user's value sentences in a small "Your values" card, collapsed by default.
- If user skipped Day 0 values, show a one-line prompt linking /values instead of chips.

## 2.4 Navigation: programme first
- Primary tab bar: Today, Programme, Journal, Progress. Programme opens existing overview (week list, journey, pick up where you left off).
- Move Library and Practise (scenarios) under a clearly named "Keep practising" entry: in More, also linked from Programme overview footer and from Week 6 and maintenance screens. Keep deep links /library, /practise, /practise/:id working.
- Week chip on Today ("Week 1 · Day 1 of 42") links to Programme tab.
- Update nav.ts, active-state logic, e2e tests, any copy naming tabs (About, welcome, Today).

## 2.5 Clean up Progress
- Order: journey map, Day 0 vs now, plans and outcomes, values, weekly "what I noticed" timeline, days practised this week, then collapsed "Keep practising activity" section.
- Legacy blocks (daily practices, scenario counts, domain participation, readings, journal counts) shown only when user has >=1 record in them; else hidden entirely. No "0" tiles.
- If any sessions done early, one honest line ("3 sessions done ahead of schedule. Spacing helps, but your pace is yours.").

## 2.6 Consistent time claims
- About says weekly review "15 minutes", data says 12; "six to ten minutes a day" doesn't cover Week 5 (8-10 min) plus 1-min plan and 1-min evening check.
- Compute displayed numbers from data (DAY_TYPES and SessionDef.minutes) via one helper returning "typical daily time" and "weekly review time"; use on welcome, About, Programme overview, onboarding.
- Honest wording e.g. "about 8 to 12 minutes a day including your morning plan and evening check; Day 6 reviews take about 12 minutes".
- Unit test that fails if copy and data drift.

## 2.7 Replace first-run modal
- After Day 0 a "Before you go further" dialog covers Today. Replace with non-blocking inline notice at top of Today, collapsed to one line ("Independent, not therapy, no AI. Read more") expanding in place. Shown until dismissed ("Got it"); full text always in About.
- Keep visible safety line (India: 112, Tele-MANAS 14416) on welcome screen footer and in More/About. Update e2e tests that click "I understand".

## 2.8 Visual polish and completion moments
- Journey map: replace "Wk 1…Wk 6" chips on Progress and Programme with six connected nodes along a gentle path, filled for completed weeks, ringed for current, each week's domain colour (reuse tested colour tokens; weeks 5-6 neutral/accent). Tiny label with week's skill name. Works at 360px, light/dark, fully described to screen readers (e.g. "Week 2 of 6, Inquiry, 3 of 6 sessions done").
- Completion moments: after each session a calm brief confirmation (subtle fade/check, <=600ms) plus one short sentence tied to session type from a small non-repeating pool (e.g. "That's one small rehearsal done."). After weekly review and after Week 6, slightly larger moment restating week's key idea in one line. Respect prefers-reduced-motion (text only). No confetti, points, badges, streak language.
- Session pages: small consistent icon per session type and domain-colour accent on header; break long lessons into separated cards; body text >=16px comfortable line-height. No images or external assets.
- Keep cream/green palette, serif headings, whitespace. Contrast >=4.5:1 for new colours both themes; extend tests/unit/colours.test.ts.

## Sections 1, 3, 4, 5, 6
As in the original user prompt (you received these intact): v5 migration tests, transfer.ts/reconcile.ts updates, cross-tab unchanged; no new runtime deps/network; CSP unchanged; offline/SW working; unit tests for gating+override (faked next day and 10-day gap), early-start, Apply/Review requirements and alternatives, thinkResponses, valueId display, Progress hiding, time-claim check, v4->v5; Playwright full path with faked clock one day per session, plus override, Apply requirement, tab bar tests, axe at 390 light/dark and 360 on new/changed screens. All of typecheck, lint, test, build, test:e2e pass. Writing rules: warm, plain, second person, non-shaming, no diagnosis/treatment claims, no measured-improvement claims, keep "not this" guardrails. Work order (a)-(j), PR not merge, final changelog, uncertain list, screenshots 390x844 light+dark: Today (gated and ready), lesson with micro-check, plan builder with value chips, Programme tab with journey map, Progress (empty and populated), a completion moment.
