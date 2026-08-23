# bump-version.ps1 — bump version across declared manifest files, with drift
# detection and repo-wide audit. Thin wrapper around scripts/version.mjs
# (single cross-platform implementation; no parsing logic in shell).
# Usage: .\bump-version.ps1 <X.Y.Z> | -Check | -Audit
param(
    [Parameter(Position = 0)][string]$Version,
    [switch]$Check,
    [switch]$Audit
)

$root = Split-Path -Parent $PSScriptRoot
$nodeBin = $env:NODE
if (-not $nodeBin) {
    $nodeBin = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeBin) {
    Write-Host "bump-version: node not found (set NODE or add node to PATH)" -ForegroundColor Red
    exit 127
}

Set-Location $root
if ($Check) {
    & $nodeBin "$root\scripts\version.mjs" check
} elseif ($Audit) {
    & $nodeBin "$root\scripts\version.mjs" audit
} elseif ($Version) {
    & $nodeBin "$root\scripts\version.mjs" bump $Version
} else {
    Write-Host "Usage: .\bump-version.ps1 <X.Y.Z> | -Check | -Audit"
    exit 0
}
exit $LASTEXITCODE
