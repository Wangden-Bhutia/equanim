import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../app/store';
import { dateKey } from '../../engine/dates';
import { isUnlocked } from '../../engine/programme';
import { Paced } from '../../components/pacing';
import { NotFound } from '../NotFound';
import { BASELINE_ITEMS, BASELINE_SITUATIONS, RATING_LABELS } from '../../data/programme';
import { PageHeader } from '../../components/ui';

const COPY = {
  start: { eyebrow: 'Week 0 · Day 0 · Step 2 of 2', title: 'Where you are starting', back: '/values', finish: 'Finish Day 0',
    lead: 'How often is each of these true for you at the moment? This is a private snapshot to look back on in Week 6.' },
  finish: { eyebrow: 'Week 6 · Day 36 of 42 · Where you are now', title: 'Where you are now', back: '/', finish: 'Save today’s snapshot',
    lead: 'The same statements as Day 0. Answer for how things are now, without trying to remember your earlier answers.' },
  checkin: { eyebrow: 'Maintenance · Monthly check-in', title: 'Monthly check-in', back: '/', finish: 'Save check-in',
    lead: 'The same statements again, for how things are this month. You’ll see them next to Day 0 in Progress.' },
} as const;

export function Baseline() {
  const { kind: raw = 'start' } = useParams();
  const kind = raw === 'finish' || raw === 'checkin' ? raw : raw === 'start' ? 'start' : null;
  const { data, saveBaseline } = useStore();
  const navigate = useNavigate();
  const month = dateKey().slice(0, 7);
  const prev = kind === 'checkin' ? data.baselines.find((b) => b.id === `bl_checkin_${month}`) : data.baselines.find((b) => b.kind === kind);
  const [ratings, setRatings] = useState<Record<string, number>>(prev?.ratings ?? {});
  const [situations, setSituations] = useState<string[]>(prev?.situations ?? BASELINE_SITUATIONS.map(() => ''));
  if (!kind) return <NotFound />;
  if (kind === 'start' && data.values.length < 3 && !prev) return <Navigate to="/values" replace />;
  if (kind === 'finish' && !isUnlocked(data, 'w6d1')) return <Navigate to="/session/w6d2" replace />;
  const c = COPY[kind];
  const ready = BASELINE_ITEMS.every((i) => ratings[i.id]);
  const save = () => {
    if (!ready) return;
    saveBaseline(kind, ratings, situations);
    if (kind === 'start') navigate('/', { state: { completed: 'w0d0' } });
    else if (kind === 'finish') navigate('/session/w6d2');
    else navigate('/progress');
  };
  const body = (
    <div>
      <PageHeader eyebrow={c.eyebrow} title={c.title} back={c.back}
        intro={<>{c.lead} <strong className="text-ink font-semibold">It is not a validated test</strong> and says nothing about you as a person.</>} />
      <div className="space-y-4">
        {BASELINE_ITEMS.map((item, n) => (
          <fieldset key={item.id} className="card !p-4">
            <legend className="text-[15.5px] font-medium float-left w-full mb-3"><span className="text-muted">{n + 1}. </span>{item.text}</legend>
            <div className="grid grid-cols-5 gap-1.5 clear-both">
              {RATING_LABELS.map((label, i) => (
                <label key={label} className={`flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border min-h-[56px] px-1 py-1.5 ${ratings[item.id] === i + 1 ? 'border-accent bg-accentsoft' : 'border-line'}`}>
                  <input type="radio" name={item.id} value={i + 1} className="sr-only" checked={ratings[item.id] === i + 1} onChange={() => setRatings({ ...ratings, [item.id]: i + 1 })} />
                  <span className="font-semibold text-[15px]">{i + 1}</span>
                  <span className="text-[10.5px] leading-tight text-muted">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        {BASELINE_SITUATIONS.map((s, i) => (
          <div key={s.id}>
            <label htmlFor={`bl-${s.id}`} className="label">{s.label} <span className="text-muted font-normal">(optional)</span></label>
            <textarea id={`bl-${s.id}`} className="field min-h-[72px]" maxLength={1000} value={situations[i] ?? ''}
              onChange={(e) => setSituations(situations.map((x, j) => (j === i ? e.target.value : x)))} />
            {s.hint && <p className="text-[13px] text-muted mt-1">{s.hint}</p>}
          </div>
        ))}
      </div>
      <button className="btn-primary mt-6 w-full sm:w-auto" disabled={!ready} onClick={save}>{c.finish}</button>
      {!ready && <p className="text-sm text-muted mt-2">Rate all {BASELINE_ITEMS.length} statements to save. There are no right answers.</p>}
      <p className="text-sm text-muted mt-4"><Link to="/" className="underline underline-offset-2">Save nothing and go back to Today</Link></p>
    </div>
  );
  return kind === 'finish' ? <Paced sessionId="w6d1" title={<PageHeader eyebrow={c.eyebrow} title={c.title} back="/" />}>{body}</Paced> : body;
}
