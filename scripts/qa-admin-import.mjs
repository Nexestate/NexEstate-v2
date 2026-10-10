/**
 * Sign in as the Phase 1 QA admin and exercise admin-import-deals.
 * Does not print passwords or tokens.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}
const cred = readFileSync(resolve(process.cwd(), '.phase1-qa-admin.local'), 'utf8');
const EMAIL = cred.match(/^EMAIL=(.*)$/m)?.[1]?.trim();
const PASSWORD = cred.match(/^PASSWORD=(.*)$/m)?.[1]?.trim();
const FILE_ANON = cred.match(/^ANON_KEY=(.*)$/m)?.[1]?.trim();

const url = env.VITE_SUPABASE_URL;
const anon = env.VITE_SUPABASE_ANON_KEY || FILE_ANON;
const secret = env.SUPABASE_SERVICE_ROLE_KEY;
const publishable = anon;

const client = createClient(url, publishable, { auth: { persistSession: false } });
const { data: sessionData, error: signErr } = await client.auth.signInWithPassword({
  email: EMAIL,
  password: PASSWORD,
});
if (signErr || !sessionData.session) {
  console.log(JSON.stringify({ signIn: 'FAIL', error: signErr?.message ?? 'no session' }));
  process.exit(1);
}

const jwt = sessionData.session.access_token;
const adminId = sessionData.user.id;
const { data: brokerRow } = await client.from('profiles').select('id').eq('role', 'broker').limit(1).maybeSingle();
const targetBrokerId = adminId;

async function invoke(body) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/admin-import-deals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      apikey: publishable,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const unauthorized = await fetch(`${url.replace(/\/$/, '')}/functions/v1/admin-import-deals`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ brokerId: targetBrokerId, rows: [] }),
});

const invalid = await invoke({ brokerId: 'not-a-uuid', rows: [{ title: 'x', city: 'y', price: 1 }] });
const empty = await invoke({ brokerId: targetBrokerId, rows: [] });

const title = `PHASE1_QA_IMPORT_${Date.now()}`;
const valid = await invoke({
  filename: 'phase1-qa.csv',
  brokerId: targetBrokerId,
  rows: [
    {
      rowNumber: 2,
      title,
      address: 'QA',
      city: 'תל אביב',
      price: 1,
      kind: 'office',
      status: 'for_rent',
    },
  ],
});

const { data: props } = await client
  .from('properties')
  .select('id, title')
  .eq('title', title);
if (props?.length) {
  await client.from('properties').delete().eq('id', props[0].id);
}
const { count: remaining } = await client
  .from('properties')
  .select('id', { count: 'exact', head: true })
  .eq('title', title);
const { data: batches } = await client
  .from('import_batches')
  .select('id, imported_rows, failed_rows, status, filename')
  .eq('filename', 'phase1-qa.csv')
  .order('created_at', { ascending: false })
  .limit(1);

console.log(JSON.stringify({
  signIn: 'PASS',
  unauthorizedStatus: unauthorized.status,
  invalidStatus: invalid.status,
  invalidError: invalid.json.error ?? null,
  invalidField: invalid.json.field ?? null,
  emptyStatus: empty.status,
  emptyError: empty.json.error ?? null,
  emptyField: empty.json.field ?? null,
  validStatus: valid.status,
  validError: valid.json.error ?? null,
  validField: valid.json.field ?? null,
  imported: valid.json.imported ?? null,
  failed: valid.json.failed ?? null,
  batchStatus: valid.json.status ?? null,
  propertyCreatedThenDeleted: Boolean(props?.length) && remaining === 0,
  batchRecorded: batches?.[0]?.status ?? null,
  rowErrorCodes: (valid.json.errors ?? []).map((e) => e.code ?? e.message),
}, null, 2));
