# plugin-factory session-start bootstrap (PowerShell variant).
# Emits Claude-compatible hook JSON with the canonical using-pf entry context.
# The renderer (tools/bootstrap/render-bootstrap.mjs) owns marker/body generation; this
# hook only wires lifecycle and serializes the result.
$ErrorActionPreference = "SilentlyContinue"

# Resolve the plugin root from this script's own location (not $PWD).
$pluginRoot = Split-Path -Parent $PSScriptRoot

$nodeBin = $env:NODE
if (-not $nodeBin) {
    $nodeBin = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeBin) {
    Write-Output '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[plugin-factory] node not found - entry skill not bootstrapped."}}'
    exit 0
}

Set-Location $pluginRoot
$json = & $nodeBin "$pluginRoot\scripts\render-bootstrap.mjs" --root $pluginRoot --plugin-name plugin-factory --harness claude 2>$null
if ($LASTEXITCODE -ne 0 -or -not $json) {
    Write-Output '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[plugin-factory] entry skill not found - check skills/using-pf/SKILL.md."}}'
} else {
    Write-Output $json
}
exit 0
