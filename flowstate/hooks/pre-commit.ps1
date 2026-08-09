# flowstate pre-commit gate (PowerShell variant).
# Blocks commits that violate the workspace commit-boundary iron law:
#   - staged .agent-workplace/ content (private, must never be committed)
#   - obvious secrets in staged files (API keys, passwords, tokens)
# Dependency-free: uses only git.
$ErrorActionPreference = "Stop"

$staged = (& git diff --cached --name-only 2>$null) -join "`n"

if ($staged -match '(?m)^\.agent-workplace/') {
    Write-Error "[flowstate] BLOCKED: .agent-workplace/ is the agent's PRIVATE workspace and must never be committed."
    Write-Error "[flowstate] Remove it from the index: git reset .agent-workplace/ (content stays on disk)."
    exit 1
}

$diff = (& git diff --cached 2>$null) -join "`n"
$secretHits = [regex]::Matches($diff, '(?im)(api[_-]?key|secret|password|token)[\s]*[:=][\s]*["''][A-Za-z0-9_\-]{16,}')
if ($secretHits.Count -gt 0) {
    Write-Error "[flowstate] BLOCKED: possible secret in staged changes — check before committing."
    $secretHits | Select-Object -First 5 | ForEach-Object { Write-Error $_.Value }
    exit 1
}

exit 0
