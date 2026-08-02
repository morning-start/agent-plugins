---
name: pf-lifecycle
description: Use when analyzing how existing skills should evolve, when deciding split, merge, reorganize, port, or retire actions, when a skill is too large, overlapping, or structurally unhealthy, when running pure-structural lifecycle analysis, or when routed from /pf-analyze.
tags: [pf, pf-lifecycle, plugin, lifecycle, analysis, refactor, split, merge]
metadata:
  prefix: pf
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-01
    updated: 2026-08-02
  keywords_zh: "生命周期, 技能拆分, 技能合并, 重组, 移植, 退役, 演进"
---

# pf-lifecycle — Lifecycle Analysis

## Overview

Analyzes a plugin/skill set **structurally** (files and metadata only — no runtime
telemetry in v1) and recommends lifecycle actions: **split / merge / reorganize /
port / retire / evolve**. It covers the plugin-level lifecycle that skill-creator's
single-skill loop does not.

## When to Use

- A skill is too large, too deep, or duplicated.
- Several skills overlap in trigger domain.
- A plugin advertises harnesses its skills do not cover.
- The user runs `/pf-analyze` or asks "how should these skills evolve?".

## Responsibilities (engine complete in T2)

- Run the executable lifecycle probes (`scripts/verify.mjs lifecycle`, wrapped by
  `scripts/lifecycle-probes.sh` / `.ps1`) — pure-structural analysis from the
  decision matrix (`references/lifecycle-matrix.md`): size/depth, trigger
  overlap, duplicated guidance, hierarchy depth, multi-harness gaps, zombie
  detection, name collisions, version drift, broken handoffs, orphan skills,
  and missing entry skills.
- Produce {skill, signal, severity, action, impact} recommendations,
  severity-ranked; `--format json` for machine-readable output.
- Wait for user confirmation before any action executes.
- Route approved actions through `pf-design` / `pf-build` / `pf-verify` — no bypass.

## Executable probes

```text
node scripts/verify.mjs lifecycle --root <dir>            # severity-ranked table
node scripts/verify.mjs lifecycle --root <dir> --format json
```

Every matrix signal maps to a probe name in `references/lifecycle-matrix.md`:

| Signal | Severity policy |
|--------|-----------------|
| `lifecycle-status` | WARN (missing) / INFO (deprecated/retired) |
| `skill-too-large` | WARN |
| `trigger-overlap` | WARN (FAIL on exact overlap) |
| `repeated-guidance` | WARN |
| `nested-skill-tree` | WARN |
| `harness-gap` | WARN |
| `zombie-skill` | WARN |
| `name-collision` | FAIL |
| `version-drift` | WARN |
| `broken-handoff` | FAIL |
| `orphan-skill` | WARN |
| `missing-entry-skill` | FAIL |

Runtime-only signals (trigger frequency, eval pass rate, user feedback themes,
install counts) remain out of scope for v1 and are documented as future signals.

## Status

T2 complete — decision matrix probes are executable via `scripts/verify.mjs
lifecycle`; Bash and PowerShell wrappers only forward arguments.
