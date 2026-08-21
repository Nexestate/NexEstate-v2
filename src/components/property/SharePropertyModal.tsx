import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { usePropertyShares } from '../../hooks/usePropertyShares';
import { PERMISSION_LABELS, type PermissionLevel } from '../../lib/permissions';
import { validateEmail } from '../../lib/validation';

interface SharePropertyModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

export function SharePropertyModal({
  open,
  onClose,
  propertyId,
  propertyTitle,
}: SharePropertyModalProps) {
  const { user } = useAuth();
  const { shareProperty } = usePropertyShares(propertyId);
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [permission, setPermission] = useState<PermissionLevel>('view');
  const [role, setRole] = useState('owner');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setEmail('');
    setRecipientName('');
    setPermission('view');
    setRole('owner');
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
    setTimeout(() => {
      handleClose();
    }, 1200);
  };

  return (
    <Modal open={open} onClose={handleClose} title={`שיתוף — ${propertyTitle}`}>
      <div className="space-y-4">
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
          <label className="text-sm font-medium">רמת הרשאה</label>
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
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">תפקיד מיועד</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
          >
            <option value="owner">בעל נכס</option>
            <option value="manager">חברת ניהול</option>
            <option value="partner">שותף</option>
            <option value="buyer">קונה / שוכר</option>
          </select>
        </div>

        <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
          {email ? (
            <>
              הזמנה תישלח ל-<Badge variant="primary">{email}</Badge> עם הרשאת{' '}
              {PERMISSION_LABELS[permission]}
            </>
          ) : (
            'המוזמן יקבל מייל עם קישור לצפייה בנכס'
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}

        <Button className="w-full" onClick={handleSend} disabled={!email || sending}>
          {sending ? 'שולח...' : message ? 'נשלח!' : 'שלח הזמנה'}
        </Button>
      </div>
    </Modal>
  );
}
