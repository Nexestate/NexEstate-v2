import { ArrowRight, Building2, Calendar, Pencil, Trash2, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/PageLoader';
import { deleteLease, fetchLease, updateLease } from '../../lib/services';
import { daysUntil, formatCurrency, formatDate } from '../../lib/utils';
import type { Lease } from '../../types/domain';

export function LeaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lease, setLease] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    fetchLease(id).then((data) => {
      setLease(data ?? null);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!lease || !window.confirm('למחוק את החוזה?')) return;
    await deleteLease(lease.id);
    navigate('/broker/leases');
  };

  if (loading) return <PageLoader />;
  if (!lease) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">חוזה לא נמצא</p>
        <Link to="/broker/leases" className="mt-4 inline-block text-primary hover:underline">
          חזרה לחוזים
        </Link>
      </div>
    );
  }

  const remaining = daysUntil(lease.end_date);

  return (
    <div className="space-y-6">
      <Link to="/broker/leases" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ArrowRight className="h-4 w-4" />
        חזרה לחוזים
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{lease.tenant_company || lease.tenant_name || 'חוזה'}</h2>
          <p className="text-muted-foreground">{lease.property_title} • יחידה {lease.unit_name || lease.unit_number || '—'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={lease.is_active ? 'success' : 'outline'}>{lease.is_active ? 'פעיל' : 'לא פעיל'}</Badge>
            {remaining != null && remaining <= 90 && remaining >= 0 && (
              <Badge variant="warning">מסתיים בעוד {remaining} ימים</Badge>
            )}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">שכ&quot;ד חודשי</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(lease.monthly_rent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">פיקדון</p>
            <p className="text-xl font-bold">{lease.deposit ? formatCurrency(lease.deposit) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">תחילה</p>
            <p className="flex items-center gap-1 font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(lease.start_date)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">סיום</p>
            <p className="flex items-center gap-1 font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(lease.end_date)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">שוכר</p>
            {lease.tenant_id ? (
              <Link to={`/broker/tenants/${lease.tenant_id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
                <User className="h-4 w-4" />
                {lease.tenant_company || lease.tenant_name}
              </Link>
            ) : (
              <p>{lease.tenant_name || '—'}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">נכס</p>
            <Link to={`/broker/properties/${lease.property_id}`} className="flex items-center gap-2 font-medium text-primary hover:underline">
              <Building2 className="h-4 w-4" />
              {lease.property_title || 'פרטי נכס'}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 py-4">
            <p className="text-xs text-muted-foreground">יחידה</p>
            {lease.unit_id ? (
              <Link to={`/broker/units/${lease.unit_id}`} className="font-medium text-primary hover:underline">
                {lease.unit_name || `יחידה ${lease.unit_number}`}
              </Link>
            ) : (
              <p>—</p>
            )}
            <p className="text-sm text-muted-foreground">
              תשלום ביום {lease.payment_day ?? 1} • {lease.include_vat ? 'כולל מע"מ' : 'ללא מע"מ'}
            </p>
          </CardContent>
        </Card>
      </div>

      {lease.notes && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">הערות</p>
            <p className="mt-1 text-sm">{lease.notes}</p>
          </CardContent>
        </Card>
      )}

      <LeaseEditModal
        open={editOpen}
        lease={lease}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function LeaseEditModal({
  open,
  lease,
  onClose,
  onSaved,
}: {
  open: boolean;
  lease: Lease;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [monthlyRent, setMonthlyRent] = useState(String(lease.monthly_rent));
  const [deposit, setDeposit] = useState(lease.deposit != null ? String(lease.deposit) : '');
  const [startDate, setStartDate] = useState(lease.start_date);
  const [endDate, setEndDate] = useState(lease.end_date);
  const [notes, setNotes] = useState(lease.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMonthlyRent(String(lease.monthly_rent));
    setDeposit(lease.deposit != null ? String(lease.deposit) : '');
    setStartDate(lease.start_date);
    setEndDate(lease.end_date);
    setNotes(lease.notes ?? '');
  }, [lease]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateLease(lease.id, {
        monthly_rent: Number(monthlyRent),
        deposit: deposit ? Number(deposit) : undefined,
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim() || undefined,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="עריכת חוזה">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <Input label='שכ"ד חודשי' value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} required />
        <Input label="פיקדון" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
        <Input label="תאריך התחלה" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <Input label="תאריך סיום" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
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
