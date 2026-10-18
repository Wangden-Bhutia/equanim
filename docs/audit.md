# Compliance audit: Equanim 1.1 (branch `spec/full-compliance`)

This audit checks the implementation against the full master prompt: sections 1–3 and 17–20 in `docs/master-prompt.md` and sections 4–17 in `docs/master-prompt-sections-4-17.md`. The parent agent condensed sections 4–17 from the user's full prompt. Each status is **Pass**, **Partial** or **Fail**. Evidence points to code and to tests that ran.

Checks run on this branch: `npm run typecheck`, `npm run lint`, `npm test` (54 Vitest/RTL tests in 5 files), `npm run build`, and `npx playwright test` (4 browser tests: the full journey in light and dark, overflow at 360px with 1.0 data migrated, the desktop sidebar with no third-party requests, and offline after the first visit). All passed.

## Summary

| § | Section | Status |
|---|---|---|
| 1 | Project identity | Pass |
| 2 | Product philosophy and IP | Pass |
| 3 | Product principles | Pass |
| 4 | Tech, Pages, Android readiness, PWA | Pass (Android packaging not done, by design) |
| 5 | Visual identity | Pass |
| 6 | Information architecture | Pass |
| 7 | Today (A–F) | Pass |
| 8 | Practise | Pass |
| 9 | Journal | Pass |
| 10 | Library and References | Pass |
| 11 | Progress | Pass |
| 12 | Onboarding | Pass |
| 13 | About / Framework / References | Pass |
| 14 | Settings and data | Partial (progress events are derived, not stored) |
| 15 | Accessibility | Partial (no manual screen-reader or real-device pass) |
| 16 | Minimum tests | Pass |
| 17 | Pipeline and documentation | Pass |
| 18 | Implementation sequence | Pass |
| 19 | Definition of done | Pass, except the live deploy of 1.1, which waits for the PR to be merged |
| 20 | Final report | Delivered with the PR |

## Section by section

### 1 Project identity — Pass
- The name "Equanim" and the tagline "Clarity in the midst of life." are used in the header, sidebar, onboarding, manifest and title.
- The app is a mobile-first web app on GitHub Pages.
- The Capacitor groundwork is documented. No APK is claimed.

### 2 Product philosophy and IP — Pass
- All content is original.
- A content test guards against the source's distinctive formulations across scenarios, library, domains, practices, orientations and journal questions.
- The attribution and no-endorsement disclaimer appear on About, References and onboarding step 2.
- The voice invites questions rather than issuing commands.

### 3 Product principles — Pass
- Practice outweighs reading: each reading links to an exercise and a scenario.
- Missed days never reset anything. Streaks are off by default.
- There is no grading. A test forbids "correct answer" and similar wording.
- Data is local by default.

### 4 Tech — Pass
- **Stack:** React 18, strict TS, Vite, Tailwind, Lucide, Vitest+RTL, GitHub Actions and localStorage behind `StorageAdapter`.
- **Folders:** now `src/components`, `pages`, `data`, `engine`, `storage`, `types` and `styles`, plus `src/app` for the router and store, `tests/` and `public/`.
- **Pages:** base `/equanim/`, hash routing and the official Pages actions. A base-path test checks `vite.config.ts`, the manifest and `index.html`.
- **Android:** touch targets of 44px or more, storage behind an interface, and an app icon (SVG plus PNG 192/512) with a theme colour.
- **Offline (PWA):** a service worker is generated at build time (`vite.config.ts`).
  - It precaches the exact built files.
  - Navigation is network-first; hashed assets are cache-first.
  - It caches only app files and never user data.
  - It registers only in production. A Playwright test loads the app, goes offline, reloads and opens a library page.
  - The app is documented in README and on Privacy and Storage.
  - It is not a full install-prompt experience; the manifest is present, but no install UI was added.

### 5 Visual identity — Pass
- **Tokens:** exactly ivory `#F6F3EB`, forest `#29483A`, sage `#A7B5A0`, terracotta `#B96F55`, charcoal `#30342F` and stone `#E5E0D5`, in `src/styles/index.css`.
- **Derived values, documented in the CSS:**
  - Surface `#FCFAF5` and muted text `#5C615A`.
  - A darker terracotta, `#8E4F38`, for small text, because `#B96F55` on ivory fails WCAG AA at body size. The pure tokens are kept for icons and accents.
  - A derived dark theme.
