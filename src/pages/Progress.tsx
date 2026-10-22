import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../app/store';
import { DOMAIN_LIST } from '../data/domains';
import { computeProgress } from '../engine/progress';
import { formatShort } from '../engine/dates';
import { EmptyState, LegacyCheckIn, PageHeader } from '../components/ui';
import { dateKey } from '../engine/dates';
import { checkinDue, daysPractisedThisWeek, earlyCount, inMaintenance, isReturning, latestSnapshot } from '../engine/programme';
import { BaselineCompare, JourneyMap, PlanOutcomes, ValuesList } from '../components/journey';
import type { AppData } from '../types';

/** One honest line when sessions were done ahead of schedule. Null when none were. */
export function earlyLine(n: number): string | null {
  if (n === 0) return null;
  return `${n} ${n === 1 ? 'session' : 'sessions'} done ahead of schedule. Spacing helps, but your pace is yours.`;
}

function ProgrammeProgress({ data }: { data: AppData }) {
  const today = dateKey();
  const start = data.baselines.find((b) => b.kind === 'start');
  const snap = latestSnapshot(data);
  const practised = daysPractisedThisWeek(data, today);
  const reviews = [...data.reviews].sort((a, b) => a.week - b.week);
  const early = earlyLine(earlyCount(data));
  return (
    <section aria-labelledby="prog-h" className="space-y-4">
      <h2 id="prog-h" className="font-serif text-[22px] font-semibold">Your six weeks</h2>
      <div className="card"><JourneyMap data={data} /></div>
      {start && (
        <div className="card">
          <h3 className="eyebrow mb-2">Day 0 and now</h3>
          {snap ? <BaselineCompare start={start} now={snap} nowLabel={snap.kind === 'finish' ? 'Week 6' : 'Check-in'} />
            : <p className="text-[14.5px] text-muted">Your Day 0 snapshot is saved. You will see it side by side with Week 6.</p>}
        </div>
      )}
      <div className="card"><h3 className="eyebrow mb-2">Plans and outcomes</h3><PlanOutcomes data={data} /></div>
      <ValuesList data={data} />
      {reviews.length > 0 && (
        <div className="card">
          <h3 className="eyebrow mb-2">What I noticed, week by week</h3>
          <ol className="border-l-2 border-line pl-4 space-y-3">
            {reviews.map((r) => (
              <li key={r.id}>
                <p className="text-[13px] text-muted">Week {r.week} · {formatShort(r.completedAt)}{r.catchUp ? ' · catch-up review' : ''}</p>
                {r.noticed && <p className="text-[15px]"><span className="font-medium">Noticed: </span>{r.noticed}</p>}
                {r.worked && <p className="text-[15px]"><span className="font-medium">Worked: </span>{r.worked}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="card">
        <p className="text-[15px]"><span className="font-semibold">{practised}</span> {practised === 1 ? 'day' : 'days'} practised this week{inMaintenance(data) ? ' · about 3 a week keeps the skills warm' : ''}.</p>
        {early && <p className="text-[14.5px] text-muted mt-1.5" data-testid="early-line">{early}</p>}
        {isReturning(data, today) && <p className="text-[14.5px] text-muted mt-1.5">Welcome back. Returning is part of the practice; pick up exactly where you left off.</p>}
        {checkinDue(data, today) && <Link to="/baseline/checkin" className="btn-secondary mt-3 inline-flex">Take this month’s check-in</Link>}
      </div>
    </section>
  );
}

/** A tile is shown only when it has something in it: no "0" tiles. */
function Stat({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  if (value === 0 || (typeof value === 'string' && value.startsWith('0/'))) return null;
  return (
    <div className="card !p-4">
      <p className="font-serif text-[26px] font-semibold leading-none">{value}</p>
      <p className="text-[13.5px] mt-1.5">{label}</p>
      {hint && <p className="text-[12px] text-muted mt-0.5">{hint}</p>}
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
          Progress is built only from what you actually record here: intentions, practices, scenarios, reflections, journal entries and readings. Once you begin, it will appear.
        </EmptyState>
      </div>
    );
  }
  const maxDomainRaw = Math.max(0, ...Object.values(p.domainParticipation));
  const maxDomain = Math.max(1, maxDomainRaw);
  // Legacy blocks appear only when they have at least one record. Programme sessions alone do not count here.
  const hasLegacy = p.practicesCompleted + p.scenariosCompleted + p.scenarioAttempts + maxDomainRaw + p.intentionsSet + p.reflectionsRecorded +
    p.journalEntries + p.readingsCompleted + p.exercisesTried > 0;
  return (
    <div className="space-y-7">
      <PageHeader title="Progress" intro="A record of practice, not a score. Nothing here rates your choices or your character, and a missed day takes nothing away." />

      {data.programme && <ProgrammeProgress data={data} />}

      {hasLegacy && (
        <details className="group space-y-4" open={!data.programme} data-testid="legacy-activity">
          <summary className="card !py-0 flex items-center justify-between cursor-pointer list-none min-h-[52px] font-semibold">Keep practising activity<ChevronDown size={18} className="transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
          <div className="space-y-7 mt-4">
      {p.daysEngaged > 0 && <section aria-labelledby="days-h" className="card">
        <h2 id="days-h" className="eyebrow">Days engaged</h2>
        <p className="mt-1 text-[15px]"><span className="font-semibold">{p.activeDaysLast14}</span> of the last 14 days · {p.daysEngaged} in total</p>
        <ol className="grid grid-cols-7 gap-2 mt-3 max-w-sm" aria-label="Days with any recorded practice in the last two weeks">
          {p.last14.map((d) => (
            <li key={d.date} title={d.date} aria-label={`${d.date}: ${d.active ? 'practised' : 'no record'}`}
              className={`aspect-square rounded-lg ${d.active ? 'bg-accent' : 'bg-surface border border-line'}`} />
          ))}
        </ol>
        <p className="text-[12.5px] text-muted mt-3">A day counts when anything was recorded: an intention, practice, scenario, reflection, journal entry or a reading marked complete.</p>
        {data.settings.streaksEnabled && (
          <p className="text-sm mt-2">Current run: {p.streak.current} {p.streak.current === 1 ? 'day' : 'days'} · Longest: {p.streak.longest}</p>
        )}
      </section>}

      {(p.practicesCompleted + p.scenariosCompleted + p.scenarioAttempts) > 0 && <section aria-labelledby="prac-h">
        <h2 id="prac-h" className="text-[17px] font-semibold">Practice in the app</h2>
        <p className="text-[13.5px] text-muted mb-3">What you completed here. It shows engagement, not whether anything changed outside the app.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value={p.practicesCompleted} label="daily practices completed" />
          <Stat value={`${p.scenariosCompleted}/${p.scenariosTotal}`} label="scenarios completed" />
          <Stat value={p.scenarioRevisits} label="scenario revisits" hint="Completing a scenario again" />
          <Stat value={p.scenarioAttempts} label="responses explored" hint="Every option you tried" />
        </div>
      </section>}

      {maxDomainRaw > 0 && <section aria-labelledby="dom-h" className="card">
        <h2 id="dom-h" className="eyebrow mb-1">Domain participation</h2>
        <p className="text-[12.5px] text-muted mb-3">Completed scenarios, daily practices, intentions and journal entries tagged with each domain.</p>
        <ul className="space-y-3">
          {DOMAIN_LIST.map((d) => {
            const v = p.domainParticipation[d.id];
            return (
              <li key={d.id}>
                <div className="flex justify-between gap-3 text-[15px]"><span>{d.name}</span><span className="text-muted">{v}</span></div>
                <div className="h-2 rounded-full bg-surface2 mt-1.5 overflow-hidden" aria-hidden="true">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(v / maxDomain) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>}

      {(p.intentionsSet + p.reflectionsRecorded + p.journalEntries) > 0 && <section aria-labelledby="self-h">
        <h2 id="self-h" className="text-[17px] font-semibold">What you reported about your days</h2>
        <p className="text-[13.5px] text-muted mb-3">Self-reported: intentions, evening reflections and journal entries. These are your own observations, not measurements.</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Stat value={p.intentionsSet} label="morning intentions" hint={`${p.intentionDaysLast14} of the last 14 days`} />
          <Stat value={p.reflectionsRecorded} label="evening reflections" hint={`${p.reflectionDaysLast14} of the last 14 days`} />
          <Stat value={p.journalEntries} label="journal entries" hint={`${p.journalByType.incident} incident · ${p.journalByType.daily} daily · ${p.journalByType.free} free`} />
        </div>
      </section>}

      {(p.readingsCompleted + p.exercisesTried) > 0 && <section aria-labelledby="read-h">
        <h2 id="read-h" className="text-[17px] font-semibold">Reading</h2>
        <p className="text-[13.5px] text-muted mb-3">Kept separate from practice: reading about an idea is not the same as practising it.</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value={`${p.readingsCompleted}/${p.readingsTotal}`} label="readings completed" />
          <Stat value={p.exercisesTried} label="reading exercises tried" />
        </div>
      </section>}

      {p.recentReflections.length > 0 && <section aria-labelledby="recent-h" className="card">
        <h2 id="recent-h" className="eyebrow mb-2">Recent reflections</h2>
        {p.recentReflections.length === 0 ? (
          <p className="text-muted text-[15px]">No evening reflections yet. You can add one on Today when the day winds down.</p>
        ) : (
          <ul className="space-y-3">
            {p.recentReflections.map((r) => (
              <li key={r.id} className="text-[15px]">
                <p className="text-[13px] text-muted">{formatShort(`${r.date}T12:00:00`)}</p>
                {(r.happened || r.did || r.initial || r.alternative || r.nextTime) && <p className="break-words">{r.happened || r.did || r.initial || r.alternative || r.nextTime}</p>}
                {r.legacyCheckIn && <LegacyCheckIn value={r.legacyCheckIn} />}
                {r.nextTime && <p className="text-[13.5px] text-muted mt-0.5">Next time: {r.nextTime}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>}

      {p.recurringThemes.some((t) => t.count > 1) && <section aria-labelledby="themes-h" className="card">
        <h2 id="themes-h" className="eyebrow mb-2">Recurring themes</h2>
        {p.recurringThemes.filter((t) => t.count > 1).length === 0 ? (
          <p className="text-muted text-[15px]">Themes appear here once you have added the same theme to more than one journal entry.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {p.recurringThemes.filter((t) => t.count > 1).map((t) => (
              <li key={t.theme} className="rounded-full border border-line px-3 py-1 text-sm">{t.theme} <span className="text-muted">× {t.count}</span></li>
            ))}
          </ul>
        )}
      </section>}
          </div>
        </details>
      )}
    </div>
  );
}
