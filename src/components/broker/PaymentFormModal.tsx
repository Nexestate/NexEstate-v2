import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { validatePositiveNumber, validateRequired } from '../../lib/validation';
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from '../../types/domain';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

export interface PaymentFormValues {
  amount: string;
  due_date: string;
  status: PaymentStatus;
}

const EMPTY: PaymentFormValues = {
  amount: '',
  due_date: '',
  status: 'pending',
};

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PaymentFormValues>;
  onSubmit: (values: PaymentFormValues) => Promise<void>;
  title?: string;
}

export function PaymentFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'תשלום',
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
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="סכום (₪)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          error={errors.amount}
          required
        />
        <Input
          label="תאריך יעד"
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          error={errors.due_date}
          required
        />
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
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמור'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
