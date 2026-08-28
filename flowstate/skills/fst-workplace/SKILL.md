---
name: fst-workplace
description: Use when a project needs the agent-private workspace (.agent-workplace) initialized, when deciding where an artifact should live (committed docs/ vs private .agent-workplace/), or when applying the commit-boundary rules. Owns the workspace contract: initialization, artifact placement, directory structure, and runtime state (single point of maintenance).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.2.0
    created: 2026-08-09
    updated: 2026-08-28
  keywords_zh: "工作区, .agent-workplace, 落点, 提交边界, 初始化, 过程态, 定稿, 迭代"
  tests: [tests/skill-contracts.test.mjs]
---

# fst-workplace — Agent 私有工作区管理（双文档系统唯一权威）

> 本技能是 **.agent-workplace 的单点维护者**——其他技能不再重复写工作区规则，
> 需要时一行引用本技能。章节骨架见 `references/skill-structure.md`。

## 职责

**.agent-workplace 的规范与使用的唯一权威入口**：初始化工作区、判断内容落点
（提交 vs 不提交）、维护目录结构与运行时状态。所有 fst-* 技能的过程态产物
都落在本工作区，**全部不提交 git**。

## 核心理念：迭代感知的双文档系统

```
docs/                    ← 成果层：只放人类审批过的定稿（提交 git）
.agent-workplace/        ← 工作台：agent 自由迭代的过程文档（gitignore）
```

**文档生命周期**：`.agent-workplace/` 中孵化 → 经 `fst-promote` 闸门审批 → 移入 `docs/` 归档

## Iron Law

```
NO WORKSPACE, NO DRAFT; NO COMMIT BOUNDARY, NO PROCESS
```

- `.agent-workplace/` 全部内容不提交 git（根 `.gitignore` 一行 `.agent-workplace/`）
- 写任何内容前先判断"这个最终要提交吗"——要 → 从一开始写在正式 `docs/`；
  不要 → 写 `.agent-workplace/`
- **发布必须显式确认**：过程稿通过 `fst-promote` 闸门发布为正式文档；
  发布必须保留来源、版本和确认记录，不得静默覆盖正式文档

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-workplace 契约：

- 项目没有 `.agent-workplace/` 就开始写过程态草稿（没初始化）
- 未经 `fst-promote` 确认就把 `.agent-workplace/` 里的内容写入正式 `docs/`
- 把定稿（PRD/ADR/DoD 验收/变更单归档）写在 `.agent-workplace/` 里不提交
- 忘了在 `.gitignore` 追加 `.agent-workplace/`，导致私区被提交
- 每个技能各写一套工作区规则（应引用本技能单点维护）
- 把 `.agent-workplace/` 的结构定义写在 `docs/` 里（应在本技能和模板中定义）

**All of these mean: Stop. Check the workspace contract first.**

## 停止条件

- 项目已有 `.agent-workplace/` → 跳过初始化，直接按目录结构使用
- 项目已有 `temp-*` / `agent-*` 前缀临时目录约定 → 渐进迁移，不强制一刀切
- 内容属于定稿（要提交）→ 不落本工作区，写正式 `docs/`

## 执行流程

### 1. 初始化（若项目根无 `.agent-workplace/`）

**通用步骤**（新项目和已有项目都执行）：

- 复制插件模板：`flowstate/templates/agent-workplace/` → 项目根 `.agent-workplace/`
- 复制迭代模板：`flowstate/templates/iteration/` → `.agent-workplace/iterations/iteration-001/`
- 创建符号链接：`ln -sfn iteration-001 .agent-workplace/current`
- 项目 `.gitignore` 追加一行 `.agent-workplace/`
- 校验模板完整性：`iterations/`、`shared/`、`state/`、`scratch/`、`README.md` 均存在

**已有项目额外步骤**：

- 不得覆盖项目现有的 `docs/` 目录内容
- 初始化后需调用 `fst-init`（已有项目路径）进行现状评估和文档迁移

