---
name: fst-init
description: Use when starting a new project, when an existing project needs flowstate integrated, or when requirements are vague ("build X" / "help me think through this project"). Handles two paths: new project kickoff (3 baselines → requirements → scope → design) or existing project onboarding (explore → assess → migrate → lock baseline). Guides N1~N3 in the flowstate execution graph.
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.3.0
    created: 2026-08-08
    updated: 2026-08-28
  keywords_zh: "立项, 初始化, 新项目, 已有项目, 迁移, 接入, 需求分层, 范围冻结, 柔性设计"
  tests: [tests/skill-contracts.test.mjs]
---

# fst-init — 立项初始化（N1 立项 / N2 冻结 / N3 设计）

> 章节骨架与约定见 `references/skill-structure.md`；下文仅保留 fst-init 独有内容。
> **落点规则见 `fst-workplace`**，本技能只定义立项方法，不重复工作区规范。

## 职责

项目启动的流程引导，支持**两种入口**：

| 入口 | 场景 | 核心动作 |
|------|------|---------|
| **新项目** | 从零开始、需求模糊、"做个 X" | 访谈底线 → 需求分层 → 冻结 → 设计 |
| **已有项目** | 已有代码/文档、想接入 flowstate | 探索现状 → 评估 → 迁移 → 锁定底线 |

不追求一次调研完整——锁定底线、显式标记未知项、为后续变更预留拓展，是立项阶段的核心。

## 落点（引用 fst-workplace）

| 产物 | 落点 | 提交? |
|------|------|-------|
| 需求草稿、用例草稿 | `iterations/current/requirements/` | ❌ |
| 设计草稿、取舍记录 | `iterations/current/design/` | ❌ |
| 现状评估报告 | `iterations/current/investigation/` | ❌ |
| 需求分层清单定稿 | 正式 `docs/requirements.md` 或 `docs/requirements/` | ✅ |
| 范围说明书定稿 | 正式 `docs/scope.md` 或 `docs/scope/` | ✅ |
| 柔性 PRD 定稿 | 正式 `docs/PRD.md` 或 `docs/prd/` | ✅ |
| 风险清单定稿 | 正式 `docs/risks.md` 或 `docs/risks/` | ✅ |

## Iron Law

```
NO BASELINE, NO SCOPE; NO SCOPE, NO DESIGN
```

- 3 条底线未书面确认 → 不得进入需求整理
- 迭代范围说明书未签署 → 不得进入方案设计
- 未确认的需求只做占位说明，不得脑补补全
- 已有项目必须先探索现状再定底线，不得跳过评估直接冻结

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-init 契约：

- 一次性想收集"全部需求"（违背"粗调研、留余量"）
- 替用户脑补模糊需求，而不是显式标记为「待确认」
- 在范围未冻结前就开始详细 PRD / 写代码
- 把弹性细节需求硬写成刚性需求
- 设计时把可变逻辑写死（不做柔性预留）
- 已有项目跳过探索现状就直接访谈底线（不了解现状就锁底线 = 盲人摸象）
- 已有项目把现有文档全盘推翻重写（应先评估、再迁移、再补充）

**All of these mean: Stop. Lock the baseline first.**

## 停止条件

- 3 条底线无法确认 → 追问澄清，不猜测
- 用户坚持要全量调研 → 解释"粗调研留余量"原则，标记待确认清单
- 项目已进入迭代开发阶段 → 这不是 fst-init 的职责，转 fst-iterate

## 执行流程

### 路径选择（前置判断）

```
项目有代码/文档吗？
├── 否 → 【新项目路径】
└── 是 → 【已有项目路径】
```

---

## 路径 A：新项目

从零开始，完整走 N1~N3。

### A1. 初始化 .agent-workplace（前置）

项目根目录若无 `.agent-workplace/`，调用 `fst-workplace` 完成初始化
（复制 `templates/agent-workplace/` → 项目根 + `.gitignore` 追加一行
`.agent-workplace/` + 创建第一个迭代目录 + 符号链接 `current`）。

### A2. 访谈 3 条核心底线（一次一问）

