import type { ParsedDealRow } from '../import/propertyDealCsv';
import { invokeEdgeFunction } from './edgeFunctions';
import { isDemoMode, requireSupabase, ServiceError, throwIfError } from './serviceHelpers';

export interface ImportBatchRow {
  id: string;
  filename: string;
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  duplicate_rows: number;
  created_at: string;
}

export interface AdminImportResult {
  imported: number;
  failed: number;
  duplicates: number;
  errors: { rowNumber: number; message: string }[];
  batchId?: string;
}

export async function fetchImportBatches(): Promise<ImportBatchRow[]> {
  if (isDemoMode()) return [];

  const client = requireSupabase();
  const { data, error } = await client
    .from('import_batches')
    .select('id, filename, total_rows, imported_rows, failed_rows, duplicate_rows, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error?.code === '42P01') return [];
  throwIfError(error);
  return (data ?? []) as ImportBatchRow[];
}

export async function runAdminPropertyImport(
  filename: string,
  rows: ParsedDealRow[],
  brokerId: string,
): Promise<AdminImportResult> {
  if (!rows.length) {
    throw new ServiceError('אין שורות תקינות לייבוא');
  }

  if (isDemoMode()) {
    throw new ServiceError('ייבוא זמין רק עם חיבור Supabase');
  }

  return await invokeEdgeFunction<AdminImportResult>('admin-import-deals', {
    filename,
    brokerId,
    rows,
  });
}
