# Hooks Reference — 索引

> **Captured: 2026-08-01** · 三端 hooks 规格已按端拆分固化，本文件仅作总览。
> **Rule**: plugin-factory agents must use the per-harness files below for hook design —
> do **not** re-search the web. Re-verify the affected harness file only when that
> harness ships a breaking hooks change or an adapter wiring fails at runtime.

## Why this exists

Each harness implements "hooks" fundamentally differently. Before these specs were
pinned, every hook-design step risked a fresh web search with inconsistent results.
These files are the single source of truth for hooks in plugin-factory and in
generated plugins.

## Per-harness files

| Harness | File | Mechanism |
|---------|------|-----------|
| Claude Code | [`hooks/claude-code.md`](hooks/claude-code.md) | shell / HTTP / prompt hooks |
| opencode | [`hooks/opencode.md`](hooks/opencode.md) | TypeScript plugins (no shell hooks) |
| pi | [`hooks/pi.md`](hooks/pi.md) | TypeScript extensions |

## Summary — three different models

| Harness | Mechanism | Language | Declared where | Block / modify |
|---------|-----------|----------|----------------|----------------|
| Claude Code | shell / HTTP / prompt hooks | bash or PowerShell (`shell` field) | settings.json, plugin manifest, skill frontmatter | JSON decision on stdout |
| opencode | **plugins** (not shell hooks) | TypeScript / JS | `.opencode/plugins/*.{ts,js}` | mutate `output` / throw |
| pi | **extensions** | TypeScript | `.pi/extensions/*.ts` | return `{block:true}` / return modified result |

## Cross-harness rendering rule

Author each hook **once** as a canonical `{event, action}` spec (from the plugin's
component manifest) and render three ways:

- **Claude Code** → `.sh` + `.ps1` pair, wired via the `shell` field (`"bash"` / `"powershell"`).
- **opencode** → one `.ts` plugin under `.opencode/plugins/` (mutate `output` / throw).
- **pi** → `pi.on(...)` handlers in `.pi/extensions/<plugin-name>.ts`
  (return `{block:true}` / modified result).

## Re-verify cadence

- All per-harness files pinned **2026-08-01**, each with its own source URLs and
  per-harness re-verify rule.
- Update **only the affected harness file** (and this index's date) when re-verified —
  never blanket-search all three.
