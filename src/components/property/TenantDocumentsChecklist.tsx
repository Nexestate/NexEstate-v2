import type { Tenant } from '../../types/domain';
import { TenantDocumentsPanel } from './TenantDocumentsPanel';

interface TenantDocumentsChecklistProps {
  tenant: Pick<Tenant, 'id' | 'tenant_type' | 'document_files'>;
  managerId?: string;
  className?: string;
}

/** Read-only documents list (upload/delete in tenant edit). */
export function TenantDocumentsChecklist({ tenant, managerId, className }: TenantDocumentsChecklistProps) {
  if (!managerId) {
    return (
      <div className={className}>
        <p className="text-sm font-semibold text-foreground">מסמכים נדרשים</p>
        <p className="text-meta mt-0.5 text-sm">טוען…</p>
      </div>
    );
  }
  return <TenantDocumentsPanel tenant={tenant} managerId={managerId} editable={false} className={className} />;
}
