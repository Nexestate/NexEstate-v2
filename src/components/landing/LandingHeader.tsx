import { ChevronDown, Heart, LogIn, Menu, Moon, Plus, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { Logo } from '../layout/Logo';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

const NAV_LINKS = [
  { to: '/market', label: 'שוק נכסים' },
  {
    label: 'המכירות',
    children: [
      { to: '/auctions', label: 'מכירות פומביות' },
      { to: '/deals', label: 'עסקאות אחרונות' },
    ],
  },
  { to: '/players', label: 'שחקני שוק' },
  { to: '/deals', label: 'מפת עסקאות' },
  { to: '/opportunities', label: 'הזדמנויות' },
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
      <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 lg:h-16 lg:gap-4 lg:px-6">
        <Logo size="sm" className="shrink-0" />

        <nav className="hidden min-w-0 items-center justify-center lg:flex">
          <ul className="flex items-center gap-0.5 whitespace-nowrap xl:gap-1">
            {NAV_LINKS.map((item) =>
              'children' in item && item.children ? (
                <li key={item.label} className="relative">
                  <button
                    type="button"
                    onClick={() => setSalesOpen(!salesOpen)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors xl:px-2.5 xl:text-sm',
                      salesOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                    <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', salesOpen && 'rotate-180')} />
                  </button>
                  {salesOpen && (
                    <>
                      <button type="button" className="fixed inset-0 z-40" onClick={() => setSalesOpen(false)} aria-label="סגור" />
                      <div className="absolute start-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-border/60 bg-card/95 py-1 shadow-2xl backdrop-blur-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => setSalesOpen(false)}
                            className="block px-4 py-2.5 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </li>
              ) : (
                <li key={item.to}>
                  <Link
                    to={item.to!}
                    className={cn(
                      'inline-block rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors xl:px-2.5 xl:text-sm',
                      isActive(item.to!) ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-8 w-8 place-items-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:grid"
            aria-label="החלף ערכת נושא"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <Link
            to="/login"
            className="hidden h-8 w-8 place-items-center rounded-full border border-border/50 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground md:grid"
            aria-label="מועדפים"
          >
            <Heart className="h-3.5 w-3.5" />
          </Link>
          <Link to="/login" className="hidden md:block">
            <Button size="sm" className="h-8 rounded-full px-3.5 text-xs shadow-lg shadow-primary/25 lg:h-9 lg:px-4 lg:text-sm">
              <LogIn className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">התחברות/הרשמה</span>
              <span className="xl:hidden">התחברות</span>
            </Button>
          </Link>
          <Link to="/register" className="hidden sm:block">
            <Button variant="success" size="sm" className="h-8 rounded-full px-3.5 text-xs shadow-lg shadow-success/25 lg:h-9 lg:px-4 lg:text-sm">
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden xl:inline">פרסם מודעה</span>
              <span className="xl:hidden">פרסם</span>
            </Button>
          </Link>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 lg:hidden"
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
            {NAV_LINKS.map((item) =>
              'children' in item && item.children ? (
                <div key={item.label}>
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground">{item.label}</p>
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.to}
                  to={item.to!}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm hover:bg-white/5"
                >
                  {item.label}
                </Link>
              ),
            )}
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
