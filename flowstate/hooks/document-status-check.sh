#!/bin/bash
# flowstate Document Status Check Hook
# 检查文档状态的一致性

set -e

echo "flowstate Document Status Check: 检查文档状态..."

# 检查 document-status.json 是否存在
if [ ! -f ".agent-workplace/state/document-status.json" ]; then
  echo "警告：document-status.json 不存在"
  exit 0
fi

# 检查 jq 是否可用
if ! command -v jq &> /dev/null; then
  echo "警告：jq 未安装，无法检查文档状态"
  exit 0
fi

# 检查是否有文档状态为 REVIEW_NEEDED 但置信度低于 0.8
low_confidence=$(jq -r '.documents[] | select(.type == "REVIEW_NEEDED" and .confidence < 0.8) | .path' .agent-workplace/state/document-status.json 2>/dev/null)

if [ -n "$low_confidence" ]; then
  echo "警告：以下文档状态为 REVIEW_NEEDED 但置信度低于 0.8"
  echo "$low_confidence"
  echo "这些文档不能通过 /fst-promote 提升"
fi

# 检查是否有文档状态为 DRAFT 但已过期
expired=$(jq -r '.documents[] | select(.type == "DRAFT" and .expires < (now | todate)) | .path' .agent-workplace/state/document-status.json 2>/dev/null)

if [ -n "$expired" ]; then
  echo "警告：以下文档已过期"
  echo "$expired"
  echo "请更新或归档这些文档"
fi

# 检查是否有文档缺少迭代信息
missing_iteration=$(jq -r '.documents[] | select(.iteration == null or .iteration == "") | .path' .agent-workplace/state/document-status.json 2>/dev/null)

if [ -n "$missing_iteration" ]; then
  echo "警告：以下文档缺少迭代信息"
  echo "$missing_iteration"
  echo "请补充迭代信息"
fi

echo "flowstate Document Status Check: 检查完成"
exit 0
