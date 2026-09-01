---
name: fst-workplace
description: Use when a project needs the agent-private workspace (.agent-workplace) initialized, when deciding where an artifact should live (committed docs/ vs private .agent-workplace/), or when applying the commit-boundary rules. Owns the workspace contract: initialization, artifact placement, directory structure, and runtime state (single point of maintenance).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.3.0
    created: 2026-08-09
    updated: 2026-08-28
  keywords_zh: "工作区, .agent-workplace, 落点, 提交边界, 初始化, 过程态, 定稿, 迭代"
  role: capability
  layer: cross-cutting
  invokes: []
  handoffs_to: [all]

  handoffs_from: [using-fst, fst-init, fst-change, fst-iterate, fst-review, fst-research, fst-promote]
  owns: [workspace, placement, checkpoint]
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

#### 首选：执行脚本（幂等，可重复运行）

```bash
# bash / Git Bash（Windows 下同样可用）
bash <plugin-root>/scripts/fst-workplace-init.sh --root <项目根>

# PowerShell（Windows 5.1+，不需要管理员权限）
& <plugin-root>\scripts\fst-workplace-init.ps1 -Root <项目根>
```

脚本一次做完 5 件事，且**不会覆盖已有文件**（除非加 `--force`）：

1. 复制 `templates/agent-workplace/` → 项目根 `.agent-workplace/`
2. 复制 `templates/iteration/` → `.agent-workplace/iterations/iteration-001/`
3. 建立 `iterations/current` 指针（symlink → junction → 显式路径 三级降级）
4. 项目 `.gitignore` 幂等追加 `.agent-workplace/`（已有则不重复写）
5. 补齐 `iterations/` 与 `scratch/`（空目录不进 git，模板里的 `.gitkeep` 也可能丢失）

结果写入 `.agent-workplace/state/workspace.json`，含 `current_pointer.mode`。

**插件根怎么定位**：脚本从自身位置推导（取 `scripts/` 的上一级），不依赖任何环境变量。
若只拿得到技能路径，则 `skills/fst-workplace/SKILL.md` 的上一级即插件根。

**SessionStart 已兜底**：`hooks/session-start.sh` / `.ps1` 每次会话开始都会自动跑一次
初始化脚本——所以正常路径下不需要手工执行。仅当项目根缺少
`.git` / `package.json` / `Cargo.toml` / `README.md` 等项目标记时才跳过（避免在非项目
目录里乱建目录），此时需显式执行脚本并加 `--force` / `-Force`。
设置环境变量 `FLOWSTATE_AUTO_WORKPLACE=0` 可关闭自动初始化。

#### `iterations/current` 指针的四种模式

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| `symlink` | Unix；或 Windows 开了开发者模式/提权 | **相对**符号链接，可随项目整体移动 |
| `junction` | Windows 无提权（最常见） | NTFS junction，免管理员；目标为绝对路径 |
| `directory` | 旧版 Git Bash `ln -s` 退化出的真实目录 | 脚本**不自动删除**；`--force` 重建（会清空该目录，执行前先确认无未迁移产物） |
| `explicit` | 链接创建全部失败 | 不创建 `current`，落点改用显式路径 `.agent-workplace/iterations/iteration-XXX/` |

> `directory` / `explicit` 模式下，`iterations/current/<stage>/` 路径不可用或不可靠；
> 所有落点必须写成显式迭代目录。

#### 手工兜底（脚本不可用时的降级路径）

按顺序手工完成脚本的 5 件事，然后校验
`iterations/`、`shared/`、`state/`、`scratch/`、`README.md` 均存在。
**注意**：不要用 `ln -sfn` 硬建 `current`——Windows Git Bash 下它会退化成目录复制，
那正是 `directory` 模式的来源。用不了脚本时，宁可不建 `current` 而直接用显式路径。

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

### 2.1 设计沉淀：迭代取舍 → 全局架构决策

`design/` 里做的取舍分两种，**按性质分流**，切勿混层：

