import { useEffect, useMemo, useState } from 'react';
import { fetchProperty, fetchTenants } from '../../lib/services';
import type { UnitInsert } from '../../lib/services/unitsService';
import type { UnitOccupancyMode, UnitOnboardingSubmit } from '../../lib/services/unitOnboardingService';
import { UNIT_AMENITY_OPTIONS } from '../../lib/unitAmenities';
import {
  PAYMENT_METHOD_LABELS,
  TENANT_TYPE_LABELS,
  UNIT_STATUS_LABELS,
  UNIT_TYPE_LABELS,
  type PaymentMethod,
  type Tenant,
  type TenantType,
  type UnitStatus,
  type UnitType,
} from '../../types/domain';
import {
  sanitizePhone,
  validateEmail,
  validateName,
  validatePhone,
  validatePositiveNumber,
  validateRequired,
} from '../../lib/validation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SlidePanel } from '../ui/SlidePanel';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

interface UnitOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  propertyId?: string;
  brokerId: string;
  onSubmit: (payload: UnitOnboardingSubmit) => Promise<void>;
}

export function UnitOnboardingModal({
  open,
  onClose,
  propertyId,
  brokerId,
  onSubmit,
}: UnitOnboardingModalProps) {
  const [propertyTitle, setPropertyTitle] = useState('');
  const [occupancy, setOccupancy] = useState<UnitOccupancyMode>('vacant');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitName, setUnitName] = useState('');
  const [unitType, setUnitType] = useState<UnitType>('office');
  const [unitStatus, setUnitStatus] = useState<UnitStatus>('available');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [areaSqm, setAreaSqm] = useState('');
  const [rooms, setRooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [managementFee, setManagementFee] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');

  const [tenantType, setTenantType] = useState<TenantType>('sole_proprietor');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedTenant = useMemo(() => tenants.find((t) => t.id === tenantId), [tenants, tenantId]);

  const resetForm = () => {
    setOccupancy('vacant');
    setUnitNumber('');
    setUnitName('');
    setUnitType('office');
    setUnitStatus('available');
    setBuilding('');
    setFloor('');
    setAreaSqm('');
    setRooms('');
    setBathrooms('');
    setMonthlyRent('');
    setManagementFee('');
    setDescription('');
    setNotes('');
    setAmenities([]);
    setStartDate('');
    setEndDate('');
    setDeposit('');
    setPaymentMethod('transfer');
    setFullName('');
    setIdNumber('');
    setCompanyName('');
    setCompanyNumber('');
    setContactName('');
    setPhone('');
    setEmail('');
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    setErrors({});
    setLoadError(null);
    if (!propertyId) {
      setPropertyTitle('');
      setTenants([]);
      return;
    }
    void Promise.all([fetchProperty(propertyId), fetchTenants(brokerId)])
      .then(([property, allTenants]) => {
        if (!property) {
          setLoadError('לא ניתן לטעון את הנכס');
          return;
        }
        setPropertyTitle(property.title);
        const propertyTenants = allTenants.filter(
          (t) => !t.property_id || t.property_id === propertyId,
        );
        setTenants(propertyTenants.length > 0 ? propertyTenants : allTenants);
        setTenantId((propertyTenants[0] ?? allTenants[0])?.id ?? '');
      })
      .catch(() => setLoadError('שגיאה בטעינת נתוני הנכס'));
  }, [open, propertyId, brokerId]);

  useEffect(() => {
    if (occupancy === 'vacant') {
      if (unitStatus === 'occupied') setUnitStatus('available');
      return;
    }
    setUnitStatus('occupied');
  }, [occupancy, unitStatus]);

  const toggleAmenity = (id: string) => {
    setAmenities((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const validateLeaseFields = (next: Record<string, string>) => {
    const rent = validatePositiveNumber(monthlyRent, true);
    if (!rent.isValid) next.monthly_rent = rent.error!;
    const start = validateRequired(startDate, 'תאריך התחלה');
    if (!start.isValid) next.start_date = start.error!;
    const end = validateRequired(endDate, 'תאריך סיום');
    if (!end.isValid) next.end_date = end.error!;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      setErrors({ property: 'יש לבחור נכס לפני הוספת יחידה' });
      return;
    }

    const next: Record<string, string> = {};
    const number = validateRequired(unitNumber, 'מספר יחידה');
    if (!number.isValid) next.unit_number = number.error!;
    if (areaSqm) {
      const area = validatePositiveNumber(areaSqm, false);
      if (!area.isValid) next.area_sqm = area.error!;
    }
    if (floor) {
      const f = validatePositiveNumber(floor, false);
      if (!f.isValid) next.floor = f.error!;
    }
    if (managementFee) {
      const fee = validatePositiveNumber(managementFee, false);
      if (!fee.isValid) next.management_fee = fee.error!;
    }

    if (occupancy === 'existing_tenant') {
      if (!tenantId) next.tenant_id = 'יש לבחור שוכר';
      validateLeaseFields(next);
    }

    if (occupancy === 'new_tenant') {
      const name = validateName(fullName);
      if (!name.isValid) next.full_name = name.error!;
      if (tenantType === 'sole_proprietor') {
        const idReq = validateRequired(idNumber, 'ת.ז.');
        if (!idReq.isValid) next.id_number = idReq.error!;
      } else {
        const cn = validateRequired(companyName, 'שם חברה');
        if (!cn.isValid) next.company_name = cn.error!;
        const cr = validateRequired(companyNumber, 'ח.פ.');
        if (!cr.isValid) next.company_number = cr.error!;
      }
      if (phone) {
        const phoneResult = validatePhone(phone);
        if (!phoneResult.isValid) next.phone = phoneResult.error!;
      }
      if (email) {
        const emailResult = validateEmail(email);
        if (!emailResult.isValid) next.email = emailResult.error!;
      }
      validateLeaseFields(next);
    }

    setErrors(next);
    if (Object.keys(next).length) return;

    const unitPayload: UnitInsert = {
      property_id: propertyId,
      broker_id: brokerId,
      unit_number: unitNumber.trim(),
      unit_name: unitName.trim() || undefined,
      unit_type: unitType,
      unit_status: unitStatus,
      building: building.trim() || undefined,
      floor: floor ? Number(floor) : undefined,
      area_sqm: areaSqm ? Number(areaSqm) : undefined,
      rooms: rooms ? Number(rooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      monthly_rent: monthlyRent ? Number(monthlyRent) : undefined,
      management_fee: managementFee ? Number(managementFee) : undefined,
      amenities,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setSaving(true);
    try {
      const payload: UnitOnboardingSubmit = { unit: unitPayload, occupancy };

      if (occupancy === 'existing_tenant' && selectedTenant) {
        payload.existingTenant = {
          property_id: propertyId,
          unit_id: '',
          tenant_id: selectedTenant.id,
          tenant_name: selectedTenant.full_name,
          start_date: startDate,
          end_date: endDate,
          monthly_rent: Number(monthlyRent),
          deposit: deposit ? Number(deposit) : undefined,
          payment_method: paymentMethod,
        };
      }

      if (occupancy === 'new_tenant') {
        payload.newTenant = {
          tenant_type: tenantType,
          full_name: fullName.trim(),
          id_number: idNumber.trim() || undefined,
          company_name: companyName.trim() || undefined,
          company_number: companyNumber.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          start_date: startDate,
          end_date: endDate,
          monthly_rent: Number(monthlyRent),
          deposit: deposit ? Number(deposit) : undefined,
          payment_method: paymentMethod,
        };
      }

      await onSubmit(payload);
      resetForm();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const occupancyOptions: { id: UnitOccupancyMode; label: string }[] = [
    { id: 'vacant', label: 'פנוי / ללא שוכר' },
    { id: 'existing_tenant', label: 'שוכר קיים' },
    { id: 'new_tenant', label: 'שוכר חדש' },
  ];

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="יחידה חדשה"
      className="max-w-xl"
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2 border-t border-border/80 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" form="unit-onboarding-form" disabled={saving || !propertyId}>
            {saving ? 'שומר...' : 'שמור יחידה'}
          </Button>
        </div>
      }
    >
      <form id="unit-onboarding-form" onSubmit={handleSubmit} className="space-y-8 px-5 py-4">
        {!propertyId && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            הוספת יחידה מלאה זמינה מתוך דף נכס מנוהל או מרשימת יחידות עם סינון נכס.
          </p>
        )}

        {propertyId && (
          <p className="text-meta">
            נכס: <span className="font-semibold text-foreground">{propertyTitle || '…'}</span>
          </p>
        )}

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}
        {errors.property && <p className="text-sm text-destructive">{errors.property}</p>}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">פרטי יחידה</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="מספר יחידה"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              error={errors.unit_number}
              required
            />
            <Input label="שם / תיאור" value={unitName} onChange={(e) => setUnitName(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">סוג יחידה</label>
              <select
                className={SELECT_CLASS}
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as UnitType)}
              >
                {(Object.keys(UNIT_TYPE_LABELS) as UnitType[]).map((type) => (
                  <option key={type} value={type}>
                    {UNIT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">סטטוס</label>
              <select
                className={SELECT_CLASS}
                value={unitStatus}
                onChange={(e) => setUnitStatus(e.target.value as UnitStatus)}
                disabled={occupancy !== 'vacant'}
              >
                {Object.entries(UNIT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="בניין / אגף" value={building} onChange={(e) => setBuilding(e.target.value)} />
            <Input label="קומה" value={floor} onChange={(e) => setFloor(e.target.value)} error={errors.floor} />
            <Input
              label='שטח (מ"ר)'
              value={areaSqm}
              onChange={(e) => setAreaSqm(e.target.value)}
              error={errors.area_sqm}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="חדרים" value={rooms} onChange={(e) => setRooms(e.target.value)} />
            <Input label="שירותים" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            <Input
              label="דמי ניהול (₪)"
              value={managementFee}
              onChange={(e) => setManagementFee(e.target.value)}
              error={errors.management_fee}
            />
          </div>
          <Input
            label='שכ"ד מבוקש (₪)'
            value={monthlyRent}
            onChange={(e) => setMonthlyRent(e.target.value)}
            error={errors.monthly_rent}
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">מה קיים במושכר</h3>
          <p className="text-meta text-xs">סמנו את כל מה שנכלל ביחידה או בחוזה</p>
          <div className="flex flex-wrap gap-2">
            {UNIT_AMENITY_OPTIONS.map((item) => {
              const active = amenities.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleAmenity(item.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <Input
            label="תיאור לפרסום / הצגה ללקוח"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Input label="הערות פנימיות" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">שיוך שוכר</h3>
          <div className="flex flex-wrap gap-2">
            {occupancyOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOccupancy(opt.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  occupancy === opt.id ?
                    'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {occupancy === 'existing_tenant' && (
            <div className="space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">שוכר מהנכס</label>
                <select
                  className={SELECT_CLASS}
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  disabled={tenants.length === 0}
                >
                  {tenants.length === 0 ? (
                    <option value="">אין שוכרים רשומים — בחרו «שוכר חדש»</option>
                  ) : (
                    tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                        {t.unit_number ? ` · יח׳ ${t.unit_number}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {errors.tenant_id && <p className="text-xs text-destructive">{errors.tenant_id}</p>}
              </div>
              <LeaseFields
                startDate={startDate}
                endDate={endDate}
                deposit={deposit}
                paymentMethod={paymentMethod}
                errors={errors}
                onStart={setStartDate}
                onEnd={setEndDate}
                onDeposit={setDeposit}
                onPaymentMethod={setPaymentMethod}
              />
            </div>
          )}

          {occupancy === 'new_tenant' && (
            <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(TENANT_TYPE_LABELS) as TenantType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTenantType(type)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      tenantType === type ?
                        'bg-primary text-primary-foreground'
                      : 'bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    {TENANT_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
              <Input
                label={tenantType === 'company' ? 'איש קשר' : 'שם מלא'}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.full_name}
                required
              />
              {tenantType === 'sole_proprietor' ? (
                <Input
                  label="ת.ז."
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  error={errors.id_number}
                />
              ) : (
                <>
                  <Input
                    label="שם חברה"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    error={errors.company_name}
                  />
                  <Input
                    label="ח.פ."
                    value={companyNumber}
                    onChange={(e) => setCompanyNumber(e.target.value)}
                    error={errors.company_number}
                  />
                  <Input label="מורשה חתימה" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                </>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="טלפון"
                  value={phone}
                  onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                  error={errors.phone}
                />
                <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
              </div>
              <LeaseFields
                startDate={startDate}
                endDate={endDate}
                deposit={deposit}
                paymentMethod={paymentMethod}
                errors={errors}
                onStart={setStartDate}
                onEnd={setEndDate}
                onDeposit={setDeposit}
                onPaymentMethod={setPaymentMethod}
              />
            </div>
          )}
        </section>
      </form>
    </SlidePanel>
  );
}

function LeaseFields({
  startDate,
  endDate,
  deposit,
  paymentMethod,
  errors,
  onStart,
  onEnd,
  onDeposit,
  onPaymentMethod,
}: {
  startDate: string;
  endDate: string;
  deposit: string;
  paymentMethod: PaymentMethod;
  errors: Record<string, string>;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
  onDeposit: (v: string) => void;
  onPaymentMethod: (v: PaymentMethod) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="תחילת חוזה" type="date" value={startDate} onChange={(e) => onStart(e.target.value)} error={errors.start_date} />
        <Input label="סיום חוזה" type="date" value={endDate} onChange={(e) => onEnd(e.target.value)} error={errors.end_date} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="פיקדון (₪)" value={deposit} onChange={(e) => onDeposit(e.target.value)} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">אמצעי תשלום</label>
          <select
            className={SELECT_CLASS}
            value={paymentMethod}
            onChange={(e) => onPaymentMethod(e.target.value as PaymentMethod)}
          >
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
              <option key={method} value={method}>
                {PAYMENT_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
