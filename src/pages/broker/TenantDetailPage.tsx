import { ArrowRight, Building2, Mail, MapPin, Pencil, Phone, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { deleteTenant, fetchLeases, fetchTenant, updateTenant } from '../../lib/services';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Lease, Tenant } from '../../types/domain';
import { TENANT_RATING_LABELS, TENANT_STATUS_LABELS, TENANT_TYPE_LABELS } from '../../types/domain';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === '1');

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchTenant(id), fetchLeases()]).then(([t, allLeases]) => {
      setTenant(t ?? null);
      setLeases(allLeases.filter((l) => l.tenant_id === id));
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!tenant || !window.confirm(`למחוק את השוכר ${tenant.company_name || tenant.full_name}?`)) return;
    await deleteTenant(tenant.id);
    navigate('/broker/tenants');
  };

  if (loading) return <PageLoader />;
  if (!tenant) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">שוכר לא נמצא</p>
        <Link to="/broker/tenants" className="mt-4 inline-block text-primary hover:underline">
          חזרה לשוכרים
        </Link>
      </div>
    );
  }

  const displayName = tenant.company_name || tenant.full_name;

  return (
    <div className="space-y-6">
      <Link to="/broker/tenants" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="h-4 w-4" />
        חזרה לשוכרים
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <p className="text-muted-foreground">{tenant.contact_name || tenant.full_name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="success">{TENANT_STATUS_LABELS[tenant.status]}</Badge>
            <Badge variant="outline">{TENANT_TYPE_LABELS[tenant.tenant_type ?? 'sole_proprietor']}</Badge>
            <Badge variant="outline">{TENANT_RATING_LABELS[tenant.rating ?? 'new']}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            עריכה
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()}>
            <Trash2 className="h-4 w-4" />
            מחיקה
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              {tenant.mobile || tenant.phone || 'אין טלפון'}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-primary" />
              {tenant.email || 'אין אימייל'}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              {[tenant.address, tenant.city].filter(Boolean).join(', ') || 'אין כתובת'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">נכס / יחידה</p>
            {tenant.property_id ? (
              <Link to={`/broker/properties/${tenant.property_id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                <Building2 className="h-4 w-4" />
                {tenant.property_title}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">לא משויך לנכס</p>
            )}
            {tenant.unit_id ? (
              <Link to={`/broker/units/${tenant.unit_id}`} className="text-sm text-primary hover:underline">
                יחידה {tenant.unit_number}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">אין יחידה פעילה</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">הערות</p>
            <p className="mt-1 text-sm">{tenant.notes || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">חוזים ({leases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">אין חוזים לשוכר זה</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>יחידה</TableHead>
                  <TableHead>תקופה</TableHead>
                  <TableHead>שכ&quot;ד</TableHead>
                  <TableHead>סטטוס</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow
                    key={lease.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/broker/leases/${lease.id}`)}
                  >
                    <TableCell className="font-medium">{lease.unit_name || lease.unit_number || '—'}</TableCell>
                    <TableCell>
                      {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                    </TableCell>
                    <TableCell className="text-primary">{formatCurrency(lease.monthly_rent)}</TableCell>
                    <TableCell>
                      <Badge variant={lease.is_active ? 'success' : 'outline'}>
                        {lease.is_active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <TenantEditModal
        open={editOpen}
        tenant={tenant}
        onClose={() => {
          setEditOpen(false);
          if (searchParams.get('edit')) {
            searchParams.delete('edit');
            setSearchParams(searchParams, { replace: true });
          }
        }}
        onSaved={load}
      />
    </div>
  );
}

function TenantEditModal({
  open,
  tenant,
  onClose,
  onSaved,
}: {
  open: boolean;
  tenant: Tenant;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(tenant.full_name);
  const [companyName, setCompanyName] = useState(tenant.company_name ?? '');
  const [contactName, setContactName] = useState(tenant.contact_name ?? '');
  const [phone, setPhone] = useState(tenant.mobile || tenant.phone || '');
  const [email, setEmail] = useState(tenant.email ?? '');
  const [city, setCity] = useState(tenant.city ?? '');
  const [notes, setNotes] = useState(tenant.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(tenant.full_name);
    setCompanyName(tenant.company_name ?? '');
    setContactName(tenant.contact_name ?? '');
    setPhone(tenant.mobile || tenant.phone || '');
    setEmail(tenant.email ?? '');
    setCity(tenant.city ?? '');
    setNotes(tenant.notes ?? '');
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTenant(tenant.id, {
        full_name: fullName.trim(),
        company_name: companyName.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: phone.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="עריכת שוכר">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input label="שם מלא" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="שם חברה" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        <Input label="איש קשר" value={contactName} onChange={(e) => setContactName(e.target.value)} />
        <Input label="נייד" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label='דוא"ל' value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="עיר" value={city} onChange={(e) => setCity(e.target.value)} />
        <Input label="הערות" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'שומר...' : 'שמירה'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
