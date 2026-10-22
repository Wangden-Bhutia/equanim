import { Link } from 'react-router-dom';
import { Check, Focus, Footprints, MessageCircle, Puzzle, Search, Sunrise, type LucideIcon } from 'lucide-react';
import { BASELINE_ITEMS, RATING_LABELS, VALUE_BY_ID, WEEKS, PHRASE_BANK_BY_ID } from '../data/programme';
import { DOMAINS } from '../data/domains';
import { formatShort } from '../engine/dates';
import { OUTCOME_LABELS } from '../data/programme';
import type { AppData, Baseline, DomainId } from '../types';
import type { WeekStatus } from '../engine/programme';

/** A small motif for each week: a lens, a question, a voice, steps, pieces fitting, a new morning. */
export const WEEK_MOTIFS: Record<number, LucideIcon> = { 1: Focus, 2: Search, 3: MessageCircle, 4: Footprints, 5: Puzzle, 6: Sunrise };

/** Text colour for each skill (contrast-checked in tests/unit/colours.test.ts). */
export const DOMAIN_TEXT: Record<DomainId, string> = {
  personalisation: 'text-personalisation', inquiry: 'text-inquiry', speech: 'text-speech', effort: 'text-effort',
};
const DOMAIN_BORDER: Record<DomainId, string> = {
  personalisation: 'border-personalisation', inquiry: 'border-inquiry', speech: 'border-speech', effort: 'border-effort',
};
const DOMAIN_BG: Record<DomainId, string> = {
  personalisation: 'bg-personalisation', inquiry: 'bg-inquiry', speech: 'bg-speech', effort: 'bg-effort',
};

export function WeekMotif({ week, size = 20, className = '' }: { week: number; size?: number; className?: string }) {
  const Icon = WEEK_MOTIFS[week] ?? Focus;
  const d = WEEKS[week - 1]?.domain;
  return <Icon size={size} aria-hidden="true" className={`${d ? DOMAIN_TEXT[d] : 'text-accent'} ${className}`} />;
}

/** Six nodes, one per week. Done weeks show a check; the current week has a ring. Each node opens its week. */
export function JourneyMap({ statuses }: { statuses: WeekStatus[] }) {
  return (
    <nav aria-label="Your six-week journey">
      <ol className="relative grid grid-cols-6 gap-1">
        <span aria-hidden="true" className="absolute left-[8%] right-[8%] top-[22px] h-0.5 bg-line" />
        {WEEKS.map((w, i) => {
          const st = statuses[i] ?? 'upcoming';
          const d = w.domain;
          const ring = st === 'current' ? `border-2 ${d ? DOMAIN_BORDER[d] : 'border-accent'} bg-surface` : st === 'done' ? 'border border-line bg-accentsoft' : 'border border-line bg-surface';
          const label = `Week ${w.week}, ${w.title}: ${st === 'done' ? 'done' : st === 'current' ? 'you are here' : 'ahead'}`;
          return (
            <li key={w.week} className="relative flex flex-col items-center text-center">
              <Link to={`/programme/week/${w.week}`} aria-label={label} aria-current={st === 'current' ? 'step' : undefined}
                className={`relative z-10 flex items-center justify-center w-11 h-11 rounded-full ${ring} ${st === 'upcoming' ? 'opacity-70' : ''}`}>
                <WeekMotif week={w.week} size={19} />
                {st === 'done' && <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-accent text-onaccent flex items-center justify-center"><Check size={12} aria-hidden="true" /></span>}
              </Link>
              <span className="mt-1.5 text-[11.5px] font-semibold text-ink" aria-hidden="true">Wk {w.week}</span>
              <span className="text-[10.5px] leading-tight text-muted hidden sm:block" aria-hidden="true">{w.title.replace(/^(Freedom from|The Discipline of|Integrity of|Sincere) /, '')}</span>
            </li>
          );
        })}
      </ol>
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
