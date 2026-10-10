import { Eye, Pencil, Share2, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { fetchAdminPropertyShares } from '../../lib/services/adminSharesService';
import { ServiceError } from '../../lib/services/serviceHelpers';
import type { PermissionLevel } from '../../types';

const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  view: 'צפייה',
  edit: 'עריכה',
  admin: 'מנהל',
};

const PERMISSION_ICONS: Record<PermissionLevel, typeof Eye> = {
  view: Eye,
  edit: Pencil,
  admin: Shield,
};

export function AdminSharesPage() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState<Awaited<ReturnType<typeof fetchAdminPropertyShares>>>([]);
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
      setRows(await fetchAdminPropertyShares(debounced));
    } catch (err) {
      setError(err instanceof ServiceError ? err.message : 'לא הצלחנו לטעון שיתופים');
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
        title="שיתופי נכסים"
        description={loading ? 'טוען...' : `${rows.length} שיתופים`}
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שיתוף..." />

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState
          icon={Share2}
          title="שגיאה בטעינה"
          description={error}
          actionLabel="נסה שוב"
          onAction={load}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="אין שיתופים"
          description="שיתופי נכסים יופיעו כאן כשמתווכים ישתפו נכסים עם משתמשים אחרים"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>נכס</TableHead>
              <TableHead>שותף עם</TableHead>
              <TableHead>שותף ע&quot;י</TableHead>
              <TableHead>הרשאה</TableHead>
              <TableHead>תאריך</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((share) => {
              const Icon = PERMISSION_ICONS[share.permission_level] ?? Eye;
              return (
                <TableRow key={share.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{share.property_title}</p>
                      <p className="text-xs text-muted-foreground">{share.property_city}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{share.shared_with_name}</p>
                      <p className="text-xs text-muted-foreground">{share.shared_with_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{share.shared_by_name}</TableCell>
                  <TableCell>
                    <Badge variant="primary">
                      <Icon className="h-3 w-3" />
                      {PERMISSION_LABELS[share.permission_level]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(share.created_at).toLocaleDateString('he-IL')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Link to="/admin/users">
        <Button variant="outline">ניהול משתמשים</Button>
      </Link>
    </div>
  );
}
