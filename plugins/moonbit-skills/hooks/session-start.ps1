param(
    [string]$HookName
)

# SessionStart hook runner for Windows (PowerShell)
# Injects the using-moonbit-skills bootstrap into agent session

$ErrorActionPreference = "Stop"
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding

if ($HookName -ne "session-start") {
    Write-Error "Unknown hook: $HookName"
    exit 1
}

$PluginRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillPath = Join-Path $PluginRoot "..\skills\using-moonbit-skills\SKILL.md"

if (-not (Test-Path $SkillPath)) {
    Write-Error "Bootstrap skill not found at: $SkillPath"
    exit 1
}

# --- Read and inject ---
$SkillContent = Get-Content -Path $SkillPath -Raw -Encoding UTF8
$SkillEscaped = $SkillContent -replace '\\', '\\' -replace '"', '\"' -replace "`n", '\n' -replace "`r", '\r' -replace "`t", '\t'

$SessionContext = "<EXTREMELY-IMPORTANT>`nYou have MoonBit Skills loaded.`n`n**Below is the full MoonBit Skills bootstrap -- your introduction to using skills:**`n`n${SkillEscaped}`n</EXTREMELY-IMPORTANT>"

# Detect platform: Cursor, Claude Code, or unknown
if ($env:COPILOT_CLI) {
    # Copilot CLI / unknown
    $output = @{
        additionalContext = $SessionContext
    }
} elseif ($env:CURSOR_PLUGIN_ROOT) {
    # Cursor format
    $output = @{
        additionalContext = $SessionContext
    }
} else {
    # Claude Code format (uses hookSpecificOutput)
    $output = @{
        hookSpecificOutput = @{
            hookEventName = "SessionStart"
            additionalContext = $SessionContext
        }
    }
}

Write-Output ($output | ConvertTo-Json -Depth 3 -Compress)
exit 0
