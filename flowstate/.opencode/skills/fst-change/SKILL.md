---
name: fst-change
description: Use when any new requirement or requirement change appears (verbal, IM, email), or on production incidents. Handles change control: record original requirement, grade the change (minor/moderate/major/emergency), impact assessment, and hotfix fast-track with backfill (N5+N9 in the flowstate execution graph).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-08
    updated: 2026-08-09
  keywords_zh: "变更管控, 变更分级, 影响评估, 紧急通道, Hotfix, 需求变更"
  tests: [tests/skill-contracts.test.mjs]
---

# fst-change — 变更管控（N5 变更 / N9 紧急通道）

> 章节骨架与约定见 `references/skill-structure.md`；下文仅保留 fst-change 独有内容。

## 职责

需求变更与线上事故的**规划与约束**入口：**记录原文 → 变更分级 → 影响评估 → 审批排期 → 归档**。杜绝口头需求无痕消失，防止范围蔓延与烂尾。

> **常规变更只规划约束，不做执行**。本技能产出变更申请单、影响评估、排期；具体实现全部交给 `fst-iterate`。唯一例外是 N9 线上 Hotfix：允许先修复阻断事故，之后必须补录并回到 `fst-review`。

## Iron Law

```
NO CHANGE WITHOUT A CHANGE RECORD
PLAN ONLY, NEVER EXECUTE — EXECUTION GOES TO fst-iterate
```

- 任何新需求/改动（口头、IM、邮件）必须**先记录需求原文**，否则不得改动代码
- 变更单未归档 + 未排期 → 不得开分支、不得动代码
- 重大变更必须人工审批后重启开发
- **常规变更只做规划与约束；N9 Hotfix 是唯一允许先执行的例外**

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-change 契约：

- 用户口头说"改一下"，Agent 直接改代码而不记录变更单
- 替用户脑补需求原文，而不是逐字记录
- 变更分级由 Agent 单方面定死，未给用户确认机会
- 重大变更未暂停当前开发就直接改
- 线上事故不补录变更单（hotfix 也要 24h 内补）
- **变更归档后自己动手写代码/分批实现（应交给 fst-iterate）**

**All of these mean: Stop. Record the change first. Execution belongs to fst-iterate.**

## 停止条件

- 需求描述不清 → 追问澄清，记录模糊点
- 变更超出当前迭代范围 → 记录并排入下轮（需求池），不插入当前迭代
- 变更涉及核心流程/结构重构 → 暂停开发，等二次评审

## 执行流程

### 1. 记录需求原文（立即，不改代码）

逐字记录：变更内容、提出人、渠道（口头/IM/邮件）、提出时间。不脑补、不转述美化。

### 2. 建议变更分级（AI 建议 + 用户确认）

| 分级 | 特征 | 处理 |
|------|------|------|
| 轻微 | 文案、状态微调 | 当前迭代直接修复 |
| 中度 | 规则微调、新增次要细节 | 记录存档、评估工时、本轮收尾或下轮实现 |
| 重大 | 核心流程改动、结构重构、业务逻辑推翻 | **暂停当前开发**，重新评估范围/工期/成本，二次评审后重启 |
| 紧急 | 线上事故/阻断性问题 | 走 Hotfix 直通车（见第 5 步） |

### 3. 生成变更影响评估草稿

- 是否改库 / 是否重构 / 是否影响旧功能
- 工时估算 / 返工量 / 对排期影响
- 影响点清单（供 fst-review 做变更针对性测试）

### 4. 人工确认 + 排期 + 归档

- 用户确认分级；重大变更人工审批
- 确认排期（本轮收尾 / 下轮 / 需求池）
- 生成**变更申请单**（schema 5.3）：草稿落 `.agent-workplace/`（过程态），
  归档定稿写正式 `docs/cr/` 或 `docs/CR.md`（提交）；落点规则见 `fst-workplace`

### 5. 紧急通道（Hotfix，N9）

线上事故**不适用常规流程**，走直通车——**先修后补单**：

1. 立即评估影响面（Agent 协助，5 分钟内）并建立紧急 checkpoint
2. 仅修复阻断事故 + 做针对性验证，不顺手扩展范围
3. 上线后 **24 小时内补录变更申请单 + 影响评估 + 复盘**，再交给 `fst-review`

### 6. 交接（不做执行，交给 fst-iterate）

变更单归档 + 排期确认后，本技能的工作**到此结束**：

- **变更单归档**：定稿写正式 `docs/cr/` 或 `docs/CR.md`（提交）
- **PRD/设计文档同步**：如果变更影响已有设计文档，在变更单中标注需同步的文档清单（由 fst-iterate 执行时一并更新）
- **交接信号**：变更单就绪 → 通知用户"变更已归档，可进入 fst-iterate 排期实现"

> ⚠️ 本技能**不写代码、不开分支、不做分批实现**。一个变更单 = 一个功能分支，分支开发由 `fst-iterate` 按方略执行。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 记录需求原文、建议分级、生成影响评估草稿、生成变更申请单、hotfix 影响面评估与补单提醒。**不做代码实现** |
| **用户** | 确认变更分级、审批重大变更、确认排期、处理紧急事故 |
| **fst-iterate** | 常规变更归档后的所有执行：方略设计、分批实现、Git 分支开发、验收 Gate |
| **N9 Hotfix** | 允许先修阻断事故；补单后必须进入 `fst-review`，不得绕过验收 |

## 关联最佳实践

- **先探索后计划**（变更影响评估）：探索现状 → 影响评估 → 计划待用户确认才执行（这是 fst-change 的内部方法、非独立模式；影响点清单供 `fst-review` 做变更针对性测试）
- 产出物 schema：5.3 变更申请单

## 输出

```json
{
  "status": "archived | scheduled | hotfix_backfilled | rejected",
  "change_id": "CR-001",
  "level": "minor | moderate | major | emergency",
  "impact": {
    "db_change": false,
    "refactor": false,
    "affected_features": ["..."]
  },
  "decision": "accepted | deferred | rejected | emergency",
  "approved_by": "user",
  "scheduled_iteration": "iter-004"
}
```

## 自检清单

- [ ] 需求原文已逐字记录（未脑补、未转述美化）
- [ ] 变更分级已由用户确认；重大变更已人工审批
- [ ] 变更申请单已生成：草稿落 `.agent-workplace/`，归档定稿落 `docs/cr/` 或 `docs/CR.md`
- [ ] Hotfix 已走直通车并在 24h 内补单
- [ ] 变更记录已归档，原因可追溯
- [ ] 未做任何代码实现（实现交给 fst-iterate）

## 下一步

- 常规变更：交接产物 **变更申请单 CR-xxx（已归档）**，信号「归档 + 排期确认」→ `fst-iterate`（按方略实现）→ `fst-review`（变更针对性测试）。
- 紧急通道（N9）：补单完成后直接交 `fst-review`，不绕过验收；后续非紧急扩展再由 `fst-change` 建常规 CR → `fst-iterate`。
