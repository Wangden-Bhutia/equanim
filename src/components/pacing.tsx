import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { useStore } from '../app/store';
import { dateKey } from '../engine/dates';
import { dayLabel, opensOn, wouldBeEarly } from '../engine/programme';

export const SPACING_NOTE = 'Spacing sessions across days helps the learning stick, and leaves time to try each idea in real life. Your pace is still yours.';

/** "Do the next one now anyway", confirmed once. Calls onGo after the confirmation. */
export function EarlyStart({ onGo, className = '' }: { onGo: () => void; className?: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className={`btn-ghost !px-0 text-[14.5px] underline underline-offset-2 ${className}`} onClick={() => setAsking(true)}>Do the next one now anyway</button>;
  return (
    <div className={`rounded-xl bg-surface2/70 p-3 ${className}`} role="group" aria-label="Start the next session today">
      <p className="text-[15px]">{SPACING_NOTE}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={onGo} autoFocus>Start it now</button>
        <button type="button" className="btn-ghost" onClick={() => setAsking(false)}>I’ll wait until tomorrow</button>
      </div>
    </div>
  );
}

/** The quiet "opens tomorrow" line, with its date. */
export function OpensLine({ day }: { day: string }) {
  return (
    <p className="text-[15px] flex gap-2 items-start"><CalendarClock size={18} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
      <span>Next session opens tomorrow, {dayLabel(day)}.</span></p>
  );
}

/**
 * Wraps a programme session page. When another session was already done today, shows "Opens tomorrow" with the
 * override instead of the content. `?early=1` (set by the override) lets the page through; the store then records
 * earlyStart on completion.
 */
export function Paced({ sessionId, title, children }: { sessionId: string; title: React.ReactNode; children: React.ReactNode }) {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const today = dateKey();
  const day = opensOn(data, today);
  if (!wouldBeEarly(data, sessionId, today) || params.get('early') === '1' || day === null) return <>{children}</>;
  return (
    <div>
      {title}
      <section className="card space-y-3" aria-label="Opens tomorrow">
        <p className="font-serif text-[20px] font-semibold">Opens tomorrow</p>
        <OpensLine day={day} />
        <p className="text-muted text-[15px]">You have done a session today. Tomorrow is a good time for this one, and there is no deadline.</p>
        <Link to="/" className="btn-primary">Back to Today<ArrowRight size={16} aria-hidden="true" /></Link>
        <EarlyStart onGo={() => { const p = new URLSearchParams(params); p.set('early', '1'); setParams(p, { replace: true }); }} />
      </section>
    </div>
  );
}

/** Navigates to a session route with the early flag set. */
export function useEarlyGo() {
  const nav = useNavigate();
  return (route: string) => nav(`${route}${route.includes('?') ? '&' : '?'}early=1`);
}
