import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadNotifications } from '../../hooks/useUnreadNotifications';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface HeaderProps {
  subtitle?: string;
  onMenuClick?: () => void;
  notificationsPath?: string;
  className?: string;
}

export function Header({
  subtitle = 'מה דורש את תשומת הלב שלך עכשיו',
  onMenuClick,
  notificationsPath = '/broker/notifications',
  className,
}: HeaderProps) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] ?? 'משתמש';
  const unread = useUnreadNotifications(user?.id);

  return (
    <header className={cn('flex min-w-0 items-center justify-between gap-3 sm:gap-4', className)}>
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="outline" size="icon" className="lg:hidden" onClick={onMenuClick} aria-label="תפריט">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-display text-foreground">שלום, {firstName}</h1>
          <p className="text-meta mt-1 max-w-xl">{subtitle}</p>
        </div>
      </div>
      <Link to={notificationsPath} aria-label={unread > 0 ? `${unread} התראות שלא נקראו` : 'התראות'}>
        <Button
          variant="outline"
          size="icon"
          className={cn('relative border-border/80 bg-card/80', unread > 0 && 'border-destructive/40')}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -start-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white ring-2 ring-workspace">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </Link>
    </header>
  );
}
