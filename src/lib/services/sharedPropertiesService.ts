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

  const { data: shares, error: sharesError } = await client
    .from('property_shares')
    .select('property_id, permission_level, shared_by')
    .eq('shared_with', userId)
    .order('created_at', { ascending: false });

  throwIfError(sharesError);
  if (!shares?.length) return [];

  const propertyIds = [...new Set(shares.map((s) => s.property_id as string).filter(Boolean))];
  const sharerIds = [...new Set(shares.map((s) => s.shared_by as string).filter(Boolean))];

  const [{ data: properties, error: propsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      client.from('properties').select('id, title, city, address').in('id', propertyIds),
      sharerIds.length
        ? client.from('profiles').select('id, full_name').in('id', sharerIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  throwIfError(propsError);
  if (profilesError) {
    console.warn('[fetchSharedWithUser] sharer profiles unavailable', profilesError.message);
  }

  const propsById = new Map((properties ?? []).map((p) => [p.id as string, p]));
  const namesById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? null]),
  );

  return shares
    .map((row) => {
      const prop = propsById.get(row.property_id as string);
      if (!prop) return null;
      return {
        id: prop.id as string,
        title: prop.title as string,
        city: (prop.city as string | null) ?? undefined,
        address: (prop.address as string | null) ?? undefined,
        permissionLevel: row.permission_level as PermissionLevel,
        sharedByName: namesById.get(row.shared_by as string) ?? null,
      };
    })
    .filter(Boolean) as SharedPropertySummary[];
}
