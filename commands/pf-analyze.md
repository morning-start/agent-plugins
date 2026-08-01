---
description: Analyze how existing skills should evolve — split, merge, reorganize, port, retire — via pure-structural analysis.
---

# /pf-analyze — Lifecycle analysis

Load and follow `skills/pf-lifecycle/SKILL.md` and the decision matrix in
`references/lifecycle-matrix.md`.

1. Run structural probes (size/depth, trigger overlap, duplicated guidance, hierarchy
   depth, multi-harness gaps, zombies, name collisions, version drift).
2. Produce severity-ranked {skill, signal, severity, action, impact} recommendations.
3. Present to the user; **wait for confirmation** before executing anything.
4. Route approved actions through `/pf-design` → `/pf-build` → `/pf-verify`.
