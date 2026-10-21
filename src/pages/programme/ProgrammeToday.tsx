import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, CloudDownload, Moon, NotebookPen, PlayCircle, Sunrise } from 'lucide-react';
import { useStore } from '../../app/store';
import { DAY0_ID, DAY_TYPES, DIDNT_MANAGE_RESPONSE, EVENING_QUESTION, INDEPENDENCE_TEXT, OUTCOME_LABELS, RETRIEVAL_BY_ID, SESSION_BY_ID } from '../../data/programme';
import { dateKey, formatLongDate, keyFromIso } from '../../engine/dates';
import { currentSessionId, dueRecall, isReturning, pathProgress, sessionRoute, shouldNudgeBackup, weekDayLabel } from '../../engine/programme';
import { ChoiceItem, ProgrammeChip } from '../../components/programme';
import { Dialog } from '../../components/ui';
import { Confirmation } from '../../components/Confirmation';
import { ContinueCard, DailyPracticeCard, EveningReflection, Intention, ScenarioOfTheDay } from '../Today';
import { practiceForDay } from '../../engine/progress';
import { dayIndex } from '../../engine/dates';
import type { PlanOutcome } from '../../types';

function sessionTitle(id: string) {
  if (id === DAY0_ID) return { title: 'Day 0: your values and starting point', meta: 'About 10 min · two short steps' };
  const s = SESSION_BY_ID[id];
  if (!s) return { title: id, meta: '' };
  return { title: s.title, meta: `${s.day === 6 ? 'Weekly review' : DAY_TYPES[s.day]?.label ?? ''} · ${s.minutes} min` };
}

function SessionCard() {
  const { data } = useStore();
  const cur = currentSessionId(data);
  const today = dateKey();
  const doneToday = data.sessions.filter((s) => keyFromIso(s.completedAt) === today && s.sessionId !== 'taster');
  if (cur === null) {
    return (
      <section className="card" aria-labelledby="ses-h">
        <h2 id="ses-h" className="font-serif text-[22px] font-semibold">You have finished the programme</h2>
        <Link to="/finish" className="btn-primary mt-4">Look back<ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    );
  }
  const def = SESSION_BY_ID[cur];
  if (def && !def.available) {
    return (
      <section className="card" aria-labelledby="ses-h">
        <p className="eyebrow">Today’s session</p>
        <h2 id="ses-h" className="font-serif text-[22px] font-semibold mt-1">Week {def.week} arrives in the next update</h2>
        <p className="text-muted text-[15px] mt-1">You have completed everything available so far. Your place is kept. Until then, keep practising with scenarios and readings.</p>
        <Link to="/library" className="btn-primary mt-4">Keep practising<ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    );
  }
  const { title, meta } = sessionTitle(cur);
  const isRest = doneToday.length > 0;
  return (
    <section className="card border-accent/40" aria-labelledby="ses-h">
      <p className="eyebrow">{isRest ? 'Next session · whenever you are ready' : 'Today’s session'}</p>
      <h2 id="ses-h" className="font-serif text-[22px] font-semibold mt-1">{title}</h2>
      <p className="text-muted text-[14.5px] mt-1">{meta}</p>
      {isRest && <p className="text-[15px] mt-2 flex gap-2 items-center"><Check size={17} className="text-accent" aria-hidden="true" />You did a session today. The next one is open, but one a day is plenty.</p>}
      <Link to={sessionRoute(cur, data)} className={`${isRest ? 'btn-secondary' : 'btn-primary'} mt-4`}><PlayCircle size={18} aria-hidden="true" />{isRest ? 'Start next session' : 'Start session'}</Link>
    </section>
  );
}

