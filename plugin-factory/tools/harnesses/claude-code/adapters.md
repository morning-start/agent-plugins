# Claude Code — 适配速查

规范技能遵循 **Agent Skills 标准**（agentskills.io）。本文件是 Claude Code 一端的
适配差异速查；完整钉住规格见本目录 [`plugin.md`](plugin.md) 与 [`hooks.md`](hooks.md)。

## 技能发现

| | Claude Code |
|---|---|
| 项目 | 插件 `skills/`、`.claude/skills/` |
| 全局 | `~/.claude/skills/`、`~/.agents/skills/` |
| name == 目录 | 强制（标准） |

## SKILL.md frontmatter

共有字段：`name`（必填）、`description`（必填）、`license`、`compatibility`、`metadata`。

- **name**: 1–64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`，无首尾/连续连字符。
- **description**: ≤ 1024 字符；只写触发条件，以 "Use when…" 开头。

## Hooks

shell / HTTP / prompt 钩子，事件式（SessionStart、PreToolUse、PostToolUse、Stop…）。
声明位置：settings.json `hooks` 键 / 插件 manifest / 技能 frontmatter。
语言：bash 或 PowerShell（`shell` 字段: `"bash"` / `"powershell"`）。
阻断 / 修改：stdout JSON 决策（`hookSpecificOutput`）。
完整 29 事件列表见 [`hooks.md`](hooks.md)。

## Commands

| | Claude Code |
|---|---|
| 位置 | `commands/*.md`（斜杠 `/name`） |
| Frontmatter | `description` |

## 打包 / 安装

| | Claude Code |
|---|---|
| Manifest | `.claude-plugin/plugin.json`（name/description/version） |
| 结构 | 根部 `skills/`/`agents/`/`commands/` + `hooks/hooks.json` |
| 安装 | `/plugin install`、`claude --plugin-dir`、marketplace |

逐字段规格见 [`plugin.md`](plugin.md)。
