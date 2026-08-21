import { Bell, Check, Heart, Share2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DEMO_BUYER_NOTIFICATIONS } from '../../data/demoData';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const TYPE_ICONS: Record<string, typeof Bell> = {
  share: Share2,
  price: Tag,
  auction: Bell,
};

const SEVERITY_STYLES = {
  critical: 'border-destructive/30 bg-destructive/5',
  warning: 'border-warning/30 bg-warning/5',
  info: 'border-primary/30 bg-primary/5',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return 'לפני פחות משעה';
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'לפני יום' : `לפני ${days} ימים`;
}

const LINKS: Record<string, string> = {
  share: '/buyer/shared',
  price: '/buyer/favorites',
  auction: '/buyer/search',
};

export function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState(DEMO_BUYER_NOTIFICATIONS);
  const unread = notifications.filter((n) => !n.is_read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="התראות"
        description="עדכונים על נכסים ששותפו, מחירים ומכירות פומביות"
        action={
          unread > 0 ? (
            <div className="flex gap-2">
              <Badge variant="destructive">{unread} חדשות</Badge>
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check className="h-4 w-4" />
                סמן הכל כנקרא
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="space-y-3">
        {notifications.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          const link = LINKS[n.type];
          return (
            <div
              key={n.id}
              className={cn(
                'flex gap-4 rounded-xl border p-4 transition-colors',
                SEVERITY_STYLES[n.severity],
                !n.is_read && 'ring-1 ring-primary/20',
              )}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {!n.is_read && (
                      <Badge variant="destructive" className="mb-1 text-[10px]">חדש</Badge>
                    )}
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    {link && (
                      <Link to={link} className="mt-2 inline-flex text-sm text-primary hover:underline">
                        {n.type === 'share' ? 'צפייה בנכסים ששותפו' : n.type === 'price' ? 'צפייה במועדפים' : 'חיפוש נכסים'} ←
                      </Link>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                </div>
              </div>
              {!n.is_read && (
                <Button variant="ghost" size="icon" onClick={() => markRead(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Link to="/buyer/shared"><Button variant="outline">נכסים ששותפו</Button></Link>
        <Link to="/buyer/favorites"><Button variant="outline"><Heart className="h-4 w-4" />מועדפים</Button></Link>
      </div>
    </div>
  );
}
