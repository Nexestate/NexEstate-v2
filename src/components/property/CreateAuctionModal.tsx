import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { validateRequired, validatePositiveNumber, sanitizePrice } from '../../lib/validation';

export interface AuctionFormValues {
  title: string;
  description: string;
  start_price: string;
  reserve_price: string;
  min_increment: string;
  starts_at: string;
  ends_at: string;
  property_id: string;
}

interface CreateAuctionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: AuctionFormValues) => Promise<void>;
  propertyOptions?: { id: string; title: string }[];
}

const EMPTY: AuctionFormValues = {
  title: '',
  description: '',
  start_price: '',
  reserve_price: '',
  min_increment: '',
  starts_at: '',
  ends_at: '',
  property_id: '',
};

export function CreateAuctionModal({
  open,
  onClose,
  onSubmit,
  propertyOptions = [],
}: CreateAuctionModalProps) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AuctionFormValues, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const t = validateRequired(form.title, 'כותרת');
    if (!t.isValid) next.title = t.error!;
    const sp = validatePositiveNumber(form.start_price, true);
    if (!sp.isValid) next.start_price = sp.error!;
    if (!form.starts_at) next.starts_at = 'שדה חובה';
    if (!form.ends_at) next.ends_at = 'שדה חובה';
    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      next.ends_at = 'תאריך סיום חייב להיות אחרי ההתחלה';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit(form);
      setForm(EMPTY);
      onClose();
    } catch {
      setErrors({ form: 'שגיאה ביצירת המכרז' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="מכרז חדש">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="כותרת"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          error={errors.title}
        />
        {propertyOptions.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">נכס</label>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
              value={form.property_id}
              onChange={(e) => set('property_id', e.target.value)}
            >
              <option value="">— ללא —</option>
              {propertyOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">תיאור</label>
          <textarea
            className="min-h-20 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="מחיר התחלה"
            value={form.start_price}
            onChange={(e) => set('start_price', sanitizePrice(e.target.value))}
            required
            error={errors.start_price}
          />
          <Input
            label="מחיר מינימום"
            value={form.reserve_price}
            onChange={(e) => set('reserve_price', sanitizePrice(e.target.value))}
          />
          <Input
            label="קפיצה מינימלית"
            value={form.min_increment}
            onChange={(e) => set('min_increment', sanitizePrice(e.target.value))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="התחלה"
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => set('starts_at', e.target.value)}
            required
            error={errors.starts_at}
          />
          <Input
            label="סיום"
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => set('ends_at', e.target.value)}
            required
            error={errors.ends_at}
          />
        </div>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'יוצר...' : 'צור מכרז'}
        </Button>
      </form>
    </Modal>
  );
}
