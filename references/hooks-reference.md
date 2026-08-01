# Hooks Reference — 索引

> **固化于：2026-08-01** · 三端 hooks 规格已按端拆分固化，本文件仅作总览。
> **规则**：plugin-factory 的 agent 进行 hook 设计时必须使用下列分端文件——
> **不要重复搜网**。仅当某端出现破坏性 hooks 变更或适配器接线运行时失败时，
> 复核受影响的文件。

## 为什么存在

各端对 "hooks" 的实现本质不同。在这些规格固化之前，每次 hook 设计都可能触发一次
新搜索、带来不一致结果。这些文件是 plugin-factory 与生成插件的 hooks 唯一事实来源。

## 分端文件

| 端 | 文件 | 机制 |
|---------|------|-----------|
| Claude Code | [`hooks/claude-code.md`](hooks/claude-code.md) | shell / HTTP / prompt 钩子 |
| opencode | [`hooks/opencode.md`](hooks/opencode.md) | TypeScript 插件（无 shell 钩子） |
| pi | [`hooks/pi.md`](hooks/pi.md) | TypeScript 扩展 |

## 总览——三种不同模型

| 端 | 机制 | 语言 | 声明位置 | 阻断 / 修改 |
|---------|-----------|----------|----------------|----------------|
| Claude Code | shell / HTTP / prompt 钩子 | bash 或 PowerShell（`shell` 字段） | settings.json、插件 manifest、技能 frontmatter | stdout 输出 JSON 决策 |
| opencode | **插件**（非 shell 钩子） | TypeScript / JS | `.opencode/plugins/*.{ts,js}` | 修改 `output` / throw |
| pi | **扩展** | TypeScript | `.pi/extensions/*.ts` | `return {block:true}` / 返回修改结果 |

## 跨端渲染规则

每个 hook 只写一次：规范的 `{event, action}`（来自插件构件清单），渲染三种：

- **Claude Code** → `.sh` + `.ps1` 成对，经 `shell` 字段接线（`"bash"` / `"powershell"`）。
- **opencode** → `.opencode/plugins/` 下每个事件组一个 `.ts` 插件
  （修改 `output` / throw）。
- **pi / oh-my-pi** → `.pi/extensions/<插件名>.ts` 中的 `pi.on(...)` 处理器
  （`return {block:true}` / 返回修改结果）。

## 复核节奏

- 各分端文件固化于 **2026-08-01**，各自带来源 URL 与按端复核规则。
- 复核时**只更新受影响的端文件**（以及本索引的日期）——绝不三端一并重搜。
