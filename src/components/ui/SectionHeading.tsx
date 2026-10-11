import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-border/60 pb-4', className)}>
      <div>
        <h3 className="text-page-title">{title}</h3>
        {description && <p className="text-meta mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
