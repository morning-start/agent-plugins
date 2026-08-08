---
name: fst-review
description: Use when an iteration is complete, after any change lands, or before release. Handles acceptance: change-targeted testing, core regression, smoke tests for skeletons, gray-release plan and sign-off (DoD checklist) (N6~N7 in the flowstate execution graph).
---

# fst-review — 验收审查（N6 测试 / N7 灰度）

## 职责

迭代/变更的验收环节：**变更针对性测试 → 核心回归 → 骨架冒烟 → 灰度方案 → DoD 核销 → 放量决策**。边开发边改需求的场景下，旧功能易被新改动破坏，测试不能只测新功能。

## The Iron Law

```
NO DOD, NO SHIP
```

- 变更针对性测试未通过 → 不得合并/上线
- 核心主干回归未通过 → 不得进入灰度
- 灰度指标不达标 → 不得全量（回滚）
- 未确认需求的骨架代码必须过冒烟（但不做深度细节测试）

## Red Flags — STOP and Re-evaluate

如果发现自己正在做这些事，说明违反了 fst-review 契约：

- 只测新功能，不回归核心主干流程
- 骨架代码不跑冒烟就放行（"肯定能跑"）
- 灰度未设指标就放量/全量
- DoD 未逐项核销就宣称"完成"
- 待定需求做了深度测试还纳入验收（浪费人力）

**All of these mean: Stop. Verify against DoD first.**

## 停止条件

- 测试环境不可用 → 报告并阻塞，不跳过验证
- 回归发现 P0 阻断缺陷 → 阻塞，转 fst-change 记录缺陷修复
- 灰度指标不达标 → 回滚，重新评估

## 执行流程

### 1. 变更针对性测试

针对**每次改动点 + 关联影响点**（来自 fst-change 的影响评估清单）逐一测试。只测新功能是不够的——每个变更都要验证它对相邻功能的影响。

### 2. 高频回归测试

每次迭代、每次变更后，回归**核心主干流程**，保证核心功能稳定。回归范围 = 核心底线对应的主干链路（立项→开发→验收→上线的关键路径）。

### 3. 骨架冒烟测试

未确认需求只做了骨架开发的，**骨架必须通过冒烟测试**（能跑通最小链路）；但**不做深度细节测试、不纳入交付验收**（修正"待定需求不测试"的歧义：骨架测冒烟，细节不深测）。

### 4. DoD 核销（迭代验收 Checklist，schema 5.4）

逐项核销，全部 ✅ 才可进入灰度：

| 项 | 是否必须 | 说明 |
|----|---------|------|
| 功能完成（含骨架冒烟通过） | ✅ | 未确认需求至少跑通骨架 |
| 变更针对性测试通过 | ✅ | 改动点 + 关联影响点 |
| 核心主干回归通过 | ✅ | 每次迭代/变更后 |
| 文档同步（PRD/设计文档） | ✅ | 变更后必更新 |
| 变更记录归档 | ✅ | 无归档 = 未完成 |
| 待定需求不纳入交付验收 | — | 未确认需求不测深度细节 |

### 5. 灰度方案 + 放量决策（N7）

- 生成灰度方案：小流量比例、监控指标、回滚预案
- 灰度→全量门槛（示例指标，可配置）：
  - 核心功能通过率 ≥ 99%
  - 崩溃率/错误率低于阈值（如 < 0.5%）
  - 无 P0 阻断缺陷
  - 灰度期反馈已归入需求池，无紧急遗漏
- 用户确认放量/全量决策；不达标 → 回滚并回 N6

### 6. 交接

- 测试报告、回归结果、缺陷清单写入正式 `docs/` 或 `.agent-workplace/`（过程态）
- 反馈汇总标记遗漏需求 → 需求池

## 用户 vs Agent 分工

| 谁 | 做什么 |
|---|--------|
| **Agent** | 变更针对性测试、核心回归、骨架冒烟、DoD 逐项核销草稿、灰度方案、反馈汇总 |
| **用户** | DoD 核销确认、灰度放量决策、全量上线决策、缺陷处理决定 |

## 关联最佳实践

- **Task 模式**（`.agent-workplace/modes/task.md`）：验收清单勾选核销（DoD）
- 产出物 schema：5.4 迭代验收 Checklist

## 输出

```json
{
  "status": "passed | blocked | rolled_back",
  "dod": {
    "functional": true,
    "targeted_tests": true,
    "regression": true,
    "docs_synced": true,
    "change_archived": true
  },
  "gray_release": {
    "traffic_percent": 10,
    "metrics": { "pass_rate": 99.5, "error_rate": 0.2 },
    "decision": "full_release | rollback"
  },
  "defects": []
}
```

## 下一步

验收通过 → 灰度 → 全量（上线）→ 进入 `fst-iterate` 的回顾闭环（N8）或排下轮迭代。
