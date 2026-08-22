import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  notifyEntityCreated,
  useQuickAdd,
  type QuickAddType,
} from '../../contexts/QuickAddContext';
import { useSigningLinks } from '../../hooks/useSigningLinks';
import {
  createClient,
  createLead,
  createLease,
  createProperty,
  createTask,
  createTenant,
  createUnit,
  fetchProperties,
  fetchTenants,
} from '../../lib/services';
import { CLIENT_TYPE_LABELS, TASK_PRIORITY_LABELS } from '../../types/domain';
import type { ClientType, TaskPriority } from '../../types/domain';
import {
  validateEmail,
  validateName,
  validatePhone,
  validatePositiveNumber,
  validateRequired,
  sanitizePhone,
} from '../../lib/validation';
import { CreateSigningLinkModal, type SigningLinkFormValues } from '../property/CreateSigningLinkModal';
import {
  PropertyFormModal,
  propertyFormToPayload,
  type PropertyFormValues,
} from '../property/PropertyFormModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

function closeAfterSuccess(type: QuickAddType, closeQuickAdd: () => void) {
  notifyEntityCreated(type);
  closeQuickAdd();
}

export function QuickAddModals() {
  const { user } = useAuth();
  const { state, closeQuickAdd } = useQuickAdd();
  const { createLink, fetchLinks } = useSigningLinks();

  const handleAgreementCreate = async (values: SigningLinkFormValues) => {
    const created = await createLink({
      client_name: values.client_name,
      client_phone: values.client_phone,
      client_email: values.client_email || undefined,
      deal_type: values.deal_type,
      agreement_type: values.agreement_type,
      property_description: values.property_description || undefined,
      exact_address: values.exact_address || undefined,
      show_address_before_signing: values.show_address_before_signing,
      price: values.price ? Number(values.price) : undefined,
      commission_type: values.commission_type,
      commission_percent: Number(values.commission_percent),
      minimum_commission: values.minimum_commission ? Number(values.minimum_commission) : undefined,
      valid_days: Number(values.valid_days),
      payment_days: Number(values.payment_days),
      broker_name: user?.full_name,
    });
    if (!created) throw new Error('create failed');
    await fetchLinks();
    closeAfterSuccess('agreement', closeQuickAdd);
  };

  const handlePropertyCreate = async (values: PropertyFormValues) => {
    if (!user) throw new Error('not auth');
    await createProperty(propertyFormToPayload(values, user.id));
    closeAfterSuccess('property', closeQuickAdd);
  };

  return (
    <>
      <CreateSigningLinkModal
        open={state.type === 'agreement'}
        onClose={closeQuickAdd}
        onSubmit={handleAgreementCreate}
      />

      <PropertyFormModal
        open={state.type === 'property'}
        onClose={closeQuickAdd}
        onSubmit={handlePropertyCreate}
      />

      <LeadFormModal
        open={state.type === 'lead'}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createLead(user.id, values);
          closeAfterSuccess('lead', closeQuickAdd);
        }}
      />

      <ClientFormModal
        open={state.type === 'client'}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createClient(user.id, values);
          closeAfterSuccess('client', closeQuickAdd);
        }}
      />

      <TaskFormModal
        open={state.type === 'task'}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createTask(user.id, values);
          closeAfterSuccess('task', closeQuickAdd);
        }}
      />

      <TenantFormModal
        open={state.type === 'tenant'}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createTenant(user.id, { ...values, property_id: state.propertyId });
          closeAfterSuccess('tenant', closeQuickAdd);
        }}
      />

      <LeaseFormModal
        open={state.type === 'lease'}
        propertyId={state.propertyId}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createLease(user.id, values);
          closeAfterSuccess('lease', closeQuickAdd);
        }}
      />

      <UnitFormModal
        open={state.type === 'unit'}
        propertyId={state.propertyId}
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createUnit({ ...values, broker_id: user.id });
          closeAfterSuccess('unit', closeQuickAdd);
        }}
      />
    </>
  );
}

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { full_name: string; phone: string; source?: string }) => Promise<void>;
}

function LeadFormModal({ open, onClose, onSubmit }: LeadFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = validateName(fullName);
    if (!name.isValid) next.full_name = name.error!;
    const phoneResult = validatePhone(phone);
    if (!phoneResult.isValid) next.phone = phoneResult.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({ full_name: fullName.trim(), phone: phone.trim(), source: source.trim() || undefined });
      setFullName('');
      setPhone('');
      setSource('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="ליד חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
        <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} required />
        <Input label="מקור" value={source} onChange={(e) => setSource(e.target.value)} placeholder="פייסבוק, אתר, המלצה..." />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף ליד'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { full_name: string; type: ClientType; phone?: string; email?: string }) => Promise<void>;
}

