---
name: fst-init
description: Use when starting a new project, when requirements are vague ("build X" / "help me think through this project"), or when a project needs its core baseline locked before planning. Guides project kickoff: 3 core baselines, requirements layering, scope freeze, and flexible design (N1~N3 in the flowstate execution graph).
metadata:
  prefix: fst
  lifecycle:
    status: active
    version: 0.1.0
    created: 2026-08-08
    updated: 2026-08-09
  keywords_zh: "立项, 需求分层, 范围冻结, 柔性设计, 核心底线"
---

# fst-init — 立项初始化（N1 立项 / N2 冻结 / N3 设计）

> 章节骨架与约定见 `references/skill-structure.md`；下文仅保留 fst-init 独有内容。

## 职责

项目启动的流程引导：**访谈 3 条核心底线 → 需求分层 → 冻结范围 → 柔性设计**。不追求一次调研完整——锁定底线、显式标记未知项、为后续变更预留拓展，是立项阶段的核心。

## Iron Law

```
NO BASELINE, NO SCOPE; NO SCOPE, NO DESIGN
```

- 3 条底线未书面确认 → 不得进入需求整理
- 迭代范围说明书未签署 → 不得进入方案设计
- 未确认的需求只做占位说明，不得脑补补全

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-init 契约：

- 一次性想收集"全部需求"（违背"粗调研、留余量"）
- 替用户脑补模糊需求，而不是显式标记为「待确认」
- 在范围未冻结前就开始详细 PRD / 写代码
- 把弹性细节需求硬写成刚性需求
- 设计时把可变逻辑写死（不做柔性预留）

**All of these mean: Stop. Lock the baseline first.**

## 停止条件

- 3 条底线无法确认 → 追问澄清，不猜测
- 用户坚持要全量调研 → 解释"粗调研留余量"原则，标记待确认清单
- 项目已进入迭代开发阶段 → 这不是 fst-init 的职责，转 fst-iterate

## 执行流程

### 1. 初始化 .agent-workplace（前置）

项目根目录若无 `.agent-workplace/`，调用 `fst-workplace` 完成初始化
（复制 `templates/agent-workplace/` → 项目根 + `.gitignore` 追加一行
`.agent-workplace/`）。正式定稿写 `docs/`，过程态草稿/脚本写
`.agent-workplace/`（不提交 git）。

### 2. 访谈 3 条核心底线（一次一问）

1. **解决什么核心问题**（项目存在的理由）
2. **目标用户是谁**（谁用、在什么场景）
3. **必须上线的基础价值是什么**（首期不做会死的功能）

逐条记录用户原话，不脑补；模糊处追问一个具体例子。

### 3. 收集已知需求 + 标记未知

- 收集已知显性需求
- **显式标记未知/模糊场景为「待确认需求」**（记录进 `known_gaps`）
- 产出风险清单（含需求变更风险）

### 4. 需求分层（F2 冻结）

将需求分为三层：

| 层 | 定义 | 处理 |
|----|------|------|
| 刚性核心需求 | 首期必须做、不可变更（核心业务流程/功能） | 冻结；变更 = 重大变更走审批 |
| 弹性细节需求 | 规则模糊、待定、可延后 | 迭代中补全，不做深度实现 |
| 临时新增需求 | 迭代中冒出的新需求 | 统一进需求池，不插入当前迭代 |

生成**需求分层清单**（schema 5.1）与**迭代范围说明书**（schema 5.2），由用户书面确认（签署）。

### 5. 方案设计（F3，留拓展）

- **产品侧**：主干流程固定冻结；可变细节/特殊场景/自定义规则做**柔性预留**（可配置化、参数化、状态预留）；模糊需求只做占位说明
- **技术侧**：核心表结构定型 + 预留扩展字段/状态枚举；模块化解耦；接口通用化
- 产出柔性 PRD，用户评审通过后才算完成本技能

### 6. 交接

产出物写入正式 `docs/`（requirements.md、范围说明书、柔性 PRD）；过程态草稿放 `.agent-workplace/`（不提交 git）。

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 初始化 `.agent-workplace`、访谈底线、收集需求、标记待确认、生成分层清单/范围说明书/柔性 PRD 草稿、风险清单 |
| **用户** | 确认 3 底线、签署范围说明书、评审柔性 PRD、决定待确认项 |

## 关联最佳实践

- **Spec 模式**（`.agent-workplace/modes/spec.md`）：访谈澄清 + 需求→计划→任务三链
- **工作区管理**（`fst-workplace`）：初始化 + 落点规则 + 目录结构（单点维护）
- 产出物 schema：5.1 需求分层清单、5.2 迭代范围说明书、5.5 风险清单

## 输出

```json
{
  "status": "init_done | blocked",
  "baselines_confirmed": 3,
  "requirements": { "confirmed": 5, "pending_confirmation": 8 },
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

- [ ] `.agent-workplace/` 已初始化（含 `.gitignore` 条目）
- [ ] 3 条核心底线已书面确认
- [ ] 未知/模糊需求已显式标记「待确认」，未脑补
- [ ] 迭代范围说明书已签署（F2 冻结）
- [ ] 柔性 PRD 已评审通过（F3 留拓展）

## 下一步

立项完成（3 底线确认 + 范围签署 + 柔性 PRD 通过）→ 进入 `fst-iterate`（迭代开发）或 `fst-change`（迭代中变更）。
