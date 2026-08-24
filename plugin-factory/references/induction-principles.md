# 归纳原则（Induction Principles）— 结构维护方法论

> 本文是 plugin-factory 的**结构维护方法论**：记录"如何把相同场景的内容归纳到
> 一起"，作为一切新增/重构/整理的判据。它来自 2026-08 的两次大规模整理
> （tools/ 收敛、references/ 按 harness 重组），把当时的做法提炼成可复用的规则。
> 当你在本仓库（或生成插件）里新增、移动、删除任何内容前，先读本文。

## 为什么存在

插件是 skill、MCP、hooks、脚本、模板、文档等**所有内容的集合**——是一个重且
复杂的环境。文件一旦散落，代价是累积的：引用断裂、内容重复、改一处漏一处、
新 agent 无从下手。因此**结构性、可读性、"唯一源"**是本插件的三条设计理念，
归纳原则是让这三条落地的方法。

## 归纳方法（怎么想）

### 1. 按场景归纳，不按功能堆叠

判断一个文件该放哪里，先问"它服务的**场景**是什么"，而不是"它属于哪一类"。

- 反例（旧结构）：`references/plugins/`（打包功能）、`references/hooks/`
  （钩子功能）、`agent-adapters.md`（适配功能）——同一 harness 的知识被
  按功能拆到三个地方。
- 正例（新结构）：`tools/harnesses/<h>/` 一个目录收编该端**全部**规格
  （plugin.md + hooks.md + adapters.md）——同场景同家。

### 2. 单一容器收敛

同类的可执行逻辑收敛到一个容器，容器内按模块分目录，每模块自带说明。

- 反例：scripts/、commands/、references/ 三处都放"可执行逻辑 + 说明"，
  顶层散落 schemas/、evals/、mcp/。
- 正例：`tools/<模块>/` 一个容器；每模块 = 脚本 + README + 模块内容
  （如 `tools/verify/` 收 verify.mjs、validate-structure.*、lifecycle-*、
  verify-server.mjs + README）。

### 3. 索引吸收（index absorption）

两层索引压成一层：把"总览索引"吸收进容器的 README，只留"分端/分模块文件"。

- 反例：`plugins-reference.md` + `plugins/`、`hooks-reference.md` + `hooks/`
  ——索引和内容两层，改内容忘改索引。
- 正例：`references/README.md` 一个索引表 + `harnesses/<h>/` 内容文件；
  跨端渲染/打包规则直接写进 README。

### 4. 死知识下沉，活知识内联

- **references/ 只放"被技能用到、但是死知识"的内容**：偶尔用、不常用、或
  特别长特别多的规格性文档。技能只引用不内联。
- **技能内放流程编排与最重要的知识**：怎么做、什么时候做、判据是什么。
- 判定：一段知识如果每次任务都会用到 → 技能内；如果偶尔查、或长到技能
  装不下 → references/。

### 5. 唯一源（single source of truth）

每条事实只有一个权威位置，其它地方要么引用、要么由它渲染，并配漂移检查兜底。

- 路由：`tools/routing/routing-table.json` 是唯一源 →
  `render-routing.mjs` 渲染进 `using-pf/SKILL.md` → verify 的
  `routing-table-drift` 检查防止漂移。
- Schema：`tools/shared/schemas/` 单一权威，门禁校验强制对齐。
- 版本：`.version-bump.json` 声明哪些文件参与提升，`version.mjs` 统一读写。

### 6. 移动必接线

移动/重命名后，引用链必须全局同步，且以残留扫描 + 全量测试收尾：

1. `git mv` 保留历史；
2. `search_replace` 全局更新引用（技能、hooks、scripts、roles、docs、tests）；
3. 残留扫描（grep 旧路径前缀，CHANGELOG 历史记录除外）；
4. 全量 `node --test` + `verify.mjs --root .` 确认无回归。

### 7. 边界规则显式化

每个容器/目录在 README 里写明**边界**："什么该放这里、什么不该"。
新 agent 无需猜——按边界规则归位即可（如 `tools/*/README.md` 的边界节、
`references/README.md` 的放置规则）。

## 优化方案回顾（2026-08 两次整理）

### 第一轮：tools/ 收敛（scripts/commands/references/tests 四类混乱）

