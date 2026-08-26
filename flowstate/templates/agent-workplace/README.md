# .agent-workplace — Agent 私有工作区（迭代感知双文档系统）

> 本目录是 Agent 的私有工作区：**全部内容不提交 git**（根 `.gitignore` 一行 `.agent-workplace/`）。
> 过程稿默认不提交；经用户确认后通过 `/fst-promote` 发布为正式文档，并保留来源、版本和确认记录。
> 详细规范见项目 `docs/agent-workplace.md`。

## 核心理念：迭代感知的双文档系统

现代化的开发过程是**不断迭代**的，需求会不断演变。本工作区采用**迭代感知的双文档系统**，支持文档在迭代中的演变。

### 文档系统衔接

| 内容 | 位置 | 提交? |
|------|------|-------|
| PRD / ADR / requirements / scope / risk / glossary **定稿** | 正式 `docs/`（按 `documentation-structure.md` 组织） | ✅ |
| plan / task / spec 草稿 / decisions 草稿 / 脚本尝试 | 本目录（`.agent-workplace/`） | ❌ |
| change-request 归档定稿 | 正式 `docs/cr/` 或 `docs/CR.md` | ✅（须经 `/fst-promote` 确认发布） |

### 核心规则

1. **迭代隔离**：每个迭代有独立的文档空间，避免版本混乱
2. **文档版本化**：每个文档都有版本历史，记录在迭代中的演变
3. **状态继承**：上一轮迭代的文档状态可以继承到下一轮
4. **变更追踪**：所有文档变更都有完整的追踪链
5. **受控发布**：所有定稿通过 `/fst-promote` 闸门，必须经过 HITL 确认

## 两层架构（先看懂全局）

这个工作区（以及整个 flowstate）分两层，**互相解耦**：

| 层 | 是什么 | 变化频率 | 位置 |
|----|--------|---------|------|
| **流程框架（Graph）** | 整套开发流程的结构：F1~F9 的节点、边、循环、人工闸门、检查点 | 慢——符合现代开发哲学与现实条件，不随单一问题变化 | `references/flow-graph.md`（插件侧） + `state/` |
| **操作模式（agent-modes/）** | 解决**单一问题**的方法：lightweight todo / Spec / Loop / Graph等 | 快——随经验不断更新、可插拔 | `references/agent-modes/*.md`（插件绑定） |

**关系**：流程的每个步骤，都可以**选用合适的操作模式**去执行——
N4 迭代开发可用 Spec/Loop/Graph 方略；换模式不改变流程框架，
更新模式不推翻流程。框架定"流程怎么走"，模式定"这一步怎么做更好"。

> 本项目是"现代化的流程性开发"：整个开发过程由原来的**人驱动**变为
> **Agent 配合人驱动**——Agent 承担执行与验证，人在 HITL 闸门处做关键决策，
> 大幅提高效率、减少人的负担。

## 目录地图

### 迭代目录（核心）

| 路径 | 用途 |
|------|------|
| `iterations/` | 迭代目录（按迭代编号组织） |
| `iterations/iteration-XXX/` | 迭代目录（从迭代模板复制） |
| `current -> iteration-XXX` | 当前迭代符号链接 |

> **迭代模板**：`flowstate/templates/iteration/`，使用时复制到 `iterations/iteration-XXX/`。
> 迭代模板包含完整的目录结构（investigation / requirements / design / development / release / meta）。

### 共享文档（跨迭代）

| 路径 | 用途 |
|------|------|
| `shared/glossary.md` | 术语表（全局统一） |
| `shared/architecture.md` | 架构文档（全局统一） |
| `shared/adr/` | 架构决策记录（全局统一） |

### 运行时状态目录

| 路径 | 用途 |
|------|------|
| `state/current-iteration.json` | 当前迭代信息 |
| `state/iteration-history.json` | 迭代历史 |
| `state/document-status.json` | 文档状态索引 |
| `state/ready-for-promotion.md` | 待提升文档清单 |
| `state/goal.md` | Loop 方略目标 |
| `state/checkpoint.json` | 断点续跑状态 |
| `state/artifacts.json` | 产物注册表 |

> 模式与框架**不在本工作区内**：操作模式权威在 `references/agent-modes/*.md`，
> 流程框架权威在 `references/flow-graph.md`（均为插件绑定，随插件分发）。

## 流程框架（Graph）怎么走

- 流程 = 可执行状态图：节点是环节（F1~F9），边是 DoD 判据，闸门等人确认
- **未核销不能沿边前进**；**HITL 闸门必须等人**；**变更必须走 N5**；**断点必存**
- 完整规则见 `references/flow-graph.md` 与项目 `docs/PRD.md` §七

## 最佳实践怎么选（30 秒版）

