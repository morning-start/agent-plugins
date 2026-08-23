# tools/ — 可执行引擎容器

本目录是 plugin-factory **唯一的可执行逻辑容器**：所有引擎（`.mjs`）、跨平台
包装脚本（`.sh` / `.ps1`）、模块说明（每个模块自己的 `README.md`）与模块专属
数据（如 `routing/routing-table.json`、`design/evals.json`、`shared/schemas/`）
都收在这里。

**边界规则**：

- 技能（`skills/`）只**调用**这里的命令，不内联可执行逻辑。
- 根 `hooks/` 只做接线（调用 `tools/` 里的引擎），不放逻辑。
- 被多个技能共享的知识文档放 `references/`，不放 `tools/`。
- 生成插件的模板（`templates/`）保持独立扁平的 `scripts/` 布局，与 `tools/`
  解耦——`tools/` 只属于 plugin-factory 自身。

## 模块清单

| 模块 | 职责 | 入口 |
|------|------|------|
| `scaffold/` | 多 harness 插件项目生成器 | `scaffold.mjs` / `scaffold.sh` / `scaffold.ps1` |
| `verify/` | 结构 / harness / 生命周期校验引擎 + 生命周期报告 | `verify.mjs`、`validate-structure.*`、`validate-schema.mjs`、`lifecycle-report.mjs`、`lifecycle-probes.*`、`verify-server.mjs` |
| `routing/` | 意图路由（单一源 `routing-table.json`）+ 路由表渲染 | `route-intent.mjs`、`render-routing.mjs`、`routing-render.mjs` |
| `version/` | SemVer 版本核心 + 跨 manifest 提升 | `version.mjs`、`bump-version.sh/.ps1` |
| `release/` | 发布前门禁 + 打包 | `release-check.mjs`、`package-plugin.mjs` |
| `design/` | 设计期/维护期门禁脚本（冲突、复杂度、依赖、评测等） | `check-*.mjs`、`complexity.mjs`、`evals.mjs`、`recommend-bundles.mjs` |
| `bootstrap/` | 引导渲染器 + 管道状态 | `render-bootstrap.mjs`、`pipeline-state.mjs` |
| `shared/` | 跨模块共享资产（JSON Schema） | `schemas/` |

每个模块内 `README.md` 说明该模块的职责、文件与用法；修改某模块时先读它。
