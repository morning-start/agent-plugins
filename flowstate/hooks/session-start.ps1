# flowstate session-start bootstrap (PowerShell variant).
# Emits Claude-compatible hook JSON with the canonical using-fst entry
# context (frontmatter stripped, single FLOWSTATE_BOOTSTRAP marker).
# Lightweight and dependency-free: reads the SKILL.md directly, no node needed.
$ErrorActionPreference = "SilentlyContinue"

# Force UTF-8 for both file reading and stdout so the emitted JSON stays valid
# regardless of the console codepage (GBK on zh-CN Windows would otherwise
# corrupt non-ASCII content and break Claude Code's UTF-8 JSON parser).
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding

# Resolve the plugin root from this script's own location (not $PWD).
$pluginRoot = Split-Path -Parent $PSScriptRoot
$entry = Join-Path $pluginRoot "skills\using-fst\SKILL.md"

if (-not (Test-Path $entry)) {
    Write-Output '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"[flowstate] entry skill not found - check skills/using-fst/SKILL.md."}}'
    exit 0
}

# Read file, strip YAML frontmatter (--- ... ---) and leading blank lines.
# Keep regex in sync with .pi/extensions/fst-bootstrap.ts, .opencode/plugins/fst-bootstrap.ts,
# and hooks/session-start.sh (awk variant).
$raw = Get-Content -Raw -LiteralPath $entry -Encoding UTF8
$body = [regex]::Replace($raw, '(?s)\A\s*---\r?\n[\s\S]*?\r?\n---\r?\n?', '') -replace '\r\n', "`n"
$body = $body -replace '^\s*\r?\n', ''

# Ensure .agent-workplace exists before any fst-* skill tries to write into it.
# Idempotent and gitignored, so auto-creating it is safe; opt out with
# FLOWSTATE_AUTO_WORKPLACE=0. Skipped silently when the cwd is not a project root.
$wsInit = Join-Path $pluginRoot "scripts\fst-workplace-init.ps1"
if ($env:FLOWSTATE_AUTO_WORKPLACE -ne "0" -and (Test-Path -LiteralPath $wsInit)) {
    $proj = if ($env:CLAUDE_PROJECT_DIR) { $env:CLAUDE_PROJECT_DIR } else { (Get-Location).Path }
    try {
        $wsNotice = (& $wsInit -Root $proj -Context 2>$null | Out-String).Trim()
        if ($wsNotice) { $body = $body + "`n`n" + $wsNotice }
    } catch { }
}

$marker = "FLOWSTATE_BOOTSTRAP:flowstate"
# Full JSON string escaping: backslash first, then double quote, then control
# chars (CR, LF, TAB) — raw control characters are illegal inside JSON strings.
$ctx = $body -replace '\\', '\\\\' -replace '"', '\"' -replace "`r", '\r' -replace "`n", '\n' -replace "`t", '\t'
$ctx = $marker + '\n\n' + $ctx

Write-Output ('{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"' + $ctx + '"}}')
exit 0
