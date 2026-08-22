# 文档地图（Documentation Map）

> **固化于：2026-08-08** · 按 **Diátaxis** 四象限归位（tutorials / how-to /
> reference / explanation）。目标：任何问题 60 秒内找到答案，且每个文件只有
> 一个权威位置。本文只做归位导航，不复制任何文档内容。

## 插件定位（30 秒版）

**flowstate**（技能前缀 `fst-`）是一个项目开发全流程规范插件：引导 AI 编程助手在
**需求不全、中途变更、持续迭代**的真实项目中，按"先锁核心底线、边做边补、可控变更、
持续校准"流程工作。全流程建模为**可执行的 Agent 状态图**（节点 = 流程环节，
边 = DoD 流转条件，人工闸门 = HITL，检查点 = Checkpoint）。

## 四象限地图

| 象限 | 用户需求 | 本仓库位置 |
|------|----------|-----------|
| **Tutorials（教程）** | 新手从零了解 flowstate 解决什么问题 | `README.md`（插件主 README，待生成）· `docs/PRD.md`（完整需求文档，含端到端示例） |
| **How-to（操作指南）** | 完成任务：立项 / 变更 / 验收 / 迭代 | `commands/`（`/fst-*` 斜杠命令，待拆分）· `skills/`（`fst-init` / `fst-change` / `fst-review` / `fst-iterate`） |
| **Reference（参考）** | 查规范：模板字段、术语、schema | `docs/PRD.md` §五（产出物模板 5.1~5.9）· `docs/glossary.md`（术语）· `schemas/`（产出物 JSON Schema，待落地）· `references/`（预留） |
| **Explanation（解释）** | 理解为什么：命名、图编排决策 | `docs/ADR-0001-naming.md`（命名决策）· `docs/ADR-0002-agent-graph.md`（Agent 图编排决策）· `docs/PRD.md` §七（执行图）· §附录（与原流程文档差异）· `docs/agent-workplace.md`（Agent 私有工作区规范） |

## 快速导航

| 我想… | 去这里 |
|-------|--------|
| 了解项目是做什么的 | `docs/PRD.md` §一（项目定位） |
| 查技能分层、节点归属和产物所有权 | `docs/architecture.md` |
| 看完整需求（功能 F1~F9） | `docs/PRD.md` §四 |
| 查产出物模板字段（变更单/验收 Checklist） | `docs/PRD.md` §五 |
| 看流程怎么流转、灰度门槛 | `docs/PRD.md` §六 |
| 看 Agent 执行图（状态机/循环/HITL） | `docs/PRD.md` §七 |
| 查一个术语（DoD / 骨架开发 / 需求池） | `docs/glossary.md` |
| 查为什么叫 flowstate / 前缀 fst- | `docs/ADR-0001-naming.md` |
| 查为什么用图编排而不是线性流程 | `docs/ADR-0002-agent-graph.md` |
| 查 Agent 私有工作区（.agent-workplace）怎么用 | `docs/agent-workplace.md` |
| 给其他项目初始化工作区（复制模板） | `templates/agent-workplace/` · `docs/agent-workplace.md` §模板与初始化 |
| 看一个项目怎么走完全流程 | `docs/PRD.md` §九（端到端示例） |

## 维护规则

- 新文档先归位到四象限，再写入内容；**不要**在多个位置复制同一内容。
- PRD 是单一权威来源；`skills/`、`schemas/` 落地后与其保持一致。
- 修改 `docs/` 约定时，同步更新本文导航。
- 判断位置的原则：文档回答"是什么/规范" → reference；"怎么做" → how-to；
  "为什么" → explanation；"入门跟做" → tutorial。
