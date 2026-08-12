# CLAUDE.md — moonbit-skills

**Quick reference**: MoonBit development skill suite — 18 skills covering plan→implement→verify→publish pipeline. Harnesses: Claude Code, Cursor, Codex, Kimi, Gemini, OpenCode, Pi/OMP, Serena.

- Skills use the `moonbit-` prefix. Entry skill: `skills/using-moonbit-skills/SKILL.md`.
- Hooks ship bash + PowerShell + Nushell variants (`hooks/session-start`, `hooks/pre-commit.*`).
- `.agent-workplace/` is the agent's private workspace — never commit it.
- Schemas live in `schemas/` (3 files: pipeline, verification, change-evidence).
- References live in `references/` (commands, idioms, patterns, error-codes, orchestration).
- Dual manifest: root `plugin.json` = OMP, `.claude-plugin/plugin.json` = Claude Code.

## Available Skills (invoke via `Skill` tool)

- `moonbit-init` — Project quality gate setup
- `moonbit-ci` — CI infrastructure (GitHub Actions + hooks)
- `moonbit-cd` — Deploy strategy, artifact management, rollback
- `moonbit-docs` — API docs, README, CHANGELOG, ADR
- `moonbit-security` — Threat modeling, dependency scanning
- `moonbit-plan` — Requirements, architecture, API design
- `moonbit-writing-plans` — Design→executable task breakdown
- `moonbit-scaffold` — Generate project skeleton from approved design
- `moonbit-implement` — TDD implementation (feature + bug fix modes)
- `moonbit-task` — Single-task TDD (RED→GREEN→VERIFY) + per-item acceptance
- `moonbit-testing` — Test design, organization, iteration
- `moonbit-perform` — Performance measurement + optimization
- `moonbit-refactor` — Technical debt, small-step refactoring
- `moonbit-git` — Feature branch workflow, commit contract, worktree management
- `moonbit-code-review` — Task/module-level code review
- `moonbit-verify` — Three-tier verification (B/C/E gates)
- `moonbit-evaluate` — Acceptance + release preparation
- `moonbit-learn` — Knowledge distillation from resolved issues

## Key Rules

- Read `skills/using-moonbit-skills/SKILL.md` for intent routing before acting.
- MoonBit projects: check `moon.mod.json` / `moon.mod` for project root.
- Hooks auto-verify on `.mbt`/`.mbti` write/edit (format + type check).
- Three-tier testing: Basic (B, required), Custom (C, per-type), Enhanced (E, recommended).
- References in `references/` are knowledge base, not executable skills.
