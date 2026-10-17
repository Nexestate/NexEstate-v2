import { X } from 'lucide-react';
import { useEffect, useId } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'md' | 'lg' | 'xl' | 'drawer';
  /** When false, clicking the backdrop does not close the dialog. */
  closeOnBackdrop?: boolean;
}

const SIZE_CLASS: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  drawer:
    'max-w-lg sm:max-h-full sm:max-w-xl sm:ms-auto sm:me-0 sm:rounded-none sm:rounded-s-3xl sm:rounded-t-3xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  useBodyScrollLock(open);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {closeOnBackdrop ? (
        <button type="button" aria-label="סגור" className="absolute inset-0 overlay-blur" onClick={onClose} />
      ) : (
        <div className="absolute inset-0 overlay-blur" aria-hidden />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 flex max-h-[min(92dvh,100%)] w-full flex-col overflow-hidden rounded-t-3xl border border-border/90 bg-detail-panel shadow-2xl sm:rounded-3xl',
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-l before:from-primary before:to-success',
          SIZE_CLASS[size],
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-6 py-5 pt-6">
          <h2 id={titleId} className="text-section-title">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="סגור">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div data-modal-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
