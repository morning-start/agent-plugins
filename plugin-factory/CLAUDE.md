# CLAUDE.md — plugin-factory

Read [AGENTS.md](AGENTS.md) for all project conventions, design principles,
workflow phases, quality bars, and working guidelines.

**Quick reference**: This project creates agent plugins via a 6-phase pipeline
(Intent → Design → Build → Verify → Release → Lifecycle). Supported harnesses:
Claude Code, pi, opencode, oh-my-pi, Codex/ChatGPT.

- Run `npm test` to validate tests; `npm run verify` for the full audit engine.
- Skills use the `pf-` prefix. Never hand-write skill content — delegate to skill-creator.
- Every hook ships bash + PowerShell. Every advertised harness must have its complete artifact set.
- Routing data lives only in `scripts/routing-table.json` — never hand-edit the tables in SKILL.md.
