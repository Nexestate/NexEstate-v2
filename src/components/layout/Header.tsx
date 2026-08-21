import { Bell, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface HeaderProps {
  subtitle?: string;
  onMenuClick?: () => void;
  notificationsPath?: string;
  className?: string;
}

export function Header({
  subtitle = 'הנה סקירה של מה קורה אצלך',
  onMenuClick,
  notificationsPath = '/broker/notifications',
  className,
}: HeaderProps) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(' ')[0] ?? 'משתמש';

  return (
    <header className={cn('flex items-center justify-between gap-4 pb-6', className)}>
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">שלום, {firstName}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Link to={notificationsPath}>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
      </Link>
    </header>
  );
}
