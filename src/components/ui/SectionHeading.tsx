import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        <h3 className="text-section-title">{title}</h3>
        {description && <p className="text-meta mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
