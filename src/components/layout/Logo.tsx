import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  showBeta?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="logo-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#logo-grad)" />
      <rect x="8" y="18" width="3.5" height="8" rx="1" fill="white" fillOpacity="0.9" />
      <rect x="14.25" y="13" width="3.5" height="13" rx="1" fill="white" />
      <rect x="20.5" y="8" width="3.5" height="18" rx="1" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

export function Logo({ className, showBeta = true, size = 'md' }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const betaSize = size === 'lg' ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0';

  return (
    <Link to="/" className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={cn('shrink-0 drop-shadow-[0_2px_8px_rgba(59,130,246,0.45)]', iconSize)} />
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
