import { useState } from 'react';
import { REVIEW_SHORT } from '../../engine/time';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { OUTCOME_LABELS, REVIEW_PROMPTS, RATING_LABELS, SESSION_BY_ID, VALUE_BY_ID, WEEKS } from '../../data/programme';
import { dateKey } from '../../engine/dates';
import { isUnlocked, plansThisWeek, weekDayLabel, weekHasPractice } from '../../engine/programme';
import { PageHeader } from '../../components/ui';
import { Confirmation } from '../../components/Confirmation';
import { NotFound } from '../NotFound';
import { Paced } from '../../components/pacing';
import { ValuesCollapsed } from '../../components/journey';

export function Review() {
  const { week: w = '' } = useParams();
  const week = Number(w);
  const { data, saveReview } = useStore();
  const def = WEEKS.find((x) => x.week === week);
  const sid = `w${week}d6`;
  const prev = data.reviews.find((r) => r.week === week);
  const [form, setForm] = useState({ worked: prev?.worked ?? '', gotInWay: prev?.gotInWay ?? '', noticed: prev?.noticed ?? '' });
  const [rating, setRating] = useState<number | null>(prev?.rating ?? null);
  const [saved, setSaved] = useState(false);
  const [catchUp, setCatchUp] = useState(false);
  if (!def || !SESSION_BY_ID[sid]) return <NotFound />;
  const header = <PageHeader eyebrow={`${weekDayLabel(sid)} · Weekly review · ${REVIEW_SHORT}`} title={`Week ${week} review: ${def.title}`} back="/" />;
  if (!SESSION_BY_ID[sid]!.available) return <div>{header}<p className="card">This review arrives in the next update.</p></div>;
  if (!isUnlocked(data, sid)) {
    return <div>{header}<div className="card flex gap-3"><Lock size={20} className="text-muted shrink-0" aria-hidden="true" /><p>The review opens after this week’s other sessions. There is no deadline.</p></div></div>;
  }
  // The week's plans, for context: the plans made since this programme week started.
  const today = dateKey();
  const plans = plansThisWeek(data, week, today);
  const practised = weekHasPractice(data, week, today);
  const showForm = !!prev || practised || catchUp;
  const servedMap = new Map<string, number>();
  plans.forEach((p) => { if (p.valueId) servedMap.set(p.valueId, (servedMap.get(p.valueId) ?? 0) + 1); });
  const served = [...servedMap.entries()];
  const counts = { 'not-came-up': 0, tried: 0, 'didnt-manage': 0 } as Record<keyof typeof OUTCOME_LABELS, number>;
  plans.forEach((p) => { if (p.outcome) counts[p.outcome] += 1; });

  return (
    <Paced sessionId={sid} title={header}>
    <div className="space-y-4">
      {header}
      <section className="card" aria-labelledby="rv-plans">
        <h2 id="rv-plans" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">This week’s plans</h2>
        {plans.length === 0 ? <p className="text-muted text-[15px]">No if-then plans recorded this week. That is fine: the review still works.</p> : (
          <>
            <p className="text-[15px]">{plans.length} {plans.length === 1 ? 'plan' : 'plans'} made.</p>
            <ul className="mt-2 text-[14.5px] text-muted space-y-1">
              {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => <li key={k}>{OUTCOME_LABELS[k]}: {counts[k]}</li>)}
            </ul>
          </>
        )}
      </section>
      <section className="card" aria-labelledby="rv-values">
        <h2 id="rv-values" className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">Which values did your plans serve this week?</h2>
        {served.length === 0
          ? <p className="text-muted text-[15px]">{plans.length ? 'None of this week’s plans named a value. You can add one in the plan builder any time.' : 'No plans this week yet.'}</p>
          : <ul className="text-[15px] space-y-1" data-testid="review-values">{served.map(([id, n]) => <li key={id}><span className="font-semibold">{VALUE_BY_ID[id] ?? id}</span>: {n} {n === 1 ? 'plan' : 'plans'}</li>)}</ul>}
      </section>
      <ValuesCollapsed data={data} />
      {!showForm && (
        <section className="card space-y-3" aria-labelledby="rv-catch" data-testid="review-needs-practice">
          <h2 id="rv-catch" className="font-serif text-[19px] font-semibold">The review works best after a real-life try</h2>
          <p className="text-[15px]">There is no plan or evening check recorded this week yet. One small plan, tried for a day, gives the review something real to look at.</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/plan" className="btn-primary">Make a plan<ArrowRight size={16} aria-hidden="true" /></Link>
            <button type="button" className="btn-secondary" onClick={() => setCatchUp(true)}>Do the catch-up version</button>
          </div>
          <p className="text-[13.5px] text-muted">The catch-up version has the same questions. It is saved and labelled as a catch-up review.</p>
        </section>
      )}
      {showForm && (prev?.catchUp || (catchUp && !prev)) && <p className="text-[14px] text-muted" data-testid="catchup-label">Catch-up review: answer from the week as you remember it.</p>}
      {showForm && <form className="card space-y-4" onSubmit={(e) => { e.preventDefault(); saveReview(week, { ...form, rating, catchUp: !practised }); setSaved(true); }}>
        {REVIEW_PROMPTS.map((p) => (
          <div key={p.id}>
            <label htmlFor={`rv-${p.id}`} className="label">{p.label}</label>
            <textarea id={`rv-${p.id}`} className="field min-h-[80px]" maxLength={2000} value={form[p.id as keyof typeof form]}
              onChange={(e) => setForm({ ...form, [p.id]: e.target.value })} />
            {p.hint && <p className="text-[13px] text-muted mt-1">{p.hint}</p>}
          </div>
        ))}
        <fieldset>
          <legend className="label">Overall, how often did you use this week’s skill? <span className="text-muted font-normal">(optional)</span></legend>
          <div className="grid grid-cols-5 gap-1.5">
            {RATING_LABELS.map((label, i) => (
              <label key={label} className={`flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border min-h-[56px] px-1 ${rating === i + 1 ? 'border-accent bg-accentsoft' : 'border-line'}`}>
                <input type="radio" name="rv-rating" className="sr-only" checked={rating === i + 1} onChange={() => setRating(i + 1)} />
                <span className="font-semibold">{i + 1}</span><span className="text-[10.5px] leading-tight text-muted">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary">{prev ? 'Save review' : catchUp && !practised ? 'Complete catch-up review' : 'Complete review'}</button>
      </form>}
      {saved && (
        <div className="card">
          <Confirmation focus className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />Week {week} review saved</Confirmation>
          <p className="text-muted text-[15px] mt-2">Tomorrow is a rest day: no session. Keep your plan going if you like.</p>
          <Link to="/" className="btn-primary mt-3">Back to Today<ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      )}
    </div>
    </Paced>
  );
}
