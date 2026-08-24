import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({ to, label = 'חזרה', className }: BackButtonProps) {
  const navigate = useNavigate();

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary',
          className,
        )}
      >
        <ArrowRight className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('-me-2 gap-1.5 px-2 text-muted-foreground hover:text-primary', className)}
      onClick={() => navigate(-1)}
    >
      <ArrowRight className="h-4 w-4" />
      {label}
    </Button>
  );
}
