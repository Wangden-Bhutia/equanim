import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { DOMAINS } from '../data/domains';
import { LEGACY_OUTCOME_LABELS, LEGACY_NOTE_LABEL, type DomainId, type LegacyOutcome } from '../types';

export function PageHeader({ title, eyebrow, intro, back }: { title: string; eyebrow?: string; intro?: ReactNode; back?: string | true }) {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      {back && (
        typeof back === 'string' ? (
          <Link to={back} className="btn-ghost !px-0 -ml-1 mb-2 text-sm"><ChevronLeft size={18} aria-hidden="true" />Back</Link>
        ) : (
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost !px-0 -ml-1 mb-2 text-sm"><ChevronLeft size={18} aria-hidden="true" />Back</button>
        )
      )}
      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      <h1 className="text-[28px] leading-tight font-semibold">{title}</h1>
      {intro && <div className="mt-2 text-muted">{intro}</div>}
    </div>
  );
}

const DOT: Record<DomainId, string> = { speech: 'bg-speech', personalisation: 'bg-personalisation', inquiry: 'bg-inquiry', effort: 'bg-effort' };

export function DomainTag({ domain, className = '' }: { domain: DomainId; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted ${className}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[domain]}`} aria-hidden="true" />
      {DOMAINS[domain].name}
    </span>
  );
}

export function EmptyState({ title, children, action, level = 2 }: { title: string; children?: ReactNode; action?: ReactNode; level?: 1 | 2 }) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <div className="card text-center py-8">
      <H className="text-xl font-semibold">{title}</H>
      {children && <div className="mt-2 text-muted">{children}</div>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

let dialogSeq = 0;

/** Modal dialog: focus moves in, Tab stays inside, Escape closes, focus returns to the opener. */
export function Dialog({ open, title, onClose, children, footer }: { open: boolean; title: string; onClose: () => void; children?: ReactNode; footer: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const ids = useRef<{ t: string; d: string } | null>(null);
  if (!ids.current) { dialogSeq += 1; ids.current = { t: `dlg-${dialogSeq}-t`, d: `dlg-${dialogSeq}-d` }; }
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])') ?? []);
    (ref.current?.querySelector<HTMLElement>('input, textarea') ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0]!, last = f[f.length - 1]!;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={ids.current.t} aria-describedby={ids.current.d}
        className="card w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 id={ids.current.t} className="text-xl font-semibold">{title}</h2>
        <div id={ids.current.d} className="mt-2 text-muted text-[15px]">{children}</div>
        <div className="mt-5 flex flex-wrap gap-3 justify-end">{footer}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, title, children, confirmLabel, onConfirm, onCancel, danger = false, confirmDisabled = false,
}: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; confirmDisabled?: boolean;
}) {
  return (
    <Dialog open={open} title={title} onClose={onCancel} footer={
      <>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
      </>
    }>{children}</Dialog>
  );
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return <div className="prose-eq text-[16.5px]">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>;
}

/** Shows an Equanim 1.0 intention check-in exactly as it was recorded. */
export function LegacyCheckIn({ value }: { value: { outcome: LegacyOutcome; note: string } }) {
  return (
    <div className="text-[15px]">
      <p className="text-muted text-[13px]">Intention check-in (Equanim 1.0)</p>
      <p>{LEGACY_OUTCOME_LABELS[value.outcome]}</p>
      {value.note && (
        <>
          <p className="text-muted text-[13px] mt-1">{LEGACY_NOTE_LABEL}</p>
          <p className="whitespace-pre-wrap break-words">{value.note}</p>
        </>
      )}
    </div>
  );
}
