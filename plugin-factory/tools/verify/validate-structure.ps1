# validate-structure.ps1 — structural checks (wrapper around scripts/verify.mjs).
# Single cross-platform engine; exit 1 on any FAIL finding.
$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot

$nodeBin = $env:NODE
if (-not $nodeBin) {
    $nodeBin = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeBin) {
    Write-Error "validate-structure: node not found (set NODE or add node to PATH)"
    exit 127
}

& $nodeBin "$root/scripts/verify.mjs" structure --root "$root"
exit $LASTEXITCODE
