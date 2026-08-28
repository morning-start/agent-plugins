---
name: fst-promote
description: Use when process documents in .agent-workplace are ready to be promoted to formal docs/. Acts as the "promotion gate" — the only controlled channel for content to flow from draft state to finalized state. Requires HITL (Human-in-the-Loop) confirmation before any content is written to docs/.
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.3.0
    created: 2026-08-26
    updated: 2026-08-28
  keywords_zh: "定稿, 提升, 闸门, 发布, 确认, 溯源, promote, gate"

  tests: [tests/skill-contracts.test.mjs]
  role: capability
  layer: cross-cutting
  invokes: [fst-workplace]
  handoffs_to: [docs]

  handoffs_from: [fst-init, fst-change, fst-iterate, fst-review, fst-research]
  owns: [promotion-gate, HITL]
---

# fst-promote — 定稿闸门（过程文档 → 定稿文档）

> 章节骨架与约定见 `references/skill-structure.md`；本技能是**双文档系统的核心闸门**——
> 过程文档流向定稿目录的**唯一受控通道**。**落点规则见 `fst-workplace`**。

## 职责

承担 flowstate 中「**过程文档 → 定稿文档**」的提升闭环：为文档定稿提供**受控通道**，
而不是让 Agent 直接修改正式 `docs/`。**过程文档**（`.agent-workplace/`）可以任意读写；
**定稿文档**（`docs/`）只有通过本技能才能写入，并且必须经过 HITL 确认。

## Iron Law

```
NO PROMOTION, NO FINALIZATION; NO HITL, NO COMMIT
```

- 未经本技能提升 → 不得直接修改 `docs/` 中的定稿文档
- 未经 HITL 确认 → 不得将过程文档写入 `docs/`
- 提升时必须注入溯源元数据（来源、版本、确认记录）
- 过程文档状态必须为 `REVIEW_NEEDED` 且置信度达标才能提升

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-promote 契约：

- 直接修改 `docs/` 中的定稿文档而不通过本技能
- 未经确认就把 `.agent-workplace/` 里的内容复制到 `docs/`
- 提升时未注入溯源元数据
- 提升未达到置信度阈值的过程文档
- 跳过 HITL 确认步骤

**All of these mean: Stop. Use the promotion gate.**

## 停止条件

- 过程文档状态不是 `REVIEW_NEEDED` → 先完成文档审核流程
- 过程文档置信度低于 0.8 → 先补充证据或标记为「待补充」
- 用户拒绝确认 → 记录拒绝理由，返回修改
- 目标定稿文档不存在 → 先创建目标文档或确认路径

## 执行流程

### 1. 校验提升条件（前置检查）

检查过程文档是否满足提升条件：

| 检查项 | 条件 | 不满足时的处理 |
|--------|------|---------------|
| 文档状态 | `status: REVIEW_NEEDED` | 提示先完成文档审核流程 |
| 置信度 | `confidence >= 0.8` | 提示补充证据或标记为「待补充」 |
| 依赖文档 | 所有依赖文档已存在 | 提示先完成依赖文档 |
| 目标路径 | `docs/` 中的目标路径有效 | 确认目标路径或创建 |

### 2. 渲染转换（格式化）

将过程文档**渲染**为定稿格式：

- **提取核心内容**：去除过程态元数据（status、confidence 等）
- **格式标准化**：按定稿文档格式要求调整（如 ADR 格式、PRD 章节结构）
- **注入溯源元数据**：在文档头部添加元数据块：

```yaml
---
source: .agent-workplace/iterations/iteration-XXX/investigation/fact-checks.md
source_version: 2026-08-26T10:30:00Z
source_confidence: 0.85
promoted_by: fst-promote
promoted_at: 2026-08-26T11:00:00Z
approver: user@example.com
approved_at: 2026-08-26T11:05:00Z
---
```

### 3. HITL 确认（强制暂停）

向用户展示：

1. **源文档摘要**：过程文档的核心内容
2. **目标文档预览**：提升后的定稿文档预览
3. **差异对比**：与现有定稿文档的差异（如果是更新）
4. **溯源信息**：来源、版本、置信度

**等待用户确认**后才能继续。

### 4. 写入定稿（确认后执行）

用户确认后：

1. 将渲染后的内容写入 `docs/` 目标路径
2. 更新过程文档状态为 `APPROVED`
3. 记录提升日志到 `iterations/current/meta/change-log.md`

### 5. 更新文档状态索引

更新 `state/document-status.json`：

```json
{
  "path": "docs/architecture.md",
  "type": "APPROVED",
  "stage": "design",
  "source": ".agent-workplace/iterations/iteration-XXX/design/tradeoffs/storage-choice.md",
  "promoted_at": "2026-08-26T11:00:00Z"
}
```

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 校验提升条件、渲染转换、生成预览、注入溯源元数据、写入定稿、更新状态索引 |
| **用户** | 审阅预览、确认提升、记录确认理由、拒绝时提供修改意见 |

## 关联最佳实践

- **工作区管理**（`fst-workplace`）：落点规则——过程态 `.agent-workplace/`、定稿 `docs/`
- **文档状态追踪**（`state/document-status.json`）：文档状态索引
- **变更日志**（`iterations/current/meta/change-log.md`）：提升记录
- **调研能力**（`fst-research`）：调研阶段的过程文档来源
- **立项能力**（`fst-init`）：立项阶段的过程文档来源
- **迭代能力**（`fst-iterate`）：开发阶段的过程文档来源

## 输出

```json
{
  "status": "promoted | pending_approval | rejected | blocked",
  "source": ".agent-workplace/iterations/iteration-XXX/investigation/fact-checks.md",
  "target": "docs/architecture.md",
  "promotion_type": "render",
  "metadata": {
    "source_version": "2026-08-26T10:30:00Z",
    "source_confidence": 0.85,
    "approver": "user@example.com",
    "approved_at": "2026-08-26T11:05:00Z"
  },
  "next": "caller skill (fst-init | fst-change | fst-iterate | fst-review)"
}
```

## 自检清单

- [ ] 过程文档状态为 `REVIEW_NEEDED` 且置信度 >= 0.8
- [ ] 目标路径在 `docs/` 中有效
- [ ] 已渲染转换为定稿格式
- [ ] 已注入溯源元数据（来源、版本、确认记录）
- [ ] 已获得 HITL 确认
- [ ] 已写入 `docs/` 目标路径
- [ ] 已更新过程文档状态为 `APPROVED`
- [ ] 已更新 `state/document-status.json`
- [ ] 已记录提升日志到 `iterations/current/meta/change-log.md`

## 下一步

提升完成 → 返回调用方技能继续生命周期流转：
立项 → fst-init；变更 → fst-change；迭代 → fst-iterate；验收 → fst-review。
若用户拒绝 → 返回修改意见，由调用方决定下一步。
