# flowstate Post-Compact Hook (PowerShell)
# 会话压缩（checkpoint 边界）后自动生成待提升文档清单

Write-Host "flowstate Post-Compact: 生成待提升文档清单..."

# 检查 document-status.json 是否存在
if (-not (Test-Path ".agent-workplace/state/document-status.json")) {
    Write-Host "警告：document-status.json 不存在，跳过"
    exit 0
}

# 读取 document-status.json
$documentStatus = Get-Content ".agent-workplace/state/document-status.json" -Raw | ConvertFrom-Json

# 读取 current-iteration.json
$currentIteration = "unknown"
if (Test-Path ".agent-workplace/state/current-iteration.json") {
    $currentIterationData = Get-Content ".agent-workplace/state/current-iteration.json" -Raw | ConvertFrom-Json
    $currentIteration = $currentIterationData.current_iteration
}

# 生成待提升文档清单
$readyForPromotion = @"
# 待提升文档清单

生成时间：$(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

## 当前迭代：$currentIteration

### 调研阶段
"@

$investigationDocs = $documentStatus.documents | Where-Object { $_.stage -eq "investigation" -and $_.type -eq "REVIEW_NEEDED" }
if ($investigationDocs) {
    foreach ($doc in $investigationDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

### 需求阶段
"@

$requirementsDocs = $documentStatus.documents | Where-Object { $_.stage -eq "requirements" -and $_.type -eq "REVIEW_NEEDED" }
if ($requirementsDocs) {
    foreach ($doc in $requirementsDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

### 设计阶段
"@

$designDocs = $documentStatus.documents | Where-Object { $_.stage -eq "design" -and $_.type -eq "REVIEW_NEEDED" }
if ($designDocs) {
    foreach ($doc in $designDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

### 开发阶段
"@

$developmentDocs = $documentStatus.documents | Where-Object { $_.stage -eq "development" -and $_.type -eq "REVIEW_NEEDED" }
if ($developmentDocs) {
    foreach ($doc in $developmentDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

### 测试阶段
"@

$testingDocs = $documentStatus.documents | Where-Object { $_.stage -eq "testing" -and $_.type -eq "REVIEW_NEEDED" }
if ($testingDocs) {
    foreach ($doc in $testingDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

### 发布阶段
"@

$releaseDocs = $documentStatus.documents | Where-Object { $_.stage -eq "release" -and $_.type -eq "REVIEW_NEEDED" }
if ($releaseDocs) {
    foreach ($doc in $releaseDocs) {
        $readyForPromotion += "`n- [ ] ``$($doc.path)`` (confidence: $($doc.confidence))"
    }
} else {
    $readyForPromotion += "`n- 无"
}

$readyForPromotion += @"

---

**提升条件**：
- 文档状态必须为 ``REVIEW_NEEDED``
- 置信度必须 >= 0.8
- 必须通过 ``/fst-promote`` 提升
- 必须经过 HITL 确认
"@

# 写入文件
$readyForPromotion | Out-File -FilePath ".agent-workplace/state/ready-for-promotion.md" -Encoding UTF8

Write-Host "flowstate Post-Compact: 待提升文档清单已生成"
