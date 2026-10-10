/**
 * Read-only probe: does production already have support_tickets / import_batches?
 * Uses local .env.local. Does not print secrets.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('MISSING_ENV: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

async function probe(table) {
  const { data, error, count, status } = await client
    .from(table)
    .select('id', { count: 'exact', head: true });
  return {
    table,
    status,
    count,
    hasError: Boolean(error),
    code: error?.code ?? null,
    message: error?.message ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    dataIsNull: data == null,
  };
}

const tables = await Promise.all([
  probe('support_tickets'),
  probe('import_batches'),
  probe('profiles'),
  probe('property_shares'),
  probe('lease_payments'),
  probe('notifications'),
  probe('properties'),
]);

const openapiRes = await fetch(`${url.replace(/\/$/, '')}/rest/v1/`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const openapi = await openapiRes.json().catch(() => ({}));
const paths = Object.keys(openapi.paths ?? {}).sort();
const defs = Object.keys(openapi.definitions ?? openapi.components?.schemas ?? {}).sort();
const supportCols = Object.keys(
  openapi.definitions?.support_tickets?.properties ??
    openapi.components?.schemas?.support_tickets?.properties ??
    {},
);
const importCols = Object.keys(
  openapi.definitions?.import_batches?.properties ??
    openapi.components?.schemas?.import_batches?.properties ??
    {},
);

console.log(
  JSON.stringify(
    {
      projectUrlHost: new URL(url).host,
      openapiStatus: openapiRes.status,
      allPaths: paths,
      definitionCount: defs.length,
      definitions: defs,
      supportCols,
      importCols,
      tables,
    },
    null,
    2,
  ),
);
