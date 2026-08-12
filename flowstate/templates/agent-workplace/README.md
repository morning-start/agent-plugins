# .agent-workplace — Agent 私有工作区

> 本目录是 Agent 的私有工作区：**全部内容不提交 git**（根 `.gitignore` 一行 `.agent-workplace/`）。
> 要提交的内容从一开始就写在项目正式目录（`docs/` 等），本目录不存在"转正"路径。
> 详细规范见项目 `docs/agent-workplace.md`。

## 文档系统衔接（过程态 vs 正式 docs）

| 内容 | 位置 | 提交? |
|------|------|-------|
| PRD / ADR / requirements / scope / risk / glossary **定稿** | 正式 `docs/`（按 `documentation-structure.md` 组织） | ✅ |
| plan / task / spec 草稿 / decisions 草稿 / 脚本尝试 | 本目录（`.agent-workplace/`） | ❌ |
| change-request 归档定稿 | 正式 `docs/cr/` 或 `docs/CR.md` | ✅ |

## 两层架构（先看懂全局）

这个工作区（以及整个 flowstate）分两层，**互相解耦**：

| 层 | 是什么 | 变化频率 | 位置 |
|----|--------|---------|------|
| **流程框架（Graph）** | 整套开发流程的结构：F1~F9 的节点、边、循环、人工闸门、检查点 | 慢——符合现代开发哲学与现实条件，不随单一问题变化 | `modes/graph.md` + `state/` |
| **最佳实践库（modes/）** | 解决**单一问题**的方法：Plan / Spec / Task / Goal 等 | 快——随经验不断更新、可插拔 | `modes/*.md` |

**关系**：流程的每个步骤，都可以**选用合适的最佳实践**去执行——
N4 迭代开发可用 Task 模式、N1 立项可用 Spec 的访谈环节；换实践不改变流程框架，
更新实践不推翻流程。框架定"流程怎么走"，实践定"这一步怎么做更好"。

> 本项目是"现代化的流程性开发"：整个开发过程由原来的**人驱动**变为
> **Agent 配合人驱动**——Agent 承担执行与验证，人在 HITL 闸门处做关键决策，
> 大幅提高效率、减少人的负担。

## 目录地图

| 路径 | 用途 |
|------|------|
| `modes/graph.md` | **流程框架**：Agent 执行图（节点/边/循环/HITL/Checkpoint） |
| `modes/plan.md` | 最佳实践：Plan 模式（先探索后计划） |
| `modes/spec.md` | 最佳实践：Spec 模式（需求→计划→任务三链） |
| `modes/task.md` | 最佳实践：Task 模式（编号勾选、分批验证） |
| `modes/goal.md` | 最佳实践：Goal 模式（loop agent，自我评估续跑） |
| `docs/requirements.md` | 需求清单（Spec 模式起点） |
| `docs/plan/` | Plan 模式产物：PLAN.md（分 phase） |
| `docs/task/` | Task 模式产物：TASKS.md（分批次） |
| `docs/spec/` | Spec 模式产物：spec.md + tasks.md + checklist.md |
| `docs/decisions.md` | 决策记录（重要取舍、理由、否决项） |
| `scripts/` | 可执行实验脚本 / 测试桩 |
| `scratch/` | 一次性探索产物（`{YYYYMMDD}-{type}-{slug}`） |
| `research/` | 研究/调研缓存（外部资料、备选方案） |
| `report/` | 调研报告（Agent 调研结论、对比分析、研究报告） |
| `state/goal.md` | Goal 模式：目标 + 自我评估记录 |
| `state/checkpoint.json` | 断点续跑状态（图的 Checkpoint） |
| `state/artifacts.json` | 产物注册表（跨阶段追踪） |

## 流程框架（Graph）怎么走

- 流程 = 可执行状态图：节点是环节（F1~F9），边是 DoD 判据，闸门等人确认
- **未核销不能沿边前进**；**HITL 闸门必须等人**；**变更必须走 N5**；**断点必存**
- 完整规则见 `modes/graph.md` 与项目 `docs/PRD.md` §七

## 最佳实践怎么选（30 秒版）

- 简单任务（一句话能说清 diff）→ **直接做**，跳过计划
- 边界清晰、需确认步骤 → **Plan 模式**（`docs/plan/PLAN.md`，计划待确认才执行）
- 范围大、需对齐验收 → **Spec 模式**（`docs/spec/`：spec + tasks + checklist）
- 计划已定、按清单推进 → **Task 模式**（`docs/task/TASKS.md`，编号勾选、分批验证）
- 目标明确、自动长跑 → **Goal 模式**（`state/goal.md`，每轮自我评估，达标才停）

详细规则见 `modes/*.md`。
