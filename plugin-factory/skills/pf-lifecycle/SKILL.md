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
npm run lifecycle:report [-- --root <dir>] [-- --out <file>]   # markdown report
```

`lifecycle:report` (via `scripts/lifecycle-report.mjs`) renders the probe output as
a human-readable markdown report — run header, signal distribution, severity-ranked
findings, recommendations — so you never read the raw table by hand. It reuses the
same `runChecks` engine; `--out` writes the report to a file, otherwise it prints
to stdout.

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
The concrete v2 roadmap — probes (`trigger-frequency`, `eval-pass-rate`,
`feedback-themes`, `install-count`), data sources, and how each upgrades a
"structural suspicion" into evidence — lives in
`references/lifecycle-matrix.md` § 未来信号 → v2 roadmap. v1 must never fake
these probes: without their data sources wired, mark them "not enabled" (INFO).

## Cross-skill dependency analysis (executable: `scripts/check-dependencies.mjs`)

```text
node scripts/check-dependencies.mjs [--root <dir>] [--format table|json]
```

Builds the handoff/chain dependency graph (A references B when A's body routes
or hands off to B — same `collectSkillRefs` patterns as the `broken-handoff`
probe) and reports **endangered dependencies**: when skill B is `deprecated` or
`retired`, every skill A that depends on B gets a WARN
(`endangered-dependency`) — the dependent chain must be reworked before B is
cleaned up. A skill's retirement therefore never silently breaks its dependents.

## MCP exposure

The lifecycle probes are callable programmatically through the MCP server
(`mcp/verify-server.mjs`): `lifecycle_report(root)` returns the markdown report,
`verify(root, layers: ["orchestration"])` returns the machine-readable findings.

## Status


## Learnable Finding Routing (T-A3)

When verify outputs a finding with `learnable: true`, route to `pf-learn` for
knowledge capture. This is a WARN-level signal — not blocking, but worth
addressing to prevent recurring bugs.

The learnable signal is emitted by the following probes when the pattern is
systematic (not one-off):

| Signal | When learnable |
|--------|----------------|
| `broken-handoff` | Handoff gap appears in 2+ skills (routing convention missing) |
| `missing-entry-skill` | Entry pattern missing from template (not project-specific) |
| `lifecycle-status` | Lifecycle metadata missing systematically across skills |
| `trigger-overlap` | Overlap due to naming convention gap |

Do **not** mark one-off findings as learnable — log them to `scratch/` instead.
Systematic gaps that need a rule → learnable.
T2 complete — decision matrix probes are executable via `scripts/verify.mjs
lifecycle`; Bash and PowerShell wrappers only forward arguments.

## Iron Law

```
No runtime telemetry in v1 — structural signals only. Never fake v2 probes.
```

## Red Flags — STOP and Rethink

- Claiming v2 signals (trigger-frequency, eval-pass-rate) as v1 results
- Approving lifecycle actions without user confirmation
- Bypassing pf-design / pf-build / pf-verify

## 自检清单 (Post-routing Self-Check)

- [ ] All signals are v1 structural (no fake telemetry)
- [ ] Recommendations are severity-ranked
- [ ] User confirmed each action before execution
