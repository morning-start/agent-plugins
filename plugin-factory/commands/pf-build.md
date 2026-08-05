---
description: Generate a standalone plugin project from a signed-off manifest; delegate skill authoring to skill-creator.
---

# /pf-build — Plugin build

Load and follow `skills/pf-build/SKILL.md`. Requirements:

- A signed-off component manifest must exist (or a Light-path verdict from `/pf-intent`).
- Create the standalone plugin project layout (`references/plugin-model.md`).
- For every skill: delegate to **skill-creator** (intent → draft → test cases → A/B
  eval → iterate); accept only after its evaluation passes. Never hand-write skills
  outside that loop.
- Render per-harness manifests and hooks/commands (bash + PowerShell pairs).

Rules: skills come from skill-creator, not from scratch; hooks are multi-shell.
