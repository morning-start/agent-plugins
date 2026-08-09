# Plugins Reference — 索引

> **固化于：2026-08-01** · 多端插件打包格式已按端拆分固化，本文件仅作总览。
> **规则**：plugin-factory 的 agent 进行插件打包时必须使用下列分端文件——
> **不要重复搜网**。仅当某端发布破坏性格式变更时复核受影响的文件。

## 为什么存在

与 `hooks/`（hooks 如何工作）和 `agent-adapters.md`（技能发现）配合，这些文件
钉住了**插件项目如何打包与安装**的逐端规格，使生成的插件无需每次搜网即可正确。

## 分端文件

| 端 | 文件 | Manifest | 安装 |
|---------|------|----------|---------|
| Claude Code | [`plugins/claude-code.md`](plugins/claude-code.md) | `.claude-plugin/plugin.json`（name/description/version） | `/plugin install`、`claude --plugin-dir`、marketplace |
| opencode | [`plugins/opencode.md`](plugins/opencode.md) | 无（TS/JS 插件模块 + opencode.json） | `.opencode/plugins/`、npm `plugin`（生态: opencode.ai/docs/ecosystem） |
| pi | [`plugins/pi.md`](plugins/pi.md) | `package.json` → `pi.skills` / `pi.extensions` | `pi install git:github.com/<owner>/<repo>` |
| oh-my-pi (omp) | [`plugins/oh-my-pi.md`](plugins/oh-my-pi.md) | `package.json` → `pi`/`omp` 字段 (`extensions[]`/`skills`) | `omp plugin install git:...` / npm |
| Codex / ChatGPT | [`plugins/codex.md`](plugins/codex.md) | `.codex-plugin/plugin.json`（name/version/description/skills） | 本地市场（`.agents/plugins/marketplace.json`）、`codex plugin marketplace add` |

## 跨端打包规则（发布门禁）

1. 每个对外宣称的端都有对应 manifest（见上表各文件）。
2. 技能规范位置为根部 `skills/`（Agent Skills 标准）；opencode 需在
   `.opencode/skills/` 或 `.agents/skills/` 放一份副本（发现路径——`agent-adapters.md`）。
   Codex 用 `skills` 字段指向 `./skills/`，无需副本。
3. 双语 README（`README.md` + `README.zh-CN.md`）、`AGENTS.md`/`CLAUDE.md`、
   安装脚本（`install.sh` / `install.ps1`）。
4. **产物契约（T1 生效，`scripts/scaffold.mjs` 强制）**：一个 harness 只有在
   其全部必需产物渲染后才被声明支持——`templates/harnesses/<h>/` 只放该端的
   manifest、bootstrap 适配器与安装说明；共享文件在 `templates/shared/` 只存一份。
   未请求的 harness 不生成文件；`package.json` 的 `pi`/`omp` 字段只在对应产物
   实际存在时写入（不声明悬空路径）。生成项目自带 `scripts/verify.mjs` +
   `scripts/validate-structure.sh`/`.ps1`，`npm run validate` 立即可运行。

## 复核节奏

- 各分端文件固化于 **2026-08-01**，带来源 URL。
- 复核时只更新受影响的端文件（以及本索引的日期）。
- 固化当日已知缺口（各在其文件中标 ⚠️）：omp.sh docs 页 JS-rendered
  （oh-my-pi 规格已从 GitHub 固化 — 见 plugins/oh-my-pi.md）、Claude `plugins-reference`
  官方完整 schema（已从 ECC PLUGIN_SCHEMA_NOTES 吸收实测约束 — 见 plugins/claude-code.md）、
  pi `pi.extensions` 键形状。
