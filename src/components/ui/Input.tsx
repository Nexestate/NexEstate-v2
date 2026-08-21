import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, iconPosition = 'end', id, ...props }, ref) => {
    const inputId = id ?? label?.replace(/\s/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'end' && (
            <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-muted-foreground">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm',
              'text-foreground placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              icon && iconPosition === 'end' && 'pe-10',
              icon && iconPosition === 'start' && 'ps-10',
              error && 'border-destructive',
              className,
            )}
            {...props}
          />
          {icon && iconPosition === 'start' && (
            <span className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-muted-foreground">
              {icon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
