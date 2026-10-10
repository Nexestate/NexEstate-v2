# NexEstate — Full System Audit

**Audit date:** 2026-10-10  
**Auditor:** Independent codebase + tooling review (Agent)  
**Production:** https://nexestate.co · https://www.nexestate.co  
**Repo:** `Nexestate/NexEstate-v2` · branch `main`  
**Supabase (configured):** `ynpdtbgmbunntckqmcaf`

> **Scope:** Audit and roadmap only — no major implementation in this pass.  
> **Limitation:** Authenticated broker/admin journeys and live RLS were **not** fully exercised in automation (no user credentials; Supabase MCP on wrong org). Google OAuth reported **working** by product owner after project restore.

**Related artifacts:**  
- [System map](./NEXESTATE_SYSTEM_MAP.md)  
- [Findings JSON](./NEXESTATE_AUDIT_FINDINGS.json)  
- [Upgrade roadmap](./NEXESTATE_UPGRADE_ROADMAP.md)  
- [Account recovery notes](./NEXESTATE_ACCOUNT_AND_AUTH_RECOVERY.md) (if present)  
- Screenshots: [docs/audit/screenshots](./audit/screenshots/README.md)

---

## A. Executive summary

NexEstate is a **mature React SPA** with a **broad broker CRM** (properties, units, tenants, leases, payments, leads, signing) and **buyer/admin** surfaces. **Build and TypeScript pass.** Production **landing and login** load; **Google OAuth** is operational again after Supabase unpause (user-verified).

**Critical gap:** Several **high-visibility routes still use demo/mock data** while adjacent routes use Supabase — especially **נכסים שלי** and **most admin back-office pages**. This creates a **split-brain product**: real data for נכסים מנוהלים vs fake data for נכסים שלי and admin users/shares/support/import.

**Ops gap:** Local CLI (Vercel `adwrks`, Supabase MCP Insytix-only) does **not** match the Nexestate production project — blocking env/RLS/Edge verification from this workstation without re-linking.

**Finding counts (see JSON):** **P0: 5** · **P1: ~17** · **P2: ~9** · **P3: ~3**

