import {
  DEMO_ADMIN_STATS,
  DEMO_ADMIN_USERS,
  DEMO_PROPERTY_REVIEWS,
  DEMO_ROLE_DISTRIBUTION,
} from '../../data/demoData';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export interface AdminDashboardStats {
  totalUsers: number;
  totalProperties: number;
  newUsersToday: number;
  newPropertiesToday: number;
  rejectedProperties: number;
  approvedProperties: number;
  pendingProperties: number;
  suspendedUsers: number;
  activeShares: number;
  openSupportTickets: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface RoleDistributionItem {
  key: string;
  label: string;
  color: string;
  count: number;
}

const ROLE_META: Record<string, { label: string; color: string }> = {
  broker: { label: 'מתווכים', color: '#3b82f6' },
  developer: { label: 'קבלנים/יזמים', color: '#f59e0b' },
  manager: { label: 'חברות ניהול', color: '#10b981' },
  owner: { label: 'בעלי נכסים', color: '#8b5cf6' },
  investor: { label: 'משקיעים', color: '#ec4899' },
  buyer: { label: 'קונים', color: '#64748b' },
  admin: { label: 'אדמין', color: '#06b6d4' },
  superadmin: { label: 'סופר אדמין', color: '#ef4444' },
};

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  if (isDemoMode()) {
    return {
      ...DEMO_ADMIN_STATS,
      activeShares: 3,
      openSupportTickets: 2,
      approvedToday: 2,
      rejectedToday: 1,
    };
  }

  const client = requireSupabase();
  const today = startOfTodayIso();

  const [profilesRes, propertiesRes, sharesRes] = await Promise.all([
    client.from('profiles').select('id, role, created_at'),
    client.from('properties').select('id, status, created_at'),
    client.from('property_shares').select('id', { count: 'exact', head: true }),
  ]);

  throwIfError(profilesRes.error);
  throwIfError(propertiesRes.error);

  const profiles = profilesRes.data ?? [];
  const properties = propertiesRes.data ?? [];

  const newUsersToday = profiles.filter((p) => p.created_at && p.created_at >= today).length;
  const newPropertiesToday = properties.filter((p) => p.created_at && p.created_at >= today).length;
  const pendingProperties = properties.filter((p) => p.status === 'pending').length;
  const approvedProperties = properties.filter((p) => p.status === 'approved' || p.status === 'active').length;
  const rejectedProperties = properties.filter((p) => p.status === 'rejected').length;

  return {
    totalUsers: profiles.length,
    totalProperties: properties.length,
    newUsersToday,
    newPropertiesToday,
    rejectedProperties,
    approvedProperties,
    pendingProperties,
    suspendedUsers: 0,
    activeShares: sharesRes.count ?? 0,
    openSupportTickets: 0,
    approvedToday: properties.filter((p) => p.status === 'approved' && p.created_at && p.created_at >= today).length,
    rejectedToday: properties.filter((p) => p.status === 'rejected' && p.created_at && p.created_at >= today).length,
  };
}

export async function fetchRoleDistribution(): Promise<RoleDistributionItem[]> {
  if (isDemoMode()) return DEMO_ROLE_DISTRIBUTION;

  const client = requireSupabase();
  const { data, error } = await client.from('profiles').select('role');
  throwIfError(error);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const role = row.role as string;
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([key, count]) => ({
    key,
    label: ROLE_META[key]?.label ?? key,
    color: ROLE_META[key]?.color ?? '#64748b',
    count,
  }));
}

export async function fetchRecentUsers(limit = 4) {
  if (isDemoMode()) return DEMO_ADMIN_USERS.slice(0, limit);

  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  throwIfError(error);
  return data ?? [];
}

export async function fetchPendingReviews() {
  if (isDemoMode()) return DEMO_PROPERTY_REVIEWS.filter((r) => r.status === 'pending');

  const client = requireSupabase();
  const { data, error } = await client
    .from('properties')
    .select('id, title, city, status, created_at, broker_id')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);
  throwIfError(error);

  return (data ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    status: p.status,
    submittedAt: p.created_at,
  }));
}
