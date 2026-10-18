import { Link } from 'react-router-dom';
import { useStore } from '../app/store';
import { DOMAIN_LIST } from '../data/domains';
import { computeProgress } from '../lib/progress';
import { EmptyState, PageHeader } from '../components/ui';

const BAR: Record<string, string> = { words: 'bg-words', perspective: 'bg-perspective', assumptions: 'bg-assumptions', effort: 'bg-effort' };

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="card !p-4">
      <p className="font-serif text-[28px] font-semibold leading-none">{value}</p>
      <p className="text-[13px] text-muted mt-1.5">{label}</p>
    </div>
  );
}

export function Progress() {
  const { data } = useStore();
  const p = computeProgress(data);
  if (!p.hasAnyRecord) {
    return (
      <div>
        <PageHeader title="Progress" />
        <EmptyState title="Nothing recorded yet" action={<Link to="/" className="btn-primary">Go to Today</Link>}>
          Progress here is built only from what you actually do: intentions, scenarios, reflections and readings. Once you begin, it will appear.
        </EmptyState>
      </div>
    );
  }
  const totalReflections = p.reflections || 1;
  return (
    <div>
      <PageHeader title="Progress" intro="A record of practice, not a score. Nothing here measures whether you are a good person, and missed days take nothing away." />

      <section aria-labelledby="days-h" className="card">
        <h2 id="days-h" className="eyebrow">Last 14 days</h2>
        <p className="mt-1 text-[15px]"><span className="font-semibold">{p.activeDaysLast14}</span> {p.activeDaysLast14 === 1 ? 'day' : 'days'} with some practice</p>
        <ol className="grid grid-cols-7 gap-2 mt-3" aria-label="Practice days in the last two weeks">
          {p.last14.map((d) => (
            <li key={d.date} title={d.date} aria-label={`${d.date}: ${d.active ? 'practised' : 'no record'}`}
              className={`aspect-square rounded-lg ${d.active ? 'bg-accent' : 'bg-surface2 border border-line'}`} />
          ))}
        </ol>
        {data.settings.streaksEnabled && (
          <p className="text-sm text-muted mt-3">Current run: {p.streak.current} {p.streak.current === 1 ? 'day' : 'days'} · Longest: {p.streak.longest}</p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Stat value={`${p.scenariosExplored}/${p.scenariosTotal}`} label="scenarios explored" />
        <Stat value={p.scenariosCompared} label="with several responses compared" />
        <Stat value={p.intentionsSet} label="intentions set" />
        <Stat value={p.journalEntries} label="journal entries" />
        <Stat value={`${p.libraryRead}/${p.libraryTotal}`} label="readings opened" />
        <Stat value={p.exercisesTried} label="exercises tried" />
      </div>

      <section className="card mt-4" aria-labelledby="dom-h">
        <h2 id="dom-h" className="eyebrow mb-3">Scenarios by area</h2>
        <ul className="space-y-3">
          {DOMAIN_LIST.map((d) => {
            const v = p.byDomain[d.id];
            return (
              <li key={d.id}>
                <div className="flex justify-between text-[15px]"><span>{d.name}</span><span className="text-muted">{v.explored} of {v.total}</span></div>
                <div className="h-2 rounded-full bg-surface2 mt-1.5 overflow-hidden" role="progressbar" aria-label={`${d.name} scenarios explored`} aria-valuemin={0} aria-valuemax={v.total} aria-valuenow={v.explored}>
                  <div className={`h-full rounded-full ${BAR[d.id]}`} style={{ width: `${(v.explored / v.total) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card mt-4" aria-labelledby="ref-h">
        <h2 id="ref-h" className="eyebrow">Evening reflections</h2>
        {p.reflections === 0 ? (
          <p className="text-muted text-[15px] mt-2">No evening reflections yet. They appear on Today once you set an intention.</p>
        ) : (
          <>
            <p className="text-[15px] mt-1">{p.reflections} {p.reflections === 1 ? 'reflection' : 'reflections'} recorded. Noticing afterwards is how noticing in the moment begins.</p>
            <ul className="mt-3 space-y-2 text-[15px]">
              {([['in-the-moment', 'Came to mind in the moment'], ['afterwards', 'Noticed afterwards'], ['slipped-past', 'Slipped past']] as const).map(([k, label]) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-muted text-[14px]">{label}</span>
                  <span className="flex-1 h-2 rounded-full bg-surface2 overflow-hidden"><span className="block h-full bg-accent/70" style={{ width: `${(p.outcomes[k] / totalReflections) * 100}%` }} /></span>
                  <span className="w-6 text-right">{p.outcomes[k]}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
