import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { cn } from '../../lib/utils';
import { Button } from './Button';

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function SlidePanel({ open, onClose, title, children, footer, className }: SlidePanelProps) {
  useBodyScrollLock(open);

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
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="סגור" className="absolute inset-0 overlay-blur" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="slide-panel-title"
        className={cn(
          'relative z-10 flex h-full w-full max-w-md flex-col border-s border-border/90 bg-detail-panel shadow-2xl',
          'before:absolute before:inset-y-0 before:start-0 before:w-1 before:bg-gradient-to-b before:from-primary before:to-success',
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/80 px-6 py-5">
          <h2 id="slide-panel-title" className="text-section-title">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="סגור">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
        {footer && <div className="shrink-0 border-t border-border/80 px-6 py-5">{footer}</div>}
      </aside>
    </div>
  );
}
