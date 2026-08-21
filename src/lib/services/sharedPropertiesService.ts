import { DEMO_SHARED_PROPERTIES } from '../../data/demoData';
import type { PermissionLevel } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export interface SharedPropertySummary {
  id: string;
  title: string;
  city?: string;
  address?: string;
  permissionLevel: PermissionLevel;
  sharedByName: string | null;
}

export async function fetchSharedWithUser(userId: string): Promise<SharedPropertySummary[]> {
  if (isDemoMode()) {
    return DEMO_SHARED_PROPERTIES.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.city,
      address: p.address,
      permissionLevel: p.permissionLevel,
      sharedByName: p.sharedByName,
    }));
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('property_shares')
    .select(`
      permission_level,
      property:properties(id, title, city, address),
      shared_by_profile:profiles!property_shares_shared_by_fkey(full_name)
    `)
    .eq('shared_with', userId)
    .order('created_at', { ascending: false });

  throwIfError(error);

  return (data ?? [])
    .map((row) => {
      const prop = row.property as unknown as { id: string; title: string; city?: string; address?: string } | null;
      if (!prop) return null;
      const profile = row.shared_by_profile as { full_name?: string } | null;
      return {
        id: prop.id,
        title: prop.title,
        city: prop.city,
        address: prop.address,
        permissionLevel: row.permission_level as PermissionLevel,
        sharedByName: profile?.full_name ?? null,
      };
    })
    .filter(Boolean) as SharedPropertySummary[];
}
