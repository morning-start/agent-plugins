# flowstate — .agent-workplace initializer (idempotent, PowerShell variant).
#
# Usage:
#   fst-workplace-init.ps1 [-Root DIR] [-Iteration NNN] [-Force] [-NoLink]
#                          [-Quiet] [-Json]
#
# Contract (see skills/fst-workplace/SKILL.md):
#   1. copy templates\agent-workplace\ -> <root>\.agent-workplace\
#   2. copy templates\iteration\       -> .agent-workplace\iterations\iteration-NNN\
#   3. point .agent-workplace\iterations\current at the active iteration
#   4. ensure <root>\.gitignore contains the `.agent-workplace/` entry
#   5. ensure iterations\ + scratch\ exist (empty dirs do not survive git)
#
# The plugin root is resolved from this script's own location, so no
# plugin-root environment variable is required.
# Windows pointer strategy: SymbolicLink first (relative target), then
# Junction — junctions need no elevation, which is why `ln -s` used to fail.

[CmdletBinding()]
param(
  [string]$Root = $env:FLOWSTATE_PROJECT_ROOT,
  [string]$Iteration,
  [switch]$Force,
  [switch]$NoLink,
  [switch]$Quiet,
  [switch]$Json,
  # Emit a one-line notice for hook additionalContext (used by session-start.ps1).
  [switch]$Context
)

$ErrorActionPreference = "Stop"
# Force UTF-8 so emitted JSON stays valid regardless of console codepage.
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding

if ($Json) { $Quiet = $true }
if ($Context) { $Quiet = $true }

$pluginRoot = Split-Path -Parent $PSScriptRoot
$tplWp = Join-Path $pluginRoot "templates\agent-workplace"
$tplIt = Join-Path $pluginRoot "templates\iteration"

if ([string]::IsNullOrWhiteSpace($Root)) { $Root = (Get-Location).Path }
if (-not (Test-Path -LiteralPath $Root -PathType Container)) {
  Write-Error "fst-workplace-init: project root does not exist: $Root"
  exit 2
}
$Root = (Resolve-Path -LiteralPath $Root).ProviderPath

$warnings = New-Object System.Collections.Generic.List[string]
$created = New-Object System.Collections.Generic.List[string]
$script:restored = 0

function Write-Section([string]$msg) { if (-not $Quiet) { Write-Output $msg } }

function Copy-Tree([string]$Src, [string]$Dst, [bool]$Overwrite) {
  if (-not (Test-Path -LiteralPath $Dst -PathType Container)) {
    New-Item -ItemType Directory -Path $Dst -Force | Out-Null
  }
  Get-ChildItem -LiteralPath $Src -Recurse -Force | ForEach-Object {
    $rel = $_.FullName.Substring($Src.Length).TrimStart('\', '/')
    if ([string]::IsNullOrEmpty($rel)) { return }
    $target = Join-Path $Dst $rel
    if ($_.PSIsContainer) {
      if (-not (Test-Path -LiteralPath $target -PathType Container)) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
      }
    } else {
      if ($Overwrite -or -not (Test-Path -LiteralPath $target)) {
        $parent = Split-Path -Parent $target
        if (-not (Test-Path -LiteralPath $parent -PathType Container)) {
          New-Item -ItemType Directory -Path $parent -Force | Out-Null
        }
        Copy-Item -LiteralPath $_.FullName -Destination $target -Force
        $script:restored++
      }
    }
  }
}

function Test-ProjectRoot([string]$d) {
  $markers = @('.git', 'package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod',
               'pom.xml', 'build.gradle', 'build.gradle.kts', 'CMakeLists.txt',
               'README.md', '.claude')
  foreach ($m in $markers) {
    if (Test-Path -LiteralPath (Join-Path $d $m)) { return $true }
  }
  if ((Get-ChildItem -LiteralPath $d -Filter *.sln -ErrorAction SilentlyContinue |
       Select-Object -First 1)) { return $true }
  return $false
}

function Ensure-GitIgnore([string]$projectRoot) {
  $gi = Join-Path $projectRoot ".gitignore"
  $header = "# Agent 私有工作区（全部内容不提交，见 flowstate fst-workplace）"
  $line = ".agent-workplace/"
  if (-not (Test-Path -LiteralPath $gi)) {
    Set-Content -LiteralPath $gi -Value @($header, $line) -Encoding UTF8
    $script:created.Add(".gitignore")
    return
  }
  # -Encoding UTF8 is mandatory: PowerShell 5.1 defaults to the ANSI codepage,
  # and decoding UTF-8 Chinese bytes as GBK can swallow the following \n,
  # collapsing the file into one line and breaking the -contains check below.
  $existing = Get-Content -LiteralPath $gi -Encoding UTF8 -ErrorAction SilentlyContinue
  if ($existing -contains $line) { return }
  if ($existing -and $existing.Count -gt 0 -and $existing[-1].Length -gt 0) {
    Add-Content -LiteralPath $gi -Value "" -Encoding UTF8
  }
  Add-Content -LiteralPath $gi -Value @($header, $line) -Encoding UTF8
  $script:created.Add(".gitignore(+entry)")
}

