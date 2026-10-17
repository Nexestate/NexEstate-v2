import type { Tenant, TenantDocumentFile, TenantType } from '../../types/domain';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';
import { STORAGE_BUCKETS } from './storageService';

const demoFiles = new Map<string, TenantDocumentFile[]>();
export const TENANT_DOCS_NOTES_MARKER = '\n\n__NEXESTATE_TENANT_DOCS__\n';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function parseTenantDocumentFiles(raw: unknown): TenantDocumentFile[] {
  if (!Array.isArray(raw)) return [];
  const out: TenantDocumentFile[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const requirement_id = o.requirement_id as string;
    const storage_path = o.storage_path as string;
    const file_name = o.file_name as string;
    const uploaded_at = o.uploaded_at as string;
    if (!requirement_id || !storage_path || !file_name || !uploaded_at) continue;
    const file: TenantDocumentFile = {
      requirement_id,
      storage_path,
      file_name,
      uploaded_at,
    };
    if (typeof o.content_type === 'string') file.content_type = o.content_type;
    out.push(file);
  }
  return out;
}

export function extractDocsFromNotes(notes?: string | null): TenantDocumentFile[] {
  if (!notes) return [];
  const idx = notes.indexOf(TENANT_DOCS_NOTES_MARKER);
  if (idx < 0) return [];
  try {
    return parseTenantDocumentFiles(JSON.parse(notes.slice(idx + TENANT_DOCS_NOTES_MARKER.length)));
  } catch {
    return [];
  }
}

export function stripDocsFromNotes(notes?: string | null): string {
  if (!notes) return '';
  const idx = notes.indexOf(TENANT_DOCS_NOTES_MARKER);
  return (idx >= 0 ? notes.slice(0, idx) : notes).trim();
}

export function embedDocsInNotes(humanNotes: string, files: TenantDocumentFile[]): string {
  const base = humanNotes.trim();
  const payload = `${TENANT_DOCS_NOTES_MARKER}${JSON.stringify(files)}`;
  return base ? `${base}${payload}` : payload.trimStart();
}

function tenantDocPath(managerId: string, tenantId: string, requirementId: string, fileName: string): string {
  return `${managerId}/${tenantId}/${requirementId}/${Date.now()}-${sanitizeFileName(fileName)}`;
}

async function resolveStorageOwnerId(tenantId: string, fallbackManagerId: string): Promise<string> {
  if (isDemoMode()) return fallbackManagerId;
  const client = requireSupabase();
  const { data } = await client
    .from('tenants')
    .select('manager_id, broker_id')
    .eq('id', tenantId)
    .maybeSingle();
  return (data?.manager_id as string | undefined) ?? (data?.broker_id as string | undefined) ?? fallbackManagerId;
}

export async function fetchTenantDocumentFiles(tenantId: string): Promise<TenantDocumentFile[]> {
  if (isDemoMode()) return demoFiles.get(tenantId) ?? [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('tenants')
    .select('document_files, notes')
    .eq('id', tenantId)
    .maybeSingle();
  throwIfError(error);

  const fromColumn = parseTenantDocumentFiles(data?.document_files);
  if (fromColumn.length > 0) return fromColumn;
  return extractDocsFromNotes(data?.notes as string | null);
}

async function persistDocumentFiles(tenantId: string, files: TenantDocumentFile[]): Promise<void> {
  if (isDemoMode()) {
    demoFiles.set(tenantId, files);
    return;
  }
  const client = requireSupabase();
  const { error } = await client
    .from('tenants')
    .update({ document_files: files, updated_at: new Date().toISOString() })
    .eq('id', tenantId);

  if (!error) return;

  const missingColumn =
    error.message.includes('document_files') ||
    error.code === 'PGRST204' ||
    error.message.includes('column');
  if (!missingColumn) throwIfError(error);

  const { data: row, error: readErr } = await client.from('tenants').select('notes').eq('id', tenantId).maybeSingle();
  throwIfError(readErr);
  const humanNotes = stripDocsFromNotes(row?.notes as string | null);
  const notes = embedDocsInNotes(humanNotes, files);
  const { error: notesErr } = await client
    .from('tenants')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', tenantId);
  throwIfError(notesErr);
}

function storageErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Bucket not found') || msg.includes('bucket')) {
    return 'חסר bucket «tenant-documents» ב-Supabase — הריצו את migration 20261017130000_tenant_document_files.sql';
  }
  if (msg.includes('row-level security') || msg.includes('policy')) {
    return 'אין הרשאת storage לשוכר — בדקו RLS על bucket tenant-documents';
  }
  return 'העלאה נכשלה — נסו שוב או פנו לתמיכה';
}

export async function uploadTenantDocument(input: {
  managerId: string;
  tenantId: string;
  tenantType?: TenantType;
  requirementId: string;
  file: File;
}): Promise<TenantDocumentFile[]> {
  const { managerId, tenantId, requirementId, file } = input;
  const existing = await fetchTenantDocumentFiles(tenantId);
  const ownerId = await resolveStorageOwnerId(tenantId, managerId);
  const path = tenantDocPath(ownerId, tenantId, requirementId, file.name);

  if (!isDemoMode()) {
    const client = requireSupabase();
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKETS.tenantDocuments)
      .upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
    if (uploadError) {
      throw new ServiceError(storageErrorMessage(uploadError), 'TENANT_DOC_UPLOAD');
    }
  }

  const entry: TenantDocumentFile = {
    requirement_id: requirementId,
    storage_path: path,
    file_name: file.name,
    uploaded_at: new Date().toISOString(),
    content_type: file.type || undefined,
  };

  const next = [...existing.filter((f) => f.requirement_id !== requirementId), entry];
  await persistDocumentFiles(tenantId, next);
  return next;
}

export async function deleteTenantDocument(input: {
  managerId: string;
  tenantId: string;
  requirementId: string;
}): Promise<TenantDocumentFile[]> {
  const { managerId, tenantId, requirementId } = input;
  const existing = await fetchTenantDocumentFiles(tenantId);
  const removed = existing.find((f) => f.requirement_id === requirementId);
  const next = existing.filter((f) => f.requirement_id !== requirementId);
  const ownerId = await resolveStorageOwnerId(tenantId, managerId);

  if (removed && !isDemoMode()) {
    const client = requireSupabase();
    if (removed.storage_path.startsWith(`${ownerId}/`)) {
      const { error } = await client.storage.from(STORAGE_BUCKETS.tenantDocuments).remove([removed.storage_path]);
      if (error) console.warn('[tenantDocuments] storage delete', error.message);
    }
  }

  await persistDocumentFiles(tenantId, next);
  return next;
}

export async function getTenantDocumentDownloadUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  if (isDemoMode()) return storagePath;
  const client = requireSupabase();
  const { data, error } = await client.storage
    .from(STORAGE_BUCKETS.tenantDocuments)
    .createSignedUrl(storagePath, expiresIn);
  throwIfError(error);
  if (!data?.signedUrl) throw new ServiceError('Failed to create signed URL', 'STORAGE_SIGNED_URL');
  return data.signedUrl;
}

export function documentsForTenant(tenant: Pick<Tenant, 'document_files' | 'notes'>): TenantDocumentFile[] {
  if (tenant.document_files?.length) return tenant.document_files;
  return extractDocsFromNotes(tenant.notes);
}
