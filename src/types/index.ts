export type DomainId = 'speech' | 'personalisation' | 'inquiry' | 'effort';
export const DOMAIN_IDS: DomainId[] = ['speech', 'personalisation', 'inquiry', 'effort'];

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  displayName: string;
  streaksEnabled: boolean;
  theme: ThemePreference;
  /** When the user last exported a backup (ISO), or null. Shown in Settings; drives the gentle backup nudge. */
  lastExportAt: string | null;
  /** Day key on which the backup nudge was last dismissed, or null. */
  backupNudgeDismissedOn: string | null;
  /** Preferred reminder time "HH:MM" for the downloadable calendar reminder, or null. */
  reminderTime: string | null;
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
  /** Equanim 1.0 intention check-in, preserved exactly as it was recorded. */
  legacyCheckIn?: { outcome: LegacyOutcome; note: string };
}

export type LegacyOutcome = 'in-the-moment' | 'afterwards' | 'slipped-past';
/** Labels Equanim 1.0 showed for each check-in outcome, and for its note field. */
export const LEGACY_OUTCOME_LABELS: Record<LegacyOutcome, string> = {
  'in-the-moment': 'It came to mind in the moment',
  afterwards: 'I noticed afterwards',
  'slipped-past': 'It slipped past today',
};
export const LEGACY_NOTE_LABEL = 'What did you observe, and what meaning did you add to it?';

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

// ---------- 6-week programme (schema v3) ----------

/** Programme enrolment. Null until the user chooses to start; existing users are offered it, never forced. */
export interface ProgrammeState {
  startedAt: string;
  /** Set once the short independence and safety screen has been shown after the first completed session. */
  disclaimerSeenAt: string | null;
  /** Schema v4: set when the user moves on to maintenance mode after Week 6 (or chooses it early). */
  maintenanceStartedAt: string | null;
  /** Schema v5: when the user tapped "Got it" on the short notice at the top of Today, or null while it shows. */
  noticeDismissedAt: string | null;
}

export type SessionMode = 'think' | 'write';

/** A completed programme session. The id is derived from the session id, so a session completes once. */
export interface SessionCompletion {
  id: string;
  sessionId: string;
  completedAt: string;
  updatedAt: string;
  mode: SessionMode;
  /** Free-text answers keyed by prompt id. Empty when the user chose to think it through. */
  answers: Record<string, string>;
  /** Option ids chosen in recognise-the-pattern items, keyed by item id. */
  choices: Record<string, string>;
  /** Schema v5: true when the user chose "Do the next one now anyway" and finished it on a day another session was already done. */
  earlyStart: boolean;
  /** Schema v5: self-commit taps in Think mode, keyed by prompt id ('have-one' | 'not-sure' | 'nothing'). Not a grade. */
  thinkResponses: Record<string, string>;
}

/** One of the three chosen values, with the user's sentence. Id = value id. */
export interface ValueChoice {
  id: string;
  sentence: string;
  updatedAt: string;
}

/** Self-ratings. 'start' is Day 0; 'finish' is Week 6; 'checkin' is a monthly maintenance check-in (id bl_checkin_YYYY-MM). Not a validated instrument. */
export interface Baseline {
  id: string;
  kind: 'start' | 'finish' | 'checkin';
  ratings: Record<string, number>;
  situations: string[];
  completedAt: string;
  updatedAt: string;
}

export interface WeeklyReview {
  id: string;
  week: number;
  worked: string;
  gotInWay: string;
  noticed: string;
  /** 1–5 self-rating for the week's domain, or null if skipped. */
  rating: number | null;
  /** Schema v5: true for the lighter catch-up version, done in a week with no plan or evening check recorded. */
  catchUp: boolean;
  completedAt: string;
  updatedAt: string;
}

export type PlanOutcome = 'not-came-up' | 'tried' | 'didnt-manage';

/** "When ___, I will ___". One per day; the evening check records what happened. */
export interface IfThenPlan {
  id: string;
  date: string;
  domain: DomainId | null;
  /** Schema v5: optional id of one of the user's values that this plan serves. */
  valueId: string | null;
  when: string;
  then: string;
  outcome: PlanOutcome | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

/** Spaced-retrieval history for one question. Id = question id. */
export interface RecallRecord {
  id: string;
  /** Day key when the question was first answered; reviews fall due 2, 7 and 21 days later. */
  firstSeen: string;
  /** Day keys of later answers (quick recall). */
  reviewed: string[];
  lastCorrect: boolean;
  updatedAt: string;
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
  programme: ProgrammeState | null;
  sessions: SessionCompletion[];
  values: ValueChoice[];
  baselines: Baseline[];
  reviews: WeeklyReview[];
  plans: IfThenPlan[];
  recall: RecallRecord[];
}