function Get-PointerMode([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) { return "missing" }
  $item = Get-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
  if (-not $item) { return "missing" }
  $attrs = $item.Attributes
  $isReparse = (($attrs -band [IO.FileAttributes]::ReparsePoint) -ne 0)
  $isDir = (($attrs -band [IO.FileAttributes]::Directory) -ne 0)
  if ($isReparse) {
    $linkType = $item.PSObject.Properties['LinkType']
    if ($linkType -and $linkType.Value -eq "SymbolicLink") { return "symlink" }
    if ($isDir) { return "junction" }
    return "symlink"
  }
  if ($isDir) { return "directory" }
  return "file"
}

function New-Pointer([string]$link, [string]$target) {
  if ($NoLink) { return $false }
  # 1) Symbolic link (preferred; needs developer mode or elevation on Windows).
  try {
    New-Item -ItemType SymbolicLink -Path $link -Target $target -Force -ErrorAction Stop | Out-Null
    return $true
  } catch { }
  # 2) Junction — directories only, no elevation required.
  try {
    New-Item -ItemType Junction -Path $link -Target $target -ErrorAction Stop | Out-Null
    return $true
  } catch { }
  return $false
}

function Remove-Pointer([string]$link) {
  if (-not (Test-Path -LiteralPath $link)) { return }
  $item = Get-Item -LiteralPath $link -Force -ErrorAction SilentlyContinue
  if (-not $item) { return }
  if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
    if ($item.PSIsContainer) { [IO.Directory]::Delete($item.FullName, $false) }
    else { Remove-Item -LiteralPath $link -Force }
  }
}

function Get-LatestIteration([string]$iters) {
  if (-not (Test-Path -LiteralPath $iters -PathType Container)) { return $null }
  $dirs = Get-ChildItem -LiteralPath $iters -Directory -Filter "iteration-*" -ErrorAction SilentlyContinue |
          Sort-Object Name
  if (-not $dirs -or $dirs.Count -eq 0) { return $null }
  return $dirs[-1].Name
}

# --- preflight -------------------------------------------------------------

if (-not (Test-Path -LiteralPath $tplWp -PathType Container)) {
  Write-Error "fst-workplace-init: template missing: $tplWp"
  exit 3
}

if (-not $Force -and -not (Test-ProjectRoot $Root)) {
  if ($Context) {
    Write-Output "[flowstate] workspace: 当前目录未检出项目标记，未自动初始化。需要时执行 flowstate\scripts\fst-workplace-init.ps1 -Root <项目根> -Force。"
  } elseif ($Json) {
    $r = @{ status = "skipped"; reason = "no_project_marker"; project_root = $Root; next = "fst-workplace" }
    Write-Output ($r | ConvertTo-Json -Compress -Depth 4)
  } else {
    Write-Section "flowstate: 未在项目根中检出到项目标记（.git / package.json / Cargo.toml / ...），跳过工作区初始化。如需强制初始化请加 -Force。"
  }
  exit 0
}

# --- initialize ------------------------------------------------------------

$wp = Join-Path $Root ".agent-workplace"
$status = "present"
if (-not (Test-Path -LiteralPath $wp -PathType Container)) {
  New-Item -ItemType Directory -Path $wp -Force | Out-Null
  $status = "initialized"
}

# Detect genuine repairs (a template file that went missing) rather than
# reporting "present" whenever the directory merely exists.
$script:restored = 0
Copy-Tree $tplWp $wp ([bool]$Force)
if ($script:restored -gt 0 -and $status -eq "present") { $status = "repaired" }

foreach ($d in @('iterations', 'shared', 'shared\adr', 'scratch', 'state')) {
  $full = Join-Path $wp $d
  if (-not (Test-Path -LiteralPath $full -PathType Container)) {
    New-Item -ItemType Directory -Path $full -Force | Out-Null
    $created.Add(".agent-workplace/$d")
  }
}

$iters = Join-Path $wp "iterations"
if ([string]::IsNullOrWhiteSpace($Iteration)) {
  $iterName = Get-LatestIteration $iters
  if ([string]::IsNullOrWhiteSpace($iterName)) { $iterName = "iteration-001" }
} elseif ($Iteration -like "iteration-*") {
  $iterName = $Iteration
} else {
  $iterName = "iteration-$Iteration"
}

