import { Bell, Check, Heart, Share2, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { useAuth } from '../../contexts/AuthContext';
import { useAsyncData } from '../../hooks/useAsyncData';
import {
  fetchNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../lib/services';
import type { AppNotification } from '../../types/domain';
import { cn } from '../../lib/utils';

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
  const { user } = useAuth();
  const { data: notifications, loading, error, reload } = useAsyncData(
    () => fetchNotifications(user?.id),
    [user?.id],
  );

  const list = notifications ?? [];
  const unread = getUnreadCount(list);

  const markRead = async (id: string) => {
    await markNotificationRead(id);
    reload();
  };

  const markAllRead = async () => {
    if (user?.id) await markAllNotificationsRead(user.id);
    reload();
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="התראות"
        description="עדכונים על נכסים ששותפו, מחירים ומכירות פומביות"
        action={
          unread > 0 ? (
            <div className="flex gap-2">
              <Badge variant="destructive">{unread} חדשות</Badge>
              <Button variant="outline" size="sm" onClick={() => void markAllRead()}>
                <Check className="h-4 w-4" />
                סמן הכל כנקרא
              </Button>
            </div>
          ) : undefined
        }
      />

      {error && (
        <EmptyState
          icon={Bell}
          title="שגיאה בטעינה"
          description="לא הצלחנו לטעון התראות"
          actionLabel="נסה שוב"
          onAction={reload}
        />
      )}

      {!error && list.length === 0 && (
        <EmptyState
          icon={Bell}
          title="אין התראות"
          description="כשיש עדכונים על נכסים ששותפו או מועדפים — הם יופיעו כאן"
        />
      )}

      <div className="space-y-3">
        {list.map((n: AppNotification) => {
          const Icon = TYPE_ICONS[n.type] ?? Bell;
          const link = LINKS[n.type];
          const severity = n.severity ?? 'info';
          return (
            <div
              key={n.id}
              className={cn(
                'flex gap-4 rounded-xl border p-4 transition-colors',
                SEVERITY_STYLES[severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.info,
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
                <Button variant="ghost" size="icon" onClick={() => void markRead(n.id)}>
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/buyer/shared"><Button variant="outline">נכסים ששותפו</Button></Link>
        <Link to="/buyer/favorites"><Button variant="outline"><Heart className="h-4 w-4" />מועדפים</Button></Link>
      </div>
    </div>
  );
}
