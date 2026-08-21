import { cn } from '../../lib/utils';

interface KanbanColumn<T> {
  id: string;
  title: string;
  color: string;
  items: T[];
}

interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  renderCard: (item: T) => React.ReactNode;
  onCardClick?: (item: T) => void;
  className?: string;
}

export function KanbanBoard<T extends { id: string }>({
  columns,
  renderCard,
  onCardClick,
  className,
}: KanbanBoardProps<T>) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4', className)}>
      {columns.map((col) => (
        <div key={col.id} className="min-w-[260px] flex-1 shrink-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-sm font-semibold">{col.title}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2 rounded-xl bg-muted/30 p-2 min-h-[200px]">
            {col.items.map((item) => (
              <div
                key={item.id}
                onClick={() => onCardClick?.(item)}
                className={cn(
                  'rounded-xl border border-border bg-card p-3 shadow-sm transition-colors',
                  onCardClick && 'cursor-pointer hover:border-primary/50',
                )}
              >
                {renderCard(item)}
              </div>
            ))}
            {col.items.length === 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">אין פריטים</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
