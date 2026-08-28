# .agent-workplace — Agent 私有工作区（迭代感知双文档系统）

> 本目录是 Agent 的私有工作区：**全部内容不提交 git**（根 `.gitignore` 一行 `.agent-workplace/`）。
> 过程稿默认不提交；经用户确认后通过 `fst-promote` 发布为正式文档，并保留来源、版本和确认记录。
> 详细规范见 `fst-workplace`（技能层权威）或项目 `docs/agent-workplace.md`（项目层规范）。

## 核心理念：迭代感知的双文档系统

```
docs/                    ← 成果层：只放人类审批过的定稿（提交 git）
.agent-workplace/        ← 工作台：agent 自由迭代的过程文档（gitignore）
```

**文档生命周期**：`.agent-workplace/` 中孵化 → 经 `fst-promote` 闸门审批 → 移入 `docs/` 归档

### 文档系统衔接

| 内容 | 位置 | 提交? |
|------|------|-------|
| PRD / ADR / requirements / scope / risk / glossary **定稿** | 正式 `docs/`（按 `documentation-structure.md` 组织） | ✅ |
| 调研 / 需求草稿 / 设计草稿 / plan / task / 草稿 / 脚本 | 本目录（`.agent-workplace/iterations/current/`） | ❌ |
| change-request 归档定稿 | 正式 `docs/cr/` 或 `docs/CR.md` | ✅（须经 `fst-promote` 确认发布） |

### 核心规则

1. **迭代隔离**：每个迭代有独立的文档空间，避免版本混乱
2. **文档版本化**：每个文档都有版本历史，记录在迭代中的演变
3. **状态继承**：上一轮迭代的文档状态可以继承到下一轮
4. **变更追踪**：所有文档变更都有完整的追踪链
5. **受控发布**：所有定稿通过 `fst-promote` 闸门，必须经过 HITL 确认

## 目录地图

### 迭代目录（核心）

| 路径 | 用途 |
|------|------|
| `iterations/` | 迭代目录（按迭代编号组织） |
| `iterations/iteration-XXX/` | 迭代目录（从迭代模板复制） |
| `current -> iteration-XXX` | 当前迭代符号链接 |

> **迭代模板**：`flowstate/templates/iteration/`，使用时复制到 `iterations/iteration-XXX/`。

### 迭代内部结构

| 路径 | 用途 | 技能 |
|------|------|------|
| `iterations/current/investigation/` | 调研阶段产物 | `fst-research` |
| `iterations/current/requirements/` | 需求阶段产物 | `fst-init` |
| `iterations/current/design/` | 设计阶段产物 | `fst-init` |
| `iterations/current/development/` | 开发阶段产物 | `fst-iterate` |
| `iterations/current/release/` | 发布阶段产物 | `fst-review` |
| `iterations/current/meta/` | 迭代元数据（变更日志、会话日志） | 所有技能 |

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

## 最佳实践怎么选（30 秒版）

- 简单任务（一句话能说清 diff）→ **Lightweight todo**，经 `fst-iterate` 最小路径执行
- 迭代开发 → **先盘点本轮需求（含变更单），按需求特征选方略**：
  - 常规开发、验收点清晰 → **Spec 方略**（任务带验收标准，逐项核销）
  - 目标明确、自动长跑 → **Loop 方略**（`state/goal.md`，每轮自我评估，达标才停）
  - 依赖复杂、可并行 → **Graph 方略**（任务用 `deps` 标依赖，拓扑推进）

详细规则见对应模式：`references/agent-modes/todo.md`、`spec.md`、`goal.md`、`graph.md`。

## 自检清单

- [ ] `.agent-workplace/` 已存在且 `.gitignore` 含条目
- [ ] `iterations/` 目录结构完整
- [ ] `shared/` 目录包含全局共享文档
- [ ] `state/` 目录包含运行时状态文件
- [ ] 当前迭代符号链接 `current` 指向正确的迭代目录
- [ ] 写前已判断提交边界（定稿 `docs/`、过程态 `.agent-workplace/`）
- [ ] 过程稿发布到正式目录前已通过 `fst-promote` 闸门
- [ ] `state/checkpoint.json` 已更新（断点续跑可用）
- [ ] `state/document-status.json` 已初始化（文档状态追踪可用）
