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
    <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
      <CardContent className="flex items-center gap-4 py-5 lg:py-6">
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ring-white/10"
          style={{ backgroundColor: `${color}28`, color }}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <div className="text-value">{value}</div>
          <div className="text-meta mt-0.5">{label}</div>
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
    <div className={cn('grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6', className)}>
      {children}
    </div>
  );
}
