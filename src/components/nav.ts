import { BookOpen, NotebookPen, Sun, TrendingUp, Info, Layers, BookMarked, Settings as Cog, ShieldCheck, CalendarDays } from 'lucide-react';

export const PRIMARY_NAV: { to: string; label: string; icon: typeof Sun; end: boolean; also?: string[] }[] = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/journal', label: 'Journal', icon: NotebookPen, end: false },
  // "Keep practising": the library of readings and the scenario practice (/practise) live together here.
  { to: '/library', label: 'Library', icon: BookOpen, end: false, also: ['/practise'] },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
];

export const SECONDARY_NAV = [
  { to: '/programme', label: 'The 6-week programme', icon: CalendarDays, desc: 'All six weeks, and where you are' },
  { to: '/about', label: 'About Equanim', icon: Info, desc: 'What this app is, and what it is not' },
  { to: '/framework', label: 'Practice Framework', icon: Layers, desc: 'The four domains and how they work together' },
  { to: '/references', label: 'Reading and References', icon: BookMarked, desc: 'Sources and attribution' },
  { to: '/settings', label: 'Settings and Data', icon: Cog, desc: 'Preferences, export, import and reset' },
  { to: '/privacy', label: 'Privacy and Storage', icon: ShieldCheck, desc: 'Where your data lives, and its limits' },
];
