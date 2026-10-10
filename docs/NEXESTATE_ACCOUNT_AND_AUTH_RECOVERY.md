# NexEstate — Account Readiness & Auth Recovery Report

**Date:** 2026-10-10  
**Repository:** NexEstate-v2  
**Production:** https://nexestate.co  
**Investigation status:** `BLOCKED — MANUAL ACTION REQUIRED` (Google login not restored end-to-end)

---

## A. Local project

| Field | Value |
|--------|--------|
| Root path | `C:\Users\User\NexEstate-v2` |
| Package name | `nexestate` (v0.1.0) |
| Framework | Vite 6 + React 18 + TypeScript |
| Branch | `main` (clean, up to date with `origin/main`) |
| Build command | `npm run build` → `tsc -b && vite build` |
| Output | `dist/` (per `vercel.json`) |
| Production domain | `https://nexestate.co` (also `https://www.nexestate.co`) |

`npm run build` — **PASS** (2026-10-10).

---

## B. GitHub

| Check | Result |
|--------|--------|
| Remote | `https://github.com/Nexestate/NexEstate-v2.git` |
| Repo name | NexEstate-v2 |
| Default branch | `main` |
| Working tree | Clean |

### GitHub CLI (`gh auth status`)

| Account | Active |
|---------|--------|
| `Adwrks365` | **Yes** (active for git operations) |
| `Nexestate` | No (logged in, not active) |

**Note:** Pushes use the **active** account. Ensure `Adwrks365` has write access to `Nexestate/NexEstate-v2` (push succeeded earlier in session).

---

## C. Vercel (local CLI)

| Check | Result |
|--------|--------|
| `npx vercel whoami` | `info-88828003` |
| Team context | **`adwrks` (Adwrks)** — hobby plan |
| `.vercel/project.json` | **Not present** in repo (project not linked locally) |
| `npx vercel project ls` | Lists **Adwrks** projects only (insytix, adwrks, etc.) — **no NexEstate / nexestate.co** |
| `npx vercel inspect nexestate.co` | **Not found** under team `adwrks` |

**Conclusion:** Production site `nexestate.co` is almost certainly deployed from a **different Vercel account/team** (likely Nexestate org), not from the currently authenticated `adwrks` CLI session.

**Manual:** Log in to Vercel as the Nexestate team owner and verify project linked to `Nexestate/NexEstate-v2`, production domain, and env vars.

---

## D. Supabase (local link vs MCP)

### Local CLI link (`supabase/.temp/linked-project.json`)

| Field | Value |
|--------|--------|
| ref | `ynpdtbgmbunntckqmcaf` |
| name | Nexestate's Project |
| organization_slug | `vibfmfmvkhypcwxfxulx` |

### Supabase MCP (read-only, this Cursor session)

| Field | Value |
|--------|--------|
| Organization | **Adwrks365** (`zgpexytqpbbysgevwjwb`) |
| Accessible projects | **One:** `wogiywmqsluwqpacmeca` — **Insytix Project** — `ACTIVE_HEALTHY` |
| `ynpdtbgmbunntckqmcaf` | **Not listed**; `get_project` → permission denied |

**Conclusion:** Supabase MCP is connected to the **wrong Supabase account** for NexEstate production data. The Nexestate project (`ynpdtbgmbunntckqmcaf` / org `vibfmfmvkhypcwxfxulx`) is **not manageable** from this MCP session.

**Manual:** In Cursor, authenticate Supabase MCP with the **Nexestate** Supabase login (org that owns `Nexestate's Project`), or use Supabase Dashboard directly.

---

## E. Account matrix

