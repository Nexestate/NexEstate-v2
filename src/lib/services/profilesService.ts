import type { Profile } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

export type ProfileUpdatePayload = {
  full_name?: string;
  phone?: string | null;
  company?: string | null;
  license_number?: string | null;
};

export async function updateProfile(
  userId: string,
  payload: ProfileUpdatePayload,
): Promise<Profile> {
  if (isDemoMode()) {
    return {
      id: userId,
      email: 'demo@nexestate.co',
      full_name: payload.full_name ?? 'Demo User',
      phone: payload.phone ?? undefined,
      company: payload.company ?? undefined,
      license_number: payload.license_number ?? undefined,
      role: 'buyer',
    };
  }

  const client = requireSupabase();
  const { data, error } = await client
    .from('profiles')
    .update({
      full_name: payload.full_name,
      phone: payload.phone,
      company: payload.company,
      license_number: payload.license_number,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single();

  throwIfError(error);
  return data as Profile;
}
