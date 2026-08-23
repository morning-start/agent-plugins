# opencode — 适配速查

规范技能遵循 **Agent Skills 标准**（agentskills.io）。本文件是 opencode 一端的
适配差异速查；完整钉住规格见本目录 [`plugin.md`](plugin.md) 与 [`hooks.md`](hooks.md)。

## 技能发现

| | opencode |
|---|---|
| 项目 | 插件根 `skills/`（bootstrap 插件的 `config` 钩子运行时注册，superpowers 式；**无 per-harness skills 副本**） |
| 全局 | `~/.config/opencode/skills/`、`~/.claude/skills/`、`~/.agents/skills/` |
| name == 目录 | v1 强制；⚠️ v2 用路径派生 ID，不强制 name==dir |

## SKILL.md frontmatter

共有字段：`name`（必填）、`description`（必填）、`license`、`compatibility`、`metadata`。

- **name**: 1–64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`，无首尾/连续连字符。
- **description**: ≤ 1024 字符；只写触发条件，以 "Use when…" 开头。

## Hooks

TypeScript **插件**（hooks 对象）。声明位置：`.opencode/plugins/*.ts`、
`~/.config/opencode/plugins/`、npm `plugin`。
语言：TypeScript / JS。阻断 / 修改：修改 `output` / throw。
详见 [`hooks.md`](hooks.md)。

## Commands

| | opencode |
|---|---|
| 位置 | `.opencode/command/*.md` |
| Frontmatter | `description` |

## 打包 / 安装

| | opencode |
|---|---|
| Manifest | 无（TS/JS 插件模块 + opencode.json） |
| 结构 | `.opencode/plugins/*.ts` + 根 `skills/`（config 钩子自注册） |
| 安装 | `.opencode/plugins/`、npm `plugin`（生态: opencode.ai/docs/ecosystem） |

逐字段规格见 [`plugin.md`](plugin.md)。
