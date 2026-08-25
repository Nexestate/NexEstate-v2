import { Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';
import { formatCurrency } from '../../lib/utils';
import type { PropertyUnit } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';
import { EntityLinkButton } from './EntityLinkButton';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { stopRowClick } from './EntityDetailModal';

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
  const { openUnit, openTenantById, openLeaseById } = useEntityDetail();
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
            className={`cursor-pointer ${highlightUnitId === unit.id ? 'bg-primary/5 ring-1 ring-primary/30' : ''}`}
            onClick={() => openUnit({ ...unit, propertyTitle: unit.unit_number, property_id: propertyId })}
          >
            <TableCell className="font-medium">
              {unit.unit_number}
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
                <EntityLinkButton onClick={() => void openTenantById(unit.tenant_id!)}>
                  {unit.tenant_name}
                </EntityLinkButton>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              {unit.lease_id ? (
                <EntityLinkButton onClick={() => void openLeaseById(unit.lease_id!)}>
                  צפייה
                </EntityLinkButton>
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
                  onClick={(e) => { e.stopPropagation(); onEdit(unit); }}
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
