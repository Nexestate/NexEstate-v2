# NexEstate — System Map

**Generated:** 2026-10-10  
**Repo:** NexEstate-v2  
**Production:** https://nexestate.co  
**Supabase ref (configured):** `ynpdtbgmbunntckqmcaf`

---

## Public pages

| Route | Page | Data source |
|-------|------|-------------|
| `/` | Landing | `LandingPage` + `marketDemo` / static sections |
| `/market` | שוק נכסים | `MarketPage` |
| `/auctions` | מכירות פומביות (ציבורי) | `AuctionsPublicPage` |
| `/deals` | עסקאות | `DealsPage` |
| `/players` | שחקני שוק | `PlayersPage` |
| `/opportunities` | הזדמנויות | `OpportunitiesPage` |
| `/calculator` | מחשבון תשואה | `CalculatorPage` |
| `/prices` | מחירים | `PricesPage` |
| `/terms` | תנאי שימוש | `LegalPage` |
| `/privacy` | מדיניות פרטיות | `LegalPage` |
| `/sign/:token` | חתימה דיגיטלית | Supabase `signing_links` + Edge Functions |

---

## Auth pages

| Route | Component |
|-------|-----------|
| `/login` | `LoginPage` |
| `/register` | `RegisterPage` |
| `/forgot-password` | `ForgotPasswordPage` |
| `/reset-password` | `ResetPasswordPage` |
| `/auth/callback` | `AuthCallbackPage` (OAuth / email confirm / PKCE) |

---

## Broker / owner / partner (`/broker/*`)

| Route | Component | Primary data |
|-------|-----------|--------------|
| `/broker` | `BrokerHome` | stats, properties, tasks, signing links |
| `/broker/my-properties` | `MyPropertiesPage` | **DEMO_BROKER_LISTINGS** ⚠️ |
| `/broker/properties` | `PropertiesPage` | `properties`, shares |
| `/broker/properties/:id` | `PropertyDetailPage` | property, units, leases |
| `/broker/units` | `UnitsPage` | `property_units` |
| `/broker/tenants` | `TenantsPage` | tenants via leases |
| `/broker/leases` | `LeasesPage` | `leases` |
| `/broker/payments` | `PaymentsPage` | `lease_payments` |
| `/broker/leads`, `/clients` | `LeadsPage` | `leads`, `clients` |
| `/broker/tasks` | `TasksPage` | `tasks` |
| `/broker/agreements` | `AgreementsPage` | `signing_links` |
| `/broker/auctions` | `AuctionsPage` | `auctions` |
| `/broker/notifications` | `NotificationsPage` | `notifications` |
| `/broker/reports` | `ReportsPage` | CSV export + stats |
| `/broker/profile` | `ProfilePage` | `profiles` |
| `/broker/settings` | `SettingsPage` | profile, theme, push prefs |

**Roles:** broker, admin, superadmin, owner, manager, partner (partner/manager → shared-only nav).

---

## Buyer (`/buyer/*`)

| Route | Component | Notes |
|-------|-----------|-------|
| `/buyer` | `BuyerHome` | shared properties |
| `/buyer/shared` | `SharedPropertiesPage` | `property_shares` |
| `/buyer/shared/:id` | `SharedPropertyDetailPage` | demo fallback paths |
| `/buyer/search` | `BuyerSearchPage` | public/search service |
| `/buyer/favorites` | `FavoritesPage` | favorites table |
| `/buyer/notifications` | `BuyerNotificationsPage` | **DEMO** ⚠️ |
| `/buyer/settings` | `SettingsPage` | |

**Nav gap:** Search & favorites exist as routes but not in `BUYER_NAV`.

---

## Admin (`/admin/*`)

| Route | Component | Data |
|-------|-----------|------|
| `/admin` | `AdminHome` | mixed real + **hardcoded weekly chart** |
| `/admin/properties` | `AdminPropertiesPage` | properties |
| `/admin/users` | `AdminUsersPage` | **DEMO_ADMIN_USERS** ⚠️ |
| `/admin/shares` | `AdminSharesPage` | **DEMO_PROPERTY_SHARES** ⚠️ |
| `/admin/support` | `AdminSupportPage` | **DEMO_SUPPORT_TICKETS** ⚠️ |
| `/admin/import` | `AdminImportPage` | **mock upload** ⚠️ |
| `/admin/pending|approved|rejected` | review lists | properties workflow |
| `/admin/settings` | `SettingsPage` | |

---

## Supabase tables (schema.sql)

`profiles`, `properties`, `property_units`, `tenants`, `leases`, `clients`, `leads`, `signing_links`, `tasks`, `auctions`, `property_shares`, `pending_invites`, `notifications`, `lease_payments`, `auction_bids`

**RLS:** enabled on all above tables (see `schema.sql` + migrations in `supabase/*.sql`).

---

## Storage buckets (code references)

| Bucket constant | Usage |
|-----------------|--------|
| `property-images` | property photos (`storageService`) |
| `signed-contracts` | agreement PDFs (Edge) |
| `payment-proofs` | payment proof uploads |

---

## Edge Functions (in repo)

| Function | Purpose |
|----------|---------|
| `get-signing-link` | Public signing link fetch |
| `complete-signing` | Save signature, PDF, email |
| `generate-agreement-pdf` | PDF generation |
| `notify-share` | Share invite email |
| `send-email` | Generic Resend |
| `init-payment-session` | Payment checkout start |
| `complete-payment-checkout` | Complete checkout |
| `payment-webhook` | Provider webhook |
| `issue-invoice` | Invoice issuance |

**Not in repo:** `check-alerts` (mentioned in `.cursorrules` only).

**Deploy status:** Not verified in this audit (Supabase MCP not on Nexestate org).

---

## Auth flows

1. Email/password → Supabase Auth → profile → role redirect  
2. Google OAuth → Supabase authorize → Google → Supabase callback → `/auth/callback` → claim invites → dashboard  
3. Register → optional email confirm → claim `pending_invites`  
4. Property share → `pending_invites` → register/login → RPC `claim_pending_invites`

---

## Email flows

- Resend via Edge (`send-email`, `notify-share`, signing completion emails)  
- Supabase Auth SMTP (signup/reset) — configured in Dashboard (not in repo)

---

## Payment flows

- `lease_payments` CRUD in `paymentsService.ts`  
- Checkout: `init-payment-session`, `complete-payment-checkout`, `payment-webhook`  
- UI: `PaymentsPage` + property-scoped filters

---

## Client architecture

- **SPA:** Vite + React Router v7  
- **Data:** `src/lib/services/*` + hooks  
- **Demo mode:** when `VITE_SUPABASE_URL` / anon key missing → `isDemoMode()`  
- **Realtime:** notifications channel in `useRealtimeNotifications`  
- **PWA:** `manifest.webmanifest`, `sw.js`, `AppInstallBanner`

---

## Key integrations

| Integration | Location |
|-------------|----------|
| Supabase JS | `src/lib/supabase.ts` |
| Edge invoke | `src/lib/services/edgeFunctions.ts` |
| Google OAuth | Supabase Auth provider |
| Resend | Edge `_shared/resend.ts` |
| Vercel | `vercel.json` static SPA |
