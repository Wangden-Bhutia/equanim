import { BookOpen, Compass, NotebookPen, Sun, TrendingUp, Info, Layers, BookMarked, Settings as Cog, ShieldCheck } from 'lucide-react';

export const PRIMARY_NAV = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/practise', label: 'Practise', icon: Compass, end: false },
  { to: '/journal', label: 'Journal', icon: NotebookPen, end: false },
  { to: '/library', label: 'Library', icon: BookOpen, end: false },
  { to: '/progress', label: 'Progress', icon: TrendingUp, end: false },
];

export const SECONDARY_NAV = [
  { to: '/about', label: 'About Equanim', icon: Info, desc: 'What this app is, and what it is not' },
  { to: '/framework', label: 'Practice Framework', icon: Layers, desc: 'The four domains and how they work together' },
  { to: '/references', label: 'Reading and References', icon: BookMarked, desc: 'Sources and attribution' },
  { to: '/settings', label: 'Settings and Data', icon: Cog, desc: 'Preferences, export, import and reset' },
  { to: '/privacy', label: 'Privacy and Storage', icon: ShieldCheck, desc: 'Where your data lives, and its limits' },
];
