import { defineConfig, devices } from '@playwright/test';

const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  retries: remote ? 1 : 0,
  reporter: [['list']],
  use: {
    ...devices['Pixel 7'],
    baseURL: remote ?? 'http://localhost:4173/equanim/',
    viewport: { width: 390, height: 844 },
    // Transitions are disabled so colour-contrast checks never sample mid-animation.
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'mobile-390', use: { browserName: 'chromium' } }],
  webServer: remote
    ? undefined
    : { command: 'npm run preview', url: 'http://localhost:4173/equanim/', reuseExistingServer: true },
});
