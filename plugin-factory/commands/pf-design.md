---
description: Turn a signed-off PRD into a component manifest (skills, hooks, commands, rules) for a plugin.
---

# /pf-design — Plugin design

Load and follow `skills/pf-design/SKILL.md`. Requirements:

- A **signed-off PRD** must exist (from `/pf-intent`).
- Decompose features into skills (one capability per skill, Agent Skills standard).
- Decide hooks, commands, rules, agents per harness (`references/agent-adapters.md`).
- Produce the component manifest consumed by `pf-build`.
- Heavy path: record architectural decisions as ADRs.

Rules: no manifest → no build.
