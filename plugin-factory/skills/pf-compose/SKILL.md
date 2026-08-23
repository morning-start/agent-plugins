---
name: pf-compose
description: Use when designing how a plugin's skills cooperate, when deciding entry points and trigger chains, when defining orchestration metadata (entryPoints/chains/handoffs/conflicts), when choosing between Chain/Star/Bus/DAG patterns, when a plugin needs a using-<plugin> bootstrap skill, when pf-design's orchestration guidance grows beyond ~1/3 of its content, or when routed from pf-design (orchestration), /pf-compose, or using-pf (S7).
tags: [pf, pf-compose, orchestration, entry, chain, handoff, bootstrap, composition]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-09
    updated: 2026-08-09
  keywords_zh: "编排, 组合, 入口点, 触发链, 交接产物, 引导技能, 冲突"
---

# pf-compose — Orchestration Design (How Skills Cooperate)

## Overview

Lifecycle management (`pf-lifecycle`) handles **single** skills (split/merge/
reorganize/port/retire). Orchestration handles **how a group of skills
cooperates**: discovery, trigger order, handoff artifacts, conflict avoidance.
superpowers-class plugins get most of their value from orchestration
(brainstorm → plan → TDD → review), not from individual skills.

Two layers:

- **L1 — plugin-factory's own pipeline**: pf-intent → pf-design → pf-build →
  pf-verify → pf-release → pf-lifecycle, connected by handoff artifacts
  (PRD → manifest → plugin → audit report).
- **L2 — generated plugins**: how the generated plugin's internal skills
  compose.

## When to Use

- Designing a new plugin's orchestration (entry points, trigger chains,
  handoffs, conflicts).
- A plugin needs a `using-<plugin>` bootstrap skill + session-start hooks.
- Choosing between Chain / Star / Bus / DAG patterns.
- pf-design's orchestration guidance exceeds ~1/3 of its content (split
  trigger, per lifecycle-matrix "too large → split").
- Routed from pf-design (orchestration), `/pf-compose`, or using-pf (S7).

## Orchestration Metadata (component-manifest first-class field)

pf-design produces the `orchestration` section in the component manifest:

```yaml
orchestration:
  entryPoints: [using-<plugin>]                   # bootstrap/entry skill (methodology plugins ≤1)
  chains:
    - [brainstorming, writing-plans, tdd, review]  # ordered trigger chains
  handoffs:                                        # handoff artifact protocol
    brainstorming: design.md
    writing-plans: plan.md
  conflicts: []                                    # mutually exclusive trigger domains
```

pf-build renders it into every skill's SKILL.md ("When to use" + "next steps →
route to X") and generates the bootstrap entry skill.

## Patterns

### 1. Chain（链式）

Sequential dependencies; each skill hands its artifact to the next.

- 适用：方法论插件（brainstorm → plan → implement → review）。
- 规则：每个链环消费上一环的产物；不允许断链（由 pf-lifecycle 链路探针检查）。

### 2. Star（星形 / hub）

Entry/bootstrap skill distributes to mutually independent tool skills.

- 适用：各技能独立、但从一处发现的工具包。
- 引导技能：`using-<plugin>`，CSO 描述 + 各端 session-start 钩子
  （钩子规格：`references/harnesses/<harness>/hooks.md`）。

### 3. Bus（总线 / 共享产物）

Skills cooperate only through shared artifacts (PRD, manifest, audit), no
direct links.

- 适用：plugin-factory 自身管线（L1）。
- 规则：产物 schema 即契约；在门禁处校验（pf-verify）。

### 4. DAG（有向无环）

Dependent parallel branches; for complex methodologies (e.g. subagent-driven
development with parallel reviewers).

- 规则：无环；每个技能可从入口到达。

## Trigger-Chain Design Rules

1. **方法论插件单一入口**：`using-<plugin>` 引导技能 + 各端 session-start 钩子。
2. **触发域互斥**：两个技能的 CSO 描述不得匹配同一场景；已声明的重叠放在
   `orchestration.conflicts`，由 pf-verify 强制。
3. **交接产物协议**：每个技能声明 consumes/produces；pf-verify 检查每个链环的
   产物确实由上游生产。
4. **末尾路由**：每个技能以 "After this, route to X" 结尾，agent 无需重新决策
   即可流转。

## Lifecycle Is a Loop (not linear)

Creation is linear, but the plugin lifecycle is a cycle: after creation it
enters Operate → Maintain → Release. Analysis (`/pf-analyze`) runs anytime and
routes its recommendations to maintenance scenarios. **Single-skill retirement
is part of maintenance (S5)** — distinct from archiving the whole plugin.

Rules:

1. **单一入口 + 内部编排**（superpowers 模式）：统一入口是引导技能 `using-<plugin>`；
   不增加入口命令；`/pf-*` 阶段命令仅作专家直达通道。
2. **intent 两模式**：Full（创建）与 Change（变更）。
3. **每个变更都以 verify → release 收尾**——发布是每次变更的门，不是终点。
4. **发布后回到 Operate**，形成闭环。

## Outputs

- Orchestration metadata (entryPoints/chains/handoffs/conflicts) in the
  component manifest.
- A chosen pattern (Chain/Star/Bus/DAG) with rationale.
- `using-<plugin>` bootstrap entry design (single entry, no extra commands).

## Acceptance

- Methodology plugins have exactly one entry skill (`using-<plugin>`).
- Trigger domains are mutually exclusive; declared conflicts recorded.
- Every skill declares consumes/produces; chains are complete (no breaks).
- Every skill ends with "route to X" so flow continues without re-decision.

## Status

New (2026-08-09) — split out of `pf-design` + `references/orchestration-patterns.md`
when orchestration design became a standalone concern (the "extract
pf-compose" threshold was already documented in both).

## Iron Law

```
One plugin = one entry. Never add entry commands — route internally.
```

## Red Flags — STOP and Rethink

- Adding a second entry point to a methodology plugin
- Trigger domains overlapping without a declared conflict
- A chain with a broken handoff (missing artifact producer)

## 自检清单 (Post-routing Self-Check)

- [ ] Exactly one entry skill (`using-<plugin>`) for methodology plugins
- [ ] Trigger domains mutually exclusive (conflicts declared)
- [ ] Every chain link's artifact is produced upstream
- [ ] Every skill ends with "route to X"
