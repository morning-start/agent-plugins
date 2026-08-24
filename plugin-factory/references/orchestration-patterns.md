# 编排模式库（Orchestration Patterns）

> **固化于：2026-08-01** · **2026-08-09 精简** · references 固化集的一部分。
> **规则**：生成插件的编排设计遵循本文与 `skills/pf-compose/SKILL.md`——不要重复搜网。
> 仅当模式变更或某端引导规格变更时复核。

## 为什么存在

生命周期管理（`tools/verify/README.md`）处理**单个**技能（拆分/合并/重组/移植/退役）。
编排处理**一组技能如何协作**：发现、触发顺序、交接产物、冲突避免。
superpowers 级插件的价值主要在编排（brainstorm → plan → TDD → review），
而非单个技能。
技能之间的**职责边界与协作纪律**（规划/执行分离、内部路由技能、入口场景覆盖）
见 `skill-boundaries.md`（flowstate 实战沉淀）。

**执行者**：编排设计的具体工作流（元数据契约、触发链规则、单一入口、
`using-<plugin>` 引导设计）在 **`skills/pf-compose/SKILL.md`**——本文档只保留
模式库（冷知识）；功能规则以 pf-compose 技能为准。

## 模式

### 1. 链式（Chain）

顺序依赖；每个技能把产物交接给下一个。

- 适用：方法论插件（brainstorm → plan → implement → review）。
- 规则：每个链环消费上一环的产物；不允许断链（由 pf-lifecycle 链路探针检查）。

### 2. 星形（Star / hub）

入口/引导技能分发到相互独立的工具技能。

- 适用：各技能独立、但从一处发现的工具包。
- 引导技能：`using-<plugin>`，CSO 描述 + 各端 session-start 钩子
  （钩子规格：`tools/harnesses/<harness>/hooks.md`）。

### 3. 总线 / 共享产物（Bus）

技能只通过共享产物（PRD、构件清单、审计）协作，无直接链接。

- 适用：plugin-factory 自身管线（L1）。
- 规则：产物 schema 即契约；在门禁处校验（pf-verify）。

### 4. DAG（有向无环）

带依赖的并行分支；用于复杂方法论（如带并行评审者的子代理驱动开发）。

- 规则：无环；每个技能可从入口到达。

## 方法论插件案例（superpowers）

- 入口：`using-superpowers` 引导；经 session-start 钩子 / CLAUDE.md / AGENTS.md 激活。
- 链：brainstorming → writing-plans → using-git-worktrees →
  subagent-driven-development → test-driven-development → requesting-code-review →
  finishing-a-development-branch。
- 每个技能独立可触发（CSO），靠产物衔接（设计文档 → 计划 → worktree）。

## 插件生命周期场景（状态机）

创建是线性流程，但插件的生命周期是**循环**：一次创建后进入 运行 → 维护 → 发布
的闭环；分析（pf-analyze）在运行期随时可跑，产出建议路由到维护场景。**单技能退役
属于维护的一部分**——与"整个插件停止维护"（归档，范围外）不同：单个 skill 丢弃
是插件维护的正常动作。

### 状态

| 状态 | 含义 |
|------|------|
| Create（创建） | 插件不存在，从零生成 |
| Operate（运行） | 插件已安装、在使用 |
| Maintain（维护） | 变更进行中（迭代/优化/重组/单技能退役/移植/编排） |
| Release（发布） | 变更以 SemVer 版本发布 |
| Analyze（分析） | 结构健康检查，驱动维护决策 |
| Archive（归档） | 整个项目停止维护（**范围外**——插件死亡 ≠ 单技能丢弃） |

### 场景目录

> **单一权威**：S1–S10 场景定义、触发关键词、路由路径全部集中在
> `tools/routing/routing-table.json`（引擎 `tools/routing/route-intent.mjs` 读取，
> `skills/using-pf/SKILL.md` 表格由 `tools/routing/render-routing.mjs` 渲染，
> `verify.mjs` 防漂移）。**不要在本文件重复维护场景表**——新增/修改场景时
> 只编辑 JSON，然后 `node tools/routing/render-routing.mjs`。

场景全景（详情以 routing-table.json 为准）：

| 范围 | 场景 |
|------|------|
| 创建 | S1 从零创建（intent Full → design → build → verify → release） |
| 维护 | S2 新增技能 · S3 改进技能 · S4 重组 · S5 单技能退役 · S6 多端移植 · S7 编排优化 · S8 配置/依赖 |
| 发布 | S9 例行发布（verify → pf-version → release gate → 显式 tag/push） |
| 分析 | S10 生命周期分析（纯结构 → 路由到 S4/S5/S7） |

### 编排规则（循环而非线性）

1. **单一入口 + 内部编排**（superpowers 模式，参考 using-superpowers）：统一入口是
   引导技能 `using-<plugin>`（如 `using-pf`）——任何会话/任务先经过它，按用户意图
   路由到对应场景（创建→S1；维护→S2–S8；分析→S10；发布→S9）；**不增加入口命令**。
   `/pf-*` 阶段命令仅作专家直达通道，不是入口。
2. **intent 两模式**：Full（创建，8 问）与 Change（变更：变更点/影响技能/复杂度/
   继承语言策略）；Change 复用已有 PRD，只重写受影响部分。
3. **每个变更都以 verify → release 收尾**——发布不是创建流程的终点，是每次变更的门。
4. **发布后回到 Operate**，形成闭环；Release 不终结生命周期。
5. 单技能退役（S5）与插件归档分离：S5 在维护范围内；归档是整个项目不再维护（范围外）。

> 场景表中的"入口"列 = `using-<plugin>` 按用户意图选定的**内部路由**；用户不直接
> 面对这些入口命令（/pf-* 仅供专家直达）。

## 复核节奏

- 固化于 **2026-08-01**，2026-08-09 精简（编排功能规则移入 `skills/pf-compose/`）。
- 仅当模式变更或某端引导规格变更时更新（交叉引用 `tools/harnesses/<harness>/hooks.md`）。
