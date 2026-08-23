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
    updated: 2026-08-09
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

- Run the executable lifecycle probes (`tools/verify/verify.mjs lifecycle`, wrapped by
  `tools/verify/lifecycle-probes.sh` / `.ps1`) — pure-structural analysis from the
  decision matrix (`tools/verify/README.md`): size/depth, trigger
  overlap, duplicated guidance, hierarchy depth, multi-harness gaps, zombie
  detection, name collisions, version drift, broken handoffs, orphan skills,
  and missing entry skills.
- Produce {skill, signal, severity, action, impact} recommendations,
  severity-ranked; `--format json` for machine-readable output.
- Wait for user confirmation before any action executes.
- Route approved actions through `pf-design` / `pf-build` / `pf-verify` — no bypass.
- **Optimizing an existing plugin** (post-release maintenance): follow
  `references/plugin-optimization.md` — audit-first triage, P0/P1/P2 severity,
  and regression-test hardening. Lifecycle probes are its step 1, not the whole
  story: infrastructure output validity, harness-artifact parity claims, and
  routing-surface drift need executable checks beyond structural probes.

## Executable probes

```text
node tools/verify/verify.mjs lifecycle --root <dir>            # severity-ranked table
node tools/verify/verify.mjs lifecycle --root <dir> --format json
npm run lifecycle:report [-- --root <dir>] [-- --out <file>]   # markdown report
```

`lifecycle:report` (via `tools/verify/lifecycle-report.mjs`) renders the probe output as
a human-readable markdown report — run header, signal distribution, severity-ranked
findings, recommendations — so you never read the raw table by hand. It reuses the
same `runChecks` engine; `--out` writes the report to a file, otherwise it prints
to stdout.

Every matrix signal maps to a probe name in `tools/verify/README.md`:

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
`tools/verify/README.md` § 未来信号 → v2 roadmap. v1 must never fake
these probes: without their data sources wired, mark them "not enabled" (INFO).

## Cross-skill dependency analysis (executable: `tools/design/check-dependencies.mjs`)

```text
node tools/design/check-dependencies.mjs [--root <dir>] [--format table|json]
```

Builds the handoff/chain dependency graph (A references B when A's body routes
or hands off to B — same `collectSkillRefs` patterns as the `broken-handoff`
probe) and reports **endangered dependencies**: when skill B is `deprecated` or
`retired`, every skill A that depends on B gets a WARN
(`endangered-dependency`) — the dependent chain must be reworked before B is
cleaned up. A skill's retirement therefore never silently breaks its dependents.

## Bundle recommendation (two-stage: deterministic + qualitative)

For **a directory of standalone skills** ("how should these become plugins?"),
recommend groupings with two stages — heuristics first, LLM review second:

**Stage 1 — deterministic clustering (`tools/design/recommend-bundles.mjs`):**

```text
node tools/design/recommend-bundles.mjs --root <dir> [--threshold 0.18] [--min-bundle 2]
  [--output-md bundle-report.md] [--output-json bundle-report.json]
```

Jaccard similarity over skill name (2x weight) + description, connected
components above the threshold become candidate bundles; the rest are
singletons with a closest-neighbor reason. Same input → same output; the
threshold table (≥0.40 safe, 0.20–0.40 review, 0.12–0.20 needs review, <0.08
unrelated) is printed in the report.

**Stage 2 — qualitative review (`roles/bundle-advisor.md`):**

Feed the Stage-1 JSON to the `bundle-advisor` role (spawn pattern:
*Read `roles/bundle-advisor.md` and follow it.*). It opens each SKILL.md and
runs four coherence tests (role overlap, job-to-be-done, cold-start, trigger
context), then decides per candidate: `accept` / `split` / `merge` / `reject`,
names each plugin after its real role + work, and classifies every singleton
(`solo-plugin` / `merge-into:<bundle>` / `drop`).

Respect Iron Law 5 throughout: one plugin = one fixed business scenario,
single entry, one user goal. Approved bundles execute through
`pf-design` → `pf-build` → `pf-verify` (S4 reorganize path) — never bypass.

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
T2 complete — decision matrix probes are executable via `tools/verify/verify.mjs
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
