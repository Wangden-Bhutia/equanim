import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useStore } from '../../app/store';
import { VALUES, VALUE_BY_ID, VALUE_SENTENCE_PROMPT } from '../../data/programme';
import { PageHeader } from '../../components/ui';

export function Values() {
  const { data, saveValues, startProgramme } = useStore();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>(data.values.map((v) => v.id));
  const [sentences, setSentences] = useState<Record<string, string>>(Object.fromEntries(data.values.map((v) => [v.id, v.sentence])));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  const ready = picked.length === 3 && picked.every((id) => (sentences[id] ?? '').trim());
  const save = () => {
    if (!ready) return;
    if (!data.programme) startProgramme();
    saveValues(picked.map((id) => ({ id, sentence: sentences[id] ?? '' })));
    navigate('/baseline');
  };
  return (
    <div>
      <PageHeader eyebrow="Week 0 · Day 0 · Step 1 of 2" title="Your values" back="/"
        intro="Pick three that matter most to you right now. They are for you: later sessions will ask how a plan connects to them." />
      <fieldset>
        <legend className="label">Choose three ({picked.length} of 3 chosen)</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VALUES.map((v) => {
            const on = picked.includes(v.id);
            const disabled = !on && picked.length >= 3;
            return (
              <label key={v.id} className={`flex items-center gap-2 rounded-xl border px-3 min-h-[44px] text-[15px] ${on ? 'border-accent bg-accentsoft font-medium' : 'border-line'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="checkbox" className="sr-only" checked={on} disabled={disabled} onChange={() => toggle(v.id)} />
                {on && <Check size={16} aria-hidden="true" />}{v.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      {picked.length > 0 && (
        <div className="mt-6 space-y-4">
          <p className="text-muted text-[15px]">{VALUE_SENTENCE_PROMPT} One sentence each.</p>
          {picked.map((id) => (
            <div key={id}>
              <label htmlFor={`val-${id}`} className="label">{VALUE_BY_ID[id]}</label>
              <textarea id={`val-${id}`} className="field min-h-[64px]" maxLength={300} value={sentences[id] ?? ''}
                onChange={(e) => setSentences({ ...sentences, [id]: e.target.value })} placeholder="On an ordinary day, this would look like…" />
            </div>
          ))}
        </div>
      )}
      <button className="btn-primary mt-6 w-full sm:w-auto" disabled={!ready} onClick={save}>Save and continue</button>
      {!ready && <p className="text-sm text-muted mt-2">Choose three values and write a sentence for each to continue.</p>}
    </div>
  );
}