| 动作 | 内容 |
|------|------|
| 建容器 | `tools/` 按 7 个模块收敛（scaffold/verify/routing/version/release/design/bootstrap）+ shared/ |
| 删冗余 | `commands/` 整体删除（无任何技能引用），plugin.json 摘掉 commands 声明 |
| 下沉文档 | `plugin-model.md` → scaffold/README、`lifecycle-matrix.md` → verify/README，原文件删除 |
| 归位 | schemas/ → tools/shared/、evals/ → tools/design/、mcp/verify-server.mjs → tools/verify/ |
| 对齐测试 | tests/ 1:1 对齐模块：design 吸收 complexity+evals、bootstrap 吸收 pipeline、version 独立成目录 |
| 接线 | 12 技能、6 hooks、npm scripts、3 roles、AGENTS.md、docs、tests import 全部更新 |
| 顺带修复 | release-check 动态 import 漏改、recommend-bundles 失效引用、CRLF 行尾问题（.gitattributes 强制 *.sh 为 LF） |

### 第二轮：references/ 按 harness 重组

| 动作 | 内容 |
|------|------|
| 按端归位 | `plugins/<h>.md` → `harnesses/<h>/plugin.md`、`hooks/<h>.md` → `harnesses/<h>/hooks.md`（git mv 保历史） |
| 拆分速查 | `agent-adapters.md` 按端拆成 5 份 `adapters.md`，原文件删除 |
| 索引吸收 | `plugins-reference.md` / `hooks-reference.md` 吸收进 README（跨端渲染/打包规则），删除 |
| 研究区 | `plugin-creators.md` → `.agent-workplace/research/`（背景研究不提交 git） |
| 接线 + 验证 | 全引用更新、残留扫描、162 测试 + verify 全绿 |

## 优化特点

| 特点 | 说明 |
|------|------|
| **结构性** | 一切内容有明确的家：可执行逻辑 → tools/<模块>/；harness 规格 → tools/harnesses/<h>/；跨端死知识 → references/ 根；流程 → 技能内；背景研究 → .agent-workplace/research/ |
| **可读性** | 每模块/目录有 README 入口与索引表；路径可预期（`tools/harnesses/<h>/plugin.md` 一看就懂）；新 agent 靠边界规则即可归位 |
| **唯一源** | 不复制内容；渲染产物不手编；漂移检查兜底（routing-table-drift 等） |
| **可验证** | 每次移动 = git mv + search_replace + 残留扫描 + 全量测试；结构问题在 CI/verify 阶段暴露，不在使用期爆发 |
| **最小动作** | 只搬位置、不重写内容；`git mv` 保留历史；改动集中在一个容器内完成 |

## 使用规则（内化到插件使用过程）

在 plugin-factory（及它生成的插件）的日常使用中，**每次新增/修改/整理内容前**
按以下规则自检：

1. **先定场景，再定家**：新文件属于哪个场景（哪个 harness / 哪个模块）？
   - 可执行逻辑 → `tools/<模块>/`（同模块脚本放一起，附 README）
   - harness 规格 → `tools/harnesses/<h>/`（plugin/hooks/adapters 三件套）
   - 跨端死知识 → `references/` 根（design-principles / orchestration-patterns 等）
   - 流程编排与判据 → 技能内（技能只引用不内联长规格）
   - 背景研究 → `.agent-workplace/research/`（gitignored，不提交）
2. **不建新层，除非必要**：能用现有容器就归入；要开新容器，先写 README 边界。
3. **改唯一源，不手编派生物**：改路由只改 `routing-table.json`，再跑
   `render-routing.mjs`；改 schema 只改 `tools/shared/schemas/`；版本提升
   由 `.version-bump.json` 驱动。手编派生物 = 制造漂移。
4. **移动必接线**：`git mv` → 全局 `search_replace` → 残留扫描 → 全量测试。
5. **保持 1:1 对齐**：tests/ 目录与 tools/ 模块一一对应；tools/harnesses/
   与模板 harnesses/ 一一对应。
6. **顺手修不顺手加**：整理中发现断引用/失效引用当场修；不借机加新功能。

## 关联

- `references/README.md` — references/ 的放置规则与索引
- `references/design-principles.md` — 铁律与设计原则（职责边界等）
- `references/skill-boundaries.md` — 技能职责边界纪律
- `AGENTS.md` § Conventions / § Repository structure — 仓库级约定与结构图
