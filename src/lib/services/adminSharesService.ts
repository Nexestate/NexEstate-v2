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

type ShareRow = {
  id: string;
  property_id: string;
  shared_with: string | null;
  shared_by: string | null;
  permission_level: string | null;
  can_view?: boolean;
  can_edit?: boolean;
  can_share?: boolean;
  created_at: string;
  expires_at: string | null;
  properties: { id: string; title: string; city: string } | { id: string; title: string; city: string }[] | null;
};

function permissionFromRow(row: ShareRow): PermissionLevel {
  if (row.permission_level === 'view' || row.permission_level === 'edit' || row.permission_level === 'admin') {
    return row.permission_level;
  }
  if (row.can_share) return 'admin';
  if (row.can_edit) return 'edit';
  return 'view';
}

export async function fetchAdminPropertyShares(search?: string): Promise<AdminPropertyShareRow[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_shares')
    .select(
      'id, property_id, shared_with, shared_by, permission_level, can_view, can_edit, can_share, created_at, expires_at, properties(id, title, city)',
    )
    .order('created_at', { ascending: false })
    .limit(500);

  throwIfError(error);
  const rows = (data ?? []) as unknown as ShareRow[];

  const userIds = [
    ...new Set(
      rows.flatMap((row) => [row.shared_with, row.shared_by].filter((id): id is string => Boolean(id))),
    ),
  ];

  const profiles = new Map<string, { full_name: string; email: string }>();
  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await client
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);
    throwIfError(profileError);
    for (const profile of profileRows ?? []) {
      profiles.set(profile.id as string, {
        full_name: (profile.full_name as string) ?? '—',
        email: (profile.email as string) ?? '',
      });
    }
  }

  const mapped = rows.map((row) => {
    const property = Array.isArray(row.properties) ? row.properties[0] : row.properties;
    const sharedWith = row.shared_with ? profiles.get(row.shared_with) : undefined;
    const sharedBy = row.shared_by ? profiles.get(row.shared_by) : undefined;
    return {
      id: row.id,
      property_id: property?.id ?? row.property_id,
      property_title: property?.title ?? '—',
      property_city: property?.city ?? '',
      shared_with_id: row.shared_with ?? '',
      shared_with_name: sharedWith?.full_name ?? '—',
      shared_with_email: sharedWith?.email ?? '',
      shared_by_name: sharedBy?.full_name ?? '—',
      permission_level: permissionFromRow(row),
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
