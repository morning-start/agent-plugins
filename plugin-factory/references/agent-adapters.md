# Agent Adapters（平台适配器速查）

规范技能遵循 **Agent Skills 标准**（agentskills.io）。本文追踪 plugin-factory 渲染
插件时必须处理的逐端差异。标 ⚠️ 的项为**构建期（M1/M2）需对照线上文档或真实安装
核实**——未经核实不要依赖。

## 技能发现

| | Claude Code | pi | opencode | Codex / ChatGPT |
|---|---|---|---|---|
| 项目 | 插件 `skills/`、`.claude/skills/` | 包内 `skills/`（package.json 的 `pi.skills`）+ 扩展 `.pi/extensions/*.ts`（**无 per-harness skills 副本**） | 插件根 `skills/`（bootstrap 插件的 `config` 钩子运行时注册，superpowers 式；**无 per-harness skills 副本**） | 插件 `skills/`（`plugin.json` 的 `skills` 字段指向 `./skills/`） |
| 全局 | `~/.claude/skills/`、`~/.agents/skills/` | `~/.pi/agent/skills/`、`~/.agents/skills/` | `~/.config/opencode/skills/`、`~/.claude/skills/`、`~/.agents/skills/` | `~/.agents/plugins/marketplace.json` 个人级市场 |
| name == 目录 | 强制（标准） | 宽松（不强制） | v1 强制；⚠️ v2 用路径派生 ID，不强制 name==dir | 遵循 Agent Skills 标准（name==目录） |

## SKILL.md frontmatter

三者共有：`name`（必填）、`description`（必填）、`license`、`compatibility`、`metadata`。

- **name**: 1–64 字符，`^[a-z0-9]+(-[a-z0-9]+)*$`，无首尾/连续连字符。
- **description**: ≤ 1024 字符；只写触发条件，以 "Use when…" 开头。
- pi 额外: `allowed-tools`（空格分隔）、`disable-model-invocation`
  （系统提示中隐藏，经 `/skill:name` 调用）。

## Hooks

**2026-08-01 已核实 — 完整钉住规格见 [`hooks/`](hooks/)（索引 `hooks-reference.md`）。**

| | Claude Code | pi | opencode |
|---|---|---|---|
| 模型 | shell / HTTP / prompt 钩子，事件式（SessionStart、PreToolUse、PostToolUse、Stop…） | TypeScript **扩展**（`pi.on(...)` 事件） | TypeScript **插件**（hooks 对象） |
| 声明位置 | settings.json `hooks` 键 / 插件 manifest / 技能 frontmatter | `.pi/extensions/*.ts`、`package.json` 的 `pi.extensions`、settings `extensions` | `.opencode/plugins/*.ts`、`~/.config/opencode/plugins/`、npm `plugin` |
| 语言 | bash 或 PowerShell（`shell` 字段: `"bash"` / `"powershell"`） | TypeScript | TypeScript / JS |
| 阻断 / 修改 | stdout JSON 决策（`hookSpecificOutput`） | `return {block:true}` / 返回修改结果 | 修改 `output` / throw |

plugin-factory 规则：每个 hook 以规范 {event, action} 写一次、按端渲染——
Claude Code 用 **bash + PowerShell** 成对，opencode 用 `.ts` 插件，
pi/oh-my-pi 用 `.ts` 扩展（见 [`hooks/`](hooks/)）。

## Commands

| | Claude Code | pi | opencode |
|---|---|---|---|
| 位置 | `commands/*.md`（斜杠 `/name`） | `/skill:<name>` 强制调用；⚠️ 命令格式待定 | `.opencode/command/*.md` |
| Frontmatter | `description` | — | `description` |

## 打包 / 安装

**2026-08-01 已核实（2026-08-09 补 codex）— 逐端打包规格见 [`plugins/`](plugins/)（索引 `plugins-reference.md`）。**

| | Claude Code | pi | opencode | Codex / ChatGPT |
|---|---|---|---|---|
| Manifest | `.claude-plugin/plugin.json`（name/description/version） | `package.json` → `pi.skills` + `pi.extensions` | 无（TS/JS 插件模块 + opencode.json） | `.codex-plugin/plugin.json`（name/version/description/skills） |
| 结构 | 根部 `skills/`/`agents/`/`commands/` + `hooks/hooks.json` | `skills/` + `.pi/extensions/*.ts` | `.opencode/plugins/*.ts` + 根 `skills/`（config 钩子自注册） | `skills/` + 可选 `.app.json` / `.mcp.json` / `assets/` |
| 安装 | `/plugin install`、`claude --plugin-dir`、marketplace | `pi install git:github.com/<owner>/<repo>` | `.opencode/plugins/`、npm `plugin`（生态: opencode.ai/docs/ecosystem） | 本地市场 `.agents/plugins/marketplace.json`、`codex plugin marketplace add` |

+ **oh-my-pi (omp)**（Pi 的 fork）: 读取 `package.json` 的 `pi`/`omp` 字段
  (`extensions[]`/`skills`) — 见 [`plugins/oh-my-pi.md`](plugins/oh-my-pi.md)。

## 开放问题（跟踪中，不阻断 — 非 hooks 项）

- ⚠️ Claude Code 是否扫描 `.agents/skills/` 下的裸技能（插件目录之外）。
- ⚠️ skill-creator 的评测循环基于 Claude；用它评测 pi/opencode 技能尚未验证——
  M1 先验证再承诺跨端技能校验。

> 所有 hooks 问题已解决 — 见 `references/hooks/`（固化于 2026-08-01）。
