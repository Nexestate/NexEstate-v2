import { CheckCircle, Eye, Pencil, Shield, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { DEMO_PROPERTY_SHARES } from '../../data/demoData';
import type { PermissionLevel } from '../../types';
import { useMemo, useState } from 'react';

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

  const filtered = useMemo(
    () =>
      DEMO_PROPERTY_SHARES.filter(
        (s) =>
          s.property_title.includes(search) ||
          s.shared_with_name.includes(search) ||
          s.shared_by_name.includes(search),
      ),
    [search],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="שיתופי נכסים"
        description={`${DEMO_PROPERTY_SHARES.length} שיתופים פעילים`}
      />

      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש שיתוף..." />

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
          {filtered.map((share) => {
            const Icon = PERMISSION_ICONS[share.permission_level];
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
                <TableCell>{new Date(share.created_at).toLocaleDateString('he-IL')}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div className="flex gap-3">
        <Link to="/admin/users"><Button variant="outline">ניהול משתמשים</Button></Link>
        <Link to="/admin/properties"><Button variant="outline">ניהול נכסים</Button></Link>
      </div>
    </div>
  );
}
