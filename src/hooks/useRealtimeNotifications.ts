import { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/services/serviceHelpers';
import { loadNotificationPrefs, shouldPushForNotificationType } from '../lib/notificationPrefs';
import { showBrowserNotification } from '../lib/pushNotifications';

/** Live push toasts when new rows land in notifications (e.g. new lead). */
export function useRealtimeNotifications(userId?: string) {
  useEffect(() => {
    if (!userId || isDemoMode() || !isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel(`notifications-push:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            type?: string;
            title?: string;
            message?: string;
            link?: string;
          };
          const prefs = loadNotificationPrefs();
          const type = row.type ?? 'system';
          if (!shouldPushForNotificationType(type, prefs)) return;

          showBrowserNotification({
            title: row.title ?? 'התראה חדשה',
            body: row.message ?? '',
            tag: row.id,
            url: row.link ?? '/broker/notifications',
            type,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [userId]);
}
