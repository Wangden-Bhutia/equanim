import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Moon, Pencil, PlayCircle, Sunrise, Timer } from 'lucide-react';
import { useStore, type ReflectionDraft } from '../app/store';
import { INTENTION_OPTIONS } from '../data/domains';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { PRACTICE_BY_ID } from '../data/practices';
import { orientationFor } from '../data/orientation';
import { dateKey, dayIndex, formatLongDate } from '../engine/dates';
import { computeStreak, activityDays, practiceForDay, suggestScenarioId } from '../engine/progress';
import type { IntentionCategory } from '../types';
import { DomainTag } from '../components/ui';

export const REFLECTION_QUESTIONS: { key: keyof ReflectionDraft; label: string }[] = [
  { key: 'happened', label: 'What happened?' },
  { key: 'initial', label: 'What did I initially think or feel?' },
  { key: 'did', label: 'What did I do?' },
  { key: 'alternative', label: 'What alternative response was available?' },
  { key: 'nextTime', label: 'What will I try next time?' },
];

function SectionTitle({ icon, children, id }: { icon: React.ReactNode; children: React.ReactNode; id: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 id={id} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h2>
    </div>
  );
}

function Intention() {
  const { data, setIntention } = useStore();
  const today = dateKey();
  const intention = data.intentions.find((i) => i.date === today) ?? null;
  const [editing, setEditing] = useState(!intention);
  const [category, setCategory] = useState<IntentionCategory>(intention?.category ?? 'separate-observation');
  const [text, setText] = useState(intention?.text ?? INTENTION_OPTIONS[1]?.example ?? '');

  const pick = (c: IntentionCategory) => {
    setCategory(c);
    const opt = INTENTION_OPTIONS.find((o) => o.id === c);
    setText(opt ? opt.example : '');
  };
  const save = () => {
    if (!text.trim()) return;
    setIntention(category, text, INTENTION_OPTIONS.find((o) => o.id === category)?.domain ?? null);
    setEditing(false);
  };
  const label = category === 'custom' ? 'Custom intention' : INTENTION_OPTIONS.find((o) => o.id === category)?.label;

  return (
    <section className="card" aria-labelledby="int-h">
      <SectionTitle id="int-h" icon={<Sunrise size={18} className="text-terracotta" aria-hidden="true" />}>Morning intention</SectionTitle>
      {intention && !editing ? (
        <div>
          <p className="text-[13px] text-muted">{intention.category === 'custom' ? 'Custom intention' : INTENTION_OPTIONS.find((o) => o.id === intention.category)?.label}</p>
          <p className="font-serif text-[20px] leading-snug mt-1">{intention.text}</p>
          <button className="btn-ghost !px-0 mt-2 text-sm" onClick={() => { setCategory(intention.category); setText(intention.text); setEditing(true); }}>
            <Pencil size={15} aria-hidden="true" />Change intention
          </button>
        </div>
      ) : (
        <div>
          <p className="text-muted text-[15px] mb-3">Choose one practical intention to carry through the day, or write your own.</p>
          <fieldset>
            <legend className="sr-only">Intention category</legend>
            <div className="space-y-2">
              {[...INTENTION_OPTIONS.map((o) => ({ id: o.id as IntentionCategory, label: o.label })), { id: 'custom' as IntentionCategory, label: 'Write my own' }].map((o) => (
                <label key={o.id} className={`flex items-center cursor-pointer rounded-xl border px-4 min-h-[44px] py-2 text-[14.5px] ${category === o.id ? 'border-accent bg-accentsoft text-ink font-medium' : 'border-line text-ink'}`}>
                  <input type="radio" name="category" value={o.id} checked={category === o.id} onChange={() => pick(o.id)} className="sr-only" />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="int-text" className="label mt-4">{category === 'custom' ? 'Your intention' : 'Make it specific (optional edit)'}</label>
          <textarea id="int-text" className="field min-h-[80px]" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Today I will…" />
          <div className="mt-4 flex gap-3">
            <button className="btn-primary" onClick={save} disabled={!text.trim()}>Set intention</button>
            {intention && <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
          </div>
          <p className="sr-only" aria-live="polite">{label}</p>
        </div>
      )}
    </section>
  );
}

function DailyPracticeCard({ practiceId }: { practiceId: string }) {
  const { data, setPracticeDraft, completePractice } = useStore();
  const today = dateKey();
  const doneToday = data.practices.find((p) => p.date === today);
  const practice = PRACTICE_BY_ID[doneToday?.practiceId ?? practiceId];
  const draftSaved = data.inProgress?.kind === 'practice' && data.inProgress.refId === practice?.id ? data.inProgress.draft : '';
  const [open, setOpen] = useState(!!draftSaved);
  const [response, setResponse] = useState(draftSaved);
  if (!practice) return null;

  return (
    <section className="card" aria-labelledby="pr-h" id="daily-practice">
      <SectionTitle id="pr-h" icon={<Timer size={18} className="text-accent" aria-hidden="true" />}>Daily practice · {practice.minutes} min</SectionTitle>
      <DomainTag domain={practice.domain} />
      <h3 className="font-serif text-[20px] font-semibold mt-1">{practice.title}</h3>
      {doneToday ? (
        <div className="mt-2">
          <p className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />Completed today</p>
          {doneToday.response && <p className="text-muted mt-2 whitespace-pre-wrap break-words">{doneToday.response}</p>}
        </div>
      ) : !open ? (
        <>
          <p className="text-muted text-[15px] mt-1">{practice.explanation}</p>
          <button className="btn-primary mt-4" onClick={() => setOpen(true)}>Begin practice</button>
        </>
      ) : (
        <div className="mt-2">
          <p className="text-[15px]">{practice.explanation}</p>
          <p className="mt-3 rounded-xl bg-surface2/70 p-3 text-[15px]"><span className="font-semibold">Try this: </span>{practice.action}</p>
          <label htmlFor="pr-resp" className="label mt-4">{practice.prompt}</label>
          <textarea id="pr-resp" className="field min-h-[96px]" value={response}
            onChange={(e) => { setResponse(e.target.value); setPracticeDraft(practice.id, e.target.value); }} />
          <p className="text-[13px] text-muted mt-1.5">Your response is saved as you type, so you can come back to it later.</p>
          <button className="btn-primary mt-4" onClick={() => completePractice(practice.id, response)}>Mark practice complete</button>
        </div>
      )}
    </section>
  );
}

function EveningReflection() {
  const { data, saveReflection } = useStore();
  const today = dateKey();
  const existing = data.reflections.find((r) => r.date === today);
  const [editing, setEditing] = useState(false);
  const empty: ReflectionDraft = { happened: '', initial: '', did: '', alternative: '', nextTime: '' };
  const [draft, setDraft] = useState<ReflectionDraft>(existing ? { happened: existing.happened, initial: existing.initial, did: existing.did, alternative: existing.alternative, nextTime: existing.nextTime } : empty);
  const hasAny = REFLECTION_QUESTIONS.some((q) => draft[q.key].trim());

  return (
    <section className="card" aria-labelledby="ref-h" id="evening-reflection">
      <SectionTitle id="ref-h" icon={<Moon size={18} className="text-accent" aria-hidden="true" />}>Evening reflection</SectionTitle>
      {existing && !editing ? (
        <div>
          <p className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />Reflection saved for today</p>
          <dl className="mt-3 space-y-2 text-[15px]">
            {REFLECTION_QUESTIONS.filter((q) => existing[q.key]).map((q) => (
              <div key={q.key}><dt className="text-muted text-[13px]">{q.label}</dt><dd className="whitespace-pre-wrap break-words">{existing[q.key]}</dd></div>
            ))}
          </dl>
          <button className="btn-ghost !px-0 mt-2 text-sm" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden="true" />Edit reflection</button>
        </div>
      ) : !editing ? (
        <div>
          <p className="text-muted text-[15px]">Come back when the day winds down. Five short questions, none of them required.</p>
          <button className="btn-secondary mt-3" onClick={() => setEditing(true)}>Reflect on today</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (hasAny) { saveReflection(draft); setEditing(false); } }} className="space-y-4">
          {REFLECTION_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label htmlFor={`ref-${q.key}`} className="label">{q.label}</label>
              <textarea id={`ref-${q.key}`} className="field min-h-[72px]" value={draft[q.key]} onChange={(e) => setDraft({ ...draft, [q.key]: e.target.value })} />
            </div>
          ))}
          <p className="text-[13px] text-muted">Answer any or all. A difficult day is useful information, not a failure.</p>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={!hasAny}>Save reflection</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  );
}

function ContinueCard() {
  const { data, clearInProgress } = useStore();
  const ip = data.inProgress;
  if (!ip) return null;
  const isScenario = ip.kind === 'scenario';
  const title = isScenario ? SCENARIO_BY_ID[ip.refId]?.title : PRACTICE_BY_ID[ip.refId]?.title;
  if (!title) return null;
  const to = isScenario ? `/practise/${ip.refId}` : '/#daily-practice';
  return (
    <section className="card !p-4 border-accent/40" aria-labelledby="cont-h">
      <h2 id="cont-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Continue where you left off</h2>
      <div className="mt-2 flex items-center gap-3">
        <PlayCircle size={22} className="text-accent shrink-0" aria-hidden="true" />
        <p className="flex-1 min-w-0"><span className="block font-medium">{title}</span><span className="block text-sm text-muted">{isScenario ? 'Scenario not yet completed' : 'Daily practice, draft saved'}</span></p>
      </div>
      <div className="mt-3 flex gap-2">
        {isScenario ? (
          <Link to={to} className="btn-primary">Resume<ArrowRight size={16} aria-hidden="true" /></Link>
        ) : (
          <a href="#daily-practice" onClick={(e) => { e.preventDefault(); document.getElementById('daily-practice')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn-primary">Resume<ArrowRight size={16} aria-hidden="true" /></a>
        )}
        <button className="btn-ghost text-sm" onClick={clearInProgress}>Dismiss</button>
      </div>
    </section>
  );
}

export function Today() {
  const { data } = useStore();
  const now = new Date();
  const today = dateKey(now);
  const dayNum = dayIndex(today);
  const intention = data.intentions.find((i) => i.date === today) ?? null;
  const scenario = SCENARIO_BY_ID[suggestScenarioId(data, intention?.domain ?? null, dayNum)];
  const scenarioDoneToday = scenario ? data.completions.some((c) => c.scenarioId === scenario.id && dateKey(new Date(c.at)) === today) : false;
  const streak = computeStreak(activityDays(data), today);
  const name = data.settings.displayName;

  return (
    <div className="space-y-5">
      {/* A. Daily orientation */}
      <section aria-labelledby="orient-h">
        <p className="eyebrow">{formatLongDate(now)}{name ? ` · ${name}` : ''}</p>
        <h1 id="orient-h" className="text-[26px] lg:text-[30px] leading-snug font-semibold mt-2">{orientationFor(dayNum)}</h1>
        {data.settings.streaksEnabled && streak.current > 0 && (
          <p className="text-sm text-muted mt-2">{streak.current} {streak.current === 1 ? 'day' : 'days'} in a row. Missing a day never removes what you have practised.</p>
        )}
      </section>

      <ContinueCard />
      <Intention />
      <DailyPracticeCard practiceId={practiceForDay(intention?.domain ?? null, dayNum)} />

      {scenario && (
        <section className="card" aria-labelledby="sug-h">
          <h2 id="sug-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-3">Scenario of the day</h2>
          <DomainTag domain={scenario.domain} />
          <h3 className="font-serif text-[20px] font-semibold mt-1">{scenario.title}</h3>
          <p className="text-muted text-[15px] mt-1 line-clamp-2">{scenario.situation}</p>
          {scenarioDoneToday ? (
            <p className="flex items-center gap-2 font-medium text-accent mt-3"><Check size={18} aria-hidden="true" />Completed today</p>
          ) : (
            <Link to={`/practise/${scenario.id}`} className="btn-primary mt-4">Open scenario<ArrowRight size={17} aria-hidden="true" /></Link>
          )}
        </section>
      )}

      <EveningReflection />
    </div>
  );
}
