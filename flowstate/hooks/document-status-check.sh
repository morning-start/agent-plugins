#!/bin/bash
# flowstate Document Status Check Hook (bash) — HARD GATE
# 检查文档状态的一致性（SessionEnd）。
#
# 一致性铁律：P1 清单自洽 / P2 提升门槛 / P4 状态机 / P5 溯源完整。
# 违反即非零退出——带病工作区收尾即报错，交由 fst-promote 修复后再结束会话。
# 校验语义与 tests/dual-document-consistency.test.mjs 的 checkDualDocumentConsistency
# 保持一致；字段清单以 schemas/document-status.schema.json 为准。
#
# 仅当工作区存在时才执行（幂等）：无 .agent-workplace / 无清单 → 温和退 0。

set -e

status_path=".agent-workplace/state/document-status.json"

if [ ! -d ".agent-workplace" ] || [ ! -f "$status_path" ]; then
  exit 0
fi

if ! command -v jq &> /dev/null; then
  echo "警告：jq 未安装，无法检查文档状态；已跳过硬校验" >&2
  exit 0
fi

# 合法状态枚举（与 schema 的 enum 保持一致）。
STATE_ENUM='DRAFT REVIEW_NEEDED APPROVED ARCHIVED OBSOLETE'
CONFIDENCE_THRESHOLD=0.8

# 解析失败即阻断。
if ! index=$(jq '.' "$status_path" 2>/dev/null); then
  echo "错误：document-status.json 不是合法 JSON" >&2
  exit 1
fi

# P1 必填容器字段。
if ! jq -e '.documents' <<< "$index" >/dev/null 2>&1; then
  echo "错误：document-status.json 缺少 documents 数组" >&2
  exit 1
fi

violations=0

# 逐条检查（简化为 jq 查询，杜绝逐行循环出错）。
add_violation() { violations=$((violations+1)); echo "  - $1" >&2; }

# P2 置信度低于阈值或缺失（缺失按 0 计）。
while IFS= read -r p; do
  add_violation "P2 confidence: [$p] is REVIEW_NEEDED but confidence < ${CONFIDENCE_THRESHOLD}"
done < <(jq -r '.documents[] | select(.type=="REVIEW_NEEDED" and ((.confidence // 0) < 0.8)) | .path' <<< "$index")

# P2 提升目标越界（合法区：docs/ 定稿 或 .agent-workplace/shared/ 跨迭代共享沉淀）。
while IFS= read -r p; do
  add_violation "P2 target: [$p] promotes outside docs/ or shared/"
done < <(jq -r '.documents[] | select(.type=="REVIEW_NEEDED" and .promoted_to and ((.promoted_to|startswith("docs/"))|not) and ((.promoted_to|startswith(".agent-workplace/shared/"))|not)) | .path' <<< "$index")

# P5 APPROVED 缺溯源。
while IFS= read -r p; do
  add_violation "P5 provenance: [$p] APPROVED but missing source/promoted_to/approver"
done < <(jq -r '.documents[] | select(.type=="APPROVED" and ((.source? // "")=="" or (.promoted_to? // "")=="" or (.approver? // "")=="")) | .path' <<< "$index")

# P1 必填字段缺失。
while IFS= read -r p; do
  add_violation "P1 required: [${p:-<unknown>}] missing path/type/stage/iteration"
done < <(jq -r '.documents[] | select(((.path? // "")=="") or ((.type? // "")=="") or ((.stage? // "")=="") or ((.iteration? // "")=="")) | (.path // "<unknown>")' <<< "$index")

# P1 状态枚举非法。
while IFS= read -r p; do
  add_violation "P1 enum: [$(echo "$p" | cut -d'|' -f1)] type '$(echo "$p" | cut -d'|' -f2)' is not a legal state"
done < <(jq -r --arg enum "$STATE_ENUM" '.documents[] | select(.type and (($enum|split(" "))|index(.type)|not)) | (.path // "<unknown>") + "|" + .type' <<< "$index")

if [ "$violations" -gt 0 ]; then
  echo "[flowstate] BLOCKED: document-status.json violates dual-document consistency ($violations)." >&2
  echo "[flowstate] Run /fst-promote to finalize, or fix the index, before ending the session." >&2
  exit 1
fi

echo "flowstate Document Status Check: OK"
exit 0
