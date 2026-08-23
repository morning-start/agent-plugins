# Codex / ChatGPT — 适配速查

规范技能遵循 **Agent Skills 标准**（agentskills.io）。本文件是 Codex 一端的适配
差异速查；完整钉住规格见本目录 [`plugin.md`](plugin.md)。

## 技能发现

| | Codex / ChatGPT |
|---|---|
| 项目 | 插件 `skills/`（`plugin.json` 的 `skills` 字段指向 `./skills/`） |
| 全局 | `~/.agents/plugins/marketplace.json` 个人级市场 |
| name == 目录 | 遵循 Agent Skills 标准（name==目录） |

## SKILL.md frontmatter

共有字段：`name`（必填）、`description`（必填）、`license`、`compatibility`、`metadata`。

- **name**: 1–64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`，无首尾/连续连字符。
- **description**: ≤ 1024 字符；只写触发条件，以 "Use when…" 开头。

## Hooks

Codex 无 hooks 机制声明文件（不像 Claude 的 `hooks/hooks.json`）。

## 打包 / 安装

| | Codex / ChatGPT |
|---|---|
| Manifest | `.codex-plugin/plugin.json`（name/version/description/skills） |
| 结构 | `skills/` + 可选 `.app.json` / `.mcp.json` / `assets/` |
| 安装 | 本地市场 `.agents/plugins/marketplace.json`、`codex plugin marketplace add` |

逐字段规格见 [`plugin.md`](plugin.md)。
