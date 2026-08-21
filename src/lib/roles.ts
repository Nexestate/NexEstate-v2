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
