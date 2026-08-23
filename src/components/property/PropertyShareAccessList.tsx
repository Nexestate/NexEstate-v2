import { Mail, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { PERMISSION_LABELS, type PermissionLevel } from '../../lib/permissions';
import { ROLE_LABELS } from '../../lib/roles';
import type { PendingInviteRow, PropertyShareRow } from '../../types/domain';
import type { UserRole } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const INTENDED_ROLE_LABELS: Record<string, string> = {
  owner: ROLE_LABELS.owner,
  manager: ROLE_LABELS.manager,
  partner: ROLE_LABELS.partner,
  buyer: ROLE_LABELS.buyer,
};

type ShareWithProfile = PropertyShareRow & {
  shared_with_profile?: {
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

interface PropertyShareAccessListProps {
  shares: ShareWithProfile[];
  pendingInvites: PendingInviteRow[];
  loading: boolean;
  onUpdatePermission: (shareId: string, level: PermissionLevel) => Promise<{ success: boolean; error?: string }>;
  onRemoveShare: (shareId: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateInvitePermission: (
    inviteId: string,
    level: PermissionLevel,
  ) => Promise<{ success: boolean; error?: string }>;
  onDeleteInvite: (inviteId: string) => Promise<{ success: boolean; error?: string }>;
  onResendInvite: (inviteId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export function PropertyShareAccessList({
  shares,
  pendingInvites,
  loading,
  onUpdatePermission,
  onRemoveShare,
  onUpdateInvitePermission,
  onDeleteInvite,
  onResendInvite,
}: PropertyShareAccessListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const runAction = async (
    id: string,
    action: () => Promise<{ success: boolean; error?: string; message?: string }>,
  ) => {
    setBusyId(id);
    setActionError('');
    setActionMessage('');
    const result = await action();
    setBusyId(null);
    if (!result.success) setActionError(result.error ?? 'פעולה נכשלה');
    else if (result.message) setActionMessage(result.message);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (shares.length === 0 && pendingInvites.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
        עדיין לא שותף נכס זה עם אף אחד
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && <p className="text-sm text-destructive">{actionError}</p>}
      {actionMessage && <p className="text-sm text-success">{actionMessage}</p>}

      {shares.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            גישה פעילה
          </h4>
          <ul className="space-y-2">
            {shares.map((share) => {
              const label =
                share.shared_with_profile?.full_name ||
                share.shared_with_profile?.email ||
                'משתמש רשום';
              const email = share.shared_with_profile?.email;

              return (
                <li
                  key={share.id}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{label}</p>
                      {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <select
                      value={share.permission_level}
                      disabled={busyId === share.id}
                      onChange={(e) =>
                        void runAction(share.id, () =>
                          onUpdatePermission(share.id, e.target.value as PermissionLevel),
                        )
                      }
                      className="h-9 min-w-[7.5rem] rounded-lg border border-border bg-background px-2 text-xs"
                    >
                      {(['view', 'edit', 'admin'] as const).map((level) => (
                        <option key={level} value={level}>
                          {PERMISSION_LABELS[level]}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyId === share.id}
                      aria-label="הסר גישה"
                      onClick={() => void runAction(share.id, () => onRemoveShare(share.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {pendingInvites.length > 0 && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            הזמנות ממתינות
          </h4>
          <ul className="space-y-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/5 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/15 text-warning">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{invite.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="warning" className="text-[10px]">
                        ממתין להרשמה
                      </Badge>
                      {invite.intended_role && (
                        <Badge variant="outline" className="text-[10px]">
                          {INTENDED_ROLE_LABELS[invite.intended_role] ??
                            ROLE_LABELS[invite.intended_role as UserRole] ??
                            invite.intended_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <select
                    value={invite.permission_level}
                    disabled={busyId === invite.id}
                    onChange={(e) =>
                      void runAction(invite.id, () =>
                        onUpdateInvitePermission(invite.id, e.target.value as PermissionLevel),
                      )
                    }
                    className="h-9 min-w-[7.5rem] rounded-lg border border-border bg-background px-2 text-xs"
                  >
                    {(['view', 'edit', 'admin'] as const).map((level) => (
                      <option key={level} value={level}>
                        {PERMISSION_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyId === invite.id}
                    onClick={() => void runAction(invite.id, () => onResendInvite(invite.id))}
                  >
                    שלח שוב
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={busyId === invite.id}
                    aria-label="בטל הזמנה"
                    onClick={() => void runAction(invite.id, () => onDeleteInvite(invite.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
