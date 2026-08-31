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
  createPayment,
  createProperty,
  createTask,
  createTenant,
  createUnit,
  fetchAccessiblePropertyIds,
  fetchLeasesForProperties,
} from '../../lib/services';
import { CLIENT_TYPE_LABELS, LEAD_STATUS_LABELS, TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from '../../types/domain';
import type { ClientType, LeadStatus, Lease, TaskPriority, TaskStatus } from '../../types/domain';
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
import { UnitFormModal, type UnitFormValues } from '../property/UnitFormModal';
import { PaymentFormModal } from './PaymentFormModal';
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
    const { link, error } = await createLink({
      client_name: values.client_name,
      client_phone: values.client_phone,
      client_email: values.client_email.trim(),
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
    if (error) return { error };
    if (!link) return { error: 'יצירת הקישור נכשלה' };
    await fetchLinks();
    notifyEntityCreated('agreement');
    return { link };
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
        onClose={closeQuickAdd}
        onSubmit={async (values) => {
          if (!user) throw new Error('not auth');
          await createLease(user.id, { ...values, property_id: state.propertyId ?? '' });
          closeAfterSuccess('lease', closeQuickAdd);
        }}
      />

      <UnitFormModal
        open={state.type === 'unit'}
        onClose={closeQuickAdd}
        onSubmit={async (values: UnitFormValues) => {
          if (!user || !state.propertyId) throw new Error('not auth');
          await createUnit({
            property_id: state.propertyId,
            broker_id: user.id,
            unit_number: values.unit_number.trim(),
            unit_name: values.unit_name.trim() || undefined,
            area_sqm: values.area_sqm ? Number(values.area_sqm) : undefined,
            monthly_rent: values.monthly_rent ? Number(values.monthly_rent) : undefined,
            unit_status: values.unit_status,
            floor: values.floor ? Number(values.floor) : undefined,
          });
          closeAfterSuccess('unit', closeQuickAdd);
        }}
        title="יחידה חדשה"
      />

      <PaymentQuickAddModal
        open={state.type === 'payment'}
        propertyId={state.propertyId}
        onClose={closeQuickAdd}
      />
    </>
  );
}

function PaymentQuickAddModal({
  open,
  propertyId,
  onClose,
}: {
  open: boolean;
  propertyId?: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoadingLeases(true);
    fetchAccessiblePropertyIds(user.id, user.role)
      .then((ids) => {
        const scoped = propertyId ? ids.filter((id) => id === propertyId) : ids;
        return fetchLeasesForProperties(scoped);
      })
      .then((data) => setLeases(data.filter((l) => l.is_active)))
      .finally(() => setLoadingLeases(false));
  }, [open, user?.id, user?.role, propertyId]);

  return (
    <PaymentFormModal
      open={open}
      onClose={onClose}
      title="תשלום חדש"
      mode="create"
      leases={leases}
      loadingLeases={loadingLeases}
      onSubmit={async (values) => {
        if (!values.lease_id) throw new Error('lease required');
        await createPayment({
          lease_id: values.lease_id,
          amount: Number(values.amount),
          due_date: values.due_date,
          status: values.status,
          payment_method: values.payment_method,
          receipt_number: values.receipt_number || undefined,
          notes: values.notes || undefined,
        });
        closeAfterSuccess('payment', onClose);
      }}
    />
  );
}

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: { full_name?: string; phone?: string; source?: string; status?: LeadStatus };
  onSubmit: (values: { full_name: string; phone: string; source?: string; status?: LeadStatus }) => Promise<void>;
  title?: string;
}

export function LeadFormModal({ open, onClose, initial, onSubmit, title = 'ליד חדש' }: LeadFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(initial?.full_name ?? '');
      setPhone(initial?.phone ?? '');
      setSource(initial?.source ?? '');
      setStatus(initial?.status ?? 'new');
      setErrors({});
    }
  }, [open, initial]);

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
      await onSubmit({
        full_name: fullName.trim(),
        phone: phone.trim(),
        source: source.trim() || undefined,
        status: initial?.status !== undefined ? status : undefined,
      });
      setFullName('');
      setPhone('');
      setSource('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
        <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} required />
        <Input label="מקור" value={source} onChange={(e) => setSource(e.target.value)} placeholder="פייסבוק, אתר, המלצה..." />
        {initial?.status !== undefined && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select className={SELECT_CLASS} value={status} onChange={(e) => setStatus(e.target.value as LeadStatus)}>
              {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : initial?.full_name ? 'שמור' : 'הוסף ליד'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: { full_name?: string; type?: ClientType; phone?: string; email?: string };
  onSubmit: (values: { full_name: string; type: ClientType; phone?: string; email?: string }) => Promise<void>;
  title?: string;
}

export function ClientFormModal({ open, onClose, initial, onSubmit, title = 'לקוח חדש' }: ClientFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [type, setType] = useState<ClientType>('buyer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(initial?.full_name ?? '');
      setType(initial?.type ?? 'buyer');
      setPhone(initial?.phone ?? '');
      setEmail(initial?.email ?? '');
      setErrors({});
    }
  }, [open, initial]);

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
    <Modal open={open} onClose={onClose} title={title}>
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
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : initial?.full_name ? 'שמור' : 'הוסף לקוח'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: { title?: string; priority?: TaskPriority; due_date?: string; status?: TaskStatus };
  onSubmit: (values: { title: string; priority: TaskPriority; due_date?: string; status?: TaskStatus }) => Promise<void>;
  title?: string;
}

