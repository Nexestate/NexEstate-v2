import {
  ChevronDown,
  Heart,
  LayoutGrid,
  LogIn,
  Map,
  Menu,
  Moon,
  Plus,
  Sun,
  Target,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from '../layout/Logo';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/market', label: 'שוק נכסים', icon: LayoutGrid },
  {
    to: '/auctions',
    label: 'המכירות',
    icon: Target,
    children: [
      { to: '/auctions', label: 'מכירות פומביות' },
      { to: '/deals', label: 'עסקאות אחרונות' },
    ],
  },
  { to: '/players', label: 'שחקני שוק', icon: Users },
  { to: '/deals', label: 'מפת עסקאות', icon: Map },
  { to: '/opportunities', label: 'הזדמנויות', icon: Target },
];

const TEXT_LINKS = [
  { to: '/calculator', label: 'מחשבון תשואה' },
  { to: '/prices', label: 'מחירים' },
];

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { pathname } = useLocation();

  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/90 backdrop-blur-xl" dir="rtl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
        <Logo size="sm" className="shrink-0" />

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {NAV.map(({ to, label, icon: Icon, children }) =>
            children ? (
              <div key={label} className="relative">
                <button
                  type="button"
                  onClick={() => setSalesOpen(!salesOpen)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', salesOpen && 'rotate-180')} />
                </button>
                {salesOpen && (
                  <>
                    <button type="button" className="fixed inset-0 z-40" onClick={() => setSalesOpen(false)} aria-label="סגור" />
                    <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border bg-card py-1 shadow-xl">
                      {children.map((child) => (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => setSalesOpen(false)}
                          className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ),
          )}
          {TEXT_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'rounded-lg px-3 py-2 text-sm transition-colors',
                isActive(to) ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:grid"
            aria-label="החלף ערכת נושא"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link
            to="/login"
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:grid"
            aria-label="מועדפים"
          >
            <Heart className="h-4 w-4" />
          </Link>
          <Link to="/login" className="hidden md:block">
            <Button size="sm" className="rounded-full px-4 shadow-lg shadow-primary/25 lg:px-5">
              <LogIn className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">התחברות/הרשמה</span>
              <span className="lg:hidden">התחברות</span>
            </Button>
          </Link>
          <Link to="/register" className="hidden sm:block">
            <Button variant="success" size="sm" className="rounded-full px-4 shadow-lg shadow-success/25 lg:px-5">
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">פרסם מודעה</span>
              <span className="lg:hidden">פרסם</span>
            </Button>
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg border border-border lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="תפריט"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-primary" />
                {label}
              </Link>
            ))}
            {TEXT_LINKS.map(({ to, label }) => (
              <Link key={label} to={to} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted">
                {label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button className="w-full rounded-full">התחברות/הרשמה</Button>
            </Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}>
              <Button variant="success" className="w-full rounded-full">פרסם מודעה</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
