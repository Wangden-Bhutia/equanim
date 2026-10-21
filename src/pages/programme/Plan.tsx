import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useStore } from '../../app/store';
import { PLAN_CHIPS, WEEKS } from '../../data/programme';
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
  const chips = PLAN_CHIPS[domain];
  const ready = when.trim() && then.trim();
  return (
    <div>
      <PageHeader eyebrow="Morning plan" title="Today’s if-then plan" back="/"
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
        {ready && <p className="rounded-xl bg-accentsoft p-3 font-serif text-[18px]" aria-live="polite">When {when.trim()}, I will {then.trim()}.</p>}
        <button className="btn-primary w-full sm:w-auto" disabled={!ready} onClick={() => { savePlan({ when, then, domain }); navigate('/'); }}>{existing ? 'Update plan' : 'Save plan'}</button>
      </div>
      <p className="text-sm text-muted mt-3">This evening, Today will ask how it went. One plan a day is plenty.</p>
    </div>
  );
}
