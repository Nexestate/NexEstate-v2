import { useEffect, useMemo, useState } from 'react';
import { requirementsForTenantType } from '../../lib/propertyWorkspace';
import { fetchProperty } from '../../lib/services';
import type { CreateTenantWithLeaseInput } from '../../lib/services/leasesService';
import {
  PAYMENT_METHOD_LABELS,
  TENANT_TYPE_LABELS,
  UNIT_TYPE_LABELS,
  type PaymentMethod,
  type PropertyUnit,
  type TenantType,
} from '../../types/domain';
import { validateEmail, validateName, validatePhone, validatePositiveNumber, validateRequired, sanitizePhone } from '../../lib/validation';
import { TenantDocumentsChecklist } from '../property/TenantDocumentsChecklist';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SlidePanel } from '../ui/SlidePanel';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

type DocKey = string;

interface TenantOnboardingModalProps {
  open: boolean;
  onClose: () => void;
  propertyId?: string;
  onSubmit: (values: CreateTenantWithLeaseInput) => Promise<void>;
}

export function TenantOnboardingModal({ open, onClose, propertyId, onSubmit }: TenantOnboardingModalProps) {
  const [tenantType, setTenantType] = useState<TenantType>('sole_proprietor');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [unitId, setUnitId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [propertyTitle, setPropertyTitle] = useState('');
  const [docFiles, setDocFiles] = useState<Partial<Record<DocKey, File>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const requiredDocs = useMemo(() => requirementsForTenantType(tenantType), [tenantType]);

  const selectedUnit = units.find((u) => u.id === unitId);

  useEffect(() => {
    if (!open) return;
    resetForm();
    setErrors({});
    setLoadError(null);
    if (!propertyId) {
      setUnits([]);
      return;
    }
    void fetchProperty(propertyId)
      .then((p) => {
        if (!p) {
          setLoadError('לא ניתן לטעון את הנכס');
          return;
        }
        setPropertyTitle(p.title);
        const available = p.units.filter((u) => u.unit_status !== 'occupied');
        setUnits(available.length > 0 ? available : p.units);
        setUnitId(available[0]?.id ?? p.units[0]?.id ?? '');
        if (available[0]?.monthly_rent != null) {
          setMonthlyRent(String(available[0].monthly_rent));
        }
      })
      .catch(() => setLoadError('שגיאה בטעינת יחידות'));
  }, [open, propertyId]);

  useEffect(() => {
    if (selectedUnit?.monthly_rent != null && !monthlyRent) {
      setMonthlyRent(String(selectedUnit.monthly_rent));
    }
  }, [selectedUnit, monthlyRent]);

  const resetForm = () => {
    setTenantType('sole_proprietor');
    setFullName('');
    setIdNumber('');
    setCompanyName('');
    setCompanyNumber('');
    setContactName('');
    setPhone('');
    setEmail('');
    setStartDate('');
    setEndDate('');
    setMonthlyRent('');
    setDeposit('');
    setPaymentMethod('transfer');
    setDocFiles({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) {
      setErrors({ property: 'יש לבחור נכס מנוהל לפני הוספת שוכר' });
      return;
    }

    const next: Record<string, string> = {};
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
    if (!unitId) next.unit_id = 'יש לבחור יחידה';
    const rent = validatePositiveNumber(monthlyRent, true);
    if (!rent.isValid) next.monthly_rent = rent.error!;
    const start = validateRequired(startDate, 'תאריך התחלה');
    if (!start.isValid) next.start_date = start.error!;
    const end = validateRequired(endDate, 'תאריך סיום');
    if (!end.isValid) next.end_date = end.error!;

    setErrors(next);
    if (Object.keys(next).length) return;

    const pending_document_names = requiredDocs
      .map((d) => docFiles[d.id]?.name)
      .filter((n): n is string => Boolean(n));

    setSaving(true);
    try {
      await onSubmit({
        property_id: propertyId,
        unit_id: unitId,
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
        pending_document_names,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="שוכר חדש — נכס מנוהל"
      className="max-w-xl"
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2 border-t border-border/80 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" form="tenant-onboarding-form" disabled={saving || !propertyId}>
            {saving ? 'שומר...' : 'שמור שוכר וחוזה'}
          </Button>
        </div>
      }
    >
      <form id="tenant-onboarding-form" onSubmit={handleSubmit} className="space-y-8 px-5 py-4">
        {!propertyId && (
          <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
            הוספת שוכר מלאה זמינה מתוך נכס מנוהל (סרגל צד → שוכרים → +) או מדף שוכרים עם סינון נכס.
          </p>
        )}

        {propertyId && (
          <p className="text-meta">
            נכס: <span className="font-semibold text-foreground">{propertyTitle || '…'}</span>
          </p>
        )}

        {loadError && <p className="text-sm text-destructive">{loadError}</p>}

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">פרטי שוכר</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TENANT_TYPE_LABELS) as TenantType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTenantType(type)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  tenantType === type ?
                    'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
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
              required
            />
          ) : (
            <>
              <Input
                label="שם חברה"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                error={errors.company_name}
                required
              />
              <Input
                label="ח.פ."
                value={companyNumber}
                onChange={(e) => setCompanyNumber(e.target.value)}
                error={errors.company_number}
                required
              />
              <Input
                label="מורשה חתימה (אופציונלי)"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="טלפון"
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              error={errors.phone}
            />
            <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">יחידה וחוזה</h3>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">יחידה בנכס</label>
            <select
              className={SELECT_CLASS}
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              disabled={!propertyId || units.length === 0}
            >
              {units.length === 0 ?
                <option value="">אין יחידות — הוסיפו יחידה קודם</option>
              : units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.unit_number}
                    {u.unit_name ? ` · ${u.unit_name}` : ''}
                    {u.unit_status === 'occupied' ? ' (תפוס)' : ''}
                  </option>
                ))
              }
            </select>
            {errors.unit_id && <p className="text-sm text-destructive">{errors.unit_id}</p>}
          </div>

          {selectedUnit?.unit_type && (
            <p className="text-meta">
              סוג יחידה: {UNIT_TYPE_LABELS[selectedUnit.unit_type] ?? selectedUnit.unit_type}
              {selectedUnit.area_sqm != null ? ` · ${selectedUnit.area_sqm} מ"ר` : ''}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="תאריך התחלה"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              error={errors.start_date}
              required
            />
            <Input
              label="תאריך סיום"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              error={errors.end_date}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label='שכ"ד חודשי (₪)'
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              error={errors.monthly_rent}
              required
            />
            <Input label="פיקדון (₪)" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">אופן תשלום</label>
            <select
              className={SELECT_CLASS}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">מסמכים</h3>
          <TenantDocumentsChecklist tenant={{ tenant_type: tenantType }} />
          <p className="text-meta">
            ניתן לבחור קבצים כעת; העלאה לכספת פרטית תחובר בשלב 2C. שמות הקבצים יירשמו בהערות השוכר עד אז.
          </p>
          <ul className="space-y-3">
            {requiredDocs.map((doc) => (
              <li key={doc.id} className="space-y-1">
                <label className="text-sm font-medium">{doc.label}</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="block w-full text-sm text-muted-foreground file:me-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setDocFiles((prev) => {
                      const next = { ...prev };
                      if (file) next[doc.id] = file;
                      else delete next[doc.id];
                      return next;
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        </section>
      </form>
    </SlidePanel>
  );
}
