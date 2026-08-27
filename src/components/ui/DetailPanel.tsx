import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}

interface DetailPanelProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DetailPanel({ children, actions, className }: DetailPanelProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div className="divide-y divide-border rounded-xl border border-border bg-muted/20 px-4 py-1">
        {children}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
