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

迭代开发与持续迭代闭环的执行引导：**docs/plan（分 phase）→ 每 phase 选方略（spec/loop/graph）→ docs/task（分批，含验收标准）→ 按方略实现（Git 分支）→ 技术债 → 回顾 → 下轮排期**。小步快跑、动态补全，接受"需求永远做不全"。

## 方略（strategy）选择

每个 phase 在 `docs/plan` 中声明执行方略（`strategy` 字段，默认 `spec`），决定该 phase 内任务如何组织与验证：

| 方略 | 链条 | 定位 | 可验证 | 权威位置 |
|------|------|------|--------|---------|
| **spec**（默认） | `phase→task→spec` | 每个任务带验收标准（acceptance），逐项核销 | ✅ 任务完成 = 验收标准核销 | `modes/spec.md` |
| **loop** | `phase→loop` / `phase→task→loop` | 目标驱动循环：完成条件 → 每轮自评 → 达标停止 | ✅ 每轮有验证信号 | `modes/goal.md` |
| **graph** | `phase→graph` / `phase→task→graph` | 任务按依赖图编排：deps 拓扑推进、可并行 | ✅ 每节点 DoD 守卫 | `modes/graph.md` |

**选择规则**：
- 常规开发、每步可验收 → `spec`（默认，取代旧 todo 勾选清单）
- 目标明确、长跑、反复逼近 → `loop`
- 依赖复杂、可并行、按拓扑推进 → `graph`
- 简单一句话任务 → 直接做，用轻量 todo 清单跟踪，不进任何方略

## Iron Law

```
NO PLAN, NO CODE; NO BATCH, NO WORK; NO TEST, NO MERGE
```

- 开发前必须先写 `docs/plan`（分 phase：要做什么/为什么做）与 `docs/task`（分批：内聚 + 顺序）
- 未写 plan/task 不得动代码；分批后一批一验（构建/冒烟）
- **每批完成后必须通过基础测试（Schema 验证 + 构建 + 冒烟）才能进下一批**
- 一个功能/变更单 = 一个 Git 分支，分支干净合并，不污染主干
- 每批结束更新 docs/task 状态（Checkpoint），中断可续跑

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-iterate 契约：

- 不写 plan/task 直接开写代码
- 任务不分批、一把梭实现"所有功能"
- 未确认需求做了深度实现，而不是骨架开发
- 变更单未归档就开新分支 / 直接在主干上开发
- 批次未跑测试就进下一批（"先跳过，最后一起测"）
- 迭代结束不写回顾报告、不更新技术债清单

**All of these mean: Stop. Plan first, batch second, code third.**

## 停止条件

- 迭代范围说明书缺失 → 回 fst-init 补签
- 变更未归档 → 先走 fst-change
- 骨架冒烟不通过 → 阻塞，先修骨架

## 执行流程

### 1. 写 docs/plan（分 phase + 声明方略）

根据迭代范围，按**大阶段**拆分多个 phase（如：基础层 → 核心流程 → 交互/外围 → 打磨/上线准备）。每个 phase 写清：

- **要做什么**（目标与交付内容，关联需求 id）
- **为什么做**（业务/技术理由，防止"为做而做"）
- **方略**（`strategy`：`spec` / `loop` / `graph`，默认 `spec`，见上文「方略选择」表）

phase 之间体现依赖顺序：前一个 phase 是后一个的基础。

> 落点：docs/plan 为**过程态**，默认落 `.agent-workplace/docs/plan/`（不提交 git），
> 见 `fst-workplace`。

### 2. 细化 docs/task（分批 + 验收标准）

每个 phase 下的任务**分批次（batch）**，分批依据：

- **内聚程度**：功能相关、改动同一模块/同一层（数据层、API 层、页面层）的任务放同一批，减少上下文切换
- **实现顺序**：先做前置依赖（建表 → 接口 → 页面），后做上层；同批任务可连续完成、可整体验证

目标：批次间递进有序、每批可独立验证（编译/冒烟），避免任务零散跳跃。

按 phase 声明的方略组织任务：

