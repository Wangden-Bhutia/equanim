import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, PenLine } from 'lucide-react';
import type { Choice } from '../data/programme';
import { SAFETY_LINE } from '../data/programme';
import type { SessionMode } from '../types';

/** "Week 1 · Day 3 of 42" with a thin bar showing how much of the path is behind you. */
export function ProgrammeChip({ label, progress }: { label: string; progress: number }) {
  const pct = Math.round(progress * 100);
  return (
    <div className="inline-flex flex-col gap-1.5 min-w-[180px]">
      <span className="inline-flex self-start items-center rounded-full bg-accentsoft text-ink px-3 py-1 text-[13px] font-semibold">{label}</span>
      <div className="h-1 rounded-full bg-line overflow-hidden" role="progressbar" aria-label="Programme progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function SafetyFooter({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[13px] text-muted ${className}`}>
      {SAFETY_LINE} <Link to="/about" className="underline underline-offset-2">About Equanim</Link> · <Link to="/privacy" className="underline underline-offset-2">Privacy</Link>
    </p>
  );
}

/** Every session can be thought through or written down. Writing is optional, never required to complete. */
export function ModeToggle({ mode, onChange }: { mode: SessionMode; onChange: (m: SessionMode) => void }) {
  const opts: { id: SessionMode; label: string; Icon: typeof Brain }[] = [
    { id: 'think', label: 'Think it through', Icon: Brain },
    { id: 'write', label: 'Write it down', Icon: PenLine },
  ];
  return (
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="sr-only">How would you like to do this session?</legend>
      {opts.map(({ id, label, Icon }) => (
        <label key={id} className={`flex items-center justify-center gap-2 cursor-pointer rounded-xl border min-h-[44px] px-3 text-[14.5px] font-medium ${mode === id ? 'border-accent bg-accentsoft text-ink' : 'border-line text-ink'}`}>
          <input type="radio" name="session-mode" value={id} checked={mode === id} onChange={() => onChange(id)} className="sr-only" />
          <Icon size={17} aria-hidden="true" />{label}
        </label>
      ))}
    </fieldset>
  );
}

/** A multiple-choice item with feedback on every option. Any option can be explored; the first pick is reported. */
export function ChoiceItem({ id, situation, question, options, answerId, onChoose, initial }: {
  id: string; situation?: string; question: string; options: Choice[]; answerId: string; onChoose?: (optionId: string, correct: boolean) => void; initial?: string;
}) {
  const [picked, setPicked] = useState<string | null>(initial ?? null);
  const chosen = options.find((o) => o.id === picked);
  return (
    <fieldset className="card" aria-describedby={situation ? `${id}-sit` : undefined}>
      {situation && <p id={`${id}-sit`} className="text-[15px] mb-2">{situation}</p>}
      <legend className="font-semibold text-[16px] float-left w-full mb-3">{question}</legend>
      <div className="space-y-2 clear-both">
        {options.map((o) => (
          <label key={o.id} className={`block cursor-pointer rounded-xl border px-4 py-2.5 min-h-[44px] text-[14.5px] ${picked === o.id ? 'border-accent bg-accentsoft' : 'border-line'}`}>
            <input type="radio" name={id} value={o.id} checked={picked === o.id} className="sr-only"
              onChange={() => { if (picked === null) onChoose?.(o.id, o.id === answerId); setPicked(o.id); }} />
            {o.text}
          </label>
        ))}
      </div>
      <div aria-live="polite">
        {chosen && (
          <p className={`mt-3 rounded-xl p-3 text-[14.5px] ${chosen.id === answerId ? 'bg-accentsoft' : 'bg-surface2'}`}>
            <span className="font-semibold">{chosen.id === answerId ? 'Closest fit. ' : 'Worth a second look. '}</span>{chosen.feedback}
          </p>
        )}
      </div>
    </fieldset>
  );
}

export function StepShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col mx-auto max-w-app px-6 pt-8 pb-8">
      <div className="mb-8"><span className="font-serif text-xl font-semibold">Equanim</span></div>
      <main id="main" className="flex-1">{children}</main>
      {footer && <div className="mt-8">{footer}</div>}
    </div>
  );
}
