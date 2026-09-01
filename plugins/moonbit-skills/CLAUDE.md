# CLAUDE.md — moonbit-skills

**Quick reference**: MoonBit-specific skill suite — design, scaffolding, test design, verification, and CI infrastructure. Harnesses: Claude Code, Cursor, Codex, Kimi, Gemini, OpenCode, Pi/OMP, Serena.

- Skills use the `moonbit-` prefix. Entry skill: `skills/using-moonbit-skills/SKILL.md`.
- Hooks ship bash + PowerShell + Nushell variants (`hooks/session-start`, `hooks/pre-commit.*`).
- Scope: **MoonBit 专属**能力（设计、骨架生成、测试设计、验证、CI 基础设施），**不承载**通用开发流程（实现、任务拆解、代码审查、发布、部署、性能、重构、git、文档、安全）。实现类流程由用户或外部流程插件（如 flowstate/fst）编排。
- Schemas live in `schemas/` (verification).
- References live in `references/` (commands, idioms, patterns, error-codes, orchestration).
- Dual manifest: root `plugin.json` = OMP, `.claude-plugin/plugin.json` = Claude Code.

## Available Skills (invoke via `Skill` tool)

- `moonbit-plan` — Requirements clarification, architecture & API design, module breakdown
- `moonbit-scaffold` — Generate project skeleton from approved design
- `moonbit-testing` — Test design, organization, iteration
- `moonbit-verify` — Three-tier verification (B/C/E gates)
- `moonbit-ci` — CI infrastructure (GitHub Actions + local hooks + branch protection)
- `using-moonbit-skills` — Entry router (alwaysApply)

## Key Rules

- Read `skills/using-moonbit-skills/SKILL.md` for intent routing before acting.
- MoonBit projects: check `moon.mod.json` / `moon.mod` for project root.
- Hooks auto-verify on `.mbt`/`.mbti` write/edit (format + type check).
- Three-tier testing: Basic (B, required), Custom (C, per-type), Enhanced (E, recommended).
- References in `references/` are knowledge base, not executable skills.
