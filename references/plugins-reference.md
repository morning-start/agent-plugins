# Plugins Reference — 索引

> **Captured: 2026-08-01** · 多端插件打包格式已按端拆分固化，本文件仅作总览。
> **Rule**: plugin-factory agents must use the per-harness files below for plugin
> packaging — do **not** re-search the web. Re-verify the affected harness file only on
> a breaking format change.

## Why this exists

Together with `hooks/` (how hooks work) and `agent-adapters.md` (skill discovery), these
files pin **how a plugin project is packaged and installed** per harness, so generated
plugins are correct without re-searching the web every time.

## Per-harness files

| Harness | File | Manifest | Install |
|---------|------|----------|---------|
| Claude Code | [`plugins/claude-code.md`](plugins/claude-code.md) | `.claude-plugin/plugin.json` (name/description/version) | `/plugin install`, `claude --plugin-dir`, marketplaces |
| opencode | [`plugins/opencode.md`](plugins/opencode.md) | none (TS/JS plugin modules + opencode.json) | `.opencode/plugins/`, npm `plugin`（生态: opencode.ai/docs/ecosystem） |
| pi | [`plugins/pi.md`](plugins/pi.md) | `package.json` → `pi.skills` / `pi.extensions` | `pi install git:github.com/<owner>/<repo>` |
| oh-my-pi (omp) | [`plugins/oh-my-pi.md`](plugins/oh-my-pi.md) | `package.json` → `pi`/`omp` 字段 (`extensions[]`/`skills`) | `omp plugin install git:...` / npm |

## Cross-harness packaging rules (release gate)

1. Per-harness manifest for every advertised harness (see files above).
2. Skills canonical in root `skills/` (Agent Skills standard); opencode needs a copy
   under `.opencode/skills/` or `.agents/skills/` (discovery paths — `agent-adapters.md`).
3. Bilingual README (`README.md` + `README.zh-CN.md`), `AGENTS.md`/`CLAUDE.md`,
   install scripts (`install.sh` / `install.ps1`).

## Re-verify cadence

- All per-harness files pinned **2026-08-01** with source URLs.
- Update only the affected harness file (and this index's date) when re-verified.
- Known gaps on capture day (each marked ⚠️ in its file): omp.sh docs 页 JS-rendered
  (oh-my-pi 规格已从 GitHub 固化 — 见 plugins/oh-my-pi.md), Claude `plugins-reference`
  full schema, pi `pi.extensions` key shape.
