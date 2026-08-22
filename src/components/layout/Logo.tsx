import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface LogoProps {
  className?: string;
  showBeta?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'onDark';
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
        <linearGradient id="nex-logo-grad" x1="6" y1="4" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#60a5fa" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5L28.5 9.75V22.25L16 29.5L3.5 22.25V9.75L16 2.5Z"
        fill="url(#nex-logo-grad)"
      />
      <rect x="9.5" y="17.5" width="2.8" height="7.5" rx="0.6" fill="white" fillOpacity="0.85" />
      <rect x="14.6" y="13.5" width="2.8" height="11.5" rx="0.6" fill="white" />
      <rect x="19.7" y="9.5" width="2.8" height="15.5" rx="0.6" fill="white" fillOpacity="0.95" />
    </svg>
  );
}

export function Logo({ className, showBeta = true, size = 'md', variant = 'default' }: LogoProps) {
  const iconSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const betaSize = size === 'lg' ? 'text-[11px] px-2 py-0.5' : 'text-[10px] px-1.5 py-0';
  const onDark = variant === 'onDark';

  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={cn('shrink-0 drop-shadow-[0_2px_10px_rgba(59,130,246,0.5)]', iconSize)} />
      <span className={cn('font-extrabold tracking-tight whitespace-nowrap', textSize)}>
        <span className={onDark ? 'text-white' : 'text-foreground'}>Nex</span>
        <span className={onDark ? 'text-[#60a5fa]' : 'text-primary'}>Estate</span>
      </span>
      {showBeta && (
        <span
          className={cn(
            'shrink-0 rounded-md bg-[#f59e0b] font-bold uppercase tracking-wide text-white',
            betaSize,
          )}
        >
          BETA
        </span>
      )}
    </Link>
  );
}
