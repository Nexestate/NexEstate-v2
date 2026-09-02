$ErrorActionPreference = 'Continue'
$log = Join-Path $PSScriptRoot 'deploy-run.log'
Set-Location $PSScriptRoot

function Log($msg) { Add-Content -Path $log -Value $msg; Write-Output $msg }

Log "=== START $(Get-Date -Format o) ==="

Log "--- git status ---"
git status 2>&1 | ForEach-Object { Log $_ }

Log "--- branch ---"
git branch -vv 2>&1 | ForEach-Object { Log $_ }

Log "--- checkout branch ---"
git checkout -b feat/matching-and-payment-hub 2>&1 | ForEach-Object { Log $_ }
if ($LASTEXITCODE -ne 0) {
  git checkout feat/matching-and-payment-hub 2>&1 | ForEach-Object { Log $_ }
}

Log "--- add ---"
git add -A 2>&1 | ForEach-Object { Log $_ }

Log "--- commit ---"
$msg = @'
Add matching engine, landing pages, and Payment Hub.

Introduces client/property matching with public landing pages, digital payment checkout with invoicing integrations, and supporting Supabase migrations and edge functions.
'@
git commit -m $msg 2>&1 | ForEach-Object { Log $_ }

Log "--- push ---"
git push -u origin feat/matching-and-payment-hub 2>&1 | ForEach-Object { Log $_ }

Log "--- pr ---"
$body = @'
## Summary
- Matching engine: client/lead/property matching with notifications and CRM integration
- Public landing pages at `/p/{slug}` with lead capture loop
- Payment Hub MVP: payment requests, public checkout at `/pay/{slug}`, transfer proof, invoicing stubs
- Edge functions: init-payment-session, complete-payment-checkout, issue-invoice, payment-webhook
- SQL migrations for matching, landing pages, and payments hub

## Test plan
- [ ] Run SQL migrations in Supabase (matching_and_landing, lead_matching_notify, payments_hub)
- [ ] Create storage bucket `payment-proofs`
- [ ] Deploy edge functions to Supabase
- [ ] Demo: create payment request, open `/pay/demo-rent1`, complete card payment
- [ ] Demo: matching from client form and landing page lead
- [ ] Settings → billing: save bank details and integration keys
'@
gh pr create --base main --head feat/matching-and-payment-hub --title "Matching engine + Payment Hub" --body $body 2>&1 | ForEach-Object { Log $_ }

Log "--- supabase deploy ---"
$projectRef = 'ynpdtbgmbunntckqmcaf'
$funcs = @('init-payment-session','complete-payment-checkout','issue-invoice','payment-webhook')
foreach ($f in $funcs) {
  Log "deploy $f"
  supabase functions deploy $f --project-ref $projectRef 2>&1 | ForEach-Object { Log $_ }
}

Log "=== END $(Get-Date -Format o) ==="
