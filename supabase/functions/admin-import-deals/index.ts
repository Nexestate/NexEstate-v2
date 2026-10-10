import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

interface ImportRow {
  rowNumber: number;
  title: string;
  address: string;
  city: string;
  price: number;
  kind: string;
  status: string;
  dealDate?: string;
}

interface ImportBody {
  filename?: string;
  brokerId: string;
  rows: ImportRow[];
}

const ALLOWED_KINDS = new Set(['apartment', 'house', 'office', 'commercial', 'industrial', 'land']);
const ALLOWED_STATUS = new Set(['for_sale', 'for_rent', 'sold', 'rented']);

async function assertAdmin(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  const role = data?.role as string | undefined;
  return role === 'admin' || role === 'superadmin';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse();

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const supabase = createAdminClient();
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return jsonResponse({ error: 'Invalid session' }, 401);
    }

    const userId = userData.user.id;
    if (!(await assertAdmin(userId))) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    const body = (await req.json()) as ImportBody;
    const brokerId = typeof body.brokerId === 'string' ? body.brokerId.trim() : '';
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!brokerId || !uuidRe.test(brokerId) || !Array.isArray(body.rows) || body.rows.length === 0) {
      return jsonResponse({ error: 'Missing brokerId or rows' }, 400);
    }

    if (body.rows.length > 500) {
      return jsonResponse({ error: 'Too many rows (max 500)' }, 400);
    }

    const { data: brokerProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', brokerId)
      .maybeSingle();
    if (!brokerProfile) {
      return jsonResponse({ error: 'Broker not found' }, 400);
    }

    const filename = (body.filename ?? 'import.csv').replace(/[^\w.\u0590-\u05FF-]/g, '_').slice(0, 200);

    const errors: { rowNumber: number; message: string }[] = [];
    let imported = 0;
    let duplicates = 0;
    let failed = 0;

    const existingKeys = new Set<string>();
    const { data: existingProps } = await supabase
      .from('properties')
      .select('title, city')
      .eq('broker_id', brokerId)
      .limit(5000);

    for (const p of existingProps ?? []) {
      existingKeys.add(`${(p.title as string).toLowerCase()}|${(p.city as string).toLowerCase()}`);
    }

    for (const row of body.rows) {
      if (!row.title?.trim() || !row.city?.trim()) {
        failed++;
        errors.push({ rowNumber: row.rowNumber, message: 'חסרים שדות חובה' });
        continue;
      }
      if (!Number.isFinite(row.price) || row.price < 0) {
        failed++;
        errors.push({ rowNumber: row.rowNumber, message: 'מחיר לא תקין' });
        continue;
      }
      const kind = ALLOWED_KINDS.has(row.kind) ? row.kind : 'office';
      const status = ALLOWED_STATUS.has(row.status) ? row.status : 'for_rent';
      const key = `${row.title.trim().toLowerCase()}|${row.city.trim().toLowerCase()}`;
      if (existingKeys.has(key)) {
        duplicates++;
        errors.push({ rowNumber: row.rowNumber, message: 'כפילות — נכס קיים' });
        continue;
      }

      const { error: insertError } = await supabase.from('properties').insert({
        title: row.title.trim(),
        address: row.address?.trim() ?? '',
        city: row.city.trim(),
        price: row.price,
        kind,
        status,
        broker_id: brokerId,
        visibility: 'private',
      });

      if (insertError) {
        failed++;
        errors.push({ rowNumber: row.rowNumber, message: 'שגיאה בשמירה' });
        continue;
      }

      existingKeys.add(key);
      imported++;
    }

    const batchStatus =
      imported === 0 ? 'failed' : failed + duplicates > 0 ? 'partial' : 'completed';

    const { data: batchRow } = await supabase
      .from('import_batches')
      .insert({
        imported_by: userId,
        filename,
        total_rows: body.rows.length,
        imported_rows: imported,
        failed_rows: failed,
        duplicate_rows: duplicates,
        error_summary: errors.slice(0, 100),
        status: batchStatus,
      })
      .select('id')
      .maybeSingle();

    return jsonResponse({
      imported,
      failed,
      duplicates,
      errors,
      batchId: batchRow?.id,
      status: batchStatus,
    });
  } catch (err) {
    console.error('[admin-import-deals]', err);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});
