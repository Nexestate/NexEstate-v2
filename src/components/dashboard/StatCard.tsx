import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/Card';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  to?: string;
}

export function StatCard({ label, value, icon: Icon, color, to }: StatCardProps) {
  const content = (
    <Card className="transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="flex items-center gap-3 py-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

interface StatCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function StatCardGrid({ children, className }: StatCardGridProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6', className)}>
      {children}
    </div>
  );
}
