import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Circle, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { DAY0_ID, DAY_TYPES, SESSIONS, SESSION_BY_ID, WEEKS } from '../../data/programme';
import { BaselineCompare, EvidenceOfChange, ValuesList, WeekMotif } from '../../components/journey';
import { dateKey } from '../../engine/dates';
import { currentSessionId, dayLabel, opensOn, inMaintenance, isDone, isUnlocked, latestSnapshot, pathProgress, sessionRoute, weekDayLabel } from '../../engine/programme';

const MAINTENANCE_PROMPTS = SESSION_BY_ID.w6d5?.prompts ?? [];
import { PageHeader } from '../../components/ui';
import { ProgrammeChip } from '../../components/programme';
import { NotFound } from '../NotFound';

export function ProgrammeOverview() {
  const { data } = useStore();
  const cur = currentSessionId(data);
  const opens = opensOn(data, dateKey());
  return (
    <div>
      <PageHeader title="The 6-week programme" back="/" intro="Six to ten minutes a day, plus a short review each week. Sessions open in order and can be done late; nothing is lost by a gap." />
      {data.programme && <div className="mb-6"><ProgrammeChip label={weekDayLabel(cur)} progress={pathProgress(data)} />
        {cur && opens && <p className="text-[14px] text-muted mt-2" data-testid="overview-opens">Next session opens {dayLabel(opens, { weekday: 'long' })}.</p>}</div>}
      <ul className="space-y-3">
        <li>
          <Link to={sessionRoute(DAY0_ID, data)} className="card !p-4 flex items-center gap-3 hover:bg-surface2">
            <span className="flex-1"><span className="eyebrow block">Week 0</span><span className="font-semibold">Day 0: values and baseline</span></span>
            {isDone(data, DAY0_ID) ? <Check size={20} className="text-accent" aria-label="Done" /> : <ChevronRight size={20} aria-hidden="true" />}
          </Link>
        </li>
        {WEEKS.map((w) => {
          const ss = SESSIONS.filter((s) => s.week === w.week);
          const n = ss.filter((s) => isDone(data, s.id)).length;
          return (
            <li key={w.week}>
              <Link to={`/programme/week/${w.week}`} className="card !p-4 flex items-center gap-3 hover:bg-surface2">
                <WeekMotif week={w.week} size={22} className="shrink-0" />
                <span className="flex-1 min-w-0"><span className="eyebrow block">Week {w.week}{ss.every((s) => !s.available) ? ' · coming in the next update' : ''}</span>
                  <span className="font-semibold block">{w.title}</span><span className="text-sm text-muted block">{w.summary}</span></span>
                <span className="text-sm text-muted shrink-0">{n}/{ss.length}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ProgrammeWeek() {
  const { n = '' } = useParams();
  const { data } = useStore();
  const w = WEEKS.find((x) => x.week === Number(n));
  if (!w) return <NotFound />;
  const ss = SESSIONS.filter((s) => s.week === w.week);
  const cur = currentSessionId(data);
  const opens = opensOn(data, dateKey());
  return (
    <div>
      <PageHeader eyebrow={`Week ${w.week}`} title={w.title} back="/programme" intro={w.summary} />
      <div className="flex items-center gap-3 mb-4 -mt-2">
        <WeekMotif week={w.week} size={24} />
        {(inMaintenance(data) || currentSessionId(data) === null) && (
          <Link to={sessionRoute(`w${w.week}d1`, data)} className="btn-secondary">Repeat this week</Link>
        )}
      </div>
      <ol className="space-y-2">
        {ss.map((s) => {
          const done = isDone(data, s.id);
          const open = s.available && isUnlocked(data, s.id);
          const body = (
            <>
              {done ? <Check size={20} className="text-accent shrink-0" aria-hidden="true" /> : open ? <Circle size={20} className="text-accent shrink-0" aria-hidden="true" /> : <Lock size={18} className="text-muted shrink-0" aria-hidden="true" />}
              <span className="flex-1 min-w-0"><span className="block font-medium">Day {s.day} · {DAY_TYPES[s.day]?.label}</span>
                <span className="block text-sm text-muted">{s.available ? `${s.title} · ${s.minutes} min` : 'Arrives in the next update'}{done ? ' · done' : s.id === cur && opens ? ` · opens ${dayLabel(opens, { weekday: 'long' })}` : !open && s.available ? ' · opens after the previous session' : ''}</span></span>
            </>
          );
          return <li key={s.id}>{open ? <Link to={sessionRoute(s.id, data)} className="card !p-4 flex items-center gap-3 hover:bg-surface2">{body}</Link> : <div className="card !p-4 flex items-center gap-3">{body}</div>}</li>;
        })}
        <li><div className="card !p-4 flex items-center gap-3 text-muted"><Circle size={20} className="shrink-0" aria-hidden="true" /><span>Day 7 · Rest. No session.</span></div></li>
      </ol>
    </div>
  );
}

export function Finish() {
  const { data, startMaintenance } = useStore();
  const cur = currentSessionId(data);
  const start = data.baselines.find((b) => b.kind === 'start');
  const now = latestSnapshot(data);
  const letter = data.sessions.find((x) => x.sessionId === 'w6d4')?.answers.letter;
  const plan = data.sessions.find((x) => x.sessionId === 'w6d5')?.answers ?? {};
  const planLines = MAINTENANCE_PROMPTS.filter((p) => plan[p.id]);
  const maintenance = inMaintenance(data);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Week 6" title="Your six weeks" back="/"
        intro={cur === null ? 'You have completed the programme. Here is what you recorded, side by side and in your own words.' : 'This page fills in as you reach Week 6. Here is what you have recorded so far.'} />
      <section className="card" aria-labelledby="fin-cmp">
        <h2 id="fin-cmp" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Day 0 and Week 6, side by side</h2>
        {now ? <BaselineCompare start={start} now={now} nowLabel={now.kind === 'checkin' ? 'Check-in' : 'Week 6'} />
          : <p className="text-muted text-[15px]">Your Week 6 snapshot will appear here next to Day 0 once you have done it.</p>}
      </section>
      <section className="card" aria-labelledby="fin-ev">
        <h2 id="fin-ev" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Evidence of change, from your notes</h2>
        <EvidenceOfChange data={data} />
      </section>
      {letter && (
        <section className="card" aria-labelledby="fin-letter">
          <h2 id="fin-letter" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Your letter to your future self</h2>
          <p className="font-serif text-[17px] whitespace-pre-wrap break-words">{letter}</p>
        </section>
      )}
      {planLines.length > 0 && (
        <section className="card" aria-labelledby="fin-plan">
          <h2 id="fin-plan" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Your maintenance plan</h2>
          <dl className="space-y-2 text-[15px]">{planLines.map((p) => <div key={p.id}><dt className="text-muted text-[13px]">{p.label}</dt><dd className="break-words">{plan[p.id]}</dd></div>)}</dl>
        </section>
      )}
      <ValuesList data={data} />
      <section className="card" aria-labelledby="fin-next">
        <h2 id="fin-next" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">What next</h2>
        {maintenance ? (
          <p className="text-[15px]">You are in maintenance mode: about three short sessions a week, a monthly check-in, and any week can be repeated from the programme page.</p>
        ) : (
          <>
            <p className="text-[15px]">Maintenance mode keeps the skills in use with a lighter rhythm: about three short sessions a week from Keep practising, and a monthly check-in. You can repeat any week whenever you like.</p>
            <button className="btn-primary mt-3" onClick={startMaintenance}>Start maintenance mode</button>
          </>
        )}
        <Link to="/library" className="btn-secondary mt-3 ml-0 sm:ml-2">Keep practising</Link>
      </section>
    </div>
  );
}
