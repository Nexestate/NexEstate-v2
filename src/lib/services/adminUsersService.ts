import type { UserRole } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export interface AdminProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export async function fetchAdminProfiles(search?: string): Promise<AdminProfileRow[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  let query = client
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  const { data, error } = await query;
  throwIfError(error);

  const rows = (data ?? []) as AdminProfileRow[];
  const q = search?.trim();
  if (!q) return rows;

  return rows.filter(
    (u) =>
      u.full_name?.includes(q) ||
      u.email?.toLowerCase().includes(q.toLowerCase()),
  );
}
