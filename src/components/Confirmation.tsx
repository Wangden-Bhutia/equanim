import { useEffect, useRef, type ReactNode } from 'react';

/**
 * A confirmation that replaces the control the user just pressed. When `focus` is true (the user caused it),
 * it takes keyboard focus so the user is not dropped at the top of the page, and screen readers read it.
 */
export function Confirmation({ focus, className, children }: { focus: boolean; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (focus) ref.current?.focus(); }, [focus]);
  return <p ref={ref} tabIndex={-1} role="status" className={`${className ?? ''} outline-none focus-visible:outline-2`}>{children}</p>;
}
