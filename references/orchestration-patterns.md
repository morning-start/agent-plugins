# Orchestration Patterns (技能编排模式库)

> **Captured: 2026-08-01** · Part of the 固化 references set.
> **Rule**: orchestration design for generated plugins follows this document — do not
> re-search the web for it. Re-verify only when patterns change or a harness bootstrap
> spec changes.

## Why this exists

Lifecycle management (`lifecycle-matrix.md`) handles **individual** skills
(split / merge / reorganize / port / retire). Orchestration handles **how a set of
skills composes**: discovery, triggering order, handoffs, and conflict avoidance.
A superpowers-level plugin is valuable mostly because of its orchestration
(brainstorm → plan → TDD → review), not its individual skills.

Two layers:

- **L1 — plugin-factory's own pipeline**: pf-intent → pf-design → pf-build → pf-verify →
  pf-release → pf-lifecycle, joined by handoff artifacts (PRD → component manifest →
  plugin → audit report). Routing lives in `commands/pf-*` and per-skill "route to X next"
  sections.
- **L2 — generated plugins' skills**: the composition of skills inside a generated plugin.

## Orchestration metadata (first-class manifest section)

pf-design emits an `orchestration` section in the component manifest:

```yaml
orchestration:
  entryPoints: [using-<plugin>]                   # bootstrap/entry skill (≤1 for methodology plugins)
  chains:
    - [brainstorming, writing-plans, tdd, review]  # ordered trigger chain
  handoffs:                                        # artifact protocol
    brainstorming: design.md
    writing-plans: plan.md
  conflicts: []                                    # mutually exclusive trigger domains
```

pf-build renders this into each skill's SKILL.md ("When to use" + "next steps → route
to X") and generates the bootstrap entry skill.

## Patterns

### 1. Chain (链式)

Sequential dependency; each skill hands an artifact to the next.

- Use: methodology plugins (brainstorm → plan → implement → review).
- Rules: every link consumes the previous artifact; no broken links
  (checked by the pf-lifecycle chain probe).

### 2. Star / hub (星形)

An entry/bootstrap skill routes to independent utility skills.

- Use: toolkits where each skill is standalone but discovered from one place.
- Bootstrap skill: `using-<plugin>` with a CSO description + per-harness
  session-start hook (hook specs: `references/hooks/`).

### 3. Bus / shared artifacts (总线)

Skills cooperate only through shared artifacts (PRD, manifest, audit), no direct links.

- Use: plugin-factory's own pipeline (L1).
- Rule: the artifact schema is the contract; validate at gates (pf-verify).

### 4. DAG (有向无环)

Parallel branches with dependencies; for complex methodologies
(e.g. subagent-driven development with parallel reviewers).

- Rule: no cycles; every skill reachable from an entry point.

## Trigger-chain design rules

1. **One entry point** for methodology plugins: a `using-<plugin>` bootstrap skill plus
   per-harness session-start hooks.
2. **Mutually exclusive trigger domains**: no two skills' CSO descriptions match the
   same scenario; declared overlaps live in `orchestration.conflicts` and are enforced
   by pf-verify.
3. **Handoff protocol**: every skill declares consumes/produces; pf-verify checks each
   chain link's artifact is produced upstream.
4. **Route at the end**: every skill ends with "After this, route to X" so the agent
   flows without re-deciding.

## Methodology-plugin case study (superpowers)

- Entry: `using-superpowers` bootstrap; activation via session-start hooks /
  CLAUDE.md / AGENTS.md.
- Chain: brainstorming → writing-plans → using-git-worktrees →
  subagent-driven-development → test-driven-development → requesting-code-review →
  finishing-a-development-branch.
- Each skill is independently triggerable (CSO), chained by artifacts
  (design doc → plan → worktree).

## Complexity threshold (extract pf-compose rule)

- pf-design owns orchestration design (M1).
- If pf-design exceeds ~300 lines, or orchestration guidance becomes more than 1/3 of
  its content, extract a `pf-compose` sub-skill (orchestration design only) per the
  lifecycle-matrix "too large → split" rule. Record the decision in the manifest's
  orchestration provenance.

## Re-verify cadence

- Pinned **2026-08-01**. Update only when a pattern changes or a harness bootstrap spec
  changes (cross-ref `references/hooks/`).
