import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Circle, Lock } from 'lucide-react';
import { useStore } from '../app/store';
import { FIRST_SCENARIO_ID } from '../data/scenarios';
import { INTENTION_OPTIONS } from '../data/domains';
import { orientationFor } from '../data/orientation';
import { dateKey, dayIndex } from '../engine/dates';
import type { IntentionCategory } from '../types';

const INFO_STEPS = 4;

function Shell({ children, onSkip, footer, notice }: { children: React.ReactNode; onSkip?: () => void; footer: React.ReactNode; notice?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-app px-6 pt-8 pb-8">
      <div className="flex items-center justify-between mb-8">
        <span className="font-serif text-xl font-semibold">Equanim</span>
        {onSkip && <button className="btn-ghost text-sm" onClick={onSkip}>Skip</button>}
      </div>
      {notice}
      <div className="flex-1" aria-live="polite">{children}</div>
      <div className="mt-8">{footer}</div>
    </div>
  );
}

function Dots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-center gap-2 mb-6" aria-label={`Step ${step + 1} of ${total}`} role="img">
      {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full ${i === step ? 'w-6 bg-accent' : 'w-1.5 bg-line'}`} />)}
    </div>
  );
}

function JourneyDone() {
  const { data } = useStore();
  const today = dateKey();
  const intention = data.intentions.find((i) => i.date === today);
  const completion = [...data.completions].reverse().find((c) => c.scenarioId === FIRST_SCENARIO_ID);
  const items = [
    { done: !!intention, label: 'Morning intention set', detail: intention?.text },
    { done: !!completion, label: 'First scenario completed', detail: completion ? `${completion.optionIds.length} ${completion.optionIds.length === 1 ? 'response' : 'responses'} explored` : undefined },
    { done: !!completion?.note, label: 'Reflection recorded', detail: completion?.note || 'Optional. You can add reflections any time.' },
  ];
  return (
    <Shell footer={<div className="flex flex-col gap-3"><Link to="/" className="btn-primary">Go to Today</Link><Link to="/progress" className="btn-secondary">Open Progress</Link></div>}>
      <section aria-labelledby="jd-h">
        <p className="eyebrow mb-3">Sample journey · 4 of 4 · Progress</p>
        <h1 id="jd-h" className="text-[30px] leading-tight font-semibold">Your first progress entry.</h1>
        <p className="mt-3 text-muted">This is what Progress records: only what you actually did. There is no score, and nothing is lost if you miss a day.</p>
        <ul className="card mt-6 space-y-4">
          {items.map((it) => (
            <li key={it.label} className="flex gap-3">
              {it.done ? <Check size={20} className="text-accent shrink-0 mt-0.5" aria-hidden="true" /> : <Circle size={20} className="text-sage shrink-0 mt-0.5" aria-hidden="true" />}
              <span className="min-w-0"><span className="block font-medium">{it.label}{!it.done && <span className="sr-only"> (not yet)</span>}</span>{it.detail && <span className="block text-sm text-muted break-words">{it.detail}</span>}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted mt-4">Day 1 of practice recorded on {new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}.</p>
      </section>
    </Shell>
  );
}

export function Onboarding() {
  const { completeOnboarding, loadIssue, data, setIntention } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0); // 0-3 info, 4 orientation, 5 intention
  const [name, setName] = useState('');
  const [category, setCategory] = useState<IntentionCategory>('separate-observation');
  const [target, setTarget] = useState<string | null>(null);
  const onboarded = !!data.onboardingCompletedAt;

  useEffect(() => {
    if (onboarded && target) navigate(target, { replace: true });
  }, [onboarded, target, navigate]);

  if (params.get('step') === 'journey-done' && onboarded) return <JourneyDone />;
  if (onboarded && !target) return <Navigate to="/" replace />;

  const finish = (to: string) => {
    setTarget(to);
    completeOnboarding(name);
  };
  const skip = () => finish('/');
  const notice = loadIssue && loadIssue.kind !== 'partial' ? (
    <p role="alert" className="card !p-4 mb-6 bg-claysoft border-terracotta/50 text-sm">
      {loadIssue.kind === 'backup-failed'
        ? 'Equanim could not make a safety copy of your saved data (storage may be full), so saving is paused to protect what is already stored. Free some browser storage, then reload.'
        : 'Your previously saved data could not be opened, so Equanim is starting fresh. The unreadable copy was kept on this device, not deleted, and can be downloaded from Settings and Data. If you have an exported backup, you can import it there after this introduction.'}
    </p>
  ) : undefined;

  if (step < INFO_STEPS) {
    return (
      <Shell onSkip={skip} notice={notice} footer={
        <>
          <Dots step={step} total={INFO_STEPS} />
          <div className="flex gap-3">
            {step > 0 && <button className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>Back</button>}
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>Continue</button>
          </div>
        </>
      }>
        {step === 0 && (
          <section aria-labelledby="ob-0">
            <p className="eyebrow mb-3">Welcome</p>
            <h1 id="ob-0" className="text-[34px] leading-tight font-semibold">Clarity in the midst of life.</h1>
            <div className="mt-5 text-[17px] text-muted space-y-4">
              <p>Equanim is a companion for daily practice: speaking with care, separating what happened from the meaning added, checking assumptions, and making a sincere effort without demanding perfection.</p>
              <p>Most of the day happens quickly. Practice here helps you notice the moment between what happens and how you respond, and use it a little more often.</p>
            </div>
          </section>
        )}
        {step === 1 && (
          <section aria-labelledby="ob-1">
            <p className="eyebrow mb-3">What it is not</p>
            <h1 id="ob-1" className="text-[30px] leading-tight font-semibold">A tool for reflection, not a treatment.</h1>
            <div className="mt-5 text-[16px] space-y-4">
              <p>Equanim is not therapy and not a replacement for professional mental-health support. If you are struggling, please speak to someone you trust or a qualified professional. In an emergency in India, call 112.</p>
              <p className="text-muted">It contains no AI: all feedback was written in advance. It is an independent tool inspired by broad themes in Don Miguel Ruiz’s <em>The Four Agreements</em>, written in original words, and is not affiliated with or endorsed by the author or publisher.</p>
            </div>
          </section>
        )}
        {step === 2 && (
          <section aria-labelledby="ob-2">
            <p className="eyebrow mb-3">How it works</p>
            <h1 id="ob-2" className="text-[30px] leading-tight font-semibold">A few minutes a day, in five places.</h1>
            <p className="mt-4 text-muted">Short, repeated practice changes habits more reliably than occasional long sessions. Most days need only five to ten minutes.</p>
            <dl className="mt-5 space-y-3 text-[15px]">
              {[
                ['Today', 'An orientation, one intention, a short practice, a scenario and an evening reflection.'],
                ['Practise', 'Everyday scenarios with feedback on trade-offs, across four domains.'],
                ['Journal', 'Incident reflections, daily reviews and free writing.'],
                ['Library', 'Short original readings, each with an exercise.'],
                ['Progress', 'A record of what you have practised, built only from your own entries.'],
              ].map(([t, d]) => <div key={t} className="flex gap-3"><dt className="w-20 shrink-0 font-semibold">{t}</dt><dd className="text-muted">{d}</dd></div>)}
            </dl>
          </section>
        )}
        {step === 3 && (
          <section aria-labelledby="ob-3">
            <p className="eyebrow mb-3">Your data</p>
            <h1 id="ob-3" className="text-[30px] leading-tight font-semibold">Private, and stored on this device.</h1>
            <div className="mt-5 space-y-4 text-[16px]">
              <p className="flex gap-3"><Lock size={20} className="text-accent shrink-0 mt-1" aria-hidden="true" />Everything you write is stored in this browser on this device. There is no account, no server and no tracking.</p>
              <p className="text-muted">That also means clearing your browser data, or switching browser or device, will lose it. You can export a backup at any time from Settings and Data.</p>
              <div>
                <label htmlFor="ob-name" className="label">What should Equanim call you? <span className="text-muted font-normal">(optional)</span></label>
                <input id="ob-name" className="field" value={name} maxLength={80} autoComplete="given-name" onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
              </div>
            </div>
          </section>
        )}
      </Shell>
    );
  }

  if (step === 4) {
    return (
      <Shell onSkip={skip} footer={<button className="btn-primary w-full" onClick={() => setStep(5)}>Continue</button>}>
        <section aria-labelledby="j-1">
          <p className="eyebrow mb-3">Sample journey · 1 of 4 · Orientation</p>
          <h1 id="j-1" className="text-[28px] leading-snug font-semibold">{orientationFor(dayIndex(dateKey()))}</h1>
          <p className="mt-5 text-muted">Each day on Today begins with a short orientation like this one. It changes daily. Let’s walk through a first day: an intention, a scenario, a reflection, and the progress entry it creates.</p>
        </section>
      </Shell>
    );
  }

  const option = INTENTION_OPTIONS.find((o) => o.id === category);
  return (
    <Shell onSkip={skip} footer={
      <button className="btn-primary w-full" onClick={() => {
        if (option) setIntention(option.id, option.example, option.domain);
        finish(`/practise/${FIRST_SCENARIO_ID}?first=1`);
      }}>Set intention and continue</button>
    }>
      <section aria-labelledby="j-2">
        <p className="eyebrow mb-3">Sample journey · 2 of 4 · Morning intention</p>
        <h1 id="j-2" className="text-[28px] leading-tight font-semibold">Choose one intention for today.</h1>
        <fieldset className="mt-5">
          <legend className="sr-only">Intention</legend>
          <div className="space-y-2">
            {INTENTION_OPTIONS.map((o) => (
              <label key={o.id} className={`block cursor-pointer rounded-xl border px-4 py-3 ${category === o.id ? 'border-accent bg-accentsoft' : 'border-line bg-surface'}`}>
                <input type="radio" name="j-int" value={o.id} checked={category === o.id} onChange={() => setCategory(o.id)} className="sr-only" />
                <span className="block font-medium text-[15px]">{o.label}</span>
                <span className="block text-[13px] text-muted">{o.example}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p className="text-sm text-muted mt-4">Next: a short scenario with a reflection question. Then you will see the progress entry it creates.</p>
      </section>
    </Shell>
  );
}
