import { supabase } from './supabase';

/** Claim pending property invites → shares + role upgrade (server-side RPC). */
export async function claimPendingInvites(userId: string, userEmail: string): Promise<number> {
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.rpc('claim_my_pending_invites');

    if (error) {
      if (error.code === 'PGRST202' || error.message?.includes('claim_my_pending_invites')) {
        console.warn('[claimPendingInvites] RPC missing — run supabase/claim_invites_rpc.sql');
        return 0;
      }
      console.error('[claimPendingInvites] RPC error:', error.message);
      return 0;
    }

    const result = data as { ok?: boolean; claimed?: number; role?: string } | null;
    if (result?.claimed) {
      console.info(`[claimPendingInvites] claimed ${result.claimed} invite(s), role=${result.role}`);
      return result.claimed;
    }
  } catch (err) {
    console.error('Error claiming pending invites:', err);
  }

  void userId;
  void userEmail;
  return 0;
}
