import { useEffect, useState } from 'react';
import { PROPERTY_KIND_LABELS } from '../../lib/constants';
import type { ClientPayload } from '../../lib/services';
import type { ClientType, PropertyKind } from '../../types/domain';
import { CLIENT_TYPE_LABELS } from '../../types/domain';
import {
  validateEmail,
  validateName,
  validatePhone,
  validatePositiveNumber,
  sanitizePhone,
} from '../../lib/validation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

const DEMAND_TYPES: ClientType[] = ['buyer', 'renter', 'investor'];
const SUPPLY_TYPES: ClientType[] = ['seller', 'landlord'];

export function isDemandClientType(type: ClientType): boolean {
  return DEMAND_TYPES.includes(type);
}

export type ClientFormValues = ClientPayload;

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  title?: string;
  properties?: Array<{ id: string; title: string }>;
}

function parseCities(raw: string): string[] {
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

export function ClientFormModal({
  open,
  onClose,
  initial,
  onSubmit,
  title = 'לקוח חדש',
  properties = [],
}: ClientFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [clientSide, setClientSide] = useState<'demand' | 'supply'>('demand');
  const [type, setType] = useState<ClientType>('buyer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [citiesRaw, setCitiesRaw] = useState('');
  const [kinds, setKinds] = useState<PropertyKind[]>([]);
  const [minRooms, setMinRooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [linkedPropertyId, setLinkedPropertyId] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initType = initial?.type ?? 'buyer';
    setFullName(initial?.full_name ?? '');
    setClientSide(isDemandClientType(initType) ? 'demand' : 'supply');
    setType(initType);
    setPhone(initial?.phone ?? '');
    setEmail(initial?.email ?? '');
    setBudgetMin(initial?.budget_min != null ? String(initial.budget_min) : '');
    setBudgetMax(initial?.budget_max != null ? String(initial.budget_max) : '');
    setCitiesRaw(initial?.preferred_cities?.join(', ') ?? '');
    setKinds(initial?.preferred_kinds ?? []);
    setMinRooms(initial?.min_rooms != null ? String(initial.min_rooms) : '');
    setMinArea(initial?.min_area != null ? String(initial.min_area) : '');
    setLinkedPropertyId(initial?.linked_property_id ?? '');
    setNotes(initial?.notes ?? '');
    setSource(initial?.source ?? '');
    setErrors({});
  }, [open, initial]);

  const toggleKind = (kind: PropertyKind) => {
    setKinds((prev) => (prev.includes(kind) ? prev.filter((k) => k !== kind) : [...prev, kind]));
  };

  const handleSideChange = (side: 'demand' | 'supply') => {
    setClientSide(side);
    setType(side === 'demand' ? 'buyer' : 'seller');
  };

  const buildPayload = (): ClientFormValues => ({
    full_name: fullName.trim(),
    type,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
    budget_min: budgetMin ? Number(budgetMin) : undefined,
    budget_max: budgetMax ? Number(budgetMax) : undefined,
    preferred_cities: parseCities(citiesRaw),
    preferred_kinds: kinds.length ? kinds : undefined,
    min_rooms: minRooms ? Number(minRooms) : undefined,
    min_area: minArea ? Number(minArea) : undefined,
    linked_property_id: linkedPropertyId || undefined,
    notes: notes.trim() || undefined,
    source: source.trim() || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = validateName(fullName);
    if (!name.isValid) next.full_name = name.error!;
    if (phone) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.isValid) next.phone = phoneResult.error!;
    }
    if (email) {
      const emailResult = validateEmail(email);
      if (!emailResult.isValid) next.email = emailResult.error!;
    }
    if (budgetMin) {
      const r = validatePositiveNumber(budgetMin);
      if (!r.isValid) next.budget_min = r.error!;
    }
    if (budgetMax) {
      const r = validatePositiveNumber(budgetMax);
      if (!r.isValid) next.budget_max = r.error!;
    }
    if (minRooms) {
      const r = validatePositiveNumber(minRooms, true);
      if (!r.isValid) next.min_rooms = r.error!;
    }
    if (minArea) {
      const r = validatePositiveNumber(minArea);
      if (!r.isValid) next.min_area = r.error!;
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit(buildPayload());
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = clientSide === 'demand' ? DEMAND_TYPES : SUPPLY_TYPES;

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto pe-1">
        <Input
          label="שם מלא"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.full_name}
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">צד עסקה</label>
            <select
              className={SELECT_CLASS}
              value={clientSide}
              onChange={(e) => handleSideChange(e.target.value as 'demand' | 'supply')}
            >
              <option value="demand">קונה / שוכר</option>
              <option value="supply">מוכר / משכיר</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סוג לקוח</label>
            <select
              className={SELECT_CLASS}
              value={type}
              onChange={(e) => setType(e.target.value as ClientType)}
            >
              {typeOptions.map((value) => (
                <option key={value} value={value}>
                  {CLIENT_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="טלפון"
            value={phone}
            onChange={(e) => setPhone(sanitizePhone(e.target.value))}
            error={errors.phone}
          />
          <Input
            label='דוא"ל'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
        </div>

        {clientSide === 'demand' ? (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-primary">פרופיל ביקוש</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="תקציב מינימלי (₪)"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                error={errors.budget_min}
              />
              <Input
                label="תקציב מקסימלי (₪)"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                error={errors.budget_max}
              />
            </div>
            <Input
              label="ערים מבוקשות"
              value={citiesRaw}
              onChange={(e) => setCitiesRaw(e.target.value)}
              placeholder="תל אביב, חיפה, כרמיאל..."
            />
            <div className="space-y-2">
              <label className="text-sm font-medium">סוגי נכס</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(PROPERTY_KIND_LABELS) as [PropertyKind, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleKind(value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        kinds.includes(value)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="חדרים מינימום"
                value={minRooms}
                onChange={(e) => setMinRooms(e.target.value)}
                error={errors.min_rooms}
              />
              <Input
                label={'שטח מינימום (מ"ר)'}
                value={minArea}
                onChange={(e) => setMinArea(e.target.value)}
                error={errors.min_area}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-primary">שיוך לנכס</p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">נכס קיים</label>
              <select
                className={SELECT_CLASS}
                value={linkedPropertyId}
                onChange={(e) => setLinkedPropertyId(e.target.value)}
              >
                <option value="">— בחר נכס —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <Input label="מקור" value={source} onChange={(e) => setSource(e.target.value)} placeholder="המלצה, פייסבוק..." />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">הערות</label>
          <textarea
            className="min-h-16 w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : initial?.full_name ? 'שמור' : 'הוסף לקוח'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
