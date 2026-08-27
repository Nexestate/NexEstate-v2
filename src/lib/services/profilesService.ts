import type { Profile, UserRole } from '../../types';
import { isDemoMode, requireSupabase, throwIfError } from './serviceHelpers';

/** Ensures a profiles row exists (required for signing_links FK). */
export async function ensureProfile(
  userId: string,
  email: string,
  fullName?: string,
  role: UserRole = 'broker',
): Promise<void> {
  if (isDemoMode()) return;

  const client = requireSupabase();
  const { data: existing } = await client.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing) return;

  const { error } = await client.from('profiles').insert({
    id: userId,
    email,
    full_name: fullName?.trim() || email.split('@')[0] || 'משתמש',
    role,
  });
  throwIfError(error);
}

function textOrUndefined(value: string | null | undefined): string | undefined {
  return value == null || value === '' ? undefined : value;
}

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
    const updated: Profile = {
      id: userId,
      email: 'demo@nexestate.co',
      full_name: payload.full_name ?? 'Demo User',
      role: 'buyer',
      phone: textOrUndefined(payload.phone),
      company: textOrUndefined(payload.company),
      license_number: textOrUndefined(payload.license_number),
    };
    return updated;
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
