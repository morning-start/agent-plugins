# flowstate Document Status Check Hook (PowerShell) — HARD GATE
# 检查文档状态的一致性（SessionEnd）。
#
# 一致性铁律：P1 清单自洽 / P2 提升门槛 / P4 状态机 / P5 溯源完整。
# 违反即非零退出——带病工作区收尾即报错，交由 fst-promote 修复后再结束会话。
# 校验语义与 tests/dual-document-consistency.test.mjs 的 checkDualDocumentConsistency
# 保持一致；字段清单以 schemas/document-status.schema.json 为准。
#
# 仅当工作区存在时才执行（幂等）：无 .agent-workplace / 无清单 → 温和退 0。

$ErrorActionPreference = "Stop"

# Force UTF-8 so ConvertFrom-Json does not corrupt non-ASCII bytes on PS 5.1.
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $OutputEncoding

$statusPath = ".agent-workplace/state/document-status.json"

if (-not (Test-Path ".agent-workplace") -or -not (Test-Path $statusPath)) {
    exit 0
}

# 合法状态枚举（与 schema 的 enum 保持一致）。
$STATE_ENUM = @("DRAFT", "REVIEW_NEEDED", "APPROVED", "ARCHIVED", "OBSOLETE")
# P2 提升的置信度阈值（与 fst-promote / tests 保持一致）。
$CONFIDENCE_THRESHOLD = 0.8

$violations = [System.Collections.Generic.List[string]]::new()

try {
    $index = Get-Content $statusPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Error "[flowstate] BLOCKED: document-status.json is not valid JSON — $($_.Exception.Message)"
    exit 1
}

# P1 必填容器字段。
if ($null -eq $index.documents) {
    Write-Error "[flowstate] BLOCKED: document-status.json is missing the 'documents' array."
    exit 1
}

foreach ($doc in $index.documents) {
    $id = if ($doc.path) { $doc.path } else { "<unknown>" }

    # P1 必填字段（path/type/stage/iteration）+ 类型枚举。
    foreach ($req in @("path", "type", "stage", "iteration")) {
        if ([string]::IsNullOrEmpty($doc.$req)) {
            $violations.Add("P1 required: [$id] missing '$req'")
        }
    }
    if ($doc.type -and ($STATE_ENUM -notcontains $doc.type)) {
        $violations.Add("P1 enum: [$id] type '$($doc.type)' is not a legal state")
    }

    # P4 状态机只允许合法状态（前置已含枚举校验），后门跳转交由测试兜底。

    # P2 提升门槛：REVIEW_NEEDED 必须置信度达标。
    if ($doc.type -eq "REVIEW_NEEDED") {
        if ($null -eq $doc.confidence -or [double]$doc.confidence -lt $CONFIDENCE_THRESHOLD) {
            $violations.Add("P2 confidence: [$id] is REVIEW_NEEDED but confidence < $CONFIDENCE_THRESHOLD")
        }
        # 提升目标必须落在 docs/（定稿）或 .agent-workplace/shared/（跨迭代共享沉淀）内。
        if ($doc.promoted_to -and ($doc.promoted_to -notlike "docs/*") -and ($doc.promoted_to -notlike ".agent-workplace/shared/*")) {
            $violations.Add("P2 target: [$id] promotes outside docs/ or shared/ ('$($doc.promoted_to)')")
        }
    }

    # P5 溯源完整：APPROVED 必须带 source/promoted_to/approver（HITL 证据）。
    if ($doc.type -eq "APPROVED") {
        if ([string]::IsNullOrEmpty($doc.source)) {
            $violations.Add("P5 provenance: [$id] APPROVED but missing 'source'")
        }
        if ([string]::IsNullOrEmpty($doc.promoted_to)) {
            $violations.Add("P5 provenance: [$id] APPROVED but missing 'promoted_to'")
        }
        if ([string]::IsNullOrEmpty($doc.approver)) {
            $violations.Add("P5 provenance: [$id] APPROVED but missing 'approver' (HITL evidence)")
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Error "[flowstate] BLOCKED: document-status.json violates dual-document consistency:"
    $violations | ForEach-Object { Write-Error "  - $_" }
    Write-Error "[flowstate] Run /fst-promote to finalize, or fix the index, before ending the session."
    exit 1
}

Write-Host "flowstate Document Status Check: OK"
exit 0