1. **解决什么核心问题**（项目存在的理由）
2. **目标用户是谁**（谁用、在什么场景）
3. **必须上线的基础价值是什么**（首期不做会死的功能）

逐条记录用户原话，不脑补；模糊处追问一个具体例子。

### A3. 收集已知需求 + 标记未知

- 收集已知显性需求
- **显式标记未知/模糊场景为「待确认需求」**（记录进 `known_gaps`）
- 产出风险清单（含需求变更风险）

### A4. 需求分层（F2 冻结）

将需求分为三层：

| 层 | 定义 | 处理 |
|----|------|------|
| 刚性核心需求 | 首期必须做、不可变更（核心业务流程/功能） | 冻结；变更 = 重大变更走审批 |
| 弹性细节需求 | 规则模糊、待定、可延后 | 迭代中补全，不做深度实现 |
| 临时新增需求 | 迭代中冒出的新需求 | 统一进需求池，不插入当前迭代 |

生成**需求分层清单**（schema 5.1）与**迭代范围说明书**（schema 5.2），由用户书面确认（签署）。

### A5. 方案设计（F3，留拓展）

- **产品侧**：主干流程固定冻结；可变细节/特殊场景/自定义规则做**柔性预留**（可配置化、参数化、状态预留）；模糊需求只做占位说明
- **技术侧**：核心表结构定型 + 预留扩展字段/状态枚举；模块化解耦；接口通用化
- 产出柔性 PRD，用户评审通过后才算完成本技能

### A6. 交接

产出物写入正式 `docs/`（requirements.md、范围说明书、柔性 PRD）；过程态草稿放 `iterations/current/requirements/` 和 `iterations/current/design/`（不提交 git）。

---

## 路径 B：已有项目

已有代码和文档的项目接入 flowstate，**先理解现状，再锁定底线**。

### B1. 初始化 .agent-workplace（前置）

同 A1。但注意：已有项目的 `docs/` 可能已有内容，初始化时**不得覆盖**现有文档。

### B2. 探索现状（调用 fst-research）

对项目进行全面摸底，产出**现状评估报告**（落 `iterations/current/investigation/`）：

| 探索维度 | 方法 | 产出 |
|---------|------|------|
| **代码结构** | 浏览目录、入口文件、核心模块 | 技术栈、架构概况、代码质量 |
| **现有文档** | 读 README、docs/、CHANGELOG 等 | 文档完整度、缺失项 |
| **项目历史** | git log、最近变更、版本标签 | 当前阶段、迭代频率 |
| **需求线索** | issues、TODO、README 中的目标 | 已有需求清单、待确认项 |
| **技术债** | 代码异味、deprecated 标记、TODO | 技术债清单 |

> 调用 `fst-research` 的 `impact-assessment` 模板，评估项目现状。

### B3. 评估项目阶段

根据探索结果，判断项目当前处于哪个阶段：

| 阶段 | 特征 | fst-init 动作 |
|------|------|--------------|
| **早期**（功能未完成、文档缺失） | 代码少、无文档、方向模糊 | 走新项目路径 A2~A5，但跳过已确认的底线 |
| **中期**（核心功能已上线、在迭代） | 有代码、有基本文档、需求在变 | 锁定现有底线，从当前迭代开始 |
| **成熟**（稳定运行、维护为主） | 代码完整、文档齐全、偶尔变更 | 只做工作区接入，底线从现有文档提取 |

### B4. 迁移现有文档（双文档分类）

将现有 `docs/` 中的文档分类到双文档系统：

| 分类 | 判断标准 | 处理 |
|------|---------|------|
| **定稿** | 已确认、不再变动的文档 | 留在 `docs/`，标记为 `APPROVED` |
| **过程态** | 草稿、WIP、待确认的文档 | 移入 `.agent-workplace/iterations/current/` 对应子目录 |
| **历史** | 过时但仍需保留的文档 | 留在 `docs/`，标记为 `ARCHIVED` |
| **待提升** | 需要补充后才能定稿的文档 | 移入 `.agent-workplace/`，标记为 `REVIEW_NEEDED` |

