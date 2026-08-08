# flowstate session-start bootstrap (PowerShell variant).
# Emits Claude-compatible hook JSON with the canonical using-flowstate entry
# context (frontmatter stripped, single FLOWSTATE_BOOTSTRAP marker).
# Lightweight and dependency-free: reads the SKILL.md directly, no node needed.
$ErrorActionPreference = "SilentlyContinue"

# Resolve the plugin root from this script's own location (not $PWD).
$pluginRoot = Split-Path -Parent $PSScriptRoot
$entry = Join-Path $pluginRoot "skills\using-flowstate\SKILL.md"

if (-not (Test-Path $entry)) {
    Write-Output '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[flowstate] entry skill not found - check skills/using-flowstate/SKILL.md."}}'
    exit 0
}

# Read file, strip YAML frontmatter (--- ... ---) and leading blank lines.
$raw = Get-Content -Raw -LiteralPath $entry
$body = [regex]::Replace($raw, '^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?', '')
$body = $body -replace '^\s*\r?\n', ''

$marker = "FLOWSTATE_BOOTSTRAP:flowstate"
$ctx = "$marker`n`n$body"
$ctx = $ctx -replace '"', '\"'

Write-Output ("{`"hookSpecificOutput`":{`"hookEventName`":`"SessionStart`",`"additionalContext`":`"" + $ctx + "`"}}")
exit 0
