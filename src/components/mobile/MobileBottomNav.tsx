import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileSignature,
  FileText,
  Gavel,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Search,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePropertyNavContext } from '../../hooks/usePropertyNavContext';
import { isPropertySubNavActive, propertyNavHref } from '../../lib/propertyNav';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

type NavVariant = 'broker' | 'buyer' | 'admin' | 'partner';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const BROKER_MAIN: NavItem[] = [
  { label: 'לוח בקרה', to: '/broker', icon: LayoutDashboard, end: true },
  { label: 'נכסים', to: '/broker/properties', icon: Building2 },
  { label: 'מכירות', to: '/broker/auctions', icon: Gavel },
  { label: 'התראות', to: '/broker/notifications', icon: Bell },
];

const BROKER_MORE: NavItem[] = [
  { label: 'שוכרים', to: '/broker/tenants', icon: Users },
  { label: 'תשלומים', to: '/broker/payments', icon: CreditCard },
  { label: 'לקוחות', to: '/broker/clients', icon: Users },
  { label: 'משימות', to: '/broker/tasks', icon: ClipboardList },
  { label: 'הגדרות', to: '/broker/settings', icon: Settings },
];

function buildPropertyNav(propertyId: string): { main: NavItem[]; more: NavItem[] } {
  return {
    main: [
      { label: 'דף נכס', to: propertyNavHref(propertyId, 'overview'), icon: Building2, end: true },
      { label: 'יחידות', to: propertyNavHref(propertyId, 'units'), icon: Home },
      { label: 'שוכרים', to: propertyNavHref(propertyId, 'tenants'), icon: Users },
      { label: 'תשלומים', to: propertyNavHref(propertyId, 'payments'), icon: CreditCard },
    ],
    more: [
      { label: 'הסכם', to: propertyNavHref(propertyId, 'agreements'), icon: FileSignature },
      { label: 'מסמכים', to: propertyNavHref(propertyId, 'documents'), icon: FileText },
      { label: 'תחזוקה', to: propertyNavHref(propertyId, 'maintenance'), icon: Wrench },
      { label: 'פעילות', to: propertyNavHref(propertyId, 'activity'), icon: Activity },
      { label: 'לוח בקרה', to: '/broker', icon: LayoutDashboard, end: true },
      { label: 'כל הנכסים', to: '/broker/properties', icon: Building2 },
      { label: 'לקוחות', to: '/broker/clients', icon: Users },
      { label: 'משימות', to: '/broker/tasks', icon: ClipboardList },
      { label: 'הגדרות', to: '/broker/settings', icon: Settings },
    ],
  };
}

const BUYER_MAIN: NavItem[] = [
  { label: 'לוח בקרה', to: '/buyer', icon: LayoutDashboard, end: true },
  { label: 'נכסים', to: '/buyer/shared', icon: Building2 },
  { label: 'חיפוש', to: '/buyer/search', icon: Search },
  { label: 'התראות', to: '/buyer/notifications', icon: Bell },
];

const BUYER_MORE: NavItem[] = [
  { label: 'מועדפים', to: '/buyer/favorites', icon: Heart },
  { label: 'הגדרות', to: '/buyer/settings', icon: Settings },
];

const ADMIN_MAIN: NavItem[] = [
  { label: 'לוח בקרה', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'משתמשים', to: '/admin/users', icon: Users },
  { label: 'נכסים', to: '/admin/properties', icon: Building2 },
  { label: 'התראות', to: '/admin/notifications', icon: Bell },
];

const ADMIN_MORE: NavItem[] = [
  { label: 'שיתופים', to: '/admin/shares', icon: Building2 },
  { label: 'תמיכה', to: '/admin/support', icon: ClipboardList },
  { label: 'ייבוא', to: '/admin/import', icon: FileText },
  { label: 'ממתינים', to: '/admin/pending', icon: ClipboardList },
  { label: 'הגדרות', to: '/admin/settings', icon: Settings },
];

const PARTNER_MAIN: NavItem[] = [
  { label: 'לוח בקרה', to: '/broker', icon: LayoutDashboard, end: true },
  { label: 'נכסים', to: '/broker/properties', icon: Building2 },
  { label: 'התראות', to: '/broker/notifications', icon: Bell },
];

const PARTNER_MORE: NavItem[] = [
  { label: 'הגדרות', to: '/broker/settings', icon: Settings },
];

const CONFIG: Record<NavVariant, { main: NavItem[]; more?: NavItem[] }> = {
  broker: { main: BROKER_MAIN, more: BROKER_MORE },
  buyer: { main: BUYER_MAIN, more: BUYER_MORE },
  admin: { main: ADMIN_MAIN, more: ADMIN_MORE },
  partner: { main: PARTNER_MAIN, more: PARTNER_MORE },
};

interface MobileBottomNavProps {
  variant: NavVariant;
}

function isNavItemActive(item: NavItem, pathname: string, search: string): boolean {
  return isPropertySubNavActive(pathname, search, item.to, item.end);
}

export function MobileBottomNav({ variant }: MobileBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const propertyId = usePropertyNavContext();

  const config = useMemo(() => {
    if (variant === 'broker' && propertyId) {
      return buildPropertyNav(propertyId);
    }
    return CONFIG[variant];
  }, [variant, propertyId]);

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname, location.search]);

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="סגור"
          className="fixed inset-0 z-40 overlay-blur lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && config.more && (
        <div className="fixed inset-x-4 bottom-20 z-50 rounded-3xl border border-border/90 bg-detail-panel p-5 shadow-2xl lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">עוד</span>
            <button type="button" onClick={() => setMoreOpen(false)} className="text-muted-foreground">
              ✕
            </button>
          </div>
          <ul className="grid grid-cols-3 gap-2">
            {config.more.map((item) => {
              const Icon = item.icon;
              const active = isNavItemActive(item, location.pathname, location.search);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs hover:bg-muted',
                      active && 'bg-primary/10 text-primary',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-primary')} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <hr className="my-3 border-border" />
          <button
            type="button"
            onClick={() => {
              signOut();
              navigate('/login');
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-muted"
          >
            <LogOut className="h-5 w-5" />
            התנתקות
          </button>
        </div>
      )}

      <nav
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 border-t border-border/90 bg-detail-panel/95 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md lg:hidden',
          'pb-[max(0.5rem,env(safe-area-inset-bottom))]',
        )}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {config.main.map((item) => {
            const Icon = item.icon;
            const active = isNavItemActive(item, location.pathname, location.search);
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-xs touch-manipulation',
                  active ? 'rounded-xl bg-primary/15 text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {config.more && (
            <Button
              variant="ghost"
              size="sm"
              className="flex h-auto min-h-11 flex-col items-center gap-0.5 py-1.5 text-xs text-muted-foreground"
              onClick={() => setMoreOpen(true)}
            >
              <MoreHorizontal className="h-5 w-5" />
              עוד
            </Button>
          )}
        </div>
      </nav>
    </>
  );
}
