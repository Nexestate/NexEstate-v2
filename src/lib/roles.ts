import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'מפתח ראשי',
  admin: 'מנהל מערכת',
  broker: 'מתווך / סוכנות',
  buyer: 'קונה / שוכר',
  developer: 'יזם / קבלן',
  owner: 'בעל נכס',
  investor: 'משקיע',
  manager: 'חברת ניהול',
  receiver: 'כונס / עו"ד',
  partner: 'שותף',
};

export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  superadmin: '/broker',
  admin: '/admin',
  broker: '/broker',
  buyer: '/buyer',
  developer: '/developer',
  owner: '/broker',
  investor: '/investor',
  manager: '/broker',
  receiver: '/broker',
  partner: '/broker',
};

/** Roles a broker can assign when sharing a managed property with someone who may not be registered yet. */
export const SHARE_INVITE_ROLES = ['partner', 'manager', 'owner'] as const;
export type ShareInviteRole = (typeof SHARE_INVITE_ROLES)[number];

export const SHARE_INVITE_ROLE_HINTS: Record<ShareInviteRole, string> = {
  partner: 'גישה לנכס המנוהל כשותף — מתאים לצפייה ועבודה משותפת',
  manager: 'מנהל נכס — שוכרים, חוזים ותשלומים של הנכס',
  owner: 'בעל הנכס — שיוך מלא לנכס בדשבורד המתווך',
};

export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD_PATH[role] ?? '/broker';
}

export function canAccessRoute(role: UserRole, path: string): boolean {
  if (path.startsWith('/admin')) {
    return role === 'admin' || role === 'superadmin';
  }
  if (path.startsWith('/buyer')) {
    return role === 'buyer' || role === 'admin' || role === 'superadmin';
  }
  if (path.startsWith('/broker')) {
    return ['broker', 'admin', 'superadmin', 'owner', 'manager', 'partner'].includes(role);
  }
  return true;
}
