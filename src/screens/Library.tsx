import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, ChevronRight } from 'lucide-react';
import { useStore } from '../app/store';
import { LIBRARY, LIBRARY_BY_ID, type LibraryItem } from '../data/library';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { DomainTag, PageHeader, Prose } from '../components/ui';
import { NotFound } from './NotFound';

function Row({ item, read }: { item: LibraryItem; read: boolean }) {
  return (
    <li>
      <Link to={`/library/${item.id}`} className="card !p-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
        <div className="flex-1 min-w-0">
          {item.domain && <DomainTag domain={item.domain} />}
          <p className="font-serif text-[18px] font-semibold mt-1">{item.title}</p>
          <p className="text-sm text-muted">{item.subtitle} · {item.minutes} min</p>
        </div>
        {read ? <CheckCircle2 size={20} className="text-accent shrink-0" aria-label="Read" /> : <ChevronRight size={20} className="text-muted shrink-0" aria-hidden="true" />}
      </Link>
    </li>
  );
}

export function Library() {
  const { data } = useStore();
  const read = new Set(data.library.filter((r) => r.kind === 'read').map((r) => r.itemId));
  return (
    <div>
      <PageHeader title="Library" intro="Short, original readings. Each ends with a question, an exercise and a scenario, because the reading is only the start." />
      <h2 className="eyebrow mb-3">The four areas</h2>
      <ul className="space-y-3 mb-8">{LIBRARY.filter((i) => i.kind === 'section').map((i) => <Row key={i.id} item={i} read={read.has(i.id)} />)}</ul>
      <h2 className="eyebrow mb-3">Essays</h2>
      <ul className="space-y-3 mb-8">{LIBRARY.filter((i) => i.kind === 'essay').map((i) => <Row key={i.id} item={i} read={read.has(i.id)} />)}</ul>
      <div className="card !p-4 text-sm text-muted">
        How the parts fit together: <Link to="/framework" className="text-accent underline underline-offset-2">the Equanim framework</Link>. Sources and attribution: <Link to="/references" className="text-accent underline underline-offset-2">References</Link>.
      </div>
    </div>
  );
}

export function LibraryDetail() {
  const { id = '' } = useParams();
  const item = LIBRARY_BY_ID[id];
  const { data, recordLibrary } = useStore();
  useEffect(() => {
    if (item) recordLibrary(item.id, 'read');
    // record once per visit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);
  if (!item) return <NotFound />;
  const tried = data.library.some((r) => r.itemId === item.id && r.kind === 'exercise');
  const scenario = SCENARIO_BY_ID[item.scenarioId];
  return (
    <article>
      <PageHeader title={item.title} eyebrow={item.kind === 'section' ? 'Area reading' : 'Essay'} back="/library" intro={item.subtitle} />
      {item.domain && <div className="-mt-3 mb-5"><DomainTag domain={item.domain} /></div>}
      <Prose paragraphs={item.body} />

      <section className="card mt-7 bg-surface2/60" aria-labelledby="ex-h">
        <h2 id="ex-h" className="eyebrow">{item.example.title}</h2>
        <p className="mt-2">{item.example.text}</p>
      </section>

      <section className="mt-5 px-1" aria-labelledby="q-h">
        <h2 id="q-h" className="eyebrow">A question to carry</h2>
        <p className="font-serif text-[20px] leading-snug mt-2">{item.question}</p>
      </section>

      <section className="card mt-5" aria-labelledby="exr-h">
        <h2 id="exr-h" className="eyebrow">Exercise</h2>
        <p className="font-semibold mt-1.5">{item.exercise.title}</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1.5">{item.exercise.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        <button className={tried ? 'btn-secondary mt-4' : 'btn-primary mt-4'} onClick={() => recordLibrary(item.id, 'exercise')} disabled={tried}>
          {tried ? <><Check size={17} aria-hidden="true" />Marked as tried</> : 'I tried this'}
        </button>
      </section>

      {scenario && (
        <Link to={`/practise/${scenario.id}`} className="card mt-5 !p-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
          <span className="flex-1"><span className="eyebrow block">Practise it</span><span className="font-serif text-[18px] font-semibold">{scenario.title}</span></span>
          <ArrowRight size={18} className="text-accent" aria-hidden="true" />
        </Link>
      )}
    </article>
  );
}
