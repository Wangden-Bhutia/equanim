import { Link } from 'react-router-dom';
import { Check, Focus, Footprints, MessageCircle, Puzzle, Search, Sunrise, type LucideIcon } from 'lucide-react';
import { BASELINE_ITEMS, RATING_LABELS, SESSIONS, VALUE_BY_ID, WEEKS, PHRASE_BANK_BY_ID } from '../data/programme';
import { DOMAINS } from '../data/domains';
import { formatShort } from '../engine/dates';
import { OUTCOME_LABELS } from '../data/programme';
import type { AppData, Baseline, DomainId } from '../types';
import { weekStatuses, type WeekStatus } from '../engine/programme';

/** A small motif for each week: a lens, a question, a voice, steps, pieces fitting, a new morning. */
export const WEEK_MOTIFS: Record<number, LucideIcon> = { 1: Focus, 2: Search, 3: MessageCircle, 4: Footprints, 5: Puzzle, 6: Sunrise };

/** Text colour for each skill (contrast-checked in tests/unit/colours.test.ts). */
export const DOMAIN_TEXT: Record<DomainId, string> = {
  personalisation: 'text-personalisation', inquiry: 'text-inquiry', speech: 'text-speech', effort: 'text-effort',
};
export const DOMAIN_BORDER: Record<DomainId, string> = {
  personalisation: 'border-personalisation', inquiry: 'border-inquiry', speech: 'border-speech', effort: 'border-effort',
};
export const DOMAIN_BG: Record<DomainId, string> = {
  personalisation: 'bg-personalisation', inquiry: 'bg-inquiry', speech: 'bg-speech', effort: 'bg-effort',
};

export function WeekMotif({ week, size = 20, className = '' }: { week: number; size?: number; className?: string }) {
  const Icon = WEEK_MOTIFS[week] ?? Focus;
  const d = WEEKS[week - 1]?.domain;
  return <Icon size={size} aria-hidden="true" className={`${d ? DOMAIN_TEXT[d] : 'text-accent'} ${className}`} />;
}

/** Short skill names for the journey map labels. */
export const WEEK_SKILL: Record<number, string> = { 1: 'Personal', 2: 'Inquiry', 3: 'Speech', 4: 'Effort', 5: 'Together', 6: 'Keep going' };

/**
 * Six connected nodes along a gentle path, one per week. Filled for completed weeks, ringed for the current week,
 * outlined for weeks ahead, each in its week's skill colour (Weeks 5 and 6 use the accent). Each node opens its week
 * and is described in full to screen readers, e.g. "Week 2 of 6, Inquiry, 3 of 6 sessions done, current week".
 */