- **Type:** Source Serif 4 for selected philosophical headings (page titles, orientation, intention text, feedback patterns, reading titles); Inter for the UI. Both are self-hosted, with system fallbacks.
- **Layout:**
  - A five-item bottom nav on mobile.
  - A restrained sidebar from `lg` up, with primary items and the five secondary pages.
  - Rounded cards and subtle borders, with no gradients or badges.
- **Motion:** reduced motion is respected.

### 6 Information architecture — Pass
- Primary: Today, Practise, Journal, Library, Progress.
- Secondary, with exact names: About Equanim, Practice Framework, Reading and References, Settings and Data, Privacy and Storage.
- A content test checks every label. An RTL test opens every page by name. The desktop e2e test checks that all ten sidebar links are visible.
- No dead links: the 360px test visits every route, including an unknown one, which goes to Not Found with a way back.

### 7 Today — Pass
- **A, orientation:** today's date plus one of 30 original prompts, rotating by day, so each repeats once a month. There is no quote stream.
- **B, morning intention:** the five categories, with exact labels and editable example text, plus "Write my own". The intention is saved with its date and can be changed. Tested for creation, persistence across reload and change.
- **C, daily practice:** 12 practices of 3–4 minutes, each with a short explanation, one concrete action and a response box. The draft autosaves, and "Mark practice complete" shows a completed state. The practice follows the intention's domain when one is set.
- **D, scenario of the day:** a card linking to the scenario player, preferring uncompleted scenarios in the intention's domain. Feedback is fixed and authored.
- **E, evening reflection:** the five exact questions, none mandatory, editable after saving.
- **F, continue where I left off:** an unfinished practice draft or a scenario that was explored but not completed shows a Resume card, which can be dismissed. Tested across reload.

### 8 Practise — Pass
- **Domains:** the exact names Integrity of Speech, Freedom from Personalisation, The Discipline of Inquiry and Sincere Effort. Each has a relation-to-source note in Equanim's words, not presented as chapter titles, plus a "what this is not" caution.
- **Scenarios:** 35 original scenarios (speech 10, personalisation 8, inquiry 8, effort 9).
- **Structure:** each scenario has a setup, a decision point, 3–4 options, option-specific feedback ("What it may accomplish", "Risks and assumptions", "Another response to consider" where useful, and a closing practical question), a "Why this matters" explanation, a reflection question, an optional personal note and "Mark scenario complete".
- **Revisits:** a revisit adds a completion and never erases history. "Your history with this scenario" lists dates, the options explored and notes.
- **Cautions:** the cautions in §8 (restraint is not passivity, and so on) are written into the domain `notThis` text and into specific scenarios, such as the boundary scenarios and the n-allegation evidence scenario.
- **Theme coverage, all 20 checked by a content test:**

| Theme | Scenarios |
|---|---|
| Criticism from a senior colleague | Criticism in the meeting (p-meeting-critique) |
| Being misunderstood by a colleague | Taken the wrong way (n-misunderstood) |
| A short or ambiguous message | The one-word reply (p-one-word-reply); Seen, no reply (a-seen-no-reply) |
| Being ignored in a conversation | Talked over (n-ignored) |
| An unverified allegation | What you were told (n-allegation) |
| Acknowledging a mistake | The voice after a mistake (w-inner-voice); Taken the wrong way (n-misunderstood); The error nobody has noticed (n-own-mistake); The forgotten promise (n-missed-commitment) |
| An unexpected change of plan | Fever on meeting day (e-fever-meeting); The cancelled trip (n-plan-change) |
| A disagreement at home | The snap about the dishes (p-partner-snaps); The help you never asked for (a-unspoken-help); The move (n-home-disagreement) |
| The urge to defend one’s reputation | The family group chat (w-group-chat) |
| Being unable to finish everything in a day | The tired evening (e-tired-evening); The endless polish (e-endless-polish); Eight tasks, time for four (n-too-much) |
| Assuming another person’s intention | Praise, then silence (p-praise-and-silence); The lunch photo (a-lunch-photo); The quiet neighbour (a-quiet-neighbour); It was not about you (n-wrong-interpretation) |
| Someone speaking rudely | The horn in traffic (p-traffic-horn); The snap about the dishes (p-partner-snaps); Laughed at while learning (e-laughed-at) |
| Giving feedback | The borrowed complaint (w-borrowed-complaint); The honest opinion (w-honest-opinion) |
| Realising an earlier interpretation was wrong | It was not about you (n-wrong-interpretation) |
| Disappointment after sincere effort | Laughed at while learning (e-laughed-at); At the back of the group (e-running-group); Not selected (n-effort-disappointment) |
| Seeking clarification before reacting | The “quick summary” (a-quick-summary); The landlord’s message (a-landlord-call) |
| Group pressure to agree | Everyone agrees (n-group-pressure) |
| A confident conclusion on incomplete information | The landlord’s message (a-landlord-call); The quiet neighbour (a-quiet-neighbour); What you were told (n-allegation) |
| A missed commitment | Fever on meeting day (e-fever-meeting); The forgotten promise (n-missed-commitment) |
| A situation that needs a boundary, not silent acceptance | The Saturday favour (w-saturday-move); The question at dinner (w-dinner-question); The comparison at the function (p-family-comparison); One more committee (e-another-committee); The move (n-home-disagreement) |

