import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {
  validateRequired,
  validatePositiveNumber,
  sanitizePrice,
} from '../../lib/validation';
import { PROPERTY_KIND_LABELS, PROPERTY_STATUS_LABELS } from '../../lib/constants';
import type { PropertyKind, PropertyStatus, PropertyVisibility } from '../../types';

export interface PropertyFormValues {
  title: string;
  kind: PropertyKind;
  status: PropertyStatus;
  visibility: PropertyVisibility;
  price: string;
  city: string;
  address: string;
  rooms: string;
  bathrooms: string;
  area_sqm: string;
  floor: string;
  total_floors: string;
  parking_spots: string;
  year_built: string;
  lat: string;
  lng: string;
  description: string;
  featured: boolean;
}

const EMPTY: PropertyFormValues = {
  title: '',
  kind: 'apartment',
  status: 'for_sale',
  visibility: 'private',
  price: '',
  city: '',
  address: '',
  rooms: '',
  bathrooms: '',
  area_sqm: '',
  floor: '',
  total_floors: '',
  parking_spots: '',
  year_built: '',
  lat: '',
  lng: '',
  description: '',
  featured: false,
};

const VISIBILITY_LABELS: Record<PropertyVisibility, string> = {
  private: 'פרטי',
  public: 'ציבורי',
  off_market: 'מחוץ לשוק',
  auction: 'מכירה פומבית',
};

interface PropertyFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<PropertyFormValues>;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  title?: string;
}

export function PropertyFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'נכס חדש',
}: PropertyFormModalProps) {
  const [form, setForm] = useState<PropertyFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...EMPTY, ...initial });
  }, [open, initial]);

  const set = (key: keyof PropertyFormValues, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const t = validateRequired(form.title, 'כותרת');
    if (!t.isValid) next.title = t.error!;
    const c = validateRequired(form.city, 'עיר');
    if (!c.isValid) next.city = c.error!;
    const p = validatePositiveNumber(form.price, true);
    if (!p.isValid) next.price = p.error!;
    if (form.bathrooms) {
      const b = validatePositiveNumber(form.bathrooms);
      if (!b.isValid) next.bathrooms = b.error!;
    }
    if (form.lat) {
      const n = Number(form.lat);
      if (Number.isNaN(n) || n < -90 || n > 90) next.lat = 'קו רוחב לא תקין';
    }
    if (form.lng) {
      const n = Number(form.lng);
      if (Number.isNaN(n) || n < -180 || n > 180) next.lng = 'קו אורך לא תקין';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch {
      setErrors({ form: 'שגיאה בשמירה' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-3 overflow-y-auto pe-1">
        <Input
          label="כותרת"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
          error={errors.title}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סוג נכס</label>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
              value={form.kind}
              onChange={(e) => set('kind', e.target.value)}
            >
              {Object.entries(PROPERTY_KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select
              className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {Object.entries(PROPERTY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">נראות</label>
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm"
            value={form.visibility}
            onChange={(e) => set('visibility', e.target.value)}
          >
            {Object.entries(VISIBILITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="מחיר"
            value={form.price}
            onChange={(e) => set('price', sanitizePrice(e.target.value))}
            required
            error={errors.price}
          />
          <Input
            label="עיר"
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            required
            error={errors.city}
          />
        </div>
        <Input
          label="כתובת"
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="חדרים" value={form.rooms} onChange={(e) => set('rooms', e.target.value)} />
          <Input
            label="חדרי רחצה"
            value={form.bathrooms}
            onChange={(e) => set('bathrooms', e.target.value)}
            error={errors.bathrooms}
          />
          <Input
            label='שטח מ"ר'
            value={form.area_sqm}
            onChange={(e) => set('area_sqm', sanitizePrice(e.target.value))}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="קומה" value={form.floor} onChange={(e) => set('floor', e.target.value)} />
          <Input
            label="סה״כ קומות"
            value={form.total_floors}
            onChange={(e) => set('total_floors', e.target.value)}
          />
          <Input
            label="חניות"
            value={form.parking_spots}
            onChange={(e) => set('parking_spots', e.target.value)}
          />
        </div>
        <Input
          label="שנת בנייה"
          value={form.year_built}
          onChange={(e) => set('year_built', e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="קו רוחב (lat)"
            value={form.lat}
            onChange={(e) => set('lat', e.target.value)}
            error={errors.lat}
          />
          <Input
            label="קו אורך (lng)"
            value={form.lng}
            onChange={(e) => set('lng', e.target.value)}
            error={errors.lng}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">תיאור</label>
          <textarea
            className="min-h-24 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="rounded border-border"
          />
          נכס מובלט (featured)
        </label>
        {errors.form && <p className="text-sm text-destructive">{errors.form}</p>}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'שומר...' : 'שמור נכס'}
        </Button>
      </form>
    </Modal>
  );
}

export function propertyFormToPayload(form: PropertyFormValues, brokerId: string) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    title: form.title.trim(),
    kind: form.kind,
    status: form.status,
    visibility: form.visibility,
    price: Number(form.price) || 0,
    city: form.city.trim(),
    address: form.address.trim(),
    rooms: num(form.rooms),
    bathrooms: num(form.bathrooms),
    area_sqm: num(form.area_sqm),
    floor: num(form.floor),
    total_floors: num(form.total_floors),
    parking_spots: num(form.parking_spots),
    year_built: num(form.year_built),
    lat: num(form.lat),
    lng: num(form.lng),
    description: form.description.trim() || null,
    featured: form.featured,
    broker_id: brokerId,
  };
}
