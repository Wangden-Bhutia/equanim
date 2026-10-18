/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface-2) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        onaccent: 'rgb(var(--on-accent) / <alpha-value>)',
        accentsoft: 'rgb(var(--accent-soft) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
        claysoft: 'rgb(var(--clay-soft) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        terracotta: 'rgb(var(--terracotta) / <alpha-value>)',
        speech: 'rgb(var(--d-speech) / <alpha-value>)',
        personalisation: 'rgb(var(--d-personalisation) / <alpha-value>)',
        inquiry: 'rgb(var(--d-inquiry) / <alpha-value>)',
        effort: 'rgb(var(--d-effort) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: { card: '1.25rem' },
      boxShadow: { soft: '0 1px 2px rgb(48 52 47 / 0.04), 0 2px 10px rgb(48 52 47 / 0.035)' },
      maxWidth: { app: '40rem', wide: '46rem' },
    },
  },
  plugins: [],
};
