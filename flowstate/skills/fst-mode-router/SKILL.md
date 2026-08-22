---
name: fst-mode-router
description: Use internally from fst-iterate to select and prepare the execution mode for each iteration phase. Routes requirements to spec, loop, graph, or todo without implementing code.
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-22
    updated: 2026-08-22
  keywords_zh: "方略路由, mode选择, spec, loop, graph, todo"
---

# fst-mode-router — 执行方略路由

> 这是 `fst-iterate` 的内部路由层，不是独立流程入口。它只决定每个 phase 如何执行，代码实现仍统一回到 `fst-iterate`。

## 职责

读取本轮需求清单，按需求特征为每个 phase 选择一个 mode，解释选择理由，取得用户确认，并生成供 `fst-iterate` 消费的 `ModePlan`。

## Iron Law

```
NO REQUIREMENT INVENTORY, NO MODE; NO USER CONFIRMATION, NO EXECUTION
```

- 必须先盘点范围说明书、已归档变更单和需求池条目。
- mode 是 phase 级策略；不同 phase 可以选择不同 mode。
- 路由层不写代码、不创建 Git 分支、不绕过 `fst-iterate` 的 plan/task 和批次 Gate。

## 执行流程

### 1. 收集输入

按以下优先级读取本轮需求：

1. 迭代范围说明书中的 REQ 条目
2. `fst-change` 已归档的 CR 条目
3. 需求池中排入本轮的条目

将条目分为新功能、需求改动、缺陷修复、技术债偿还，并标出验收标准、边界清晰度和依赖关系。

### 2. 选择 mode

| 需求特征 | mode | 判断依据 |
|---|---|---|
| 一句话能说清单点 diff | `todo` | 单点、低风险、无需探索或拆批 |
| 验收点清晰、每步可验证 | `spec` | 能为任务写客观 acceptance；默认选择 |
| 目标明确但边界模糊，需要反复逼近 | `loop` | 每轮有 bounded 工作和可验证 signal |
| 依赖复杂、跨模块、可并行 | `graph` | 能明确节点、deps 和节点 DoD |

拿不准时，优先 `spec`；若验收标准无法客观定义，改选 `loop`；若主要困难是依赖编排，改选 `graph`。简单任务只有在确实能用一句话描述 diff 时才选 `todo`。

### 3. 确认与交接

向用户展示每个 phase 的需求摘要、候选 mode、选择理由和主要风险，取得方略确认后输出：

```json
{
  "phase": "核心 API 开发",
  "mode": "spec",
  "reason": "验收点清晰，任务可逐项验证",
  "requirements": ["REQ-001", "CR-002"],
  "verification": ["unit_test", "smoke_test"],
  "reference": "references/agent-modes/spec.md"
}
```

一个迭代可以输出多个 `ModePlan`。`fst-iterate` 将其写入 plan/task，随后负责全部执行和验证。

## 停止条件

- 缺少范围说明书或变更单未归档：停止并转回 `fst-init` / `fst-change`。
- 验收标准、目标信号或依赖关系无法定义：向用户澄清，不猜测 mode。
- 用户未确认方略：停止在路由层，不进入代码执行。

## 关联最佳实践

- `references/agent-modes/spec.md`
- `references/agent-modes/goal.md`
- `references/agent-modes/graph.md`
- `references/agent-modes/todo.md`

## 输出

输出一个或多个已确认的 `ModePlan`，供 `fst-iterate` 生成 `docs/plan`、`docs/task` 并执行。

## 下一步

返回 `fst-iterate`，进入 plan/task 设计；本技能不得直接进入实现阶段。
