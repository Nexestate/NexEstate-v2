import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'> & { id?: string }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastVariant, string> = {
  success: 'border-success/50 bg-detail-panel text-foreground shadow-lg shadow-success/10',
  error: 'border-destructive/50 bg-detail-panel text-foreground shadow-lg shadow-destructive/10',
  info: 'border-primary/50 bg-detail-panel text-foreground shadow-lg shadow-primary/10',
  warning: 'border-warning/50 bg-detail-panel text-foreground shadow-lg shadow-warning/10',
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-destructive',
  info: 'text-primary',
  warning: 'text-warning',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (item: Omit<ToastItem, 'id'> & { id?: string }) => {
      const id = item.id ?? `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-3), { ...item, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex flex-col gap-2 sm:inset-x-auto sm:start-6 sm:bottom-6 sm:w-96"
        aria-live="polite"
      >
        {items.map((item) => {
          const Icon = ICONS[item.variant];
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto flex gap-3 rounded-2xl border px-5 py-4 shadow-xl',
                STYLES[item.variant],
              )}
              role="status"
            >
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', ICON_STYLES[item.variant])} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{item.title}</p>
                {item.description && <p className="text-meta mt-0.5">{item.description}</p>}
              </div>
              <button
                type="button"
                aria-label="סגור"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                onClick={() => dismiss(item.id)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
