# Phase 1 — Pre-change baseline

**Recorded:** 2026-10-10  
**Baseline commit:** `8630635` — Update hero subtitle and Git auto-sync rules in .cursorrules

## Local project

| Field | Value |
|-------|--------|
| Path | `C:\Users\User\NexEstate-v2` |
| Package | `nexestate` |
| Stack | React 18 + Vite 6 + TypeScript + Tailwind v4 |
| Branch | `main` |
| Remote | `https://github.com/Nexestate/NexEstate-v2.git` |
| Build | `npm run build` (`tsc -b && vite build`) |
| Production | `https://nexestate.co` |

## Cursor (development)

**Account:** Adwrks 365 — intentional; not a service mismatch.

## GitHub

- **CLI active:** `Adwrks365`
- **Repo access:** `WRITE` on `Nexestate/NexEstate-v2` ✓

## Vercel (expected)

| Field | Value |
|-------|--------|
| Workspace | `Nexus` |
| Project | `nexestate_v2` |
| Domain | `nexestate.co` |
| Local `.vercel/project.json` | **Missing** |
| CLI `vercel whoami` | `info-88828003` |
| CLI teams visible | **Only `adwrks`** — `Nexus` not visible |

## Supabase (expected)

| Field | Value |
|-------|--------|
| Project | Nexestate's Project |
| Ref | `ynpdtbgmbunntckqmcaf` |
| Status | Healthy / Active (per owner) |
| MCP access | **Permission denied** on this ref |

## Build status (baseline)

| Check | Result |
|-------|--------|
| `npm run build` | PASS |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | N/A (no script) |
| Tests | None |

## Known P0 (audit)

1. My Properties — `DEMO_BROKER_LISTINGS`
2. Admin Users — demo
3. Admin Shares — demo
4. Admin Import — mock
5. Admin Support — demo
