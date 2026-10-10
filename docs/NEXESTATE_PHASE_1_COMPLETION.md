# NexEstate — Phase 1 completion report

**Updated:** 2026-10-10 (authenticated QA + one controlled admin)

**Gate:** **NOT READY FOR PHASE 2** until Admin Shares and Admin Support lists pass on production after the embed-query deploy.

---

## Account connectivity

| Service | Status |
|---------|--------|
| Cursor | Adwrks 365 — intentional |
| GitHub | `Adwrks365` WRITE on `Nexestate/NexEstate-v2` |
| Vercel | Auto-deploy `main` → `nexus-d804/nexestate_v2` → https://nexestate.co |
| Supabase CLI | **Linked** to `ynpdtbgmbunntckqmcaf` / Nexestate's Project / `ACTIVE_HEALTHY` |
| Supabase MCP | Still no permission on this ref (CLI used instead) |

---

## Controlled admin

Created **exactly one** test user using the existing role model. Broker and partner profiles were not changed.

| Field | Value |
|-------|--------|
| Email | `phase1.qa.admin@nexestate.co` |
| Role | `admin` |
| Profile id | `bf54e99b-e84f-403a-90c2-d0ab4f4126cb` |
| Other profiles | broker `nexuservice@gmail.com`, partner `viner.michael@gmail.com` (unchanged) |

Credentials live only in gitignored `.phase1-qa-admin.local`.

---

## Database

Manual SQL already applied. **Not re-run.** Additional production GRANTs (RLS unchanged):

- `import_batches`: `SELECT, INSERT, UPDATE` to `authenticated` (admin-only RLS still applies)
- `notifications`: `SELECT, INSERT, UPDATE` to `authenticated` (own-row / admin RLS still applies)

Production counts (no PII): profiles **3**, properties **1**, property_shares **1**, notifications **0**, lease_payments **0**, support_tickets **1** (Phase 1 QA persistence check), import_batches **5**.

---

## Edge Function

`admin-import-deals` deployed to **`ynpdtbgmbunntckqmcaf` only**.

- Status: ACTIVE
- JWT verify: true
- Unauthorized: **401**
- Admin import QA: **200** (1 row), then deleted
- Data path: user JWT + `is_admin()`; inserts set `created_by`

Existing other functions left untouched: `notify-share`, `icount-webhook`, `admin-api`

---

## RLS

| Suite | Result |
|-------|--------|
| Broker/partner | 8/8 PASS |
| Admin (QA admin session) | 4/4 PASS after GRANTs |
| Notifications authenticated SELECT | PASS after GRANT |

---

## Frontend P0 QA (production)

| Surface | Result |
|---------|--------|
| Google OAuth | **PASS** (confirmed; not re-diagnosed) |
| Dashboard after login | **PASS** |
| My Properties | **PASS** (empty for QA admin; live property visible on Admin Properties) |
| Support form persistence | **PASS** |
| Session restore | **PASS** |
| Logout | **PASS** |
| Payments empty state | **PASS** |
| Notifications empty state | **PASS** after notifications GRANT |
| Mobile 390/375/360 | **PASS** |
| Admin Users | **PASS** (3 users) |
| Admin Import | **PASS** |
| Admin Shares | **FAIL** — PostgREST embed `property_shares`–`profiles` (no FK). Fix is local two-query join. |
| Admin Support list | **FAIL** — multiple `support_tickets`–`profiles` relationships. Fix is local two-query join. Form insert already PASS. |

---

## Remaining before Phase 2

1. Deploy the Admin Shares + Admin Support query fixes to `main` / Vercel
2. Re-test `/admin/shares` and `/admin/support` as the QA admin
3. Optional: reconnect Supabase MCP to Nexestate for advisors/logs
4. Optional: Google broker session to view the owned כרמיאל property on `/broker/my-properties`

---

## Phase 2 gate

**NOT READY FOR PHASE 2.** P0 data wiring and most authenticated QA passed, but two admin list pages still fail in production until the embed-query deploy is live and retested.