export function TaskFormModal({ open, onClose, initial, onSubmit, title = 'משימה חדשה' }: TaskFormModalProps) {
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTaskTitle(initial?.title ?? '');
      setPriority(initial?.priority ?? 'medium');
      setDueDate(initial?.due_date ?? '');
      setStatus(initial?.status ?? 'open');
      setErrors({});
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const titleResult = validateRequired(taskTitle, 'כותרת');
    if (!titleResult.isValid) next.title = titleResult.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        title: taskTitle.trim(),
        priority,
        due_date: dueDate || undefined,
        status: initial?.status !== undefined ? status : undefined,
      });
      setTaskTitle('');
      setDueDate('');
      setPriority('medium');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="כותרת" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} error={errors.title} required />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">עדיפות</label>
          <select className={SELECT_CLASS} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <Input label="תאריך יעד" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        {initial?.status !== undefined && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select className={SELECT_CLASS} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : initial?.title ? 'שמור' : 'הוסף משימה'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface TenantFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: { full_name?: string; phone?: string; email?: string };
  onSubmit: (values: { full_name: string; phone?: string; email?: string }) => Promise<void>;
  title?: string;
}

export function TenantFormModal({ open, onClose, initial, onSubmit, title = 'שוכר חדש' }: TenantFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName(initial?.full_name ?? '');
      setPhone(initial?.phone ?? '');
      setEmail(initial?.email ?? '');
      setErrors({});
    }
  }, [open, initial]);

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
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם / חברה" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
        <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} />
        <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : initial?.full_name ? 'שמור' : 'הוסף שוכר'}</Button>
        </div>
      </form>
    </Modal>
  );
}

interface LeaseFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: {
    tenant_name?: string;
    monthly_rent?: string;
    start_date?: string;
    end_date?: string;
  };
  onSubmit: (values: {
    tenant_name: string;
    monthly_rent: number;
    start_date: string;
    end_date: string;
  }) => Promise<void>;
  title?: string;
}

export function LeaseFormModal({ open, onClose, initial, onSubmit, title = 'חוזה חדש' }: LeaseFormModalProps) {
  const [tenantName, setTenantName] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTenantName(initial?.tenant_name ?? '');
      setMonthlyRent(initial?.monthly_rent ?? '');
      setStartDate(initial?.start_date ?? '');
      setEndDate(initial?.end_date ?? '');
      setErrors({});
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = validateName(tenantName);
    if (!name.isValid) next.tenant_name = name.error!;
    const rent = validatePositiveNumber(monthlyRent, true);
    if (!rent.isValid) next.monthly_rent = rent.error!;
    const start = validateRequired(startDate, 'תאריך התחלה');
    if (!start.isValid) next.start_date = start.error!;
    const end = validateRequired(endDate, 'תאריך סיום');
    if (!end.isValid) next.end_date = end.error!;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await onSubmit({
        tenant_name: tenantName.trim(),
        monthly_rent: Number(monthlyRent),
        start_date: startDate,
        end_date: endDate,
      });
      setTenantName('');
      setMonthlyRent('');
      setStartDate('');
      setEndDate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="שם שוכר" value={tenantName} onChange={(e) => setTenantName(e.target.value)} error={errors.tenant_name} required />
        <Input label='שכ"ד חודשי (₪)' value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} error={errors.monthly_rent} required />
        <Input label="תאריך התחלה" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.start_date} required />
        <Input label="תאריך סיום" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.end_date} required />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
          <Button type="submit" disabled={saving}>{saving ? 'שומר...' : initial?.start_date ? 'שמור' : 'הוסף חוזה'}</Button>
        </div>
      </form>
    </Modal>
  );
}
