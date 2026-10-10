# Phase 1 — Production deployment

**Date:** 2026-10-10  
**QA admin:** one controlled `admin` profile created; broker/partner unchanged.  
**Follow-up GRANTs (RLS unchanged):** `import_batches` + `notifications` → `authenticated` SELECT/INSERT/UPDATE.  

**Repository:** `Nexestate/NexEstate-v2`  
**Production branch:** `main`  
**Auto-deploy:** YES — `vercel[bot]` creates Production deployments on `main`  
**Expected Vercel project:** `Nexus / nexestate_v2` → `https://nexestate.co`  
**Supabase:** `Nexestate's Project` / `ynpdtbgmbunntckqmcaf`

Vercel CLI is **not required** for this deploy. GitHub → Vercel integration is already live.

---

## Pre-flight

| Check | Result |
|-------|--------|
| GitHub WRITE (`Adwrks365`) | OK |
| Production branch | `main` |
| Auto deploy | Enabled (`vercel[bot]`) |
| Cursor account | Adwrks 365 (intentional) |
| Supabase MCP / CLI on Nexestate org | **No** — Adwrks365 org only |
| Custom Edge secrets required | **None** — uses platform `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

---

## Migration review (`20261010120000_support_and_import_batches.sql`)

| Check | Result |
|-------|--------|
| DROP TABLE / DROP COLUMN | None |
| Destructive ALTER | None |
| Idempotent | `CREATE TABLE/INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS`, `ADD COLUMN IF NOT EXISTS` |
| FKs | `profiles(id)` only |
| RLS | Enabled on both tables |
| Policies | Users: own tickets insert/select/update. Admins: full via `is_admin()`. Import: admin only |
| Existing equivalent tables | OpenAPI schema on production does **not** list `support_tickets` / `import_batches` — safe to create |

**Authoritative SQL (run once in SQL Editor):**  
`supabase/migrations/20261010120000_support_and_import_batches.sql`

---

## Rollback (do not run unless reverting)

Does **not** delete property/user data created by a successful import.

```sql
-- Only if Phase 1 must be fully rolled back:
DROP POLICY IF EXISTS "Users insert own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users select own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users update own support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins full access support tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins manage import batches" ON import_batches;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS import_batches;
```

Edge Function rollback: delete `admin-import-deals` in the Dashboard.  
Frontend rollback: revert the Phase 1 commit on `main`.

---

## Required production order

1. Run the migration file in Supabase SQL Editor on `ynpdtbgmbunntckqmcaf`
2. Deploy Edge Function `admin-import-deals` to the same project
3. Push/frontend auto-deploy on `main` (or wait if already pushed — pages fail closed until 1–2 exist)
4. QA via `docs/PHASE_1_TEST_MATRIX.md`

---

## Edge Function env (names only)

| Name | Source |
|------|--------|
| `SUPABASE_URL` | Platform default |
| `SUPABASE_SERVICE_ROLE_KEY` | Platform default |
| `SUPABASE_ANON_KEY` | Platform default (unused by this function) |

No Resend / payment secrets required for `admin-import-deals`.

---

## Manual actions if tooling cannot reach Nexestate org

1. Dashboard → SQL Editor → paste/run the **entire** migration file above  
2. Dashboard → Edge Functions → deploy `admin-import-deals` from this repo  
3. Confirm tables + RLS in Table Editor  
