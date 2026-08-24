# Makes main compile: removes orphaned pages left over from the branch merge,
# fixes the two real type errors, verifies with a full build, then pushes.
# Run:  powershell -NoProfile -File .\fix-vercel-tsc.ps1
Set-Location $PSScriptRoot

function Read-Text($p) { [IO.File]::ReadAllText((Join-Path $PSScriptRoot $p)) }
function Write-Text($p, $t) { [IO.File]::WriteAllText((Join-Path $PSScriptRoot $p), $t) }

Write-Host "=== 1/5  remove orphaned pages (they reference APIs this tree no longer has) ===" -ForegroundColor Cyan
$orphans = @(
  'src/components/property/PropertySharesPanel.tsx',
  'src/pages/broker/LeaseDetailPage.tsx',
  'src/pages/broker/TenantDetailPage.tsx',
  'src/pages/broker/TenantsPage.tsx',
  'src/pages/broker/UnitDetailPage.tsx'
)
foreach ($f in $orphans) {
  git rm -f --ignore-unmatch -- $f | Out-Null
  if (Test-Path $f) { Remove-Item -Force -- $f }
  Write-Host "  removed $f"
}

Write-Host "=== 2/5  fix PropertyDetailPage delete-on-required-field ===" -ForegroundColor Cyan
$p = 'src/pages/broker/PropertyDetailPage.tsx'
$t = Read-Text $p
$fixed = 'const rest: Partial<typeof payload> = { ...payload };'
if ($t.Contains('const rest: Partial<typeof payload>')) {
  Write-Host "  already fixed"
} elseif ($t.Contains('const { broker_id: _broker, ...rest } = payload;')) {
  $t = $t.Replace('const { broker_id: _broker, ...rest } = payload;', "$fixed`r`n    delete rest.broker_id;")
  Write-Text $p $t
  Write-Host "  patched (destructure form)"
} elseif ($t.Contains('const rest = { ...payload };')) {
  $t = $t.Replace('const rest = { ...payload };', $fixed)
  Write-Text $p $t
  Write-Host "  patched (spread form)"
} else {
  Write-Host "  COULD NOT PATCH - open $p around line 95 and check handleEdit" -ForegroundColor Red
  exit 1
}

Write-Host "=== 3/5  drop unused GoogleOAuthHint import in LoginPage ===" -ForegroundColor Cyan
$p = 'src/pages/auth/LoginPage.tsx'
$t = Read-Text $p
if ($t -match '<GoogleOAuthHint') {
  Write-Host "  component is used - leaving import alone"
} elseif ($t -match "(?m)^import \{ GoogleOAuthHint \} from '\.\./\.\./components/auth/GoogleOAuthHint';\r?\n") {
  $t = $t -replace "(?m)^import \{ GoogleOAuthHint \} from '\.\./\.\./components/auth/GoogleOAuthHint';\r?\n", ''
  Write-Text $p $t
  Write-Host "  import removed (AuthShell already renders it)"
} else {
  Write-Host "  import not found - nothing to do"
}

Write-Host "=== 4/5  npm run build (tsc -b && vite build) ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "BUILD STILL FAILING - nothing committed. Copy the errors above." -ForegroundColor Red
  exit 1
}

Write-Host "=== 5/5  clean junk, commit, push ===" -ForegroundColor Cyan
$junk = @(
  '.git-init-log.txt','.git-report.tmp','.git-report.txt','.git-status-log.txt','.git-status-tmp.txt',
  'EXACT-TS-ERRORS.txt','_git_out.txt','build-capture.txt','build-err.txt','build-errors-stderr.txt',
  'build-errors.txt','build-exit-code.txt','build-exit.txt','build-full.log','build-log.txt',
  'build-out.log','build-out.txt','build-output.txt','build-result-for-agent.txt','build-status.txt',
  'commit-log.txt','diff-files.txt','git-branch.txt','git-diff.txt','git-files.txt','git-head.txt',
  'git-last-subject.txt','git-log-5.txt','git-operation-log.txt','git-out.txt','git-porcelain.txt',
  'git-push.txt','git-report.tmp','git-status-out.txt','git-status.txt','git-untracked.txt',
  'line0-exact.txt','line1-exact.txt','porcelain.out','push-exit.txt','ts-error-lines.txt','ts-lines.json',
  'tsc-capture.txt','tsc-err.txt','tsc-errors.txt','tsc-out.log','tsc-out.txt','tsc.log',
  'vite-build-errors.txt','scripts/_git_report.txt','src/BRANCH.txt','src/HASH.txt','src/_build_diag.txt',
  'src/_git_report.txt','src/_git_report_copy.txt','src/_git_report_stdout.txt','src/_git_report_tail.txt',
  'src/_push_diag.txt','src/_tsc.log'
)
foreach ($f in $junk) { git rm -f --ignore-unmatch -- $f | Out-Null }

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { Write-Host "Not on main (on '$branch'). Run 'git checkout main' first." -ForegroundColor Red; exit 1 }

git add -A -- src
git diff --cached --stat
git -c user.email="nexuservice@gmail.com" -c user.name="Michael Wiener" commit -m "Remove orphaned tenant/lease/unit pages and fix remaining type errors"
if ($LASTEXITCODE -ne 0) { Write-Host "Commit failed." -ForegroundColor Red; exit 1 }
git push origin main
if ($LASTEXITCODE -ne 0) { Write-Host "Push failed." -ForegroundColor Red; exit 1 }
Write-Host "Done - local build passed before pushing, so Vercel should be Ready." -ForegroundColor Green
