# Equanim master prompt (partial copy)

> **Important: this copy is incomplete.** The building agent received the user's
> "PROJECT MASTER PROMPT — EQUANIM" with roughly 20,000 characters omitted from the
> middle. What is reproduced below is verbatim for the parts that were visible:
> sections 1, 2 and 3 in full, then the end of section 17 and sections 18, 19 and 20.
> Sections 4 to 16 and the start of section 17 were **not** visible. The user should
> paste the full original here so that it can be checked against the implementation.
> Requirements from the missing sections that were relayed second-hand (stack, screens,
> data handling, content counts, design tokens) are listed in `docs/audit.md`.

---

PROJECT MASTER PROMPT — EQUANIM

1. Project identity

App name: Equanim
Tagline: Clarity in the midst of life.
Product category: Personal philosophy and daily behavioural-practice companion
Primary platform: Mobile-first web application
Hosting: GitHub Pages
Future platform: Android application, potentially through Capacitor
Development approach: Build a complete, tested and deployable MVP before adding optional features.

You are the lead product designer, frontend architect and implementation engineer for Equanim. Build the actual application, including its source code, user interface, practice engine, persistence, tests, documentation and deployment pipeline.

Do not stop at a mock-up, wireframe, landing page or list of proposed features. Inspect the project environment first, then implement the application in the existing repository. If no project exists, create the project structure and all necessary files.

If a requirement cannot be completed, state precisely what remains incomplete. Never represent a planned, simulated or untested feature as finished.

---

2. Product philosophy

Equanim is an application for learning to respond to everyday life with greater awareness, clarity, balance and personal responsibility.

Its intellectual foundation is the broad philosophy and practical themes of Don Miguel Ruiz's The Four Agreements. The app should translate related ideas into an original, independent system of daily practice.

The user should learn to:

1. Speak with greater care and integrity.
2. Distinguish facts from personal interpretations and emotional reactions.
3. Question assumptions before acting on them.
4. Make a sincere effort without demanding perfection.
5. Observe habitual reactions and gradually develop more deliberate responses.

These are the underlying themes, not a licence to reproduce the book.

Intellectual-property requirements

- Do not reproduce passages, paragraphs, exercises or distinctive formulations from The Four Agreements.
- Do not copy the book's chapter text or create a substitute edition of it.
- Express the underlying concepts through original explanations, examples, questions, exercises and scenario feedback.
- Do not imitate Osho's distinctive writing style. Use an independent voice that is contemplative, fluid, accessible, philosophical and occasionally poetic.
- Do not imply that Equanim is endorsed by Don Miguel Ruiz, Osho, their publishers or any related organisation.
- Include an appropriately worded attribution and disclaimer in the About and References sections.
- Make clear that Equanim is an independent educational and self-reflection tool.

The writing should feel calm and thoughtful rather than preachy. It should invite observation instead of issuing commands.

For example, prefer a question such as, “What did you observe, and what meaning did you add to it?” over a generic motivational slogan.

Avoid spiritual grandiosity, exaggerated promises, artificial wisdom, excessive quotations and motivational filler.

---

3. Product principles

Every design and implementation decision must follow these principles.

Practice over consumption: Users should spend more time applying an idea than reading about it.

Awareness before reaction: Exercises should help users recognise the gap between an event and their response.

Reflection without self-punishment: A difficult day is useful information, not a failure.

Specificity over vagueness: Scenarios, questions and feedback should address recognisable situations and concrete choices.

Consistency over intensity: Short, repeatable sessions should be more prominent than lengthy lessons.

Progress without perfectionism: Never imply that a user has failed because they missed a day or experienced an emotional reaction.

Personal agency: The application should help the user think, not tell the user what to think.

Privacy by default: Personal reflections should remain on the user's device unless the user explicitly exports them.

---

[SECTIONS 4 TO 16 AND THE START OF SECTION 17 WERE NOT VISIBLE TO THE BUILDING AGENT]

[...] configure the repository.
- How to enable GitHub Pages.
- How to trigger deployment.
- How to identify a failed workflow.
- How to configure the project base path.
- How to test the built application locally.
- How to prepare the project for a future Capacitor-based Android wrapper.

Do not claim a successful live deployment until the relevant deployment workflow has succeeded and the published application has been checked.

---

18. Required implementation sequence

Work in the following order. Do not skip the foundation to focus on visual polish.

Phase 1 — Project inspection and foundation

Inspect the repository and report the existing stack, entry points, configuration and constraints.

Create or repair the application foundation, design tokens, navigation and storage architecture.

Phase 2 — Complete core user journey

Implement onboarding, Today, the four-domain practice engine, scenario feedback, Journal and persistence.

The app must be usable from the first session to the first saved reflection.

Phase 3 — Library and Progress

Implement original reading content, references, completion records and progress calculations derived from real data.

Phase 4 — Settings and reliability

Implement data export/import/reset, error handling, accessibility, responsive behaviour and tests.

Phase 5 — Deployment

Configure GitHub Actions and GitHub Pages, run production checks, document deployment and verify the deployed result when repository access permits.

Phase 6 — Final audit

Review the actual implementation against this prompt. Identify incomplete items, bugs, shortcuts, untested behaviours and future enhancements.

Do not expand into optional features until the preceding phases work.

---

19. Definition of done

The MVP is ready for deployment only when all applicable requirements below have been met:

- [ ] The app consistently uses the name Equanim.
- [ ] The visual identity matches the specified design system.
- [ ] All five primary navigation destinations work.
- [ ] Onboarding leads into a usable first practice.
- [ ] Morning intentions persist.
- [ ] At least 20 original scenarios are implemented.
- [ ] Scenario choices return relevant, option-specific feedback.
- [ ] Completed scenarios and attempts are recorded.
- [ ] Journal entries can be created, edited, revisited and deleted.
- [ ] The Library contains the specified original reading sections and exercises.
- [ ] Progress is calculated from actual user records.
- [ ] JSON export and validated import work.
- [ ] Reset is deliberate and appropriately confirmed.
- [ ] The app works on common mobile and desktop widths.
- [ ] No primary navigation item or visible action is a dead end.
- [ ] The production build succeeds.
- [ ] The relevant automated tests have been executed.
- [ ] GitHub Pages configuration and deployment documentation are present.
- [ ] Intellectual-property and privacy requirements are followed.
- [ ] No fake data, fake AI capabilities or unsupported completion claims are presented.

If a requirement cannot be completed, report it explicitly and explain the next step needed.

---

20. Final response required from the coding agent

When implementation work is complete, provide a concise engineering report with:

1. A summary of what was implemented.
2. The main files and architecture.
3. The exact build and test commands executed, with their results.
4. Any remaining defects or incomplete requirements.
5. The GitHub Pages deployment steps and required repository settings.
6. The live URL only if deployment has actually succeeded and the URL is verified.
7. The next three recommended development tasks, prioritised by importance.

Final instruction: Build Equanim as a coherent tool for practising awareness in ordinary life. The measure of quality is not the number of screens, animations or features. It is whether a person can use the app consistently, reflect honestly, recognise habitual reactions and make more deliberate choices in real situations.
