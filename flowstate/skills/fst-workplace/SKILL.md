---
name: fst-workplace
description: Use when a project needs the agent-private workspace (.agent-workplace) initialized, when deciding where an artifact should live (committed docs/ vs private .agent-workplace/), or when applying the commit-boundary rules. Owns the workspace contract: initialization, artifact placement, directory structure, and mode selection (single point of maintenance).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-09
    updated: 2026-08-09
  keywords_zh: "工作区, .agent-workplace, 落点, 提交边界, 初始化, 过程态, 定稿, 模式选择"
---

# fst-workplace — Agent 私有工作区管理（基础概念：.agent-workplace）

> 章节骨架与约定见 `references/skill-structure.md`；本技能是 **.agent-workplace 的
> 单点维护者**——其他技能不再重复写工作区规则，需要时一行引用本技能。

## 职责

**.agent-workplace 的规范与使用的唯一权威入口**：初始化工作区、判断内容落点
（提交 vs 不提交）、维护目录结构与运行时状态。所有 fst-* 技能的过程态产物
（草稿/决策/脚本/state）都落在本工作区，**全部不提交 git**。

## Iron Law

```
NO WORKSPACE, NO DRAFT; NO COMMIT BOUNDARY, NO PROCESS
```

- `.agent-workplace/` 全部内容不提交 git（根 `.gitignore` 一行 `.agent-workplace/`）
- 写任何内容前先判断"这个最终要提交吗"——要 → 从一开始写在正式 `docs/`；
  不要 → 写 `.agent-workplace/`
- **无"转正"路径**：`.agent-workplace/` 内容不得被复制/迁移到正式目录再提交

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-workplace 契约：

- 项目没有 `.agent-workplace/` 就开始写过程态草稿（没初始化）
- 把 `.agent-workplace/` 里的内容复制到正式 `docs/` 再提交（转正路径）
- 把定稿（PRD/ADR/DoD 验收/变更单归档）写在 `.agent-workplace/` 里不提交
- 忘了在 `.gitignore` 追加 `.agent-workplace/`，导致私区被提交
- 每个技能各写一套工作区规则（应引用本技能单点维护）

**All of these mean: Stop. Check the workspace contract first.**

## 停止条件

- 项目已有 `.agent-workplace/` → 跳过初始化，直接按目录结构使用
- 项目已有 `temp-*` / `agent-*` 前缀临时目录约定 → 渐进迁移，不强制一刀切
- 内容属于定稿（要提交）→ 不落本工作区，写正式 `docs/`

## 执行流程

### 1. 初始化（若项目根无 `.agent-workplace/`）

- 复制插件模板：`flowstate/templates/agent-workplace/` → 项目根 `.agent-workplace/`
- 项目 `.gitignore` 追加一行 `.agent-workplace/`
- 校验模板完整性：`docs/`、`scripts/`、`scratch/`、`research/`、
  `report/`、`state/`、`README.md` 均存在

### 2. 落点判断（写任何内容前，硬性）

| 内容类型 | 落点 | 提交? |
|---------|------|-------|
| plan / task / spec 草稿、决策草稿、实验脚本、research / scratch、state | `.agent-workplace/` | ❌ |
| PRD / ADR / 需求分层清单 / 范围说明书 / DoD 验收记录 / 变更单归档 定稿 | 正式 `docs/`（变更单归档 `docs/cr/` 或 `docs/CR.md`） | ✅ |

### 3. 目录使用（按图索骥）

| 路径 | 用途 |
|------|------|
| `docs/plan/` `docs/task/` `docs/spec/` | 过程态计划/任务/规格草稿 |
| `docs/decisions.md` | 决策记录（DEC-xxx） |
| `scripts/` | 可执行实验脚本 / 测试桩 |
| `scratch/` | 一次性探索产物（`{YYYYMMDD}-{type}-{slug}`） |
| `research/` `report/` | 调研缓存 / 调研报告 |
| `state/goal.md` `state/checkpoint.json` `state/artifacts.json` | 运行时状态（Goal / 断点 / 产物注册） |

> 模式与框架**不在工作区内**：操作模式权威源在 `references/agent-modes/*.md`，
> 流程框架权威源在 `references/flow-graph.md`（插件绑定，随插件分发）。

### 4. 模式选择（30 秒版）

- 简单任务（一句话说清 diff）→ 直接做，跳过计划
- 边界清晰、需确认步骤 → Plan 模式（`docs/plan/PLAN.md`）
- 迭代开发 → 先盘点本轮需求（含变更单），按需求特征选方略：
  - 常规开发、验收点清晰 → Spec 方略（`phase→task→spec`，任务带验收标准逐项核销）
  - 目标明确、自动长跑 → Loop 方略（`state/goal.md`，每轮自我评估，达标才停）
  - 依赖复杂、可并行 → Graph 方略（任务用 `deps` 标依赖，拓扑推进）

### 5. 维护

- 节点完成即保存状态：产出物 + 流转记录 → `state/checkpoint.json`（断点续跑）
- `research/` 与 `scratch/` 体积膨胀 → 自行清理（保留最近产物）
- 更新模式定义 → 改**技能权威源** `references/agent-modes/*.md`（插件绑定，随插件分发），
  工作区内无副本、无需同步；实例中的过程产物永不回写插件

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 初始化工作区、落点判断、写过程态草稿/脚本、维护 state、清理 research/scratch |
| **用户** | 确认初始化的模板选择、对定稿内容做最终提交决策 |

## 关联最佳实践

- **工作区规范全文**（`docs/agent-workplace.md`）：核心规则、两层架构、目录结构、模板 vs 实例
- **模板**（`templates/agent-workplace/`）：干净骨架，复制初始化新项目
- **骨架契约**（`references/skill-structure.md`）：技能章节结构约定
- 调用方：`fst-init`（初始化）、`fst-change`（变更单草稿）、`fst-iterate`
  （plan/task/state）、`fst-review`（DoD/测试报告过程态）

## 输出

```json
{
  "status": "initialized | present | maintained",
  "workspace": ".agent-workplace/",
  "gitignore_entry": true,
  "directories": ["docs", "scripts", "scratch", "research", "report", "state"],
  "commit_boundary": {
    "committed": "formal docs/ (PRD, ADR, DoD acceptance, change archive)",
    "private": ".agent-workplace/ (drafts, decisions, scripts, state)"
  },
  "next": "caller skill (fst-init | fst-change | fst-iterate | fst-review)"
}
```

## 自检清单

- [ ] `.agent-workplace/` 已存在且 `.gitignore` 含条目
- [ ] 模板目录完整（docs / scripts / scratch / research / report / state）
- [ ] 写前已判断提交边界（定稿 `docs/`、过程态 `.agent-workplace/`）
- [ ] 无「转正」路径行为（未把私区内容复制到正式目录）
- [ ] `state/checkpoint.json` 已更新（断点续跑可用）

## 下一步

工作区就绪后，按当前场景回到调用方：立项 → `fst-init`；变更 → `fst-change`；
迭代 → `fst-iterate`；验收 → `fst-review`。本技能自身不驱动流程，只提供工作区能力。
