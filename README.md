# Equanim

*Clarity in the midst of life.*

Equanim is a mobile-first, local-first web app for daily practice in awareness: careful speech, separating events from the meaning we add, checking assumptions, and sincere effort without perfectionism. It has no backend, no accounts, no analytics and no AI. Everything a user writes stays in their browser unless they export it.

Equanim is an independent educational and self-reflection tool inspired by broad themes in Don Miguel Ruiz's *The Four Agreements*. All content is original, and the app is not affiliated with or endorsed by the author or publisher.

## Stack

- React 18 + TypeScript (strict, `noUncheckedIndexedAccess`) + Vite 5
- Tailwind CSS 3 with CSS-variable design tokens (light and dark), Lucide icons
- Self-hosted fonts via Fontsource: Source Serif 4 (headings) and Inter (UI)
- React Router `HashRouter` (works on GitHub Pages without server rewrites)
- Vitest + React Testing Library (unit and integration), Playwright + axe-core (end-to-end at 390x844 and 360px)

## Structure

```
src/
  app/App.tsx          routes and onboarding gate
  app/store.tsx        React context: all state changes go through here
  lib/types.ts         data model
  lib/schema.ts        schema version, migrations, validation, empty data
  lib/storage.ts       StorageAdapter interface, LocalStorage/Memory adapters, Repository (load/save/corruption handling)
  lib/transfer.ts      JSON export, validated import, merge
  lib/progress.ts      progress, streaks and daily suggestion, all derived from records
  data/domains.ts      the four practice areas
  data/scenarios.ts    24 scenarios with option-specific feedback
  data/library.ts      4 area readings + 7 essays
  screens/             Today, Practise, ScenarioPlayer, Journal, Library, Progress, Settings, Pages (About, Framework, References, Privacy, More), Onboarding
  components/          Layout (header + bottom nav), shared UI, ErrorBoundary
tests/unit/            Vitest + RTL
tests/e2e/             Playwright journey
docs/                  master prompt (partial copy), audit
```

### Data and storage

All data lives in one versioned JSON document under the `equanim:data` key in `localStorage`, accessed only through the `StorageAdapter` interface (`get`, `set`, `remove`, `keys`). To move to IndexedDB or Capacitor Preferences later, implement that interface; nothing else changes.

- `schemaVersion` is checked on load. Migrations in `src/lib/schema.ts` are keyed by the version they upgrade from and run in order. Version 0 (no version field) is upgraded to 1.
- If stored data cannot be parsed or validated, the raw text is copied to an `equanim:unreadable:<timestamp>` key (never deleted), the app starts fresh and shows a notice.
- Data from a newer schema is preserved the same way and reported as such.
- Import validates the whole file, shows a summary, then offers Merge, Replace or Cancel. The current data is saved as a restore point first ("Undo last import").
- Reset requires typing `ERASE` and removes every `equanim:` key.

## Commands

```bash
npm ci
npm run dev          # local development at http://localhost:5173/equanim/
npm run typecheck
npm run lint
npm test             # Vitest unit + integration tests
npm run build        # tsc + vite build into dist/
npm run preview      # serve dist/ at http://localhost:4173/equanim/
npx playwright install chromium
npm run test:e2e     # builds must exist; runs against the preview server
BASE_URL=https://wangden-bhutia.github.io/equanim/ npx playwright test   # same journey against the live site
SHOTS_DIR=./shots npx playwright test   # also saves phone screenshots
```

## Deployment (GitHub Pages)

1. The repository must be public (or on a plan that allows Pages for private repos).
2. In **Settings > Pages**, set **Source** to **GitHub Actions**. (Done for this repo via the API: `gh api -X POST repos/OWNER/equanim/pages -f build_type=workflow`.)
3. Push to `main`. `.github/workflows/deploy.yml` runs typecheck, lint, unit tests, build and the Playwright journey, then uploads `dist/` and deploys it with the official `actions/upload-pages-artifact` and `actions/deploy-pages` actions. Pull requests run the same checks without deploying.
4. Trigger a deploy manually from **Actions > CI and deploy to GitHub Pages > Run workflow**, or `gh workflow run deploy.yml`.
5. **Identify a failed workflow:** the Actions tab shows a red cross; `gh run list --workflow deploy.yml` and `gh run view <id> --log-failed` show the failing step. A failed build never deploys.
6. **Base path:** the site is served from `/equanim/`, set by `base` in `vite.config.ts`. If the repository is renamed, change `base` (and `id` in `public/manifest.webmanifest`) to match. Routing uses hash URLs (`#/journal`), so no 404 fallback is needed.
7. **Test the built app locally:** `npm run build && npm run preview`, then open http://localhost:4173/equanim/.

## Preparing for Android (Capacitor)

Not done yet. The groundwork is in place:

- Relative asset paths and `HashRouter` mean the built `dist/` can be loaded from a local file origin.
- Storage is behind `StorageAdapter`; on Android, a `@capacitor/preferences` adapter is recommended so data is not lost if the WebView clears storage.
- Steps when ready: `npm i @capacitor/core @capacitor/cli @capacitor/android`, `npx cap init Equanim com.example.equanim --web-dir=dist`, set Vite `base` to `./` for the native build, `npm run build && npx cap add android && npx cap sync`, then open in Android Studio. Replace the export download with the Capacitor Filesystem/Share plugins, since WebView downloads behave differently.

## Privacy

No network requests are made after the app files load: no analytics, no fonts from third parties, no APIs. See the in-app Privacy page.