### 9 Journal — Pass
- There are three types, each with the exact questions:
  - Incident reflection (7)
  - Daily review (4)
  - Free reflection
- Entries can be created, edited, viewed and deleted (with confirmation). They are date-stamped, can be filtered by type, have empty states, and take an optional domain and themes.
- No pressure copy.
- Entries from 1.0 migrate to incident reflections.
- An RTL test covers CRUD for all three types.

### 10 Library and References — Pass
- **Sections:** The Integrity of Speech, Freedom from Personalisation, The Discipline of Inquiry and Sincere Effort.
- **Essays:** the seven exact titles.
- Each item has an original explanation, an everyday example, one question, a short exercise and a scenario link. Reads take 2–4 minutes.
- **Reading completion is separate:** opening a reading records "opened" only. "Mark as read" records completion. The exercise is a third record. Progress shows Reading in its own section, apart from practice.
- **References:** see §13.

### 11 Progress — Pass
- **Shown:** days engaged (with a 14-day grid), daily practices completed, scenarios completed out of the total, revisits and responses explored, and domain participation across the four areas.
- **Self-reported, in a separate section:** morning intentions and evening reflections (totals and the last 14 days) and journal entries by type.
- Recent reflections and recurring themes are listed. Themes appear only when the user tagged the same theme more than once.
- There is no moral score, nothing rewards particular options, and every indicator has explanatory text. The streak is optional and off by default.
- The empty state shows no fake data.
- Calculations are unit-tested from real records, including the removed-scenario and opened-versus-completed edge cases.

### 12 Onboarding — Pass
- **Four skippable information steps:**
  - What it is.
  - What it is not, including that it is not a replacement for professional mental-health support, with 112, no AI and the disclaimer.
  - Why short daily practice, and how the five sections work.
  - Local storage and its limits, with an optional name.
- **The sample journey uses real saves:**
  1. Orientation.
  2. Set an intention.
  3. Complete the first scenario with a reflection note.
  4. "Your first progress entry", built from the saved data, with "Go to Today" and "Open Progress".
- There is no account.
- Tested end to end in RTL and Playwright.

### 13 About / Framework / References — Pass
- **About Equanim:**
  - Purpose, the name and equanimity, and awareness → reflection → deliberate action.
  - Independent; not official, authorised or endorsed.
  - Not therapy, with no AI.
  - Helplines, re-verified today against official sites: 112 at 112.gov.in, and Tele-MANAS 14416 / 1-800-891-4416 at telemanas.mohfw.gov.in.
- **Practice Framework:** the cycle of a moment, the four domains with their relation and caution, and how they work together. It is stated to be a practical learning model, not a validated instrument.
- **Reading and References:**
  - Ruiz, *The Four Agreements*, Amber-Allen, 1997, ISBN 1-878424-31-9, checked against the Open Library record.
  - It separates what comes from the source (broad themes only) from what is Equanim's own.
  - It makes no research or clinical claims and invents no citations.