function ClientFormModal({ open, onClose, onSubmit }: ClientFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [type, setType] = useState<ClientType>('buyer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        type,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      setFullName('');
      setPhone('');
      setEmail('');
      setType('buyer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="לקוח חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">סוג לקוח</label>
          <select className={SELECT_CLASS} value={type} onChange={(e) => setType(e.target.value as ClientType)}>
            {Object.entries(CLIENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} />
        <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף לקוח'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { title: string; priority: TaskPriority; due_date?: string }) => Promise<void>;
}

function TaskFormModal({ open, onClose, onSubmit }: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const titleResult = validateRequired(title, 'כותרת');
    if (!titleResult.isValid) next.title = titleResult.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), priority, due_date: dueDate || undefined });
      setTitle('');
      setDueDate('');
      setPriority('medium');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="משימה חדשה">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="כותרת" value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} required />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">עדיפות</label>
          <select className={SELECT_CLASS} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Input label="תאריך יעד" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף משימה'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface TenantFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: { full_name: string; phone?: string; email?: string }) => Promise<void>;
}

function TenantFormModal({ open, onClose, onSubmit }: TenantFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      setFullName('');
      setPhone('');
      setEmail('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="שוכר חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם / חברה" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
        <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} />
        <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף שוכר'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface LeaseFormModalProps {
  open: boolean;
  propertyId?: string;
  onClose: () => void;
  onSubmit: (values: {
    property_id: string;
    tenant_id?: string;
    tenant_name?: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
}

function LeaseFormModal({ open, propertyId, onClose, onSubmit }: LeaseFormModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Array<{ id: string; title: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; full_name: string; company_name?: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId ?? '');
  const [tenantId, setTenantId] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSelectedProperty(propertyId ?? '');
    Promise.all([fetchProperties(user.id), fetchTenants(user.id)]).then(([props, t]) => {
      setProperties(props.map((p) => ({ id: p.id, title: p.title })));
      setTenants(t);
      if (!propertyId && props[0]) setSelectedProperty(props[0].id);
    });
  }, [open, propertyId, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!selectedProperty) next.property_id = 'יש לבחור נכס';
    const rent = validatePositiveNumber(monthlyRent, true);
    if (!rent.isValid) next.monthly_rent = rent.error!;
    const start = validateRequired(startDate, 'תאריך התחלה');
    if (!start.isValid) next.start_date = start.error!;
    const end = validateRequired(endDate, 'תאריך סיום');
    if (!end.isValid) next.end_date = end.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    const tenant = tenants.find((t) => t.id === tenantId);
    setSaving(true);
    try {
      await onSubmit({
        property_id: selectedProperty,
        tenant_id: tenantId || undefined,
        tenant_name: tenant?.company_name || tenant?.full_name,
        monthly_rent: Number(monthlyRent),
        start_date: startDate,
        end_date: endDate,
      });
      setTenantId('');
      setMonthlyRent('');
      setStartDate('');
      setEndDate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="חוזה חדש">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">נכס</label>
          <select className={SELECT_CLASS} value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
            <option value="">בחר נכס</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {errors.property_id && <p className="text-xs text-destructive">{errors.property_id}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">שוכר</label>
          <select className={SELECT_CLASS} value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
            <option value="">בחר שוכר</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.company_name || t.full_name}</option>
            ))}
          </select>
        </div>
        <Input label='שכ"ד חודשי (₪)' value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} error={errors.monthly_rent} required />
        <Input label="תאריך התחלה" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.start_date} required />
        <Input label="תאריך סיום" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.end_date} required />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף חוזה'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface UnitFormModalProps {
  open: boolean;
  propertyId?: string;
  onClose: () => void;
  onSubmit: (values: {
    property_id: string;
    unit_number: string;
    unit_name?: string;
    monthly_rent?: number;
    area_sqm?: number;
  }) => Promise<void>;
}

function UnitFormModal({ open, propertyId, onClose, onSubmit }: UnitFormModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedProperty, setSelectedProperty] = useState(propertyId ?? '');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitName, setUnitName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [area, setArea] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setSelectedProperty(propertyId ?? '');
    fetchProperties(user.id).then((props) => {
      setProperties(props.map((p) => ({ id: p.id, title: p.title })));
      if (!propertyId && props[0]) setSelectedProperty(props[0].id);
    });
  }, [open, propertyId, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!selectedProperty) next.property_id = 'יש לבחור נכס';
    const numberResult = validateRequired(unitNumber, 'מספר יחידה');
    if (!numberResult.isValid) next.unit_number = numberResult.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        property_id: selectedProperty,
        unit_number: unitNumber.trim(),
        unit_name: unitName.trim() || undefined,
        monthly_rent: monthlyRent ? Number(monthlyRent) : undefined,
        area_sqm: area ? Number(area) : undefined,
      });
      setUnitNumber('');
      setUnitName('');
      setMonthlyRent('');
      setArea('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="יחידה חדשה">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">נכס</label>
          <select className={SELECT_CLASS} value={selectedProperty} onChange={(e) => setSelectedProperty(e.target.value)}>
            <option value="">בחר נכס</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>
        <Input label="מספר יחידה" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} error={errors.unit_number} required />
        <Input label="שם יחידה" value={unitName} onChange={(e) => setUnitName(e.target.value)} />
        <Input label="שטח (מ״ר)" value={area} onChange={(e) => setArea(e.target.value)} />
        <Input label='שכ"ד חודשי' value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : 'הוסף יחידה'}</Button>
        </div>
      </form>
    </Modal>
  );
}
