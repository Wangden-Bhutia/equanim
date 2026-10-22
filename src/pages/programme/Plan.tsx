import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useStore } from '../../app/store';
import { PLAN_CHIPS, SESSION_BY_ID, VALUE_BY_ID, WEEKS } from '../../data/programme';
import { DOMAINS } from '../../data/domains';
import { dateKey } from '../../engine/dates';
import { currentSessionId, parseSessionId } from '../../engine/programme';
import { PageHeader } from '../../components/ui';
import { DOMAIN_IDS, type DomainId } from '../../types';

export function currentDomain(cur: string | null): DomainId {
  const w = cur ? parseSessionId(cur)?.week ?? 1 : 1;
  return WEEKS.find((x) => x.week === Math.max(1, w))?.domain ?? 'personalisation';
}

function Chips({ items, onPick, label }: { items: string[]; onPick: (t: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label={label}>
      {items.map((t) => <button key={t} type="button" className="rounded-full border border-line px-3 min-h-[44px] text-[13.5px] text-ink hover:bg-surface2" onClick={() => onPick(t)}>{t}</button>)}
    </div>
  );
}

/** The morning plan: "When ___, I will ___". */
export function Plan() {
  const { data, savePlan } = useStore();
  const navigate = useNavigate();
  const today = dateKey();
  const existing = data.plans.find((p) => p.date === today);
  const [domain, setDomain] = useState<DomainId>(existing?.domain ?? currentDomain(currentSessionId(data)));
  const [when, setWhen] = useState(existing?.when ?? '');
  const [then, setThen] = useState(existing?.then ?? '');
  const [valueId, setValueId] = useState<string | null>(existing?.valueId ?? null);
  const [params] = useSearchParams();
  const from = params.get('from');
  const back = from && SESSION_BY_ID[from] ? `/session/${from}` : '/';
  const chips = PLAN_CHIPS[domain];
  const ready = when.trim() && then.trim();
  return (
    <div>
      <PageHeader eyebrow="Morning plan" title="Today’s if-then plan" back={back}
        intro="Pick one moment that is likely to happen today, and one small thing you will do when it does. Specific beats ambitious." />
      <div className="card space-y-5">
        <div>
          <label htmlFor="plan-domain" className="label">Skill</label>
          <select id="plan-domain" className="field" value={domain} onChange={(e) => setDomain(e.target.value as DomainId)}>
            {DOMAIN_IDS.map((d) => <option key={d} value={d}>{DOMAINS[d].name}</option>)}
          </select>
        </div>
        <button type="button" className="btn-secondary w-full" onClick={() => { setWhen(chips.suggested.when); setThen(chips.suggested.then); }}>
          <Sparkles size={16} aria-hidden="true" />Use a suggested plan
        </button>
        <div>
          <label htmlFor="plan-when" className="label">When…</label>
          <input id="plan-when" className="field" maxLength={200} value={when} onChange={(e) => setWhen(e.target.value)} placeholder="a moment that is likely today" />
          <Chips items={chips.when} onPick={setWhen} label="Suggestions for when" />
        </div>
        <div>
          <label htmlFor="plan-then" className="label">…I will</label>
          <input id="plan-then" className="field" maxLength={200} value={then} onChange={(e) => setThen(e.target.value)} placeholder="one small, specific action" />
          <Chips items={chips.then} onPick={setThen} label="Suggestions for what I will do" />
        </div>
        {data.values.length === 0 ? (
          <p className="text-[14.5px] text-muted" data-testid="plan-values-missing">Want to link plans to what matters to you? <Link to="/values" className="underline underline-offset-2 text-accent">Choose your values</Link> first.</p>
        ) : (
          <fieldset>
            <legend className="label">Which of your values does this serve? <span className="text-muted font-normal">(optional)</span></legend>
            <div className="space-y-2">
              {data.values.map((v) => (
                <label key={v.id} className={`flex flex-col justify-center cursor-pointer rounded-xl border px-4 py-2 min-h-[48px] ${valueId === v.id ? 'border-accent bg-accentsoft' : 'border-line'}`}>
                  <input type="checkbox" className="sr-only" checked={valueId === v.id} onChange={() => setValueId(valueId === v.id ? null : v.id)} />
                  <span className="font-semibold text-[15px]">{VALUE_BY_ID[v.id] ?? v.id}</span>
                  {v.sentence && <span className="text-[13.5px] text-muted">{v.sentence}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {ready && <p className="rounded-xl bg-accentsoft p-3 font-serif text-[18px]" aria-live="polite">When {when.trim()}, I will {then.trim()}.</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={!ready} onClick={() => { savePlan({ when, then, domain, valueId }); navigate(back); }}>{existing ? 'Update plan' : 'Save plan'}</button>
      </div>
      <p className="text-sm text-muted mt-3">This evening, Today will ask how it went. One plan a day is plenty.</p>
    </div>
  );
}
