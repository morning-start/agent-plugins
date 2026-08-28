#!/bin/bash
# flowstate Post-Compact Hook (Claude Code PostCompact event)
# 会话压缩（checkpoint 边界）后自动生成待提升文档清单

set -e

echo "flowstate Post-Compact: 生成待提升文档清单..."

# 检查 document-status.json 是否存在
if [ ! -f ".agent-workplace/state/document-status.json" ]; then
  echo "警告：document-status.json 不存在，跳过"
  exit 0
fi

# 检查 jq 是否可用
if ! command -v jq &> /dev/null; then
  echo "警告：jq 未安装，无法生成待提升文档清单"
  exit 0
fi

# 生成待提升文档清单
cat > ".agent-workplace/state/ready-for-promotion.md" << EOF
# 待提升文档清单

生成时间：$(date -u +"%Y-%m-%dT%H:%M:%SZ")

## 当前迭代：$(jq -r '.current_iteration // "unknown"' .agent-workplace/state/current-iteration.json 2>/dev/null || echo "unknown")

### 调研阶段
$(jq -r '.documents[] | select(.stage == "investigation" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

### 需求阶段
$(jq -r '.documents[] | select(.stage == "requirements" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

### 设计阶段
$(jq -r '.documents[] | select(.stage == "design" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

### 开发阶段
$(jq -r '.documents[] | select(.stage == "development" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

### 测试阶段
$(jq -r '.documents[] | select(.stage == "testing" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

### 发布阶段
$(jq -r '.documents[] | select(.stage == "release" and .type == "REVIEW_NEEDED") | "- [ ] `\(.path)` (confidence: \(.confidence))"' .agent-workplace/state/document-status.json 2>/dev/null || echo "- 无")

---

**提升条件**：
- 文档状态必须为 \`REVIEW_NEEDED\`
- 置信度必须 >= 0.8
- 必须通过 \`/fst-promote\` 提升
- 必须经过 HITL 确认
EOF

echo "flowstate Post-Compact: 待提升文档清单已生成"
exit 0