迁移时**不得丢失内容**：每份文档的迁移决策需用户确认。

### B5. 提取/确认底线

根据探索和迁移结果，从现有信息中**提取**底线（而非重新访谈）：

| 底线 | 提取来源 |
|------|---------|
| 核心问题 | README、PRD、项目描述 |
| 目标用户 | README、用户文档、issues |
| 基础价值 | 功能列表、CHANGELOG、版本历史 |

如果现有文档不足以提取底线 → 回到 A2 访谈，但**带着现状上下文**提问（"你们项目 README 说要做 X，这是核心问题吗？"）。

### B6. 补充需求分层 + 冻结

- 已有需求从代码/文档中提取
- 与用户确认分层（刚性/弹性/临时）
- 生成**需求分层清单** + **迭代范围说明书**
- 用户签署冻结

### B7. 补充设计（如果缺失）

- 如果已有设计文档 → 审查是否满足柔性设计要求，不足处补充
- 如果没有设计文档 → 走 A5 完整设计流程
- 产出柔性 PRD（可能是在现有 PRD 基础上补充）

### B8. 交接

同 A6。额外：更新 `state/document-status.json`，记录所有迁移文档的状态。

---

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 初始化 `.agent-workplace`、探索现状（已有项目）、访谈底线（新项目）或提取底线（已有项目）、收集需求、标记待确认、生成分层清单/范围说明书/柔性 PRD 草稿、风险清单、迁移文档（已有项目） |
| **用户** | 确认路径选择、确认 3 底线、签署范围说明书、评审柔性 PRD、决定待确认项、确认文档迁移决策 |

## 关联最佳实践

- **工作区落点**（`fst-workplace`）：requirements/ 和 design/ 属过程态（不提交 git）；定稿写正式 `docs/`
- **流程框架**（`references/flow-graph.md`）：N1~N3 立项/冻结/设计节点在该框架内的执行
- **调研能力**（`fst-research`）：已有项目探索现状时调用
- **执行衔接**（`fst-iterate` + `references/agent-modes/`）：立项产物在下一阶段由 spec / loop / graph 方略承接实现
- 产出物 schema：5.1 需求分层清单、5.2 迭代范围说明书、5.5 风险清单

## 输出

```json
{
  "path": "new_project | existing_project",
  "status": "init_done | blocked",
  "baselines_confirmed": 3,
  "requirements": { "confirmed": 5, "pending_confirmation": 8 },
  "existing_docs_migrated": {
    "finalized": 3,
    "process": 5,
    "archived": 2,
    "pending_review": 1
  },
  "artifacts": {
    "requirements_layer": "docs/requirements.md",
    "scope_doc": "docs/scope.md",
    "flexible_prd": "docs/prd.md",
    "risk_list": "docs/risks.md"
  },
  "next": "fst-iterate"
}
```

## 自检清单

### 通用（两条路径都检查）

- [ ] `.agent-workplace/` 已初始化（含 `.gitignore` 条目）
- [ ] 3 条核心底线已书面确认
- [ ] 未知/模糊需求已显式标记「待确认」，未脑补
- [ ] 迭代范围说明书已签署（F2 冻结）
- [ ] 柔性 PRD 已评审通过（F3 留拓展）
- [ ] 过程态草稿落 `iterations/current/` 对应子目录，定稿写正式 `docs/`

### 已有项目额外检查

- [ ] 已探索项目现状（代码/文档/历史/需求线索/技术债）
- [ ] 已评估项目阶段（早期/中期/成熟）
- [ ] 现有文档已分类迁移（定稿/过程态/历史/待提升），无内容丢失
- [ ] 底线从现有信息中提取，而非重新访谈
- [ ] `state/document-status.json` 已记录迁移文档状态

## 下一步

立项完成 → 交接：**柔性 PRD · 范围说明书 · 需求分层清单 · 风险清单**（定稿 `docs/`）→ `fst-iterate`（迭代开发）。
迭代中冒出新需求 → `fst-change`（变更管控），不插当前迭代。
