# Agent 私有工作区规范（.agent-workplace/）

- **状态**: Accepted（已接受）
- **日期**: 2026-08-08
- **背景**: 用 Agent 开发项目时，Agent 需要一片完全自管的区域：存放过程性
  文档（plan / task / SPEC 草稿）与可执行实验脚本（用于验证"怎么做才是对的"）。
  这些内容高频变动、生命周期短、不是项目交付物，**不应提交到 git**。
- **迭代**: v0.3 — 吸收 Plan / Spec / Task / Goal 四工作模式与业界工作区
  最佳实践（TRAE Plan·Spec·Goal、Codex/Claude plan mode、Junie spec-driven、
  maestro-flow `.workflow/` 结构），补充 modes/、research/、requirements、
  decisions、goal 状态等；v0.3 加入 **Graph 流程框架**（modes/graph.md）与
  "流程框架 vs 最佳实践"两层解耦架构。

## 核心规则（铁律）

1. **`.agent-workplace/` 全部内容不提交**——根 `.gitignore` 一行：
   ```
   .agent-workplace/
   ```
2. **提交边界是硬性的**：Agent 写任何内容前先判断——"这个最终要提交吗？"
   - **要提交** → 从一开始就写在项目正式目录（`docs/` 或其他正式文件夹）
   - **不要提交** → 写在 `.agent-workplace/`
3. **私有区不存在"转正"路径**：`.agent-workplace/` 里的内容不得被复制/迁移
   到正式目录再提交（避免两个区之间内容漂移）。要提交的内容必须**最初**就
   写在正式目录。

## 为什么叫 .agent-workplace（而不是 .agent）

- `.agent` 与常见的 `.agents`（多 agent 配置目录）易混淆；
- `.agent-workplace` 语义明确：Agent 专属工作区；
- 点开头 = 隐藏目录：语义"内部私有"、不污染浏览视图、防 `cp -r *` 等误操作。

## 两层架构（流程框架 vs 最佳实践）

工作区（以及整个 flowstate）分两层，**互相解耦**：

| 层 | 是什么 | 变化频率 | 位置 |
|----|--------|---------|------|
| **流程框架（Graph）** | 整套开发流程的结构：F1~F9 的节点、边、循环、人工闸门、检查点 | 慢——符合现代开发哲学与现实条件，不随单一问题变化 | `modes/graph.md` + `state/` |
| **最佳实践库（modes/）** | 解决**单一问题**的方法：Plan / Spec（方略）/ Loop / Graph（方略）等 | 快——随经验不断更新、可插拔 | `modes/*.md` |

**关系**：流程的每个步骤，都可以**选用合适的最佳实践**去执行——
N4 迭代开发可用 Spec/Loop/Graph 方略、N1 立项可用 Spec 的访谈环节；换实践不改变流程框架，
更新实践不推翻流程。框架定"流程怎么走"，实践定"这一步怎么做更好"。

> **项目本质**：这是"现代化的流程性开发"——整个开发过程由原来的**人驱动**
> 变为 **Agent 配合人驱动**：Agent 承担执行与验证，人在 HITL 闸门处做关键决策，
> 大幅提高效率、减少人的负担。

## 最佳实践库（如何选）

> 下表是**最佳实践库**的成员（解决单一问题的方法）；**流程框架（Graph）**不是实践，
> 而是整套流程的结构，见 `modes/graph.md`——每个流程步骤在框架内选用下列实践执行。

按任务特征选择工作模式，产物落在对应目录：

| 模式 | 适用场景 | 产物 | 核心机制 |
|------|---------|------|---------|
| **Plan 模式** | 边界清晰、执行前需确认步骤（中小功能、模块重构、缺陷修复） | `docs/plan/PLAN.md` | 先探索后计划，计划待确认才执行 |
| **Spec 方略** | 迭代开发默认方略：常规需求、验收点清晰，任务需"做到什么算完成"可验证 | `docs/task/TASKS.md`（含 acceptance）+ 可选 `docs/spec/checklist.md` | phase→task→spec：每任务带验收标准，逐项核销 |
| **Loop 方略（goal loop agent）** | 目标明确、需自动持续推进（修测试、批量迁移、持续排查） | `state/goal.md` | phase→loop / phase→task→loop：完成条件 + 每轮自评，达标才停 |
| **Graph 方略** | 依赖复杂、可并行、按拓扑推进 | `docs/task/TASKS.md`（`deps` 字段）+ 可选 `docs/task/graph.md` | phase→graph / phase→task→graph：节点=任务、边=依赖/DoD，拓扑执行 |

**选择规则**：
- 能用一句话描述 diff 的简单任务 → 跳过计划，直接做；
- 不确定方案、改多文件、不熟悉代码 → 进 Plan 模式；
- 迭代开发、每步可验收 → 进 Spec 方略（默认）；
- 长跑、无人值守 → 进 Loop 方略（配合 checkpoint 断点续跑）；
- 依赖复杂、可并行 → 进 Graph 方略。

