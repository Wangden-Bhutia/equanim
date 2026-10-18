import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore, type JournalDraft } from '../app/store';
import { DOMAIN_LIST } from '../data/domains';
import { SCENARIO_BY_ID } from '../data/scenarios';
import { formatShort } from '../lib/dates';
import type { DomainId, JournalEntry } from '../lib/types';
import { ConfirmDialog, DomainTag, EmptyState, PageHeader } from '../components/ui';
import { NotFound } from './NotFound';

const FIELDS: { key: keyof Pick<JournalDraft, 'situation' | 'story' | 'response' | 'nextTime' | 'note'>; label: string; hint: string }[] = [
  { key: 'situation', label: 'What happened', hint: 'Only what a camera would have recorded.' },
  { key: 'story', label: 'The meaning I added', hint: 'What I told myself it meant.' },
  { key: 'response', label: 'How I responded', hint: 'What I said or did, and what I felt.' },
  { key: 'nextTime', label: 'What I might try next time', hint: 'Optional. One small, realistic change.' },
  { key: 'note', label: 'Anything else', hint: 'Free reflection.' },
];

export function entryTitle(e: JournalEntry): string {
  const src = e.situation || e.note || e.story || e.response || e.nextTime;
  const line = src.split('\n')[0]?.trim() ?? '';
  return line.length > 80 ? `${line.slice(0, 77)}…` : line || 'Untitled entry';
}

export function JournalList() {
  const { data } = useStore();
  const entries = [...data.journal].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Journal" intro="A private record of moments you want to see more clearly. Stored only on this device." />
      <Link to="/journal/new" className="btn-primary w-full mb-5"><Plus size={18} aria-hidden="true" />New entry</Link>
      {entries.length === 0 ? (
        <EmptyState title="No entries yet">
          When something stays with you, a remark, a reaction, a small success, write it down here. Separating what happened from the story about it is often enough to loosen its grip.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id}>
              <Link to={`/journal/${e.id}`} className="card !p-4 block hover:bg-surface2 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted">
                  <time dateTime={e.createdAt}>{formatShort(e.createdAt)}</time>
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

export function JournalEditor() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { data, createJournal, updateJournal } = useStore();
  const navigate = useNavigate();
  const existing = id ? data.journal.find((j) => j.id === id) : undefined;
  const scenarioId = existing?.scenarioId ?? params.get('scenario');
  const scenario = scenarioId ? SCENARIO_BY_ID[scenarioId] : undefined;

  const initial: JournalDraft = useMemo(
    () =>
      existing
        ? { domain: existing.domain, scenarioId: existing.scenarioId, situation: existing.situation, story: existing.story, response: existing.response, nextTime: existing.nextTime, note: existing.note }
        : { domain: scenario?.domain ?? null, scenarioId: scenario?.id ?? null, situation: '', story: '', response: '', nextTime: '', note: '' },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [draft, setDraft] = useState<JournalDraft>(initial);
  const [error, setError] = useState('');

  if (id && !existing) return <NotFound />;

  const hasContent = FIELDS.some((f) => draft[f.key].trim());
  const save = () => {
    if (!hasContent) {
      setError('Write something in at least one field before saving.');
      return;
    }
    if (existing) {
      updateJournal(existing.id, draft);
      navigate(`/journal/${existing.id}`, { replace: true });
    } else {
      const newIdValue = createJournal(draft);
      navigate(`/journal/${newIdValue}`, { replace: true });
    }
  };

  return (
    <div>
      <PageHeader title={existing ? 'Edit entry' : 'New entry'} back={true} intro={scenario ? <>Prompted by the scenario <em>{scenario.title}</em>. {scenario.reflection}</> : 'Fill in as much or as little as helps. Every field is optional except that something must be written.'} />
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-5" noValidate>
        <fieldset>
          <legend className="label">Area <span className="text-muted font-normal">(optional)</span></legend>
          <div className="flex flex-wrap gap-2">
            {[{ id: null as DomainId | null, name: 'None' }, ...DOMAIN_LIST].map((d) => (
              <button key={d.name} type="button" aria-pressed={draft.domain === d.id} onClick={() => setDraft({ ...draft, domain: d.id })}
                className={`rounded-full border px-4 min-h-[40px] text-sm ${draft.domain === d.id ? 'bg-accent text-onaccent border-accent' : 'border-line text-muted bg-surface'}`}>
                {d.name}
              </button>
            ))}
          </div>
        </fieldset>
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label htmlFor={`f-${f.key}`} className="label">{f.label}</label>
            <p id={`h-${f.key}`} className="text-[13px] text-muted -mt-1 mb-1.5">{f.hint}</p>
            <textarea id={`f-${f.key}`} aria-describedby={`h-${f.key}`} className="field min-h-[84px]" maxLength={20000} value={draft[f.key]}
              onChange={(e) => { setDraft({ ...draft, [f.key]: e.target.value }); setError(''); }} />
          </div>
        ))}
        {error && <p role="alert" className="text-danger text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1">Save entry</button>
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
  const scenario = entry.scenarioId ? SCENARIO_BY_ID[entry.scenarioId] : undefined;
  return (
    <article>
      <PageHeader title={formatShort(entry.createdAt)} eyebrow="Journal entry" back="/journal" />
      <div className="-mt-3 mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
        {entry.domain && <DomainTag domain={entry.domain} />}
        {entry.updatedAt !== entry.createdAt && <span>Edited {formatShort(entry.updatedAt)}</span>}
      </div>
      {scenario && <p className="text-sm text-muted mb-4">From the scenario <Link className="text-accent underline underline-offset-2" to={`/practise/${scenario.id}`}>{scenario.title}</Link></p>}
      <div className="card space-y-5">
        {FIELDS.filter((f) => entry[f.key].trim()).map((f) => (
          <section key={f.key}>
            <h2 className="eyebrow">{f.label}</h2>
            <p className="mt-1.5 whitespace-pre-wrap break-words">{entry[f.key]}</p>
          </section>
        ))}
      </div>
      <div className="mt-5 flex gap-3">
        <Link to={`/journal/${entry.id}/edit`} className="btn-secondary flex-1"><Pencil size={16} aria-hidden="true" />Edit</Link>
        <button className="btn-secondary flex-1 !text-danger" onClick={() => setConfirm(true)}><Trash2 size={16} aria-hidden="true" />Delete</button>
      </div>
      <ConfirmDialog open={confirm} title="Delete this entry?" confirmLabel="Delete entry" danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => { deleteJournal(entry.id); navigate('/journal', { replace: true }); }}>
        This removes the entry from this device. It cannot be undone unless you have an exported backup.
      </ConfirmDialog>
    </article>
  );
}
