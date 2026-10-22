import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { DAY_TYPES, MICRO_CHECKS, THINK_RESPONSES, INTEGRATION_BY_ID, RETRIEVAL_BY_ID, SESSION_BY_ID, type SessionDef } from '../../data/programme';
import { DOMAINS } from '../../data/domains';
import { BaselineCompare, EvidenceOfChange, PhraseBankCard, ValuesCollapsed, ValuesList } from '../../components/journey';
import { SCENARIO_BY_ID } from '../../data/scenarios';
import { dateKey } from '../../engine/dates';
import { applyReady, currentSessionId, isDone, isUnlocked, latestSnapshot, sessionRoute, weekDayLabel } from '../../engine/programme';
import { ChoiceItem, ModeToggle } from '../../components/programme';
import { DomainTag, PageHeader } from '../../components/ui';
import { Confirmation } from '../../components/Confirmation';
import { NotFound } from '../NotFound';
import { Paced } from '../../components/pacing';
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
  const [think, setThink] = useState<Record<string, string>>(prev?.thinkResponses ?? {});
  const [justDone, setJustDone] = useState(false);
  const [doneAtStart] = useState(!!prev);
  if (!s) return <NotFound />;
  if (s.special === 'baseline-finish') return <Navigate to="/baseline/finish" replace />;
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
  // Day 4 Apply reflects a real plan: Complete stays disabled until one exists this week. Revisits are never blocked.
  const applyOk = !s.apply || isDone(data, s.id) || applyReady(data, s.week, dateKey());
  const finish = () => { completeSession(s.id, mode, answers, choices, mode === 'think' ? think : {}); setJustDone(true); };
  const checks = MICRO_CHECKS[s.id] ?? [];
  // The Complete button appears once every micro-check has an answer. Any answer counts: a different one teaches, it does not block.
  const checksDone = checks.every((c) => !!choices[c.id]);
  const prompt = (p: { id: string; label: string; hint?: string }) => (
    <div key={p.id} className="mt-3">
      {mode === 'write' ? (
        <>
          <label htmlFor={`p-${p.id}`} className="label">{p.label}</label>
          <textarea id={`p-${p.id}`} className="field min-h-[80px]" maxLength={2000} value={answers[p.id] ?? ''} onChange={(e) => setAnswers({ ...answers, [p.id]: e.target.value })} />
        </>
      ) : (
        <fieldset>
          <legend className="text-[15.5px] font-medium">{p.label}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {THINK_RESPONSES.map((r) => (
              <label key={r.id} className={`inline-flex items-center cursor-pointer rounded-full border px-3 min-h-[44px] text-[14px] ${think[p.id] === r.id ? 'border-accent bg-accentsoft font-medium' : 'border-line'}`}>
                <input type="radio" name={`think-${p.id}`} value={r.id} checked={think[p.id] === r.id} onChange={() => setThink((t) => ({ ...t, [p.id]: r.id }))} className="sr-only" />{r.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {p.hint && <p className="text-[13px] text-muted mt-1">{p.hint}</p>}
    </div>
  );

  return (
    <Paced sessionId={s.id} title={<PageHeader eyebrow={eyebrow} title={s.title} back="/" />}>
    <article className="space-y-4">
      <PageHeader eyebrow={eyebrow} title={s.title} back={onboarded ? '/' : '/welcome'} intro={s.intro} />
      {s.domain && <DomainTag domain={s.domain} />}
      <ModeToggle mode={mode} onChange={setMode} />
      <p className="text-[13px] text-muted">{mode === 'think' ? 'Read, pause, then tap the answer that fits. Nothing needs to be typed.' : 'Your answers are kept privately with this session on this device.'}</p>

      {s.lesson && (
        <Block title="The idea">
          {s.lesson.body.map((p) => <p key={p} className="text-[16px] mt-2 first:mt-0">{p}</p>)}
          <p className="mt-3 rounded-xl bg-surface2/70 p-3 text-[15px]"><span className="font-semibold">Example: </span>{s.lesson.example}</p>
        </Block>
      )}
      {checks.map((c) => (
        <section key={c.id} aria-label="Quick check" className="space-y-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted">Quick check</p>
          <ChoiceItem id={c.id} situation={c.situation} question={c.question} options={c.options} answerId={c.answerId}
            initial={choices[c.id]} onChoose={(o) => setChoices((x) => ({ ...x, [c.id]: o }))} />
        </section>
      ))}
      {s.recognise?.map((r) => (
        <ChoiceItem key={r.id} id={r.id} situation={r.situation} question={r.question} options={r.options} answerId={r.answerId}
          initial={choices[r.id]} onChoose={(o) => setChoices((c) => ({ ...c, [r.id]: o }))} />
      ))}
      {s.showValues && <ValuesList data={data} title="Your values, from Day 0" />}
      {s.special === 'compare' && (
        <Block title="Day 0 and now">
          <BaselineCompare start={data.baselines.find((b) => b.kind === 'start')} now={latestSnapshot(data)} nowLabel="Week 6" />
        </Block>
      )}
      {s.special === 'evidence' && <Block title="From your own notes"><EvidenceOfChange data={data} /></Block>}
      {s.special === 'maintenance' && (
        <Block title="What maintenance looks like">
          <p className="text-[15.5px]">After Week 6, Today switches to a lighter rhythm: about three short sessions a week from Keep practising, a monthly check-in with the same statements, and the option to repeat any week whenever you like.</p>
        </Block>
      )}
      {s.banks && s.banks.map((b) => <PhraseBankCard key={b} id={b} />)}
      {s.banks && s.rehearse && <p className="text-[15px]">{s.rehearse}</p>}
      {s.integration?.map((xid) => {
        const x = INTEGRATION_BY_ID[xid];
        return x ? (
          <div key={x.id}>
            <p className="text-[12px] text-muted mb-1.5">Skills: {x.domains.map((d) => DOMAINS[d].name).join(' · ')}</p>
            <ChoiceItem id={x.id} situation={x.situation} question={x.question} options={x.options} answerId={x.answerId}
              initial={choices[x.id]} onChoose={(o) => setChoices((c) => ({ ...c, [x.id]: o }))} />
          </div>
        ) : null;
      })}
      {s.apply && <ValuesCollapsed data={data} />}
      {s.apply && (
        <Block title="Make it concrete">
          <p className="text-[15.5px]">{s.apply.explain}</p>
          {applyOk
            ? <p className="mt-3 text-[15px] flex gap-2 items-center"><Check size={17} className="text-accent" aria-hidden="true" />You have a plan this week. You can finish the session.</p>
            : <p className="mt-3 text-[15px] rounded-xl bg-accentsoft px-3 py-2" data-testid="apply-needs-plan">Make today’s plan first. The session finishes once you have one real plan to try.</p>}
          <Link to={`/plan?from=${s.id}`} className="btn-secondary mt-3">{applyOk ? 'Open the if-then builder' : 'Make today’s plan'}<ArrowRight size={16} aria-hidden="true" /></Link>
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
        <div className={`card ${justDone ? 'completion-moment' : ''}`}>
          <Confirmation focus={justDone} className="flex items-center gap-2 font-medium text-accent"><Check size={18} aria-hidden="true" />{doneAtStart && !justDone ? 'Completed. You can revisit it any time.' : 'Session complete'}</Confirmation>
          {justDone && !doneAtStart && !isTaster && <p className="text-muted text-[15px] mt-2">Nice work. The next session opens tomorrow, and any day after that is fine too.</p>}
          {doneAtStart && justDone && <p className="text-muted text-[15px] mt-2">Your changes were saved.</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            {isTaster && !onboarded ? <Link to="/welcome" className="btn-primary">Back to the welcome<ArrowRight size={16} aria-hidden="true" /></Link>
              : <Link to="/" className="btn-primary">Back to Today<ArrowRight size={16} aria-hidden="true" /></Link>}
            {s.apply && <Link to="/plan" className="btn-secondary">Make today’s plan</Link>}
            {s.id === 'w6d5' && justDone && <Link to="/finish" className="btn-secondary">See your six weeks</Link>}
            {doneAtStart && !justDone && <button className="btn-ghost" onClick={finish}>Save changes</button>}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {checksDone
            ? <button className="btn-primary w-full sm:w-auto" onClick={finish} disabled={!applyOk}>Complete session</button>
            : <p className="text-[14.5px] text-muted" data-testid="check-first">Answer the quick check above to finish. Any answer is fine.</p>}
          {!applyOk && <Link to="/" className="btn-ghost">I’ll do this later</Link>}
        </div>
      )}
    </article>
    </Paced>
  );
}
