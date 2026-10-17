import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildTenantChangeLogLines, prependChangeLog } from '../../lib/tenantChangeLog';
import { embedDocsInNotes } from '../../lib/services/tenantDocumentsService';
import {
  attachTenantToUnit,
  endActiveLease,
  fetchProperty,
  fetchTenantById,
  reassignLeaseUnit,
  updateLease,
  updateTenant,
} from '../../lib/services';
import type { Lease, PropertyUnit, Tenant, TenantDocumentFile, TenantStatus, TenantType } from '../../types/domain';
import { TenantDocumentsPanel } from '../property/TenantDocumentsPanel';
import {
  PAYMENT_METHOD_LABELS,
  TENANT_STATUS_LABELS,
  TENANT_TYPE_LABELS,
  type PaymentMethod,
} from '../../types/domain';
import {
  sanitizePhone,
  validateEmail,
  validateName,
  validatePhone,
  validatePositiveNumber,
} from '../../lib/validation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { SlidePanel } from '../ui/SlidePanel';

const SELECT_CLASS =
  'flex h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-sm';

export type LeaseEditRow = {
  leaseId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  deposit: string;
  paymentMethod: PaymentMethod;
};

export type TenantEditValues = {
  tenant_type: TenantType;
  full_name: string;
  id_number: string;
  company_name: string;
  company_number: string;
  contact_name: string;
  phone: string;
  email: string;
  status: TenantStatus;
  leases: LeaseEditRow[];
};

interface TenantEditModalProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant;
  leases: Lease[];
  onSaved: () => void | Promise<void>;
}

