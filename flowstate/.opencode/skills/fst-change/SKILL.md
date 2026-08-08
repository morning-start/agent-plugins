---
name: fst-change
description: Use when any new requirement or requirement change appears (verbal, IM, email), or on production incidents. Handles change control: record original requirement, grade the change (minor/moderate/major/emergency), impact assessment, and hotfix fast-track with backfill (N5+N9 in the flowstate execution graph).
---

# fst-change — 变更管控（N5 变更 / N9 紧急通道）

## 职责

需求变更与线上事故的管控入口：**记录原文 → 变更分级 → 影响评估 → 审批排期 → 落地 → 归档**。杜绝口头需求无痕消失，防止范围蔓延与烂尾。

## The Iron Law

```
NO CHANGE WITHOUT A CHANGE RECORD
```

- 任何新需求/改动（口头、IM、邮件）必须**先记录需求原文**，否则不得改动代码
- 变更单未归档 + 未排期 → 不得开分支、不得动代码
- 重大变更必须人工审批后重启开发

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-change 契约：

- 用户口头说"改一下"，Agent 直接改代码而不记录变更单
- 替用户脑补需求原文，而不是逐字记录
- 变更分级由 Agent 单方面定死，未给用户确认机会
- 重大变更未暂停当前开发就直接改
- 线上事故不补录变更单（hotfix 也要 24h 内补）

**All of these mean: Stop. Record the change first.**

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
- 生成**变更申请单**（schema 5.3），归档后记录变更原因（可追溯）

### 5. 紧急通道（Hotfix，N9）

线上事故**不适用常规流程**，走直通车——**先修后补单**：

1. 立即评估影响面（Agent 协助，5 分钟内）
2. 修复 + 针对性验证
3. 上线后 **24 小时内补录变更申请单 + 影响评估 + 复盘**

### 6. 落地 + 同步

变更落地后，同步更新 PRD/设计文档；变更记录归档（与 fst-iterate 的 Git 分支联动：一个变更单 = 一个功能分支）。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 记录需求原文、建议分级、生成影响评估草稿、生成变更申请单、hotfix 影响面评估与补单提醒 |
| **用户** | 确认变更分级、审批重大变更、确认排期、处理紧急事故 |

## 关联最佳实践

- **Plan 模式**（`.agent-workplace/modes/plan.md`）：先探索后计划，影响评估待用户确认后执行
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

## 下一步

变更归档 + 排期确认 → 落地开发（fst-iterate）→ 变更针对性测试（fst-review）。紧急通道补单完成后同样进入验证流程。
