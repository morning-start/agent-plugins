---
name: pf-design
description: Use when a signed-off PRD exists for a plugin, when planning which skills, hooks, commands, and rules a plugin needs, when designing skill orchestration (trigger chains, handoffs, entry points), when mapping a plugin to Claude Code/pi/opencode/oh-my-pi manifests, or when routed from /pf-design or pf-intent's full path. Produces the component manifest.
tags: [pf, pf-design, plugin, design, architecture, manifest, orchestration]
metadata:
  prefix: pf
  keywords_zh: "插件设计, 构件清单, 架构, 编排设计, 设计文档"
---

# pf-design — Plugin Design

## Overview

Turns a signed-off PRD into a **component manifest**: the exact list of skills, hooks,
commands, rules, per-harness manifest specs, and the **orchestration** section that
`pf-build` renders. No manifest, no scaffolding (Iron Law 1).

## When to Use

- A signed-off PRD exists and the complexity gate says Medium or Heavy.
- The user runs `/pf-design`.
- Skill orchestration must be designed (trigger chains / handoffs / entry points).
- The plugin needs architectural decisions worth recording (Heavy path → ADR).

Do **not** use when the gate says Light — route directly to `pf-build`.

## Prerequisites

- Signed-off one-page PRD from `pf-intent`.
- Complexity verdict (Medium or Heavy). Light → direct to `pf-build`.

## Workflow

### 1. Decompose the PRD into skills

One capability per skill; each skill follows the Agent Skills standard
(`name` == dir, CSO description ≤ 1024 chars, "Use when…").

Build a skill inventory:

| Skill | Capability (from PRD features) | Triggers | Consumes | Produces |
|-------|-------------------------------|----------|----------|----------|
| … | verb + object | CSO summary | artifact | artifact |

Every PRD feature must map to ≥ 1 skill; no skill without a mapped feature.

### 2. Decide hooks and commands per harness

- Hooks: which lifecycle events, per `references/hooks/` (event names and wiring differ
  per harness). Every hook = canonical {event, action} → rendered as bash + PowerShell
  pairs (Claude Code), a TS plugin (opencode), a TS extension (pi/oh-my-pi).
- Commands: which slash actions; list them per harness location
  (`commands/*.md`, `.opencode/command/*.md`, `registerCommand`).

### 3. Decide rules / agents / references

- Rules only where the agent must not re-derive behavior (not for mechanical checks —
  those become verifier scripts).
- References for shared docs that multiple skills read.

### 4. Design orchestration

Follow `references/orchestration-patterns.md`:

- **Entry points**: methodology plugins need exactly one bootstrap skill
  (`using-<plugin>`) + per-harness session-start hooks.
- **Chains**: ordered trigger chains with handoffs; each link's artifact must be
  produced upstream.
- **Conflicts**: trigger domains must be mutually exclusive; declare exceptions here.
- Every skill ends with "After this, route to X" (rendered by pf-build).

### 5. Emit the component manifest

```yaml
name: <plugin-name>
prefix: <abbr>                     # e.g. pf, moonbit
version: 0.1.0
harnesses: [claude-code, pi, opencode, oh-my-pi]
language:                            # from pf-intent, default tiered
  policy: tiered                     # tiered | english | native
  user_lang: zh-CN                   # 人维护层语言（用户语言）
  agent_lang: en                     # agent 执行层语言（默认英文）
components:
  skills: [{name, capability, triggers, consumes, produces}]
  hooks:   [{event, action, harnesses}]       # canonical, pre-render
  commands:[{name, purpose}]
  rules:   [..]
orchestration:
  entryPoints: [using-<plugin>]
  chains: [[skill-a, skill-b]]
  handoffs: {skill-a: artifact.md}
  conflicts: []
references: [..]
```

### 6. Heavy path: record ADRs

Architectural decisions (why this composition, why these harnesses) → `docs/ADR-*`
in the generated plugin (and in plugin-factory's own `docs/` when applicable).

## Acceptance (user sign-off — key decision)

- Every PRD feature maps to ≥ 1 skill; every skill has a CSO description.
- Every chain link's handoff artifact is produced upstream.
- Trigger domains are mutually exclusive (or declared in `conflicts`).
- Manifest lists per-harness manifest specs (see `references/plugins/`).
- Language policy from the PRD is carried into the manifest (`language` section).
- User confirms the manifest before `pf-build` runs.

## Complexity threshold (extract pf-compose)

If orchestration guidance makes this skill exceed ~300 lines or more than 1/3 of its
content, split out `pf-compose` (lifecycle-matrix "too large → split").

## Status

M1 complete — full design workflow above. Skeletons previously noted are resolved.