### 14 Settings and data — Partial
- **Stored:** preferences, intentions, evening reflections, practice completions, scenario attempts and completions, journal, reading records, the in-progress item, timestamps and the schema version.
- **Typed and versioned:** schema v2, with migrations 0→1 and 1→2. The 1.0→1.1 migration preserves every record and is tested in unit tests and in a real browser.
- **Corrupt data** is preserved under `equanim:unreadable:<ts>`, and a notice is shown.
- **No silent overwrite:** a restore point is kept before an import.
- **Controls:** export JSON; validated import showing a summary, with Merge, Replace or Cancel; Undo last import; and a reset that requires typing ERASE.
- Storage location and limits are explained on Settings and Data and on Privacy and Storage. There are no encryption or backup claims, and the backup file is stated to be unencrypted.
- **Partial because** "progress events" are not stored as a separate event log. Progress is derived from the timestamped records above. This is deliberate, to avoid duplicate, drifting data, but it differs from the literal list.

### 15 Accessibility — Partial
- **Automated checks pass:**
  - Semantic landmarks, a skip link, labelled controls, accessible errors (`role=alert`), visible focus, 44px targets and no hover-only actions.
  - Reduced motion.
  - No horizontal overflow at 360px on every route.
  - axe-core reports no serious or critical WCAG 2 A/AA issues on every screen tested, in light and dark.
- Storage failure shows a save-error alert.
- **Partial because** there has been no manual TalkBack or VoiceOver pass and no test on a physical Android Chrome device. Playwright emulates a Pixel 7 on Chromium.

### 16 Minimum tests — Pass

| Required | Test |
|---|---|
| Navigation | `app.test.tsx` › navigation (all primary and secondary pages by exact name); e2e desktop sidebar |
| Intention create and persist | `app.test.tsx` › today › intention |
| Scenario selection and option feedback | `app.test.tsx` › onboarding journey (two options, distinct feedback, all feedback parts) |
| Record and revisit a completed scenario | `app.test.tsx` › scenario completion and revisits |
| Journal CRUD | `app.test.tsx` › journal (all three types) |
| Reading completion | `app.test.tsx` › library and progress (opened, completed and exercise kept separate) |
| Progress calculations from real records | `progress.test.ts` |
| Export/import validation | `transfer.test.ts`, `app.test.tsx` › settings (summary, cancel, merge, invalid) |
| Reset confirmation and deletion | `app.test.tsx` › reset |
| Corrupt data handling | `storage.test.ts`, `app.test.tsx` › unreadable notice |
| Base-path config | `content.test.ts` › GitHub Pages base path |
| Core screens at mobile size | Playwright at 390×844 (light and dark) and 360px |
| (extra) v1→v2 migration, offline, no third-party requests | `storage.test.ts`; e2e |

### 17 Pipeline — Pass
- `.github/workflows/deploy.yml`:
  - checkout and Node setup
  - `npm ci`
  - typecheck and lint
  - unit tests
  - build
  - Playwright
  - upload the artifact and deploy with the official Pages actions
- PRs run the checks without deploying.
- The README documents running locally, repository configuration, enabling Pages, triggering a deploy, spotting a failed workflow, the base path, local build testing and Capacitor preparation.

### 18 Implementation sequence — Pass
- The foundation, journey, library, progress, settings and deployment phases are complete.
- This document is the Phase 6 audit.

### 19 Definition of done — Pass, live deploy pending merge
- All items are met on this branch.
- 1.0 is live. 1.1 is deployed only after the user reviews the screenshots and the PR is merged.

### 20 Final report — Delivered in the PR description and the agent's report.

## Known gaps and untested behaviour

1. **Not tested on a real Android phone or with a screen reader.** This is the most important manual check left.
2. **Progress events are derived, not logged** (§14). See above.
3. **The offline mode is tested on Chromium only.** The install prompt and Safari/iOS behaviour have not been checked. The service worker is skipped if registration fails, and the app still works online.
4. **Storage is `localStorage`,** which holds about 5 MB per origin. IndexedDB or Capacitor Preferences can replace it behind the adapter.
5. **Content has had no second reader:** 35 scenarios, 12 practices, 30 orientations and 11 readings were written by the builder.
6. **Migrated 1.0 data:** 1.0 had no explicit completion step, so each scenario explored in 1.0 becomes one completion. A 1.0 library "read" becomes "opened", not "completed", because 1.0 recorded it automatically on open.
7. **Dates use the device's local calendar day.**
8. **Full-page screenshots** (`14-today-full`, `24-progress`) show the fixed bottom nav partway down the image. This is a capture artifact; on a real device it stays at the bottom of the viewport.

