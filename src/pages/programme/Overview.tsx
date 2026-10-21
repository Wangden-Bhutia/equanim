import { Link, useParams } from 'react-router-dom';
import { Check, ChevronRight, Circle, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { DAY0_ID, DAY_TYPES, SESSIONS, WEEKS } from '../../data/programme';
import { currentSessionId, isDone, isUnlocked, pathProgress, sessionRoute, weekDayLabel } from '../../engine/programme';
import { PageHeader } from '../../components/ui';
import { ProgrammeChip } from '../../components/programme';
import { NotFound } from '../NotFound';

export function ProgrammeOverview() {
  const { data } = useStore();
  const cur = currentSessionId(data);
  return (
    <div>
      <PageHeader title="The 6-week programme" back="/" intro="Six to ten minutes a day, plus a short review each week. Sessions open in order and can be done late; nothing is lost by a gap." />
      {data.programme && <div className="mb-6"><ProgrammeChip label={weekDayLabel(cur)} progress={pathProgress(data)} /></div>}
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
  return (
    <div>
      <PageHeader eyebrow={`Week ${w.week}`} title={w.title} back="/programme" intro={w.summary} />
      <ol className="space-y-2">
        {ss.map((s) => {
          const done = isDone(data, s.id);
          const open = s.available && isUnlocked(data, s.id);
          const body = (
            <>
              {done ? <Check size={20} className="text-accent shrink-0" aria-hidden="true" /> : open ? <Circle size={20} className="text-accent shrink-0" aria-hidden="true" /> : <Lock size={18} className="text-muted shrink-0" aria-hidden="true" />}
              <span className="flex-1 min-w-0"><span className="block font-medium">Day {s.day} · {DAY_TYPES[s.day]?.label}</span>
                <span className="block text-sm text-muted">{s.available ? `${s.title} · ${s.minutes} min` : 'Arrives in the next update'}{done ? ' · done' : !open && s.available ? ' · opens after the previous session' : ''}</span></span>
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
  return (
    <div>
      <PageHeader title="Finishing the programme" back="/programme" />
      <div className="card"><p>The end of Week 6 is where you will compare today with your Day 0 baseline and choose how to keep going. It arrives with Weeks 2 to 6 in the next update.</p>
        <Link to="/library" className="btn-secondary mt-4">Keep practising</Link></div>
    </div>
  );
}
