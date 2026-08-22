import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { formatCurrency } from '../../lib/utils';
import type { PropertyUnit } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

interface ManagedUnitsTableProps {
  propertyId: string;
  units: PropertyUnit[];
  onEdit?: (unit: PropertyUnit) => void;
  highlightUnitId?: string | null;
}

export function ManagedUnitsTable({
  propertyId,
  units,
  onEdit,
  highlightUnitId,
}: ManagedUnitsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>יחידה</TableHead>
          <TableHead>שם</TableHead>
          <TableHead>שטח</TableHead>
          <TableHead>שכ&quot;ד</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>שוכר</TableHead>
          <TableHead>חוזה</TableHead>
          {onEdit && <TableHead className="w-12" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {units.map((unit) => (
          <TableRow
            key={unit.id}
            className={highlightUnitId === unit.id ? 'bg-primary/5 ring-1 ring-primary/30' : undefined}
          >
            <TableCell className="font-medium">
              <Link
                to={`/broker/units?property=${propertyId}&open=${unit.id}`}
                className="text-primary hover:underline"
              >
                {unit.unit_number}
              </Link>
            </TableCell>
            <TableCell>{unit.unit_name ?? '—'}</TableCell>
            <TableCell>{unit.area_sqm ? `${unit.area_sqm} מ"ר` : '—'}</TableCell>
            <TableCell>{unit.monthly_rent ? formatCurrency(unit.monthly_rent) : '—'}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
                {UNIT_STATUS_LABELS[unit.unit_status]}
              </Badge>
            </TableCell>
            <TableCell>
              {unit.tenant_id ? (
                <Link
                  to={`/broker/tenants?property=${propertyId}&open=${unit.tenant_id}`}
                  className="text-primary hover:underline"
                >
                  {unit.tenant_name}
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {unit.lease_id ? (
                <Link
                  to={`/broker/leases?property=${propertyId}&open=${unit.lease_id}`}
                  className="text-primary hover:underline"
                >
                  צפייה
                </Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            {onEdit && (
              <TableCell>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="עריכת יחידה"
                  onClick={() => onEdit(unit)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