## Recommended next tasks

1. Do a manual TalkBack pass on an Android phone in Chrome, and fix what it finds.
2. Have a second reader review the content for tone, cultural fit and originality.
3. Move storage to IndexedDB behind `StorageAdapter`, then begin the Capacitor wrapper with a Preferences adapter.

---

# Pre-merge audit (brief: `docs/pre-merge-audit-brief.md`)

## Data safety: what was found and fixed on this branch
Before this audit, the branch's 1.0 → 1.1 upgrade had these problems. None of them had reached the live site, because the branch was never merged.

| Risk | Fix |
|---|---|
| A successful migration overwrote the 1.0 data with no copy kept | Before migrating, the exact raw value is written to `equanim:pre-migration:v<from>:<time>` and read back to check it. Settings › Recovery copies offers it as a download. |
| If that copy could not be written (storage full), the next save would replace the original | The repository locks; saves are refused, and the user is told. The original is untouched. |
| One malformed record made the whole dataset "unreadable" (empty app) | `salvage()` keeps every valid record and drops only bad ones. The original is kept as `equanim:recovered-original:*` and the user is told how many records were set aside. |
| Meaning changes in migration | 1.0 check-in outcomes are kept verbatim as `legacyCheckIn`, shown with their original question. Journal "next time"/"anything else" keep their own labels. A 1.0 "read" becomes both opened and completed. |
| Two tabs overwriting each other | Tabs reload on the `storage` event. |

~~Remaining: a still-open 1.0 tab could overwrite upgraded data.~~ **Fixed** in the cross-tab fix (`docs/cross-tab-fix-brief.md`, design in `docs/data-safety.md`). 1.1 never writes 1.0's key, and 1.0 writes are merged record by record. 1.1 writes are serialised with Web Locks and re-read before every write.

## Accessibility fixes in this audit
- The skip link broke hash routing.
- The streak switch target was 28px; it is now 44px.
- Radio-card and field focus was invisible or weak.
- Focus was lost when a button disappeared after an action. It now moves to a confirmation that is announced.
- The confirmation dialog had no Tab trap; there is now a shared `Dialog` with trap, Escape and focus return.
- axe: 0 violations on every screen, light and dark. A keyboard review of each core screen checks that every one of the first 25 tab stops has a visible focus indicator.

## Install App
Covered: manifest (192, 512, 512 maskable, svg), service worker scope `/equanim/`, and Chromium installability errors = none (headless check). The prompt is held and offered only from the button. Accept, cancel and consumed states, `appinstalled`, standalone detection, the iOS guide by browser, and guidance for unsupported browsers are all handled. **The real prompt and iOS flow were not tried on devices** (see `docs/manual-testing.md`).


# Cross-tab fix (brief: `docs/cross-tab-fix-brief.md`)
- **Reproduced before the fix:** `tests/unit/cross-tab-proof.test.tsx` was committed on its own in `0b8efca`. All 3 tests failed on the code before the fix:
  - an older snapshot from a 1.0 tab dropped a 1.1 entry;
  - a missed notification dropped 1.0 entries;
  - a 1.0 tab opened after the upgrade wiped the upgraded data.

  All 3 pass after the fix.
- **Design:** see `docs/data-safety.md`.
  - Store key `equanim:store` with revisions.
  - The 1.0 key is never written.
  - Web Locks plus check-and-set.
  - Changes are applied to the latest data.
  - A record-level three-way merge; conflicting versions are set aside.
  - Overwritten writes are detected and repaired.
- **Regression tests:** `tests/unit/cross-tab.test.tsx` (brief tests 1–15 plus a no-loop test), and `tests/e2e/cross-tab.spec.ts` (real Chromium tabs, with a simulated 1.0 writer).
- **Remaining risk:** without Web Locks, a tab closed in the microsecond window can lose its last change. This is documented.