**Recommended next phase:** [Phase 1 — Critical fixes](./NEXESTATE_UPGRADE_ROADMAP.md#phase-1--critical-fixes-p0--account-alignment): account linking + replace demo broker/admin pages + RLS smoke tests.

---

## B. Account readiness

| Check | Result |
|-------|--------|
| Local repo | `C:\Users\User\NexEstate-v2` |
| Branch | `main` |
| Git remote | `https://github.com/Nexestate/NexEstate-v2.git` |
| GitHub CLI active | **Adwrks365** (Nexestate account present, inactive) |
| Vercel CLI | User `info-88828003` — **not** Nexestate team; `nexestate.co` not in project list |
| Supabase linked (local) | `ynpdtbgmbunntckqmcaf` in `supabase/.temp/linked-project.json` |
| Supabase MCP | **No access** to `ynpdtbgmbunntckqmcaf` (permission denied) |
| Production domain | `nexestate.co` / `www.nexestate.co` |
| Local `.env.local` | `VITE_SUPABASE_URL` set; **`VITE_SUPABASE_ANON_KEY` missing**; service role present (gitignored) |

**Mismatch risk:** Deploy and secrets may live on a Vercel team not visible to current CLI — document in Nexestate org vault.

---

## C. Product map

See **[NEXESTATE_SYSTEM_MAP.md](./NEXESTATE_SYSTEM_MAP.md)** for routes, tables, Edge Functions, auth/email/payment flows.

---

## D. Working functionality (verified or high confidence)

| Area | Status | Notes |
|------|--------|-------|
| `npm run build` | **WORKING** | ~855 KB JS chunk; gzip ~227 KB |
| `npx tsc --noEmit` | **WORKING** | |
| Public landing | **WORKING** | Loads in production (prior session) |
| Login UI | **WORKING** | Email + Google button + PWA install banner |
| Google OAuth | **WORKING** | User-confirmed post-restore; authorize URL redirects |
| Route protection | **LIKELY** | `ProtectedRoute` + role lists in `App.tsx` |
| Broker: managed properties | **LIKELY** | `PropertiesPage`, `PropertyDetailPage`, services |
| Broker: units/tenants/leases | **LIKELY** | Dedicated pages + CRUD services |
| Broker: CRM leads/clients/tasks | **LIKELY** | Supabase services with demo fallback |
| Signing public page | **PARTIAL** | Depends on Edge deploy + tokens |
| Buyer: shared properties | **LIKELY** | `property_shares` hooks |
| Admin: property approval lists | **LIKELY** | pending/approved/rejected |
| PWA manifest + SW | **PRESENT** | Install banner on login |
| RTL + dark theme | **PRESENT** | `theme.css`, ThemeContext |
| Legal pages | **PRESENT** | `/terms`, `/privacy` |

---

## E. Broken / partial functionality

| Feature | Status | Evidence |
|---------|--------|----------|
| Authenticated dashboards (automated test) | **NOT TESTED** | No session in audit |
| My Properties | **BROKEN (product)** | Demo listings only |
| Admin users/shares/support/import | **BROKEN (product)** | Demo/mock |
| Buyer notifications | **PARTIAL** | Demo array |
| Payment checkout (Edge) | **NOT TESTED** | Deploy unknown |
| Sidebar payment badge count | **PARTIAL** | Count = leases not payments |
| Payments list with real data | **PARTIAL** | Import may lack `lease_payments` rows |
| `npm run lint` | **N/A** | Script not defined |

---

## F. Unfinished features (inventory)

| Feature | Location | State | Missing | Priority |
|---------|----------|-------|---------|----------|
| My broker listings | `MyPropertiesPage.tsx` | DEMO only | Wire `propertiesService` | P0 |
| Admin user mgmt | `AdminUsersPage.tsx` | DEMO | profiles API + UI | P0 |
| Admin shares | `AdminSharesPage.tsx` | DEMO | `property_shares` query | P0 |
| Admin support | `AdminSupportPage.tsx` | DEMO | tickets table or integration | P0 |
| Admin CSV import | `AdminImportPage.tsx` | Mock upload | Real import pipeline | P0 |
| Buyer notifications | `buyer/NotificationsPage.tsx` | DEMO | `notifications` service | P1 |
| Admin weekly chart | `admin/Home.tsx` | Hardcoded array | SQL aggregates | P1 |
| check-alerts Edge | `.cursorrules` only | Absent | Implement or remove doc | P3 |
| Developer/investor/manager dashboards | Not in `App.tsx` | Roles exist in DB | Full role UX | P3 |
| Placeholder pages | `PlaceholderPage.tsx` | Unrouted | Delete or use | P3 |

No `TODO`/`FIXME` comments in `src` — unfinished work is expressed via **DEMO_** imports and mock handlers.

---

## G. UX problems

1. **Trust erosion:** Sidebar links to demo pages next to live CRM.  
2. **Small dashboard type** (`text-sm` / `text-xs`) — hard to scan KPIs.  
3. **Property detail** jumps to separate routes per tab instead of in-context panels.  
4. **Buyer IA:** Search and favorites exist but not in nav.  
5. **Inconsistent feedback:** No global toast; some actions silent.  
6. **Partner/manager** shared-only nav may hide expected CRM (by design — verify with users).  
7. **PWA banner** on login may distract first-time auth (dismissible).

---

## H. Visual / design problems

1. **Density vs readability** — tables and cards optimized for data, not hierarchy.  
2. **Marketing vs app** — landing is polished; dashboard feels utilitarian.  
3. **Stat cards** — consistent pattern but similar visual weight for primary vs secondary KPIs.  
4. **Empty states** — vary by page; some lists go blank without CTA.  
5. **Loading** — mix of spinners and bare text; few skeletons.  
6. **Component duplication** — multiple page-level table/card patterns vs one `DataView`.

---

## I. Mobile

- **MobileBottomNav** + broker shell exist.  
- **LeasesPage** has responsive card fallback; **PaymentsPage** less consistent.  
- **Widths 390/375/360:** Not browser-tested authenticated in this audit.  
- **Risk:** Wide tables horizontal scroll; filter bars wrapping; tap targets on tree submenu.

---

## J. Auth

| Item | Assessment |
|------|------------|
| Google OAuth | Working (user + redirect probe post-restore) |
| Email/password | Implemented in `AuthContext` |
| Callback | `AuthCallbackPage` + PKCE |
| Session restore | Standard Supabase client |
| Logout | Context method |
| Role redirect | `DashboardRedirect` / post-login |
| www vs apex | Both used; ensure Supabase redirect URLs include both |
| Expired session | Protected routes should redirect login — **manual retest** |
| Local dev | Missing anon key → may force demo mode |

**Auth UX recommendations:** Clearer OAuth loading state; surface Supabase error messages in Hebrew; account picker hint for Google; link to support on repeated failure.

---

## K. Supabase / data / RLS

**Schema reference:** `schema.sql` — profiles, properties, units, tenants, leases, payments, shares, invites, notifications, auctions, signing.

**Supplemental SQL in repo:** `fix_shared_access_rls.sql`, `fix_property_shares_columns.sql`, `claim_invites_rpc.sql` — indicates **past RLS/share bugs**; full regression not run here.

**RLS (design intent from schema):** Enabled on sensitive tables; broker ownership via `broker_id` / shares / partner policies.

**Cannot verify live:** MCP lacks Nexestate project — run Dashboard **Security Advisor** + manual tests:

- User A cannot read User B properties  
- Partner sees only shared properties  
- Buyer sees only `property_shares`  
- Admin bypass only for admin role  

**Data quality (import):** Shaktal dataset in `data/import/`; `tenant_id` on units may be null; payments may need generation.

**Indexes:** Review advisors after MCP link — common filters: `properties.broker_id`, `leases.property_id`, `property_shares.shared_with`.

---

## L. APIs / Edge Functions

| Function | Frontend | Deploy verified |
|----------|----------|-----------------|
| get-signing-link | signingService | No |
| complete-signing | signing flow | No |
| generate-agreement-pdf | agreements | No |
| notify-share | usePropertyShares | No |
| send-email | various | No |
| init-payment-session | paymentsService | No |
| complete-payment-checkout | payments | No |
| payment-webhook | provider | No |
| issue-invoice | paymentsService | No |

**Resend:** `_shared/resend.ts` in functions — requires `RESEND_API_KEY` in Supabase secrets. Domain verification status **unknown**.

**Client API pattern:** Direct Supabase from browser (anon key + RLS) — correct for SPA; no separate REST layer.

---

## M. Performance

| Issue | Impact | Fix |
|-------|--------|-----|
| 855 KB main chunk | Slow FCP on mobile | Route lazy loading |
| edgeFunctions import split warning | Suboptimal chunks | Single import style |
| N+1 on property tree | Sidebar lag | Batch queries (partially done in stats service) |
| No image CDN strategy | Large property images | Supabase transform / sizes |
| Realtime notifications | Extra connections | Acceptable |

---

## N. Accessibility

- Public **AccessibilityContext** (text size/contrast) — limited dashboard use.  
- Forms generally have labels; modals need focus trap audit.  
- RTL handled at layout level.  
- Contrast on muted `text-muted-foreground` — spot-check WCAG.

---

## O. Analytics / observability

| Capability | Status |
|------------|--------|
| GA4 / product analytics | **None** in `src` |
| Sentry / error tracking | **None** |
| Vercel analytics | Unknown (team access) |
| Supabase logs | Dashboard only |
| Structured audit trail (admin actions) | **Not implemented** |

**Minimum recommendation:** Sentry on client + Edge; Vercel log drain; Supabase log retention alert on auth errors.

---

## P. Technical debt

- **Demo mode** throughout services (`isDemoMode()`) — good for dev, masks misconfig in prod if env wrong.  
- **Large pages** (Settings, Property detail) — candidate for split components.  
- **No tests, no lint script.**  
- **Dead PlaceholderPage** files.  
- **Hardcoded admin chart.**  
- **`.cursorrules` mentions `check-alerts`** — not in repo.

---

## Q. Security risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| RLS regression (partner/share) | High | Matrix test + advisors |
| Service role in local env | Medium | Never prefix `VITE_`; rotate if leaked |
| Edge functions without JWT check | Medium | Audit each function handler |
| Public signing tokens | Medium | Expiry + one-time use (verify in DB) |
| Client-exposed secrets | Low if only anon key | Audit Vercel env |
| Admin demo pages | Medium | Misleading ops — not data leak but wrong actions |

---

## R. High-impact visual improvements (ranked)

| Rank | Item | Priority | Why |
|------|------|----------|-----|
| 1 | Dashboard typography scale | P0/P1 | Daily use; readability |
| 2 | Unified stat card + KPI hierarchy | P1 | Faster decisions |
| 3 | Property detail tabbed layout | P1 | Core workflow cohesion |
| 4 | Consistent empty/loading states | P1 | Professional feel |
| 5 | Toast + form error styling | P1 | Trust on actions |
| 6 | Sidebar visual grouping + active state | P2 | Navigation clarity |
| 7 | Table → card mobile pattern | P2 | Mobile broker use |
| 8 | Landing ↔ app visual bridge (tokens) | P2 | Brand continuity |
| 9 | Chart styling (admin/broker) | P2 | Data credibility |
| 10 | Motion guidelines (subtle) | P3 | Premium polish |

---

## S. High-impact functionality improvements (ranked)

| Rank | Item | Priority | Why |
|------|------|----------|-----|
| 1 | Real My Properties | P0 | Nav promises real listings |
| 2 | Real admin shares + users | P0 | Platform governance |
| 3 | Real admin import | P0 | Data onboarding |
| 4 | lease_payments seed/generate | P1 | Payments feature usable |
| 5 | Fix payment count in tree | P1 | Accurate ops signal |
| 6 | Buyer notifications live | P1 | Role parity |
| 7 | Edge deploy verification | P1 | Signing/payments/email |
| 8 | RLS regression suite | P1 | Security |
| 9 | Code splitting | P2 | Mobile performance |
| 10 | E2E smoke tests | P2 | Prevent auth/CRM regressions |

---

## T. Recommended implementation roadmap

See **[NEXESTATE_UPGRADE_ROADMAP.md](./NEXESTATE_UPGRADE_ROADMAP.md)** — five phases from critical fixes through polish/analytics.

---

## User journey audit (summary)

| Journey | Status |
|---------|--------|
| A. New user register | Code complete — **manual test** |
| B. Google login | **Working** (owner) |
| C. Email login | **manual test** |
| D. Onboarding / invite claim | RPC + callback — **manual test** |
| E. Add property/unit | Services + UI — **likely working** |
| F. Edit entity | CRUD on leases/tenants — **likely** |
| G. Search/filter | FilterBar on lists — **working pattern** |
| H. Dashboard | Broker home stats — **likely**; typography weak |
| I. Favorites | Buyer route — **nav hidden** |
| J. Settings | Shared SettingsPage — **likely** |
| K. Logout | AuthContext — **manual test** |
| L. Error recovery | Limited global error UI |

---

## Forms audit (summary)

- **Required fields:** Mixed — many forms use HTML5 `required`.  
- **Validation:** Mostly client-side; Supabase errors surfaced ad hoc.  
- **Duplicate submit:** Not globally guarded.  
- **Mobile keyboards:** Tel/email types sporadic.  
- **Recommendation:** Shared `useFormSubmit` + toast + Hebrew error map for Supabase codes.

---

## Filters audit (summary)

- `FilterBar` used widely; **URL persistence** not standard.  
- Reset/clear varies.  
- Recommend query-string sync for leads/properties lists.

---

## SEO / public (summary)

- `index.html`: title + PWA meta; **no description/OG**.  
- No `robots.txt` / `sitemap.xml` in repo.  
- Legal pages exist — good for trust.

---

## Privacy / legal (summary)

- Terms + privacy routes present.  
- Cookie consent / analytics consent **not** present (needed before GA4).  
- Account deletion flow **not** identified in settings audit — flag for GDPR-style requests.

---

## Design system audit (summary)

**Existing primitives (`src/components/ui/`):** Button, Card, Input, Badge, FilterBar, SlidePanel, EmptyState, etc.

**Gaps:** No shared Table/DataView, Dialog, Toast, Tabs (page-local patterns).

**Consolidation proposal:** Tokens in `theme.css` + `DataView` + `Toast` + `Modal` + `Tabs` — see roadmap Phase 2.

---

## Build / code health

```
npm run build     → PASS (warnings: chunk size, edgeFunctions import)
npx tsc --noEmit  → PASS
npm run lint      → NOT CONFIGURED
Tests             → NONE
```

---

## Environment variables (names only)

**Client (Vite):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL` (and any payment/public keys referenced in code — verify `src/lib/supabase.ts`, payments).

**Edge (typical):** `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, payment provider secrets.

**Flag:** Local missing anon key; Vercel env not auditable without team access.

---

## Screenshots

See [audit/screenshots/README.md](./audit/screenshots/README.md). Capture authenticated and mobile views after MCP/browser access restored.

---

## Sign-off

| Item | Value |
|------|-------|
| Production auth (Google) | **READY** per owner |
| Full audit automation | **PARTIAL** — blocked on Vercel/Supabase CLI + auth session |
| Safe to start Phase 1 dev | **YES** — demo page replacement does not require redesign |
