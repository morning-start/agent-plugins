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

**Verified 2026-08-01 — full pinned specs in [`hooks/`](hooks/) (index: `hooks-reference.md`).**

| | Claude Code | pi | opencode |
|---|---|---|---|
| Model | shell / HTTP / prompt hooks, event-based (SessionStart, PreToolUse, PostToolUse, Stop…) | TypeScript **extensions** (`pi.on(...)` events) | TypeScript **plugins** (hooks object) |
| Declared in | settings.json `hooks` key / plugin manifest / skill frontmatter | `.pi/extensions/*.ts`, `package.json` `pi.extensions`, settings `extensions` | `.opencode/plugins/*.ts`, `~/.config/opencode/plugins/`, npm `plugin` |
| Language | bash or PowerShell (`shell` field: `"bash"` / `"powershell"`) | TypeScript | TypeScript / JS |
| Block / modify | JSON decision on stdout (`hookSpecificOutput`) | `return {block:true}` / return modified result | mutate `output` / throw |

plugin-factory rule: author each hook once as a canonical {event, action} spec and
render per harness — **bash + PowerShell** pairs for Claude Code, a `.ts` plugin for
opencode, a `.ts` extension for pi (see [`hooks/`](hooks/)).

## Commands

| | Claude Code | pi | opencode |
|---|---|---|---|
| Location | `commands/*.md` (slash `/name`) | `/skill:<name>` forcing; ⚠️ command format TBD | `.opencode/command/*.md` |
| Frontmatter | `description` | — | `description` |

## Packaging / install

**Verified 2026-08-01 — per-harness packaging specs in [`plugins/`](plugins/) (index: `plugins-reference.md`).**

| | Claude Code | pi | opencode |
|---|---|---|---|
| Manifest | `.claude-plugin/plugin.json` (name/description/version) | `package.json` → `pi.skills` + `pi.extensions` | none (TS/JS plugin modules + opencode.json) |
| Structure | root `skills/`/`agents/`/`commands/` + `hooks/hooks.json` | `skills/` + `.pi/extensions/*.ts` | `.opencode/plugins/*.ts` |
| Install | `/plugin install`, `claude --plugin-dir`, marketplaces | `pi install git:github.com/<owner>/<repo>` | `.opencode/plugins/`, npm `plugin`（生态: opencode.ai/docs/ecosystem） |

+ **oh-my-pi (omp)**（Pi 的 fork）: 读取 `package.json` 的 `pi`/`omp` 字段
  (`extensions[]`/`skills`) — 见 [`plugins/oh-my-pi.md`](plugins/oh-my-pi.md)。

## Open questions (tracked, not blocking — non-hooks items)

- ⚠️ whether Claude Code scans `.agents/skills/` for bare skills (beyond plugin dir).
- ⚠️ skill-creator's eval loop is Claude-based; validating pi/opencode skills with it
  is unproven — verify in M1 before promising cross-harness skill validation.

> All hooks questions are resolved — see `hooks-reference.md` (captured 2026-08-01).
