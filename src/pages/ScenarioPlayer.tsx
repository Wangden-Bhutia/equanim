import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, History, NotebookPen } from 'lucide-react';
import { useStore } from '../app/store';
import { SCENARIOS, SCENARIO_BY_ID } from '../data/scenarios';
import { LIBRARY } from '../data/library';
import { formatShort } from '../engine/dates';
import { DomainTag, PageHeader } from '../components/ui';
import { NotFound } from './NotFound';

export function ScenarioPlayer() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const isFirst = params.get('first') === '1';
  const scenario = SCENARIO_BY_ID[id];
  const { data, recordAttempt, completeScenario } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [completedNow, setCompletedNow] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelected(null); setSeen([]); setNote(''); setCompletedNow(false); }, [id]);
  useEffect(() => { if (selected) feedbackRef.current?.focus(); }, [selected]);

  if (!scenario) return <NotFound />;

  const history = data.completions.filter((c) => c.scenarioId === scenario.id).sort((a, b) => b.at.localeCompare(a.at));
  const attempts = data.attempts.filter((a) => a.scenarioId === scenario.id);
  const option = scenario.options.find((o) => o.id === selected) ?? null;
  const idx = SCENARIOS.findIndex((s) => s.id === scenario.id);
  const next = SCENARIOS.slice(idx + 1).concat(SCENARIOS.slice(0, idx)).find((s) => s.domain === scenario.domain && s.id !== scenario.id);
  const related = LIBRARY.find((l) => l.scenarioId === scenario.id) ?? LIBRARY.find((l) => l.kind === 'section' && l.domain === scenario.domain);
  const optionText = (oid: string) => scenario.options.find((o) => o.id === oid)?.pattern ?? oid;

  const choose = (optId: string) => {
    setSelected(optId);
    recordAttempt(scenario.id, optId);
    setSeen((s) => (s.includes(optId) ? s : [...s, optId]));
  };
  const complete = () => {
    completeScenario(scenario.id, seen, note);
    setCompletedNow(true);
  };

  return (
    <article>
      <PageHeader title={scenario.title} back="/practise" />
      <div className="flex items-center gap-2 -mt-3 mb-4"><DomainTag domain={scenario.domain} /><span className="text-xs text-muted">· {scenario.setting}</span></div>
      {isFirst && (
        <p className="card !p-4 bg-accentsoft border-sage text-[15px] mb-4"><span className="block eyebrow mb-1">Sample journey · 3 of 4 · Scenario and reflection</span>Read the situation, then pick the response closest to what you might actually do. There is no single right answer. Afterwards, answer the reflection question in a line or two.</p>
      )}
      {history.length > 0 && !completedNow && (
        <p className="text-sm text-muted mb-4">You completed this on {formatShort(history[0]!.at)}. Revisiting adds to your history; nothing is erased.</p>
      )}

      <section aria-labelledby="setup-h" className="card">
        <h2 id="setup-h" className="sr-only">Situation</h2>
        <p className="font-serif text-[18.5px] leading-relaxed">{scenario.situation}</p>
      </section>

      <h2 className="text-[15px] font-semibold mt-6 mb-3">{scenario.prompt}</h2>
      <div className="space-y-2.5" role="group" aria-label="Possible responses">
        {scenario.options.map((o) => (
          <button key={o.id} type="button" aria-pressed={selected === o.id} onClick={() => choose(o.id)}
            className={`w-full text-left rounded-2xl border px-4 py-3.5 text-[15.5px] transition-colors ${selected === o.id ? 'border-accent bg-accentsoft' : 'border-line bg-surface hover:bg-surface2'}`}>
            {o.text}
            {seen.includes(o.id) && selected !== o.id && <span className="block text-xs text-muted mt-1">Explored</span>}
          </button>
        ))}
      </div>

      {option && (
        <div ref={feedbackRef} tabIndex={-1} className="card mt-6 outline-none" aria-live="polite" aria-labelledby="fb-h">
          <p className="eyebrow">Pattern</p>
          <h3 id="fb-h" className="font-serif text-[21px] font-semibold mt-1">{option.pattern}</h3>
          <p className="mt-3">{option.feedback.what}</p>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="rounded-xl bg-accentsoft p-3"><dt className="font-semibold text-accent">What it may accomplish</dt><dd className="mt-0.5">{option.feedback.protects}</dd></div>
            <div className="rounded-xl bg-claysoft p-3"><dt className="font-semibold text-clay">Risks and assumptions</dt><dd className="mt-0.5">{option.feedback.costs}</dd></div>
            {option.feedback.alternative && (
              <div className="rounded-xl border border-line p-3"><dt className="font-semibold">Another response to consider</dt><dd className="mt-0.5">{option.feedback.alternative}</dd></div>
            )}
          </dl>
          <p className="mt-4 font-serif italic text-[17px]">{option.feedback.notice}</p>
          {seen.length < scenario.options.length && <p className="mt-4 text-sm text-muted">You can try another response above to compare the trade-offs.</p>}
        </div>
      )}

      {option && (
        <section className="mt-6 card" aria-labelledby="why-h">
          <h2 id="why-h" className="eyebrow">Why this matters</h2>
          <p className="mt-2">{scenario.insight}</p>
        </section>
      )}

      {option && !completedNow && (
        <section className="mt-4 card" aria-labelledby="refl-h">
          <h2 id="refl-h" className="eyebrow">Reflection</h2>
          <p className="font-serif text-[18px] mt-2">{scenario.reflection}</p>
          <label htmlFor="sc-note" className="label mt-4">Personal note <span className="text-muted font-normal">(optional, private)</span></label>
          <textarea id="sc-note" className="field min-h-[84px]" value={note} onChange={(e) => setNote(e.target.value)} maxLength={20000} />
          <button className="btn-primary mt-4 w-full sm:w-auto" onClick={complete}><Check size={17} aria-hidden="true" />Mark scenario complete</button>
        </section>
      )}

      {completedNow && (
        <section className="mt-4 card border-accent/40" aria-live="polite" aria-labelledby="done-h">
          <h2 id="done-h" className="flex items-center gap-2 font-semibold text-accent"><Check size={18} aria-hidden="true" />Scenario completed</h2>
          <p className="text-[15px] text-muted mt-1">Saved to your history{note.trim() ? ', with your note' : ''}.</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {isFirst ? (
              <Link to="/welcome?step=journey-done" className="btn-primary">See your first progress entry<ArrowRight size={17} aria-hidden="true" /></Link>
            ) : (
              <>
                {next && <Link to={`/practise/${next.id}`} className="btn-primary">Next scenario<ArrowRight size={17} aria-hidden="true" /></Link>}
                <Link to={`/journal/new?type=incident&scenario=${scenario.id}`} className="btn-secondary"><NotebookPen size={17} aria-hidden="true" />Write an incident reflection</Link>
              </>
            )}
          </div>
          {related && <p className="mt-4 text-sm text-muted">Related reading: <Link className="text-accent underline underline-offset-2" to={`/library/${related.id}`}>{related.title}</Link></p>}
        </section>
      )}

      {(history.length > 0 || attempts.length > 0) && (
        <section className="mt-6" aria-labelledby="hist-h">
          <h2 id="hist-h" className="flex items-center gap-2 eyebrow mb-3"><History size={15} aria-hidden="true" />Your history with this scenario</h2>
          <p className="text-sm text-muted mb-2">{attempts.length} {attempts.length === 1 ? 'response' : 'responses'} explored in total · completed {history.length} {history.length === 1 ? 'time' : 'times'}</p>
          <ul className="space-y-2">
            {history.map((c) => (
              <li key={c.id} className="card !p-4 text-[15px]">
                <p className="font-medium">{formatShort(c.at)}</p>
                {c.optionIds.length > 0 && <p className="text-muted text-sm">Explored: {c.optionIds.map(optionText).join(', ')}</p>}
                {c.note && <p className="mt-1.5 whitespace-pre-wrap break-words">{c.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