export function TenantEditModal({ open, onClose, tenant, leases, onSaved }: TenantEditModalProps) {
  const { user } = useAuth();
  const snapshotRef = useRef<Tenant | null>(null);
  const [loadedTenant, setLoadedTenant] = useState<Tenant>(tenant);
  const [tenantType, setTenantType] = useState<TenantType>('sole_proprietor');
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyNumber, setCompanyNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TenantStatus>('active');
  const [leaseRows, setLeaseRows] = useState<LeaseEditRow[]>([]);
  const [leasesMarkedEnd, setLeasesMarkedEnd] = useState<Set<string>>(() => new Set());
  const [newLeaseRows, setNewLeaseRows] = useState<LeaseEditRow[]>([]);
  const [notesLog, setNotesLog] = useState('');
  const [newDocNote, setNewDocNote] = useState('');
  const [documentFiles, setDocumentFiles] = useState<TenantDocumentFile[]>([]);
  const [units, setUnits] = useState<PropertyUnit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const managerId = user?.id ?? '';
  const propertyId =
    loadedTenant.property_id ??
    tenant.property_id ??
    leases.find((l) => l.tenant_id === tenant.id)?.property_id;

  const activeLeases = useMemo(
    () => leases.filter((l) => l.is_active && l.tenant_id === tenant.id),
    [leases, tenant.id],
  );

  const applyTenantToForm = (t: Tenant, leaseSource: Lease[]) => {
    snapshotRef.current = t;
    setLoadedTenant(t);
    setTenantType(t.tenant_type ?? 'sole_proprietor');
    setFullName(t.full_name);
    setIdNumber(t.id_number ?? '');
    setCompanyName(t.company_name ?? '');
    setCompanyNumber(t.company_number ?? '');
    setContactName(t.contact_name ?? '');
    setPhone(t.phone ?? '');
    setEmail(t.email ?? '');
    setStatus(t.status);
    setNotesLog(t.notes ?? '');
    setNewDocNote('');
    setDocumentFiles(t.document_files ?? []);
    setLeasesMarkedEnd(new Set());
    setNewLeaseRows([]);
    const active = leaseSource.filter((l) => l.is_active && l.tenant_id === t.id);
    setLeaseRows(
      active.map((l) => ({
        leaseId: l.id,
        unitId: l.unit_id ?? '',
        startDate: l.start_date.slice(0, 10),
        endDate: l.end_date.slice(0, 10),
        monthlyRent: String(l.monthly_rent),
        deposit: l.deposit != null ? String(l.deposit) : '',
        paymentMethod: (l.payment_method as PaymentMethod) ?? 'transfer',
      })),
    );
  };

  useEffect(() => {
    if (!open) return;
    setErrors({});
    void (async () => {
      const full = (await fetchTenantById(tenant.id, managerId)) ?? tenant;
      applyTenantToForm(full, leases);
      const pid =
        full.property_id ??
        tenant.property_id ??
        leases.find((l) => l.tenant_id === tenant.id)?.property_id;
      if (pid) {
        const p = await fetchProperty(pid);
        setUnits(p?.units ?? []);
      } else {
        setUnits([]);
      }
    })();
  }, [open, tenant.id, managerId, leases, tenant]);

  const updateLeaseRow = (leaseId: string, patch: Partial<LeaseEditRow>) => {
    setLeaseRows((rows) => rows.map((r) => (r.leaseId === leaseId ? { ...r, ...patch } : r)));
  };

  const updateNewLeaseRow = (leaseId: string, patch: Partial<LeaseEditRow>) => {
    setNewLeaseRows((rows) => rows.map((r) => (r.leaseId === leaseId ? { ...r, ...patch } : r)));
  };

  const vacantUnits = useMemo(
    () => units.filter((u) => u.unit_status === 'available' || u.unit_status === 'reserved'),
    [units],
  );

  const addNewLeaseRow = () => {
    setNewLeaseRows((rows) => [
      ...rows,
      {
        leaseId: `new-${Date.now()}`,
        unitId: vacantUnits[0]?.id ?? '',
        startDate: '',
        endDate: '',
        monthlyRent: '',
        deposit: '',
        paymentMethod: 'transfer',
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const name = validateName(fullName);
    if (!name.isValid) next.full_name = name.error!;
    if (phone) {
      const p = validatePhone(phone);
      if (!p.isValid) next.phone = p.error!;
    }
    if (email) {
      const em = validateEmail(email);
      if (!em.isValid) next.email = em.error!;
    }
    for (const row of leaseRows) {
      if (leasesMarkedEnd.has(row.leaseId)) continue;
      const rent = validatePositiveNumber(row.monthlyRent, true);
      if (!rent.isValid) next[`rent_${row.leaseId}`] = rent.error!;
      if (!row.unitId) next[`unit_${row.leaseId}`] = 'יש לבחור יחידה';
    }
    for (const row of newLeaseRows) {
      if (!row.unitId) next[`unit_${row.leaseId}`] = 'יש לבחור יחידה';
      const rent = validatePositiveNumber(row.monthlyRent, true);
      if (!rent.isValid) next[`rent_${row.leaseId}`] = rent.error!;
      if (!row.startDate) next[`start_${row.leaseId}`] = 'תאריך התחלה חובה';
      if (!row.endDate) next[`end_${row.leaseId}`] = 'תאריך סיום חובה';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const before = snapshotRef.current ?? loadedTenant;
      const changeLines = buildTenantChangeLogLines({
        before,
        after: {
          full_name: fullName,
          tenant_type: tenantType,
          status,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          id_number: idNumber.trim() || undefined,
          company_name: companyName.trim() || undefined,
          company_number: companyNumber.trim() || undefined,
          contact_name: contactName.trim() || undefined,
        },
        leasesBefore: activeLeases,
        leaseRowsAfter: leaseRows,
        units,
      });
      const mergedNotes = prependChangeLog(notesLog, changeLines, newDocNote);
      const notesPayload = embedDocsInNotes(mergedNotes, documentFiles);

      await updateTenant(tenant.id, {
        full_name: fullName.trim(),
        tenant_type: tenantType,
        id_number: idNumber.trim() || undefined,
        company_name: companyName.trim() || undefined,
        company_number: companyNumber.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        status,
        notes: notesPayload || undefined,
      });

      for (const leaseId of leasesMarkedEnd) {
        const lease = activeLeases.find((l) => l.id === leaseId);
        await endActiveLease(leaseId, lease?.unit_id);
      }

      for (const row of leaseRows) {
        if (leasesMarkedEnd.has(row.leaseId)) continue;
        const lease = activeLeases.find((l) => l.id === row.leaseId);
        if (!lease) continue;
        if (row.unitId && lease.unit_id !== row.unitId) {
          await reassignLeaseUnit(row.leaseId, row.unitId);
        }
        await updateLease(row.leaseId, {
          start_date: row.startDate,
          end_date: row.endDate,
          monthly_rent: Number(row.monthlyRent),
          deposit: row.deposit ? Number(row.deposit) : undefined,
          payment_method: row.paymentMethod,
        });
      }

      if (propertyId && user?.id) {
        for (const row of newLeaseRows) {
          await attachTenantToUnit(user.id, {
            property_id: propertyId,
            unit_id: row.unitId,
            tenant_id: tenant.id,
            tenant_name: fullName.trim(),
            start_date: row.startDate,
            end_date: row.endDate,
            monthly_rent: Number(row.monthlyRent),
            deposit: row.deposit ? Number(row.deposit) : undefined,
            payment_method: row.paymentMethod,
          });
        }
      }
      await onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="עריכת שוכר"
      className="max-w-2xl"
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2 border-t border-border/80 px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" form="tenant-edit-form" disabled={saving}>
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Button>
        </div>
      }
    >
      <form id="tenant-edit-form" onSubmit={handleSubmit} className="space-y-8 px-5 py-4">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold">פרטי שוכר</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TENANT_TYPE_LABELS) as TenantType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTenantType(type)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  tenantType === type ? 'bg-primary text-primary-foreground' : 'bg-muted/60'
                }`}
              >
                {TENANT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
          <Input label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} error={errors.full_name} required />
          {tenantType === 'company' && (
            <>
              <Input label="שם חברה" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <Input label="ח.פ." value={companyNumber} onChange={(e) => setCompanyNumber(e.target.value)} />
              <Input label="איש קשר" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </>
          )}
          <Input label="ת.ז. / מזהה" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="טלפון" value={phone} onChange={(e) => setPhone(sanitizePhone(e.target.value))} error={errors.phone} />
            <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">סטטוס</label>
            <select className={SELECT_CLASS} value={status} onChange={(e) => setStatus(e.target.value as TenantStatus)}>
              {Object.entries(TENANT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {managerId && (
          <section className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <h3 className="text-sm font-semibold">מסמכים</h3>
            <p className="text-meta text-xs">העלאה ומחיקה נשמרות מיד — אין צורך ללחוץ «שמור» רק בשביל קבצים.</p>
            <TenantDocumentsPanel
              tenant={{ id: tenant.id, tenant_type: tenantType, document_files: documentFiles }}
              managerId={managerId}
              editable
              onFilesChange={setDocumentFiles}
            />
          </section>
        )}

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">תיעוד והערות</h3>
          <p className="text-meta text-xs">
            שינויים בשדות ובחוזים יירשמו אוטומטית בשמירה. ניתן להוסיף הערה ידנית (חידוש הסכם, החלפת נכס וכו&apos;).
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">הערה לתיעוד (אופציונלי)</label>
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              value={newDocNote}
              onChange={(e) => setNewDocNote(e.target.value)}
              placeholder="לדוגמה: חידוש לשנתיים, העברה מיחידה 5 ל-7…"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">יומן תיעוד (קריאה / עריכה)</label>
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-border bg-muted/50 px-4 py-3 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              value={notesLog}
              onChange={(e) => setNotesLog(e.target.value)}
              dir="rtl"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">
              חוזי שכירות ({leaseRows.filter((r) => !leasesMarkedEnd.has(r.leaseId)).length + newLeaseRows.length})
            </h3>
            {propertyId && (
              <Button type="button" size="sm" variant="outline" onClick={addNewLeaseRow}>
                + הוסף יחידה לשוכר
              </Button>
            )}
          </div>
          {leaseRows.length === 0 && newLeaseRows.length === 0 ? (
            <p className="text-meta text-sm">אין חוזים פעילים — הוסיפו יחידה למטה או דרך «הוסף שוכר».</p>
          ) : (
            leaseRows.map((row) => {
              const ending = leasesMarkedEnd.has(row.leaseId);
              return (
              <div
                key={row.leaseId}
                className={`space-y-3 rounded-xl border border-border/80 p-4 ${ending ? 'bg-destructive/10 opacity-70' : 'bg-muted/20'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">חוזה פעיל</p>
                  {!ending ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setLeasesMarkedEnd((s) => new Set(s).add(row.leaseId))}
                    >
                      סיים / שחרר יחידה
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setLeasesMarkedEnd((s) => {
                          const n = new Set(s);
                          n.delete(row.leaseId);
                          return n;
                        })
                      }
                    >
                      בטל שחרור
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">יחידה (החלפה)</label>
                  <select
                    className={SELECT_CLASS}
                    value={row.unitId}
                    onChange={(e) => updateLeaseRow(row.leaseId, { unitId: e.target.value })}
                  >
                    <option value="">בחרו יחידה</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        יח׳ {u.unit_number}
                        {u.unit_name ? ` · ${u.unit_name}` : ''} ({u.unit_status})
                      </option>
                    ))}
                  </select>
                  {errors[`unit_${row.leaseId}`] && (
                    <p className="text-xs text-destructive">{errors[`unit_${row.leaseId}`]}</p>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input label="התחלה" type="date" value={row.startDate} onChange={(e) => updateLeaseRow(row.leaseId, { startDate: e.target.value })} />
                  <Input label="סיום" type="date" value={row.endDate} onChange={(e) => updateLeaseRow(row.leaseId, { endDate: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label='שכ"ד (₪)'
                    value={row.monthlyRent}
                    onChange={(e) => updateLeaseRow(row.leaseId, { monthlyRent: e.target.value })}
                    error={errors[`rent_${row.leaseId}`]}
                  />
                  <Input label="פיקדון" value={row.deposit} onChange={(e) => updateLeaseRow(row.leaseId, { deposit: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">אמצעי תשלום</label>
                  <select
                    className={SELECT_CLASS}
                    value={row.paymentMethod}
                    onChange={(e) => updateLeaseRow(row.leaseId, { paymentMethod: e.target.value as PaymentMethod })}
                  >
                    {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
            })
          )}

          {newLeaseRows.map((row) => (
            <div key={row.leaseId} className="space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-primary">יחידה חדשה לשוכר</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setNewLeaseRows((rows) => rows.filter((r) => r.leaseId !== row.leaseId))}
                >
                  הסר
                </Button>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">יחידה פנויה</label>
                <select
                  className={SELECT_CLASS}
                  value={row.unitId}
                  onChange={(e) => updateNewLeaseRow(row.leaseId, { unitId: e.target.value })}
                >
                  <option value="">בחרו יחידה</option>
                  {vacantUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      יח׳ {u.unit_number}
                      {u.unit_name ? ` · ${u.unit_name}` : ''}
                    </option>
                  ))}
                </select>
                {errors[`unit_${row.leaseId}`] && (
                  <p className="text-xs text-destructive">{errors[`unit_${row.leaseId}`]}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="התחלה"
                  type="date"
                  value={row.startDate}
                  onChange={(e) => updateNewLeaseRow(row.leaseId, { startDate: e.target.value })}
                  error={errors[`start_${row.leaseId}`]}
                />
                <Input
                  label="סיום"
                  type="date"
                  value={row.endDate}
                  onChange={(e) => updateNewLeaseRow(row.leaseId, { endDate: e.target.value })}
                  error={errors[`end_${row.leaseId}`]}
                />
              </div>
              <Input
                label='שכ"ד (₪)'
                value={row.monthlyRent}
                onChange={(e) => updateNewLeaseRow(row.leaseId, { monthlyRent: e.target.value })}
                error={errors[`rent_${row.leaseId}`]}
              />
            </div>
          ))}
        </section>
      </form>
    </SlidePanel>
  );
}