| 设计产物 | 性质 | 落点 | 提交? |
|---------|------|------|-------|
| 当前迭代的方案取舍 / 原型 | 局部、短命、一次性 | `iterations/current/design/` | ❌ |
| 跨迭代的架构决策（ADR） | 全局、慢变、需回溯 | `.agent-workplace/shared/adr/` → 定稿 `docs/adr/` | ❌→✅ |
| 全局架构文档 | 系统长期结构 | `.agent-workplace/shared/architecture.md` → 定稿 `docs/architecture.md` | ❌→✅ |

**何时把迭代内取舍上升为全局 ADR**（三条提问，命中即上升）：

1. 未来迭代也要引用/遵守这个决策吗？
2. 它描述的是系统长期结构，而不是本轮功能实现吗？
3. 若不沉淀，下一个迭代是否会重复该取舍 / 违背该决策？

**上升路径**（保留完整溯源链）：

```
iterations/current/design/tradeoffs/xxx.md   # 迭代内取舍（局部）
   ⇣ fst-promote / 登记
.agent-workplace/shared/adr/xxx.md           # 跨迭代共享 ADR（过程态共享层）
   ⇣ fst-promote（HITL 确认）
docs/adr/xxx.md                              # ADR 定稿（提交）
```

**登记要求**：上升时同步更新 `state/document-status.json`——
- 取舍源记录 `type: REVIEW_NEEDED`、`promoted_to: .agent-workplace/shared/adr/xxx.md`
- 共享 ADR 记录 `source` 指向该迭代 `design/` 的取舍文件、`promoted_to: docs/adr/xxx.md`
- 定稿后 `type: APPROVED`（含 `source` / `promoted_to` / `approver`）

> **一致性由机检保证**：`tests/dual-document-consistency.test.mjs` 的 P6 不变量校验——
> `shared/adr/`、`docs/adr/` 下的 ADR 必须受管且 `APPROVED` 的 `source` 能追溯到迭
> 代 `design/`（含 `shared/adr/` 链），防止架构决策凭空产生或游离未登记。

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

**直接重跑初始化脚本即可**——它幂等且自带修复能力，缺什么补什么，
并在有实际修复时返回 `status: repaired`：

```bash
bash <plugin-root>/scripts/fst-workplace-init.sh --root <项目根> --json
```

定期检查工作区的完整性：

| 检查项 | 检查内容 | 不满足时的处理 |
|--------|---------|---------------|
| 目录结构 | 检查必要目录是否存在 | 重跑初始化脚本；或手工 `mkdir -p` |
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
- **初始化脚本**（`scripts/fst-workplace-init.sh` / `.ps1`）：幂等初始化与修复，唯一推荐入口
- **模板**（`templates/agent-workplace/`）：干净骨架，由初始化脚本复制
- **迭代模板**（`templates/iteration/`）：迭代目录骨架，由初始化脚本复制
- **定稿闸门**（`fst-promote`）：过程文档 → 定稿文档的唯一受控通道
- **骨架契约**（`references/skill-structure.md`）：技能章节结构约定
- 调用方：`fst-init`（初始化）、`fst-change`（变更单草稿）、`fst-iterate`
  （development 产物）、`fst-review`（release 产物）、`fst-research`
  （investigation 产物）

## 输出

> **说明**：工作区状态无独立 schema（仅目录/指针落盘校验见 `fst-workplace-init.*`）；文档状态追踪结构见 [`schemas/document-status.schema.json`](../schemas/document-status.schema.json)。本段为示意。

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
  }
}
```

## 自检清单

- [ ] `.agent-workplace/` 已存在且 `.gitignore` 含条目
- [ ] 模板目录完整（iterations / shared / scratch / state）
- [ ] `iterations/current` 指针存在，且 `state/workspace.json` 中 `current_pointer.mode`
      不是 `explicit` / `directory`（若是，落点改用显式迭代目录路径）
- [ ] 写前已判断提交边界（定稿 `docs/`、过程态 `.agent-workplace/`）
- [ ] 过程稿发布到正式目录前已通过 `fst-promote` 闸门
- [ ] `state/checkpoint.json` 已更新（断点续跑可用）
- [ ] `state/document-status.json` 已初始化（文档状态追踪可用）

## 下一步

工作区就绪后，按当前场景回到调用方：立项 → `fst-init`；变更 → `fst-change`；
迭代 → `fst-iterate`；验收 → `fst-review`；调研 → `fst-research`。
本技能自身不驱动流程，只提供工作区能力。
