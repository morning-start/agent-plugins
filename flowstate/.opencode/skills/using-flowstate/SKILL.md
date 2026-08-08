---
name: using-flowstate
description: Use when a project needs flowstate's development workflow — starting a new project, planning an iteration, handling requirement changes, or accepting/releasing work. Routes to the right fst-* skill based on the situation (entry point for pi/oh-my-pi/opencode bootstraps).
---

# using-flowstate — 入口路由

flowstate 把项目开发全流程建模为可执行状态图（N1~N9）。按当前场景选择技能：

| 场景 | 技能 | 管哪些节点 |
|------|------|-----------|
| 新项目启动、需求模糊、"做个 X" | `fst-init` | N1 立项 / N2 冻结 / N3 设计 |
| 任何新需求/改动（口头/IM/邮件）、线上事故 | `fst-change` | N5 变更 / N9 紧急 |
| 迭代完成、变更落地后、准备上线 | `fst-review` | N6 测试 / N7 灰度 |
| 迭代开始、迭代回顾、下轮排期 | `fst-iterate` | N4 开发 / N8 持续迭代 |

## 路由规则

- 新项目/需求模糊 → `fst-init`
- 迭代中任何变更 → `fst-change`
- 验收/上线前 → `fst-review`
- 开发/回顾 → `fst-iterate`
- 拿不准 → 先 `fst-init` 锁底线，再按流转判据路由

## 核心原则（贯穿所有技能）

- **不追求一次性需求完备，只守住核心底线**
- **所有变更可追溯、可评估、不烂尾**
- **小步快跑、动态补全**；拒绝代码硬编排，图是逻辑蓝图，由 Agent 框架动态软编排驱动
