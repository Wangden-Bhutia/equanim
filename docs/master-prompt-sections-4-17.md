# Equanim master prompt, sections 4-17 (condensed faithfully by parent; was missing from builder's copy)

## 4 Tech
React, strict TS, Vite, Tailwind, Lucide (sparing), Vitest+RTL, GH Actions, localStorage initially. Folders: src/components, pages, data, engine, storage, types, styles, tests; public/. Separate content/UI/logic/storage.
GH Pages: project URL base path; hash routing; no server; Actions installs, checks, builds, deploys via official Pages actions; document Pages settings; no fictional owner/URL; no secrets.
Android future: touch-friendly, browser-only features behind services, storage behind interface, app icon + theme for packaging, never claim APK built. PWA optional but offline must be tested+documented, not just declared.

## 5 Visual identity
Quiet refined practice space, not fitness/social/wellness dashboard.
Tokens (use consistently): ivory bg #F6F3EB; forest green #29483A (primary actions, key nav); muted sage #A7B5A0 (subtle secondary); terracotta #B96F55 (sparing emphasis); charcoal text #30342F; warm stone surfaces/borders #E5E0D5. Restraint.
Typography: refined serif for selected philosophical headings; clean sans for UI/labels/forms/nav; system fallbacks; legible if font fails.
Layout: mobile-first polished at 360px; FIVE-item bottom nav on mobile; restrained sidebar on larger screens; comfortable spacing, readable line lengths; rounded cards, subtle borders, restrained shadows; small transitions, respect reduced motion; contrast, visible focus, touch targets; loading/empty/success/validation/error states. No clutter, gradients, decorative animation, meaningless charts, badges for everything. Mature, composed, quietly philosophical.

## 6 IA
Primary: Today, Practise, Journal, Library, Progress. Secondary: About Equanim, Practice Framework, Reading and References, Settings and Data, Privacy and Storage. Mobile persistent 5-item bottom nav, active state clear, doesn't obscure content. Desktop sidebar. No dead links/buttons.

## 7 Today
A Daily orientation: date + short ORIGINAL reflection/question from curated rotating set, not repeating too often; no quote stream.
B Morning intention: select or write one practical intention; categories e.g. Speak carefully; Separate observation from interpretation; Ask before assuming; Pause before responding; Make a sincere effort without demanding perfection. Custom allowed. Saved with date.
C Daily practice: one 3-5 min practice: short explanation, one concrete action/question, interactive response, completion state.
D Scenario of the day: choose response, fixed authored feedback.
E Evening reflection (return later): What happened? What did I initially think or feel? What did I do? What alternative response was available? What will I try next time? None mandatory.
F Continue where I left off: resume unfinished exercise.
Must reflect real saved data.

## 8 Practise
Domains (explain relation to source without presenting as chapter titles): 1 Integrity of Speech; 2 Freedom from Personalisation; 3 The Discipline of Inquiry; 4 Sincere Effort. USE THESE EXACT NAMES.
>=20 original scenarios across domains covering: criticism from senior colleague; misunderstood by colleague; short/ambiguous message; ignored in conversation; unverified allegation; acknowledging a mistake; unexpected change of plan; disagreement at home; urge to defend reputation; can't finish everything in a day; assuming another's intention; someone speaks rudely; giving feedback; realising earlier interpretation was wrong; disappointment after sincere effort; seek clarification before reacting; group pressure to agree; confident conclusion on incomplete info; missed commitment; situation needing a boundary not silent acceptance.
Each scenario: setup; decision point; 3-4 plausible options; immediate option-specific feedback; short reasoning explanation; reflection question; optional personal note; completion action. Not one obviously virtuous answer; trade-offs. Restraint != passivity; not personalising != tolerating mistreatment; inquiry != ignoring evidence; integrity != disclosing everything; best effort != overwork. Never use domains to suppress emotion/avoid conflict/remove accountability.
Feedback deterministic, authored per option; no AI. Should: what response may accomplish; risks/assumptions; alternative where useful; end with practical question/next step. Concise.
Revisit completed; record attempts+dates; repeats don't erase history.

