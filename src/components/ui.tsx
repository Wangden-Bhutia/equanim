import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { DOMAINS } from '../data/domains';
import type { DomainId } from '../types';

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

export function ConfirmDialog({
  open, title, children, confirmLabel, onConfirm, onCancel, danger = false, confirmDisabled = false,
}: {
  open: boolean; title: string; children?: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; confirmDisabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dlg-title" className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 id="dlg-title" className="text-xl font-semibold">{title}</h2>
        <div className="mt-2 text-muted text-[15px]">{children}</div>
        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return <div className="prose-eq text-[16.5px]">{paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>;
}
