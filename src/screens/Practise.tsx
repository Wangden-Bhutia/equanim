import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useStore } from '../app/store';
import { DOMAIN_LIST } from '../data/domains';
import { SCENARIOS } from '../data/scenarios';
import { DOMAIN_IDS, type DomainId } from '../lib/types';
import { DomainTag, PageHeader } from '../components/ui';

export function Practise() {
  const { data } = useStore();
  const [params, setParams] = useSearchParams();
  const raw = params.get('domain');
  const initial = raw && (DOMAIN_IDS as string[]).includes(raw) ? (raw as DomainId) : 'all';
  const [filter, setFilter] = useState<DomainId | 'all'>(initial);
  const explored = new Set(data.attempts.map((a) => a.scenarioId));
  const list = SCENARIOS.filter((s) => filter === 'all' || s.domain === filter);

  const choose = (f: DomainId | 'all') => {
    setFilter(f);
    setParams(f === 'all' ? {} : { domain: f }, { replace: true });
  };

  return (
    <div>
      <PageHeader title="Practise" intro="Everyday situations. Choose a response, then see what it protects and what it costs. Explore as many responses as you like." />
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by area">
        {[{ id: 'all' as const, name: 'All' }, ...DOMAIN_LIST].map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={filter === d.id}
            onClick={() => choose(d.id)}
            className={`shrink-0 rounded-full border px-4 min-h-[40px] text-sm font-medium ${filter === d.id ? 'bg-accent text-onaccent border-accent' : 'border-line text-muted bg-surface'}`}
          >
            {d.name}
          </button>
        ))}
      </div>
      <p className="text-sm text-muted mb-3">{list.filter((s) => explored.has(s.id)).length} of {list.length} explored</p>
      <ul className="space-y-3">
        {list.map((s) => (
          <li key={s.id}>
            <Link to={`/practise/${s.id}`} className="card !p-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><DomainTag domain={s.domain} /><span className="text-xs text-muted">· {s.setting}</span></div>
                <p className="font-serif text-[18px] font-semibold mt-1">{s.title}</p>
              </div>
              {explored.has(s.id) ? (
                <CheckCircle2 size={20} className="text-accent shrink-0" aria-label="Explored" />
              ) : (
                <ChevronRight size={20} className="text-muted shrink-0" aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
