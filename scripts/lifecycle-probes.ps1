# lifecycle-probes.ps1 — lifecycle/orchestration probes (wrapper around scripts/verify.mjs).
# Emits severity-ranked findings; exit 1 on any FAIL finding.
$root = Split-Path -Parent $PSScriptRoot
& node "$root/scripts/verify.mjs" lifecycle --root "$root"
exit $LASTEXITCODE