- `spec`（默认）→ 每个任务带**验收标准（acceptance）**，完成 = 验收标准逐项核销
- `loop` → 该 phase/task 走目标循环（`state/goal.md` 完成条件 + 每轮自评）
- `graph` → 任务用 `deps` 标依赖边，按拓扑推进、可并行

> 落点：docs/task 为**过程态**，默认落 `.agent-workplace/docs/task/`（不提交 git），
> 见 `fst-workplace`。

### 3. 按方略实现（Git 分支开发，F4.2）

**分支规范**（示例，可配置）：

| 分支 | 命名 | 用途 |
|------|------|------|
| 主干 | `main` / `master` | 只接受合并，不直接开发 |
| 功能分支 | `feat/<变更单id或功能slug>`（如 `feat/CR-001`） | 对应当前批次/变更单的功能开发 |
| 修复分支 | `fix/<bugslug>` | 缺陷修复（配合 fst-change 紧急通道） |

流程：开分支 → 分批实现（提交信息带变更单 id）→ 分支内验证 → 合并回主干 → 合后清理。

**与 fst-change 衔接**：一个变更单（CR-xxx）= 一个功能分支；未归档的变更不得开新分支；紧急修复走 `fix/` 分支先修后补单。

### 3.5 批次验收 Gate（每批必过）

**每批完成后、进入下一批之前**，必须通过以下基础测试。Gate 未通过 → **阻塞，不得进入下一批**。

| # | 检查项 | 命令/方法 | 必须 |
|---|--------|----------|------|
| 1 | **产出物 Schema 验证** | `npm test`（JSON 合法性） | ✅ |
| 2 | **构建检查** | 项目能正常编译/构建（如有构建系统） | ✅ |
| 3 | **冒烟测试** | 核心链路能跑通（最小可运行路径） | ✅ |
| 4 | **自检清单** | 对照本批 task 的验收标准逐项确认 | ✅ |

**执行要点**：
- 一批一验，不要"最后一起测"——越早发现问题，修复成本越低
- Schema 验证确保产出物结构合法（`npm test` 跑 9 个 schema × valid/invalid fixture）
- 构建检查确保代码能编译通过（无语法错误、无缺失依赖）
- 冒烟测试确保核心链路通畅（不必测全功能，但主路径必须通）
- 自检清单确保本批 task 的验收标准已满足

**Gate 失败处理**：
- 立即修复，不进下一批
- 修复后重新跑 Gate
- 记录失败原因到技术债清单（如属妥协）

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

- **Spec 方略**（`.agent-workplace/modes/spec.md`）：默认方略，任务带验收标准逐项核销（可验证）
- **Loop 方略**（`.agent-workplace/modes/goal.md`）：目标循环（N8→N4 loop），完成条件 + 每轮自评
- **Graph 方略**（`.agent-workplace/modes/graph.md`）：任务依赖图，deps 拓扑推进、可并行
- 产出物 schema：5.6 技术债清单、5.7 迭代回顾报告、5.8 docs/plan（含 strategy 字段）、5.9 docs/task（含 acceptance 字段）

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

## 自检清单

- [ ] docs/plan 与 docs/task 已写（过程态落 `.agent-workplace/docs/`）
- [ ] 每个 phase 已声明方略（`strategy`：spec / loop / graph，默认 spec）
- [ ] 任务已分批（内聚 + 顺序），每批可独立验证
- [ ] spec 方略：任务带验收标准（acceptance），完成 = 逐项核销
- [ ] loop 方略：完成条件 + 每轮自评已写入 `state/goal.md`
- [ ] graph 方略：任务已用 `deps` 标依赖，按拓扑推进
- [ ] **每批完成后已通过批次验收 Gate（`npm test` + 构建 + 冒烟 + 自检）**
- [ ] 变更单已归档才开分支（一个变更单 = 一个功能分支）
- [ ] 技术债已登记（schema 5.6）
- [ ] 迭代回顾报告已生成（schema 5.7）

## 下一步

回顾完成 + 下轮范围确定 → 新迭代回到第 1 步（N8→N4 闭环）。迭代中任何变更 → fst-change；验收 → fst-review。
