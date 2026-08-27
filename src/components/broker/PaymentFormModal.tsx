import { useEffect, useState } from 'react';
import type { Lease } from '../../types/domain';
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type PaymentMethod, type PaymentStatus } from '../../types/domain';
import { validatePositiveNumber, validateRequired } from '../../lib/validation';
import { Button } from '../ui/Button';
import { FormSection } from '../ui/FormSection';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

export interface PaymentFormValues {
  lease_id?: string;
  amount: string;
  due_date: string;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  receipt_number?: string;
  notes?: string;
}

const EMPTY: PaymentFormValues = {
  amount: '',
  due_date: '',
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
  mode?: 'create' | 'edit';
  leases?: Lease[];
  loadingLeases?: boolean;
}

export function PaymentFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'תשלום',
  mode = 'edit',
  leases = [],
  loadingLeases = false,
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
    if (mode === 'create') {
      const lease = validateRequired(form.lease_id ?? '', 'חוזה');
      if (!lease.isValid) next.lease_id = lease.error!;
    }
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
        {mode === 'create' && (
          <FormSection title="שיוך לחוזה">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">חוזה</label>
              <select
                className={SELECT_CLASS}
                value={form.lease_id ?? ''}
                onChange={(e) => setForm({ ...form, lease_id: e.target.value })}
                disabled={loadingLeases}
              >
                <option value="">{loadingLeases ? 'טוען חוזים...' : 'בחר חוזה'}</option>
                {leases.map((lease) => (
                  <option key={lease.id} value={lease.id}>
                    {lease.tenant_name} — {lease.property_title} / {lease.unit_number}
                  </option>
                ))}
              </select>
              {errors.lease_id && <p className="text-sm text-destructive">{errors.lease_id}</p>}
            </div>
          </FormSection>
        )}

        <FormSection title="פרטי תשלום">
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">אמצעי תשלום</label>
            <select
              className={SELECT_CLASS}
              value={form.payment_method ?? 'transfer'}
              onChange={(e) => setForm({ ...form, payment_method: e.target.value as PaymentMethod })}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="מספר קבלה / אסמכתא"
            value={form.receipt_number ?? ''}
            onChange={(e) => setForm({ ...form, receipt_number: e.target.value })}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">הערות</label>
            <textarea
              className="min-h-20 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : mode === 'create' ? 'צור תשלום' : 'שמור'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
