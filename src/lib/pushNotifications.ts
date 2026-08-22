import { loadNotificationPrefs, shouldPushForNotificationType } from './notificationPrefs';

export type BrowserNotificationPayload = {
  title: string;
  body?: string;
  tag?: string;
  url?: string;
  type?: string;
};

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function showBrowserNotification(payload: BrowserNotificationPayload): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const prefs = loadNotificationPrefs();
  if (payload.type && !shouldPushForNotificationType(payload.type, prefs)) return;

  const url = payload.url ?? '/broker/notifications';

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: { url },
      });
    });
    return;
  }

  const notification = new Notification(payload.title, {
    body: payload.body,
    tag: payload.tag,
    icon: '/favicon.svg',
  });
  notification.onclick = () => {
    window.focus();
    window.location.href = url;
    notification.close();
  };
}
