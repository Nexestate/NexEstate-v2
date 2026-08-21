import { supabase } from './supabase';
import type { UserRole } from '../types';

/** Claim pending property invites → shares + optional role upgrade. */
export async function claimPendingInvites(userId: string, userEmail: string): Promise<void> {
  if (!supabase) return;
  try {
    const { data: pendingInvites, error: fetchError } = await supabase
      .from('pending_invites')
      .select('*')
      .ilike('email', userEmail.trim())
      .eq('status', 'pending');

    if (fetchError || !pendingInvites?.length) return;

    const roleMap: Record<string, number> = { owner: 3, manager: 2, partner: 1, buyer: 0 };
    let bestRole: UserRole = 'buyer';
    let bestPriority = 0;

    for (const invite of pendingInvites) {
      if (!invite.property_id) continue;

      const { error: shareError } = await supabase.from('property_shares').insert({
        property_id: invite.property_id,
        shared_with: userId,
        shared_by: invite.invited_by,
        permission_level: invite.permission_level || 'view',
      });

      if (!shareError) {
        await supabase
          .from('pending_invites')
          .update({
            status: 'claimed',
            accepted_at: new Date().toISOString(),
            claimed_at: new Date().toISOString(),
          })
          .eq('id', invite.id);
      }

      const inviteRole = (invite.intended_role || 'buyer') as UserRole;
      const priority = roleMap[inviteRole] ?? 0;
      if (priority > bestPriority) {
        bestPriority = priority;
        bestRole = inviteRole;
      }
    }

    if (bestRole !== 'buyer') {
      await supabase.from('profiles').update({ role: bestRole }).eq('id', userId);
    }
  } catch (err) {
    console.error('Error claiming pending invites:', err);
  }
}
