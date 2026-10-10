# Phase 1 — Manual test matrix

| TEST | EXPECTED | ACTUAL | PASS/FAIL | NOTES |
|------|----------|--------|-----------|-------|
| CLI sees `ynpdtbgmbunntckqmcaf` | Linked, Healthy | Linked `Nexestate's Project` | PASS | |
| Schema `support_tickets` | Table, RLS, policies, indexes | Verified via `db query` | PASS | Manual SQL; not in schema_migrations |
| Schema `import_batches` | Table + `status` | Verified | PASS | |
| Deploy `admin-import-deals` | ACTIVE on this ref | ACTIVE v1, `verify_jwt=true` | PASS | |
| Unauthorized function call | Rejected | HTTP 401 Invalid session | PASS | Non-user Bearer |
| Admin function import | Small controlled import | No admin profile exists | BLOCKED | 0 admin/superadmin rows |
| GitHub → Vercel | Production on `main` | Success | PASS | |
| Production `/login` | Loads | Loads | PASS | |
| Google Login | Dashboard | | BLOCKED | Needs your session |
| Session restore | Keeps session | | BLOCKED | Needs your session |
| Logout | Login | | BLOCKED | Needs your session |
| My Properties | Real `properties`, no DEMO | Code clean; `/broker/my-properties` redirects unauth to login | BLOCKED | 1 property in DB |
| Admin Users | Real profiles | Code clean; 0 admin users so UI unreachable | BLOCKED | 2 profiles: broker + partner |
| Admin Shares | Live `property_shares` | 1 share in DB; admin UI unreachable | BLOCKED | |
| Admin Import | Function + batch | Function live; no admin JWT | BLOCKED | |
| Admin Support | Persist tickets | Table empty; form exists | BLOCKED | Needs login |
| Payments count | `lease_payments` | 0 rows | BLOCKED | Count will be 0 if QA'd |
| Buyer notifications | `notifications` | 0 rows; no buyer profile | NOT_APPLICABLE | |
| Mobile 390/375/360 | Usable | | BLOCKED | Needs your session |
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
| Admin RLS path | Admin can read all | No admin profile | BLOCKED |
