import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DEMO_SUPPORT_TICKETS } from '../../data/demoData';
import type { SupportTicket } from '../../data/demoData.admin';
import { useMemo, useState } from 'react';

const STATUS_LABELS: Record<SupportTicket['status'], string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'נפתר',
};

const STATUS_VARIANTS: Record<SupportTicket['status'], 'destructive' | 'warning' | 'success'> = {
  open: 'destructive',
  in_progress: 'warning',
  resolved: 'success',
};

const PRIORITY_LABELS = { low: 'נמוכה', medium: 'בינונית', high: 'גבוהה' };

export function AdminSupportPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = useMemo(
    () =>
      DEMO_SUPPORT_TICKETS.filter((t) => {
        const matchesSearch =
          t.subject.includes(search) ||
          t.user_name.includes(search) ||
          t.message.includes(search);
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [search, statusFilter],
  );

  const stats = {
    open: DEMO_SUPPORT_TICKETS.filter((t) => t.status === 'open').length,
    in_progress: DEMO_SUPPORT_TICKETS.filter((t) => t.status === 'in_progress').length,
    resolved: DEMO_SUPPORT_TICKETS.filter((t) => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="פניות תמיכה" description={`${DEMO_SUPPORT_TICKETS.length} פניות`} />

      <div className="grid grid-cols-3 gap-3">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>נושא</TableHead>
            <TableHead>משתמש</TableHead>
            <TableHead>עדיפות</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>תאריך</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{ticket.subject}</p>
                  <p className="max-w-xs truncate text-xs text-muted-foreground">{ticket.message}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p>{ticket.user_name}</p>
                  <p className="text-xs text-muted-foreground">{ticket.user_email}</p>
                </div>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Link to="/admin/users">
        <Button variant="outline">ניהול משתמשים</Button>
      </Link>
    </div>
  );
}
