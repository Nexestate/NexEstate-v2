import { Building2, CreditCard, Home, Users } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { isPropertySubNavActive, propertySubNavUrl, type PropertySubNavSection } from '../../lib/propertyNav';
import { cn } from '../../lib/utils';

const TABS: { id: PropertySubNavSection; label: string; icon: typeof Home }[] = [
  { id: 'overview', label: 'דף נכס', icon: Building2 },
  { id: 'units', label: 'יחידות', icon: Home },
  { id: 'tenants', label: 'שוכרים', icon: Users },
  { id: 'payments', label: 'תשלומים', icon: CreditCard },
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
        'flex flex-wrap gap-1 rounded-xl border border-border bg-card/50 p-1',
        className,
      )}
      aria-label="ניווט נכס"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const to = propertySubNavUrl(id, propertyId);
        const active = isPropertySubNavActive(pathname, search, to, id === 'overview');
        return (
          <NavLink
            key={id}
            to={to}
            className={cn(
              'inline-flex h-9 flex-1 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors sm:flex-none',
              active
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        );
      })}
    </nav>
  );
}
