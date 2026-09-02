import {
  BadgeCheck,
  Calculator,
  Calendar,
  ChevronDown,
  HardHat,
  Heart,
  LayoutDashboard,
  LayoutGrid,
  LogIn,
  Map,
  Menu,
  Moon,
  Plus,
  Scale,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath } from '../../lib/roles';
import { cn } from '../../lib/utils';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from '../layout/Logo';
import { Button } from '../ui/Button';

type DropdownId = 'sales' | 'players';

interface NavChild {
  to: string;
  label: string;
  icon: typeof Calendar;
}

interface NavItem {
  to?: string;
  label: string;
  icon: typeof LayoutGrid;
  dropdown?: DropdownId;
  children?: NavChild[];
}

const NAV_LINKS: NavItem[] = [
  { to: '/market', label: 'שוק נכסים', icon: LayoutGrid },
  {
    label: 'המכירות',
    icon: Sparkles,
    dropdown: 'sales',
    children: [
      { to: '/auctions', label: 'מכירות קרובות', icon: Calendar },
      { to: '/deals?status=ended', label: 'מכירות שהסתיימו', icon: BadgeCheck },
      { to: '/players?type=sellers', label: 'רשימת המוכרים', icon: Users },
    ],
  },
  {
    label: 'שחקני שוק',
    icon: Users,
    dropdown: 'players',
    children: [
      { to: '/players?type=receivers', label: 'כונסי נכסים', icon: Scale },
      { to: '/players?type=brokers', label: 'מתווכים', icon: Users },
      { to: '/players?type=developers', label: 'יזמים/קבלנים', icon: HardHat },
    ],
  },
  { to: '/deals', label: 'מפת עסקאות', icon: Map },
  { to: '/opportunities', label: 'הזדמנויות', icon: Target },
  { to: '/calculator', label: 'מחשבון תשואה', icon: Calculator },
  { to: '/prices', label: 'מחירים', icon: TrendingUp },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<DropdownId | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  const favoritesHref = user?.role === 'buyer' ? '/buyer/favorites' : '/login';
  const dashboardHref = user ? getDashboardPath(user.role) : '/login';

  const isActive = (to: string) => {
    const base = to.split('?')[0];
    return pathname === base || pathname.startsWith(`${base}/`);
  };

  const toggleDropdown = (id: DropdownId) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl" dir="rtl">
      <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 lg:h-16 lg:gap-4 lg:px-6">
        <Logo size="sm" className="shrink-0" />

        <nav className="hidden min-w-0 items-center justify-center lg:flex">
          <ul className="flex items-center gap-0.5 whitespace-nowrap xl:gap-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              if (item.children && item.dropdown) {
                const isOpen = openDropdown === item.dropdown;
                return (
                  <li key={item.label} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleDropdown(item.dropdown!)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors xl:px-2.5 xl:text-sm',
                        isOpen ? 'text-primary' : 'text-foreground/80 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-80" />
                      {item.label}
                      <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <>
                        <button
                          type="button"
                          className="fixed inset-0 z-40"
                          onClick={() => setOpenDropdown(null)}
                          aria-label="סגור"
                        />
                        <div className="nav-dropdown absolute start-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-xl border border-primary/20 bg-card py-1.5 shadow-2xl">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.to}
                                to={child.to}
                                onClick={() => setOpenDropdown(null)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                              >
                                <ChildIcon className="h-4 w-4 shrink-0 text-primary/70" />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </li>
                );
              }
              return (
                <li key={item.to}>
                  <Link
                    to={item.to!}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold transition-colors xl:px-2.5 xl:text-sm',
                      isActive(item.to!) ? 'text-primary' : 'text-foreground/80 hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:grid"
            aria-label="החלף ערכת נושא"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            to={favoritesHref}
            className="hidden h-8 w-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground md:grid"
            aria-label="מועדפים"
          >
            <Heart className="h-3.5 w-3.5" />
          </Link>
          {!loading && user ? (
            <Link to={dashboardHref} className="hidden md:block">
              <Button size="sm" className="h-8 rounded-full px-3.5 text-xs shadow-lg shadow-primary/25 lg:h-9 lg:px-4 lg:text-sm">
                <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xl:inline">לדשבורד</span>
                <span className="xl:hidden">דשבורד</span>
              </Button>
            </Link>
          ) : (
            <Link to="/login" className="hidden md:block">
              <Button size="sm" className="h-8 rounded-full px-3.5 text-xs shadow-lg shadow-primary/25 lg:h-9 lg:px-4 lg:text-sm">
                <LogIn className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden xl:inline">התחברות/הרשמה</span>
                <span className="xl:hidden">התחברות</span>
              </Button>
            </Link>
          )}
          <Link to="/register" className="hidden sm:block">
            <Button variant="success" size="sm" className="h-8 rounded-full px-3.5 text-xs shadow-lg shadow-success/25 lg:h-9 lg:px-4 lg:text-sm">
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">פרסם מודעה</span>
              <span className="xl:hidden">פרסם</span>
            </Button>
          </Link>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/60 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background/95 px-4 py-4 backdrop-blur-xl lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              if (item.children) {
                return (
                  <div key={item.label}>
                    <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </p>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50"
                        >
                          <ChildIcon className="h-4 w-4 text-primary" />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to!}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/50"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {!loading && user ? (
              <Link to={dashboardHref} onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full">
                  <LayoutDashboard className="h-4 w-4" />
                  לדשבורד
                </Button>
              </Link>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full">התחברות/הרשמה</Button>
              </Link>
            )}
            <Link to="/register" onClick={() => setMobileOpen(false)}>
              <Button variant="success" className="w-full rounded-full">פרסם מודעה</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
