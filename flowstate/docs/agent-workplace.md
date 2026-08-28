# Agent 私有工作区规范（.agent-workplace/）

- **状态**: Accepted（已接受）
- **日期**: 2026-08-08
- **迭代**: v0.5 — 统一为迭代感知双文档系统，fst-workplace 为技能层权威，
  本文档为项目层规范。v0.5 对齐 fst-workplace v0.2 的迭代目录结构。

## 核心理念：迭代感知的双文档系统

```
docs/                    ← 成果层：只放人类审批过的定稿（提交 git）
.agent-workplace/        ← 工作台：agent 自由迭代的过程文档（gitignore）
```

**文档生命周期**：`.agent-workplace/` 中孵化 → 经 `fst-promote` 闸门审批 → 移入 `docs/` 归档

## 核心规则（铁律）

1. **`.agent-workplace/` 全部内容不提交**——根 `.gitignore` 一行：
   ```
   .agent-workplace/
   ```
2. **提交边界是硬性的**：Agent 写任何内容前先判断——"这个最终要提交吗？"
   - **要提交** → 从一开始就写在项目正式目录（`docs/` 或其他正式文件夹）
   - **不要提交** → 写在 `.agent-workplace/`
3. **正式发布必须显式确认**：`.agent-workplace/` 中的过程稿通过 `fst-promote`
   闸门发布到正式目录；发布时保留来源、版本和确认记录，禁止静默覆盖正式文档。

## 为什么叫 .agent-workplace（而不是 .agent）

- `.agent` 与常见的 `.agents`（多 agent 配置目录）易混淆；
- `.agent-workplace` 语义明确：Agent 专属工作区；
- 点开头 = 隐藏目录：语义"内部私有"、不污染浏览视图、防 `cp -r *` 等误操作。

## 两层架构（流程框架 vs 最佳实践）

工作区（以及整个 flowstate）分两层，**互相解耦**：

| 层 | 是什么 | 变化频率 | 位置 |
|----|--------|---------|------|
| **流程框架（Graph）** | 整套开发流程的结构：N1~N9 的节点、边、循环、人工闸门、检查点 | 慢——符合现代开发哲学与现实条件，不随单一问题变化 | `references/flow-graph.md` + `state/` |
| **操作模式（agent-modes/）** | 解决**单一问题**的方法：Lightweight todo / Spec（方略）/ Loop（方略）/ Graph（方略） | 快——随经验不断更新、可插拔 | `references/agent-modes/*.md`（插件绑定） |

**关系**：流程的每个步骤，都可以**选用合适的最佳实践**去执行——
N4 迭代开发可用 Spec/Loop/Graph 方略；换实践不改变流程框架，
更新实践不推翻流程。框架定"流程怎么走"，实践定"这一步怎么做更好"。

> **项目本质**：这是"现代化的流程性开发"——整个开发过程由原来的**人驱动**
> 变为 **Agent 配合人驱动**：Agent 承担执行与验证，人在 HITL 闸门处做关键决策，
> 大幅提高效率、减少人的负担。

## 目录结构（迭代感知）

```
.agent-workplace/
├── iterations/                         # 迭代目录（按迭代编号组织）
│   ├── iteration-XXX/                  # 单个迭代（从模板复制）
│   │   ├── investigation/              #   调研阶段产物（fst-research）
│   │   │   ├── fact-checks.md          #     事实核查记录
│   │   │   ├── raw/                    #     原始资料
│   │   │   ├── comparisons/            #     对比分析
│   │   │   └── contradictions/         #     冲突观点记录
│   │   ├── requirements/               #   需求阶段产物（fst-init）
│   │   │   ├── elicited/               #     隐式需求提取
│   │   │   ├── use-cases/              #     用例草稿
│   │   │   └── glossary/               #     术语消歧记录
│   │   ├── design/                     #   设计阶段产物（fst-init）
│   │   │   ├── brainstorming/          #     头脑风暴
│   │   │   ├── tradeoffs/              #     设计取舍
│   │   │   └── prototypes/             #     原型草稿
│   │   ├── development/                #   开发阶段产物（fst-iterate）
│   │   │   ├── test-failures/          #     测试失败记录
│   │   │   ├── refactor-proposals/     #     重构建议
│   │   │   └── agent-sandbox/          #     Agent 沙箱
│   │   ├── release/                    #   发布阶段产物（fst-review）
│   │   │   ├── risk-checklists/        #     风险评估
│   │   │   └── rollback-plans/         #     回滚预案
│   │   └── meta/                       #   迭代元数据
│   │       ├── change-log.md           #     变更日志
│   │       └── session-logs/           #     会话日志
│   └── current -> iteration-XXX        # 当前迭代符号链接
├── shared/                             # 跨迭代共享文档
│   ├── glossary.md                     #   术语表（全局统一）
│   ├── architecture.md                 #   架构文档（全局统一）
│   └── adr/                            #   架构决策记录（全局统一）
├── scratch/                            # 一次性探索产物
├── state/                              # 运行时状态
│   ├── checkpoint.json                 #   断点续跑状态
│   ├── artifacts.json                  #   产物注册表
│   ├── goal.md                         #   Loop 方略目标
│   ├── document-status.json            #   文档状态索引
│   ├── current-iteration.json          #   当前迭代信息
│   ├── iteration-history.json          #   迭代历史
│   └── ready-for-promotion.md          #   待提升文档清单
└── README.md                           # 工作区地图
```

