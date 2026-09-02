import { Check, Copy, Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notifyEntityCreated } from '../../contexts/QuickAddContext';
import { createPaymentRequest, fetchLeases, getPaymentCheckoutUrl } from '../../lib/services';
import { validatePositiveNumber, validateRequired } from '../../lib/validation';
import {
  PAYMENT_REQUEST_TYPE_LABELS,
  type PaymentRequestType,
} from '../../types/domain';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

interface PaymentRequestModalProps {
  open: boolean;
  onClose: () => void;
  propertyId?: string;
  leaseId?: string;
}

export function PaymentRequestModal({ open, onClose, propertyId, leaseId: initialLeaseId }: PaymentRequestModalProps) {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Array<{ id: string; label: string; monthly_rent?: number }>>([]);
  const [leaseId, setLeaseId] = useState(initialLeaseId ?? '');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentRequestType>('rent');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setCheckoutUrl('');
    setCopied(false);
    setErrors({});
    void fetchLeases(user.id).then((rows) => {
      const filtered = propertyId ? rows.filter((l) => l.property_id === propertyId) : rows;
      setLeases(
        filtered.map((l) => ({
          id: l.id,
          label: `${l.tenant_name} · ${l.property_title ?? ''} · יחידה ${l.unit_number ?? '—'}`,
          monthly_rent: l.monthly_rent,
        })),
      );
      const nextLease = initialLeaseId ?? filtered[0]?.id ?? '';
      setLeaseId(nextLease);
      const lease = filtered.find((l) => l.id === nextLease);
      setAmount(lease?.monthly_rent ? String(lease.monthly_rent) : '');
      setDueDate(new Date().toISOString().slice(0, 10));
      setPaymentType('rent');
      setNotes('');
    });
  }, [open, user?.id, propertyId, initialLeaseId]);

  useEffect(() => {
    if (!leaseId) return;
    const lease = leases.find((l) => l.id === leaseId);
    if (lease?.monthly_rent && paymentType === 'rent' && !amount) {
      setAmount(String(lease.monthly_rent));
    }
  }, [leaseId, leases, paymentType, amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    const next: Record<string, string> = {};
    if (!leaseId) next.lease = 'יש לבחור חוזה';
    const amountCheck = validatePositiveNumber(amount, true);
    if (!amountCheck.isValid) next.amount = amountCheck.error!;
    const dueCheck = validateRequired(dueDate, 'תאריך יעד');
    if (!dueCheck.isValid) next.due_date = dueCheck.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const result = await createPaymentRequest(user.id, {
        lease_id: leaseId,
        amount: Number(amount),
        due_date: dueDate,
        payment_type: paymentType,
        notes: notes.trim() || undefined,
      });
      const url = getPaymentCheckoutUrl(result.checkout_slug);
      setCheckoutUrl(url);
      notifyEntityCreated('payment');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!checkoutUrl) return;
    await navigator.clipboard.writeText(checkoutUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="צור דרישת תשלום" size="lg">
      {checkoutUrl ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            דרישת התשלום נוצרה. שלח/י את הקישור לשוכר לתשלום מקוון.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <Link2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 flex-1 truncate text-sm font-mono" dir="ltr">
              {checkoutUrl}
            </span>
            <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'הועתק' : 'העתק'}
            </Button>
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={onClose}>
              סגור
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">חוזה</label>
            <select
              className={SELECT_CLASS}
              value={leaseId}
              onChange={(e) => {
                setLeaseId(e.target.value);
                const lease = leases.find((l) => l.id === e.target.value);
                if (lease?.monthly_rent && paymentType === 'rent') {
                  setAmount(String(lease.monthly_rent));
                }
              }}
              required
            >
              <option value="">בחר חוזה...</option>
              {leases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            {errors.lease && <p className="text-sm text-destructive">{errors.lease}</p>}
            {leases.length === 0 && (
              <p className="text-xs text-muted-foreground">אין חוזים פעילים — צור חוזה לפני יצירת דרישת תשלום</p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">סוג דרישה</label>
              <select
                className={SELECT_CLASS}
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentRequestType)}
              >
                {Object.entries(PAYMENT_REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="סכום (₪)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={errors.amount}
              required
            />
          </div>

          <Input
            label="תאריך יעד"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={errors.due_date}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium">הערות לשוכר (אופציונלי)</label>
            <textarea
              className="min-h-16 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="לדוגמה: דמי שכירות לחודש ספטמבר"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={saving || leases.length === 0}>
              {saving ? 'יוצר...' : 'צור קישור תשלום'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
