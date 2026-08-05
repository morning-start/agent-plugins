# lifecycle-probes.ps1 — lifecycle/orchestration probes (wrapper around scripts/verify.mjs).
# Emits severity-ranked findings; exit 1 on any FAIL finding.
$ErrorActionPreference = "SilentlyContinue"

$root = Split-Path -Parent $PSScriptRoot

$nodeBin = $env:NODE
if (-not $nodeBin) {
    $nodeBin = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeBin) {
    Write-Error "lifecycle-probes: node not found (set NODE or add node to PATH)"
    exit 127
}

$lifecycleArgs = $env:LIFECYCLE_ARGS
if ($lifecycleArgs) {
    & $nodeBin "$root/scripts/verify.mjs" lifecycle --root "$root" --$lifecycleArgs.Split(" ")[0] $lifecycleArgs.Split(" ")[1]
} else {
    & $nodeBin "$root/scripts/verify.mjs" lifecycle --root "$root"
}
exit $LASTEXITCODE
