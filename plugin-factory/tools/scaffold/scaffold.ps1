# scaffold.ps1 — generate a standalone multi-harness plugin project.
# Thin wrapper around tools/scaffold/scaffold.mjs (single cross-platform renderer).
# Usage: .\scaffold.ps1 -Name my-plugin -Prefix mp -Target C:\path\to\out [-Description "..."] [-UserLang zh-CN] [-Harnesses claude-code,pi,opencode,oh-my-pi]
param(
    [Parameter(Position = 0)][string]$Name,
    [Parameter(Position = 1)][string]$Prefix,
    [Parameter(Position = 2)][string]$Target,
    [string]$Description,
    [string]$UserLang,
    [string]$Harnesses
)

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$argsList = @()
if ($Name) { $argsList += @("--name", $Name) }
if ($Prefix) { $argsList += @("--prefix", $Prefix) }
if ($Target) { $argsList += @("--target", $Target) }
if ($Description) { $argsList += @("--description", $Description) }
if ($UserLang) { $argsList += @("--user-lang", $UserLang) }
if ($Harnesses) { $argsList += @("--harnesses", $Harnesses) }

& node "$root/tools/scaffold/scaffold.mjs" @argsList
exit $LASTEXITCODE
