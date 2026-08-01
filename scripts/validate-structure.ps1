# validate-structure.ps1 — structural checks for plugin-factory (M0).
# Mirrors scripts/validate-structure.sh. Exit 1 on any failure.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$fail = $false
$nameRe = '^[a-z0-9]+(-[a-z0-9]+)*$'

Get-ChildItem -Path (Join-Path $root "skills") -Directory | ForEach-Object {
    $dirName = $_.Name
    $skill = Join-Path $_.FullName "SKILL.md"
    if (-not (Test-Path $skill)) {
        Write-Host "FAIL: missing $skill"; $fail = $true; return
    }
    $text = Get-Content -Raw $skill
    if ($text -notmatch '(?s)^---\s*\r?\n(.*?)\r?\n---') {
        Write-Host "FAIL: $skill missing YAML frontmatter"; $fail = $true; return
    }
    $front = $Matches[1]
    $fmName = ""
    $fmDesc = ""
    if ($front -match '(?m)^name:\s*(.+)$') { $fmName = $Matches[1].Trim() }
    if ($front -match '(?m)^description:\s*(.+)$') { $fmDesc = $Matches[1].Trim() }
    if (-not $fmName) {
        Write-Host "FAIL: $skill missing 'name' in frontmatter"; $fail = $true
    } else {
        if ($fmName -ne $dirName) {
            Write-Host "FAIL: $skill name '$fmName' != directory '$dirName'"; $fail = $true
        }
        if ($fmName -notmatch $nameRe) {
            Write-Host "FAIL: $skill name '$fmName' violates name regex"; $fail = $true
        }
    }
    if (-not $fmDesc) {
        Write-Host "FAIL: $skill missing 'description' in frontmatter"; $fail = $true
    } else {
        if ($fmDesc.Length -gt 1024) {
            Write-Host "FAIL: $skill description too long ($($fmDesc.Length) > 1024)"; $fail = $true
        }
        if (-not $fmDesc.StartsWith("Use when")) {
            Write-Host "FAIL: $skill description must start with 'Use when'"; $fail = $true
        }
    }
}

Get-ChildItem -Path (Join-Path $root "commands") -Filter *.md -File | ForEach-Object {
    $head = Get-Content $_.FullName -TotalCount 5
    if (-not ($head | Where-Object { $_ -match '^description:' })) {
        Write-Host "FAIL: $($_.FullName) missing frontmatter 'description'"; $fail = $true
    }
}

Get-ChildItem -Path (Join-Path $root "hooks") -Filter *.sh -File | ForEach-Object {
    $ps = Join-Path $_.DirectoryName ($_.BaseName + ".ps1")
    if (-not (Test-Path $ps)) {
        Write-Host "FAIL: $ps missing (hooks need bash + PowerShell pairs)"; $fail = $true
    }
}

if ($fail) {
    Write-Host "Validation FAILED"
    exit 1
}
Write-Host "Validation OK"
