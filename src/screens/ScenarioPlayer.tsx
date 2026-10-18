import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, NotebookPen } from 'lucide-react';
import { useStore } from '../app/store';
import { SCENARIOS, SCENARIO_BY_ID } from '../data/scenarios';
import { LIBRARY } from '../data/library';
import { DomainTag, PageHeader } from '../components/ui';
import { NotFound } from './NotFound';

export function ScenarioPlayer() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const isFirst = params.get('first') === '1';
  const scenario = SCENARIO_BY_ID[id];
  const { data, recordAttempt } = useStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelected(null); setSeen(new Set()); }, [id]);
  useEffect(() => {
    if (selected) feedbackRef.current?.focus();
  }, [selected]);

  if (!scenario) return <NotFound />;

  const previously = new Set(data.attempts.filter((a) => a.scenarioId === scenario.id).map((a) => a.optionId));
  const option = scenario.options.find((o) => o.id === selected) ?? null;
  const idx = SCENARIOS.findIndex((s) => s.id === scenario.id);
  const nextInDomain = SCENARIOS.slice(idx + 1).concat(SCENARIOS.slice(0, idx)).find((s) => s.domain === scenario.domain);
  const related = LIBRARY.find((l) => l.scenarioId === scenario.id) ?? LIBRARY.find((l) => l.kind === 'section' && l.domain === scenario.domain);

  const choose = (optId: string) => {
    setSelected(optId);
    recordAttempt(scenario.id, optId);
    setSeen((s) => new Set(s).add(optId));
  };

  return (
    <article>
      <PageHeader title={scenario.title} back="/practise" />
      <div className="flex items-center gap-2 -mt-3 mb-4"><DomainTag domain={scenario.domain} /><span className="text-xs text-muted">· {scenario.setting}</span></div>
      {isFirst && (
        <p className="card !p-4 bg-accentsoft border-accent/30 text-[15px] mb-4">Read the situation, then pick the response closest to what you might actually do. Afterwards, try the others to compare.</p>
      )}
      <div className="card">
        <p className="font-serif text-[18.5px] leading-relaxed">{scenario.situation}</p>
      </div>

      <h2 className="font-sans text-[15px] font-semibold mt-6 mb-3">{scenario.prompt}</h2>
      <div className="space-y-2.5" role="group" aria-label="Possible responses">
        {scenario.options.map((o) => {
          const isSel = selected === o.id;
          const wasSeen = seen.has(o.id) || previously.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={isSel}
              onClick={() => choose(o.id)}
              className={`w-full text-left rounded-2xl border px-4 py-3.5 text-[15.5px] transition-colors ${isSel ? 'border-accent bg-accentsoft' : 'border-line bg-surface hover:bg-surface2'}`}
            >
              {o.text}
              {wasSeen && !isSel && <span className="block text-xs text-muted mt-1">Explored</span>}
            </button>
          );
        })}
      </div>

      {option && (
        <div ref={feedbackRef} tabIndex={-1} className="card mt-6 outline-none" aria-live="polite" aria-labelledby="fb-h">
          <p className="eyebrow">Pattern</p>
          <h3 id="fb-h" className="text-[21px] font-semibold mt-1">{option.pattern}</h3>
          <p className="mt-3">{option.feedback.what}</p>
          <dl className="mt-4 space-y-3 text-[15px]">
            <div className="rounded-xl bg-accentsoft/70 p-3"><dt className="font-semibold text-accent">What it protects</dt><dd className="mt-0.5">{option.feedback.protects}</dd></div>
            <div className="rounded-xl bg-claysoft/80 p-3"><dt className="font-semibold text-clay">What it may cost</dt><dd className="mt-0.5">{option.feedback.costs}</dd></div>
          </dl>
          <p className="mt-4 font-serif italic text-[17px]">{option.feedback.notice}</p>
          {seen.size < scenario.options.length && (
            <p className="mt-4 text-sm text-muted">Try another response above to compare the trade-offs.</p>
          )}
        </div>
      )}

      {option && (
        <section className="mt-6 card" aria-labelledby="refl-h">
          <h2 id="refl-h" className="eyebrow">To reflect on</h2>
          <p className="font-serif text-[18px] mt-2">{scenario.reflection}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link to={`/journal/new?scenario=${scenario.id}`} className="btn-secondary"><NotebookPen size={17} aria-hidden="true" />Write about it</Link>
            {isFirst ? (
              <Link to="/" className="btn-primary">Continue to Today<ArrowRight size={17} aria-hidden="true" /></Link>
            ) : nextInDomain && nextInDomain.id !== scenario.id ? (
              <Link to={`/practise/${nextInDomain.id}`} className="btn-primary">Next scenario<ArrowRight size={17} aria-hidden="true" /></Link>
            ) : null}
          </div>
          {related && (
            <p className="mt-4 text-sm text-muted">Related reading: <Link className="text-accent underline underline-offset-2" to={`/library/${related.id}`}>{related.title}</Link></p>
          )}
        </section>
      )}
    </article>
  );
}
