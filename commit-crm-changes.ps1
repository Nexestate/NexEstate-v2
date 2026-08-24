# Commit CRM modal + rent fixes. Run ONE command per line in PowerShell:
#   powershell -NoProfile -File .\commit-crm-changes.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GIT_PAGER = 'cat'

$files = @(
  'src/types/domain.ts',
  'src/lib/services/propertiesService.ts',
  'src/lib/services/leasesService.ts',
  'src/lib/services/auctionsService.ts',
  'src/lib/services/index.ts',
  'src/contexts/EntityDetailContext.tsx',
  'src/components/broker/EntityDetailModal.tsx',
  'src/components/broker/ManagedUnitsTable.tsx',
  'src/components/layout/DashboardLayout.tsx',
  'src/pages/broker/UnitsPage.tsx',
  'src/pages/broker/LeasesPage.tsx',
  'src/pages/broker/PaymentsPage.tsx',
  'src/pages/broker/PropertyDetailPage.tsx'
)

Write-Host '=== npm run build ===' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '=== git add ===' -ForegroundColor Cyan
git add -- @files

$staged = @(git --no-pager diff --cached --name-only)
Write-Host "Staged $($staged.Count) file(s):"
$staged | ForEach-Object { Write-Host "  $_" }
git --no-pager diff --cached --stat

if ($staged.Count -eq 0) {
  Write-Host 'Nothing to commit. Save all files in Cursor (Ctrl+K S) and re-run.' -ForegroundColor Red
  exit 1
}

Write-Host '=== commit ===' -ForegroundColor Cyan
git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "Fix active lease rents, entity detail modals, and cross-linking"

Write-Host '=== pull (rebase) ===' -ForegroundColor Cyan
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Pull failed. Resolve conflicts, then: git rebase --continue' -ForegroundColor Red
  exit 1
}

Write-Host '=== push ===' -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Push failed. Fix errors above before retrying.' -ForegroundColor Red
  exit 1
}
Write-Host 'Done. Check Vercel for Ready.' -ForegroundColor Green
