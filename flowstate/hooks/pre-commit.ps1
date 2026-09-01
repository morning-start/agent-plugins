# flowstate pre-commit gate (PowerShell variant).
# Blocks commits that violate the workspace commit-boundary iron law:
#   - staged .agent-workplace/ content (private, must never be committed)
#   - obvious secrets in staged files (API keys, passwords, tokens)
#   - P3 back-door writes: staged docs/ files with no APPROVED record in
#     .agent-workplace/state/document-status.json (they bypassed fst-promote)
# Dependency-free: uses only git + PowerShell JSON.
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

# --- P3 reverse-authorization gate ----------------------------------------
# Every finalized doc (docs/*.md) being committed must be backed by an APPROVED
# record in the workspace index, proving it passed /fst-promote + HITL.
$statusPath = ".agent-workplace/state/document-status.json"

# Skip the reverse check when there is no workspace (not a flowstate project).
if (Test-Path $statusPath) {
    $approvedTargets = [System.Collections.Generic.HashSet[string]]::new(
        [System.StringComparer]::Ordinal
    )
    try {
        $index = Get-Content $statusPath -Raw -Encoding UTF8 | ConvertFrom-Json
        foreach ($doc in $index.documents) {
            if ($doc.type -eq "APPROVED" -and $doc.promoted_to) {
                [void]$approvedTargets.Add($doc.promoted_to -replace "/", "\")
            }
        }
    } catch {
        # Unreadable index — do not silently allow; let the SessionEnd gate catch it.
        $approvedTargets.Clear()
    }

    $stagedFinalized = $staged -split "`n" | Where-Object {
        $_ -and $_ -match '^docs/.+\.md$'
    }

    $unapproved = $stagedFinalized | Where-Object {
        $key = $_ -replace "/", "\"
        -not $approvedTargets.Contains($key)
    }

    if ($unapproved) {
        Write-Error "[flowstate] BLOCKED: docs/ files have no APPROVED record — they bypassed the fst-promote gate:"
        $unapproved | ForEach-Object { Write-Error "  - $_" }
        Write-Error "[flowstate] Run /fst-promote to authorize them, then re-stage and commit."
        exit 1
    }
}

exit 0
