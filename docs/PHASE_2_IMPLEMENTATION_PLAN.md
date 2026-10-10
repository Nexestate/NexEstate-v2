# NexEstate — Phase 2 implementation plan

**Date:** 2026-10-10  
**Prerequisite:** Phase 1 production QA passed. Do not weaken RLS, auth, or existing CRM/property data.

---

## Direction

NexEstate should become a **property workspace**, not a pile of routes.

Keep what already works: auth, Phase 1 live data, `signing_links` + `/sign/:token`, Quick Add, `EntityDetailModal`, property-scoped nav, Resend Edge Functions, private `signed-contracts` bucket.

Do **not** rewrite the app. Extend the current architecture in slices.

Chosen visual model: **deep navy shell + lifted slate workspace**. Not pure black. Not generic white SaaS.

---

## Keep

- GitHub → Vercel `main` → nexestate.co
- Supabase `ynpdtbgmbunntckqmcaf`
- Role routing + `ProtectedRoute`
- `DashboardLayout` / sidebar / mobile nav
- `EntityDetailModal` + `?open=` deep links
- `signing_links` as the agreement primitive (extend, don’t replace)
- `notifications` table
- Existing services and RLS
- Hebrew RTL throughout

---

## Change (by slice)

### PHASE 2A — Design system + shell + interaction patterns *(shipped locally; next: 2B)*

No schema. Highest leverage, lowest deploy risk.

- Navy/slate tokens, typography scale, elevation
- Toast, Skeleton, SlidePanel, DataView, SectionHeading
- Modal a11y + unused drawer size becomes a real `SlidePanel`
- Shell: navy sidebar, lighter workspace, larger type, unread bell
- Broker Home: attention block + skeletons (transparent rules, no fake AI)
- Public landing: same navy, less black glass

### PHASE 2B — Managed Property Workspace

Reuse units/tenants/payments/agreements as **sections of one property**, not new modules.

- Expand `PropertySubNav`: overview · tenants · agreement · documents · payments · activity
- Property overview becomes the status board (occupancy, missing docs, unsigned agreements, overdue)
- Tenant/unit/payment stay in `EntityDetailModal` / drawer; full page only for dense lists
- No duplicate CRUD

### PHASE 2C — Tenant Document Vault

New first-class table. Do **not** grow `properties.documents TEXT[]`.

Proposed:

```
documents
  id, owner_id, property_id, tenant_id, lease_id, company_name
  category, title, description, status, expires_at
  storage_path, mime_type, size_bytes, version
  uploaded_by, visibility, notes, created_at, updated_at

document_requirements  -- checklist by tenant type
```

- Private bucket `tenant-documents`
- Signed URLs only (never public)
- RLS: owner / property share / admin
- Checklist UX: `4/6 required documents completed`

### PHASE 2D — Agreement send / sign / gated reveal

Extend `signing_links` + Edge Functions.

- Lifecycle: `draft → ready → sent → viewed → in_progress → signed → completed | expired | cancelled`
- `agreement_events` append-only audit
- Invite/resend/reminder via existing `send-email` / Resend — **never fake success**
- Fix gated reveal leaks: sanitize `property_address` / `hidden_details` in Edge; do not return secrets from RPC fallback
- Server-side reveal only after configured condition (signature / required docs / consent)

### PHASE 2E — Timeline / notifications / next actions

- `property_activity` from real writes (tenant, document, agreement, payment)
- Create `signature` notifications on complete-signing
- Dashboard attention rules stay explicit (missing ID, lease ending, overdue, unsigned)

### PHASE 2F — Public site + remaining polish

- Landing sections, forms, mobile tables, global authorized search
- Search only after 2B/2C entities are solid; RLS-scoped

---

## Schema (later slices — not 2A)

| Object | When | Notes |
|--------|------|--------|
| `documents` + private bucket | 2C | Versioning via `version` + replace |
| `document_requirements` | 2C | Per tenant type |
| `signing_links.status` expand | 2D | Additive enum/text values |
| `agreement_events` | 2D | Append-only |
| `property_activity` | 2E | Or derive from events + notifications |

No destructive migrations. Use `supabase/migrations/`. Inspect live columns before ALTER (production already drifts from `schema.sql`).

---

## Routes / components

| Keep | Add / promote |
|------|----------------|
| `/broker/properties/:id` | Workspace sections via query or nested tabs |
| `/sign/:token` | Keep public |
| `Modal`, `EntityDetailModal` | `SlidePanel` for inspect/edit |
| `EmptyState`, `PageLoader` | `Skeleton`, `Toast`, `DataView` |
| `CreateSigningLinkModal` | Send/resend/reminder + hidden fields |

Full pages remain for: property list, CRM boards, admin tables, signing canvas.

---

## Storage / Edge / email / RLS

- **2A:** none
- **2C:** `tenant-documents` private; signed URL Edge or `createSignedUrl`; no public ACL
- **2D:** harden `get-signing-link`; add `send-signing-invite`; reuse Resend templates
- RLS: owner + share + `is_admin()`. Never authorize from `user_metadata`
- Do not log document contents or ID numbers

---

## Tests / risk

| Slice | Validation |
|-------|------------|
| 2A | `npm run build`, `npm test`, desktop + 390/375/360, no auth regression |
| 2C/2D | RLS smoke + unsigned URL probe + invite 401 without JWT |
| All | Do not push a broken intermediate to production |

**2A deploy risk:** visual only. If tokens look wrong, revert `theme.css` + landing glass. No data risk.

---

## What this slice ships

Phase **2A** only: foundation the later workspace/docs/agreements can sit on.
