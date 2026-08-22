import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { validatePositiveNumber, validateRequired } from '../../lib/validation';
import { UNIT_STATUS_LABELS, type UnitStatus } from '../../types/domain';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

export interface UnitFormValues {
  unit_number: string;
  unit_name: string;
  area_sqm: string;
  monthly_rent: string;
  unit_status: UnitStatus;
  floor: string;
}

const EMPTY: UnitFormValues = {
  unit_number: '',
  unit_name: '',
  area_sqm: '',
  monthly_rent: '',
  unit_status: 'available',
  floor: '',
};

interface UnitFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<UnitFormValues>;
  onSubmit: (values: UnitFormValues) => Promise<void>;
  title?: string;
}

export function UnitFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'יחידה חדשה',
}: UnitFormModalProps) {
  const [form, setForm] = useState<UnitFormValues>({ ...EMPTY, ...initial });
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
    const number = validateRequired(form.unit_number, 'מספר יחידה');
    if (!number.isValid) next.unit_number = number.error!;
    if (form.area_sqm) {
      const area = validatePositiveNumber(form.area_sqm, false);
      if (!area.isValid) next.area_sqm = area.error!;
    }
    if (form.monthly_rent) {
      const rent = validatePositiveNumber(form.monthly_rent, false);
      if (!rent.isValid) next.monthly_rent = rent.error!;
    }
    if (form.floor) {
      const floor = validatePositiveNumber(form.floor, false);
      if (!floor.isValid) next.floor = floor.error!;
    }
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
          label="מספר יחידה"
          value={form.unit_number}
          onChange={(e) => setForm({ ...form, unit_number: e.target.value })}
          error={errors.unit_number}
          required
        />
        <Input
          label="שם / תיאור"
          value={form.unit_name}
          onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label='שטח (מ"ר)'
            value={form.area_sqm}
            onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
            error={errors.area_sqm}
          />
          <Input
            label='שכ"ד חודשי (₪)'
            value={form.monthly_rent}
            onChange={(e) => setForm({ ...form, monthly_rent: e.target.value })}
            error={errors.monthly_rent}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select
              className={SELECT_CLASS}
              value={form.unit_status}
              onChange={(e) => setForm({ ...form, unit_status: e.target.value as UnitStatus })}
            >
              {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="קומה"
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: e.target.value })}
            error={errors.floor}
          />
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
