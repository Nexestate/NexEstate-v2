$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$log = Join-Path $PSScriptRoot 'push-result.log'
Remove-Item $log -ErrorAction SilentlyContinue

function Log($msg) {
  $line = "$(Get-Date -Format 'HH:mm:ss') $msg"
  Add-Content -Path $log -Value $line -Encoding UTF8
}

try {
  Log '=== BUILD ==='
  npm run build 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { Log "BUILD FAILED exit=$LASTEXITCODE"; exit 1 }

  Log '=== STATUS ==='
  git status --short 2>&1 | ForEach-Object { Log $_ }

  Log '=== ADD ==='
  git add -A 2>&1 | ForEach-Object { Log $_ }

  Log '=== COMMIT ==='
  $diff = git diff --cached --name-only
  if ($diff) {
    git commit -m "fix: sticky nav, entity popup links, and back buttons in broker CRM" 2>&1 | ForEach-Object { Log $_ }
  } else {
    Log 'Nothing staged to commit'
  }

  Log '=== PULL REBASE ==='
  git pull --rebase origin main 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { Log "PULL FAILED exit=$LASTEXITCODE"; exit 1 }

  Log '=== PUSH ==='
  git push origin main 2>&1 | ForEach-Object { Log $_ }
  if ($LASTEXITCODE -ne 0) { Log "PUSH FAILED exit=$LASTEXITCODE"; exit 1 }

  Log '=== DONE ==='
  git log -1 --oneline 2>&1 | ForEach-Object { Log $_ }
  git rev-parse HEAD 2>&1 | ForEach-Object { Log "HEAD=$_" }
  git rev-parse origin/main 2>&1 | ForEach-Object { Log "ORIGIN=$_" }
} catch {
  Log "ERROR: $_"
  exit 1
}
