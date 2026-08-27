import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from './Badge';

interface DetailPanelProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: 'success' | 'warning' | 'outline' | 'primary' | 'destructive' };
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DetailPanel({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
}: DetailPanelProps) {
  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold leading-tight">{title}</h3>
              {badge && <Badge variant={badge.variant ?? 'outline'}>{badge.label}</Badge>}
            </div>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

interface DetailSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-muted/20 p-4', className)}>
      {title && <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

export function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-end text-sm font-medium">{value ?? '—'}</span>
    </div>
  );
}
