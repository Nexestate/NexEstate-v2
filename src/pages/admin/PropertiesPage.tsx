import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { PageLoader } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { FilterBar } from '../../components/ui/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { fetchProperties } from '../../lib/services';
import { formatCurrency, getOccupancyPercent } from '../../lib/utils';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useMemo, useState } from 'react';
export function AdminPropertiesPage() {
  const [search, setSearch] = useState('');
  const { data: properties, loading } = useAsyncData(() => fetchProperties(), []);

  const filtered = useMemo(
    () => properties?.filter((p) => p.title.includes(search) || p.city.includes(search)) ?? [],
    [properties, search],
  );

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader title="ניהול נכסים" description={`${filtered.length} נכסים`} />
      <FilterBar search={search} onSearchChange={setSearch} placeholder="חיפוש נכס..." />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>נכס</TableHead>
            <TableHead>עיר</TableHead>
            <TableHead>יחידות</TableHead>
            <TableHead>תפוסה</TableHead>
            <TableHead>הכנסה</TableHead>
            <TableHead>סוג</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{p.title}</span>
                </div>
              </TableCell>
              <TableCell>{p.city}</TableCell>
              <TableCell>{p.totalUnits}</TableCell>
              <TableCell>
                <Badge variant="success">
                  {getOccupancyPercent(p.occupiedUnits, p.totalUnits)}%
                </Badge>
              </TableCell>
              <TableCell>{formatCurrency(p.monthlyIncome)}</TableCell>
              <TableCell><Badge variant="outline">{p.kind}</Badge></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/pending"><Button variant="outline">ממתינים לאישור</Button></Link>
        <Link to="/admin/shares"><Button variant="outline">שיתופי נכסים</Button></Link>
        <Link to="/admin/import"><Button variant="outline">ייבוא עסקאות</Button></Link>
      </div>
    </div>  );
}
