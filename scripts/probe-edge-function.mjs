/**
 * Safe unauthorized probe of admin-import-deals. Does not print secrets.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq < 1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const url = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anon = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';
const secret = env.SUPABASE_SERVICE_ROLE_KEY || '';
const key = anon || secret;

const res = await fetch(`${url}/functions/v1/admin-import-deals`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}`, apikey: key } : {}),
  },
  body: JSON.stringify({ brokerId: '00000000-0000-4000-8000-000000000000', rows: [] }),
});

const text = await res.text();
let body = text;
try {
  const parsed = JSON.parse(text);
  body = parsed.error || parsed.message || Object.keys(parsed).join(',');
} catch {
  body = text.slice(0, 120);
}

console.log(JSON.stringify({
  host: new URL(url).host,
  function: 'admin-import-deals',
  httpStatus: res.status,
  usedAnonKey: Boolean(anon),
  bodyPreview: String(body).slice(0, 160),
}, null, 2));
