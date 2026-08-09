---
name: fst-iterate
description: Use when an iteration starts, when planning or tasking out development work, or for iteration retrospectives. Handles the iteration loop: docs/plan (phases), docs/task (batches), Git-branch feature development, tech-debt tracking, and the continuous-iteration loop (N4+N8 in the flowstate execution graph).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-08
    updated: 2026-08-09
  keywords_zh: "迭代, 分批开发, Git分支, 技术债, 回顾, docs/plan, docs/task"
---

# fst-iterate — 迭代循环（N4 开发 / N8 持续迭代）

> 章节骨架与约定见 `references/skill-structure.md`；下文仅保留 fst-iterate 独有内容。

## 职责

迭代开发与持续迭代闭环的执行引导：**docs/plan（分 phase）→ docs/task（分批）→ 按批实现（Git 分支）→ 技术债 → 回顾 → 下轮排期**。小步快跑、动态补全，接受"需求永远做不全"。

## The Iron Law

```
NO PLAN, NO CODE; NO BATCH, NO WORK
```

- 开发前必须先写 `docs/plan`（分 phase：要做什么/为什么做）与 `docs/task`（分批：内聚 + 顺序）
- 未写 plan/task 不得动代码；分批后一批一验（构建/冒烟）
- 一个功能/变更单 = 一个 Git 分支，分支干净合并，不污染主干
- 每批结束更新 docs/task 状态（Checkpoint），中断可续跑

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-iterate 契约：

- 不写 plan/task 直接开写代码
- 任务不分批、一把梭实现"所有功能"
- 未确认需求做了深度实现，而不是骨架开发
- 变更单未归档就开新分支 / 直接在主干上开发
- 迭代结束不写回顾报告、不更新技术债清单

**All of these mean: Stop. Plan first, batch second, code third.**

## 停止条件

- 迭代范围说明书缺失 → 回 fst-init 补签
- 变更未归档 → 先走 fst-change
- 骨架冒烟不通过 → 阻塞，先修骨架

## 执行流程

### 1. 写 docs/plan（分 phase）

根据迭代范围，按**大阶段**拆分多个 phase（如：基础层 → 核心流程 → 交互/外围 → 打磨/上线准备）。每个 phase 写清：

- **要做什么**（目标与交付内容，关联需求 id）
- **为什么做**（业务/技术理由，防止"为做而做"）

phase 之间体现依赖顺序：前一个 phase 是后一个的基础。

### 2. 细化 docs/task（分批）

每个 phase 下的任务**分批次（batch）**，分批依据：

- **内聚程度**：功能相关、改动同一模块/同一层（数据层、API 层、页面层）的任务放同一批，减少上下文切换
- **实现顺序**：先做前置依赖（建表 → 接口 → 页面），后做上层；同批任务可连续完成、可整体验证

目标：批次间递进有序、每批可独立验证（编译/冒烟），避免任务零散跳跃。

### 3. 按批次实现（Git 分支开发，F4.2）

**分支规范**（示例，可配置）：

| 分支 | 命名 | 用途 |
|------|------|------|
| 主干 | `main` / `master` | 只接受合并，不直接开发 |
| 功能分支 | `feat/<变更单id或功能slug>`（如 `feat/CR-001`） | 对应当前批次/变更单的功能开发 |
| 修复分支 | `fix/<bugslug>` | 缺陷修复（配合 fst-change 紧急通道） |

流程：开分支 → 分批实现（提交信息带变更单 id）→ 分支内验证 → 合并回主干 → 合后清理。

**与 fst-change 衔接**：一个变更单（CR-xxx）= 一个功能分支；未归档的变更不得开新分支；紧急修复走 `fix/` 分支先修后补单。

### 4. 维护技术债清单

骨架开发、配置化妥协必然产生技术债——登记（schema 5.6）：妥协说明、为何妥协、计划偿还迭代。不登记就会越积越多。

### 5. 迭代末回顾（N8，持续迭代闭环）

生成**迭代回顾报告**（schema 5.7）：

- 交付统计：计划 vs 完成、DoD 核销率
- 变更统计：变更次数、分级分布、紧急次数
- 度量：完成率、返工率、需求池积压、技术债增减
- 风险与技术债：当前清单快照
- 下轮建议：需求池排序、范围建议

用户确认下轮迭代范围后，回到第 1 步——**持续迭代闭环（N8→N4）**。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 写 docs/plan（phase）、细化 docs/task（分批）、按批实现（Git 分支）、维护技术债、生成回顾报告、需求池排序建议 |
| **用户** | 确认 phase/批次划分、确认下轮迭代范围、迭代末验收 |

## 关联最佳实践

- **Goal 模式**（`.agent-workplace/modes/goal.md`）：迭代闭环（N8→N4 loop），设定完成条件、每轮自我评估
- **Task 模式**（`.agent-workplace/modes/task.md`）：分批执行（docs/task 勾选）
- 产出物 schema：5.6 技术债清单、5.7 迭代回顾报告、5.8 docs/plan、5.9 docs/task

## 输出

```json
{
  "status": "iteration_done | in_progress | blocked",
  "plan": { "phases": 4, "status": "completed" },
  "tasks": { "total": 12, "done": 12, "batches": 3 },
  "branches": { "merged": ["feat/CR-001"], "open": [] },
  "tech_debt": { "open": 2, "repaid": 1 },
  "retrospective": {
    "completion_rate": 0.9,
    "change_count": 3,
    "rework_rate": 0.05,
    "backlog_count": 12
  },
  "next_iteration": { "scope_confirmed": true, "items": ["..."] }
}
```

## 下一步

回顾完成 + 下轮范围确定 → 新迭代回到第 1 步（N8→N4 闭环）。迭代中任何变更 → fst-change；验收 → fst-review。