export function JourneyMap({ data }: { data: AppData }) {
  const statuses: WeekStatus[] = weekStatuses(data);
  // Node centres on a 600 × 64 canvas: evenly spaced, gently alternating height.
  const pts = WEEKS.map((_, i) => ({ x: 50 + i * 100, y: i % 2 === 0 ? 22 : 42 }));
  const path = pts.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `C${pts[i - 1]!.x + 50} ${pts[i - 1]!.y} ${p.x - 50} ${p.y} ${p.x} ${p.y}`)).join(' ');
  return (
    <nav aria-label="Your six-week journey">
      <div className="relative">
        <svg viewBox="0 0 600 64" preserveAspectRatio="none" className="absolute inset-x-0 top-0 w-full h-16 text-line" aria-hidden="true" focusable="false">
          <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <ol className="relative grid grid-cols-6">
          {WEEKS.map((w, i) => {
            const st = statuses[i] ?? 'upcoming';
            const d = w.domain;
            const ss = SESSIONS.filter((s) => s.week === w.week);
            const n = ss.filter((s) => data.sessions.some((x) => x.sessionId === s.id)).length;
            const fill = d ? DOMAIN_BG[d] : 'bg-accent';
            const ring = d ? DOMAIN_BORDER[d] : 'border-accent';
            const cls = st === 'done' ? `${fill} border-2 ${ring}` : st === 'current' ? `bg-surface border-[3px] ${ring} ring-4 ring-accentsoft` : `bg-surface border-2 border-line`;
            const label = `Week ${w.week} of 6, ${w.title}, ${n} of ${ss.length} sessions done${st === 'current' ? ', current week' : st === 'done' ? ', complete' : ''}`;
            return (
              <li key={w.week} className="flex flex-col items-center text-center" style={{ paddingTop: `${pts[i]!.y - 18}px` }}>
                <Link to={`/programme/week/${w.week}`} aria-label={label} aria-current={st === 'current' ? 'step' : undefined}
                  className={`flex items-center justify-center w-9 h-9 rounded-full ${cls}`} data-status={st}>
                  {st === 'done' ? <Check size={16} strokeWidth={3} className={d ? 'text-surface' : 'text-onaccent'} aria-hidden="true" /> : <WeekMotif week={w.week} size={16} />}
                </Link>
                <span className={`mt-1 text-[11px] leading-tight ${st === 'current' ? 'font-semibold text-ink' : 'text-muted'}`} aria-hidden="true">{WEEK_SKILL[w.week]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

function Dots({ value, label, domain }: { value: number | undefined; label: string; domain: DomainId }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-[12.5px] text-muted">{label}</span>
      <span className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={`w-3.5 h-3.5 rounded-full ${value !== undefined && n <= value ? DOMAIN_BG[domain] : 'border border-line'}`} />)}
      </span>
      <span className="text-[12.5px] text-ink">{value ? `${value} · ${RATING_LABELS[value - 1]}` : 'not rated'}</span>
    </div>
  );
}

/** Day 0 and a later snapshot, item by item, in the user's own ratings. No totals, no change score. */
export function BaselineCompare({ start, now, nowLabel = 'Now' }: { start: Baseline | undefined; now: Baseline | null; nowLabel?: string }) {
  if (!start) return <p className="text-muted text-[15px]">There is no Day 0 snapshot to compare with.</p>;
  return (
    <div>
      <p className="text-[13px] text-muted mb-3">Day 0: {formatShort(start.completedAt)}{now ? ` · ${nowLabel}: ${formatShort(now.completedAt)}` : ''}. Your own ratings, side by side. Not a validated test, and not a score.</p>
      <ul className="space-y-3">
        {BASELINE_ITEMS.map((item) => (
          <li key={item.id} className="rounded-xl border border-line p-3">
            <p className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${DOMAIN_TEXT[item.domain]}`}>{DOMAINS[item.domain].name}</p>
            <p className="text-[14.5px] mt-0.5 mb-2">{item.text}</p>
            <Dots value={start.ratings[item.id]} label="Day 0" domain={item.domain} />
            {now && <div className="mt-1"><Dots value={now.ratings[item.id]} label={nowLabel} domain={item.domain} /></div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Concrete moments from the user's own notes: weekly reviews, plans they tried, and evening-check notes. */
export function EvidenceOfChange({ data }: { data: AppData }) {
  const reviews = [...data.reviews].sort((a, b) => a.week - b.week);
  const tried = data.plans.filter((p) => p.outcome === 'tried');
  if (reviews.length === 0 && tried.length === 0) return <p className="text-muted text-[15px]">No weekly reviews or tried plans recorded yet. Moments you remember count just as much.</p>;
  return (
    <div className="space-y-4">
      {tried.length > 0 && (
        <div>
          <p className="text-[15px]"><span className="font-semibold">{tried.length}</span> {tried.length === 1 ? 'time' : 'times'} you tried an if-then plan.</p>
          <ul className="mt-2 space-y-1.5 text-[14.5px]">
            {tried.slice(-3).map((p) => <li key={p.id} className="rounded-lg bg-surface2/60 px-3 py-2">When {p.when}, I will {p.then}.{p.note && <span className="block text-muted">{p.note}</span>}</li>)}
          </ul>
        </div>
      )}
      {reviews.filter((r) => r.worked || r.noticed).map((r) => (
        <div key={r.id} className="border-l-2 border-line pl-3">
          <p className="text-[12.5px] text-muted">Week {r.week} review</p>
          {r.worked && <p className="text-[14.5px]"><span className="text-muted">What worked: </span>{r.worked}</p>}
          {r.noticed && <p className="text-[14.5px]"><span className="text-muted">What I noticed: </span>{r.noticed}</p>}
        </div>
      ))}
    </div>
  );
}

export function ValuesList({ data, title = 'Your values' }: { data: AppData; title?: string }) {
  if (data.values.length === 0) return null;
  return (
    <section className="card" aria-label={title}>
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">{title}</h2>
      <ul className="space-y-2">
        {data.values.map((v) => <li key={v.id}><span className="font-semibold">{VALUE_BY_ID[v.id] ?? v.id}. </span><span className="text-[15px]">{v.sentence}</span></li>)}
      </ul>
    </section>
  );
}

/** "Your values", collapsed by default (Day 4 Apply and the weekly review). A link to /values when none were chosen. */
export function ValuesCollapsed({ data }: { data: AppData }) {
  if (data.values.length === 0) return <p className="text-[14.5px] text-muted">You have not chosen your values yet. <Link to="/values" className="underline underline-offset-2 text-accent">Choose them now</Link> (about three minutes).</p>;
  return (
    <details className="card !p-0 group" data-testid="values-collapsed">
      <summary className="cursor-pointer list-none px-5 min-h-[48px] flex items-center justify-between font-semibold text-[15px]">Your values<span className="text-muted text-[13px] font-normal group-open:hidden">Show</span></summary>
      <ul className="px-5 pb-4 space-y-2">
        {data.values.map((v) => <li key={v.id}><span className="font-semibold">{VALUE_BY_ID[v.id] ?? v.id}. </span><span className="text-[15px]">{v.sentence}</span></li>)}
      </ul>
    </details>
  );
}

export function PhraseBankCard({ id }: { id: string }) {
  const b = PHRASE_BANK_BY_ID[id];
  if (!b) return null;
  return (
    <section className="card" aria-label={`Phrases: ${b.title}`}>
      <p className={`text-[11.5px] font-semibold uppercase tracking-[0.06em] ${DOMAIN_TEXT[b.domain]}`}>{DOMAINS[b.domain].name}</p>
      <h2 className="font-semibold text-[16px] mt-0.5">{b.title}</h2>
      <p className="text-[13.5px] text-muted">{b.when}</p>
      <ul className="mt-2 space-y-2">{b.phrases.map((p) => <li key={p} className="rounded-xl border border-line px-3 py-2 text-[15.5px] font-serif">“{p}”</li>)}</ul>
    </section>
  );
}

export function PlanOutcomes({ data }: { data: AppData }) {
  const plans = [...data.plans].sort((a, b) => b.date.localeCompare(a.date));
  if (plans.length === 0) return <p className="text-muted text-[15px]">No if-then plans yet. Make one from Today.</p>;
  const counts = { 'not-came-up': 0, tried: 0, 'didnt-manage': 0 } as Record<keyof typeof OUTCOME_LABELS, number>;
  let open = 0;
  plans.forEach((p) => { if (p.outcome) counts[p.outcome] += 1; else open += 1; });
  return (
    <div>
      <p className="text-[15px]">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} made.</p>
      <ul className="mt-1 text-[14px] text-muted">
        {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => <li key={k}>{OUTCOME_LABELS[k]}: {counts[k]}</li>)}
        {open > 0 && <li>Not checked yet: {open}</li>}
      </ul>
      <ul className="mt-3 space-y-2">
        {plans.slice(0, 5).map((p) => (
          <li key={p.id} className="text-[14.5px]">
            <span className="block text-[12.5px] text-muted">{formatShort(`${p.date}T12:00:00`)}{p.outcome ? ` · ${OUTCOME_LABELS[p.outcome]}` : ''}</span>
            When {p.when}, I will {p.then}.
          </li>
        ))}
      </ul>
    </div>
  );
}
