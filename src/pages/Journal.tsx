import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore, type JournalDraft } from '../app/store';
import { DOMAIN_LIST } from '../data/domains';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { JOURNAL_TYPES, JOURNAL_TYPE_LIST, labelFor } from '../data/journal';
import { formatShort } from '../engine/dates';
import type { DomainId, JournalEntry, JournalType } from '../types';
import { ConfirmDialog, DomainTag, EmptyState, PageHeader } from '../components/ui';
import { NotFound } from './NotFound';

export function entryTitle(e: JournalEntry): string {
  const order = JOURNAL_TYPES[e.type].questions.map((q) => q.key);
  const keys = [...order, ...Object.keys(e.answers).filter((k) => !order.includes(k))];
  const src = keys.map((k) => e.answers[k] ?? '').find((v) => v.trim()) ?? '';
  const line = src.split('\n')[0]?.trim() ?? '';
  return line.length > 80 ? `${line.slice(0, 77)}…` : line || 'Untitled entry';
}

const isType = (v: string | null): v is JournalType => v === 'incident' || v === 'daily' || v === 'free';

export function JournalList() {
  const { data } = useStore();
  const [filter, setFilter] = useState<JournalType | 'all'>('all');
  const entries = [...data.journal].filter((e) => filter === 'all' || e.type === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Journal" intro="A private record, stored only on this device. Write when it helps; there is no expectation to journal every day." />
      <Link to="/journal/new" className="btn-primary w-full sm:w-auto mb-5"><Plus size={18} aria-hidden="true" />New entry</Link>
      {data.journal.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by entry type">
          {[{ id: 'all' as const, name: 'All' }, ...JOURNAL_TYPE_LIST].map((t) => (
            <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(t.id)}
              className={`rounded-full border px-4 min-h-[44px] text-sm font-medium ${filter === t.id ? 'chip-on' : 'chip-off'}`}>{t.name}</button>
          ))}
        </div>
      )}
      {data.journal.length === 0 ? (
        <EmptyState title="No entries yet">
          When something stays with you, a remark, a reaction, a small success, you can look at it here more closely. Choose an incident reflection, a daily review or free writing.
        </EmptyState>
      ) : entries.length === 0 ? (
        <p className="text-muted">No entries of this type yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <Link to={`/journal/${e.id}`} className="card !p-4 block hover:bg-surface2 transition-colors">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <time dateTime={e.createdAt}>{formatShort(e.createdAt)}</time>
                  <span aria-hidden="true">·</span><span>{JOURNAL_TYPES[e.type].name}</span>
                  {e.domain && <><span aria-hidden="true">·</span><DomainTag domain={e.domain} /></>}
                </div>
                <p className="font-serif text-[17px] mt-1 break-words">{entryTitle(e)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypePicker() {
  const [params] = useSearchParams();
  const scenario = params.get('scenario');
  return (
    <div>
      <PageHeader title="New entry" back="/journal" intro="What kind of reflection would help?" />
      <ul className="space-y-3">
        {JOURNAL_TYPE_LIST.map((t) => (
          <li key={t.id}>
            <Link to={`/journal/new?type=${t.id}${scenario ? `&scenario=${scenario}` : ''}`} className="card !p-4 flex items-center gap-3 hover:bg-surface2 transition-colors">
              <span className="flex-1"><span className="block font-semibold">{t.name}</span><span className="block text-sm text-muted">{t.description} {t.questions.length > 1 ? `${t.questions.length} questions, all optional.` : ''}</span></span>
              <ChevronRight size={18} className="text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JournalEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const typeParam = params.get('type');
  const { data, createJournal, updateJournal } = useStore();
  const existing = id ? data.journal.find((j) => j.id === id) : undefined;
  if (id && !existing) return <NotFound />;
  if (!existing && !isType(typeParam)) return <TypePicker />;
  const type = existing?.type ?? (typeParam as JournalType);
  return <JournalForm key={existing?.id ?? type} type={type} existing={existing} scenarioParam={params.get('scenario')} create={createJournal} update={updateJournal} />;
}

function JournalForm({ type, existing, scenarioParam, create, update }: {
  type: JournalType; existing?: JournalEntry; scenarioParam: string | null;
  create: (d: JournalDraft) => string; update: (id: string, d: JournalDraft) => void;
}) {
  const navigate = useNavigate();
  const def = JOURNAL_TYPES[type];
  const scenarioId = existing?.scenarioId ?? scenarioParam;
  const scenario = scenarioId ? SCENARIO_BY_ID[scenarioId] : undefined;
  const initial: JournalDraft = useMemo(() => existing
    ? { type, answers: { ...existing.answers }, domain: existing.domain, scenarioId: existing.scenarioId, themes: [...existing.themes] }
    : { type, answers: {}, domain: scenario?.domain ?? null, scenarioId: scenario?.id ?? null, themes: [] },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
  const [draft, setDraft] = useState<JournalDraft>(initial);
  const [themesText, setThemesText] = useState(initial.themes.join(', '));
  const [error, setError] = useState('');
  const extraKeys = Object.keys(draft.answers).filter((k) => !def.questions.some((q) => q.key === k));

  const save = () => {
    const answers = Object.fromEntries(Object.entries(draft.answers).filter(([, v]) => v.trim()));
    if (Object.keys(answers).length === 0) {
      setError('Write something in at least one field before saving.');
      return;
    }
    const themes = [...new Set(themesText.split(',').map((t) => t.trim()).filter(Boolean))].slice(0, 20).map((t) => t.slice(0, 40));
    const out = { ...draft, answers, themes };
    if (existing) {
      update(existing.id, out);
      navigate(`/journal/${existing.id}`, { replace: true });
    } else {
      navigate(`/journal/${create(out)}`, { replace: true });
    }
  };

  return (
    <div>
      <PageHeader title={existing ? `Edit ${def.name.toLowerCase()}` : def.name} back={true}
        intro={scenario ? <>Prompted by the scenario <em>{scenario.title}</em>.</> : def.description} />
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5" noValidate>
        {def.questions.map((q) => (
          <div key={q.key}>
            <label htmlFor={`q-${q.key}`} className="label">{q.label}</label>
            {q.hint && <p id={`h-${q.key}`} className="text-[13px] text-muted -mt-1 mb-1.5">{q.hint}</p>}
            <textarea id={`q-${q.key}`} aria-describedby={q.hint ? `h-${q.key}` : undefined} className={`field ${type === 'free' ? 'min-h-[220px]' : 'min-h-[80px]'}`} maxLength={20000}
              value={draft.answers[q.key] ?? ''} onChange={(e) => { setDraft({ ...draft, answers: { ...draft.answers, [q.key]: e.target.value } }); setError(''); }} />
          </div>
        ))}
        {extraKeys.map((k) => (
          <div key={k}>
            <label htmlFor={`q-${k}`} className="label">{labelFor(type, k)}</label>
            <textarea id={`q-${k}`} className="field min-h-[80px]" value={draft.answers[k] ?? ''} onChange={(e) => setDraft({ ...draft, answers: { ...draft.answers, [k]: e.target.value } })} />
          </div>
        ))}
        <fieldset>
          <legend className="label">Domain <span className="text-muted font-normal">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {[{ id: null as DomainId | null, name: 'None' }, ...DOMAIN_LIST].map((d) => (
              <button key={d.name} type="button" aria-pressed={draft.domain === d.id} onClick={() => setDraft({ ...draft, domain: d.id })}
                className={`rounded-full border px-4 min-h-[44px] text-sm ${draft.domain === d.id ? 'chip-on' : 'chip-off'}`}>{d.name}</button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="themes" className="label">Themes <span className="text-muted font-normal">(optional, comma separated)</span></label>
          <p id="themes-h" className="text-[13px] text-muted -mt-1 mb-1.5">For example: work, family, tiredness. Progress shows themes you record more than once.</p>
          <input id="themes" aria-describedby="themes-h" className="field" value={themesText} onChange={(e) => setThemesText(e.target.value)} />
        </div>
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1 sm:flex-none">Save entry</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export function JournalView() {
  const { id = '' } = useParams();
  const { data, deleteJournal } = useStore();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const entry = data.journal.find((j) => j.id === id);
  if (!entry) return <NotFound />;
  const def = JOURNAL_TYPES[entry.type];
  const scenario = entry.scenarioId ? SCENARIO_BY_ID[entry.scenarioId] : undefined;
  const keys = [...def.questions.map((q) => q.key), ...Object.keys(entry.answers).filter((k) => !def.questions.some((q) => q.key === k))]
    .filter((k) => entry.answers[k]?.trim());
  return (
    <article>
      <PageHeader title={formatShort(entry.createdAt)} eyebrow={def.name} back="/journal" />
      <div className="-mt-3 mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {entry.domain && <DomainTag domain={entry.domain} />}
        {entry.updatedAt !== entry.createdAt && <span>Edited {formatShort(entry.updatedAt)}</span>}
      </div>
      {scenario && <p className="text-sm text-muted mb-4">From the scenario <Link className="text-accent underline underline-offset-2" to={`/practise/${scenario.id}`}>{scenario.title}</Link></p>}
      <div className="card space-y-5">
        {keys.map((k) => (
          <section key={k}>
            <h2 className="text-[13px] font-semibold text-muted">{labelFor(entry.type, k)}</h2>
            <p className="mt-1 whitespace-pre-wrap break-words">{entry.answers[k]}</p>
          </section>
        ))}
        {entry.themes.length > 0 && <p className="text-sm text-muted">Themes: {entry.themes.join(', ')}</p>}
      </div>
      <div className="mt-5 flex gap-3">
        <Link to={`/journal/${entry.id}/edit`} className="btn-secondary flex-1 sm:flex-none"><Pencil size={16} aria-hidden="true" />Edit</Link>
        <button className="btn-secondary flex-1 sm:flex-none !text-danger" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" />Delete</button>
      </div>
      <ConfirmDialog open={confirm} title="Delete this entry?" confirmLabel="Delete entry" danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => { deleteJournal(entry.id); navigate('/journal', { replace: true }); }}>
        This removes the entry from this device. It cannot be undone unless you have an exported backup.
      </ConfirmDialog>
    </article>
  );
}
