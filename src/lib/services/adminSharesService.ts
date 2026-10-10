import type { PermissionLevel } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export interface AdminPropertyShareRow {
  id: string;
  property_id: string;
  property_title: string;
  property_city: string;
  shared_with_id: string;
  shared_with_name: string;
  shared_with_email: string;
  shared_by_name: string;
  permission_level: PermissionLevel;
  created_at: string;
  expires_at: string | null;
}

type ShareDbRow = {
  id: string;
  permission_level: string;
  created_at: string;
  expires_at: string | null;
  property: { id: string; title: string; city: string } | null;
  shared_with_profile: { id: string; full_name: string; email: string } | null;
  shared_by_profile: { full_name: string } | null;
};

export async function fetchAdminPropertyShares(search?: string): Promise<AdminPropertyShareRow[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_shares')
    .select(
      `
      id,
      permission_level,
      created_at,
      expires_at,
      property:properties(id, title, city),
      shared_with_profile:profiles!property_shares_shared_with_fkey(id, full_name, email),
      shared_by_profile:profiles!property_shares_shared_by_fkey(full_name)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(error);

  const mapped = ((data ?? []) as unknown as ShareDbRow[]).map((row) => {
    const property = Array.isArray(row.property) ? row.property[0] : row.property;
    const sharedWith = Array.isArray(row.shared_with_profile)
      ? row.shared_with_profile[0]
      : row.shared_with_profile;
    const sharedBy = Array.isArray(row.shared_by_profile)
      ? row.shared_by_profile[0]
      : row.shared_by_profile;
    return {
    id: row.id,
    property_id: property?.id ?? '',
    property_title: property?.title ?? '—',
    property_city: property?.city ?? '',
    shared_with_id: sharedWith?.id ?? '',
    shared_with_name: sharedWith?.full_name ?? '—',
    shared_with_email: sharedWith?.email ?? '',
    shared_by_name: sharedBy?.full_name ?? '—',
    permission_level: row.permission_level as PermissionLevel,
    created_at: row.created_at,
    expires_at: row.expires_at,
  };
  });

  const q = search?.trim();
  if (!q) return mapped;

  return mapped.filter(
    (s) =>
      s.property_title.includes(q) ||
      s.shared_with_name.includes(q) ||
      s.shared_with_email.toLowerCase().includes(q.toLowerCase()) ||
      s.shared_by_name.includes(q),
  );
}
