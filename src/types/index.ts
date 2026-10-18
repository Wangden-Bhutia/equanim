export type DomainId = 'speech' | 'personalisation' | 'inquiry' | 'effort';
export const DOMAIN_IDS: DomainId[] = ['speech', 'personalisation', 'inquiry', 'effort'];

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  displayName: string;
  streaksEnabled: boolean;
  theme: ThemePreference;
}

export type IntentionCategory =
  | 'speak-carefully'
  | 'separate-observation'
  | 'ask-before-assuming'
  | 'pause-before-responding'
  | 'sincere-effort'
  | 'custom';

export interface Intention {
  id: string;
  date: string; // local YYYY-MM-DD
  category: IntentionCategory;
  domain: DomainId | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

/** Evening reflection. Every answer is optional. */
export interface EveningReflection {
  id: string;
  date: string;
  happened: string;
  initial: string;
  did: string;
  alternative: string;
  nextTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeCompletion {
  id: string;
  practiceId: string;
  date: string;
  response: string;
  completedAt: string;
}

export interface ScenarioAttempt {
  id: string;
  scenarioId: string;
  optionId: string;
  at: string;
}

export interface ScenarioCompletion {
  id: string;
  scenarioId: string;
  at: string;
  optionIds: string[];
  note: string;
}

export type JournalType = 'incident' | 'daily' | 'free';

export interface JournalEntry {
  id: string;
  type: JournalType;
  answers: Record<string, string>;
  domain: DomainId | null;
  scenarioId: string | null;
  themes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LibraryRecord {
  itemId: string;
  /** opened = viewed; completed = user marked the reading complete; exercise = user marked the exercise as tried. */
  kind: 'opened' | 'completed' | 'exercise';
  at: string;
}

export interface InProgress {
  kind: 'scenario' | 'practice';
  refId: string;
  startedAt: string;
  draft: string;
}

export interface AppData {
  schemaVersion: number;
  createdAt: string;
  onboardingCompletedAt: string | null;
  settings: Settings;
  intentions: Intention[];
  reflections: EveningReflection[];
  practices: PracticeCompletion[];
  attempts: ScenarioAttempt[];
  completions: ScenarioCompletion[];
  journal: JournalEntry[];
  library: LibraryRecord[];
  inProgress: InProgress | null;
}
