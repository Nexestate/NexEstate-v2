import { DEMO_NOTIFICATIONS } from '../../data/demoData';
import type { AppNotification, NotificationSeverity } from '../../types/domain';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export type CreateNotificationPayload = {
  userId: string;
  type: string;
  title: string;
  message: string;
  severity?: NotificationSeverity;
  link?: string;
};

export async function fetchNotifications(userId?: string): Promise<AppNotification[]> {
  if (isDemoMode()) return DEMO_NOTIFICATIONS;

  const client = requireSupabase();
  let query = client.from('notifications').select('*').order('created_at', { ascending: false });
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message ?? '',
    severity: row.severity,
    is_read: row.is_read,
    created_at: row.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isDemoMode()) {
    const n = DEMO_NOTIFICATIONS.find((x) => x.id === id);
    if (n) n.is_read = true;
    return;
  }

  const client = requireSupabase();
  const { error } = await client.from('notifications').update({ is_read: true }).eq('id', id);
  throwIfError(error);
}

export async function markAllNotificationsRead(userId?: string): Promise<void> {
  if (isDemoMode()) {
    DEMO_NOTIFICATIONS.forEach((n) => {
      n.is_read = true;
    });
    return;
  }

  const client = requireSupabase();
  let query = client.from('notifications').update({ is_read: true });
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  throwIfError(error);
}

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.is_read).length;
}

export async function createNotification(payload: CreateNotificationPayload): Promise<AppNotification | null> {
  if (isDemoMode()) {
    const notification: AppNotification = {
      id: `notif-${Date.now()}`,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      severity: payload.severity ?? 'info',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    DEMO_NOTIFICATIONS.unshift(notification);
    return notification;
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('notifications')
    .insert({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      severity: payload.severity ?? 'info',
      link: payload.link,
      is_read: false,
    })
    .select('*')
    .single();

  throwIfError(error);
  if (!data) return null;

  return {
    id: data.id,
    type: data.type,
    title: data.title,
    message: data.message ?? '',
    severity: data.severity,
    is_read: data.is_read,
    created_at: data.created_at,
  };
}
