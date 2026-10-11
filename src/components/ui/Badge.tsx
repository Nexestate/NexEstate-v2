import { cn } from '../../lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'outline' | 'primary';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'border border-border bg-muted text-muted-foreground',
  success: 'border border-success/45 bg-success/20 text-success',
  warning: 'border border-warning/45 bg-warning/20 text-warning',
  destructive: 'border border-destructive/45 bg-destructive/20 text-destructive',
  outline: 'border border-border bg-transparent text-muted-foreground',
  primary: 'border border-primary/45 bg-primary/20 text-primary',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
