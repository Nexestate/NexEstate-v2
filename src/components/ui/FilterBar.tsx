import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from './Input';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search,
  onSearchChange,
  placeholder = 'חיפוש...',
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute inset-y-0 end-3 h-4 w-4 self-center text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pe-10"
        />
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
