import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Moon, NotebookPen, Pencil, Sunrise } from 'lucide-react';
import { useStore } from '../app/store';
import { DOMAIN_LIST, DOMAINS } from '../data/domains';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { dateKey, dayIndex, formatLongDate } from '../lib/dates';
import { computeProgress, suggestScenarioId } from '../lib/progress';
import type { DomainId, ReflectionOutcome } from '../lib/types';
import { DomainTag } from '../components/ui';

function greeting(h: number) {
  if (h < 5) return 'Still awake';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const OUTCOMES: { id: ReflectionOutcome; label: string; hint: string }[] = [
  { id: 'in-the-moment', label: 'It came to mind in the moment', hint: 'You noticed while it was happening.' },
  { id: 'afterwards', label: 'I noticed afterwards', hint: 'Noticing later is how noticing sooner begins.' },
  { id: 'slipped-past', label: 'It slipped past today', hint: 'That is information, not failure.' },
];

export function Today() {
  const { data, setIntention, reflectOnIntention } = useStore();
  const now = new Date();
  const today = dateKey(now);
  const intention = data.intentions.find((i) => i.date === today) ?? null;
  const [editing, setEditing] = useState(!intention);
  const [domain, setDomain] = useState<DomainId>(intention?.domain ?? 'perspective');
  const [text, setText] = useState(intention?.text ?? '');
  const [reflecting, setReflecting] = useState(false);
  const [outcome, setOutcome] = useState<ReflectionOutcome | null>(intention?.reflection?.outcome ?? null);
  const [note, setNote] = useState(intention?.reflection?.note ?? '');

  const suggestedId = suggestScenarioId(data, intention?.domain ?? null, dayIndex(today));
  const suggested = SCENARIO_BY_ID[suggestedId];
  const progress = computeProgress(data, now);
  const name = data.settings.displayName;

  const saveIntention = () => {
    if (!text.trim()) return;
    setIntention(domain, text);
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">{formatLongDate(now)}</p>
        <h1 className="text-[28px] leading-tight font-semibold mt-1">{greeting(now.getHours())}{name ? `, ${name}` : ''}.</h1>
        {data.settings.streaksEnabled && progress.streak.current > 0 && (
          <p className="text-sm text-muted mt-1">{progress.streak.current} {progress.streak.current === 1 ? 'day' : 'days'} in a row. Missed days never erase what you have practised.</p>
        )}
      </div>

      {/* Morning intention */}
      <section className="card" aria-labelledby="int-h">
        <div className="flex items-center gap-2 mb-3">
          <Sunrise size={18} className="text-clay" aria-hidden="true" />
          <h2 id="int-h" className="font-sans text-sm font-semibold uppercase tracking-[0.06em] text-muted">Today’s intention</h2>
        </div>
        {intention && !editing ? (
          <div>
            <DomainTag domain={intention.domain} />
            <p className="font-serif text-[20px] leading-snug mt-2">{intention.text}</p>
            <button className="btn-ghost !px-0 mt-2 text-sm" onClick={() => { setDomain(intention.domain); setText(intention.text); setEditing(true); }}>
              <Pencil size={15} aria-hidden="true" />Edit intention
            </button>
          </div>
        ) : (
          <div>
            <p className="text-muted text-[15px] mb-3">Choose one area to keep in mind today, then write a small, specific intention.</p>
            <fieldset>
              <legend className="sr-only">Area of practice</legend>
              <div className="grid grid-cols-2 gap-2">
                {DOMAIN_LIST.map((d) => (
                  <label key={d.id} className={`cursor-pointer rounded-xl border px-3 py-2.5 text-[14px] min-h-[44px] flex items-center ${domain === d.id ? 'border-accent bg-accentsoft text-ink font-medium' : 'border-line text-muted'}`}>
                    <input type="radio" name="domain" value={d.id} checked={domain === d.id} onChange={() => setDomain(d.id)} className="sr-only" />
                    {d.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="text-sm text-muted mt-3 italic">{DOMAINS[domain].question}</p>
            <label htmlFor="int-text" className="label mt-4">Intention</label>
            <textarea id="int-text" className="field min-h-[88px]" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Today I will…" />
            <div className="mt-2 flex flex-wrap gap-2">
              {DOMAINS[domain].intentionIdeas.slice(0, 2).map((idea) => (
                <button key={idea} type="button" className="text-left text-[13px] rounded-lg bg-surface2 px-3 py-2 text-muted hover:text-ink" onClick={() => setText(idea)}>
                  {idea}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button className="btn-primary" onClick={saveIntention} disabled={!text.trim()}>Set intention</button>
              {intention && <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
            </div>
          </div>
        )}
      </section>

      {/* Suggested practice */}
      {suggested && (
        <section className="card" aria-labelledby="sug-h">
          <p className="eyebrow mb-2" id="sug-h">A scenario for today</p>
          <DomainTag domain={suggested.domain} />
          <h3 className="text-[20px] font-semibold mt-1.5">{suggested.title}</h3>
          <p className="text-muted text-[15px] mt-1 line-clamp-2">{suggested.situation}</p>
          <Link to={`/practise/${suggested.id}`} className="btn-primary mt-4">Practise this<ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
      )}

      {/* Evening reflection */}
      {intention && !editing && (
        <section className="card" aria-labelledby="ref-h">
          <div className="flex items-center gap-2 mb-3">
            <Moon size={18} className="text-words" aria-hidden="true" />
            <h2 id="ref-h" className="font-sans text-sm font-semibold uppercase tracking-[0.06em] text-muted">Evening reflection</h2>
          </div>
          {intention.reflection && !reflecting ? (
            <div>
              <p className="flex items-center gap-2 font-medium"><Check size={18} className="text-accent" aria-hidden="true" />{OUTCOMES.find((o) => o.id === intention.reflection?.outcome)?.label}</p>
              {intention.reflection.note && <p className="text-muted mt-2 whitespace-pre-wrap">{intention.reflection.note}</p>}
              <button className="btn-ghost !px-0 mt-2 text-sm" onClick={() => setReflecting(true)}><Pencil size={15} aria-hidden="true" />Edit reflection</button>
            </div>
          ) : !reflecting ? (
            <div>
              <p className="text-muted text-[15px]">When the day winds down, look back at your intention. What did you notice?</p>
              <button className="btn-secondary mt-3" onClick={() => setReflecting(true)}>Reflect on today</button>
            </div>
          ) : (
            <div>
              <fieldset>
                <legend className="text-[15px] mb-2">How did the intention show up today?</legend>
                <div className="space-y-2">
                  {OUTCOMES.map((o) => (
                    <label key={o.id} className={`block cursor-pointer rounded-xl border px-4 py-3 ${outcome === o.id ? 'border-accent bg-accentsoft' : 'border-line'}`}>
                      <input type="radio" name="outcome" value={o.id} checked={outcome === o.id} onChange={() => setOutcome(o.id)} className="sr-only" />
                      <span className="block font-medium text-[15px]">{o.label}</span>
                      <span className="block text-[13px] text-muted">{o.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="ref-note" className="label mt-4">What did you observe, and what meaning did you add to it? <span className="text-muted font-normal">(optional)</span></label>
              <textarea id="ref-note" className="field min-h-[96px]" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="mt-4 flex gap-3">
                <button className="btn-primary" disabled={!outcome} onClick={() => { if (outcome) { reflectOnIntention(today, outcome, note); setReflecting(false); } }}>Save reflection</button>
                <button className="btn-secondary" onClick={() => setReflecting(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      )}

      <Link to="/journal/new" className="card !p-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
        <NotebookPen size={20} className="text-accent" aria-hidden="true" />
        <span className="flex-1"><span className="block font-medium">Record a moment</span><span className="block text-sm text-muted">Something happened and you want to look at it clearly.</span></span>
        <ArrowRight size={18} className="text-muted" aria-hidden="true" />
      </Link>
    </div>
  );
}
