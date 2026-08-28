# Flowstate skill graph

> 技能关系唯一权威说明：`using-fst` 负责入口路由；各技能 frontmatter 的关系字段是机器可读摘要。

## 分层

| 层 | 技能 | 所有权 |
|---|---|---|
| 入口 | `using-fst` | 识别场景，选择唯一首技能；不执行流程 |
| 生命周期 | `fst-init`, `fst-change`, `fst-iterate`, `fst-review` | 立项、变更、执行、验收 |
| 横切能力 | `fst-workplace`, `fst-research`, `fst-promote` | 落点、证据、定稿；被生命周期技能调用 |

## 主流程

```text
using-fst -> fst-init -> fst-iterate -> fst-review -> fst-iterate
using-fst -> fst-change -> fst-iterate
fst-change(N9) -> fst-review
所有技能 -> fst-workplace
需要证据 -> fst-research -> 调用方
REVIEW_NEEDED -> fst-promote -> docs/
```

## 边契约

| 边 | 前置条件 | 交接产物 |
|---|---|---|
| init → iterate | 底线确认、范围签署、设计评审通过 | 范围说明书、需求分层、风险清单 |
| change → iterate | CR 归档、排期确认 | 变更单、影响评估 |
| iterate → review | 批次 Gate 通过、功能完成 | 可测功能、tasks、技术债 |
| review → iterate | DoD 完成或形成回顾项 | DoD、灰度决策、回顾报告 |
| change(N9) → review | 热修复完成、24 小时内补录 | checkpoint、补录 CR |
| any → promote | `REVIEW_NEEDED`、置信度 ≥ 0.8、HITL 同意 | 定稿文档、来源信息 |

## 禁止越权

- `fst-change` 不实现代码；实现只经过 `fst-iterate`。
- `fst-review` 不替代 `fst-iterate` 开发；失败回退并产生回顾项。
- `fst-promote` 不判断内容正确性，只执行校验和 HITL 闸门。
- `fst-workplace` 不驱动生命周期；`fst-research` 不替调用方冻结范围或发布。
- 过程态必须经 `fst-workplace`，定稿必须经 `fst-promote`。

## 选择规则

1. 先由 `using-fst` 选唯一首技能。
2. 横切技能只回传产物，不改变生命周期所有权。
3. 边前置条件不满足时停留并补齐，不得猜测流转。
4. 多场景请求按阻断性排序：事故/缺陷 → `fst-change`；范围不清 → `fst-init`；否则按当前迭代状态继续。
