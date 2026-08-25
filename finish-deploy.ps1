# 1) Write UX files to disk  2) build  3) commit src  4) push
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GIT_PAGER = 'cat'
$env:GIT_EDITOR = 'true'
$status = Join-Path $PSScriptRoot 'src\deploy-status.md'

function W([string]$m) {
  Add-Content -Path $status -Value $m -Encoding UTF8
  Write-Host $m
}

try {
  Set-Content -Path $status -Value "# deploy status`n" -Encoding UTF8
  W "cwd=$PWD"
  W "=== apply UX files to disk ==="
  node .\apply-ux-fixes.mjs
  if ($LASTEXITCODE -ne 0) { W "apply-ux-fixes failed exit=$LASTEXITCODE"; exit 1 }

  W "=== npm run build ==="
  npm run build
  if ($LASTEXITCODE -ne 0) { W "BUILD FAILED exit=$LASTEXITCODE"; exit 1 }
  W "build ok"

  W "=== git add ==="
  git add -- src/components src/contexts/EntityDetailContext.tsx src/pages/broker apply-ux-fixes.mjs finish-deploy.ps1 .gitignore
  $names = git --no-pager diff --cached --name-only
  W "STAGED:"
  W ($names -join "`n")
  git --no-pager diff --cached --stat | ForEach-Object { W $_ }

  $staged = @($names | Where-Object { $_ })
  if ($staged.Count -eq 0) {
    W "NOTHING STAGED"
    git status --short | ForEach-Object { W $_ }
    exit 1
  }

  W "=== git commit ==="
  git commit -m "fix: sticky nav, entity popup links, and back buttons in broker CRM"
  W "=== pull --rebase ==="
  git pull --rebase origin main
  if ($LASTEXITCODE -ne 0) { W "PULL FAILED"; exit 1 }
  W "=== push ==="
  git push origin main
  if ($LASTEXITCODE -ne 0) { W "PUSH FAILED"; exit 1 }
  W "PUSH OK"
  git --no-pager log -1 --stat | ForEach-Object { W $_ }
} catch {
  W "ERROR: $_"
  exit 1
}
