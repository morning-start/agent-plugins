# 文档系统规范（docs 目录组织）

- **状态**: Accepted（已接受）
- **日期**: 2026-08-08
- **迭代**: v0.5 — 移除 `.agent-workplace/` 结构定义（由 `fst-workplace` 和 `docs/agent-workplace.md` 管理）
- **用途**: 规范 flowstate 项目正式 `docs/` 目录的结构——**必选 PRD**、双模式组织（小项目单文件 / 大项目文件夹，用户可选）、ADR 文件夹化。
- **范围**: 项目正式 `docs/` 目录的组织；过程态（`.agent-workplace/`）见 `fst-workplace`（技能层权威）或 `docs/agent-workplace.md`（项目层规范）。

## 核心规则（铁律）

1. **PRD 必选**：任何项目文档系统以 PRD 为根——**没有 PRD 不立项**，PRD 缺失时先用 `fst-init` 产出
2. **过程态与定稿分离**：文档分为**定稿**（提交 git，放正式 `docs/`）与**过程态**（不提交，放 `.agent-workplace/`）——计划/任务/脚本尝试/草稿一律过程态。落点规则见 `fst-workplace`
3. **双模式可选**：项目按规模选择文档组织模式，声明在 `AGENTS.md` 或 `.flowstate.json` 的 `docs_mode` 字段
4. **ADR 文件夹化**（大项目）：`docs/adr/ADR-0001-*.md` 按编号前缀排列，目录列表即可按序浏览决策史
5. **定稿通过闸门**：所有定稿修改必须通过 `fst-promote` 闸门，不得绕过

## 双模式组织

| 模式 | `docs_mode` | 适用 | 组织方式 |
|------|------------|------|---------|
| **轻量模式** | `light` | 小项目、单模块、快速交付 | 每个文档类型一个 `.md` 文件 |
| **文件夹模式** | `full` | 大项目、多模块、长期迭代 | 每个文档类型一个目录，文件按编号/日期展开 |

> 选择原则：需求 < ~20 条、模块 ≤ 3 个、预计迭代 ≤ 3 轮 → `light`；否则 → `full`。默认 `light`，`fst-init` 立项访谈时确认并写入 PRD。

## 文档清单（必选 + 推荐）

| 文档 | 轻量（单文件） | 文件夹（目录） | 对应流程 | 必选 |
|------|---------------|---------------|---------|------|
| **PRD** | `docs/PRD.md` | `docs/prd/` | N1~N3 立项/冻结/设计 | ✅ 必选 |
| **ADR**（决策记录） | `docs/ADR.md` | `docs/adr/ADR-0001-*.md`（按编号） | N3 设计决策 | ✅ 必选 |
| requirements（需求分层） | `docs/requirements.md` | `docs/requirements/` | N1/N2 | ✅ 必选 |
| scope（迭代范围说明书） | `docs/scope.md` | `docs/scope/` | N2 冻结 | ✅ 必选 |
| risk（风险清单） | `docs/risks.md` | `docs/risks/` | N1/N8 | 推荐 |
| glossary（术语表） | `docs/glossary.md` | `docs/glossary/` | 全程 | 推荐 |
| change-request 定稿 | `docs/CR.md`（归档） | `docs/cr/` | N5 变更 | 定稿才落 |
| DoD 核销记录 | `docs/dod.md` | `docs/dod/` | N6 验收 | 定稿才落 |
| 测试报告 | `docs/test-report.md` | `docs/test-report/` | N6 验收 | 定稿才落 |

> **调研报告不在此列**：Agent 调研信息（调研结论、对比分析、研究报告）属于
> **过程态**，放 `.agent-workplace/iterations/current/investigation/`（不提交 git）；
> 只有需要留档、可追溯的**调研定稿**才通过 `fst-promote` 提升到正式 `docs/`。

## ADR 文件夹化（大项目示例）

```
docs/adr/
├── ADR-0001-architecture.md
├── ADR-0002-data-model.md
├── ADR-0003-auth-strategy.md
└── README.md          # ADR 索引（可选）
```

- 编号递增（ADR-0001、ADR-0002…），**不可变**——改决策写新 ADR 并标记 Superseded
- 目录列表即决策史，按编号顺序浏览

## 过程态 vs 定稿（不混淆）

| 内容 | 位置 | 提交? |
|------|------|-------|
| PRD / ADR / requirements / scope / risk / glossary 定稿 | 正式 `docs/` | ✅ |
| plan / task / 草稿 / 变更单草稿 / checklist 草稿 | `.agent-workplace/iterations/current/` | ❌ |
| **调研信息（Agent 调研）** | `.agent-workplace/iterations/current/investigation/` | ❌（调研定稿才通过 `fst-promote` 提升） |
| change-request 归档定稿 | 正式 `docs/cr/` 或 `docs/CR.md` | ✅（须经 `fst-promote` 确认） |

> 落点规则的完整定义见 `fst-workplace`（技能层权威）或 `docs/agent-workplace.md`（项目层规范）。

## 升级 / 降级规则

- **light → full**：单文件展开为目录（`docs/PRD.md` → `docs/prd/`），内容按类型拆分，**无信息丢失**；ADR 单文件拆为编号文件
- **full → light**：目录合并为单文件，保留全部内容与编号引用
- 模式切换仅影响组织方式，不影响 schema（5.1~5.9）与流程判据

## 与 flowstate 其他规范的关系

- 产出物 schema（5.1~5.9）：定义文档内容的字段契约，见 `docs/PRD.md` §五
- 工作区规范：过程态存放与 `.agent-workplace/` 结构，见 `fst-workplace`（技能层）或 `docs/agent-workplace.md`（项目层）
- 定稿闸门：过程文档 → 定稿的唯一受控通道，见 `fst-promote`