### 2. 落点判断（写任何内容前，硬性）

| 内容类型 | 落点 | 提交? |
|---------|------|-------|
| 调研证据、对比分析、原始资料 | `.agent-workplace/iterations/current/investigation/` | ❌ |
| 需求草稿、用例草稿 | `.agent-workplace/iterations/current/requirements/` | ❌ |
| 设计草稿、取舍记录、原型 | `.agent-workplace/iterations/current/design/` | ❌ |
| plan/task 草稿、测试失败记录 | `.agent-workplace/iterations/current/development/` | ❌ |
| 风险评估草稿、回滚预案草稿 | `.agent-workplace/iterations/current/release/` | ❌ |
| 变更日志、会话日志 | `.agent-workplace/iterations/current/meta/` | ❌ |
| 一次性探索产物 | `.agent-workplace/scratch/` | ❌ |
| 运行时状态（checkpoint/artifacts/goal） | `.agent-workplace/state/` | ❌ |
| 术语表、架构文档（跨迭代共享） | `.agent-workplace/shared/` | ❌ |
| PRD / ADR / requirements / scope / risk 定稿 | 正式 `docs/` | ✅ |
| 变更单归档定稿 | 正式 `docs/cr/` 或 `docs/CR.md` | ✅ |
| DoD 核销记录、测试报告定稿 | 正式 `docs/` | ✅ |

### 3. 目录结构（迭代感知，按图索骥）

