import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { DAY_TYPES, RETRIEVAL_BY_ID, SESSION_BY_ID, type SessionDef } from '../../data/programme';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { currentSessionId, isDone, isUnlocked, sessionRoute, weekDayLabel } from '../../engine/programme';
import { ChoiceItem, ModeToggle } from '../../components/programme';
import { DomainTag, PageHeader } from '../../components/ui';
import { Confirmation } from '../../components/Confirmation';
import { NotFound } from '../NotFound';
import type { SessionMode } from '../../types';

function typeLabel(s: SessionDef) {
  return s.type === 'taster' ? 'Taster' : DAY_TYPES[s.day]?.label ?? s.title;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card" aria-label={title}>
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted mb-2">{title}</h2>
      {children}
    </section>
  );
}

export function Session() {
  const { id = '' } = useParams();
  const { data, completeSession, answerRecall } = useStore();
  const s = SESSION_BY_ID[id];
  const prev = data.sessions.find((x) => x.sessionId === id);
  const [mode, setMode] = useState<SessionMode>(prev?.mode ?? 'think');
  const [answers, setAnswers] = useState<Record<string, string>>(prev?.answers ?? {});
  const [choices, setChoices] = useState<Record<string, string>>(prev?.choices ?? {});
  const [justDone, setJustDone] = useState(false);
  const [doneAtStart] = useState(!!prev);
  if (!s) return <NotFound />;
  const onboarded = !!data.onboardingCompletedAt;
  const isTaster = s.type === 'taster';
  const eyebrow = isTaster ? 'Two-minute taster' : `${weekDayLabel(s.id)} · ${typeLabel(s)} · ${s.minutes} min`;

  if (!s.available) {
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title={s.title} back="/" />
        <div className="card"><p>This session arrives in the next update of Equanim. Your progress is kept. In the meantime, Keep practising has scenarios and readings for every skill.</p>
          <Link to="/library" className="btn-primary mt-4">Keep practising<ArrowRight size={16} aria-hidden="true" /></Link></div>
      </div>
    );
  }
  if (!isTaster && !isUnlocked(data, s.id)) {
    const cur = currentSessionId(data);
    return (
      <div>
        <PageHeader eyebrow={eyebrow} title={s.title} back="/" />
        <div className="card flex gap-3"><Lock size={20} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
          <div><p>Sessions open one after another, so each builds on the last. This one opens after you finish the ones before it. There is no deadline.</p>
            {cur && <Link to={sessionRoute(cur, data)} className="btn-primary mt-4">Go to {weekDayLabel(cur)}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>
        </div>
      </div>
    );
  }

  const done = isDone(data, s.id) || justDone;
  const finish = () => { completeSession(s.id, mode, answers, choices); setJustDone(true); };
  const prompt = (p: { id: string; label: string; hint?: string }) => (
    <div key={p.id} className="mt-3">
      {mode === 'write' ? (
        <>
          <label htmlFor={`p-${p.id}`} className="label">{p.label}</label>
          <textarea id={`p-${p.id}`} className="field min-h-[80px]" maxLength={2000} value={answers[p.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [p.id]: e.target.value })} />
        </>
      ) : <p className="text-[15.5px] font-medium">{p.label}</p>}
      {p.hint && <p className="text-[13px] text-muted mt-1">{p.hint}</p>}
    </div>
  );

  return (
    <article className="space-y-4">
      <PageHeader eyebrow={eyebrow} title={s.title} back={onboarded ? '/' : '/welcome'} intro={s.intro} />
      {s.domain && <DomainTag domain={s.domain} />}
      <ModeToggle mode={mode} onChange={setMode} />
      <p className="text-[13px] text-muted">{mode === 'think' ? 'Read, pause and answer in your head. Nothing needs to be typed.' : 'Your answers are kept privately with this session on this device.'}</p>

      {s.lesson && (
        <Block title="The idea">
          {s.lesson.body.map((p) => <p key={p} className="text-[16px] mt-2 first:mt-0">{p}</p>)}
          <p className="mt-3 rounded-xl bg-surface2/70 p-3 text-[15px]"><span className="font-semibold">Example: </span>{s.lesson.example}</p>
        </Block>
      )}
      {s.recognise?.map((r) => (
        <ChoiceItem key={r.id} id={r.id} situation={r.situation} question={r.question} options={r.options} answerId={r.answerId}
          initial={choices[r.id]} onChoose={(o) => setChoices((c) => ({ ...c, [r.id]: o }))} />
      ))}
      {s.phrases && (
        <Block title="Phrases to try">
          <ul className="space-y-2">{s.phrases.map((p) => <li key={p} className="rounded-xl border border-line px-3 py-2 text-[15.5px] font-serif">“{p}”</li>)}</ul>
          {s.rehearse && <p className="mt-3 text-[15px]">{s.rehearse}</p>}
        </Block>
      )}
      {s.apply && (
        <Block title="Make it concrete">
          <p className="text-[15.5px]">{s.apply.explain}</p>
          <Link to="/plan" className="btn-secondary mt-3">Open the if-then builder<ArrowRight size={16} aria-hidden="true" /></Link>
        </Block>
      )}
      {s.retrieval && (
        <>
          <p className="text-[15px] text-muted">Answer from memory first. Recalling, even imperfectly, is what makes it stick.</p>
          {s.retrieval.questionIds.map((qid) => {
            const q = RETRIEVAL_BY_ID[qid];
            return q ? <ChoiceItem key={q.id} id={q.id} question={q.question} options={q.options} answerId={q.answerId} initial={choices[q.id]}
              onChoose={(o, correct) => { setChoices((c) => ({ ...c, [q.id]: o })); answerRecall(q.id, correct); }} /> : null;
          })}
          {SCENARIO_BY_ID[s.retrieval.scenarioId] && (
            <Block title="A harder one">
              <p className="font-serif text-[18px] font-semibold">{SCENARIO_BY_ID[s.retrieval.scenarioId]!.title}</p>
              <p className="text-muted text-[15px] mt-1">{SCENARIO_BY_ID[s.retrieval.scenarioId]!.situation}</p>
              <Link to={`/practise/${s.retrieval.scenarioId}?from=${s.id}`} className="btn-secondary mt-3">Open the scenario<ArrowRight size={16} aria-hidden="true" /></Link>
            </Block>
          )}
        </>
      )}
      {s.prompts && s.prompts.length > 0 && <Block title={mode === 'write' ? 'Write it down' : 'Think it through'}>{s.prompts.map(prompt)}</Block>}
      {s.notThis && (
        <aside className="card !p-4 bg-surface2/60" aria-label="What this is not">
          <p className="text-[14.5px]"><span className="font-semibold">Not this: </span>{s.notThis}</p>
        </aside>
      )}

      {done ? (
        <div className="card">
          <Confirmation focus={justDone} className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />{doneAtStart && !justDone ? 'Completed. You can revisit it any time.' : 'Session complete'}</Confirmation>
          {justDone && !doneAtStart && !isTaster && <p className="text-muted text-[15px] mt-2">Nice work. The next session opens now, whenever you are ready: today, tomorrow or later.</p>}
          {doneAtStart && justDone && <p className="text-muted text-[15px] mt-2">Your changes were saved.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {isTaster && !onboarded ? <Link to="/welcome" className="btn-primary">Back to the welcome<ArrowRight size={16} aria-hidden="true" /></Link>
              : <Link to="/" className="btn-primary">Back to Today<ArrowRight size={16} aria-hidden="true" /></Link>}
            {s.apply && <Link to="/plan" className="btn-secondary">Make today’s plan</Link>}
            {doneAtStart && !justDone && <button className="btn-ghost" onClick={finish}>Save changes</button>}
          </div>
        </div>
      ) : (
        <button className="btn-primary w-full sm:w-auto" onClick={finish}>Complete session</button>
      )}
    </article>
  );
}
