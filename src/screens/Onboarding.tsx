import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Sunrise, Compass, Moon, Lock } from 'lucide-react';
import { useStore } from '../app/store';
import { FIRST_SCENARIO_ID } from '../data/scenarios';

const STEPS = 4;

export function Onboarding() {
  const { completeOnboarding, loadIssue, data } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const [target, setTarget] = useState<string | null>(null);
  const onboarded = !!data.onboardingCompletedAt;

  // Navigate only after the completed-onboarding state has been committed, so the route gate sees it.
  useEffect(() => {
    if (onboarded && target) navigate(target, { replace: true });
  }, [onboarded, target, navigate]);

  const finish = (to: string) => {
    setTarget(to);
    completeOnboarding(name);
  };

  if (onboarded && !target) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-app px-6 pt-10 pb-8">
      <div className="flex items-center justify-between mb-10">
        <span className="font-serif text-xl font-semibold">Equanim</span>
        {step < STEPS - 1 && (
          <button className="btn-ghost text-sm" onClick={() => setStep(STEPS - 1)}>Skip</button>
        )}
      </div>

      {loadIssue && (
        <p role="alert" className="card !p-4 mb-6 bg-claysoft border-clay/50 text-sm">
          Your previously saved data could not be opened, so Equanim is starting fresh. The unreadable copy was kept on this device, not deleted. If you have an exported backup, you can import it from Settings after this introduction.
        </p>
      )}
      <div className="flex-1" aria-live="polite">
        {step === 0 && (
          <section aria-labelledby="ob-0">
            <p className="eyebrow mb-3">Welcome</p>
            <h1 id="ob-0" className="text-[34px] leading-tight font-semibold">Clarity in the midst of life.</h1>
            <div className="mt-5 text-[17px] text-muted space-y-4">
              <p>Most of the day happens quickly. Something is said, something is assumed, and a reaction is already under way before we have noticed.</p>
              <p>Equanim is a place to practise noticing: to see the gap between what happens and how you respond, and to use it a little more each day.</p>
            </div>
          </section>
        )}

        {step === 1 && (
          <section aria-labelledby="ob-1">
            <p className="eyebrow mb-3">A sample day</p>
            <h1 id="ob-1" className="text-[30px] leading-tight font-semibold">Practice takes a few minutes, spread through the day.</h1>
            <ol className="mt-6 space-y-4">
              <li className="card !p-4 flex gap-4">
                <Sunrise className="text-clay shrink-0 mt-0.5" aria-hidden="true" />
                <div><p className="font-medium">Morning: one small intention</p><p className="text-muted text-[15px]">“When someone is short with me today, I’ll look for one explanation that isn’t about me.”</p></div>
              </li>
              <li className="card !p-4 flex gap-4">
                <Compass className="text-accent shrink-0 mt-0.5" aria-hidden="true" />
                <div><p className="font-medium">During the day: a scenario or a real moment</p><p className="text-muted text-[15px]">Choose a response to an everyday situation and see what each choice protects and what it costs.</p></div>
              </li>
              <li className="card !p-4 flex gap-4">
                <Moon className="text-words shrink-0 mt-0.5" aria-hidden="true" />
                <div><p className="font-medium">Evening: notice, without judging</p><p className="text-muted text-[15px]">Did the intention come to mind in the moment, afterwards, or not today? Each answer is useful information.</p></div>
              </li>
            </ol>
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="ob-2">
            <p className="eyebrow mb-3">Before you begin</p>
            <h1 id="ob-2" className="text-[30px] leading-tight font-semibold">Private, and yours.</h1>
            <div className="mt-5 space-y-4 text-[16px]">
              <p className="flex gap-3"><Lock size={20} className="text-accent shrink-0 mt-1" aria-hidden="true" />Everything you write stays on this device. There is no account, no server and no tracking. You can export a backup whenever you like.</p>
              <p className="text-muted">Equanim is an independent tool for education and self-reflection. It draws on broad themes from Don Miguel Ruiz’s <em>The Four Agreements</em>, expressed in original words, and is not affiliated with or endorsed by the author or publisher.</p>
              <p className="text-muted">It is not therapy or medical advice. If you are struggling, please reach out to someone you trust or a qualified professional.</p>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="ob-3">
            <p className="eyebrow mb-3">Your first practice</p>
            <h1 id="ob-3" className="text-[30px] leading-tight font-semibold">Start with one short scenario.</h1>
            <p className="mt-4 text-muted">It takes about two minutes. There are no right answers, only different trade-offs.</p>
            <label htmlFor="ob-name" className="label mt-8">What should Equanim call you? <span className="text-muted font-normal">(optional)</span></label>
            <input id="ob-name" className="field" value={name} maxLength={80} autoComplete="given-name" onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
          </section>
        )}
      </div>

      <div className="mt-10">
        <div className="flex justify-center gap-2 mb-6" aria-label={`Step ${step + 1} of ${STEPS}`} role="img">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-accent' : 'w-1.5 bg-line'}`} />
          ))}
        </div>
        {step < STEPS - 1 ? (
          <div className="flex gap-3">
            {step > 0 && <button className="btn-secondary flex-1" onClick={() => setStep(step - 1)}>Back</button>}
            <button className="btn-primary flex-1" onClick={() => setStep(step + 1)}>Continue</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button className="btn-primary" onClick={() => finish(`/practise/${FIRST_SCENARIO_ID}?first=1`)}>Begin first practice</button>
            <button className="btn-secondary" onClick={() => finish('/')}>Go to Today instead</button>
          </div>
        )}
      </div>
    </div>
  );
}
