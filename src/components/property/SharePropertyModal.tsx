import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { usePropertyShares } from '../../hooks/usePropertyShares';
import { PERMISSION_DESCRIPTIONS, PERMISSION_LABELS, type PermissionLevel } from '../../lib/permissions';
import { ROLE_LABELS, SHARE_INVITE_ROLE_HINTS, SHARE_INVITE_ROLES, type ShareInviteRole } from '../../lib/roles';
import { validateEmail } from '../../lib/validation';

interface SharePropertyModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  onShared?: () => void;
}

export function SharePropertyModal({
  open,
  onClose,
  propertyId,
  propertyTitle,
  onShared,
}: SharePropertyModalProps) {
  const { user } = useAuth();
  const { shareProperty } = usePropertyShares(propertyId);
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [role, setRole] = useState<ShareInviteRole>('partner');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setEmail('');
    setRecipientName('');
    setPermission('view');
    setRole('partner');
    setMessage('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSend = async () => {
    const emailCheck = validateEmail(email, true);
    if (!emailCheck.isValid) {
      setError(emailCheck.error ?? 'אימייל לא תקין');
      return;
    }
    if (!user) {
      setError('יש להתחבר תחילה');
      return;
    }

    setSending(true);
    setError('');
    setMessage('');

    const result = await shareProperty(
      email,
      permission,
      user.id,
      undefined,
      recipientName || undefined,
      role,
    );

    setSending(false);

    if (!result.success) {
      setError(result.error ?? 'שגיאה בשליחה');
      return;
    }

    setMessage(result.message ?? 'נשלח בהצלחה');
    onShared?.();
    setTimeout(() => {
      handleClose();
    }, 1400);
  };

  return (
    <Modal open={open} onClose={handleClose} title={`שיתוף — ${propertyTitle}`}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          אם הנמען עדיין לא רשום — יישלח מייל בעברית עם קישור להרשמה. אחרי ההרשמה הגישה והתפקיד יתווספו אוטומטית.
        </p>

        <Input
          label="אימייל המוזמן"
          type="email"
          placeholder="guest@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="שם המוזמן (אופציונלי)"
          type="text"
          placeholder="ישראל ישראלי"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="text-sm font-medium">רמת הרשאה בנכס</label>
          <div className="flex gap-2">
            {(['view', 'edit', 'admin'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPermission(p)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  permission === p
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border'
                }`}
              >
                {PERMISSION_LABELS[p]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{PERMISSION_DESCRIPTIONS[permission]}</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">תפקיד אחרי הרשמה</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as ShareInviteRole)}
            className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
          >
            {SHARE_INVITE_ROLES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{SHARE_INVITE_ROLE_HINTS[role]}</p>
        </div>

        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {email ? (
            <>
              יישלח מייל ל-<Badge variant="primary">{email}</Badge> עם הרשאת{' '}
              {PERMISSION_LABELS[permission]} ותפקיד {ROLE_LABELS[role]}
            </>
          ) : (
            'המוזמן יקבל מייל בעברית עם קישור לצפייה בנכס המנוהל'
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <Button className="w-full" onClick={() => void handleSend()} disabled={!email || sending}>
          {sending ? 'שולח...' : message ? 'נשלח!' : 'שלח הזמנה'}
        </Button>
      </div>
    </Modal>
  );
}
