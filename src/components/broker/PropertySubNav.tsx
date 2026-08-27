import { Link, useLocation } from 'react-router-dom';
import {
  PROPERTY_NAV_ITEMS,
  isPropertyNavActive,
  propertyNavHref,
  type PropertyNavTab,
} from '../../lib/propertyNav';
import { cn } from '../../lib/utils';

interface PropertySubNavProps {
  propertyId: string;
  className?: string;
}

export function PropertySubNav({ propertyId, className }: PropertySubNavProps) {
  const { pathname, search } = useLocation();

  return (
    <nav
      className={cn('flex flex-wrap gap-2 border-b border-border pb-1', className)}
      aria-label="ניווט נכס"
    >
      {PROPERTY_NAV_ITEMS.map((item) => {
        const active = isPropertyNavActive(item.id, pathname, search);
        const href = propertyNavHref(propertyId, item.id);

        if (item.id === 'overview') {
          return (
            <TabLink key={item.id} to={href} active={active} tab={item.id}>
              {item.label}
            </TabLink>
          );
        }

        return (
          <TabLink key={item.id} to={href} active={active} tab={item.id}>
            {item.label}
          </TabLink>
        );
      })}
    </nav>
  );
}

function TabLink({
  to,
  active,
  children,
}: {
  to: string;
  active: boolean;
  tab: PropertyNavTab;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-b-2 border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
