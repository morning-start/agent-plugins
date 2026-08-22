# CLAUDE.md — flowstate

**Quick reference**: Project development workflow plugin — 6-skill pipeline (using-flowstate router → fst-init / fst-change / fst-review / fst-iterate / fst-workplace). Harnesses: Claude Code, pi, oh-my-pi, opencode.

- Skills use the `fst-` prefix. Entry skill: `skills/using-flowstate/SKILL.md`.
- **Planning/execution split**: `fst-change` plans & constrains only (record → grade → assess → approve → archive), never writes code; `fst-iterate` is the single execution entry (strategy-driven). Hotfix (N9) is the only exception — fix first, backfill ≤24h.
- **Strategies (requirement-driven)**: `fst-iterate` picks per-phase strategy from this iteration's requirements — `spec` (default, acceptance-checked) / `loop` (goal-driven rounds) / `graph` (deps-DAG, parallel); one-liners bypass via plain todo.
- Hooks ship bash + PowerShell variants (`hooks/session-start.*`, `hooks/pre-commit.*`).
- `.agent-workplace/` is the agent's private workspace — never commit it (pre-commit gate blocks it).
- Schemas live in `schemas/` (9 files, draft-07, PRD §五).
- Dual manifest: root `plugin.json` = pi/omp, `.claude-plugin/plugin.json` = Claude Code.
- **Test**: `npm test` (schema validation, 9 schemas × valid/invalid fixtures).
  - Iron Law: `NO TEST, NO MERGE` — every batch must pass before proceeding.

Workspace conventions: see `docs/agent-workplace.md`.
Documentation structure: see `docs/documentation-structure.md`.
Full PRD: see `docs/PRD.md`.
