import { Badge } from '../ui/Badge';
import { useEntityDetail } from '../../contexts/EntityDetailContext';
import { formatCurrency } from '../../lib/utils';
import type { PropertyUnit } from '../../types/domain';
import { UNIT_STATUS_LABELS } from '../../types/domain';

const STATUS_VARIANT: Record<string, 'success' | 'primary' | 'warning' | 'outline'> = {
  occupied: 'success',
  available: 'primary',
  maintenance: 'warning',
  reserved: 'outline',
};

type UnitCard = PropertyUnit & { floor?: number };

interface PropertyUnitCardsProps {
  units: UnitCard[];
  propertyId?: string;
  propertyTitle?: string;
}

export function PropertyUnitCards({ units, propertyId, propertyTitle }: PropertyUnitCardsProps) {
  const { openUnit } = useEntityDetail();

  if (units.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">אין יחידות בנכס זה</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {units.map((unit) => (
        <button
          key={unit.id}
          type="button"
          className="group rounded-2xl border border-border bg-card/50 p-4 text-start transition-colors hover:border-primary/40 hover:bg-muted/30"
          onClick={() =>
            openUnit({
              ...unit,
              propertyTitle: propertyTitle ?? unit.unit_name ?? unit.unit_number,
              property_id: unit.property_id || propertyId || '',
            })
          }
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <Badge variant={STATUS_VARIANT[unit.unit_status] ?? 'outline'}>
              {UNIT_STATUS_LABELS[unit.unit_status]}
            </Badge>
            <span className="text-xs text-muted-foreground">יחידה #{unit.unit_number}</span>
          </div>
          <h4 className="font-semibold group-hover:text-primary">
            {unit.unit_name || unit.tenant_name || `יחידה ${unit.unit_number}`}
          </h4>
          {unit.tenant_name && unit.unit_name && (
            <p className="mt-1 text-sm text-muted-foreground">{unit.tenant_name}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {unit.floor != null && <span>קומה {unit.floor}</span>}
            {unit.area_sqm != null && <span>{unit.area_sqm} מ&quot;ר</span>}
          </div>
          {unit.monthly_rent != null && (
            <p className="mt-3 text-lg font-bold text-primary">{formatCurrency(unit.monthly_rent)}</p>
          )}
        </button>
      ))}
    </div>
  );
}
