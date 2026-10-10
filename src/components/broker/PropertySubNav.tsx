import { Activity, Building2, CreditCard, FileSignature, FileText, Home, Users, Wrench } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { isPropertySubNavActive, propertySubNavUrl, type PropertySubNavSection } from '../../lib/propertyNav';
import { cn } from '../../lib/utils';

const TABS: { id: PropertySubNavSection; label: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'סקירה', icon: Building2 },
  { id: 'units', label: 'יחידות', icon: Home },
  { id: 'tenants', label: 'שוכרים', icon: Users },
  { id: 'agreements', label: 'הסכם', icon: FileSignature },
  { id: 'documents', label: 'מסמכים', icon: FileText },
  { id: 'payments', label: 'תשלומים', icon: CreditCard },
  { id: 'maintenance', label: 'תחזוקה', icon: Wrench },
  { id: 'activity', label: 'פעילות', icon: Activity },
];

interface PropertySubNavProps {
  propertyId: string;
  className?: string;
}

export function PropertySubNav({ propertyId, className }: PropertySubNavProps) {
  const { pathname, search } = useLocation();

  return (
    <nav
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/50 p-1',
        className,
      )}
      aria-label="ניווט נכס"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const to = propertySubNavUrl(id, propertyId);
        const active = isPropertySubNavActive(pathname, search, to, id === 'overview');
        return (
          <Link
            key={id}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
