# Phase 6 audit: Equanim MVP

Date: 18 October 2026. Reviewed against section 19 (Definition of done) of the master prompt and the requirements relayed for sections 4 to 17, which the building agent could not see directly (see `docs/master-prompt.md`).

## Definition of done

| Requirement | Status | Evidence |
|---|---|---|
| The app consistently uses the name Equanim | Met | Header, onboarding, title, manifest, About, export file name (`equanim-backup-*.json`). |
| The visual identity matches the specified design system | **Cannot be verified** | The design-system section of the prompt was not visible. Implemented tokens (CSS variables in `src/styles/index.css`): parchment background `#F6F3EC`, ink `#1E2629`, deep sage accent `#2E5E5A`, clay `#8A4B22`, four domain hues, matching dark theme; Source Serif 4 headings with Inter for UI; 20px card radius. If the original specifies other values, only `index.css` and `tailwind.config.js` need to change. |
| All five primary navigation destinations work | Met | Today, Practise, Journal, Library, Progress. RTL test `navigation`, Playwright journey. |
| Onboarding leads into a usable first practice | Met | Four steps (welcome, a sample day, privacy and independence, name) end in "Begin first practice", which opens a scenario with a first-time hint, then "Continue to Today". Tested in RTL and Playwright. |
| Morning intentions persist | Met | One intention per local date, editable; survives a reload (RTL remount test, Playwright `page.reload()`). Evening reflection with three non-judgemental outcomes is stored alongside it. |
| At least 20 original scenarios | Met | 24 scenarios, 6 per domain, 3 to 4 responses each (`src/data/scenarios.ts`). |
| Scenario choices return relevant, option-specific feedback | Met | Each response has a neutral pattern name, what it does, what it protects, what it may cost and something to notice. Tests assert every option's feedback is distinct and non-trivial, and that nothing grades a choice as right or wrong. Several scenarios explicitly show boundaries as active choices, not passivity. |
| Completed scenarios and attempts are recorded | Met | Every choice is stored as an attempt (`scenarioId`, `optionId`, time). Lists show "Explored"; Progress counts explored and compared scenarios. |
| Journal entries can be created, edited, revisited and deleted | Met | Structured fields (what happened / meaning added / response / next time / free note), optional area, link back to the prompting scenario. Delete is confirmed. Tested end to end. |
| The Library contains the specified original reading sections and exercises | Met against the relayed brief | 4 area readings and 7 essays, each with an example, a question, a multi-step exercise ("I tried this" is recorded) and a link to a scenario. The original section text specifying the Library was not visible. |
| Progress is calculated from actual user records | Met | `src/lib/progress.ts` derives everything from stored records; records for unknown scenario ids are ignored. Empty state before any activity. No moral score. Streaks are off by default, never break before the day ends, and are framed as optional. |
| JSON export and validated import work | Met | Export envelope with app id and timestamp. Import rejects non-JSON, other apps' files, invalid shapes and files over 5 MB; shows a summary; Merge, Replace or Cancel; current data saved as a restore point with "Undo last import". Unit, RTL and Playwright (real download) tests. |
| Reset is deliberate and appropriately confirmed | Met | Requires typing ERASE; removes every `equanim:` key and returns to onboarding. Tested. |
| The app works on common mobile and desktop widths | Met (automated) | Playwright checks for horizontal overflow on every route at 360px, at 390x844 and at 1280px. Desktop is a centred single column, which is functional but not a dedicated desktop layout. |
| No primary navigation item or visible action is a dead end | Met as far as tested | Every tab, secondary page, Back link and call to action is exercised by tests or leads to a working route. Unknown routes show a "Nothing here" page with a way back. |
| The production build succeeds | Met | `npm run build` locally and in CI. |
| The relevant automated tests have been executed | Met | 39 Vitest tests, 3 Playwright tests (with axe-core WCAG 2 A/AA checks on 15 screens) locally, in CI and against the live site. |
| GitHub Pages configuration and deployment documentation are present | Met | `.github/workflows/deploy.yml`, README "Deployment" and "Preparing for Android" sections. |
| Intellectual-property and privacy requirements are followed | Met, with limits | All text is original. A test fails the build if the source book's four principle formulations or "Toltec" appear in content. No-endorsement disclaimer in onboarding, About and References. The single reference was checked against the Open Library record (ISBN 1-878424-31-9, Amber-Allen, 1997); no other citations are made. Privacy: no network requests other than the app's own files (Playwright asserts no third-party requests), fonts are bundled. **Limit:** originality was checked by the author and an automated phrase list, not by a human IP review. |
| No fake data, fake AI or unsupported claims | Met | No sample records are seeded; the onboarding "sample day" is clearly an illustration. No AI. No research claims. |

## Requirements from the relayed brief

| Item | Status |
|---|---|
| React + strict TS + Vite + Tailwind + Lucide + Vitest/RTL | Met (plus Playwright and axe-core). |
| HashRouter, Vite base `/equanim/` | Met. |
| Pages deploy via official actions, running typecheck, lint, tests, build | Met; also runs the Playwright journey before deploying. |
| Local-first storage behind an interface, schema version, migrations, corruption handling | Met: `StorageAdapter`, `SCHEMA_VERSION = 1`, ordered migrations with a v0 to v1 step, unreadable or newer data preserved under a separate key with a visible notice. |
| No AI, analytics or backend | Met. |
| About, Framework, References, Settings & Data, Privacy | Met, reached from the header button and from links in the Library and onboarding. |
| Serif headings, sans UI | Met. |
| Accessibility | axe-core finds no serious or critical WCAG 2 A/AA issues on the tested screens in light and dark. 44px touch targets, skip link, labelled controls, focus moves to scenario feedback, dialogs trap Escape and restore focus, reduced motion respected. Not tested with a real screen reader. |

## Known gaps, shortcuts and untested behaviour

1. **The master prompt was only partly visible.** Sections 4 to 16 and the start of 17 were not seen. Any requirement that exists only there (exact design tokens, specific copy, additional screens or fields, reminders, offline requirements, content counts beyond those relayed) has not been checked. This is the most important open item.
2. **No offline support yet.** There is no service worker, so the app needs a connection to open (data itself is always local). A web manifest is present, but it is not a full installable PWA.
3. **Storage is `localStorage`**, which is synchronous and limited to roughly 5 MB per origin. Ample for text journals, but IndexedDB or Capacitor Preferences would be more robust. The adapter interface is in place for that swap.
4. **The migration engine is tested with synthetic chains**; only the v0 to v1 step exists because this is the first released schema.
5. **No reminders or notifications** (not possible without a service worker or native wrapper).
6. **Desktop** is the mobile column centred on a wide screen.
7. **Content review:** the scenarios and essays were written in one pass and have not been reviewed by a second reader for tone, cultural fit or sensitivity.
8. **Helpline numbers** in About (112, Tele-MANAS 14416 / 1-800-891-4416) were verified against official sources in an earlier project, not re-checked today.
9. **Dates** use the device's local calendar date. Changing time zones mid-day can move an intention to a different day.
10. **Screen readers** have not been tested manually (TalkBack/VoiceOver).

## Recommended next tasks

1. Check the implementation against the full, unabridged master prompt (sections 4 to 17) and close any differences, starting with the design system.
2. Add offline support with a versioned service worker and full PWA install, then move storage to IndexedDB behind the existing adapter.
3. Have a second reader review the 24 scenarios and 11 readings for tone and originality, and do a manual TalkBack pass on an Android phone.
