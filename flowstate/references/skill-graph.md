# Flowstate skill graph — 编排唯一权威

> **单点维护约定**：本文件是所有技能**节点归属、所有权、边契约、越权约束**的唯一权威。
> 各技能 frontmatter 的关系字段（invokes/handoffs_to/owns/handoffs_from）必须与本文件**一致**；
> 测试脚本 `tests/skill-graph-consistency.test.mjs` 会校验一致性，不一致则 `npm test` 失败。
>
> 架构总览与职责边界见 [`docs/architecture.md`](../docs/architecture.md)（只描述职责，不复制本表）；
> 拆分依据与技能描述见 [`docs/skill-split.md`](../docs/skill-split.md)（只给拆分脉络，不复制本表）。

## 技能全表（分层 + 所有权）

| 层 | 技能名 | 节点 | 所有权（管什么） |
|---|--------|------|---------|
| **入口层** | `using-fst` | —（入口路由） | 识别场景，路由到唯一首技能；不执行流程，不创建业务产物 |
| **生命周期层** | `fst-init` | N1 立项 / N2 冻结 / N3 设计 | 访谈澄清 + 需求分层 + 范围冻结 + 柔性 PRD 设计 |
| | `fst-change` | N5 变更 / N9 紧急 | 记录原文 + 分级 + 影响评估 + 排期 + 归档；**只规划不执行** |
| | `fst-iterate` | N4 开发 / N8 持续迭代 | 方略选择 + 分批设计 + 分批执行 + 技术债 + 回顾闭环；**唯一执行入口** |
| | `fst-review` | N6 测试 / N7 灰度 | 变更针对性测试 + 核心回归 + 骨架冒烟 + DoD 核销 + 灰度方案 + 放量决策 |
| **横切能力层** | `fst-workplace` | —（横切全流程） | 工作区初始化 / 落点规则 / 过程态与定稿分离；被所有技能调用 |
| | `fst-research` | —（横切全流程） | 调查 + 分析 + 报告；为决策提供证据；不替调用方冻结范围或发布 |
| | `fst-promote` | —（横切全流程） | 定稿闸门：过程文档 → 定稿文档的唯一受控通道；必须 HITL 确认 |

## 生命周期职责矩阵（节点 → 唯一负责技能）

| 节点 | 责任技能 | 核心产出 | 交接条件 |
|---|---|---|---|
| N1~N3 | `fst-init` | 需求分层、范围说明书、柔性 PRD、风险清单 | 底线确认、范围签署、PRD 通过 |
| N4 | `fst-iterate` | plan、task、代码分支、技术债、批次验证记录 | 代码完成、批次 Gate 通过 |
| N5 | `fst-change` | 变更申请、分级、影响评估、排期归档 | 用户确认、变更单归档并排期 |
| N6~N7 | `fst-review` | 测试回归报告、DoD、灰度方案、放量决策 | DoD 通过、灰度指标达标 |
| N8 | `fst-iterate` | 回顾报告、下轮范围建议 | 用户确认下轮范围 |
| N9 | `fst-change`（紧急例外） | 紧急 checkpoint、Hotfix、补录变更单 | 修复验证后进入 `fst-review` |

## 边契约（交接三要素）

> 完整交接链叙述见 `using-fst/SKILL.md`「编排总览」；本表是机器可读权威，两者必须一致。

| 边（from → to） | 交接产物 | 交接信号（前置条件） |
|---|---|---|
| `fst-init` → `fst-iterate` | 柔性 PRD · 范围说明书 · 需求分层清单 · 风险清单 | 3 底线确认 + 范围签署 + PRD 评审通过 |
| `fst-change` → `fst-iterate` | 变更申请单（CR-xxx，已归档） · 影响评估 | 变更单归档 + 排期确认 |
| `fst-iterate` → `fst-review` | 可测功能 · tasks 状态更新 · 技术债清单 | 批次验收 Gate 通过 + 功能完成 |
| `fst-review` → `fst-iterate` | DoD 核销记录 · 灰度决策 · 迭代回顾报告 | DoD 全部 ✅ + 灰度指标达标（→ N8 回顾/下轮） |
| `fst-change`(N9) → `fst-review` | 紧急 checkpoint · 补录变更单 | 阻断事故已修复（先修后补，24h 内） |
| `fst-iterate`(N8) → `fst-iterate`(N4) | 迭代回顾报告 · 下轮范围 | 用户确认下轮范围（迭代闭环） |
| 任意技能 → `fst-workplace` | — | 需要初始化工作区或落点判断 |
| 任意技能 → `fst-research` | 调查问题 | 需要证据支持决策 |
| `fst-research` → 调用方 | 分析结论 · 证据索引 | 报告就绪 → 返回调用方继续生命周期 |
| 任意技能 → `fst-promote` | 过程文档（`.agent-workplace/`） | 文档状态 `REVIEW_NEEDED` + 置信度 ≥ 0.8 + HITL 同意 |
| `fst-promote` → 调用方 | 定稿文档（`docs/`）+ 溯源元数据 | 提升完成 → 返回调用方 |

## 节点 ↔ schema 映射

| 技能 | 产出物 schema | PRD §五 编号 |
|------|--------------|------------|
| `fst-init` | `requirements-layer` | 5.1 |
| | `scope` | 5.2 |
| | `risk-list` | 5.5 |
| `fst-change` | `change-request` | 5.3 |
| `fst-review` | `dod-checklist` | 5.4 |
| `fst-iterate` | `tech-debt` | 5.6 |
| | `retrospective` | 5.7 |
| | `plan` | 5.8 |
| | `task` | 5.9 |

## 禁止越权（铁律）

- `fst-change` 不实现代码；**所有实现必须经过 `fst-iterate`**
- `fst-review` 不替代 `fst-iterate` 开发；测试失败回退并转 `fst-change` 记录缺陷
- `fst-promote` 不判断内容正确性；只执行格式校验和 HITL 闸门
- `fst-workplace` 不驱动生命周期；只提供工作区落点
- `fst-research` 不替调用方冻结范围或发布；只产出证据
- 任何过程态必须经 `fst-workplace`；任何定稿必须经 `fst-promote`
- 变更必须走 `fst-change`；不得绕过直接写代码

## 选择规则

1. 入口唯一：先由 `using-fst` 选唯一首技能，不得跳步
2. 横切技能依赖注入：只回传产物到调用方，不改变生命周期所有权
3. 守卫检查：边前置条件不满足时停留并补齐，不得猜测流转
4. 场景优先级：多场景请求按阻断性排序 → 事故/缺陷 → `fst-change`；范围不清 → `fst-init`；否则按当前迭代状态继续