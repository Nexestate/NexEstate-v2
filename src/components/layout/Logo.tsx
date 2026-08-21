import { BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  showBeta?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className, showBeta = true, size = 'md' }: LogoProps) {
  const iconBox =
    size === 'sm' ? 'h-8 w-8 rounded-lg' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg';
  const iconSize = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const betaSize = size === 'lg' ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0';

  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn('grid shrink-0 place-items-center bg-primary text-white shadow-lg shadow-primary/30', iconBox)}>
        <BarChart3 className={iconSize} strokeWidth={2.5} />
      </span>
      <span className={cn('font-extrabold tracking-tight whitespace-nowrap', textSize)}>
        <span className="text-foreground">Nex</span>
        <span className="text-primary">Estate</span>
      </span>
      {showBeta && (
        <span className={cn('shrink-0 rounded-md bg-warning font-bold uppercase tracking-wide text-black', betaSize)}>
          BETA
        </span>
      )}
    </Link>
  );
}
