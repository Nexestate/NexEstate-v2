# Build, verify sidebar files on disk, commit, push.
# Run:  powershell -NoProfile -File .\push-green-build.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GIT_PAGER = 'cat'

if ((git rev-parse --abbrev-ref HEAD).Trim() -ne 'main') {
  Write-Host "Switch to main first: git checkout main" -ForegroundColor Red
  exit 1
}

Write-Host "=== 1/4  verify sidebar files on disk ===" -ForegroundColor Cyan
$sidebar = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'src/components/layout/Sidebar.tsx'))
$layout = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'src/components/layout/DashboardLayout.tsx'))
if ($sidebar -notmatch 'expandedIds') {
  Write-Host "ERROR: Sidebar.tsx on disk is old (no expandedIds). Save all files in Cursor (Ctrl+K S) and re-run." -ForegroundColor Red
  exit 1
}
if ($layout -match 'managedPropertiesLoading=\{') {
  Write-Host "ERROR: DashboardLayout still passes managedPropertiesLoading to Sidebar." -ForegroundColor Red
  exit 1
}
if ($layout -match 'sidebarProperties') {
  Write-Host "ERROR: DashboardLayout still uses sidebarProperties null hack." -ForegroundColor Red
  exit 1
}
Write-Host "  sidebar + layout OK"

Write-Host "=== 2/4  npm run build ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "=== 3/4  stage ===" -ForegroundColor Cyan
git add -- `
  src/lib/services/propertiesService.ts `
  src/components/layout/Sidebar.tsx `
  src/components/layout/DashboardLayout.tsx `
  src/pages/broker/Dashboard.tsx

Write-Host "=== 4/4  commit + push ===" -ForegroundColor Cyan
git --no-pager diff --cached --stat
if (-not (git diff --cached --name-only)) {
  Write-Host "Nothing to commit (already pushed?)." -ForegroundColor Yellow
  exit 0
}

git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "Expand managed property sidebar tree by default and fix property owner filter"
git push origin main
Write-Host "Done. Wait for Vercel Ready." -ForegroundColor Green
