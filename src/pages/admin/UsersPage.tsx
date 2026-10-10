import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { FilterBar } from '../../components/ui/FilterBar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageLoader } from '../../components/ui/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { fetchAdminProfiles } from '../../lib/services/adminUsersService';
import { ServiceError } from '../../lib/services/serviceHelpers';
import { ROLE_LABELS } from '../../lib/roles';
import type { UserRole } from '../../types';
import { Users } from 'lucide-react';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchAdminProfiles>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminProfiles(debounced);
      setRows(data);
    } catch (err) {
      setError(
        err instanceof ServiceError ? err.message : 'לא הצלחנו לטעון משתמשים',
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [debounced]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="ניהול משתמשים"
        description={loading ? 'טוען...' : `${rows.length} משתמשים במערכת`}
      />
      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש משתמש..." />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState
          icon={Users}
          title="שגיאה בטעינה"
          description={error}
          actionLabel="נסה שוב"
          onAction={load}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="לא נמצאו משתמשים"
          description={search ? 'נסו חיפוש אחר' : 'אין רשומות profiles במערכת'}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead>תאריך הצטרפות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Badge variant="primary">
                    {ROLE_LABELS[u.role as UserRole] ?? u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString('he-IL')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/shares"><Button variant="outline">שיתופי נכסים</Button></Link>
        <Link to="/admin/support"><Button variant="outline">פניות תמיכה</Button></Link>
      </div>
    </div>
  );
}