```
.agent-workplace/
├── iterations/                         # 迭代目录（按迭代编号组织）
│   ├── iteration-XXX/                  # 单个迭代（从模板复制）
│   │   ├── investigation/              #   调研阶段产物
│   │   │   ├── fact-checks.md          #     事实核查记录
│   │   │   ├── raw/                    #     原始资料
│   │   │   ├── comparisons/            #     对比分析
│   │   │   └── contradictions/         #     冲突观点记录
│   │   ├── requirements/               #   需求阶段产物
│   │   │   ├── elicited/               #     隐式需求提取
│   │   │   ├── use-cases/              #     用例草稿
│   │   │   └── glossary/               #     术语消歧记录
│   │   ├── design/                     #   设计阶段产物
│   │   │   ├── brainstorming/          #     头脑风暴
│   │   │   ├── tradeoffs/              #     设计取舍
│   │   │   └── prototypes/             #     原型草稿
│   │   ├── development/                #   开发阶段产物
│   │   │   ├── test-failures/          #     测试失败记录
│   │   │   ├── refactor-proposals/     #     重构建议
│   │   │   └── agent-sandbox/          #     Agent 沙箱
│   │   ├── release/                    #   发布阶段产物
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

> 模板来源：`flowstate/templates/agent-workplace/`（干净骨架，复制初始化新项目）
> 迭代模板来源：`flowstate/templates/iteration/`（迭代目录骨架）

### 4. 各阶段落点速查

| 生命周期阶段 | 技能 | 过程态落点 | 定稿落点 |
|-------------|------|-----------|---------|
| 调研（横切） | `fst-research` | `iterations/current/investigation/` | 调用方决定 |
| 立项 N1~N3 | `fst-init` | `iterations/current/requirements/` + `iterations/current/design/` | `docs/`（PRD/ADR/requirements/scope） |
| 变更 N5/N9 | `fst-change` | `iterations/current/meta/`（变更记录） | `docs/cr/`（变更单归档） |
| 迭代 N4/N8 | `fst-iterate` | `iterations/current/development/` | `docs/`（可测功能） |
| 验收 N6/N7 | `fst-review` | `iterations/current/release/` | `docs/`（DoD 核销/测试报告） |
| 定稿闸门 | `fst-promote` | 更新 `state/document-status.json` | `docs/`（经 HITL 确认） |

### 5. 与执行策略的关系

工作区不选择执行策略，也不驱动生命周期流程。它只为其他技能提供稳定落点：
`fst-iterate` 负责选择 lightweight todo 或 `spec` / `loop` / `graph`，
并将过程态产物写入 `iterations/current/development/`。

### 6. 维护

- 节点完成即保存状态：产出物 + 流转记录 → `state/checkpoint.json`（断点续跑）
- `scratch/` 体积膨胀 → 自行清理（保留最近产物）
- 更新模式定义 → 改**技能权威源** `references/agent-modes/*.md`（插件绑定，随插件分发），
  工作区内无副本、无需同步；实例中的过程产物永不回写插件
- 迭代结束 → 归档当前迭代，创建新迭代目录（从模板复制）

### 7. 工作区健康检查

定期检查工作区的完整性：

| 检查项 | 检查内容 | 不满足时的处理 |
|--------|---------|---------------|
| 目录结构 | 检查必要目录是否存在 | 创建缺失的目录 |
| 文件完整性 | 检查必要文件是否存在 | 创建缺失的文件 |
| 状态一致性 | `state/document-status.json` 与实际文档一致 | 修复不一致的状态 |
| 迭代关系 | 当前迭代符号链接有效 | 修复符号链接 |
| 提升记录 | 已提升文档有溯源元数据 | 补充溯源信息 |

### 8. 工作区清理

定期清理工作区：

| 清理项 | 清理内容 | 清理策略 |
|--------|---------|---------|
| 过期迭代 | 归档已完成的迭代 | 移入 `iterations/archive/` |
| 空目录 | 清理空的目录和文件 | 删除 |
| scratch 膨胀 | 一次性探索产物 | 保留最近产物 |
| 待提升堆积 | 长期未提升的文档 | 提醒用户处理 |

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 初始化工作区、落点判断、写过程态草稿、维护 state、清理 scratch、生成待提升清单 |
| **用户** | 确认初始化的模板选择、通过 `fst-promote` 确认定稿发布、审批重大文档 |

## 关联最佳实践

- **工作区规范全文**（`docs/agent-workplace.md`）：核心规则、迭代感知架构、目录结构
- **模板**（`templates/agent-workplace/`）：干净骨架，复制初始化新项目
- **迭代模板**（`templates/iteration/`）：迭代目录骨架
- **定稿闸门**（`fst-promote`）：过程文档 → 定稿文档的唯一受控通道
- **骨架契约**（`references/skill-structure.md`）：技能章节结构约定
- 调用方：`fst-init`（初始化）、`fst-change`（变更单草稿）、`fst-iterate`
  （development 产物）、`fst-review`（release 产物）、`fst-research`
  （investigation 产物）

## 输出

```json
{
  "status": "initialized | present | maintained",
  "workspace": ".agent-workplace/",
  "gitignore_entry": true,
  "current_iteration": "iteration-XXX",
  "directories": ["iterations", "shared", "scratch", "state"],
  "commit_boundary": {
    "committed": "formal docs/ (PRD, ADR, DoD acceptance, change archive)",
    "private": ".agent-workplace/ (investigation, requirements, design, development, release, state)"
  },
  "next": "caller skill (fst-init | fst-change | fst-iterate | fst-review | fst-research)"
}
```

## 自检清单

- [ ] `.agent-workplace/` 已存在且 `.gitignore` 含条目
- [ ] 模板目录完整（iterations / shared / scratch / state）
- [ ] 当前迭代符号链接 `current` 指向正确的迭代目录
- [ ] 写前已判断提交边界（定稿 `docs/`、过程态 `.agent-workplace/`）
- [ ] 过程稿发布到正式目录前已通过 `fst-promote` 闸门
- [ ] `state/checkpoint.json` 已更新（断点续跑可用）
- [ ] `state/document-status.json` 已初始化（文档状态追踪可用）

## 下一步

工作区就绪后，按当前场景回到调用方：立项 → `fst-init`；变更 → `fst-change`；
迭代 → `fst-iterate`；验收 → `fst-review`；调研 → `fst-research`。
本技能自身不驱动流程，只提供工作区能力。
