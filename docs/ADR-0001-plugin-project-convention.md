# ADR-0001 — Agent 插件项目公约

- **状态**: Accepted（已接受）
- **日期**: 2026-08-01
- **背景**: plugin-factory 自身仓库与每个生成插件必须采用真实 agent 插件项目
  使用的结构（参考 moonbit-skills、ECC、superpowers）。朴素的"技能包"布局
  （根 SKILL.md 路由器 + 嵌套 skills/）是技能仓库，不是 agent 插件项目。

## 决策

一个 agent 插件项目是**一个同时为多端打包插件的仓库**：

- **逐端 manifest**：`.claude-plugin/plugin.json`（Claude Code）、
  `package.json` 的 `pi.skills` + `.pi/extensions/*.ts`（pi/oh-my-pi）、
  `.opencode/opencode.json` + `.opencode/INSTALL.md`（opencode）。
- **根部共享内容**：`skills/`（每技能一目录，Agent Skills 标准）、`commands/`、
  `hooks/`（bash + PowerShell 成对 + `hooks.json`）、`scripts/`、`tests/`、
  `references/`、`docs/`。
- **项目说明**：`AGENTS.md` + `CLAUDE.md`。
- **文档**：英文 `README.md` + 中文 `README.zh-CN.md`。
- **安装**：`install.sh` / `install.ps1` 或逐端说明。

## 后果

- 技能按标准写一次、经适配器逐端渲染——不为每端分叉副本。
- hooks/commands 必须多 shell；每个 hook 提供 `.sh` + `.ps1`。
- 结构可验证：`scripts/validate-structure.*` 强制质量栏。

## 备选方案

- 技能包布局（否决：不是可安装的 agent 插件）。
- 单端插件（否决：用户要求 Claude Code / pi / opencode 多端）。
