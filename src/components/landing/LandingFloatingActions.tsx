import { Accessibility, ChevronUp, Minus, MousePointer2, Plus, RotateCcw, Type, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { cn } from '../../lib/utils';

function TogglePill({ active, label }: { active: boolean; label?: string }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
        active ? 'bg-primary/20 text-primary' : 'bg-muted/60 text-muted-foreground',
      )}
    >
      {label ?? (active ? 'פעיל' : 'כבוי')}
    </span>
  );
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    setTextScale,
    toggleHighContrast,
    toggleLargeCursor,
    toggleReduceMotion,
    resetSettings,
  } = useAccessibility();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const rows = [
    {
      id: 'text',
      icon: Type,
      label: 'גודל טקסט',
      control: (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="הקטן טקסט"
            onClick={() => setTextScale(settings.textScale - 10)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3rem] text-center text-sm font-semibold text-foreground">
            {settings.textScale}%
          </span>
          <button
            type="button"
            aria-label="הגדל טקסט"
            onClick={() => setTextScale(settings.textScale + 10)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: 'contrast',
      icon: Accessibility,
      label: 'ניגודיות גבוהה',
      onClick: toggleHighContrast,
      active: settings.highContrast,
    },
    {
      id: 'cursor',
      icon: MousePointer2,
      label: 'סמן גדול',
      onClick: toggleLargeCursor,
      active: settings.largeCursor,
    },
    {
      id: 'motion',
      icon: RotateCcw,
      label: 'הפחתת אנימציות',
      onClick: toggleReduceMotion,
      active: settings.reduceMotion,
    },
  ] as const;

  return (
    <div ref={panelRef} className="fixed bottom-6 end-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="a11y-panel w-[min(100vw-2rem,320px)] overflow-hidden rounded-2xl border border-primary/25 bg-card/95 shadow-2xl shadow-primary/10 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <h2 className="text-sm font-bold">נגישות</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="סגור"
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="divide-y divide-border/40">
            {rows.map((row) => {
              const Icon = row.icon;
              if ('control' in row) {
                return (
                  <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{row.label}</span>
                    </div>
                    {row.control}
                  </div>
                );
              }
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={row.onClick}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{row.label}</span>
                  </div>
                  <TogglePill active={row.active} />
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/50 p-3">
            <button
              type="button"
              onClick={resetSettings}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              איפוס הגדרות
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        className={cn(
          'floating-action-btn grid h-12 w-12 place-items-center rounded-full border-2 transition-all',
          open
            ? 'border-primary bg-primary/15 text-primary shadow-lg shadow-primary/25'
            : 'border-primary/60 bg-card/90 text-primary hover:border-primary hover:bg-primary/10',
        )}
      >
        <Accessibility className="h-5 w-5" />
      </button>
    </div>
  );
}

export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const { settings } = useAccessibility();

  useEffect(() => {
    const onScroll = () => {
      const threshold = document.documentElement.scrollHeight * 0.25;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: settings.reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="גלילה לראש העמוד"
      className={cn(
        'floating-action-btn fixed bottom-[5.5rem] end-6 z-50 grid h-12 w-12 place-items-center rounded-full border-2 border-primary/60 bg-card/90 text-primary shadow-lg transition-all duration-300 hover:border-primary hover:bg-primary/10',
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
      )}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