$iterDir = Join-Path $iters $iterName
if (-not (Test-Path -LiteralPath $iterDir -PathType Container)) {
  Copy-Tree $tplIt $iterDir ([bool]$Force)
  $created.Add(".agent-workplace/iterations/$iterName")
  if ($status -eq "present") { $status = "repaired" }
}

$current = Join-Path $iters "current"
$pointerMode = Get-PointerMode $current

switch ($pointerMode) {
  { $_ -in @('symlink', 'junction') } {
    if ($Force) {
      Remove-Pointer $current
      if (New-Pointer $current $iterDir) { $pointerMode = Get-PointerMode $current }
      else {
        $pointerMode = "explicit"
        $warnings.Add("current 指针创建失败，请直接使用 iterations/$iterName 显式路径")
      }
    }
  }
  'directory' {
    if ($Force) {
      Remove-Item -LiteralPath $current -Recurse -Force -ErrorAction SilentlyContinue
      if (New-Pointer $current $iterDir) { $pointerMode = Get-PointerMode $current }
      else { $pointerMode = "explicit" }
    } else {
      $warnings.Add("iterations/current 是真实目录（旧版 ln 退化产物），未自动替换；加 -Force 可重建为链接（会先删除该目录下的现有内容，请先确认其中无未迁移产物）")
    }
  }
  'file' {
    $warnings.Add("iterations/current 是普通文件而非链接，请手动检查")
  }
  'missing' {
    if (New-Pointer $current $iterDir) { $pointerMode = Get-PointerMode $current }
    else {
      $pointerMode = "explicit"
      $warnings.Add("无法创建 current 链接（Windows 需开发者模式或管理员权限），已降级为显式路径模式")
    }
  }
}

Ensure-GitIgnore $Root

$now = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$stateDir = Join-Path $wp "state"
if (-not (Test-Path -LiteralPath $stateDir -PathType Container)) {
  New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
}
$meta = @{
  schema            = "flowstate-workspace/1"
  workspace         = ".agent-workplace"
  initialized_at    = $now
  current_iteration = $iterName
  current_pointer   = @{
    mode   = $pointerMode
    path   = "iterations/current"
    target = "iterations/$iterName"
  }
  gitignore_entry   = $true
}
$metaFile = Join-Path $stateDir "workspace.json"
# Write without a BOM: PowerShell 5.1's Set-Content -Encoding UTF8 adds one,
# which breaks strict JSON parsers downstream.
[System.IO.File]::WriteAllText(
  $metaFile,
  ($meta | ConvertTo-Json -Depth 4),
  [System.Text.UTF8Encoding]::new($false)
)

# --- output ----------------------------------------------------------------

if ($Context) {
  switch ($status) {
    "initialized" { $msg = "[flowstate] workspace: 已自动初始化 .agent-workplace/（迭代 $iterName，iterations/current = $pointerMode）。" }
    "repaired"    { $msg = "[flowstate] workspace: 已修复 .agent-workplace/ 的缺失项（迭代 $iterName，iterations/current = $pointerMode）。" }
    default       { $msg = "[flowstate] workspace: 已就绪（迭代 $iterName，iterations/current = $pointerMode）。" }
  }
  foreach ($w in $warnings) { $msg += " 警告：$w。" }
  if ($pointerMode -in @('explicit', 'directory')) {
    $msg += " 落点请用显式路径 .agent-workplace/iterations/$iterName/"
  }
  Write-Output $msg
} elseif ($Json) {
  $result = [ordered]@{
    status            = $status
    project_root      = $Root
    workspace         = ".agent-workplace"
    current_iteration = $iterName
    pointer           = @{ mode = $pointerMode; path = "iterations/current" }
    gitignore_entry   = $true
    created           = @($created)
    warnings          = @($warnings)
    next              = "fst-workplace"
  }
  Write-Output ($result | ConvertTo-Json -Compress -Depth 5)
} else {
  switch ($status) {
    "initialized" { Write-Section "flowstate: 已初始化 .agent-workplace/（迭代 $iterName，current 模式 $pointerMode）" }
    "repaired"    { Write-Section "flowstate: 已修复 .agent-workplace/（补齐缺失项，迭代 $iterName，current 模式 $pointerMode）" }
    default       { Write-Section "flowstate: .agent-workplace/ 已就绪（迭代 $iterName，current 模式 $pointerMode）" }
  }
  foreach ($w in $warnings) { Write-Output "flowstate: 警告 — $w" }
}

exit 0
