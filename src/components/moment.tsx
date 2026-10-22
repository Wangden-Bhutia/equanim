import { Check } from 'lucide-react';
import { Confirmation } from './Confirmation';

/**
 * A calm, brief completion moment: a check that draws in (600 ms or less) and one short sentence. With reduced
 * motion, text only. `large` restates the week's key idea after a weekly review and after Week 6.
 */
export function CompletionMoment({ title, line, idea, focus = true, large = false }: { title: string; line: string; idea?: string; focus?: boolean; large?: boolean }) {
  return (
    <div className={`completion-moment ${large ? 'text-center py-2' : ''}`} data-testid="completion-moment">
      <div className={`flex items-center gap-2 ${large ? 'flex-col' : ''}`}>
        <span className={`moment-icon inline-flex items-center justify-center rounded-full bg-accentsoft text-accent ${large ? 'w-12 h-12' : 'w-8 h-8'}`} aria-hidden="true">
          <Check size={large ? 26 : 18} strokeWidth={2.5} className="check-draw" />
        </span>
        <Confirmation focus={focus} className={`font-semibold text-accent ${large ? 'font-serif text-[22px]' : ''}`}>{title}</Confirmation>
      </div>
      <p className={`text-[16px] mt-2 ${large ? '' : ''}`}>{line}</p>
      {idea && <p className="font-serif text-[18px] mt-3 leading-snug" data-testid="moment-idea">{idea}</p>}
    </div>
  );
}
