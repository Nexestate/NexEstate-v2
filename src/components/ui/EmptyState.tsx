import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border/80 bg-card/40 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/25">
        <Icon className="h-8 w-8" />
      </div>
      <p className="text-section-title text-foreground">{title}</p>
      {description && <p className="text-meta mt-2 max-w-md">{description}</p>}
      {actionLabel && onAction && (
        <Button className="mt-6" size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
