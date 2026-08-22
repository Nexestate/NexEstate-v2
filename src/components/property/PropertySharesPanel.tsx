import { Mail, Trash2, Users } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import { usePropertyShares } from '../../hooks/usePropertyShares';
import { PERMISSION_LABELS, type PermissionLevel } from '../../lib/permissions';
import { ROLE_LABELS, SHARE_INVITE_ROLES } from '../../lib/roles';
import { formatDate } from '../../lib/utils';

const INVITE_STATUS_LABELS: Record<string, string> = {
  pending: 'ממתין להרשמה',
  claimed: 'התקבל',
  cancelled: 'בוטל',
};

const INVITE_STATUS_VARIANT: Record<string, 'warning' | 'success' | 'outline'> = {
  pending: 'warning',
  claimed: 'success',
  cancelled: 'outline',
};

interface PropertySharesPanelProps {
  propertyId: string;
  onInvite: () => void;
}

export function PropertySharesPanel({ propertyId, onInvite }: PropertySharesPanelProps) {
  const { user } = useAuth();
  const {
    shares,
    pendingInvites,
    loading,
    updatePermission,
    removeShare,
    cancelInvite,
    updateInvitePermission,
    updateInviteRole,
    resendInvite,
  } = usePropertyShares(propertyId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          שיתופי גישה
        </CardTitle>
        <Button size="sm" onClick={onInvite}>
          הזמן משתמש
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">טוען שיתופים...</p>
        ) : (
          <>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">גישה פעילה</p>
              {shares.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין משתמשים עם גישה פעילה</p>
              ) : (
                <ul className="space-y-2">
                  {shares.map((share) => (
                    <li
                      key={share.id}
                      className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {share.shared_with_profile?.full_name || share.shared_with_profile?.email || 'משתמש'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {share.shared_with_profile?.email}
                          {share.created_at ? ` • מ־${formatDate(share.created_at)}` : ''}
                        </p>
                      </div>
                      <Badge variant="success">פעיל</Badge>
                      <select
                        aria-label="רמת הרשאה"
                        value={share.permission_level}
                        onChange={(e) => void updatePermission(share.id, e.target.value as PermissionLevel)}
                        className="h-9 rounded-lg border border-border bg-muted/50 px-2 text-xs"
                      >
                        {(['view', 'edit', 'admin'] as const).map((level) => (
                          <option key={level} value={level}>
                            {PERMISSION_LABELS[level]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="הסר שיתוף"
                        className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm('להסיר את הגישה למשתמש זה?')) void removeShare(share.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground">הזמנות ממתינות</p>
              {pendingInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין הזמנות ממתינות</p>
              ) : (
                <ul className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          נשלח {formatDate(invite.sent_at || invite.created_at)}
                        </p>
                      </div>
                      <Badge variant={INVITE_STATUS_VARIANT[invite.status] ?? 'outline'}>
                        {INVITE_STATUS_LABELS[invite.status] ?? invite.status}
                      </Badge>
                      <select
                        aria-label="תפקיד מיועד"
                        value={invite.intended_role}
                        onChange={(e) => void updateInviteRole(invite.id, e.target.value)}
                        className="h-9 rounded-lg border border-border bg-muted/50 px-2 text-xs"
                      >
                        {SHARE_INVITE_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="רמת הרשאה"
                        value={invite.permission_level}
                        onChange={(e) => void updateInvitePermission(invite.id, e.target.value as PermissionLevel)}
                        className="h-9 rounded-lg border border-border bg-muted/50 px-2 text-xs"
                      >
                        {(['view', 'edit', 'admin'] as const).map((level) => (
                          <option key={level} value={level}>
                            {PERMISSION_LABELS[level]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="שלח מייל שוב"
                        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
                        onClick={() => {
                          if (!user) return;
                          void resendInvite(invite.id, user.id);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="בטל הזמנה"
                        className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (window.confirm('לבטל את ההזמנה?')) void cancelInvite(invite.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
