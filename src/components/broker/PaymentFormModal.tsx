import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { validatePositiveNumber, validateRequired } from '../../lib/validation';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from '../../types/domain';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

export interface PaymentFormValues {
  amount: string;
  due_date: string;
  payment_date: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  receipt_number: string;
  notes: string;
}

const EMPTY: PaymentFormValues = {
  amount: '',
  due_date: '',
  payment_date: '',
  status: 'pending',
  payment_method: 'transfer',
  receipt_number: '',
  notes: '',
};

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PaymentFormValues>;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  title?: string;
  showLeaseSelect?: boolean;
  leases?: Array<{ id: string; label: string }>;
  leaseId?: string;
  onLeaseChange?: (id: string) => void;
}

export function PaymentFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'תשלום',
  showLeaseSelect,
  leases = [],
  leaseId,
  onLeaseChange,
}: PaymentFormModalProps) {
  const [form, setForm] = useState<PaymentFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial });
      setErrors({});
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (showLeaseSelect && !leaseId) next.lease = 'יש לבחור חוזה';
    const amount = validatePositiveNumber(form.amount, true);
    if (!amount.isValid) next.amount = amount.error!;
    const due = validateRequired(form.due_date, 'תאריך יעד');
    if (!due.isValid) next.due_date = due.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {showLeaseSelect && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">חוזה</label>
            <select
              className={SELECT_CLASS}
              value={leaseId ?? ''}
              onChange={(e) => onLeaseChange?.(e.target.value)}
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
              <p className="text-xs text-muted-foreground">אין חוזים פעילים — צור חוזה לפני הוספת תשלום</p>
            )}
          </div>
        )}
        <Input
          label="סכום (₪)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          error={errors.amount}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="תאריך יעד"
            type="date"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            error={errors.due_date}
            required
          />
          <Input
            label="תאריך תשלום"
            type="date"
            value={form.payment_date}
            onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סוג תשלום</label>
            <select
              className={SELECT_CLASS}
              value={form.payment_method}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select
              className={SELECT_CLASS}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as PaymentStatus })}
            >
              {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="מספר קבלה / אסמכתא"
          value={form.receipt_number}
          onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
        />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">הערות</label>
          <textarea
            className="min-h-16 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving || (showLeaseSelect && leases.length === 0)}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
