import { cn } from '../../lib/utils';

interface EntityLinkButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function EntityLinkButton({ children, className, disabled, onClick }: EntityLinkButtonProps) {
  if (disabled) {
    return <span className="text-muted-foreground">{children}</span>;
  }

  return (
    <button
      type="button"
      className={cn('text-primary hover:underline', className)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}