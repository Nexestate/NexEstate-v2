import { useCallback, useEffect, useState } from 'react';
import { requirementsForTenantType } from '../../lib/propertyWorkspace';
import {
  deleteTenantDocument,
  documentsForTenant,
  getTenantDocumentDownloadUrl,
  uploadTenantDocument,
} from '../../lib/services/tenantDocumentsService';
import type { Tenant, TenantDocumentFile } from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TenantDocumentsPanelProps {
  tenant: Pick<Tenant, 'id' | 'tenant_type' | 'document_files'>;
  managerId: string;
  editable?: boolean;
  className?: string;
  onFilesChange?: (files: TenantDocumentFile[]) => void;
}

export function TenantDocumentsPanel({
  tenant,
  managerId,
  editable = false,
  className,
  onFilesChange,
}: TenantDocumentsPanelProps) {
  const required = requirementsForTenantType(tenant.tenant_type);
  const [files, setFiles] = useState<TenantDocumentFile[]>(() => documentsForTenant(tenant));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFiles(documentsForTenant(tenant));
  }, [tenant.id, tenant.document_files]);

  const completed = required.filter((r) => files.some((f) => f.requirement_id === r.id)).length;

  const applyFiles = useCallback(
    (next: TenantDocumentFile[]) => {
      setFiles(next);
      onFilesChange?.(next);
    },
    [onFilesChange],
  );

  const handleUpload = async (requirementId: string, file: File) => {
    setError(null);
    setBusyId(requirementId);
    try {
      const next = await uploadTenantDocument({
        managerId,
        tenantId: tenant.id,
        tenantType: tenant.tenant_type,
        requirementId,
        file,
      });
      applyFiles(next);
    } catch (e) {
      console.error('[TenantDocumentsPanel] upload failed', e);
      setError(e instanceof Error ? e.message : 'העלאה נכשלה');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (requirementId: string) => {
    setError(null);
    setBusyId(requirementId);
    try {
      const next = await deleteTenantDocument({ managerId, tenantId: tenant.id, requirementId });
      applyFiles(next);
    } catch (e) {
      console.error('[TenantDocumentsPanel] delete failed', e);
      setError('מחיקה נכשלה');
    } finally {
      setBusyId(null);
    }
  };

  const openFile = async (file: TenantDocumentFile) => {
    try {
      const url = await getTenantDocumentDownloadUrl(file.storage_path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.error('[TenantDocumentsPanel] download failed', e);
      setError('לא ניתן לפתוח את הקובץ');
    }
  };

  return (
    <div className={className}>
      <p className="text-sm font-semibold text-foreground">מסמכים נדרשים</p>
      <p className="text-meta mt-0.5">
        {completed}/{required.length} הושלמו
        {!editable ? ' · העלאה ומחיקה ב«עריכת שוכר»' : ' · נשמר מיד בעת העלאה'}
      </p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <ul className="mt-3 space-y-2">
        {required.map((req) => {
          const uploaded = files.find((f) => f.requirement_id === req.id);
          return (
            <li
              key={req.id}
              className="flex flex-col gap-2 rounded-xl border border-border/90 bg-muted/20 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{req.label}</span>
              <div className="flex flex-wrap items-center gap-2">
                {uploaded ? (
                  <>
                    <button
                      type="button"
                      className="max-w-[180px] truncate text-primary hover:underline"
                      onClick={() => void openFile(uploaded)}
                    >
                      {uploaded.file_name}
                    </button>
                    <Badge variant="success">הועלה</Badge>
                    {editable && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyId === req.id}
                        onClick={() => void handleDelete(req.id)}
                      >
                        מחק
                      </Button>
                    )}
                  </>
                ) : (
                  <Badge variant="outline">חסר</Badge>
                )}
                {editable && (
                  <label className="cursor-pointer">
                    <span className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-xs font-medium hover:bg-muted/60">
                      {busyId === req.id ? '…' : uploaded ? 'החלף קובץ' : 'העלה'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="sr-only"
                      disabled={busyId === req.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (file) void handleUpload(req.id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
