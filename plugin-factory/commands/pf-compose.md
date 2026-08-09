---
description: Design how a plugin's skills cooperate — entry points, trigger chains, handoff artifacts, conflicts, and the using-<plugin> bootstrap (Chain/Star/Bus/DAG patterns).
---

# /pf-compose — Orchestration design

Load and follow `skills/pf-compose/SKILL.md`. Workflow:

1. Choose the pattern: Chain (sequential), Star (hub → independent tools),
   Bus (shared artifacts only), DAG (parallel branches).
2. Define orchestration metadata in the component manifest: `entryPoints`
   (≤1 bootstrap), `chains`, `handoffs` (consumes/produces), `conflicts`.
3. Design the `using-<plugin>` bootstrap entry (CSO description + per-harness
   session-start hooks) — one entry, no extra commands.
4. Enforce trigger-domain exclusivity; every skill ends with "route to X".

Rules: one plugin = one entry; no broken handoffs; lifecycle is a loop
(Operate → Maintain → Release → Analyze).
