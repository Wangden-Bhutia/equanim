import { NotebookPen, Sun, TrendingUp, Info, Layers, BookMarked, Settings as Cog, ShieldCheck, CalendarDays, Dumbbell } from 'lucide-react';

/**
 * Four tabs, programme first. "also" marks the tab active on related routes (sessions, reviews and plans belong to
 * Programme). Library and scenario practice live under "Keep practising" in More; their deep links still work.
 */
export const PRIMARY_NAV: { to: string; label: string; icon: typeof Sun; end: boolean; also?: string[] }[] = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/programme', label: 'Programme', icon: CalendarDays, end: false, also: ['/session', '/review', '/baseline', '/values', '/finish'] },
  { to: '/journal', label: 'Journal', icon: NotebookPen, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
];

export const KEEP_PRACTISING = { to: '/library', label: 'Keep practising', icon: Dumbbell, desc: 'Scenarios, readings and phrases, outside the programme' };

export const SECONDARY_NAV = [
  KEEP_PRACTISING,
  { to: '/about', label: 'About Equanim', icon: Info, desc: 'What this app is, and what it is not' },
  { to: '/framework', label: 'Practice Framework', icon: Layers, desc: 'The four domains and how they work together' },
  { to: '/evidence', label: 'Evidence and sources', icon: BookMarked, desc: 'The research behind the ideas, and its limits' },
  { to: '/settings', label: 'Settings and Data', icon: Cog, desc: 'Preferences, export, import and reset' },
  { to: '/privacy', label: 'Privacy and Storage', icon: ShieldCheck, desc: 'Where your data lives, and its limits' },
];
