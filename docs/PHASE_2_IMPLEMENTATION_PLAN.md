# NexEstate — Phase 2 / 3 implementation plan

**Updated:** 2026-10-10  
**Source of truth:** Phase 1 production + Phase 2A (`5567b72`) + this file.

Do **not** rewrite. Extend the current architecture.

---

## Product model

```
PROPERTY → TENANT / COMPANY → LEASE → DOCUMENTS → AGREEMENT → SIGNATURE
        → CHARGES → PAYMENTS → RECEIPTS → ACTIVITY → REMINDERS → NEXT ACTIONS
```

The UI organizes work around the **managed property** and **active lease**, not database modules.

---

## Keep

Auth, Phase 1 data/RLS, Phase 2A navy/slate system, `signing_links` + `/sign/:token`, Quick Add, `EntityDetailModal`, property-scoped nav, Resend, GitHub → Vercel → Supabase `ynpdtbgmbunntckqmcaf`.

Existing payment/accounting **vendor list** (already in Settings, not monday.com):

| Role | Vendor in code |
|------|----------------|
| Acquiring | Meshulam, Grow, Tranzila |
| Invoicing | **Morning (Green Invoice)**, iCount, Invoice4U |

**“MONDAY” = Morning.** Not monday.com. Phase 3C/3D must use a provider adapter; do not hardcode Morning into business logic. If credentials are missing, UI shows **NOT CONFIGURED** — never fake a paid transaction.

---

## Slices

| Slice | Status | What |
|-------|--------|------|
| **2A** | Shipped | Tokens, Toast, Skeleton, SlidePanel, DataView, attention home |
| **2B** | Shipped (this slice) | Property workspace shell + operational overview |
| **2C** | Next | Private document vault + checklist persistence |
| **2D** | Later | Agreement lifecycle, email send, gated reveal |
| **2E** | Later | Persisted activity + notifications |
| **3A** | Later | Lease extension / expiry automation |
| **3B** | Later | Charges engine (lease terms ≠ payable items) |
| **3C** | Later | Payment provider adapter + webhooks |
| **3D** | Later | Invoice/receipt via accounting adapter |
| **3E** | Later | Role portals + scheduled automations |
| **3F** | Later | Search + public polish |

---

## 2B — what we build now

Reuse tenants / units / payments list pages. Do not duplicate CRM.

`/broker/properties/:id` becomes the workspace:

| Section | Implementation |
|---------|----------------|
| Overview | Operational status + next actions (not raw stats only) |
| Units / Tenants / Payments | Existing routes with `?property=` |
| Agreements | Same page `?tab=agreements` — live `signing_links` for this property |
| Documents | Same page `?tab=documents` — checklist by tenant type; vault upload waits for 2C |
| Activity | Derived from leases / payments / signing (no new table yet) |
| Maintenance | Units in `maintenance` + empty CTA |

No schema change in 2B. Documents stay a **UI + requirements config** so 2C can persist into a real table.

---

## Later schema (inspect live columns before ALTER)

| When | Object | Notes |
|------|--------|--------|
| 2C | `documents` + private `tenant-documents` | Never public URLs; signed URLs only |
| 2C | `document_requirements` | Per `tenant_type` |
| 2D | Expand `signing_links.status` | Additive: viewed / in_progress / completed / cancelled |
| 2D | `agreement_events` | Append-only |
| 3A | `lease_extensions` | New draft; never overwrite signed lease |
| 3B | `charges` + recurrence | Separate from `lease_payments` if needed |
| 3C | provider sessions / webhook events | Idempotent; no PAN storage |
| 2E/3E | `property_activity` or derived events | Prefer writing from real mutations |

---

## Payments / accounting (plan only until 3B+)

- Lease = obligation. Charge = payable item. Payment = collection event.
- Provider interface: `createCheckout`, `parseWebhook`, `issueDocument`.
- Meshulam/Grow = acquiring. Morning/iCount = invoicing.
- Payment success must survive invoice failure (`PENDING / FAILED / RETRY_REQUIRED` on the document, not the payment).

---

## Security

- Documents: private bucket, RLS, short-lived signed URLs, no cross-tenant leak
- Signing: high-entropy token, expiry, revoke, server-side sanitization of gated fields
- Payments: no card data, verify webhooks, no client-reported success
- Never authorize from `user_metadata`

---

## 2B deploy risk

UI + client queries only. If a workspace tab is wrong, revert `PropertyDetailPage` / `propertyNav`. No data risk.
