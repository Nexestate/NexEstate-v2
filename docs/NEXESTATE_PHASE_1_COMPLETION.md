# NexEstate — Phase 1 completion report

**Updated:** 2026-10-10 (CLI linked + function deployed)

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

## Database

Manual SQL already applied. **Not re-run.** Verified with `supabase db query`:

- `support_tickets` — RLS on; columns as designed; indexes user+status; policies insert/select/update own + admin ALL
- `import_batches` — RLS on; includes `status`; admin-only policy
- `schema_migrations` may not list this file (manual Editor apply) — documented mismatch, no duplicate SQL run

Production counts (no PII): profiles 2 (broker, partner), properties 1, property_shares 1, notifications 0, lease_payments 0, support_tickets 0, import_batches 0, **admin_profiles 0**

---

## Edge Function

`admin-import-deals` deployed to **`ynpdtbgmbunntckqmcaf` only**.

- Status: ACTIVE v1
- JWT verify: true
- Secrets: platform `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Unauthorized test: **401**
- Admin payload test: **BLOCKED** (no admin user)
- Function logs via MCP: permission denied

Existing other functions left untouched: `notify-share`, `icount-webhook`, `admin-api`

---

## RLS

Broker/partner smoke tests: **8/8 PASS**. Test tickets deleted.

Admin policy exists but cannot be session-tested (no admin/superadmin profile).

---

## Frontend P0

Code has **zero** `DEMO_` on the five surfaces. Production unauthenticated routes redirect to login.

---

## Deployment SHAs

| Item | Value |
|------|--------|
| Functionality | `71104814b83cab477e870db46cd8c217d1e9fbd3` |
| Latest docs on `main` | see git log |
| Vercel | https://vercel.com/nexus-d804/nexestate_v2/6VjSmxJqJX1gYtiWb11JgASV8gU7 |

---

## Remaining manual actions

1. Log in at https://nexestate.co with Google (broker) and walk My Properties / payments / support form / logout
2. Create or promote an **admin** or **superadmin** profile (none exist) then QA Admin Users/Shares/Import/Support
3. Optional: reconnect Supabase MCP to Nexestate for advisors/logs
4. Mobile 390/375/360 on those screens