- 简单任务（一句话能说清 diff）→ 由 `fst-iterate 的“方略选择”章节` 选择 **todo**，经 `fst-iterate` 执行并做最小验证（见 `references/agent-modes/todo.md`）
- 迭代开发 → **先盘点本轮需求（含变更单），按需求特征选方略**：
  - 常规开发、验收点清晰 → **Spec 方略**（`references/agent-modes/spec.md`，`phase→task→spec`，任务带验收标准，逐项核销）
  - 目标明确、自动长跑 → **Loop 方略**（`references/agent-modes/goal.md`，`state/goal.md`，每轮自我评估，达标才停）
  - 依赖复杂、可并行 → **Graph 方略**（`references/agent-modes/graph.md`，`docs/task/TASKS.md` 用 `deps` 标依赖，拓扑推进）

详细规则见对应模式：`references/agent-modes/todo.md`、`spec.md`、`goal.md`、`graph.md`。

## 迭代感知双文档系统工作流

### 1. 迭代启动

```bash
# 创建新迭代（从迭代模板复制）
cp -r flowstate/templates/iteration .agent-workplace/iterations/iteration-XXX

# 创建当前迭代符号链接
ln -sfn iteration-XXX .agent-workplace/current

# 继承上一轮迭代的文档状态
# （自动或手动）
```

### 2. 调研阶段（N1）

**目录**：`iterations/current/investigation/`

**工作流**：
1. 使用 `fst-research` 收集证据
2. 在当前迭代的 `fact-checks.md` 中记录事实核查
3. 审核完成后，通过 `/fst-promote` 提升为定稿文档

### 3. 需求阶段（N2）

**目录**：`iterations/current/requirements/`

**工作流**：
1. 使用 `fst-init` 收集需求
2. 在当前迭代的 `elicited/` 中记录隐式需求
3. 需求变更时，创建新版本文档
4. 审核完成后，通过 `/fst-promote` 提升为定稿文档

### 4. 设计阶段（N3）

**目录**：`iterations/current/design/`

**工作流**：
1. 使用 `fst-init` 进行方案设计
2. 在当前迭代的 `tradeoffs/` 中记录设计取舍
3. 设计变更时，创建新版本文档
4. 审核完成后，通过 `/fst-promote` 提升为定稿文档

### 5. 开发迭代阶段（N4）

**目录**：`iterations/current/development/`

**工作流**：
1. 使用 `fst-iterate` 进行开发
2. 在当前迭代的 `test-failures/` 中记录测试失败
3. 开发过程中，文档不断更新
4. 审核完成后，通过 `/fst-promote` 提升为定稿文档

### 6. 发布阶段（N7）

**目录**：`iterations/current/release/`

**工作流**：
1. 使用 `fst-review` 进行发布准备
2. 在当前迭代的 `risk-checklists/` 中记录风险评估
3. 审核完成后，通过 `/fst-promote` 提升为定稿文档

### 7. 迭代回顾

**目录**：`iterations/current/meta/`

**工作流**：
1. 记录本轮迭代的变更日志
2. 分析文档演变历史
3. 为下一轮迭代提供参考

## 文档状态追踪

维护 `state/document-status.json`，支持迭代感知：

```json
{
  "documents": [
    {
      "path": "iterations/iteration-XXX/requirements/elicited/user-stories.md",
      "iteration": "iteration-XXX",
      "type": "APPROVED",
      "stage": "requirements",
      "confidence": 0.9,
      "created_at": "2026-08-26T10:00:00Z",
      "updated_at": "2026-08-26T11:00:00Z",
      "promoted_to": "docs/requirements.md",
      "promoted_at": "2026-08-26T12:00:00Z"
    }
  ]
}
```

## 待提升文档清单

在 Checkpoint 保存时，自动生成 `state/ready-for-promotion.md`，按迭代组织：

```markdown
# 待提升文档清单

生成时间：{自动生成时间}

## 当前迭代：iteration-XXX

### 调研阶段
- [ ] `iterations/iteration-XXX/investigation/fact-checks.md` (confidence: 0.85)
  - 建议提升到：`docs/architecture.md`
  - 状态：REVIEW_NEEDED

### 需求阶段
- [ ] `iterations/iteration-XXX/requirements/elicited/user-stories.md` (confidence: 0.9)
  - 建议提升到：`docs/requirements.md`
  - 状态：REVIEW_NEEDED
```

## 自检清单

- [ ] `.agent-workplace/` 已存在且 `.gitignore` 含条目
- [ ] `iterations/` 目录结构完整（investigation / requirements / design / development / release / meta）
- [ ] `shared/` 目录包含全局共享文档（glossary.md / architecture.md / adr/）
- [ ] `state/` 目录包含运行时状态文件
- [ ] 当前迭代符号链接 `current` 指向正确的迭代目录
- [ ] 写前已判断提交边界（定稿 `docs/`、过程态 `.agent-workplace/`）
- [ ] 过程稿发布到正式目录前已有用户确认和版本记录
- [ ] `state/checkpoint.json` 已更新（断点续跑可用）
- [ ] `state/document-status.json` 已初始化（文档状态追踪可用）
- [ ] 所有定稿修改都通过 `/fst-promote` 闸门
- [ ] 文档版本历史已记录（在文档头部或变更日志中）
- [ ] 迭代间文档继承关系已记录
