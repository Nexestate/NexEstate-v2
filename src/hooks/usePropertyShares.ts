import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/services/serviceHelpers';
import type { PermissionLevel } from '../lib/permissions';
import type { PendingInviteRow, PropertyShareRow } from '../types/domain';

export type { PermissionLevel } from '../lib/permissions';
export { PERMISSION_LABELS, PERMISSION_DESCRIPTIONS } from '../lib/permissions';

export type PropertyShare = PropertyShareRow;
export type PendingInvite = PendingInviteRow;

interface ShareWithProfile extends PropertyShare {
  shared_with_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface InviteWithInviter extends PendingInvite {
  inviter_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export type ShareResult = {
  success: boolean;
  error?: string;
  isInvitation?: boolean;
  message?: string;
};

export function usePropertyShares(propertyId: string | undefined) {
  const [shares, setShares] = useState<ShareWithProfile[]>([]);
  const [pendingInvites, setPendingInvites] = useState<InviteWithInviter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    if (isDemoMode() || !supabase || !propertyId) {
      setShares([]);
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [sharesResult, invitesResult] = await Promise.all([
        supabase
          .from('property_shares')
          .select('*')
          .eq('property_id', propertyId)
          .order('created_at', { ascending: false }),
        supabase
          .from('pending_invites')
          .select('*')
          .eq('property_id', propertyId)
          .eq('status', 'pending')
          .order('sent_at', { ascending: false }),
      ]);

      if (sharesResult.error) {
        setError('שגיאה בטעינת שיתופים');
        return;
      }

      const sharesData = (sharesResult.data ?? []) as PropertyShare[];
      const invitesData = (invitesResult.data ?? []) as PendingInvite[];

      const userIds = sharesData.map((s) => s.shared_with).filter(Boolean);
      const inviterIds = invitesData.map((i) => i.invited_by).filter(Boolean);
      const allUserIds = [...new Set([...userIds, ...inviterIds])];

      let profilesMap: Record<
        string,
        { full_name: string | null; email: string | null; avatar_url: string | null }
      > = {};

      if (allUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', allUserIds);

        if (profilesData) {
          profilesMap = profilesData.reduce(
            (acc, p) => {
              acc[p.id] = {
                full_name: p.full_name,
                email: p.email,
                avatar_url: p.avatar_url,
              };
              return acc;
            },
            {} as typeof profilesMap,
          );
        }
      }

      setShares(
        sharesData.map((share) => ({
          ...share,
          shared_with_profile: share.shared_with ? profilesMap[share.shared_with] ?? null : null,
        })),
      );

      setPendingInvites(
        invitesData.map((invite) => ({
          ...invite,
          inviter_profile: invite.invited_by
            ? {
                full_name: profilesMap[invite.invited_by]?.full_name ?? null,
                email: profilesMap[invite.invited_by]?.email ?? null,
              }
            : null,
        })),
      );
      setError(null);
    } catch {
      setError('שגיאה בטעינת שיתופים');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    void fetchShares();
  }, [fetchShares]);

  const shareProperty = async (
    email: string,
    permissionLevel: PermissionLevel,
    sharedBy: string,
    expiresAt?: string,
    recipientName?: string,
    intendedRole?: string,
  ): Promise<ShareResult> => {
    if (isDemoMode()) {
      return { success: true, isInvitation: true, message: 'הזמנה נשלחה (מצב דמו)' };
    }
    if (!supabase || !propertyId) {
      return { success: false, error: 'המערכת לא מחוברת' };
    }

    try {
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', email.trim())
        .maybeSingle();

      if (userError || !userProfile) {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('title, address, city')
          .eq('id', propertyId)
          .single();

        const { data: existingInvite } = await supabase
          .from('pending_invites')
          .select('id')
          .eq('property_id', propertyId)
          .eq('email', email.toLowerCase())
          .eq('status', 'pending')
          .maybeSingle();

        if (existingInvite) {
          return { success: false, error: 'כבר נשלחה הזמנה לכתובת זו' };
        }

        const { error: inviteError } = await supabase.from('pending_invites').insert({
          property_id: propertyId,
          invited_by: sharedBy,
          email: email.toLowerCase(),
          permission_level: permissionLevel,
          status: 'pending',
          intended_role: intendedRole || 'partner',
        });

        if (inviteError) {
          return { success: false, error: 'שגיאה ביצירת הזמנה' };
        }

        const { notifyShare } = await import('../lib/services/edgeFunctions');
        let emailResult;
        try {
          emailResult = await notifyShare({
            recipientEmail: email.toLowerCase(),
            recipientName: recipientName || '',
            sharedByUserId: sharedBy,
            entityType: 'נכס',
            entityId: propertyId,
            entityName: propertyData?.title || 'נכס',
            permissionLevel,
            intendedRole: intendedRole || 'partner',
            isInvitation: true,
          });
        } catch (err) {
          await fetchShares();
          return {
            success: true,
            isInvitation: true,
            message: `ההזמנה נשמרה, אך המייל לא נשלח: ${
              err instanceof Error ? err.message : 'בדוק deploy של notify-share'
            }`,
          };
        }

        await fetchShares();

        if (!emailResult.sent) {
          return {
            success: true,
            isInvitation: true,
            message: `ההזמנה נשמרה, אך המייל לא נשלח: ${emailResult.error ?? 'בדוק הגדרות Resend'}`,
          };
        }

        return { success: true, isInvitation: true, message: 'הזמנה נשלחה למייל' };
      }

      const { data: existing } = await supabase
        .from('property_shares')
        .select('id')
        .eq('property_id', propertyId)
        .eq('shared_with', userProfile.id)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'הנכס כבר משותף עם משתמש זה' };
      }

      const { error: insertError } = await supabase.from('property_shares').insert({
        property_id: propertyId,
        shared_with: userProfile.id,
        shared_by: sharedBy,
        permission_level: permissionLevel,
        expires_at: expiresAt || null,
      });

      if (insertError) {
        return { success: false, error: 'שגיאה ביצירת שיתוף' };
      }

      const { data: propertyData } = await supabase
        .from('properties')
        .select('title')
        .eq('id', propertyId)
        .single();

      const { notifyShare } = await import('../lib/services/edgeFunctions');
      let emailResult;
      try {
        emailResult = await notifyShare({
          recipientEmail: userProfile.email || email.toLowerCase(),
          recipientName: userProfile.full_name || recipientName || '',
          sharedByUserId: sharedBy,
          entityType: 'נכס',
          entityId: propertyId,
          entityName: propertyData?.title || 'נכס',
          permissionLevel,
          isInvitation: false,
        });
      } catch (err) {
        await fetchShares();
        return {
          success: true,
          message: `הנכס שותף, אך המייל לא נשלח: ${
            err instanceof Error ? err.message : 'בדוק deploy של notify-share'
          }`,
        };
      }

      await fetchShares();

      if (!emailResult.sent) {
        return {
          success: true,
          message: `הנכס שותף, אך המייל לא נשלח: ${emailResult.error ?? 'בדוק הגדרות Resend'}`,
        };
      }

      return { success: true, message: 'הנכס שותף בהצלחה ונשלח מייל' };
    } catch {
      return { success: false, error: 'שגיאה בלתי צפויה' };
    }
  };

  const updatePermission = async (shareId: string, permissionLevel: PermissionLevel) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase
      .from('property_shares')
      .update({ permission_level: permissionLevel })
      .eq('id', shareId);
    if (err) return { success: false, error: 'שגיאה בעדכון הרשאות' };
    await fetchShares();
    return { success: true };
  };

  const removeShare = async (shareId: string) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase.from('property_shares').delete().eq('id', shareId);
    if (err) return { success: false, error: 'שגיאה בהסרת שיתוף' };
    await fetchShares();
    return { success: true };
  };

  const deleteInvite = async (inviteId: string) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase.from('pending_invites').delete().eq('id', inviteId);
    if (err) return { success: false, error: 'שגיאה במחיקת הזמנה' };
    await fetchShares();
    return { success: true };
  };

  const cancelInvite = async (inviteId: string) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase
      .from('pending_invites')
      .update({ status: 'cancelled' })
      .eq('id', inviteId);
    if (err) return { success: false, error: 'שגיאה בביטול הזמנה' };
    await fetchShares();
    return { success: true };
  };

  const updateInvitePermission = async (inviteId: string, permissionLevel: PermissionLevel) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase
      .from('pending_invites')
      .update({ permission_level: permissionLevel })
      .eq('id', inviteId);
    if (err) return { success: false, error: 'שגיאה בעדכון הרשאות' };
    await fetchShares();
    return { success: true };
  };

  const updateInviteRole = async (inviteId: string, intendedRole: string) => {
    if (isDemoMode() || !supabase) return { success: false, error: 'המערכת לא מחוברת' };
    const { error: err } = await supabase
      .from('pending_invites')
      .update({ intended_role: intendedRole })
      .eq('id', inviteId);
    if (err) return { success: false, error: 'שגיאה בעדכון תפקיד' };
    await fetchShares();
    return { success: true };
  };

  const resendInvite = async (inviteId: string) => {
    if (isDemoMode() || !supabase || !propertyId) {
      return { success: false, error: 'המערכת לא מחוברת' };
    }

    const { data: invite, error: inviteError } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('property_id', propertyId)
      .maybeSingle();

    if (inviteError || !invite) {
      return { success: false, error: 'הזמנה לא נמצאה' };
    }

    const { data: propertyData } = await supabase
      .from('properties')
      .select('title')
      .eq('id', propertyId)
      .single();

    try {
      const { notifyShare } = await import('../lib/services/edgeFunctions');
      const emailResult = await notifyShare({
        recipientEmail: invite.email,
        recipientName: '',
        sharedByUserId: invite.invited_by,
        entityType: 'נכס',
        entityId: propertyId,
        entityName: propertyData?.title || 'נכס',
        permissionLevel: invite.permission_level,
        intendedRole: invite.intended_role,
        isInvitation: true,
      });

      if (!emailResult.sent) {
        return { success: false, error: emailResult.error ?? 'שליחת המייל נכשלה' };
      }

      return { success: true, message: 'הזמנה נשלחה שוב למייל' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'שגיאה בשליחה חוזרת';
      return { success: false, error: message };
    }
  };

  return {
    shares,
    pendingInvites,
    loading,
    error,
    shareProperty,
    updatePermission,
    removeShare,
    deleteInvite,
    cancelInvite,
    updateInvitePermission,
    updateInviteRole,
    resendInvite,
    refresh: fetchShares,
  };
}