| System | Expected NexEstate resource | Actual | Status |
|--------|---------------------------|--------|--------|
| GitHub account (active CLI) | Nexestate org access | `Adwrks365` active | **MISMATCH** (secondary `Nexestate` account exists) |
| GitHub repo | `Nexestate/NexEstate-v2` | Same | **READY** |
| Vercel account/team | Nexestate / nexestate.co project | CLI: **adwrks** only; nexestate.co not visible | **MISMATCH** |
| Vercel project | nexestate.co | Not linked locally; not under `adwrks` | **MANUAL_CHECK** |
| Supabase account/org | Nexestate (`vibfmfmvkhypcwxfxulx`) | MCP: **Adwrks365**; only Insytix project | **MISMATCH** |
| Supabase project | Nexestate's Project | ref `ynpdtbgmbunntckqmcaf` in config; **not in MCP** | **MANUAL_CHECK** |
| Supabase project ref | `ynpdtbgmbunntckqmcaf` | Still in **production JS bundle** | **MISMATCH** (backend unhealthy) |
| Production domain | nexestate.co | Serves app; bundle contains old ref | **READY** (frontend) / **BLOCKED** (auth backend) |

---

## F. Root cause — login failure

### Observed user error

`DNS_PROBE_FINISHED_NXDOMAIN` for `ynpdtbgmbunntckqmcaf.supabase.co` (reported from user browser).

### Independent checks (2026-10-10)

| Test | Result |
|------|--------|
| `nslookup ynpdtbgmbunntckqmcaf.supabase.co` | Resolves to Cloudflare IPs (104.18.x / 172.64.x) on this machine |
| `GET .../auth/v1/health` | **401** (host reachable; auth required) |
| `GET .../rest/v1/` | **401** |
| `GET .../auth/v1/authorize?provider=google&redirect_to=...` | **502 Bad Gateway** |
| Production JS (`index-*.js`) | Embeds ref **`ynpdtbgmbunntckqmcaf`** |

### Classification

**Primary:** **G. OTHER_CONFIRMED_CAUSE** — **Supabase Auth backend unavailable (502)** for project `ynpdtbgmbunntckqmcaf`, while DNS may still resolve. OAuth never reaches Google when authorize returns 502.

**Contributing:**

- User **NXDOMAIN** may be **F. DNS_TEMPORARY_FAILURE** or resolver-specific (IPv6/local DNS) while other networks see the hostname.
- **E. WRONG_SUPABASE_ACCOUNT_CONNECTED** on developer tooling (MCP / no access to Nexestate project).
- **C. WRONG_PROJECT_REF_IN_VERCEL** — not proven without Nexestate Vercel dashboard access; production build **does** use `ynpdtbgmbunntckqmcaf` (consistent with local intent, but backend is down).

**Not root cause:** Google OAuth misconfiguration (failure occurs **before** Google).

---

## G. Frontend environment (no secret values)

| Variable | Local `.env.local` | Vercel (CLI) | Expected ref | Actual ref in prod bundle |
|----------|-------------------|--------------|--------------|---------------------------|
| `VITE_SUPABASE_URL` | Present | **Not verified** (no Nexestate project in CLI) | Nexestate project | `ynpdtbgmbunntckqmcaf` |
| `VITE_SUPABASE_ANON_KEY` | **Missing** | **Not verified** | Same project | Embedded in bundle (cannot read value here) |
| `SUPABASE_SERVICE_ROLE_KEY` | Present (server/scripts only) | N/A for Vite client | — | Must not ship to browser |

**Local dev:** Without `VITE_SUPABASE_ANON_KEY`, the app may run in **demo mode** or fail client auth — fix local env after Nexestate project is healthy.

---

## H. Auth flow in code (verified — no change required)

1. `AuthContext.signInWithGoogle` → `signInWithOAuth({ provider: 'google', redirectTo: appUrl('/auth/callback'), queryParams: { prompt: 'select_account' } })`
2. Route `/auth/callback` → `AuthCallbackPage` (PKCE via `detectSessionInUrl`, `claimPendingInvites`, role redirect)
3. `appUrl('/auth/callback')` → `https://nexestate.co/auth/callback` when `VITE_APP_URL` or apex canonicalization applies; www login is supported via `getAppOrigin()` mapping `www` → apex for assets/OAuth consistency.

**OAuth stages (correct):**

1. Browser → `https://<project-ref>.supabase.co/auth/v1/authorize?...`
2. Google → `https://<project-ref>.supabase.co/auth/v1/callback`
3. App → `https://nexestate.co/auth/callback`

---

## I. Recovery path (preserve data — no new project yet)

### Step 1 — Nexestate Supabase Dashboard (required)

