# Fix corrupted DashboardLayout on GitHub + push sidebar UX.
# Run:  powershell -NoProfile -File .\fix-and-push.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GIT_PAGER = 'cat'

Write-Host '=== check files on disk ===' -ForegroundColor Cyan
$layout = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'src/components/layout/DashboardLayout.tsx'))
$sidebar = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'src/components/layout/Sidebar.tsx'))
if ($layout -notmatch 'QuickAddProvider') {
  Write-Host 'ERROR: DashboardLayout.tsx is corrupted locally. Re-open project in Cursor.' -ForegroundColor Red
  exit 1
}
if ($sidebar -notmatch 'expandedIds') {
  Write-Host 'ERROR: Sidebar.tsx missing expandedIds. Save all files in Cursor (Ctrl+K S).' -ForegroundColor Red
  exit 1
}
Write-Host '  OK'

Write-Host '=== npm run build ===' -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host '=== git add ===' -ForegroundColor Cyan
git add -- `
  src/components/layout/DashboardLayout.tsx `
  src/components/layout/Sidebar.tsx `
  src/pages/broker/Dashboard.tsx `
  src/lib/services/propertiesService.ts

$staged = @(git --no-pager diff --cached --name-only)
Write-Host "Staged $($staged.Count) file(s):"
$staged | ForEach-Object { Write-Host "  $_" }
git --no-pager diff --cached --stat

if ($staged.Count -eq 0) {
  Write-Host 'Nothing to commit.' -ForegroundColor Yellow
  exit 0
}
if ($staged.Count -lt 3) {
  Write-Host "ERROR: Only $($staged.Count) file(s) staged. Save all files in Cursor (Ctrl+K S) and re-run." -ForegroundColor Red
  git --no-pager reset HEAD
  exit 1
}

Write-Host '=== commit + push ===' -ForegroundColor Cyan
git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "Fix corrupted DashboardLayout and expand managed property sidebar"
git push origin main
Write-Host 'Done. Wait for Vercel Ready.' -ForegroundColor Green
