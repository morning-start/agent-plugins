# plugin-factory post-tool-verify hook (PowerShell variant).
# Runs after file edits (PostToolUse): quick structural gate via the verify
# engine's structure layer. Emits Claude-compatible hook JSON; non-zero exit
# on findings so the harness can surface them.
$ErrorActionPreference = "SilentlyContinue"

# Force UTF-8 stdout so the emitted JSON stays valid regardless of the console
# codepage (GBK on zh-CN Windows would otherwise corrupt non-ASCII content).
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding

$pluginRoot = Split-Path -Parent $PSScriptRoot
$nodeBin = $env:NODE
if (-not $nodeBin) {
    $nodeBin = (Get-Command node -ErrorAction SilentlyContinue).Source
}
if (-not $nodeBin) {
    Write-Output '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[plugin-factory] node not found - structure gate skipped."}}'
    exit 0
}

Set-Location $pluginRoot
$out = & $nodeBin "$pluginRoot\scripts\verify.mjs" structure --format table 2>$null
$outText = [string]::Join("`n", $out)
if ($LASTEXITCODE -ne 0 -or $outText -match "FAIL") {
    $esc = $outText.Replace('\', '\\').Replace('"', '\"').Replace("`n", '\n')
    Write-Output "{`"hookSpecificOutput`":{`"hookEventName`":`"PostToolUse`",`"additionalContext`":`"[plugin-factory] structure gate FAILED:`n$esc`"}}"
    exit 1
}
if ($outText -match "WARN") {
    $esc = $outText.Replace('\', '\\').Replace('"', '\"').Replace("`n", '\n')
    Write-Output "{`"hookSpecificOutput`":{`"hookEventName`":`"PostToolUse`",`"additionalContext`":`"[plugin-factory] structure warnings:`n$esc`"}}"
    exit 0
}
Write-Output '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"[plugin-factory] structure gate passed."}}'
exit 0
