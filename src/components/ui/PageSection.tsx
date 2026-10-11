import { cn } from '../../lib/utils';

interface PageSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Softer section without full card chrome */
  variant?: 'raised' | 'plain';
}

export function PageSection({ children, className, variant = 'raised' }: PageSectionProps) {
  return (
    <section
      className={cn(
        variant === 'raised' && 'dashboard-section',
        variant === 'plain' && 'space-y-5',
        className,
      )}
    >
      {children}
    </section>
  );
}
