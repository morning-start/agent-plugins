# Agent Adapters (平台适配器速查)

Canonical skills follow the **Agent Skills standard** (agentskills.io). This document
tracks the per-harness differences plugin-factory must handle when rendering a plugin.
Items marked ⚠️ are **to be verified during build** (M1/M2) against live harness docs
or a real install — do not rely on them without checking.

## Skill discovery

| | Claude Code | pi | opencode |
|---|---|---|---|
| Project | plugin `skills/`, `.claude/skills/` | `.pi/skills/`, `.agents/skills/`, package `skills/` (`pi.skills` in package.json) | `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` |
| Global | `~/.claude/skills/`, `~/.agents/skills/` | `~/.pi/agent/skills/`, `~/.agents/skills/` | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` |
| Name == dir | enforced (standard) | lenient (not enforced) | enforced in v1; ⚠️ v2 uses path-derived ID, does not enforce name==dir |

## SKILL.md frontmatter

Common (all three): `name` (required), `description` (required), `license`,
`compatibility`, `metadata`.

- **name**: 1–64 chars, `^[a-z0-9]+(-[a-z0-9]+)*$`, no leading/trailing/double hyphens.
- **description**: ≤ 1024 chars; triggers only, "Use when…".
- pi extras: `allowed-tools` (space-delimited), `disable-model-invocation`
  (hidden from system prompt, invoke via `/skill:name`).

## Hooks

| | Claude Code | pi | opencode |
|---|---|---|---|
| Model | event-based (PreToolUse, PostToolUse, Stop, SessionStart…) via settings/plugin config | ⚠️ extension hooks — verify API in M2 | ⚠️ config hooks in `opencode.json` — verify shape in M2 |
| Script style | `.sh` (or executable) | — | — |

plugin-factory rule: author every hook as **bash + PowerShell** pair + `hooks.json`
metadata; the adapter rewrites the wiring (event names / config keys) per harness.

## Commands

| | Claude Code | pi | opencode |
|---|---|---|---|
| Location | `commands/*.md` (slash `/name`) | `/skill:<name>` forcing; ⚠️ command format TBD | `.opencode/command/*.md` |
| Frontmatter | `description` | — | `description` |

## Packaging / install

| | Claude Code | pi | opencode |
|---|---|---|---|
| Manifest | `.claude-plugin/plugin.json` | `package.json` → `pi.skills` | `.opencode/opencode.json` |
| Install | `/plugin install` or marketplace (not in scope M0–M4) | `pi install git:github.com/<owner>/<repo>` | follow `.opencode/INSTALL.md`; ⚠️ catalog/index.json (v2, out of scope) |

## Open questions (tracked, not blocking)

- ⚠️ pi extension API for session-start bootstrap (`.pi/extensions/*.ts`).
- ⚠️ opencode hooks config shape in `opencode.json`.
- ⚠️ whether Claude Code scans `.agents/skills/` for bare skills (beyond plugin dir).
- ⚠️ skill-creator's eval loop is Claude-based; validating pi/opencode skills with it
  is unproven — verify in M1 before promising cross-harness skill validation.
