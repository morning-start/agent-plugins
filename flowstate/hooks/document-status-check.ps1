# flowstate Document Status Check Hook (PowerShell)
# 检查文档状态的一致性

Write-Host "flowstate Document Status Check: 检查文档状态..."

# 检查 document-status.json 是否存在
if (-not (Test-Path ".agent-workplace/state/document-status.json")) {
    Write-Host "警告：document-status.json 不存在"
    exit 0
}

# 读取 document-status.json
# -Encoding UTF8 is mandatory: PowerShell 5.1 defaults to the ANSI codepage,
# which corrupts non-ASCII bytes in the JSON.
$documentStatus = Get-Content ".agent-workplace/state/document-status.json" -Raw -Encoding UTF8 | ConvertFrom-Json

# 检查是否有文档状态为 REVIEW_NEEDED 但置信度低于 0.8
$lowConfidenceDocs = $documentStatus.documents | Where-Object { $_.type -eq "REVIEW_NEEDED" -and $_.confidence -lt 0.8 }
if ($lowConfidenceDocs) {
    Write-Host "警告：以下文档状态为 REVIEW_NEEDED 但置信度低于 0.8"
    foreach ($doc in $lowConfidenceDocs) {
        Write-Host "  - $($doc.path)"
    }
    Write-Host "这些文档不能通过 /fst-promote 提升"
}

# 检查是否有文档状态为 DRAFT 但已过期
$expiredDocs = $documentStatus.documents | Where-Object { $_.type -eq "DRAFT" -and $_.expires -and (Get-Date $_.expires) -lt (Get-Date) }
if ($expiredDocs) {
    Write-Host "警告：以下文档已过期"
    foreach ($doc in $expiredDocs) {
        Write-Host "  - $($doc.path)"
    }
    Write-Host "请更新或归档这些文档"
}

# 检查是否有文档缺少迭代信息
$missingIterationDocs = $documentStatus.documents | Where-Object { -not $_.iteration }
if ($missingIterationDocs) {
    Write-Host "警告：以下文档缺少迭代信息"
    foreach ($doc in $missingIterationDocs) {
        Write-Host "  - $($doc.path)"
    }
    Write-Host "请补充迭代信息"
}

Write-Host "flowstate Document Status Check: 检查完成"
