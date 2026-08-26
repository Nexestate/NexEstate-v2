import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

type NavLinkButtonVariant = 'outline' | 'ghost';

interface NavLinkButtonProps {
  to: string;
  onNavigate?: () => void;
  variant?: NavLinkButtonVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<NavLinkButtonVariant, string> = {
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'hover:bg-muted hover:text-foreground',
};

/** Link styled as a button — avoids invalid `<Link><button>` nesting. */
export function NavLinkButton({
  to,
  onNavigate,
  variant = 'outline',
  children,
  className,
}: NavLinkButtonProps) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
