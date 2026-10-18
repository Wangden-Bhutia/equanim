export type DomainId = 'words' | 'perspective' | 'assumptions' | 'effort';
export const DOMAIN_IDS: DomainId[] = ['words', 'perspective', 'assumptions', 'effort'];

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  displayName: string;
  streaksEnabled: boolean;
  theme: ThemePreference;
}

/** How the day went relative to the morning intention. Deliberately non-judgemental. */
export type ReflectionOutcome = 'in-the-moment' | 'afterwards' | 'slipped-past';

export interface EveningReflection {
  outcome: ReflectionOutcome;
  note: string;
  at: string; // ISO timestamp
}

export interface Intention {
  id: string;
  date: string; // local YYYY-MM-DD
  domain: DomainId;
  text: string;
  createdAt: string;
  updatedAt: string;
  reflection: EveningReflection | null;
}

export interface ScenarioAttempt {
  id: string;
  scenarioId: string;
  optionId: string;
  at: string;
}

export interface JournalEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  domain: DomainId | null;
  scenarioId: string | null;
  situation: string; // what happened, as plainly as possible
  story: string; // the meaning I added
  response: string; // what I did
  nextTime: string; // what I might try
  note: string; // free reflection
}

export interface LibraryRecord {
  itemId: string;
  kind: 'read' | 'exercise';
  at: string;
}

export interface AppData {
  schemaVersion: number;
  createdAt: string;
  onboardingCompletedAt: string | null;
  settings: Settings;
  intentions: Intention[];
  attempts: ScenarioAttempt[];
  journal: JournalEntry[];
  library: LibraryRecord[];
}
