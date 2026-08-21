import { PageHeader } from '../../components/ui/PageHeader';
import { FilterBar } from '../../components/ui/FilterBar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DEMO_ADMIN_USERS } from '../../data/demoData';
import { ROLE_LABELS } from '../../lib/roles';
import type { UserRole } from '../../types';
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

export function AdminUsersPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      DEMO_ADMIN_USERS.filter(
        (u) => u.full_name.includes(search) || u.email.includes(search),
      ),
    [search],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="ניהול משתמשים" description={`${DEMO_ADMIN_USERS.length} משתמשים במערכת`} />
      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש משתמש..." />
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
          {filtered.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="primary">{ROLE_LABELS[u.role as UserRole] ?? u.role}</Badge>
              </TableCell>
              <TableCell>{new Date(u.created_at).toLocaleDateString('he-IL')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/shares"><Button variant="outline">שיתופי נכסים</Button></Link>
        <Link to="/admin/support"><Button variant="outline">פניות תמיכה</Button></Link>
      </div>
    </div>  );
}
