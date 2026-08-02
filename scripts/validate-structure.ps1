# validate-structure.ps1 — structural checks (wrapper around scripts/verify.mjs).
# Single cross-platform engine; exit 1 on any FAIL finding.
$root = Split-Path -Parent $PSScriptRoot
& node "$root/scripts/verify.mjs" structure --root "$root"
exit $LASTEXITCODE
