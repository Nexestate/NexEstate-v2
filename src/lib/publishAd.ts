import { getDashboardPath } from './roles';
import type { Profile, UserRole } from '../types';

export const REGISTER_PUBLISH_PATH = '/register?role=owner&intent=publish';

const BROKER_PUBLISH_ROLES: UserRole[] = [
  'broker',
  'admin',
  'superadmin',
  'owner',
  'manager',
  'partner',
];

export function getPublishAdPath(user: Profile | null): string {
  if (!user) return REGISTER_PUBLISH_PATH;
  if (BROKER_PUBLISH_ROLES.includes(user.role)) {
    return '/broker/my-properties';
  }
  return getDashboardPath(user.role);
}

export function parseRegisterRoleParam(role: string | null, intent: string | null): UserRole {
  const allowed: UserRole[] = [
    'broker',
    'developer',
    'owner',
    'buyer',
    'investor',
    'manager',
    'receiver',
  ];
  if (role && allowed.includes(role as UserRole)) {
    return role as UserRole;
  }
  if (intent === 'publish') return 'owner';
  return 'broker';
}