1. Sign in to Supabase with the account that owns **Nexestate's Project** (org `vibfmfmvkhypcwxfxulx`).
2. Open project ref **`ynpdtbgmbunntckqmcaf`**.
3. If status is **Paused** → **Restore project** (keeps DB, auth users, storage, ref).
4. If project is **missing** → **STOP**; run migration-risk assessment (backups, replacement project, auth user migration) before creating anything.
5. After restore, re-test:  
   `https://ynpdtbgmbunntckqmcaf.supabase.co/auth/v1/authorize?provider=google&redirect_to=https%3A%2F%2Fnexestate.co%2Fauth%2Fcallback`  
   must **not** return 502 (should redirect toward Google).

### Step 2 — Supabase Auth URL configuration

- **Site URL:** `https://nexestate.co`
- **Redirect URLs:** include at least  
  `https://nexestate.co/auth/callback`  
  and if users use www:  
  `https://www.nexestate.co/auth/callback`

### Step 3 — Google Cloud Console

- OAuth client **Authorized redirect URI** (only if ref stays `ynpdtbgmbunntckqmcaf`):  
  `https://ynpdtbgmbunntckqmcaf.supabase.co/auth/v1/callback`
- **JavaScript origins:** `https://nexestate.co`, `https://www.nexestate.co` (if used)

### Step 4 — Supabase → Authentication → Google provider

- Enable Google; Client ID + Secret configured (**MANUAL_CHECK** from Dashboard).

### Step 5 — Vercel (Nexestate account)

- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` match the **active** Nexestate project.
- Redeploy **only** if env vars change.
- Do **not** point production at `wogiywmqsluwqpacmeca` (Insytix) unless intentional migration.

### Step 6 — Developer machine

- Re-link Supabase CLI: `supabase link` to Nexestate project (after login to correct account).
- Add `VITE_SUPABASE_ANON_KEY` to `.env.local` (never commit).
- Optional: `gh auth switch` to Nexestate GitHub account if org policy requires it.
- Optional: `npx vercel login` + link Nexestate team for env inspection.

---

## J. If project `ynpdtbgmbunntckqmcaf` is deleted — migration risk (do not auto-create)

Before any new Supabase project:

- Confirm deletion in Dashboard (not just 502).
- Locate DB backups / `data/import/*.sql` / exports.
- Plan auth user migration (users do not transfer automatically).
- Storage buckets (`property-images`, `signed-contracts`) and Edge Function secrets.
- Update Google OAuth redirect to **new** ref only after cutover.
- Update Vercel env + redeploy; search repo for stale ref.

---

## K. Login tests (production)

| Step | Status |
|------|--------|
| Open https://nexestate.co/login | Not run to completion in this session |
| Click Google | Fails at Supabase authorize (**502** from probe) |
| Reach Google | **No** |
| Return to app authenticated | **No** |

**Email/password:** Not tested; if Supabase project is down/paused, likely also fails.

---

## L. Deployment / git actions this session

- **No** env changes applied.
- **No** Supabase mutations.
- **No** `git push` (auth not restored; Vercel CLI account mismatch).
- **No** new Supabase project created.

---

## M. Minimum manual actions (unblock)

1. **Supabase (Nexestate account):** Restore or diagnose project `ynpdtbgmbunntckqmcaf` until `/auth/v1/authorize` returns redirect (not 502).
2. **Supabase MCP / CLI:** Log in with Nexestate Supabase account (not Adwrks365-only org).
3. **Vercel (Nexestate team):** Verify env vars and deployment for `nexestate.co`; CLI currently on wrong team.
4. **Google + Supabase Auth:** Confirm provider + redirect URI for the **active** project ref.
5. **Re-test** full Google login on production.
6. **Local:** Add `VITE_SUPABASE_ANON_KEY` to `.env.local` for dev.

---

## N. Final status

```
BLOCKED — MANUAL ACTION REQUIRED
```

Google login on production is **not** restored. Root issue is **Supabase project `ynpdtbgmbunntckqmcaf` auth endpoint returning 502** (inactive/paused/deleted backend), not application OAuth code. Developer tooling (Vercel CLI team `adwrks`, Supabase MCP org Adwrks365) is **not** aligned with Nexestate production resources until accounts are switched.