function StepStrip() {
  const { data } = useStore();
  const today = dateKey();
  const plan = data.plans.find((p) => p.date === today);
  const sessionDone = data.sessions.some((s) => keyFromIso(s.completedAt) === today && s.sessionId !== 'taster');
  const cur = currentSessionId(data);
  const steps = [
    { label: 'Morning plan', done: !!plan, to: '/plan', Icon: Sunrise },
    { label: 'Session', done: sessionDone, to: cur ? sessionRoute(cur, data) : '/programme', Icon: PlayCircle },
    { label: 'Evening check', done: !!plan?.outcome, to: '#evening-check', Icon: Moon },
  ];
  return (
    <nav aria-label="Today’s steps">
      <ol className="grid grid-cols-3 gap-2">
        {steps.map(({ label, done, to, Icon }, i) => {
          const cls = `flex flex-col items-center justify-center gap-1 rounded-xl border min-h-[64px] px-1 text-center text-[12.5px] font-medium ${done ? 'border-accent bg-accentsoft text-ink' : 'border-line text-ink bg-surface'}`;
          const inner = <>{done ? <Check size={18} className="text-accent" aria-hidden="true" /> : <Icon size={18} className="text-muted" aria-hidden="true" />}<span><span className="sr-only">Step {i + 1}: </span>{label}<span className="sr-only">{done ? ', done' : ', not done yet'}</span></span></>;
          return (
            <li key={label}>
              {to.startsWith('#')
                ? <a href={to} className={cls} onClick={(e) => { e.preventDefault(); document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }}>{inner}</a>
                : <Link to={to} className={cls}>{inner}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function EveningCheck() {
  const { data, checkPlan } = useStore();
  const today = dateKey();
  const plan = data.plans.find((p) => p.date === today);
  const [outcome, setOutcome] = useState<PlanOutcome | null>(plan?.outcome ?? null);
  const [note, setNote] = useState(plan?.note ?? '');
  const [editing, setEditing] = useState(!plan?.outcome);
  const [justSaved, setJustSaved] = useState(false);
  return (
    <section className="card" aria-labelledby="ev-h" id="evening-check">
      <div className="flex items-center gap-2 mb-3"><Moon size={18} className="text-accent" aria-hidden="true" /><h2 id="ev-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Evening check</h2></div>
      {!plan ? (
        <div>
          <p className="text-muted text-[15px]">No plan for today yet. Make one in the morning (or now), and come back this evening to see how it went.</p>
          <Link to="/plan" className="btn-secondary mt-3">Make a plan</Link>
        </div>
      ) : (
        <div>
          <p className="text-[13px] text-muted">This morning’s plan</p>
          <p className="font-serif text-[18px] leading-snug mt-0.5">When {plan.when}, I will {plan.then}.</p>
          {!editing && plan.outcome ? (
            <div className="mt-3">
              <Confirmation focus={justSaved} className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />{OUTCOME_LABELS[plan.outcome]}</Confirmation>
              {plan.note && <p className="text-muted mt-1 whitespace-pre-wrap break-words">{plan.note}</p>}
              {plan.outcome === 'didnt-manage' && <div className="mt-3 rounded-xl bg-surface2/70 p-3 text-[15px] space-y-2">{DIDNT_MANAGE_RESPONSE.map((t) => <p key={t}>{t}</p>)}<Link to="/plan" className="underline underline-offset-2 text-accent">Adjust the plan for tomorrow</Link></div>}
              <button className="btn-ghost !px-0 mt-2 text-sm" onClick={() => setEditing(true)}>Change answer</button>
            </div>
          ) : (
            <form className="mt-3" onSubmit={(e) => { e.preventDefault(); if (outcome) { checkPlan(outcome, note); setEditing(false); setJustSaved(true); } }}>
              <fieldset>
                <legend className="label">{EVENING_QUESTION}</legend>
                <div className="space-y-2">
                  {(Object.keys(OUTCOME_LABELS) as PlanOutcome[]).map((k) => (
                    <label key={k} className={`flex items-center cursor-pointer rounded-xl border px-4 min-h-[44px] text-[14.5px] ${outcome === k ? 'border-accent bg-accentsoft font-medium' : 'border-line'}`}>
                      <input type="radio" name="ev-outcome" value={k} checked={outcome === k} onChange={() => setOutcome(k)} className="sr-only" />{OUTCOME_LABELS[k]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="ev-note" className="label mt-3">A note <span className="text-muted font-normal">(optional)</span></label>
              <textarea id="ev-note" className="field min-h-[64px]" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you do, or what got in the way?" />
              <button type="submit" className="btn-primary mt-3" disabled={!outcome}>Save evening check</button>
            </form>
          )}
        </div>
      )}
    </section>
  );
}

function QuickRecall() {
  const { data, answerRecall } = useStore();
  const [ids] = useState(() => dueRecall(data, dateKey()));
  if (ids.length === 0) return null;
  return (
    <section aria-labelledby="qr-h" className="space-y-3">
      <h2 id="qr-h" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Quick recall</h2>
      <p className="text-[14px] text-muted">From earlier sessions. Answer from memory.</p>
      {ids.map((id) => { const q = RETRIEVAL_BY_ID[id]; return q ? <ChoiceItem key={id} id={`qr-${id}`} question={q.question} options={q.options} answerId={q.answerId} onChoose={(_o, c) => answerRecall(id, c)} /> : null; })}
    </section>
  );
}

function BackupNudge() {
  const { data, dismissBackupNudge } = useStore();
  if (!shouldNudgeBackup(data)) return null;
  return (
    <section className="card !p-4" aria-labelledby="bk-h">
      <h2 id="bk-h" className="font-semibold flex items-center gap-2"><CloudDownload size={18} className="text-accent" aria-hidden="true" />Time for a backup?</h2>
      <p className="text-[14.5px] text-muted mt-1">Everything lives only in this browser. {data.settings.lastExportAt ? 'It has been a while since your last export.' : 'You have not exported a backup yet.'} A copy takes a few seconds.</p>
      <div className="mt-3 flex gap-2"><Link to="/settings" className="btn-secondary">Export in Settings</Link><button className="btn-ghost" onClick={dismissBackupNudge}>Not now</button></div>
    </section>
  );
}

function Disclaimer() {
  const { data, markDisclaimerSeen } = useStore();
  const open = !!data.programme && !data.programme.disclaimerSeenAt && data.sessions.some((s) => s.sessionId !== 'taster');
  return (
    <Dialog open={open} title="Before you go further" onClose={markDisclaimerSeen} footer={<button className="btn-primary" onClick={markDisclaimerSeen}>I understand</button>}>
      <div className="space-y-3 text-[15px]">{INDEPENDENCE_TEXT.map((t) => <p key={t}>{t}</p>)}<p className="text-muted">All feedback in Equanim was written in advance; there is no AI. You can read this again under About.</p></div>
    </Dialog>
  );
}

export function ProgrammeToday() {
  const { data } = useStore();
  const loc = useLocation();
  const now = new Date();
  const today = dateKey(now);
  const cur = currentSessionId(data);
  const name = data.settings.displayName;
  const intention = data.intentions.find((i) => i.date === today) ?? null;
  const justFinishedDay0 = (loc.state as { completed?: string } | null)?.completed === DAY0_ID;
  return (
    <div className="space-y-5">
      <section aria-labelledby="today-h">
        <p className="eyebrow">{formatLongDate(now)}{name ? ` · ${name}` : ''}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 id="today-h" className="text-[28px] leading-tight font-semibold">Today</h1>
          <Link to="/programme" aria-label={`${weekDayLabel(cur)}. Open the programme`}><ProgrammeChip label={weekDayLabel(cur)} progress={pathProgress(data)} /></Link>
        </div>
        {justFinishedDay0 && <p role="status" className="mt-3 text-[15px]">Day 0 is done. Week 1 starts whenever you are ready.</p>}
        {isReturning(data, today) && <p className="mt-3 text-[15px] rounded-xl bg-accentsoft px-3 py-2">Welcome back. Pick up where you left off: nothing has been lost, and there is no catching up to do.</p>}
      </section>
      <SessionCard />
      <StepStrip />
      <EveningCheck />
      <BackupNudge />
      <details className="group card !p-0">
        <summary className="flex items-center justify-between cursor-pointer list-none px-5 min-h-[52px] font-semibold">
          More for today<ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <QuickRecall />
          <ContinueCard />
          <ScenarioOfTheDay />
          <Link to="/journal/new" className="card !p-4 flex items-center gap-3"><NotebookPen size={18} className="text-accent" aria-hidden="true" /><span className="flex-1">Write in your journal</span><ArrowRight size={16} aria-hidden="true" /></Link>
          <Intention />
          <DailyPracticeCard practiceId={practiceForDay(intention?.domain ?? null, dayIndex(today))} />
          <EveningReflection />
        </div>
      </details>
      <Disclaimer />
    </div>
  );
}
