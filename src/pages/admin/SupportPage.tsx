import { AlertCircle, CheckCircle, Clock, LifeBuoy } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import {
  fetchAdminSupportTickets,
  updateSupportTicketStatus,
  type SupportTicket,
  type SupportTicketStatus,
} from '../../lib/services/supportTicketsService';
import { ServiceError } from '../../lib/services/serviceHelpers';

const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'נפתר',
};

const STATUS_VARIANTS: Record<SupportTicketStatus, 'destructive' | 'warning' | 'success'> = {
  open: 'destructive',
  in_progress: 'warning',
  resolved: 'success',
};

const PRIORITY_LABELS = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' };

export function AdminSupportPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTickets(await fetchAdminSupportTickets(debounced));
    } catch (err) {
      setError(
        err instanceof ServiceError
          ? err.message
          : 'לא הצלחנו לטעון פניות. ודאו שמיגרציית support_tickets הופעלה.',
      );
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      tickets.filter((t) => statusFilter === 'all' || t.status === statusFilter),
    [tickets, statusFilter],
  );

  const stats = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
    }),
    [tickets],
  );

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setAdminNotes(ticket.admin_notes ?? '');
    setSaveMsg('');
  };

  const saveTicket = async (status?: SupportTicketStatus) => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateSupportTicketStatus(selected.id, {
        status: status ?? selected.status,
        admin_notes: adminNotes.trim() || null,
      });
      setSaveMsg('נשמר');
      await load();
      setSelected(null);
    } catch (err) {
      setSaveMsg(err instanceof ServiceError ? err.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="פניות תמיכה" description={`${tickets.length} פניות`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'פתוחות', value: stats.open, icon: AlertCircle, color: 'text-destructive' },
          { label: 'בטיפול', value: stats.in_progress, icon: Clock, color: 'text-warning' },
          { label: 'נפתרו', value: stats.resolved, icon: CheckCircle, color: 'text-success' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border p-4">
            <div className="flex items-center gap-2">
              <Icon className={`h-5 w-5 ${color}`} />
              <span className="text-2xl font-bold">{value}</span>
            </div>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'הכל' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש פנייה..." />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState
          icon={LifeBuoy}
          title="שגיאה בטעינה"
          description={error}
          actionLabel="נסה שוב"
          onAction={load}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="אין פניות"
          description="פניות ממשתמשים יופיעו כאן"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>נושא</TableHead>
              <TableHead>משתמש</TableHead>
              <TableHead>עדיפות</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">{ticket.message}</p>
                </TableCell>
                <TableCell>
                  <p>{ticket.user_name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={ticket.priority === 'high' ? 'destructive' : 'outline'}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[ticket.status]}>{STATUS_LABELS[ticket.status]}</Badge>
                </TableCell>
                <TableCell>{new Date(ticket.created_at).toLocaleDateString('he-IL')}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => openTicket(ticket)}>
                    פתח
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <p className="text-xs text-muted-foreground">
        תשובות במייל ללקוח לא מיושמות בשלב זה — עדכון סטטוס והערות אדמין בלבד.
      </p>

      <Link to="/admin/users">
        <Button variant="outline">ניהול משתמשים</Button>
      </Link>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.subject ?? 'פנייה'}>
        {selected && (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground whitespace-pre-wrap">{selected.message}</p>
            <p>
              <span className="text-muted-foreground">מאת: </span>
              {selected.user_name} ({selected.user_email})
            </p>
            <label className="block">
              <span className="text-muted-foreground">הערות אדמין</span>
              <textarea
                className="mt-1 w-full min-h-24 rounded-lg border border-border bg-background p-2"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={saving} onClick={() => saveTicket('in_progress')}>
                סמן בטיפול
              </Button>
              <Button size="sm" variant="outline" disabled={saving} onClick={() => saveTicket('resolved')}>
                סמן נפתר
              </Button>
              <Button size="sm" variant="ghost" disabled={saving} onClick={() => saveTicket()}>
                שמור הערות
              </Button>
            </div>
            {saveMsg && <p className="text-primary">{saveMsg}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
