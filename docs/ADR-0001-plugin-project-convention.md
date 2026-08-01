# ADR-0001 — Agent Plugin Project Convention

- **Status**: Accepted (2026-08-01)
- **Context**: plugin-factory's own repo and every generated plugin must follow a
  structure that real agent-plugin projects use (moonbit-skills, ECC, superpowers).
  The naive "skill bundle" layout (root SKILL.md router + nested skills/) is a skill
  repository, not an agent plugin project.

## Decision

An agent plugin project is **one repository that packages a plugin for multiple
harnesses at once**:

- **Per-harness manifests**: `.claude-plugin/plugin.json` (Claude Code),
  `package.json` with `pi.skills` + `.pi/extensions/*.ts` (pi),
  `.opencode/opencode.json` + `.opencode/INSTALL.md` (opencode).
- **Root shared content**: `skills/` (one dir per skill, Agent Skills standard),
  `commands/`, `hooks/` (bash + PowerShell pairs + `hooks.json`), `scripts/`,
  `tests/`, `references/`, `docs/`.
- **Project instructions**: `AGENTS.md` + `CLAUDE.md`.
- **Docs**: English `README.md` with a Chinese `README.zh-CN.md`.
- **Install**: `install.sh` / `install.ps1` or per-harness instructions.

## Consequences

- Skills are authored once (standard) and rendered per harness via adapters —
  no forked copies per harness.
- Hooks/commands must be multi-shell; every hook ships `.sh` + `.ps1`.
- Structure is verifiable: `scripts/validate-structure.*` enforces the bars.

## Alternatives considered

- Skill-bundle layout (rejected: not an installable agent plugin).
- Single-harness plugin (rejected: user requires Claude Code / pi / opencode).
