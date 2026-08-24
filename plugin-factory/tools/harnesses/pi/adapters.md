# pi — 适配速查

规范技能遵循 **Agent Skills 标准**（agentskills.io）。本文件是 pi 一端的适配差异
速查；完整钉住规格见本目录 [`plugin.md`](plugin.md) 与 [`hooks.md`](hooks.md)。

## 技能发现

| | pi |
|---|---|
| 项目 | 包内 `skills/`（package.json 的 `pi.skills`）+ 扩展 `.pi/extensions/*.ts`（**无 per-harness skills 副本**） |
| 全局 | `~/.pi/agent/skills/`、`~/.agents/skills/` |
| name == 目录 | 宽松（不强制） |

## SKILL.md frontmatter

共有字段：`name`（必填）、`description`（必填）、`license`、`compatibility`、`metadata`。

- **name**: 1–64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`，无首尾/连续连字符。
- **description**: ≤ 1024 字符；只写触发条件，以 "Use when…" 开头。
- pi 额外: `allowed-tools`（空格分隔）、`disable-model-invocation`
  （系统提示中隐藏，经 `/skill:name` 调用）。

## Hooks

TypeScript **扩展**（`pi.on(...)` 事件）。声明位置：`.pi/extensions/*.ts`、
`package.json` 的 `pi.extensions`、settings `extensions`。
语言：TypeScript。阻断 / 修改：`return {block:true}` / 返回修改结果。
详见 [`hooks.md`](hooks.md)。

## Commands

| | pi |
|---|---|
| 位置 | `/skill:<name>` 强制调用；⚠️ 命令格式待定 |
| Frontmatter | — |

## 打包 / 安装

| | pi |
|---|---|
| Manifest | `package.json` → `pi.skills` + `pi.extensions` |
| 结构 | `skills/` + `.pi/extensions/*.ts` |
| 安装 | `pi install git:github.com/<owner>/<repo>` |

逐字段规格见 [`plugin.md`](plugin.md)。
