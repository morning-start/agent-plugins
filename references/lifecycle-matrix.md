# Lifecycle Matrix (生命周期决策矩阵)

**Scope (v1): pure-structural analysis only** — no runtime usage data, no telemetry.
Inputs are files and metadata the agent can read directly. Runtime signals (trigger
frequency, eval pass rates over time) are deferred; the matrix notes where they would
refine a recommendation.

skill-creator covers the **single-skill** create → test → iterate loop. plugin-factory
covers the **multi-skill / plugin-level** lifecycle that skill-creator does not:
split, merge, reorganize, port, retire, and version evolution.

## Signals → Recommendations

| Signal (pure structural) | How to measure | Recommendation |
|--------------------------|----------------|----------------|
| Skill too large (heavy+thick) | lines > ~300, heading depth > 3, many "see references/" links | **Split** into focused skills, or **reorganize**: extract `references/` |
| Overlapping trigger domains | two `description` fields match the same user intents | **Merge** into one skill; keep the union of scenarios |
| Coupled content / duplicated guidance | same steps or tables repeated across skills | **Reorganize**: extract shared `references/` |
| Hierarchy too deep | nested `skills/` > 2 levels, indirection | **Flatten** / reorganize into flat namespace |
| Multi-harness gap | skill only exists for one harness, plugin advertises more | **Port** via adapter render (see agent-adapters.md) |
| Zombie skill | no triggerable description / no references / no tests | **Retire** or **evolve** (v2 rewrite) |
| Name collisions | name == dir violated, or duplicate names across sources | **Rename** with project prefix |
| Version drift | root plugin version vs skill versions out of sync | **Align** versions (one source of truth) |
| Chain break | a chain link's handoff artifact is not produced upstream, or a chain references a missing skill | **Repair orchestration** (re-link / reorder) |
| Orphan skill | skill unreachable from any entry point or chain | **Reorganize**: add an entry link, or merge |
| Missing entry | methodology plugin without a bootstrap/entry skill | **Add** `using-<plugin>` entry skill |

Orchestration-health probes (chain break / orphan skill / missing entry) follow the
patterns in `references/orchestration-patterns.md`.

## Decision flow

1. **Analyze** — `pf-lifecycle` runs the structural probes above on a target
   plugin/skill (its own repo or a generated one).
2. **Recommend** — produce a table of {skill, signal, severity, action, impact},
   ordered by severity.
3. **Confirm** — the user approves each recommendation (key decision).
4. **Execute** — approved actions run through `pf-design`/`pf-build`/`pf-verify`
   so nothing bypasses the quality bars.

## Evolution (v1 → v2)

Version bumps are SemVer; each release records in CHANGELOG which lifecycle action
drove it (split/merge/reorganize/port/retire). The plugin itself is dogfooded: the
`pf-*` skills may be split/reorganized using this same matrix (see M4).

## Future signals (out of scope for v1)

Trigger frequency, eval pass rates, user feedback themes, install counts. When these
exist, they upgrade recommendations from structural suspicion to evidence.
