import { useEffect, useState } from 'react';
import { DAILY_SHORT } from '../../engine/time';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, Lock } from 'lucide-react';
import { useStore } from '../../app/store';
import { SafetyFooter, StepShell } from '../../components/programme';

/** One welcome screen. It leads to Day 0, or to a two-minute taster first. */
export function Welcome() {
  const { data, loadIssue, completeOnboarding, startProgramme } = useStore();
  const navigate = useNavigate();
  const [target, setTarget] = useState<string | null>(null);
  const onboarded = !!data.onboardingCompletedAt;

  useEffect(() => {
    if (onboarded && target) navigate(target, { replace: true });
  }, [onboarded, target, navigate]);
  if (onboarded && !target) return <Navigate to="/" replace />;

  const begin = () => { setTarget('/values'); startProgramme(); completeOnboarding(''); };
  const explore = () => { setTarget('/'); completeOnboarding(''); };

  return (
    <StepShell footer={
      <div className="space-y-3">
        <button className="btn-primary w-full" onClick={begin}>Begin Day 0</button>
        <Link to="/session/taster" className="btn-secondary w-full">Try a 2-minute taster first</Link>
        <button className="btn-ghost w-full text-sm" onClick={explore}>Look around without starting</button>
        <SafetyFooter className="pt-3 text-center" />
      </div>
    }>
      {loadIssue && loadIssue.kind !== 'partial' && (
        <p role="alert" className="card !p-4 mb-6 bg-claysoft border-terracotta/50 text-sm">
          {loadIssue.kind === 'backup-failed'
            ? 'Equanim could not make a safety copy of your saved data (storage may be full), so saving is paused to protect what is already stored. Free some browser storage, then reload.'
            : 'Your previously saved data could not be opened, so Equanim is starting fresh. The unreadable copy was kept on this device, not deleted, and can be downloaded from Settings and Data.'}
        </p>
      )}
      <section aria-labelledby="wel-h">
        <p className="eyebrow mb-3">Welcome to Equanim</p>
        <h1 id="wel-h" className="text-[32px] leading-tight font-semibold">Respond, rather than react. A little more often.</h1>
        <p className="mt-4 text-[17px] text-muted">A six-week programme of short daily sessions: noticing the meaning you add to events, checking assumptions, speaking with care, and doing your best without demanding perfection.</p>
        <ul className="mt-6 space-y-3 text-[15.5px]" aria-label="At a glance">
          <li className="flex gap-3 items-center"><CalendarDays size={20} className="text-accent shrink-0" aria-hidden="true" />6 weeks</li>
          <li className="flex gap-3 items-center"><Clock size={20} className="text-accent shrink-0" aria-hidden="true" />{DAILY_SHORT}</li>
          <li className="flex gap-3 items-center"><Lock size={20} className="text-accent shrink-0" aria-hidden="true" />Private on your device: no account, no tracking</li>
        </ul>
        <p className="mt-6 text-sm text-muted">Day 0 takes about 10 minutes: you choose three values and rate where you are starting from.</p>
      </section>
    </StepShell>
  );
}
