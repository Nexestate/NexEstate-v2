import { supabase } from './supabase';

/** Claim pending property invites → shares + role upgrade (server-side RPC). */
export async function claimPendingInvites(userId: string, userEmail: string): Promise<void> {
  if (!supabase) return;

  try {
    const { data, error } = await supabase.rpc('claim_my_pending_invites');

    if (error) {
      // RPC not deployed yet — ignore; DB trigger may have run on signup
      if (error.code === 'PGRST202' || error.message?.includes('claim_my_pending_invites')) {
        console.warn('[claimPendingInvites] RPC missing — run supabase/claim_invites_rpc.sql');
        return;
      }
      console.error('[claimPendingInvites] RPC error:', error.message);
      return;
    }

    const result = data as { ok?: boolean; claimed?: number; role?: string } | null;
    if (result?.claimed) {
      console.info(`[claimPendingInvites] claimed ${result.claimed} invite(s), role=${result.role}`);
    }
  } catch (err) {
    console.error('Error claiming pending invites:', err);
  }

  void userId;
  void userEmail;
}
