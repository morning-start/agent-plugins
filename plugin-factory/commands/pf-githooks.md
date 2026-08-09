---
description: Set up local git quality gates — commit-msg (Conventional Commits) and pre-commit (lint/structure) hooks for a plugin project.
---

# /pf-githooks — Git hooks

Load and follow `skills/pf-githooks/SKILL.md`. Workflow:

1. Decide where hooks live: tracked `githooks/` via `core.hooksPath` (every
   clone gets the same gates) or untracked `.git/hooks/`.
2. Write `commit-msg` (subject format `type(scope)!: subject`) and
   `pre-commit` (fast structural gate) — bash + PowerShell pairs.
3. **Never install hooks implicitly** — the user decides per-repo.
4. Document the hooks in the repo (`githooks/README.md` or `AGENTS.md`).

Rules: hooks reject, never rewrite; hooks enforce but do not replace CI.
