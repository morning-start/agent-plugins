# 编排模式库（Orchestration Patterns）

> **固化于：2026-08-01** · references 固化集的一部分。
> **规则**：生成插件的编排设计遵循本文——不要重复搜网。仅当模式变更或某端引导
> 规格变更时复核。

## 为什么存在

生命周期管理（`lifecycle-matrix.md`）处理**单个**技能（拆分/合并/重组/移植/退役）。
编排处理**一组技能如何协作**：发现、触发顺序、交接产物、冲突避免。
superpowers 级插件的价值主要在编排（brainstorm → plan → TDD → review），
而非单个技能。

两个层次：

- **L1 — plugin-factory 自身管线**：pf-intent → pf-design → pf-build → pf-verify →
  pf-release → pf-lifecycle，靠交接产物衔接（PRD → 构件清单 → 插件 → 审计报告）。
  路由在 `commands/pf-*` 与各技能末尾的 "route to X next" 段落。
- **L2 — 生成插件的技能**：生成插件内部技能的组合。

## 编排元数据（构件清单一等字段）

pf-design 在构件清单中产出 `orchestration` 段：

```yaml
orchestration:
  entryPoints: [using-<plugin>]                   # 引导/入口技能（方法论插件 ≤1）
  chains:
    - [brainstorming, writing-plans, tdd, review]  # 有序触发链
  handoffs:                                        # 交接产物协议
    brainstorming: design.md
    writing-plans: plan.md
  conflicts: []                                    # 互斥触发域
```

pf-build 把它渲染进每个技能的 SKILL.md（"When to use" + "next steps → route to X"），
并生成引导入口技能。

## 模式

### 1. 链式（Chain）

顺序依赖；每个技能把产物交接给下一个。

- 适用：方法论插件（brainstorm → plan → implement → review）。
- 规则：每个链环消费上一环的产物；不允许断链（由 pf-lifecycle 链路探针检查）。

### 2. 星形（Star / hub）

入口/引导技能分发到相互独立的工具技能。

- 适用：各技能独立、但从一处发现的工具包。
- 引导技能：`using-<plugin>`，CSO 描述 + 各端 session-start 钩子
  （钩子规格：`references/hooks/`）。

### 3. 总线 / 共享产物（Bus）

技能只通过共享产物（PRD、构件清单、审计）协作，无直接链接。

- 适用：plugin-factory 自身管线（L1）。
- 规则：产物 schema 即契约；在门禁处校验（pf-verify）。

### 4. DAG（有向无环）

带依赖的并行分支；用于复杂方法论（如带并行评审者的子代理驱动开发）。

- 规则：无环；每个技能可从入口到达。

## 触发链设计规则

1. **方法论插件单一入口**：`using-<plugin>` 引导技能 + 各端 session-start 钩子。
2. **触发域互斥**：两个技能的 CSO 描述不得匹配同一场景；已声明的重叠放在
   `orchestration.conflicts`，由 pf-verify 强制。
3. **交接产物协议**：每个技能声明 consumes/produces；pf-verify 检查每个链环的
   产物确实由上游生产。
4. **末尾路由**：每个技能以 "After this, route to X" 结尾，agent 无需重新决策即可流转。

## 方法论插件案例（superpowers）

- 入口：`using-superpowers` 引导；经 session-start 钩子 / CLAUDE.md / AGENTS.md 激活。
- 链：brainstorming → writing-plans → using-git-worktrees →
  subagent-driven-development → test-driven-development → requesting-code-review →
  finishing-a-development-branch。
- 每个技能独立可触发（CSO），靠产物衔接（设计文档 → 计划 → worktree）。

## 复杂度阈值（pf-compose 拆出规则）

- pf-design 在 M1 承担编排设计。
- 若 pf-design 超过 ~300 行，或编排指导超过其内容的 1/3，按生命周期矩阵
  "过重→拆分" 拆出 `pf-compose` 子技能（仅编排设计）。决策记录在构件清单的
  orchestration 溯源中。

## 复核节奏

- 固化于 **2026-08-01**。仅当模式变更或某端引导规格变更时更新
  （交叉引用 `references/hooks/`）。