## 目录结构

```
.agent-workplace/                # Agent 私有工作区（gitignore 一条全免）
├── README.md                    # 工作区地图：模式选择指南 + 目录说明（Agent 自解释入口）
├── modes/                       # 工作模式定义：graph（流程框架）+ plan/spec/task/goal（最佳实践）
├── docs/                        # 过程文档（Agent 全权管理）
│   ├── requirements.md          #   需求清单（Spec 模式起点：需求编号 + 优先级 + 验收）
│   ├── plan/                    #   Plan 模式：PLAN.md（分 phase：要做什么、为什么做）
│   ├── task/                    #   Spec/Graph 方略产物：TASKS.md（分批次：内聚 + 验收标准/依赖）
│   ├── spec/                    #   Spec 模式：spec.md + tasks.md + checklist.md
│   └── decisions.md             #   决策记录（重要取舍、理由、否决项）
├── scripts/                     # 可执行实验脚本（shell / 测试桩，Agent 用来验证想法）
├── scratch/                     # 一次性探索产物（{YYYYMMDD}-{type}-{slug}，如 20260808-plan-todo-app）
├── research/                    # 研究/调研缓存（外部资料、备选方案、对比结论）
└── state/                       # Agent 运行时状态
    ├── goal.md                  #   Loop 方略（goal loop agent）：目标定义 + 自我评估记录
    ├── checkpoint.json          #   断点续跑：当前节点 / phase / batch / 已完成列表
    └── artifacts.json           #   产物注册表：跨阶段追踪产出物与状态（可选）
```

## 与 flowstate 的关系

- PRD §四 F4.1 的 `docs/plan`、`docs/task` 默认落在 `.agent-workplace/docs/` 下；
- PRD §七 Checkpoint 的产出物状态（docs/plan、docs/task、变更单草稿）落
  `.agent-workplace/state/`；
- **modes/graph.md = PRD §七 执行图（Agent 执行图）** 的工作区落地：
  节点=流程环节、边=DoD 判据、HITL=人工闸门、Checkpoint=state/checkpoint.json；
  flowstate 插件按图驱动 Agent 执行时，本工作区就是图的执行载体；
- **Goal 模式 = PRD §七 的迭代闭环（N8→N4）** 在单次长任务中的体现：
  设定完成条件 → 每轮自我评估（对照 DoD/验收清单）→ 未达标继续、达标停止；
- 任何需要留档、可追溯、可评审的**定稿**（如 SPEC 定稿、验收记录）写入项目
  正式 `docs/` 并提交——`.agent-workplace/` 只承载过程态；
- **正式 `docs/` 的组织**（PRD 必选、双模式 light/full、ADR 文件夹化）遵循
  `docs/documentation-structure.md`（文档系统规范）。

## 例外与边界

- 若项目已有 `temp-*` / `agent-*` 前缀的临时目录约定，可渐进迁移，不强制一刀切；
- `.agent-workplace/` 不在 CI、打包、搜索（`cp -r *`、`tar`、IDE 全局替换）的
  范围内——隐藏目录天然避开大部分误操作；
- 团队协作时需在 `AGENTS.md` / `CLAUDE.md` 中说明此约定，避免他人误删或误提交；
- `research/` 与 `scratch/` 若体积膨胀，Agent 可自行清理（保留最近产物即可）。

## 模板与初始化（给其他项目用）

`.agent-workplace/` 是**运行实例**（不提交 git）。其他项目要获得同样的工作区，
使用随插件分发的**模板**（提交 git）：

```
flowstate/templates/agent-workplace/     # 工作区模板（干净骨架）
```

**初始化方式**（复制模板到目标项目）：

```bash
cp -r flowstate/templates/agent-workplace <目标项目>/.agent-workplace
```

并在目标项目 `.gitignore` 追加一行 `.agent-workplace/`。

**模板 vs 实例**：

| | `templates/agent-workplace/` | `.agent-workplace/` |
|--|------------------------------|---------------------|
| git 状态 | 提交（随插件分发） | 忽略（私有） |
| 内容 | 干净骨架：modes/ 模式定义 + docs/ 模板 + state/ 初始状态 + 空目录 .gitkeep | 运行实例：plan/task/spec/state 随工作演进 |
| 用途 | 复制初始化新项目 | 日常使用 |

> 规则：**模板只放"定义与初始状态"，不放运行时数据**——更新模式定义时改模板
> 并同步实例；实例中的过程产物（plan/task/state 内容）永不回写模板。

## 备选方案

- `.agent/`（否决：与 `.agents` 混淆）。
- `temp-docs/` / `temp-scripts/` 前缀分散（否决：gitignore 写多条；"temp"语义
  错误——plan/task 不是临时的；分散难管理）。
- `agent-docs/` / `agent-scripts/` 前缀分散（否决：依然分散，Agent 的"家"不明确）。
- `workplace/` 可见目录（备选：人经常亲自编辑时更顺手，代价是目录列表可见、
  需防误操作）。
