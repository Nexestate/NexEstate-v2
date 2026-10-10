/**
 * Creates exactly one controlled Phase 1 QA admin if missing.
 * Writes credentials to .phase1-qa-admin.local (gitignored).
 * Does not print the password.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
const env = {};
for (const line of envText.split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('MISSING_ENV');
  process.exit(1);
}

const EMAIL = 'phase1.qa.admin@nexestate.co';
const credPath = resolve(process.cwd(), '.phase1-qa-admin.local');
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
const found = existing?.users?.find((u) => u.email === EMAIL);

let password = '';
if (existsSync(credPath)) {
  const saved = readFileSync(credPath, 'utf8');
  const m = saved.match(/^PASSWORD=(.*)$/m);
  if (m) password = m[1].trim();
}

if (!found) {
  if (!password) password = `Qa1!${randomBytes(12).toString('base64url')}`;
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Phase 1 QA Admin', role: 'admin' },
  });
  if (error) {
    console.error('CREATE_USER_FAILED', error.message);
    process.exit(1);
  }
  writeFileSync(
    credPath,
    `EMAIL=${EMAIL}\nPASSWORD=${password}\nUSER_ID=${data.user.id}\n`,
    'utf8',
  );
  console.log(JSON.stringify({ created: true, email: EMAIL, userId: data.user.id }));
} else {
  if (!password) {
    password = `Qa1!${randomBytes(12).toString('base64url')}`;
    const { error } = await admin.auth.admin.updateUserById(found.id, { password });
    if (error) {
      console.error('RESET_PASSWORD_FAILED', error.message);
      process.exit(1);
    }
  }
  writeFileSync(
    credPath,
    `EMAIL=${EMAIL}\nPASSWORD=${password}\nUSER_ID=${found.id}\n`,
    'utf8',
  );
  console.log(JSON.stringify({ created: false, email: EMAIL, userId: found.id }));
}
