# Phase 1 — Manual test matrix

| TEST | EXPECTED | ACTUAL | PASS/FAIL | NOTES |
|------|----------|--------|-----------|-------|
| GitHub → Vercel auto-deploy | `vercel[bot]` Production on `main` | Confirmed on SHA `8630635` | PASS | No CLI required |
| Google Login | Redirect to dashboard | Previous owner confirmation | BLOCKED | Needs post-deploy session |
| Session restore | Refresh keeps session | | BLOCKED | After deploy |
| Logout | Returns to login | | BLOCKED | After deploy |
| My Properties | Lists `properties` for broker | Code uses `fetchProperties` only | BLOCKED | Production QA after deploy |
| My Properties empty | CTA "הוסף נכס" | Implemented | BLOCKED | After deploy |
| Admin Users | `profiles` rows | Code uses `fetchAdminProfiles` | BLOCKED | After deploy |
| Admin Shares | `property_shares` | Code uses live query | BLOCKED | After deploy |
| Admin Import | CSV preview → confirm → DB | Function not deployed | BLOCKED | Needs Edge + migration |
| Admin Support | Tickets from DB | Migration not applied | BLOCKED | Needs SQL Editor |
| User support form | Settings → submit ticket | Form wired | BLOCKED | Needs `support_tickets` |
| Payments sidebar count | `lease_payments` count | Code queries table | BLOCKED | After deploy |
| Buyer notifications | `notifications` | Code uses service | BLOCKED | After deploy |
| Mobile 390 | Phase 1 pages usable | | BLOCKED | After deploy |
| Mobile 375 | Phase 1 pages usable | | BLOCKED | After deploy |
| Mobile 360 | Phase 1 pages usable | | BLOCKED | After deploy |
| `npm run build` | Pass | Pass | PASS | Local |
| `npm test` | Pass | 2 tests pass | PASS | Local |

## Security spot checks

| TEST | EXPECTED | ACTUAL | PASS/FAIL |
|------|----------|--------|-----------|
| Non-admin `/admin/users` | `ProtectedRoute` admin/superadmin | Code-enforced; RLS not live-tested | BLOCKED |
| User A reads User B notifications | Denied by RLS | Policy exists in `schema.sql` | BLOCKED |
| User A reads User B support tickets | Denied by new policies | Migration not applied | BLOCKED |
| Non-admin import Edge | 403 | Function not deployed | BLOCKED |
