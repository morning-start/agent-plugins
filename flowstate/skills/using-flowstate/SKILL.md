---
name: using-flowstate
description: Use when a project needs flowstate's development workflow — starting a new project, planning an iteration, handling requirement changes, or accepting/releasing work. Routes to the right fst-* skill based on the situation (entry point for pi/oh-my-pi/opencode bootstraps).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-08
    updated: 2026-08-09
  keywords_zh: "flowstate入口, 路由, 流程编排, 状态图, 引导"
---

# using-flowstate — 入口路由

flowstate 把项目开发全流程建模为可执行状态图（N1~N9）。按当前场景选择技能：

| 场景 | 技能 | 管哪些节点 |
|------|------|-----------|
| 新项目启动、需求模糊、"做个 X" | `fst-init` | N1 立项 / N2 冻结 / N3 设计 |
| 任何新需求/改动（口头/IM/邮件）、线上事故、缺陷修复 | `fst-change` | N5 变更 / N9 紧急 |
| 迭代完成、变更落地后、准备上线 | `fst-review` | N6 测试 / N7 灰度 |
| 迭代开始、迭代回顾、下轮排期 | `fst-iterate` | N4 开发 / N8 持续迭代 |
| 工作区初始化 / 落点判断 / 过程态管理 | `fst-workplace` | 基础能力（横切 N1~N9） |
| 一句话能说清 diff 的简单任务 | 直接做（todo 轻量清单，不进方略） | — |

`fst-mode-router` 是 `fst-iterate` 的内部路由技能，不作为用户场景入口单独选择——迭代内由 `fst-iterate` 调用它按需求特征选方略（spec/loop/graph/todo）并取得用户确认。

## 路由规则

- 新项目/需求模糊 → `fst-init`
- 迭代中任何变更/缺陷修复 → `fst-change`
- 验收/上线前 → `fst-review`
- 开发/回顾 → `fst-iterate`
- 一句话能说清 diff 的简单任务 → 直接做（todo 轻量清单），不单独进方略
- 拿不准 → 先 `fst-init` 锁底线，再按流转判据路由
- 需要工作区初始化 / 落点判断 / 过程态管理 → `fst-workplace`
  （其他技能只引用它，不重复定义工作区规则）
- 迭代内方略选择 → `fst-iterate` 内部调用 `fst-mode-router`（用户不直接触发）

## 核心原则（贯穿所有技能）

- **不追求一次性需求完备，只守住核心底线**
- **所有变更可追溯、可评估、不烂尾**
- **小步快跑、动态补全**；拒绝代码硬编排，图是逻辑蓝图，由 Agent 框架动态软编排驱动
- **工作区先行**：新项目首次使用由 `fst-init` 初始化（调用 `fst-workplace`）；
  过程态私有区不提交 git，落点规则见 `fst-workplace`
- **规划与执行分离**：`fst-change` 只做规划与约束（记录、分级、评估、审批、归档），不做代码实现；所有执行统一由 `fst-iterate` 按方略驱动

## 基础概念（30 秒版，单点维护）

flowstate 的核心概念各有**单一权威位置**，其他技能只引用、不重复定义：

| 概念 | 一句话 | 权威位置 |
|------|--------|---------|
| **.agent-workplace** | Agent 私有工作区：过程态草稿/脚本/state 全部不提交 git | `fst-workplace`（初始化与落点的唯一权威） |
| **Agent Graph（执行图）** | N1~N9 状态图：节点=环节、边=DoD、闸门=HITL、检查点=Checkpoint | `docs/PRD.md` §七 · `references/flow-graph.md`（流程框架） · `references/agent-modes/graph.md`（图模式） |
| **产出物 schema** | 5.1~5.9 产出物的 JSON 契约，可脚本校验 | `schemas/`（9 个 schema） |
| **DoD（完成定义）** | 验收逐项核销，全部 ✅ 才放行 | `fst-review` · schema 5.4 |

> 规则：**概念只在入口概述，细节在权威位置单点维护**——需要初始化/落点/字段/核销
> 细节时去对应权威位置；不要在多个技能里重复写同一规范。

## Iron Law

```
NO ROUTING, NO WORK; NO ENTRY, NO SKILL
```

- 未先路由到正确的 fst-* 技能 → 不得开始任何流程动作
- 新项目/需求模糊 → 必须先走 `fst-init`（锁底线），不得跳步
- 拿不准场景 → 回退到 `fst-init`，不猜

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 using-flowstate 契约：

- 跳过路由，直接凭"经验"调用某个 fst-* 技能
- 场景已明确（如线上事故）却不走 `fst-change` 紧急通道
- 项目无 `.agent-workplace/` 却开始写过程态产物（应先初始化）

**All of these mean: Stop. Route first, then execute.**

## 自检清单

- [ ] 已按场景路由到唯一的 fst-* 技能
- [ ] 拿不准时已回退到 `fst-init` 锁底线
- [ ] 入口提及的落点/初始化规则已指向 `fst-workplace`（未在本技能重复定义）
