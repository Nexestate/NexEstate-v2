import { cn } from '../../lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-xl bg-muted p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface ViewToggleProps {
  view: 'table' | 'kanban';
  onChange: (view: 'table' | 'kanban') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex rounded-lg border border-border">
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'px-3 py-1.5 text-sm',
          view === 'table' ? 'bg-primary text-white rounded-s-lg' : 'text-muted-foreground',
        )}
      >
        טבלה
      </button>
      <button
        type="button"
        onClick={() => onChange('kanban')}
        className={cn(
          'px-3 py-1.5 text-sm',
          view === 'kanban' ? 'bg-primary text-white rounded-e-lg' : 'text-muted-foreground',
        )}
      >
        קנבן
      </button>
    </div>
  );
}
