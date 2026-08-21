import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  FileSignature,
  Trash2,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
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

const TYPE_ICONS: Record<string, typeof Building2> = {
  lease: Building2,
  payment: Banknote,
  signature: FileSignature,
  lead: User,
  alert: AlertCircle,
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

export function NotificationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const { data: notifications, loading, setData, reload } = useAsyncData(
    () => fetchNotifications(user?.id),
    [user?.id],
  );

  if (loading || !notifications) return <PageLoader />;

  const unread = getUnreadCount(notifications);
  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const handleRead = async (n: AppNotification) => {
    await markNotificationRead(n.id);
    setData(notifications.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(user?.id);
    reload();
  };

  const stats = {
    lease: notifications.filter((n) => n.type === 'lease').length,
    payment: notifications.filter((n) => n.type === 'payment').length,
    signature: notifications.filter((n) => n.type === 'signature').length,
    read: notifications.filter((n) => n.is_read).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="מרכז התראות"
        description="התראות על חוזים, תשלומים וצ'קים"
        action={
          <div className="flex gap-2">
            {unread > 0 && <Badge variant="destructive">{unread} חדשות</Badge>}
            <Button variant="outline" size="sm" onClick={handleMarkAll}>
              <Check className="h-4 w-4" />
              סמן הכל כנקרא
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'חוזים', value: stats.lease, icon: Building2 },
          { label: 'תשלומים', value: stats.payment, icon: Banknote },
          { label: 'חתימות', value: stats.signature, icon: FileSignature },
          { label: 'נקראו', value: stats.read, icon: Check },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 py-4">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'הכל', count: notifications.length },
          { id: 'unread', label: 'לא נקראו', count: unread },
          { id: 'lease', label: 'חוזים' },
          { id: 'payment', label: 'תשלומים' },
          { id: 'signature', label: 'חתימות' },
          { id: 'lead', label: 'לידים' },
        ]}
        active={filter}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {filtered.map((n) => {
          const Icon = TYPE_ICONS[n.type] ?? AlertCircle;
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
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {!n.is_read && (
                  <Button variant="ghost" size="icon" onClick={() => handleRead(n)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
