import { requirementsForTenantType } from '../../lib/propertyWorkspace';
import type { Tenant } from '../../types/domain';
import { Badge } from '../ui/Badge';

interface TenantDocumentsChecklistProps {
  tenant: Pick<Tenant, 'tenant_type'>;
  className?: string;
}

/** Required documents checklist (upload in Phase 2C). */
export function TenantDocumentsChecklist({ tenant, className }: TenantDocumentsChecklistProps) {
  const required = requirementsForTenantType(tenant.tenant_type);

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-foreground">מסמכים נדרשים</p>
      <p className="text-meta mt-0.5">
        0/{required.length} הושלמו · העלאה פרטית תחובר בשלב הכספת
      </p>
      <ul className="mt-3 space-y-2">
        {required.map((req) => (
          <li
            key={req.id}
            className="flex items-center justify-between rounded-xl border border-border/90 bg-muted/20 px-3 py-2 text-sm"
          >
            <span>{req.label}</span>
            <Badge variant="outline">חסר</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