## 9 Journal
Types: A Incident reflection (What happened? observable facts / What did I interpret or assume? / What emotion or impulse arose? / How did I respond? / What else might explain it? / What response would better reflect my values? / What, if anything, should I do next?). B Daily review (Where did I respond deliberately today? / Where did I react automatically? / What did I learn? / One practical intention for tomorrow). C Free reflection (open text).
Create/edit/delete, date-stamped, browse past, empty states, persist, private, delete confirmation, no pressure to journal daily.

## 10 Library
Sections: 1 The Integrity of Speech (language & relationships/trust/self-understanding/responsibility; honesty vs harshness, accuracy vs exaggeration, useful silence vs avoidance). 2 Freedom from Personalisation (interpretation via own fears/expectations; events vs stories; without denying harm/accountability). 3 The Discipline of Inquiry (assumptions, ambiguity, evidence, clarification, confirmation bias, knowing vs guessing; methods for better questions). 4 Sincere Effort (responsibility, realistic expectations, consistency, changing circumstances, recovery after mistakes, commitment vs perfectionism).
Essays: The Stories We Add to Events; The Habit of Defending the Self; The Space Between Impulse and Action; Listening Without Preparing a Defence; Boundaries, Responsibility and Respect; Learning from a Difficult Day; Returning to Practice After a Lapse.
Each: title, original explanation, everyday example, one self-examination question, one short exercise, link to scenario/practice. 2-4 min reads. Mark complete / revisit; reading completion separate from behaviour change.
References page: The Four Agreements as major inspiration; verified details only; distinguish Equanim's interpretations from sourced material.

## 11 Progress
Show: practices completed; scenario attempts & revisits; journal entries; days engaged; morning intention & evening reflection completion; domain participation across 4 areas; recent reflections and recurring themes user explicitly recorded. Simple visuals only when data supports. No fake data; empty state. No moral score; don't reward choosing 'ideal' option. Explain what indicators measure; separate practice completion from self-reported behaviour. Optional modest streak; missing a day no guilt/reset of progress.

## 12 Onboarding
Explain: what it is; what it is not; why short daily practice; how 5 sections work; local storage; not a replacement for professional mental-health support. Skippable. First-use sample journey: orientation -> set intention -> complete scenario -> record reflection -> view resulting progress entry. No account.

## 13 About / Framework / References
About: purpose, name & equanimity, awareness/reflection/deliberate action; independent, not official/authorised/endorsed. Framework: four domains & how they work together; practical learning model, not validated instrument. References: source book + materials actually used; no invented research/clinical claims.

## 14 Settings & data
Store: preferences, intentions, practice completions, scenario attempts, journal, reading progress, progress events, timestamps, schema version. Typed, migrations, graceful corruption handling, no silent overwrite, consistent, minimal, no analytics. Controls: export JSON; import valid backup; validate before apply; confirm destructive; reset; explain storage location & limits (clearing browser data/other browser/device loses data). No encryption/backup claims.

## 15 Accessibility
Semantic HTML, keyboard, visible focus, labels, accessible errors, contrast, responsive phone/tablet/desktop, reduced motion, empty/loading/error states, storage failure handling, no horizontal overflow, no hover-only, big tap targets, works on Android Chrome.

## 16 Tests (minimum)
Navigation; intention create+persist; scenario selection & option feedback; record & revisit completed scenario; journal CRUD; reading completion; progress calcs from real records; export/import validation; reset confirmation & deletion; corrupt data handling; base-path config; core screens at mobile size. Run suite + build; real browser journey if possible.

## 17 Pipeline
Checkout, Node setup, reproducible install, typecheck+lint, tests, build, upload artifact, deploy via official Pages actions. Document: local run, repo config, enabling Pages, triggering deploy, spotting failed workflow, base path, testing build locally, Capacitor prep.
