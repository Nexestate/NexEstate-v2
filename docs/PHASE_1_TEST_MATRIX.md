# Phase 1 — Manual test matrix

**Updated:** 2026-10-10  
**Environment:** https://www.nexestate.co  
**QA identity:** one controlled `admin` profile (`phase1.qa.admin@nexestate.co`). Broker and partner roles were not changed.

| TEST | EXPECTED | ACTUAL | PASS/FAIL | NOTES |
|------|----------|--------|-----------|-------|
| CLI sees `ynpdtbgmbunntckqmcaf` | Linked, Healthy | Linked `Nexestate's Project` | PASS | |
| Schema `support_tickets` | Table, RLS, policies, indexes | Verified via `db query` | PASS | Manual SQL; not in schema_migrations |
| Schema `import_batches` | Table + `status` | Verified | PASS | `GRANT` to `authenticated` required so admin RLS can insert |
| Deploy `admin-import-deals` | ACTIVE on this ref | ACTIVE, JWT required | PASS | User-JWT + `is_admin()` + `created_by` |
| Unauthorized function call | Rejected | HTTP 401 | PASS | |
| Admin function import | Small controlled import | 200 imported 1, then deleted | PASS | Cleanup `PHASE1_QA_IMPORT_*` |
| GitHub → Vercel | Production on `main` | Success | PASS | |
| Production `/login` | Loads | Loads | PASS | |
| Google Login | Dashboard | Confirmed working in production | PASS | Do not re-diagnose unless a new auth error appears |
| Email/password QA admin | Reaches `/admin` | Reaches `/admin` as Phase 1 QA Admin | PASS | Only this profile was created/promoted |
| Session restore | Keeps session | Reload of `/admin/settings` kept QA admin | PASS | |
| Logout | Login | `/login` after התנתקות | PASS | |
| Dashboard after login | Live stats, no DEMO | Admin home + broker home load; QA admin owns 0 properties | PASS | Admin `/admin/properties` shows the live כרמיאל building |
| My Properties | Real `properties`, no DEMO | Empty owned list for QA admin; no DEMO | PASS | The one production property is owned by the existing broker |
| Admin Users | Real profiles | `3 משתמשים במערכת` (broker, partner, QA admin) | PASS | |
| Admin Shares | Live `property_shares` | `1 שיתופים` — בניין שקטל / כרמיאל / Michael Viner | PASS | Two-query join after deploy `0e881b9` |
| Admin Import | Function + batch history | Upload UI + 5 live batch rows | PASS | |
| Admin Support | Persist tickets | `1 פניות` — Phase 1 QA persistence check + submitter profile | PASS | Form + admin list after deploy `0e881b9` |
| Support form persistence | Insert + success copy | Success + row `Phase 1 QA — persistence check` | PASS | Settings → פרטיות |
| Payments empty state | Empty, not DEMO | `אין תשלומים להצגה` / ₪0 | PASS | `lease_payments` = 0 |
| Notifications empty state | Empty, not spinner | After `GRANT` on `notifications`, page loads with 0 tabs | PASS | Was `42501` before GRANT; empty-state copy ships with this deploy |
| Mobile 390/375/360 | Usable authenticated shell | Bottom nav + My Properties empty state usable | PASS | 390 / 375 / 360 |
| `npm run build` / `npm test` | Pass | Pass | PASS | Local |

## RLS smoke (executed 2026-10-10)

| TEST | EXPECTED | ACTUAL | PASS/FAIL |
|------|----------|--------|-----------|
| Broker inserts own ticket | Allowed | inserted | PASS |
| Broker impersonates partner `user_id` | Rejected | rejected | PASS |
| Broker sees only own test tickets | 1 | 1 | PASS |
| Partner cannot read broker ticket | 0 | 0 | PASS |
| Broker/partner cannot read `import_batches` | 0 | 0 | PASS |
| Partner inserts own ticket | Allowed | inserted | PASS |
| Test rows leftover | 0 | 0 | PASS |
| Admin reads all tickets | Allowed | PASS after QA admin | PASS |
| Admin reads `import_batches` | Allowed | PASS after GRANT | PASS |
| Admin reads all profiles | Allowed | 3 rows | PASS |
| Admin reads all properties | Allowed | 1 live property | PASS |
| Notifications SELECT as authenticated | Allowed for own rows | PASS after GRANT; RLS unchanged | PASS |