## 各阶段落点速查

| 生命周期阶段 | 技能 | 过程态落点 | 定稿落点 |
|-------------|------|-----------|---------|
| 调研（横切） | `fst-research` | `iterations/current/investigation/` | 调用方决定 |
| 立项 N1~N3 | `fst-init` | `iterations/current/requirements/` + `iterations/current/design/` | `docs/`（PRD/ADR/requirements/scope） |
| 变更 N5/N9 | `fst-change` | `iterations/current/meta/`（变更记录） | `docs/cr/`（变更单归档） |
| 迭代 N4/N8 | `fst-iterate` | `iterations/current/development/` | `docs/`（可测功能） |
| 验收 N6/N7 | `fst-review` | `iterations/current/release/` | `docs/`（DoD 核销/测试报告） |
| 定稿闸门 | `fst-promote` | 更新 `state/document-status.json` | `docs/`（经 HITL 确认） |

## 最佳实践库（如何选）

> 下表是**操作模式**的成员（解决单一问题的方法）；**流程框架（Graph）**不是实践，
> 而是整套流程的结构，见 `references/flow-graph.md`——每个流程步骤在框架内选用下列模式执行。

按任务特征选择工作模式，产物落在对应目录：

| 模式 | 适用场景 | 产物 | 核心机制 |
|------|---------|------|---------|
| **Lightweight todo 路径** | 一句话能说清 diff 的简单任务（改 typo、加日志、重命名） | 轻量 todo 清单 | 经 `fst-iterate` 最小路径执行 |
| **Spec 方略** | 迭代开发默认方略：常规需求、验收点清晰 | `iterations/current/development/tasks.md`（含 acceptance） | phase→task→spec：每任务带验收标准，逐项核销 |
| **Loop 方略（goal loop agent）** | 目标明确、需自动持续推进 | `state/goal.md` | phase→loop / phase→task→loop：完成条件 + 每轮自评，达标才停 |
| **Graph 方略** | 依赖复杂、可并行、按拓扑推进 | `iterations/current/development/tasks.md`（`deps` 字段） | phase→graph / phase→task→graph：节点=任务、边=依赖/DoD，拓扑执行 |

> 模式定义权威在 `references/agent-modes/`（todo / spec / goal / graph）。

**选择规则**：
- 能用一句话描述 diff 的简单任务 → Lightweight todo 路径；
- 迭代开发、每步可验收 → 进 Spec 方略（默认）；
- 长跑、无人值守 → 进 Loop 方略（配合 checkpoint 断点续跑）；
- 依赖复杂、可并行 → 进 Graph 方略。

## 与 flowstate 的关系

- **技能层权威**：`fst-workplace`（SKILL.md）是工作区规范的技能层单点维护者
- **项目层规范**：本文档是工作区规范的项目层参考文档
- PRD §四 F4.1 的 plan/task 默认落在 `iterations/current/development/` 下
- PRD §七 Checkpoint 的产出物状态落 `state/checkpoint.json`
- `references/flow-graph.md` = PRD §七 执行图的插件侧权威
- 操作方法权威在 `references/agent-modes/*.md`，工作区内不复制
- 任何需要留档、可追溯、可评审的**定稿**写入项目正式 `docs/` 并提交

## 模板与初始化（给其他项目用）

`.agent-workplace/` 是**运行实例**（不提交 git）。其他项目要获得同样的工作区，
使用随插件分发的**模板**（提交 git）：

```
flowstate/templates/agent-workplace/     # 工作区模板（干净骨架）
flowstate/templates/iteration/           # 迭代目录模板
```

**初始化方式**：

```bash
# 复制工作区模板
cp -r flowstate/templates/agent-workplace <目标项目>/.agent-workplace

# 复制第一个迭代
cp -r flowstate/templates/iteration <目标项目>/.agent-workplace/iterations/iteration-001

# 创建当前迭代符号链接
ln -sfn iteration-001 <目标项目>/.agent-workplace/current

# 在目标项目 .gitignore 追加
echo ".agent-workplace/" >> <目标项目>/.gitignore
```

**模板 vs 实例**：

| | `templates/agent-workplace/` | `.agent-workplace/` |
|--|------------------------------|---------------------|
| git 状态 | 提交（随插件分发） | 忽略（私有） |
| 内容 | 干净骨架：iterations/ 模板 + state/ 初始状态 + 空目录 .gitkeep | 运行实例：随工作演进 |
| 用途 | 复制初始化新项目 | 日常使用 |

## 例外与边界

- 若项目已有 `temp-*` / `agent-*` 前缀的临时目录约定，可渐进迁移，不强制一刀切；
- `.agent-workplace/` 不在 CI、打包、搜索（`cp -r *`、`tar`、IDE 全局替换）的
  范围内——隐藏目录天然避开大部分误操作；
- 团队协作时需在 `AGENTS.md` / `CLAUDE.md` 中说明此约定，避免他人误删或误提交；
- `scratch/` 若体积膨胀，Agent 可自行清理（保留最近产物即可）。
