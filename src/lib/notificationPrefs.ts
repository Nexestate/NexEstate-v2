export type NotificationPrefs = {
  emailAlerts: boolean;
  leadAlerts: boolean;
  leaseExpiry: boolean;
  leaseDays: number;
  weeklyDigest: boolean;
  pushEnabled: boolean;
};

const STORAGE_KEY = 'nexestate-notification-prefs';

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailAlerts: true,
  leadAlerts: true,
  leaseExpiry: true,
  leaseDays: 7,
  weeklyDigest: false,
  pushEnabled: false,
};

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function shouldPushForNotificationType(type: string, prefs: NotificationPrefs): boolean {
  if (!prefs.pushEnabled) return false;
  if (type === 'lead') return prefs.leadAlerts;
  if (type === 'lease') return prefs.leaseExpiry;
  return true;
}
