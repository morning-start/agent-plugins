# 技能骨架契约（Skill Skeleton Contract）

flowstate 的 4 个 fst-* 技能（`fst-init` / `fst-change` / `fst-iterate` / `fst-review`）
共享同一章节骨架：每个技能只填充自己独有的内容，章节结构与约定在此单点维护。

> 本文件的 `##` 章节标题即骨架声明：plugin-factory 生命周期探针据此把重复标题识别为
> **结构**（而非重复指导），与内置英文骨架标题（overview / workflow / outputs…）同机制。

## 职责

一句话说明本技能在流程中的职责：管哪些环节（Nx）、核心动作是什么。不展开细节。

## Iron Law

不可违反的契约，用代码块强调（`NO ... WITHOUT ...` 句式）；违反即流程破坏。
附 2~3 条展开解释。

## Red Flags — STOP and Re-evaluate

自查清单：列出违反本技能契约的典型行为；以 `**All of these mean: Stop. <动作> first.**`
收尾，给出止损动作。

## 停止条件

何时停止当前动作并转向追问澄清 / 其他技能 / 阻塞等待。防止越权与烂尾。

## 执行流程

编号步骤（### 1. / 2. / 3.…），本技能的核心操作；每步可执行、可验证，引用对应产出物 schema。

## 用户 vs Agent 分工

表格：| 谁 | 做什么 |，明确 Agent 起草/执行、用户确认/决策的边界（HITL）。

## 关联最佳实践

相关操作模式（`references/agent-modes/*.md`）与产出物 schema 的引用。

## 输出

结构化 JSON 产出物契约（字段与 `schemas/` 对齐），作为本技能的交接产物。

## 自检清单

技能执行完毕后的自查项（勾选式，与 Iron Law / Red Flags 呼应）：
确认关键步骤已执行、产出物已落对位置（定稿 `docs/`、过程态 `.agent-workplace/`）、
无违反契约的行为。

## 下一步

流程流转：完成后进入哪个技能 / 哪个闭环（如 N8→N4），保证编排可追踪。
